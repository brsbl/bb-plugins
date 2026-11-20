// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const composer = vi.fn((_props: Record<string, unknown>) => null);
vi.mock("@get-bb/plugin-sdk/app", () => ({ experimental_NewThreadComposer: (props: Record<string, unknown>) => composer(props) }));
const call = vi.fn(async () => ({ threadId: "thr_1" }));
const groups = new Map<string, unknown>([
  ["project:p1", { kind: "project", id: "p1", name: "Proj" }],
  ["section:s1", { kind: "section", id: "s1", name: "Sec" }],
  ["folder:f1", { kind: "folder", id: "f1", name: "Fol", folder: { id: "f1" } }],
]);
vi.mock("../../shell/data", () => ({ useDesktop: () => ({ call, groupByKey: groups }) }));
const manager = { open: vi.fn(), close: vi.fn() };
vi.mock("../../windows", () => ({
  useWindowManager: () => manager,
  WindowFrame: ({ title, children }: { title: string; children: unknown }) => <section aria-label={title}>{children as never}</section>,
}));

const { NEW_APP_PROMPT, NewAppWindow, NewThreadWindow } = await import("./new-thread");
const window = { id: "w1" } as never;
const lastProps = () => composer.mock.calls.at(-1)![0];
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("keeps New thread's draft key and passes each group's project, section or folder", async () => {
  render(<NewThreadWindow window={window} groupKey={null} />);
  expect(lastProps()).toMatchObject({ draftKey: "desktop:new-thread:desktop" });
  expect(lastProps()).not.toHaveProperty("initialPrompt");

  render(<NewThreadWindow window={window} groupKey="project:p1" />);
  expect(lastProps()).toMatchObject({ draftKey: "desktop:new-thread:project:p1", defaultProjectId: "p1" });

  render(<NewThreadWindow window={window} groupKey="section:s1" />);
  await (lastProps().onSubmit as (request: object) => Promise<void>)({ prompt: "hi" });
  expect(call).toHaveBeenLastCalledWith("spawnThread", { request: { prompt: "hi", sectionId: "s1" } });

  render(<NewThreadWindow window={window} groupKey="folder:f1" />);
  await (lastProps().onSubmit as (request: object) => Promise<void>)({ prompt: "hi" });
  expect(call).toHaveBeenLastCalledWith("spawnThread", { request: { prompt: "hi" }, folderId: "f1" });
  expect(manager.open).toHaveBeenLastCalledWith({ kind: "thread", threadId: "thr_1" });
});

it("starts New app with its own draft and the prompt pre-filled", async () => {
  render(<NewAppWindow window={window} />);
  expect(lastProps()).toMatchObject({ draftKey: "desktop:new-app", initialPrompt: NEW_APP_PROMPT });
  await (lastProps().onSubmit as (request: object) => Promise<void>)({ prompt: "x" });
  expect(call).toHaveBeenLastCalledWith("spawnThread", { request: { prompt: "x" } });
});
