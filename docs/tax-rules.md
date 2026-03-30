# Australian Tax Rules — Implementation Reference

Financial Year: **2025-26** (1 July 2025 – 30 June 2026)

This document tracks every ATO tax rule implemented in the codebase, where the implementation lives, what thresholds/rates apply, and which tests verify correctness. Use this as a checklist when the ATO updates rates each financial year.

---

## Quick Reference

| Rule | Config | Engine Function | Type | Verified |
|---|---|---|---|---|
| [Income Tax Brackets](#income-tax-brackets) | `TAX_BRACKETS` | `calculate_income_tax()` | Marginal brackets | 2026-03-29 |
| [Marginal Rate Lookup](#marginal-rate-lookup) | `TAX_BRACKETS` | `calculate_marginal_rate()` | Bracket lookup | 2026-03-29 |
| [Medicare Levy](#medicare-levy) | `MEDICARE_*` | `calculate_medicare_levy()` | Phase-in + flat 2% | 2026-03-29 |
| [Medicare Levy Surcharge](#medicare-levy-surcharge-mls) | `MLS_THRESHOLDS` | `calculate_medicare_levy_surcharge()` | Tiered rate on MLS income | 2026-03-29 |
| [HECS/HELP Repayments](#hecshelp-repayments) | `HECS_*` | `calculate_hecs_repayment()` | Marginal on repayment income | 2026-03-29 |
| [LITO](#low-income-tax-offset-lito) | `LITO_*` | `calculate_lito()` | Non-refundable offset | 2026-03-29 |
| [SAPTO](#seniors-and-pensioners-tax-offset-sapto) | `SAPTO_*` | `calculate_sapto()` | Non-refundable offset | 2026-03-29 |
| [Franking Credit Offset](#franking-credit-offset) | — | — (raw value) | Refundable offset | 2026-03-29 |
| [Offset Application Order](#offset-application-order) | — | `_apply_offsets()` | Non-refundable then refundable | 2026-03-29 |
| [CGT Discount](#cgt-discount) | — | — (service layer) | 50% for assets held >12 months | 2026-03-29 |
| [Negative Gearing / Net Investment Loss](#negative-gearing--net-investment-loss) | — | — (service layer) | Loss add-back for HRI/MLS | 2026-03-29 |
| [Income Measure Derivation](#income-measure-derivation) | — | `compute_income_measures()` | TI, HRI, MLS income | 2026-03-29 |
| [Tax Saving (Investment Property)](#tax-saving-investment-property) | — | `calculate_tax_saving()` | Two-pass comparison | 2026-03-29 |
| [Division 40 — Plant & Equipment](#division-40--plant--equipment-depreciation) | `DIV40_SECONDHAND_CUTOFF_DATE` | `calculate_division_40_prime_cost()`, `calculate_division_40_diminishing_value()` | Two methods + eligibility | 2026-03-29 |
| [Division 43 — Capital Works](#division-43--capital-works-deductions) | `DIV43_CONSTRUCTION_CUTOFF_DATE` | `calculate_division_43_deduction()` | 2.5% straight-line | 2026-03-29 |
| [Borrowing Cost Deductions](#borrowing-cost-deductions) | — | `calculate_borrowing_cost_deduction()` | 5-year spread (or loan term) | 2026-03-29 |

---

## Income Tax Brackets

### Rule

Australian income tax is calculated using marginal tax brackets. Each dollar of taxable income is taxed at the rate of the bracket it falls into. The first $18,200 is tax-free.

### ATO Schedule

| Taxable Income | Tax Rate | Tax on This Bracket |
|---|---|---|
| $0 – $18,200 | 0% | $0 |
| $18,201 – $45,000 | 16% | Up to $4,288 |
| $45,001 – $135,000 | 30% | Up to $27,000 |
| $135,001 – $190,000 | 37% | Up to $20,350 |
| $190,001+ | 45% | — |

### ATO Source

https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents

### Configuration

**File:** `backend/app/config/tax.py`

```python
TAX_BRACKETS = [
    (18_200, 0.00),   # 0% on first $18,200
    (45_000, 0.16),   # 16% on $18,201 – $45,000
    (135_000, 0.30),  # 30% on $45,001 – $135,000
    (190_000, 0.37),  # 37% on $135,001 – $190,000
    (float("inf"), 0.45),  # 45% on $190,001+
]
```

Each tuple is `(upper_threshold, rate)`. The engine iterates brackets, applying each rate to the income within that range.

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_income_tax(taxable_income: float) -> float`

- Returns 0 for TI <= 0 (guard against negative income)
- Iterates `TAX_BRACKETS`, accumulating tax at each bracket's rate
- Stops when the current bracket contains the taxable income

### Service Integration

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `build_tax_breakdown()`

- Called as `raw_income_tax = calculate_income_tax(profile.taxable_income)`
- The raw result is then passed to `_apply_offsets()` before inclusion in the breakdown
- The `income_tax` field in the response is the **post-offset** value, not the raw bracket calculation

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestIncomeTax` (8 tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_income_tax_zero` | TI = $0 | $0 |
| `test_income_tax_negative` | TI = -$1,000 | $0 |
| `test_income_boundary_threshold` | TI at each bracket boundary | $0, $0.16, $4,288, $4,288.30, $31,288, $31,288.37, $51,638, $51,638.45 |
| `test_income_mid_boundaries` | TI mid-bracket | $0, $1,888, $10,787.80, $35,041.65, $416,138 |
| `test_income_tax_fractional_income` | TI = $45,000.50 | $4,288.15 |
| `test_income_tax_large_income` | TI = $10M | $4,466,138 |
| `test_income_tax_edge_case` | TI at exact thresholds | $0, $4,288, $31,288, $51,638 |

### Last Verified

2026-03-29

---

## Marginal Rate Lookup

### Rule

Returns the marginal tax rate (the rate on the next dollar of income) for a given taxable income. Used for display purposes — not used in tax calculation itself.

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_marginal_rate(taxable_income: float) -> float`

- Returns 0.0 for TI <= 0
- Iterates `TAX_BRACKETS`, returns the rate of the bracket containing the income
- Falls back to the last bracket rate for income above all thresholds

### Service Integration

**File:** `backend/app/services/tax_breakdown.py`

- Called in `build_tax_breakdown()` and included in the response as `marginal_rate`

### Test Coverage

**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestMarginalRate` (15 tests)

| Test | TI | Expected Rate |
|---|---|---|
| `test_zero_income` | $0 | 0.0 |
| `test_negative_income` | -$10,000 | 0.0 |
| `test_within_tax_free_threshold` | $10,000 | 0.0 |
| `test_at_tax_free_threshold` | $18,200 | 0.0 |
| `test_just_above_tax_free` | $18,201 | 0.16 |
| `test_second_bracket` | $30,000 | 0.16 |
| `test_at_second_threshold` | $45,000 | 0.16 |
| `test_just_above_second_threshold` | $45,001 | 0.30 |
| `test_third_bracket` | $100,000 | 0.30 |
| `test_at_third_threshold` | $135,000 | 0.30 |
| `test_just_above_third_threshold` | $135,001 | 0.37 |
| `test_fourth_bracket` | $160,000 | 0.37 |
| `test_at_fourth_threshold` | $190,000 | 0.37 |
| `test_just_above_fourth_threshold` | $190,001 | 0.45 |
| `test_top_bracket` | $500,000 | 0.45 |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestMarginalRateInBreakdown` (5 tests) — verifies marginal_rate in service response at $15k, $50k, $100k, $150k, $200k.

### Last Verified

2026-03-29

---

## Medicare Levy

### Rule

A 2% levy on taxable income for taxpayers above the threshold. Below the lower threshold, no levy. Between lower and upper thresholds, a phase-in rate applies (10% of the amount over the lower threshold).

### ATO Schedule

| Taxable Income | Levy |
|---|---|
| $0 – $27,222 | $0 |
| $27,223 – $34,026 | 10% of (TI − $27,222) |
| $34,027+ | 2% of TI |

### ATO Source

https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy

### Configuration

**File:** `backend/app/config/tax.py`

| Constant | Value | Description |
|---|---|---|
| `MEDICARE_LOWER_THRESHOLD` | 27,222 | No levy below this |
| `MEDICARE_HIGH_THRESHOLD` | 34,027 | Full 2% above this |
| `MEDICARE_PHASE_IN_RATE` | 0.10 | 10% of excess over lower threshold |
| `MEDICARE_LEVY_RATE` | 0.02 | 2% flat rate above upper threshold |

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_medicare_levy(taxable_income: float) -> float`

Three branches:
1. TI <= 27,222 → $0
2. TI < 34,027 → `(TI - 27,222) * 0.10`
3. TI >= 34,027 → `TI * 0.02`

**Note:** Uses taxable income (not repayment income or MLS income).

### Service Integration

Called in `build_tax_breakdown()` as a standalone component. Not affected by tax offsets — offsets only apply to income tax.

### Test Coverage

**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestMedicareLevyTax` (7 tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_medicare_levy_zero` | TI = $0 | $0 |
| `test_medicare_levy_below_threshold` | TI = $27k, $7k | $0 |
| `test_medicare_levy_phase_in` | TI = $30k | ($30k − $27,222) × 0.10 = $277.80 |
| `test_medicare_levy_phase_in` | TI = $33k | ($33k − $27,222) × 0.10 = $577.80 |
| `test_medicare_levy_above_threshold` | TI = $35k, $100k | $35k × 0.02, $100k × 0.02 |
| `test_medicare_levy_negative_income` | TI = -$10k | $0 |
| `test_medicare_levy_exact_thresholds` | TI = $27,222, $34,027 | $0, $34,027 × 0.02 |

### Last Verified

2026-03-29

---

## Medicare Levy Surcharge (MLS)

### Rule

An additional levy for taxpayers without private hospital cover who earn above the MLS income threshold. Uses **MLS income** (not taxable income) — this can differ from TI due to negative gearing add-backs, salary sacrifice, and FBT.

### ATO Schedule

| MLS Income | Rate |
|---|---|
| $0 – $101,000 | 0% |
| $101,001 – $118,000 | 1.0% of MLS income |
| $118,001 – $158,000 | 1.25% of MLS income |
| $158,001+ | 1.5% of MLS income |

**Important:** The rate applies to the **entire** MLS income, not just the excess over the threshold (unlike income tax brackets). If MLS income is $120k, the surcharge is $120k × 1.25% = $1,500.

### ATO Source

https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy-surcharge

### Configuration

**File:** `backend/app/config/tax.py`

```python
MLS_THRESHOLDS = [
    (101_000, 0.00),
    (118_000, 0.01),
    (158_000, 0.0125),
    (float("inf"), 0.015),
]
```

Each tuple is `(upper_threshold, rate)`. The engine finds the first threshold the income falls within and applies that rate to the **full** MLS income.

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_medicare_levy_surcharge(mls_income: float, has_private_health: bool) -> float`

- Returns 0 immediately if `has_private_health` is True
- Iterates `MLS_THRESHOLDS`, returns `mls_income * rate` for the matching tier
- Raises `ValueError` if no catch-all bracket exists (safety guard)

### Service Integration

Called in `build_tax_breakdown()`. Not affected by tax offsets.

**Income measure used:** `profile.mls_income` — this equals repayment income in the current implementation (future-proofed for divergence).

### Test Coverage

**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestMedicareLevySurchargeTax` (12 tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_...below_threshold` | MLSI = $100k | $0 |
| `test_...first_threshold` | MLSI = $110k | $110k × 1% = $1,100 |
| `test_...second_threshold` | MLSI = $130k | $130k × 1.25% = $1,625 |
| `test_...above_threshold` | MLSI = $160k, $200k | × 1.5% |
| `test_...negative_income` | MLSI = -$50k | $0 |
| `test_...exact_thresholds` | MLSI at $101k, $118k, $158k | $0, $118k × 1%, $158k × 1.25% |
| `test_...zero_income` | MLSI = $0 | $0 |
| `test_...just_below_threshold` | MLSI at $100,999, $117,999, $157,999 | Lower tier rates |
| `test_...just_above_threshold` | MLSI at $101,001, $118,001, $158,001 | Higher tier rates |
| `test_...large_income` | MLSI = $1M | $1M × 1.5% |
| `test_...fractional_income` | MLSI = $150,000.50 | × 1.25% |
| `test_...with_private_health` | MLSI = $110k–$200k with PHI | $0 for all |

### Last Verified

2026-03-29

---

## HECS/HELP Repayments

### Rule

Compulsory repayment of HELP debts based on **repayment income** (not taxable income). Uses marginal thresholds up to the top threshold, then switches to a flat 10% of total repayment income. Repayment is capped at the remaining debt balance.

### ATO Schedule

| Repayment Income | Rate | Type |
|---|---|---|
| $0 – $67,000 | 0% | No repayment |
| $67,001 – $125,000 | 15% of excess over $67,000 | Marginal |
| $125,001 – $179,285 | 17% of excess over $125,000 | Marginal |
| $179,286+ | 10% of total RI | Flat (not marginal) |

**Important:** Above $179,285, the rate becomes 10% of **total** repayment income, not marginal. The engine adds $0.05 rounding adjustment at this boundary.

### ATO Source

https://www.ato.gov.au/individuals-and-families/study-and-training-support-loans/repaying-your-loan

### Configuration

**File:** `backend/app/config/tax.py`

| Constant | Value | Description |
|---|---|---|
| `HECS_THRESHOLDS` | See below | Marginal repayment brackets |
| `HECS_TOP_THRESHOLD` | 179,285 | Above this, flat 10% of total RI |

```python
HECS_THRESHOLDS = [
    (67_000, 0.00),
    (125_000, 0.15),
    (179_285, 0.17),
    (float("inf"), 0.10),
]
```

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_hecs_repayment(repayment_income: float, hecs_balance: float) -> float`

- Iterates marginal thresholds accumulating repayment
- Above `HECS_TOP_THRESHOLD`: adds $0.05 rounding to align marginal total with flat 10%
- Final result: `min(repayment_owing, hecs_balance)` — capped at remaining balance

### Service Integration

Called in `build_tax_breakdown()`. Not affected by tax offsets.

**Income measure used:** `profile.repayment_income` — this is taxable income + salary sacrifice + FBT + net investment loss.

### Test Coverage

**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestHecsTax` (7 tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_hecs_no_income` | RI = $0, infinite balance | $0 |
| `test_hecs_below_threshold` | RI = $50k | $0 |
| `test_hecs_at_exact_threshold` | RI = $67k, $125k, $179,285 | $0, $8,700, $17,928.45 |
| `test_hecs_mid_thresholds` | RI = $80k, $150k | $1,950, $12,950 |
| `test_hecs_above_threshold` | RI = $179,286–$1M | 10% of RI |
| `test_hecs_no_hecs_balance` | Balance = $0 | $0 |
| `test_hecs_balance_less_than_owing` | Balance < repayment | Capped at balance |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestHecs` (3 tests) — with balance, balance cap, increases total tax.

### Last Verified

2026-03-29

---

## Low Income Tax Offset (LITO)

### Rule

A non-refundable tax offset that reduces income tax for lower income earners. Cannot reduce income tax below zero. Applied automatically — no eligibility criteria beyond taxable income.

### ATO Schedule

| Taxable Income | Offset |
|---|---|
| $0 – $37,500 | $700 |
| $37,501 – $45,000 | $700 minus 5 cents for every $1 above $37,500 |
| $45,001 – $66,667 | $325 minus 1.5 cents for every $1 above $45,000 |
| Above $66,667 | $0 |

### ATO Source

https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-income-tax-offset

### Configuration

**File:** `backend/app/config/tax.py`

| Constant | Value | Description |
|---|---|---|
| `LITO_MAX_OFFSET` | 700 | Maximum offset amount |
| `LITO_FULL_THRESHOLD` | 37,500 | Full offset for TI at or below this |
| `LITO_PHASE_OUT_1_RATE` | 0.05 | 5c per $1 reduction above $37,500 |
| `LITO_PHASE_OUT_1_END` | 45,000 | End of first phase-out tier |
| `LITO_MID_OFFSET` | 325 | Offset at exactly $45,000 |
| `LITO_PHASE_OUT_2_RATE` | 0.015 | 1.5c per $1 reduction above $45,000 |
| `LITO_ZERO_THRESHOLD` | 66,667 | No offset above this |

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_lito(taxable_income: float) -> float`

Three-branch calculation:
1. TI <= 37,500 → returns `LITO_MAX_OFFSET` (700)
2. TI <= 45,000 → returns `LITO_MAX_OFFSET - (TI - LITO_FULL_THRESHOLD) * LITO_PHASE_OUT_1_RATE`, floored at 0
3. TI <= 66,667 → returns `LITO_MID_OFFSET - (TI - LITO_PHASE_OUT_1_END) * LITO_PHASE_OUT_2_RATE`, floored at 0
4. TI > 66,667 → returns 0

### Service Integration

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `_apply_offsets(income_tax, profile) -> _OffsetResult`

- Called inside `build_tax_breakdown()` after raw income tax is calculated
- LITO is non-refundable: applied before franking, result floored at 0 before refundable offsets
- See [Offset Application Order](#offset-application-order) for full details

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestCalculateLito` (15 tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_zero_income` | TI = $0 | $700 |
| `test_tax_free_threshold` | TI = $18,200 | $700 |
| `test_at_full_threshold` | TI = $37,500 | $700 |
| `test_just_over_full_threshold` | TI = $37,501 | $699.95 |
| `test_midpoint_phase_out_1` | TI = $41,250 | $512.50 |
| `test_at_phase_out_1_end` | TI = $45,000 | $325.00 |
| `test_just_over_phase_out_1_end` | TI = $45,001 | $324.985 |
| `test_midpoint_phase_out_2` | TI = $55,000 | $175.00 |
| `test_just_under_zero_threshold` | TI = $66,666 | $0.01 |
| `test_at_zero_threshold` | TI = $66,667 | $0 |
| `test_above_zero_threshold` | TI = $66,668 | $0 |
| `test_high_income` | TI = $100,000 | $0 |
| `test_very_high_income` | TI = $500,000 | $0 |
| `test_monotonically_decreasing` | TI 0–80k in $1k steps | Never increases |
| `test_never_negative` | TI 0–200k in $5k steps | Always >= 0 |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestLitoInBreakdown` (8 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_lito_zero_above_threshold` | $100k | LITO = 0 |
| `test_lito_full_at_low_income` | $30k | LITO = 700 |
| `test_lito_reduces_income_tax` | $30k | IT = raw IT - 700 |
| `test_lito_phase_out_1` | $41,250 | LITO = 512.50 |
| `test_lito_phase_out_2` | $55,000 | LITO = 175 |
| `test_lito_cannot_make_income_tax_negative` | $19,000 | IT >= 0 |
| `test_lito_zero_income` | $0 | LITO = 700, IT = 0 |
| `test_lito_in_total_offsets` | $30k | total_offsets = lito + sapto + franking |

**API tests:**
**File:** `backend/app/tests/api/test_tax.py`

| Test | Scenario |
|---|---|
| `test_lito_applied_at_low_income` | $30k salary: LITO = 700, IT reduced |
| `test_lito_zero_at_high_income` | $100k salary: LITO = 0 |

### Last Verified

2026-03-29

---

## Seniors and Pensioners Tax Offset (SAPTO)

### Rule

A non-refundable tax offset for eligible taxpayers who have reached Age Pension age (67+). Cannot reduce income tax below zero. Requires explicit eligibility flag — the service layer checks `profile.sapto` before calling the engine function.

### ATO Schedule (Singles)

| Taxable Income | Offset |
|---|---|
| $0 – $33,532 | $2,230 |
| $33,533 – $51,372 | $2,230 minus 12.5 cents for every $1 above $33,532 |
| Above $51,372 | $0 |

### ATO Source

https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/seniors-and-pensioners-tax-offset

### Configuration

**File:** `backend/app/config/tax.py`

| Constant | Value | Description |
|---|---|---|
| `SAPTO_MAX_OFFSET` | 2,230 | Maximum offset for singles |
| `SAPTO_LOWER_THRESHOLD` | 33,532 | Full offset for TI at or below this |
| `SAPTO_PHASE_OUT_RATE` | 0.125 | 12.5c per $1 reduction above lower threshold |
| `SAPTO_ZERO_THRESHOLD` | 51,372 | No offset above this |

**Verification:** $2,230 / $0.125 = $17,840. $33,532 + $17,840 = $51,372. Checks out.

### Engine

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_sapto(taxable_income: float) -> float`

Two-branch calculation:
1. TI <= 33,532 → returns `SAPTO_MAX_OFFSET` (2,230)
2. TI <= 51,372 → returns `SAPTO_MAX_OFFSET - (TI - SAPTO_LOWER_THRESHOLD) * SAPTO_PHASE_OUT_RATE`, floored at 0
3. TI > 51,372 → returns 0

**Note:** The engine function does NOT check eligibility — it assumes the caller has already verified. The service layer gates the call with `if profile.sapto`.

### Service Integration

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `_apply_offsets(income_tax, profile) -> _OffsetResult`

```python
sapto_offset = calculate_sapto(profile.taxable_income) if profile.sapto else 0.0
```

- Only called when `profile.sapto` is True
- Non-refundable: applied alongside LITO before franking, result floored at 0
- See [Offset Application Order](#offset-application-order) for full details

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestCalculateSapto` (10+ tests)

| Test | Scenario | Expected |
|---|---|---|
| `test_zero_income` | TI = $0 | $2,230 |
| `test_at_lower_threshold` | TI = $33,532 | $2,230 |
| `test_just_over_lower_threshold` | TI = $33,533 | $2,229.875 |
| `test_midpoint_phase_out` | TI = $42,452 | $1,115 |
| `test_just_under_zero_threshold` | TI = $51,371 | $0.125 |
| `test_at_zero_threshold` | TI = $51,372 | $0 |
| `test_above_zero_threshold` | TI = $51,373 | $0 |
| `test_high_income` | TI = $100,000 | $0 |
| `test_monotonically_decreasing` | TI 0–70k in $1k steps | Never increases |
| `test_never_negative` | TI 0–200k in $5k steps | Always >= 0 |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestSaptoInBreakdown` (6 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_sapto_zero_when_not_eligible` | $30k, sapto=False | SAPTO = 0 |
| `test_sapto_full_when_eligible_low_income` | $30k, sapto=True | SAPTO = 2,230 |
| `test_sapto_phases_out` | $42,452, sapto=True | SAPTO ≈ 1,115 |
| `test_sapto_zero_above_threshold` | $60k, sapto=True | SAPTO = 0 |
| `test_sapto_plus_lito_cannot_go_negative` | $25k, sapto=True | IT = 0 (non-refundable floor) |
| `test_sapto_reduces_total_tax` | $40k, with/without | Total tax lower with SAPTO |

**API tests:**
**File:** `backend/app/tests/api/test_tax.py`

| Test | Scenario |
|---|---|
| `test_sapto_not_applied_by_default` | $30k salary, no sapto flag: SAPTO = 0 |
| `test_sapto_applied_when_eligible` | $30k salary, sapto=True: SAPTO = 2,230 |

### Last Verified

2026-03-29

---

## Franking Credit Offset

### Rule

Franking credits (imputation credits) represent company tax already paid on dividends. They are:
1. **Added to assessable income** (grossing up the dividend) — handled in `compute_income_measures()`
2. **Applied as a refundable tax offset** — can push income tax below zero, resulting in a refund

Unlike LITO and SAPTO, franking is **refundable** — the taxpayer receives the excess as a cash refund if the offset exceeds their tax liability.

### Configuration

No config constants — the raw value comes from `TaxInputs.franking` (user input).

### Engine

No engine function — the franking amount is used directly as an offset in the service layer.

### Service Integration

**File:** `backend/app/services/tax_breakdown.py`

**In `compute_income_measures()`:**
- Franking is added to assessable income: `assessable = salary + rental + ... + franking + ...`
- Franking value is passed through to `TaxProfile.franking`

**In `_apply_offsets()`:**
- Applied **after** non-refundable offsets (LITO, SAPTO) have been floored at 0
- Can push `income_tax_after_offsets` below zero (refund)
- See [Offset Application Order](#offset-application-order) for full details

### Test Coverage

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestFrankingInBreakdown` (6 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_franking_zero_by_default` | No franking | franking_offset = 0 |
| `test_franking_reduces_income_tax` | $100k + $2k franking | IT reduced by $2k |
| `test_franking_refund` | $20k + $5k franking | IT < 0 (refund) |
| `test_franking_refund_reduces_total_tax` | $20k + $5k franking | total_tax < 0 |
| `test_franking_refund_increases_net_income` | $20k + $5k franking | net_income > taxable_income |
| `test_franking_in_total_offsets` | $100k + $3k franking | total_offsets includes franking |

**API tests:**
**File:** `backend/app/tests/api/test_tax.py`

| Test | Scenario |
|---|---|
| `test_franking_offset_applied` | $100k + $3k franking: offset applied correctly |
| `test_franking_refund_via_api` | $20k + $5k franking: negative IT and total_tax |

### Last Verified

2026-03-29

---

## Offset Application Order

### Rule

Tax offsets are applied to income tax in a specific order. This is a **service-layer rule**, not an ATO-specified order, but it correctly implements the distinction between refundable and non-refundable offsets.

### Application Logic

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `_apply_offsets(income_tax: float, profile: TaxProfile) -> _OffsetResult`

```
1. Calculate raw offsets:
   - lito = calculate_lito(taxable_income)
   - sapto = calculate_sapto(taxable_income) if eligible, else 0
   - franking = profile.franking

2. Apply non-refundable offsets first (LITO + SAPTO):
   after_non_refundable = max(0, income_tax - lito - sapto)
   → Cannot reduce income tax below $0

3. Apply refundable offset (franking):
   income_tax_after_offsets = after_non_refundable - franking
   → CAN go below $0 (creates a refund)

4. Total offsets = lito + sapto + franking
   (This is the sum of raw offsets, not the effective amount applied)
```

### Why Order Matters

If franking were applied before the non-refundable floor, the taxpayer could lose LITO/SAPTO benefit. Example:
- Raw IT: $500, LITO: $700, Franking: $1,000
- **Correct (non-refundable first):** max(0, 500 - 700) = $0 → $0 - $1,000 = **-$1,000** refund
- **Wrong (all at once):** 500 - 700 - 1,000 = **-$1,200** refund (over-refunds LITO)

### Test Coverage

**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestCombinedOffsets` (6 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_lito_plus_franking` | $30k + $1k franking | Correct order: LITO first, then franking |
| `test_all_three_offsets` | $30k, SAPTO, $500 franking | All three applied, correct IT |
| `test_non_refundable_floor_then_refundable` | $19k, SAPTO, $1k franking | Floor at 0, then -$1k |
| `test_total_offsets_is_sum` | $40k, SAPTO, $2k franking | total_offsets = lito + sapto + franking |
| `test_total_tax_components_sum` | $40k, SAPTO, franking, HECS | total_tax = IT + ML + MLS + HECS |
| `test_net_income_with_offsets` | $30k, SAPTO, $1k franking | net_income = TI - total_tax |

### Last Verified

2026-03-29

---

## CGT Discount

### Rule

Capital gains on assets held for more than 12 months receive a 50% discount. Short-term gains (held less than 12 months) are included at 100%.

### Implementation

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `compute_income_measures()`

```python
net_capital_gain = inputs.capital_gain_short + (inputs.capital_gain_long * 0.5)
```

- `capital_gain_short`: included at full value (100%)
- `capital_gain_long`: included at 50% (CGT discount applied)
- The discounted gain is added to assessable income

### Configuration

No config constants — the 50% discount rate is hardcoded in the service layer.

**Note:** If the CGT discount rate changes (unlikely but possible), the `0.5` multiplier in `compute_income_measures()` must be updated.

### Test Coverage

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestComputeIncomeMeasures`

| Test | Scenario | Verifies |
|---|---|---|
| `test_short_term_cgt_full_gain` | $80k salary + $20k short CGT | Assessable = $100k |
| `test_long_term_cgt_50_percent_discount` | $80k salary + $40k long CGT | Assessable = $100k (40k × 0.5) |

**API tests:**
**File:** `backend/app/tests/api/test_tax.py`

| Test | Scenario |
|---|---|
| `test_short_term_cgt` | $80k + $20k short: assessable = $100k |
| `test_long_term_cgt_discount` | $80k + $40k long: assessable = $100k |

### Last Verified

2026-03-29

---

## Negative Gearing / Net Investment Loss

### Rule

When rental deductions exceed rental income, the net investment loss reduces taxable income but is **added back** for repayment income (HRI) and MLS income calculations. This is how negative gearing reduces income tax while not affecting HECS repayments or MLS liability.

### Implementation

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `compute_income_measures()`

```python
net_investment_loss = max(0.0, inputs.rental_deductions - inputs.rental)

repayment_income = (
    taxable_income
    + inputs.rfb
    + inputs.sal_sac
    + net_investment_loss  # <-- added back
)
```

- `net_investment_loss` = excess of rental deductions over rental income (floored at 0)
- Added back to repayment income so HECS/MLS are calculated on the higher figure
- Taxable income is NOT adjusted — the loss already reduced it via `assessable - total_deductions`

### Configuration

No config constants — this is an ATO rule about how income measures diverge.

### Test Coverage

**Service tests:**
**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestComputeIncomeMeasures`

| Test | Scenario | Verifies |
|---|---|---|
| `test_negative_gearing` | $80k salary + $20k rental − $40k deductions | TI = $60k, HRI = $80k, loss = $20k |
| `test_combined_divergence` | Salary + rental + deductions + sal_sac + rfb | All measures diverge correctly |

**Engine tests:**
**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestCalculateTaxSaving`

| Test | Scenario | Verifies |
|---|---|---|
| `test_loss_reduces_ti_but_not_ri_or_mlsi` | $120k base, -$30k loss | TI drops, RI/MLSI unchanged |

**API tests:**
**File:** `backend/app/tests/api/test_tax.py`

| Test | Scenario |
|---|---|
| `test_negative_gearing` | $80k + $20k rental − $40k deductions: TI $60k, HRI $80k |

### Last Verified

2026-03-29

---

## Income Measure Derivation

### Rule

The ATO uses three different income measures for different tax components:

| Measure | Used By | Derivation |
|---|---|---|
| **Taxable Income (TI)** | Income tax, Medicare levy | Assessable income − total deductions (floored at 0) |
| **Repayment Income (HRI)** | HECS repayments | TI + salary sacrifice + FBT + net investment loss |
| **MLS Income** | Medicare Levy Surcharge | Currently equals HRI (future-proofed for divergence) |

### Implementation

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `compute_income_measures(inputs: TaxInputs) -> TaxProfile`

```python
# Assessable income (all income sources)
assessable = salary + rental + interest + dividend + franking + net_capital_gain

# Deductions
total_deductions = rental_deductions + work_deductions

# Taxable income (floored at 0)
taxable_income = max(0.0, assessable - total_deductions)

# Net investment loss (for HRI add-back)
net_investment_loss = max(0.0, rental_deductions - rental)

# Repayment income (TI + add-backs)
repayment_income = taxable_income + rfb + sal_sac + net_investment_loss

# MLS income (currently equals HRI)
mls_income = repayment_income
```

### Key Behaviours

- **Taxable income floors at $0** — deductions cannot create negative taxable income
- **Franking credits are included in assessable income** — they gross up the dividend before deductions
- **Salary sacrifice and FBT increase HRI but not TI** — they don't appear in assessable income
- **Net investment loss is added back to HRI** — prevents negative gearing from reducing HECS/MLS liability
- **MLS income equals repayment income** — future-proofed for cases where they diverge

### Test Coverage

**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestComputeIncomeMeasures` (12 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_salary_only` | $100k salary | All measures equal |
| `test_negative_gearing` | Rental loss | TI < HRI, loss add-back |
| `test_salary_sacrifice_increases_hri` | With sal_sac | HRI increases, TI unchanged |
| `test_rfb_increases_hri` | With FBT | HRI increases, TI unchanged |
| `test_short_term_cgt_full_gain` | Short CGT | 100% included |
| `test_long_term_cgt_50_percent_discount` | Long CGT | 50% included |
| `test_franking_credits_in_assessable` | With franking | Added to assessable |
| `test_deductions_exceed_income` | Deductions > income | TI = 0 |
| `test_combined_divergence` | All inputs | Measures diverge correctly |
| `test_hecs_and_phi_passed_through` | HECS + PHI flags | Forwarded to profile |
| `test_rental_only` | No salary, rental only | Works correctly |

### Last Verified

2026-03-29

---

## Tax Saving (Investment Property)

### Rule

Calculates the tax saving (or additional tax) from holding an investment property. Uses a two-pass approach: compute total tax without the property, then with it, and take the difference.

**Key detail:** Rental losses reduce taxable income (income tax saving) but are **added back** for repayment income and MLS income (no HECS/MLS saving from negative gearing).

### Implementation

**File:** `backend/app/engine/tax.py`
**Function:** `calculate_tax_saving(tax_profile: TaxProfile, net_rental_income: float) -> float`

```python
# Pass 1: tax without property
tax_without = calculate_total_tax(tax_profile)

# Pass 2: tax with property
# TI adjusted by net rental income
# RI/MLSI: only profits added (losses NOT subtracted — max(loss, 0) = 0)
adjusted_profile = TaxProfile(
    taxable_income=tax_profile.taxable_income + net_rental_income,
    repayment_income=tax_profile.repayment_income + max(net_rental_income, 0),
    mls_income=tax_profile.mls_income + max(net_rental_income, 0),
    ...
)
tax_with = calculate_total_tax(adjusted_profile)

return tax_without - tax_with  # positive = saving
```

**Note:** This function uses `calculate_total_tax()` which does NOT include tax offsets (LITO, SAPTO, franking). The tax saving calculation reflects raw tax components only.

### Test Coverage

**File:** `backend/app/tests/engine/test_tax.py`
**Class:** `TestCalculateTaxSaving` (4 tests)

| Test | Scenario | Verifies |
|---|---|---|
| `test_negative_rental_income_gives_positive_saving` | -$20k loss | Saving > 0 |
| `test_positive_rental_income_gives_negative_saving` | +$10k profit | Saving < 0 (extra tax) |
| `test_zero_rental_income_gives_zero_saving` | $0 | Saving = 0 |
| `test_loss_reduces_ti_but_not_ri_or_mlsi` | -$30k loss | TI drops, RI/MLSI unchanged |

### Last Verified

2026-03-29

---

## Effective Tax Rate

### Rule

The effective tax rate represents total tax as a proportion of assessable income. This is a derived value, not an ATO-defined rate. Floored at 0% — when total tax is negative (due to franking refund), the rate shows 0%.

### Implementation

**File:** `backend/app/services/tax_breakdown.py`
**Function:** `build_tax_breakdown()`

```python
effective_rate = max(0.0, total_tax / profile.assessable_income) if profile.assessable_income > 0 else 0.0
```

### Test Coverage

**File:** `backend/app/tests/services/test_tax_breakdown.py`
**Class:** `TestBuildTaxBreakdown`

| Test | Scenario | Verifies |
|---|---|---|
| `test_effective_rate` | $100k | total_tax / 100k |
| `test_effective_rate_zero_income` | $0 | 0.0 |

### Last Verified

2026-03-29

---

## Division 40 — Plant & Equipment Depreciation

### Rule

Deduction for the decline in value of depreciating assets within a rental property (carpet, appliances, air conditioning, blinds, etc.). Two depreciation methods are available: prime cost (straight-line) and diminishing value (accelerated).

For second-hand residential properties purchased on or after 9 May 2017, only **new** assets installed by the owner are depreciable. Properties purchased before this date are grandfathered.

### ATO Schedule

**Prime cost method:**
`deduction = cost × (1 / effective_life) × (days_held / days_in_year)`

**Diminishing value method:**
`deduction = written_down_value × (2 / effective_life) × (days_held / days_in_year)`

Effective life is set by the ATO for each asset type (TR 2024/4).

### ATO Source

https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/depreciation-and-capital-expenses-and-டallowances

### Configuration

**File:** `backend/app/config/deductions.py`

| Constant | Value | Description |
|---|---|---|
| `DIV40_SECONDHAND_CUTOFF_DATE` | 2017-05-09 | Second-hand assets not depreciable for properties purchased on/after this date |

### Models

**File:** `backend/app/models/deductions.py`

**`DepreciationMethod`** enum:
- `DIMINISHING_VALUE` — accelerated (2/effective_life)
- `PRIME_COST` — straight-line (1/effective_life)

**`DepreciableAsset`** dataclass:
- `cost`: Original asset cost
- `effective_life_years`: ATO effective life in years
- `purchase_date`: Asset purchase/installation date
- `method`: Depreciation method enum
- `written_down_value`: Remaining book value (for diminishing value tracking)

### Engine

**File:** `backend/app/engine/deductions.py`

| Function | Description |
|---|---|
| `calculate_division_40_prime_cost(cost, effective_life_years, days_held, days_in_year)` | Straight-line depreciation, pro-rated for partial years |
| `calculate_division_40_diminishing_value(written_down_value, effective_life_years, days_held, days_in_year)` | Accelerated depreciation, higher early deductions, asymptotes to zero |
| `is_asset_depreciable(asset_purchase_date, property_purchase_date)` | Returns False for second-hand assets in post-2017 purchases |

**Validation:**
- `effective_life_years` must be >= 1
- `days_held` must be <= `days_in_year` (365 or 366)

### Service Integration

**File:** `backend/app/services/tax_deductions.py`
**Function:** `_calculate_plant_depreciation()`

- Iterates all `DepreciableAsset` entries for the property
- Checks eligibility via `is_asset_depreciable()`
- Calculates expiry: `asset_purchase_date + effective_life_years`
- Pro-rates deductions based on days held within the financial year
- Supports both depreciation methods per asset
- Result included in `PropertyTaxDeductionSummary.depreciation_plant`

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_deductions.py`

| Class | Tests | Covers |
|---|---|---|
| `TestDivision40PrimeCostFullYear` | Full-year prime cost calculations | Standard scenarios |
| `TestDivision40PrimeCostProRata` | Partial-year pro-ration | Mid-year purchases |
| `TestDivision40PrimeCostConsistency` | Behaviour verification | Consistent annual amounts |
| `TestDivision40DiminishingValueFullYear` | Full-year diminishing value | Standard scenarios |
| `TestDivision40DiminishingValueProRata` | Partial-year pro-ration | Mid-year purchases |
| `TestDivision40DiminishingValueConsistency` | Behaviour verification | Deductions decrease over time, asymptotic to zero |
| `TestDivision40Validation` | Input validation | Both methods reject invalid inputs |
| `TestDivision40ZeroAndEdgeCases` | Edge cases | Zero cost, zero days, etc. |
| `TestIsAssetDepreciable` | Second-hand asset eligibility | Pre/post 2017 cutoff |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_deductions.py`
**Class:** `TestDiv40InService` — Integration tests for Div 40 within the deduction summary.

### Last Verified

2026-03-29

---

## Division 43 — Capital Works Deductions

### Rule

Deduction for the construction cost of the building structure (not land). A flat 2.5% per year for residential buildings constructed on or after 16 September 1987. Deductions continue for 40 years from the date of purchase.

**Important:** Division 43 deductions reduce the CGT cost base on disposal.

### ATO Schedule

`deduction = construction_cost × 0.025 × (days_held / days_in_year)`

- Rate: 2.5% per year (straight-line)
- Duration: 40 years from purchase
- Pro-rated for partial years

### ATO Source

https://www.ato.gov.au/businesses-and-organisations/income-deductions-and-concessions/depreciation-and-capital-expenses-and-allowances/capital-works-deductions

### Configuration

**File:** `backend/app/config/deductions.py`

| Constant | Value | Description |
|---|---|---|
| `DIV43_CONSTRUCTION_CUTOFF_DATE` | 1987-09-16 | Buildings must be constructed on/after this date |

### Models

**File:** `backend/app/models/deductions.py`

**`DepreciableBuilding`** dataclass:
- `name`: Description of building/construction
- `construction_cost`: Original cost of constructing the building
- `purchase_date`: Date building was purchased by current owner
- `construction_start_date`: Date construction commenced (for eligibility)

### Engine

**File:** `backend/app/engine/deductions.py`

| Function | Description |
|---|---|
| `calculate_division_43_deduction(construction_cost, days_held, days_in_year)` | 2.5% straight-line, pro-rated for partial years |
| `is_building_depreciable(construction_start_date)` | Returns False for buildings constructed before 16/09/1987 |

**Validation:**
- `days_held` must be <= `days_in_year` (365 or 366)

### Service Integration

**File:** `backend/app/services/tax_deductions.py`
**Function:** `_calculate_building_depreciation()`

- Iterates all `DepreciableBuilding` entries
- Checks eligibility via `is_building_depreciable()`
- Calculates expiry: `purchase_date + 40 years`
- Pro-rates deductions based on days held within the financial year
- Result included in `PropertyTaxDeductionSummary.depreciation_building`

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_deductions.py`

| Class | Tests | Covers |
|---|---|---|
| `TestDivision43FullYear` | Full-year calculations | Standard 2.5% |
| `TestDivision43ProRata` | Partial-year pro-ration | Mid-year purchases |
| `TestDivision43DaysValidation` | Days validation | days_held <= days_in_year |
| `TestDivision43ZeroAndEdgeCases` | Edge cases | Zero cost, zero days |
| `TestDivision43Consistency` | Linear scaling and consistency | Proportional to cost and days |
| `TestIsBuildingDepreciable` | Construction date eligibility | Pre/post 1987 cutoff |

**Service tests:**
**File:** `backend/app/tests/services/test_tax_deductions.py`
**Class:** `TestDiv43InService` — Integration tests for Div 43 within the deduction summary.

### Last Verified

2026-03-29

---

## Borrowing Cost Deductions

### Rule

Costs of establishing a loan for an investment property are tax-deductible but must be spread over 5 years or the loan term, whichever is shorter. If total borrowing costs are $100 or less, they can be claimed in full in the first year.

### ATO Schedule

| Total Borrowing Costs | Deduction |
|---|---|
| ≤ $100 | Full amount in year 0 only |
| > $100 | `total / min(5, loan_term_years)` per year |

Deductible costs include: LMI, mortgage registration fee, loan establishment fee.

### ATO Source

https://www.ato.gov.au/individuals-and-families/investments-and-assets/rental-properties/rental-expenses-you-can-claim/borrowing-expenses

### Configuration

No config constants — the $100 threshold and 5-year spread rule are hardcoded in the engine function.

### Models

**File:** `backend/app/models/loan.py`

**`BorrowingCosts`** dataclass:
- `lmi`: Lenders Mortgage Insurance
- `mortgage_registration_fee`: Registration fee
- `loan_establishment_fee`: Loan establishment/application fee
- `capitalise_*` flags: Whether each cost is added to loan principal
- Properties: `total_capitalised`, `total_upfront`, `total`

### Engine

**File:** `backend/app/engine/deductions.py`
**Function:** `calculate_borrowing_cost_deduction(total_borrowing_costs, loan_term_years, year)`

- **Year 0 special case:** If total <= $100, fully deductible in year 0 only
- **Standard case:** Spread evenly over `min(5, loan_term_years)` years
- Returns 0 for years beyond the spread period
- The `year` parameter is zero-indexed

### Service Integration

**File:** `backend/app/services/tax_deductions.py`
**Function:** `build_tax_deduction_summary()`

- Calls `calculate_borrowing_cost_deduction()` with the property's borrowing costs total
- Included in the `PropertyTaxDeductionSummary.borrowing_costs_deduction` field

### Test Coverage

**Engine tests:**
**File:** `backend/app/tests/engine/test_deductions.py`

| Class | Tests | Covers |
|---|---|---|
| `TestBorrowingCostDeductionSmall` | Costs ≤ $100 | Full deduction year 0, $0 after |
| `TestBorrowingCostDeduction5Year` | Standard 5-year spread | Equal annual deductions, $0 after year 4 |
| `TestBorrowingCostDeductionShortLoan` | Loan term < 5 years | Spread over loan term instead |
| `TestBorrowingCostDeductionEdgeCases` | Edge cases | Zero costs, zero loan term |
| `TestBorrowingCostDeductionBoundary` | Boundary at $100 | $100 exact vs $101 |

### Last Verified

2026-03-29
