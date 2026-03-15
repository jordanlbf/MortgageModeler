"""
Capital Gains Tax domain models — CGT calculation results.
"""

from dataclasses import dataclass


@dataclass
class CGTResult:
    """
    Result of a capital gains tax calculation.

    Attributes:
        cost_base: Original cost of the asset (purchase price + costs + improvements + non-depreciable assets)
        capital_gain: Total capital gain (sale price - cost base)
        cgt_discount: Discount amount if eligible (full amount not a percentage)
        discounted_gain: Capital gain after applying any discounts (capital_gain - cgt_discount)
        cgt_payable: Tax payable on the taxable gain (taxable_gain * applicable tax rate)
        net_proceeds: Net amount received after paying CGT (sale price - cgt)
    """
    cost_base: float
    capital_gain: float
    cgt_discount: float
    discounted_gain: float
    cgt_payable: float
    net_proceeds: float
