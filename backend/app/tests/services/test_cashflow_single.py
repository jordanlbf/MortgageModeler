"""
Tests for single property cashflow projection service — all four mode × property_use combos.
"""

from datetime import date

import pytest

from app.models.cashflow import (
    CashFlowSingleResult,
    CashFlowSummary,
    CashFlowSummaryInvestment,
    CashFlowYear,
    CashFlowYearInvestment,
)
from app.models.deductions import DepreciableBuilding
from app.models.loan import BorrowingCosts, LoanConfig
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import (
    OngoingCostsConfig,
    Property,
    PurchaseCosts,
    RentalConfig,
)
from app.models.tax import TaxProfile
from app.services.amortisation import build_existing_loan, build_loan
from app.services.cashflow import build_ppor_cashflow, build_rentvest_cashflow
from app.services.cashflow_single import build_single_cashflow

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
    value_base=None,
) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        is_ppor=is_ppor,
        value_base=value_base,
        annual_appreciation=annual_appreciation,
        purchase_costs=purchase_costs or PurchaseCosts(),
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


def _make_loan_config(
    deposit=100_000, annual_rate=0.06, loan_term_years=30, borrowing_costs=None,
) -> LoanConfig:
    return LoanConfig(
        deposit=deposit,
        annual_rate=annual_rate,
        loan_term_years=loan_term_years,
        borrowing_costs=borrowing_costs
        or BorrowingCosts(lmi=0.0, mortgage_registration_fee=0.0, loan_establishment_fee=0.0),
    )


def _make_ongoing_costs(
    council_rates=2_000, water_rates=1_200, building_insurance=1_500,
    landlord_insurance=0, management_rate=0.0, annual_cost_growth_rate=0.025,
) -> OngoingCostsConfig:
    return OngoingCostsConfig(
        council_rates=council_rates,
        water_rates=water_rates,
        building_insurance=building_insurance,
        landlord_insurance=landlord_insurance,
        management_rate=management_rate,
        annual_cost_growth_rate=annual_cost_growth_rate,
    )


def _make_new_mortgage(
    is_ppor=True, weekly_rent=0.0, buildings=None,
    landlord_insurance=0, management_rate=0.0,
    projection_years=5,
) -> Mortgage:
    """Build a mortgage for new purchase mode."""
    prop = _make_property(
        is_ppor=is_ppor, weekly_rent=weekly_rent, buildings=buildings,
    )
    lc = _make_loan_config()
    return Mortgage(
        property=prop,
        loan=build_loan(prop, lc),
        person=Person(tax_profile=_make_tax_profile()),
        ongoing_costs=_make_ongoing_costs(
            landlord_insurance=landlord_insurance, management_rate=management_rate,
        ),
        projection_years=projection_years,
    )


def _make_existing_mortgage(
    is_ppor=True, current_balance=350_000, remaining_term=25,
    current_value=600_000, purchase_price=500_000,
    weekly_rent=0.0, buildings=None,
    landlord_insurance=0, management_rate=0.0,
    borrowing_costs=None, projection_years=5,
) -> Mortgage:
    """Build a mortgage for existing property mode."""
    prop = _make_property(
        purchase_price=purchase_price,
        is_ppor=is_ppor,
        value_base=current_value,
        weekly_rent=weekly_rent,
        buildings=buildings,
    )
    loan = build_existing_loan(
        current_balance=current_balance,
        remaining_term_years=remaining_term,
        annual_rate=0.06,
        borrowing_costs=borrowing_costs,
    )
    return Mortgage(
        property=prop,
        loan=loan,
        person=Person(tax_profile=_make_tax_profile()),
        ongoing_costs=_make_ongoing_costs(
            landlord_insurance=landlord_insurance, management_rate=management_rate,
        ),
        projection_years=projection_years,
    )


# ──────────────────────────────────────────────
# New × PPOR
# ──────────────────────────────────────────────


