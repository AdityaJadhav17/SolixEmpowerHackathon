# MVP: Coverage Keeper

Deadline: **2026-10-28 18:00 PDT** (Devpost submission: repo + README + video or slides + working prototype).

## Problem

During the 2023-2024 Medicaid "unwinding", most people who lost coverage were dropped for procedural (paperwork) reasons, not because they were found ineligible: 69% of disenrollments as of April 2024, and 66% in the final month, per KFF ([tracker](https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/), [renewal outcomes](https://www.kff.org/policy-watch/how-did-medicaid-renewal-outcomes-change-during-the-unwinding/)).

The 2025 federal budget law adds a work requirement (80 hours a month of work, volunteering or school, with exemptions) for Medicaid expansion adults; most states must start by 2027-01-01 ([KFF Health News, 2026-06-12](https://kffhealthnews.org/medicaid/medicaid-work-requirements-final-rules-exemptions-trump-cms/)). Oregon starts in 2027 and began sending notices in September 2026 ([OHA, updated 2026-09-18](https://www.oregon.gov/oha/hsd/ohp/pages/federal-changes.aspx)). More letters, more paperwork, more chances to lose coverage by missing one.

## Target user

Primary: [P1 Marisol](personas.md), an Oregon Health Plan member on a low-cost Android phone who received a letter she doesn't fully understand.

## MVP scope (in)

1. Consent screen, then photograph or upload one page of a letter.
2. Server reads it with a vision LLM into a fixed schema: notice type, plain summary, deadline (+ quoted source), required action, documents, contact phone, confidence.
3. Result screen: summary, deadline with days left, document checklist, who to call. Unsure fields say so.
4. Oregon exemption questions (rules from `data/rules/or.json`) listing rules that **may** apply, with sources.
5. Guardrail filter on all output; no storage.
6. Eval script scoring the reader on 10-15 labeled public Oregon notices, shown on stage.

## Non-goals

- No eligibility determinations, ever.
- No filing, submitting or contacting the state on the user's behalf.
- No storing letters, accounts, or history.
- No states other than Oregon; no multi-page stitching; no native app.
- No doctor-statement draft in the MVP (stretch: US-040).

## Success metrics

| Metric                           | Target                   | How measured                                              |
| -------------------------------- | ------------------------ | --------------------------------------------------------- |
| Deadline exact-match accuracy    | >= 80% on the test split | `npm run eval`                                            |
| Required-action accuracy         | >= 80%                   | `npm run eval` (normalized match, see [eval.md](eval.md)) |
| Document-list recall             | >= 80%                   | `npm run eval`                                            |
| Forbidden-phrase hits            | 0                        | `npm run test:safety` + eval guardrail check              |
| End-to-end time, photo to result | < 15 s on 4G             | manual check on a phone                                   |

## Riskiest assumptions and tests

| Assumption                                                          | Test                                                                                 | By    |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ----- |
| Enough public Oregon sample notices exist to label 10-15            | Collect from OHA notice pages; if short, add Vermont/other public samples and say so | 15:00 |
| Vision model reads deadlines from phone photos, not just clean PDFs | Eval includes at least 3 photos of printed samples taken on a phone                  | 16:00 |
| Users trust a "may apply" answer without an eligibility verdict     | Demo script shows the call-to-action; ask 2 people outside the team                  | 17:00 |
| Model holds the guardrail under injected letter text                | Adversarial fixtures in `test:safety`; injected sample in eval                       | 16:00 |

## Demo script (2 minutes)

1. (15 s) Problem: two-thirds of people who lost Medicaid lost it over paperwork; work-requirement letters are arriving now.
2. (45 s) Live: open the deployed URL on a phone, photograph a printed Oregon sample notice, show summary, deadline + days left + quoted line, checklist, phone number.
3. (30 s) Tap "Check exemptions", answer "caring for a child under 14: yes", show "may apply" + proof examples + source.
4. (20 s) Accuracy slide: score table from `eval/results/latest.md`, including failures.
5. (10 s) Safety: it never says "you're eligible"; nothing is stored.

Fallback: if the API is down, run with `LETTER_READER=fixture` and say so.

## Milestones (2026-10-28, PDT)

| Time  | Milestone                                                        | Owner         |
| ----- | ---------------------------------------------------------------- | ------------- |
| 14:00 | Docs + CI + skeleton merged; ADRs approved                       | Eng A         |
| 15:00 | Reader API returns schema JSON for 1 sample; 10+ notices labeled | Eng A / Eng C |
| 15:45 | Mobile UI flow end to end (US-001 to US-023)                     | Eng B         |
| 16:15 | Exemption screening (US-030, US-031); eval run #1 on test split  | Eng B / Eng C |
| 16:45 | Deployed on Vercel; guardrail + E2E green                        | Eng A         |
| 17:30 | Video recorded, README final, Devpost draft                      | Eng C         |
| 17:45 | Submit (15 min buffer)                                           | All           |

## Traceability

| Story                                          | MVP | Feature area | Verified by                                       |
| ---------------------------------------------- | --- | ------------ | ------------------------------------------------- |
| US-001                                         | yes | Capture      | E2E `capture.spec.ts`                             |
| US-003                                         | yes | Capture      | unit (low-confidence path), E2E fixture           |
| US-005                                         | yes | Capture      | unit (file validation)                            |
| US-010                                         | yes | Explanation  | eval (summary present), unit (schema)             |
| US-012                                         | yes | Explanation  | eval (non-Medicaid sample), unit                  |
| US-013                                         | yes | Explanation  | unit (schema failure -> unsure)                   |
| US-020                                         | yes | Deadline     | eval (deadline exact match), property tests       |
| US-021                                         | yes | Deadline     | unit (ambiguous date)                             |
| US-022                                         | yes | Deadline     | unit (past date with injected clock)              |
| US-023                                         | yes | Documents    | eval (document recall)                            |
| US-030                                         | yes | Screening    | table-driven unit tests over `data/rules/or.json` |
| US-031                                         | yes | Screening    | unit                                              |
| US-050                                         | yes | Safety       | `test:safety`                                     |
| US-051                                         | yes | Safety       | integration (no writes, log redaction)            |
| US-052                                         | yes | Safety       | `test:safety` adversarial fixtures                |
| US-053                                         | yes | Safety       | E2E offline mode                                  |
| US-054                                         | yes | Safety       | unit + E2E                                        |
| US-055                                         | yes | Safety       | E2E                                               |
| US-004, US-011, US-024, US-032, US-040, US-041 | no  | Stretch      | —                                                 |
