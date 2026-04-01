"""
NEW SOUTH WALES HOME BUYER SCHEMES

Sources:
- Revenue NSW: revenue.nsw.gov.au
Verified: March 2026

Notes:
- NSW First Home Buyer Choice (annual property tax option) abolished 1 Jul 2023.
- NSW Shared Equity Home Buyer Helper closed 30 Sep 2024.
- NSW does not have a general off-the-plan duty concession like VIC/WA;
  off-the-plan in NSW relates to deferral of when duty is paid, not a
  separate concession reducing the dutiable value.
"""

from app.config.grants._types import (
    EligibilityPredicates,
    FinancialEffect,
    GrantScheme,
    SchemeMeta,
    State,
)

# ── First Home Owner Grant (NSW) ─────────────────────

FHOG_NSW = GrantScheme(
    id="fhog-nsw",
    name="First Home Owner Grant",
    level="State",
    state=State.NSW,
    category="grant",
    benefit_pill="$10,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $10,000 grant for first home buyers purchasing or building a new home in NSW.",
    benefits=[
        "$10,000 cash grant",
        "Applied at settlement or on completion",
    ],
    eligibility=[
        "First home buyer",
        "New home (never occupied or sold as residence)",
        "Property value up to $600,000 (or $750,000 house-and-land)",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 12 continuous months within 12 months)",
    ],
    summary="You qualify for a $10,000 grant towards your new home.",
    details=(
        "The NSW First Home Owner Grant provides $10,000 to eligible first home buyers "
        "purchasing or building a brand new home. The property value cap is $600,000 for "
        "completed homes or $750,000 for house-and-land packages."
    ),
    rules=[
        "Must be a new home never previously occupied or sold as a residence",
        "$600,000 cap for completed homes, $750,000 for house-and-land",
        "Must move in within 12 months and live there for 12 continuous months",
        "Cannot have previously received FHOG in any state",
    ],
    financial_effect=FinancialEffect(cash_grant=10_000),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        property_types=["new"],
    ),
)

# ── First Home Buyer Stamp Duty Exemption (NSW) ─────
# Full exemption up to $800k, concession $800k–$1M.
# Thresholds from 1 July 2023.
# Residence requirement: 12 continuous months.

FHB_STAMP_NSW = GrantScheme(
    id="fhb-stamp-nsw",
    name="First Home Buyer Stamp Duty Exemption",
    level="State",
    state=State.NSW,
    category="concession",
    benefit_pill="Exempt up to $800k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for first home buyers on properties up to $800,000.",
    benefits=[
        "Full exemption for properties up to $800,000",
        "Concessional rate $800,001 – $1,000,000",
        "Applies to new and existing homes",
    ],
    eligibility=[
        "First home buyer",
        "Property value up to $1,000,000 for any concession",
        "Australian citizen or permanent resident",
        "Owner-occupier (move in within 12 months, live there 12 continuous months)",
    ],
    summary="You pay zero stamp duty on your home purchase.",
    details=(
        "NSW provides a full transfer duty exemption for first home buyers purchasing "
        "a property valued up to $800,000. Properties between $800,001 and $1,000,000 "
        "receive a concessional rate. No concession applies above $1,000,000."
    ),
    rules=[
        "Full exemption up to $800,000",
        "Concessional rate from $800,001 to $1,000,000",
        "No concession above $1,000,000",
        "Must move in within 12 months, live there 12 continuous months",
        "Thresholds effective from 1 July 2023",
    ],
    financial_effect=FinancialEffect(stamp_duty_concession_fn="nsw_fhb_home"),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=1_000_000,
    ),
)

# ── First Home Buyer Vacant Land Exemption (NSW) ────

FHB_LAND_NSW = GrantScheme(
    id="fhb-land-nsw",
    name="First Home Buyer Vacant Land Exemption",
    level="State",
    state=State.NSW,
    category="concession",
    benefit_pill="Exempt up to $350k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption on vacant land up to $350,000 for first home buyers in NSW.",
    benefits=[
        "Full exemption for land up to $350,000",
        "Concession $350,001 – $450,000",
    ],
    eligibility=[
        "First home buyer",
        "Vacant residential land",
        "Land value up to $450,000 for any concession",
        "Must build and occupy as principal residence",
    ],
    summary="You pay zero stamp duty on vacant land to build your first home.",
    details=(
        "First home buyers in NSW purchasing vacant land to build on can receive a full "
        "transfer duty exemption on land valued up to $350,000, or a concessional rate "
        "on land between $350,001 and $450,000."
    ),
    rules=[
        "Full exemption up to $350,000",
        "Concession tapers from $350,001 to $450,000",
        "No concession above $450,000",
        "Build and occupation timing rules apply — check Revenue NSW for details",
    ],
    financial_effect=FinancialEffect(stamp_duty_concession_fn="nsw_fhb_land"),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=450_000,
        property_types=["land"],
    ),
)

# ── All NSW schemes ──────────────────────────────────

NSW_SCHEMES: list[GrantScheme] = [FHOG_NSW, FHB_STAMP_NSW, FHB_LAND_NSW]
