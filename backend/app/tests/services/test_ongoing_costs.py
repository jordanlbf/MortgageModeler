"""
Tests for ongoing costs service — calculate_year_cost and build_ongoing_cost_projection.
"""

from datetime import date

import pytest

from app.models.loan import BorrowingCosts, LoanConfig
from app.models.mortgage import Mortgage
from app.models.property import OngoingCostsConfig, Property, RentalConfig
from app.services.amortisation import build_loan
from app.services.ongoing_costs import build_ongoing_cost_projection, calculate_year_cost

# ──────────────────────────────────────────────
# Fixtures / Helpers
# ──────────────────────────────────────────────


def _make_property(
    purchase_price=500_000, annual_appreciation=0.03, weekly_rent=500, vacancy_weeks=2, rent_growth=0.03, is_ppor=False
) -> Property:
    return Property(
        purchase_date=date(2020, 1, 15),
        purchase_price=purchase_price,
        is_new_property=False,
        is_ppor=is_ppor,
        annual_appreciation=annual_appreciation,
        rental=RentalConfig(
            weekly_rent=weekly_rent,
            annual_growth_rate=rent_growth,
            vacancy_weeks=vacancy_weeks,
        ),
    )


def _make_ongoing_costs(
    council_rates=2_000,
    water_rates=1_200,
    building_insurance=1_500,
    strata_fees=3_000,
    maintenance_rate=0.005,
    landlord_insurance=1_000,
    management_rate=0.08,
    annual_cost_growth_rate=0.025,
) -> OngoingCostsConfig:
    return OngoingCostsConfig(
        council_rates=council_rates,
        water_rates=water_rates,
        building_insurance=building_insurance,
        strata_fees=strata_fees,
        maintenance_rate=maintenance_rate,
        landlord_insurance=landlord_insurance,
        management_rate=management_rate,
        annual_cost_growth_rate=annual_cost_growth_rate,
    )


def _make_mortgage(property=None, ongoing_costs=None, projection_years=10) -> Mortgage:
    p = property or _make_property()
    lc = LoanConfig(
        deposit=0,
        annual_rate=0.0,
        loan_term_years=30,
        borrowing_costs=BorrowingCosts(lmi=0.0, mortgage_registration_fee=0.0, loan_establishment_fee=0.0),
    )
    return Mortgage(
        property=p,
        loan=build_loan(p, lc),
        ongoing_costs=ongoing_costs or _make_ongoing_costs(),
        projection_years=projection_years,
    )


def _build(property=None, ongoing_costs=None, projection_years=10):
    return build_ongoing_cost_projection(_make_mortgage(property, ongoing_costs, projection_years))


# ──────────────────────────────────────────────
# Structure
# ──────────────────────────────────────────────


class TestProjectionStructure:
    """Tests for the returned OngoingCostProjection structure."""

    def test_annual_costs_length(self):
        """Should return one YearCost per projection year."""
        result = _build(projection_years=5)
        assert len(result.annual_costs) == 5

    def test_years_are_sequential(self):
        result = _build(projection_years=5)
        years = [c.year for c in result.annual_costs]
        assert years == [0, 1, 2, 3, 4]

    def test_total_annual_cost_matches_year_one(self):
        """Summary total_annual_cost should match year 1 total."""
        result = _build()
        assert result.total_annual_cost == pytest.approx(result.annual_costs[0].total_costs)

    def test_total_monthly_cost(self):
        """Monthly cost should be year 1 annual / 12."""
        result = _build()
        assert result.total_monthly_cost == pytest.approx(result.total_annual_cost / 12)

    def test_single_year_projection(self):
        result = _build(projection_years=1)
        assert len(result.annual_costs) == 1


# ──────────────────────────────────────────────
# Investment vs PPOR
# ──────────────────────────────────────────────


