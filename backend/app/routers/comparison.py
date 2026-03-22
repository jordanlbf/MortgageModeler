"""
Comparison API routes.

Exposes the PPOR vs rentvesting comparison endpoint. Builds two
Mortgage aggregates from a single request and delegates to the
comparison service.
"""

from dataclasses import replace

from fastapi import APIRouter

from app.models.mortgage import Mortgage
from app.models.person import Person
from app.models.property import RentvestConfig
from app.routers._cashflow_mapping import (
    build_tax_profile,
    build_property,
    build_loan_config,
    build_ongoing_costs,
    map_ppor_response,
    map_rentvest_response,
)
from app.schemas.comparison import ComparisonRequest, ComparisonResponse
from app.services.amortisation import build_loan
from app.services.comparison import build_ppor_vs_rentvest

router = APIRouter(prefix="/comparison", tags=["comparison"])


@router.post("", response_model=ComparisonResponse)
def get_comparison(req: ComparisonRequest) -> ComparisonResponse:
    """
    Compare PPOR and rentvesting strategies for the same person and property.

    Builds two Mortgage aggregates from the request — one as PPOR, one as
    investment with rentvesting — runs both projections, and returns the
    full cashflow results plus a comparison summary.

    Args:
        req: Comparison request with shared person, property, loan, ongoing
            costs, and rentvesting details.

    Returns:
        Both scenario results with winner, difference, break-even year,
        and year-by-year wealth delta.
    """
    # Build shared components
    person = Person(tax_profile=build_tax_profile(req))
    loan_config = build_loan_config(req)
    ongoing_costs = build_ongoing_costs(req)

    # PPOR mortgage: is_ppor=True, no rentvest
    ppor_property = replace(build_property(req), is_ppor=True)
    mortgage_ppor = Mortgage(
        property=ppor_property,
        loan=build_loan(ppor_property, loan_config),
        person=person,
        ongoing_costs=ongoing_costs,
        projection_years=req.projection_years,
    )

    # Rentvest mortgage: is_ppor=False, with rentvest config
    rentvest_property = replace(build_property(req), is_ppor=False)
    mortgage_rentvest = Mortgage(
        property=rentvest_property,
        loan=build_loan(rentvest_property, loan_config),
        person=person,
        ongoing_costs=ongoing_costs,
        rentvest=RentvestConfig(
            weekly_rent_paid=req.weekly_rent_paid,
            annual_rent_paid_growth=req.annual_rent_paid_growth,
        ),
        projection_years=req.projection_years,
    )

    result = build_ppor_vs_rentvest(mortgage_ppor, mortgage_rentvest)

    return ComparisonResponse(
        ppor=map_ppor_response(result.ppor),
        rentvest=map_rentvest_response(result.rentvest),
        winner=result.winner,
        difference=result.difference,
        break_even_year=result.break_even_year,
        by_year=result.by_year,
    )
