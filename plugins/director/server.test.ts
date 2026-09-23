import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import { afterEach, describe, expect, it } from "vitest";
import { z } from "zod";
import plugin from "./server.js";
import { openStore } from "./store.js";
import { noteInputSchema, noteSchema, stepTime, versionSchema, type Media } from "./model.js";

const media: Media = {path:"/demo/v1.mp4",hostId:"host_a",size:10,modifiedAt:1,duration:34,fps:60,frameTimes:[0,1/60,2/60],width:1920,height:1080};
const still = {dataUrl:"data:image/jpeg;base64,/9j/2Q==",width:1280,height:720};
const cleanups: (()=>Promise<void>)[]=[];
afterEach(async()=>{for(const cleanup of cleanups.splice(0))await cleanup();});
function load() {const host=createFakePluginHost({pluginId:"director"});plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());return host;}
function seed(host:ReturnType<typeof load>) {const store=openStore(host.bb);return store.register({threadId:"thr_demo",demo:"Duo",label:"v1",summary:"First review",media});}
function noteInput(versionId:string,text="Keep the composer in frame") {return noteInputSchema.parse({threadId:"thr_demo",versionId,timestamp:12.5,endTime:14,shapes:[{kind:"box",x1:.1,y1:.6,x2:.9,y2:.95}],text,still});}

describe("Director persistence and feedback",()=>{
  it("persists notes and selections across plugin reload and isolates threads",async()=>{
    const host=load(),v=seed(host);
    const note=noteSchema.parse(await host.harness.behavior.callRpc("addNote",noteInput(v.id)));
    const selection=z.object({id:z.string()}).parse(await host.harness.behavior.callRpc("context",{threadId:"thr_demo",noteIds:[note.id]}));
    const reloaded=await host.harness.lifecycle.reload(plugin);cleanups.push(()=>reloaded.harness.lifecycle.dispose());
    const notes=await reloaded.harness.behavior.callRpc("notes",{threadId:"thr_demo",versionId:v.id});
    expect(notes).toMatchObject({notes:[{id:note.id,text:"Keep the composer in frame",endTime:14}]});
    expect(await reloaded.harness.behavior.callRpc("notes",{threadId:"another"})).toEqual({notes:[],nextOffset:null});
    await expect(reloaded.harness.behavior.callRpc("frame",{threadId:"another",noteId:note.id})).rejects.toThrow();
    const resolved=await reloaded.harness.inspection.registrations.mentionProviders[0].resolve(selection.id);
    expect(JSON.parse(resolved.context).notes[0]).toMatchObject({id:note.id,version:"v1",frameVersion:"v1",timestamp:12.5});
    expect(resolved).toMatchObject({experimental_images:[{type:"image",url:still.dataUrl}]});
  });
  it("carries only unresolved notes, preserving original frame provenance and historical statuses",async()=>{
    const host=load(),store=openStore(host.bb),v1=seed(host);
    for(const status of ["open","fixed","still wrong","regressed"] as const){const note=store.addNote(noteInput(v1.id,status));store.setStatus("thr_demo",note.id,status);}
    const v2=store.register({threadId:"thr_demo",demo:"Duo",label:"v2",summary:"Revised",media:{...media,path:"/demo/v2.mp4"}});
    const next=store.notes("thr_demo").filter(n=>n.versionId===v2.id);
    expect(next.map(n=>n.status)).toEqual(["open","still wrong","regressed"]);
    expect(next.every(n=>n.frameVersionId===v1.id&&n.carriedFrom!==null)).toBe(true);
    expect(store.still("thr_demo",next[0].id)).toEqual(still);
    store.setStatus("thr_demo",next[0].id,"fixed");
    expect(store.note("thr_demo",next[0].carriedFrom!).status).toBe("open");
    const v3=store.register({threadId:"thr_demo",demo:"Duo",label:"v3",summary:"One more",media:{...media,path:"/demo/v3.mp4"}});
    expect(store.notes("thr_demo").filter(n=>n.versionId===v3.id).map(n=>n.status)).toEqual(["still wrong","regressed"]);
  });
  it("rejects invalid regions, reversed ranges, duplicate labels, and fixed prompt selections",async()=>{
    const host=load(),v=seed(host),input=noteInput(v.id);
    await expect(host.harness.behavior.callRpc("addNote",{...input,shapes:[{kind:"box",x1:-1,y1:0,x2:1,y2:1}]})).rejects.toThrow();
    await expect(host.harness.behavior.callRpc("addNote",{...input,endTime:1})).rejects.toThrow();
    await expect(host.harness.behavior.callRpc("addNote",{...input,timestamp:100,endTime:null})).rejects.toThrow();
    const store=openStore(host.bb),note=store.addNote(input);store.setStatus("thr_demo",note.id,"fixed");
    await expect(host.harness.behavior.callRpc("context",{threadId:"thr_demo",noteIds:[note.id]})).rejects.toThrow();
    expect(()=>store.register({threadId:"thr_demo",demo:"Duo",label:"v1",summary:"",media})).toThrow(/label/);
  });
  it("routes CLI and native tools through the same status, frame, and inline-player operations",async()=>{
    const host=load(),v=seed(host),note=openStore(host.bb).addNote(noteInput(v.id));
    expect(await host.harness.behavior.runCli(["status","--thread","thr_demo","--note",note.id,"--status","regressed"])).toMatchObject({exitCode:0});
    expect(await host.harness.behavior.callAgentTool("director_list_notes",{threadId:"thr_demo",versionId:v.id,status:"regressed"})).toContain(note.id);
    expect(await host.harness.behavior.callAgentTool("director_frame",{threadId:"thr_demo",noteId:note.id})).toMatchObject({content:[{type:"image",mimeType:"image/jpeg"}]});
    const post=await host.harness.behavior.runCli(["post","--thread","thr_demo","--version",v.id]);
    expect(JSON.parse(post.stdout).directive).toBe(`::director{version="${v.id}"}`);
    expect((await host.harness.behavior.runCli(["status","--thread","thr_demo","--note",note.id,"--status","done"])).exitCode).toBe(1);
  });
  it("registers and streams a video on its owning host, and detects replacement",async()=>{
    let modifiedAt=1;
    const host=createFakePluginHost({pluginId:"director",sdk:{system:{config:async()=>({primaryHostId:"host_a"})},files:{createPreview:async()=>({baseUrl:"/preview/lease",expiresAtMs:9000})}},experimental_callHostRpc:async()=>{const {hostId,...rest}=media;return {...rest,modifiedAt};}});
    plugin(host.bb);cleanups.push(()=>host.harness.lifecycle.dispose());
    const version=versionSchema.parse(await host.harness.behavior.callRpc("register",{threadId:"thr_demo",demo:"Duo",label:"v1",file:"/demo/v1.mp4",source:{kind:"host",threadId:null,environmentId:null,projectId:null,experimental_hostId:"host_a"}}));
    expect(await host.harness.behavior.callRpc("preview",{threadId:"thr_demo",versionId:version.id})).toMatchObject({url:expect.stringMatching(/^\/api\/v1\/plugins\/director\/http\/media\//)});
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
