"""
Tests for tax engine.
"""

import pytest

from app.engine.tax import calculate_income_tax, calculate_medicare_levy, calculate_medicare_levy_surcharge, \
    calculate_total_medicare_tax, calculate_hecs_repayment, calculate_total_tax


class TestIncomeTax:
    """Tests for income tax calculation."""

    def test_income_tax_zero(self):
        """Zero taxable income should yield zero tax."""
        assert calculate_income_tax(0) == 0

    def test_income_tax_negative(self):
        """Negative taxable income should yield zero tax."""
        assert calculate_income_tax(-1000) == 0

    def test_income_boundary_threshold(self):
        """Test taxable income at the boundary of tax brackets."""
        # Using 2025-26 Australian tax brackets for reference
        assert calculate_income_tax(18200) == 0
        assert calculate_income_tax(18201) == 0.16  # 1 dollar over threshold
        assert calculate_income_tax(45000) == 4288  # 45000 - 18200 = 26800 * 0.16
        assert calculate_income_tax(45001) == 4288 + 0.3  # 1 dollar over threshold
        assert calculate_income_tax(135000) == 31_288  # 135000 - 45000 = 90000 * 0.3 + 4288
        assert calculate_income_tax(135001) == 31_288 + 0.37 # 1 dollar over threshold
        assert calculate_income_tax(190000) == 51_638  # 190000 - 135000 = 55000 * 0.37 + 31288
        assert calculate_income_tax(190001) == 51_638 + 0.45  # 1 dollar over threshold

    def test_income_mid_boundaries(self):
        """Test taxable income within each bracket."""
        assert calculate_income_tax(12_345) == pytest.approx(0, abs=0.1)  # Below first threshold
        assert calculate_income_tax(30_000) == pytest.approx(1_888, abs=0.1)  # 1st <> 2nd bracket
        assert calculate_income_tax(66_666) == pytest.approx(10_787.8, abs=0.1)  # 2nd <> 3rd bracket
        assert calculate_income_tax(145_145) == pytest.approx(35_041.65, abs=0.1) # 3rd <> 4th bracket
        assert calculate_income_tax(1_000_000) == pytest.approx(416_138, abs=0.1)  # Above last threshold

    def test_income_tax_fractional_income(self):
        """Test fractional taxable income."""
        assert calculate_income_tax(45_000.50) == pytest.approx(4288 + 0.3 * 0.50, abs=0.1)

    def test_income_tax_large_income(self):
        """Test very large taxable income."""
        assert calculate_income_tax(10_000_000) == pytest.approx(4_466_138, abs=0.1)

    def test_income_tax_edge_case(self):
        """Test edge case where taxable income is exactly at the threshold."""
        assert calculate_income_tax(18_200) == 0
        assert calculate_income_tax(45_000) == 4288
        assert calculate_income_tax(135_000) == 31_288
        assert calculate_income_tax(190_000) == 51_638


class TestMedicareLevyTax:
    """Tests for Medicare Levy tax calculation."""

    def test_medicare_levy_zero(self):
        """Zero taxable income should yield zero Medicare levy."""
        assert calculate_medicare_levy(0) == 0

    def test_medicare_levy_below_threshold(self):
        """Taxable income below lower threshold should yield zero Medicare levy."""
        assert calculate_medicare_levy(27_000) == 0
        assert calculate_medicare_levy(7_000) == 0

    def test_medicare_levy_phase_in(self):
        """Taxable income between lower and upper threshold should yield phased-in Medicare levy."""
        assert calculate_medicare_levy(30_000) == pytest.approx((30_000 - 27_222) * 0.10, abs=0.1)
        assert calculate_medicare_levy(33_000) == pytest.approx((33_000 - 27_222) * 0.10, abs=0.1)

    def test_medicare_levy_above_threshold(self):
        """Taxable income above upper threshold should yield full Medicare levy."""
        assert calculate_medicare_levy(35_000) == pytest.approx(35_000 * 0.02, abs=0.1)
        assert calculate_medicare_levy(100_000) == pytest.approx(100_000 * 0.02, abs=0.1)

    def test_medicare_levy_negative_income(self):
        """Negative taxable income should yield zero Medicare levy."""
        assert calculate_medicare_levy(-10_000) == 0

    def test_medicare_levy_exact_thresholds(self):
        """Test taxable income exactly at thresholds."""
        assert calculate_medicare_levy(27_222) == 0
        assert calculate_medicare_levy(34_027) == pytest.approx(34_027 * 0.02, abs=0.1)


