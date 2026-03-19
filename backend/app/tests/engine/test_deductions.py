"""
Tests for property tax deduction engine — Division 43 and Division 40 depreciation.
"""

import pytest

from datetime import date

from app.engine.deductions import (
    calculate_division_43_deduction,
    calculate_division_40_prime_cost,
    calculate_division_40_diminishing_value,
    is_building_depreciable,
    is_asset_depreciable,
    calculate_borrowing_cost_deduction,
)


class TestDivision43FullYear:
    """Tests for full-year (365/366 days) Div 43 deductions."""

    def test_standard_full_year(self):
        """$400k construction, full 365-day year = $10,000."""
        assert calculate_division_43_deduction(400_000, 365) == pytest.approx(10_000)

    def test_full_366_day_year(self):
        """$400k construction, full 366-day year = $10,000."""
        assert calculate_division_43_deduction(400_000, 366, 366) == pytest.approx(10_000)

    def test_million_dollar_construction(self):
        """$1M construction, full year = $25,000."""
        assert calculate_division_43_deduction(1_000_000, 365) == pytest.approx(25_000)

    def test_small_construction_cost(self):
        """$100k construction, full year = $2,500."""
        assert calculate_division_43_deduction(100_000, 365) == pytest.approx(2_500)

    def test_large_construction_cost(self):
        """$5M construction, full year = $125,000."""
        assert calculate_division_43_deduction(5_000_000, 365) == pytest.approx(125_000)


class TestDivision43ProRata:
    """Tests for pro-rated (partial year) Div 43 deductions."""

    def test_half_year(self):
        """$400k construction, 182 days of 365 = ~$4,986.30."""
        expected = 10_000 * (182 / 365)
        assert calculate_division_43_deduction(400_000, 182) == pytest.approx(expected, abs=0.01)

    def test_half_366_day_year(self):
        """$400k construction, 183 days of 366 = $5,000."""
        expected = 10_000 * (183 / 366)
        assert calculate_division_43_deduction(400_000, 183, 366) == pytest.approx(expected, abs=0.01)

    def test_one_day(self):
        """$400k construction, 1 day of 365 = ~$27.40."""
        expected = 10_000 * (1 / 365)
        assert calculate_division_43_deduction(400_000, 1) == pytest.approx(expected, abs=0.01)

    def test_one_day_366(self):
        """$400k construction, 1 day of 366."""
        expected = 10_000 * (1 / 366)
        assert calculate_division_43_deduction(400_000, 1, 366) == pytest.approx(expected, abs=0.01)

    def test_90_days(self):
        """$400k construction, 90 days = quarter year approx."""
        expected = 10_000 * (90 / 365)
        assert calculate_division_43_deduction(400_000, 90) == pytest.approx(expected, abs=0.01)

    def test_364_days(self):
        """Almost full year — should be slightly less than full deduction."""
        result = calculate_division_43_deduction(400_000, 364)
        full = calculate_division_43_deduction(400_000, 365)
        assert result < full
        assert result == pytest.approx(10_000 * (364 / 365), abs=0.01)


class TestDivision43DaysValidation:
    """Tests that days_held exceeding days in year raises an error."""

    def test_days_exceeding_365_raises(self):
        """days_held > 365 in a 365-day year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 400, 365)

    def test_days_exceeding_366_raises(self):
        """days_held > 366 in a 366-day year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 400, 366)

    def test_366_in_365_day_year_raises(self):
        """366 days in a 365-day year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 366, 365)

    def test_367_in_366_day_year_raises(self):
        """367 days in a 366-day year should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 367, 366)

    def test_invalid_days_in_year_raises(self):
        """days_in_year not 365 or 366 should raise ValueError."""
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 100, 364)
        with pytest.raises(ValueError):
            calculate_division_43_deduction(400_000, 100, 367)


