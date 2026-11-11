"""
Tests for API comparison endpoint — PPOR vs rentvesting.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _comparison_payload(**overrides):
    """Build a comparison request payload with sensible defaults."""
    payload = {
        "tax_profile": {
            "taxable_income": 100_000,
            "repayment_income": 100_000,
            "mls_income": 100_000,
            "hecs_balance": 0,
            "has_private_health": True,
            "income_growth_rate": 0.03,
        },
        "property": {
            "purchase_price": 500_000,
            "purchase_date": "2020-01-15",
            "is_new_property": False,
            "is_ppor": False,
            "annual_appreciation": 0.05,
            "rental": {
                "weekly_rent": 450,
                "annual_growth_rate": 0.03,
                "vacancy_weeks": 2,
            },
            "depreciable_buildings": [
                {
                    "name": "Main building",
                    "construction_cost": 250_000,
                    "purchase_date": "2020-01-15",
                    "construction_start_date": "2019-01-01",
                }
            ],
        },
        "loan": {
            "deposit": 100_000,
            "annual_rate": 0.06,
            "loan_term_years": 30,
        },
        "ongoing_costs": {
            "council_rates": 2_000,
            "water_rates": 1_200,
            "building_insurance": 1_500,
            "landlord_insurance": 1_000,
            "management_rate": 0.08,
        },
        "weekly_rent_paid": 500,
        "annual_rent_paid_growth": 0.03,
        "projection_years": 5,
    }
    payload.update(overrides)
    return payload


# ──────────────────────────────────────────────
# POST /api/comparison — Structure
# ──────────────────────────────────────────────


class TestComparisonEndpointStructure:
    """Tests for comparison endpoint response structure."""

    def test_returns_200(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        assert resp.status_code == 200

    def test_has_ppor_result(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert "ppor" in data
        assert data["ppor"]["scenario"] == "ppor"

    def test_has_rentvest_result(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert "rentvest" in data
        assert data["rentvest"]["scenario"] == "rentvesting"

    def test_has_winner(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert data["winner"] in ("ppor", "rentvesting")

    def test_has_difference(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert data["difference"] >= 0

    def test_has_break_even_year(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert "break_even_year" in data
        assert data["break_even_year"] is None or isinstance(data["break_even_year"], int)

    def test_has_by_year(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert "by_year" in data
        assert isinstance(data["by_year"], list)

    def test_by_year_length_matches_projection(self):
        resp = client.post("/api/comparison", json=_comparison_payload(projection_years=10))
        data = resp.json()
        assert len(data["by_year"]) == 10

    def test_ppor_years_length_matches_projection(self):
        resp = client.post("/api/comparison", json=_comparison_payload(projection_years=7))
        data = resp.json()
        assert len(data["ppor"]["years"]) == 7

    def test_rentvest_years_length_matches_projection(self):
        resp = client.post("/api/comparison", json=_comparison_payload(projection_years=7))
        data = resp.json()
        assert len(data["rentvest"]["years"]) == 7

    def test_rentvest_has_cgt(self):
        resp = client.post("/api/comparison", json=_comparison_payload())
        data = resp.json()
        assert "cgt" in data["rentvest"]
        assert "cgt_payable" in data["rentvest"]["cgt"]

    def test_net_wealth_series_lengths_match_projection(self):
        data = client.post("/api/comparison", json=_comparison_payload(projection_years=10)).json()
        assert len(data["ppor_net_wealth"]) == 10
        assert len(data["rentvest_net_wealth"]) == 10

    def test_by_year_is_difference_of_net_wealth_series(self):
        data = client.post("/api/comparison", json=_comparison_payload()).json()
        for delta, ppor, rentvest in zip(data["by_year"], data["ppor_net_wealth"], data["rentvest_net_wealth"]):
            assert delta == pytest.approx(ppor - rentvest)

    def test_net_wealth_series_match_year_rows(self):
        data = client.post("/api/comparison", json=_comparison_payload()).json()
        for wealth, year in zip(data["ppor_net_wealth"], data["ppor"]["years"]):
            assert wealth == pytest.approx(year["net_wealth"])
        for wealth, year in zip(data["rentvest_net_wealth"], data["rentvest"]["years"]):
            assert wealth == pytest.approx(year["net_wealth"] - year["cgt_if_sold"])

    def test_final_year_cgt_matches_projection_cgt(self):
        data = client.post("/api/comparison", json=_comparison_payload()).json()
        assert data["rentvest"]["years"][-1]["cgt_if_sold"] == pytest.approx(data["rentvest"]["cgt"]["cgt_payable"])


# ──────────────────────────────────────────────
# POST /api/comparison — Scenarios
# ──────────────────────────────────────────────


class TestComparisonEndpointScenarios:
    """Tests for different scenario outcomes via the API."""

    def test_ppor_wins_no_rental_yield(self):
        """Zero rental income should favour PPOR."""
        payload = _comparison_payload()
        payload["property"]["rental"] = {
            "weekly_rent": 0,
            "annual_growth_rate": 0.03,
            "vacancy_weeks": 2,
        }
        payload["property"].pop("depreciable_buildings", None)
        payload["ongoing_costs"]["landlord_insurance"] = 0
        payload["ongoing_costs"]["management_rate"] = 0.0
        payload["weekly_rent_paid"] = 600
        payload["projection_years"] = 10
        resp = client.post("/api/comparison", json=payload)
        data = resp.json()
        assert data["winner"] == "ppor"

    def test_different_projection_years(self):
        """Should handle various projection lengths."""
        for years in [1, 3, 10]:
            resp = client.post("/api/comparison", json=_comparison_payload(projection_years=years))
            assert resp.status_code == 200
            data = resp.json()
            assert len(data["by_year"]) == years


# ──────────────────────────────────────────────
# POST /api/comparison — Consistency
# ──────────────────────────────────────────────


class TestComparisonEndpointConsistency:
    """Tests for consistency between comparison and individual endpoints."""

    def test_ppor_summary_matches_standalone(self):
        """PPOR result in comparison should match standalone PPOR endpoint."""
        payload = _comparison_payload()

        # Run comparison
        comp_resp = client.post("/api/comparison", json=payload)
        comp_ppor = comp_resp.json()["ppor"]

        # Run standalone PPOR
        ppor_payload = {
            "tax_profile": payload["tax_profile"],
            "property": {**payload["property"], "is_ppor": True},
            "loan": payload["loan"],
            "ongoing_costs": {
                "council_rates": payload["ongoing_costs"]["council_rates"],
                "water_rates": payload["ongoing_costs"]["water_rates"],
                "building_insurance": payload["ongoing_costs"]["building_insurance"],
            },
            "projection_years": payload["projection_years"],
        }
        ppor_resp = client.post("/api/cashflow/ppor", json=ppor_payload)
        standalone_ppor = ppor_resp.json()

        assert comp_ppor["summary"]["net_wealth"] == pytest.approx(standalone_ppor["summary"]["net_wealth"], abs=1)
