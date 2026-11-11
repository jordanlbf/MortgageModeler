"""
Reconciles the comparison API, line by line and year by year, against the
independent rebuild in reference_model.py.

A mismatch here means the app and a from-scratch calculation of the same
rules disagree: a wrong figure in config, a step applied in the wrong order,
or a number lost between the engine, service and API layers.
"""

from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.tests.verification.reference_model import Scenario, compare, to_request
from app.tests.verification.scenarios import SCENARIOS

client = TestClient(app)

# To the cent, allowing for floating point drift over 360 repayments.
CENT = 0.01

# API year field -> the reference model's figure for the same year.
YEAR_LINES = {
    "salary": lambda y: y.salary,
    "income_tax": lambda y: y.tax,
    "net_income": lambda y: y.salary - y.tax,
    "hecs_repayment": lambda y: y.help_repaid,
    "hecs_balance": lambda y: y.help_balance,
    "mortgage_interest": lambda y: y.interest,
    "mortgage_repayment": lambda y: y.repayments,
    "mortgage_principal": lambda y: y.repayments - y.interest,
    "property_costs": lambda y: y.costs,
    "offset_contributions": lambda y: y.offset_added,
    "rent_paid": lambda y: y.rent_paid,
    "rental_income": lambda y: y.rent_received,
    "tax_saving": lambda y: y.tax_saving,
    "net_position": lambda y: y.net,
    "cumulative_position": lambda y: y.cumulative,
    "property_value": lambda y: y.value,
    "loan_balance": lambda y: y.loan,
    "equity": lambda y: y.equity,
    "offset_balance": lambda y: y.offset,
    "net_wealth": lambda y: y.wealth,
    "cgt_if_sold": lambda y: y.cgt_if_sold,
}


@pytest.fixture(scope="module", params=sorted(SCENARIOS))
def case(request):
    """One buyer, run through both the API and the reference model."""
    inputs = SCENARIOS[request.param]
    response = client.post("/api/comparison", json=to_request(inputs))
    assert response.status_code == 200, response.text
    return inputs, response.json(), compare(inputs)


def mismatches(api_years: list[dict], reference: Scenario) -> list[str]:
    """Every year and line where the two disagree by more than a cent."""
    out = []
    for index, (row, year) in enumerate(zip(api_years, reference.years)):
        for name, expected in YEAR_LINES.items():
            if abs(row[name] - expected(year)) > CENT:
                out.append(f"year {index} {name}: API {row[name]:,.2f}, reference {expected(year):,.2f}")
    return out


class TestYearByYear:
    def test_same_number_of_years(self, case):
        inputs, api, _ = case
        assert len(api["ppor"]["years"]) == inputs.years
        assert len(api["rentvest"]["years"]) == inputs.years

    def test_living_in_it_matches_every_line(self, case):
        _, api, reference = case
        assert mismatches(api["ppor"]["years"], reference.ppor) == []

    def test_rentvesting_matches_every_line(self, case):
        _, api, reference = case
        assert mismatches(api["rentvest"]["years"], reference.rentvest) == []

    def test_rentvesting_deductions_match(self, case):
        _, api, reference = case
        for row, year in zip(api["rentvest"]["years"], reference.rentvest.years):
            detail = row["tax_deduction_detail"]
            assert detail["total_deductions"] == pytest.approx(year.deductions, abs=CENT)
            assert detail["net_rental_income"] == pytest.approx(year.net_rental, abs=CENT)


class TestPurchase:
    @pytest.mark.parametrize("side", ["ppor", "rentvest"])
    def test_purchase_and_borrowing_costs_match(self, case, side):
        _, api, reference = case
        costs = api[side]["upfront_costs"]
        expected = getattr(reference, side)
        assert costs["purchase_costs"]["stamp_duty"] == pytest.approx(expected.stamp_duty, abs=CENT)
        assert costs["purchase_costs"]["total"] == pytest.approx(expected.purchase_costs, abs=CENT)
        assert costs["borrowing_costs"]["total"] == pytest.approx(expected.borrowing_costs, abs=CENT)

    def test_investor_pays_at_least_as_much_duty(self, case):
        _, api, _ = case
        duty = lambda side: api[side]["upfront_costs"]["purchase_costs"]["stamp_duty"]  # noqa: E731
        assert duty("rentvest") >= duty("ppor")


