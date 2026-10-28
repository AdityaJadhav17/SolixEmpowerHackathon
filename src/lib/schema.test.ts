import { expect, it } from "vitest";
import fixture from "../../tests/fixtures/reader/synthetic-work-requirement.json";
import { LetterExtraction } from "./schema";

it("accepts the recorded reader fixture", () => {
  expect(LetterExtraction.safeParse(fixture).success).toBe(true);
});

it.each([
  ["unknown notice type", { notice_type: "eligible" }],
  ["non-ISO deadline", { deadline: "02/15/2027" }],
  ["bad confidence", { confidence: "certain" }],
  ["documents not a list", { documents: "Pay stubs" }],
])("rejects %s", (_, patch) => {
  expect(LetterExtraction.safeParse({ ...fixture, ...patch }).success).toBe(
    false,
  );
});
