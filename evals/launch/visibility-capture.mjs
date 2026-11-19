// A loaded iframe is only a candidate. Commit a timing proof after capturing
// actual pixels while its DOM identity, bounds and viewport position stay fixed.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {chromePath} from '../../skills/how-it-works/scripts/clip-browser.mjs';
import {hasInk} from './pixels.mjs';

// Runs in the parent page, including before a lazy iframe has loaded.
export function discoverCard(loaded, identities) {
  const frame=document.querySelector('.pg-host .pg-widget iframe');
  const card=frame||document.querySelector('.pg-host .pg-answer:not([role="status"]):not(.pg-error)');
  if(!card)return null;
  if(frame&&!loaded.has(frame)){card.scrollIntoView({block:'center'});return null;}
  const r=card.getBoundingClientRect();
  if(r.width<=80||r.height<=40||getComputedStyle(card).visibility==='hidden')return null;
  if(!identities.elements.has(card))identities.elements.set(card,{key:String(++identities.next),at:loaded.get(card)||Date.now()});
  const identity=identities.elements.get(card);
  if(card.dataset.launchCard!=='candidate')card.dataset.launchCard='candidate';
  if(card.dataset.launchKey!==identity.key)card.dataset.launchKey=identity.key;
  return {...identity,kind:frame?'html':'document',target:frame?.src||location.href};
}

// Executed in the parent page. Only measurement state and scrolling are changed.
function candidateBounds(prepare) {
  const state=window.__launch;
  const el=prepare?document.querySelector('[data-launch-card="candidate"]'):window.__launchCaptureNode;
  if(!state?.candidate||!el?.isConnected)return null;
  if(prepare){el.scrollIntoView({block:'center'});window.__launchCaptureNode=el;}
  const r=el.getBoundingClientRect(),inside=(x,y)=>{const hit=document.elementFromPoint(x,y);return hit===el||el.contains(hit);};
  const left=Math.max(0,r.left)+12,right=Math.min(innerWidth,r.right)-12;
  if(right-left<80)return null;
  const line=y=>[left,(left+right)/2,right].every(x=>inside(x,y));
  let top=Math.max(0,r.top)+12,bottom=Math.min(innerHeight,r.bottom)-12;
  // A long card can be partly covered by bb's header/composer. Capture only the
  // exposed interior; border antialiasing and surrounding text are not content.
  while(top<bottom&&!line(top))top+=8;
  while(bottom>top&&!line(bottom))bottom-=8;
  if(bottom-top<40||!line((top+bottom)/2))return null;
  const key=el.dataset.launchKey;
  if(!key||key!==state.candidate.key)return null;
  return {key,layoutVersion:window.__launchLayoutVersion,src:el.tagName==='IFRAME'?el.src:null,x:r.x,y:r.y,width:r.width,height:r.height,
    scrollX,scrollY,clip:{x:left+scrollX,y:top+scrollY,width:right-left,height:bottom-top,scale:1},candidate:state.candidate};
}
function sameCapture(a,b){
  return a&&b&&a.key===b.key&&a.src===b.src&&a.layoutVersion===b.layoutVersion&&['x','y','width','height','scrollX','scrollY'].every(k=>Math.abs(a[k]-b[k])<0.5)&&
    ['x','y','width','height'].every(k=>Math.abs(a.clip[k]-b.clip[k])<0.5);
}

