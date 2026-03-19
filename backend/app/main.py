"""
MortgageModeler API.

Run with: uvicorn app.main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.settings import settings
from app.routers import amortisation, tax, upfront_costs, ongoing_costs, cashflow

app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(amortisation.router, prefix="/api")
app.include_router(tax.router, prefix="/api")
app.include_router(upfront_costs.router, prefix="/api")
app.include_router(ongoing_costs.router, prefix="/api")
app.include_router(cashflow.router, prefix="/api")


@app.get("/health")
def health():
    """Health check with environment context."""
    return {
        "status": "ok",
        "environment": settings.APP_ENV,
        "version": settings.APP_VERSION,
        "debug": settings.DEBUG,
    }
