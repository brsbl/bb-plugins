import { describe, expect, it } from "vitest";
import { htmlToText, localDay, parseFrom, toMail } from "./mail";

describe("mail", () => {
  it("reads From headers", () => {
    expect(parseFrom('"Ana B" <Ana@Corp.test>')).toEqual({ name: "Ana B", address: "ana@corp.test" });
    expect(parseFrom("solo@x.test")).toEqual({ name: "solo@x.test", address: "solo@x.test" });
  });

  it("turns HTML into text", () => {
    expect(htmlToText("<style>p{}</style><p>Hi&nbsp;there &amp; &#x41;</p><br>bye").replace(/\s+/g, " ").trim()).toBe("Hi there & A bye");
  });

  it("prefers the text/plain part and lists attachments by name", () => {
    const data = (text: string) => Buffer.from(text).toString("base64url");
    const mail = toMail({
      id: "m1",
      threadId: "t1",
      internalDate: "1000",
      payload: {
        headers: [{ name: "From", value: "A <a@x.test>" }, { name: "Subject", value: "Hello" }],
        parts: [
          { mimeType: "text/html", body: { data: data("<b>html</b>") } },
          { mimeType: "text/plain", body: { data: data("plain text") } },
          { mimeType: "application/pdf", filename: "deck.pdf", body: { attachmentId: "x" } },
        ],
      },
    }, "me@x.test", 5);
    expect(mail).toMatchObject({ text: "plain", cut: 5, attachments: ["deck.pdf"], messageId: "me@x.test/m1", subject: "Hello" });
  });

  it("names local days", () => {
    expect(localDay(Date.parse("2026-11-02T13:05:00-08:00"), "America/Los_Angeles")).toEqual({ key: "2026-Nov-2", label: "Mon Nov 2", weekday: "Mon", minutes: 13 * 60 + 5 });
  });
});
