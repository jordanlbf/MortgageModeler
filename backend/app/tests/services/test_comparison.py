"""
Tests for comparison service — build_ppor_vs_rentvest.
"""

import pytest
from datetime import date

from app.services.amortisation import build_loan
from app.services.comparison import (
    build_ppor_vs_rentvest,
    _net_wealth_for_year,
    _find_break_even_year,
)
from app.models.cashflow import CashFlowPPORResult, CashFlowRentvestResult
from app.models.comparison import PporVsRentvestResult
from app.models.deductions import DepreciableBuilding
from app.models.loan import LoanConfig, BorrowingCosts
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import (
    Property, PurchaseCosts, OngoingCostsConfig, RentvestConfig, RentalConfig,
)
from app.models.tax import TaxProfile


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _make_property(purchase_price=500_000, annual_appreciation=0.05,
                   is_ppor=True, weekly_rent=0.0, rent_growth=0.03,
                   vacancy_weeks=2, buildings=None) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        is_ppor=is_ppor,
        annual_appreciation=annual_appreciation,
        purchase_costs=PurchaseCosts(),
        rental=RentalConfig(
            weekly_rent=weekly_rent,
            annual_growth_rate=rent_growth,
            vacancy_weeks=vacancy_weeks,
        ),
        depreciable_buildings=buildings or [],
    )


def _make_tax_profile(taxable_income=100_000, income_growth_rate=0.03) -> TaxProfile:
    return TaxProfile(
        taxable_income=taxable_income,
        repayment_income=taxable_income,
        mls_income=taxable_income,
        hecs_balance=0,
        has_private_health=True,
        income_growth_rate=income_growth_rate,
    )


def _make_loan(deposit=100_000, annual_rate=0.06, loan_term_years=30) -> LoanConfig:
    return LoanConfig(
        deposit=deposit,
        annual_rate=annual_rate,
        loan_term_years=loan_term_years,
        borrowing_costs=BorrowingCosts(),
    )


def _make_ongoing_costs(landlord_insurance=0, management_rate=0.0) -> OngoingCostsConfig:
    return OngoingCostsConfig(
        council_rates=2_000,
        water_rates=1_200,
        building_insurance=1_500,
        strata_fees=0,
        maintenance_rate=0.01,
        landlord_insurance=landlord_insurance,
        management_rate=management_rate,
        annual_cost_growth_rate=0.025,
    )


def _make_rentvest(weekly_rent_paid=500, annual_rent_paid_growth=0.03) -> RentvestConfig:
    return RentvestConfig(
        weekly_rent_paid=weekly_rent_paid,
        annual_rent_paid_growth=annual_rent_paid_growth,
    )


def _build_pair(projection_years=5, annual_appreciation=0.05,
                weekly_rent=450, deposit=100_000, annual_rate=0.06,
                taxable_income=100_000, weekly_rent_paid=500,
                landlord_insurance=1_000, management_rate=0.08,
                buildings=None):
    """Build a matched PPOR + rentvest Mortgage pair for comparison."""
    tax_profile = _make_tax_profile(taxable_income=taxable_income)
    loan_config = _make_loan(deposit=deposit, annual_rate=annual_rate)

    prop_ppor = _make_property(
        is_ppor=True,
        annual_appreciation=annual_appreciation,
        buildings=buildings,
    )
    mortgage_ppor = Mortgage(
        property=prop_ppor,
        loan=build_loan(prop_ppor, loan_config),
        person=Person(tax_profile=tax_profile),
        ongoing_costs=_make_ongoing_costs(),
        projection_years=projection_years,
    )

    prop_inv = _make_property(
        is_ppor=False,
        annual_appreciation=annual_appreciation,
        weekly_rent=weekly_rent,
        buildings=buildings,
    )
    mortgage_rentvest = Mortgage(
        property=prop_inv,
        loan=build_loan(prop_inv, loan_config),
        person=Person(tax_profile=tax_profile),
        ongoing_costs=_make_ongoing_costs(
            landlord_insurance=landlord_insurance,
            management_rate=management_rate,
        ),
        rentvest=_make_rentvest(weekly_rent_paid=weekly_rent_paid),
        projection_years=projection_years,
    )

    return mortgage_ppor, mortgage_rentvest


# ──────────────────────────────────────────────
# _net_wealth_for_year
# ──────────────────────────────────────────────

