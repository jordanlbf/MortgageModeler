"""
Tests for API Upfront Costs endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestUpfrontCostsEstimate:
    """POST /api/upfront-costs/estimate"""

    def _post(self, **overrides):
        payload = {
            "purchase_price": 500_000,
            "deposit": 100_000,
            "is_investment": False,
            "lmi_exempt": False,
            **overrides,
        }
        return client.post("/api/upfront-costs/estimate", json=payload)

    # ── Status and structure ──────────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_response_has_nested_structure(self):
        data = self._post().json()
        assert "purchase_costs" in data
        assert "borrowing_costs" in data
        assert "total" in data
        assert "lvr" in data

    def test_purchase_costs_has_all_fields(self):
        data = self._post().json()["purchase_costs"]
        expected = {"stamp_duty", "legal_fees", "building_pest_inspection", "registration_fee", "other_costs", "total"}
        assert set(data.keys()) == expected

    def test_borrowing_costs_has_all_fields(self):
        data = self._post().json()["borrowing_costs"]
        expected = {"lmi", "mortgage_registration_fee", "loan_establishment_fee", "total"}
        assert set(data.keys()) == expected

    # ── LVR ───────────────────────────────────

    def test_lvr_calculated_correctly(self):
        data = self._post(purchase_price=500_000, deposit=100_000).json()
        assert data["lvr"] == pytest.approx(0.80, abs=0.001)

    def test_lvr_with_small_deposit(self):
        data = self._post(purchase_price=500_000, deposit=25_000).json()
        assert data["lvr"] == pytest.approx(0.95, abs=0.001)

    # ── LMI ───────────────────────────────────

    def test_no_lmi_at_80_lvr(self):
        data = self._post(purchase_price=500_000, deposit=100_000).json()
        assert data["borrowing_costs"]["lmi"] == 0.0

    def test_lmi_triggered_above_80(self):
        data = self._post(purchase_price=500_000, deposit=50_000).json()
        assert data["borrowing_costs"]["lmi"] > 0

    def test_lmi_waived_with_explicit_zero(self):
        """Setting lmi=0 explicitly waives LMI regardless of LVR."""
        data = self._post(purchase_price=500_000, deposit=25_000, lmi=0.0).json()
        assert data["borrowing_costs"]["lmi"] == 0.0

    def test_lmi_waived_reduces_total(self):
        with_lmi = self._post(purchase_price=500_000, deposit=25_000).json()
        without_lmi = self._post(purchase_price=500_000, deposit=25_000, lmi=0.0).json()
        assert with_lmi["total"] > without_lmi["total"]

    # ── Investment vs PPOR ────────────────────

    def test_investment_higher_stamp_duty(self):
        inv = self._post(is_investment=True).json()
        ppor = self._post(is_investment=False).json()
        assert inv["purchase_costs"]["stamp_duty"] > ppor["purchase_costs"]["stamp_duty"]

    def test_investment_higher_total(self):
        inv = self._post(purchase_price=500_000, deposit=50_000, is_investment=True).json()
        ppor = self._post(purchase_price=500_000, deposit=50_000, is_investment=False).json()
        assert inv["total"] > ppor["total"]

    # ── Totals consistency ────────────────────

    def test_total_equals_purchase_plus_borrowing(self):
        data = self._post().json()
        expected = data["purchase_costs"]["total"] + data["borrowing_costs"]["total"]
        assert data["total"] == pytest.approx(expected, abs=0.01)

    def test_purchase_costs_total_is_sum(self):
        pc = self._post().json()["purchase_costs"]
        expected = (
            pc["stamp_duty"]
            + pc["legal_fees"]
            + pc["building_pest_inspection"]
            + pc["registration_fee"]
            + pc["other_costs"]
        )
        assert pc["total"] == pytest.approx(expected, abs=0.01)

    def test_borrowing_costs_total_is_sum(self):
        bc = self._post().json()["borrowing_costs"]
        expected = bc["lmi"] + bc["mortgage_registration_fee"] + bc["loan_establishment_fee"]
        assert bc["total"] == pytest.approx(expected, abs=0.01)

    # ── Stamp duty values ─────────────────────

    def test_stamp_duty_ppor_500k(self):
        data = self._post(purchase_price=500_000, is_investment=False).json()
        assert data["purchase_costs"]["stamp_duty"] == pytest.approx(8_750, abs=1)

    def test_stamp_duty_investment_500k(self):
        data = self._post(purchase_price=500_000, is_investment=True).json()
        assert data["purchase_costs"]["stamp_duty"] == pytest.approx(15_925, abs=1)

    # ── Flat fees ─────────────────────────────

    def test_mortgage_registration_fee(self):
        data = self._post().json()
        assert data["borrowing_costs"]["mortgage_registration_fee"] == pytest.approx(238.14, abs=0.01)

    def test_conveyancing_fee(self):
        data = self._post().json()
        assert data["purchase_costs"]["legal_fees"] == pytest.approx(2_000, abs=0.01)

    def test_building_pest_inspection(self):
        data = self._post().json()
        assert data["purchase_costs"]["building_pest_inspection"] == pytest.approx(600, abs=0.01)

    def test_loan_establishment_fee(self):
        data = self._post().json()
        assert data["borrowing_costs"]["loan_establishment_fee"] == pytest.approx(300, abs=0.01)

    # ── Validation ────────────────────────────

    def test_negative_purchase_price_returns_422(self):
        res = self._post(purchase_price=-1)
        assert res.status_code == 422

    def test_negative_deposit_returns_422(self):
        res = self._post(deposit=-1)
        assert res.status_code == 422

    def test_deposit_exceeding_price_returns_422(self):
        res = self._post(purchase_price=500_000, deposit=600_000)
        assert res.status_code == 422

    # ── Edge cases ────────────────────────────

    def test_zero_purchase_price(self):
        res = self._post(purchase_price=0, deposit=0)
        assert res.status_code == 200
        assert res.json()["lvr"] == 0.0

    def test_full_cash_purchase(self):
        data = self._post(purchase_price=500_000, deposit=500_000).json()
        assert data["lvr"] == pytest.approx(0.0, abs=0.001)
        assert data["borrowing_costs"]["lmi"] == 0.0

    def test_empty_body_returns_200(self):
        res = client.post("/api/upfront-costs/estimate", json={})
        assert res.status_code == 200

    def test_get_returns_405(self):
        res = client.get("/api/upfront-costs/estimate")
        assert res.status_code == 405
