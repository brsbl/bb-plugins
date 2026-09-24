import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { experimental_createHostEntryHarness } from "@get-bb/plugin-sdk/testing/host";
import { afterEach, expect, it, vi } from "vitest";
import hostEntry from "./host.js";
import { stepTime } from "./model.js";

const {probe} = vi.hoisted(() => ({probe: vi.fn()}));
vi.mock("node:child_process", () => ({
  execFile: Object.assign(() => {}, {[Symbol.for("nodejs.util.promisify.custom")]: probe}),
}));
afterEach(() => probe.mockReset());

it("keeps fast stream metadata and CFR stepping when frame indexing times out", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "video-markup-probe-"));
  const harness = experimental_createHostEntryHarness(hostEntry);
  try {
    const file = path.join(root, "demo-v9.mp4");
    await writeFile(file, "video bytes");
    probe.mockImplementation(async (_command: string, args: string[]) => {
      if (args.some(arg => /(?:frame|packet)=/.test(arg))) throw new Error("Frame index timed out");
      return {stdout: JSON.stringify({streams: [{codec_name: "h264", width: 1920, height: 1080, avg_frame_rate: "30/1", r_frame_rate: "30/1", start_time: "0"}], format: {duration: "34"}})};
    });
    const media = await harness.experimental_call("inspect", {path: file, rootPath: root});
    expect(media).toMatchObject({duration: 34, fps: 30, width: 1920, height: 1080, codec: "h264", frameTimes: []});
    expect(stepTime(media, 1, 1)).toBeCloseTo(31 / 30);
    expect(stepTime(media, 1, -1)).toBeCloseTo(29 / 30);
  } finally { await harness.experimental_dispose(); await rm(root, {recursive: true, force: true}); }
});

it("preserves a composer attachment after turn cleanup and reuses its durable copy",async()=>{
  const root=await mkdtemp(path.join(tmpdir(),"video-markup-attachment-"));
  const harness=experimental_createHostEntryHarness(hostEntry,{experimental_paths:{dataDir:path.join(root,"plugin"),tempDir:root}});
  try {
    const file=path.join(root,"demo-v10.mp4");
    await writeFile(file,"video bytes");
    const input={path:file,rootPath:root,probe:false,retain:true};
    const retained=await harness.experimental_call("inspect",input);
    expect(path.basename(retained.path)).toBe("demo-v10.mp4");
    expect(retained.path.startsWith(path.join(root,"plugin","videos"))).toBe(true);
    expect(await harness.experimental_call("inspect",input)).toEqual(retained);
    const ordinary=await harness.experimental_call("inspect",{...input,retain:false});
    expect(ordinary.path).toBe(file);
    await rm(file);
    expect(await readFile(retained.path,"utf8")).toBe("video bytes");
    expect(await harness.experimental_call("readChunk",{path:retained.path,size:retained.size,modifiedAt:retained.modifiedAt,start:0,length:retained.size})).toEqual({data:Buffer.from("video bytes").toString("base64")});
  } finally {await harness.experimental_dispose();await rm(root,{recursive:true,force:true});}
});
