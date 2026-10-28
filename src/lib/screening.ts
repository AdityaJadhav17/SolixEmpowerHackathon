export type Exemption = { id: string; question: string };

// Deterministic: rules answered "yes" may apply (ADR-0006). Never decides eligibility.
export function mayApply<T extends Exemption>(
  answers: Record<string, boolean>,
  rules: { exemptions: T[] },
): T[] {
  return rules.exemptions.filter((e) => answers[e.id] === true);
}
