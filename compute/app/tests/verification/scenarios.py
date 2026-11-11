"""
The buyers the verification tests run: a typical case, then one for each part
of the model that could go wrong on its own (HECS, the surcharge, LMI, an
offset, depreciation, a loan shorter than the projection, either strategy winning).
"""

from dataclasses import replace
from datetime import date

from app.tests.verification.reference_model import Inputs

TYPICAL = Inputs(
    income=120_000,
    price=750_000,
    deposit=150_000,
    rate=0.062,
    term=30,
    years=30,
    growth=0.054,
    rent_paid=650,
    rent_received=600,
    purchase_date=date(2026, 11, 11),
    private_health=True,
    council=2_200,
    water=1_200,
    insurance=1_800,
    landlord_insurance=500,
    management_rate=0.08,
)

SCENARIOS: dict[str, Inputs] = {
    "typical": TYPICAL,
    # A HELP debt that takes years to clear, and no private cover (surcharge applies at this income).
    "help_debt_and_surcharge": replace(TYPICAL, help_balance=45_000, private_health=False),
    # 5% deposit: mortgage insurance, loaded for the investor, so the two loans differ.
    "small_deposit_lmi": replace(TYPICAL, deposit=37_500),
    # An offset account topped up monthly, plus extra repayments: the loan ends early.
    "offset_and_extra_repayments": replace(TYPICAL, offset=40_000, offset_added=800, extra_repayment=300),
    # A building to depreciate, bought part-way through a financial year.
    "depreciation_mid_year": replace(TYPICAL, construction_cost=320_000, construction_start=date(2016, 3, 1)),
    # The same, bought in the first half of the calendar year.
    "depreciation_bought_in_march": replace(
        TYPICAL, purchase_date=date(2027, 3, 15), construction_cost=320_000, construction_start=date(2016, 3, 1)
    ),
    # A 1992 building: its 40 years run out in 2032, a few years into the projection.
    "building_near_end_of_life": replace(TYPICAL, construction_cost=280_000, construction_start=date(1992, 4, 1)),
    # A building too old to claim (construction began before 16 September 1987).
    "building_too_old_to_claim": replace(TYPICAL, construction_cost=200_000, construction_start=date(1985, 6, 1)),
    # Strong rent, weak growth, cheap rent where you live, sold after 10 years: rentvesting should do well.
    "high_yield_short_hold": replace(
        TYPICAL, price=450_000, deposit=90_000, growth=0.02, rent_received=620, rent_paid=380, years=10
    ),
    # A positively geared property from day one: rent well above the costs.
    "positively_geared": replace(
        TYPICAL, price=400_000, deposit=200_000, rent_received=900, rent_paid=500, help_balance=30_000
    ),
    # Low income on a cheaper home (the home-concession duty band, the Medicare shade-in further down).
    "low_income_small_home": replace(
        TYPICAL, income=58_000, price=380_000, deposit=76_000, rent_paid=420, rent_received=400
    ),
    # Top tax bracket, HELP at the 10%-of-everything tier, a price over $1m.
    "high_income_expensive_home": replace(
        TYPICAL,
        income=260_000,
        price=1_600_000,
        deposit=400_000,
        rent_paid=1_300,
        rent_received=1_150,
        help_balance=90_000,
    ),
    # A 15-year loan projected for 25: ten years with no loan at all.
    "projection_longer_than_loan": replace(TYPICAL, term=15, years=25, offset=10_000, offset_added=200),
    # Nothing grows: prices, pay, rents and costs all flat.
    "nothing_grows": replace(
        TYPICAL, growth=0.0, income_growth=0.0, rent_growth=0.0, rent_paid_growth=0.0, cost_growth=0.0
    ),
    # One year only: a sale with no CGT discount.
    "one_year": replace(TYPICAL, years=1),
}
