"""
API request/response schemas for the tax breakdown endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field


# ── Request ───────────────────────────────────

class TaxBreakdownRequest(BaseModel):
    """
    Request parameters for generating a tax breakdown.

    Uses gross income for all tax calculations. Future iterations may
    support separate repayment income, taxable income, and MLS income.

    Attributes:
        gross_income: Individual's gross income
        hecs_balance: Outstanding HECS/HELP debt
        has_private_health: Whether the individual holds private health insurance
    """
    gross_income: float = Field(default=0.0, ge=0, description="Individual's gross income")
    hecs_balance: float = Field(default=0.0, ge=0, description="Individual's HECS Balance")
    has_private_health: bool = Field(default=False, description="Individual's Private Health Status")


# ── Response ──────────────────────────────────

class TaxBreakdownResponse(BaseModel):
    """
    Itemised tax breakdown with net income.

    Attributes:
        gross_income: Gross income before tax
        income_tax: Australian income tax
        medicare_levy: Medicare levy amount
        medicare_levy_surcharge: Medicare Levy Surcharge (0 if has private health)
        hecs_repayment: Annual HECS/HELP repayment
        net_income: Gross income minus total tax
        total_tax: Sum of all tax components
    """
    gross_income: float
    income_tax: float
    medicare_levy: float
    medicare_levy_surcharge: float
    hecs_repayment: float
    net_income: float
    total_tax: float
