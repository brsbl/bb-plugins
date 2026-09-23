import { useCallback, useEffect, useId, useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Clapperboard, CornerUpLeft, Maximize2, MessageSquarePlus, Pause, Play, Send, Square, X } from "lucide-react";
import { definePluginApp, useBbNavigate, useComposer, useRealtime, useRpc, type PluginFileOpenerProps, type PluginMessageDirectiveProps, type PluginThreadPanelProps } from "@get-bb/plugin-sdk/app";
import { Button } from "./components/ui/button.js";
import { Input } from "./components/ui/input.js";
import { isActionable, MENTION_PROVIDER, stepTime, timecode, VIDEO_EXTENSIONS, type FrameNote, type Media, type NoteStatus, type Shape, type Still, type Version } from "./model.js";
import type { directorContract } from "./server.js";
import "./app.css";

type Rpc = ReturnType<typeof useRpc<typeof directorContract>>;
type Preview = {url: string; expiresAt: number; media: Media};
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error);
const statuses: NoteStatus[] = ["open", "fixed", "still wrong", "regressed"];
function Notice({children}: {children: ReactNode}) { return <p role="status" className="director-notice text-muted-foreground">{children}</p>; }
function ErrorNotice({children}: {children: ReactNode}) { return <p role="alert" className="director-notice text-destructive">{children}</p>; }
function IconButton({label, children, ...props}: {label: string; children: ReactNode} & React.ComponentProps<typeof Button>) {
  return <Button type="button" variant="ghost" size="icon" aria-label={label} {...props}>{children}</Button>;
}

