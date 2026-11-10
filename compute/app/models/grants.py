"""
Grants domain models — service inputs and eligibility results.

These are the internal representations used by the grants service.
Separate from API schemas (which define the HTTP contract) and config
types (which define scheme data).
"""

from dataclasses import dataclass, field

from app.config.grants._types import GrantScheme


@dataclass
class GrantsInputs:
    """User inputs for evaluating grant eligibility.

    Attributes:
        states: Region codes to evaluate (e.g. ``["Federal", "QLD"]``).
        price: Property purchase price (0 if unset).
        income: Primary applicant annual income (0 if unset).
        partner_income: Partner annual income for couples (0 if unset).
        property_type: ``"new"``, ``"existing"``, ``"land"``, or None if unset.
        buyer_type: ``"individual"``, ``"couple"``, or None if unset.
        first_home_buyer: True, False, or None if unset.
        owner_occupier: True, False, or None if unset.
        single_parent: True, False, or None if unset.
        owned_property_in_last_2_years: True, False, or None if unset.
        off_the_plan: Whether the purchase is off-the-plan, or None if unset.
    """

    states: list[str] = field(default_factory=list)
    region: str | None = None
    price: float = 0.0
    income: float = 0.0
    partner_income: float = 0.0
    property_type: str | None = None
    buyer_type: str | None = None
    first_home_buyer: bool | None = None
    owner_occupier: bool | None = None
    single_parent: bool | None = None
    owned_property_in_last_2_years: bool | None = None
    off_the_plan: bool | None = None


@dataclass
class Blocker:
    """One failing rule, in a form a UI can label briefly.

    Attributes:
        kind: The rule: first_home, not_first_home, owner_occupier,
            single_parent, no_recent_property, price, income,
            property_type, individual, off_the_plan.
        amount: The cap, for price and income.
        options: The allowed property types, for property_type.
    """

    kind: str
    amount: float | None = None
    options: list[str] | None = None


@dataclass
class EligibilityResult:
    """Result of checking a single scheme against user inputs.

    Attributes:
        eligible: Whether the user meets all checked predicates.
        reasons: List of human-readable failing reasons (empty if eligible).
    """

    eligible: bool
    reasons: list[str] = field(default_factory=list)
    blockers: list[Blocker] = field(default_factory=list)


@dataclass
class SchemeValue:
    """Rough worth of a scheme for this purchase.

    Attributes:
        amount: Dollars it's worth (cash grant, stamp duty saved, LMI avoided,
            super released), or None when it needs a price that isn't set.
            0 when it has no dollar effect.
        share: Government's ownership share for co-ownership schemes
            (e.g. 0.4), or None.
    """

    amount: float | None = 0.0
    share: float | None = None


@dataclass
class SchemeEligibility:
    """A scheme paired with its eligibility result and rough worth.

    Attributes:
        scheme: The grant scheme that was evaluated.
        result: Eligibility outcome for that scheme.
        value: What it's worth for this purchase.
    """

    scheme: GrantScheme
    result: EligibilityResult
    value: SchemeValue = field(default_factory=SchemeValue)
