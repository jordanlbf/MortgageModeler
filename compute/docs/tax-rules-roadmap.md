# Australian Tax Rules — Not Yet Implemented

Rules relevant to personal income tax, property investment, and home ownership that are **not yet covered** in the codebase. Organised by priority and relevance to MortgageModeler's scope.

---

## Quick Reference

| Category | Rule | Relevance | Complexity |
|---|---|---|---|
| [Capital Gains Tax](#cgt-main-residence-exemption) | Main residence exemption | High — core to PPOR vs rent | Low |
| [Capital Gains Tax](#cgt-6-year-absence-rule) | 6-year absence rule | Medium — PPOR converted to rental | Medium |
| [Capital Gains Tax](#cgt-cost-base) | Cost base calculation | High — affects CGT on sale | Medium |
| [Capital Gains Tax](#partial-main-residence-exemption) | Partial exemption | Medium — income-producing PPOR | Medium |
| [Medicare](#medicare-levy-reduction-families) | Medicare levy reduction (families) | Low — single focus currently | Medium |
| [Medicare](#medicare-levy-surcharge-family-thresholds) | MLS family thresholds | Low — single focus currently | Low |
| [Superannuation](#division-293-tax) | Division 293 (high earner super tax) | Medium — affects high earners | Low |
| [Superannuation](#concessional-contributions-cap) | Concessional contributions cap | Medium — interacts with sal sac | Low |
| [Rental Deductions](#repairs-vs-improvements) | Repairs vs capital improvements | Medium — affects deductibility | Low |
| [Rental Deductions](#prepaid-expenses) | Prepaid expenses | Low | Low |
| [Offsets](#low-income-superannuation-tax-offset) | LISTO | Low — super-specific | Low |
| [Offsets](#spouse-super-contribution-offset) | Spouse super contribution offset | Low | Low |
| [Land Tax](#land-tax) | State-based land tax | Medium — affects holding costs | High (multi-state) |
| [Foreign Residents](#foreign-resident-tax-rates) | Non-resident tax brackets | Low — out of scope | Medium |
| [Foreign Residents](#foreign-resident-cgt-withholding) | CGT withholding (>$750k) | Low | Low |
| [Small Business](#small-business-cgt-concessions) | Small business CGT concessions | Low — out of scope | High |

---

## Capital Gains Tax

### CGT Main Residence Exemption

**What it is:** Your main residence (PPOR) is fully exempt from CGT when sold, provided it has been your home for the entire ownership period and has not been used to produce income.

**Why it matters:** This is the core assumption in PPOR vs Rent modelling. If the user's PPOR is exempt, there's no CGT on sale. The existing comparison model likely assumes this but doesn't explicitly model it.

**Key rules:**
- Must be the taxpayer's main residence
- Must have lived in it during the ownership period
- Land must be ≤ 2 hectares
- Cannot claim for more than one property at a time (one PPOR rule)
- Adjacent land used for domestic purposes may be included

### CGT 6-Year Absence Rule

**What it is:** If you move out of your PPOR and rent it out, you can treat it as your main residence for up to 6 years (and claim the full CGT exemption on sale) — but you cannot claim another property as your main residence during that period.

**Why it matters:** Directly relevant to PPOR vs Rent scenarios where the user considers converting their PPOR to an investment property. The 6-year window is a common strategy.

**Key rules:**
- Applies when you move out of your PPOR
- Maximum 6 years of absence (resets if you move back in)
- Cannot have another main residence during the absence
- Can still claim rental deductions during the absence
- If absence exceeds 6 years, partial exemption applies based on time ratios

### CGT Cost Base

**What it is:** The cost base of a property determines the capital gain or loss on disposal. It includes more than just the purchase price.

**Key elements of cost base:**
1. **Acquisition costs** — purchase price, stamp duty, legal fees, inspections
2. **Ownership costs** — non-deductible costs only (e.g. rates, insurance during vacancy if not claimed)
3. **Capital improvements** — renovations, extensions (not repairs)
4. **Disposal costs** — agent commissions, legal fees, marketing
5. **Division 43 reduction** — capital works deductions claimed reduce the cost base

**Why it matters:** A higher cost base = lower capital gain = less CGT. The codebase already tracks purchase costs (stamp duty, etc.) which form part of the cost base.

### Partial Main Residence Exemption

**What it is:** If a property was your main residence for part of the ownership period, or was partly used for income-producing purposes, you get a proportional CGT exemption.

**Key rules:**
- Time-based: exempt days / total days of ownership
- Use-based: if part of the home produces income (e.g. home office, renting a room)
- The "first used to produce income" rule can apply — market value at that date becomes the cost base for the non-exempt portion

---

## Medicare

### Medicare Levy Reduction (Families)

**What it is:** Families with dependent children or spouses have higher Medicare levy thresholds. The current implementation only supports singles.

**Key thresholds (2025-26):**
- Family lower threshold: ~$46,000 (increased by ~$1,500 per dependent child)
- Family upper threshold: ~$57,198
- Phase-in rate: 10% (same as singles)

### Medicare Levy Surcharge Family Thresholds

**What it is:** MLS thresholds are higher for families than singles.

**Key thresholds (2025-26):**
- Family tier 1: $201,000 (vs $101,000 single)
- Increases by $1,500 per dependent child after the first

---

## Superannuation

### Division 293 Tax

**What it is:** An additional 15% tax on concessional super contributions for individuals with income + super > $250,000. This effectively doubles the super contributions tax from 15% to 30% for high earners.

**Why it matters:** High-income property investors using salary sacrifice may hit this threshold. The additional tax reduces the effectiveness of salary sacrifice as a strategy.

**Key rules:**
- Threshold: $250,000 (income + low-tax super contributions)
- Rate: additional 15% on contributions that push income over the threshold
- Can be paid from super balance or personal funds

### Concessional Contributions Cap

**What it is:** A cap on tax-deductible (concessional) super contributions — employer super guarantee + salary sacrifice + personal deductible contributions.

**Key rules:**
- Cap: $30,000 per year (2025-26)
- Includes employer SG (currently 12%)
- Excess contributions taxed at marginal rate + interest charge
- Unused cap amounts can be carried forward for up to 5 years (if total super < $500k)

**Relevance:** The codebase has `sal_sac` (salary sacrifice) but doesn't validate against the contributions cap or warn when combined with employer SG it exceeds $30k.

---

## Rental Deductions

### Repairs vs Capital Improvements

**What it is:** Repairs (restoring to original condition) are immediately deductible. Capital improvements (new or upgraded items) must be depreciated.

**Key rules:**
- Repair: fixing broken items, repainting same colour, replacing like-for-like → immediately deductible
- Improvement: adding new features, upgrading materials, extensions → depreciate (Div 40 or Div 43)
- Initial repairs on a newly purchased property are capital in nature (not immediately deductible)

### Prepaid Expenses

**What it is:** Expenses paid in advance (e.g. 12 months of interest or insurance) may need to be apportioned across financial years rather than claimed in full upfront.

**Key rules:**
- Service period ≤ 12 months and ending in the next FY: can claim in full in the year paid
- Service period > 12 months: must apportion across the service period
- Applies to: interest, insurance, property management fees paid in advance

---

## Tax Offsets (Not Implemented)

### Low Income Superannuation Tax Offset (LISTO)

**What it is:** A government contribution of up to $500 to the super of low-income earners, to offset the 15% contributions tax.

**Key rules:**
- Income ≤ $37,000
- Maximum offset: $500 (15% of concessional contributions, capped)
- Paid directly into super, not as a tax offset

**Relevance:** Low — only affects super balance, not income tax.

### Spouse Super Contribution Offset

**What it is:** A tax offset of up to $540 for contributions made to a low-income spouse's super.

**Key rules:**
- Spouse income < $40,000
- Maximum offset: 18% of contributions up to $3,000 = $540
- Phases out between $37,000 and $40,000 spouse income

**Relevance:** Low — requires couple modelling which is out of scope.

---

## Land Tax

### State-Based Land Tax

**What it is:** An annual tax on the total unimproved value of land owned (excluding PPOR in most states). Each state has different thresholds and rates.

**Why it matters:** A recurring holding cost for investment properties that affects cash flow. Not currently modelled.

**Key points:**
- Calculated on unimproved land value, not property value
- PPOR exempt in all states
- Thresholds and rates vary significantly by state
- QLD: $600k threshold (individuals), 1%–2.75% progressive
- NSW: $1,075k threshold, 1.6%–2% progressive
- VIC: $50k threshold, 0.2%–2.55% progressive (much lower threshold)
- Foreign surcharges apply in most states

**Relevance:** Medium — affects investment property cash flow modelling. Would require multi-state configuration similar to stamp duty.

---

## Foreign Residents

### Foreign Resident Tax Rates

**What it is:** Non-residents pay different (higher) tax rates with no tax-free threshold.

**Key rules:**
- No tax-free threshold
- 30% on first $135,000 (vs 0%/16%/30% for residents)
- 37% on $135,001–$190,000
- 45% on $190,001+
- No Medicare levy
- No LITO or SAPTO

**Relevance:** Low — the app targets Australian residents.

### Foreign Resident CGT Withholding

**What it is:** Purchasers of property from foreign residents must withhold 12.5% of the purchase price and remit to the ATO.

**Key rules:**
- Applies to property sales > $750,000
- Withholding rate: 12.5%
- Vendor can apply for a variation or clearance certificate

**Relevance:** Low.

---

## Small Business

### Small Business CGT Concessions

**What it is:** A suite of CGT concessions for small business owners selling active business assets.

**Key concessions:**
- 15-year exemption (complete CGT exemption if held 15+ years)
- 50% active asset reduction (on top of the standard 50% CGT discount)
- Retirement exemption (up to $500k lifetime cap)
- Rollover (defer gain by acquiring replacement asset)

**Relevance:** Low — MortgageModeler focuses on residential property, not business assets.
