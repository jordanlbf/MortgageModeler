"""
Tests for upfront costs service — build_upfront_cost_estimate.
"""

import pytest
from datetime import date

from app.services.upfront_costs import build_upfront_cost_estimate
from app.models.loan import LoanConfig, BorrowingCosts
from app.models.mortgage import Mortgage
from app.models.property import Property, PurchaseCosts


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def _make_property(purchase_price=500_000, is_ppor=False, purchase_costs=None) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        is_ppor=is_ppor,
        purchase_costs=purchase_costs or PurchaseCosts(),
    )


def _make_loan(deposit=100_000, borrowing_costs=None) -> LoanConfig:
    return LoanConfig(
        deposit=deposit,
        annual_rate=0.06,
        loan_term_years=30,
        borrowing_costs=borrowing_costs or BorrowingCosts(),
    )


def _make_mortgage(property=None, loan=None) -> Mortgage:
    return Mortgage(
        property=property or _make_property(),
        loan=loan or _make_loan(),
    )


def _build(property=None, loan=None):
    return build_upfront_cost_estimate(_make_mortgage(property, loan))


# ──────────────────────────────────────────────
# Auto-estimation (None values)
# ──────────────────────────────────────────────

class TestAutoEstimation:
    """Tests that None values are auto-estimated from engine functions."""

    def test_stamp_duty_auto_estimated(self):
        """None stamp_duty should be estimated from purchase price."""
        result = _build()
        assert result.purchase_costs.stamp_duty is not None
        assert result.purchase_costs.stamp_duty > 0

    def test_legal_fees_auto_estimated(self):
        result = _build()
        assert result.purchase_costs.legal_fees is not None
        assert result.purchase_costs.legal_fees > 0

    def test_building_pest_inspection_auto_estimated(self):
        result = _build()
        assert result.purchase_costs.building_pest_inspection is not None
        assert result.purchase_costs.building_pest_inspection > 0

    def test_registration_fee_auto_estimated(self):
        result = _build()
        assert result.purchase_costs.registration_fee is not None
        assert result.purchase_costs.registration_fee > 0

    def test_lmi_auto_estimated_high_lvr(self):
        """90% LVR should auto-estimate LMI > 0."""
        result = _build(loan=_make_loan(deposit=50_000))
        assert result.borrowing_costs.lmi is not None
        assert result.borrowing_costs.lmi > 0

    def test_lmi_auto_estimated_low_lvr(self):
        """80% LVR should auto-estimate LMI = 0."""
        result = _build(loan=_make_loan(deposit=100_000))
        assert result.borrowing_costs.lmi == 0.0

    def test_mortgage_registration_auto_estimated(self):
        result = _build()
        assert result.borrowing_costs.mortgage_registration_fee is not None
        assert result.borrowing_costs.mortgage_registration_fee > 0

    def test_loan_establishment_auto_estimated(self):
        result = _build()
        assert result.borrowing_costs.loan_establishment_fee is not None
        assert result.borrowing_costs.loan_establishment_fee > 0

    def test_no_none_values_in_result(self):
        """All fields should be resolved — no None values."""
        result = _build()
        assert result.purchase_costs.stamp_duty is not None
        assert result.purchase_costs.legal_fees is not None
        assert result.purchase_costs.building_pest_inspection is not None
        assert result.purchase_costs.registration_fee is not None
        assert result.borrowing_costs.lmi is not None
        assert result.borrowing_costs.mortgage_registration_fee is not None
        assert result.borrowing_costs.loan_establishment_fee is not None


# ──────────────────────────────────────────────
# Explicit overrides
# ──────────────────────────────────────────────

