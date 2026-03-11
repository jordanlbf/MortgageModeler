"""
Amortisation domain models.
"""

from dataclasses import dataclass


@dataclass
class ScheduleRow:
    """A single period in the amortisation schedule."""
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
    """Full amortisation schedule with summary stats."""
    rows: list[ScheduleRow]
    total_interest: float
    total_periods: int


@dataclass
class YearChartPoint:
    """A single year's chart data point."""
    year: int
    balance: float
    total_interest: float
    property_value: float
    equity: float
    offset_balance: float


@dataclass
class ScheduleResult:
    """Full result from the amortisation service — schedule, summary, and chart data."""
    schedule: AmortisationSchedule
    payment: float
    purchase_price: float
    deposit: float
    loan_amount: float
    lvr: float
    annual_appreciation: float
    chart_data: list[YearChartPoint]
