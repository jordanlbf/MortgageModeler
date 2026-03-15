"""
Loan domain models — mortgage configuration and rate changes.
"""

from dataclasses import dataclass
from enum import Enum


class RepaymentFrequency(str, Enum):
    """
    Supported repayment frequencies for mortgage calculations.

    Attributes:
        WEEKLY: 52 payments per year, 7 days per period
        FORTNIGHTLY: 26 payments per year, 14 days per period
        MONTHLY: 12 payments per year, ~30.42 days per period
    """
    WEEKLY = "weekly"
    FORTNIGHTLY = "fortnightly"
    MONTHLY = "monthly"

    @property
    def periods_per_year(self) -> int:
        """
        Number of repayment periods in a year.

        Returns:
            52 for weekly, 26 for fortnightly, 12 for monthly
        """
        return {"weekly": 52, "fortnightly": 26, "monthly": 12}[self.value]

    @property
    def days_per_period(self) -> float:
        """
        Number of days in each repayment period.

        Returns:
            7 for weekly, 14 for fortnightly, 365/12 for monthly
        """
        return {"weekly": 7, "fortnightly": 14, "monthly": 365 / 12}[self.value]


@dataclass
class RateChange:
    """
    A scheduled rate change at a specific period.

    Attributes:
        from_period: Period number when the new rate takes effect
        annual_rate: New annual interest rate as decimal (e.g. 0.062 for 6.2%)
    """
    from_period: int
    annual_rate: float
