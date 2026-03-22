"""
Loan domain models — mortgage configuration, rate changes, and loan aggregate.
"""

from dataclasses import dataclass, field
from typing import Optional
from enum import Enum

from app.models.amortisation import AmortisationSchedule, ScheduleRow


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


@dataclass
class BorrowingCosts:
    """
    Loan-related upfront costs — deductible over 5 years (or loan term if shorter).

    Fields default to None (auto-estimated by upfront costs service).
    Set to 0.0 to explicitly waive (e.g. LMI exempt). Set to a value to override.
    Each cost has a capitalise flag — True adds it to the loan principal,
    False pays it as cash at settlement.

    Attributes:
        lmi: Lenders Mortgage Insurance (None = auto-estimate)
        mortgage_registration_fee: Mortgage registration fee (None = auto-estimate)
        loan_establishment_fee: Loan establishment/application fee (None = auto-estimate)
        capitalise_lmi: Whether to add LMI to loan principal (default True)
        capitalise_mortgage_registration_fee: Whether to add mortgage registration to principal (default True)
        capitalise_loan_establishment_fee: Whether to add loan establishment to principal (default True)
    """
    lmi: Optional[float] = None
    mortgage_registration_fee: Optional[float] = None
    loan_establishment_fee: Optional[float] = None
    capitalise_lmi: bool = True
    capitalise_mortgage_registration_fee: bool = True
    capitalise_loan_establishment_fee: bool = True

    @property
    def total_capitalised(self) -> float:
        """
        Amount added to loan principal.

        Returns:
            Sum of borrowing costs where capitalise flag is True
        """
        return (
            ((self.lmi or 0.0) if self.capitalise_lmi else 0.0) +
            ((self.mortgage_registration_fee or 0.0) if self.capitalise_mortgage_registration_fee else 0.0) +
            ((self.loan_establishment_fee or 0.0) if self.capitalise_loan_establishment_fee else 0.0)
        )

    @property
    def total_upfront(self) -> float:
        """
        Amount paid as cash at settlement.

        Returns:
            Sum of borrowing costs where capitalise flag is False
        """
        return (
            ((self.lmi or 0.0) if not self.capitalise_lmi else 0.0) +
            ((self.mortgage_registration_fee or 0.0) if not self.capitalise_mortgage_registration_fee else 0.0) +
            ((self.loan_establishment_fee or 0.0) if not self.capitalise_loan_establishment_fee else 0.0)
        )

    @property
    def total(self) -> float:
        """
        Sum of all borrowing cost components.

        None values are treated as 0. Call after resolution for accurate totals.

        Returns:
            Total borrowing costs
        """
        return (self.lmi or 0.0) + (self.mortgage_registration_fee or 0.0) + (self.loan_establishment_fee or 0.0)


@dataclass
class LoanConfig:
    """
    Mortgage loan configuration for cash flow projections.

    Attributes:
        deposit: Initial deposit amount
        annual_rate: Annual interest rate as decimal (e.g. 0.062 for 6.2%)
        loan_term_years: Loan term in years
        frequency: Repayment frequency (weekly, fortnightly, monthly)
        offset_balance: Initial offset account balance
        offset_contribution: Amount added to offset each period
        extra_repayment: Additional repayment per period on top of scheduled
        rate_changes: Scheduled interest rate changes during the loan term
        borrowing_costs: Upfront loan-related costs (LMI, registration, establishment)
    """
    deposit: float
    annual_rate: float
    loan_term_years: int
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY
    offset_balance: float = 0.0
    offset_contribution: float = 0.0
    extra_repayment: float = 0.0
    rate_changes: list[RateChange] = field(default_factory=list)
    borrowing_costs: BorrowingCosts = field(default_factory=BorrowingCosts)


@dataclass
class Loan:
    """
    Behaviour-rich loan aggregate combining configuration with its
    generated amortisation schedule.

    Provides per-year accessors that eliminate the need to pass loose
    schedule-derived values (interest, balance, rows) through service layers.

    Attributes:
        config: Loan configuration (rates, term, offset, etc.)
        schedule: Generated amortisation schedule for this loan
    """
    config: LoanConfig
    schedule: AmortisationSchedule

    def rows_for_year(self, year: int) -> list[ScheduleRow]:
        """Slice schedule rows for a specific projection year.

        Args:
            year: Projection year (0-indexed).

        Returns:
            List of ScheduleRow for this year.
        """
        ppy = self.schedule.periods_per_year
        start = year * ppy
        end = min((year + 1) * ppy, len(self.schedule.rows))
        return self.schedule.rows[start:end]

    def interest_for_year(self, year: int) -> float:
        """Total interest charged in the given projection year.

        Args:
            year: Projection year (0-indexed).

        Returns:
            Sum of interest across all periods in the year.
        """
        return sum(r.interest for r in self.rows_for_year(year))

    def balance_at_year(self, year: int) -> float:
        """Closing loan balance at the end of the given projection year.

        Args:
            year: Projection year (0-indexed).

        Returns:
            Closing balance of the last period in the year, or 0.0 if no rows.
        """
        rows = self.rows_for_year(year)
        return rows[-1].closing_balance if rows else 0.0

    def principal_for_year(self, year: int) -> float:
        """Total principal (scheduled + extra) repaid in the given projection year.

        Args:
            year: Projection year (0-indexed).

        Returns:
            Sum of principal paid and extra repayments across all periods in the year.
        """
        return sum(r.principal_paid + r.extra_paid for r in self.rows_for_year(year))
