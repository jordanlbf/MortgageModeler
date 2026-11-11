"""
Tests for cashflow projection services — helpers, PPOR, and rentvesting.
"""

from datetime import date

import pytest

from app.engine.tax import calculate_hecs_repayment
from app.models.amortisation import AmortisationSchedule, ScheduleRow
from app.models.cashflow import CashFlowYear, CashFlowYearInvestment
from app.models.deductions import DepreciableBuilding, PropertyTaxDeductionSummary
from app.models.loan import BorrowingCosts, Loan, LoanConfig
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import (
    OngoingCostsConfig,
    Property,
    PurchaseCosts,
    RentalConfig,
    RentvestConfig,
    YearCost,
)
from app.models.tax import TaxProfile
from app.services.amortisation import build_loan
from app.services.cashflow import (
    _calculate_cashflow_summary,
    _calculate_cashflow_year,
    _calculate_investment_cashflow_summary,
    _calculate_investment_cashflow_year,
    _grow_tax_profile,
    build_ppor_cashflow,
    build_rentvest_cashflow,
)

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _make_property(
    purchase_price=500_000,
    annual_appreciation=0.05,
    is_ppor=True,
    weekly_rent=0.0,
    rent_growth=0.03,
    vacancy_weeks=2,
    purchase_costs=None,
    buildings=None,
    assets=None,
) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        is_ppor=is_ppor,
        annual_appreciation=annual_appreciation,
        purchase_costs=purchase_costs or PurchaseCosts(),
        rental=RentalConfig(
            weekly_rent=weekly_rent,
            annual_growth_rate=rent_growth,
            vacancy_weeks=vacancy_weeks,
        ),
        depreciable_buildings=buildings or [],
        depreciable_assets=assets or [],
    )


def _make_tax_profile(
    taxable_income=100_000, income_growth_rate=0.03, hecs_balance=0, has_private_health=True
) -> TaxProfile:
    return TaxProfile(
        taxable_income=taxable_income,
        repayment_income=taxable_income,
        mls_income=taxable_income,
        hecs_balance=hecs_balance,
        has_private_health=has_private_health,
        income_growth_rate=income_growth_rate,
    )


def _make_loan(deposit=100_000, annual_rate=0.06, loan_term_years=30, borrowing_costs=None) -> LoanConfig:
    return LoanConfig(
        deposit=deposit,
        annual_rate=annual_rate,
        loan_term_years=loan_term_years,
        borrowing_costs=borrowing_costs
        or BorrowingCosts(lmi=0.0, mortgage_registration_fee=0.0, loan_establishment_fee=0.0),
    )


def _make_ongoing_costs(
    council_rates=2_000,
    water_rates=1_200,
    building_insurance=1_500,
    strata_fees=0,
    maintenance_rate=0.01,
    landlord_insurance=0,
    management_rate=0.0,
    annual_cost_growth_rate=0.025,
) -> OngoingCostsConfig:
    return OngoingCostsConfig(
        council_rates=council_rates,
        water_rates=water_rates,
        building_insurance=building_insurance,
        strata_fees=strata_fees,
        maintenance_rate=maintenance_rate,
        landlord_insurance=landlord_insurance,
        management_rate=management_rate,
        annual_cost_growth_rate=annual_cost_growth_rate,
    )


def _make_rentvest(weekly_rent_paid=500, annual_rent_paid_growth=0.03) -> RentvestConfig:
    return RentvestConfig(
        weekly_rent_paid=weekly_rent_paid,
        annual_rent_paid_growth=annual_rent_paid_growth,
    )


def _make_mortgage(
    property=None, tax_profile=None, loan=None, ongoing_costs=None, rentvest=None, projection_years=30
) -> Mortgage:
    p = property or _make_property()
    lc = loan or _make_loan()
    return Mortgage(
        property=p,
        loan=build_loan(p, lc),
        person=Person(tax_profile=tax_profile or _make_tax_profile()),
        ongoing_costs=ongoing_costs or _make_ongoing_costs(),
        rentvest=rentvest,
        projection_years=projection_years,
    )


def _make_schedule_row(
    period=1,
    opening_balance=400_000,
    interest=2000,
    principal_paid=500,
    extra_paid=0,
    closing_balance=399_500,
    annual_rate=0.06,
    scheduled_repayment=2500,
    offset_balance=0,
) -> ScheduleRow:
    return ScheduleRow(
        period=period,
        opening_balance=opening_balance,
        interest=interest,
        principal_paid=principal_paid,
        extra_paid=extra_paid,
        closing_balance=closing_balance,
        annual_rate=annual_rate,
        scheduled_repayment=scheduled_repayment,
        offset_balance=offset_balance,
    )


def _make_year_cost(
    year=0,
    council_rates=2_000,
    water_rates=1_200,
    building_insurance=1_500,
    landlord_insurance=0,
    strata_fees=0,
    maintenance_cost=5_000,
    management_fee=0,
    property_value=500_000,
    rental_income=0,
) -> YearCost:
    total = (
        council_rates
        + water_rates
        + building_insurance
        + landlord_insurance
        + strata_fees
        + maintenance_cost
        + management_fee
    )
    return YearCost(
        year=year,
        council_rates=council_rates,
        water_rates=water_rates,
        building_insurance=building_insurance,
        landlord_insurance=landlord_insurance,
        strata_fees=strata_fees,
        maintenance_cost=maintenance_cost,
        management_fee=management_fee,
        property_value=property_value,
        rental_income=rental_income,
        total_costs=total,
    )


def _make_cashflow_year(
    year=0,
    net_income=77_000,
    mortgage_repayment=30_000,
    mortgage_interest=24_000,
    mortgage_principal=6_000,
    property_costs=10_000,
    offset_contributions=0,
    property_value=500_000,
    loan_balance=394_000,
    offset_balance=0,
    previous_cumulative=0,
) -> CashFlowYear:
    total_inflows = net_income
    total_outflows = mortgage_repayment + property_costs + offset_contributions
    net_position = total_inflows - total_outflows
    cumulative_position = previous_cumulative + net_position
    equity = property_value - loan_balance
    return CashFlowYear(
        year=year,
        net_income=net_income,
        total_inflows=total_inflows,
        mortgage_repayment=mortgage_repayment,
        mortgage_interest=mortgage_interest,
        mortgage_principal=mortgage_principal,
        property_costs=property_costs,
        offset_contributions=offset_contributions,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
    )


