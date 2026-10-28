# Evaluation plan

This backs the stage claim ("deadline correct on N of M real letters"). Report what the script prints, including failures.

## Dataset

- Location: `eval/letters/` (PNG, JPEG or WebP; convert PDF pages to PNG first) and `eval/labels.json` (one entry per letter).
- Source: **only public sample notices published by a state agency** (`.gov` domains), for example Oregon Health Authority notice guides and sample notices, or the Vermont DVHA notice page. Never a real person's letter, even with permission.
- Each label entry (schema in `eval/labels.schema.json`):
  - `id`, `file`, `split` (`dev` or `test`)
  - `notice_type`, `deadline` (ISO date or `null`), `required_action`, `documents` (list)
  - `source_url`, `retrieved` (date), `usage_note` (e.g. "Public government sample notice, used for evaluation")
- Size: 10-15 letters. At least 3 must be phone photos of a printed sample (taken by the team) so the score reflects real use.
- Sample notices often show placeholder dates such as `MM/DD/YYYY`. Label those as `deadline: null` and expect the reader to say "unsure".

CI rejects any file in `eval/` that is not listed in `labels.json` with a `.gov` source, and any file matching personal-data patterns (see [ci.md](ci.md)).

## Splits

- `dev`: about one third. Use these freely while writing the prompt.
- `test`: the rest. **Never look at failures on the test split to tune the prompt.** The stage number comes from `test` only.
- If the prompt changes after a test run, record it in `eval/results/` and say so.

## Metrics (per field)

| Field             | Metric                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deadline`        | Exact match on ISO date. `null` label matches only `null` output.                                                                                                           |
| `notice_type`     | Exact match on enum.                                                                                                                                                        |
| `required_action` | Match if normalized label tokens (lowercase, stopwords removed) are a subset of the output's tokens. Reported separately from deadline so the stricter metric isn't hidden. |
| `documents`       | Set precision and recall after normalization. Headline: recall.                                                                                                             |
| Guardrail         | Count of outputs with a forbidden phrase. Must be 0.                                                                                                                        |

## Running it

```bash
npm run eval                 # all splits, real model, needs ANTHROPIC_API_KEY
npm run eval -- --split test # stage number
```

- Model and prompt are pinned: the script records `MODEL_ID` from `src/lib/letter-reader.ts` and `PROMPT_VERSION` from `src/prompts/letter-reader.ts` in every result.
- Output: `eval/results/<timestamp>.json` and `eval/results/latest.md` (score table + per-letter pass/fail). `eval/results/` is git-ignored; CI uploads it as an artifact.
- Scoring code (`eval/score.ts`) is unit-tested and runs without the model.

## Reporting rules

- Always show N of M, not only a percentage.
- List every failed letter with the expected and actual value.
- State which split and which model/prompt version produced the number.
