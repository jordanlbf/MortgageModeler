"""
Deductions domain models — tax deduction models.
"""

from dataclasses import dataclass
from datetime import date
from enum import Enum


class DepreciationMethod(Enum):
    """
    Supported depreciation methods for Division 40 assets.

    Attributes:
        DIMINISHING_VALUE: Higher deductions in early years, decreasing over time
        PRIME_COST: Equal deductions each year (straight-line)
    """

    DIMINISHING_VALUE = "diminishing_value"
    PRIME_COST = "prime_cost"


@dataclass
class DepreciableBuilding:
    """
    A single depreciable building/construction (Division 43).

    Attributes:
        name: Description of the building or construction
        construction_cost: Original cost of constructing the building
        purchase_date: Date the building was purchased by the current owner
        construction_start_date: Date construction commenced (must be on/after
            16 Sep 1987 to qualify for Div 43)
    """

    name: str
    construction_cost: float
    purchase_date: date
    construction_start_date: date


@dataclass
class DepreciableAsset:
    """
    A single depreciable plant/equipment asset (Division 40).

    Attributes:
        name: Description of the asset (e.g. "Aircon", "Carpet")
        cost: Original cost of the asset
        effective_life_years: ATO effective life in years
        purchase_date: Date the asset was purchased/installed
        method: Depreciation method (diminishing value or prime cost)
        written_down_value: Remaining book value after prior deductions
            (caller maintains this for diminishing value)
    """

    name: str
    cost: float
    effective_life_years: int
    purchase_date: date
    method: DepreciationMethod = DepreciationMethod.DIMINISHING_VALUE
    written_down_value: float = 0.0


@dataclass
class PropertyTaxDeductionSummary:
    """
    A single year's tax deduction summary.

    Attributes:
        mortgage_interest: Interest portion of mortgage repayments
        depreciation_building: Total Division 43 building depreciation
        depreciation_plant: Total Division 40 plant/equipment depreciation
        deductible_expenses: Total deductible ongoing property expenses
        total_deductions: Sum of all deduction components
        net_rental_income: Rental income minus total deductions
        is_negatively_geared: Whether net rental income is negative
        tax_saving: Tax benefit from deductions (positive = saving, negative = extra tax)
        borrowing_costs_deduction: Annual borrowing cost deduction (ATO 5-year amortisation)
    """

    mortgage_interest: float
    depreciation_building: float
    depreciation_plant: float
    deductible_expenses: float
    total_deductions: float
    net_rental_income: float
    is_negatively_geared: bool
    tax_saving: float
    borrowing_costs_deduction: float = 0.0
