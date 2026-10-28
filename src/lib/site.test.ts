import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it("uses the Vercel production domain when it is set", async () => {
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "coverage-keeper.example");
  const { SITE_URL } = await import("./site");
  expect(SITE_URL).toBe("https://coverage-keeper.example");
});

it("falls back to the local dev server", async () => {
  vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
  const { SITE_URL } = await import("./site");
  expect(SITE_URL).toBe("http://localhost:3000");
});

it("keeps the meta description within the length search results show", async () => {
  const { SITE_DESCRIPTION } = await import("./site");
  expect(SITE_DESCRIPTION.length).toBeLessThanOrEqual(160);
});
