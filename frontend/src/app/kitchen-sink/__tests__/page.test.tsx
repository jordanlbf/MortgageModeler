import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KitchenSinkComponentsPage from "../components/page";
import KitchenSinkPage from "../page";
import { COMPONENTS, PAGES, PRIMITIVES, SECTIONS } from "../sections";
import { renderWithProviders, stubIntersectionObserver } from "./setup";

const ROUTES = [
  { name: "primitives", Page: KitchenSinkPage, sections: PRIMITIVES, href: "/kitchen-sink" },
  { name: "components", Page: KitchenSinkComponentsPage, sections: COMPONENTS, href: "/kitchen-sink/components" },
] as const;

describe("/kitchen-sink", () => {
  beforeEach(() => stubIntersectionObserver());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("splits sections into primitives (10) and components (6) with unique ids", () => {
    expect(PRIMITIVES).toHaveLength(10);
    expect(COMPONENTS).toHaveLength(6);
    expect(new Set(SECTIONS.map((s) => s.id)).size).toBe(SECTIONS.length);
    expect(PAGES.map((p) => p.href)).toEqual(ROUTES.map((r) => r.href));
  });

  describe.each(ROUTES)("$name page", ({ Page, sections, href }) => {
    it("renders its sections in order", () => {
      renderWithProviders(<Page />);
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(headings).toEqual(sections.map((s) => s.title));
    });

    it("gives every section an anchor id and a nav link to it", () => {
      renderWithProviders(<Page />);
      const nav = screen.getByRole("navigation", { name: "Kitchen sink sections" });
      const links = within(nav).getAllByRole("link");
      expect(links.map((a) => a.getAttribute("href"))).toEqual(sections.map((s) => `#${s.id}`));
      for (const s of sections) expect(document.getElementById(s.id)).not.toBeNull();
    });

    it("links to both pages and marks itself current", () => {
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
