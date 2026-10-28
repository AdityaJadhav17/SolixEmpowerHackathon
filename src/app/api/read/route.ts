import { enforceGuardrail } from "@/lib/guardrails";
import { MODEL_ID, readLetter, type LetterImage } from "@/lib/letter-reader";
import { createRateLimiter } from "@/lib/rate-limit";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_BODY = MAX_BYTES + 64 * 1024; // image + multipart overhead

// Each call spends paid model credits; cap one client looping (security audit H1).
const limited = createRateLimiter({ max: 10, windowMs: 60_000 });

const error = (status: number, message: string) =>
  Response.json({ error: message }, { status });

// Logs carry no image bytes, letter text or extracted fields (ADR-0004).
const log = (fields: Record<string, unknown>) =>
  console.info(
    JSON.stringify({ route: "/api/read", model: MODEL_ID, ...fields }),
  );

export async function POST(req: Request) {
  const started = Date.now();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (limited(ip || "unknown", started)) {
    log({ status: 429 });
    return error(
      429,
      "Too many tries. Please wait a minute, or call OHP at 800-699-9075.",
    );
  }
  // Reject before buffering the body (audit L1). Browsers always send Content-Length.
  if (Number(req.headers.get("content-length")) > MAX_BODY) {
    return error(413, "That photo is too large. Please use one under 4 MB.");
  }
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return error(400, "Please send a photo of your letter.");
  }

  const image = form.get("image");
  if (!(image instanceof File)) {
    return error(400, "Please send a photo of your letter.");
  }
  if (!ALLOWED_TYPES.includes(image.type)) {
    return error(400, "Please use a JPEG, PNG or WebP photo.");
  }
  if (image.size > MAX_BYTES) {
    return error(413, "That photo is too large. Please use one under 4 MB.");
  }

  try {
    const result = await readLetter({
      mediaType: image.type as LetterImage["mediaType"],
      base64: Buffer.from(await image.arrayBuffer()).toString("base64"),
    });
    // Every user-facing string, including text copied from the letter (ADR-0005).
    let blocked = false;
    const guard = (text: string) => {
      const out = enforceGuardrail(text);
      blocked ||= out.blocked;
      return out.text;
    };
    const safe = {
      ...result,
      summary: guard(result.summary),
      required_action: result.required_action && guard(result.required_action),
      deadline_quote: result.deadline_quote && guard(result.deadline_quote),
      documents: result.documents.map(guard),
    };
    log({ status: 200, ms: Date.now() - started, blocked });
    return Response.json(safe);
  } catch (err) {
    log({
      status: 502,
      ms: Date.now() - started,
      error: err instanceof Error ? err.constructor.name : "unknown",
    });
    return error(
      502,
      "We couldn't read your letter right now. Please try again, or call OHP at 800-699-9075.",
    );
  }
}
