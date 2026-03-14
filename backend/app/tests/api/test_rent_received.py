"""
Tests for API rent-received endpoint.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestRentReceivedEstimate:
    """POST /api/rental/rent-received"""

    def _post(self, **overrides):
        payload = {
            "weekly_rent": 500,
            "annual_growth_rate": 0.05,
            "vacancy_rate": 0.05,
            "projection_years": 10,
            **overrides,
        }
        return client.post("/api/rental/rent-received", json=payload)

    # ── Status codes ───────────────────────────────────────────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_get_returns_405(self):
        res = client.get("/api/rental/rent-received")
        assert res.status_code == 405

    def test_empty_body_returns_200(self):
        """All fields have defaults, so an empty body is valid."""
        res = client.post("/api/rental/rent-received", json={})
        assert res.status_code == 200

    # ── Response shape ─────────────────────────────────────────────────

    def test_response_has_top_level_fields(self):
        data = self._post().json()
        expected = {"gross_rental_income", "effective_rental_income", "projections"}
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
        expected = {"year", "weekly_rent", "gross_rental_income", "effective_rental_income"}
        assert set(entry.keys()) == expected

    # ── Data types ─────────────────────────────────────────────────────

    def test_gross_rental_income_is_float(self):
        data = self._post().json()
        assert isinstance(data["gross_rental_income"], (int, float))

    def test_effective_rental_income_is_float(self):
        data = self._post().json()
        assert isinstance(data["effective_rental_income"], (int, float))

    def test_projection_year_is_int(self):
        data = self._post(projection_years=1).json()
        assert isinstance(data["projections"][0]["year"], int)

    def test_projection_weekly_rent_is_float(self):
        data = self._post(projection_years=1).json()
        assert isinstance(data["projections"][0]["weekly_rent"], (int, float))

    # ── Year numbering ─────────────────────────────────────────────────

    def test_years_start_at_zero(self):
        data = self._post(projection_years=3).json()
        assert data["projections"][0]["year"] == 0

    def test_years_are_sequential(self):
        data = self._post(projection_years=5).json()
        years = [p["year"] for p in data["projections"]]
        assert years == [0, 1, 2, 3, 4]

    # ── Top-level summary matches year 1 ───────────────────────────────

    def test_gross_rental_income_is_year_one(self):
        data = self._post().json()
        assert data["gross_rental_income"] == data["projections"][0]["gross_rental_income"]

    def test_effective_rental_income_is_year_one(self):
        data = self._post().json()
        assert data["effective_rental_income"] == data["projections"][0]["effective_rental_income"]

    # ── Gross rental income calculations ───────────────────────────────

    def test_gross_income_basic(self):
        """$500/week * 52 = $26,000."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=1).json()
        assert data["gross_rental_income"] == pytest.approx(26_000.0)

    def test_gross_income_year_two_with_growth(self):
        """Year 2 at 5%: 500 * 52 * 1.05 = 27,300."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=2).json()
        assert data["projections"][1]["gross_rental_income"] == pytest.approx(27_300.0)

    def test_gross_income_year_three_with_growth(self):
        """Year 3 at 5%: 500 * 52 * 1.05^2 = 28,665."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=3).json()
        assert data["projections"][2]["gross_rental_income"] == pytest.approx(28_665.0)

    # ── Effective rental income (vacancy) ──────────────────────────────

    def test_effective_equals_gross_with_no_vacancy(self):
        data = self._post(weekly_rent=500, vacancy_rate=0.0, projection_years=1).json()
        assert data["effective_rental_income"] == data["gross_rental_income"]

    def test_effective_zero_with_full_vacancy(self):
        data = self._post(weekly_rent=500, vacancy_rate=1.0, projection_years=1).json()
        assert data["effective_rental_income"] == 0.0

    def test_effective_reduced_by_vacancy(self):
        """5% vacancy: effective = gross * 0.95."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, vacancy_rate=0.05, projection_years=1).json()
        assert data["effective_rental_income"] == pytest.approx(26_000.0 * 0.95)

    def test_effective_ten_percent_vacancy(self):
        """10% vacancy on $600/week: 600 * 52 * 0.90 = 28,080."""
        data = self._post(weekly_rent=600, annual_growth_rate=0.0, vacancy_rate=0.10, projection_years=1).json()
        assert data["effective_rental_income"] == pytest.approx(28_080.0)

    def test_effective_less_than_or_equal_gross(self):
        """Effective should never exceed gross."""
        data = self._post(projection_years=5).json()
        for p in data["projections"]:
            assert p["effective_rental_income"] <= p["gross_rental_income"]

    # ── Vacancy with growth ────────────────────────────────────────────

    def test_vacancy_with_growth_year_two(self):
        """Year 2, 5% growth, 5% vacancy: 500 * 52 * 1.05 * 0.95."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, vacancy_rate=0.05, projection_years=2).json()
        expected = 500 * 52 * 1.05 * 0.95
        assert data["projections"][1]["effective_rental_income"] == pytest.approx(expected)

    def test_vacancy_with_growth_year_five(self):
        """Year 5, 3% growth, 8% vacancy: 700 * 52 * 1.03^4 * 0.92."""
        data = self._post(weekly_rent=700, annual_growth_rate=0.03, vacancy_rate=0.08, projection_years=5).json()
        expected = 700 * 52 * (1.03 ** 4) * 0.92
        assert data["projections"][4]["effective_rental_income"] == pytest.approx(expected)

    def test_vacancy_applied_to_grown_gross(self):
        """Vacancy should apply to the compounded gross, not the base."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, vacancy_rate=0.10, projection_years=3).json()
        p = data["projections"][2]
        assert p["effective_rental_income"] == pytest.approx(p["gross_rental_income"] * 0.90)

    # ── Weekly rent in projections ─────────────────────────────────────

    def test_weekly_rent_year_one_matches_input(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=1).json()
        assert data["projections"][0]["weekly_rent"] == pytest.approx(500.0)

    def test_weekly_rent_grows_with_rate(self):
        """Year 2 at 5%: 500 * 1.05 = 525."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=2).json()
        assert data["projections"][1]["weekly_rent"] == pytest.approx(525.0)

    def test_weekly_rent_year_three(self):
        """Year 3 at 5%: 500 * 1.05^2 = 551.25."""
        data = self._post(weekly_rent=500, annual_growth_rate=0.05, projection_years=3).json()
        assert data["projections"][2]["weekly_rent"] == pytest.approx(551.25)

    # ── Compound growth ────────────────────────────────────────────────

    def test_gross_growth_compounds_not_linear(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.10, vacancy_rate=0.0, projection_years=3).json()
        p = data["projections"]
        increase_y2 = p[1]["gross_rental_income"] - p[0]["gross_rental_income"]
        increase_y3 = p[2]["gross_rental_income"] - p[1]["gross_rental_income"]
        assert increase_y3 > increase_y2

    def test_effective_growth_compounds_not_linear(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.10, vacancy_rate=0.05, projection_years=3).json()
        p = data["projections"]
        increase_y2 = p[1]["effective_rental_income"] - p[0]["effective_rental_income"]
        increase_y3 = p[2]["effective_rental_income"] - p[1]["effective_rental_income"]
        assert increase_y3 > increase_y2

    # ── No growth ──────────────────────────────────────────────────────

    def test_no_growth_gross_stays_flat(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, vacancy_rate=0.0, projection_years=5).json()
        gross_values = [p["gross_rental_income"] for p in data["projections"]]
        assert all(v == pytest.approx(26_000.0) for v in gross_values)

    def test_no_growth_effective_stays_flat(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, vacancy_rate=0.05, projection_years=5).json()
        effective_values = [p["effective_rental_income"] for p in data["projections"]]
        assert all(v == pytest.approx(26_000.0 * 0.95) for v in effective_values)

    def test_no_growth_weekly_rent_constant(self):
        data = self._post(weekly_rent=500, annual_growth_rate=0.0, projection_years=5).json()
        weekly_values = [p["weekly_rent"] for p in data["projections"]]
        assert all(v == pytest.approx(500.0) for v in weekly_values)

    # ── Zero rent ──────────────────────────────────────────────────────

    def test_zero_rent_returns_zero_gross(self):
        data = self._post(weekly_rent=0, projection_years=1).json()
        assert data["gross_rental_income"] == 0.0

    def test_zero_rent_returns_zero_effective(self):
        data = self._post(weekly_rent=0, projection_years=1).json()
        assert data["effective_rental_income"] == 0.0

    def test_zero_rent_projections_all_zero(self):
        data = self._post(weekly_rent=0, projection_years=5).json()
        for p in data["projections"]:
            assert p["weekly_rent"] == 0.0
            assert p["gross_rental_income"] == 0.0
            assert p["effective_rental_income"] == 0.0

    # ── Known value end-to-end ─────────────────────────────────────────

    def test_known_value_three_years(self):
        """$600/week, 3% growth, 5% vacancy, 3 years."""
        data = self._post(weekly_rent=600, annual_growth_rate=0.03, vacancy_rate=0.05, projection_years=3).json()
        p = data["projections"]

        # Year 1: gross = 600 * 52 = 31,200 | effective = 31,200 * 0.95 = 29,640
        assert p[0]["gross_rental_income"] == pytest.approx(31_200.0)
        assert p[0]["effective_rental_income"] == pytest.approx(29_640.0)
        assert p[0]["weekly_rent"] == pytest.approx(600.0)

        # Year 2: gross = 31,200 * 1.03 = 32,136 | effective = 32,136 * 0.95 = 30,529.20
        assert p[1]["gross_rental_income"] == pytest.approx(32_136.0)
        assert p[1]["effective_rental_income"] == pytest.approx(30_529.20)
        assert p[1]["weekly_rent"] == pytest.approx(618.0)

        # Year 3: gross = 31,200 * 1.03^2 = 33,100.08 | effective = 33,100.08 * 0.95 = 31,445.076
        assert p[2]["gross_rental_income"] == pytest.approx(33_100.08)
        assert p[2]["effective_rental_income"] == pytest.approx(31_445.076)
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

    def test_negative_vacancy_rate_returns_422(self):
        res = self._post(vacancy_rate=-0.05)
        assert res.status_code == 422

    def test_vacancy_rate_above_one_returns_422(self):
        res = self._post(vacancy_rate=1.5)
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
        data = client.post("/api/rental/rent-received", json={}).json()
        assert len(data["projections"]) == 10

    def test_default_weekly_rent_is_zero(self):
        data = client.post("/api/rental/rent-received", json={}).json()
        assert data["gross_rental_income"] == 0.0

    def test_default_vacancy_rate_is_zero(self):
        """With default 0 vacancy, effective should equal gross."""
        data = client.post("/api/rental/rent-received", json={"weekly_rent": 500}).json()
        assert data["effective_rental_income"] == data["gross_rental_income"]
