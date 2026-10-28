import { expect, it } from "vitest";
import rules from "../../data/rules/or.json";

it("cites an official .gov source and a retrieval date", () => {
  expect(rules.source_url).toMatch(/^https:\/\/www\.oregon\.gov\//);
  expect(rules.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
});

it("has unique exemption IDs, each phrased as a question", () => {
  const ids = rules.exemptions.map((e) => e.id);
  expect(new Set(ids).size).toBe(ids.length);
  for (const e of rules.exemptions) expect(e.question.endsWith("?")).toBe(true);
});
