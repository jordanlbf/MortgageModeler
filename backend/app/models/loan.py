"""
Loan models — mortgage configuration and rate changes.
"""

from pydantic import BaseModel, Field
from enum import Enum


class RepaymentType(str, Enum):
    PRINCIPAL_AND_INTEREST = "pi"
    INTEREST_ONLY = "io"


class RateChange(BaseModel):
    """A scheduled rate change at a specific month."""
    from_month: int = Field(..., description="Month number when rate takes effect (1-based)")
    annual_rate: float = Field(..., description="New rate as decimal, e.g. 0.062")


class LoanConfig(BaseModel):
    """Configuration for a mortgage loan."""
    principal: float
    annual_rate: float = Field(..., description="Initial rate as decimal, e.g. 0.062 for 6.2%")
    loan_term_years: int = 30
    repayment_type: RepaymentType = RepaymentType.PRINCIPAL_AND_INTEREST
    io_period_years: int = Field(default=0, description="Interest-only period before switching to P&I")
    offset_balance: float = 0.0
    monthly_extra_repayment: float = 0.0
    rate_changes: list[RateChange] = Field(default_factory=list)
