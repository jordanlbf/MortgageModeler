"""
Tests for tax engine.
"""

import pytest

from app.engine.tax import calculate_income_tax

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
        # Using 2023-24 Australian tax brackets for reference
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
