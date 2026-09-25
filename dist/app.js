var ll=globalThis.__bbPluginRuntime;if(ll==null||ll.react==null)throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var Or=ll.react,Hy="default"in Or?Or.default:Or,{Activity:Gy,Children:Vy,Component:Wy,Fragment:Xy,Profiler:qy,PureComponent:Yy,StrictMode:Zy,Suspense:$y,act:Ky,cache:Jy,cacheSignal:jy,captureOwnerStack:Qy,cloneElement:eb,createContext:tb,createElement:nb,createRef:ib,forwardRef:sb,isValidElement:rb,lazy:ob,memo:ab,startTransition:lb,unstable_useCacheRefresh:cb,use:hb,useActionState:ub,useCallback:Vi,useContext:db,useDebugValue:fb,useDeferredValue:pb,useEffect:dn,useEffectEvent:mb,useId:gb,useImperativeHandle:xb,useInsertionEffect:_b,useLayoutEffect:vb,useMemo:cl,useOptimistic:yb,useReducer:bb,useRef:Dt,useState:$t,useSyncExternalStore:ih,useTransition:Mb,version:Sb}=Or;var hl=globalThis.__bbPluginRuntime;if(hl==null||hl.pluginSdkApp==null)throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var Br=hl.pluginSdkApp,wb="default"in Br?Br.default:Br,{Markdown:Tb,ThreadChat:Ab,ThreadTitle:Rb,UrlLink:Cb,definePluginApp:sh,experimental_BranchPicker:Ib,experimental_Diff:Pb,experimental_FileLink:Db,experimental_Icon:Lb,experimental_NewThreadComposer:Nb,experimental_PermissionModePicker:Ub,experimental_ProviderIcon:Fb,experimental_ProviderModelPicker:Ob,experimental_SidebarNavigationIcon:Bb,experimental_SourceCode:zb,experimental_useAppPanel:kb,experimental_useBranches:Hb,experimental_useCheckoutState:Gb,experimental_useCodeTheme:Vb,experimental_useFixedTabTarget:Wb,experimental_usePluginId:Xb,experimental_useProviders:qb,experimental_useQuestionFormHost:Yb,experimental_useSidebarNavigation:Zb,experimental_useSidebarNavigationSplit:$b,experimental_useSidebarThreadActions:Kb,experimental_useSidebarThreadPullRequest:Jb,experimental_useSidebarThreadSplit:jb,experimental_useSidebarThreads:rh,useBbContext:oh,useBbNavigate:Qb,useComposer:eM,useComposerView:tM,useEnvironmentProviders:nM,useRealtime:iM,useRealtimeConnectionState:sM,useRpc:ah,useSdk:rM,useSettings:oM,useSidebarSplitLayout:aM,useSidebarThreadDraft:lM,useSidebarThreadDraftIds:cM,useSidebarThreadRowStatus:hM,useSidebarThreadRowStatuses:uM,useSidebarThreadShortcut:dM}=Br;function Ls(n){return n==null||!Number.isFinite(n)?0:Math.min(1,Math.max(0,n))}function lh(n,e){return e>0?Ls(n/e):0}function Ns(n){return .3*60**Ls(n)}function Vn(n){return n>.3?Ls(Math.log(n/.3)/Math.log(60)):0}function zr(n){return Math.max(0,Math.floor(Math.log2(Math.max(n,.3)/.3)))}function ch(n){let e=Vn(n);return 5*(5e4/5)**e}function Wn(n){if(n>=1e6){let e=n/1e6;return`${e>=10?Math.round(e):e.toFixed(1)}M`}return n>=1e3?`${Math.round(n/1e3)}k`:String(Math.round(n))}function Wi(n){let e=2166136261;for(let t=0;t<n.length;t+=1)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}function on(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}var kr={forward:0,turn:0},ul=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);function dl(n){return n.forward===0&&n.turn===0}function hh(n){let e=(t,i)=>(n.has(t)?1:0)-(n.has(i)?1:0);return{forward:e("ArrowUp","ArrowDown"),turn:e("ArrowRight","ArrowLeft")}}var Us=.22727272727272727,uh=.18,Yd=.12,Zd=25,$d={C:0,D:2,E:4,F:5,G:7,A:9,B:11};function Xn(n){let e=/^([A-G])(#?)(\d)$/.exec(n);return e?440*2**(($d[e[1]]+(e[2]?1:0)+(Number(e[3])+1)*12-69)/12):0}var dh=["E5 G5 A5 G5 E5 - C5 D5","E5 - D5 C5 A4 - C5 -","F5 A5 C6 A5 G5 - F5 E5","D5 - E5 F5 G5 - - -","E5 G5 C6 B5 A5 G5 E5 G5","A5 - G5 E5 C5 - D5 E5","F5 E5 D5 F5 E5 D5 C5 D5","C5 - G4 - C5 - - -"].map(n=>n.split(" ")),Kd=[["C4","E4","G4"],["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"],["C4","E4","G4"],["A3","C4","E4"],["D4","F4","A4"],["G3","B3","D4"]],Jd=["C2","A1","F2","G2","C2","A1","D2","G2"],Hr=class{context=null;master=null;musicBus=null;noise=null;scheduler=null;nextStepTime=0;step=0;musicOn=!1;muted;lastClack=0;constructor(e){this.muted=e}get isMuted(){return this.muted}unlock(){if(!(typeof AudioContext>"u")){if(!this.context){let e=new AudioContext;this.context=e,this.master=e.createGain(),this.master.gain.value=this.muted?0:.5,this.master.connect(e.destination),this.musicBus=e.createGain(),this.musicBus.gain.value=0,this.musicBus.connect(this.master),this.noise=e.createBuffer(1,e.sampleRate*2,e.sampleRate);let t=this.noise.getChannelData(0),i=0;for(let s=0;s<t.length;s+=1)i=(i+.02*(Math.random()*2-1))/1.02,t[s]=i*3.5}this.muted?this.context.suspend():this.context.state==="suspended"&&this.context.resume()}}setMuted(e){this.muted=e;let t=this.context;if(!(!t||!this.master)){if(this.master.gain.setTargetAtTime(e?0:.5,t.currentTime,.05),!e){t.resume();return}window.setTimeout(()=>{this.muted&&t.suspend()},300)}}setRolling(e,t){let i=this.context;if(!i||!this.musicBus)return;let s=i.currentTime,r=e?Math.min(1,Math.max(0,t)):0;e&&r>.15&&s-this.lastClack>.09+(1-r)*.25&&(this.lastClack=s,Math.random()<.55&&this.clack(s)),e&&!this.musicOn&&this.startMusic(),!e&&this.musicOn&&this.stopMusic()}pickup(e){let t=this.context;if(!t||!this.master)return;let i=t.currentTime,s=1500-Math.min(1,e)*800;this.tone("sine",s,i,.12,.28,s*1.6),this.tone("triangle",s*1.5,i+.06,.16,.18,s*2)}gulp(e){let t=this.context;if(!t)return;let i=t.currentTime,s=Math.min(1,Math.max(0,e)),r=s<.25?1:s<.6?2:3;for(let o=0;o<r;o+=1){let a=i+o*.2,l=260-s*150-o*18;this.tone("sine",l,a,.16+s*.12,.22+s*.25,l*.35),this.noiseBurst(a,.1,.1+s*.18,"lowpass",900,200)}s>=.6&&(this.tone("sine",70,i,.7,.5,28),this.noiseBurst(i+.05,.45,.3,"bandpass",3e3,400),this.tone("sawtooth",90,i+r*.2,.35,.12,60))}coin(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("square",Xn("B5"),t,.06,.035),this.tone("square",Xn("E6"),t+.06,.18,.035)}bonk(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("sine",150,t,.18,.35,55),this.noiseBurst(t,.08,.2,"lowpass",600,300)}whoosh(){let e=this.context;e&&this.noiseBurst(e.currentTime,.55,.3,"bandpass",300,2400)}shed(){let e=this.context;if(!e)return;let t=e.currentTime;["G5","E5","C5","G4"].forEach((i,s)=>{this.tone("square",Xn(i),t+s*.07,.1,.1)})}pop(){let e=this.context;if(!e)return;let t=e.currentTime;this.noiseBurst(t,.3,.45,"bandpass",2400,180),this.tone("sine",110,t,.35,.45,38),["C6","E6","G6","C7"].forEach((i,s)=>{this.tone("triangle",Xn(i),t+.08+s*.06,.18,.16)}),this.tone("sine",1400,t+.35,.8,.12,260)}dispose(){this.scheduler!==null&&window.clearInterval(this.scheduler),this.scheduler=null,this.context?.close(),this.context=null}startMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!0,this.musicBus.gain.setTargetAtTime(.5,e.currentTime,.25),this.scheduler===null&&(this.nextStepTime=e.currentTime+.05,this.scheduler=window.setInterval(()=>this.schedule(),Zd)))}stopMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!1,this.musicBus.gain.setTargetAtTime(0,e.currentTime,.3),window.setTimeout(()=>{!this.musicOn&&this.scheduler!==null&&(window.clearInterval(this.scheduler),this.scheduler=null)},1500))}schedule(){let e=this.context;if(e)for(;this.nextStepTime<e.currentTime+Yd;){this.playStep(this.step,this.nextStepTime);let t=this.step%2===0?1+uh:1-uh;this.nextStepTime+=Us*t,this.step=(this.step+1)%(dh.length*8)}}playStep(e,t){let i=Math.floor(e/8),s=e%8,r=dh[i][s];r!=="-"&&(this.voice("square",Xn(r),t,Us*.9,.07,2400),this.voice("triangle",Xn(r)*2,t,Us*.5,.025,6e3));let o=Xn(Jd[i]);if(s%2===0){let a=s%4===0?o:o*2;this.voice("triangle",a,t,Us*.85,.22,900)}if(s%4===2)for(let a of Kd[i])this.voice("sine",Xn(a),t,Us*.7,.05,3e3);s%4===0&&this.kick(t),s%4===2&&this.snare(t),this.hat(t,s%2===0?.035:.02)}voice(e,t,i,s,r,o){let a=this.context;if(!a||!this.musicBus)return;let l=a.createOscillator();l.type=e,l.frequency.value=t;let c=a.createBiquadFilter();c.type="lowpass",c.frequency.value=o;let h=a.createGain();h.gain.setValueAtTime(0,i),h.gain.linearRampToValueAtTime(r,i+.008),h.gain.exponentialRampToValueAtTime(1e-4,i+s),l.connect(c).connect(h).connect(this.musicBus),l.start(i),l.stop(i+s+.02)}kick(e){let t=this.context;if(!t||!this.musicBus)return;let i=t.createOscillator();i.frequency.setValueAtTime(140,e),i.frequency.exponentialRampToValueAtTime(45,e+.12);let s=t.createGain();s.gain.setValueAtTime(.35,e),s.gain.exponentialRampToValueAtTime(1e-4,e+.16),i.connect(s).connect(this.musicBus),i.start(e),i.stop(e+.2)}snare(e){this.noiseBurst(e,.12,.09,"bandpass",1800,1800,this.musicBus)}hat(e,t){this.noiseBurst(e,.04,t,"highpass",7e3,7e3,this.musicBus)}clack(e){let t=700+Math.random()*900;this.tone("square",t,e,.025,.03,t*.8)}tone(e,t,i,s,r,o=t){let a=this.context;if(!a||!this.master)return;let l=a.createOscillator();l.type=e,l.frequency.setValueAtTime(t,i),l.frequency.exponentialRampToValueAtTime(Math.max(20,o),i+s);let c=a.createGain();c.gain.setValueAtTime(r,i),c.gain.exponentialRampToValueAtTime(1e-4,i+s),l.connect(c).connect(this.master),l.start(i),l.stop(i+s+.02)}noiseBurst(e,t,i,s,r,o,a=this.master){let l=this.context;if(!l||!this.noise||!a)return;let c=l.createBufferSource();c.buffer=this.noise,c.playbackRate.value=4;let h=l.createBiquadFilter();h.type=s,h.frequency.setValueAtTime(r,e),h.frequency.exponentialRampToValueAtTime(o,e+t);let d=l.createGain();d.gain.setValueAtTime(i,e),d.gain.exponentialRampToValueAtTime(1e-4,e+t),c.connect(h).connect(d).connect(a),c.start(e,Math.random()),c.stop(e+t+.02)}};var Hh=0,Zl=1,Gh=2;var vr=1,Vh=2,vs=3,li=0,Ft=1,cn=2,In=0,ys=1,$l=2,Kl=3,Jl=4,Wh=5;var Ii=100,Xh=101,qh=102,Yh=103,Zh=104,$h=200,Kh=201,Jh=202,jh=203,jl=204,Ql=205,Qh=206,eu=207,tu=208,nu=209,iu=210,su=211,ru=212,ou=213,au=214,uo=0,fo=1,po=2,os=3,mo=4,go=5,xo=6,_o=7,ec=0,lu=1,cu=2,_n=0,tc=1,nc=2,ic=3,sc=4,rc=5,oc=6,ac=7;var lc=300,ci=301,Pi=302,$o=303,Ko=304,yr=306,vo=1e3,Tn=1001,yo=1002,Mt=1003,hu=1004;var br=1005;var Ut=1006,Jo=1007;var hi=1008;var jt=1009,cc=1010,hc=1011,bs=1012,jo=1013,vn=1014,yn=1015,bn=1016,Qo=1017,ea=1018,Ms=1020,uc=35902,dc=35899,fc=1021,pc=1022,hn=1023,An=1026,ui=1027,Mr=1028,ta=1029,di=1030,na=1031;var ia=1033,Sr=33776,Er=33777,wr=33778,Tr=33779,sa=35840,ra=35841,oa=35842,aa=35843,la=36196,ca=37492,ha=37496,ua=37488,da=37489,Ar=37490,fa=37491,pa=37808,ma=37809,ga=37810,xa=37811,_a=37812,va=37813,ya=37814,ba=37815,Ma=37816,Sa=37817,Ea=37818,wa=37819,Ta=37820,Aa=37821,Ra=36492,Ca=36494,Ia=36495,Pa=36283,Da=36284,Rr=36285,La=36286;var Xs=2300,bo=2301,co=2302,Ol=2303,Bl=2400,zl=2401,kl=2402;var uu=3200;var Na=0,du=1,zn="",Yt="srgb",qs="srgb-linear",Ys="linear",dt="srgb";var ho=7680;var fu=519,pu=512,mu=513,gu=514,Ua=515,xu=516,_u=517,Fa=518,vu=519,yu=35044;var mc="300 es",xn=2e3,as=2001;function jd(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function Qd(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function Zs(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function bu(){let n=Zs("canvas");return n.style.display="block",n}var fh={},ls=null;function gc(...n){let e="THREE."+n.shift();ls?ls("log",e,...n):console.log(e,...n)}function Mu(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Xe(...n){n=Mu(n);let e="THREE."+n.shift();if(ls)ls("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function qe(...n){n=Mu(n);let e="THREE."+n.shift();if(ls)ls("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Si(...n){let e=n.join(" ");e in fh||(fh[e]=!0,Xe(...n))}function Su(n,e,t){return new Promise(function(i,s){function r(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:s();break;case n.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:i()}}setTimeout(r,t)})}var Eu={[uo]:fo,[po]:xo,[mo]:_o,[os]:go,[fo]:uo,[xo]:po,[_o]:mo,[go]:os},Rn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let s=i[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let s=i.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Bt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ph=1234567,Hs=Math.PI/180,cs=180/Math.PI;function Di(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Bt[n&255]+Bt[n>>8&255]+Bt[n>>16&255]+Bt[n>>24&255]+"-"+Bt[e&255]+Bt[e>>8&255]+"-"+Bt[e>>16&15|64]+Bt[e>>24&255]+"-"+Bt[t&63|128]+Bt[t>>8&255]+"-"+Bt[t>>16&255]+Bt[t>>24&255]+Bt[i&255]+Bt[i>>8&255]+Bt[i>>16&255]+Bt[i>>24&255]).toLowerCase()}function et(n,e,t){return Math.max(e,Math.min(t,n))}function xc(n,e){return(n%e+e)%e}function ef(n,e,t,i,s){return i+(n-e)*(s-i)/(t-e)}function tf(n,e,t){return n!==e?(t-n)/(e-n):0}function Gs(n,e,t){return(1-t)*n+t*e}function nf(n,e,t,i){return Gs(n,e,1-Math.exp(-t*i))}function sf(n,e=1){return e-Math.abs(xc(n,e*2)-e)}function rf(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function of(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function af(n,e){return n+Math.floor(Math.random()*(e-n+1))}function lf(n,e){return n+Math.random()*(e-n)}function cf(n){return n*(.5-Math.random())}function hf(n){n!==void 0&&(ph=n);let e=ph+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function uf(n){return n*Hs}function df(n){return n*cs}function ff(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function pf(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function mf(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function gf(n,e,t,i,s){let r=Math.cos,o=Math.sin,a=r(t/2),l=o(t/2),c=r((e+i)/2),h=o((e+i)/2),d=r((e-i)/2),u=o((e-i)/2),f=r((i-e)/2),g=o((i-e)/2);switch(s){case"XYX":n.set(a*h,l*d,l*u,a*c);break;case"YZY":n.set(l*u,a*h,l*d,a*c);break;case"ZXZ":n.set(l*d,l*u,a*h,a*c);break;case"XZX":n.set(a*h,l*g,l*f,a*c);break;case"YXY":n.set(l*f,a*h,l*g,a*c);break;case"ZYZ":n.set(l*g,l*f,a*h,a*c);break;default:Xe("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function ss(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function qt(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var sn={DEG2RAD:Hs,RAD2DEG:cs,generateUUID:Di,clamp:et,euclideanModulo:xc,mapLinear:ef,inverseLerp:tf,lerp:Gs,damp:nf,pingpong:sf,smoothstep:rf,smootherstep:of,randInt:af,randFloat:lf,randFloatSpread:cf,seededRandom:hf,degToRad:uf,radToDeg:df,isPowerOfTwo:ff,ceilPowerOfTwo:pf,floorPowerOfTwo:mf,setQuaternionFromProperEuler:gf,normalize:qt,denormalize:ss},ue=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6],this.y=s[1]*t+s[4]*i+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(et(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*i-o*s+e.x,this.y=r*s+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Zt=class{constructor(e=0,t=0,i=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=s}static slerpFlat(e,t,i,s,r,o,a){let l=i[s+0],c=i[s+1],h=i[s+2],d=i[s+3],u=r[o+0],f=r[o+1],g=r[o+2],b=r[o+3];if(d!==b||l!==u||c!==f||h!==g){let m=l*u+c*f+h*g+d*b;m<0&&(u=-u,f=-f,g=-g,b=-b,m=-m);let p=1-a;if(m<.9995){let M=Math.acos(m),A=Math.sin(M);p=Math.sin(p*M)/A,a=Math.sin(a*M)/A,l=l*p+u*a,c=c*p+f*a,h=h*p+g*a,d=d*p+b*a}else{l=l*p+u*a,c=c*p+f*a,h=h*p+g*a,d=d*p+b*a;let M=1/Math.sqrt(l*l+c*c+h*h+d*d);l*=M,c*=M,h*=M,d*=M}}e[t]=l,e[t+1]=c,e[t+2]=h,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,s,r,o){let a=i[s],l=i[s+1],c=i[s+2],h=i[s+3],d=r[o],u=r[o+1],f=r[o+2],g=r[o+3];return e[t]=a*g+h*d+l*f-c*u,e[t+1]=l*g+h*u+c*d-a*f,e[t+2]=c*g+h*f+a*u-l*d,e[t+3]=h*g-a*d-l*u-c*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,s){return this._x=e,this._y=t,this._z=i,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,l=Math.sin,c=a(i/2),h=a(s/2),d=a(r/2),u=l(i/2),f=l(s/2),g=l(r/2);switch(o){case"XYZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"YXZ":this._x=u*h*d+c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"ZXY":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d-u*f*g;break;case"ZYX":this._x=u*h*d-c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d+u*f*g;break;case"YZX":this._x=u*h*d+c*f*g,this._y=c*f*d+u*h*g,this._z=c*h*g-u*f*d,this._w=c*h*d-u*f*g;break;case"XZY":this._x=u*h*d-c*f*g,this._y=c*f*d-u*h*g,this._z=c*h*g+u*f*d,this._w=c*h*d+u*f*g;break;default:Xe("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,s=Math.sin(i);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],s=t[4],r=t[8],o=t[1],a=t[5],l=t[9],c=t[2],h=t[6],d=t[10],u=i+a+d;if(u>0){let f=.5/Math.sqrt(u+1);this._w=.25/f,this._x=(h-l)*f,this._y=(r-c)*f,this._z=(o-s)*f}else if(i>a&&i>d){let f=2*Math.sqrt(1+i-a-d);this._w=(h-l)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+c)/f}else if(a>d){let f=2*Math.sqrt(1+a-i-d);this._w=(r-c)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(l+h)/f}else{let f=2*Math.sqrt(1+d-i-a);this._w=(o-s)/f,this._x=(r+c)/f,this._y=(l+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(et(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let s=Math.min(1,t/i);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=t._x,l=t._y,c=t._z,h=t._w;return this._x=i*h+o*a+s*c-r*l,this._y=s*h+o*l+r*a-i*c,this._z=r*h+o*c+i*l-s*a,this._w=o*h-i*a-s*l-r*c,this._onChangeCallback(),this}slerp(e,t){let i=e._x,s=e._y,r=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,s=-s,r=-r,o=-o,a=-a);let l=1-t;if(a<.9995){let c=Math.acos(a),h=Math.sin(c);l=Math.sin(l*c)/h,t=Math.sin(t*c)/h,this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this._onChangeCallback()}else this._x=this._x*l+i*t,this._y=this._y*l+s*t,this._z=this._z*l+r*t,this._w=this._w*l+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),s=Math.sqrt(1-i),r=Math.sqrt(i);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},P=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(mh.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(mh.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6]*s,this.y=r[1]*t+r[4]*i+r[7]*s,this.z=r[2]*t+r[5]*i+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*i+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*i+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*i+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*i+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,s=this.z,r=e.x,o=e.y,a=e.z,l=e.w,c=2*(o*s-a*i),h=2*(a*t-r*s),d=2*(r*i-o*t);return this.x=t+l*c+o*d-a*h,this.y=i+l*h+a*c-r*d,this.z=s+l*d+r*h-o*c,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*i+r[8]*s,this.y=r[1]*t+r[5]*i+r[9]*s,this.z=r[2]*t+r[6]*i+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,s=e.y,r=e.z,o=t.x,a=t.y,l=t.z;return this.x=s*l-r*a,this.y=r*o-i*l,this.z=i*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return fl.copy(this).projectOnVector(e),this.sub(fl)}reflect(e){return this.sub(fl.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(et(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,s=this.z-e.z;return t*t+i*i+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let s=Math.sin(t)*e;return this.x=s*Math.sin(i),this.y=Math.cos(t)*e,this.z=s*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},fl=new P,mh=new Zt,Ze=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,s,r,o,a,l,c){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c)}set(e,t,i,s,r,o,a,l,c){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=l,h[6]=i,h[7]=o,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[3],l=i[6],c=i[1],h=i[4],d=i[7],u=i[2],f=i[5],g=i[8],b=s[0],m=s[3],p=s[6],M=s[1],A=s[4],v=s[7],E=s[2],S=s[5],C=s[8];return r[0]=o*b+a*M+l*E,r[3]=o*m+a*A+l*S,r[6]=o*p+a*v+l*C,r[1]=c*b+h*M+d*E,r[4]=c*m+h*A+d*S,r[7]=c*p+h*v+d*C,r[2]=u*b+f*M+g*E,r[5]=u*m+f*A+g*S,r[8]=u*p+f*v+g*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8];return t*o*h-t*a*c-i*r*h+i*a*l+s*r*c-s*o*l}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=h*o-a*c,u=a*l-h*r,f=c*r-o*l,g=t*d+i*u+s*f;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/g;return e[0]=d*b,e[1]=(s*c-h*i)*b,e[2]=(a*i-s*o)*b,e[3]=u*b,e[4]=(h*t-s*l)*b,e[5]=(s*r-a*t)*b,e[6]=f*b,e[7]=(i*l-c*t)*b,e[8]=(o*t-i*r)*b,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,s,r,o,a){let l=Math.cos(r),c=Math.sin(r);return this.set(i*l,i*c,-i*(l*o+c*a)+o+e,-s*c,s*l,-s*(-c*o+l*a)+a+t,0,0,1),this}scale(e,t){return Si("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(pl.makeScale(e,t)),this}rotate(e){return Si("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(pl.makeRotation(-e)),this}translate(e,t){return Si("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(pl.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<9;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},pl=new Ze,gh=new Ze().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),xh=new Ze().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function xf(){let n={enabled:!0,workingColorSpace:qs,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===dt&&(s.r=Bn(s.r),s.g=Bn(s.g),s.b=Bn(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===dt&&(s.r=rs(s.r),s.g=rs(s.g),s.b=rs(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===zn?Ys:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Si("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Si("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(s,r)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[qs]:{primaries:e,whitePoint:i,transfer:Ys,toXYZ:gh,fromXYZ:xh,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:Yt},outputColorSpaceConfig:{drawingBufferColorSpace:Yt}},[Yt]:{primaries:e,whitePoint:i,transfer:dt,toXYZ:gh,fromXYZ:xh,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:Yt}}}),n}var it=xf();function Bn(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function rs(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Xi,Mo=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Xi===void 0&&(Xi=Zs("canvas")),Xi.width=e.width,Xi.height=e.height;let s=Xi.getContext("2d");e instanceof ImageData?s.putImageData(e,0,0):s.drawImage(e,0,0,e.width,e.height),i=Xi}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=Zs("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let s=i.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=Bn(r[o]/255)*255;return i.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Bn(t[i]/255)*255):t[i]=Bn(t[i]);return{data:t,width:e.width,height:e.height}}else return Xe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},_f=0,hs=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:_f++}),this.uuid=Di(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(ml(s[o].image)):r.push(ml(s[o]))}else r=ml(s);i.url=r}return t||(e.images[this.uuid]=i),i}};function ml(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Mo.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Xe("Texture: Unable to serialize Texture."),{})}var vf=0,gl=new P,Kt=class n extends Rn{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=Tn,s=Tn,r=Ut,o=hi,a=hn,l=jt,c=n.DEFAULT_ANISOTROPY,h=zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:vf++}),this.uuid=Di(),this.name="",this.source=new hs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=c,this.format=a,this.internalFormat=null,this.type=l,this.offset=new ue(0,0),this.repeat=new ue(1,1),this.center=new ue(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Ze,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(gl).x}get height(){return this.source.getSize(gl).y}get depth(){return this.source.getSize(gl).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Xe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Xe(`Texture.setValues(): property '${t}' does not exist.`);continue}s&&i&&s.isVector2&&i.isVector2||s&&i&&s.isVector3&&i.isVector3||s&&i&&s.isMatrix3&&i.isMatrix3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==lc)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case vo:e.x=e.x-Math.floor(e.x);break;case Tn:e.x=e.x<0?0:1;break;case yo:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case vo:e.y=e.y-Math.floor(e.y);break;case Tn:e.y=e.y<0?0:1;break;case yo:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Kt.DEFAULT_IMAGE=null;Kt.DEFAULT_MAPPING=lc;Kt.DEFAULT_ANISOTROPY=1;var St=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,s=1){this.x=e,this.y=t,this.z=i,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,s){return this.x=e,this.y=t,this.z=i,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*i+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*i+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*i+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,s,r,l=e.elements,c=l[0],h=l[4],d=l[8],u=l[1],f=l[5],g=l[9],b=l[2],m=l[6],p=l[10];if(Math.abs(h-u)<.01&&Math.abs(d-b)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+b)<.1&&Math.abs(g+m)<.1&&Math.abs(c+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let A=(c+1)/2,v=(f+1)/2,E=(p+1)/2,S=(h+u)/4,C=(d+b)/4,_=(g+m)/4;return A>v&&A>E?A<.01?(i=0,s=.707106781,r=.707106781):(i=Math.sqrt(A),s=S/i,r=C/i):v>E?v<.01?(i=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),i=S/s,r=_/s):E<.01?(i=.707106781,s=.707106781,r=0):(r=Math.sqrt(E),i=C/r,s=_/r),this.set(i,s,r,t),this}let M=Math.sqrt((m-g)*(m-g)+(d-b)*(d-b)+(u-h)*(u-h));return Math.abs(M)<.001&&(M=1),this.x=(m-g)/M,this.y=(d-b)/M,this.z=(u-h)/M,this.w=Math.acos((c+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=et(this.x,e.x,t.x),this.y=et(this.y,e.y,t.y),this.z=et(this.z,e.z,t.z),this.w=et(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=et(this.x,e,t),this.y=et(this.y,e,t),this.z=et(this.z,e,t),this.w=et(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(et(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},So=class extends Rn{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Ut,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new St(0,0,e,t),this.scissorTest=!1,this.viewport=new St(0,0,e,t),this.textures=[];let s={width:e,height:t,depth:i.depth},r=new Kt(s),o=i.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Ut,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=i,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let s=Object.assign({},e.textures[t].image);this.textures[t].source=new hs(s)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},Ht=class extends So{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},$s=class extends Kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Mt,this.minFilter=Mt,this.wrapR=Tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Eo=class extends Kt{constructor(e=null,t=1,i=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:s},this.magFilter=Mt,this.minFilter=Mt,this.wrapR=Tn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var vt=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,s,r,o,a,l,c,h,d,u,f,g,b,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,s,r,o,a,l,c,h,d,u,f,g,b,m)}set(e,t,i,s,r,o,a,l,c,h,d,u,f,g,b,m){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=s,p[1]=r,p[5]=o,p[9]=a,p[13]=l,p[2]=c,p[6]=h,p[10]=d,p[14]=u,p[3]=f,p[7]=g,p[11]=b,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,s=1/qi.setFromMatrixColumn(e,0).length(),r=1/qi.setFromMatrixColumn(e,1).length(),o=1/qi.setFromMatrixColumn(e,2).length();return t[0]=i[0]*s,t[1]=i[1]*s,t[2]=i[2]*s,t[3]=0,t[4]=i[4]*r,t[5]=i[5]*r,t[6]=i[6]*r,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,s=e.y,r=e.z,o=Math.cos(i),a=Math.sin(i),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(e.order==="XYZ"){let u=o*h,f=o*d,g=a*h,b=a*d;t[0]=l*h,t[4]=-l*d,t[8]=c,t[1]=f+g*c,t[5]=u-b*c,t[9]=-a*l,t[2]=b-u*c,t[6]=g+f*c,t[10]=o*l}else if(e.order==="YXZ"){let u=l*h,f=l*d,g=c*h,b=c*d;t[0]=u+b*a,t[4]=g*a-f,t[8]=o*c,t[1]=o*d,t[5]=o*h,t[9]=-a,t[2]=f*a-g,t[6]=b+u*a,t[10]=o*l}else if(e.order==="ZXY"){let u=l*h,f=l*d,g=c*h,b=c*d;t[0]=u-b*a,t[4]=-o*d,t[8]=g+f*a,t[1]=f+g*a,t[5]=o*h,t[9]=b-u*a,t[2]=-o*c,t[6]=a,t[10]=o*l}else if(e.order==="ZYX"){let u=o*h,f=o*d,g=a*h,b=a*d;t[0]=l*h,t[4]=g*c-f,t[8]=u*c+b,t[1]=l*d,t[5]=b*c+u,t[9]=f*c-g,t[2]=-c,t[6]=a*l,t[10]=o*l}else if(e.order==="YZX"){let u=o*l,f=o*c,g=a*l,b=a*c;t[0]=l*h,t[4]=b-u*d,t[8]=g*d+f,t[1]=d,t[5]=o*h,t[9]=-a*h,t[2]=-c*h,t[6]=f*d+g,t[10]=u-b*d}else if(e.order==="XZY"){let u=o*l,f=o*c,g=a*l,b=a*c;t[0]=l*h,t[4]=-d,t[8]=c*h,t[1]=u*d+b,t[5]=o*h,t[9]=f*d-g,t[2]=g*d-f,t[6]=a*h,t[10]=b*d+u}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(yf,e,bf)}lookAt(e,t,i){let s=this.elements;return Qt.subVectors(e,t),Qt.lengthSq()===0&&(Qt.z=1),Qt.normalize(),qn.crossVectors(i,Qt),qn.lengthSq()===0&&(Math.abs(i.z)===1?Qt.x+=1e-4:Qt.z+=1e-4,Qt.normalize(),qn.crossVectors(i,Qt)),qn.normalize(),Gr.crossVectors(Qt,qn),s[0]=qn.x,s[4]=Gr.x,s[8]=Qt.x,s[1]=qn.y,s[5]=Gr.y,s[9]=Qt.y,s[2]=qn.z,s[6]=Gr.z,s[10]=Qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,s=t.elements,r=this.elements,o=i[0],a=i[4],l=i[8],c=i[12],h=i[1],d=i[5],u=i[9],f=i[13],g=i[2],b=i[6],m=i[10],p=i[14],M=i[3],A=i[7],v=i[11],E=i[15],S=s[0],C=s[4],_=s[8],w=s[12],I=s[1],L=s[5],B=s[9],G=s[13],N=s[2],z=s[6],X=s[10],Y=s[14],re=s[3],Z=s[7],ee=s[11],ne=s[15];return r[0]=o*S+a*I+l*N+c*re,r[4]=o*C+a*L+l*z+c*Z,r[8]=o*_+a*B+l*X+c*ee,r[12]=o*w+a*G+l*Y+c*ne,r[1]=h*S+d*I+u*N+f*re,r[5]=h*C+d*L+u*z+f*Z,r[9]=h*_+d*B+u*X+f*ee,r[13]=h*w+d*G+u*Y+f*ne,r[2]=g*S+b*I+m*N+p*re,r[6]=g*C+b*L+m*z+p*Z,r[10]=g*_+b*B+m*X+p*ee,r[14]=g*w+b*G+m*Y+p*ne,r[3]=M*S+A*I+v*N+E*re,r[7]=M*C+A*L+v*z+E*Z,r[11]=M*_+A*B+v*X+E*ee,r[15]=M*w+A*G+v*Y+E*ne,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[12],o=e[1],a=e[5],l=e[9],c=e[13],h=e[2],d=e[6],u=e[10],f=e[14],g=e[3],b=e[7],m=e[11],p=e[15],M=l*f-c*u,A=a*f-c*d,v=a*u-l*d,E=o*f-c*h,S=o*u-l*h,C=o*d-a*h;return t*(b*M-m*A+p*v)-i*(g*M-m*E+p*S)+s*(g*A-b*E+p*C)-r*(g*v-b*S+m*C)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],s=e[8],r=e[1],o=e[5],a=e[9],l=e[2],c=e[6],h=e[10];return t*(o*h-a*c)-i*(r*h-a*l)+s*(r*c-o*l)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],s=e[2],r=e[3],o=e[4],a=e[5],l=e[6],c=e[7],h=e[8],d=e[9],u=e[10],f=e[11],g=e[12],b=e[13],m=e[14],p=e[15],M=t*a-i*o,A=t*l-s*o,v=t*c-r*o,E=i*l-s*a,S=i*c-r*a,C=s*c-r*l,_=h*b-d*g,w=h*m-u*g,I=h*p-f*g,L=d*m-u*b,B=d*p-f*b,G=u*p-f*m,N=M*G-A*B+v*L+E*I-S*w+C*_;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let z=1/N;return e[0]=(a*G-l*B+c*L)*z,e[1]=(s*B-i*G-r*L)*z,e[2]=(b*C-m*S+p*E)*z,e[3]=(u*S-d*C-f*E)*z,e[4]=(l*I-o*G-c*w)*z,e[5]=(t*G-s*I+r*w)*z,e[6]=(m*v-g*C-p*A)*z,e[7]=(h*C-u*v+f*A)*z,e[8]=(o*B-a*I+c*_)*z,e[9]=(i*I-t*B-r*_)*z,e[10]=(g*S-b*v+p*M)*z,e[11]=(d*v-h*S-f*M)*z,e[12]=(a*w-o*L-l*_)*z,e[13]=(t*L-i*w+s*_)*z,e[14]=(b*A-g*E-m*M)*z,e[15]=(h*E-d*A+u*M)*z,this}scale(e){let t=this.elements,i=e.x,s=e.y,r=e.z;return t[0]*=i,t[4]*=s,t[8]*=r,t[1]*=i,t[5]*=s,t[9]*=r,t[2]*=i,t[6]*=s,t[10]*=r,t[3]*=i,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,s))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),s=Math.sin(t),r=1-i,o=e.x,a=e.y,l=e.z,c=r*o,h=r*a;return this.set(c*o+i,c*a-s*l,c*l+s*a,0,c*a+s*l,h*a+i,h*l-s*o,0,c*l-s*a,h*l+s*o,r*l*l+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,s,r,o){return this.set(1,i,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,i){let s=this.elements,r=t._x,o=t._y,a=t._z,l=t._w,c=r+r,h=o+o,d=a+a,u=r*c,f=r*h,g=r*d,b=o*h,m=o*d,p=a*d,M=l*c,A=l*h,v=l*d,E=i.x,S=i.y,C=i.z;return s[0]=(1-(b+p))*E,s[1]=(f+v)*E,s[2]=(g-A)*E,s[3]=0,s[4]=(f-v)*S,s[5]=(1-(u+p))*S,s[6]=(m+M)*S,s[7]=0,s[8]=(g+A)*C,s[9]=(m-M)*C,s[10]=(1-(u+b))*C,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,i){let s=this.elements;e.x=s[12],e.y=s[13],e.z=s[14];let r=this.determinantAffine();if(r===0)return i.set(1,1,1),t.identity(),this;let o=qi.set(s[0],s[1],s[2]).length(),a=qi.set(s[4],s[5],s[6]).length(),l=qi.set(s[8],s[9],s[10]).length();r<0&&(o=-o),fn.copy(this);let c=1/o,h=1/a,d=1/l;return fn.elements[0]*=c,fn.elements[1]*=c,fn.elements[2]*=c,fn.elements[4]*=h,fn.elements[5]*=h,fn.elements[6]*=h,fn.elements[8]*=d,fn.elements[9]*=d,fn.elements[10]*=d,t.setFromRotationMatrix(fn),i.x=o,i.y=a,i.z=l,this}makePerspective(e,t,i,s,r,o,a=xn,l=!1){let c=this.elements,h=2*r/(t-e),d=2*r/(i-s),u=(t+e)/(t-e),f=(i+s)/(i-s),g,b;if(l)g=r/(o-r),b=o*r/(o-r);else if(a===xn)g=-(o+r)/(o-r),b=-2*o*r/(o-r);else if(a===as)g=-o/(o-r),b=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=d,c[9]=f,c[13]=0,c[2]=0,c[6]=0,c[10]=g,c[14]=b,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,i,s,r,o,a=xn,l=!1){let c=this.elements,h=2/(t-e),d=2/(i-s),u=-(t+e)/(t-e),f=-(i+s)/(i-s),g,b;if(l)g=1/(o-r),b=o/(o-r);else if(a===xn)g=-2/(o-r),b=-(o+r)/(o-r);else if(a===as)g=-1/(o-r),b=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=h,c[4]=0,c[8]=0,c[12]=u,c[1]=0,c[5]=d,c[9]=0,c[13]=f,c[2]=0,c[6]=0,c[10]=g,c[14]=b,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let s=0;s<16;s++)if(t[s]!==i[s])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},qi=new P,fn=new vt,yf=new P(0,0,0),bf=new P(1,1,1),qn=new P,Gr=new P,Qt=new P,_h=new vt,vh=new Zt,ln=class n{constructor(e=0,t=0,i=0,s=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,s=this._order){return this._x=e,this._y=t,this._z=i,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],l=s[1],c=s[5],h=s[9],d=s[2],u=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(et(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,c),this._z=0);break;case"YXZ":this._x=Math.asin(-et(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(et(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-et(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,f),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-o,c));break;case"YZX":this._z=Math.asin(et(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-et(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,c),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:Xe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return _h.makeRotationFromQuaternion(e),this.setFromRotationMatrix(_h,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return vh.setFromEuler(this),this.setFromQuaternion(vh,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};ln.DEFAULT_ORDER="XYZ";var Ks=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},Mf=0,yh=new P,Yi=new Zt,Ln=new vt,Vr=new P,Fs=new P,Sf=new P,Ef=new Zt,bh=new P(1,0,0),Mh=new P(0,1,0),Sh=new P(0,0,1),Eh={type:"added"},wf={type:"removed"},Zi={type:"childadded",child:null},xl={type:"childremoved",child:null},Gt=class n extends Rn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Mf++}),this.uuid=Di(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new P,t=new ln,i=new Zt,s=new P(1,1,1);function r(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(r),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new vt},normalMatrix:{value:new Ze}}),this.matrix=new vt,this.matrixWorld=new vt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Ks,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.multiply(Yi),this}rotateOnWorldAxis(e,t){return Yi.setFromAxisAngle(e,t),this.quaternion.premultiply(Yi),this}rotateX(e){return this.rotateOnAxis(bh,e)}rotateY(e){return this.rotateOnAxis(Mh,e)}rotateZ(e){return this.rotateOnAxis(Sh,e)}translateOnAxis(e,t){return yh.copy(e).applyQuaternion(this.quaternion),this.position.add(yh.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(bh,e)}translateY(e){return this.translateOnAxis(Mh,e)}translateZ(e){return this.translateOnAxis(Sh,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ln.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Vr.copy(e):Vr.set(e,t,i);let s=this.parent;this.updateWorldMatrix(!0,!1),Fs.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ln.lookAt(Fs,Vr,this.up):Ln.lookAt(Vr,Fs,this.up),this.quaternion.setFromRotationMatrix(Ln),s&&(Ln.extractRotation(s.matrixWorld),Yi.setFromRotationMatrix(Ln),this.quaternion.premultiply(Yi.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(qe("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(Eh),Zi.child=e,this.dispatchEvent(Zi),Zi.child=null):qe("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(wf),xl.child=e,this.dispatchEvent(xl),xl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ln.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ln.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ln),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(Eh),Zi.child=e,this.dispatchEvent(Zi),Zi.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,s=this.children.length;i<s;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fs,e,Sf),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Fs,Ef,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,s=e.z,r=this.matrix.elements;r[12]+=t-r[0]*t-r[4]*i-r[8]*s,r[13]+=i-r[1]*t-r[5]*i-r[9]*s,r[14]+=s-r[2]*t-r[6]*i-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,s=t.length;i<s;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let s=this.parent;if(e===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(e),s.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,l){return a[l.uuid]===void 0&&(a[l.uuid]=l.toJSON(e)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let l=a.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let d=l[c];r(e.shapes,d)}else r(e.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let l=0,c=this.material.length;l<c;l++)a.push(r(e.materials,this.material[l]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let l=this.animations[a];s.animations.push(r(e.animations,l))}}if(t){let a=o(e.geometries),l=o(e.materials),c=o(e.textures),h=o(e.images),d=o(e.shapes),u=o(e.skeletons),f=o(e.animations),g=o(e.nodes);a.length>0&&(i.geometries=a),l.length>0&&(i.materials=l),c.length>0&&(i.textures=c),h.length>0&&(i.images=h),d.length>0&&(i.shapes=d),u.length>0&&(i.skeletons=u),f.length>0&&(i.animations=f),g.length>0&&(i.nodes=g)}return i.object=s,i;function o(a){let l=[];for(let c in a){let h=a[c];delete h.metadata,l.push(h)}return l}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let s=e.children[i];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Gt.DEFAULT_UP=new P(0,1,0);Gt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Gt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ae=class extends Gt{constructor(){super(),this.isGroup=!0,this.type="Group"}},Tf={type:"move"},us=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ae,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ae,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ae,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let s=null,r=null,o=null,a=this._targetRay,l=this._grip,c=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(c&&e.hand){o=!0;for(let b of e.hand.values()){let m=t.getJointPose(b,i),p=this._getHandJoint(c,b);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}let h=c.joints["index-finger-tip"],d=c.joints["thumb-tip"],u=h.position.distanceTo(d.position),f=.02,g=.005;c.inputState.pinching&&u>f+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!c.inputState.pinching&&u<=f-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else l!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,i),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1,l.eventsEnabled&&l.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(s=t.getPose(e.targetRaySpace,i),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(Tf)))}return a!==null&&(a.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ae;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},wu={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Yn={h:0,s:0,l:0},Wr={h:0,s:0,l:0};function _l(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Le=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=Yt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,it.colorSpaceToWorking(this,t),this}setRGB(e,t,i,s=it.workingColorSpace){return this.r=e,this.g=t,this.b=i,it.colorSpaceToWorking(this,s),this}setHSL(e,t,i,s=it.workingColorSpace){if(e=xc(e,1),t=et(t,0,1),i=et(i,0,1),t===0)this.r=this.g=this.b=i;else{let r=i<=.5?i*(1+t):i+t-i*t,o=2*i-r;this.r=_l(o,r,e+1/3),this.g=_l(o,r,e),this.b=_l(o,r,e-1/3)}return it.colorSpaceToWorking(this,s),this}setStyle(e,t=Yt){function i(r){r!==void 0&&parseFloat(r)<1&&Xe("Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:Xe("Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);Xe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=Yt){let i=wu[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Xe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Bn(e.r),this.g=Bn(e.g),this.b=Bn(e.b),this}copyLinearToSRGB(e){return this.r=rs(e.r),this.g=rs(e.g),this.b=rs(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=Yt){return it.workingToColorSpace(zt.copy(this),e),Math.round(et(zt.r*255,0,255))*65536+Math.round(et(zt.g*255,0,255))*256+Math.round(et(zt.b*255,0,255))}getHexString(e=Yt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=it.workingColorSpace){it.workingToColorSpace(zt.copy(this),t);let i=zt.r,s=zt.g,r=zt.b,o=Math.max(i,s,r),a=Math.min(i,s,r),l,c,h=(a+o)/2;if(a===o)l=0,c=0;else{let d=o-a;switch(c=h<=.5?d/(o+a):d/(2-o-a),o){case i:l=(s-r)/d+(s<r?6:0);break;case s:l=(r-i)/d+2;break;case r:l=(i-s)/d+4;break}l/=6}return e.h=l,e.s=c,e.l=h,e}getRGB(e,t=it.workingColorSpace){return it.workingToColorSpace(zt.copy(this),t),e.r=zt.r,e.g=zt.g,e.b=zt.b,e}getStyle(e=Yt){it.workingToColorSpace(zt.copy(this),e);let t=zt.r,i=zt.g,s=zt.b;return e!==Yt?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(s*255)})`}offsetHSL(e,t,i){return this.getHSL(Yn),this.setHSL(Yn.h+e,Yn.s+t,Yn.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Yn),e.getHSL(Wr);let i=Gs(Yn.h,Wr.h,t),s=Gs(Yn.s,Wr.s,t),r=Gs(Yn.l,Wr.l,t);return this.setHSL(i,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*i+r[6]*s,this.g=r[1]*t+r[4]*i+r[7]*s,this.b=r[2]*t+r[5]*i+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},zt=new Le;Le.NAMES=wu;var Js=class n{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Le(e),this.near=t,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},ds=class extends Gt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ln,this.environmentIntensity=1,this.environmentRotation=new ln,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},pn=new P,Nn=new P,vl=new P,Un=new P,$i=new P,Ki=new P,wh=new P,yl=new P,bl=new P,Ml=new P,Sl=new St,El=new St,wl=new St,Jn=class n{constructor(e=new P,t=new P,i=new P){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,s){s.subVectors(i,t),pn.subVectors(e,t),s.cross(pn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,i,s,r){pn.subVectors(s,t),Nn.subVectors(i,t),vl.subVectors(e,t);let o=pn.dot(pn),a=pn.dot(Nn),l=pn.dot(vl),c=Nn.dot(Nn),h=Nn.dot(vl),d=o*c-a*a;if(d===0)return r.set(0,0,0),null;let u=1/d,f=(c*l-a*h)*u,g=(o*h-a*l)*u;return r.set(1-f-g,g,f)}static containsPoint(e,t,i,s){return this.getBarycoord(e,t,i,s,Un)===null?!1:Un.x>=0&&Un.y>=0&&Un.x+Un.y<=1}static getInterpolation(e,t,i,s,r,o,a,l){return this.getBarycoord(e,t,i,s,Un)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,Un.x),l.addScaledVector(o,Un.y),l.addScaledVector(a,Un.z),l)}static getInterpolatedAttribute(e,t,i,s,r,o){return Sl.setScalar(0),El.setScalar(0),wl.setScalar(0),Sl.fromBufferAttribute(e,t),El.fromBufferAttribute(e,i),wl.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(Sl,r.x),o.addScaledVector(El,r.y),o.addScaledVector(wl,r.z),o}static isFrontFacing(e,t,i,s){return pn.subVectors(i,t),Nn.subVectors(e,t),pn.cross(Nn).dot(s)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,s){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,i,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return pn.subVectors(this.c,this.b),Nn.subVectors(this.a,this.b),pn.cross(Nn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,s,r){return n.getInterpolation(e,this.a,this.b,this.c,t,i,s,r)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,s=this.b,r=this.c,o,a;$i.subVectors(s,i),Ki.subVectors(r,i),yl.subVectors(e,i);let l=$i.dot(yl),c=Ki.dot(yl);if(l<=0&&c<=0)return t.copy(i);bl.subVectors(e,s);let h=$i.dot(bl),d=Ki.dot(bl);if(h>=0&&d<=h)return t.copy(s);let u=l*d-h*c;if(u<=0&&l>=0&&h<=0)return o=l/(l-h),t.copy(i).addScaledVector($i,o);Ml.subVectors(e,r);let f=$i.dot(Ml),g=Ki.dot(Ml);if(g>=0&&f<=g)return t.copy(r);let b=f*c-l*g;if(b<=0&&c>=0&&g<=0)return a=c/(c-g),t.copy(i).addScaledVector(Ki,a);let m=h*g-f*d;if(m<=0&&d-h>=0&&f-g>=0)return wh.subVectors(r,s),a=(d-h)/(d-h+(f-g)),t.copy(s).addScaledVector(wh,a);let p=1/(m+b+u);return o=b*p,a=u*p,t.copy(i).addScaledVector($i,o).addScaledVector(Ki,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},Cn=class{constructor(e=new P(1/0,1/0,1/0),t=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(mn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(mn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=mn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let r=i.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,mn):mn.fromBufferAttribute(r,o),mn.applyMatrix4(e.matrixWorld),this.expandByPoint(mn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Xr.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Xr.copy(i.boundingBox)),Xr.applyMatrix4(e.matrixWorld),this.union(Xr)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,mn),mn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Os),qr.subVectors(this.max,Os),Ji.subVectors(e.a,Os),ji.subVectors(e.b,Os),Qi.subVectors(e.c,Os),Zn.subVectors(ji,Ji),$n.subVectors(Qi,ji),_i.subVectors(Ji,Qi);let t=[0,-Zn.z,Zn.y,0,-$n.z,$n.y,0,-_i.z,_i.y,Zn.z,0,-Zn.x,$n.z,0,-$n.x,_i.z,0,-_i.x,-Zn.y,Zn.x,0,-$n.y,$n.x,0,-_i.y,_i.x,0];return!Tl(t,Ji,ji,Qi,qr)||(t=[1,0,0,0,1,0,0,0,1],!Tl(t,Ji,ji,Qi,qr))?!1:(Yr.crossVectors(Zn,$n),t=[Yr.x,Yr.y,Yr.z],Tl(t,Ji,ji,Qi,qr))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,mn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(mn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Fn[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Fn[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Fn[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Fn[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Fn[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Fn[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Fn[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Fn[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Fn),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Fn=[new P,new P,new P,new P,new P,new P,new P,new P],mn=new P,Xr=new Cn,Ji=new P,ji=new P,Qi=new P,Zn=new P,$n=new P,_i=new P,Os=new P,qr=new P,Yr=new P,vi=new P;function Tl(n,e,t,i,s){for(let r=0,o=n.length-3;r<=o;r+=3){vi.fromArray(n,r);let a=s.x*Math.abs(vi.x)+s.y*Math.abs(vi.y)+s.z*Math.abs(vi.z),l=e.dot(vi),c=t.dot(vi),h=i.dot(vi);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>a)return!1}return!0}var Rt=new P,Zr=new ue,Af=0,kt=class extends Rn{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Af++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=yu,this.updateRanges=[],this.gpuType=yn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[i+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Zr.fromBufferAttribute(this,t),Zr.applyMatrix3(e),this.setXY(t,Zr.x,Zr.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix3(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyMatrix4(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.applyNormalMatrix(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Rt.fromBufferAttribute(this,t),Rt.transformDirection(e),this.setXYZ(t,Rt.x,Rt.y,Rt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=ss(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=qt(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=ss(t,this.array)),t}setX(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=ss(t,this.array)),t}setY(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=ss(t,this.array)),t}setZ(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=ss(t,this.array)),t}setW(e,t){return this.normalized&&(t=qt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,s){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array),s=qt(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this}setXYZW(e,t,i,s,r){return e*=this.itemSize,this.normalized&&(t=qt(t,this.array),i=qt(i,this.array),s=qt(s,this.array),r=qt(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var js=class extends kt{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var Qs=class extends kt{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var at=class extends kt{constructor(e,t,i){super(new Float32Array(e),t,i)}},Rf=new Cn,Bs=new P,Al=new P,fs=class{constructor(e=new P,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):Rf.setFromPoints(e).getCenter(i);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,i.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Bs.subVectors(e,this.center);let t=Bs.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),s=(i-this.radius)*.5;this.center.addScaledVector(Bs,s/i),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Al.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Bs.copy(e.center).add(Al)),this.expandByPoint(Bs.copy(e.center).sub(Al))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},Cf=0,an=new vt,Rl=new Gt,es=new P,en=new Cn,zs=new Cn,Lt=new P,Ct=class n extends Rn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Cf++}),this.uuid=Di(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(jd(e)?Qs:js)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let r=new Ze().getNormalMatrix(e);i.applyNormalMatrix(r),i.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return an.makeRotationFromQuaternion(e),this.applyMatrix4(an),this}rotateX(e){return an.makeRotationX(e),this.applyMatrix4(an),this}rotateY(e){return an.makeRotationY(e),this.applyMatrix4(an),this}rotateZ(e){return an.makeRotationZ(e),this.applyMatrix4(an),this}translate(e,t,i){return an.makeTranslation(e,t,i),this.applyMatrix4(an),this}scale(e,t,i){return an.makeScale(e,t,i),this.applyMatrix4(an),this}lookAt(e){return Rl.lookAt(e),Rl.updateMatrix(),this.applyMatrix4(Rl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(es).negate(),this.translate(es.x,es.y,es.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new at(i,3))}else{let i=Math.min(e.length,t.count);for(let s=0;s<i;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&Xe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Cn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){qe("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,s=t.length;i<s;i++){let r=t[i];en.setFromBufferAttribute(r),this.morphTargetsRelative?(Lt.addVectors(this.boundingBox.min,en.min),this.boundingBox.expandByPoint(Lt),Lt.addVectors(this.boundingBox.max,en.max),this.boundingBox.expandByPoint(Lt)):(this.boundingBox.expandByPoint(en.min),this.boundingBox.expandByPoint(en.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&qe('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new fs);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){qe("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new P,1/0);return}if(e){let i=this.boundingSphere.center;if(en.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];zs.setFromBufferAttribute(a),this.morphTargetsRelative?(Lt.addVectors(en.min,zs.min),en.expandByPoint(Lt),Lt.addVectors(en.max,zs.max),en.expandByPoint(Lt)):(en.expandByPoint(zs.min),en.expandByPoint(zs.max))}en.getCenter(i);let s=0;for(let r=0,o=e.count;r<o;r++)Lt.fromBufferAttribute(e,r),s=Math.max(s,i.distanceToSquared(Lt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],l=this.morphTargetsRelative;for(let c=0,h=a.count;c<h;c++)Lt.fromBufferAttribute(a,c),l&&(es.fromBufferAttribute(e,c),Lt.add(es)),s=Math.max(s,i.distanceToSquared(Lt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&qe('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){qe("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,s=t.normal,r=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new kt(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],l=[];for(let _=0;_<i.count;_++)a[_]=new P,l[_]=new P;let c=new P,h=new P,d=new P,u=new ue,f=new ue,g=new ue,b=new P,m=new P;function p(_,w,I){c.fromBufferAttribute(i,_),h.fromBufferAttribute(i,w),d.fromBufferAttribute(i,I),u.fromBufferAttribute(r,_),f.fromBufferAttribute(r,w),g.fromBufferAttribute(r,I),h.sub(c),d.sub(c),f.sub(u),g.sub(u);let L=1/(f.x*g.y-g.x*f.y);isFinite(L)&&(b.copy(h).multiplyScalar(g.y).addScaledVector(d,-f.y).multiplyScalar(L),m.copy(d).multiplyScalar(f.x).addScaledVector(h,-g.x).multiplyScalar(L),a[_].add(b),a[w].add(b),a[I].add(b),l[_].add(m),l[w].add(m),l[I].add(m))}let M=this.groups;M.length===0&&(M=[{start:0,count:e.count}]);for(let _=0,w=M.length;_<w;++_){let I=M[_],L=I.start,B=I.count;for(let G=L,N=L+B;G<N;G+=3)p(e.getX(G+0),e.getX(G+1),e.getX(G+2))}let A=new P,v=new P,E=new P,S=new P;function C(_){E.fromBufferAttribute(s,_),S.copy(E);let w=a[_];A.copy(w),A.sub(E.multiplyScalar(E.dot(w))).normalize(),v.crossVectors(S,w);let L=v.dot(l[_])<0?-1:1;o.setXYZW(_,A.x,A.y,A.z,L)}for(let _=0,w=M.length;_<w;++_){let I=M[_],L=I.start,B=I.count;for(let G=L,N=L+B;G<N;G+=3)C(e.getX(G+0)),C(e.getX(G+1)),C(e.getX(G+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new kt(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let u=0,f=i.count;u<f;u++)i.setXYZ(u,0,0,0);let s=new P,r=new P,o=new P,a=new P,l=new P,c=new P,h=new P,d=new P;if(e)for(let u=0,f=e.count;u<f;u+=3){let g=e.getX(u+0),b=e.getX(u+1),m=e.getX(u+2);s.fromBufferAttribute(t,g),r.fromBufferAttribute(t,b),o.fromBufferAttribute(t,m),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(i,g),l.fromBufferAttribute(i,b),c.fromBufferAttribute(i,m),a.add(h),l.add(h),c.add(h),i.setXYZ(g,a.x,a.y,a.z),i.setXYZ(b,l.x,l.y,l.z),i.setXYZ(m,c.x,c.y,c.z)}else for(let u=0,f=t.count;u<f;u+=3)s.fromBufferAttribute(t,u+0),r.fromBufferAttribute(t,u+1),o.fromBufferAttribute(t,u+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),i.setXYZ(u+0,h.x,h.y,h.z),i.setXYZ(u+1,h.x,h.y,h.z),i.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Lt.fromBufferAttribute(e,t),Lt.normalize(),e.setXYZ(t,Lt.x,Lt.y,Lt.z)}toNonIndexed(){function e(a,l){let c=a.array,h=a.itemSize,d=a.normalized,u=new c.constructor(l.length*h),f=0,g=0;for(let b=0,m=l.length;b<m;b++){a.isInterleavedBufferAttribute?f=l[b]*a.data.stride+a.offset:f=l[b]*h;for(let p=0;p<h;p++)u[g++]=c[f++]}return new kt(u,h,d)}if(this.index===null)return Xe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,s=this.attributes;for(let a in s){let l=s[a],c=e(l,i);t.setAttribute(a,c)}let r=this.morphAttributes;for(let a in r){let l=[],c=r[a];for(let h=0,d=c.length;h<d;h++){let u=c[h],f=e(u,i);l.push(f)}t.morphAttributes[a]=l}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,l=o.length;a<l;a++){let c=o[a];t.addGroup(c.start,c.count,c.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(e[c]=l[c]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let l in i){let c=i[l];e.data.attributes[l]=c.toJSON(e.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let d=0,u=c.length;d<u;d++){let f=c[d];h.push(f.toJSON(e.data))}h.length>0&&(s[l]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let s=e.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(t))}let r=e.morphAttributes;for(let c in r){let h=[],d=r[c];for(let u=0,f=d.length;u<f;u++)h.push(d[u].clone(t));this.morphAttributes[c]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let c=0,h=o.length;c<h;c++){let d=o[c];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let l=e.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Cl=new P,If=new P,Pf=new Ze,gn=class{constructor(e=new P(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,s){return this.normal.set(e,t,i),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let s=Cl.subVectors(i,t).cross(If.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let s=e.delta(Cl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/r;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(s,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||Pf.getNormalMatrix(e),s=this.coplanarPoint(Cl).applyMatrix4(e),r=this.normal.applyMatrix3(i).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},Df=0,jn=class extends Rn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Df++}),this.uuid=Di(),this.name="",this.type="Material",this.blending=ys,this.side=li,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=jl,this.blendDst=Ql,this.blendEquation=Ii,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Le(0,0,0),this.blendAlpha=0,this.depthFunc=os,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=fu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=ho,this.stencilZFail=ho,this.stencilZPass=ho,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Xe(`Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){Xe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(i):s&&s.isVector2&&i&&i.isVector2||s&&s.isEuler&&i&&i.isEuler||s&&s.isVector3&&i&&i.isVector3?s.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function s(r){let o=[];for(let a in r){let l=r[a];delete l.metadata,o.push(l)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(i.textures=r),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Le().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new gn().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new ue().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new ue().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let s=t.length;i=new Array(s);for(let r=0;r!==s;++r)i[r]=t[r].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var On=new P,Il=new P,$r=new P,Kr=new P,wo=class{constructor(e=new P,t=new P(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,On)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=On.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(On.copy(this.origin).addScaledVector(this.direction,t),On.distanceToSquared(e))}distanceSqToSegment(e,t,i,s){Il.copy(e).add(t).multiplyScalar(.5),$r.copy(t).sub(e).normalize(),Kr.copy(this.origin).sub(Il);let r=e.distanceTo(t)*.5,o=-this.direction.dot($r),a=Kr.dot(this.direction),l=-Kr.dot($r),c=Kr.lengthSq(),h=Math.abs(1-o*o),d,u,f,g;if(h>0)if(d=o*l-a,u=o*a-l,g=r*h,d>=0)if(u>=-g)if(u<=g){let b=1/h;d*=b,u*=b,f=d*(d+o*u+2*a)+u*(o*d+u+2*l)+c}else u=r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;else u=-r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;else u<=-g?(d=Math.max(0,-(-o*r+a)),u=d>0?-r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c):u<=g?(d=0,u=Math.min(Math.max(-r,-l),r),f=u*(u+2*l)+c):(d=Math.max(0,-(o*r+a)),u=d>0?r:Math.min(Math.max(-r,-l),r),f=-d*d+u*(u+2*l)+c);else u=o>0?-r:r,d=Math.max(0,-(o*u+a)),f=-d*d+u*(u+2*l)+c;return i&&i.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Il).addScaledVector($r,u),f}intersectSphere(e,t){if(e.radius<0)return null;On.subVectors(e.center,this.origin);let i=On.dot(this.direction),s=On.dot(On)-i*i,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=i-o,l=i+o;return l<0?null:a<0?this.at(l,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,s,r,o,a,l,c=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return c>=0?(i=(e.min.x-u.x)*c,s=(e.max.x-u.x)*c):(i=(e.max.x-u.x)*c,s=(e.min.x-u.x)*c),h>=0?(r=(e.min.y-u.y)*h,o=(e.max.y-u.y)*h):(r=(e.max.y-u.y)*h,o=(e.min.y-u.y)*h),i>o||r>s||((r>i||isNaN(i))&&(i=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(e.min.z-u.z)*d,l=(e.max.z-u.z)*d):(a=(e.max.z-u.z)*d,l=(e.min.z-u.z)*d),i>l||a>s)||((a>i||i!==i)&&(i=a),(l<s||s!==s)&&(s=l),s<0)?null:this.at(i>=0?i:s,t)}intersectsBox(e){return this.intersectBox(e,On)!==null}intersectTriangle(e,t,i,s,r){let o=this.origin,a=this.direction,l=a.x,c=a.y,h=a.z,d=e.x-o.x,u=e.y-o.y,f=e.z-o.z,g=t.x-o.x,b=t.y-o.y,m=t.z-o.z,p=i.x-o.x,M=i.y-o.y,A=i.z-o.z,v=Math.abs(l),E=Math.abs(c),S=Math.abs(h),C,_,w,I,L,B,G,N,z,X,Y,re;if(v>=E&&v>=S?(w=l,B=d,z=g,re=p,l>=0?(C=c,_=h,I=u,L=f,G=b,N=m,X=M,Y=A):(C=h,_=c,I=f,L=u,G=m,N=b,X=A,Y=M)):E>=S?(w=c,B=u,z=b,re=M,c>=0?(C=h,_=l,I=f,L=d,G=m,N=g,X=A,Y=p):(C=l,_=h,I=d,L=f,G=g,N=m,X=p,Y=A)):(w=h,B=f,z=m,re=A,h>=0?(C=l,_=c,I=d,L=u,G=g,N=b,X=p,Y=M):(C=c,_=l,I=u,L=d,G=b,N=g,X=M,Y=p)),w===0)return null;let Z=C/w,ee=_/w,ne=1/w,De=I-Z*B,Te=L-ee*B,tt=G-Z*z,Je=N-ee*z,st=X-Z*re,K=Y-ee*re,te=st*Je-K*tt,_e=De*K-Te*st,Ge=tt*Te-Je*De;if(s){if(te<0||_e<0||Ge<0)return null}else if((te<0||_e<0||Ge<0)&&(te>0||_e>0||Ge>0))return null;let Se=te+_e+Ge;if(Se===0)return null;let He=ne*(te*B+_e*z+Ge*re);return(Se>0?He<0:He>0)?null:this.at(He/Se,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Jt=class extends jn{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Le(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ln,this.combine=ec,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Th=new vt,yi=new wo,Jr=new fs,Ah=new P,jr=new P,Qr=new P,eo=new P,Pl=new P,to=new P,Rh=new P,no=new P,Ye=class extends Gt{constructor(e=new Ct,t=new Jt){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let s=t[i[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let i=this.geometry,s=i.attributes.position,r=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){to.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=a[l],d=r[l];h!==0&&(Pl.fromBufferAttribute(d,e),o?to.addScaledVector(Pl,h):to.addScaledVector(Pl.sub(t),h))}t.add(to)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Jr.copy(i.boundingSphere),Jr.applyMatrix4(r),yi.copy(e.ray).recast(e.near),!(Jr.containsPoint(yi.origin)===!1&&(yi.intersectSphere(Jr,Ah)===null||yi.origin.distanceToSquared(Ah)>(e.far-e.near)**2))&&(Th.copy(r).invert(),yi.copy(e.ray).applyMatrix4(Th),!(i.boundingBox!==null&&yi.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,yi)))}_computeIntersections(e,t,i){let s,r=this.geometry,o=this.material,a=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,b=u.length;g<b;g++){let m=u[g],p=o[m.materialIndex],M=Math.max(m.start,f.start),A=Math.min(a.count,Math.min(m.start+m.count,f.start+f.count));for(let v=M,E=A;v<E;v+=3){let S=a.getX(v),C=a.getX(v+1),_=a.getX(v+2);s=io(this,p,e,i,c,h,d,S,C,_),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(a.count,f.start+f.count);for(let m=g,p=b;m<p;m+=3){let M=a.getX(m),A=a.getX(m+1),v=a.getX(m+2);s=io(this,o,e,i,c,h,d,M,A,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}else if(l!==void 0)if(Array.isArray(o))for(let g=0,b=u.length;g<b;g++){let m=u[g],p=o[m.materialIndex],M=Math.max(m.start,f.start),A=Math.min(l.count,Math.min(m.start+m.count,f.start+f.count));for(let v=M,E=A;v<E;v+=3){let S=v,C=v+1,_=v+2;s=io(this,p,e,i,c,h,d,S,C,_),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=m.materialIndex,t.push(s))}}else{let g=Math.max(0,f.start),b=Math.min(l.count,f.start+f.count);for(let m=g,p=b;m<p;m+=3){let M=m,A=m+1,v=m+2;s=io(this,o,e,i,c,h,d,M,A,v),s&&(s.faceIndex=Math.floor(m/3),t.push(s))}}}};function Lf(n,e,t,i,s,r,o,a){let l;if(e.side===Ft?l=i.intersectTriangle(o,r,s,!0,a):l=i.intersectTriangle(s,r,o,e.side===li,a),l===null)return null;no.copy(a),no.applyMatrix4(n.matrixWorld);let c=t.ray.origin.distanceTo(no);return c<t.near||c>t.far?null:{distance:c,point:no.clone(),object:n}}function io(n,e,t,i,s,r,o,a,l,c){n.getVertexPosition(a,jr),n.getVertexPosition(l,Qr),n.getVertexPosition(c,eo);let h=Lf(n,e,t,i,jr,Qr,eo,Rh);if(h){let d=new P;Jn.getBarycoord(Rh,jr,Qr,eo,d),s&&(h.uv=Jn.getInterpolatedAttribute(s,a,l,c,d,new ue)),r&&(h.uv1=Jn.getInterpolatedAttribute(r,a,l,c,d,new ue)),o&&(h.normal=Jn.getInterpolatedAttribute(o,a,l,c,d,new P),h.normal.dot(i.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:l,c,normal:new P,materialIndex:0};Jn.getNormal(jr,Qr,eo,u.normal),h.face=u,h.barycoord=d}return h}var Qn=class extends Kt{constructor(e=null,t=1,i=1,s,r,o,a,l,c=Mt,h=Mt,d,u){super(null,o,a,l,c,h,s,r,d,u),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var bi=new fs,Nf=new ue(.5,.5),so=new P,ps=class{constructor(e=new gn,t=new gn,i=new gn,s=new gn,r=new gn,o=new gn){this.planes=[e,t,i,s,r,o]}set(e,t,i,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=xn,i=!1){let s=this.planes,r=e.elements,o=r[0],a=r[1],l=r[2],c=r[3],h=r[4],d=r[5],u=r[6],f=r[7],g=r[8],b=r[9],m=r[10],p=r[11],M=r[12],A=r[13],v=r[14],E=r[15];if(s[0].setComponents(c-o,f-h,p-g,E-M).normalize(),s[1].setComponents(c+o,f+h,p+g,E+M).normalize(),s[2].setComponents(c+a,f+d,p+b,E+A).normalize(),s[3].setComponents(c-a,f-d,p-b,E-A).normalize(),i)s[4].setComponents(l,u,m,v).normalize(),s[5].setComponents(c-l,f-u,p-m,E-v).normalize();else if(s[4].setComponents(c-l,f-u,p-m,E-v).normalize(),t===xn)s[5].setComponents(c+l,f+u,p+m,E+v).normalize();else if(t===as)s[5].setComponents(l,u,m,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),bi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),bi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(bi)}intersectsSprite(e){bi.center.set(0,0,0);let t=Nf.distanceTo(e.center);return bi.radius=.7071067811865476+t,bi.applyMatrix4(e.matrixWorld),this.intersectsSphere(bi)}intersectsSphere(e){let t=this.planes,i=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(i)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let s=t[i];if(so.x=s.normal.x>0?e.max.x:e.min.x,so.y=s.normal.y>0?e.max.y:e.min.y,so.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(so)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var er=class extends Kt{constructor(e=[],t=ci,i,s,r,o,a,l,c,h){super(e,t,i,s,r,o,a,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var ei=class extends Kt{constructor(e,t,i=vn,s,r,o,a=Mt,l=Mt,c,h=An,d=1){if(h!==An&&h!==ui)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:e,height:t,depth:d};super(u,s,r,o,a,l,h,i,c),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new hs(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},To=class extends ei{constructor(e,t=vn,i=ci,s,r,o=Mt,a=Mt,l,c=An){let h={width:e,height:e,depth:1},d=[h,h,h,h,h,h];super(e,e,t,i,s,r,o,a,l,c),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},tr=class extends Kt{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},ti=class n extends Ct{constructor(e=1,t=1,i=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let l=[],c=[],h=[],d=[],u=0,f=0;g("z","y","x",-1,-1,i,t,e,o,r,0),g("z","y","x",1,-1,i,t,-e,o,r,1),g("x","z","y",1,1,e,i,t,s,o,2),g("x","z","y",1,-1,e,i,-t,s,o,3),g("x","y","z",1,-1,e,t,i,s,r,4),g("x","y","z",-1,-1,e,t,-i,s,r,5),this.setIndex(l),this.setAttribute("position",new at(c,3)),this.setAttribute("normal",new at(h,3)),this.setAttribute("uv",new at(d,2));function g(b,m,p,M,A,v,E,S,C,_,w){let I=v/C,L=E/_,B=v/2,G=E/2,N=S/2,z=C+1,X=_+1,Y=0,re=0,Z=new P;for(let ee=0;ee<X;ee++){let ne=ee*L-G;for(let De=0;De<z;De++){let Te=De*I-B;Z[b]=Te*M,Z[m]=ne*A,Z[p]=N,c.push(Z.x,Z.y,Z.z),Z[b]=0,Z[m]=0,Z[p]=S>0?1:-1,h.push(Z.x,Z.y,Z.z),d.push(De/C),d.push(1-ee/_),Y+=1}}for(let ee=0;ee<_;ee++)for(let ne=0;ne<C;ne++){let De=u+ne+z*ee,Te=u+ne+z*(ee+1),tt=u+(ne+1)+z*(ee+1),Je=u+(ne+1)+z*ee;l.push(De,Te,Je),l.push(Te,tt,Je),re+=6}a.addGroup(f,re,w),f+=re,u+=Y}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var nr=class n extends Ct{constructor(e=1,t=32,i=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],l=[],c=new P,h=new ue;o.push(0,0,0),a.push(0,0,1),l.push(.5,.5);for(let d=0,u=3;d<=t;d++,u+=3){let f=i+d/t*s;c.x=e*Math.cos(f),c.y=e*Math.sin(f),o.push(c.x,c.y,c.z),a.push(0,0,1),h.x=(o[u]/e+1)/2,h.y=(o[u+1]/e+1)/2,l.push(h.x,h.y)}for(let d=1;d<=t;d++)r.push(d,d+1,0);this.setIndex(r),this.setAttribute("position",new at(o,3)),this.setAttribute("normal",new at(a,3)),this.setAttribute("uv",new at(l,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},ni=class n extends Ct{constructor(e=1,t=1,i=1,s=32,r=1,o=!1,a=0,l=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:l};let c=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],u=[],f=[],g=0,b=[],m=i/2,p=0;M(),o===!1&&(e>0&&A(!0),t>0&&A(!1)),this.setIndex(h),this.setAttribute("position",new at(d,3)),this.setAttribute("normal",new at(u,3)),this.setAttribute("uv",new at(f,2));function M(){let v=new P,E=new P,S=0,C=(t-e)/i;for(let _=0;_<=r;_++){let w=[],I=_/r,L=I*(t-e)+e;for(let B=0;B<=s;B++){let G=B/s,N=G*l+a,z=Math.sin(N),X=Math.cos(N);E.x=L*z,E.y=-I*i+m,E.z=L*X,d.push(E.x,E.y,E.z),v.set(z,C,X).normalize(),u.push(v.x,v.y,v.z),f.push(G,1-I),w.push(g++)}b.push(w)}for(let _=0;_<s;_++)for(let w=0;w<r;w++){let I=b[w][_],L=b[w+1][_],B=b[w+1][_+1],G=b[w][_+1];(e>0||w!==0)&&(h.push(I,L,G),S+=3),(t>0||w!==r-1)&&(h.push(L,B,G),S+=3)}c.addGroup(p,S,0),p+=S}function A(v){let E=g,S=new ue,C=new P,_=0,w=v===!0?e:t,I=v===!0?1:-1;for(let B=1;B<=s;B++)d.push(0,m*I,0),u.push(0,I,0),f.push(.5,.5),g++;let L=g;for(let B=0;B<=s;B++){let N=B/s*l+a,z=Math.cos(N),X=Math.sin(N);C.x=w*X,C.y=m*I,C.z=w*z,d.push(C.x,C.y,C.z),u.push(0,I,0),S.x=z*.5+.5,S.y=X*.5*I+.5,f.push(S.x,S.y),g++}for(let B=0;B<s;B++){let G=E+B,N=L+B;v===!0?h.push(N,N+1,G):h.push(N+1,N,G),_+=3}c.addGroup(p,_,v===!0?1:2),p+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},ir=class n extends ni{constructor(e=1,t=1,i=32,s=1,r=!1,o=0,a=Math.PI*2){super(0,e,t,i,s,r,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:s,openEnded:r,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},sr=class n extends Ct{constructor(e=[],t=[],i=1,s=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:s};let r=[],o=[];a(s),c(i),h(),this.setAttribute("position",new at(r,3)),this.setAttribute("normal",new at(r.slice(),3)),this.setAttribute("uv",new at(o,2)),s===0?this.computeVertexNormals():this.normalizeNormals();function a(M){let A=new P,v=new P,E=new P;for(let S=0;S<t.length;S+=3)f(t[S+0],A),f(t[S+1],v),f(t[S+2],E),l(A,v,E,M)}function l(M,A,v,E){let S=E+1,C=[];for(let _=0;_<=S;_++){C[_]=[];let w=M.clone().lerp(v,_/S),I=A.clone().lerp(v,_/S),L=S-_;for(let B=0;B<=L;B++)B===0&&_===S?C[_][B]=w:C[_][B]=w.clone().lerp(I,B/L)}for(let _=0;_<S;_++)for(let w=0;w<2*(S-_)-1;w++){let I=Math.floor(w/2);w%2===0?(u(C[_][I+1]),u(C[_+1][I]),u(C[_][I])):(u(C[_][I+1]),u(C[_+1][I+1]),u(C[_+1][I]))}}function c(M){let A=new P;for(let v=0;v<r.length;v+=3)A.x=r[v+0],A.y=r[v+1],A.z=r[v+2],A.normalize().multiplyScalar(M),r[v+0]=A.x,r[v+1]=A.y,r[v+2]=A.z}function h(){let M=new P;for(let A=0;A<r.length;A+=3){M.x=r[A+0],M.y=r[A+1],M.z=r[A+2];let v=m(M)/2/Math.PI+.5,E=p(M)/Math.PI+.5;o.push(v,1-E)}g(),d()}function d(){for(let M=0;M<o.length;M+=6){let A=o[M+0],v=o[M+2],E=o[M+4],S=Math.max(A,v,E),C=Math.min(A,v,E);S>.9&&C<.1&&(A<.2&&(o[M+0]+=1),v<.2&&(o[M+2]+=1),E<.2&&(o[M+4]+=1))}}function u(M){r.push(M.x,M.y,M.z)}function f(M,A){let v=M*3;A.x=e[v+0],A.y=e[v+1],A.z=e[v+2]}function g(){let M=new P,A=new P,v=new P,E=new P,S=new ue,C=new ue,_=new ue;for(let w=0,I=0;w<r.length;w+=9,I+=6){M.set(r[w+0],r[w+1],r[w+2]),A.set(r[w+3],r[w+4],r[w+5]),v.set(r[w+6],r[w+7],r[w+8]),S.set(o[I+0],o[I+1]),C.set(o[I+2],o[I+3]),_.set(o[I+4],o[I+5]),E.copy(M).add(A).add(v).divideScalar(3);let L=m(E);b(S,I+0,M,L),b(C,I+2,A,L),b(_,I+4,v,L)}}function b(M,A,v,E){E<0&&M.x===1&&(o[A]=M.x-1),v.x===0&&v.z===0&&(o[A]=E/2/Math.PI+.5)}function m(M){return Math.atan2(M.z,-M.x)}function p(M){return Math.atan2(-M.y,Math.sqrt(M.x*M.x+M.z*M.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var tn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Xe("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,s=this.getPoint(0),r=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),r+=i.distanceTo(s),t.push(r),s=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),s=0,r=i.length,o;t?o=t:o=e*i[r-1];let a=0,l=r-1,c;for(;a<=l;)if(s=Math.floor(a+(l-a)/2),c=i[s]-o,c<0)a=s+1;else if(c>0)l=s-1;else{l=s;break}if(s=l,i[s]===o)return s/(r-1);let h=i[s],u=i[s+1]-h,f=(o-h)/u;return(s+f)/(r-1)}getTangent(e,t){let s=e-1e-4,r=e+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),l=t||(o.isVector2?new ue:new P);return l.copy(a).sub(o).normalize(),l}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new P,s=[],r=[],o=[],a=new P,l=new vt;for(let f=0;f<=e;f++){let g=f/e;s[f]=this.getTangentAt(g,new P)}r[0]=new P,o[0]=new P;let c=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=c&&(c=h,i.set(1,0,0)),d<=c&&(c=d,i.set(0,1,0)),u<=c&&i.set(0,0,1),a.crossVectors(s[0],i).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let f=1;f<=e;f++){if(r[f]=r[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(s[f-1],s[f]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(et(s[f-1].dot(s[f]),-1,1));r[f].applyMatrix4(l.makeRotationAxis(a,g))}o[f].crossVectors(s[f],r[f])}if(t===!0){let f=Math.acos(et(r[0].dot(r[e]),-1,1));f/=e,s[0].dot(a.crossVectors(r[0],r[e]))>0&&(f=-f);for(let g=1;g<=e;g++)r[g].applyMatrix4(l.makeRotationAxis(s[g],f*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},ms=class extends tn{constructor(e=0,t=0,i=1,s=1,r=0,o=Math.PI*2,a=!1,l=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=l}getPoint(e,t=new ue){let i=t,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+e*r,l=this.aX+this.xRadius*Math.cos(a),c=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=l-this.aX,f=c-this.aY;l=u*h-f*d+this.aX,c=u*d+f*h+this.aY}return i.set(l,c)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Ao=class extends ms{constructor(e,t,i,s,r,o){super(e,t,i,i,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function _c(){let n=0,e=0,t=0,i=0;function s(r,o,a,l){n=r,e=a,t=-3*r+3*o-2*a-l,i=2*r-2*o+a+l}return{initCatmullRom:function(r,o,a,l,c){s(o,a,c*(a-r),c*(l-o))},initNonuniformCatmullRom:function(r,o,a,l,c,h,d){let u=(o-r)/c-(a-r)/(c+h)+(a-o)/h,f=(a-o)/h-(l-o)/(h+d)+(l-a)/d;u*=h,f*=h,s(o,a,u,f)},calc:function(r){let o=r*r,a=o*r;return n+e*r+t*o+i*a}}}var Ch=new P,Ih=new P,Dl=new _c,Ll=new _c,Nl=new _c,Ro=class extends tn{constructor(e=[],t=!1,i="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=s}getPoint(e,t=new P){let i=t,s=this.points,r=s.length,o=(r-(this.closed?0:1))*e,a=Math.floor(o),l=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:l===0&&a===r-1&&(a=r-2,l=1);let c,h;this.closed||a>0?c=s[(a-1)%r]:(Ih.subVectors(s[0],s[1]).add(s[0]),c=Ih);let d=s[a%r],u=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(Ch.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=Ch),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,g=Math.pow(c.distanceToSquared(d),f),b=Math.pow(d.distanceToSquared(u),f),m=Math.pow(u.distanceToSquared(h),f);b<1e-4&&(b=1),g<1e-4&&(g=b),m<1e-4&&(m=b),Dl.initNonuniformCatmullRom(c.x,d.x,u.x,h.x,g,b,m),Ll.initNonuniformCatmullRom(c.y,d.y,u.y,h.y,g,b,m),Nl.initNonuniformCatmullRom(c.z,d.z,u.z,h.z,g,b,m)}else this.curveType==="catmullrom"&&(Dl.initCatmullRom(c.x,d.x,u.x,h.x,this.tension),Ll.initCatmullRom(c.y,d.y,u.y,h.y,this.tension),Nl.initCatmullRom(c.z,d.z,u.z,h.z,this.tension));return i.set(Dl.calc(l),Ll.calc(l),Nl.calc(l)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new P().fromArray(s))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Ph(n,e,t,i,s){let r=(i-e)*.5,o=(s-t)*.5,a=n*n,l=n*a;return(2*t-2*i+r+o)*l+(-3*t+3*i-2*r-o)*a+r*n+t}function Uf(n,e){let t=1-n;return t*t*e}function Ff(n,e){return 2*(1-n)*n*e}function Of(n,e){return n*n*e}function Vs(n,e,t,i){return Uf(n,e)+Ff(n,t)+Of(n,i)}function Bf(n,e){let t=1-n;return t*t*t*e}function zf(n,e){let t=1-n;return 3*t*t*n*e}function kf(n,e){return 3*(1-n)*n*n*e}function Hf(n,e){return n*n*n*e}function Ws(n,e,t,i,s){return Bf(n,e)+zf(n,t)+kf(n,i)+Hf(n,s)}var rr=class extends tn{constructor(e=new ue,t=new ue,i=new ue,s=new ue){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new ue){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ws(e,s.x,r.x,o.x,a.x),Ws(e,s.y,r.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Co=class extends tn{constructor(e=new P,t=new P,i=new P,s=new P){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=s}getPoint(e,t=new P){let i=t,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return i.set(Ws(e,s.x,r.x,o.x,a.x),Ws(e,s.y,r.y,o.y,a.y),Ws(e,s.z,r.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},or=class extends tn{constructor(e=new ue,t=new ue){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new ue){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new ue){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Io=class extends tn{constructor(e=new P,t=new P){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new P){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new P){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ar=class extends tn{constructor(e=new ue,t=new ue,i=new ue){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new ue){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Vs(e,s.x,r.x,o.x),Vs(e,s.y,r.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Po=class extends tn{constructor(e=new P,t=new P,i=new P){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new P){let i=t,s=this.v0,r=this.v1,o=this.v2;return i.set(Vs(e,s.x,r.x,o.x),Vs(e,s.y,r.y,o.y),Vs(e,s.z,r.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},lr=class extends tn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new ue){let i=t,s=this.points,r=(s.length-1)*e,o=Math.floor(r),a=r-o,l=s[o===0?o:o-1],c=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return i.set(Ph(a,l.x,c.x,h.x,d.x),Ph(a,l.y,c.y,h.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let s=this.points[t];e.points.push(s.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let s=e.points[t];this.points.push(new ue().fromArray(s))}return this}},Hl=Object.freeze({__proto__:null,ArcCurve:Ao,CatmullRomCurve3:Ro,CubicBezierCurve:rr,CubicBezierCurve3:Co,EllipseCurve:ms,LineCurve:or,LineCurve3:Io,QuadraticBezierCurve:ar,QuadraticBezierCurve3:Po,SplineCurve:lr}),Do=class extends tn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Hl[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=i){let o=s[r]-i,a=this.curves[r],l=a.getLength(),c=l===0?0:1-o/l;return a.getPointAt(c,t)}r++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,s=this.curves.length;i<s;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,l=o.getPoints(a);for(let c=0;c<l.length;c++){let h=l[c];i&&i.equals(h)||(t.push(h),i=h)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(s.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let s=this.curves[t];e.curves.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let s=e.curves[t];this.curves.push(new Hl[s.type]().fromJSON(s))}return this}},cr=class extends Do{constructor(e){super(),this.type="Path",this.currentPoint=new ue,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new or(this.currentPoint.clone(),new ue(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,s){let r=new ar(this.currentPoint.clone(),new ue(e,t),new ue(i,s));return this.curves.push(r),this.currentPoint.set(i,s),this}bezierCurveTo(e,t,i,s,r,o){let a=new rr(this.currentPoint.clone(),new ue(e,t),new ue(i,s),new ue(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new lr(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,s,r,o){let a=this.currentPoint.x,l=this.currentPoint.y;return this.absarc(e+a,t+l,i,s,r,o),this}absarc(e,t,i,s,r,o){return this.absellipse(e,t,i,i,s,r,o),this}ellipse(e,t,i,s,r,o,a,l){let c=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(e+c,t+h,i,s,r,o,a,l),this}absellipse(e,t,i,s,r,o,a,l){let c=new ms(e,t,i,s,r,o,a,l);if(this.curves.length>0){let d=c.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(c);let h=c.getPoint(1);return this.currentPoint.copy(h),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},gs=class extends cr{constructor(e){super(e),this.uuid=Di(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,s=this.holes.length;i<s;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(s.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let s=this.holes[t];e.holes.push(s.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let s=e.holes[t];this.holes.push(new cr().fromJSON(s))}return this}};function Gf(n,e,t=2){let i=e&&e.length,s=i?e[0]*t:n.length,r=Tu(n,0,s,t,!0),o=[];if(!r||r.next===r.prev)return o;let a,l,c;if(i&&(r=Yf(n,e,r,t)),n.length>80*t){a=n[0],l=n[1];let h=a,d=l;for(let u=t;u<s;u+=t){let f=n[u],g=n[u+1];f<a&&(a=f),g<l&&(l=g),f>h&&(h=f),g>d&&(d=g)}c=Math.max(h-a,d-l),c=c!==0?32767/c:0}return hr(r,o,t,a,l,c,0),o}function Tu(n,e,t,i,s){let r;if(s===sp(n,e,t,i)>0)for(let o=e;o<t;o+=i)r=Dh(o/i|0,n[o],n[o+1],r);else for(let o=t-i;o>=e;o-=i)r=Dh(o/i|0,n[o],n[o+1],r);return r&&xs(r,r.next)&&(dr(r),r=r.next),r}function Ei(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(xs(t,t.next)||wt(t.prev,t,t.next)===0)){if(dr(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function hr(n,e,t,i,s,r,o){if(!n)return;!o&&r&&jf(n,i,s,r);let a=n;for(;n.prev!==n.next;){let l=n.prev,c=n.next;if(r?Wf(n,i,s,r):Vf(n)){e.push(l.i,n.i,c.i),dr(n),n=c.next,a=c.next;continue}if(n=c,n===a){o?o===1?(n=Xf(Ei(n),e),hr(n,e,t,i,s,r,2)):o===2&&qf(n,e,t,i,s,r):hr(Ei(n),e,t,i,s,r,1);break}}}function Vf(n){let e=n.prev,t=n,i=n.next;if(wt(e,t,i)>=0)return!1;let s=e.x,r=t.x,o=i.x,a=e.y,l=t.y,c=i.y,h=Math.min(s,r,o),d=Math.min(a,l,c),u=Math.max(s,r,o),f=Math.max(a,l,c),g=i.next;for(;g!==e;){if(g.x>=h&&g.x<=u&&g.y>=d&&g.y<=f&&ks(s,a,r,l,o,c,g.x,g.y)&&wt(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function Wf(n,e,t,i){let s=n.prev,r=n,o=n.next;if(wt(s,r,o)>=0)return!1;let a=s.x,l=r.x,c=o.x,h=s.y,d=r.y,u=o.y,f=Math.min(a,l,c),g=Math.min(h,d,u),b=Math.max(a,l,c),m=Math.max(h,d,u),p=Gl(f,g,e,t,i),M=Gl(b,m,e,t,i),A=n.prevZ,v=n.nextZ;for(;A&&A.z>=p&&v&&v.z<=M;){if(A.x>=f&&A.x<=b&&A.y>=g&&A.y<=m&&A!==s&&A!==o&&ks(a,h,l,d,c,u,A.x,A.y)&&wt(A.prev,A,A.next)>=0||(A=A.prevZ,v.x>=f&&v.x<=b&&v.y>=g&&v.y<=m&&v!==s&&v!==o&&ks(a,h,l,d,c,u,v.x,v.y)&&wt(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;A&&A.z>=p;){if(A.x>=f&&A.x<=b&&A.y>=g&&A.y<=m&&A!==s&&A!==o&&ks(a,h,l,d,c,u,A.x,A.y)&&wt(A.prev,A,A.next)>=0)return!1;A=A.prevZ}for(;v&&v.z<=M;){if(v.x>=f&&v.x<=b&&v.y>=g&&v.y<=m&&v!==s&&v!==o&&ks(a,h,l,d,c,u,v.x,v.y)&&wt(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function Xf(n,e){let t=n;do{let i=t.prev,s=t.next.next;!xs(i,s)&&Ru(i,t,t.next,s)&&ur(i,s)&&ur(s,i)&&(e.push(i.i,t.i,s.i),dr(t),dr(t.next),t=n=s),t=t.next}while(t!==n);return Ei(t)}function qf(n,e,t,i,s,r){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&tp(o,a)){let l=Cu(o,a);o=Ei(o,o.next),l=Ei(l,l.next),hr(o,e,t,i,s,r,0),hr(l,e,t,i,s,r,0);return}a=a.next}o=o.next}while(o!==n)}function Yf(n,e,t,i){let s=[];for(let r=0,o=e.length;r<o;r++){let a=e[r]*i,l=r<o-1?e[r+1]*i:n.length,c=Tu(n,a,l,i,!1);c===c.next&&(c.steiner=!0),s.push(ep(c))}s.sort(Zf);for(let r=0;r<s.length;r++)t=$f(s[r],t);return t}function Zf(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),s=(e.next.y-e.y)/(e.next.x-e.x);t=i-s}return t}function $f(n,e){let t=Kf(n,e);if(!t)return e;let i=Cu(t,n);return Ei(i,i.next),Ei(t,t.next)}function Kf(n,e){let t=e,i=n.x,s=n.y,r=-1/0,o;if(xs(n,t))return t;do{if(xs(n,t.next))return t.next;if(s<=t.y&&s>=t.next.y&&t.next.y!==t.y){let d=t.x+(s-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>r&&(r=d,o=t.x<t.next.x?t:t.next,d===i))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,l=o.x,c=o.y,h=1/0;t=o;do{if(i>=t.x&&t.x>=l&&i!==t.x&&Au(s<c?i:r,s,l,c,s<c?r:i,s,t.x,t.y)){let d=Math.abs(s-t.y)/(i-t.x);ur(t,n)&&(d<h||d===h&&(t.x>o.x||t.x===o.x&&Jf(o,t)))&&(o=t,h=d)}t=t.next}while(t!==a);return o}function Jf(n,e){return wt(n.prev,n,e.prev)<0&&wt(e.next,n,n.next)<0}function jf(n,e,t,i){let s=n;do s.z===0&&(s.z=Gl(s.x,s.y,e,t,i)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==n);s.prevZ.nextZ=null,s.prevZ=null,Qf(s)}function Qf(n){let e,t=1;do{let i=n,s;n=null;let r=null;for(e=0;i;){e++;let o=i,a=0;for(let c=0;c<t&&(a++,o=o.nextZ,!!o);c++);let l=t;for(;a>0||l>0&&o;)a!==0&&(l===0||!o||i.z<=o.z)?(s=i,i=i.nextZ,a--):(s=o,o=o.nextZ,l--),r?r.nextZ=s:n=s,s.prevZ=r,r=s;i=o}r.nextZ=null,t*=2}while(e>1);return n}function Gl(n,e,t,i,s){return n=(n-t)*s|0,e=(e-i)*s|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function ep(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function Au(n,e,t,i,s,r,o,a){return(s-o)*(e-a)>=(n-o)*(r-a)&&(n-o)*(i-a)>=(t-o)*(e-a)&&(t-o)*(r-a)>=(s-o)*(i-a)}function ks(n,e,t,i,s,r,o,a){return!(n===o&&e===a)&&Au(n,e,t,i,s,r,o,a)}function tp(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!np(n,e)&&(ur(n,e)&&ur(e,n)&&ip(n,e)&&(wt(n.prev,n,e.prev)||wt(n,e.prev,e))||xs(n,e)&&wt(n.prev,n,n.next)>0&&wt(e.prev,e,e.next)>0)}function wt(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function xs(n,e){return n.x===e.x&&n.y===e.y}function Ru(n,e,t,i){let s=oo(wt(n,e,t)),r=oo(wt(n,e,i)),o=oo(wt(t,i,n)),a=oo(wt(t,i,e));return!!(s!==r&&o!==a||s===0&&ro(n,t,e)||r===0&&ro(n,i,e)||o===0&&ro(t,n,i)||a===0&&ro(t,e,i))}function ro(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function oo(n){return n>0?1:n<0?-1:0}function np(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&Ru(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ur(n,e){return wt(n.prev,n,n.next)<0?wt(n,e,n.next)>=0&&wt(n,n.prev,e)>=0:wt(n,e,n.prev)<0||wt(n,n.next,e)<0}function ip(n,e){let t=n,i=!1,s=(n.x+e.x)/2,r=(n.y+e.y)/2;do t.y>r!=t.next.y>r&&t.next.y!==t.y&&s<(t.next.x-t.x)*(r-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Cu(n,e){let t=Vl(n.i,n.x,n.y),i=Vl(e.i,e.x,e.y),s=n.next,r=e.prev;return n.next=e,e.prev=n,t.next=s,s.prev=t,i.next=t,t.prev=i,r.next=i,i.prev=r,i}function Dh(n,e,t,i){let s=Vl(n,e,t);return i?(s.next=i.next,s.prev=i,i.next.prev=s,i.next=s):(s.prev=s,s.next=s),s}function dr(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Vl(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function sp(n,e,t,i){let s=0;for(let r=e,o=t-i;r<t;r+=i)s+=(n[o]-n[r])*(n[r+1]+n[o+1]),o=r;return s}var Wl=class{static triangulate(e,t,i=2){return Gf(e,t,i)}},Mi=class n{static area(e){let t=e.length,i=0;for(let s=t-1,r=0;r<t;s=r++)i+=e[s].x*e[r].y-e[r].x*e[s].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],s=[],r=[];Lh(e),Nh(i,e);let o=e.length;t.forEach(Lh);for(let l=0;l<t.length;l++)s.push(o),o+=t[l].length,Nh(i,t[l]);let a=Wl.triangulate(i,s);for(let l=0;l<a.length;l+=3)r.push(a.slice(l,l+3));return r}};function Lh(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Nh(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var fr=class n extends Ct{constructor(e=new gs([new ue(.5,.5),new ue(-.5,.5),new ue(-.5,-.5),new ue(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,s=[],r=[];for(let a=0,l=e.length;a<l;a++){let c=e[a];o(c)}this.setAttribute("position",new at(s,3)),this.setAttribute("uv",new at(r,2)),this.computeVertexNormals();function o(a){let l=[],c=t.curveSegments!==void 0?t.curveSegments:12,h=t.steps!==void 0?t.steps:1,d=t.depth!==void 0?t.depth:1,u=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,g=t.bevelSize!==void 0?t.bevelSize:f-.1,b=t.bevelOffset!==void 0?t.bevelOffset:0,m=t.bevelSegments!==void 0?t.bevelSegments:3,p=t.extrudePath,M=t.UVGenerator!==void 0?t.UVGenerator:rp,A,v=!1,E,S,C,_;if(p){A=p.getSpacedPoints(h),v=!0,u=!1;let ie=p.isCatmullRomCurve3?p.closed:!1;E=p.computeFrenetFrames(h,ie),S=new P,C=new P,_=new P}u||(m=0,f=0,g=0,b=0);let w=a.extractPoints(c),I=w.shape,L=w.holes;if(!Mi.isClockWise(I)){I=I.reverse();for(let ie=0,le=L.length;ie<le;ie++){let ce=L[ie];Mi.isClockWise(ce)&&(L[ie]=ce.reverse())}}function G(ie){let ce=10000000000000001e-36,W=ie[0];for(let j=1;j<=ie.length;j++){let Ae=j%ie.length,Ce=ie[Ae],ke=Ce.x-W.x,Ve=Ce.y-W.y,D=ke*ke+Ve*Ve,lt=Math.max(Math.abs(Ce.x),Math.abs(Ce.y),Math.abs(W.x),Math.abs(W.y)),$e=ce*lt*lt;if(D<=$e){ie.splice(Ae,1),j--;continue}W=Ce}}G(I),L.forEach(G);let N=L.length,z=I;for(let ie=0;ie<N;ie++){let le=L[ie];I=I.concat(le)}function X(ie,le,ce){return le||qe("ExtrudeGeometry: vec does not exist"),ie.clone().addScaledVector(le,ce)}let Y=I.length;function re(ie,le,ce){let W,j,Ae,Ce=ie.x-le.x,ke=ie.y-le.y,Ve=ce.x-ie.x,D=ce.y-ie.y,lt=Ce*Ce+ke*ke,$e=Ce*D-ke*Ve;if(Math.abs($e)>Number.EPSILON){let T=Math.sqrt(lt),x=Math.sqrt(Ve*Ve+D*D),O=le.x-ke/T,V=le.y+Ce/T,$=ce.x-D/x,de=ce.y+Ve/x,fe=(($-O)*D-(de-V)*Ve)/(Ce*D-ke*Ve);W=O+Ce*fe-ie.x,j=V+ke*fe-ie.y;let J=W*W+j*j;if(J<=2)return new ue(W,j);Ae=Math.sqrt(J/2)}else{let T=!1;Ce>Number.EPSILON?Ve>Number.EPSILON&&(T=!0):Ce<-Number.EPSILON?Ve<-Number.EPSILON&&(T=!0):Math.sign(ke)===Math.sign(D)&&(T=!0),T?(W=-ke,j=Ce,Ae=Math.sqrt(lt)):(W=Ce,j=ke,Ae=Math.sqrt(lt/2))}return new ue(W/Ae,j/Ae)}let Z=[];for(let ie=0,le=z.length,ce=le-1,W=ie+1;ie<le;ie++,ce++,W++)ce===le&&(ce=0),W===le&&(W=0),Z[ie]=re(z[ie],z[ce],z[W]);let ee=[],ne,De=Z.concat();for(let ie=0,le=N;ie<le;ie++){let ce=L[ie];ne=[];for(let W=0,j=ce.length,Ae=j-1,Ce=W+1;W<j;W++,Ae++,Ce++)Ae===j&&(Ae=0),Ce===j&&(Ce=0),ne[W]=re(ce[W],ce[Ae],ce[Ce]);ee.push(ne),De=De.concat(ne)}let Te;if(m===0)Te=Mi.triangulateShape(z,L);else{let ie=[],le=[];for(let ce=0;ce<m;ce++){let W=ce/m,j=f*Math.cos(W*Math.PI/2),Ae=g*Math.sin(W*Math.PI/2)+b;for(let Ce=0,ke=z.length;Ce<ke;Ce++){let Ve=X(z[Ce],Z[Ce],Ae);_e(Ve.x,Ve.y,-j),W===0&&ie.push(Ve)}for(let Ce=0,ke=N;Ce<ke;Ce++){let Ve=L[Ce];ne=ee[Ce];let D=[];for(let lt=0,$e=Ve.length;lt<$e;lt++){let T=X(Ve[lt],ne[lt],Ae);_e(T.x,T.y,-j),W===0&&D.push(T)}W===0&&le.push(D)}}Te=Mi.triangulateShape(ie,le)}let tt=Te.length,Je=g+b;for(let ie=0;ie<Y;ie++){let le=u?X(I[ie],De[ie],Je):I[ie];v?(C.copy(E.normals[0]).multiplyScalar(le.x),S.copy(E.binormals[0]).multiplyScalar(le.y),_.copy(A[0]).add(C).add(S),_e(_.x,_.y,_.z)):_e(le.x,le.y,0)}for(let ie=1;ie<=h;ie++)for(let le=0;le<Y;le++){let ce=u?X(I[le],De[le],Je):I[le];v?(C.copy(E.normals[ie]).multiplyScalar(ce.x),S.copy(E.binormals[ie]).multiplyScalar(ce.y),_.copy(A[ie]).add(C).add(S),_e(_.x,_.y,_.z)):_e(ce.x,ce.y,d/h*ie)}for(let ie=m-1;ie>=0;ie--){let le=ie/m,ce=f*Math.cos(le*Math.PI/2),W=g*Math.sin(le*Math.PI/2)+b;for(let j=0,Ae=z.length;j<Ae;j++){let Ce=X(z[j],Z[j],W);_e(Ce.x,Ce.y,d+ce)}for(let j=0,Ae=L.length;j<Ae;j++){let Ce=L[j];ne=ee[j];for(let ke=0,Ve=Ce.length;ke<Ve;ke++){let D=X(Ce[ke],ne[ke],W);v?_e(D.x,D.y+A[h-1].y,A[h-1].x+ce):_e(D.x,D.y,d+ce)}}}st(),K();function st(){let ie=s.length/3;if(u){let le=0,ce=Y*le;for(let W=0;W<tt;W++){let j=Te[W];Ge(j[2]+ce,j[1]+ce,j[0]+ce)}le=h+m*2,ce=Y*le;for(let W=0;W<tt;W++){let j=Te[W];Ge(j[0]+ce,j[1]+ce,j[2]+ce)}}else{for(let le=0;le<tt;le++){let ce=Te[le];Ge(ce[2],ce[1],ce[0])}for(let le=0;le<tt;le++){let ce=Te[le];Ge(ce[0]+Y*h,ce[1]+Y*h,ce[2]+Y*h)}}i.addGroup(ie,s.length/3-ie,0)}function K(){let ie=s.length/3,le=0;te(z,le),le+=z.length;for(let ce=0,W=L.length;ce<W;ce++){let j=L[ce];te(j,le),le+=j.length}i.addGroup(ie,s.length/3-ie,1)}function te(ie,le){let ce=ie.length;for(;--ce>=0;){let W=ce,j=ce-1;j<0&&(j=ie.length-1);for(let Ae=0,Ce=h+m*2;Ae<Ce;Ae++){let ke=Y*Ae,Ve=Y*(Ae+1),D=le+W+ke,lt=le+j+ke,$e=le+j+Ve,T=le+W+Ve;Se(D,lt,$e,T)}}}function _e(ie,le,ce){l.push(ie),l.push(le),l.push(ce)}function Ge(ie,le,ce){He(ie),He(le),He(ce);let W=s.length/3,j=M.generateTopUV(i,s,W-3,W-2,W-1);rt(j[0]),rt(j[1]),rt(j[2])}function Se(ie,le,ce,W){He(ie),He(le),He(W),He(le),He(ce),He(W);let j=s.length/3,Ae=M.generateSideWallUV(i,s,j-6,j-3,j-2,j-1);rt(Ae[0]),rt(Ae[1]),rt(Ae[3]),rt(Ae[1]),rt(Ae[2]),rt(Ae[3])}function He(ie){s.push(l[ie*3+0]),s.push(l[ie*3+1]),s.push(l[ie*3+2])}function rt(ie){r.push(ie.x),r.push(ie.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return op(t,i,e)}static fromJSON(e,t){let i=[];for(let r=0,o=e.shapes.length;r<o;r++){let a=t[e.shapes[r]];i.push(a)}let s=e.options.extrudePath;return s!==void 0&&(e.options.extrudePath=new Hl[s.type]().fromJSON(s)),new n(i,e.options)}},rp={generateTopUV:function(n,e,t,i,s){let r=e[t*3],o=e[t*3+1],a=e[i*3],l=e[i*3+1],c=e[s*3],h=e[s*3+1];return[new ue(r,o),new ue(a,l),new ue(c,h)]},generateSideWallUV:function(n,e,t,i,s,r){let o=e[t*3],a=e[t*3+1],l=e[t*3+2],c=e[i*3],h=e[i*3+1],d=e[i*3+2],u=e[s*3],f=e[s*3+1],g=e[s*3+2],b=e[r*3],m=e[r*3+1],p=e[r*3+2];return Math.abs(a-h)<Math.abs(o-c)?[new ue(o,1-l),new ue(c,1-d),new ue(u,1-g),new ue(b,1-p)]:[new ue(a,1-l),new ue(h,1-d),new ue(f,1-g),new ue(m,1-p)]}};function op(n,e,t){if(t.shapes=[],Array.isArray(n))for(let i=0,s=n.length;i<s;i++){let r=n[i];t.shapes.push(r.uuid)}else t.shapes.push(n.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var wi=class n extends sr{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,s=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],r=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(s,r,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var ii=class n extends sr{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],s=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,s,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Ti=class n extends Ct{constructor(e=1,t=1,i=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(i),l=Math.floor(s),c=a+1,h=l+1,d=e/a,u=t/l,f=[],g=[],b=[],m=[];for(let p=0;p<h;p++){let M=p*u-o;for(let A=0;A<c;A++){let v=A*d-r;g.push(v,-M,0),b.push(0,0,1),m.push(A/a),m.push(1-p/l)}}for(let p=0;p<l;p++)for(let M=0;M<a;M++){let A=M+c*p,v=M+c*(p+1),E=M+1+c*(p+1),S=M+1+c*p;f.push(A,v,S),f.push(v,E,S)}this.setIndex(f),this.setAttribute("position",new at(g,3)),this.setAttribute("normal",new at(b,3)),this.setAttribute("uv",new at(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},pr=class n extends Ct{constructor(e=.5,t=1,i=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:s,thetaStart:r,thetaLength:o},i=Math.max(3,i),s=Math.max(1,s);let a=[],l=[],c=[],h=[],d=e,u=(t-e)/s,f=new P,g=new ue;for(let b=0;b<=s;b++){for(let m=0;m<=i;m++){let p=r+m/i*o;f.x=d*Math.cos(p),f.y=d*Math.sin(p),l.push(f.x,f.y,f.z),c.push(0,0,1),g.x=(f.x/t+1)/2,g.y=(f.y/t+1)/2,h.push(g.x,g.y)}d+=u}for(let b=0;b<s;b++){let m=b*(i+1);for(let p=0;p<i;p++){let M=p+m,A=M,v=M+i+1,E=M+i+2,S=M+1;a.push(A,v,S),a.push(v,E,S)}}this.setIndex(a),this.setAttribute("position",new at(l,3)),this.setAttribute("normal",new at(c,3)),this.setAttribute("uv",new at(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var mr=class n extends Ct{constructor(e=1,t=32,i=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let l=Math.min(o+a,Math.PI),c=0,h=[],d=new P,u=new P,f=[],g=[],b=[],m=[];for(let p=0;p<=i;p++){let M=[],A=p/i,v=o+A*a,E=e*Math.cos(v),S=Math.sqrt(e*e-E*E),C=0;p===0&&o===0?C=.5/t:p===i&&l===Math.PI&&(C=-.5/t);for(let _=0;_<=t;_++){let w=_/t,I=s+w*r;d.x=-S*Math.cos(I),d.y=E,d.z=S*Math.sin(I),g.push(d.x,d.y,d.z),u.copy(d).normalize(),b.push(u.x,u.y,u.z),m.push(w+C,1-A),M.push(c++)}h.push(M)}for(let p=0;p<i;p++)for(let M=0;M<t;M++){let A=h[p][M+1],v=h[p][M],E=h[p+1][M],S=h[p+1][M+1];(p!==0||o>0)&&f.push(A,v,S),(p!==i-1||l<Math.PI)&&f.push(v,E,S)}this.setIndex(f),this.setAttribute("position",new at(g,3)),this.setAttribute("normal",new at(b,3)),this.setAttribute("uv",new at(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ai=class n extends Ct{constructor(e=1,t=.4,i=12,s=48,r=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:s,arc:r,thetaStart:o,thetaLength:a},i=Math.floor(i),s=Math.floor(s);let l=[],c=[],h=[],d=[],u=new P,f=new P,g=new P;for(let b=0;b<=i;b++){let m=o+b/i*a;for(let p=0;p<=s;p++){let M=p/s*r;f.x=(e+t*Math.cos(m))*Math.cos(M),f.y=(e+t*Math.cos(m))*Math.sin(M),f.z=t*Math.sin(m),c.push(f.x,f.y,f.z),u.x=e*Math.cos(M),u.y=e*Math.sin(M),g.subVectors(f,u).normalize(),h.push(g.x,g.y,g.z),d.push(p/s),d.push(b/i)}}for(let b=1;b<=i;b++)for(let m=1;m<=s;m++){let p=(s+1)*b+m-1,M=(s+1)*(b-1)+m-1,A=(s+1)*(b-1)+m,v=(s+1)*b+m;l.push(p,M,v),l.push(M,A,v)}this.setIndex(l),this.setAttribute("position",new at(c,3)),this.setAttribute("normal",new at(h,3)),this.setAttribute("uv",new at(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function Li(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let s=n[t][i];if(Uh(s))s.isRenderTargetTexture?(Xe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=s.clone();else if(Array.isArray(s))if(Uh(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();e[t][i]=r}else e[t][i]=s.slice();else e[t][i]=s}}return e}function Wt(n){let e={};for(let t=0;t<n.length;t++){let i=Li(n[t]);for(let s in i)e[s]=i[s]}return e}function Uh(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function ap(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function vc(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:it.workingColorSpace}var Iu={clone:Li,merge:Wt},lp=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,cp=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Vt=class extends jn{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=lp,this.fragmentShader=cp,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Li(e.uniforms),this.uniformsGroups=ap(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let s in this.extensions)this.extensions[s]===!0&&(i[s]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let s=e.uniforms[i];switch(this.uniforms[i]={},s.type){case"t":this.uniforms[i].value=t[s.value]||null;break;case"c":this.uniforms[i].value=new Le().setHex(s.value);break;case"v2":this.uniforms[i].value=new ue().fromArray(s.value);break;case"v3":this.uniforms[i].value=new P().fromArray(s.value);break;case"v4":this.uniforms[i].value=new St().fromArray(s.value);break;case"m3":this.uniforms[i].value=new Ze().fromArray(s.value);break;case"m4":this.uniforms[i].value=new vt().fromArray(s.value);break;default:this.uniforms[i].value=s.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Lo=class extends Vt{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var si=class extends jn{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Le(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Le(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Na,this.normalScale=new ue(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var No=class extends jn{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=uu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Uo=class extends jn{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function ts(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Ul(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var ri=class{constructor(e,t,i,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,s=t[i],r=t[i-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=i+2;;){if(s===void 0){if(e<r)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(r=s,s=t[++i],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(i=2,r=a);for(let l=i-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===l)break;if(s=r,r=t[--i-1],e>=r)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(s=t[i],r=t[i-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,r,s)}return this.interpolate_(i,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=i[r+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Fo=class extends ri{constructor(e,t,i,s){super(e,t,i,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Bl,endingEnd:Bl}}intervalChanged_(e,t,i){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],l=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case zl:r=e,a=2*t-i;break;case kl:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=i}if(l===void 0)switch(this.getSettings_().endingEnd){case zl:o=e,l=2*i-t;break;case kl:o=1,l=i+s[1]-s[0];break;default:o=e-1,l=t}let c=(i-t)*.5,h=this.valueSize;this._weightPrev=c/(t-a),this._weightNext=c/(l-i),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,f=this._weightNext,g=(i-t)/(s-t),b=g*g,m=b*g,p=-u*m+2*u*b-u*g,M=(1+u)*m+(-1.5-2*u)*b+(-.5+u)*g+1,A=(-1-f)*m+(1.5+f)*b+.5*g,v=f*m-f*b;for(let E=0;E!==a;++E)r[E]=p*o[h+E]+M*o[c+E]+A*o[l+E]+v*o[d+E];return r}},Oo=class extends ri{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=(i-t)/(s-t),d=1-h;for(let u=0;u!==a;++u)r[u]=o[c+u]*d+o[l+u]*h;return r}},Bo=class extends ri{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e){return this.copySampleValue_(e-1)}},zo=class extends ri{interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=e*a,c=l-a,h=this.inTangents,d=this.outTangents;if(!h||!d){let g=(i-t)/(s-t),b=1-g;for(let m=0;m!==a;++m)r[m]=o[c+m]*b+o[l+m]*g;return r}let u=a*2,f=e-1;for(let g=0;g!==a;++g){let b=o[c+g],m=o[l+g],p=f*u+g*2,M=d[p],A=d[p+1],v=e*u+g*2,E=h[v],S=h[v+1],C=up(i,t,M,E,s);r[g]=Pu(C,b,A,S,m)}return r}};function Pu(n,e,t,i,s){let r=1-n;return r*r*r*e+3*r*r*n*t+3*r*n*n*i+n*n*n*s}function hp(n,e,t,i,s){let r=1-n;return 3*r*r*(t-e)+6*r*n*(i-t)+3*n*n*(s-i)}function up(n,e,t,i,s){let r=(n-e)/(s-e);for(let o=0;o<8;o++){let a=Pu(r,e,t,i,s)-n;if(Math.abs(a)<1e-10)break;let l=hp(r,e,t,i,s);if(Math.abs(l)<1e-10)break;r=Math.max(0,Math.min(1,r-a/l))}return r}var nn=class{constructor(e,t,i,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=ts(t,this.TimeBufferType),this.values=ts(i,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:ts(e.times,Array),values:ts(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(i.interpolation=s),Ul(e.settings)&&(i.settings={inTangents:ts(e.settings.inTangents,Array),outTangents:ts(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Bo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Oo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Fo(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new zo(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case Xs:t=this.InterpolantFactoryMethodDiscrete;break;case bo:t=this.InterpolantFactoryMethodLinear;break;case co:t=this.InterpolantFactoryMethodSmooth;break;case Ol:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Xe("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Xs;case this.InterpolantFactoryMethodLinear:return bo;case this.InterpolantFactoryMethodSmooth:return co;case this.InterpolantFactoryMethodBezier:return Ol}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,s=t.length;i!==s;++i)t[i]*=e;Ul(this.settings)&&(Fh(this.settings.inTangents,e),Fh(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,s=i.length,r=0,o=s-1;for(;r!==s&&i[r]<e;)++r;for(;o!==-1&&i[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=i.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(qe("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,s=this.values,r=i.length;r===0&&(qe("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let l=i[a];if(typeof l=="number"&&isNaN(l)){qe("KeyframeTrack: Time is not a valid number.",this,a,l),e=!1;break}if(o!==null&&o>l){qe("KeyframeTrack: Out of order keys.",this,a,l,o),e=!1;break}o=l}if(s!==void 0&&Qd(s))for(let a=0,l=s.length;a!==l;++a){let c=s[a];if(isNaN(c)){qe("KeyframeTrack: Value is not a valid number.",this,a,c),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),s=this.getInterpolation()===co,r=e.length-1,o=1;for(let a=1;a<r;++a){let l=!1,c=e[a],h=e[a+1];if(c!==h&&(a!==1||c!==e[0]))if(s)l=!0;else{let d=a*i,u=d-i,f=d+i;for(let g=0;g!==i;++g){let b=t[d+g];if(b!==t[u+g]||b!==t[f+g]){l=!0;break}}}if(l){if(a!==o){e[o]=e[a];let d=a*i,u=o*i;for(let f=0;f!==i;++f)t[u+f]=t[d+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*i,l=o*i,c=0;c!==i;++c)t[l+c]=t[a+c];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,s=new i(this.name,e,t);return s.createInterpolant=this.createInterpolant,Ul(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Fh(n,e){for(let t=0,i=n.length;t!==i;t+=2)n[t]*=e}nn.prototype.ValueTypeName="";nn.prototype.TimeBufferType=Float32Array;nn.prototype.ValueBufferType=Float32Array;nn.prototype.DefaultInterpolation=bo;var oi=class extends nn{constructor(e,t,i){super(e,t,i)}};oi.prototype.ValueTypeName="bool";oi.prototype.ValueBufferType=Array;oi.prototype.DefaultInterpolation=Xs;oi.prototype.InterpolantFactoryMethodLinear=void 0;oi.prototype.InterpolantFactoryMethodSmooth=void 0;var ko=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};ko.prototype.ValueTypeName="color";var Ho=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};Ho.prototype.ValueTypeName="number";var Go=class extends ri{constructor(e,t,i,s){super(e,t,i,s)}interpolate_(e,t,i,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,l=(i-t)/(s-t),c=e*a;for(let h=c+a;c!==h;c+=4)Zt.slerpFlat(r,0,o,c-a,o,c,l);return r}},gr=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}InterpolantFactoryMethodLinear(e){return new Go(this.times,this.values,this.getValueSize(),e)}};gr.prototype.ValueTypeName="quaternion";gr.prototype.InterpolantFactoryMethodSmooth=void 0;var ai=class extends nn{constructor(e,t,i){super(e,t,i)}};ai.prototype.ValueTypeName="string";ai.prototype.ValueBufferType=Array;ai.prototype.DefaultInterpolation=Xs;ai.prototype.InterpolantFactoryMethodLinear=void 0;ai.prototype.InterpolantFactoryMethodSmooth=void 0;var Vo=class extends nn{constructor(e,t,i,s){super(e,t,i,s)}};Vo.prototype.ValueTypeName="vector";var Wo=class{constructor(e,t,i){let s=this,r=!1,o=0,a=0,l,c=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,d){return c.push(h,d),this},this.removeHandler=function(h){let d=c.indexOf(h);return d!==-1&&c.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=c.length;d<u;d+=2){let f=c[d],g=c[d+1];if(f.global&&(f.lastIndex=0),f.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Du=new Wo,Xo=class{constructor(e){this.manager=e!==void 0?e:Du,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(s,r){i.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Xo.DEFAULT_MATERIAL_NAME="__DEFAULT";var xr=class extends Gt{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Le(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Ri=class extends xr{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Le(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Fl=new vt,Oh=new P,Bh=new P,qo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ue(512,512),this.mapType=jt,this.map=null,this.mapPass=null,this.matrix=new vt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new ps,this._frameExtents=new ue(1,1),this._viewportCount=1,this._viewports=[new St(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;Oh.setFromMatrixPosition(e.matrixWorld),t.position.copy(Oh),Bh.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Bh),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,s){Fl.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Fl,e.coordinateSystem,e.reversedDepth);let r=this._frameExtents,o=s?s.z/r.x:1,a=s?s.w/r.y:1,l=s?s.x/r.x:0,c=s?s.y/r.y:0;e.coordinateSystem===as||e.reversedDepth?t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+l,0,.5*a,0,.5*a+c,0,0,.5,.5,0,0,0,1),t.multiply(Fl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},ao=new P,lo=new Zt,wn=new P,_r=class extends Gt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new vt,this.projectionMatrix=new vt,this.projectionMatrixInverse=new vt,this.coordinateSystem=xn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(ao,lo,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ao,lo,wn.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(ao,lo,wn),wn.x===1&&wn.y===1&&wn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(ao,lo,wn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Kn=new P,zh=new ue,kh=new ue,Nt=class extends _r{constructor(e=50,t=1,i=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=cs*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Hs*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return cs*2*Math.atan(Math.tan(Hs*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Kn.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z),Kn.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Kn.x,Kn.y).multiplyScalar(-e/Kn.z)}getViewSize(e,t){return this.getViewBounds(e,zh,kh),t.subVectors(kh,zh)}setViewOffset(e,t,i,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Hs*.5*this.fov)/this.zoom,i=2*t,s=this.aspect*i,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let l=o.fullWidth,c=o.fullHeight;r+=o.offsetX*s/l,t-=o.offsetY*i/c,s*=o.width/l,i*=o.height/c}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var _s=class extends _r{constructor(e=-1,t=1,i=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=i-e,o=i+e,a=s+t,l=s-t;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,o=r+c*this.view.width,a-=h*this.view.offsetY,l=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,l,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Xl=class extends qo{constructor(){super(new _s(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Ci=class extends xr{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Gt.DEFAULT_UP),this.updateMatrix(),this.target=new Gt,this.shadow=new Xl}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var ns=-90,is=1,Yo=class extends Gt{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Nt(ns,is,e,t);s.layers=this.layers,this.add(s);let r=new Nt(ns,is,e,t);r.layers=this.layers,this.add(r);let o=new Nt(ns,is,e,t);o.layers=this.layers,this.add(o);let a=new Nt(ns,is,e,t);a.layers=this.layers,this.add(a);let l=new Nt(ns,is,e,t);l.layers=this.layers,this.add(l);let c=new Nt(ns,is,e,t);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,s,r,o,a,l]=t;for(let c of t)this.remove(c);if(e===xn)i.up.set(0,1,0),i.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(e===as)i.up.set(0,-1,0),i.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let c of t)this.add(c),c.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,l,c,h]=this.children,d=e.getRenderTarget(),u=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),g=e.xr.enabled;e.xr.enabled=!1;let b=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(i,0,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,r),e.setRenderTarget(i,1,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),e.setRenderTarget(i,4,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),i.texture.generateMipmaps=b,e.setRenderTarget(i,5,s),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,h),e.setRenderTarget(d,u,f),e.xr.enabled=g,i.texture.needsPMREMUpdate=!0}},Zo=class extends Nt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var yc="\\[\\]\\.:\\/",dp=new RegExp("["+yc+"]","g"),bc="[^"+yc+"]",fp="[^"+yc.replace("\\.","")+"]",pp=/((?:WC+[\/:])*)/.source.replace("WC",bc),mp=/(WCOD+)?/.source.replace("WCOD",fp),gp=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",bc),xp=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",bc),_p=new RegExp("^"+pp+mp+gp+xp+"$"),vp=["material","materials","bones","map"],ql=class{constructor(e,t,i){let s=i||bt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,s=this._bindings[i];s!==void 0&&s.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=i.length;s!==r;++s)i[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},bt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(dp,"")}static parseTrackName(e){let t=_p.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=i.nodeName&&i.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=i.nodeName.substring(s+1);vp.indexOf(r)!==-1&&(i.nodeName=i.nodeName.substring(0,s),i.objectName=r)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let l=i(a.children);if(l)return l}return null},s=i(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)e[t++]=i[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let s=0,r=i.length;s!==r;++s)i[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Xe("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let c=t.objectIndex;switch(i){case"materials":if(!e.material){qe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){qe("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){qe("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===c){c=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){qe("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){qe("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){qe("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(c!==void 0){if(e[c]===void 0){qe("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[c]}}let o=e[s];if(o===void 0){let c=t.nodeName;qe("PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){qe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){qe("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(l=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};bt.Composite=ql;bt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};bt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};bt.prototype.GetterByBindingType=[bt.prototype._getValue_direct,bt.prototype._getValue_array,bt.prototype._getValue_arrayElement,bt.prototype._getValue_toArray];bt.prototype.SetterByBindingTypeAndVersioning=[[bt.prototype._setValue_direct,bt.prototype._setValue_direct_setNeedsUpdate,bt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[bt.prototype._setValue_array,bt.prototype._setValue_array_setNeedsUpdate,bt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[bt.prototype._setValue_arrayElement,bt.prototype._setValue_arrayElement_setNeedsUpdate,bt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[bt.prototype._setValue_fromArray,bt.prototype._setValue_fromArray_setNeedsUpdate,bt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var xM=new Float32Array(1);var Yl=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,s){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,s)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,s){let r=this.elements;return r[0]=e,r[2]=t,r[1]=i,r[3]=s,this}};function Mc(n,e,t,i){let s=yp(i);switch(t){case fc:return n*e;case Mr:return n*e/s.components*s.byteLength;case ta:return n*e/s.components*s.byteLength;case di:return n*e*2/s.components*s.byteLength;case na:return n*e*2/s.components*s.byteLength;case pc:return n*e*3/s.components*s.byteLength;case hn:return n*e*4/s.components*s.byteLength;case ia:return n*e*4/s.components*s.byteLength;case Sr:case Er:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case wr:case Tr:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ra:case aa:return Math.max(n,16)*Math.max(e,8)/4;case sa:case oa:return Math.max(n,8)*Math.max(e,8)/2;case la:case ca:case ua:case da:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case ha:case Ar:case fa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case pa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case ma:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case ga:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case xa:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case _a:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case va:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case ya:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case ba:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Ma:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case Sa:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Ea:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case wa:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Ta:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case Aa:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Ra:case Ca:case Ia:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Pa:case Da:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Rr:case La:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function yp(n){switch(n){case jt:case cc:return{byteLength:1,components:1};case bs:case hc:case bn:return{byteLength:2,components:1};case Qo:case ea:return{byteLength:2,components:4};case vn:case jo:case yn:return{byteLength:4,components:1};case uc:case dc:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Xe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function ed(){let n=null,e=!1,t=null,i=null;function s(r,o){i=n.requestAnimationFrame(s),t(r,o)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(s),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){n=r}}}function Rp(n){let e=new WeakMap;function t(a,l){let c=a.array,h=a.usage,d=c.byteLength,u=n.createBuffer();n.bindBuffer(l,u),n.bufferData(l,c,h),a.onUploadCallback();let f;if(c instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&c instanceof Float16Array)f=n.HALF_FLOAT;else if(c instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(c instanceof Int16Array)f=n.SHORT;else if(c instanceof Uint32Array)f=n.UNSIGNED_INT;else if(c instanceof Int32Array)f=n.INT;else if(c instanceof Int8Array)f=n.BYTE;else if(c instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(c instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+c);return{buffer:u,type:f,bytesPerElement:c.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,l,c){let h=l.array,d=l.updateRanges;if(n.bindBuffer(c,a),d.length===0)n.bufferSubData(c,0,h);else{d.sort((f,g)=>f.start-g.start);let u=0;for(let f=1;f<d.length;f++){let g=d[u],b=d[f];b.start<=g.start+g.count+1?g.count=Math.max(g.count,b.start+b.count-g.start):(++u,d[u]=b)}d.length=u+1;for(let f=0,g=d.length;f<g;f++){let b=d[f];n.bufferSubData(c,b.start*h.BYTES_PER_ELEMENT,h,b.start,b.count)}l.clearUpdateRanges()}l.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let l=e.get(a);l&&(n.deleteBuffer(l.buffer),e.delete(a))}function o(a,l){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let c=e.get(a);if(c===void 0)e.set(a,t(a,l));else if(c.version<a.version){if(c.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(c.buffer,a,l),c.version=a.version}}return{get:s,remove:r,update:o}}var Cp=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ip=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Pp=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Dp=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Lp=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Np=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Up=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Fp=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,Op=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,Bp=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,zp=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,kp=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,Hp=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,Gp=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,Vp=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Wp=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,Xp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,qp=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Yp=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Zp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,$p=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,Kp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,Jp=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,jp=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Qp=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,em=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,tm=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,nm=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,im=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,sm=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,rm="gl_FragColor = linearToOutputTexel( gl_FragColor );",om=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,am=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,lm=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,cm=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,hm=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,um=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,dm=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,fm=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,pm=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,mm=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,gm=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,xm=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,_m=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,vm=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,ym=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,bm=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,Mm=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Sm=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Em=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,wm=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Tm=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Am=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Rm=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Cm=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Im=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Pm=`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Dm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Lm=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Nm=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Um=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Fm=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Om=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,Bm=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,zm=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,km=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Hm=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,Gm=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,Vm=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Wm=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Xm=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,qm=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,Ym=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,Zm=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,$m=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Km=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Jm=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,jm=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Qm=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,e0=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,t0=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,n0=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,i0=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,s0=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,r0=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,o0=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,a0=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,l0=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,c0=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,h0=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,u0=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,d0=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,f0=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,p0=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,m0=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,g0=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,x0=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,_0=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,v0=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,y0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,b0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,M0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,S0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,E0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,w0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,T0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,A0=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,R0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,C0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,I0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,P0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,D0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,L0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,N0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,U0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,F0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,O0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,B0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,z0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,k0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,H0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,G0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,V0=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,W0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,X0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,q0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Y0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,Z0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,$0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,K0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,J0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,j0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Q0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,eg=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,tg=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ng=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,ig=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,sg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,rg=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,og=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,ag=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,lg=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qe={alphahash_fragment:Cp,alphahash_pars_fragment:Ip,alphamap_fragment:Pp,alphamap_pars_fragment:Dp,alphatest_fragment:Lp,alphatest_pars_fragment:Np,aomap_fragment:Up,aomap_pars_fragment:Fp,batching_pars_vertex:Op,batching_vertex:Bp,begin_vertex:zp,beginnormal_vertex:kp,bsdfs:Hp,iridescence_fragment:Gp,bumpmap_pars_fragment:Vp,clipping_planes_fragment:Wp,clipping_planes_pars_fragment:Xp,clipping_planes_pars_vertex:qp,clipping_planes_vertex:Yp,color_fragment:Zp,color_pars_fragment:$p,color_pars_vertex:Kp,color_vertex:Jp,common:jp,cube_uv_reflection_fragment:Qp,defaultnormal_vertex:em,displacementmap_pars_vertex:tm,displacementmap_vertex:nm,emissivemap_fragment:im,emissivemap_pars_fragment:sm,colorspace_fragment:rm,colorspace_pars_fragment:om,envmap_fragment:am,envmap_common_pars_fragment:lm,envmap_pars_fragment:cm,envmap_pars_vertex:hm,envmap_physical_pars_fragment:bm,envmap_vertex:um,fog_vertex:dm,fog_pars_vertex:fm,fog_fragment:pm,fog_pars_fragment:mm,gradientmap_pars_fragment:gm,lightmap_pars_fragment:xm,lights_lambert_fragment:_m,lights_lambert_pars_fragment:vm,lights_pars_begin:ym,lights_toon_fragment:Mm,lights_toon_pars_fragment:Sm,lights_phong_fragment:Em,lights_phong_pars_fragment:wm,lights_physical_fragment:Tm,lights_physical_pars_fragment:Am,lights_fragment_begin:Rm,lights_fragment_maps:Cm,lights_fragment_end:Im,lightprobes_pars_fragment:Pm,logdepthbuf_fragment:Dm,logdepthbuf_pars_fragment:Lm,logdepthbuf_pars_vertex:Nm,logdepthbuf_vertex:Um,map_fragment:Fm,map_pars_fragment:Om,map_particle_fragment:Bm,map_particle_pars_fragment:zm,metalnessmap_fragment:km,metalnessmap_pars_fragment:Hm,morphinstance_vertex:Gm,morphcolor_vertex:Vm,morphnormal_vertex:Wm,morphtarget_pars_vertex:Xm,morphtarget_vertex:qm,normal_fragment_begin:Ym,normal_fragment_maps:Zm,normal_pars_fragment:$m,normal_pars_vertex:Km,normal_vertex:Jm,normalmap_pars_fragment:jm,clearcoat_normal_fragment_begin:Qm,clearcoat_normal_fragment_maps:e0,clearcoat_pars_fragment:t0,iridescence_pars_fragment:n0,opaque_fragment:i0,packing:s0,premultiplied_alpha_fragment:r0,project_vertex:o0,dithering_fragment:a0,dithering_pars_fragment:l0,roughnessmap_fragment:c0,roughnessmap_pars_fragment:h0,shadowmap_pars_fragment:u0,shadowmap_pars_vertex:d0,shadowmap_vertex:f0,shadowmask_pars_fragment:p0,skinbase_vertex:m0,skinning_pars_vertex:g0,skinning_vertex:x0,skinnormal_vertex:_0,specularmap_fragment:v0,specularmap_pars_fragment:y0,tonemapping_fragment:b0,tonemapping_pars_fragment:M0,transmission_fragment:S0,transmission_pars_fragment:E0,uv_pars_fragment:w0,uv_pars_vertex:T0,uv_vertex:A0,worldpos_vertex:R0,background_vert:C0,background_frag:I0,backgroundCube_vert:P0,backgroundCube_frag:D0,cube_vert:L0,cube_frag:N0,depth_vert:U0,depth_frag:F0,distance_vert:O0,distance_frag:B0,equirect_vert:z0,equirect_frag:k0,linedashed_vert:H0,linedashed_frag:G0,meshbasic_vert:V0,meshbasic_frag:W0,meshlambert_vert:X0,meshlambert_frag:q0,meshmatcap_vert:Y0,meshmatcap_frag:Z0,meshnormal_vert:$0,meshnormal_frag:K0,meshphong_vert:J0,meshphong_frag:j0,meshphysical_vert:Q0,meshphysical_frag:eg,meshtoon_vert:tg,meshtoon_frag:ng,points_vert:ig,points_frag:sg,shadow_vert:rg,shadow_frag:og,sprite_vert:ag,sprite_frag:lg},ye={common:{diffuse:{value:new Le(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Ze}},envmap:{envMap:{value:null},envMapRotation:{value:new Ze},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Ze}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Ze}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Ze},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Ze},normalScale:{value:new ue(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Ze},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Ze}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Ze}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Ze}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Le(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new P},probesMax:{value:new P},probesResolution:{value:new P}},points:{diffuse:{value:new Le(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0},uvTransform:{value:new Ze}},sprite:{diffuse:{value:new Le(16777215)},opacity:{value:1},center:{value:new ue(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Ze},alphaMap:{value:null},alphaMapTransform:{value:new Ze},alphaTest:{value:0}}},Dn={basic:{uniforms:Wt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.fog]),vertexShader:Qe.meshbasic_vert,fragmentShader:Qe.meshbasic_frag},lambert:{uniforms:Wt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new Le(0)},envMapIntensity:{value:1}}]),vertexShader:Qe.meshlambert_vert,fragmentShader:Qe.meshlambert_frag},phong:{uniforms:Wt([ye.common,ye.specularmap,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,ye.lights,{emissive:{value:new Le(0)},specular:{value:new Le(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphong_vert,fragmentShader:Qe.meshphong_frag},standard:{uniforms:Wt([ye.common,ye.envmap,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.roughnessmap,ye.metalnessmap,ye.fog,ye.lights,{emissive:{value:new Le(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag},toon:{uniforms:Wt([ye.common,ye.aomap,ye.lightmap,ye.emissivemap,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.gradientmap,ye.fog,ye.lights,{emissive:{value:new Le(0)}}]),vertexShader:Qe.meshtoon_vert,fragmentShader:Qe.meshtoon_frag},matcap:{uniforms:Wt([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,ye.fog,{matcap:{value:null}}]),vertexShader:Qe.meshmatcap_vert,fragmentShader:Qe.meshmatcap_frag},points:{uniforms:Wt([ye.points,ye.fog]),vertexShader:Qe.points_vert,fragmentShader:Qe.points_frag},dashed:{uniforms:Wt([ye.common,ye.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qe.linedashed_vert,fragmentShader:Qe.linedashed_frag},depth:{uniforms:Wt([ye.common,ye.displacementmap]),vertexShader:Qe.depth_vert,fragmentShader:Qe.depth_frag},normal:{uniforms:Wt([ye.common,ye.bumpmap,ye.normalmap,ye.displacementmap,{opacity:{value:1}}]),vertexShader:Qe.meshnormal_vert,fragmentShader:Qe.meshnormal_frag},sprite:{uniforms:Wt([ye.sprite,ye.fog]),vertexShader:Qe.sprite_vert,fragmentShader:Qe.sprite_frag},background:{uniforms:{uvTransform:{value:new Ze},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qe.background_vert,fragmentShader:Qe.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Ze}},vertexShader:Qe.backgroundCube_vert,fragmentShader:Qe.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qe.cube_vert,fragmentShader:Qe.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qe.equirect_vert,fragmentShader:Qe.equirect_frag},distance:{uniforms:Wt([ye.common,ye.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qe.distance_vert,fragmentShader:Qe.distance_frag},shadow:{uniforms:Wt([ye.lights,ye.fog,{color:{value:new Le(0)},opacity:{value:1}}]),vertexShader:Qe.shadow_vert,fragmentShader:Qe.shadow_frag}};Dn.physical={uniforms:Wt([Dn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Ze},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Ze},clearcoatNormalScale:{value:new ue(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Ze},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Ze},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Ze},sheen:{value:0},sheenColor:{value:new Le(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Ze},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Ze},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Ze},transmissionSamplerSize:{value:new ue},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Ze},attenuationDistance:{value:0},attenuationColor:{value:new Le(0)},specularColor:{value:new Le(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Ze},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Ze},anisotropyVector:{value:new ue},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Ze}}]),vertexShader:Qe.meshphysical_vert,fragmentShader:Qe.meshphysical_frag};var Oa={r:0,b:0,g:0},cg=new vt,td=new Ze;td.set(-1,0,0,0,1,0,0,0,1);function hg(n,e,t,i,s,r){let o=new Le(0),a=s===!0?0:1,l,c,h=null,d=0,u=null;function f(M){let A=M.isScene===!0?M.background:null;if(A&&A.isTexture){let v=M.backgroundBlurriness>0;A=e.get(A,v)}return A}function g(M){let A=!1,v=f(M);v===null?m(o,a):v&&v.isColor&&(m(v,1),A=!0);let E=n.xr.getEnvironmentBlendMode();E==="additive"?t.buffers.color.setClear(0,0,0,1,r):E==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,r),(n.autoClear||A)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function b(M,A){let v=f(A);v&&(v.isCubeTexture||v.mapping===yr)?(c===void 0&&(c=new Ye(new ti(1,1,1),new Vt({name:"BackgroundCubeMaterial",uniforms:Li(Dn.backgroundCube.uniforms),vertexShader:Dn.backgroundCube.vertexShader,fragmentShader:Dn.backgroundCube.fragmentShader,side:Ft,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),c.geometry.deleteAttribute("uv"),c.onBeforeRender=function(E,S,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(c.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(c)),c.material.uniforms.envMap.value=v,c.material.uniforms.backgroundBlurriness.value=A.backgroundBlurriness,c.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,c.material.uniforms.backgroundRotation.value.setFromMatrix4(cg.makeRotationFromEuler(A.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&c.material.uniforms.backgroundRotation.value.premultiply(td),c.material.toneMapped=it.getTransfer(v.colorSpace)!==dt,(h!==v||d!==v.version||u!==n.toneMapping)&&(c.material.needsUpdate=!0,h=v,d=v.version,u=n.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null)):v&&v.isTexture&&(l===void 0&&(l=new Ye(new Ti(2,2),new Vt({name:"BackgroundMaterial",uniforms:Li(Dn.background.uniforms),vertexShader:Dn.background.vertexShader,fragmentShader:Dn.background.fragmentShader,side:li,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(l)),l.material.uniforms.t2D.value=v,l.material.uniforms.backgroundIntensity.value=A.backgroundIntensity,l.material.toneMapped=it.getTransfer(v.colorSpace)!==dt,v.matrixAutoUpdate===!0&&v.updateMatrix(),l.material.uniforms.uvTransform.value.copy(v.matrix),(h!==v||d!==v.version||u!==n.toneMapping)&&(l.material.needsUpdate=!0,h=v,d=v.version,u=n.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null))}function m(M,A){M.getRGB(Oa,vc(n)),t.buffers.color.setClear(Oa.r,Oa.g,Oa.b,A,r)}function p(){c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0),l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0)}return{getClearColor:function(){return o},setClearColor:function(M,A=1){o.set(M),a=A,m(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(M){a=M,m(o,a)},render:g,addToRenderList:b,dispose:p}}function ug(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},s=u(null),r=s,o=!1;function a(L,B,G,N,z){let X=!1,Y=d(L,N,G,B);r!==Y&&(r=Y,c(r.object)),X=f(L,N,G,z),X&&g(L,N,G,z),z!==null&&e.update(z,n.ELEMENT_ARRAY_BUFFER),(X||o)&&(o=!1,v(L,B,G,N),z!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(z).buffer))}function l(){return n.createVertexArray()}function c(L){return n.bindVertexArray(L)}function h(L){return n.deleteVertexArray(L)}function d(L,B,G,N){let z=N.wireframe===!0,X=i[B.id];X===void 0&&(X={},i[B.id]=X);let Y=L.isInstancedMesh===!0?L.id:0,re=X[Y];re===void 0&&(re={},X[Y]=re);let Z=re[G.id];Z===void 0&&(Z={},re[G.id]=Z);let ee=Z[z];return ee===void 0&&(ee=u(l()),Z[z]=ee),ee}function u(L){let B=[],G=[],N=[];for(let z=0;z<t;z++)B[z]=0,G[z]=0,N[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:B,enabledAttributes:G,attributeDivisors:N,object:L,attributes:{},index:null}}function f(L,B,G,N){let z=r.attributes,X=B.attributes,Y=0,re=G.getAttributes();for(let Z in re)if(re[Z].location>=0){let ne=z[Z],De=X[Z];if(De===void 0&&(Z==="instanceMatrix"&&L.instanceMatrix&&(De=L.instanceMatrix),Z==="instanceColor"&&L.instanceColor&&(De=L.instanceColor)),ne===void 0||ne.attribute!==De||De&&ne.data!==De.data)return!0;Y++}return r.attributesNum!==Y||r.index!==N}function g(L,B,G,N){let z={},X=B.attributes,Y=0,re=G.getAttributes();for(let Z in re)if(re[Z].location>=0){let ne=X[Z];ne===void 0&&(Z==="instanceMatrix"&&L.instanceMatrix&&(ne=L.instanceMatrix),Z==="instanceColor"&&L.instanceColor&&(ne=L.instanceColor));let De={};De.attribute=ne,ne&&ne.data&&(De.data=ne.data),z[Z]=De,Y++}r.attributes=z,r.attributesNum=Y,r.index=N}function b(){let L=r.newAttributes;for(let B=0,G=L.length;B<G;B++)L[B]=0}function m(L){p(L,0)}function p(L,B){let G=r.newAttributes,N=r.enabledAttributes,z=r.attributeDivisors;G[L]=1,N[L]===0&&(n.enableVertexAttribArray(L),N[L]=1),z[L]!==B&&(n.vertexAttribDivisor(L,B),z[L]=B)}function M(){let L=r.newAttributes,B=r.enabledAttributes;for(let G=0,N=B.length;G<N;G++)B[G]!==L[G]&&(n.disableVertexAttribArray(G),B[G]=0)}function A(L,B,G,N,z,X,Y){Y===!0?n.vertexAttribIPointer(L,B,G,z,X):n.vertexAttribPointer(L,B,G,N,z,X)}function v(L,B,G,N){b();let z=N.attributes,X=G.getAttributes(),Y=B.defaultAttributeValues;for(let re in X){let Z=X[re];if(Z.location>=0){let ee=z[re];if(ee===void 0&&(re==="instanceMatrix"&&L.instanceMatrix&&(ee=L.instanceMatrix),re==="instanceColor"&&L.instanceColor&&(ee=L.instanceColor)),ee!==void 0){let ne=ee.normalized,De=ee.itemSize,Te=e.get(ee);if(Te===void 0)continue;let tt=Te.buffer,Je=Te.type,st=Te.bytesPerElement,K=Je===n.INT||Je===n.UNSIGNED_INT||ee.gpuType===jo;if(ee.isInterleavedBufferAttribute){let te=ee.data,_e=te.stride,Ge=ee.offset;if(te.isInstancedInterleavedBuffer){for(let Se=0;Se<Z.locationSize;Se++)p(Z.location+Se,te.meshPerAttribute);L.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let Se=0;Se<Z.locationSize;Se++)m(Z.location+Se);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let Se=0;Se<Z.locationSize;Se++)A(Z.location+Se,De/Z.locationSize,Je,ne,_e*st,(Ge+De/Z.locationSize*Se)*st,K)}else{if(ee.isInstancedBufferAttribute){for(let te=0;te<Z.locationSize;te++)p(Z.location+te,ee.meshPerAttribute);L.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let te=0;te<Z.locationSize;te++)m(Z.location+te);n.bindBuffer(n.ARRAY_BUFFER,tt);for(let te=0;te<Z.locationSize;te++)A(Z.location+te,De/Z.locationSize,Je,ne,De*st,De/Z.locationSize*te*st,K)}}else if(Y!==void 0){let ne=Y[re];if(ne!==void 0)switch(ne.length){case 2:n.vertexAttrib2fv(Z.location,ne);break;case 3:n.vertexAttrib3fv(Z.location,ne);break;case 4:n.vertexAttrib4fv(Z.location,ne);break;default:n.vertexAttrib1fv(Z.location,ne)}}}}M()}function E(){w();for(let L in i){let B=i[L];for(let G in B){let N=B[G];for(let z in N){let X=N[z];for(let Y in X)h(X[Y].object),delete X[Y];delete N[z]}}delete i[L]}}function S(L){if(i[L.id]===void 0)return;let B=i[L.id];for(let G in B){let N=B[G];for(let z in N){let X=N[z];for(let Y in X)h(X[Y].object),delete X[Y];delete N[z]}}delete i[L.id]}function C(L){for(let B in i){let G=i[B];for(let N in G){let z=G[N];if(z[L.id]===void 0)continue;let X=z[L.id];for(let Y in X)h(X[Y].object),delete X[Y];delete z[L.id]}}}function _(L){for(let B in i){let G=i[B],N=L.isInstancedMesh===!0?L.id:0,z=G[N];if(z!==void 0){for(let X in z){let Y=z[X];for(let re in Y)h(Y[re].object),delete Y[re];delete z[X]}delete G[N],Object.keys(G).length===0&&delete i[B]}}}function w(){I(),o=!0,r!==s&&(r=s,c(r.object))}function I(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:w,resetDefaultState:I,dispose:E,releaseStatesOfGeometry:S,releaseStatesOfObject:_,releaseStatesOfProgram:C,initAttributes:b,enableAttribute:m,disableUnusedAttributes:M}}function dg(n,e,t){let i;function s(l){i=l}function r(l,c){n.drawArrays(i,l,c),t.update(c,i,1)}function o(l,c,h){h!==0&&(n.drawArraysInstanced(i,l,c,h),t.update(c,i,h))}function a(l,c,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,l,0,c,0,h);let u=0;for(let f=0;f<h;f++)u+=c[f];t.update(u,i,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function fg(n,e,t,i){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");s=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(C){return!(C!==hn&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let _=C===bn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==jt&&C!==yn&&!_&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function l(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let c=t.precision!==void 0?t.precision:"highp",h=l(c);h!==c&&(Xe("WebGLRenderer:",c,"not supported, using",h,"instead."),c=h);let d=t.logarithmicDepthBuffer===!0,u=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&u===!1&&Xe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),g=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),b=n.getParameter(n.MAX_TEXTURE_SIZE),m=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),M=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),A=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),E=n.getParameter(n.MAX_SAMPLES),S=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:l,textureFormatReadable:o,textureTypeReadable:a,precision:c,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:f,maxVertexTextures:g,maxTextureSize:b,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:M,maxVaryings:A,maxFragmentUniforms:v,maxSamples:E,samples:S}}function pg(n){let e=this,t=null,i=0,s=!1,r=!1,o=new gn,a=new Ze,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let f=d.length!==0||u||i!==0||s;return s=u,i=d.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){t=h(d,u,0)},this.setState=function(d,u,f){let g=d.clippingPlanes,b=d.clipIntersection,m=d.clipShadows,p=n.get(d);if(!s||g===null||g.length===0||r&&!m)r?h(null):c();else{let M=r?0:i,A=M*4,v=p.clippingState||null;l.value=v,v=h(g,u,A,f);for(let E=0;E!==A;++E)v[E]=t[E];p.clippingState=v,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=M}};function c(){l.value!==t&&(l.value=t,l.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function h(d,u,f,g){let b=d!==null?d.length:0,m=null;if(b!==0){if(m=l.value,g!==!0||m===null){let p=f+b*4,M=u.matrixWorldInverse;a.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let A=0,v=f;A!==b;++A,v+=4)o.copy(d[A]).applyMatrix4(M,a),o.normal.toArray(m,v),m[v+3]=o.constant}l.value=m,l.needsUpdate=!0}return e.numPlanes=b,e.numIntersection=0,m}}var Es=4,mg=6,gg=20,xg=256,Cr=new _s,Lu=new Le,Sc=null,Ec=0,wc=0,Tc=!1,_g=new P,Ni=new P,za=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,s=100,r={}){let{size:o=256,position:a=_g}=r;Sc=this._renderer.getRenderTarget(),Ec=this._renderer.getActiveCubeFace(),wc=this._renderer.getActiveMipmapLevel(),Tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let l=this._allocateTargets();return l.depthBuffer=!0,this._sceneToCubeUV(e,i,s,l,a),t>0&&this._blur(l,0,0,t),this._applyPMREM(l),this._cleanup(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Fu(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Uu(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Sc,Ec,wc),this._renderer.xr.enabled=Tc,e.scissorTest=!1,Ss(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===ci||e.mapping===Pi?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Sc=this._renderer.getRenderTarget(),Ec=this._renderer.getActiveCubeFace(),wc=this._renderer.getActiveMipmapLevel(),Tc=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Ut,minFilter:Ut,generateMipmaps:!1,type:bn,format:hn,colorSpace:qs,depthBuffer:!1},s=Nu(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Nu(e,t,i);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=vg(r)),this._blurMaterial=bg(r,e,t),this._ggxMaterial=yg(r,e,t)}return s}_compileMaterial(e){let t=new Ye(new Ct,e);this._renderer.compile(t,Cr)}_sceneToCubeUV(e,t,i,s,r){let l=new Nt(90,1,t,i),c=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,f=d.toneMapping;d.getClearColor(Lu),d.toneMapping=_n,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ye(new ti,new Jt({name:"PMREM.Background",side:Ft,depthWrite:!1,depthTest:!1})));let b=this._backgroundBox,m=b.material,p=!1,M=e.background;M?M.isColor&&(m.color.copy(M),e.background=null,p=!0):(m.color.copy(Lu),p=!0);for(let A=0;A<6;A++){let v=A%3;v===0?(l.up.set(0,c[A],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x+h[A],r.y,r.z)):v===1?(l.up.set(0,0,c[A]),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y+h[A],r.z)):(l.up.set(0,c[A],0),l.position.set(r.x,r.y,r.z),l.lookAt(r.x,r.y,r.z+h[A]));let E=this._cubeSize;Ss(s,v*E,A>2?E:0,E,E),d.setRenderTarget(s),p&&d.render(b,l),d.render(e,l)}d.toneMapping=f,d.autoClear=u,e.background=M}_textureToCubeUV(e,t){let i=this._renderer,s=e.mapping===ci||e.mapping===Pi;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Fu()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Uu());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=e;let l=this._cubeSize;Ss(t,0,0,3*l,2*l),i.setRenderTarget(t),i.render(o,Cr)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(e,r-1,r);t.autoClear=i}_applyGGXFilter(e,t,i){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let l=o.uniforms,c=i/(this._lodMeshes.length-1),h=t/(this._lodMeshes.length-1),d=Math.sqrt(c*c-h*h),u=c*1.25,f=d*u,{_lodMax:g}=this,b=this._sizeLods[i],m=3*b*(i>g-Es?i-g+Es:0),p=4*(this._cubeSize-b);l.envMap.value=e.texture,l.roughness.value=f,l.mipInt.value=g-t,Ss(r,m,p,3*b,2*b),s.setRenderTarget(r),s.render(a,Cr),l.envMap.value=r.texture,l.roughness.value=0,l.mipInt.value=g-i,Ss(e,m,p,3*b,2*b),s.setRenderTarget(e),s.render(a,Cr)}_blur(e,t,i,s){let r=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(e,r,t,i,o),this._blurPass(r,e,i,i,o)}_blurPass(e,t,i,s,r){let o=this._renderer,a=this._blurMaterial,l=this._lodMeshes[s];l.material=a;let c=a.uniforms;c.envMap.value=e.texture,c.sigma.value=r,c.mipInt.value=this._lodMax-i;let h=this._sizeLods[s],d=3*h*(s>this._lodMax-Es?s-this._lodMax+Es:0),u=4*(this._cubeSize-h);Ss(t,d,u,3*h,2*h),o.setRenderTarget(t),o.render(l,Cr)}};function vg(n){let e=[],t=[],i=n,s=n-Es+1+mg;for(let r=0;r<s;r++){let o=Math.pow(2,i);e.push(o);let a=1/(o-2),l=-a,c=1+a,h=[l,l,c,l,c,c,l,l,c,c,l,c],d=6,u=6,f=3,g=new Float32Array(f*u*d),b=new Float32Array(f*u*d);for(let p=0;p<d;p++){let M=p%3*2/3-1,A=p>2?0:-1,v=[M,A,0,M+2/3,A,0,M+2/3,A+1,0,M,A,0,M+2/3,A+1,0,M,A+1,0];g.set(v,f*u*p);for(let E=0;E<u;E++){let S=h[E*2]*2-1,C=h[E*2+1]*2-1;p===0?Ni.set(1,C,S):p===1?Ni.set(-S,1,-C):p===2?Ni.set(-S,C,1):p===3?Ni.set(-1,C,-S):p===4?Ni.set(-S,-1,C):Ni.set(S,C,-1),Ni.toArray(b,(p*u+E)*f)}}let m=new Ct;m.setAttribute("position",new kt(g,f)),m.setAttribute("outputDirection",new kt(b,f)),t.push(new Ye(m,null)),i>Es&&i--}return{lodMeshes:t,sizeLods:e}}function Nu(n,e,t){let i=new Ht(n,e,t);return i.texture.mapping=yr,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Ss(n,e,t,i,s){n.viewport.set(e,t,i,s),n.scissor.set(e,t,i,s)}function yg(n,e,t){return new Vt({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:xg,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Ga(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function bg(n,e,t){return new Vt({name:"SphericalGaussianBlur",defines:{SAMPLES:gg,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Ga(),fragmentShader:`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Uu(){return new Vt({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Ga(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Fu(){return new Vt({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Ga(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:In,depthTest:!1,depthWrite:!1})}function Ga(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var ka=class extends Ht{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},s=[i,i,i,i,i,i];this.texture=new er(s),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new ti(5,5,5),r=new Vt({name:"CubemapFromEquirect",uniforms:Li(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Ft,blending:In});r.uniforms.tEquirect.value=t;let o=new Ye(s,r),a=t.minFilter;return t.minFilter===hi&&(t.minFilter=Ut),new Yo(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,s=!0){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,s);e.setRenderTarget(r)}};function Mg(n){let e=new WeakMap,t=new WeakMap,i=null;function s(u,f=!1){return u==null?null:f?o(u):r(u)}function r(u){if(u&&u.isTexture){let f=u.mapping;if(f===$o||f===Ko)if(e.has(u)){let g=e.get(u).texture;return a(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let b=new ka(g.height);return b.fromEquirectangularTexture(n,u),e.set(u,b),u.addEventListener("dispose",c),a(b.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){let f=u.mapping,g=f===$o||f===Ko,b=f===ci||f===Pi;if(g||b){let m=t.get(u),p=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==p)return i===null&&(i=new za(n)),m=g?i.fromEquirectangular(u,m):i.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),m.texture;if(m!==void 0)return m.texture;{let M=u.image;return g&&M&&M.height>0||b&&M&&l(M)?(i===null&&(i=new za(n)),m=g?i.fromEquirectangular(u):i.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,t.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function a(u,f){return f===$o?u.mapping=ci:f===Ko&&(u.mapping=Pi),u}function l(u){let f=0,g=6;for(let b=0;b<g;b++)u[b]!==void 0&&f++;return f===g}function c(u){let f=u.target;f.removeEventListener("dispose",c);let g=e.get(f);g!==void 0&&(e.delete(f),g.dispose())}function h(u){let f=u.target;f.removeEventListener("dispose",h);let g=t.get(f);g!==void 0&&(t.delete(f),g.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:s,dispose:d}}function Sg(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let s=n.getExtension(i);return e[i]=s,s}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let s=t(i);return s===null&&Si("WebGLRenderer: "+i+" extension not supported."),s}}}function Eg(n,e,t,i){let s={},r=new WeakMap;function o(d){let u=d.target;u.index!==null&&e.remove(u.index);for(let g in u.attributes)e.remove(u.attributes[g]);u.removeEventListener("dispose",o),delete s[u.id];let f=r.get(u);f&&(e.remove(f),r.delete(u)),i.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,t.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,t.memory.geometries++),u}function l(d){let u=d.attributes;for(let f in u)e.update(u[f],n.ARRAY_BUFFER)}function c(d){let u=[],f=d.index,g=d.attributes.position,b=0;if(g===void 0)return;if(f!==null){let M=f.array;b=f.version;for(let A=0,v=M.length;A<v;A+=3){let E=M[A+0],S=M[A+1],C=M[A+2];u.push(E,S,S,C,C,E)}}else{let M=g.array;b=g.version;for(let A=0,v=M.length/3-1;A<v;A+=3){let E=A+0,S=A+1,C=A+2;u.push(E,S,S,C,C,E)}}let m=new(g.count>=65535?Qs:js)(u,1);m.version=b;let p=r.get(d);p&&e.remove(p),r.set(d,m)}function h(d){let u=r.get(d);if(u){let f=d.index;f!==null&&u.version<f.version&&c(d)}else c(d);return r.get(d)}return{get:a,update:l,getWireframeAttribute:h}}function wg(n,e,t){let i;function s(d){i=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function l(d,u){n.drawElements(i,u,r,d*o),t.update(u,i,1)}function c(d,u,f){f!==0&&(n.drawElementsInstanced(i,u,r,d*o,f),t.update(u,i,f))}function h(d,u,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,u,0,r,d,0,f);let b=0;for(let m=0;m<f;m++)b+=u[m];t.update(b,i,1)}this.setMode=s,this.setIndex=a,this.render=l,this.renderInstances=c,this.renderMultiDraw=h}function Tg(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(r,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(r/3);break;case n.LINES:t.lines+=a*(r/2);break;case n.LINE_STRIP:t.lines+=a*(r-1);break;case n.LINE_LOOP:t.lines+=a*r;break;case n.POINTS:t.points+=a*r;break;default:qe("WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:i}}function Ag(n,e,t){let i=new WeakMap,s=new St;function r(o,a,l){let c=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=i.get(a);if(u===void 0||u.count!==d){let w=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",w)};u!==void 0&&u.texture.dispose();let f=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,b=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],M=a.morphAttributes.color||[],A=0;f===!0&&(A=1),g===!0&&(A=2),b===!0&&(A=3);let v=a.attributes.position.count*A,E=1;v>e.maxTextureSize&&(E=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let S=new Float32Array(v*E*4*d),C=new $s(S,v,E,d);C.type=yn,C.needsUpdate=!0;let _=A*4;for(let I=0;I<d;I++){let L=m[I],B=p[I],G=M[I],N=v*E*4*I;for(let z=0;z<L.count;z++){let X=z*_;f===!0&&(s.fromBufferAttribute(L,z),S[N+X+0]=s.x,S[N+X+1]=s.y,S[N+X+2]=s.z,S[N+X+3]=0),g===!0&&(s.fromBufferAttribute(B,z),S[N+X+4]=s.x,S[N+X+5]=s.y,S[N+X+6]=s.z,S[N+X+7]=0),b===!0&&(s.fromBufferAttribute(G,z),S[N+X+8]=s.x,S[N+X+9]=s.y,S[N+X+10]=s.z,S[N+X+11]=G.itemSize===4?s.w:1)}}u={count:d,texture:C,size:new ue(v,E)},i.set(a,u),a.addEventListener("dispose",w)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)l.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let b=0;b<c.length;b++)f+=c[b];let g=a.morphTargetsRelative?1:1-f;l.getUniforms().setValue(n,"morphTargetBaseInfluence",g),l.getUniforms().setValue(n,"morphTargetInfluences",c)}l.getUniforms().setValue(n,"morphTargetsTexture",u.texture,t),l.getUniforms().setValue(n,"morphTargetsTextureSize",u.size)}return{update:r}}function Rg(n,e,t,i,s){let r=new WeakMap;function o(c){let h=s.render.frame,d=c.geometry,u=e.get(c,d);if(r.get(u)!==h&&(e.update(u),r.set(u,h)),c.isInstancedMesh&&(c.hasEventListener("dispose",l)===!1&&c.addEventListener("dispose",l),r.get(c)!==h&&(t.update(c.instanceMatrix,n.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,n.ARRAY_BUFFER),r.set(c,h))),c.isSkinnedMesh){let f=c.skeleton;r.get(f)!==h&&(f.update(),r.set(f,h))}return u}function a(){r=new WeakMap}function l(c){let h=c.target;h.removeEventListener("dispose",l),i.releaseStatesOfObject(h),t.remove(h.instanceMatrix),h.instanceColor!==null&&t.remove(h.instanceColor)}return{update:o,dispose:a}}var Cg={[tc]:"LINEAR_TONE_MAPPING",[nc]:"REINHARD_TONE_MAPPING",[ic]:"CINEON_TONE_MAPPING",[sc]:"ACES_FILMIC_TONE_MAPPING",[oc]:"AGX_TONE_MAPPING",[ac]:"NEUTRAL_TONE_MAPPING",[rc]:"CUSTOM_TONE_MAPPING"};function Ig(n,e,t,i,s,r){let o=new Ht(e,t,{type:n,depthBuffer:s,stencilBuffer:r,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,l=null,c=new Ct;c.setAttribute("position",new at([-1,3,0,-1,-1,0,3,-1,0],3)),c.setAttribute("uv",new at([0,2,0,0,2,0],2));let h=new Lo({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Ye(c,h),u=new _s(-1,1,1,-1,0,1),f=null,g=null,b=!1,m,p=null,M=[],A=!1;this.setSize=function(v,E){o.setSize(v,E),a!==null&&a.setSize(v,E),l!==null&&l.setSize(v,E);for(let S=0;S<M.length;S++){let C=M[S];C.setSize&&C.setSize(v,E)}},this.setEffects=function(v){M=v,A=M.length>0&&M[0].isRenderPass===!0;let E=o.width,S=o.height;M.length>0&&a===null&&(a=new Ht(E,S,{type:bn,depthBuffer:!1,stencilBuffer:!1}),l=new Ht(E,S,{type:bn,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<M.length;C++){let _=M[C];_.setSize&&_.setSize(E,S)}},this.begin=function(v,E){if(b||v.toneMapping===_n&&M.length===0)return!1;if(p=E,E!==null){let S=E.width,C=E.height;(o.width!==S||o.height!==C)&&this.setSize(S,C)}return A===!1&&v.setRenderTarget(o),m=v.toneMapping,v.toneMapping=_n,!0},this.hasRenderPass=function(){return A},this.end=function(v,E){v.toneMapping=m,b=!0;let S=o,C=a;for(let _=0;_<M.length;_++){let w=M[_];w.enabled!==!1&&(w.render(v,C,S,E),w.needsSwap!==!1&&(S=C,C=C===a?l:a))}if(f!==v.outputColorSpace||g!==v.toneMapping){f=v.outputColorSpace,g=v.toneMapping,h.defines={},it.getTransfer(f)===dt&&(h.defines.SRGB_TRANSFER="");let _=Cg[g];_&&(h.defines[_]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=S.texture,v.setRenderTarget(p),v.render(d,u),p=null,b=!1},this.isCompositing=function(){return b},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),l!==null&&l.dispose(),c.dispose(),h.dispose()}}var nd=new Kt,Cc=new ei(1,1),id=new $s,sd=new Eo,rd=new er,Ou=[],Bu=[],zu=new Float32Array(16),ku=new Float32Array(9),Hu=new Float32Array(4);function Ts(n,e,t){let i=n[0];if(i<=0||i>0)return n;let s=e*t,r=Ou[s];if(r===void 0&&(r=new Float32Array(s),Ou[s]=r),e!==0){i.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(r,a)}return r}function It(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Pt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function Va(n,e){let t=Bu[e];t===void 0&&(t=new Int32Array(e),Bu[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Pg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function Dg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;n.uniform2fv(this.addr,e),Pt(t,e)}}function Lg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(It(t,e))return;n.uniform3fv(this.addr,e),Pt(t,e)}}function Ng(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;n.uniform4fv(this.addr,e),Pt(t,e)}}function Ug(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(It(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,i))return;Hu.set(i),n.uniformMatrix2fv(this.addr,!1,Hu),Pt(t,i)}}function Fg(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(It(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,i))return;ku.set(i),n.uniformMatrix3fv(this.addr,!1,ku),Pt(t,i)}}function Og(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(It(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Pt(t,e)}else{if(It(t,i))return;zu.set(i),n.uniformMatrix4fv(this.addr,!1,zu),Pt(t,i)}}function Bg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function zg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;n.uniform2iv(this.addr,e),Pt(t,e)}}function kg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;n.uniform3iv(this.addr,e),Pt(t,e)}}function Hg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;n.uniform4iv(this.addr,e),Pt(t,e)}}function Gg(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function Vg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(It(t,e))return;n.uniform2uiv(this.addr,e),Pt(t,e)}}function Wg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(It(t,e))return;n.uniform3uiv(this.addr,e),Pt(t,e)}}function Xg(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(It(t,e))return;n.uniform4uiv(this.addr,e),Pt(t,e)}}function qg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s);let r;this.type===n.SAMPLER_2D_SHADOW?(Cc.compareFunction=t.isReversedDepthBuffer()?Fa:Ua,r=Cc):r=nd,t.setTexture2D(e||r,s)}function Yg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture3D(e||sd,s)}function Zg(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTextureCube(e||rd,s)}function $g(n,e,t){let i=this.cache,s=t.allocateTextureUnit();i[0]!==s&&(n.uniform1i(this.addr,s),i[0]=s),t.setTexture2DArray(e||id,s)}function Kg(n){switch(n){case 5126:return Pg;case 35664:return Dg;case 35665:return Lg;case 35666:return Ng;case 35674:return Ug;case 35675:return Fg;case 35676:return Og;case 5124:case 35670:return Bg;case 35667:case 35671:return zg;case 35668:case 35672:return kg;case 35669:case 35673:return Hg;case 5125:return Gg;case 36294:return Vg;case 36295:return Wg;case 36296:return Xg;case 35678:case 36198:case 36298:case 36306:case 35682:return qg;case 35679:case 36299:case 36307:return Yg;case 35680:case 36300:case 36308:case 36293:return Zg;case 36289:case 36303:case 36311:case 36292:return $g}}function Jg(n,e){n.uniform1fv(this.addr,e)}function jg(n,e){let t=Ts(e,this.size,2);n.uniform2fv(this.addr,t)}function Qg(n,e){let t=Ts(e,this.size,3);n.uniform3fv(this.addr,t)}function ex(n,e){let t=Ts(e,this.size,4);n.uniform4fv(this.addr,t)}function tx(n,e){let t=Ts(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function nx(n,e){let t=Ts(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function ix(n,e){let t=Ts(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function sx(n,e){n.uniform1iv(this.addr,e)}function rx(n,e){n.uniform2iv(this.addr,e)}function ox(n,e){n.uniform3iv(this.addr,e)}function ax(n,e){n.uniform4iv(this.addr,e)}function lx(n,e){n.uniform1uiv(this.addr,e)}function cx(n,e){n.uniform2uiv(this.addr,e)}function hx(n,e){n.uniform3uiv(this.addr,e)}function ux(n,e){n.uniform4uiv(this.addr,e)}function dx(n,e,t){let i=this.cache,s=e.length,r=Va(t,s);It(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));let o;this.type===n.SAMPLER_2D_SHADOW?o=Cc:o=nd;for(let a=0;a!==s;++a)t.setTexture2D(e[a]||o,r[a])}function fx(n,e,t){let i=this.cache,s=e.length,r=Va(t,s);It(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||sd,r[o])}function px(n,e,t){let i=this.cache,s=e.length,r=Va(t,s);It(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||rd,r[o])}function mx(n,e,t){let i=this.cache,s=e.length,r=Va(t,s);It(i,r)||(n.uniform1iv(this.addr,r),Pt(i,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||id,r[o])}function gx(n){switch(n){case 5126:return Jg;case 35664:return jg;case 35665:return Qg;case 35666:return ex;case 35674:return tx;case 35675:return nx;case 35676:return ix;case 5124:case 35670:return sx;case 35667:case 35671:return rx;case 35668:case 35672:return ox;case 35669:case 35673:return ax;case 5125:return lx;case 36294:return cx;case 36295:return hx;case 36296:return ux;case 35678:case 36198:case 36298:case 36306:case 35682:return dx;case 35679:case 36299:case 36307:return fx;case 35680:case 36300:case 36308:case 36293:return px;case 36289:case 36303:case 36311:case 36292:return mx}}var Ic=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=Kg(t.type)}},Pc=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=gx(t.type)}},Dc=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],i)}}},Ac=/(\w+)(\])?(\[|\.)?/g;function Gu(n,e){n.seq.push(e),n.map[e.id]=e}function xx(n,e,t){let i=n.name,s=i.length;for(Ac.lastIndex=0;;){let r=Ac.exec(i),o=Ac.lastIndex,a=r[1],l=r[2]==="]",c=r[3];if(l&&(a=a|0),c===void 0||c==="["&&o+2===s){Gu(t,c===void 0?new Ic(a,n,e):new Pc(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new Dc(a),Gu(t,d)),t=d}}}var ws=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=e.getActiveUniform(t,o),l=e.getUniformLocation(t,a.name);xx(a,l,this)}let s=[],r=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(e,t,i,s){let r=this.map[t];r!==void 0&&r.setValue(e,i,s)}setOptional(e,t,i){let s=t[i];s!==void 0&&this.setValue(e,i,s)}static upload(e,t,i,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],l=i[a.id];l.needsUpdate!==!1&&a.setValue(e,l.value,s)}}static seqWithValue(e,t){let i=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&i.push(o)}return i}};function Vu(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var _x=37297,vx=0;function yx(n,e){let t=n.split(`
`),i=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var Wu=new Ze;function bx(n){it._getMatrix(Wu,it.workingColorSpace,n);let e=`mat3( ${Wu.elements.map(t=>t.toFixed(4))} )`;switch(it.getTransfer(n)){case Ys:return[e,"LinearTransferOETF"];case dt:return[e,"sRGBTransferOETF"];default:return Xe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Xu(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),r=(n.getShaderInfoLog(e)||"").trim();if(i&&r==="")return"";let o=/ERROR: 0:(\d+)/.exec(r);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+r+`

`+yx(n.getShaderSource(e),a)}else return r}function Mx(n,e){let t=bx(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var Sx={[tc]:"Linear",[nc]:"Reinhard",[ic]:"Cineon",[sc]:"ACESFilmic",[oc]:"AgX",[ac]:"Neutral",[rc]:"Custom"};function Ex(n,e){let t=Sx[e];return t===void 0?(Xe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ba=new P;function wx(){it.getLuminanceCoefficients(Ba);let n=Ba.x.toFixed(4),e=Ba.y.toFixed(4),t=Ba.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Tx(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Pr).join(`
`)}function Ax(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function Rx(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let s=0;s<i;s++){let r=n.getActiveAttrib(e,s),o=r.name,a=1;r.type===n.FLOAT_MAT2&&(a=2),r.type===n.FLOAT_MAT3&&(a=3),r.type===n.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Pr(n){return n!==""}function qu(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Yu(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var Cx=/^[ \t]*#include +<([\w\d./]+)>/gm;function Lc(n){return n.replace(Cx,Px)}var Ix=new Map;function Px(n,e){let t=Qe[e];if(t===void 0){let i=Ix.get(e);if(i!==void 0)t=Qe[i],Xe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Lc(t)}var Dx=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Zu(n){return n.replace(Dx,Lx)}function Lx(n,e,t,i){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=i.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function $u(n){let e=`precision ${n.precision} float;
	precision ${n.precision} int;
	precision ${n.precision} sampler2D;
	precision ${n.precision} samplerCube;
	precision ${n.precision} sampler3D;
	precision ${n.precision} sampler2DArray;
	precision ${n.precision} sampler2DShadow;
	precision ${n.precision} samplerCubeShadow;
	precision ${n.precision} sampler2DArrayShadow;
	precision ${n.precision} isampler2D;
	precision ${n.precision} isampler3D;
	precision ${n.precision} isamplerCube;
	precision ${n.precision} isampler2DArray;
	precision ${n.precision} usampler2D;
	precision ${n.precision} usampler3D;
	precision ${n.precision} usamplerCube;
	precision ${n.precision} usampler2DArray;
	`;return n.precision==="highp"?e+=`
#define HIGH_PRECISION`:n.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:n.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}var Nx={[vr]:"SHADOWMAP_TYPE_PCF",[vs]:"SHADOWMAP_TYPE_VSM"};function Ux(n){return Nx[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var Fx={[ci]:"ENVMAP_TYPE_CUBE",[Pi]:"ENVMAP_TYPE_CUBE",[yr]:"ENVMAP_TYPE_CUBE_UV"};function Ox(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":Fx[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var Bx={[Pi]:"ENVMAP_MODE_REFRACTION"};function zx(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":Bx[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var kx={[ec]:"ENVMAP_BLENDING_MULTIPLY",[lu]:"ENVMAP_BLENDING_MIX",[cu]:"ENVMAP_BLENDING_ADD"};function Hx(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":kx[n.combine]||"ENVMAP_BLENDING_NONE"}function Gx(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function Vx(n,e,t,i){let s=n.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,l=Ux(t),c=Ox(t),h=zx(t),d=Hx(t),u=Gx(t),f=Tx(t),g=Ax(r),b=s.createProgram(),m,p,M=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Pr).join(`
`),m.length>0&&(m+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g].filter(Pr).join(`
`),p.length>0&&(p+=`
`)):(m=[$u(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Pr).join(`
`),p=[$u(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,g,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+c:"",t.envMap?"#define "+h:"",t.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+l:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==_n?"#define TONE_MAPPING":"",t.toneMapping!==_n?Qe.tonemapping_pars_fragment:"",t.toneMapping!==_n?Ex("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Qe.colorspace_pars_fragment,Mx("linearToOutputTexel",t.outputColorSpace),wx(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Pr).join(`
`)),o=Lc(o),o=qu(o,t),o=Yu(o,t),a=Lc(a),a=qu(a,t),a=Yu(a,t),o=Zu(o),a=Zu(a),t.isRawShaderMaterial!==!0&&(M=`#version 300 es
`,m=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,p=["#define varying in",t.glslVersion===mc?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===mc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let A=M+m+o,v=M+p+a,E=Vu(s,s.VERTEX_SHADER,A),S=Vu(s,s.FRAGMENT_SHADER,v);s.attachShader(b,E),s.attachShader(b,S),t.index0AttributeName!==void 0?s.bindAttribLocation(b,0,t.index0AttributeName):t.hasPositionAttribute===!0&&s.bindAttribLocation(b,0,"position"),s.linkProgram(b);function C(L){if(n.debug.checkShaderErrors){let B=s.getProgramInfoLog(b)||"",G=s.getShaderInfoLog(E)||"",N=s.getShaderInfoLog(S)||"",z=B.trim(),X=G.trim(),Y=N.trim(),re=!0,Z=!0;if(s.getProgramParameter(b,s.LINK_STATUS)===!1)if(re=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(s,b,E,S);else{let ee=Xu(s,E,"vertex"),ne=Xu(s,S,"fragment");qe("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(b,s.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+z+`
`+ee+`
`+ne)}else z!==""?Xe("WebGLProgram: Program Info Log:",z):(X===""||Y==="")&&(Z=!1);Z&&(L.diagnostics={runnable:re,programLog:z,vertexShader:{log:X,prefix:m},fragmentShader:{log:Y,prefix:p}})}s.deleteShader(E),s.deleteShader(S),_=new ws(s,b),w=Rx(s,b)}let _;this.getUniforms=function(){return _===void 0&&C(this),_};let w;this.getAttributes=function(){return w===void 0&&C(this),w};let I=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return I===!1&&(I=s.getProgramParameter(b,_x)),I},this.destroy=function(){i.releaseStatesOfProgram(this),s.deleteProgram(b),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=vx++,this.cacheKey=e,this.usedTimes=1,this.program=b,this.vertexShader=E,this.fragmentShader=S,this}var Wx=0,Nc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let s=this._getShaderCacheForMaterial(e);return s.has(t)===!1&&(s.add(t),t.usedTimes++),s.has(i)===!1&&(s.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Uc(e),t.set(e,i)),i}},Uc=class{constructor(e){this.id=Wx++,this.code=e,this.usedTimes=0}};function Xx(n){return n===di||n===Ar||n===Rr}function qx(n,e,t,i,s,r){let o=new Ks,a=new Nc,l=new Set,c=[],h=new Map,d=i.logarithmicDepthBuffer,u=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(_){return l.add(_),_===0?"uv":`uv${_}`}function b(_,w,I,L,B,G){let N=L.fog,z=B.geometry,X=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?L.environment:null,Y=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,re=e.get(_.envMap||X,Y),Z=re&&re.mapping===yr?re.image.height:null,ee=f[_.type];_.precision!==null&&(u=i.getMaxPrecision(_.precision),u!==_.precision&&Xe("WebGLProgram.getParameters:",_.precision,"not supported, using",u,"instead."));let ne=z.morphAttributes.position||z.morphAttributes.normal||z.morphAttributes.color,De=ne!==void 0?ne.length:0,Te=0;z.morphAttributes.position!==void 0&&(Te=1),z.morphAttributes.normal!==void 0&&(Te=2),z.morphAttributes.color!==void 0&&(Te=3);let tt,Je,st,K;if(ee){let xt=Dn[ee];tt=xt.vertexShader,Je=xt.fragmentShader}else{tt=_.vertexShader,Je=_.fragmentShader;let xt=a.getVertexShaderStage(_),ht=a.getFragmentShaderStage(_);a.update(_,xt,ht),st=xt.id,K=ht.id}let te=n.getRenderTarget(),_e=n.state.buffers.depth.getReversed(),Ge=B.isInstancedMesh===!0,Se=B.isBatchedMesh===!0,He=!!_.map,rt=!!_.matcap,ie=!!re,le=!!_.aoMap,ce=!!_.lightMap,W=!!_.bumpMap&&_.wireframe===!1,j=!!_.normalMap,Ae=!!_.displacementMap,Ce=!!_.emissiveMap,ke=!!_.metalnessMap,Ve=!!_.roughnessMap,D=_.anisotropy>0,lt=_.clearcoat>0,$e=_.dispersion>0,T=_.retroreflectivity>0,x=_.iridescence>0,O=_.sheen>0,V=_.transmission>0,$=D&&!!_.anisotropyMap,de=lt&&!!_.clearcoatMap,fe=lt&&!!_.clearcoatNormalMap,J=lt&&!!_.clearcoatRoughnessMap,se=x&&!!_.iridescenceMap,pe=x&&!!_.iridescenceThicknessMap,Oe=O&&!!_.sheenColorMap,ve=O&&!!_.sheenRoughnessMap,me=!!_.specularMap,Be=!!_.specularColorMap,We=!!_.specularIntensityMap,Ke=V&&!!_.transmissionMap,F=V&&!!_.thicknessMap,ge=!!_.gradientMap,Q=!!_.alphaMap,xe=_.alphaTest>0,Ee=!!_.alphaHash,oe=!!_.extensions,ze=_n;_.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(ze=n.toneMapping);let Ue={shaderID:ee,shaderType:_.type,shaderName:_.name,vertexShader:tt,fragmentShader:Je,defines:_.defines,customVertexShaderID:st,customFragmentShaderID:K,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:u,batching:Se,batchingColor:Se&&B._colorsTexture!==null,instancing:Ge,instancingColor:Ge&&B.instanceColor!==null,instancingMorph:Ge&&B.morphTexture!==null,outputColorSpace:te===null?n.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:it.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:He,matcap:rt,envMap:ie,envMapMode:ie&&re.mapping,envMapCubeUVHeight:Z,aoMap:le,lightMap:ce,bumpMap:W,normalMap:j,displacementMap:Ae,emissiveMap:Ce,normalMapObjectSpace:j&&_.normalMapType===du,normalMapTangentSpace:j&&_.normalMapType===Na,packedNormalMap:j&&_.normalMapType===Na&&Xx(_.normalMap.format),metalnessMap:ke,roughnessMap:Ve,anisotropy:D,anisotropyMap:$,clearcoat:lt,clearcoatMap:de,clearcoatNormalMap:fe,clearcoatRoughnessMap:J,dispersion:$e,retroreflection:T,iridescence:x,iridescenceMap:se,iridescenceThicknessMap:pe,sheen:O,sheenColorMap:Oe,sheenRoughnessMap:ve,specularMap:me,specularColorMap:Be,specularIntensityMap:We,transmission:V,transmissionMap:Ke,thicknessMap:F,gradientMap:ge,opaque:_.transparent===!1&&_.blending===ys&&_.alphaToCoverage===!1,alphaMap:Q,alphaTest:xe,alphaHash:Ee,combine:_.combine,mapUv:He&&g(_.map.channel),aoMapUv:le&&g(_.aoMap.channel),lightMapUv:ce&&g(_.lightMap.channel),bumpMapUv:W&&g(_.bumpMap.channel),normalMapUv:j&&g(_.normalMap.channel),displacementMapUv:Ae&&g(_.displacementMap.channel),emissiveMapUv:Ce&&g(_.emissiveMap.channel),metalnessMapUv:ke&&g(_.metalnessMap.channel),roughnessMapUv:Ve&&g(_.roughnessMap.channel),anisotropyMapUv:$&&g(_.anisotropyMap.channel),clearcoatMapUv:de&&g(_.clearcoatMap.channel),clearcoatNormalMapUv:fe&&g(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:J&&g(_.clearcoatRoughnessMap.channel),iridescenceMapUv:se&&g(_.iridescenceMap.channel),iridescenceThicknessMapUv:pe&&g(_.iridescenceThicknessMap.channel),sheenColorMapUv:Oe&&g(_.sheenColorMap.channel),sheenRoughnessMapUv:ve&&g(_.sheenRoughnessMap.channel),specularMapUv:me&&g(_.specularMap.channel),specularColorMapUv:Be&&g(_.specularColorMap.channel),specularIntensityMapUv:We&&g(_.specularIntensityMap.channel),transmissionMapUv:Ke&&g(_.transmissionMap.channel),thicknessMapUv:F&&g(_.thicknessMap.channel),alphaMapUv:Q&&g(_.alphaMap.channel),vertexTangents:!!z.attributes.tangent&&(j||D),vertexNormals:!!z.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!z.attributes.color&&z.attributes.color.itemSize===4,pointsUvs:B.isPoints===!0&&!!z.attributes.uv&&(He||Q),fog:!!N,useFog:_.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||z.attributes.normal===void 0&&j===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:_e,skinning:B.isSkinnedMesh===!0,hasPositionAttribute:z.attributes.position!==void 0,morphTargets:z.morphAttributes.position!==void 0,morphNormals:z.morphAttributes.normal!==void 0,morphColors:z.morphAttributes.color!==void 0,morphTargetsCount:De,morphTextureStride:Te,numSunLights:w.sun.length,numDirLights:w.directional.length,numPointLights:w.point.length,numSpotLights:w.spot.length,numSpotLightMaps:w.spotLightMap.length,numRectAreaLights:w.rectArea.length,numHemiLights:w.hemi.length,numSunLightShadows:w.sunShadowMap.length,numDirLightShadows:w.directionalShadowMap.length,numPointLightShadows:w.pointShadowMap.length,numSpotLightShadows:w.spotShadowMap.length,numSpotLightShadowsWithMaps:w.numSpotLightShadowsWithMaps,numLightProbes:w.numLightProbes,numLightProbeGrids:G.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&I.length>0,shadowMapType:n.shadowMap.type,toneMapping:ze,decodeVideoTexture:He&&_.map.isVideoTexture===!0&&it.getTransfer(_.map.colorSpace)===dt,decodeVideoTextureEmissive:Ce&&_.emissiveMap.isVideoTexture===!0&&it.getTransfer(_.emissiveMap.colorSpace)===dt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===cn,flipSided:_.side===Ft,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:oe&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(oe&&_.extensions.multiDraw===!0||Se)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Ue.vertexUv1s=l.has(1),Ue.vertexUv2s=l.has(2),Ue.vertexUv3s=l.has(3),l.clear(),Ue}function m(_){let w=[];if(_.shaderID?w.push(_.shaderID):(w.push(_.customVertexShaderID),w.push(_.customFragmentShaderID)),_.defines!==void 0)for(let I in _.defines)w.push(I),w.push(_.defines[I]);return _.isRawShaderMaterial===!1&&(p(w,_),M(w,_),w.push(n.outputColorSpace)),w.push(_.customProgramCacheKey),w.join()}function p(_,w){_.push(w.precision),_.push(w.outputColorSpace),_.push(w.envMapMode),_.push(w.envMapCubeUVHeight),_.push(w.mapUv),_.push(w.alphaMapUv),_.push(w.lightMapUv),_.push(w.aoMapUv),_.push(w.bumpMapUv),_.push(w.normalMapUv),_.push(w.displacementMapUv),_.push(w.emissiveMapUv),_.push(w.metalnessMapUv),_.push(w.roughnessMapUv),_.push(w.anisotropyMapUv),_.push(w.clearcoatMapUv),_.push(w.clearcoatNormalMapUv),_.push(w.clearcoatRoughnessMapUv),_.push(w.iridescenceMapUv),_.push(w.iridescenceThicknessMapUv),_.push(w.sheenColorMapUv),_.push(w.sheenRoughnessMapUv),_.push(w.specularMapUv),_.push(w.specularColorMapUv),_.push(w.specularIntensityMapUv),_.push(w.transmissionMapUv),_.push(w.thicknessMapUv),_.push(w.combine),_.push(w.fogExp2),_.push(w.sizeAttenuation),_.push(w.morphTargetsCount),_.push(w.morphAttributeCount),_.push(w.numSunLights),_.push(w.numDirLights),_.push(w.numPointLights),_.push(w.numSpotLights),_.push(w.numSpotLightMaps),_.push(w.numHemiLights),_.push(w.numRectAreaLights),_.push(w.numSunLightShadows),_.push(w.numDirLightShadows),_.push(w.numPointLightShadows),_.push(w.numSpotLightShadows),_.push(w.numSpotLightShadowsWithMaps),_.push(w.numLightProbes),_.push(w.shadowMapType),_.push(w.toneMapping),_.push(w.numClippingPlanes),_.push(w.numClipIntersection),_.push(w.depthPacking)}function M(_,w){o.disableAll(),w.instancing&&o.enable(0),w.instancingColor&&o.enable(1),w.instancingMorph&&o.enable(2),w.matcap&&o.enable(3),w.envMap&&o.enable(4),w.normalMapObjectSpace&&o.enable(5),w.normalMapTangentSpace&&o.enable(6),w.clearcoat&&o.enable(7),w.iridescence&&o.enable(8),w.alphaTest&&o.enable(9),w.vertexColors&&o.enable(10),w.vertexAlphas&&o.enable(11),w.vertexUv1s&&o.enable(12),w.vertexUv2s&&o.enable(13),w.vertexUv3s&&o.enable(14),w.vertexTangents&&o.enable(15),w.anisotropy&&o.enable(16),w.alphaHash&&o.enable(17),w.batching&&o.enable(18),w.dispersion&&o.enable(19),w.retroreflection&&o.enable(24),w.batchingColor&&o.enable(20),w.gradientMap&&o.enable(21),w.packedNormalMap&&o.enable(22),w.vertexNormals&&o.enable(23),_.push(o.mask),o.disableAll(),w.fog&&o.enable(0),w.useFog&&o.enable(1),w.flatShading&&o.enable(2),w.logarithmicDepthBuffer&&o.enable(3),w.reversedDepthBuffer&&o.enable(4),w.skinning&&o.enable(5),w.morphTargets&&o.enable(6),w.morphNormals&&o.enable(7),w.morphColors&&o.enable(8),w.premultipliedAlpha&&o.enable(9),w.shadowMapEnabled&&o.enable(10),w.doubleSided&&o.enable(11),w.flipSided&&o.enable(12),w.useDepthPacking&&o.enable(13),w.dithering&&o.enable(14),w.transmission&&o.enable(15),w.sheen&&o.enable(16),w.opaque&&o.enable(17),w.pointsUvs&&o.enable(18),w.decodeVideoTexture&&o.enable(19),w.decodeVideoTextureEmissive&&o.enable(20),w.alphaToCoverage&&o.enable(21),w.numLightProbeGrids>0&&o.enable(22),w.hasPositionAttribute&&o.enable(23),_.push(o.mask)}function A(_){let w=f[_.type],I;if(w){let L=Dn[w];I=Iu.clone(L.uniforms)}else I=_.uniforms;return I}function v(_,w){let I=h.get(w);return I!==void 0?++I.usedTimes:(I=new Vx(n,w,_,s),c.push(I),h.set(w,I)),I}function E(_){if(--_.usedTimes===0){let w=c.indexOf(_);c[w]=c[c.length-1],c.pop(),h.delete(_.cacheKey),_.destroy()}}function S(_){a.remove(_)}function C(){a.dispose()}return{getParameters:b,getProgramCacheKey:m,getUniforms:A,acquireProgram:v,releaseProgram:E,releaseShaderCache:S,programs:c,dispose:C}}function Yx(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function s(o,a,l){n.get(o)[a]=l}function r(){n=new WeakMap}return{has:e,get:t,remove:i,update:s,dispose:r}}function Zx(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Ku(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function Ju(){let n=[],e=0,t=[],i=[],s=[];function r(){e=0,t.length=0,i.length=0,s.length=0}function o(u){let f=0;return u.isInstancedMesh&&(f+=2),u.isSkinnedMesh&&(f+=1),f}function a(u,f,g,b,m,p){let M=n[e];return M===void 0?(M={id:u.id,object:u,geometry:f,material:g,materialVariant:o(u),groupOrder:b,renderOrder:u.renderOrder,z:m,group:p},n[e]=M):(M.id=u.id,M.object=u,M.geometry=f,M.material=g,M.materialVariant=o(u),M.groupOrder=b,M.renderOrder=u.renderOrder,M.z=m,M.group=p),e++,M}function l(u,f,g,b,m,p,M){M.reversedDepth===!0&&(m=-m);let A=a(u,f,g,b,m,p);g.transmission>0?i.push(A):g.transparent===!0?s.push(A):t.push(A)}function c(u,f,g,b,m,p){let M=a(u,f,g,b,m,p);g.transmission>0?i.unshift(M):g.transparent===!0?s.unshift(M):t.unshift(M)}function h(u,f){t.length>1&&t.sort(u||Zx),i.length>1&&i.sort(f||Ku),s.length>1&&s.sort(f||Ku)}function d(){for(let u=e,f=n.length;u<f;u++){let g=n[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:t,transmissive:i,transparent:s,init:r,push:l,unshift:c,finish:d,sort:h}}function $x(){let n=new WeakMap;function e(i,s){let r=n.get(i),o;return r===void 0?(o=new Ju,n.set(i,[o])):s>=r.length?(o=new Ju,r.push(o)):o=r[s],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function Kx(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new P,color:new Le};break;case"SpotLight":t={position:new P,direction:new P,color:new Le,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new P,color:new Le,distance:0,decay:0};break;case"HemisphereLight":t={direction:new P,skyColor:new Le,groundColor:new Le};break;case"RectAreaLight":t={color:new Le,position:new P,halfWidth:new P,halfHeight:new P};break}return n[e.id]=t,t}}}function Jx(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ue,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var jx=0;function Qx(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function e_(n){let e=new Kx,t=Jx(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let c=0;c<9;c++)i.probe.push(new P);let s=new P,r=new vt,o=new vt;function a(c){let h=0,d=0,u=0;for(let B=0;B<9;B++)i.probe[B].set(0,0,0);let f=0,g=0,b=0,m=0,p=0,M=0,A=0,v=0,E=0,S=0,C=0,_=0,w=0,I=0;c.sort(Qx);for(let B=0,G=c.length;B<G;B++){let N=c[B],z=N.color,X=N.intensity,Y=N.distance,re=null;if(N.shadow&&N.shadow.map&&(N.shadow.map.texture.format===di?re=N.shadow.map.texture:re=N.shadow.map.depthTexture||N.shadow.map.texture),N.isAmbientLight)h+=z.r*X,d+=z.g*X,u+=z.b*X;else if(N.isLightProbe){for(let Z=0;Z<9;Z++)i.probe[Z].addScaledVector(N.sh.coefficients[Z],X);I++}else if(N.isSunLight){let Z=e.get(N);if(Z.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let ee=N.shadow,ne=t.get(N);ne.shadowIntensity=ee.intensity,ne.shadowBias=ee.bias,ne.shadowNormalBias=ee.normalBias,ne.shadowRadius=ee.radius,ne.shadowMapSize.copy(ee.mapSize).multiply(ee.getFrameExtents()),i.sunShadow[g]=ne,i.sunShadowMap[g]=re;let De=ee.getViewportCount();for(let Te=0;Te<De;Te++)i.sunShadowMatrix[b+Te]=ee.getMatrix(Te),i.sunShadowCascade[b+Te]=ee._cascadeData[Te];b+=De,g++}i.sun[f]=Z,f++}else if(N.isDirectionalLight){let Z=e.get(N);if(Z.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let ee=N.shadow,ne=t.get(N);ne.shadowIntensity=ee.intensity,ne.shadowBias=ee.bias,ne.shadowNormalBias=ee.normalBias,ne.shadowRadius=ee.radius,ne.shadowMapSize=ee.mapSize,i.directionalShadow[m]=ne,i.directionalShadowMap[m]=re,i.directionalShadowMatrix[m]=N.shadow.matrix,E++}i.directional[m]=Z,m++}else if(N.isSpotLight){let Z=e.get(N);Z.position.setFromMatrixPosition(N.matrixWorld),Z.color.copy(z).multiplyScalar(X),Z.distance=Y,Z.coneCos=Math.cos(N.angle),Z.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),Z.decay=N.decay,i.spot[M]=Z;let ee=N.shadow;if(N.map&&(i.spotLightMap[_]=N.map,_++,ee.updateMatrices(N),N.castShadow&&w++),i.spotLightMatrix[M]=ee.matrix,N.castShadow){let ne=t.get(N);ne.shadowIntensity=ee.intensity,ne.shadowBias=ee.bias,ne.shadowNormalBias=ee.normalBias,ne.shadowRadius=ee.radius,ne.shadowMapSize=ee.mapSize,i.spotShadow[M]=ne,i.spotShadowMap[M]=re,C++}M++}else if(N.isRectAreaLight){let Z=e.get(N);Z.color.copy(z).multiplyScalar(X),Z.halfWidth.set(N.width*.5,0,0),Z.halfHeight.set(0,N.height*.5,0),i.rectArea[A]=Z,A++}else if(N.isPointLight){let Z=e.get(N);if(Z.color.copy(N.color).multiplyScalar(N.intensity),Z.distance=N.distance,Z.decay=N.decay,N.castShadow){let ee=N.shadow,ne=t.get(N);ne.shadowIntensity=ee.intensity,ne.shadowBias=ee.bias,ne.shadowNormalBias=ee.normalBias,ne.shadowRadius=ee.radius,ne.shadowMapSize=ee.mapSize,ne.shadowCameraNear=ee.camera.near,ne.shadowCameraFar=ee.camera.far,i.pointShadow[p]=ne,i.pointShadowMap[p]=re,i.pointShadowMatrix[p]=N.shadow.matrix,S++}i.point[p]=Z,p++}else if(N.isHemisphereLight){let Z=e.get(N);Z.skyColor.copy(N.color).multiplyScalar(X),Z.groundColor.copy(N.groundColor).multiplyScalar(X),i.hemi[v]=Z,v++}}A>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=ye.LTC_FLOAT_1,i.rectAreaLTC2=ye.LTC_FLOAT_2):(i.rectAreaLTC1=ye.LTC_HALF_1,i.rectAreaLTC2=ye.LTC_HALF_2)),i.ambient[0]=h,i.ambient[1]=d,i.ambient[2]=u;let L=i.hash;(L.sunLength!==f||L.directionalLength!==m||L.pointLength!==p||L.spotLength!==M||L.rectAreaLength!==A||L.hemiLength!==v||L.numSunShadows!==g||L.numDirectionalShadows!==E||L.numPointShadows!==S||L.numSpotShadows!==C||L.numSpotMaps!==_||L.numLightProbes!==I)&&(i.sun.length=f,i.directional.length=m,i.spot.length=M,i.rectArea.length=A,i.point.length=p,i.hemi.length=v,i.sunShadow.length=g,i.sunShadowMap.length=g,i.sunShadowMatrix.length=b,i.sunShadowCascade.length=b,i.directionalShadow.length=E,i.directionalShadowMap.length=E,i.directionalShadowMatrix.length=E,i.pointShadow.length=S,i.pointShadowMap.length=S,i.pointShadowMatrix.length=S,i.spotShadow.length=C,i.spotShadowMap.length=C,i.spotLightMatrix.length=C+_-w,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=w,i.numLightProbes=I,L.sunLength=f,L.directionalLength=m,L.pointLength=p,L.spotLength=M,L.rectAreaLength=A,L.hemiLength=v,L.numSunShadows=g,L.numDirectionalShadows=E,L.numPointShadows=S,L.numSpotShadows=C,L.numSpotMaps=_,L.numLightProbes=I,i.version=jx++)}function l(c,h){let d=0,u=0,f=0,g=0,b=0,m=0,p=h.matrixWorldInverse;for(let M=0,A=c.length;M<A;M++){let v=c[M];if(v.isSunLight){let E=i.sun[d];E.direction.setFromMatrixPosition(v.matrixWorld),E.direction.transformDirection(p),d++}else if(v.isDirectionalLight){let E=i.directional[u];E.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(p),u++}else if(v.isSpotLight){let E=i.spot[g];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(p),E.direction.setFromMatrixPosition(v.matrixWorld),s.setFromMatrixPosition(v.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(p),g++}else if(v.isRectAreaLight){let E=i.rectArea[b];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(p),o.identity(),r.copy(v.matrixWorld),r.premultiply(p),o.extractRotation(r),E.halfWidth.set(v.width*.5,0,0),E.halfHeight.set(0,v.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),b++}else if(v.isPointLight){let E=i.point[f];E.position.setFromMatrixPosition(v.matrixWorld),E.position.applyMatrix4(p),f++}else if(v.isHemisphereLight){let E=i.hemi[m];E.direction.setFromMatrixPosition(v.matrixWorld),E.direction.transformDirection(p),m++}}}return{setup:a,setupView:l,state:i}}function ju(n){let e=new e_(n),t=[],i=[],s=[];function r(u){d.camera=u,t.length=0,i.length=0,s.length=0}function o(u){t.push(u)}function a(u){i.push(u)}function l(u){s.push(u)}function c(){e.setup(t)}function h(u){e.setupView(t,u)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:s,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:c,setupLightsView:h,pushLight:o,pushShadow:a,pushLightProbeGrid:l}}function t_(n){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new ju(n),e.set(s,[a])):r>=o.length?(a=new ju(n),o.push(a)):a=o[r],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var n_=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,i_=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,s_=[new P(1,0,0),new P(-1,0,0),new P(0,1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1)],r_=[new P(0,-1,0),new P(0,-1,0),new P(0,0,1),new P(0,0,-1),new P(0,-1,0),new P(0,-1,0)],Qu=new vt,Ir=new P,Rc=new P;function o_(n,e,t){let i=new ps,s=new ue,r=new ue,o=new St,a=new No,l=new Uo,c={},h=t.maxTextureSize,d={[li]:Ft,[Ft]:li,[cn]:cn},u=new Vt({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ue},radius:{value:4}},vertexShader:n_,fragmentShader:i_}),f=u.clone();f.defines.HORIZONTAL_PASS=1;let g=new Ct;g.setAttribute("position",new kt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new Ye(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=vr;let p=this.type;this.render=function(S,C,_){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||S.length===0)return;this.type===Vh&&(Xe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=vr);let w=n.getRenderTarget(),I=n.getActiveCubeFace(),L=n.getActiveMipmapLevel(),B=n.state;B.setBlending(In),B.buffers.depth.getReversed()===!0?B.buffers.color.setClear(0,0,0,0):B.buffers.color.setClear(1,1,1,1),B.buffers.depth.setTest(!0),B.setScissorTest(!1);let G=p!==this.type;G&&C.traverse(function(N){N.material&&(Array.isArray(N.material)?N.material.forEach(z=>z.needsUpdate=!0):N.material.needsUpdate=!0)});for(let N=0,z=S.length;N<z;N++){let X=S[N],Y=X.shadow;if(Y===void 0){Xe("WebGLShadowMap:",X,"has no shadow.");continue}if(Y.autoUpdate===!1&&Y.needsUpdate===!1)continue;s.copy(Y.mapSize);let re=Y.getFrameExtents();s.multiply(re),r.copy(Y.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/re.x),s.x=r.x*re.x,Y.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/re.y),s.y=r.y*re.y,Y.mapSize.y=r.y));let Z=n.state.buffers.depth.getReversed();if(Y.camera._reversedDepth=Z,Y.map===null||G===!0){if(Y.map!==null&&(Y.map.depthTexture!==null&&(Y.map.depthTexture.dispose(),Y.map.depthTexture=null),Y.map.dispose()),this.type===vs){if(X.isPointLight){Xe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Y.map=new Ht(s.x,s.y,{format:di,type:bn,minFilter:Ut,magFilter:Ut,generateMipmaps:!1}),Y.map.texture.name=X.name+".shadowMap",Y.map.depthTexture=new ei(s.x,s.y,yn),Y.map.depthTexture.name=X.name+".shadowMapDepth",Y.map.depthTexture.format=An,Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=Mt,Y.map.depthTexture.magFilter=Mt}else X.isPointLight?(Y.map=new ka(s.x),Y.map.depthTexture=new To(s.x,vn)):(Y.map=new Ht(s.x,s.y),Y.map.depthTexture=new ei(s.x,s.y,vn)),Y.map.depthTexture.name=X.name+".shadowMap",Y.map.depthTexture.format=An,this.type===vr?(Y.map.depthTexture.compareFunction=Z?Fa:Ua,Y.map.depthTexture.minFilter=Ut,Y.map.depthTexture.magFilter=Ut):(Y.map.depthTexture.compareFunction=null,Y.map.depthTexture.minFilter=Mt,Y.map.depthTexture.magFilter=Mt);Y.camera.updateProjectionMatrix()}Y.map.isWebGLCubeRenderTarget!==!0&&(Y.map.width!==s.x||Y.map.height!==s.y)&&Y.map.setSize(s.x,s.y);let ee=Y.map.isWebGLCubeRenderTarget?6:Y.getViewportCount();X.isPointLight!==!0&&Y.updateMatrices(X,_);for(let ne=0;ne<ee;ne++){let De=Y.getCamera(ne);if(X.isPointLight){let Te=Y.camera,tt=Y.matrix,Je=X.distance||Te.far;Je!==Te.far&&(Te.far=Je,Te.updateProjectionMatrix()),Ir.setFromMatrixPosition(X.matrixWorld),Te.position.copy(Ir),Rc.copy(Te.position),Rc.add(s_[ne]),Te.up.copy(r_[ne]),Te.lookAt(Rc),Te.updateMatrixWorld(),tt.makeTranslation(-Ir.x,-Ir.y,-Ir.z),Qu.multiplyMatrices(Te.projectionMatrix,Te.matrixWorldInverse),Y._frustum.setFromProjectionMatrix(Qu,Te.coordinateSystem,Te.reversedDepth)}if(Y.map.isWebGLCubeRenderTarget)n.setRenderTarget(Y.map,ne),n.clear();else{ne===0&&(n.setRenderTarget(Y.map),n.clear());let Te=Y.getViewport(ne);o.set(r.x*Te.x,r.y*Te.y,r.x*Te.z,r.y*Te.w),B.viewport(o)}i=Y.getFrustum(ne),v(C,_,De,X,this.type)}Y.isPointLightShadow!==!0&&this.type===vs&&M(Y,_),Y.needsUpdate=!1}p=this.type,m.needsUpdate=!1,n.setRenderTarget(w,I,L)};function M(S,C){let _=e.update(b);u.defines.VSM_SAMPLES!==S.blurSamples&&(u.defines.VSM_SAMPLES=S.blurSamples,f.defines.VSM_SAMPLES=S.blurSamples,u.needsUpdate=!0,f.needsUpdate=!0),S.mapPass===null?S.mapPass=new Ht(s.x,s.y,{format:di,type:bn}):(S.mapPass.width!==S.map.width||S.mapPass.height!==S.map.height)&&S.mapPass.setSize(S.map.width,S.map.height),u.uniforms.shadow_pass.value=S.map.depthTexture,u.uniforms.resolution.value.set(S.map.width,S.map.height),u.uniforms.radius.value=S.radius,n.setRenderTarget(S.mapPass),n.clear(),n.renderBufferDirect(C,null,_,u,b,null),f.uniforms.shadow_pass.value=S.mapPass.texture,f.uniforms.resolution.value.set(S.map.width,S.map.height),f.uniforms.radius.value=S.radius,n.setRenderTarget(S.map),n.clear(),n.renderBufferDirect(C,null,_,f,b,null)}function A(S,C,_,w){let I=null,L=_.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(L!==void 0)I=L;else if(I=_.isPointLight===!0?l:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let B=I.uuid,G=C.uuid,N=c[B];N===void 0&&(N={},c[B]=N);let z=N[G];z===void 0&&(z=I.clone(),N[G]=z,C.addEventListener("dispose",E)),I=z}if(I.visible=C.visible,I.wireframe=C.wireframe,w===vs?I.side=C.shadowSide!==null?C.shadowSide:C.side:I.side=C.shadowSide!==null?C.shadowSide:d[C.side],I.alphaMap=C.alphaMap,I.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,I.map=C.map,I.clipShadows=C.clipShadows,I.clippingPlanes=C.clippingPlanes,I.clipIntersection=C.clipIntersection,I.displacementMap=C.displacementMap,I.displacementScale=C.displacementScale,I.displacementBias=C.displacementBias,I.wireframeLinewidth=C.wireframeLinewidth,I.linewidth=C.linewidth,_.isPointLight===!0&&I.isMeshDistanceMaterial===!0){let B=n.properties.get(I);B.light=_}return I}function v(S,C,_,w,I){if(S.visible===!1)return;if(S.layers.test(C.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&I===vs)&&(!S.frustumCulled||S.intersectsFrustum(i))){S.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,S.matrixWorld);let G=e.update(S),N=S.material;if(Array.isArray(N)){let z=G.groups;for(let X=0,Y=z.length;X<Y;X++){let re=z[X],Z=N[re.materialIndex];if(Z&&Z.visible){let ee=A(S,Z,w,I);S.onBeforeShadow(n,S,C,_,G,ee,re),n.renderBufferDirect(_,null,G,ee,S,re),S.onAfterShadow(n,S,C,_,G,ee,re)}}}else if(N.visible){let z=A(S,N,w,I);S.onBeforeShadow(n,S,C,_,G,z,null),n.renderBufferDirect(_,null,G,z,S,null),S.onAfterShadow(n,S,C,_,G,z,null)}}let B=S.children;for(let G=0,N=B.length;G<N;G++)v(B[G],C,_,w,I)}function E(S){S.target.removeEventListener("dispose",E);for(let _ in c){let w=c[_],I=S.target.uuid;I in w&&(w[I].dispose(),delete w[I])}}}function a_(n,e){function t(){let F=!1,ge=new St,Q=null,xe=new St(0,0,0,0);return{setMask:function(Ee){Q!==Ee&&!F&&(n.colorMask(Ee,Ee,Ee,Ee),Q=Ee)},setLocked:function(Ee){F=Ee},setClear:function(Ee,oe,ze,Ue,xt){xt===!0&&(Ee*=Ue,oe*=Ue,ze*=Ue),ge.set(Ee,oe,ze,Ue),xe.equals(ge)===!1&&(n.clearColor(Ee,oe,ze,Ue),xe.copy(ge))},reset:function(){F=!1,Q=null,xe.set(-1,0,0,0)}}}function i(){let F=!1,ge=!1,Q=null,xe=null,Ee=null;return{setReversed:function(oe){if(ge!==oe){let ze=e.get("EXT_clip_control");oe?ze.clipControlEXT(ze.LOWER_LEFT_EXT,ze.ZERO_TO_ONE_EXT):ze.clipControlEXT(ze.LOWER_LEFT_EXT,ze.NEGATIVE_ONE_TO_ONE_EXT),ge=oe;let Ue=Ee;Ee=null,this.setClear(Ue)}},getReversed:function(){return ge},setTest:function(oe){oe?te(n.DEPTH_TEST):_e(n.DEPTH_TEST)},setMask:function(oe){Q!==oe&&!F&&(n.depthMask(oe),Q=oe)},setFunc:function(oe){if(ge&&(oe=Eu[oe]),xe!==oe){switch(oe){case uo:n.depthFunc(n.NEVER);break;case fo:n.depthFunc(n.ALWAYS);break;case po:n.depthFunc(n.LESS);break;case os:n.depthFunc(n.LEQUAL);break;case mo:n.depthFunc(n.EQUAL);break;case go:n.depthFunc(n.GEQUAL);break;case xo:n.depthFunc(n.GREATER);break;case _o:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}xe=oe}},setLocked:function(oe){F=oe},setClear:function(oe){Ee!==oe&&(Ee=oe,ge&&(oe=1-oe),n.clearDepth(oe))},reset:function(){F=!1,Q=null,xe=null,Ee=null,ge=!1}}}function s(){let F=!1,ge=null,Q=null,xe=null,Ee=null,oe=null,ze=null,Ue=null,xt=null;return{setTest:function(ht){F||(ht?te(n.STENCIL_TEST):_e(n.STENCIL_TEST))},setMask:function(ht){ge!==ht&&!F&&(n.stencilMask(ht),ge=ht)},setFunc:function(ht,un,Sn){(Q!==ht||xe!==un||Ee!==Sn)&&(n.stencilFunc(ht,un,Sn),Q=ht,xe=un,Ee=Sn)},setOp:function(ht,un,Sn){(oe!==ht||ze!==un||Ue!==Sn)&&(n.stencilOp(ht,un,Sn),oe=ht,ze=un,Ue=Sn)},setLocked:function(ht){F=ht},setClear:function(ht){xt!==ht&&(n.clearStencil(ht),xt=ht)},reset:function(){F=!1,ge=null,Q=null,xe=null,Ee=null,oe=null,ze=null,Ue=null,xt=null}}}let r=new t,o=new i,a=new s,l=new WeakMap,c=new WeakMap,h={},d={},u={},f=new WeakMap,g=[],b=null,m=!1,p=null,M=null,A=null,v=null,E=null,S=null,C=null,_=new Le(0,0,0),w=0,I=!1,L=null,B=null,G=null,N=null,z=null,X=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Y=!1,re=0,Z=n.getParameter(n.VERSION);Z.indexOf("WebGL")!==-1?(re=parseFloat(/^WebGL (\d)/.exec(Z)[1]),Y=re>=1):Z.indexOf("OpenGL ES")!==-1&&(re=parseFloat(/^OpenGL ES (\d)/.exec(Z)[1]),Y=re>=2);let ee=null,ne={},De=n.getParameter(n.SCISSOR_BOX),Te=n.getParameter(n.VIEWPORT),tt=new St().fromArray(De),Je=new St().fromArray(Te);function st(F,ge,Q,xe){let Ee=new Uint8Array(4),oe=n.createTexture();n.bindTexture(F,oe),n.texParameteri(F,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(F,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let ze=0;ze<Q;ze++)F===n.TEXTURE_3D||F===n.TEXTURE_2D_ARRAY?n.texImage3D(ge,0,n.RGBA,1,1,xe,0,n.RGBA,n.UNSIGNED_BYTE,Ee):n.texImage2D(ge+ze,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ee);return oe}let K={};K[n.TEXTURE_2D]=st(n.TEXTURE_2D,n.TEXTURE_2D,1),K[n.TEXTURE_CUBE_MAP]=st(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),K[n.TEXTURE_2D_ARRAY]=st(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),K[n.TEXTURE_3D]=st(n.TEXTURE_3D,n.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),te(n.DEPTH_TEST),o.setFunc(os),W(!1),j(Zl),te(n.CULL_FACE),le(In);function te(F){h[F]!==!0&&(n.enable(F),h[F]=!0)}function _e(F){h[F]!==!1&&(n.disable(F),h[F]=!1)}function Ge(F,ge){return u[F]!==ge?(n.bindFramebuffer(F,ge),u[F]=ge,F===n.DRAW_FRAMEBUFFER&&(u[n.FRAMEBUFFER]=ge),F===n.FRAMEBUFFER&&(u[n.DRAW_FRAMEBUFFER]=ge),!0):!1}function Se(F,ge){let Q=g,xe=!1;if(F){Q=f.get(ge),Q===void 0&&(Q=[],f.set(ge,Q));let Ee=F.textures;if(Q.length!==Ee.length||Q[0]!==n.COLOR_ATTACHMENT0){for(let oe=0,ze=Ee.length;oe<ze;oe++)Q[oe]=n.COLOR_ATTACHMENT0+oe;Q.length=Ee.length,xe=!0}}else Q[0]!==n.BACK&&(Q[0]=n.BACK,xe=!0);xe&&n.drawBuffers(Q)}function He(F){return b!==F?(n.useProgram(F),b=F,!0):!1}let rt={[Ii]:n.FUNC_ADD,[Xh]:n.FUNC_SUBTRACT,[qh]:n.FUNC_REVERSE_SUBTRACT};rt[Yh]=n.MIN,rt[Zh]=n.MAX;let ie={[$h]:n.ZERO,[Kh]:n.ONE,[Jh]:n.SRC_COLOR,[jl]:n.SRC_ALPHA,[iu]:n.SRC_ALPHA_SATURATE,[tu]:n.DST_COLOR,[Qh]:n.DST_ALPHA,[jh]:n.ONE_MINUS_SRC_COLOR,[Ql]:n.ONE_MINUS_SRC_ALPHA,[nu]:n.ONE_MINUS_DST_COLOR,[eu]:n.ONE_MINUS_DST_ALPHA,[su]:n.CONSTANT_COLOR,[ru]:n.ONE_MINUS_CONSTANT_COLOR,[ou]:n.CONSTANT_ALPHA,[au]:n.ONE_MINUS_CONSTANT_ALPHA};function le(F,ge,Q,xe,Ee,oe,ze,Ue,xt,ht){if(F===In){m===!0&&(_e(n.BLEND),m=!1);return}if(m===!1&&(te(n.BLEND),m=!0),F!==Wh){if(F!==p||ht!==I){if((M!==Ii||E!==Ii)&&(n.blendEquation(n.FUNC_ADD),M=Ii,E=Ii),ht)switch(F){case ys:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case $l:n.blendFunc(n.ONE,n.ONE);break;case Kl:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Jl:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:qe("WebGLState: Invalid blending: ",F);break}else switch(F){case ys:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case $l:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Kl:qe("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Jl:qe("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:qe("WebGLState: Invalid blending: ",F);break}A=null,v=null,S=null,C=null,_.set(0,0,0),w=0,p=F,I=ht}return}Ee=Ee||ge,oe=oe||Q,ze=ze||xe,(ge!==M||Ee!==E)&&(n.blendEquationSeparate(rt[ge],rt[Ee]),M=ge,E=Ee),(Q!==A||xe!==v||oe!==S||ze!==C)&&(n.blendFuncSeparate(ie[Q],ie[xe],ie[oe],ie[ze]),A=Q,v=xe,S=oe,C=ze),(Ue.equals(_)===!1||xt!==w)&&(n.blendColor(Ue.r,Ue.g,Ue.b,xt),_.copy(Ue),w=xt),p=F,I=!1}function ce(F,ge){F.side===cn?_e(n.CULL_FACE):te(n.CULL_FACE);let Q=F.side===Ft;ge&&(Q=!Q),W(Q),F.blending===ys&&F.transparent===!1?le(In):le(F.blending,F.blendEquation,F.blendSrc,F.blendDst,F.blendEquationAlpha,F.blendSrcAlpha,F.blendDstAlpha,F.blendColor,F.blendAlpha,F.premultipliedAlpha),o.setFunc(F.depthFunc),o.setTest(F.depthTest),o.setMask(F.depthWrite),r.setMask(F.colorWrite);let xe=F.stencilWrite;a.setTest(xe),xe&&(a.setMask(F.stencilWriteMask),a.setFunc(F.stencilFunc,F.stencilRef,F.stencilFuncMask),a.setOp(F.stencilFail,F.stencilZFail,F.stencilZPass)),Ce(F.polygonOffset,F.polygonOffsetFactor,F.polygonOffsetUnits),F.alphaToCoverage===!0?te(n.SAMPLE_ALPHA_TO_COVERAGE):_e(n.SAMPLE_ALPHA_TO_COVERAGE)}function W(F){L!==F&&(F?n.frontFace(n.CW):n.frontFace(n.CCW),L=F)}function j(F){F!==Hh?(te(n.CULL_FACE),F!==B&&(F===Zl?n.cullFace(n.BACK):F===Gh?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):_e(n.CULL_FACE),B=F}function Ae(F){F!==G&&(Y&&n.lineWidth(F),G=F)}function Ce(F,ge,Q){F?(te(n.POLYGON_OFFSET_FILL),(N!==ge||z!==Q)&&(N=ge,z=Q,o.getReversed()&&(ge=-ge),n.polygonOffset(ge,Q))):_e(n.POLYGON_OFFSET_FILL)}function ke(F){F?te(n.SCISSOR_TEST):_e(n.SCISSOR_TEST)}function Ve(F){F===void 0&&(F=n.TEXTURE0+X-1),ee!==F&&(n.activeTexture(F),ee=F)}function D(F,ge,Q){Q===void 0&&(ee===null?Q=n.TEXTURE0+X-1:Q=ee);let xe=ne[Q];xe===void 0&&(xe={type:void 0,texture:void 0},ne[Q]=xe),(xe.type!==F||xe.texture!==ge)&&(ee!==Q&&(n.activeTexture(Q),ee=Q),n.bindTexture(F,ge||K[F]),xe.type=F,xe.texture=ge)}function lt(){let F=ne[ee];F!==void 0&&F.type!==void 0&&(n.bindTexture(F.type,null),F.type=void 0,F.texture=void 0)}function $e(){try{n.compressedTexImage2D(...arguments)}catch(F){qe("WebGLState:",F)}}function T(){try{n.compressedTexImage3D(...arguments)}catch(F){qe("WebGLState:",F)}}function x(){try{n.texSubImage2D(...arguments)}catch(F){qe("WebGLState:",F)}}function O(){try{n.texSubImage3D(...arguments)}catch(F){qe("WebGLState:",F)}}function V(){try{n.compressedTexSubImage2D(...arguments)}catch(F){qe("WebGLState:",F)}}function $(){try{n.compressedTexSubImage3D(...arguments)}catch(F){qe("WebGLState:",F)}}function de(){try{n.texStorage2D(...arguments)}catch(F){qe("WebGLState:",F)}}function fe(){try{n.texStorage3D(...arguments)}catch(F){qe("WebGLState:",F)}}function J(){try{n.texImage2D(...arguments)}catch(F){qe("WebGLState:",F)}}function se(){try{n.texImage3D(...arguments)}catch(F){qe("WebGLState:",F)}}function pe(F){return d[F]!==void 0?d[F]:n.getParameter(F)}function Oe(F,ge){d[F]!==ge&&(n.pixelStorei(F,ge),d[F]=ge)}function ve(F){tt.equals(F)===!1&&(n.scissor(F.x,F.y,F.z,F.w),tt.copy(F))}function me(F){Je.equals(F)===!1&&(n.viewport(F.x,F.y,F.z,F.w),Je.copy(F))}function Be(F,ge){let Q=c.get(ge);Q===void 0&&(Q=new WeakMap,c.set(ge,Q));let xe=Q.get(F);xe===void 0&&(xe=n.getUniformBlockIndex(ge,F.name),Q.set(F,xe))}function We(F,ge){let xe=c.get(ge).get(F);l.get(ge)!==xe&&(n.uniformBlockBinding(ge,xe,F.__bindingPointIndex),l.set(ge,xe))}function Ke(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),h={},d={},ee=null,ne={},u={},f=new WeakMap,g=[],b=null,m=!1,p=null,M=null,A=null,v=null,E=null,S=null,C=null,_=new Le(0,0,0),w=0,I=!1,L=null,B=null,G=null,N=null,z=null,tt.set(0,0,n.canvas.width,n.canvas.height),Je.set(0,0,n.canvas.width,n.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:te,disable:_e,bindFramebuffer:Ge,drawBuffers:Se,useProgram:He,setBlending:le,setMaterial:ce,setFlipSided:W,setCullFace:j,setLineWidth:Ae,setPolygonOffset:Ce,setScissorTest:ke,activeTexture:Ve,bindTexture:D,unbindTexture:lt,compressedTexImage2D:$e,compressedTexImage3D:T,texImage2D:J,texImage3D:se,pixelStorei:Oe,getParameter:pe,updateUBOMapping:Be,uniformBlockBinding:We,texStorage2D:de,texStorage3D:fe,texSubImage2D:x,texSubImage3D:O,compressedTexSubImage2D:V,compressedTexSubImage3D:$,scissor:ve,viewport:me,reset:Ke}}function l_(n,e,t,i,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,l=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new ue,h=new WeakMap,d=new Set,u,f=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(T,x){return g?new OffscreenCanvas(T,x):Zs("canvas")}function m(T,x,O){let V=1,$=$e(T);if(($.width>O||$.height>O)&&(V=O/Math.max($.width,$.height)),V<1)if(typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&T instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&T instanceof ImageBitmap||typeof VideoFrame<"u"&&T instanceof VideoFrame){let de=Math.floor(V*$.width),fe=Math.floor(V*$.height);u===void 0&&(u=b(de,fe));let J=x?b(de,fe):u;return J.width=de,J.height=fe,J.getContext("2d").drawImage(T,0,0,de,fe),Xe("WebGLRenderer: Texture has been resized from ("+$.width+"x"+$.height+") to ("+de+"x"+fe+")."),J}else return"data"in T&&Xe("WebGLRenderer: Image in DataTexture is too big ("+$.width+"x"+$.height+")."),T;return T}function p(T){return T.generateMipmaps}function M(T){n.generateMipmap(T)}function A(T){return T.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:T.isWebGL3DRenderTarget?n.TEXTURE_3D:T.isWebGLArrayRenderTarget||T.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(T,x,O,V,$,de=!1){if(T!==null){if(n[T]!==void 0)return n[T];Xe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+T+"'")}let fe;V&&(fe=e.get("EXT_texture_norm16"),fe||Xe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let J=x;if(x===n.RED&&(O===n.FLOAT&&(J=n.R32F),O===n.HALF_FLOAT&&(J=n.R16F),O===n.UNSIGNED_BYTE&&(J=n.R8),O===n.UNSIGNED_SHORT&&fe&&(J=fe.R16_EXT),O===n.SHORT&&fe&&(J=fe.R16_SNORM_EXT)),x===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.R8UI),O===n.UNSIGNED_SHORT&&(J=n.R16UI),O===n.UNSIGNED_INT&&(J=n.R32UI),O===n.BYTE&&(J=n.R8I),O===n.SHORT&&(J=n.R16I),O===n.INT&&(J=n.R32I)),x===n.RG&&(O===n.FLOAT&&(J=n.RG32F),O===n.HALF_FLOAT&&(J=n.RG16F),O===n.UNSIGNED_BYTE&&(J=n.RG8),O===n.UNSIGNED_SHORT&&fe&&(J=fe.RG16_EXT),O===n.SHORT&&fe&&(J=fe.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RG8UI),O===n.UNSIGNED_SHORT&&(J=n.RG16UI),O===n.UNSIGNED_INT&&(J=n.RG32UI),O===n.BYTE&&(J=n.RG8I),O===n.SHORT&&(J=n.RG16I),O===n.INT&&(J=n.RG32I)),x===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RGB8UI),O===n.UNSIGNED_SHORT&&(J=n.RGB16UI),O===n.UNSIGNED_INT&&(J=n.RGB32UI),O===n.BYTE&&(J=n.RGB8I),O===n.SHORT&&(J=n.RGB16I),O===n.INT&&(J=n.RGB32I)),x===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(J=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(J=n.RGBA16UI),O===n.UNSIGNED_INT&&(J=n.RGBA32UI),O===n.BYTE&&(J=n.RGBA8I),O===n.SHORT&&(J=n.RGBA16I),O===n.INT&&(J=n.RGBA32I)),x===n.RGB&&(O===n.UNSIGNED_SHORT&&fe&&(J=fe.RGB16_EXT),O===n.SHORT&&fe&&(J=fe.RGB16_SNORM_EXT),O===n.UNSIGNED_INT_5_9_9_9_REV&&(J=n.RGB9_E5),O===n.UNSIGNED_INT_10F_11F_11F_REV&&(J=n.R11F_G11F_B10F)),x===n.RGBA){let se=de?Ys:it.getTransfer($);O===n.FLOAT&&(J=n.RGBA32F),O===n.HALF_FLOAT&&(J=n.RGBA16F),O===n.UNSIGNED_BYTE&&(J=se===dt?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT&&fe&&(J=fe.RGBA16_EXT),O===n.SHORT&&fe&&(J=fe.RGBA16_SNORM_EXT),O===n.UNSIGNED_SHORT_4_4_4_4&&(J=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(J=n.RGB5_A1)}return(J===n.R16F||J===n.R32F||J===n.RG16F||J===n.RG32F||J===n.RGBA16F||J===n.RGBA32F)&&e.get("EXT_color_buffer_float"),J}function E(T,x){let O;return T?x===null||x===vn||x===Ms?O=n.DEPTH24_STENCIL8:x===yn?O=n.DEPTH32F_STENCIL8:x===bs&&(O=n.DEPTH24_STENCIL8,Xe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===vn||x===Ms?O=n.DEPTH_COMPONENT24:x===yn?O=n.DEPTH_COMPONENT32F:x===bs&&(O=n.DEPTH_COMPONENT16),O}function S(T,x){return p(T)===!0||T.isFramebufferTexture&&T.minFilter!==Mt&&T.minFilter!==Ut?Math.log2(Math.max(x.width,x.height))+1:T.mipmaps!==void 0&&T.mipmaps.length>0?T.mipmaps.length:T.isCompressedTexture&&Array.isArray(T.image)?x.mipmaps.length:1}function C(T){let x=T.target;x.removeEventListener("dispose",C),w(x),x.isVideoTexture&&h.delete(x),x.isHTMLTexture&&d.delete(x)}function _(T){let x=T.target;x.removeEventListener("dispose",_),L(x)}function w(T){let x=i.get(T);if(x.__webglInit===void 0)return;let O=T.source,V=f.get(O);if(V){let $=V[x.__cacheKey];$.usedTimes--,$.usedTimes===0&&I(T),Object.keys(V).length===0&&f.delete(O)}i.remove(T)}function I(T){let x=i.get(T);n.deleteTexture(x.__webglTexture);let O=T.source,V=f.get(O);delete V[x.__cacheKey],o.memory.textures--}function L(T){let x=i.get(T);if(T.depthTexture&&(T.depthTexture.dispose(),i.remove(T.depthTexture)),T.isWebGLCubeRenderTarget)for(let V=0;V<6;V++){if(Array.isArray(x.__webglFramebuffer[V]))for(let $=0;$<x.__webglFramebuffer[V].length;$++)n.deleteFramebuffer(x.__webglFramebuffer[V][$]);else n.deleteFramebuffer(x.__webglFramebuffer[V]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[V])}else{if(Array.isArray(x.__webglFramebuffer))for(let V=0;V<x.__webglFramebuffer.length;V++)n.deleteFramebuffer(x.__webglFramebuffer[V]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let V=0;V<x.__webglColorRenderbuffer.length;V++)x.__webglColorRenderbuffer[V]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[V]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let O=T.textures;for(let V=0,$=O.length;V<$;V++){let de=i.get(O[V]);de.__webglTexture&&(n.deleteTexture(de.__webglTexture),o.memory.textures--),i.remove(O[V])}i.remove(T)}let B=0;function G(){B=0}function N(){return B}function z(T){B=T}function X(){let T=B;return T>=s.maxTextures&&Xe("WebGLTextures: Trying to use "+(T+1)+" texture units while this GPU supports only "+s.maxTextures),B+=1,T}function Y(T){let x=[];return x.push(T.wrapS),x.push(T.wrapT),x.push(T.wrapR||0),x.push(T.magFilter),x.push(T.minFilter),x.push(T.anisotropy),x.push(T.internalFormat),x.push(T.format),x.push(T.type),x.push(T.generateMipmaps),x.push(T.premultiplyAlpha),x.push(T.flipY),x.push(T.unpackAlignment),x.push(T.colorSpace),x.join()}function re(T,x){let O=i.get(T);if(T.isVideoTexture&&D(T),T.isRenderTargetTexture===!1&&T.isExternalTexture!==!0&&T.version>0&&O.__version!==T.version){let V=T.image;if(V===null)Xe("WebGLRenderer: Texture marked for update but no image data found.");else if(V.complete===!1)Xe("WebGLRenderer: Texture marked for update but image is incomplete");else{_e(O,T,x);return}}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+x)}function Z(T,x){let O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){_e(O,T,x);return}else T.isExternalTexture&&(O.__webglTexture=T.sourceTexture?T.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+x)}function ee(T,x){let O=i.get(T);if(T.isRenderTargetTexture===!1&&T.version>0&&O.__version!==T.version){_e(O,T,x);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+x)}function ne(T,x){let O=i.get(T);if(T.isCubeDepthTexture!==!0&&T.version>0&&O.__version!==T.version){Ge(O,T,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+x)}let De={[vo]:n.REPEAT,[Tn]:n.CLAMP_TO_EDGE,[yo]:n.MIRRORED_REPEAT},Te={[Mt]:n.NEAREST,[hu]:n.NEAREST_MIPMAP_NEAREST,[br]:n.NEAREST_MIPMAP_LINEAR,[Ut]:n.LINEAR,[Jo]:n.LINEAR_MIPMAP_NEAREST,[hi]:n.LINEAR_MIPMAP_LINEAR},tt={[pu]:n.NEVER,[vu]:n.ALWAYS,[mu]:n.LESS,[Ua]:n.LEQUAL,[gu]:n.EQUAL,[Fa]:n.GEQUAL,[xu]:n.GREATER,[_u]:n.NOTEQUAL};function Je(T,x){if(x.type===yn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Ut||x.magFilter===Jo||x.magFilter===br||x.magFilter===hi||x.minFilter===Ut||x.minFilter===Jo||x.minFilter===br||x.minFilter===hi)&&Xe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(T,n.TEXTURE_WRAP_S,De[x.wrapS]),n.texParameteri(T,n.TEXTURE_WRAP_T,De[x.wrapT]),(T===n.TEXTURE_3D||T===n.TEXTURE_2D_ARRAY)&&n.texParameteri(T,n.TEXTURE_WRAP_R,De[x.wrapR]),n.texParameteri(T,n.TEXTURE_MAG_FILTER,Te[x.magFilter]),n.texParameteri(T,n.TEXTURE_MIN_FILTER,Te[x.minFilter]),x.compareFunction&&(n.texParameteri(T,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(T,n.TEXTURE_COMPARE_FUNC,tt[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Mt||x.minFilter!==br&&x.minFilter!==hi||x.type===yn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(T,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,s.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function st(T,x){let O=!1;T.__webglInit===void 0&&(T.__webglInit=!0,x.addEventListener("dispose",C));let V=x.source,$=f.get(V);$===void 0&&($={},f.set(V,$));let de=Y(x);if(de!==T.__cacheKey){$[de]===void 0&&($[de]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,O=!0),$[de].usedTimes++;let fe=$[T.__cacheKey];fe!==void 0&&($[T.__cacheKey].usedTimes--,fe.usedTimes===0&&I(x)),T.__cacheKey=de,T.__webglTexture=$[de].texture}return O}function K(T,x,O){return Math.floor(Math.floor(T/O)/x)}function te(T,x,O,V){let de=T.updateRanges;if(de.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,O,V,x.data);else{de.sort((Oe,ve)=>Oe.start-ve.start);let fe=0;for(let Oe=1;Oe<de.length;Oe++){let ve=de[fe],me=de[Oe],Be=ve.start+ve.count,We=K(me.start,x.width,4),Ke=K(ve.start,x.width,4);me.start<=Be+1&&We===Ke&&K(me.start+me.count-1,x.width,4)===We?ve.count=Math.max(ve.count,me.start+me.count-ve.start):(++fe,de[fe]=me)}de.length=fe+1;let J=t.getParameter(n.UNPACK_ROW_LENGTH),se=t.getParameter(n.UNPACK_SKIP_PIXELS),pe=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let Oe=0,ve=de.length;Oe<ve;Oe++){let me=de[Oe],Be=Math.floor(me.start/4),We=Math.ceil(me.count/4),Ke=Be%x.width,F=Math.floor(Be/x.width),ge=We,Q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,Ke),t.pixelStorei(n.UNPACK_SKIP_ROWS,F),t.texSubImage2D(n.TEXTURE_2D,0,Ke,F,ge,Q,O,V,x.data)}T.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,J),t.pixelStorei(n.UNPACK_SKIP_PIXELS,se),t.pixelStorei(n.UNPACK_SKIP_ROWS,pe)}}function _e(T,x,O){let V=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(V=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&(V=n.TEXTURE_3D);let $=st(T,x),de=x.source;t.bindTexture(V,T.__webglTexture,n.TEXTURE0+O);let fe=i.get(de);if(de.version!==fe.__version||$===!0){if(t.activeTexture(n.TEXTURE0+O),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Q=it.getPrimaries(it.workingColorSpace),xe=x.colorSpace===zn?null:it.getPrimaries(x.colorSpace),Ee=x.colorSpace===zn||Q===xe?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ee)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let se=m(x.image,!1,s.maxTextureSize);se=lt(x,se);let pe=r.convert(x.format,x.colorSpace),Oe=r.convert(x.type),ve=v(x.internalFormat,pe,Oe,x.normalized,x.colorSpace,x.isVideoTexture);Je(V,x);let me,Be=x.mipmaps,We=x.isVideoTexture!==!0,Ke=fe.__version===void 0||$===!0,F=de.dataReady,ge=S(x,se);if(x.isDepthTexture)ve=E(x.format===ui,x.type),Ke&&(We?t.texStorage2D(n.TEXTURE_2D,1,ve,se.width,se.height):t.texImage2D(n.TEXTURE_2D,0,ve,se.width,se.height,0,pe,Oe,null));else if(x.isDataTexture)if(Be.length>0){We&&Ke&&t.texStorage2D(n.TEXTURE_2D,ge,ve,Be[0].width,Be[0].height);for(let Q=0,xe=Be.length;Q<xe;Q++)me=Be[Q],We?F&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,me.width,me.height,pe,Oe,me.data):t.texImage2D(n.TEXTURE_2D,Q,ve,me.width,me.height,0,pe,Oe,me.data);x.generateMipmaps=!1}else We?(Ke&&t.texStorage2D(n.TEXTURE_2D,ge,ve,se.width,se.height),F&&te(x,se,pe,Oe)):t.texImage2D(n.TEXTURE_2D,0,ve,se.width,se.height,0,pe,Oe,se.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){We&&Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ge,ve,Be[0].width,Be[0].height,se.depth);for(let Q=0,xe=Be.length;Q<xe;Q++)if(me=Be[Q],x.format!==hn)if(pe!==null)if(We){if(F)if(x.layerUpdates.size>0){let Ee=Mc(me.width,me.height,x.format,x.type);for(let oe of x.layerUpdates){let ze=me.data.subarray(oe*Ee/me.data.BYTES_PER_ELEMENT,(oe+1)*Ee/me.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,oe,me.width,me.height,1,pe,ze)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,me.width,me.height,se.depth,pe,me.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Q,ve,me.width,me.height,se.depth,0,me.data,0,0);else Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else We?F&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,me.width,me.height,se.depth,pe,Oe,me.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Q,ve,me.width,me.height,se.depth,0,pe,Oe,me.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{We&&Ke&&t.texStorage2D(n.TEXTURE_2D,ge,ve,Be[0].width,Be[0].height);for(let Q=0,xe=Be.length;Q<xe;Q++)me=Be[Q],x.format!==hn?pe!==null?We?F&&t.compressedTexSubImage2D(n.TEXTURE_2D,Q,0,0,me.width,me.height,pe,me.data):t.compressedTexImage2D(n.TEXTURE_2D,Q,ve,me.width,me.height,0,me.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):We?F&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,me.width,me.height,pe,Oe,me.data):t.texImage2D(n.TEXTURE_2D,Q,ve,me.width,me.height,0,pe,Oe,me.data)}else if(x.isDataArrayTexture)if(We){if(Ke&&t.texStorage3D(n.TEXTURE_2D_ARRAY,ge,ve,se.width,se.height,se.depth),F)if(x.layerUpdates.size>0){let Q=Mc(se.width,se.height,x.format,x.type);for(let xe of x.layerUpdates){let Ee=se.data.subarray(xe*Q/se.data.BYTES_PER_ELEMENT,(xe+1)*Q/se.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,xe,se.width,se.height,1,pe,Oe,Ee)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,se.width,se.height,se.depth,pe,Oe,se.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,ve,se.width,se.height,se.depth,0,pe,Oe,se.data);else if(x.isData3DTexture)We?(Ke&&t.texStorage3D(n.TEXTURE_3D,ge,ve,se.width,se.height,se.depth),F&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,se.width,se.height,se.depth,pe,Oe,se.data)):t.texImage3D(n.TEXTURE_3D,0,ve,se.width,se.height,se.depth,0,pe,Oe,se.data);else if(x.isFramebufferTexture){if(Ke)if(We)t.texStorage2D(n.TEXTURE_2D,ge,ve,se.width,se.height);else{let Q=se.width,xe=se.height;for(let Ee=0;Ee<ge;Ee++)t.texImage2D(n.TEXTURE_2D,Ee,ve,Q,xe,0,pe,Oe,null),Q>>=1,xe>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){let Q=n.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),se.parentNode!==Q){Q.appendChild(se),d.add(x),Q.onpaint=xe=>{let Ee=xe.changedElements;for(let oe of d)Ee.includes(oe.image)&&(oe.needsUpdate=!0)},Q.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,se);else{let Ee=n.RGBA,oe=n.RGBA,ze=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Ee,oe,ze,se)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Be.length>0){if(We&&Ke){let Q=$e(Be[0]);t.texStorage2D(n.TEXTURE_2D,ge,ve,Q.width,Q.height)}for(let Q=0,xe=Be.length;Q<xe;Q++)me=Be[Q],We?F&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,pe,Oe,me):t.texImage2D(n.TEXTURE_2D,Q,ve,pe,Oe,me);x.generateMipmaps=!1}else if(We){if(Ke){let Q=$e(se);t.texStorage2D(n.TEXTURE_2D,ge,ve,Q.width,Q.height)}F&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,pe,Oe,se)}else t.texImage2D(n.TEXTURE_2D,0,ve,pe,Oe,se);p(x)&&M(V),fe.__version=de.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function Ge(T,x,O){if(x.image.length!==6)return;let V=st(T,x),$=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,T.__webglTexture,n.TEXTURE0+O);let de=i.get($);if($.version!==de.__version||V===!0){t.activeTexture(n.TEXTURE0+O);let fe=it.getPrimaries(it.workingColorSpace),J=x.colorSpace===zn?null:it.getPrimaries(x.colorSpace),se=x.colorSpace===zn||fe===J?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,se);let pe=x.isCompressedTexture||x.image[0].isCompressedTexture,Oe=x.image[0]&&x.image[0].isDataTexture,ve=[];for(let oe=0;oe<6;oe++)!pe&&!Oe?ve[oe]=m(x.image[oe],!0,s.maxCubemapSize):ve[oe]=Oe?x.image[oe].image:x.image[oe],ve[oe]=lt(x,ve[oe]);let me=ve[0],Be=r.convert(x.format,x.colorSpace),We=r.convert(x.type),Ke=v(x.internalFormat,Be,We,x.normalized,x.colorSpace),F=x.isVideoTexture!==!0,ge=de.__version===void 0||V===!0,Q=$.dataReady,xe=S(x,me);Je(n.TEXTURE_CUBE_MAP,x);let Ee;if(pe){F&&ge&&t.texStorage2D(n.TEXTURE_CUBE_MAP,xe,Ke,me.width,me.height);for(let oe=0;oe<6;oe++){Ee=ve[oe].mipmaps;for(let ze=0;ze<Ee.length;ze++){let Ue=Ee[ze];x.format!==hn?Be!==null?F?Q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze,0,0,Ue.width,Ue.height,Be,Ue.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze,Ke,Ue.width,Ue.height,0,Ue.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):F?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze,0,0,Ue.width,Ue.height,Be,We,Ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze,Ke,Ue.width,Ue.height,0,Be,We,Ue.data)}}}else{if(Ee=x.mipmaps,F&&ge){Ee.length>0&&xe++;let oe=$e(ve[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,xe,Ke,oe.width,oe.height)}for(let oe=0;oe<6;oe++)if(Oe){F?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,ve[oe].width,ve[oe].height,Be,We,ve[oe].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,Ke,ve[oe].width,ve[oe].height,0,Be,We,ve[oe].data);for(let ze=0;ze<Ee.length;ze++){let xt=Ee[ze].image[oe].image;F?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze+1,0,0,xt.width,xt.height,Be,We,xt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze+1,Ke,xt.width,xt.height,0,Be,We,xt.data)}}else{F?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,Be,We,ve[oe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,Ke,Be,We,ve[oe]);for(let ze=0;ze<Ee.length;ze++){let Ue=Ee[ze];F?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze+1,0,0,Be,We,Ue.image[oe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,ze+1,Ke,Be,We,Ue.image[oe])}}}p(x)&&M(n.TEXTURE_CUBE_MAP),de.__version=$.version,x.onUpdate&&x.onUpdate(x)}T.__version=x.version}function Se(T,x,O,V,$,de){let fe=r.convert(O.format,O.colorSpace),J=r.convert(O.type),se=v(O.internalFormat,fe,J,O.normalized,O.colorSpace),pe=i.get(x),Oe=i.get(O);if(Oe.__renderTarget=x,!pe.__hasExternalTextures){let ve=Math.max(1,x.width>>de),me=Math.max(1,x.height>>de);$===n.TEXTURE_3D||$===n.TEXTURE_2D_ARRAY?t.texImage3D($,de,se,ve,me,x.depth,0,fe,J,null):t.texImage2D($,de,se,ve,me,0,fe,J,null)}t.bindFramebuffer(n.FRAMEBUFFER,T),Ve(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,V,$,Oe.__webglTexture,0,ke(x)):($===n.TEXTURE_2D||$>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&$<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,V,$,Oe.__webglTexture,de),t.bindFramebuffer(n.FRAMEBUFFER,null)}function He(T,x,O){if(n.bindRenderbuffer(n.RENDERBUFFER,T),x.depthBuffer){let V=x.depthTexture,$=V&&V.isDepthTexture?V.type:null,de=E(x.stencilBuffer,$),fe=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ve(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ke(x),de,x.width,x.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,ke(x),de,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,de,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,fe,n.RENDERBUFFER,T)}else{let V=x.textures;for(let $=0;$<V.length;$++){let de=V[$],fe=r.convert(de.format,de.colorSpace),J=r.convert(de.type),se=v(de.internalFormat,fe,J,de.normalized,de.colorSpace);Ve(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,ke(x),se,x.width,x.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,ke(x),se,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,se,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function rt(T,x,O){let V=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,T),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let $=i.get(x.depthTexture);if($.__renderTarget=x,(!$.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),V){if($.__webglInit===void 0&&($.__webglInit=!0,x.depthTexture.addEventListener("dispose",C)),$.__webglTexture===void 0){$.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,$.__webglTexture),Je(n.TEXTURE_CUBE_MAP,x.depthTexture);let pe=r.convert(x.depthTexture.format),Oe=r.convert(x.depthTexture.type),ve;x.depthTexture.format===An?ve=n.DEPTH_COMPONENT24:x.depthTexture.format===ui&&(ve=n.DEPTH24_STENCIL8);for(let me=0;me<6;me++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+me,0,ve,x.width,x.height,0,pe,Oe,null)}}else re(x.depthTexture,0);let de=$.__webglTexture,fe=ke(x),J=V?n.TEXTURE_CUBE_MAP_POSITIVE_X+O:n.TEXTURE_2D,se=x.depthTexture.format===ui?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===An)Ve(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,se,J,de,0,fe):n.framebufferTexture2D(n.FRAMEBUFFER,se,J,de,0);else if(x.depthTexture.format===ui)Ve(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,se,J,de,0,fe):n.framebufferTexture2D(n.FRAMEBUFFER,se,J,de,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ie(T){let x=i.get(T),O=T.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==T.depthTexture){let V=T.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),V){let $=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,V.removeEventListener("dispose",$)};V.addEventListener("dispose",$),x.__depthDisposeCallback=$}x.__boundDepthTexture=V}if(T.depthTexture&&!x.__autoAllocateDepthBuffer)if(O)for(let V=0;V<6;V++)rt(x.__webglFramebuffer[V],T,V);else{let V=T.texture.mipmaps;V&&V.length>0?rt(x.__webglFramebuffer[0],T,0):rt(x.__webglFramebuffer,T,0)}else if(O){x.__webglDepthbuffer=[];for(let V=0;V<6;V++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[V]),x.__webglDepthbuffer[V]===void 0)x.__webglDepthbuffer[V]=n.createRenderbuffer(),He(x.__webglDepthbuffer[V],T,!1);else{let $=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,de=x.__webglDepthbuffer[V];n.bindRenderbuffer(n.RENDERBUFFER,de),n.framebufferRenderbuffer(n.FRAMEBUFFER,$,n.RENDERBUFFER,de)}}else{let V=T.texture.mipmaps;if(V&&V.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),He(x.__webglDepthbuffer,T,!1);else{let $=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,de=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,de),n.framebufferRenderbuffer(n.FRAMEBUFFER,$,n.RENDERBUFFER,de)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function le(T,x,O){let V=i.get(T);x!==void 0&&Se(V.__webglFramebuffer,T,T.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&ie(T)}function ce(T){let x=T.texture,O=i.get(T),V=i.get(x);T.addEventListener("dispose",_);let $=T.textures,de=T.isWebGLCubeRenderTarget===!0,fe=$.length>1;if(fe||(V.__webglTexture===void 0&&(V.__webglTexture=n.createTexture()),V.__version=x.version,o.memory.textures++),de){O.__webglFramebuffer=[];for(let J=0;J<6;J++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[J]=[];for(let se=0;se<x.mipmaps.length;se++)O.__webglFramebuffer[J][se]=n.createFramebuffer()}else O.__webglFramebuffer[J]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let J=0;J<x.mipmaps.length;J++)O.__webglFramebuffer[J]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(fe)for(let J=0,se=$.length;J<se;J++){let pe=i.get($[J]);pe.__webglTexture===void 0&&(pe.__webglTexture=n.createTexture(),o.memory.textures++)}if(T.samples>0&&Ve(T)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let J=0;J<$.length;J++){let se=$[J];O.__webglColorRenderbuffer[J]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[J]);let pe=r.convert(se.format,se.colorSpace),Oe=r.convert(se.type),ve=v(se.internalFormat,pe,Oe,se.normalized,se.colorSpace,T.isXRRenderTarget===!0),me=ke(T);n.renderbufferStorageMultisample(n.RENDERBUFFER,me,ve,T.width,T.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+J,n.RENDERBUFFER,O.__webglColorRenderbuffer[J])}n.bindRenderbuffer(n.RENDERBUFFER,null),T.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),He(O.__webglDepthRenderbuffer,T,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(de){t.bindTexture(n.TEXTURE_CUBE_MAP,V.__webglTexture),Je(n.TEXTURE_CUBE_MAP,x);for(let J=0;J<6;J++)if(x.mipmaps&&x.mipmaps.length>0)for(let se=0;se<x.mipmaps.length;se++)Se(O.__webglFramebuffer[J][se],T,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+J,se);else Se(O.__webglFramebuffer[J],T,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+J,0);p(x)&&M(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(fe){for(let J=0,se=$.length;J<se;J++){let pe=$[J],Oe=i.get(pe),ve=n.TEXTURE_2D;(T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(ve=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(ve,Oe.__webglTexture),Je(ve,pe),Se(O.__webglFramebuffer,T,pe,n.COLOR_ATTACHMENT0+J,ve,0),p(pe)&&M(ve)}t.unbindTexture()}else{let J=n.TEXTURE_2D;if((T.isWebGL3DRenderTarget||T.isWebGLArrayRenderTarget)&&(J=T.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(J,V.__webglTexture),Je(J,x),x.mipmaps&&x.mipmaps.length>0)for(let se=0;se<x.mipmaps.length;se++)Se(O.__webglFramebuffer[se],T,x,n.COLOR_ATTACHMENT0,J,se);else Se(O.__webglFramebuffer,T,x,n.COLOR_ATTACHMENT0,J,0);p(x)&&M(J),t.unbindTexture()}T.depthBuffer&&ie(T)}function W(T){let x=T.textures;for(let O=0,V=x.length;O<V;O++){let $=x[O];if(p($)){let de=A(T),fe=i.get($).__webglTexture;t.bindTexture(de,fe),M(de),t.unbindTexture()}}}let j=[],Ae=[];function Ce(T){if(T.samples>0){if(Ve(T)===!1){let x=T.textures,O=T.width,V=T.height,$=n.COLOR_BUFFER_BIT,de=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,fe=i.get(T),J=x.length>1;if(J)for(let pe=0;pe<x.length;pe++)t.bindFramebuffer(n.FRAMEBUFFER,fe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,fe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,fe.__webglMultisampledFramebuffer);let se=T.texture.mipmaps;se&&se.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,fe.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,fe.__webglFramebuffer);for(let pe=0;pe<x.length;pe++){if(T.resolveDepthBuffer&&(T.depthBuffer&&($|=n.DEPTH_BUFFER_BIT),T.stencilBuffer&&T.resolveStencilBuffer&&($|=n.STENCIL_BUFFER_BIT)),J){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,fe.__webglColorRenderbuffer[pe]);let Oe=i.get(x[pe]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Oe,0)}n.blitFramebuffer(0,0,O,V,0,0,O,V,$,n.NEAREST),l===!0&&(j.length=0,Ae.length=0,j.push(n.COLOR_ATTACHMENT0+pe),T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&(j.push(de),Ae.push(de),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Ae)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,j))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),J)for(let pe=0;pe<x.length;pe++){t.bindFramebuffer(n.FRAMEBUFFER,fe.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.RENDERBUFFER,fe.__webglColorRenderbuffer[pe]);let Oe=i.get(x[pe]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,fe.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+pe,n.TEXTURE_2D,Oe,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,fe.__webglMultisampledFramebuffer)}else if(T.depthBuffer&&T.storeMultisampledDepthBuffer===!1&&l){let x=T.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function ke(T){return Math.min(s.maxSamples,T.samples)}function Ve(T){let x=i.get(T);return T.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function D(T){let x=o.render.frame;h.get(T)!==x&&(h.set(T,x),T.update())}function lt(T,x){let O=T.colorSpace,V=T.format,$=T.type;return T.isCompressedTexture===!0||T.isVideoTexture===!0||O!==qs&&O!==zn&&(it.getTransfer(O)===dt?(V!==hn||$!==jt)&&Xe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):qe("WebGLTextures: Unsupported texture color space:",O)),x}function $e(T){return typeof HTMLImageElement<"u"&&T instanceof HTMLImageElement?(c.width=T.naturalWidth||T.width,c.height=T.naturalHeight||T.height):typeof VideoFrame<"u"&&T instanceof VideoFrame?(c.width=T.displayWidth,c.height=T.displayHeight):(c.width=T.width,c.height=T.height),c}this.allocateTextureUnit=X,this.resetTextureUnits=G,this.getTextureUnits=N,this.setTextureUnits=z,this.setTexture2D=re,this.setTexture2DArray=Z,this.setTexture3D=ee,this.setTextureCube=ne,this.rebindTextures=le,this.setupRenderTarget=ce,this.updateRenderTargetMipmap=W,this.updateMultisampleRenderTarget=Ce,this.setupDepthRenderbuffer=ie,this.setupFrameBufferTexture=Se,this.useMultisampledRTT=Ve,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function c_(n,e){function t(i,s=zn){let r,o=it.getTransfer(s);if(i===jt)return n.UNSIGNED_BYTE;if(i===Qo)return n.UNSIGNED_SHORT_4_4_4_4;if(i===ea)return n.UNSIGNED_SHORT_5_5_5_1;if(i===uc)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===dc)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===cc)return n.BYTE;if(i===hc)return n.SHORT;if(i===bs)return n.UNSIGNED_SHORT;if(i===jo)return n.INT;if(i===vn)return n.UNSIGNED_INT;if(i===yn)return n.FLOAT;if(i===bn)return n.HALF_FLOAT;if(i===fc)return n.ALPHA;if(i===pc)return n.RGB;if(i===hn)return n.RGBA;if(i===An)return n.DEPTH_COMPONENT;if(i===ui)return n.DEPTH_STENCIL;if(i===Mr)return n.RED;if(i===ta)return n.RED_INTEGER;if(i===di)return n.RG;if(i===na)return n.RG_INTEGER;if(i===ia)return n.RGBA_INTEGER;if(i===Sr||i===Er||i===wr||i===Tr)if(o===dt)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(i===Sr)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Er)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===wr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Tr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(i===Sr)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Er)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===wr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Tr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===sa||i===ra||i===oa||i===aa)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(i===sa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===ra)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===oa)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===aa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===la||i===ca||i===ha||i===ua||i===da||i===Ar||i===fa)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(i===la||i===ca)return o===dt?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(i===ha)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(i===ua)return r.COMPRESSED_R11_EAC;if(i===da)return r.COMPRESSED_SIGNED_R11_EAC;if(i===Ar)return r.COMPRESSED_RG11_EAC;if(i===fa)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===pa||i===ma||i===ga||i===xa||i===_a||i===va||i===ya||i===ba||i===Ma||i===Sa||i===Ea||i===wa||i===Ta||i===Aa)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(i===pa)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===ma)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ga)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===xa)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===_a)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===va)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===ya)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===ba)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Ma)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===Sa)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Ea)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===wa)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Ta)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===Aa)return o===dt?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Ra||i===Ca||i===Ia)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(i===Ra)return o===dt?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Ca)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Ia)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Pa||i===Da||i===Rr||i===La)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(i===Pa)return r.COMPRESSED_RED_RGTC1_EXT;if(i===Da)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Rr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===La)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Ms?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var h_=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,u_=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,Fc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new tr(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new Vt({vertexShader:h_,fragmentShader:u_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ye(new Ti(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Oc=class extends Rn{constructor(e,t){super();let i=this,s=null,r=1,o=null,a="local-floor",l=1,c=null,h=null,d=null,u=null,f=null,g=null,b=typeof XRWebGLBinding<"u",m=new Fc,p={},M=t.getContextAttributes(),A=null,v=null,E=[],S=[],C=new ue,_=null,w=null,I=new Nt;I.viewport=new St;let L=new Nt;L.viewport=new St;let B=[I,L],G=new Zo,N=null,z=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(K){let te=E[K];return te===void 0&&(te=new us,E[K]=te),te.getTargetRaySpace()},this.getControllerGrip=function(K){let te=E[K];return te===void 0&&(te=new us,E[K]=te),te.getGripSpace()},this.getHand=function(K){let te=E[K];return te===void 0&&(te=new us,E[K]=te),te.getHandSpace()};function X(K){let te=S.indexOf(K.inputSource);if(te===-1)return;let _e=E[te];_e!==void 0&&(_e.update(K.inputSource,K.frame,c||o),_e.dispatchEvent({type:K.type,data:K.inputSource}))}function Y(){s.removeEventListener("select",X),s.removeEventListener("selectstart",X),s.removeEventListener("selectend",X),s.removeEventListener("squeeze",X),s.removeEventListener("squeezestart",X),s.removeEventListener("squeezeend",X),s.removeEventListener("end",Y),s.removeEventListener("inputsourceschange",re);for(let K=0;K<E.length;K++){let te=S[K];te!==null&&(S[K]=null,E[K].disconnect(te))}N=null,z=null,m.reset();for(let K in p)delete p[K];if(e.setRenderTarget(A),f=null,u=null,d=null,s=null,v=null,st.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(C.width,C.height,!1),w!==null){let K=w.camera;K.fov=w.fov,K.zoom=w.zoom,K.updateProjectionMatrix(),w=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(K){r=K,i.isPresenting===!0&&Xe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(K){a=K,i.isPresenting===!0&&Xe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||o},this.setReferenceSpace=function(K){c=K},this.getBaseLayer=function(){return u!==null?u:f},this.getBinding=function(){return d===null&&b&&(d=new XRWebGLBinding(s,t)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(K){if(s=K,s!==null){if(A=e.getRenderTarget(),s.addEventListener("select",X),s.addEventListener("selectstart",X),s.addEventListener("selectend",X),s.addEventListener("squeeze",X),s.addEventListener("squeezestart",X),s.addEventListener("squeezeend",X),s.addEventListener("end",Y),s.addEventListener("inputsourceschange",re),M.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(C),b&&"createProjectionLayer"in XRWebGLBinding.prototype){let _e=null,Ge=null,Se=null;M.depth&&(Se=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=M.stencil?ui:An,Ge=M.stencil?Ms:vn);let He={colorFormat:t.RGBA8,depthFormat:Se,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(He),s.updateRenderState({layers:[u]}),e.setPixelRatio(1),e.setSize(u.textureWidth,u.textureHeight,!1),v=new Ht(u.textureWidth,u.textureHeight,{format:hn,type:jt,depthTexture:new ei(u.textureWidth,u.textureHeight,Ge,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let _e={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,_e),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new Ht(f.framebufferWidth,f.framebufferHeight,{format:hn,type:jt,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(l),c=null,o=await s.requestReferenceSpace(a),st.setContext(s),st.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function re(K){for(let te=0;te<K.removed.length;te++){let _e=K.removed[te],Ge=S.indexOf(_e);Ge>=0&&(S[Ge]=null,E[Ge].disconnect(_e))}for(let te=0;te<K.added.length;te++){let _e=K.added[te],Ge=S.indexOf(_e);if(Ge===-1){for(let He=0;He<E.length;He++)if(He>=S.length){S.push(_e),Ge=He;break}else if(S[He]===null){S[He]=_e,Ge=He;break}if(Ge===-1)break}let Se=E[Ge];Se&&Se.connect(_e)}}let Z=new P,ee=new P;function ne(K,te,_e){Z.setFromMatrixPosition(te.matrixWorld),ee.setFromMatrixPosition(_e.matrixWorld);let Ge=Z.distanceTo(ee),Se=te.projectionMatrix.elements,He=_e.projectionMatrix.elements,rt=Se[14]/(Se[10]-1),ie=Se[14]/(Se[10]+1),le=(Se[9]+1)/Se[5],ce=(Se[9]-1)/Se[5],W=(Se[8]-1)/Se[0],j=(He[8]+1)/He[0],Ae=rt*W,Ce=rt*j,ke=Ge/(-W+j),Ve=ke*-W;if(te.matrixWorld.decompose(K.position,K.quaternion,K.scale),K.translateX(Ve),K.translateZ(ke),K.matrixWorld.compose(K.position,K.quaternion,K.scale),K.matrixWorldInverse.copy(K.matrixWorld).invert(),Se[10]===-1)K.projectionMatrix.copy(te.projectionMatrix),K.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{let D=rt+ke,lt=ie+ke,$e=Ae-Ve,T=Ce+(Ge-Ve),x=le*ie/lt*D,O=ce*ie/lt*D;K.projectionMatrix.makePerspective($e,T,x,O,D,lt),K.projectionMatrixInverse.copy(K.projectionMatrix).invert()}}function De(K,te){te===null?K.matrixWorld.copy(K.matrix):K.matrixWorld.multiplyMatrices(te.matrixWorld,K.matrix),K.matrixWorldInverse.copy(K.matrixWorld).invert()}this.updateCamera=function(K){if(s===null)return;let te=K.near,_e=K.far;m.texture!==null&&(m.depthNear>0&&(te=m.depthNear),m.depthFar>0&&(_e=m.depthFar)),G.near=L.near=I.near=te,G.far=L.far=I.far=_e,(N!==G.near||z!==G.far)&&(s.updateRenderState({depthNear:G.near,depthFar:G.far}),N=G.near,z=G.far),G.layers.mask=K.layers.mask|6,I.layers.mask=G.layers.mask&-5,L.layers.mask=G.layers.mask&-3;let Ge=K.parent,Se=G.cameras;De(G,Ge);for(let He=0;He<Se.length;He++)De(Se[He],Ge);Se.length===2?ne(G,I,L):G.projectionMatrix.copy(I.projectionMatrix),w===null&&K.isPerspectiveCamera&&(w={camera:K,fov:K.fov,zoom:K.zoom}),Te(K,G,Ge)};function Te(K,te,_e){_e===null?K.matrix.copy(te.matrixWorld):(K.matrix.copy(_e.matrixWorld),K.matrix.invert(),K.matrix.multiply(te.matrixWorld)),K.matrix.decompose(K.position,K.quaternion,K.scale),K.updateMatrixWorld(!0),K.projectionMatrix.copy(te.projectionMatrix),K.projectionMatrixInverse.copy(te.projectionMatrixInverse),K.isPerspectiveCamera&&(K.fov=cs*2*Math.atan(1/K.projectionMatrix.elements[5]),K.zoom=1)}this.getCamera=function(){return G},this.getFoveation=function(){if(!(u===null&&f===null))return l},this.setFoveation=function(K){l=K,u!==null&&(u.fixedFoveation=K),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=K)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(G)},this.getCameraTexture=function(K){return p[K]};let tt=null;function Je(K,te){if(h=te.getViewerPose(c||o),g=te,h!==null){let _e=h.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let Ge=!1;_e.length!==G.cameras.length&&(G.cameras.length=0,Ge=!0);for(let ie=0;ie<_e.length;ie++){let le=_e[ie],ce=null;if(f!==null)ce=f.getViewport(le);else{let j=d.getViewSubImage(u,le);ce=j.viewport,ie===0&&(e.setRenderTargetTextures(v,j.colorTexture,j.depthStencilTexture),e.setRenderTarget(v))}let W=B[ie];W===void 0&&(W=new Nt,W.layers.enable(ie),W.viewport=new St,B[ie]=W),W.matrix.fromArray(le.transform.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale),W.projectionMatrix.fromArray(le.projectionMatrix),W.projectionMatrixInverse.copy(W.projectionMatrix).invert(),W.viewport.set(ce.x,ce.y,ce.width,ce.height),ie===0&&(G.matrix.copy(W.matrix),G.matrix.decompose(G.position,G.quaternion,G.scale)),Ge===!0&&G.cameras.push(W)}let Se=s.enabledFeatures;if(Se&&Se.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&b){d=i.getBinding();let ie=d.getDepthInformation(_e[0]);ie&&ie.isValid&&ie.texture&&m.init(ie,s.renderState)}if(Se&&Se.includes("camera-access")&&b){e.state.unbindTexture(),d=i.getBinding();for(let ie=0;ie<_e.length;ie++){let le=_e[ie].camera;if(le){let ce=p[le];ce||(ce=new tr,p[le]=ce);let W=d.getCameraImage(le);ce.sourceTexture=W}}}}for(let _e=0;_e<E.length;_e++){let Ge=S[_e],Se=E[_e];Ge!==null&&Se!==void 0&&Se.update(Ge,te,c||o)}tt&&tt(K,te),te.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:te}),g=null}let st=new ed;st.setAnimationLoop(Je),this.setAnimationLoop=function(K){tt=K},this.dispose=function(){}}},d_=new vt,od=new Ze;od.set(-1,0,0,0,1,0,0,0,1);function f_(n,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function i(m,p){p.color.getRGB(m.fogColor.value,vc(n)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function s(m,p,M,A,v){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?r(m,p):p.isMeshLambertMaterial?(r(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(r(m,p),d(m,p)):p.isMeshPhongMaterial?(r(m,p),h(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(r(m,p),u(m,p),p.isMeshPhysicalMaterial&&f(m,p,v)):p.isMeshMatcapMaterial?(r(m,p),g(m,p)):p.isMeshDepthMaterial?r(m,p):p.isMeshDistanceMaterial?(r(m,p),b(m,p)):p.isMeshNormalMaterial?r(m,p):p.isLineBasicMaterial?(o(m,p),p.isLineDashedMaterial&&a(m,p)):p.isPointsMaterial?l(m,p,M,A):p.isSpriteMaterial?c(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function r(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Ft&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Ft&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);let M=e.get(p),A=M.envMap,v=M.envMapRotation;A&&(m.envMap.value=A,m.envMapRotation.value.setFromMatrix4(d_.makeRotationFromEuler(v)).transpose(),A.isCubeTexture&&A.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(od),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function o(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function a(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function l(m,p,M,A){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=A*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function c(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function h(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function d(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function u(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function f(m,p,M){m.ior.value=p.ior,p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Ft&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,p){p.matcap&&(m.matcap.value=p.matcap)}function b(m,p){let M=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:s}}function p_(n,e,t,i){let s={},r={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function l(v,E){let S=E.program;i.uniformBlockBinding(v,S)}function c(v,E){let S=s[v.id];S===void 0&&(m(v),S=h(v),s[v.id]=S,v.addEventListener("dispose",M));let C=E.program;i.updateUBOMapping(v,C);let _=e.render.frame;r[v.id]!==_&&(u(v),r[v.id]=_)}function h(v){let E=d();v.__bindingPointIndex=E;let S=n.createBuffer(),C=v.__size,_=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,S),n.bufferData(n.UNIFORM_BUFFER,C,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,E,S),S}function d(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return qe("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(v){let E=s[v.id],S=v.uniforms,C=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,E);for(let _=0,w=S.length;_<w;_++){let I=S[_];if(Array.isArray(I))for(let L=0,B=I.length;L<B;L++)f(I[L],_,L,C);else f(I,_,0,C)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,E,S,C){if(b(v,E,S,C)===!0){let _=v.__offset,w=v.value;if(Array.isArray(w)){let I=0;for(let L=0;L<w.length;L++){let B=w[L],G=p(B);g(B,v.__data,I),typeof B!="number"&&typeof B!="boolean"&&!B.isMatrix3&&!ArrayBuffer.isView(B)&&(I+=G.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(w,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,_,v.__data)}}function g(v,E,S){typeof v=="number"||typeof v=="boolean"?E[0]=v:v.isMatrix3?(E[0]=v.elements[0],E[1]=v.elements[1],E[2]=v.elements[2],E[3]=0,E[4]=v.elements[3],E[5]=v.elements[4],E[6]=v.elements[5],E[7]=0,E[8]=v.elements[6],E[9]=v.elements[7],E[10]=v.elements[8],E[11]=0):ArrayBuffer.isView(v)?E.set(new v.constructor(v.buffer,v.byteOffset,E.length)):v.toArray(E,S)}function b(v,E,S,C){let _=v.value,w=E+"_"+S;if(C[w]===void 0)return typeof _=="number"||typeof _=="boolean"?C[w]=_:ArrayBuffer.isView(_)?C[w]=_.slice():C[w]=_.clone(),!0;{let I=C[w];if(typeof _=="number"||typeof _=="boolean"){if(I!==_)return C[w]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(I.equals(_)===!1)return I.copy(_),!0}}return!1}function m(v){let E=v.uniforms,S=0,C=16;for(let w=0,I=E.length;w<I;w++){let L=Array.isArray(E[w])?E[w]:[E[w]];for(let B=0,G=L.length;B<G;B++){let N=L[B],z=Array.isArray(N.value)?N.value:[N.value];for(let X=0,Y=z.length;X<Y;X++){let re=z[X],Z=p(re),ee=S%C,ne=ee%Z.boundary,De=ee+ne;S+=ne,De!==0&&C-De<Z.storage&&(S+=C-De),N.__data=new Float32Array(Z.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=S,S+=Z.storage}}}let _=S%C;return _>0&&(S+=C-_),v.__size=S,v.__cache={},this}function p(v){let E={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(E.boundary=4,E.storage=4):v.isVector2?(E.boundary=8,E.storage=8):v.isVector3||v.isColor?(E.boundary=16,E.storage=12):v.isVector4?(E.boundary=16,E.storage=16):v.isMatrix3?(E.boundary=48,E.storage=48):v.isMatrix4?(E.boundary=64,E.storage=64):v.isTexture?Xe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(E.boundary=16,E.storage=v.byteLength):Xe("WebGLRenderer: Unsupported uniform value type.",v),E}function M(v){let E=v.target;E.removeEventListener("dispose",M);let S=o.indexOf(E.__bindingPointIndex);o.splice(S,1),n.deleteBuffer(s[E.id]),delete s[E.id],delete r[E.id]}function A(){for(let v in s)n.deleteBuffer(s[v]);o=[],s={},r={}}return{bind:l,update:c,dispose:A}}var m_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Pn=null;function g_(){return Pn===null&&(Pn=new Qn(m_,16,16,di,bn),Pn.name="DFG_LUT",Pn.minFilter=Ut,Pn.magFilter=Ut,Pn.wrapS=Tn,Pn.wrapT=Tn,Pn.generateMipmaps=!1,Pn.needsUpdate=!0),Pn}var Ha=class{constructor(e={}){let{canvas:t=bu(),context:i=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:f=jt}=e;this.isWebGLRenderer=!0;let g;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=i.getContextAttributes().alpha}else g=o;let b=f,m=new Set([ia,na,ta]),p=new Set([jt,vn,bs,Ms,Qo,ea]),M=new Uint32Array(4),A=new Int32Array(4),v=new P,E=null,S=null,C=[],_=[],w=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=_n,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let I=this,L=!1,B=null,G=null,N=null,z=null;this._outputColorSpace=Yt;let X=0,Y=0,re=null,Z=-1,ee=null,ne=new St,De=new St,Te=null,tt=new Le(0),Je=0,st=t.width,K=t.height,te=1,_e=null,Ge=null,Se=new St(0,0,st,K),He=new St(0,0,st,K),rt=!1,ie=new ps,le=!1,ce=!1,W=new vt,j=new P,Ae=new St,Ce={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},ke=!1;function Ve(){return re===null?te:1}let D=i;function lt(y,U){return t.getContext(y,U)}let $e,T,x,O,V,$,de,fe,J,se,pe,Oe,ve,me,Be,We,Ke,F,ge,Q,xe,Ee,oe;try{let y={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",xt,!1),t.addEventListener("webglcontextrestored",ht,!1),t.addEventListener("webglcontextcreationerror",un,!1),D===null){let U="webgl2";if(D=lt(U,y),D===null)throw lt(U)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ze()}catch(y){throw t.removeEventListener("webglcontextlost",xt,!1),t.removeEventListener("webglcontextrestored",ht,!1),t.removeEventListener("webglcontextcreationerror",un,!1),qe("WebGLRenderer: "+y.message),y}function ze(){$e=new Sg(D),$e.init(),xe=new c_(D,$e),T=new fg(D,$e,e,xe),x=new a_(D,$e),T.reversedDepthBuffer&&u&&x.buffers.depth.setReversed(!0),G=D.createFramebuffer(),N=D.createFramebuffer(),z=D.createFramebuffer(),O=new Tg(D),V=new Yx,$=new l_(D,$e,x,V,T,xe,O),de=new Mg(I),fe=new Rp(D),Ee=new ug(D,fe),J=new Eg(D,fe,O,Ee),se=new Rg(D,J,fe,Ee,O),F=new Ag(D,T,$),Be=new pg(V),pe=new qx(I,de,$e,T,Ee,Be),Oe=new f_(I,V),ve=new $x,me=new t_($e),Ke=new hg(I,de,x,se,g,l),We=new o_(I,se,T),oe=new p_(D,O,T,x),ge=new dg(D,$e,O),Q=new wg(D,$e,O),O.programs=pe.programs,I.capabilities=T,I.extensions=$e,I.properties=V,I.renderLists=ve,I.shadowMap=We,I.state=x,I.info=O}b!==jt&&(w=new Ig(b,t.width,t.height,a,s,r));let Ue=new Oc(I,D);this.xr=Ue,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let y=$e.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){let y=$e.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return te},this.setPixelRatio=function(y){y!==void 0&&(te=y,this.setSize(st,K,!1))},this.getSize=function(y){return y.set(st,K)},this.setSize=function(y,U,q=!0){if(Ue.isPresenting){Xe("WebGLRenderer: Can't change size while VR device is presenting.");return}st=y,K=U,t.width=Math.floor(y*te),t.height=Math.floor(U*te),q===!0&&(t.style.width=y+"px",t.style.height=U+"px"),w!==null&&w.setSize(t.width,t.height),this.setViewport(0,0,y,U)},this.getDrawingBufferSize=function(y){return y.set(st*te,K*te).floor()},this.setDrawingBufferSize=function(y,U,q){st=y,K=U,te=q,t.width=Math.floor(y*q),t.height=Math.floor(U*q),this.setViewport(0,0,y,U)},this.setEffects=function(y){if(b===jt){qe("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(y){for(let U=0;U<y.length;U++)if(y[U].isOutputPass===!0){Xe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}w.setEffects(y||[])},this.getCurrentViewport=function(y){return y.copy(ne)},this.getViewport=function(y){return y.copy(Se)},this.setViewport=function(y,U,q,k){y.isVector4?Se.set(y.x,y.y,y.z,y.w):Se.set(y,U,q,k),x.viewport(ne.copy(Se).multiplyScalar(te).round())},this.getScissor=function(y){return y.copy(He)},this.setScissor=function(y,U,q,k){y.isVector4?He.set(y.x,y.y,y.z,y.w):He.set(y,U,q,k),x.scissor(De.copy(He).multiplyScalar(te).round())},this.getScissorTest=function(){return rt},this.setScissorTest=function(y){x.setScissorTest(rt=y)},this.setOpaqueSort=function(y){_e=y},this.setTransparentSort=function(y){Ge=y},this.getClearColor=function(y){return y.copy(Ke.getClearColor())},this.setClearColor=function(){Ke.setClearColor(...arguments)},this.getClearAlpha=function(){return Ke.getClearAlpha()},this.setClearAlpha=function(){Ke.setClearAlpha(...arguments)},this.clear=function(y=!0,U=!0,q=!0){let k=0;if(y){let H=!1;if(re!==null){let Me=re.texture.format;H=m.has(Me)}if(H){let Me=re.texture.type,Re=p.has(Me),be=Ke.getClearColor(),Ie=Ke.getClearAlpha(),Fe=be.r,je=be.g,nt=be.b;Re?(M[0]=Fe,M[1]=je,M[2]=nt,M[3]=Ie,D.clearBufferuiv(D.COLOR,0,M)):(A[0]=Fe,A[1]=je,A[2]=nt,A[3]=Ie,D.clearBufferiv(D.COLOR,0,A))}else k|=D.COLOR_BUFFER_BIT}U&&(k|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),q&&(k|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),k!==0&&D.clear(k)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(y){y.setRenderer(this),B=y},this.dispose=function(){t.removeEventListener("webglcontextlost",xt,!1),t.removeEventListener("webglcontextrestored",ht,!1),t.removeEventListener("webglcontextcreationerror",un,!1),Ke.dispose(),ve.dispose(),me.dispose(),V.dispose(),de.dispose(),se.dispose(),Ee.dispose(),oe.dispose(),pe.dispose(),Ue.dispose(),Ue.removeEventListener("sessionstart",Zc),Ue.removeEventListener("sessionend",$c),xi.stop()};function xt(y){y.preventDefault(),gc("WebGLRenderer: Context Lost."),L=!0}function ht(){gc("WebGLRenderer: Context Restored."),L=!1;let y=O.autoReset,U=We.enabled,q=We.autoUpdate,k=We.needsUpdate,H=We.type;ze(),O.autoReset=y,We.enabled=U,We.autoUpdate=q,We.needsUpdate=k,We.type=H}function un(y){qe("WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Sn(y){let U=y.target;U.removeEventListener("dispose",Sn),kd(U)}function kd(y){Hd(y),V.remove(y)}function Hd(y){let U=V.get(y).programs;U!==void 0&&(U.forEach(function(q){pe.releaseProgram(q)}),y.isShaderMaterial&&pe.releaseShaderCache(y))}this.renderBufferDirect=function(y,U,q,k,H,Me){U===null&&(U=Ce);let Re=H.isMesh&&H.matrixWorld.determinantAffine()<0,be=Wd(y,U,q,k,H);x.setMaterial(k,Re);let Ie=q.index,Fe=1;if(k.wireframe===!0){if(Ie=J.getWireframeAttribute(q),Ie===void 0)return;Fe=2}let je=q.drawRange,nt=q.attributes.position,Pe=je.start*Fe,ut=(je.start+je.count)*Fe;Me!==null&&(Pe=Math.max(Pe,Me.start*Fe),ut=Math.min(ut,(Me.start+Me.count)*Fe)),Ie!==null?(Pe=Math.max(Pe,0),ut=Math.min(ut,Ie.count)):nt!=null&&(Pe=Math.max(Pe,0),ut=Math.min(ut,nt.count));let At=ut-Pe;if(At<0||At===1/0)return;Ee.setup(H,k,be,q,Ie);let yt,gt=ge;if(Ie!==null&&(yt=fe.get(Ie),gt=Q,gt.setIndex(yt)),H.isMesh)k.wireframe===!0?(x.setLineWidth(k.wireframeLinewidth*Ve()),gt.setMode(D.LINES)):gt.setMode(D.TRIANGLES);else if(H.isLine){let Ot=k.linewidth;Ot===void 0&&(Ot=1),x.setLineWidth(Ot*Ve()),H.isLineSegments?gt.setMode(D.LINES):H.isLineLoop?gt.setMode(D.LINE_LOOP):gt.setMode(D.LINE_STRIP)}else H.isPoints?gt.setMode(D.POINTS):H.isSprite&&gt.setMode(D.TRIANGLES);if(H.isBatchedMesh)if($e.get("WEBGL_multi_draw"))gt.renderMultiDraw(H._multiDrawStarts,H._multiDrawCounts,H._multiDrawCount);else{let Ot=H._multiDrawStarts,we=H._multiDrawCounts,Xt=H._multiDrawCount,ot=Ie?fe.get(Ie).bytesPerElement:1,rn=V.get(k).currentProgram.getUniforms();for(let En=0;En<Xt;En++)rn.setValue(D,"_gl_DrawID",En),gt.render(Ot[En]/ot,we[En])}else if(H.isInstancedMesh)gt.renderInstances(Pe,At,H.count);else if(q.isInstancedBufferGeometry){let Ot=q._maxInstanceCount!==void 0?q._maxInstanceCount:1/0,we=Math.min(q.instanceCount,Ot);gt.renderInstances(Pe,At,we)}else gt.render(Pe,At)};function Yc(y,U,q,k){B!==null&&y.isNodeMaterial&&B.setObject(k,y),le===!0&&Be.setState(y,q,!1),y.transparent===!0&&y.side===cn&&y.forceSinglePass===!1?(y.side=Ft,y.needsUpdate=!0,Fr(y,U,k),y.side=li,y.needsUpdate=!0,Fr(y,U,k),y.side=cn):Fr(y,U,k)}this.compile=function(y,U,q=null){q===null&&(q=y),B!==null&&B.renderStart(y,U,q),S=me.get(q),S.init(U),_.push(S),q.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(S.pushLight(H),H.castShadow&&S.pushShadow(H))}),y!==q&&y.traverseVisible(function(H){H.isLight&&H.layers.test(U.layers)&&(S.pushLight(H),H.castShadow&&S.pushShadow(H))}),S.setupLights(),B!==null&&B.updateLights(S.state.lightsArray),ce=this.localClippingEnabled,le=Be.init(this.clippingPlanes,ce),le===!0&&Be.setGlobalState(this.clippingPlanes,U),B!==null&&We.render(S.state.shadowsArray,q,U);let k=new Set;return y.traverse(function(H){if(!(H.isMesh||H.isPoints||H.isLine||H.isSprite))return;let Me=H.material;if(Me)if(Array.isArray(Me))for(let Re=0;Re<Me.length;Re++){let be=Me[Re];Yc(be,q,U,H),k.add(be)}else Yc(Me,q,U,H),k.add(Me)}),S=_.pop(),B!==null&&B.renderEnd(),k},this.compileAsync=function(y,U,q=null){let k=this.compile(y,U,q);return new Promise(H=>{function Me(){if(k.forEach(function(Re){let Ie=V.get(Re).currentProgram;(Ie===void 0||Ie.isReady())&&k.delete(Re)}),k.size===0){H(y);return}setTimeout(Me,10)}$e.get("KHR_parallel_shader_compile")!==null?Me():setTimeout(Me,10)})};let ol=null;function Gd(y){ol&&ol(y)}function Zc(){xi.stop()}function $c(){xi.start()}let xi=new ed;xi.setAnimationLoop(Gd),typeof self<"u"&&xi.setContext(self),this.setAnimationLoop=function(y){ol=y,Ue.setAnimationLoop(y),y===null?xi.stop():xi.start()},Ue.addEventListener("sessionstart",Zc),Ue.addEventListener("sessionend",$c),this.render=function(y,U){if(U!==void 0&&U.isCamera!==!0){qe("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;B!==null&&B.renderStart(y,U);let q=Ue.enabled===!0&&Ue.isPresenting===!0,k=w!==null&&(re===null||q)&&w.begin(I,re);if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),U.parent===null&&U.matrixWorldAutoUpdate===!0&&U.updateMatrixWorld(),Ue.enabled===!0&&Ue.isPresenting===!0&&(w===null||w.isCompositing()===!1)&&(Ue.cameraAutoUpdate===!0&&Ue.updateCamera(U),U=Ue.getCamera()),y.isScene===!0&&y.onBeforeRender(I,y,U,re),S=me.get(y,_.length),S.init(U),S.state.textureUnits=$.getTextureUnits(),_.push(S),W.multiplyMatrices(U.projectionMatrix,U.matrixWorldInverse),ie.setFromProjectionMatrix(W,xn,U.reversedDepth),ce=this.localClippingEnabled,le=Be.init(this.clippingPlanes,ce),E=ve.get(y,C.length),E.init(),C.push(E),Ue.enabled===!0&&Ue.isPresenting===!0){let Re=I.xr.getDepthSensingMesh();Re!==null&&al(Re,U,-1/0,I.sortObjects)}al(y,U,0,I.sortObjects),E.finish(),B!==null&&B.updateLights(S.state.lightsArray),I.sortObjects===!0&&E.sort(_e,Ge),ke=Ue.enabled===!1||Ue.isPresenting===!1||Ue.hasDepthSensing()===!1,ke&&Ke.addToRenderList(E,y),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),le===!0&&Be.beginShadows();let H=S.state.shadowsArray;if(We.render(H,y,U),le===!0&&Be.endShadows(),(k&&w.hasRenderPass())===!1){let Re=E.opaque,be=E.transmissive;if(S.setupLights(),U.isArrayCamera){let Ie=U.cameras;if(be.length>0)for(let Fe=0,je=Ie.length;Fe<je;Fe++){let nt=Ie[Fe];Jc(Re,be,y,nt)}ke&&Ke.render(y);for(let Fe=0,je=Ie.length;Fe<je;Fe++){let nt=Ie[Fe];Kc(E,y,nt,nt.viewport)}}else be.length>0&&Jc(Re,be,y,U),ke&&Ke.render(y),Kc(E,y,U)}re!==null&&Y===0&&($.updateMultisampleRenderTarget(re),$.updateRenderTargetMipmap(re)),k&&w.end(I),y.isScene===!0&&y.onAfterRender(I,y,U),Ee.resetDefaultState(),Z=-1,ee=null,_.pop(),_.length>0?(S=_[_.length-1],$.setTextureUnits(S.state.textureUnits),le===!0&&Be.setGlobalState(I.clippingPlanes,S.state.camera)):S=null,C.pop(),C.length>0?E=C[C.length-1]:E=null,B!==null&&B.renderEnd()};function al(y,U,q,k){if(y.visible===!1)return;if(y.layers.test(U.layers)){if(y.isGroup)q=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(U);else if(y.isLightProbeGrid)S.pushLightProbeGrid(y);else if(y.isLight)S.pushLight(y),y.castShadow&&S.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||y.intersectsFrustum(ie)){k&&Ae.setFromMatrixPosition(y.matrixWorld).applyMatrix4(W);let Re=se.update(y),be=y.material;be.visible&&E.push(y,Re,be,q,Ae.z,null,U)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||y.intersectsFrustum(ie))){let Re=se.update(y),be=y.material;if(k&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),Ae.copy(y.boundingSphere.center)):(Re.boundingSphere===null&&Re.computeBoundingSphere(),Ae.copy(Re.boundingSphere.center)),Ae.applyMatrix4(y.matrixWorld).applyMatrix4(W)),Array.isArray(be)){let Ie=Re.groups;for(let Fe=0,je=Ie.length;Fe<je;Fe++){let nt=Ie[Fe],Pe=be[nt.materialIndex];Pe&&Pe.visible&&E.push(y,Re,Pe,q,Ae.z,nt,U)}}else be.visible&&E.push(y,Re,be,q,Ae.z,null,U)}}let Me=y.children;for(let Re=0,be=Me.length;Re<be;Re++)al(Me[Re],U,q,k)}function Kc(y,U,q,k){let{opaque:H,transmissive:Me,transparent:Re}=y;S.setupLightsView(q),le===!0&&Be.setGlobalState(I.clippingPlanes,q),k&&x.viewport(ne.copy(k)),H.length>0&&Ur(H,U,q),Me.length>0&&Ur(Me,U,q),Re.length>0&&Ur(Re,U,q),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function Jc(y,U,q,k){if((q.isScene===!0?q.overrideMaterial:null)!==null)return;if(S.state.transmissionRenderTarget[k.id]===void 0){let Pe=$e.has("EXT_color_buffer_half_float")||$e.has("EXT_color_buffer_float");S.state.transmissionRenderTarget[k.id]=new Ht(1,1,{generateMipmaps:!0,type:Pe?bn:jt,minFilter:hi,samples:Math.max(4,T.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:it.workingColorSpace})}let Me=S.state.transmissionRenderTarget[k.id],Re=k.viewport||ne;Me.setSize(Re.z*I.transmissionResolutionScale,Re.w*I.transmissionResolutionScale);let be=I.getRenderTarget(),Ie=I.getActiveCubeFace(),Fe=I.getActiveMipmapLevel();I.setRenderTarget(Me),I.getClearColor(tt),Je=I.getClearAlpha(),Je<1&&I.setClearColor(16777215,.5),I.clear(),ke&&Ke.render(q);let je=I.toneMapping;I.toneMapping=_n;let nt=k.viewport;if(k.viewport!==void 0&&(k.viewport=void 0),S.setupLightsView(k),le===!0&&Be.setGlobalState(I.clippingPlanes,k),Ur(y,q,k),$.updateMultisampleRenderTarget(Me),$.updateRenderTargetMipmap(Me),$e.has("WEBGL_multisampled_render_to_texture")===!1){let Pe=!1;for(let ut=0,At=U.length;ut<At;ut++){let yt=U[ut],{object:gt,geometry:Ot,material:we,group:Xt}=yt;if(we.side===cn&&gt.layers.test(k.layers)){let ot=we.side;we.side=Ft,we.needsUpdate=!0,jc(gt,q,k,Ot,we,Xt),we.side=ot,we.needsUpdate=!0,Pe=!0}}Pe===!0&&($.updateMultisampleRenderTarget(Me),$.updateRenderTargetMipmap(Me))}I.setRenderTarget(be,Ie,Fe),I.setClearColor(tt,Je),nt!==void 0&&(k.viewport=nt),I.toneMapping=je}function Ur(y,U,q){let k=U.isScene===!0?U.overrideMaterial:null;for(let H=0,Me=y.length;H<Me;H++){let Re=y[H],{object:be,geometry:Ie,group:Fe}=Re,je=Re.material;je.allowOverride===!0&&k!==null&&(je=k),be.layers.test(q.layers)&&jc(be,U,q,Ie,je,Fe)}}function jc(y,U,q,k,H,Me){B!==null&&H.isNodeMaterial&&B.setObject(y,H),y.onBeforeRender(I,U,q,k,H,Me),y.modelViewMatrix.multiplyMatrices(q.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),H.onBeforeRender(I,U,q,k,y,Me),H.transparent===!0&&H.side===cn&&H.forceSinglePass===!1?(H.side=Ft,H.needsUpdate=!0,I.renderBufferDirect(q,U,k,H,y,Me),H.side=li,H.needsUpdate=!0,I.renderBufferDirect(q,U,k,H,y,Me),H.side=cn):I.renderBufferDirect(q,U,k,H,y,Me),y.onAfterRender(I,U,q,k,H,Me)}function Fr(y,U,q){U.isScene!==!0&&(U=Ce);let k=V.get(y),H=S.state.lights,Me=S.state.shadowsArray,Re=H.state.version,be=pe.getParameters(y,H.state,Me,U,q,S.state.lightProbeGridArray),Ie=pe.getProgramCacheKey(be),Fe=k.programs;k.environment=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?U.environment:null,k.fog=U.fog;let je=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap;k.envMap=de.get(y.envMap||k.environment,je),k.envMapRotation=k.environment!==null&&y.envMap===null?U.environmentRotation:y.envMapRotation,Fe===void 0&&(y.addEventListener("dispose",Sn),Fe=new Map,k.programs=Fe);let nt=Fe.get(Ie);if(nt!==void 0){if(k.currentProgram===nt&&k.lightsStateVersion===Re)return eh(y,be),nt}else be.uniforms=pe.getUniforms(y),B!==null&&y.isNodeMaterial&&B.build(y,q,be),y.onBeforeCompile(be,I),nt=pe.acquireProgram(be,Ie),Fe.set(Ie,nt),k.uniforms=be.uniforms;let Pe=k.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Pe.clippingPlanes=Be.uniform),eh(y,be),k.needsLights=qd(y),k.lightsStateVersion=Re,k.needsLights&&(Pe.ambientLightColor.value=H.state.ambient,Pe.lightProbe.value=H.state.probe,Pe.sunLights.value=H.state.sun,Pe.sunLightShadows.value=H.state.sunShadow,Pe.directionalLights.value=H.state.directional,Pe.directionalLightShadows.value=H.state.directionalShadow,Pe.spotLights.value=H.state.spot,Pe.spotLightShadows.value=H.state.spotShadow,Pe.rectAreaLights.value=H.state.rectArea,Pe.ltc_1.value=H.state.rectAreaLTC1,Pe.ltc_2.value=H.state.rectAreaLTC2,Pe.pointLights.value=H.state.point,Pe.pointLightShadows.value=H.state.pointShadow,Pe.hemisphereLights.value=H.state.hemi,Pe.sunShadowMatrix.value=H.state.sunShadowMatrix,Pe.sunShadowCascade.value=H.state.sunShadowCascade,Pe.directionalShadowMatrix.value=H.state.directionalShadowMatrix,Pe.spotLightMatrix.value=H.state.spotLightMatrix,Pe.spotLightMap.value=H.state.spotLightMap,Pe.pointShadowMatrix.value=H.state.pointShadowMatrix),k.lightProbeGrid=S.state.lightProbeGridArray.length>0,k.currentProgram=nt,k.uniformsList=null,nt}function Qc(y){if(y.uniformsList===null){let U=y.currentProgram.getUniforms();y.uniformsList=ws.seqWithValue(U.seq,y.uniforms)}return y.uniformsList}function eh(y,U){let q=V.get(y);q.outputColorSpace=U.outputColorSpace,q.batching=U.batching,q.batchingColor=U.batchingColor,q.instancing=U.instancing,q.instancingColor=U.instancingColor,q.instancingMorph=U.instancingMorph,q.skinning=U.skinning,q.morphTargets=U.morphTargets,q.morphNormals=U.morphNormals,q.morphColors=U.morphColors,q.morphTargetsCount=U.morphTargetsCount,q.numClippingPlanes=U.numClippingPlanes,q.numIntersection=U.numClipIntersection,q.vertexAlphas=U.vertexAlphas,q.vertexTangents=U.vertexTangents,q.toneMapping=U.toneMapping}function Vd(y,U){if(y.length===0)return null;if(y.length===1)return y[0].texture!==null?y[0]:null;v.setFromMatrixPosition(U.matrixWorld);for(let q=0,k=y.length;q<k;q++){let H=y[q];if(H.texture!==null&&H.boundingBox.containsPoint(v))return H}return null}function Wd(y,U,q,k,H){U.isScene!==!0&&(U=Ce),$.resetTextureUnits();let Me=U.fog,Re=k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial?U.environment:null,be=re===null?I.outputColorSpace:re.isXRRenderTarget===!0?re.texture.colorSpace:it.workingColorSpace,Ie=k.isMeshStandardMaterial||k.isMeshLambertMaterial&&!k.envMap||k.isMeshPhongMaterial&&!k.envMap,Fe=de.get(k.envMap||Re,Ie),je=k.vertexColors===!0&&!!q.attributes.color&&q.attributes.color.itemSize===4,nt=!!q.attributes.tangent&&(!!k.normalMap||k.anisotropy>0),Pe=!!q.morphAttributes.position,ut=!!q.morphAttributes.normal,At=!!q.morphAttributes.color,yt=_n;k.toneMapped&&(re===null||re.isXRRenderTarget===!0)&&(yt=I.toneMapping);let gt=q.morphAttributes.position||q.morphAttributes.normal||q.morphAttributes.color,Ot=gt!==void 0?gt.length:0,we=V.get(k),Xt=S.state.lights;if(le===!0&&(ce===!0||y!==ee)){let _t=y===ee&&k.id===Z;Be.setState(k,y,_t)}let ot=!1;k.version===we.__version?(we.needsLights&&we.lightsStateVersion!==Xt.state.version||we.outputColorSpace!==be||H.isBatchedMesh&&we.batching===!1||!H.isBatchedMesh&&we.batching===!0||H.isBatchedMesh&&we.batchingColor===!0&&H._colorsTexture===null||H.isBatchedMesh&&we.batchingColor===!1&&H._colorsTexture!==null||H.isInstancedMesh&&we.instancing===!1||!H.isInstancedMesh&&we.instancing===!0||H.isSkinnedMesh&&we.skinning===!1||!H.isSkinnedMesh&&we.skinning===!0||H.isInstancedMesh&&we.instancingColor===!0&&H.instanceColor===null||H.isInstancedMesh&&we.instancingColor===!1&&H.instanceColor!==null||H.isInstancedMesh&&we.instancingMorph===!0&&H.morphTexture===null||H.isInstancedMesh&&we.instancingMorph===!1&&H.morphTexture!==null||we.envMap!==Fe||k.fog===!0&&we.fog!==Me||we.numClippingPlanes!==void 0&&(we.numClippingPlanes!==Be.numPlanes||we.numIntersection!==Be.numIntersection)||we.vertexAlphas!==je||we.vertexTangents!==nt||we.morphTargets!==Pe||we.morphNormals!==ut||we.morphColors!==At||we.toneMapping!==yt||we.morphTargetsCount!==Ot||!!we.lightProbeGrid!=S.state.lightProbeGridArray.length>0)&&(ot=!0):(ot=!0,we.__version=k.version);let rn=we.currentProgram;ot===!0&&(rn=Fr(k,U,H),B&&k.isNodeMaterial&&B.onUpdateProgram(k,rn,we));let En=!1,kn=!1,Hi=!1,mt=rn.getUniforms(),Tt=we.uniforms;if(x.useProgram(rn.program)&&(En=!0,kn=!0,Hi=!0),k.id!==Z&&(Z=k.id,kn=!0),we.needsLights){let _t=Vd(S.state.lightProbeGridArray,H);we.lightProbeGrid!==_t&&(we.lightProbeGrid=_t,kn=!0)}if(En||ee!==y){x.buffers.depth.getReversed()&&y.reversedDepth!==!0&&(y._reversedDepth=!0,y.updateProjectionMatrix()),mt.setValue(D,"projectionMatrix",y.projectionMatrix),mt.setValue(D,"viewMatrix",y.matrixWorldInverse);let Gn=mt.map.cameraPosition;Gn!==void 0&&Gn.setValue(D,j.setFromMatrixPosition(y.matrixWorld)),T.logarithmicDepthBuffer&&mt.setValue(D,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(k.isMeshPhongMaterial||k.isMeshToonMaterial||k.isMeshLambertMaterial||k.isMeshBasicMaterial||k.isMeshStandardMaterial||k.isShaderMaterial)&&mt.setValue(D,"isOrthographic",y.isOrthographicCamera===!0),ee!==y&&(ee=y,kn=!0,Hi=!0)}if(we.needsLights&&(Xt.state.sunShadowMap.length>0&&mt.setValue(D,"sunShadowMap",Xt.state.sunShadowMap,$),Xt.state.directionalShadowMap.length>0&&mt.setValue(D,"directionalShadowMap",Xt.state.directionalShadowMap,$),Xt.state.spotShadowMap.length>0&&mt.setValue(D,"spotShadowMap",Xt.state.spotShadowMap,$),Xt.state.pointShadowMap.length>0&&mt.setValue(D,"pointShadowMap",Xt.state.pointShadowMap,$)),H.isSkinnedMesh){mt.setOptional(D,H,"bindMatrix"),mt.setOptional(D,H,"bindMatrixInverse");let _t=H.skeleton;_t&&(_t.boneTexture===null&&_t.computeBoneTexture(),mt.setValue(D,"boneTexture",_t.boneTexture,$))}H.isBatchedMesh&&(mt.setOptional(D,H,"batchingTexture"),mt.setValue(D,"batchingTexture",H._matricesTexture,$),mt.setOptional(D,H,"batchingIdTexture"),mt.setValue(D,"batchingIdTexture",H._indirectTexture,$),mt.setOptional(D,H,"batchingColorTexture"),H._colorsTexture!==null&&mt.setValue(D,"batchingColorTexture",H._colorsTexture,$));let Hn=q.morphAttributes;if((Hn.position!==void 0||Hn.normal!==void 0||Hn.color!==void 0)&&F.update(H,q,rn),(kn||we.receiveShadow!==H.receiveShadow)&&(we.receiveShadow=H.receiveShadow,mt.setValue(D,"receiveShadow",H.receiveShadow)),(k.isMeshStandardMaterial||k.isMeshLambertMaterial||k.isMeshPhongMaterial)&&k.envMap===null&&U.environment!==null&&(Tt.envMapIntensity.value=U.environmentIntensity),Tt.dfgLUT!==void 0&&(Tt.dfgLUT.value=g_()),kn){if(mt.setValue(D,"toneMappingExposure",I.toneMappingExposure),we.needsLights&&Xd(Tt,Hi),Me&&k.fog===!0&&Oe.refreshFogUniforms(Tt,Me),Oe.refreshMaterialUniforms(Tt,k,te,K,S.state.transmissionRenderTarget[y.id]),we.needsLights&&we.lightProbeGrid){let _t=we.lightProbeGrid;Tt.probesSH.value=_t.texture,Tt.probesMin.value.copy(_t.boundingBox.min),Tt.probesMax.value.copy(_t.boundingBox.max),Tt.probesResolution.value.copy(_t.resolution)}ws.upload(D,Qc(we),Tt,$)}if(k.isShaderMaterial&&k.uniformsNeedUpdate===!0&&(ws.upload(D,Qc(we),Tt,$),k.uniformsNeedUpdate=!1),k.isSpriteMaterial&&mt.setValue(D,"center",H.center),mt.setValue(D,"modelViewMatrix",H.modelViewMatrix),mt.setValue(D,"normalMatrix",H.normalMatrix),mt.setValue(D,"modelMatrix",H.matrixWorld),k.uniformsGroups!==void 0){let _t=k.uniformsGroups;for(let Gn=0,Gi=_t.length;Gn<Gi;Gn++){let nh=_t[Gn];oe.update(nh,rn),oe.bind(nh,rn)}}return rn}function Xd(y,U){y.ambientLightColor.needsUpdate=U,y.lightProbe.needsUpdate=U,y.sunLights.needsUpdate=U,y.sunLightShadows.needsUpdate=U,y.directionalLights.needsUpdate=U,y.directionalLightShadows.needsUpdate=U,y.pointLights.needsUpdate=U,y.pointLightShadows.needsUpdate=U,y.spotLights.needsUpdate=U,y.spotLightShadows.needsUpdate=U,y.rectAreaLights.needsUpdate=U,y.hemisphereLights.needsUpdate=U}function qd(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return X},this.getActiveMipmapLevel=function(){return Y},this.getRenderTarget=function(){return re},this.setRenderTargetTextures=function(y,U,q){let k=V.get(y);k.__autoAllocateDepthBuffer=y.resolveDepthBuffer===!1,k.__autoAllocateDepthBuffer===!1&&(k.__useRenderToTexture=!1),V.get(y.texture).__webglTexture=U,V.get(y.depthTexture).__webglTexture=k.__autoAllocateDepthBuffer?void 0:q,k.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(y,U){let q=V.get(y);q.__webglFramebuffer=U,q.__useDefaultFramebuffer=U===void 0},this.setRenderTarget=function(y,U=0,q=0){re=y,X=U,Y=q;let k=null,H=!1,Me=!1;if(y){let be=V.get(y);if(be.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(D.FRAMEBUFFER,be.__webglFramebuffer),ne.copy(y.viewport),De.copy(y.scissor),Te=y.scissorTest,x.viewport(ne),x.scissor(De),x.setScissorTest(Te),Z=-1;return}else if(be.__webglFramebuffer===void 0)$.setupRenderTarget(y);else if(be.__hasExternalTextures)$.rebindTextures(y,V.get(y.texture).__webglTexture,V.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let je=y.depthTexture;if(be.__boundDepthTexture!==je){if(je!==null&&V.has(je)&&(y.width!==je.image.width||y.height!==je.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");$.setupDepthRenderbuffer(y)}}let Ie=y.texture;(Ie.isData3DTexture||Ie.isDataArrayTexture||Ie.isCompressedArrayTexture)&&(Me=!0);let Fe=V.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(Fe[U])?k=Fe[U][q]:k=Fe[U],H=!0):y.samples>0&&$.useMultisampledRTT(y)===!1?k=V.get(y).__webglMultisampledFramebuffer:Array.isArray(Fe)?k=Fe[q]:k=Fe,ne.copy(y.viewport),De.copy(y.scissor),Te=y.scissorTest}else ne.copy(Se).multiplyScalar(te).floor(),De.copy(He).multiplyScalar(te).floor(),Te=rt;if(q!==0&&(k=G),x.bindFramebuffer(D.FRAMEBUFFER,k)&&x.drawBuffers(y,k),x.viewport(ne),x.scissor(De),x.setScissorTest(Te),H){let be=V.get(y.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+U,be.__webglTexture,q)}else if(Me){let be=U;for(let Ie=0;Ie<y.textures.length;Ie++){let Fe=V.get(y.textures[Ie]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Ie,Fe.__webglTexture,q,be)}}else if(y!==null&&q!==0){let be=V.get(y.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,be.__webglTexture,q)}Z=-1};function th(y){let U=V.get(y);return(U.__readFormat!==y.format||U.__readType!==y.type)&&(U.__readFormat=y.format,U.__readType=y.type,U.__formatReadable=T.textureFormatReadable(y.format),U.__typeReadable=T.textureTypeReadable(y.type)),U}this.readRenderTargetPixels=function(y,U,q,k,H,Me,Re,be=0){if(!(y&&y.isWebGLRenderTarget)){qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ie=V.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Re!==void 0&&(Ie=Ie[Re]),Ie){x.bindFramebuffer(D.FRAMEBUFFER,Ie);try{let Fe=y.textures[be],je=Fe.format,nt=Fe.type;y.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+be);let Pe=th(Fe);if(Pe.__formatReadable===!1){qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Pe.__typeReadable===!1){qe("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}U>=0&&U<=y.width-k&&q>=0&&q<=y.height-H&&D.readPixels(U,q,k,H,xe.convert(je),xe.convert(nt),Me)}finally{let Fe=re!==null?V.get(re).__webglFramebuffer:null;x.bindFramebuffer(D.FRAMEBUFFER,Fe)}}},this.readRenderTargetPixelsAsync=async function(y,U,q,k,H,Me,Re,be=0){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ie=V.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&Re!==void 0&&(Ie=Ie[Re]),Ie)if(U>=0&&U<=y.width-k&&q>=0&&q<=y.height-H){x.bindFramebuffer(D.FRAMEBUFFER,Ie);let Fe=y.textures[be],je=Fe.format,nt=Fe.type;y.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+be);let Pe=th(Fe);if(Pe.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Pe.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let ut=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,ut),D.bufferData(D.PIXEL_PACK_BUFFER,Me.byteLength,D.STREAM_READ),D.readPixels(U,q,k,H,xe.convert(je),xe.convert(nt),0),D.bindBuffer(D.PIXEL_PACK_BUFFER,null);let At=re!==null?V.get(re).__webglFramebuffer:null;x.bindFramebuffer(D.FRAMEBUFFER,At);let yt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await Su(D,yt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,ut),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,Me),D.bindBuffer(D.PIXEL_PACK_BUFFER,null),D.deleteBuffer(ut),D.deleteSync(yt),Me}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(y,U=null,q=0){let k=Math.pow(2,-q),H=Math.floor(y.image.width*k),Me=Math.floor(y.image.height*k),Re=U!==null?U.x:0,be=U!==null?U.y:0;$.setTexture2D(y,0),D.copyTexSubImage2D(D.TEXTURE_2D,q,0,0,Re,be,H,Me),x.unbindTexture()},this.copyTextureToTexture=function(y,U,q=null,k=null,H=0,Me=0){let Re,be,Ie,Fe,je,nt,Pe,ut,At,yt=y.isCompressedTexture?y.mipmaps[Me]:y.image;if(q!==null)Re=q.max.x-q.min.x,be=q.max.y-q.min.y,Ie=q.isBox3?q.max.z-q.min.z:1,Fe=q.min.x,je=q.min.y,nt=q.isBox3?q.min.z:0;else{let Tt=Math.pow(2,-H);Re=Math.floor(yt.width*Tt),be=Math.floor(yt.height*Tt),y.isDataArrayTexture?Ie=yt.depth:y.isData3DTexture?Ie=Math.floor(yt.depth*Tt):Ie=1,Fe=0,je=0,nt=0}k!==null?(Pe=k.x,ut=k.y,At=k.z):(Pe=0,ut=0,At=0);let gt=xe.convert(U.format),Ot=xe.convert(U.type),we;U.isData3DTexture?($.setTexture3D(U,0),we=D.TEXTURE_3D):U.isDataArrayTexture||U.isCompressedArrayTexture?($.setTexture2DArray(U,0),we=D.TEXTURE_2D_ARRAY):($.setTexture2D(U,0),we=D.TEXTURE_2D),x.activeTexture(D.TEXTURE0),x.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,U.flipY),x.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,U.premultiplyAlpha),x.pixelStorei(D.UNPACK_ALIGNMENT,U.unpackAlignment);let Xt=x.getParameter(D.UNPACK_ROW_LENGTH),ot=x.getParameter(D.UNPACK_IMAGE_HEIGHT),rn=x.getParameter(D.UNPACK_SKIP_PIXELS),En=x.getParameter(D.UNPACK_SKIP_ROWS),kn=x.getParameter(D.UNPACK_SKIP_IMAGES);x.pixelStorei(D.UNPACK_ROW_LENGTH,yt.width),x.pixelStorei(D.UNPACK_IMAGE_HEIGHT,yt.height),x.pixelStorei(D.UNPACK_SKIP_PIXELS,Fe),x.pixelStorei(D.UNPACK_SKIP_ROWS,je),x.pixelStorei(D.UNPACK_SKIP_IMAGES,nt);let Hi=y.isDataArrayTexture||y.isData3DTexture,mt=U.isDataArrayTexture||U.isData3DTexture;if(y.isDepthTexture){let Tt=V.get(y),Hn=V.get(U),_t=V.get(Tt.__renderTarget),Gn=V.get(Hn.__renderTarget);x.bindFramebuffer(D.READ_FRAMEBUFFER,_t.__webglFramebuffer),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,Gn.__webglFramebuffer);for(let Gi=0;Gi<Ie;Gi++)Hi&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,V.get(y).__webglTexture,H,nt+Gi),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,V.get(U).__webglTexture,Me,At+Gi)),D.blitFramebuffer(Fe,je,Re,be,Pe,ut,Re,be,D.DEPTH_BUFFER_BIT,D.NEAREST);x.bindFramebuffer(D.READ_FRAMEBUFFER,null),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(H!==0||y.isRenderTargetTexture||V.has(y)){let Tt=V.get(y),Hn=V.get(U);x.bindFramebuffer(D.READ_FRAMEBUFFER,N),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,z);for(let _t=0;_t<Ie;_t++)Hi?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Tt.__webglTexture,H,nt+_t):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Tt.__webglTexture,H),mt?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Hn.__webglTexture,Me,At+_t):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Hn.__webglTexture,Me),H!==0?D.blitFramebuffer(Fe,je,Re,be,Pe,ut,Re,be,D.COLOR_BUFFER_BIT,D.NEAREST):mt?D.copyTexSubImage3D(we,Me,Pe,ut,At+_t,Fe,je,Re,be):D.copyTexSubImage2D(we,Me,Pe,ut,Fe,je,Re,be);x.bindFramebuffer(D.READ_FRAMEBUFFER,null),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else mt?y.isDataTexture||y.isData3DTexture?D.texSubImage3D(we,Me,Pe,ut,At,Re,be,Ie,gt,Ot,yt.data):U.isCompressedArrayTexture?D.compressedTexSubImage3D(we,Me,Pe,ut,At,Re,be,Ie,gt,yt.data):D.texSubImage3D(we,Me,Pe,ut,At,Re,be,Ie,gt,Ot,yt):y.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,Me,Pe,ut,Re,be,gt,Ot,yt.data):y.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,Me,Pe,ut,yt.width,yt.height,gt,yt.data):D.texSubImage2D(D.TEXTURE_2D,Me,Pe,ut,Re,be,gt,Ot,yt);x.pixelStorei(D.UNPACK_ROW_LENGTH,Xt),x.pixelStorei(D.UNPACK_IMAGE_HEIGHT,ot),x.pixelStorei(D.UNPACK_SKIP_PIXELS,rn),x.pixelStorei(D.UNPACK_SKIP_ROWS,En),x.pixelStorei(D.UNPACK_SKIP_IMAGES,kn),Me===0&&U.generateMipmaps&&D.generateMipmap(we),x.unbindTexture()},this.initRenderTarget=function(y){V.get(y).__webglFramebuffer===void 0&&$.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?$.setTextureCube(y,0):y.isData3DTexture?$.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?$.setTexture2DArray(y,0):$.setTexture2D(y,0),x.unbindTexture()},this.resetState=function(){X=0,Y=0,re=null,x.reset(),Ee.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return xn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=it._getDrawingBufferColorSpace(e),t.unpackColorSpace=it._getUnpackColorSpace()}};var Wa=class{materials=new Map;geometries=new Map;templates=new Map;toonBands=(()=>{let e=new Qn(new Uint8Array([150,212,255]),3,1,Mr);return e.minFilter=Mt,e.magFilter=Mt,e.needsUpdate=!0,e})();template(e,t){let i=this.templates.get(e);return i||(i=t(),this.templates.set(e,i)),i}solid(e){let t=`solid:${new Le(e).getHexString()}`,i=this.materials.get(t);return i||(i=new si({color:e,gradientMap:this.toonBands}),this.materials.set(t,i)),i}glow(e){let t=`glow:${new Le(e).getHexString()}`,i=this.materials.get(t);return i||(i=new Jt({color:e}),this.materials.set(t,i)),i}vertexColored(){let e=this.materials.get("vertex");return e||(e=new si({vertexColors:!0,gradientMap:this.toonBands}),this.materials.set("vertex",e)),e}shadow(){let e=this.materials.get("shadow");return e||(e=new Jt({color:1773616,transparent:!0,opacity:.22,depthWrite:!1}),this.materials.set("shadow",e)),e}geometry(e,t){let i=this.geometries.get(e);return i||(i=t(),this.geometries.set(e,i)),i}box(){return this.geometry("box",()=>new ti(1,1,1))}sphere(e=1){return this.geometry(`sphere:${e}`,()=>new wi(.5,e))}cylinder(e=10,t=1){return this.geometry(`cylinder:${e}:${t}`,()=>new ni(.5*t,.5,1,e))}cone(e=10){return this.geometry(`cone:${e}`,()=>new ir(.5,1,e))}torus(e=.18,t=Math.PI*2){return this.geometry(`torus:${e}:${t.toFixed(3)}`,()=>new Ai(.5,e,6,18,t))}shadowDisc(){return this.geometry("shadow-disc",()=>{let e=new nr(1,24);return e.rotateX(-Math.PI/2),e})}dispose(){for(let e of this.templates.values())e.traverse(t=>{t instanceof Ye&&t.userData.ownedGeometry&&t.geometry.dispose()});this.templates.clear(),this.toonBands.dispose();for(let e of this.materials.values())e.dispose();for(let e of this.geometries.values())e.dispose();this.materials.clear(),this.geometries.clear()}},ct=[16732013,16752412,16765503,3919532,961897,3835647,8599788,16740277,49873,15817653,10221311,16704576,15681391,448160];function Ne(n,e){return e[Math.floor(n()*e.length)%e.length]}var ad=[{core:16250346,nub:"round",rainbow:!1},{core:16771055,nub:"round",rainbow:!1},{core:16774072,nub:"spike",rainbow:!1},{core:14677478,nub:"spike",rainbow:!1},{core:14478591,nub:"crystal",rainbow:!1},{core:15458559,nub:"crystal",rainbow:!1},{core:16775398,nub:"crystal",rainbow:!0}],ld=[[15222076,16447212,16238910],[4173386,16447212,15222076],[3833814,16238910,15222076],[15764004,16447212,4173386],[16238910,15222076,3833814]];function x_(n){return ad[Math.min(Math.max(0,n),ad.length-1)]}var cd=8,hd=[16773749,16748459,10221311,12188608,16762623,16766629,10536191,16646070];function __(){let n=new wi(.5,0).getAttribute("position"),e=new Set,t=[];for(let i=0;i<n.count;i+=1){let s=new P().fromBufferAttribute(n,i).normalize(),r=s.toArray().map(o=>o.toFixed(2)).join(",");e.has(r)||(e.add(r),t.push(s))}return t}var v_=__(),y_=new P(0,1,0);function Bc(n,e,t,i){n.clear();let s=x_(i);n.add(new Ye(e.sphere(2),e.solid(s.core)));let r=ct.indexOf(t);v_.forEach((o,a)=>{let l=s.rainbow?[ct[a%ct.length],16447212,ct[(a+5)%ct.length]]:ld[(a+Math.max(0,r))%ld.length],c=new ae;c.position.copy(o).multiplyScalar(.47),c.quaternion.setFromUnitVectors(y_,o);let h=(d,u,f,g)=>{let b=new Ye(e.sphere(2),e.solid(d));b.scale.set(u,f,u),b.position.y=g,c.add(b)};if(h(l[0],.3,.12,.02),h(l[1],.21,.12,.035),s.nub==="round")h(l[2],.11,.1,.06);else{let d=s.nub==="spike"?e.cone(6):e.geometry("octahedron",()=>new ii(.5,0)),u=new Ye(d,e.solid(l[2]));u.scale.set(.11,s.nub==="spike"?.18:.2,.11),u.position.y=.1,c.add(u)}n.add(c)})}var Xa=class{constructor(e){this.kit=e;this.halo=new Ye(e.torus(.05),e.glow(16765503)),this.halo.visible=!1,this.group.add(this.halo)}kit;group=new ae;moons=[];halo;count=0;get total(){return this.count}setCount(e,t){this.count=e;let i=Math.min(e,cd);for(;this.moons.length>i;){let s=this.moons.pop();s&&this.group.remove(s.mesh)}for(;this.moons.length<i;){let s=this.moons.length,r=new ae,o=this.kit.glow(hd[s%hd.length]),a=this.kit.geometry("octahedron",()=>new ii(.5,0)),l=new Ye(a,o);l.scale.set(1,1.6,1);let c=new Ye(a,o);c.scale.set(1.6,1,1),r.add(l,c),this.group.add(r),this.moons.push({mesh:r,tilt:new Zt().setFromEuler(new ln(.35+s%3*.3,s*.9,(s%2===0?1:-1)*.25)),phase:s/Math.max(1,i)*Math.PI*2,speed:1.1+s%3*.25,arrival:t?0:1})}this.halo.visible=e>cd}update(e,t,i){let s=t*1.45,r=t*.24;for(let o of this.moons){o.arrival=Math.min(1,o.arrival+e*1.4);let a=1-(1-o.arrival)**3;o.phase+=o.speed*e,o.mesh.position.set(Math.cos(o.phase)*s*a,Math.sin(i*2+o.phase)*t*.08,Math.sin(o.phase)*s*a).applyQuaternion(o.tilt),o.mesh.scale.setScalar(r*(.4+a*.6)*(1+Math.sin(i*6+o.phase)*.12)),o.mesh.rotation.y+=e*3}this.halo.scale.setScalar(t*2.9),this.halo.rotation.set(Math.PI/2+.3,0,i*.4)}};var ud={head:"hammer",suit:8176194,hem:5213995,stripe:11853170,legs:8006284},b_=[ud,ud,{head:"hammer",suit:15895986,hem:12736383,stripe:16565978,legs:4020888},{head:"tall",suit:5220317,hem:3108767,stripe:10474738,legs:15764004},{head:"round",suit:16172354,hem:12880925,stripe:16507802,legs:3902282},{head:"block",suit:10976214,hem:7293600,stripe:13876720,legs:15223391},{head:"hammer",suit:15962175,hem:12148255,stripe:16434319,legs:3037864},{head:"tall",suit:4569248,hem:2784620,stripe:10477775,legs:9185882},{head:"round",suit:15228253,hem:11024440,stripe:16231082,legs:4864652}],dd=16111946,M_=15916224,S_=2826803,Za=5;function E_(n){return n.geometry("star",()=>{let e=new gs;for(let i=0;i<10;i+=1){let s=i/10*Math.PI*2+Math.PI/2,r=i%2===0?.5:.22,o=Math.cos(s)*r,a=Math.sin(s)*r;i===0?e.moveTo(o,a):e.lineTo(o,a)}e.closePath();let t=new fr(e,{depth:.18,bevelEnabled:!1});return t.center(),t})}function Et(n,e,t,i,s,r=[0,0,0]){let o=new Ye(e,t);return o.scale.set(...i),o.position.set(...s),o.rotation.set(...r),n.add(o),o}function qa(n,e,t,i,s,r){let o=new ae;return o.position.set(...r),Et(o,n.cylinder(8),e,[i*2,t,i*2],[0,-t/2,0]),Et(o,n.sphere(1),e,[s*2,s*2,s*2],[0,-t,0]),o}function Ya(n,e,t,i,s){let r=n.solid(S_);Et(e,n.box(),n.solid(dd),[.02,s,i],[t,0,0]),Et(e,n.box(),n.solid(M_),[.024,s*.78,i*.78],[t+.004,0,0]);let o=s*.12;for(let a of[-1,1])Et(e,n.sphere(0),r,[.02,.03,.02],[t+.016,o,a*i*.2]),Et(e,n.box(),r,[.01,.012,i*.14],[t+.016,o+s*.17,a*i*.2],[a*.3,0,0]);Et(e,n.cone(4),n.solid(15764004),[.04,.05,.04],[t+.03,-s*.02,0],[0,0,-Math.PI/2]),Et(e,n.cylinder(10),n.solid(14169135),[.045,.012,.05],[t+.016,-s*.24,0],[0,0,Math.PI/2])}function fd(n,e){let t=on(e),i=Ne(t,b_),s=n.solid(i.suit),r=n.solid(i.legs),o=new ae,a=new ae;o.add(a);let l=qa(n,r,.27,.03,.055,[0,.32,-.075]),c=qa(n,r,.27,.03,.055,[0,.32,.075]);a.add(l,c),Et(a,n.cylinder(16,.52),s,[.34,.34,.34],[0,.47,0]),Et(a,n.cylinder(16),n.solid(i.hem),[.36,.04,.36],[0,.31,0]);let h=qa(n,s,.24,.026,.05,[0,.58,-.1]),d=qa(n,s,.24,.026,.05,[0,.58,.1]);a.add(h,d);let u=new ae;u.position.y=.8,a.add(u);let f=n.solid(i.stripe),g=.18;switch(i.head){case"hammer":{Et(u,n.cylinder(18),s,[.34,.72,.34],[0,0,0],[Math.PI/2,0,0]);for(let M of[-1,1])Et(u,n.sphere(2),s,[.34,.34,.34],[0,0,M*.36]),Et(u,n.cylinder(18),f,[.345,.05,.345],[0,0,M*.27],[Math.PI/2,0,0]),Et(u,n.cylinder(18),f,[.345,.03,.345],[0,0,M*.2],[Math.PI/2,0,0]);Ya(n,u,.17,.24,.29);break}case"tall":{Et(u,n.cylinder(16),s,[.3,.46,.3],[0,.1,0]),Et(u,n.sphere(2),s,[.3,.2,.3],[0,.33,0]),Et(u,n.cylinder(16),f,[.305,.05,.305],[0,.27,0]),Ya(n,u,.15,.2,.22),g=.42;break}case"round":{Et(u,n.sphere(2),s,[.4,.38,.4],[0,.02,0]),Et(u,n.torus(.08),f,[.34,.34,.34],[0,.02,0],[Math.PI/2,0,0]),Ya(n,u,.19,.18,.2),g=.22;break}case"block":{Et(u,n.box(),s,[.34,.32,.4],[0,.02,0]),Et(u,n.box(),f,[.35,.05,.41],[0,.14,0]),Ya(n,u,.17,.22,.22),g=.19;break}}Et(u,n.cone(12),n.solid(dd),[.08,.13,.08],[0,g+.05,0]);let b=Et(u,n.sphere(2),n.solid(14692651),[.075,.075,.075],[0,g+.14,0]),m=new ae;m.position.y=g+.12;let p=E_(n);for(let M=0;M<Za;M+=1){let A=new ae;A.rotation.y=M/Za*Math.PI*2,Et(A,p,n.glow(M%2===0?16769357:16774054),[.16,.16,.16],[.34,0,0]),A.visible=!1,m.add(A)}return u.add(m),{root:o,body:a,head:u,leftLeg:l,rightLeg:c,leftArm:h,rightArm:d,cape:null,antennaTip:b,dizzyStars:m}}function pd(n,e){let t=Math.min(1,e.speed/1.2),i=Math.sin(e.stride)*.9*t;n.leftLeg.rotation.z=i,n.rightLeg.rotation.z=-i,n.body.position.y=Math.abs(Math.sin(e.stride))*.04*t,n.body.rotation.z=-.35*t;let s=e.dizziness;n.body.rotation.x=Math.sin(e.time*(1.6+s))*.2*s;let r=e.reach,o=Math.sin(e.time*2.2)*.03;if(e.waiting){let c=Math.sin(e.time*7)*.5,h=Math.sin(e.time*.7)>.55;n.leftArm.rotation.set(0,0,o),n.rightArm.rotation.set(h?-2.6+c:0,0,0),n.body.rotation.y=sn.lerp(n.body.rotation.y,Math.PI*.8,.08)}else{let c=sn.lerp(o,r,Math.max(t,.35));n.leftArm.rotation.set(0,0,c+(t>0?Math.sin(e.stride)*.08:0)),n.rightArm.rotation.set(0,0,c-(t>0?Math.sin(e.stride)*.08:0)),n.body.rotation.y=sn.lerp(n.body.rotation.y,0,.12)}let a=e.idleSeconds>1.5?Math.sin(e.time*.9):0;n.head.rotation.y=a*.6*(1-s);let l=e.time*(2.4+s*2);n.head.rotation.x=Math.sin(l)*.4*s,n.head.rotation.z=t*.15+Math.sin(e.time*3)*.02+Math.cos(l)*.3*s,n.dizzyStars.rotation.y=e.time*(3+s*3),n.dizzyStars.children.forEach((c,h)=>{c.visible=h<e.stars,c.position.y=Math.sin(e.time*5+h*1.7)*.04,c.children[0]?.rotation.set(0,Math.PI/2-n.dizzyStars.rotation.y-c.rotation.y,e.time*4)}),t<.05&&e.idleSeconds>3&&!e.waiting?n.rightLeg.rotation.x=Math.max(0,Math.sin(e.time*9))*.25:n.rightLeg.rotation.x=0,n.antennaTip.position.x=Math.sin(e.time*5+e.stride)*.03*(.4+t),n.cape&&(n.cape.rotation.z=-(.12+t*.42+Math.sin(e.time*11)*.08*t))}function gd(n,e=!1){let t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),s=new Set(Object.keys(n[0].morphAttributes)),r={},o={},a=n[0].morphTargetsRelative,l=new Ct,c=0;for(let h=0;h<n.length;++h){let d=n[h],u=0;if(t!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in d.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;r[f]===void 0&&(r[f]=[]),r[f].push(d.attributes[f]),u++}if(u!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". Make sure all geometries have the same number of attributes."),null;if(a!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in d.morphAttributes){if(!s.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(d.morphAttributes[f])}if(e){let f;if(t)f=d.index.count;else if(d.attributes.position!==void 0)f=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+h+". The geometry must have either an index or a position attribute"),null;l.addGroup(c,f,h),c+=f}}if(t){let h=0,d=[];for(let u=0;u<n.length;++u){let f=n[u].index;for(let g=0;g<f.count;++g)d.push(f.getX(g)+h);h+=n[u].attributes.position.count}l.setIndex(d)}for(let h in r){let d=md(r[h]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" attribute."),null;l.setAttribute(h,d)}for(let h in o){let d=o[h][0].length;if(d!==0){l.morphAttributes=l.morphAttributes||{},l.morphAttributes[h]=[];for(let u=0;u<d;++u){let f=[];for(let b=0;b<o[h].length;++b)f.push(o[h][b][u]);let g=md(f);if(!g)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+h+" morphAttribute."),null;l.morphAttributes[h].push(g)}}}return l}function md(n){let e,t,i,s=-1,r=0;for(let c=0;c<n.length;++c){let h=n[c];if(e===void 0&&(e=h.array.constructor),e!==h.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=h.itemSize),t!==h.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=h.normalized),i!==h.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(s===-1&&(s=h.gpuType),s!==h.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;r+=h.count*t}let o=new e(r),a=new kt(o,t,i),l=0;for(let c=0;c<n.length;++c){let h=n[c];if(h.isInterleavedBufferAttribute){let d=l/t;for(let u=0,f=h.count;u<f;u++)for(let g=0;g<t;g++){let b=h.getComponent(u,g);a.setComponent(u+d,g,b)}}else o.set(h.array,l);l+=h.count*t}return s!==void 0&&(a.gpuType=s),a}function R(n,e,t,i,s,r=[0,0,0]){let o=new Ye(e,t);return o.scale.set(...i),o.position.set(...s),o.rotation.set(...r),n.add(o),o}var w_=[16766901,15841676,13208926,9263675,16769996],ft=Math.PI/2,T_={kind:"thumbtack",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ae;return R(t,n.cylinder(12),n.solid(Ne(e,ct)),[1,.28,1],[0,.14,0]),R(t,n.cylinder(10),n.solid(Ne(e,ct)),[.55,.3,.55],[0,.42,0]),R(t,n.cone(6),n.solid(14278118),[.12,.9,.12],[0,1,0]),t}},A_={kind:"coin",tier:0,zones:"all",build({kit:n}){let e=new ae;return R(e,n.cylinder(14),n.solid(16103470),[1,.14,1],[0,.07,0]),R(e,n.cylinder(14),n.solid(16766556),[.72,.16,.72],[0,.08,0]),e}},R_={kind:"button",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ae;R(t,n.cylinder(14),n.solid(Ne(e,ct)),[1,.2,1],[0,.1,0]);let i=n.solid(2826560);for(let[s,r]of[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])R(t,n.cylinder(6),i,[.12,.05,.12],[s,.21,r]);return t}},C_={kind:"candy",tier:0,zones:["room","candy"],weight:1.6,build({kit:n,random:e}){let t=new ae,i=Ne(e,ct);R(t,n.sphere(1),n.solid(i),[1,.62,.62],[0,.31,0]);let s=n.solid(new Le(i).lerp(new Le(16777215),.45));return R(t,n.cone(6),s,[.42,.42,.42],[-.68,.31,0],[0,0,-ft]),R(t,n.cone(6),s,[.42,.42,.42],[.68,.31,0],[0,0,ft]),t}},I_={kind:"die",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ae;t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(16514047),[1,1,1],[0,.5,0]);let i=n.solid(e()<.3?15087942:1907514);for(let[s,r]of[[0,0],[-.25,-.25],[.25,.25],[-.25,.25],[.25,-.25]])R(t,n.sphere(0),i,[.16,.08,.16],[s,1,r]);for(let[s,r]of[[.3,-.2],[.7,.2]])R(t,n.sphere(0),i,[.08,.16,.16],[.5,s,r]);return t}},P_={kind:"battery",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ae,i=Ne(e,[2829634,15672124,3835647,448160]);return R(t,n.cylinder(10),n.solid(i),[.5,1.3,.5],[0,.25,0],[0,0,ft]),R(t,n.cylinder(10),n.solid(16761600),[.52,.35,.52],[.45,.25,0],[0,0,ft]),R(t,n.cylinder(8),n.solid(14278118),[.18,.12,.18],[.72,.25,0],[0,0,ft]),t}},D_={kind:"eraser",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ae;return R(t,n.box(),n.solid(Ne(e,[16777215,16763101,16774064])),[1,.38,.55],[0,.19,0]),R(t,n.box(),n.solid(Ne(e,[3835647,1149618,8599788])),[.6,.4,.57],[.12,.2,0]),t}},L_={kind:"mahjong",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ae;return R(t,n.box(),n.solid(2792847),[.72,.16,1],[0,.08,0]),R(t,n.box(),n.solid(16643811),[.72,.22,1],[0,.27,0]),R(t,n.box(),n.solid(Ne(e,[15087942,1914199,2792847])),[.22,.03,.5],[0,.39,0]),t}},N_={kind:"sushi",tier:0,zones:["room","beach"],build({kit:n,random:e}){let t=new ae;R(t,n.box(),n.solid(16776693),[1,.42,.55],[0,.21,0]);let i=Ne(e,[16747610,16735603,16765286]);return R(t,n.box(),n.solid(i),[1.12,.18,.62],[0,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[-.2,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[.2,.5,0]),t}},U_={kind:"strawberry",tier:0,zones:["room","candy","garden"],build({kit:n}){let e=new ae;return R(e,n.cone(8),n.solid(15741007),[.8,1,.8],[0,.5,0],[Math.PI,0,0]),R(e,n.cone(5),n.solid(3129201),[.7,.2,.7],[0,1.05,0],[Math.PI,0,0]),R(e,n.cylinder(5),n.solid(3129201),[.08,.25,.08],[0,1.2,0]),e}},F_={kind:"seashell",tier:0,zones:["beach"],weight:2,build({kit:n,random:e}){let t=new ae,i=Ne(e,[16762024,16770521,16230584,16773584]);R(t,n.sphere(1),n.solid(i),[1,.4,.85],[0,.2,0]);let s=n.solid(new Le(i).multiplyScalar(.85));for(let r=-2;r<=2;r+=1)R(t,n.box(),s,[.06,.1,.8],[r*.17,.36,0],[0,r*.18,0]);return t}},O_={kind:"starfish",tier:0,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[16747586,16735631,16761182]));for(let s=0;s<5;s+=1){let r=s/5*Math.PI*2;R(t,n.cone(5),i,[.34,.9,.2],[Math.cos(r)*.42,.1,Math.sin(r)*.42],[ft,0,r-ft])}return R(t,n.sphere(0),i,[.45,.22,.45],[0,.11,0]),t}},B_={kind:"pencil",tier:1,zones:["room","town"],build({kit:n,random:e}){let t=new ae;return t.rotation.y=e()*Math.PI,R(t,n.cylinder(6),n.solid(Ne(e,[16765503,3835647,15681391,448160])),[.3,2,.3],[0,.15,0],[0,0,ft]),R(t,n.cone(6),n.solid(15848352),[.3,.4,.3],[1.2,.15,0],[0,0,-ft]),R(t,n.cone(6),n.solid(2829634),[.1,.14,.1],[1.4,.15,0],[0,0,-ft]),R(t,n.cylinder(8),n.solid(16748459),[.3,.26,.3],[-1.1,.15,0],[0,0,ft]),t}},z_={kind:"rubber-duck",tier:1,zones:["room","beach"],build({kit:n}){let e=new ae,t=n.solid(16766474);return R(e,n.sphere(1),t,[1.1,.75,.85],[0,.38,0]),R(e,n.sphere(1),t,[.6,.6,.6],[.32,.9,0]),R(e,n.cone(6),n.solid(16743168),[.24,.34,.24],[.72,.88,0],[0,0,-ft]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,.2]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,-.2]),e}},k_={kind:"fruit",tier:1,zones:["room","garden","candy"],build({kit:n,random:e}){let t=new ae;return R(t,n.sphere(1),n.solid(Ne(e,[15087942,16752412,10212166,16765503])),[1,.95,1],[0,.48,0]),R(t,n.cylinder(5),n.solid(8015405),[.07,.25,.07],[0,1,0]),R(t,n.sphere(0),n.solid(3129201),[.28,.06,.14],[.14,1.04,0],[0,0,.4]),t}},H_={kind:"mug",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,ct));return R(t,n.cylinder(14),i,[.8,.9,.8],[0,.45,0]),R(t,n.cylinder(14),n.solid(7289631),[.68,.02,.68],[0,.88,0]),R(t,n.torus(.2),i,[.45,.45,.45],[.45,.45,0]),t}},G_={kind:"cake",tier:1,zones:["room","candy"],build({kit:n}){let e=new ae,t=n.geometry("wedge",()=>new ni(.5,.5,1,6,1,!1,0,Math.PI/3));return R(e,t,n.solid(16769187),[2,.5,2],[0,.25,0]),R(e,t,n.solid(16775408),[2.02,.12,2.02],[0,.56,0]),R(e,n.sphere(0),n.solid(15741007),[.22,.22,.22],[.35,.7,.35]),e}},V_={kind:"alarm-clock",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[15672124,3835647,448160]));return R(t,n.cylinder(16),i,[1,.4,1],[0,.6,0],[ft,0,0]),R(t,n.cylinder(16),n.solid(16777215),[.82,.42,.82],[0,.6,.02],[ft,0,0]),R(t,n.box(),n.solid(1907514),[.05,.3,.02],[0,.7,.24]),R(t,n.box(),n.solid(1907514),[.22,.05,.02],[.08,.6,.24]),R(t,n.sphere(1),i,[.36,.36,.36],[-.32,1.1,0]),R(t,n.sphere(1),i,[.36,.36,.36],[.32,1.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[-.3,.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[.3,.1,0]),t}},W_={kind:"gift",tier:1,zones:["room","candy"],build({kit:n,random:e}){let t=new ae;R(t,n.box(),n.solid(Ne(e,ct)),[1,.8,1],[0,.4,0]);let i=n.solid(Ne(e,[16777215,16765503,15681391]));return R(t,n.box(),i,[1.02,.82,.16],[0,.4,0]),R(t,n.box(),i,[.16,.82,1.02],[0,.4,0]),R(t,n.torus(.25),i,[.36,.36,.36],[-.14,.92,0],[0,0,.5]),R(t,n.torus(.25),i,[.36,.36,.36],[.14,.92,0],[0,0,-.5]),t}},X_={kind:"lollipop",tier:1,zones:["candy"],weight:2,build({kit:n,random:e}){let t=new ae;return R(t,n.cylinder(6),n.solid(16777215),[.1,1.4,.1],[0,.7,0]),R(t,n.cylinder(16),n.solid(Ne(e,ct)),[1,.2,1],[0,1.6,0],[ft,0,0]),R(t,n.torus(.14),n.solid(16777215),[.6,.6,.6],[0,1.6,.1]),t}},q_={kind:"mushroom",tier:1,zones:["forest","garden"],weight:1.6,build({kit:n,random:e}){let t=new ae;R(t,n.cylinder(8),n.solid(16773590),[.4,.6,.4],[0,.3,0]);let i=Ne(e,[15087942,16752412,8599788]);R(t,n.sphere(1),n.solid(i),[1.1,.6,1.1],[0,.7,0]);let s=n.solid(16777215);for(let[r,o]of[[.25,.1],[-.2,.25],[-.1,-.3],[.3,-.25]])R(t,n.sphere(0),s,[.14,.1,.14],[r,.92,o]);return t}},Y_={kind:"book",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ae;return t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(Ne(e,ct)),[1,.26,1.4],[0,.13,0]),R(t,n.box(),n.solid(16776170),[.94,.2,1.36],[.05,.13,0]),R(t,n.box(),n.solid(Ne(e,ct)),[.9,.24,1.3],[.1,.37,.05],[0,.3,0]),R(t,n.box(),n.solid(16776170),[.84,.18,1.26],[.15,.37,.05],[0,.3,0]),t}},Z_={kind:"teapot",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[16777215,10221311,16763101,12116178]));return R(t,n.sphere(1),i,[1.1,.85,1.1],[0,.45,0]),R(t,n.cylinder(6,.5),i,[.24,.7,.24],[.6,.6,0],[0,0,-.7]),R(t,n.torus(.2),i,[.5,.5,.5],[-.58,.5,0]),R(t,n.sphere(1),i,[.5,.2,.5],[0,.88,0]),R(t,n.sphere(0),n.solid(16765503),[.14,.14,.14],[0,1,0]),t}},$_={kind:"toy-robot",tier:2,zones:["room","town"],motion:"walk",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[12568533,3835647,15681391])),s=n.solid(2829634);return R(t,n.box(),s,[.22,.45,.22],[0,.22,-.18]),R(t,n.box(),s,[.22,.45,.22],[0,.22,.18]),R(t,n.box(),i,[.6,.6,.7],[0,.75,0]),R(t,n.box(),i,[.46,.4,.5],[0,1.28,0]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,-.12]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,.12]),R(t,n.cylinder(4),s,[.04,.3,.04],[0,1.62,0]),R(t,n.sphere(0),n.glow(16711790),[.12,.12,.12],[0,1.78,0]),R(t,n.box(),i,[.16,.5,.16],[0,.72,-.46]),R(t,n.box(),i,[.16,.5,.16],[0,.72,.46]),t}},K_={kind:"potted-flower",tier:2,zones:["room","garden","town"],build({kit:n,random:e}){let t=new ae;R(t,n.cylinder(8,1.3),n.solid(13789500),[.7,.6,.7],[0,.3,0]),R(t,n.cylinder(8),n.solid(5978665),[.84,.04,.84],[0,.6,0]),R(t,n.cylinder(5),n.solid(3129201),[.08,.8,.08],[0,1,0]);let i=n.solid(Ne(e,ct));for(let s=0;s<6;s+=1){let r=s/6*Math.PI*2;R(t,n.sphere(0),i,[.3,.12,.3],[Math.cos(r)*.24,1.42,Math.sin(r)*.24])}return R(t,n.sphere(0),n.solid(16765503),[.22,.14,.22],[0,1.44,0]),t}},J_={kind:"traffic-cone",tier:2,zones:["town"],weight:1.4,build({kit:n}){let e=new ae;return R(e,n.box(),n.solid(16739072),[.9,.1,.9],[0,.05,0]),R(e,n.cone(10),n.solid(16743168),[.7,1.3,.7],[0,.72,0]),R(e,n.cylinder(10,.75),n.solid(16777215),[.48,.22,.48],[0,.72,0]),e}},j_={kind:"beach-ball",tier:2,zones:["beach"],weight:1.4,motion:"bob",build({kit:n}){let e=new ae;return R(e,n.sphere(2),n.solid(16777215),[1,1,1],[0,.5,0]),R(e,n.torus(.16),n.solid(15672124),[.96,.96,.96],[0,.5,0]),R(e,n.torus(.16),n.solid(3835647),[.96,.96,.96],[0,.5,0],[0,ft,0]),R(e,n.torus(.16),n.solid(16765503),[.96,.96,.96],[0,.5,0],[ft,0,0]),e}},Q_={kind:"cat",tier:2,zones:["room","garden","town"],motion:"walk",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[16752453,6052974,16645629,2829110,15253629]));R(t,n.sphere(1),i,[1.3,.72,.7],[0,.55,0]),R(t,n.sphere(1),i,[.66,.6,.62],[.7,.85,0]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,-.18]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,.18]),R(t,n.cylinder(5),i,[.1,.8,.1],[-.75,.9,0],[0,0,.7]);for(let[s,r]of[[.4,.2],[.4,-.2],[-.4,.2],[-.4,-.2]])R(t,n.cylinder(5),i,[.14,.4,.14],[s,.2,r]);return R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,-.14]),R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,.14]),t}},ev={kind:"penguin",tier:2,zones:["snow"],weight:2,motion:"walk",build({kit:n}){let e=new ae;return R(e,n.sphere(1),n.solid(2236987),[.8,1.2,.75],[0,.65,0]),R(e,n.sphere(1),n.solid(16777215),[.5,.9,.6],[.2,.6,0]),R(e,n.cone(5),n.solid(16752412),[.14,.26,.14],[.46,1,0],[0,0,-ft]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,-.16]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,.16]),e}},tv={kind:"crab",tier:1,zones:["beach"],motion:"walk",build({kit:n}){let e=new ae,t=n.solid(16731469);R(e,n.sphere(1),t,[1,.45,.8],[0,.35,0]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,-.45]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,.45]);for(let i=0;i<3;i+=1)R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,-.45],[.7,0,0]),R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,.45],[-.7,0,0]);return R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,-.12]),R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,.12]),e}},nv={kind:"sunflower",tier:3,zones:["garden"],weight:1.4,build({kit:n}){let e=new ae;R(e,n.cylinder(6),n.solid(3841315),[.12,2.4,.12],[0,1.2,0]),R(e,n.sphere(0),n.solid(3841315),[.5,.08,.24],[.22,1.1,0],[0,0,.4]),R(e,n.cylinder(12),n.solid(7028253),[.6,.12,.6],[.05,2.5,0],[0,0,ft]);let t=n.solid(16764928);for(let i=0;i<10;i+=1){let s=i/10*Math.PI*2;R(e,n.sphere(0),t,[.08,.32,.18],[.06,2.5+Math.sin(s)*.45,Math.cos(s)*.45],[s,0,0])}return e}},iv={kind:"dog",tier:3,zones:["garden","town","beach"],motion:"walk",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[13011801,16645629,4013373,16045453])),s=n.solid(5913899);R(t,n.box(),i,[1.3,.6,.62],[0,.7,0]),R(t,n.box(),i,[.62,.58,.56],[.78,1.1,0]),R(t,n.box(),i,[.36,.28,.4],[1.2,.98,0]),R(t,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.4,1.05,0]),R(t,n.box(),s,[.12,.44,.22],[.7,1.12,-.36]),R(t,n.box(),s,[.12,.44,.22],[.7,1.12,.36]),R(t,n.cylinder(5),i,[.1,.5,.1],[-.75,1.05,0],[0,0,.8]);for(let[r,o]of[[.45,.2],[.45,-.2],[-.45,.2],[-.45,-.2]])R(t,n.cylinder(5),i,[.16,.5,.16],[r,.25,o]);return t}},sv={kind:"person",tier:3,zones:["town","garden","beach","snow","room"],weight:1.6,motion:"walk",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,ct)),s=n.solid(Ne(e,[1914199,2829634,7166330,5800279])),r=n.solid(Ne(e,w_));return R(t,n.cylinder(6),s,[.2,.9,.2],[0,.45,-.14]),R(t,n.cylinder(6),s,[.2,.9,.2],[0,.45,.14]),R(t,n.cylinder(8,.85),i,[.62,.95,.5],[0,1.35,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,-.4],[.25,0,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,.4],[-.25,0,0]),R(t,n.sphere(1),r,[.5,.56,.5],[0,2.1,0]),R(t,n.sphere(1),n.solid(Ne(e,[2826520,7028253,15909198,11680328,1907514])),[.54,.34,.54],[-.04,2.3,0]),t}},rv={kind:"mailbox",tier:3,zones:["town","garden"],build({kit:n}){let e=new ae,t=n.solid(15087942);return R(e,n.box(),n.solid(8015405),[.2,1.2,.2],[0,.6,0]),R(e,n.box(),t,[.9,.45,.5],[0,1.4,0]),R(e,n.cylinder(10),t,[.5,.9,.5],[0,1.62,0],[0,0,ft]),R(e,n.box(),n.solid(16765503),[.06,.4,.06],[.3,1.9,.26]),e}},ov={kind:"bench",tier:3,zones:["town","garden","beach"],build({kit:n}){let e=new ae,t=n.solid(13204285),i=n.solid(2976335);R(e,n.box(),t,[2,.1,.7],[0,.6,0]),R(e,n.box(),t,[2,.5,.08],[0,1,-.32],[-.15,0,0]);for(let s of[-.85,.85])R(e,n.box(),i,[.1,.6,.6],[s,.3,0]),R(e,n.box(),i,[.1,.6,.08],[s,.95,-.34]);return e}},av={kind:"bicycle",tier:3,zones:["town","garden"],build({kit:n,random:e}){let t=new ae,i=n.solid(1907514),s=n.solid(Ne(e,ct));return R(t,n.torus(.1),i,[1.1,1.1,1.1],[-.7,.55,0]),R(t,n.torus(.1),i,[1.1,1.1,1.1],[.7,.55,0]),R(t,n.cylinder(5),s,[.08,1.3,.08],[0,.85,0],[0,0,ft]),R(t,n.cylinder(5),s,[.08,.9,.08],[-.35,.72,0],[0,0,.9]),R(t,n.cylinder(5),s,[.08,.9,.08],[.45,.8,0],[0,0,-.35]),R(t,n.box(),n.solid(2829634),[.36,.08,.2],[-.35,1.18,0]),R(t,n.cylinder(5),n.solid(12568533),[.06,.6,.06],[.58,1.25,0],[ft,0,0]),t}},lv={kind:"umbrella",tier:3,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ae;return R(t,n.cylinder(6),n.solid(16777215),[.08,2.2,.08],[0,1.1,0],[.12,0,0]),R(t,n.cone(8),n.solid(Ne(e,ct)),[2.4,.6,2.4],[0,2.2,.12]),R(t,n.cone(8),n.solid(16777215),[1.2,.34,1.2],[0,2.38,.12]),t}},cv={kind:"snowman",tier:3,zones:["snow"],weight:1.8,build({kit:n,random:e}){let t=new ae,i=n.solid(16645631);return R(t,n.sphere(1),i,[1.1,1,1.1],[0,.5,0]),R(t,n.sphere(1),i,[.8,.75,.8],[0,1.28,0]),R(t,n.sphere(1),i,[.58,.55,.58],[0,1.88,0]),R(t,n.cone(6),n.solid(16743168),[.1,.36,.1],[.36,1.9,0],[0,0,-ft]),R(t,n.torus(.2),n.solid(Ne(e,[15087942,3835647,448160])),[.62,.62,.62],[0,1.6,0],[ft,0,0]),R(t,n.cylinder(10),n.solid(1907514),[.5,.06,.5],[0,2.12,0]),R(t,n.cylinder(10),n.solid(1907514),[.34,.36,.34],[0,2.3,0]),t}},hv={kind:"vending-machine",tier:3,zones:["town"],build({kit:n,random:e}){let t=new ae;R(t,n.box(),n.solid(Ne(e,[15087942,3835647,16645629])),[.9,1.9,.8],[0,.95,0]),R(t,n.box(),n.glow(13299960),[.05,.9,.6],[.46,1.25,0]);for(let i=0;i<3;i+=1)for(let s=0;s<3;s+=1)R(t,n.cylinder(6),n.solid(Ne(e,ct)),[.1,.22,.1],[.44,1+i*.26,-.18+s*.18]);return R(t,n.box(),n.solid(2829634),[.05,.14,.5],[.46,.35,0]),t}},uv={kind:"car",tier:4,zones:["town","beach"],weight:1.6,motion:"drive",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,ct));R(t,n.box(),i,[2.3,.62,1.1],[0,.55,0]),R(t,n.box(),n.solid(12443902),[1.2,.5,1],[-.15,1.1,0]),R(t,n.box(),i,[1.26,.08,1.04],[-.15,1.38,0]);let s=n.solid(1907514);for(let[r,o]of[[.75,.55],[.75,-.55],[-.75,.55],[-.75,-.55]])R(t,n.cylinder(10),s,[.52,.22,.52],[r,.26,o],[ft,0,0]);return R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,-.35]),R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,.35]),t}},dv={kind:"cow",tier:4,zones:["garden","forest"],motion:"walk",build({kit:n}){let e=new ae,t=n.solid(16645629),i=n.solid(1907514);R(e,n.box(),t,[1.8,.9,.9],[0,1.1,0]),R(e,n.sphere(0),i,[.6,.5,.1],[.2,1.2,.46]),R(e,n.sphere(0),i,[.5,.4,.1],[-.4,1.05,-.46]),R(e,n.box(),t,[.6,.55,.6],[1.1,1.4,0]),R(e,n.box(),n.solid(16757954),[.24,.3,.5],[1.44,1.3,0]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,-.22]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,.22]);for(let[s,r]of[[.65,.3],[.65,-.3],[-.65,.3],[-.65,-.3]])R(e,n.cylinder(5),t,[.2,.7,.2],[s,.35,r]);return R(e,n.sphere(0),n.solid(16757954),[.34,.2,.3],[-.3,.62,0]),e}},fv={kind:"tree",tier:4,zones:["garden","town","forest"],weight:2,build({kit:n,random:e}){let t=new ae;R(t,n.cylinder(6),n.solid(9067067),[.4,1.6,.4],[0,.8,0]);let i=[5420936,7653021,4231532,9819570];if(R(t,n.sphere(0),n.solid(Ne(e,i)),[1.8,1.6,1.8],[0,2.2,0]),R(t,n.sphere(0),n.solid(Ne(e,i)),[1.2,1.1,1.2],[.5,2.8,.3]),R(t,n.sphere(0),n.solid(Ne(e,i)),[1.1,1,1.1],[-.5,2.6,-.3]),e()<.4)for(let s=0;s<4;s+=1)R(t,n.sphere(0),n.solid(15087942),[.2,.2,.2],[Math.cos(s*1.7)*.8,2.1+s*.15,Math.sin(s*1.7)*.8]);return t}},pv={kind:"pine-tree",tier:4,zones:["forest","snow"],weight:2.2,build({kit:n,random:e}){let t=new ae,i=e()<.5;R(t,n.cylinder(6),n.solid(7029286),[.35,.9,.35],[0,.45,0]);let s=n.solid(Ne(e,[2976335,1786674,4231532]));for(let r=0;r<3;r+=1)R(t,n.cone(7),s,[1.8-r*.45,1.3,1.8-r*.45],[0,1.4+r*.75,0]);return i&&R(t,n.cone(7),n.solid(16777215),[.5,.45,.5],[0,3.1,0]),t}},mv={kind:"palm-tree",tier:4,zones:["beach"],weight:2,build({kit:n}){let e=new ae,t=n.solid(11895642);for(let s=0;s<6;s+=1)R(e,n.cylinder(6,.85),t,[.34,.6,.34],[s*s*.02,.3+s*.55,0],[0,0,-s*.05]);let i=n.solid(3129201);for(let s=0;s<6;s+=1){let r=s/6*Math.PI*2;R(e,n.sphere(0),i,[1.5,.08,.4],[.6+Math.cos(r)*.7,3.4,Math.sin(r)*.7],[0,-r,-.3])}return R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.55,3.2,.15]),R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.7,3.2,-.12]),e}},gv={kind:"house",tier:5,zones:["town","garden","snow"],weight:2,build({kit:n,random:e}){let t=new ae;R(t,n.box(),n.solid(Ne(e,[16773590,16766688,13299960,16645340,14871785])),[2.2,1.5,1.9],[0,.75,0]),R(t,n.cone(4),n.solid(Ne(e,[15087942,3835647,2792847,7166330])),[2.3,1.1,2],[0,2.05,0],[0,Math.PI/4,0]),R(t,n.box(),n.solid(8015405),[.05,.8,.5],[1.11,.4,.3]);let i=n.glow(16774064);return R(t,n.box(),i,[.05,.42,.42],[1.11,.95,-.45]),R(t,n.box(),i,[.42,.42,.05],[-.4,.95,.96]),R(t,n.box(),i,[.42,.42,.05],[.5,.95,.96]),R(t,n.box(),n.solid(10309341),[.3,.7,.3],[-.55,2.35,-.35]),t}},xv={kind:"bus",tier:5,zones:["town"],motion:"drive",build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[16765503,448160,15681391]));R(t,n.box(),i,[4.2,1.5,1.4],[0,1.05,0]),R(t,n.box(),n.solid(12443902),[3.8,.5,1.42],[-.1,1.35,0]),R(t,n.box(),n.solid(12443902),[.05,.7,1.2],[2.11,1.25,0]);let s=n.solid(1907514);for(let[r,o]of[[1.3,.7],[1.3,-.7],[-1.3,.7],[-1.3,-.7]])R(t,n.cylinder(10),s,[.62,.24,.62],[r,.3,o],[ft,0,0]);return t}},_v={kind:"windmill",tier:5,zones:["garden","forest"],build({kit:n}){let e=new ae;R(e,n.cylinder(8,.65),n.solid(16645340),[1.3,3,1.3],[0,1.5,0]),R(e,n.cone(8),n.solid(15087942),[1.1,.8,1.1],[0,3.4,0]);let t=new ae;t.position.set(.56,2.7,0),t.userData.spin={axis:"x",speed:1.4};let i=n.solid(16775408);for(let s=0;s<4;s+=1){let r=new ae;r.rotation.x=s/4*Math.PI*2,R(r,n.box(),i,[.06,1.7,.4],[0,.95,0]),t.add(r)}return e.add(t),e}},vv={kind:"lighthouse",tier:5,zones:["beach"],build({kit:n}){let e=new ae;for(let t=0;t<5;t+=1)R(e,n.cylinder(10,.94),n.solid(t%2===0?16777215:15087942),[1.2-t*.12,.8,1.2-t*.12],[0,.4+t*.8,0]);return R(e,n.cylinder(10),n.glow(16774064),[.62,.5,.62],[0,4.25,0]),R(e,n.cone(10),n.solid(1914199),[.9,.6,.9],[0,4.8,0]),e}},yv={kind:"pagoda",tier:5,zones:["garden","town","forest"],build({kit:n,random:e}){let t=new ae,i=n.solid(16773590),s=n.solid(Ne(e,[14034984,2792847,4014171]));for(let r=0;r<3;r+=1){let o=1.8-r*.4;R(t,n.box(),i,[o,.9,o],[0,.45+r*1.2,0]),R(t,n.cone(4),s,[o*1.9,.45,o*1.9],[0,1.08+r*1.2,0],[0,Math.PI/4,0])}return R(t,n.cylinder(5),n.solid(16765503),[.08,.8,.08],[0,3.9,0]),t}},bv={kind:"hot-air-balloon",tier:5,zones:"all",weight:.6,motion:"fly",build({kit:n,random:e}){let t=new ae;R(t,n.sphere(1),n.solid(Ne(e,ct)),[2,2.3,2],[0,2.6,0]),R(t,n.torus(.06),n.solid(Ne(e,ct)),[2.04,2.04,2.04],[0,2.6,0],[ft,0,0]),R(t,n.torus(.06),n.solid(16777215),[1.7,1.7,1.7],[0,3.2,0],[ft,0,0]),R(t,n.box(),n.solid(10506797),[.6,.45,.6],[0,.22,0]);for(let[i,s]of[[.26,.26],[-.26,.26],[.26,-.26],[-.26,-.26]])R(t,n.cylinder(3),n.solid(5913899),[.03,1.2,.03],[i*1.4,.95,s*1.4]);return t}},Mv={kind:"whale",tier:5,zones:["beach"],weight:.8,motion:"bob",build({kit:n}){let e=new ae;return R(e,n.sphere(1),n.solid(4756975),[3,1.3,1.5],[0,.65,0]),R(e,n.sphere(1),n.solid(13299960),[2.4,.6,1.2],[.2,.36,0]),R(e,n.sphere(0),n.solid(4756975),[.4,.1,1.2],[-1.7,.9,0],[0,0,.5]),R(e,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.1,.8,.6]),R(e,n.cylinder(6,1.6),n.solid(9494767),[.18,.6,.18],[.5,1.5,0]),e}},Sv={kind:"building",tier:6,zones:["town"],weight:2.4,build({kit:n,random:e}){let t=new ae,i=5+Math.floor(e()*4),s=i*.62;R(t,n.box(),n.solid(Ne(e,[11066076,15858414,16763604,13481179,16770484])),[1.8,s,1.8],[0,s/2,0]);let r=n.glow(Ne(e,[16774064,13299960]));for(let o=0;o<i;o+=1)R(t,n.box(),r,[1.82,.22,1.5],[0,.4+o*.62,0]),R(t,n.box(),r,[1.5,.22,1.82],[0,.4+o*.62,0]);return R(t,n.cylinder(4),n.solid(15087942),[.06,1,.06],[.4,s+.5,.4]),t}},Ev={kind:"ferris-wheel",tier:6,zones:["town","beach","candy"],build({kit:n}){let e=new ae,t=n.solid(16777215);R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,.3]),R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,-.3]);let i=new ae;i.position.set(0,2.9,0),i.userData.spin={axis:"z",speed:.35},R(i,n.torus(.04),n.solid(16711790),[5,5,5],[0,0,0]);for(let s=0;s<8;s+=1){let r=s/8*Math.PI*2;R(i,n.box(),t,[.06,2.5,.06],[Math.cos(r)*1.25,Math.sin(r)*1.25,0],[0,0,r-ft]),R(i,n.box(),n.solid(ct[s%ct.length]),[.4,.4,.5],[Math.cos(r)*2.5,Math.sin(r)*2.5-.25,0])}return e.add(i),e}},wv={kind:"rocket",tier:6,zones:"all",weight:.5,build({kit:n}){let e=new ae;R(e,n.cylinder(10),n.solid(16645629),[1,3,1],[0,2,0]),R(e,n.cone(10),n.solid(15087942),[1,1.2,1],[0,4.1,0]),R(e,n.cylinder(10),n.glow(10221311),[.4,.1,.4],[0,3,.48],[ft,0,0]);for(let t=0;t<3;t+=1){let i=t/3*Math.PI*2;R(e,n.box(),n.solid(15087942),[.08,1,.7],[Math.cos(i)*.6,.8,Math.sin(i)*.6],[0,-i,0])}return R(e,n.cone(8),n.glow(16758531),[.7,.6,.7],[0,.3,0],[Math.PI,0,0]),e}},Tv={kind:"cupcake",tier:3,zones:["candy","room"],weight:1.6,build({kit:n,random:e}){let t=new ae;R(t,n.cylinder(10,1.25),n.solid(Ne(e,[16757702,10221311,16646070])),[.9,.7,.9],[0,.35,0]);let i=n.solid(Ne(e,[16773623,16763101,13303743]));return R(t,n.sphere(1),i,[1.2,.5,1.2],[0,.85,0]),R(t,n.sphere(1),i,[.8,.4,.8],[0,1.15,0]),R(t,n.sphere(0),n.solid(15087942),[.26,.26,.26],[0,1.42,0]),t}},Av={kind:"candy-cane",tier:4,zones:["candy","snow"],weight:1.6,build({kit:n}){let e=new ae;for(let t=0;t<6;t+=1)R(e,n.cylinder(8),n.solid(t%2===0?16777215:15087942),[.3,.5,.3],[0,.25+t*.5,0]);return R(e,n.torus(.3,Math.PI),n.solid(15087942),[.9,.9,.9],[.45,3,0]),e}},Rv={kind:"gingerbread-house",tier:5,zones:["candy","snow"],weight:1.4,build({kit:n}){let e=new ae;R(e,n.box(),n.solid(11887901),[2,1.3,1.7],[0,.65,0]),R(e,n.cone(4),n.solid(16775408),[2.2,1.1,1.9],[0,1.85,0],[0,Math.PI/4,0]),R(e,n.box(),n.solid(16740277),[.05,.7,.5],[1.01,.35,0]);for(let[t,i]of[[1,-.55],[1,.55]])R(e,n.box(),n.solid(10221311),[.05,.36,.36],[1.01,t,i]);for(let t=0;t<6;t+=1)R(e,n.sphere(0),n.solid(ct[t*2]),[.18,.18,.18],[-.8+t*.32,1.32,.86]);return e}},Cv={kind:"zabuton",tier:2,zones:["room"],weight:1.4,build({kit:n,random:e}){let t=new ae,i=Ne(e,[10304626,4020864,14711391,8499866]);return R(t,n.box(),n.solid(i),[1.1,.22,1.1],[0,.11,0]),R(t,n.sphere(1),n.solid(i),[1.1,.14,1.1],[0,.22,0]),R(t,n.sphere(0),n.solid(15912079),[.1,.08,.1],[0,.3,0]),t}},Iv={kind:"low-table",tier:3,zones:["room"],weight:1.4,build({kit:n}){let e=new ae,t=n.solid(9132587);R(e,n.cylinder(18),t,[2.2,.12,2.2],[0,.7,0]);for(let[i,s]of[[.6,.6],[-.6,.6],[.6,-.6],[-.6,-.6]])R(e,n.box(),n.solid(7029286),[.14,.66,.14],[i,.33,s]);return R(e,n.cylinder(10),n.solid(16777215),[.3,.3,.3],[.3,.9,.2]),R(e,n.cylinder(10),n.solid(7289631),[.24,.02,.24],[.3,1.05,.2]),R(e,n.sphere(1),n.solid(16752412),[.28,.28,.28],[-.4,.9,-.3]),e}},Pv={kind:"television",tier:3,zones:["room"],build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[10128536,4869737,13217191]));return R(t,n.box(),i,[1.3,1,1],[0,.6,0]),R(t,n.box(),n.glow(Ne(e,[8054146,10221311,16762623])),[.04,.72,.78],[.66,.62,-.05]),R(t,n.cylinder(6),n.solid(2236987),[.12,.12,.12],[.66,.3,.38],[0,0,Math.PI/2]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,-.2],[.5,0,0]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,.2],[-.5,0,0]),R(t,n.box(),n.solid(7029286),[1.1,.1,.9],[0,.05,0]),t}},Dv={kind:"kotatsu",tier:4,zones:["room"],weight:1.2,build({kit:n,random:e}){let t=new ae,i=n.solid(Ne(e,[14034984,4415982,16219904]));R(t,n.box(),i,[2.4,.7,2.4],[0,.35,0]),R(t,n.sphere(1),i,[2.6,.3,2.6],[0,.55,0]),R(t,n.box(),n.solid(10506797),[2.1,.12,2.1],[0,.8,0]);for(let s=0;s<5;s+=1)R(t,n.sphere(1),n.solid(16752412),[.26,.26,.26],[Math.cos(s)*.3,.98,Math.sin(s)*.3]);return t}},Lv={kind:"shoji-screen",tier:4,zones:["room"],build({kit:n}){let e=new ae,t=n.solid(8015405);R(e,n.box(),n.solid(16644332),[.08,2.4,1.4],[0,1.2,0]);for(let i=0;i<=4;i+=1)R(e,n.box(),t,[.1,.05,1.42],[0,.05+i*.59,0]);for(let i=0;i<=3;i+=1)R(e,n.box(),t,[.1,2.4,.05],[0,1.2,-.7+i*.467]);return e}},Nv={kind:"hibiscus",tier:2,zones:["garden","beach"],weight:1.8,build({kit:n,random:e}){let t=new ae,i=n.solid(4168250);for(let r=0;r<5;r+=1){let o=r/5*Math.PI*2;R(t,n.sphere(1),i,[.7,.1,.32],[Math.cos(o)*.4,.25+r*.06,Math.sin(o)*.4],[0,-o,.3])}let s=n.solid(Ne(e,[16027569,15691663,16230084]));for(let r=0;r<5;r+=1){let o=r/5*Math.PI*2;R(t,n.sphere(1),s,[.55,.12,.42],[Math.cos(o)*.34,.95,Math.sin(o)*.34],[0,-o,-.35])}return R(t,n.cylinder(6),n.solid(15909424),[.07,.5,.07],[.05,1.15,0],[0,0,-.5]),R(t,n.sphere(0),n.solid(15246103),[.14,.14,.14],[.18,1.38,0]),t}},xd=[T_,A_,R_,C_,I_,P_,D_,L_,N_,U_,F_,O_,B_,z_,k_,H_,G_,V_,W_,X_,q_,tv,Y_,Z_,$_,K_,J_,j_,Q_,ev,nv,iv,sv,rv,ov,av,lv,cv,hv,uv,dv,fv,pv,mv,gv,xv,_v,vv,yv,bv,Mv,Sv,Ev,wv,Tv,Av,Rv,Cv,Iv,Pv,Dv,Lv,Nv],Uv=Math.max(...xd.map(n=>n.tier));function Fi(n,e){let t=Math.min(Math.max(e,0),Uv);return xd.filter(i=>i.tier===t&&(i.zones==="all"||i.zones.includes(n)))}function Oi(n,e){let t=0;for(let s of e)t+=s.weight??1;if(t===0)return null;let i=n()*t;for(let s of e)if(i-=s.weight??1,i<=0)return s;return e.at(-1)??null}function As(n,e){n.updateMatrixWorld(!0);let t=[];n.traverse(l=>{l!==n&&l.userData.spin&&t.push(l)});let i=n.matrixWorld.clone().invert(),s=[],r=new Le;n.traverse(l=>{if(!(l instanceof Ye))return;let c=l;for(;c&&c!==n;){if(t.includes(c))return;c=c.parent}let h=l.geometry,d=h.index?h.toNonIndexed():h.clone();d.deleteAttribute("uv"),d.applyMatrix4(new vt().multiplyMatrices(i,l.matrixWorld)),r.copy(l.material.color);let u=d.getAttribute("position").count,f=new Float32Array(u*3);for(let g=0;g<u;g+=1)r.toArray(f,g*3);d.setAttribute("color",new kt(f,3)),s.push(d)});let o=new ae,a=s.length>0?gd(s):null;for(let l of s)l.dispose();if(a){let l=new Ye(a,e.vertexColored());l.userData.ownedGeometry=!0,o.add(l)}for(let l of t)o.attach(l);return o}var Fv=3;function $a(n,e){let t=Math.floor(e.random()*Fv);return e.kit.template(`${n.kind}:${t}`,()=>{let s=on(Wi(n.kind)+t*7919),r=As(n.build({kit:e.kit,random:s}),e.kit),o=new Cn().setFromObject(r),a=o.getSize(new P),l=o.getCenter(new P),c=Math.max(a.x,a.y,a.z)/2||1;r.position.set(-l.x,-o.min.y,-l.z);let h=new ae;h.scale.setScalar(1/c),h.add(r);let d=new ae;return d.add(h),d}).clone(!0)}function _d(n){let e=n.kind.replace(/-/g," ");return e.charAt(0).toUpperCase()+e.slice(1)}var vd=72,yd=110,Ov=34,Bv=[15222076,16093498,16241214,7126853,3837910,8015792],bd=[9413806,10334908,8295583,11715531,7309202];function Ka(n,e,t,i,s,r=0){let o=new Ye(e.box(),e.solid(t));o.scale.set(...i),o.position.set(...s),o.rotation.y=r,n.add(o)}function Rs(n,e){return[Math.cos(n)*e,Math.sin(n)*e]}function zv(n,e,t){let i=new ae,s=2.3;for(let a=0;a<64;a+=1){let l=t-s/2+a/64*s+(e()-.5)*.03,c=vd+e()*10,[h,d]=Rs(l,c),u=e()<.12,f=1.6+e()*2.6,g=u?9+e()*4:2.5+e()*5.5,b=bd[Math.floor(e()*bd.length)],m=-l;Ka(i,n,b,[f,g,f],[h,g/2,d],m);let p=new Le(b).lerp(new Le(15135221),.45).getHex();for(let M=1.2;M<g-.6;M+=1.1)Ka(i,n,p,[f*1.02,.28,f*.7],[h,M,d],m);u&&Ka(i,n,b,[.2,2.2,.2],[h,g+1.1,d])}let[r,o]=Rs(t+s/2+.12,vd+4);for(let a=0;a<6;a+=1){let l=2.2-a*.33;Ka(i,n,a%2===0?14829114:16053492,[l,2.4,l],[r,1.2+a*2.4,o])}return As(i,n)}function kv(n,e){let t=new ae;for(let i=0;i<90;i+=1){let s=e()*Math.PI*2,[r,o]=Rs(s,50+e()*14),a=2.2+e()*2.4,l=new Ye(n.cylinder(6),n.solid(7031343));l.scale.set(.2,a*.3,.2),l.position.set(r,a*.15,o);let c=new Ye(n.sphere(1),n.solid(e()<.5?3112250:3903300));c.scale.set(1.1,a,1.1),c.position.set(r,a*.72,o),t.add(l,c)}return As(t,n)}function Hv(n,e){let t=new ae,i=[9225791,8042549,10342478,7319088];for(let s=0;s<22;s+=1){let r=s/22*Math.PI*2+e()*.2,[o,a]=Rs(r,58+e()*12),l=new Ye(n.sphere(2),n.solid(i[s%i.length])),c=18+e()*16;l.scale.set(c,5+e()*6,c*.8),l.position.set(o,-1,a),l.rotation.y=-r,t.add(l)}return As(t,n)}function Gv(n,e){let t=new ae,[i,s]=Rs(e,130),r=new Ye(n.cone(28),n.solid(4165567));r.scale.set(96,34,96),r.position.set(i,16,s);let o=new Ye(n.cone(28),n.solid(16186367));o.scale.set(38,13.6,38),o.position.set(i,26.3,s);let a=new ae;a.add(r,o);for(let l=0;l<7;l+=1){let c=new Ye(n.cone(3),n.solid(16186367)),h=l/7*Math.PI*2;c.scale.set(6,8,3),c.position.set(i+Math.cos(h)*17,19.5,s+Math.sin(h)*17),c.rotation.set(Math.PI,-h,0),a.add(c)}return t.add(a),As(t,n)}var Ja=class{group=new ae;rainbow=new ae;clouds=[];cloudMaterial;fujiMaterials=[];constructor(e,t){let i=on(t^24301),s=i()*Math.PI*2;this.group.add(Hv(e,i),kv(e,i),zv(e,i,s));let r=Gv(e,s+2.6);r.traverse(o=>{if(o instanceof Ye){let a=o.material.clone();a.fog=!1,o.material=a,this.fujiMaterials.push(a)}}),this.group.add(r),this.cloudMaterial=new si({color:16777215,fog:!1});for(let o=0;o<16;o+=1){let a=new ae,l=5+Math.floor(i()*5);for(let c=0;c<l;c+=1){let h=new Ye(e.sphere(2),this.cloudMaterial),d=2.2+i()*3.2;h.scale.set(d*1.2,d,d),h.position.set((c-l/2)*2.6+i(),9+d*.35+i()*2.5,i()*2),a.add(h)}this.group.add(a),this.clouds.push({mesh:a,angle:i()*Math.PI*2,distance:92+i()*22,drift:.004+i()*.006})}Bv.forEach((o,a)=>{let l=new Ye(new Ai(1-a*.034,.017,4,80,Math.PI),new Jt({color:o,fog:!1}));this.rainbow.add(l)}),this.group.add(this.rainbow)}update(e,t,i,s,r){this.group.position.set(t.x,0,t.z),this.group.scale.setScalar(i);for(let a of this.clouds){a.angle+=a.drift*e;let[l,c]=Rs(a.angle,a.distance);a.mesh.position.set(l,0,c),a.mesh.rotation.y=-a.angle+Math.PI/2}let o=new P;s.getWorldDirection(o),o.y=0,o.normalize(),this.rainbow.visible=r>.5,this.rainbow.position.set(o.x*yd,-1,o.z*yd),this.rainbow.scale.setScalar(Ov),this.rainbow.lookAt(t.x,this.group.position.y+i*-1,t.z)}dispose(){this.cloudMaterial.dispose();for(let e of this.fujiMaterials)e.dispose();for(let e of this.rainbow.children)e.geometry.dispose(),e.material.dispose()}};var Cs=["room","garden","town","beach","candy","forest","snow"];function Sd(n){return Cs.indexOf(n)}var Md=[{room:.72,candy:.14,garden:.14},{room:.55,candy:.15,garden:.2,beach:.1},{room:.28,garden:.28,candy:.14,town:.18,beach:.12},{room:.06,garden:.24,town:.28,beach:.14,forest:.16,candy:.12},{garden:.16,town:.3,beach:.16,forest:.16,snow:.12,candy:.1}];function Vv(n){return Md[Math.min(n,Md.length-1)]}function ja(n,e,t){let i=Math.imul(n|0,668265261)^Math.imul(e|0,374761393);return i=Math.imul(i^Math.imul(t|0,2654435769),2246822507),i^=i>>>13,i=Math.imul(i,3266489909),i^=i>>>16,(i>>>0)/4294967296}function Wv(n,e){let t=0;for(let s of Cs)t+=n[s]??0;let i=e*t;for(let s of Cs)if(i-=n[s]??0,i<=0&&(n[s]??0)>0)return s;return"garden"}function Xv(n){return .3*2**n*16}function Is(n,e,t,i){let s=Xv(t),r=Math.floor(n/s),o=Math.floor(e/s),a=Number.POSITIVE_INFINITY,l=r,c=o;for(let h=-1;h<=1;h+=1)for(let d=-1;d<=1;d+=1){let u=r+h,f=o+d,g=(u+.15+.7*ja(u,f,i+t*7))*s,b=(f+.15+.7*ja(f,u,i+t*13))*s,m=(g-n)**2+(b-e)**2;m<a&&(a=m,l=u,c=f)}return{zone:Wv(Vv(t),ja(l,c,i+t*31+5)),variant:ja(l,c,i+t*57+11)}}var Ed=[14864270,9225791,12239819,15983283,16762588,6467130,15923195],wd=[13218161,10146380,16249820,15455906,16773366,5545777,14543349];var qv=240,fi=128,Yv=200,Qa=[{at:0,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1},{at:.07,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.64,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.72,top:6971312,horizon:16757642,sun:16751206,hemiSky:16769228,hemiGround:11049610,light:.95,stars:0},{at:.79,top:2962040,horizon:13073046,sun:16754352,hemiSky:13678822,hemiGround:5918592,light:.75,stars:.4},{at:.86,top:1055306,horizon:3360911,sun:12374015,hemiSky:10137320,hemiGround:3354720,light:.6,stars:1},{at:.95,top:3360154,horizon:10128075,sun:14469375,hemiSky:13353202,hemiGround:6247824,light:.75,stars:.5},{at:1,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1}],Zv=new Le,$v=new Le;function Kv(n){let e=0;for(;e<Qa.length-2&&Qa[e+1].at<=n;)e+=1;let t=Qa[e],i=Qa[e+1],s=sn.smoothstep(n,t.at,i.at),r=(o,a)=>Zv.setHex(o).lerp($v.setHex(a),s).clone();return{top:r(t.top,i.top),horizon:r(t.horizon,i.horizon),sun:r(t.sun,i.sun),hemiSky:r(t.hemiSky,i.hemiSky),hemiGround:r(t.hemiGround,i.hemiGround),light:sn.lerp(t.light,i.light,s),stars:sn.lerp(t.stars,i.stars,s)}}var Jv=`
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww;
}
`,jv=`
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDirection;
uniform float uStars;
uniform float uTime;
varying vec3 vDirection;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 direction = normalize(vDirection);
  float height = direction.y;
  // The camera sees only the lowest band of sky, so reach full blue early.
  vec3 color = mix(uHorizon, uTop, smoothstep(0.0, 0.16, height));
  color = mix(color, uHorizon * 0.92, smoothstep(0.0, -0.3, height));
  // The key art has no sun disk, only a faint warm glow toward the light.
  float facing = max(dot(direction, uSunDirection), 0.0);
  color += uSunColor * pow(facing, 24.0) * 0.12;
  vec3 grid = direction * 150.0;
  vec3 cell = floor(grid);
  float star = hash(cell);
  if (star > 0.982 && height > 0.02) {
    float twinkle = 0.6 + 0.4 * sin(uTime * (2.0 + star * 5.0) + star * 40.0);
    float spot = smoothstep(0.32, 0.0, length(fract(grid) - 0.5));
    color += vec3(1.0, 0.96, 0.85) * spot * twinkle * uStars;
  }
  gl_FragColor = vec4(color, 1.0);
  #include <colorspace_fragment>
}
`,Qv=`
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
}
`,ey=`
uniform sampler2D uZoneMap;
uniform vec2 uMapOrigin;
uniform float uMapSize;
uniform vec3 uZoneColors[${Cs.length}];
uniform vec3 uAccentColors[${Cs.length}];
uniform float uDetail;
uniform vec3 uLight;
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vWorld;
varying float vDepth;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float line(float value, float width) {
  float f = fract(value);
  return step(1.0 - width, f) + step(f, width * 0.5);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash2(i), hash2(i + vec2(1.0, 0.0)), f.x), mix(hash2(i + vec2(0.0, 1.0)), hash2(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
  // Warp the lookup a little so zone borders wander instead of stair-stepping.
  vec2 texel = vWorld.xz / (uMapSize / 128.0);
  vec2 warp = vec2(valueNoise(texel * 0.7), valueNoise(texel * 0.7 + 17.0)) - 0.5;
  vec2 uv = (vWorld.xz - uMapOrigin) / uMapSize + warp * (1.6 / 128.0);
  vec4 zoneSample = texture2D(uZoneMap, uv);
  int zone = int(floor(zoneSample.r * 255.0 / 32.0 + 0.5));
  float variant = zoneSample.g;
  vec3 base = uZoneColors[zone] * (0.93 + variant * 0.14);
  vec3 accent = uAccentColors[zone];
  vec2 p = vWorld.xz / uDetail;
  vec3 color = base;
  if (zone == 0) {
    // Tatami: long mats with dark seams and a fine weave.
    vec2 mats = p * vec2(0.5, 1.0);
    float offset = mod(floor(mats.y), 2.0) * 0.5;
    float seam = clamp(line(mats.x + offset, 0.04) + line(mats.y, 0.06), 0.0, 1.0);
    float weave = 0.5 + 0.5 * sin(p.y * 40.0);
    color = mix(base * (0.96 + weave * 0.05), accent * 0.8, seam);
  } else if (zone == 1) {
    // Lawn: mown stripes and clover speckles.
    float stripe = mod(floor(p.x * 0.5), 2.0);
    color = mix(base, accent, stripe * 0.35);
    // Beige dirt paths winding through the grass.
    float path = abs(sin(p.x * 0.09 + sin(p.y * 0.07) * 2.2));
    color = mix(color, vec3(0.95, 0.87, 0.67), 1.0 - smoothstep(0.05, 0.09, path));
  } else if (zone == 2) {
    // Paving slabs, with a painted road every few blocks.
    float slabs = clamp(line(p.x, 0.05) + line(p.y, 0.05), 0.0, 1.0);
    color = mix(base, base * 0.78, slabs);
    float road = step(mod(floor(p.x / 4.0), 3.0), 0.5);
    vec3 asphalt = vec3(0.33, 0.35, 0.42);
    float dash = step(0.5, fract(p.y * 0.5)) * step(abs(fract(p.x / 4.0) * 4.0 - 2.0), 0.08);
    color = mix(color, mix(asphalt, accent, dash), road);
  } else if (zone == 3) {
    // Sand ripples.
    float ripple = 0.5 + 0.5 * sin(p.x * 3.0 + sin(p.y * 1.3) * 2.0);
    color = mix(base, accent, ripple * 0.5);
  } else if (zone == 4) {
    // Frosting checkerboard with sprinkles.
    float check = mod(floor(p.x) + floor(p.y), 2.0);
    color = mix(base, accent, check * 0.7);
    float sprinkle = step(0.975, hash2(floor(p * 5.0)));
    vec3 sprinkleColor = vec3(hash2(floor(p * 5.0) + 3.0), hash2(floor(p * 5.0) + 7.0), 0.9);
    color = mix(color, sprinkleColor, sprinkle);
  } else if (zone == 5) {
    // Forest floor: clover patches.
    float clover = step(0.55, hash2(floor(p * 1.5)));
    color = mix(base, accent, clover * 0.45);
  } else {
    // Snow drifts with glints.
    float drift = 0.5 + 0.5 * sin(p.x * 1.7 + sin(p.y * 0.9) * 2.5);
    color = mix(base, accent, drift * 0.5);
    color += vec3(step(0.985, hash2(floor(p * 12.0)))) * 0.4;
  }
  color *= uLight;
  float fog = smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(mix(color, uFogColor, fog), 1.0);
  #include <colorspace_fragment>
}
`,el=class{constructor(e,t,i){this.scene=e;this.kit=t;this.seed=i;let s=on(i);this.phase=.18+s()*.2,this.hemisphere=new Ri(16777215,8956552,1.1),this.sun=new Ci(16777215,1.2),e.add(this.hemisphere,this.sun,this.sun.target),this.skyUniforms={uTop:{value:new Le},uHorizon:{value:new Le},uSunColor:{value:new Le},uSunDirection:{value:new P(0,1,0)},uStars:{value:0},uTime:{value:0}},this.sky=new Ye(new mr(1,32,16),new Vt({uniforms:this.skyUniforms,vertexShader:Jv,fragmentShader:jv,side:Ft,depthWrite:!1})),this.sky.frustumCulled=!1,this.sky.renderOrder=-10,e.add(this.sky),this.zoneData=new Uint8Array(fi*fi*4),this.zoneTexture=new Qn(this.zoneData,fi,fi),this.zoneTexture.magFilter=Mt,this.zoneTexture.minFilter=Mt,this.groundUniforms={uZoneMap:{value:this.zoneTexture},uMapOrigin:{value:new ue},uMapSize:{value:1},uZoneColors:{value:Ed.map(o=>new Le(o))},uAccentColors:{value:wd.map(o=>new Le(o))},uDetail:{value:1},uLight:{value:new Le(1,1,1)},uFogColor:{value:new Le},uFogNear:{value:10},uFogFar:{value:40}};let r=new Ti(1,1,1,1);r.rotateX(-Math.PI/2),this.ground=new Ye(r,new Vt({uniforms:this.groundUniforms,vertexShader:Qv,fragmentShader:ey})),this.ground.frustumCulled=!1,this.ground.renderOrder=-5,e.add(this.ground),this.horizon=new Ja(t,i),e.add(this.horizon.group)}scene;kit;seed;hemisphere;sun;fogColor=new Le;sky;skyUniforms;ground;groundUniforms;zoneData;zoneTexture;horizon;zoneOrigin=new ue(Number.NaN,Number.NaN);zoneLevel=-1;zoneMapSize=1;phase;get skyPhase(){return this.phase}update(e,t,i,s,r,o){this.phase=(this.phase+e/qv)%1;let a=Kv(this.phase),l=this.phase<.7,c=l?this.phase/.7:(this.phase-.7)/.3,h=Math.sin(c*Math.PI)*(l?1:.7),d=c*Math.PI+.4,u=new P(Math.cos(d)*Math.cos(Math.asin(Math.min(.999,h))),Math.max(.05,h),Math.sin(d)*.6).normalize();this.skyUniforms.uTop.value.copy(a.top),this.skyUniforms.uHorizon.value.copy(a.horizon),this.skyUniforms.uSunColor.value.copy(a.sun),this.skyUniforms.uSunDirection.value.copy(u),this.skyUniforms.uStars.value=a.stars,this.skyUniforms.uTime.value=t,this.sky.position.copy(o.position),this.sky.scale.setScalar(o.far*.5),this.hemisphere.color.copy(a.hemiSky),this.hemisphere.groundColor.copy(a.hemiGround),this.hemisphere.intensity=.55+a.light*.6,this.sun.color.copy(a.sun),this.sun.intensity=a.light*1.1,this.sun.position.copy(i).addScaledVector(u,s*40),this.sun.target.position.copy(i),this.fogColor.copy(a.horizon);let f=this.scene.fog,g=s*34,b=s*150;f&&(f.color.copy(this.fogColor),f.near=g,f.far=b);let m=s*Yv;this.refreshZones(i,m,r),this.ground.position.set(i.x,0,i.z),this.ground.scale.set(m,1,m),this.groundUniforms.uDetail.value=.36*2**r,this.groundUniforms.uLight.value.copy(a.hemiSky).lerp(new Le(1,1,1),.35).multiplyScalar(.55+a.light*.4),this.groundUniforms.uFogColor.value.copy(this.fogColor),this.groundUniforms.uFogNear.value=g,this.groundUniforms.uFogFar.value=b,this.horizon.update(e,i,s,o,this.phase>.05&&this.phase<.7?1:0)}refreshZones(e,t,i){let s=t/fi,r=Math.floor((e.x-t/2)/s)*s,o=Math.floor((e.z-t/2)/s)*s;if(!(Math.abs(r-this.zoneOrigin.x)>t/8||Math.abs(o-this.zoneOrigin.y)>t/8||Math.abs(t-this.zoneMapSize)>t*.2||Number.isNaN(this.zoneOrigin.x))&&i===this.zoneLevel){this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=this.zoneMapSize;return}this.zoneOrigin.set(r,o),this.zoneLevel=i,this.zoneMapSize=t;for(let l=0;l<fi;l+=1)for(let c=0;c<fi;c+=1){let h=Is(r+(c+.5)*s,o+(l+.5)*s,i,this.seed),d=(l*fi+c)*4;this.zoneData[d]=Sd(h.zone)*32,this.zoneData[d+1]=Math.floor(h.variant*255),this.zoneData[d+2]=0,this.zoneData[d+3]=255}this.zoneTexture.needsUpdate=!0,this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=t}dispose(){this.horizon.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose(),this.ground.geometry.dispose(),this.ground.material.dispose(),this.zoneTexture.dispose()}};var Dr=.5,zc=.95,ty=26,ny=5,iy=140,sy=4,ry=8,oy=.1,ay=4,Td=5.5,ly=2.8,cy=2,kc=.35,hy=1.1,Hc=.2,uy=.05,Ad=5e4,dy=72,fy=9,py=.18,my=1.4;function zi(n,e){return Math.atan2(e,n)}function pi(n){return Math.atan2(Math.sin(n),Math.cos(n))}function Mn(n,e){return 1-Math.exp(-n*e)}function gy(n){return 1-.75**Math.max(0,n)}function Gc(n){let e=Math.min(1,Vn(n)/py);return 1-e*e*(3-2*e)}function xy(n){return .58*(n/.3)**.42*(1+2.6*Gc(n))}var tl=class{constructor(e,t,i,s){this.audio=t;this.onHud=i;this.onEvent=s;this.seed=Wi("context-katamari-world"),this.random=on(this.seed^Date.now()),this.renderer=new Ha({canvas:e,antialias:!0,powerPreference:"low-power"}),this.scene.fog=new Js(16777215,10,40),this.environment=new el(this.scene,this.kit,this.seed);for(let l=0;l<14;l+=1){let c=new Ye(this.kit.sphere(2),new Jt({color:16777215,transparent:!0,opacity:0,depthWrite:!1}));c.visible=!1,this.scene.add(c),this.puffs.push({mesh:c,life:0,grow:0})}for(let l=0;l<48;l+=1){let c=new Ye(this.kit.box(),this.kit.solid(ct[l%ct.length]));c.visible=!1,this.scene.add(c),this.confetti.push({mesh:c,velocity:new P,spin:new P,life:0})}for(let l=0;l<28;l+=1){let c=new Ye(this.kit.geometry("octahedron",()=>new ii(.5,0)),this.glintMaterial);c.visible=!1,this.scene.add(c),this.glints.push({mesh:c,velocity:new P,spin:new P,life:0})}let r=this.kit.solid(16762409),o=this.kit.cylinder(18);for(let l=0;l<dy;l+=1){let c=new Ye(o,r);c.visible=!1,this.scene.add(c),this.coins.push({mesh:c,life:0,vy:0,spin:0,size:0})}let a=new pr(.8,1,48);a.rotateX(-Math.PI/2),this.shockwave=new Ye(a,this.shockwaveMaterial),this.shockwave.visible=!1,this.scene.add(this.shockwave)}audio;onHud;onEvent;renderer;scene=new ds;camera=new Nt(55,4/3,.05,200);kit=new Wa;environment;seed;random;props=new Map;chunks=new Set;takenPropIds=new Set;spawnQueue=[];actorCache=new Map;puffs=[];active=null;exiting=[];mode="empty";pendingEntry=null;confetti=[];glints=[];glintMaterial=new Jt({color:16777215,fog:!1});shockwave;shockwaveMaterial=new Jt({color:16777215,transparent:!0,opacity:0,depthWrite:!1,side:cn});shockwaveLife=0;shockwaveRadius=1;drive=kr;manualSeconds=0;lastLookOut=-10;portraits=new Map;cameraFocus=new P;cameraHeading=0;cameraPosition=new P;cameraTarget=new P;cameraRadius=.3;cameraFrame=.3;usedTokens=null;coins=[];cameraFrozen=!1;shake=0;time=0;hudIn=0;frame=0;lastFrameTime=0;running=!1;disposed=!1;lastFillMilestone=-1;resize(e,t,i){e<=0||t<=0||(this.renderer.setPixelRatio(Math.min(i,2)),this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix())}setDrive(e){this.drive=e,dl(e)||(this.manualSeconds=ay)}setStage(e){this.mode=e.mode,e.usedTokens!==void 0&&(this.usedTokens=e.usedTokens);let t=Ns(e.fill);if(e.threadId===null)return;if((this.active?.threadId??this.pendingEntry?.threadId??null)!==e.threadId){this.handoff(e);return}if(this.pendingEntry){this.pendingEntry.fill=e.fill,this.pendingEntry.compactions=e.compactions,this.pendingEntry.ready=e.ready;return}let s=this.active;if(!(!s||!e.ready)){if(!s.synced){s.synced=!0,s.radius=t,s.targetRadius=t,this.setCompactions(s,e.compactions,!1),s.stuck.length<12&&this.prefill(s);return}s.targetRadius=t,e.compactions>s.compactions&&s.phase==="stage"&&!s.pop?s.pop={time:0,fromRadius:s.radius,compactions:e.compactions,burst:!1,startScale:1}:e.compactions!==s.compactions&&!s.pop&&this.setCompactions(s,e.compactions,!1)}}gulp(e){let t=this.active;if(!t||t.phase!=="stage"||t.pop||!(e>0))return;let i=Math.min(1,Math.sqrt(e/uy)*.6);t.gulp={time:0,strength:i,chomps:i<.25?1:i<.6?2:3},this.audio.gulp(i),this.sprinkle(t,3+Math.round(i*7),!0);let s=t.radius*(4+i*8);for(let r of this.props.values()){if(r.size>t.radius*Dr)continue;let o=t.x-r.x,a=t.z-r.z,l=Math.hypot(o,a);if(l>s||l===0)continue;let c=t.radius*(2+i*6);r.vx=o/l*c,r.vz=a/l*c,r.vy=r.size*(2+i*4)}i>=.6&&(this.shake=Math.max(this.shake,.5));for(let r=0;r<3+i*6;r+=1)this.puff(t.x,t.z,t.radius*1.4)}start(){if(this.running||this.disposed)return;this.running=!0,this.lastFrameTime=performance.now();let e=!1,t=i=>{if(!this.running)return;if(e=!e&&this.isCalm(),e){this.frame=window.requestAnimationFrame(t);return}let s=Math.min(.1,(i-this.lastFrameTime)/1e3);this.lastFrameTime=i,this.update(s),this.renderer.render(this.scene,this.camera),this.frame=window.requestAnimationFrame(t)};this.frame=window.requestAnimationFrame(t)}isCalm(){return this.mode!=="rolling"&&this.exiting.length===0&&this.pendingEntry===null&&(this.active===null||this.active.phase==="stage"&&this.active.pop===null&&this.active.gulp===null)&&this.coins.every(e=>e.life<=0)}stop(){this.running=!1,window.cancelAnimationFrame(this.frame),this.audio.setRolling(!1,0)}dispose(){this.stop(),this.disposed=!0,this.props.clear(),this.shockwave.geometry.dispose();for(let e of this.puffs)e.mesh.material.dispose();this.glintMaterial.dispose(),this.shockwaveMaterial.dispose(),this.environment.dispose(),this.kit.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss()}handoff(e){let t=this.active;if(this.active=null,t){let i=new ue(-Math.sin(this.cameraHeading),Math.cos(this.cameraHeading));t.phase="exit",t.phaseTime=0,t.exitDirection.copy(i),this.exiting.push(t),this.cameraFrozen=!0,this.audio.whoosh()}this.pendingEntry={threadId:e.threadId??"",fill:e.fill,compactions:e.compactions,ready:e.ready,delay:t?.45:0,waited:0}}setCompactions(e,t,i){t===e.compactions&&e.moons.total===t||(e.compactions=t,Bc(e.core,this.kit,e.nubColor,t),e.moons.setCount(t,i))}spawnEntering(e,t,i,s){let r=this.exiting.find(h=>h.threadId===e);if(r){this.exiting=this.exiting.filter(h=>h!==r),r.targetRadius=Ns(t),s&&this.setCompactions(r,i,!1),r.phase="enter",r.phaseTime=0,this.active=r,this.onEvent({kind:"enter",threadId:e});return}let o=this.actorCache.get(e);this.actorCache.delete(e);let a=o??this.createActor(e,t,i,s);a.targetRadius=Ns(t),o&&s&&this.setCompactions(a,i,!1);let l=new ue(Math.sin(this.cameraHeading),-Math.cos(this.cameraHeading)),c=Math.max(a.radius,this.cameraRadius)*9;a.x=this.cameraFocus.x+l.x*c,a.z=this.cameraFocus.z+l.y*c,a.heading=zi(-l.x,-l.y),a.phase=this.exiting.length>0||this.hasOrigin?"enter":"stage",a.phaseTime=0,a.speed=0,a.vx=0,a.vz=0,a.phase==="stage"&&(a.x=this.cameraFocus.x,a.z=this.cameraFocus.z),this.hasOrigin=!0,this.scene.add(a.ball,a.rig.root,a.ballShadow,a.cousinShadow),this.active=a,this.lastFillMilestone=Math.floor(Ls(t)*10),this.onEvent({kind:"enter",threadId:e})}hasOrigin=!1;createActor(e,t,i,s){let r=Wi(e),o=on(r),a=fd(this.kit,r),l=new ae,c=new ae;l.add(c);let h=new ae,d=Ne(o,ct);Bc(h,this.kit,d,i),c.add(h);let u=new Xa(this.kit);u.setCount(i,!1),l.add(u.group);let f=new Ye(this.kit.shadowDisc(),this.kit.shadow()),g=new Ye(this.kit.shadowDisc(),this.kit.shadow());f.renderOrder=-1,g.renderOrder=-1;let b=Ns(t),m={threadId:e,rig:a,ball:l,roll:c,core:h,nubColor:d,moons:u,compactions:i,synced:s,pop:null,gulp:null,coinDistance:0,coinsAnnounced:!1,ballShadow:f,cousinShadow:g,x:0,z:0,heading:o()*Math.PI*2,speed:0,vx:0,vz:0,radius:b,targetRadius:b,stuck:[],phase:"stage",phaseTime:0,exitDirection:new ue(1,0),stride:0,idleSeconds:0,turnRate:0,decisionIn:1,behavior:"cruise",behaviorSign:1,seekTarget:null,hungrySeconds:0,lastBonk:0,random:o};return this.prefill(m),m}prefill(e){let t=zr(e.radius),i=16+Math.round(Vn(e.radius)*90);for(let s=0;s<i;s+=1){let r=Math.max(0,t-(e.random()<.6?0:1)),o=Ne(e.random,["room","garden","town","beach","candy"]),a=Oi(e.random,Fi(o,r));if(!a)continue;let l=e.radius*(.14+e.random()*.26);this.attach(e,a,l,this.randomDirection(e.random),e.radius*.84)}}update(e){if(this.time+=e,this.manualSeconds=Math.max(0,this.manualSeconds-e),this.pendingEntry){let o=this.pendingEntry;o.delay-=e,o.waited+=e,o.delay<=0&&(o.ready||o.waited>cy)&&(this.pendingEntry=null,this.spawnEntering(o.threadId,o.fill,o.compactions,o.ready))}let t=this.active;t&&this.updateActor(t,e);for(let o of this.exiting)this.updateActor(o,e);this.exiting=this.exiting.filter(o=>{let a=Math.hypot(o.x-this.cameraFocus.x,o.z-this.cameraFocus.z)>Math.max(o.radius,this.cameraRadius)*14;return o.phaseTime>3.5||a?(this.retire(o),!1):!0}),this.updateCamera(e);let i=this.cameraRadius,s=zr(i);this.refreshChunks(s),this.updateProps(e),this.updatePuffs(e),this.updateConfetti(e),this.updateCoins(e),this.environment.update(e,this.time,this.cameraFocus,i,s,this.camera);let r=t!==null&&t.phase==="stage"&&(this.mode==="rolling"||this.manualSeconds>0)&&t.speed>t.radius*.2;this.audio.setRolling(r,t?t.speed/Math.max(t.radius*2.4,.001):0),this.hudIn-=e,this.hudIn<=0&&t&&(this.hudIn=oy,this.onHud({radius:t.radius,targetRadius:t.targetRadius,compactions:t.compactions,zone:Is(t.x,t.z,s,this.seed).zone,hungry:t.radius<t.targetRadius*.98,steering:this.manualSeconds>0,transitioning:t.phase!=="stage"||this.exiting.length>0}))}retire(e){for(this.scene.remove(e.ball,e.rig.root,e.ballShadow,e.cousinShadow),this.actorCache.set(e.threadId,e);this.actorCache.size>ry;){let t=this.actorCache.keys().next().value;if(t===void 0)break;this.actorCache.delete(t)}this.exiting.length<=1&&(this.cameraFrozen=!1)}updateActor(e,t){e.phaseTime+=t;let i=e.radius,s=0,r=0,o=3,a=0,l=()=>Math.cos(e.heading),c=()=>Math.sin(e.heading);if(e.pop)this.updatePop(e,t);else if(e.phase==="exit"){let C=zi(e.exitDirection.x,e.exitDirection.y);a=pi(C-e.heading)*4,s=l()*i*5,r=c()*i*5}else if(e.phase==="enter"){let C=this.cameraFocus.x-e.x,_=this.cameraFocus.z-e.z,w=Math.hypot(C,_);a=pi(zi(C,_)-e.heading)*4;let I=Math.min(i*4.5,w*2.2);s=l()*I,r=c()*I,(w<i*.6||e.phaseTime>3)&&(e.phase="stage",e.phaseTime=0,this.cameraFrozen=!1)}else if(this.manualSeconds>0&&e===this.active){let C=this.drive;a=C.turn*ly,s=l()*C.forward*i*Td,r=c()*C.forward*i*Td,o=dl(C)?.9:1.8}else if(this.mode==="rolling"){let C=this.wander(e,t);a=C.turn,s=l()*C.speed,r=c()*C.speed,o=2.2}else o=3.5;let h=gy(e.compactions);if(e.phase==="stage"&&e.speed>i*.1){let C=this.manualSeconds>0&&e===this.active;a+=Math.sin(this.time*2.1+e.stride*.13)*h*(C?.7:1.4)}e.heading=pi(e.heading+a*t);let d=Mn(o,t);e.vx+=(s-e.vx)*d,e.vz+=(r-e.vz)*d,e.speed=Math.hypot(e.vx,e.vz),e.speed<i*.01&&s===0&&r===0&&(e.vx=0,e.vz=0,e.speed=0);let u=Math.cos(e.heading),f=Math.sin(e.heading);e.x+=e.vx*t,e.z+=e.vz*t;let g=e.speed*t;if(g>0){let C=new P(e.vz,0,-e.vx).normalize();e.roll.quaternion.premultiply(new Zt().setFromAxisAngle(C,g/i)),e.idleSeconds=0}else e.idleSeconds+=t;e.gulp&&!e.pop&&this.updateGulp(e,t),e.phase==="stage"&&!e.pop&&(this.collide(e),e===this.active&&this.watchAhead(e),this.growToward(e,t)),e.ball.position.set(e.x,e.radius*e.roll.scale.y,e.z),e.core.scale.setScalar(e.radius*1.68),e.ballShadow.position.set(e.x,.002*e.radius,e.z),e.ballShadow.scale.setScalar(e.radius*.95*e.roll.scale.x),e.moons.update(t,e.radius*e.roll.scale.x,this.time);let b=Gc(e.radius),m=xy(e.radius),p=e.radius+m*sn.lerp(.28,.13,b),M=Math.sin(this.time*1.9)*h*m*.12,A=e.x-u*p-f*M,v=e.z-f*p+u*M,E=m*.58,S=Math.min(Math.PI/2-.2,Math.atan2(p-e.radius*.6,Math.max(.001,E-e.radius)));e.rig.root.position.set(A,0,v),e.rig.root.rotation.y=-e.heading,e.rig.root.scale.setScalar(m),e.cousinShadow.position.set(A,.003*e.radius,v),e.cousinShadow.scale.setScalar(m*.3),e.stride+=e.speed/m*t*3.2,pd(e.rig,{stride:e.stride,speed:e.speed/m,idleSeconds:e.idleSeconds,waiting:this.mode==="waiting"&&e===this.active&&e.phase==="stage",time:this.time,reach:S,dizziness:h,stars:Math.min(Za,e.compactions)}),g>0&&this.dropCoins(e,g,A,v,m),e.speed>e.radius*.8&&e.random()<t*10*Math.min(2,e.speed/e.radius)&&this.glint(e),e.speed>e.radius*1.5&&e.random()<t*6&&this.puff(A,v,e.radius)}wander(e,t){let i=e.radius;e.decisionIn-=t;let s=e.radius<e.targetRadius*.98;if(e.decisionIn<=0){let h=e.random();e.behaviorSign=e.random()<.5?-1:1,s&&h<.6?(e.behavior="seek",e.seekTarget=this.nearestPickup(e)):h<.45?e.behavior="cruise":h<.75?e.behavior="swerve":e.behavior="loop",e.decisionIn=e.behavior==="swerve"?.6+e.random()*.8:1.5+e.random()*3}e.turnRate+=(e.random()-.5)*t*4,e.turnRate*=1-Mn(.8,t);let r=e.turnRate+Math.sin(this.time*.9+e.x*.1)*.25,o=i*(4+Math.sin(this.time*.37)*.6);switch(e.behavior){case"swerve":r+=e.behaviorSign*1.7;break;case"loop":r+=e.behaviorSign*1.05,o*=.85;break;case"seek":{let h=e.seekTarget;if(h&&this.props.has(h.id)){let d=zi(h.x-e.x,h.z-e.z);r=pi(d-e.heading)*2.6,o*=1.15}else e.decisionIn=0;break}default:break}let a=i*3.2,l=Math.cos(e.heading),c=Math.sin(e.heading);for(let h of this.props.values()){if(h.size<i*zc||h.lift>i*2)continue;let d=h.x-e.x,u=h.z-e.z,f=d*l+u*c;if(f<=0||f>a+h.size)continue;let g=d*-c+u*l;Math.abs(g)<i+h.size*.8&&(r+=(g>0?-1:1)*2.4*(1-f/(a+h.size)))}return{turn:sn.clamp(r,-2.6,2.6),speed:o}}nearestPickup(e){let t=null,i=Number.POSITIVE_INFINITY;for(let s of this.props.values()){if(s.size>e.radius*Dr||s.size<e.radius*.06)continue;let r=Math.hypot(s.x-e.x,s.z-e.z);if(r>e.radius*14)continue;let o=Math.abs(pi(zi(s.x-e.x,s.z-e.z)-e.heading)),a=r*(1+o);a<i&&(i=a,t=s)}return t}collide(e){let t=e.radius<e.targetRadius*.995;for(let i of[...this.props.values()]){if(i.lift+i.hop>e.radius*1.6)continue;let s=i.x-e.x,r=i.z-e.z,o=Math.hypot(s,r),a=e.radius+i.size*.7;if(o>=a)continue;let l=o>0?s/o:1,c=o>0?r/o:0;if(t&&i.size<=e.radius*Dr){this.rollUp(e,i);continue}if(i.size<e.radius*zc){let d=Math.max(e.speed,e.radius)*1.3;i.vx=l*d,i.vz=c*d,i.hop<=0&&(i.vy=i.size*3),i.x=e.x+l*a,i.z=e.z+c*a;continue}e.x=i.x-l*a,e.z=i.z-c*a;let h=e.vx*l+e.vz*c;h>0&&(e.vx-=l*h*1.4,e.vz-=c*h*1.4),h>e.radius*2.2&&this.knockLoose(e,h,l,c),this.manualSeconds<=0&&(e.heading=pi(zi(-l,-c)+(e.random()-.5)*1.2),e.decisionIn=Math.min(e.decisionIn,.3)),this.time-e.lastBonk>.4&&(e.lastBonk=this.time,this.shake=.35,this.audio.bonk())}}portrait(e){let t=this.portraits.get(e.kind);if(t!==void 0)return t;let i=null;try{let r=new Ht(96,96);r.texture.colorSpace=Yt;let o=new ds;o.add(new Ri(16777215,9080732,1.6));let a=new Ci(16777215,1.4);a.position.set(2,3,2),o.add(a);let l=$a(e,{kit:this.kit,random:()=>0});l.rotation.y=-.7,o.add(l);let c=new Nt(32,1,.1,20);c.position.set(2.6,2.4,3.2),c.lookAt(0,.8,0),this.renderer.setRenderTarget(r),this.renderer.setClearColor(0,0),this.renderer.clear(),this.renderer.render(o,c);let h=new Uint8Array(9216*4);this.renderer.readRenderTargetPixels(r,0,0,96,96,h),this.renderer.setRenderTarget(null);let d=document.createElement("canvas");d.width=96,d.height=96;let u=d.getContext("2d");if(u){let f=u.createImageData(96,96);for(let g=0;g<96;g+=1)f.data.set(h.subarray((95-g)*96*4,(96-g)*96*4),g*96*4);u.putImageData(f,0,0),i=d.toDataURL("image/png")}r.dispose()}catch{i=null}return this.portraits.set(e.kind,i),i}knockLoose(e,t,i,s){let r=Math.min(e.stuck.length-4,1+Math.floor(t/e.radius-2));if(r<=0)return;let o=e.stuck.splice(e.stuck.length-r,r),a=new P;for(let[l,c]of o.entries()){c.object.getWorldPosition(a),e.roll.remove(c.object);let h=this.addProp(c.definition,a.x,a.z,c.size,null,`loose:${this.time}:${l}`,c.object),d=(e.random()-.5)*2;h.vx=(-i+-s*d)*e.radius*3,h.vz=(-s+i*d)*e.radius*3,h.hop=Math.max(0,a.y-c.size),h.vy=e.radius*4}this.onEvent({kind:"knockedOff",count:o.length})}watchAhead(e){if(e.speed<e.radius||this.time-this.lastLookOut<3)return;let t=e.vx/e.speed,i=e.vz/e.speed;for(let s of this.props.values()){if(s.size<e.radius*zc)continue;let r=s.x-e.x,o=s.z-e.z,a=r*t+o*i,l=Math.abs(r*-i+o*t);if(a>0&&a<e.radius*2.5+s.size&&l<e.radius+s.size*.6){this.lastLookOut=this.time,this.onEvent({kind:"lookOut"});return}}}rollUp(e,t){if(this.removeProp(t),this.takenPropIds.add(t.id),this.takenPropIds.size>6e3){let l=this.takenPropIds.values().next().value;l!==void 0&&this.takenPropIds.delete(l)}let s=new P(t.x-e.x,t.lift+t.hop+t.size*.5-e.radius,t.z-e.z).normalize().applyQuaternion(e.roll.quaternion.clone().invert());this.attach(e,t.definition,t.size,s,e.radius*.84,t.object);let r=Math.max(t.size*.1,(e.targetRadius-e.radius)*.14);e.radius=Math.min(e.targetRadius,e.radius+r),e.hungrySeconds=0,this.audio.pickup(t.size/e.radius),this.onEvent({kind:"rolledUp",name:_d(t.definition),size:t.size,image:this.portrait(t.definition)});let o=Vn(e.radius),a=Math.floor(o*10);a>this.lastFillMilestone&&(this.lastFillMilestone=a,this.onEvent({kind:"pickup",fill:o}))}attach(e,t,i,s,r,o){let a=o??$a(t,{kit:this.kit,random:e.random});if(a.scale.setScalar(i),a.position.copy(s).multiplyScalar(r-i*.4),a.quaternion.setFromUnitVectors(new P(0,1,0),s).multiply(new Zt().setFromEuler(new ln((e.random()-.5)*1.8,e.random()*Math.PI*2,(e.random()-.5)*1.8))),e.roll.add(a),e.stuck.push({object:a,definition:t,size:i,depth:r}),e.stuck.length>iy){let l=e.stuck.shift();l&&e.roll.remove(l.object)}}growToward(e,t){let i=e.radius*.84;if(e.stuck=e.stuck.filter(s=>{let r=s.depth+s.size*.9<i;return r&&e.roll.remove(s.object),!r}),e.targetRadius<e.radius*.9){this.shed(e);return}e.radius<e.targetRadius*.98?(e.hungrySeconds+=t,this.mode==="rolling"&&e.hungrySeconds>5?(e.hungrySeconds=0,this.sprinkle(e)):this.mode!=="rolling"&&e.hungrySeconds>my&&(e.hungrySeconds=0,this.sprinkle(e,5,!0))):e.hungrySeconds=0}sortForShrink(e,t,i){let s=e.stuck.filter(l=>l.size<=i*Dr),r=Math.max(4,Math.round(e.stuck.length*(i/t)**2)),o=new Set(s.slice(0,r)),a=e.stuck.filter(l=>!o.has(l));return e.stuck=e.stuck.filter(l=>o.has(l)),a}shed(e){let t=this.sortForShrink(e,e.radius,e.targetRadius);for(let i of t.slice(0,24)){e.roll.remove(i.object);let s=e.random()*Math.PI*2,r=this.addProp(i.definition,e.x+Math.cos(s)*e.radius*1.2,e.z+Math.sin(s)*e.radius*1.2,i.size,null,`shed:${this.time}:${Math.random()}`,i.object);r.vx=Math.cos(s)*e.radius*3,r.vz=Math.sin(s)*e.radius*3,r.vy=e.radius*4}for(let i of t.slice(24))e.roll.remove(i.object);e.radius=e.targetRadius;for(let i of e.stuck)i.depth=Math.min(i.depth,e.radius*.84);for(let i of e.stuck)i.object.position.setLength(i.depth-i.size*.4);this.audio.shed()}updatePop(e,t){let i=e.pop;if(!i)return;if(i.time+=t,i.time<kc){let o=i.time/kc,a=1+.32*(1-(1-o)**3),l=Math.sin(i.time*48)*.07*o;e.roll.scale.set(a*(1+l),a*(1-l),a*(1+l)),this.shake=Math.max(this.shake,.12*o);return}i.burst||(i.burst=!0,this.burst(e,i));let s=Math.min(1,(i.time-kc)/hy),r=s>=1?1:1-2**(-9*s)*Math.cos(s*Math.PI*3.2);e.roll.scale.setScalar(sn.lerp(i.startScale,1,r)),s>=1&&(e.roll.scale.setScalar(1),e.pop=null)}burst(e,t){let i=Math.min(e.targetRadius,t.fromRadius);t.startScale=t.fromRadius*1.32/i;let s=this.sortForShrink(e,t.fromRadius,i),r=new P;for(let[a,l]of s.entries()){if(l.object.getWorldPosition(r),e.roll.remove(l.object),a>=30)continue;let c=r.x-e.x,h=r.z-e.z,d=Math.hypot(c,h)||1,u=this.addProp(l.definition,r.x,r.z,l.size,null,`pop:${this.time}:${a}`,l.object),f=t.fromRadius*(3+e.random()*3);u.vx=c/d*f,u.vz=h/d*f,u.hop=Math.max(0,r.y-l.size),u.vy=t.fromRadius*(5+e.random()*4)}e.radius=i;for(let a of e.stuck)a.depth=Math.min(a.depth,i*.84),a.object.position.setLength(a.depth-a.size*.4);this.setCompactions(e,t.compactions,!0);let o=new P(e.x,t.fromRadius,e.z);for(let a of this.confetti){let l=this.randomDirection(this.random);l.y=Math.abs(l.y)+.3,a.velocity.copy(l.normalize()).multiplyScalar(t.fromRadius*(4+this.random()*5)),a.spin.set(this.random()*12,this.random()*12,this.random()*12),a.life=1.4+this.random()*.8,a.mesh.visible=!0,a.mesh.position.copy(o),a.mesh.scale.set(t.fromRadius*.14,t.fromRadius*.05,t.fromRadius*.09)}this.shockwaveLife=1,this.shockwaveRadius=t.fromRadius,this.shockwave.position.set(e.x,t.fromRadius*.02,e.z),this.shockwave.visible=!0,this.shake=.6,this.audio.pop(),this.onEvent({kind:"compacted",compactions:t.compactions})}glint(e){let t=this.glints.find(s=>s.life<=0);if(!t)return;let i=e.random()*Math.PI*2;t.life=.7,t.mesh.visible=!0,t.mesh.position.set(e.x+Math.cos(i)*e.radius*.9,e.radius*(1+e.random()*.9),e.z+Math.sin(i)*e.radius*.9),t.velocity.set(Math.cos(i)*e.radius*1.2,e.radius*1.6,Math.sin(i)*e.radius*1.2),t.spin.set(0,8,4),t.mesh.scale.setScalar(e.radius*.12)}updateConfetti(e){for(let t of this.glints)t.life<=0||(t.life-=e,t.mesh.position.addScaledVector(t.velocity,e),t.mesh.rotation.y+=t.spin.y*e,t.mesh.scale.multiplyScalar(1-e*1.2),t.life<=0&&(t.mesh.visible=!1));for(let t of this.confetti){if(t.life<=0)continue;t.life-=e;let i=t.mesh.scale.x*40;t.velocity.y-=i*e,t.velocity.multiplyScalar(1-Mn(1.2,e)),t.mesh.position.addScaledVector(t.velocity,e),t.mesh.position.y<0&&(t.mesh.position.y=0,t.velocity.set(0,0,0)),t.mesh.rotation.x+=t.spin.x*e,t.mesh.rotation.y+=t.spin.y*e,t.mesh.rotation.z+=t.spin.z*e,t.life<=0&&(t.mesh.visible=!1)}if(this.shockwaveLife>0){this.shockwaveLife=Math.max(0,this.shockwaveLife-e*1.3);let t=1-this.shockwaveLife;this.shockwave.scale.setScalar(this.shockwaveRadius*(1.2+t*5)),this.shockwaveMaterial.opacity=this.shockwaveLife*.85,this.shockwaveLife===0&&(this.shockwave.visible=!1)}}sprinkle(e,t=5,i=!1){let s=zr(e.radius),r=Is(e.x,e.z,s,this.seed).zone;for(let o=0;o<t;o+=1){let a=Oi(this.random,Fi(r,s))??Oi(this.random,Fi("room",Math.max(0,s-1)));if(!a)continue;let l=i?this.random()*Math.PI*2:(this.random()-.5)*1.4,c=e.radius*(i?1.1+this.random()*1.2:3+this.random()*4),h=e.heading+l,d=this.addProp(a,e.x+Math.cos(h)*c,e.z+Math.sin(h)*c,e.radius*(.2+this.random()*.25),null,`sprinkle:${this.time}:${o}`);d.hop=e.radius*(i?3+this.random()*5:6),d.vy=0,i&&(d.vx=-Math.cos(h)*e.radius*3,d.vz=-Math.sin(h)*e.radius*3)}i||this.onEvent({kind:"sprinkle"})}updateGulp(e,t){let i=e.gulp;if(!i)return;i.time+=t;let s=i.chomps*Hc;if(i.time>=s){e.roll.scale.setScalar(1),e.gulp=null;return}let r=Math.sin(i.time%Hc/Hc*Math.PI),o=r*(.1+i.strength*.22);e.roll.scale.set(1+o*.7,1-o,1+o*.7),i.strength>=.6&&(this.shake=Math.max(this.shake,.3*r))}dropCoins(e,t,i,s,r){let o=this.usedTokens;if(e!==this.active||e.phase!=="stage"||o===null||o<Ad)return;e.coinsAnnounced||(e.coinsAnnounced=!0,this.onEvent({kind:"coins",usedTokens:o}));let a=.35*Math.min(6,o/Ad);for(e.coinDistance+=t/e.radius;e.coinDistance>=1/a;){e.coinDistance-=1/a;let l=this.coins.find(h=>h.life<=0)??this.coins[0],c=Math.max(r*.3,e.radius*.22);l.life=fy,l.size=c,l.vy=c*(9+e.random()*5),l.spin=14+e.random()*10,l.mesh.visible=!0,l.mesh.position.set(i+(e.random()-.5)*c*3,r*.35,s+(e.random()-.5)*c*3),l.mesh.rotation.set(Math.PI/2,e.random()*Math.PI,0),l.mesh.scale.set(c,c*.16,c),this.coins.splice(this.coins.indexOf(l),1),this.coins.push(l),e.random()<.5&&this.audio.coin()}}updateCoins(e){for(let t of this.coins){if(t.life<=0)continue;t.life-=e;let i=t.size*.08,s=t.mesh.position;(s.y>i||t.vy>0)&&(t.vy-=t.size*60*e,s.y=Math.max(i,s.y+t.vy*e),t.mesh.rotation.x+=t.spin*e,s.y===i&&(t.vy=0,t.mesh.rotation.x=0));let r=Math.min(1,t.life/1.2);t.mesh.scale.set(t.size*r,t.size*.16*r,t.size*r),t.life<=0&&(t.mesh.visible=!1)}}randomDirection(e){let t=e()*2-1,i=e()*Math.PI*2,s=Math.sqrt(1-t*t);return new P(s*Math.cos(i),t,s*Math.sin(i))}updateCamera(e){let t=this.active,i=t?.radius??this.cameraRadius;this.cameraRadius+=(i-this.cameraRadius)*Mn(1.6,e);let s=t?Math.max(t.radius,t.rig.root.scale.y*.42):this.cameraFrame;this.cameraFrame+=(s-this.cameraFrame)*Mn(1.6,e);let r=Gc(this.cameraRadius);t&&!this.cameraFrozen&&t.phase==="stage"&&(this.cameraFocus.x+=(t.x-this.cameraFocus.x)*Mn(7,e),this.cameraFocus.z+=(t.z-this.cameraFocus.z)*Mn(7,e),this.cameraHeading+=pi(t.heading-this.cameraHeading)*Mn(3.2,e));let o=this.cameraRadius,a=Math.cos(this.cameraHeading),l=Math.sin(this.cameraHeading),c=this.cameraFrame,h=this.cameraHeading-1.15*r,d=new P(this.cameraFocus.x-Math.cos(h)*c*3.9,c*2.7,this.cameraFocus.z-Math.sin(h)*c*3.9),u=new P(this.cameraFocus.x+a*o*.6,o*.8+(c-o)*.5,this.cameraFocus.z+l*o*.6),f=Mn(5,e);this.cameraPosition.lerp(d,this.cameraPosition.lengthSq()===0?1:f),this.cameraTarget.lerp(u,this.cameraTarget.lengthSq()===0?1:f),this.shake=Math.max(0,this.shake-e);let g=this.shake*this.cameraFrame*.25;this.camera.position.set(this.cameraPosition.x+(Math.random()-.5)*g,this.cameraPosition.y+(Math.random()-.5)*g,this.cameraPosition.z),this.camera.lookAt(this.cameraTarget);let b=Math.max(.01,o*.06),m=o*260;(Math.abs(this.camera.near-b)>b*.05||Math.abs(this.camera.far-m)>m*.05)&&(this.camera.near=b,this.camera.far=m,this.camera.updateProjectionMatrix()),this.clearSightLine(o)}clearSightLine(e){let t=this.camera.position,i=this.cameraFocus.x-t.x,s=e-t.y,r=this.cameraFocus.z-t.z,o=Math.hypot(i,s,r);for(let a of this.props.values()){let l=a.x-t.x,c=a.lift+a.hop+a.size-t.y,h=a.z-t.z,d=(l*i+c*s+h*r)/o,u=!1;if(d>0&&d<o-e){let f=l-i/o*d,g=c-s/o*d,b=h-r/o*d;u=Math.hypot(f,g,b)<a.size*1.1+e*.3}a.object.visible=!u}}chunkSize(e){return .3*2**e*ty}refreshChunks(e){let t=new Set;for(let s of[e-1,e,e+1]){if(s<0)continue;let r=this.chunkSize(s),o=s===e?2:1,a=Math.floor(this.cameraFocus.x/r),l=Math.floor(this.cameraFocus.z/r);for(let c=-o;c<=o;c+=1)for(let h=-o;h<=o;h+=1)t.add(`${s}:${a+c}:${l+h}`)}for(let s of t)this.chunks.has(s)||this.populateChunk(s,e);for(let s of this.chunks)t.has(s)||this.chunks.delete(s);let i=performance.now()+sy;for(;this.spawnQueue.length>0&&performance.now()<i;){let s=this.spawnQueue.shift();!s||!this.chunks.has(s.chunk)||this.takenPropIds.has(s.id)||this.addProp(s.definition,s.x,s.z,s.size,s.chunk,s.id)}for(let s of[...this.props.values()])s.chunk!==null&&!t.has(s.chunk)?this.removeProp(s):s.size<this.cameraRadius*.035?this.removeProp(s):s.chunk===null&&Math.hypot(s.x-this.cameraFocus.x,s.z-this.cameraFocus.z)>this.cameraRadius*60&&this.removeProp(s)}populateChunk(e,t){this.chunks.add(e);let[i,s,r]=e.split(":"),o=Number(i),a=Number(s),l=Number(r),c=this.chunkSize(o),h=on(Wi(`${this.seed}:${e}`));for(let d=0;d<ny;d+=1){let u=`${e}:${d}`,f=(a+h())*c,g=(l+h())*c,b=h(),m=o+(b<.3?-1:b<.78?0:b<.94?1:2),p=Is(f,g,t,this.seed).zone,M=Oi(h,Fi(p,m))??Oi(h,Fi(p,m-1))??Oi(h,Fi(p,m+1)),A=h();if(!M||this.takenPropIds.has(u))continue;let v=.3*2**Math.max(0,m)*(.42+A*.5);this.spawnQueue.push({id:u,chunk:e,definition:M,x:f,z:g,size:v})}}addProp(e,t,i,s,r,o,a){let l=a??$a(e,{kit:this.kit,random:this.random});l.quaternion.identity(),l.scale.setScalar(s);let c=[];l.traverse(d=>{d.userData.spin&&c.push(d)});let h={id:o,object:l,definition:e,size:s,x:t,z:i,lift:e.motion==="fly"?s*1.4:0,heading:this.random()*Math.PI*2,motion:e.motion??null,vx:0,vz:0,vy:0,hop:0,wanderIn:this.random()*3,phase:this.random()*Math.PI*2,chunk:r,spinners:c};return this.scene.add(l),this.props.set(o,h),h}removeProp(e){this.scene.remove(e.object),this.props.delete(e.id)}updateProps(e){let t=this.active;for(let i of this.props.values()){let s=0;if(i.motion==="walk"||i.motion==="drive"){if(i.wanderIn-=e,i.wanderIn<=0&&(i.wanderIn=1.5+this.random()*4,i.heading+=(this.random()-.5)*(i.motion==="drive"?.8:2.4)),s=i.size*(i.motion==="drive"?1.4:.55),t&&t.phase==="stage"&&i.size<=t.radius*Dr){let a=i.x-t.x,l=i.z-t.z;Math.hypot(a,l)<t.radius*4&&(i.heading+=pi(zi(a,l)-i.heading)*Mn(5,e),s*=2.2)}i.x+=Math.cos(i.heading)*s*e,i.z+=Math.sin(i.heading)*s*e}i.x+=i.vx*e,i.z+=i.vz*e;let r=1-Mn(3,e);i.vx*=r,i.vz*=r,(i.hop>0||i.vy>0)&&(i.vy-=i.size*18*e,i.hop=Math.max(0,i.hop+i.vy*e),i.hop===0&&(i.vy=0)),i.phase+=e*(s>0?10:2);let o=0;i.motion==="walk"&&s>0&&(o=Math.abs(Math.sin(i.phase))*i.size*.12),i.motion==="fly"&&(o=Math.sin(i.phase*.4)*i.size*.3),i.motion==="bob"&&(o=Math.max(0,Math.sin(i.phase))*i.size*.08),i.object.position.set(i.x,i.lift+i.hop+o,i.z),i.object.rotation.set(i.hop>0?i.hop/i.size:0,-i.heading,0);for(let a of i.spinners){let l=a.userData.spin;a.rotation[l.axis]+=l.speed*e}}}puff(e,t,i){let s=this.puffs.find(r=>r.life<=0);s&&(s.life=.6,s.grow=i*.28,s.mesh.visible=!0,s.mesh.position.set(e+(Math.random()-.5)*i*.6,i*.1,t+(Math.random()-.5)*i*.6))}updatePuffs(e){for(let t of this.puffs){if(t.life<=0)continue;t.life-=e;let i=1-Math.max(0,t.life)/.6;t.mesh.scale.setScalar(t.grow*(.4+i*.8)),t.mesh.material.opacity=.4*(1-i),t.mesh.position.y+=e*t.grow*.8,t.life<=0&&(t.mesh.visible=!1)}}};var Ps={width:360,height:280},Ds={width:300,height:240};function ki(n,e){let t=il(n.width,Ds.width,Math.max(Ds.width,e.width-32)),i=il(n.height,Ds.height,Math.max(Ds.height,e.height-32));return{width:t,height:i,right:il(n.right,16,Math.max(16,e.width-t-16)),bottom:il(n.bottom,16,Math.max(16,e.height-i-16))}}function Vc(n,e){let t={right:16,bottom:16,...Ps};if(!e)return ki(t,n);let i=n.width-e.right-32;if(i<Ds.width)return ki(t,n);let s=Math.min(Ps.width,i),r=Math.max(Ds.height,Math.round(s*Ps.height/Ps.width));return ki({right:16,bottom:16,width:s,height:r},n)}function Rd(n){if(!n||typeof n!="object")return null;let{right:e,bottom:t,width:i,height:s}=n;return!nl(e)||!nl(t)?null:{right:e,bottom:t,width:nl(i)?i:Ps.width,height:nl(s)?s:Ps.height}}function nl(n){return typeof n=="number"&&Number.isFinite(n)}function il(n,e,t){return Math.min(Math.max(n,e),t)}var Wc=globalThis.__bbPluginRuntime;if(Wc==null||Wc.jsxRuntime==null)throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var sl=Wc.jsxRuntime,tw="default"in sl?sl.default:sl,{Fragment:Lr,jsx:he,jsxs:pt}=sl;var Dd="context-katamari:position",Ld="context-katamari:guide-seen",mi={enter:["Roll, Prince, roll!","Ah, this thread. We remember it.","A fresh cousin arrives!"],rolling:["Work, work! Roll, roll!","Onward! Everything sticks eventually."],resting:["The thread rests. So shall We.","A little break. Very royal."],waiting:["We shall wait right here.","Off elsewhere? We keep the katamari warm."],compacted:["Lighter, and wiser.","Everything that mattered stuck.","A fresh start, with a new star."],sprinkle:["We sprinkle some snacks. Roll them up!"],full:["It is ENORMOUS. Compaction beckons."],knockedOff:["Oh! Things fell off. Careful, Prince."]},Cd=[{tier:"nibble",below:.005},{tier:"bite",below:.02},{tier:"gulp",below:.05},{tier:"heavy",below:Number.POSITIVE_INFINITY}];function Xc(n){return(Cd.find(e=>n<e.below)??Cd[3]).tier}function _y(n,e){return n.length>e?`${n.slice(0,e-1).trimEnd()}\u2026`:n}function vy(n,e){let t=n.prompt?`"${_y(n.prompt,34)}"`:"That turn";if(n.contextTokens<0)return`${t} ended lighter, thanks to a compaction.`;let i=Wn(n.contextTokens);if(n.baseline)return`A thread starts heavy: bb's system prompt and tools came first. ${t} began at ${i}.`;switch(Xc(e?n.contextTokens/e:0)){case"heavy":return`A HEAVY one! ${t} swallowed ${i}.`;case"nibble":return`A light snack: ${t} took just ${i}.`;default:return`${t} swallowed ${i}.`}}function gi(n){return n[Math.floor(Math.random()*n.length)]}function Nr(){return{width:window.innerWidth,height:window.innerHeight}}function Id(){let n=document.querySelector("[data-promptbox-editor-content]")?.parentElement??null;if(!n)return null;let e=n.getBoundingClientRect().width,t=null;for(;n&&n!==document.body;){let i=n.getBoundingClientRect();if(i.width>e+64)break;t={left:i.left,right:i.right},n=n.parentElement}return t}function Pd(){try{let n=Rd(JSON.parse(window.localStorage.getItem(Dd)??"null"));return n?ki(n,Nr()):null}catch{return null}}function yy(n){try{window.localStorage.setItem(Dd,JSON.stringify(n))}catch{}}function by({radius:n}){let e=Math.round(ch(n)),t=Math.floor(e/1e3),i=Math.floor(e%1e3/10),s=e%10;return he("span",{className:"ck-size-text",children:t>0?pt(Lr,{children:[t,he("small",{children:"m"}),i,he("small",{children:"cm"})]}):i===0?pt(Lr,{children:[s,he("small",{children:"mm"})]}):pt(Lr,{children:[i,he("small",{children:"cm"}),s,he("small",{children:"mm"})]})})}var My=["#ff3d7f","#ffe14d","#2fd35a","#2f8cff","#ff8a1d","#c23bff"];function Sy({fill:n}){let e=My.map((i,s)=>{let r=46-s*6.5,o=18-s,a=[];for(let l=0;l<=o*8;l+=1){let c=l/(o*8)*Math.PI*2,h=1+.08*Math.cos(c*o);a.push(`${50+Math.cos(c)*r*h},${50+Math.sin(c)*r*h}`)}return he("polygon",{points:a.join(" "),fill:i},i)}),t=8+n*12;return pt("svg",{className:"ck-flower",viewBox:"0 0 100 100","aria-hidden":"true",children:[e,he("circle",{cx:"50",cy:"50",r:"13",fill:"#6b3ac8"}),he("circle",{cx:"50",cy:"50",r:t,fill:"#f7f5ea",opacity:"0.92"}),he("circle",{cx:"50",cy:"50",r:t*.45,fill:"#e8453c",opacity:"0.85"})]})}function Ey({percentLeft:n}){let e=n<=15,t=(1-n/100)*360;return pt("div",{className:"ck-clock","data-urgent":e,"aria-label":`${n}% of context left`,children:[pt("span",{className:"ck-clock-number",children:[n,he("small",{children:"%"})]}),pt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("circle",{cx:"12",cy:"12",r:"10",className:"ck-clock-face"}),he("line",{x1:"12",y1:"12",x2:"12",y2:"4",className:"ck-clock-hand",transform:`rotate(${t} 12 12)`}),e?he("text",{x:"12",y:"17",textAnchor:"middle",className:"ck-clock-bang",children:"!"}):null]})]})}function wy({mode:n,compactions:e}){return pt("div",{className:"ck-prince-earth","data-mode":n,"aria-hidden":"true",children:[pt("svg",{viewBox:"0 0 80 80",children:[he("defs",{children:pt("radialGradient",{id:"ck-glow",cx:"50%",cy:"50%",r:"50%",children:[he("stop",{offset:"0%",stopColor:"#ffffff",stopOpacity:"0.95"}),he("stop",{offset:"100%",stopColor:"#ffffff",stopOpacity:"0"})]})}),he("circle",{className:"ck-prince-glow",cx:"40",cy:"42",r:"30",fill:"url(#ck-glow)"}),he("circle",{cx:"86",cy:"96",r:"48",fill:"#2f6fd6"}),he("path",{d:"M44 72 q10 -6 20 0 t20 0 M52 82 q10 -6 20 0 t20 0",stroke:"#bfe3ff",strokeWidth:"2.5",fill:"none"}),he("path",{d:"M60 58 q8 -4 12 4 q-6 6 -12 -4z",fill:"#3fae4a"}),pt("g",{className:"ck-prince-figure",children:[he("rect",{x:"22",y:"22",width:"30",height:"13",rx:"6.5",fill:"#7cc242"}),he("rect",{x:"24",y:"22",width:"4",height:"13",fill:"#b4dd72"}),he("rect",{x:"46",y:"22",width:"4",height:"13",fill:"#b4dd72"}),he("rect",{x:"31",y:"23.5",width:"12",height:"10",fill:"#f5d94a"}),he("rect",{x:"32.5",y:"25",width:"9",height:"7",fill:"#f2dcc0"}),he("circle",{cx:"35",cy:"27.5",r:"0.9",fill:"#2b2233"}),he("circle",{cx:"39",cy:"27.5",r:"0.9",fill:"#2b2233"}),he("circle",{cx:"37",cy:"30.3",r:"1",fill:"#d8342f"}),he("path",{d:"M37 16 l2 6 h-4z",fill:"#f5d94a"}),he("circle",{cx:"37",cy:"15",r:"1.8",fill:"#e0312b"}),he("path",{d:"M30 35 h14 l3 13 h-20z",fill:"#7cc242"}),he("rect",{x:"31",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"}),he("rect",{x:"40.6",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"})]})]}),n==="resting"?he("span",{className:"ck-prince-mark",children:"z z"}):null,n==="waiting"?he("span",{className:"ck-prince-mark",children:"?"}):null,e>0?pt("span",{className:"ck-stars",title:`Compacted ${e} ${e===1?"time":"times"}`,children:["\u2726",e>=99?"99+":e]}):null]})}function Ty({turns:n,capacity:e}){if(n.length===0)return null;let t=[...n].reverse(),i=Math.max(1,...t.map(s=>s.baseline?0:Math.max(0,s.contextTokens)));return he("div",{className:"ck-turns",children:he("span",{className:"ck-turn-bars","aria-label":"Context each recent turn swallowed",children:t.map(s=>{let r=Math.max(0,s.contextTokens),o=s.contextTokens<0?"compacted":s.baseline?"setup":Xc(e?r/e:0);return he("span",{className:"ck-turn-bar","data-tier":o,"data-running":s.status==="running",style:{height:`${Math.min(100,Math.max(12,Math.sqrt(r/i)*100))}%`},title:`${s.prompt??"Turn"}
${s.contextTokens<0?"Compacted":`Context +${Wn(r)}${s.baseline?" (system prompt and tools included)":""}`}`},s.turnId)})})})}function Ay(){try{return window.localStorage.getItem(Ld)==="true"}catch{return!1}}var Ry=[["\u{1F3C3}","Rolling on his own","the thread is working"],["\u{1F9CD}","Standing still","idle, or waiting for you"],["\u{1F4A5}","GULP and a shake","one turn swallowed a lot"],["\u{1FA99}","Coin trail","past 50k, every turn re-reads it all"],["\u{1F388}","POP, the ball shrinks","the thread compacted"],["\u{1F4AB}","Dizzy cousin","woozier with each compaction"]];function Cy({onClose:n}){let[e,t]=$t("hud"),i=pt("div",{className:"ck-guide-actions",children:[he("button",{type:"button",className:"ck-guide-arrow","aria-label":"Previous page",disabled:e==="hud",onClick:()=>t("hud"),children:"\u2039"}),pt("span",{className:"ck-guide-dots","aria-hidden":"true",children:[he("span",{"data-on":e==="hud"}),he("span",{"data-on":e==="events"})]}),he("button",{type:"button",className:"ck-guide-arrow","aria-label":"Next page",disabled:e==="events",onClick:()=>t("events"),children:"\u203A"}),e==="events"?he("button",{type:"button",className:"ck-guide-close",onClick:n,children:"Got it"}):null]});return he("div",{className:"ck-guide","data-page":e,role:"dialog","aria-label":"What everything means",children:e==="hud"?pt(Lr,{children:[he("span",{className:"ck-guide-label","data-spot":"size",children:"\u2191 Size \xB7 tokens used / max"}),he("span",{className:"ck-guide-label","data-spot":"clock",children:"\u2191 Context left"}),he("span",{className:"ck-guide-label","data-spot":"turns",children:"Each turn's context \u2191"}),he("span",{className:"ck-guide-label","data-spot":"item",children:"\u2190 Last thing the ball picked up"}),he("span",{className:"ck-guide-label","data-spot":"stars",children:"Times compacted \u2197"}),pt("div",{className:"ck-guide-card",children:[he("p",{children:"The ball grows as this thread fills its context. At the limit, bb compacts it: POP!"}),he("p",{className:"ck-guide-keys",children:"Click, then roll with the arrow keys."}),i]})]}):pt("div",{className:"ck-guide-card","data-page":"events",children:[he("ul",{className:"ck-guide-events",children:Ry.map(([s,r,o])=>pt("li",{children:[he("span",{"aria-hidden":"true",children:s}),pt("span",{children:[he("b",{children:r})," ",o]})]},r))}),i]})})}function Iy({text:n}){let[e,t]=$t(0);return dn(()=>{t(0);let i=window.setInterval(()=>{t(s=>s>=n.length?(window.clearInterval(i),s):s+1)},30);return()=>window.clearInterval(i)},[n]),he("span",{"aria-hidden":"true",children:n.slice(0,e)})}function Nd({stage:n,muted:e,onMutedChange:t,onClose:i}){let s=Dt(null),r=Dt(null),o=Dt(null),a=Dt(new Set),[l,c]=$t(null),[h,d]=$t(null),[u,f]=$t(null),[g,b]=$t(null),[m,p]=$t(0),[M,A]=$t(!1),[v,E]=$t(!1),[S,C]=$t(()=>!Ay()),_=Dt(!1),[w,I]=$t(()=>{let W=Pd();return _.current=W!==null,W??Vc(Nr(),Id())}),L=Dt(null),B=Dt(0),G=Dt(0),N=Dt(0),z=Dt(0),X=Vi(W=>{window.clearTimeout(B.current);let j=Math.max(3.8,W.length*.03+2.2);d({text:W,key:Date.now(),seconds:j}),N.current=Date.now()+j*1e3,B.current=window.setTimeout(()=>d(null),j*1e3)},[]),Y=Vi(W=>{let j=N.current-Date.now();if(j<=0){X(W);return}window.clearTimeout(z.current),z.current=window.setTimeout(()=>Y(W),j+300)},[X]),re=Vi(W=>{switch(W.kind){case"enter":X(gi(mi.enter));break;case"pickup":Y(W.fill>=.95?gi(mi.full):`Splendid! ${Math.round(W.fill*100)}% full.`);break;case"compacted":X(`POP! Compaction #${W.compactions}. ${gi(mi.compacted)}`);break;case"sprinkle":Y(gi(mi.sprinkle));break;case"rolledUp":b({name:W.name,image:W.image,key:Date.now()});break;case"lookOut":window.clearTimeout(G.current),p(Date.now()),G.current=window.setTimeout(()=>p(0),1800);break;case"knockedOff":X(gi(mi.knockedOff));break;case"coins":Y(`${Wn(W.usedTokens)} tokens! Every turn re-reads all of it. Coins, coins, coins!`);break}},[X,Y]),Z=Dt(re);Z.current=re;let ee={threadId:n.threadId,mode:n.mode,fill:n.fill,compactions:n.compactions,ready:n.ready,usedTokens:n.usedTokens},ne=Dt(ee);ne.current=ee,dn(()=>{let W=s.current;if(!W)return;let j=new Hr(e);j.unlock(),o.current=j;let Ae=null,Ce=null,ke=0,Ve=0,D=()=>{let $e=new tl(W,j,O=>c(O),O=>Z.current(O));Ae=$e,r.current=$e;let T=()=>{let O=W.getBoundingClientRect();$e.resize(O.width,O.height,window.devicePixelRatio||1)};T(),Ce=new ResizeObserver(T),Ce.observe(W),$e.setStage(ne.current),$e.start(),E(!0);let x=()=>{$e.setDrive(hh(a.current)),Ve=window.requestAnimationFrame(x)};Ve=window.requestAnimationFrame(x)},lt=window.requestAnimationFrame(()=>{ke=window.setTimeout(D,0)});return()=>{window.cancelAnimationFrame(lt),window.cancelAnimationFrame(Ve),window.clearTimeout(ke),Ce?.disconnect(),Ae?.dispose(),j.dispose(),r.current=null,o.current=null,window.clearTimeout(B.current),window.clearTimeout(z.current),window.clearTimeout(G.current)}},[]),dn(()=>{r.current?.setStage(ne.current)},[n.threadId,n.mode,n.fill,n.compactions,n.ready,n.usedTokens]);let De=Dt({threadId:null,usedTokens:null,ready:!1});dn(()=>{let W=De.current;if(De.current={threadId:n.threadId,usedTokens:n.usedTokens,ready:n.ready},W.threadId!==n.threadId)return;let j=W.usedTokens===null&&W.ready&&n.compactions===0,Ae=j?0:W.usedTokens;if(Ae===null||n.usedTokens===null||n.capacityTokens===null||n.usedTokens<=Ae)return;let Ce=n.usedTokens-Ae,ke=Ce/n.capacityTokens,Ve=j?"setup":Xc(ke);r.current?.gulp(ke),f({text:j?`+${Wn(Ce)} setup`:`${Ve==="heavy"?"GULP! ":""}+${Wn(Ce)}`,tier:Ve,key:Date.now()})},[n.threadId,n.usedTokens,n.capacityTokens,n.ready,n.compactions]);let Te=Dt(new Map),tt=n.turns.find(W=>W.status!=="running")??null;dn(()=>{if(n.threadId===null||!n.ready)return;let W=Te.current,j=W.get(n.threadId);W.set(n.threadId,tt?.turnId??""),!(j===void 0||tt===null||j===tt.turnId)&&X(vy(tt,n.capacityTokens))},[X,n.threadId,n.ready,tt?.turnId]);let Je=Dt(n.mode);dn(()=>{if(Je.current===n.mode)return;let W=Je.current==="empty";Je.current=n.mode,!W&&(n.mode==="rolling"&&X(gi(mi.rolling)),n.mode==="resting"&&X(gi(mi.resting)),n.mode==="waiting"&&X(gi(mi.waiting)))},[X,n.mode]),dn(()=>{o.current?.setMuted(e)},[e]),dn(()=>{let W=()=>I(Ae=>_.current?Pd()??ki(Ae,Nr()):Vc(Nr(),Id())),j=window.requestAnimationFrame(W);return window.addEventListener("resize",W),()=>{window.cancelAnimationFrame(j),window.removeEventListener("resize",W)}},[]);let st=W=>{if(W.key==="Escape"){W.currentTarget.blur();return}!ul.has(W.key)||W.metaKey||W.ctrlKey||W.altKey||(W.preventDefault(),W.stopPropagation(),a.current.add(W.key))},K=W=>{ul.has(W.key)&&(W.preventDefault(),a.current.delete(W.key))},te=W=>{if(C(W),!W)try{window.localStorage.setItem(Ld,"true")}catch{}},_e=()=>{a.current.clear(),r.current?.setDrive(kr),A(!1)},Ge=W=>j=>{j.button===0&&(j.preventDefault(),j.currentTarget.setPointerCapture(j.pointerId),L.current={kind:W,pointerId:j.pointerId,startX:j.clientX,startY:j.clientY,origin:w})},Se=W=>{let j=L.current;if(!j||j.pointerId!==W.pointerId)return;let Ae=W.clientX-j.startX,Ce=W.clientY-j.startY;I(ki(j.kind==="move"?{...j.origin,right:j.origin.right-Ae,bottom:j.origin.bottom-Ce}:{...j.origin,width:j.origin.width-Ae,height:j.origin.height-Ce},Nr()))},He=W=>{let j=L.current;!j||j.pointerId!==W.pointerId||(L.current=null,_.current=!0,I(Ae=>(yy(Ae),Ae)))},rt=l?.radius??.3,ie=l?.targetRadius??rt,le=Math.max(0,Math.min(99,Math.round((1-n.fill)*100))),ce=n.usedTokens!==null&&n.capacityTokens!==null?`${Wn(n.usedTokens)} / ${Wn(n.capacityTokens)}`:"\u2014";return pt("div",{className:"ck-window",style:{right:w.right,bottom:w.bottom,width:w.width,height:w.height},"data-mode":n.mode,"data-focused":M,"data-ready":v,role:"region","aria-label":"Context Katamari",children:[pt("div",{className:"ck-stage",tabIndex:0,"aria-label":"Katamari world. Click, then roll with the arrow keys. Escape to let go.",onFocus:()=>{A(!0),o.current?.unlock()},onBlur:_e,onPointerDown:()=>o.current?.unlock(),onKeyDown:st,onKeyUp:K,children:[he("canvas",{ref:s,className:"ck-canvas"}),pt("div",{className:"ck-gauge","aria-label":`Katamari ${Math.round(Vn(ie)*100)}% of context`,children:[he(Sy,{fill:Vn(rt)}),he(by,{radius:rt}),pt("span",{className:"ck-goal",children:[pt("svg",{viewBox:"0 0 40 16","aria-hidden":"true",children:[he("path",{d:"M2 12 Q 20 2 36 8"}),he("path",{d:"M31 4 l6 4 -7 2"})]}),ce]})]}),he(Ey,{percentLeft:le}),he(Ty,{turns:n.turns,capacity:n.capacityTokens}),u?he("div",{className:"ck-gulp","data-tier":u.tier,"aria-hidden":"true",onAnimationEnd:()=>f(null),children:u.text},u.key):null,he("div",{className:"ck-title",title:n.title??void 0,children:n.title??"Open a thread"}),h?pt("div",{className:"ck-king",role:"status","aria-label":h.text,style:{animationDuration:`${h.seconds}s`},children:[he("span",{className:"ck-king-face","aria-hidden":"true",children:"\u265B"}),he("span",{className:"ck-king-caption",children:he(Iy,{text:h.text})})]},h.key):null,pt("div",{className:"ck-item","data-look-out":m!==0,children:[m!==0?he("span",{className:"ck-look-out",children:"LOOK OUT!"}):null,he("div",{className:"ck-item-disc",children:g?.image?he("img",{src:g.image,alt:""},g.key):null}),g?he("span",{className:"ck-item-name",children:g.name},g.key):null]}),he(wy,{mode:n.mode,compactions:l?.compactions??n.compactions}),S?he(Cy,{onClose:()=>te(!1)}):null,he("div",{className:"ck-hint","aria-hidden":"true",children:M?"\u2191\u2193 roll \xB7 \u2190\u2192 steer":"Click, then use the arrow keys"})]}),he("div",{className:"ck-grip",role:"presentation",title:"Drag to move",onPointerDown:Ge("move"),onPointerMove:Se,onPointerUp:He,onPointerCancel:He,children:he("span",{})}),he("div",{className:"ck-resize",role:"presentation",title:"Drag to resize",onPointerDown:Ge("resize"),onPointerMove:Se,onPointerUp:He,onPointerCancel:He}),pt("div",{className:"ck-controls",children:[he("button",{type:"button",className:"ck-button","aria-label":S?"Hide the guide":"What everything means","aria-pressed":S,title:S?"Hide the guide":"What everything means",onClick:()=>te(!S),children:he("span",{className:"ck-button-glyph","aria-hidden":"true",children:"?"})}),he("button",{type:"button",className:"ck-button","aria-label":e?"Unmute":"Mute","aria-pressed":e,title:e?"Unmute":"Mute",onClick:()=>t(!e),children:e?pt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),he("path",{d:"M17 9l4 6M21 9l-4 6"})]}):pt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),he("path",{d:"M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"})]})}),he("button",{type:"button",className:"ck-button","aria-label":"Close Context Katamari",title:"Close",onClick:i,children:he("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:he("path",{d:"M6 6l12 12M18 6L6 18"})})})]})]})}var qc={threadId:null,mode:"empty"};function Ud(n,e){if(e.threadId===null)return{state:n.threadId===null?qc:{threadId:n.threadId,mode:"waiting"},handoff:null};let t=e.working?"rolling":"resting";return n.threadId===e.threadId?{state:{threadId:e.threadId,mode:t},handoff:null}:{state:{threadId:e.threadId,mode:t},handoff:{exitingThreadId:n.threadId,enteringThreadId:e.threadId}}}var Py=new Set(["starting","active"]),Dy=new Set(["runtime","working-draft","workflow","background-agent","background-command"]);function Fd(n){return n.indicator==="waiting-for-input"?!1:n.status!==void 0?Py.has(n.status):Dy.has(n.indicator)}var Ly="context-katamari:open",Ny="context-katamari:muted",Uy=4e3,Fy=3e4,Oy=[];function zd(n,e){let t=new Set,i=e;try{let s=window.localStorage.getItem(n);s!==null&&(i=s==="true")}catch{}return{get:()=>i,set(s){i=s;try{window.localStorage.setItem(n,String(s))}catch{}for(let r of t)r()},subscribe(s){return t.add(s),()=>t.delete(s)}}}var rl=zd(Ly,!1),Od=zd(Ny,!1);function Bd(n){return ih(n.subscribe,n.get,n.get)}function By(n,e,t){let i=ah(),[s,r]=$t(new Map),o=Vi(a=>{i.call("readThreadContext",{threadId:a}).then(l=>{r(c=>{let h=c.get(a);if(h!==void 0&&h?.usage?.usedTokens===l.usage?.usedTokens&&h?.usage?.capacityTokens===l.usage?.capacityTokens&&h?.compactions===l.compactions&&JSON.stringify(h?.turns??[])===JSON.stringify(l.turns??[]))return c;let d=new Map(c);return d.set(a,l),d})}).catch(l=>{console.warn("Context Katamari could not read thread context",l)})},[i]);return dn(()=>{if(n===null)return;o(n);let a=window.setInterval(()=>o(n),e?Uy:Fy);return()=>window.clearInterval(a)},[o,n,e,t]),n===null?null:s.get(n)??null}function zy(){let n=Bd(rl),e=Bd(Od);return n?he(ky,{muted:e,onMutedChange:Od.set,onClose:()=>rl.set(!1)}):null}function ky({muted:n,onMutedChange:e,onClose:t}){let{threadId:i}=oh(),s=rh(),r=cl(()=>i===null?null:s.threads.find(f=>f.id===i)??null,[i,s.threads]),o=r?Fd(r):!1,a=Dt(qc),l=cl(()=>{let f=Ud(a.current,{threadId:i,working:o});return a.current=f.state,f.state},[i,o]),c=l.threadId===null?null:s.threads.find(f=>f.id===l.threadId)??null,h=By(l.threadId,l.mode==="rolling",c?.updatedAt??null),d=h?.usage??null,u={threadId:l.threadId,mode:l.mode,fill:d?lh(d.usedTokens,d.capacityTokens):0,compactions:h?.compactions??0,ready:h!==null,title:c?c.title?.trim()||c.titleFallback?.trim()||"Untitled thread":l.threadId===null?null:"Thread",usedTokens:d?.usedTokens??null,capacityTokens:d?.capacityTokens??null,turns:h?.turns??Oy};return he(Nd,{stage:u,muted:n,onMutedChange:e,onClose:t})}var yw=sh(n=>{n.slots.sidebarFooterAction({id:"toggle",title:"Context Katamari",icon:"Circle",run:()=>rl.set(!rl.get())}),n.slots.experimental_appOverlay({id:"window",component:zy})});export{yw as default};
