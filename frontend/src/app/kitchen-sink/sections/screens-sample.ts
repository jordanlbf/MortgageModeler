import type { AmortisationSource } from "@/hooks/useAmortisationState";
import type { CashflowSource } from "@/hooks/useCashflowState";
import type { PurchaseCostsSource } from "@/hooks/usePurchaseCostsState";
import type { TaxSource } from "@/hooks/useTaxState";
import type { YearData } from "@/lib/cashflow-types";

/*
 * Generic sample data for the Screens page: round numbers on simple growth
 * curves, not a real property or a real calculation. It only exists so the
 * real screens can render without the API. Tune the look in the components,
 * not here.
 */

const YEARS = 30;
const GROWTH = 1.03;

/** A 30-year projection on round numbers: $500k property, $400k loan, $100k salary, $500/wk rent. */
function sampleYears(): YearData[] {
  return Array.from({ length: YEARS }, (_, i) => {
    const g = GROWTH ** i;
    const r = (n: number) => Math.round(n);
    const propertyValue = r(500_000 * g);
    const loanBalance = Math.max(0, 400_000 - 8_000 * i);
    const interestPortion = r(loanBalance * 0.06);
    const principalPortion = loanBalance > 0 ? 8_000 : 0;
    const loanRepayment = interestPortion + principalPortion;
    const salary = r(100_000 * g);
    const rentalIncome = r(26_000 * g);
    const managementFee = r(rentalIncome * 0.07);
    const councilRates = r(2_000 * g);
    const waterRates = r(1_000 * g);
    const insurance = r(1_500 * g);
    const landlordInsurance = r(500 * g);
    const maintenance = r(2_500 * g);
    const ongoingCosts = councilRates + waterRates + insurance + landlordInsurance + maintenance + managementFee;
    const depDiv43 = 5_000;
    const depDiv40 = r(3_000 * 0.8 ** i);
    const totalDeductions = interestPortion + ongoingCosts + depDiv43 + depDiv40;
    const rentalLossOrGain = rentalIncome - totalDeductions;
    const taxableIncomeCalc = salary + rentalLossOrGain;
    const incomeTaxCalc = r(taxableIncomeCalc * 0.3);
    const incomeTaxWithout = r(salary * 0.3);
    const taxSaved = incomeTaxWithout - incomeTaxCalc;
    const preTaxCashflow = rentalIncome - ongoingCosts - loanRepayment;
    const propertyCashflow = preTaxCashflow + taxSaved;
    const netCashflow = salary + rentalIncome - ongoingCosts - loanRepayment - incomeTaxCalc;
    const netEquity = propertyValue - loanBalance;
    return {
      year: i + 1,
      propertyValue,
      loanBalance,
      equity: netEquity,
      rentalIncome,
      vacancy: 0,
      managementFee,
      netRentalIncome: rentalIncome - managementFee,
      loanRepayment,
      interestPortion,
      principalPortion,
      councilRates,
      waterRates,
      insurance,
      landlordInsurance,
      maintenance,
      strataFees: 0,
      totalExpenses: ongoingCosts + loanRepayment,
      preTaxCashflow,
      depDiv43,
      depDiv40,
      otherDeductibles: 0,
      totalDeductions,
      rentalLossOrGain,
      taxBenefit: taxSaved,
      afterTaxCashflow: propertyCashflow,
      salary,
      otherIncome: 0,
      ongoingCosts,
      gearing: rentalLossOrGain,
      totalIncomeAll: salary + rentalIncome,
      totalDeductionsForTax: totalDeductions,
      taxableIncomeCalc,
      incomeTaxCalc,
      incomeTaxWithout,
      taxSaved,
      grossIncome: salary + rentalIncome,
      afterTaxIncome: salary + rentalIncome - incomeTaxCalc,
      cfTotalIncome: salary + rentalIncome,
      netCashflow,
      propertyCashflow,
      offsetBalanceAtYear: 0,
      propertyEquity: netEquity,
      netEquity,
    };
  });
}

/** Cashflow wizard: nothing chosen yet, so the step shows its placeholders. */
export const CASHFLOW_WIZARD: CashflowSource = {};

/** Cashflow output: a finished investment property on the sample projection. */
export const CASHFLOW_OUTPUT: CashflowSource = {
  initial: {
    propertyUse: "investment",
    propertyType: "house",
    purchaseMode: "new",
    newBuild: false,
    purchasePrice: "$500,000",
    depositAmount: "$100,000",
    setupComplete: true,
    loanComplete: true,
    costsComplete: true,
    rentalComplete: true,
    incomeComplete: true,
    depreciationComplete: true,
  },
  yearData: sampleYears(),
};

