"""
Cash flow projection API routes.

Exposes PPOR and rentvesting endpoints that delegate to their
respective services. The router constructs domain models from
request sub-models and maps service results to response schemas.
"""

from fastapi import APIRouter
from app.schemas.cashflow import CashFlowPPORResponse, CashFlowPPORRequest
from app.models.cgt import CGTResult
from app.models.cashflow import CashFlowYear, CashFlowSummary

router = APIRouter(prefix="/cashflow", tags=["cashflow"])


@router.post("/schedule", response_model=CashFlowPPORResponse)
def get_ppor_cashflow_schedule(req: CashFlowPPORRequest) -> CashFlowPPORResponse:
    """
    Generate a cash flow projection for the PPOR scenario.

    Args:
        req: Cash flow request parameters including property details,
            loan configuration, ongoing costs, and rental assumptions.

    Returns:
        Year-by-year cash flow projection for the PPOR scenario,
        including property value, costs, and net cash flow.
    """


