# ADR-0008: CI/CD and hosting

- Status: Proposed
- Date: 2026-10-28

## Decision outcome

- GitHub Actions: `ci.yml` (PR and main gates), `eval.yml` (manual and nightly), `security.yml` (nightly audit). Details: [ci.md](../ci.md).
- Hosting: Vercel free tier. Production deploys from `main` only, after all gates pass, via the Vercel CLI using the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repo secrets. If the secrets are missing, the deploy job skips with a notice.
- `ANTHROPIC_API_KEY` lives in Vercel environment variables, and as a GitHub secret used only by `eval.yml`.

### Consequences

- Good: one pipeline, one path to production.
- Bad: Vercel's GitHub app can also deploy on its own. Turn off its automatic production deploys so CI is the only path to prod.
