"""
Loan models — mortgage configuration and rate changes.
"""

from pydantic import BaseModel, Field
from enum import Enum


class RepaymentType(str, Enum):
    PRINCIPAL_AND_INTEREST = "pi"
    INTEREST_ONLY = "io"


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


class RateChange(BaseModel):
    """A scheduled rate change at a specific period."""
    from_period: int = Field(..., description="Period number when rate takes effect (1-based)")
    annual_rate: float = Field(..., description="New rate as decimal, e.g. 0.062")


class LoanConfig(BaseModel):
    """Configuration for a mortgage loan."""
    principal: float
    annual_rate: float = Field(..., description="Initial rate as decimal, e.g. 0.062 for 6.2%")
    loan_term_years: int = 30
    repayment_type: RepaymentType = RepaymentType.PRINCIPAL_AND_INTEREST
    repayment_frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY
    io_period_years: int = Field(default=0, description="Interest-only period before switching to P&I")
    offset_balance: float = 0.0
    extra_repayment: float = Field(default=0.0, description="Extra repayment per period")
    rate_changes: list[RateChange] = Field(default_factory=list)