class TestInvestmentVsPpor:
    """Tests for investment-specific cost behaviour."""

    def test_investment_has_landlord_insurance(self):
        result = _build(property=_make_property(is_ppor=False))
        assert result.annual_costs[0].landlord_insurance > 0

    def test_ppor_no_landlord_insurance(self):
        result = _build(property=_make_property(is_ppor=True))
        for yc in result.annual_costs:
            assert yc.landlord_insurance == 0.0

    def test_investment_has_management_fee(self):
        result = _build(property=_make_property(is_ppor=False))
        assert result.annual_costs[0].management_fee > 0

    def test_ppor_no_management_fee(self):
        result = _build(property=_make_property(is_ppor=True))
        for yc in result.annual_costs:
            assert yc.management_fee == 0.0

    def test_deductible_cost_for_investment(self):
        """Investment property: total_deductible_cost = year 1 total."""
        result = _build(property=_make_property(is_ppor=False))
        assert result.total_deductible_cost == pytest.approx(result.total_annual_cost)

    def test_deductible_cost_for_ppor(self):
        """PPOR: total_deductible_cost should be zero."""
        result = _build(property=_make_property(is_ppor=True))
        assert result.total_deductible_cost == 0.0


# ──────────────────────────────────────────────
# Year 1 cost calculations
# ──────────────────────────────────────────────


class TestYearOneCosts:
    """Tests for year 1 individual cost calculations (no growth applied)."""

    def test_council_rates_year_one(self):
        result = _build(ongoing_costs=_make_ongoing_costs(council_rates=2_000))
        assert result.annual_costs[0].council_rates == pytest.approx(2_000)

    def test_water_rates_year_one(self):
        result = _build(ongoing_costs=_make_ongoing_costs(water_rates=1_200))
        assert result.annual_costs[0].water_rates == pytest.approx(1_200)

    def test_building_insurance_year_one(self):
        result = _build(ongoing_costs=_make_ongoing_costs(building_insurance=1_500))
        assert result.annual_costs[0].building_insurance == pytest.approx(1_500)

    def test_strata_fees_year_one(self):
        result = _build(ongoing_costs=_make_ongoing_costs(strata_fees=3_000))
        assert result.annual_costs[0].strata_fees == pytest.approx(3_000)

    def test_maintenance_cost_year_one(self):
        """Year 1 maintenance = purchase_price * maintenance_rate (no growth yet)."""
        result = _build(
            property=_make_property(purchase_price=500_000, annual_appreciation=0.03),
            ongoing_costs=_make_ongoing_costs(maintenance_rate=0.005),
        )
        assert result.annual_costs[0].maintenance_cost == pytest.approx(2_500)

    def test_management_fee_year_one(self):
        """Year 1 management = rental_income * management_rate."""
        result = _build(
            property=_make_property(weekly_rent=500, vacancy_weeks=2, is_ppor=False),
            ongoing_costs=_make_ongoing_costs(management_rate=0.08),
        )
        rental_income = 500 * (52 - 2)
        expected = rental_income * 0.08
        assert result.annual_costs[0].management_fee == pytest.approx(expected)

    def test_rental_income_year_one(self):
        result = _build(property=_make_property(weekly_rent=600, vacancy_weeks=3))
        expected = 600 * (52 - 3)
        assert result.annual_costs[0].rental_income == pytest.approx(expected)

    def test_property_value_year_one(self):
        """Year 1 property value = purchase_price (no growth in year 1)."""
        result = _build(property=_make_property(purchase_price=500_000))
        assert result.annual_costs[0].property_value == pytest.approx(500_000)

    def test_total_is_sum_of_costs(self):
        """Total should be sum of all cost items (not including property_value or rental_income)."""
        result = _build()
        y1 = result.annual_costs[0]
        expected = (
            y1.council_rates
            + y1.water_rates
            + y1.building_insurance
            + y1.landlord_insurance
            + y1.strata_fees
            + y1.maintenance_cost
            + y1.management_fee
        )
        assert y1.total_costs == pytest.approx(expected)


# ──────────────────────────────────────────────
# Growth over time
# ──────────────────────────────────────────────


