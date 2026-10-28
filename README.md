# Coverage Keeper

**Author:** Woosik Kim
**Author:** Aditya Jadhav
**Author:** Waleed Alghaithi

Solix Empower Hackathon, AI in Healthcare track.

Photograph a Medicaid letter. Coverage Keeper explains what it asks for, the deadline, and the exact documents to send, then checks which Oregon work-requirement exemptions may apply. It never decides eligibility; it tells you who to call.

**Start here: [HANDOFF.md](HANDOFF.md)** (current status, next actions, how to run everything).

## Structure

```
src/       Next.js app (UI, API routes, letter reader, guardrails, prompts)
data/      Per-state rules (data/rules/or.json), each with its source
eval/      Labeled public sample notices + scoring script
tests/     Integration, safety and E2E tests (unit tests sit next to the code)
docs/      Personas, stories, MVP, eval plan, safety, testing, CI, ADRs
.github/   CI, eval and security workflows; templates
```

## Getting started

```bash
git clone https://github.com/AdityaJadhav17/SolixEmpowerHackathon.git
cd SolixEmpowerHackathon
npm ci
npm run dev
```

Requires Node 22. Set `ANTHROPIC_API_KEY` in `.env.local` to read real letters.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and our [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability.

## License

[MIT](LICENSE)
