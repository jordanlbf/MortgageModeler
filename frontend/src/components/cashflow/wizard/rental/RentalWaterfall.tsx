"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars, formatDollarsSigned } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { Section } from "../loan/parts";
import { DEFAULT_FEE, DEFAULT_VACANCY, percentChange, rentalModel, toggleManager } from "./model";
import { RentalFigures, RentBasis, weeksLabel } from "./parts";

/**
 * Net income leads; below is a short P&L where each input sits beside the
 * yearly dollars it adds or takes away.
 */
export default function RentalWaterfall({ s }: { s: CashflowState }) {
  const m = rentalModel(s);

  return (
    <div className="@container flex flex-col">
      <Section first>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1">
            <div className="flex flex-col gap-1">
              <Label variant="caps" asChild><span>Net rental income</span></Label>
              <p className="text-[28px] font-semibold leading-none text-brand tabular-nums">
                {formatDollars(Math.round(m.net)) || "$0"}
                <span className="ml-1 text-[14px] font-medium text-fg-tertiary">/ yr</span>
              </p>
            </div>
            <p className="text-[13px] text-fg-tertiary tabular-nums">
              {formatDollars(Math.round(m.net / 12)) || "$0"} / mo · {formatDollars(Math.round(m.net / 52)) || "$0"} / wk
            </p>
          </div>
          <RentBasis m={m} />
        </div>
      </Section>

      <Section>
        <ul className="flex flex-col">
          <Row label="Weekly rent" hint="Gross, before vacancy and fees" amount={m.gross}>
            <Field
              id="rent-weekly"
              value={s.weeklyRent}
              placeholder={formatDollarsSigned(m.estimateWeekly || 500)}
              suffix="/wk"
              ariaLabel="Weekly rent"
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                s.setWeeklyRent(raw ? formatDollarsSigned(Number(raw)) : "");
              }}
            />
          </Row>
          <Row label="Vacancy" hint={`% of the year empty · ${weeksLabel(m.weeksVacant)}`} amount={-m.vacancyLoss}>
            <Field id="rent-vacancy" value={s.vacancyRate} placeholder={String(DEFAULT_VACANCY)} suffix="%" ariaLabel="Vacancy rate" onChange={percentChange(s.setVacancyRate)} />
          </Row>
          <Row
            label="Property manager"
            hint={s.usePropertyManager ? "% of rent collected" : "Self-managed"}
            amount={s.usePropertyManager ? -m.management : undefined}
            lead={
              <Switch
                checked={s.usePropertyManager}
                onCheckedChange={(on) => toggleManager(s, on)}
                aria-label="Use a property manager"
              />
            }
          >
            {s.usePropertyManager && (
              <Field id="rent-fee" value={s.managementFee} placeholder={String(DEFAULT_FEE)} suffix="%" ariaLabel="Management fee" onChange={percentChange(s.setManagementFee)} />
            )}
          </Row>
        </ul>
      </Section>

      <RentalFigures m={m} />
    </div>
  );
}

function Row({ label, hint, amount, lead, children }: { label: string; hint: string; amount?: number; lead?: ReactNode; children?: ReactNode }) {
  const rounded = amount ? Math.round(amount) : 0;
  return (
    <li className="flex min-h-14 items-center gap-3 border-b border-border-subtle py-2.5 last:border-b-0">
      {lead}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] font-medium text-fg-primary">{label}</span>
        <span className="text-[12px] text-fg-muted">{hint}</span>
      </div>
      <span
        className={cn(
          "hidden w-24 text-right text-[13px] tabular-nums @min-[26rem]:inline",
          rounded > 0 ? "text-data-positive" : rounded < 0 ? "text-data-negative" : "text-transparent",
        )}
      >
        {rounded > 0 ? `+${formatDollars(rounded)}` : rounded < 0 ? `−${formatDollars(-rounded)}` : "·"}
      </span>
      <div className="w-28">{children}</div>
    </li>
  );
}

function Field({ id, value, placeholder, suffix, ariaLabel, onChange }: { id: string; value: string; placeholder: string; suffix: string; ariaLabel: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="relative">
      <Input
        id={id}
        variant="filled"
        inputMode="decimal"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 w-full pr-10 text-right text-[14px] font-semibold tabular-nums"
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-fg-tertiary">{suffix}</span>
    </div>
  );
}
