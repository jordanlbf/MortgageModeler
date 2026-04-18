"""
Tests for purchase costs service — calculate_purchase_costs.

Comprehensive coverage of stamp duty concessions, grant effects,
LMI, fees, equity schemes, and multi-state scenarios.
"""

import pytest

from app.config.property import (
    DEFAULT_BUILDING_PEST_INSPECTION_FEE,
    DEFAULT_CONVEYANCING_FEE,
    DEFAULT_LOAN_ESTABLISHMENT_FEE,
    QLD_MORTGAGE_REGISTRATION_FEE,
)
from app.engine.stamp_duty import CONCESSION_FNS, calculate_stamp_duty
from app.models.purchase_costs import PurchaseCostsInputs
from app.services.purchase_costs import calculate_purchase_costs

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _make_inputs(**overrides) -> PurchaseCostsInputs:
    """Create inputs with sensible QLD defaults."""
    defaults = dict(
        state="QLD",
        price=600_000,
        deposit_percent=0.10,
        property_type="new",
        buyer_type="individual",
        owner_occupier=True,
        first_home_buyer=True,
        selected_grants=[],
        income=80_000,
        partner_income=0,
    )
    defaults.update(overrides)
    return PurchaseCostsInputs(**defaults)


# ──────────────────────────────────────────────
# Basic scenarios
# ──────────────────────────────────────────────


class TestBasicScenarios:
    """Core purchase costs calculations without grants."""

    def test_zero_price(self):
        b = calculate_purchase_costs(_make_inputs(price=0))
        assert b.total_upfront_cost == 0
        assert b.stamp_duty_base == 0
        assert b.deposit_amount == 0

    def test_no_grants_qld_ppor(self):
        """QLD PPOR, no grants — base duty, LMI, fees."""
        b = calculate_purchase_costs(_make_inputs())
        assert b.stamp_duty_base > 0
        assert b.stamp_duty_concession == 0
        assert b.stamp_duty_payable == b.stamp_duty_base
        assert b.lmi_base > 0
        assert not b.lmi_waived
        assert b.lmi_payable == b.lmi_base
        assert b.total_fees > 0
        assert b.deposit_amount == 60_000
        assert b.lvr == pytest.approx(0.90)

    def test_no_grants_investor(self):
        """Investor uses general (not PPOR) brackets — higher duty."""
        b_ppor = calculate_purchase_costs(_make_inputs(owner_occupier=True))
        b_inv = calculate_purchase_costs(_make_inputs(owner_occupier=False))
        assert b_ppor.stamp_duty_base < b_inv.stamp_duty_base

    def test_stamp_duty_matches_engine(self):
        """Service stamp duty matches direct engine call."""
        b = calculate_purchase_costs(_make_inputs())
        expected = calculate_stamp_duty(600_000, "QLD", is_ppor=True)
        assert b.stamp_duty_base == pytest.approx(expected)

    def test_deposit_calculation(self):
        """Deposit = price * deposit_percent."""
        b = calculate_purchase_costs(_make_inputs(price=500_000, deposit_percent=0.15))
        assert b.deposit_amount == pytest.approx(75_000)

    def test_effective_loan(self):
        """Effective loan = price - deposit (no equity)."""
        b = calculate_purchase_costs(_make_inputs(price=500_000, deposit_percent=0.20))
        assert b.effective_loan_amount == pytest.approx(400_000)

    def test_lvr_calculation(self):
        """LVR = effective_loan / price."""
        b = calculate_purchase_costs(_make_inputs(price=500_000, deposit_percent=0.15))
        assert b.lvr == pytest.approx(0.85)

    def test_total_upfront_arithmetic(self):
        """Total = deposit + stamp duty payable + LMI payable + fees - cash grants."""
        b = calculate_purchase_costs(_make_inputs())
        expected = (
            b.deposit_amount + b.stamp_duty_payable + b.lmi_payable
            + b.total_fees - b.total_grant_savings
        )
        assert b.total_upfront_cost == pytest.approx(expected)


