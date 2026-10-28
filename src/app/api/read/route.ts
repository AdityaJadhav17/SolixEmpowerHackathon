import { enforceGuardrail } from "@/lib/guardrails";
import { MODEL_ID, readLetter, type LetterImage } from "@/lib/letter-reader";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

const error = (status: number, message: string) =>
  Response.json({ error: message }, { status });

// Logs carry no image bytes, letter text or extracted fields (ADR-0004).
const log = (fields: Record<string, unknown>) =>
  console.info(
    JSON.stringify({ route: "/api/read", model: MODEL_ID, ...fields }),
  );

export async function POST(req: Request) {
  const started = Date.now();
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
    const summary = enforceGuardrail(result.summary);
    const action = result.required_action
      ? enforceGuardrail(result.required_action)
      : null;
    log({
      status: 200,
      ms: Date.now() - started,
      blocked: summary.blocked || Boolean(action?.blocked),
    });
    return Response.json({
      ...result,
      summary: summary.text,
      required_action: action?.text ?? null,
    });
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
