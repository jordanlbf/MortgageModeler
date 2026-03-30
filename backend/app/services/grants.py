"""
Grants eligibility service.

Evaluates user inputs against scheme predicates from config.
Returns domain results — no per-scheme logic, all behaviour
is driven by declarative predicates.
"""

from datetime import date

from app.config.grants._types import GrantScheme
from app.config.grants.registry import get_all_schemes, get_schemes_for_states
from app.models.grants import EligibilityResult, GrantsInputs, SchemeEligibility


def _is_expired(scheme: GrantScheme) -> bool:
    """Check if a scheme has passed its valid_to date.

    Args:
        scheme: Grant scheme with optional validity dates.

    Returns:
        True if the scheme has a valid_to date that is in the past.
    """
    if scheme.valid_to is None:
        return False
    return date.today() > scheme.valid_to


def _check_eligibility(scheme: GrantScheme, inputs: GrantsInputs) -> EligibilityResult:
    """Check a single scheme's predicates against user inputs.

    Predicates set to ``None`` are skipped (scheme has no requirement).
    User inputs set to ``"any"`` or ``""`` are also skipped (user
    hasn't specified). A reason string is appended for each failing
    predicate.

    Args:
        scheme: Grant scheme with declarative predicates.
        inputs: Domain inputs from the caller.

    Returns:
        EligibilityResult with eligible flag and list of failing reasons.
    """
    reasons: list[str] = []
    p = scheme.predicates

    # First home buyer
    if p.first_home_buyer is not None and inputs.first_home_buyer != "any":
        user_is_fhb = inputs.first_home_buyer == "yes"
        if user_is_fhb != p.first_home_buyer:
            if p.first_home_buyer:
                reasons.append("Must be a first home buyer")
            else:
                reasons.append("Not available to first home buyers")

    # Owner-occupier
    if p.owner_occupier is not None and inputs.owner_occupier != "any":
        user_is_occ = inputs.owner_occupier == "yes"
        if user_is_occ != p.owner_occupier:
            reasons.append("Must be owner-occupier")

    # Single parent required
    if p.single_parent_required and inputs.single_parent != "any":
        if inputs.single_parent != "yes":
            reasons.append("Must be a single parent or legal guardian")

    # Property price cap
    if p.max_price is not None and inputs.price > 0:
        if inputs.price > p.max_price:
            reasons.append(f"Property value must be ${p.max_price:,.0f} or less")

    # Income cap (uses buyer_type to pick single vs couple threshold)
    household_income = inputs.income + inputs.partner_income
    if household_income > 0:
        if inputs.buyer_type == "couple" and p.max_income_couple is not None:
            if household_income > p.max_income_couple:
                reasons.append(
                    f"Household income must be ${p.max_income_couple:,.0f} or less"
                )
        elif p.max_income_single is not None:
            if inputs.income > p.max_income_single:
                reasons.append(
                    f"Income must be ${p.max_income_single:,.0f} or less"
                )

    # Property types (list-based — user's type must be in allowed list)
    if p.property_types is not None and inputs.property_type != "":
        if inputs.property_type not in p.property_types:
            allowed = ", ".join(p.property_types)
            reasons.append(f"Property type must be: {allowed}")

    # Individual only
    if p.individual_only and inputs.buyer_type != "":
        if inputs.buyer_type != "individual":
            reasons.append("Individual application only")

    # Off-the-plan only
    if p.off_the_plan_only and not inputs.off_the_plan:
        reasons.append("Off-the-plan purchase only")

    return EligibilityResult(eligible=len(reasons) == 0, reasons=reasons)


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
        SchemeEligibility(scheme=s, result=_check_eligibility(s, inputs))
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