def _make_investment_cashflow_year(
    year=0,
    net_income=77_000,
    mortgage_repayment=30_000,
    mortgage_interest=24_000,
    mortgage_principal=6_000,
    property_costs=10_000,
    offset_contributions=0,
    rent_paid=0,
    rental_income=0,
    tax_saving=0,
    property_value=500_000,
    loan_balance=394_000,
    offset_balance=0,
    previous_cumulative=0,
) -> CashFlowYearInvestment:
    total_inflows = net_income + rental_income + tax_saving
    total_outflows = mortgage_repayment + property_costs + offset_contributions + rent_paid
    net_position = total_inflows - total_outflows
    cumulative_position = previous_cumulative + net_position
    equity = property_value - loan_balance
    return CashFlowYearInvestment(
        year=year,
        net_income=net_income,
        total_inflows=total_inflows,
        mortgage_repayment=mortgage_repayment,
        mortgage_interest=mortgage_interest,
        mortgage_principal=mortgage_principal,
        property_costs=property_costs,
        offset_contributions=offset_contributions,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
        rental_income=rental_income,
        tax_saving=tax_saving,
        rent_paid=rent_paid,
    )


# ──────────────────────────────────────────────
# _grow_tax_profile
# ──────────────────────────────────────────────


class TestGrowTaxProfile:
    """Tests for tax profile income growth."""

    def test_year_zero_no_growth(self):
        """Year 0 should return unchanged income."""
        profile = _make_tax_profile(taxable_income=100_000, income_growth_rate=0.05)
        grown = _grow_tax_profile(profile, 0)
        assert grown.taxable_income == pytest.approx(100_000)

    def test_year_one_growth(self):
        """Year 1 should apply one year of growth."""
        profile = _make_tax_profile(taxable_income=100_000, income_growth_rate=0.03)
        grown = _grow_tax_profile(profile, 1)
        assert grown.taxable_income == pytest.approx(103_000)

    def test_year_five_compound_growth(self):
        """Year 5 should apply compound growth."""
        profile = _make_tax_profile(taxable_income=100_000, income_growth_rate=0.03)
        grown = _grow_tax_profile(profile, 5)
        assert grown.taxable_income == pytest.approx(100_000 * 1.03**5)

    def test_all_income_measures_grow(self):
        """All three income measures should grow together."""
        profile = TaxProfile(
            taxable_income=100_000,
            repayment_income=110_000,
            mls_income=105_000,
            hecs_balance=25_000,
            has_private_health=True,
            income_growth_rate=0.05,
        )
        grown = _grow_tax_profile(profile, 2)
        factor = 1.05**2
        assert grown.taxable_income == pytest.approx(100_000 * factor)
        assert grown.repayment_income == pytest.approx(110_000 * factor)
        assert grown.mls_income == pytest.approx(105_000 * factor)

    def test_hecs_balance_unchanged(self):
        """HECS balance should not be affected by income growth."""
        profile = _make_tax_profile(hecs_balance=25_000, income_growth_rate=0.05)
        grown = _grow_tax_profile(profile, 5)
        assert grown.hecs_balance == 25_000

    def test_hecs_balance_can_be_overridden(self):
        """A carried-forward HECS balance replaces the base profile's balance."""
        profile = _make_tax_profile(hecs_balance=25_000)
        grown = _grow_tax_profile(profile, 5, hecs_balance=4_000)
        assert grown.hecs_balance == 4_000

    def test_hecs_indexation_rate_preserved(self):
        profile = _make_tax_profile(hecs_balance=25_000)
        profile.hecs_indexation_rate = 0.045
        assert _grow_tax_profile(profile, 3).hecs_indexation_rate == 0.045

    def test_private_health_preserved(self):
        profile = _make_tax_profile(has_private_health=True)
        grown = _grow_tax_profile(profile, 3)
        assert grown.has_private_health is True

    def test_growth_rate_preserved(self):
        profile = _make_tax_profile(income_growth_rate=0.04)
        grown = _grow_tax_profile(profile, 3)
        assert grown.income_growth_rate == 0.04

    def test_zero_growth_rate(self):
        """Zero growth should return unchanged income at any year."""
        profile = _make_tax_profile(taxable_income=100_000, income_growth_rate=0.0)
        grown = _grow_tax_profile(profile, 10)
        assert grown.taxable_income == pytest.approx(100_000)


# ──────────────────────────────────────────────
# Loan.rows_for_year
# ──────────────────────────────────────────────


class TestLoanRowsForYear:
    """Tests for Loan.rows_for_year schedule row slicing."""

    def _make_loan_with_schedule(self, num_rows=360, periods_per_year=12):
        rows = [_make_schedule_row(period=i + 1) for i in range(num_rows)]
        schedule = AmortisationSchedule(
            rows=rows,
            total_interest=100_000,
            total_periods=num_rows,
            periods_per_year=periods_per_year,
        )
        return Loan(config=_make_loan(), schedule=schedule)

    def test_year_zero_monthly(self):
        loan = self._make_loan_with_schedule(360, 12)
        rows = loan.rows_for_year(0)
        assert len(rows) == 12

    def test_year_zero_weekly(self):
        loan = self._make_loan_with_schedule(1560, 52)
        rows = loan.rows_for_year(0)
        assert len(rows) == 52

    def test_year_zero_fortnightly(self):
        loan = self._make_loan_with_schedule(780, 26)
        rows = loan.rows_for_year(0)
        assert len(rows) == 26

    def test_year_one_starts_after_year_zero(self):
        loan = self._make_loan_with_schedule(360, 12)
        y0 = loan.rows_for_year(0)
        y1 = loan.rows_for_year(1)
        assert y0[-1].period == 12
        assert y1[0].period == 13

    def test_last_year(self):
        loan = self._make_loan_with_schedule(360, 12)
        rows = loan.rows_for_year(29)
        assert len(rows) == 12
        assert rows[-1].period == 360

    def test_beyond_schedule_returns_empty(self):
        """Year beyond schedule should return empty list."""
        loan = self._make_loan_with_schedule(120, 12)  # 10 year loan
        rows = loan.rows_for_year(15)
        assert rows == []

    def test_partial_final_year(self):
        """If loan pays off mid-year, returns fewer rows."""
        loan = self._make_loan_with_schedule(100, 12)  # 8.33 years
        rows = loan.rows_for_year(8)
        assert len(rows) == 4  # 100 - 96 = 4 remaining

    def test_empty_schedule(self):
        schedule = AmortisationSchedule(rows=[], total_interest=0, total_periods=0, periods_per_year=12)
        loan = Loan(config=_make_loan(), schedule=schedule)
        rows = loan.rows_for_year(0)
        assert rows == []


# ──────────────────────────────────────────────
# _calculate_cashflow_summary
# ──────────────────────────────────────────────


