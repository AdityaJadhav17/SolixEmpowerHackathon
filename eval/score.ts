const STOPWORDS = new Set([
  "a",
  "an",
  "and",
  "the",
  "of",
  "to",
  "for",
  "or",
  "your",
  "you",
  "by",
  "in",
  "on",
  "with",
  "from",
  "that",
  "this",
  "our",
  "us",
]);

export function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t && !STOPWORDS.has(t)),
  );
}

// Match if every meaningful word of the label appears in the model output.
export function textMatches(
  expected: string | null,
  actual: string | null,
): boolean {
  if (expected === null || actual === null) return expected === actual;
  const actualTokens = tokens(actual);
  return [...tokens(expected)].every((t) => actualTokens.has(t));
}

export function deadlineMatches(
  expected: string | null,
  actual: string | null,
): boolean {
  return expected === actual;
}

export function documentScores(
  expected: string[],
  actual: string[],
): { precision: number; recall: number } {
  const matchedExpected = expected.filter((e) =>
    actual.some((a) => textMatches(e, a)),
  ).length;
  const matchedActual = actual.filter((a) =>
    expected.some((e) => textMatches(e, a)),
  ).length;
  return {
    precision:
      actual.length === 0
        ? expected.length === 0
          ? 1
          : 0
        : matchedActual / actual.length,
    recall: expected.length === 0 ? 1 : matchedExpected / expected.length,
  };
}

// Stage claim uses `printed` (labels that have a date); `none` is reported separately.
export function deadlineSplit(
  rows: { expected: string | null; correct: boolean }[],
) {
  const tally = (group: typeof rows) => ({
    correct: group.filter((r) => r.correct).length,
    total: group.length,
  });
  return {
    printed: tally(rows.filter((r) => r.expected !== null)),
    none: tally(rows.filter((r) => r.expected === null)),
  };
}