class TestNewPpor:
    """Tests for new purchase × PPOR mode."""

    def _build(self, projection_years=5):
        mortgage = _make_new_mortgage(is_ppor=True, projection_years=projection_years)
        return build_single_cashflow(mortgage, mode="new", property_use="ppor")

    # ── Structure ─────────────────────────────

    def test_returns_single_result(self):
        result = self._build()
        assert isinstance(result, CashFlowSingleResult)

    def test_mode_echoed(self):
        assert self._build().mode == "new"

    def test_property_use_echoed(self):
        assert self._build().property_use == "ppor"

    def test_projection_years_echoed(self):
        assert self._build(projection_years=10).projection_years == 10

    def test_correct_year_count(self):
        assert len(self._build(projection_years=7).years) == 7

    def test_years_sequential(self):
        years = [y.year for y in self._build().years]
        assert years == [0, 1, 2, 3, 4]

    # ── Upfront costs (present for new) ──────

    def test_has_upfront_costs(self):
        result = self._build()
        assert result.upfront_costs is not None
        assert result.upfront_costs.total >= 0

    # ── No CGT for PPOR ─────────────────────

    def test_no_cgt(self):
        assert self._build().cgt is None

    # ── Year type is base CashFlowYear ───────

    def test_years_are_base_type(self):
        result = self._build()
        for y in result.years:
            assert type(y) is CashFlowYear
            assert not isinstance(y, CashFlowYearInvestment)

    # ── Summary type is base ─────────────────

    def test_summary_is_base_type(self):
        result = self._build()
        assert type(result.summary) is CashFlowSummary
        assert not isinstance(result.summary, CashFlowSummaryInvestment)

    # ── Value assertions ─────────────────────

    def test_income_grows(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].net_income > result.years[i - 1].net_income

    def test_property_value_grows(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].property_value > result.years[i - 1].property_value

    def test_loan_balance_decreases(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].loan_balance <= result.years[i - 1].loan_balance

    def test_equity_increases(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].equity > result.years[i - 1].equity

    def test_total_inflows_equals_net_income(self):
        """PPOR: total_inflows = net_income (no rental, no tax saving)."""
        result = self._build()
        for y in result.years:
            assert y.total_inflows == pytest.approx(y.net_income, abs=0.01)

    def test_net_position_is_inflows_minus_outflows(self):
        result = self._build()
        for y in result.years:
            assert y.net_position == pytest.approx(y.total_inflows - y.total_outflows, abs=0.01)

    def test_cumulative_starts_negative(self):
        """Year 0 cumulative should be reduced by upfront costs."""
        result = self._build()
        assert result.years[0].cumulative_position < result.years[0].net_position

    def test_cumulative_is_running_total(self):
        result = self._build()
        expected = -result.upfront_costs.total_cash_at_settlement
        for y in result.years:
            expected += y.net_position
            assert y.cumulative_position == pytest.approx(expected, abs=1)

    def test_summary_net_wealth(self):
        result = self._build()
        last = result.years[-1]
        expected = last.equity + last.cumulative_position
        assert result.summary.net_wealth == pytest.approx(expected, abs=1)


# ──────────────────────────────────────────────
# New × Investment
# ──────────────────────────────────────────────


