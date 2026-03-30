"""
NORTHERN TERRITORY HOME BUYER SCHEMES

NT has the "HomeGrown Territory" branding for its FHOG.
No property value caps on grants.

Sources:
- NT Treasury: treasury.nt.gov.au
- nt.gov.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── First Home Owner Grant — New Homes (NT) ──────────
# $50,000 for new homes (contracts 1 Oct 2024 – 30 Sep 2027).
# No property value cap. 12 months continuous residency.

FHOG_NEW_NT = GrantScheme(
    id="fhog-new-nt",
    name="HomeGrown Territory Grant (New Homes)",
    level="State",
    state=State.NT,
    category="grant",
    benefit_pill="$50,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $50,000 grant for first home buyers purchasing or building a new home in the NT.",
    benefits=[
        "$50,000 cash grant",
        "No property value cap",
        "Contracts until 30 September 2027",
    ],
    eligibility=[
        "First home buyer",
        "New home",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 12 continuous months)",
    ],
    summary="You qualify for a $50,000 grant towards your new home.",
    details=(
        "The NT HomeGrown Territory grant provides $50,000 to first home buyers "
        "purchasing or building a new home. No property value cap applies. The grant "
        "applies to contracts signed from 1 October 2024 to 30 September 2027. "
        "You must live in the home for 12 continuous months."
    ),
    rules=[
        "Contracts 1 Oct 2024 – 30 Sep 2027",
        "No property value cap",
        "Must live in for 12 continuous months (increased from 6 months)",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        property_type="new",
    ),
)

# ── FreshStart Grant — Existing Homeowners (NT) ─────
# $30,000 for existing homeowners buying/building new.
# Not a first home buyer scheme.

FRESHSTART_NT = GrantScheme(
    id="freshstart-nt",
    name="FreshStart New Home Grant",
    level="State",
    state=State.NT,
    category="grant",
    benefit_pill="$30,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $30,000 grant for existing homeowners buying or building a new home in the NT.",
    benefits=[
        "$30,000 cash grant",
        "For existing homeowners (not first home buyers)",
        "New home only",
    ],
    eligibility=[
        "Existing homeowner (not first home buyer)",
        "New home",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 12 continuous months)",
    ],
    summary="As an existing homeowner, you qualify for a $30,000 grant for a new home.",
    details=(
        "The FreshStart grant provides $30,000 to existing homeowners (not first home "
        "buyers) who purchase or build a new home in the NT. Contracts must be signed "
        "from 1 October 2024 to 30 September 2026, with applications by 31 December 2026."
    ),
    rules=[
        "Contracts 1 Oct 2024 – 30 Sep 2026",
        "Applications by 31 December 2026",
        "Must live in for 12 continuous months within 12 months of completion",
        "Cannot be combined with the HomeGrown Territory FHOG",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=False,  # explicitly for NON-first-home-buyers
        owner_occupier=True,
        property_type="new",
    ),
)

# ── Territory Home Owner Discount (THOD) ────────────
# Up to $18,601 off stamp duty (2025-26).

THOD_NT = GrantScheme(
    id="thod-nt",
    name="Territory Home Owner Discount",
    level="State",
    state=State.NT,
    category="concession",
    benefit_pill="Up to $18,601 saved",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Stamp duty discount of up to $18,601 for first home buyers in the NT.",
    benefits=[
        "Up to $18,601 off stamp duty (2025-26)",
        "Applies to new homes, established homes, and vacant land",
    ],
    eligibility=[
        "First home buyer",
        "Australian citizen or permanent resident",
        "Owner-occupier",
    ],
    summary="You receive up to $18,601 off stamp duty on your home purchase.",
    details=(
        "The Territory Home Owner Discount provides a stamp duty reduction of up to "
        "$18,601 (2025-26 figure) for first home buyers in the NT. Applies to "
        "established homes, new homes, and vacant land."
    ),
    rules=[
        "Maximum discount $18,601 (2025-26)",
        "Must not have previously owned residential property in Australia",
        "Applies to all property types (new, existing, vacant land)",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
    ),
)

# ── All NT schemes ───────────────────────────────────

NT_SCHEMES: list[GrantScheme] = [FHOG_NEW_NT, FRESHSTART_NT, THOD_NT]
