"""
Tests for tax breakdown service — build_tax_breakdown and compute_income_measures.
"""

import pytest

from app.engine.tax import (
    calculate_hecs_repayment,
    calculate_income_tax,
    calculate_medicare_levy,
    calculate_medicare_levy_surcharge,
)
from app.models.tax import TaxInputs, TaxProfile
from app.services.tax_breakdown import build_tax_breakdown, compute_income_measures

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _make_profile(income=100_000, **overrides) -> TaxProfile:
    """Create a TaxProfile with uniform income defaults."""
    defaults = dict(
        taxable_income=income,
        repayment_income=income,
        mls_income=income,
        hecs_balance=0,
        has_private_health=False,
        assessable_income=income,
    )
    defaults.update(overrides)
    return TaxProfile(**defaults)


def _make_inputs(**overrides) -> TaxInputs:
    """Create a TaxInputs with salary-only defaults."""
    defaults = dict(salary=100_000)
    defaults.update(overrides)
    return TaxInputs(**defaults)


# ──────────────────────────────────────────────
# compute_income_measures
# ──────────────────────────────────────────────


class TestComputeIncomeMeasures:
    """Tests for compute_income_measures service function."""

    def test_salary_only(self):
        """All measures equal salary when no other inputs."""
        profile = compute_income_measures(_make_inputs(salary=100_000))
        assert profile.assessable_income == 100_000
        assert profile.total_deductions == 0
        assert profile.taxable_income == 100_000
        assert profile.repayment_income == 100_000
        assert profile.mls_income == 100_000
        assert profile.net_investment_loss == 0

    def test_negative_gearing(self):
        """Rental loss reduces taxable but not repayment income."""
        profile = compute_income_measures(_make_inputs(
            salary=80_000,
            rental=20_000,
            rental_deductions=40_000,
        ))
        assert profile.assessable_income == 100_000
        assert profile.total_deductions == 40_000
        assert profile.taxable_income == 60_000
        assert profile.net_investment_loss == 20_000
        assert profile.repayment_income == 80_000  # 60k + 20k loss added back

    def test_salary_sacrifice_increases_hri(self):
        """Salary sacrifice added to repayment income only."""
        without = compute_income_measures(_make_inputs(salary=100_000))
        with_sal_sac = compute_income_measures(_make_inputs(salary=100_000, sal_sac=10_000))
        assert with_sal_sac.taxable_income == without.taxable_income
        assert with_sal_sac.repayment_income == without.repayment_income + 10_000

    def test_rfb_increases_hri(self):
        """Fringe benefits added to repayment income only."""
        without = compute_income_measures(_make_inputs(salary=100_000))
        with_rfb = compute_income_measures(_make_inputs(salary=100_000, rfb=12_000))
        assert with_rfb.taxable_income == without.taxable_income
        assert with_rfb.repayment_income == without.repayment_income + 12_000

    def test_short_term_cgt_full_gain(self):
        """Short-term capital gains included at 100%."""
        profile = compute_income_measures(_make_inputs(salary=80_000, capital_gain_short=20_000))
        assert profile.assessable_income == 100_000

    def test_long_term_cgt_50_percent_discount(self):
        """Long-term capital gains included at 50%."""
        profile = compute_income_measures(_make_inputs(salary=80_000, capital_gain_long=40_000))
        assert profile.assessable_income == 100_000  # 80k + 40k * 0.5

    def test_franking_credits_in_assessable(self):
        """Franking credits added to assessable income."""
        profile = compute_income_measures(_make_inputs(salary=90_000, franking=10_000))
        assert profile.assessable_income == 100_000

    def test_deductions_exceed_income(self):
        """Taxable income floors at zero."""
        profile = compute_income_measures(_make_inputs(
            salary=10_000,
            work_deductions=20_000,
        ))
        assert profile.taxable_income == 0

    def test_combined_divergence(self):
        """All measures diverge with negative gearing + sal sac + FBT."""
        profile = compute_income_measures(_make_inputs(
            salary=80_000,
            rental=20_000,
            rental_deductions=40_000,
            sal_sac=5_000,
            rfb=12_000,
        ))
        assert profile.assessable_income == 100_000
        assert profile.taxable_income == 60_000
        assert profile.net_investment_loss == 20_000
        assert profile.repayment_income == 97_000  # 60k + 12k + 5k + 20k

    def test_hecs_and_phi_passed_through(self):
        """HECS balance and PHI flag forwarded to profile."""
        profile = compute_income_measures(_make_inputs(hecs_bal=35_000, phi=True))
        assert profile.hecs_balance == 35_000
        assert profile.has_private_health is True

    def test_rental_only(self):
        """Works with zero salary, rental income only."""
        profile = compute_income_measures(_make_inputs(salary=0, rental=50_000))
        assert profile.assessable_income == 50_000
        assert profile.taxable_income == 50_000


