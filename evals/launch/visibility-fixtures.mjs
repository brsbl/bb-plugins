import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {captureVisible,discoverCard} from './visibility-capture.mjs';

// Generic measurement regressions, never included in an agent prompt.
export async function visibilityFixtures({dir,tempRoot}) {
  const drawing='<body style="margin:0;background:white"><svg width="300" height="240"><rect x="24" y="24" width="240" height="160" fill="#286cc8"/><circle cx="160" cy="110" r="55" fill="#de7240"/><text x="60" y="220" font-size="26">Working output</text></svg>';
  const quote=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;');
  for(const name of ['painted','blank','delayed','removed','replaced','scrolled','lazy']) {
    const path=join(dir,name);mkdirSync(path,{recursive:true});
    const capAt=Date.now()+4000,preload=join(path,'monitor.js'),file=join(path,'fixture.html');
    // A top-level page can contain plenty of ink while its card is still blank.
    const body=name==='blank'||name==='delayed'?'<body style="margin:0;background:white">':drawing;
    writeFileSync(file,`<!doctype html><body class="pg-host" style="margin:0"><div style="height:${name==='lazy'?6000:160}px;background:linear-gradient(90deg,red,blue);font-size:32px">Host prose is not card evidence</div><div class="pg-widget"><iframe loading="lazy" id="card" style="display:block;width:320px;height:260px;border:0" srcdoc="${quote(body)}"></iframe></div><div style="height:1800px;background:linear-gradient(red,blue)">More host content</div>`);
    writeFileSync(preload,`if(top===window){
      window.__launch={proof:null,candidate:null,done:false,progress:[],errors:[],paintAt:null};
      let replaced=false;const loaded=new WeakMap(),identities={elements:new WeakMap(),next:0};
      document.addEventListener('load',e=>{const el=e.target;if(el?.tagName!=='IFRAME')return;
        loaded.set(el,Date.now());
        if(${JSON.stringify(name)}==='delayed')setTimeout(()=>{el.contentDocument.body.innerHTML=${JSON.stringify(drawing)};__launch.paintAt=Date.now()},700);
      },true);
      ${['removed','replaced'].includes(name)?`let node;Object.defineProperty(window,'__launchCaptureNode',{get:()=>node,set:el=>{node=el;if(replaced)return;replaced=true;queueMicrotask(()=>{el.remove();${name==='replaced'?`setTimeout(()=>{const fresh=document.createElement('iframe');fresh.style.cssText=el.style.cssText;fresh.srcdoc=${JSON.stringify(drawing)};document.querySelector('.pg-widget').prepend(fresh)},300);`:''}})}});`:''}
      ${name==='scrolled'?`let node,once=false;Object.defineProperty(window,'__launchCaptureNode',{get:()=>node,set:el=>{node=el;if(once)return;once=true;setTimeout(()=>{el.style.marginTop='600px';window.scrollTo(0,500)},55)}});`:''}
      setInterval(()=>{if(Date.now()>=${capAt})__launch.done=true;else __launch.candidate=(${discoverCard.toString()})(loaded,identities)},25);
    }`);
    const result=await captureVisible({target:pathToFileURL(file).href,preload,dir:path,tempRoot,capAt,width:800});
    const proof=result.measurement?.proof;
    assert.equal(Boolean(proof),!['blank','removed'].includes(name),name);
    if(proof)assert.equal(proof.capture,'stable-visible-interior');
    if(name==='delayed')assert(proof.at>=result.measurement.paintAt&&result.measurement.paintAt,'Wait for real paint');
    if(name==='replaced')assert.equal(proof.key,'2','Replacement gets its own load/capture identity');
    writeFileSync(join(path,'verdict.json'),JSON.stringify({name,pass:true,proof},null,2));
  }
}
