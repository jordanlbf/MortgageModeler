"""
Tax domain models — raw tax inputs, derived measures, and engine output.
"""

from dataclasses import dataclass


@dataclass
class TaxInputs:
    """
    Raw tax inputs matching the UI form fields.

    Grouped by section: income, deductions, and adjustments.
    The service layer derives ATO income measures from these.

    Attributes:
        salary: Gross salary and wages
        rental: Gross rental income
        interest: Bank/savings interest income
        dividend: Dividend income excluding franking credits
        franking: Franking (imputation) credits
        capital_gain_short: Capital gains on assets held < 12 months
        capital_gain_long: Capital gains on assets held > 12 months
        rental_deductions: Rental property deductions
        work_deductions: Work-related deductions
        sal_sac: Reportable superannuation (salary sacrifice)
        rfb: Reportable fringe benefits (grossed-up)
        hecs_bal: Outstanding HELP/HECS debt balance
        phi: Whether the taxpayer holds private health insurance
        sapto: Whether the taxpayer is eligible for Seniors and Pensioners Tax Offset
    """

    # Income
    salary: float
    rental: float = 0.0
    interest: float = 0.0
    dividend: float = 0.0
    franking: float = 0.0
    capital_gain_short: float = 0.0
    capital_gain_long: float = 0.0

    # Deductions
    rental_deductions: float = 0.0
    work_deductions: float = 0.0

    # Adjustments
    sal_sac: float = 0.0
    rfb: float = 0.0
    hecs_bal: float = 0.0
    phi: bool = False
    sapto: bool = False


@dataclass
class TaxProfile:
    """
    Derived taxpayer state for tax calculations.

    Encapsulates all income measures, intermediate values, and thresholds
    required by the tax engine. Income measures can diverge due to
    negative gearing and reportable fringe benefits.

    Attributes:
        assessable_income: Total income before deductions
        total_deductions: Sum of allowable deductions
        taxable_income: Assessable income minus allowable deductions
        repayment_income: Income used for HECS repayment calculation
        mls_income: Income used for Medicare Levy Surcharge calculation
        net_investment_loss: Rental loss added back for HRI
        hecs_balance: Outstanding HECS/HELP debt
        has_private_health: Whether the taxpayer holds private health insurance
        franking: Franking credits to apply as refundable tax offset
        sapto: Whether the taxpayer is eligible for SAPTO
        income_growth_rate: Annual salary/wage growth rate as decimal
    """

    taxable_income: float
    repayment_income: float
    mls_income: float
    hecs_balance: float
    has_private_health: bool
    assessable_income: float = 0.0
    total_deductions: float = 0.0
    net_investment_loss: float = 0.0
    franking: float = 0.0
    sapto: bool = False
    income_growth_rate: float = 0.03


@dataclass
class TaxBreakdown:
    """Itemised tax breakdown output from the engine.

    Attributes:
        taxable_income: Assessable minus deductions (floored at 0)
        income_tax: Income tax after offsets applied
        medicare_levy: Medicare levy amount
        medicare_levy_surcharge: MLS amount (0 if has private health)
        hecs_repayment: Annual HECS/HELP repayment
        lito: Low Income Tax Offset amount
        sapto_offset: Seniors and Pensioners Tax Offset amount
        franking_offset: Franking credit offset (refundable)
        total_offsets: Sum of all tax offsets
        total_tax: Sum of all tax components (after offsets)
        net_income: Taxable income minus total tax
        marginal_rate: Top marginal income tax rate as decimal
        effective_rate: Total tax as proportion of assessable income
    """

    taxable_income: float
    income_tax: float
    medicare_levy: float
    medicare_levy_surcharge: float
    hecs_repayment: float
    lito: float
    sapto_offset: float
    franking_offset: float
    total_offsets: float
    total_tax: float
    net_income: float
    marginal_rate: float
    effective_rate: float
