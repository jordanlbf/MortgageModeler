"""
Grants API routes.

Exposes endpoints for listing grant schemes and evaluating
eligibility against user inputs.
"""

from fastapi import APIRouter

from app.config.grants._types import GrantScheme
from app.models.grants import GrantsInputs, SchemeEligibility
from app.schemas.grants import (
    EligibilityResult as EligibilityResultSchema,
)
from app.schemas.grants import (
    GrantsEligibilityRequest,
    GrantsEligibilityResponse,
    GrantsSchemesResponse,
    SchemeMetaResponse,
    SchemeResponse,
    SchemeWithEligibility,
)
from app.services.grants import evaluate_schemes, get_scheme_catalogue

router = APIRouter(prefix="/grants", tags=["grants"])


def _scheme_to_response(scheme: GrantScheme) -> SchemeResponse:
    """Convert a config GrantScheme to an API SchemeResponse.

    Args:
        scheme: Internal frozen dataclass from config.

    Returns:
        Pydantic SchemeResponse suitable for JSON serialisation.
    """
    return SchemeResponse(
        id=scheme.id,
        name=scheme.name,
        level=scheme.level,
        state=scheme.state.value if scheme.state else None,
        category=scheme.category,
        benefit_pill=scheme.benefit_pill,
        meta=SchemeMetaResponse(
            deposit=scheme.meta.deposit,
            lmi=scheme.meta.lmi,
            buyer=scheme.meta.buyer,
        ),
        theme=scheme.theme,
        benefits=list(scheme.benefits),
        eligibility=list(scheme.eligibility),
        summary=scheme.summary,
        details=scheme.details,
        rules=list(scheme.rules) if scheme.rules else None,
    )


def _result_to_response(se: SchemeEligibility) -> SchemeWithEligibility:
    """Convert a domain SchemeEligibility to an API SchemeWithEligibility.

    Args:
        se: Domain result pairing a scheme with its eligibility outcome.

    Returns:
        Pydantic SchemeWithEligibility for JSON serialisation.
    """
    return SchemeWithEligibility(
        scheme=_scheme_to_response(se.scheme),
        result=EligibilityResultSchema(
            eligible=se.result.eligible,
            reasons=se.result.reasons,
        ),
    )


@router.get("/schemes", response_model=GrantsSchemesResponse)
def list_schemes() -> GrantsSchemesResponse:
    """Return the full catalogue of grant schemes across all jurisdictions.

    No eligibility checking — returns all registered schemes with
    display data for populating the UI before the user sets filters.

    Returns:
        GrantsSchemesResponse containing all schemes.
    """
    schemes = get_scheme_catalogue()
    return GrantsSchemesResponse(schemes=[_scheme_to_response(s) for s in schemes])


@router.post("/eligibility", response_model=GrantsEligibilityResponse)
def check_eligibility(req: GrantsEligibilityRequest) -> GrantsEligibilityResponse:
    """Evaluate eligibility for grant schemes matching the requested states.

    Converts API request to domain inputs, calls the service, and
    converts domain results back to the API response shape.

    Args:
        req: User inputs including selected states, price, income,
            property type, buyer type, and eligibility toggles.

    Returns:
        GrantsEligibilityResponse with schemes and their eligibility results.
    """
    inputs = GrantsInputs(
        states=req.states,
        price=req.price,
        income=req.income,
        partner_income=req.partner_income,
        property_type=req.property_type,
        buyer_type=req.buyer_type,
        first_home_buyer=req.first_home_buyer,
        owner_occupier=req.owner_occupier,
        off_the_plan=req.off_the_plan,
    )

    results = evaluate_schemes(inputs)

    return GrantsEligibilityResponse(schemes=[_result_to_response(r) for r in results])
