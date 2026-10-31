"use client";

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
import VariantRow from "../_components/VariantRow";

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

export default function OverlaysSection() {
  return (
    <>
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
