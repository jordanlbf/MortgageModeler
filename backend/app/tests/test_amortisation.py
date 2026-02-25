"""
Tests for amortisation engine.

All expected values calculated using daily compounding:
    daily_rate = annual_rate / 365
    effective_periodic_rate = (1 + daily_rate) ^ days_per_period - 1
"""

import pytest
from app.engine.amortisation import calculate_periodic_repayment
from app.models.loan import RepaymentFrequency


class TestPeriodicRepayment:
    """P&I repayment with daily compounding across frequencies."""

    # ── Monthly ──────────────────────────────

    def test_monthly_standard(self):
        """$500k at 6.2% over 30 years, monthly."""
        result = calculate_periodic_repayment(500_000, 0.062, 30)
        assert result == pytest.approx(3067.38, abs=0.01)

    def test_monthly_shorter_term(self):
        """$300k at 5.5% over 25 years, monthly."""
        result = calculate_periodic_repayment(300_000, 0.055, 25)
        assert result == pytest.approx(1844.45, abs=0.01)

    def test_monthly_5yr(self):
        """$200k at 6.0% over 5 years, monthly."""
        result = calculate_periodic_repayment(200_000, 0.06, 5)
        assert result == pytest.approx(3867.91, abs=0.01)

    # ── Fortnightly ──────────────────────────

    def test_fortnightly_standard(self):
        """$500k at 6.2% over 30 years, fortnightly."""
        result = calculate_periodic_repayment(500_000, 0.062, 30, RepaymentFrequency.FORTNIGHTLY)
        assert result == pytest.approx(1411.20, abs=0.01)

    def test_fortnightly_shorter_term(self):
        """$300k at 5.5% over 25 years, fortnightly."""
        result = calculate_periodic_repayment(300_000, 0.055, 25, RepaymentFrequency.FORTNIGHTLY)
        assert result == pytest.approx(848.99, abs=0.01)

    # ── Weekly ───────────────────────────────

    def test_weekly_standard(self):
        """$500k at 6.2% over 30 years, weekly."""
        result = calculate_periodic_repayment(500_000, 0.062, 30, RepaymentFrequency.WEEKLY)
        assert result == pytest.approx(705.18, abs=0.01)

    def test_weekly_shorter_term(self):
        """$300k at 5.5% over 25 years, weekly."""
        result = calculate_periodic_repayment(300_000, 0.055, 25, RepaymentFrequency.WEEKLY)
        assert result == pytest.approx(424.27, abs=0.01)

    # ── Edge cases ───────────────────────────

    def test_zero_principal(self):
        """No loan = no repayment."""
        result = calculate_periodic_repayment(0, 0.06, 30)
        assert result == 0.0

    def test_zero_rate_monthly(self):
        """0% interest monthly = principal / total months."""
        result = calculate_periodic_repayment(360_000, 0.0, 30)
        assert result == pytest.approx(1000.00, abs=0.01)

    def test_zero_rate_weekly(self):
        """0% interest weekly = principal / total weeks."""
        result = calculate_periodic_repayment(360_000, 0.0, 30, RepaymentFrequency.WEEKLY)
        assert result == pytest.approx(230.77, abs=0.01)

    def test_defaults_to_monthly(self):
        """No frequency arg should default to monthly."""
        monthly = calculate_periodic_repayment(500_000, 0.062, 30, RepaymentFrequency.MONTHLY)
        default = calculate_periodic_repayment(500_000, 0.062, 30)
        assert monthly == default