class TestDivision43ZeroAndEdgeCases:
    """Tests for zero values and edge cases."""

    def test_zero_construction_cost(self):
        """Zero construction cost = zero deduction."""
        assert calculate_division_43_deduction(0, 365) == 0.0

    def test_zero_days_held(self):
        """Zero days held = zero deduction."""
        assert calculate_division_43_deduction(400_000, 0) == 0.0

    def test_zero_both(self):
        """Zero cost and zero days = zero deduction."""
        assert calculate_division_43_deduction(0, 0) == 0.0

    def test_negative_construction_cost(self):
        """Negative construction cost should return zero or negative — caller's responsibility."""
        result = calculate_division_43_deduction(-100_000, 365)
        assert result <= 0.0

    def test_negative_days_held(self):
        """Negative days held should return zero or negative — caller's responsibility."""
        result = calculate_division_43_deduction(400_000, -1)
        assert result <= 0.0


class TestDivision43Consistency:
    """Tests for consistent behaviour across inputs."""

    def test_deduction_scales_linearly_with_cost(self):
        """Doubling construction cost should double the deduction."""
        single = calculate_division_43_deduction(400_000, 365)
        double = calculate_division_43_deduction(800_000, 365)
        assert double == pytest.approx(single * 2)

    def test_deduction_scales_linearly_with_days(self):
        """Doubling days held should double the deduction (within a year)."""
        half = calculate_division_43_deduction(400_000, 100)
        full = calculate_division_43_deduction(400_000, 200)
        assert full == pytest.approx(half * 2)

    def test_365_vs_366_full_year_equal(self):
        """Full year deduction should be the same regardless of days in year."""
        y365 = calculate_division_43_deduction(400_000, 365, 365)
        y366 = calculate_division_43_deduction(400_000, 366, 366)
        assert y365 == pytest.approx(y366)

    def test_same_days_different_year_length_differ(self):
        """Same number of days (e.g. 100) should yield slightly different results for 365 vs 366."""
        y365 = calculate_division_43_deduction(400_000, 100, 365)
        y366 = calculate_division_43_deduction(400_000, 100, 366)
        assert y365 > y366  # 100/365 > 100/366

    def test_deduction_increases_with_days(self):
        """More days held = higher deduction."""
        for d in range(1, 365):
            assert calculate_division_43_deduction(400_000, d + 1) > \
                   calculate_division_43_deduction(400_000, d)

    def test_always_positive_for_positive_inputs(self):
        """Positive cost and positive days should always yield positive deduction."""
        costs = [1, 1_000, 100_000, 1_000_000]
        days = [1, 30, 182, 365]
        for cost in costs:
            for d in days:
                assert calculate_division_43_deduction(cost, d) > 0


# ──────────────────────────────────────────────
# Division 40 — Prime Cost
# ──────────────────────────────────────────────


class TestDivision40PrimeCostFullYear:
    """Tests for full-year prime cost deductions."""

    def test_standard_10_year_life(self):
        """$2,000 asset, 10 year life, full year = $200."""
        assert calculate_division_40_prime_cost(2_000, 10, 365) == pytest.approx(200)

    def test_full_366_day_year(self):
        """$2,000 asset, 10 year life, full 366-day year = $200."""
        assert calculate_division_40_prime_cost(2_000, 10, 366, 366) == pytest.approx(200)

    def test_5_year_life(self):
        """$5,000 asset, 5 year life, full year = $1,000."""
        assert calculate_division_40_prime_cost(5_000, 5, 365) == pytest.approx(1_000)

    def test_1_year_life(self):
        """$1,000 asset, 1 year life, full year = $1,000."""
        assert calculate_division_40_prime_cost(1_000, 1, 365) == pytest.approx(1_000)

    def test_20_year_life(self):
        """$10,000 asset, 20 year life, full year = $500."""
        assert calculate_division_40_prime_cost(10_000, 20, 365) == pytest.approx(500)


class TestDivision40PrimeCostProRata:
    """Tests for pro-rated prime cost deductions."""

    def test_half_year(self):
        """$2,000 asset, 10 year life, 182 days."""
        expected = 200 * (182 / 365)
        assert calculate_division_40_prime_cost(2_000, 10, 182) == pytest.approx(expected, abs=0.01)

    def test_one_day(self):
        """$2,000 asset, 10 year life, 1 day."""
        expected = 200 * (1 / 365)
        assert calculate_division_40_prime_cost(2_000, 10, 1) == pytest.approx(expected, abs=0.01)

    def test_90_days(self):
        """$2,000 asset, 10 year life, 90 days."""
        expected = 200 * (90 / 365)
        assert calculate_division_40_prime_cost(2_000, 10, 90) == pytest.approx(expected, abs=0.01)


