"""
Tests for property calculation engine — stamp duty, LMI, registration fees, LVR,
and ongoing property cost calculations.
"""

import pytest

from app.config.property import (
    DEFAULT_BUILDING_PEST_INSPECTION_FEE,
    DEFAULT_CONVEYANCING_FEE,
    DEFAULT_LOAN_ESTABLISHMENT_FEE,
    QLD_MORTGAGE_REGISTRATION_FEE,
    QLD_REGISTRATION_FEE_BASE,
    QLD_REGISTRATION_FEE_PER_10K,
)
from app.engine.property import (
    calculate_building_insurance,
    calculate_building_pest_inspection_fee,
    calculate_conveyancing_fee,
    calculate_council_rates,
    calculate_landlord_insurance,
    calculate_loan_establishment_fee,
    calculate_lvr,
    calculate_maintenance_cost,
    calculate_management_fee,
    calculate_mortgage_registration_fee,
    calculate_property_value,
    calculate_registration_fee,
    calculate_rental_income,
    calculate_strata_fees,
    calculate_water_rates,
    compound_annual_cost,
    estimate_lmi,
    estimate_qld_stamp_duty,
)
from app.engine.stamp_duty import calculate_stamp_duty


class TestQldStampDutyBase:
    """Tests for QLD standard (non-concession) stamp duty brackets."""

    def test_zero_price(self):
        """Zero purchase price should yield zero duty."""
        assert estimate_qld_stamp_duty(0) == 0

    def test_within_first_bracket(self):
        """Purchase price <= $5,000 should yield zero duty."""
        assert estimate_qld_stamp_duty(1_000) == 0
        assert estimate_qld_stamp_duty(5_000) == 0

    def test_at_second_bracket_boundary(self):
        """Purchase price at $75,000 boundary."""
        # $0 + ($75,000 - $5,000) * 1.50 / 100 = $1,050
        assert estimate_qld_stamp_duty(75_000) == pytest.approx(1_050, abs=0.1)

    def test_just_over_first_bracket(self):
        """Purchase price just above $5,000."""
        # Rounds up to $5,100: $0 + ($5,100 - $5,000) * 1.50 / 100 = $1.50
        assert estimate_qld_stamp_duty(5_001) == pytest.approx(1.50, abs=0.1)

    def test_mid_second_bracket(self):
        """Purchase price in second bracket ($5k–$75k)."""
        # $50,000: $0 + ($50,000 - $5,000) * 1.50 / 100 = $675
        assert estimate_qld_stamp_duty(50_000) == pytest.approx(675, abs=0.1)

    def test_at_third_bracket_boundary(self):
        """Purchase price at $540,000 boundary."""
        # $1,050 + ($540,000 - $75,000) * 3.50 / 100 = $1,050 + $16,275 = $17,325
        assert estimate_qld_stamp_duty(540_000) == pytest.approx(17_325, abs=0.1)

    def test_mid_third_bracket(self):
        """Purchase price in third bracket ($75k–$540k)."""
        # $300,000: $1,050 + ($300,000 - $75,000) * 3.50 / 100 = $1,050 + $7,875 = $8,925
        assert estimate_qld_stamp_duty(300_000) == pytest.approx(8_925, abs=0.1)

    def test_at_fourth_bracket_boundary(self):
        """Purchase price at $1,000,000 boundary."""
        # $17,325 + ($1,000,000 - $540,000) * 4.50 / 100 = $17,325 + $20,700 = $38,025
        assert estimate_qld_stamp_duty(1_000_000) == pytest.approx(38_025, abs=0.1)

    def test_mid_fourth_bracket(self):
        """Purchase price in fourth bracket ($540k–$1M)."""
        # $750,000: $17,325 + ($750,000 - $540,000) * 4.50 / 100 = $17,325 + $9,450 = $26,775
        assert estimate_qld_stamp_duty(750_000) == pytest.approx(26_775, abs=0.1)

    def test_above_top_bracket(self):
        """Purchase price above $1,000,000."""
        # $1,500,000: $38,025 + ($1,500,000 - $1,000,000) * 5.75 / 100 = $38,025 + $28,750 = $66,775
        assert estimate_qld_stamp_duty(1_500_000) == pytest.approx(66_775, abs=0.1)

    def test_very_large_price(self):
        """Very large purchase price."""
        # $5,000,000: $38,025 + ($5,000,000 - $1,000,000) * 5.75 / 100 = $38,025 + $230,000 = $268,025
        assert estimate_qld_stamp_duty(5_000_000) == pytest.approx(268_025, abs=0.1)

    def test_is_investment_by_default(self):
        """Default is_investment=True, so base rate applies."""
        assert estimate_qld_stamp_duty(500_000) == estimate_qld_stamp_duty(500_000, is_investment=True)