class TestCalculateCashflowSummary:
    """Tests for summary calculation from yearly entries."""

    def test_total_income_sums_net_income(self):
        years = [
            _make_cashflow_year(year=0, net_income=70_000),
            _make_cashflow_year(year=1, net_income=72_000),
        ]
        summary = _calculate_cashflow_summary(years)
        assert summary.total_income == pytest.approx(142_000)

    def test_total_outflows_sums(self):
        y0 = _make_cashflow_year(year=0, mortgage_repayment=30_000, property_costs=10_000)
        y1 = _make_cashflow_year(year=1, mortgage_repayment=30_000, property_costs=10_500)
        summary = _calculate_cashflow_summary([y0, y1])
        assert summary.total_outflows == pytest.approx(y0.total_outflows + y1.total_outflows)

    def test_total_interest_paid(self):
        years = [
            _make_cashflow_year(year=0, mortgage_interest=24_000),
            _make_cashflow_year(year=1, mortgage_interest=23_500),
        ]
        summary = _calculate_cashflow_summary(years)
        assert summary.total_interest_paid == pytest.approx(47_500)

    def test_total_rent_paid(self):
        years = [
            _make_investment_cashflow_year(year=0, rent_paid=26_000),
            _make_investment_cashflow_year(year=1, rent_paid=26_780),
        ]
        summary = _calculate_investment_cashflow_summary(years)
        assert summary.total_rent_paid == pytest.approx(52_780)

    def test_total_rental_income(self):
        years = [
            _make_investment_cashflow_year(year=0, rental_income=25_000),
            _make_investment_cashflow_year(year=1, rental_income=25_750),
        ]
        summary = _calculate_investment_cashflow_summary(years)
        assert summary.total_rental_income == pytest.approx(50_750)

    def test_total_tax_saving(self):
        years = [
            _make_investment_cashflow_year(year=0, tax_saving=5_000),
            _make_investment_cashflow_year(year=1, tax_saving=4_500),
        ]
        summary = _calculate_investment_cashflow_summary(years)
        assert summary.total_tax_saving == pytest.approx(9_500)

    def test_final_values_from_last_year(self):
        years = [
            _make_cashflow_year(year=0, property_value=500_000, loan_balance=394_000),
            _make_cashflow_year(year=1, property_value=525_000, loan_balance=388_000),
        ]
        summary = _calculate_cashflow_summary(years)
        assert summary.final_property_value == pytest.approx(525_000)
        assert summary.final_loan_balance == pytest.approx(388_000)
        assert summary.final_equity == pytest.approx(525_000 - 388_000)

    def test_net_wealth_includes_cumulative(self):
        y0 = _make_cashflow_year(
            year=0,
            property_value=500_000,
            loan_balance=394_000,
            net_income=77_000,
            mortgage_repayment=30_000,
            property_costs=10_000,
            previous_cumulative=-20_000,
        )
        summary = _calculate_cashflow_summary([y0])
        assert summary.net_wealth == pytest.approx(summary.final_equity + y0.cumulative_position)

    def test_average_annual_net(self):
        y0 = _make_cashflow_year(year=0, net_income=70_000, mortgage_repayment=30_000, property_costs=10_000)
        y1 = _make_cashflow_year(year=1, net_income=72_000, mortgage_repayment=30_000, property_costs=10_000)
        summary = _calculate_cashflow_summary([y0, y1])
        expected_avg = (y0.net_position + y1.net_position) / 2
        assert summary.average_annual_net == pytest.approx(expected_avg)

    def test_empty_years(self):
        summary = _calculate_cashflow_summary([])
        assert summary.total_income == 0
        assert summary.total_outflows == 0
        assert summary.final_property_value == 0
        assert summary.final_loan_balance == 0
        assert summary.net_wealth == 0
        assert summary.average_annual_net == 0

    def test_ppor_summary_has_no_investment_fields(self):
        """PPOR summary should not have investment-specific fields."""
        years = [_make_cashflow_year(year=0)]
        summary = _calculate_cashflow_summary(years)
        assert not hasattr(summary, "total_rent_paid")
        assert not hasattr(summary, "total_rental_income")
        assert not hasattr(summary, "total_tax_saving")


# ──────────────────────────────────────────────
# _calculate_cashflow_year
# ──────────────────────────────────────────────


