"""
Purchase costs domain models — service inputs and itemised breakdown.

Composes existing PurchaseCosts and BorrowingCosts models from the
property/loan domains, adding grant effects, equity contributions,
and totals. Separate from API schemas (HTTP contract).
"""

from dataclasses import dataclass, field
from enum import StrEnum

from app.config.grants._types import State
from app.models.loan import BorrowingCosts
from app.models.property import PurchaseCosts


class PropertyType(StrEnum):
    NEW = "new"
    EXISTING = "existing"
    LAND = "land"


class BuyerType(StrEnum):
    INDIVIDUAL = "individual"
    COUPLE = "couple"


class GrantEffectType(StrEnum):
    CASH_GRANT = "cash_grant"
    STAMP_DUTY_EXEMPTION = "stamp_duty_exemption"
    STAMP_DUTY_CONCESSION = "stamp_duty_concession"
    LMI_WAIVER = "lmi_waiver"
    DEPOSIT_REDUCTION = "deposit_reduction"
    EQUITY_CONTRIBUTION = "equity_contribution"


@dataclass
class PurchaseCostsInputs:
    """User inputs for calculating property purchase costs.

    Attributes:
        state: State code.
        price: Property purchase price.
        deposit_percent: Deposit as decimal (e.g. 0.10 for 10%).
        property_type: New, existing, land, or None if unset.
        buyer_type: Individual, couple, or None if unset.
        owner_occupier: Whether the property is a PPOR.
        first_home_buyer: Whether the buyer is a first home buyer.
        selected_grants: List of scheme IDs to apply.
        income: Primary applicant annual income.
        partner_income: Partner annual income (for couples).
    """

    state: State | str = ""
    region: str | None = None
    price: float = 0.0
    deposit_percent: float = 0.0
    property_type: PropertyType | None = None
    buyer_type: BuyerType | None = None
    owner_occupier: bool = True
    first_home_buyer: bool = False
    selected_grants: list[str] = field(default_factory=list)
    income: float = 0.0
    partner_income: float = 0.0


@dataclass
class GrantApplied:
    """A grant that was applied and its dollar impact.

    Attributes:
        scheme_id: Unique scheme identifier.
        scheme_name: Display name.
        category: Scheme category.
        effect_type: What the grant does financially.
        amount: Dollar value of the benefit (positive = savings).
        description: Human-readable summary of the effect.
    """

    scheme_id: str
    scheme_name: str
    category: str
    effect_type: GrantEffectType
    amount: float
    description: str


@dataclass
class PurchaseCostsBreakdown:
    """Itemised property purchase cost breakdown.

    Composes existing domain models for acquisition costs and borrowing
    costs, adding grant effects, equity contributions, and summary totals.

    Attributes:
        purchase_costs: Resolved property acquisition costs (stamp duty, legal, etc.).
        borrowing_costs: Resolved loan-related costs (LMI, registration, establishment).
        stamp_duty_concession: Stamp duty concession applied by grants.
        lmi_waived: Whether LMI was waived by a guarantee scheme.
        grants_applied: List of grants applied with their effects.
        total_grant_savings: Sum of all cash grant amounts.
        equity_contribution: Government equity share in dollars.
        effective_loan_amount: Loan after deposit + equity deducted.
        deposit_amount: Deposit in dollars.
        min_deposit_percent: Lowest deposit % allowed by selected schemes.
        total_upfront_cost: Total cash needed at settlement.
        lvr: Loan-to-value ratio as decimal.
    """

    purchase_costs: PurchaseCosts = field(default_factory=PurchaseCosts)
    borrowing_costs: BorrowingCosts = field(default_factory=BorrowingCosts)
    stamp_duty_concession: float = 0.0
    lmi_waived: bool = False
    grants_applied: list[GrantApplied] = field(default_factory=list)
    total_grant_savings: float = 0.0
    equity_contribution: float = 0.0
    effective_loan_amount: float = 0.0
    deposit_amount: float = 0.0
    min_deposit_percent: float = 0.0
    total_upfront_cost: float = 0.0
    lvr: float = 0.0

    @property
    def stamp_duty_base(self) -> float:
        """Base stamp duty before concessions."""
        return self.purchase_costs.stamp_duty or 0.0

    @property
    def stamp_duty_payable(self) -> float:
        """Stamp duty after concession (floored at 0)."""
        return max(0.0, self.stamp_duty_base - self.stamp_duty_concession)

    @property
    def lmi_base(self) -> float:
        """LMI before any waiver."""
        return self.borrowing_costs.lmi or 0.0

    @property
    def lmi_payable(self) -> float:
        """LMI after waiver."""
        return 0.0 if self.lmi_waived else self.lmi_base

    @property
    def total_fees(self) -> float:
        """Sum of all non-stamp-duty, non-LMI fees."""
        return (
            (self.purchase_costs.legal_fees or 0.0)
            + (self.purchase_costs.registration_fee or 0.0)
            + (self.purchase_costs.building_pest_inspection or 0.0)
            + (self.borrowing_costs.mortgage_registration_fee or 0.0)
            + (self.borrowing_costs.loan_establishment_fee or 0.0)
        )
