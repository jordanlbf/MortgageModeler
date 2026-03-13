# Mortgage Modeler

PPOR vs Rentvesting comparison engine for Australian property buyers.

## Project Structure

```
MortgageModeler/
  backend/
    app/
      config/             # Constants and rate tables
        tax.py            # 2025-26 tax brackets, Medicare, HECS, MLS thresholds
        property.py       # QLD stamp duty brackets, LMI tiers, default fees
        rental.py         # Rental projection defaults
        deductions.py     # Depreciation constants
      engine/             # Pure calculation logic (no side effects)
        amortisation.py   # Loan repayments (P&I, IO, offset, extra, rate changes)
        tax.py            # Income tax, Medicare levy, MLS, HECS
        property.py       # Stamp duty, LMI, registration fees, ongoing costs
        rental.py         # Gross/effective rental income
        deductions.py     # Division 43 & 40 depreciation (building + plant)
      models/             # Domain models (dataclasses)
        amortisation.py   # ScheduleRow, AmortisationSchedule, YearChartPoint, ScheduleResult
        loan.py           # RepaymentFrequency, RateChange
        property.py       # Property, YearCost, OngoingCostProjection
        financial.py      # FinancialYear (Australian FY)
        deductions.py     # DepreciableBuilding, DepreciableAsset, PropertyTaxDeductionSummary
      schemas/            # Pydantic API request/response contracts
        amortisation.py   # Schedule request/response
        tax.py            # Tax breakdown request/response
        purchase_costs.py # Upfront cost estimate
        ongoing_costs.py  # Year-by-year cost projection
        rent_received.py  # Rental income projection
        rent_paid.py      # Rent paid projection
      services/           # Business logic orchestration
        amortisation.py   # Schedule + chart data builder
        ongoing_costs.py  # Year-by-year cost projection builder
        tax_deductions.py # Single-year tax deduction aggregator
      routers/            # FastAPI endpoint handlers
        amortisation.py
        tax.py
        purchase_costs.py
        ongoing_costs.py
        rent_received.py
        rent_paid.py
      tests/              # 683 tests (engine, service, API layers)
      main.py             # FastAPI app entry point
    pyproject.toml
    requirements.txt
  frontend/
    src/
      app/                # Next.js App Router pages
      components/         # React components (amortisation, layout, ui)
      hooks/              # Custom hooks (state, animation, layout)
      lib/                # API client, formatters, theme tokens, types
    package.json
    tsconfig.json
```

## Architecture

```
Engine (pure math) → Service (orchestration) → Router (API) → Frontend (Next.js)
```

- **Engine**: Stateless calculation functions. Daily compounding for mortgage interest; annual for property/cost growth.
- **Service**: Aggregates across engines. E.g. tax deductions service calls both deductions engine and tax engine.
- **Router**: Thin API layer. Validates input (Pydantic schemas), delegates to services.
- **Models**: Domain models use dataclasses. API contracts use Pydantic schemas.
- **Australian-specific**: QLD stamp duty, ATO depreciation (Div 40/43), 2025-26 tax brackets, HECS/HELP, Medicare levy.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/amortisation/schedule` | Full amortisation schedule with chart data |
| POST | `/api/tax/breakdown` | Income tax, Medicare, MLS, HECS breakdown |
| POST | `/api/purchase-costs/estimate` | Upfront costs (stamp duty, LMI, fees) |
| POST | `/api/ongoing-costs/estimate` | Year-by-year ongoing property costs |
| POST | `/api/rental/rent-received` | Rental income projections |
| POST | `/api/rental/rent-paid` | Rent paid projections |

## Setup

### Backend

```bash
cd backend
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
cd backend
python -m pytest app/tests/ -v
```

## Tech Stack

- **Backend**: Python 3.12+, FastAPI, Pydantic 2.5
- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4, Recharts 3
- **Testing**: Pytest (683 tests across engine, service, and API layers)
