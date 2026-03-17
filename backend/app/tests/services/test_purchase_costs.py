"""
Tests for purchase costs service — build_purchase_cost_estimate.
"""

import pytest

from app.services.purchase_costs import build_purchase_cost_estimate


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _build(purchase_price=500_000, deposit=100_000, is_investment=False, lmi_exempt=False):
    return build_purchase_cost_estimate(
        purchase_price=purchase_price,
        deposit=deposit,
        is_investment=is_investment,
        lmi_exempt=lmi_exempt,
    )


# ──────────────────────────────────────────────
# LVR calculation
# ──────────────────────────────────────────────

class TestLvr:
    """Tests for LVR derivation."""

    def test_80_percent_lvr(self):
        result = _build(purchase_price=500_000, deposit=100_000)
        assert result.lvr == pytest.approx(0.80, abs=0.001)

    def test_95_percent_lvr(self):
        result = _build(purchase_price=500_000, deposit=25_000)
        assert result.lvr == pytest.approx(0.95, abs=0.001)

    def test_zero_purchase_price(self):
        result = _build(purchase_price=0, deposit=0)
        assert result.lvr == 0.0

    def test_full_cash_purchase(self):
        result = _build(purchase_price=500_000, deposit=500_000)
        assert result.lvr == pytest.approx(0.0, abs=0.001)


# ──────────────────────────────────────────────
# Stamp duty
# ──────────────────────────────────────────────

class TestStampDuty:
    """Tests for stamp duty estimation."""

    def test_ppor_500k(self):
        """$500k PPOR: $3,500 + ($500,000 - $350,000) * 3.50 / 100 = $8,750"""
        result = _build(purchase_price=500_000, is_investment=False)
        assert result.stamp_duty == pytest.approx(8_750, abs=1)

    def test_investment_500k(self):
        """$500k investment: $1,050 + ($500,000 - $75,000) * 3.50 / 100 = $15,925"""
        result = _build(purchase_price=500_000, is_investment=True)
        assert result.stamp_duty == pytest.approx(15_925, abs=1)

    def test_investment_higher_than_ppor(self):
        result_inv = _build(is_investment=True)
        result_ppor = _build(is_investment=False)
        assert result_inv.stamp_duty > result_ppor.stamp_duty

    def test_zero_purchase_price(self):
        result = _build(purchase_price=0, deposit=0)
        assert result.stamp_duty == 0.0


# ──────────────────────────────────────────────
# LMI
# ──────────────────────────────────────────────

class TestLmi:
    """Tests for LMI estimation."""

    def test_no_lmi_at_80_lvr(self):
        result = _build(purchase_price=500_000, deposit=100_000)
        assert result.lmi == 0.0

    def test_lmi_triggered_above_80(self):
        result = _build(purchase_price=500_000, deposit=50_000)
        assert result.lmi > 0

    def test_lmi_exempt(self):
        result = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=True)
        assert result.lmi == 0.0

    def test_lmi_exempt_reduces_total(self):
        with_lmi = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=False)
        without_lmi = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=True)
        assert with_lmi.total_upfront_cost > without_lmi.total_upfront_cost

    def test_investment_lmi_multiplier(self):
        """Investment LMI should be 1.15x PPOR LMI at same LVR."""
        ppor = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        inv = _build(purchase_price=500_000, deposit=50_000, is_investment=True)
        assert inv.lmi == pytest.approx(ppor.lmi * 1.15, abs=1)

    def test_lmi_90_lvr(self):
        """$500k, $50k deposit = 90% LVR, loan $450k * 2% = $9,000"""
        result = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        assert result.lmi == pytest.approx(450_000 * 0.02, abs=1)

    def test_lmi_95_lvr(self):
        """$500k, $25k deposit = 95% LVR, loan $475k * 4.5% = $21,375"""
        result = _build(purchase_price=500_000, deposit=25_000, is_investment=False)
        assert result.lmi == pytest.approx(475_000 * 0.045, abs=1)


