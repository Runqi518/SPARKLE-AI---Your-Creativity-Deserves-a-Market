"""Deterministic campaign planning and measured ad-performance analysis."""
from __future__ import annotations

from .core import ApiError, number, object_value, text


FORMATS = {
    "instagram": {"width": 1080, "height": 1920, "safeArea": "Keep essential text away from screen edges."},
    "tiktok": {"width": 1080, "height": 1920, "safeArea": "Keep captions clear of platform controls."},
    "youtube": {"width": 1920, "height": 1080, "safeArea": "Keep the CTA visible in the central frame."},
    "square": {"width": 1080, "height": 1080, "safeArea": "Keep headline and product inside the central area."},
}


def plan_brief(body):
    body = object_value(body)
    product = text(body.get("product"), "product", 300)
    audience = text(body.get("audience"), "audience", 1000)
    goal = text(body.get("goal"), "goal", 1000)
    facts = body.get("facts", [])
    if not isinstance(facts, list) or len(facts) > 20:
        raise ApiError(400, "Provide at most 20 verified product facts.")
    facts = [text(fact, "fact", 500) for fact in facts]
    channels = body.get("channels", ["square"])
    if not isinstance(channels, list) or not channels or len(channels) > 4:
        raise ApiError(400, "Select one to four channels.")
    if any(not isinstance(channel, str) or channel not in FORMATS for channel in channels):
        raise ApiError(400, "Unsupported channel.")
    if len(set(channels)) != len(channels):
        raise ApiError(400, "Duplicate channel.")
    cta = text(body.get("cta", "Learn more"), "cta", 120)
    return {
        "source": "deterministic-planner",
        "brief": {"product": product, "audience": audience, "goal": goal, "facts": facts},
        "deliverables": [{
            "channel": channel, **FORMATS[channel],
            "sections": [
                {"role": "hook", "direction": "Introduce " + product + " for " + audience},
                {"role": "proof", "direction": facts[0] if facts else "Add verified product evidence before publishing."},
                {"role": "cta", "direction": cta},
            ],
            "reviewChecklist": ["Verify all claims against supplied facts.", "Review accessibility and text contrast.",
                                "Confirm media and music rights.", "Approve manually before publishing."],
        } for channel in channels],
        "missingEvidence": not bool(facts),
        "note": "This is a structured production plan, not generated media or an automatically published campaign.",
    }


def performance(body):
    body = object_value(body)
    rows = body.get("variants")
    if not isinstance(rows, list) or not rows or len(rows) > 1000:
        raise ApiError(400, "Provide between 1 and 1000 variants.")
    currency = text(body.get("currency", "USD"), "currency", 3).upper()
    if len(currency) != 3 or not currency.isascii() or not currency.isalpha():
        raise ApiError(400, "Use a three-letter currency code.")
    objective = body.get("objective", "conversions")
    if objective not in ("conversions", "clicks", "revenue"):
        raise ApiError(400, "Invalid objective.")
    ids, variants = set(), []
    totals = dict(impressions=0, clicks=0, conversions=0, spend=0, revenue=0)

    def metrics(values):
        return {
            "ctr": values["clicks"] / values["impressions"] if values["impressions"] else None,
            "conversionRate": values["conversions"] / values["clicks"] if values["clicks"] else None,
            "cpc": values["spend"] / values["clicks"] if values["clicks"] else None,
            "cpa": values["spend"] / values["conversions"] if values["conversions"] else None,
            "cpm": values["spend"] * 1000 / values["impressions"] if values["impressions"] else None,
            "roas": values["revenue"] / values["spend"] if values["spend"] else None,
        }

    for row in rows:
        object_value(row)
        ident = text(row.get("id"), "variant id", 128)
        if ident in ids:
            raise ApiError(400, "Duplicate variant id.")
        ids.add(ident)
        values = {field: number(row.get(field, 0), field, integer=field in ("impressions", "clicks", "conversions"))
                  for field in totals}
        if values["clicks"] > values["impressions"] or values["conversions"] > values["clicks"]:
            raise ApiError(400, "Use click-attributed conversions with clicks <= impressions and conversions <= clicks.")
        for field in totals:
            totals[field] += values[field]
        variants.append({"id": ident, **values, **metrics(values),
                         "lowSample": values["impressions"] < 1000 or values["clicks"] < 30})
    if objective == "conversions":
        eligible = [v for v in variants if v["cpa"] is not None and v["spend"] > 0]
        eligible.sort(key=lambda v: (v["cpa"], v["id"]))
    elif objective == "clicks":
        eligible = [v for v in variants if v["ctr"] is not None]
        eligible.sort(key=lambda v: (-v["ctr"], v["id"]))
    else:
        eligible = [v for v in variants if v["roas"] is not None]
        eligible.sort(key=lambda v: (-v["roas"], v["id"]))
    return {"currency": currency, "objective": objective, "variants": variants,
            "totals": {**totals, **metrics(totals)},
            "ranking": [v["id"] for v in eligible],
            "note": "Descriptive ranking only; it does not establish statistical significance or authorize ad spend."}
