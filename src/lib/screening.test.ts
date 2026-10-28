import { describe, expect, it } from "vitest";
import rules from "../../data/rules/or.json";
import { mayApply } from "./screening";

const ids = (answers: Record<string, boolean>) =>
  mayApply(answers, rules).map((r) => r.id);

describe("mayApply over Oregon rules", () => {
  it.each(rules.exemptions.map((e) => e.id))(
    "returns %s when only that answer is yes",
    (id) => {
      expect(ids({ [id]: true })).toEqual([id]);
    },
  );

  it.each([
    ["no answers", {}],
    ["all no", Object.fromEntries(rules.exemptions.map((e) => [e.id, false]))],
    ["unknown rule ids", { not_a_rule: true }],
  ])("returns nothing for %s", (_, answers) => {
    expect(ids(answers)).toEqual([]);
  });

  it("keeps the rules file order, not answer order", () => {
    expect(ids({ medicare: true, aian: true })).toEqual(["aian", "medicare"]);
  });

  it("returns every rule when all answers are yes", () => {
    const all = Object.fromEntries(rules.exemptions.map((e) => [e.id, true]));
    expect(ids(all)).toEqual(rules.exemptions.map((e) => e.id));
  });
});
