# Testing guide

Stack: Vitest (unit, integration, safety), fast-check (property tests), Playwright + @axe-core/playwright (E2E). Decision: [ADR-0007](adr/0007-testing-strategy.md).

## Pyramid

| Layer                                            | Target share                       | Location                             | Command                    | Speed                |
| ------------------------------------------------ | ---------------------------------- | ------------------------------------ | -------------------------- | -------------------- |
| Unit                                             | ~70%                               | `src/**/*.test.ts`, `eval/*.test.ts` | `npm test`                 | < 10 s total         |
| Integration (route handlers, schema, rules data) | ~20%                               | `tests/integration/`                 | `npm run test:integration` | < 30 s               |
| Contract (LLM response shape)                    | inside unit, via recorded fixtures | `tests/fixtures/reader/`             | `npm test`                 | fast                 |
| Safety (guardrail suite)                         | separate gate                      | `tests/safety/`                      | `npm run test:safety`      | < 10 s               |
| E2E (critical journeys only)                     | ~10%                               | `tests/e2e/`                         | `npm run test:e2e`         | < 2 min              |
| Eval (real model)                                | not in PR CI                       | `eval/`                              | `npm run eval`             | minutes, costs money |

## Unit tests

- Fast, deterministic, no network, no real clock, no randomness without a seed.
- Arrange / Act / Assert, one behavior per test.
- Name: `it("<does what> when <condition>")`, e.g. `it("returns null deadline when the letter shows MM/DD/YYYY")`.
- Inject the clock: functions take `now: Date` instead of calling `new Date()`. Time zone for deadline math is `America/Los_Angeles`.
- Table-driven cases with `it.each` for parsers and rules.
- Property tests (fast-check) for date parsing: any valid date formatted in a supported style parses back to the same ISO date; output is never a date before 2000 or after 2100.

Good:

```ts
it.each([
  ["December 15, 2026", "2026-12-15"],
  ["12/15/2026", "2026-12-15"],
])("parses %s", (input, expected) => {
  expect(parseLetterDate(input)).toBe(expected);
});

it("counts days left from an injected clock", () => {
  const now = new Date("2026-12-01T09:00:00-08:00");
  expect(daysUntil("2026-12-15", now)).toBe(14);
});
```

Bad:

```ts
it("works", async () => {
  const res = await readLetter(realImage); // live model call: slow, costs money, flaky
  expect(daysUntil(res.deadline, new Date())).toBeGreaterThan(0); // real clock: breaks next month
});
```

## LLM-specific rules

- Never call the live model in unit, integration, safety or E2E tests. Use the `fixture` reader (`LETTER_READER=fixture`) or recorded responses in `tests/fixtures/reader/`.
- Every model output is parsed with the zod schema (`src/lib/schema.ts`); tests cover invalid shapes.
- Golden-file test for the prompt: `src/prompts/letter-reader.test.ts` snapshots the system prompt. A prompt change shows up in review as a snapshot diff and must bump `PROMPT_VERSION`.
- Real-model quality is measured only by the eval ([eval.md](eval.md)), run locally on demand with `npm run eval`. It is not part of CI, so CI never spends API credits.

## Failure testing (must have a test each)

| Case                                                         | Expected behavior                                                           |
| ------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Model returns malformed JSON or extra fields                 | Treated as unsure (US-013); no crash                                        |
| Model returns an eligibility claim in any string             | Replaced by safe fallback (US-050)                                          |
| Timeout / 429 rate limit / 5xx                               | One retry with backoff for 429/5xx; then a friendly error with phone number |
| Provider outage                                              | Error screen; fixture mode available for demos                              |
| Partial result (deadline missing)                            | Other fields shown; deadline marked unsure                                  |
| Oversized, corrupt or wrong file type                        | Rejected before model call (US-005)                                         |
| Injected instructions in letter text                         | Output still schema-valid and guardrail-clean (US-052)                      |
| Deadline in the past                                         | "Date has passed" path (US-022)                                             |
| Dates in several formats; month/day ambiguity (`03/04/2027`) | US format assumed for US notices; ambiguous cases flagged                   |
| Duplicate submit (double tap)                                | One request in flight; second tap ignored                                   |
| Camera permission denied                                     | Falls back to file picker with message                                      |
| Request body too large for the host                          | Client downscales; server returns 413 with message                          |

## Safety suite

`npm run test:safety` fails the build if any output contains a forbidden claim. It runs `findForbiddenClaims()` over:

- every recorded fixture response,
- every fixed UI string,
- adversarial strings ("You are eligible", "you qualify", "You will be approved", "you're exempt", "you are not eligible", "you don't qualify", mixed case and extra spaces).

Good:

```ts
it.each(ADVERSARIAL)("blocks %s", (text) => {
  expect(findForbiddenClaims(text)).not.toHaveLength(0);
});
```

Bad:

```ts
it("is safe", () => {
  expect(output.includes("eligible")).toBe(false); // misses "qualify", case, and blocks "eligibility rules" quotes
});
```

## Integration tests

- Call the real route handler functions with real `Request` objects; real zod, real rules JSON.
- Do not mock code we own. Only the LLM boundary is replaced (fixture reader).
- No containers needed: the app has no database or queue. If one is added, use a real container (Testcontainers), not a mock.

Good:

```ts
const res = await GET(new Request("http://test/api/health"));
expect(res.status).toBe(200);
```

Bad:

```ts
vi.mock("@/lib/rules"); // mocks our own rules loader, so the test proves nothing about the data
```

## E2E (Playwright)

- Critical journeys only: photo to explanation, exemption screening, doctor draft (when built).
- Projects `iphone` (iPhone 15, WebKit) and `android` (Pixel 7, Chromium). Demo phones are iPhones, so a WebKit failure blocks the demo.
- Selectors: `getByRole` / `getByLabel`, else `data-testid`. Never CSS classes or text that changes.
- No `waitForTimeout`; wait on locators and responses.
- Trace and screenshot on first retry; uploaded by CI on failure.
- Axe scan on each journey's final screen; serious or critical violations fail.

Good:

```ts
await page.getByRole("button", { name: "Scan my letter" }).click();
await expect(page.getByTestId("deadline")).toContainText("Dec 15, 2026");
```

Bad:

```ts
await page.click(".btn-primary");
await page.waitForTimeout(5000);
```

## Policies

- **Flaky tests:** a test that fails then passes on retry is quarantined the same day (`it.skip` + issue link) and fixed or deleted within 2 days. No blanket retries in unit tests.
- **Coverage:** global floor 70% lines (Vitest thresholds). Changed lines on a PR must be at least 80% covered (diff-cover in CI).
- **TDD:** write the failing test, make it pass, refactor.
- **Bugs:** every bug fix starts with a regression test that fails before the fix.
