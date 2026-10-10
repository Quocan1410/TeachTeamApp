import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { attachVirtualAuthenticator, lecturer, signIn, signOut } from "./helpers";

const email = "e2e.coverage@candidate.edu.au";
const password = "Password123!";
const nextPassword = "Password123!x";
const avatar = path.join(__dirname, "..", "fixtures", "pixel.png");

function deleteTestUser() {
  execFileSync(process.execPath, ["ci/delete-user.mjs", email], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });
}

test.describe.configure({ mode: "serial" });

test.describe("remaining candidate and lecturer workflows", () => {

  test("a new candidate can save a passkey and sign in with it", async ({ page }) => {
    test.setTimeout(90_000);
    deleteTestUser();
    await page.goto("/signup", { waitUntil: "domcontentloaded" });
    await page.getByRole("textbox", { name: "Full Name" }).fill("Eden Coverage");
    await page.getByRole("button", { name: "Title" }).click();
    await page.getByRole("option", { name: "Mr." }).click();
    await page.getByRole("textbox", { name: "Password", exact: true }).fill(password);
    await page.getByRole("textbox", { name: "Confirm Password" }).fill(password);
    await page.getByRole("textbox", { name: "Email Address" }).fill(email);
    await page.getByRole("button", { name: "Sign Up", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Save a passkey?" })).toBeVisible();

    await attachVirtualAuthenticator(page);
    await page.getByRole("button", { name: "Create passkey" }).click();
    await expect(page).toHaveURL(/\/signin/, { timeout: 20_000 });
    await expect(page.getByText("Passkey saved")).toBeVisible();

    await page.getByRole("button", { name: "Use a passkey" }).click();
    const continueButton = page.getByRole("button", { name: "Continue to dashboard" });
    await expect(continueButton).toBeEnabled({ timeout: 20_000 });
    await continueButton.click();
    await expect(page).toHaveURL(/\/tutor/, { timeout: 20_000 });
    await signOut(page);
  });

  test("theme, avatar, password, application, notifications, and pagination work", async ({ page }) => {
    test.setTimeout(120_000);
    await signIn(page, email, password);

    const socketPromise = page.waitForEvent("websocket", {
      predicate: (socket) => socket.url().includes("socket.io"),
      timeout: 20_000,
    });
    await page.reload();
    await socketPromise;
    await expect(page.getByRole("heading", { name: "Find your Teaching Roles" })).toBeVisible();

    const nextPage = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextPage).toBeEnabled();
    await nextPage.click();
    await expect(page.getByText(/Page 2 of/)).toBeVisible();
    await page.getByRole("button", { name: "Previous" }).click();
    await expect(page.getByText(/Page 1 of/)).toBeVisible();

    await page.getByRole("button", { name: /Notifications/ }).click();
    await expect(page.getByRole("dialog", { name: "Notifications" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Activity" })).toBeVisible();
    await page.keyboard.press("Escape");

    await page.getByTestId("user-dropdown").locator("div").first().click();
    await page.getByRole("menuitem", { name: "Theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByTestId("user-dropdown").locator("div").first().click();
    await page.getByRole("menuitem", { name: "Theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.goto("/profile");
    const upload = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/avatar") && response.request().method() === "POST"
    );
    await page.locator("input[type='file']").setInputFiles(avatar);
    const uploaded = await upload;
    expect(uploaded.status(), await uploaded.text()).toBe(200);
    await expect(page.getByText("Avatar updated successfully.")).toBeVisible();
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("Avatar removed.")).toBeVisible();

    await page.getByRole("button", { name: "Login & security" }).click();
    await page.getByRole("button", { name: /Current password/ }).click();
    await page.locator("#currentPassword").fill(password);
    await page.locator("#newPassword").fill(nextPassword);
    await page.locator("#confirmPassword").fill(nextPassword);
    await page.getByRole("button", { name: "Update password" }).click();
    await expect(page.getByText("Password changed successfully.")).toBeVisible();

    await page.goto("/tutor");
    await page.getByRole("searchbox", { name: "Search course, code, or role" }).fill("MARK1001");
    await expect(page.getByText(/Showing 1\s*[–-]\s*1/)).toBeVisible();
    const markCard = page.locator("article").filter({ hasText: "MARK1001" });
    await expect(markCard).toHaveCount(1);
    await markCard
      .getByRole("listitem")
      .filter({ hasText: "Tutor" })
      .getByRole("button", { name: "Apply", exact: true })
      .click();
    await expect(page.getByText("Your skills")).toBeVisible();
    await page.getByRole("button", { name: "Teaching", exact: true }).click();
    await page
      .getByPlaceholder("Explain your motivation for applying to this role and what you hope to contribute...")
      .fill("I want to help students understand the weekly tutorial work.");
    const submitted = page.waitForResponse((response) => {
      const status = response.status();
      return (
        response.url().includes("/api/applications") &&
        response.request().method() === "POST" &&
        status !== 301 &&
        status !== 302 &&
        status !== 307 &&
        status !== 308
      );
    });
    await page.getByRole("button", { name: "Submit Application" }).click();
    const submittedResponse = await submitted;
    const submittedBody = await submittedResponse.text();
    expect(submittedResponse.status(), submittedBody.slice(0, 500)).toBe(201);
    await expect(page.getByText("Application submitted for MARK1001!")).toBeVisible();

    await signOut(page);
    await signIn(page, email, nextPassword);
    await expect(page).toHaveURL(/\/tutor/);
    await signOut(page);
  });

  test("the lecturer can shortlist and then decline that new application", async ({ page }) => {
    test.setTimeout(90_000);
    await signIn(page, lecturer.email, lecturer.password);
    await page.getByPlaceholder("Enter candidate name...").fill("Coverage");
    await expect(page.getByText("Eden Coverage").first()).toBeVisible();
    await page.locator("[class*='applicantItem']").filter({ hasText: "Eden Coverage" }).first().click();
    await page.getByRole("button", { name: "Yes, shortlist this profile" }).click();
    await expect(page.getByRole("button", { name: "Confirm selection" })).toBeVisible();
    await page.getByRole("button", { name: "Remove from ranking" }).click();
    await expect(page.getByRole("button", { name: "No, decline this profile" })).toBeVisible();
    await page.getByRole("button", { name: "No, decline this profile" }).click();
    const declineDialog = page.getByRole("alertdialog", { name: "Decline applicant?" });
    await declineDialog.getByRole("button", { name: "Yes", exact: true }).click();
    await expect(page.getByText("This profile was declined at screening.")).toBeVisible();
    deleteTestUser();
  });
});
