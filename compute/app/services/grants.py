"""
Grants eligibility service.

Evaluates user inputs against scheme predicates from config.
Returns domain results — no per-scheme logic, all behaviour
is driven by declarative predicates.
"""

from datetime import date

from app.config.grants._types import GrantScheme
from app.config.grants.registry import get_all_schemes, get_schemes_for_states
from app.engine.property import estimate_lmi
from app.engine.stamp_duty import CONCESSION_FNS, calculate_stamp_duty
from app.models.grants import Blocker, EligibilityResult, GrantsInputs, SchemeEligibility, SchemeValue


def _today() -> date:
    """Today's date. A function so tests can pin it."""
    return date.today()


def _is_expired(scheme: GrantScheme) -> bool:
    """Check if a scheme has passed its valid_to date.

    Args:
        scheme: Grant scheme with optional validity dates.

    Returns:
        True if the scheme has a valid_to date that is in the past.
    """
    if scheme.valid_to is None:
        return False
    return _today() > scheme.valid_to


def _check_eligibility(scheme: GrantScheme, inputs: GrantsInputs) -> EligibilityResult:
    """Check a single scheme's predicates against user inputs.

    Predicates set to ``None`` are skipped (scheme has no requirement).
    User inputs set to ``None`` are also skipped (user hasn't specified).
    A reason string is appended for each failing predicate.

    Args:
        scheme: Grant scheme with declarative predicates.
        inputs: Domain inputs from the caller.

    Returns:
        EligibilityResult with eligible flag and list of failing reasons.
    """
    reasons: list[str] = []
    blockers: list[Blocker] = []
    p = scheme.predicates

    def fail(reason: str, kind: str, amount: float | None = None, options: list[str] | None = None) -> None:
        reasons.append(reason)
        blockers.append(Blocker(kind=kind, amount=amount, options=options))

    # First home buyer
    if p.first_home_buyer is not None and inputs.first_home_buyer is not None:
        if inputs.first_home_buyer != p.first_home_buyer:
            if p.first_home_buyer:
                fail("Must be a first home buyer", "first_home")
            else:
                fail("Not available to first home buyers", "not_first_home")

    # Owner-occupier
    if p.owner_occupier is not None and inputs.owner_occupier is not None:
        if inputs.owner_occupier != p.owner_occupier:
            fail("Must be owner-occupier", "owner_occupier")

    # Single parent required
    if p.single_parent_required and inputs.single_parent is not None:
        if not inputs.single_parent:
            fail("Must be a single parent or legal guardian", "single_parent")

    # Must not have owned property in last 2 years (ACT)
    if p.requires_no_property_in_last_2_years and inputs.owned_property_in_last_2_years is not None:
        if inputs.owned_property_in_last_2_years:
            fail("Must not have owned property in Australia in the last 2 years", "no_recent_property")

    # Property price cap (regional if available, else general)
    if inputs.price > 0:
        price_cap = None
        if inputs.region and p.max_price_by_region:
            price_cap = p.max_price_by_region.get(inputs.region)
        if price_cap is None:
            price_cap = p.max_price
        if price_cap is not None and inputs.price > price_cap:
            region_label = f" ({inputs.region})" if inputs.region and p.max_price_by_region else ""
            fail(f"Property value must be ${price_cap:,.0f} or less{region_label}", "price", price_cap)

    # Income cap (regional if available, else general)
    household_income = inputs.income + inputs.partner_income
    if household_income > 0:
        income_single = p.max_income_single
        income_couple = p.max_income_couple
        if inputs.region and p.max_income_by_region:
            regional = p.max_income_by_region.get(inputs.region)
            if regional is not None:
                income_single, income_couple = regional
        if inputs.buyer_type == "couple" and income_couple is not None:
            if household_income > income_couple:
                fail(f"Household income must be ${income_couple:,.0f} or less", "income", income_couple)
        elif income_single is not None:
            if inputs.income > income_single:
                fail(f"Income must be ${income_single:,.0f} or less", "income", income_single)

    # Property types (list-based — user's type must be in allowed list)
    if p.property_types is not None and inputs.property_type is not None:
        if inputs.property_type not in p.property_types:
            allowed = ", ".join(p.property_types)
            fail(f"Property type must be: {allowed}", "property_type", options=list(p.property_types))

    # Individual only
    if p.individual_only and inputs.buyer_type is not None:
        if inputs.buyer_type != "individual":
            fail("Individual application only", "individual")

    # Off-the-plan only
    if p.off_the_plan_only and inputs.off_the_plan is not None:
        if not inputs.off_the_plan:
            fail("Off-the-plan purchase only", "off_the_plan")

    return EligibilityResult(eligible=len(reasons) == 0, reasons=reasons, blockers=blockers)


def _estimate_value(scheme: GrantScheme, inputs: GrantsInputs) -> SchemeValue:
    """Estimate what a scheme is worth for this purchase.

    Sums its dollar effects: cash grant, super release cap, stamp duty saved
    (exemption or concession on the scheme's state duty, as a home to live
    in) and LMI avoided at the scheme's minimum deposit. Co-ownership schemes
    report their share instead (new-build share for new homes).

    Args:
        scheme: Grant scheme with its financial effect.
        inputs: Purchase inputs; price drives duty, LMI and nothing else.

    Returns:
        SchemeValue. ``amount`` is None when a price-based effect has no price.
    """
    fe = scheme.financial_effect
    price = inputs.price
    amount = fe.cash_grant + fe.super_release_cap
    needs_price = False

    state = scheme.state.value if scheme.state else None
    if state and (fe.stamp_duty_exemption or fe.stamp_duty_concession_fn):
        if price <= 0:
            needs_price = True
        else:
            base = calculate_stamp_duty(price, state, is_ppor=True)
            if fe.stamp_duty_exemption:
                amount += base
            else:
                fn = CONCESSION_FNS.get(fe.stamp_duty_concession_fn or "")
                amount += fn(price, base) if fn else 0.0

    if fe.lmi_waiver and fe.min_deposit_percent is not None:
        if price <= 0:
            needs_price = True
        else:
            lvr = 1 - fe.min_deposit_percent
            amount += estimate_lmi(price * lvr, lvr, is_investment=False)

    share = fe.equity_share_new if inputs.property_type == "new" else fe.equity_share_existing
    if share is None:
        share = fe.equity_share_new or fe.equity_share_existing

    return SchemeValue(amount=None if needs_price else round(amount), share=share)


def evaluate_schemes(inputs: GrantsInputs) -> list[SchemeEligibility]:
    """Get schemes for the requested states and evaluate eligibility.

    Retrieves federal schemes plus schemes for each requested state,
    filters out expired schemes, checks each against the user's inputs,
    and sorts results with eligible schemes first.

    Args:
        inputs: Domain inputs including selected states.

    Returns:
        List of SchemeEligibility, sorted eligible-first then by
        fewest failing reasons.
    """
    schemes = get_schemes_for_states(inputs.states)

    # Filter out expired schemes
    active = [s for s in schemes if not _is_expired(s)]

    results = [
        SchemeEligibility(scheme=s, result=_check_eligibility(s, inputs), value=_estimate_value(s, inputs))
        for s in active
    ]

    results.sort(key=lambda x: (not x.result.eligible, len(x.result.reasons)))
    return results


def get_scheme_catalogue() -> list[GrantScheme]:
    """Return all active schemes across all jurisdictions without eligibility checking.

    Filters out schemes that have passed their valid_to date.

    Returns:
        List of active registered GrantScheme instances.
    """
    return [s for s in get_all_schemes() if not _is_expired(s)]