class TestOverrides:
    """Tests that explicit values are preserved."""

    def test_stamp_duty_override(self):
        pc = PurchaseCosts(stamp_duty=12_000)
        result = _build(property=_make_property(purchase_costs=pc))
        assert result.purchase_costs.stamp_duty == 12_000

    def test_legal_fees_override(self):
        pc = PurchaseCosts(legal_fees=3_500)
        result = _build(property=_make_property(purchase_costs=pc))
        assert result.purchase_costs.legal_fees == 3_500

    def test_lmi_override(self):
        bc = BorrowingCosts(lmi=15_000)
        result = _build(loan=_make_loan(deposit=50_000, borrowing_costs=bc))
        assert result.borrowing_costs.lmi == 15_000

    def test_zero_lmi_preserved(self):
        """Explicit 0.0 means LMI waived — should not be auto-estimated."""
        bc = BorrowingCosts(lmi=0.0)
        result = _build(loan=_make_loan(deposit=50_000, borrowing_costs=bc))
        assert result.borrowing_costs.lmi == 0.0

    def test_zero_stamp_duty_preserved(self):
        """Explicit 0.0 stamp duty preserved."""
        pc = PurchaseCosts(stamp_duty=0.0)
        result = _build(property=_make_property(purchase_costs=pc))
        assert result.purchase_costs.stamp_duty == 0.0

    def test_partial_override(self):
        """Override some fields, auto-estimate the rest."""
        pc = PurchaseCosts(stamp_duty=10_000)
        result = _build(property=_make_property(purchase_costs=pc))
        assert result.purchase_costs.stamp_duty == 10_000
        assert result.purchase_costs.legal_fees > 0  # auto-estimated
        assert result.purchase_costs.registration_fee > 0  # auto-estimated


# ──────────────────────────────────────────────
# Stamp duty
# ──────────────────────────────────────────────

class TestStampDuty:
    """Tests for stamp duty estimation."""

    def test_ppor_500k(self):
        result = _build(property=_make_property(purchase_price=500_000, is_ppor=True))
        assert result.purchase_costs.stamp_duty == pytest.approx(8_750, abs=1)

    def test_investment_500k(self):
        result = _build(property=_make_property(purchase_price=500_000, is_ppor=False))
        assert result.purchase_costs.stamp_duty == pytest.approx(15_925, abs=1)

    def test_investment_higher_than_ppor(self):
        inv = _build(property=_make_property(is_ppor=False))
        ppor = _build(property=_make_property(is_ppor=True))
        assert inv.purchase_costs.stamp_duty > ppor.purchase_costs.stamp_duty


# ──────────────────────────────────────────────
# LMI
# ──────────────────────────────────────────────

class TestLmi:
    """Tests for LMI estimation."""

    def test_lmi_90_lvr(self):
        result = _build(
            property=_make_property(is_ppor=True),
            loan=_make_loan(deposit=50_000),
        )
        assert result.borrowing_costs.lmi == pytest.approx(450_000 * 0.02, abs=1)

    def test_lmi_investment_multiplier(self):
        ppor = _build(
            property=_make_property(is_ppor=True),
            loan=_make_loan(deposit=50_000),
        )
        inv = _build(
            property=_make_property(is_ppor=False),
            loan=_make_loan(deposit=50_000),
        )
        assert inv.borrowing_costs.lmi == pytest.approx(ppor.borrowing_costs.lmi * 1.15, abs=1)


# ──────────────────────────────────────────────
# Totals
# ──────────────────────────────────────────────

class TestTotals:
    """Tests for total calculations."""

    def test_total_equals_purchase_plus_borrowing(self):
        result = _build()
        assert result.total == pytest.approx(
            result.purchase_costs.total + result.borrowing_costs.total, abs=0.01
        )

    def test_purchase_costs_total_is_sum(self):
        result = _build()
        pc = result.purchase_costs
        expected = pc.stamp_duty + pc.legal_fees + pc.building_pest_inspection + pc.registration_fee + pc.other_costs
        assert pc.total == pytest.approx(expected, abs=0.01)

    def test_borrowing_costs_total_is_sum(self):
        result = _build()
        bc = result.borrowing_costs
        expected = bc.lmi + bc.mortgage_registration_fee + bc.loan_establishment_fee
        assert bc.total == pytest.approx(expected, abs=0.01)

    def test_investment_higher_total(self):
        inv = _build(
            property=_make_property(is_ppor=False),
            loan=_make_loan(deposit=50_000),
        )
        ppor = _build(
            property=_make_property(is_ppor=True),
            loan=_make_loan(deposit=50_000),
        )
        assert inv.total > ppor.total


# ──────────────────────────────────────────────
# Edge cases
# ──────────────────────────────────────────────

class TestEdgeCases:
    """Tests for edge case inputs."""

    def test_zero_purchase_price(self):
        result = _build(property=_make_property(purchase_price=0), loan=_make_loan(deposit=0))
        assert result.purchase_costs.stamp_duty == 0.0
        assert result.borrowing_costs.lmi == 0.0

    def test_full_cash_purchase(self):
        result = _build(
            property=_make_property(purchase_price=500_000),
            loan=_make_loan(deposit=500_000),
        )
        assert result.borrowing_costs.lmi == 0.0
