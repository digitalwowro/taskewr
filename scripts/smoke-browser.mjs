import { chromium } from "@playwright/test";

const BASE_URL = process.env.TASKEWR_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.TASKEWR_SMOKE_EMAIL || "account@taskewr.com";
const PASSWORD = process.env.TASKEWR_SMOKE_PASSWORD || "taskewr";

async function main() {
  const browser = await chromium.launch({
    headless: process.env.TASKEWR_BROWSER_HEADLESS !== "false",
  });
  const page = await browser.newPage();
  const taskTitle = `Browser smoke task ${Date.now()}`;
  const editedTitle = `${taskTitle} updated`;

  try {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.waitForURL(`${BASE_URL}/`);
    await page.getByRole("heading", { name: "Dashboard" }).waitFor();

    await page.goto(`${BASE_URL}/projects/1?view=board`);
    await page.getByRole("button", { name: "+ New Task" }).click();

    const createDialog = page.getByRole("dialog", { name: "Create task" });
    await createDialog.locator("input").first().fill(taskTitle);
    await createDialog.locator("textarea").first().fill("Created by browser smoke coverage.");
    await createDialog.getByRole("button", { name: "Create task" }).click();
    await page.getByText(taskTitle).waitFor();

    await page.getByText(taskTitle).first().click();
    const editDialog = page.getByRole("dialog", { name: taskTitle });
    await editDialog.locator("input").first().fill(editedTitle);
    await editDialog.locator("select").nth(2).selectOption("in_progress");
    await editDialog.getByRole("button", { name: "Save changes" }).click();
    await page.getByText(editedTitle).waitFor();
    await page.getByRole("heading", { name: "In progress" }).waitFor();

    console.log(`browser smoke ok: ${editedTitle}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