# ──────────────────────────────────────────────
# Registration and flat fees
# ──────────────────────────────────────────────

class TestFees:
    """Tests for registration and flat fees."""

    def test_registration_fee_below_threshold(self):
        result = _build(purchase_price=150_000)
        assert result.registration_fee == pytest.approx(238.14, abs=0.01)

    def test_registration_fee_above_threshold(self):
        """$500k: base + ceil(($500k - $180k) / $10k) * $44.71"""
        result = _build(purchase_price=500_000)
        expected = 238.14 + 32 * 44.71
        assert result.registration_fee == pytest.approx(expected, abs=0.01)

    def test_registration_fee_increases_with_price(self):
        cheap = _build(purchase_price=300_000)
        expensive = _build(purchase_price=800_000)
        assert expensive.registration_fee > cheap.registration_fee

    def test_mortgage_registration_fee(self):
        result = _build()
        assert result.mortgage_registration_fee == pytest.approx(238.14, abs=0.01)

    def test_conveyancing_fee(self):
        result = _build()
        assert result.conveyancing_fee == pytest.approx(2_000, abs=0.01)

    def test_building_pest_inspection_fee(self):
        result = _build()
        assert result.building_pest_inspection_fee == pytest.approx(600, abs=0.01)

    def test_loan_establishment_fee(self):
        result = _build()
        assert result.loan_establishment_fee == pytest.approx(300, abs=0.01)


# ──────────────────────────────────────────────
# Total
# ──────────────────────────────────────────────

class TestTotal:
    """Tests for total upfront cost."""

    def test_total_equals_sum_of_components(self):
        result = _build()
        expected = (
            result.stamp_duty + result.lmi + result.registration_fee +
            result.mortgage_registration_fee + result.conveyancing_fee +
            result.building_pest_inspection_fee + result.loan_establishment_fee
        )
        assert result.total_upfront_cost == pytest.approx(expected, abs=0.01)

    def test_total_ppor_high_lvr(self):
        result = _build(purchase_price=600_000, deposit=30_000, is_investment=False)
        expected = (
            result.stamp_duty + result.lmi + result.registration_fee +
            result.mortgage_registration_fee + result.conveyancing_fee +
            result.building_pest_inspection_fee + result.loan_establishment_fee
        )
        assert result.total_upfront_cost == pytest.approx(expected, abs=0.01)

    def test_total_investment_no_lmi(self):
        result = _build(purchase_price=400_000, deposit=100_000, is_investment=True)
        expected = (
            result.stamp_duty + result.lmi + result.registration_fee +
            result.mortgage_registration_fee + result.conveyancing_fee +
            result.building_pest_inspection_fee + result.loan_establishment_fee
        )
        assert result.total_upfront_cost == pytest.approx(expected, abs=0.01)

    def test_investment_higher_total_than_ppor(self):
        inv = _build(purchase_price=500_000, deposit=50_000, is_investment=True)
        ppor = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        assert inv.total_upfront_cost > ppor.total_upfront_cost


# ──────────────────────────────────────────────
# End-to-end
# ──────────────────────────────────────────────

class TestEndToEnd:
    """Full end-to-end verification."""

    def test_ppor_500k_20pct_deposit(self):
        result = _build(purchase_price=500_000, deposit=100_000, is_investment=False)
        assert result.lvr == pytest.approx(0.80, abs=0.001)
        assert result.lmi == 0.0
        assert result.stamp_duty == pytest.approx(8_750, abs=1)
        assert result.registration_fee == pytest.approx(238.14 + 32 * 44.71, abs=0.01)
        assert result.mortgage_registration_fee == pytest.approx(238.14, abs=0.01)
        assert result.conveyancing_fee == pytest.approx(2_000, abs=0.01)
        assert result.building_pest_inspection_fee == pytest.approx(600, abs=0.01)
        assert result.loan_establishment_fee == pytest.approx(300, abs=0.01)
