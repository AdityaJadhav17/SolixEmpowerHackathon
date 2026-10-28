# ADR-0006: Exemption screening logic

- Status: Accepted
- Date: 2026-10-28

## Context and problem statement

Work-requirement exemptions differ by state and change over time. The LLM must not decide who may be exempt.

## Decision outcome

- Rules are **data**, one JSON file per state: `data/rules/<state>.json`. Each rule has an ID, a plain-language question, proof examples, a `source_url` and a `retrieved` date.
- MVP state: **Oregon** (`data/rules/or.json`), sourced from the Oregon Health Authority page "Federal changes to OHP" (https://www.oregon.gov/oha/hsd/ohp/pages/federal-changes.aspx, page updated 2026-09-18).
- Screening is a deterministic function: answers in, rule IDs that **may apply** out. Output wording is fixed text: "This may apply to you. Ask OHP about it." plus the phone number. Never "you are exempt".
- The LLM is not called during screening in the MVP.

### Consequences

- Good: auditable, testable with table-driven tests, easy to add a state.
- Bad: rules need manual updates when the state changes them. The `retrieved` date makes staleness visible.
