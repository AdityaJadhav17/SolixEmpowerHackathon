# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.0 - 2026-10-28

First release, built for the Solix Empower Hackathon (AI in Healthcare track).

### Added

- Letter reader and `POST /api/read`: a vision model (`claude-opus-5-5`) fills a fixed zod schema, with an "unsure" fallback on refusal or invalid output, one retry on 429/5xx, a 30 s timeout and a `LETTER_READER=fixture` offline mode ([#2](https://github.com/AdityaJadhav17/coverage-keeper/pull/2)).
- Mobile flow: consent, capture, result (summary, deadline with days left and quoted source line, document checklist, who to call) and Oregon exemption screening, plus offline, error, low-confidence and not-OHP screens ([#3](https://github.com/AdityaJadhav17/coverage-keeper/pull/3)).
- Eval set of 10 public `.gov` sample notices with labels and a fixed dev/test split ([#4](https://github.com/AdityaJadhav17/coverage-keeper/pull/4)), and 3 phone photos in the test split ([#7](https://github.com/AdityaJadhav17/coverage-keeper/pull/7)).
- Template-based "Draft a note to my doctor" after screening, with Copy and Share; nothing sent or stored ([#6](https://github.com/AdityaJadhav17/coverage-keeper/pull/6)).
- Mobile UI polish: deadline card as the main element, status shown with icon and text, dark mode, reduced-motion and reduced-transparency support ([#8](https://github.com/AdityaJadhav17/coverage-keeper/pull/8)).
- Plain OHP-specific copy, SEO metadata, Open Graph image, `robots.txt`, `sitemap.xml` and icon ([#11](https://github.com/AdityaJadhav17/coverage-keeper/pull/11)).
- Root and per-directory READMEs, `.env.example`, this changelog.

### Changed

- Prompt v2: a missing or placeholder deadline no longer forces low confidence ([#13](https://github.com/AdityaJadhav17/coverage-keeper/pull/13)).
- The screening intro says the questions use Oregon (OHP) rules ([#12](https://github.com/AdityaJadhav17/coverage-keeper/pull/12)).
- ADR-0001 to ADR-0009 marked Accepted.

### Security

- `POST /api/read` rate limit of 10 reads per minute per IP and a request size cap before buffering ([#9](https://github.com/AdityaJadhav17/coverage-keeper/pull/9)).

### Removed

- Internal working notes and outdated "before" screenshots.
