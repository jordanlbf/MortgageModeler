"""
Property calculation engine.

Handles:
- Property value appreciation over time
- Rental income projections with annual growth
- Investment property running costs
- Stamp duty estimation (QLD)
"""

from app.models import Property, PropertyCosts


# ──────────────────────────────────────────────
# QLD Stamp Duty Brackets
# ──────────────────────────────────────────────

QLD_STAMP_DUTY_BRACKETS = [
    (5_000, 0.0, 0.00),           # $0 on first $5,000
    (75_000, 1.50, 0.00),         # $1.50 per $100 (or part thereof) over $5,000
    (540_000, 3.50, 1_050.00),    # $1,050 + $3.50 per $100 over $75,000
    (1_000_000, 4.50, 17_325.00), # $17,325 + $4.50 per $100 over $540,000
    (float("inf"), 5.75, 38_025.00),  # $38,025 + $5.75 per $100 over $1,000,000
]


def calculate_property_value(purchase_price: float, annual_growth_rate: float, year: int) -> float:
    """Calculate property value after N years of compound growth."""
    pass


def calculate_annual_rental_income(
    weekly_rent: float,
    annual_growth_rate: float,
    year: int,
    vacancy_weeks: int = 2,
) -> float:
    """
    Calculate annual rental income for a given year.

    Args:
        weekly_rent: Initial weekly rent at purchase
        annual_growth_rate: Annual rent increase rate
        year: Which year (0-based: year 0 = first year)
        vacancy_weeks: Assumed vacancy per year (default 2 weeks)

    Returns:
        Annual rental income after vacancy allowance
    """
    pass


def calculate_annual_investment_costs(prop: Property, year: int) -> dict:
    """
    Calculate annual holding costs for an investment property.

    Costs are assumed to grow at 2.5% p.a. (general inflation).
    Management fees are calculated as a percentage of rental income.

    Returns a dict with keys: management_fees, insurance, maintenance,
    council_rates, water_rates, strata, total
    """
    pass


def calculate_total_deductible_expenses(
    annual_interest: float,
    prop: Property,
    year: int,
) -> float:
    """
    Calculate total deductible expenses for an investment property.

    Deductible items:
    - Loan interest (not principal)
    - Property management fees
    - Insurance
    - Maintenance and repairs
    - Council rates
    - Water rates
    - Strata/body corporate

    Note: Depreciation is excluded from V1 for simplicity.
    """
    pass


def estimate_qld_stamp_duty(purchase_price: float, is_first_home: bool = False) -> float:
    """
    Estimate QLD stamp duty (transfer duty).

    First home buyer concession: full exemption up to $700,000.

    Args:
        purchase_price: Property purchase price
        is_first_home: Whether first home buyer concessions apply

    Returns:
        Estimated stamp duty amount
    """
    pass
