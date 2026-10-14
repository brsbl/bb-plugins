import { useEffect, useState } from "react";
import { Panel, PanelGroup } from "react-resizable-panels";
import { Button } from "@bb/shared-ui/button";
import { useIsCompactViewport } from "@bb/shared-ui/hooks/use-compact-viewport";
import { Icon } from "@bb/shared-ui/icon";
import { SidebarProvider } from "@/components/ui/sidebar";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { ConversationMessageContent } from "@/components/thread/timeline/ConversationMessageContent";
import { ThreadSecondaryPanel } from "@/components/secondary-panel/ThreadSecondaryPanel";
import { createPluginPanelFixedPanelTab } from "@/lib/fixed-panel-tabs-state";
import { DecisionCard, DecisionHeader, ContextBlock, OptionList, NoteField, DecisionGroup, DecisionRow } from "@inline-decisions/ui/components";
import "./inline-decisions-log-prototype.css";

export default { title: "plugins/Inline Decisions/Log first" };

type Decision = { id: string; question: string; age: string; state: "Waiting" | "Answered" | "Failed"; outcome?: string; note?: string; options: { id: string; label: string; hint?: string }[]; context: string; org: string; thread: string };
const release: Decision = {
  id: "release", question: "Merge the calendar update?", age: "2 days", state: "Waiting", org: "Ops Tools", thread: "Calendar improvements",
  options: [{ id: "yes", label: "Merge", hint: "Release the clearer calendar layout." }, { id: "no", label: "Keep open", hint: "Leave the current version installed." }],
  context: "**What this is:** Content Calendar’s update to make today’s schedule easier to scan.\n\n**Why now:** you asked for clearer day headings. The change is ready for review.\n\n**Recommendation:** merge. The revised layout keeps scheduled items together and makes the next item easier to find.\n\n**Next:** Merge → I release it and check the installed version. Keep open → I leave the draft open for your feedback.",
};
const initial: Decision[] = [release,
  { ...release, id: "retry", question: "Publish the calendar update?", age: "1 day", state: "Failed", outcome: "Build unavailable · nothing published", options: [{ id: "retry", label: "Retry publish" }], context: "**What this is:** publishing the approved Content Calendar build.\n\n**Why now:** the release job stopped before publishing. No installed version changed.\n\n**Next:** Retry publish → I rerun the same release and report its result." },
  { ...release, id: "schedule", question: "Keep daily briefs?", age: "3 hours", state: "Answered", outcome: "Kept the daily schedule", context: "**What this is:** the frequency of the calendar’s daily summary.\n\nYou chose to keep one brief each morning." },
  { ...release, id: "preview", question: "Use the shorter welcome email?", age: "5 hours", org: "Growth", thread: "Welcome email", options: [{ id: "yes", label: "Use this draft" }, { id: "no", label: "Revise it" }], context: "**What this is:** Project Atlas’ welcome email.\n\n**Why now:** the first draft is ready for your voice check.\n\n**Recommendation:** use the shorter draft; it gives the reader one clear next step.\n\n**Next:** I save your chosen draft for review. This does not send an email." },
];
const sheet: Decision[] = [
  { ...release, id: "sheet-time", question: "When should the daily brief arrive?", age: "3 days", thread: "Daily brief setup", options: [{id:"morning",label:"8 am",hint:"Ready before the workday."},{id:"evening",label:"5 pm",hint:"A recap at the end of the day."}], context: "**What this is:** the delivery time for Content Calendar’s daily brief. **Why now:** the schedule needs a time. **Recommendation:** 8 am, so it can guide the day. **Next:** I use your selected time for future briefs." },
  { ...release, id: "sheet-weekend", question: "Include weekends?", age: "3 days", thread: "Daily brief setup", options: [{id:"yes",label:"Every day"},{id:"no",label:"Weekdays only",hint:"Pause on Saturday and Sunday."}], context: "**What this is:** which days receive a calendar brief. **Why now:** this completes the recurring schedule. **Recommendation:** weekdays only, for fewer interruptions. **Next:** I apply that cadence to future briefs." },
  { ...release, id: "sheet-empty", question: "Send a brief when nothing is scheduled?", age: "3 days", thread: "Daily brief setup", options: [{id:"yes",label:"Send an empty-day summary"},{id:"no",label:"Skip empty days"}], context: "**What this is:** how Content Calendar handles an empty day. **Why now:** the schedule needs a default. **Recommendation:** skip empty days. **Next:** I only send a brief when there is something to see." },
];

