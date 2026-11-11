"""
Comparison domain models — scenario comparison results.
"""

from dataclasses import dataclass, field

from app.models.cashflow import CashFlowPPORResult, CashFlowRentvestResult


@dataclass
class PporVsRentvestResult:
    """
    PPOR vs rentvesting wealth comparison.

    Wraps both cashflow projection results with a summary showing
    which strategy produces higher net wealth and when they cross over.

    Attributes:
        ppor: Complete PPOR cashflow projection result.
        rentvest: Complete rentvesting cashflow projection result.
        winner: Scenario with higher net wealth at term end ("ppor" or "rentvesting").
        difference: Absolute net wealth gap at term end.
        break_even_year: First year one scenario overtakes the other (None if never).
        by_year: PPOR net wealth minus rentvest net wealth per year, for charting.
        ppor_net_wealth: PPOR net wealth at the end of each year.
        rentvest_net_wealth: Rentvesting net wealth at the end of each year, after the
            CGT payable if the investment property were sold that year.
    """

    ppor: CashFlowPPORResult
    rentvest: CashFlowRentvestResult
    winner: str
    difference: float
    break_even_year: int | None
    by_year: list[float]
    ppor_net_wealth: list[float] = field(default_factory=list)
    rentvest_net_wealth: list[float] = field(default_factory=list)