class TestMedicareLevySurchargeTax:
    """Tests for Medicare Levy Surcharge tax calculation."""

    def test_medicare_levy_surcharge_below_threshold(self):
        """MLS income below first threshold should yield zero surcharge."""
        assert calculate_medicare_levy_surcharge(100_000) == 0

    def test_medicare_levy_surcharge_first_threshold(self):
        """MLS income between first and second threshold should yield 1% surcharge."""
        assert calculate_medicare_levy_surcharge(110_000) == pytest.approx(110_000 * 0.01, abs=0.1)

    def test_medicare_levy_surcharge_second_threshold(self):
        """MLS income between second and third threshold should yield 1.25% surcharge."""
        assert calculate_medicare_levy_surcharge(130_000) == pytest.approx(130_000 * 0.0125, abs=0.1)

    def test_medicare_levy_surcharge_above_threshold(self):
        """MLS income above third threshold should yield 1.5% surcharge."""
        assert calculate_medicare_levy_surcharge(160_000) == pytest.approx(160_000 * 0.015, abs=0.1)
        assert calculate_medicare_levy_surcharge(200_000) == pytest.approx(200_000 * 0.015, abs=0.1)

    def test_medicare_levy_surcharge_negative_income(self):
        """Negative MLS income should yield zero surcharge."""
        assert calculate_medicare_levy_surcharge(-50_000) == 0

    def test_medicare_levy_surcharge_exact_thresholds(self):
        """Test MLS income exactly at thresholds."""
        assert calculate_medicare_levy_surcharge(101_000) == 0
        assert calculate_medicare_levy_surcharge(118_000) == pytest.approx(118_000 * 0.01, abs=0.1)
        assert calculate_medicare_levy_surcharge(158_000) == pytest.approx(158_000 * 0.0125, abs=0.1)

    def test_medicare_levy_surcharge_zero_income(self):
        """Zero MLS income should yield zero surcharge."""
        assert calculate_medicare_levy_surcharge(0) == 0

    def test_medicare_levy_surcharge_just_below_threshold(self):
        """MLS income just below thresholds should yield correct surcharge."""
        assert calculate_medicare_levy_surcharge(100_999) == 0
        assert calculate_medicare_levy_surcharge(117_999) == pytest.approx(117_999 * 0.01, abs=0.1)
        assert calculate_medicare_levy_surcharge(157_999) == pytest.approx(157_999 * 0.0125, abs=0.1)

    def test_medicare_levy_surcharge_just_above_threshold(self):
        """MLS income just above thresholds should yield correct surcharge."""
        assert calculate_medicare_levy_surcharge(101_001) == pytest.approx(101_001 * 0.01, abs=0.1)
        assert calculate_medicare_levy_surcharge(118_001) == pytest.approx(118_001 * 0.0125, abs=0.1)
        assert calculate_medicare_levy_surcharge(158_001) == pytest.approx(158_001 * 0.015, abs=0.1)

    def test_medicare_levy_surcharge_large_income(self):
        """Test very large MLS income."""
        assert calculate_medicare_levy_surcharge(1_000_000) == pytest.approx(1_000_000 * 0.015, abs=0.1)

    def test_medicare_levy_surcharge_fractional_income(self):
        """Test fractional MLS income."""
        assert calculate_medicare_levy_surcharge(150_000.50) == pytest.approx(150_000.50 * 0.0125, abs=0.1)


