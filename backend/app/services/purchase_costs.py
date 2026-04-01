"""
Purchase costs service.

Orchestrates stamp duty calculation, grant concession application,
LMI estimation, and fee summation into a complete cost breakdown.
"""

from app.models.purchase_costs import PurchaseCostsBreakdown, PurchaseCostsInputs


def calculate_purchase_costs(inputs: PurchaseCostsInputs) -> PurchaseCostsBreakdown:
    """Calculate itemised property purchase costs.

    Stub — full implementation in step 5.

    Args:
        inputs: Property details, buyer profile, and selected grants.

    Returns:
        Itemised breakdown with base costs, concessions, and totals.
    """
    return PurchaseCostsBreakdown()
