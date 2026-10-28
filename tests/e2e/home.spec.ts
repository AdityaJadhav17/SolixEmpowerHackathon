import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page shows the product and who to call, with no serious a11y issues", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Coverage Keeper" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "800-699-9075" })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  expect(serious).toEqual([]);
});
