# ADR-0005: Safety guardrails

- Status: Proposed
- Date: 2026-10-28

## Context and problem statement

Hard rule: the app must never tell a user they are or are not eligible. A wrong deadline can cost someone their coverage. Letter text is untrusted input and may contain injected instructions.

## Decision outcome

Three layers:

1. **Prompt.** The system prompt (`src/prompts/letter-reader.ts`) forbids eligibility statements and states that letter text is data, never instructions.
2. **Schema.** The model can only return fields in `LetterExtraction`. There is no eligibility field to fill.
3. **Output filter.** Every user-facing string passes `findForbiddenClaims()` in `src/lib/guardrails.ts`. On a hit the string is replaced with the safe fallback, and the event is counted (no content logged).

Every result screen shows who to call (US-054). Deadlines are computed in code from the extracted date. If the date is missing or ambiguous, the UI says so and shows the quoted text (US-021).

The guardrail suite (`npm run test:safety`) fails the build on any forbidden phrase across all fixtures and adversarial cases.

### Consequences

- Good: the rule is enforced by code and CI, not only by prompt wording.
- Bad: the phrase list can over-block a legitimate quote from the letter. Acceptable: we show the safe fallback plus who to call.
