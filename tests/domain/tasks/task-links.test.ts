import assert from "node:assert/strict";
import test from "node:test";

import { taskLinkMutationSchema } from "@/domain/tasks/schemas";

test("taskLinkMutationSchema accepts http and https links", () => {
  assert.deepEqual(taskLinkMutationSchema.parse({
    title: "Docs",
    url: "https://example.com/docs",
  }), {
    title: "Docs",
    url: "https://example.com/docs",
  });

  assert.equal(taskLinkMutationSchema.parse({
    title: "Local",
    url: "http://localhost:3000/task",
  }).url, "http://localhost:3000/task");
});

test("taskLinkMutationSchema rejects blank title and non-http links", () => {
  assert.throws(() => taskLinkMutationSchema.parse({
    title: "",
    url: "https://example.com",
  }));

  assert.throws(() => taskLinkMutationSchema.parse({
    title: "Bad",
    url: "mailto:test@example.com",
  }));

  assert.throws(() => taskLinkMutationSchema.parse({
    title: "Bad",
    url: "not-a-url",
  }));
});
