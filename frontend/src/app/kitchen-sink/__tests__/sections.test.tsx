import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SECTIONS } from "../sections";
import { renderWithProviders, stubIntersectionObserver } from "./setup";

/**
 * One snapshot per section: catches unintended markup or class changes to
 * the design-system primitives. Update deliberately with `vitest -u`.
 */
describe("kitchen-sink sections", () => {
  beforeEach(() => stubIntersectionObserver());
  afterEach(() => vi.unstubAllGlobals());

  it.each(SECTIONS.map((s) => [s.id, s] as const))("%s matches its snapshot", (_id, { Component }) => {
    const { container } = renderWithProviders(<Component />);
    expect(container).toMatchSnapshot();
  });
});
