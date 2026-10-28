# ADR-0009: Dependency policy

- Status: Accepted
- Date: 2026-10-28

## Decision outcome

- Add a dependency only if it saves real work and is widely used and maintained. Prefer the platform and existing dependencies.
- Exact versions in `package.json`; `package-lock.json` committed; CI installs with `npm ci` only.
- CI fails on high or critical advisories (`npm audit`, osv-scanner) and on production-dependency licenses outside the allowlist in the `check:licenses` script: MIT, ISC, Apache-2.0, BSD-2-Clause, BSD-3-Clause, 0BSD, BlueOak-1.0.0, CC0-1.0, Unlicense, Python-2.0, plus two that Next.js brings in: CC-BY-4.0 (`caniuse-lite`, browser-support data) and LGPL-3.0-or-later (the `sharp` image library's prebuilt binary, dynamically linked). Adding a license to the list needs a note here.
- Dependabot opens weekly grouped PRs for npm and GitHub Actions.
- GitHub Actions are pinned to full commit SHAs, with the tag in a comment.
