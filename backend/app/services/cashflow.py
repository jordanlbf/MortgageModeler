"""
Cash flow projection services.

Orchestrates engine and service calls into year-by-year cash flow
projections for PPOR and rentvesting scenarios. Each function generates
the amortisation schedule upfront, loops year by year to build
CashFlowYear entries, then computes the projection summary.
"""

from app.models.cashflow import CashFlowYear, CashFlowSummary, CashFlowPPORResult, CashFlowRentvestResult
from app.models.deductions import PropertyTaxDeductionSummary
from app.models.loan import LoanConfig
from app.models.property import Property, OngoingCostsConfig, RentvestConfig, YearCost
from app.models.tax import TaxProfile
from app.models.amortisation import AmortisationSchedule


def _calculate_cashflow_summary(years: list[CashFlowYear]) -> CashFlowSummary:
    """
    Calculate summary stats across the full projection from yearly entries.

    Derives all summary fields from the CashFlowYear list — final property
    value, loan balance, and cumulative position come from the last year.

    Args:
        years: Year-by-year cash flow breakdown

    Returns:
        CashFlowSummary with totals, final position, and net wealth
    """
    total_income = sum(year.net_income for year in years)
    total_outflows = sum(year.total_outflows for year in years)
    total_interest_paid = sum(year.mortgage_interest for year in years)
    total_rent_paid = sum(year.rent_paid for year in years)
    total_rental_income = sum(year.rental_income for year in years)
    total_tax_saving = sum(year.tax_saving for year in years)

    last_year = years[-1] if years else None
    final_property_value = last_year.property_value if last_year else 0.0
    final_loan_balance = last_year.loan_balance if last_year else 0.0
    final_equity = final_property_value - final_loan_balance
    cumulative_position = last_year.cumulative_position if last_year else 0.0
    average_annual_net = sum(year.net_position for year in years) / len(years) if years else 0.0
    net_wealth = final_equity + cumulative_position

    return CashFlowSummary(
        total_income=total_income,
        total_outflows=total_outflows,
        total_interest_paid=total_interest_paid,
        total_rent_paid=total_rent_paid,
        total_rental_income=total_rental_income,
        total_tax_saving=total_tax_saving,
        final_property_value=final_property_value,
        final_loan_balance=final_loan_balance,
        final_equity=final_equity,
        average_annual_net=average_annual_net,
        net_wealth=net_wealth,
    )


def _calculate_cashflow_year(
    year: int,
    tax_profile: TaxProfile,
    income_growth_rate: float,
    schedule: AmortisationSchedule,
    periods_per_year: int,
    ongoing_costs: YearCost,
    rent_paid: float,
    rental_income: float,
    tax_saving: float,
    previous_cumulative: float,
) -> CashFlowYear:
    """
    Calculate a single year's cash flow breakdown.

    Grows income by the growth rate, calculates tax on the grown income,
    sums mortgage payments from schedule rows for this year, and assembles
    all components into a CashFlowYear.

    Args:
        year: Projection year (0 = purchase year)
        tax_profile: Taxpayer base income configuration (year 0 values)
        income_growth_rate: Annual salary/wage growth rate as decimal
        schedule: Full amortisation schedule (period-based)
        periods_per_year: Number of repayment periods per year
        ongoing_costs: YearCost breakdown for this year
        rent_paid: Rent paid for this year (0 for PPOR)
        rental_income: Rental income for this year (0 for PPOR)
        tax_saving: Tax saving for this year (0 for PPOR, negative if positively geared)
        previous_cumulative: Cumulative position from the previous year

    Returns:
        CashFlowYear with detailed breakdown for this year
    """
    # Grow income and recalculate tax
    growth_factor = (1 + income_growth_rate) ** year
    grown_profile = TaxProfile(
        taxable_income=tax_profile.taxable_income * growth_factor,
        repayment_income=tax_profile.repayment_income * growth_factor,
        mls_income=tax_profile.mls_income * growth_factor,
        hecs_balance=tax_profile.hecs_balance,
        has_private_health=tax_profile.has_private_health,
    )
    from app.engine.tax import calculate_total_tax
    net_income = grown_profile.taxable_income - calculate_total_tax(grown_profile)

    # Sum mortgage payments from schedule rows for this year
    start_period = year * periods_per_year
    end_period = min((year + 1) * periods_per_year, len(schedule.rows))
    year_rows = schedule.rows[start_period:end_period]

    mortgage_interest = sum(r.interest for r in year_rows)
    mortgage_principal = sum(r.principal_paid + r.extra_paid for r in year_rows)
    mortgage_repayment = mortgage_interest + mortgage_principal

    # Loan balance and offset from last row of this year (or 0 if paid off)
    if year_rows:
        loan_balance = year_rows[-1].closing_balance
        offset_balance = year_rows[-1].offset_balance
    else:
        loan_balance = 0.0
        offset_balance = schedule.rows[-1].offset_balance if schedule.rows else 0.0

    # Assemble totals
    property_costs = ongoing_costs.total_costs
    property_value = ongoing_costs.property_value
    total_inflows = net_income + rental_income + tax_saving
    total_outflows = mortgage_repayment + property_costs + rent_paid
    net_position = total_inflows - total_outflows
    cumulative_position = previous_cumulative + net_position
    equity = property_value - loan_balance

    return CashFlowYear(
        year=year,
        net_income=net_income,
        total_inflows=total_inflows,
        mortgage_repayment=mortgage_repayment,
        mortgage_interest=mortgage_interest,
        mortgage_principal=mortgage_principal,
        property_costs=property_costs,
        rent_paid=rent_paid,
        rental_income=rental_income,
        tax_saving=tax_saving,
        total_outflows=total_outflows,
        net_position=net_position,
        cumulative_position=cumulative_position,
        property_value=property_value,
        loan_balance=loan_balance,
        equity=equity,
        offset_balance=offset_balance,
    )


