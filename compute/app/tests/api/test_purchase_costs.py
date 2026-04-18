"""
Tests for API Purchase Costs endpoint.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestPurchaseCostsEndpoint:
    """POST /api/purchase-costs/calculate"""

    def _post(self, **overrides):
        payload = {
            "state": "QLD",
            "price": 600_000,
            "deposit_percent": 0.10,
            "property_type": "new",
            "buyer_type": "individual",
            "owner_occupier": True,
            "first_home_buyer": True,
            "selected_grants": [],
        }
        payload.update(overrides)
        return client.post("/api/purchase-costs/calculate", json=payload)

    # ── Status and shape ─────────────────────

    def test_returns_200(self):
        assert self._post().status_code == 200

    def test_response_has_all_fields(self):
        data = self._post().json()
        expected = {
            "stamp_duty_base", "stamp_duty_concession", "stamp_duty_payable",
            "lmi_base", "lmi_waived", "lmi_payable",
            "legal_fees", "registration_fee", "mortgage_registration_fee",
            "building_pest_inspection", "loan_establishment_fee", "total_fees",
            "grants_applied", "total_grant_savings",
            "equity_contribution", "effective_loan_amount",
            "deposit_amount", "min_deposit_percent", "total_upfront_cost", "lvr",
        }
        assert expected.issubset(data.keys())

    def test_grants_applied_shape(self):
        data = self._post(selected_grants=["fhog-qld"]).json()
        assert len(data["grants_applied"]) > 0
        g = data["grants_applied"][0]
        assert {"scheme_id", "scheme_name", "category", "effect_type", "amount", "description"}.issubset(g.keys())

    # ── Known scenarios ──────────────────────

    def test_qld_fhb_full_package(self):
        """QLD FHB new $600k: FHOG + duty exemption + FHBG."""
        data = self._post(
            selected_grants=["fhog-qld", "fhb-stamp-new-qld", "fhbg"],
        ).json()
        assert data["stamp_duty_payable"] == 0
        assert data["lmi_waived"] is True
        assert data["lmi_payable"] == 0
        assert data["total_grant_savings"] == 30_000

    def test_no_grants_has_full_duty(self):
        data = self._post().json()
        assert data["stamp_duty_payable"] > 0
        assert data["stamp_duty_concession"] == 0

    def test_investor_higher_duty(self):
        ppor = self._post(owner_occupier=True).json()
        inv = self._post(owner_occupier=False).json()
        assert inv["stamp_duty_base"] > ppor["stamp_duty_base"]

    def test_nsw_works(self):
        data = self._post(state="NSW").json()
        assert data["stamp_duty_base"] > 0

    def test_nt_works(self):
        data = self._post(state="NT").json()
        assert data["stamp_duty_base"] > 0

    # ── Validation ───────────────────────────

    def test_negative_price_returns_422(self):
        assert self._post(price=-1).status_code == 422

    def test_deposit_over_1_returns_422(self):
        assert self._post(deposit_percent=1.5).status_code == 422

    def test_missing_state_returns_422(self):
        res = client.post("/api/purchase-costs/calculate", json={
            "price": 500_000,
            "deposit_percent": 0.10,
        })
        assert res.status_code == 422
