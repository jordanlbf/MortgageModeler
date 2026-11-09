"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * A small "i" beside a label that shows help text, in place of a line of
 * helper text under the field. Opens on hover or keyboard focus, and on tap
 * (touch screens have no hover).
 *
 * Pass `id` to also render the text hidden, so a field can point
 * `aria-describedby` at it and screen readers still read the help.
 */
export default function InfoTip({ label, id, className, children }: {
  /** What the help is about, for the button's accessible name ("About Property expenses"). */
  label: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="link-quiet"
            aria-label={`About ${label}`}
            className={cn("inline-flex size-5 shrink-0 items-center justify-center rounded-full align-middle", className)}
            // Tap toggles it. preventDefault stops Radix closing it on click.
            onClick={(e) => { e.preventDefault(); setOpen((o) => !o); }}
          >
            <Info aria-hidden="true" className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent variant="surface" side="top" sideOffset={6} className="max-w-[240px] whitespace-normal text-[12px] leading-snug">
          {children}
        </TooltipContent>
      </Tooltip>
      {id && <span id={id} className="sr-only">{children}</span>}
    </>
  );
}
