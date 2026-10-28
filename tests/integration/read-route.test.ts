import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/read/route";
import { LetterExtraction } from "@/lib/schema";

const post = (file?: File) => {
  const form = new FormData();
  if (file) form.set("image", file);
  return POST(
    new Request("http://test/api/read", { method: "POST", body: form }),
  );
};

describe("POST /api/read", () => {
  beforeAll(() => {
    process.env.LETTER_READER = "fixture";
  });
  afterAll(() => {
    delete process.env.LETTER_READER;
  });

  it("returns schema-valid JSON in fixture mode", async () => {
    const res = await post(
      new File([new Uint8Array(10)], "a.png", { type: "image/png" }),
    );
    expect(res.status).toBe(200);
    expect(LetterExtraction.safeParse(await res.json()).success).toBe(true);
  });

  it("rejects a missing image with 400", async () => {
    expect((await post()).status).toBe(400);
  });

  it("rejects a wrong file type with 400 (US-005)", async () => {
    const res = await post(
      new File(["%PDF"], "a.pdf", { type: "application/pdf" }),
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JPEG, PNG or WebP/);
  });

  it("rejects an image over 4 MB with 413 (US-005)", async () => {
    const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "a.jpg", {
      type: "image/jpeg",
    });
    expect((await post(big)).status).toBe(413);
  });
});
