"use client";

import { ChevronDown, ChevronRight, Check, Home, Building2, Sparkles, Landmark, Coins, Key, Calculator, Pencil } from "lucide-react";
import type { CashflowState } from "@/hooks/useCashflowState";
import { parseCurrencyCf, formatCurrencyCf } from "@/lib/cashflow-calculations";

// Summary component for completed sections
function SectionSummary({ items }: { items: { label: string; value: string }[] }) {
  return (
    <div className="cf-section-summary">
      {items.map((item, i) => (
        <div key={i} className="cf-summary-item">
          <span className="cf-summary-label">{item.label}</span>
          <span className="cf-summary-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  s: CashflowState;
}

export default function CashflowSidebar({ s }: Props) {
  const propertyUseComplete = s.propertyUse !== null;
  const propertyValue = s.isNewPurchase ? parseCurrencyCf(s.purchasePrice) : parseCurrencyCf(s.currentValue);
  const loanAmount = s.isNewPurchase
    ? parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount)
    : parseCurrencyCf(s.currentLoanBalance);

  return (
    <aside className="cf-sidebar">
      <div className="cf-sidebar-inner">
        {/* Property Use */}
        <div className={`cf-section ${propertyUseComplete ? "cf-section-complete" : ""}`}>
          <button className="cf-section-header" onClick={() => s.toggleSection("propertyUse")}>
            <div className="cf-section-title">
              <div className={`cf-section-icon ${propertyUseComplete ? "complete" : ""}`}>
                {propertyUseComplete ? <Check size={14} /> : <Home size={14} />}
              </div>
              <span>Property Use</span>
            </div>
            {propertyUseComplete && (
              <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("propertyUse"); }}>
                <Pencil size={12} />
              </span>
            )}
            {!propertyUseComplete && (
              s.expandedSections.has("propertyUse") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>
          {propertyUseComplete && (
            <div className="cf-section-completed-content">
              <div className="cf-completed-badge">
                {s.propertyUse === "investment" ? "Investment Property" : "Owner-Occupier (PPOR)"}
              </div>
            </div>
          )}
          {!propertyUseComplete && s.expandedSections.has("propertyUse") && (
            <div className="cf-section-content">
              <div className="cf-button-group">
                <button className={`cf-button-option ${s.propertyUse === "investment" ? "active" : ""}`}
                  onClick={() => {
                    s.setPropertyUse("investment");
                    s.setPurchaseMode(null);
                    s.setExpandedSections(prev => { const next = new Set(prev); next.delete("propertyUse"); next.add("purchaseMode"); return next; });
                  }}>Investment</button>
                <button className={`cf-button-option ${s.propertyUse === "ppor" ? "active" : ""}`}
                  onClick={() => {
                    s.setPropertyUse("ppor");
                    s.setPurchaseMode(null);
                    s.setExpandedSections(prev => { const next = new Set(prev); next.delete("propertyUse"); next.add("purchaseMode"); return next; });
                  }}>Owner-Occupier</button>
              </div>
            </div>
          )}
        </div>

        {/* Purchase Mode */}
        {s.propertyUse && (
          <div className={`cf-section ${s.purchaseMode ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("purchaseMode")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.purchaseMode ? "complete" : ""}`}>
                  {s.purchaseMode ? <Check size={14} /> : <Sparkles size={14} />}
                </div>
                <span>Purchase Type</span>
              </div>
              {s.purchaseMode && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("purchaseMode"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.purchaseMode && (
                s.expandedSections.has("purchaseMode") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.purchaseMode && (
              <div className="cf-section-completed-content">
                <div className="cf-completed-badge">
                  {s.purchaseMode === "new" ? "New Purchase" : "Existing Property"}
                </div>
              </div>
            )}
            {!s.purchaseMode && s.expandedSections.has("purchaseMode") && (
              <div className="cf-section-content">
                <div className="cf-button-group">
                  <button className={`cf-button-option ${s.purchaseMode === "new" ? "active" : ""}`}
                    onClick={() => {
                      s.setPurchaseMode("new");
                      s.setExpandedSections(prev => { const next = new Set(prev); next.delete("purchaseMode"); next.add("property"); return next; });
                    }}>New Purchase</button>
                  <button className={`cf-button-option ${s.purchaseMode === "existing" ? "active" : ""}`}
                    onClick={() => {
                      s.setPurchaseMode("existing");
                      s.setExpandedSections(prev => { const next = new Set(prev); next.delete("purchaseMode"); next.add("property"); return next; });
                    }}>Existing Property</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Property Details */}
        {s.purchaseMode && (
          <div className={`cf-section ${s.propertyComplete ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("property")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.propertyComplete ? "complete" : ""}`}>
                  {s.propertyComplete ? <Check size={14} /> : <Building2 size={14} />}
                </div>
                <span>Property</span>
              </div>
              {s.propertyComplete && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("property"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.propertyComplete && (
                s.expandedSections.has("property") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.propertyComplete && (
              <div className="cf-section-completed-content">
                <SectionSummary items={s.isNewPurchase ? [
                  { label: "Price", value: formatCurrencyCf(parseCurrencyCf(s.purchasePrice)) },
                  { label: "Deposit", value: formatCurrencyCf(parseCurrencyCf(s.depositAmount)) },
                  { label: "LVR", value: `${((1 - parseCurrencyCf(s.depositAmount) / parseCurrencyCf(s.purchasePrice)) * 100).toFixed(0)}%` },
                ] : [
                  { label: "Value", value: formatCurrencyCf(parseCurrencyCf(s.currentValue)) },
                  { label: "Loan", value: formatCurrencyCf(parseCurrencyCf(s.currentLoanBalance)) },
                  { label: "Equity", value: formatCurrencyCf(parseCurrencyCf(s.currentValue) - parseCurrencyCf(s.currentLoanBalance)) },
                ]} />
              </div>
            )}
            {!s.propertyComplete && s.expandedSections.has("property") && (
              <div className="cf-section-content">
                {s.isNewPurchase ? (
                  <>
                    <div className="cf-field">
                      <label className="cf-label">Purchase Price</label>
                      <input type="text" className="cf-input"
                        value={`$${parseCurrencyCf(s.purchasePrice).toLocaleString()}`}
                        onChange={(e) => s.setPurchasePrice(e.target.value)} />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Deposit Amount</label>
                      <input type="text" className="cf-input"
                        value={`$${parseCurrencyCf(s.depositAmount).toLocaleString()}`}
                        onChange={(e) => s.setDepositAmount(e.target.value)} />
                    </div>
                    <div className="cf-field-row">
                      <div className="cf-field">
                        <label className="cf-label">Loan Amount</label>
                        <div className="cf-input-display">
                          {formatCurrencyCf(parseCurrencyCf(s.purchasePrice) - parseCurrencyCf(s.depositAmount))}
                        </div>
                      </div>
                      <div className="cf-field">
                        <label className="cf-label">LVR</label>
                        <div className="cf-input-display">
                          {((1 - parseCurrencyCf(s.depositAmount) / parseCurrencyCf(s.purchasePrice)) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="cf-field">
                      <label className="cf-label">Current Value</label>
                      <input type="text" className="cf-input"
                        value={`$${parseCurrencyCf(s.currentValue).toLocaleString()}`}
                        onChange={(e) => s.setCurrentValue(e.target.value)} />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Original Purchase Price</label>
                      <input type="text" className="cf-input"
                        value={`$${parseCurrencyCf(s.originalPurchasePrice).toLocaleString()}`}
                        onChange={(e) => s.setOriginalPurchasePrice(e.target.value)} />
                    </div>
                    <div className="cf-field">
                      <label className="cf-label">Current Loan Balance</label>
                      <input type="text" className="cf-input"
                        value={`$${parseCurrencyCf(s.currentLoanBalance).toLocaleString()}`}
                        onChange={(e) => s.setCurrentLoanBalance(e.target.value)} />
                    </div>
                  </>
                )}
                <button className="cf-continue" onClick={() => {
                  s.setPropertyComplete(true);
                  s.setExpandedSections(prev => { const next = new Set(prev); next.delete("property"); next.add("loan"); return next; });
                }}>Continue</button>
              </div>
            )}
          </div>
        )}

        {/* Loan Details */}
        {s.propertyComplete && (
          <div className={`cf-section ${s.loanComplete ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("loan")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.loanComplete ? "complete" : ""}`}>
                  {s.loanComplete ? <Check size={14} /> : <Landmark size={14} />}
                </div>
                <span>Loan</span>
              </div>
              {s.loanComplete && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("loan"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.loanComplete && (
                s.expandedSections.has("loan") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.loanComplete && (
              <div className="cf-section-completed-content">
                <SectionSummary items={[
                  { label: "Rate", value: `${s.interestRate}%` },
                  { label: "Term", value: `${s.loanTerm}yr` },
                  { label: "Type", value: s.loanType === "principal-interest" ? "P&I" : `IO (${s.ioPeriod}yr)` },
                  ...(s.hasOffset ? [{ label: "Offset", value: formatCurrencyCf(parseCurrencyCf(s.offsetBalance)) }] : []),
                ]} />
              </div>
            )}
            {!s.loanComplete && s.expandedSections.has("loan") && (
              <div className="cf-section-content">
                <div className="cf-field-row">
                  <div className="cf-field">
                    <label className="cf-label">Interest Rate (%)</label>
                    <input type="text" className="cf-input" value={s.interestRate}
                      onChange={(e) => s.setInterestRate(e.target.value)} />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Loan Term (years)</label>
                    <input type="text" className="cf-input" value={s.loanTerm}
                      onChange={(e) => s.setLoanTerm(e.target.value)} />
                  </div>
                </div>
                <div className="cf-field">
                  <label className="cf-label">Loan Type</label>
                  <div className="cf-button-group">
                    <button className={`cf-button-option ${s.loanType === "principal-interest" ? "active" : ""}`}
                      onClick={() => s.setLoanType("principal-interest")}>P&I</button>
                    <button className={`cf-button-option ${s.loanType === "interest-only" ? "active" : ""}`}
                      onClick={() => s.setLoanType("interest-only")}>Interest Only</button>
                  </div>
                </div>
                {s.loanType === "interest-only" && (
                  <div className="cf-field">
                    <label className="cf-label">IO Period (years)</label>
                    <input type="text" className="cf-input" value={s.ioPeriod}
                      onChange={(e) => s.setIoPeriod(e.target.value)} />
                  </div>
                )}
                <div className="cf-toggle-row">
                  <label className="cf-toggle">
                    <input type="checkbox" checked={s.hasOffset}
                      onChange={(e) => s.setHasOffset(e.target.checked)} />
                    <span className="cf-toggle-slider"></span>
                  </label>
                  <span className="cf-toggle-label">Offset Account</span>
                </div>
                {s.hasOffset && (
                  <div className="cf-field">
                    <label className="cf-label">Offset Balance</label>
                    <input type="text" className="cf-input"
                      value={`$${parseCurrencyCf(s.offsetBalance).toLocaleString()}`}
                      onChange={(e) => s.setOffsetBalance(e.target.value)} />
                  </div>
                )}
                <div className="cf-field">
                  <label className="cf-label">Extra Repayments (monthly)</label>
                  <input type="text" className="cf-input"
                    value={`$${parseCurrencyCf(s.extraRepayments).toLocaleString()}`}
                    onChange={(e) => s.setExtraRepayments(e.target.value)} />
                </div>
                <button className="cf-continue" onClick={() => {
                  s.setLoanComplete(true);
                  s.setExpandedSections(prev => { const next = new Set(prev); next.delete("loan"); next.add("costs"); return next; });
                }}>Continue</button>
              </div>
            )}
          </div>
        )}

        {/* Ongoing Costs */}
        {s.loanComplete && (
          <div className={`cf-section ${s.costsComplete ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("costs")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.costsComplete ? "complete" : ""}`}>
                  {s.costsComplete ? <Check size={14} /> : <Coins size={14} />}
                </div>
                <span>Costs</span>
              </div>
              {s.costsComplete && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("costs"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.costsComplete && (
                s.expandedSections.has("costs") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.costsComplete && (() => {
              const totalAnnual = parseCurrencyCf(s.councilRates) + parseCurrencyCf(s.waterRates) +
                parseCurrencyCf(s.insurance) + (s.hasStrata ? parseCurrencyCf(s.strataFees) * 4 : 0);
              return (
                <div className="cf-section-completed-content">
                  <SectionSummary items={[
                    { label: "Annual", value: formatCurrencyCf(totalAnnual) },
                    { label: "Maint.", value: `${s.maintenance}%` },
                    ...(s.hasStrata ? [{ label: "Strata", value: `${formatCurrencyCf(parseCurrencyCf(s.strataFees))}/qtr` }] : []),
                  ]} />
                </div>
              );
            })()}
            {!s.costsComplete && s.expandedSections.has("costs") && (
              <div className="cf-section-content">
                <div className="cf-field-row">
                  <div className="cf-field">
                    <label className="cf-label">Council Rates (p.a.)</label>
                    <input type="text" className="cf-input"
                      value={`$${parseCurrencyCf(s.councilRates).toLocaleString()}`}
                      onChange={(e) => s.setCouncilRates(e.target.value)} />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Water Rates (p.a.)</label>
                    <input type="text" className="cf-input"
                      value={`$${parseCurrencyCf(s.waterRates).toLocaleString()}`}
                      onChange={(e) => s.setWaterRates(e.target.value)} />
                  </div>
                </div>
                <div className="cf-field-row">
                  <div className="cf-field">
                    <label className="cf-label">Insurance (p.a.)</label>
                    <input type="text" className="cf-input"
                      value={`$${parseCurrencyCf(s.insurance).toLocaleString()}`}
                      onChange={(e) => s.setInsurance(e.target.value)} />
                  </div>
                  <div className="cf-field">
                    <label className="cf-label">Maintenance (%)</label>
                    <input type="text" className="cf-input" value={s.maintenance}
                      onChange={(e) => s.setMaintenance(e.target.value)} />
                  </div>
                </div>
                <div className="cf-toggle-row">
                  <label className="cf-toggle">
                    <input type="checkbox" checked={s.hasStrata}
                      onChange={(e) => s.setHasStrata(e.target.checked)} />
                    <span className="cf-toggle-slider"></span>
                  </label>
                  <span className="cf-toggle-label">Strata/Body Corp</span>
                </div>
                {s.hasStrata && (
                  <div className="cf-field">
                    <label className="cf-label">Strata Fees (quarterly)</label>
                    <input type="text" className="cf-input"
                      value={`$${parseCurrencyCf(s.strataFees).toLocaleString()}`}
                      onChange={(e) => s.setStrataFees(e.target.value)} />
                  </div>
                )}
                <button className="cf-continue" onClick={() => {
                  s.setCostsComplete(true);
                  if (s.isInvestment) {
                    s.setExpandedSections(prev => { const next = new Set(prev); next.delete("costs"); next.add("rental"); return next; });
                  }
                }}>{s.isInvestment ? "Continue" : "Calculate"}</button>
              </div>
            )}
          </div>
        )}

        {/* Rental Income */}
        {s.isInvestment && s.costsComplete && (
          <div className={`cf-section ${s.rentalComplete ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("rental")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.rentalComplete ? "complete" : ""}`}>
                  {s.rentalComplete ? <Check size={14} /> : <Key size={14} />}
                </div>
                <span>Rental</span>
              </div>
              {s.rentalComplete && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("rental"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.rentalComplete && (
                s.expandedSections.has("rental") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.rentalComplete && (
              <div className="cf-section-completed-content">
                <SectionSummary items={[
                  { label: "Rent", value: `${formatCurrencyCf(parseCurrencyCf(s.weeklyRent))}/wk` },
                  { label: "Vacancy", value: `${s.vacancyRate}%` },
                  ...(s.usePropertyManager ? [{ label: "PM Fee", value: `${s.managementFee}%` }] : []),
                ]} />
              </div>
            )}
            {!s.rentalComplete && s.expandedSections.has("rental") && (
              <div className="cf-section-content">
                <div className="cf-field">
                  <label className="cf-label">Weekly Rent</label>
                  <input type="text" className="cf-input"
                    value={`$${parseCurrencyCf(s.weeklyRent).toLocaleString()}`}
                    onChange={(e) => s.setWeeklyRent(e.target.value)} />
                </div>
                <div className="cf-field">
                  <label className="cf-label">Vacancy Rate (%)</label>
                  <input type="text" className="cf-input" value={s.vacancyRate}
                    onChange={(e) => s.setVacancyRate(e.target.value)} />
                </div>
                <div className="cf-toggle-row">
                  <label className="cf-toggle">
                    <input type="checkbox" checked={s.usePropertyManager}
                      onChange={(e) => s.setUsePropertyManager(e.target.checked)} />
                    <span className="cf-toggle-slider"></span>
                  </label>
                  <span className="cf-toggle-label">Property Manager</span>
                </div>
                {s.usePropertyManager && (
                  <div className="cf-field">
                    <label className="cf-label">Management Fee (%)</label>
                    <input type="text" className="cf-input" value={s.managementFee}
                      onChange={(e) => s.setManagementFee(e.target.value)} />
                  </div>
                )}
                <button className="cf-continue" onClick={() => {
                  s.setRentalComplete(true);
                  s.setExpandedSections(prev => { const next = new Set(prev); next.delete("rental"); next.add("tax"); return next; });
                }}>Continue</button>
              </div>
            )}
          </div>
        )}

        {/* Tax Profile */}
        {s.isInvestment && s.rentalComplete && (
          <div className={`cf-section ${s.taxComplete ? "cf-section-complete" : ""}`}>
            <button className="cf-section-header" onClick={() => s.toggleSection("tax")}>
              <div className="cf-section-title">
                <div className={`cf-section-icon ${s.taxComplete ? "complete" : ""}`}>
                  {s.taxComplete ? <Check size={14} /> : <Calculator size={14} />}
                </div>
                <span>Tax</span>
              </div>
              {s.taxComplete && (
                <span role="button" tabIndex={0} className="cf-edit-btn" onClick={(e) => { e.stopPropagation(); s.resetSection("tax"); }}>
                  <Pencil size={12} />
                </span>
              )}
              {!s.taxComplete && (
                s.expandedSections.has("tax") ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>
            {s.taxComplete && (
              <div className="cf-section-completed-content">
                <SectionSummary items={[
                  { label: "Income", value: formatCurrencyCf(parseCurrencyCf(s.taxableIncome)) },
                  { label: "Deprec.", value: formatCurrencyCf(parseCurrencyCf(s.depreciation)) },
                  { label: "Growth", value: `${s.capitalGrowth}%` },
                ]} />
              </div>
            )}
            {!s.taxComplete && s.expandedSections.has("tax") && (
              <div className="cf-section-content">
                <div className="cf-field">
                  <label className="cf-label">Taxable Income (p.a.)</label>
                  <input type="text" className="cf-input"
                    value={`$${parseCurrencyCf(s.taxableIncome).toLocaleString()}`}
                    onChange={(e) => s.setTaxableIncome(e.target.value)} />
                </div>
                <div className="cf-field">
                  <label className="cf-label">Depreciation (p.a.)</label>
                  <input type="text" className="cf-input"
                    value={`$${parseCurrencyCf(s.depreciation).toLocaleString()}`}
                    onChange={(e) => s.setDepreciation(e.target.value)} />
                </div>
                <div className="cf-field">
                  <label className="cf-label">Capital Growth Assumption (%)</label>
                  <input type="text" className="cf-input" value={s.capitalGrowth}
                    onChange={(e) => s.setCapitalGrowth(e.target.value)} />
                </div>
                <button className="cf-continue" onClick={() => s.setTaxComplete(true)}>
                  Calculate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
