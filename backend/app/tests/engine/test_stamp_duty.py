"""
Tests for multi-state stamp duty engine.

Reference values cross-checked against state revenue office calculators
where available. QLD values match existing test_property.py tests.
"""

import pytest

from app.engine.stamp_duty import calculate_stamp_duty

# ──────────────────────────────────────────────
# QLD
# ──────────────────────────────────────────────


class TestQldGeneral:
    """QLD general (investor) stamp duty brackets."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "QLD") == 0

    def test_within_first_bracket_5k(self):
        """$0–$5,000: 0% rate = $0 duty."""
        assert calculate_stamp_duty(5_000, "QLD") == 0

    def test_within_first_bracket_3k(self):
        assert calculate_stamp_duty(3_000, "QLD") == 0

    def test_at_second_bracket_boundary(self):
        """$75,000: base $0 + 1.5% on ($75,000-$5,000)=$70,000 → $0 + $1,050 = $1,050."""
        assert calculate_stamp_duty(75_000, "QLD") == pytest.approx(1_050.00)

    def test_just_over_first_bracket(self):
        """$5,001 rounds to $5,100 excess = $100. $100 * 1.5% = $1.50."""
        assert calculate_stamp_duty(5_001, "QLD") == pytest.approx(1.50)

    def test_mid_second_bracket(self):
        """$40,000: excess $35,000 → $35,000 * 1.5% = $525."""
        assert calculate_stamp_duty(40_000, "QLD") == pytest.approx(525.00)

    def test_at_third_bracket_boundary(self):
        """$540,000: $1,050 + 3.5% on $465,000 = $1,050 + $16,275 = $17,325."""
        assert calculate_stamp_duty(540_000, "QLD") == pytest.approx(17_325.00)

    def test_mid_third_bracket(self):
        assert calculate_stamp_duty(500_000, "QLD") == pytest.approx(15_925.00)

    def test_at_fourth_bracket_boundary(self):
        """$1,000,000: $17,325 + 4.5% on $460,000 = $17,325 + $20,700 = $38,025."""
        assert calculate_stamp_duty(1_000_000, "QLD") == pytest.approx(38_025.00)

    def test_mid_fourth_bracket(self):
        assert calculate_stamp_duty(750_000, "QLD") == pytest.approx(26_775.00)

    def test_above_top_bracket(self):
        """$2,000,000: $38,025 + 5.75% on $1,000,000 = $38,025 + $57,500 = $95,525."""
        assert calculate_stamp_duty(2_000_000, "QLD") == pytest.approx(95_525.00)

    def test_very_large_price(self):
        assert calculate_stamp_duty(10_000_000, "QLD") > 0

    def test_one_dollar(self):
        """$1 rounds up to $100 in the first bracket (0% rate) = $0."""
        assert calculate_stamp_duty(1, "QLD") == 0


class TestQldPpor:
    """QLD PPOR (home concession) stamp duty brackets."""

    def test_ppor_within_first_bracket(self):
        """$200,000: $200,000 * 1% = $2,000."""
        assert calculate_stamp_duty(200_000, "QLD", is_ppor=True) == pytest.approx(2_000.00)

    def test_ppor_at_first_boundary(self):
        """$350,000: $350,000 * 1% = $3,500."""
        assert calculate_stamp_duty(350_000, "QLD", is_ppor=True) == pytest.approx(3_500.00)

    def test_ppor_500k(self):
        """$500,000: $3,500 + 3.5% on $150,000 = $3,500 + $5,250 = $8,750."""
        assert calculate_stamp_duty(500_000, "QLD", is_ppor=True) == pytest.approx(8_750.00)

    def test_ppor_at_second_boundary(self):
        """$540,000: $3,500 + 3.5% on $190,000 = $3,500 + $6,650 = $10,150."""
        assert calculate_stamp_duty(540_000, "QLD", is_ppor=True) == pytest.approx(10_150.00)

    def test_ppor_750k(self):
        assert calculate_stamp_duty(750_000, "QLD", is_ppor=True) == pytest.approx(19_600.00)

    def test_ppor_1m(self):
        assert calculate_stamp_duty(1_000_000, "QLD", is_ppor=True) == pytest.approx(30_850.00)

    def test_ppor_always_lte_general(self):
        """PPOR should always be <= general rate."""
        for price in [100_000, 300_000, 500_000, 750_000, 1_000_000, 2_000_000]:
            ppor = calculate_stamp_duty(price, "QLD", is_ppor=True)
            general = calculate_stamp_duty(price, "QLD", is_ppor=False)
            assert ppor <= general, f"PPOR > general at ${price:,}"


class TestQldRounding:
    """QLD rounds excess up to nearest $100 before applying rate."""

    def test_exact_100_no_rounding(self):
        """$5,100: excess $100, exactly $100 → $1.50."""
        assert calculate_stamp_duty(5_100, "QLD") == pytest.approx(1.50)

    def test_one_cent_over_rounds_up(self):
        """$5,101: excess $101, rounds to $200 → $3.00."""
        assert calculate_stamp_duty(5_101, "QLD") == pytest.approx(3.00)

    def test_fractional_price(self):
        """$5,050.50: excess $50.50, rounds to $100 → $1.50."""
        assert calculate_stamp_duty(5_050.50, "QLD") == pytest.approx(1.50)


# ──────────────────────────────────────────────
# NSW
# ──────────────────────────────────────────────


class TestNswStampDuty:
    """NSW stamp duty — single rate table, CPI-indexed 2025-26."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "NSW") == 0

    def test_within_first_bracket(self):
        """$10,000: $10,000 * 1.25% = $125 (round up to $100)."""
        # $10,000 excess, ceil(10000/100)=100 units, 100*100*0.0125 = $125
        assert calculate_stamp_duty(10_000, "NSW") == pytest.approx(125.00)

    def test_at_first_boundary(self):
        """$17,000: $17,000 * 1.25% = $212.50 → rounds to $212.50 via ceil."""
        # ceil(17000/100)=170 units, 170*100*0.0125 = $212.50
        assert calculate_stamp_duty(17_000, "NSW") == pytest.approx(212.50)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "NSW") == pytest.approx(16_912.00)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "NSW") == pytest.approx(28_162.00)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "NSW") == pytest.approx(39_412.00)

    def test_ppor_equals_general(self):
        """NSW has no PPOR concession schedule."""
        for price in [200_000, 500_000, 1_000_000]:
            assert calculate_stamp_duty(price, "NSW", is_ppor=True) == calculate_stamp_duty(
                price, "NSW", is_ppor=False
            )

    def test_premium_bracket(self):
        """Above $3,721,000: $186,667 + 7% on excess."""
        duty = calculate_stamp_duty(4_000_000, "NSW")
        # $186,667 + 7% on ($4M - $3,721,000) = $186,667 + 7% on $279,000
        # ceil(279000/100)=2790 units, 2790*100*0.07 = $19,530
        assert duty == pytest.approx(186_667 + 19_530)


