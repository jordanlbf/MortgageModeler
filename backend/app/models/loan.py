"""
Loan domain models — mortgage configuration and rate changes.
"""

from dataclasses import dataclass, field
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


@dataclass
class BorrowingCosts:
    """
    Loan-related upfront costs — deductible over 5 years (or loan term if shorter).

    These are costs of obtaining the loan, not the property. They may be
    capitalised onto the loan principal or paid as cash at settlement.

    Attributes:
        lmi: Lenders Mortgage Insurance
        mortgage_registration_fee: Mortgage registration fee
        loan_establishment_fee: Loan establishment/application fee
    """
    lmi: float = 0.0
    mortgage_registration_fee: float = 0.0
    loan_establishment_fee: float = 0.0

    @property
    def total(self) -> float:
        """
        Sum of all borrowing cost components.

        Returns:
            Total borrowing costs
        """
        return self.lmi + self.mortgage_registration_fee + self.loan_establishment_fee


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
