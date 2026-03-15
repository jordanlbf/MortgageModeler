"""
Tests for tax deductions service — build_tax_deduction_summary and _calculate_days_held_in_fy.
"""

import pytest
from datetime import date, timedelta

from app.services.tax_deductions import build_tax_deduction_summary, _calculate_days_held_in_fy
from app.models.deductions import DepreciableBuilding, DepreciableAsset, DepreciationMethod
from app.models.financial import FinancialYear
from app.models.property import YearCost, Property
from app.models.tax import TaxProfile
from app.engine.tax import calculate_total_tax


# ──────────────────────────────────────────────
# Fixtures / Helpers
# ──────────────────────────────────────────────

def _make_year_cost(**overrides) -> YearCost:
    """Create a YearCost with sensible defaults."""
    defaults = dict(
        year=1,
        council_rates=2_000,
        water_rates=1_200,
        building_insurance=1_500,
        landlord_insurance=1_000,
        strata_fees=3_000,
        maintenance_cost=5_000,
        management_fee=2_000,
        property_value=500_000,
        rental_income=25_000,
        total=15_700,
    )
    defaults.update(overrides)
    return YearCost(**defaults)


def _make_property(purchase_date=None, purchase_price=500_000, is_new=True,
                   buildings=None, assets=None) -> Property:
    """Create a Property with sensible defaults."""
    return Property(
        purchase_date=purchase_date or date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=is_new,
        depreciable_buildings=buildings or [],
        depreciable_assets=assets or [],
    )


def _make_building(name="Main building", cost=400_000, purchase_date=None,
                   construction_start_date=None) -> DepreciableBuilding:
    return DepreciableBuilding(
        name=name,
        construction_cost=cost,
        purchase_date=purchase_date or date(2020, 1, 15),
        construction_start_date=construction_start_date or date(2019, 1, 1),
    )


def _make_asset(name="Aircon", cost=2_000, life=10, purchase_date=None,
                method=DepreciationMethod.DIMINISHING_VALUE, wdv=None) -> DepreciableAsset:
    pd = purchase_date or date(2020, 1, 15)
    return DepreciableAsset(
        name=name,
        cost=cost,
        effective_life_years=life,
        purchase_date=pd,
        method=method,
        written_down_value=wdv if wdv is not None else cost,
    )


def _make_tax_profile(taxable_income=100_000, **overrides) -> TaxProfile:
    """Create a TaxProfile with uniform income defaults."""
    defaults = dict(
        taxable_income=taxable_income,
        repayment_income=taxable_income,
        mls_income=taxable_income,
        hecs_balance=0,
        has_private_health=True,
    )
    defaults.update(overrides)
    return TaxProfile(**defaults)


# ──────────────────────────────────────────────
# _calculate_days_held_in_fy
# ──────────────────────────────────────────────

