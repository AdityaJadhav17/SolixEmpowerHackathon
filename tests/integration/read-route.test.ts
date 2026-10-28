import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { POST } from "@/app/api/read/route";
import { LetterExtraction } from "@/lib/schema";

const png = () =>
  new File([new Uint8Array(10)], "a.png", { type: "image/png" });

const post = (file?: File, headers: Record<string, string> = {}) => {
  const form = new FormData();
  if (file) form.set("image", file);
  return POST(
    new Request("http://test/api/read", {
      method: "POST",
      body: form,
      headers,
    }),
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

  it("rejects a declared body over the limit before reading it", async () => {
    const res = await post(png(), {
      "content-length": String(5 * 1024 * 1024),
    });
    expect(res.status).toBe(413);
  });

  it("limits one client to 10 reads a minute (cost abuse)", async () => {
    const from = (ip: string) => post(png(), { "x-forwarded-for": ip });
    for (let i = 0; i < 10; i++) {
      expect((await from("203.0.113.7")).status).toBe(200);
    }
    const res = await from("203.0.113.7");
    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/800-699-9075/);
    expect((await from("203.0.113.8")).status).toBe(200);
  });
});
