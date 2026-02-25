"""
Demo: PPOR vs Rentvesting comparison using realistic Brisbane numbers.

Run from backend directory:
  python -m scripts.demo
"""

from app.models.schemas import (
    LoanConfig, PropertyConfig, TaxConfig,
    PPORScenarioInput, RentvestingScenarioInput, ComparisonInput,
    OccupancyType, RateChange,
)
from app.engine.scenarios import run_comparison


def main():
    purchase_price = 650_000
    deposit = 130_000
    loan_amount = purchase_price - deposit
    stamp_duty = 17_000

    ppor_input = PPORScenarioInput(
        property_config=PropertyConfig(
            purchase_price=purchase_price,
            deposit=deposit,
            stamp_duty=stamp_duty,
            annual_growth_rate=0.05,
            occupancy=OccupancyType.PPOR,
        ),
        loan=LoanConfig(
            principal=loan_amount,
            annual_rate=0.062,
            loan_term_years=30,
            offset_balance=20_000,
            monthly_extra_repayment=200,
            rate_changes=[RateChange(month=25, annual_rate=0.055)],
        ),
        tax=TaxConfig(
            annual_gross_salary=100_000,
            has_hecs=True,
            hecs_balance=25_000,
        ),
        projection_years=10,
    )

    rentvesting_input = RentvestingScenarioInput(
        investment_property=PropertyConfig(
            purchase_price=purchase_price,
            deposit=deposit,
            stamp_duty=stamp_duty,
            annual_growth_rate=0.05,
            occupancy=OccupancyType.INVESTMENT,
            weekly_rental_income=550,
            annual_rental_growth_rate=0.03,
            annual_management_fee_rate=0.08,
            annual_insurance=1_800,
            annual_maintenance=2_000,
            annual_council_rates=2_800,
            annual_water_rates=1_200,
            annual_strata=0,
        ),
        loan=LoanConfig(
            principal=loan_amount,
            annual_rate=0.062,
            loan_term_years=30,
            offset_balance=20_000,
            monthly_extra_repayment=200,
            rate_changes=[RateChange(month=25, annual_rate=0.055)],
        ),
        tax=TaxConfig(
            annual_gross_salary=100_000,
            has_hecs=True,
            hecs_balance=25_000,
        ),
        weekly_rent_paid=500,
        annual_rent_increase_rate=0.03,
        projection_years=10,
    )

    comparison = ComparisonInput(ppor=ppor_input, rentvesting=rentvesting_input)
    result = run_comparison(comparison)

    print("=" * 80)
    print("MORTGAGE MODELER — PPOR vs RENTVESTING COMPARISON")
    print(f"Property: ${purchase_price:,.0f} | Loan: ${loan_amount:,.0f} | Rate: 6.2% -> 5.5%")
    print("=" * 80)

    print(f"\n{'':>30}{'PPOR':>20}{'RENTVESTING':>20}")
    print("-" * 70)
    print(f"{'Total Interest Paid':>30}${result.ppor.total_interest_paid:>18,.0f}  ${result.rentvesting.total_interest_paid:>18,.0f}")
    print(f"{'Total Cost (all cash out)':>30}${result.ppor.total_cost:>18,.0f}  ${result.rentvesting.total_cost:>18,.0f}")
    print(f"{'Final Property Value':>30}${result.ppor.final_property_value:>18,.0f}  ${result.rentvesting.final_property_value:>18,.0f}")
    print(f"{'Final Equity':>30}${result.ppor.final_equity:>18,.0f}  ${result.rentvesting.final_equity:>18,.0f}")
    print(f"{'Final Net Wealth':>30}${result.ppor.final_net_wealth:>18,.0f}  ${result.rentvesting.final_net_wealth:>18,.0f}")

    if result.break_even_year:
        print(f"\nBreak-even year: {result.break_even_year}")
    else:
        print(f"\nNo break-even within projection period")

    print(f"\n{'Year':>6}{'PPOR Equity':>15}{'RV Equity':>15}{'PPOR Wealth':>15}{'RV Wealth':>15}{'Diff':>15}")
    print("-" * 81)

    for i, (py, ry) in enumerate(zip(result.ppor.yearly, result.rentvesting.yearly)):
        diff = result.wealth_difference_by_year[i]
        leader = "<- PPOR" if diff > 0 else "-> RV" if diff < 0 else "="
        print(f"{py.year:>6}${py.equity:>13,.0f}  ${ry.equity:>13,.0f}  ${py.net_wealth:>13,.0f}  ${ry.net_wealth:>13,.0f}  {leader}")

    print(f"\n{'─' * 80}")
    print("YEAR 1 — MONTHLY AMORTISATION (PPOR)")
    print(f"{'─' * 80}")
    print(f"{'Month':>6}{'Balance':>14}{'Interest':>12}{'Principal':>12}{'Payment':>12}{'Rate':>8}")

    for m in result.ppor.monthly[:12]:
        print(f"{m.month:>6}${m.opening_balance:>12,.0f}  ${m.interest_charged:>10,.2f}  ${m.principal_paid:>10,.2f}  ${m.repayment_amount:>10,.2f}  {m.annual_rate:.1%}")


if __name__ == "__main__":
    main()
