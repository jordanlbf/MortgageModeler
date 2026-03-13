"""
Deductions domain models — tax deduction models.
"""

from dataclasses import dataclass


@dataclass
class PropertyTaxDeductionSummary:
    """A single year's tax deduction summary."""
    mortgage_interest: float
    depreciation_building: float
    depreciation_plant: float
    deductible_expenses: float
    total_deductions: float
    net_rental_income: float
    is_negatively_geared: bool
    tax_saving: float
