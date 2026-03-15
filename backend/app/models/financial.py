"""
Financial domain models — shared financial concepts.
"""

from dataclasses import dataclass
from datetime import date
from calendar import isleap


@dataclass
class FinancialYear:
    """
    Australian financial year (1 July to 30 June).

    Attributes:
        year: Ending calendar year (e.g. 2025 = FY 2024-25, ending 30 June 2025)
    """
    year: int

    @property
    def start_date(self) -> date:
        """
        First day of the financial year.

        Returns:
            1 July of the preceding calendar year
        """
        return date(self.year - 1, 7, 1)

    @property
    def end_date(self) -> date:
        """
        Last day of the financial year.

        Returns:
            30 June of the ending calendar year
        """
        return date(self.year, 6, 30)

    @property
    def days(self) -> int:
        """
        Number of days in the financial year.

        Returns:
            366 if the ending calendar year is a leap year, otherwise 365
        """
        return 366 if isleap(self.year) else 365