class TestNewInvestment:
    """Tests for new purchase × investment mode."""

    def _build(self, projection_years=5):
        mortgage = _make_new_mortgage(
            is_ppor=False,
            weekly_rent=450,
            buildings=[
                DepreciableBuilding(
                    name="Main building",
                    construction_cost=250_000,
                    purchase_date=date(2020, 1, 15),
                    construction_start_date=date(2019, 1, 1),
                )
            ],
            landlord_insurance=1_000,
            management_rate=0.08,
            projection_years=projection_years,
        )
        return build_single_cashflow(mortgage, mode="new", property_use="investment")

    # ── Structure ─────────────────────────────

    def test_mode_echoed(self):
        assert self._build().mode == "new"

    def test_property_use_echoed(self):
        assert self._build().property_use == "investment"

    def test_correct_year_count(self):
        assert len(self._build().years) == 5

    # ── Upfront costs (present for new) ──────

    def test_has_upfront_costs(self):
        assert self._build().upfront_costs is not None

    # ── CGT present for investment ───────────

    def test_has_cgt(self):
        result = self._build()
        assert result.cgt is not None
        assert result.cgt.capital_gain > 0

    def test_cgt_has_discount(self):
        result = self._build()
        if result.cgt.capital_gain > 0:
            assert result.cgt.cgt_discount > 0

    def test_cgt_payable_positive(self):
        result = self._build()
        if result.cgt.capital_gain > 0:
            assert result.cgt.cgt_payable > 0

    # ── Year type is investment ──────────────

    def test_years_are_investment_type(self):
        result = self._build()
        for y in result.years:
            assert isinstance(y, CashFlowYearInvestment)

    # ── Summary type is investment ───────────

    def test_summary_is_investment_type(self):
        result = self._build()
        assert isinstance(result.summary, CashFlowSummaryInvestment)

    # ── Investment-specific fields ───────────

    def test_rental_income_positive(self):
        result = self._build()
        for y in result.years:
            assert y.rental_income > 0

    def test_rental_income_grows(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].rental_income > result.years[i - 1].rental_income

    def test_tax_saving_present(self):
        result = self._build()
        assert any(y.tax_saving != 0 for y in result.years)

    def test_tax_deduction_detail_present(self):
        result = self._build()
        for y in result.years:
            assert y.tax_deduction_detail is not None

    def test_rent_paid_zero(self):
        """Single property investment (not rentvesting) → no rent paid."""
        result = self._build()
        for y in result.years:
            assert y.rent_paid == 0.0

    def test_total_inflows_includes_rental_and_tax_saving(self):
        result = self._build()
        for y in result.years:
            expected = y.net_income + y.rental_income + y.tax_saving
            assert y.total_inflows == pytest.approx(expected, abs=0.01)

    # ── Summary fields ───────────────────────

    def test_summary_total_rental_income(self):
        result = self._build()
        expected = sum(y.rental_income for y in result.years)
        assert result.summary.total_rental_income == pytest.approx(expected)

    def test_summary_total_tax_saving(self):
        result = self._build()
        expected = sum(y.tax_saving for y in result.years)
        assert result.summary.total_tax_saving == pytest.approx(expected)

    def test_summary_total_rent_paid_zero(self):
        result = self._build()
        assert result.summary.total_rent_paid == 0.0

    def test_summary_net_wealth(self):
        result = self._build()
        last = result.years[-1]
        expected = last.equity + last.cumulative_position
        assert result.summary.net_wealth == pytest.approx(expected, abs=1)


# ──────────────────────────────────────────────
# Existing × PPOR
# ──────────────────────────────────────────────


class TestExistingPpor:
    """Tests for existing property × PPOR mode."""

    def _build(self, projection_years=5, **overrides):
        mortgage = _make_existing_mortgage(
            is_ppor=True, projection_years=projection_years, **overrides,
        )
        return build_single_cashflow(mortgage, mode="existing", property_use="ppor")

    # ── Structure ─────────────────────────────

    def test_mode_echoed(self):
        assert self._build().mode == "existing"

    def test_property_use_echoed(self):
        assert self._build().property_use == "ppor"

    def test_correct_year_count(self):
        assert len(self._build().years) == 5

    # ── No upfront costs for existing ────────

    def test_no_upfront_costs(self):
        assert self._build().upfront_costs is None

    # ── No CGT for PPOR ─────────────────────

    def test_no_cgt(self):
        assert self._build().cgt is None

    # ── Year type is base ────────────────────

    def test_years_are_base_type(self):
        result = self._build()
        for y in result.years:
            assert type(y) is CashFlowYear

    # ── Cumulative starts at zero ────────────

    def test_cumulative_starts_at_zero_plus_net(self):
        """Existing mode has no upfront costs → cumulative year 0 = net_position."""
        result = self._build()
        assert result.years[0].cumulative_position == pytest.approx(
            result.years[0].net_position, abs=0.01
        )

    # ── Loan seeds from current balance ──────

    def test_loan_balance_starts_from_current(self):
        result = self._build(current_balance=350_000)
        # Year 0 loan balance should be close to 350k (minus 1 year of principal)
        assert result.years[0].loan_balance < 350_000
        assert result.years[0].loan_balance > 300_000

    def test_loan_balance_decreases(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].loan_balance <= result.years[i - 1].loan_balance

    # ── Property appreciates from value_base ─

    def test_property_value_based_on_current_value(self):
        """Property value should start near current_value (600k), not purchase_price (500k)."""
        result = self._build(current_value=600_000, purchase_price=500_000)
        # Year 0 value should be 600k * (1 + 0.05)^0 = ~600k at appreciation start
        # (engine calculates year 0 as purchase_price * (1+r)^0 = purchase_price)
        assert result.years[0].property_value == pytest.approx(600_000, rel=0.01)

    def test_property_value_grows(self):
        result = self._build()
        for i in range(1, len(result.years)):
            assert result.years[i].property_value > result.years[i - 1].property_value

    # ── Summary ──────────────────────────────

    def test_summary_final_values_match_last_year(self):
        result = self._build()
        last = result.years[-1]
        assert result.summary.final_property_value == pytest.approx(last.property_value)
        assert result.summary.final_loan_balance == pytest.approx(last.loan_balance)


