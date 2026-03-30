"""
QUEENSLAND HOME BUYER SCHEMES

Sources:
- QRO: qro.qld.gov.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── First Home Owner Grant (QLD) ─────────────────────
# $30,000 extended to 30 June 2026 (reverts to $15,000 after).
# Residency: move in within 1 year, live there 6 continuous months.

FHOG_QLD = GrantScheme(
    id="fhog-qld",
    name="First Home Owner Grant",
    level="State",
    state=State.QLD,
    category="grant",
    benefit_pill="$30,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $30,000 grant for first home buyers purchasing or building a new home in Queensland.",
    benefits=[
        "$30,000 cash grant (until 30 June 2026)",
        "Applied at settlement or on completion",
    ],
    eligibility=[
        "First home buyer",
        "New or substantially renovated home",
        "Property value under $750,000",
        "Australian citizen or permanent resident",
        "Owner-occupier (move in within 1 year, live there 6 months)",
    ],
    summary="You qualify for a $30,000 grant towards your new home.",
    details=(
        "The Queensland First Home Owner Grant provides a one-off $30,000 payment to "
        "eligible first home buyers purchasing or building a brand new home valued under "
        "$750,000. The enhanced $30,000 amount applies to contracts signed from 20 Nov 2023 "
        "to 30 June 2026, after which it reverts to $15,000."
    ),
    rules=[
        "Must be a new or substantially renovated home",
        "$30,000 amount applies to contracts 20 Nov 2023 – 30 Jun 2026",
        "Must move in within 1 year and live there for 6 continuous months",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        property_type="new",
    ),
)

# ── First Home Concession — Existing Homes (QLD) ────
# Full exemption up to $700k, sliding concession $700k–$800k.
# Applies to contracts from 9 June 2024.

FHB_STAMP_EXISTING_QLD = GrantScheme(
    id="fhb-stamp-existing-qld",
    name="First Home Concession (Existing Homes)",
    level="State",
    state=State.QLD,
    category="concession",
    benefit_pill="Up to $24,525 saved",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Reduced or zero stamp duty for first home buyers purchasing existing homes up to $800,000.",
    benefits=[
        "Full exemption for properties up to $700,000",
        "Sliding concession $700,001 – $799,999",
        "Savings up to $24,525",
    ],
    eligibility=[
        "First home buyer",
        "Existing home (not new build)",
        "Property value under $800,000",
        "Owner-occupier",
    ],
    summary="You may pay reduced or zero stamp duty on your existing home purchase.",
    details=(
        "Queensland offers transfer duty concessions for first home buyers purchasing "
        "existing homes. Properties valued up to $700,000 receive a full exemption. "
        "Properties between $700,001 and $799,999 receive a sliding scale concession. "
        "No concession applies at $800,000 or above."
    ),
    rules=[
        "Full exemption applies to properties up to $700,000",
        "Concession tapers in ~$10k bands between $700,001 and $799,999",
        "No concession for properties at $800,000 or above",
        "Applies to contracts from 9 June 2024",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        max_price=800_000,
    ),
)

# ── First Home Concession — New Homes (QLD) ─────────
# From 1 May 2025: full duty waiver with NO price cap
# for new homes purchased by first home buyers.

FHB_STAMP_NEW_QLD = GrantScheme(
    id="fhb-stamp-new-qld",
    name="First Home Concession (New Homes)",
    level="State",
    state=State.QLD,
    category="concession",
    benefit_pill="Full duty waiver",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Zero transfer duty for first home buyers purchasing a new home in Queensland — no price cap.",
    benefits=[
        "Full transfer duty waiver",
        "No property value cap",
        "Applies to new or substantially renovated homes",
    ],
    eligibility=[
        "First home buyer",
        "New or substantially renovated home",
        "No price cap",
        "Owner-occupier",
    ],
    summary="You pay zero transfer duty on your new home purchase.",
    details=(
        "From 1 May 2025, Queensland first home buyers purchasing a new or substantially "
        "renovated home pay zero transfer duty regardless of purchase price. This is a "
        "separate and more generous concession than the existing-home concession."
    ),
    rules=[
        "Contract must be dated 1 May 2025 or later",
        "Must be a new or substantially renovated home",
        "Applies to the residential land portion of the transfer",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        property_type="new",
    ),
)

# ── First Home Vacant Land Concession (QLD) ──────────
# From 1 May 2025: full duty waiver with NO price cap.

FHB_LAND_QLD = GrantScheme(
    id="fhb-land-qld",
    name="First Home Vacant Land Concession",
    level="State",
    state=State.QLD,
    category="concession",
    benefit_pill="Full duty waiver on land",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Zero transfer duty on vacant residential land for first home buyers — no price cap.",
    benefits=[
        "Full transfer duty waiver on vacant land",
        "No property value cap (from May 2025)",
    ],
    eligibility=[
        "First home buyer",
        "Vacant residential land",
        "Must build and move in within 2 years",
    ],
    summary="You pay zero transfer duty on vacant land to build your first home.",
    details=(
        "From 1 May 2025, first home buyers purchasing vacant residential land in "
        "Queensland pay zero transfer duty regardless of the land value. You must build "
        "on the land, move in, and live there daily within 2 years of settlement."
    ),
    rules=[
        "Contract must be dated 1 May 2025 or later",
        "Must build, move in, and live there within 2 years of settlement",
        "Applies to residential vacant land only",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
    ),
)

# ── Home Concession — General Buyer (QLD) ────────────
# Reduced transfer duty rate for any owner-occupier buyer.

HOME_CONCESSION_QLD = GrantScheme(
    id="home-concession-qld",
    name="Home Concession (General)",
    level="State",
    state=State.QLD,
    category="concession",
    benefit_pill="Reduced duty rate",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Reduced transfer duty rate for any buyer purchasing a home to live in as their principal residence.",
    benefits=[
        "Concessional rate of 1% on first $350,000",
        "Standard rates above $350,000",
        "Available to all owner-occupiers, not just first home buyers",
    ],
    eligibility=[
        "Any buyer (not limited to first home buyers)",
        "Must be principal place of residence",
        "Must move in within 1 year",
    ],
    summary="You pay a reduced transfer duty rate on your principal residence.",
    details=(
        "The QLD home concession applies a concessional duty rate of $1.00 per $100 on "
        "the first $350,000 of the property value, with standard rates above that. "
        "Available to all buyer purchasing a home to live in, not just first home buyers."
    ),
    rules=[
        "1% rate on first $350,000; standard rates above",
        "Must move in within 1 year of settlement",
        "Must use as principal place of residence",
    ],
    predicates=EligibilityPredicates(
        owner_occupier=True,
        first_home_buyer=None,  # available to all buyers
    ),
)

# ── Boost to Buy Shared Equity (QLD) ─────────────────
# Up to 30% equity for new, 25% for existing.
# Funded $330M for ~2,000 places.

BOOST_TO_BUY_QLD = GrantScheme(
    id="boost-to-buy-qld",
    name="Boost to Buy",
    level="State",
    state=State.QLD,
    category="equity",
    benefit_pill="Up to 30% equity",
    meta=SchemeMeta(deposit="2%", lmi="Waived", buyer="Individual / Joint"),
    theme="Queensland shared equity scheme — government contributes up to 30% for new homes, 25% for existing.",
    benefits=[
        "Up to 30% equity for new builds, 25% for existing",
        "As little as 2% deposit",
        "No LMI on government portion",
    ],
    eligibility=[
        "Income cap: $150,000 (single) / $225,000 (couple)",
        "Property price cap: $1,000,000",
        "Owner-occupier",
        "Must not currently own property",
    ],
    summary="The Queensland government co-owns up to 30%, reducing your loan.",
    details=(
        "Boost to Buy is Queensland's shared equity scheme where the government "
        "contributes up to 30% of a new home's price (or 25% for existing homes). "
        "Funded at $330 million for approximately 2,000 places. Minimum 2% deposit."
    ),
    rules=[
        "Income cap: $150,000 single / $225,000 couple",
        "Property price cap: $1,000,000",
        "Government equity must be repaid on sale or bought back over time",
        "~2,000 places available",
    ],
    predicates=EligibilityPredicates(
        owner_occupier=True,
        max_price=1_000_000,
        max_income_single=150_000,
        max_income_couple=225_000,
    ),
)

# ── Off-the-Plan Duty Concession (QLD) ──────────────
# Available to all buyers. Extended to 21 October 2026.

OTP_QLD = GrantScheme(
    id="otp-qld",
    name="Off-the-Plan Duty Concession",
    level="State",
    state=State.QLD,
    category="concession",
    benefit_pill="Reduced duty on OTP",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Stamp duty reduction on off-the-plan purchases — post-contract construction costs deducted from dutiable value.",
    benefits=[
        "Post-contract construction costs deducted from dutiable value",
        "Available to all buyers (not FHB-restricted)",
        "Extended to 21 October 2026",
    ],
    eligibility=[
        "Any buyer",
        "Off-the-plan purchase",
        "Contract signed by 21 October 2026",
    ],
    summary="You pay reduced stamp duty on your off-the-plan purchase.",
    details=(
        "Queensland's off-the-plan duty concession deducts post-contract construction "
        "costs from the dutiable value, reducing stamp duty on new apartments and units. "
        "Available to all purchasers, not just first home buyers. Extended to 21 October 2026."
    ),
    rules=[
        "Deducts post-contract construction costs from dutiable value",
        "Available to all buyers including investors",
        "Contract must be signed by 21 October 2026",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=None,
        owner_occupier=None,
        off_the_plan_only=True,
    ),
)

# ── All QLD schemes ──────────────────────────────────

QLD_SCHEMES: list[GrantScheme] = [
    FHOG_QLD,
    FHB_STAMP_EXISTING_QLD,
    FHB_STAMP_NEW_QLD,
    FHB_LAND_QLD,
    HOME_CONCESSION_QLD,
    BOOST_TO_BUY_QLD,
    OTP_QLD,
]
