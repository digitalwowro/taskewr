import { TaskewrApp } from "../app-client";
import { AppDataService } from "@/server/services/app-data-service";
import { requireAuthenticatedPage } from "@/lib/page-auth";

export default async function UsersPage() {
  await requireAuthenticatedPage("/users");
  const data = await new AppDataService().getUsersPageData();

  return <TaskewrApp initialSection="users" data={data} />;
}