class TestCalculateCashflowYear:
    """Tests for single year cashflow calculation."""

    def _make_rows(self, count=12, interest=2000, principal=500, extra=0, closing=399_500, offset=0):
        return [
            _make_schedule_row(
                period=i + 1,
                interest=interest,
                principal_paid=principal,
                extra_paid=extra,
                closing_balance=closing,
                offset_balance=offset,
            )
            for i in range(count)
        ]

    def test_net_income_is_income_minus_tax(self):
        """Net income should be taxable income minus total tax."""
        from app.engine.tax import calculate_total_tax

        profile = _make_tax_profile(taxable_income=100_000)
        expected_tax = calculate_total_tax(profile)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=profile,
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.net_income == pytest.approx(100_000 - expected_tax)

    def test_mortgage_sums_from_rows(self):
        rows = self._make_rows(count=12, interest=2000, principal=500, extra=100)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.mortgage_interest == pytest.approx(12 * 2000)
        assert year.mortgage_principal == pytest.approx(12 * (500 + 100))
        assert year.mortgage_repayment == pytest.approx(12 * (2000 + 500 + 100))

    def test_empty_rows_zero_mortgage(self):
        """No schedule rows (loan paid off) → zero mortgage."""
        year = _calculate_cashflow_year(
            year=5,
            tax_profile=_make_tax_profile(),
            schedule_rows=[],
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.mortgage_repayment == 0
        assert year.mortgage_interest == 0
        assert year.mortgage_principal == 0
        assert year.loan_balance == 0

    def test_loan_balance_from_last_row(self):
        rows = self._make_rows(count=12, closing=390_000)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.loan_balance == pytest.approx(390_000)

    def test_offset_balance_from_last_row(self):
        rows = self._make_rows(count=12, offset=15_000)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.offset_balance == pytest.approx(15_000)

    def test_property_costs_from_year_cost(self):
        costs = _make_year_cost(council_rates=2000, water_rates=1200, building_insurance=1500, maintenance_cost=5000)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=costs,
            previous_cumulative=0,
        )
        assert year.property_costs == pytest.approx(costs.total_costs)

    def test_property_value_from_year_cost(self):
        costs = _make_year_cost(property_value=525_000)
        year = _calculate_cashflow_year(
            year=1,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=costs,
            previous_cumulative=0,
        )
        assert year.property_value == pytest.approx(525_000)

    def test_rental_income_from_year_cost(self):
        costs = _make_year_cost(rental_income=25_000)
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=costs,
            previous_cumulative=0,
        )
        assert year.rental_income == pytest.approx(25_000)

    def test_equity_is_value_minus_balance(self):
        costs = _make_year_cost(property_value=525_000)
        rows = self._make_rows(closing=390_000)
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=costs,
            previous_cumulative=0,
        )
        assert year.equity == pytest.approx(525_000 - 390_000)

    # ── PPOR (no rentvest, no deductions) ─────

    def test_ppor_returns_base_type(self):
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert type(year) is CashFlowYear
        assert not isinstance(year, CashFlowYearInvestment)

    def test_ppor_total_inflows_is_net_income(self):
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.total_inflows == pytest.approx(year.net_income)

    # ── Investment / Rentvesting ───────────────

    def test_investment_returns_investment_type(self):
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert isinstance(year, CashFlowYearInvestment)

    def test_rentvest_rent_paid(self):
        """Rent paid should be weekly * 52 * growth^year."""
        rentvest = _make_rentvest(weekly_rent_paid=500, annual_rent_paid_growth=0.03)
        year = _calculate_investment_cashflow_year(
            year=2,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
            rentvest=rentvest,
        )
        expected = 500 * 52 * (1.03**2)
        assert year.rent_paid == pytest.approx(expected)

    def test_rentvest_rent_paid_year_zero(self):
        rentvest = _make_rentvest(weekly_rent_paid=500)
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
            rentvest=rentvest,
        )
        assert year.rent_paid == pytest.approx(500 * 52)

    def test_rentvest_tax_saving(self):
        deduction = PropertyTaxDeductionSummary(
            mortgage_interest=24_000,
            depreciation_building=10_000,
            depreciation_plant=400,
            deductible_expenses=15_000,
            total_deductions=49_400,
            net_rental_income=-24_400,
            is_negatively_geared=True,
            tax_saving=7_320,
        )
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(rental_income=25_000),
            previous_cumulative=0,
            rentvest=_make_rentvest(),
            tax_deduction_detail=deduction,
        )
        assert year.tax_saving == pytest.approx(7_320)

    def test_rentvest_total_inflows_includes_rental_and_tax_saving(self):
        deduction = PropertyTaxDeductionSummary(
            mortgage_interest=0,
            depreciation_building=0,
            depreciation_plant=0,
            deductible_expenses=0,
            total_deductions=0,
            net_rental_income=0,
            is_negatively_geared=False,
            tax_saving=5_000,
        )
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(rental_income=25_000),
            previous_cumulative=0,
            rentvest=_make_rentvest(),
            tax_deduction_detail=deduction,
        )
        assert year.total_inflows == pytest.approx(year.net_income + 25_000 + 5_000)

    def test_rentvest_total_outflows_includes_rent_paid(self):
        rentvest = _make_rentvest(weekly_rent_paid=500)
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
            rentvest=rentvest,
        )
        assert year.total_outflows == pytest.approx(year.mortgage_repayment + year.property_costs + 500 * 52)

    # ── Net position and cumulative ───────────

    def test_net_position_is_inflows_minus_outflows(self):
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.net_position == pytest.approx(year.total_inflows - year.total_outflows)

    def test_cumulative_adds_to_previous(self):
        year = _calculate_cashflow_year(
            year=1,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=-15_000,
        )
        assert year.cumulative_position == pytest.approx(-15_000 + year.net_position)

    # ── Detail attachments ────────────────────

    def test_ongoing_costs_detail_attached(self):
        costs = _make_year_cost()
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=costs,
            previous_cumulative=0,
        )
        assert year.ongoing_costs_detail is costs

    def test_schedule_rows_detail_attached(self):
        rows = self._make_rows()
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert year.schedule_rows_detail is rows

    def test_ppor_has_no_tax_deduction_detail(self):
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
        )
        assert not hasattr(year, "tax_deduction_detail") or not isinstance(year, CashFlowYearInvestment)

    def test_tax_deduction_detail_attached_for_investment(self):
        deduction = PropertyTaxDeductionSummary(
            mortgage_interest=0,
            depreciation_building=0,
            depreciation_plant=0,
            deductible_expenses=0,
            total_deductions=0,
            net_rental_income=0,
            is_negatively_geared=False,
            tax_saving=0,
        )
        year = _calculate_investment_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=self._make_rows(),
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
            tax_deduction_detail=deduction,
        )
        assert year.tax_deduction_detail is deduction


# ──────────────────────────────────────────────
# build_ppor_cashflow
# ──────────────────────────────────────────────


