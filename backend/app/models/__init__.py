"""
Models package — re-exports all models for convenient imports.

Usage:
    from app.models import Person, RepaymentFrequency, RateChange
"""

from app.models.loan import RepaymentFrequency, RateChange

__all__ = ["RepaymentFrequency", "RateChange",]
