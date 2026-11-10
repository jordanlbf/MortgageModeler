"use client";

import { useId } from "react";
import { useGrantsState, type GrantsSource } from "@/hooks/useGrantsState";
import CalculatorLayout from "@/components/patterns/layouts/CalculatorLayout";
import InlineAlert from "@/components/patterns/blocks/InlineAlert";
import { Button } from "@/components/ui/button";
import GrantsInputPanel from "./GrantsInputPanel";
import SchemeValueList from "./SchemeValueList";

/**
 * Government Grants: your purchase on the left; on the right the schemes that
 * fit, each as a bar of what it's worth, then (once state, type and price
 * are in) the ones that don't, with what rules each out.
 * Each scheme opens its details in a side panel.
 *
 * `source` is for the kitchen sink (sample data instead of the API).
 */
export default function GrantsView({ source }: { source?: GrantsSource } = {}) {
  const g = useGrantsState(source);
  const titleId = useId();
  const { schemes, eligible, ineligible } = g;
  const failed = !!g.error && !schemes;
  // One scale for both lists, so a bar means the same dollars in each.
  const scale = Math.max(1, ...(schemes ?? []).map((s) => (s.value.share === null ? s.value.amount ?? 0 : 0)));

  return (
    <div>
      {g.error && (
        <InlineAlert className="mb-6">
          Couldn&apos;t check the schemes just now.
          <Button type="button" variant="link-muted" className="ml-2 font-semibold text-status-error underline underline-offset-2 hover:text-status-error" onClick={g.retry}>
            Try again
          </Button>
        </InlineAlert>
      )}
      <CalculatorLayout
        inputs={<GrantsInputPanel g={g} />}
        aria-labelledby={titleId}
        aria-busy={g.loading}
        // Rechecking: dim the results only, so the inputs stay crisp while typing.
        data-refreshing={g.loading && !!schemes}
        className="[&>section]:transition-opacity [&>section]:duration-200 [&>section[data-refreshing=true]]:opacity-60"
      >
        <SchemeValueList
          title="Schemes for you"
          titleId={titleId}
          items={failed ? [] : schemes ? eligible : null}
          empty={failed ? "Couldn't load the schemes." : g.described ? "None of these schemes fit your purchase. See why below." : "Fill in your purchase to see what fits."}
          scale={scale}
        />
        {/* Only once the purchase is described (state, type, price): before that, most misses are just blanks. */}
        {!failed && g.described && (!schemes || ineligible.length > 0) && (
          <SchemeValueList title="Not for you" missed items={schemes ? ineligible : null} empty="" scale={scale} />
        )}
      </CalculatorLayout>
    </div>
  );
}
