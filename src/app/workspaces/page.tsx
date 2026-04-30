import { TaskewrApp } from "../app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function WorkspacesPage() {
  await requireAuthenticatedPage("/workspaces");
  const data = await new AppDataService().getWorkspacesPageData();

  return <TaskewrApp initialSection="workspaces" data={data} />;
}
