"""
Property domain models — property, ongoing cost projections and related types.
"""

from dataclasses import dataclass, field
from datetime import date
from typing import Optional

from app.models.deductions import DepreciableBuilding, DepreciableAsset
from app.models.loan import BorrowingCosts


# ──────────────────────────────────────────────
# Purchase costs
# ──────────────────────────────────────────────

@dataclass
class PurchaseCosts:
    """
    Property acquisition costs — all items are added to the CGT cost base.

    Fields default to None (auto-estimated by upfront costs service).
    Set to 0.0 to explicitly waive. Set to a value to override the estimate.

    Attributes:
        stamp_duty: State transfer duty (None = auto-estimate)
        legal_fees: Conveyancing and legal fees (None = auto-estimate)
        building_pest_inspection: Building and pest inspection fees (None = auto-estimate)
        registration_fee: Title registration fee (None = auto-estimate)
        other_costs: Any other acquisition costs (no auto-estimate)
    """
    stamp_duty: Optional[float] = None
    legal_fees: Optional[float] = None
    building_pest_inspection: Optional[float] = None
    registration_fee: Optional[float] = None
    other_costs: float = 0.0

    @property
    def total(self) -> float:
        """
        Sum of all property acquisition costs (CGT cost base).

        None values are treated as 0. Call after resolution for accurate totals.

        Returns:
            Total property acquisition costs
        """
        return (
            (self.stamp_duty or 0.0) +
            (self.legal_fees or 0.0) +
            (self.building_pest_inspection or 0.0) +
            (self.registration_fee or 0.0) +
            self.other_costs
        )


@dataclass
class UpfrontCosts:
    """
    All upfront costs incurred when acquiring a property with a loan.

    Composes property acquisition costs (CGT cost base) and loan borrowing
    costs (deductible over 5 years). Total represents cash out at settlement.

    Attributes:
        purchase_costs: Property acquisition costs (stamp duty, legal, etc.)
        borrowing_costs: Loan-related costs (LMI, mortgage registration, etc.)
    """
    purchase_costs: PurchaseCosts = field(default_factory=PurchaseCosts)
    borrowing_costs: BorrowingCosts = field(default_factory=BorrowingCosts)

    @property
    def total_cash_at_settlement(self) -> float:
        """
        Total cash required at settlement (excludes capitalised costs).

        Returns:
            Purchase costs + non-capitalised borrowing costs
        """
        return self.purchase_costs.total + self.borrowing_costs.total_upfront

    @property
    def total(self) -> float:
        """
        Total of all upfront costs (capitalised and non-capitalised).

        Returns:
            Sum of all purchase costs and all borrowing costs
        """
        return self.purchase_costs.total + self.borrowing_costs.total


# ──────────────────────────────────────────────
# Rental config (sub-model of Property)
# ──────────────────────────────────────────────

@dataclass
class RentalConfig:
    """
    Investment property rental characteristics.

    Describes the rental income profile of a property — how much rent
    it earns, how fast rent grows, and expected vacancy. Defaults to
    zeros for PPOR (no tenants).

    Attributes:
        weekly_rent: Weekly rental amount
        annual_growth_rate: Annual rental income growth rate as decimal
        vacancy_weeks: Expected vacant weeks per year (0–52)
    """
    weekly_rent: float = 0.0
    annual_growth_rate: float = 0.03
    vacancy_weeks: int = 2


# ──────────────────────────────────────────────
# Core property
# ──────────────────────────────────────────────

