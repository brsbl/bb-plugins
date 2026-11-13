import { describe, expect, it, vi } from "vitest";
import { boundOrigin, signIn, type AuditEntry, type SignInDeps, type SignInRequest } from "./signin.js";
import type { FillField, VaultReader } from "./vault.js";

const fake = {
  password: "fake-Password-3b71",
  username: "fake-user@example.test",
  otp: "481516",
};

function reader(overrides: Partial<VaultReader> = {}): VaultReader {
  return {
    vaults: async () => [
      { id: "v-agents", title: "Agents" },
      { id: "v-private", title: "Private" },
    ],
    items: async () => [
      { id: "i-taxact", title: "TaxAct", websites: ["https://www.taxact.com/login"] },
      { id: "i-intuit", title: "Intuit", websites: ["accounts.intuit.com", "https://quickbooks.intuit.com"] },
    ],
    field: async (_vault, _item, field: FillField) => fake[field],
    ...overrides,
  };
}

function setup(options: { pageUrl?: string; enabled?: boolean; open?: SignInDeps["open"]; fillCode?: string } = {}) {
  const audit: AuditEntry[] = [];
  const calls: Array<{ method: string; input: Record<string, unknown> }> = [];
  const open = vi.fn(options.open ?? (async () => reader()));
  const sleep = vi.fn(async () => {});
  const deps: SignInDeps = {
    enabled: async () => options.enabled ?? true,
    vaultName: async () => "Agents",
    token: async () => ({ ok: true, token: "ops_fake-token" }),
    open,
    browser: {
      async call(method, input) {
        calls.push({ method, input });
        if (method === "pages")
          return {
            text: JSON.stringify([
              { id: "T1", name: "main", url: options.pageUrl ?? "https://www.taxact.com/login", title: "Sign in" },
            ]),
            images: [],
            exitCode: 0,
          };
        return { code: options.fillCode ?? "ok" };
      },
    },
    audit: (entry) => audit.push(entry),
    now: () => 1_000_000,
    sleep,
  };
  return { deps, audit, calls, open, sleep };
}

const request = (field: FillField = "password", item = "TaxAct"): SignInRequest => ({
  threadId: "thr_test",
  sessionId: "8f0b7a52-6a3e-4c1f-9a51-3a9f1c2d4e5f",
  page: "main",
  selector: "#password",
  item,
  field,
});

