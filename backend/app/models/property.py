"""
Property domain models — property, ongoing cost projections and related types.
"""

from dataclasses import dataclass, field
from datetime import date

from app.models.deductions import DepreciableBuilding, DepreciableAsset


# ──────────────────────────────────────────────
# Purchase costs
# ──────────────────────────────────────────────

@dataclass
class PurchaseCosts:
    """
    Upfront costs incurred when acquiring a property.

    Some costs are added to the CGT cost base (reducing capital gain at sale),
    while others are borrowing costs deductible against rental income over
    the lesser of 5 years or the loan term.

    Attributes:
        stamp_duty: State transfer duty (cost base)
        legal_fees: Conveyancing and legal fees (cost base)
        building_pest_inspection: Building and pest inspection fees (cost base)
        registration_fee: Title registration fee (cost base)
        mortgage_registration_fee: Mortgage registration fee (borrowing cost, deductible over 5 years)
        loan_establishment_fee: Loan establishment/application fee (borrowing cost, deductible over 5 years)
        other_costs: Any other acquisition costs not covered above (cost base)
    """
    stamp_duty: float = 0.0
    legal_fees: float = 0.0
    building_pest_inspection: float = 0.0
    registration_fee: float = 0.0
    mortgage_registration_fee: float = 0.0
    loan_establishment_fee: float = 0.0
    other_costs: float = 0.0

    @property
    def total_cost_base(self) -> float:
        """
        Sum of costs added to the CGT cost base.

        Returns:
            Total non-deductible acquisition costs for CGT purposes
        """
        return (
            self.stamp_duty +
            self.legal_fees +
            self.building_pest_inspection +
            self.registration_fee +
            self.other_costs
        )

    @property
    def total_borrowing_costs(self) -> float:
        """
        Sum of borrowing costs deductible over 5 years (or loan term if shorter).

        Returns:
            Total deductible borrowing costs
        """
        return (
            self.mortgage_registration_fee +
            self.loan_establishment_fee
        )

    @property
    def total(self) -> float:
        """
        Sum of all purchase cost components.

        Returns:
            Total upfront acquisition costs
        """
        return self.total_cost_base + self.total_borrowing_costs


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
        is_new_property: Whether the owner is the first occupant/investor
        purchase_costs: Upfront acquisition costs (defaults to all zeros)
        depreciable_buildings: Div 43 buildings/constructions to depreciate
        depreciable_assets: Div 40 plant/equipment to depreciate
    """
    purchase_date: date
    purchase_price: float
    is_new_property: bool
    purchase_costs: PurchaseCosts = field(default_factory=PurchaseCosts)
    depreciable_buildings: list[DepreciableBuilding] = field(default_factory=list)
    depreciable_assets: list[DepreciableAsset] = field(default_factory=list)


# ──────────────────────────────────────────────
# Ongoing costs
# ──────────────────────────────────────────────

@dataclass
class OngoingCostsConfig:
    """
    Base ongoing cost configuration for cash flow projections.

    Holds the initial annual rates and growth rate. The service uses
    these to call engine functions that compound costs year by year.

    Attributes:
        council_rates: Base annual council rates
        water_rates: Base annual water rates
        building_insurance: Base annual building insurance premium
        strata_fees: Base annual strata/body corporate fees
        maintenance_rate: Annual maintenance as fraction of property value (e.g. 0.01 for 1%)
        annual_cost_growth_rate: Annual growth rate for ongoing costs as decimal
    """
    council_rates: float = 0.0
    water_rates: float = 0.0
    building_insurance: float = 0.0
    strata_fees: float = 0.0
    maintenance_rate: float = 0.01
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
        total: Total of all cost fields
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
    total: float


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
