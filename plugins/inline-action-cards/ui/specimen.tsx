// Design-system specimen: every Action Cards component and state, rendered with example data.
import { useState, type ReactNode } from "react";
import { Markdown } from "@get-bb/plugin-sdk/app";
import { Button, ContextBlock, DecisionCard, DecisionGroup, DecisionHeader, DecisionRow, NoteField, OptionList, Outcome, SubmitRow, type Option } from "./components.js";

const take = {
  question: "Quick take on @deanwball?",
  consequence: "Opens quote compose with take 1. Write “2” in the note, or your own take, to swap.",
  context: "**Post:** https://x.com/deanwball/status/2108574776302219364\n\nDean Ball, now at OpenAI: “Claude started being a little colder to me after I began working at OpenAI.” 47.8k views, 830 likes, 23h old and flattening.\n\n**Why now:** a light, human joke about a person's move between labs — the person-shaped take that works for you. Near the end of its 24h window.\n\n**Take 1:** `claude can tell when you've been seeing other labs`\n\n**Take 2:** `she's not mad, she's just disappointed`",
};
const takeOptions: Option[] = [{ id: "yes", label: "Open compose" }, { id: "no", label: "Skip" }];

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return <section className="ac-spec-frame"><div className="ac-spec-title">{title}</div>{children}</section>;
}

function SingleReady({ initial = null, initialNote = "" }: { initial?: string | null; initialNote?: string }) {
  const [value, setValue] = useState<string | null>(initial);
  const [note, setNote] = useState(initialNote);
  return <DecisionCard label={take.question}>
    <DecisionHeader question={take.question} consequence={take.consequence} />
    <ContextBlock><Markdown content={take.context} /></ContextBlock>
    <OptionList name={`take-${initial ?? "none"}`} label={take.question} options={takeOptions} value={value} recommended="yes" onChange={setValue} />
    <SubmitRow note={note} onNote={setNote} canSubmit={!!value || !!note.trim()} />
  </DecisionCard>;
}

const prs: { id: string; question: string; consequence: string; options: Option[]; state: "ready" | "done" | "failed" | "unsent"; answer?: string; note?: string; status?: string }[] = [
  { id: "431", question: "Merge PR #431 — Organize pull requests by project and dependency in the sidebar list?", consequence: "Squash-merge into main at the reviewed head.", options: [], state: "done", answer: "Merge", status: "Merged as 4f2c9e1" },
  { id: "432", question: "Merge PR #432 — Moss Viewer: note header with a Send to agent button?", consequence: "Squash-merge into main at the reviewed head.", options: [], state: "failed", answer: "Merge", note: "only after the 0.43 branch is cut", status: "Not merged: main is red." },
  { id: "429", question: "Close PR #429 — the stale onboarding checklist experiment?", consequence: "Closes without merging and deletes its branch.", options: [{ id: "yes", label: "Close", destructive: true }, { id: "no", label: "Keep open" }], state: "ready" },
  { id: "434", question: "Who should review PR #434?", consequence: "Requests a review and assigns the PR.", options: [{ id: "dana", label: "Dana", hint: "Owns the sidebar" }, { id: "sam", label: "Sam" }, { id: "priya", label: "Priya", hint: "Wrote the original list code" }], state: "ready" },
  { id: "436", question: "Merge PR #436 — Delegation: skills for handing work to other threads?", consequence: "Squash-merge into main at the reviewed head.", options: [], state: "unsent", answer: "Merge", status: "Not sent — it didn't reach the agent." },
];

function Group() {
  const [values, setValues] = useState<Record<string, string>>({ "429": "no", "434": "priya" });
  const [notes, setNotes] = useState<Record<string, string>>({ "429": "revisit after the release" });
  const answered = Object.keys(values).length;
  return <DecisionGroup title="Open pull requests" progress={`${answered} of 2 answered`}
    footer={<SubmitRow canSubmit={answered > 0} submitLabel={`Submit ${answered} ${answered === 1 ? "answer" : "answers"}`} />}>
    {prs.map((pr) => <DecisionRow key={pr.id}>
      {pr.state === "ready" ? <>
        <DecisionHeader question={pr.question} consequence={pr.consequence} />
        <OptionList name={`pr-${pr.id}`} label={pr.question} options={pr.options} value={values[pr.id] ?? null} recommended={pr.id === "434" ? "priya" : null} onChange={(id) => setValues({ ...values, [pr.id]: id })} />
        {values[pr.id] && <NoteField value={notes[pr.id] ?? ""} onChange={(value) => setNotes({ ...notes, [pr.id]: value })} />}
      </> : <>
        <div className="ac-question">{pr.question}</div>
        <Outcome tone={pr.state === "done" ? "done" : pr.state === "failed" ? "failed" : "unsent"} answer={pr.answer!} note={pr.note} status={pr.status!} time="9:41"
          actions={pr.state === "failed" ? <><Button type="button" size="sm" variant="outline">Choose again</Button><Button type="button" size="sm" variant="default">Retry</Button></> : pr.state === "unsent" ? <Button type="button" size="sm" variant="default">Resend</Button> : undefined} />
      </>}
    </DecisionRow>)}
  </DecisionGroup>;
}

export function Specimen() {
  return <div className="ac-spec">
    <Frame title="Single decision · ready"><SingleReady /></Frame>
    <Frame title="Single decision · answered, note open"><SingleReady initial="yes" initialNote={"2 — and tag @deanwball in the quote,\nnot in a reply."} /></Frame>
    <Frame title="Single decision · submitted">
      <DecisionCard label="Submitted"><DecisionHeader question={take.question} /><Outcome tone="sent" answer="Open compose" note="2" status="Sent, waiting for the agent" time="9:42" /></DecisionCard>
      <DecisionCard label="Failed"><DecisionHeader question={take.question} /><Outcome tone="failed" answer="Open compose" note="2" status="Compose didn't open: browser plugin is off." time="9:43"
        actions={<><Button type="button" size="sm" variant="outline">Choose again</Button><Button type="button" size="sm" variant="default">Retry</Button></>} /></DecisionCard>
    </Frame>
    <Frame title="Group of decisions · one form, one Submit"><Group /></Frame>
  </div>;
}
