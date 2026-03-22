"""
Mortgage domain model — aggregate root composing all models needed for a projection.
"""

from dataclasses import dataclass
from typing import Optional

from app.models.loan import Loan
from app.models.person import Person
from app.models.property import Property, OngoingCostsConfig, RentvestConfig


@dataclass
class Mortgage:
    """
    Aggregate root linking all domain models for a single property scenario.

    Bundles property, loan, person, and ongoing cost configuration into one
    object that services accept as a single parameter. Eliminates the need
    to thread multiple models through service layers independently.

    Attributes:
        property: Property details (purchase price, costs, appreciation, rental, depreciation)
        loan: Loan aggregate (config + amortisation schedule)
        person: Person owning this mortgage (None for amortisation-only use)
        ongoing_costs: Base ongoing cost rates and growth rate (None for amortisation-only use)
        rentvest: Tenant rental configuration (None for PPOR)
        projection_years: Number of years to project
    """
    property: Property
    loan: Loan
    person: Optional[Person] = None
    ongoing_costs: Optional[OngoingCostsConfig] = None
    rentvest: Optional[RentvestConfig] = None
    projection_years: int = 30