class TestDivision40PrimeCostConsistency:
    """Tests for consistent behaviour of prime cost method."""

    def test_scales_linearly_with_cost(self):
        """Doubling cost should double the deduction."""
        single = calculate_division_40_prime_cost(2_000, 10, 365)
        double = calculate_division_40_prime_cost(4_000, 10, 365)
        assert double == pytest.approx(single * 2)

    def test_scales_linearly_with_days(self):
        """Doubling days should double the deduction."""
        half = calculate_division_40_prime_cost(2_000, 10, 100)
        full = calculate_division_40_prime_cost(2_000, 10, 200)
        assert full == pytest.approx(half * 2)

    def test_shorter_life_higher_deduction(self):
        """Shorter effective life = higher annual deduction."""
        short = calculate_division_40_prime_cost(2_000, 5, 365)
        long = calculate_division_40_prime_cost(2_000, 10, 365)
        assert short > long

    def test_full_year_same_across_years(self):
        """Prime cost gives the same deduction every full year."""
        year_1 = calculate_division_40_prime_cost(2_000, 10, 365)
        year_2 = calculate_division_40_prime_cost(2_000, 10, 365)
        assert year_1 == pytest.approx(year_2)

    def test_365_vs_366_full_year_equal(self):
        """Full year deduction should be the same regardless of days in year."""
        y365 = calculate_division_40_prime_cost(2_000, 10, 365, 365)
        y366 = calculate_division_40_prime_cost(2_000, 10, 366, 366)
        assert y365 == pytest.approx(y366)


# ──────────────────────────────────────────────
# Division 40 — Diminishing Value
# ──────────────────────────────────────────────


class TestDivision40DiminishingValueFullYear:
    """Tests for full-year diminishing value deductions."""

    def test_year_1(self):
        """$2,000 asset, 10 year life, full year = $2,000 * (2/10) = $400."""
        assert calculate_division_40_diminishing_value(2_000, 10, 365) == pytest.approx(400)

    def test_year_2(self):
        """Written down value $1,600, 10 year life = $1,600 * (2/10) = $320."""
        assert calculate_division_40_diminishing_value(1_600, 10, 365) == pytest.approx(320)

    def test_year_3(self):
        """Written down value $1,280, 10 year life = $1,280 * (2/10) = $256."""
        assert calculate_division_40_diminishing_value(1_280, 10, 365) == pytest.approx(256)

    def test_full_366_day_year(self):
        """$2,000 asset, 10 year life, full 366-day year = $400."""
        assert calculate_division_40_diminishing_value(2_000, 10, 366, 366) == pytest.approx(400)

    def test_5_year_life(self):
        """$5,000 asset, 5 year life = $5,000 * (2/5) = $2,000."""
        assert calculate_division_40_diminishing_value(5_000, 5, 365) == pytest.approx(2_000)

    def test_1_year_life(self):
        """$1,000 asset, 1 year life = $1,000 * (2/1) = $2,000."""
        assert calculate_division_40_diminishing_value(1_000, 1, 365) == pytest.approx(2_000)


class TestDivision40DiminishingValueProRata:
    """Tests for pro-rated diminishing value deductions."""

    def test_half_year(self):
        """$2,000 asset, 10 year life, 182 days."""
        expected = 400 * (182 / 365)
        assert calculate_division_40_diminishing_value(2_000, 10, 182) == pytest.approx(expected, abs=0.01)

    def test_one_day(self):
        """$2,000 asset, 10 year life, 1 day."""
        expected = 400 * (1 / 365)
        assert calculate_division_40_diminishing_value(2_000, 10, 1) == pytest.approx(expected, abs=0.01)