export function ShapeOverlay({shapes}: {shapes: Shape[]}) {
  const marker = useId().replace(/:/g, "");
  return <svg className="director-shapes text-foreground" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
    <defs><marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" /></marker></defs>
    {shapes.map((s, i) => s.kind === "arrow"
      ? <line key={i} x1={s.x1 * 1000} y1={s.y1 * 1000} x2={s.x2 * 1000} y2={s.y2 * 1000} stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" markerEnd={`url(#${marker})`} />
      : <rect key={i} x={Math.min(s.x1, s.x2) * 1000} y={Math.min(s.y1, s.y2) * 1000} width={Math.abs(s.x2-s.x1) * 1000} height={Math.abs(s.y2-s.y1) * 1000} fill="none" stroke="currentColor" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeDasharray={s.kind === "zoom" ? "8 5" : undefined} />)}
  </svg>;
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

function Player({preview, version, onSave, onDirty, compact = false, seekRequest}: {
  preview: Preview; version?: Version; onSave?: (fields: {timestamp: number; endTime: number | null; text: string; shapes: Shape[]; still: Still}) => Promise<void>;
  onDirty?: (value: boolean) => void; compact?: boolean; seekRequest?: {time: number; shapes: Shape[]; sequence: number};
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0), [duration, setDuration] = useState(preview.media.duration);
  const [playing, setPlaying] = useState(false), [ready, setReady] = useState(false), [seeking, setSeeking] = useState(false);
  const [aspect, setAspect] = useState(preview.media.width && preview.media.height ? preview.media.width / preview.media.height : 16/9);
  const [draft, setDraft] = useState<{timestamp: number; still: Still} | null>(null);
  const [tool, setTool] = useState<Shape["kind"] | null>(null), [shapes, setShapes] = useState<Shape[]>([]), [drawing, setDrawing] = useState<Shape | null>(null);
  const [text, setText] = useState(""), [endTime, setEndTime] = useState<number | null>(null), [rangeMode, setRangeMode] = useState(false);
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
  function cancel() { setDraft(null); setTool(null); setShapes([]); setText(""); setEndTime(null); setRangeMode(false); onDirty?.(false); }
  function point(e: PointerEvent<HTMLDivElement>) { const r = e.currentTarget.getBoundingClientRect(); return {x: Math.max(0, Math.min(1, (e.clientX-r.left)/r.width)), y: Math.max(0, Math.min(1, (e.clientY-r.top)/r.height))}; }
  return <section className="director-player" tabIndex={0} aria-label="Video review player" onKeyDown={e => {
    if ((e.target as HTMLElement).closest("input,textarea,select,button") || draft || busy || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === " ") { e.preventDefault(); void togglePlay(); }
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); step(e.key === "ArrowLeft" ? -1 : 1); }
  }}>
    <div className="director-stage bg-muted" style={{aspectRatio: aspect}}>
      <video ref={video} src={preview.url} playsInline preload="metadata" crossOrigin="anonymous" aria-label={version?.label ?? "Video preview"}
        onLoadedMetadata={e => { const v=e.currentTarget; setDuration(v.duration); setAspect(v.videoWidth/v.videoHeight || 16/9); }}
        onLoadedData={() => setReady(true)} onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onSeeking={() => setSeeking(true)} onSeeked={() => setSeeking(false)}
        onError={() => setError("This browser cannot play the file or its preview expired. Reload the version; for MOV codec compatibility, render an H.264 MP4 review copy.")} />
      {shapes.length > 0 || drawing ? <ShapeOverlay shapes={[...shapes, ...(drawing ? [drawing] : [])]} /> : null}
      {draft && tool && <div className="director-draw" aria-label={`Draw ${tool} on the paused frame`} onPointerDown={e => {
        if (shapes.length >= 30) return; e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); const p = point(e);
        gesture.current = {kind: tool, x1:p.x,y1:p.y,x2:p.x,y2:p.y}; setDrawing(gesture.current);
      }} onPointerMove={e => { if (!gesture.current) return; const p=point(e); gesture.current={...gesture.current,x2:p.x,y2:p.y};setDrawing(gesture.current); }}
      onPointerUp={() => { const s=gesture.current; if (s && Math.hypot(s.x2-s.x1,s.y2-s.y1) > .005) setShapes(current => [...current,s]); gesture.current=null;setDrawing(null); }}
      onPointerCancel={() => {gesture.current=null;setDrawing(null);}} />}
    </div>
    <div className="director-transport border-border">
      <IconButton label={playing ? "Pause" : "Play"} disabled={!ready || !!draft || busy} onClick={() => void togglePlay()}>{playing ? <Pause /> : <Play />}</IconButton>
      {!compact && <><IconButton label="Previous frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(-1)}><ChevronLeft /></IconButton><IconButton label="Next frame" disabled={!ready || !canStep || !!draft || busy || seeking} onClick={() => step(1)}><ChevronRight /></IconButton></>}
      <output className="director-time text-muted-foreground">{timecode(time)} <span>/ {timecode(duration || 0)}</span></output>
      <IconButton label="Fullscreen video" disabled={busy || !!draft} onClick={() => { void video.current?.requestFullscreen?.().catch(e => setError(errorText(e))); }}><Maximize2 /></IconButton>
    </div>
    <input className="director-seek" aria-label="Video time" type="range" min="0" max={duration || 0} step="any" value={time} disabled={!ready || !!draft || busy} onChange={e => {setShapes([]);seek(Number(e.target.value));}} />
    {onSave && <div className="director-tools">
      <Button variant={draft && !tool ? "secondary" : "ghost"} size="sm" disabled={!ready || seeking || busy} onClick={() => void beginNote()}><MessageSquarePlus /> Note frame</Button>
      {([['box', Square, 'Box'], ['arrow', ArrowRight, 'Arrow'], ['zoom', Maximize2, 'Zoom region']] as const).map(([kind, Icon, label]) => <Button key={kind} variant={tool===kind ? "secondary" : "ghost"} size="sm" aria-pressed={tool===kind} disabled={!ready || seeking || busy} onClick={() => void beginNote(kind)}><Icon />{label}</Button>)}
    </div>}
    {draft && <form className="director-note-editor border-border" onSubmit={e => {
      e.preventDefault(); if (!onSave || !text.trim()) return; setBusy(true);setError("");
      void onSave({timestamp:draft.timestamp, still:draft.still, shapes, text:text.trim(), endTime}).then(cancel).catch(e => setError(errorText(e))).finally(() => setBusy(false));
    }}>
      <div className="director-row"><span className="text-muted-foreground text-xs">Frame at {timecode(draft.timestamp)}{endTime !== null ? ` → ${timecode(endTime)}` : ""}</span><IconButton label="Undo last shape" disabled={!shapes.length || busy} onClick={() => setShapes(v => v.slice(0,-1))}><CornerUpLeft /></IconButton></div>
      <textarea autoFocus aria-label="Frame note" placeholder="What should change at this moment?" value={text} maxLength={8000} onChange={e => setText(e.target.value)} className="director-textarea border-input bg-background text-foreground" disabled={busy} />
      <label className="director-range-toggle text-muted-foreground"><input type="checkbox" checked={rangeMode} disabled={busy} onChange={e => {setRangeMode(e.target.checked);setEndTime(e.target.checked ? draft.timestamp : null);}} /> Include a time range</label>
      {rangeMode && <label className="text-xs text-muted-foreground">Drag to the end of the moment<input aria-label="Note range end" className="director-seek" type="range" min={draft.timestamp} max={duration} step={preview.media.fps ? 1/preview.media.fps : .001} value={endTime ?? draft.timestamp} disabled={busy} onChange={e => setEndTime(Number(e.target.value))} /></label>}
      <div className="director-row"><span className="text-xs text-muted-foreground">{shapes.length ? `${shapes.length} drawn region${shapes.length===1 ? "" : "s"}` : "Frame still attached"}</span><div className="director-actions"><Button type="button" variant="ghost" size="sm" onClick={cancel} disabled={busy}>Cancel</Button><Button size="sm" disabled={!text.trim() || busy}>{busy ? "Saving…" : "Save note"}</Button></div></div>
    </form>}
    {!compact && !canStep && <Notice>Frame stepping needs ffprobe on the video's machine or a known constant frame rate supplied when registering.</Notice>}
    {error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function RegistrationForm({threadId, file, source, onRegistered}: {threadId: string; file?: string; source?: PluginFileOpenerProps["source"]; onRegistered: (version: Version) => void}) {
  const rpc = useRpc<typeof directorContract>();
  const [demo,setDemo]=useState(""),[label,setLabel]=useState(""),[location,setLocation]=useState(file ?? ""),[summary,setSummary]=useState(""),[fps,setFps]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  return <form className="director-register" onSubmit={e => {e.preventDefault();setBusy(true);setError("");void rpc.call("register",{threadId,demo,label,file:location,summary,...(source ? {source} : {}),...(fps ? {fps:Number(fps)} : {})}).then(onRegistered).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));}}>
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
  const rpc=useRpc<typeof directorContract>(),composer=useComposer();
  const [selected,setSelected]=useState<string[]>([]),[filter,setFilter]=useState("actionable"),[error,setError]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
  const [still,setStill]=useState<{note:FrameNote;image:Still}|null>(null);
  const actionable=notes.filter(n=>isActionable(n.status));
  const validSelected=selected.filter(id=>actionable.some(n=>n.id===id));
  const visible=notes.filter(n=>filter==="all" || (filter==="actionable" ? isActionable(n.status) : n.status===filter));
  async function addToPrompt() {
    setBusy(true);setError("");
    try {const result=await rpc.call("context",{threadId,noteIds:validSelected});composer.insertMention({provider:MENTION_PROVIDER,id:result.id,label:`${version.demo} · ${result.count} frame note${result.count===1 ? "" : "s"}`});composer.focus();setNotice(`${result.count} notes and frame stills added to the prompt.`);setSelected([]);} catch(e){setError(errorText(e));}finally{setBusy(false);}
  }
  return <section className="director-notes">
    <div className="director-row"><h3 className="font-medium">Frame notes <span className="text-muted-foreground">{actionable.length}</span></h3><select aria-label="Filter notes" value={filter} onChange={e=>setFilter(e.target.value)} className="director-select border-input bg-background"><option value="actionable">Needs attention</option><option value="all">All notes</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
    {notes.length>0 && <div className="director-row"><label className="text-xs text-muted-foreground director-check"><input type="checkbox" checked={actionable.length>0 && validSelected.length===Math.min(12,actionable.length)} onChange={e=>setSelected(e.target.checked ? actionable.slice(0,12).map(n=>n.id) : [])} />Select open notes</label><Button size="sm" disabled={!validSelected.length || busy} onClick={()=>void addToPrompt()}><Send />Add to prompt{validSelected.length ? ` (${validSelected.length})` : ""}</Button></div>}
    {!visible.length && <Notice>{notes.length ? "No notes in this view." : "Pause at a moment, mark a region, and leave a note."}</Notice>}
    {visible.map(note=><article key={note.id} className="director-note border-border">
      <div className="director-row"><label className="director-check"><input aria-label={`Select note at ${timecode(note.timestamp)}`} type="checkbox" checked={validSelected.includes(note.id)} disabled={!isActionable(note.status) || (!validSelected.includes(note.id)&&validSelected.length>=12)} onChange={e=>setSelected(v=>e.target.checked ? [...v,note.id] : v.filter(id=>id!==note.id))} /><button className="director-moment text-foreground" disabled={disabled} onClick={()=>onSeek(note)}>{timecode(note.timestamp)}{note.endTime!==null ? `–${timecode(note.endTime)}` : ""}</button></label>
      <select aria-label={`Status for note at ${timecode(note.timestamp)}`} className="director-select border-input bg-background" value={note.status} disabled={busy} onChange={e=>{setBusy(true);void rpc.call("status",{threadId,noteId:note.id,status:e.target.value as NoteStatus}).then(onRefresh).catch(e=>setError(errorText(e))).finally(()=>setBusy(false));}}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>
      <p className="director-note-text">{note.text}</p>
      <div className="director-row text-xs text-muted-foreground"><span>{note.carriedFrom ? "Carried forward · original frame" : `${note.shapes.length} region${note.shapes.length===1 ? "" : "s"}`}</span><Button variant="ghost" size="sm" onClick={()=>{void rpc.call("frame",{threadId,noteId:note.id}).then(image=>setStill({note,image})).catch(e=>setError(errorText(e)));}}>View still</Button></div>
    </article>)}
    {still && <div className="director-still border-border"><div className="director-row"><span className="text-xs text-muted-foreground">Captured frame · {timecode(still.note.timestamp)}{still.note.carriedFrom ? " · earlier version" : ""}</span><IconButton label="Close still" onClick={()=>setStill(null)}><X /></IconButton></div><div className="director-stage"><img src={still.image.dataUrl} alt={`Frame at ${timecode(still.note.timestamp)}: ${still.note.text}`} /><ShapeOverlay shapes={still.note.shapes} /></div></div>}
    {notice && <Notice>{notice}</Notice>}{error && <ErrorNotice>{error}</ErrorNotice>}
  </section>;
}

function ReviewVersion({threadId,versionId,onDirty}: {threadId:string;versionId:string;onDirty?:(dirty:boolean)=>void}) {
  const rpc=useRpc<typeof directorContract>();
  const [version,setVersion]=useState<Version|null>(null),[preview,setPreview]=useState<Preview|null>(null),[notes,setNotes]=useState<FrameNote[]>([]),[error,setError]=useState(""),[reload,setReload]=useState(0),[dirty,setDirty]=useState(false);
  const [seekRequest,setSeekRequest]=useState<{time:number;shapes:Shape[];sequence:number}>();
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  const dirtyChanged=useCallback((value:boolean)=>{setDirty(value);onDirty?.(value);},[onDirty]);
  useEffect(()=>{let cancelled=false;setError("");setPreview(null);setVersion(null);void Promise.all([rpc.call("version",{threadId,versionId}),rpc.call("preview",{threadId,versionId})]).then(([v,p])=>{if(!cancelled){setVersion(v);setPreview(p);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId]);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:FrameNote[]=[];let offset:number|null=0;do{const page: {notes: FrameNote[]; nextOffset: number | null}=await rpc.call("notes",{threadId,versionId,offset});all.push(...page.notes);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled)setNotes(all);})().catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,threadId,versionId,reload]);
  useRealtime("changed",refresh);
  if(error&&!version)return <ErrorNotice>{error}</ErrorNotice>;
  if(!version||!preview)return <Notice>Opening version…</Notice>;
  return <><div className="director-version-heading"><span className="text-xs text-muted-foreground">VERSION {version.ordinal}</span><h2 className="text-lg font-medium">{version.label}</h2>{version.summary&&<p className="text-sm text-muted-foreground">{version.summary}</p>}</div>
    <Player key={`player-${versionId}`} preview={preview} version={version} seekRequest={seekRequest} onDirty={dirtyChanged} onSave={async fields=>{await rpc.call("addNote",{threadId,versionId,...fields});refresh();}} />
    <NoteList key={`notes-${versionId}`} threadId={threadId} version={version} notes={notes} disabled={dirty} onRefresh={refresh} onSeek={note=>setSeekRequest({time:Math.min(note.timestamp,preview.media.duration||note.timestamp),shapes:note.frameVersionId===versionId ? note.shapes : [],sequence:Date.now()})} />
    {error&&<ErrorNotice>{error}</ErrorNotice>}</>;
}

