"""HTTP and persistence regression tests; never call paid providers."""
from __future__ import annotations

import json
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from http.client import HTTPConnection
from pathlib import Path

from .core import ApiError, Store, create_server
from .service import SparkleService


class StorageTests(unittest.TestCase):
    def test_persistence_conflict_and_deletion(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "test.sqlite3"
            first = Store(path)
            first.put("test", "one", {"value": 1}, 0)
            second = Store(path)
            self.assertEqual(second.get("test", "one")["data"], {"value": 1})
            with self.assertRaises(ApiError) as caught:
                second.put("test", "one", {"value": 2}, 0)
            self.assertEqual(caught.exception.status, 409)
            second.delete("test", "one", 1)
            with self.assertRaises(ApiError):
                first.get("test", "one")

    def test_concurrent_creation_has_one_winner(self):
        with tempfile.TemporaryDirectory() as folder:
            store = Store(Path(folder) / "db.sqlite3")
            def write(_):
                try:
                    store.put("test", "same", {}, 0)
                    return 200
                except ApiError as error:
                    return error.status
            with ThreadPoolExecutor(max_workers=4) as pool:
                outcomes = list(pool.map(write, range(4)))
            self.assertEqual(sorted(outcomes), [200, 409, 409, 409])


class HttpTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.app = SparkleService("test-token", Path(self.temp.name) / "db.sqlite3",
                           origins=("https://allowed.example",))
        self.server = create_server(self.app)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.thread.join()
        self.server.server_close()
        self.temp.cleanup()

    def request(self, method, path, body=None, headers=None):
        conn = HTTPConnection(*self.server.server_address, timeout=3)
        raw = json.dumps(body) if body is not None else None
        conn.request(method, path, raw, headers or {})
        response = conn.getresponse()
        result = response.read()
        status, returned_headers = response.status, dict(response.getheaders())
        conn.close()
        return status, json.loads(result) if result else None, returned_headers

    def test_auth_origin_and_preflight(self):
        self.assertEqual(self.request("GET", "/health")[0], 200)
        self.assertEqual(self.request("GET", "/private")[0], 401)
        self.assertEqual(self.request("GET", "/health", headers={"Origin": "https://bad.example"})[0], 403)
        status, _, headers = self.request("OPTIONS", "/v1/jobs",
                                          headers={"Origin": "https://allowed.example"})
        self.assertEqual(status, 204)
        self.assertEqual(headers["Access-Control-Allow-Origin"], "https://allowed.example")
        self.assertEqual(self.request("GET", "/missing", headers={"Authorization": "Bearer test-token"})[0], 404)

    def test_limits_and_content_type(self):
        auth = {"Authorization": "Bearer test-token"}
        self.assertEqual(self.request("POST", "/missing", {}, auth)[0], 415)
        auth["Content-Type"] = "application/json"
        self.assertEqual(self.request("POST", "/missing", ["wrong shape"], auth)[0], 400)
        self.app.max_body = 100
        self.assertEqual(self.request("POST", "/missing", {"text": "a" * 200}, auth)[0], 413)
        self.app.rate_limit = 1
        self.assertEqual(self.request("GET", "/missing", headers=auth)[0], 429)

    def test_malformed_json_is_400(self):
        conn = HTTPConnection(*self.server.server_address, timeout=3)
        conn.request("POST", "/missing", "{bad", {
            "Authorization": "Bearer test-token", "Content-Type": "application/json"})
        response = conn.getresponse()
        self.assertEqual(response.status, 400)
        response.read()
        conn.close()

    def test_nonfinite_numbers_are_rejected(self):
        for raw in ('{"value":NaN}', '{"value":1e999}'):
            conn = HTTPConnection(*self.server.server_address, timeout=3)
            conn.request("POST", "/missing", raw, {
                "Authorization": "Bearer test-token", "Content-Type": "application/json"})
            response = conn.getresponse()
            self.assertEqual(response.status, 400)
            response.read()
            conn.close()

    def test_service_roundtrip(self):
        auth = {"Authorization": "Bearer test-token", "Content-Type": "application/json"}
        job = {"requestId": "one", "kind": "brief",
               "input": {"product": "Camera", "audience": "Creators", "goal": "Demo"}}
        status, saved, _ = self.request("POST", "/v1/jobs", job, auth)
        self.assertEqual(status, 200)
        self.assertEqual(saved["revision"], 1)
        status, completed, _ = self.request("POST", "/v1/jobs/run", {"id": "one", "revision": 1}, auth)
        self.assertEqual(status, 200)
        self.assertEqual(completed["data"]["state"], "completed")
        self.assertEqual(self.request("GET", "/v1/jobs/one", headers=auth)[1], completed)


if __name__ == "__main__":
    unittest.main()