# ──────────────────────────────────────────────
# Basic breakdown
# ──────────────────────────────────────────────


class TestBuildTaxBreakdown:
    """Tests for build_tax_breakdown service function."""

    def test_returns_taxable_income(self):
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.taxable_income == 100_000

    def test_income_tax_at_100k(self):
        """$100k: 4,288 + (100,000 - 45,000) * 0.30 = $20,788"""
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.income_tax == pytest.approx(20_788, abs=1)

    def test_medicare_levy_at_100k(self):
        """$100k * 0.02 = $2,000"""
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.medicare_levy == pytest.approx(2_000, abs=1)

    def test_mls_below_threshold(self):
        """$100k <= $101k MLS threshold, no surcharge."""
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.medicare_levy_surcharge == 0

    def test_no_hecs_by_default(self):
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.hecs_repayment == 0

    def test_total_tax_is_sum_of_components(self):
        result = build_tax_breakdown(_make_profile(150_000, hecs_balance=20_000))
        component_sum = (
            result.income_tax + result.medicare_levy + result.medicare_levy_surcharge + result.hecs_repayment
        )
        assert result.total_tax == pytest.approx(component_sum, abs=0.01)

    def test_net_income_is_taxable_minus_total(self):
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.net_income == pytest.approx(result.taxable_income - result.total_tax, abs=0.01)

    def test_effective_rate(self):
        """Effective rate = total_tax / assessable_income."""
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.effective_rate == pytest.approx(result.total_tax / 100_000, abs=0.001)

    def test_effective_rate_zero_income(self):
        """Effective rate is 0 when assessable income is 0."""
        result = build_tax_breakdown(_make_profile(0))
        assert result.effective_rate == 0.0


# ──────────────────────────────────────────────
# Zero income
# ──────────────────────────────────────────────


class TestZeroIncome:
    """Tests for zero income edge case."""

    def test_all_zeros(self):
        result = build_tax_breakdown(_make_profile(0))
        assert result.income_tax == 0
        assert result.medicare_levy == 0
        assert result.medicare_levy_surcharge == 0
        assert result.hecs_repayment == 0
        assert result.total_tax == 0
        assert result.net_income == 0
        assert result.marginal_rate == 0.0
        assert result.effective_rate == 0.0


# ──────────────────────────────────────────────
# Marginal rate in breakdown
# ──────────────────────────────────────────────


class TestMarginalRateInBreakdown:
    """Tests for marginal_rate field in service response."""

    def test_marginal_rate_at_100k(self):
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.marginal_rate == 0.30

    def test_marginal_rate_at_200k(self):
        result = build_tax_breakdown(_make_profile(200_000))
        assert result.marginal_rate == 0.45

    def test_marginal_rate_below_tax_free(self):
        result = build_tax_breakdown(_make_profile(15_000))
        assert result.marginal_rate == 0.0

    def test_marginal_rate_at_50k(self):
        result = build_tax_breakdown(_make_profile(50_000))
        assert result.marginal_rate == 0.30

    def test_marginal_rate_at_150k(self):
        result = build_tax_breakdown(_make_profile(150_000))
        assert result.marginal_rate == 0.37


# ──────────────────────────────────────────────
# HECS
# ──────────────────────────────────────────────


class TestHecs:
    """Tests for HECS repayment component."""

    def test_hecs_repayment_with_balance(self):
        """$100k income, $25k HECS: (100,000 - 67,000) * 0.15 = $4,950"""
        result = build_tax_breakdown(_make_profile(100_000, hecs_balance=25_000))
        assert result.hecs_repayment == pytest.approx(4_950, abs=1)

    def test_hecs_balance_caps_repayment(self):
        """$100k income, $1k HECS: capped at $1,000."""
        result = build_tax_breakdown(_make_profile(100_000, hecs_balance=1_000))
        assert result.hecs_repayment == pytest.approx(1_000, abs=0.1)

    def test_hecs_increases_total_tax(self):
        without = build_tax_breakdown(_make_profile(100_000, hecs_balance=0))
        with_hecs = build_tax_breakdown(_make_profile(100_000, hecs_balance=25_000))
        assert with_hecs.total_tax > without.total_tax