function Gavel() { return <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M14 2L7 9M21 9L14 16M8.5 8L15 14.5M19.5 10L13 3.5M11.5 11.5L2 21M22 22H11"/><path d="M20 21.5C20 20.5681 20 20.1022 19.8478 19.7346C19.6448 19.2446 19.2554 18.8552 18.7654 18.6522C18.3978 18.5 17.9319 18.5 17 18.5H16C15.0681 18.5 14.6022 18.5 14.2346 18.6522C13.7446 18.8552 13.3552 19.2446 13.1522 19.7346C13 20.1022 13 20.5681 13 21.5"/></svg>; }
function Status({ state }: {state: Decision["state"]}) { return <span className="idl-status" data-state={state}><Icon name={state === "Answered" ? "Check" : state === "Failed" ? "AlertCircle" : "Circle"} className="size-3.5" />{state}</span>; }
function InlineRow({ item, onOpen }: {item: Decision; onOpen: () => void}) {
  return <button type="button" className="idl-inline" onClick={onOpen} title={`Open ${item.question} in Decision log`}>
    <Status state={item.state}/><span className="idl-inline-question">{item.question}{item.outcome && <span className="idl-inline-outcome"> · {item.outcome}</span>}</span><span className="idl-open">Open<Icon name="PanelRight" className="size-3.5"/></span>
  </button>;
}
function Brief({ item }: {item:Decision}) { return <ContextBlock><MarkdownPreview content={item.context}/></ContextBlock>; }
function DecisionForm({ item, onAnswer }: {item:Decision; onAnswer:(id:string,answer:string,note?:string)=>void}) {
  const [choice,setChoice]=useState<string|null>(null); const [note,setNote]=useState(""); const [comment,setComment]=useState("");
  return <DecisionCard label={item.question} onSubmit={()=>{ if(choice) onAnswer(item.id, item.options.find(x=>x.id===choice)!.label,note); else if(note.trim()){ setComment(note);setNote(""); } }}>
    <DecisionHeader question={item.question}/>
    <Brief item={item}/>
    {item.state === "Answered" ? <div><div className="idl-result"><Icon name="Check" className="size-4"/>{item.outcome}</div>{item.note&&<p className="idl-comment">Your note: {item.note}</p>}</div> : <>
      {item.state === "Failed" && <p className="idl-error" role="status">{item.outcome}</p>}
      <OptionList name={item.id} label={item.question} options={item.options} value={choice} onChange={setChoice}/>
      {comment && <p className="idl-comment">You asked: {comment}</p>}
      <div className="idl-submit"><NoteField value={note} onChange={setNote}/><Button type="submit" size="sm" disabled={!choice&&!note.trim()}>Submit</Button></div>
    </>}
  </DecisionCard>;
}
function DecisionList({ items, selected, onSelect, onAnswer }: {items:Decision[];selected:string|null;onSelect:(id:string)=>void;onAnswer:(id:string,answer:string,note?:string)=>void}) {
  const [tab,setTab]=useState("Waiting"); useEffect(()=>{if(items.find(i=>i.id===selected)?.state==="Answered")setTab("All");},[selected,items]); const waiting=items.filter(i=>i.state!=="Answered"); const shown=tab==="Waiting"?waiting:items;
  return <div className="idl-log">
    <header className="idl-log-head"><h1>Decision log</h1><span className="idl-order">Oldest first</span></header>
    <div className="idl-tabs"><Button variant={tab==="Waiting"?"secondary":"ghost"} size="sm" onClick={()=>setTab("Waiting")}>Waiting <span>{waiting.length}</span></Button><Button variant={tab==="All"?"secondary":"ghost"} size="sm" onClick={()=>setTab("All")}>All</Button></div>
    {[...new Set(shown.map(i=>i.org))].map(org=><section className="idl-org" key={org}><h2>{org}<span>{shown.filter(i=>i.org===org&&i.state!=="Answered").length} waiting</span></h2>
      {[...new Set(shown.filter(i=>i.org===org).map(i=>i.thread))].map(thread=><section className="idl-thread" key={thread}><h3><Icon name="MessageSquare" className="size-3.5"/>{thread}</h3>
        {shown.filter(i=>i.org===org&&i.thread===thread).map(item=><div className="idl-entry" key={item.id}>
          <button type="button" className="idl-log-row" aria-expanded={selected===item.id} onClick={()=>onSelect(selected===item.id?"":item.id)}><Icon name={selected===item.id?"ChevronDown":"ChevronRight"} className="size-3.5"/><span className="idl-log-question">{item.question}</span><span className="idl-age">{item.age}</span>{item.state==="Failed"&&<Icon name="AlertCircle" className="size-3.5 text-destructive"/>}</button>
          {selected===item.id && <DecisionForm key={item.id} item={item} onAnswer={onAnswer}/>}
        </div>)}
      </section>)}
    </section>)}
  </div>;
}
function Message({text,id}:{text:string;id:string}) {return <ConversationMessageContent role="assistant" id={id} threadId="thr_log_prototype" turnId="turn_log_prototype" text={text} attachments={null} showActions={false} mobileActionDisplay="inline" streaming={false} timestamp={0}/>;}
const panelTab=createPluginPanelFixedPanelTab({pluginId:"inline-action-cards",actionId:"log",paramsJson:null,title:"Decision log"});
function ThreadMock() {
  const compact=useIsCompactViewport();
  const [items,setItems]=useState(initial);const [selected,setSelected]=useState<string|null>("release");const [open,setOpen]=useState(true);
  const answer=(id:string,label:string,note?:string)=>setItems(current=>current.map(i=>i.id===id?{...i,state:"Answered",outcome:`${label} approved`,note}:i));
  const openItem=(id:string)=>{setSelected(id);setOpen(true);};
  return <SidebarProvider><div className="idl-workspace"><header className="idl-top"><span>Ops Tools</span><Icon name="ChevronRight" className="size-3.5"/><strong>Calendar improvements</strong><Button variant="ghost" size="sm" onClick={()=>setOpen(!open)}><Gavel/>Decision log</Button></header><PanelGroup direction="horizontal">
    {(!compact||!open)&&<Panel defaultSize={57} minSize={30}><div className="idl-conversation"><div className="idl-user">The calendar update looks ready. Bring me the remaining decisions.</div><Message id="intro" text="The layout is ready for your review. Open a decision to see the brief and answer in the log."/>
      <InlineRow item={items[0]} onOpen={()=>openItem("release")}/>
      <div className="idl-message-gap"><Message id="done" text="The daily brief is staying on its current schedule."/><InlineRow item={items[2]} onOpen={()=>openItem("schedule")}/></div>
      <div className="idl-message-gap"><Message id="failed" text="Publishing stopped before making any changes. The failed attempt is available to review."/><InlineRow item={items[1]} onOpen={()=>openItem("retry")}/></div>
      <div className="idl-thread-foot">All answers and follow-ups stay with their decision.</div>
    </div></Panel>}
    {open&&<ThreadSecondaryPanel activeTab={panelTab} canUseGitUi={false} metadataContent={null} fixedTabs={[]} tabs={[{tab:panelTab,label:"Decision log",leadingVisual:<Gavel/>,statusLabel:null,onSelect:()=>setOpen(true),onClose:()=>setOpen(false),contentFillsRegion:true,renderContent:()=> <DecisionList items={items} selected={selected} onSelect={setSelected} onAnswer={answer}/> }]} onTabReorder={()=>{}} isOpen onPanelFocus={()=>{}} onCollapse={()=>setOpen(false)} onClose={()=>setOpen(false)} onOpenNewTab={()=>{}} isConversationCollapsed={false} onToggleConversationCollapse={()=>{}} renderAsDrawer={compact} inlinePanelToggle="hidden" showConversationCollapseControl={false} showNewTabButton={false}/>}
  </PanelGroup></div></SidebarProvider>;
}
function SheetForm({onUpdate}:{onUpdate:(count:number)=>void}) {
 const [choices,setChoices]=useState<Record<string,string>>({}); const [notes,setNotes]=useState<Record<string,string>>({}); const [submitted,setSubmitted]=useState<Record<string,string>>({}); const done=Object.keys(submitted).length===sheet.length;
 return <DecisionGroup title="Daily brief setup" progress={`${Object.keys(submitted).length} of 3 answered`} onSubmit={()=>{onUpdate(Object.keys({...submitted,...choices}).length);setSubmitted(s=>({...s,...choices}));setChoices({});}} footer={done?<div className="idl-result"><Icon name="Check" className="size-4"/>Answers saved · schedule ready to apply</div>:<Button type="submit" size="sm" disabled={Object.keys(choices).length===0}>Submit {Object.keys(choices).length||""} {Object.keys(choices).length===1?"answer":"answers"}</Button>}>
   {sheet.map(item=><DecisionRow label={item.question} key={item.id}><DecisionHeader question={item.question}/><Brief item={item}/>{submitted[item.id]?<div className="idl-result"><Icon name="Check" className="size-3.5"/>{item.options.find(o=>o.id===submitted[item.id])?.label}</div>:<><OptionList name={item.id} label={item.question} options={item.options} value={choices[item.id]??null} onChange={value=>setChoices(c=>({...c,[item.id]:value}))}/><NoteField value={notes[item.id]??""} onChange={value=>setNotes(n=>({...n,[item.id]:value}))}/></>}</DecisionRow>)}
 </DecisionGroup>;
}
function LogPage({showSheet=false}:{showSheet?:boolean}) {
 const [answeredCount,setAnsweredCount]=useState(0);
 const [items,setItems]=useState(initial);const [selected,setSelected]=useState<string|null>("release");
 return <div className="idl-page-shell"><aside className="idl-nav"><div className="idl-brand">bb</div><button className="idl-nav-selected"><Gavel/>Decision log</button><p>Threads</p><div>Ops Tools</div><div>Growth</div><div>Business</div></aside><main className="idl-page">
   {showSheet?<div className="idl-log"><header className="idl-log-head"><h1>Decision log</h1><span className="idl-order">Oldest first</span></header><div className="idl-tabs"><Button variant="secondary" size="sm">Waiting {3-answeredCount}</Button></div><section className="idl-org"><h2>Ops Tools<span>{3-answeredCount} waiting</span></h2><div className="idl-thread"><h3><Icon name="MessageSquare" className="size-3.5"/>Calendar improvements<span className="idl-age">3 days</span></h3><SheetForm onUpdate={setAnsweredCount}/></div></section></div>:<DecisionList items={items} selected={selected} onSelect={setSelected} onAnswer={(id,label,note)=>setItems(current=>current.map(i=>i.id===id?{...i,state:"Answered",outcome:`${label} approved`,note}:i))}/>}
 </main></div>;
}
export function ThreadAndPanel(){return <ThreadMock/>;}
export function SidebarLog(){return <LogPage/>;}
export function DecisionSheet(){return <LogPage showSheet/>;}
