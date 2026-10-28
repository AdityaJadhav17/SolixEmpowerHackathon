import type { LetterExtraction } from "./schema";

// Pinned so eval runs are comparable (ADR-0003). Change only with a new eval run.
export const MODEL_ID = "claude-opus-5-5";

export type LetterImage = {
  mediaType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
};

export type LetterReader = (image: LetterImage) => Promise<LetterExtraction>;

export const readLetter: LetterReader = async () => {
  throw new Error(
    "readLetter is not implemented yet (see HANDOFF.md, current task)",
  );
};
