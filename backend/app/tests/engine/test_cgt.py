"""
Tests for Capital Gains Tax engine — calculate_cost_base and calculate_cgt.
"""

import pytest
from datetime import date

from app.engine.cgt import calculate_cost_base, calculate_cgt
from app.engine.tax import calculate_total_tax
from app.models.cgt import CGTResult
from app.models.property import Property, PurchaseCosts
from app.models.deductions import DepreciableBuilding, DepreciableAsset, DepreciationMethod
from app.models.tax import TaxProfile


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


def _make_tax_profile(taxable_income=100_000, **overrides) -> TaxProfile:
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

    def test_borrowing_costs_not_on_purchase_costs(self):
        """PurchaseCosts only contains cost base items — no borrowing costs."""
        costs = PurchaseCosts(stamp_duty=15_000)
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        # Only stamp duty in cost base — borrowing costs live on LoanConfig
        assert calculate_cost_base(prop) == 515_000

    def test_all_purchase_cost_fields(self):
        """All PurchaseCosts fields are cost base items."""
        costs = PurchaseCosts(
            stamp_duty=17_000,
            legal_fees=2_000,
            building_pest_inspection=600,
            registration_fee=250,
            other_costs=1_000,
        )
        prop = _make_property(purchase_price=600_000, purchase_costs=costs)
        expected = 600_000 + 17_000 + 2_000 + 600 + 250 + 1_000
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


# ──────────────────────────────────────────────
# calculate_cgt — PPOR exemption
# ──────────────────────────────────────────────

