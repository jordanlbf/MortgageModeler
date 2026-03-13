"""
Tests for property tax deduction engine — Division 43 building depreciation.
"""

import pytest

from app.engine.deductions import calculate_division_43_deduction


class TestDivision43FullYear:
    """Tests for full-year (365/366 days) Div 43 deductions."""

    def test_standard_full_year(self):
        """$400k construction, full non-leap year = $10,000."""
        assert calculate_division_43_deduction(400_000, 365, False) == pytest.approx(10_000)

    def test_full_leap_year(self):
        """$400k construction, full leap year = $10,000."""
        assert calculate_division_43_deduction(400_000, 366, True) == pytest.approx(10_000)

    def test_million_dollar_construction(self):
        """$1M construction, full year = $25,000."""
        assert calculate_division_43_deduction(1_000_000, 365, False) == pytest.approx(25_000)

    def test_small_construction_cost(self):
        """$100k construction, full year = $2,500."""
        assert calculate_division_43_deduction(100_000, 365, False) == pytest.approx(2_500)

    def test_large_construction_cost(self):
        """$5M construction, full year = $125,000."""
        assert calculate_division_43_deduction(5_000_000, 365, False) == pytest.approx(125_000)


class TestDivision43ProRata:
    """Tests for pro-rated (partial year) Div 43 deductions."""

    def test_half_year(self):
        """$400k construction, 182 days of 365 = ~$4,986.30."""
        expected = 10_000 * (182 / 365)
        assert calculate_division_43_deduction(400_000, 182, False) == pytest.approx(expected, abs=0.01)

    def test_half_leap_year(self):
        """$400k construction, 183 days of 366 = $5,000."""
        expected = 10_000 * (183 / 366)
        assert calculate_division_43_deduction(400_000, 183, True) == pytest.approx(expected, abs=0.01)

    def test_one_day(self):
        """$400k construction, 1 day of 365 = ~$27.40."""
        expected = 10_000 * (1 / 365)
        assert calculate_division_43_deduction(400_000, 1, False) == pytest.approx(expected, abs=0.01)

    def test_one_day_leap_year(self):
        """$400k construction, 1 day of 366."""
        expected = 10_000 * (1 / 366)
        assert calculate_division_43_deduction(400_000, 1, True) == pytest.approx(expected, abs=0.01)

    def test_90_days(self):
        """$400k construction, 90 days = quarter year approx."""
        expected = 10_000 * (90 / 365)
        assert calculate_division_43_deduction(400_000, 90, False) == pytest.approx(expected, abs=0.01)

    def test_364_days(self):
        """Almost full year — should be slightly less than full deduction."""
        result = calculate_division_43_deduction(400_000, 364, False)
        full = calculate_division_43_deduction(400_000, 365, False)
        assert result < full
        assert result == pytest.approx(10_000 * (364 / 365), abs=0.01)


class TestDivision43DaysValidation:
    """Tests that days_held exceeding days in year raises an error."""

    def test_days_exceeding_365_raises(self):
        """days_held > 365 in non-leap year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 400, False)

    def test_days_exceeding_366_raises_leap(self):
        """days_held > 366 in leap year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 400, True)

    def test_366_in_non_leap_raises(self):
        """366 days in a non-leap year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 366, False)

    def test_367_in_leap_raises(self):
        """367 days in a leap year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 367, True)


class TestDivision43ZeroAndEdgeCases:
    """Tests for zero values and edge cases."""

    def test_zero_construction_cost(self):
        """Zero construction cost = zero deduction."""
        assert calculate_division_43_deduction(0, 365, False) == 0.0

    def test_zero_days_held(self):
        """Zero days held = zero deduction."""
        assert calculate_division_43_deduction(400_000, 0, False) == 0.0

    def test_zero_both(self):
        """Zero cost and zero days = zero deduction."""
        assert calculate_division_43_deduction(0, 0, False) == 0.0

    def test_negative_construction_cost(self):
        """Negative construction cost should return zero or negative — caller's responsibility."""
        result = calculate_division_43_deduction(-100_000, 365, False)
        assert result <= 0.0

    def test_negative_days_held(self):
        """Negative days held should return zero or negative — caller's responsibility."""
        result = calculate_division_43_deduction(400_000, -1, False)
        assert result <= 0.0


class TestDivision43Consistency:
    """Tests for consistent behaviour across inputs."""

    def test_deduction_scales_linearly_with_cost(self):
        """Doubling construction cost should double the deduction."""
        single = calculate_division_43_deduction(400_000, 365, False)
        double = calculate_division_43_deduction(800_000, 365, False)
        assert double == pytest.approx(single * 2)

    def test_deduction_scales_linearly_with_days(self):
        """Doubling days held should double the deduction (within a year)."""
        half = calculate_division_43_deduction(400_000, 100, False)
        full = calculate_division_43_deduction(400_000, 200, False)
        assert full == pytest.approx(half * 2)

    def test_leap_vs_non_leap_full_year_equal(self):
        """Full year deduction should be the same regardless of leap year."""
        non_leap = calculate_division_43_deduction(400_000, 365, False)
        leap = calculate_division_43_deduction(400_000, 366, True)
        assert non_leap == pytest.approx(leap)

    def test_same_days_leap_vs_non_leap_differ(self):
        """Same number of days (e.g. 100) should yield slightly different results for leap vs non-leap."""
        non_leap = calculate_division_43_deduction(400_000, 100, False)
        leap = calculate_division_43_deduction(400_000, 100, True)
        assert non_leap > leap  # 100/365 > 100/366

    def test_deduction_increases_with_days(self):
        """More days held = higher deduction."""
        for d in range(1, 365):
            assert calculate_division_43_deduction(400_000, d + 1, False) > \
                   calculate_division_43_deduction(400_000, d, False)

    def test_always_positive_for_positive_inputs(self):
        """Positive cost and positive days should always yield positive deduction."""
        costs = [1, 1_000, 100_000, 1_000_000]
        days = [1, 30, 182, 365]
        for cost in costs:
            for d in days:
                assert calculate_division_43_deduction(cost, d, False) > 0
