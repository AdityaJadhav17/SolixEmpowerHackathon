import { expect, it } from "vitest";
import { findForbiddenClaims } from "@/lib/guardrails";
import { LETTER_READER_SYSTEM_PROMPT, PROMPT_VERSION } from "./letter-reader";

it("matches the golden prompt (bump PROMPT_VERSION when this snapshot changes)", () => {
  expect({ PROMPT_VERSION, LETTER_READER_SYSTEM_PROMPT }).toMatchSnapshot();
});

it("contains no eligibility claims itself", () => {
  expect(findForbiddenClaims(LETTER_READER_SYSTEM_PROMPT)).toEqual([]);
});