class TestBuildPporCashflow:
    """Tests for the full PPOR cashflow projection."""

    def _build(self, projection_years=5, **overrides):
        defaults = dict(
            property=_make_property(is_ppor=True),
            tax_profile=_make_tax_profile(),
            loan=_make_loan(),
            ongoing_costs=_make_ongoing_costs(),
            projection_years=projection_years,
        )
        defaults.update(overrides)
        return build_ppor_cashflow(_make_mortgage(**defaults))

    # ── Structure ─────────────────────────────

    def test_returns_ppor_result(self):
        result = self._build()
        assert result.projection_years == 5

    def test_correct_number_of_years(self):
        result = self._build(projection_years=10)
        assert len(result.years) == 10

    def test_years_are_sequential(self):
        result = self._build(projection_years=5)
        years = [y.year for y in result.years]
        assert years == [0, 1, 2, 3, 4]

    def test_has_upfront_costs(self):
        result = self._build()
        assert result.upfront_costs is not None
        assert result.upfront_costs.total >= 0

    def test_has_summary(self):
        result = self._build()
        assert result.summary is not None

    def test_single_year_projection(self):
        result = self._build(projection_years=1)
        assert len(result.years) == 1
        assert result.summary is not None

    # ── PPOR specifics ────────────────────────

    def test_returns_base_cashflow_year(self):
        result = self._build()
        for y in result.years:
            assert type(y) is CashFlowYear
            assert not isinstance(y, CashFlowYearInvestment)

    # ── Income growth ─────────────────────────

    def test_income_grows_over_time(self):
        result = self._build(
            tax_profile=_make_tax_profile(income_growth_rate=0.05),
            projection_years=5,
        )
        for i in range(1, len(result.years)):
            assert result.years[i].net_income > result.years[i - 1].net_income

    def test_zero_income_growth_flat(self):
        result = self._build(
            tax_profile=_make_tax_profile(income_growth_rate=0.0),
            projection_years=3,
        )
        assert result.years[0].net_income == pytest.approx(result.years[2].net_income)

    # ── Property appreciation ─────────────────

    def test_property_value_grows(self):
        result = self._build(
            property=_make_property(is_ppor=True, annual_appreciation=0.05),
            projection_years=5,
        )
        for i in range(1, len(result.years)):
            assert result.years[i].property_value > result.years[i - 1].property_value

    def test_equity_increases(self):
        """Equity should grow from both appreciation and principal paydown."""
        result = self._build(projection_years=5)
        for i in range(1, len(result.years)):
            assert result.years[i].equity > result.years[i - 1].equity

    # ── Loan balance ──────────────────────────

    def test_loan_balance_decreases(self):
        result = self._build(projection_years=5)
        for i in range(1, len(result.years)):
            assert result.years[i].loan_balance <= result.years[i - 1].loan_balance

    # ── Cumulative position ───────────────────

    def test_cumulative_starts_negative(self):
        """Year 0 cumulative includes upfront cost offset."""
        result = self._build()
        # Should be less than net_position alone because upfront costs reduce it
        assert result.years[0].cumulative_position < result.years[0].net_position

    def test_cumulative_is_running_total(self):
        result = self._build(projection_years=3)
        expected = -result.upfront_costs.total_cash_at_settlement
        for y in result.years:
            expected += y.net_position
            assert y.cumulative_position == pytest.approx(expected, abs=1)

    # ── Summary consistency ───────────────────

    def test_summary_total_income_matches_years(self):
        result = self._build(projection_years=5)
        expected = sum(y.net_income for y in result.years)
        assert result.summary.total_income == pytest.approx(expected)

    def test_summary_total_outflows_matches_years(self):
        result = self._build(projection_years=5)
        expected = sum(y.total_outflows for y in result.years)
        assert result.summary.total_outflows == pytest.approx(expected)

    def test_summary_final_values_match_last_year(self):
        result = self._build(projection_years=5)
        last = result.years[-1]
        assert result.summary.final_property_value == pytest.approx(last.property_value)
        assert result.summary.final_loan_balance == pytest.approx(last.loan_balance)
        assert result.summary.final_equity == pytest.approx(last.equity)

    def test_summary_net_wealth(self):
        result = self._build(projection_years=5)
        last = result.years[-1]
        expected = last.equity + last.cumulative_position
        assert result.summary.net_wealth == pytest.approx(expected, abs=1)

    # ── Detail attachments ────────────────────

    def test_ongoing_costs_detail_present(self):
        result = self._build()
        for y in result.years:
            assert y.ongoing_costs_detail is not None

    def test_schedule_rows_detail_present(self):
        result = self._build()
        assert len(result.years[0].schedule_rows_detail) > 0

    # ── Edge cases ────────────────────────────

    def test_cash_purchase_no_mortgage(self):
        """Full cash purchase — no loan, no mortgage payments."""
        result = self._build(
            property=_make_property(purchase_price=500_000, is_ppor=True),
            loan=_make_loan(deposit=500_000),
        )
        for y in result.years:
            assert y.mortgage_repayment == 0
            assert y.mortgage_interest == 0
            assert y.loan_balance == 0


# ──────────────────────────────────────────────
# build_rentvest_cashflow
# ──────────────────────────────────────────────


class TestBuildRentvestCashflow:
    """Tests for the full rentvesting cashflow projection."""

    def _build(self, projection_years=5, **overrides):
        defaults = dict(
            property=_make_property(
                is_ppor=False,
                weekly_rent=450,
                rent_growth=0.03,
                vacancy_weeks=2,
                buildings=[
                    DepreciableBuilding(
                        name="Main building",
                        construction_cost=250_000,
                        purchase_date=date(2020, 1, 15),
                        construction_start_date=date(2019, 1, 1),
                    )
                ],
            ),
            tax_profile=_make_tax_profile(),
            loan=_make_loan(),
            ongoing_costs=_make_ongoing_costs(landlord_insurance=1_000, management_rate=0.08),
            rentvest=_make_rentvest(),
            projection_years=projection_years,
        )
        defaults.update(overrides)
        return build_rentvest_cashflow(_make_mortgage(**defaults))

    # ── Structure ─────────────────────────────

    def test_returns_rentvest_result(self):
        result = self._build()
        assert result.projection_years == 5

    def test_correct_number_of_years(self):
        result = self._build(projection_years=10)
        assert len(result.years) == 10

    def test_years_are_sequential(self):
        result = self._build(projection_years=5)
        years = [y.year for y in result.years]
        assert years == [0, 1, 2, 3, 4]

    def test_has_upfront_costs(self):
        result = self._build()
        assert result.upfront_costs is not None

    def test_has_cgt(self):
        result = self._build()
        assert result.cgt is not None

    def test_has_summary(self):
        result = self._build()
        assert result.summary is not None

    # ── Rentvest specifics ────────────────────

    def test_rent_paid_positive(self):
        result = self._build()
        for y in result.years:
            assert y.rent_paid > 0

    def test_rent_paid_grows(self):
        result = self._build(
            rentvest=_make_rentvest(weekly_rent_paid=500, annual_rent_paid_growth=0.03),
            projection_years=5,
        )
        for i in range(1, len(result.years)):
            assert result.years[i].rent_paid > result.years[i - 1].rent_paid

    def test_rental_income_positive(self):
        result = self._build()
        for y in result.years:
            assert y.rental_income > 0

    def test_rental_income_grows(self):
        result = self._build(projection_years=5)
        for i in range(1, len(result.years)):
            assert result.years[i].rental_income > result.years[i - 1].rental_income

    def test_tax_saving_present(self):
        """Negatively geared property should have positive tax saving."""
        result = self._build()
        # With high mortgage and depreciation, should be negatively geared
        assert any(y.tax_saving != 0 for y in result.years)

    def test_tax_deduction_detail_present(self):
        result = self._build()
        for y in result.years:
            assert y.tax_deduction_detail is not None

    # ── CGT ───────────────────────────────────

    def test_cgt_has_capital_gain(self):
        """Property should appreciate over 5 years → positive capital gain."""
        result = self._build(
            property=_make_property(
                is_ppor=False,
                purchase_price=500_000,
                annual_appreciation=0.05,
                weekly_rent=450,
            ),
            projection_years=5,
        )
        assert result.cgt.capital_gain > 0

    def test_cgt_has_discount(self):
        """Held > 12 months → 50% discount should apply."""
        result = self._build(projection_years=5)
        if result.cgt.capital_gain > 0:
            assert result.cgt.cgt_discount > 0

    def test_cgt_payable_positive(self):
        result = self._build(projection_years=5)
        if result.cgt.capital_gain > 0:
            assert result.cgt.cgt_payable > 0

    def test_cgt_net_proceeds_less_than_sale_price(self):
        result = self._build(projection_years=5)
        if result.cgt.capital_gain > 0:
            sale_price = result.cgt.cost_base + result.cgt.capital_gain
            assert result.cgt.net_proceeds < sale_price

    # ── Income growth ─────────────────────────

    def test_income_grows(self):
        result = self._build(
            tax_profile=_make_tax_profile(income_growth_rate=0.05),
            projection_years=5,
        )
        for i in range(1, len(result.years)):
            assert result.years[i].net_income > result.years[i - 1].net_income

    # ── Property value ────────────────────────

    def test_property_value_grows(self):
        result = self._build(projection_years=5)
        for i in range(1, len(result.years)):
            assert result.years[i].property_value > result.years[i - 1].property_value

    # ── Summary consistency ───────────────────

    def test_summary_total_rent_paid(self):
        result = self._build(projection_years=5)
        expected = sum(y.rent_paid for y in result.years)
        assert result.summary.total_rent_paid == pytest.approx(expected)

    def test_summary_total_rental_income(self):
        result = self._build(projection_years=5)
        expected = sum(y.rental_income for y in result.years)
        assert result.summary.total_rental_income == pytest.approx(expected)

    def test_summary_total_tax_saving(self):
        result = self._build(projection_years=5)
        expected = sum(y.tax_saving for y in result.years)
        assert result.summary.total_tax_saving == pytest.approx(expected)

    def test_summary_net_wealth(self):
        result = self._build(projection_years=5)
        last = result.years[-1]
        expected = last.equity + last.cumulative_position
        assert result.summary.net_wealth == pytest.approx(expected, abs=1)

    # ── Cumulative position ───────────────────

    def test_cumulative_is_running_total(self):
        result = self._build(projection_years=3)
        expected = -result.upfront_costs.total_cash_at_settlement
        for y in result.years:
            expected += y.net_position
            assert y.cumulative_position == pytest.approx(expected, abs=1)

    # ── Comparison with PPOR ──────────────────

    def test_rentvest_has_rent_paid_ppor_does_not(self):
        prop_ppor = _make_property(is_ppor=True, purchase_price=500_000)
        prop_inv = _make_property(is_ppor=False, purchase_price=500_000, weekly_rent=450)
        ppor = build_ppor_cashflow(_make_mortgage(property=prop_ppor, projection_years=3))
        rentvest = self._build(property=prop_inv, projection_years=3)
        assert all(not isinstance(y, CashFlowYearInvestment) for y in ppor.years)
        assert all(y.rent_paid > 0 for y in rentvest.years)


