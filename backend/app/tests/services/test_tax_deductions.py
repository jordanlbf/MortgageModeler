"""
Tests for tax deductions service — build_tax_deduction_summary and _calculate_days_held_in_fy.
"""

import pytest
from datetime import date, timedelta

from app.services.tax_deductions import build_tax_deduction_summary, _calculate_days_held_in_fy
from app.models.deductions import DepreciableBuilding, DepreciableAsset, DepreciationMethod
from app.models.financial import FinancialYear
from app.models.property import YearCost, Property
from app.engine.tax import calculate_income_tax


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


def _make_property(purchase_date=None, is_new=True) -> Property:
    """Create a Property with sensible defaults."""
    return Property(
        purchase_date=purchase_date or date(2020, 1, 15),
        is_new_property=is_new,
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


# ──────────────────────────────────────────────
# _calculate_days_held_in_fy
# ──────────────────────────────────────────────

class TestCalculateDaysHeldInFy:
    """Tests for the days held helper function."""

    def test_full_year_held(self):
        """Asset purchased well before the FY — full year."""
        fy = FinancialYear(2025)  # 1 Jul 2024 – 30 Jun 2025
        purchase = date(2020, 1, 1)
        expiry = date(2060, 1, 1)
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == fy.days

    def test_purchased_mid_fy(self):
        """Asset purchased 1 Jan 2025 — 181 days remaining in FY 2025 (inclusive of Jun 30)."""
        fy = FinancialYear(2025)
        purchase = date(2025, 1, 1)
        expiry = date(2065, 1, 1)
        expected = (date(2025, 7, 1) - date(2025, 1, 1)).days  # 181
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
        expiry = date(2025, 4, 1)  # 6-month life
        # purchase to FY end (inclusive) = 273, expiry from FY start = 274
        # Capped at min(273, 274) = 273
        purchase_to_fy_end = (fy.end_date + timedelta(days=1) - purchase).days  # 273
        expiry_from_fy_start = (expiry - fy.start_date).days  # 274
        expected = min(purchase_to_fy_end, expiry_from_fy_start)  # 273
        assert _calculate_days_held_in_fy(purchase, expiry, fy) == expected


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Basic scenarios
# ──────────────────────────────────────────────

class TestBuildTaxDeductionSummaryBasic:
    """Tests for basic deduction summary calculations."""

    def test_negatively_geared(self):
        """Deductions exceed rental income — negatively geared."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=20_000,
            depreciable_buildings=[_make_building()],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=25_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.is_negatively_geared is False
        assert result.net_rental_income > 0
        assert result.tax_saving < 0  # Extra tax owed

    def test_zero_rental_income(self):
        """No rental income — all deductions create a loss."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=15_000,
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=0,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=30_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.mortgage_interest == 18_500

    def test_total_deductions_is_sum_of_all(self):
        """Total deductions = interest + ongoing + building depreciation + plant depreciation."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=15_000,
            depreciable_buildings=[_make_building()],
            depreciable_assets=[_make_asset()],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=30_000,
            taxable_income=100_000,
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
        prop = _make_property(purchase_date=date(2020, 1, 15))
        fy = FinancialYear(2025)
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15))
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(10_000, abs=1)

    def test_multiple_buildings(self):
        """Multiple buildings — deductions should sum."""
        prop = _make_property()
        fy = FinancialYear(2025)
        b1 = _make_building(name="Original", cost=400_000, purchase_date=date(2020, 1, 15))
        b2 = _make_building(name="Extension", cost=100_000, purchase_date=date(2022, 6, 1))
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[b1, b2],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        # Both full year: $10,000 + $2,500 = $12,500
        assert result.depreciation_building == pytest.approx(12_500, abs=1)

    def test_building_expired(self):
        """Building purchased 41 years ago — expired, zero depreciation."""
        prop = _make_property(purchase_date=date(1980, 1, 1))
        fy = FinancialYear(2025)
        building = _make_building(cost=400_000, purchase_date=date(1980, 1, 1))
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_building_purchased_mid_fy(self):
        """Building purchased 1 Jan 2025 — pro-rated for partial FY."""
        prop = _make_property(purchase_date=date(2025, 1, 1))
        fy = FinancialYear(2025)
        building = _make_building(cost=400_000, purchase_date=date(2025, 1, 1))
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        days = (date(2025, 7, 1) - date(2025, 1, 1)).days
        expected = 10_000 * (days / fy.days)
        assert result.depreciation_building == pytest.approx(expected, abs=1)
        assert result.depreciation_building < 10_000

    def test_pre_1987_building_excluded(self):
        """Building with construction starting before 16 Sep 1987 — zero depreciation."""
        prop = _make_property()
        fy = FinancialYear(2025)
        building = _make_building(
            cost=400_000,
            purchase_date=date(2020, 1, 15),
            construction_start_date=date(1985, 3, 1),
        )
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_pre_1987_building_on_cutoff_date_excluded(self):
        """Building with construction starting on 15 Sep 1987 (day before cutoff) — excluded."""
        prop = _make_property()
        fy = FinancialYear(2025)
        building = _make_building(
            cost=400_000,
            purchase_date=date(2020, 1, 15),
            construction_start_date=date(1987, 9, 15),
        )
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_building == 0.0

    def test_post_1987_building_on_cutoff_date_included(self):
        """Building with construction starting exactly on 16 Sep 1987 — included."""
        prop = _make_property()
        fy = FinancialYear(2025)
        building = _make_building(
            cost=400_000,
            purchase_date=date(2020, 1, 15),
            construction_start_date=date(1987, 9, 16),
        )
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_building == pytest.approx(10_000, abs=1)

    def test_mixed_pre_and_post_1987_buildings(self):
        """Mix of pre- and post-1987 buildings — only post-1987 should be claimed."""
        prop = _make_property()
        fy = FinancialYear(2025)
        old_building = _make_building(
            name="Old wing", cost=200_000,
            purchase_date=date(2020, 1, 15),
            construction_start_date=date(1980, 1, 1),
        )
        new_building = _make_building(
            name="New wing", cost=400_000,
            purchase_date=date(2020, 1, 15),
            construction_start_date=date(2019, 6, 1),
        )
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[old_building, new_building],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        # Only the $400k new building: $10,000
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
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
        prop = _make_property(is_new=True)
        fy = FinancialYear(2025)
        asset = _make_asset(cost=2_000, life=10, wdv=2_000)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[asset],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_plant > 0

    def test_second_hand_property_assets_excluded(self):
        """Second-hand property — Div 40 assets should be zero."""
        prop = _make_property(is_new=False)
        fy = FinancialYear(2025)
        asset = _make_asset(cost=2_000, life=10, wdv=2_000)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[asset],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_plant == 0.0

    def test_diminishing_value_method(self):
        """Diminishing value: $2,000 asset, 10yr life, full year = $400."""
        prop = _make_property(is_new=True)
        fy = FinancialYear(2025)
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, method=DepreciationMethod.DIMINISHING_VALUE)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[asset],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(400, abs=1)

    def test_prime_cost_method(self):
        """Prime cost: $2,000 asset, 10yr life, full year = $200."""
        prop = _make_property(is_new=True)
        fy = FinancialYear(2025)
        asset = _make_asset(cost=2_000, life=10, wdv=2_000, method=DepreciationMethod.PRIME_COST)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[asset],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_plant == pytest.approx(200, abs=1)

    def test_multiple_assets(self):
        """Multiple assets — deductions should sum."""
        prop = _make_property(is_new=True)
        fy = FinancialYear(2025)
        a1 = _make_asset(name="Aircon", cost=2_000, life=10, wdv=2_000)
        a2 = _make_asset(name="Carpet", cost=3_000, life=8, wdv=3_000)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[a1, a2],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        # Aircon: 2000 * 2/10 = 400, Carpet: 3000 * 2/8 = 750
        assert result.depreciation_plant == pytest.approx(1_150, abs=1)

    def test_asset_expired(self):
        """Asset past effective life — zero depreciation."""
        prop = _make_property(is_new=True, purchase_date=date(2010, 1, 1))
        fy = FinancialYear(2025)
        asset = _make_asset(cost=2_000, life=5, purchase_date=date(2010, 1, 1), wdv=100)
        costs = _make_year_cost(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_cost=0,
            management_fee=0,
        )

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=0,
            depreciable_buildings=[],
            depreciable_assets=[asset],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=50_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        assert result.depreciation_plant == 0.0


# ──────────────────────────────────────────────
# build_tax_deduction_summary — Tax saving
# ──────────────────────────────────────────────

class TestTaxSaving:
    """Tests for tax saving via two-pass tax engine."""

    def test_tax_saving_negatively_geared(self):
        """Negatively geared — tax saving should equal two-pass difference."""
        prop = _make_property()
        fy = FinancialYear(2025)
        costs = _make_year_cost()

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=20_000,
            depreciable_buildings=[_make_building()],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=25_000,
            taxable_income=100_000,
            financial_year=fy,
        )

        expected = calculate_income_tax(100_000) - calculate_income_tax(100_000 + result.net_rental_income)
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=30_000,
            taxable_income=100_000,
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
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=30_000,
            taxable_income=100_000,
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

        # Taxable income at $50,000 (30% bracket), loss of $10,000 pushes to $40,000 (16% bracket boundary)
        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=10_000,
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=0,
            taxable_income=50_000,
            financial_year=fy,
        )

        # Tax saving is NOT simply loss * marginal rate because it spans brackets
        simple_marginal = 10_000 * 0.30
        assert result.tax_saving != pytest.approx(simple_marginal)
        # But it should be the correct two-pass difference
        expected = calculate_income_tax(50_000) - calculate_income_tax(40_000)
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

        result = build_tax_deduction_summary(
            property=prop,
            mortgage_interest=10_000,
            depreciable_buildings=[],
            depreciable_assets=[],
            ongoing_costs=costs,
            rental_income=0,
            taxable_income=20_000,
            financial_year=fy,
        )

        # $20k income, $10k loss → $10k adjusted income, which is in the tax-free threshold
        expected = calculate_income_tax(20_000) - calculate_income_tax(10_000)
        assert result.tax_saving == pytest.approx(expected)
        assert result.tax_saving == calculate_income_tax(20_000)  # $10k is tax-free