# ──────────────────────────────────────────────
# Existing × Investment
# ──────────────────────────────────────────────


class TestExistingInvestment:
    """Tests for existing property × investment mode."""

    def _build(self, projection_years=5, **overrides):
        defaults = dict(
            is_ppor=False,
            weekly_rent=500,
            buildings=[
                DepreciableBuilding(
                    name="Main building",
                    construction_cost=250_000,
                    purchase_date=date(2020, 1, 15),
                    construction_start_date=date(2019, 1, 1),
                )
            ],
            landlord_insurance=1_000,
            management_rate=0.08,
            projection_years=projection_years,
        )
        defaults.update(overrides)
        mortgage = _make_existing_mortgage(**defaults)
        return build_single_cashflow(mortgage, mode="existing", property_use="investment")

    # ── Structure ─────────────────────────────

    def test_mode_echoed(self):
        assert self._build().mode == "existing"

    def test_property_use_echoed(self):
        assert self._build().property_use == "investment"

    # ── No upfront costs ─────────────────────

    def test_no_upfront_costs(self):
        assert self._build().upfront_costs is None

    # ── CGT present ──────────────────────────

    def test_has_cgt(self):
        result = self._build()
        assert result.cgt is not None

    def test_cgt_capital_gain_positive(self):
        result = self._build()
        assert result.cgt.capital_gain > 0

    # ── Year type is investment ──────────────

    def test_years_are_investment_type(self):
        result = self._build()
        for y in result.years:
            assert isinstance(y, CashFlowYearInvestment)

    # ── Investment fields ────────────────────

    def test_rental_income_positive(self):
        result = self._build()
        for y in result.years:
            assert y.rental_income > 0

    def test_tax_saving_present(self):
        result = self._build()
        assert any(y.tax_saving != 0 for y in result.years)

    def test_tax_deduction_detail_present(self):
        result = self._build()
        for y in result.years:
            assert y.tax_deduction_detail is not None

    def test_rent_paid_zero(self):
        """Single property (not rentvesting) → no rent paid."""
        result = self._build()
        for y in result.years:
            assert y.rent_paid == 0.0

    # ── Cumulative starts at zero ────────────

    def test_cumulative_starts_at_zero_plus_net(self):
        result = self._build()
        assert result.years[0].cumulative_position == pytest.approx(
            result.years[0].net_position, abs=0.01
        )

    # ── CGT uses value_base for sale price ───

    def test_cgt_sale_price_from_current_value(self):
        """CGT sale price should be based on current_value appreciated, not purchase_price."""
        result = self._build(
            current_value=600_000, purchase_price=500_000, projection_years=5,
        )
        # Sale price = 600k * (1.05)^5 ≈ 765,769
        # Cost base includes purchase_price (500k) + costs
        # Capital gain should be much larger than if based on 500k
        assert result.cgt.capital_gain > 200_000

    # ── Summary type ─────────────────────────

    def test_summary_is_investment_type(self):
        result = self._build()
        assert isinstance(result.summary, CashFlowSummaryInvestment)

    def test_summary_total_rental_income(self):
        result = self._build()
        expected = sum(y.rental_income for y in result.years)
        assert result.summary.total_rental_income == pytest.approx(expected)


