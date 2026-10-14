const p=await browser.getPage('main');
await p.setViewport({width:1440,height:1080,deviceScaleFactor:2});
const errors=[];
p.on('pageerror',error=>errors.push(String(error)));
const base='/Users/brsbl/.bb/plugins/environment-git-worktree/host-data/worktrees/thr_td96vbrcdf-1/bb-plugins/.dispatch-mockups/review-I8y4pa/captures/';
for (const theme of ['light','dark']) {
 for (const story of ['before','after','dispatch','thread-tab']) {
  await p.goto(`http://localhost:61000/?story=dispatch--${story}&mode=preview&theme=${theme}`);
  await p.waitForSelector('.mock');
  await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(()=>{for(const media of document.querySelectorAll('audio,video'))media.muted=true});
  await p.snapshot();
  if(story==='after') {
   await p.click('.event-toggle');
   await p.snapshot();
  }
  await p.screenshot({path:base+story+'-'+theme+'-final.png',type:'png'});
  console.log(story,theme,await p.evaluate(()=>({theme:document.querySelector('.mock').className,width:innerWidth,height:innerHeight,scale:devicePixelRatio,overflow:document.documentElement.scrollWidth>innerWidth})));
 }
}
console.log({pageErrors:errors});
