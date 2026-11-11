"""
Benchmarks against figures published by the ATO and the Queensland Revenue
Office, checked on 11 November 2026. Each test names its source.

Where the app is known to differ from the published rule, the test is marked
`KNOWN_GAP`: it documents the right answer and is expected to fail until the
app is changed. It is strict, so fixing the app turns it into a failure that
says "remove this marker".

Rates here are for the 2026-27 income year, which is what the app's config
holds. The ATO hasn't yet published 2026-27's Medicare low-income thresholds,
so those are 2025-26's, the latest published.
"""

from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.engine.amortisation import calculate_periodic_repayment
from app.engine.cgt import calculate_cgt
from app.engine.deductions import calculate_borrowing_cost_deduction
from app.engine.stamp_duty import calculate_stamp_duty
from app.engine.tax import (
    calculate_hecs_repayment,
    calculate_income_tax,
    calculate_lito,
    calculate_medicare_levy,
    calculate_medicare_levy_surcharge,
    calculate_total_tax,
)
from app.main import app
from app.models.deductions import DepreciableBuilding
from app.models.financial import FinancialYear
from app.models.property import Property, PurchaseCosts, RentalConfig
from app.models.tax import TaxProfile
from app.services.tax_deductions import _calculate_building_depreciation
from app.tests.verification.reference_model import to_request
from app.tests.verification.scenarios import TYPICAL

client = TestClient(app)


def KNOWN_GAP(reason: str):  # noqa: N802 - reads as a label on the test
    return pytest.mark.xfail(strict=True, reason=reason)


class TestIncomeTax:
    """ATO resident rates 2026-27: ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents"""

    @pytest.mark.parametrize(
        ("taxable", "tax"),
        [
            (18_200, 0),
            (30_000, 1_770),
            (45_000, 4_020),
            (50_000, 5_520),
            (90_000, 17_520),
            (120_000, 26_520),
            (135_000, 31_020),
            (150_000, 36_570),
            (190_000, 51_370),
            (200_000, 55_870),
        ],
    )
    def test_tax_on_taxable_income(self, taxable, tax):
        assert calculate_income_tax(taxable) == pytest.approx(tax, abs=0.01)

    @pytest.mark.parametrize(
        ("taxable", "offset"), [(37_500, 700), (45_000, 325), (50_000, 250), (66_667, 0), (90_000, 0)]
    )
    def test_low_income_tax_offset_amounts(self, taxable, offset):
        """ato.gov.au/.../tax-offsets/low-income-tax-offset"""
        assert calculate_lito(taxable) == pytest.approx(offset, abs=0.01)

    def test_projection_tax_applies_the_low_income_offset(self):
        """$50,000: $5,520 tax less $250 offset, plus $1,000 Medicare levy."""
        person = TaxProfile(
            taxable_income=50_000, repayment_income=50_000, mls_income=50_000, hecs_balance=0, has_private_health=True
        )
        assert calculate_total_tax(person) == pytest.approx(5_520 - 250 + 1_000, abs=0.01)


class TestMedicare:
    def test_full_levy(self):
        """ATO example: $75,000 x 2% = $1,500. ato.gov.au/.../medicare-levy/what-is-the-medicare-levy"""
        assert calculate_medicare_levy(75_000) == pytest.approx(1_500)

    def test_low_income_reduction(self):
        """ATO example (Angie, 2025-26): $29,000 pays $98.90. ato.gov.au: medicare-levy-reduction"""
        assert calculate_medicare_levy(29_000) == pytest.approx(98.90, abs=0.01)

    def test_nothing_is_payable_at_the_lower_threshold(self):
        assert calculate_medicare_levy(28_011) == 0

    @pytest.mark.parametrize(
        ("income", "surcharge"),
        # Tom (ATO's 2026-27 example): $117,000 pays $1,170.
        [(105_000, 0), (117_000, 1_170), (123_000, 1_230), (140_000, 1_750), (164_000, 2_050), (200_000, 3_000)],
    )
    def test_surcharge_for_singles_without_cover(self, income, surcharge):
        """A flat rate on the whole income, by tier. ato.gov.au: medicare-levy-surcharge-income-thresholds-and-rates"""
        assert calculate_medicare_levy_surcharge(income, has_private_health=False) == pytest.approx(surcharge, abs=0.01)

    def test_no_surcharge_with_cover(self):
        assert calculate_medicare_levy_surcharge(200_000, has_private_health=True) == 0