class TestCashflowEdgeCases:
    """Edge cases for cashflow projections."""

    def test_ppor_negative_income_growth(self):
        """Negative income growth should reduce income over time."""
        result = build_ppor_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=True),
                tax_profile=_make_tax_profile(income_growth_rate=-0.02),
                projection_years=3,
            )
        )
        assert result.years[2].net_income < result.years[0].net_income

    def test_ppor_zero_appreciation(self):
        """Zero appreciation should keep property value flat."""
        result = build_ppor_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=True, annual_appreciation=0.0),
                projection_years=3,
            )
        )
        assert result.years[0].property_value == pytest.approx(result.years[2].property_value, abs=1)

    def test_rentvest_negative_appreciation(self):
        """Negative appreciation (property depreciation) should reduce value."""
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(
                    is_ppor=False,
                    annual_appreciation=-0.02,
                    weekly_rent=450,
                    rent_growth=0.03,
                    vacancy_weeks=2,
                    buildings=[
                        DepreciableBuilding(
                            name="Main",
                            construction_cost=250_000,
                            purchase_date=date(2020, 1, 15),
                            construction_start_date=date(2019, 1, 1),
                        )
                    ],
                ),
                ongoing_costs=_make_ongoing_costs(landlord_insurance=1_000, management_rate=0.08),
                rentvest=_make_rentvest(),
                projection_years=3,
            )
        )
        assert result.years[2].property_value < result.years[0].property_value

    def test_ppor_single_year(self):
        """Single year projection should work."""
        result = build_ppor_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=True),
                projection_years=1,
            )
        )
        assert len(result.years) == 1
        assert result.summary is not None

    def test_rentvest_single_year(self):
        """Single year rentvest should work and have CGT."""
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(
                    is_ppor=False,
                    weekly_rent=450,
                    rent_growth=0.03,
                    vacancy_weeks=2,
                    buildings=[
                        DepreciableBuilding(
                            name="Main",
                            construction_cost=250_000,
                            purchase_date=date(2020, 1, 15),
                            construction_start_date=date(2019, 1, 1),
                        )
                    ],
                ),
                ongoing_costs=_make_ongoing_costs(landlord_insurance=1_000, management_rate=0.08),
                rentvest=_make_rentvest(),
                projection_years=1,
            )
        )
        assert len(result.years) == 1
        assert result.cgt is not None

    def test_ppor_projection_beyond_loan_term(self):
        """Projection longer than loan term — years after payoff should have zero mortgage."""
        result = build_ppor_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=True),
                loan=_make_loan(loan_term_years=3),
                projection_years=5,
            )
        )
        # Year 4 (5th year) is beyond a 3-year loan
        assert result.years[4].mortgage_repayment == 0
        assert result.years[4].mortgage_interest == 0
        assert result.years[4].loan_balance == 0

    def test_rentvest_borrowing_cost_deduction_year_zero(self):
        """Borrowing cost deduction should apply in year 0 (regression test for off-by-one)."""
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(
                    is_ppor=False,
                    weekly_rent=450,
                    rent_growth=0.03,
                    vacancy_weeks=2,
                    buildings=[
                        DepreciableBuilding(
                            name="Main",
                            construction_cost=250_000,
                            purchase_date=date(2020, 1, 15),
                            construction_start_date=date(2019, 1, 1),
                        )
                    ],
                ),
                loan=_make_loan(borrowing_costs=BorrowingCosts(lmi=10_000)),
                ongoing_costs=_make_ongoing_costs(landlord_insurance=1_000, management_rate=0.08),
                rentvest=_make_rentvest(),
                projection_years=1,
            )
        )
        # Year 0 should have a borrowing cost deduction
        assert result.years[0].tax_deduction_detail is not None
        assert result.years[0].tax_deduction_detail.borrowing_costs_deduction > 0

    def test_rentvest_borrowing_cost_deduction_year_four(self):
        """Borrowing cost deduction should still apply in year 4 (5th year of 5-year spread)."""
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(
                    is_ppor=False,
                    weekly_rent=450,
                    rent_growth=0.03,
                    vacancy_weeks=2,
                    buildings=[
                        DepreciableBuilding(
                            name="Main",
                            construction_cost=250_000,
                            purchase_date=date(2020, 1, 15),
                            construction_start_date=date(2019, 1, 1),
                        )
                    ],
                ),
                loan=_make_loan(borrowing_costs=BorrowingCosts(lmi=10_000)),
                ongoing_costs=_make_ongoing_costs(landlord_insurance=1_000, management_rate=0.08),
                rentvest=_make_rentvest(),
                projection_years=6,
            )
        )
        # Year 4 (5th year) should still have deduction
        assert result.years[4].tax_deduction_detail.borrowing_costs_deduction > 0
        # Year 5 (6th year) should have zero
        assert result.years[5].tax_deduction_detail.borrowing_costs_deduction == 0


