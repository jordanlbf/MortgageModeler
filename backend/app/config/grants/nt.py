"""
NORTHERN TERRITORY HOME BUYER SCHEMES

NT uses the "HomeGrown Territory" branding for its grants.
No property value caps on any grant.

Sources:
- NT Treasury: treasury.nt.gov.au
- nt.gov.au
Verified: March 2026

Notes:
- Territory Home Owner Discount (THOD) appears to be a historical measure
  that has been superseded by the HomeGrown Territory program. Not included.
- NT official sources are internally inconsistent on grant end dates.
  Some pages show 30 Sep 2027, others show 30 Sep 2026. The established-home
  grant may have a shorter window (originally to 30 Sep 2025). Dates here
  reflect the most recent extensions found, but should be re-verified
  before relying on them for hard eligibility decisions.
"""

from datetime import date

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── HomeGrown Territory Grant — New Homes (NT) ──────
# $50,000 for new homes. Contracts 1 Oct 2024 – 30 Sep 2027.
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
        "Must live in for 12 continuous months",
        "Cannot have previously received FHOG in any state",
    ],
    valid_from=date(2024, 10, 1),
    valid_to=date(2027, 9, 30),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        property_types=["new"],
    ),
)

# ── HomeGrown Territory Grant — Established Homes (NT)
# $10,000 for established homes. Same contract window.

FHOG_ESTABLISHED_NT = GrantScheme(
    id="fhog-established-nt",
    name="HomeGrown Territory Grant (Established Homes)",
    level="State",
    state=State.NT,
    category="grant",
    benefit_pill="$10,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $10,000 grant for first home buyers purchasing an established home in the NT.",
    benefits=[
        "$10,000 cash grant",
        "No property value cap",
        "Established (existing) homes eligible",
    ],
    eligibility=[
        "First home buyer",
        "Established home",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 12 continuous months)",
    ],
    summary="You qualify for a $10,000 grant towards your established home.",
    details=(
        "The NT HomeGrown Territory grant also provides $10,000 to first home buyers "
        "purchasing an established (existing) home. No property value cap applies. "
        "You must live in the home for 12 continuous months."
    ),
    rules=[
        "Contracts 1 Oct 2024 – 30 Sep 2027",
        "No property value cap",
        "Must live in for 12 continuous months",
        "Cannot have previously received FHOG in any state",
    ],
    valid_from=date(2024, 10, 1),
    valid_to=date(2027, 9, 30),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        property_types=["existing"],
    ),
)

# ── FreshStart Grant — Existing Homeowners (NT) ─────
# $30,000 for existing homeowners buying/building new.
# Extended to 30 Sep 2027. Applications by 31 Dec 2027.

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
        "from 1 October 2024 to 30 September 2027, with applications by 31 December 2027."
    ),
    rules=[
        "Contracts 1 Oct 2024 – 30 Sep 2027",
        "Applications by 31 December 2027",
        "Must live in for 12 continuous months within 12 months of completion",
        "Cannot be combined with the HomeGrown Territory FHOG",
    ],
    valid_from=date(2024, 10, 1),
    valid_to=date(2027, 9, 30),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=False,  # explicitly for NON-first-home-buyers
        owner_occupier=True,
        property_types=["new"],
    ),
)

# ── All NT schemes ───────────────────────────────────

NT_SCHEMES: list[GrantScheme] = [FHOG_NEW_NT, FHOG_ESTABLISHED_NT, FRESHSTART_NT]