class TestHelpRepayments:
    """ATO 2026-27 thresholds. ato.gov.au: study-and-training-support-loans-rates-and-repayment-thresholds"""

    @pytest.mark.parametrize(
        ("who", "income", "repayment"),
        [
            ("Christina", 86_380, 2_527.80),
            ("Barry", 137_064, 10_276.99),
            ("Priya", 254_780, 25_478),
        ],
    )
    def test_ato_worked_examples(self, who, income, repayment):
        assert calculate_hecs_repayment(income, 1_000_000) == pytest.approx(repayment, abs=0.01)

    @pytest.mark.parametrize(
        ("income", "repayment"),
        [
            (69_528, 0),
            (100_000, 4_570.80),
            # The published table steps by 35c between these two.
            (129_717, 9_028.35),
            (129_718, 9_028.17),
            (150_000, 12_476.11),
            (186_050, 18_604.61),
            (186_051, 18_605.10),
            (200_000, 20_000),
        ],
    )
    def test_repayment_by_income(self, income, repayment):
        assert calculate_hecs_repayment(income, 1_000_000) == pytest.approx(repayment, abs=0.01)

    def test_repayment_stops_at_the_balance(self):
        assert calculate_hecs_repayment(150_000, 3_000) == 3_000


class TestQueenslandTransferDuty:
    def test_qro_investor_example(self):
        """QRO: $850,000 investment property = $31,275. qro.qld.gov.au/duties/transfer-duty/calculate/rates/"""
        assert calculate_stamp_duty(850_000, "QLD", is_ppor=False) == pytest.approx(31_275)

    def test_qro_home_concession_example(self):
        """QRO: $950,000 home = $28,600. qro.qld.gov.au/duties/transfer-duty/calculate/concession-rates/"""
        assert calculate_stamp_duty(950_000, "QLD", is_ppor=True) == pytest.approx(28_600)

    @pytest.mark.parametrize(
        ("price", "investor", "home"),
        [
            (350_000, 10_675, 3_500),
            (500_000, 15_925, 8_750),
            (540_000, 17_325, 10_150),
            (700_000, 24_525, 17_350),
            (750_000, 26_775, 19_600),
            (1_000_000, 38_025, 30_850),
            (1_200_000, 49_525, 42_350),
        ],
    )
    def test_duty_from_the_published_tables(self, price, investor, home):
        assert calculate_stamp_duty(price, "QLD", is_ppor=False) == pytest.approx(investor)
        assert calculate_stamp_duty(price, "QLD", is_ppor=True) == pytest.approx(home)

    def test_part_of_a_hundred_dollars_is_charged_as_a_hundred(self):
        assert calculate_stamp_duty(600_001, "QLD", is_ppor=False) == pytest.approx(17_325 + 4.50 * 601)

    def test_home_concession_is_worth_7175_from_350k_up(self):
        for price in (350_000, 620_000, 1_500_000):
            saving = calculate_stamp_duty(price, "QLD", is_ppor=False) - calculate_stamp_duty(
                price, "QLD", is_ppor=True
            )
            assert saving == pytest.approx(7_175)


class TestLoanRepayment:
    @KNOWN_GAP(
        "The app compounds interest daily inside each month; a standard calculator (MoneySmart) uses annual / 12."
    )
    def test_matches_the_standard_formula(self):
        """$600,000 over 30 years at 6.2%: $3,674.81 a month by the standard formula MoneySmart describes."""
        assert calculate_periodic_repayment(600_000, 0.062, 30) == pytest.approx(3_674.81, abs=0.01)

    def test_is_within_half_a_percent_of_the_standard_formula(self):
        """The daily-compounding convention moves the repayment only slightly."""
        assert calculate_periodic_repayment(600_000, 0.062, 30) == pytest.approx(3_674.81, rel=0.005)


def _investment(purchased: date) -> Property:
    return Property(
        purchase_date=purchased,
        purchase_price=500_000,
        is_new_property=False,
        is_ppor=False,
        annual_appreciation=0.0,
        purchase_costs=PurchaseCosts(stamp_duty=0, legal_fees=0, building_pest_inspection=0, registration_fee=0),
        rental=RentalConfig(weekly_rent=0, annual_growth_rate=0, vacancy_weeks=0),
    )


class TestCapitalGains:
    """ato.gov.au/individuals-and-families/investments-and-assets/capital-gains-tax/cgt-discount"""

    SELLER = TaxProfile(
        taxable_income=100_000, repayment_income=100_000, mls_income=100_000, hecs_balance=0, has_private_health=True
    )

    def test_half_the_gain_is_taxed_after_twelve_months(self):
        result = calculate_cgt(_investment(date(2020, 1, 1)), 600_000, date(2022, 1, 1), self.SELLER, is_ppor=False)
        assert result.capital_gain == pytest.approx(100_000)
        assert result.discounted_gain == pytest.approx(50_000)
        # $35,000 of it at 30% + 2%, then $15,000 at 37% + 2%.
        assert result.cgt_payable == pytest.approx(35_000 * 0.32 + 15_000 * 0.39)

    def test_no_discount_within_twelve_months(self):
        result = calculate_cgt(_investment(date(2020, 1, 1)), 600_000, date(2020, 9, 1), self.SELLER, is_ppor=False)
        assert result.discounted_gain == pytest.approx(100_000)

    def test_a_home_is_exempt(self):
        result = calculate_cgt(_investment(date(2020, 1, 1)), 600_000, date(2022, 1, 1), self.SELLER, is_ppor=True)
        assert result.cgt_payable == 0

    def test_a_loss_is_not_taxed(self):
        result = calculate_cgt(_investment(date(2020, 1, 1)), 450_000, date(2022, 1, 1), self.SELLER, is_ppor=False)
        assert result.cgt_payable == 0

    def test_capital_works_deductions_reduce_the_cost_base(self):
        """
        For property acquired after 13 May 1997, capital works deductions you can claim
        can't be in the cost base.
        ato.gov.au/.../calculating-your-cgt/cost-base-adjustments-for-capital-works
        """
        inputs = TYPICAL.__class__(
            **{**TYPICAL.__dict__, "construction_cost": 320_000, "construction_start": date(2020, 1, 1), "years": 10}
        )
        api = client.post("/api/comparison", json=to_request(inputs)).json()["rentvest"]
        claimed = sum(y["tax_deduction_detail"]["depreciation_building"] for y in api["years"])
        assert claimed > 0
        purchase = inputs.price + api["upfront_costs"]["purchase_costs"]["total"]
        assert api["cgt"]["cost_base"] == pytest.approx(purchase - claimed, abs=1)


