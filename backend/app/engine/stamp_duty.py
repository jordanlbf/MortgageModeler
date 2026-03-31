"""
Multi-state stamp duty calculation engine.

Handles bracket-based duty (QLD, NSW, VIC, WA, SA, TAS, ACT) and
formula-based duty (NT). All functions are pure — no side effects.
"""

import math

from app.config.stamp_duty._types import StampDutyBracket
from app.config.stamp_duty.nt import (
    NT_FLAT_RATES,
    NT_FORMULA_A,
    NT_FORMULA_B,
    NT_FORMULA_THRESHOLD,
)
from app.config.stamp_duty.registry import get_schedule
from app.config.stamp_duty.vic import VIC_PPOR_CAP


def _calculate_bracket_duty(
    price: float,
    brackets: list[StampDutyBracket],
    round_to_100: bool,
) -> float:
    """Calculate duty by walking a bracket table.

    Handles three bracket types:
    - Standard marginal: base + rate * excess above previous threshold
    - Flat rate: rate * entire price (e.g. VIC $960k-$2M, ACT premium)
    - Round-to-100: excess rounded up to next $100 before applying rate

    Args:
        price: Dutiable property value.
        brackets: Ordered list of StampDutyBracket.
        round_to_100: Whether to round excess up to next $100.

    Returns:
        Stamp duty amount.

    Raises:
        ValueError: If no bracket covers the price.
    """
    prev_threshold = 0.0

    for bracket in brackets:
        if price <= bracket.threshold:
            if bracket.flat_rate:
                return bracket.rate * price

            excess = price - prev_threshold
            if round_to_100 and excess > 0:
                excess = math.ceil(excess / 100) * 100

            return bracket.base_amount + bracket.rate * excess

        prev_threshold = bracket.threshold

    raise ValueError(
        f"Stamp duty brackets missing catch-all (price={price}, "
        f"last threshold={brackets[-1].threshold})"
    )


def _calculate_nt_duty(price: float) -> float:
    """Calculate NT stamp duty using quadratic formula or flat rates.

    Args:
        price: Dutiable property value.

    Returns:
        Stamp duty amount.
    """
    if price <= 0:
        return 0.0

    if price <= NT_FORMULA_THRESHOLD:
        v = price / 1_000
        return (NT_FORMULA_A * v * v) + (NT_FORMULA_B * v)

    for threshold, rate in NT_FLAT_RATES:
        if price <= threshold:
            return rate * price

    # Should not reach here — last tier has float("inf")
    return NT_FLAT_RATES[-1][1] * price


def calculate_stamp_duty(price: float, state: str, is_ppor: bool = False) -> float:
    """Calculate stamp duty for a property in any Australian state.

    Args:
        price: Dutiable property value.
        state: State code (e.g. ``"QLD"``, ``"NT"``).
        is_ppor: Whether the property is a principal place of residence.
            Used to select PPOR concession brackets where available.

    Returns:
        Stamp duty amount.

    Raises:
        ValueError: If the state is not recognised.
    """
    if price <= 0:
        return 0.0

    # NT uses a formula, not brackets
    if state == "NT":
        return _calculate_nt_duty(price)

    schedule = get_schedule(state)
    if schedule is None:
        raise ValueError(f"Unknown state: {state}")

    # VIC PPOR concession only applies up to $550k
    if state == "VIC" and is_ppor and price > VIC_PPOR_CAP:
        is_ppor = False

    brackets = schedule.ppor_brackets if (is_ppor and schedule.ppor_brackets) else schedule.brackets

    return _calculate_bracket_duty(price, brackets, schedule.round_to_100)
