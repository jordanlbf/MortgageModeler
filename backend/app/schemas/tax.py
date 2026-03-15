"""
API request/response schemas for the tax breakdown endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field


# ── Request ───────────────────────────────────

class TaxBreakdownRequest(BaseModel):
    """
    Request parameters for generating a tax breakdown.

    Supports separate income measures for accurate multi-component
    tax calculations. Frontends can send the same value for all
    income fields when divergence is not applicable.

    Attributes:
        taxable_income: Assessable income minus allowable deductions
        repayment_income: Income used for HECS repayment calculation
        mls_income: Income used for Medicare Levy Surcharge calculation
        hecs_balance: Outstanding HECS/HELP debt
        has_private_health: Whether the individual holds private health insurance
    """
    taxable_income: float = Field(default=0.0, ge=0, description="Assessable income minus allowable deductions")
    repayment_income: float = Field(default=0.0, ge=0, description="Income for HECS repayment calculation")
    mls_income: float = Field(default=0.0, ge=0, description="Income for Medicare Levy Surcharge calculation")
    hecs_balance: float = Field(default=0.0, ge=0, description="Outstanding HECS/HELP debt")
    has_private_health: bool = Field(default=False, description="Whether the individual holds private health insurance")


# ── Response ──────────────────────────────────

class TaxBreakdownResponse(BaseModel):
    """
    Itemised tax breakdown with net income.

    Attributes:
        taxable_income: Assessable income used for income tax and Medicare levy
        income_tax: Australian income tax
        medicare_levy: Medicare levy amount
        medicare_levy_surcharge: Medicare Levy Surcharge (0 if has private health)
        hecs_repayment: Annual HECS/HELP repayment
        total_tax: Sum of all tax components
        net_income: Taxable income minus total tax
    """
    taxable_income: float
    income_tax: float
    medicare_levy: float
    medicare_levy_surcharge: float
    hecs_repayment: float
    total_tax: float
    net_income: float
