# ADR-0004: Privacy and data retention

- Status: Accepted
- Date: 2026-10-28

## Context and problem statement

Medicaid letters contain names, addresses, case numbers and sometimes health information.

## Decision outcome

- Images are processed in memory in the route handler and discarded after the response. No database, no object storage, no image or extraction written to disk or logs.
- The browser keeps results in React state only (no localStorage).
- Logs contain request ID, latency, status, model ID and error class only. Never letter text, image bytes or extracted fields.
- The image goes to exactly one third party, the LLM provider ([ADR-0003](0003-model-provider.md)). This is disclosed on the consent screen (US-055).
- The repo contains only public sample notices ([eval.md](../eval.md)); CI blocks anything else ([ci.md](../ci.md)).

Assumption: provider API data is not used for model training and is kept only for a limited period. Verify against the provider's current commercial terms before any real-user pilot.

### Consequences

- Good: nothing to breach, nothing to delete.
- Bad: a user cannot come back to an earlier result (acceptable; non-goal).
