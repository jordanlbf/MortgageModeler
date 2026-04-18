# Australian Government Grants & Concessions — Implementation Reference

Verified: **March 2026**

This document tracks every home buyer grant, concession, and guarantee scheme implemented in the codebase. It covers where each scheme is defined, what eligibility rules apply, official sources, and known limitations. Use this when government thresholds change or new schemes are announced.

---

## Architecture

```
config/grants/
  _types.py        — GrantScheme, EligibilityPredicates, SchemeMeta dataclasses
  federal.py       — 4 federal schemes
  qld.py           — 7 QLD schemes
  nsw.py           — 3 NSW schemes
  vic.py           — 3 VIC schemes
  wa.py            — 5 WA schemes
  sa.py            — 3 SA schemes
  tas.py           — 4 TAS schemes
  act.py           — 1 ACT scheme
  nt.py            — 3 NT schemes
  registry.py      — lookup table, query helpers

models/grants.py   — domain types (GrantsInputs, EligibilityResult, SchemeEligibility)
schemas/grants.py  — Pydantic request/response (API contract)
services/grants.py — eligibility engine (predicate matching)
routers/grants.py  — GET /api/grants/schemes, POST /api/grants/eligibility
```

### How eligibility works

Each scheme has an `EligibilityPredicates` dataclass with declarative rules. The service iterates predicates against user inputs:

- `None` predicates are skipped (scheme has no requirement)
- User inputs of `"any"` or `""` are skipped (user hasn't specified)
- Each failing predicate appends a reason string
- Eligible = zero reasons

No per-scheme code exists. Adding a scheme is purely a config change.

### API endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/grants/schemes` | Full catalogue of all 33 schemes, no eligibility checking |
| POST | `/api/grants/eligibility` | Evaluate eligibility for selected states against user inputs |

### Request shape (POST /eligibility)

```json
{
  "states": ["Federal", "QLD"],
  "price": 600000,
  "income": 80000,
  "partner_income": 0,
  "property_type": "new",
  "buyer_type": "individual",
  "first_home_buyer": "yes",
  "owner_occupier": "yes",
  "off_the_plan": false
}
```

---

## Quick Reference

| ID | Scheme | Jurisdiction | Category | Config | Verified |
|---|---|---|---|---|---|
| `fhbg` | First Home Guarantee | Federal | guarantee | `federal.py` | 2026-03-30 |
| `fhg` | Family Home Guarantee | Federal | guarantee | `federal.py` | 2026-03-30 |
| `help-to-buy` | Help to Buy | Federal | equity | `federal.py` | 2026-03-30 |
| `fhss` | First Home Super Saver | Federal | super | `federal.py` | 2026-03-30 |
| `fhog-nsw` | First Home Owner Grant | NSW | grant | `nsw.py` | 2026-03-30 |
| `fhb-stamp-nsw` | FHB Stamp Duty Exemption | NSW | concession | `nsw.py` | 2026-03-30 |
| `fhb-land-nsw` | FHB Vacant Land Exemption | NSW | concession | `nsw.py` | 2026-03-30 |
| `fhog-vic` | First Home Owner Grant | VIC | grant | `vic.py` | 2026-03-30 |
| `fhb-stamp-vic` | FHB Duty Exemption | VIC | concession | `vic.py` | 2026-03-30 |
| `otp-vic` | Off-the-Plan Concession | VIC | concession | `vic.py` | 2026-03-30 |
| `fhog-qld` | First Home Owner Grant | QLD | grant | `qld.py` | 2026-03-30 |
| `fhb-stamp-existing-qld` | FHB Concession (Existing) | QLD | concession | `qld.py` | 2026-03-30 |
| `fhb-stamp-new-qld` | FHB Concession (New Homes) | QLD | concession | `qld.py` | 2026-03-30 |
| `fhb-land-qld` | FHB Vacant Land Concession | QLD | concession | `qld.py` | 2026-03-30 |
| `home-concession-qld` | Home Concession (General) | QLD | concession | `qld.py` | 2026-03-30 |
| `boost-to-buy-qld` | Boost to Buy | QLD | equity | `qld.py` | 2026-03-30 |
| `otp-qld` | Off-the-Plan Concession | QLD | concession | `qld.py` | 2026-03-30 |
| `fhog-wa` | First Home Owner Grant | WA | grant | `wa.py` | 2026-03-30 |
| `fhb-stamp-wa` | FHB Duty Exemption | WA | concession | `wa.py` | 2026-03-30 |
| `fhb-land-wa` | FHB Vacant Land Exemption | WA | concession | `wa.py` | 2026-03-30 |
| `otp-wa` | Off-the-Plan Concession | WA | concession | `wa.py` | 2026-03-30 |
| `keystart-wa` | Keystart Home Loans | WA | guarantee | `wa.py` | 2026-03-30 |
| `fhog-sa` | First Home Owner Grant | SA | grant | `sa.py` | 2026-03-30 |
| `fhb-stamp-sa` | FHB Stamp Duty Exemption | SA | concession | `sa.py` | 2026-03-30 |
| `homestart-sa` | HomeStart Shared Equity | SA | equity | `sa.py` | 2026-03-30 |
| `fhog-tas` | First Home Owner Grant | TAS | grant | `tas.py` | 2026-03-30 |
| `fhb-stamp-tas` | FHB Duty Exemption | TAS | concession | `tas.py` | 2026-03-30 |
| `myhome-tas` | MyHome Shared Equity | TAS | equity | `tas.py` | 2026-03-30 |
| `otp-tas` | Off-the-Plan Concession | TAS | concession | `tas.py` | 2026-03-30 |
| `hbcs-act` | Home Buyer Concession Scheme | ACT | concession | `act.py` | 2026-03-30 |
| `fhog-new-nt` | HomeGrown Territory (New) | NT | grant | `nt.py` | 2026-03-30 |
| `fhog-established-nt` | HomeGrown Territory (Established) | NT | grant | `nt.py` | 2026-03-30 |
| `freshstart-nt` | FreshStart New Home Grant | NT | grant | `nt.py` | 2026-03-30 |

---

## Federal Schemes

### First Home Guarantee (FHBG)

- **Source:** [Housing Australia](https://www.housingaustralia.gov.au/support-buy-home/first-home-guarantee)
- **Config:** `config/grants/federal.py` → `FHBG`
- **Category:** guarantee
- **Key rules:** 5% deposit, no LMI, unlimited places (from Oct 2025), income caps removed, property price caps raised by region (not removed)
- **Predicates:** `citizen_required=True`, `first_home_buyer=True`, `owner_occupier=True`
- **Known limitation:** Regional price caps (e.g. Sydney $1.5M, Brisbane $1M) not modelled — single `max_price` cannot express regional variation. Disclaimer in rules text.

### Family Home Guarantee (FHG)

- **Source:** [Housing Australia](https://www.housingaustralia.gov.au/support-buy-home/family-home-guarantee)
- **Config:** `config/grants/federal.py` → `FHG`
- **Category:** guarantee
- **Key rules:** 2% deposit, no LMI, single parent/guardian only, individual application, not restricted to first home buyers
- **Predicates:** `citizen_required=True`, `owner_occupier=True`, `individual_only=True`
- **Known limitation:** Single parent status not verifiable by the tool — disclaimer in eligibility text.

### Help to Buy

- **Source:** [Housing Australia](https://www.housingaustralia.gov.au/home-guarantee-scheme/help-buy-scheme)
- **Config:** `config/grants/federal.py` → `HELP_TO_BUY`
- **Category:** equity
- **Key rules:** Up to 40% new / 30% existing, 2% deposit, income caps $100k single / $160k couple, 10,000 places/year
- **Predicates:** `citizen_required=True`, `owner_occupier=True`, `max_income_single=100_000`, `max_income_couple=160_000`
- **Launched:** 5 December 2025

### First Home Super Saver (FHSS)

- **Source:** [ATO](https://www.ato.gov.au/individuals-and-families/super-for-individuals-and-families/super/withdrawing-and-using-your-super/early-access-to-super/first-home-super-saver-scheme)
- **Config:** `config/grants/federal.py` → `FHSS`
- **Category:** super
- **Key rules:** Withdraw up to $50k voluntary contributions, $15k/FY limit, determination before settlement (changed Sep 2024), 12-month contract deadline with automatic 12-month extension
- **Predicates:** `citizen_required=True`, `first_home_buyer=True`

---

## State Schemes — Key Thresholds

### NSW

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $10,000 | New homes ≤$600k (or $750k house-and-land) |
| Stamp duty exemption | Full up to $800k | Concession $800k–$1M |
| Vacant land | Full up to $350k | Concession $350k–$450k |

- **Source:** [Revenue NSW](https://www.revenue.nsw.gov.au)
- **Residence:** 12 continuous months
- **Note:** NSW off-the-plan is a deferral mechanism, not a duty reduction — not modelled as a scheme

### VIC

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $10,000 | New homes ≤$750k |
| Stamp duty exemption | Full up to $600k | Concession $600k–$750k |
| Off-the-plan | No cap | Post-contract construction costs excluded, contracts 21 Oct 2024 – 20 Oct 2026 |

- **Source:** [SRO Victoria](https://www.sro.vic.gov.au)
- **Residence:** 12 continuous months
- **Note:** Victorian Homebuyer Fund (shared equity) closed 2025-26, replaced by federal Help to Buy

### QLD

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $30,000 | New homes <$750k, until 30 Jun 2026 (reverts to $15k) |
| Stamp duty (existing) | Full up to $700k | Concession $700k–$800k |
| Stamp duty (new) | Full, no cap | From 1 May 2025 |
| Vacant land | Full, no cap | From 1 May 2025 |
| Home concession | 1% on first $350k | All owner-occupiers, not FHB-restricted |
| Boost to Buy | Up to 30% equity | $1M cap, income $150k/$225k |
| Off-the-plan | Reduced duty | Extended to 21 Oct 2026 |

- **Source:** [QRO](https://qro.qld.gov.au)
- **Residence (FHOG):** Move in within 1 year, live there 6 continuous months
- **Note:** QLD duty concessions do NOT require citizenship/PR

### WA

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $10,000 | New homes ≤$750k ($1M north of 26th parallel) |
| Stamp duty exemption | Full up to $500k | Concession to $700k–$750k by region |
| Vacant land | Full up to $350k | Concession $350k–$450k |
| Off-the-plan | Up to 100% waiver | Pre-construction/under-construction, until 30 Jun 2026 |
| Keystart | 2% deposit, no LMI | $148k/$218k income, $800k property cap |

- **Source:** [wa.gov.au](https://www.wa.gov.au)
- **Known limitation:** Keystart Kimberley/Pilbara has higher income limits not modelled

### SA

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $15,000 | New homes, no price cap (removed Jun 2024) |
| Stamp duty exemption | Full, no cap | New homes and vacant land only — zero relief for established |
| HomeStart shared equity | Up to 25% | $675k cap, $110k after-tax income |

- **Source:** [RevenueSA](https://www.revenuesa.sa.gov.au)
- **Note:** SA stamp duty predicate does not distinguish new homes from vacant land — both pass. Established homes excluded by display text only.

### TAS

| Scheme | Threshold | Details |
|---|---|---|
| FHOG | $30,000 | New homes, no cap, 1 Jul 2025 – 30 Jun 2026 |
| Stamp duty exemption | Full up to $750k | Established homes, hard cutoff (no taper), 18 Feb 2024 – 30 Jun 2026 |
| MyHome shared equity | Up to 40% / $300k | $800k construction cap, $117k/$134k income |
| Off-the-plan | 50% duty discount | Strata ≤$750k, until 30 Jun 2026 |

- **Source:** [SRO Tasmania](https://www.sro.tas.gov.au), [Homes Tasmania](https://www.homestasmania.com.au)

### ACT

| Scheme | Threshold | Details |
|---|---|---|
| Home Buyer Concession | Full up to $1,020k | Concession to $1,455k, income $250k + $4,600/child |

- **Source:** [ACT Revenue Office](https://www.revenue.act.gov.au)
- **Note:** ACT FHOG abolished 1 July 2019. HBCS is not FHB-restricted — requires not having owned property in last 2 years.
- **Known limitation:** Ownership lookback (2 years) cannot be expressed as a simple `first_home_buyer` bool. Dependent child income uplift ($4,600/child) not modelled — disclaimer in rules.

### NT

| Scheme | Threshold | Details |
|---|---|---|
| HomeGrown (new) | $50,000 | New homes, no cap, contracts to 30 Sep 2027 |
| HomeGrown (established) | $10,000 | Established homes, no cap |
| FreshStart | $30,000 | Existing homeowners buying new, contracts to 30 Sep 2027 |

- **Source:** [NT Treasury](https://treasury.nt.gov.au), [nt.gov.au](https://nt.gov.au)
- **Known limitation:** NT official sources are internally inconsistent on grant end dates. Some pages show Sep 2027, others Sep 2026. The established-home grant may have a shorter window. Dates should be re-verified before production.
- **Note:** Territory Home Owner Discount (THOD) appears obsolete, superseded by HomeGrown Territory. Not included.

---

## Known Limitations

These must be resolved before shipping to production. See `project_grants_model_limitations.md` in memory for full details.

| # | Limitation | Impact | Workaround |
|---|---|---|---|
| 1 | **ACT ownership test** — rule is "not owned in 2 years", not a simple FHB bool | False positives for recent owners | Disclaimer in eligibility text |
| 2 | **Regional price caps** — FHBG and WA FHOG vary by region | Cannot reject on region-specific caps | Disclaimer in rules text |
| 3 | **SA stamp duty scope** — covers new + vacant land but not established | May show eligible when property type is unset | Display text clarifies "new homes and vacant land only" |
| 4 | **NT date instability** — official sources contradict each other | Grant end dates may be wrong | Comment in config, disclaimer in rules |
| 5 | **Keystart regional variation** — Kimberley/Pilbara higher limits | May reject eligible regional buyers | Disclaimer in rules text |
| 6 | **NSW vacant land timing** — build/occupy rules more complex than modelled | Display text is simplified | Rules text says "check Revenue NSW" |
| 7 | **FHG single parent status** — not verifiable by the tool | May show eligible for non-single-parents | Disclaimer in eligibility text |

---

## Closed / Not Included

| Scheme | Jurisdiction | Reason |
|---|---|---|
| Regional First Home Buyer Guarantee | Federal | Merged into FHBG from Oct 2025 |
| First Home Buyer Choice | NSW | Abolished 1 Jul 2023 |
| NSW Shared Equity | NSW | Closed 30 Sep 2024 |
| Victorian Homebuyer Fund | VIC | Closed 2025-26, replaced by Help to Buy |
| Territory Home Owner Discount | NT | Appears obsolete, superseded by HomeGrown |
| HomeBuilder | Federal | Closed Apr 2021 |

---

## Test Coverage

**Service tests:** `backend/app/tests/services/test_grants.py`
- 26 predicate unit tests (every predicate type: FHB, owner-occ, price, income, property type, individual only, OTP)
- 13 integration tests with real config data (known scheme scenarios)
- 4 registry sanity checks (unique IDs, count, lookups)

**API tests:** `backend/app/tests/api/test_grants.py`
- 6 catalogue endpoint tests (shape, fields, federal/state split)
- 15 eligibility endpoint tests (filtering, correctness, sorting, validation)
- 3 validation tests (422 on bad input)

**Total:** 68 tests, all passing.

---

## How to Add a New Scheme

1. Open the relevant state file (e.g. `config/grants/qld.py`) or create a new one
2. Add a `GrantScheme(...)` instance with all display fields and predicates
3. Append it to the state's `*_SCHEMES` list
4. If it's a new state file, import it in `registry.py` and add to `_STATE_SCHEMES`
5. Run `python -m pytest app/tests/services/test_grants.py` — the `test_total_scheme_count` test will fail; update the expected count
6. No frontend changes needed — the API serves new schemes automatically

### How to Update Thresholds

1. Edit the relevant `GrantScheme` in the config file
2. Update `predicates` if eligibility rules changed
3. Update display text (`benefits`, `eligibility`, `rules`, `details`)
4. Update the `Verified` date in this document
5. Run the full test suite to catch regressions
