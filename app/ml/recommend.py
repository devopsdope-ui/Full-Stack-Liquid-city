"""
Recommendation scoring interface.

The ML model here only produces a *score* per option. Ranking, tie-
breaking, and deciding what to do with visitor accept/reject/choice is
business logic that lives in app/services/recommendation_service.py -
NOT here. See project Rule 4.
"""

import os
import joblib
import pandas as pd

from app.ml.data_generator import PREFERENCE_ENCODING

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "recommendation_model.pkl")

_cache = None


class ModelNotTrainedError(RuntimeError):
    pass


def _load():
    global _cache
    if _cache is None:
        if not os.path.exists(MODEL_PATH):
            raise ModelNotTrainedError(
                "Recommendation model not found. Train it first with:\n"
                "    python -m app.ml.train_recommendation_model"
            )
        _cache = joblib.load(MODEL_PATH)
    return _cache


def score_option(
    occupancy: float,
    waiting_time: float,
    distance: float,
    rating: float,
    offer_discount: float,
    predicted_crowd: float,
    price_level: int,
    visitor_preference: str = "balanced",
) -> float:
    """Score a single option 0-100. Higher = better recommendation."""
    bundle = _load()
    model = bundle["model"]
    features = bundle["features"]

    pref_code = PREFERENCE_ENCODING.get(visitor_preference, 0)

    row = {
        "occupancy": occupancy,
        "waiting_time": waiting_time,
        "distance": distance,
        "rating": rating,
        "offer_discount": offer_discount,
        "predicted_crowd": predicted_crowd,
        "visitor_preference_code": pref_code,
        "price_level": price_level,
    }
    df = pd.DataFrame([row])[features]
    score = model.predict(df)[0]
    return float(max(0, min(100, score)))


def rank_options(options: list, visitor_preference: str = "balanced") -> list:
    """
    options: list of dicts, each with occupancy/waiting_time/distance/
    rating/offer_discount/predicted_crowd/price_level (+ id/name/type/etc.
    which are passed through untouched).

    Returns the same list of dicts with a "score" key added, sorted
    descending by score. If the model isn't trained yet, falls back to a
    simple rule-based score so the API still works end to end.
    """
    scored = []
    for opt in options:
        try:
            score = score_option(
                occupancy=opt["occupancy"],
                waiting_time=opt["waiting_time"],
                distance=opt["distance"],
                rating=opt["rating"],
                offer_discount=opt.get("offer_discount", opt.get("offer", 0)),
                predicted_crowd=opt.get("predicted_crowd", opt["occupancy"]),
                price_level=opt.get("price_level", 2),
                visitor_preference=visitor_preference,
            )
        except ModelNotTrainedError:
            score = _fallback_rule_based_score(opt)

        opt_out = dict(opt)
        opt_out["score"] = round(score, 2)
        scored.append(opt_out)

    return sorted(scored, key=lambda o: o["score"], reverse=True)


def _fallback_rule_based_score(opt: dict) -> float:
    """Simple, transparent fallback used only if the model .pkl is missing."""
    occupancy = opt["occupancy"]
    waiting_time = opt["waiting_time"]
    distance = opt["distance"]
    rating = opt.get("rating", 4.0)
    offer = opt.get("offer_discount", opt.get("offer", 0))

    score = (
        0.35 * (100 - occupancy)
        + 0.30 * (100 - min(waiting_time, 100))
        + 0.15 * (100 - min(distance, 10) * 10)
        + 0.10 * (rating / 5.0 * 100)
        + 0.10 * (min(offer, 200) / 200 * 100)
    )
    return max(0, min(100, score))
