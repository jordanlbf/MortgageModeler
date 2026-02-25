"""
Property models — real estate assets and their costs.
"""

from pydantic import BaseModel, Field
from enum import Enum

from app.models.loan import LoanConfig


class PropertyType(str, Enum):
    PPOR = "ppor"
    INVESTMENT = "investment"


class PropertyCosts(BaseModel):
    """Annual holding costs for a property (year-1 values, inflated over time)."""
    council_rates: float = 0.0
    water_rates: float = 0.0
    insurance: float = 0.0
    maintenance: float = 0.0
    strata: float = 0.0
    management_fee_pct: float = Field(default=0.0, description="Property management fee as % of rent, e.g. 0.08")


class Property(BaseModel):
    """A single property (PPOR or investment)."""
    label: str = ""
    property_type: PropertyType
    purchase_price: float
    loan: LoanConfig

    # Growth
    annual_growth_rate: float = Field(default=0.05, description="Capital growth rate, e.g. 0.05 for 5%")

    # Rental (investment only, but also used for rentvesting PPOR-as-rental)
    weekly_rent: float = 0.0
    annual_rent_growth: float = Field(default=0.03, description="Rent increase rate, e.g. 0.03 for 3%")
    vacancy_weeks: int = 2

    # Costs
    costs: PropertyCosts = Field(default_factory=PropertyCosts)

    # Buyer details
    is_first_home: bool = False

    # Rent if not living in a PPOR (rentvesting scenario)
    weekly_rent_paid: float = Field(default=0.0, description="Rent paid as tenant if rentvesting")
