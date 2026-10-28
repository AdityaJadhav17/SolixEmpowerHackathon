import { describe, expect, it } from "vitest";
import {
  deadlineMatches,
  deadlineSplit,
  documentScores,
  textMatches,
} from "./score";

describe("deadlineMatches", () => {
  it.each([
    ["2026-12-15", "2026-12-15", true],
    ["2026-12-15", "2026-12-16", false],
    [null, null, true],
    [null, "2026-12-15", false],
    ["2026-12-15", null, false],
  ] as const)("expected %s vs actual %s -> %s", (expected, actual, result) => {
    expect(deadlineMatches(expected, actual)).toBe(result);
  });
});

describe("textMatches", () => {
  it("matches when all label words appear in the output, ignoring case and stopwords", () => {
    expect(
      textMatches(
        "Report work hours",
        "You need to report your WORK hours for November.",
      ),
    ).toBe(true);
  });

  it("does not match when a label word is missing", () => {
    expect(textMatches("Report work hours", "Send a pay stub.")).toBe(false);
  });

  it("treats null as matching only null", () => {
    expect(textMatches(null, null)).toBe(true);
    expect(textMatches(null, "something")).toBe(false);
  });
});

describe("documentScores", () => {
  it("scores precision and recall over matched documents", () => {
    expect(
      documentScores(
        ["pay stubs", "class schedule"],
        ["Recent pay stubs", "Photo ID"],
      ),
    ).toEqual({
      precision: 0.5,
      recall: 0.5,
    });
  });

  it("gives full marks when nothing was requested and nothing was returned", () => {
    expect(documentScores([], [])).toEqual({ precision: 1, recall: 1 });
  });

  it("gives zero precision when documents were invented for a letter that requests none", () => {
    expect(documentScores([], ["Photo ID"])).toEqual({
      precision: 0,
      recall: 1,
    });
  });
});

describe("deadlineSplit", () => {
  it("separates printed-date labels from null labels", () => {
    expect(
      deadlineSplit([
        { expected: "2026-01-01", correct: true },
        { expected: "2026-02-01", correct: false },
        { expected: null, correct: true },
      ]),
    ).toEqual({
      printed: { correct: 1, total: 2 },
      none: { correct: 1, total: 1 },
    });
  });
});