# ──────────────────────────────────────────────
# Borrowing cost years_elapsed integration
# ──────────────────────────────────────────────


class TestExistingBorrowingCostOffset:
    """Tests for borrowing cost deduction offset in existing investment mode."""

    def _build(self, years_elapsed=0, bc_total=10_000, projection_years=6):
        bc = BorrowingCosts(lmi=bc_total, years_elapsed=years_elapsed)
        mortgage = _make_existing_mortgage(
            is_ppor=False,
            weekly_rent=500,
            buildings=[
                DepreciableBuilding(
                    name="Main building",
                    construction_cost=250_000,
                    purchase_date=date(2020, 1, 15),
                    construction_start_date=date(2019, 1, 1),
                )
            ],
            landlord_insurance=1_000,
            management_rate=0.08,
            borrowing_costs=bc,
            projection_years=projection_years,
        )
        return build_single_cashflow(mortgage, mode="existing", property_use="investment")

    def test_zero_elapsed_has_deductions(self):
        """Fresh borrowing costs should have deductions in year 0."""
        result = self._build(years_elapsed=0)
        assert result.years[0].tax_deduction_detail.borrowing_costs_deduction > 0

    def test_elapsed_3_year_0_has_deduction(self):
        """3 years elapsed → deductions still active in projection year 0."""
        result = self._build(years_elapsed=3)
        assert result.years[0].tax_deduction_detail.borrowing_costs_deduction > 0

    def test_elapsed_3_year_2_no_deduction(self):
        """3 years elapsed → projection year 2 = effective year 5 → no deduction."""
        result = self._build(years_elapsed=3)
        assert result.years[2].tax_deduction_detail.borrowing_costs_deduction == 0.0

    def test_elapsed_5_no_deductions(self):
        """5 years fully elapsed → no deductions at any year."""
        result = self._build(years_elapsed=5)
        for y in result.years:
            assert y.tax_deduction_detail.borrowing_costs_deduction == 0.0


# ──────────────────────────────────────────────
# Property value_base integration
# ──────────────────────────────────────────────


class TestValueBase:
    """Tests for value_base effect on property value and maintenance."""

    def test_value_base_affects_property_value(self):
        """Existing property with value_base=600k should appreciate from 600k, not 500k."""
        result_existing = build_single_cashflow(
            _make_existing_mortgage(
                is_ppor=True, current_value=600_000, purchase_price=500_000, projection_years=1,
            ),
            mode="existing", property_use="ppor",
        )
        result_new = build_single_cashflow(
            _make_new_mortgage(is_ppor=True, projection_years=1),
            mode="new", property_use="ppor",
        )
        # Existing starts from 600k, new from 500k → existing year 0 value > new year 0
        assert result_existing.years[0].property_value > result_new.years[0].property_value

    def test_value_base_none_uses_purchase_price(self):
        """When value_base is None, should use purchase_price (backwards compatible)."""
        prop = _make_property(purchase_price=500_000, value_base=None)
        lc = _make_loan_config()
        mortgage = Mortgage(
            property=prop,
            loan=build_loan(prop, lc),
            person=Person(tax_profile=_make_tax_profile()),
            ongoing_costs=_make_ongoing_costs(),
            projection_years=2,
        )
        result = build_single_cashflow(mortgage, mode="new", property_use="ppor")
        # Year 1 should be 500k * (1.05)^1 = 525k
        assert result.years[1].property_value == pytest.approx(500_000 * 1.05, rel=0.01)


# ──────────────────────────────────────────────
# Consistency with existing endpoints
# ──────────────────────────────────────────────


