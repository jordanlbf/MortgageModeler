import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KitchenSinkPage from "../page";
import { renderWithProviders, stubIntersectionObserver } from "./setup";

describe("/kitchen-sink accessibility", () => {
  beforeEach(() => stubIntersectionObserver());
  afterEach(() => vi.unstubAllGlobals());

  it("has no axe violations", async () => {
    const { container } = renderWithProviders(<KitchenSinkPage />);
    const results = await axe.run(container, {
      // jsdom can't compute colours or layout, so contrast is checked in the browser instead.
      rules: { "color-contrast": { enabled: false } },
    });
    // Readable failure: rule, count, and the first few offending elements.
    const summary = results.violations.map(
      (v) => `${v.id} (${v.nodes.length}): ${v.help}\n${v.nodes.slice(0, 5).map((n) => `  ${n.html.slice(0, 240)}`).join("\n")}`,
    );
    expect(summary).toEqual([]);
  }, 30_000);
});
