import type { CashflowSource } from "@/hooks/useCashflowState";
import type { PurchaseCostsSource } from "@/hooks/usePurchaseCostsState";
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
    purchaseMode: "new",
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
