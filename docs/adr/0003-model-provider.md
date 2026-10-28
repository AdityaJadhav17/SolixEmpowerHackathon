# ADR-0003: Model and provider

- Status: Proposed
- Date: 2026-10-28

## Context and problem statement

We hold API keys for Anthropic, OpenAI and Google. We need strong vision on messy photos, reliable structured JSON, and a pinned model so eval runs are comparable.

## Considered options

1. **Anthropic Claude Opus 5.5 (`claude-opus-5-5`)** via `@anthropic-ai/sdk`, with structured outputs (`output_config.format`)
2. An OpenAI vision model
3. A Google Gemini vision model

## Decision outcome

Chosen option: **1** as the default. Structured outputs return schema-valid JSON, the SDK is first-party TypeScript, and the model ID is a fixed string recorded in every eval result. Effort is set explicitly to `medium` instead of relying on the default.

The reader sits behind one interface, `readLetter(image): Promise<LetterExtraction>` in `src/lib/letter-reader.ts`, so another provider can be added later and compared on the same eval set. No second provider in the MVP.

### Consequences

- Good: one SDK, one schema path, comparable eval runs.
- Bad: single-provider dependency during the demo. Mitigation: a recorded fixture mode (`LETTER_READER=fixture`) so the stage demo still runs if the API is down.

## Links

- Anthropic models overview: https://docs.anthropic.com/en/docs/about-claude/models
