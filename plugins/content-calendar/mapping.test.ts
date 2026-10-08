import { describe, expect, it } from "vitest";
import { clockTime } from "./model.js";
import {
  BLOCK_HEADER, TRAY_RULE, buildEvent, changedUnits, htmlToText, looksLikeEditorHtml, oversizedProperty, parseEvent, privateProps, renderBlock, spliceBlock,
  splitDescription,
  type EventDateTime, type Fields, type GoogleEvent,
} from "./mapping.js";

const MONDAY = "2026-10-05";
const noTitles = () => null;

function fields(overrides: Partial<Fields> = {}): Fields {
  return {
    title: "Orchestration blog post", format: "blog", status: "ready", date: "2026-10-28", time: null, minutes: null, days: 1,
    tray: null, rrule: null, anchor: null, target: "Downloads baseline", notes: "Publish the day before the orchestration tweet.",
    gates: [{ id: "g1", kind: "pr", repo: "get-bb/bb", number: 4772, cleared: false }],
    attachments: [{ id: "a1", kind: "file", machineId: "mac", path: "/Users/brsbl/Moss/Notes/Draft/Draft.md", name: "Draft.md" }],
    pos: 1,
    ...overrides,
  };
}

/** The event Google returns for a bb write (nulls cleared, as PATCH does). */
function asEvent(id: string, ccId: string, item: Fields): { event: GoogleEvent; block: string } {
  const { body, block } = buildEvent(ccId, item, MONDAY, noTitles);
  const props = Object.fromEntries(Object.entries(body.extendedProperties.private).filter((entry): entry is [string, string] => entry[1] !== null));
  const clean = (when: EventDateTime) => Object.fromEntries(Object.entries(when).filter(([, value]) => value !== null)) as EventDateTime;
  const event: GoogleEvent = {
    id, etag: "\"1\"", summary: body.summary, description: body.description, start: clean(body.start), end: clean(body.end),
    extendedProperties: { private: props },
  };
  if (body.colorId) event.colorId = body.colorId;
  if (body.recurrence.length) event.recurrence = body.recurrence;
  return { event, block };
}

describe("buildEvent", () => {
  it("writes the checkbox prefix, format color, all-day dates, and every property slot", () => {
    const { body, block } = buildEvent("cc_7k2m9q", fields(), MONDAY, noTitles);
    expect(body.summary).toBe("☐ Orchestration blog post");
    expect(body.colorId).toBe("10");
    expect(body.start).toEqual({ date: "2026-10-28", dateTime: null, timeZone: null });
    expect(body.end.date).toBe("2026-10-29");
    expect(body.recurrence).toEqual([]);
    expect(body.extendedProperties.private).toMatchObject({ ccId: "cc_7k2m9q", status: "ready", format: "blog", tray: null, target: "Downloads baseline", pos: "1", gate2: null, att2: null });
    expect(JSON.parse(body.extendedProperties.private.gate1!)).toEqual({ id: "g1", kind: "pr", repo: "get-bb/bb", number: 4772, cleared: false });
    expect(body.description).toBe(`Publish the day before the orchestration tweet.\n\n${block}`);
    expect(block).toBe([
      BLOCK_HEADER,
      "bb blog post · Ready · Target: Downloads baseline",
      "Waits on: get-bb/bb #4772 (not cleared) https://github.com/get-bb/bb/pull/4772",
      "Attached: Draft.md (on Mac)",
    ].join("\n"));
  });

  it("writes ☑ for posted items and clears the color without a format", () => {
    const { body } = buildEvent("cc_7k2m9q", fields({ status: "posted", format: null }), MONDAY, noTitles);
    expect(body.summary).toBe("☑ Orchestration blog post");
    expect(body.colorId).toBeNull();
  });

  it("writes a tray item as one all-day series repeating every Monday from this week", () => {
    const { body } = buildEvent("cc_7k2m9q", fields({ date: null, tray: "evergreen" }), MONDAY, noTitles);
    expect(body.recurrence).toEqual([TRAY_RULE]);
    expect(body.start.date).toBe(MONDAY);
    expect(body.end.date).toBe("2026-10-06");
  });

  it("keeps a time of day and its length", () => {
    const { body } = buildEvent("cc_7k2m9q", fields({ time: "09:30", minutes: 90 }), MONDAY, noTitles);
    expect(body.start).toEqual({ date: null, dateTime: "2026-10-28T09:30:00", timeZone: "America/Los_Angeles" });
    expect(body.end.dateTime).toBe("2026-10-28T11:00:00");
  });
});

