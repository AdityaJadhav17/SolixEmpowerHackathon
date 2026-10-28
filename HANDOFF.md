# HANDOFF

> **Every contributor reads this first and updates sections 1-3 before ending a work session.**

## 1. Status

_2026-10-28 14:20 PDT._ Letter reader backend is in (branch `eng-a`): `readLetter` calls `claude-opus-5-5` (effort medium, structured output via `zodOutputFormat`), falls back to a low-confidence "unsure" result on refusal/empty/invalid output, retries once on 429/5xx. `POST /api/read` takes multipart `image` (jpeg/png/webp, max 4 MB), applies the guardrail to `summary` and `required_action`, logs only status/latency/model/error class. `LETTER_READER=fixture` returns the recorded fixture with no network. One real call on a synthetic notice returned schema-valid JSON in ~6 s. Home page still static; `eval/labels.json` still empty. Locally green: lint, typecheck, unit (44), integration (7), safety (14), build, hygiene. ADRs still **Proposed**. Deadline: **18:00 PDT today** (Devpost).

## 2. Current task and next 3 actions

Current task: approve ADR-0001 to ADR-0009, then build the MVP ([mvp.md](docs/mvp.md) milestones).

1. **Eng A:** review/merge the `eng-a` PR; then run `npm run eval` once Eng C has labels. API contract for Eng B: `POST /api/read` (form field `image`) returns `LetterExtraction` JSON on 200, or `{ error }` on 400/413/502 (502 message includes the OHP phone).
2. **Eng B:** mobile flow in `src/app/page.tsx`: consent → capture → result (summary, deadline + days left, checklist, phone) → exemption questions from `data/rules/or.json`. Stories US-001, US-003, US-005, US-020 to US-023, US-030, US-031, US-053 to US-055.
3. **Eng C:** collect 10-15 public Oregon sample notices into `eval/letters/` (PNG/JPEG; convert PDF pages), label them in `eval/labels.json`, take 3 phone photos of printed samples. Then the video and Devpost write-up.

## 3. Recent changes (newest first)

1. 2026-10-28: `readLetter` (Anthropic SDK 1.3.0, structured output, unsure fallback, single 429/5xx retry, fixture mode) and `POST /api/read` with guardrail; unit, integration and safety tests incl. adversarial fixture `tests/fixtures/adversarial/eligible-summary.json`.
2. 2026-10-28: Docs set (HANDOFF, personas, user stories, MVP, eval, safety, testing, CI, ADR-0000 to 0009).
3. 2026-10-28: Next.js 16 + TypeScript skeleton; guardrail filter, schema, prompt v1, eval scoring + runner, Oregon rules data.
4. 2026-10-28: CI split into `ci.yml`, `eval.yml`, `security.yml`; Dependabot; PR template.
5. 2026-10-28: Ignore rules and `.git/info/exclude` for local tool config files; hygiene check in CI.
6. 2026-10-28: Initial scaffold, community files, README author line.

## 4. Open questions and assumptions

Open questions (need a team decision):

- Q1: Approve ADR-0001 (Next.js on Vercel) and ADR-0003 (`claude-opus-5-5`)? Everything else builds on these.
- Q2: Who owns the Vercel project and adds `VERCEL_*` secrets? Without them, deploy skips.
- Q3: Is the doctor-statement draft (US-040) in scope if the MVP is done by 16:30?
- Q4: Product name: keep "Coverage Keeper"? Alternative: "Letter Lifeline".

Assumptions (unverified, check before relying on them):

- Assumption: KFF's final procedural-disenrollment share is about two-thirds (66% in month 12; 69% as of April 2024). Re-check the KFF tracker before quoting on stage. The often-cited "71%" was not found in a primary source.
- Assumption: Oregon publishes enough English sample notices to label 10-15 (the OHA page says sample notices exist in English and Spanish). If not, add other states' public `.gov` samples and label the state.
- Assumption: Oregon's rules in `data/rules/or.json` match the OHA page as retrieved 2026-10-28; Oregon may change details before 2027.
- Assumption: the LLM provider does not train on API data and retains it only briefly. Verify the current terms before any real-user pilot.
- Assumption: Vercel free tier fits (function body limit about 4.5 MB; images are downscaled in the browser).
- Decided: demo phones are iPhones (Safari). Real users are assumed to be mostly on low-cost Android, so E2E runs on both (iPhone 15 and Pixel 7 profiles).

## 5. How to run, test, eval and deploy

```bash
npm ci                       # install from lockfile
npm run dev                  # http://localhost:3000
npm run lint && npm run format:check && npm run typecheck
npm test                     # unit + coverage
npm run test:integration
npm run test:safety          # guardrail suite (blocks the build)
npm run build
npx playwright install chromium
npm run test:e2e             # needs a build first
npm run check:hygiene        # forbidden paths + eval data rules
npm run audit && npm run check:licenses
ANTHROPIC_API_KEY=... npm run eval -- --split test   # real model, costs money
```

Deploy: merge to `main`; CI deploys to Vercel after all gates pass (needs `VERCEL_*` secrets, see [ci.md](docs/ci.md)). Manual fallback: `npx vercel@65.5.0 --prod`.

## 6. Known risks and tech debt

- Biggest risk: running out of time. Cut US-031 and US-053 before cutting the eval.
- Eval set may be thin or mostly clean PDFs; photo accuracy may be lower than PDF accuracy. Report both.
- Live demo depends on one provider; keep fixture mode ready.
- `eval.yml` nightly fails until labels and the reader exist (expected).
- actionlint and gitleaks were not run locally (YAML parse-checked only); first CI run is their first real check.
- E2E covers only the static home page until the flow exists.

## 7. Doc map

- [README.md](README.md)
- [docs/personas.md](docs/personas.md)
- [docs/user-stories.md](docs/user-stories.md)
- [docs/mvp.md](docs/mvp.md)
- [docs/eval.md](docs/eval.md)
- [docs/safety-and-privacy.md](docs/safety-and-privacy.md)
- [docs/testing.md](docs/testing.md)
- [docs/ci.md](docs/ci.md)
- ADRs: [0000 template](docs/adr/0000-template.md), [0001 stack](docs/adr/0001-stack.md), [0002 letter reading](docs/adr/0002-letter-reading.md), [0003 model/provider](docs/adr/0003-model-provider.md), [0004 privacy](docs/adr/0004-privacy-retention.md), [0005 guardrails](docs/adr/0005-safety-guardrails.md), [0006 exemption screening](docs/adr/0006-exemption-screening.md), [0007 testing](docs/adr/0007-testing-strategy.md), [0008 CI/CD](docs/adr/0008-ci-cd-hosting.md), [0009 dependencies](docs/adr/0009-dependency-policy.md)
- Workflows: [ci.yml](.github/workflows/ci.yml), [eval.yml](.github/workflows/eval.yml), [security.yml](.github/workflows/security.yml)
