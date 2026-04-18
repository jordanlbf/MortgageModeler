# Australian Stamp Duty Rules — Implementation Reference

Verified: **April 2026**

This document tracks every stamp duty bracket table, concession rate, and special calculation implemented in the codebase. Use this when state governments update rates or when adding new states.

---

## Architecture

```
config/stamp_duty/
  _types.py        — StampDutyBracket, StampDutySchedule dataclasses
  qld.py           — QLD brackets (general + PPOR)
  nsw.py           — NSW brackets (CPI-indexed)
  vic.py           — VIC brackets (general + PPOR) + PPOR cap
  wa.py            — WA brackets
  sa.py            — SA brackets
  tas.py           — TAS brackets
  act.py           — ACT brackets (general + owner-occupier)
  nt.py            — NT formula constants + flat rates
  registry.py      — state lookup (excludes NT)

engine/stamp_duty.py — calculate_stamp_duty(), concession functions
```

### How duty is calculated

1. Look up `StampDutySchedule` for the state (NT uses formula instead)
2. Pick general or PPOR brackets based on `is_ppor`
3. Walk brackets: for each, compute `base_amount + rate * excess`
4. If `round_to_100=True`: round excess up to next $100 before applying rate
5. If `flat_rate=True`: return `rate * total_price` (VIC $960k-$2M, ACT premium)

---

## Quick Reference

| State | Brackets | PPOR | Rounding | Top Rate | Config | Verified |
|---|---|---|---|---|---|---|
| QLD | 5 | Yes | per $100 | 5.75% | `qld.py` | 2026-04-01 |
| NSW | 7 | No | per $100 | 7.00% | `nsw.py` | 2026-04-01 |
| VIC | 5 | Yes (≤$550k) | percentage | 6.50% | `vic.py` | 2026-04-01 |
| WA | 5 | No | per $100 | 5.15% | `wa.py` | 2026-04-01 |
| SA | 9 | No | per $100 | 5.50% | `sa.py` | 2026-04-01 |
| TAS | 7 | No | per $100 | 4.50% | `tas.py` | 2026-04-01 |
| ACT | 7 | Yes | per $100 | 4.54% flat | `act.py` | 2026-04-01 |
| NT | formula | No | N/A | 5.95% flat | `nt.py` | 2026-04-01 |

---

## State Details

### QLD

**Source:** QRO — qro.qld.gov.au/duties/transfer-duty/calculate

**General brackets:**

| Threshold | Rate | Base |
|---|---|---|
| $5,000 | 0% | $0 |
| $75,000 | 1.5% | $0 |
| $540,000 | 3.5% | $1,050 |
| $1,000,000 | 4.5% | $17,325 |
| ∞ | 5.75% | $38,025 |

**PPOR (home concession) brackets:**

| Threshold | Rate | Base |
|---|---|---|
| $350,000 | 1.0% | $0 |
| $540,000 | 3.5% | $3,500 |
| $1,000,000 | 4.5% | $10,150 |
| ∞ | 5.75% | $30,850 |

**Reference values:** $500k general = $15,925. $500k PPOR = $8,750.

### NSW

**Source:** Revenue NSW — Duties Act 1997, Section 32 (CPI-indexed via Section 33AF)

**2025-26 indexed brackets:**

| Threshold | Rate | Base |
|---|---|---|
| $17,000 | 1.25% | $0 |
| $37,000 | 1.5% | $212 |
| $99,000 | 1.75% | $512 |
| $372,000 | 3.5% | $1,597 |
| $1,240,000 | 4.5% | $11,152 |
| $3,721,000 | 5.5% | $50,212 |
| ∞ | 7.0% | $186,667 |

No PPOR concession schedule. Single rate for all buyers.

**Note:** Thresholds indexed annually. Must be updated each July.

**Reference values:** $500k = $16,912. $1M = $39,412.

### VIC

**Source:** SRO Victoria — effective 1 July 2021

**General brackets:**

| Threshold | Rate | Base | Note |
|---|---|---|---|
| $25,000 | 1.4% | $0 | |
| $130,000 | 2.4% | $350 | |
| $960,000 | 6.0% | $2,870 | |
| $2,000,000 | 5.5% | N/A | **Flat rate on total value** |
| ∞ | 6.5% | $110,000 | |

**PPOR brackets (up to $550,000 only):**

| Threshold | Rate | Base |
|---|---|---|
| $25,000 | 1.4% | $0 |
| $130,000 | 2.4% | $350 |
| $440,000 | 5.0% | $2,870 |
| $550,000 | 6.0% | $18,370 |

Above $550,000: general brackets apply. `VIC_PPOR_CAP = 550_000` in config.

**$960k-$2M quirk:** Flat 5.5% on entire value, not marginal. Creates discontinuity at $960k/$960,001.

**Reference values:** $500k general = $25,070. $500k PPOR = $21,970. $1M = $55,000.

### WA

**Source:** wa.gov.au — Duties Act 2008, Schedule 2

**Single rate table:**

| Threshold | Rate | Base |
|---|---|---|
| $120,000 | 1.9% | $0 |
| $150,000 | 2.85% | $2,280 |
| $360,000 | 3.8% | $3,135 |
| $725,000 | 4.75% | $11,115 |
| ∞ | 5.15% | $28,453 |

