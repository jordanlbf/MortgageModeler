"""
Tests for API Grants endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestListSchemes:
    """GET /api/grants/schemes"""

    def test_returns_200(self):
        res = client.get("/api/grants/schemes")
        assert res.status_code == 200

    def test_returns_all_schemes(self):
        data = client.get("/api/grants/schemes").json()
        assert len(data["schemes"]) == 33

    def test_scheme_has_required_fields(self):
        data = client.get("/api/grants/schemes").json()
        scheme = data["schemes"][0]
        expected_fields = {
            "id", "name", "level", "state", "category",
            "benefit_pill", "meta", "theme", "benefits",
            "eligibility", "summary", "details", "rules",
        }
        assert expected_fields.issubset(scheme.keys())

    def test_meta_has_required_fields(self):
        data = client.get("/api/grants/schemes").json()
        meta = data["schemes"][0]["meta"]
        assert {"deposit", "lmi", "buyer"} == set(meta.keys())

    def test_federal_schemes_have_no_state(self):
        data = client.get("/api/grants/schemes").json()
        federal = [s for s in data["schemes"] if s["level"] == "Federal"]
        assert len(federal) > 0
        for s in federal:
            assert s["state"] is None

    def test_state_schemes_have_state(self):
        data = client.get("/api/grants/schemes").json()
        state_schemes = [s for s in data["schemes"] if s["level"] == "State"]
        assert len(state_schemes) > 0
        for s in state_schemes:
            assert s["state"] is not None


class TestCheckEligibility:
    """POST /api/grants/eligibility"""

    def _post(self, **overrides):
        """Post an eligibility request with defaults."""
        payload = {
            "states": ["Federal", "QLD"],
            "price": 600_000,
            "income": 80_000,
            "partner_income": 0,
            "property_type": "new",
            "buyer_type": "individual",
            "first_home_buyer": "yes",
            "owner_occupier": "yes",
            "off_the_plan": False,
        }
        payload.update(overrides)
        return client.post("/api/grants/eligibility", json=payload)

    # ── Status and shape ─────────────────────

    def test_returns_200(self):
        assert self._post().status_code == 200

    def test_response_has_schemes_list(self):
        data = self._post().json()
        assert "schemes" in data
        assert isinstance(data["schemes"], list)

    def test_each_result_has_scheme_and_result(self):
        data = self._post().json()
        for item in data["schemes"]:
            assert "scheme" in item
            assert "result" in item
            assert "eligible" in item["result"]
            assert "reasons" in item["result"]

    # ── Filtering by state ───────────────────

    def test_federal_only(self):
        data = self._post(states=["Federal"]).json()
        for item in data["schemes"]:
            assert item["scheme"]["level"] == "Federal"

    def test_qld_only(self):
        data = self._post(states=["QLD"]).json()
        for item in data["schemes"]:
            assert item["scheme"]["state"] == "QLD"

    def test_multiple_states(self):
        data = self._post(states=["Federal", "QLD", "NSW"]).json()
        levels = {item["scheme"]["level"] for item in data["schemes"]}
        states = {item["scheme"]["state"] for item in data["schemes"] if item["scheme"]["state"]}
        assert "Federal" in levels
        assert "QLD" in states
        assert "NSW" in states

    def test_empty_states_returns_empty(self):
        data = self._post(states=[]).json()
        assert data["schemes"] == []

    # ── Eligibility logic ────────────────────

    def test_fhb_new_600k_all_eligible(self):
        """FHB buying new $600k in QLD — most schemes should be eligible."""
        data = self._post().json()
        eligible = [s for s in data["schemes"] if s["result"]["eligible"]]
        assert len(eligible) >= 8

    def test_not_fhb_reduces_eligibility(self):
        """Non-FHB should fail FHB-required schemes."""
        data = self._post(first_home_buyer="no").json()
        fhbg = next(s for s in data["schemes"] if s["scheme"]["id"] == "fhbg")
        assert not fhbg["result"]["eligible"]
        assert "Must be a first home buyer" in fhbg["result"]["reasons"]

    def test_price_over_cap(self):
        """$800k should fail QLD FHOG ($750k cap)."""
        data = self._post(price=800_000).json()
        fhog = next(s for s in data["schemes"] if s["scheme"]["id"] == "fhog-qld")
        assert not fhog["result"]["eligible"]

    def test_couple_income_over_help_to_buy_cap(self):
        data = self._post(
            income=90_000,
            partner_income=80_000,
            buyer_type="couple",
        ).json()
        htb = next(s for s in data["schemes"] if s["scheme"]["id"] == "help-to-buy")
        assert not htb["result"]["eligible"]
        assert any("160,000" in r for r in htb["result"]["reasons"])

    def test_existing_property_fails_new_only(self):
        data = self._post(property_type="existing").json()
        fhog = next(s for s in data["schemes"] if s["scheme"]["id"] == "fhog-qld")
        assert not fhog["result"]["eligible"]

    def test_couple_fails_individual_only(self):
        data = self._post(buyer_type="couple").json()
        fhg = next(s for s in data["schemes"] if s["scheme"]["id"] == "fhg")
        assert not fhg["result"]["eligible"]

    def test_otp_schemes_ineligible_by_default(self):
        """OTP schemes require off_the_plan=True."""
        data = self._post(off_the_plan=False).json()
        otp = next(s for s in data["schemes"] if s["scheme"]["id"] == "otp-qld")
        assert not otp["result"]["eligible"]

    def test_otp_schemes_eligible_when_flagged(self):
        data = self._post(off_the_plan=True).json()
        otp = next(s for s in data["schemes"] if s["scheme"]["id"] == "otp-qld")
        assert otp["result"]["eligible"]

    # ── Sorting ──────────────────────────────

    def test_eligible_sorted_first(self):
        data = self._post(first_home_buyer="no").json()
        found_ineligible = False
        for item in data["schemes"]:
            if not item["result"]["eligible"]:
                found_ineligible = True
            elif found_ineligible:
                pytest.fail("Eligible scheme found after ineligible in response")

    # ── Validation ───────────────────────────

    def test_missing_states_returns_422(self):
        res = client.post("/api/grants/eligibility", json={})
        assert res.status_code == 422

    def test_negative_price_returns_422(self):
        res = self._post(price=-1)
        assert res.status_code == 422

    def test_negative_income_returns_422(self):
        res = self._post(income=-1)
        assert res.status_code == 422
