"""
Tests for API Tax endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestTaxBreakdownEndpoint:
    """POST /api/tax/breakdown"""

    def _post(self, **overrides):
        payload = {
            "taxable_income": 100_000,
            "repayment_income": 100_000,
            "mls_income": 100_000,
            "hecs_balance": 0,
            "has_private_health": False,
            **overrides,
        }
        return client.post("/api/tax/breakdown", json=payload)

    def _post_uniform(self, income, **overrides):
        """Helper for tests where all income measures are the same."""
        return self._post(
            taxable_income=income,
            repayment_income=income,
            mls_income=income,
            **overrides,
        )

    # ── Status and response shape ─────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_response_has_all_fields(self):
        data = self._post().json()
        expected_fields = {
            "taxable_income",
            "income_tax",
            "medicare_levy",
            "medicare_levy_surcharge",
            "hecs_repayment",
            "net_income",
            "total_tax",
            "marginal_rate",
        }
        assert set(data.keys()) == expected_fields

    def test_all_fields_are_floats(self):
        data = self._post().json()
        for key, value in data.items():
            assert isinstance(value, (int, float)), f"{key} is not numeric"

    # ── Echo back ─────────────────────────────

    def test_taxable_income_echoed(self):
        data = self._post(taxable_income=85_000).json()
        assert data["taxable_income"] == 85_000

    # ── Default payload ($100k, no HECS, no PHI) ──

    def test_default_income_tax(self):
        """$100k: 4,288 + (100,000 - 45,000) * 0.30 = $20,788"""
        data = self._post().json()
        assert data["income_tax"] == pytest.approx(20_788, abs=1)

    def test_default_medicare_levy(self):
        """$100k * 0.02 = $2,000"""
        data = self._post().json()
        assert data["medicare_levy"] == pytest.approx(2_000, abs=1)

    def test_default_mls_below_threshold(self):
        """$100k <= $101k MLS threshold, no surcharge."""
        data = self._post().json()
        assert data["medicare_levy_surcharge"] == 0

    def test_default_no_hecs(self):
        data = self._post().json()
        assert data["hecs_repayment"] == 0

    def test_default_total_tax(self):
        """IT $20,788 + ML $2,000 + MLS $0 + HECS $0 = $22,788"""
        data = self._post().json()
        assert data["total_tax"] == pytest.approx(22_788, abs=1)

    def test_default_net_income(self):
        """$100,000 - $22,788 = $77,212"""
        data = self._post().json()
        assert data["net_income"] == pytest.approx(77_212, abs=1)

    # ── Net income = taxable_income - total_tax ─

    def test_net_income_equals_taxable_minus_total(self):
        data = self._post_uniform(150_000, hecs_balance=20_000).json()
        assert data["net_income"] == pytest.approx(data["taxable_income"] - data["total_tax"], abs=0.01)

    # ── Total tax = sum of components ─────────

    def test_total_tax_equals_component_sum(self):
        data = self._post_uniform(150_000, hecs_balance=20_000).json()
        component_sum = (
            data["income_tax"] + data["medicare_levy"] + data["medicare_levy_surcharge"] + data["hecs_repayment"]
        )
        assert data["total_tax"] == pytest.approx(component_sum, abs=0.01)

    # ── With HECS ─────────────────────────────

    def test_hecs_repayment_with_balance(self):
        """$100k income, $25k HECS: (100,000 - 67,000) * 0.15 = $4,950"""
        data = self._post(hecs_balance=25_000).json()
        assert data["hecs_repayment"] == pytest.approx(4_950, abs=1)

    def test_hecs_zero_balance_no_repayment(self):
        data = self._post(hecs_balance=0).json()
        assert data["hecs_repayment"] == 0

    def test_hecs_balance_caps_repayment(self):
        """$100k income, $1k HECS balance: repayment capped at $1,000."""
        data = self._post(hecs_balance=1_000).json()
        assert data["hecs_repayment"] == pytest.approx(1_000, abs=0.1)

    def test_hecs_increases_total_tax(self):
        without = self._post(hecs_balance=0).json()["total_tax"]
        with_hecs = self._post(hecs_balance=25_000).json()["total_tax"]
        assert with_hecs > without

    # ── Private health toggle ─────────────────

    def test_private_health_removes_mls(self):
        """$120k income: MLS applies without PHI, zero with PHI."""
        without = self._post_uniform(120_000, has_private_health=False).json()
        with_phi = self._post_uniform(120_000, has_private_health=True).json()
        assert without["medicare_levy_surcharge"] > 0
        assert with_phi["medicare_levy_surcharge"] == 0

    def test_private_health_no_effect_on_income_tax(self):
        without = self._post_uniform(120_000, has_private_health=False).json()
        with_phi = self._post_uniform(120_000, has_private_health=True).json()
        assert without["income_tax"] == with_phi["income_tax"]

    def test_private_health_no_effect_on_medicare_levy(self):
        without = self._post_uniform(120_000, has_private_health=False).json()
        with_phi = self._post_uniform(120_000, has_private_health=True).json()
        assert without["medicare_levy"] == with_phi["medicare_levy"]

    def test_private_health_no_effect_on_hecs(self):
        without = self._post_uniform(120_000, hecs_balance=25_000, has_private_health=False).json()
        with_phi = self._post_uniform(120_000, hecs_balance=25_000, has_private_health=True).json()
        assert without["hecs_repayment"] == with_phi["hecs_repayment"]

    # ── Zero income ───────────────────────────

    def test_zero_income_all_zeros(self):
        data = self._post_uniform(0).json()
        assert data["income_tax"] == 0
        assert data["medicare_levy"] == 0
        assert data["medicare_levy_surcharge"] == 0
        assert data["hecs_repayment"] == 0
        assert data["total_tax"] == 0
        assert data["net_income"] == 0

    # ── High income (all components active) ───

    def test_high_income_all_components(self):
        """$200k, no PHI, $50k HECS — all tax components should be > 0."""
        data = self._post_uniform(200_000, hecs_balance=50_000, has_private_health=False).json()
        assert data["income_tax"] > 0
        assert data["medicare_levy"] > 0
        assert data["medicare_levy_surcharge"] > 0
        assert data["hecs_repayment"] > 0

    def test_high_income_values(self):
        """$200k: IT $56,138 + ML $4,000 + MLS $3,000 + HECS $20,000 = $83,138"""
        data = self._post_uniform(200_000, hecs_balance=50_000, has_private_health=False).json()
        assert data["income_tax"] == pytest.approx(56_138, abs=1)
        assert data["medicare_levy"] == pytest.approx(4_000, abs=1)
        assert data["medicare_levy_surcharge"] == pytest.approx(3_000, abs=1)
        assert data["hecs_repayment"] == pytest.approx(20_000, abs=1)
        assert data["total_tax"] == pytest.approx(83_138, abs=1)
        assert data["net_income"] == pytest.approx(116_862, abs=1)

    # ── Divergent incomes (negative gearing) ──

    def test_divergent_incomes(self):
        """TI $80k (after rental loss), RI/MLSI $100k (loss added back)."""
        data = self._post(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=100_000,
            hecs_balance=25_000,
        ).json()
        # Income tax and Medicare levy use taxable_income ($80k)
        assert data["income_tax"] == pytest.approx(14_788, abs=1)
        assert data["medicare_levy"] == pytest.approx(1_600, abs=1)
        # HECS uses repayment_income ($100k)
        assert data["hecs_repayment"] == pytest.approx(4_950, abs=1)
        # MLS uses mls_income ($100k) — below $101k threshold
        assert data["medicare_levy_surcharge"] == 0

    # ── Validation (422 errors) ───────────────

    def test_negative_income_rejected(self):
        res = self._post(taxable_income=-1)
        assert res.status_code == 422

    def test_negative_hecs_rejected(self):
        res = self._post(hecs_balance=-1)
        assert res.status_code == 422

    def test_invalid_type_rejected(self):
        res = self._post(taxable_income="not_a_number")
        assert res.status_code == 422

    # ── Defaults ──────────────────────────────

    def test_empty_body_uses_defaults(self):
        """Empty body should use all defaults (zero income, no HECS, no PHI)."""
        res = client.post("/api/tax/breakdown", json={})
        assert res.status_code == 200
        data = res.json()
        assert data["taxable_income"] == 0
        assert data["total_tax"] == 0
        assert data["net_income"] == 0
