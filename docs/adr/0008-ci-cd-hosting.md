# ADR-0008: CI/CD and hosting

- Status: Accepted
- Date: 2026-10-28

## Decision outcome

- GitHub Actions: `ci.yml` (PR and main gates) and `security.yml` (nightly audit). The real-model eval is not in CI; it runs locally so CI never spends API credits. Details: [ci.md](../ci.md).
- Hosting: Vercel free tier. Production deploys from `main` only, after all gates pass, via the Vercel CLI using the `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` repo secrets. If the secrets are missing, the deploy job skips with a notice.
- `ANTHROPIC_API_KEY` lives only in Vercel environment variables and each developer's `.env.local`. It is not a GitHub secret.

### Consequences

- Good: one pipeline, one path to production.
- Bad: Vercel's GitHub app can also deploy on its own. Turn off its automatic production deploys so CI is the only path to prod.
