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