# ──────────────────────────────────────────────
# VIC
# ──────────────────────────────────────────────


class TestVicGeneral:
    """VIC general (non-PPOR) stamp duty — percentage rates."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "VIC") == 0

    def test_first_bracket(self):
        """$20,000: 1.4% * $20,000 = $280."""
        assert calculate_stamp_duty(20_000, "VIC") == pytest.approx(280.00)

    def test_at_first_boundary(self):
        """$25,000: 1.4% * $25,000 = $350."""
        assert calculate_stamp_duty(25_000, "VIC") == pytest.approx(350.00)

    def test_second_bracket(self):
        """$80,000: $350 + 2.4% * ($80,000 - $25,000) = $350 + $1,320 = $1,670."""
        assert calculate_stamp_duty(80_000, "VIC") == pytest.approx(1_670.00)

    def test_at_second_boundary(self):
        """$130,000: $350 + 2.4% * $105,000 = $350 + $2,520 = $2,870."""
        assert calculate_stamp_duty(130_000, "VIC") == pytest.approx(2_870.00)

    def test_500k(self):
        """$500,000: $2,870 + 6% * $370,000 = $2,870 + $22,200 = $25,070."""
        assert calculate_stamp_duty(500_000, "VIC") == pytest.approx(25_070.00)

    def test_at_960k(self):
        """$960,000: $2,870 + 6% * $830,000 = $2,870 + $49,800 = $52,670."""
        assert calculate_stamp_duty(960_000, "VIC") == pytest.approx(52_670.00)

    def test_flat_bracket_960001(self):
        """$960,001: 5.5% flat = $52,800.055."""
        assert calculate_stamp_duty(960_001, "VIC") == pytest.approx(52_800.055)

    def test_flat_bracket_1m(self):
        """$1,000,000: 5.5% flat = $55,000."""
        assert calculate_stamp_duty(1_000_000, "VIC") == pytest.approx(55_000.00)

    def test_flat_bracket_1_5m(self):
        """$1,500,000: 5.5% flat = $82,500."""
        assert calculate_stamp_duty(1_500_000, "VIC") == pytest.approx(82_500.00)

    def test_flat_bracket_2m(self):
        """$2,000,000: 5.5% flat = $110,000."""
        assert calculate_stamp_duty(2_000_000, "VIC") == pytest.approx(110_000.00)

    def test_above_2m(self):
        """$2,500,000: $110,000 + 6.5% * $500,000 = $142,500."""
        assert calculate_stamp_duty(2_500_000, "VIC") == pytest.approx(142_500.00)

    def test_5m(self):
        """$5,000,000: $110,000 + 6.5% * $3,000,000 = $305,000."""
        assert calculate_stamp_duty(5_000_000, "VIC") == pytest.approx(305_000.00)


class TestVicPpor:
    """VIC PPOR concession — only applies up to $550,000."""

    def test_ppor_first_bracket(self):
        """$20,000: same as general (1.4%)."""
        assert calculate_stamp_duty(20_000, "VIC", is_ppor=True) == pytest.approx(280.00)

    def test_ppor_at_130k(self):
        """$130,000: same as general ($2,870) — both tables match below $130k."""
        assert calculate_stamp_duty(130_000, "VIC", is_ppor=True) == pytest.approx(2_870.00)

    def test_ppor_300k(self):
        """$300,000: $2,870 + 5% * $170,000 = $2,870 + $8,500 = $11,370."""
        assert calculate_stamp_duty(300_000, "VIC", is_ppor=True) == pytest.approx(11_370.00)

    def test_ppor_440k(self):
        """$440,000: $2,870 + 5% * $310,000 = $2,870 + $15,500 = $18,370."""
        assert calculate_stamp_duty(440_000, "VIC", is_ppor=True) == pytest.approx(18_370.00)

    def test_ppor_500k(self):
        """$500,000: $18,370 + 6% * $60,000 = $18,370 + $3,600 = $21,970."""
        assert calculate_stamp_duty(500_000, "VIC", is_ppor=True) == pytest.approx(21_970.00)

    def test_ppor_550k(self):
        """$550,000: $18,370 + 6% * $110,000 = $18,370 + $6,600 = $24,970."""
        assert calculate_stamp_duty(550_000, "VIC", is_ppor=True) == pytest.approx(24_970.00)

    def test_ppor_above_cap_uses_general(self):
        """Above $550,000: PPOR concession doesn't apply, uses general brackets."""
        for price in [550_001, 600_000, 750_000, 1_000_000]:
            assert calculate_stamp_duty(price, "VIC", is_ppor=True) == calculate_stamp_duty(
                price, "VIC", is_ppor=False
            ), f"PPOR should equal general at ${price:,}"

    def test_ppor_saving_at_500k(self):
        """PPOR saves $3,100 at $500k (5% vs 6% on $130k-$440k band)."""
        saving = (
            calculate_stamp_duty(500_000, "VIC", is_ppor=False)
            - calculate_stamp_duty(500_000, "VIC", is_ppor=True)
        )
        assert saving == pytest.approx(3_100.00)