No PPOR concession schedule.

**Reference values:** $500k = $17,765.

### SA

**Source:** RevenueSA — Stamp Duties Act 1923, Schedule 2

**Single rate table (9 brackets):**

| Threshold | Rate | Base |
|---|---|---|
| $12,000 | 1.0% | $0 |
| $30,000 | 2.0% | $120 |
| $50,000 | 3.0% | $480 |
| $100,000 | 3.5% | $1,080 |
| $200,000 | 4.0% | $2,830 |
| $250,000 | 4.25% | $6,830 |
| $300,000 | 4.75% | $8,955 |
| $500,000 | 5.0% | $11,330 |
| ∞ | 5.5% | $21,330 |

No PPOR concession schedule.

**Reference values:** $500k = $21,330. $750k = $35,080.

### TAS

**Source:** SRO Tasmania — Duties Act 2001. Unchanged since 21 October 2013.

**Single rate table:**

| Threshold | Rate | Base | Note |
|---|---|---|---|
| $3,000 | 0% | $50 | Flat $50 minimum |
| $25,000 | 1.75% | $50 | |
| $75,000 | 2.25% | $435 | |
| $200,000 | 3.5% | $1,560 | |
| $375,000 | 4.0% | $5,935 | |
| $725,000 | 4.25% | $12,935 | |
| ∞ | 4.5% | $27,810 | |

No PPOR concession schedule.

**Reference values:** $500k = $18,247.50.

### ACT

**Source:** ACT Revenue Office — DI2025-145

**General brackets:**

| Threshold | Rate | Base | Note |
|---|---|---|---|
| $200,000 | 1.2% | $0 | |
| $300,000 | 2.4% | $2,400 | |
| $500,000 | 3.3% | $4,800 | |
| $750,000 | 4.32% | $11,400 | |
| $1,000,000 | 4.15% | $22,200 | |
| $1,455,000 | 7.35% | $32,575 | |
| ∞ | 4.54% | N/A | **Flat rate on total value** |

**Owner-occupier brackets:**

| Threshold | Rate | Base |
|---|---|---|
| $260,000 | 0.28% | $0 |
| $300,000 | 2.2% | $728 |
| $500,000 | 3.4% | $1,608 |
| $750,000 | 4.32% | $8,408 |
| $1,000,000 | 5.9% | $19,208 |
| $1,455,000 | 6.4% | $33,958 |

Above $1,455,000: flat 4.54% (owner-occ gets $35,238 deduction, handled separately).

**ACT quirk:** Owner-occupier rate exceeds general in the $750k-$1M bracket (5.9% vs 4.15%).

**Reference values:** $500k general = $11,400. $500k PPOR = $8,408.

### NT

**Source:** NT Treasury — Stamp Duty Act 1978

**Formula (≤$525,000):**

```
D = (0.06571441 × V²) + 15V
where V = price / 1000
```

**Flat rates (>$525,000) — applied to entire value:**

| Threshold | Rate |
|---|---|
| $3,000,000 | 4.95% |
| $5,000,000 | 5.75% |
| ∞ | 5.95% |

No PPOR rate schedule. NT offers a Principal Place of Residence Rebate (PPRR) of up to $7,000, handled separately.

**Reference values:** $500k = $23,928.60. $750k = $37,125.

---

## Test Coverage

**File:** `backend/app/tests/engine/test_stamp_duty.py` — 112 tests

| State | Tests | Coverage |
|---|---|---|
| QLD general | 12 | Zero, every boundary, mid-bracket, rounding, large, $1 |
| QLD PPOR | 7 | Every boundary, PPOR ≤ general invariant |
| QLD rounding | 3 | Exact $100, one cent over, fractional |
| NSW | 8 | Zero, boundaries, 500k/750k/1M, PPOR=general, premium |
| VIC general | 12 | Every bracket, flat bracket discontinuity, above $2M |
| VIC PPOR | 8 | Every bracket, $550k cap, saving calculation |
| WA | 7 | Zero, boundary, 500k/750k/1M, PPOR=general |
| SA | 8 | Zero, boundary, 200k/500k/750k/1M, PPOR=general |
| TAS | 10 | Zero, $50 minimum, boundary, 200k/500k/750k/1M |
| ACT general | 8 | Zero, boundary, 500k/750k/1M, flat rate |
| ACT PPOR | 7 | Boundary, 500k/750k/1M, crossover quirk |
| NT formula | 6 | Zero, 100k/250k/500k, threshold, small |
| NT flat | 8 | Threshold boundary, tier transitions, PPOR=general |
| Edge cases | 6 | Unknown state, negative, $1 all states, positivity checks |

---

## How to Update Rates

1. Check the relevant state revenue office website for updated rates
2. Edit the state file in `config/stamp_duty/`
3. Update this document with new thresholds/rates
4. Update reference values if they change
5. Run `pytest app/tests/engine/test_stamp_duty.py` — update expected values
6. For NSW: check Section 33AF gazette notice each July for CPI-indexed thresholds
