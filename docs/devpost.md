# Devpost submission

Paste each section into the matching Devpost field. Fill every `[TODO]` before submitting. Only claim what the deployed app does at submit time; cut any line that describes an unfinished feature.

## Project name

Coverage Keeper

## Tagline (200 chars max)

Photograph your Medicaid letter. Coverage Keeper tells you what it asks for, the deadline, which documents to send, and who to call.

## Inspiration

States dropped millions of people from Medicaid in 2023 and 2024. KFF found that 69% of those disenrollments, as of April 2024, came from paperwork: a missed form, a late reply, a letter nobody opened in time. The state never checked whether those people still qualified.

A new federal rule raises the stakes. Starting in 2027, most expansion adults must log 80 hours a month of work, school, volunteering or caregiving, or prove an exemption. Oregon began mailing notices in September 2026. That means more letters, more forms, and more ways to lose coverage over a date you didn't see.

We pictured Marisol, a delivery driver on a prepaid Android phone. She finds an Oregon Health Plan letter two weeks after it arrived. It runs long and uses program codes. She can't afford to sit on hold during a shift. We built Coverage Keeper for her.

## What it does

1. You read a short consent screen. It tells you an AI service reads your photo, we save nothing, and the app can't decide whether you qualify.
2. You photograph or upload one page of the letter.
3. You get back a plain-language summary, the deadline with days left, the exact line from the letter where we found that date, a checklist of documents to send, and the OHP phone number.
4. You tap "Check exemptions" and answer yes/no questions drawn from Oregon's published rules (caring for a child under 14, a serious health condition, pregnancy, and more). The app lists the exemptions that **may** apply, the proof Oregon asks for, and a link to the source page.

When the model can't read a field, the app says "unsure" and points you to the phone number. It never tells you that you are or aren't eligible.

## How we built it

- **App:** Next.js 16 and TypeScript, deployed on Vercel. The browser shrinks photos before upload so they fit on a slow 4G connection.
- **Letter reading:** Claude (`claude-opus-5-5`) reads the image and returns JSON that has to match a fixed zod schema: notice type, summary, deadline with the quoted source line, required action, documents, phone number, and a confidence score. Our code computes days left; the model doesn't do date math.
- **Rules as data:** Oregon's exemptions live in `data/rules/or.json`, each with its source URL and retrieval date. The UI shows both, so you can tell how fresh the rules are.
- **Guardrails:** The schema has no eligibility field. A filter scans every output string for verdict language ("you qualify", "you're not eligible"). The system prompt treats letter text as data, and we test it against letters with injected instructions. If the safety suite fails, the build fails.
- **Privacy:** We store no images, letter text or answers. Logs hold a request ID, latency, model ID and status code, and nothing from the letter. We run no analytics.
- **Evaluation:** We labeled [TODO: N] public sample notices from Oregon Health Authority, including [TODO: N] phone photos of printed copies, split into dev and test sets. A scoring script measures deadline exact match, required action, and document recall. We tuned the prompt on dev only.
- **CI:** GitHub Actions runs lint, typecheck, unit, integration, safety, E2E on iPhone Safari and Android Chrome with axe accessibility checks, a license scan and a secret scan. Deploy runs only after every gate passes.

## Challenges we ran into

- **Placeholder dates.** Public sample notices print `MM/DD/YYYY` where a real date would go. We label those as "no deadline" and score the reader on saying "unsure" instead of inventing a date.
- **Photos vs. PDFs.** Clean PDFs score well. A crooked photo under kitchen light scores lower. We photographed printed samples on our own phones so the eval reflects how people use it, and we report both numbers.
- **Helpful without deciding.** People want a yes or no on eligibility. Only the state can give one. We spent time on wording that gives you a next step ("this may apply; here's the proof they ask for; call this number") without a verdict.
- **Real letters are off limits.** We used only public `.gov` sample notices, never a real person's mail, even with permission. CI rejects any eval file without a `.gov` source.

## Accomplishments that we're proud of

- On the held-out test set, the reader got the deadline right on [TODO: X of Y] letters, the required action on [TODO: X of Y], and found [TODO: Z%] of the listed documents. We publish the failures with the score.
- Zero eligibility verdicts across the safety suite and the eval run.
- The app runs end to end on a phone in about [TODO: N] seconds from photo to result.

## What we learned

- Quote the source. Showing the exact line where the model found the deadline lets you check it against the paper in seconds. [TODO: add a real example if it caught a misread during testing, or cut this clause.]
- Keep rules out of the prompt. With Oregon's exemptions in a data file, you can update them in one place when the state changes them, and each one carries its source.
- Score on the test split and show N of M. A percentage on five letters hides more than it tells.

## What's next for Coverage Keeper

- Spanish output and UI. Oregon already publishes Spanish sample notices, and Marisol prefers Spanish for official mail.
- Multi-page letters.
- A draft doctor's statement for people claiming a health exemption, written to match what Oregon asks for.
- More states. Each one needs its own rules file and its own labeled eval set.
- A pilot with an Oregon community health worker program before any real-user launch, after we confirm the AI provider's data terms.

## Built with

nextjs, react, typescript, zod, claude, anthropic, vercel, playwright, vitest, github-actions

## Links

- Demo: [TODO: Vercel URL]
- Video: [TODO: YouTube/Vimeo URL]
- Repo: https://github.com/AdityaJadhav17/SolixEmpowerHackathon

## Facts to re-check before submitting

- KFF 69% figure: [tracker](https://www.kff.org/medicaid/issue-brief/medicaid-enrollment-and-unwinding-tracker/). Don't quote "71%"; we found no primary source for it.
- 2027 start and Oregon's September 2026 notices: [OHA](https://www.oregon.gov/oha/hsd/ohp/pages/federal-changes.aspx).
- "Our code computes days left" and "build fails on safety suite": true in the repo today. Re-check the rest against the deployed app.