describe("signIn", () => {
  it("fills the field bound to the page origin and records no value", async () => {
    const h = setup();
    expect(await signIn(h.deps, request())).toBe("ok");
    const fill = h.calls.find((call) => call.method === "experimental_fill");
    expect(fill?.input).toEqual({
      threadId: "thr_test",
      sessionId: request().sessionId,
      page: "main",
      selector: "#password",
      value: fake.password,
      expectedOrigin: "https://www.taxact.com",
    });
    expect(h.audit).toEqual([
      { threadId: "thr_test", item: "TaxAct", field: "password", origin: "https://www.taxact.com", result: "ok" },
    ]);
    expect(JSON.stringify(h.audit)).not.toContain(fake.password);
  });

  it("refuses while the kill switch is off without touching the vault or page", async () => {
    const h = setup({ enabled: false });
    expect(await signIn(h.deps, request())).toBe("fills_disabled");
    expect(h.open).not.toHaveBeenCalled();
    expect(h.calls).toEqual([]);
    expect(h.audit[0]?.result).toBe("fills_disabled");
  });

  it.each([
    ["http://www.taxact.com/login", "TaxAct"],
    ["https://taxact.com.phish.example/login", "TaxAct"],
    ["https://www.taxact.com/login", "Intuit"],
  ])("refuses %s for %s before reading a field", async (pageUrl, item) => {
    const field = vi.fn(async () => fake.password);
    const h = setup({ pageUrl, open: async () => reader({ field }) });
    expect(await signIn(h.deps, request("password", item))).toBe("origin_mismatch");
    expect(field).not.toHaveBeenCalled();
    expect(h.calls.map((call) => call.method)).toEqual(["pages"]);
  });

  it("reads only the configured vault", async () => {
    const items = vi.fn(async () => []);
    const h = setup({ open: async () => reader({ items }) });
    await signIn(h.deps, request());
    expect(items).toHaveBeenCalledWith("v-agents");
    expect(items).toHaveBeenCalledTimes(1);
    const none = setup({ open: async () => reader({ vaults: async () => [{ id: "v", title: "Private" }] }) });
    expect(await signIn(none.deps, request())).toBe("vault_not_found");
  });

  it("reports missing and ambiguous items and fields", async () => {
    expect(await signIn(setup().deps, request("password", "Gusto"))).toBe("item_not_found");
    const twin = setup({
      open: async () =>
        reader({
          items: async () => [
            { id: "a", title: "TaxAct", websites: ["taxact.com"] },
            { id: "b", title: "TaxAct", websites: ["taxact.com"] },
          ],
        }),
    });
    expect(await signIn(twin.deps, request())).toBe("item_ambiguous");
    const blank = setup({ open: async () => reader({ field: async () => null }) });
    expect(await signIn(blank.deps, request("otp"))).toBe("field_missing");
  });

  it("matches a scheme-less saved website and binds the page's own origin", async () => {
    const h = setup({ pageUrl: "https://accounts.intuit.com/app/sign-in" });
    expect(await signIn(h.deps, request("username", "Intuit"))).toBe("ok");
    expect(h.calls.at(-1)?.input.expectedOrigin).toBe("https://accounts.intuit.com");
    expect(h.calls.at(-1)?.input.value).toBe(fake.username);
  });

  it("waits for a fresh one-time code near the end of its period", async () => {
    const h = setup();
    h.deps.now = () => 29_000;
    const order: string[] = [];
    h.sleep.mockImplementation(async () => void order.push("sleep"));
    h.open.mockImplementation(async () =>
      reader({
        field: async () => {
          order.push("read");
          return fake.otp;
        },
      }),
    );
    expect(await signIn(h.deps, request("otp"))).toBe("ok");
    expect(h.sleep).toHaveBeenCalledWith(1_250);
    expect(order).toEqual(["sleep", "read"]);
    const early = setup();
    await signIn(early.deps, request("otp"));
    expect(early.sleep).not.toHaveBeenCalled();
  });

  it("suppresses vault and browser errors into fixed codes", async () => {
    const thrown = setup({
      open: async () => {
        throw new Error(`auth failed for ops_fake-token ${fake.password}`);
      },
    });
    expect(await signIn(thrown.deps, request())).toBe("vault_unavailable");
    const browser = setup();
    browser.deps.browser.call = async (method) => {
      if (method === "pages")
        return { text: JSON.stringify([{ name: "main", url: "https://www.taxact.com" }]), exitCode: 0 };
      throw new Error(`unknown method with ${fake.password}`);
    };
    expect(await signIn(browser.deps, request())).toBe("browser_unavailable");
    const odd = setup({ fillCode: `weird ${fake.password}` });
    expect(await signIn(odd.deps, request())).toBe("fill_failed");
    for (const h of [thrown, browser, odd]) expect(JSON.stringify(h.audit)).not.toContain(fake.password);
  });

  it("passes Browser Automation's fixed codes through", async () => {
    for (const code of ["element_not_found", "navigated", "session_unavailable", "origin_mismatch"])
      expect(await signIn(setup({ fillCode: code }).deps, request())).toBe(code);
  });
});

describe("boundOrigin", () => {
  it.each([
    ["https://www.taxact.com/a", ["taxact.com"], "https://www.taxact.com"],
    ["https://alice.github.io", ["https://bob.github.io"], null],
    ["https://quickbooks.intuit.com", ["http://intuit.com"], "https://quickbooks.intuit.com"],
    ["about:blank", ["taxact.com"], null],
  ])("%s with %j → %s", (page, websites, expected) => {
    expect(boundOrigin(page, websites)).toBe(expected);
  });
});