class TestCalculateDaysHeldInFy:
    """Tests for the days held helper function."""

    def test_full_year_held(self):
        """Asset purchased well before the FY — full year."""
        fy = FinancialYear(2025)
        purchase = date(2020, 1, 1)
        expiry = date(2060, 1, 1)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == fy.days

    def test_purchased_mid_fy(self):
        """Asset purchased 1 Jan 2025 — 181 days remaining in FY 2025 (inclusive of Jun 30)."""
        fy = FinancialYear(2025)
        purchase = date(2025, 1, 1)
        expiry = date(2065, 1, 1)
        expected = (date(2025, 7, 1) - date(2025, 1, 1)).days
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == expected

    def test_purchased_on_fy_start(self):
        """Asset purchased on 1 Jul 2024 — full FY = 365 days."""
        fy = FinancialYear(2025)
        purchase = date(2024, 7, 1)
        expiry = date(2064, 7, 1)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == fy.days

    def test_purchased_on_fy_end(self):
        """Asset purchased on 30 Jun 2025 — 1 day (end date is inclusive)."""
        fy = FinancialYear(2025)
        purchase = date(2025, 6, 30)
        expiry = date(2065, 6, 30)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == 1

    def test_purchased_after_fy(self):
        """Asset purchased after the FY — 0 days."""
        fy = FinancialYear(2025)
        purchase = date(2025, 7, 15)
        expiry = date(2065, 7, 15)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == 0

    def test_expired_before_fy(self):
        """Asset fully expired before the FY — 0 days."""
        fy = FinancialYear(2025)
        purchase = date(1980, 1, 1)
        expiry = date(2024, 1, 1)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == 0

    def test_expires_mid_fy(self):
        """Asset expires 1 Jan 2025 — capped at expiry."""
        fy = FinancialYear(2025)
        purchase = date(2020, 1, 1)
        expiry = date(2025, 1, 1)
        expected = (date(2025, 1, 1) - date(2024, 7, 1)).days
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == expected

    def test_expires_on_fy_start(self):
        """Asset expires exactly on FY start — 0 days."""
        fy = FinancialYear(2025)
        purchase = date(1984, 7, 1)
        expiry = date(2024, 7, 1)
        result = _calculate_days_held_in_fy(purchase, expiry, fy)
        assert result == 0

    def test_purchased_and_expires_same_fy(self):
        """Asset purchased and expires within the same FY (short effective life)."""
        fy = FinancialYear(2025)
        purchase = date(2024, 10, 1)
        expiry = date(2025, 4, 1)
        purchase_to_fy_end = (fy.end_date + timedelta(days=1) - purchase).days
        expiry_from_fy_start = (expiry - fy.start_date).days
        expected = min(purchase_to_fy_end, expiry_from_fy_start)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == expected


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Basic scenarios
# ──────────────────────────────────────────────

class TestBuildTaxDeductionSummaryBasic:
    """Tests for basic deduction summary calculations."""

    def test_negatively_geared(self):
        """Deductions exceed rental income — negatively geared."""
        prop = _make_property(buildings=[_make_building()])
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=20_000,
            ongoing_costs=costs,
            rental_income=25_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.is_negatively_geared is True
        assert result.net_rental_income < 0
        assert result.tax_saving > 0

    def test_positively_geared(self):
        """Rental income exceeds deductions — positively geared."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=500, water_rates=300, building_insurance=400,
            landlord_insurance=200, strata_fees=0, maintenance_cost=500,
            management_fee=400,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=5_000,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.is_negatively_geared is False
        assert result.net_rental_income > 0
        assert result.tax_saving < 0

    def test_zero_rental_income(self):
        """No rental income — all deductions create a loss."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=15_000,
            ongoing_costs=costs,
            rental_income=0,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.is_negatively_geared is True
        assert result.net_rental_income < 0

    def test_no_deductions(self):
        """No deductions at all — net rental income equals rental income."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=30_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.total_deductions == 0.0
        assert result.net_rental_income == 30_000
        assert result.is_negatively_geared is False


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Deduction breakdown
# ──────────────────────────────────────────────

class TestDeductionBreakdown:
    """Tests that individual deduction components are calculated correctly."""

    def test_ongoing_expenses_summed_correctly(self):
        """Ongoing expenses should sum individual cost fields."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        expected = (2_000 + 1_200 + 1_500 + 1_000 + 3_000 + 5_000 + 2_000)
        assert result.deductible_expenses == pytest.approx(expected)

    def test_mortgage_interest_passed_through(self):
        """Mortgage interest should appear as-is in the output."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=18_500,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.mortgage_interest == 18_500

    def test_total_deductions_is_sum_of_all(self):
        """Total deductions = interest + ongoing + building depreciation + plant depreciation."""
        prop = _make_property(
            buildings=[_make_building()],
            assets=[_make_asset()],
        )
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=15_000,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        expected = (result.mortgage_interest + result.deductible_expenses +
                    result.depreciation_building + result.depreciation_plant)
        assert result.total_deductions == pytest.approx(expected)

    def test_net_rental_income_calculation(self):
        """Net rental income = rental income - total deductions."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=10_000,
            ongoing_costs=costs,
            rental_income=30_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.net_rental_income == pytest.approx(30_000 - result.total_deductions)


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Div 43
# ──────────────────────────────────────────────

