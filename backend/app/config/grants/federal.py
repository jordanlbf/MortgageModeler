"""
FEDERAL GOVERNMENT HOME BUYER SCHEMES

Schemes administered by Housing Australia and the ATO that apply
nationally. From October 2025 the FHBG has unlimited places and
higher price caps; the RFHBG was merged into the FHBG.

Sources:
- Housing Australia: housingaustralia.gov.au
- ATO (FHSS): ato.gov.au/individuals/super/withdrawing-and-using-your-super/first-home-super-saver-scheme
Verified: March 2026
"""

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta

# ── First Home Guarantee (FHBG) ─────────────────────
# From Oct 2025: unlimited places, income caps removed,
# price caps raised (not removed) — e.g. Sydney $1.5M,
# Melbourne $950k, Brisbane $1M.
# The Regional FHBG was merged into this scheme Oct 2025.

FHBG = GrantScheme(
    id="fhbg",
    name="First Home Guarantee",
    level="Federal",
    state=None,
    category="guarantee",
    benefit_pill="No LMI with 5% deposit",
    meta=SchemeMeta(deposit="5%", lmi="Waived", buyer="Individual / Joint"),
    theme="Purchase with as little as 5% deposit without paying Lenders Mortgage Insurance.",
    benefits=[
        "No LMI required with 5% deposit",
        "Unlimited places (from Oct 2025)",
        "No income caps (from Oct 2025)",
        "Higher property price caps by region",
    ],
    eligibility=[
        "Australian citizen or permanent resident",
        "First home buyer",
        "Owner-occupier",
        "Individual or joint application",
    ],
    summary="You can purchase with 5% deposit and avoid LMI.",
    details=(
        "The First Home Guarantee allows eligible first home buyers to purchase a "
        "property with a deposit as low as 5% without needing to pay Lenders Mortgage "
        "Insurance. The government guarantees the remaining deposit gap up to 15%. "
        "From October 2025 places are unlimited, income caps have been removed, and "
        "property price caps have been significantly raised (e.g. Sydney $1.5M, "
        "Melbourne $950k, Brisbane $1M). The former Regional First Home Buyer "
        "Guarantee has been merged into this scheme."
    ),
    rules=[
        "Must use a participating lender",
        "Property must be owner-occupied within 12 months",
        "Cannot currently own property in Australia",
        "Property price caps vary by region (raised Oct 2025, not removed — not checked here)",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
        owner_occupier=True,
    ),
)

# ── Family Home Guarantee (FHG) ──────────────────────

FHG = GrantScheme(
    id="fhg",
    name="Family Home Guarantee",
    level="Federal",
    state=None,
    category="guarantee",
    benefit_pill="2% deposit, no LMI",
    meta=SchemeMeta(deposit="2%", lmi="Waived", buyer="Individual only"),
    theme="Single parents or eligible single guardians can purchase with as little as 2% deposit without LMI.",
    benefits=[
        "Purchase with 2% deposit",
        "No LMI required",
        "Available for new and existing homes",
    ],
    eligibility=[
        "Single parent or legal guardian of at least one dependent",
        "Australian citizen or permanent resident",
        "Owner-occupier",
        "Individual application only",
        "Not restricted to first home buyers",
        "Note: single parent status not verified by this tool",
    ],
    summary="As a single parent, you can purchase with just 2% deposit and no LMI.",
    details=(
        "The Family Home Guarantee supports eligible single parents or single legal "
        "guardians to buy a home with as little as 2% deposit without paying LMI. "
        "The government guarantees up to 18% of the property value. Available for "
        "both new and existing homes. Not restricted to first home buyers."
    ),
    rules=[
        "Must be a single parent or legal guardian with at least one dependent",
        "Individual application only — not available for joint applications",
        "Limited places per financial year",
        "Must use a participating lender",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        owner_occupier=True,
        individual_only=True,
        single_parent_required=True,
    ),
)

# ── Help to Buy (Shared Equity) ──────────────────────
# Launched 5 December 2025. Two participating lenders
# at launch (Bank Australia, CBA), more joining 2026.

HELP_TO_BUY = GrantScheme(
    id="help-to-buy",
    name="Help to Buy",
    level="Federal",
    state=None,
    category="equity",
    benefit_pill="Up to 40% equity",
    meta=SchemeMeta(deposit="2%", lmi="Waived", buyer="Individual / Joint"),
    theme="The government contributes up to 40% of a new home's price as an equity partner, reducing your loan.",
    benefits=[
        "Up to 40% equity for new builds, 30% for existing",
        "As little as 2% deposit required",
        "Lower loan repayments",
    ],
    eligibility=[
        "Australian citizen (18+)",
        "Income cap: $100,000 (single) / $160,000 (couple)",
        "Owner-occupier",
        "Must not currently own property",
    ],
    summary="The government co-owns up to 40%, reducing your loan and repayments.",
    details=(
        "Help to Buy is a shared equity scheme launched in December 2025 where the "
        "government contributes up to 40% of a new home's purchase price (or 30% for "
        "existing homes) as an equity partner. This reduces the size of your home loan "
        "and repayments. You can buy back the government's share over time or when you "
        "sell. 10,000 places per year, up to 40,000 over four years."
    ),
    rules=[
        "Income cap: $100,000 individual / $160,000 couple",
        "Must not currently own property",
        "Government equity must be repaid on sale or can be bought back progressively",
        "10,000 places per year",
        "Property price caps apply (vary by state/region)",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        owner_occupier=True,
        max_income_single=100_000,
        max_income_couple=160_000,
    ),
)

# ── First Home Super Saver (FHSS) ───────────────────
# Determination must be requested before settlement
# (changed Sep 2024, previously before contract signing).

FHSS = GrantScheme(
    id="fhss",
    name="First Home Super Saver (FHSS)",
    level="Federal",
    state=None,
    category="super",
    benefit_pill="Up to $50k from super",
    meta=SchemeMeta(deposit="N/A", lmi="N/A", buyer="Individual"),
    theme="Withdraw voluntary super contributions for a home deposit, taxed at a lower rate than saving outside super.",
    benefits=[
        "Withdraw up to $50,000 in voluntary contributions",
        "Tax advantage: contributions taxed at 15% vs marginal rate",
        "Withdrawal tax: marginal rate minus 30% offset",
    ],
    eligibility=[
        "First home buyer",
        "Australian citizen or permanent resident",
        "Must have made voluntary super contributions",
        "Must not have previously owned property",
    ],
    summary="You can withdraw voluntary super contributions at a tax advantage for your deposit.",
    details=(
        "The First Home Super Saver scheme lets you withdraw voluntary super "
        "contributions (up to $50,000) to put towards a home deposit. Contributions "
        "are taxed at 15% going in (vs your marginal rate), and withdrawals are taxed "
        "at your marginal rate minus a 30% offset, making it more tax-efficient than "
        "saving outside super."
    ),
    rules=[
        "Maximum $15,000 in voluntary contributions per financial year count towards FHSS",
        "Total withdrawable amount capped at $50,000",
        "Must request an ATO determination before settlement (changed Sep 2024)",
        "12 months to sign a contract after requesting release, with automatic 12-month extension",
    ],
    predicates=EligibilityPredicates(
        citizen_required=True,
        first_home_buyer=True,
    ),
)

# ── All federal schemes ──────────────────────────────

FEDERAL_SCHEMES: list[GrantScheme] = [FHBG, FHG, HELP_TO_BUY, FHSS]