# ──────────────────────────────────────────────
# LMI scenarios
# ──────────────────────────────────────────────


class TestLmi:
    """LMI estimation at various LVR tiers."""

    def test_20_percent_deposit_no_lmi(self):
        """80% LVR → no LMI."""
        b = calculate_purchase_costs(_make_inputs(deposit_percent=0.20))
        assert b.lmi_base == 0
        assert b.lmi_payable == 0
        assert b.lvr == pytest.approx(0.80)

    def test_15_percent_deposit_has_lmi(self):
        """85% LVR → LMI applies."""
        b = calculate_purchase_costs(_make_inputs(deposit_percent=0.15))
        assert b.lmi_base > 0
        assert b.lvr == pytest.approx(0.85)

    def test_10_percent_deposit_higher_lmi(self):
        """90% LVR → higher LMI."""
        b_85 = calculate_purchase_costs(_make_inputs(deposit_percent=0.15))
        b_90 = calculate_purchase_costs(_make_inputs(deposit_percent=0.10))
        assert b_90.lmi_base > b_85.lmi_base

    def test_5_percent_deposit_highest_lmi(self):
        """95% LVR → highest LMI."""
        b_90 = calculate_purchase_costs(_make_inputs(deposit_percent=0.10))
        b_95 = calculate_purchase_costs(_make_inputs(deposit_percent=0.05))
        assert b_95.lmi_base > b_90.lmi_base

    def test_investment_lmi_multiplier(self):
        """Investment LMI is higher than PPOR LMI at same LVR."""
        b_ppor = calculate_purchase_costs(_make_inputs(
            deposit_percent=0.10, owner_occupier=True,
        ))
        b_inv = calculate_purchase_costs(_make_inputs(
            deposit_percent=0.10, owner_occupier=False,
        ))
        assert b_inv.lmi_base > b_ppor.lmi_base

    def test_full_cash_deposit_no_lmi(self):
        """100% deposit → no loan, no LMI."""
        b = calculate_purchase_costs(_make_inputs(deposit_percent=1.0))
        assert b.effective_loan_amount == 0
        assert b.lmi_base == 0
        assert b.lvr == 0


# ──────────────────────────────────────────────
# Fees
# ──────────────────────────────────────────────


class TestFees:
    """Fee calculations use existing engine/property.py functions."""

    def test_legal_fees(self):
        b = calculate_purchase_costs(_make_inputs())
        assert b.purchase_costs.legal_fees == DEFAULT_CONVEYANCING_FEE

    def test_inspection_fees(self):
        b = calculate_purchase_costs(_make_inputs())
        assert b.purchase_costs.building_pest_inspection == DEFAULT_BUILDING_PEST_INSPECTION_FEE

    def test_loan_establishment_fee(self):
        b = calculate_purchase_costs(_make_inputs())
        assert b.borrowing_costs.loan_establishment_fee == DEFAULT_LOAN_ESTABLISHMENT_FEE

    def test_mortgage_registration_fee(self):
        b = calculate_purchase_costs(_make_inputs())
        assert b.borrowing_costs.mortgage_registration_fee == QLD_MORTGAGE_REGISTRATION_FEE

    def test_registration_fee_scales_with_price(self):
        """Title registration fee increases with price."""
        b_low = calculate_purchase_costs(_make_inputs(price=100_000))
        b_high = calculate_purchase_costs(_make_inputs(price=1_000_000))
        assert b_high.purchase_costs.registration_fee > b_low.purchase_costs.registration_fee

    def test_total_fees_is_sum(self):
        """Total fees = all individual fees."""
        b = calculate_purchase_costs(_make_inputs())
        expected = (
            (b.purchase_costs.legal_fees or 0)
            + (b.purchase_costs.registration_fee or 0)
            + (b.purchase_costs.building_pest_inspection or 0)
            + (b.borrowing_costs.mortgage_registration_fee or 0)
            + (b.borrowing_costs.loan_establishment_fee or 0)
        )
        assert b.total_fees == pytest.approx(expected)