class TestMedicareTax:
    """Tests for total Medicare tax calculations."""

    def test_total_medicare_tax_no_private_health(self):
        """Test total Medicare tax without private health insurance."""
        # ML: (30_000 - 27_222) * 0.10 = 277.80
        # MLS: 110_000 * 0.01 = 1_100
        assert calculate_total_medicare_tax(30_000, 110_000, False) == pytest.approx(1_377.80, abs=0.1)

    def test_total_medicare_tax_with_private_health(self):
        """Test total Medicare tax with private health insurance."""
        # ML: (30_000 - 27_222) * 0.10 = 277.80
        # MLS: skipped (has private health)
        assert calculate_total_medicare_tax(30_000, 110_000, True) == pytest.approx(277.80, abs=0.1)

    def test_total_medicare_tax_zero_income(self):
        """Test total Medicare tax with zero taxable and MLS income."""
        assert calculate_total_medicare_tax(0, 0, False) == 0

    def test_total_medicare_tax_negative_income(self):
        """Test total Medicare tax with negative taxable and MLS income."""
        assert calculate_total_medicare_tax(-10_000, -50_000, False) == 0


class TestHecsTax:
    """Tests for HECS tax calculations."""

    def test_hecs_no_income(self):
        """Test HECS no income"""
        assert calculate_hecs_repayment(0, float('inf')) == 0

    def test_hecs_below_threshold(self):
        """Test HECS income below min threshold"""
        assert calculate_hecs_repayment(50_000, float('inf')) == 0

    def test_hecs_at_exact_threshold(self):
        """Test HECS income at exact thresholds"""
        assert calculate_hecs_repayment(67_000, float('inf')) == pytest.approx(0, abs=0.1)  # 1st Threshold
        assert calculate_hecs_repayment(125_000, float('inf')) == pytest.approx(8_700, abs=0.1)  # 2nd Threshold
        assert calculate_hecs_repayment(179_285, float('inf')) == pytest.approx(17_928.45, abs=0.1)  # 3nd Threshold

    def test_hecs_mid_thresholds(self):
        """Test HECS income inbetween thresholds"""
        assert calculate_hecs_repayment(80_000, float('inf')) == pytest.approx(1_950, abs=0.1) # 1st <> 2nd Thresholds
        assert calculate_hecs_repayment(150_000, float('inf')) == pytest.approx(12_950, abs=0.1)  # 2nd <> 3rd Thresholds

    def test_hecs_above_threshold(self):
        """Test HECS above max threshold"""
        assert calculate_hecs_repayment(179_286, float('inf')) == pytest.approx(17_928.6, abs=0.1)
        for i in range(180_000, 1_000_000, 25_000):
            assert calculate_hecs_repayment(i, float('inf')) == pytest.approx(i/10, abs=0.1) # 10% above max threshold

    def test_hecs_no_hecs_balance(self):
        """Test HECS when no HECS Balance remaining"""
        assert calculate_hecs_repayment(80_000, 0) == pytest.approx(0, abs=0.1)  # 1st <> 2nd Thresholds
        assert calculate_hecs_repayment(150_000, 0) == pytest.approx(0, abs=0.1)  # 2nd <> 3rd Thresholds
        assert calculate_hecs_repayment(800_000, 0) == pytest.approx(0, abs=0.1) # Above max threshold

    def test_hecs_balance_less_than_owing(self):
        """Test HECS when owing repayment is greater than balance remaining"""
        assert calculate_hecs_repayment(80_000, 1_000) == pytest.approx(1_000, abs=0.1)  # 1st <> 2nd Thresholds
        assert calculate_hecs_repayment(150_000, 6_000) == pytest.approx(6_000, abs=0.1)  # 2nd <> 3rd Thresholds
        assert calculate_hecs_repayment(800_000, 20_000) == pytest.approx(20_000, abs=0.1)  # Above max threshold


