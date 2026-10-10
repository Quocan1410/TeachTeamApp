import { expect, type Page } from "@playwright/test";

export async function attachVirtualAuthenticator(page: Page) {
  const client = await page.context().newCDPSession(page);
  await client.send("WebAuthn.enable");
  await client.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
}

export const candidate = {
  email: "alex.nguyen@candidate.edu.au",
  password: "Password123!",
};

export const lecturer = {
  email: "jane.morrison@lecturer.edu.au",
  password: "Password123!",
};

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/signin");
  await page.getByRole("textbox", { name: "Email Address" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  const continueButton = page.getByRole("button", { name: "Continue to dashboard" });
  await expect(continueButton).toBeEnabled({ timeout: 20_000 });
  await continueButton.click();
  await expect(page).toHaveURL(/\/(tutor|lecturer)/, { timeout: 20_000 });
}

export async function signOut(page: Page) {
  await page.getByTestId("user-dropdown").locator("div").first().click();
  await page.getByRole("menuitem", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/signin/);
}