class TestDivision40DiminishingValueConsistency:
    """Tests for consistent behaviour of diminishing value method."""

    def test_deduction_decreases_over_time(self):
        """Simulating multiple years — deduction should decrease each year."""
        wdv = 2_000.0
        life = 10
        prev_deduction = float('inf')
        for _ in range(10):
            deduction = calculate_division_40_diminishing_value(wdv, life, 365)
            assert deduction < prev_deduction
            prev_deduction = deduction
            wdv -= deduction

    def test_never_fully_depreciates(self):
        """Diminishing value asymptotically approaches zero — never reaches it."""
        wdv = 2_000.0
        life = 10
        for _ in range(50):
            deduction = calculate_division_40_diminishing_value(wdv, life, 365)
            wdv -= deduction
        assert wdv > 0

    def test_higher_than_prime_cost_year_1(self):
        """Diminishing value should give a higher deduction than prime cost in year 1 (for life > 1)."""
        dv = calculate_division_40_diminishing_value(2_000, 10, 365)
        pc = calculate_division_40_prime_cost(2_000, 10, 365)
        assert dv > pc

    def test_scales_linearly_with_value(self):
        """Doubling written down value should double the deduction."""
        single = calculate_division_40_diminishing_value(2_000, 10, 365)
        double = calculate_division_40_diminishing_value(4_000, 10, 365)
        assert double == pytest.approx(single * 2)

    def test_365_vs_366_full_year_equal(self):
        """Full year deduction should be the same regardless of days in year."""
        y365 = calculate_division_40_diminishing_value(2_000, 10, 365, 365)
        y366 = calculate_division_40_diminishing_value(2_000, 10, 366, 366)
        assert y365 == pytest.approx(y366)


# ──────────────────────────────────────────────
# Division 40 — Shared Validation
# ──────────────────────────────────────────────


class TestDivision40Validation:
    """Tests for input validation shared across both Div 40 methods."""

    def test_prime_cost_days_exceeding_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_prime_cost(2_000, 10, 400, 365)

    def test_diminishing_value_days_exceeding_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_diminishing_value(2_000, 10, 400, 365)

    def test_prime_cost_366_in_365_day_year_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_prime_cost(2_000, 10, 366, 365)

    def test_diminishing_value_366_in_365_day_year_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_diminishing_value(2_000, 10, 366, 365)

    def test_prime_cost_invalid_days_in_year_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_prime_cost(2_000, 10, 100, 364)

    def test_diminishing_value_invalid_days_in_year_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_diminishing_value(2_000, 10, 100, 364)

    def test_prime_cost_zero_life_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_prime_cost(2_000, 0, 365)

    def test_diminishing_value_zero_life_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_diminishing_value(2_000, 0, 365)

    def test_prime_cost_negative_life_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_prime_cost(2_000, -1, 365)

    def test_diminishing_value_negative_life_raises(self):
        with pytest.raises(ValueError):
            calculate_division_40_diminishing_value(2_000, -1, 365)


class TestDivision40ZeroAndEdgeCases:
    """Tests for zero values and edge cases."""

    def test_prime_cost_zero_cost(self):
        assert calculate_division_40_prime_cost(0, 10, 365) == 0.0

    def test_diminishing_value_zero_wdv(self):
        assert calculate_division_40_diminishing_value(0, 10, 365) == 0.0

    def test_prime_cost_zero_days(self):
        assert calculate_division_40_prime_cost(2_000, 10, 0) == 0.0

    def test_diminishing_value_zero_days(self):
        assert calculate_division_40_diminishing_value(2_000, 10, 0) == 0.0


# ──────────────────────────────────────────────
# is_building_depreciable (Div 43 cutoff)
# ──────────────────────────────────────────────


class TestIsBuildingDepreciable:
    """Tests for the Div 43 construction start date eligibility check."""

    def test_post_1987_eligible(self):
        assert is_building_depreciable(date(2000, 1, 1)) is True

    def test_exactly_on_cutoff_eligible(self):
        assert is_building_depreciable(date(1987, 9, 16)) is True

    def test_day_before_cutoff_ineligible(self):
        assert is_building_depreciable(date(1987, 9, 15)) is False

    def test_well_before_cutoff_ineligible(self):
        assert is_building_depreciable(date(1970, 1, 1)) is False

    def test_recent_construction_eligible(self):
        assert is_building_depreciable(date(2024, 6, 1)) is True


# ──────────────────────────────────────────────
# is_asset_depreciable (Div 40 second-hand rule)
# ──────────────────────────────────────────────


