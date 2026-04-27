import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAppFilterQuery,
  buildPathQuery,
  buildAppProjectHref,
  buildTaskHref,
} from "@/app/app-routing";

const baseFilters = {
  sort: "priority" as const,
  direction: "desc" as const,
  selectedStatuses: ["todo", "in_progress"] as ("todo" | "in_progress")[],
  selectedPriorities: [] as never[],
  startDate: null,
  endDate: null,
  projectView: "board" as const,
};

test("buildAppFilterQuery includes explicit all-status state and optional view", () => {
  assert.equal(
    buildAppFilterQuery(
      {
        ...baseFilters,
        selectedStatuses: [],
        selectedPriorities: ["urgent"],
      },
      { includeView: true },
    ),
    "sort=priority&direction=desc&status=all&priority=urgent&view=board",
  );
});

test("buildTaskHref carries task filter context into shareable task routes", () => {
  assert.equal(
    buildTaskHref("TSK-145", baseFilters),
    "/tasks/145?sort=priority&direction=desc&status=todo%2Cin_progress&view=board",
  );
});

test("buildAppProjectHref omits project view unless explicitly requested", () => {
  assert.equal(
    buildAppProjectHref("1", baseFilters),
    "/projects/1?sort=priority&direction=desc&status=todo%2Cin_progress",
  );
  assert.equal(
    buildAppProjectHref("1", baseFilters, { includeView: true }),
    "/projects/1?sort=priority&direction=desc&status=todo%2Cin_progress&view=board",
  );
});

test("buildPathQuery returns the bare pathname only when query state is empty", () => {
  assert.equal(
    buildPathQuery("/projects/1", {
      sort: "priority",
      direction: "desc",
      selectedStatuses: [],
      selectedPriorities: [],
      startDate: null,
      endDate: null,
      projectView: "list",
    }),
    "/projects/1?sort=priority&direction=desc&status=all",
  );
});
