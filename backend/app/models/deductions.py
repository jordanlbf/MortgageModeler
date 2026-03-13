"""
Deductions domain models — tax deduction models.
"""

from dataclasses import dataclass
from datetime import date


@dataclass
class DepreciableBuilding:
    """A single depreciable building/construction (Division 43)."""
    name: str
    construction_cost: float
    purchase_date: date


@dataclass
class DepreciableAsset:
    """A single depreciable plant/equipment asset (Division 40)."""
    name: str
    cost: float
    effective_life_years: int
    purchase_date: date


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