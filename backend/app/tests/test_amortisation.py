"""
Tests for amortisation engine.

All expected values calculated using daily compounding:
    daily_rate = annual_rate / 365
    effective_periodic_rate = (1 + daily_rate) ^ days_per_period - 1
"""

import pytest
from app.engine.amortisation import (
    calculate_periodic_repayment,
    calculate_io_repayment,
    generate_schedule,
)
from app.models.loan import RepaymentFrequency, RateChange


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


class TestIORepayment:
    """Interest-only repayment with daily compounding."""

    # ── Monthly ──────────────────────────────

    def test_monthly(self):
        """$500k at 6.2%, monthly IO."""
        result = calculate_io_repayment(500_000, 0.062)
        assert result == pytest.approx(2589.80, abs=0.01)

    def test_monthly_smaller(self):
        """$300k at 5.5%, monthly IO."""
        result = calculate_io_repayment(300_000, 0.055)
        assert result == pytest.approx(1378.05, abs=0.01)

    # ── Fortnightly ──────────────────────────

    def test_fortnightly(self):
        """$500k at 6.2%, fortnightly IO."""
        result = calculate_io_repayment(500_000, 0.062, RepaymentFrequency.FORTNIGHTLY)
        assert result == pytest.approx(1190.35, abs=0.01)

    # ── Weekly ───────────────────────────────

    def test_weekly(self):
        """$500k at 6.2%, weekly IO."""
        result = calculate_io_repayment(500_000, 0.062, RepaymentFrequency.WEEKLY)
        assert result == pytest.approx(594.82, abs=0.01)

    # ── Edge cases ───────────────────────────

    def test_zero_principal(self):
        result = calculate_io_repayment(0, 0.06)
        assert result == 0.0

    def test_zero_rate(self):
        result = calculate_io_repayment(500_000, 0.0)
        assert result == 0.0

    def test_io_always_less_than_pi(self):
        """IO repayment should always be less than P&I."""
        io = calculate_io_repayment(500_000, 0.062)
        pi = calculate_periodic_repayment(500_000, 0.062, 30)
        assert io < pi


class TestIOOffset:
    """Interest-only repayment with offset account."""

    def test_offset_reduces_interest(self):
        """$500k loan, $100k offset → interest on $400k."""
        result = calculate_io_repayment(500_000, 0.062, offset_balance=100_000)
        assert result == pytest.approx(2071.84, abs=0.01)

    def test_offset_half(self):
        """$500k loan, $250k offset → interest on $250k."""
        result = calculate_io_repayment(500_000, 0.062, offset_balance=250_000)
        assert result == pytest.approx(1294.90, abs=0.01)

    def test_offset_equals_principal(self):
        """Offset equals loan → zero interest."""
        result = calculate_io_repayment(500_000, 0.062, offset_balance=500_000)
        assert result == 0.0

    def test_offset_exceeds_principal(self):
        """Offset greater than loan → still zero (no negative interest)."""
        result = calculate_io_repayment(500_000, 0.062, offset_balance=600_000)
        assert result == 0.0

    def test_offset_with_weekly(self):
        """$500k loan, $100k offset, weekly."""
        result = calculate_io_repayment(500_000, 0.062, RepaymentFrequency.WEEKLY, offset_balance=100_000)
        assert result == pytest.approx(475.86, abs=0.01)

    def test_no_offset_unchanged(self):
        """Zero offset should match no-offset result."""
        with_zero = calculate_io_repayment(500_000, 0.062, offset_balance=0)
        without = calculate_io_repayment(500_000, 0.062)
        assert with_zero == without


class TestScheduleBasic:
    """Basic P&I amortisation schedule — $100k at 6% over 1 year, monthly."""

    @pytest.fixture
    def schedule(self):
        return generate_schedule(100_000, 0.06, 1)

    def test_row_count(self, schedule):
        """12 monthly payments for a 1-year loan."""
        assert schedule.total_periods == 12

    def test_first_row(self, schedule):
        row = schedule.rows[0]
        assert row.period == 1
        assert row.opening_balance == pytest.approx(100_000.00, abs=0.01)
        assert row.interest == pytest.approx(501.21, abs=0.01)
        assert row.principal_paid == pytest.approx(8106.10, abs=0.01)
        assert row.closing_balance == pytest.approx(91_893.90, abs=0.01)

    def test_second_row(self, schedule):
        row = schedule.rows[1]
        assert row.opening_balance == pytest.approx(91_893.90, abs=0.01)
        assert row.interest == pytest.approx(460.58, abs=0.01)

    def test_final_balance_is_zero(self, schedule):
        assert schedule.rows[-1].closing_balance == pytest.approx(0.0, abs=0.01)

    def test_total_interest(self, schedule):
        assert schedule.total_interest == pytest.approx(3287.73, abs=0.01)

    def test_total_interest_matches_row_sum(self, schedule):
        row_sum = sum(row.interest for row in schedule.rows)
        assert row_sum == pytest.approx(schedule.total_interest, abs=0.01)

    def test_scheduled_repayment(self, schedule):
        """All rows have the same scheduled repayment (no rate changes)."""
        assert schedule.rows[0].scheduled_repayment == pytest.approx(8607.31, abs=0.01)
        assert all(r.scheduled_repayment == schedule.rows[0].scheduled_repayment for r in schedule.rows)

    def test_rate_constant(self, schedule):
        """All rows should show the same rate."""
        assert all(r.annual_rate == 0.06 for r in schedule.rows)