# ──────────────────────────────────────────────
# Stamp duty concessions — QLD
# ──────────────────────────────────────────────


class TestQldStampDutyConcessions:
    """QLD stamp duty concession grants."""

    def test_new_home_full_exemption(self):
        """FHB new home concession → $0 duty."""
        b = calculate_purchase_costs(_make_inputs(
            selected_grants=["fhb-stamp-new-qld"],
        ))
        assert b.stamp_duty_concession == b.stamp_duty_base
        assert b.stamp_duty_payable == 0

    def test_existing_under_700k_full_exemption(self):
        b = calculate_purchase_costs(_make_inputs(
            price=600_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld"],
        ))
        assert b.stamp_duty_payable == 0

    def test_existing_at_700k_full_exemption(self):
        b = calculate_purchase_costs(_make_inputs(
            price=700_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld"],
        ))
        assert b.stamp_duty_payable == 0

    def test_existing_at_750k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            price=750_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base
        assert b.stamp_duty_payable > 0

    def test_existing_at_800k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            price=800_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld"],
        ))
        assert b.stamp_duty_concession == 0
        assert b.stamp_duty_payable == b.stamp_duty_base

    def test_vacant_land_full_exemption(self):
        b = calculate_purchase_costs(_make_inputs(
            selected_grants=["fhb-land-qld"],
        ))
        assert b.stamp_duty_payable == 0


# ──────────────────────────────────────────────
# Stamp duty concessions — NSW
# ──────────────────────────────────────────────


class TestNswStampDutyConcessions:
    """NSW stamp duty concession grants."""

    def test_fhb_home_under_800k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=700_000,
            selected_grants=["fhb-stamp-nsw"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_home_at_800k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=800_000,
            selected_grants=["fhb-stamp-nsw"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_home_at_900k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=900_000,
            selected_grants=["fhb-stamp-nsw"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_fhb_home_at_1m_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=1_000_000,
            selected_grants=["fhb-stamp-nsw"],
        ))
        assert b.stamp_duty_concession == 0

    def test_fhb_land_under_350k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=300_000,
            selected_grants=["fhb-land-nsw"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_land_at_400k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=400_000,
            selected_grants=["fhb-land-nsw"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_fhb_land_at_450k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=450_000,
            selected_grants=["fhb-land-nsw"],
        ))
        assert b.stamp_duty_concession == 0


# ──────────────────────────────────────────────
# Stamp duty concessions — VIC
# ──────────────────────────────────────────────


class TestVicStampDutyConcessions:
    """VIC stamp duty concession grants."""

    def test_fhb_under_600k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", price=500_000,
            selected_grants=["fhb-stamp-vic"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_at_600k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", price=600_000,
            selected_grants=["fhb-stamp-vic"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_at_675k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", price=675_000,
            selected_grants=["fhb-stamp-vic"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_fhb_at_750k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", price=750_000,
            selected_grants=["fhb-stamp-vic"],
        ))
        assert b.stamp_duty_concession == 0


# ──────────────────────────────────────────────
# Stamp duty concessions — WA
# ──────────────────────────────────────────────


class TestWaStampDutyConcessions:
    """WA stamp duty concession grants."""

    def test_fhb_home_under_500k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=400_000,
            selected_grants=["fhb-stamp-wa"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_home_at_600k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=600_000,
            selected_grants=["fhb-stamp-wa"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_fhb_home_at_700k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=700_000,
            selected_grants=["fhb-stamp-wa"],
        ))
        assert b.stamp_duty_concession == 0

    def test_fhb_land_under_350k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=300_000,
            selected_grants=["fhb-land-wa"],
        ))
        assert b.stamp_duty_payable == 0

    def test_fhb_land_at_400k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=400_000,
            selected_grants=["fhb-land-wa"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_fhb_land_at_450k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", price=450_000,
            selected_grants=["fhb-land-wa"],
        ))
        assert b.stamp_duty_concession == 0


