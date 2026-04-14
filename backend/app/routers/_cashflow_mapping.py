"""
Shared mapping helpers for cashflow-related request/response schemas.

Maps Pydantic request schemas to domain models and domain models back
to Pydantic response schemas. Used by both cashflow and comparison routers.
"""

from app.models.deductions import DepreciableAsset, DepreciableBuilding
from app.models.loan import BorrowingCosts, LoanConfig, RateChange
from app.models.property import OngoingCostsConfig, Property, PurchaseCosts, RentalConfig
from app.models.tax import TaxProfile
from app.schemas.cashflow import (
    BorrowingCostsResponse,
    CashFlowPPORRequest,
    CashFlowPPORResponse,
    CashFlowRentvestResponse,
    CashFlowSummaryResponse,
    CashFlowYearResponse,
    CGTResponse,
    OngoingCostsDetailResponse,
    PurchaseCostsResponse,
    TaxDeductionDetailResponse,
    UpfrontCostsResponse,
)
from app.schemas.cashflow_single import (
    CashFlowSingleRequest,
    CashFlowSingleResponse,
)

# ── Request schema → domain model ─────────────


def build_tax_profile(req: CashFlowPPORRequest) -> TaxProfile:
    """Map TaxProfileRequest to TaxProfile domain model."""
    return TaxProfile(
        taxable_income=req.tax_profile.taxable_income,
        repayment_income=req.tax_profile.repayment_income,
        mls_income=req.tax_profile.mls_income,
        hecs_balance=req.tax_profile.hecs_balance,
        has_private_health=req.tax_profile.has_private_health,
        income_growth_rate=req.tax_profile.income_growth_rate,
    )


def build_property(req: CashFlowPPORRequest) -> Property:
    """Map PropertyRequest to Property domain model with all sub-models."""
    return Property(
        purchase_date=req.property.purchase_date,
        purchase_price=req.property.purchase_price,
        is_new_property=req.property.is_new_property,
        is_ppor=req.property.is_ppor,
        annual_appreciation=req.property.annual_appreciation,
        purchase_costs=PurchaseCosts(
            stamp_duty=req.property.purchase_costs.stamp_duty,
            legal_fees=req.property.purchase_costs.legal_fees,
            building_pest_inspection=req.property.purchase_costs.building_pest_inspection,
            registration_fee=req.property.purchase_costs.registration_fee,
            other_costs=req.property.purchase_costs.other_costs,
        ),
        rental=RentalConfig(
            weekly_rent=req.property.rental.weekly_rent,
            annual_growth_rate=req.property.rental.annual_growth_rate,
            vacancy_weeks=req.property.rental.vacancy_weeks,
        ),
        depreciable_buildings=[
            DepreciableBuilding(
                name=b.name,
                construction_cost=b.construction_cost,
                purchase_date=b.purchase_date,
                construction_start_date=b.construction_start_date,
            )
            for b in req.property.depreciable_buildings
        ],
        depreciable_assets=[
            DepreciableAsset(
                name=a.name,
                cost=a.cost,
                effective_life_years=a.effective_life_years,
                purchase_date=a.purchase_date,
                method=a.method,
                written_down_value=a.written_down_value,
            )
            for a in req.property.depreciable_assets
        ],
    )


def build_loan_config(req: CashFlowPPORRequest) -> LoanConfig:
    """Map LoanRequest to LoanConfig domain model."""
    return LoanConfig(
        deposit=req.loan.deposit,
        annual_rate=req.loan.annual_rate,
        loan_term_years=req.loan.loan_term_years,
        frequency=req.loan.frequency,
        offset_balance=req.loan.offset_balance,
        offset_contribution=req.loan.offset_contribution,
        extra_repayment=req.loan.extra_repayment,
        rate_changes=[
            RateChange(from_period=rc.from_period, annual_rate=rc.annual_rate) for rc in req.loan.rate_changes
        ],
        borrowing_costs=BorrowingCosts(
            lmi=req.loan.borrowing_costs.lmi,
            mortgage_registration_fee=req.loan.borrowing_costs.mortgage_registration_fee,
            loan_establishment_fee=req.loan.borrowing_costs.loan_establishment_fee,
            capitalise_lmi=req.loan.borrowing_costs.capitalise_lmi,
            capitalise_mortgage_registration_fee=req.loan.borrowing_costs.capitalise_mortgage_registration_fee,
            capitalise_loan_establishment_fee=req.loan.borrowing_costs.capitalise_loan_establishment_fee,
        ),
    )


def build_ongoing_costs(req: CashFlowPPORRequest) -> OngoingCostsConfig:
    """Map OngoingCostsRequest to OngoingCostsConfig domain model."""
    return OngoingCostsConfig(
        council_rates=req.ongoing_costs.council_rates,
        water_rates=req.ongoing_costs.water_rates,
        building_insurance=req.ongoing_costs.building_insurance,
        strata_fees=req.ongoing_costs.strata_fees,
        maintenance_rate=req.ongoing_costs.maintenance_rate,
        landlord_insurance=req.ongoing_costs.landlord_insurance,
        management_rate=req.ongoing_costs.management_rate,
        annual_cost_growth_rate=req.ongoing_costs.annual_cost_growth_rate,
    )