# ──────────────────────────────────────────────
# HECS/HELP paydown and indexation
# ──────────────────────────────────────────────


def _hecs_profile(hecs_balance=30_000, indexation=0.0, taxable_income=120_000) -> TaxProfile:
    """Flat $120k income repays $7,950 of HECS a year under the 2025-26 thresholds."""
    return TaxProfile(
        taxable_income=taxable_income,
        repayment_income=taxable_income,
        mls_income=taxable_income,
        hecs_balance=hecs_balance,
        has_private_health=True,
        income_growth_rate=0.0,
        hecs_indexation_rate=indexation,
    )


class TestHecsPaydown:
    """HECS/HELP debt should be indexed, repaid and cleared across the projection."""

    def _ppor(self, projection_years=10, **profile):
        return build_ppor_cashflow(
            _make_mortgage(tax_profile=_hecs_profile(**profile), projection_years=projection_years)
        )

    def _rentvest(self, weekly_rent=450, annual_rate=0.06, projection_years=10, **profile):
        return build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=weekly_rent),
                tax_profile=_hecs_profile(**profile),
                loan=_make_loan(annual_rate=annual_rate),
                rentvest=_make_rentvest(),
                projection_years=projection_years,
            )
        )

    def test_total_repaid_equals_debt_without_indexation(self):
        result = self._ppor()
        assert sum(y.hecs_repayment for y in result.years) == pytest.approx(30_000)

    def test_repayments_stop_once_debt_is_cleared(self):
        """Three full $7,950 repayments, a $6,150 remainder, then nothing."""
        repayments = [y.hecs_repayment for y in self._ppor().years]
        assert repayments[:4] == pytest.approx([7_950, 7_950, 7_950, 6_150])
        assert repayments[4:] == [0] * 6

    def test_balance_runs_down_to_zero(self):
        balances = [y.hecs_balance for y in self._ppor().years]
        assert balances[:4] == pytest.approx([22_050, 14_100, 6_150, 0])
        assert balances[-1] == 0

    def test_tax_matches_a_debt_free_profile_after_payoff(self):
        with_debt = self._ppor()
        debt_free = self._ppor(hecs_balance=0)
        assert with_debt.years[0].income_tax == pytest.approx(debt_free.years[0].income_tax + 7_950)
        assert with_debt.years[5].income_tax == pytest.approx(debt_free.years[5].income_tax)

    def test_indexation_applies_before_repayment(self):
        years = self._ppor(indexation=0.03).years
        end_year_0 = 30_000 * 1.03 - 7_950
        assert years[0].hecs_balance == pytest.approx(end_year_0)
        assert years[1].hecs_balance == pytest.approx(end_year_0 * 1.03 - 7_950)

    def test_indexation_increases_total_repaid(self):
        result = self._ppor(indexation=0.03)
        assert sum(y.hecs_repayment for y in result.years) > 30_000
        assert result.years[-1].hecs_balance == 0

    def test_no_debt_means_no_repayment(self):
        result = self._ppor(hecs_balance=0, indexation=0.03)
        assert all(y.hecs_repayment == 0 and y.hecs_balance == 0 for y in result.years)

    def test_rental_loss_does_not_change_repayment(self):
        """A negatively geared property's loss is added back to repayment income."""
        year = self._rentvest().years[0]
        assert year.tax_deduction_detail.net_rental_income < 0
        assert year.hecs_repayment == pytest.approx(7_950)

    def test_rental_profit_increases_repayment(self):
        """A positively geared property's profit counts towards repayment income."""
        year = self._rentvest(weekly_rent=1_500, annual_rate=0.02).years[0]
        profit = year.tax_deduction_detail.net_rental_income
        assert profit > 0
        assert year.hecs_repayment == pytest.approx(calculate_hecs_repayment(120_000 + profit, 30_000))
        assert year.hecs_balance == pytest.approx(30_000 - year.hecs_repayment)

    def test_rentvest_debt_is_cleared(self):
        result = self._rentvest()
        assert sum(y.hecs_repayment for y in result.years) == pytest.approx(30_000)
        assert result.years[-1].hecs_balance == 0

    def test_sale_cgt_ignores_a_cleared_debt(self):
        """Once the debt is repaid, the capital gain triggers no extra HECS repayment."""
        with_debt = self._rentvest()
        debt_free = self._rentvest(hecs_balance=0)
        assert with_debt.cgt.cgt_payable == pytest.approx(debt_free.cgt.cgt_payable)


# ──────────────────────────────────────────────
# Offset account contributions
# ──────────────────────────────────────────────


class TestOffsetContributions:
    """Offset contributions should reconcile with the offset balance every year."""

    def _loan(self, loan_term_years=30) -> LoanConfig:
        return LoanConfig(
            deposit=100_000,
            annual_rate=0.06,
            loan_term_years=loan_term_years,
            offset_balance=20_000,
            offset_contribution=500,
            borrowing_costs=BorrowingCosts(lmi=0.0, mortgage_registration_fee=0.0, loan_establishment_fee=0.0),
        )

    def test_every_contribution_is_counted(self):
        """The schedule's first contribution lands in period 2, so year 0 has eleven."""
        result = build_ppor_cashflow(_make_mortgage(loan=self._loan(), projection_years=5))
        contributions = [y.offset_contributions for y in result.years]
        assert contributions == pytest.approx([5_500, 6_000, 6_000, 6_000, 6_000])

    def test_contributions_reconcile_with_offset_balance(self):
        result = build_ppor_cashflow(_make_mortgage(loan=self._loan(), projection_years=5))
        total = sum(y.offset_contributions for y in result.years)
        assert result.years[-1].offset_balance == pytest.approx(20_000 + total)

    def test_rentvest_counts_every_contribution(self):
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450),
                loan=self._loan(),
                rentvest=_make_rentvest(),
                projection_years=3,
            )
        )
        assert [y.offset_contributions for y in result.years] == pytest.approx([5_500, 6_000, 6_000])

    def test_offset_balance_kept_after_the_schedule_ends(self):
        """Projecting past the loan term should not drop the offset balance from net wealth."""
        result = build_ppor_cashflow(_make_mortgage(loan=self._loan(loan_term_years=2), projection_years=4))
        end_of_loan = result.years[1].offset_balance
        assert end_of_loan > 20_000
        assert result.years[2].offset_balance == pytest.approx(end_of_loan)
        assert result.years[3].offset_balance == pytest.approx(end_of_loan)
        assert result.years[3].offset_contributions == 0

    def test_year_uses_opening_offset_balance(self):
        rows = [_make_schedule_row(period=i + 1, offset_balance=9_500 + 500 * i) for i in range(12)]
        year = _calculate_cashflow_year(
            year=1,
            tax_profile=_make_tax_profile(),
            schedule_rows=rows,
            ongoing_costs=_make_year_cost(),
            previous_cumulative=0,
            opening_offset_balance=9_000,
        )
        assert year.offset_contributions == pytest.approx(6_000)
        assert year.offset_balance == pytest.approx(15_000)


