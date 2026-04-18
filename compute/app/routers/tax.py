"""
Tax API routes.

Exposes the tax breakdown endpoint for calculating Australian income tax,
Medicare levy, Medicare Levy Surcharge, and HECS repayments.
"""

from fastapi import APIRouter

from app.models.tax import TaxInputs
from app.schemas.tax import TaxBreakdownRequest, TaxBreakdownResponse
from app.services.tax_breakdown import build_tax_breakdown, compute_income_measures

router = APIRouter(prefix="/tax", tags=["tax"])


@router.post("/breakdown", response_model=TaxBreakdownResponse)
def get_tax_breakdown(req: TaxBreakdownRequest) -> TaxBreakdownResponse:
    """Generate a full tax breakdown from raw income, deduction, and adjustment inputs.

    Args:
        req: Grouped UI inputs (income, deductions, adjustments).

    Returns:
        Itemised tax breakdown with income measures and net income.
    """
    inputs = TaxInputs(
        salary=req.income.salary,
        rental=req.income.rental,
        interest=req.income.interest,
        dividend=req.income.dividend,
        franking=req.income.franking,
        capital_gain_short=req.income.capital_gain_short,
        capital_gain_long=req.income.capital_gain_long,
        rental_deductions=req.deductions.rental_deductions,
        work_deductions=req.deductions.work_deductions,
        sal_sac=req.adjustments.sal_sac,
        rfb=req.adjustments.rfb,
        hecs_bal=req.adjustments.hecs_bal,
        phi=req.adjustments.phi,
        sapto=req.adjustments.sapto,
    )

    profile = compute_income_measures(inputs)
    breakdown = build_tax_breakdown(profile)

    return TaxBreakdownResponse(
        assessable_income=profile.assessable_income,
        total_deductions=profile.total_deductions,
        taxable_income=breakdown.taxable_income,
        repayment_income=profile.repayment_income,
        mls_income=profile.mls_income,
        net_investment_loss=profile.net_investment_loss,
        income_tax=breakdown.income_tax,
        medicare_levy=breakdown.medicare_levy,
        medicare_levy_surcharge=breakdown.medicare_levy_surcharge,
        hecs_repayment=breakdown.hecs_repayment,
        lito=breakdown.lito,
        sapto_offset=breakdown.sapto_offset,
        franking_offset=breakdown.franking_offset,
        total_offsets=breakdown.total_offsets,
        total_tax=breakdown.total_tax,
        net_income=breakdown.net_income,
        marginal_rate=breakdown.marginal_rate,
        effective_rate=breakdown.effective_rate,
    )