# ──────────────────────────────────────────────
# WA
# ──────────────────────────────────────────────


class TestWaStampDuty:
    """WA stamp duty — single rate table, per $100 rounding."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "WA") == 0

    def test_first_bracket(self):
        """$50,000: $50,000 * 1.9% = $950."""
        assert calculate_stamp_duty(50_000, "WA") == pytest.approx(950.00)

    def test_at_first_boundary(self):
        """$120,000: $120,000 * 1.9% = $2,280."""
        assert calculate_stamp_duty(120_000, "WA") == pytest.approx(2_280.00)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "WA") == pytest.approx(17_765.00)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "WA") == pytest.approx(29_740.50)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "WA") == pytest.approx(42_615.50)

    def test_ppor_equals_general(self):
        """WA has no PPOR concession schedule."""
        for price in [200_000, 500_000, 1_000_000]:
            assert calculate_stamp_duty(price, "WA", is_ppor=True) == calculate_stamp_duty(
                price, "WA", is_ppor=False
            )


# ──────────────────────────────────────────────
# SA
# ──────────────────────────────────────────────


class TestSaStampDuty:
    """SA stamp duty — single rate table, 9 brackets."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "SA") == 0

    def test_first_bracket(self):
        """$10,000: $10,000 * 1% = $100."""
        assert calculate_stamp_duty(10_000, "SA") == pytest.approx(100.00)

    def test_at_first_boundary(self):
        """$12,000: $12,000 * 1% = $120."""
        assert calculate_stamp_duty(12_000, "SA") == pytest.approx(120.00)

    def test_200k(self):
        """$200,000: $2,830 + 4% on $100,000 = $2,830 + $4,000 = $6,830."""
        assert calculate_stamp_duty(200_000, "SA") == pytest.approx(6_830.00)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "SA") == pytest.approx(21_330.00)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "SA") == pytest.approx(35_080.00)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "SA") == pytest.approx(48_830.00)

    def test_ppor_equals_general(self):
        """SA has no PPOR concession schedule."""
        assert calculate_stamp_duty(500_000, "SA", is_ppor=True) == calculate_stamp_duty(
            500_000, "SA", is_ppor=False
        )