/** Purchase Costs: $500k price, $100k deposit, round-number costs. */
export const PURCHASE_COSTS: PurchaseCostsSource = {
  price: 500_000,
  depositAmount: 100_000,
  data: {
    stamp_duty_base: 15_000,
    stamp_duty_concession: 0,
    stamp_duty_payable: 15_000,
    lmi_base: 0,
    lmi_waived: false,
    lmi_payable: 0,
    legal_fees: 1_500,
    registration_fee: 1_000,
    mortgage_registration_fee: 200,
    building_pest_inspection: 500,
    loan_establishment_fee: 300,
    total_fees: 3_500,
    grants_applied: [],
    total_grant_savings: 0,
    equity_contribution: 0,
    effective_loan_amount: 400_000,
    deposit_amount: 100_000,
    min_deposit_percent: 5,
    total_upfront_cost: 118_500,
    lvr: 0.8,
  },
};

/** Tax: a $110k salary, a negatively geared rental and a HELP debt. Figures are the compute service's answers for these inputs. */
export const TAX: TaxSource = {
  inputs: { salary: 110_000, rental: 28_600, rentalDeductions: 34_500, hecsBal: 35_000, phi: true },
  results: {
    breakdown: {
      assessable_income: 138_600,
      total_deductions: 34_500,
      taxable_income: 104_100,
      repayment_income: 110_000,
      mls_income: 110_000,
      net_investment_loss: 5_900,
      income_tax: 22_018,
      medicare_levy: 2_082,
      medicare_levy_surcharge: 0,
      hecs_repayment: 6_450,
      lito: 0,
      sapto_offset: 0,
      franking_offset: 0,
      total_offsets: 0,
      total_tax: 30_550,
      net_income: 73_550,
      marginal_rate: 0.3,
      effective_rate: 0.2204,
    },
    keepPer1000: 530,
    claimSaves: 470,
    property: { net: -5_900, taxChange: -1_888 },
  },
};

/**
 * Amortisation: a $400k loan on a $500k property at 6% over 30 years, repaid
 * monthly, with 3% growth. A plain repayment schedule so the screen renders
 * without the API; tune the look in the components, not here.
 */
function sampleSchedule(offsetStart = 0, offsetAdd = 0): AmortisationSource["data"] {
  const price = 500_000, deposit = 100_000, loan = price - deposit;
  const r = 0.06 / 12, n = 30 * 12;
  const payment = (loan * r) / (1 - (1 + r) ** -n);
  const round = (x: number) => Math.round(x * 100) / 100;
  let balance = loan, interestToDate = 0, offset = offsetStart, periods = n;
  const rows = [];
  const chart = [{ year: 0, balance: loan, total_interest: 0, property_value: price, equity: deposit, offset_balance: 0 }];
  for (let p = 1; p <= n; p++) {
    if (balance <= 0) { periods = p - 1; break; }
    const interest = Math.max(0, balance - offset) * r;
    const principal = Math.min(balance, payment - interest);
    const opening = balance;
    balance = Math.max(0, balance - principal);
    interestToDate += interest;
    rows.push({
      period: p, opening_balance: round(opening), interest: round(interest), principal_paid: round(principal), extra_paid: 0,
      closing_balance: round(balance), annual_rate: 0.06, scheduled_repayment: round(payment), offset_balance: round(offset),
    });
    offset += offsetAdd;
    if (p % 12 === 0) {
      const value = Math.round(price * 1.03 ** (p / 12));
      chart.push({ year: p / 12, balance: round(balance), total_interest: round(interestToDate), property_value: value, equity: Math.round(value - balance), offset_balance: round(offset) });
    }
  }
  return {
    summary: { purchase_price: price, deposit, loan_amount: loan, lvr: loan / price, annual_appreciation: 0.03 },
    payment: round(payment),
    total_interest: round(interestToDate),
    total_periods: periods,
    rows,
    chart_data: chart,
  };
}

export const AMORTISATION: AmortisationSource = {
  inputs: { purchasePrice: 500_000, deposit: 100_000, rate: 6, years: 30, appreciation: 3, frequency: "monthly" },
  data: sampleSchedule(),
};

/** The same loan with $50k in an offset account and $500 added a month, plus the loan without it. */
export const AMORTISATION_OFFSET: AmortisationSource = {
  inputs: { ...AMORTISATION.inputs, offsetBalance: 50_000, offsetContribution: 500 },
  data: sampleSchedule(50_000, 500),
  baseline: sampleSchedule(),
};
