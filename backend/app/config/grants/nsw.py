"""
NEW SOUTH WALES HOME BUYER SCHEMES

Sources:
- Revenue NSW: revenue.nsw.gov.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

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
        "Owner-occupier (live in for 6 continuous months within 12 months)",
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
        "Must live in the property for 6 continuous months within 12 months",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        property_type="new",
    ),
)

# ── First Home Buyer Stamp Duty Exemption (NSW) ─────
# Full exemption up to $800k, concession $800k–$1M.
# Thresholds from 1 July 2023.

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
        "Owner-occupier (move in within 12 months, live there 6 months)",
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
        "Thresholds effective from 1 July 2023",
    ],
    predicates=EligibilityPredicates(
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
        "Must build and move in",
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
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        max_price=450_000,
    ),
)

# ── Off-the-Plan Duty Concession (NSW) ──────────────
# Duty assessed on land-value component only.
# Extended to October 2026. All buyers.

OTP_NSW = GrantScheme(
    id="otp-nsw",
    name="Off-the-Plan Duty Concession",
    level="State",
    state=State.NSW,
    category="concession",
    benefit_pill="Up to ~$40k saved",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Stamp duty assessed on land value only for off-the-plan purchases — significant savings.",
    benefits=[
        "Duty assessed on land-value component, not full completed price",
        "Pre-construction: full exemption up to $750,000",
        "Savings of $27,000–$40,000 on typical apartments",
    ],
    eligibility=[
        "Any buyer (not limited to first home buyers)",
        "Off-the-plan purchase",
        "Extended to October 2026",
    ],
    summary="You pay stamp duty on the land value only, not the full purchase price.",
    details=(
        "NSW's off-the-plan duty concession assesses stamp duty on the land-value "
        "component rather than the full completed price. For pre-construction contracts, "
        "full exemption applies up to $750,000. Savings can be $27,000–$40,000 on "
        "typical apartments. Available to all buyers. Extended to October 2026."
    ),
    rules=[
        "Duty on land-value component only",
        "Pre-construction: full exemption up to $750,000",
        "Available to all buyers including investors",
        "Extended to October 2026",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=None,
        owner_occupier=None,
    ),
)

# ── All NSW schemes ──────────────────────────────────

NSW_SCHEMES: list[GrantScheme] = [FHOG_NSW, FHB_STAMP_NSW, FHB_LAND_NSW, OTP_NSW]
