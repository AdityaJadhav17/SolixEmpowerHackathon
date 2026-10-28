import { z } from "zod";

// Contract between the letter reader (model output), the UI and the eval.
export const NoticeType = z.enum([
  "work_requirement_info",
  "work_requirement_verification",
  "renewal",
  "request_for_information",
  "coverage_ending",
  "approval_or_change",
  "other_medicaid",
  "not_medicaid",
]);

export const LetterExtraction = z.object({
  notice_type: NoticeType,
  summary: z.string().max(600),
  deadline: z.iso.date().nullable(),
  deadline_quote: z.string().max(300).nullable(),
  required_action: z.string().max(400).nullable(),
  documents: z.array(z.string().max(200)).max(20),
  contact_phone: z.string().max(40).nullable(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type LetterExtraction = z.infer<typeof LetterExtraction>;
