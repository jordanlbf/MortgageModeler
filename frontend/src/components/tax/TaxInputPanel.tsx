"use client";

import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import type { TaxMoneyField, TaxState } from "@/hooks/useTaxState";
import { formatDollars } from "@/lib/formatters";
import { TAX_YEAR } from "@/lib/tax-brackets";
import { cn } from "@/lib/utils";
import InfoTip from "@/components/patterns/blocks/InfoTip";
import SectionCard from "@/components/patterns/cards/SectionCard";
import MoneyInput from "@/components/domain/MoneyInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { answerSummary, initialAnswers, TAX_QUESTIONS, type TaxField, type TaxQuestion } from "./questions";

type StepState = "yes" | "no" | "current" | "ahead";

const RAIL = "left-[25px]";

function Dot({ state }: { state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "absolute z-10 flex items-center justify-center rounded-full transition-colors duration-200",
        state === "no" ? "top-[22px] left-[22px] size-2 bg-brand/50" : "top-[18px] left-[18px] size-4 border-2",
        state === "current" && "border-brand bg-surface-raised shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_15%,transparent)]",
        state === "yes" && "border-brand bg-brand text-brand-contrast",
        state === "ahead" && "border-border-subtle bg-surface-raised",
      )}
    >
      {state === "yes" && <Check size={9} strokeWidth={3.5} />}
    </span>
  );
}

/** A step on the rail: its dot, and the line down to the next one (green once you're past it). */
function Step({ state, last, children }: { state: StepState; last?: boolean; children: React.ReactNode }) {
  const past = state === "yes" || state === "no";
  return (
    <li className={cn("relative px-6 pl-12", state === "current" ? "py-4" : "py-2")}>
      {!last && (
        <span aria-hidden="true" className={cn("absolute top-[26px] -bottom-[18px] w-0.5 transition-colors duration-300", RAIL, past ? "bg-brand/60" : "bg-border-subtle")} />
      )}
      <Dot state={state} />
      {children}
    </li>
  );
}

/** A step you've moved past, folded to one line: what it was and your answer. Click to change it. */
function Folded({ label, value, strong, onOpen }: { label: string; value: string; strong?: boolean; onOpen: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost-muted"
      className="-mx-2 -my-0.5 flex h-auto w-[calc(100%+16px)] items-center justify-between gap-3 px-2 py-1 text-left"
      onClick={onOpen}
    >
      <span className={cn("min-w-0 text-[13px]", strong ? "font-medium text-fg-primary" : "font-normal text-fg-tertiary")}>{label}</span>
      <span className={cn("shrink-0 text-[13px] tabular-nums", strong ? "font-semibold text-fg-primary" : "font-normal text-fg-tertiary")}>
        {value}
        <span className="sr-only">, change</span>
      </span>
    </Button>
  );
}

function MoneyRow({ id, field, value, onChange, autoFocus, onKeyDown }: {
  id: string; field: TaxField; value: number; onChange: (n: number) => void; autoFocus?: boolean; onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}) {
  const inputId = `${id}-${field.key}`;
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-1">
        <Label variant="bare" htmlFor={inputId} className={cn("min-w-0 text-[13.5px]", value > 0 ? "text-fg-primary" : "text-fg-secondary")}>
          {field.label}
        </Label>
        {field.hint && <InfoTip label={field.label} id={`${inputId}-hint`}>{field.hint}</InfoTip>}
      </div>
      <MoneyInput
        id={inputId}
        autoFocus={autoFocus}
        value={value}
        onValueChange={onChange}
        onKeyDown={onKeyDown}
        className="w-[120px] shrink-0"
        aria-describedby={field.hint ? `${inputId}-hint` : undefined}
      />
    </div>
  );
}

/**
 * The income card as a timeline: salary, then one yes/no question at a time.
 * What's still to come is shown greyed below, so you know how much is left; a
 * "yes" opens that question's lines. Steps you've passed fold to one line
 * each, so the whole timeline stays in view.
 */
