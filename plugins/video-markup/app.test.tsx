// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor, within } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import type { FrameNote, Version } from "./model.js";

afterEach(() => {cleanup();vi.restoreAllMocks();});
beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class {observe() {} unobserve() {} disconnect() {}});
  HTMLElement.prototype.scrollIntoView = vi.fn();
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false);
});
afterAll(() => vi.unstubAllGlobals());
const version:Version={id:"v1",threadId:"thr_demo",demo:"Duo",summary:"Gentler camera",createdAt:1,ordinal:1,media:{path:"/v1.mp4",hostId:"host_a",size:10,modifiedAt:1,duration:34,fps:60,frameTimes:[0,1/60],width:1920,height:1080}};
const note:FrameNote={id:"n1",threadId:"thr_demo",demo:"Duo",versionId:"v1",frameVersionId:"v1",timestamp:12,shapes:[],text:"Keep the composer in frame",status:"open",createdAt:1,updatedAt:1,carriedFrom:null,stillId:"n1"};
describe("Video Markup UI contracts",()=>{
  it("opens the presented version only in its thread",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    const slot=renderSlot(app.threadHeaderActions[0],{threadId:"thr_demo",projectId:"proj_demo",isCompactViewport:true});
    await slot.behavior.emitRealtime("present",{threadId:"another",versionId:"v2"});
    expect(slot.inspection.navigateCalls).toEqual([]);
    await slot.behavior.emitRealtime("present",{threadId:"thr_demo",versionId:"v1"});
    expect(slot.inspection.navigateCalls).toEqual([{method:"openThreadPanel",options:{actionId:"video-markup",params:{versionId:"v1"}}}]);
    slot.lifecycle.unmount();
  });
  it("adds an opened video with one action and shows its filename",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    const source={kind:"host" as const,threadId:"thr_demo",environmentId:null,projectId:null};
    const preview={media:version.media,url:"/video.mp4",expiresAt:99999};
    const slot=renderSlot(app.fileOpeners[0],{path:"/v1.mp4",source,experimental_Original:()=>null},{rpc:{openFile:()=>preview,probeFile:()=>version.media,versions:()=>({versions:[],nextOffset:null,currentDemo:null}),register:()=>version,version:()=>version,preview:()=>preview,notes:()=>({notes:[],nextOffset:null})}});
    fireEvent.click(await slot.findByRole("button",{name:"Add as next version"}));
    expect(await slot.findByRole("heading",{name:"v1.mp4"})).toBeTruthy();
    expect(slot.inspection.rpcCalls.find(c=>c.method==="register")?.input).toEqual({threadId:"thr_demo",file:"/v1.mp4",source});
    expect(slot.queryByRole("textbox")).toBeNull();
    slot.lifecycle.unmount();
  });
  it("keeps the file playable while frame metadata is pending or fails",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    let failProbe!:(error:Error)=>void;
    const probe=new Promise<never>((_resolve,reject)=>{failProbe=reject;});
    const slot=renderSlot(app.fileOpeners[0],{path:"/v1.mp4",experimental_Original:()=>null,source:{kind:"host",threadId:null,environmentId:null,projectId:null}},{rpc:{
      openFile:()=>({media:{...version.media,duration:0,fps:null,frameTimes:[]},url:"/video.mp4",expiresAt:99999}),
      probeFile:()=>probe,
    }});
    const player=await slot.findByRole("region",{name:"Video review player"});
    const video=player.querySelector("video");
    expect(video?.getAttribute("src")).toBe("/video.mp4");
    expect(await slot.findByText("Preparing frame stepping…")).toBeTruthy();
    failProbe(new Error("Slow frame probe exceeded the host deadline"));
    expect(await slot.findByText("Frame stepping is unavailable. Playback and seeking still work.")).toBeTruthy();
    expect(slot.queryByRole("alert")).toBeNull();
    expect(player.querySelector("video")).toBe(video);
    slot.lifecycle.unmount();
  });
  it("registers the three video file types, inline directive, and thread panel",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    expect(app.fileOpeners).toMatchObject([{id:"video-markup-video",extensions:["mp4","webm","mov"]}]);
    expect(app.messageDirectives).toMatchObject([{id:"video-markup"}]);
    expect(app.threadPanelActions).toMatchObject([{id:"video-markup",title:"Video Markup",layout:"flush"}]);
  });
  it("inserts selected actionable notes as a mention while preserving the composer draft",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    const slot=renderSlot(app.threadPanelActions[0],{threadId:"thr_demo",params:{versionId:"v1"}},{rpc:{versions:()=>({versions:[version],nextOffset:null,currentDemo:"Duo"}),version:()=>version,preview:()=>({media:version.media,url:"/video.mp4",expiresAt:99999}),notes:()=>({notes:[note,{...note,id:"fixed",status:"fixed"}],nextOffset:null}),context:()=>({id:"selection",count:1,context:"{}"})}});
    await slot.behavior.setComposerScope({kind:"thread",threadId:"thr_demo"});
    await slot.behavior.setComposerText("Please revise this.");
    const checkbox=await slot.findByRole("checkbox",{name:"Select open notes"});fireEvent.click(checkbox);
    const addButton = slot.getByRole("button",{name:"Add to prompt"});
    fireEvent.click(addButton);
    await waitFor(()=>expect(slot.inspection.composer.mentions).toMatchObject([{provider:"frame-notes",id:"selection"}]));
    expect(slot.inspection.composer.text).toContain("Please revise this.");
    expect(slot.inspection.rpcCalls.find(c=>c.method==="context")?.input).toEqual({threadId:"thr_demo",noteIds:["n1"]});
    slot.lifecycle.unmount();
  });
  it("keeps note numbers across filtering and status changes, and excludes fixed selections",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    let notes: FrameNote[] = [{...note,status:"fixed"},{...note,id:"n2",timestamp:15,shapes:[{kind:"arrow",x1:.2,y1:.3,x2:.8,y2:.7}]}];
    const slot=renderSlot(app.threadPanelActions[0],{threadId:"thr_demo",params:{versionId:"v1"}},{rpc:{
      versions:()=>({versions:[version],nextOffset:null,currentDemo:"Duo"}),version:()=>version,
      preview:()=>({media:version.media,url:"/video.mp4",expiresAt:99999}),
      notes:()=>({notes,nextOffset:null}),
      status:(input)=>{const {noteId,status}=input as {noteId:string;status:FrameNote["status"]};notes=notes.map(n=>n.id===noteId?{...n,status}:n);return notes.find(n=>n.id===noteId);},
      frame:()=>({dataUrl:"data:image/jpeg;base64,/9j/2Q==",width:640,height:360}),
    }});
    const row=await slot.findByRole("article",{name:"Note 2"});
    expect(within(row).getByRole("button",{name:"Go to note 2 at 00:15.000"})).toBeTruthy();
    fireEvent.click(within(row).getByRole("checkbox"));
    expect(slot.getByRole("button",{name:"Add to prompt"}).hasAttribute("disabled")).toBe(false);
    fireEvent.keyDown(slot.getByRole("combobox",{name:"Filter notes"}),{key:"ArrowDown"});
    fireEvent.click(await slot.findByRole("option",{name:"All notes"}));
    expect(await slot.findByRole("article",{name:"Note 1"})).toBeTruthy();
    expect(within(slot.getByRole("article",{name:"Note 2"})).getByRole("checkbox").getAttribute("aria-checked")).toBe("true");
    vi.spyOn(SVGSVGElement.prototype,"getBoundingClientRect").mockReturnValue({width:640,height:360} as DOMRect);
    fireEvent.click(within(slot.getByRole("article",{name:"Note 2"})).getByRole("button",{name:"View still"}));
    const still = await slot.findByRole("img",{name:/Frame at 00:15.000/});
    expect(still.parentElement?.querySelector(".video-markup-shape-number")?.textContent).toBe("2");
    expect(still.parentElement?.querySelector(".video-markup-shape-accent .video-markup-arrowhead")).toBeTruthy();
    fireEvent.keyDown(slot.getByRole("combobox",{name:"Status for note at 00:15.000"}),{key:"ArrowDown"});
    fireEvent.click(await slot.findByRole("option",{name:"Fixed"}));
    await waitFor(()=>expect(slot.inspection.rpcCalls.find(c=>c.method==="status")?.input).toEqual({threadId:"thr_demo",noteId:"n2",status:"fixed"}));
    await waitFor(()=>expect(slot.getByRole("button",{name:"Add to prompt"}).hasAttribute("disabled")).toBe(true));
    expect(within(slot.getByRole("article",{name:"Note 2"})).getByRole("button",{name:"Go to note 2 at 00:15.000"})).toBeTruthy();
    slot.lifecycle.unmount();
  });
});