class TestNetWealthForYear:
    """Tests for the per-year net wealth helper."""

    def test_sums_equity_cash_offset(self):
        """Net wealth = equity + cumulative_position + offset_balance."""
        ppor, _ = _build_pair(projection_years=3)
        from app.services.cashflow import build_ppor_cashflow
        result = build_ppor_cashflow(ppor)
        for y in result.years:
            expected = y.equity + y.cumulative_position + y.offset_balance
            assert _net_wealth_for_year(y) == pytest.approx(expected)


# ──────────────────────────────────────────────
# _find_break_even_year
# ──────────────────────────────────────────────

class TestFindBreakEvenYear:
    """Tests for the break-even year detection."""

    def test_no_crossover_positive(self):
        """PPOR always ahead — no break-even."""
        assert _find_break_even_year([100, 80, 60, 40]) is None

    def test_no_crossover_negative(self):
        """Rentvest always ahead — no break-even."""
        assert _find_break_even_year([-100, -80, -60, -40]) is None

    def test_crossover_ppor_to_rentvest(self):
        """PPOR leads then rentvest overtakes."""
        assert _find_break_even_year([100, 50, -10, -50]) == 2

    def test_crossover_rentvest_to_ppor(self):
        """Rentvest leads then PPOR overtakes."""
        assert _find_break_even_year([-100, -50, 10, 50]) == 2

    def test_exact_zero_crossover(self):
        """Delta hits exactly zero — counts as crossover."""
        assert _find_break_even_year([100, 50, 0, -50]) == 2

    def test_empty_list(self):
        assert _find_break_even_year([]) is None

    def test_single_element(self):
        assert _find_break_even_year([100]) is None

    def test_crossover_at_year_one(self):
        assert _find_break_even_year([100, -50]) == 1

    def test_initial_zero_then_positive(self):
        """Starting tied then PPOR pulls ahead — break-even departure at year 1."""
        assert _find_break_even_year([0, 10, 20]) == 1

    def test_initial_zero_then_negative(self):
        """Starting tied then rentvest pulls ahead — break-even departure at year 1."""
        assert _find_break_even_year([0, -10, -20]) == 1

    def test_oscillating_returns_first_crossover(self):
        """Multiple crossovers — should return the first one."""
        assert _find_break_even_year([100, -50, 100, -50]) == 1

    def test_all_zeros(self):
        assert _find_break_even_year([0, 0, 0]) is None


# ──────────────────────────────────────────────
# build_ppor_vs_rentvest — Structure
# ──────────────────────────────────────────────

