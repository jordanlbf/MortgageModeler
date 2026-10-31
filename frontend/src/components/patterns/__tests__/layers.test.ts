import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Layering rule for components/patterns: each layer may import only from the
 * layers before it (ui → blocks → cards → layouts), never from a later one or
 * from feature folders. Keeps "edit one layer, everything above follows" true.
 */
const ROOT = join(__dirname, "..");
const ORDER = ["blocks", "cards", "layouts"] as const;

function importsOf(file: string): string[] {
  const src = readFileSync(file, "utf8");
  return [...src.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
}

/** Which pattern layer an import points at, or "feature" / null (allowed: ui, lib, react…). */
function layerOf(spec: string, fromLayer: string): string | null {
  const m = spec.match(/^@\/components\/patterns\/(\w+)\//) ?? spec.match(/^\.\.\/(\w+)\//);
  if (m) return m[1];
  if (spec.startsWith("./")) return fromLayer;
  if (/^@\/components\/(?!ui\/)/.test(spec)) return "feature";
  return null;
}

describe("components/patterns layering", () => {
  for (const [i, layer] of ORDER.entries()) {
    const files = readdirSync(join(ROOT, layer)).filter((f) => f.endsWith(".tsx"));
    it.each(files)(`${layer}/%s imports only from earlier layers`, (f) => {
      const allowed = new Set(ORDER.slice(0, i + 1));
      const bad = importsOf(join(ROOT, layer, f)).filter((spec) => {
        const target = layerOf(spec, layer);
        return target !== null && !allowed.has(target as (typeof ORDER)[number]);
      });
      expect(bad).toEqual([]);
    });
  }
});
