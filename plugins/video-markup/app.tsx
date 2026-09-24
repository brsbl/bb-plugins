import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clapperboard, CornerUpLeft, Maximize2, Pause, Play, Send, Square, StickyNote, X } from "lucide-react";
import { definePluginApp, useBbNavigate, useComposer, useRealtime, useRpc, type PluginFileOpenerProps, type PluginMessageDirectiveProps, type PluginThreadPanelProps } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { Checkbox } from "./components/ui/checkbox.js";
import { badgeVariants } from "./components/ui/badge.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select.js";
import { ShapeOverlay } from "./shape-overlay.js";
import { isActionable, MENTION_PROVIDER, stepTime, timecode, VIDEO_EXTENSIONS, type FrameNote, type Media, type NoteStatus, type Shape, type Still, type Version } from "./model.js";
import type { videoMarkupContract } from "./server.js";
import "./app.css";

type Rpc = ReturnType<typeof useRpc<typeof videoMarkupContract>>;
type Preview = {url: string; expiresAt: number; media: Media};
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
const statuses: NoteStatus[] = ["open", "fixed", "still wrong", "regressed"];
const statusLabels: Record<NoteStatus, string> = {open: "Open", fixed: "Fixed", "still wrong": "Still wrong", regressed: "Regressed"};
const noteFilters = [{value: "actionable", label: "Needs attention"}, {value: "all", label: "All notes"}, ...statuses.map(value => ({value, label: statusLabels[value]}))];
function Notice({children}: {children: ReactNode}) { return <p role="status" className="video-markup-notice text-muted-foreground">{children}</p>; }
function ErrorNotice({children}: {children: ReactNode}) { return <p role="alert" className="video-markup-notice text-destructive">{children}</p>; }
function IconButton({label, children, ...props}: {label: string; children: ReactNode} & React.ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" size="icon" aria-label={label} {...props}>{children}</Button>;
}

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