# ──────────────────────────────────────────────
# Stamp duty concessions — ACT
# ──────────────────────────────────────────────


class TestActStampDutyConcessions:
    """ACT HBCS concession."""

    def test_under_1020k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="ACT", price=800_000,
            selected_grants=["hbcs-act"],
        ))
        assert b.stamp_duty_payable == 0

    def test_at_1020k_full(self):
        b = calculate_purchase_costs(_make_inputs(
            state="ACT", price=1_020_000, deposit_percent=0.20,
            selected_grants=["hbcs-act"],
        ))
        assert b.stamp_duty_payable == 0

    def test_at_1200k_partial(self):
        b = calculate_purchase_costs(_make_inputs(
            state="ACT", price=1_200_000, deposit_percent=0.20,
            selected_grants=["hbcs-act"],
        ))
        assert 0 < b.stamp_duty_concession < b.stamp_duty_base

    def test_at_1455k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="ACT", price=1_455_000, deposit_percent=0.20,
            selected_grants=["hbcs-act"],
        ))
        assert b.stamp_duty_concession == 0

    def test_above_1455k_no_concession(self):
        b = calculate_purchase_costs(_make_inputs(
            state="ACT", price=2_000_000, deposit_percent=0.20,
            selected_grants=["hbcs-act"],
        ))
        assert b.stamp_duty_concession == 0


# ──────────────────────────────────────────────
# Stamp duty — SA, TAS full exemption schemes
# ──────────────────────────────────────────────


class TestFullExemptionSchemes:
    """SA and TAS stamp duty exemptions."""

    def test_sa_fhb_full_exemption(self):
        b = calculate_purchase_costs(_make_inputs(
            state="SA", price=600_000,
            selected_grants=["fhb-stamp-sa"],
        ))
        assert b.stamp_duty_payable == 0

    def test_tas_fhb_full_exemption(self):
        b = calculate_purchase_costs(_make_inputs(
            state="TAS", price=600_000,
            selected_grants=["fhb-stamp-tas"],
        ))
        assert b.stamp_duty_payable == 0


# ──────────────────────────────────────────────
# Best concession wins
# ──────────────────────────────────────────────


class TestBestConcessionWins:
    """Multiple stamp duty concessions — best one applied."""

    def test_exemption_beats_partial_concession(self):
        """Full exemption beats a sliding concession."""
        b = calculate_purchase_costs(_make_inputs(
            price=600_000,
            selected_grants=["fhb-stamp-new-qld", "fhb-stamp-existing-qld"],
        ))
        assert b.stamp_duty_payable == 0

    def test_no_stacking(self):
        """Concessions don't stack — only the best is applied."""
        b_one = calculate_purchase_costs(_make_inputs(
            price=750_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld"],
        ))
        b_both = calculate_purchase_costs(_make_inputs(
            price=750_000, property_type="existing",
            selected_grants=["fhb-stamp-existing-qld", "fhb-stamp-new-qld"],
        ))
        # New home exemption gives full exemption even at $750k
        assert b_both.stamp_duty_payable == 0
        assert b_one.stamp_duty_payable > 0


# ──────────────────────────────────────────────
# Cash grants
# ──────────────────────────────────────────────


