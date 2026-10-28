import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/read/route";
import { findForbiddenClaims, SAFE_FALLBACK } from "@/lib/guardrails";
import { LetterExtraction } from "@/lib/schema";
import adversarial from "../fixtures/adversarial/eligible-summary.json";

vi.mock("@/lib/letter-reader", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/letter-reader")>()),
  readLetter: async () => LetterExtraction.parse(adversarial),
}));

describe("route output guardrail (US-050, US-052)", () => {
  it("replaces eligibility claims in model output with the safe fallback", async () => {
    const form = new FormData();
    form.set(
      "image",
      new File([new Uint8Array(10)], "a.png", { type: "image/png" }),
    );
    const res = await POST(
      new Request("http://test/api/read", { method: "POST", body: form }),
    );
    const body = await res.json();

    expect(body.summary).toBe(SAFE_FALLBACK);
    expect(body.required_action).toBe(SAFE_FALLBACK);
    expect(body.deadline_quote).toBe(SAFE_FALLBACK);
    expect(body.documents).toEqual([
      "Pay stubs for January 2027",
      SAFE_FALLBACK,
    ]);
    expect(findForbiddenClaims(JSON.stringify(body))).toEqual([]);
  });
});
