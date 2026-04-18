"""
Multi-state stamp duty calculation engine.

Handles bracket-based duty (QLD, NSW, VIC, WA, SA, TAS, ACT) and
formula-based duty (NT). All functions are pure — no side effects.
"""

import math
from collections.abc import Callable

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

    # ACT PPOR brackets only cover up to $1,455k
    if state == "ACT" and is_ppor and price > 1_455_000:
        is_ppor = False

    brackets = schedule.ppor_brackets if (is_ppor and schedule.ppor_brackets) else schedule.brackets

    return _calculate_bracket_duty(price, brackets, schedule.round_to_100)


# ── FHB stamp duty concession functions ──────────────
#
# Each takes (price, base_duty) and returns the concession amount.
# Referenced by name in GrantScheme.financial_effect.stamp_duty_concession_fn.


def _sliding_concession(
    price: float,
    base_duty: float,
    exempt_cap: float,
    taper_cap: float,
) -> float:
    """Generic sliding-scale concession.

    Full exemption below exempt_cap, linear taper between exempt_cap
    and taper_cap, no concession at or above taper_cap.

    Args:
        price: Property purchase price.
        base_duty: Duty before concession.
        exempt_cap: Price below which full exemption applies.
        taper_cap: Price at or above which no concession applies.

    Returns:
        Concession amount (to subtract from base duty).
    """
    if price <= exempt_cap:
        return base_duty
    if price >= taper_cap:
        return 0.0
    fraction = (taper_cap - price) / (taper_cap - exempt_cap)
    return base_duty * fraction


def _qld_fhb_existing(price: float, base_duty: float) -> float:
    """QLD first home concession on existing homes.

    Full exemption up to $700k, taper $700k–$800k.
    """
    return _sliding_concession(price, base_duty, 700_000, 800_000)


def _nsw_fhb_home(price: float, base_duty: float) -> float:
    """NSW first home buyer assistance — homes.

    Full exemption up to $800k, taper $800k–$1M.
    """
    return _sliding_concession(price, base_duty, 800_000, 1_000_000)


def _nsw_fhb_land(price: float, base_duty: float) -> float:
    """NSW first home buyer assistance — vacant land.

    Full exemption up to $350k, taper $350k–$450k.
    """
    return _sliding_concession(price, base_duty, 350_000, 450_000)


def _vic_fhb_home(price: float, base_duty: float) -> float:
    """VIC first home buyer duty exemption/concession.

    Full exemption up to $600k, taper $600k–$750k.
    """
    return _sliding_concession(price, base_duty, 600_000, 750_000)


def _wa_fhb_home(price: float, base_duty: float) -> float:
    """WA first home owner rate — established homes.

    Full exemption up to $500k, taper $500k–$700k.
    """
    return _sliding_concession(price, base_duty, 500_000, 700_000)


def _wa_fhb_land(price: float, base_duty: float) -> float:
    """WA first home owner rate — vacant land.

    Full exemption up to $350k, taper $350k–$450k.
    """
    return _sliding_concession(price, base_duty, 350_000, 450_000)


def _act_hbcs(price: float, base_duty: float) -> float:
    """ACT Home Buyer Concession Scheme.

    Full exemption up to $1,020k. Taper $1,020k–$1,455k with
    max concession capped at $35,238.
    """
    if price <= 1_020_000:
        return base_duty
    if price >= 1_455_000:
        return 0.0
    fraction = (1_455_000 - price) / (1_455_000 - 1_020_000)
    return min(base_duty * fraction, 35_238)


CONCESSION_FNS: dict[str, Callable[[float, float], float]] = {
    "qld_fhb_existing": _qld_fhb_existing,
    "nsw_fhb_home": _nsw_fhb_home,
    "nsw_fhb_land": _nsw_fhb_land,
    "vic_fhb_home": _vic_fhb_home,
    "wa_fhb_home": _wa_fhb_home,
    "wa_fhb_land": _wa_fhb_land,
    "act_hbcs": _act_hbcs,
}
