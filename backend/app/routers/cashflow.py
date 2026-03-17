"""
Cash flow projection API routes.

Exposes PPOR and rentvesting endpoints that delegate to their
respective services. The router constructs domain models from
request sub-models and maps service results to response schemas.
"""

from fastapi import APIRouter

from app.models.deductions import DepreciableBuilding, DepreciableAsset
from app.models.loan import RateChange, LoanConfig
from app.models.property import Property, PurchaseCosts, OngoingCostsConfig, RentvestConfig, RentalConfig
from app.models.tax import TaxProfile
from app.schemas.cashflow import (
    CashFlowPPORRequest,
    CashFlowPPORResponse,
    CashFlowRentvestRequest,
    CashFlowRentvestResponse,
    CashFlowYearResponse,
    CashFlowSummaryResponse,
    CGTResponse,
)
from app.services.cashflow import build_ppor_cashflow, build_rentvest_cashflow

router = APIRouter(prefix="/cashflow", tags=["cashflow"])


# ── Helpers: schema → domain model mapping ────

def _build_tax_profile(req: CashFlowPPORRequest) -> TaxProfile:
    """Map TaxProfileRequest to TaxProfile domain model."""
    return TaxProfile(
        taxable_income=req.tax_profile.taxable_income,
        repayment_income=req.tax_profile.repayment_income,
        mls_income=req.tax_profile.mls_income,
        hecs_balance=req.tax_profile.hecs_balance,
        has_private_health=req.tax_profile.has_private_health,
        income_growth_rate=req.tax_profile.income_growth_rate,
    )


def _build_property(req: CashFlowPPORRequest) -> Property:
    """Map PropertyRequest to Property domain model with all sub-models."""
    return Property(
        purchase_date=req.property.purchase_date,
        purchase_price=req.property.purchase_price,
        is_new_property=req.property.is_new_property,
        is_ppor=req.property.is_ppor,
        annual_appreciation=req.property.annual_appreciation,
        purchase_costs=PurchaseCosts(
            stamp_duty=req.property.purchase_costs.stamp_duty,
            legal_fees=req.property.purchase_costs.legal_fees,
            building_pest_inspection=req.property.purchase_costs.building_pest_inspection,
            registration_fee=req.property.purchase_costs.registration_fee,
            mortgage_registration_fee=req.property.purchase_costs.mortgage_registration_fee,
            loan_establishment_fee=req.property.purchase_costs.loan_establishment_fee,
            other_costs=req.property.purchase_costs.other_costs,
        ),
        rental=RentalConfig(
            weekly_rent=req.property.rental.weekly_rent,
            annual_growth_rate=req.property.rental.annual_growth_rate,
            vacancy_weeks=req.property.rental.vacancy_weeks,
        ),
        depreciable_buildings=[
            DepreciableBuilding(
                name=b.name,
                construction_cost=b.construction_cost,
                purchase_date=b.purchase_date,
                construction_start_date=b.construction_start_date,
            )
            for b in req.property.depreciable_buildings
        ],
        depreciable_assets=[
            DepreciableAsset(
                name=a.name,
                cost=a.cost,
                effective_life_years=a.effective_life_years,
                purchase_date=a.purchase_date,
                method=a.method,
                written_down_value=a.written_down_value,
            )
            for a in req.property.depreciable_assets
        ],
    )


def _build_loan(req: CashFlowPPORRequest) -> LoanConfig:
    """Map LoanRequest to LoanConfig domain model."""
    return LoanConfig(
        deposit=req.loan.deposit,
        annual_rate=req.loan.annual_rate,
        loan_term_years=req.loan.loan_term_years,
        frequency=req.loan.frequency,
        offset_balance=req.loan.offset_balance,
        offset_contribution=req.loan.offset_contribution,
        extra_repayment=req.loan.extra_repayment,
        rate_changes=[
            RateChange(from_period=rc.from_period, annual_rate=rc.annual_rate)
            for rc in req.loan.rate_changes
        ],
    )


