"""
Models package — re-exports all models for convenient imports.

Usage:
    from app.models import Person, Scenario, LoanConfig, Property
"""

from app.models.person import Person, IncomeSource, Debt
from app.models.loan import LoanConfig, RepaymentType, RepaymentFrequency, RateChange
from app.models.property import Property, PropertyType, PropertyCosts
from app.models.scenario import Scenario, Ownership

__all__ = [
    "Person", "IncomeSource", "Debt",
    "LoanConfig", "RepaymentType", "RepaymentFrequency", "RateChange",
    "Property", "PropertyType", "PropertyCosts",
    "Scenario", "Ownership",
]
