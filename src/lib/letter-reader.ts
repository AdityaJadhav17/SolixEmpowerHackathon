import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  Message,
  MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";
import { LETTER_READER_SYSTEM_PROMPT } from "@/prompts/letter-reader";
import { LetterExtraction } from "./schema";

// Pinned so eval runs are comparable (ADR-0003). Change only with a new eval run.
export const MODEL_ID = "claude-opus-5-5";

export type LetterImage = {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
};

export type LetterReader = (image: LetterImage) => Promise<LetterExtraction>;

// Shown when the model output can't be trusted (US-013): never presented as fact.
export const UNSURE_RESULT: LetterExtraction = {
  notice_type: "other_medicaid",
  summary:
    "We could not read this letter clearly. Try a sharper photo, or call OHP at 800-699-9075 to ask what it says.",
  deadline: null,
  deadline_quote: null,
  required_action: null,
  documents: [],
  contact_phone: "800-699-9075",
  confidence: "low",
};

type CreateFn = (params: MessageCreateParamsNonStreaming) => Promise<Message>;

const FIXTURE_PATH = path.join(
  process.cwd(),
  "tests/fixtures/reader/synthetic-work-requirement.json",
);

const isRetryable = (err: unknown) =>
  err instanceof APIError &&
  err.status !== undefined &&
  (err.status === 429 || err.status >= 500);

export function createLetterReader(
  create: CreateFn,
  retryDelayMs = 1000,
): LetterReader {
  return async (image) => {
    const params: MessageCreateParamsNonStreaming = {
      model: MODEL_ID,
      // Thinking tokens count toward this on claude-opus-5-5; too low truncates the JSON.
      max_tokens: 16000,
      system: LETTER_READER_SYSTEM_PROMPT,
      output_config: {
        effort: "medium",
        format: zodOutputFormat(LetterExtraction),
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.base64,
              },
            },
            { type: "text", text: "Read this letter." },
          ],
        },
      ],
    };

    let message;
    try {
      message = await create(params);
    } catch (err) {
      if (!isRetryable(err)) throw err;
      await new Promise((r) => setTimeout(r, retryDelayMs));
      message = await create(params);
    }

    if (message.stop_reason !== "end_turn") return UNSURE_RESULT;
    const text = message.content.find((b) => b.type === "text")?.text;
    if (!text) return UNSURE_RESULT;
    try {
      const parsed = LetterExtraction.safeParse(JSON.parse(text));
      return parsed.success ? parsed.data : UNSURE_RESULT;
    } catch {
      return UNSURE_RESULT;
    }
  };
}

let live: LetterReader | undefined;

export const readLetter: LetterReader = async (image) => {
  if (process.env.LETTER_READER === "fixture") {
    return LetterExtraction.parse(
      JSON.parse(readFileSync(FIXTURE_PATH, "utf8")),
    );
  }
  if (!live) {
    // maxRetries 0: we do our own single retry on 429/5xx only.
    // 30 s timeout so a stuck call reaches the 502 + phone message (SDK default is 10 min).
    const client = new Anthropic({ maxRetries: 0, timeout: 30_000 });
    live = createLetterReader((params) => client.messages.create(params));
  }
  return live(image);
};
