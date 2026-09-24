import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { experimental_createHostEntryHarness } from "@get-bb/plugin-sdk/testing/host";
import { expect, it } from "vitest";
import hostEntry from "./host.js";

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
