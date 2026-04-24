import { MockApp } from "../mock-app";
import { MockAppDataService } from "@/server/services/mock-app-data-service";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function ProjectsPage() {
  await requireAuthenticatedPage("/projects");
  const data = await new MockAppDataService().getProjectsPageData();

  return <MockApp initialSection="projects" data={data} />;
}
