"""
An independent rebuild of the buy vs rentvest comparison, for verification.

Written from the rules, in plain Python, importing nothing from the app. Every
rate and threshold is typed in here by hand, so a wrong figure in the app's
config, or a wiring mistake between its layers, shows up as a mismatch when
the two are reconciled year by year (see test_reference_reconciliation.py).

Where the app makes a modelling choice rather than applying a published rule,
this model follows the same choice so the two can be compared, and says so
with "Model convention". Those choices are listed in MODEL_CONVENTIONS.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date

MODEL_CONVENTIONS = [
    "Interest compounds daily inside each month: monthly rate = (1 + annual/365)^(365/12) - 1.",
    "A projection year is the 12 repayments from purchase, not a financial year.",
    "Building depreciation is the exception: it is prorated by days held in a financial year, and "
    "projection year 0 is the financial year the purchase falls in.",
    "Building depreciation's 40 years are counted from the construction start date (the ATO counts "
    "from completion, which isn't known).",
    "Tax brackets, Medicare and HECS thresholds stay at 2026-27 levels for the whole projection; "
    "the Medicare low-income thresholds are 2025-26's, the latest published.",
    "The 50% CGT discount applies to the whole gain, though the ATO says it changes from 1 July 2027.",
    "Borrowing costs are deducted in equal parts over the lesser of 5 years and the loan term.",
    "Spare cash earns no return. Selling costs are ignored.",
    "Purchase fees are flat estimates: $2,000 legal, $600 building and pest, QLD registration fees.",
    "Lenders mortgage insurance is a rough estimate by LVR band, 15% higher for investors, added to the loan.",
    "The property's value in a year's costs is its start-of-year value; equity uses its end-of-year value.",
    "A sale is dated 365 days times the years held after purchase, so one year held gets no CGT discount.",
]

# ── Published rates, 2026-27 (ato.gov.au, 11 Nov 2026) ──

# Resident income tax: (upper limit, rate on the slice below it).
TAX_SLICES = [(18_200, 0.0), (45_000, 0.15), (135_000, 0.30), (190_000, 0.37), (math.inf, 0.45)]

# Low income tax offset: $700, less 5c per $1 over $37,500, then $325 less 1.5c per $1 over $45,000.
LITO_FULL, LITO_MID, LITO_END = 37_500, 45_000, 66_667

MEDICARE_RATE = 0.02
MEDICARE_LOW = 28_011
MEDICARE_SHADE_END = 35_013

# Medicare levy surcharge, singles: (income up to, rate on the whole income).
MLS_TIERS = [(105_000, 0.0), (123_000, 0.01), (164_000, 0.0125), (math.inf, 0.015)]

HELP_FLOOR = 69_528
HELP_MID = 129_717
HELP_MID_BASE = 9_028
HELP_TOP = 186_050

# Queensland transfer duty: (price up to, duty at the band's start, rate per $1 over the start).
QLD_GENERAL = [
    (5_000, 0.0, 0.0),
    (75_000, 0.0, 0.015),
    (540_000, 1_050.0, 0.035),
    (1_000_000, 17_325.0, 0.045),
    (math.inf, 38_025.0, 0.0575),
]
QLD_HOME = [(350_000, 0.0, 0.01), (540_000, 3_500.0, 0.035), (1_000_000, 10_150.0, 0.045), (math.inf, 30_850.0, 0.0575)]

DIV43_RATE = 0.025
DIV43_YEARS = 40
DIV43_FIRST_ELIGIBLE = date(1987, 9, 16)

# ── Model conventions: fee estimates ─────────────

LEGAL_FEES = 2_000.0
BUILDING_PEST = 600.0
QLD_TITLE_FEE = 238.14
QLD_TITLE_FEE_FROM = 180_000
QLD_TITLE_FEE_PER_10K = 44.71
MORTGAGE_REGISTRATION = 238.14
LOAN_ESTABLISHMENT = 300.0
LMI_BANDS = [(0.80, 0.0), (0.85, 0.011), (0.90, 0.02), (0.95, 0.045), (1.00, 0.06)]
LMI_INVESTOR_LOADING = 1.15


# ── Tax ──────────────────────────────────────────


def income_tax(taxable: float) -> float:
    tax, floor = 0.0, 0.0
    for ceiling, rate in TAX_SLICES:
        if taxable <= floor:
            break
        tax += (min(taxable, ceiling) - floor) * rate
        floor = ceiling
    return tax


def lito(taxable: float) -> float:
    if taxable <= LITO_FULL:
        return 700.0
    if taxable <= LITO_MID:
        return 700 - 0.05 * (taxable - LITO_FULL)
    if taxable <= LITO_END:
        return max(0.0, 325 - 0.015 * (taxable - LITO_MID))
    return 0.0


def medicare_levy(taxable: float) -> float:
    if taxable <= MEDICARE_LOW:
        return 0.0
    if taxable < MEDICARE_SHADE_END:
        return (taxable - MEDICARE_LOW) * 0.10
    return taxable * MEDICARE_RATE


def medicare_surcharge(mls_income: float, private_health: bool) -> float:
    if private_health:
        return 0.0
    for ceiling, rate in MLS_TIERS:
        if mls_income <= ceiling:
            return mls_income * rate
    raise AssertionError("unreachable")


def help_repayment(repayment_income: float, balance: float) -> float:
    if repayment_income <= HELP_FLOOR:
        owing = 0.0
    elif repayment_income <= HELP_MID:
        owing = 0.15 * (repayment_income - HELP_FLOOR)
    elif repayment_income <= HELP_TOP:
        owing = HELP_MID_BASE + 0.17 * (repayment_income - HELP_MID)
    else:
        owing = 0.10 * repayment_income
    return min(owing, balance)


@dataclass
class Taxpayer:
    taxable: float
    repayment: float
    mls: float
    help_balance: float
    private_health: bool

    def plus(self, taxable: float, other: float) -> Taxpayer:
        """The same person with extra taxable income, and extra income for the HELP and surcharge tests."""
        return Taxpayer(
            self.taxable + taxable, self.repayment + other, self.mls + other, self.help_balance, self.private_health
        )


def total_tax(p: Taxpayer) -> float:
    return (
        max(0.0, income_tax(p.taxable) - lito(p.taxable))
        + medicare_levy(p.taxable)
        + medicare_surcharge(p.mls, p.private_health)
        + help_repayment(p.repayment, p.help_balance)
    )


# ── Purchase ─────────────────────────────────────


def qld_duty(price: float, home: bool) -> float:
    if price <= 0:
        return 0.0
    floor = 0.0
    for ceiling, base, rate in QLD_HOME if home else QLD_GENERAL:
        if price <= ceiling:
            # Charged per $100 or part of $100.
            return base + rate * math.ceil((price - floor) / 100) * 100
        floor = ceiling
    raise AssertionError("unreachable")


def title_fee(price: float) -> float:
    if price <= QLD_TITLE_FEE_FROM:
        return QLD_TITLE_FEE
    return QLD_TITLE_FEE + math.ceil((price - QLD_TITLE_FEE_FROM) / 10_000) * QLD_TITLE_FEE_PER_10K


def lmi(loan: float, lvr: float, investor: bool) -> float:
    for ceiling, rate in LMI_BANDS:
        if lvr <= ceiling:
            return loan * rate * (LMI_INVESTOR_LOADING if investor else 1.0)
    return 0.0


# ── Loan ─────────────────────────────────────────


@dataclass
class Month:
    interest: float
    principal: float
    balance: float
    offset: float


def loan_months(
    principal: float, annual_rate: float, years: int, offset: float, offset_added: float, extra: float
) -> list[Month]:
    """Month-by-month principal and interest loan with an offset account."""
    n = years * 12
    r = (1 + annual_rate / 365) ** (365 / 12) - 1
    repayment = principal / n if annual_rate <= 0 else principal * r * (1 + r) ** n / ((1 + r) ** n - 1)
    months: list[Month] = []
    balance = principal
    for m in range(n):
        if m > 0:
            offset += offset_added
        if balance <= 0:
            months.append(Month(0.0, 0.0, 0.0, offset))
            continue
        interest = max(balance - offset, 0.0) * r
        paid = repayment - interest + extra
        if paid >= balance - 0.005:
            paid = balance
        balance -= paid
        months.append(Month(interest, paid, balance, offset))
    return months


# ── Depreciation ─────────────────────────────────


def div43(cost: float, built: date, bought: date, year: int) -> float:
    """Capital works deduction for the `year`th financial year from the one the purchase falls in."""
    if cost <= 0 or built < DIV43_FIRST_ELIGIBLE:
        return 0.0
    # A financial year runs 1 July to 30 June; a purchase from January to June is in the one ending that June.
    first_start = bought.year if bought.month >= 7 else bought.year - 1
    fy_start = date(first_start + year, 7, 1)
    fy_after = date(first_start + year + 1, 7, 1)
    fy_days = (fy_after - fy_start).days
    held = min((fy_after - bought).days, fy_days)
    # 2.5% a year for 40 years from construction, whoever owns it.
    expiry = built.replace(year=built.year + DIV43_YEARS)
    if expiry < fy_start:
        return 0.0
    if expiry < fy_after:
        held = min(held, (expiry - fy_start).days)
    return cost * DIV43_RATE * max(held, 0) / fy_days


# ── The projection ───────────────────────────────


@dataclass
class Inputs:
    income: float
    price: float
    deposit: float
    rate: float
    term: int
    years: int
    growth: float
    rent_paid: float
    rent_received: float
    purchase_date: date = date(2026, 7, 1)
    income_growth: float = 0.03
    help_balance: float = 0.0
    help_indexation: float = 0.03
    private_health: bool = False
    council: float = 0.0
    water: float = 0.0
    insurance: float = 0.0
    strata: float = 0.0
    maintenance_rate: float = 0.01
    cost_growth: float = 0.03
    landlord_insurance: float = 0.0
    management_rate: float = 0.0
    rent_growth: float = 0.03
    rent_paid_growth: float = 0.03
    vacancy_weeks: int = 2
    offset: float = 0.0
    offset_added: float = 0.0
    extra_repayment: float = 0.0
    construction_cost: float = 0.0
    construction_start: date | None = None


@dataclass
class Year:
    salary: float
    tax: float
    help_repaid: float
    help_balance: float
    interest: float
    repayments: float
    costs: float
    offset_added: float
    rent_paid: float
    rent_received: float
    deductions: float
    net_rental: float
    tax_saving: float
    net: float
    cumulative: float
    value: float
    loan: float
    offset: float
    cgt_if_sold: float

    @property
    def equity(self) -> float:
        return self.value - self.loan

    @property
    def wealth(self) -> float:
        return self.equity + self.cumulative + self.offset


@dataclass
class Scenario:
    stamp_duty: float
    purchase_costs: float
    borrowing_costs: float
    loan: float
    years: list[Year] = field(default_factory=list)

    @property
    def wealth_after_cgt(self) -> list[float]:
        return [y.wealth - y.cgt_if_sold for y in self.years]


def project(i: Inputs, investor: bool) -> Scenario:
    """One strategy: buy to live in (`investor=False`), or rent and buy it as an investment."""
    duty = qld_duty(i.price, home=not investor)
    purchase_costs = duty + LEGAL_FEES + BUILDING_PEST + title_fee(i.price)

    base_loan = max(i.price - i.deposit, 0.0)
    lvr = base_loan / i.price if i.price > 0 else 0.0
    borrowing = lmi(base_loan, lvr, investor) + MORTGAGE_REGISTRATION + LOAN_ESTABLISHMENT
    # Model convention: borrowing costs are added to the loan, so only purchase costs are paid in cash.
    loan = base_loan + borrowing
    months = loan_months(loan, i.rate, i.term, i.offset, i.offset_added, i.extra_repayment)

    out = Scenario(duty, purchase_costs, borrowing, loan)
    cumulative = -purchase_costs
    help_balance = i.help_balance
    offset = i.offset
    spread = min(5, i.term)
    depreciation_claimed = 0.0

    for y in range(i.years):
        rows = months[y * 12 : (y + 1) * 12]
        interest = sum(m.interest for m in rows)
        repayments = interest + sum(m.principal for m in rows)
        closing_loan = rows[-1].balance if rows else 0.0
        closing_offset = rows[-1].offset if rows else offset
        added = closing_offset - offset if rows else 0.0

        salary = i.income * (1 + i.income_growth) ** y
        help_balance *= 1 + i.help_indexation
        person = Taxpayer(salary, salary, salary, help_balance, i.private_health)
        tax = total_tax(person)

        inflation = (1 + i.cost_growth) ** y
        start_value = i.price * (1 + i.growth) ** y
        costs = (i.council + i.water + i.insurance + i.strata) * inflation + start_value * i.maintenance_rate

        rent_received = rent_paid = deductions = net_rental = saving = 0.0
        if investor:
            rent_received = i.rent_received * (52 - i.vacancy_weeks) * (1 + i.rent_growth) ** y
            costs += i.landlord_insurance * inflation + rent_received * i.management_rate
            rent_paid = i.rent_paid * 52 * (1 + i.rent_paid_growth) ** y
            depreciation = div43(i.construction_cost, i.construction_start or i.purchase_date, i.purchase_date, y)
            depreciation_claimed += depreciation
            borrowing_claim = (
                (borrowing if y == 0 else 0.0) if borrowing <= 100 else (borrowing / spread if y < spread else 0.0)
            )
            deductions = interest + costs + depreciation + borrowing_claim
            net_rental = rent_received - deductions
            # A loss lowers taxable income only; a profit also counts for HELP and the surcharge.
            with_property = person.plus(net_rental, max(net_rental, 0.0))
            saving = tax - total_tax(with_property)
            help_repaid = help_repayment(with_property.repayment, help_balance)
        else:
            help_repaid = help_repayment(person.repayment, help_balance)
        help_balance -= help_repaid

        net = (salary - tax) + rent_received + saving - repayments - costs - rent_paid - added
        cumulative += net
        offset = closing_offset

        cgt = 0.0
        if investor:
            held = y + 1
            # Capital works deductions can't stay in the cost base (property bought after 13 May 1997).
            cost_base = i.price + purchase_costs - depreciation_claimed
            gain = i.price * (1 + i.growth) ** held - cost_base
            if gain > 0 and held * 365 > 365:
                gain *= 0.5
            gain = max(gain, 0.0)
            later = i.income * (1 + i.income_growth) ** held
            seller = Taxpayer(later, later, later, help_balance, i.private_health)
            cgt = total_tax(seller.plus(gain, gain)) - total_tax(seller)

        out.years.append(
            Year(
                salary=salary,
                tax=tax,
                help_repaid=help_repaid,
                help_balance=help_balance,
                interest=interest,
                repayments=repayments,
                costs=costs,
                offset_added=added,
                rent_paid=rent_paid,
                rent_received=rent_received,
                deductions=deductions,
                net_rental=net_rental,
                tax_saving=saving,
                net=net,
                cumulative=cumulative,
                value=i.price * (1 + i.growth) ** (y + 1),
                loan=closing_loan,
                offset=closing_offset,
                cgt_if_sold=cgt,
            )
        )
    return out


@dataclass
class Comparison:
    ppor: Scenario
    rentvest: Scenario
    gap: list[float]
    winner: str
    difference: float
    break_even_year: int | None


def compare(i: Inputs) -> Comparison:
    ppor = project(i, investor=False)
    rentvest = project(i, investor=True)
    gap = [p.wealth - r for p, r in zip(ppor.years, rentvest.wealth_after_cgt)]
    flips = [
        n for n in range(1, len(gap)) if (gap[0] > 0 >= gap[n]) or (gap[0] < 0 <= gap[n]) or (gap[0] == 0 != gap[n])
    ]
    return Comparison(
        ppor=ppor,
        rentvest=rentvest,
        gap=gap,
        winner="ppor" if gap[-1] >= 0 else "rentvesting",
        difference=abs(gap[-1]),
        break_even_year=flips[0] if flips else None,
    )


def to_request(i: Inputs) -> dict:
    """The API request describing the same buyer."""
    return {
        "tax_profile": {
            "taxable_income": i.income,
            "hecs_balance": i.help_balance,
            "has_private_health": i.private_health,
            "income_growth_rate": i.income_growth,
            "hecs_indexation_rate": i.help_indexation,
        },
        "property": {
            "purchase_price": i.price,
            "purchase_date": i.purchase_date.isoformat(),
            "is_new_property": False,
            "is_ppor": False,
            "annual_appreciation": i.growth,
            "rental": {
                "weekly_rent": i.rent_received,
                "annual_growth_rate": i.rent_growth,
                "vacancy_weeks": i.vacancy_weeks,
            },
            "depreciable_buildings": (
                [
                    {
                        "name": "Building",
                        "construction_cost": i.construction_cost,
                        "purchase_date": i.purchase_date.isoformat(),
                        "construction_start_date": (i.construction_start or i.purchase_date).isoformat(),
                    }
                ]
                if i.construction_cost > 0
                else []
            ),
        },
        "loan": {
            "deposit": i.deposit,
            "annual_rate": i.rate,
            "loan_term_years": i.term,
            "frequency": "monthly",
            "offset_balance": i.offset,
            "offset_contribution": i.offset_added,
            "extra_repayment": i.extra_repayment,
        },
        "ongoing_costs": {
            "council_rates": i.council,
            "water_rates": i.water,
            "building_insurance": i.insurance,
            "strata_fees": i.strata,
            "maintenance_rate": i.maintenance_rate,
            "landlord_insurance": i.landlord_insurance,
            "management_rate": i.management_rate,
            "annual_cost_growth_rate": i.cost_growth,
        },
        "projection_years": i.years,
        "weekly_rent_paid": i.rent_paid,
        "annual_rent_paid_growth": i.rent_paid_growth,
    }