describe("parseEvent", () => {
  it("round-trips everything bb writes", () => {
    const item = fields({ days: 3 });
    const { event, block } = asEvent("ev1", "cc_7k2m9q", item);
    const parsed = parseEvent(event, [block]);
    expect(parsed.ccId).toBe("cc_7k2m9q");
    expect(parsed.blockFound).toBe(true);
    expect(changedUnits(item, parsed.fields)).toEqual([]);
  });

  it("follows the checkbox typed in the title", () => {
    const { event } = asEvent("ev1", "cc_7k2m9q", fields());
    expect(parseEvent({ ...event, summary: "☑ Orchestration blog post" }, []).fields.status).toBe("posted");
    expect(parseEvent({ ...event, summary: "Orchestration blog post" }, []).fields).toMatchObject({ status: "ready", title: "Orchestration blog post" });
    const posted = asEvent("ev1", "cc_7k2m9q", fields({ status: "posted" })).event;
    expect(parseEvent({ ...posted, summary: "☐ Orchestration blog post" }, []).fields.status).toBe("ready");
  });

  it("changes the format when she picks a format color, and ignores other colors", () => {
    const { event } = asEvent("ev1", "cc_7k2m9q", fields());
    expect(parseEvent({ ...event, colorId: "6" }, []).fields.format).toBe("essay");
    expect(parseEvent({ ...event, colorId: "11" }, []).fields.format).toBe("blog");
  });

  it("reads a timed event in the calendar's zone", () => {
    const parsed = parseEvent({ id: "ev1", summary: "Talk", start: { dateTime: "2026-10-28T16:30:00Z" }, end: { dateTime: "2026-10-28T17:15:00Z" } }, []);
    expect(parsed.fields).toMatchObject({ date: "2026-10-28", time: "09:30", minutes: 45, days: 1, status: "idea", format: null });
    expect(parsed.ccId).toBeNull();
    expect(parsed.prefixed).toBe(false);
  });

  it("reads a bb tray series once, with no date", () => {
    const { event, block } = asEvent("ev1", "cc_7k2m9q", fields({ date: null, tray: "later" }));
    const parsed = parseEvent(event, [block]);
    expect(parsed.fields).toMatchObject({ tray: "later", date: null, rrule: null });
    expect(parsed.start).toBe(MONDAY);
  });

  it("puts a dated event she made repeat in Later and keeps her rule", () => {
    const { event, block } = asEvent("ev1", "cc_7k2m9q", fields());
    const parsed = parseEvent({ ...event, recurrence: ["RRULE:FREQ=DAILY;COUNT=3"] }, [block]);
    expect(parsed.fields).toMatchObject({ tray: "later", date: null, rrule: ["RRULE:FREQ=DAILY;COUNT=3"], anchor: "2026-10-28" });
    const rewritten = buildEvent("cc_7k2m9q", parsed.fields, MONDAY, noTitles).body;
    expect(rewritten.recurrence).toEqual(["RRULE:FREQ=DAILY;COUNT=3"]);
    expect(rewritten.start.date).toBe("2026-10-28");
  });

  it("drops gate and attachment records that don't validate", () => {
    const { event } = asEvent("ev1", "cc_7k2m9q", fields());
    const props = { ...event.extendedProperties!.private!, gate2: "{not json", att2: JSON.stringify({ id: "a2", kind: "url", url: "javascript:alert(1)" }) };
    const parsed = parseEvent({ ...event, extendedProperties: { private: props } }, []);
    expect(parsed.fields.gates).toHaveLength(1);
    expect(parsed.fields.attachments).toHaveLength(1);
  });
});

describe("splitDescription", () => {
  const block = renderBlock(fields(), noTitles);

  it("keeps text she adds inside or after the block as notes", () => {
    const lines = block.split("\n");
    const description = ["My notes", "", lines[0], "Inside the block", ...lines.slice(1), "After the block"].join("\n");
    expect(splitDescription(description, [block])).toMatchObject({ notes: "My notes\n\nInside the block\nAfter the block", found: true, block });
  });

  it("keeps her edit of a block line as notes", () => {
    const description = `Notes\n\n${block.replace("Ready", "Ready (she typed this)")}`;
    expect(splitDescription(description, [block]).notes).toBe("Notes\n\nbb blog post · Ready (she typed this) · Target: Downloads baseline");
  });

  it("treats the whole description as notes when the block is missing", () => {
    expect(splitDescription("Only her text", [block])).toEqual({ notes: "Only her text", found: false, block: null });
  });

  it("compares text, not the HTML Google's editor saves", () => {
    const html = `<p>My <b>notes</b> &amp; plans</p>${block.split("\n").map((line) => line.replace(/ {2,}/g, (spaces) => "&nbsp;".repeat(spaces.length))).join("<br>")}`;
    expect(splitDescription(html, [block])).toMatchObject({ notes: "My notes & plans", found: true });
    expect(htmlToText("a<br/>b")).toBe("a\nb");
  });

  it("keeps out-of-range character references literal instead of throwing", () => {
    expect(htmlToText("x &#99999999; &#x110000; &#0; &#65;")).toBe("x &#99999999; &#x110000; &#0; A");
  });
});

