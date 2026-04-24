import HomeClient from "./app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { parseTaskFiltersFromSearchParams } from "@/domain/common/filters";
import { buildPathWithSearch, requireAuthenticatedPage } from "@/lib/page-auth";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  await requireAuthenticatedPage(buildPathWithSearch("/", resolvedSearchParams));
  const filters = parseTaskFiltersFromSearchParams(resolvedSearchParams);
  const data = await new AppDataService().getDashboardData(filters);

  return <HomeClient data={data} initialFilters={filters} />;
}
