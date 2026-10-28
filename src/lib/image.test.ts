import { describe, expect, it } from "vitest";
import { MAX_PICK_BYTES, fitWithin, rejectReason } from "./image";

describe("rejectReason", () => {
  it.each([
    ["image/jpeg", 1000],
    ["image/heic", 5_000_000],
    ["image/png", MAX_PICK_BYTES],
  ])("accepts %s of %i bytes", (type, size) => {
    expect(rejectReason({ type, size })).toBeNull();
  });

  it.each([
    ["application/pdf", 1000],
    ["", 1000],
    ["text/plain", 10],
  ])("rejects non-image %j", (type, size) => {
    expect(rejectReason({ type, size })).toMatch(/isn't a photo/);
  });

  it("rejects images over 15 MB", () => {
    expect(
      rejectReason({ type: "image/jpeg", size: MAX_PICK_BYTES + 1 }),
    ).toMatch(/too large/);
  });
});

describe("fitWithin", () => {
  it.each([
    [4032, 3024, 2000, 1500],
    [3024, 4032, 1500, 2000],
    [800, 600, 800, 600],
    [2000, 10, 2000, 10],
  ])("%ix%i -> %ix%i", (w, h, ew, eh) => {
    expect(fitWithin(w, h)).toEqual({ width: ew, height: eh });
  });
});