export function DirectorPanel({threadId,params}: PluginThreadPanelProps) {
  const rpc=useRpc<typeof directorContract>();
  const initial=params && typeof params==="object" && !Array.isArray(params) && typeof params.versionId==="string" ? params.versionId : null;
  const [versions,setVersions]=useState<Version[]>([]),[current,setCurrent]=useState<string|null>(initial),[demo,setDemo]=useState<string|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true),[reload,setReload]=useState(0),[registering,setRegistering]=useState(false),[dirty,setDirty]=useState(false);
  const refresh=useCallback(()=>setReload(n=>n+1),[]);
  useRealtime("changed",refresh);
  useEffect(()=>{let cancelled=false;void(async()=>{const all:Version[]=[];let offset:number|null=0;do{const page: {versions: Version[]; nextOffset: number | null}=await rpc.call("versions",{threadId,offset});all.push(...page.versions);offset=page.nextOffset;}while(offset!==null&&!cancelled);if(!cancelled){setVersions(all);setCurrent(v=>v??all.at(-1)?.id??null);setLoading(false);}})().catch(e=>{if(!cancelled){setError(errorText(e));setLoading(false);}});return()=>{cancelled=true;};},[rpc,threadId,reload]);
  const active=versions.find(v=>v.id===current),activeDemo=demo??active?.demo??versions.at(-1)?.demo;
  const rail=versions.filter(v=>v.demo===activeDemo);
  return <main className="director bg-background text-foreground">
    <header className="director-header border-border"><div className="director-row"><span className="director-brand"><Clapperboard size={18}/>Director</span><Button variant="ghost" size="sm" disabled={dirty} onClick={()=>setRegistering(v=>!v)}>{registering ? "Back to review" : "Add version"}</Button></div>
    {versions.length>0&&<select aria-label="Demo" className="director-demo bg-background" value={activeDemo} disabled={dirty} onChange={e=>{setDemo(e.target.value);setCurrent(versions.filter(v=>v.demo===e.target.value).at(-1)?.id??null);}}>{[...new Set(versions.map(v=>v.demo))].map(name=><option key={name}>{name}</option>)}</select>}
    </header>
    {error&&<ErrorNotice>{error}</ErrorNotice>}
    {loading ? <Notice>Loading demos…</Notice> : registering || !current ? <RegistrationForm threadId={threadId} onRegistered={v=>{setCurrent(v.id);setDemo(v.demo);setRegistering(false);refresh();}} /> : <>
      <nav aria-label="Demo versions" className="director-rail border-border">{rail.map(v=><button key={v.id} disabled={dirty} aria-current={current===v.id ? "true" : undefined} className={`director-version border-border ${current===v.id ? "bg-secondary text-secondary-foreground" : "text-muted-foreground"}`} onClick={()=>setCurrent(v.id)}><span className="director-version-number">{v.ordinal.toString().padStart(2,"0")}</span><span>{v.label}</span>{current===v.id&&<Check size={13}/>}</button>)}</nav>
      <div className="director-review"><ReviewVersion key={current} threadId={threadId} versionId={current} onDirty={setDirty} /></div></>}
  </main>;
}

