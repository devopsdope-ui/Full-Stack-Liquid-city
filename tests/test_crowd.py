import pytest

from app.utils.calculations import calculate_crowd_status, calculate_occupancy, calculate_risk


def test_calculate_crowd_status_buckets():
    assert calculate_crowd_status(10) == "NORMAL"
    assert calculate_crowd_status(65) == "MODERATE"
    assert calculate_crowd_status(85) == "HIGH"
    assert calculate_crowd_status(95) == "CRITICAL"


def test_calculate_occupancy_basic():
    assert calculate_occupancy(41000, 50000) == pytest.approx(82.0)


def test_calculate_occupancy_invalid_capacity():
    with pytest.raises(ValueError):
        calculate_occupancy(10, 0)


def test_calculate_occupancy_negative_current():
    with pytest.raises(ValueError):
        calculate_occupancy(-5, 100)


def test_calculate_occupancy_over_capacity():
    with pytest.raises(ValueError):
        calculate_occupancy(150, 100)


def test_calculate_risk_rising_trend_bumps_risk():
    # Same current level, but one is rising fast -> should be riskier or equal.
    stable = calculate_risk(current_percentage=70, predicted_percentage=71)
    rising = calculate_risk(current_percentage=70, predicted_percentage=88)
    order = ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert order.index(rising) >= order.index(stable)


def test_calculate_risk_falling_trend_not_bumped():
    # Venue at 100% but emptying should not be treated as rising risk.
    risk = calculate_risk(current_percentage=100, predicted_percentage=70)
    assert risk in ("LOW", "MODERATE", "HIGH")  # never bumped to worse than base bucket
