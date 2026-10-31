import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KitchenSinkPage from "../page";
import { SECTIONS } from "../sections";
import { renderWithProviders, stubIntersectionObserver } from "./setup";

describe("/kitchen-sink", () => {
  beforeEach(() => stubIntersectionObserver());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders all 11 sections in order", () => {
    renderWithProviders(<KitchenSinkPage />);
    expect(SECTIONS).toHaveLength(11);
    const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(SECTIONS.map((s) => s.title));
  });

  it("gives every section an anchor id and a nav link to it", () => {
    renderWithProviders(<KitchenSinkPage />);
    const nav = screen.getByRole("navigation", { name: "Kitchen sink sections" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(SECTIONS.map((s) => `#${s.id}`));
    for (const s of SECTIONS) expect(document.getElementById(s.id)).not.toBeNull();
  });

  it("renders without console errors or warnings", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    renderWithProviders(<KitchenSinkPage />);
    expect(error).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();
  });

  it("uses no lorem ipsum", () => {
    const { container } = renderWithProviders(<KitchenSinkPage />);
    expect(container.textContent?.toLowerCase()).not.toContain("lorem");
  });
});