class TestQldStampDutyRounding:
    """Tests for the $100 rounding-up behaviour."""

    def test_rounds_up_to_nearest_100(self):
        """Prices not on $100 boundary should round up."""
        # $100,001 rounds to $100,100
        # $1,050 + ($100,100 - $75,000) * 3.50 / 100 = $1,050 + $878.50 = $1,928.50
        assert estimate_qld_stamp_duty(100_001) == pytest.approx(1_928.50, abs=0.1)

    def test_exact_100_no_rounding(self):
        """Prices exactly on $100 boundary should not change."""
        # $100,000: $1,050 + ($100,000 - $75,000) * 3.50 / 100 = $1,050 + $875 = $1,925
        assert estimate_qld_stamp_duty(100_000) == pytest.approx(1_925, abs=0.1)

    def test_one_dollar_rounds_to_100(self):
        """$1 should round up to $100, still in first bracket = $0 duty."""
        assert estimate_qld_stamp_duty(1) == 0

    def test_fractional_price_rounds_up(self):
        """Fractional price rounds up to next $100."""
        # $75,000.50 rounds to $75,100
        # $1,050 + ($75,100 - $75,000) * 3.50 / 100 = $1,050 + $3.50 = $1,053.50
        assert estimate_qld_stamp_duty(75_000.50) == pytest.approx(1_053.50, abs=0.1)


class TestQldStampDutyConcession:
    """Tests for QLD home concession (PPOR) stamp duty brackets."""

    def test_concession_zero_price(self):
        """Zero purchase price should yield zero duty."""
        assert estimate_qld_stamp_duty(0, is_investment=False) == 0

    def test_concession_within_first_bracket(self):
        """Purchase price within concession first bracket (<= $350k)."""
        # $200,000: $0 + $200,000 * 1.0 / 100 = $2,000
        assert estimate_qld_stamp_duty(200_000, is_investment=False) == pytest.approx(2_000, abs=0.1)

    def test_concession_at_first_bracket_boundary(self):
        """Purchase price at $350,000 boundary."""
        # $0 + $350,000 * 1.0 / 100 = $3,500
        assert estimate_qld_stamp_duty(350_000, is_investment=False) == pytest.approx(3_500, abs=0.1)

    def test_concession_mid_second_bracket(self):
        """Purchase price in second concession bracket ($350k–$540k)."""
        # $500,000: $3,500 + ($500,000 - $350,000) * 3.50 / 100 = $3,500 + $5,250 = $8,750
        assert estimate_qld_stamp_duty(500_000, is_investment=False) == pytest.approx(8_750, abs=0.1)

    def test_concession_at_second_bracket_boundary(self):
        """Purchase price at $540,000 boundary."""
        # $3,500 + ($540,000 - $350,000) * 3.50 / 100 = $3,500 + $6,650 = $10,150
        assert estimate_qld_stamp_duty(540_000, is_investment=False) == pytest.approx(10_150, abs=0.1)

    def test_concession_mid_third_bracket(self):
        """Purchase price in third concession bracket ($540k–$1M)."""
        # $750,000: $10,150 + ($750,000 - $540,000) * 4.50 / 100 = $10,150 + $9,450 = $19,600
        assert estimate_qld_stamp_duty(750_000, is_investment=False) == pytest.approx(19_600, abs=0.1)

    def test_concession_at_third_bracket_boundary(self):
        """Purchase price at $1,000,000 boundary."""
        # $10,150 + ($1,000,000 - $540,000) * 4.50 / 100 = $10,150 + $20,700 = $30,850
        assert estimate_qld_stamp_duty(1_000_000, is_investment=False) == pytest.approx(30_850, abs=0.1)

    def test_concession_above_top_bracket(self):
        """Purchase price above $1,000,000."""
        # $1,500,000: $30,850 + ($1,500,000 - $1,000,000) * 5.75 / 100 = $30,850 + $28,750 = $59,600
        assert estimate_qld_stamp_duty(1_500_000, is_investment=False) == pytest.approx(59_600, abs=0.1)

    def test_concession_qro_example(self):
        """Verify against the QRO worked example: $550k PPOR."""
        # $10,150 + ($550,000 - $540,000) * 4.50 / 100 = $10,150 + $450 = $10,600
        assert estimate_qld_stamp_duty(550_000, is_investment=False) == pytest.approx(10_600, abs=0.1)


