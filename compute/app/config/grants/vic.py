"""
VICTORIA HOME BUYER SCHEMES

Sources:
- SRO Victoria: sro.vic.gov.au
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
    financial_effect=FinancialEffect(cash_grant=10_000),
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
        property_types=["new"],
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
    financial_effect=FinancialEffect(stamp_duty_concession_fn="vic_fhb_home"),
    predicates=EligibilityPredicates(
        citizen_required=True,
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
    benefit_pill="Reduced OTP duty",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Stamp duty reduced by excluding post-contract construction costs on off-the-plan strata purchases.",
    benefits=[
        "Construction costs after contract date excluded from dutiable value",
        "Applies to off-the-plan strata apartments and townhouses",
        "Available to all buyers — no value cap",
    ],
    eligibility=[
        "Any buyer (including investors, companies, trusts)",
        "Off-the-plan strata apartment or townhouse",
        "Contracts signed 21 Oct 2024 – 20 Oct 2026",
    ],
    summary="You pay stamp duty on a reduced value excluding post-contract construction costs.",
    details=(
        "Victoria's temporary off-the-plan concession reduces the dutiable value by "
        "excluding construction costs incurred after the contract date. Applies to "
        "off-the-plan strata apartments and townhouses. No property value cap. "
        "Available to all buyers. Contracts must be signed between 21 October 2024 "
        "and 20 October 2026."
    ),
    rules=[
        "Post-contract construction costs excluded from dutiable value",
        "Off-the-plan strata dwellings only (apartments, townhouses)",
        "No property value cap",
        "Contracts signed 21 Oct 2024 – 20 Oct 2026",
    ],
    valid_from=date(2024, 10, 21),
    valid_to=date(2026, 10, 20),
    predicates=EligibilityPredicates(
        first_home_buyer=None,
        owner_occupier=None,
        off_the_plan_only=True,
    ),
)

# ── All VIC schemes ──────────────────────────────────
# Victorian Homebuyer Fund (shared equity) is CLOSED
# as of 2025-26, replaced by federal Help to Buy.

VIC_SCHEMES: list[GrantScheme] = [FHOG_VIC, FHB_STAMP_VIC, OTP_VIC]
