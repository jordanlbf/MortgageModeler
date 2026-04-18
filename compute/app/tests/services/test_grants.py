"""
Tests for grants eligibility service — _check_eligibility and evaluate_schemes.
"""

import pytest

from app.config.grants._types import EligibilityPredicates, GrantScheme, SchemeMeta
from app.config.grants.registry import get_all_schemes, get_scheme
from app.models.grants import GrantsInputs
from app.services.grants import _check_eligibility, evaluate_schemes

# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────


def _make_inputs(**overrides) -> GrantsInputs:
    """Create a GrantsInputs with sensible defaults.

    Defaults represent a first home buyer in QLD purchasing a new
    $600k home with $80k income.
    """
    defaults = dict(
        states=["Federal", "QLD"],
        price=600_000,
        income=80_000,
        partner_income=0,
        property_type="new",
        buyer_type="individual",
        first_home_buyer=True,
        owner_occupier=True,
        single_parent=None,
        off_the_plan=False,
    )
    defaults.update(overrides)
    return GrantsInputs(**defaults)


def _make_scheme(**overrides) -> GrantScheme:
    """Create a minimal GrantScheme for unit testing predicates."""
    defaults = dict(
        id="test-scheme",
        name="Test Scheme",
        level="Federal",
        state=None,
        category="grant",
        benefit_pill="Test",
        meta=SchemeMeta(deposit="Any", lmi="N/A", buyer="Any"),
        theme="Test scheme.",
        benefits=["Benefit"],
        eligibility=["Eligible"],
        summary="Test summary.",
        predicates=EligibilityPredicates(),
    )
    defaults.update(overrides)
    return GrantScheme(**defaults)


# ──────────────────────────────────────────────
# _check_eligibility — predicate logic
# ──────────────────────────────────────────────


