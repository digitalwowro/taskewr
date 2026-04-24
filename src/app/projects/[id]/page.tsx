import { TaskewrApp } from "../../app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { notFound } from "next/navigation";
import {
  parseProjectViewFromSearchParams,
  parseTaskFiltersFromSearchParams,
} from "@/domain/common/filters";
import { buildPathWithSearch, requireAuthenticatedPage } from "@/lib/page-auth";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  await requireAuthenticatedPage(buildPathWithSearch(`/projects/${id}`, resolvedSearchParams));
  const filters = parseTaskFiltersFromSearchParams(resolvedSearchParams);
  const view = parseProjectViewFromSearchParams(resolvedSearchParams);
  const data = await new AppDataService().getDataForProject(id, filters);

  if (!data) {
    notFound();
  }

  return (
    <TaskewrApp
      initialSection="project_detail"
      initialProjectId={id}
      data={data}
      initialFilters={filters}
      initialProjectView={view}
    />
  );
}
