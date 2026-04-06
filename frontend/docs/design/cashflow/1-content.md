# Single Property Cashflow Calculator

## Content

**Overview:** Full financial picture for a single property — how much it costs to hold, how equity grows, and (for investment) how tax deductions and rental income affect the net position year by year.

**Input data:**

*Mode & property use*
- Mode: new purchase / existing property
- Property use: PPOR / investment

*Property & Loan (new purchase)*
- Purchase price
- Purchase date
- Is new property
- Annual appreciation rate
- Deposit
- Interest rate
- Loan term
- Repayment frequency
- Offset balance
- Offset contribution per period
- Extra repayment per period
- Scheduled rate changes
- Purchase costs: stamp duty, legal fees, inspections, registration, other
- Borrowing costs: LMI, establishment fee, mortgage registration, capitalise toggles

*Property & Loan (existing property)*
- Current property value
- Purchase date (for depreciation / CGT continuity)
- Purchase price (for CGT cost base)
- Original purchase costs (for CGT cost base)
- Is new property
- Annual appreciation rate
- Current loan balance
- Remaining loan term
- Interest rate
- Repayment frequency
- Offset balance
- Offset contribution per period
- Extra repayment per period
- Scheduled rate changes
- Original borrowing costs total
- Years of borrowing cost deduction already claimed

*Rental (investment only)*
- Weekly rent
- Vacancy weeks per year
- Annual rent growth rate

*Tax Profile*
- Taxable income
- Repayment income (for HECS)
- MLS income
- HECS balance
- Private health insurance
- Income growth rate

*Ongoing Costs*
- Council rates
- Water rates
- Building insurance
- Landlord insurance (investment only)
- Strata fees
- Maintenance rate (% of property value)
- Management rate (% of rental income, investment only)
- Annual cost growth rate

*Depreciation (investment only)*
- Division 43 buildings: name, construction cost, purchase date, construction start date
- Division 40 assets: name, cost, effective life, purchase date, depreciation method, written-down value (existing mode)

*Projection*
- Projection years

**Output data:**

*KPI / summary level*
- Net monthly cashflow (positive / negative)
- Gross rental yield % (investment)
- Year 1 tax saving (investment)
- Total upfront cost (new purchase only)
- Purchase price / current property value

*Year-by-year (per projection year)*
- Rental income
- Mortgage repayment (total; P and I split on expand)
- Property costs
- Tax saving (investment)
- Net cashflow
- Property value
- Loan balance
- Equity

*End of projection (investment)*
- CGT: cost base, capital gain, discount applied, discounted gain, CGT payable, net proceeds

*Totals across projection*
- Total interest paid
- Total rental income (investment)
- Total tax saving (investment)
- Final equity
- Net wealth (equity + cumulative cash position)

**Actions:**
- Set mode (new / existing)
- Set property use (PPOR / investment)
- Enter and adjust all inputs
- View year-by-year table
- View chart of key series over projection period
- Expand mortgage repayment to P/I split
- View CGT result at end of projection (investment)

**Use cases:**
- Know the true annual cost of holding a property (mortgage + costs − tax saving)
- Determine whether a property is positively or negatively geared, and when it crosses over
- Model how equity grows relative to the cashflow drain year by year
- See how depreciation and negative gearing reduce the effective holding cost
- For existing owners: project forward from today without re-entering full purchase history

---

## Hierarchy

### Primary
Net monthly cashflow

### Secondary
- Gross yield % (investment)
- Year 1 tax saving (investment)
- Total upfront cost (new purchase)
- Final equity
- Cashflow + equity chart over projection period

### Tertiary
- Full year-by-year table (all columns)
- CGT breakdown (investment)
- Itemised upfront costs (new purchase)
- P/I split within mortgage repayment column

### Focal point
Net monthly cashflow — the single number that tells the user whether they can afford to hold this property.