class TestCgtPpor:
    """PPOR properties are CGT-exempt."""

    def test_ppor_zero_cgt_payable(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.cgt_payable == 0

    def test_ppor_net_proceeds_equals_sale_price(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.net_proceeds == 700_000

    def test_ppor_discount_is_zero(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.cgt_discount == 0
        assert result.discounted_gain == 0

    def test_ppor_still_reports_cost_base(self):
        """Cost base should be calculated even for PPOR."""
        costs = PurchaseCosts(stamp_duty=15_000)
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.cost_base == 515_000

    def test_ppor_still_reports_capital_gain(self):
        """Capital gain should be reported even for PPOR."""
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.capital_gain == 200_000

    def test_ppor_capital_loss(self):
        """PPOR with a loss — still zero CGT."""
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 400_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.capital_gain == -100_000
        assert result.cgt_payable == 0
        assert result.net_proceeds == 400_000


# ──────────────────────────────────────────────
# calculate_cgt — 50% discount
# ──────────────────────────────────────────────

class TestCgtDiscount:
    """Tests for the 50% CGT discount based on holding period."""

    def test_discount_applied_over_12_months(self):
        """Held > 365 days — 50% discount applies."""
        prop = _make_property(purchase_date=date(2020, 1, 1), purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2022, 1, 1), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == 200_000
        assert result.cgt_discount == 100_000
        assert result.discounted_gain == 100_000

    def test_no_discount_exactly_365_days(self):
        """Held exactly 365 days — no discount (must be > 365)."""
        prop = _make_property(purchase_date=date(2021, 1, 1), purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2022, 1, 1), _make_tax_profile(), is_ppor=False)
        assert result.cgt_discount == 0
        assert result.discounted_gain == 200_000

    def test_discount_at_366_days(self):
        """Held 366 days — discount applies."""
        prop = _make_property(purchase_date=date(2021, 1, 1), purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2022, 1, 2), _make_tax_profile(), is_ppor=False)
        assert result.cgt_discount == 100_000
        assert result.discounted_gain == 100_000

    def test_no_discount_on_loss(self):
        """Capital loss — no discount regardless of holding period."""
        prop = _make_property(purchase_date=date(2020, 1, 1), purchase_price=500_000)
        result = calculate_cgt(prop, 400_000, date(2025, 1, 1), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == -100_000
        assert result.cgt_discount == 0
        assert result.discounted_gain == 0

    def test_no_discount_short_hold_with_gain(self):
        """Short hold with gain — full gain is assessable."""
        prop = _make_property(purchase_date=date(2020, 6, 1), purchase_price=500_000)
        result = calculate_cgt(prop, 550_000, date(2020, 9, 1), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == 50_000
        assert result.cgt_discount == 0
        assert result.discounted_gain == 50_000


# ──────────────────────────────────────────────
# calculate_cgt — capital gain and loss
# ──────────────────────────────────────────────

class TestCgtGainAndLoss:
    """Tests for capital gain/loss calculation."""

    def test_basic_gain(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == 200_000

    def test_basic_loss(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 450_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == -50_000

    def test_break_even(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 500_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.capital_gain == 0
        assert result.cgt_discount == 0
        assert result.discounted_gain == 0
        assert result.cgt_payable == 0

    def test_gain_accounts_for_purchase_costs(self):
        """Purchase costs increase cost base, reducing capital gain."""
        costs = PurchaseCosts(stamp_duty=15_000, legal_fees=2_000)
        prop = _make_property(purchase_price=500_000, purchase_costs=costs)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.cost_base == 517_000
        assert result.capital_gain == 183_000

    def test_gain_accounts_for_improvements(self):
        """Capital improvements increase cost base."""
        improvement = _make_building(name="Reno", cost=50_000, purchase_date=date(2022, 1, 1))
        prop = _make_property(purchase_price=500_000, buildings=[improvement])
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.cost_base == 550_000
        assert result.capital_gain == 150_000


# ──────────────────────────────────────────────
# calculate_cgt — CGT payable (two-pass tax)
# ──────────────────────────────────────────────

class TestCgtPayable:
    """Tests for CGT payable via two-pass total tax calculation."""

    def test_cgt_payable_positive_gain(self):
        """CGT payable should be > 0 for a capital gain."""
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.cgt_payable > 0

    def test_cgt_payable_zero_on_loss(self):
        """CGT payable should be 0 for a capital loss."""
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 400_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.cgt_payable == 0

    def test_cgt_payable_zero_on_break_even(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 500_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.cgt_payable == 0

    def test_cgt_payable_matches_two_pass(self):
        """CGT payable should equal the two-pass tax difference."""
        prop = _make_property(purchase_price=500_000)
        profile = _make_tax_profile(100_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), profile, is_ppor=False)

        # Manually verify: $200k gain, 50% discount = $100k discounted gain
        tax_without = calculate_total_tax(profile)
        adjusted = TaxProfile(
            taxable_income=100_000 + 100_000,
            repayment_income=100_000 + 100_000,
            mls_income=100_000 + 100_000,
            hecs_balance=0,
            has_private_health=True,
        )
        tax_with = calculate_total_tax(adjusted)
        expected = tax_with - tax_without
        assert result.cgt_payable == pytest.approx(expected)

    def test_higher_income_means_higher_cgt(self):
        """Higher base income should result in higher CGT due to marginal rates."""
        prop = _make_property(purchase_price=500_000)
        low_income = calculate_cgt(prop, 700_000, date(2025, 1, 15),
                                   _make_tax_profile(50_000), is_ppor=False)
        high_income = calculate_cgt(prop, 700_000, date(2025, 1, 15),
                                    _make_tax_profile(200_000), is_ppor=False)
        assert high_income.cgt_payable > low_income.cgt_payable

    def test_discount_reduces_cgt_payable(self):
        """Discounted gain (long hold) should result in less CGT than undiscounted (short hold)."""
        prop = _make_property(purchase_date=date(2020, 1, 1), purchase_price=500_000)
        profile = _make_tax_profile()
        long_hold = calculate_cgt(prop, 700_000, date(2022, 1, 1), profile, is_ppor=False)
        short_hold = calculate_cgt(prop, 700_000, date(2020, 6, 1), profile, is_ppor=False)
        assert long_hold.cgt_payable < short_hold.cgt_payable

    def test_cgt_spans_tax_brackets(self):
        """CGT gain that pushes income across a bracket boundary."""
        prop = _make_property(purchase_price=500_000)
        # $130k base income (30% bracket), $100k discounted gain pushes into 37% and 45%
        profile = _make_tax_profile(130_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), profile, is_ppor=False)
        simple = 100_000 * 0.30
        assert result.cgt_payable != pytest.approx(simple)
        assert result.cgt_payable > simple


# ──────────────────────────────────────────────
# calculate_cgt — net proceeds
# ──────────────────────────────────────────────

class TestCgtNetProceeds:
    """Tests for net proceeds after CGT."""

    def test_net_proceeds_equals_sale_minus_cgt(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.net_proceeds == pytest.approx(700_000 - result.cgt_payable)

    def test_net_proceeds_on_loss(self):
        """Capital loss — net proceeds equals sale price (no CGT)."""
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 400_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.net_proceeds == 400_000

    def test_net_proceeds_less_than_sale_price_on_gain(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=False)
        assert result.net_proceeds < 700_000

    def test_net_proceeds_ppor_equals_sale_price(self):
        prop = _make_property(purchase_price=500_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), _make_tax_profile(), is_ppor=True)
        assert result.net_proceeds == 700_000


# ──────────────────────────────────────────────
# calculate_cgt — combined realistic scenario
# ──────────────────────────────────────────────

class TestCgtRealistic:
    """End-to-end realistic CGT scenarios."""

    def test_investment_property_5_year_hold(self):
        """$500k property, $700k sale after 5 years, $100k income."""
        costs = PurchaseCosts(stamp_duty=8_925, legal_fees=2_000)
        improvement = _make_building(name="Deck", cost=20_000, purchase_date=date(2023, 1, 1))
        prop = _make_property(
            purchase_date=date(2020, 1, 15),
            purchase_price=500_000,
            purchase_costs=costs,
            buildings=[improvement],
        )
        profile = _make_tax_profile(100_000)
        result = calculate_cgt(prop, 700_000, date(2025, 1, 15), profile, is_ppor=False)

        # Cost base: 500k + 8925 + 2000 + 20k = 530,925
        assert result.cost_base == pytest.approx(530_925)
        # Capital gain: 700k - 530,925 = 169,075
        assert result.capital_gain == pytest.approx(169_075)
        # 50% discount (held > 12 months)
        assert result.cgt_discount == pytest.approx(169_075 * 0.5)
        assert result.discounted_gain == pytest.approx(169_075 * 0.5)
        assert result.cgt_payable > 0
        assert result.net_proceeds < 700_000
        assert result.net_proceeds == pytest.approx(700_000 - result.cgt_payable)

    def test_investment_property_with_hecs_no_phi(self):
        """Higher CGT when HECS and MLS are also in play."""
        prop = _make_property(purchase_price=500_000)
        profile_simple = _make_tax_profile(100_000)
        profile_complex = _make_tax_profile(100_000, hecs_balance=25_000, has_private_health=False)

        result_simple = calculate_cgt(prop, 700_000, date(2025, 1, 15), profile_simple, is_ppor=False)
        result_complex = calculate_cgt(prop, 700_000, date(2025, 1, 15), profile_complex, is_ppor=False)

        assert result_complex.cgt_payable >= result_simple.cgt_payable