class TestStampDutyConcessionVsBase:
    """Tests verifying concession is always <= base duty."""

    def test_concession_always_less_than_or_equal_base(self):
        """Home concession duty should never exceed base duty."""
        prices = [100_000, 250_000, 350_000, 500_000, 540_000, 750_000, 1_000_000, 1_500_000]
        for price in prices:
            base = estimate_qld_stamp_duty(price, is_investment=True)
            concession = estimate_qld_stamp_duty(price, is_investment=False)
            assert concession <= base, f"Concession ({concession}) > base ({base}) at ${price:,}"

    def test_concession_converges_above_1m(self):
        """Above $1M both brackets use 5.75%, so the gap stays constant."""
        gap_at_1m = estimate_qld_stamp_duty(1_000_000, is_investment=True) - estimate_qld_stamp_duty(
            1_000_000, is_investment=False
        )
        gap_at_2m = estimate_qld_stamp_duty(2_000_000, is_investment=True) - estimate_qld_stamp_duty(
            2_000_000, is_investment=False
        )
        assert gap_at_1m == pytest.approx(gap_at_2m, abs=0.1)


class TestCalculateStampDutyDirect:
    """Tests for calculate_stamp_duty called directly."""

    def test_base_bracket_direct(self):
        """Direct call with general brackets matches estimate_qld_stamp_duty."""
        assert calculate_stamp_duty(500_000, "QLD", is_ppor=False) == estimate_qld_stamp_duty(
            500_000, is_investment=True
        )

    def test_concession_bracket_direct(self):
        """Direct call with PPOR brackets matches estimate_qld_stamp_duty."""
        assert calculate_stamp_duty(500_000, "QLD", is_ppor=True) == estimate_qld_stamp_duty(
            500_000, is_investment=False
        )