# ── Domain model → response schema ────────────


def map_year_response(year) -> CashFlowYearResponse:
    """Map CashFlowYear or CashFlowYearInvestment domain model to response schema."""
    from app.models.cashflow import CashFlowYearInvestment

    d = year.ongoing_costs_detail
    t = year.tax_deduction_detail if isinstance(year, CashFlowYearInvestment) else None

    return CashFlowYearResponse(
        year=year.year,
        net_income=year.net_income,
        total_inflows=year.total_inflows,
        mortgage_repayment=year.mortgage_repayment,
        mortgage_interest=year.mortgage_interest,
        mortgage_principal=year.mortgage_principal,
        property_costs=year.property_costs,
        offset_contributions=year.offset_contributions,
        rent_paid=year.rent_paid if isinstance(year, CashFlowYearInvestment) else 0.0,
        rental_income=year.rental_income if isinstance(year, CashFlowYearInvestment) else 0.0,
        tax_saving=year.tax_saving if isinstance(year, CashFlowYearInvestment) else 0.0,
        total_outflows=year.total_outflows,
        net_position=year.net_position,
        cumulative_position=year.cumulative_position,
        property_value=year.property_value,
        loan_balance=year.loan_balance,
        equity=year.equity,
        offset_balance=year.offset_balance,
        salary=year.salary,
        income_tax=year.income_tax,
        ongoing_costs_detail=OngoingCostsDetailResponse(
            council_rates=d.council_rates,
            water_rates=d.water_rates,
            building_insurance=d.building_insurance,
            landlord_insurance=d.landlord_insurance,
            strata_fees=d.strata_fees,
            maintenance_cost=d.maintenance_cost,
            management_fee=d.management_fee,
        ) if d else None,
        tax_deduction_detail=TaxDeductionDetailResponse(
            mortgage_interest=t.mortgage_interest,
            depreciation_building=t.depreciation_building,
            depreciation_plant=t.depreciation_plant,
            deductible_expenses=t.deductible_expenses,
            total_deductions=t.total_deductions,
            net_rental_income=t.net_rental_income,
            is_negatively_geared=t.is_negatively_geared,
            tax_saving=t.tax_saving,
            borrowing_costs_deduction=t.borrowing_costs_deduction,
        ) if t else None,
    )


def map_summary_response(summary) -> CashFlowSummaryResponse:
    """Map CashFlowSummary or CashFlowSummaryInvestment domain model to response schema."""
    from app.models.cashflow import CashFlowSummaryInvestment

    return CashFlowSummaryResponse(
        total_income=summary.total_income,
        total_outflows=summary.total_outflows,
        total_interest_paid=summary.total_interest_paid,
        total_rent_paid=summary.total_rent_paid if isinstance(summary, CashFlowSummaryInvestment) else 0.0,
        total_rental_income=summary.total_rental_income if isinstance(summary, CashFlowSummaryInvestment) else 0.0,
        total_tax_saving=summary.total_tax_saving if isinstance(summary, CashFlowSummaryInvestment) else 0.0,
        final_property_value=summary.final_property_value,
        final_loan_balance=summary.final_loan_balance,
        final_equity=summary.final_equity,
        average_annual_net=summary.average_annual_net,
        net_wealth=summary.net_wealth,
    )


def map_upfront_costs_response(upfront) -> UpfrontCostsResponse:
    """Map UpfrontCosts domain model to response schema."""
    return UpfrontCostsResponse(
        purchase_costs=PurchaseCostsResponse(
            stamp_duty=upfront.purchase_costs.stamp_duty,
            legal_fees=upfront.purchase_costs.legal_fees,
            building_pest_inspection=upfront.purchase_costs.building_pest_inspection,
            registration_fee=upfront.purchase_costs.registration_fee,
            other_costs=upfront.purchase_costs.other_costs,
            total=upfront.purchase_costs.total,
        ),
        borrowing_costs=BorrowingCostsResponse(
            lmi=upfront.borrowing_costs.lmi,
            mortgage_registration_fee=upfront.borrowing_costs.mortgage_registration_fee,
            loan_establishment_fee=upfront.borrowing_costs.loan_establishment_fee,
            total=upfront.borrowing_costs.total,
        ),
        total=upfront.total,
    )


def map_cgt_response(cgt) -> CGTResponse:
    """Map CGTResult domain model to response schema."""
    return CGTResponse(
        cost_base=cgt.cost_base,
        capital_gain=cgt.capital_gain,
        cgt_discount=cgt.cgt_discount,
        discounted_gain=cgt.discounted_gain,
        cgt_payable=cgt.cgt_payable,
        net_proceeds=cgt.net_proceeds,
    )


