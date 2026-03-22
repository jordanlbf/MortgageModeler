"""
Tests for amortisation service — build_schedule_result.
"""

import pytest
from datetime import date

from app.services.amortisation import build_loan, build_schedule_result, build_amortisation_schedule, build_year_chart_point
from app.models.amortisation import AmortisationSchedule
from app.models.loan import RepaymentFrequency, RateChange, LoanConfig, BorrowingCosts
from app.models.mortgage import Mortgage
from app.models.property import Property


# ──────────────────────────────────────────────
# Fixtures / Helpers
# ──────────────────────────────────────────────

def _make_property(purchase_price=500_000, annual_appreciation=0.03) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        annual_appreciation=annual_appreciation,
    )


def _make_loan(deposit=100_000, annual_rate=0.06, loan_term_years=30,
               frequency=RepaymentFrequency.MONTHLY, offset_balance=0.0,
               offset_contribution=0.0, extra_repayment=0.0,
               rate_changes=None, borrowing_costs=None) -> LoanConfig:
    return LoanConfig(
        deposit=deposit,
        annual_rate=annual_rate,
        loan_term_years=loan_term_years,
        frequency=frequency,
        offset_balance=offset_balance,
        offset_contribution=offset_contribution,
        extra_repayment=extra_repayment,
        rate_changes=rate_changes or [],
        borrowing_costs=borrowing_costs or BorrowingCosts(),
    )


def _make_mortgage(property=None, loan=None) -> Mortgage:
    p = property or _make_property()
    lc = loan or _make_loan()
    return Mortgage(
        property=p,
        loan=build_loan(p, lc),
    )


def _build(property=None, loan=None):
    return build_schedule_result(_make_mortgage(property, loan))


# ──────────────────────────────────────────────
# ScheduleResult structure
# ──────────────────────────────────────────────

class TestScheduleResultStructure:
    """Tests that the returned ScheduleResult has correct fields and types."""

    def test_returns_schedule_result(self):
        result = _build()
        assert result.purchase_price == 500_000
        assert result.deposit == 100_000
        assert result.loan_amount == 400_000
        assert result.lvr == 0.8
        assert result.annual_appreciation == 0.03

    def test_payment_is_positive(self):
        result = _build()
        assert result.payment > 0

    def test_schedule_has_rows(self):
        result = _build()
        assert len(result.schedule.rows) > 0

    def test_schedule_total_periods_matches_rows(self):
        result = _build()
        assert result.schedule.total_periods == len(result.schedule.rows)


# ──────────────────────────────────────────────
# Chart data
# ──────────────────────────────────────────────

class TestChartData:
    """Tests for the yearly chart data points."""

    def test_chart_data_length(self):
        """Chart data should have loan_term_years + 1 entries (year 0 through N)."""
        result = _build(loan=_make_loan(loan_term_years=30))
        assert len(result.chart_data) == 31

    def test_year_zero_chart_point(self):
        """Year 0 should reflect initial state."""
        result = _build()
        y0 = result.chart_data[0]
        assert y0.year == 0
        assert y0.balance == 400_000
        assert y0.total_interest == 0.0
        assert y0.property_value == 500_000
        assert y0.equity == 100_000
        assert y0.offset_balance == 0.0

    def test_year_zero_with_offset(self):
        """Year 0 offset_balance should match the starting offset."""
        result = _build(loan=_make_loan(offset_balance=50_000))
        assert result.chart_data[0].offset_balance == 50_000

    def test_years_are_sequential(self):
        result = _build(loan=_make_loan(loan_term_years=10))
        years = [p.year for p in result.chart_data]
        assert years == list(range(11))

    def test_balance_decreases_over_time(self):
        """Loan balance should generally decrease year over year."""
        result = _build()
        for i in range(1, len(result.chart_data)):
            assert result.chart_data[i].balance <= result.chart_data[i - 1].balance

    def test_final_balance_is_zero(self):
        """After full term the loan should be fully repaid."""
        result = _build()
        assert result.chart_data[-1].balance == pytest.approx(0, abs=1)

    def test_cumulative_interest_increases(self):
        """Total interest should increase (or stay flat) each year."""
        result = _build()
        for i in range(1, len(result.chart_data)):
            assert result.chart_data[i].total_interest >= result.chart_data[i - 1].total_interest

    def test_property_value_appreciates(self):
        """Property value should grow with appreciation."""
        result = _build(property=_make_property(annual_appreciation=0.05))
        for i in range(1, len(result.chart_data)):
            assert result.chart_data[i].property_value > result.chart_data[i - 1].property_value

    def test_property_value_year_n(self):
        """Property value at year N should match compound growth formula."""
        result = _build(
            property=_make_property(annual_appreciation=0.04),
            loan=_make_loan(loan_term_years=10),
        )
        y10 = result.chart_data[10]
        expected = 500_000 * (1.04 ** 10)
        assert y10.property_value == pytest.approx(expected, rel=1e-4)

    def test_equity_equals_property_value_minus_balance(self):
        """Equity = property value - balance at every point."""
        result = _build()
        for pt in result.chart_data:
            assert pt.equity == pytest.approx(pt.property_value - pt.balance, abs=1)

    def test_zero_appreciation(self):
        """With 0% appreciation, property value stays at purchase price."""
        result = _build(
            property=_make_property(annual_appreciation=0.0),
            loan=_make_loan(loan_term_years=5),
        )
        for pt in result.chart_data:
            assert pt.property_value == pytest.approx(500_000, abs=1)


