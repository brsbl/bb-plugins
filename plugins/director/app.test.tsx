// @vitest-environment jsdom
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { loadPluginApp, renderSlot } from "@get-bb/plugin-sdk/testing/app";
import type { FrameNote, Version } from "./model.js";

afterEach(cleanup);
const version:Version={id:"v1",threadId:"thr_demo",demo:"Duo",label:"v1",summary:"Gentler camera",createdAt:1,ordinal:1,media:{path:"/v1.mp4",hostId:"host_a",size:10,modifiedAt:1,duration:34,fps:60,frameTimes:[0,1/60],width:1920,height:1080}};
const note:FrameNote={id:"n1",threadId:"thr_demo",demo:"Duo",versionId:"v1",frameVersionId:"v1",timestamp:12,endTime:null,shapes:[],text:"Keep the composer in frame",status:"open",createdAt:1,updatedAt:1,carriedFrom:null,stillId:"n1"};
describe("Director UI contracts",()=>{
  it("registers the three video file types, inline directive, and thread panel",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    expect(app.fileOpeners).toMatchObject([{id:"director-video",extensions:["mp4","webm","mov"]}]);
    expect(app.messageDirectives).toMatchObject([{id:"director"}]);
    expect(app.threadPanelActions).toMatchObject([{id:"director",title:"Director",layout:"flush"}]);
  });
  it("inserts selected actionable notes as a mention while preserving the composer draft",async()=>{
    const app=await loadPluginApp(()=>import("./app.js"));
    const slot=renderSlot(app.threadPanelActions[0],{threadId:"thr_demo",params:{versionId:"v1"}},{rpc:{versions:()=>({versions:[version],nextOffset:null}),version:()=>version,preview:()=>({media:version.media,url:"/video.mp4",expiresAt:99999}),notes:()=>({notes:[note,{...note,id:"fixed",status:"fixed"}],nextOffset:null}),context:()=>({id:"selection",count:1,context:"{}"})}});
    await slot.behavior.setComposerScope({kind:"thread",threadId:"thr_demo"});
    await slot.behavior.setComposerText("Please revise this.");
    const checkbox=await slot.findByRole("checkbox",{name:"Select open notes"});fireEvent.click(checkbox);
    fireEvent.click(slot.getByRole("button",{name:/Add to prompt/}));
    await waitFor(()=>expect(slot.inspection.composer.mentions).toMatchObject([{provider:"frame-notes",id:"selection"}]));
    expect(slot.inspection.composer.text).toContain("Please revise this.");
    expect(slot.inspection.rpcCalls.find(c=>c.method==="context")?.input).toEqual({threadId:"thr_demo",noteIds:["n1"]});
    slot.lifecycle.unmount();
  });
});
