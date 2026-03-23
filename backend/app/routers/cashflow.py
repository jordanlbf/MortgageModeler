"""
Cash flow projection API routes.

Exposes PPOR and rentvesting endpoints that delegate to their
respective services. The router constructs domain models from
request sub-models and maps service results to response schemas.
"""

from fastapi import APIRouter

from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import RentvestConfig
from app.routers._cashflow_mapping import (
    build_loan_config,
    build_ongoing_costs,
    build_property,
    build_tax_profile,
    map_ppor_response,
    map_rentvest_response,
)
from app.schemas.cashflow import (
    CashFlowPPORRequest,
    CashFlowPPORResponse,
    CashFlowRentvestRequest,
    CashFlowRentvestResponse,
)
from app.services.amortisation import build_loan
from app.services.cashflow import build_ppor_cashflow, build_rentvest_cashflow

router = APIRouter(prefix="/cashflow", tags=["cashflow"])


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
    property = build_property(req)
    mortgage = Mortgage(
        property=property,
        loan=build_loan(property, build_loan_config(req)),
        person=Person(tax_profile=build_tax_profile(req)),
        ongoing_costs=build_ongoing_costs(req),
        projection_years=req.projection_years,
    )
    return map_ppor_response(build_ppor_cashflow(mortgage))


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
    property = build_property(req)
    mortgage = Mortgage(
        property=property,
        loan=build_loan(property, build_loan_config(req)),
        person=Person(tax_profile=build_tax_profile(req)),
        ongoing_costs=build_ongoing_costs(req),
        rentvest=RentvestConfig(
            weekly_rent_paid=req.weekly_rent_paid,
            annual_rent_paid_growth=req.annual_rent_paid_growth,
        ),
        projection_years=req.projection_years,
    )
    return map_rentvest_response(build_rentvest_cashflow(mortgage))
