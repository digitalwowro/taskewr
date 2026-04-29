import { taskSearchInputSchema, type TaskSearchInput, type TaskSearchResult } from "@/domain/search/schemas";
import { SearchRepository } from "@/data/prisma/repositories/search-repository";
import { db } from "@/lib/db";
import { AppContextService } from "@/server/services/app-context-service";

export class SearchService {
  constructor(
    private readonly repository = new SearchRepository(db),
    private readonly contextService = new AppContextService(),
  ) {}

  async searchTasks(input: Partial<TaskSearchInput>): Promise<TaskSearchResult[]> {
    const normalized = taskSearchInputSchema.parse(input);
    const context = await this.contextService.getAppContext();

    return this.repository.searchTasks({
      ...normalized,
      projectIds: context.accessibleProjectIds,
    });
  }
}