class TestCheckEligibility:
    """Tests for the generic predicate checker."""

    def test_no_predicates_is_eligible(self):
        """A scheme with no predicates should always pass."""
        scheme = _make_scheme()
        result = _check_eligibility(scheme, _make_inputs())
        assert result.eligible
        assert result.reasons == []

    # ── first_home_buyer ─────────────────────

    def test_fhb_required_and_user_is_fhb(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=True))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer=True))
        assert result.eligible

    def test_fhb_required_and_user_is_not_fhb(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=True))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer=False))
        assert not result.eligible
        assert "Must be a first home buyer" in result.reasons

    def test_fhb_required_and_user_is_any(self):
        """User hasn't specified — predicate should be skipped."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=True))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer=None))
        assert result.eligible

    def test_fhb_false_and_user_is_fhb(self):
        """Scheme explicitly for non-FHB (e.g. FreshStart NT)."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=False))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer=True))
        assert not result.eligible
        assert "Not available to first home buyers" in result.reasons

    def test_fhb_none_is_always_skipped(self):
        """Scheme has no FHB requirement — any value passes."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=None))
        for val in [True, False, None]:
            result = _check_eligibility(scheme, _make_inputs(first_home_buyer=val))
            assert result.eligible

    # ── owner_occupier ───────────────────────

    def test_owner_occupier_required_and_user_is_not(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(owner_occupier=True))
        result = _check_eligibility(scheme, _make_inputs(owner_occupier=False))
        assert not result.eligible
        assert "Must be owner-occupier" in result.reasons

    def test_owner_occupier_skipped_when_any(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(owner_occupier=True))
        result = _check_eligibility(scheme, _make_inputs(owner_occupier=None))
        assert result.eligible

    # ── max_price ────────────────────────────

    def test_price_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_price=750_000))
        result = _check_eligibility(scheme, _make_inputs(price=700_000))
        assert result.eligible

    def test_price_over_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_price=750_000))
        result = _check_eligibility(scheme, _make_inputs(price=800_000))
        assert not result.eligible
        assert "Property value must be $750,000 or less" in result.reasons

    def test_price_exactly_at_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_price=750_000))
        result = _check_eligibility(scheme, _make_inputs(price=750_000))
        assert result.eligible

    def test_price_zero_skips_check(self):
        """User hasn't entered a price — predicate should be skipped."""
        scheme = _make_scheme(predicates=EligibilityPredicates(max_price=750_000))
        result = _check_eligibility(scheme, _make_inputs(price=0))
        assert result.eligible

    # ── max_price_by_region ──────────────────

    def test_regional_price_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Sydney", price=1_400_000))
        assert result.eligible

    def test_regional_price_over_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Sydney", price=1_600_000))
        assert not result.eligible
        assert any("1,500,000" in r and "Sydney" in r for r in result.reasons)

    def test_regional_price_at_exact_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Sydney", price=1_500_000))
        assert result.eligible

    def test_regional_price_unknown_region_falls_to_general(self):
        """Unknown region falls back to max_price."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price=750_000,
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Unknown", price=800_000))
        assert not result.eligible
        assert any("750,000" in r for r in result.reasons)

    def test_regional_price_unknown_region_no_general_cap(self):
        """Unknown region + no max_price → no cap enforced."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Unknown", price=5_000_000))
        assert result.eligible

    def test_regional_price_no_region_no_general_cap(self):
        """No region + no max_price → no cap enforced."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region=None, price=5_000_000))
        assert result.eligible

    def test_regional_price_no_region_falls_to_general(self):
        """No region specified → falls back to max_price."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price=750_000,
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region=None, price=800_000))
        assert not result.eligible

    def test_regional_price_zero_price_skips(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_price_by_region={"Sydney": 1_500_000},
        ))
        result = _check_eligibility(scheme, _make_inputs(region="Sydney", price=0))
        assert result.eligible

    # ── income caps ──────────────────────────

    def test_single_income_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_income_single=100_000))
        result = _check_eligibility(scheme, _make_inputs(income=80_000, buyer_type="individual"))
        assert result.eligible

    def test_single_income_over_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_income_single=100_000))
        result = _check_eligibility(scheme, _make_inputs(income=120_000, buyer_type="individual"))
        assert not result.eligible
        assert "Income must be $100,000 or less" in result.reasons

    def test_couple_income_uses_household(self):
        """Couple cap checks income + partner_income."""
        scheme = _make_scheme(predicates=EligibilityPredicates(max_income_couple=160_000))
        result = _check_eligibility(scheme, _make_inputs(
            income=90_000, partner_income=80_000, buyer_type="couple",
        ))
        assert not result.eligible
        assert "Household income must be $160,000 or less" in result.reasons

    def test_couple_income_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_income_couple=160_000))
        result = _check_eligibility(scheme, _make_inputs(
            income=80_000, partner_income=70_000, buyer_type="couple",
        ))
        assert result.eligible

    def test_income_zero_skips_check(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(max_income_single=100_000))
        result = _check_eligibility(scheme, _make_inputs(income=0))
        assert result.eligible

    # ── max_income_by_region ─────────────────

    def test_regional_income_single_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_single=148_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Kimberley", income=200_000,
        ))
        assert result.eligible

    def test_regional_income_single_over_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_single=148_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Kimberley", income=230_000,
        ))
        assert not result.eligible

    def test_regional_income_couple_under_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_couple=218_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Kimberley", income=150_000, partner_income=120_000,
            buyer_type="couple",
        ))
        assert result.eligible

    def test_regional_income_couple_over_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_couple=218_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Kimberley", income=160_000, partner_income=140_000,
            buyer_type="couple",
        ))
        assert not result.eligible

    def test_regional_income_unknown_region_falls_to_general(self):
        """Unknown region → statewide cap."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_single=148_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Perth", income=160_000,
        ))
        assert not result.eligible

    def test_regional_income_no_region_falls_to_general(self):
        """No region → statewide cap."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_single=148_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region=None, income=160_000,
        ))
        assert not result.eligible

    def test_regional_income_at_exact_cap(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(
            max_income_single=148_000,
            max_income_by_region={"Kimberley": (225_000, 285_000)},
        ))
        result = _check_eligibility(scheme, _make_inputs(
            region="Kimberley", income=225_000,
        ))
        assert result.eligible

    # ── property_types ───────────────────────

    def test_property_types_matches(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(property_types=["new"]))
        result = _check_eligibility(scheme, _make_inputs(property_type="new"))
        assert result.eligible

    def test_property_types_mismatch(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(property_types=["new"]))
        result = _check_eligibility(scheme, _make_inputs(property_type="existing"))
        assert not result.eligible
        assert "Property type must be: new" in result.reasons

    def test_property_types_unset_skips_check(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(property_types=["new"]))
        result = _check_eligibility(scheme, _make_inputs(property_type=None))
        assert result.eligible

    def test_property_types_none_skips_check(self):
        """Scheme with no property type restriction passes any input."""
        scheme = _make_scheme(predicates=EligibilityPredicates(property_types=None))
        result = _check_eligibility(scheme, _make_inputs(property_type="existing"))
        assert result.eligible

    def test_property_types_multi_allows_any_in_list(self):
        """SA stamp duty: accepts new OR land."""
        scheme = _make_scheme(predicates=EligibilityPredicates(property_types=["new", "land"]))
        assert _check_eligibility(scheme, _make_inputs(property_type="new")).eligible
        assert _check_eligibility(scheme, _make_inputs(property_type="land")).eligible
        assert not _check_eligibility(scheme, _make_inputs(property_type="existing")).eligible

    # ── single_parent_required ───────────────

    def test_single_parent_required_and_is_single_parent(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=True))
        result = _check_eligibility(scheme, _make_inputs(single_parent=True))
        assert result.eligible

    def test_single_parent_required_and_is_not(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=True))
        result = _check_eligibility(scheme, _make_inputs(single_parent=False))
        assert not result.eligible
        assert "Must be a single parent or legal guardian" in result.reasons

    def test_single_parent_required_and_any_skips(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=True))
        result = _check_eligibility(scheme, _make_inputs(single_parent=None))
        assert result.eligible

    def test_single_parent_not_required_always_passes(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=False))
        result = _check_eligibility(scheme, _make_inputs(single_parent=False))
        assert result.eligible

    # ── requires_no_property_in_last_2_years ─

    def test_ownership_lookback_fails_when_owned(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(requires_no_property_in_last_2_years=True))
        result = _check_eligibility(scheme, _make_inputs(owned_property_in_last_2_years=True))
        assert not result.eligible
        assert "Must not have owned property in Australia in the last 2 years" in result.reasons

    def test_ownership_lookback_passes_when_not_owned(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(requires_no_property_in_last_2_years=True))
        result = _check_eligibility(scheme, _make_inputs(owned_property_in_last_2_years=False))
        assert result.eligible

    def test_ownership_lookback_skips_when_none(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(requires_no_property_in_last_2_years=True))
        result = _check_eligibility(scheme, _make_inputs(owned_property_in_last_2_years=None))
        assert result.eligible

    def test_ownership_lookback_false_always_passes(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(requires_no_property_in_last_2_years=False))
        result = _check_eligibility(scheme, _make_inputs(owned_property_in_last_2_years=True))
        assert result.eligible

    # ── individual_only ──────────────────────

    def test_individual_only_with_couple(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(individual_only=True))
        result = _check_eligibility(scheme, _make_inputs(buyer_type="couple"))
        assert not result.eligible
        assert "Individual application only" in result.reasons

    def test_individual_only_with_individual(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(individual_only=True))
        result = _check_eligibility(scheme, _make_inputs(buyer_type="individual"))
        assert result.eligible

    def test_individual_only_unset_skips(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(individual_only=True))
        result = _check_eligibility(scheme, _make_inputs(buyer_type=None))
        assert result.eligible

    # ── off_the_plan_only ────────────────────

    def test_otp_required_and_not_otp(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(off_the_plan_only=True))
        result = _check_eligibility(scheme, _make_inputs(off_the_plan=False))
        assert not result.eligible
        assert "Off-the-plan purchase only" in result.reasons

    def test_otp_required_and_is_otp(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(off_the_plan_only=True))
        result = _check_eligibility(scheme, _make_inputs(off_the_plan=True))
        assert result.eligible

    # ── multiple predicates ──────────────────

    def test_multiple_failures(self):
        """Multiple predicates can fail simultaneously."""
        scheme = _make_scheme(predicates=EligibilityPredicates(
            first_home_buyer=True,
            max_price=750_000,
            property_types=["new"],
        ))
        result = _check_eligibility(scheme, _make_inputs(
            first_home_buyer=False,
            price=900_000,
            property_type="existing",
        ))
        assert not result.eligible
        assert len(result.reasons) == 3


