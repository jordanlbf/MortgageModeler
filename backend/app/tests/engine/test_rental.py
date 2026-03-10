"""
Tests for rental calculation engine — gross annual rent and
effective (vacancy-adjusted) annual rent.
"""

import pytest

from app.engine.rental import (
    calculate_gross_annual_rent,
    calculate_effective_annual_rent,
)


class TestCalculateGrossAnnualRent:
    """Tests for calculate_gross_annual_rent."""

    # ── Basic calculations ──────────────────────────────────────────────

    def test_year_one_no_growth(self):
        """Year 1 with no growth: weekly * 52."""
        assert calculate_gross_annual_rent(1, 500.0, 0.0) == 26_000.0

    def test_zero_rent(self):
        """Zero weekly rent should always return zero."""
        assert calculate_gross_annual_rent(1, 0.0, 0.05) == 0.0

    def test_zero_rent_future_year(self):
        """Zero rent stays zero regardless of year and growth."""
        assert calculate_gross_annual_rent(5, 0.0, 0.10) == 0.0

    # ── Compound growth ─────────────────────────────────────────────────

    def test_year_two_with_growth(self):
        """Year 2 at 5% growth: 500 * 52 * 1.05."""
        result = calculate_gross_annual_rent(2, 500.0, 0.05)
        assert result == pytest.approx(27_300.0)

    def test_year_three_with_growth(self):
        """Year 3 at 5% growth: 500 * 52 * 1.05^2."""
        result = calculate_gross_annual_rent(3, 500.0, 0.05)
        assert result == pytest.approx(28_665.0)

    def test_year_five_with_growth(self):
        """Year 5 at 3% growth: 600 * 52 * 1.03^4."""
        result = calculate_gross_annual_rent(5, 600.0, 0.03)
        expected = 600 * 52 * (1.03 ** 4)
        assert result == pytest.approx(expected)

    def test_year_ten_with_growth(self):
        """Year 10 at 4% growth: 450 * 52 * 1.04^9."""
        result = calculate_gross_annual_rent(10, 450.0, 0.04)
        expected = 450 * 52 * (1.04 ** 9)
        assert result == pytest.approx(expected)

    def test_growth_compounds_not_linear(self):
        """Verify growth is compounding, not linear."""
        year_2 = calculate_gross_annual_rent(2, 500.0, 0.10)
        year_3 = calculate_gross_annual_rent(3, 500.0, 0.10)
        # Year 3 increase should be larger than year 2 increase
        year_1 = calculate_gross_annual_rent(1, 500.0, 0.10)
        assert (year_3 - year_2) > (year_2 - year_1)

    # ── Zero growth ─────────────────────────────────────────────────────

    def test_no_growth_stays_flat(self):
        """With 0% growth, every year should be the same."""
        year_1 = calculate_gross_annual_rent(1, 500.0, 0.0)
        year_5 = calculate_gross_annual_rent(5, 500.0, 0.0)
        year_10 = calculate_gross_annual_rent(10, 500.0, 0.0)
        assert year_1 == year_5 == year_10 == 26_000.0

    # ── Edge cases ──────────────────────────────────────────────────────

    def test_very_small_rent(self):
        """Small weekly rent should still calculate correctly."""
        result = calculate_gross_annual_rent(1, 1.0, 0.0)
        assert result == 52.0

    def test_large_rent(self):
        """Large weekly rent should calculate correctly."""
        result = calculate_gross_annual_rent(1, 5_000.0, 0.0)
        assert result == 260_000.0

    def test_high_growth_rate(self):
        """High but valid growth rate (100%) should double each year."""
        year_1 = calculate_gross_annual_rent(1, 100.0, 1.0)
        year_2 = calculate_gross_annual_rent(2, 100.0, 1.0)
        assert year_2 == pytest.approx(year_1 * 2)

    def test_year_one_growth_has_no_effect(self):
        """Year 1 should always equal weekly * 52 regardless of growth rate."""
        assert calculate_gross_annual_rent(1, 500.0, 0.0) == calculate_gross_annual_rent(1, 500.0, 0.50)


