# HANDOFF

> **Every contributor reads this first and updates sections 1-3 before ending a work session.**

## 1. Status

_2026-10-28 15:50 PDT._ **Backend, UI, doctor draft (PR #6), eval set (PR #7) and UI polish (PR #8, merged 15:47) are all on `main`. Production deploy after the merge not yet confirmed.**

- Backend (Eng A, merged via PR #2): `readLetter` calls `claude-opus-5-5` (effort medium, structured output via `zodOutputFormat`), falls back to a low-confidence "unsure" result on refusal/empty/invalid output, retries once on 429/5xx. `POST /api/read` takes multipart `image` (jpeg/png/webp, max 4 MB), applies the guardrail to every user-facing string (`summary`, `required_action`, `deadline_quote`, each of `documents`); model call has `max_tokens` 16000 (thinking counts toward it) and a 30 s timeout, logs only status/latency/model/error class. `LETTER_READER=fixture` returns the recorded fixture with no network. One real call on a synthetic notice returned schema-valid JSON in ~6 s.
- Copy + SEO (Eng B, `feat/copy-seo`, PR open): plainer OHP wording on every screen (fixed ADR-0006 wording and test-used labels unchanged); `metadataBase` from `VERCEL_PROJECT_PRODUCTION_URL`, canonical, Open Graph + Twitter card, generated OG image, `robots.txt` (blocks `/api/`), `sitemap.xml`, SVG icon (fixes `/favicon.ico` 404); CSS inlined (`experimental.inlineCss`). Lighthouse on `next start`, before → after: mobile 99/100/96/100 → 99/100/100/100, desktop 100/100/100/100; mobile LCP 2.2 s, CLS 0. Legacy-JS polyfills kept on purpose for older Android Chrome.
- UI polish (Eng B, PR #8, merged): CSS-only native feel (safe areas, `100dvh`, no tap flash, hover gated to mouse, 16px inputs), deadline card as hero (big date, status icon + text, never color alone), short screen fade-in and checklist tick, all motion off under `prefers-reduced-motion`, dark mode via tokens on `:root`, translucent call bar with solid fallback under `prefers-reduced-transparency`. Only `globals.css` and the `viewport` export in `layout.tsx` changed; doctor-note textarea border raised to `--muted` (3:1). Before/after shots in `docs/screenshots/ui-polish/`. Green locally and in CI: lint, format, typecheck, unit (113), integration (7), safety (18), build, E2E (30, incl. dark-mode axe), hygiene. **Not checked on a real iPhone yet.**
- UI (Eng B, PR #3, merged): consent → capture → result (summary, deadline + days left + highlighted quote, checklist, who to call) → exemption screening, plus offline, error, low-confidence and not-OHP screens. Low confidence is checked before `notice_type`, per Eng A's contract. Pure logic in `src/lib/deadline.ts`, `screening.ts`, `image.ts`, `phone.ts`. E2E mocks `/api/read`. Not yet checked on a real iPhone.
- Security audit (Eng D, ~15:45 PDT): one High finding, H1: `/api/read` had no auth or rate limit, so anyone with the URL could spend the API budget. PR `fix/read-rate-limit` adds a per-IP limit of 10 reads/min (429 with the OHP phone number) and rejects a declared body over ~4.06 MB before buffering it. The limit is per server instance, so it's a speed bump only. **Owner action still needed:** set a spend limit on the Anthropic workspace and add a Vercel Firewall rate-limit rule on `/api/read`. Low items not fixed yet: eval.yml key exposed to `npm ci` scripts, Vercel token set job-wide, no security headers.
- Prompt v2 (Eng D, ~16:10 PDT, `fix/prompt-confidence`): QA found all 3 Oregon sample notices came back `confidence: "low"`, so the UI said "couldn't read clearly". Cause: prompt v1 told the model to set low confidence whenever there was no deadline or only a placeholder. v2 uses null for a missing or placeholder deadline without lowering confidence; "low" is only for a hard-to-read photo or competing dates. Eval not re-run with v2 (no API key locally); checked on the PR preview instead.
- Eval: 10 notices + 3 phone photos labeled; dev and test runs done (PR #7). ADRs still **Proposed**. Deadline: **18:00 PDT today** (Devpost).

Eng D update (2026-10-28 ~15:15 PDT): PR `feat/doctor-draft` adds US-040/US-041. After screening, if "health_condition" was answered yes, "Draft a note to my doctor" opens an editable textarea with a template note (no LLM): asks the doctor for a statement on whether a health condition limits work/activities for 80 hours a month, includes the letter deadline if known, a `[describe your condition in your own words]` placeholder, and the OHP source URL. Copy (clipboard) and Share (only if `navigator.share` exists). Nothing sent or stored. Copy failure shows "Couldn't copy. Press and hold the text to copy it." (review fix). Locally green: lint, format, typecheck, unit (113), integration (7), safety (18), build, E2E (28). Hard stop: merged with green CI by 17:00 PDT or dropped.

Eng C update (2026-10-28 ~14:45 PDT): PR #4 (`eval/dataset`) adds 10 labeled public .gov sample notices (page 1 of each PDF; 3 Oregon, 7 Vermont; 4 dev, 6 test; split fixed before any run). Only 3 true Oregon sample notices exist online, so Vermont fills the rest. Dev run (prompt v1): deadline 4 of 4, notice type 4 of 4, required action 1 of 4 (strict token-subset metric, labels are long phrases), doc recall 0.75, precision 0.63, guardrail hits 0. **Test split NOT run yet:** waiting for the 3 phone photos of printed samples so the test run happens once on the full set. Photos still needed from a human with an iPhone (print any `eval/letters/*.png`, save as `<id>-photo.jpg` with location stripped, add labels).

Eng C update 2 (~14:50 PDT): required_action labels shortened to 2-4 key words (all splits); `eval/run.ts` now reports "Printed deadline read correctly" and "No deadline correctly reported as none" (stage claim uses the first); `deadlineSplit` unit-tested. Dev re-run: printed deadline 2 of 2, none 2 of 2, type 4 of 4, action 2 of 4, doc recall 1.00, precision 0.88, guardrail 0. Test still NOT run: the 3 iPhone photos from Eng B are not in the repo or on this machine yet.

Eng C update 3 (~15:10 PDT): 3 phone photos added (`*-photo.jpg`, test split; note they are photos of a screen, not of printed paper). Test split run ONCE (13 labeled letters total: 4 dev, 9 test), prompt v1: printed deadline 4 of 4, no deadline correctly none 5 of 5, notice type 8 of 9 (miss: vt-re005ep-renewal-decision), required action 6 of 9 (misses: or-med005-eligibility, vt-ee415-work-heads-up, vt-ee307-renewal-ending-photo), doc recall 1.00, precision 0.83, guardrail 0. Do not tune the prompt on these test failures. Still open: video, README Demo section, Devpost.

## 2. Current task and next 3 actions

Current task: approve ADR-0001 to ADR-0009, then build the MVP ([mvp.md](docs/mvp.md) milestones).

1. **Eng A:** (PR #2 merged) run `npm run eval` once Eng C has labels. API contract for Eng B: `POST /api/read` (form field `image`) returns `LetterExtraction` JSON on 200, or `{ error }` on 400/413/429/502 (502 message includes the OHP phone). When `confidence` is `"low"`, show the "we couldn't read this" state and ignore `notice_type` (the unsure result uses `other_medicaid` even for non-letters).
2. **Eng B:** merge `feat/copy-seo`; confirm the production deploy ran and the OG preview shows when the link is shared; then run `npm run dev` with `LETTER_READER=fixture` and test the flow on a real iPhone on the same Wi-Fi (`http://<laptop-ip>:3000`).
3. **Eng D:** (PR #6 merged) test Copy/Share on a real iPhone.
4. **Eng C:** collect 10-15 public Oregon sample notices into `eval/letters/` (PNG/JPEG; convert PDF pages), label them in `eval/labels.json`, take 3 phone photos of printed samples. Then the video and Devpost write-up.

## 3. Recent changes (newest first)

0. 2026-10-28: Eng D: prompt v2: a missing or placeholder deadline no longer forces `confidence: "low"` (`src/prompts/letter-reader.ts`).
1. 2026-10-28: Eng B: copy pass (plain, OHP-specific), SEO metadata/OG image/robots/sitemap/icon, inline CSS, screen fade starts at 0.5 opacity so LCP counts the first paint.
2. 2026-10-28: Eng D: `/api/read` rate limit (`src/lib/rate-limit.ts`, 10/min per `x-forwarded-for` IP) + Content-Length cap, with unit and integration tests (security audit H1, L1).
3. 2026-10-28: Eng B: UI polish (PR #8, merged 15:47 with all CI green) in `globals.css`: native mobile fixes, deadline hero with status icons, motion with reduced-motion off switch, dark mode; `viewport-fit=cover` + per-scheme `themeColor`; E2E dark-mode axe check, a11y helper waits for fade-ins.
4. 2026-10-28: Eng D: doctor note draft (US-040, US-041): `src/lib/doctor-draft.ts` (`buildDoctorDraft`, template only, injected clock), `DoctorDraft` in the screened view of `page.tsx`, unit + safety + E2E (`tests/e2e/doctor-draft.spec.ts`). Answers Q3: in scope if merged by 17:00.
5. 2026-10-28: Eng C: eval dataset (10 notices + 3 phone photos), dev and test runs done. Video, README demo section, Devpost still open.
6. 2026-10-28: PR #3 review fix: `phoneHref()` in `src/lib/phone.ts` dials the first full US number (ignores extensions/TTY), else `tel:+18006999075`. Before, `800-699-9075 (TTY 711)` dialed 699-907-5711.
7. 2026-10-28: Mobile UI flow (`src/app/page.tsx`, `globals.css`, Atkinson Hyperlegible via `next/font`). Every model string goes through `enforceGuardrail`; results live in React state only. Bottom call bar on every screen uses the letter's phone, else 800-699-9075.
8. 2026-10-28: `deadline.ts` (days left in America/Los_Angeles, fast-check property), `screening.ts` (rules answered yes may apply, no LLM), `image.ts` (reject non-image / >15 MB, re-encode to JPEG ≤ 2000 px and ≤ 2 MB).
9. 2026-10-28: E2E `tests/e2e/flow.spec.ts` mocks `/api/read` with `page.route` and fixes the clock with `page.clock`; safety suite now also scans the UI strings in `page.tsx`.
10. 2026-10-28: PR #2 review fixes: guardrail on `deadline_quote` and `documents`, `max_tokens` 16000 with non-`end_turn` stop treated as unsure, 30 s SDK timeout, lockfile regenerated with npm 10.
11. 2026-10-28: `readLetter` (Anthropic SDK 1.3.0, structured output, unsure fallback, single 429/5xx retry, fixture mode) and `POST /api/read` with guardrail; unit, integration and safety tests incl. adversarial fixture `tests/fixtures/adversarial/eligible-summary.json`.
12. 2026-10-28: Docs set (HANDOFF, personas, user stories, MVP, eval, safety, testing, CI, ADR-0000 to 0009).
13. 2026-10-28: Next.js 16 + TypeScript skeleton; guardrail filter, schema, prompt v1, eval scoring + runner, Oregon rules data.
14. 2026-10-28: CI split into `ci.yml`, `eval.yml`, `security.yml`; Dependabot; PR template.
15. 2026-10-28: Ignore rules and `.git/info/exclude` for local tool config files; hygiene check in CI.
16. 2026-10-28: Initial scaffold, community files, README author line.

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
- E2E mocks `/api/read`; there is no E2E run against the real route (fixture mode) yet.
- Not covered by a test: double-tap guard (code uses a ref), camera permission denied (browser falls back to the file picker by itself).

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
