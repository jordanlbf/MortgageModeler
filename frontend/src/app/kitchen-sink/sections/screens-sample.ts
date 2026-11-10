import type { AmortisationSource } from "@/hooks/useAmortisationState";
import type { CashflowSource } from "@/hooks/useCashflowState";
import type { GrantsSource } from "@/hooks/useGrantsState";
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

// ── Grants ────────────────────────────────────────

type SampleScheme = GrantsSource["schemes"][number];

/** A generic scheme: fills the display fields from a few, so each sample stays short. */
/** What each sample scheme is worth on a $600k new home (as the API would estimate it). */
const SAMPLE_VALUES: Record<string, SampleScheme["value"]> = {
  "sample-guarantee": { amount: 25_000, share: null },
  "sample-help": { amount: 35_000, share: 0.4 },
  "sample-super": { amount: 50_000, share: null },
  "sample-grant": { amount: 15_000, share: null },
  "sample-concession-new": { amount: 24_000, share: null },
  "sample-equity": { amount: 0, share: 0.3 },
  "sample-concession": { amount: 12_850, share: null },
  "sample-family": { amount: 35_000, share: null },
  "sample-land": { amount: 0, share: null },
};

function scheme(
  s: Pick<SampleScheme["scheme"], "id" | "name" | "level" | "state" | "category" | "benefit_pill" | "theme"> & Partial<SampleScheme["scheme"]>,
  fails: [string, SampleScheme["result"]["blockers"][number]][] = [],
): SampleScheme {
  return {
    scheme: {
      meta: { deposit: "Any", lmi: "N/A", buyer: "Individual / Joint" },
      benefits: [s.benefit_pill],
      eligibility: ["First home buyer", "Australian citizen or permanent resident", "Live in the home"],
      summary: `You qualify: ${s.benefit_pill.toLowerCase()}.`,
      details: null,
      rules: null,
      valid_from: null,
      valid_to: null,
      ...s,
    },
    result: { eligible: fails.length === 0, reasons: fails.map((f) => f[0]), blockers: fails.map((f) => f[1]) },
    value: SAMPLE_VALUES[s.id] ?? { amount: 0, share: null },
  };
}

/** A new first home in one state, to live in: six schemes fit, three don't (one only just). */
export const GRANTS: GrantsSource = {
  inputs: { state: "QLD", price: 600_000, income: 90_000, propertyType: "new", ownerOcc: true, firstHome: true },
  schemes: [
    scheme({
      id: "sample-guarantee", name: "First Home Guarantee", level: "Federal", state: null, category: "guarantee",
      benefit_pill: "No LMI with 5% deposit", theme: "Buy with a 5% deposit and no lenders mortgage insurance.",
      meta: { deposit: "5%", lmi: "Waived", buyer: "Individual / Joint" },
      rules: ["Price caps vary by state and region", "Loan must be with a participating lender"],
    }),
    scheme({
      id: "sample-help", name: "Help to Buy", level: "Federal", state: null, category: "equity",
      benefit_pill: "Up to 40% equity", theme: "The government co-owns up to 40% of a new home, so you borrow less.",
      meta: { deposit: "2%", lmi: "N/A", buyer: "Individual / Joint" },
    }),
    scheme({
      id: "sample-super", name: "First Home Super Saver", level: "Federal", state: null, category: "super",
      benefit_pill: "Up to $50k from super", theme: "Save for a deposit inside super and withdraw it for your first home.",
    }),
    scheme({
      id: "sample-grant", name: "First Home Owner Grant", level: "State", state: "QLD", category: "grant",
      benefit_pill: "$15,000 grant", theme: "A cash grant for a first home that's newly built.", valid_to: "2027-06-30",
      details: "A one-off payment towards a new home, paid at settlement or when building finishes.",
      rules: ["Must be a new home", "Move in within a year and live there for 6 months"],
    }),
    scheme({
      id: "sample-concession-new", name: "First Home Concession (New Homes)", level: "State", state: "QLD", category: "concession",
      benefit_pill: "Full duty exemption", theme: "No stamp duty on a new first home.",
    }),
    scheme({
      id: "sample-equity", name: "Shared Equity Scheme", level: "State", state: "QLD", category: "equity",
      benefit_pill: "Up to 30% equity", theme: "The state buys a share of the home, so you borrow less.",
    }),
    scheme(
      {
        id: "sample-concession", name: "First Home Concession (Existing Homes)", level: "State", state: "QLD", category: "concession",
        benefit_pill: "Up to $25,000 saved", theme: "Less or no stamp duty on an existing first home.",
      },
      [["Property type must be: existing", { kind: "property_type", options: ["existing"] }]],
    ),
    scheme(
      {
        id: "sample-family", name: "Family Home Guarantee", level: "Federal", state: null, category: "guarantee",
        benefit_pill: "2% deposit, no LMI", theme: "Single parents can buy with a 2% deposit and no LMI.",
      },
      [["Must be a single parent or legal guardian", { kind: "single_parent" }]],
    ),
    scheme(
      {
        id: "sample-land", name: "First Home Vacant Land Concession", level: "State", state: "QLD", category: "concession",
        benefit_pill: "Full duty waiver on land", theme: "No stamp duty on land to build a first home on.",
      },
      [
        ["Property type must be: land", { kind: "property_type", options: ["land"] }],
        ["Property value must be $350,000 or less", { kind: "price", amount: 350_000 }],
      ],
    ),
  ],
};
