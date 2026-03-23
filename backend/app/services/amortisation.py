"""
Amortisation service.

Provides three functions:
- build_loan: constructs a Loan aggregate from Property and LoanConfig
- build_year_chart_point: single year's chart data point
- build_schedule_result: schedule + chart data (used by amortisation endpoint)
"""

from dataclasses import replace

from app.engine.amortisation import generate_schedule
from app.models.amortisation import AmortisationSchedule, ScheduleResult, YearChartPoint
from app.models.loan import Loan, LoanConfig
from app.models.mortgage import Mortgage
from app.models.property import Property
from app.services.upfront_costs import resolve_borrowing_costs


def build_loan(property: Property, loan_config: LoanConfig) -> Loan:
    """Build a Loan aggregate from property and loan configuration.

    Computes the loan principal from purchase price, deposit, and capitalised
    borrowing costs, then generates the full amortisation schedule.

    Args:
        property: Property with purchase price for loan amount calculation.
        loan_config: Loan configuration (rate, term, offset, etc.).

    Returns:
        Loan wrapping the config and its generated amortisation schedule.
    """
    # Resolve any None borrowing costs to auto-estimated values before
    # computing the loan principal, so capitalised costs are included.
    base_loan = max(property.purchase_price - loan_config.deposit, 0.0)
    lvr = base_loan / property.purchase_price if property.purchase_price > 0 else 0.0
    is_investment = not property.is_ppor

    resolved_bc = resolve_borrowing_costs(base_loan, lvr, is_investment, loan_config.borrowing_costs)
    resolved_config = replace(loan_config, borrowing_costs=resolved_bc)

    loan_amount = base_loan + resolved_bc.total_capitalised

    schedule = generate_schedule(
        principal=loan_amount,
        annual_rate=resolved_config.annual_rate,
        loan_term_years=resolved_config.loan_term_years,
        frequency=resolved_config.frequency,
        offset_balance=resolved_config.offset_balance,
        extra_repayment=resolved_config.extra_repayment,
        rate_changes=resolved_config.rate_changes or None,
        offset_contribution=resolved_config.offset_contribution,
    )

    return Loan(config=resolved_config, schedule=schedule)


def build_year_chart_point(
    year: int,
    mortgage: Mortgage,
    schedule: AmortisationSchedule,
    loan_amount: float,
) -> YearChartPoint:
    """
    Build a single year's chart data point.

    Calculates property value, loan balance, cumulative interest,
    equity, and projected offset for the given year.

    Args:
        year: Projection year (0 = purchase year)
        mortgage: Mortgage aggregate with property and loan details
        schedule: Full amortisation schedule to read balances from
        loan_amount: Pre-calculated loan principal (including capitalised costs)

    Returns:
        YearChartPoint for the given year
    """
    ppy = schedule.periods_per_year

    if year == 0:
        return YearChartPoint(
            year=0,
            balance=loan_amount,
            total_interest=0.0,
            property_value=mortgage.property.purchase_price,
            equity=round(mortgage.loan.config.deposit, 2),
            offset_balance=round(mortgage.loan.config.offset_balance, 2),
        )

    property_value = mortgage.property.purchase_price * (1 + mortgage.property.annual_appreciation) ** year

    if schedule.rows:
        idx = min(year * ppy - 1, len(schedule.rows) - 1)
        row = schedule.rows[idx]
        balance = row.closing_balance
        cumulative_interest = sum(r.interest for r in schedule.rows[: idx + 1])
    else:
        balance = 0.0
        cumulative_interest = 0.0

    equity = property_value - balance

    periods_elapsed = year * ppy
    projected_offset = mortgage.loan.config.offset_balance + mortgage.loan.config.offset_contribution * max(
        periods_elapsed - 1, 0
    )

    return YearChartPoint(
        year=year,
        balance=round(balance, 2),
        total_interest=round(cumulative_interest, 2),
        property_value=round(property_value, 2),
        equity=round(equity, 2),
        offset_balance=round(projected_offset, 2),
    )


def build_schedule_result(mortgage: Mortgage) -> ScheduleResult:
    """
    Generate a full amortisation schedule with chart data.

    Reads the pre-built schedule from the Mortgage's Loan, then builds
    yearly chart points via build_year_chart_point.

    Args:
        mortgage: Mortgage aggregate with property and loan details

    Returns:
        ScheduleResult with per-period schedule, summary stats, and yearly chart data
    """
    loan_amount = max(mortgage.property.purchase_price - mortgage.loan.config.deposit, 0.0)
    loan_amount += mortgage.loan.config.borrowing_costs.total_capitalised
    lvr = loan_amount / mortgage.property.purchase_price if mortgage.property.purchase_price > 0 else 0.0

    schedule = mortgage.loan.schedule

    chart_data = [
        build_year_chart_point(year, mortgage, schedule, loan_amount)
        for year in range(mortgage.loan.config.loan_term_years + 1)
    ]

    return ScheduleResult(
        schedule=schedule,
        payment=round(schedule.rows[0].scheduled_repayment, 2) if schedule.rows else 0.0,
        purchase_price=mortgage.property.purchase_price,
        deposit=mortgage.loan.config.deposit,
        loan_amount=round(loan_amount, 2),
        lvr=round(lvr, 4),
        annual_appreciation=mortgage.property.annual_appreciation,
        chart_data=chart_data,
    )
