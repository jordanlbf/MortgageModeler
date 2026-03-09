"""
API request/response schemas for the property-engine endpoint.

Separate from domain models — these define the API contract.
"""

from pydantic import BaseModel, Field, model_validator


# REQUESTS

class PropertyCostRequest(BaseModel):
    purchase_price: float = Field(default=0.0, ge=0, description="Property purchase price")
    deposit: float = Field(default=0.0, ge=0, description="Upfront deposit amount")
    is_investment: bool = Field(default=False, description="Whether the property is an investment property")
    lmi_exempt: bool = Field(default=False, description="Whether the loan is exempt from LMI (Lenders Mortgage Insurance)")

    @model_validator(mode="after")
    def deposit_not_exceeding_price(self):
        if self.deposit > self.purchase_price:
            raise ValueError("Deposit cannot exceed purchase price")
        return self

    @property
    def loan_amount(self) -> float:
        return self.purchase_price - self.deposit

    @property
    def lvr(self) -> float:
        if self.purchase_price <= 0:
            return 0.0
        return self.loan_amount / self.purchase_price


# RESPONSES

class PropertyCostResponse(BaseModel):
    stamp_duty: float
    lmi: float
    registration_fee: float
    mortgage_registration_fee: float
    conveyancing_fee: float
    building_pest_inspection_fee: float
    loan_establishment_fee: float
    total_upfront_cost: float
    lvr: float
