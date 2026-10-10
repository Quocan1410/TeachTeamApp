import { expect, test } from "@playwright/test";
import { candidate, signIn, signOut } from "./helpers";

test.describe("candidate", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, candidate.email, candidate.password);
    await expect(page).toHaveURL(/\/tutor/);
    await expect(page.getByRole("heading", { name: "Find your Teaching Roles" })).toBeVisible();
  });

  test("search narrows the course list and clear filters restores it", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Search course, code, or role" }).fill("ACCT1501");
    await expect(page.getByText(/Showing 1/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Accounting and Financial Management" })).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page.getByText(/Showing 1\s*[–-]\s*6/)).toBeVisible();
  });

  test("a course can be saved for later and removed again", async ({ page }) => {
    const save = page.getByRole("button", { name: "Save to apply later" }).first();
    await save.click();
    const saved = page.getByRole("button", { name: "Remove from apply later" }).first();
    await expect(saved).toHaveAttribute("aria-pressed", "true");
    await saved.click();
    await expect(page.getByRole("button", { name: "Save to apply later" }).first()).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  test("apply opens the form and cancel does not submit it", async ({ page }) => {
    await page.getByRole("button", { name: "Apply", exact: true }).first().click();
    await expect(page.getByText("Apply for position")).toBeVisible();
    await expect(page.getByText("Your skills")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Apply for position")).toBeHidden();
  });

  test("applications list opens a submitted application", async ({ page }) => {
    await page.goto("/tutor/applications");
    await expect(page.getByRole("heading", { name: "Track Every Submission" })).toBeVisible();
    await expect(page.getByText("STAT1371").first()).toBeVisible();
    await page.getByText("STAT1371").first().click();
    await expect(page.getByText("MY APPLICATION")).toBeVisible();
    await expect(page.getByText("alex.nguyen@candidate.edu.au")).toBeVisible();
  });

  test("profile and login security load, and authenticator is not built yet", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Alex Nguyen");
    await expect(page.locator("#profile-email")).toHaveValue("alex.nguyen@candidate.edu.au");
    await expect(page.getByText("JPG, PNG, WebP, GIF, AVIF or BMP under 2MB")).toBeVisible();
    await page.getByRole("button", { name: "Login & security" }).click();
    await expect(page.getByText("Not set up yet").first()).toBeVisible();
    await page.getByRole("button", { name: "Set up" }).nth(1).click();
    await expect(page.getByRole("heading", { name: "Sorry" })).toBeVisible();
    await page.getByRole("button", { name: /Back/ }).click();
    await expect(page.getByRole("button", { name: /^Current password/ })).toBeVisible();
  });

  test("session survives a refresh and logout returns to sign in", async ({ page }) => {
    await page.goto("/profile");
    await page.reload();
    await expect(page.getByRole("textbox", { name: "Full name" })).toHaveValue("Alex Nguyen");
    await signOut(page);
    await page.goto("/tutor");
    await expect(page).toHaveURL(/\/signin/);
  });

  test("a candidate cannot stay on the lecturer dashboard", async ({ page }) => {
    await page.goto("/lecturer");
    await expect(page).toHaveURL(/\/tutor/);
  });
});
