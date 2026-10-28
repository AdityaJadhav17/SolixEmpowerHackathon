// Phrases that state or deny eligibility. The app may describe what a letter asks for,
// never whether the user qualifies (ADR-0005).
// "if you qualify" / "whether you are eligible" are questions, not claims.
const NOT_A_QUESTION = String.raw`(?<!\b(?:if|whether)\s)`;
const FORBIDDEN_PATTERNS: RegExp[] = [
  String.raw`\byou(?:'re|\s+are)\s+(?:not\s+)?(?:eligible|ineligible|exempt|approved|qualified)\b`,
  String.raw`\byou\s+(?:do\s+not\s+|don't\s+|will\s+not\s+|won't\s+)?qualify\b`,
  String.raw`\byou\s+will\s+(?:not\s+)?(?:be\s+)?(?:approved|denied|covered|eligible|exempt)\b`,
  String.raw`\byou\s+(?:are|'re)\s+(?:not\s+)?(?:going\s+to\s+)?(?:keep|lose)\s+(?:your\s+)?coverage\b`,
].map((p) => new RegExp(NOT_A_QUESTION + p, "i"));

export const SAFE_FALLBACK =
  "We can't decide if you qualify. Only the state can. Call OHP at 800-699-9075 to ask.";

export function findForbiddenClaims(text: string): string[] {
  const normalized = text.replace(/\s+/g, " ").replace(/[’‘]/g, "'");
  return FORBIDDEN_PATTERNS.flatMap((pattern) => {
    const match = normalized.match(pattern);
    return match ? [match[0]] : [];
  });
}

export function enforceGuardrail(text: string): {
  text: string;
  blocked: boolean;
} {
  return findForbiddenClaims(text).length > 0
    ? { text: SAFE_FALLBACK, blocked: true }
    : { text, blocked: false };
}