# ──────────────────────────────────────────────
# Private health / MLS
# ──────────────────────────────────────────────


class TestPrivateHealth:
    """Tests for Medicare Levy Surcharge and private health."""

    def test_mls_above_threshold_no_phi(self):
        """$120k income, no PHI: MLS applies."""
        result = build_tax_breakdown(_make_profile(120_000, has_private_health=False))
        assert result.medicare_levy_surcharge > 0

    def test_mls_zeroed_with_phi(self):
        """$120k income, with PHI: MLS is zero."""
        result = build_tax_breakdown(_make_profile(120_000, has_private_health=True))
        assert result.medicare_levy_surcharge == 0

    def test_phi_only_affects_mls(self):
        """PHI should not affect income tax, Medicare levy, or HECS."""
        without = build_tax_breakdown(_make_profile(120_000, hecs_balance=25_000, has_private_health=False))
        with_phi = build_tax_breakdown(_make_profile(120_000, hecs_balance=25_000, has_private_health=True))
        assert without.income_tax == with_phi.income_tax
        assert without.medicare_levy == with_phi.medicare_levy
        assert without.hecs_repayment == with_phi.hecs_repayment


# ──────────────────────────────────────────────
# Divergent incomes
# ──────────────────────────────────────────────


class TestDivergentIncomes:
    """Tests for profiles where TI, RI, and MLSI differ."""

    def test_income_tax_uses_taxable_income(self):
        """Income tax should use taxable_income, not repayment_income."""
        profile = TaxProfile(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=100_000,
            hecs_balance=0,
            has_private_health=True,
        )
        result = build_tax_breakdown(profile)
        assert result.income_tax == pytest.approx(calculate_income_tax(80_000), abs=0.01)

    def test_medicare_levy_uses_taxable_income(self):
        """Medicare levy should use taxable_income."""
        profile = TaxProfile(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=100_000,
            hecs_balance=0,
            has_private_health=True,
        )
        result = build_tax_breakdown(profile)
        assert result.medicare_levy == pytest.approx(calculate_medicare_levy(80_000), abs=0.01)

    def test_hecs_uses_repayment_income(self):
        """HECS should use repayment_income, not taxable_income."""
        profile = TaxProfile(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=100_000,
            hecs_balance=25_000,
            has_private_health=True,
        )
        result = build_tax_breakdown(profile)
        assert result.hecs_repayment == pytest.approx(calculate_hecs_repayment(100_000, 25_000), abs=0.01)

    def test_mls_uses_mls_income(self):
        """MLS should use mls_income, not taxable_income."""
        profile = TaxProfile(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=120_000,
            hecs_balance=0,
            has_private_health=False,
        )
        result = build_tax_breakdown(profile)
        assert result.medicare_levy_surcharge == pytest.approx(
            calculate_medicare_levy_surcharge(120_000, False), abs=0.01
        )

    def test_negative_gearing_scenario(self):
        """TI $80k (after rental loss), RI/MLSI $100k (loss added back)."""
        profile = TaxProfile(
            taxable_income=80_000,
            repayment_income=100_000,
            mls_income=100_000,
            hecs_balance=25_000,
            has_private_health=False,
        )
        result = build_tax_breakdown(profile)
        assert result.income_tax == pytest.approx(14_788, abs=1)
        assert result.medicare_levy == pytest.approx(1_600, abs=1)
        assert result.hecs_repayment == pytest.approx(4_950, abs=1)
        assert result.medicare_levy_surcharge == 0  # $100k < $101k threshold


# ──────────────────────────────────────────────
# High income
# ──────────────────────────────────────────────


