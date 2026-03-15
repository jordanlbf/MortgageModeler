"""
API request/response schemas for the amortisation endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field, model_validator
from app.models.loan import RepaymentFrequency


# ── Request ───────────────────────────────────

class RateChangeRequest(BaseModel):
    """
    A scheduled interest rate change.

    Attributes:
        from_period: Period number when the new rate takes effect
        annual_rate: New annual interest rate as decimal
    """
    from_period: int
    annual_rate: float


class ScheduleRequest(BaseModel):
    """
    Request parameters for generating an amortisation schedule.

    Attributes:
        purchase_price: Property purchase price
        deposit: Upfront deposit amount
        annual_rate: Annual interest rate as decimal (e.g. 0.062 for 6.2%)
        loan_term_years: Loan term in years (1–40)
        frequency: Repayment frequency (weekly, fortnightly, monthly)
        offset_balance: Starting offset account balance
        offset_contribution: Amount added to offset each period
        extra_repayment: Additional repayment per period on top of scheduled
        annual_appreciation: Annual property growth rate as decimal (e.g. 0.05 for 5%)
        rate_changes: Scheduled interest rate changes during the loan term
    """
    purchase_price: float = Field(ge=0, description="Property purchase price")
    deposit: float = Field(default=0.0, ge=0, description="Upfront deposit amount")
    annual_rate: float = Field(ge=0, le=1, description="Annual rate as decimal, e.g. 0.062")
    loan_term_years: int = Field(ge=1, le=40, description="Loan term in years")
    frequency: RepaymentFrequency = RepaymentFrequency.MONTHLY
    offset_balance: float = Field(default=0.0, ge=0)
    offset_contribution: float = Field(default=0.0, ge=0)
    extra_repayment: float = Field(default=0.0, ge=0)
    annual_appreciation: float = Field(default=0.0, ge=0, le=1, description="Annual property growth rate as decimal, e.g. 0.05")
    rate_changes: list[RateChangeRequest] = Field(default_factory=list)

    @property
    def loan_amount(self) -> float:
        """
        Calculate loan amount from purchase price and deposit.

        Returns:
            Loan principal (purchase_price - deposit), minimum 0
        """
        return max(self.purchase_price - self.deposit, 0.0)

    @property
    def lvr(self) -> float:
        """
        Calculate loan-to-value ratio.

        Returns:
            LVR as decimal (e.g. 0.80), or 0 if purchase price is zero
        """
        if self.purchase_price <= 0:
            return 0.0
        return self.loan_amount / self.purchase_price

    @model_validator(mode="after")
    def deposit_within_price(self):
        """Validate that deposit does not exceed purchase price."""
        if self.deposit > self.purchase_price:
            raise ValueError("Deposit cannot exceed purchase price")
        return self


# ── Response ──────────────────────────────────

class ScheduleRowResponse(BaseModel):
    """
    A single period in the amortisation schedule response.

    Attributes:
        period: Period number (1-indexed)
        opening_balance: Loan balance at start of period
        interest: Interest charged this period
        principal_paid: Principal portion of scheduled repayment
        extra_paid: Additional repayment amount
        closing_balance: Loan balance at end of period
        annual_rate: Annual interest rate applied this period
        scheduled_repayment: Fixed repayment amount per period
        offset_balance: Offset account balance this period
    """
    period: int
    opening_balance: float
    interest: float
    principal_paid: float
    extra_paid: float
    closing_balance: float
    annual_rate: float
    scheduled_repayment: float
    offset_balance: float


class ChartPoint(BaseModel):
    """
    A single year's chart data point for visualisation.

    Attributes:
        year: Projection year (0 = purchase year)
        balance: Remaining loan balance at end of year
        total_interest: Cumulative interest paid to end of year
        property_value: Appreciated property value at end of year
        equity: Property value minus remaining loan balance
        offset_balance: Offset account balance at end of year
    """
    year: int
    balance: float
    total_interest: float
    property_value: float
    equity: float
    offset_balance: float


class ScheduleSummary(BaseModel):
    """
    Summary of loan parameters in the schedule response.

    Attributes:
        purchase_price: Original property purchase price
        deposit: Deposit amount
        loan_amount: Principal borrowed
        lvr: Loan-to-value ratio as decimal
        annual_appreciation: Annual property growth rate as decimal
    """
    purchase_price: float
    deposit: float
    loan_amount: float
    lvr: float
    annual_appreciation: float


class ScheduleResponse(BaseModel):
    """
    Full amortisation schedule API response.

    Attributes:
        summary: Loan parameter summary
        payment: Periodic repayment amount
        total_interest: Total interest paid over life of loan
        total_periods: Number of periods until loan is paid off
        rows: Per-period schedule rows
        chart_data: Per-year chart data points for visualisation
    """
    summary: ScheduleSummary
    payment: float
    total_interest: float
    total_periods: int
    rows: list[ScheduleRowResponse]
    chart_data: list[ChartPoint]
