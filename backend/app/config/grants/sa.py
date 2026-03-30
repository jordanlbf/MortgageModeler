"""
SOUTH AUSTRALIA HOME BUYER SCHEMES

Sources:
- RevenueSA: revenuesa.sa.gov.au
- HomeStart: homestart.com.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── First Home Owner Grant (SA) ──────────────────────
# No property value cap from 6 June 2024.

FHOG_SA = GrantScheme(
    id="fhog-sa",
    name="First Home Owner Grant",
    level="State",
    state=State.SA,
    category="grant",
    benefit_pill="$15,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $15,000 grant for first home buyers purchasing or building a new home in South Australia.",
    benefits=[
        "$15,000 cash grant",
        "No property value cap (from June 2024)",
    ],
    eligibility=[
        "First home buyer",
        "New home",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 6 continuous months within 12 months)",
    ],
    summary="You qualify for a $15,000 grant towards your new home.",
    details=(
        "The SA First Home Owner Grant provides $15,000 to eligible first home buyers "
        "purchasing or building a new home. The property value cap was abolished from "
        "6 June 2024 — there is no longer any price limit."
    ),
    rules=[
        "Must be a new home",
        "No property value cap (abolished 6 June 2024)",
        "Must live in the property for 6 continuous months within 12 months",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        property_type="new",
    ),
)

# ── Stamp Duty Exemption — New Homes (SA) ───────────
# Full exemption for new homes, no price cap. No relief
# for established homes.

FHB_STAMP_SA = GrantScheme(
    id="fhb-stamp-sa",
    name="First Home Buyer Stamp Duty Exemption",
    level="State",
    state=State.SA,
    category="concession",
    benefit_pill="Full exemption (new homes)",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for first home buyers purchasing a new home — no price cap.",
    benefits=[
        "Full transfer duty exemption",
        "No property value cap",
        "New homes only (no relief for established homes)",
    ],
    eligibility=[
        "First home buyer",
        "New home (established homes not eligible)",
        "Australian citizen or permanent resident",
        "Owner-occupier",
    ],
    summary="You pay zero stamp duty on your new home purchase.",
    details=(
        "South Australia provides a full stamp duty exemption for first home buyers "
        "purchasing a new home, with no property value cap (from 6 June 2024). "
        "There is no stamp duty concession for established homes — the exemption "
        "applies only to new builds."
    ),
    rules=[
        "New homes only — no relief for established/existing homes",
        "No property value cap",
        "Effective from 6 June 2024",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        property_type="new",
    ),
)

# ── HomeStart Shared Equity (SA) ─────────────────────

HOMESTART_SA = GrantScheme(
    id="homestart-sa",
    name="HomeStart Shared Equity",
    level="State",
    state=State.SA,
    category="equity",
    benefit_pill="Up to 25% equity",
    meta=SchemeMeta(deposit="2–5%", lmi="Waived", buyer="Individual / Joint"),
    theme="Government-backed lender offering shared equity and low-deposit home loans in SA.",
    benefits=[
        "Shared equity: HomeStart contributes 5–25% with no interest",
        "Low-deposit loans from 2–3%",
        "No LMI",
    ],
    eligibility=[
        "SA resident",
        "Income cap: $110,000 after tax (shared equity)",
        "Property price cap: $675,000 (shared equity)",
        "Owner-occupier",
    ],
    summary="HomeStart contributes up to 25% equity, reducing your loan and repayments.",
    details=(
        "HomeStart Finance is a SA government-backed lender offering shared equity and "
        "low-deposit home loans. The shared equity option provides 5–25% of the property "
        "value with no interest charged — gain/loss is shared on sale or refinance. "
        "Over 40% of HomeStart customers used shared equity in 2024-25."
    ),
    rules=[
        "Shared equity income cap: $110,000 after tax",
        "Shared equity property price cap: $675,000",
        "Equity gain/loss shared on sale or refinance",
        "Various loan products available (low deposit, graduate, etc.)",
    ],
    predicates=EligibilityPredicates(
        owner_occupier=True,
        max_price=675_000,
    ),
)

# ── All SA schemes ───────────────────────────────────

SA_SCHEMES: list[GrantScheme] = [FHOG_SA, FHB_STAMP_SA, HOMESTART_SA]