# ──────────────────────────────────────────────
# Offset account
# ──────────────────────────────────────────────

class TestOffsetAccount:
    """Tests for offset account behaviour in chart data."""

    def test_offset_grows_over_time(self):
        """Offset balance should grow by contribution each period."""
        result = _build(loan=_make_loan(offset_balance=10_000, offset_contribution=500))
        y1 = result.chart_data[1]
        assert y1.offset_balance > 10_000

    def test_offset_reduces_interest(self):
        """A large offset should reduce total interest paid."""
        result_no_offset = _build(loan=_make_loan(offset_balance=0))
        result_with_offset = _build(loan=_make_loan(offset_balance=100_000))
        assert result_with_offset.schedule.total_interest < result_no_offset.schedule.total_interest

    def test_zero_offset_contribution(self):
        """With zero contribution, offset stays at initial balance in chart."""
        result = _build(loan=_make_loan(offset_balance=20_000, offset_contribution=0))
        for pt in result.chart_data:
            assert pt.offset_balance == pytest.approx(20_000, abs=1)


# ──────────────────────────────────────────────
# Extra repayments
# ──────────────────────────────────────────────

class TestExtraRepayments:
    """Tests for extra repayment behaviour."""

    def test_extra_repayments_reduce_interest(self):
        """Extra repayments should reduce total interest."""
        result_normal = _build(loan=_make_loan(extra_repayment=0))
        result_extra = _build(loan=_make_loan(extra_repayment=200))
        assert result_extra.schedule.total_interest < result_normal.schedule.total_interest

    def test_extra_repayments_shorten_loan(self):
        """Extra repayments should reduce the number of periods."""
        result_normal = _build(loan=_make_loan(extra_repayment=0))
        result_extra = _build(loan=_make_loan(extra_repayment=500))
        assert result_extra.schedule.total_periods < result_normal.schedule.total_periods


# ──────────────────────────────────────────────
# Frequencies
# ──────────────────────────────────────────────

class TestFrequencies:
    """Tests for different repayment frequencies."""

    def test_weekly_has_more_periods(self):
        result_monthly = _build(loan=_make_loan(frequency=RepaymentFrequency.MONTHLY))
        result_weekly = _build(loan=_make_loan(frequency=RepaymentFrequency.WEEKLY))
        assert result_weekly.schedule.total_periods > result_monthly.schedule.total_periods

    def test_fortnightly_between_weekly_and_monthly(self):
        result_monthly = _build(loan=_make_loan(frequency=RepaymentFrequency.MONTHLY))
        result_fortnightly = _build(loan=_make_loan(frequency=RepaymentFrequency.FORTNIGHTLY))
        result_weekly = _build(loan=_make_loan(frequency=RepaymentFrequency.WEEKLY))
        assert result_monthly.schedule.total_periods < result_fortnightly.schedule.total_periods < result_weekly.schedule.total_periods

    def test_chart_data_length_same_across_frequencies(self):
        """Chart data is always loan_term_years + 1 regardless of frequency."""
        for freq in RepaymentFrequency:
            result = _build(loan=_make_loan(frequency=freq, loan_term_years=10))
            assert len(result.chart_data) == 11


