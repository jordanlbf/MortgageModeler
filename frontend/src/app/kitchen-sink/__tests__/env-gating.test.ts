import { afterEach, describe, expect, it, vi } from "vitest";
import { isKitchenSinkEnabled } from "@/lib/kitchen-sink-gate";
import { config, proxy } from "@/proxy";

describe("isKitchenSinkEnabled", () => {
  it("is on in development", () => {
    expect(isKitchenSinkEnabled({ NODE_ENV: "development" })).toBe(true);
  });

  it("is on in tests", () => {
    expect(isKitchenSinkEnabled({ NODE_ENV: "test" })).toBe(true);
  });

  it("is off in production without the flag", () => {
    expect(isKitchenSinkEnabled({ NODE_ENV: "production" })).toBe(false);
  });

  it("is on in production with the flag set to true", () => {
    expect(isKitchenSinkEnabled({ NODE_ENV: "production", NEXT_PUBLIC_SHOW_KITCHEN_SINK: "true" })).toBe(true);
  });

  it("stays off in production for any other flag value", () => {
    for (const v of ["false", "1", "TRUE", ""]) {
      expect(isKitchenSinkEnabled({ NODE_ENV: "production", NEXT_PUBLIC_SHOW_KITCHEN_SINK: v })).toBe(false);
    }
  });
});

describe("proxy", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns 404 for /kitchen-sink in production without the flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SHOW_KITCHEN_SINK", "");
    expect(proxy().status).toBe(404);
  });

  it("lets /kitchen-sink through in production with the flag", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SHOW_KITCHEN_SINK", "true");
    const res = proxy();
    expect(res.status).toBe(200);
    expect(res.headers.get("x-middleware-next")).toBe("1");
  });

  it("only matches the kitchen-sink route", () => {
    expect(config.matcher).toEqual(["/kitchen-sink", "/kitchen-sink/:path*"]);
  });
});
