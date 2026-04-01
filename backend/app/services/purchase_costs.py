"""
Purchase costs service.

Orchestrates stamp duty calculation, grant concession application,
LMI estimation, and fee summation into a complete cost breakdown.
"""

from app.config.grants._types import GrantScheme
from app.config.grants.registry import get_scheme
from app.engine.property import (
    calculate_building_pest_inspection_fee,
    calculate_conveyancing_fee,
    calculate_loan_establishment_fee,
    calculate_mortgage_registration_fee,
    calculate_registration_fee,
    estimate_lmi,
)
from app.engine.stamp_duty import CONCESSION_FNS, calculate_stamp_duty
from app.models.loan import BorrowingCosts
from app.models.property import PurchaseCosts
from app.models.purchase_costs import (
    GrantApplied,
    GrantEffectType,
    PurchaseCostsBreakdown,
    PurchaseCostsInputs,
)


def _resolve_grants(selected_ids: list[str]) -> list[GrantScheme]:
    """Look up grant schemes by ID, skipping unknown IDs.

    Args:
        selected_ids: List of scheme IDs.

    Returns:
        List of resolved GrantScheme instances.
    """
    schemes = []
    for sid in selected_ids:
        scheme = get_scheme(sid)
        if scheme is not None:
            schemes.append(scheme)
    return schemes


def _apply_stamp_duty_effects(
    grants: list[GrantScheme],
    base_duty: float,
    price: float,
) -> tuple[float, list[GrantApplied]]:
    """Apply stamp duty concessions from selected grants.

    Takes the best concession (no stacking). Exemptions set
    concession = base duty. Concession functions compute sliding scales.

    Args:
        grants: Resolved grant schemes.
        base_duty: Stamp duty before concessions.
        price: Property purchase price.

    Returns:
        Tuple of (best concession amount, list of GrantApplied records).
    """
    best_concession = 0.0
    applied: list[GrantApplied] = []

    for scheme in grants:
        fe = scheme.financial_effect

        if fe.stamp_duty_exemption:
            concession = base_duty
            if concession > best_concession:
                best_concession = concession
            applied.append(GrantApplied(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                category=scheme.category,
                effect_type=GrantEffectType.STAMP_DUTY_EXEMPTION,
                amount=concession,
                description=f"Full stamp duty exemption — saves ${concession:,.0f}",
            ))

        elif fe.stamp_duty_concession_fn:
            fn = CONCESSION_FNS.get(fe.stamp_duty_concession_fn)
            if fn is not None:
                concession = fn(price, base_duty)
                if concession > best_concession:
                    best_concession = concession
                applied.append(GrantApplied(
                    scheme_id=scheme.id,
                    scheme_name=scheme.name,
                    category=scheme.category,
                    effect_type=GrantEffectType.STAMP_DUTY_CONCESSION,
                    amount=concession,
                    description=f"Stamp duty concession — saves ${concession:,.0f}",
                ))

    return best_concession, applied


def _apply_grant_effects(
    grants: list[GrantScheme],
    price: float,
    property_type: str | None,
) -> tuple[float, float, float, float, list[GrantApplied]]:
    """Apply non-stamp-duty grant effects.

    Args:
        grants: Resolved grant schemes.
        price: Property purchase price.
        property_type: new, existing, land, or None.

    Returns:
        Tuple of (total_cash_grants, equity_contribution, min_deposit_pct,
        lmi_waiver flag as float 0/1, list of GrantApplied records).
    """
    total_cash = 0.0
    equity = 0.0
    min_deposit: float | None = None
    lmi_waived = False
    applied: list[GrantApplied] = []

    for scheme in grants:
        fe = scheme.financial_effect

        # Cash grant
        if fe.cash_grant > 0:
            total_cash += fe.cash_grant
            applied.append(GrantApplied(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                category=scheme.category,
                effect_type=GrantEffectType.CASH_GRANT,
                amount=fe.cash_grant,
                description=f"${fe.cash_grant:,.0f} cash grant",
            ))

        # LMI waiver
        if fe.lmi_waiver:
            lmi_waived = True
            applied.append(GrantApplied(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                category=scheme.category,
                effect_type=GrantEffectType.LMI_WAIVER,
                amount=0.0,
                description="LMI waived",
            ))

        # Deposit reduction
        if fe.min_deposit_percent is not None:
            if min_deposit is None or fe.min_deposit_percent < min_deposit:
                min_deposit = fe.min_deposit_percent
            applied.append(GrantApplied(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                category=scheme.category,
                effect_type=GrantEffectType.DEPOSIT_REDUCTION,
                amount=0.0,
                description=f"Minimum deposit reduced to {fe.min_deposit_percent:.0%}",
            ))

        # Equity contribution
        share = None
        if property_type == "new" and fe.equity_share_new is not None:
            share = fe.equity_share_new
        elif fe.equity_share_existing is not None:
            share = fe.equity_share_existing

        if share is not None and share > 0:
            contribution = price * share
            if contribution > equity:
                equity = contribution
            applied.append(GrantApplied(
                scheme_id=scheme.id,
                scheme_name=scheme.name,
                category=scheme.category,
                effect_type=GrantEffectType.EQUITY_CONTRIBUTION,
                amount=contribution,
                description=f"Government contributes {share:.0%} (${contribution:,.0f})",
            ))

    return total_cash, equity, min_deposit or 0.0, lmi_waived, applied