class TestGrowthOverTime:
    """Tests for annual cost growth and property appreciation."""

    def test_costs_grow_with_cost_growth_rate(self):
        """Council rates at year 2 should reflect cost growth."""
        result = _build(
            ongoing_costs=_make_ongoing_costs(council_rates=2_000, annual_cost_growth_rate=0.05),
            projection_years=2,
        )
        y1 = result.annual_costs[0].council_rates
        y2 = result.annual_costs[1].council_rates
        assert y2 == pytest.approx(y1 * 1.05)

    def test_water_rates_grow(self):
        result = _build(
            ongoing_costs=_make_ongoing_costs(water_rates=1_000, annual_cost_growth_rate=0.03),
            projection_years=3,
        )
        assert result.annual_costs[2].water_rates == pytest.approx(1_000 * 1.03**2)

    def test_property_value_grows(self):
        result = _build(
            property=_make_property(purchase_price=500_000, annual_appreciation=0.04),
            projection_years=5,
        )
        assert result.annual_costs[4].property_value == pytest.approx(500_000 * 1.04**4)

    def test_rental_income_grows(self):
        result = _build(
            property=_make_property(weekly_rent=500, vacancy_weeks=2, rent_growth=0.03),
            projection_years=3,
        )
        y1_income = 500 * 50
        assert result.annual_costs[2].rental_income == pytest.approx(y1_income * 1.03**2)

    def test_maintenance_grows_with_property_value(self):
        """Maintenance is based on appreciated property value, not purchase price."""
        result = _build(
            property=_make_property(purchase_price=500_000, annual_appreciation=0.05),
            ongoing_costs=_make_ongoing_costs(maintenance_rate=0.01),
            projection_years=3,
        )
        y3_pv = 500_000 * 1.05**2
        assert result.annual_costs[2].maintenance_cost == pytest.approx(y3_pv * 0.01)

    def test_total_increases_over_time(self):
        """With positive growth, total costs should increase each year."""
        result = _build(
            property=_make_property(annual_appreciation=0.03),
            ongoing_costs=_make_ongoing_costs(annual_cost_growth_rate=0.03),
            projection_years=5,
        )
        for i in range(1, len(result.annual_costs)):
            assert result.annual_costs[i].total_costs > result.annual_costs[i - 1].total_costs


# ──────────────────────────────────────────────
# Zero growth
# ──────────────────────────────────────────────


class TestZeroGrowth:
    """Tests for zero growth rates — costs should stay flat."""

    def test_zero_cost_growth(self):
        result = _build(
            property=_make_property(annual_appreciation=0.0, rent_growth=0.0),
            ongoing_costs=_make_ongoing_costs(annual_cost_growth_rate=0.0),
            projection_years=5,
        )
        y1 = result.annual_costs[0]
        for yc in result.annual_costs[1:]:
            assert yc.council_rates == pytest.approx(y1.council_rates)
            assert yc.water_rates == pytest.approx(y1.water_rates)
            assert yc.building_insurance == pytest.approx(y1.building_insurance)

    def test_zero_growth_property_value_flat(self):
        result = _build(
            property=_make_property(annual_appreciation=0.0),
            projection_years=5,
        )
        for yc in result.annual_costs:
            assert yc.property_value == pytest.approx(500_000)


# ──────────────────────────────────────────────
# Edge cases
# ──────────────────────────────────────────────


class TestEdgeCases:
    """Tests for edge case inputs."""

    def test_zero_rent(self):
        """Zero rent should produce zero management fee and rental income."""
        result = _build(property=_make_property(weekly_rent=0, is_ppor=False))
        for yc in result.annual_costs:
            assert yc.rental_income == 0.0
            assert yc.management_fee == 0.0

    def test_zero_strata(self):
        result = _build(ongoing_costs=_make_ongoing_costs(strata_fees=0))
        for yc in result.annual_costs:
            assert yc.strata_fees == 0.0

    def test_high_vacancy(self):
        """52 weeks vacancy — zero rental income."""
        result = _build(property=_make_property(vacancy_weeks=52))
        for yc in result.annual_costs:
            assert yc.rental_income == 0.0

    def test_zero_maintenance_rate(self):
        result = _build(ongoing_costs=_make_ongoing_costs(maintenance_rate=0.0))
        for yc in result.annual_costs:
            assert yc.maintenance_cost == 0.0

    def test_all_costs_zero(self):
        """All base costs zero — total should be zero."""
        result = _build(
            property=_make_property(weekly_rent=0),
            ongoing_costs=_make_ongoing_costs(
                council_rates=0,
                water_rates=0,
                building_insurance=0,
                landlord_insurance=0,
                strata_fees=0,
                maintenance_rate=0,
                management_rate=0,
            ),
        )
        for yc in result.annual_costs:
            assert yc.total_costs == pytest.approx(0)