@dataclass
class Property:
    """
    Core property details — aggregate root for all property-related data.

    Attributes:
        purchase_date: Date the property was purchased
        purchase_price: Property purchase price
        is_new_property: Whether the owner is the first occupant/investor (affects grants, Div 40)
        is_ppor: Whether the property is a primary place of residence (affects tax, CGT, ongoing costs)
        annual_appreciation: Annual property value growth rate as decimal
        purchase_costs: Upfront acquisition costs (defaults to all zeros)
        depreciable_buildings: Div 43 buildings/constructions to depreciate
        depreciable_assets: Div 40 plant/equipment to depreciate
        rental: Rental income configuration (defaults to zeros for PPOR)
    """
    purchase_date: date
    purchase_price: float
    is_new_property: bool
    is_ppor: bool = False
    annual_appreciation: float = 0.0
    purchase_costs: PurchaseCosts = field(default_factory=PurchaseCosts)
    depreciable_buildings: list[DepreciableBuilding] = field(default_factory=list)
    depreciable_assets: list[DepreciableAsset] = field(default_factory=list)
    rental: RentalConfig = field(default_factory=RentalConfig)


# ──────────────────────────────────────────────
# Rentvesting config (investor as tenant)
# ──────────────────────────────────────────────

@dataclass
class RentvestConfig:
    """
    Tenant rental configuration for the investor's personal housing.

    Only used in rentvesting scenarios — describes what the investor
    pays to live somewhere (not the investment property).

    Attributes:
        weekly_rent_paid: Weekly rent where the investor lives
        annual_rent_paid_growth: Annual rent paid growth rate as decimal
    """
    weekly_rent_paid: float
    annual_rent_paid_growth: float


# ──────────────────────────────────────────────
# Ongoing costs
# ──────────────────────────────────────────────

@dataclass
class OngoingCostsConfig:
    """
    Ongoing property cost configuration for cash flow projections.

    Holds the initial annual rates and growth rate. The service uses
    these to call engine functions that compound costs year by year.
    Investment-only fields (landlord_insurance, management_rate) default
    to 0 and are ignored for PPOR scenarios.

    Attributes:
        council_rates: Base annual council rates
        water_rates: Base annual water rates
        building_insurance: Base annual building insurance premium
        strata_fees: Base annual strata/body corporate fees
        maintenance_rate: Annual maintenance as fraction of property value (e.g. 0.01 for 1%)
        landlord_insurance: Base annual landlord insurance premium (0 for PPOR)
        management_rate: Management fee as fraction of rental income (e.g. 0.08 for 8%, 0 for PPOR)
        annual_cost_growth_rate: Annual growth rate for ongoing costs as decimal
    """
    council_rates: float = 0.0
    water_rates: float = 0.0
    building_insurance: float = 0.0
    strata_fees: float = 0.0
    maintenance_rate: float = 0.01
    landlord_insurance: float = 0.0
    management_rate: float = 0.0
    annual_cost_growth_rate: float = 0.03


@dataclass
class YearCost:
    """
    A single year's breakdown of ongoing property costs.

    Attributes:
        year: Projection year (0 = purchase year)
        council_rates: Annual council rates
        water_rates: Annual water rates
        building_insurance: Annual building insurance premium
        landlord_insurance: Annual landlord insurance premium (0 for PPOR)
        strata_fees: Annual strata/body corporate fees
        maintenance_cost: Annual maintenance cost
        management_fee: Annual property management fee (0 for PPOR)
        property_value: Appreciated property value at this year
        rental_income: Annual rental income at this year
        total_costs: Total of all cost fields
    """
    year: int
    council_rates: float
    water_rates: float
    building_insurance: float
    landlord_insurance: float
    strata_fees: float
    maintenance_cost: float
    management_fee: float
    property_value: float
    rental_income: float
    total_costs: float


@dataclass
class OngoingCostProjection:
    """
    Full ongoing cost projection with summary stats.

    Attributes:
        annual_costs: Per-year cost breakdowns
        total_annual_cost: Year 0 total ongoing cost
        total_monthly_cost: Year 0 total ongoing cost divided by 12
        total_deductible_cost: Year 0 total deductible cost (investment properties only)
    """
    annual_costs: list[YearCost]
    total_annual_cost: float
    total_monthly_cost: float
    total_deductible_cost: float
