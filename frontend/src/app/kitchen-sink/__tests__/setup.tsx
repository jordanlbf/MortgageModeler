import { cleanup, render } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";

// Vitest runs without globals, so Testing Library can't clean up between tests by itself.
afterEach(() => cleanup());

/** jsdom has no IntersectionObserver (used by the nav's scroll-spy). */
export function stubIntersectionObserver() {
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    },
  );
}

/** Renders inside the providers the root layout supplies. */
export function renderWithProviders(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}