class TestDiv43InService:
    """Tests for Div 43 building depreciation within the service."""

    def test_single_building_full_year(self):
        """$400k building, purchased well before FY — full year deduction of $10,000."""
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(10_000, abs=1)

    def test_multiple_buildings(self):
        """Multiple buildings — deductions should sum."""
        b1 = _make_building(name="Original", cost=400_000, purchase_date=date(2020, 1, 15))
        b2 = _make_building(name="Extension", cost=100_000, purchase_date=date(2022, 6, 1))
        prop = _make_property(buildings=[b1, b2])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(12_500, abs=1)

    def test_building_expired(self):
        """Building purchased 41 years ago — expired, zero depreciation."""
        building = _make_building(cost=400_000, purchase_date=date(1980, 1, 1))
        prop = _make_property(purchase_date=date(1980, 1, 1), buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_building_purchased_mid_fy(self):
        """Building purchased 1 Jan 2025 — pro-rated for partial FY."""
        building = _make_building(cost=400_000, purchase_date=date(2025, 1, 1))
        prop = _make_property(purchase_date=date(2025, 1, 1), buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        days = (date(2025, 7, 1) - date(2025, 1, 1)).days
        expected = 10_000 * (days / fy.days)
        assert result.depreciation_building == pytest.approx(expected, abs=1)
        assert result.depreciation_building < 10_000

    def test_pre_1987_building_excluded(self):
        """Building with construction starting before 16 Sep 1987 — zero depreciation."""
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15),
                                  construction_start_date=date(1985, 3, 1))
        prop = _make_property(buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_pre_1987_building_on_cutoff_date_excluded(self):
        """Building with construction starting on 15 Sep 1987 (day before cutoff) — excluded."""
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15),
                                  construction_start_date=date(1987, 9, 15))
        prop = _make_property(buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_post_1987_building_on_cutoff_date_included(self):
        """Building with construction starting exactly on 16 Sep 1987 — included."""
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15),
                                  construction_start_date=date(1987, 9, 16))
        prop = _make_property(buildings=[building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(10_000, abs=1)

    def test_mixed_pre_and_post_1987_buildings(self):
        """Mix of pre- and post-1987 buildings — only post-1987 should be claimed."""
        old_building = _make_building(name="Old wing", cost=200_000,
                                      purchase_date=date(2020, 1, 15),
                                      construction_start_date=date(1980, 1, 1))
        new_building = _make_building(name="New wing", cost=400_000,
                                      purchase_date=date(2020, 1, 15),
                                      construction_start_date=date(2019, 6, 1))
        prop = _make_property(buildings=[old_building, new_building])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(10_000, abs=1)

    def test_no_buildings(self):
        """Empty buildings list — zero depreciation."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Div 40
# ──────────────────────────────────────────────

class TestDiv40InService:
    """Tests for Div 40 plant depreciation within the service."""

    def test_new_property_assets_included(self):
        """New property — Div 40 assets should be claimed."""
        asset = _make_asset(cost=2_000, life=10, wdv=2_000)
        prop = _make_property(is_new=True, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant > 0

    def test_secondhand_asset_post_2017_excluded(self):
        """Second-hand asset on post-2017 property — Div 40 blocked."""
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, purchase_date=date(2018, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == 0.0

    def test_secondhand_asset_pre_2017_allowed(self):
        """Second-hand asset on pre-2017 property — Div 40 grandfathered."""
        asset = _make_asset(cost=2_000, life=20, wdv=2_000, purchase_date=date(2014, 1, 1))
        prop = _make_property(purchase_date=date(2016, 3, 1), is_new=False, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant > 0

    def test_owner_installed_asset_post_2017_allowed(self):
        """Owner-installed asset on post-2017 second-hand property — Div 40 allowed."""
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, purchase_date=date(2020, 1, 15))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant > 0

    def test_mixed_secondhand_and_owner_installed_post_2017(self):
        """Mix of second-hand and owner-installed assets on post-2017 property."""
        old_asset = _make_asset(name="Old carpet", cost=3_000, life=10, wdv=3_000, purchase_date=date(2015, 1, 1))
        new_asset = _make_asset(name="New aircon", cost=2_000, life=10, wdv=2_000, purchase_date=date(2020, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[old_asset, new_asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(400, abs=1)

    def test_diminishing_value_method(self):
        """Diminishing value: $2,000 asset, 10yr life, full year = $400."""
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, method=DepreciationMethod.DIMINISHING_VALUE)
        prop = _make_property(is_new=True, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(400, abs=1)

    def test_prime_cost_method(self):
        """Prime cost: $2,000 asset, 10yr life, full year = $200."""
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, method=DepreciationMethod.PRIME_COST)
        prop = _make_property(is_new=True, assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(200, abs=1)

    def test_multiple_assets(self):
        """Multiple assets — deductions should sum."""
        a1 = _make_asset(name="Aircon", cost=2_000, life=10, wdv=2_000)
        a2 = _make_asset(name="Carpet", cost=3_000, life=8, wdv=3_000)
        prop = _make_property(is_new=True, assets=[a1, a2])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(1_150, abs=1)

    def test_asset_expired(self):
        """Asset past effective life — zero depreciation."""
        asset = _make_asset(cost=2_000, life=5, purchase_date=date(2010, 1, 1), wdv=100)
        prop = _make_property(is_new=True, purchase_date=date(2010, 1, 1), assets=[asset])
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == 0.0

    def test_no_assets(self):
        """Empty assets list — zero depreciation."""
        prop = _make_property(is_new=True)
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=50_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.depreciation_plant == 0.0


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Tax saving
# ──────────────────────────────────────────────

class TestTaxSaving:
    """Tests for tax saving via two-pass total tax engine."""

    def test_tax_saving_negatively_geared(self):
        """Negatively geared — tax saving should equal two-pass difference."""
        prop = _make_property(buildings=[_make_building()])
        fy = FinancialYear(2025)
        costs = _make_year_cost()
        profile = _make_tax_profile()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=20_000,
            ongoing_costs=costs,
            rental_income=25_000,
            tax_profile=profile,
            financial_year=fy,
        )

        tax_without = calculate_total_tax(
            profile.taxable_income, profile.repayment_income, profile.mls_income,
            profile.hecs_balance, profile.has_private_health,
        )
        net = result.net_rental_income
        tax_with = calculate_total_tax(
            profile.taxable_income + net,
            profile.repayment_income + max(net, 0),
            profile.mls_income + max(net, 0),
            profile.hecs_balance, profile.has_private_health,
        )
        expected = tax_without - tax_with
        assert result.tax_saving == pytest.approx(expected)
        assert result.tax_saving > 0

    def test_tax_saving_positively_geared(self):
        """Positively geared — tax saving should be negative (extra tax owed)."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            ongoing_costs=costs,
            rental_income=30_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.tax_saving < 0

    def test_tax_saving_zero_net_rental(self):
        """Net rental income exactly zero — no tax impact."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=30_000,
            ongoing_costs=costs,
            rental_income=30_000,
            tax_profile=_make_tax_profile(),
            financial_year=fy,
        )

        assert result.tax_saving == pytest.approx(0)

    def test_tax_saving_spans_brackets(self):
        """Loss large enough to push income across a tax bracket boundary."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )
        profile = _make_tax_profile(taxable_income=50_000)

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=10_000,
            ongoing_costs=costs,
            rental_income=0,
            tax_profile=profile,
            financial_year=fy,
        )

        simple_marginal = 10_000 * 0.30
        assert result.tax_saving != pytest.approx(simple_marginal)
        tax_without = calculate_total_tax(50_000, 50_000, 50_000, 0, True)
        tax_with = calculate_total_tax(40_000, 50_000, 50_000, 0, True)
        expected = tax_without - tax_with
        assert result.tax_saving == pytest.approx(expected)

    def test_tax_saving_low_income(self):
        """Low income — deductions may push into tax-free threshold."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )
        profile = _make_tax_profile(taxable_income=20_000)

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=10_000,
            ongoing_costs=costs,
            rental_income=0,
            tax_profile=profile,
            financial_year=fy,
        )

        tax_without = calculate_total_tax(20_000, 20_000, 20_000, 0, True)
        tax_with = calculate_total_tax(10_000, 20_000, 20_000, 0, True)
        expected = tax_without - tax_with
        assert result.tax_saving == pytest.approx(expected)
