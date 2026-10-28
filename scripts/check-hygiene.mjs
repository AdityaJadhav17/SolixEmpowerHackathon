// Fails if tool config files are tracked, or if eval data could be a real person's letter.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const FORBIDDEN = [
  /(^|\/)CLAUDE\.md$/,
  /(^|\/)AGENTS\.md$/,
  /(^|\/)GEMINI\.md$/,
  /(^|\/)SKILL\.md$/,
  /(^|\/)\.claude\//,
  /(^|\/)\.cursor\//,
  /(^|\/)\.cursorrules$/,
  /(^|\/)\.windsurf\//,
  /(^|\/)\.aider/,
  /(^|\/)\.mcp\.json$/,
  /(^|\/)\.copilot\//,
  /(^|\/)skills\//,
];

const PII = [
  { name: "SSN", re: /\b\d{3}-\d{2}-\d{4}\b/ },
  {
    name: "non-.gov email",
    re: /\b[\w.+-]+@(?![\w.-]*\.gov\b)[\w-]+\.[\w.-]+\b/i,
  },
  { name: "date of birth label", re: /\b(DOB|date of birth)\s*[:#]/i },
];

const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const errors = [];

for (const f of files) {
  if (FORBIDDEN.some((re) => re.test(f)))
    errors.push(`forbidden path tracked: ${f}`);
}

const labels = JSON.parse(readFileSync("eval/labels.json", "utf8"));
const labeled = new Map(labels.map((l) => [`eval/letters/${l.file}`, l]));
for (const l of labels) {
  if (!/^https:\/\/([a-z0-9-]+\.)*[a-z0-9-]+\.gov\//.test(l.source_url ?? "")) {
    errors.push(`eval label ${l.id}: source_url must be a public .gov page`);
  }
}
for (const f of files.filter((f) => f.startsWith("eval/letters/"))) {
  if (!labeled.has(f))
    errors.push(`eval file not listed in eval/labels.json: ${f}`);
}
for (const f of files.filter(
  (f) => f.startsWith("eval/") && /\.(json|md|txt|csv)$/.test(f),
)) {
  const text = readFileSync(f, "utf8");
  for (const { name, re } of PII)
    if (re.test(text)) errors.push(`possible ${name} in ${f}`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`hygiene ok (${files.length} tracked files checked)`);
