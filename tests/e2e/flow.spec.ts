import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

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

async function mockReader(page: Page, body: object = fixture) {
  let calls = 0;
  await page.route("**/api/read", (route) => {
    calls++;
    return route.fulfill({ json: body });
  });
  return () => calls;
}

async function start(page: Page) {
  await page.clock.setFixedTime(new Date("2027-02-10T10:00:00-08:00"));
  await page.goto("/");
  await page.getByRole("button", { name: "I understand" }).click();
}

const scan = (page: Page, file = PNG) =>
  page.getByLabel("Scan my letter").setInputFiles(file);

async function expectNoSeriousA11yIssues(page: Page) {
  // Screen fade-ins would otherwise be measured at half opacity.
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished),
    ),
  );
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious).toEqual([]);
}

test("photo to explanation shows summary, deadline, checklist and phone", async ({
  page,
}) => {
  const calls = await mockReader(page);
  await start(page);
  await scan(page);

  await expect(
    page.getByRole("heading", { name: "What your letter says" }),
  ).toBeVisible();
  const deadline = page.getByTestId("deadline");
  await expect(deadline).toContainText("Feb 15, 2027");
  await expect(deadline).toContainText("5 days left");
  await expect(deadline).toContainText(fixture.deadline_quote);
  await expect(page.getByRole("checkbox")).toHaveCount(2);
  await expect(page.getByLabel("Pay stubs for January 2027")).toBeVisible();
  await expect(page.getByRole("link", { name: "800-699-9075" })).toBeVisible();
  expect(calls()).toBe(1);
  await expectNoSeriousA11yIssues(page);
});

test("passed deadline tells the user to call now", async ({ page }) => {
  await mockReader(page, { ...fixture, deadline: "2027-02-01" });
  await start(page);
  await scan(page);
  await expect(page.getByTestId("deadline")).toContainText(
    "This date has passed. Call now.",
  );
});

test("missing deadline and letter phone fall back safely", async ({ page }) => {
  await mockReader(page, {
    ...fixture,
    deadline: null,
    contact_phone: "503-555-0100",
  });
  await start(page);
  await scan(page);
  await expect(page.getByTestId("deadline")).toContainText(
    "Not sure. Check the letter or call.",
  );
  await expect(page.getByRole("link", { name: "503-555-0100" })).toBeVisible();
});

test("low confidence asks for a retake and hides the deadline", async ({
  page,
}) => {
  await mockReader(page, { ...fixture, confidence: "low" });
  await start(page);
  await scan(page);
  await expect(
    page.getByRole("heading", { name: "We couldn't read this clearly" }),
  ).toBeVisible();
  await expect(page.getByTestId("deadline")).toHaveCount(0);
});

test("unrelated letter says it is not an OHP letter", async ({ page }) => {
  await mockReader(page, { ...fixture, notice_type: "not_medicaid" });
  await start(page);
  await scan(page);
  await expect(
    page.getByRole("heading", { name: /doesn't look like a Medicaid/ }),
  ).toBeVisible();
  await expect(page.getByTestId("deadline")).toHaveCount(0);
});

test("eligibility claims from the reader are replaced", async ({ page }) => {
  await mockReader(page, { ...fixture, summary: "You are eligible for OHP." });
  await start(page);
  await scan(page);
  await expect(page.getByText("We can't decide if you qualify.")).toBeVisible();
  await expect(page.getByText("You are eligible")).toHaveCount(0);
});

test("non-image file is rejected before upload", async ({ page }) => {
  const calls = await mockReader(page);
  await start(page);
  await scan(page, {
    name: "letter.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4"),
  });
  await expect(page.getByText("That file isn't a photo.")).toBeVisible();
  expect(calls()).toBe(0);
});

test("exemption screening shows rules that may apply", async ({ page }) => {
  await mockReader(page);
  await start(page);
  await scan(page);
  await page.getByRole("button", { name: "Check exemptions" }).click();

  await page
    .getByRole("group", { name: "Do you have Medicare?" })
    .getByLabel("Yes")
    .check();
  await page
    .getByRole("group", {
      name: "Are you pregnant or were you recently pregnant?",
    })
    .getByLabel("No")
    .check();
  await page.getByRole("button", { name: "See what may apply" }).click();

  const items = page.getByTestId("may-apply");
  await expect(items).toHaveCount(1);
  await expect(items).toContainText("Do you have Medicare?");
  await expect(items).toContainText("This may apply to you. Ask OHP about it.");
  await expect(
    page.getByRole("link", { name: "Source: Oregon Health Authority" }),
  ).toHaveAttribute("href", /oregon\.gov/);
  await expect(page.getByText(/checked Oct 28, 2026/)).toBeVisible();
  await expect(page.getByText(/you are exempt/i)).toHaveCount(0);
  await expectNoSeriousA11yIssues(page);
});

test("no yes answers shows the ways to meet the rule", async ({ page }) => {
  await mockReader(page);
  await start(page);
  await scan(page);
  await page.getByRole("button", { name: "Check exemptions" }).click();
  await page.getByRole("button", { name: "See what may apply" }).click();
  await expect(
    page.getByRole("heading", { name: "Ways to meet the work rule" }),
  ).toBeVisible();
  await expect(page.getByText(/80 hours a month/)).toBeVisible();
});

test("offline: photo is not sent and retry works", async ({
  page,
  context,
}) => {
  const calls = await mockReader(page);
  await start(page);
  await context.setOffline(true);
  await scan(page);
  await expect(
    page.getByRole("heading", {
      name: "No connection. Your photo wasn't sent.",
    }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "800-699-9075" })).toBeVisible();
  expect(calls()).toBe(0);
  await expectNoSeriousA11yIssues(page);

  await context.setOffline(false);
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByRole("heading", { name: "What your letter says" }),
  ).toBeVisible();
});

test.describe("dark mode", () => {
  test.use({ colorScheme: "dark" });

  test("result and screening screens keep AA contrast", async ({ page }) => {
    await mockReader(page, { ...fixture, deadline: "2027-02-01" });
    await start(page);
    await scan(page);
    await expect(page.getByTestId("deadline")).toContainText("has passed");
    await expectNoSeriousA11yIssues(page);
    await page.getByRole("button", { name: "Check exemptions" }).click();
    await page
      .getByRole("group", { name: "Do you have Medicare?" })
      .getByLabel("Yes")
      .check();
    await page.getByRole("button", { name: "See what may apply" }).click();
    await expect(page.getByTestId("may-apply")).toHaveCount(1);
    await expectNoSeriousA11yIssues(page);
  });
});
