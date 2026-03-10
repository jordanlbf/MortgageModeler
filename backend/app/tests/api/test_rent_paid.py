"""
Tests for API rent-paid endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestRentPaidEstimate:
    """POST /api/rental/rent-paid"""

    def _post(self, **overrides):
        payload = {
            "weekly_rent": 500,
            "annual_growth_rate": 0.05,
            "projection_years": 10,
            **overrides,
        }
        return client.post("/api/rental/rent-paid", json=payload)

    # ── Status codes ───────────────────────────────────────────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_get_returns_405(self):
        res = client.get("/api/rental/rent-paid")
        assert res.status_code == 405

    def test_empty_body_returns_200(self):
        """All fields have defaults, so an empty body is valid."""
        res = client.post("/api/rental/rent-paid", json={})
        assert res.status_code == 200

    # ── Response shape ─────────────────────────────────────────────────

    def test_response_has_top_level_fields(self):
        data = self._post().json()
        expected = {"annual_rent_paid", "projections"}
        assert set(data.keys()) == expected

    def test_projections_is_list(self):
        data = self._post().json()
        assert isinstance(data["projections"], list)

    def test_projections_length_matches_projection_years(self):
        data = self._post(projection_years=5).json()
        assert len(data["projections"]) == 5

    def test_projection_entry_has_expected_fields(self):
        data = self._post(projection_years=1).json()
        entry = data["projections"][0]
        expected = {"year", "weekly_rent", "annual_rent_paid"}
        assert set(entry.keys()) == expected

    # ── Data types ─────────────────────────────────────────────────────

    def test_annual_rent_paid_is_float(self):
        data = self._post().json()
        assert isinstance(data["annual_rent_paid"], (int, float))

    def test_projection_year_is_int(self):
        data = self._post(projection_years=1).json()
        assert isinstance(data["projections"][0]["year"], int)

    def test_projection_weekly_rent_is_float(self):
        data = self._post(projection_years=1).json()
        assert isinstance(data["projections"][0]["weekly_rent"], (int, float))

    def test_projection_annual_rent_paid_is_float(self):
        data = self._post(projection_years=1).json()
        assert isinstance(data["projections"][0]["annual_rent_paid"], (int, float))

    # ── Year numbering ─────────────────────────────────────────────────

    def test_years_start_at_one(self):
        data = self._post(projection_years=3).json()
        assert data["projections"][0]["year"] == 1

    def test_years_are_sequential(self):
        data = self._post(projection_years=5).json()
        years = [p["year"] for p in data["projections"]]
        assert years == [1, 2, 3, 4, 5]

    # ── Annual rent paid (top-level) ───────────────────────────────────

    def test_annual_rent_paid_is_year_one_value(self):
        """Top-level annual_rent_paid should equal the first projection's value."""
        data = self._post().json()
        assert data["annual_rent_paid"] == data["projections"][0]["annual_rent_paid"]

    def test_annual_rent_paid_basic_calculation(self):
        """$500/week * 52 = $26,000."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=1).json()
        assert data["annual_rent_paid"] == pytest.approx(26_000.0)

    # ── Weekly rent in projections ─────────────────────────────────────

    def test_weekly_rent_year_one_matches_input(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=1).json()
        assert data["projections"][0]["weekly_rent"] == pytest.approx(500.0)

    def test_weekly_rent_grows_with_rate(self):
        """Year 2 weekly rent at 5% growth: 500 * 1.05 = 525."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=2).json()
        assert data["projections"][1]["weekly_rent"] == pytest.approx(525.0)

    def test_weekly_rent_year_three(self):
        """Year 3 weekly rent at 5% growth: 500 * 1.05^2 = 551.25."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=3).json()
        assert data["projections"][2]["weekly_rent"] == pytest.approx(551.25)

    # ── Compound growth on annual rent ─────────────────────────────────

    def test_annual_rent_grows_year_two(self):
        """Year 2 at 5%: 500 * 52 * 1.05 = 27,300."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=2).json()
        assert data["projections"][1]["annual_rent_paid"] == pytest.approx(27_300.0)

    def test_annual_rent_grows_year_three(self):
        """Year 3 at 5%: 500 * 52 * 1.05^2 = 28,665."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=3).json()
        assert data["projections"][2]["annual_rent_paid"] == pytest.approx(28_665.0)

    def test_growth_compounds_not_linear(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.10, projection_years=3).json()
        p = data["projections"]
        increase_y2 = p[1]["annual_rent_paid"] - p[0]["annual_rent_paid"]
        increase_y3 = p[2]["annual_rent_paid"] - p[1]["annual_rent_paid"]
        assert increase_y3 > increase_y2

    # ── No growth ──────────────────────────────────────────────────────

    def test_no_growth_all_years_equal(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=5).json()
        annual_values = [p["annual_rent_paid"] for p in data["projections"]]
        assert all(v == pytest.approx(26_000.0) for v in annual_values)

    def test_no_growth_weekly_rent_constant(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=5).json()
        weekly_values = [p["weekly_rent"] for p in data["projections"]]
        assert all(v == pytest.approx(500.0) for v in weekly_values)

    # ── Zero rent ──────────────────────────────────────────────────────

    def test_zero_rent_returns_zero_annual(self):
        data = self._post(weekly_rent=0, projection_years=1).json()
        assert data["annual_rent_paid"] == 0.0

    def test_zero_rent_projections_all_zero(self):
        data = self._post(weekly_rent=0, projection_years=5).json()
        for p in data["projections"]:
            assert p["weekly_rent"] == 0.0
            assert p["annual_rent_paid"] == 0.0

    # ── Known value end-to-end ─────────────────────────────────────────

    def test_known_value_three_years(self):
        """$600/week, 3% growth, 3 years."""
        data = self._post(weekly_rent=600, annual_growth_rate=0.03, projection_years=3).json()
        p = data["projections"]

        # Year 1: 600 * 52 = 31,200
        assert p[0]["annual_rent_paid"] == pytest.approx(31_200.0)
        assert p[0]["weekly_rent"] == pytest.approx(600.0)

        # Year 2: 600 * 52 * 1.03 = 32,136
        assert p[1]["annual_rent_paid"] == pytest.approx(32_136.0)
        assert p[1]["weekly_rent"] == pytest.approx(618.0)

        # Year 3: 600 * 52 * 1.03^2 = 33,100.08
        assert p[2]["annual_rent_paid"] == pytest.approx(33_100.08)
        assert p[2]["weekly_rent"] == pytest.approx(636.54)

    # ── Validation errors ──────────────────────────────────────────────

    def test_negative_weekly_rent_returns_422(self):
        res = self._post(weekly_rent=-100)
        assert res.status_code == 422

    def test_negative_growth_rate_returns_422(self):
        res = self._post(annual_growth_rate=-0.05)
        assert res.status_code == 422

    def test_growth_rate_above_one_returns_422(self):
        res = self._post(annual_growth_rate=1.5)
        assert res.status_code == 422

    def test_zero_projection_years_returns_422(self):
        res = self._post(projection_years=0)
        assert res.status_code == 422

    def test_negative_projection_years_returns_422(self):
        res = self._post(projection_years=-1)
        assert res.status_code == 422

    # ── Defaults ───────────────────────────────────────────────────────

    def test_default_projection_years(self):
        """Empty body should use DEFAULT_PROJECTION_YEARS (10)."""
        data = client.post("/api/rental/rent-paid", json={}).json()
        assert len(data["projections"]) == 10

    def test_default_weekly_rent_is_zero(self):
        data = client.post("/api/rental/rent-paid", json={}).json()
        assert data["annual_rent_paid"] == 0.0

    def test_default_growth_rate_is_zero(self):
        data = client.post("/api/rental/rent-paid", json={}).json()
        weekly_values = [p["weekly_rent"] for p in data["projections"]]
        assert all(v == 0.0 for v in weekly_values)
