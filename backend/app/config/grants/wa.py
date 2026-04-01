"""
WESTERN AUSTRALIA HOME BUYER SCHEMES

Sources:
- wa.gov.au
- Keystart: keystart.com.au
Verified: March 2026
"""

from datetime import date

from app.config.grants._types import (
    EligibilityPredicates,
    FinancialEffect,
    GrantScheme,
    SchemeMeta,
    State,
)

# ── First Home Owner Grant (WA) ──────────────────────
# Price caps vary by region (updated Oct 2025).

FHOG_WA = GrantScheme(
    id="fhog-wa",
    name="First Home Owner Grant",
    level="State",
    state=State.WA,
    category="grant",
    benefit_pill="$10,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $10,000 grant for first home buyers purchasing or building a new home in WA.",
    benefits=[
        "$10,000 cash grant",
        "Property value cap: $750,000 (or $1,000,000 north of 26th parallel)",
    ],
    eligibility=[
        "First home buyer",
        "New home",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 6 continuous months within first year)",
    ],
    summary="You qualify for a $10,000 grant towards your new home.",
    details=(
        "The WA First Home Owner Grant provides $10,000 to eligible first home buyers "
        "purchasing or building a new home valued up to $750,000 (or $1,000,000 north "
        "of the 26th parallel)."
    ),
    rules=[
        "Must be a new home",
        "Property value cap: $750,000 ($1,000,000 north of 26th parallel)",
        "Must live in the property for 6 continuous months within the first year",
    ],
    financial_effect=FinancialEffect(cash_grant=10_000),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        max_price_by_region={
            "Kimberley": 1_000_000,
            "Pilbara": 1_000_000,
        },
        property_types=["new"],
    ),
)

# ── First Home Buyer Stamp Duty Exemption (WA) ──────
# Updated 21 March 2025.

FHB_STAMP_WA = GrantScheme(
    id="fhb-stamp-wa",
    name="First Home Buyer Duty Exemption",
    level="State",
    state=State.WA,
    category="concession",
    benefit_pill="Exempt up to $500k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for first home buyers on properties up to $500,000.",
    benefits=[
        "Full exemption up to $500,000",
        "Concession $500,001 – $700,000 (Perth/Peel) or $750,000 (other regions)",
        "Applies to new and existing homes",
    ],
    eligibility=[
        "First home buyer",
        "Property value up to $700,000–$750,000 depending on region",
        "Australian citizen or permanent resident",
        "Owner-occupier",
    ],
    summary="You pay zero or reduced stamp duty on your home purchase.",
    details=(
        "WA provides a full transfer duty exemption for first home buyers purchasing "
        "a property up to $500,000. Concessions apply up to $700,000 in Perth/Peel or "
        "$750,000 in other regions. Thresholds updated March 2025."
    ),
    rules=[
        "Full exemption up to $500,000",
        "Concession to $700,000 (Perth/Peel) or $750,000 (other regions)",
        "Thresholds updated 21 March 2025",
    ],
    financial_effect=FinancialEffect(stamp_duty_concession_fn="wa_fhb_home"),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,  # highest regional threshold
    ),
)

# ── First Home Buyer Vacant Land Exemption (WA) ─────

FHB_LAND_WA = GrantScheme(
    id="fhb-land-wa",
    name="First Home Buyer Vacant Land Exemption",
    level="State",
    state=State.WA,
    category="concession",
    benefit_pill="Exempt up to $350k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption on vacant land up to $350,000 for first home buyers in WA.",
    benefits=[
        "Full exemption for land up to $350,000",
        "Concession $350,001 – $450,000",
    ],
    eligibility=[
        "First home buyer",
        "Vacant residential land",
        "Land value up to $450,000 for any concession",
    ],
    summary="You pay zero stamp duty on vacant land to build your first home.",
    details=(
        "First home buyers in WA purchasing vacant land to build on receive a full "
        "transfer duty exemption on land valued up to $350,000, or a concessional "
        "rate on land between $350,001 and $450,000."
    ),
    rules=[
        "Full exemption up to $350,000",
        "Concession tapers from $350,001 to $450,000",
        "No concession above $450,000",
    ],
    financial_effect=FinancialEffect(stamp_duty_concession_fn="wa_fhb_land"),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=450_000,
        property_types=["land"],
    ),
)