class TestCashGrants:
    """Cash grant effects."""

    def test_fhog_qld_30k(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["fhog-qld"]))
        assert b.total_grant_savings == 30_000

    def test_fhog_nsw_10k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", selected_grants=["fhog-nsw"],
        ))
        assert b.total_grant_savings == 10_000

    def test_fhog_vic_10k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", selected_grants=["fhog-vic"],
        ))
        assert b.total_grant_savings == 10_000

    def test_fhog_wa_10k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", selected_grants=["fhog-wa"],
        ))
        assert b.total_grant_savings == 10_000

    def test_fhog_sa_15k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="SA", selected_grants=["fhog-sa"],
        ))
        assert b.total_grant_savings == 15_000

    def test_fhog_tas_30k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="TAS", selected_grants=["fhog-tas"],
        ))
        assert b.total_grant_savings == 30_000

    def test_fhog_nt_new_50k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NT", selected_grants=["fhog-new-nt"],
        ))
        assert b.total_grant_savings == 50_000

    def test_fhog_nt_established_10k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NT", property_type="existing",
            selected_grants=["fhog-established-nt"],
        ))
        assert b.total_grant_savings == 10_000

    def test_freshstart_nt_30k(self):
        b = calculate_purchase_costs(_make_inputs(
            state="NT", selected_grants=["freshstart-nt"],
        ))
        assert b.total_grant_savings == 30_000

    def test_cash_grant_reduces_total(self):
        """Cash grant directly reduces total upfront cost."""
        b_no = calculate_purchase_costs(_make_inputs(selected_grants=[]))
        b_yes = calculate_purchase_costs(_make_inputs(selected_grants=["fhog-qld"]))
        assert b_no.total_upfront_cost - b_yes.total_upfront_cost == pytest.approx(30_000)

    def test_multiple_cash_grants_stack(self):
        """Multiple cash grants add up."""
        b = calculate_purchase_costs(_make_inputs(
            selected_grants=["fhog-qld", "freshstart-nt"],
        ))
        assert b.total_grant_savings == 60_000


# ──────────────────────────────────────────────
# LMI waiver grants
# ──────────────────────────────────────────────


class TestLmiWaiverGrants:
    """LMI waiver from guarantee schemes."""

    def test_fhbg_waives_lmi(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["fhbg"]))
        assert b.lmi_waived
        assert b.lmi_payable == 0
        assert b.lmi_base > 0

    def test_fhg_waives_lmi(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["fhg"]))
        assert b.lmi_waived
        assert b.lmi_payable == 0

    def test_keystart_waives_lmi(self):
        b = calculate_purchase_costs(_make_inputs(
            state="WA", selected_grants=["keystart-wa"],
        ))
        assert b.lmi_waived
        assert b.lmi_payable == 0

    def test_lmi_waiver_saves_money(self):
        """LMI waiver reduces total upfront cost."""
        b_no = calculate_purchase_costs(_make_inputs(selected_grants=[]))
        b_yes = calculate_purchase_costs(_make_inputs(selected_grants=["fhbg"]))
        assert b_no.total_upfront_cost > b_yes.total_upfront_cost
        assert b_no.total_upfront_cost - b_yes.total_upfront_cost == pytest.approx(b_no.lmi_base)


# ──────────────────────────────────────────────
# Deposit reduction
# ──────────────────────────────────────────────


class TestDepositReduction:
    """Minimum deposit percent from grants."""

    def test_fhbg_5_percent(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["fhbg"]))
        assert b.min_deposit_percent == pytest.approx(0.05)

    def test_fhg_2_percent(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["fhg"]))
        assert b.min_deposit_percent == pytest.approx(0.02)

    def test_help_to_buy_2_percent(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["help-to-buy"]))
        assert b.min_deposit_percent == pytest.approx(0.02)

    def test_lowest_deposit_wins(self):
        """Multiple schemes → lowest min deposit."""
        b = calculate_purchase_costs(_make_inputs(
            selected_grants=["fhbg", "fhg"],
        ))
        assert b.min_deposit_percent == pytest.approx(0.02)

    def test_no_grants_zero_min_deposit(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=[]))
        assert b.min_deposit_percent == 0


# ──────────────────────────────────────────────
# Equity contributions
# ──────────────────────────────────────────────