class TestEstimateLmi:
    """Tests for LMI estimation."""

    # ── No LMI (LVR ≤ 80%) ──────────────────────────

    def test_no_lmi_at_80_percent(self):
        """LVR at exactly 80% should yield zero LMI."""
        assert estimate_lmi(400_000, 0.80, False) == 0

    def test_no_lmi_below_80_percent(self):
        """LVR below 80% should yield zero LMI."""
        assert estimate_lmi(350_000, 0.70, False) == 0
        assert estimate_lmi(250_000, 0.50, False) == 0

    def test_no_lmi_zero_lvr(self):
        """Zero LVR should yield zero LMI."""
        assert estimate_lmi(500_000, 0.0, False) == 0

    # ── 80–85% LVR band (1.1%) ──────────────────────

    def test_lmi_at_81_percent(self):
        """LVR just above 80% should trigger 1.1% rate."""
        assert estimate_lmi(400_000, 0.81, False) == pytest.approx(4_400, abs=0.1)

    def test_lmi_at_85_percent(self):
        """LVR at exactly 85% boundary."""
        assert estimate_lmi(500_000, 0.85, False) == pytest.approx(5_500, abs=0.1)

    def test_lmi_mid_80_85_band(self):
        """LVR in the middle of 80–85% band."""
        # $600,000 * 0.011 = $6,600
        assert estimate_lmi(600_000, 0.83, False) == pytest.approx(6_600, abs=0.1)

    # ── 85–90% LVR band (2%) ────────────────────────

    def test_lmi_at_86_percent(self):
        """LVR just above 85% should trigger 2% rate."""
        # $400,000 * 0.02 = $8,000
        assert estimate_lmi(400_000, 0.86, False) == pytest.approx(8_000, abs=0.1)

    def test_lmi_at_90_percent(self):
        """LVR at exactly 90% boundary."""
        # $500,000 * 0.02 = $10,000
        assert estimate_lmi(500_000, 0.90, False) == pytest.approx(10_000, abs=0.1)

    def test_lmi_mid_85_90_band(self):
        """LVR in the middle of 85–90% band."""
        # $450,000 * 0.02 = $9,000
        assert estimate_lmi(450_000, 0.88, False) == pytest.approx(9_000, abs=0.1)

    # ── 90–95% LVR band (4.5%) ──────────────────────

    def test_lmi_at_91_percent(self):
        """LVR just above 90% should trigger 4.5% rate."""
        # $400,000 * 0.045 = $18,000
        assert estimate_lmi(400_000, 0.91, False) == pytest.approx(18_000, abs=0.1)

    def test_lmi_at_95_percent(self):
        """LVR at exactly 95% boundary."""
        # $500,000 * 0.045 = $22,500
        assert estimate_lmi(500_000, 0.95, False) == pytest.approx(22_500, abs=0.1)

    def test_lmi_mid_90_95_band(self):
        """LVR in the middle of 90–95% band."""
        # $600,000 * 0.045 = $27,000
        assert estimate_lmi(600_000, 0.93, False) == pytest.approx(27_000, abs=0.1)

    # ── 95–100% LVR band (6%) ───────────────────────

    def test_lmi_at_96_percent(self):
        """LVR just above 95% should trigger 6% rate."""
        # $400,000 * 0.06 = $24,000
        assert estimate_lmi(400_000, 0.96, False) == pytest.approx(24_000, abs=0.1)

    def test_lmi_at_100_percent(self):
        """LVR at exactly 100% boundary."""
        # $500,000 * 0.06 = $30,000
        assert estimate_lmi(500_000, 1.00, False) == pytest.approx(30_000, abs=0.1)

    def test_lmi_mid_95_100_band(self):
        """LVR in the middle of 95–100% band."""
        # $750,000 * 0.06 = $45,000
        assert estimate_lmi(750_000, 0.98, False) == pytest.approx(45_000, abs=0.1)

    # ── Investment property multiplier (1.5x) ────────

    def test_investment_multiplier_80_85(self):
        """Investment property should apply 1.15x multiplier to 80–85% band."""
        owner_occ = estimate_lmi(400_000, 0.85, False)
        investment = estimate_lmi(400_000, 0.85, True)
        assert investment == pytest.approx(owner_occ * 1.15, abs=0.1)

    def test_investment_multiplier_85_90(self):
        """Investment property should apply 1.15x multiplier to 85–90% band."""
        owner_occ = estimate_lmi(500_000, 0.90, False)
        investment = estimate_lmi(500_000, 0.90, True)
        assert investment == pytest.approx(owner_occ * 1.15, abs=0.1)

    def test_investment_multiplier_90_95(self):
        """Investment property should apply 1.15x multiplier to 90–95% band."""
        owner_occ = estimate_lmi(500_000, 0.95, False)
        investment = estimate_lmi(500_000, 0.95, True)
        assert investment == pytest.approx(owner_occ * 1.15, abs=0.1)

    def test_investment_multiplier_95_100(self):
        """Investment property should apply 1.15x multiplier to 95–100% band."""
        owner_occ = estimate_lmi(500_000, 1.00, False)
        investment = estimate_lmi(500_000, 1.00, True)
        assert investment == pytest.approx(owner_occ * 1.15, abs=0.1)

    def test_investment_no_lmi_below_80(self):
        """Investment property with LVR ≤ 80% should still have zero LMI."""
        assert estimate_lmi(400_000, 0.80, True) == 0
        assert estimate_lmi(400_000, 0.70, True) == 0

    def test_investment_specific_values(self):
        """Verify specific investment LMI amounts."""
        # $500,000 loan at 90% LVR: $10,000 * 1.15 = $11,500
        assert estimate_lmi(500_000, 0.90, True) == pytest.approx(11_500, abs=0.1)
        # $400,000 loan at 95% LVR: $18,000 * 1.15 = $20,700
        assert estimate_lmi(400_000, 0.95, True) == pytest.approx(20_700, abs=0.1)

    # ── Edge cases ───────────────────────────────────

    def test_zero_loan_amount(self):
        """Zero loan amount should yield zero LMI regardless of LVR."""
        assert estimate_lmi(0, 0.95, False) == 0
        assert estimate_lmi(0, 0.95, True) == 0

    def test_very_large_loan(self):
        """Very large loan amount."""
        # $2,000,000 * 0.045 = $90,000
        assert estimate_lmi(2_000_000, 0.95, False) == pytest.approx(90_000, abs=0.1)

    def test_lmi_increases_with_lvr(self):
        """Higher LVR should always result in equal or higher LMI for same loan amount."""
        loan = 500_000
        lvrs = [0.70, 0.80, 0.85, 0.90, 0.95, 1.00]
        lmi_amounts = [estimate_lmi(loan, lvr, False) for lvr in lvrs]
        for i in range(1, len(lmi_amounts)):
            assert lmi_amounts[i] >= lmi_amounts[i - 1], (
                f"LMI at {lvrs[i]} ({lmi_amounts[i]}) < LMI at {lvrs[i - 1]} ({lmi_amounts[i - 1]})"
            )

    def test_lmi_scales_linearly_with_loan(self):
        """Doubling the loan amount should double the LMI."""
        lmi_small = estimate_lmi(250_000, 0.90, False)
        lmi_large = estimate_lmi(500_000, 0.90, False)
        assert lmi_large == pytest.approx(lmi_small * 2, abs=0.1)


