import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { SMOKE_PROJECT_ID, SMOKE_TASK_ID } from "./smoke-constants.mjs";

const BASE_URL = process.env.TASKEWR_BASE_URL || "http://127.0.0.1:3000";
const EMAIL = process.env.TASKEWR_SMOKE_EMAIL || "account@taskewr.com";
const PASSWORD = process.env.TASKEWR_SMOKE_PASSWORD || "taskewr";
const ARTIFACT_DIR = process.env.TASKEWR_SMOKE_ARTIFACT_DIR || "test-results/smoke-browser";

async function saveFailureArtifacts(page) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.screenshot({ path: `${ARTIFACT_DIR}/failure.png`, fullPage: true });
  await writeFile(`${ARTIFACT_DIR}/failure.html`, await page.content());
}

async function main() {
  const browser = await chromium.launch({
    headless: process.env.TASKEWR_BROWSER_HEADLESS !== "false",
  });
  const page = await browser.newPage();
  const browserErrors = [];
  const runId = Date.now();
  const dashboardTaskTitle = `Dashboard smoke task ${runId}`;
  const editedDashboardTaskTitle = `${dashboardTaskTitle} updated`;
  const projectTaskTitle = `Project smoke task ${runId}`;
  const editedProjectTaskTitle = `${projectTaskTitle} updated`;

  page.on("pageerror", (error) => {
    browserErrors.push(error);
  });

  try {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.locator('input[name="email"]').fill(EMAIL);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.getByRole("button", { name: "Log In" }).click();
    await page.getByRole("heading", { name: "Dashboard" }).waitFor();

    await page.goto(`${BASE_URL}/tasks/${SMOKE_TASK_ID}`);
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.waitForURL(/\/projects\/\d+/);
    await page.getByRole("button", { name: "+ New Task" }).waitFor();

    await page.goto(`${BASE_URL}/projects/${SMOKE_PROJECT_ID}?status=todo&priority=urgent`);
    await page.getByRole("button", { name: "+ New Task" }).waitFor();

    await page.goto(`${BASE_URL}/`);
    await page.getByRole("button", { name: "+ New Task" }).click();

    const dashboardCreateDialog = page.getByRole("dialog", { name: "Create task" });
    await dashboardCreateDialog.locator("input").first().fill(dashboardTaskTitle);
    await dashboardCreateDialog.locator("textarea").first().fill("Created from the dashboard smoke flow.");
    await dashboardCreateDialog.locator('input[type="date"]').last().fill(new Date().toISOString().slice(0, 10));
    await dashboardCreateDialog.getByLabel("Repeat this task").check();
    await dashboardCreateDialog.getByRole("button", { name: "Create task" }).click();
    await page.getByText("Recurring tasks", { exact: true }).waitFor();
    await page.getByRole("heading", { name: "Today and Unscheduled" }).first().waitFor();
    await page.getByRole("button", { name: "Hide recurring tasks" }).click();
    await page.reload();
    await page.getByRole("button", { name: "Show recurring tasks" }).waitFor();
    await page.getByRole("button", { name: "Show recurring tasks" }).click();
    await page.getByText(dashboardTaskTitle).first().waitFor();

    await page.getByText(dashboardTaskTitle).first().click();
    const dashboardEditDialog = page.getByRole("dialog", { name: dashboardTaskTitle });
    await dashboardEditDialog.locator("input").first().fill(editedDashboardTaskTitle);
    await dashboardEditDialog.getByRole("button", { name: "Save changes" }).click();
    await page.getByText(editedDashboardTaskTitle).first().waitFor();

    await page.goto(`${BASE_URL}/projects/${SMOKE_PROJECT_ID}?view=board`);
    await page.getByRole("button", { name: "+ New Task" }).click();

    const createDialog = page.getByRole("dialog", { name: "Create task" });
    await createDialog.locator("input").first().fill(projectTaskTitle);
    await createDialog.locator("textarea").first().fill("Created by browser smoke coverage.");
    await createDialog.getByRole("button", { name: "Create task" }).click();
    await page.getByText(projectTaskTitle).first().waitFor();

    await page.getByText(projectTaskTitle).first().click();
    const editDialog = page.getByRole("dialog", { name: projectTaskTitle });
    await editDialog.locator("input").first().fill(editedProjectTaskTitle);
    await editDialog.locator("select").nth(2).selectOption("in_progress");
    await editDialog.getByRole("button", { name: "Save changes" }).click();
    await page.getByText(editedProjectTaskTitle).first().waitFor();
    await page.getByRole("heading", { name: "In progress" }).waitFor();

    if (browserErrors.length > 0) {
      throw browserErrors[0];
    }

    console.log(`browser smoke ok: ${editedProjectTaskTitle}`);
  } catch (error) {
    await saveFailureArtifacts(page).catch((artifactError) => {
      console.error("Could not save browser smoke artifacts:", artifactError);
    });
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
