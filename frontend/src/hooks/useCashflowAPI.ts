"use client";

import { useCallback } from "react";
import type { YearData } from "@/lib/cashflow-types";
import type { CashflowFormValues } from "./useCashflowFormState";
import { parseCurrencyInput } from "@/lib/formatters";
import { fetchCashflowSingle, type CashflowSingleRequest, type CashflowYearRow } from "@/lib/api";
import { generateDepreciationEstimate } from "@/lib/depreciation-estimate";
import { useApiCall } from "./useApiCall";

// ── Hook ────────────────────────────────────────────────────────────────────

export function useCashflowAPI(form: CashflowFormValues, allComplete: boolean): { yearData: YearData[]; error: string | null; loading: boolean } {
  const isInvestment = form.propertyUse === "investment";
  const isNewPurchase = form.purchaseMode === "new";

  const buildRequest = useCallback((): CashflowSingleRequest | null => {
    if (!allComplete) return null;

    const growth = parseFloat(form.capitalGrowth) / 100 || 0.035;
    const vacWeeks = Math.round((parseFloat(form.vacancyRate) || 3.8) / 100 * 52);
    const mgmtRate = form.usePropertyManager ? (parseFloat(form.managementFee) / 100 || 0.075) : 0;
    const maintenanceRate = parseFloat(form.maintenance) / 100 || 0.005;
    const income = parseCurrencyInput(form.taxableIncome);
    const estYear = isNewPurchase ? new Date().getFullYear() : parseInt(form.purchaseYear) || new Date().getFullYear();
    const purchaseDate = isNewPurchase ? new Date().toISOString().slice(0, 10) : `${estYear}-07-01`;
    const propPrice = isNewPurchase ? parseCurrencyInput(form.purchasePrice) : parseCurrencyInput(form.currentValue);
    // Construction-cost estimation must anchor to the price at the time of
    // purchase, not today's appreciated value. For new builds the two match;
    // for existing properties we use originalPurchasePrice.
    const depAnchorPrice = isNewPurchase
      ? parseCurrencyInput(form.purchasePrice)
      : parseCurrencyInput(form.originalPurchasePrice);

    // Depreciation schedules
    let depBuilds = form.depBuildings;
    let depAsts = form.depAssets;
    if (form.depreciationMode === "estimate" && isInvestment) {
      const est = generateDepreciationEstimate(depAnchorPrice, isNewPurchase, estYear);
      depBuilds = est.buildings;
      depAsts = est.assets;
    }

    const base: CashflowSingleRequest = {
      mode: isNewPurchase ? "new" : "existing",
      property_use: isInvestment ? "investment" : "ppor",
      projection_years: 30,
      tax_profile: {
        taxable_income: income,
        repayment_income: income,
        mls_income: income,
        hecs_balance: 0,
        has_private_health: false,
        income_growth_rate: growth,
      },
      ongoing_costs: {
        council_rates: parseCurrencyInput(form.councilRates),
        water_rates: parseCurrencyInput(form.waterRates),
        building_insurance: parseCurrencyInput(form.insurance),
        strata_fees: form.hasStrata ? parseCurrencyInput(form.strataFees) * 4 : 0,
        maintenance_rate: maintenanceRate,
        landlord_insurance: 0,
        management_rate: mgmtRate,
        annual_cost_growth_rate: 0.03,
      },
      rental: isInvestment ? {
        weekly_rent: parseCurrencyInput(form.weeklyRent),
        annual_growth_rate: growth,
        vacancy_weeks: vacWeeks,
      } : null,
    };

    if (isNewPurchase) {
      base.property = {
        purchase_price: parseCurrencyInput(form.purchasePrice),
        purchase_date: purchaseDate,
        is_new_property: true,
        is_ppor: !isInvestment,
        annual_appreciation: growth,
        purchase_costs: { other_costs: 0 },
        rental: base.rental ?? { weekly_rent: 0, annual_growth_rate: growth, vacancy_weeks: 2 },
        depreciable_buildings: depBuilds,
        depreciable_assets: depAsts,
      };
      base.loan = {
        deposit: parseCurrencyInput(form.depositAmount),
        annual_rate: parseFloat(form.interestRate) / 100 || 0.065,
        loan_term_years: parseInt(form.loanTerm) || 30,
        frequency: "monthly",
        offset_balance: form.hasOffset ? parseCurrencyInput(form.offsetBalance) : 0,
        offset_contribution: 0,
        extra_repayment: parseCurrencyInput(form.extraRepayments),
        rate_changes: [],
        borrowing_costs: {
          lmi: 0,
          mortgage_registration_fee: 0,
          loan_establishment_fee: 0,
          capitalise_lmi: false,
          capitalise_mortgage_registration_fee: false,
          capitalise_loan_establishment_fee: false,
        },
      };
    } else {
      base.existing_property = {
        purchase_date: purchaseDate,
        purchase_price: parseCurrencyInput(form.originalPurchasePrice),
        is_new_property: false,
        current_value: parseCurrencyInput(form.currentValue),
        annual_appreciation: growth,
        depreciable_buildings: depBuilds,
        depreciable_assets: depAsts,
        original_borrowing_costs_total: 0,
        borrowing_costs_years_elapsed: 0,
      };
      base.existing_loan = {
        current_balance: parseCurrencyInput(form.currentLoanBalance),
        remaining_term_years: parseInt(form.loanTerm) || 25,
        annual_rate: parseFloat(form.interestRate) / 100 || 0.065,
        frequency: "monthly",
        offset_balance: form.hasOffset ? parseCurrencyInput(form.offsetBalance) : 0,
        offset_contribution: 0,
        extra_repayment: parseCurrencyInput(form.extraRepayments),
        rate_changes: [],
      };
    }

    return base;
  }, [allComplete, form, isNewPurchase, isInvestment]);

  const mapResponseToYearData = useCallback((years: CashflowYearRow[]): YearData[] => {
    const vacRate = parseFloat(form.vacancyRate) / 100 || 0.038;
    const mgmtFee = form.usePropertyManager ? parseFloat(form.managementFee) / 100 || 0.075 : 0;
    return years.map((y) => mapYearRow(y, { vacRate, mgmtFee }));
  }, [form.vacancyRate, form.usePropertyManager, form.managementFee]);

  // Fetch from API when inputs change (debounced)
  const { data, error, loading } = useApiCall<YearData[]>(
    async (signal) => {
      const req = buildRequest();
      if (!req) return null;
      const response = await fetchCashflowSingle(req, signal);
      return mapResponseToYearData(response.years);
    },
    [buildRequest, mapResponseToYearData],
    { debounce: 300, enabled: allComplete },
  );

  return { yearData: data ?? [], error, loading };
}

