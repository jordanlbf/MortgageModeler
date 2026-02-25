# Mortgage Modeler

PPOR vs Rentvesting comparison engine for Australian property buyers.

## Project Structure

```
MortgageModeler/
  backend/
    app/
      engine/           # Pure calculation logic
        amortisation.py # Loan repayment engine (P&I, IO, offset, extra repayments)
        tax.py          # Australian tax (2024-25 brackets, Medicare, HECS, negative gearing)
        property.py     # Capital growth, rental yield, holding costs, QLD stamp duty
        scenarios.py    # PPOR vs Rentvesting orchestration
      models/
        schemas.py      # Pydantic data models (all input/output contracts)
      routers/          # FastAPI endpoints (coming soon)
      tests/            # 61 passing tests
    scripts/
      demo.py           # Demo comparison output
    pyproject.toml
    requirements.txt
```

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

## Run Tests

```bash
python -m pytest app/tests/ -v
```

## Run Demo

```bash
python -m scripts.demo
```

## Tech Stack

- **Backend**: Python 3.12, FastAPI (coming), NumPy, Pydantic 2.5
- **Frontend**: Next.js 19, TypeScript, Tailwind CSS (coming)
- **Testing**: Pytest