class TestRegistrationFee:
    """Tests for QLD title registration fee calculation."""

    def test_at_or_below_threshold(self):
        """Properties at or below $180k should pay base fee only."""
        assert calculate_registration_fee(100_000) == QLD_REGISTRATION_FEE_BASE
        assert calculate_registration_fee(180_000) == QLD_REGISTRATION_FEE_BASE

    def test_zero_price(self):
        """Zero purchase price should yield base fee."""
        assert calculate_registration_fee(0) == QLD_REGISTRATION_FEE_BASE

    def test_just_over_threshold(self):
        """$1 over threshold rounds up to one $10k unit."""
        expected = QLD_REGISTRATION_FEE_BASE + QLD_REGISTRATION_FEE_PER_10K
        assert calculate_registration_fee(180_001) == pytest.approx(expected, abs=0.01)

    def test_exact_10k_over_threshold(self):
        """Exact $10k over threshold = 1 unit."""
        expected = QLD_REGISTRATION_FEE_BASE + QLD_REGISTRATION_FEE_PER_10K
        assert calculate_registration_fee(190_000) == pytest.approx(expected, abs=0.01)

    def test_typical_property(self):
        """$600k property: ($600k - $180k) / $10k = 42 units."""
        expected = QLD_REGISTRATION_FEE_BASE + 42 * QLD_REGISTRATION_FEE_PER_10K
        assert calculate_registration_fee(600_000) == pytest.approx(expected, abs=0.01)

    def test_rounds_up_partial_10k(self):
        """$200,001: excess = $20,001, rounds up to 3 units."""
        expected = QLD_REGISTRATION_FEE_BASE + 3 * QLD_REGISTRATION_FEE_PER_10K
        assert calculate_registration_fee(200_001) == pytest.approx(expected, abs=0.01)

    def test_large_property(self):
        """$1.5M property: ($1.5M - $180k) / $10k = 132 units."""
        expected = QLD_REGISTRATION_FEE_BASE + 132 * QLD_REGISTRATION_FEE_PER_10K
        assert calculate_registration_fee(1_500_000) == pytest.approx(expected, abs=0.01)

    def test_increases_with_price(self):
        """Registration fee should increase with purchase price."""
        assert calculate_registration_fee(500_000) > calculate_registration_fee(300_000)
        assert calculate_registration_fee(1_000_000) > calculate_registration_fee(500_000)


class TestFlatFees:
    """Tests for flat fee functions returning config defaults."""

    def test_mortgage_registration_fee(self):
        assert calculate_mortgage_registration_fee() == QLD_MORTGAGE_REGISTRATION_FEE

    def test_conveyancing_fee(self):
        assert calculate_conveyancing_fee() == DEFAULT_CONVEYANCING_FEE

    def test_building_pest_inspection_fee(self):
        assert calculate_building_pest_inspection_fee() == DEFAULT_BUILDING_PEST_INSPECTION_FEE

    def test_loan_establishment_fee(self):
        assert calculate_loan_establishment_fee() == DEFAULT_LOAN_ESTABLISHMENT_FEE


class TestCalculateLvr:
    """Tests for LVR calculation."""

    def test_80_percent_lvr(self):
        """20% deposit on $500k = 80% LVR."""
        assert calculate_lvr(500_000, 100_000) == pytest.approx(0.80, abs=0.001)

    def test_95_percent_lvr(self):
        """5% deposit on $500k = 95% LVR."""
        assert calculate_lvr(500_000, 25_000) == pytest.approx(0.95, abs=0.001)

    def test_100_percent_lvr(self):
        """Zero deposit = 100% LVR."""
        assert calculate_lvr(500_000, 0) == pytest.approx(1.0, abs=0.001)

    def test_zero_lvr(self):
        """Full cash purchase = 0% LVR."""
        assert calculate_lvr(500_000, 500_000) == pytest.approx(0.0, abs=0.001)

    def test_zero_purchase_price(self):
        """Zero purchase price should return 0 (not divide by zero)."""
        assert calculate_lvr(0, 0) == 0.0

    def test_50_percent_lvr(self):
        """50% deposit = 50% LVR."""
        assert calculate_lvr(600_000, 300_000) == pytest.approx(0.50, abs=0.001)

    def test_small_deposit(self):
        """$1 deposit on $1M."""
        assert calculate_lvr(1_000_000, 1) == pytest.approx(0.999999, abs=0.001)


# ─────────────────────────────────────────────────────────────────────────────────
# ----------------------ON-GOING PROPERTY COST CALCULATIONS------------------------
# ─────────────────────────────────────────────────────────────────────────────────


