# scripts

Repository checks that run outside the app and the test runner.

## Contents

| File                | Purpose                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `check-hygiene.mjs` | Fails when local tool config files are tracked or eval data looks unsafe |

## What check-hygiene.mjs checks

It lists tracked files with `git ls-files`, then reports an error for each of these:

1. A tracked path matching a pattern in `FORBIDDEN`: local tool config files and folders that belong on a developer's machine, not in the repo.
2. An entry in `../eval/labels.json` whose `source_url` is not an `https://` URL on a `.gov` host.
3. A tracked file in `../eval/letters/` that has no entry in `../eval/labels.json`.
4. A tracked `.json`, `.md`, `.txt` or `.csv` file under `eval/` that matches a Social Security number pattern, an email address that is not on a `.gov` domain, or a `DOB:` / `date of birth:` label.

On success it prints `hygiene ok` with the number of files checked. On failure it prints each problem and exits with code 1.

## Run

```bash
npm run check:hygiene
```

The script reads tracked files, so run it from the repository root inside the git checkout. A new file only counts once it is added to git.

## Adding a check

Add a pattern to `FORBIDDEN` (path rules) or `PII` (content rules) in `check-hygiene.mjs`, or push a message onto `errors` for a new rule. Keep the script free of dependencies: it imports only Node built-ins.

See [../eval/README.md](../eval/README.md) for the eval data rules and [../docs/ci.md](../docs/ci.md) for where checks run.
