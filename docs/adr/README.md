# Architecture decision records

Each ADR records one decision, the options considered and the consequences.

| Number                              | Title                                | Status   |
| ----------------------------------- | ------------------------------------ | -------- |
| [0000](0000-template.md)            | Template (`ADR-NNNN: <short title>`) | Template |
| [0001](0001-stack.md)               | Application stack                    | Accepted |
| [0002](0002-letter-reading.md)      | Letter reading approach              | Accepted |
| [0003](0003-model-provider.md)      | Model and provider                   | Accepted |
| [0004](0004-privacy-retention.md)   | Privacy and data retention           | Accepted |
| [0005](0005-safety-guardrails.md)   | Safety guardrails                    | Accepted |
| [0006](0006-exemption-screening.md) | Exemption screening logic            | Accepted |
| [0007](0007-testing-strategy.md)    | Testing strategy                     | Accepted |
| [0008](0008-ci-cd-hosting.md)       | CI/CD and hosting                    | Accepted |
| [0009](0009-dependency-policy.md)   | Dependency policy                    | Accepted |

## Add an ADR

1. Copy `0000-template.md` to `NNNN-short-name.md`, using the next unused number.
2. Change the heading to `# ADR-NNNN: <title>` and fill in the sections.
3. Set the `- Status:` line to `Proposed` or `Accepted`.
4. Add a row to the table above.

When a decision is replaced, set the old ADR's status to `Superseded by ADR-XXXX` and leave its text as written.

Back to [docs](../README.md).