# ──────────────────────────────────────────────
# calculate_year_cost (single year)
# ──────────────────────────────────────────────


class TestCalculateYearCost:
    """Tests for calculate_year_cost single-year helper."""

    def test_year_zero_no_growth(self):
        """Year 0 returns base rates unchanged."""
        result = calculate_year_cost(0, _make_mortgage())
        assert result.year == 0
        assert result.council_rates == pytest.approx(2_000)
        assert result.water_rates == pytest.approx(1_200)
        assert result.building_insurance == pytest.approx(1_500)
        assert result.strata_fees == pytest.approx(3_000)

    def test_year_zero_property_value(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(purchase_price=500_000)))
        assert result.property_value == pytest.approx(500_000)

    def test_year_zero_rental_income(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(weekly_rent=500, vacancy_weeks=2)))
        assert result.rental_income == pytest.approx(500 * 50)

    def test_year_zero_maintenance(self):
        result = calculate_year_cost(
            0,
            _make_mortgage(
                property=_make_property(purchase_price=500_000),
                ongoing_costs=_make_ongoing_costs(maintenance_rate=0.01),
            ),
        )
        assert result.maintenance_cost == pytest.approx(5_000)

    def test_year_one_costs_grow(self):
        """Year 1 should reflect cost growth rate."""
        m = _make_mortgage(ongoing_costs=_make_ongoing_costs(annual_cost_growth_rate=0.05))
        y0 = calculate_year_cost(0, m)
        y1 = calculate_year_cost(1, m)
        assert y1.council_rates == pytest.approx(y0.council_rates * 1.05)
        assert y1.water_rates == pytest.approx(y0.water_rates * 1.05)

    def test_year_two_property_appreciates(self):
        m = _make_mortgage(property=_make_property(purchase_price=500_000, annual_appreciation=0.04))
        result = calculate_year_cost(2, m)
        assert result.property_value == pytest.approx(500_000 * 1.04**2)

    def test_year_two_rental_income_grows(self):
        m = _make_mortgage(property=_make_property(weekly_rent=500, vacancy_weeks=2, rent_growth=0.03))
        result = calculate_year_cost(2, m)
        assert result.rental_income == pytest.approx(500 * 50 * 1.03**2)

    def test_total_is_sum_of_costs(self):
        result = calculate_year_cost(0, _make_mortgage())
        expected = (
            result.council_rates
            + result.water_rates
            + result.building_insurance
            + result.landlord_insurance
            + result.strata_fees
            + result.maintenance_cost
            + result.management_fee
        )
        assert result.total_costs == pytest.approx(expected)

    def test_ppor_no_landlord_insurance(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(is_ppor=True)))
        assert result.landlord_insurance == 0.0

    def test_ppor_no_management_fee(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(is_ppor=True)))
        assert result.management_fee == 0.0

    def test_investment_has_landlord_insurance(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(is_ppor=False)))
        assert result.landlord_insurance > 0

    def test_investment_has_management_fee(self):
        result = calculate_year_cost(0, _make_mortgage(property=_make_property(is_ppor=False)))
        assert result.management_fee > 0

    def test_maintenance_grows_with_property_value(self):
        m = _make_mortgage(
            property=_make_property(purchase_price=500_000, annual_appreciation=0.05),
            ongoing_costs=_make_ongoing_costs(maintenance_rate=0.01),
        )
        result = calculate_year_cost(2, m)
        expected_pv = 500_000 * 1.05**2
        assert result.maintenance_cost == pytest.approx(expected_pv * 0.01)

    def test_matches_projection_output(self):
        """Single year should match the corresponding year from a full projection."""
        m = _make_mortgage(projection_years=5)
        single = calculate_year_cost(3, m)
        projection = build_ongoing_cost_projection(m)
        from_projection = projection.annual_costs[3]
        assert single.total_costs == pytest.approx(from_projection.total_costs)
        assert single.property_value == pytest.approx(from_projection.property_value)
        assert single.rental_income == pytest.approx(from_projection.rental_income)
