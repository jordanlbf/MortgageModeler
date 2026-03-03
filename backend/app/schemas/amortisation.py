"""
API request/response schemas for the amortisation endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field, model_validator
from app.models.loan import RepaymentFrequency


# ── Request ───────────────────────────────────

class RateChangeRequest(BaseModel):
    from_period: int
    annual_rate: float


class ScheduleRequest(BaseModel):
    """ge = Greater than or equal to, le = Less than or equal to"""
    purchase_price: float = Field(ge=0, description="Property purchase price")
    deposit: float = Field(default=0.0, ge=0, description="Upfront deposit amount")
    annual_rate: float = Field(ge=0, le=1, description="Annual rate as decimal, e.g. 0.062")
    loan_term_years: int = Field(ge=1, le=40, description="Loan term in years")
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY
    offset_balance: float = Field(default=0.0, ge=0)
    extra_repayment: float = Field(default=0.0, ge=0)
    annual_appreciation: float = Field(default=0.0, ge=0, le=1, description="Annual property growth rate as decimal, e.g. 0.05")
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)

    @property
    def loan_amount(self) -> float:
        return max(self.purchase_price - self.deposit, 0.0)

    @property
    def lvr(self) -> float:
        if self.purchase_price <= 0:
            return 0.0
        return self.loan_amount / self.purchase_price

    @model_validator(mode="after")
    def deposit_within_price(self):
        if self.deposit > self.purchase_price:
            raise ValueError("Deposit cannot exceed purchase price")
        return self


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
    property_value: float
    equity: float


class ScheduleSummary(BaseModel):
    purchase_price: float
    deposit: float
    loan_amount: float
    lvr: float
    annual_appreciation: float


class ScheduleResponse(BaseModel):
    summary: ScheduleSummary
    payment: float
    total_interest: float
    total_periods: int
    rows: list[ScheduleRowResponse]
    chart_data: list[ChartPoint]
