"""
Comparison service.

Runs both PPOR and rentvesting projections, then computes a wealth
comparison showing which strategy wins, by how much, and when.
"""

from typing import Optional

from app.models.comparison import PporVsRentvestResult
from app.models.cashflow import CashFlowYear
from app.models.mortgage import Mortgage
from app.services.cashflow import build_ppor_cashflow, build_rentvest_cashflow


def _net_wealth_for_year(year: CashFlowYear) -> float:
    """Compute net wealth for a single cashflow year.

    Args:
        year: A single year's cashflow breakdown.

    Returns:
        Net wealth: equity + cumulative cash position + offset balance.
    """
    return year.equity + year.cumulative_position + year.offset_balance


def _find_break_even_year(by_year: list[float]) -> Optional[int]:
    """Find the first year where the wealth delta changes sign.

    Args:
        by_year: PPOR net wealth minus rentvest net wealth per year.

    Returns:
        Year index of first sign flip from initial direction, or None.
    """
    if not by_year:
        return None

    initial = by_year[0]
    for i in range(1, len(by_year)):
        if initial > 0 and by_year[i] <= 0:
            return i
        if initial < 0 and by_year[i] >= 0:
            return i
        if initial == 0 and by_year[i] != 0:
            return i

    return None


def build_ppor_vs_rentvest(
    mortgage_ppor: Mortgage,
    mortgage_rentvest: Mortgage,
) -> PporVsRentvestResult:
    """Build a PPOR vs rentvesting wealth comparison.

    Runs both cashflow projections, computes per-year net wealth for
    each scenario, and derives the winner, difference, and break-even year.

    CGT is subtracted from the rentvest final year's net wealth since
    it represents a real liability on sale.

    Args:
        mortgage_ppor: Mortgage configured for PPOR scenario (is_ppor=True).
        mortgage_rentvest: Mortgage configured for rentvesting scenario
            (is_ppor=False, with rentvest config).

    Returns:
        PporVsRentvestResult with both projections and comparison summary.
    """
    ppor_result = build_ppor_cashflow(mortgage_ppor)
    rentvest_result = build_rentvest_cashflow(mortgage_rentvest)

    ppor_wealth = [_net_wealth_for_year(y) for y in ppor_result.years]
    rentvest_wealth = [_net_wealth_for_year(y) for y in rentvest_result.years]

    # Subtract CGT from rentvest final year
    if rentvest_wealth:
        rentvest_wealth[-1] -= rentvest_result.cgt.cgt_payable

    by_year = [
        ppor_wealth[i] - rentvest_wealth[i]
        for i in range(len(ppor_wealth))
    ]

    winner = "ppor" if not by_year or by_year[-1] >= 0 else "rentvesting"
    difference = abs(by_year[-1]) if by_year else 0.0
    break_even_year = _find_break_even_year(by_year)

    return PporVsRentvestResult(
        ppor=ppor_result,
        rentvest=rentvest_result,
        winner=winner,
        difference=difference,
        break_even_year=break_even_year,
        by_year=by_year,
    )