function Player({preview, version, onSave, onDirty, compact = false, seekRequest, nextNoteNumber, frameProbe}: {
  preview: Preview; version?: Version; onSave?: (fields: {timestamp: number; text: string; shapes: Shape[]; still: Still}) => Promise<void>;
  onDirty?: (value: boolean) => void; compact?: boolean; seekRequest?: {time: number; shapes: Shape[]; sequence: number; noteNumber: number}; nextNoteNumber?: number; frameProbe?: "pending" | "failed";
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
  const canStep = preview.media.frameTimes.length > 0 || preview.media.fps !== null;
  const seek = useCallback((value: number) => { if (video.current) { video.current.pause(); video.current.currentTime = value; setTime(value); } }, []);
  useEffect(() => { if (seekRequest && !draft) { seek(seekRequest.time); setShapes(seekRequest.shapes); } }, [seekRequest, seek]);
  useEffect(() => () => onDirty?.(false), [onDirty]);
  async function togglePlay() {
    if (!video.current || draft || busy) return;
    try { if (video.current.paused) { setShapes([]); await video.current.play(); } else video.current.pause(); } catch (e) { setError(errorText(e)); }
  }
  function step(direction: -1 | 1) { if (!draft && !busy && video.current && canStep) { setShapes([]); seek(stepTime({...preview.media, duration}, video.current.currentTime, direction)); } }
  async function beginNote(kind: Shape["kind"] | null = null) {
    if (draft) { setTool(kind); return; }
    if (!video.current) return;
    video.current.pause(); setBusy(true); setError("");
    try {
      const timestamp = video.current.currentTime;
      const still = await captureFrame(video.current);
      setDraft({timestamp, still}); setShapes([]); setTool(kind); onDirty?.(true);
    } catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  }
  function cancel() { setDraft(null); setTool(null); setShapes([]); setText(""); onDirty?.(false); }
  function point(e: PointerEvent<HTMLDivElement>) { const r = e.currentTarget.getBoundingClientRect(); return {x: Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)), y: Math.max(0, Math.min(1, (e.clientY-r.top)/r.height))}; }
  return <section className="video-markup-player" tabIndex={0} aria-label="Video review player" onKeyDown={e => {
    if ((e.target as HTMLElement).closest("input,textarea,select,button") || draft || busy || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") { e.preventDefault(); void togglePlay(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <div className="video-markup-stage bg-muted" style={{aspectRatio: aspect}}>
      <video ref={video} src={preview.url} playsInline preload="metadata" crossOrigin="anonymous" aria-label={version?.label ?? "Video preview"}
        onLoadedMetadata={e => { const v=e.currentTarget; setDuration(v.duration); setAspect(v.videoWidth/v.videoHeight || 16/9); }}
        onLoadedData={() => setReady(true)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onSeeking={() => setSeeking(true)} onSeeked={() => setSeeking(false)}
        onError={() => setError("This browser cannot play the file or its preview expired. Reload the version; for MOV codec compatibility, render an H.264 MP4 review copy.")} />
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
    </div>
    <div className="video-markup-transport border-border">
      <IconButton label={playing ? "Pause" : "Play"} disabled={!ready || !!draft || busy} onClick={() => void togglePlay()}>{playing ? <Pause /> : <Play />}</IconButton>
      {!compact && <><IconButton label="Previous frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(-1)}><ChevronLeft /></IconButton><IconButton label="Next frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(1)}><ChevronRight /></IconButton></>}
      <output className="video-markup-time text-xs text-muted-foreground">{timecode(time)} <span>/ {timecode(duration || 0)}</span></output>
      <IconButton label="Fullscreen video" disabled={busy || !!draft} onClick={() => { void video.current?.requestFullscreen?.().catch(e => setError(errorText(e))); }}><Maximize2 /></IconButton>
    </div>
    <input className="video-markup-seek" aria-label="Video time" type="range" min="0" max={duration || 0} step="any" value={time} disabled={!ready || !!draft || busy} onChange={e => {setShapes([]);seek(Number(e.target.value));}} />
    {onSave && <div className="video-markup-tools">
      <Button variant={draft && !tool ? "secondary" : "ghost"} size="sm" disabled={!ready || seeking || busy} onClick={() => void beginNote()}><StickyNote /> Note</Button>
      {([['box', Square, 'Box'], ['arrow', ArrowRight, 'Arrow'], ['zoom', Maximize2, 'Zoom region']] as const).map(([kind, Icon, label]) => <Button key={kind} variant={tool===kind ? "secondary" : "ghost"} size="sm" aria-pressed={tool===kind} disabled={!ready || seeking || busy} onClick={() => void beginNote(kind)}><Icon />{label}</Button>)}
    </div>}
    {draft && tool === "arrow" && <p className="video-markup-draw-hint text-xs text-muted-foreground">Drag from the numbered marker toward what needs attention.</p>}
    {draft && <form className="video-markup-note-editor border-border" onSubmit={e => {
      e.preventDefault(); if (!onSave || !text.trim()) return; setBusy(true);setError("");
      void onSave({timestamp:draft.timestamp, still:draft.still, shapes, text:text.trim()}).then(cancel).catch(e => setError(errorText(e))).finally(() => setBusy(false));
    }}>
      <div className="video-markup-row"><span className="video-markup-check text-muted-foreground text-xs"><span className="video-markup-note-number" aria-label={`Note ${nextNoteNumber}`}>{nextNoteNumber}</span>Frame at {timecode(draft.timestamp)}</span><IconButton label="Undo last shape" disabled={!shapes.length || busy} onClick={() => setShapes(v => v.slice(0,-1))}><CornerUpLeft /></IconButton></div>
      <textarea autoFocus aria-label="Frame note" placeholder="What should change at this moment?" value={text} maxLength={8000} onChange={e => setText(e.target.value)} className="video-markup-textarea border-input bg-background text-foreground" disabled={busy} />
      <div className="video-markup-row"><span className="text-xs text-muted-foreground">{shapes.length ? `${shapes.length} drawn region${shapes.length===1 ? "" : "s"}` : "Frame still attached"}</span><div className="video-markup-actions"><Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={busy}>Cancel</Button><Button size="sm" disabled={!text.trim() || busy}>{busy ? "Saving…" : "Save note"}</Button></div></div>
    </form>}
    {!compact && !canStep && <Notice>{frameProbe === "pending" ? "Preparing frame stepping…" : frameProbe === "failed" ? "Frame stepping is unavailable. Playback and seeking still work." : "Frame stepping needs ffprobe on the video's machine or a known constant frame rate supplied when registering."}</Notice>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function RegistrationForm({threadId, file, source, onRegistered}: {threadId: string; file?: string; source?: PluginFileOpenerProps["source"]; onRegistered: (version: Version) => void}) {
  const rpc = useRpc<typeof videoMarkupContract>();
  const [demo,setDemo]=useState(""),[label,setLabel]=useState(""),[location,setLocation]=useState(file ?? ""),[summary,setSummary]=useState(""),[fps,setFps]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  return <form className="video-markup-register" onSubmit={e => {e.preventDefault();setBusy(true);setError("");void rpc.call("register",{threadId,demo,label,file:location,summary,...(source ? {source} : {}),...(fps ? {fps:Number(fps)} : {})}).then(onRegistered).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));}}>
    <div><h3 className="font-medium">{file ? "Review this video" : "Register a version"}</h3><p className="text-sm text-muted-foreground">Keep the film, its changes, and frame feedback together.</p></div>
    <label>Demo<Input required placeholder="iPhone Duo" value={demo} maxLength={160} onChange={e=>setDemo(e.target.value)} /></label>
    <label>Version label<Input required placeholder="v10 · A quieter camera" value={label} maxLength={120} onChange={e=>setLabel(e.target.value)} /></label>
    {!file && <label>Video path<Input required placeholder="/path/to/demo-v10.mp4" value={location} onChange={e=>setLocation(e.target.value)} /></label>}
    <label>What changed?<Input placeholder="Gentler zooms; composer stays in frame" value={summary} maxLength={4000} onChange={e=>setSummary(e.target.value)} /></label>
    <details><summary className="text-xs text-muted-foreground">Frame rate fallback</summary><label className="text-xs">Only for a known constant frame rate when ffprobe is unavailable<Input aria-label="Frames per second" type="number" min="1" max="240" step="any" value={fps} onChange={e=>setFps(e.target.value)} /></label></details>
    <Button disabled={busy || !demo.trim() || !label.trim() || !location.trim()}>{busy ? "Reading video…" : "Register version"}</Button>
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </form>;
}

function NoteList({threadId, version, notes, onSeek, onRefresh, disabled}: {threadId: string;version:Version;notes:FrameNote[];onSeek:(note:FrameNote)=>void;onRefresh:()=>void;disabled:boolean}) {
  const rpc=useRpc<typeof videoMarkupContract>(),composer=useComposer();
  const [selected,setSelected]=useState<string[]>([]),[filter,setFilter]=useState("actionable"),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [still,setStill]=useState<{note:FrameNote;image:Still}|null>(null);
  const selectionId = useId();
  const actionable=notes.filter(n=>isActionable(n.status));
  const validSelected=selected.filter(id=>actionable.some(n=>n.id===id));
  const visible=notes.filter(n=>filter==="all" || (filter==="actionable" ? isActionable(n.status) : n.status===filter));
  const allSelected = actionable.length>0 && validSelected.length===Math.min(12,actionable.length);
  const noteNumber = (note: FrameNote) => notes.findIndex(n => n.id === note.id) + 1;
  async function addToPrompt() {
    setBusy(true);setError("");
    try {const result=await rpc.call("context",{threadId,noteIds:validSelected});composer.insertMention({provider:MENTION_PROVIDER,id:result.id,label:`${version.demo} · ${result.count} frame note${result.count===1 ? "" : "s"}`});composer.focus();setNotice(`${result.count} note${result.count===1 ? "" : "s"} and frame stills added to the prompt.`);setSelected([]);} catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  function changeStatus(note: FrameNote, status: NoteStatus) {
    setBusy(true);setError("");
    void rpc.call("status",{threadId,noteId:note.id,status}).then(onRefresh).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));
  }
  return <section className="video-markup-notes" aria-label="Frame notes">
    <div className="video-markup-row video-markup-notes-heading">
      <h3 className="text-sm font-medium">Frame notes</h3>
      <Select value={filter} onValueChange={setFilter}>
        <SelectTrigger aria-label="Filter notes" className="video-markup-filter"><SelectValue /></SelectTrigger>
        <SelectContent align="end">{noteFilters.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
    {notes.length>0 && <div className="video-markup-row video-markup-selection">
      <div className="video-markup-check text-xs text-muted-foreground">
        <Checkbox id={selectionId} checked={allSelected ? true : validSelected.length ? "indeterminate" : false} disabled={!actionable.length || busy} onCheckedChange={checked=>setSelected(checked===true ? actionable.slice(0,12).map(n=>n.id) : [])} />
        <label htmlFor={selectionId}>Select open notes</label>
      </div>
      <Button size="sm" disabled={!validSelected.length || busy} onClick={()=>void addToPrompt()}><Send />Add to prompt</Button>
    </div>}
    {!visible.length && <Notice>{notes.length ? "No notes in this view." : "Pause at a moment, mark a region, and leave a note."}</Notice>}
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
            <Button variant="ghost" size="sm" onClick={()=>{void rpc.call("frame",{threadId,noteId:note.id}).then(image=>setStill({note,image})).catch(e=>setError(errorText(e)));}}>View still</Button>
          </div>
        </div>
      </article>)}
    </div>
    {still && <div className="video-markup-still border-border">
      <div className="video-markup-row"><span className="video-markup-check text-xs text-muted-foreground"><span className="video-markup-note-number">{noteNumber(still.note)}</span>Captured frame · {timecode(still.note.timestamp)}{still.note.carriedFrom ? " · earlier version" : ""}</span><IconButton label="Close still" onClick={()=>setStill(null)}><X /></IconButton></div>
      <div className="video-markup-stage"><img src={still.image.dataUrl} alt={`Frame at ${timecode(still.note.timestamp)}: ${still.note.text}`} /><ShapeOverlay shapes={still.note.shapes} noteNumber={noteNumber(still.note)} /></div>
    </div>}
    {notice && <Notice>{notice}</Notice>}{error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function ReviewVersion({threadId,versionId,onDirty}: {threadId:string;versionId:string;onDirty?:(dirty:boolean)=>void}) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const [version,setVersion]=useState<Version|null>(null),[preview,setPreview]=useState<Preview|null>(null),[notes,setNotes]=useState<FrameNote[]>([]),[error,setError]=useState(""),[reload,setReload]=useState(0),[dirty,setDirty]=useState(false);
  const [seekRequest,setSeekRequest]=useState<{time:number;shapes:Shape[];sequence:number;noteNumber:number}>();
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  const dirtyChanged=useCallback((value:boolean)=>{setDirty(value);onDirty?.(value);},[onDirty]);
  useEffect(()=>{let cancelled=false;setError("");setPreview(null);setVersion(null);void Promise.all([rpc.call("version",{threadId,versionId}),rpc.call("preview",{threadId,versionId})]).then(([v,p])=>{if(!cancelled){setVersion(v);setPreview(p);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId]);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:FrameNote[]=[];let offset:number|null=0;do{const page: {notes: FrameNote[]; nextOffset: number | null}=await rpc.call("notes",{threadId,versionId,offset});all.push(...page.notes);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled)setNotes(all);})().catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId,reload]);
  useRealtime("changed",refresh);
  if(error&&!version)return <ErrorNotice>{error}</ErrorNotice>;
  if(!version||!preview)return <Notice>Opening version…</Notice>;
  return <><div className="video-markup-version-heading"><span className="text-xs text-muted-foreground">VERSION {version.ordinal}</span><h2 className="text-lg font-medium">{version.label}</h2>{version.summary&&<p className="text-sm text-muted-foreground">{version.summary}</p>}</div>
    <Player key={`player-${versionId}`} preview={preview} version={version} seekRequest={seekRequest} nextNoteNumber={notes.length+1} onDirty={dirtyChanged} onSave={async fields=>{await rpc.call("addNote",{threadId,versionId,...fields});refresh();}} />
    <NoteList key={`notes-${versionId}`} threadId={threadId} version={version} notes={notes} disabled={dirty} onRefresh={refresh} onSeek={note=>setSeekRequest({time:Math.min(note.timestamp,preview.media.duration||note.timestamp),shapes:note.frameVersionId===versionId ? note.shapes : [],sequence:Date.now(),noteNumber:notes.findIndex(n=>n.id===note.id)+1})} />
    {error&&<ErrorNotice>{error}</ErrorNotice>}</>;
}

