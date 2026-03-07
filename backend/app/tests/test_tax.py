"""
Tests for tax engine.
"""

import pytest

from app.engine.tax import calculate_income_tax, calculate_medicare_levy, calculate_medicare_levy_surcharge, \
    calculate_total_medicare_tax


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
    """Tests for total Medicare tax calculation."""

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