# ── Off-the-Plan Duty Concession (WA) ───────────────
# Available to all buyers (not FHB-only). Until 30 June 2026.
# Expanded to survey-strata dwellings March 2026.

OTP_WA = GrantScheme(
    id="otp-wa",
    name="Off-the-Plan Duty Concession",
    level="State",
    state=State.WA,
    category="concession",
    benefit_pill="Up to 100% duty waiver",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Significant stamp duty reduction on off-the-plan apartment and townhouse purchases in WA.",
    benefits=[
        "Pre-construction: no duty up to $750k, 50% concession to $850k",
        "Under-construction: 75% concession up to $750k, 37.5% to $850k",
        "Expanded to townhouses/villas from March 2026",
    ],
    eligibility=[
        "Any buyer (not limited to first home buyers)",
        "Off-the-plan multi-storey or survey-strata dwelling",
        "Contracts until 30 June 2026",
    ],
    summary="You receive a significant stamp duty reduction on your off-the-plan purchase.",
    details=(
        "WA provides substantial duty concessions on off-the-plan purchases. Pre-construction "
        "purchases up to $750,000 pay no duty; under-construction purchases receive a 75% "
        "concession. The scheme has been expanded to include survey-strata dwellings "
        "(townhouses, villas) from March 2026. Available until 30 June 2026."
    ),
    rules=[
        "Pre-construction: no duty up to $750k; 50% concession $750k–$850k",
        "Under-construction: 75% concession up to $750k; 37.5% $750k–$850k",
        "Contracts must be signed by 30 June 2026",
        "Expanded to survey-strata dwellings from March 2026",
    ],
    valid_to=date(2026, 6, 30),
    predicates=EligibilityPredicates(
        first_home_buyer=None,  # available to all buyers
        owner_occupier=None,  # not restricted to owner-occupiers
        off_the_plan_only=True,
    ),
)

# ── Keystart Home Loans (WA) ────────────────────────
# Government-backed low-deposit loans, no LMI.
# Income caps updated August 2025.

KEYSTART_WA = GrantScheme(
    id="keystart-wa",
    name="Keystart Home Loans",
    level="State",
    state=State.WA,
    category="guarantee",
    benefit_pill="2% deposit, no LMI",
    meta=SchemeMeta(deposit="2%", lmi="Waived", buyer="Individual / Joint"),
    theme="Government-backed low-deposit home loans with no LMI for eligible WA buyers.",
    benefits=[
        "As little as 2% deposit",
        "No LMI required",
        "Available for new and existing homes",
    ],
    eligibility=[
        "WA resident",
        "Income cap: $148,000 (single) / $218,000 (couple/family)",
        "Property price cap: $800,000",
        "Owner-occupier",
        "Available to first home buyers and previous homeowners",
    ],
    summary="You can access a government-backed loan with 2% deposit and no LMI.",
    details=(
        "Keystart is a WA government-backed lender offering low-deposit home loans "
        "with no LMI. Deposit can be as low as 2% (genuine savings, gifts, or FHOG). "
        "Income caps: $148,000 single / $218,000 couple/family (statewide from August 2025). "
        "Property price cap: $800,000."
    ),
    rules=[
        "Income cap: $148,000 single / $218,000 couple/family",
        "Property price cap: $800,000",
        "Deposit must be genuine savings, gifts, or FHOG (not borrowed)",
        "Income caps updated August 2025 (mainstream product, statewide)",
        "Kimberley/Pilbara: $225,000 single / $285,000 couple",
    ],
    financial_effect=FinancialEffect(lmi_waiver=True, min_deposit_percent=0.02),
    predicates=EligibilityPredicates(
        owner_occupier=True,
        max_income_single=148_000,
        max_income_couple=218_000,
        max_income_by_region={
            "Kimberley": (225_000, 285_000),
            "Pilbara": (225_000, 285_000),
        },
        max_price=800_000,
    ),
)

# ── All WA schemes ───────────────────────────────────

WA_SCHEMES: list[GrantScheme] = [
    FHOG_WA, FHB_STAMP_WA, FHB_LAND_WA, OTP_WA, KEYSTART_WA,
]
