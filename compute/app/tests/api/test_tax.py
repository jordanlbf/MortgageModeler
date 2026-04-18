"""
Tests for API Tax endpoints.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


class TestTaxBreakdownEndpoint:
    """POST /api/tax/breakdown"""

    def _post(self, income=None, deductions=None, adjustments=None):
        payload = {}
        if income is not None:
            payload["income"] = income
        else:
            payload["income"] = {"salary": 100_000}
        if deductions is not None:
            payload["deductions"] = deductions
        if adjustments is not None:
            payload["adjustments"] = adjustments
        return client.post("/api/tax/breakdown", json=payload)

    def _post_salary(self, salary, **adj_overrides):
        """Helper for salary-only requests with optional adjustments."""
        adjustments = adj_overrides if adj_overrides else None
        return self._post(income={"salary": salary}, adjustments=adjustments)

    # ── Status and response shape ─────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_response_has_all_fields(self):
        data = self._post().json()
        expected_fields = {
            "assessable_income",
            "total_deductions",
            "taxable_income",
            "repayment_income",
            "mls_income",
            "net_investment_loss",
            "income_tax",
            "medicare_levy",
            "medicare_levy_surcharge",
            "hecs_repayment",
            "lito",
            "sapto_offset",
            "franking_offset",
            "total_offsets",
            "net_income",
            "total_tax",
            "marginal_rate",
            "effective_rate",
        }
        assert set(data.keys()) == expected_fields

    def test_all_fields_are_floats(self):
        data = self._post().json()
        for key, value in data.items():
            assert isinstance(value, (int, float)), f"{key} is not numeric"

    # ── Default payload ($100k salary, no HECS, no PHI) ──

    def test_default_assessable_income(self):
        data = self._post().json()
        assert data["assessable_income"] == 100_000

    def test_default_taxable_income(self):
        data = self._post().json()
        assert data["taxable_income"] == 100_000

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

    def test_default_effective_rate(self):
        data = self._post().json()
        assert data["effective_rate"] == pytest.approx(22_788 / 100_000, abs=0.001)

    # ── Net income = taxable_income - total_tax ─

    def test_net_income_equals_taxable_minus_total(self):
        data = self._post_salary(150_000, hecs_bal=20_000).json()
        assert data["net_income"] == pytest.approx(data["taxable_income"] - data["total_tax"], abs=0.01)

    # ── Total tax = sum of components ─────────

    def test_total_tax_equals_component_sum(self):
        data = self._post_salary(150_000, hecs_bal=20_000).json()
        component_sum = (
            data["income_tax"] + data["medicare_levy"] + data["medicare_levy_surcharge"] + data["hecs_repayment"]
        )
        assert data["total_tax"] == pytest.approx(component_sum, abs=0.01)

    # ── With HECS ─────────────────────────────

    def test_hecs_repayment_with_balance(self):
        """$100k income, $25k HECS: (100,000 - 67,000) * 0.15 = $4,950"""
        data = self._post_salary(100_000, hecs_bal=25_000).json()
        assert data["hecs_repayment"] == pytest.approx(4_950, abs=1)

    def test_hecs_zero_balance_no_repayment(self):
        data = self._post_salary(100_000, hecs_bal=0).json()
        assert data["hecs_repayment"] == 0

    def test_hecs_balance_caps_repayment(self):
        """$100k income, $1k HECS balance: repayment capped at $1,000."""
        data = self._post_salary(100_000, hecs_bal=1_000).json()
        assert data["hecs_repayment"] == pytest.approx(1_000, abs=0.1)

    def test_hecs_increases_total_tax(self):
        without = self._post_salary(100_000, hecs_bal=0).json()["total_tax"]
        with_hecs = self._post_salary(100_000, hecs_bal=25_000).json()["total_tax"]
        assert with_hecs > without

    # ── Private health toggle ─────────────────

    def test_private_health_removes_mls(self):
        """$120k income: MLS applies without PHI, zero with PHI."""
        without = self._post_salary(120_000, phi=False).json()
        with_phi = self._post_salary(120_000, phi=True).json()
        assert without["medicare_levy_surcharge"] > 0
        assert with_phi["medicare_levy_surcharge"] == 0

    def test_private_health_no_effect_on_income_tax(self):
        without = self._post_salary(120_000, phi=False).json()
        with_phi = self._post_salary(120_000, phi=True).json()
        assert without["income_tax"] == with_phi["income_tax"]

    def test_private_health_no_effect_on_medicare_levy(self):
        without = self._post_salary(120_000, phi=False).json()
        with_phi = self._post_salary(120_000, phi=True).json()
        assert without["medicare_levy"] == with_phi["medicare_levy"]

    def test_private_health_no_effect_on_hecs(self):
        without = self._post_salary(120_000, hecs_bal=25_000, phi=False).json()
        with_phi = self._post_salary(120_000, hecs_bal=25_000, phi=True).json()
        assert without["hecs_repayment"] == with_phi["hecs_repayment"]

    # ── Zero income ───────────────────────────

    def test_zero_income_all_zeros(self):
        data = self._post_salary(0).json()
        assert data["income_tax"] == 0
        assert data["medicare_levy"] == 0
        assert data["medicare_levy_surcharge"] == 0
        assert data["hecs_repayment"] == 0
        assert data["total_tax"] == 0
        assert data["net_income"] == 0
        assert data["effective_rate"] == 0

    # ── High income (all components active) ───

    def test_high_income_all_components(self):
        """$200k, no PHI, $50k HECS — all tax components should be > 0."""
        data = self._post_salary(200_000, hecs_bal=50_000, phi=False).json()
        assert data["income_tax"] > 0
        assert data["medicare_levy"] > 0
        assert data["medicare_levy_surcharge"] > 0
        assert data["hecs_repayment"] > 0

    def test_high_income_values(self):
        """$200k: IT $56,138 + ML $4,000 + MLS $3,000 + HECS $20,000 = $83,138"""
        data = self._post_salary(200_000, hecs_bal=50_000, phi=False).json()
        assert data["income_tax"] == pytest.approx(56_138, abs=1)
        assert data["medicare_levy"] == pytest.approx(4_000, abs=1)
        assert data["medicare_levy_surcharge"] == pytest.approx(3_000, abs=1)
        assert data["hecs_repayment"] == pytest.approx(20_000, abs=1)
        assert data["total_tax"] == pytest.approx(83_138, abs=1)
        assert data["net_income"] == pytest.approx(116_862, abs=1)

    # ── Negative gearing via inputs ───────────

    def test_negative_gearing(self):
        """Salary $80k + rental $20k - rental deductions $40k = TI $60k, HRI $80k."""
        data = self._post(
            income={"salary": 80_000, "rental": 20_000},
            deductions={"rental_deductions": 40_000},
            adjustments={"hecs_bal": 25_000},
        ).json()
        assert data["assessable_income"] == 100_000
        assert data["total_deductions"] == 40_000
        assert data["taxable_income"] == 60_000
        assert data["net_investment_loss"] == 20_000
        assert data["repayment_income"] == 80_000
        # Raw IT $8,788 − LITO $100 (at $60k: $325 − $15k × 0.015) = $8,688
        assert data["income_tax"] == pytest.approx(8_688, abs=1)
        assert data["lito"] == pytest.approx(100, abs=1)
        assert data["medicare_levy"] == pytest.approx(1_200, abs=1)

    # ── Income measures in response ───────────

    def test_income_measures_returned(self):
        data = self._post(
            income={"salary": 80_000, "rental": 20_000, "franking": 5_000},
            deductions={"work_deductions": 3_000},
            adjustments={"sal_sac": 10_000},
        ).json()
        assert data["assessable_income"] == 105_000
        assert data["total_deductions"] == 3_000
        assert data["taxable_income"] == 102_000
        assert data["repayment_income"] == 112_000  # 102k + 10k sal_sac

    # ── Capital gains ─────────────────────────

    def test_short_term_cgt(self):
        data = self._post(income={"salary": 80_000, "capital_gain_short": 20_000}).json()
        assert data["assessable_income"] == 100_000

    def test_long_term_cgt_discount(self):
        data = self._post(income={"salary": 80_000, "capital_gain_long": 40_000}).json()
        assert data["assessable_income"] == 100_000  # 80k + 40k * 0.5

    # ── Validation (422 errors) ───────────────

    def test_missing_income_rejected(self):
        res = client.post("/api/tax/breakdown", json={})
        assert res.status_code == 422

    def test_negative_salary_rejected(self):
        res = self._post(income={"salary": -1})
        assert res.status_code == 422

    def test_negative_hecs_rejected(self):
        res = self._post(adjustments={"hecs_bal": -1})
        assert res.status_code == 422

    def test_invalid_type_rejected(self):
        res = self._post(income={"salary": "not_a_number"})
        assert res.status_code == 422

    # ── Defaults ──────────────────────────────

    def test_deductions_default_to_zero(self):
        """Omitting deductions and adjustments should use defaults."""
        data = self._post(income={"salary": 100_000}).json()
        assert data["total_deductions"] == 0
        assert data["net_investment_loss"] == 0
        assert data["hecs_repayment"] == 0

    # ── Tax offsets ───────────────────────────

    def test_lito_applied_at_low_income(self):
        """$30k salary: LITO $700 reduces income tax."""
        data = self._post_salary(30_000).json()
        assert data["lito"] == 700
        assert data["income_tax"] == pytest.approx(1_888 - 700, abs=1)

    def test_lito_zero_at_high_income(self):
        data = self._post_salary(100_000).json()
        assert data["lito"] == 0

    def test_sapto_not_applied_by_default(self):
        data = self._post_salary(30_000).json()
        assert data["sapto_offset"] == 0

    def test_sapto_applied_when_eligible(self):
        data = self._post_salary(30_000, sapto=True).json()
        assert data["sapto_offset"] == 2_230

    def test_franking_offset_applied(self):
        """$100k salary + $3k franking: assessable $103k, TI $103k, raw IT $21,688 − franking $3k = $18,688."""
        data = self._post(income={"salary": 100_000, "franking": 3_000}).json()
        assert data["assessable_income"] == 103_000
        assert data["franking_offset"] == 3_000
        # Raw IT at $103k: 4,288 + (103,000 - 45,000) * 0.30 = $21,688, no LITO (>$66,667)
        assert data["income_tax"] == pytest.approx(21_688 - 3_000, abs=1)

    def test_franking_refund_via_api(self):
        """$20k salary + $5k franking: produces negative income tax (refund)."""
        data = self._post(income={"salary": 20_000, "franking": 5_000}).json()
        assert data["income_tax"] < 0
        assert data["total_tax"] < 0

    def test_offsets_in_response(self):
        """All offset fields present and sum correctly."""
        data = self._post_salary(40_000, sapto=True).json()
        assert data["total_offsets"] == pytest.approx(
            data["lito"] + data["sapto_offset"] + data["franking_offset"], abs=0.01
        )
