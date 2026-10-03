import { expect, it } from "vitest";
import { recentPaths } from "./recent-files.js";

it("uses newest actual file activity, skips failed/deleted changes and never treats commands or code as links", () => {
  const events = [
    { seq: 1, type: "item/completed", data: { item: { type: "fileChange", status: "completed", changes: [{ kind: "add", path: "/old.md" }, { kind: "delete", path: "/deleted.md" }] } } },
    { seq: 2, type: "item/completed", data: { item: { type: "fileChange", status: "failed", changes: [{ kind: "add", path: "/failed.md" }] } } },
    { seq: 3, type: "item/completed", data: { item: { type: "commandExecution", command: "echo '[x](/command.md)'" } } },
    { seq: 4, type: "item/completed", data: { item: { type: "agentMessage", text: '[new](</a file.md:20>) [same](/old.md) [web](https://example.com/a.md) `code [x](/code.md)`\n\n```\n[x](/fence.md)\n```\n' } } },
  ];
  expect(recentPaths(events as never)).toEqual(["/a file.md", "/old.md"]);
});