# ──────────────────────────────────────────────
# Net wealth and total tax
# ──────────────────────────────────────────────


class TestNetWealth:
    """Net wealth has one definition: equity + cumulative cash + offset balance."""

    def test_year_net_wealth_includes_offset_balance(self):
        year = _make_cashflow_year(offset_balance=10_000)
        assert year.net_wealth == pytest.approx(year.equity + year.cumulative_position + 10_000)

    def test_summary_net_wealth_matches_final_year(self):
        loan = LoanConfig(
            deposit=100_000,
            annual_rate=0.06,
            loan_term_years=30,
            offset_balance=20_000,
            offset_contribution=500,
            borrowing_costs=BorrowingCosts(lmi=0.0, mortgage_registration_fee=0.0, loan_establishment_fee=0.0),
        )
        result = build_ppor_cashflow(_make_mortgage(loan=loan, projection_years=5))
        last = result.years[-1]
        assert last.offset_balance > 0
        assert result.summary.net_wealth == pytest.approx(last.net_wealth)
        assert result.summary.net_wealth == pytest.approx(
            result.summary.final_equity + last.cumulative_position + last.offset_balance
        )

    def test_investment_net_wealth_after_cgt(self):
        year = _make_investment_cashflow_year()
        year.cgt_if_sold = 12_000
        assert year.net_wealth_after_cgt == pytest.approx(year.net_wealth - 12_000)

    def test_ppor_total_tax_paid(self):
        result = build_ppor_cashflow(_make_mortgage(projection_years=5))
        assert result.summary.total_tax_paid == pytest.approx(sum(y.income_tax for y in result.years))

    def test_rentvest_total_tax_paid_is_net_of_tax_saving(self):
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450),
                rentvest=_make_rentvest(),
                projection_years=5,
            )
        )
        assert result.summary.total_tax_saving != 0
        assert result.summary.total_tax_paid == pytest.approx(
            sum(y.income_tax - y.tax_saving for y in result.years)
        )


class TestCgtIfSold:
    """Each investment year carries the CGT payable on a sale at the end of that year."""

    def _build(self, projection_years=5):
        return build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450),
                rentvest=_make_rentvest(),
                projection_years=projection_years,
            )
        )

    def test_final_year_matches_projection_cgt(self):
        result = self._build()
        assert result.years[-1].cgt_if_sold == pytest.approx(result.cgt.cgt_payable)

    def test_grows_as_the_property_appreciates(self):
        cgt = [y.cgt_if_sold for y in self._build(projection_years=8).years]
        assert all(later > earlier for earlier, later in zip(cgt[1:], cgt[2:]))

    def test_shorter_projection_matches_same_year_of_longer_one(self):
        """Selling after 3 years costs the same CGT whether or not the projection runs longer."""
        assert self._build(projection_years=8).years[2].cgt_if_sold == pytest.approx(
            self._build(projection_years=3).cgt.cgt_payable
        )


# ──────────────────────────────────────────────
# End-of-year property value
# ──────────────────────────────────────────────


class TestClosingPropertyValue:
    """Year rows hold the property value at the end of the year, like the loan balance."""

    def test_year_rows_use_end_of_year_value(self):
        result = build_ppor_cashflow(_make_mortgage(projection_years=3))
        values = [y.property_value for y in result.years]
        assert values == pytest.approx([500_000 * 1.05, 500_000 * 1.05**2, 500_000 * 1.05**3])

    def test_equity_uses_end_of_year_value(self):
        year = build_ppor_cashflow(_make_mortgage(projection_years=1)).years[0]
        assert year.equity == pytest.approx(500_000 * 1.05 - year.loan_balance)

    def test_costs_stay_based_on_start_of_year_value(self):
        year = build_ppor_cashflow(_make_mortgage(projection_years=1)).years[0]
        assert year.ongoing_costs_detail.property_value == pytest.approx(500_000)
        assert year.ongoing_costs_detail.maintenance_cost == pytest.approx(5_000)

    def test_final_property_value_is_the_sale_price(self):
        result = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450),
                rentvest=_make_rentvest(),
                projection_years=5,
            )
        )
        sale_price = result.cgt.cost_base + result.cgt.capital_gain
        assert result.summary.final_property_value == pytest.approx(sale_price)
        assert result.years[-1].property_value == pytest.approx(500_000 * 1.05**5)

    def test_year_calculator_falls_back_to_cost_basis_value(self):
        year = _calculate_cashflow_year(
            year=0,
            tax_profile=_make_tax_profile(),
            schedule_rows=[_make_schedule_row()],
            ongoing_costs=_make_year_cost(property_value=500_000),
            previous_cumulative=0,
        )
        assert year.property_value == pytest.approx(500_000)


# ──────────────────────────────────────────────
# CGT cost base
# ──────────────────────────────────────────────


class TestCgtCostBase:
    """The CGT cost base includes purchase costs, whether entered or auto-estimated."""

    def _build(self, purchase_costs=None):
        return build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450, purchase_costs=purchase_costs),
                rentvest=_make_rentvest(),
                projection_years=5,
            )
        )

    def test_includes_auto_estimated_purchase_costs(self):
        result = self._build()
        estimated = result.upfront_costs.purchase_costs.total
        assert estimated > 0
        assert result.cgt.cost_base == pytest.approx(500_000 + estimated)

    def test_includes_entered_purchase_costs(self):
        result = self._build(
            PurchaseCosts(stamp_duty=10_000, legal_fees=1_000, building_pest_inspection=0, registration_fee=0)
        )
        assert result.cgt.cost_base == pytest.approx(511_000)

    def test_purchase_costs_reduce_cgt(self):
        no_costs = self._build(
            PurchaseCosts(stamp_duty=0, legal_fees=0, building_pest_inspection=0, registration_fee=0)
        )
        assert self._build().cgt.cgt_payable < no_costs.cgt.cgt_payable

    def test_every_year_uses_the_same_cost_base(self):
        """Selling after 3 years costs the same CGT whether or not the projection runs longer."""
        result = self._build()
        shorter = build_rentvest_cashflow(
            _make_mortgage(
                property=_make_property(is_ppor=False, weekly_rent=450),
                rentvest=_make_rentvest(),
                projection_years=3,
            )
        )
        assert result.years[2].cgt_if_sold == pytest.approx(shorter.cgt.cgt_payable)
