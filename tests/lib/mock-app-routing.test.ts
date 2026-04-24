import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMockAppFilterQuery,
  buildMockPathQuery,
  buildMockProjectHref,
  buildMockTaskHref,
} from "@/app/mock-app-routing";

const baseFilters = {
  sort: "priority" as const,
  direction: "desc" as const,
  selectedStatuses: ["todo", "in_progress"] as const,
  selectedPriorities: [] as const,
  projectView: "board" as const,
};

test("buildMockAppFilterQuery includes explicit all-status state and optional view", () => {
  assert.equal(
    buildMockAppFilterQuery(
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

test("buildMockTaskHref carries task filter context into shareable task routes", () => {
  assert.equal(
    buildMockTaskHref("TSK-145", baseFilters),
    "/tasks/145?sort=priority&direction=desc&status=todo%2Cin_progress&view=board",
  );
});

test("buildMockProjectHref omits project view unless explicitly requested", () => {
  assert.equal(
    buildMockProjectHref("1", baseFilters),
    "/projects/1?sort=priority&direction=desc&status=todo%2Cin_progress",
  );
  assert.equal(
    buildMockProjectHref("1", baseFilters, { includeView: true }),
    "/projects/1?sort=priority&direction=desc&status=todo%2Cin_progress&view=board",
  );
});

test("buildMockPathQuery returns the bare pathname only when query state is empty", () => {
  assert.equal(
    buildMockPathQuery("/projects/1", {
      sort: "priority",
      direction: "desc",
      selectedStatuses: [],
      selectedPriorities: [],
      projectView: "list",
    }),
    "/projects/1?sort=priority&direction=desc&status=all",
  );
});
