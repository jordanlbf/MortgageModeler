"""
Person models — individual borrower and their financial position.
"""

from pydantic import BaseModel, Field


class IncomeSource(BaseModel):
    """A single income source (dividends, side gig, etc.)."""
    label: str = ""
    annual_amount: float = 0.0


class Debt(BaseModel):
    """An existing debt obligation."""
    label: str = ""
    balance: float = 0.0
    monthly_repayment: float = 0.0


class Person(BaseModel):
    """An individual borrower."""
    name: str = ""

    # Income
    annual_gross_salary: float = 0.0
    other_income: list[IncomeSource] = Field(default_factory=list)

    # HECS
    has_hecs: bool = False
    hecs_balance: float = 0.0

    # Savings & assets
    cash_savings: float = 0.0
    shares_value: float = 0.0

    # Existing debts (affects serviceability)
    credit_card_limit: float = 0.0
    other_debts: list[Debt] = Field(default_factory=list)

    @property
    def total_annual_income(self) -> float:
        """Gross salary + all other income sources."""
        return self.annual_gross_salary + sum(s.annual_amount for s in self.other_income)

    @property
    def total_monthly_debt_obligations(self) -> float:
        """Sum of all existing monthly debt repayments."""
        return sum(d.monthly_repayment for d in self.other_debts)