class TestHighIncome:
    """Tests for high income with all components active."""

    def test_all_components_positive(self):
        """$200k, no PHI, $50k HECS — all components should be > 0."""
        result = build_tax_breakdown(_make_profile(200_000, hecs_balance=50_000))
        assert result.income_tax > 0
        assert result.medicare_levy > 0
        assert result.medicare_levy_surcharge > 0
        assert result.hecs_repayment > 0

    def test_high_income_values(self):
        """$200k: IT $56,138 + ML $4,000 + MLS $3,000 + HECS $20,000 = $83,138"""
        result = build_tax_breakdown(_make_profile(200_000, hecs_balance=50_000))
        assert result.income_tax == pytest.approx(56_138, abs=1)
        assert result.medicare_levy == pytest.approx(4_000, abs=1)
        assert result.medicare_levy_surcharge == pytest.approx(3_000, abs=1)
        assert result.hecs_repayment == pytest.approx(20_000, abs=1)
        assert result.total_tax == pytest.approx(83_138, abs=1)
        assert result.net_income == pytest.approx(116_862, abs=1)


# ──────────────────────────────────────────────
# Tax offsets — LITO
# ──────────────────────────────────────────────


class TestLitoInBreakdown:
    """Tests for LITO applied in build_tax_breakdown."""

    def test_lito_zero_above_threshold(self):
        """$100k: above $66,667, no LITO."""
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.lito == 0

    def test_lito_full_at_low_income(self):
        """$30k: full $700 LITO."""
        result = build_tax_breakdown(_make_profile(30_000))
        assert result.lito == 700

    def test_lito_reduces_income_tax(self):
        """$30k: raw IT $1,888 − LITO $700 = $1,188."""
        result = build_tax_breakdown(_make_profile(30_000))
        raw_it = calculate_income_tax(30_000)
        assert raw_it == pytest.approx(1_888, abs=1)
        assert result.income_tax == pytest.approx(raw_it - 700, abs=1)

    def test_lito_phase_out_1(self):
        """$41,250: LITO = $700 − ($3,750 × 0.05) = $512.50."""
        result = build_tax_breakdown(_make_profile(41_250))
        assert result.lito == pytest.approx(512.50, abs=0.01)

    def test_lito_phase_out_2(self):
        """$55,000: LITO = $325 − ($10,000 × 0.015) = $175."""
        result = build_tax_breakdown(_make_profile(55_000))
        assert result.lito == pytest.approx(175, abs=0.01)

    def test_lito_cannot_make_income_tax_negative(self):
        """$19,000: raw IT $128, LITO $700 — IT floors at $0."""
        result = build_tax_breakdown(_make_profile(19_000))
        assert result.income_tax >= 0
        assert result.lito == 700

    def test_lito_zero_income(self):
        """$0: LITO is $700 but IT is $0, so IT stays $0."""
        result = build_tax_breakdown(_make_profile(0))
        assert result.lito == 700
        assert result.income_tax == 0

    def test_lito_in_total_offsets(self):
        """LITO included in total_offsets."""
        result = build_tax_breakdown(_make_profile(30_000))
        expected = result.lito + result.sapto_offset + result.franking_offset
        assert result.total_offsets == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# Tax offsets — SAPTO
# ──────────────────────────────────────────────


class TestSaptoInBreakdown:
    """Tests for SAPTO applied in build_tax_breakdown."""

    def test_sapto_zero_when_not_eligible(self):
        """Not eligible: SAPTO is 0 regardless of income."""
        result = build_tax_breakdown(_make_profile(30_000, sapto=False))
        assert result.sapto_offset == 0

    def test_sapto_full_when_eligible_low_income(self):
        """$30k, eligible: full $2,230 SAPTO."""
        result = build_tax_breakdown(_make_profile(30_000, sapto=True))
        assert result.sapto_offset == 2_230

    def test_sapto_phases_out(self):
        """$42,452, eligible: $2,230 − ($8,920 × 0.125) = $1,115."""
        result = build_tax_breakdown(_make_profile(42_452, sapto=True))
        assert result.sapto_offset == pytest.approx(1_115, abs=1)

    def test_sapto_zero_above_threshold(self):
        """$60k, eligible: above $51,372, no SAPTO."""
        result = build_tax_breakdown(_make_profile(60_000, sapto=True))
        assert result.sapto_offset == 0

    def test_sapto_plus_lito_cannot_go_negative(self):
        """$25k, eligible: raw IT $1,088, LITO $700 + SAPTO $2,230 > IT — floors at $0."""
        result = build_tax_breakdown(_make_profile(25_000, sapto=True))
        assert result.income_tax == 0
        assert result.lito == 700
        assert result.sapto_offset == 2_230

    def test_sapto_reduces_total_tax(self):
        """Eligible taxpayer pays less total tax."""
        without = build_tax_breakdown(_make_profile(40_000, sapto=False))
        with_sapto = build_tax_breakdown(_make_profile(40_000, sapto=True))
        assert with_sapto.total_tax < without.total_tax


