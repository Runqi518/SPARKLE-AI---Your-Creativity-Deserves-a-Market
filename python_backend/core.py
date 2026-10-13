"""Personal-service HTTP and SQLite infrastructure (Python 3.9+)."""
from __future__ import annotations

import hmac
import json
import math
import os
import sqlite3
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


class ApiError(Exception):
    def __init__(self, status, message):
        self.status, self.message = status, message


def object_value(value):
    if not isinstance(value, dict):
        raise ApiError(400, "Expected a JSON object.")
    return value


def text(value, field, limit=4000):
    if not isinstance(value, str) or not value.strip() or len(value) > limit:
        raise ApiError(400, "Invalid " + field + ".")
    return value.strip()


def number(value, field, minimum=0, integer=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ApiError(400, "Invalid " + field + ".")
    if value > 1e15 or value < minimum or not math.isfinite(value) or (integer and int(value) != value):
        raise ApiError(400, "Invalid " + field + ".")
    return value


def decode(raw):
    def reject_constant(_value):
        raise ValueError("Non-finite JSON number")
    def finite_float(value):
        result = float(value)
        if not math.isfinite(result):
            raise ValueError("Non-finite JSON number")
        return result
    try:
        return object_value(json.loads(raw, parse_constant=reject_constant, parse_float=finite_float))
    except (ValueError, UnicodeDecodeError):
        raise ApiError(400, "Invalid JSON.")


class Store:
    """Isolated document persistence with atomic optimistic concurrency."""
    def __init__(self, path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("""CREATE TABLE IF NOT EXISTS records (
                namespace TEXT NOT NULL, id TEXT NOT NULL,
                revision INTEGER NOT NULL, body TEXT NOT NULL,
                PRIMARY KEY(namespace, id))""")

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()

    def get(self, namespace, ident):
        with self.connect() as db:
            row = db.execute(
                "SELECT revision, body FROM records WHERE namespace=? AND id=?",
                (namespace, ident),
            ).fetchone()
        if row is None:
            raise ApiError(404, "Record not found.")
        return {"id": ident, "revision": row["revision"], "data": json.loads(row["body"])}

    def put(self, namespace, ident, body, revision):
        text(ident, "id", 128)
        number(revision, "revision", integer=True)
        encoded = json.dumps(body, ensure_ascii=False, allow_nan=False)
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT revision FROM records WHERE namespace=? AND id=?",
                (namespace, ident),
            ).fetchone()
            current = row["revision"] if row else 0
            if current != revision:
                raise ApiError(409, "Revision conflict. Read the latest record first.")
            db.execute(
                "INSERT OR REPLACE INTO records VALUES (?, ?, ?, ?)",
                (namespace, ident, current + 1, encoded),
            )
        return {"id": ident, "revision": current + 1, "data": body}

    def delete(self, namespace, ident, revision):
        number(revision, "revision", integer=True)
        with self.connect() as db:
            cursor = db.execute(
                "DELETE FROM records WHERE namespace=? AND id=? AND revision=?",
                (namespace, ident, revision),
            )
            if cursor.rowcount != 1:
                raise ApiError(409, "Record missing or revision conflict.")
        return {"deleted": True}


def create_server(application, host="127.0.0.1", port=0):
    """Bounded JSON requests, exact-origin CORS, token auth and global throttling."""
    if not application.token:
        raise ValueError("Set a nonempty service token before starting.")
    lock = threading.Lock()
    rate = [time.monotonic(), 0]

    class Handler(BaseHTTPRequestHandler):
        server_version = "PythonBackend/1"
        timeout = 15

        def log_message(self, *_args):
            # Contact text, credentials and request paths are never logged.
            pass

        def send_json(self, status, body):
            encoded = json.dumps(body, ensure_ascii=False, allow_nan=False).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.send_header("Cache-Control", "no-store")
            self.send_header("X-Content-Type-Options", "nosniff")
            origin = self.headers.get("Origin")
            if origin in application.origins:
                self.send_header("Access-Control-Allow-Origin", origin)
                self.send_header("Vary", "Origin")
            self.end_headers()
            self.wfile.write(encoded)

        def do_OPTIONS(self):
            origin = self.headers.get("Origin")
            if not origin or origin not in application.origins:
                return self.send_json(403, {"error": "Origin not allowed."})
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
            self.send_header("Access-Control-Allow-Headers", "Authorization,Content-Type")
            self.send_header("Access-Control-Allow-Methods", "POST,GET,OPTIONS")
            self.send_header("Content-Length", "0")
            self.end_headers()

        def do_GET(self):
            self.dispatch()

        def do_POST(self):
            self.dispatch()

        def dispatch(self):
            try:
                origin = self.headers.get("Origin")
                if origin and origin not in application.origins:
                    raise ApiError(403, "Origin not allowed.")
                path = urlsplit(self.path).path
                if self.command == "GET" and path == "/health":
                    return self.send_json(200, application.health())
                expected = ("Bearer " + application.token).encode()
                supplied = self.headers.get("Authorization", "").encode()
                if not hmac.compare_digest(supplied, expected):
                    raise ApiError(401, "Check your service access token.")
                with lock:
                    now = time.monotonic()
                    if now - rate[0] >= 60:
                        rate[:] = [now, 0]
                    rate[1] += 1
                    if rate[1] > application.rate_limit:
                        raise ApiError(429, "Please wait a minute before trying again.")
                body = None
                if self.command == "POST":
                    if self.headers.get("Transfer-Encoding"):
                        raise ApiError(400, "Transfer-Encoding is not supported.")
                    try:
                        length = int(self.headers.get("Content-Length", "0"))
                    except ValueError:
                        raise ApiError(400, "Invalid Content-Length.")
                    if length < 1:
                        raise ApiError(400, "A JSON request body is required.")
                    if length > application.max_body:
                        raise ApiError(413, "Message is too large.")
                    if self.headers.get("Content-Type", "").split(";")[0].lower() != "application/json":
                        raise ApiError(415, "Use application/json.")
                    raw = self.rfile.read(length)
                    if len(raw) != length:
                        raise ApiError(400, "Incomplete request body.")
                    body = decode(raw)
                status, result = application.route(self.command, path, body)
                self.send_json(status, result)
            except ApiError as error:
                self.send_json(error.status, {"error": error.message})
            except (TimeoutError, ConnectionError):
                self.send_json(504, {"error": "Request timed out."})
            except Exception:
                self.send_json(500, {"error": "Service could not finish the request."})

    return ThreadingHTTPServer((host, port), Handler)


def configuration(prefix):
    return {
        "token": os.getenv(prefix + "_API_TOKEN", ""),
        "origins": tuple(x.strip() for x in os.getenv(prefix + "_ALLOWED_ORIGINS", "").split(",") if x.strip()),
    }
