"""
Tests for property calculation engine — stamp duty, LMI, registration fees, and total upfront costs.
"""

import pytest

from app.engine.property import (
    calculate_qld_stamp_duty_with_bracket,
    estimate_qld_stamp_duty,
    estimate_lmi,
    calculate_registration_fee,
    calculate_mortgage_registration_fee,
    calculate_conveyancing_fee,
    calculate_building_pest_inspection_fee,
    calculate_loan_establishment_fee,
    calculate_total_upfront_costs,
    calculate_lvr,
)
from app.config.property import (
    QLD_STAMP_DUTY_BASE_BRACKETS,
    QLD_STAMP_DUTY_CONCESSION_BRACKETS,
    QLD_REGISTRATION_FEE_BASE,
    QLD_REGISTRATION_FEE_PER_10K,
    QLD_MORTGAGE_REGISTRATION_FEE,
    DEFAULT_CONVEYANCING_FEE,
    DEFAULT_BUILDING_PEST_INSPECTION_FEE,
    DEFAULT_LOAN_ESTABLISHMENT_FEE,
)


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
        gap_at_1m = (
            estimate_qld_stamp_duty(1_000_000, is_investment=True)
            - estimate_qld_stamp_duty(1_000_000, is_investment=False)
        )
        gap_at_2m = (
            estimate_qld_stamp_duty(2_000_000, is_investment=True)
            - estimate_qld_stamp_duty(2_000_000, is_investment=False)
        )
        assert gap_at_1m == pytest.approx(gap_at_2m, abs=0.1)


class TestCalculateWithBracketDirect:
    """Tests for calculate_qld_stamp_duty_with_bracket called directly."""

    def test_base_bracket_direct(self):
        """Direct call with base brackets matches estimate_qld_stamp_duty."""
        assert calculate_qld_stamp_duty_with_bracket(500_000, QLD_STAMP_DUTY_BASE_BRACKETS) == \
            estimate_qld_stamp_duty(500_000, is_investment=True)

    def test_concession_bracket_direct(self):
        """Direct call with concession brackets matches estimate_qld_stamp_duty."""
        assert calculate_qld_stamp_duty_with_bracket(500_000, QLD_STAMP_DUTY_CONCESSION_BRACKETS) == \
            estimate_qld_stamp_duty(500_000, is_investment=False)


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
            assert lmi_amounts[i] >= lmi_amounts[i - 1], \
                f"LMI at {lvrs[i]} ({lmi_amounts[i]}) < LMI at {lvrs[i-1]} ({lmi_amounts[i-1]})"

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


class TestTotalUpfrontCosts:
    """Tests for calculate_total_upfront_costs."""

    def test_returns_float(self):
        """Should return a float."""
        result = calculate_total_upfront_costs(500_000, 100_000, is_investment=False)
        assert isinstance(result, float)

    def test_equals_sum_of_components(self):
        """Total should equal the sum of all individual fee functions."""
        price, deposit = 600_000, 120_000
        loan = price - deposit
        lvr = loan / price

        expected = (
            estimate_qld_stamp_duty(price, is_investment=True) +
            calculate_registration_fee(price) +
            calculate_mortgage_registration_fee() +
            calculate_conveyancing_fee() +
            calculate_building_pest_inspection_fee() +
            calculate_loan_establishment_fee() +
            estimate_lmi(loan, lvr, is_investment=True)
        )
        assert calculate_total_upfront_costs(price, deposit, is_investment=True) == pytest.approx(expected, abs=0.01)

    def test_lmi_exempt_reduces_total(self):
        """lmi_exempt=True should yield a lower total than lmi_exempt=False at high LVR."""
        with_lmi = calculate_total_upfront_costs(500_000, 25_000, is_investment=False, lmi_exempt=False)
        without_lmi = calculate_total_upfront_costs(500_000, 25_000, is_investment=False, lmi_exempt=True)
        assert with_lmi > without_lmi

    def test_investment_higher_than_ppor(self):
        """Investment property should have higher total (higher stamp duty + LMI multiplier)."""
        investment = calculate_total_upfront_costs(500_000, 50_000, is_investment=True)
        ppor = calculate_total_upfront_costs(500_000, 50_000, is_investment=False)
        assert investment > ppor

    def test_no_lmi_at_80_lvr(self):
        """80% LVR should not include LMI in total."""
        total_80 = calculate_total_upfront_costs(500_000, 100_000, is_investment=False)
        total_80_exempt = calculate_total_upfront_costs(500_000, 100_000, is_investment=False, lmi_exempt=True)
        assert total_80 == pytest.approx(total_80_exempt, abs=0.01)

    def test_zero_purchase_price(self):
        """Zero purchase price should not raise an error."""
        result = calculate_total_upfront_costs(0, 0, is_investment=False)
        assert isinstance(result, float)

    def test_lmi_exempt_default_false(self):
        """lmi_exempt should default to False."""
        with_default = calculate_total_upfront_costs(500_000, 25_000, is_investment=False)
        explicit_false = calculate_total_upfront_costs(500_000, 25_000, is_investment=False, lmi_exempt=False)
        assert with_default == pytest.approx(explicit_false, abs=0.01)


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
