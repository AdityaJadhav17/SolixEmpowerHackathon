import { afterEach, describe, expect, it, vi } from "vitest";
import {
  MAX_PICK_BYTES,
  MAX_UPLOAD_BYTES,
  fitWithin,
  rejectReason,
  toUploadJpeg,
} from "./image";

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

describe("toUploadJpeg", () => {
  // Fake canvas whose JPEG size scales with pixels and quality.
  function stubBrowser(bytesPerPixel: number) {
    const canvases: { width: number; height: number }[] = [];
    vi.stubGlobal(
      "Image",
      class {
        naturalWidth = 4032;
        naturalHeight = 3024;
        src = "";
        decode = () => Promise.resolve();
      },
    );
    vi.stubGlobal("document", {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({ drawImage: () => {} }),
          toBlob: (cb: (b: Blob) => void, _type: string, q: number) =>
            cb({
              size: canvas.width * canvas.height * bytesPerPixel * q,
            } as Blob),
        };
        canvases.push(canvas);
        return canvas;
      },
    });
    const revoke = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    return { canvases, revoke };
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("downscales to 2000px and retries until under 2 MB", async () => {
    const { canvases, revoke } = stubBrowser(1);
    const blob = await toUploadJpeg(new Blob());
    expect(blob.size).toBeLessThanOrEqual(MAX_UPLOAD_BYTES);
    expect(canvases[0]).toMatchObject({ width: 2000, height: 1500 });
    expect(canvases.length).toBeGreaterThan(1);
    expect(revoke).toHaveBeenCalledWith("blob:x");
  });

  it("gives up after repeated attempts and still frees the URL", async () => {
    const { revoke } = stubBrowser(1000);
    await expect(toUploadJpeg(new Blob())).rejects.toThrow(/too large/);
    expect(revoke).toHaveBeenCalled();
  });
});