# ──────────────────────────────────────────────
# TAS
# ──────────────────────────────────────────────


class TestTasStampDuty:
    """TAS stamp duty — $50 minimum, per $100 rounding."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "TAS") == 0

    def test_minimum_duty(self):
        """$1,000: flat $50 minimum (first bracket)."""
        assert calculate_stamp_duty(1_000, "TAS") == pytest.approx(50.00)

    def test_at_minimum_boundary(self):
        """$3,000: still flat $50."""
        assert calculate_stamp_duty(3_000, "TAS") == pytest.approx(50.00)

    def test_just_over_minimum(self):
        """$3,001: $50 + 1.75% on $100 (rounded up) = $50 + $1.75 = $51.75."""
        assert calculate_stamp_duty(3_001, "TAS") == pytest.approx(51.75)

    def test_at_second_boundary(self):
        """$25,000: $50 + 1.75% on $22,000 = $50 + $385 = $435."""
        assert calculate_stamp_duty(25_000, "TAS") == pytest.approx(435.00)

    def test_200k(self):
        """$200,000: $1,560 + 3.5% on $125,000 = $1,560 + $4,375 = $5,935."""
        assert calculate_stamp_duty(200_000, "TAS") == pytest.approx(5_935.00)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "TAS") == pytest.approx(18_247.50)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "TAS") == pytest.approx(28_935.00)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "TAS") == pytest.approx(40_185.00)

    def test_ppor_equals_general(self):
        """TAS has no PPOR concession schedule."""
        assert calculate_stamp_duty(500_000, "TAS", is_ppor=True) == calculate_stamp_duty(
            500_000, "TAS", is_ppor=False
        )


# ──────────────────────────────────────────────
# ACT
# ──────────────────────────────────────────────


class TestActGeneral:
    """ACT general (investor/non-PPOR) conveyance duty."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "ACT") == 0

    def test_first_bracket(self):
        """$100,000: $100,000 * 1.2% = $1,200."""
        assert calculate_stamp_duty(100_000, "ACT") == pytest.approx(1_200.00)

    def test_at_first_boundary(self):
        """$200,000: $200,000 * 1.2% = $2,400."""
        assert calculate_stamp_duty(200_000, "ACT") == pytest.approx(2_400.00)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "ACT") == pytest.approx(11_400.00)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "ACT") == pytest.approx(22_200.00)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "ACT") == pytest.approx(32_575.00)

    def test_flat_rate_above_1455k(self):
        """Above $1,455,000: flat 4.54% on total value."""
        assert calculate_stamp_duty(2_000_000, "ACT") == pytest.approx(90_800.00)

    def test_flat_rate_3m(self):
        assert calculate_stamp_duty(3_000_000, "ACT") == pytest.approx(136_200.00)


