"""
Checks that must hold for any buyer, run across a grid of them.

Two kinds. Identities: each year's lines add up, and the totals follow from
the years. Directions: changing one input moves the result the way it must
(more rent received can't make rentvesting worse).
"""

import itertools
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.tests.verification.reference_model import Inputs, to_request
from app.tests.verification.scenarios import TYPICAL

client = TestClient(app)

CENT = 0.01


def run(inputs: Inputs) -> dict:
    response = client.post("/api/comparison", json=to_request(inputs))
    assert response.status_code == 200, response.text
    return response.json()


def final(inputs: Inputs) -> tuple[float, float]:
    """Net wealth at the end for (living in it, rentvesting after CGT)."""
    api = run(inputs)
    return api["ppor_net_wealth"][-1], api["rentvest_net_wealth"][-1]


# 3 incomes x 3 prices x 2 deposits x 2 rates x 2 growth rates x 2 rents x 2 terms = 288 buyers.
GRID = [
    replace(
        TYPICAL,
        income=income,
        price=price,
        deposit=price * deposit,
        rate=rate,
        growth=growth,
        rent_received=price * gross_yield / 52,
        rent_paid=price * 0.04 / 52,
        term=term,
        years=term,
        help_balance=25_000 if income < 100_000 else 0,
        private_health=income > 150_000,
        offset=15_000 if rate > 0.06 else 0,
        offset_added=250 if rate > 0.06 else 0,
    )
    for income, price, deposit, rate, growth, gross_yield, term in itertools.product(
        (65_000, 120_000, 240_000),
        (420_000, 750_000, 1_400_000),
        (0.08, 0.25),
        (0.045, 0.075),
        (0.01, 0.06),
        (0.03, 0.065),
        (12, 30),
    )
]


@pytest.fixture(scope="module")
def grid_results():
    return [(inputs, run(inputs)) for inputs in GRID]


class TestIdentities:
    def test_grid_is_the_size_it_claims(self):
        assert len(GRID) == 288

    def test_each_year_adds_up(self, grid_results):
        for _, api in grid_results:
            for side in ("ppor", "rentvest"):
                previous = -api[side]["upfront_costs"]["purchase_costs"]["total"]
                for y in api[side]["years"]:
                    inflows = y["net_income"] + y["rental_income"] + y["tax_saving"]
                    outflows = (
                        y["mortgage_repayment"] + y["property_costs"] + y["rent_paid"] + y["offset_contributions"]
                    )
                    assert y["total_inflows"] == pytest.approx(inflows, abs=CENT)
                    assert y["total_outflows"] == pytest.approx(outflows, abs=CENT)
                    assert y["net_position"] == pytest.approx(inflows - outflows, abs=CENT)
                    assert y["cumulative_position"] == pytest.approx(previous + y["net_position"], abs=CENT)
                    assert y["net_income"] == pytest.approx(y["salary"] - y["income_tax"], abs=CENT)
                    assert y["mortgage_repayment"] == pytest.approx(
                        y["mortgage_interest"] + y["mortgage_principal"], abs=CENT
                    )
                    assert y["equity"] == pytest.approx(y["property_value"] - y["loan_balance"], abs=CENT)
                    assert y["net_wealth"] == pytest.approx(
                        y["equity"] + y["cumulative_position"] + y["offset_balance"], abs=CENT
                    )
                    previous = y["cumulative_position"]

    def test_the_loan_is_repaid_by_its_term_and_never_grows(self, grid_results):
        for _, api in grid_results:
            for side in ("ppor", "rentvest"):
                balances = [y["loan_balance"] for y in api[side]["years"]]
                assert all(later <= earlier + CENT for earlier, later in zip(balances, balances[1:]))
                assert balances[-1] == pytest.approx(0, abs=1)

    def test_principal_repaid_equals_the_loan(self, grid_results):
        for inputs, api in grid_results:
            for side in ("ppor", "rentvest"):
                borrowed = inputs.price - inputs.deposit + api[side]["upfront_costs"]["borrowing_costs"]["total"]
                repaid = sum(y["mortgage_principal"] for y in api[side]["years"])
                assert repaid == pytest.approx(borrowed, abs=1)

    def test_help_debt_is_never_negative_and_repayments_never_exceed_it(self, grid_results):
        for inputs, api in grid_results:
            for side in ("ppor", "rentvest"):
                owed = inputs.help_balance
                for y in api[side]["years"]:
                    owed *= 1 + inputs.help_indexation
                    assert 0 <= y["hecs_repayment"] <= owed + CENT
                    assert y["hecs_balance"] == pytest.approx(owed - y["hecs_repayment"], abs=CENT)
                    assert y["hecs_balance"] >= -CENT
                    owed = y["hecs_balance"]

    def test_living_in_it_has_no_rent_tax_saving_or_cgt(self, grid_results):
        for _, api in grid_results:
            for y in api["ppor"]["years"]:
                assert y["rent_paid"] == y["rental_income"] == y["tax_saving"] == y["cgt_if_sold"] == 0

    def test_cgt_is_never_negative_and_ends_at_the_reported_figure(self, grid_results):
        for _, api in grid_results:
            years = api["rentvest"]["years"]
            assert all(y["cgt_if_sold"] >= 0 for y in years)
            assert years[-1]["cgt_if_sold"] == pytest.approx(api["rentvest"]["cgt"]["cgt_payable"], abs=CENT)

    def test_tax_saving_matches_the_sign_of_the_rental_result(self, grid_results):
        """A rental loss can't raise tax and a rental profit can't lower it."""
        for _, api in grid_results:
            for y in api["rentvest"]["years"]:
                net = y["tax_deduction_detail"]["net_rental_income"]
                if net < 0:
                    assert y["tax_saving"] >= -CENT
                else:
                    assert y["tax_saving"] <= CENT

    def test_the_verdict_follows_from_the_wealth_lines(self, grid_results):
        for _, api in grid_results:
            gap = [p - r for p, r in zip(api["ppor_net_wealth"], api["rentvest_net_wealth"])]
            assert api["by_year"] == pytest.approx(gap, abs=CENT)
            assert api["winner"] == ("ppor" if gap[-1] >= 0 else "rentvesting")
            assert api["difference"] == pytest.approx(abs(gap[-1]), abs=CENT)
            flips = [n for n in range(1, len(gap)) if (gap[0] > 0) != (gap[n] > 0)] if gap[0] != 0 else []
            if api["break_even_year"] is None:
                assert not flips
            else:
                assert api["break_even_year"] == flips[0]

    def test_both_strategies_win_somewhere_on_the_grid(self, grid_results):
        assert {api["winner"] for _, api in grid_results} == {"ppor", "rentvesting"}


