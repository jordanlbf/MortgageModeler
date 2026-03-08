"""
API request/response schemas for the tax-engine endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field

# REQUESTS


class TaxBreakdownRequest(BaseModel):
    gross_income: float = Field(default=0.0, ge=0, description="Individual's gross income")
    hecs_balance: float = Field(default=0.0, ge=0, description="Individual's HECS Balance")
    has_private_health: bool = Field(default=False, description="Individual's Private Health Status")


# RESPONSES

class TaxBreakdownResponse(BaseModel):
    gross_income: float
    income_tax: float
    medicare_levy: float
    medicare_levy_surcharge: float
    hecs_repayment: float
    net_income: float
    total_tax: float
