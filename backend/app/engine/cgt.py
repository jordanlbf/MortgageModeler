"""
Capital Gains Tax calculation engine.

Calculates CGT liability when an investment property is sold.
PPOR properties are CGT-exempt. Supports the 50% individual discount
for assets held longer than 12 months, and uses a two-pass tax approach
for accurate marginal rate calculation on combined income.

All functions are pure — no side effects or external dependencies.
"""
from dataclasses import replace
from datetime import date

from app.engine.deductions import is_asset_depreciable
from app.engine.tax import calculate_total_tax
from app.models.cgt import CGTResult
from app.models.property import Property
from app.models.tax import TaxProfile


def calculate_cost_base(
    property: Property,
) -> float:
    """
    Calculate the CGT cost base of the property.

    Args:
        property: Core property details

    Returns:
        Total CGT cost base (purchase price + purchase costs + improvements + non-depreciable assets)
    """
    total_cost_base = property.purchase_price + property.purchase_costs.total

    # Add non-deductible asset costs to cost base
    for asset in property.depreciable_assets:
        if not is_asset_depreciable(asset.purchase_date, property.purchase_date):
            total_cost_base += asset.cost

    # Add building costs to cost base if they were constructed after the property purchase date
    for building in property.depreciable_buildings:
        if building.purchase_date > property.purchase_date:
            total_cost_base += building.construction_cost

    return total_cost_base


def calculate_cgt(
        property: Property,
        sale_price: float,
        sale_date: date,
        tax_profile: TaxProfile,
        is_ppor: bool
) -> CGTResult:
    """
    Calculate the CGT liability for a property sale.

    Args:
        property: Core property details including purchase and sale info
        sale_price: Sale price of the property
        sale_date: Date of the property sale
        tax_profile: Tax profile of the seller (income, deductions, etc.)
        is_ppor: Whether the property is a PPOR (CGT-exempt)

    Returns:
        CGTResult with cost base, capital gain, discounts, and tax payable
    """
    cost_base = calculate_cost_base(property)

    if is_ppor:
        return CGTResult(
            cost_base=cost_base,
            capital_gain=sale_price - cost_base,
            cgt_discount=0,
            discounted_gain=0,
            cgt_payable=0,
            net_proceeds=sale_price,
        )

    capital_gain = sale_price - cost_base

    # Apply 50% discount if held > 12 months
    cgt_discount = 0
    if capital_gain > 0 and (sale_date - property.purchase_date).days > 365:
        cgt_discount = capital_gain * 0.5

    # Calculate discounted gain (zero if capital loss)
    discounted_gain = max(capital_gain - cgt_discount, 0)

    # Calculate CGT payable using a two-pass approach to determine the marginal tax rate on the taxable gain
    tax_without_gain = calculate_total_tax(tax_profile)
    adjusted = replace(
        tax_profile,
        taxable_income=tax_profile.taxable_income + discounted_gain,
        repayment_income=tax_profile.repayment_income + discounted_gain,
        mls_income=tax_profile.mls_income + discounted_gain,
    )
    tax_with_gain = calculate_total_tax(adjusted)
    cgt_payable = tax_with_gain - tax_without_gain

    net_proceeds = sale_price - cgt_payable

    return CGTResult(
        cost_base=cost_base,
        capital_gain=capital_gain,
        cgt_discount=cgt_discount,
        discounted_gain=discounted_gain,
        cgt_payable=cgt_payable,
        net_proceeds=net_proceeds,
    )
