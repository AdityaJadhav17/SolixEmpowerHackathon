# ADR-0002: Letter reading approach

- Status: Proposed
- Date: 2026-10-28

## Context and problem statement

Input is a phone photo of a printed state notice: skewed, shadowed, sometimes cropped. We need structured fields (notice type, deadline, required action, documents, contact) that we can score.

## Considered options

1. **Vision LLM reads the image directly and returns schema-constrained JSON**
2. OCR (Tesseract or cloud OCR), then a text LLM
3. OCR + regex/rules only

## Decision outcome

Chosen option: **1**. One call, no OCR dependency, and the model handles layout (tables, headers, "respond by" boxes) that OCR flattens. Output is constrained to the zod schema in `src/lib/schema.ts` and validated again on our side. Anything that fails validation is treated as "unsure" (US-013) and never shown as fact.

The model also returns the exact quoted text it took the deadline from, so the UI can show the source line and the eval can audit it.

### Consequences

- Good: least code; accuracy is measurable with the eval ([eval.md](../eval.md)).
- Bad: per-call cost and a few seconds of latency. Acceptable for a demo.
- Bad: the model can misread digits. Mitigated by showing the quoted source text and doing deadline math in code, not in the model.
