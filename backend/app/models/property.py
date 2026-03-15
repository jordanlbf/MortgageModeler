"""
Property domain models — property, ongoing cost projections and related types.
"""

from dataclasses import dataclass
from datetime import date


@dataclass
class Property:
    """
    Core property details.

    Attributes:
        purchase_date: Date the property was purchased
        is_new_property: Whether the owner is the first occupant/investor
    """
    purchase_date: date
    is_new_property: bool


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
# Ongoing costs
# ──────────────────────────────────────────────

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
        total_annual_cost: Sum of all costs across all years
        total_monthly_cost: Average monthly cost across projection
        total_deductible_cost: Sum of tax-deductible costs across all years
    """
    annual_costs: list[YearCost]
    total_annual_cost: float
    total_monthly_cost: float
    total_deductible_cost: float
