"""
GRANT SCHEME DATA TYPES

Frozen dataclasses defining the shape of grant/concession scheme data.
Used by all config modules (federal.py, qld.py, etc.) and consumed
by the eligibility service.
"""

from dataclasses import dataclass, field
from datetime import date
from enum import StrEnum


class State(StrEnum):
    NSW = "NSW"
    VIC = "VIC"
    QLD = "QLD"
    WA = "WA"
    SA = "SA"
    TAS = "TAS"
    ACT = "ACT"
    NT = "NT"


@dataclass(frozen=True)
class EligibilityPredicates:
    """Declarative eligibility rules for a scheme.

    None means the predicate is not checked (scheme has no requirement
    for that field). The eligibility service interprets these against
    user inputs to produce a pass/fail result with reasons.
    """

    first_home_buyer: bool | None = None
    owner_occupier: bool | None = None
    citizen_required: bool = False  # default False — only set True where explicitly required
    single_parent_required: bool = False
    requires_no_property_in_last_2_years: bool = False
    max_price: float | None = None
    max_income_single: float | None = None
    max_income_couple: float | None = None
    property_types: list[str] | None = None  # e.g. ["new"], ["new", "land"], ["existing"] — None = any
    individual_only: bool = False
    off_the_plan_only: bool = False


@dataclass(frozen=True)
class SchemeMeta:
    """Quick-reference facts displayed in card metadata boxes."""

    deposit: str
    lmi: str
    buyer: str


@dataclass(frozen=True)
class GrantScheme:
    """A government grant, concession, or guarantee scheme.

    Contains both display data (name, benefits, eligibility text) and
    machine-readable eligibility predicates. The eligibility service
    checks predicates against user inputs; the frontend renders the
    display fields directly.
    """

    id: str
    name: str
    level: str  # "Federal" | "State"
    state: State | None  # None for federal schemes
    category: str  # "guarantee", "grant", "concession", "super", "equity"
    benefit_pill: str
    meta: SchemeMeta
    theme: str
    benefits: list[str] = field(default_factory=list)
    eligibility: list[str] = field(default_factory=list)
    summary: str = ""
    details: str | None = None
    rules: list[str] | None = None
    valid_from: date | None = None  # scheme start date — None = no known start
    valid_to: date | None = None  # scheme expiry date — None = no known expiry
    predicates: EligibilityPredicates = field(default_factory=EligibilityPredicates)
