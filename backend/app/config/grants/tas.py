"""
TASMANIA HOME BUYER SCHEMES

Sources:
- SRO Tasmania: sro.tas.gov.au
- Homes Tasmania: homestasmania.com.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── First Home Owner Grant (TAS) ─────────────────────
# $30,000 from 1 July 2025 to 30 June 2026. No price cap.

FHOG_TAS = GrantScheme(
    id="fhog-tas",
    name="First Home Owner Grant",
    level="State",
    state=State.TAS,
    category="grant",
    benefit_pill="$30,000 grant",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="A $30,000 grant for first home buyers purchasing or building a new home in Tasmania.",
    benefits=[
        "$30,000 cash grant (1 Jul 2025 – 30 Jun 2026)",
        "No property value cap",
    ],
    eligibility=[
        "First home buyer",
        "New home (never previously sold or lived in)",
        "Australian citizen or permanent resident",
        "Owner-occupier",
    ],
    summary="You qualify for a $30,000 grant towards your new home.",
    details=(
        "The Tasmanian FHOG was tripled from $10,000 to $30,000 for eligible "
        "transactions from 1 July 2025 to 30 June 2026. There is no property value "
        "cap. Applies to houses, units, townhouses, duplexes, off-the-plan, kit homes, "
        "and owner-builder new builds."
    ),
    rules=[
        "Must be a new home never previously sold or lived in",
        "$30,000 amount applies 1 Jul 2025 – 30 Jun 2026",
        "No property value cap",
        "Cannot have previously received FHOG in any state",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        property_type="new",
    ),
)

# ── First Home Buyer Stamp Duty Exemption (TAS) ─────
# 100% exemption for established homes up to $750k.
# Settlements 18 Feb 2024 – 30 June 2026.

FHB_STAMP_TAS = GrantScheme(
    id="fhb-stamp-tas",
    name="First Home Buyer Duty Exemption",
    level="State",
    state=State.TAS,
    category="concession",
    benefit_pill="Full exemption up to $750k",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for first home buyers on established homes up to $750,000.",
    benefits=[
        "100% stamp duty exemption",
        "Applies to established homes up to $750,000",
        "Valid for settlements 18 Feb 2024 – 30 Jun 2026",
    ],
    eligibility=[
        "First home buyer",
        "Established home valued at $750,000 or less",
        "Australian citizen or permanent resident",
        "Owner-occupier",
    ],
    summary="You pay zero stamp duty on your established home purchase.",
    details=(
        "Tasmania provides a 100% stamp duty exemption for first home buyers purchasing "
        "an established home valued at $750,000 or less. This replaced the previous 50% "
        "discount scheme from 18 February 2024. Properties above $750,000 pay full duty "
        "— there is no sliding scale."
    ),
    rules=[
        "100% exemption at $750,000 or less — hard cutoff, no taper",
        "Properties above $750,000 pay full duty",
        "Applies to settlements 18 Feb 2024 – 30 Jun 2026",
        "Replaces the previous 50% discount scheme",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
        max_price=750_000,
    ),
)

# ── MyHome Shared Equity (TAS) ───────────────────────
# Expanded November 2025.

MYHOME_TAS = GrantScheme(
    id="myhome-tas",
    name="MyHome Shared Equity",
    level="State",
    state=State.TAS,
    category="equity",
    benefit_pill="Up to 40% equity",
    meta=SchemeMeta(deposit="2%", lmi="Waived", buyer="Individual / Joint"),
    theme="Government shared equity scheme — up to $300,000 or 40% of the property value.",
    benefits=[
        "Government contributes up to $300,000 or 40% (whichever is less)",
        "As little as 2% deposit",
        "No LMI on shared equity portion",
    ],
    eligibility=[
        "Income cap: $116,934 (single) / $134,475 (couple)",
        "Property cap: $800,000 (new construction)",
        "First home buyers or those who don't currently own",
        "Available through Bank of us only",
    ],
    summary="The government contributes up to 40% equity, reducing your loan.",
    details=(
        "MyHome is a Tasmanian shared equity scheme operated through Homes Tasmania "
        "and Bank of us. The government contributes up to $300,000 or 40% of the property "
        "value (whichever is less). Expanded in November 2025 with higher income limits "
        "(increased 25%) and a raised construction cap of $800,000."
    ),
    rules=[
        "Income caps: $116,934 single / $134,475 couple (from Nov 2025)",
        "Property cap: $800,000 for new construction",
        "Only available through Bank of us (not mortgage brokers)",
        "Equity contribution up to $300,000 or 40% (whichever is less)",
    ],
    predicates=EligibilityPredicates(
        owner_occupier=True,
        max_income_single=116_934,
        max_income_couple=134_475,
        max_price=800_000,
    ),
)

# ── Off-the-Plan Duty Concession (TAS) ──────────────
# 50% stamp duty discount on off-the-plan strata.
# Until 30 June 2026. All buyers.

OTP_TAS = GrantScheme(
    id="otp-tas",
    name="Off-the-Plan Duty Concession",
    level="State",
    state=State.TAS,
    category="concession",
    benefit_pill="50% duty discount",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="50% stamp duty discount on off-the-plan strata property purchases up to $750,000.",
    benefits=[
        "50% stamp duty discount",
        "Off-the-plan strata properties up to $750,000",
        "Available to all buyers (not FHB-restricted)",
    ],
    eligibility=[
        "Any buyer",
        "Off-the-plan strata property",
        "Property value up to $750,000",
        "Contracts until 30 June 2026",
    ],
    summary="You receive a 50% stamp duty discount on your off-the-plan purchase.",
    details=(
        "Tasmania offers a 50% stamp duty discount on off-the-plan strata property "
        "purchases valued at up to $750,000. Available to all buyers, not just first "
        "home buyers. Runs until 30 June 2026."
    ),
    rules=[
        "50% discount on stamp duty",
        "Off-the-plan strata properties only",
        "Property value up to $750,000",
        "Contracts must settle by 30 June 2026",
    ],
    predicates=EligibilityPredicates(
        first_home_buyer=None,
        owner_occupier=None,
        off_the_plan_only=True,
        max_price=750_000,
    ),
)

# ── All TAS schemes ──────────────────────────────────

TAS_SCHEMES: list[GrantScheme] = [FHOG_TAS, FHB_STAMP_TAS, MYHOME_TAS, OTP_TAS]
