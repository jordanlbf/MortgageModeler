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
        first_home_buyer="yes",
        owner_occupier="yes",
        single_parent="any",
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
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer="yes"))
        assert result.eligible

    def test_fhb_required_and_user_is_not_fhb(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=True))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer="no"))
        assert not result.eligible
        assert "Must be a first home buyer" in result.reasons

    def test_fhb_required_and_user_is_any(self):
        """User hasn't specified — predicate should be skipped."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=True))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer="any"))
        assert result.eligible

    def test_fhb_false_and_user_is_fhb(self):
        """Scheme explicitly for non-FHB (e.g. FreshStart NT)."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=False))
        result = _check_eligibility(scheme, _make_inputs(first_home_buyer="yes"))
        assert not result.eligible
        assert "Not available to first home buyers" in result.reasons

    def test_fhb_none_is_always_skipped(self):
        """Scheme has no FHB requirement — any value passes."""
        scheme = _make_scheme(predicates=EligibilityPredicates(first_home_buyer=None))
        for val in ["yes", "no", "any"]:
            result = _check_eligibility(scheme, _make_inputs(first_home_buyer=val))
            assert result.eligible

    # ── owner_occupier ───────────────────────

    def test_owner_occupier_required_and_user_is_not(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(owner_occupier=True))
        result = _check_eligibility(scheme, _make_inputs(owner_occupier="no"))
        assert not result.eligible
        assert "Must be owner-occupier" in result.reasons

    def test_owner_occupier_skipped_when_any(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(owner_occupier=True))
        result = _check_eligibility(scheme, _make_inputs(owner_occupier="any"))
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
        result = _check_eligibility(scheme, _make_inputs(property_type=""))
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
        result = _check_eligibility(scheme, _make_inputs(single_parent="yes"))
        assert result.eligible

    def test_single_parent_required_and_is_not(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=True))
        result = _check_eligibility(scheme, _make_inputs(single_parent="no"))
        assert not result.eligible
        assert "Must be a single parent or legal guardian" in result.reasons

    def test_single_parent_required_and_any_skips(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=True))
        result = _check_eligibility(scheme, _make_inputs(single_parent="any"))
        assert result.eligible

    def test_single_parent_not_required_always_passes(self):
        scheme = _make_scheme(predicates=EligibilityPredicates(single_parent_required=False))
        result = _check_eligibility(scheme, _make_inputs(single_parent="no"))
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
        result = _check_eligibility(scheme, _make_inputs(buyer_type=""))
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
            first_home_buyer="no",
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
            first_home_buyer="no",
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
            first_home_buyer="yes",
            owner_occupier="yes",
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-qld"), None)
        assert fhog is not None
        assert fhog.result.eligible

    def test_fhog_qld_ineligible_over_750k(self):
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            price=800_000,
            property_type="new",
            first_home_buyer="yes",
            owner_occupier="yes",
        ))
        fhog = next((r for r in results if r.scheme.id == "fhog-qld"), None)
        assert fhog is not None
        assert not fhog.result.eligible

    def test_fhog_qld_ineligible_existing_property(self):
        results = evaluate_schemes(_make_inputs(
            states=["QLD"],
            price=600_000,
            property_type="existing",
            first_home_buyer="yes",
            owner_occupier="yes",
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
            owner_occupier="yes",
        ))
        htb = next((r for r in results if r.scheme.id == "help-to-buy"), None)
        assert htb is not None
        assert not htb.result.eligible

    def test_fhg_rejects_couple(self):
        """Family Home Guarantee: individual only."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"],
            buyer_type="couple",
            owner_occupier="yes",
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
            first_home_buyer="yes",
            property_type="new",
            owner_occupier="yes",
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
                states=["SA"], property_type=pt, first_home_buyer="yes", owner_occupier="yes",
            ))
            sa_stamp = next((r for r in results if r.scheme.id == "fhb-stamp-sa"), None)
            assert sa_stamp is not None
            assert sa_stamp.result.eligible, f"SA stamp duty should be eligible for {pt}"

        results = evaluate_schemes(_make_inputs(
            states=["SA"], property_type="existing", first_home_buyer="yes", owner_occupier="yes",
        ))
        sa_stamp = next((r for r in results if r.scheme.id == "fhb-stamp-sa"), None)
        assert sa_stamp is not None
        assert not sa_stamp.result.eligible

    def test_fhg_requires_single_parent(self):
        """FHG should fail when single_parent is 'no'."""
        results = evaluate_schemes(_make_inputs(
            states=["Federal"], single_parent="no", owner_occupier="yes", buyer_type="individual",
        ))
        fhg = next((r for r in results if r.scheme.id == "fhg"), None)
        assert fhg is not None
        assert not fhg.result.eligible
        assert any("single parent" in r.lower() for r in fhg.result.reasons)


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
