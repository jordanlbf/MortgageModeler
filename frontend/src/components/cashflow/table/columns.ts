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
    { key: "rent",        label: "Rental Income", group: "Income" },
    { key: "holding",     label: "Holding Costs", group: "Expenses" },
    { key: "depr",        label: "Depreciation",  group: "Expenses" },
    { key: "netGearing",  label: "Net Gearing",   group: "Outcomes" },
    { key: "taxSaved",    label: "Tax Saved",     group: "Outcomes" },
    { key: "netCashflow", label: "Net Cashflow",  group: "Outcomes" },
  ],
  tax: [
    { key: "holding",    label: "Holding Costs",    group: "Deductions" },
    { key: "interest",   label: "Interest",         group: "Deductions" },
    { key: "depr",       label: "Depreciation",     group: "Deductions" },
    { key: "totalDed",   label: "Total Deductions", group: "Deductions" },
    { key: "taxSaved",   label: "Tax Saved",        group: "Result" },
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
};

export const defaultVisibility = (config: ColumnConfig[]): Record<string, boolean> =>
  Object.fromEntries(config.map((c) => [c.key, true]));
