import { expect, test } from "@playwright/test";
import { dismissPageTourIfPresent, lecturer, signIn } from "./helpers";

test.describe("lecturer", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, lecturer.email, lecturer.password);
    await page.goto("/lecturer");
    await dismissPageTourIfPresent(page);
    await expect(
      page.getByRole("heading", { level: 1, name: "Applicants" })
    ).toBeVisible();
  });

  test("the dashboard lists assigned applicants", async ({ page }) => {
    await expect(page.getByText("Chloe Martin")).toBeVisible();
    await expect(page.getByText("Zoe Hayes")).toBeVisible();
    await expect(page.getByText("No applicant selected")).toBeVisible();
  });

  test("searching by candidate name filters the list", async ({ page }) => {
    await page.getByPlaceholder("Search candidate name...").fill("Zoe");
    await expect(page.getByText("Zoe Hayes")).toBeVisible();
    await expect(page.getByText("Chloe Martin")).toBeHidden();
  });

  test("opening an applicant shows the screening decision", async ({ page }) => {
    await page.locator("[class*='applicantItem']").first().click();
    await expect(page.getByText("Does this profile meet your initial criteria?")).toBeVisible();
    await expect(page.getByRole("button", { name: "Yes, shortlist this profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "No, decline this profile" })).toBeVisible();
  });

  test("a lecturer cannot stay on the candidate course page", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page).toHaveURL(/\/lecturer\/courses/);
  });
});