class TestComparisonStructure:
    """Tests that the result has the correct shape and types."""

    def test_returns_ppor_vs_rentvest_result(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert isinstance(result, PporVsRentvestResult)

    def test_contains_ppor_result(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert isinstance(result.ppor, CashFlowPPORResult)

    def test_contains_rentvest_result(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert isinstance(result.rentvest, CashFlowRentvestResult)

    def test_winner_is_valid(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.winner in ("ppor", "rentvesting")

    def test_difference_is_non_negative(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.difference >= 0

    def test_by_year_length_matches_projection(self):
        ppor, rentvest = _build_pair(projection_years=10)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert len(result.by_year) == 10

    def test_break_even_year_is_none_or_int(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.break_even_year is None or isinstance(result.break_even_year, int)


# ──────────────────────────────────────────────
# build_ppor_vs_rentvest — Wealth calculation
# ──────────────────────────────────────────────

class TestWealthCalculation:
    """Tests for the net wealth and delta calculations."""

    def test_by_year_is_ppor_minus_rentvest(self):
        """Each delta should be PPOR net wealth minus rentvest net wealth."""
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)

        for i in range(len(result.ppor.years)):
            ppor_nw = _net_wealth_for_year(result.ppor.years[i])
            rentvest_nw = _net_wealth_for_year(result.rentvest.years[i])
            # CGT subtracted from rentvest final year only
            if i == len(result.ppor.years) - 1:
                rentvest_nw -= result.rentvest.cgt.cgt_payable
            assert result.by_year[i] == pytest.approx(ppor_nw - rentvest_nw)

    def test_difference_equals_abs_final_delta(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.difference == pytest.approx(abs(result.by_year[-1]))

    def test_winner_matches_final_delta_sign(self):
        ppor, rentvest = _build_pair()
        result = build_ppor_vs_rentvest(ppor, rentvest)
        if result.by_year[-1] >= 0:
            assert result.winner == "ppor"
        else:
            assert result.winner == "rentvesting"

    def test_cgt_only_affects_final_year(self):
        """CGT should only be subtracted from the last year's rentvest wealth."""
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)

        # For non-final years, delta should match raw wealth difference
        for i in range(len(result.ppor.years) - 1):
            ppor_nw = _net_wealth_for_year(result.ppor.years[i])
            rentvest_nw = _net_wealth_for_year(result.rentvest.years[i])
            assert result.by_year[i] == pytest.approx(ppor_nw - rentvest_nw)

    def test_ppor_has_no_cgt_impact(self):
        """PPOR wealth should never have CGT subtracted."""
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)

        for i, y in enumerate(result.ppor.years):
            expected = y.equity + y.cumulative_position + y.offset_balance
            ppor_nw = _net_wealth_for_year(y)
            assert ppor_nw == pytest.approx(expected)


# ──────────────────────────────────────────────
# build_ppor_vs_rentvest — Scenario outcomes
# ──────────────────────────────────────────────

class TestScenarioOutcomes:
    """Tests verifying correct winner identification."""

    def test_ppor_wins_when_no_rental_yield(self):
        """With zero rental income, rentvesting has extra rent costs and no tax benefit."""
        ppor, rentvest = _build_pair(
            projection_years=10,
            weekly_rent=0,
            weekly_rent_paid=600,
            landlord_insurance=0,
            management_rate=0.0,
        )
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.winner == "ppor"
        assert result.difference > 0

    def test_rentvest_wins_with_high_yield_and_gearing(self):
        """High rental yield + depreciation + negative gearing should favour rentvesting."""
        buildings = [
            DepreciableBuilding(
                name="Main building",
                construction_cost=350_000,
                purchase_date=date(2020, 1, 15),
                construction_start_date=date(2019, 1, 1),
            )
        ]
        ppor, rentvest = _build_pair(
            projection_years=20,
            annual_appreciation=0.06,
            weekly_rent=600,
            weekly_rent_paid=300,
            buildings=buildings,
        )
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.winner == "rentvesting"
        assert result.difference > 0


# ──────────────────────────────────────────────
# build_ppor_vs_rentvest — Break-even
# ──────────────────────────────────────────────

class TestBreakEven:
    """Tests for break-even year detection in real projections."""

    def test_break_even_within_range(self):
        """Break-even year should be within projection range if it exists."""
        ppor, rentvest = _build_pair(projection_years=10)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        if result.break_even_year is not None:
            assert 0 <= result.break_even_year < 10

    def test_no_break_even_when_one_dominates(self):
        """When one scenario clearly dominates, break_even_year should be None."""
        ppor, rentvest = _build_pair(
            projection_years=5,
            weekly_rent=0,
            weekly_rent_paid=800,
            landlord_insurance=0,
            management_rate=0.0,
        )
        result = build_ppor_vs_rentvest(ppor, rentvest)
        # PPOR should dominate every year — no crossover
        assert result.winner == "ppor"
        assert result.break_even_year is None


# ──────────────────────────────────────────────
# build_ppor_vs_rentvest — Consistency
# ──────────────────────────────────────────────

class TestConsistency:
    """Tests for consistency between comparison and underlying cashflow results."""

    def test_ppor_projection_years_match(self):
        ppor, rentvest = _build_pair(projection_years=7)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.ppor.projection_years == 7
        assert len(result.ppor.years) == 7

    def test_rentvest_projection_years_match(self):
        ppor, rentvest = _build_pair(projection_years=7)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.rentvest.projection_years == 7
        assert len(result.rentvest.years) == 7

    def test_rentvest_has_cgt(self):
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.rentvest.cgt is not None

    def test_ppor_summary_net_wealth_matches(self):
        """PPOR summary net_wealth should match the cashflow summary."""
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.ppor.summary.net_wealth == pytest.approx(
            result.ppor.summary.final_equity + result.ppor.years[-1].cumulative_position, abs=1
        )

    def test_rentvest_summary_net_wealth_matches(self):
        """Rentvest summary net_wealth should match the cashflow summary."""
        ppor, rentvest = _build_pair(projection_years=5)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert result.rentvest.summary.net_wealth == pytest.approx(
            result.rentvest.summary.final_equity + result.rentvest.years[-1].cumulative_position, abs=1
        )

    def test_single_year_projection(self):
        ppor, rentvest = _build_pair(projection_years=1)
        result = build_ppor_vs_rentvest(ppor, rentvest)
        assert len(result.by_year) == 1
        assert result.winner in ("ppor", "rentvesting")
