import { describe, expect, it, vi } from "vitest";
import { byteRange, CHUNK_BYTES, mediaResponse } from "./media.js";
import type { Media } from "./model.js";
const media: Media = {path:"/film.mp4",hostId:"host_1",size:32*1024*1024,modifiedAt:1,duration:34,fps:60,frameTimes:[],width:1920,height:1080};
const signal = new AbortController().signal;

describe("video streaming",()=>{
  it("answers Safari's initial two-byte probe and late-file seeks without loading the whole video",async()=>{
    const read=vi.fn(async(_start:number,length:number)=>Buffer.alloc(length,7).toString("base64"));
    const probe=mediaResponse({media,range:"bytes=0-1",head:false,signal,read});
    expect(probe.status).toBe(206);expect(probe.headers.get("content-range")).toBe(`bytes 0-1/${media.size}`);
    expect(new Uint8Array(await probe.arrayBuffer())).toEqual(new Uint8Array([7,7]));
    const tail=mediaResponse({media,range:"bytes=-512",head:false,signal,read});
    expect((await tail.arrayBuffer()).byteLength).toBe(512);
    expect(read).toHaveBeenLastCalledWith(media.size-512,512,expect.any(AbortSignal));
  });
  it("streams full responses in bounded chunks and handles HEAD without reading",async()=>{
    const read=vi.fn(async(_start:number,length:number)=>Buffer.alloc(length).toString("base64"));
    const small={...media,size:CHUNK_BYTES+12};
    const head=mediaResponse({media:small,range:null,head:true,signal,read});
    expect(head.status).toBe(200);expect(read).not.toHaveBeenCalled();
    const body=mediaResponse({media:small,range:null,head:false,signal,read});
    expect((await body.arrayBuffer()).byteLength).toBe(small.size);
    expect(read.mock.calls.map(c=>c[1])).toEqual([CHUNK_BYTES,12]);
  });
  it("rejects malformed, multipart, and unsatisfiable ranges",()=>{
    for(const value of ["bytes=10-2","bytes=999999999-","bytes=0-2,4-5","bytes=-0","bytes=-","invalid"]){
      expect(byteRange(value,10)).toBeNull();
      expect(mediaResponse({media:{...media,size:10},range:value,head:false,signal,read:async()=>""}).status).toBe(416);
    }
    expect(byteRange("bytes=4-100",10)).toEqual({start:4,end:9});
  });
});
