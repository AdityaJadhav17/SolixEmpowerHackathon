import rules from "../../data/rules/or.json";
import { deadlineStatus } from "./deadline";

export const CONDITION_PLACEHOLDER =
  "[describe your condition in your own words]";

const date = (d: Date, timeZone: string) =>
  d.toLocaleDateString("en-US", {
    timeZone,
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Template only, no model call (US-040). Asks the doctor; never names a diagnosis
// or says the patient qualifies (ADR-0005).
export function buildDoctorDraft({
  deadline,
  today,
}: {
  deadline: string | null;
  today: Date;
}): string {
  const { status } = deadlineStatus(deadline, today);
  const by =
    status === "unknown"
      ? null
      : status === "passed"
        ? "I need this as soon as possible."
        : `I need this by ${date(new Date(`${deadline}T00:00:00Z`), "UTC")}.`;
  return [
    `Date: ${date(today, "America/Los_Angeles")}`,
    "",
    "Hello Dr. [doctor's name],",
    "",
    "The Oregon Health Plan (OHP) has new work and activity rules. Some adults need to show 80 hours a month of work or other activities.",
    "",
    "Could you write a statement about whether I have a health condition that limits my ability to work or do activities for 80 hours a month?",
    "",
    `About my health: ${CONDITION_PLACEHOLDER}`,
    ...(by ? ["", by] : []),
    "",
    `OHP rules: ${rules.source_url}`,
    "",
    "Thank you,",
    "[your name]",
    "[your date of birth]",
  ].join("\n");
}
