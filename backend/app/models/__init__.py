"""
Models package — re-exports all models for convenient imports.

Usage:
    from app.models import Person, Scenario, LoanConfig, Property
"""

from app.models.person import Person, IncomeSource, Debt
from app.models.loan import LoanConfig, RepaymentType, RepaymentFrequency, RateChange

__all__ = [
    "Person", "IncomeSource", "Debt",
    "LoanConfig", "RepaymentType", "RepaymentFrequency", "RateChange",
]
