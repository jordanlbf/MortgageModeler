"""
Capital Gains Tax calculation engine.

Calculates CGT liability when an investment property is sold.
PPOR properties are CGT-exempt. Supports the 50% individual discount
for assets held longer than 12 months, and uses a two-pass tax approach
for accurate marginal rate calculation on combined income.

All functions are pure — no side effects or external dependencies.
"""

from app.models.cgt import CGTResult


def calculate_cost_base(
    purchase_price: float,
    purchase_costs: float,
    improvements: float,
    non_depreciable_assets: float
) -> float:


