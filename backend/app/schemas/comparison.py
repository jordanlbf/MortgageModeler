"""
API request/response schemas for the comparison endpoint.

The request reuses the rentvesting schema (superset of PPOR).
The response wraps both cashflow results with comparison metrics.
"""

from pydantic import BaseModel, Field

from app.schemas.cashflow import (
    CashFlowPPORResponse,
    CashFlowRentvestRequest,
    CashFlowRentvestResponse,
)


class ComparisonRequest(CashFlowRentvestRequest):
    """
    Request parameters for a PPOR vs rentvesting comparison.

    Inherits all rentvesting fields. Both scenarios share the same
    person, property, loan, and ongoing costs — the router builds
    two Mortgage aggregates with different is_ppor/rentvest settings.
    """

    pass


class ComparisonResponse(BaseModel):
    """
    PPOR vs rentvesting comparison response.

    Attributes:
        ppor: Complete PPOR cashflow projection.
        rentvest: Complete rentvesting cashflow projection.
        winner: Scenario with higher net wealth at term end ("ppor" or "rentvesting").
        difference: Absolute net wealth gap at term end.
        break_even_year: First year one scenario overtakes the other (None if never).
        by_year: PPOR net wealth minus rentvest net wealth per year, for charting.
    """

    ppor: CashFlowPPORResponse
    rentvest: CashFlowRentvestResponse
    winner: str = Field(description='Winning scenario: "ppor" or "rentvesting"')
    difference: float = Field(ge=0, description="Absolute net wealth gap at term end")
    break_even_year: int | None = Field(
        default=None, description="First year one scenario overtakes the other (null if never)"
    )
    by_year: list[float] = Field(description="PPOR net wealth minus rentvest net wealth per year")
