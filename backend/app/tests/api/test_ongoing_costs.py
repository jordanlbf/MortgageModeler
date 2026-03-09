"""
Tests for API Ongoing Costs endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestOngoingCostsEstimate:
    """POST /api/ongoing-costs/estimate"""

    def _post(self, **overrides):
        payload = {
            "purchase_price": 500_000,
            "annual_growth_rate": 0.05,
            "weekly_rent": 500,
            "annual_rent_growth_rate": 0.03,
            "vacancy_weeks": 2,
            "is_investment": True,
            "projection_years": 10,
            "annual_cost_growth_rate": 0.025,
            "council_rates": 1_800,
            "water_rates": 1_200,
            "building_insurance": 1_500,
            "landlord_insurance": 1_000,
            "strata_fees": 3_000,
            "maintenance_rate": 0.01,
            "management_rate": 0.08,
            **overrides,
        }
        return client.post("/api/ongoing-costs/estimate", json=payload)

    # ── Status codes ──────────────────────────────

    def test_returns_200(self):
        res = self._post()
        assert res.status_code == 200

    def test_get_returns_405(self):
        res = client.get("/api/ongoing-costs/estimate")
        assert res.status_code == 405

    def test_empty_body_returns_200(self):
        res = client.post("/api/ongoing-costs/estimate", json={})
        assert res.status_code == 200

    # ── Response shape ────────────────────────────

    def test_response_has_top_level_fields(self):
        data = self._post().json()
        expected = {"annual_costs", "total_annual_cost", "total_monthly_cost", "total_deductible_cost"}
        assert set(data.keys()) == expected

    def test_annual_costs_is_list(self):
        data = self._post().json()
        assert isinstance(data["annual_costs"], list)

    def test_annual_costs_length_matches_projection_years(self):
        data = self._post(projection_years=5).json()
        assert len(data["annual_costs"]) == 5

    def test_annual_costs_length_default(self):
        data = self._post().json()
        assert len(data["annual_costs"]) == 10

    def test_year_entry_has_all_fields(self):
        data = self._post().json()
        year_entry = data["annual_costs"][0]
        expected_fields = {
            "year", "council_rates", "water_rates", "building_insurance",
            "landlord_insurance", "strata_fees", "maintenance_cost",
            "management_fee", "property_value", "rental_income", "total",
        }
        assert set(year_entry.keys()) == expected_fields

    def test_all_year_fields_are_numeric(self):
        data = self._post().json()
        for entry in data["annual_costs"]:
            for key, value in entry.items():
                assert isinstance(value, (int, float)), f"{key} is {type(value).__name__}"

    def test_years_are_sequential(self):
        data = self._post(projection_years=10).json()
        years = [entry["year"] for entry in data["annual_costs"]]
        assert years == list(range(1, 11))

    # ── Top-level summary values ──────────────────

    def test_total_annual_cost_is_year_1_total(self):
        data = self._post().json()
        assert data["total_annual_cost"] == pytest.approx(data["annual_costs"][0]["total"])

    def test_total_monthly_cost(self):
        data = self._post().json()
        assert data["total_monthly_cost"] == pytest.approx(data["total_annual_cost"] / 12)

    # ── Deductibility ─────────────────────────────

    def test_deductible_equals_total_for_investment(self):
        data = self._post(is_investment=True).json()
        assert data["total_deductible_cost"] == pytest.approx(data["total_annual_cost"])

    def test_deductible_zero_for_ppor(self):
        data = self._post(is_investment=False).json()
        assert data["total_deductible_cost"] == 0.0

    # ── Investment vs PPOR ────────────────────────

    def test_ppor_no_landlord_insurance(self):
        data = self._post(is_investment=False).json()
        for entry in data["annual_costs"]:
            assert entry["landlord_insurance"] == 0.0

    def test_ppor_no_management_fee(self):
        data = self._post(is_investment=False).json()
        for entry in data["annual_costs"]:
            assert entry["management_fee"] == 0.0

    def test_investment_has_landlord_insurance(self):
        data = self._post(is_investment=True, landlord_insurance=1_000).json()
        assert data["annual_costs"][0]["landlord_insurance"] > 0

    def test_investment_has_management_fee(self):
        data = self._post(is_investment=True).json()
        assert data["annual_costs"][0]["management_fee"] > 0

    def test_investment_total_higher_than_ppor(self):
        inv = self._post(is_investment=True).json()
        ppor = self._post(is_investment=False).json()
        assert inv["total_annual_cost"] > ppor["total_annual_cost"]

    # ── Total is sum of components ────────────────

    def test_year_total_equals_sum_of_costs(self):
        data = self._post().json()
        for entry in data["annual_costs"]:
            component_sum = (
                entry["council_rates"] + entry["water_rates"] +
                entry["building_insurance"] + entry["landlord_insurance"] +
                entry["strata_fees"] + entry["maintenance_cost"] +
                entry["management_fee"]
            )
            assert entry["total"] == pytest.approx(component_sum, abs=0.01)

    # ── Fixed cost compounding ────────────────────

    def test_council_rates_grow_annually(self):
        data = self._post(council_rates=1_800, annual_cost_growth_rate=0.025).json()
        yr1 = data["annual_costs"][0]["council_rates"]
        yr2 = data["annual_costs"][1]["council_rates"]
        assert yr1 == pytest.approx(1_800)
        assert yr2 == pytest.approx(1_800 * 1.025)

    def test_water_rates_grow_annually(self):
        data = self._post(water_rates=1_200, annual_cost_growth_rate=0.025).json()
        yr1 = data["annual_costs"][0]["water_rates"]
        yr2 = data["annual_costs"][1]["water_rates"]
        assert yr1 == pytest.approx(1_200)
        assert yr2 == pytest.approx(1_200 * 1.025)

    def test_building_insurance_grows_annually(self):
        data = self._post(building_insurance=1_500, annual_cost_growth_rate=0.025).json()
        yr1 = data["annual_costs"][0]["building_insurance"]
        yr2 = data["annual_costs"][1]["building_insurance"]
        assert yr1 == pytest.approx(1_500)
        assert yr2 == pytest.approx(1_500 * 1.025)

    def test_strata_fees_grow_annually(self):
        data = self._post(strata_fees=3_000, annual_cost_growth_rate=0.025).json()
        yr1 = data["annual_costs"][0]["strata_fees"]
        yr2 = data["annual_costs"][1]["strata_fees"]
        assert yr1 == pytest.approx(3_000)
        assert yr2 == pytest.approx(3_000 * 1.025)

    def test_landlord_insurance_grows_annually(self):
        data = self._post(landlord_insurance=1_000, annual_cost_growth_rate=0.025, is_investment=True).json()
        yr1 = data["annual_costs"][0]["landlord_insurance"]
        yr2 = data["annual_costs"][1]["landlord_insurance"]
        assert yr1 == pytest.approx(1_000)
        assert yr2 == pytest.approx(1_000 * 1.025)

    def test_all_fixed_costs_increase_year_over_year(self):
        data = self._post(annual_cost_growth_rate=0.03).json()
        fixed_fields = ["council_rates", "water_rates", "building_insurance", "strata_fees"]
        for field in fixed_fields:
            for i in range(len(data["annual_costs"]) - 1):
                assert data["annual_costs"][i + 1][field] > data["annual_costs"][i][field]

    # ── Maintenance cost ──────────────────────────

    def test_maintenance_year_1(self):
        data = self._post(purchase_price=500_000, maintenance_rate=0.01, annual_growth_rate=0.05).json()
        assert data["annual_costs"][0]["maintenance_cost"] == pytest.approx(5_000)

    def test_maintenance_year_2(self):
        data = self._post(purchase_price=500_000, maintenance_rate=0.01, annual_growth_rate=0.05).json()
        assert data["annual_costs"][1]["maintenance_cost"] == pytest.approx(5_250)

    def test_maintenance_grows_with_property_value(self):
        data = self._post(annual_growth_rate=0.05).json()
        for i in range(len(data["annual_costs"]) - 1):
            assert data["annual_costs"][i + 1]["maintenance_cost"] > data["annual_costs"][i]["maintenance_cost"]

    def test_maintenance_zero_rate(self):
        data = self._post(maintenance_rate=0.0).json()
        for entry in data["annual_costs"]:
            assert entry["maintenance_cost"] == 0.0

    # ── Management fee ────────────────────────────

    def test_management_fee_year_1(self):
        data = self._post(weekly_rent=500, vacancy_weeks=2, management_rate=0.08,
                          annual_rent_growth_rate=0.03, is_investment=True).json()
        assert data["annual_costs"][0]["management_fee"] == pytest.approx(25_000 * 0.08)

    def test_management_fee_year_2(self):
        data = self._post(weekly_rent=500, vacancy_weeks=2, management_rate=0.08,
                          annual_rent_growth_rate=0.03, is_investment=True).json()
        assert data["annual_costs"][1]["management_fee"] == pytest.approx(25_000 * 1.03 * 0.08)

    def test_management_fee_grows_with_rent(self):
        data = self._post(is_investment=True, annual_rent_growth_rate=0.03).json()
        for i in range(len(data["annual_costs"]) - 1):
            assert data["annual_costs"][i + 1]["management_fee"] > data["annual_costs"][i]["management_fee"]

    # ── Property value and rental income ──────────

    def test_property_value_year_1(self):
        data = self._post(purchase_price=500_000, annual_growth_rate=0.05).json()
        assert data["annual_costs"][0]["property_value"] == pytest.approx(500_000)

    def test_property_value_year_2(self):
        data = self._post(purchase_price=500_000, annual_growth_rate=0.05).json()
        assert data["annual_costs"][1]["property_value"] == pytest.approx(525_000)

    def test_property_value_grows_annually(self):
        data = self._post(annual_growth_rate=0.05).json()
        for i in range(len(data["annual_costs"]) - 1):
            assert data["annual_costs"][i + 1]["property_value"] > data["annual_costs"][i]["property_value"]

    def test_rental_income_year_1(self):
        data = self._post(weekly_rent=500, vacancy_weeks=2, annual_rent_growth_rate=0.03).json()
        assert data["annual_costs"][0]["rental_income"] == pytest.approx(25_000)

    def test_rental_income_year_2(self):
        data = self._post(weekly_rent=500, vacancy_weeks=2, annual_rent_growth_rate=0.03).json()
        assert data["annual_costs"][1]["rental_income"] == pytest.approx(25_750)

    def test_rental_income_grows_annually(self):
        data = self._post(annual_rent_growth_rate=0.03).json()
        for i in range(len(data["annual_costs"]) - 1):
            assert data["annual_costs"][i + 1]["rental_income"] > data["annual_costs"][i]["rental_income"]

    # ── Vacancy ───────────────────────────────────

    def test_higher_vacancy_reduces_rental_income(self):
        low_vacancy = self._post(vacancy_weeks=2).json()
        high_vacancy = self._post(vacancy_weeks=10).json()
        assert low_vacancy["annual_costs"][0]["rental_income"] > high_vacancy["annual_costs"][0]["rental_income"]

    def test_full_vacancy_zero_rental_income(self):
        data = self._post(vacancy_weeks=52).json()
        for entry in data["annual_costs"]:
            assert entry["rental_income"] == 0.0

    def test_full_vacancy_zero_management_fee(self):
        data = self._post(vacancy_weeks=52, is_investment=True).json()
        for entry in data["annual_costs"]:
            assert entry["management_fee"] == 0.0

    # ── Zero growth rates ─────────────────────────

    def test_zero_cost_growth_flat_costs(self):
        data = self._post(annual_cost_growth_rate=0.0).json()
        yr1 = data["annual_costs"][0]
        yr10 = data["annual_costs"][9]
        assert yr1["council_rates"] == pytest.approx(yr10["council_rates"])
        assert yr1["water_rates"] == pytest.approx(yr10["water_rates"])
        assert yr1["building_insurance"] == pytest.approx(yr10["building_insurance"])
        assert yr1["strata_fees"] == pytest.approx(yr10["strata_fees"])

    def test_zero_property_growth_flat_maintenance(self):
        data = self._post(annual_growth_rate=0.0).json()
        yr1 = data["annual_costs"][0]["maintenance_cost"]
        yr10 = data["annual_costs"][9]["maintenance_cost"]
        assert yr1 == pytest.approx(yr10)

    def test_zero_rent_growth_flat_management(self):
        data = self._post(annual_rent_growth_rate=0.0, is_investment=True).json()
        yr1 = data["annual_costs"][0]["management_fee"]
        yr10 = data["annual_costs"][9]["management_fee"]
        assert yr1 == pytest.approx(yr10)

    # ── Validation errors (422) ───────────────────

    def test_negative_purchase_price_returns_422(self):
        res = self._post(purchase_price=-1)
        assert res.status_code == 422

    def test_negative_weekly_rent_returns_422(self):
        res = self._post(weekly_rent=-1)
        assert res.status_code == 422

    def test_growth_rate_over_1_returns_422(self):
        res = self._post(annual_growth_rate=1.5)
        assert res.status_code == 422

    def test_rent_growth_over_1_returns_422(self):
        res = self._post(annual_rent_growth_rate=1.5)
        assert res.status_code == 422

    def test_cost_growth_over_1_returns_422(self):
        res = self._post(annual_cost_growth_rate=1.5)
        assert res.status_code == 422

    def test_maintenance_rate_over_1_returns_422(self):
        res = self._post(maintenance_rate=1.5)
        assert res.status_code == 422

    def test_management_rate_over_1_returns_422(self):
        res = self._post(management_rate=1.5)
        assert res.status_code == 422

    def test_negative_council_rates_returns_422(self):
        res = self._post(council_rates=-100)
        assert res.status_code == 422

    def test_vacancy_weeks_over_52_returns_422(self):
        res = self._post(vacancy_weeks=53)
        assert res.status_code == 422

    def test_projection_years_zero_returns_422(self):
        res = self._post(projection_years=0)
        assert res.status_code == 422

    def test_projection_years_over_50_returns_422(self):
        res = self._post(projection_years=51)
        assert res.status_code == 422

    def test_negative_growth_rate_returns_422(self):
        res = self._post(annual_growth_rate=-0.01)
        assert res.status_code == 422

    # ── Invalid types ─────────────────────────────

    def test_string_purchase_price_returns_422(self):
        res = client.post("/api/ongoing-costs/estimate", json={"purchase_price": "abc"})
        assert res.status_code == 422

    def test_string_weekly_rent_returns_422(self):
        res = client.post("/api/ongoing-costs/estimate", json={"weekly_rent": "abc"})
        assert res.status_code == 422

    def test_string_is_investment_returns_422(self):
        res = client.post("/api/ongoing-costs/estimate", json={"is_investment": "not_a_bool"})
        assert res.status_code == 422

    # ── Edge cases ────────────────────────────────

    def test_zero_purchase_price(self):
        data = self._post(purchase_price=0).json()
        for entry in data["annual_costs"]:
            assert entry["property_value"] == 0.0
            assert entry["maintenance_cost"] == 0.0

    def test_zero_weekly_rent(self):
        data = self._post(weekly_rent=0, is_investment=True).json()
        for entry in data["annual_costs"]:
            assert entry["rental_income"] == 0.0
            assert entry["management_fee"] == 0.0

    def test_all_zero_costs(self):
        data = self._post(
            council_rates=0, water_rates=0, building_insurance=0,
            landlord_insurance=0, strata_fees=0, maintenance_rate=0,
            management_rate=0, weekly_rent=0,
        ).json()
        for entry in data["annual_costs"]:
            assert entry["total"] == 0.0

    def test_projection_1_year(self):
        data = self._post(projection_years=1).json()
        assert len(data["annual_costs"]) == 1
        assert data["annual_costs"][0]["year"] == 1

    def test_projection_50_years(self):
        data = self._post(projection_years=50).json()
        assert len(data["annual_costs"]) == 50
        assert data["annual_costs"][-1]["year"] == 50

    # ── Defaults produce valid response ───────────

    def test_defaults_produce_valid_response(self):
        data = client.post("/api/ongoing-costs/estimate", json={}).json()
        assert data["total_annual_cost"] == 0.0
        assert data["total_monthly_cost"] == 0.0
        assert data["total_deductible_cost"] == 0.0

    def test_defaults_projection_years(self):
        data = client.post("/api/ongoing-costs/estimate", json={}).json()
        assert len(data["annual_costs"]) == 10

    # ── Partial payloads ──────────────────────────

    def test_only_purchase_price(self):
        res = client.post("/api/ongoing-costs/estimate", json={"purchase_price": 500_000})
        assert res.status_code == 200
        data = res.json()
        assert data["annual_costs"][0]["maintenance_cost"] > 0

    def test_only_is_investment(self):
        res = client.post("/api/ongoing-costs/estimate", json={"is_investment": True})
        assert res.status_code == 200

    # ── End-to-end known values ───────────────────

    def test_end_to_end_investment_year_1(self):
        data = self._post(
            purchase_price=500_000, annual_growth_rate=0.05,
            weekly_rent=500, vacancy_weeks=2, annual_rent_growth_rate=0.03,
            is_investment=True, projection_years=3, annual_cost_growth_rate=0.025,
            council_rates=1_800, water_rates=1_200, building_insurance=1_500,
            landlord_insurance=1_000, strata_fees=3_000,
            maintenance_rate=0.01, management_rate=0.08,
        ).json()

        yr1 = data["annual_costs"][0]
        assert yr1["year"] == 1
        assert yr1["council_rates"] == pytest.approx(1_800)
        assert yr1["water_rates"] == pytest.approx(1_200)
        assert yr1["building_insurance"] == pytest.approx(1_500)
        assert yr1["landlord_insurance"] == pytest.approx(1_000)
        assert yr1["strata_fees"] == pytest.approx(3_000)
        assert yr1["maintenance_cost"] == pytest.approx(5_000)
        assert yr1["management_fee"] == pytest.approx(2_000)
        assert yr1["property_value"] == pytest.approx(500_000)
        assert yr1["rental_income"] == pytest.approx(25_000)
        expected_total = 1_800 + 1_200 + 1_500 + 1_000 + 3_000 + 5_000 + 2_000
        assert yr1["total"] == pytest.approx(expected_total)
        assert data["total_annual_cost"] == pytest.approx(expected_total)
        assert data["total_monthly_cost"] == pytest.approx(expected_total / 12)
        assert data["total_deductible_cost"] == pytest.approx(expected_total)

    def test_end_to_end_investment_year_2(self):
        data = self._post(
            purchase_price=500_000, annual_growth_rate=0.05,
            weekly_rent=500, vacancy_weeks=2, annual_rent_growth_rate=0.03,
            is_investment=True, projection_years=3, annual_cost_growth_rate=0.025,
            council_rates=1_800, water_rates=1_200, building_insurance=1_500,
            landlord_insurance=1_000, strata_fees=3_000,
            maintenance_rate=0.01, management_rate=0.08,
        ).json()

        yr2 = data["annual_costs"][1]
        assert yr2["year"] == 2
        assert yr2["council_rates"] == pytest.approx(1_800 * 1.025)
        assert yr2["water_rates"] == pytest.approx(1_200 * 1.025)
        assert yr2["building_insurance"] == pytest.approx(1_500 * 1.025)
        assert yr2["landlord_insurance"] == pytest.approx(1_000 * 1.025)
        assert yr2["strata_fees"] == pytest.approx(3_000 * 1.025)
        assert yr2["maintenance_cost"] == pytest.approx(525_000 * 0.01)
        assert yr2["management_fee"] == pytest.approx(25_750 * 0.08)
        assert yr2["property_value"] == pytest.approx(525_000)
        assert yr2["rental_income"] == pytest.approx(25_750)

    def test_end_to_end_ppor_year_1(self):
        data = self._post(
            purchase_price=500_000, annual_growth_rate=0.05,
            weekly_rent=500, vacancy_weeks=2, annual_rent_growth_rate=0.03,
            is_investment=False, projection_years=3, annual_cost_growth_rate=0.025,
            council_rates=1_800, water_rates=1_200, building_insurance=1_500,
            landlord_insurance=1_000, strata_fees=3_000,
            maintenance_rate=0.01, management_rate=0.08,
        ).json()

        yr1 = data["annual_costs"][0]
        assert yr1["landlord_insurance"] == 0.0
        assert yr1["management_fee"] == 0.0
        expected_total = 1_800 + 1_200 + 1_500 + 0 + 3_000 + 5_000 + 0
        assert yr1["total"] == pytest.approx(expected_total)
        assert data["total_deductible_cost"] == 0.0

    # ── Costs increase over time ──────────────────

    def test_total_increases_over_projection(self):
        data = self._post(annual_cost_growth_rate=0.025, annual_growth_rate=0.05).json()
        for i in range(len(data["annual_costs"]) - 1):
            assert data["annual_costs"][i + 1]["total"] > data["annual_costs"][i]["total"]
