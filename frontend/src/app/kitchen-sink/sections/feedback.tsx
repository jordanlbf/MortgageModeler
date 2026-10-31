"use client";

import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import VariantRow from "../components/VariantRow";

const ALERTS = [
  { tone: "error", Icon: AlertCircle, cls: "border-data-negative/20 bg-status-error-bg text-data-negative", text: "Couldn't reach the calculator. Your inputs are kept; we'll retry." },
  { tone: "warning", Icon: TriangleAlert, cls: "border-data-warning/20 bg-status-warning-bg text-data-warning", text: "LVR is 87.7%: lenders mortgage insurance applies above 80%." },
  { tone: "success", Icon: CheckCircle2, cls: "border-data-positive/20 bg-status-success-bg text-data-positive", text: "Scenario saved for 42 Smith Street, Clayfield." },
  { tone: "info", Icon: Info, cls: "border-status-info/20 bg-status-info/5 text-status-info", text: "QLD first home concessions apply to homes under $800,000." },
] as const;

function ConfirmBody() {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Delete 15 Beach Road?</DialogTitle>
        <DialogDescription>This removes the property and its 3 scenarios. You can&apos;t undo this.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
        <DialogClose asChild><Button variant="destructive">Delete property</Button></DialogClose>
      </DialogFooter>
    </>
  );
}

export default function FeedbackSection() {
  return (
    <>
      <VariantRow label="inline alert · error / warning / success / info">
        <div className="flex w-full max-w-[640px] flex-col gap-2">
          {ALERTS.map(({ tone, Icon, cls, text }) => (
            <div key={tone} role={tone === "error" ? "alert" : "status"} className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 text-[13px] ${cls}`}>
              <Icon size={15} className="shrink-0" aria-hidden="true" />
              {text}
            </div>
          ))}
        </div>
      </VariantRow>
      <VariantRow label="banner (full width)">
        <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-brand-subtle px-4 py-2.5 text-[13px] text-fg-secondary">
          <span>Rates updated on 1 November. Your scenarios now use the new RBA cash rate.</span>
          <Button variant="link-muted" className="shrink-0 text-[13px]">Review changes</Button>
        </div>
      </VariantRow>
      <VariantRow label="confirm dialog (static preview · live trigger)">
        <Card variant="panel" className="flex w-full max-w-[420px] flex-col gap-4 p-6">
          <div className="flex flex-col gap-2">
            <span className="text-[16px] font-semibold">Delete 15 Beach Road?</span>
            <span className="text-[13px] text-fg-tertiary">This removes the property and its 3 scenarios. You can&apos;t undo this.</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete property</Button>
          </div>
        </Card>
        <Dialog>
          <DialogTrigger asChild><Button variant="outline">Open dialog</Button></DialogTrigger>
          <DialogContent><ConfirmBody /></DialogContent>
        </Dialog>
      </VariantRow>
      <VariantRow label="Tooltip (surface) · Popover · Sheet">
        <Tooltip>
          <TooltipTrigger asChild><Button variant="outline">Hover for tooltip</Button></TooltipTrigger>
          <TooltipContent variant="surface">Loan-to-value ratio: loan ÷ property value</TooltipContent>
        </Tooltip>
        <Popover>
          <PopoverTrigger asChild><Button variant="outline">Open popover</Button></PopoverTrigger>
          <PopoverContent className="text-[13px]">Stamp duty for QLD uses the home concession rate.</PopoverContent>
        </Popover>
        <Sheet>
          <SheetTrigger asChild><Button variant="outline">Open sheet</Button></SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Columns</SheetTitle>
              <SheetDescription>Choose which cashflow columns to show.</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </VariantRow>
    </>
  );
}
