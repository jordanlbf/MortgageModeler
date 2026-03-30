"""
AUSTRALIAN CAPITAL TERRITORY HOME BUYER SCHEMES

The ACT abolished its FHOG on 1 July 2019 and replaced it with
the Home Buyer Concession Scheme (stamp duty exemption).

Sources:
- ACT Revenue Office: revenue.act.gov.au
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta, State

# ── Home Buyer Concession Scheme (ACT) ──────────────
# Not restricted to first home buyers — just must not
# have owned property in last 2 years.
# Income threshold significantly raised from 2024-25.

HBCS_ACT = GrantScheme(
    id="hbcs-act",
    name="Home Buyer Concession Scheme",
    level="State",
    state=State.ACT,
    category="concession",
    benefit_pill="Full duty exemption",
    meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Individual / Joint"),
    theme="Full stamp duty exemption for eligible home buyers in the ACT — up to $1,020,000.",
    benefits=[
        "Full exemption for properties up to $1,020,000",
        "Concessional rate $1,020,001 – $1,455,000 (max saving $35,238)",
        "Not restricted to first home buyers",
        "Applies to new and existing homes",
    ],
    eligibility=[
        "Must not have owned property in Australia in the last 2 years",
        "Household income under $250,000 (plus $4,600 per dependent child)",
        "Australian citizen or permanent resident",
        "Owner-occupier (live in for at least 1 year)",
    ],
    summary="You pay zero or reduced stamp duty on your home purchase.",
    details=(
        "The ACT Home Buyer Concession Scheme replaced the FHOG (abolished July 2019). "
        "It provides a full stamp duty exemption on properties up to $1,020,000 and "
        "concessional rates up to $1,455,000 (max saving $35,238). Unlike most states, "
        "this is not restricted to first home buyers — you just must not have owned "
        "property in Australia in the past 2 years. Income threshold is $250,000 "
        "household (2025-26), plus $4,600 per dependent child."
    ),
    rules=[
        "Full exemption up to $1,020,000 (2025-26)",
        "Concessional rates $1,020,001 – $1,455,000",
        "Must not have owned property in Australia in the last 2 years",
        "Household income threshold: $250,000 (+ $4,600 per dependent child — not checked here)",
        "Must live in the property for at least 1 year",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=None,  # not restricted to FHB — must not have owned in last 2 years
        owner_occupier=True,
        max_price=1_455_000,
        max_income_single=250_000,
        max_income_couple=250_000,
    ),
)

# ── All ACT schemes ──────────────────────────────────
# No FHOG in ACT (abolished 1 July 2019).

ACT_SCHEMES: list[GrantScheme] = [HBCS_ACT]
