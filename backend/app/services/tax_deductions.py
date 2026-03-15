"""
Tax deductions service.

Aggregates property deduction calculations (Div 43, Div 40, mortgage interest,
ongoing expenses) and computes tax saving via two-pass tax engine.

This is a single-year calculation — multi-year orchestration lives elsewhere.
"""

from datetime import date, timedelta

from app.engine.deductions import (
    calculate_division_43_deduction,
    calculate_division_40_diminishing_value,
    calculate_division_40_prime_cost,
    is_building_depreciable,
    is_asset_depreciable,
)
from app.engine.tax import calculate_income_tax
from app.models.deductions import PropertyTaxDeductionSummary, DepreciableBuilding, DepreciableAsset, DepreciationMethod
from app.models.financial import FinancialYear
from app.models.property import YearCost, Property


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
    # Use day after end_date as exclusive upper bound (end_date is inclusive)
    fy_exclusive_end = financial_year.end_date + timedelta(days=1)

    # Days from purchase to end of FY (inclusive), capped at full FY
    days_held = (fy_exclusive_end - purchase_date).days
    days_held = min(days_held, financial_year.days)

    # Fully expired before this FY
    if expiry_date < financial_year.start_date:
        return 0

    # Expires mid-FY — cap days at expiry
    if expiry_date < fy_exclusive_end:
        days_held = min(days_held, (expiry_date - financial_year.start_date).days)

    return max(days_held, 0)


def build_tax_deduction_summary(
    property: Property,
    mortgage_interest: float,
    depreciable_buildings: list[DepreciableBuilding],
    depreciable_assets: list[DepreciableAsset],
    ongoing_costs: YearCost,
    rental_income: float,
    taxable_income: float,
    financial_year: FinancialYear,
) -> PropertyTaxDeductionSummary:
    """
    Build a single financial-year tax deduction summary for an investment property.

    Aggregates all deductible items (Div 43, Div 40, mortgage interest,
    ongoing costs), calculates net rental income, and computes tax saving
    via two-pass call to the tax engine.

    Args:
        property: Core property details (purchase date, new/second-hand status)
        mortgage_interest: Annual interest portion of repayments
        depreciable_buildings: Div 43 buildings/constructions to depreciate
        depreciable_assets: Div 40 plant/equipment to depreciate (second-hand assets
            excluded for properties purchased on/after 9 May 2017)
        ongoing_costs: Single year's ongoing property costs
        rental_income: Annual gross rental income
        taxable_income: Gross taxable income excluding rental income/deductions
        financial_year: Financial year to calculate for (e.g. 2025 = FY 2024-25, ending 30 June 2025)

    Returns:
        PropertyTaxDeductionSummary with deduction breakdown and tax saving
    """
    # Sum ongoing deductible expenses manually — ongoing_costs.total includes
    # property_value and rental_income which are not deductible expenses
    total_ongoing_expenses = (ongoing_costs.council_rates +
                              ongoing_costs.water_rates +
                              ongoing_costs.building_insurance +
                              ongoing_costs.landlord_insurance +
                              ongoing_costs.strata_fees +
                              ongoing_costs.maintenance_cost +
                              ongoing_costs.management_fee)

    # Calculate Div 43 depreciation for each building, accounting for expiry after 40 years
    total_building_depreciation = 0.0
    for building in depreciable_buildings:
        if not is_building_depreciable(building.construction_start_date):
            continue
        expiry = building.purchase_date.replace(year=building.purchase_date.year + 40)
        days_held = _calculate_days_held_in_fy(building.purchase_date, expiry, financial_year)
        if days_held <= 0:
            continue
        total_building_depreciation += calculate_division_43_deduction(building.construction_cost, days_held, financial_year.days)

    # Calculate Div 40 depreciation for each asset.
    # Second-hand assets are excluded for properties purchased on/after 9 May 2017.
    total_plant_depreciation = 0.0
    for asset in depreciable_assets:
        if not is_asset_depreciable(asset.purchase_date, property.purchase_date):
            continue
        expiry = asset.purchase_date.replace(year=asset.purchase_date.year + asset.effective_life_years)
        days_held = _calculate_days_held_in_fy(asset.purchase_date, expiry, financial_year)
        if days_held <= 0:
            continue
        if asset.method == DepreciationMethod.DIMINISHING_VALUE:
            total_plant_depreciation += calculate_division_40_diminishing_value(asset.written_down_value, asset.effective_life_years, days_held, financial_year.days)
        else:
            total_plant_depreciation += calculate_division_40_prime_cost(asset.cost, asset.effective_life_years, days_held, financial_year.days)

    total_deductions = mortgage_interest + total_ongoing_expenses + total_building_depreciation + total_plant_depreciation
    net_rental_income = rental_income - total_deductions
    is_negatively_geared = net_rental_income < 0

    # Tax saving: difference in tax with and without rental deductions
    # Positive = tax saved (negatively geared), negative = extra tax owed (positively geared)
    tax_saving = calculate_income_tax(taxable_income) - calculate_income_tax(taxable_income + net_rental_income)

    return PropertyTaxDeductionSummary(
        mortgage_interest=mortgage_interest,
        depreciation_building=total_building_depreciation,
        depreciation_plant=total_plant_depreciation,
        deductible_expenses=total_ongoing_expenses,
        total_deductions=total_deductions,
        net_rental_income=net_rental_income,
        is_negatively_geared=is_negatively_geared,
        tax_saving=tax_saving,
    )