class TestEquityContributions:
    """Government equity schemes."""

    def test_help_to_buy_new_40_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05, property_type="new",
            selected_grants=["help-to-buy"],
        ))
        assert b.equity_contribution == pytest.approx(200_000)
        assert b.effective_loan_amount == pytest.approx(500_000 - 25_000 - 200_000)

    def test_help_to_buy_existing_30_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05, property_type="existing",
            selected_grants=["help-to-buy"],
        ))
        assert b.equity_contribution == pytest.approx(150_000)

    def test_boost_to_buy_new_30_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            price=800_000, deposit_percent=0.05, property_type="new",
            selected_grants=["boost-to-buy-qld"],
        ))
        assert b.equity_contribution == pytest.approx(240_000)

    def test_boost_to_buy_existing_25_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            price=800_000, deposit_percent=0.05, property_type="existing",
            selected_grants=["boost-to-buy-qld"],
        ))
        assert b.equity_contribution == pytest.approx(200_000)

    def test_myhome_tas_40_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            state="TAS", price=500_000, deposit_percent=0.05, property_type="new",
            selected_grants=["myhome-tas"],
        ))
        assert b.equity_contribution == pytest.approx(200_000)

    def test_homestart_sa_25_percent(self):
        b = calculate_purchase_costs(_make_inputs(
            state="SA", price=500_000, deposit_percent=0.05,
            selected_grants=["homestart-sa"],
        ))
        assert b.equity_contribution == pytest.approx(125_000)

    def test_equity_reduces_lvr(self):
        """Equity contribution reduces LVR."""
        b_no = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05,
        ))
        b_eq = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05,
            selected_grants=["help-to-buy"],
        ))
        assert b_eq.lvr < b_no.lvr

    def test_equity_reduces_lmi(self):
        """Equity contribution may eliminate LMI by reducing LVR."""
        b = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05, property_type="new",
            selected_grants=["help-to-buy"],
        ))
        # 5% deposit + 40% equity = 55% of price covered → LVR = 45%
        assert b.lvr == pytest.approx(0.55)
        assert b.lmi_base == 0  # below 80% LVR

    def test_highest_equity_wins(self):
        """Multiple equity schemes → highest contribution used."""
        b = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05, property_type="new",
            selected_grants=["help-to-buy", "boost-to-buy-qld"],
        ))
        # Help to Buy: 40% = $200k. Boost to Buy: 30% = $150k. HTB wins.
        assert b.equity_contribution == pytest.approx(200_000)


# ──────────────────────────────────────────────
# Combined grant packages
# ──────────────────────────────────────────────


class TestCombinedPackages:
    """Real-world grant combinations."""

    def test_qld_fhb_full_package(self):
        """FHOG + new home exemption + FHBG."""
        b = calculate_purchase_costs(_make_inputs(
            price=600_000, deposit_percent=0.10,
            selected_grants=["fhog-qld", "fhb-stamp-new-qld", "fhbg"],
        ))
        assert b.stamp_duty_payable == 0
        assert b.lmi_waived
        assert b.total_grant_savings == 30_000
        assert b.min_deposit_percent == pytest.approx(0.05)
        expected = 60_000 + b.total_fees - 30_000
        assert b.total_upfront_cost == pytest.approx(expected)

    def test_nsw_fhb_package(self):
        """NSW FHOG + stamp duty exemption + FHBG."""
        b = calculate_purchase_costs(_make_inputs(
            state="NSW", price=600_000, deposit_percent=0.10,
            selected_grants=["fhog-nsw", "fhb-stamp-nsw", "fhbg"],
        ))
        assert b.stamp_duty_payable == 0
        assert b.lmi_waived
        assert b.total_grant_savings == 10_000

    def test_vic_fhb_package(self):
        """VIC FHOG + stamp duty exemption."""
        b = calculate_purchase_costs(_make_inputs(
            state="VIC", price=500_000,
            selected_grants=["fhog-vic", "fhb-stamp-vic"],
        ))
        assert b.stamp_duty_payable == 0
        assert b.total_grant_savings == 10_000

    def test_cash_grant_plus_equity(self):
        """Cash grant + equity scheme combined."""
        b = calculate_purchase_costs(_make_inputs(
            price=500_000, deposit_percent=0.05, property_type="new",
            selected_grants=["fhog-qld", "help-to-buy"],
        ))
        assert b.total_grant_savings == 30_000
        assert b.equity_contribution == pytest.approx(200_000)


