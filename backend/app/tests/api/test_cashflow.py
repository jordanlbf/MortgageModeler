"""
Tests for API Cashflow endpoints — PPOR and rentvesting.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _ppor_payload(**overrides):
    payload = {
        "tax_profile": {
            "taxable_income": 100_000,
            "repayment_income": 100_000,
            "mls_income": 100_000,
            "hecs_balance": 0,
            "has_private_health": True,
            "income_growth_rate": 0.03,
        },
        "property": {
            "purchase_price": 500_000,
            "purchase_date": "2020-01-15",
            "is_new_property": False,
            "is_ppor": True,
            "annual_appreciation": 0.05,
        },
        "loan": {
            "deposit": 100_000,
            "annual_rate": 0.06,
            "loan_term_years": 30,
        },
        "ongoing_costs": {
            "council_rates": 2_000,
            "water_rates": 1_200,
            "building_insurance": 1_500,
        },
        "projection_years": 5,
    }
    payload.update(overrides)
    return payload


def _rentvest_payload(**overrides):
    payload = _ppor_payload()
    payload["property"]["is_ppor"] = False
    payload["property"]["rental"] = {
        "weekly_rent": 450,
        "annual_growth_rate": 0.03,
        "vacancy_weeks": 2,
    }
    payload["property"]["depreciable_buildings"] = [
        {
            "name": "Main building",
            "construction_cost": 250_000,
            "purchase_date": "2020-01-15",
            "construction_start_date": "2019-01-01",
        }
    ]
    payload["ongoing_costs"]["landlord_insurance"] = 1_000
    payload["ongoing_costs"]["management_rate"] = 0.08
    payload["weekly_rent_paid"] = 500
    payload["annual_rent_paid_growth"] = 0.03
    payload.update(overrides)
    return payload


# ──────────────────────────────────────────────
# POST /api/cashflow/ppor — Structure
# ──────────────────────────────────────────────


class TestPporEndpointStructure:
    """Tests for PPOR endpoint response structure."""

    def test_returns_200(self):
        res = client.post("/api/cashflow/ppor", json=_ppor_payload())
        assert res.status_code == 200

    def test_scenario_is_ppor(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert data["scenario"] == "ppor"

    def test_correct_projection_years(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=10)).json()
        assert data["projection_years"] == 10

    def test_years_count_matches(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        assert len(data["years"]) == 5

    def test_years_are_sequential(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        years = [y["year"] for y in data["years"]]
        assert years == [0, 1, 2, 3, 4]

    def test_has_upfront_costs(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert "upfront_costs" in data
        assert "purchase_costs" in data["upfront_costs"]
        assert "borrowing_costs" in data["upfront_costs"]
        assert "total" in data["upfront_costs"]

    def test_has_summary(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert "summary" in data
        expected_fields = {
            "total_income",
            "total_outflows",
            "total_interest_paid",
            "total_rent_paid",
            "total_rental_income",
            "total_tax_saving",
            "final_property_value",
            "final_loan_balance",
            "final_equity",
            "average_annual_net",
            "net_wealth",
        }
        assert set(data["summary"].keys()) == expected_fields

    def test_year_has_all_fields(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        y0 = data["years"][0]
        expected_fields = {
            "year",
            "net_income",
            "total_inflows",
            "mortgage_repayment",
            "mortgage_interest",
            "mortgage_principal",
            "property_costs",
            "offset_contributions",
            "rent_paid",
            "rental_income",
            "tax_saving",
            "total_outflows",
            "net_position",
            "cumulative_position",
            "property_value",
            "loan_balance",
            "equity",
            "offset_balance",
            "salary",
            "income_tax",
            "ongoing_costs_detail",
            "tax_deduction_detail",
        }
        assert set(y0.keys()) == expected_fields


# ──────────────────────────────────────────────
# POST /api/cashflow/ppor — Values
# ──────────────────────────────────────────────


class TestPporEndpointValues:
    """Tests for PPOR endpoint response values."""

    def test_no_rent_paid(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        for y in data["years"]:
            assert y["rent_paid"] == 0.0

    def test_no_rental_income(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        for y in data["years"]:
            assert y["rental_income"] == 0.0

    def test_no_tax_saving(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        for y in data["years"]:
            assert y["tax_saving"] == 0.0

    def test_net_income_positive(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert data["years"][0]["net_income"] > 0

    def test_income_grows(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        incomes = [y["net_income"] for y in data["years"]]
        for i in range(1, len(incomes)):
            assert incomes[i] > incomes[i - 1]

    def test_property_value_grows(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        values = [y["property_value"] for y in data["years"]]
        for i in range(1, len(values)):
            assert values[i] > values[i - 1]

    def test_loan_balance_decreases(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        balances = [y["loan_balance"] for y in data["years"]]
        for i in range(1, len(balances)):
            assert balances[i] <= balances[i - 1]

    def test_equity_increases(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        equities = [y["equity"] for y in data["years"]]
        for i in range(1, len(equities)):
            assert equities[i] > equities[i - 1]

    def test_total_inflows_equals_net_income(self):
        """PPOR: total_inflows = net_income (no rental, no tax saving)."""
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        for y in data["years"]:
            assert y["total_inflows"] == pytest.approx(y["net_income"], abs=0.01)

    def test_net_position_is_inflows_minus_outflows(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        for y in data["years"]:
            assert y["net_position"] == pytest.approx(y["total_inflows"] - y["total_outflows"], abs=0.01)

    def test_summary_net_wealth(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=5)).json()
        last = data["years"][-1]
        expected = last["equity"] + last["cumulative_position"]
        assert data["summary"]["net_wealth"] == pytest.approx(expected, abs=1)

    def test_upfront_costs_auto_estimated(self):
        """With no cost overrides, upfront costs should be auto-estimated."""
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert data["upfront_costs"]["purchase_costs"]["stamp_duty"] > 0
        assert data["upfront_costs"]["total"] > 0


# ──────────────────────────────────────────────
# POST /api/cashflow/ppor — Validation
# ──────────────────────────────────────────────


class TestPporEndpointValidation:
    """Tests for PPOR endpoint input validation."""

    def test_missing_property_returns_422(self):
        payload = _ppor_payload()
        del payload["property"]
        res = client.post("/api/cashflow/ppor", json=payload)
        assert res.status_code == 422

    def test_missing_loan_returns_422(self):
        payload = _ppor_payload()
        del payload["loan"]
        res = client.post("/api/cashflow/ppor", json=payload)
        assert res.status_code == 422

    def test_negative_purchase_price_returns_422(self):
        payload = _ppor_payload()
        payload["property"]["purchase_price"] = -1
        res = client.post("/api/cashflow/ppor", json=payload)
        assert res.status_code == 422

    def test_zero_projection_years_returns_422(self):
        res = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=0))
        assert res.status_code == 422

    def test_get_returns_405(self):
        res = client.get("/api/cashflow/ppor")
        assert res.status_code == 405

    def test_defaults_work_with_minimal_payload(self):
        """Only required fields — everything else defaults."""
        payload = {
            "property": {
                "purchase_price": 500_000,
                "purchase_date": "2020-01-15",
            },
            "loan": {
                "annual_rate": 0.06,
            },
        }
        res = client.post("/api/cashflow/ppor", json=payload)
        assert res.status_code == 200


# ──────────────────────────────────────────────
# POST /api/cashflow/rentvest — Structure
# ──────────────────────────────────────────────


class TestRentvestEndpointStructure:
    """Tests for rentvesting endpoint response structure."""

    def test_returns_200(self):
        res = client.post("/api/cashflow/rentvest", json=_rentvest_payload())
        assert res.status_code == 200

    def test_scenario_is_rentvesting(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert data["scenario"] == "rentvesting"

    def test_years_count_matches(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        assert len(data["years"]) == 5

    def test_has_cgt(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert "cgt" in data
        expected_cgt_fields = {
            "cost_base",
            "capital_gain",
            "cgt_discount",
            "discounted_gain",
            "cgt_payable",
            "net_proceeds",
        }
        assert set(data["cgt"].keys()) == expected_cgt_fields

    def test_has_upfront_costs(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert "upfront_costs" in data

    def test_has_summary(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert "summary" in data


# ──────────────────────────────────────────────
# POST /api/cashflow/rentvest — Values
# ──────────────────────────────────────────────


class TestRentvestEndpointValues:
    """Tests for rentvesting endpoint response values."""

    def test_rent_paid_positive(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        for y in data["years"]:
            assert y["rent_paid"] > 0

    def test_rental_income_positive(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        for y in data["years"]:
            assert y["rental_income"] > 0

    def test_rent_paid_grows(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        rents = [y["rent_paid"] for y in data["years"]]
        for i in range(1, len(rents)):
            assert rents[i] > rents[i - 1]

    def test_rental_income_grows(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        incomes = [y["rental_income"] for y in data["years"]]
        for i in range(1, len(incomes)):
            assert incomes[i] > incomes[i - 1]

    def test_tax_saving_present(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert any(y["tax_saving"] != 0 for y in data["years"])

    def test_cgt_capital_gain_positive(self):
        """5 years of 5% appreciation → positive capital gain."""
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        assert data["cgt"]["capital_gain"] > 0

    def test_cgt_has_discount(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        if data["cgt"]["capital_gain"] > 0:
            assert data["cgt"]["cgt_discount"] > 0

    def test_cgt_payable_positive(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        if data["cgt"]["capital_gain"] > 0:
            assert data["cgt"]["cgt_payable"] > 0

    def test_total_inflows_includes_rental_and_tax_saving(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        for y in data["years"]:
            expected = y["net_income"] + y["rental_income"] + y["tax_saving"]
            assert y["total_inflows"] == pytest.approx(expected, abs=0.01)

    def test_total_outflows_includes_rent_paid(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        for y in data["years"]:
            expected = y["mortgage_repayment"] + y["property_costs"] + y["rent_paid"]
            assert y["total_outflows"] == pytest.approx(expected, abs=0.01)

    def test_summary_total_rent_paid(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        expected = sum(y["rent_paid"] for y in data["years"])
        assert data["summary"]["total_rent_paid"] == pytest.approx(expected, abs=0.01)

    def test_summary_total_rental_income(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        expected = sum(y["rental_income"] for y in data["years"])
        assert data["summary"]["total_rental_income"] == pytest.approx(expected, abs=0.01)

    def test_summary_net_wealth(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=5)).json()
        last = data["years"][-1]
        expected = last["equity"] + last["cumulative_position"]
        assert data["summary"]["net_wealth"] == pytest.approx(expected, abs=1)


# ──────────────────────────────────────────────
# POST /api/cashflow/rentvest — Validation
# ──────────────────────────────────────────────


class TestRentvestEndpointValidation:
    """Tests for rentvesting endpoint input validation."""

    def test_missing_weekly_rent_paid_returns_422(self):
        payload = _rentvest_payload()
        del payload["weekly_rent_paid"]
        res = client.post("/api/cashflow/rentvest", json=payload)
        assert res.status_code == 422

    def test_negative_weekly_rent_paid_returns_422(self):
        res = client.post("/api/cashflow/rentvest", json=_rentvest_payload(weekly_rent_paid=-1))
        assert res.status_code == 422

    def test_get_returns_405(self):
        res = client.get("/api/cashflow/rentvest")
        assert res.status_code == 405

    def test_defaults_work_with_minimal_rentvest(self):
        """Only required fields — everything else defaults."""
        payload = {
            "property": {
                "purchase_price": 500_000,
                "purchase_date": "2020-01-15",
            },
            "loan": {
                "annual_rate": 0.06,
            },
            "weekly_rent_paid": 500,
        }
        res = client.post("/api/cashflow/rentvest", json=payload)
        assert res.status_code == 200


# ──────────────────────────────────────────────
# Comparison — PPOR vs Rentvesting
# ──────────────────────────────────────────────


class TestPporVsRentvest:
    """Tests comparing PPOR and rentvesting responses."""

    def test_rentvest_has_rent_paid_ppor_does_not(self):
        ppor = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=3)).json()
        rentvest = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=3)).json()
        assert all(y["rent_paid"] == 0 for y in ppor["years"])
        assert all(y["rent_paid"] > 0 for y in rentvest["years"])

    def test_rentvest_has_rental_income_ppor_does_not(self):
        ppor = client.post("/api/cashflow/ppor", json=_ppor_payload(projection_years=3)).json()
        rentvest = client.post("/api/cashflow/rentvest", json=_rentvest_payload(projection_years=3)).json()
        assert all(y["rental_income"] == 0 for y in ppor["years"])
        assert all(y["rental_income"] > 0 for y in rentvest["years"])

    def test_rentvest_has_cgt_ppor_does_not(self):
        ppor = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        rentvest = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert "cgt" not in ppor
        assert "cgt" in rentvest

    def test_both_have_net_wealth(self):
        ppor = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        rentvest = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert "net_wealth" in ppor["summary"]
        assert "net_wealth" in rentvest["summary"]


# ───────────────────────────────────��──────────
# POST /api/cashflow/single — Helpers
# ──────────────────────────────────────────────


def _single_new_ppor(**overrides):
    payload = {
        "mode": "new",
        "property_use": "ppor",
        "projection_years": 5,
        "tax_profile": {
            "taxable_income": 100_000,
            "repayment_income": 100_000,
            "mls_income": 100_000,
            "hecs_balance": 0,
            "has_private_health": True,
            "income_growth_rate": 0.03,
        },
        "property": {
            "purchase_price": 500_000,
            "purchase_date": "2020-01-15",
            "is_new_property": False,
            "annual_appreciation": 0.05,
        },
        "loan": {
            "deposit": 100_000,
            "annual_rate": 0.06,
            "loan_term_years": 30,
        },
        "ongoing_costs": {
            "council_rates": 2_000,
            "water_rates": 1_200,
            "building_insurance": 1_500,
        },
    }
    payload.update(overrides)
    return payload


def _single_new_investment(**overrides):
    payload = _single_new_ppor()
    payload["property_use"] = "investment"
    payload["property"]["annual_appreciation"] = 0.05
    payload["rental"] = {
        "weekly_rent": 450,
        "annual_growth_rate": 0.03,
        "vacancy_weeks": 2,
    }
    payload["property"]["depreciable_buildings"] = [
        {
            "name": "Main building",
            "construction_cost": 250_000,
            "purchase_date": "2020-01-15",
            "construction_start_date": "2019-01-01",
        }
    ]
    payload["ongoing_costs"]["landlord_insurance"] = 1_000
    payload["ongoing_costs"]["management_rate"] = 0.08
    payload.update(overrides)
    return payload


def _single_existing_ppor(**overrides):
    payload = {
        "mode": "existing",
        "property_use": "ppor",
        "projection_years": 5,
        "tax_profile": {
            "taxable_income": 100_000,
            "repayment_income": 100_000,
            "mls_income": 100_000,
            "hecs_balance": 0,
            "has_private_health": True,
            "income_growth_rate": 0.03,
        },
        "existing_property": {
            "purchase_price": 500_000,
            "purchase_date": "2020-01-15",
            "current_value": 600_000,
            "annual_appreciation": 0.05,
        },
        "existing_loan": {
            "current_balance": 350_000,
            "remaining_term_years": 25,
            "annual_rate": 0.06,
        },
        "ongoing_costs": {
            "council_rates": 2_000,
            "water_rates": 1_200,
            "building_insurance": 1_500,
        },
    }
    payload.update(overrides)
    return payload


def _single_existing_investment(**overrides):
    payload = _single_existing_ppor()
    payload["property_use"] = "investment"
    payload["rental"] = {
        "weekly_rent": 500,
        "annual_growth_rate": 0.03,
        "vacancy_weeks": 2,
    }
    payload["existing_property"]["depreciable_buildings"] = [
        {
            "name": "Main building",
            "construction_cost": 250_000,
            "purchase_date": "2020-01-15",
            "construction_start_date": "2019-01-01",
        }
    ]
    payload["ongoing_costs"]["landlord_insurance"] = 1_000
    payload["ongoing_costs"]["management_rate"] = 0.08
    payload.update(overrides)
    return payload


# ──────────────────────────────────────────────
# POST /api/cashflow/single — Structure
# ──────────────────────────────────────────────


class TestSingleEndpointStructure:
    """Tests for single endpoint response structure across all 4 combos."""

    def test_new_ppor_returns_200(self):
        assert client.post("/api/cashflow/single", json=_single_new_ppor()).status_code == 200

    def test_new_investment_returns_200(self):
        assert client.post("/api/cashflow/single", json=_single_new_investment()).status_code == 200

    def test_existing_ppor_returns_200(self):
        assert client.post("/api/cashflow/single", json=_single_existing_ppor()).status_code == 200

    def test_existing_investment_returns_200(self):
        assert client.post("/api/cashflow/single", json=_single_existing_investment()).status_code == 200

    def test_mode_echoed(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        assert data["mode"] == "new"
        data = client.post("/api/cashflow/single", json=_single_existing_ppor()).json()
        assert data["mode"] == "existing"

    def test_property_use_echoed(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        assert data["property_use"] == "ppor"
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        assert data["property_use"] == "investment"

    def test_projection_years_echoed(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor(projection_years=10)).json()
        assert data["projection_years"] == 10

    def test_years_count_matches(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor(projection_years=7)).json()
        assert len(data["years"]) == 7

    def test_years_are_sequential(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor(projection_years=5)).json()
        assert [y["year"] for y in data["years"]] == [0, 1, 2, 3, 4]

    def test_has_summary(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        assert "summary" in data
        expected = {
            "total_income", "total_outflows", "total_interest_paid",
            "total_rent_paid", "total_rental_income", "total_tax_saving",
            "final_property_value", "final_loan_balance", "final_equity",
            "average_annual_net", "net_wealth",
        }
        assert set(data["summary"].keys()) == expected

    def test_year_has_all_fields(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        expected = {
            "year", "net_income", "total_inflows", "mortgage_repayment",
            "mortgage_interest", "mortgage_principal", "property_costs",
            "offset_contributions", "rent_paid", "rental_income", "tax_saving",
            "total_outflows", "net_position", "cumulative_position",
            "property_value", "loan_balance", "equity", "offset_balance",
            "salary", "income_tax", "ongoing_costs_detail", "tax_deduction_detail",
        }
        assert set(data["years"][0].keys()) == expected


# ──────────────────────────────────────────────
# POST /api/cashflow/single — New PPOR Values
# ──────────────────────────────────────────────


class TestSingleNewPporValues:
    """Tests for new PPOR single endpoint values."""

    def test_has_upfront_costs(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        assert data["upfront_costs"] is not None
        assert data["upfront_costs"]["total"] > 0

    def test_no_cgt(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        assert data["cgt"] is None

    def test_no_rental_income(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        for y in data["years"]:
            assert y["rental_income"] == 0.0

    def test_no_tax_saving(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        for y in data["years"]:
            assert y["tax_saving"] == 0.0

    def test_no_rent_paid(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        for y in data["years"]:
            assert y["rent_paid"] == 0.0

    def test_income_grows(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        incomes = [y["net_income"] for y in data["years"]]
        for i in range(1, len(incomes)):
            assert incomes[i] > incomes[i - 1]

    def test_property_value_grows(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        values = [y["property_value"] for y in data["years"]]
        for i in range(1, len(values)):
            assert values[i] > values[i - 1]

    def test_loan_balance_decreases(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        balances = [y["loan_balance"] for y in data["years"]]
        for i in range(1, len(balances)):
            assert balances[i] <= balances[i - 1]

    def test_net_position_is_inflows_minus_outflows(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        for y in data["years"]:
            assert y["net_position"] == pytest.approx(y["total_inflows"] - y["total_outflows"], abs=0.01)

    def test_summary_net_wealth(self):
        data = client.post("/api/cashflow/single", json=_single_new_ppor()).json()
        last = data["years"][-1]
        expected = last["equity"] + last["cumulative_position"]
        assert data["summary"]["net_wealth"] == pytest.approx(expected, abs=1)


# ──────────────────────────────────────────────
# POST /api/cashflow/single — New Investment Values
# ──────────────────────────────────────────────


class TestSingleNewInvestmentValues:
    """Tests for new investment single endpoint values."""

    def test_has_upfront_costs(self):
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        assert data["upfront_costs"] is not None

    def test_has_cgt(self):
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        assert data["cgt"] is not None
        assert data["cgt"]["capital_gain"] > 0

    def test_rental_income_positive(self):
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        for y in data["years"]:
            assert y["rental_income"] > 0

    def test_tax_saving_present(self):
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        assert any(y["tax_saving"] != 0 for y in data["years"])

    def test_rent_paid_zero(self):
        """Single property (not rentvesting) → no rent paid."""
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        for y in data["years"]:
            assert y["rent_paid"] == 0.0

    def test_total_inflows_includes_rental_and_tax_saving(self):
        data = client.post("/api/cashflow/single", json=_single_new_investment()).json()
        for y in data["years"]:
            expected = y["net_income"] + y["rental_income"] + y["tax_saving"]
            assert y["total_inflows"] == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# POST /api/cashflow/single — Existing PPOR Values
# ──────────────────────────────────────────────


class TestSingleExistingPporValues:
    """Tests for existing PPOR single endpoint values."""

    def test_no_upfront_costs(self):
        data = client.post("/api/cashflow/single", json=_single_existing_ppor()).json()
        assert data["upfront_costs"] is None

    def test_no_cgt(self):
        data = client.post("/api/cashflow/single", json=_single_existing_ppor()).json()
        assert data["cgt"] is None

    def test_property_value_from_current_value(self):
        """Property value should start from current_value (600k), not purchase_price (500k)."""
        data = client.post("/api/cashflow/single", json=_single_existing_ppor()).json()
        assert data["years"][0]["property_value"] == pytest.approx(600_000, rel=0.01)

    def test_loan_balance_from_current_balance(self):
        data = client.post("/api/cashflow/single", json=_single_existing_ppor()).json()
        assert data["years"][0]["loan_balance"] < 350_000
        assert data["years"][0]["loan_balance"] > 300_000


# ──────────────────────────────────────────────
# POST /api/cashflow/single — Existing Investment Values
# ──────────────────────────────────────────────


class TestSingleExistingInvestmentValues:
    """Tests for existing investment single endpoint values."""

    def test_no_upfront_costs(self):
        data = client.post("/api/cashflow/single", json=_single_existing_investment()).json()
        assert data["upfront_costs"] is None

    def test_has_cgt(self):
        data = client.post("/api/cashflow/single", json=_single_existing_investment()).json()
        assert data["cgt"] is not None
        assert data["cgt"]["capital_gain"] > 0

    def test_rental_income_positive(self):
        data = client.post("/api/cashflow/single", json=_single_existing_investment()).json()
        for y in data["years"]:
            assert y["rental_income"] > 0

    def test_tax_saving_present(self):
        data = client.post("/api/cashflow/single", json=_single_existing_investment()).json()
        assert any(y["tax_saving"] != 0 for y in data["years"])

    def test_summary_total_rental_income(self):
        data = client.post("/api/cashflow/single", json=_single_existing_investment()).json()
        expected = sum(y["rental_income"] for y in data["years"])
        assert data["summary"]["total_rental_income"] == pytest.approx(expected, abs=0.01)


# ──────────────────────────────────────────────
# POST /api/cashflow/single — Validation
# ──────────────────────────────────────────────


class TestSingleEndpointValidation:
    """Tests for single endpoint input validation."""

    def test_missing_property_new_mode_returns_422(self):
        payload = _single_new_ppor()
        del payload["property"]
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_missing_loan_new_mode_returns_422(self):
        payload = _single_new_ppor()
        del payload["loan"]
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_missing_existing_property_returns_422(self):
        payload = _single_existing_ppor()
        del payload["existing_property"]
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_missing_existing_loan_returns_422(self):
        payload = _single_existing_ppor()
        del payload["existing_loan"]
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_missing_rental_investment_returns_422(self):
        payload = _single_new_ppor()
        payload["property_use"] = "investment"
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_invalid_mode_returns_422(self):
        payload = _single_new_ppor()
        payload["mode"] = "invalid"
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_invalid_property_use_returns_422(self):
        payload = _single_new_ppor()
        payload["property_use"] = "invalid"
        assert client.post("/api/cashflow/single", json=payload).status_code == 422

    def test_zero_projection_years_returns_422(self):
        assert client.post("/api/cashflow/single", json=_single_new_ppor(projection_years=0)).status_code == 422

    def test_get_returns_405(self):
        assert client.get("/api/cashflow/single").status_code == 405

    def test_defaults_work_with_minimal_new_ppor(self):
        payload = {
            "mode": "new",
            "property_use": "ppor",
            "property": {"purchase_price": 500_000, "purchase_date": "2020-01-15"},
            "loan": {"annual_rate": 0.06},
        }
        assert client.post("/api/cashflow/single", json=payload).status_code == 200

    def test_defaults_work_with_minimal_existing_ppor(self):
        payload = {
            "mode": "existing",
            "property_use": "ppor",
            "existing_property": {
                "purchase_price": 500_000,
                "purchase_date": "2020-01-15",
                "current_value": 600_000,
            },
            "existing_loan": {
                "current_balance": 350_000,
                "remaining_term_years": 25,
                "annual_rate": 0.06,
            },
        }
        assert client.post("/api/cashflow/single", json=payload).status_code == 200


# ──────────────────────────────────────────────
# Regression — Existing endpoints stable
# ──────────────────────────────────────────────


class TestExistingEndpointsStable:
    """Ensure PPOR and rentvest endpoints still work after adding /single."""

    def test_ppor_still_200(self):
        assert client.post("/api/cashflow/ppor", json=_ppor_payload()).status_code == 200

    def test_rentvest_still_200(self):
        assert client.post("/api/cashflow/rentvest", json=_rentvest_payload()).status_code == 200

    def test_ppor_scenario_unchanged(self):
        data = client.post("/api/cashflow/ppor", json=_ppor_payload()).json()
        assert data["scenario"] == "ppor"

    def test_rentvest_scenario_unchanged(self):
        data = client.post("/api/cashflow/rentvest", json=_rentvest_payload()).json()
        assert data["scenario"] == "rentvesting"
