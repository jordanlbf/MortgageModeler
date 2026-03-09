"""
MortgageModeler API.

Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import amortisation, tax, purchase_costs, ongoing_costs

app = FastAPI(
    title="MortgageModeler",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(amortisation.router, prefix="/api")
app.include_router(tax.router, prefix="/api")
app.include_router(purchase_costs.router, prefix="/api")
app.include_router(ongoing_costs.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok"}