export async function captureVisible({target,preload,dir,tempRoot,capAt,width=1280}) {
  const binary=chromePath();assert(binary,'No Chrome available');
  const profile=mkdtempSync(join(tempRoot,'launch-visible-'));
  const chrome=spawn(binary,['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,
    '--no-first-run','--no-default-browser-check','--hide-scrollbars','about:blank'],{detached:true,stdio:['ignore','ignore','pipe']});
  writeFileSync(join(dir,'visible.pid'),String(chrome.pid));
  let socket,id=0,log='',aborted=false,state=null;const pending=new Map(),attempts=[];
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const stop=()=>{aborted=true;if(chrome.exitCode===null&&chrome.signalCode===null)try{process.kill(-chrome.pid,'SIGTERM')}catch{}};
  process.once('SIGTERM',stop);process.once('SIGINT',stop);
  const hardDeadline=setTimeout(stop,Math.max(1,capAt-Date.now()+20000));
  const rpc=(method,params={})=>new Promise((resolve,reject)=>{
    const call=++id,timer=setTimeout(()=>{pending.delete(call);reject(Error('CDP timeout: '+method));},10000);
    pending.set(call,{resolve:v=>{clearTimeout(timer);v.error?reject(Error(JSON.stringify(v.error))):resolve(v.result)},reject:e=>{clearTimeout(timer);reject(e)}});
    try{socket.send(JSON.stringify({id:call,method,params}));}catch(error){clearTimeout(timer);pending.delete(call);reject(error);}
  });
  const evaluate=async expression=>{const r=await rpc('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result?.value;};
  try{
    const port=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),20000);
      chrome.once('error',e=>{clearTimeout(timer);reject(e)});
      chrome.once('exit',()=>{clearTimeout(timer);reject(Error('Chrome exited before ready'))});
      chrome.stderr.on('data',chunk=>{log=(log+chunk).slice(-8000);const m=log.match(/DevTools listening on ws:\/\/[^:]+:(\d+)\//);
        if(m){clearTimeout(timer);resolve(Number(m[1]));}});
    });
    const page=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT',signal:AbortSignal.timeout(10000)})).json();
    socket=new WebSocket(page.webSocketDebuggerUrl);
    socket.onmessage=e=>{const r=JSON.parse(e.data);if(r.id&&pending.has(r.id)){pending.get(r.id).resolve(r);pending.delete(r.id);}};
    await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject});
    await rpc('Runtime.enable');await rpc('Page.enable');
    await rpc('Emulation.setDeviceMetricsOverride',{width,height:1100,deviceScaleFactor:1,mobile:width<600});
    await rpc('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    const layoutGuard=`if(window.top===window){
      window.__launchLayoutVersion=0;
      new MutationObserver(changes=>{const el=window.__launchCaptureNode;
        if(changes.some(m=>!el||m.target===el||!el.contains(m.target)))window.__launchLayoutVersion++;
      }).observe(document,{subtree:true,childList:true,attributes:true,characterData:true});
      addEventListener('scroll',()=>window.__launchLayoutVersion++,true);
    }`;
    await rpc('Page.addScriptToEvaluateOnNewDocument',{source:layoutGuard+'\n'+readFileSync(preload,'utf8')});
    await rpc('Page.navigate',{url:target});
    while(!aborted&&Date.now()<=capAt){
      state=await evaluate('window.__launch || null');
      if(state?.done)break;
      if(!state?.candidate){await sleep(100);continue;}
      await evaluate(`(${candidateBounds.toString()})(true)`);
      // Give layout and the compositor a frame, then record bounds immediately
      // before capture. A subsequent scroll/replacement makes this attempt fail.
      await sleep(50);
      const before=await evaluate(`(${candidateBounds.toString()})(false)`);
      if(!before){await sleep(100);continue;}
      const startedAt=Date.now();
      const shot=await rpc('Page.captureScreenshot',{format:'png',clip:before.clip,captureBeyondViewport:false});
      const at=Date.now(),after=await evaluate(`(${candidateBounds.toString()})(false)`);
      const path=join(dir,'visible-candidate.png');writeFileSync(path,Buffer.from(shot.data,'base64'));
      const stable=sameCapture(before,after),ink=stable&&hasInk(path);
      state=await evaluate('window.__launch');
      const accepted=stable&&ink&&!state.done&&at<=capAt;
      attempts.push({startedAt,at,stable,ink,accepted,before,after});
      if(accepted){
        writeFileSync(join(dir,'visible.png'),Buffer.from(shot.data,'base64'));
        state.proof={...before.candidate,at,captureStartedAt:startedAt,loadedAt:before.candidate.at,
          width:before.width,height:before.height,capture:'stable-visible-interior',clip:before.clip};
        return {code:0,measurement:state};
      }
      await sleep(100);
    }
    return {code:0,measurement:state};
  }finally{
    writeFileSync(join(dir,'visible-capture.json'),JSON.stringify({attempts,state},null,2));
    writeFileSync(join(dir,'visible-browser.log'),log);clearTimeout(hardDeadline);
    for(const call of pending.values())call.reject(Error('Capture closed'));pending.clear();
    socket?.close();stop();
    if(chrome.exitCode===null&&chrome.signalCode===null){await Promise.race([new Promise(r=>chrome.once('exit',r)),sleep(3000)]);
      if(chrome.exitCode===null&&chrome.signalCode===null)try{process.kill(-chrome.pid,'SIGKILL')}catch{}}
    process.removeListener('SIGTERM',stop);process.removeListener('SIGINT',stop);
    rmSync(profile,{recursive:true,force:true});
  }
}