export function DirectorFileViewer({path,source}: PluginFileOpenerProps) {
  const rpc=useRpc<typeof directorContract>();
  const [preview,setPreview]=useState<Preview|null>(null),[version,setVersion]=useState<Version|null>(null),[error,setError]=useState("");
  const sourceKey=JSON.stringify(source);
  useEffect(()=>{let cancelled=false;setPreview(null);setVersion(null);setError("");void(async()=>{
    const p=await rpc.call("openFile",{file:path,source}); if(cancelled)return;setPreview(p);
    if(source.threadId){let offset:number|null=0;do{const result: {versions: Version[]; nextOffset: number | null}=await rpc.call("versions",{threadId:source.threadId,offset});const found=result.versions.find(v=>v.media.path===p.media.path && v.media.hostId===p.media.hostId && v.media.modifiedAt===p.media.modifiedAt);if(found){if(!cancelled)setVersion(found);break;}offset=result.nextOffset;}while(offset!==null&&!cancelled);}
  })().catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[path,sourceKey,rpc]);
  return <main className="director director-review bg-background text-foreground">{error?<ErrorNotice>{error}</ErrorNotice>:version&&source.threadId?<ReviewVersion threadId={source.threadId} versionId={version.id}/>:preview?<><Player key={path} preview={preview}/>{source.threadId?<RegistrationForm threadId={source.threadId} file={path} source={source} onRegistered={setVersion}/>:<Notice>Open this video from a thread to save frame notes and versions.</Notice>}</>:<Notice>Opening video…</Notice>}</main>;
}

export function DirectorInline({attributes,message}:PluginMessageDirectiveProps) {
  const rpc=useRpc<typeof directorContract>(),navigate=useBbNavigate();
  const [preview,setPreview]=useState<Preview|null>(null),[version,setVersion]=useState<Version|null>(null),[error,setError]=useState("");
  const [expanded,setExpanded]=useState(false);
  useEffect(()=>{let cancelled=false;setPreview(null);setVersion(null);setError("");void Promise.all([rpc.call("preview",{threadId:message.threadId,versionId:attributes.version??""}),rpc.call("version",{threadId:message.threadId,versionId:attributes.version??""})]).then(([p,v])=>{if(!cancelled){setPreview(p);setVersion(v);}}).catch(e=>{if(!cancelled)setError(errorText(e));});return()=>{cancelled=true;};},[rpc,message.threadId,attributes.version]);
  return <section className="director director-inline border-border bg-background text-foreground"><header className="director-row director-inline-header border-border"><div><span className="director-brand text-xs"><Clapperboard size={14}/>Director</span>{version&&<p className="text-sm font-medium">{version.demo} <span className="text-muted-foreground">· {version.label}</span></p>}</div>{version&&<Button variant="ghost" size="sm" onClick={()=>{if(!navigate.openThreadPanel({actionId:"director",params:{versionId:version.id}}))setExpanded(v=>!v);}}>Review notes</Button>}</header>
    {error?<ErrorNotice>{error}</ErrorNotice>:preview?<Player key={attributes.version} preview={preview} version={version??undefined} compact/>:<Notice>Loading video…</Notice>}
    {expanded&&version&&<DirectorPanel threadId={message.threadId} params={{versionId:version.id}}/>}
  </section>;
}

export default definePluginApp(app=>{
  app.slots.threadPanelAction({id:"director",title:"Director",icon:"Clapperboard",layout:"flush",component:DirectorPanel});
  app.slots.fileOpener({id:"director-video",title:"Director",extensions:VIDEO_EXTENSIONS,component:DirectorFileViewer});
  app.slots.messageDirective({id:"director",component:DirectorInline});
});