def build_ppor_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    annual_appreciation: float,
    income_growth_rate: float,
    projection_years: int,
) -> CashFlowPPORResult:
    """
    Build a year-by-year cash flow projection for the PPOR scenario.

    Owner lives in the property. No rental income, no tax deductions, no CGT.

    Generates the amortisation schedule upfront, then loops year by year
    computing net income (with wage growth), mortgage payments, ongoing costs,
    and property appreciation. Assembles into CashFlowYear entries and a summary.

    Args:
        property: Property details with purchase price and costs
        tax_profile: Taxpayer base income configuration (year 0)
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        annual_appreciation: Annual property growth rate as decimal
        income_growth_rate: Annual salary/wage growth rate as decimal
        projection_years: Number of years to project

    Returns:
        CashFlowPPORResult with year-by-year breakdown and summary
    """

    # SHOULD BE THE LAYER THAT CALLS OTHER SERVICES - PASSES DOMAIN MODELS

    pass


def build_rentvest_cashflow(
    property: Property,
    tax_profile: TaxProfile,
    loan: LoanConfig,
    ongoing_costs: OngoingCostsConfig,
    rentvest: RentvestConfig,
    annual_appreciation: float,
    income_growth_rate: float,
    projection_years: int,
) -> CashFlowRentvestResult:
    """
    Build a year-by-year cash flow projection for the rentvesting scenario.

    Owner rents where they live and owns an investment property elsewhere.
    Includes rental income, tax deductions, tax saving, and CGT at sale.

    Generates the amortisation schedule upfront, then loops year by year
    computing net income (with wage growth), rent paid, mortgage payments,
    ongoing costs, rental income, tax deductions, and property appreciation.
    Calculates CGT at the end of the projection. Assembles into CashFlowYear
    entries and a summary.

    Args:
        property: Investment property details with purchase price, costs,
            depreciable buildings, and depreciable assets
        tax_profile: Taxpayer base income configuration (year 0, without property income)
        loan: Mortgage loan configuration (deposit, rate, term, offset, etc.)
        ongoing_costs: Base ongoing cost rates and growth rate
        rentvest: Rental configuration (rent paid/received, vacancy)
        annual_appreciation: Annual property growth rate as decimal
        income_growth_rate: Annual salary/wage growth rate as decimal
        projection_years: Number of years to project

    Returns:
        CashFlowRentvestResult with year-by-year breakdown, CGT, and summary
    """
    pass