# ──────────────────────────────────────────────
# Tax offsets — Franking credits
# ──────────────────────────────────────────────


class TestFrankingInBreakdown:
    """Tests for franking credit offset in build_tax_breakdown."""

    def test_franking_zero_by_default(self):
        result = build_tax_breakdown(_make_profile(100_000))
        assert result.franking_offset == 0

    def test_franking_reduces_income_tax(self):
        """$100k with $2k franking: IT reduced by $2k."""
        without = build_tax_breakdown(_make_profile(100_000))
        with_franking = build_tax_breakdown(_make_profile(100_000, franking=2_000))
        assert with_franking.income_tax == pytest.approx(without.income_tax - 2_000, abs=1)

    def test_franking_refund(self):
        """$20k + $5k franking: raw IT $288 − LITO $700 → $0 − $5k → -$5,000 (refund)."""
        result = build_tax_breakdown(_make_profile(20_000, franking=5_000))
        assert result.income_tax < 0
        assert result.franking_offset == 5_000

    def test_franking_refund_reduces_total_tax(self):
        """Franking refund can make total_tax negative."""
        result = build_tax_breakdown(_make_profile(20_000, franking=5_000))
        assert result.total_tax < 0

    def test_franking_refund_increases_net_income(self):
        """Franking refund increases net income beyond taxable income."""
        result = build_tax_breakdown(_make_profile(20_000, franking=5_000))
        assert result.net_income > result.taxable_income

    def test_franking_in_total_offsets(self):
        result = build_tax_breakdown(_make_profile(100_000, franking=3_000))
        expected = result.lito + result.sapto_offset + result.franking_offset
        assert result.total_offsets == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# Tax offsets — Combined
# ──────────────────────────────────────────────


class TestCombinedOffsets:
    """Tests for multiple offsets applied together."""

    def test_lito_plus_franking(self):
        """$30k + $1k franking: raw IT $1,888 − LITO $700 = $1,188 − franking $1,000 = $188."""
        result = build_tax_breakdown(_make_profile(30_000, franking=1_000))
        assert result.income_tax == pytest.approx(188, abs=1)
        assert result.lito == 700
        assert result.franking_offset == 1_000

    def test_all_three_offsets(self):
        """$30k, SAPTO eligible, $500 franking: all three apply."""
        result = build_tax_breakdown(_make_profile(30_000, sapto=True, franking=500))
        assert result.lito == 700
        assert result.sapto_offset == 2_230
        assert result.franking_offset == 500
        # Raw IT $1,888 − (LITO + SAPTO) → max(0, 1888 - 2930) = $0 − franking $500 = -$500
        assert result.income_tax == pytest.approx(-500, abs=1)

    def test_non_refundable_floor_then_refundable(self):
        """Non-refundable offsets floor at 0, then franking goes negative."""
        result = build_tax_breakdown(_make_profile(19_000, sapto=True, franking=1_000))
        # Raw IT = (19000 - 18200) * 0.16 = $128
        # LITO $700 + SAPTO $2,230 = $2,930 > $128 → floor at $0
        # Then franking $1,000 → -$1,000
        assert result.income_tax == pytest.approx(-1_000, abs=1)

    def test_total_offsets_is_sum(self):
        """total_offsets = lito + sapto_offset + franking_offset always."""
        result = build_tax_breakdown(_make_profile(40_000, sapto=True, franking=2_000))
        assert result.total_offsets == pytest.approx(
            result.lito + result.sapto_offset + result.franking_offset, abs=0.01
        )

    def test_total_tax_components_sum(self):
        """total_tax = income_tax (after offsets) + medicare + mls + hecs."""
        result = build_tax_breakdown(_make_profile(40_000, sapto=True, franking=500, hecs_balance=20_000))
        expected = result.income_tax + result.medicare_levy + result.medicare_levy_surcharge + result.hecs_repayment
        assert result.total_tax == pytest.approx(expected, abs=0.01)

    def test_net_income_with_offsets(self):
        """net_income = taxable_income - total_tax, even with offsets."""
        result = build_tax_breakdown(_make_profile(30_000, sapto=True, franking=1_000))
        assert result.net_income == pytest.approx(result.taxable_income - result.total_tax, abs=0.01)