class TestCalculatePropertyValue:
    """Tests for property value appreciation."""

    def test_year_0_no_growth(self):
        assert calculate_property_value(0, 500_000, 0.0) == pytest.approx(500_000)

    def test_year_0_with_growth(self):
        """Year 0 uses exponent 0, so no growth applied yet."""
        assert calculate_property_value(0, 500_000, 0.05) == pytest.approx(500_000)

    def test_year_1(self):
        assert calculate_property_value(1, 500_000, 0.05) == pytest.approx(525_000)

    def test_year_4(self):
        # 500,000 * 1.05^4 = 607,753.12
        assert calculate_property_value(4, 500_000, 0.05) == pytest.approx(607_753.12, abs=0.01)

    def test_year_9(self):
        # 500,000 * 1.05^9 = 775,664.11
        assert calculate_property_value(9, 500_000, 0.05) == pytest.approx(775_664.11, abs=0.01)

    def test_zero_purchase_price(self):
        assert calculate_property_value(4, 0.0, 0.05) == 0.0

    def test_zero_growth(self):
        assert calculate_property_value(9, 500_000, 0.0) == pytest.approx(500_000)

    def test_high_growth(self):
        # 500,000 * 1.10^4 = 732,050.00
        assert calculate_property_value(4, 500_000, 0.10) == pytest.approx(732_050.00, abs=0.01)


class TestCalculateRentalIncome:
    """Tests for rental income with vacancy and growth."""

    def test_year_0_basic(self):
        """$500/week, 2 weeks vacant = $500 * 50 = $25,000."""
        assert calculate_rental_income(0, 500, 2, 0.0) == pytest.approx(25_000)

    def test_year_0_no_vacancy(self):
        """$500/week, 0 weeks vacant = $500 * 52 = $26,000."""
        assert calculate_rental_income(0, 500, 0, 0.0) == pytest.approx(26_000)

    def test_year_0_high_vacancy(self):
        """$500/week, 10 weeks vacant = $500 * 42 = $21,000."""
        assert calculate_rental_income(0, 500, 10, 0.0) == pytest.approx(21_000)

    def test_year_1_with_growth(self):
        """$500/week, 2 weeks vacant, 3% growth: $25,000 * 1.03 = $25,750."""
        assert calculate_rental_income(1, 500, 2, 0.03) == pytest.approx(25_750)

    def test_year_4_with_growth(self):
        """$500/week, 2 weeks vacant, 3% growth: $25,000 * 1.03^4 = $28,137.72."""
        assert calculate_rental_income(4, 500, 2, 0.03) == pytest.approx(28_137.72, abs=0.01)

    def test_zero_rent(self):
        assert calculate_rental_income(4, 0, 2, 0.03) == 0.0

    def test_full_vacancy(self):
        """52 weeks vacant = no income."""
        assert calculate_rental_income(0, 500, 52, 0.03) == 0.0

    def test_zero_growth(self):
        """No growth means same income every year."""
        assert calculate_rental_income(0, 500, 2, 0.0) == calculate_rental_income(9, 500, 2, 0.0)

    def test_income_increases_with_year(self):
        """Rental income should grow year-over-year when growth > 0."""
        for yr in range(0, 9):
            assert calculate_rental_income(yr + 1, 500, 2, 0.03) > calculate_rental_income(yr, 500, 2, 0.03)


class TestCompoundAnnualCost:
    """Tests for the generic compounding function."""

    def test_year_0(self):
        """Year 0 returns the base rate (exponent = 0)."""
        assert compound_annual_cost(0, 2_000, 0.025) == pytest.approx(2_000)

    def test_year_1(self):
        assert compound_annual_cost(1, 2_000, 0.025) == pytest.approx(2_050)

    def test_year_9(self):
        # 2,000 * 1.025^9 = 2,497.73
        assert compound_annual_cost(9, 2_000, 0.025) == pytest.approx(2_497.73, abs=0.01)

    def test_zero_base(self):
        assert compound_annual_cost(4, 0.0, 0.025) == 0.0

    def test_zero_growth(self):
        assert compound_annual_cost(9, 2_000, 0.0) == pytest.approx(2_000)

    def test_high_growth(self):
        # 2,000 * 1.10^4 = 2,928.20
        assert compound_annual_cost(4, 2_000, 0.10) == pytest.approx(2_928.20, abs=0.01)


class TestCouncilRates:
    """Tests for council rates — delegates to compound_annual_cost."""

    def test_year_0(self):
        assert calculate_council_rates(0, 1_800, 0.025) == pytest.approx(1_800)

    def test_year_4(self):
        assert calculate_council_rates(4, 1_800, 0.025) == pytest.approx(compound_annual_cost(4, 1_800, 0.025))

    def test_matches_compound(self):
        """Should always equal compound_annual_cost for same inputs."""
        for yr in range(10):
            assert calculate_council_rates(yr, 2_000, 0.03) == pytest.approx(compound_annual_cost(yr, 2_000, 0.03))


