"""
Capital Gains Tax calculation engine.

Calculates CGT liability when an investment property is sold.
PPOR properties are CGT-exempt. Supports the 50% individual discount
for assets held longer than 12 months, and uses a two-pass tax approach
for accurate marginal rate calculation on combined income.

All functions are pure — no side effects or external dependencies.
"""
from app.engine.deductions import is_asset_depreciable
from app.models.cgt import CGTResult
from app.models.property import Property


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
    total_cost_base = property.purchase_price + property.purchase_costs.total_cost_base

    # Add non-deductible asset costs to cost base
    for asset in property.depreciable_assets:
        if not is_asset_depreciable(asset.purchase_date, property.purchase_date):
            total_cost_base += asset.cost

    # Add building costs to cost base if they were constructed after the property purchase date
    for building in property.depreciable_buildings:
        if building.purchase_date > property.purchase_date:
            total_cost_base += building.construction_cost

    return total_cost_base
