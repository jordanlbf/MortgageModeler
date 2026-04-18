"""
NORTHERN TERRITORY STAMP DUTY

NT uses a unique quadratic formula for properties up to $525,000,
then flat percentage rates on the ENTIRE value above that.

Formula (≤$525,000): D = (0.06571441 * V^2) + 15V
  where V = price / 1000, D = duty in dollars

Flat rates (>$525,000): applied to the entire dutiable value.

No separate PPOR rate schedule. NT offers a Principal Place of
Residence Rebate (PPRR) of up to $7,000 — handled separately
from the base duty calculation.

Source: NT Treasury — treasury.nt.gov.au/dtf/territory-revenue-office/stamp-duty
Verified: March 2026
"""

# NT duty constants — used by engine/stamp_duty.py
NT_FORMULA_A = 0.06571441
NT_FORMULA_B = 15.0
NT_FORMULA_THRESHOLD = 525_000

NT_FLAT_RATES = [
    (3_000_000, 0.0495),   # $525,001 – $3,000,000: 4.95% of total value
    (5_000_000, 0.0575),   # $3,000,001 – $5,000,000: 5.75% of total value
    (float("inf"), 0.0595),  # Over $5,000,000: 5.95% of total value
]

NT_PPOR_REBATE = 7_000.00  # Maximum PPRR for owner-occupiers
