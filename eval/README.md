# eval

Scores the letter reader against labeled public sample notices and writes a results file.

## Contents

| Path                 | Description                                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `letters/`           | Sample notice images (PNG and JPG) from Oregon and Vermont government sites                    |
| `labels.json`        | One entry per image: expected fields, split, source and retrieval date                         |
| `labels.schema.json` | JSON Schema for `labels.json` (all fields required, no extra fields)                           |
| `run.ts`             | Reads each letter with `readLetter`, compares to the label, writes results                     |
| `score.ts`           | Scoring helpers: `tokens`, `textMatches`, `deadlineMatches`, `documentScores`, `deadlineSplit` |
| `score.test.ts`      | Unit tests for the scoring helpers                                                             |
| `results/`           | Output of each run, git-ignored                                                                |

## Labels and splits

Each label has `id`, `file` (relative to `letters/`), `split` (`dev` or `test`), `notice_type`, `deadline` (ISO date or null), `required_action`, `documents`, `source_url`, `retrieved` and `usage_note`. Use `dev` while changing the prompt and `test` for the final check.

## Run

```bash
npm run eval -- --split dev
npm run eval -- --split test
npm run eval              # all letters
```

This calls the real model (`claude-opus-5-5`), needs `ANTHROPIC_API_KEY` set, and costs money. It is not part of CI. Each run writes a timestamped JSON file and `latest.md` to `results/`, with the model id and prompt version recorded.

## Data rule

Every file in `letters/` must be a public .gov sample notice listed in `labels.json` with a .gov `source_url`. No real person's letter goes in this folder. `../scripts/check-hygiene.mjs` (`npm run check:hygiene`) fails on unlisted files, non-.gov sources, and personal-data patterns in `eval/` text files.

## Adding a letter

1. Save the public sample as PNG or JPG in `letters/`.
2. Add an entry to `labels.json` that matches `labels.schema.json`.
3. Run `npm run check:hygiene` and `npm test`.

## Results

Scores are not kept in this file. See the Evaluation section of the root README ([../README.md#evaluation](../README.md#evaluation)) and the method in [../docs/eval.md](../docs/eval.md).
