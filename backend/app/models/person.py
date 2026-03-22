"""
Person domain model — taxpayer identity and financial profile.
"""

from dataclasses import dataclass

from app.models.tax import TaxProfile


@dataclass
class Person:
    """
    Represents the individual behind a mortgage scenario.

    Owns personal financial attributes that are independent of any
    specific property or loan.

    Attributes:
        tax_profile: Taxpayer income configuration for tax calculations.
    """
    tax_profile: TaxProfile
