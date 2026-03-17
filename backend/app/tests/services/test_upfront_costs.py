"""
Tests for upfront costs service — build_upfront_cost_estimate.
"""

import pytest

from app.services.upfront_costs import build_upfront_cost_estimate


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _build(purchase_price=500_000, deposit=100_000, is_investment=False, lmi_exempt=False):
    return build_upfront_cost_estimate(
        purchase_price=purchase_price,
        deposit=deposit,
        is_investment=is_investment,
        lmi_exempt=lmi_exempt,
    )


# ──────────────────────────────────────────────
# Structure
# ──────────────────────────────────────────────

class TestStructure:
    """Tests for UpfrontCosts model structure."""

    def test_has_purchase_costs(self):
        result = _build()
        assert result.purchase_costs is not None

    def test_has_borrowing_costs(self):
        result = _build()
        assert result.borrowing_costs is not None

    def test_total_equals_sum(self):
        result = _build()
        assert result.total == pytest.approx(
            result.purchase_costs.total + result.borrowing_costs.total, abs=0.01
        )


# ──────────────────────────────────────────────
# Purchase costs (property acquisition)
# ──────────────────────────────────────────────

class TestPurchaseCosts:
    """Tests for property acquisition costs."""

    def test_stamp_duty_ppor_500k(self):
        result = _build(purchase_price=500_000, is_investment=False)
        assert result.purchase_costs.stamp_duty == pytest.approx(8_750, abs=1)

    def test_stamp_duty_investment_500k(self):
        result = _build(purchase_price=500_000, is_investment=True)
        assert result.purchase_costs.stamp_duty == pytest.approx(15_925, abs=1)

    def test_investment_higher_stamp_duty(self):
        inv = _build(is_investment=True)
        ppor = _build(is_investment=False)
        assert inv.purchase_costs.stamp_duty > ppor.purchase_costs.stamp_duty

    def test_registration_fee_below_threshold(self):
        result = _build(purchase_price=150_000)
        assert result.purchase_costs.registration_fee == pytest.approx(238.14, abs=0.01)

    def test_registration_fee_above_threshold(self):
        result = _build(purchase_price=500_000)
        expected = 238.14 + 32 * 44.71
        assert result.purchase_costs.registration_fee == pytest.approx(expected, abs=0.01)

    def test_legal_fees(self):
        result = _build()
        assert result.purchase_costs.legal_fees == pytest.approx(2_000, abs=0.01)

    def test_building_pest_inspection(self):
        result = _build()
        assert result.purchase_costs.building_pest_inspection == pytest.approx(600, abs=0.01)

    def test_zero_purchase_price(self):
        result = _build(purchase_price=0, deposit=0)
        assert result.purchase_costs.stamp_duty == 0.0

    def test_purchase_costs_total(self):
        result = _build()
        expected = (
            result.purchase_costs.stamp_duty +
            result.purchase_costs.legal_fees +
            result.purchase_costs.building_pest_inspection +
            result.purchase_costs.registration_fee +
            result.purchase_costs.other_costs
        )
        assert result.purchase_costs.total == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# Borrowing costs (loan-related)
# ──────────────────────────────────────────────

class TestBorrowingCosts:
    """Tests for loan-related costs."""

    def test_no_lmi_at_80_lvr(self):
        result = _build(purchase_price=500_000, deposit=100_000)
        assert result.borrowing_costs.lmi == 0.0

    def test_lmi_triggered_above_80(self):
        result = _build(purchase_price=500_000, deposit=50_000)
        assert result.borrowing_costs.lmi > 0

    def test_lmi_exempt(self):
        result = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=True)
        assert result.borrowing_costs.lmi == 0.0

    def test_lmi_90_lvr(self):
        result = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        assert result.borrowing_costs.lmi == pytest.approx(450_000 * 0.02, abs=1)

    def test_lmi_investment_multiplier(self):
        ppor = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        inv = _build(purchase_price=500_000, deposit=50_000, is_investment=True)
        assert inv.borrowing_costs.lmi == pytest.approx(ppor.borrowing_costs.lmi * 1.15, abs=1)

    def test_mortgage_registration_fee(self):
        result = _build()
        assert result.borrowing_costs.mortgage_registration_fee == pytest.approx(238.14, abs=0.01)

    def test_loan_establishment_fee(self):
        result = _build()
        assert result.borrowing_costs.loan_establishment_fee == pytest.approx(300, abs=0.01)

    def test_borrowing_costs_total(self):
        result = _build()
        expected = (
            result.borrowing_costs.lmi +
            result.borrowing_costs.mortgage_registration_fee +
            result.borrowing_costs.loan_establishment_fee
        )
        assert result.borrowing_costs.total == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# Total and comparisons
# ──────────────────────────────────────────────

class TestTotals:
    """Tests for total upfront costs."""

    def test_total_is_purchase_plus_borrowing(self):
        result = _build()
        assert result.total == pytest.approx(
            result.purchase_costs.total + result.borrowing_costs.total, abs=0.01
        )

    def test_investment_higher_total(self):
        inv = _build(purchase_price=500_000, deposit=50_000, is_investment=True)
        ppor = _build(purchase_price=500_000, deposit=50_000, is_investment=False)
        assert inv.total > ppor.total

    def test_lmi_exempt_reduces_total(self):
        with_lmi = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=False)
        without_lmi = _build(purchase_price=500_000, deposit=25_000, lmi_exempt=True)
        assert with_lmi.total > without_lmi.total


# ──────────────────────────────────────────────
# End-to-end
# ──────────────────────────────────────────────

class TestEndToEnd:
    """Full end-to-end verification."""

    def test_ppor_500k_20pct_deposit(self):
        result = _build(purchase_price=500_000, deposit=100_000, is_investment=False)
        assert result.borrowing_costs.lmi == 0.0
        assert result.purchase_costs.stamp_duty == pytest.approx(8_750, abs=1)
        assert result.purchase_costs.registration_fee == pytest.approx(238.14 + 32 * 44.71, abs=0.01)
        assert result.borrowing_costs.mortgage_registration_fee == pytest.approx(238.14, abs=0.01)
        assert result.purchase_costs.legal_fees == pytest.approx(2_000, abs=0.01)
        assert result.purchase_costs.building_pest_inspection == pytest.approx(600, abs=0.01)
        assert result.borrowing_costs.loan_establishment_fee == pytest.approx(300, abs=0.01)