describe("tag-like text bb wrote", () => {
  it("is never read as HTML, in notes or in the block", () => {
    const item = fields({
      notes: "Use <br> tags\nand </div> too",
      gates: [{ id: "g1", kind: "text", text: "fix </div> bug", cleared: false }],
    });
    const { body, block } = buildEvent("cc_7k2m9q", item, MONDAY, noTitles);
    expect(looksLikeEditorHtml(body.description!)).toBe(false);
    expect(splitDescription(body.description!, [block])).toMatchObject({ notes: "Use <br> tags\nand </div> too", found: true });
  });
});

describe("description writes", () => {
  const item = fields();
  const block = renderBlock(item, noTitles);
  const changed = fields({ target: "Signups" });
  const newBlock = renderBlock(changed, noTitles);

  it("leaves the description out when neither her notes nor the block changed", () => {
    const { body } = buildEvent("cc_7k2m9q", item, MONDAY, noTitles, { raw: "<p>Her <a href=\"https://x.test/a\">link</a></p>", block, notesDirty: false }, false);
    expect(body.description).toBeUndefined();
    expect("description" in body).toBe(false);
  });

  it("splices a changed block into her HTML, keeping her markup byte-for-byte", () => {
    const prefix = "<p>Read <a href=\"https://x.test/a\">this</a> &amp; <b>that</b></p>";
    const raw = `${prefix}${block.split("\n").join("<br>")}`;
    const { body } = buildEvent("cc_7k2m9q", changed, MONDAY, noTitles, { raw, block, notesDirty: false }, false);
    expect(body.description!.startsWith(prefix)).toBe(true);
    expect(body.description).toContain("Target: Signups");
    expect(body.description!.split(BLOCK_HEADER)).toHaveLength(2);
    expect(splitDescription(body.description!, [newBlock])).toMatchObject({ notes: "Read this & that", found: true });
  });

  it("appends after her HTML when the old block can't be found", () => {
    const raw = "<p>Only <i>her</i> text</p>";
    const spliced = spliceBlock(raw, block, newBlock);
    expect(spliced.startsWith(raw)).toBe(true);
    expect(htmlToText(spliced)).toContain("Target: Signups");
  });

  it("moves her plain-text lines inside the old block above the new one", () => {
    const raw = `Notes\n\n${block.replace(BLOCK_HEADER, `${BLOCK_HEADER}\nHer line`)}\nAfter`;
    expect(spliceBlock(raw, block, newBlock)).toBe(`Notes\n\nHer line\nAfter\n\n${newBlock}`);
  });

  it("writes bb's notes when her notes changed in bb", () => {
    const { body } = buildEvent("cc_7k2m9q", changed, MONDAY, noTitles, { raw: "<p>old</p>", block, notesDirty: true }, false);
    expect(body.description).toBe(`${changed.notes}\n\n${newBlock}`);
  });
});

describe("clockTime", () => {
  it("accepts only real times of day", () => {
    expect(["00:00", "09:30", "23:59"].map((value) => clockTime.safeParse(value).success)).toEqual([true, true, true]);
    expect(["24:00", "25:00", "12:60", "9:30"].map((value) => clockTime.safeParse(value).success)).toEqual([false, false, false, false]);
  });
});

describe("private property limits", () => {
  it("finds a record over Google's 1,024-character limit", () => {
    const url = `https://example.com/${"a".repeat(870)}`;
    expect(oversizedProperty("cc_7k2m9q", fields())).toBeNull();
    expect(oversizedProperty("cc_7k2m9q", fields({ gates: [{ id: "g1", kind: "text", text: "x".repeat(200), url, cleared: false }] }))).toBe("gate1");
  });

  it("parses records leniently and writes them back as found", () => {
    const { event } = asEvent("ev1", "cc_7k2m9q", fields());
    const props = { ...event.extendedProperties!.private!, gate1: JSON.stringify({ id: "g1", kind: "pr", repo: "get-bb/bb", number: 1, cleared: true, by: "app" }), gate2: "{broken" };
    const parsed = parseEvent({ ...event, extendedProperties: { private: props } }, []);
    expect(parsed.fields.gates).toEqual([{ id: "g1", kind: "pr", repo: "get-bb/bb", number: 1, cleared: true }]);
    const written = privateProps("cc_7k2m9q", parsed.fields);
    expect(JSON.parse(written.gate1!)).toEqual({ id: "g1", kind: "pr", repo: "get-bb/bb", number: 1, cleared: true, by: "app" });
    expect(written.gate2).toBe("{broken");
    expect(written.gate3).toBeNull();
    expect(written.ccv).toBe("1");
  });
});
