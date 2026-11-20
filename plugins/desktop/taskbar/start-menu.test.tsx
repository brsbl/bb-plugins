// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import type { Launcher } from "../programs/launchers";
import { AppsFlyout } from "./start-menu";

function launcher(id: string, label: string, detail = ""): Launcher {
  return { id, label, detail, art: () => null, quickSize: 20, run: vi.fn() };
}

function Harness({ apps }: { apps: Launcher[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onPointerEnter={() => setOpen(false)}>Desktop</button>
      <AppsFlyout
        open={open}
        setOpen={setOpen}
        create={launcher("new-app", "New app", "Have an agent build one")}
        apps={apps}
        itemProps={(item) => ({ type: "button", onClick: item.run })}
      />
    </>
  );
}

const list = () => document.querySelector<HTMLElement>(".bbd-start-flyout");
afterEach(() => { cleanup(); document.body.innerHTML = ""; });

it("shows New app itself, tinted, until there is an app", () => {
  render(<Harness apps={[]} />);
  const row = screen.getByRole("button", { name: /New app/ });
  expect(row.classList.contains("bbd-start-item-new")).toBe(true);
  expect(document.querySelector(".bbd-start-all")).toBeNull();
});

it("lists New app first, then apps A–Z with their descriptions as tooltips", () => {
  render(<Harness apps={[launcher("app:b", "zen timer"), launcher("app:a", "Snake", "Eat the dots"), launcher("app:c", "app 10"), launcher("app:d", "app 9")]} />);
  fireEvent.pointerEnter(document.querySelector(".bbd-start-all")!);
  const labels = [...list()!.querySelectorAll("button")].map((button) => button.textContent);
  expect(labels).toEqual(["New app", "app 9", "app 10", "Snake", "zen timer"]);
  expect(screen.getByRole("button", { name: "Snake" }).getAttribute("title")).toBe("Eat the dots");
});

it("opens from the keyboard, returns to its row, and closes when another row is pointed at", async () => {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0));
  render(<Harness apps={[launcher("app:a", "Snake")]} />);
  const row = document.querySelector<HTMLButtonElement>(".bbd-start-all")!;
  await act(async () => {
    fireEvent.keyDown(row, { key: "ArrowRight" });
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(list()).not.toBeNull();
  expect(document.activeElement?.textContent).toBe("New app");
  fireEvent.keyDown(list()!, { key: "ArrowLeft" });
  expect(list()).toBeNull();
  expect(document.activeElement).toBe(row);
  fireEvent.click(row);
  expect(list()).not.toBeNull();
  fireEvent.pointerEnter(screen.getByRole("button", { name: "Desktop" }));
  expect(list()).toBeNull();
  vi.unstubAllGlobals();
});
