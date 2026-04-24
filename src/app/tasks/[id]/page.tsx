import { TaskewrApp } from "../../app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { notFound } from "next/navigation";
import {
  parseProjectViewFromSearchParams,
  parseTaskFiltersFromSearchParams,
} from "@/domain/common/filters";
import { buildPathWithSearch, requireAuthenticatedPage } from "@/lib/page-auth";

export default async function TaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  await requireAuthenticatedPage(buildPathWithSearch(`/tasks/${id}`, resolvedSearchParams));
  const filters = parseTaskFiltersFromSearchParams(resolvedSearchParams);
  const view = parseProjectViewFromSearchParams(resolvedSearchParams);
  const data = await new AppDataService().getDataForTask(id, filters);

  if (!data) {
    notFound();
  }

  return (
    <TaskewrApp
      initialSection="task_detail"
      initialTaskId={id}
      data={data}
      initialFilters={filters}
      initialProjectView={view}
    />
  );
}