class TestCapitalWorks:
    """ato.gov.au/.../rental-expenses/capital-expenses/work-out-your-capital-works-deductions"""

    @staticmethod
    def _building(cost: float, bought: date, built: date) -> DepreciableBuilding:
        return DepreciableBuilding(
            name="Building", construction_cost=cost, purchase_date=bought, construction_start_date=built
        )

    def test_ato_worked_example(self):
        """Meg: $500,000 construction cost, rented from 1 March 2026: $12,500 x 122/365 = $4,178 for 2025-26."""
        building = self._building(500_000, date(2026, 3, 1), date(2025, 6, 1))
        assert _calculate_building_depreciation([building], FinancialYear(2026)) == pytest.approx(4_178.08, abs=0.01)

    def test_a_full_year_is_two_and_a_half_percent(self):
        building = self._building(500_000, date(2026, 3, 1), date(2025, 6, 1))
        assert _calculate_building_depreciation([building], FinancialYear(2027)) == pytest.approx(12_500)

    def test_construction_before_16_september_1987_is_not_claimed(self):
        building = self._building(500_000, date(2026, 3, 1), date(1987, 9, 15))
        assert _calculate_building_depreciation([building], FinancialYear(2027)) == 0

    def test_the_forty_years_runs_from_construction(self):
        """Built in 2000, bought in 2026: nothing is left to claim by 2045-46."""
        building = self._building(500_000, date(2026, 3, 1), date(2000, 1, 1))
        assert _calculate_building_depreciation([building], FinancialYear(2046)) == 0

    def test_a_march_purchase_claims_its_first_part_year(self):
        """Meg's $4,178 for the March-to-June part-year should be the first amount claimed."""
        inputs = TYPICAL.__class__(
            **{
                **TYPICAL.__dict__,
                "purchase_date": date(2026, 3, 1),
                "construction_cost": 500_000,
                "construction_start": date(2025, 6, 1),
                "years": 2,
            }
        )
        years = client.post("/api/comparison", json=to_request(inputs)).json()["rentvest"]["years"]
        assert years[0]["tax_deduction_detail"]["depreciation_building"] == pytest.approx(4_178.08, abs=0.01)


class TestBorrowingExpenses:
    """ato.gov.au/.../residential-rental-properties/rental-expenses/borrowing-expenses"""

    def test_spread_over_five_years_in_total(self):
        total = sum(calculate_borrowing_cost_deduction(1_600, 30, year) for year in range(10))
        assert total == pytest.approx(1_600)

    def test_spread_over_the_loan_term_if_shorter(self):
        assert calculate_borrowing_cost_deduction(1_600, 2, 0) == pytest.approx(800)
        assert calculate_borrowing_cost_deduction(1_600, 2, 2) == 0

    def test_a_hundred_dollars_or_less_is_claimed_at_once(self):
        assert calculate_borrowing_cost_deduction(100, 30, 0) == 100
        assert calculate_borrowing_cost_deduction(100, 30, 1) == 0

    @KNOWN_GAP("Borrowing expenses are split into five equal years; the ATO apportions by days, over six income years.")
    def test_ato_worked_example_first_year(self):
        """Peter: $1,600, loan taken 3 July: year 1 = 363/1,826 x $1,600 = $318.07."""
        assert calculate_borrowing_cost_deduction(1_600, 30, 0) == pytest.approx(318.07, abs=0.01)


# Not tested, and deliberately so:
# - The projection holds 2026-27's rates for every year it projects.
# - From 1 July 2027 the 50% CGT discount gives way to cost base indexation and
#   a 30% minimum tax on gains accruing after that date (ato.gov.au:
#   capital-gains-tax-reform). The app still applies the 50% discount to the
#   whole gain; how to model the change is a decision still to be made.
