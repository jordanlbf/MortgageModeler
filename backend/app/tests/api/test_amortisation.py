"""
Tests for API Schedule endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestScheduleEndpoint:
    """POST /api/amortisation/schedule"""

    def _post(self, **overrides):
        payload = {
            "purchase_price": 600_000,
            "deposit": 100_000,
            "annual_rate": 0.062,
            "loan_term_years": 30,
            "frequency": "monthly",
            **overrides,
        }
        return client.post("/api/amortisation/schedule", json=payload)

    # ── Summary ──────────────────────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_summary_loan_amount(self):
        data = self._post().json()
        assert data["summary"]["loan_amount"] == 500_000

    def test_summary_lvr(self):
        data = self._post().json()
        assert data["summary"]["lvr"] == pytest.approx(500_000 / 600_000, abs=0.0001)

    def test_summary_deposit(self):
        data = self._post().json()
        assert data["summary"]["deposit"] == 100_000

    def test_summary_appreciation(self):
        data = self._post(annual_appreciation=0.05).json()
        assert data["summary"]["annual_appreciation"] == 0.05

    # ── Payment and totals ───────────────────

    def test_payment_matches_engine(self):
        """$500k at 6.2% over 30 years monthly — matches engine test."""
        data = self._post().json()
        assert data["payment"] == pytest.approx(3067.38, abs=1.0)

    def test_total_periods(self):
        data = self._post().json()
        assert data["total_periods"] == 360

    def test_total_interest_positive(self):
        data = self._post().json()
        assert data["total_interest"] > 0

    # ── Rows ─────────────────────────────────

    def test_row_count(self):
        data = self._post().json()
        assert len(data["rows"]) == 360

    def test_first_row_opening_balance(self):
        data = self._post().json()
        row = data["rows"][0]
        assert row["opening_balance"] == pytest.approx(500_000, abs=1.0)

    def test_last_row_closing_balance(self):
        data = self._post().json()
        row = data["rows"][-1]
        assert row["closing_balance"] == pytest.approx(0.0, abs=0.01)

    # ── Chart data ───────────────────────────

    def test_chart_data_length(self):
        data = self._post().json()
        assert len(data["chart_data"]) == 31  # year 0..30

    def test_chart_year_zero(self):
        data = self._post().json()
        pt = data["chart_data"][0]
        assert pt["year"] == 0
        assert pt["balance"] == 500_000
        assert pt["equity"] == 100_000  # deposit
        assert pt["property_value"] == 600_000

    def test_chart_final_year_no_appreciation(self):
        """Without appreciation, equity = purchase_price - balance."""
        data = self._post(annual_appreciation=0.0).json()
        pt = data["chart_data"][-1]
        assert pt["balance"] == pytest.approx(0.0, abs=0.01)
        assert pt["equity"] == pytest.approx(600_000, abs=1.0)
        assert pt["property_value"] == pytest.approx(600_000, abs=1.0)

    def test_chart_appreciation_increases_value(self):
        """5% annual growth over 30 years."""
        data = self._post(annual_appreciation=0.05).json()
        pt = data["chart_data"][-1]
        expected_value = 600_000 * (1.05 ** 30)
        assert pt["property_value"] == pytest.approx(expected_value, rel=0.001)

    def test_chart_appreciation_increases_equity(self):
        """With appreciation, equity > purchase_price at end of term."""
        data = self._post(annual_appreciation=0.05).json()
        pt = data["chart_data"][-1]
        assert pt["equity"] > 600_000

    def test_chart_equity_year_one(self):
        """Year 1 equity = appreciated_value - remaining_balance."""
        data = self._post(annual_appreciation=0.05).json()
        pt = data["chart_data"][1]
        expected_value = 600_000 * 1.05
        assert pt["property_value"] == pytest.approx(expected_value, abs=1.0)
        assert pt["equity"] == pytest.approx(expected_value - pt["balance"], abs=0.01)

    # ── Deposit edge cases ───────────────────

    def test_zero_deposit(self):
        data = self._post(deposit=0).json()
        assert data["summary"]["loan_amount"] == 600_000
        assert data["summary"]["lvr"] == pytest.approx(1.0, abs=0.0001)
        assert data["chart_data"][0]["equity"] == 0.0

    def test_full_deposit(self):
        """Deposit equals purchase price — no loan."""
        data = self._post(deposit=600_000).json()
        assert data["summary"]["loan_amount"] == 0
        assert data["summary"]["lvr"] == 0.0
        assert data["payment"] == 0.0

    def test_deposit_exceeds_price_rejected(self):
        res = self._post(deposit=700_000)
        assert res.status_code == 422

    # ── Frequency variants ───────────────────

    def test_fortnightly(self):
        data = self._post(frequency="fortnightly").json()
        assert data["total_periods"] == 780  # 30 * 26

    def test_weekly(self):
        data = self._post(frequency="weekly").json()
        assert data["total_periods"] == 1560  # 30 * 52

    # ── With offset and extra ────────────────

    def test_offset_reduces_interest(self):
        base = self._post().json()["total_interest"]
        with_offset = self._post(offset_balance=50_000).json()["total_interest"]
        assert with_offset < base

    def test_extra_reduces_interest(self):
        base = self._post().json()["total_interest"]
        with_extra = self._post(extra_repayment=200).json()["total_interest"]
        assert with_extra < base
