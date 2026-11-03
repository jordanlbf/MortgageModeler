"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CashflowState } from "@/hooks/useCashflowState";
import { formatDollars } from "@/lib/formatters";
import { Section } from "../loan/parts";
import { SourceTag } from "../costs/parts";
import { ASSET_PRESETS, type Asset, assetYear1, type Building, buildingYear1, depreciationModel, switchToEstimate } from "./model";
import { BasisLine, DIV40_COLOR, DIV43_COLOR, Headline, MoneyField } from "./parts";
import DepTimeline from "./DepTimeline";

/**
 * The estimate is laid out as an itemised schedule the user can edit in
 * place; the first edit copies it into their own schedule.
 */
export default function DepSchedule({ s }: { s: CashflowState }) {
  const m = depreciationModel(s);
  const date = `${m.estYear}-07-01`;

  const commit = (buildings: Building[], assets: Asset[]) => {
    s.setDepBuildings(buildings);
    s.setDepAssets(assets);
    if (m.isEstimate) s.setDepreciationMode("detailed");
  };
  const editBuilding = (i: number, cost: number) =>
    commit(m.buildings.map((b, j) => (j === i ? { ...b, construction_cost: cost } : b)), m.assets);
  const editAsset = (i: number, patch: Partial<Asset>) =>
    commit(m.buildings, m.assets.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const removeAsset = (i: number) => commit(m.buildings, m.assets.filter((_, j) => j !== i));
  const addAsset = (name: string, life: number) =>
    commit(m.buildings, [...m.assets, { name, cost: 0, effective_life_years: life, purchase_date: date, method: "diminishing_value", written_down_value: 0 }]);
  const addBuilding = () =>
    commit([{ name: "Building structure", construction_cost: 0, purchase_date: date, construction_start_date: `${m.estYear - 2}-01-01` }], m.assets);

  const presets = ASSET_PRESETS.filter((p) => !m.assets.some((a) => a.name === p.name));

  return (
    <div className="@container flex flex-col">
      <Section first>
        <div className="flex flex-col gap-3">
          <Headline m={m} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <BasisLine m={m} />
            {!m.isEstimate && (
              <Button type="button" variant="link-quiet" className="text-[12px] hover:text-brand" onClick={() => switchToEstimate(s)}>
                Reset to estimate
              </Button>
            )}
          </div>
        </div>
      </Section>

      <Section>
        <GroupHeader label="Building" note="Div 43 · construction cost" amount={m.div43} color={DIV43_COLOR} />
        {m.buildings.length > 0 ? (
          <ul className="flex flex-col">
            {m.buildings.map((b, i) => (
              <ItemRow key={i} id={`b-${i}`} name={b.name} meta="2.5% / yr" deduction={buildingYear1(b)} edited={!m.isEstimate}>
                <MoneyField id={`b-${i}`} value={b.construction_cost} onValue={(n) => editBuilding(i, n)} ariaLabel={`${b.name} construction cost`} />
              </ItemRow>
            ))}
          </ul>
        ) : (
          <Button type="button" variant="link-quiet" className="mt-1 text-[13px] hover:text-brand" onClick={addBuilding}>
            + Add building
          </Button>
        )}
      </Section>

      <Section>
        <GroupHeader label="Plant & equipment" note="Div 40 · cost and effective life" amount={m.div40} color={DIV40_COLOR} />
        <ul className="flex flex-col">
          {m.assets.map((a, i) => (
            <ItemRow
              key={`${a.name}-${i}`}
              id={`a-${i}`}
              name={a.name}
              deduction={assetYear1(a)}
              edited={!m.isEstimate}
              meta={
                <span className="flex items-center gap-1">
                  <Input
                    variant="filled"
                    inputMode="numeric"
                    value={a.effective_life_years || ""}
                    onChange={(e) => editAsset(i, { effective_life_years: parseInt(e.target.value.replace(/\D/g, "")) || 1 })}
                    aria-label={`${a.name} effective life in years`}
                    className="h-7 w-10 px-1.5 text-center text-[12px] tabular-nums"
                  />
                  yr
                </span>
              }
              onRemove={() => removeAsset(i)}
            >
              <MoneyField
                id={`a-${i}`}
                value={a.written_down_value || a.cost}
                onValue={(n) => editAsset(i, { cost: n, written_down_value: n })}
                ariaLabel={`${a.name} value`}
              />
            </ItemRow>
          ))}
        </ul>
        {presets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {presets.slice(0, 4).map((p) => (
              <Button key={p.name} type="button" variant="chip" className="inline-flex items-center gap-1" onClick={() => addAsset(p.name, p.life)}>
                <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
                {p.name}
              </Button>
            ))}
            <Button type="button" variant="chip" className="inline-flex items-center gap-1" onClick={() => addAsset("Other item", 10)}>
              <Plus size={12} strokeWidth={2.4} aria-hidden="true" />
              Other
            </Button>
          </div>
        )}
      </Section>

      <Section>
        <DepTimeline m={m} />
      </Section>
    </div>
  );
}

function GroupHeader({ label, note, amount, color }: { label: string; note: string; amount: number; color: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 pb-1">
      <div className="flex items-baseline gap-2">
        <span className="size-2.5 translate-y-px rounded-full" style={{ background: color }} aria-hidden="true" />
        <Label variant="caps" asChild><span>{label}</span></Label>
        <span className="hidden text-[12px] text-fg-muted @min-[30rem]:inline">{note}</span>
      </div>
      <span className="text-[13px] font-semibold text-fg-secondary tabular-nums">{formatDollars(Math.round(amount)) || "$0"} / yr</span>
    </div>
  );
}

function ItemRow({ id, name, meta, deduction, edited, onRemove, children }: { id: string; name: string; meta: React.ReactNode; deduction: number; edited: boolean; onRemove?: () => void; children: React.ReactNode }) {
  return (
    <li className="group flex min-h-12 items-center gap-3 border-b border-border-subtle py-2 last:border-b-0">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Label variant="bare" htmlFor={id} className="truncate text-[14px] font-medium text-fg-primary">{name}</Label>
        <SourceTag source={edited ? "own" : "estimate"} />
      </div>
      <span className="hidden text-[12px] text-fg-muted tabular-nums @min-[30rem]:inline">{meta}</span>
      <span className="hidden w-20 text-right text-[13px] text-data-positive tabular-nums @min-[26rem]:inline">
        {deduction > 0 ? `+${formatDollars(Math.round(deduction))}` : "·"}
      </span>
      {children}
      {onRemove ? (
        <Button type="button" variant="icon-quiet" className="size-7 p-0 opacity-60 hover:opacity-100" aria-label={`Remove ${name}`} onClick={onRemove}>
          <X size={14} aria-hidden="true" />
        </Button>
      ) : (
        <span className="size-7" aria-hidden="true" />
      )}
    </li>
  );
}
