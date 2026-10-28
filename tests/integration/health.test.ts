import { expect, it } from "vitest";
import { GET } from "@/app/api/health/route";

it("reports ok from the health route", async () => {
  const res = GET();
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ status: "ok" });
});