class TestIsAssetDepreciable:
    """Tests for the Div 40 second-hand asset eligibility check."""

    # ── Owner-installed assets (always claimable) ─────────

    def test_owner_installed_post_2017_eligible(self):
        """Asset purchased on same date as property — owner-installed, post-2017."""
        assert is_asset_depreciable(date(2020, 1, 15), date(2020, 1, 15)) is True

    def test_owner_installed_after_purchase_post_2017_eligible(self):
        """Asset installed after property purchase — always claimable."""
        assert is_asset_depreciable(date(2021, 6, 1), date(2020, 1, 15)) is True

    def test_owner_installed_pre_2017_eligible(self):
        """Asset purchased on same date as property — pre-2017."""
        assert is_asset_depreciable(date(2015, 3, 1), date(2015, 3, 1)) is True

    # ── Second-hand assets, post-2017 (blocked) ──────────

    def test_secondhand_post_2017_ineligible(self):
        """Asset predates property purchase, property bought post-2017."""
        assert is_asset_depreciable(date(2018, 1, 1), date(2020, 1, 15)) is False

    def test_secondhand_exactly_on_cutoff_ineligible(self):
        """Property purchased exactly on 9 May 2017 — second-hand asset blocked."""
        assert is_asset_depreciable(date(2015, 1, 1), date(2017, 5, 9)) is False

    # ── Second-hand assets, pre-2017 (grandfathered) ─────

    def test_secondhand_pre_2017_eligible(self):
        """Asset predates property purchase, property bought pre-2017 — grandfathered."""
        assert is_asset_depreciable(date(2014, 1, 1), date(2016, 3, 1)) is True

    def test_secondhand_day_before_cutoff_eligible(self):
        """Property purchased 8 May 2017 — second-hand asset still allowed."""
        assert is_asset_depreciable(date(2015, 1, 1), date(2017, 5, 8)) is True


# ──────────────────────────────────────────────
# Borrowing cost deduction — small costs (<= $100)
# ──────────────────────────────────────────────


class TestBorrowingCostDeductionSmall:
    """Tests for borrowing costs <= $100 — fully deductible in year 0."""

    def test_small_cost_year_zero(self):
        """$50 borrowing costs — full deduction in year 0."""
        assert calculate_borrowing_cost_deduction(50, 30, 0) == pytest.approx(50)

    def test_small_cost_year_one(self):
        """$50 borrowing costs — zero deduction in year 1."""
        assert calculate_borrowing_cost_deduction(50, 30, 1) == 0.0

    def test_small_cost_year_five(self):
        assert calculate_borrowing_cost_deduction(80, 30, 5) == 0.0

    def test_exactly_100_year_zero(self):
        """$100 is the boundary — should be fully deductible in year 0."""
        assert calculate_borrowing_cost_deduction(100, 30, 0) == pytest.approx(100)

    def test_exactly_100_year_one(self):
        assert calculate_borrowing_cost_deduction(100, 30, 1) == 0.0

    def test_zero_costs(self):
        assert calculate_borrowing_cost_deduction(0, 30, 0) == 0.0

    def test_one_dollar(self):
        assert calculate_borrowing_cost_deduction(1, 30, 0) == pytest.approx(1)
        assert calculate_borrowing_cost_deduction(1, 30, 1) == 0.0


# ──────────────────────────────────────────────
# Borrowing cost deduction — standard 5-year spread
# ──────────────────────────────────────────────