class TestScheduleWithOffset:
    """P&I schedule with offset — $100k at 6%, 1 year, $20k offset."""

    @pytest.fixture
    def schedule(self):
        return generate_schedule(100_000, 0.06, 1, offset_balance=20_000)

    def test_first_row_reduced_interest(self, schedule):
        """Interest should be on $80k (100k - 20k offset)."""
        row = schedule.rows[0]
        assert row.interest == pytest.approx(400.97, abs=0.01)

    def test_less_total_interest_than_no_offset(self, schedule):
        no_offset = generate_schedule(100_000, 0.06, 1)
        assert schedule.total_interest < no_offset.total_interest

    def test_same_scheduled_repayment(self, schedule):
        """Offset doesn't change the scheduled repayment."""
        no_offset = generate_schedule(100_000, 0.06, 1)
        assert schedule.rows[0].scheduled_repayment == no_offset.rows[0].scheduled_repayment

    def test_final_balance_is_zero(self, schedule):
        assert schedule.rows[-1].closing_balance == pytest.approx(0.0, abs=0.01)


class TestScheduleWithExtra:
    """P&I schedule with extra repayments — $100k at 6%, 1 year, $200 extra."""

    @pytest.fixture
    def schedule(self):
        return generate_schedule(100_000, 0.06, 1, extra_repayment=200)

    def test_pays_off_early_or_same(self, schedule):
        """Extra repayments should pay off in <= standard periods."""
        no_extra = generate_schedule(100_000, 0.06, 1)
        assert schedule.total_periods <= no_extra.total_periods

    def test_less_total_interest(self, schedule):
        no_extra = generate_schedule(100_000, 0.06, 1)
        assert schedule.total_interest < no_extra.total_interest

    def test_final_balance_is_zero(self, schedule):
        assert schedule.rows[-1].closing_balance == pytest.approx(0.0, abs=0.01)

    def test_extra_recorded_in_rows(self, schedule):
        """Non-final rows should show the extra repayment amount."""
        assert schedule.rows[0].extra_paid == pytest.approx(200.00, abs=0.01)


class TestScheduleWithRateChange:
    """$500k, 5.5% fixed for 2 years then 6.2% variable, 30 year term, monthly."""

    @pytest.fixture
    def schedule(self):
        return generate_schedule(
            500_000, 0.055, 30,
            rate_changes=[RateChange(from_period=25, annual_rate=0.062)],
        )

    def test_total_periods(self, schedule):
        """Should still pay off in 360 periods."""
        assert schedule.total_periods == 360

    def test_rate_before_change(self, schedule):
        """First 24 periods at 5.5%."""
        assert all(r.annual_rate == 0.055 for r in schedule.rows[:24])

    def test_rate_after_change(self, schedule):
        """Periods 25+ at 6.2%."""
        assert all(r.annual_rate == 0.062 for r in schedule.rows[24:])

    def test_repayment_changes(self, schedule):
        """Repayment should increase when rate goes up."""
        assert schedule.rows[0].scheduled_repayment == pytest.approx(2842.78, abs=0.01)
        assert schedule.rows[24].scheduled_repayment == pytest.approx(3057.01, abs=0.01)

    def test_balance_at_rate_change(self, schedule):
        """Balance at end of period 24 (start of new rate)."""
        assert schedule.rows[23].closing_balance == pytest.approx(486_179.31, abs=1.00)

    def test_period_25_interest(self, schedule):
        """First period at new rate — interest on remaining balance at 6.2%."""
        assert schedule.rows[24].interest == pytest.approx(2518.21, abs=0.01)

    def test_final_balance_is_zero(self, schedule):
        assert schedule.rows[-1].closing_balance == pytest.approx(0.0, abs=0.01)

    def test_total_interest(self, schedule):
        assert schedule.total_interest == pytest.approx(595_381.96, abs=1.00)

    def test_more_interest_than_flat_low_rate(self, schedule):
        """Rate increase should cost more than staying at 5.5%."""
        flat = generate_schedule(500_000, 0.055, 30)
        assert schedule.total_interest > flat.total_interest

    def test_no_rate_changes_same_as_flat(self):
        """Empty rate_changes should match no rate_changes."""
        with_empty = generate_schedule(500_000, 0.062, 30, rate_changes=[])
        without = generate_schedule(500_000, 0.062, 30)
        assert with_empty.total_interest == without.total_interest
