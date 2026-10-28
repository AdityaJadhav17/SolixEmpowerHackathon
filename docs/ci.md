# CI/CD

Workflows live in `.github/workflows/`. Decision record: [ADR-0008](adr/0008-ci-cd-hosting.md).

## `ci.yml` (every PR and every push to `main`)

Cheap gates run in parallel; build waits for all of them; deploy waits for everything.

| #   | Job                 | What it does                                                                                                | Fails the build when                                                                                                                                                                                                                                                                                                            | Run locally                                                            |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 1   | (every job) install | `npm ci` from `package-lock.json`, npm cache via setup-node                                                 | lockfile and `package.json` disagree                                                                                                                                                                                                                                                                                            | `npm ci`                                                               |
| 2   | `audit`             | `npm audit --audit-level=high`, license allowlist, osv-scanner on the lockfile                              | any high/critical advisory; a production license outside the allowlist                                                                                                                                                                                                                                                          | `npm run audit && npm run check:licenses`                              |
| 3   | `hygiene`           | `scripts/check-hygiene.mjs` + gitleaks over full history                                                    | a tool-config path is tracked (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`, `.claude/`, `.cursor/`, `.cursorrules`, `.windsurf/`, `.aider*`, `.mcp.json`, `.copilot/`, `skills/`, `SKILL.md`); an `eval/letters` file is not labeled; a label's source is not a `.gov` URL; SSN / non-.gov email / DOB pattern in `eval/`; any secret | `npm run check:hygiene` (gitleaks: `gitleaks git .` if installed)      |
| 4   | `lint`              | ESLint, Prettier check, `tsc --noEmit`                                                                      | any error or unformatted file                                                                                                                                                                                                                                                                                                   | `npm run lint && npm run format:check && npm run typecheck`            |
| 5   | `unit`              | Vitest unit project with coverage; diff-cover on PRs                                                        | a failing test; global lines < 70%; changed lines < 80%                                                                                                                                                                                                                                                                         | `npm test`                                                             |
| 6   | `safety`            | Guardrail suite                                                                                             | any forbidden eligibility phrase in fixtures, rules or adversarial cases                                                                                                                                                                                                                                                        | `npm run test:safety`                                                  |
| 7   | `integration`       | Route handlers and rules data with real modules                                                             | a failing test                                                                                                                                                                                                                                                                                                                  | `npm run test:integration`                                             |
| 8   | `build`             | `next build`, uploads `.next`                                                                               | build error                                                                                                                                                                                                                                                                                                                     | `npm run build`                                                        |
| 9   | `e2e`               | Playwright (Pixel 7 profile) against the built app with `LETTER_READER=fixture`; traces uploaded on failure | a failing journey or a serious/critical axe violation                                                                                                                                                                                                                                                                           | `npm run build && npx playwright install chromium && npm run test:e2e` |
| 10  | `sbom`              | SPDX SBOM artifact (anchore/sbom-action). No Dockerfile, so no container scan.                              | SBOM generation error                                                                                                                                                                                                                                                                                                           | —                                                                      |
| 11  | `deploy`            | Vercel CLI production deploy, `main` push only, after all gates                                             | Vercel CLI error. Skips with a notice if `VERCEL_TOKEN` is unset.                                                                                                                                                                                                                                                               | —                                                                      |

## `eval.yml` (manual dispatch and nightly 02:00 PDT)

Runs `npm run eval` against the real model with `ANTHROPIC_API_KEY`, writes the score table to the job summary, uploads `eval/results/` as an artifact. Never runs on PRs (costs money, non-deterministic). It fails until `eval/labels.json` has entries and `readLetter` is implemented.

Run locally: `ANTHROPIC_API_KEY=... npm run eval -- --split test`

## `security.yml` (nightly 02:30 PDT)

`npm audit` + osv-scanner on `main`, because new CVEs appear without code changes.

## Hardening

- `permissions: {}` at workflow level; each job asks only for what it needs (`contents: read`, plus `pull-requests: read` for gitleaks).
- Every third-party action is pinned to a full commit SHA with the tag in a comment. Dependabot updates them weekly.
- `persist-credentials: false` on checkout. Secrets are only read in `deploy` and `eval`, never echoed.
- PR runs cancel older runs of the same PR. Every job has `timeout-minutes`.

## Secrets to add (repo Settings → Secrets and variables → Actions)

| Secret                                               | Used by         |
| ---------------------------------------------------- | --------------- |
| `ANTHROPIC_API_KEY`                                  | `eval.yml`      |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | `ci.yml` deploy |

Also set `ANTHROPIC_API_KEY` in the Vercel project's environment variables, and create a `production` environment in GitHub (Settings → Environments).

## Branch protection (Settings → Branches → Add rule for `main`)

1. Require a pull request before merging, 1 approval, dismiss stale approvals.
2. Require status checks to pass: `Secrets and repo hygiene`, `Dependency audit and licenses`, `Lint, format, types`, `Unit tests and coverage`, `Safety guardrail suite`, `Integration tests`, `Build`, `E2E (mobile)`.
3. Require branches to be up to date before merging.
4. Block force pushes and deletions.
5. Require review from Code Owners.

On a free plan, branch protection works on public repositories only.
