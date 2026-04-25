import type { ColumnConfig } from "@/components/ui/ColumnDrawer";
import type { ViewMode } from "@/lib/cashflow-types";

export const COLUMN_CONFIGS: Record<ViewMode, ColumnConfig[]> = {
  summary: [
    { key: "salary",   label: "Salary",         group: "Income" },
    { key: "rent",     label: "Rental Income",  group: "Income" },
    { key: "totalIn",  label: "Total Income",   group: "Totals" },
    { key: "holding",  label: "Holding Costs",  group: "Expenses" },
    { key: "repay",    label: "Repayments",     group: "Expenses" },
    { key: "tax",      label: "Tax Paid",       group: "Expenses" },
    { key: "totalOut", label: "Total Expenses", group: "Totals" },
    { key: "net",      label: "Net Cashflow",   group: "Totals" },
  ],
  property: [
    { key: "rent",        label: "Rental Income", group: "Gearing" },
    { key: "deductions",  label: "Deductions",    group: "Gearing" },
    { key: "netGearing",  label: "Gearing",       group: "Gearing" },
    { key: "taxSaved",    label: "Tax Position",  group: "Cashflow" },
    { key: "costs",       label: "Costs",         group: "Cashflow" },
    { key: "repayments",  label: "Repayments",    group: "Cashflow" },
    { key: "netCashflow", label: "Cashflow",      group: "Cashflow" },
  ],
  tax: [
    { key: "holding",    label: "Holding Costs",    group: "Deductions" },
    { key: "interest",   label: "Interest",         group: "Deductions" },
    { key: "depr",       label: "Depreciation",     group: "Deductions" },
    { key: "totalDed",   label: "Total Deductions", group: "Deductions" },
    { key: "taxSaved",   label: "Tax Effect",       group: "Result" },
    { key: "bracket",    label: "Marginal Bracket", group: "Result" },
    { key: "netTaxCost", label: "Net Tax Cost",     group: "Result" },
  ],
  equity: [
    { key: "propertyValue", label: "Property Value", group: "Position" },
    { key: "loanBalance",   label: "Loan Balance",   group: "Position" },
    { key: "offsetBalance", label: "Offset Balance", group: "Position" },
    { key: "netEquity",     label: "Net Equity",     group: "Outcomes" },
    { key: "lvr",           label: "LVR",            group: "Outcomes" },
  ],
  deductions: [
    { key: "holding",   label: "Holding Costs",      group: "Operating" },
    { key: "interest",  label: "Interest",           group: "Financing" },
    { key: "div43",     label: "Div 43 (Capital)",   group: "Depreciation" },
    { key: "div40",     label: "Div 40 (Plant)",     group: "Depreciation" },
    { key: "totalDepr", label: "Total Depreciation", group: "Depreciation" },
    { key: "totalDed",  label: "Total",              group: "Totals" },
  ],
  costs: [
    { key: "councilRates",      label: "Council Rates",      group: "Rates & Utilities" },
    { key: "waterRates",        label: "Water Rates",        group: "Rates & Utilities" },
    { key: "buildingInsurance", label: "Building Insurance", group: "Insurance" },
    { key: "landlordInsurance", label: "Landlord Insurance", group: "Insurance" },
    { key: "maintenance",       label: "Maintenance",        group: "Property Care" },
    { key: "strataFees",        label: "Strata Fees",        group: "Property Care" },
    { key: "managementFee",     label: "Management Fee",     group: "Property Care" },
    { key: "totalCosts",        label: "Total",              group: "Totals" },
  ],
};

export const defaultVisibility = (config: ColumnConfig[]): Record<string, boolean> =>
  Object.fromEntries(config.map((c) => [c.key, true]));
