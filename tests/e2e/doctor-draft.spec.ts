import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const fixture = JSON.parse(
  readFileSync("tests/fixtures/reader/synthetic-work-requirement.json", "utf8"),
);

// 1x1 PNG; goes through the real canvas re-encode in the browser.
const PNG = {
  name: "letter.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64",
  ),
};

test("health condition yes drafts an editable, copyable doctor note", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: (text: string) => {
          (window as unknown as { copied: string }).copied = text;
          return Promise.resolve();
        },
      },
    });
  });
  await page.route("**/api/read", (route) => route.fulfill({ json: fixture }));
  await page.clock.setFixedTime(new Date("2027-02-10T10:00:00-08:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByLabel("Scan my letter").setInputFiles(PNG);
  await page.getByRole("button", { name: "Check exemptions" }).click();
  await page
    .getByRole("group", {
      name: "Do you have a serious or disabling health condition?",
    })
    .getByLabel("Yes")
    .check();
  await page.getByRole("button", { name: "See what may apply" }).click();
  await page.getByRole("button", { name: "Draft a note to my doctor" }).click();

  const note = page.getByLabel(/Note to your doctor/);
  await expect(note).toHaveValue(/I need this by Feb 15, 2027\./);
  await expect(note).toHaveValue(
    /\[describe your condition in your own words\]/,
  );
  await note.fill("My edited note");
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("status")).toHaveText("Copied");
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe("My edited note");

  const results = await new AxeBuilder({ page }).analyze();
  expect(
    results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    ),
  ).toEqual([]);
});

test("no health condition yes hides the doctor note", async ({ page }) => {
  await page.route("**/api/read", (route) => route.fulfill({ json: fixture }));
  await page.goto("/");
  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByLabel("Scan my letter").setInputFiles(PNG);
  await page.getByRole("button", { name: "Check exemptions" }).click();
  await page
    .getByRole("group", { name: "Do you have Medicare?" })
    .getByLabel("Yes")
    .check();
  await page.getByRole("button", { name: "See what may apply" }).click();
  await expect(page.getByTestId("may-apply")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Draft a note to my doctor" }),
  ).toHaveCount(0);
});

test("copy failure tells the user to copy by hand", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("denied")) },
    });
  });
  await page.route("**/api/read", (route) => route.fulfill({ json: fixture }));
  await page.goto("/");
  await page.getByRole("button", { name: "I understand" }).click();
  await page.getByLabel("Scan my letter").setInputFiles(PNG);
  await page.getByRole("button", { name: "Check exemptions" }).click();
  await page
    .getByRole("group", {
      name: "Do you have a serious or disabling health condition?",
    })
    .getByLabel("Yes")
    .check();
  await page.getByRole("button", { name: "See what may apply" }).click();
  await page.getByRole("button", { name: "Draft a note to my doctor" }).click();
  await page.getByRole("button", { name: "Copy" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Couldn't copy. Press and hold the text to copy it.",
  );
});
