"""
Amortisation domain models.

Dataclasses representing amortisation schedule rows, full schedules,
chart data points, and the complete result returned by the service.
"""

from dataclasses import dataclass


@dataclass
class ScheduleRow:
    """
    A single period in the amortisation schedule.

    Attributes:
        period: Period number (1-indexed)
        opening_balance: Loan balance at start of period
        interest: Interest charged this period
        principal_paid: Principal portion of scheduled repayment
        extra_paid: Additional repayment on top of scheduled
        closing_balance: Loan balance at end of period
        annual_rate: Annual interest rate applied this period
        scheduled_repayment: Fixed repayment amount per period
        offset_balance: Offset account balance this period
    """
    period: int
    opening_balance: float
    interest: float
    principal_paid: float
    extra_paid: float
    closing_balance: float
    annual_rate: float
    scheduled_repayment: float
    offset_balance: float


@dataclass
class AmortisationSchedule:
    """
    Full amortisation schedule with summary stats.

    Attributes:
        rows: Per-period schedule rows
        total_interest: Total interest paid over the life of the loan
        total_periods: Number of periods until loan is paid off
        periods_per_year: Number of repayment periods per year
    """
    rows: list[ScheduleRow]
    total_interest: float
    total_periods: int
    periods_per_year: int


@dataclass
class YearChartPoint:
    """
    A single year's chart data point.

    Attributes:
        year: Projection year (0 = purchase year)
        balance: Remaining loan balance at end of year
        total_interest: Cumulative interest paid to end of year
        property_value: Appreciated property value at end of year
        equity: Property value minus remaining loan balance
        offset_balance: Offset account balance at end of year
    """
    year: int
    balance: float
    total_interest: float
    property_value: float
    equity: float
    offset_balance: float


@dataclass
class ScheduleResult:
    """
    Full result from the amortisation service — schedule, summary, and chart data.

    Attributes:
        schedule: Complete amortisation schedule with per-period rows
        payment: Periodic repayment amount
        purchase_price: Original property purchase price
        deposit: Deposit amount
        loan_amount: Principal borrowed (purchase_price - deposit)
        lvr: Loan-to-value ratio as decimal (e.g. 0.80)
        annual_appreciation: Annual property growth rate as decimal
        chart_data: Per-year chart data points for visualisation
    """
    schedule: AmortisationSchedule
    payment: float
    purchase_price: float
    deposit: float
    loan_amount: float
    lvr: float
    annual_appreciation: float
    chart_data: list[YearChartPoint]
