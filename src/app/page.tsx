"use client";

import { useRef, useState } from "react";
import rules from "../../data/rules/or.json";
import { deadlineStatus } from "@/lib/deadline";
import { buildDoctorDraft } from "@/lib/doctor-draft";
import { enforceGuardrail } from "@/lib/guardrails";
import { rejectReason, toUploadJpeg } from "@/lib/image";
import { FALLBACK_TEL, phoneHref } from "@/lib/phone";
import { LetterExtraction } from "@/lib/schema";
import { mayApply } from "@/lib/screening";

type View =
  | { name: "consent" }
  | { name: "capture"; error?: string }
  | { name: "reading" }
  | { name: "offline" }
  | { name: "error"; message: string }
  | { name: "unclear" }
  | { name: "result"; data: LetterExtraction }
  | { name: "screening"; data: LetterExtraction | null }
  | { name: "screened"; data: LetterExtraction | null; yes: string[] };

const OHP_PHONE = rules.contact.phone;
const NOT_SURE = "Not sure. Check the letter or call.";
const safe = (text: string) => enforceGuardrail(text).text;

const NOTICE_LABELS: Record<LetterExtraction["notice_type"], string> = {
  work_requirement_info: "Work rules information",
  work_requirement_verification: "Proof of work or activities",
  renewal: "Renewal",
  request_for_information: "Request for information",
  coverage_ending: "Coverage ending",
  approval_or_change: "Approval or change",
  other_medicaid: "OHP / Medicaid letter",
  not_medicaid: "Not an OHP letter",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function letterPhone(data: LetterExtraction | null) {
  const phone = data?.contact_phone ? safe(data.contact_phone) : "";
  return phoneHref(phone) !== FALLBACK_TEL ? phone : OHP_PHONE;
}

export default function Home() {
  const [view, setView] = useState<View>({ name: "consent" });
  const [photo, setPhoto] = useState<Blob | null>(null);
  const busy = useRef(false);

  async function send(jpeg: Blob) {
    if (busy.current) return;
    busy.current = true;
    if (!navigator.onLine) {
      setView({ name: "offline" });
      busy.current = false;
      return;
    }
    setView({ name: "reading" });
    try {
      const body = new FormData();
      body.append("image", jpeg, "letter.jpg");
      const res = await fetch("/api/read", { method: "POST", body });
      if (!res.ok) {
        setView({
          name: "error",
          message:
            res.status === 413
              ? "That photo is too big to send. Take a new one from a little farther back."
              : "The reading service didn't answer. Your photo is still here, so you can try again.",
        });
        return;
      }
      const parsed = LetterExtraction.safeParse(
        await res.json().catch(() => null),
      );
      // Malformed reader output is treated as unsure (US-013).
      setView(
        parsed.success
          ? { name: "result", data: parsed.data }
          : { name: "unclear" },
      );
    } catch {
      setView({ name: "offline" });
    } finally {
      busy.current = false;
    }
  }

  async function onPick(file: File | undefined) {
    if (!file || busy.current) return;
    const reason = rejectReason(file);
    if (reason) return setView({ name: "capture", error: reason });
    try {
      const jpeg = await toUploadJpeg(file);
      setPhoto(jpeg);
      await send(jpeg);
    } catch {
      setView({
        name: "capture",
        error: "This phone couldn't open that photo. Take a new one.",
      });
    }
  }

  const data =
    view.name === "result" ||
    view.name === "screening" ||
    view.name === "screened"
      ? view.data
      : null;
  const phone = letterPhone(data);
  const retake = () => setView({ name: "capture" });

  return (
    <>
      <main>
        <h1 className="brand">Coverage Keeper</h1>
        {view.name === "consent" && (
          <Consent onAccept={() => setView({ name: "capture" })} />
        )}
        {view.name === "capture" && (
          <Capture error={view.error} onPick={onPick} />
        )}
        {view.name === "reading" && (
          <p role="status" className="reading">
            Reading your letter. This can take up to 30 seconds.
          </p>
        )}
        {view.name === "offline" && (
          <Problem
            title="No connection. Your photo wasn't sent."
            text="Check your signal or Wi-Fi, then try again."
            action="Try again"
            onAction={() => (photo ? send(photo) : retake())}
          />
        )}
        {view.name === "error" && (
          <Problem
            title="We couldn't finish reading your letter"
            text={view.message}
            action="Try again"
            onAction={() => (photo ? send(photo) : retake())}
          />
        )}
        {view.name === "unclear" && <Unclear onRetake={retake} />}
        {view.name === "result" &&
          (view.data.confidence === "low" ? (
            <Unclear onRetake={retake} />
          ) : (
            <Result
              data={view.data}
              phone={phone}
              onScreen={() => setView({ name: "screening", data: view.data })}
              onRetake={retake}
            />
          ))}
        {view.name === "screening" && (
          <Screening
            onDone={(yes) => setView({ name: "screened", data, yes })}
          />
        )}
        {view.name === "screened" && (
          <Screened
            yes={view.yes}
            deadline={data?.deadline ?? null}
            onBack={() =>
              setView(data ? { name: "result", data } : { name: "capture" })
            }
          />
        )}
      </main>
      <footer className="callbar">
        <span>Questions? Call</span>
        <a href={phoneHref(phone)}>{phone}</a>
      </footer>
    </>
  );
}

function Consent({ onAccept }: { onAccept: () => void }) {
  return (
    <section aria-labelledby="consent-title">
      <h2 id="consent-title">Before you send a photo</h2>
      <p className="lead">
        Take a photo of a letter from the Oregon Health Plan. You&apos;ll see
        what it asks you to do, the due date, and which papers to send.
      </p>
      <ul className="facts">
        <li>An AI service reads your photo for us.</li>
        <li>We don&apos;t store your photo or your answers.</li>
        <li>
          This isn&apos;t legal advice. Only the Oregon Health Authority decides
          your coverage.
        </li>
        <li>
          If you&apos;d rather talk to a person, the OHP phone number is at the
          bottom of every screen.
        </li>
      </ul>
      <button type="button" className="primary" onClick={onAccept}>
        I understand
      </button>
    </section>
  );
}

function Capture({
  error,
  onPick,
}: {
  error?: string;
  onPick: (file: File | undefined) => void;
}) {
  return (
    <section aria-labelledby="capture-title">
      <h2 id="capture-title">Photograph the first page</h2>
      <p className="lead">
        Lay it flat near a window or lamp, and get all four corners in the
        frame.
      </p>
      <label className="primary pick">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => {
            onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <span>Scan my letter</span>
      </label>
      {error && (
        <p role="alert" className="alert">
          {error}
        </p>
      )}
    </section>
  );
}

function Problem({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <section role="alert" aria-labelledby="problem-title">
      <h2 id="problem-title">{title}</h2>
      <p className="lead">{text}</p>
      <button type="button" className="primary" onClick={onAction}>
        {action}
      </button>
    </section>
  );
}

function Unclear({ onRetake }: { onRetake: () => void }) {
  return (
    <section aria-labelledby="unclear-title">
      <h2 id="unclear-title">We couldn&apos;t read this clearly</h2>
      <p className="lead">A new photo usually fixes it:</p>
      <ul className="facts">
        <li>Turn on a light or move closer to a window.</li>
        <li>Lay the letter on a flat surface.</li>
        <li>Hold the phone straight above the page so it fills the frame.</li>
      </ul>
      <button type="button" className="primary" onClick={onRetake}>
        Take a new photo
      </button>
    </section>
  );
}

function Result({
  data,
  phone,
  onScreen,
  onRetake,
}: {
  data: LetterExtraction;
  phone: string;
  onScreen: () => void;
  onRetake: () => void;
}) {
  if (data.notice_type === "not_medicaid") {
    return (
      <section aria-labelledby="result-title">
        <h2 id="result-title">
          This doesn&apos;t look like a Medicaid or OHP letter
        </h2>
        <p className="lead">
          If it came from OHP or the Oregon Health Authority, call {phone} and
          they can tell you what it means.
        </p>
        <button type="button" className="primary" onClick={onRetake}>
          Scan another letter
        </button>
      </section>
    );
  }
  const isWork = data.notice_type.startsWith("work_requirement");
  return (
    <section aria-labelledby="result-title">
      <p className="kind">{NOTICE_LABELS[data.notice_type]}</p>
      <h2 id="result-title">What your letter says</h2>
      <p className="lead">{safe(data.summary)}</p>

      <Deadline data={data} phone={phone} />

      <h3>What the letter asks you to do</h3>
      <p>{data.required_action ? safe(data.required_action) : NOT_SURE}</p>

      <h3>Papers to send</h3>
      {data.documents.length > 0 ? (
        <ul className="checklist">
          {data.documents.map((doc, i) => (
            <li key={i}>
              <label>
                <input type="checkbox" />
                <span>{safe(doc)}</span>
              </label>
            </li>
          ))}
        </ul>
      ) : (
        <p>{NOT_SURE}</p>
      )}

      <div className="actions">
        <button
          type="button"
          className={isWork ? "primary" : "secondary"}
          onClick={onScreen}
        >
          Check exemptions
        </button>
        <button type="button" className="secondary" onClick={onRetake}>
          Scan another letter
        </button>
      </div>
    </section>
  );
}

function Deadline({ data, phone }: { data: LetterExtraction; phone: string }) {
  const { status, days } = deadlineStatus(data.deadline, new Date());
  const quote = data.deadline_quote && (
    <blockquote>
      <mark>{safe(data.deadline_quote)}</mark>
    </blockquote>
  );
  return (
    <div className={`deadline ${status}`} data-testid="deadline">
      <h3>Due date</h3>
      {status === "unknown" ? (
        <>
          <p className="big">{NOT_SURE}</p>
          {quote}
          <p>Call {phone} to confirm your deadline.</p>
        </>
      ) : (
        <>
          <p className="date">{formatDate(data.deadline!)}</p>
          <p className="big">
            {status === "upcoming" &&
              `${days} ${days === 1 ? "day" : "days"} left`}
            {status === "today" && "Due today"}
            {status === "passed" && "This date has passed. Call now."}
          </p>
          {quote}
          {status === "passed" && (
            <p>
              Call {phone} today. Oregon lets you apply for OHP again at any
              time.{" "}
              <a href={rules.source_url} target="_blank" rel="noreferrer">
                Source: Oregon Health Authority
              </a>
            </p>
          )}
        </>
      )}
    </div>
  );
}

function Screening({ onDone }: { onDone: (yes: string[]) => void }) {
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  return (
    <form
      aria-labelledby="screening-title"
      onSubmit={(e) => {
        e.preventDefault();
        onDone(mayApply(answers, rules).map((r) => r.id));
      }}
    >
      <h2 id="screening-title">Exemption questions</h2>
      <p className="lead">
        Some OHP members don&apos;t have to meet the work rule. These questions
        follow the Oregon Health Authority&apos;s list. Skip any you&apos;d
        rather not answer.
      </p>
      {rules.exemptions.map((rule) => (
        <fieldset key={rule.id} className="question">
          <legend>{rule.question}</legend>
          {[true, false].map((value) => (
            <label key={String(value)}>
              <input
                type="radio"
                name={rule.id}
                checked={answers[rule.id] === value}
                onChange={() => setAnswers({ ...answers, [rule.id]: value })}
              />
              <span>{value ? "Yes" : "No"}</span>
            </label>
          ))}
        </fieldset>
      ))}
      <button type="submit" className="primary">
        See what may apply
      </button>
    </form>
  );
}

function Screened({
  yes,
  deadline,
  onBack,
}: {
  yes: string[];
  deadline: string | null;
  onBack: () => void;
}) {
  const matched = rules.exemptions.filter((r) => yes.includes(r.id));
  const source = (
    <p className="source">
      <a href={rules.source_url} target="_blank" rel="noreferrer">
        Source: Oregon Health Authority
      </a>
      , checked {formatDate(rules.retrieved)}
    </p>
  );
  return (
    <section aria-labelledby="screened-title">
      {matched.length > 0 ? (
        <>
          <h2 id="screened-title">Exemptions to ask about</h2>
          <ul className="matches">
            {matched.map((rule) => (
              <li key={rule.id} data-testid="may-apply">
                <p className="q">{rule.question}</p>
                <p>This may apply to you. Ask OHP about it.</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <>
          <h2 id="screened-title">Ways to meet the work rule</h2>
          <p className="lead">
            {rules.applies_to} You can meet the rule with one of these:
          </p>
          <ul className="facts">
            {rules.ways_to_meet.map((way) => (
              <li key={way.id}>{way.text}</li>
            ))}
          </ul>
        </>
      )}
      {yes.includes("health_condition") && <DoctorDraft deadline={deadline} />}
      {source}
      <button type="button" className="secondary" onClick={onBack}>
        Back
      </button>
    </section>
  );
}

// Built and kept in the browser only; nothing is sent or stored (US-040, US-041).
function DoctorDraft({ deadline }: { deadline: string | null }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState("");
  if (draft === null) {
    return (
      <button
        type="button"
        className="primary draft-open"
        onClick={() =>
          setDraft(buildDoctorDraft({ deadline, today: new Date() }))
        }
      >
        Draft a note to my doctor
      </button>
    );
  }
  const canShare = typeof navigator.share === "function";
  return (
    <div className="draft">
      <label htmlFor="doctor-draft">
        Note to your doctor. Edit it before you send it.
      </label>
      <textarea
        id="doctor-draft"
        rows={14}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setCopyStatus("");
        }}
      />
      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() =>
            // Also catches a missing clipboard API (older iOS, insecure context).
            Promise.resolve()
              .then(() => navigator.clipboard.writeText(draft))
              .then(
                () => setCopyStatus("Copied"),
                () =>
                  setCopyStatus(
                    "Couldn't copy. Press and hold the text to copy it.",
                  ),
              )
          }
        >
          Copy
        </button>
        {canShare && (
          <button
            type="button"
            className="secondary"
            onClick={() => navigator.share({ text: draft }).catch(() => {})}
          >
            Share
          </button>
        )}
      </div>
      <p role="status" className="copied">
        {copyStatus}
      </p>
    </div>
  );
}
