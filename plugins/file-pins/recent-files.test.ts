import { Lexer } from "marked";
import { expect, it, vi } from "vitest";
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

it("lexes a hostile history within its budget, once per event, and still finds links inside emphasis", () => {
  const hostile = ["*a ", "![a](", "[a](b"].map((unit) => `${unit.repeat(20_000)} [x](/late.md)`);
  const events = Array.from({ length: 100 }, (_, seq) => ({ seq, type: "item/completed", data: { item: {
    type: "agentMessage", text: seq === 99 ? "*See* [notes](/notes.md) and **[em](/em.md)**" : hostile[seq % 3],
  } } }));
  const lex = vi.spyOn(Lexer.prototype, "lex");
  const cache = new Map<string, string[]>();
  const started = performance.now();
  expect(recentPaths(events as never, cache, "thr")).toEqual(["/notes.md", "/em.md"]);
  expect(performance.now() - started).toBeLessThan(1_000);
  const lengths = lex.mock.calls.map(([text]) => text.length);
  expect(Math.max(...lengths)).toBeLessThanOrEqual(4_000);
  expect(lengths.reduce((sum, length) => sum + length, 0)).toBeLessThanOrEqual(12_000);
  for (let call = 0; call < 40; call++) recentPaths(events as never, cache, "thr");
  expect(lex).toHaveBeenCalledTimes(100);
  lex.mockRestore();
});