def calculate_purchase_costs(inputs: PurchaseCostsInputs) -> PurchaseCostsBreakdown:
    """Calculate itemised property purchase costs with grant effects.

    Orchestrates stamp duty, LMI, fees, and applies selected grant
    effects (cash grants, duty exemptions/concessions, LMI waivers,
    equity contributions).

    Args:
        inputs: Property details, buyer profile, and selected grants.

    Returns:
        Complete PurchaseCostsBreakdown with composed domain models.
    """
    price = inputs.price
    if price <= 0:
        return PurchaseCostsBreakdown()

    # 1. Base stamp duty
    base_duty = calculate_stamp_duty(price, inputs.state, is_ppor=inputs.owner_occupier)

    # 2. Resolve selected grants
    grants = _resolve_grants(inputs.selected_grants)

    # 3. Apply stamp duty concessions (best one wins)
    stamp_duty_concession, stamp_duty_applied = _apply_stamp_duty_effects(
        grants, base_duty, price,
    )
    stamp_duty_payable = max(0.0, base_duty - stamp_duty_concession)

    # 4. Deposit and equity
    deposit = price * inputs.deposit_percent
    property_type_str = str(inputs.property_type) if inputs.property_type else None

    total_cash_grants, equity, min_deposit_pct, lmi_waived, other_applied = (
        _apply_grant_effects(grants, price, property_type_str)
    )

    effective_loan = max(0.0, price - deposit - equity)

    # 5. LVR and LMI
    lvr = effective_loan / price if price > 0 else 0.0
    is_investment = not inputs.owner_occupier
    lmi_base = estimate_lmi(effective_loan, lvr, is_investment)
    lmi_payable = 0.0 if lmi_waived else lmi_base

    # 6. Fees
    legal_fees = calculate_conveyancing_fee()
    registration_fee = calculate_registration_fee(price)
    mortgage_reg = calculate_mortgage_registration_fee()
    inspection = calculate_building_pest_inspection_fee()
    loan_est = calculate_loan_establishment_fee()

    # 7. Build composed domain models
    purchase_costs = PurchaseCosts(
        stamp_duty=base_duty,
        legal_fees=legal_fees,
        building_pest_inspection=inspection,
        registration_fee=registration_fee,
    )

    borrowing_costs = BorrowingCosts(
        lmi=lmi_base,
        mortgage_registration_fee=mortgage_reg,
        loan_establishment_fee=loan_est,
    )

    # 8. Combine all grant applied records
    all_applied = stamp_duty_applied + other_applied

    # 9. Total upfront
    total_fees = (
        legal_fees + registration_fee + mortgage_reg + inspection + loan_est
    )
    total_upfront = (
        deposit + stamp_duty_payable + lmi_payable + total_fees - total_cash_grants
    )

    return PurchaseCostsBreakdown(
        purchase_costs=purchase_costs,
        borrowing_costs=borrowing_costs,
        stamp_duty_concession=stamp_duty_concession,
        lmi_waived=lmi_waived,
        grants_applied=all_applied,
        total_grant_savings=total_cash_grants,
        equity_contribution=equity,
        effective_loan_amount=effective_loan,
        deposit_amount=deposit,
        min_deposit_percent=min_deposit_pct,
        total_upfront_cost=total_upfront,
        lvr=lvr,
    )
