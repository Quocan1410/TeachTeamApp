import { expect, test } from "@playwright/test";

test.describe("guest", () => {
  test("home explains how to apply and offers sign in", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Apply & Join as a Tutor or Lab Assistant" })
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign Up" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meet Our Lecturers" })).toBeVisible();
  });

  test("courses can be browsed and apply asks the guest to sign in", async ({ page }) => {
    await page.goto("/courses");
    await expect(page.getByRole("heading", { name: "Courses", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Apply" }).first().click();
    await expect(page.getByRole("heading", { name: "Sign in to apply", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in", exact: true })).toBeVisible();
  });

  test("lecturer directory filters by name", async ({ page }) => {
    await page.goto("/lecturers");
    await expect(page.getByRole("heading", { name: "Lecturers", exact: true })).toBeVisible();
    await page.getByRole("searchbox", { name: "Search lecturers by name or course" }).fill("Morrison");
    await expect(page.getByText("Jane Morrison")).toBeVisible();
  });

  test("signup rejects an empty form and a non-school email", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(page.getByText("Full name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();

    await page.getByRole("textbox", { name: "Full Name" }).fill("Test User");
    await page.getByRole("textbox", { name: "Password", exact: true }).fill("Password123!");
    await page.getByRole("textbox", { name: "Confirm Password" }).fill("Password123!");
    await page.getByRole("textbox", { name: "Email Address" }).fill("test.user@gmail.com");
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(page.getByText("Candidate email must end with @candidate.edu.au")).toBeVisible();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("signin rejects a wrong password without revealing which field failed", async ({ page }) => {
    await page.goto("/signin");
    await page.getByRole("textbox", { name: "Email Address" }).fill("alex.nguyen@candidate.edu.au");
    await page.getByRole("textbox", { name: "Password" }).fill("wrong-password");
    await page.getByRole("button", { name: "Sign In", exact: true }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/signin/);
  });

  test("forgot-password email and authenticator stay unimplemented", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Reset Password" })).toBeVisible();
    await page.getByRole("button", { name: /Email/ }).click();
    await expect(page.getByRole("heading", { name: "Sorry" })).toBeVisible();
    await expect(page.getByText("This feature will be implemented later.")).toBeVisible();
    await page.getByRole("button", { name: /Back/ }).click();
    await page.getByRole("button", { name: /Authenticator/ }).click();
    await expect(page.getByRole("heading", { name: "Sorry" })).toBeVisible();
  });

  test("protected routes send a guest to sign in", async ({ page }) => {
    await page.goto("/tutor");
    await expect(page).toHaveURL(/\/signin/);
    await page.goto("/tutor/applications");
    await expect(page).toHaveURL(/\/signin/);
    await page.goto("/lecturer");
    await expect(page).toHaveURL(/\/signin/);
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/signin/);
  });
});
