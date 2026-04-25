import { describe, it, expect } from "vitest";
import { mapYearRow, type MapYearRowOpts } from "@/hooks/useCashflowAPI";
import type { CashflowYearRow } from "@/lib/api";

// ── Fixtures ────────────────────────────────────────────────────────────────

const DEFAULT_OPTS: MapYearRowOpts = { vacRate: 0, mgmtFee: 0 };

/** Minimal backend year row with all required fields populated to 0. */
function baseYearRow(): CashflowYearRow {
  return {
    year: 0,
    net_income: 0,
    total_inflows: 0,
    mortgage_repayment: 0,
    mortgage_interest: 0,
    mortgage_principal: 0,
    property_costs: 0,
    offset_contributions: 0,
    rent_paid: 0,
    rental_income: 0,
    tax_saving: 0,
    total_outflows: 0,
    net_position: 0,
    cumulative_position: 0,
    property_value: 0,
    loan_balance: 0,
    equity: 0,
    offset_balance: 0,
    salary: 0,
    income_tax: 0,
  };
}

/** Ongoing costs detail sub-object with zeros. */
function ongoingDetail(overrides: Partial<NonNullable<CashflowYearRow["ongoing_costs_detail"]>> = {}) {
  return {
    council_rates: 0,
    water_rates: 0,
    building_insurance: 0,
    landlord_insurance: 0,
    strata_fees: 0,
    maintenance_cost: 0,
    management_fee: 0,
    ...overrides,
  };
}

/** Tax deduction detail sub-object with zeros. */
function taxDetail(overrides: Partial<NonNullable<CashflowYearRow["tax_deduction_detail"]>> = {}) {
  return {
    mortgage_interest: 0,
    depreciation_building: 0,
    depreciation_plant: 0,
    deductible_expenses: 0,
    total_deductions: 0,
    net_rental_income: 0,
    is_negatively_geared: false,
    tax_saving: 0,
    borrowing_costs_deduction: 0,
    ...overrides,
  };
}

// ── propertyCashflow formula ────────────────────────────────────────────────

describe("mapYearRow — propertyCashflow", () => {
  it("matches the after-tax out-of-pocket formula: rent − ongoing − interest − principal + taxSaved", () => {
    const row: CashflowYearRow = {
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000,
      mortgage_repayment: 25_000,
      tax_saving: 4_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
      tax_deduction_detail: taxDetail({ depreciation_building: 7_000 }),
    };

    const result = mapYearRow(row, DEFAULT_OPTS);

    // 30000 − 3000 − 20000 − 5000 + 4000 = 6000
    expect(result.propertyCashflow).toBe(6_000);
  });

  it("treats depreciation as non-cash (it must not affect propertyCashflow)", () => {
    const withoutDepr = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000,
      tax_saving: 0,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
      tax_deduction_detail: taxDetail(),
    }, DEFAULT_OPTS);

    const withDepr = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000,
      tax_saving: 0,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
      tax_deduction_detail: taxDetail({ depreciation_building: 5_000, depreciation_plant: 2_000 }),
    }, DEFAULT_OPTS);

    // Adding $7k of depreciation must not change propertyCashflow.
    expect(withoutDepr.propertyCashflow).toBe(withDepr.propertyCashflow);
  });

  it("adds taxSaved into propertyCashflow (negative gearing tax refund reduces out-of-pocket)", () => {
    const noTax = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    const withTax = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000,
      tax_saving: 4_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    expect(withTax.propertyCashflow - noTax.propertyCashflow).toBe(4_000);
  });

  it("subtracts taxSaved when positively geared (additional tax owed)", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      rental_income: 60_000,
      mortgage_interest: 5_000,
      mortgage_principal: 15_000,
      tax_saving: -2_000, // additional tax from rental profit
      ongoing_costs_detail: ongoingDetail({ council_rates: 4_000 }),
    }, DEFAULT_OPTS);

    // 60000 − 4000 − 5000 − 15000 + (−2000) = 34000
    expect(result.propertyCashflow).toBe(34_000);
  });

  it("for PPOR (no rental, no tax) equals −(ongoing + interest + principal)", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      rental_income: 0,
      mortgage_interest: 18_000,
      mortgage_principal: 7_000,
      tax_saving: 0,
      ongoing_costs_detail: ongoingDetail({ council_rates: 4_000 }),
    }, DEFAULT_OPTS);

    // 0 − 4000 − 18000 − 7000 + 0 = −29000
    expect(result.propertyCashflow).toBe(-29_000);
  });
});

// ── gearing (pre-tax rental position) ──────────────────────────────────────

describe("mapYearRow — gearing", () => {
  it("equals rent − interest − ongoing − (depDiv43 + depDiv40)", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
      tax_deduction_detail: taxDetail({ depreciation_building: 5_000, depreciation_plant: 2_000 }),
    }, DEFAULT_OPTS);

    // 30000 − 20000 − 3000 − 5000 − 2000 = 0
    expect(result.gearing).toBe(0);
  });

  it("is independent of principal and taxSaved", () => {
    const a = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 0,
      tax_saving: 0,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    const b = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 10_000,
      tax_saving: 5_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    expect(a.gearing).toBe(b.gearing);
  });
});

// ── rentalLossOrGain (backend-authoritative, passthrough) ──────────────────