# ──────────────────────────────────────────────
# Rate changes
# ──────────────────────────────────────────────

class TestRateChanges:
    """Tests for mid-loan rate changes."""

    def test_rate_increase_raises_interest(self):
        """A rate increase partway through should increase total interest."""
        result_flat = _build(loan=_make_loan(annual_rate=0.05))
        result_increase = _build(loan=_make_loan(
            annual_rate=0.05,
            rate_changes=[RateChange(from_period=60, annual_rate=0.08)],
        ))
        assert result_increase.schedule.total_interest > result_flat.schedule.total_interest

    def test_rate_decrease_reduces_interest(self):
        """A rate decrease partway through should reduce total interest."""
        result_flat = _build(loan=_make_loan(annual_rate=0.06))
        result_decrease = _build(loan=_make_loan(
            annual_rate=0.06,
            rate_changes=[RateChange(from_period=60, annual_rate=0.03)],
        ))
        assert result_decrease.schedule.total_interest < result_flat.schedule.total_interest


# ──────────────────────────────────────────────
# Edge cases
# ──────────────────────────────────────────────

class TestEdgeCases:
    """Tests for edge case inputs."""

    def test_zero_loan_amount(self):
        """Zero loan should produce zero payment and empty schedule."""
        result = _build(
            property=_make_property(purchase_price=500_000),
            loan=_make_loan(deposit=500_000),
        )
        assert result.payment == 0.0
        assert len(result.schedule.rows) == 0

    def test_zero_interest_rate(self):
        """Zero rate should produce equal principal payments (no interest)."""
        result = _build(loan=_make_loan(annual_rate=0.0, loan_term_years=10))
        assert result.schedule.total_interest == pytest.approx(0, abs=1)
        assert result.payment > 0

    def test_short_term(self):
        """1 year loan should work and produce chart with 2 points."""
        result = _build(loan=_make_loan(loan_term_years=1))
        assert len(result.chart_data) == 2
        assert result.chart_data[-1].balance == pytest.approx(0, abs=1)

    def test_values_are_rounded(self):
        """Key output values should be rounded to 2 decimal places."""
        result = _build()
        assert result.loan_amount == round(result.loan_amount, 2)
        for pt in result.chart_data:
            assert pt.balance == round(pt.balance, 2)
            assert pt.total_interest == round(pt.total_interest, 2)
            assert pt.property_value == round(pt.property_value, 2)
            assert pt.equity == round(pt.equity, 2)


class TestBuildAmortisationScheduleDirect:
    """Direct tests for build_amortisation_schedule (currently only tested indirectly)."""

    def test_returns_amortisation_schedule(self):
        schedule = build_amortisation_schedule(_make_mortgage())
        assert isinstance(schedule, AmortisationSchedule)

    def test_has_rows(self):
        schedule = build_amortisation_schedule(_make_mortgage())
        assert len(schedule.rows) > 0

    def test_periods_per_year_monthly(self):
        schedule = build_amortisation_schedule(_make_mortgage())
        assert schedule.periods_per_year == 12

    def test_periods_per_year_weekly(self):
        schedule = build_amortisation_schedule(
            _make_mortgage(loan=_make_loan(frequency=RepaymentFrequency.WEEKLY)),
        )
        assert schedule.periods_per_year == 52

    def test_zero_loan_empty_schedule(self):
        schedule = build_amortisation_schedule(
            _make_mortgage(
                property=_make_property(purchase_price=500_000),
                loan=_make_loan(deposit=500_000),
            ),
        )
        assert len(schedule.rows) == 0

    def test_total_interest_positive(self):
        schedule = build_amortisation_schedule(_make_mortgage())
        assert schedule.total_interest > 0

    def test_capitalised_borrowing_costs_increase_principal(self):
        """Capitalised borrowing costs should increase the loan principal."""
        from app.models.loan import BorrowingCosts
        schedule_no_bc = build_amortisation_schedule(_make_mortgage())
        schedule_with_bc = build_amortisation_schedule(
            _make_mortgage(loan=_make_loan(borrowing_costs=BorrowingCosts(lmi=20_000))),
        )
        # Higher principal means more total interest
        assert schedule_with_bc.total_interest > schedule_no_bc.total_interest