class TestBorrowingCostDeduction5Year:
    """Tests for borrowing costs > $100 with loan term >= 5 years."""

    def test_10k_over_5_years(self):
        """$10,000 over 5 years = $2,000 per year."""
        for year in range(5):
            assert calculate_borrowing_cost_deduction(10_000, 30, year) == pytest.approx(2_000)

    def test_10k_year_five_zero(self):
        """Year 5 (6th year) — no more deduction."""
        assert calculate_borrowing_cost_deduction(10_000, 30, 5) == 0.0

    def test_10k_year_ten_zero(self):
        assert calculate_borrowing_cost_deduction(10_000, 30, 10) == 0.0

    def test_total_equals_original(self):
        """Sum of all deductions should equal total borrowing costs."""
        total = sum(calculate_borrowing_cost_deduction(10_538, 30, y) for y in range(30))
        assert total == pytest.approx(10_538)

    def test_just_over_100(self):
        """$101 — spreads over 5 years."""
        assert calculate_borrowing_cost_deduction(101, 30, 0) == pytest.approx(101 / 5)
        assert calculate_borrowing_cost_deduction(101, 30, 4) == pytest.approx(101 / 5)
        assert calculate_borrowing_cost_deduction(101, 30, 5) == 0.0

    def test_large_borrowing_costs(self):
        """$25,000 LMI + fees — $5,000 per year."""
        assert calculate_borrowing_cost_deduction(25_000, 30, 0) == pytest.approx(5_000)

    def test_each_year_is_equal(self):
        """All years within the spread period should have the same deduction."""
        deductions = [calculate_borrowing_cost_deduction(10_000, 30, y) for y in range(5)]
        assert all(d == pytest.approx(deductions[0]) for d in deductions)


# ──────────────────────────────────────────────
# Borrowing cost deduction — short loan term (< 5 years)
# ──────────────────────────────────────────────


class TestBorrowingCostDeductionShortLoan:
    """Tests for loan terms shorter than 5 years — spread over loan term instead."""

    def test_3_year_loan(self):
        """$9,000 over 3 years = $3,000 per year."""
        assert calculate_borrowing_cost_deduction(9_000, 3, 0) == pytest.approx(3_000)
        assert calculate_borrowing_cost_deduction(9_000, 3, 1) == pytest.approx(3_000)
        assert calculate_borrowing_cost_deduction(9_000, 3, 2) == pytest.approx(3_000)
        assert calculate_borrowing_cost_deduction(9_000, 3, 3) == 0.0

    def test_1_year_loan(self):
        """$5,000 over 1 year = full deduction in year 0 only."""
        assert calculate_borrowing_cost_deduction(5_000, 1, 0) == pytest.approx(5_000)
        assert calculate_borrowing_cost_deduction(5_000, 1, 1) == 0.0

    def test_2_year_loan(self):
        assert calculate_borrowing_cost_deduction(10_000, 2, 0) == pytest.approx(5_000)
        assert calculate_borrowing_cost_deduction(10_000, 2, 1) == pytest.approx(5_000)
        assert calculate_borrowing_cost_deduction(10_000, 2, 2) == 0.0

    def test_4_year_loan(self):
        assert calculate_borrowing_cost_deduction(10_000, 4, 3) == pytest.approx(2_500)
        assert calculate_borrowing_cost_deduction(10_000, 4, 4) == 0.0

    def test_5_year_loan_same_as_standard(self):
        """5-year loan — min(5, 5) = 5, same as standard spread."""
        for year in range(5):
            assert calculate_borrowing_cost_deduction(10_000, 5, year) == pytest.approx(2_000)
        assert calculate_borrowing_cost_deduction(10_000, 5, 5) == 0.0

    def test_short_loan_total_equals_original(self):
        """Sum of deductions should equal total even for short loans."""
        total = sum(calculate_borrowing_cost_deduction(9_000, 3, y) for y in range(10))
        assert total == pytest.approx(9_000)


# ──────────────────────────────────────────────
# Borrowing cost deduction — edge cases
# ──────────────────────────────────────────────


class TestBorrowingCostDeductionEdgeCases:
    """Tests for edge cases."""

    def test_negative_costs_treated_as_zero(self):
        """Negative borrowing costs shouldn't produce positive deductions."""
        assert calculate_borrowing_cost_deduction(-100, 30, 0) <= 0

    def test_year_far_beyond_spread(self):
        assert calculate_borrowing_cost_deduction(10_000, 30, 50) == 0.0

    def test_realistic_scenario(self):
        """$21,375 LMI + $238 mortgage reg + $300 loan est = $21,913."""
        total = 21_375 + 238 + 300
        annual = total / 5
        assert calculate_borrowing_cost_deduction(total, 30, 0) == pytest.approx(annual)
        assert calculate_borrowing_cost_deduction(total, 30, 4) == pytest.approx(annual)
        assert calculate_borrowing_cost_deduction(total, 30, 5) == 0.0
