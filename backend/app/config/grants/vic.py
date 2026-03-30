"""
VICTORIA HOME BUYER SCHEMES

Sources:
- SRO Victoria: sro.vic.gov.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── First Home Owner Grant (VIC) ─────────────────────

FHOG_VIC = GrantScheme(
    id="fhog-vic",
    name="First Home Owner Grant",
    level="State",
    state=State.VIC,
    category="grant",
    benefit_pill="$10,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $10,000 grant for first home buyers purchasing or building a new home in Victoria.",
    benefits=[
        "$10,000 cash grant (metro and regional)",
        "Applied at settlement or on completion",
    ],
    eligibility=[
        "First home buyer",
        "New home (never previously sold, occupied, or leased)",
        "Property value up to $750,000",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for 12 continuous months within first year)",
    ],
    summary="You qualify for a $10,000 grant towards your new home.",
    details=(
        "The Victorian FHOG provides $10,000 to eligible first home buyers purchasing "
        "or building a new home valued up to $750,000. The same amount applies in both "
        "metropolitan Melbourne and regional Victoria (the previous $20,000 regional "
        "bonus ended in June 2021)."
    ),
    rules=[
        "Must be a new home never previously sold, occupied, or leased",
        "Property value cap $750,000",
        "Must live in the property for 12 continuous months within the first year",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        property_type="new",
    ),
)

# ── First Home Buyer Stamp Duty Exemption (VIC) ─────
# Thresholds unchanged since July 2017.

FHB_STAMP_VIC = GrantScheme(
    id="fhb-stamp-vic",
    name="First Home Buyer Duty Exemption",
    level="State",
    state=State.VIC,
    category="concession",
    benefit_pill="Exempt up to $600k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for first home buyers on properties up to $600,000.",
    benefits=[
        "Full exemption for properties up to $600,000",
        "Sliding concession $600,001 – $750,000",
        "Applies to new and existing homes",
    ],
    eligibility=[
        "First home buyer",
        "Property value up to $750,000 for any concession",
        "Australian citizen or permanent resident",
        "Owner-occupier (move in within 12 months, live there 12 months)",
    ],
    summary="You pay zero stamp duty on your home purchase.",
    details=(
        "Victoria provides a full stamp duty exemption for first home buyers purchasing "
        "a property valued up to $600,000. Properties between $600,001 and $750,000 "
        "receive a sliding concession. No concession applies above $750,000. These "
        "thresholds have been unchanged since July 2017."
    ),
    rules=[
        "Full exemption up to $600,000",
        "Sliding concession $600,001 to $750,000",
        "No concession above $750,000",
        "Thresholds effective from 1 July 2017",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
    ),
)

# ── Off-the-Plan Duty Concession (VIC) ──────────────
# 100% of outstanding construction costs deducted from
# dutiable value. Extended to October 2026. All buyers.

OTP_VIC = GrantScheme(
    id="otp-vic",
    name="Off-the-Plan Duty Concession",
    level="State",
    state=State.VIC,
    category="concession",
    benefit_pill="Up to ~$28k saved",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Stamp duty reduction on off-the-plan purchases — construction costs deducted from dutiable value.",
    benefits=[
        "100% of outstanding construction costs deducted from dutiable value",
        "Savings of up to ~$28,000 on a typical apartment",
        "Available to all buyers (not FHB-restricted)",
    ],
    eligibility=[
        "Any buyer (including investors)",
        "Off-the-plan purchase",
        "Extended to October 2026",
    ],
    summary="You pay reduced stamp duty on your off-the-plan purchase.",
    details=(
        "Victoria's off-the-plan duty concession deducts 100% of outstanding "
        "construction costs from the dutiable value. Can save approximately $28,000 "
        "on a $620,000 apartment. Available to all buyers including investors, "
        "companies, and trusts. Extended to October 2026."
    ),
    rules=[
        "100% of outstanding construction costs deducted",
        "Available to all buyers including investors",
        "Extended to October 2026",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=None,
        owner_occupier=None,
    ),
)

# ── All VIC schemes ──────────────────────────────────
# Victorian Homebuyer Fund (shared equity) is CLOSED
# as of 2025-26, replaced by federal Help to Buy.

VIC_SCHEMES: list[GrantScheme] = [FHOG_VIC, FHB_STAMP_VIC, OTP_VIC]
