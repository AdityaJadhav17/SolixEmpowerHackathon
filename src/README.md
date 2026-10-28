# src

Application code: the Next.js pages and API routes, the logic they share, and the model prompt.

## Contents

| Path                                                 | What it is                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `app/page.tsx`                                       | The single client page: consent, capture, reading, result, screening                             |
| `app/layout.tsx`                                     | Root layout, font, site metadata                                                                 |
| `app/globals.css`, `app/icon.svg`                    | Styles and icon                                                                                  |
| `app/opengraph-image.tsx`, `robots.ts`, `sitemap.ts` | Share image, robots rules (disallows `/api/`), sitemap                                           |
| `app/api/read/route.ts`                              | `POST` a photo, get the extraction back (JPEG/PNG/WebP, max 4 MB, 10 requests per minute per IP) |
| `app/api/health/route.ts`                            | `GET` returns `{ "status": "ok" }`                                                               |
| `prompts/letter-reader.ts`                           | System prompt and `PROMPT_VERSION`                                                               |
| `prompts/letter-reader.test.ts`, `__snapshots__/`    | Snapshot of the prompt                                                                           |

## lib

| Module             | Purpose                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| `schema.ts`        | Zod contract for the extraction (notice type, summary, deadline, documents, confidence) |
| `letter-reader.ts` | Calls the vision model (`claude-opus-5-5`) and returns a validated extraction           |
| `guardrails.ts`    | Detects phrases that state or deny eligibility and swaps in a safe fallback             |
| `screening.ts`     | `mayApply`: returns the exemptions the user answered "yes" to                           |
| `deadline.ts`      | Day counts and deadline status in the America/Los_Angeles time zone                     |
| `doctor-draft.ts`  | Template text for asking a doctor for a letter, no model call                           |
| `image.ts`         | File checks, resize limits, JPEG conversion before upload                               |
| `phone.ts`         | Turns a phone number into a `tel:` link, falls back to OHP Customer Service             |
| `rate-limit.ts`    | Fixed-window counter used by the read route                                             |
| `site.ts`          | Site URL, title and description                                                         |

Each module has a `*.test.ts` file beside it.

## Notes

- The model only reads the letter. Screening is rule matching against `../data/rules/or.json`, and `guardrails.ts` runs on every user-facing string from the read route.
- `PROMPT_VERSION` must be bumped when the prompt text changes. The snapshot test fails until it is, and the eval records the version with each run.
- Set `LETTER_READER=fixture` to make `readLetter` return `../tests/fixtures/reader/synthetic-work-requirement.json` with no API call. Playwright starts the server this way.
- A real read needs `ANTHROPIC_API_KEY`.

## Commands

```bash
npm run dev        # dev server
npm run typecheck
npm test           # unit tests (src/**/*.test.ts, eval/**/*.test.ts) with coverage
```

See [../tests/README.md](../tests/README.md), [../data/README.md](../data/README.md) and [../docs/adr/README.md](../docs/adr/README.md).