class TestWaterRates:
    """Tests for water rates — delegates to compound_annual_cost."""

    def test_year_0(self):
        assert calculate_water_rates(0, 1_200, 0.025) == pytest.approx(1_200)

    def test_year_4(self):
        assert calculate_water_rates(4, 1_200, 0.025) == pytest.approx(compound_annual_cost(4, 1_200, 0.025))

    def test_matches_compound(self):
        for yr in range(10):
            assert calculate_water_rates(yr, 1_200, 0.03) == pytest.approx(compound_annual_cost(yr, 1_200, 0.03))


class TestBuildingInsurance:
    """Tests for building insurance — delegates to compound_annual_cost."""

    def test_year_0(self):
        assert calculate_building_insurance(0, 1_500, 0.025) == pytest.approx(1_500)

    def test_year_4(self):
        assert calculate_building_insurance(4, 1_500, 0.025) == pytest.approx(compound_annual_cost(4, 1_500, 0.025))

    def test_matches_compound(self):
        for yr in range(10):
            assert calculate_building_insurance(yr, 1_500, 0.03) == pytest.approx(compound_annual_cost(yr, 1_500, 0.03))


class TestStrataFees:
    """Tests for strata fees — delegates to compound_annual_cost."""

    def test_year_0(self):
        assert calculate_strata_fees(0, 3_000, 0.025) == pytest.approx(3_000)

    def test_year_4(self):
        assert calculate_strata_fees(4, 3_000, 0.025) == pytest.approx(compound_annual_cost(4, 3_000, 0.025))

    def test_zero_strata(self):
        """No strata = 0 every year."""
        assert calculate_strata_fees(9, 0.0, 0.025) == 0.0

    def test_matches_compound(self):
        for yr in range(10):
            assert calculate_strata_fees(yr, 3_000, 0.03) == pytest.approx(compound_annual_cost(yr, 3_000, 0.03))


class TestLandlordInsurance:
    """Tests for landlord insurance — investment only."""

    def test_investment_year_0(self):
        assert calculate_landlord_insurance(0, 1_000, 0.025, True) == pytest.approx(1_000)

    def test_investment_year_4(self):
        assert calculate_landlord_insurance(4, 1_000, 0.025, True) == pytest.approx(
            compound_annual_cost(4, 1_000, 0.025)
        )

    def test_ppor_returns_zero(self):
        """PPOR should always return 0 regardless of inputs."""
        assert calculate_landlord_insurance(0, 1_000, 0.025, False) == 0.0
        assert calculate_landlord_insurance(4, 1_000, 0.025, False) == 0.0
        assert calculate_landlord_insurance(9, 5_000, 0.10, False) == 0.0

    def test_investment_grows_over_time(self):
        for yr in range(0, 9):
            assert calculate_landlord_insurance(yr + 1, 1_000, 0.025, True) > calculate_landlord_insurance(
                yr, 1_000, 0.025, True
            )

    def test_zero_base_investment(self):
        assert calculate_landlord_insurance(4, 0.0, 0.025, True) == 0.0


class TestMaintenanceCost:
    """Tests for maintenance cost — based on appreciated property value."""

    def test_year_0(self):
        """Year 0: $500k * 1% = $5,000."""
        assert calculate_maintenance_cost(0, 500_000, 0.01, 0.05) == pytest.approx(5_000)

    def test_year_1(self):
        """Year 1: $525k * 1% = $5,250."""
        assert calculate_maintenance_cost(1, 500_000, 0.01, 0.05) == pytest.approx(5_250)

    def test_year_4(self):
        """Year 4: property_value * 1%."""
        prop_val = calculate_property_value(4, 500_000, 0.05)
        assert calculate_maintenance_cost(4, 500_000, 0.01, 0.05) == pytest.approx(prop_val * 0.01)

    def test_zero_maintenance_rate(self):
        assert calculate_maintenance_cost(4, 500_000, 0.0, 0.05) == 0.0

    def test_zero_purchase_price(self):
        assert calculate_maintenance_cost(4, 0.0, 0.01, 0.05) == 0.0

    def test_no_property_growth(self):
        """Without growth, maintenance stays flat."""
        assert calculate_maintenance_cost(0, 500_000, 0.01, 0.0) == calculate_maintenance_cost(9, 500_000, 0.01, 0.0)

    def test_increases_with_property_growth(self):
        """Maintenance should grow as property appreciates."""
        for yr in range(0, 9):
            assert calculate_maintenance_cost(yr + 1, 500_000, 0.01, 0.05) > calculate_maintenance_cost(
                yr, 500_000, 0.01, 0.05
            )

    def test_scales_with_rate(self):
        """Higher maintenance rate = higher cost."""
        low = calculate_maintenance_cost(4, 500_000, 0.005, 0.05)
        high = calculate_maintenance_cost(4, 500_000, 0.02, 0.05)
        assert high > low