class TestDirections:
    """Each change is applied to a typical buyer; only the stated strategy may move, and only one way."""

    def test_more_rent_received_helps_rentvesting_only(self):
        base, more = final(TYPICAL), final(replace(TYPICAL, rent_received=700))
        assert more[1] > base[1]
        assert more[0] == pytest.approx(base[0], abs=CENT)

    def test_more_rent_paid_hurts_rentvesting_only(self):
        base, more = final(TYPICAL), final(replace(TYPICAL, rent_paid=750))
        assert more[1] < base[1]
        assert more[0] == pytest.approx(base[0], abs=CENT)

    @pytest.mark.parametrize(
        "change",
        [
            {"vacancy_weeks": 6},
            {"management_rate": 0.12},
            {"landlord_insurance": 1_500},
            {"rent_paid_growth": 0.05},
        ],
    )
    def test_landlord_costs_hurt_rentvesting_only(self, change):
        base, worse = final(TYPICAL), final(replace(TYPICAL, **change))
        assert worse[1] < base[1]
        assert worse[0] == pytest.approx(base[0], abs=CENT)

    def test_depreciation_helps_rentvesting_only(self):
        base = final(TYPICAL)
        claimed = final(replace(TYPICAL, construction_cost=300_000))
        assert claimed[1] > base[1]
        assert claimed[0] == pytest.approx(base[0], abs=CENT)

    @pytest.mark.parametrize(
        "change",
        [
            {"rate": 0.075},
            {"council": 4_000},
            {"maintenance_rate": 0.02},
            {"cost_growth": 0.05},
            {"help_balance": 40_000},
        ],
    )
    def test_higher_costs_hurt_both(self, change):
        base, worse = final(TYPICAL), final(replace(TYPICAL, **change))
        assert worse[0] < base[0]
        assert worse[1] < base[1]

    @pytest.mark.parametrize("change", [{"growth": 0.07}, {"income": 150_000}, {"income_growth": 0.045}])
    def test_more_growth_or_income_helps_both(self, change):
        base, better = final(TYPICAL), final(replace(TYPICAL, **change))
        assert better[0] > base[0]
        assert better[1] > base[1]

    def test_growth_favours_living_in_it(self):
        """Capital gain is tax-free in a home and taxed in an investment, so more growth widens the gap."""
        low = final(replace(TYPICAL, growth=0.03))
        high = final(replace(TYPICAL, growth=0.07))
        assert (high[0] - high[1]) > (low[0] - low[1])

    def test_private_health_cover_only_matters_above_the_surcharge_threshold(self):
        # Living in it only: a rentvester's rent profit or capital gain can lift a low income over the threshold.
        low = replace(TYPICAL, income=60_000, income_growth=0.0)
        assert final(replace(low, private_health=True))[0] == pytest.approx(
            final(replace(low, private_health=False))[0], abs=CENT
        )
        high = replace(TYPICAL, income=130_000)
        assert final(replace(high, private_health=True))[0] > final(replace(high, private_health=False))[0]

    def test_a_shorter_hold_is_a_prefix_of_a_longer_one(self):
        """Year 10 of a 30-year projection is the end of a 10-year one."""
        long = run(TYPICAL)
        short = run(replace(TYPICAL, years=10))
        assert short["ppor_net_wealth"] == pytest.approx(long["ppor_net_wealth"][:10], abs=CENT)
        assert short["rentvest_net_wealth"] == pytest.approx(long["rentvest_net_wealth"][:10], abs=CENT)