class TestActPpor:
    """ACT owner-occupier conveyance duty."""

    def test_first_bracket(self):
        """$200,000: $200,000 * 0.28% = $560."""
        assert calculate_stamp_duty(200_000, "ACT", is_ppor=True) == pytest.approx(560.00)

    def test_at_first_boundary(self):
        """$260,000: $260,000 * 0.28% = $728."""
        assert calculate_stamp_duty(260_000, "ACT", is_ppor=True) == pytest.approx(728.00)

    def test_500k(self):
        assert calculate_stamp_duty(500_000, "ACT", is_ppor=True) == pytest.approx(8_408.00)

    def test_750k(self):
        assert calculate_stamp_duty(750_000, "ACT", is_ppor=True) == pytest.approx(19_208.00)

    def test_1m(self):
        assert calculate_stamp_duty(1_000_000, "ACT", is_ppor=True) == pytest.approx(33_958.00)

    def test_ppor_cheaper_than_general_below_750k(self):
        """PPOR should be cheaper than general at lower prices."""
        for price in [200_000, 300_000, 500_000, 750_000]:
            ppor = calculate_stamp_duty(price, "ACT", is_ppor=True)
            general = calculate_stamp_duty(price, "ACT", is_ppor=False)
            assert ppor < general, f"PPOR not cheaper at ${price:,}"

    def test_ppor_more_expensive_at_1m(self):
        """ACT quirk: PPOR rate (5.9%) exceeds general rate (4.15%) in $750k-$1M bracket."""
        ppor = calculate_stamp_duty(1_000_000, "ACT", is_ppor=True)
        general = calculate_stamp_duty(1_000_000, "ACT", is_ppor=False)
        assert ppor > general


# ──────────────────────────────────────────────
# NT
# ──────────────────────────────────────────────


class TestNtFormula:
    """NT quadratic formula for prices up to $525,000."""

    def test_zero(self):
        assert calculate_stamp_duty(0, "NT") == 0

    def test_100k(self):
        """V=100: D = 0.06571441 * 10000 + 15 * 100 = 657.14 + 1500 = 2157.14."""
        assert calculate_stamp_duty(100_000, "NT") == pytest.approx(2_157.14, abs=0.01)

    def test_250k(self):
        """V=250: D = 0.06571441 * 62500 + 15 * 250 = 4107.15 + 3750 = 7857.15."""
        assert calculate_stamp_duty(250_000, "NT") == pytest.approx(7_857.15, abs=0.01)

    def test_500k(self):
        """V=500: D = 0.06571441 * 250000 + 15 * 500 = 16428.60 + 7500 = 23928.60."""
        assert calculate_stamp_duty(500_000, "NT") == pytest.approx(23_928.60, abs=0.01)

    def test_at_formula_threshold(self):
        """$525,000: last price using formula."""
        v = 525
        expected = (0.06571441 * v * v) + (15 * v)
        assert calculate_stamp_duty(525_000, "NT") == pytest.approx(expected, abs=0.01)

    def test_small_price(self):
        """$10,000: V=10: D = 0.06571441 * 100 + 150 = 6.57 + 150 = 156.57."""
        assert calculate_stamp_duty(10_000, "NT") == pytest.approx(156.57, abs=0.01)


