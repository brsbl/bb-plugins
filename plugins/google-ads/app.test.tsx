// @vitest-environment jsdom
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import { fireEvent } from "@testing-library/react";
import { expect, it } from "vitest";
it("keeps the OAuth callback out of the transcript and clears it after connecting", async () => {
  const app = await loadPluginApp(() => import("./app.js"));
  const initial = { configured: true, connected: false, customerSelected: true, downloadsSelected: false, readOnly: true };
  const slot = renderSlot(app.navPanels[0]!, { subPath: "" }, { rpc: {
    status: () => initial, connectStart: () => ({ authUrl: "https://example.com/fake-consent" }),
    connectFinish: () => ({ ...initial, connected: true }),
  } });
  fireEvent.click(await slot.findByRole("button", { name: "Connect Google Ads" }));
  const field = await slot.findByLabelText("Address from Google");
  expect(field.getAttribute("type")).toBe("password");
  fireEvent.change(field, { target: { value: "http://127.0.0.1:53683/?code=fake" } });
  fireEvent.click(await slot.findByRole("button", { name: "Finish connecting" }));
  await slot.findByText("Google is connected");
  expect(slot.queryByLabelText("Address from Google")).toBeNull();
  slot.lifecycle.unmount();
});