class TestConsistencyWithExisting:
    """New-mode single cashflow should match existing endpoint results."""

    def test_new_ppor_matches_build_ppor_cashflow(self):
        """new × ppor should produce same years/summary as build_ppor_cashflow."""
        prop = _make_property(is_ppor=True)
        lc = _make_loan_config()
        mortgage = Mortgage(
            property=prop,
            loan=build_loan(prop, lc),
            person=Person(tax_profile=_make_tax_profile()),
            ongoing_costs=_make_ongoing_costs(),
            projection_years=5,
        )
        existing_result = build_ppor_cashflow(mortgage)
        single_result = build_single_cashflow(mortgage, mode="new", property_use="ppor")

        assert single_result.projection_years == existing_result.projection_years
        assert len(single_result.years) == len(existing_result.years)

        for s, e in zip(single_result.years, existing_result.years):
            assert s.net_income == pytest.approx(e.net_income, abs=0.01)
            assert s.total_inflows == pytest.approx(e.total_inflows, abs=0.01)
            assert s.total_outflows == pytest.approx(e.total_outflows, abs=0.01)
            assert s.net_position == pytest.approx(e.net_position, abs=0.01)
            assert s.cumulative_position == pytest.approx(e.cumulative_position, abs=1)
            assert s.property_value == pytest.approx(e.property_value, abs=0.01)
            assert s.loan_balance == pytest.approx(e.loan_balance, abs=0.01)

        assert single_result.summary.net_wealth == pytest.approx(
            existing_result.summary.net_wealth, abs=1
        )
        assert single_result.summary.total_income == pytest.approx(
            existing_result.summary.total_income, abs=1
        )


# ──────────────────────────────────────────────
# Edge cases
# ──────────────────────────────────────────────


class TestSingleCashflowEdgeCases:
    """Edge cases for single property cashflow projections."""

    def test_single_year_projection(self):
        mortgage = _make_new_mortgage(is_ppor=True, projection_years=1)
        result = build_single_cashflow(mortgage, mode="new", property_use="ppor")
        assert len(result.years) == 1
        assert result.summary is not None

    def test_single_year_investment(self):
        mortgage = _make_new_mortgage(
            is_ppor=False, weekly_rent=450,
            buildings=[
                DepreciableBuilding(
                    name="Main", construction_cost=250_000,
                    purchase_date=date(2020, 1, 15),
                    construction_start_date=date(2019, 1, 1),
                )
            ],
            landlord_insurance=1_000, management_rate=0.08,
            projection_years=1,
        )
        result = build_single_cashflow(mortgage, mode="new", property_use="investment")
        assert len(result.years) == 1
        assert result.cgt is not None

    def test_existing_ppor_projection_beyond_loan(self):
        """Projection longer than remaining loan term → zero mortgage after payoff."""
        mortgage = _make_existing_mortgage(
            is_ppor=True, current_balance=50_000, remaining_term=3, projection_years=5,
        )
        result = build_single_cashflow(mortgage, mode="existing", property_use="ppor")
        assert result.years[4].mortgage_repayment == 0
        assert result.years[4].loan_balance == 0

    def test_existing_zero_balance(self):
        """Fully paid off existing property → zero mortgage everywhere."""
        mortgage = _make_existing_mortgage(
            is_ppor=True, current_balance=0, remaining_term=25, projection_years=3,
        )
        result = build_single_cashflow(mortgage, mode="existing", property_use="ppor")
        for y in result.years:
            assert y.mortgage_repayment == 0
            assert y.mortgage_interest == 0
            assert y.loan_balance == 0

    def test_zero_appreciation_flat_value(self):
        prop = _make_property(purchase_price=500_000, annual_appreciation=0.0, is_ppor=True)
        lc = _make_loan_config()
        mortgage = Mortgage(
            property=prop,
            loan=build_loan(prop, lc),
            person=Person(tax_profile=_make_tax_profile()),
            ongoing_costs=_make_ongoing_costs(),
            projection_years=3,
        )
        result = build_single_cashflow(mortgage, mode="new", property_use="ppor")
        assert result.years[0].property_value == pytest.approx(
            result.years[2].property_value, abs=1
        )

    def test_existing_investment_no_buildings(self):
        """Existing investment with no depreciable buildings should still work."""
        mortgage = _make_existing_mortgage(
            is_ppor=False, weekly_rent=500,
            landlord_insurance=1_000, management_rate=0.08,
            buildings=None, projection_years=3,
        )
        result = build_single_cashflow(mortgage, mode="existing", property_use="investment")
        assert len(result.years) == 3
        assert result.cgt is not None
