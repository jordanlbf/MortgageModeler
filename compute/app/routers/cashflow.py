"""
Cash flow projection API routes.

Exposes PPOR and rentvesting endpoints that delegate to their
respective services. The router constructs domain models from
request sub-models and maps service results to response schemas.
"""

from fastapi import APIRouter

from app.models.loan import BorrowingCosts, RateChange
from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import RentvestConfig
from app.routers._cashflow_mapping import (
    build_existing_property,
    build_loan_config,
    build_new_property,
    build_ongoing_costs,
    build_property,
    build_tax_profile,
    map_ppor_response,
    map_rentvest_response,
    map_single_response,
)
from app.schemas.cashflow import (
    CashFlowPPORRequest,
    CashFlowPPORResponse,
    CashFlowRentvestRequest,
    CashFlowRentvestResponse,
)
from app.schemas.cashflow_single import CashFlowSingleRequest, CashFlowSingleResponse
from app.services.amortisation import build_existing_loan, build_loan
from app.services.cashflow import build_ppor_cashflow, build_rentvest_cashflow
from app.services.cashflow_single import build_single_cashflow

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


@router.post("/single", response_model=CashFlowSingleResponse)
def get_single_cashflow(req: CashFlowSingleRequest) -> CashFlowSingleResponse:
    """
    Generate a year-by-year cash flow projection for a single property.

    Supports four mode × property_use combinations:
    - new × ppor: standard purchase, owner-occupied
    - new × investment: standard purchase, investment property
    - existing × ppor: mid-loan, owner-occupied
    - existing × investment: mid-loan, investment property

    Args:
        req: Single property request with mode, property_use, tax profile,
            property/loan details, and ongoing costs

    Returns:
        Single property cash flow projection with year breakdown,
        optional upfront costs, optional CGT, and summary
    """
    tax_profile = build_tax_profile(req)

    if req.mode == "new":
        property = build_new_property(req)
        loan = build_loan(property, build_loan_config(req))
        mortgage = Mortgage(
            property=property,
            loan=loan,
            person=Person(tax_profile=tax_profile),
            ongoing_costs=build_ongoing_costs(req),
            projection_years=req.projection_years,
        )
    else:
        property = build_existing_property(req)
        ep = req.existing_property
        el = req.existing_loan
        bc = BorrowingCosts(
            lmi=ep.original_borrowing_costs_total,
            years_elapsed=ep.borrowing_costs_years_elapsed,
        )
        loan = build_existing_loan(
            current_balance=el.current_balance,
            remaining_term_years=el.remaining_term_years,
            annual_rate=el.annual_rate,
            frequency=el.frequency,
            offset_balance=el.offset_balance,
            offset_contribution=el.offset_contribution,
            extra_repayment=el.extra_repayment,
            rate_changes=[
                RateChange(from_period=rc.from_period, annual_rate=rc.annual_rate)
                for rc in el.rate_changes
            ] or None,
            borrowing_costs=bc,
        )
        mortgage = Mortgage(
            property=property,
            loan=loan,
            person=Person(tax_profile=tax_profile),
            ongoing_costs=build_ongoing_costs(req),
            projection_years=req.projection_years,
        )

    result = build_single_cashflow(mortgage, req.mode, req.property_use)
    return map_single_response(result)