// ── Pure mapper (exported for tests) ────────────────────────────────────────

export interface MapYearRowOpts {
  /** Vacancy rate as a fraction (e.g. 0.038 for 3.8%). */
  vacRate: number;
  /** Management fee as a fraction of net rent after vacancy (e.g. 0.075). */
  mgmtFee: number;
}

/**
 * Transform a single backend year row into a frontend YearData object.
 *
 * Derivation rules:
 * - `gearing` = rent − ongoing − interest − depreciation (pre-tax rental position
 *   using our frontend-visible inputs; for the authoritative tax-engine position,
 *   consumers should read `rentalLossOrGain`, which includes otherDeductibles).
 * - `propertyCashflow` = rent − ongoing − interest − principal + taxSaved
 *   (actual after-tax cash change attributable to the property).
 * - `afterTaxCashflow` = rent (net of vacancy + management) − ongoing − interest
 *   + taxSaved (pre-principal variant; kept for legacy consumers).
 */
export function mapYearRow(y: CashflowYearRow, opts: MapYearRowOpts): YearData {
  const { vacRate, mgmtFee } = opts;

  const d = y.ongoing_costs_detail;
  const t = y.tax_deduction_detail;
  const salary = y.salary;
  const incomeTaxCalcVal = y.income_tax;
  const rental = y.rental_income;
  const interestPaid = y.mortgage_interest;
  const principalPaid = y.mortgage_principal;
  // Match backend's deductible_expenses exactly (7 items). Missing landlord_insurance
  // or management_fee would undercount Holding and drift from backend's tax engine.
  const ongoingCostsVal = d
    ? d.council_rates + d.water_rates + d.building_insurance + d.landlord_insurance
      + d.strata_fees + d.maintenance_cost + d.management_fee
    : y.property_costs;
  const depDiv43 = t ? t.depreciation_building : 0;
  const depDiv40 = t ? t.depreciation_plant : 0;
  const totalDeductionsVal = t ? t.total_deductions : 0;
  const taxSavedVal = y.tax_saving;

  const gearingVal = rental - interestPaid - ongoingCostsVal - depDiv43 - depDiv40;
  const grossIncomeVal = salary + rental;
  const netCashflowVal = salary + rental - ongoingCostsVal - y.mortgage_repayment - incomeTaxCalcVal;
  const propertyCashflowVal = rental - ongoingCostsVal - interestPaid - principalPaid + taxSavedVal;
  const netEquityVal = y.equity + y.offset_balance;

  const vacancyVal = rental * vacRate;
  const mgmtVal = (rental - vacancyVal) * mgmtFee;

  return {
    year: y.year + 1,
    propertyValue: y.property_value,
    loanBalance: y.loan_balance,
    equity: y.equity,
    rentalIncome: rental,
    vacancy: vacancyVal,
    managementFee: d?.management_fee ?? mgmtVal,
    netRentalIncome: rental - vacancyVal - mgmtVal,
    loanRepayment: y.mortgage_repayment,
    interestPortion: interestPaid,
    principalPortion: principalPaid,
    councilRates: d?.council_rates ?? 0,
    waterRates: d?.water_rates ?? 0,
    insurance: d?.building_insurance ?? 0,
    landlordInsurance: d?.landlord_insurance ?? 0,
    maintenance: d?.maintenance_cost ?? 0,
    strataFees: d?.strata_fees ?? 0,
    totalExpenses: ongoingCostsVal + interestPaid,
    preTaxCashflow: rental - ongoingCostsVal - interestPaid,
    depDiv43,
    depDiv40,
    otherDeductibles: t ? t.deductible_expenses : 0,
    totalDeductions: totalDeductionsVal,
    rentalLossOrGain: t ? t.net_rental_income : 0,
    taxBenefit: taxSavedVal,
    afterTaxCashflow: rental - ongoingCostsVal - interestPaid + taxSavedVal,
    salary,
    otherIncome: 0,
    ongoingCosts: ongoingCostsVal,
    gearing: gearingVal,
    totalIncomeAll: grossIncomeVal,
    totalDeductionsForTax: totalDeductionsVal,
    taxableIncomeCalc: grossIncomeVal - totalDeductionsVal,
    incomeTaxCalc: incomeTaxCalcVal,
    incomeTaxWithout: 0,
    taxSaved: taxSavedVal,
    grossIncome: grossIncomeVal,
    afterTaxIncome: grossIncomeVal - incomeTaxCalcVal,
    cfTotalIncome: salary + rental - interestPaid - ongoingCostsVal,
    netCashflow: netCashflowVal,
    propertyCashflow: propertyCashflowVal,
    offsetBalanceAtYear: y.offset_balance,
    propertyEquity: y.equity,
    netEquity: netEquityVal,
  };
}