class TestTotalTax:
    """Tests for total tax calculation (income tax + medicare + MLS + HECS)."""

    # ── Zero / Negative income ──────────────────────────

    def test_total_tax_all_zeros(self):
        """All zero inputs should yield zero total tax."""
        assert calculate_total_tax(0, 0, 0, 0, False) == 0

    def test_total_tax_negative_incomes(self):
        """Negative incomes should yield zero total tax."""
        assert calculate_total_tax(-50_000, -50_000, -50_000, 0, False) == 0

    # ── Income tax only (below Medicare threshold) ──────

    def test_total_tax_low_income_no_medicare(self):
        """Income between tax-free and Medicare thresholds: income tax only."""
        # IT: (20,000 - 18,200) * 0.16 = $288
        # ML: below $27,222 -> $0
        assert calculate_total_tax(20_000, 20_000, 20_000, 0, True) == pytest.approx(288, abs=0.1)

    def test_total_tax_below_tax_free_threshold(self):
        """Income below $18,200 should yield zero total tax."""
        assert calculate_total_tax(15_000, 15_000, 15_000, 0, False) == 0

    # ── Income tax + Medicare levy (phase-in) ───────────

    def test_total_tax_medicare_phase_in(self):
        """Income in Medicare phase-in range."""
        # IT: (30,000 - 18,200) * 0.16 = $1,888
        # ML: (30,000 - 27,222) * 0.10 = $277.80
        assert calculate_total_tax(30_000, 30_000, 30_000, 0, True) == pytest.approx(2_165.80, abs=0.1)

    # ── Typical salary, no HECS, has private health ─────

    def test_total_tax_typical_salary_private_health(self):
        """$100k salary, private health, no HECS."""
        # IT: 4,288 + (100,000 - 45,000) * 0.30 = $20,788
        # ML: 100,000 * 0.02 = $2,000
        # MLS: skipped (has private health)
        # HECS: balance 0 -> $0
        assert calculate_total_tax(100_000, 100_000, 100_000, 0, True) == pytest.approx(22_788, abs=0.1)

    # ── Typical salary, no HECS, no private health ──────

    def test_total_tax_no_private_health_below_mls(self):
        """$100k salary, no private health, below MLS threshold."""
        # IT: $20,788
        # ML: $2,000
        # MLS: 100,000 <= 101,000 -> $0
        assert calculate_total_tax(100_000, 100_000, 100_000, 0, False) == pytest.approx(22_788, abs=0.1)

    def test_total_tax_no_private_health_above_mls(self):
        """$120k salary, no private health, triggers MLS."""
        # IT: 4,288 + (120,000 - 45,000) * 0.30 = $26,788
        # ML: 120,000 * 0.02 = $2,400
        # MLS: 120,000 > 118,000 -> 120,000 * 0.0125 = $1,500
        # HECS: balance 0 -> $0
        assert calculate_total_tax(120_000, 120_000, 120_000, 0, False) == pytest.approx(30_688, abs=0.1)

    # ── Private health toggle ───────────────────────────

    def test_total_tax_private_health_removes_mls(self):
        """Private health should eliminate MLS component only."""
        no_phi = calculate_total_tax(120_000, 120_000, 120_000, 0, False)
        with_phi = calculate_total_tax(120_000, 120_000, 120_000, 0, True)
        # Difference should be exactly the MLS: 120,000 * 0.0125 = $1,500
        assert no_phi - with_phi == pytest.approx(1_500, abs=0.1)

    # ── With HECS ───────────────────────────────────────

    def test_total_tax_with_hecs(self):
        """$100k salary with HECS balance."""
        # IT: $20,788
        # ML: $2,000
        # MLS: 100,000 <= 101,000 -> $0
        # HECS: (100,000 - 67,000) * 0.15 = $4,950
        assert calculate_total_tax(100_000, 100_000, 100_000, 25_000, True) == pytest.approx(27_738, abs=0.1)

    def test_total_tax_hecs_above_top_threshold(self):
        """$200k salary with HECS, above top HECS threshold."""
        # IT: 51,638 + (200,000 - 190,000) * 0.45 = $56,138
        # ML: 200,000 * 0.02 = $4,000
        # MLS: 200,000 * 0.015 = $3,000 (no private health)
        # HECS: 200,000 * 0.10 = $20,000
        assert calculate_total_tax(200_000, 200_000, 200_000, 50_000, False) == pytest.approx(83_138, abs=0.1)

    def test_total_tax_hecs_balance_caps_repayment(self):
        """HECS repayment should be capped at remaining balance."""
        # IT at $150k: 4,288 + 27,000 + (150,000 - 135,000) * 0.37 = $36,838
        # ML: 150,000 * 0.02 = $3,000
        # MLS: skipped (has private health)
        # HECS: min(12,950, 5,000) = $5,000
        assert calculate_total_tax(150_000, 150_000, 150_000, 5_000, True) == pytest.approx(44_838, abs=0.1)

    def test_total_tax_hecs_zero_balance(self):
        """Zero HECS balance should contribute nothing."""
        with_hecs = calculate_total_tax(100_000, 100_000, 100_000, 25_000, True)
        without_hecs = calculate_total_tax(100_000, 100_000, 100_000, 0, True)
        assert with_hecs > without_hecs
        assert without_hecs == pytest.approx(22_788, abs=0.1)

    # ── Divergent incomes (negative gearing scenario) ───

    def test_total_tax_divergent_incomes(self):
        """TI differs from RI/MLSI (e.g., $20k rental loss added back for RI/MLSI)."""
        # TI: $80,000 (salary $100k minus $20k rental loss)
        # RI/MLSI: $100,000 (loss added back)
        # IT: 4,288 + (80,000 - 45,000) * 0.30 = $14,788
        # ML: 80,000 * 0.02 = $1,600
        # MLS: 100,000 <= 101,000 -> $0
        # HECS: (100,000 - 67,000) * 0.15 = $4,950
        assert calculate_total_tax(80_000, 100_000, 100_000, 25_000, False) == pytest.approx(21_338, abs=0.1)

    def test_total_tax_negative_gearing_reduces_tax(self):
        """Negative gearing should reduce total tax via lower TI but not RI/MLSI."""
        no_gearing = calculate_total_tax(100_000, 100_000, 100_000, 25_000, False)
        with_gearing = calculate_total_tax(80_000, 100_000, 100_000, 25_000, False)
        # Gearing reduces IT and ML but not HECS or MLS
        assert with_gearing < no_gearing

    # ── All components active ───────────────────────────

    def test_total_tax_all_components(self):
        """High income, no private health, has HECS — all components contribute."""
        # IT at $160k: 4,288 + 27,000 + (160,000 - 135,000) * 0.37 = $40,538
        # ML: 160,000 * 0.02 = $3,200
        # MLS: 160,000 > 158,000 -> 160,000 * 0.015 = $2,400
        # HECS: 8,700 + (160,000 - 125,000) * 0.17 = $14,650
        assert calculate_total_tax(160_000, 160_000, 160_000, 50_000, False) == pytest.approx(60_788, abs=0.1)

    # ── Sum of components verification ──────────────────

    def test_total_tax_equals_sum_of_components(self):
        """Total tax should equal the sum of individual component functions."""
        ti, ri, mlsi, hecs_bal, phi = 130_000, 140_000, 135_000, 30_000, False
        expected = (
            calculate_income_tax(ti) +
            calculate_total_medicare_tax(ti, mlsi, phi) +
            calculate_hecs_repayment(ri, hecs_bal)
        )
        assert calculate_total_tax(ti, ri, mlsi, hecs_bal, phi) == pytest.approx(expected, abs=0.01)

    def test_total_tax_equals_sum_of_components_with_phi(self):
        """Sum of components verification with private health."""
        ti, ri, mlsi, hecs_bal, phi = 180_000, 180_000, 180_000, 10_000, True
        expected = (
            calculate_income_tax(ti) +
            calculate_total_medicare_tax(ti, mlsi, phi) +
            calculate_hecs_repayment(ri, hecs_bal)
        )
        assert calculate_total_tax(ti, ri, mlsi, hecs_bal, phi) == pytest.approx(expected, abs=0.01)

    # ── Very large income ───────────────────────────────

    def test_total_tax_very_large_income(self):
        """$1M income, all components."""
        # IT: 51,638 + (1,000,000 - 190,000) * 0.45 = $416,138
        # ML: 1,000,000 * 0.02 = $20,000
        # MLS: 1,000,000 * 0.015 = $15,000
        # HECS: 1,000,000 * 0.10 = $100,000
        assert calculate_total_tax(1_000_000, 1_000_000, 1_000_000, 200_000, False) == pytest.approx(551_138, abs=0.1)

    def test_total_tax_very_large_income_hecs_capped(self):
        """$1M income but small HECS balance."""
        # Same as above but HECS capped at $5,000 instead of $100,000
        assert calculate_total_tax(1_000_000, 1_000_000, 1_000_000, 5_000, False) == pytest.approx(456_138, abs=0.1)
