# data

State rule data that the app reads at build time: currently one file for Oregon.

## Contents

| File            | Description                                     |
| --------------- | ----------------------------------------------- |
| `rules/or.json` | Oregon Health Plan (OHP) work-requirement rules |

## Fields in rules/or.json

| Field                         | Meaning                                                                 |
| ----------------------------- | ----------------------------------------------------------------------- |
| `state`, `program`            | `OR`, `Oregon Health Plan (OHP)`                                        |
| `source_url`                  | Official oregon.gov page the rules come from                            |
| `source_updated`, `retrieved` | Date the source page was updated, date the team copied it (YYYY-MM-DD)  |
| `contact`                     | `name` and `phone` of OHP Customer Service, shown as the number to call |
| `applies_to`                  | Plain-language statement of who the rule covers                         |
| `ways_to_meet`                | Entries with `id` and `text`: income, school, hours                     |
| `exemptions`                  | Entries with `id` and a yes/no `question`; 14 in the current file       |

## How it is used

- `../src/app/page.tsx` imports `or.json` directly for the contact phone, the screening questions and the ways to meet the rule.
- `../src/lib/screening.ts` (`mayApply`) returns the exemptions whose `id` was answered true. It does not decide eligibility.
- `../src/lib/doctor-draft.ts` imports the file as well.

## Changing the Oregon rules

1. Edit `rules/or.json` from the official source and update `source_url`, `source_updated` and `retrieved`.
2. Keep every exemption `id` unique and every `question` ending in `?`.
3. Run `npm run test:integration` (checks in `../tests/integration/rules-data.test.ts`: `source_url` starts with `https://www.oregon.gov/`, `retrieved` is a date, ids are unique, questions end in `?`) and `npm test` (`../src/lib/screening.test.ts` runs one case per exemption id).

## Adding a state

The UI is Oregon only: it imports `or.json` by path and the letter prompt and safe fallback text name OHP. A new `rules/<state>.json` with the same fields would pass the data checks in `rules-data.test.ts`, but that test file also imports `or.json` by name, so it needs a case for the new file. Wiring a second state into the page, prompt and fallback text is not done.

Related: [../docs/adr/0006-exemption-screening.md](../docs/adr/0006-exemption-screening.md).
