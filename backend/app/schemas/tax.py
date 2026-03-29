"""
API request/response schemas for the tax breakdown endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

# ── Request ───────────────────────────────────


class IncomeInputs(BaseModel):
    """Assessable income fields matching the Income tab."""

    salary: float = Field(ge=0, description="Salary and wages")
    rental: float = Field(default=0.0, ge=0, description="Rental income")
    interest: float = Field(default=0.0, ge=0, description="Interest income")
    dividend: float = Field(default=0.0, ge=0, description="Dividend income excluding franking")
    franking: float = Field(default=0.0, ge=0, description="Franking credits")
    capital_gain_short: float = Field(default=0.0, ge=0, description="Short-term capital gains (held < 12 months)")
    capital_gain_long: float = Field(default=0.0, ge=0, description="Long-term capital gains (held > 12 months)")


class DeductionInputs(BaseModel):
    """Allowable deduction fields matching the Deductions tab."""

    rental_deductions: float = Field(default=0.0, ge=0, description="Rental property deductions")
    work_deductions: float = Field(default=0.0, ge=0, description="Work-related deductions")


class AdjustmentInputs(BaseModel):
    """Income adjustment fields matching the Adjustments tab."""

    sal_sac: float = Field(default=0.0, ge=0, description="Reportable super (salary sacrifice)")
    rfb: float = Field(default=0.0, ge=0, description="Reportable fringe benefits (grossed-up)")
    hecs_bal: float = Field(default=0.0, ge=0, description="HELP/HECS debt balance")
    phi: bool = Field(default=False, description="Private health insurance (hospital cover)")
    sapto: bool = Field(default=False, description="Seniors and Pensioners Tax Offset eligibility")


class TaxBreakdownRequest(BaseModel):
    """
    Request for generating a tax breakdown.

    Groups raw UI inputs into income, deductions, and adjustments.
    The service layer derives the ATO income measures from these.
    """

    income: IncomeInputs
    deductions: DeductionInputs = DeductionInputs()
    adjustments: AdjustmentInputs = AdjustmentInputs()


# ── Response ──────────────────────────────────


class TaxBreakdownResponse(BaseModel):
    """
    Itemised tax breakdown with income measures and net income.

    Attributes:
        assessable_income: Total income before deductions
        total_deductions: Sum of allowable deductions
        taxable_income: Assessable minus deductions (floored at 0)
        repayment_income: HECS Repayment Income (HRI)
        mls_income: Medicare Levy Surcharge income
        net_investment_loss: Rental loss added back for HRI
        income_tax: Australian income tax
        medicare_levy: Medicare levy amount
        medicare_levy_surcharge: Medicare Levy Surcharge (0 if has private health)
        hecs_repayment: Annual HECS/HELP repayment
        total_tax: Sum of all tax components
        net_income: Taxable income minus total tax
        marginal_rate: Top marginal income tax rate as decimal
        effective_rate: Total tax as proportion of assessable income
    """

    assessable_income: float
    total_deductions: float
    taxable_income: float
    repayment_income: float
    mls_income: float
    net_investment_loss: float
    income_tax: float
    medicare_levy: float
    medicare_levy_surcharge: float
    hecs_repayment: float
    total_tax: float
    net_income: float
    marginal_rate: float
    effective_rate: float