class TestNtFlatRates:
    """NT flat rates for prices above $525,000."""

    def test_just_above_threshold(self):
        """$525,001: 4.95% * $525,001 = $25,987.5495."""
        assert calculate_stamp_duty(525_001, "NT") == pytest.approx(25_987.55, abs=0.01)

    def test_750k(self):
        """$750,000: 4.95% = $37,125."""
        assert calculate_stamp_duty(750_000, "NT") == pytest.approx(37_125.00)

    def test_1m(self):
        """$1,000,000: 4.95% = $49,500."""
        assert calculate_stamp_duty(1_000_000, "NT") == pytest.approx(49_500.00)

    def test_3m(self):
        """$3,000,000: 4.95% = $148,500."""
        assert calculate_stamp_duty(3_000_000, "NT") == pytest.approx(148_500.00)

    def test_just_above_3m(self):
        """$3,000,001: 5.75% = $172,500.0575."""
        assert calculate_stamp_duty(3_000_001, "NT") == pytest.approx(172_500.06, abs=0.01)

    def test_5m(self):
        """$5,000,000: 5.75% = $287,500."""
        assert calculate_stamp_duty(5_000_000, "NT") == pytest.approx(287_500.00)

    def test_above_5m(self):
        """$6,000,000: 5.95% = $357,000."""
        assert calculate_stamp_duty(6_000_000, "NT") == pytest.approx(357_000.00)

    def test_ppor_equals_general(self):
        """NT has no PPOR rate schedule."""
        for price in [200_000, 500_000, 750_000]:
            assert calculate_stamp_duty(price, "NT", is_ppor=True) == calculate_stamp_duty(
                price, "NT", is_ppor=False
            )


# ──────────────────────────────────────────────
# Cross-state and edge cases
# ──────────────────────────────────────────────


class TestEdgeCases:
    """Cross-state edge cases and error handling."""

    def test_unknown_state_raises(self):
        with pytest.raises(ValueError, match="Unknown state"):
            calculate_stamp_duty(500_000, "XX")

    def test_negative_price_returns_zero(self):
        assert calculate_stamp_duty(-100, "QLD") == 0

    def test_one_dollar_all_states(self):
        """$1 should return a small non-negative value for all states."""
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "ACT", "NT"]:
            duty = calculate_stamp_duty(1, state)
            assert duty >= 0, f"{state} returned negative duty at $1"

    def test_all_states_positive_at_500k(self):
        """Every state returns positive duty at $500k."""
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "ACT", "NT"]:
            duty = calculate_stamp_duty(500_000, state)
            assert duty > 0, f"{state} returned non-positive duty at $500k"

    def test_all_states_positive_at_1m(self):
        """Every state returns positive duty at $1M."""
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "ACT", "NT"]:
            duty = calculate_stamp_duty(1_000_000, state)
            assert duty > 0, f"{state} returned non-positive duty at $1M"

    def test_ppor_lte_general_most_states(self):
        """PPOR should be <= general for most states at common prices.

        ACT excluded — its PPOR rate exceeds general in the $750k-$1M bracket.
        """
        for state in ["QLD", "NSW", "VIC", "WA", "SA", "TAS", "NT"]:
            for price in [300_000, 500_000, 750_000, 1_000_000]:
                ppor = calculate_stamp_duty(price, state, is_ppor=True)
                general = calculate_stamp_duty(price, state, is_ppor=False)
                assert ppor <= general, f"{state} PPOR > general at ${price:,}"
