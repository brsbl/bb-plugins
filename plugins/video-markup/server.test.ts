import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { Context } from "hono";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import plugin from "./server.js";
import { openStore } from "./store.js";
import { noteInputSchema, noteSchema, stepTime, versionSchema, type Media } from "./model.js";

const media: Media = {path:"/demo/v1.mp4",hostId:"host_a",size:10,modifiedAt:1,duration:34,fps:60,codec:"h264",frameTimes:[0,1/60,2/60],width:1920,height:1080};
const still = {dataUrl:"data:image/jpeg;base64,/9j/2Q==",width:1280,height:720};
const cleanups: (()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0))await cleanup();});
function load() {const host=createFakePluginHost({pluginId:"video-markup"});plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());return host;}
function seed(host:ReturnType<typeof load>) {const store=openStore(host.bb);return store.register({threadId:"thr_demo",demo:"Duo",summary:"First review",media});}
function noteInput(versionId:string,text="Keep the composer in frame") {return noteInputSchema.parse({threadId:"thr_demo",versionId,timestamp:12.5,shapes:[{kind:"box",x1:.1,y1:.6,x2:.9,y2:.95}],text,still});}

describe("Video Markup persistence and feedback",()=>{
  it("presents videos through tools and CLI with filenames, demo defaults, and no duplicate versions",async()=>{
    const host=createFakePluginHost({pluginId:"video-markup",experimental_callHostRpc:async(call)=>{
      const {path,retain}=z.object({path:z.string(),retain:z.boolean()}).parse(call.input);
      const {hostId,...file}=media;
      return {...file,frameTimes:[],path:retain ? path.replace("/uploads/","/plugin/videos/") : path};
    }});
    plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());
    const source={kind:"host",threadId:null,environmentId:null,projectId:null,experimental_hostId:"host_a"};
    const input={threadId:"thr_demo",file:"/uploads/duo-v1.mp4",attachment:true,source};
    const first=JSON.parse(z.string().parse(await host.harness.behavior.callAgentTool("video_markup_present",input)));
    expect(first.version).toMatchObject({demo:"duo",ordinal:1,summary:"",media:{path:"/plugin/videos/duo-v1.mp4",duration:34,fps:60,codec:"h264",frameTimes:[]}});
    expect(stepTime(first.version.media,1,1)).toBeCloseTo(61/60);
    expect(first.directive).toBe(`::video-markup{version="${first.version.id}"}`);
    expect(host.harness.inspection.realtimeSignals).toContainEqual({channel:"present",payload:{threadId:"thr_demo",versionId:first.version.id}});
    const again=await host.harness.behavior.runCli(["present","--data",JSON.stringify(input)]);
    expect(again.exitCode).toBe(0);
    expect(JSON.parse(again.stdout).version.id).toBe(first.version.id);
    expect(JSON.parse(again.stdout).version.media).toMatchObject({duration:34,fps:60,codec:"h264"});
    const second=await host.harness.behavior.runCli(["present","--data",JSON.stringify({...input,file:"/renders/duo-v2.mp4",attachment:false}),"--summary","Gentler camera"]);
    expect(second.exitCode).toBe(0);
    expect(JSON.parse(second.stdout).version).toMatchObject({demo:"duo",ordinal:2,summary:"Gentler camera",media:{path:"/renders/duo-v2.mp4"}});
    await host.harness.behavior.callAgentTool("video_markup_present",{...input,demo:"Another",file:"/renders/another.mp4",attachment:false});
    await host.harness.behavior.callRpc("selectDemo",{threadId:"thr_demo",demo:"duo"});
    const next=JSON.parse(z.string().parse(await host.harness.behavior.callAgentTool("video_markup_present",{...input,file:"/renders/duo-v3.mp4",attachment:false})));
    expect(next.version).toMatchObject({demo:"duo",ordinal:3});
    expect((await host.harness.behavior.runCli(["present","--help"])).stdout).toContain("present");
  });
  it("persists notes and selections across plugin reload and isolates threads",async()=>{
    const host=load(),v=seed(host);
    const note=noteSchema.parse(await host.harness.behavior.callRpc("addNote",noteInput(v.id)));
    const selection=z.object({id:z.string()}).parse(await host.harness.behavior.callRpc("context",{threadId:"thr_demo",noteIds:[note.id]}));
    const reloaded=await host.harness.lifecycle.reload(plugin);cleanups.push(()=>reloaded.harness.lifecycle.dispose());
    const notes=await reloaded.harness.behavior.callRpc("notes",{threadId:"thr_demo",versionId:v.id});
    expect(notes).toMatchObject({notes:[{id:note.id,text:"Keep the composer in frame",timestamp:12.5}]});
    expect(await reloaded.harness.behavior.callRpc("notes",{threadId:"another"})).toEqual({notes:[],nextOffset:null});
    await expect(reloaded.harness.behavior.callRpc("frame",{threadId:"another",noteId:note.id})).rejects.toThrow();
    const resolved=await reloaded.harness.inspection.registrations.mentionProviders[0].resolve(selection.id);
    expect(JSON.parse(resolved.context).notes[0]).toMatchObject({id:note.id,version:"v1.mp4",frameVersion:"v1.mp4",timestamp:12.5});
    expect(resolved).toMatchObject({experimental_images:[{type:"image",url:still.dataUrl}]});
  });
  it("carries only unresolved notes, preserving original frame provenance and historical statuses",async()=>{
    const host=load(),store=openStore(host.bb),v1=seed(host);
    for(const status of ["open","fixed","still wrong","regressed"] as const){const note=store.addNote(noteInput(v1.id,status));store.setStatus("thr_demo",note.id,status);}
    const v2=store.register({threadId:"thr_demo",demo:"Duo",summary:"Revised",media:{...media,path:"/demo/v2.mp4"}});
    const next=store.notes("thr_demo").filter(n=>n.versionId===v2.id);
    expect(next.map(n=>n.status)).toEqual(["open","still wrong","regressed"]);
    expect(next.every(n=>n.frameVersionId===v1.id&&n.carriedFrom!==null)).toBe(true);
    expect(store.still("thr_demo",next[0].id)).toEqual(still);
    store.setStatus("thr_demo",next[0].id,"fixed");
    expect(store.note("thr_demo",next[0].carriedFrom!).status).toBe("open");
    const v3=store.register({threadId:"thr_demo",demo:"Duo",summary:"One more",media:{...media,path:"/demo/v3.mp4"}});
    expect(store.notes("thr_demo").filter(n=>n.versionId===v3.id).map(n=>n.status)).toEqual(["still wrong","regressed"]);
  });
  it("applies a status set on a sent note to its copies in later renders",async()=>{
    const host=load(),store=openStore(host.bb),v1=seed(host),sent=store.addNote(noteInput(v1.id));
    const v2=store.register({threadId:"thr_demo",demo:"Duo",summary:"Revised",media:{...media,path:"/demo/v2.mp4"}});
    store.setStatus("thr_demo",sent.id,"fixed");
    expect(store.notes("thr_demo").map(n=>[n.versionId,n.status])).toEqual([[v1.id,"fixed"],[v2.id,"fixed"]]);
  });
  it("rejects invalid regions, timestamps outside the video, and fixed prompt selections",async()=>{
    const host=load(),v=seed(host),input=noteInput(v.id);
    await expect(host.harness.behavior.callRpc("addNote",{...input,shapes:[{kind:"box",x1:-1,y1:0,x2:1,y2:1}]})).rejects.toThrow();
    await expect(host.harness.behavior.callRpc("addNote",{...input,timestamp:100})).rejects.toThrow();
    const store=openStore(host.bb),note=store.addNote(input);store.setStatus("thr_demo",note.id,"fixed");
    await expect(host.harness.behavior.callRpc("context",{threadId:"thr_demo",noteIds:[note.id]})).rejects.toThrow();
  });
  it.each(["tools","CLI"])("creates and lists timestamped notes and includes them in prompt context through %s",async(transport)=>{
    const host=load(),v=seed(host),input=noteInput(v.id);
    async function run(command:string,tool:string,data:unknown) {
      if(transport==="tools") return JSON.parse(z.string().parse(await host.harness.behavior.callAgentTool(tool,data)));
      const result=await host.harness.behavior.runCli([command,"--data",JSON.stringify(data),"--json"]);
      expect(result.exitCode).toBe(0);
      return JSON.parse(result.stdout);
    }
    const note=await run("add-note","video_markup_add_note",input);
    const {still:capturedStill,...fields}=input;
    expect(note).toEqual({...fields,id:expect.any(String),demo:v.demo,frameVersionId:v.id,status:"open",createdAt:expect.any(Number),updatedAt:expect.any(Number),carriedFrom:null,stillId:note.id});
    expect(await run("notes","video_markup_list_notes",{threadId:"thr_demo",versionId:v.id})).toEqual({notes:[note],nextOffset:null});
    const context=await run("context","video_markup_context",{threadId:"thr_demo",noteIds:[note.id]});
    expect(context.count).toBe(1);
    expect(JSON.parse(context.context).notes).toEqual([{...note,version:"v1.mp4",frameVersion:"v1.mp4",moment:"00:12.500",still:{tool:"video_markup_frame",noteId:note.id}}]);
    expect(openStore(host.bb).still("thr_demo",note.id)).toEqual(capturedStill);
  });
  it("routes CLI and native tools through the same status, frame, and inline-player operations",async()=>{
    const host=load(),v=seed(host),note=openStore(host.bb).addNote(noteInput(v.id));
    expect(await host.harness.behavior.runCli(["status","--thread","thr_demo","--note",note.id,"--status","regressed"])).toMatchObject({exitCode:0});
    expect(await host.harness.behavior.callAgentTool("video_markup_list_notes",{threadId:"thr_demo",versionId:v.id,status:"regressed"})).toContain(note.id);
    expect(await host.harness.behavior.callAgentTool("video_markup_frame",{threadId:"thr_demo",noteId:note.id})).toMatchObject({content:[{type:"image",mimeType:"image/jpeg"}]});
    const post=await host.harness.behavior.runCli(["post","--thread","thr_demo","--version",v.id]);
    expect(JSON.parse(post.stdout).directive).toBe(`::video-markup{version="${v.id}"}`);
    expect((await host.harness.behavior.runCli(["status","--thread","thr_demo","--note",note.id,"--status","done"])).exitCode).toBe(1);
  });
  it("opens a playable file without waiting for a slow frame probe",async()=>{
    const host=createFakePluginHost({pluginId:"video-markup",experimental_callHostRpc:async(call)=>{
      if(call.method==="readChunk") return {data:Buffer.from("01").toString("base64")};
      const {probe}=z.object({probe:z.boolean()}).parse(call.input);
      if(probe) {
        await new Promise(resolve=>setTimeout(resolve,50));
        throw new Error("Slow frame probe exceeded the host deadline");
      }
      const {hostId,...file}=media;
      return {...file,duration:0,fps:null,width:0,height:0,frameTimes:[]};
    }});
    plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());
    const preview=z.object({url:z.string(),media:z.object({duration:z.number(),frameTimes:z.array(z.number())})}).parse(await host.harness.behavior.callRpc("openFile",{file:media.path,source:{kind:"host",threadId:null,environmentId:null,projectId:null,experimental_hostId:"host_a"}}));
    expect(preview.media).toEqual({duration:0,frameTimes:[]});
    const url=new URL(preview.url,"http://plugin.test");
    const response=await host.harness.behavior.fetchHttp("GET",url.pathname.replace("/api/v1/plugins/video-markup/http","")+url.search,{headers:{range:"bytes=0-1"}});
    expect(response.status).toBe(206);
    expect(await response.text()).toBe("01");
  });
  it("serves preview URLs through literal routes with HEAD and Safari seek ranges, and detects replacement",async()=>{
    let modifiedAt=1;
    let reads=0;
    const host=createFakePluginHost({pluginId:"video-markup",experimental_callHostRpc:async(call)=>{
      expect(call.hostId).toBe("host_a");
      if(call.method==="readChunk"){
        reads++;
        const {start,length}=z.object({start:z.number(),length:z.number()}).parse(call.input);
        return {data:Buffer.from("0123456789").subarray(start,start+length).toString("base64")};
      }
      const {hostId,...rest}=media;return {...rest,modifiedAt};
    }});
    plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());
    const version=versionSchema.parse(await host.harness.behavior.callRpc("register",{threadId:"thr_demo",demo:"Duo",file:"/demo/v1.mp4",source:{kind:"host",threadId:null,environmentId:null,projectId:null,experimental_hostId:"host_a"}}));
    const preview=z.object({url:z.string()}).parse(await host.harness.behavior.callRpc("preview",{threadId:"thr_demo",versionId:version.id}));
    const url=new URL(preview.url,"http://plugin.test");
    const route=url.pathname.replace("/api/v1/plugins/video-markup/http","")+url.search;
    // The pinned harness's fetchHttp builds a HEAD-only Hono app, but Hono
    // dispatches HEAD as GET. Match literally and invoke as BB's router does.
    const headRoute=host.harness.inspection.registrations.httpRoutes.find(r=>r.method==="HEAD"&&r.path===url.pathname.replace("/api/v1/plugins/video-markup/http",""));
    expect(headRoute).toBeDefined();
    const head=await headRoute!.handler(new Context(new Request(url,{method:"HEAD"})));
    expect(head.status).toBe(200);expect(head.headers.get("content-length")).toBe("10");
    expect(await head.text()).toBe("");expect(reads).toBe(0);
    expect(url.pathname).toBe("/api/v1/plugins/video-markup/http/media");
    expect(url.searchParams.get("lease")).toBeTruthy();
    for(const [range,body,contentRange] of [["bytes=0-1","01","bytes 0-1/10"],["bytes=7-","789","bytes 7-9/10"],["bytes=-3","789","bytes 7-9/10"]]){
      const response=await host.harness.behavior.fetchHttp("GET",route,{headers:{range}});
      expect(response.status).toBe(206);expect(response.headers.get("accept-ranges")).toBe("bytes");
      expect(response.headers.get("content-range")).toBe(contentRange);
      expect(response.headers.get("content-length")).toBe(String(body.length));
      expect(await response.text()).toBe(body);
    }
    expect((await host.harness.behavior.fetchHttp("GET","/media?lease=unknown")).status).toBe(404);
    modifiedAt=2;
    await expect(host.harness.behavior.callRpc("preview",{threadId:"thr_demo",versionId:version.id})).rejects.toThrow(/changed on disk/);
  });
});

describe("frame stepping",()=>{
  it("uses presentation timestamps in both directions for variable-rate video",()=>{
    const m={frameTimes:[0,.016,.049,.081],fps:30,duration:1};
    expect(stepTime(m,.016,1)).toBe(.049);expect(stepTime(m,.049,-1)).toBe(.016);expect(stepTime(m,0,-1)).toBe(0);expect(stepTime(m,.081,1)).toBe(.081);
  });
  it("steps a known CFR source and keeps both boundaries valid",()=>{
    const m={frameTimes:[],fps:60,duration:1};expect(stepTime(m,.5,1)).toBeCloseTo(31/60);expect(stepTime(m,0,-1)).toBe(0);expect(stepTime(m,1,1)).toBeCloseTo(59/60);
  });
});
