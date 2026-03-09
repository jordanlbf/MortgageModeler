"""
Tests for property calculation engine — stamp duty.
"""

import pytest

from app.engine.property import (
    calculate_qld_stamp_duty_with_bracket,
    estimate_qld_stamp_duty,
)
from app.config.property import QLD_STAMP_DUTY_BASE_BRACKETS, QLD_STAMP_DUTY_CONCESSION_BRACKETS


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

    def test_is_not_first_home_by_default(self):
        """Default is_first_home=False, so base rate applies."""
        assert estimate_qld_stamp_duty(500_000) == estimate_qld_stamp_duty(500_000, is_first_home=False)


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
        assert estimate_qld_stamp_duty(0, is_first_home=True) == 0

    def test_concession_within_first_bracket(self):
        """Purchase price within concession first bracket (<= $350k)."""
        # $200,000: $0 + $200,000 * 1.0 / 100 = $2,000
        assert estimate_qld_stamp_duty(200_000, is_first_home=True) == pytest.approx(2_000, abs=0.1)

    def test_concession_at_first_bracket_boundary(self):
        """Purchase price at $350,000 boundary."""
        # $0 + $350,000 * 1.0 / 100 = $3,500
        assert estimate_qld_stamp_duty(350_000, is_first_home=True) == pytest.approx(3_500, abs=0.1)

    def test_concession_mid_second_bracket(self):
        """Purchase price in second concession bracket ($350k–$540k)."""
        # $500,000: $3,500 + ($500,000 - $350,000) * 3.50 / 100 = $3,500 + $5,250 = $8,750
        assert estimate_qld_stamp_duty(500_000, is_first_home=True) == pytest.approx(8_750, abs=0.1)

    def test_concession_at_second_bracket_boundary(self):
        """Purchase price at $540,000 boundary."""
        # $3,500 + ($540,000 - $350,000) * 3.50 / 100 = $3,500 + $6,650 = $10,150
        assert estimate_qld_stamp_duty(540_000, is_first_home=True) == pytest.approx(10_150, abs=0.1)

    def test_concession_mid_third_bracket(self):
        """Purchase price in third concession bracket ($540k–$1M)."""
        # $750,000: $10,150 + ($750,000 - $540,000) * 4.50 / 100 = $10,150 + $9,450 = $19,600
        assert estimate_qld_stamp_duty(750_000, is_first_home=True) == pytest.approx(19_600, abs=0.1)

    def test_concession_at_third_bracket_boundary(self):
        """Purchase price at $1,000,000 boundary."""
        # $10,150 + ($1,000,000 - $540,000) * 4.50 / 100 = $10,150 + $20,700 = $30,850
        assert estimate_qld_stamp_duty(1_000_000, is_first_home=True) == pytest.approx(30_850, abs=0.1)

    def test_concession_above_top_bracket(self):
        """Purchase price above $1,000,000."""
        # $1,500,000: $30,850 + ($1,500,000 - $1,000,000) * 5.75 / 100 = $30,850 + $28,750 = $59,600
        assert estimate_qld_stamp_duty(1_500_000, is_first_home=True) == pytest.approx(59_600, abs=0.1)

    def test_concession_qro_example(self):
        """Verify against the QRO worked example: $550k PPOR."""
        # $10,150 + ($550,000 - $540,000) * 4.50 / 100 = $10,150 + $450 = $10,600
        assert estimate_qld_stamp_duty(550_000, is_first_home=True) == pytest.approx(10_600, abs=0.1)


class TestStampDutyConcessionVsBase:
    """Tests verifying concession is always <= base duty."""

    def test_concession_always_less_than_or_equal_base(self):
        """Home concession duty should never exceed base duty."""
        prices = [100_000, 250_000, 350_000, 500_000, 540_000, 750_000, 1_000_000, 1_500_000]
        for price in prices:
            base = estimate_qld_stamp_duty(price, is_first_home=False)
            concession = estimate_qld_stamp_duty(price, is_first_home=True)
            assert concession <= base, f"Concession ({concession}) > base ({base}) at ${price:,}"

    def test_concession_converges_above_1m(self):
        """Above $1M both brackets use 5.75%, so the gap stays constant."""
        gap_at_1m = (
            estimate_qld_stamp_duty(1_000_000, is_first_home=False)
            - estimate_qld_stamp_duty(1_000_000, is_first_home=True)
        )
        gap_at_2m = (
            estimate_qld_stamp_duty(2_000_000, is_first_home=False)
            - estimate_qld_stamp_duty(2_000_000, is_first_home=True)
        )
        assert gap_at_1m == pytest.approx(gap_at_2m, abs=0.1)


class TestCalculateWithBracketDirect:
    """Tests for calculate_qld_stamp_duty_with_bracket called directly."""

    def test_base_bracket_direct(self):
        """Direct call with base brackets matches estimate_qld_stamp_duty."""
        assert calculate_qld_stamp_duty_with_bracket(500_000, QLD_STAMP_DUTY_BASE_BRACKETS) == \
            estimate_qld_stamp_duty(500_000, is_first_home=False)

    def test_concession_bracket_direct(self):
        """Direct call with concession brackets matches estimate_qld_stamp_duty."""
        assert calculate_qld_stamp_duty_with_bracket(500_000, QLD_STAMP_DUTY_CONCESSION_BRACKETS) == \
            estimate_qld_stamp_duty(500_000, is_first_home=True)