def _build_ongoing_costs(req: CashFlowPPORRequest) -> OngoingCostsConfig:
    """Map OngoingCostsRequest to OngoingCostsConfig domain model."""
    return OngoingCostsConfig(
        council_rates=req.ongoing_costs.council_rates,
        water_rates=req.ongoing_costs.water_rates,
        building_insurance=req.ongoing_costs.building_insurance,
        strata_fees=req.ongoing_costs.strata_fees,
        maintenance_rate=req.ongoing_costs.maintenance_rate,
        landlord_insurance=req.ongoing_costs.landlord_insurance,
        management_rate=req.ongoing_costs.management_rate,
        annual_cost_growth_rate=req.ongoing_costs.annual_cost_growth_rate,
    )


# ── Helpers: domain model → response mapping ──

def _map_year_response(year) -> CashFlowYearResponse:
    """Map CashFlowYear domain model to response schema."""
    return CashFlowYearResponse(
        year=year.year,
        net_income=year.net_income,
        total_inflows=year.total_inflows,
        mortgage_repayment=year.mortgage_repayment,
        mortgage_interest=year.mortgage_interest,
        mortgage_principal=year.mortgage_principal,
        property_costs=year.property_costs,
        rent_paid=year.rent_paid,
        rental_income=year.rental_income,
        tax_saving=year.tax_saving,
        total_outflows=year.total_outflows,
        net_position=year.net_position,
        cumulative_position=year.cumulative_position,
        property_value=year.property_value,
        loan_balance=year.loan_balance,
        equity=year.equity,
        offset_balance=year.offset_balance,
    )


def _map_summary_response(summary) -> CashFlowSummaryResponse:
    """Map CashFlowSummary domain model to response schema."""
    return CashFlowSummaryResponse(
        total_income=summary.total_income,
        total_outflows=summary.total_outflows,
        total_interest_paid=summary.total_interest_paid,
        total_rent_paid=summary.total_rent_paid,
        total_rental_income=summary.total_rental_income,
        total_tax_saving=summary.total_tax_saving,
        final_property_value=summary.final_property_value,
        final_loan_balance=summary.final_loan_balance,
        final_equity=summary.final_equity,
        average_annual_net=summary.average_annual_net,
        net_wealth=summary.net_wealth,
    )


# ── Endpoints ─────────────────────────────────

@router.post("/ppor", response_model=CashFlowPPORResponse)
def get_ppor_cashflow(req: CashFlowPPORRequest) -> CashFlowPPORResponse:
    """
    Generate a year-by-year cash flow projection for the PPOR scenario.

    Args:
        req: PPOR request with tax profile, property, loan, and ongoing costs

    Returns:
        PPOR cash flow projection with year breakdown and summary
    """
    result = build_ppor_cashflow(
        property=_build_property(req),
        tax_profile=_build_tax_profile(req),
        loan=_build_loan(req),
        ongoing_costs=_build_ongoing_costs(req),
        projection_years=req.projection_years,
    )

    return CashFlowPPORResponse(
        projection_years=result.projection_years,
        upfront_costs=result.upfront_costs,
        years=[_map_year_response(y) for y in result.years],
        summary=_map_summary_response(result.summary),
    )


@router.post("/rentvest", response_model=CashFlowRentvestResponse)
def get_rentvest_cashflow(req: CashFlowRentvestRequest) -> CashFlowRentvestResponse:
    """
    Generate a year-by-year cash flow projection for the rentvesting scenario.

    Args:
        req: Rentvesting request with tax profile, property, loan, ongoing costs,
            rental details, and depreciation items

    Returns:
        Rentvesting cash flow projection with year breakdown, CGT, and summary
    """
    result = build_rentvest_cashflow(
        property=_build_property(req),
        tax_profile=_build_tax_profile(req),
        loan=_build_loan(req),
        ongoing_costs=_build_ongoing_costs(req),
        rentvest=RentvestConfig(
            weekly_rent_paid=req.weekly_rent_paid,
            annual_rent_paid_growth=req.annual_rent_paid_growth,
        ),
        projection_years=req.projection_years,
    )

    return CashFlowRentvestResponse(
        projection_years=result.projection_years,
        upfront_costs=result.upfront_costs,
        years=[_map_year_response(y) for y in result.years],
        cgt=CGTResponse(
            cost_base=result.cgt.cost_base,
            capital_gain=result.cgt.capital_gain,
            cgt_discount=result.cgt.cgt_discount,
            discounted_gain=result.cgt.discounted_gain,
            cgt_payable=result.cgt.cgt_payable,
            net_proceeds=result.cgt.net_proceeds,
        ),
        summary=_map_summary_response(result.summary),
    )
