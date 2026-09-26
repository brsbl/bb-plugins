import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent, type ReactNode } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Clapperboard, Maximize2, Pause, Play, Send, Square, StickyNote, Undo2, X } from "lucide-react";
import { definePluginApp, useBbNavigate, useComposer, useRealtime, useRpc, type PluginFileOpenerProps, type PluginMessageDirectiveProps, type PluginThreadPanelProps, type PluginThreadHeaderActionProps } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button.js";
import { Checkbox } from "./components/ui/checkbox.js";
import { badgeVariants } from "./components/ui/badge.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./components/ui/tooltip.js";
import { ShapeOverlay } from "./shape-overlay.js";
import { isActionable, presentationSchema, MENTION_PROVIDER, snapTime, stepTime, timecode, videoName, VIDEO_EXTENSIONS, type FrameNote, type Media, type NoteStatus, type Shape, type Still, type Version } from "./model.js";
import type { videoMarkupContract } from "./server.js";
import "./app.css";

type Rpc = ReturnType<typeof useRpc<typeof videoMarkupContract>>;
type Preview = {url: string; expiresAt: number; media: Media};
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
const statuses: NoteStatus[] = ["open", "fixed", "still wrong", "regressed"];
const statusLabels: Record<NoteStatus, string> = {open: "Open", fixed: "Fixed", "still wrong": "Still wrong", regressed: "Regressed"};
const drawHints: Record<Shape["kind"], string> = {box: "Drag on the video to draw a box.", arrow: "Drag from the numbered marker toward what needs attention.", zoom: "Drag on the video around the area to enlarge."};
const noteFilters = [{value: "actionable", label: "Needs attention"}, {value: "all", label: "All notes"}, ...statuses.map(value => ({value, label: statusLabels[value]}))];
// BB keys panel tabs by params. Keep one parameter-free tab and route the
// version separately, including when the panel mounts after the request.
const presentedVersions = new Map<string, {versionId: string; time?: number}>();
const presentationListeners = new Set<() => void>();
function subscribePresentation(listener: () => void) {
  presentationListeners.add(listener);
  return () => { presentationListeners.delete(listener); };
}
function openVersion(navigate: ReturnType<typeof useBbNavigate>, threadId: string, versionId: string, time?: number) {
  presentedVersions.set(threadId, {versionId, time});
  for (const listener of presentationListeners) listener();
  return navigate.openThreadPanel({actionId: "video-markup"});
}
function Notice({children}: {children: ReactNode}) { return <p role="status" className="video-markup-notice text-muted-foreground">{children}</p>; }
function ErrorNotice({children}: {children: ReactNode}) { return <p role="alert" className="video-markup-notice text-destructive">{children}</p>; }
function IconButton({label, children, side = "top", ...props}: {label: string; children: ReactNode; side?: "top" | "bottom" | "left"} & React.ComponentProps<typeof Button>) {
  return <TooltipProvider delayDuration={300}><Tooltip><TooltipTrigger asChild><Button type="button" variant="ghost" size="icon" aria-label={label} {...props}>{children}</Button></TooltipTrigger><TooltipContent side={side}>{label}</TooltipContent></Tooltip></TooltipProvider>;
}

// A fitted video may take this share of the window height, so tall renders stay watchable.
// The inline chat player shares the window with the composer, so it fits tighter.
const FIT_HEIGHT = .6, COMPACT_FIT_HEIGHT = .45, STILL_FIT_HEIGHT = .45;
const FIT_KEY = "video-markup:fit";
function readFit() { try { return localStorage.getItem(FIT_KEY) !== "0"; } catch { return true; } }

async function captureFrame(video: HTMLVideoElement): Promise<Still> {
  if (video.seeking || video.readyState < 2 || !video.videoWidth) throw new Error("Wait for the frame to finish loading, then try again.");
  await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
  canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not capture the frame");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  let quality = .88, dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > 350_000 && quality > .3) { quality -= .1; dataUrl = canvas.toDataURL("image/jpeg", quality); }
  if (dataUrl.length > 350_000) throw new Error("This frame is too detailed to attach. Use a 720p review copy.");
  return {dataUrl, width: canvas.width, height: canvas.height};
}

