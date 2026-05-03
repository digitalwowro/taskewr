import assert from "node:assert/strict";
import test from "node:test";

import { countDoneSubtasks } from "@/domain/tasks/subtasks";

test("countDoneSubtasks counts only completed subtasks", () => {
  assert.equal(
    countDoneSubtasks([
      { id: "TSK-1", title: "Done", status: "Completed", statusValue: "done" },
      { id: "TSK-2", title: "Canceled", status: "Canceled", statusValue: "canceled" },
      { id: "TSK-3", title: "Todo", status: "Todo", statusValue: "todo" },
    ]),
    1,
  );
});
