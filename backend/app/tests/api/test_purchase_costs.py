"""
Tests for API Purchase Costs endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestPurchaseCostsEstimate:
    """POST /api/purchase-costs/estimate"""

    def _post(self, **overrides):
        payload = {
            "purchase_price": 500_000,
            "deposit": 100_000,
            "is_investment": False,
            "lmi_exempt": False,
            **overrides,
        }
        return client.post("/api/purchase-costs/estimate", json=payload)

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_response_has_all_fields(self):
        data = self._post().json()
        expected_fields = {
            "stamp_duty", "lmi", "registration_fee", "mortgage_registration_fee",
            "conveyancing_fee", "building_pest_inspection_fee", "loan_establishment_fee",
            "total_upfront_cost", "lvr",
        }
        assert set(data.keys()) == expected_fields

    def test_all_fields_are_numeric(self):
        data = self._post().json()
        for key, value in data.items():
            assert isinstance(value, (int, float)), f"{key} is {type(value).__name__}, expected numeric"

    def test_lvr_calculated_correctly(self):
        data = self._post(purchase_price=500_000, deposit=100_000).json()
        assert data["lvr"] == pytest.approx(0.80, abs=0.001)

    def test_lvr_with_small_deposit(self):
        data = self._post(purchase_price=500_000, deposit=25_000).json()
        assert data["lvr"] == pytest.approx(0.95, abs=0.001)

    def test_no_lmi_at_80_lvr(self):
        data = self._post(purchase_price=500_000, deposit=100_000).json()
        assert data["lmi"] == 0.0

    def test_lmi_triggered_above_80_lvr(self):
        data = self._post(purchase_price=500_000, deposit=50_000).json()
        assert data["lmi"] > 0

    # ── LMI exempt ──────────────────────────────

    def test_lmi_exempt_returns_zero_lmi(self):
        data = self._post(purchase_price=500_000, deposit=25_000, lmi_exempt=True).json()
        assert data["lmi"] == 0.0

    def test_lmi_exempt_reduces_total(self):
        with_lmi = self._post(purchase_price=500_000, deposit=25_000, lmi_exempt=False).json()
        without_lmi = self._post(purchase_price=500_000, deposit=25_000, lmi_exempt=True).json()
        assert with_lmi["total_upfront_cost"] > without_lmi["total_upfront_cost"]

    # ── Investment vs PPOR ──────────────────────

    def test_investment_higher_stamp_duty_than_ppor(self):
        investment = self._post(is_investment=True).json()
        ppor = self._post(is_investment=False).json()
        assert investment["stamp_duty"] > ppor["stamp_duty"]

    def test_investment_higher_total_than_ppor(self):
        investment = self._post(purchase_price=500_000, deposit=50_000, is_investment=True).json()
        ppor = self._post(purchase_price=500_000, deposit=50_000, is_investment=False).json()
        assert investment["total_upfront_cost"] > ppor["total_upfront_cost"]

    # ── Total is sum of components ──────────────

    def test_total_equals_sum_of_components(self):
        data = self._post().json()
        component_sum = (
            data["stamp_duty"] + data["lmi"] + data["registration_fee"] +
            data["mortgage_registration_fee"] + data["conveyancing_fee"] +
            data["building_pest_inspection_fee"] + data["loan_establishment_fee"]
        )
        assert data["total_upfront_cost"] == pytest.approx(component_sum, abs=0.01)

    # ── Validation errors (422) ─────────────────

    def test_negative_purchase_price_returns_422(self):
        res = self._post(purchase_price=-1)
        assert res.status_code == 422

    def test_negative_deposit_returns_422(self):
        res = self._post(deposit=-1)
        assert res.status_code == 422

    def test_deposit_exceeding_price_returns_422(self):
        res = self._post(purchase_price=500_000, deposit=600_000)
        assert res.status_code == 422

    # ── Edge cases ──────────────────────────────

    def test_zero_purchase_price(self):
        res = self._post(purchase_price=0, deposit=0)
        assert res.status_code == 200
        assert res.json()["lvr"] == 0.0

    def test_full_cash_purchase(self):
        data = self._post(purchase_price=500_000, deposit=500_000).json()
        assert data["lvr"] == pytest.approx(0.0, abs=0.001)
        assert data["lmi"] == 0.0

    # ── Default payload ─────────────────────────

    def test_empty_body_returns_200(self):
        res = client.post("/api/purchase-costs/estimate", json={})
        assert res.status_code == 200

    def test_defaults_produce_valid_response(self):
        data = client.post("/api/purchase-costs/estimate", json={}).json()
        assert data["lvr"] == 0.0
        assert data["lmi"] == 0.0
        assert data["stamp_duty"] == 0.0

    # ── Stamp duty specific values ──────────────

    def test_stamp_duty_ppor_500k(self):
        """$500k PPOR: $3,500 + ($500,000 - $350,000) * 3.50 / 100 = $8,750"""
        data = self._post(purchase_price=500_000, is_investment=False).json()
        assert data["stamp_duty"] == pytest.approx(8_750, abs=1)

    def test_stamp_duty_investment_500k(self):
        """$500k investment: $1,050 + ($500,000 - $75,000) * 3.50 / 100 = $15,925"""
        data = self._post(purchase_price=500_000, is_investment=True).json()
        assert data["stamp_duty"] == pytest.approx(15_925, abs=1)

    def test_stamp_duty_ppor_1m(self):
        """$1M PPOR: $10,150 + ($1,000,000 - $540,000) * 4.50 / 100 = $30,850"""
        data = self._post(purchase_price=1_000_000, deposit=200_000, is_investment=False).json()
        assert data["stamp_duty"] == pytest.approx(30_850, abs=1)

    def test_stamp_duty_investment_1m(self):
        """$1M investment: $17,325 + ($1,000,000 - $540,000) * 4.50 / 100 = $38,025"""
        data = self._post(purchase_price=1_000_000, deposit=200_000, is_investment=True).json()
        assert data["stamp_duty"] == pytest.approx(38_025, abs=1)

    # ── LMI specific values per band ────────────

    def test_lmi_85_lvr_ppor(self):
        """$500k property, $75k deposit = 85% LVR, loan $425k * 1.1% = $4,675"""
        data = self._post(purchase_price=500_000, deposit=75_000, is_investment=False).json()
        assert data["lmi"] == pytest.approx(425_000 * 0.011, abs=1)

    def test_lmi_90_lvr_ppor(self):
        """$500k property, $50k deposit = 90% LVR, loan $450k * 2% = $9,000"""
        data = self._post(purchase_price=500_000, deposit=50_000, is_investment=False).json()
        assert data["lmi"] == pytest.approx(450_000 * 0.02, abs=1)

    def test_lmi_95_lvr_ppor(self):
        """$500k property, $25k deposit = 95% LVR, loan $475k * 4.5% = $21,375"""
        data = self._post(purchase_price=500_000, deposit=25_000, is_investment=False).json()
        assert data["lmi"] == pytest.approx(475_000 * 0.045, abs=1)

    def test_lmi_investment_multiplier(self):
        """Investment LMI should be 1.15x PPOR LMI at same LVR."""
        ppor = self._post(purchase_price=500_000, deposit=50_000, is_investment=False).json()
        investment = self._post(purchase_price=500_000, deposit=50_000, is_investment=True).json()
        assert investment["lmi"] == pytest.approx(ppor["lmi"] * 1.15, abs=1)

    # ── Registration fee ────────────────────────

    def test_registration_fee_below_threshold(self):
        """Property at $150k should pay base fee only."""
        data = self._post(purchase_price=150_000, deposit=30_000).json()
        assert data["registration_fee"] == pytest.approx(238.14, abs=0.01)

    def test_registration_fee_above_threshold(self):
        """$500k: base + ceil(($500k - $180k) / $10k) * $44.71 = $238.14 + 32 * $44.71"""
        data = self._post(purchase_price=500_000).json()
        expected = 238.14 + 32 * 44.71
        assert data["registration_fee"] == pytest.approx(expected, abs=0.01)

    def test_registration_fee_increases_with_price(self):
        cheap = self._post(purchase_price=300_000, deposit=60_000).json()
        expensive = self._post(purchase_price=800_000, deposit=160_000).json()
        assert expensive["registration_fee"] > cheap["registration_fee"]

    # ── Flat fees are correct ───────────────────

    def test_mortgage_registration_fee(self):
        data = self._post().json()
        assert data["mortgage_registration_fee"] == pytest.approx(238.14, abs=0.01)

    def test_conveyancing_fee(self):
        data = self._post().json()
        assert data["conveyancing_fee"] == pytest.approx(2_000, abs=0.01)

    def test_building_pest_inspection_fee(self):
        data = self._post().json()
        assert data["building_pest_inspection_fee"] == pytest.approx(600, abs=0.01)

    def test_loan_establishment_fee(self):
        data = self._post().json()
        assert data["loan_establishment_fee"] == pytest.approx(300, abs=0.01)

    # ── Total sum consistency across scenarios ───

    def test_total_sum_ppor_high_lvr(self):
        data = self._post(purchase_price=600_000, deposit=30_000, is_investment=False).json()
        component_sum = (
            data["stamp_duty"] + data["lmi"] + data["registration_fee"] +
            data["mortgage_registration_fee"] + data["conveyancing_fee"] +
            data["building_pest_inspection_fee"] + data["loan_establishment_fee"]
        )
        assert data["total_upfront_cost"] == pytest.approx(component_sum, abs=0.01)

    def test_total_sum_investment_no_lmi(self):
        data = self._post(purchase_price=400_000, deposit=100_000, is_investment=True).json()
        component_sum = (
            data["stamp_duty"] + data["lmi"] + data["registration_fee"] +
            data["mortgage_registration_fee"] + data["conveyancing_fee"] +
            data["building_pest_inspection_fee"] + data["loan_establishment_fee"]
        )
        assert data["total_upfront_cost"] == pytest.approx(component_sum, abs=0.01)

    def test_total_sum_lmi_exempt(self):
        data = self._post(purchase_price=500_000, deposit=25_000, lmi_exempt=True).json()
        component_sum = (
            data["stamp_duty"] + data["lmi"] + data["registration_fee"] +
            data["mortgage_registration_fee"] + data["conveyancing_fee"] +
            data["building_pest_inspection_fee"] + data["loan_establishment_fee"]
        )
        assert data["total_upfront_cost"] == pytest.approx(component_sum, abs=0.01)

    # ── Wrong HTTP method ───────────────────────

    def test_get_returns_405(self):
        res = client.get("/api/purchase-costs/estimate")
        assert res.status_code == 405

    # ── Invalid types ───────────────────────────

    def test_string_purchase_price_returns_422(self):
        res = client.post("/api/purchase-costs/estimate", json={"purchase_price": "abc"})
        assert res.status_code == 422

    def test_string_deposit_returns_422(self):
        res = client.post("/api/purchase-costs/estimate", json={"deposit": "abc"})
        assert res.status_code == 422

    def test_string_is_investment_returns_422(self):
        res = client.post("/api/purchase-costs/estimate", json={"is_investment": "not_a_bool"})
        assert res.status_code == 422

    # ── Boundary: deposit equals price ──────────

    def test_deposit_equals_price_returns_200(self):
        res = self._post(purchase_price=500_000, deposit=500_000)
        assert res.status_code == 200

    def test_deposit_one_cent_over_returns_422(self):
        res = self._post(purchase_price=500_000, deposit=500_000.01)
        assert res.status_code == 422

    # ── Large values ────────────────────────────

    def test_large_purchase_price(self):
        res = self._post(purchase_price=10_000_000, deposit=2_000_000)
        assert res.status_code == 200
        data = res.json()
        assert data["stamp_duty"] > 0
        assert data["total_upfront_cost"] > data["stamp_duty"]

    # ── Partial payloads ────────────────────────

    def test_only_purchase_price(self):
        res = client.post("/api/purchase-costs/estimate", json={"purchase_price": 500_000})
        assert res.status_code == 200
        data = res.json()
        assert data["lvr"] == pytest.approx(1.0, abs=0.001)

    def test_only_is_investment(self):
        res = client.post("/api/purchase-costs/estimate", json={"is_investment": True})
        assert res.status_code == 200

    # ── Non-zero costs even at low price ────────

    def test_flat_fees_present_at_low_price(self):
        """Even a cheap property should have flat fees."""
        data = self._post(purchase_price=50_000, deposit=10_000).json()
        assert data["conveyancing_fee"] > 0
        assert data["building_pest_inspection_fee"] > 0
        assert data["loan_establishment_fee"] > 0
        assert data["mortgage_registration_fee"] > 0
        assert data["registration_fee"] > 0

    # ── End-to-end known value ──────────────────

    def test_end_to_end_ppor_500k_20pct_deposit(self):
        """Full end-to-end check for a $500k PPOR with 20% deposit."""
        data = self._post(purchase_price=500_000, deposit=100_000, is_investment=False).json()

        assert data["lvr"] == pytest.approx(0.80, abs=0.001)
        assert data["lmi"] == 0.0
        assert data["stamp_duty"] == pytest.approx(8_750, abs=1)
        assert data["registration_fee"] == pytest.approx(238.14 + 32 * 44.71, abs=0.01)
        assert data["mortgage_registration_fee"] == pytest.approx(238.14, abs=0.01)
        assert data["conveyancing_fee"] == pytest.approx(2_000, abs=0.01)
        assert data["building_pest_inspection_fee"] == pytest.approx(600, abs=0.01)
        assert data["loan_establishment_fee"] == pytest.approx(300, abs=0.01)

        expected_total = (
            data["stamp_duty"] + data["lmi"] + data["registration_fee"] +
            data["mortgage_registration_fee"] + data["conveyancing_fee"] +
            data["building_pest_inspection_fee"] + data["loan_establishment_fee"]
        )
        assert data["total_upfront_cost"] == pytest.approx(expected_total, abs=0.01)
