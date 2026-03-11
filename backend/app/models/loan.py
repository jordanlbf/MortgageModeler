"""
Loan domain models — mortgage configuration and rate changes.
"""

from dataclasses import dataclass
from enum import Enum


class RepaymentFrequency(str, Enum):
    WEEKLY = "weekly"              # 52 per year, 7 days per period
    FORTNIGHTLY = "fortnightly"    # 26 per year, 14 days per period
    MONTHLY = "monthly"            # 12 per year, 365/12 days per period

    @property
    def periods_per_year(self) -> int:
        return {"weekly": 52, "fortnightly": 26, "monthly": 12}[self.value]

    @property
    def days_per_period(self) -> float:
        return {"weekly": 7, "fortnightly": 14, "monthly": 365 / 12}[self.value]


@dataclass
class RateChange:
    """A scheduled rate change at a specific period."""
    from_period: int
    annual_rate: float