class TestManagementFee:
    """Tests for management fee — investment only, based on rental income."""

    def test_investment_year_0(self):
        """$500/week, 2 weeks vacant, 8% fee: $25,000 * 0.08 = $2,000."""
        assert calculate_management_fee(0, 500, 2, 0.08, 0.03, True) == pytest.approx(2_000)

    def test_investment_year_1(self):
        """Year 1: $25,750 * 0.08 = $2,060."""
        assert calculate_management_fee(1, 500, 2, 0.08, 0.03, True) == pytest.approx(2_060)

    def test_investment_year_4(self):
        """Should equal rental_income(year 4) * management_rate."""
        rental = calculate_rental_income(4, 500, 2, 0.03)
        assert calculate_management_fee(4, 500, 2, 0.08, 0.03, True) == pytest.approx(rental * 0.08)

    def test_ppor_returns_zero(self):
        """PPOR should always return 0."""
        assert calculate_management_fee(0, 500, 2, 0.08, 0.03, False) == 0.0
        assert calculate_management_fee(4, 500, 2, 0.08, 0.03, False) == 0.0
        assert calculate_management_fee(9, 1_000, 0, 0.10, 0.05, False) == 0.0

    def test_zero_rent(self):
        assert calculate_management_fee(4, 0, 2, 0.08, 0.03, True) == 0.0

    def test_full_vacancy(self):
        assert calculate_management_fee(4, 500, 52, 0.08, 0.03, True) == 0.0

    def test_zero_management_rate(self):
        assert calculate_management_fee(4, 500, 2, 0.0, 0.03, True) == 0.0

    def test_investment_grows_over_time(self):
        for yr in range(0, 9):
            assert calculate_management_fee(yr + 1, 500, 2, 0.08, 0.03, True) > calculate_management_fee(
                yr, 500, 2, 0.08, 0.03, True
            )

    def test_scales_with_management_rate(self):
        low = calculate_management_fee(4, 500, 2, 0.05, 0.03, True)
        high = calculate_management_fee(4, 500, 2, 0.10, 0.03, True)
        assert high > low


class TestInputValidation:
    """Tests for ValueError guards on invalid inputs."""

    def test_property_value_negative_year(self):
        with pytest.raises(ValueError, match="year must be >= 0"):
            calculate_property_value(-1, 500_000, 0.05)

    def test_rental_income_negative_year(self):
        with pytest.raises(ValueError, match="year must be >= 0"):
            calculate_rental_income(-1, 500, 2, 0.03)

    def test_rental_income_negative_vacancy_weeks(self):
        with pytest.raises(ValueError, match="vacancy_weeks must be between 0 and 52"):
            calculate_rental_income(0, 500, -1, 0.03)

    def test_rental_income_excess_vacancy_weeks(self):
        with pytest.raises(ValueError, match="vacancy_weeks must be between 0 and 52"):
            calculate_rental_income(0, 500, 53, 0.03)

    def test_compound_annual_cost_negative_year(self):
        with pytest.raises(ValueError, match="year must be >= 0"):
            compound_annual_cost(-1, 2_000, 0.025)

    def test_stamp_duty_unknown_state(self):
        """Unknown state should raise ValueError."""
        with pytest.raises(ValueError, match="Unknown state"):
            calculate_stamp_duty(200_000, "XX")

    def test_council_rates_negative_year(self):
        """Delegates to compound_annual_cost, so the guard should propagate."""
        with pytest.raises(ValueError, match="year must be >= 0"):
            calculate_council_rates(-1, 1_800, 0.025)

    def test_management_fee_negative_year(self):
        """Management fee calls calculate_rental_income, so the guard should propagate."""
        with pytest.raises(ValueError, match="year must be >= 0"):
            calculate_management_fee(-1, 500, 2, 0.08, 0.03, True)

    def test_maintenance_cost_negative_year(self):
        """Maintenance cost calls calculate_property_value, so the guard should propagate."""
        with pytest.raises(ValueError, match="year must be >= 0"):
            calculate_maintenance_cost(-1, 500_000, 0.01, 0.05)
