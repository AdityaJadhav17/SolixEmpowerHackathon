import { describe, expect, it } from "vitest";
import {
  enforceGuardrail,
  findForbiddenClaims,
  SAFE_FALLBACK,
} from "./guardrails";

describe("findForbiddenClaims", () => {
  it.each([
    "You are eligible for OHP.",
    "you're not eligible",
    "You qualify for an exemption",
    "You don't qualify",
    "You will be approved",
    "You are exempt from the work rules",
    "You’re  EXEMPT",
    "You are going to keep your coverage",
  ])("flags %j", (text) => {
    expect(findForbiddenClaims(text)).not.toHaveLength(0);
  });

  it.each([
    "This letter asks you to report your work hours by December 15.",
    "This may apply to you. Ask OHP about it.",
    "The letter explains eligibility rules for adults 19-64.",
    "Send pay stubs or a letter from your employer.",
    "OHP decides if you qualify.",
    "Ask whether you are exempt.",
  ])("allows %j", (text) => {
    expect(findForbiddenClaims(text)).toEqual([]);
  });
});

describe("enforceGuardrail", () => {
  it("replaces a forbidden claim with the safe fallback", () => {
    expect(enforceGuardrail("Good news: you are eligible!")).toEqual({
      text: SAFE_FALLBACK,
      blocked: true,
    });
  });

  it("passes safe text through unchanged", () => {
    expect(enforceGuardrail("Call 800-699-9075.")).toEqual({
      text: "Call 800-699-9075.",
      blocked: false,
    });
  });

  it("keeps the fallback itself free of forbidden claims", () => {
    expect(findForbiddenClaims(SAFE_FALLBACK)).toEqual([]);
  });
});