class TestCalculateEffectiveAnnualRent:
    """Tests for calculate_effective_annual_rent."""

    # ── Basic calculations ──────────────────────────────────────────────

    def test_no_vacancy(self):
        """Zero vacancy should equal gross rent."""
        gross = calculate_gross_annual_rent(1, 500.0, 0.0)
        effective = calculate_effective_annual_rent(1, 0.0, 500.0, 0.0)
        assert effective == gross

    def test_full_vacancy(self):
        """100% vacancy should return zero."""
        result = calculate_effective_annual_rent(1, 1.0, 500.0, 0.0)
        assert result == 0.0

    def test_partial_vacancy(self):
        """5% vacancy reduces gross by 5%."""
        gross = calculate_gross_annual_rent(1, 500.0, 0.0)
        effective = calculate_effective_annual_rent(1, 0.05, 500.0, 0.0)
        assert effective == pytest.approx(gross * 0.95)

    def test_ten_percent_vacancy(self):
        """10% vacancy on $600/week year 1."""
        effective = calculate_effective_annual_rent(1, 0.10, 600.0, 0.0)
        expected = 600 * 52 * 0.90
        assert effective == pytest.approx(expected)

    # ── Vacancy with growth ─────────────────────────────────────────────

    def test_vacancy_with_growth_year_two(self):
        """Vacancy and growth should both apply. Year 2, 5% growth, 5% vacancy."""
        effective = calculate_effective_annual_rent(2, 0.05, 500.0, 0.05)
        expected = 500 * 52 * 1.05 * 0.95
        assert effective == pytest.approx(expected)

    def test_vacancy_with_growth_year_five(self):
        """Year 5 at 3% growth with 8% vacancy."""
        effective = calculate_effective_annual_rent(5, 0.08, 700.0, 0.03)
        expected = 700 * 52 * (1.03 ** 4) * 0.92
        assert effective == pytest.approx(expected)

    def test_vacancy_applied_after_growth(self):
        """Verify vacancy is applied to the grown gross, not the base."""
        effective_y3 = calculate_effective_annual_rent(3, 0.10, 500.0, 0.05)
        gross_y3 = calculate_gross_annual_rent(3, 500.0, 0.05)
        assert effective_y3 == pytest.approx(gross_y3 * 0.90)

    # ── Zero rent ───────────────────────────────────────────────────────

    def test_zero_rent_with_vacancy(self):
        """Zero rent should return zero regardless of vacancy."""
        assert calculate_effective_annual_rent(1, 0.05, 0.0, 0.0) == 0.0

    def test_zero_rent_with_growth_and_vacancy(self):
        """Zero rent stays zero even with growth and vacancy."""
        assert calculate_effective_annual_rent(5, 0.10, 0.0, 0.05) == 0.0

    # ── Edge cases ──────────────────────────────────────────────────────

    def test_very_small_vacancy(self):
        """1% vacancy should reduce by 1%."""
        gross = calculate_gross_annual_rent(1, 500.0, 0.0)
        effective = calculate_effective_annual_rent(1, 0.01, 500.0, 0.0)
        assert effective == pytest.approx(gross * 0.99)

    def test_high_vacancy(self):
        """90% vacancy should leave only 10% of gross."""
        gross = calculate_gross_annual_rent(1, 500.0, 0.0)
        effective = calculate_effective_annual_rent(1, 0.90, 500.0, 0.0)
        assert effective == pytest.approx(gross * 0.10)

    def test_consistency_with_gross(self):
        """Effective should always be <= gross for any valid vacancy rate."""
        for vacancy in [0.0, 0.05, 0.10, 0.25, 0.50, 1.0]:
            gross = calculate_gross_annual_rent(3, 500.0, 0.05)
            effective = calculate_effective_annual_rent(3, vacancy, 500.0, 0.05)
            assert effective <= gross
