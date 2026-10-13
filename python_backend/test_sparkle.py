import tempfile
import unittest
from pathlib import Path

from .core import ApiError
from .creative import performance, plan_brief
from .service import SparkleService


class SparkleTests(unittest.TestCase):
    def test_brief_preserves_facts_and_formats(self):
        result = plan_brief({"product": "Camera", "audience": "Creators", "goal": "Demo",
                             "facts": ["Weather resistant"], "channels": ["tiktok", "square"]})
        self.assertEqual(result["deliverables"][0]["height"], 1920)
        self.assertEqual(result["deliverables"][1]["height"], 1080)
        self.assertEqual(result["brief"]["facts"], ["Weather resistant"])
        self.assertFalse(result["missingEvidence"])
        self.assertTrue(plan_brief({"product": "X", "audience": "Y", "goal": "Z"})["missingEvidence"])

    def test_performance_weighted_totals_and_zero_denominators(self):
        result = performance({"variants": [
            {"id": "a", "impressions": 100, "clicks": 10, "conversions": 2, "spend": 20, "revenue": 60},
            {"id": "b", "impressions": 900, "clicks": 9, "conversions": 1, "spend": 50},
            {"id": "c"},
        ]})
        self.assertAlmostEqual(result["totals"]["ctr"], 19 / 1000)
        self.assertEqual(result["ranking"], ["a", "b"])
        self.assertIsNone(result["variants"][2]["cpa"])
        self.assertIsNone(result["variants"][2]["roas"])

    def test_invalid_metrics(self):
        for row in (
            {"id": "a", "spend": -1},
            {"id": "a", "impressions": True},
            {"id": "a", "impressions": 1, "clicks": 2},
            {"id": "a", "spend": float("inf")},
        ):
            with self.assertRaises(ApiError):
                performance({"variants": [row]})

    def test_jobs_are_idempotent_durable_and_revision_protected(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "db"
            app = SparkleService("test", path)
            body = {"requestId": "one", "kind": "brief",
                    "input": {"product": "Camera", "audience": "Creators", "goal": "Demo"}}
            first = app.create_job(body)
            self.assertEqual(first, app.create_job(body))
            self.assertEqual(SparkleService("test", path).store.get("jobs", "one"), first)
            with self.assertRaises(ApiError):
                app.create_job({**body, "input": {**body["input"], "goal": "Different"}})
            completed = app.run_job({"id": "one", "revision": 1})
            self.assertEqual(completed["data"]["state"], "completed")
            self.assertEqual(completed["revision"], 3)
            with self.assertRaises(ApiError):
                app.run_job({"id": "one", "revision": 1})

    def test_cancel_and_recover(self):
        with tempfile.TemporaryDirectory() as folder:
            app = SparkleService("test", Path(folder) / "db")
            body = {"requestId": "one", "kind": "performance", "input": {"variants": [{"id": "a"}]}}
            queued = app.create_job(body)
            canceled = app.transition({"id": "one", "revision": queued["revision"]}, "cancel")
            self.assertEqual(canceled["data"]["state"], "canceled")
            with self.assertRaises(ApiError):
                app.run_job({"id": "one", "revision": canceled["revision"]})
            running = app.store.put("jobs", "one", {**canceled["data"], "state": "running"}, canceled["revision"])
            recovered = app.transition({"id": "one", "revision": running["revision"]}, "recover")
            self.assertEqual(recovered["data"]["state"], "queued")


if __name__ == "__main__":
    unittest.main()
