"""
Mortgage domain model — aggregate root composing all models needed for a projection.
"""

from dataclasses import dataclass
from typing import Optional

from app.models.loan import LoanConfig
from app.models.property import Property, OngoingCostsConfig, RentvestConfig
from app.models.tax import TaxProfile


@dataclass
class Mortgage:
    """
    Aggregate root linking all domain models for a single property scenario.

    Bundles property, loan, tax, and ongoing cost configuration into one
    object that services accept as a single parameter. Eliminates the need
    to thread multiple models through service layers independently.

    Attributes:
        property: Property details (purchase price, costs, appreciation, rental, depreciation)
        loan: Mortgage loan configuration (deposit, rate, term, offset, borrowing costs)
        tax_profile: Taxpayer income configuration (with income growth rate)
        ongoing_costs: Base ongoing cost rates and growth rate
        rentvest: Tenant rental configuration (None for PPOR)
        projection_years: Number of years to project
    """
    property: Property
    loan: LoanConfig
    tax_profile: TaxProfile
    ongoing_costs: OngoingCostsConfig
    rentvest: Optional[RentvestConfig] = None
    projection_years: int = 30
