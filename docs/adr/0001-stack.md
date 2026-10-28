# ADR-0001: Application stack

- Status: Accepted
- Date: 2026-10-28

## Context and problem statement

We have about 4.5 hours, three engineers, and need a demo that works on a cheap Android phone in poor lighting with limited data, plus a public deploy for Devpost. The LLM API key must never reach the browser.

## Decision drivers

- Camera access on mobile with zero install
- A server-side place to hold the API key
- One language across UI, API, eval and tests
- Free, one-command hosting with preview URLs

## Considered options

1. **Next.js (App Router) + TypeScript, mobile-first web app, deployed on Vercel**
2. React Native / Expo native app
3. Python (FastAPI) backend + separate React frontend

## Decision outcome

Chosen option: **1**. `<input type="file" accept="image/*" capture="environment">` opens the phone camera with no install. Route handlers keep the key server-side. One TypeScript codebase covers UI, API, eval script and tests. Vercel deploys from `main` for free.

Tooling: Node 22 LTS, npm (lockfile committed), Next.js 16, React 19, zod, Vitest, Playwright, ESLint, Prettier.

### Consequences

- Good: fastest path to a demo URL; judges can open it on their own phone.
- Bad: no offline OCR and no push reminders (non-goals for the MVP).
- Bad: Vercel's function request body limit (about 4.5 MB) caps upload size, so images are downscaled in the browser before upload.

## Links

- [ADR-0008 CI/CD and hosting](0008-ci-cd-hosting.md)