# ──────────────────────────────────────────────
# evaluate_schemes — integration with registry
# ──────────────────────────────────────────────


class TestEvaluateSchemes:
    """Tests for evaluate_schemes using real config data."""

    def test_federal_only_returns_federal_schemes(self):
        results = evaluate_schemes(_make_inputs(states=["Federal"]))
        for r in results:
            assert r.scheme.level == "Federal"

    def test_qld_returns_qld_and_no_other_states(self):
        results = evaluate_schemes(_make_inputs(states=["QLD"]))
        for r in results:
            assert r.scheme.level == "State"
            assert r.scheme.state is not None
            assert r.scheme.state.value == "QLD"

    def test_federal_plus_qld(self):
        results = evaluate_schemes(_make_inputs(states=["Federal", "QLD"]))
        levels = {r.scheme.level for r in results}
        assert "Federal" in levels
        assert "State" in levels

    def test_eligible_sorted_first(self):
        """Eligible schemes appear before ineligible ones."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal", "QLD"],
            first_home_buyer=False,
        ))
        found_ineligible = False
        for r in results:
            if not r.result.eligible:
                found_ineligible = True
            elif found_ineligible:
                pytest.fail("Eligible scheme found after ineligible scheme in sorted results")

    def test_fhog_qld_eligible_for_new_under_750k(self):
        """Known scheme: QLD FHOG should be eligible for a $600k new build."""
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            price=600_000,
            property_type="new",
            first_home_buyer=True,
            owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-qld"), None)
        assert fhog is not None
        assert fhog.result.eligible

    def test_fhog_qld_ineligible_over_750k(self):
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            price=800_000,
            property_type="new",
            first_home_buyer=True,
            owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-qld"), None)
        assert fhog is not None
        assert not fhog.result.eligible

    def test_fhog_qld_ineligible_existing_property(self):
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            price=600_000,
            property_type="existing",
            first_home_buyer=True,
            owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-qld"), None)
        assert fhog is not None
        assert not fhog.result.eligible

    def test_help_to_buy_couple_income_cap(self):
        """Help to Buy: couple at $170k household should fail."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"],
            income=90_000,
            partner_income=80_000,
            buyer_type="couple",
            owner_occupier=True,
        ))
        htb = next((r for r in results if r.scheme.id == "help-to-buy"), None)
        assert htb is not None
        assert not htb.result.eligible

    def test_fhg_rejects_couple(self):
        """Family Home Guarantee: individual only."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"],
            buyer_type="couple",
            owner_occupier=True,
        ))
        fhg = next((r for r in results if r.scheme.id == "fhg"), None)
        assert fhg is not None
        assert not fhg.result.eligible

    def test_otp_ineligible_when_not_otp(self):
        """OTP schemes should be ineligible when off_the_plan is False."""
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            off_the_plan=False,
        ))
        otp = next((r for r in results if r.scheme.id == "otp-qld"), None)
        assert otp is not None
        assert not otp.result.eligible

    def test_otp_eligible_when_otp(self):
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            off_the_plan=True,
        ))
        otp = next((r for r in results if r.scheme.id == "otp-qld"), None)
        assert otp is not None
        assert otp.result.eligible

    def test_freshstart_nt_rejects_fhb(self):
        """FreshStart NT is for existing homeowners, not first home buyers."""
        results = evaluate_schemes(_make_inputs(
            states=["NT"],
            first_home_buyer=True,
            property_type="new",
            owner_occupier=True,
        ))
        fs = next((r for r in results if r.scheme.id == "freshstart-nt"), None)
        assert fs is not None
        assert not fs.result.eligible

    def test_empty_states_returns_nothing(self):
        results = evaluate_schemes(_make_inputs(states=[]))
        assert len(results) == 0

    def test_sa_stamp_duty_accepts_new_and_land(self):
        """SA stamp duty should pass for new and land, fail for existing."""
        for pt in ["new", "land"]:
            results = evaluate_schemes(_make_inputs(
                states=["SA"], property_type=pt, first_home_buyer=True, owner_occupier=True,
            ))
            sa_stamp = next((r for r in results if r.scheme.id == "fhb-stamp-sa"), None)
            assert sa_stamp is not None
            assert sa_stamp.result.eligible, f"SA stamp duty should be eligible for {pt}"

        results = evaluate_schemes(_make_inputs(
            states=["SA"], property_type="existing", first_home_buyer=True, owner_occupier=True,
        ))
        sa_stamp = next((r for r in results if r.scheme.id == "fhb-stamp-sa"), None)
        assert sa_stamp is not None
        assert not sa_stamp.result.eligible

    def test_fhg_requires_single_parent(self):
        """FHG should fail when single_parent is False."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], single_parent=False, owner_occupier=True, buyer_type="individual",
        ))
        fhg = next((r for r in results if r.scheme.id == "fhg"), None)
        assert fhg is not None
        assert not fhg.result.eligible
        assert any("single parent" in r.lower() for r in fhg.result.reasons)

    # ── ACT ownership lookback ───────────────

    def test_act_hbcs_eligible_when_not_owned_recently(self):
        """ACT HBCS should be eligible if user hasn't owned in last 2 years."""
        results = evaluate_schemes(_make_inputs(
            states=["ACT"],
            owned_property_in_last_2_years=False,
            owner_occupier=True,
            price=800_000,
            income=200_000,
        ))
        hbcs = next((r for r in results if r.scheme.id == "hbcs-act"), None)
        assert hbcs is not None
        assert hbcs.result.eligible

    def test_act_hbcs_ineligible_when_owned_recently(self):
        """ACT HBCS should fail if user owned property in last 2 years."""
        results = evaluate_schemes(_make_inputs(
            states=["ACT"],
            owned_property_in_last_2_years=True,
            owner_occupier=True,
            price=800_000,
            income=200_000,
        ))
        hbcs = next((r for r in results if r.scheme.id == "hbcs-act"), None)
        assert hbcs is not None
        assert not hbcs.result.eligible
        assert any("2 years" in r for r in hbcs.result.reasons)

    def test_act_hbcs_skips_when_unset(self):
        """ACT HBCS should skip ownership check when input is None."""
        results = evaluate_schemes(_make_inputs(
            states=["ACT"],
            owned_property_in_last_2_years=None,
            owner_occupier=True,
            price=800_000,
            income=200_000,
        ))
        hbcs = next((r for r in results if r.scheme.id == "hbcs-act"), None)
        assert hbcs is not None
        assert hbcs.result.eligible

    # ── Regional price caps ──────────────────

    def test_fhbg_sydney_under_cap_eligible(self):
        """FHBG: $1.4M in Sydney (cap $1.5M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Sydney",
            price=1_400_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert fhbg.result.eligible

    def test_fhbg_sydney_over_cap_ineligible(self):
        """FHBG: $1.6M in Sydney (cap $1.5M) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Sydney",
            price=1_600_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert not fhbg.result.eligible
        assert any("1,500,000" in r for r in fhbg.result.reasons)

    def test_fhbg_regional_nsw_lower_cap(self):
        """FHBG: $850k in Regional NSW (cap $800k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional NSW",
            price=850_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert not fhbg.result.eligible

    def test_fhbg_brisbane_at_cap(self):
        """FHBG: $1M in Brisbane (cap $1M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Brisbane",
            price=1_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert fhbg.result.eligible

    def test_fhbg_melbourne_under_cap(self):
        """FHBG: $900k in Melbourne (cap $950k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Melbourne",
            price=900_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_melbourne_over_cap(self):
        """FHBG: $1M in Melbourne (cap $950k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Melbourne",
            price=1_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert not fhbg.result.eligible

    def test_fhbg_perth_under_cap(self):
        """FHBG: $800k in Perth (cap $850k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Perth",
            price=800_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_perth_over_cap(self):
        """FHBG: $900k in Perth (cap $850k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Perth",
            price=900_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert not fhbg.result.eligible

    def test_fhbg_adelaide(self):
        """FHBG: $900k in Adelaide (cap $900k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Adelaide",
            price=900_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_hobart(self):
        """FHBG: $700k in Hobart (cap $700k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Hobart",
            price=700_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_hobart_over_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Hobart",
            price=750_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert not fhbg.result.eligible

    def test_fhbg_canberra(self):
        """FHBG: $1M in Canberra (cap $1M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Canberra",
            price=1_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_darwin(self):
        """FHBG: $600k in Darwin (cap $600k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Darwin",
            price=600_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_darwin_over_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Darwin",
            price=650_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert not fhbg.result.eligible

    def test_fhbg_geelong_shares_melbourne_cap(self):
        """Geelong uses Melbourne cap ($950k)."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Geelong",
            price=950_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_gold_coast_shares_brisbane_cap(self):
        """Gold Coast uses Brisbane cap ($1M)."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Gold Coast",
            price=1_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_sunshine_coast_shares_brisbane_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Sunshine Coast",
            price=1_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_illawarra_shares_sydney_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Illawarra",
            price=1_500_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_newcastle_shares_sydney_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Newcastle",
            price=1_400_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_vic(self):
        """Regional VIC: cap $650k."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional VIC",
            price=650_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_vic_over_cap(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional VIC",
            price=700_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert not fhbg.result.eligible

    def test_fhbg_regional_qld(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional QLD",
            price=700_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_wa(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional WA",
            price=600_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_sa(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional SA",
            price=500_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_tas(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional TAS",
            price=550_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_regional_nt(self):
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Regional NT",
            price=600_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg.result.eligible

    def test_fhbg_no_region_no_price_cap(self):
        """FHBG: no region specified → no price cap enforced (falls back to max_price=None)."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region=None,
            price=2_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert fhbg.result.eligible

    def test_fhbg_unknown_region_no_price_cap(self):
        """FHBG: unknown region → falls back to max_price (None) → no cap."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], region="Unknown Place",
            price=2_000_000, first_home_buyer=True, owner_occupier=True,
        ))
        fhbg = next((r for r in results if r.scheme.id == "fhbg"), None)
        assert fhbg is not None
        assert fhbg.result.eligible

    def test_wa_fhog_kimberley_higher_cap(self):
        """WA FHOG: $900k in Kimberley (cap $1M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            price=900_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert fhog is not None
        assert fhog.result.eligible

    def test_wa_fhog_perth_general_cap(self):
        """WA FHOG: $800k in Perth (no regional override → general $750k cap) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Perth",
            price=800_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert fhog is not None
        assert not fhog.result.eligible

    def test_wa_fhog_pilbara_higher_cap(self):
        """WA FHOG: $900k in Pilbara (cap $1M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Pilbara",
            price=900_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert fhog.result.eligible

    def test_wa_fhog_kimberley_at_exact_cap(self):
        """WA FHOG: $1M in Kimberley (cap $1M) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            price=1_000_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert fhog.result.eligible

    def test_wa_fhog_kimberley_over_cap(self):
        """WA FHOG: $1.1M in Kimberley (cap $1M) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            price=1_100_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert not fhog.result.eligible

    def test_wa_fhog_no_region_uses_general(self):
        """WA FHOG: no region → general $750k cap."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region=None,
            price=800_000, property_type="new",
            first_home_buyer=True, owner_occupier=True,
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-wa"), None)
        assert not fhog.result.eligible

    # ── Regional income caps

    def test_keystart_pilbara_higher_income(self):
        """Keystart: $200k income in Pilbara (cap $225k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Pilbara",
            income=200_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks.result.eligible

    def test_keystart_kimberley_higher_income(self):
        """Keystart: $200k income in Kimberley (cap $225k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            income=200_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks is not None
        assert ks.result.eligible

    def test_keystart_kimberley_over_regional_cap(self):
        """Keystart: $230k income in Kimberley (cap $225k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            income=230_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks is not None
        assert not ks.result.eligible

    def test_keystart_perth_statewide_cap(self):
        """Keystart: $160k income in Perth (statewide cap $148k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Perth",
            income=160_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks is not None
        assert not ks.result.eligible

    def test_keystart_couple_kimberley(self):
        """Keystart: couple $270k household in Kimberley (cap $285k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            income=150_000, partner_income=120_000,
            buyer_type="couple", owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks is not None
        assert ks.result.eligible

    def test_keystart_couple_kimberley_over_cap(self):
        """Keystart: couple $300k household in Kimberley (cap $285k) → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Kimberley",
            income=160_000, partner_income=140_000,
            buyer_type="couple", owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks is not None
        assert not ks.result.eligible

    def test_keystart_no_region_statewide_cap(self):
        """Keystart: no region → statewide $148k cap."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region=None,
            income=160_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert not ks.result.eligible

    def test_keystart_pilbara_at_exact_cap(self):
        """Keystart: $225k in Pilbara (cap $225k) → eligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Pilbara",
            income=225_000, owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert ks.result.eligible

    def test_keystart_couple_perth_statewide_cap(self):
        """Keystart: couple $230k in Perth → statewide $218k cap → ineligible."""
        results = evaluate_schemes(_make_inputs(
            states=["WA"], region="Perth",
            income=120_000, partner_income=110_000,
            buyer_type="couple", owner_occupier=True,
        ))
        ks = next((r for r in results if r.scheme.id == "keystart-wa"), None)
        assert not ks.result.eligible


# ──────────────────────────────────────────────
# Registry sanity checks
# ──────────────────────────────────────────────


class TestRegistry:
    """Sanity checks on the scheme registry."""

    def test_all_schemes_have_unique_ids(self):
        schemes = get_all_schemes()
        ids = [s.id for s in schemes]
        assert len(ids) == len(set(ids))

    def test_total_scheme_count(self):
        assert len(get_all_schemes()) == 33

    def test_known_scheme_exists(self):
        assert get_scheme("fhbg") is not None
        assert get_scheme("fhog-qld") is not None
        assert get_scheme("hbcs-act") is not None

    def test_unknown_scheme_returns_none(self):
        assert get_scheme("nonexistent") is None

    def test_time_limited_schemes_have_dates(self):
        """Schemes with known expiry should have valid_to set."""
        dated_ids = {
            "fhog-qld", "fhb-stamp-new-qld", "fhb-land-qld", "otp-qld",
            "otp-vic", "otp-wa",
            "fhog-tas", "fhb-stamp-tas", "otp-tas",
            "fhog-new-nt", "fhog-established-nt", "freshstart-nt",
        }
        for scheme_id in dated_ids:
            scheme = get_scheme(scheme_id)
            assert scheme is not None, f"{scheme_id} not found"
            assert scheme.valid_from is not None or scheme.valid_to is not None, (
                f"{scheme_id} should have at least one date set"
            )
