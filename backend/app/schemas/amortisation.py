"""
API request/response schemas for the amortisation endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field
from app.models.loan import RepaymentFrequency


# ── Request ───────────────────────────────────

class RateChangeRequest(BaseModel):
    from_period: int
    annual_rate: float


class ScheduleRequest(BaseModel):
    principal: float = Field(ge=0, description="Loan amount in dollars")
    annual_rate: float = Field(ge=0, le=1, description="Annual rate as decimal, e.g. 0.062")
    loan_term_years: int = Field(ge=1, le=40, description="Loan term in years")
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY
    offset_balance: float = Field(default=0.0, ge=0)
    extra_repayment: float = Field(default=0.0, ge=0)
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)


# ── Response ──────────────────────────────────

class ScheduleRowResponse(BaseModel):
    period: int
    opening_balance: float
    interest: float
    principal_paid: float
    extra_paid: float
    closing_balance: float
    annual_rate: float
    scheduled_repayment: float


class ChartPoint(BaseModel):
    year: int
    balance: float
    total_interest: float
    equity: float


class ScheduleResponse(BaseModel):
    payment: float
    total_interest: float
    total_periods: int
    rows: list[ScheduleRowResponse]
    chart_data: list[ChartPoint]
