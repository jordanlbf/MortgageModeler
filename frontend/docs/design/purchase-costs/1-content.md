# Purchase Costs

## Content

**Overview:** Total dollar amount a buyer needs to purchase a property.

**Input data:**
- State
- Purchase price
- Deposit (% or $)
- Property type (new / existing / land)
- Buyer type (individual / couple)
- First home buyer (yes / no)
- Owner-occupier (yes / no)
- Selected grants (pre-selected from grants page)

**Output data:**
- Stamp duty (base, concession, payable)
- LMI (base, waived status, payable)
- Government fees (title registration, mortgage registration)
- Legal fees (conveyancing)
- Inspections (building, pest)
- Lender fees (loan establishment)
- Grants (per-grant savings, total savings)
- Equity (government share, effective loan amount)
- Deposit amount, loan amount, LVR
- Total upfront cost

**Actions:**
- Set state
- Set purchase price
- Set deposit
- Set property type
- Set buyer type
- Set first home buyer
- Set owner-occupier
- View/confirm pre-selected grants
- View itemised cost breakdown

**Use cases:**
- Know total cash needed beyond deposit
- Compare cost with vs without FHB concessions
- Understand stamp duty impact for a specific state and price
- See how LMI changes with deposit amount
- See net effect of selected grants on total cost

## Hierarchy

### Primary
Total upfront cost

### Secondary (aggregates)
- Stamp duty payable
- LMI payable
- Total fees (government + legal + inspections + lender)
- Total grant savings
- Deposit amount

### Tertiary (line items within each aggregate)
- Stamp duty base and concession breakdown
- LMI base and waived detail
- Individual fee lines (registration, conveyancing, inspections, establishment)
- Per-grant savings
- Equity contribution and effective loan amount
- Loan amount and LVR

### Focal point
Total upfront cost
