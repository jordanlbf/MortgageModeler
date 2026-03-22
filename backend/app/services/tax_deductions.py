"""
Tax deductions service.

Aggregates property deduction calculations (Div 43, Div 40, mortgage interest,
ongoing expenses, borrowing costs) and computes tax saving via two-pass tax engine.

This is a single-year calculation — multi-year orchestration lives elsewhere.
"""

from datetime import date, timedelta

from app.engine.deductions import (
    calculate_division_43_deduction,
    calculate_division_40_diminishing_value,
    calculate_division_40_prime_cost,
    is_building_depreciable,
    is_asset_depreciable, calculate_borrowing_cost_deduction,
)
from app.engine.tax import calculate_tax_saving
from app.models.deductions import PropertyTaxDeductionSummary, DepreciableBuilding, DepreciableAsset, DepreciationMethod
from app.models.financial import FinancialYear
from app.models.mortgage import Mortgage
from app.models.property import YearCost


def _calculate_days_held_in_fy(
    purchase_date: date,
    expiry_date: date,
    financial_year: FinancialYear,
) -> int:
    """
    Calculate the number of claimable days within a financial year,
    accounting for purchase date and depreciation expiry.

    Args:
        purchase_date: Date the asset/building was purchased
        expiry_date: Date the depreciation claim expires
        financial_year: Financial year to calculate for

    Returns:
        Number of claimable days (0 if not yet purchased or fully expired)
    """
    fy_exclusive_end = financial_year.end_date + timedelta(days=1)

    days_held = (fy_exclusive_end - purchase_date).days
    days_held = min(days_held, financial_year.days)

    if expiry_date < financial_year.start_date:
        return 0

    if expiry_date < fy_exclusive_end:
        days_held = min(days_held, (expiry_date - financial_year.start_date).days)

    return max(days_held, 0)


def _calculate_ongoing_expenses(ongoing_costs: YearCost) -> float:
    """
    Sum deductible ongoing property expenses from a YearCost breakdown.

    Excludes property_value and rental_income which are not expenses.

    Args:
        ongoing_costs: Single year's ongoing property costs

    Returns:
        Total deductible ongoing expenses for the year
    """
    return (
        ongoing_costs.council_rates +
        ongoing_costs.water_rates +
        ongoing_costs.building_insurance +
        ongoing_costs.landlord_insurance +
        ongoing_costs.strata_fees +
        ongoing_costs.maintenance_cost +
        ongoing_costs.management_fee
    )


def _calculate_building_depreciation(
    buildings: list[DepreciableBuilding],
    financial_year: FinancialYear,
) -> float:
    """
    Calculate total Division 43 building depreciation for the financial year.

    Checks each building for eligibility (post-1987 construction) and
    expiry (40 years from purchase), then calculates pro-rata deduction.

    Args:
        buildings: List of depreciable buildings on the property
        financial_year: Financial year to calculate for

    Returns:
        Total Div 43 depreciation for the year
    """
    total = 0.0
    for building in buildings:
        if not is_building_depreciable(building.construction_start_date):
            continue
        expiry = building.purchase_date.replace(year=building.purchase_date.year + 40)
        days_held = _calculate_days_held_in_fy(building.purchase_date, expiry, financial_year)
        if days_held <= 0:
            continue
        total += calculate_division_43_deduction(building.construction_cost, days_held, financial_year.days)
    return total


def _calculate_plant_depreciation(
    assets: list[DepreciableAsset],
    property_purchase_date: date,
    financial_year: FinancialYear,
) -> float:
    """
    Calculate total Division 40 plant/equipment depreciation for the financial year.

    Second-hand assets are excluded for properties purchased on/after 9 May 2017.
    Supports both diminishing value and prime cost methods.

    Args:
        assets: List of depreciable assets on the property
        property_purchase_date: Date the property was purchased (for second-hand check)
        financial_year: Financial year to calculate for

    Returns:
        Total Div 40 depreciation for the year
    """
    total = 0.0
    for asset in assets:
        if not is_asset_depreciable(asset.purchase_date, property_purchase_date):
            continue
        expiry = asset.purchase_date.replace(year=asset.purchase_date.year + asset.effective_life_years)
        days_held = _calculate_days_held_in_fy(asset.purchase_date, expiry, financial_year)
        if days_held <= 0:
            continue
        if asset.method == DepreciationMethod.DIMINISHING_VALUE:
            total += calculate_division_40_diminishing_value(asset.written_down_value, asset.effective_life_years, days_held, financial_year.days)
        else:
            total += calculate_division_40_prime_cost(asset.cost, asset.effective_life_years, days_held, financial_year.days)
    return total


def build_tax_deduction_summary(
    mortgage: Mortgage,
    year: int,
    ongoing_costs: YearCost,
    financial_year: FinancialYear,
) -> PropertyTaxDeductionSummary:
    """
    Build a single financial-year tax deduction summary for an investment property.

    Aggregates all deductible items (Div 43, Div 40, mortgage interest,
    ongoing costs), calculates net rental income, and computes tax saving
    via two-pass call to the tax engine.

    Args:
        mortgage: Mortgage aggregate with property, loan, and tax profile details.
        year: Projection year (0-indexed), used to derive mortgage interest from
            the loan schedule.
        ongoing_costs: Single year's ongoing property costs (includes rental_income).
        financial_year: Financial year to calculate for (e.g. 2025 = FY 2024-25,
            ending 30 June 2025).

    Returns:
        PropertyTaxDeductionSummary with deduction breakdown and tax saving.
    """
    mortgage_interest = mortgage.loan.interest_for_year(year)
    rental_income = ongoing_costs.rental_income
    # Calculate each deduction component
    depreciation_building = _calculate_building_depreciation(mortgage.property.depreciable_buildings, financial_year)
    depreciation_plant = _calculate_plant_depreciation(mortgage.property.depreciable_assets, mortgage.property.purchase_date, financial_year)
    deductible_expenses = _calculate_ongoing_expenses(ongoing_costs)

    # Calculate borrowing costs deduction based on ATO rules
    borrowing_costs_deduction = calculate_borrowing_cost_deduction(
        mortgage.loan.config.borrowing_costs.total,
        mortgage.loan.config.loan_term_years,
        year,
    )

    # Sum all deductions to get total deduction for the year
    total_deductions = (mortgage_interest +
                        deductible_expenses +
                        depreciation_building +
                        depreciation_plant +
                        borrowing_costs_deduction
                        )

    # Calculate net rental income after deductions and determine if negatively geared
    net_rental_income = rental_income - total_deductions
    is_negatively_geared = net_rental_income < 0
    tax_saving = calculate_tax_saving(mortgage.person.tax_profile, net_rental_income)

    return PropertyTaxDeductionSummary(
        mortgage_interest=mortgage_interest,
        depreciation_building=depreciation_building,
        depreciation_plant=depreciation_plant,
        deductible_expenses=deductible_expenses,
        total_deductions=total_deductions,
        net_rental_income=net_rental_income,
        is_negatively_geared=is_negatively_geared,
        tax_saving=tax_saving,
        borrowing_costs_deduction=borrowing_costs_deduction
    )
