"""Independent Sparkle analytics and durable creative-task service."""
from __future__ import annotations

import os
from pathlib import Path

from .core import ApiError, Store, configuration, create_server, object_value, text
from .creative import performance, plan_brief


class SparkleService:
    max_body = 1_000_000
    rate_limit = 120

    def __init__(self, token, database, origins=()):
        self.token, self.origins = token, origins
        self.store = Store(database)

    def health(self):
        return {"ready": bool(self.token), "service": "sparkle-python"}

    def create_job(self, body):
        ident = text(body.get("requestId"), "requestId", 128)
        kind = body.get("kind")
        if kind not in ("brief", "performance"):
            raise ApiError(400, "Supported job kinds: brief, performance.")
        inputs = object_value(body.get("input"))
        # Validate before storing. No provider calls, media downloads or ad spending.
        (plan_brief if kind == "brief" else performance)(inputs)
        document = {"kind": kind, "input": inputs, "state": "queued", "result": None}
        try:
            return self.store.put("jobs", ident, document, 0)
        except ApiError as error:
            if error.status != 409:
                raise
            current = self.store.get("jobs", ident)
            if current["data"]["kind"] != kind or current["data"]["input"] != inputs:
                raise ApiError(409, "requestId is already used for a different job.")
            return current

    def run_job(self, body):
        ident = text(body.get("id"), "id", 128)
        current = self.store.get("jobs", ident)
        if current["revision"] != body.get("revision"):
            raise ApiError(409, "Revision conflict.")
        job = current["data"]
        if job["state"] != "queued":
            raise ApiError(409, "Only queued jobs can run.")
        running = self.store.put("jobs", ident, {**job, "state": "running"}, current["revision"])
        try:
            result = (plan_brief if job["kind"] == "brief" else performance)(job["input"])
        except Exception:
            self.store.put("jobs", ident, {**job, "state": "failed"}, running["revision"])
            raise
        return self.store.put("jobs", ident, {**job, "state": "completed", "result": result},
                              running["revision"])

    def transition(self, body, action):
        ident = text(body.get("id"), "id", 128)
        current = self.store.get("jobs", ident)
        if current["revision"] != body.get("revision"):
            raise ApiError(409, "Revision conflict.")
        job = current["data"]
        if action == "cancel":
            if job["state"] != "queued":
                raise ApiError(409, "Only queued jobs can be canceled.")
            updated = {**job, "state": "canceled"}
        else:
            # Operators may recover interrupted, deterministic local computations.
            if job["state"] not in ("failed", "running"):
                raise ApiError(409, "Only failed or interrupted jobs can be recovered.")
            updated = {**job, "state": "queued", "result": None}
        return self.store.put("jobs", ident, updated, current["revision"])

    def route(self, method, path, body):
        if method == "POST" and path == "/v1/briefs":
            return 200, plan_brief(body)
        if method == "POST" and path == "/v1/performance":
            return 200, performance(body)
        if method == "POST" and path == "/v1/jobs":
            return 200, self.create_job(body)
        if method == "GET" and path.startswith("/v1/jobs/"):
            return 200, self.store.get("jobs", text(path.split("/")[-1], "id", 128))
        if method == "POST" and path == "/v1/jobs/run":
            return 200, self.run_job(body)
        if method == "POST" and path in ("/v1/jobs/cancel", "/v1/jobs/recover"):
            return 200, self.transition(body, path.split("/")[-1])
        raise ApiError(404, "Not found")


def main():
    app = SparkleService(
        **configuration("SPARKLE"),
        database=os.getenv("SPARKLE_PYTHON_DATABASE", str(Path(__file__).parent / "data" / "sparkle.sqlite3")),
    )
    server = create_server(app, os.getenv("SPARKLE_PYTHON_HOST", "127.0.0.1"),
                           int(os.getenv("SPARKLE_PYTHON_PORT", "8790")))
    print("Sparkle Python backend listening on %s:%s" % server.server_address)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
