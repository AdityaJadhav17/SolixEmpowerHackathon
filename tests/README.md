# tests

Tests that sit outside `src/`: route and data checks, the safety gate, browser journeys, and their fixtures.

Unit tests are not here. They live next to the code as `*.test.ts` (in `../src/lib/`, `../src/prompts/` and `../eval/`).

## Contents

| Path                                              | What it covers                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `integration/health.test.ts`                      | `GET /api/health`                                                                            |
| `integration/read-route.test.ts`                  | `POST /api/read` request handling                                                            |
| `integration/rules-data.test.ts`                  | `../data/rules/or.json`: oregon.gov source, retrieval date, unique ids, questions end in `?` |
| `safety/guardrails.test.ts`                       | Adversarial eligibility phrases, doctor draft, rules text                                    |
| `safety/read-route.test.ts`                       | The read route replaces a model output that claims eligibility                               |
| `e2e/home.spec.ts`                                | Home page content and accessibility (axe)                                                    |
| `e2e/flow.spec.ts`                                | Photo to result, passed or missing deadline, low confidence, non-OHP letter, screening       |
| `e2e/doctor-draft.spec.ts`                        | Doctor draft flow                                                                            |
| `fixtures/reader/synthetic-work-requirement.json` | Synthetic extraction returned when `LETTER_READER=fixture`                                   |
| `fixtures/adversarial/eligible-summary.json`      | Model output that breaks the no-eligibility rule, used by the safety tests                   |

## Commands

```bash
npm test                  # unit project, with coverage (70% line threshold)
npm run test:integration
npm run test:safety
npm run build && npm run test:e2e
```

Playwright runs on the Pixel 7 and iPhone 15 device profiles against `next start` on port 3100 with `LETTER_READER=fixture`, so it needs a production build first and makes no model calls.

## Adding tests

- Unit: add `<name>.test.ts` beside the module.
- Route or data checks: add a file under `integration/` (matched by `integration/**/*.test.ts`).
- Anything that must never reach a user: add to `safety/`.
- New journeys: add a spec under `e2e/`. Put canned model output in `fixtures/`.

See [../docs/testing.md](../docs/testing.md) and [../docs/adr/0007-testing-strategy.md](../docs/adr/0007-testing-strategy.md).
