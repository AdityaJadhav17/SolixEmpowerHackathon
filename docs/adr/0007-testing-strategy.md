# ADR-0007: Testing strategy

- Status: Accepted
- Date: 2026-10-28

## Decision outcome

- Vitest for unit, integration and safety suites.
- Playwright for E2E on a mobile viewport, with axe accessibility checks.
- fast-check for property tests on date and deadline parsing.
- The live model is never called in PR CI. It runs only in the eval job ([eval.md](../eval.md)).

Details and examples: [testing.md](../testing.md).

### Consequences

- Good: PR CI is deterministic, free and fast.
- Bad: model regressions show up only in the eval job, so run it before the demo.