class TestComparison:
    def test_wealth_lines_match(self, case):
        _, api, reference = case
        assert api["ppor_net_wealth"] == pytest.approx([y.wealth for y in reference.ppor.years], abs=CENT)
        assert api["rentvest_net_wealth"] == pytest.approx(reference.rentvest.wealth_after_cgt, abs=CENT)

    def test_gap_matches(self, case):
        _, api, reference = case
        assert api["by_year"] == pytest.approx(reference.gap, abs=CENT)

    def test_verdict_matches(self, case):
        _, api, reference = case
        assert api["winner"] == reference.winner
        assert api["difference"] == pytest.approx(reference.difference, abs=CENT)
        assert api["break_even_year"] == reference.break_even_year

    def test_final_cgt_matches(self, case):
        _, api, reference = case
        assert api["rentvest"]["cgt"]["cgt_payable"] == pytest.approx(
            reference.rentvest.years[-1].cgt_if_sold, abs=CENT
        )

    def test_summaries_match(self, case):
        _, api, reference = case
        for side in ("ppor", "rentvest"):
            years = getattr(reference, side).years
            summary = api[side]["summary"]
            assert summary["net_wealth"] == pytest.approx(years[-1].wealth, abs=CENT)
            assert summary["final_equity"] == pytest.approx(years[-1].equity, abs=CENT)
            assert summary["total_interest_paid"] == pytest.approx(sum(y.interest for y in years), abs=CENT)
            assert summary["total_rent_paid"] == pytest.approx(sum(y.rent_paid for y in years), abs=CENT)
            assert summary["total_rental_income"] == pytest.approx(sum(y.rent_received for y in years), abs=CENT)
            assert summary["total_tax_saving"] == pytest.approx(sum(y.tax_saving for y in years), abs=CENT)
            assert summary["total_tax_paid"] == pytest.approx(sum(y.tax - y.tax_saving for y in years), abs=CENT)


class TestScenariosCoverWhatTheyClaim:
    """Guards the scenario list: each one has to exercise the thing it's there for."""

    def test_both_strategies_win_somewhere(self):
        winners = {compare(i).winner for i in SCENARIOS.values()}
        assert winners == {"ppor", "rentvesting"}

    def test_the_lead_changes_hands_somewhere(self):
        assert any(compare(i).break_even_year is not None for i in SCENARIOS.values())

    def test_help_debt_takes_years_and_clears(self):
        years = compare(SCENARIOS["help_debt_and_surcharge"]).ppor.years
        assert years[2].help_balance > 0
        assert years[-1].help_balance == 0

    def test_small_deposit_charges_the_investor_more_insurance(self):
        result = compare(SCENARIOS["small_deposit_lmi"])
        assert result.rentvest.loan > result.ppor.loan > 750_000 - 37_500

    def test_offset_ends_the_loan_early(self):
        years = compare(SCENARIOS["offset_and_extra_repayments"]).ppor.years
        assert years[-1].loan == 0
        assert years[-1].repayments == 0

    def test_positive_gearing_adds_tax(self):
        years = compare(SCENARIOS["positively_geared"]).rentvest.years
        assert years[0].net_rental > 0
        assert years[0].tax_saving < 0

    def test_depreciation_is_claimed_only_on_an_eligible_building(self):
        claimed = compare(SCENARIOS["depreciation_mid_year"]).rentvest.years[1]
        too_old = compare(SCENARIOS["building_too_old_to_claim"]).rentvest.years[1]
        plain = compare(SCENARIOS["typical"]).rentvest.years[1]
        assert claimed.deductions == pytest.approx(plain.deductions + 320_000 * 0.025)
        assert too_old.deductions == pytest.approx(plain.deductions)

    def test_depreciation_stops_forty_years_after_construction(self):
        years = compare(SCENARIOS["building_near_end_of_life"]).rentvest.years
        plain = compare(SCENARIOS["typical"]).rentvest.years
        claims = [y.deductions - p.deductions for y, p in zip(years, plain)]
        # Built April 1992: claimed in full, part of 2031-32, then nothing.
        assert claims[1] == pytest.approx(280_000 * 0.025)
        assert 0 < claims[5] < 280_000 * 0.025
        assert claims[6:] == pytest.approx([0] * len(claims[6:]))

    def test_a_march_purchase_claims_a_part_year_first(self):
        years = compare(SCENARIOS["depreciation_bought_in_march"]).rentvest.years
        plain = compare(replace(SCENARIOS["depreciation_bought_in_march"], construction_cost=0)).rentvest.years
        first, second = (years[n].deductions - plain[n].deductions for n in (0, 1))
        # 15 March to 30 June 2027 is 108 days of 365.
        assert first == pytest.approx(320_000 * 0.025 * 108 / 365)
        assert second == pytest.approx(320_000 * 0.025)

    def test_low_income_gets_the_low_income_offset(self):
        year = compare(SCENARIOS["low_income_small_home"]).ppor.years[0]
        # $58,000: $4,020 + $3,900 = $7,920, less LITO $130 ($325 - 1.5c x $13,000), plus Medicare $1,160.
        assert year.tax == pytest.approx(7_920 - 130 + 1_160)

    def test_projection_runs_past_the_loan(self):
        years = compare(SCENARIOS["projection_longer_than_loan"]).ppor.years
        assert years[14].loan == pytest.approx(0, abs=CENT)
        assert years[20].repayments == 0
        assert years[20].offset == years[14].offset > 0
