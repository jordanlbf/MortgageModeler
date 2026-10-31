import { Button } from "@/components/ui/button";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import VariantRow from "../_components/VariantRow";

export default function AlertsSection() {
  return (
    <>
      <VariantRow label='InlineAlert tone="error" / "warning" / "success" / "info"'>
        <div className="flex w-full max-w-[560px] flex-col gap-2">
          <InlineAlert tone="error">Something went wrong. This is an error message.</InlineAlert>
          <InlineAlert tone="warning">Heads up. This is a warning message.</InlineAlert>
          <InlineAlert tone="success">All done. This is a success message.</InlineAlert>
          <InlineAlert tone="info">For your information. This is an info message.</InlineAlert>
        </div>
      </VariantRow>
      <VariantRow label="InlineAlert · long message wraps">
        <div className="w-full max-w-[420px]">
          <InlineAlert tone="warning">
            A longer message that runs past one line, to check the icon stays aligned and the text wraps cleanly inside the box.
          </InlineAlert>
        </div>
      </VariantRow>
      <VariantRow label="banner (full width, with action)">
        <div className="flex w-full items-center justify-between gap-4 rounded-lg bg-brand-subtle px-4 py-2.5 text-[13px] text-fg-secondary">
          <span>Something changed that you may want to review.</span>
          <Button variant="link-muted" className="shrink-0 text-[13px]">Review changes</Button>
        </div>
      </VariantRow>
    </>
  );
}