export function VideoMarkupPanel({threadId,params}: PluginThreadPanelProps) {
  const rpc=useRpc<typeof videoMarkupContract>();
  const initial=params && typeof params==="object" && !Array.isArray(params) && typeof params.versionId==="string" ? params.versionId : null;
  const [versions,setVersions]=useState<Version[]>([]),[current,setCurrent]=useState<string|null>(initial),[demo,setDemo]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[registering,setRegistering]=useState(false),[dirty,setDirty]=useState(false);
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  useRealtime("changed",refresh);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:Version[]=[];let offset:number|null=0;do{const page: {versions: Version[]; nextOffset: number | null}=await rpc.call("versions",{threadId,offset});all.push(...page.versions);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled){setVersions(all);setCurrent(v=>v??all.at(-1)?.id??null);setLoading(false);}})().catch(e=>{if(!cancelled){setError(errorText(e));setLoading(false);}});return()=>{cancelled=true;};},[rpc,threadId,reload]);
  const active=versions.find(v=>v.id===current),activeDemo=demo??active?.demo??versions.at(-1)?.demo;
  const rail=versions.filter(v=>v.demo===activeDemo);
  return <main className="video-markup bg-background text-foreground">
    <header className="video-markup-header border-border"><div className="video-markup-row"><span className="video-markup-brand"><Clapperboard size={18}/>Video Markup</span><Button variant="ghost" size="sm" disabled={dirty} onClick={()=>setRegistering(v=>!v)}>{registering ? "Back to review" : "Add version"}</Button></div>
    {versions.length>0&&<Select value={activeDemo} disabled={dirty} onValueChange={value=>{setDemo(value);setCurrent(versions.filter(v=>v.demo===value).at(-1)?.id??null);}}><SelectTrigger aria-label="Demo" className="video-markup-demo"><SelectValue /></SelectTrigger><SelectContent>{[...new Set(versions.map(v=>v.demo))].map(name=><SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select>}
    </header>
    {error&&<ErrorNotice>{error}</ErrorNotice>}
    {loading ? <Notice>Loading demos…</Notice> : registering || !current ? <RegistrationForm threadId={threadId} onRegistered={v=>{setCurrent(v.id);setDemo(v.demo);setRegistering(false);refresh();}} /> : <>
      <nav aria-label="Demo versions" className="video-markup-rail border-border">{rail.map(v=><button key={v.id} disabled={dirty} aria-current={current===v.id ? "true" : undefined} className={`video-markup-version border-border ${current===v.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`} onClick={()=>setCurrent(v.id)}><span className="video-markup-version-number text-xs">{v.ordinal.toString().padStart(2,"0")}</span><span>{v.label}</span>{current===v.id&&<Check size={13}/>}</button>)}</nav>
      <div className="video-markup-review"><ReviewVersion key={current} threadId={threadId} versionId={current} onDirty={setDirty} /></div></>}
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
  return <main className="video-markup video-markup-review bg-background text-foreground">{error?<ErrorNotice>{error}</ErrorNotice>:version&&source.threadId?<ReviewVersion threadId={source.threadId} versionId={version.id}/>:preview?<><Player key={path} preview={preview} frameProbe={frameProbe}/>{source.threadId?<RegistrationForm threadId={source.threadId} file={path} source={source} onRegistered={setVersion}/>:<Notice>Open this video from a thread to save frame notes and versions.</Notice>}</>:<Notice>Opening video…</Notice>}</main>;
}

export function VideoMarkupInline({attributes,message}:PluginMessageDirectiveProps) {
  const rpc=useRpc<typeof videoMarkupContract>(),navigate=useBbNavigate();
  const [preview,setPreview]=useState<Preview|null>(null),[version,setVersion]=useState<Version|null>(null),[error,setError]=useState("");
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{let cancelled=false;setPreview(null);setVersion(null);setError("");void Promise.all([rpc.call("preview",{threadId:message.threadId,versionId:attributes.version??""}),rpc.call("version",{threadId:message.threadId,versionId:attributes.version??""})]).then(([p,v])=>{if(!cancelled){setPreview(p);setVersion(v);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,message.threadId,attributes.version]);
  return <section className="video-markup video-markup-inline border-border bg-background text-foreground"><header className="video-markup-row video-markup-inline-header border-border"><div><span className="video-markup-brand text-xs"><Clapperboard size={14}/>Video Markup</span>{version&&<p className="text-sm font-medium">{version.demo} <span className="text-muted-foreground">· {version.label}</span></p>}</div>{version&&<Button variant="ghost" size="sm" onClick={()=>{if(!navigate.openThreadPanel({actionId:"video-markup",params:{versionId:version.id}}))setExpanded(v=>!v);}}>Review notes</Button>}</header>
    {error?<ErrorNotice>{error}</ErrorNotice>:preview?<Player key={attributes.version} preview={preview} version={version??undefined} compact/>:<Notice>Loading video…</Notice>}
    {expanded&&version&&<VideoMarkupPanel threadId={message.threadId} params={{versionId:version.id}}/>}
  </section>;
}

export default definePluginApp(app=>{
  app.slots.threadPanelAction({id:"video-markup",title:"Video Markup",icon:"Clapperboard",layout:"flush",component:VideoMarkupPanel});
  app.slots.fileOpener({id:"video-markup-video",title:"Video Markup",extensions:VIDEO_EXTENSIONS,component:VideoMarkupFileViewer});
  app.slots.messageDirective({id:"video-markup",component:VideoMarkupInline});
});