describe("mapYearRow — rentalLossOrGain", () => {
  it("is the backend's net_rental_income passthrough", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      tax_deduction_detail: taxDetail({ net_rental_income: -5_432 }),
    }, DEFAULT_OPTS);

    expect(result.rentalLossOrGain).toBe(-5_432);
  });

  it("falls back to 0 when tax_deduction_detail is absent (PPOR)", () => {
    const result = mapYearRow(baseYearRow(), DEFAULT_OPTS);
    expect(result.rentalLossOrGain).toBe(0);
  });

  it("can differ from the locally-derived `gearing` because it includes otherDeductibles", () => {
    // Scenario where backend factors in an extra $1,000 deductible the frontend
    // doesn't see broken out — the two fields diverge by that amount.
    const result = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
      tax_deduction_detail: taxDetail({
        depreciation_building: 5_000,
        deductible_expenses: 1_000,
        net_rental_income: 30_000 - 20_000 - 3_000 - 5_000 - 1_000, // 1000
        total_deductions: 20_000 + 3_000 + 5_000 + 1_000,
      }),
    }, DEFAULT_OPTS);

    expect(result.gearing).toBe(2_000);             // 30000 − 20000 − 3000 − 5000
    expect(result.rentalLossOrGain).toBe(1_000);    // backend's authoritative
  });
});

// ── household netCashflow (unchanged by this fix) ───────────────────────────

describe("mapYearRow — netCashflow", () => {
  it("equals salary + rent − ongoing − mortgage_repayment − incomeTax", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      salary: 120_000,
      rental_income: 30_000,
      mortgage_repayment: 25_000,
      income_tax: 28_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    // 120000 + 30000 − 3000 − 25000 − 28000 = 94000
    expect(result.netCashflow).toBe(94_000);
  });
});

// ── afterTaxCashflow (pre-principal variant) ────────────────────────────────

describe("mapYearRow — afterTaxCashflow", () => {
  it("equals rental − ongoing − interest + taxSaved (pre-principal)", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 5_000, // must NOT affect afterTaxCashflow
      tax_saving: 4_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000, management_fee: 2_025 }),
    }, DEFAULT_OPTS);

    // ongoing = 3000 + 2025 = 5025
    // afterTaxCashflow = 30000 − 5025 − 20000 + 4000 = 8975
    expect(result.afterTaxCashflow).toBe(8_975);
  });

  it("is independent of principal", () => {
    const noPrincipal = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 0,
      tax_saving: 4_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    const withPrincipal = mapYearRow({
      ...baseYearRow(),
      rental_income: 30_000,
      mortgage_interest: 20_000,
      mortgage_principal: 8_000,
      tax_saving: 4_000,
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    expect(noPrincipal.afterTaxCashflow).toBe(withPrincipal.afterTaxCashflow);
  });
});

// ── netEquity passthrough ───────────────────────────────────────────────────

describe("mapYearRow — netEquity", () => {
  it("equals equity + offset_balance", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      equity: 120_000,
      offset_balance: 45_000,
    }, DEFAULT_OPTS);

    expect(result.netEquity).toBe(165_000);
  });
});

// ── ongoingCosts (Holding) aligned with backend's deductible_expenses ───────

describe("mapYearRow — ongoingCosts (Holding)", () => {
  it("sums all 7 deductible expense items so it matches backend's deductible_expenses", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      ongoing_costs_detail: ongoingDetail({
        council_rates: 100,
        water_rates: 200,
        building_insurance: 300,
        landlord_insurance: 400,
        strata_fees: 500,
        maintenance_cost: 600,
        management_fee: 700,
      }),
    }, DEFAULT_OPTS);

    // 100 + 200 + 300 + 400 + 500 + 600 + 700 = 2800
    expect(result.ongoingCosts).toBe(2_800);
  });

  it("includes management_fee (the historical bug that undercounted Holding)", () => {
    const withMgmt = mapYearRow({
      ...baseYearRow(),
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000, management_fee: 5_000 }),
    }, DEFAULT_OPTS);

    const withoutMgmt = mapYearRow({
      ...baseYearRow(),
      ongoing_costs_detail: ongoingDetail({ council_rates: 3_000 }),
    }, DEFAULT_OPTS);

    expect(withMgmt.ongoingCosts - withoutMgmt.ongoingCosts).toBe(5_000);
  });

  it("includes landlord_insurance (the second historical gap)", () => {
    const withLL = mapYearRow({
      ...baseYearRow(),
      ongoing_costs_detail: ongoingDetail({ landlord_insurance: 800 }),
    }, DEFAULT_OPTS);

    const withoutLL = mapYearRow({
      ...baseYearRow(),
      ongoing_costs_detail: ongoingDetail({}),
    }, DEFAULT_OPTS);

    expect(withLL.ongoingCosts - withoutLL.ongoingCosts).toBe(800);
  });
});

// ── Fallback behaviour ──────────────────────────────────────────────────────

describe("mapYearRow — fallback when detail objects are missing", () => {
  it("uses `property_costs` when ongoing_costs_detail is absent", () => {
    const result = mapYearRow({
      ...baseYearRow(),
      property_costs: 12_500,
    }, DEFAULT_OPTS);

    expect(result.ongoingCosts).toBe(12_500);
  });

  it("zeroes depreciation and deductions when tax_deduction_detail is absent", () => {
    const result = mapYearRow(baseYearRow(), DEFAULT_OPTS);
    expect(result.depDiv43).toBe(0);
    expect(result.depDiv40).toBe(0);
    expect(result.otherDeductibles).toBe(0);
    expect(result.totalDeductions).toBe(0);
    expect(result.rentalLossOrGain).toBe(0);
  });

  it("increments year index by 1 so backend year 0 renders as Year 1", () => {
    expect(mapYearRow({ ...baseYearRow(), year: 0 }, DEFAULT_OPTS).year).toBe(1);
    expect(mapYearRow({ ...baseYearRow(), year: 29 }, DEFAULT_OPTS).year).toBe(30);
  });
});
