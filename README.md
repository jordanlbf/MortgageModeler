# Mortgage Modeler

PPOR vs Rentvesting comparison engine for Australian property buyers.

## Project Structure

```
MortgageModeler/
  compute/
    app/
      config/               # Constants and rate tables
        settings.py         # App config (env, CORS, version)
        tax.py              # 2025-26 tax brackets, Medicare, HECS, MLS thresholds
        property.py         # QLD stamp duty brackets, LMI tiers, default fees
        rental.py           # Rental projection defaults
        deductions.py       # Div 43/40 depreciation cutoff dates
      engine/               # Pure calculation logic (no side effects)
        amortisation.py     # Loan repayments (P&I, IO, offset, extra, rate changes)
        tax.py              # Income tax, Medicare levy, MLS, HECS, tax saving
        property.py         # Stamp duty, LMI, registration fees, ongoing costs
        rental.py           # Gross/effective rental income
        deductions.py       # Division 43 & 40 depreciation, borrowing cost deductions
        cgt.py              # Capital gains tax (cost base, discount, two-pass marginal)
      models/               # Domain models (dataclasses)
        mortgage.py         # Mortgage aggregate root (property + loan + person + costs)
        property.py         # Property, PurchaseCosts, OngoingCostsConfig, RentvestConfig, YearCost
        loan.py             # LoanConfig, Loan, BorrowingCosts, RepaymentFrequency, RateChange
        person.py           # Person (taxpayer identity)
        tax.py              # TaxProfile
        amortisation.py     # ScheduleRow, AmortisationSchedule, YearChartPoint, ScheduleResult
        cashflow.py         # CashFlowYear, CashFlowSummary, CashFlowPPORResult, CashFlowRentvestResult
        cgt.py              # CGTResult
        comparison.py       # PporVsRentvestResult
        deductions.py       # DepreciableBuilding, DepreciableAsset, PropertyTaxDeductionSummary
        financial.py        # FinancialYear (Australian FY)
      schemas/              # Pydantic API request/response contracts
        amortisation.py     # Schedule request/response
        tax.py              # Tax breakdown request/response
        upfront_costs.py    # Upfront cost estimate request/response
        ongoing_costs.py    # Ongoing cost projection request/response
        cashflow.py         # PPOR and rentvesting cashflow request/response
        comparison.py       # PPOR vs rentvesting comparison request/response
      services/             # Business logic orchestration
        amortisation.py     # Schedule + chart data builder, Loan aggregate builder
        tax_breakdown.py    # Tax breakdown builder
        tax_deductions.py   # Single-year tax deduction aggregator (Div 43/40, expenses, borrowing)
        upfront_costs.py    # Upfront cost resolver (auto-estimate or override)
        ongoing_costs.py    # Year-by-year ongoing cost projection builder
        cashflow.py         # PPOR and rentvesting cash flow projection builder
        comparison.py       # PPOR vs rentvesting wealth comparison
      routers/              # FastAPI endpoint handlers
        amortisation.py
        tax.py
        upfront_costs.py
        ongoing_costs.py
        cashflow.py
        comparison.py
        _cashflow_mapping.py  # Shared schema ↔ model mapping helpers
      tests/                # 1,064 tests across engine, service, and API layers
        engine/             # Pure calculation tests
        services/           # Orchestration tests
        api/                # Integration tests (HTTP round-trip)
      main.py               # FastAPI app entry point
    pyproject.toml
    requirements.txt
  frontend/
    src/
      app/                  # Next.js App Router pages
      components/           # React components (amortisation, layout, ui)
      hooks/                # Custom hooks (state, animation, layout)
      lib/                  # API client, formatters, theme tokens, types
    package.json
    tsconfig.json
```

## Architecture

```
Engine (pure math) → Service (orchestration) → Router (API) → Frontend (Next.js)
```

- **Engine**: Stateless, pure calculation functions. Daily compounding for mortgage interest; annual for property/cost growth. No side effects or external dependencies.
- **Service**: Orchestrates across engines. E.g. tax deductions service calls deductions engine, tax engine, and ongoing costs to build a single-year deduction summary.
- **Router**: Thin API layer. Validates input (Pydantic schemas), maps to domain models, delegates to services, maps results to response schemas.
- **Models**: Domain models use dataclasses. API contracts use Pydantic schemas. The `Mortgage` aggregate root bundles property, loan, person, and cost config into a single object that flows through services.
- **Australian-specific**: QLD stamp duty (base + PPOR concession), ATO depreciation (Div 40/43), 2025-26 marginal tax brackets, HECS/HELP (2025-26 marginal rates), Medicare levy + surcharge, CGT with 50% individual discount.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/amortisation/schedule` | Full amortisation schedule with chart data |
| POST | `/api/tax/breakdown` | Income tax, Medicare, MLS, HECS breakdown |
| POST | `/api/upfront-costs/estimate` | Upfront costs (stamp duty, LMI, fees) |
| POST | `/api/ongoing-costs/estimate` | Year-by-year ongoing property costs |
| POST | `/api/cashflow/ppor` | PPOR cash flow projection |
| POST | `/api/cashflow/rentvest` | Rentvesting cash flow projection |
| POST | `/api/comparison` | PPOR vs rentvesting wealth comparison |

API docs available at `http://localhost:8000/docs` when running locally.

## Setup

### Compute

```bash
cd compute
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Run Tests

```bash
cd compute
python -m pytest app/tests/ -v
```

## Tech Stack

- **Compute**: Python 3.12+, FastAPI, Pydantic 2.5
- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Recharts 3
- **Testing**: Pytest (1,064 tests across engine, service, and API layers)
