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
        off_the_plan: Whether the purchase is off-the-plan, or None if unset.
    """

    states: list[str] = field(default_factory=list)
    price: float = 0.0
    income: float = 0.0
    partner_income: float = 0.0
    property_type: str | None = None
    buyer_type: str | None = None
    first_home_buyer: bool | None = None
    owner_occupier: bool | None = None
    single_parent: bool | None = None
    off_the_plan: bool | None = None


@dataclass
class EligibilityResult:
    """Result of checking a single scheme against user inputs.

    Attributes:
        eligible: Whether the user meets all checked predicates.
        reasons: List of human-readable failing reasons (empty if eligible).
    """

    eligible: bool
    reasons: list[str] = field(default_factory=list)


@dataclass
class SchemeEligibility:
    """A scheme paired with its eligibility result.

    Attributes:
        scheme: The grant scheme that was evaluated.
        result: Eligibility outcome for that scheme.
    """

    scheme: GrantScheme
    result: EligibilityResult
