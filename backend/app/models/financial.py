"""
Financial domain models — shared financial concepts.
"""

from dataclasses import dataclass
from datetime import date
from calendar import isleap


@dataclass
class FinancialYear:
    """Australian financial year (1 July to 30 June)."""
    year: int  # e.g. 2025 = FY 2024-25

    @property
    def start_date(self) -> date:
        return date(self.year - 1, 7, 1)

    @property
    def end_date(self) -> date:
        return date(self.year, 6, 30)

    @property
    def days(self) -> int:
        return 366 if isleap(self.year) else 365