# ──────────────────────────────────────────────
# Multi-state
# ──────────────────────────────────────────────


class TestMultiState:
    """All states produce valid output."""

    def test_every_state_valid(self):
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "ACT", "NT"]:
            b = calculate_purchase_costs(_make_inputs(state=state))
            assert b.stamp_duty_base > 0, f"{state} zero duty"
            assert b.deposit_amount > 0, f"{state} zero deposit"
            assert b.total_upfront_cost > 0, f"{state} zero total"
            assert b.lvr == pytest.approx(0.90), f"{state} wrong LVR"

    def test_every_state_ppor_lte_general(self):
        """PPOR duty ≤ general for all states (ACT excepted at high prices)."""
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "NT"]:
            b_ppor = calculate_purchase_costs(_make_inputs(state=state, owner_occupier=True))
            b_inv = calculate_purchase_costs(_make_inputs(state=state, owner_occupier=False))
            assert b_ppor.stamp_duty_base <= b_inv.stamp_duty_base, (
                f"{state} PPOR > general"
            )


# ──────────────────────────────────────────────
# Edge cases
# ──────────────────────────────────────────────


class TestEdgeCases:
    """Edge cases and error handling."""

    def test_unknown_grant_id_ignored(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=["nonexistent"]))
        assert len(b.grants_applied) == 0

    def test_empty_grants(self):
        b = calculate_purchase_costs(_make_inputs(selected_grants=[]))
        assert b.stamp_duty_concession == 0
        assert not b.lmi_waived
        assert b.total_grant_savings == 0

    def test_grant_with_no_financial_effect(self):
        """FHSS has no financial effect — should not affect costs."""
        b_no = calculate_purchase_costs(_make_inputs(selected_grants=[]))
        b_fhss = calculate_purchase_costs(_make_inputs(selected_grants=["fhss"]))
        assert b_no.total_upfront_cost == b_fhss.total_upfront_cost


# ──────────────────────────────────────────────
# Concession function registry
# ──────────────────────────────────────────────


class TestConcessionFunctions:
    """Verify concession function registry integrity."""

    def test_all_grant_concession_fns_registered(self):
        """Every concession_fn name in grant config has a function."""
        from app.config.grants.registry import get_all_schemes

        for scheme in get_all_schemes():
            fn_name = scheme.financial_effect.stamp_duty_concession_fn
            if fn_name is not None:
                assert fn_name in CONCESSION_FNS, (
                    f"{scheme.id} references unregistered fn: {fn_name}"
                )

    def test_concession_fns_non_negative(self):
        for name, fn in CONCESSION_FNS.items():
            for price in [100_000, 500_000, 1_000_000]:
                assert fn(price, 10_000) >= 0, f"{name} negative at ${price:,}"

    def test_concession_fns_dont_exceed_base(self):
        for name, fn in CONCESSION_FNS.items():
            for price in [100_000, 500_000, 1_000_000]:
                base = 20_000
                assert fn(price, base) <= base, f"{name} exceeded base at ${price:,}"

    def test_sliding_concession_symmetry(self):
        """All sliding concessions: full at low end, zero at high end."""
        test_cases = [
            ("qld_fhb_existing", 600_000, 800_000),
            ("nsw_fhb_home", 700_000, 1_000_000),
            ("nsw_fhb_land", 300_000, 450_000),
            ("vic_fhb_home", 500_000, 750_000),
            ("wa_fhb_home", 400_000, 700_000),
            ("wa_fhb_land", 300_000, 450_000),
        ]
        for name, low_price, high_price in test_cases:
            fn = CONCESSION_FNS[name]
            assert fn(low_price, 10_000) == 10_000, f"{name} not full at ${low_price:,}"
            assert fn(high_price, 10_000) == 0, f"{name} not zero at ${high_price:,}"
