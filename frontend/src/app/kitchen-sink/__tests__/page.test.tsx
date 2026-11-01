import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlocksPage from "../blocks/page";
import CardsPage from "../cards/page";
import LayoutsPage from "../layouts/page";
import ScreensPage from "../screens/page";
import FoundationsPage from "../page";
import PrimitivesPage from "../primitives/page";
import { PAGES, SECTIONS } from "../sections";
import { renderWithProviders, stubIntersectionObserver } from "./setup";

// jsdom has no layout, so recharts' ResponsiveContainer measures 0×0 and warns.
// Give charts a fixed size here; the Screens page renders real charts.
vi.mock("recharts", async (importOriginal) => {
  const mod = await importOriginal<typeof import("recharts")>();
  const { cloneElement, isValidElement } = await import("react");
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
      isValidElement(children) ? cloneElement(children as React.ReactElement<{ width: number; height: number }>, { width: 800, height: 300 }) : null,
  };
});

const COMPONENTS = { foundations: FoundationsPage, primitives: PrimitivesPage, blocks: BlocksPage, cards: CardsPage, layouts: LayoutsPage, screens: ScreensPage };
const ROUTES = PAGES.map((p) => ({ name: p.key, Page: COMPONENTS[p.key], sections: p.sections, href: p.href }));

describe("/kitchen-sink", () => {
  beforeEach(() => stubIntersectionObserver());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("has five layers in order, each with sections, and unique section ids", () => {
    expect(PAGES.map((p) => p.key)).toEqual(["foundations", "primitives", "blocks", "cards", "layouts", "screens"]);
    for (const p of PAGES) expect(p.sections.length).toBeGreaterThan(0);
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length);
  });

  describe.each(ROUTES)("$name page", ({ Page, sections, href }) => {
    it("renders its sections in order", () => {
      renderWithProviders(<Page />);
      // Section headings only: the Screens page's screens bring their own h2s.
      const headings = [...document.querySelectorAll("section[aria-labelledby] > h2")].map((h) => h.textContent);
      expect(headings).toEqual(sections.map((s) => s.title));
    });

    it("gives every section an anchor id and a nav link to it", () => {
      renderWithProviders(<Page />);
      const nav = screen.getByRole("navigation", { name: "Kitchen sink sections" });
      const links = within(nav).getAllByRole("link");
      expect(links.map((a) => a.getAttribute("href"))).toEqual(sections.map((s) => `#${s.id}`));
      for (const s of sections) expect(document.getElementById(s.id)).not.toBeNull();
    });

    it("links to every layer and marks itself current", () => {
      renderWithProviders(<Page />);
      const nav = screen.getByRole("navigation", { name: "Kitchen sink pages" });
      const links = within(nav).getAllByRole("link");
      expect(links.map((a) => a.getAttribute("href"))).toEqual(PAGES.map((p) => p.href));
      expect(links.find((a) => a.getAttribute("aria-current") === "page")?.getAttribute("href")).toBe(href);
    });

    it("renders without console errors or warnings", () => {
      const error = vi.spyOn(console, "error").mockImplementation(() => {});
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      renderWithProviders(<Page />);
      expect(error).not.toHaveBeenCalled();
      expect(warn).not.toHaveBeenCalled();
    });

    it("uses no lorem ipsum", () => {
      const { container } = renderWithProviders(<Page />);
      expect(container.textContent?.toLowerCase()).not.toContain("lorem");
    });
  });
});