def map_ppor_response(result) -> CashFlowPPORResponse:
    """Map CashFlowPPORResult domain model to full response schema."""
    return CashFlowPPORResponse(
        projection_years=result.projection_years,
        upfront_costs=map_upfront_costs_response(result.upfront_costs),
        years=[map_year_response(y) for y in result.years],
        summary=map_summary_response(result.summary),
    )


def map_rentvest_response(result) -> CashFlowRentvestResponse:
    """Map CashFlowRentvestResult domain model to full response schema."""
    return CashFlowRentvestResponse(
        projection_years=result.projection_years,
        upfront_costs=map_upfront_costs_response(result.upfront_costs),
        years=[map_year_response(y) for y in result.years],
        cgt=map_cgt_response(result.cgt),
        summary=map_summary_response(result.summary),
    )


# ── Single property mapping ─────────────────


def build_existing_property(req: CashFlowSingleRequest) -> Property:
    """Map ExistingPropertyRequest to Property domain model with value_base."""
    ep = req.existing_property
    is_ppor = req.property_use == "ppor"
    rental = req.rental

    return Property(
        purchase_date=ep.purchase_date,
        purchase_price=ep.purchase_price,
        is_new_property=ep.is_new_property,
        is_ppor=is_ppor,
        value_base=ep.current_value,
        annual_appreciation=ep.annual_appreciation,
        purchase_costs=PurchaseCosts(
            stamp_duty=ep.purchase_costs.stamp_duty,
            legal_fees=ep.purchase_costs.legal_fees,
            building_pest_inspection=ep.purchase_costs.building_pest_inspection,
            registration_fee=ep.purchase_costs.registration_fee,
            other_costs=ep.purchase_costs.other_costs,
        ),
        rental=RentalConfig(
            weekly_rent=rental.weekly_rent if rental else 0.0,
            annual_growth_rate=rental.annual_growth_rate if rental else 0.03,
            vacancy_weeks=rental.vacancy_weeks if rental else 2,
        ),
        depreciable_buildings=[
            DepreciableBuilding(
                name=b.name,
                construction_cost=b.construction_cost,
                purchase_date=b.purchase_date,
                construction_start_date=b.construction_start_date,
            )
            for b in ep.depreciable_buildings
        ],
        depreciable_assets=[
            DepreciableAsset(
                name=a.name,
                cost=a.cost,
                effective_life_years=a.effective_life_years,
                purchase_date=a.purchase_date,
                method=a.method,
                written_down_value=a.written_down_value,
            )
            for a in ep.depreciable_assets
        ],
    )


def build_new_property(req: CashFlowSingleRequest) -> Property:
    """Map PropertyRequest from a single cashflow request to Property domain model."""
    is_ppor = req.property_use == "ppor"
    rental = req.rental

    return Property(
        purchase_date=req.property.purchase_date,
        purchase_price=req.property.purchase_price,
        is_new_property=req.property.is_new_property,
        is_ppor=is_ppor,
        annual_appreciation=req.property.annual_appreciation,
        purchase_costs=PurchaseCosts(
            stamp_duty=req.property.purchase_costs.stamp_duty,
            legal_fees=req.property.purchase_costs.legal_fees,
            building_pest_inspection=req.property.purchase_costs.building_pest_inspection,
            registration_fee=req.property.purchase_costs.registration_fee,
            other_costs=req.property.purchase_costs.other_costs,
        ),
        rental=RentalConfig(
            weekly_rent=rental.weekly_rent if rental else 0.0,
            annual_growth_rate=rental.annual_growth_rate if rental else 0.03,
            vacancy_weeks=rental.vacancy_weeks if rental else 2,
        ),
        depreciable_buildings=[
            DepreciableBuilding(
                name=b.name,
                construction_cost=b.construction_cost,
                purchase_date=b.purchase_date,
                construction_start_date=b.construction_start_date,
            )
            for b in req.property.depreciable_buildings
        ],
        depreciable_assets=[
            DepreciableAsset(
                name=a.name,
                cost=a.cost,
                effective_life_years=a.effective_life_years,
                purchase_date=a.purchase_date,
                method=a.method,
                written_down_value=a.written_down_value,
            )
            for a in req.property.depreciable_assets
        ],
    )


def map_single_response(result) -> CashFlowSingleResponse:
    """Map CashFlowSingleResult domain model to response schema."""
    return CashFlowSingleResponse(
        mode=result.mode,
        property_use=result.property_use,
        projection_years=result.projection_years,
        upfront_costs=map_upfront_costs_response(result.upfront_costs) if result.upfront_costs else None,
        years=[map_year_response(y) for y in result.years],
        cgt=map_cgt_response(result.cgt) if result.cgt else None,
        summary=map_summary_response(result.summary),
    )