export default function TaxInputPanel({ tax }: { tax: TaxState }) {
  const id = useId();
  const { inputs, set } = tax;
  const [answers, setAnswers] = useState<Record<string, boolean>>(() => initialAnswers(inputs));
  // The next question waits until you've left the field you're filling in:
  // the salary box, or the lines a "yes" just opened.
  const [salaryDone, setSalaryDone] = useState(() => inputs.salary > 0);
  const [filling, setFilling] = useState<string | null>(null);
  // A folded step you've reopened to change ("salary" or a question id).
  const [editing, setEditing] = useState<string | null>(null);
  /** Folds a reopened or just-filled step again once focus leaves it. */
  const foldOnLeave = (key: string) => (e: React.FocusEvent<HTMLElement>) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    if (filling === key) setFilling(null);
    if (editing === key) setEditing(null);
  };
  // Leaving by Tab or Enter moves you on to the question that appears.
  const [focusNext, setFocusNext] = useState(false);
  const moveOn = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" && !(e.key === "Tab" && !e.shiftKey)) return;
    e.preventDefault();
    setFocusNext(true);
    e.currentTarget.blur();
  };

  const answer = (q: TaxQuestion, yes: boolean) => {
    setAnswers((a) => ({ ...a, [q.id]: yes }));
    setFocusNext(false);
    // Answering a reopened "no" with "no" again folds it straight back.
    if (!yes && editing === q.id) setEditing(null);
    // A "yes" that opens empty lines holds the next question until you leave them.
    setFilling(yes && q.fields?.every((f) => inputs[f.key] === 0) ? q.id : null);
    if (q.flag) set(q.flag, yes);
    // A "no" clears anything typed under it, so hidden figures never count.
    if (!yes) q.fields?.forEach((f) => set(f.key as TaxMoneyField, 0));
  };

  // The questions start once there's a salary (or anything already answered).
  const started = salaryDone || Object.keys(answers).length > 0;
  const next = started ? TAX_QUESTIONS.find((q) => answers[q.id] === undefined) ?? null : null;
  const current = filling ? null : next;
  const answered = Object.keys(answers).length + (salaryDone ? 1 : 0);

  // Y / N answer the open question, unless you're typing in a field.
  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      const k = e.key.toLowerCase();
      if (k === "y" || k === "n") { e.preventDefault(); answer(current, k === "y"); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });


  const question = (q: TaxQuestion, last: boolean) => {
    const a = answers[q.id];
    const state: StepState = a === true ? "yes" : a === false ? "no" : q === current ? "current" : "ahead";
    if (state === "ahead") {
      return (
        <Step key={q.id} state="ahead" last={last}>
          <span className="text-[13px] text-fg-muted">{q.short}</span>
        </Step>
      );
    }
    const isCurrent = state === "current";
    const isOpen = isCurrent || filling === q.id || editing === q.id;
    if (!isOpen) {
      return (
        <Step key={q.id} state={state} last={last}>
          <Folded label={q.short} value={answerSummary(q, a!, inputs)} strong={a} onOpen={() => setEditing(q.id)} />
        </Step>
      );
    }
    const reopened = !isCurrent && editing === q.id;
    const qid = `${id}-${q.id}`;
    const pill = isCurrent ? "h-8 min-w-[64px] text-[13px]" : "h-6 min-w-[44px] text-[12px]";
    const summary = q.fields && q.fields.length > 1 ? q.summary?.(inputs) : null;
    return (
      <Step key={q.id} state={state} last={last}>
        <div className="flex flex-col gap-3" onBlur={foldOnLeave(q.id)}>
          {/* Open question: asked in full, answers underneath. Answered: one line, answers beside it. */}
          <div className={cn("flex gap-3", isCurrent ? "flex-col" : "items-center justify-between")}>
            <div className="flex min-w-0 items-center gap-1">
              <span id={qid} className={cn(isCurrent ? "text-[14px] font-semibold text-fg-primary" : cn("text-[13px]", a ? "font-medium text-fg-primary" : "text-fg-tertiary"))}>
                {isCurrent ? q.ask : q.short}
              </span>
              {isCurrent && q.help && <InfoTip label={q.short} id={`${qid}-help`}>{q.help}</InfoTip>}
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {/* Click handlers on the items, so re-picking the same answer never deselects it. */}
              <ToggleGroup type="single" variant="pill" value={a === undefined ? "" : a ? "yes" : "no"} aria-labelledby={qid} aria-describedby={isCurrent && q.help ? `${qid}-help` : undefined} className="gap-1">
                <ToggleGroupItem value="yes" className={pill} autoFocus={(isCurrent && focusNext) || (reopened && a === true && !q.fields)} onClick={() => answer(q, true)}>Yes</ToggleGroupItem>
                <ToggleGroupItem value="no" className={pill} autoFocus={reopened && a === false} onClick={() => answer(q, false)}>No</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
          {a && q.fields && (
            <div className="flex flex-col gap-3 pb-1.5">
              {q.fields.map((f, k) => (
                <MoneyRow
                  key={f.key}
                  id={id}
                  field={f}
                  value={inputs[f.key]}
                  onChange={(n) => set(f.key, n)}
                  autoFocus={k === 0 && (inputs[f.key] === 0 || reopened)}
                  // Tab or Enter on the last line moves on to the next question.
                  onKeyDown={filling === q.id && k === q.fields!.length - 1 ? moveOn : undefined}
                />
              ))}
              {summary && <p className="text-right text-[12px] text-fg-tertiary tabular-nums">{summary}</p>}
            </div>
          )}
        </div>
      </Step>
    );
  };

  return (
    <SectionCard
      flush
      title="Your income"
      description={`${TAX_YEAR} financial year`}
      titleId={`${id}-title`}
      role="group"
      aria-labelledby={`${id}-title`}
      action={started && <span className="text-[12px] text-fg-tertiary tabular-nums">{answered} of {TAX_QUESTIONS.length + 1}</span>}
    >
      <ol className="border-t border-border-subtle pt-1 pb-2">
        <Step state={salaryDone ? "yes" : "current"}>
          {salaryDone && editing !== "salary" ? (
            <Folded label="Salary" value={formatDollars(inputs.salary) || "$0"} strong onOpen={() => setEditing("salary")} />
          ) : (
            <div className="flex flex-col gap-3" onBlur={foldOnLeave("salary")}>
              <Label variant="bare" htmlFor={`${id}-salary`} className="text-[14px] font-semibold text-fg-primary">What&rsquo;s your salary before tax?</Label>
              <MoneyInput
                id={`${id}-salary`}
                autoFocus={inputs.salary === 0 || editing === "salary"}
                value={inputs.salary}
                onValueChange={(n) => set("salary", n)}
                onBlur={() => { if (inputs.salary > 0) setSalaryDone(true); }}
                onKeyDown={!salaryDone && inputs.salary > 0 ? moveOn : undefined}
                className="h-11 px-4 text-left text-[19px]"
              />
            </div>
          )}
        </Step>
        {TAX_QUESTIONS.map((q, i) => question(q, i === TAX_QUESTIONS.length - 1))}
      </ol>
    </SectionCard>
  );
}
