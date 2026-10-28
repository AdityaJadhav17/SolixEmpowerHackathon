import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { findForbiddenClaims } from "../src/lib/guardrails";
import {
  MODEL_ID,
  readLetter,
  type LetterImage,
} from "../src/lib/letter-reader";
import { PROMPT_VERSION } from "../src/prompts/letter-reader";
import {
  deadlineMatches,
  deadlineSplit,
  documentScores,
  textMatches,
} from "./score";

type Label = {
  id: string;
  file: string;
  split: "dev" | "test";
  notice_type: string;
  deadline: string | null;
  required_action: string | null;
  documents: string[];
};

const MEDIA_TYPES: Record<string, LetterImage["mediaType"]> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

const splitArg = process.argv.indexOf("--split");
const split = splitArg > -1 ? process.argv[splitArg + 1] : undefined;

const labels: Label[] = JSON.parse(await readFile("eval/labels.json", "utf8"));
const selected = labels.filter((l) => !split || l.split === split);
if (selected.length === 0) {
  console.error(
    `No labeled letters for split "${split ?? "all"}". Add entries to eval/labels.json.`,
  );
  process.exit(1);
}

const rows = [];
for (const label of selected) {
  const ext = path.extname(label.file).toLowerCase();
  const mediaType = MEDIA_TYPES[ext];
  if (!mediaType)
    throw new Error(
      `${label.id}: unsupported file type ${ext}; convert PDF pages to PNG`,
    );
  const base64 = (
    await readFile(path.join("eval/letters", label.file))
  ).toString("base64");
  try {
    const out = await readLetter({ mediaType, base64 });
    const docs = documentScores(label.documents, out.documents);
    rows.push({
      id: label.id,
      split: label.split,
      notice_type: label.notice_type === out.notice_type,
      deadline: deadlineMatches(label.deadline, out.deadline),
      required_action: textMatches(label.required_action, out.required_action),
      doc_recall: docs.recall,
      doc_precision: docs.precision,
      guardrail_hits: findForbiddenClaims(
        `${out.summary} ${out.required_action ?? ""}`,
      ).length,
      expected_deadline: label.deadline,
      actual_deadline: out.deadline,
      error: null as string | null,
    });
  } catch (err) {
    rows.push({ id: label.id, split: label.split, error: String(err) });
  }
}

const ok = rows.filter((r) => !r.error) as Extract<
  (typeof rows)[number],
  { deadline: boolean }
>[];
const count = (key: "notice_type" | "deadline" | "required_action") =>
  ok.filter((r) => r[key]).length;
const mean = (key: "doc_recall" | "doc_precision") =>
  ok.length ? ok.reduce((s, r) => s + r[key], 0) / ok.length : 0;

const dl = deadlineSplit(
  ok.map((r) => ({ expected: r.expected_deadline, correct: r.deadline })),
);

const summary = {
  run_at: new Date().toISOString(),
  model: MODEL_ID,
  prompt_version: PROMPT_VERSION,
  split: split ?? "all",
  letters: rows.length,
  errors: rows.length - ok.length,
  deadline_correct: count("deadline"),
  deadline_printed: dl.printed,
  deadline_none: dl.none,
  notice_type_correct: count("notice_type"),
  required_action_correct: count("required_action"),
  doc_recall_mean: mean("doc_recall"),
  doc_precision_mean: mean("doc_precision"),
  guardrail_hits: ok.reduce((s, r) => s + r.guardrail_hits, 0),
};

const md = [
  `# Eval results (${summary.split})`,
  "",
  `Model \`${summary.model}\`, prompt v${summary.prompt_version}, run ${summary.run_at}`,
  "",
  "| Metric | Result |",
  "| --- | --- |",
  `| Printed deadline read correctly | ${dl.printed.correct} of ${dl.printed.total} |`,
  `| No deadline correctly reported as none | ${dl.none.correct} of ${dl.none.total} |`,
  `| Notice type correct | ${summary.notice_type_correct} of ${rows.length} |`,
  `| Required action correct | ${summary.required_action_correct} of ${rows.length} |`,
  `| Document recall (mean) | ${summary.doc_recall_mean.toFixed(2)} |`,
  `| Document precision (mean) | ${summary.doc_precision_mean.toFixed(2)} |`,
  `| Guardrail hits | ${summary.guardrail_hits} |`,
  `| Errors | ${summary.errors} |`,
  "",
  "## Per letter",
  "",
  ...rows.map((r) =>
    r.error
      ? `- ${r.id}: ERROR ${r.error}`
      : `- ${r.id}: deadline ${r.deadline ? "ok" : `FAIL (expected ${r.expected_deadline}, got ${r.actual_deadline})`}`,
  ),
].join("\n");

await mkdir("eval/results", { recursive: true });
await writeFile(
  `eval/results/${summary.run_at.replace(/[:.]/g, "-")}.json`,
  JSON.stringify({ summary, rows }, null, 2),
);
await writeFile("eval/results/latest.md", md + "\n");
console.log(md);
if (summary.errors > 0 || summary.guardrail_hits > 0) process.exit(1);