function Player({preview, version, onSave, onDirty, onMediaError, compact = false, seekRequest, noteRequest, nextNoteNumber, frameProbe}: {
  preview: Preview; version?: Version; onSave?: (fields: {timestamp: number; text: string; shapes: Shape[]; still: Still}) => Promise<void>;
  onDirty?: (value: boolean) => void; onMediaError?: () => void; compact?: boolean; seekRequest?: {time: number; shapes: Shape[]; sequence: number; noteNumber: number}; noteRequest?: number; nextNoteNumber?: number; frameProbe?: "pending" | "failed";
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0), [duration, setDuration] = useState(preview.media.duration);
  const [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [seeking, setSeeking] = useState(false);
  const [aspect, setAspect] = useState(preview.media.width && preview.media.height ? preview.media.width / preview.media.height : 16/9);
  const [draft, setDraft] = useState<{timestamp: number; still: Still} | null>(null);
  const [tool, setTool] = useState<Shape["kind"] | null>(null), [shapes, setShapes] = useState<Shape[]>([]), [drawing, setDrawing] = useState<Shape | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const gesture = useRef<Shape | null>(null);
  const root = useRef<HTMLElement>(null), stage = useRef<HTMLDivElement>(null), noteField = useRef<HTMLTextAreaElement>(null);
  const fitHeight = compact ? COMPACT_FIT_HEIGHT : FIT_HEIGHT;
  const [fit, setFit] = useState(readFit), [canFit, setCanFit] = useState(false);
  useEffect(() => {
    const element = root.current; if (!element) return;
    const measure = () => setCanFit(element.clientWidth > window.innerHeight * fitHeight * aspect + 1);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure); observer?.observe(element); window.addEventListener("resize", measure); measure();
    return () => { observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [aspect, fitHeight]);
  function toggleFit() { setFit(value => { try { localStorage.setItem(FIT_KEY, value ? "0" : "1"); } catch { /* Size preference is optional. */ } return !value; }); }
  const canStep = preview.media.frameTimes.length > 0 || preview.media.fps !== null;
  const seek = useCallback((value: number) => { if (video.current) { video.current.pause(); video.current.currentTime = value; setTime(value); } }, []);
  // Jumping to a note from the list must show the frame, even when the player is scrolled away.
  useEffect(() => { if (seekRequest && !draft) { seek(seekRequest.time); setShapes(seekRequest.shapes); root.current?.scrollIntoView?.({block: "nearest", behavior: "smooth"}); } }, [seekRequest, seek]);
  // Starting a note brings the whole frame into view once; nothing moves again while you pick a tool and draw.
  useEffect(() => { if (draft) { stage.current?.scrollIntoView?.({block: "start", behavior: "smooth"}); noteField.current?.focus({preventScroll: true}); } }, [draft]);
  useEffect(() => () => onDirty?.(false), [onDirty]);
  // The Notes section owns the Note button; each press starts a note on the paused frame.
  useEffect(() => { if (noteRequest) void beginNote(); }, [noteRequest]);
  async function togglePlay() {
    if (!video.current || draft || busy) return;
    try { if (video.current.paused) { setShapes([]); await video.current.play(); } else video.current.pause(); } catch (e) { setError(errorText(e)); }
  }
  function step(direction: -1 | 1) { if (!draft && !busy && video.current && canStep) { setShapes([]); seek(stepTime({...preview.media, duration}, video.current.currentTime, direction)); } }
  async function beginNote() {
    if (draft || !video.current) return;
    video.current.pause(); setBusy(true); setError("");
    try {
      const timestamp = video.current.currentTime;
      const still = await captureFrame(video.current);
      setDraft({timestamp, still}); setShapes([]); setTool(null); onDirty?.(true);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  function cancel() { setDraft(null); setTool(null); setShapes([]); setText(""); onDirty?.(false); }
  function point(e: PointerEvent<HTMLDivElement>) { const r = e.currentTarget.getBoundingClientRect(); return {x: Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)), y: Math.max(0, Math.min(1, (e.clientY-r.top)/r.height))}; }
  return <section ref={root} className="video-markup-player" tabIndex={0} aria-label="Video review player" onKeyDown={e => {
    if ((e.target as HTMLElement).closest("input,textarea,select,button") || draft || busy || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") { e.preventDefault(); void togglePlay(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <div ref={stage} className="video-markup-stage bg-muted" style={{aspectRatio: aspect, ...(fit ? {width: `min(100%, calc(${fitHeight * 100}vh * ${aspect}))`} : {})}}>
      <video ref={video} src={preview.url} playsInline preload="metadata" crossOrigin="anonymous" aria-label={version ? videoName(version.media.path) : "Video preview"}
        onLoadedMetadata={e => { const v=e.currentTarget; setDuration(v.duration); setAspect(v.videoWidth/v.videoHeight || 16/9); }}
        onLoadedData={() => setReady(true)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onSeeking={() => setSeeking(true)} onSeeked={() => setSeeking(false)}
        onError={() => onMediaError ? onMediaError() : setError("This browser cannot play the file or its preview expired. Reload the version; for MOV codec compatibility, render an H.264 MP4 review copy.")} />
      {shapes.length > 0 || drawing ? <ShapeOverlay shapes={[...shapes, ...(drawing ? [drawing] : [])]} noteNumber={draft ? nextNoteNumber : seekRequest?.noteNumber} /> : null}
      {draft && tool && <div className="video-markup-draw" aria-label={`Draw ${tool} on the paused frame`} onPointerDown={e => {
        if (shapes.length >= 30 || busy || e.button !== 0) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); const p = point(e);
        gesture.current = {kind: tool, x1:p.x,y1:p.y,x2:p.x,y2:p.y}; setDrawing(gesture.current);
      }} onPointerMove={e => { if (!gesture.current) return; const p=point(e); gesture.current={...gesture.current,x2:p.x,y2:p.y};setDrawing(gesture.current); }}
      onPointerUp={e => {
        if (gesture.current) {
          const p = point(e), s = {...gesture.current, x2: p.x, y2: p.y};
          const bounds = e.currentTarget.getBoundingClientRect();
          const visibleLength = Math.hypot((s.x2-s.x1)*bounds.width, (s.y2-s.y1)*bounds.height);
          if (s.kind === "arrow" ? visibleLength >= 12 : Math.hypot(s.x2-s.x1,s.y2-s.y1) > .005) setShapes(current => [...current,s]);
        }
        gesture.current=null;setDrawing(null);
      }}
      onPointerCancel={() => {gesture.current=null;setDrawing(null);}} />}
      {!draft && <div className="video-markup-fullscreen"><IconButton label="Fullscreen" className="video-markup-overlay-button" disabled={busy} onClick={() => { void video.current?.requestFullscreen?.().catch(e => setError(errorText(e))); }}><Maximize2 /></IconButton></div>}
    </div>
    <div className="video-markup-transport border-border">
      <IconButton label="Previous frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(-1)}><ChevronLeft /></IconButton>
      <IconButton label={playing ? "Pause" : "Play"} disabled={!ready || !!draft || busy} onClick={() => void togglePlay()}>{playing ? <Pause /> : <Play />}</IconButton>
      <IconButton label="Next frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(1)}><ChevronRight /></IconButton>
      <output className="video-markup-time text-xs text-muted-foreground">{timecode(time)} <span>/ {timecode(duration || 0)}</span></output>
      {canFit && <Button type="button" variant="ghost" size="sm" onClick={toggleFit}>{fit ? "Fill width" : "Fit to screen"}</Button>}
    </div>
    <input className="video-markup-seek" aria-label="Video time" type="range" min="0" max={duration || 0} step={preview.media.fps ? 1 / preview.media.fps : "any"} value={time} disabled={!ready || !!draft || busy} onChange={e => {setShapes([]);seek(snapTime({...preview.media, duration}, Number(e.target.value)));}} />
    {draft && <form className="video-markup-note-editor border-border" onSubmit={e => {
      e.preventDefault(); if (!onSave || !text.trim()) return; setBusy(true);setError("");
      void onSave({timestamp:draft.timestamp, still:draft.still, shapes, text:text.trim()}).then(cancel).catch(e => setError(errorText(e))).finally(() => setBusy(false));
    }}>
      <div className="video-markup-row"><span className="video-markup-check text-muted-foreground text-xs"><span className="video-markup-note-number" aria-label={`Note ${nextNoteNumber}`}>{nextNoteNumber}</span>Frame at {timecode(draft.timestamp)}</span>{shapes.length > 0 && <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => setShapes(v => v.slice(0,-1))}><Undo2 />Undo shape</Button>}</div>
      <div className="video-markup-row video-markup-draw-tools" role="toolbar" aria-label="Point at something on the frame">
        {([['box', Square, 'Box'], ['arrow', ArrowRight, 'Arrow'], ['zoom', Maximize2, 'Zoom region']] as const).map(([kind, Icon, label]) => <Button key={kind} type="button" variant={tool===kind ? "secondary" : "ghost"} size="sm" aria-pressed={tool===kind} disabled={busy} onClick={() => setTool(current => current===kind ? null : kind)}><Icon />{label}</Button>)}
      </div>
      {tool && <p className="video-markup-draw-hint text-xs text-muted-foreground">{drawHints[tool]}</p>}
      <textarea ref={noteField} aria-label="Frame note" placeholder="What should change at this moment?" value={text} maxLength={8000} onChange={e => setText(e.target.value)} className="video-markup-textarea border-input bg-background text-foreground" disabled={busy} />
      <div className="video-markup-row"><span className="text-xs text-muted-foreground">{shapes.length ? `${shapes.length} shape${shapes.length===1 ? "" : "s"} drawn` : ""}</span><div className="video-markup-actions"><Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={busy}>Cancel</Button><Button type="submit" size="sm" disabled={!text.trim() || busy}>{busy ? "Saving…" : "Save note"}</Button></div></div>
    </form>}
    {!compact && !canStep && <Notice>{frameProbe === "pending" ? "Preparing frame stepping…" : frameProbe === "failed" ? "Frame stepping is unavailable. Playback and seeking still work." : "Frame stepping needs ffprobe on the video's machine or a known constant frame rate supplied when registering."}</Notice>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function AddVideo({threadId, file, source, onRegistered}: {threadId: string; file: string; source: PluginFileOpenerProps["source"]; onRegistered: (version: Version) => void}) {
  const rpc = useRpc<typeof videoMarkupContract>();
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  return <div><Button disabled={busy} onClick={()=>{setBusy(true);setError("");void rpc.call("register",{threadId,file,source}).then(onRegistered).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));}}>{busy ? "Adding video…" : "Leave notes on this video"}</Button>{error&&<ErrorNotice>{error}</ErrorNotice>}</div>;
}

function NoteList({threadId, version, notes, onSeek, onRefresh, onAddNote, disabled}: {threadId: string;version:Version;notes:FrameNote[];onSeek:(note:FrameNote)=>void;onRefresh:()=>void;onAddNote:()=>void;disabled:boolean}) {
  const rpc=useRpc<typeof videoMarkupContract>(),composer=useComposer();
  const [selected,setSelected]=useState<string[]>([]),[filter,setFilter]=useState("actionable"),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[promptError,setPromptError]=useState("");
  const [still,setStill]=useState<{note:FrameNote;image:Still}|null>(null);
  // A note whose status just changed stays in view until the filter changes, so it never vanishes mid-click.
  const [kept,setKept]=useState<string[]>([]);
  const selectionId = useId();
  const actionable=notes.filter(n=>isActionable(n.status));
  const validSelected=selected.filter(id=>actionable.some(n=>n.id===id));
  // Once nothing needs attention, the list shows that outcome instead of the notes just resolved.
  const shown=filter==="actionable" && !actionable.length ? [] : kept;
  const visible=notes.filter(n=>shown.includes(n.id) || filter==="all" || (filter==="actionable" ? isActionable(n.status) : n.status===filter));
  const allSelected = actionable.length>0 && validSelected.length===Math.min(12,actionable.length);
  const noteNumber = (note: FrameNote) => notes.findIndex(n => n.id === note.id) + 1;
  async function addToPrompt() {
    setBusy(true);setNotice("");setPromptError("");
    try {const result=await rpc.call("context",{threadId,noteIds:validSelected});composer.insertMention({provider:MENTION_PROVIDER,id:result.id,label:`${videoName(version.media.path)} · ${result.count} note${result.count===1 ? "" : "s"}`});composer.focus();setNotice(`${result.count} note${result.count===1 ? "" : "s"} added to the prompt.`);setSelected([]);} catch(e){setPromptError(errorText(e));}finally{setBusy(false);}
  }
  function changeStatus(note: FrameNote, status: NoteStatus) {
    setBusy(true);setError("");setKept(ids=>ids.includes(note.id) ? ids : [...ids,note.id]);
    void rpc.call("status",{threadId,noteId:note.id,status}).then(onRefresh).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));
  }
  return <section className="video-markup-notes" aria-label="Notes">
    <div className="video-markup-row video-markup-notes-heading">
      <h3 className="text-sm font-medium">Notes</h3>
      <div className="video-markup-actions">
      <Button variant="outline" size="sm" disabled={disabled} onClick={onAddNote}><StickyNote />Note</Button>
      <Select value={filter} onValueChange={value=>{setFilter(value);setKept([]);}}>
        <SelectTrigger aria-label="Filter notes" className="video-markup-filter"><SelectValue /></SelectTrigger>
        <SelectContent align="end">{noteFilters.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
      </div>
    </div>
    {actionable.length>0 && <div className="video-markup-row video-markup-selection">
      <div className="video-markup-check text-xs text-muted-foreground">
        <Checkbox id={selectionId} checked={allSelected ? true : validSelected.length ? "indeterminate" : false} disabled={!actionable.length || busy} onCheckedChange={checked=>setSelected(checked===true ? actionable.slice(0,12).map(n=>n.id) : [])} />
        <label htmlFor={selectionId}>Select open notes</label>
      </div>
      <Button size="sm" disabled={!validSelected.length || busy} onClick={()=>void addToPrompt()}><Send />Add to prompt</Button>
    </div>}
    {/* Report the result beside Add to prompt, where the reviewer is looking, not below a long note list. */}
    {notice && <Notice>{notice}</Notice>}{promptError && <ErrorNotice>{promptError}</ErrorNotice>}
    {!visible.length && <Notice>{!notes.length ? "Pause on a frame, then press Note." : filter==="actionable" ? `All ${notes.length} note${notes.length===1 ? " is" : "s are"} fixed.` : "No notes in this view."}</Notice>}
    <div className="video-markup-note-list">
      {visible.map(note=><article key={note.id} className="video-markup-note border-border" aria-label={`Note ${noteNumber(note)}`}>
        <Checkbox className="video-markup-note-checkbox" aria-label={`Select note at ${timecode(note.timestamp)}`} checked={validSelected.includes(note.id)} disabled={busy || !isActionable(note.status) || (!validSelected.includes(note.id)&&validSelected.length>=12)} onCheckedChange={checked=>setSelected(v=>checked===true ? [...v,note.id] : v.filter(id=>id!==note.id))} />
        <div className="video-markup-note-content">
          <div className="video-markup-row video-markup-note-heading">
            <button type="button" className="video-markup-moment" aria-label={`Go to note ${noteNumber(note)} at ${timecode(note.timestamp)}`} disabled={disabled} onClick={()=>onSeek(note)}>
              <span className="video-markup-note-number" aria-hidden="true">{noteNumber(note)}</span>
              <span>{timecode(note.timestamp)}</span>
            </button>
            <Select value={note.status} disabled={busy} onValueChange={value=>changeStatus(note,value as NoteStatus)}>
              <SelectTrigger aria-label={`Status for note at ${timecode(note.timestamp)}`} className={`${badgeVariants({variant:"secondary"})} video-markup-status`}>
                <SelectValue><span className="video-markup-status-label"><span className="video-markup-status-dot" data-status={note.status} />{statusLabels[note.status]}</span></SelectValue>
              </SelectTrigger>
              <SelectContent align="end">{statuses.map(status=><SelectItem key={status} value={status}><span className="video-markup-status-label"><span className="video-markup-status-dot" data-status={status} />{statusLabels[status]}</span></SelectItem>)}</SelectContent>
            </Select>
          </div>
          <p className="video-markup-note-text text-sm">{note.text}</p>
          <div className="video-markup-row video-markup-note-footer text-xs text-muted-foreground">
            <span>{note.carriedFrom ? "Carried forward · original frame" : note.shapes.length ? "Marked frame" : "Frame note"}</span>
            <Button variant="ghost" size="sm" aria-expanded={still?.note.id===note.id} onClick={()=>{if(still?.note.id===note.id){setStill(null);return;}void rpc.call("frame",{threadId,noteId:note.id}).then(image=>setStill({note,image})).catch(e=>setError(errorText(e)));}}>{still?.note.id===note.id ? "Hide still" : "View still"}</Button>
          </div>
          {/* The still opens under its own note, at the same fitted size as the player, so it appears where it was asked for. */}
          {still?.note.id===note.id && <div className="video-markup-still border-border">
            <div className="video-markup-row"><span className="video-markup-check text-xs text-muted-foreground">Captured frame · {timecode(note.timestamp)}{note.carriedFrom ? " · earlier version" : ""}</span><IconButton label="Close still" onClick={()=>setStill(null)}><X /></IconButton></div>
            <div className="video-markup-stage" style={{aspectRatio: still.image.width/still.image.height, width: `min(100%, calc(${STILL_FIT_HEIGHT * 100}vh * ${still.image.width/still.image.height}))`}}><img src={still.image.dataUrl} alt={`Frame at ${timecode(note.timestamp)}: ${note.text}`} /><ShapeOverlay shapes={note.shapes} noteNumber={noteNumber(note)} /></div>
          </div>}
        </div>
      </article>)}
    </div>
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function ReviewVersion({threadId,versionId,onDirty,startAt}: {threadId:string;versionId:string;onDirty?:(dirty:boolean)=>void;startAt?:{time?:number}}) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const [version,setVersion]=useState<Version|null>(null),[preview,setPreview]=useState<Preview|null>(null),[notes,setNotes]=useState<FrameNote[]>([]),[error,setError]=useState(""),[reload,setReload]=useState(0),[dirty,setDirty]=useState(false);
  const [seekRequest,setSeekRequest]=useState<{time:number;shapes:Shape[];sequence:number;noteNumber:number}>(),[noteRequest,setNoteRequest]=useState(0);
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  // Review notes opens on the frame the inline player was paused on.
  useEffect(()=>{if(startAt?.time)setSeekRequest({time:startAt.time,shapes:[],sequence:Date.now(),noteNumber:0});},[startAt]);
  const dirtyChanged=useCallback((value:boolean)=>{setDirty(value);onDirty?.(value);},[onDirty]);
  useEffect(()=>{let cancelled=false;setError("");setPreview(null);setVersion(null);void Promise.all([rpc.call("version",{threadId,versionId}),rpc.call("preview",{threadId,versionId})]).then(([v,p])=>{if(!cancelled){setVersion(v);setPreview(p);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId]);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:FrameNote[]=[];let offset:number|null=0;do{const page: {notes: FrameNote[]; nextOffset: number | null}=await rpc.call("notes",{threadId,versionId,offset});all.push(...page.notes);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled)setNotes(all);})().catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId,reload]);
  useRealtime("changed",refresh);
  if(error&&!version)return <ErrorNotice>{error}</ErrorNotice>;
  if(!version||!preview)return <Notice>Opening version…</Notice>;
  return <>
    <Player key={`player-${versionId}`} preview={preview} version={version} seekRequest={seekRequest} noteRequest={noteRequest} nextNoteNumber={notes.length+1} onDirty={dirtyChanged} onSave={async fields=>{await rpc.call("addNote",{threadId,versionId,...fields});refresh();}} />
    <NoteList key={`notes-${versionId}`} threadId={threadId} version={version} notes={notes} disabled={dirty} onRefresh={refresh} onAddNote={()=>setNoteRequest(n=>n+1)} onSeek={note=>setSeekRequest({time:Math.min(note.timestamp,preview.media.duration||note.timestamp),shapes:note.frameVersionId===versionId ? note.shapes : [],sequence:Date.now(),noteNumber:notes.findIndex(n=>n.id===note.id)+1})} />
    {error&&<ErrorNotice>{error}</ErrorNotice>}</>;
}

function VersionLabel({position,count}: {position:number;count:number}) {
  return <span className="video-markup-version text-xs text-muted-foreground">Version {position} of {count}{position<count ? " · not the latest" : ""}</span>;
}

// A file opened in the viewer names its demo and version, so it is clear where "Leave notes" filed it.
function FileVersionHeader({threadId,version}: {threadId:string;version:Version}) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const [renders,setRenders]=useState<Version[]>([]),[reload,setReload]=useState(0);
  useRealtime("changed",useCallback(()=>setReload(n=>n+1),[]));
  useEffect(()=>{let cancelled=false;void(async()=>{const all:Version[]=[];let offset:number|null=0;do{const page: {versions: Version[]; nextOffset: number | null}=await rpc.call("versions",{threadId,offset});all.push(...page.versions);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled)setRenders(all.filter(v=>v.demo===version.demo));})().catch(()=>{/* The label is optional; the review below still works without it. */});return()=>{cancelled=true;};},[rpc,threadId,version.demo,reload]);
  const position=renders.findIndex(v=>v.id===version.id)+1;
  return <header className="video-markup-header video-markup-row border-border"><h2 className="video-markup-demo">{version.demo}</h2>{position>0&&<VersionLabel position={position} count={renders.length}/>}</header>;
}

export function VideoMarkupPanel({threadId,params}: PluginThreadPanelProps) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const presentation=useSyncExternalStore(subscribePresentation,()=>presentedVersions.get(threadId)??null);
  const initial=params && typeof params==="object" && !Array.isArray(params) && typeof params.versionId==="string" ? params.versionId : null;
  const [versions,setVersions]=useState<Version[]>([]),[current,setCurrent]=useState<string|null>(presentation?.versionId??initial),[demo,setDemo]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[dirty,setDirty]=useState(false);
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  useRealtime("changed",refresh);
  useEffect(()=>{setCurrent(presentation?.versionId??initial);setDemo(null);setDirty(false);setError("");refresh();},[threadId,initial,presentation,refresh]);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:Version[]=[];let offset:number|null=0,selectedDemo:string|null=null;do{const page: {versions: Version[]; nextOffset: number | null; currentDemo: string | null}=await rpc.call("versions",{threadId,offset});all.push(...page.versions);selectedDemo=page.currentDemo;offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled){setVersions(all);setCurrent(v=>v??all.filter(item=>!selectedDemo||item.demo===selectedDemo).at(-1)?.id??null);setLoading(false);}})().catch(e=>{if(!cancelled){setError(errorText(e));setLoading(false);}});return()=>{cancelled=true;};},[rpc,threadId,reload]);
  const active=versions.find(v=>v.id===current),activeDemo=demo??active?.demo??versions.at(-1)?.demo;
  const demos=[...new Set(versions.map(v=>v.demo))];
  // Name the version on screen so notes carried into a newer render can't be mistaken for the originals.
  const renders=versions.filter(v=>v.demo===activeDemo),position=active&&active.demo===activeDemo ? renders.indexOf(active)+1 : 0;
  return <main className="video-markup bg-background text-foreground">
    {versions.length>0&&<header className="video-markup-header video-markup-row border-border">{demos.length===1?<h2 className="video-markup-demo">{activeDemo}</h2>:<Select value={activeDemo} disabled={dirty} onValueChange={value=>{setDemo(value);setCurrent(versions.filter(v=>v.demo===value).at(-1)?.id??null);void rpc.call("selectDemo",{threadId,demo:value}).catch(e=>setError(errorText(e)));}}><SelectTrigger aria-label="Demo" className="video-markup-demo"><SelectValue /></SelectTrigger><SelectContent>{demos.map(name=><SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>}{position>0&&<VersionLabel position={position} count={renders.length}/>}</header>}
    {error&&<ErrorNotice>{error}</ErrorNotice>}
    {loading ? <Notice>Loading demos…</Notice> : !current ? <Notice>Attach a video in the prompt box, or ask your agent to share one.</Notice> : <>
      <div className="video-markup-review"><ReviewVersion key={current} threadId={threadId} versionId={current} onDirty={setDirty} startAt={presentation?.versionId===current ? presentation : undefined} /></div></>}
  </main>;
}

export function VideoMarkupFileViewer({path,source}: PluginFileOpenerProps) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const [preview,setPreview]=useState<Preview|null>(null),[version,setVersion]=useState<Version|null>(null),[error,setError]=useState("");
  const [frameProbe,setFrameProbe]=useState<"pending"|"failed">("pending");
  const sourceKey=JSON.stringify(source);
  useEffect(()=>{let cancelled=false;setPreview(null);setVersion(null);setError("");setFrameProbe("pending");void(async()=>{
    const p=await rpc.call("openFile",{file:path,source}); if(cancelled)return;setPreview(p);
    if(source.threadId){let offset:number|null=0;do{const result: {versions: Version[]; nextOffset: number | null}=await rpc.call("versions",{threadId:source.threadId,offset});const found=result.versions.find(v=>v.media.path===p.media.path && v.media.hostId===p.media.hostId && v.media.modifiedAt===p.media.modifiedAt);if(found){if(!cancelled)setVersion(found);return;}offset=result.nextOffset;}while(offset!==null&&!cancelled);}
    try {
      const media=await rpc.call("probeFile",{file:path,source});
      if(!cancelled && media.path===p.media.path && media.hostId===p.media.hostId && media.size===p.media.size && media.modifiedAt===p.media.modifiedAt) setPreview({...p,media});
    } catch { /* Optional frame metadata must not replace the playable preview with an error. */ }
    finally {if(!cancelled)setFrameProbe("failed");}
  })().catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[path,sourceKey,rpc]);
  if(!error&&version&&source.threadId)return <main className="video-markup bg-background text-foreground"><FileVersionHeader threadId={source.threadId} version={version}/><div className="video-markup-review"><ReviewVersion threadId={source.threadId} versionId={version.id}/></div></main>;
  return <main className="video-markup video-markup-review bg-background text-foreground">{error?<ErrorNotice>{error}</ErrorNotice>:preview?<><Player key={path} preview={preview} frameProbe={frameProbe}/>{source.threadId?<AddVideo threadId={source.threadId} file={path} source={source} onRegistered={setVersion}/>:<Notice>Open this video from a thread to leave notes.</Notice>}</>:<Notice>Opening video…</Notice>}</main>;
}

// The chat list remounts directives as they scroll. Reusing a still-valid preview keeps the
// player from collapsing to "Loading video…" and reloading its media on every remount.
const inlineCache = new Map<string, {preview: Preview; version: Version}>();
function cachedInline(key: string) { const hit = inlineCache.get(key); return hit && hit.preview.expiresAt > Date.now() + 60_000 ? hit : null; }

export function VideoMarkupInline({attributes,message}:PluginMessageDirectiveProps) {
  const rpc=useRpc<typeof videoMarkupContract>(),navigate=useBbNavigate();
  const key=`${message.threadId}:${attributes.version ?? ""}`;
  const [preview,setPreview]=useState<Preview|null>(()=>cachedInline(key)?.preview ?? null),[version,setVersion]=useState<Version|null>(()=>cachedInline(key)?.version ?? null),[error,setError]=useState("");
  const [expanded,setExpanded]=useState(false),[reload,setReload]=useState(0),section=useRef<HTMLElement>(null);
  function review(id:string) {
    const player=section.current?.querySelector("video");player?.pause();
    if(!openVersion(navigate,message.threadId,id,player?.currentTime))setExpanded(v=>!v);
  }
  useEffect(()=>{
    const hit=reload ? null : cachedInline(key); if(hit){setPreview(hit.preview);setVersion(hit.version);return;}
    let cancelled=false;setPreview(null);setVersion(null);setError("");void Promise.all([rpc.call("preview",{threadId:message.threadId,versionId:attributes.version??""}),rpc.call("version",{threadId:message.threadId,versionId:attributes.version??""})]).then(([p,v])=>{inlineCache.set(key,{preview:p,version:v});if(!cancelled){setPreview(p);setVersion(v);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};
  },[rpc,key,message.threadId,attributes.version,reload]);
  return <section ref={section} className="video-markup video-markup-inline border-border bg-background text-foreground"><header className="video-markup-row video-markup-inline-header border-border"><div><span className="video-markup-brand text-xs"><Clapperboard size={14}/>Video Markup</span>{version&&<p className="text-sm font-medium">{version.demo} <span className="text-muted-foreground">· {videoName(version.media.path)}</span></p>}</div>{version&&<Button variant="ghost" size="sm" onClick={()=>review(version.id)}>Review notes</Button>}</header>
    {error?<ErrorNotice>{error}</ErrorNotice>:preview?<Player key={`${attributes.version}-${reload}`} preview={preview} version={version??undefined} compact onMediaError={reload ? undefined : ()=>{inlineCache.delete(key);setReload(1);}}/>:<Notice>Loading video…</Notice>}
    {expanded&&version&&<VideoMarkupPanel threadId={message.threadId} params={{versionId:version.id}}/>}
  </section>;
}

function PresentVideo({threadId}: PluginThreadHeaderActionProps) {
  const navigate=useBbNavigate();
  useRealtime("present",useCallback((payload: unknown)=>{
    const event=presentationSchema.safeParse(payload);
    if(event.success && event.data.threadId===threadId) openVersion(navigate,threadId,event.data.versionId);
  },[navigate,threadId]));
  return null;
}

export default definePluginApp(app=>{
  app.slots.experimental_threadHeaderAction({id:"video-markup-present",title:"Video Markup",component:PresentVideo});
  app.slots.threadPanelAction({id:"video-markup",title:"Video Markup",icon:"Clapperboard",layout:"flush",component:VideoMarkupPanel});
  app.slots.fileOpener({id:"video-markup-video",title:"Video Markup",extensions:VIDEO_EXTENSIONS,component:VideoMarkupFileViewer});
  app.slots.messageDirective({id:"video-markup",component:VideoMarkupInline});
});
