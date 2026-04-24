import { TaskewrApp } from "../app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function ProjectsPage() {
  await requireAuthenticatedPage("/projects");
  const data = await new AppDataService().getProjectsPageData();

  return <TaskewrApp initialSection="projects" data={data} />;
}
