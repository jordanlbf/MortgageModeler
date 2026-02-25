"""
Scenario models — ties people, properties, and ownership together.
"""

from pydantic import BaseModel, Field

from app.models.person import Person
from app.models.property import Property


class Ownership(BaseModel):
    """Ownership stake linking a person to a property."""
    person_index: int = Field(..., description="Index into Scenario.people list")
    property_index: int = Field(..., description="Index into Scenario.properties list")
    share: float = Field(default=1.0, description="Ownership share, e.g. 0.5 for 50%")


class Scenario(BaseModel):
    """
    A complete scenario for comparison.
    e.g. 'Buy PPOR' vs 'Rentvest' — each is a Scenario.
    """
    label: str = ""
    people: list[Person] = Field(default_factory=list)
    properties: list[Property] = Field(default_factory=list)
    ownership: list[Ownership] = Field(default_factory=list)
    projection_years: int = Field(default=30, description="How many years to project")
