"""
Tests for Capital Gains Tax engine — calculate_cost_base.
"""

import pytest
from datetime import date

from app.engine.cgt import calculate_cost_base
from app.models.property import Property, PurchaseCosts
from app.models.deductions import DepreciableBuilding, DepreciableAsset, DepreciationMethod


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _make_property(purchase_date=None, purchase_price=500_000, is_new=True,
                   purchase_costs=None, buildings=None, assets=None) -> Property:
    return Property(
        purchase_date=purchase_date or date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=is_new,
        purchase_costs=purchase_costs or PurchaseCosts(),
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


def _make_asset(name="Aircon", cost=2_000, life=10, purchase_date=None) -> DepreciableAsset:
    return DepreciableAsset(
        name=name,
        cost=cost,
        effective_life_years=life,
        purchase_date=purchase_date or date(2020, 1, 15),
    )


# ──────────────────────────────────────────────
# Basic cost base — purchase price only
# ──────────────────────────────────────────────

class TestCostBaseBasic:
    """Tests for cost base with purchase price only (no extras)."""

    def test_purchase_price_only(self):
        """No purchase costs, no buildings, no assets."""
        prop = _make_property(purchase_price=500_000)
        assert calculate_cost_base(prop) == 500_000

    def test_zero_purchase_price(self):
        prop = _make_property(purchase_price=0)
        assert calculate_cost_base(prop) == 0

    def test_large_purchase_price(self):
        prop = _make_property(purchase_price=2_000_000)
        assert calculate_cost_base(prop) == 2_000_000


# ──────────────────────────────────────────────
# Cost base — with purchase costs
# ──────────────────────────────────────────────

class TestCostBaseWithPurchaseCosts:
    """Tests for cost base including acquisition costs."""

    def test_stamp_duty_added(self):
        costs = PurchaseCosts(stamp_duty=15_000)
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        assert calculate_cost_base(prop) == 515_000

    def test_all_cost_base_items_added(self):
        """Stamp duty, legal, inspection, registration, other — all cost base items."""
        costs = PurchaseCosts(
            stamp_duty=15_000,
            legal_fees=2_000,
            building_pest_inspection=600,
            registration_fee=300,
            other_costs=500,
        )
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        assert calculate_cost_base(prop) == pytest.approx(518_400)

    def test_borrowing_costs_excluded_from_cost_base(self):
        """Mortgage registration and loan establishment are borrowing costs, not cost base."""
        costs = PurchaseCosts(
            stamp_duty=15_000,
            mortgage_registration_fee=300,
            loan_establishment_fee=500,
        )
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        # Only stamp duty ($15k) should be in cost base, not the $800 borrowing costs
        assert calculate_cost_base(prop) == 515_000

    def test_only_borrowing_costs_no_impact(self):
        """If only borrowing costs are set, cost base equals purchase price."""
        costs = PurchaseCosts(
            mortgage_registration_fee=300,
            loan_establishment_fee=500,
        )
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        assert calculate_cost_base(prop) == 500_000

    def test_full_purchase_costs(self):
        """All cost fields populated — only cost base items counted."""
        costs = PurchaseCosts(
            stamp_duty=17_000,
            legal_fees=2_000,
            building_pest_inspection=600,
            registration_fee=250,
            mortgage_registration_fee=238,
            loan_establishment_fee=300,
            other_costs=1_000,
        )
        prop = _make_property(purchase_price=600_000, purchase_costs=costs)
        expected = 600_000 + 17_000 + 2_000 + 600 + 250 + 1_000  # excludes 238 + 300
        assert calculate_cost_base(prop) == pytest.approx(expected)


# ──────────────────────────────────────────────
# Cost base — capital improvements (post-purchase buildings)
# ──────────────────────────────────────────────

class TestCostBaseCapitalImprovements:
    """Tests for buildings constructed after property purchase (capital improvements)."""

    def test_post_purchase_building_added(self):
        """Building purchased after property — added to cost base."""
        building = _make_building(cost=50_000, purchase_date=date(2022, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[building])
        assert calculate_cost_base(prop) == 500_000 + 50_000

    def test_original_building_excluded(self):
        """Building purchased on same date as property — not a capital improvement."""
        building = _make_building(cost=400_000, purchase_date=date(2020, 1, 15))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[building])
        assert calculate_cost_base(prop) == 500_000

    def test_building_before_purchase_excluded(self):
        """Building purchased before property — not a capital improvement."""
        building = _make_building(cost=400_000, purchase_date=date(2018, 1, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[building])
        assert calculate_cost_base(prop) == 500_000

    def test_multiple_improvements(self):
        """Multiple post-purchase buildings — all added."""
        b1 = _make_building(name="Extension", cost=80_000, purchase_date=date(2021, 3, 1))
        b2 = _make_building(name="Deck", cost=20_000, purchase_date=date(2023, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[b1, b2])
        assert calculate_cost_base(prop) == 500_000 + 80_000 + 20_000

    def test_mixed_original_and_improvements(self):
        """Mix of original building and capital improvements."""
        original = _make_building(name="Original", cost=400_000, purchase_date=date(2020, 1, 15))
        improvement = _make_building(name="New bathroom", cost=30_000, purchase_date=date(2022, 1, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[original, improvement])
        assert calculate_cost_base(prop) == 500_000 + 30_000

    def test_improvement_day_after_purchase(self):
        """Building purchased one day after property — counts as improvement."""
        building = _make_building(cost=25_000, purchase_date=date(2020, 1, 16))
        prop = _make_property(purchase_date=date(2020, 1, 15), buildings=[building])
        assert calculate_cost_base(prop) == 500_000 + 25_000


# ──────────────────────────────────────────────
# Cost base — non-depreciable second-hand assets
# ──────────────────────────────────────────────

class TestCostBaseNonDepreciableAssets:
    """Tests for second-hand Div 40 assets added to cost base."""

    def test_secondhand_asset_post_2017_added(self):
        """Second-hand asset on post-2017 property — non-depreciable, added to cost base."""
        asset = _make_asset(cost=5_000, purchase_date=date(2018, 1, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[asset])
        assert calculate_cost_base(prop) == 500_000 + 5_000

    def test_owner_installed_asset_post_2017_excluded(self):
        """Owner-installed asset on post-2017 property — depreciable, not in cost base."""
        asset = _make_asset(cost=5_000, purchase_date=date(2020, 1, 15))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[asset])
        assert calculate_cost_base(prop) == 500_000

    def test_secondhand_asset_pre_2017_excluded(self):
        """Second-hand asset on pre-2017 property — grandfathered, depreciable, not in cost base."""
        asset = _make_asset(cost=5_000, purchase_date=date(2014, 1, 1))
        prop = _make_property(purchase_date=date(2016, 3, 1), is_new=False, assets=[asset])
        assert calculate_cost_base(prop) == 500_000

    def test_asset_on_cutoff_date_added(self):
        """Property purchased exactly on 9 May 2017 — second-hand assets blocked."""
        asset = _make_asset(cost=3_000, purchase_date=date(2015, 1, 1))
        prop = _make_property(purchase_date=date(2017, 5, 9), is_new=False, assets=[asset])
        assert calculate_cost_base(prop) == 500_000 + 3_000

    def test_asset_day_before_cutoff_excluded(self):
        """Property purchased 8 May 2017 — second-hand assets grandfathered."""
        asset = _make_asset(cost=3_000, purchase_date=date(2015, 1, 1))
        prop = _make_property(purchase_date=date(2017, 5, 8), is_new=False, assets=[asset])
        assert calculate_cost_base(prop) == 500_000

    def test_multiple_secondhand_assets_post_2017(self):
        """Multiple second-hand assets — all added to cost base."""
        a1 = _make_asset(name="Carpet", cost=3_000, purchase_date=date(2018, 1, 1))
        a2 = _make_asset(name="Blinds", cost=1_500, purchase_date=date(2017, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[a1, a2])
        assert calculate_cost_base(prop) == 500_000 + 3_000 + 1_500

    def test_mixed_depreciable_and_non_depreciable(self):
        """Mix of owner-installed and second-hand assets — only second-hand added."""
        old = _make_asset(name="Old carpet", cost=3_000, purchase_date=date(2018, 1, 1))
        new = _make_asset(name="New aircon", cost=2_000, purchase_date=date(2020, 6, 1))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=False, assets=[old, new])
        assert calculate_cost_base(prop) == 500_000 + 3_000

    def test_new_property_no_assets_added(self):
        """New property — all assets are depreciable, none added to cost base."""
        asset = _make_asset(cost=5_000, purchase_date=date(2020, 1, 15))
        prop = _make_property(purchase_date=date(2020, 1, 15), is_new=True, assets=[asset])
        assert calculate_cost_base(prop) == 500_000


# ──────────────────────────────────────────────
# Cost base — combined scenarios
# ──────────────────────────────────────────────

class TestCostBaseCombined:
    """Tests combining purchase costs, improvements, and non-depreciable assets."""

    def test_all_components(self):
        """Purchase price + purchase costs + improvement + non-depreciable asset."""
        costs = PurchaseCosts(stamp_duty=17_000, legal_fees=2_000)
        improvement = _make_building(name="Extension", cost=80_000, purchase_date=date(2022, 1, 1))
        original = _make_building(name="Original", cost=400_000, purchase_date=date(2020, 1, 15))
        old_asset = _make_asset(name="Carpet", cost=3_000, purchase_date=date(2018, 1, 1))
        new_asset = _make_asset(name="Aircon", cost=2_000, purchase_date=date(2020, 6, 1))

        prop = _make_property(
            purchase_date=date(2020, 1, 15),
            purchase_price=600_000,
            is_new=False,
            purchase_costs=costs,
            buildings=[original, improvement],
            assets=[old_asset, new_asset],
        )

        expected = (
            600_000 +     # purchase price
            19_000 +      # stamp duty + legal (cost base items)
            80_000 +      # capital improvement (post-purchase building)
            3_000         # non-depreciable second-hand asset
        )
        assert calculate_cost_base(prop) == pytest.approx(expected)

    def test_no_extras(self):
        """Plain property with no costs, buildings, or assets."""
        prop = _make_property(purchase_price=500_000)
        assert calculate_cost_base(prop) == 500_000

    def test_realistic_scenario(self):
        """Realistic investment property scenario."""
        costs = PurchaseCosts(
            stamp_duty=8_925,
            legal_fees=2_000,
            building_pest_inspection=600,
            registration_fee=250,
            mortgage_registration_fee=238,
            loan_establishment_fee=300,
        )
        original = _make_building(name="House", cost=250_000, purchase_date=date(2020, 7, 1))
        reno = _make_building(name="Kitchen reno", cost=35_000, purchase_date=date(2023, 3, 15))
        old_aircon = _make_asset(name="Aircon", cost=4_000, purchase_date=date(2019, 1, 1))
        new_blinds = _make_asset(name="Blinds", cost=1_500, purchase_date=date(2020, 8, 1))

        prop = _make_property(
            purchase_date=date(2020, 7, 1),
            purchase_price=300_000,
            is_new=False,
            purchase_costs=costs,
            buildings=[original, reno],
            assets=[old_aircon, new_blinds],
        )

        expected = (
            300_000 +                  # purchase price
            8_925 + 2_000 + 600 + 250 + # cost base purchase costs (excl borrowing)
            35_000 +                   # kitchen reno (post-purchase)
            4_000                      # old aircon (non-depreciable, post-2017)
        )
        assert calculate_cost_base(prop) == pytest.approx(expected)
