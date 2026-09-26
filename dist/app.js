var ZS=Object.defineProperty;var ui=(n,e)=>{for(var t in e)ZS(n,t,{get:e[t],enumerable:!0})};var Qh=globalThis.__bbPluginRuntime;if(Qh==null||Qh.react==null)throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var Za=Qh.react,H3="default"in Za?Za.default:Za,{Activity:G3,Children:V3,Component:$3,Fragment:W3,Profiler:Z3,PureComponent:X3,StrictMode:q3,Suspense:Y3,act:J3,cache:j3,cacheSignal:K3,captureOwnerStack:Q3,cloneElement:eI,createContext:tI,createElement:nI,createRef:iI,forwardRef:rI,isValidElement:sI,lazy:oI,memo:aI,startTransition:cI,unstable_useCacheRefresh:lI,use:uI,useActionState:hI,useCallback:Vr,useContext:dI,useDebugValue:fI,useDeferredValue:pI,useEffect:On,useEffectEvent:mI,useId:gI,useImperativeHandle:xI,useInsertionEffect:_I,useLayoutEffect:vI,useMemo:ed,useOptimistic:yI,useReducer:bI,useRef:Gt,useState:cn,useSyncExternalStore:Kx,useTransition:SI,version:MI}=Za;var td=globalThis.__bbPluginRuntime;if(td==null||td.pluginSdkApp==null)throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var Xa=td.pluginSdkApp,EI="default"in Xa?Xa.default:Xa,{Markdown:TI,ThreadChat:AI,ThreadTitle:RI,UrlLink:CI,definePluginApp:Qx,experimental_BranchPicker:PI,experimental_Diff:II,experimental_FileLink:NI,experimental_Icon:DI,experimental_NewThreadComposer:zI,experimental_PermissionModePicker:LI,experimental_ProviderIcon:UI,experimental_ProviderModelPicker:OI,experimental_SourceCode:FI,experimental_useAppPanel:kI,experimental_useBranches:BI,experimental_useCheckoutState:HI,experimental_useCodeTheme:GI,experimental_useFixedTabTarget:VI,experimental_useProviders:$I,experimental_useSidebarThreadActions:WI,experimental_useSidebarThreadPullRequest:ZI,experimental_useSidebarThreadSplit:XI,experimental_useSidebarThreads:e_,useBbContext:t_,useBbNavigate:qI,useComposer:YI,useComposerView:JI,useEnvironmentProviders:jI,useRealtime:n_,useRealtimeConnectionState:KI,useRpc:i_,useSdk:QI,useSettings:eN,useSidebarSplitLayout:tN,useSidebarThreadDraft:nN,useSidebarThreadDraftIds:iN,useSidebarThreadRowStatus:rN,useSidebarThreadRowStatuses:sN,useSidebarThreadShortcut:oN}=Xa;var Ft={};ui(Ft,{$brand:()=>id,$input:()=>Tp,$output:()=>Ep,NEVER:()=>nd,TimePrecision:()=>Pp,ZodAny:()=>v0,ZodArray:()=>M0,ZodBase64:()=>yl,ZodBase64URL:()=>bl,ZodBigInt:()=>vs,ZodBigIntFormat:()=>wl,ZodBoolean:()=>_s,ZodCIDRv4:()=>_l,ZodCIDRv6:()=>vl,ZodCUID:()=>hl,ZodCUID2:()=>dl,ZodCatch:()=>W0,ZodCodec:()=>Bo,ZodCustom:()=>Ho,ZodCustomStringFormat:()=>gs,ZodDate:()=>Lo,ZodDefault:()=>k0,ZodDiscriminatedUnion:()=>E0,ZodE164:()=>Sl,ZodEmail:()=>cl,ZodEmoji:()=>ll,ZodEnum:()=>ps,ZodError:()=>Rw,ZodExactOptional:()=>U0,ZodFile:()=>z0,ZodFirstPartyTypeKind:()=>rg,ZodFunction:()=>tg,ZodGUID:()=>Po,ZodIPv4:()=>gl,ZodIPv6:()=>xl,ZodISODate:()=>nl,ZodISODateTime:()=>tl,ZodISODuration:()=>rl,ZodISOTime:()=>il,ZodIntersection:()=>T0,ZodIssueCode:()=>Pw,ZodJWT:()=>Ml,ZodKSUID:()=>ml,ZodLazy:()=>K0,ZodLiteral:()=>D0,ZodMAC:()=>d0,ZodMap:()=>I0,ZodNaN:()=>X0,ZodNanoID:()=>ul,ZodNever:()=>b0,ZodNonOptional:()=>Pl,ZodNull:()=>x0,ZodNullable:()=>F0,ZodNumber:()=>xs,ZodNumberFormat:()=>xr,ZodObject:()=>Oo,ZodOptional:()=>Cl,ZodPipe:()=>ko,ZodPrefault:()=>H0,ZodPreprocess:()=>q0,ZodPromise:()=>eg,ZodReadonly:()=>Y0,ZodRealError:()=>_n,ZodRecord:()=>fs,ZodSet:()=>N0,ZodString:()=>ms,ZodStringFormat:()=>Et,ZodSuccess:()=>$0,ZodSymbol:()=>m0,ZodTemplateLiteral:()=>j0,ZodTransform:()=>L0,ZodTuple:()=>R0,ZodType:()=>nt,ZodULID:()=>fl,ZodURL:()=>zo,ZodUUID:()=>ti,ZodUndefined:()=>g0,ZodUnion:()=>Fo,ZodUnknown:()=>y0,ZodVoid:()=>S0,ZodXID:()=>pl,ZodXor:()=>w0,_ZodString:()=>al,_default:()=>B0,_function:()=>Zv,any:()=>Mv,array:()=>Uo,base64:()=>ov,base64url:()=>av,bigint:()=>_v,boolean:()=>p0,catch:()=>Z0,check:()=>Xv,cidrv4:()=>rv,cidrv6:()=>sv,clone:()=>ln,codec:()=>Gv,coerce:()=>sg,config:()=>Ot,core:()=>fi,cuid:()=>J_,cuid2:()=>j_,custom:()=>qv,date:()=>Ev,decode:()=>s0,decodeAsync:()=>a0,describe:()=>Yv,discriminatedUnion:()=>Iv,e164:()=>cv,email:()=>B_,emoji:()=>q_,encode:()=>r0,encodeAsync:()=>o0,endsWith:()=>is,enum:()=>Al,exactOptional:()=>O0,file:()=>Fv,flattenError:()=>xo,float32:()=>pv,float64:()=>mv,formatError:()=>_o,fromJSONSchema:()=>ny,function:()=>Zv,getErrorMap:()=>Nw,globalRegistry:()=>Xt,gt:()=>Qn,gte:()=>hn,guid:()=>H_,hash:()=>fv,hex:()=>dv,hostname:()=>hv,httpUrl:()=>X_,includes:()=>ts,instanceof:()=>jv,int:()=>sl,int32:()=>gv,int64:()=>vv,intersection:()=>A0,invertCodec:()=>Vv,ipv4:()=>tv,ipv6:()=>iv,iso:()=>ds,json:()=>Qv,jwt:()=>lv,keyof:()=>Tv,ksuid:()=>ev,lazy:()=>Q0,length:()=>mr,literal:()=>Ov,locales:()=>Eo,looseObject:()=>Cv,looseRecord:()=>Dv,lowercase:()=>Qr,lt:()=>Kn,lte:()=>Mn,mac:()=>nv,map:()=>zv,maxLength:()=>pr,maxSize:()=>Pi,meta:()=>Jv,mime:()=>rs,minLength:()=>di,minSize:()=>ei,multipleOf:()=>Ci,nan:()=>Hv,nanoid:()=>Y_,nativeEnum:()=>Uv,negative:()=>Wc,never:()=>El,nonnegative:()=>Xc,nonoptional:()=>V0,nonpositive:()=>Zc,normalize:()=>ss,null:()=>_0,nullable:()=>No,nullish:()=>kv,number:()=>f0,object:()=>Av,optional:()=>Io,overwrite:()=>kn,parse:()=>e0,parseAsync:()=>t0,partialRecord:()=>Nv,pipe:()=>ol,positive:()=>$c,prefault:()=>G0,preprocess:()=>ey,prettifyError:()=>xd,promise:()=>Wv,property:()=>qc,readonly:()=>J0,record:()=>P0,refine:()=>ng,regex:()=>Kr,regexes:()=>Sn,registry:()=>Mc,safeDecode:()=>l0,safeDecodeAsync:()=>h0,safeEncode:()=>c0,safeEncodeAsync:()=>u0,safeParse:()=>n0,safeParseAsync:()=>i0,set:()=>Lv,setErrorMap:()=>Iw,size:()=>fr,slugify:()=>ls,startsWith:()=>ns,strictObject:()=>Rv,string:()=>Co,stringFormat:()=>uv,stringbool:()=>Kv,success:()=>Bv,superRefine:()=>ig,symbol:()=>bv,templateLiteral:()=>$v,toJSONSchema:()=>Kc,toLowerCase:()=>as,toUpperCase:()=>cs,transform:()=>Rl,treeifyError:()=>gd,trim:()=>os,tuple:()=>C0,uint32:()=>xv,uint64:()=>yv,ulid:()=>K_,undefined:()=>Sv,union:()=>Tl,unknown:()=>gr,uppercase:()=>es,url:()=>Z_,util:()=>Ye,uuid:()=>G_,uuidv4:()=>V_,uuidv6:()=>$_,uuidv7:()=>W_,void:()=>wv,xid:()=>Q_,xor:()=>Pv});var fi={};ui(fi,{$ZodAny:()=>Xf,$ZodArray:()=>Kf,$ZodAsyncError:()=>Fn,$ZodBase64:()=>Of,$ZodBase64URL:()=>Ff,$ZodBigInt:()=>xc,$ZodBigIntFormat:()=>Vf,$ZodBoolean:()=>So,$ZodCIDRv4:()=>zf,$ZodCIDRv6:()=>Lf,$ZodCUID:()=>Sf,$ZodCUID2:()=>Mf,$ZodCatch:()=>gp,$ZodCheck:()=>At,$ZodCheckBigIntFormat:()=>jd,$ZodCheckEndsWith:()=>uf,$ZodCheckGreaterThan:()=>hc,$ZodCheckIncludes:()=>cf,$ZodCheckLengthEquals:()=>rf,$ZodCheckLessThan:()=>uc,$ZodCheckLowerCase:()=>of,$ZodCheckMaxLength:()=>tf,$ZodCheckMaxSize:()=>Kd,$ZodCheckMimeType:()=>df,$ZodCheckMinLength:()=>nf,$ZodCheckMinSize:()=>Qd,$ZodCheckMultipleOf:()=>Yd,$ZodCheckNumberFormat:()=>Jd,$ZodCheckOverwrite:()=>ff,$ZodCheckProperty:()=>hf,$ZodCheckRegex:()=>sf,$ZodCheckSizeEquals:()=>ef,$ZodCheckStartsWith:()=>lf,$ZodCheckStringFormat:()=>jr,$ZodCheckUpperCase:()=>af,$ZodCodec:()=>wo,$ZodCustom:()=>wp,$ZodCustomStringFormat:()=>Hf,$ZodDate:()=>jf,$ZodDefault:()=>dp,$ZodDiscriminatedUnion:()=>tp,$ZodE164:()=>kf,$ZodEmail:()=>_f,$ZodEmoji:()=>yf,$ZodEncodeError:()=>wi,$ZodEnum:()=>op,$ZodError:()=>go,$ZodExactOptional:()=>up,$ZodFile:()=>cp,$ZodFunction:()=>bp,$ZodGUID:()=>gf,$ZodIPv4:()=>If,$ZodIPv6:()=>Nf,$ZodISODate:()=>Rf,$ZodISODateTime:()=>Af,$ZodISODuration:()=>Pf,$ZodISOTime:()=>Cf,$ZodIntersection:()=>np,$ZodJWT:()=>Bf,$ZodKSUID:()=>Tf,$ZodLazy:()=>Mp,$ZodLiteral:()=>ap,$ZodMAC:()=>Df,$ZodMap:()=>rp,$ZodNaN:()=>xp,$ZodNanoID:()=>bf,$ZodNever:()=>Yf,$ZodNonOptional:()=>pp,$ZodNull:()=>Zf,$ZodNullable:()=>hp,$ZodNumber:()=>gc,$ZodNumberFormat:()=>Gf,$ZodObject:()=>z_,$ZodObjectJIT:()=>Qf,$ZodOptional:()=>vc,$ZodPipe:()=>yc,$ZodPrefault:()=>fp,$ZodPreprocess:()=>_p,$ZodPromise:()=>Sp,$ZodReadonly:()=>vp,$ZodRealError:()=>xn,$ZodRecord:()=>ip,$ZodRegistry:()=>Sc,$ZodSet:()=>sp,$ZodString:()=>dr,$ZodStringFormat:()=>wt,$ZodSuccess:()=>mp,$ZodSymbol:()=>$f,$ZodTemplateLiteral:()=>yp,$ZodTransform:()=>lp,$ZodTuple:()=>_c,$ZodType:()=>Ke,$ZodULID:()=>wf,$ZodURL:()=>vf,$ZodUUID:()=>xf,$ZodUndefined:()=>Wf,$ZodUnion:()=>Mo,$ZodUnknown:()=>qf,$ZodVoid:()=>Jf,$ZodXID:()=>Ef,$ZodXor:()=>ep,$brand:()=>id,$constructor:()=>F,$input:()=>Tp,$output:()=>Ep,Doc:()=>bo,JSONSchema:()=>O_,JSONSchemaGenerator:()=>Qc,NEVER:()=>nd,TimePrecision:()=>Pp,_any:()=>jp,_array:()=>rm,_base64:()=>Bc,_base64url:()=>Hc,_bigint:()=>$p,_boolean:()=>Gp,_catch:()=>yw,_check:()=>U_,_cidrv4:()=>Fc,_cidrv6:()=>kc,_coercedBigint:()=>Wp,_coercedBoolean:()=>Vp,_coercedDate:()=>nm,_coercedNumber:()=>Up,_coercedString:()=>Rp,_cuid:()=>Ic,_cuid2:()=>Nc,_custom:()=>om,_date:()=>tm,_decode:()=>tc,_decodeAsync:()=>ic,_default:()=>xw,_discriminatedUnion:()=>sw,_e164:()=>Gc,_email:()=>wc,_emoji:()=>Cc,_encode:()=>ec,_encodeAsync:()=>nc,_endsWith:()=>is,_enum:()=>hw,_file:()=>sm,_float32:()=>Fp,_float64:()=>kp,_gt:()=>Qn,_gte:()=>hn,_guid:()=>To,_includes:()=>ts,_int:()=>Op,_int32:()=>Bp,_int64:()=>Zp,_intersection:()=>ow,_ipv4:()=>Uc,_ipv6:()=>Oc,_isoDate:()=>Np,_isoDateTime:()=>Ip,_isoDuration:()=>zp,_isoTime:()=>Dp,_jwt:()=>Vc,_ksuid:()=>Lc,_lazy:()=>ww,_length:()=>mr,_literal:()=>fw,_lowercase:()=>Qr,_lt:()=>Kn,_lte:()=>Mn,_mac:()=>Cp,_map:()=>lw,_max:()=>Mn,_maxLength:()=>pr,_maxSize:()=>Pi,_mime:()=>rs,_min:()=>hn,_minLength:()=>di,_minSize:()=>ei,_multipleOf:()=>Ci,_nan:()=>im,_nanoid:()=>Pc,_nativeEnum:()=>dw,_negative:()=>Wc,_never:()=>Qp,_nonnegative:()=>Xc,_nonoptional:()=>_w,_nonpositive:()=>Zc,_normalize:()=>ss,_null:()=>Jp,_nullable:()=>gw,_number:()=>Lp,_optional:()=>mw,_overwrite:()=>kn,_parse:()=>Xr,_parseAsync:()=>qr,_pipe:()=>bw,_positive:()=>$c,_promise:()=>Ew,_property:()=>qc,_readonly:()=>Sw,_record:()=>cw,_refine:()=>am,_regex:()=>Kr,_safeDecode:()=>sc,_safeDecodeAsync:()=>ac,_safeEncode:()=>rc,_safeEncodeAsync:()=>oc,_safeParse:()=>Yr,_safeParseAsync:()=>Jr,_set:()=>uw,_size:()=>fr,_slugify:()=>ls,_startsWith:()=>ns,_string:()=>Ap,_stringFormat:()=>us,_stringbool:()=>hm,_success:()=>vw,_superRefine:()=>cm,_symbol:()=>qp,_templateLiteral:()=>Mw,_toLowerCase:()=>as,_toUpperCase:()=>cs,_transform:()=>pw,_trim:()=>os,_tuple:()=>aw,_uint32:()=>Hp,_uint64:()=>Xp,_ulid:()=>Dc,_undefined:()=>Yp,_union:()=>iw,_unknown:()=>Kp,_uppercase:()=>es,_url:()=>Ao,_uuid:()=>Ec,_uuidv4:()=>Tc,_uuidv6:()=>Ac,_uuidv7:()=>Rc,_void:()=>em,_xid:()=>zc,_xor:()=>rw,clone:()=>ln,config:()=>Ot,createStandardJSONSchemaMethod:()=>hs,createToJSONSchemaMethod:()=>dm,decode:()=>yM,decodeAsync:()=>SM,describe:()=>lm,encode:()=>vM,encodeAsync:()=>bM,extractDefs:()=>Ni,finalize:()=>Di,flattenError:()=>xo,formatError:()=>_o,globalConfig:()=>lr,globalRegistry:()=>Xt,initializeContext:()=>Ii,isValidBase64:()=>Uf,isValidBase64URL:()=>P_,isValidJWT:()=>I_,locales:()=>Eo,meta:()=>um,parse:()=>Ka,parseAsync:()=>Qa,prettifyError:()=>xd,process:()=>vt,regexes:()=>Sn,registry:()=>Mc,safeDecode:()=>wM,safeDecodeAsync:()=>TM,safeEncode:()=>MM,safeEncodeAsync:()=>EM,safeParse:()=>_d,safeParseAsync:()=>vd,toDotPath:()=>l_,toJSONSchema:()=>Kc,treeifyError:()=>gd,util:()=>Ye,version:()=>pf});var r_,nd=Object.freeze({status:"aborted"});function F(n,e,t){function i(a,c){if(a._zod||Object.defineProperty(a,"_zod",{value:{def:c,constr:o,traits:new Set},enumerable:!1}),a._zod.traits.has(n))return;a._zod.traits.add(n),e(a,c);let l=o.prototype,u=Object.keys(l);for(let d=0;d<u.length;d++){let h=u[d];h in a||(a[h]=l[h].bind(a))}}let r=t?.Parent??Object;class s extends r{}Object.defineProperty(s,"name",{value:n});function o(a){var c;let l=t?.Parent?new s:this;i(l,a),(c=l._zod).deferred??(c.deferred=[]);for(let u of l._zod.deferred)u();return l}return Object.defineProperty(o,"init",{value:i}),Object.defineProperty(o,Symbol.hasInstance,{value:a=>t?.Parent&&a instanceof t.Parent?!0:a?._zod?.traits?.has(n)}),Object.defineProperty(o,"name",{value:n}),o}var id=Symbol("zod_brand"),Fn=class extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}},wi=class extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`),this.name="ZodEncodeError"}};(r_=globalThis).__zod_globalConfig??(r_.__zod_globalConfig={});var lr=globalThis.__zod_globalConfig;function Ot(n){return n&&Object.assign(lr,n),lr}var Ye={};ui(Ye,{BIGINT_FORMAT_RANGES:()=>fd,Class:()=>sd,NUMBER_FORMAT_RANGES:()=>dd,aborted:()=>Ri,allowsEval:()=>cd,assert:()=>jS,assertEqual:()=>XS,assertIs:()=>YS,assertNever:()=>JS,assertNotEqual:()=>qS,assignProp:()=>Ti,base64ToUint8Array:()=>o_,base64urlToUint8Array:()=>pM,cached:()=>Wr,captureStackTrace:()=>Ja,cleanEnum:()=>fM,cleanRegex:()=>ho,clone:()=>ln,cloneDef:()=>QS,createTransparentProxy:()=>sM,defineLazy:()=>ot,esc:()=>Ya,escapeRegex:()=>Pn,explicitlyAborted:()=>pd,extend:()=>cM,finalizeIssue:()=>un,floatSafeRemainder:()=>od,getElementAtPath:()=>eM,getEnumValues:()=>uo,getLengthableOrigin:()=>mo,getParsedType:()=>rM,getSizableOrigin:()=>po,hexToUint8Array:()=>gM,isObject:()=>ur,isPlainObject:()=>Ai,issue:()=>Zr,joinValues:()=>qa,jsonStringifyReplacer:()=>$r,merge:()=>uM,mergeDefs:()=>hi,normalizeParams:()=>de,nullish:()=>Ei,numKeys:()=>iM,objectClone:()=>KS,omit:()=>aM,optionalKeys:()=>hd,parsedType:()=>md,partial:()=>hM,pick:()=>oM,prefixIssues:()=>gn,primitiveTypes:()=>ud,promiseAllObject:()=>tM,propertyKeyTypes:()=>fo,randomString:()=>nM,required:()=>dM,safeExtend:()=>lM,shallowClone:()=>ld,slugify:()=>ad,stringifyPrimitive:()=>ja,uint8ArrayToBase64:()=>a_,uint8ArrayToBase64url:()=>mM,uint8ArrayToHex:()=>xM,unwrapMessage:()=>lo});function XS(n){return n}function qS(n){return n}function YS(n){}function JS(n){throw new Error("Unexpected value in exhaustive check")}function jS(n){}function uo(n){let e=Object.values(n).filter(i=>typeof i=="number");return Object.entries(n).filter(([i,r])=>e.indexOf(+i)===-1).map(([i,r])=>r)}function qa(n,e="|"){return n.map(t=>ja(t)).join(e)}function $r(n,e){return typeof e=="bigint"?e.toString():e}function Wr(n){return{get value(){{let t=n();return Object.defineProperty(this,"value",{value:t}),t}throw new Error("cached value already set")}}}function Ei(n){return n==null}function ho(n){let e=n.startsWith("^")?1:0,t=n.endsWith("$")?n.length-1:n.length;return n.slice(e,t)}function od(n,e){let t=n/e,i=Math.round(t),r=Number.EPSILON*Math.max(Math.abs(t),1);return Math.abs(t-i)<r?0:t-i}var s_=Symbol("evaluating");function ot(n,e,t){let i;Object.defineProperty(n,e,{get(){if(i!==s_)return i===void 0&&(i=s_,i=t()),i},set(r){Object.defineProperty(n,e,{value:r})},configurable:!0})}function KS(n){return Object.create(Object.getPrototypeOf(n),Object.getOwnPropertyDescriptors(n))}function Ti(n,e,t){Object.defineProperty(n,e,{value:t,writable:!0,enumerable:!0,configurable:!0})}function hi(...n){let e={};for(let t of n){let i=Object.getOwnPropertyDescriptors(t);Object.assign(e,i)}return Object.defineProperties({},e)}function QS(n){return hi(n._zod.def)}function eM(n,e){return e?e.reduce((t,i)=>t?.[i],n):n}function tM(n){let e=Object.keys(n),t=e.map(i=>n[i]);return Promise.all(t).then(i=>{let r={};for(let s=0;s<e.length;s++)r[e[s]]=i[s];return r})}function nM(n=10){let e="abcdefghijklmnopqrstuvwxyz",t="";for(let i=0;i<n;i++)t+=e[Math.floor(Math.random()*e.length)];return t}function Ya(n){return JSON.stringify(n)}function ad(n){return n.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}var Ja="captureStackTrace"in Error?Error.captureStackTrace:(...n)=>{};function ur(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}var cd=Wr(()=>{if(lr.jitless||typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{let n=Function;return new n(""),!0}catch{return!1}});function Ai(n){if(ur(n)===!1)return!1;let e=n.constructor;if(e===void 0||typeof e!="function")return!0;let t=e.prototype;return!(ur(t)===!1||Object.prototype.hasOwnProperty.call(t,"isPrototypeOf")===!1)}function ld(n){return Ai(n)?{...n}:Array.isArray(n)?[...n]:n instanceof Map?new Map(n):n instanceof Set?new Set(n):n}function iM(n){let e=0;for(let t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}var rM=n=>{let e=typeof n;switch(e){case"undefined":return"undefined";case"string":return"string";case"number":return Number.isNaN(n)?"nan":"number";case"boolean":return"boolean";case"function":return"function";case"bigint":return"bigint";case"symbol":return"symbol";case"object":return Array.isArray(n)?"array":n===null?"null":n.then&&typeof n.then=="function"&&n.catch&&typeof n.catch=="function"?"promise":typeof Map<"u"&&n instanceof Map?"map":typeof Set<"u"&&n instanceof Set?"set":typeof Date<"u"&&n instanceof Date?"date":typeof File<"u"&&n instanceof File?"file":"object";default:throw new Error(`Unknown data type: ${e}`)}},fo=new Set(["string","number","symbol"]),ud=new Set(["string","number","bigint","boolean","symbol","undefined"]);function Pn(n){return n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function ln(n,e,t){let i=new n._zod.constr(e??n._zod.def);return(!e||t?.parent)&&(i._zod.parent=n),i}function de(n){let e=n;if(!e)return{};if(typeof e=="string")return{error:()=>e};if(e?.message!==void 0){if(e?.error!==void 0)throw new Error("Cannot specify both `message` and `error` params");e.error=e.message}return delete e.message,typeof e.error=="string"?{...e,error:()=>e.error}:e}function sM(n){let e;return new Proxy({},{get(t,i,r){return e??(e=n()),Reflect.get(e,i,r)},set(t,i,r,s){return e??(e=n()),Reflect.set(e,i,r,s)},has(t,i){return e??(e=n()),Reflect.has(e,i)},deleteProperty(t,i){return e??(e=n()),Reflect.deleteProperty(e,i)},ownKeys(t){return e??(e=n()),Reflect.ownKeys(e)},getOwnPropertyDescriptor(t,i){return e??(e=n()),Reflect.getOwnPropertyDescriptor(e,i)},defineProperty(t,i,r){return e??(e=n()),Reflect.defineProperty(e,i,r)}})}function ja(n){return typeof n=="bigint"?n.toString()+"n":typeof n=="string"?`"${n}"`:`${n}`}function hd(n){return Object.keys(n).filter(e=>n[e]._zod.optin==="optional"&&n[e]._zod.optout==="optional")}var dd={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]},fd={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function oM(n,e){let t=n._zod.def,i=t.checks;if(i&&i.length>0)throw new Error(".pick() cannot be used on object schemas containing refinements");let s=hi(n._zod.def,{get shape(){let o={};for(let a in e){if(!(a in t.shape))throw new Error(`Unrecognized key: "${a}"`);e[a]&&(o[a]=t.shape[a])}return Ti(this,"shape",o),o},checks:[]});return ln(n,s)}function aM(n,e){let t=n._zod.def,i=t.checks;if(i&&i.length>0)throw new Error(".omit() cannot be used on object schemas containing refinements");let s=hi(n._zod.def,{get shape(){let o={...n._zod.def.shape};for(let a in e){if(!(a in t.shape))throw new Error(`Unrecognized key: "${a}"`);e[a]&&delete o[a]}return Ti(this,"shape",o),o},checks:[]});return ln(n,s)}function cM(n,e){if(!Ai(e))throw new Error("Invalid input to extend: expected a plain object");let t=n._zod.def.checks;if(t&&t.length>0){let s=n._zod.def.shape;for(let o in e)if(Object.getOwnPropertyDescriptor(s,o)!==void 0)throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let r=hi(n._zod.def,{get shape(){let s={...n._zod.def.shape,...e};return Ti(this,"shape",s),s}});return ln(n,r)}function lM(n,e){if(!Ai(e))throw new Error("Invalid input to safeExtend: expected a plain object");let t=hi(n._zod.def,{get shape(){let i={...n._zod.def.shape,...e};return Ti(this,"shape",i),i}});return ln(n,t)}function uM(n,e){if(n._zod.def.checks?.length)throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let t=hi(n._zod.def,{get shape(){let i={...n._zod.def.shape,...e._zod.def.shape};return Ti(this,"shape",i),i},get catchall(){return e._zod.def.catchall},checks:e._zod.def.checks??[]});return ln(n,t)}function hM(n,e,t){let r=e._zod.def.checks;if(r&&r.length>0)throw new Error(".partial() cannot be used on object schemas containing refinements");let o=hi(e._zod.def,{get shape(){let a=e._zod.def.shape,c={...a};if(t)for(let l in t){if(!(l in a))throw new Error(`Unrecognized key: "${l}"`);t[l]&&(c[l]=n?new n({type:"optional",innerType:a[l]}):a[l])}else for(let l in a)c[l]=n?new n({type:"optional",innerType:a[l]}):a[l];return Ti(this,"shape",c),c},checks:[]});return ln(e,o)}function dM(n,e,t){let i=hi(e._zod.def,{get shape(){let r=e._zod.def.shape,s={...r};if(t)for(let o in t){if(!(o in s))throw new Error(`Unrecognized key: "${o}"`);t[o]&&(s[o]=new n({type:"nonoptional",innerType:r[o]}))}else for(let o in r)s[o]=new n({type:"nonoptional",innerType:r[o]});return Ti(this,"shape",s),s}});return ln(e,i)}function Ri(n,e=0){if(n.aborted===!0)return!0;for(let t=e;t<n.issues.length;t++)if(n.issues[t]?.continue!==!0)return!0;return!1}function pd(n,e=0){if(n.aborted===!0)return!0;for(let t=e;t<n.issues.length;t++)if(n.issues[t]?.continue===!1)return!0;return!1}function gn(n,e){return e.map(t=>{var i;return(i=t).path??(i.path=[]),t.path.unshift(n),t})}function lo(n){return typeof n=="string"?n:n?.message}function un(n,e,t){let i=n.message?n.message:lo(n.inst?._zod.def?.error?.(n))??lo(e?.error?.(n))??lo(t.customError?.(n))??lo(t.localeError?.(n))??"Invalid input",{inst:r,continue:s,input:o,...a}=n;return a.path??(a.path=[]),a.message=i,e?.reportInput&&(a.input=o),a}function po(n){return n instanceof Set?"set":n instanceof Map?"map":n instanceof File?"file":"unknown"}function mo(n){return Array.isArray(n)?"array":typeof n=="string"?"string":"unknown"}function md(n){let e=typeof n;switch(e){case"number":return Number.isNaN(n)?"nan":"number";case"object":{if(n===null)return"null";if(Array.isArray(n))return"array";let t=n;if(t&&Object.getPrototypeOf(t)!==Object.prototype&&"constructor"in t&&t.constructor)return t.constructor.name}}return e}function Zr(...n){let[e,t,i]=n;return typeof e=="string"?{message:e,code:"custom",input:t,inst:i}:{...e}}function fM(n){return Object.entries(n).filter(([e,t])=>Number.isNaN(Number.parseInt(e,10))).map(e=>e[1])}function o_(n){let e=atob(n),t=new Uint8Array(e.length);for(let i=0;i<e.length;i++)t[i]=e.charCodeAt(i);return t}function a_(n){let e="";for(let t=0;t<n.length;t++)e+=String.fromCharCode(n[t]);return btoa(e)}function pM(n){let e=n.replace(/-/g,"+").replace(/_/g,"/"),t="=".repeat((4-e.length%4)%4);return o_(e+t)}function mM(n){return a_(n).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}function gM(n){let e=n.replace(/^0x/,"");if(e.length%2!==0)throw new Error("Invalid hex string length");let t=new Uint8Array(e.length/2);for(let i=0;i<e.length;i+=2)t[i/2]=Number.parseInt(e.slice(i,i+2),16);return t}function xM(n){return Array.from(n).map(e=>e.toString(16).padStart(2,"0")).join("")}var sd=class{constructor(...e){}};var c_=(n,e)=>{n.name="$ZodError",Object.defineProperty(n,"_zod",{value:n._zod,enumerable:!1}),Object.defineProperty(n,"issues",{value:e,enumerable:!1}),n.message=JSON.stringify(e,$r,2),Object.defineProperty(n,"toString",{value:()=>n.message,enumerable:!1})},go=F("$ZodError",c_),xn=F("$ZodError",c_,{Parent:Error});function xo(n,e=t=>t.message){let t={},i=[];for(let r of n.issues)r.path.length>0?(t[r.path[0]]=t[r.path[0]]||[],t[r.path[0]].push(e(r))):i.push(e(r));return{formErrors:i,fieldErrors:t}}function _o(n,e=t=>t.message){let t={_errors:[]},i=(r,s=[])=>{for(let o of r.issues)if(o.code==="invalid_union"&&o.errors.length)o.errors.map(a=>i({issues:a},[...s,...o.path]));else if(o.code==="invalid_key")i({issues:o.issues},[...s,...o.path]);else if(o.code==="invalid_element")i({issues:o.issues},[...s,...o.path]);else{let a=[...s,...o.path];if(a.length===0)t._errors.push(e(o));else{let c=t,l=0;for(;l<a.length;){let u=a[l];l===a.length-1?(c[u]=c[u]||{_errors:[]},c[u]._errors.push(e(o))):c[u]=c[u]||{_errors:[]},c=c[u],l++}}}};return i(n),t}function gd(n,e=t=>t.message){let t={errors:[]},i=(r,s=[])=>{var o,a;for(let c of r.issues)if(c.code==="invalid_union"&&c.errors.length)c.errors.map(l=>i({issues:l},[...s,...c.path]));else if(c.code==="invalid_key")i({issues:c.issues},[...s,...c.path]);else if(c.code==="invalid_element")i({issues:c.issues},[...s,...c.path]);else{let l=[...s,...c.path];if(l.length===0){t.errors.push(e(c));continue}let u=t,d=0;for(;d<l.length;){let h=l[d],f=d===l.length-1;typeof h=="string"?(u.properties??(u.properties={}),(o=u.properties)[h]??(o[h]={errors:[]}),u=u.properties[h]):(u.items??(u.items=[]),(a=u.items)[h]??(a[h]={errors:[]}),u=u.items[h]),f&&u.errors.push(e(c)),d++}}};return i(n),t}function l_(n){let e=[],t=n.map(i=>typeof i=="object"?i.key:i);for(let i of t)typeof i=="number"?e.push(`[${i}]`):typeof i=="symbol"?e.push(`[${JSON.stringify(String(i))}]`):/[^\w$]/.test(i)?e.push(`[${JSON.stringify(i)}]`):(e.length&&e.push("."),e.push(i));return e.join("")}function xd(n){let e=[],t=[...n.issues].sort((i,r)=>(i.path??[]).length-(r.path??[]).length);for(let i of t)e.push(`\u2716 ${i.message}`),i.path?.length&&e.push(`  \u2192 at ${l_(i.path)}`);return e.join(`
`)}var Xr=n=>(e,t,i,r)=>{let s=i?{...i,async:!1}:{async:!1},o=e._zod.run({value:t,issues:[]},s);if(o instanceof Promise)throw new Fn;if(o.issues.length){let a=new(r?.Err??n)(o.issues.map(c=>un(c,s,Ot())));throw Ja(a,r?.callee),a}return o.value},Ka=Xr(xn),qr=n=>async(e,t,i,r)=>{let s=i?{...i,async:!0}:{async:!0},o=e._zod.run({value:t,issues:[]},s);if(o instanceof Promise&&(o=await o),o.issues.length){let a=new(r?.Err??n)(o.issues.map(c=>un(c,s,Ot())));throw Ja(a,r?.callee),a}return o.value},Qa=qr(xn),Yr=n=>(e,t,i)=>{let r=i?{...i,async:!1}:{async:!1},s=e._zod.run({value:t,issues:[]},r);if(s instanceof Promise)throw new Fn;return s.issues.length?{success:!1,error:new(n??go)(s.issues.map(o=>un(o,r,Ot())))}:{success:!0,data:s.value}},_d=Yr(xn),Jr=n=>async(e,t,i)=>{let r=i?{...i,async:!0}:{async:!0},s=e._zod.run({value:t,issues:[]},r);return s instanceof Promise&&(s=await s),s.issues.length?{success:!1,error:new n(s.issues.map(o=>un(o,r,Ot())))}:{success:!0,data:s.value}},vd=Jr(xn),ec=n=>(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Xr(n)(e,t,r)},vM=ec(xn),tc=n=>(e,t,i)=>Xr(n)(e,t,i),yM=tc(xn),nc=n=>async(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return qr(n)(e,t,r)},bM=nc(xn),ic=n=>async(e,t,i)=>qr(n)(e,t,i),SM=ic(xn),rc=n=>(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Yr(n)(e,t,r)},MM=rc(xn),sc=n=>(e,t,i)=>Yr(n)(e,t,i),wM=sc(xn),oc=n=>async(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return Jr(n)(e,t,r)},EM=oc(xn),ac=n=>async(e,t,i)=>Jr(n)(e,t,i),TM=ac(xn);var Sn={};ui(Sn,{base64:()=>Ld,base64url:()=>cc,bigint:()=>Gd,boolean:()=>$d,browserEmail:()=>zM,cidrv4:()=>Dd,cidrv6:()=>zd,cuid:()=>yd,cuid2:()=>bd,date:()=>Fd,datetime:()=>Bd,domain:()=>OM,duration:()=>Td,e164:()=>Od,email:()=>Rd,emoji:()=>Cd,extendedDuration:()=>AM,guid:()=>Ad,hex:()=>FM,hostname:()=>UM,html5Email:()=>IM,httpProtocol:()=>Ud,idnEmail:()=>DM,integer:()=>Vd,ipv4:()=>Pd,ipv6:()=>Id,ksuid:()=>wd,lowercase:()=>Xd,mac:()=>Nd,md5_base64:()=>BM,md5_base64url:()=>HM,md5_hex:()=>kM,nanoid:()=>Ed,null:()=>Wd,number:()=>lc,rfc5322Email:()=>NM,sha1_base64:()=>VM,sha1_base64url:()=>$M,sha1_hex:()=>GM,sha256_base64:()=>ZM,sha256_base64url:()=>XM,sha256_hex:()=>WM,sha384_base64:()=>YM,sha384_base64url:()=>JM,sha384_hex:()=>qM,sha512_base64:()=>KM,sha512_base64url:()=>QM,sha512_hex:()=>jM,string:()=>Hd,time:()=>kd,ulid:()=>Sd,undefined:()=>Zd,unicodeEmail:()=>u_,uppercase:()=>qd,uuid:()=>hr,uuid4:()=>RM,uuid6:()=>CM,uuid7:()=>PM,xid:()=>Md});var yd=/^[cC][0-9a-z]{6,}$/,bd=/^[0-9a-z]+$/,Sd=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,Md=/^[0-9a-vA-V]{20}$/,wd=/^[A-Za-z0-9]{27}$/,Ed=/^[a-zA-Z0-9_-]{21}$/,Td=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,AM=/^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,Ad=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,hr=n=>n?new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${n}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,RM=hr(4),CM=hr(6),PM=hr(7),Rd=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,IM=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,NM=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,u_=/^[^\s@"]{1,64}@[^\s@]{1,255}$/u,DM=u_,zM=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,LM="^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";function Cd(){return new RegExp(LM,"u")}var Pd=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,Id=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,Nd=n=>{let e=Pn(n??":");return new RegExp(`^(?:[0-9A-F]{2}${e}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${e}){5}[0-9a-f]{2}$`)},Dd=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,zd=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,Ld=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,cc=/^[A-Za-z0-9_-]*$/,UM=/^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,OM=/^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,Ud=/^https?$/,Od=/^\+[1-9]\d{6,14}$/,h_="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",Fd=new RegExp(`^${h_}$`);function d_(n){let e="(?:[01]\\d|2[0-3]):[0-5]\\d";return typeof n.precision=="number"?n.precision===-1?`${e}`:n.precision===0?`${e}:[0-5]\\d`:`${e}:[0-5]\\d\\.\\d{${n.precision}}`:`${e}(?::[0-5]\\d(?:\\.\\d+)?)?`}function kd(n){return new RegExp(`^${d_(n)}$`)}function Bd(n){let e=d_({precision:n.precision}),t=["Z"];n.local&&t.push(""),n.offset&&t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let i=`${e}(?:${t.join("|")})`;return new RegExp(`^${h_}T(?:${i})$`)}var Hd=n=>{let e=n?`[\\s\\S]{${n?.minimum??0},${n?.maximum??""}}`:"[\\s\\S]*";return new RegExp(`^${e}$`)},Gd=/^-?\d+n?$/,Vd=/^-?\d+$/,lc=/^-?\d+(?:\.\d+)?$/,$d=/^(?:true|false)$/i,Wd=/^null$/i;var Zd=/^undefined$/i;var Xd=/^[^A-Z]*$/,qd=/^[^a-z]*$/,FM=/^[0-9a-fA-F]*$/;function vo(n,e){return new RegExp(`^[A-Za-z0-9+/]{${n}}${e}$`)}function yo(n){return new RegExp(`^[A-Za-z0-9_-]{${n}}$`)}var kM=/^[0-9a-fA-F]{32}$/,BM=vo(22,"=="),HM=yo(22),GM=/^[0-9a-fA-F]{40}$/,VM=vo(27,"="),$M=yo(27),WM=/^[0-9a-fA-F]{64}$/,ZM=vo(43,"="),XM=yo(43),qM=/^[0-9a-fA-F]{96}$/,YM=vo(64,""),JM=yo(64),jM=/^[0-9a-fA-F]{128}$/,KM=vo(86,"=="),QM=yo(86);var At=F("$ZodCheck",(n,e)=>{var t;n._zod??(n._zod={}),n._zod.def=e,(t=n._zod).onattach??(t.onattach=[])}),p_={number:"number",bigint:"bigint",object:"date"},uc=F("$ZodCheckLessThan",(n,e)=>{At.init(n,e);let t=p_[typeof e.value];n._zod.onattach.push(i=>{let r=i._zod.bag,s=(e.inclusive?r.maximum:r.exclusiveMaximum)??Number.POSITIVE_INFINITY;e.value<s&&(e.inclusive?r.maximum=e.value:r.exclusiveMaximum=e.value)}),n._zod.check=i=>{(e.inclusive?i.value<=e.value:i.value<e.value)||i.issues.push({origin:t,code:"too_big",maximum:typeof e.value=="object"?e.value.getTime():e.value,input:i.value,inclusive:e.inclusive,inst:n,continue:!e.abort})}}),hc=F("$ZodCheckGreaterThan",(n,e)=>{At.init(n,e);let t=p_[typeof e.value];n._zod.onattach.push(i=>{let r=i._zod.bag,s=(e.inclusive?r.minimum:r.exclusiveMinimum)??Number.NEGATIVE_INFINITY;e.value>s&&(e.inclusive?r.minimum=e.value:r.exclusiveMinimum=e.value)}),n._zod.check=i=>{(e.inclusive?i.value>=e.value:i.value>e.value)||i.issues.push({origin:t,code:"too_small",minimum:typeof e.value=="object"?e.value.getTime():e.value,input:i.value,inclusive:e.inclusive,inst:n,continue:!e.abort})}}),Yd=F("$ZodCheckMultipleOf",(n,e)=>{At.init(n,e),n._zod.onattach.push(t=>{var i;(i=t._zod.bag).multipleOf??(i.multipleOf=e.value)}),n._zod.check=t=>{if(typeof t.value!=typeof e.value)throw new Error("Cannot mix number and bigint in multiple_of check.");(typeof t.value=="bigint"?t.value%e.value===BigInt(0):od(t.value,e.value)===0)||t.issues.push({origin:typeof t.value,code:"not_multiple_of",divisor:e.value,input:t.value,inst:n,continue:!e.abort})}}),Jd=F("$ZodCheckNumberFormat",(n,e)=>{At.init(n,e),e.format=e.format||"float64";let t=e.format?.includes("int"),i=t?"int":"number",[r,s]=dd[e.format];n._zod.onattach.push(o=>{let a=o._zod.bag;a.format=e.format,a.minimum=r,a.maximum=s,t&&(a.pattern=Vd)}),n._zod.check=o=>{let a=o.value;if(t){if(!Number.isInteger(a)){o.issues.push({expected:i,format:e.format,code:"invalid_type",continue:!1,input:a,inst:n});return}if(!Number.isSafeInteger(a)){a>0?o.issues.push({input:a,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:n,origin:i,inclusive:!0,continue:!e.abort}):o.issues.push({input:a,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:n,origin:i,inclusive:!0,continue:!e.abort});return}}a<r&&o.issues.push({origin:"number",input:a,code:"too_small",minimum:r,inclusive:!0,inst:n,continue:!e.abort}),a>s&&o.issues.push({origin:"number",input:a,code:"too_big",maximum:s,inclusive:!0,inst:n,continue:!e.abort})}}),jd=F("$ZodCheckBigIntFormat",(n,e)=>{At.init(n,e);let[t,i]=fd[e.format];n._zod.onattach.push(r=>{let s=r._zod.bag;s.format=e.format,s.minimum=t,s.maximum=i}),n._zod.check=r=>{let s=r.value;s<t&&r.issues.push({origin:"bigint",input:s,code:"too_small",minimum:t,inclusive:!0,inst:n,continue:!e.abort}),s>i&&r.issues.push({origin:"bigint",input:s,code:"too_big",maximum:i,inclusive:!0,inst:n,continue:!e.abort})}}),Kd=F("$ZodCheckMaxSize",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.maximum??Number.POSITIVE_INFINITY;e.maximum<r&&(i._zod.bag.maximum=e.maximum)}),n._zod.check=i=>{let r=i.value;r.size<=e.maximum||i.issues.push({origin:po(r),code:"too_big",maximum:e.maximum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),Qd=F("$ZodCheckMinSize",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.minimum??Number.NEGATIVE_INFINITY;e.minimum>r&&(i._zod.bag.minimum=e.minimum)}),n._zod.check=i=>{let r=i.value;r.size>=e.minimum||i.issues.push({origin:po(r),code:"too_small",minimum:e.minimum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),ef=F("$ZodCheckSizeEquals",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag;r.minimum=e.size,r.maximum=e.size,r.size=e.size}),n._zod.check=i=>{let r=i.value,s=r.size;if(s===e.size)return;let o=s>e.size;i.issues.push({origin:po(r),...o?{code:"too_big",maximum:e.size}:{code:"too_small",minimum:e.size},inclusive:!0,exact:!0,input:i.value,inst:n,continue:!e.abort})}}),tf=F("$ZodCheckMaxLength",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.maximum??Number.POSITIVE_INFINITY;e.maximum<r&&(i._zod.bag.maximum=e.maximum)}),n._zod.check=i=>{let r=i.value;if(r.length<=e.maximum)return;let o=mo(r);i.issues.push({origin:o,code:"too_big",maximum:e.maximum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),nf=F("$ZodCheckMinLength",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.minimum??Number.NEGATIVE_INFINITY;e.minimum>r&&(i._zod.bag.minimum=e.minimum)}),n._zod.check=i=>{let r=i.value;if(r.length>=e.minimum)return;let o=mo(r);i.issues.push({origin:o,code:"too_small",minimum:e.minimum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),rf=F("$ZodCheckLengthEquals",(n,e)=>{var t;At.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Ei(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag;r.minimum=e.length,r.maximum=e.length,r.length=e.length}),n._zod.check=i=>{let r=i.value,s=r.length;if(s===e.length)return;let o=mo(r),a=s>e.length;i.issues.push({origin:o,...a?{code:"too_big",maximum:e.length}:{code:"too_small",minimum:e.length},inclusive:!0,exact:!0,input:i.value,inst:n,continue:!e.abort})}}),jr=F("$ZodCheckStringFormat",(n,e)=>{var t,i;At.init(n,e),n._zod.onattach.push(r=>{let s=r._zod.bag;s.format=e.format,e.pattern&&(s.patterns??(s.patterns=new Set),s.patterns.add(e.pattern))}),e.pattern?(t=n._zod).check??(t.check=r=>{e.pattern.lastIndex=0,!e.pattern.test(r.value)&&r.issues.push({origin:"string",code:"invalid_format",format:e.format,input:r.value,...e.pattern?{pattern:e.pattern.toString()}:{},inst:n,continue:!e.abort})}):(i=n._zod).check??(i.check=()=>{})}),sf=F("$ZodCheckRegex",(n,e)=>{jr.init(n,e),n._zod.check=t=>{e.pattern.lastIndex=0,!e.pattern.test(t.value)&&t.issues.push({origin:"string",code:"invalid_format",format:"regex",input:t.value,pattern:e.pattern.toString(),inst:n,continue:!e.abort})}}),of=F("$ZodCheckLowerCase",(n,e)=>{e.pattern??(e.pattern=Xd),jr.init(n,e)}),af=F("$ZodCheckUpperCase",(n,e)=>{e.pattern??(e.pattern=qd),jr.init(n,e)}),cf=F("$ZodCheckIncludes",(n,e)=>{At.init(n,e);let t=Pn(e.includes),i=new RegExp(typeof e.position=="number"?`^.{${e.position}}${t}`:t);e.pattern=i,n._zod.onattach.push(r=>{let s=r._zod.bag;s.patterns??(s.patterns=new Set),s.patterns.add(i)}),n._zod.check=r=>{r.value.includes(e.includes,e.position)||r.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:e.includes,input:r.value,inst:n,continue:!e.abort})}}),lf=F("$ZodCheckStartsWith",(n,e)=>{At.init(n,e);let t=new RegExp(`^${Pn(e.prefix)}.*`);e.pattern??(e.pattern=t),n._zod.onattach.push(i=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(t)}),n._zod.check=i=>{i.value.startsWith(e.prefix)||i.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:e.prefix,input:i.value,inst:n,continue:!e.abort})}}),uf=F("$ZodCheckEndsWith",(n,e)=>{At.init(n,e);let t=new RegExp(`.*${Pn(e.suffix)}$`);e.pattern??(e.pattern=t),n._zod.onattach.push(i=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(t)}),n._zod.check=i=>{i.value.endsWith(e.suffix)||i.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:e.suffix,input:i.value,inst:n,continue:!e.abort})}});function f_(n,e,t){n.issues.length&&e.issues.push(...gn(t,n.issues))}var hf=F("$ZodCheckProperty",(n,e)=>{At.init(n,e),n._zod.check=t=>{let i=e.schema._zod.run({value:t.value[e.property],issues:[]},{});if(i instanceof Promise)return i.then(r=>f_(r,t,e.property));f_(i,t,e.property)}}),df=F("$ZodCheckMimeType",(n,e)=>{At.init(n,e);let t=new Set(e.mime);n._zod.onattach.push(i=>{i._zod.bag.mime=e.mime}),n._zod.check=i=>{t.has(i.value.type)||i.issues.push({code:"invalid_value",values:e.mime,input:i.value.type,inst:n,continue:!e.abort})}}),ff=F("$ZodCheckOverwrite",(n,e)=>{At.init(n,e),n._zod.check=t=>{t.value=e.tx(t.value)}});var bo=class{constructor(e=[]){this.content=[],this.indent=0,this&&(this.args=e)}indented(e){this.indent+=1,e(this),this.indent-=1}write(e){if(typeof e=="function"){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let i=e.split(`
`).filter(o=>o),r=Math.min(...i.map(o=>o.length-o.trimStart().length)),s=i.map(o=>o.slice(r)).map(o=>" ".repeat(this.indent*2)+o);for(let o of s)this.content.push(o)}compile(){let e=Function,t=this?.args,r=[...(this?.content??[""]).map(s=>`  ${s}`)];return new e(...t,r.join(`
`))}};var pf={major:4,minor:4,patch:3};var Ke=F("$ZodType",(n,e)=>{var t;n??(n={}),n._zod.def=e,n._zod.bag=n._zod.bag||{},n._zod.version=pf;let i=[...n._zod.def.checks??[]];n._zod.traits.has("$ZodCheck")&&i.unshift(n);for(let r of i)for(let s of r._zod.onattach)s(n);if(i.length===0)(t=n._zod).deferred??(t.deferred=[]),n._zod.deferred?.push(()=>{n._zod.run=n._zod.parse});else{let r=(o,a,c)=>{let l=Ri(o),u;for(let d of a){if(d._zod.def.when){if(pd(o)||!d._zod.def.when(o))continue}else if(l)continue;let h=o.issues.length,f=d._zod.check(o);if(f instanceof Promise&&c?.async===!1)throw new Fn;if(u||f instanceof Promise)u=(u??Promise.resolve()).then(async()=>{await f,o.issues.length!==h&&(l||(l=Ri(o,h)))});else{if(o.issues.length===h)continue;l||(l=Ri(o,h))}}return u?u.then(()=>o):o},s=(o,a,c)=>{if(Ri(o))return o.aborted=!0,o;let l=r(a,i,c);if(l instanceof Promise){if(c.async===!1)throw new Fn;return l.then(u=>n._zod.parse(u,c))}return n._zod.parse(l,c)};n._zod.run=(o,a)=>{if(a.skipChecks)return n._zod.parse(o,a);if(a.direction==="backward"){let l=n._zod.parse({value:o.value,issues:[]},{...a,skipChecks:!0});return l instanceof Promise?l.then(u=>s(u,o,a)):s(l,o,a)}let c=n._zod.parse(o,a);if(c instanceof Promise){if(a.async===!1)throw new Fn;return c.then(l=>r(l,i,a))}return r(c,i,a)}}ot(n,"~standard",()=>({validate:r=>{try{let s=_d(n,r);return s.success?{value:s.data}:{issues:s.error?.issues}}catch{return vd(n,r).then(o=>o.success?{value:o.data}:{issues:o.error?.issues})}},vendor:"zod",version:1}))}),dr=F("$ZodString",(n,e)=>{Ke.init(n,e),n._zod.pattern=[...n?._zod.bag?.patterns??[]].pop()??Hd(n._zod.bag),n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=String(t.value)}catch{}return typeof t.value=="string"||t.issues.push({expected:"string",code:"invalid_type",input:t.value,inst:n}),t}}),wt=F("$ZodStringFormat",(n,e)=>{jr.init(n,e),dr.init(n,e)}),gf=F("$ZodGUID",(n,e)=>{e.pattern??(e.pattern=Ad),wt.init(n,e)}),xf=F("$ZodUUID",(n,e)=>{if(e.version){let i={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[e.version];if(i===void 0)throw new Error(`Invalid UUID version: "${e.version}"`);e.pattern??(e.pattern=hr(i))}else e.pattern??(e.pattern=hr());wt.init(n,e)}),_f=F("$ZodEmail",(n,e)=>{e.pattern??(e.pattern=Rd),wt.init(n,e)}),vf=F("$ZodURL",(n,e)=>{wt.init(n,e),n._zod.check=t=>{try{let i=t.value.trim();if(!e.normalize&&e.protocol?.source===Ud.source&&!/^https?:\/\//i.test(i)){t.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:t.value,inst:n,continue:!e.abort});return}let r=new URL(i);e.hostname&&(e.hostname.lastIndex=0,e.hostname.test(r.hostname)||t.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:e.hostname.source,input:t.value,inst:n,continue:!e.abort})),e.protocol&&(e.protocol.lastIndex=0,e.protocol.test(r.protocol.endsWith(":")?r.protocol.slice(0,-1):r.protocol)||t.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:e.protocol.source,input:t.value,inst:n,continue:!e.abort})),e.normalize?t.value=r.href:t.value=i;return}catch{t.issues.push({code:"invalid_format",format:"url",input:t.value,inst:n,continue:!e.abort})}}}),yf=F("$ZodEmoji",(n,e)=>{e.pattern??(e.pattern=Cd()),wt.init(n,e)}),bf=F("$ZodNanoID",(n,e)=>{e.pattern??(e.pattern=Ed),wt.init(n,e)}),Sf=F("$ZodCUID",(n,e)=>{e.pattern??(e.pattern=yd),wt.init(n,e)}),Mf=F("$ZodCUID2",(n,e)=>{e.pattern??(e.pattern=bd),wt.init(n,e)}),wf=F("$ZodULID",(n,e)=>{e.pattern??(e.pattern=Sd),wt.init(n,e)}),Ef=F("$ZodXID",(n,e)=>{e.pattern??(e.pattern=Md),wt.init(n,e)}),Tf=F("$ZodKSUID",(n,e)=>{e.pattern??(e.pattern=wd),wt.init(n,e)}),Af=F("$ZodISODateTime",(n,e)=>{e.pattern??(e.pattern=Bd(e)),wt.init(n,e)}),Rf=F("$ZodISODate",(n,e)=>{e.pattern??(e.pattern=Fd),wt.init(n,e)}),Cf=F("$ZodISOTime",(n,e)=>{e.pattern??(e.pattern=kd(e)),wt.init(n,e)}),Pf=F("$ZodISODuration",(n,e)=>{e.pattern??(e.pattern=Td),wt.init(n,e)}),If=F("$ZodIPv4",(n,e)=>{e.pattern??(e.pattern=Pd),wt.init(n,e),n._zod.bag.format="ipv4"}),Nf=F("$ZodIPv6",(n,e)=>{e.pattern??(e.pattern=Id),wt.init(n,e),n._zod.bag.format="ipv6",n._zod.check=t=>{try{new URL(`http://[${t.value}]`)}catch{t.issues.push({code:"invalid_format",format:"ipv6",input:t.value,inst:n,continue:!e.abort})}}}),Df=F("$ZodMAC",(n,e)=>{e.pattern??(e.pattern=Nd(e.delimiter)),wt.init(n,e),n._zod.bag.format="mac"}),zf=F("$ZodCIDRv4",(n,e)=>{e.pattern??(e.pattern=Dd),wt.init(n,e)}),Lf=F("$ZodCIDRv6",(n,e)=>{e.pattern??(e.pattern=zd),wt.init(n,e),n._zod.check=t=>{let i=t.value.split("/");try{if(i.length!==2)throw new Error;let[r,s]=i;if(!s)throw new Error;let o=Number(s);if(`${o}`!==s)throw new Error;if(o<0||o>128)throw new Error;new URL(`http://[${r}]`)}catch{t.issues.push({code:"invalid_format",format:"cidrv6",input:t.value,inst:n,continue:!e.abort})}}});function Uf(n){if(n==="")return!0;if(/\s/.test(n)||n.length%4!==0)return!1;try{return atob(n),!0}catch{return!1}}var Of=F("$ZodBase64",(n,e)=>{e.pattern??(e.pattern=Ld),wt.init(n,e),n._zod.bag.contentEncoding="base64",n._zod.check=t=>{Uf(t.value)||t.issues.push({code:"invalid_format",format:"base64",input:t.value,inst:n,continue:!e.abort})}});function P_(n){if(!cc.test(n))return!1;let e=n.replace(/[-_]/g,i=>i==="-"?"+":"/"),t=e.padEnd(Math.ceil(e.length/4)*4,"=");return Uf(t)}var Ff=F("$ZodBase64URL",(n,e)=>{e.pattern??(e.pattern=cc),wt.init(n,e),n._zod.bag.contentEncoding="base64url",n._zod.check=t=>{P_(t.value)||t.issues.push({code:"invalid_format",format:"base64url",input:t.value,inst:n,continue:!e.abort})}}),kf=F("$ZodE164",(n,e)=>{e.pattern??(e.pattern=Od),wt.init(n,e)});function I_(n,e=null){try{let t=n.split(".");if(t.length!==3)return!1;let[i]=t;if(!i)return!1;let r=JSON.parse(atob(i));return!("typ"in r&&r?.typ!=="JWT"||!r.alg||e&&(!("alg"in r)||r.alg!==e))}catch{return!1}}var Bf=F("$ZodJWT",(n,e)=>{wt.init(n,e),n._zod.check=t=>{I_(t.value,e.alg)||t.issues.push({code:"invalid_format",format:"jwt",input:t.value,inst:n,continue:!e.abort})}}),Hf=F("$ZodCustomStringFormat",(n,e)=>{wt.init(n,e),n._zod.check=t=>{e.fn(t.value)||t.issues.push({code:"invalid_format",format:e.format,input:t.value,inst:n,continue:!e.abort})}}),gc=F("$ZodNumber",(n,e)=>{Ke.init(n,e),n._zod.pattern=n._zod.bag.pattern??lc,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=Number(t.value)}catch{}let r=t.value;if(typeof r=="number"&&!Number.isNaN(r)&&Number.isFinite(r))return t;let s=typeof r=="number"?Number.isNaN(r)?"NaN":Number.isFinite(r)?void 0:"Infinity":void 0;return t.issues.push({expected:"number",code:"invalid_type",input:r,inst:n,...s?{received:s}:{}}),t}}),Gf=F("$ZodNumberFormat",(n,e)=>{Jd.init(n,e),gc.init(n,e)}),So=F("$ZodBoolean",(n,e)=>{Ke.init(n,e),n._zod.pattern=$d,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=!!t.value}catch{}let r=t.value;return typeof r=="boolean"||t.issues.push({expected:"boolean",code:"invalid_type",input:r,inst:n}),t}}),xc=F("$ZodBigInt",(n,e)=>{Ke.init(n,e),n._zod.pattern=Gd,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=BigInt(t.value)}catch{}return typeof t.value=="bigint"||t.issues.push({expected:"bigint",code:"invalid_type",input:t.value,inst:n}),t}}),Vf=F("$ZodBigIntFormat",(n,e)=>{jd.init(n,e),xc.init(n,e)}),$f=F("$ZodSymbol",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return typeof r=="symbol"||t.issues.push({expected:"symbol",code:"invalid_type",input:r,inst:n}),t}}),Wf=F("$ZodUndefined",(n,e)=>{Ke.init(n,e),n._zod.pattern=Zd,n._zod.values=new Set([void 0]),n._zod.parse=(t,i)=>{let r=t.value;return typeof r>"u"||t.issues.push({expected:"undefined",code:"invalid_type",input:r,inst:n}),t}}),Zf=F("$ZodNull",(n,e)=>{Ke.init(n,e),n._zod.pattern=Wd,n._zod.values=new Set([null]),n._zod.parse=(t,i)=>{let r=t.value;return r===null||t.issues.push({expected:"null",code:"invalid_type",input:r,inst:n}),t}}),Xf=F("$ZodAny",(n,e)=>{Ke.init(n,e),n._zod.parse=t=>t}),qf=F("$ZodUnknown",(n,e)=>{Ke.init(n,e),n._zod.parse=t=>t}),Yf=F("$ZodNever",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>(t.issues.push({expected:"never",code:"invalid_type",input:t.value,inst:n}),t)}),Jf=F("$ZodVoid",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return typeof r>"u"||t.issues.push({expected:"void",code:"invalid_type",input:r,inst:n}),t}}),jf=F("$ZodDate",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=new Date(t.value)}catch{}let r=t.value,s=r instanceof Date;return s&&!Number.isNaN(r.getTime())||t.issues.push({expected:"date",code:"invalid_type",input:r,...s?{received:"Invalid Date"}:{},inst:n}),t}});function g_(n,e,t){n.issues.length&&e.issues.push(...gn(t,n.issues)),e.value[t]=n.value}var Kf=F("$ZodArray",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!Array.isArray(r))return t.issues.push({expected:"array",code:"invalid_type",input:r,inst:n}),t;t.value=Array(r.length);let s=[];for(let o=0;o<r.length;o++){let a=r[o],c=e.element._zod.run({value:a,issues:[]},i);c instanceof Promise?s.push(c.then(l=>g_(l,t,o))):g_(c,t,o)}return s.length?Promise.all(s).then(()=>t):t}});function mc(n,e,t,i,r,s){let o=t in i;if(n.issues.length){if(r&&s&&!o)return;e.issues.push(...gn(t,n.issues))}if(!o&&!r){n.issues.length||e.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[t]});return}n.value===void 0?o&&(e.value[t]=void 0):e.value[t]=n.value}function N_(n){let e=Object.keys(n.shape);for(let i of e)if(!n.shape?.[i]?._zod?.traits?.has("$ZodType"))throw new Error(`Invalid element at key "${i}": expected a Zod schema`);let t=hd(n.shape);return{...n,keys:e,keySet:new Set(e),numKeys:e.length,optionalKeys:new Set(t)}}function D_(n,e,t,i,r,s){let o=[],a=r.keySet,c=r.catchall._zod,l=c.def.type,u=c.optin==="optional",d=c.optout==="optional";for(let h in e){if(h==="__proto__"||a.has(h))continue;if(l==="never"){o.push(h);continue}let f=c.run({value:e[h],issues:[]},i);f instanceof Promise?n.push(f.then(p=>mc(p,t,h,e,u,d))):mc(f,t,h,e,u,d)}return o.length&&t.issues.push({code:"unrecognized_keys",keys:o,input:e,inst:s}),n.length?Promise.all(n).then(()=>t):t}var z_=F("$ZodObject",(n,e)=>{if(Ke.init(n,e),!Object.getOwnPropertyDescriptor(e,"shape")?.get){let a=e.shape;Object.defineProperty(e,"shape",{get:()=>{let c={...a};return Object.defineProperty(e,"shape",{value:c}),c}})}let i=Wr(()=>N_(e));ot(n._zod,"propValues",()=>{let a=e.shape,c={};for(let l in a){let u=a[l]._zod;if(u.values){c[l]??(c[l]=new Set);for(let d of u.values)c[l].add(d)}}return c});let r=ur,s=e.catchall,o;n._zod.parse=(a,c)=>{o??(o=i.value);let l=a.value;if(!r(l))return a.issues.push({expected:"object",code:"invalid_type",input:l,inst:n}),a;a.value={};let u=[],d=o.shape;for(let h of o.keys){let f=d[h],p=f._zod.optin==="optional",y=f._zod.optout==="optional",g=f._zod.run({value:l[h],issues:[]},c);g instanceof Promise?u.push(g.then(m=>mc(m,a,h,l,p,y))):mc(g,a,h,l,p,y)}return s?D_(u,l,a,c,i.value,n):u.length?Promise.all(u).then(()=>a):a}}),Qf=F("$ZodObjectJIT",(n,e)=>{z_.init(n,e);let t=n._zod.parse,i=Wr(()=>N_(e)),r=h=>{let f=new bo(["shape","payload","ctx"]),p=i.value,y=E=>{let v=Ya(E);return`shape[${v}]._zod.run({ value: input[${v}], issues: [] }, ctx)`};f.write("const input = payload.value;");let g=Object.create(null),m=0;for(let E of p.keys)g[E]=`key_${m++}`;f.write("const newResult = {};");for(let E of p.keys){let v=g[E],M=Ya(E),w=h[E],C=w?._zod?.optin==="optional",_=w?._zod?.optout==="optional";f.write(`const ${v} = ${y(E)};`),C&&_?f.write(`
        if (${v}.issues.length) {
          if (${M} in input) {
            payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${M}, ...iss.path] : [${M}]
            })));
          }
        }
        
        if (${v}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${v}.value;
        }
        
      `):C?f.write(`
        if (${v}.issues.length) {
          payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        
        if (${v}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${v}.value;
        }
        
      `):f.write(`
        const ${v}_present = ${M} in input;
        if (${v}.issues.length) {
          payload.issues = payload.issues.concat(${v}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        if (!${v}_present && !${v}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${M}]
          });
        }

        if (${v}_present) {
          if (${v}.value === undefined) {
            newResult[${M}] = undefined;
          } else {
            newResult[${M}] = ${v}.value;
          }
        }

      `)}f.write("payload.value = newResult;"),f.write("return payload;");let S=f.compile();return(E,v)=>S(h,E,v)},s,o=ur,a=!lr.jitless,l=a&&cd.value,u=e.catchall,d;n._zod.parse=(h,f)=>{d??(d=i.value);let p=h.value;return o(p)?a&&l&&f?.async===!1&&f.jitless!==!0?(s||(s=r(e.shape)),h=s(h,f),u?D_([],p,h,f,d,n):h):t(h,f):(h.issues.push({expected:"object",code:"invalid_type",input:p,inst:n}),h)}});function x_(n,e,t,i){for(let s of n)if(s.issues.length===0)return e.value=s.value,e;let r=n.filter(s=>!Ri(s));return r.length===1?(e.value=r[0].value,r[0]):(e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:n.map(s=>s.issues.map(o=>un(o,i,Ot())))}),e)}var Mo=F("$ZodUnion",(n,e)=>{Ke.init(n,e),ot(n._zod,"optin",()=>e.options.some(i=>i._zod.optin==="optional")?"optional":void 0),ot(n._zod,"optout",()=>e.options.some(i=>i._zod.optout==="optional")?"optional":void 0),ot(n._zod,"values",()=>{if(e.options.every(i=>i._zod.values))return new Set(e.options.flatMap(i=>Array.from(i._zod.values)))}),ot(n._zod,"pattern",()=>{if(e.options.every(i=>i._zod.pattern)){let i=e.options.map(r=>r._zod.pattern);return new RegExp(`^(${i.map(r=>ho(r.source)).join("|")})$`)}});let t=e.options.length===1?e.options[0]._zod.run:null;n._zod.parse=(i,r)=>{if(t)return t(i,r);let s=!1,o=[];for(let a of e.options){let c=a._zod.run({value:i.value,issues:[]},r);if(c instanceof Promise)o.push(c),s=!0;else{if(c.issues.length===0)return c;o.push(c)}}return s?Promise.all(o).then(a=>x_(a,i,n,r)):x_(o,i,n,r)}});function __(n,e,t,i){let r=n.filter(s=>s.issues.length===0);return r.length===1?(e.value=r[0].value,e):(r.length===0?e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:n.map(s=>s.issues.map(o=>un(o,i,Ot())))}):e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:[],inclusive:!1}),e)}var ep=F("$ZodXor",(n,e)=>{Mo.init(n,e),e.inclusive=!1;let t=e.options.length===1?e.options[0]._zod.run:null;n._zod.parse=(i,r)=>{if(t)return t(i,r);let s=!1,o=[];for(let a of e.options){let c=a._zod.run({value:i.value,issues:[]},r);c instanceof Promise?(o.push(c),s=!0):o.push(c)}return s?Promise.all(o).then(a=>__(a,i,n,r)):__(o,i,n,r)}}),tp=F("$ZodDiscriminatedUnion",(n,e)=>{e.inclusive=!1,Mo.init(n,e);let t=n._zod.parse;ot(n._zod,"propValues",()=>{let r={};for(let s of e.options){let o=s._zod.propValues;if(!o||Object.keys(o).length===0)throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(s)}"`);for(let[a,c]of Object.entries(o)){r[a]||(r[a]=new Set);for(let l of c)r[a].add(l)}}return r});let i=Wr(()=>{let r=e.options,s=new Map;for(let o of r){let a=o._zod.propValues?.[e.discriminator];if(!a||a.size===0)throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(o)}"`);for(let c of a){if(s.has(c))throw new Error(`Duplicate discriminator value "${String(c)}"`);s.set(c,o)}}return s});n._zod.parse=(r,s)=>{let o=r.value;if(!ur(o))return r.issues.push({code:"invalid_type",expected:"object",input:o,inst:n}),r;let a=i.value.get(o?.[e.discriminator]);return a?a._zod.run(r,s):e.unionFallback||s.direction==="backward"?t(r,s):(r.issues.push({code:"invalid_union",errors:[],note:"No matching discriminator",discriminator:e.discriminator,options:Array.from(i.value.keys()),input:o,path:[e.discriminator],inst:n}),r)}}),np=F("$ZodIntersection",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value,s=e.left._zod.run({value:r,issues:[]},i),o=e.right._zod.run({value:r,issues:[]},i);return s instanceof Promise||o instanceof Promise?Promise.all([s,o]).then(([c,l])=>v_(t,c,l)):v_(t,s,o)}});function mf(n,e){if(n===e)return{valid:!0,data:n};if(n instanceof Date&&e instanceof Date&&+n==+e)return{valid:!0,data:n};if(Ai(n)&&Ai(e)){let t=Object.keys(e),i=Object.keys(n).filter(s=>t.indexOf(s)!==-1),r={...n,...e};for(let s of i){let o=mf(n[s],e[s]);if(!o.valid)return{valid:!1,mergeErrorPath:[s,...o.mergeErrorPath]};r[s]=o.data}return{valid:!0,data:r}}if(Array.isArray(n)&&Array.isArray(e)){if(n.length!==e.length)return{valid:!1,mergeErrorPath:[]};let t=[];for(let i=0;i<n.length;i++){let r=n[i],s=e[i],o=mf(r,s);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};t.push(o.data)}return{valid:!0,data:t}}return{valid:!1,mergeErrorPath:[]}}function v_(n,e,t){let i=new Map,r;for(let a of e.issues)if(a.code==="unrecognized_keys"){r??(r=a);for(let c of a.keys)i.has(c)||i.set(c,{}),i.get(c).l=!0}else n.issues.push(a);for(let a of t.issues)if(a.code==="unrecognized_keys")for(let c of a.keys)i.has(c)||i.set(c,{}),i.get(c).r=!0;else n.issues.push(a);let s=[...i].filter(([,a])=>a.l&&a.r).map(([a])=>a);if(s.length&&r&&n.issues.push({...r,keys:s}),Ri(n))return n;let o=mf(e.value,t.value);if(!o.valid)throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);return n.value=o.data,n}var _c=F("$ZodTuple",(n,e)=>{Ke.init(n,e);let t=e.items;n._zod.parse=(i,r)=>{let s=i.value;if(!Array.isArray(s))return i.issues.push({input:s,inst:n,expected:"tuple",code:"invalid_type"}),i;i.value=[];let o=[],a=y_(t,"optin"),c=y_(t,"optout");if(!e.rest){if(s.length<a)return i.issues.push({code:"too_small",minimum:a,inclusive:!0,input:s,inst:n,origin:"array"}),i;s.length>t.length&&i.issues.push({code:"too_big",maximum:t.length,inclusive:!0,input:s,inst:n,origin:"array"})}let l=new Array(t.length);for(let u=0;u<t.length;u++){let d=t[u]._zod.run({value:s[u],issues:[]},r);d instanceof Promise?o.push(d.then(h=>{l[u]=h})):l[u]=d}if(e.rest){let u=t.length-1,d=s.slice(t.length);for(let h of d){u++;let f=e.rest._zod.run({value:h,issues:[]},r);f instanceof Promise?o.push(f.then(p=>b_(p,i,u))):b_(f,i,u)}}return o.length?Promise.all(o).then(()=>S_(l,i,t,s,c)):S_(l,i,t,s,c)}});function y_(n,e){for(let t=n.length-1;t>=0;t--)if(n[t]._zod[e]!=="optional")return t+1;return 0}function b_(n,e,t){n.issues.length&&e.issues.push(...gn(t,n.issues)),e.value[t]=n.value}function S_(n,e,t,i,r){for(let s=0;s<t.length;s++){let o=n[s],a=s<i.length;if(o.issues.length){if(!a&&s>=r){e.value.length=s;break}e.issues.push(...gn(s,o.issues))}e.value[s]=o.value}for(let s=e.value.length-1;s>=i.length&&(t[s]._zod.optout==="optional"&&e.value[s]===void 0);s--)e.value.length=s;return e}var ip=F("$ZodRecord",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!Ai(r))return t.issues.push({expected:"record",code:"invalid_type",input:r,inst:n}),t;let s=[],o=e.keyType._zod.values;if(o){t.value={};let a=new Set;for(let l of o)if(typeof l=="string"||typeof l=="number"||typeof l=="symbol"){a.add(typeof l=="number"?l.toString():l);let u=e.keyType._zod.run({value:l,issues:[]},i);if(u instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(u.issues.length){t.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map(f=>un(f,i,Ot())),input:l,path:[l],inst:n});continue}let d=u.value,h=e.valueType._zod.run({value:r[l],issues:[]},i);h instanceof Promise?s.push(h.then(f=>{f.issues.length&&t.issues.push(...gn(l,f.issues)),t.value[d]=f.value})):(h.issues.length&&t.issues.push(...gn(l,h.issues)),t.value[d]=h.value)}let c;for(let l in r)a.has(l)||(c=c??[],c.push(l));c&&c.length>0&&t.issues.push({code:"unrecognized_keys",input:r,inst:n,keys:c})}else{t.value={};for(let a of Reflect.ownKeys(r)){if(a==="__proto__"||!Object.prototype.propertyIsEnumerable.call(r,a))continue;let c=e.keyType._zod.run({value:a,issues:[]},i);if(c instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(typeof a=="string"&&lc.test(a)&&c.issues.length){let d=e.keyType._zod.run({value:Number(a),issues:[]},i);if(d instanceof Promise)throw new Error("Async schemas not supported in object keys currently");d.issues.length===0&&(c=d)}if(c.issues.length){e.mode==="loose"?t.value[a]=r[a]:t.issues.push({code:"invalid_key",origin:"record",issues:c.issues.map(d=>un(d,i,Ot())),input:a,path:[a],inst:n});continue}let u=e.valueType._zod.run({value:r[a],issues:[]},i);u instanceof Promise?s.push(u.then(d=>{d.issues.length&&t.issues.push(...gn(a,d.issues)),t.value[c.value]=d.value})):(u.issues.length&&t.issues.push(...gn(a,u.issues)),t.value[c.value]=u.value)}}return s.length?Promise.all(s).then(()=>t):t}}),rp=F("$ZodMap",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!(r instanceof Map))return t.issues.push({expected:"map",code:"invalid_type",input:r,inst:n}),t;let s=[];t.value=new Map;for(let[o,a]of r){let c=e.keyType._zod.run({value:o,issues:[]},i),l=e.valueType._zod.run({value:a,issues:[]},i);c instanceof Promise||l instanceof Promise?s.push(Promise.all([c,l]).then(([u,d])=>{M_(u,d,t,o,r,n,i)})):M_(c,l,t,o,r,n,i)}return s.length?Promise.all(s).then(()=>t):t}});function M_(n,e,t,i,r,s,o){n.issues.length&&(fo.has(typeof i)?t.issues.push(...gn(i,n.issues)):t.issues.push({code:"invalid_key",origin:"map",input:r,inst:s,issues:n.issues.map(a=>un(a,o,Ot()))})),e.issues.length&&(fo.has(typeof i)?t.issues.push(...gn(i,e.issues)):t.issues.push({origin:"map",code:"invalid_element",input:r,inst:s,key:i,issues:e.issues.map(a=>un(a,o,Ot()))})),t.value.set(n.value,e.value)}var sp=F("$ZodSet",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!(r instanceof Set))return t.issues.push({input:r,inst:n,expected:"set",code:"invalid_type"}),t;let s=[];t.value=new Set;for(let o of r){let a=e.valueType._zod.run({value:o,issues:[]},i);a instanceof Promise?s.push(a.then(c=>w_(c,t))):w_(a,t)}return s.length?Promise.all(s).then(()=>t):t}});function w_(n,e){n.issues.length&&e.issues.push(...n.issues),e.value.add(n.value)}var op=F("$ZodEnum",(n,e)=>{Ke.init(n,e);let t=uo(e.entries),i=new Set(t);n._zod.values=i,n._zod.pattern=new RegExp(`^(${t.filter(r=>fo.has(typeof r)).map(r=>typeof r=="string"?Pn(r):r.toString()).join("|")})$`),n._zod.parse=(r,s)=>{let o=r.value;return i.has(o)||r.issues.push({code:"invalid_value",values:t,input:o,inst:n}),r}}),ap=F("$ZodLiteral",(n,e)=>{if(Ke.init(n,e),e.values.length===0)throw new Error("Cannot create literal schema with no valid values");let t=new Set(e.values);n._zod.values=t,n._zod.pattern=new RegExp(`^(${e.values.map(i=>typeof i=="string"?Pn(i):i?Pn(i.toString()):String(i)).join("|")})$`),n._zod.parse=(i,r)=>{let s=i.value;return t.has(s)||i.issues.push({code:"invalid_value",values:e.values,input:s,inst:n}),i}}),cp=F("$ZodFile",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return r instanceof File||t.issues.push({expected:"file",code:"invalid_type",input:r,inst:n}),t}}),lp=F("$ZodTransform",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new wi(n.constructor.name);let r=e.transform(t.value,t);if(i.async)return(r instanceof Promise?r:Promise.resolve(r)).then(o=>(t.value=o,t.fallback=!0,t));if(r instanceof Promise)throw new Fn;return t.value=r,t.fallback=!0,t}});function E_(n,e){return e===void 0&&(n.issues.length||n.fallback)?{issues:[],value:void 0}:n}var vc=F("$ZodOptional",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",n._zod.optout="optional",ot(n._zod,"values",()=>e.innerType._zod.values?new Set([...e.innerType._zod.values,void 0]):void 0),ot(n._zod,"pattern",()=>{let t=e.innerType._zod.pattern;return t?new RegExp(`^(${ho(t.source)})?$`):void 0}),n._zod.parse=(t,i)=>{if(e.innerType._zod.optin==="optional"){let r=t.value,s=e.innerType._zod.run(t,i);return s instanceof Promise?s.then(o=>E_(o,r)):E_(s,r)}return t.value===void 0?t:e.innerType._zod.run(t,i)}}),up=F("$ZodExactOptional",(n,e)=>{vc.init(n,e),ot(n._zod,"values",()=>e.innerType._zod.values),ot(n._zod,"pattern",()=>e.innerType._zod.pattern),n._zod.parse=(t,i)=>e.innerType._zod.run(t,i)}),hp=F("$ZodNullable",(n,e)=>{Ke.init(n,e),ot(n._zod,"optin",()=>e.innerType._zod.optin),ot(n._zod,"optout",()=>e.innerType._zod.optout),ot(n._zod,"pattern",()=>{let t=e.innerType._zod.pattern;return t?new RegExp(`^(${ho(t.source)}|null)$`):void 0}),ot(n._zod,"values",()=>e.innerType._zod.values?new Set([...e.innerType._zod.values,null]):void 0),n._zod.parse=(t,i)=>t.value===null?t:e.innerType._zod.run(t,i)}),dp=F("$ZodDefault",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);if(t.value===void 0)return t.value=e.defaultValue,t;let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>T_(s,e)):T_(r,e)}});function T_(n,e){return n.value===void 0&&(n.value=e.defaultValue),n}var fp=F("$ZodPrefault",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>(i.direction==="backward"||t.value===void 0&&(t.value=e.defaultValue),e.innerType._zod.run(t,i))}),pp=F("$ZodNonOptional",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>{let t=e.innerType._zod.values;return t?new Set([...t].filter(i=>i!==void 0)):void 0}),n._zod.parse=(t,i)=>{let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>A_(s,n)):A_(r,n)}});function A_(n,e){return!n.issues.length&&n.value===void 0&&n.issues.push({code:"invalid_type",expected:"nonoptional",input:n.value,inst:e}),n}var mp=F("$ZodSuccess",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new wi("ZodSuccess");let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>(t.value=s.issues.length===0,t)):(t.value=r.issues.length===0,t)}}),gp=F("$ZodCatch",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"optout",()=>e.innerType._zod.optout),ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>(t.value=s.value,s.issues.length&&(t.value=e.catchValue({...t,error:{issues:s.issues.map(o=>un(o,i,Ot()))},input:t.value}),t.issues=[],t.fallback=!0),t)):(t.value=r.value,r.issues.length&&(t.value=e.catchValue({...t,error:{issues:r.issues.map(s=>un(s,i,Ot()))},input:t.value}),t.issues=[],t.fallback=!0),t)}}),xp=F("$ZodNaN",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>((typeof t.value!="number"||!Number.isNaN(t.value))&&t.issues.push({input:t.value,inst:n,expected:"nan",code:"invalid_type"}),t)}),yc=F("$ZodPipe",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>e.in._zod.values),ot(n._zod,"optin",()=>e.in._zod.optin),ot(n._zod,"optout",()=>e.out._zod.optout),ot(n._zod,"propValues",()=>e.in._zod.propValues),n._zod.parse=(t,i)=>{if(i.direction==="backward"){let s=e.out._zod.run(t,i);return s instanceof Promise?s.then(o=>dc(o,e.in,i)):dc(s,e.in,i)}let r=e.in._zod.run(t,i);return r instanceof Promise?r.then(s=>dc(s,e.out,i)):dc(r,e.out,i)}});function dc(n,e,t){return n.issues.length?(n.aborted=!0,n):e._zod.run({value:n.value,issues:n.issues,fallback:n.fallback},t)}var wo=F("$ZodCodec",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>e.in._zod.values),ot(n._zod,"optin",()=>e.in._zod.optin),ot(n._zod,"optout",()=>e.out._zod.optout),ot(n._zod,"propValues",()=>e.in._zod.propValues),n._zod.parse=(t,i)=>{if((i.direction||"forward")==="forward"){let s=e.in._zod.run(t,i);return s instanceof Promise?s.then(o=>fc(o,e,i)):fc(s,e,i)}else{let s=e.out._zod.run(t,i);return s instanceof Promise?s.then(o=>fc(o,e,i)):fc(s,e,i)}}});function fc(n,e,t){if(n.issues.length)return n.aborted=!0,n;if((t.direction||"forward")==="forward"){let r=e.transform(n.value,n);return r instanceof Promise?r.then(s=>pc(n,s,e.out,t)):pc(n,r,e.out,t)}else{let r=e.reverseTransform(n.value,n);return r instanceof Promise?r.then(s=>pc(n,s,e.in,t)):pc(n,r,e.in,t)}}function pc(n,e,t,i){return n.issues.length?(n.aborted=!0,n):t._zod.run({value:e,issues:n.issues},i)}var _p=F("$ZodPreprocess",(n,e)=>{yc.init(n,e)}),vp=F("$ZodReadonly",(n,e)=>{Ke.init(n,e),ot(n._zod,"propValues",()=>e.innerType._zod.propValues),ot(n._zod,"values",()=>e.innerType._zod.values),ot(n._zod,"optin",()=>e.innerType?._zod?.optin),ot(n._zod,"optout",()=>e.innerType?._zod?.optout),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(R_):R_(r)}});function R_(n){return n.value=Object.freeze(n.value),n}var yp=F("$ZodTemplateLiteral",(n,e)=>{Ke.init(n,e);let t=[];for(let i of e.parts)if(typeof i=="object"&&i!==null){if(!i._zod.pattern)throw new Error(`Invalid template literal part, no pattern found: ${[...i._zod.traits].shift()}`);let r=i._zod.pattern instanceof RegExp?i._zod.pattern.source:i._zod.pattern;if(!r)throw new Error(`Invalid template literal part: ${i._zod.traits}`);let s=r.startsWith("^")?1:0,o=r.endsWith("$")?r.length-1:r.length;t.push(r.slice(s,o))}else if(i===null||ud.has(typeof i))t.push(Pn(`${i}`));else throw new Error(`Invalid template literal part: ${i}`);n._zod.pattern=new RegExp(`^${t.join("")}$`),n._zod.parse=(i,r)=>typeof i.value!="string"?(i.issues.push({input:i.value,inst:n,expected:"string",code:"invalid_type"}),i):(n._zod.pattern.lastIndex=0,n._zod.pattern.test(i.value)||i.issues.push({input:i.value,inst:n,code:"invalid_format",format:e.format??"template_literal",pattern:n._zod.pattern.source}),i)}),bp=F("$ZodFunction",(n,e)=>(Ke.init(n,e),n._def=e,n._zod.def=e,n.implement=t=>{if(typeof t!="function")throw new Error("implement() must be called with a function");return function(...i){let r=n._def.input?Ka(n._def.input,i):i,s=Reflect.apply(t,this,r);return n._def.output?Ka(n._def.output,s):s}},n.implementAsync=t=>{if(typeof t!="function")throw new Error("implementAsync() must be called with a function");return async function(...i){let r=n._def.input?await Qa(n._def.input,i):i,s=await Reflect.apply(t,this,r);return n._def.output?await Qa(n._def.output,s):s}},n._zod.parse=(t,i)=>typeof t.value!="function"?(t.issues.push({code:"invalid_type",expected:"function",input:t.value,inst:n}),t):(n._def.output&&n._def.output._zod.def.type==="promise"?t.value=n.implementAsync(t.value):t.value=n.implement(t.value),t),n.input=(...t)=>{let i=n.constructor;return Array.isArray(t[0])?new i({type:"function",input:new _c({type:"tuple",items:t[0],rest:t[1]}),output:n._def.output}):new i({type:"function",input:t[0],output:n._def.output})},n.output=t=>{let i=n.constructor;return new i({type:"function",input:n._def.input,output:t})},n)),Sp=F("$ZodPromise",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>Promise.resolve(t.value).then(r=>e.innerType._zod.run({value:r,issues:[]},i))}),Mp=F("$ZodLazy",(n,e)=>{Ke.init(n,e),ot(n._zod,"innerType",()=>{let t=e;return t._cachedInner||(t._cachedInner=e.getter()),t._cachedInner}),ot(n._zod,"pattern",()=>n._zod.innerType?._zod?.pattern),ot(n._zod,"propValues",()=>n._zod.innerType?._zod?.propValues),ot(n._zod,"optin",()=>n._zod.innerType?._zod?.optin??void 0),ot(n._zod,"optout",()=>n._zod.innerType?._zod?.optout??void 0),n._zod.parse=(t,i)=>n._zod.innerType._zod.run(t,i)}),wp=F("$ZodCustom",(n,e)=>{At.init(n,e),Ke.init(n,e),n._zod.parse=(t,i)=>t,n._zod.check=t=>{let i=t.value,r=e.fn(i);if(r instanceof Promise)return r.then(s=>C_(s,t,i,n));C_(r,t,i,n)}});function C_(n,e,t,i){if(!n){let r={code:"custom",input:t,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};i._zod.def.params&&(r.params=i._zod.def.params),e.issues.push(Zr(r))}}var Eo={};ui(Eo,{en:()=>bc});var tw=()=>{let n={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function e(r){return n[r]??null}let t={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",jwt:"JWT",template_literal:"input"},i={nan:"NaN"};return r=>{switch(r.code){case"invalid_type":{let s=i[r.expected]??r.expected,o=md(r.input),a=i[o]??o;return`Invalid input: expected ${s}, received ${a}`}case"invalid_value":return r.values.length===1?`Invalid input: expected ${ja(r.values[0])}`:`Invalid option: expected one of ${qa(r.values,"|")}`;case"too_big":{let s=r.inclusive?"<=":"<",o=e(r.origin);return o?`Too big: expected ${r.origin??"value"} to have ${s}${r.maximum.toString()} ${o.unit??"elements"}`:`Too big: expected ${r.origin??"value"} to be ${s}${r.maximum.toString()}`}case"too_small":{let s=r.inclusive?">=":">",o=e(r.origin);return o?`Too small: expected ${r.origin} to have ${s}${r.minimum.toString()} ${o.unit}`:`Too small: expected ${r.origin} to be ${s}${r.minimum.toString()}`}case"invalid_format":{let s=r;return s.format==="starts_with"?`Invalid string: must start with "${s.prefix}"`:s.format==="ends_with"?`Invalid string: must end with "${s.suffix}"`:s.format==="includes"?`Invalid string: must include "${s.includes}"`:s.format==="regex"?`Invalid string: must match pattern ${s.pattern}`:`Invalid ${t[s.format]??r.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${r.divisor}`;case"unrecognized_keys":return`Unrecognized key${r.keys.length>1?"s":""}: ${qa(r.keys,", ")}`;case"invalid_key":return`Invalid key in ${r.origin}`;case"invalid_union":return r.options&&Array.isArray(r.options)&&r.options.length>0?`Invalid discriminator value. Expected ${r.options.map(o=>`'${o}'`).join(" | ")}`:"Invalid input";case"invalid_element":return`Invalid value in ${r.origin}`;default:return"Invalid input"}}};function bc(){return{localeError:tw()}}var L_,Ep=Symbol("ZodOutput"),Tp=Symbol("ZodInput"),Sc=class{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let i=t[0];return this._map.set(e,i),i&&typeof i=="object"&&"id"in i&&this._idmap.set(i.id,e),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);return t&&typeof t=="object"&&"id"in t&&this._idmap.delete(t.id),this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let i={...this.get(t)??{}};delete i.id;let r={...i,...this._map.get(e)};return Object.keys(r).length?r:void 0}return this._map.get(e)}has(e){return this._map.has(e)}};function Mc(){return new Sc}(L_=globalThis).__zod_globalRegistry??(L_.__zod_globalRegistry=Mc());var Xt=globalThis.__zod_globalRegistry;function Ap(n,e){return new n({type:"string",...de(e)})}function Rp(n,e){return new n({type:"string",coerce:!0,...de(e)})}function wc(n,e){return new n({type:"string",format:"email",check:"string_format",abort:!1,...de(e)})}function To(n,e){return new n({type:"string",format:"guid",check:"string_format",abort:!1,...de(e)})}function Ec(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,...de(e)})}function Tc(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...de(e)})}function Ac(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...de(e)})}function Rc(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...de(e)})}function Ao(n,e){return new n({type:"string",format:"url",check:"string_format",abort:!1,...de(e)})}function Cc(n,e){return new n({type:"string",format:"emoji",check:"string_format",abort:!1,...de(e)})}function Pc(n,e){return new n({type:"string",format:"nanoid",check:"string_format",abort:!1,...de(e)})}function Ic(n,e){return new n({type:"string",format:"cuid",check:"string_format",abort:!1,...de(e)})}function Nc(n,e){return new n({type:"string",format:"cuid2",check:"string_format",abort:!1,...de(e)})}function Dc(n,e){return new n({type:"string",format:"ulid",check:"string_format",abort:!1,...de(e)})}function zc(n,e){return new n({type:"string",format:"xid",check:"string_format",abort:!1,...de(e)})}function Lc(n,e){return new n({type:"string",format:"ksuid",check:"string_format",abort:!1,...de(e)})}function Uc(n,e){return new n({type:"string",format:"ipv4",check:"string_format",abort:!1,...de(e)})}function Oc(n,e){return new n({type:"string",format:"ipv6",check:"string_format",abort:!1,...de(e)})}function Cp(n,e){return new n({type:"string",format:"mac",check:"string_format",abort:!1,...de(e)})}function Fc(n,e){return new n({type:"string",format:"cidrv4",check:"string_format",abort:!1,...de(e)})}function kc(n,e){return new n({type:"string",format:"cidrv6",check:"string_format",abort:!1,...de(e)})}function Bc(n,e){return new n({type:"string",format:"base64",check:"string_format",abort:!1,...de(e)})}function Hc(n,e){return new n({type:"string",format:"base64url",check:"string_format",abort:!1,...de(e)})}function Gc(n,e){return new n({type:"string",format:"e164",check:"string_format",abort:!1,...de(e)})}function Vc(n,e){return new n({type:"string",format:"jwt",check:"string_format",abort:!1,...de(e)})}var Pp={Any:null,Minute:-1,Second:0,Millisecond:3,Microsecond:6};function Ip(n,e){return new n({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...de(e)})}function Np(n,e){return new n({type:"string",format:"date",check:"string_format",...de(e)})}function Dp(n,e){return new n({type:"string",format:"time",check:"string_format",precision:null,...de(e)})}function zp(n,e){return new n({type:"string",format:"duration",check:"string_format",...de(e)})}function Lp(n,e){return new n({type:"number",checks:[],...de(e)})}function Up(n,e){return new n({type:"number",coerce:!0,checks:[],...de(e)})}function Op(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"safeint",...de(e)})}function Fp(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"float32",...de(e)})}function kp(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"float64",...de(e)})}function Bp(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"int32",...de(e)})}function Hp(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"uint32",...de(e)})}function Gp(n,e){return new n({type:"boolean",...de(e)})}function Vp(n,e){return new n({type:"boolean",coerce:!0,...de(e)})}function $p(n,e){return new n({type:"bigint",...de(e)})}function Wp(n,e){return new n({type:"bigint",coerce:!0,...de(e)})}function Zp(n,e){return new n({type:"bigint",check:"bigint_format",abort:!1,format:"int64",...de(e)})}function Xp(n,e){return new n({type:"bigint",check:"bigint_format",abort:!1,format:"uint64",...de(e)})}function qp(n,e){return new n({type:"symbol",...de(e)})}function Yp(n,e){return new n({type:"undefined",...de(e)})}function Jp(n,e){return new n({type:"null",...de(e)})}function jp(n){return new n({type:"any"})}function Kp(n){return new n({type:"unknown"})}function Qp(n,e){return new n({type:"never",...de(e)})}function em(n,e){return new n({type:"void",...de(e)})}function tm(n,e){return new n({type:"date",...de(e)})}function nm(n,e){return new n({type:"date",coerce:!0,...de(e)})}function im(n,e){return new n({type:"nan",...de(e)})}function Kn(n,e){return new uc({check:"less_than",...de(e),value:n,inclusive:!1})}function Mn(n,e){return new uc({check:"less_than",...de(e),value:n,inclusive:!0})}function Qn(n,e){return new hc({check:"greater_than",...de(e),value:n,inclusive:!1})}function hn(n,e){return new hc({check:"greater_than",...de(e),value:n,inclusive:!0})}function $c(n){return Qn(0,n)}function Wc(n){return Kn(0,n)}function Zc(n){return Mn(0,n)}function Xc(n){return hn(0,n)}function Ci(n,e){return new Yd({check:"multiple_of",...de(e),value:n})}function Pi(n,e){return new Kd({check:"max_size",...de(e),maximum:n})}function ei(n,e){return new Qd({check:"min_size",...de(e),minimum:n})}function fr(n,e){return new ef({check:"size_equals",...de(e),size:n})}function pr(n,e){return new tf({check:"max_length",...de(e),maximum:n})}function di(n,e){return new nf({check:"min_length",...de(e),minimum:n})}function mr(n,e){return new rf({check:"length_equals",...de(e),length:n})}function Kr(n,e){return new sf({check:"string_format",format:"regex",...de(e),pattern:n})}function Qr(n){return new of({check:"string_format",format:"lowercase",...de(n)})}function es(n){return new af({check:"string_format",format:"uppercase",...de(n)})}function ts(n,e){return new cf({check:"string_format",format:"includes",...de(e),includes:n})}function ns(n,e){return new lf({check:"string_format",format:"starts_with",...de(e),prefix:n})}function is(n,e){return new uf({check:"string_format",format:"ends_with",...de(e),suffix:n})}function qc(n,e,t){return new hf({check:"property",property:n,schema:e,...de(t)})}function rs(n,e){return new df({check:"mime_type",mime:n,...de(e)})}function kn(n){return new ff({check:"overwrite",tx:n})}function ss(n){return kn(e=>e.normalize(n))}function os(){return kn(n=>n.trim())}function as(){return kn(n=>n.toLowerCase())}function cs(){return kn(n=>n.toUpperCase())}function ls(){return kn(n=>ad(n))}function rm(n,e,t){return new n({type:"array",element:e,...de(t)})}function iw(n,e,t){return new n({type:"union",options:e,...de(t)})}function rw(n,e,t){return new n({type:"union",options:e,inclusive:!1,...de(t)})}function sw(n,e,t,i){return new n({type:"union",options:t,discriminator:e,...de(i)})}function ow(n,e,t){return new n({type:"intersection",left:e,right:t})}function aw(n,e,t,i){let r=t instanceof Ke,s=r?i:t,o=r?t:null;return new n({type:"tuple",items:e,rest:o,...de(s)})}function cw(n,e,t,i){return new n({type:"record",keyType:e,valueType:t,...de(i)})}function lw(n,e,t,i){return new n({type:"map",keyType:e,valueType:t,...de(i)})}function uw(n,e,t){return new n({type:"set",valueType:e,...de(t)})}function hw(n,e,t){let i=Array.isArray(e)?Object.fromEntries(e.map(r=>[r,r])):e;return new n({type:"enum",entries:i,...de(t)})}function dw(n,e,t){return new n({type:"enum",entries:e,...de(t)})}function fw(n,e,t){return new n({type:"literal",values:Array.isArray(e)?e:[e],...de(t)})}function sm(n,e){return new n({type:"file",...de(e)})}function pw(n,e){return new n({type:"transform",transform:e})}function mw(n,e){return new n({type:"optional",innerType:e})}function gw(n,e){return new n({type:"nullable",innerType:e})}function xw(n,e,t){return new n({type:"default",innerType:e,get defaultValue(){return typeof t=="function"?t():ld(t)}})}function _w(n,e,t){return new n({type:"nonoptional",innerType:e,...de(t)})}function vw(n,e){return new n({type:"success",innerType:e})}function yw(n,e,t){return new n({type:"catch",innerType:e,catchValue:typeof t=="function"?t:()=>t})}function bw(n,e,t){return new n({type:"pipe",in:e,out:t})}function Sw(n,e){return new n({type:"readonly",innerType:e})}function Mw(n,e,t){return new n({type:"template_literal",parts:e,...de(t)})}function ww(n,e){return new n({type:"lazy",getter:e})}function Ew(n,e){return new n({type:"promise",innerType:e})}function om(n,e,t){let i=de(t);return i.abort??(i.abort=!0),new n({type:"custom",check:"custom",fn:e,...i})}function am(n,e,t){return new n({type:"custom",check:"custom",fn:e,...de(t)})}function cm(n,e){let t=U_(i=>(i.addIssue=r=>{if(typeof r=="string")i.issues.push(Zr(r,i.value,t._zod.def));else{let s=r;s.fatal&&(s.continue=!1),s.code??(s.code="custom"),s.input??(s.input=i.value),s.inst??(s.inst=t),s.continue??(s.continue=!t._zod.def.abort),i.issues.push(Zr(s))}},n(i.value,i)),e);return t}function U_(n,e){let t=new At({check:"custom",...de(e)});return t._zod.check=n,t}function lm(n){let e=new At({check:"describe"});return e._zod.onattach=[t=>{let i=Xt.get(t)??{};Xt.add(t,{...i,description:n})}],e._zod.check=()=>{},e}function um(n){let e=new At({check:"meta"});return e._zod.onattach=[t=>{let i=Xt.get(t)??{};Xt.add(t,{...i,...n})}],e._zod.check=()=>{},e}function hm(n,e){let t=de(e),i=t.truthy??["true","1","yes","on","y","enabled"],r=t.falsy??["false","0","no","off","n","disabled"];t.case!=="sensitive"&&(i=i.map(f=>typeof f=="string"?f.toLowerCase():f),r=r.map(f=>typeof f=="string"?f.toLowerCase():f));let s=new Set(i),o=new Set(r),a=n.Codec??wo,c=n.Boolean??So,l=n.String??dr,u=new l({type:"string",error:t.error}),d=new c({type:"boolean",error:t.error}),h=new a({type:"pipe",in:u,out:d,transform:((f,p)=>{let y=f;return t.case!=="sensitive"&&(y=y.toLowerCase()),s.has(y)?!0:o.has(y)?!1:(p.issues.push({code:"invalid_value",expected:"stringbool",values:[...s,...o],input:p.value,inst:h,continue:!1}),{})}),reverseTransform:((f,p)=>f===!0?i[0]||"true":r[0]||"false"),error:t.error});return h}function us(n,e,t,i={}){let r=de(i),s={...de(i),check:"string_format",type:"string",format:e,fn:typeof t=="function"?t:a=>t.test(a),...r};return t instanceof RegExp&&(s.pattern=t),new n(s)}function Ii(n){let e=n?.target??"draft-2020-12";return e==="draft-4"&&(e="draft-04"),e==="draft-7"&&(e="draft-07"),{processors:n.processors??{},metadataRegistry:n?.metadata??Xt,target:e,unrepresentable:n?.unrepresentable??"throw",override:n?.override??(()=>{}),io:n?.io??"output",counter:0,seen:new Map,cycles:n?.cycles??"ref",reused:n?.reused??"inline",external:n?.external??void 0}}function vt(n,e,t={path:[],schemaPath:[]}){var i;let r=n._zod.def,s=e.seen.get(n);if(s)return s.count++,t.schemaPath.includes(n)&&(s.cycle=t.path),s.schema;let o={schema:{},count:1,cycle:void 0,path:t.path};e.seen.set(n,o);let a=n._zod.toJSONSchema?.();if(a)o.schema=a;else{let u={...t,schemaPath:[...t.schemaPath,n],path:t.path};if(n._zod.processJSONSchema)n._zod.processJSONSchema(e,o.schema,u);else{let h=o.schema,f=e.processors[r.type];if(!f)throw new Error(`[toJSONSchema]: Non-representable type encountered: ${r.type}`);f(n,e,h,u)}let d=n._zod.parent;d&&(o.ref||(o.ref=d),vt(d,e,u),e.seen.get(d).isParent=!0)}let c=e.metadataRegistry.get(n);return c&&Object.assign(o.schema,c),e.io==="input"&&dn(n)&&(delete o.schema.examples,delete o.schema.default),e.io==="input"&&"_prefault"in o.schema&&((i=o.schema).default??(i.default=o.schema._prefault)),delete o.schema._prefault,e.seen.get(n).schema}function Ni(n,e){let t=n.seen.get(e);if(!t)throw new Error("Unprocessed schema. This is a bug in Zod.");let i=new Map;for(let o of n.seen.entries()){let a=n.metadataRegistry.get(o[0])?.id;if(a){let c=i.get(a);if(c&&c!==o[0])throw new Error(`Duplicate schema id "${a}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(a,o[0])}}let r=o=>{let a=n.target==="draft-2020-12"?"$defs":"definitions";if(n.external){let d=n.external.registry.get(o[0])?.id,h=n.external.uri??(p=>p);if(d)return{ref:h(d)};let f=o[1].defId??o[1].schema.id??`schema${n.counter++}`;return o[1].defId=f,{defId:f,ref:`${h("__shared")}#/${a}/${f}`}}if(o[1]===t)return{ref:"#"};let l=`#/${a}/`,u=o[1].schema.id??`__schema${n.counter++}`;return{defId:u,ref:l+u}},s=o=>{if(o[1].schema.$ref)return;let a=o[1],{ref:c,defId:l}=r(o);a.def={...a.schema},l&&(a.defId=l);let u=a.schema;for(let d in u)delete u[d];u.$ref=c};if(n.cycles==="throw")for(let o of n.seen.entries()){let a=o[1];if(a.cycle)throw new Error(`Cycle detected: #/${a.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let o of n.seen.entries()){let a=o[1];if(e===o[0]){s(o);continue}if(n.external){let l=n.external.registry.get(o[0])?.id;if(e!==o[0]&&l){s(o);continue}}if(n.metadataRegistry.get(o[0])?.id){s(o);continue}if(a.cycle){s(o);continue}if(a.count>1&&n.reused==="ref"){s(o);continue}}}function Di(n,e){let t=n.seen.get(e);if(!t)throw new Error("Unprocessed schema. This is a bug in Zod.");let i=a=>{let c=n.seen.get(a);if(c.ref===null)return;let l=c.def??c.schema,u={...l},d=c.ref;if(c.ref=null,d){i(d);let f=n.seen.get(d),p=f.schema;if(p.$ref&&(n.target==="draft-07"||n.target==="draft-04"||n.target==="openapi-3.0")?(l.allOf=l.allOf??[],l.allOf.push(p)):Object.assign(l,p),Object.assign(l,u),a._zod.parent===d)for(let g in l)g==="$ref"||g==="allOf"||g in u||delete l[g];if(p.$ref&&f.def)for(let g in l)g==="$ref"||g==="allOf"||g in f.def&&JSON.stringify(l[g])===JSON.stringify(f.def[g])&&delete l[g]}let h=a._zod.parent;if(h&&h!==d){i(h);let f=n.seen.get(h);if(f?.schema.$ref&&(l.$ref=f.schema.$ref,f.def))for(let p in l)p==="$ref"||p==="allOf"||p in f.def&&JSON.stringify(l[p])===JSON.stringify(f.def[p])&&delete l[p]}n.override({zodSchema:a,jsonSchema:l,path:c.path??[]})};for(let a of[...n.seen.entries()].reverse())i(a[0]);let r={};if(n.target==="draft-2020-12"?r.$schema="https://json-schema.org/draft/2020-12/schema":n.target==="draft-07"?r.$schema="http://json-schema.org/draft-07/schema#":n.target==="draft-04"?r.$schema="http://json-schema.org/draft-04/schema#":n.target,n.external?.uri){let a=n.external.registry.get(e)?.id;if(!a)throw new Error("Schema is missing an `id` property");r.$id=n.external.uri(a)}Object.assign(r,t.def??t.schema);let s=n.metadataRegistry.get(e)?.id;s!==void 0&&r.id===s&&delete r.id;let o=n.external?.defs??{};for(let a of n.seen.entries()){let c=a[1];c.def&&c.defId&&(c.def.id===c.defId&&delete c.def.id,o[c.defId]=c.def)}n.external||Object.keys(o).length>0&&(n.target==="draft-2020-12"?r.$defs=o:r.definitions=o);try{let a=JSON.parse(JSON.stringify(r));return Object.defineProperty(a,"~standard",{value:{...e["~standard"],jsonSchema:{input:hs(e,"input",n.processors),output:hs(e,"output",n.processors)}},enumerable:!1,writable:!1}),a}catch{throw new Error("Error converting schema to JSON.")}}function dn(n,e){let t=e??{seen:new Set};if(t.seen.has(n))return!1;t.seen.add(n);let i=n._zod.def;if(i.type==="transform")return!0;if(i.type==="array")return dn(i.element,t);if(i.type==="set")return dn(i.valueType,t);if(i.type==="lazy")return dn(i.getter(),t);if(i.type==="promise"||i.type==="optional"||i.type==="nonoptional"||i.type==="nullable"||i.type==="readonly"||i.type==="default"||i.type==="prefault")return dn(i.innerType,t);if(i.type==="intersection")return dn(i.left,t)||dn(i.right,t);if(i.type==="record"||i.type==="map")return dn(i.keyType,t)||dn(i.valueType,t);if(i.type==="pipe")return n._zod.traits.has("$ZodCodec")?!0:dn(i.in,t)||dn(i.out,t);if(i.type==="object"){for(let r in i.shape)if(dn(i.shape[r],t))return!0;return!1}if(i.type==="union"){for(let r of i.options)if(dn(r,t))return!0;return!1}if(i.type==="tuple"){for(let r of i.items)if(dn(r,t))return!0;return!!(i.rest&&dn(i.rest,t))}return!1}var dm=(n,e={})=>t=>{let i=Ii({...t,processors:e});return vt(n,i),Ni(i,n),Di(i,n)},hs=(n,e,t={})=>i=>{let{libraryOptions:r,target:s}=i??{},o=Ii({...r??{},target:s,io:e,processors:t});return vt(n,o),Ni(o,n),Di(o,n)};var Tw={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},fm=(n,e,t,i)=>{let r=t;r.type="string";let{minimum:s,maximum:o,format:a,patterns:c,contentEncoding:l}=n._zod.bag;if(typeof s=="number"&&(r.minLength=s),typeof o=="number"&&(r.maxLength=o),a&&(r.format=Tw[a]??a,r.format===""&&delete r.format,a==="time"&&delete r.format),l&&(r.contentEncoding=l),c&&c.size>0){let u=[...c];u.length===1?r.pattern=u[0].source:u.length>1&&(r.allOf=[...u.map(d=>({...e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0"?{type:"string"}:{},pattern:d.source}))])}},pm=(n,e,t,i)=>{let r=t,{minimum:s,maximum:o,format:a,multipleOf:c,exclusiveMaximum:l,exclusiveMinimum:u}=n._zod.bag;typeof a=="string"&&a.includes("int")?r.type="integer":r.type="number";let d=typeof u=="number"&&u>=(s??Number.NEGATIVE_INFINITY),h=typeof l=="number"&&l<=(o??Number.POSITIVE_INFINITY),f=e.target==="draft-04"||e.target==="openapi-3.0";d?f?(r.minimum=u,r.exclusiveMinimum=!0):r.exclusiveMinimum=u:typeof s=="number"&&(r.minimum=s),h?f?(r.maximum=l,r.exclusiveMaximum=!0):r.exclusiveMaximum=l:typeof o=="number"&&(r.maximum=o),typeof c=="number"&&(r.multipleOf=c)},mm=(n,e,t,i)=>{t.type="boolean"},gm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("BigInt cannot be represented in JSON Schema")},xm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Symbols cannot be represented in JSON Schema")},_m=(n,e,t,i)=>{e.target==="openapi-3.0"?(t.type="string",t.nullable=!0,t.enum=[null]):t.type="null"},vm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Undefined cannot be represented in JSON Schema")},ym=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Void cannot be represented in JSON Schema")},bm=(n,e,t,i)=>{t.not={}},Sm=(n,e,t,i)=>{},Mm=(n,e,t,i)=>{},wm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Date cannot be represented in JSON Schema")},Em=(n,e,t,i)=>{let r=n._zod.def,s=uo(r.entries);s.every(o=>typeof o=="number")&&(t.type="number"),s.every(o=>typeof o=="string")&&(t.type="string"),t.enum=s},Tm=(n,e,t,i)=>{let r=n._zod.def,s=[];for(let o of r.values)if(o===void 0){if(e.unrepresentable==="throw")throw new Error("Literal `undefined` cannot be represented in JSON Schema")}else if(typeof o=="bigint"){if(e.unrepresentable==="throw")throw new Error("BigInt literals cannot be represented in JSON Schema");s.push(Number(o))}else s.push(o);if(s.length!==0)if(s.length===1){let o=s[0];t.type=o===null?"null":typeof o,e.target==="draft-04"||e.target==="openapi-3.0"?t.enum=[o]:t.const=o}else s.every(o=>typeof o=="number")&&(t.type="number"),s.every(o=>typeof o=="string")&&(t.type="string"),s.every(o=>typeof o=="boolean")&&(t.type="boolean"),s.every(o=>o===null)&&(t.type="null"),t.enum=s},Am=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("NaN cannot be represented in JSON Schema")},Rm=(n,e,t,i)=>{let r=t,s=n._zod.pattern;if(!s)throw new Error("Pattern not found in template literal");r.type="string",r.pattern=s.source},Cm=(n,e,t,i)=>{let r=t,s={type:"string",format:"binary",contentEncoding:"binary"},{minimum:o,maximum:a,mime:c}=n._zod.bag;o!==void 0&&(s.minLength=o),a!==void 0&&(s.maxLength=a),c?c.length===1?(s.contentMediaType=c[0],Object.assign(r,s)):(Object.assign(r,s),r.anyOf=c.map(l=>({contentMediaType:l}))):Object.assign(r,s)},Pm=(n,e,t,i)=>{t.type="boolean"},Im=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Custom types cannot be represented in JSON Schema")},Nm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Function types cannot be represented in JSON Schema")},Dm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Transforms cannot be represented in JSON Schema")},zm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Map cannot be represented in JSON Schema")},Lm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Set cannot be represented in JSON Schema")},Um=(n,e,t,i)=>{let r=t,s=n._zod.def,{minimum:o,maximum:a}=n._zod.bag;typeof o=="number"&&(r.minItems=o),typeof a=="number"&&(r.maxItems=a),r.type="array",r.items=vt(s.element,e,{...i,path:[...i.path,"items"]})},Om=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="object",r.properties={};let o=s.shape;for(let l in o)r.properties[l]=vt(o[l],e,{...i,path:[...i.path,"properties",l]});let a=new Set(Object.keys(o)),c=new Set([...a].filter(l=>{let u=s.shape[l]._zod;return e.io==="input"?u.optin===void 0:u.optout===void 0}));c.size>0&&(r.required=Array.from(c)),s.catchall?._zod.def.type==="never"?r.additionalProperties=!1:s.catchall?s.catchall&&(r.additionalProperties=vt(s.catchall,e,{...i,path:[...i.path,"additionalProperties"]})):e.io==="output"&&(r.additionalProperties=!1)},Jc=(n,e,t,i)=>{let r=n._zod.def,s=r.inclusive===!1,o=r.options.map((a,c)=>vt(a,e,{...i,path:[...i.path,s?"oneOf":"anyOf",c]}));s?t.oneOf=o:t.anyOf=o},Fm=(n,e,t,i)=>{let r=n._zod.def,s=vt(r.left,e,{...i,path:[...i.path,"allOf",0]}),o=vt(r.right,e,{...i,path:[...i.path,"allOf",1]}),a=l=>"allOf"in l&&Object.keys(l).length===1,c=[...a(s)?s.allOf:[s],...a(o)?o.allOf:[o]];t.allOf=c},km=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="array";let o=e.target==="draft-2020-12"?"prefixItems":"items",a=e.target==="draft-2020-12"||e.target==="openapi-3.0"?"items":"additionalItems",c=s.items.map((h,f)=>vt(h,e,{...i,path:[...i.path,o,f]})),l=s.rest?vt(s.rest,e,{...i,path:[...i.path,a,...e.target==="openapi-3.0"?[s.items.length]:[]]}):null;e.target==="draft-2020-12"?(r.prefixItems=c,l&&(r.items=l)):e.target==="openapi-3.0"?(r.items={anyOf:c},l&&r.items.anyOf.push(l),r.minItems=c.length,l||(r.maxItems=c.length)):(r.items=c,l&&(r.additionalItems=l));let{minimum:u,maximum:d}=n._zod.bag;typeof u=="number"&&(r.minItems=u),typeof d=="number"&&(r.maxItems=d)},Bm=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="object";let o=s.keyType,c=o._zod.bag?.patterns;if(s.mode==="loose"&&c&&c.size>0){let u=vt(s.valueType,e,{...i,path:[...i.path,"patternProperties","*"]});r.patternProperties={};for(let d of c)r.patternProperties[d.source]=u}else(e.target==="draft-07"||e.target==="draft-2020-12")&&(r.propertyNames=vt(s.keyType,e,{...i,path:[...i.path,"propertyNames"]})),r.additionalProperties=vt(s.valueType,e,{...i,path:[...i.path,"additionalProperties"]});let l=o._zod.values;if(l){let u=[...l].filter(d=>typeof d=="string"||typeof d=="number");u.length>0&&(r.required=u)}},Hm=(n,e,t,i)=>{let r=n._zod.def,s=vt(r.innerType,e,i),o=e.seen.get(n);e.target==="openapi-3.0"?(o.ref=r.innerType,t.nullable=!0):t.anyOf=[s,{type:"null"}]},Gm=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},Vm=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,t.default=JSON.parse(JSON.stringify(r.defaultValue))},$m=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,e.io==="input"&&(t._prefault=JSON.parse(JSON.stringify(r.defaultValue)))},Wm=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType;let o;try{o=r.catchValue(void 0)}catch{throw new Error("Dynamic catch values are not supported in JSON Schema")}t.default=o},Zm=(n,e,t,i)=>{let r=n._zod.def,s=r.in._zod.traits.has("$ZodTransform"),o=e.io==="input"?s?r.out:r.in:r.out;vt(o,e,i);let a=e.seen.get(n);a.ref=o},Xm=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,t.readOnly=!0},qm=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},jc=(n,e,t,i)=>{let r=n._zod.def;vt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},Ym=(n,e,t,i)=>{let r=n._zod.innerType;vt(r,e,i);let s=e.seen.get(n);s.ref=r},Yc={string:fm,number:pm,boolean:mm,bigint:gm,symbol:xm,null:_m,undefined:vm,void:ym,never:bm,any:Sm,unknown:Mm,date:wm,enum:Em,literal:Tm,nan:Am,template_literal:Rm,file:Cm,success:Pm,custom:Im,function:Nm,transform:Dm,map:zm,set:Lm,array:Um,object:Om,union:Jc,intersection:Fm,tuple:km,record:Bm,nullable:Hm,nonoptional:Gm,default:Vm,prefault:$m,catch:Wm,pipe:Zm,readonly:Xm,promise:qm,optional:jc,lazy:Ym};function Kc(n,e){if("_idmap"in n){let i=n,r=Ii({...e,processors:Yc}),s={};for(let c of i._idmap.entries()){let[l,u]=c;vt(u,r)}let o={},a={registry:i,uri:e?.uri,defs:s};r.external=a;for(let c of i._idmap.entries()){let[l,u]=c;Ni(r,u),o[l]=Di(r,u)}if(Object.keys(s).length>0){let c=r.target==="draft-2020-12"?"$defs":"definitions";o.__shared={[c]:s}}return{schemas:o}}let t=Ii({...e,processors:Yc});return vt(n,t),Ni(t,n),Di(t,n)}var Qc=class{get metadataRegistry(){return this.ctx.metadataRegistry}get target(){return this.ctx.target}get unrepresentable(){return this.ctx.unrepresentable}get override(){return this.ctx.override}get io(){return this.ctx.io}get counter(){return this.ctx.counter}set counter(e){this.ctx.counter=e}get seen(){return this.ctx.seen}constructor(e){let t=e?.target??"draft-2020-12";t==="draft-4"&&(t="draft-04"),t==="draft-7"&&(t="draft-07"),this.ctx=Ii({processors:Yc,target:t,...e?.metadata&&{metadata:e.metadata},...e?.unrepresentable&&{unrepresentable:e.unrepresentable},...e?.override&&{override:e.override},...e?.io&&{io:e.io}})}process(e,t={path:[],schemaPath:[]}){return vt(e,this.ctx,t)}emit(e,t){t&&(t.cycles&&(this.ctx.cycles=t.cycles),t.reused&&(this.ctx.reused=t.reused),t.external&&(this.ctx.external=t.external)),Ni(this.ctx,e);let i=Di(this.ctx,e),{"~standard":r,...s}=i;return s}};var O_={};var Ro={};ui(Ro,{ZodAny:()=>v0,ZodArray:()=>M0,ZodBase64:()=>yl,ZodBase64URL:()=>bl,ZodBigInt:()=>vs,ZodBigIntFormat:()=>wl,ZodBoolean:()=>_s,ZodCIDRv4:()=>_l,ZodCIDRv6:()=>vl,ZodCUID:()=>hl,ZodCUID2:()=>dl,ZodCatch:()=>W0,ZodCodec:()=>Bo,ZodCustom:()=>Ho,ZodCustomStringFormat:()=>gs,ZodDate:()=>Lo,ZodDefault:()=>k0,ZodDiscriminatedUnion:()=>E0,ZodE164:()=>Sl,ZodEmail:()=>cl,ZodEmoji:()=>ll,ZodEnum:()=>ps,ZodExactOptional:()=>U0,ZodFile:()=>z0,ZodFunction:()=>tg,ZodGUID:()=>Po,ZodIPv4:()=>gl,ZodIPv6:()=>xl,ZodIntersection:()=>T0,ZodJWT:()=>Ml,ZodKSUID:()=>ml,ZodLazy:()=>K0,ZodLiteral:()=>D0,ZodMAC:()=>d0,ZodMap:()=>I0,ZodNaN:()=>X0,ZodNanoID:()=>ul,ZodNever:()=>b0,ZodNonOptional:()=>Pl,ZodNull:()=>x0,ZodNullable:()=>F0,ZodNumber:()=>xs,ZodNumberFormat:()=>xr,ZodObject:()=>Oo,ZodOptional:()=>Cl,ZodPipe:()=>ko,ZodPrefault:()=>H0,ZodPreprocess:()=>q0,ZodPromise:()=>eg,ZodReadonly:()=>Y0,ZodRecord:()=>fs,ZodSet:()=>N0,ZodString:()=>ms,ZodStringFormat:()=>Et,ZodSuccess:()=>$0,ZodSymbol:()=>m0,ZodTemplateLiteral:()=>j0,ZodTransform:()=>L0,ZodTuple:()=>R0,ZodType:()=>nt,ZodULID:()=>fl,ZodURL:()=>zo,ZodUUID:()=>ti,ZodUndefined:()=>g0,ZodUnion:()=>Fo,ZodUnknown:()=>y0,ZodVoid:()=>S0,ZodXID:()=>pl,ZodXor:()=>w0,_ZodString:()=>al,_default:()=>B0,_function:()=>Zv,any:()=>Mv,array:()=>Uo,base64:()=>ov,base64url:()=>av,bigint:()=>_v,boolean:()=>p0,catch:()=>Z0,check:()=>Xv,cidrv4:()=>rv,cidrv6:()=>sv,codec:()=>Gv,cuid:()=>J_,cuid2:()=>j_,custom:()=>qv,date:()=>Ev,describe:()=>Yv,discriminatedUnion:()=>Iv,e164:()=>cv,email:()=>B_,emoji:()=>q_,enum:()=>Al,exactOptional:()=>O0,file:()=>Fv,float32:()=>pv,float64:()=>mv,function:()=>Zv,guid:()=>H_,hash:()=>fv,hex:()=>dv,hostname:()=>hv,httpUrl:()=>X_,instanceof:()=>jv,int:()=>sl,int32:()=>gv,int64:()=>vv,intersection:()=>A0,invertCodec:()=>Vv,ipv4:()=>tv,ipv6:()=>iv,json:()=>Qv,jwt:()=>lv,keyof:()=>Tv,ksuid:()=>ev,lazy:()=>Q0,literal:()=>Ov,looseObject:()=>Cv,looseRecord:()=>Dv,mac:()=>nv,map:()=>zv,meta:()=>Jv,nan:()=>Hv,nanoid:()=>Y_,nativeEnum:()=>Uv,never:()=>El,nonoptional:()=>V0,null:()=>_0,nullable:()=>No,nullish:()=>kv,number:()=>f0,object:()=>Av,optional:()=>Io,partialRecord:()=>Nv,pipe:()=>ol,prefault:()=>G0,preprocess:()=>ey,promise:()=>Wv,readonly:()=>J0,record:()=>P0,refine:()=>ng,set:()=>Lv,strictObject:()=>Rv,string:()=>Co,stringFormat:()=>uv,stringbool:()=>Kv,success:()=>Bv,superRefine:()=>ig,symbol:()=>bv,templateLiteral:()=>$v,transform:()=>Rl,tuple:()=>C0,uint32:()=>xv,uint64:()=>yv,ulid:()=>K_,undefined:()=>Sv,union:()=>Tl,unknown:()=>gr,url:()=>Z_,uuid:()=>G_,uuidv4:()=>V_,uuidv6:()=>$_,uuidv7:()=>W_,void:()=>wv,xid:()=>Q_,xor:()=>Pv});var el={};ui(el,{endsWith:()=>is,gt:()=>Qn,gte:()=>hn,includes:()=>ts,length:()=>mr,lowercase:()=>Qr,lt:()=>Kn,lte:()=>Mn,maxLength:()=>pr,maxSize:()=>Pi,mime:()=>rs,minLength:()=>di,minSize:()=>ei,multipleOf:()=>Ci,negative:()=>Wc,nonnegative:()=>Xc,nonpositive:()=>Zc,normalize:()=>ss,overwrite:()=>kn,positive:()=>$c,property:()=>qc,regex:()=>Kr,size:()=>fr,slugify:()=>ls,startsWith:()=>ns,toLowerCase:()=>as,toUpperCase:()=>cs,trim:()=>os,uppercase:()=>es});var ds={};ui(ds,{ZodISODate:()=>nl,ZodISODateTime:()=>tl,ZodISODuration:()=>rl,ZodISOTime:()=>il,date:()=>jm,datetime:()=>Jm,duration:()=>Qm,time:()=>Km});var tl=F("ZodISODateTime",(n,e)=>{Af.init(n,e),Et.init(n,e)});function Jm(n){return Ip(tl,n)}var nl=F("ZodISODate",(n,e)=>{Rf.init(n,e),Et.init(n,e)});function jm(n){return Np(nl,n)}var il=F("ZodISOTime",(n,e)=>{Cf.init(n,e),Et.init(n,e)});function Km(n){return Dp(il,n)}var rl=F("ZodISODuration",(n,e)=>{Pf.init(n,e),Et.init(n,e)});function Qm(n){return zp(rl,n)}var F_=(n,e)=>{go.init(n,e),n.name="ZodError",Object.defineProperties(n,{format:{value:t=>_o(n,t)},flatten:{value:t=>xo(n,t)},addIssue:{value:t=>{n.issues.push(t),n.message=JSON.stringify(n.issues,$r,2)}},addIssues:{value:t=>{n.issues.push(...t),n.message=JSON.stringify(n.issues,$r,2)}},isEmpty:{get(){return n.issues.length===0}}})},Rw=F("ZodError",F_),_n=F("ZodError",F_,{Parent:Error});var e0=Xr(_n),t0=qr(_n),n0=Yr(_n),i0=Jr(_n),r0=ec(_n),s0=tc(_n),o0=nc(_n),a0=ic(_n),c0=rc(_n),l0=sc(_n),u0=oc(_n),h0=ac(_n);var k_=new WeakMap;function Do(n,e,t){let i=Object.getPrototypeOf(n),r=k_.get(i);if(r||(r=new Set,k_.set(i,r)),!r.has(e)){r.add(e);for(let s in t){let o=t[s];Object.defineProperty(i,s,{configurable:!0,enumerable:!1,get(){let a=o.bind(this);return Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a}),a},set(a){Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a})}})}}}var nt=F("ZodType",(n,e)=>(Ke.init(n,e),Object.assign(n["~standard"],{jsonSchema:{input:hs(n,"input"),output:hs(n,"output")}}),n.toJSONSchema=dm(n,{}),n.def=e,n.type=e.type,Object.defineProperty(n,"_def",{value:e}),n.parse=(t,i)=>e0(n,t,i,{callee:n.parse}),n.safeParse=(t,i)=>n0(n,t,i),n.parseAsync=async(t,i)=>t0(n,t,i,{callee:n.parseAsync}),n.safeParseAsync=async(t,i)=>i0(n,t,i),n.spa=n.safeParseAsync,n.encode=(t,i)=>r0(n,t,i),n.decode=(t,i)=>s0(n,t,i),n.encodeAsync=async(t,i)=>o0(n,t,i),n.decodeAsync=async(t,i)=>a0(n,t,i),n.safeEncode=(t,i)=>c0(n,t,i),n.safeDecode=(t,i)=>l0(n,t,i),n.safeEncodeAsync=async(t,i)=>u0(n,t,i),n.safeDecodeAsync=async(t,i)=>h0(n,t,i),Do(n,"ZodType",{check(...t){let i=this.def;return this.clone(Ye.mergeDefs(i,{checks:[...i.checks??[],...t.map(r=>typeof r=="function"?{_zod:{check:r,def:{check:"custom"},onattach:[]}}:r)]}),{parent:!0})},with(...t){return this.check(...t)},clone(t,i){return ln(this,t,i)},brand(){return this},register(t,i){return t.add(this,i),this},refine(t,i){return this.check(ng(t,i))},superRefine(t,i){return this.check(ig(t,i))},overwrite(t){return this.check(kn(t))},optional(){return Io(this)},exactOptional(){return O0(this)},nullable(){return No(this)},nullish(){return Io(No(this))},nonoptional(t){return V0(this,t)},array(){return Uo(this)},or(t){return Tl([this,t])},and(t){return A0(this,t)},transform(t){return ol(this,Rl(t))},default(t){return B0(this,t)},prefault(t){return G0(this,t)},catch(t){return Z0(this,t)},pipe(t){return ol(this,t)},readonly(){return J0(this)},describe(t){let i=this.clone();return Xt.add(i,{description:t}),i},meta(...t){if(t.length===0)return Xt.get(this);let i=this.clone();return Xt.add(i,t[0]),i},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(t){return t(this)}}),Object.defineProperty(n,"description",{get(){return Xt.get(n)?.description},configurable:!0}),n)),al=F("_ZodString",(n,e)=>{dr.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>fm(n,i,r,s);let t=n._zod.bag;n.format=t.format??null,n.minLength=t.minimum??null,n.maxLength=t.maximum??null,Do(n,"_ZodString",{regex(...i){return this.check(Kr(...i))},includes(...i){return this.check(ts(...i))},startsWith(...i){return this.check(ns(...i))},endsWith(...i){return this.check(is(...i))},min(...i){return this.check(di(...i))},max(...i){return this.check(pr(...i))},length(...i){return this.check(mr(...i))},nonempty(...i){return this.check(di(1,...i))},lowercase(i){return this.check(Qr(i))},uppercase(i){return this.check(es(i))},trim(){return this.check(os())},normalize(...i){return this.check(ss(...i))},toLowerCase(){return this.check(as())},toUpperCase(){return this.check(cs())},slugify(){return this.check(ls())}})}),ms=F("ZodString",(n,e)=>{dr.init(n,e),al.init(n,e),n.email=t=>n.check(wc(cl,t)),n.url=t=>n.check(Ao(zo,t)),n.jwt=t=>n.check(Vc(Ml,t)),n.emoji=t=>n.check(Cc(ll,t)),n.guid=t=>n.check(To(Po,t)),n.uuid=t=>n.check(Ec(ti,t)),n.uuidv4=t=>n.check(Tc(ti,t)),n.uuidv6=t=>n.check(Ac(ti,t)),n.uuidv7=t=>n.check(Rc(ti,t)),n.nanoid=t=>n.check(Pc(ul,t)),n.guid=t=>n.check(To(Po,t)),n.cuid=t=>n.check(Ic(hl,t)),n.cuid2=t=>n.check(Nc(dl,t)),n.ulid=t=>n.check(Dc(fl,t)),n.base64=t=>n.check(Bc(yl,t)),n.base64url=t=>n.check(Hc(bl,t)),n.xid=t=>n.check(zc(pl,t)),n.ksuid=t=>n.check(Lc(ml,t)),n.ipv4=t=>n.check(Uc(gl,t)),n.ipv6=t=>n.check(Oc(xl,t)),n.cidrv4=t=>n.check(Fc(_l,t)),n.cidrv6=t=>n.check(kc(vl,t)),n.e164=t=>n.check(Gc(Sl,t)),n.datetime=t=>n.check(Jm(t)),n.date=t=>n.check(jm(t)),n.time=t=>n.check(Km(t)),n.duration=t=>n.check(Qm(t))});function Co(n){return Ap(ms,n)}var Et=F("ZodStringFormat",(n,e)=>{wt.init(n,e),al.init(n,e)}),cl=F("ZodEmail",(n,e)=>{_f.init(n,e),Et.init(n,e)});function B_(n){return wc(cl,n)}var Po=F("ZodGUID",(n,e)=>{gf.init(n,e),Et.init(n,e)});function H_(n){return To(Po,n)}var ti=F("ZodUUID",(n,e)=>{xf.init(n,e),Et.init(n,e)});function G_(n){return Ec(ti,n)}function V_(n){return Tc(ti,n)}function $_(n){return Ac(ti,n)}function W_(n){return Rc(ti,n)}var zo=F("ZodURL",(n,e)=>{vf.init(n,e),Et.init(n,e)});function Z_(n){return Ao(zo,n)}function X_(n){return Ao(zo,{protocol:Sn.httpProtocol,hostname:Sn.domain,...Ye.normalizeParams(n)})}var ll=F("ZodEmoji",(n,e)=>{yf.init(n,e),Et.init(n,e)});function q_(n){return Cc(ll,n)}var ul=F("ZodNanoID",(n,e)=>{bf.init(n,e),Et.init(n,e)});function Y_(n){return Pc(ul,n)}var hl=F("ZodCUID",(n,e)=>{Sf.init(n,e),Et.init(n,e)});function J_(n){return Ic(hl,n)}var dl=F("ZodCUID2",(n,e)=>{Mf.init(n,e),Et.init(n,e)});function j_(n){return Nc(dl,n)}var fl=F("ZodULID",(n,e)=>{wf.init(n,e),Et.init(n,e)});function K_(n){return Dc(fl,n)}var pl=F("ZodXID",(n,e)=>{Ef.init(n,e),Et.init(n,e)});function Q_(n){return zc(pl,n)}var ml=F("ZodKSUID",(n,e)=>{Tf.init(n,e),Et.init(n,e)});function ev(n){return Lc(ml,n)}var gl=F("ZodIPv4",(n,e)=>{If.init(n,e),Et.init(n,e)});function tv(n){return Uc(gl,n)}var d0=F("ZodMAC",(n,e)=>{Df.init(n,e),Et.init(n,e)});function nv(n){return Cp(d0,n)}var xl=F("ZodIPv6",(n,e)=>{Nf.init(n,e),Et.init(n,e)});function iv(n){return Oc(xl,n)}var _l=F("ZodCIDRv4",(n,e)=>{zf.init(n,e),Et.init(n,e)});function rv(n){return Fc(_l,n)}var vl=F("ZodCIDRv6",(n,e)=>{Lf.init(n,e),Et.init(n,e)});function sv(n){return kc(vl,n)}var yl=F("ZodBase64",(n,e)=>{Of.init(n,e),Et.init(n,e)});function ov(n){return Bc(yl,n)}var bl=F("ZodBase64URL",(n,e)=>{Ff.init(n,e),Et.init(n,e)});function av(n){return Hc(bl,n)}var Sl=F("ZodE164",(n,e)=>{kf.init(n,e),Et.init(n,e)});function cv(n){return Gc(Sl,n)}var Ml=F("ZodJWT",(n,e)=>{Bf.init(n,e),Et.init(n,e)});function lv(n){return Vc(Ml,n)}var gs=F("ZodCustomStringFormat",(n,e)=>{Hf.init(n,e),Et.init(n,e)});function uv(n,e,t={}){return us(gs,n,e,t)}function hv(n){return us(gs,"hostname",Sn.hostname,n)}function dv(n){return us(gs,"hex",Sn.hex,n)}function fv(n,e){let t=e?.enc??"hex",i=`${n}_${t}`,r=Sn[i];if(!r)throw new Error(`Unrecognized hash format: ${i}`);return us(gs,i,r,e)}var xs=F("ZodNumber",(n,e)=>{gc.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>pm(n,i,r,s),Do(n,"ZodNumber",{gt(i,r){return this.check(Qn(i,r))},gte(i,r){return this.check(hn(i,r))},min(i,r){return this.check(hn(i,r))},lt(i,r){return this.check(Kn(i,r))},lte(i,r){return this.check(Mn(i,r))},max(i,r){return this.check(Mn(i,r))},int(i){return this.check(sl(i))},safe(i){return this.check(sl(i))},positive(i){return this.check(Qn(0,i))},nonnegative(i){return this.check(hn(0,i))},negative(i){return this.check(Kn(0,i))},nonpositive(i){return this.check(Mn(0,i))},multipleOf(i,r){return this.check(Ci(i,r))},step(i,r){return this.check(Ci(i,r))},finite(){return this}});let t=n._zod.bag;n.minValue=Math.max(t.minimum??Number.NEGATIVE_INFINITY,t.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,n.maxValue=Math.min(t.maximum??Number.POSITIVE_INFINITY,t.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,n.isInt=(t.format??"").includes("int")||Number.isSafeInteger(t.multipleOf??.5),n.isFinite=!0,n.format=t.format??null});function f0(n){return Lp(xs,n)}var xr=F("ZodNumberFormat",(n,e)=>{Gf.init(n,e),xs.init(n,e)});function sl(n){return Op(xr,n)}function pv(n){return Fp(xr,n)}function mv(n){return kp(xr,n)}function gv(n){return Bp(xr,n)}function xv(n){return Hp(xr,n)}var _s=F("ZodBoolean",(n,e)=>{So.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>mm(n,t,i,r)});function p0(n){return Gp(_s,n)}var vs=F("ZodBigInt",(n,e)=>{xc.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>gm(n,i,r,s),n.gte=(i,r)=>n.check(hn(i,r)),n.min=(i,r)=>n.check(hn(i,r)),n.gt=(i,r)=>n.check(Qn(i,r)),n.gte=(i,r)=>n.check(hn(i,r)),n.min=(i,r)=>n.check(hn(i,r)),n.lt=(i,r)=>n.check(Kn(i,r)),n.lte=(i,r)=>n.check(Mn(i,r)),n.max=(i,r)=>n.check(Mn(i,r)),n.positive=i=>n.check(Qn(BigInt(0),i)),n.negative=i=>n.check(Kn(BigInt(0),i)),n.nonpositive=i=>n.check(Mn(BigInt(0),i)),n.nonnegative=i=>n.check(hn(BigInt(0),i)),n.multipleOf=(i,r)=>n.check(Ci(i,r));let t=n._zod.bag;n.minValue=t.minimum??null,n.maxValue=t.maximum??null,n.format=t.format??null});function _v(n){return $p(vs,n)}var wl=F("ZodBigIntFormat",(n,e)=>{Vf.init(n,e),vs.init(n,e)});function vv(n){return Zp(wl,n)}function yv(n){return Xp(wl,n)}var m0=F("ZodSymbol",(n,e)=>{$f.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>xm(n,t,i,r)});function bv(n){return qp(m0,n)}var g0=F("ZodUndefined",(n,e)=>{Wf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>vm(n,t,i,r)});function Sv(n){return Yp(g0,n)}var x0=F("ZodNull",(n,e)=>{Zf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>_m(n,t,i,r)});function _0(n){return Jp(x0,n)}var v0=F("ZodAny",(n,e)=>{Xf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Sm(n,t,i,r)});function Mv(){return jp(v0)}var y0=F("ZodUnknown",(n,e)=>{qf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Mm(n,t,i,r)});function gr(){return Kp(y0)}var b0=F("ZodNever",(n,e)=>{Yf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>bm(n,t,i,r)});function El(n){return Qp(b0,n)}var S0=F("ZodVoid",(n,e)=>{Jf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>ym(n,t,i,r)});function wv(n){return em(S0,n)}var Lo=F("ZodDate",(n,e)=>{jf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>wm(n,i,r,s),n.min=(i,r)=>n.check(hn(i,r)),n.max=(i,r)=>n.check(Mn(i,r));let t=n._zod.bag;n.minDate=t.minimum?new Date(t.minimum):null,n.maxDate=t.maximum?new Date(t.maximum):null});function Ev(n){return tm(Lo,n)}var M0=F("ZodArray",(n,e)=>{Kf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Um(n,t,i,r),n.element=e.element,Do(n,"ZodArray",{min(t,i){return this.check(di(t,i))},nonempty(t){return this.check(di(1,t))},max(t,i){return this.check(pr(t,i))},length(t,i){return this.check(mr(t,i))},unwrap(){return this.element}})});function Uo(n,e){return rm(M0,n,e)}function Tv(n){let e=n._zod.def.shape;return Al(Object.keys(e))}var Oo=F("ZodObject",(n,e)=>{Qf.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Om(n,t,i,r),Ye.defineLazy(n,"shape",()=>e.shape),Do(n,"ZodObject",{keyof(){return Al(Object.keys(this._zod.def.shape))},catchall(t){return this.clone({...this._zod.def,catchall:t})},passthrough(){return this.clone({...this._zod.def,catchall:gr()})},loose(){return this.clone({...this._zod.def,catchall:gr()})},strict(){return this.clone({...this._zod.def,catchall:El()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(t){return Ye.extend(this,t)},safeExtend(t){return Ye.safeExtend(this,t)},merge(t){return Ye.merge(this,t)},pick(t){return Ye.pick(this,t)},omit(t){return Ye.omit(this,t)},partial(...t){return Ye.partial(Cl,this,t[0])},required(...t){return Ye.required(Pl,this,t[0])}})});function Av(n,e){let t={type:"object",shape:n??{},...Ye.normalizeParams(e)};return new Oo(t)}function Rv(n,e){return new Oo({type:"object",shape:n,catchall:El(),...Ye.normalizeParams(e)})}function Cv(n,e){return new Oo({type:"object",shape:n,catchall:gr(),...Ye.normalizeParams(e)})}var Fo=F("ZodUnion",(n,e)=>{Mo.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Jc(n,t,i,r),n.options=e.options});function Tl(n,e){return new Fo({type:"union",options:n,...Ye.normalizeParams(e)})}var w0=F("ZodXor",(n,e)=>{Fo.init(n,e),ep.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Jc(n,t,i,r),n.options=e.options});function Pv(n,e){return new w0({type:"union",options:n,inclusive:!1,...Ye.normalizeParams(e)})}var E0=F("ZodDiscriminatedUnion",(n,e)=>{Fo.init(n,e),tp.init(n,e)});function Iv(n,e,t){return new E0({type:"union",options:e,discriminator:n,...Ye.normalizeParams(t)})}var T0=F("ZodIntersection",(n,e)=>{np.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Fm(n,t,i,r)});function A0(n,e){return new T0({type:"intersection",left:n,right:e})}var R0=F("ZodTuple",(n,e)=>{_c.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>km(n,t,i,r),n.rest=t=>n.clone({...n._zod.def,rest:t})});function C0(n,e,t){let i=e instanceof Ke,r=i?t:e,s=i?e:null;return new R0({type:"tuple",items:n,rest:s,...Ye.normalizeParams(r)})}var fs=F("ZodRecord",(n,e)=>{ip.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Bm(n,t,i,r),n.keyType=e.keyType,n.valueType=e.valueType});function P0(n,e,t){return!e||!e._zod?new fs({type:"record",keyType:Co(),valueType:n,...Ye.normalizeParams(e)}):new fs({type:"record",keyType:n,valueType:e,...Ye.normalizeParams(t)})}function Nv(n,e,t){let i=ln(n);return i._zod.values=void 0,new fs({type:"record",keyType:i,valueType:e,...Ye.normalizeParams(t)})}function Dv(n,e,t){return new fs({type:"record",keyType:n,valueType:e,mode:"loose",...Ye.normalizeParams(t)})}var I0=F("ZodMap",(n,e)=>{rp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>zm(n,t,i,r),n.keyType=e.keyType,n.valueType=e.valueType,n.min=(...t)=>n.check(ei(...t)),n.nonempty=t=>n.check(ei(1,t)),n.max=(...t)=>n.check(Pi(...t)),n.size=(...t)=>n.check(fr(...t))});function zv(n,e,t){return new I0({type:"map",keyType:n,valueType:e,...Ye.normalizeParams(t)})}var N0=F("ZodSet",(n,e)=>{sp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Lm(n,t,i,r),n.min=(...t)=>n.check(ei(...t)),n.nonempty=t=>n.check(ei(1,t)),n.max=(...t)=>n.check(Pi(...t)),n.size=(...t)=>n.check(fr(...t))});function Lv(n,e){return new N0({type:"set",valueType:n,...Ye.normalizeParams(e)})}var ps=F("ZodEnum",(n,e)=>{op.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>Em(n,i,r,s),n.enum=e.entries,n.options=Object.values(e.entries);let t=new Set(Object.keys(e.entries));n.extract=(i,r)=>{let s={};for(let o of i)if(t.has(o))s[o]=e.entries[o];else throw new Error(`Key ${o} not found in enum`);return new ps({...e,checks:[],...Ye.normalizeParams(r),entries:s})},n.exclude=(i,r)=>{let s={...e.entries};for(let o of i)if(t.has(o))delete s[o];else throw new Error(`Key ${o} not found in enum`);return new ps({...e,checks:[],...Ye.normalizeParams(r),entries:s})}});function Al(n,e){let t=Array.isArray(n)?Object.fromEntries(n.map(i=>[i,i])):n;return new ps({type:"enum",entries:t,...Ye.normalizeParams(e)})}function Uv(n,e){return new ps({type:"enum",entries:n,...Ye.normalizeParams(e)})}var D0=F("ZodLiteral",(n,e)=>{ap.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Tm(n,t,i,r),n.values=new Set(e.values),Object.defineProperty(n,"value",{get(){if(e.values.length>1)throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");return e.values[0]}})});function Ov(n,e){return new D0({type:"literal",values:Array.isArray(n)?n:[n],...Ye.normalizeParams(e)})}var z0=F("ZodFile",(n,e)=>{cp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Cm(n,t,i,r),n.min=(t,i)=>n.check(ei(t,i)),n.max=(t,i)=>n.check(Pi(t,i)),n.mime=(t,i)=>n.check(rs(Array.isArray(t)?t:[t],i))});function Fv(n){return sm(z0,n)}var L0=F("ZodTransform",(n,e)=>{lp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Dm(n,t,i,r),n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new wi(n.constructor.name);t.addIssue=s=>{if(typeof s=="string")t.issues.push(Ye.issue(s,t.value,e));else{let o=s;o.fatal&&(o.continue=!1),o.code??(o.code="custom"),o.input??(o.input=t.value),o.inst??(o.inst=n),t.issues.push(Ye.issue(o))}};let r=e.transform(t.value,t);return r instanceof Promise?r.then(s=>(t.value=s,t.fallback=!0,t)):(t.value=r,t.fallback=!0,t)}});function Rl(n){return new L0({type:"transform",transform:n})}var Cl=F("ZodOptional",(n,e)=>{vc.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>jc(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function Io(n){return new Cl({type:"optional",innerType:n})}var U0=F("ZodExactOptional",(n,e)=>{up.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>jc(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function O0(n){return new U0({type:"optional",innerType:n})}var F0=F("ZodNullable",(n,e)=>{hp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Hm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function No(n){return new F0({type:"nullable",innerType:n})}function kv(n){return Io(No(n))}var k0=F("ZodDefault",(n,e)=>{dp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Vm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType,n.removeDefault=n.unwrap});function B0(n,e){return new k0({type:"default",innerType:n,get defaultValue(){return typeof e=="function"?e():Ye.shallowClone(e)}})}var H0=F("ZodPrefault",(n,e)=>{fp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>$m(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function G0(n,e){return new H0({type:"prefault",innerType:n,get defaultValue(){return typeof e=="function"?e():Ye.shallowClone(e)}})}var Pl=F("ZodNonOptional",(n,e)=>{pp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Gm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function V0(n,e){return new Pl({type:"nonoptional",innerType:n,...Ye.normalizeParams(e)})}var $0=F("ZodSuccess",(n,e)=>{mp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Pm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function Bv(n){return new $0({type:"success",innerType:n})}var W0=F("ZodCatch",(n,e)=>{gp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Wm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType,n.removeCatch=n.unwrap});function Z0(n,e){return new W0({type:"catch",innerType:n,catchValue:typeof e=="function"?e:()=>e})}var X0=F("ZodNaN",(n,e)=>{xp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Am(n,t,i,r)});function Hv(n){return im(X0,n)}var ko=F("ZodPipe",(n,e)=>{yc.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Zm(n,t,i,r),n.in=e.in,n.out=e.out});function ol(n,e){return new ko({type:"pipe",in:n,out:e})}var Bo=F("ZodCodec",(n,e)=>{ko.init(n,e),wo.init(n,e)});function Gv(n,e,t){return new Bo({type:"pipe",in:n,out:e,transform:t.decode,reverseTransform:t.encode})}function Vv(n){let e=n._zod.def;return new Bo({type:"pipe",in:e.out,out:e.in,transform:e.reverseTransform,reverseTransform:e.transform})}var q0=F("ZodPreprocess",(n,e)=>{ko.init(n,e),_p.init(n,e)}),Y0=F("ZodReadonly",(n,e)=>{vp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Xm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function J0(n){return new Y0({type:"readonly",innerType:n})}var j0=F("ZodTemplateLiteral",(n,e)=>{yp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Rm(n,t,i,r)});function $v(n,e){return new j0({type:"template_literal",parts:n,...Ye.normalizeParams(e)})}var K0=F("ZodLazy",(n,e)=>{Mp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Ym(n,t,i,r),n.unwrap=()=>n._zod.def.getter()});function Q0(n){return new K0({type:"lazy",getter:n})}var eg=F("ZodPromise",(n,e)=>{Sp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>qm(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function Wv(n){return new eg({type:"promise",innerType:n})}var tg=F("ZodFunction",(n,e)=>{bp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Nm(n,t,i,r)});function Zv(n){return new tg({type:"function",input:Array.isArray(n?.input)?C0(n?.input):n?.input??Uo(gr()),output:n?.output??gr()})}var Ho=F("ZodCustom",(n,e)=>{wp.init(n,e),nt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Im(n,t,i,r)});function Xv(n){let e=new At({check:"custom"});return e._zod.check=n,e}function qv(n,e){return om(Ho,n??(()=>!0),e)}function ng(n,e={}){return am(Ho,n,e)}function ig(n,e){return cm(n,e)}var Yv=lm,Jv=um;function jv(n,e={}){let t=new Ho({type:"custom",check:"custom",fn:i=>i instanceof n,abort:!0,...Ye.normalizeParams(e)});return t._zod.bag.Class=n,t._zod.check=i=>{i.value instanceof n||i.issues.push({code:"invalid_type",expected:n.name,input:i.value,inst:t,path:[...t._zod.def.path??[]]})},t}var Kv=(...n)=>hm({Codec:Bo,Boolean:_s,String:ms},...n);function Qv(n){let e=Q0(()=>Tl([Co(n),f0(),p0(),_0(),Uo(e),P0(Co(),e)]));return e}function ey(n,e){return new q0({type:"pipe",in:Rl(n),out:e})}var Pw={invalid_type:"invalid_type",too_big:"too_big",too_small:"too_small",invalid_format:"invalid_format",not_multiple_of:"not_multiple_of",unrecognized_keys:"unrecognized_keys",invalid_union:"invalid_union",invalid_key:"invalid_key",invalid_element:"invalid_element",invalid_value:"invalid_value",custom:"custom"};function Iw(n){Ot({customError:n})}function Nw(){return Ot().customError}var rg;rg||(rg={});var Se={...Ro,...el,iso:ds},Dw=new Set(["$schema","$ref","$defs","definitions","$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor","type","enum","const","anyOf","oneOf","allOf","not","properties","required","additionalProperties","patternProperties","propertyNames","minProperties","maxProperties","items","prefixItems","additionalItems","minItems","maxItems","uniqueItems","contains","minContains","maxContains","minLength","maxLength","pattern","format","minimum","maximum","exclusiveMinimum","exclusiveMaximum","multipleOf","description","default","contentEncoding","contentMediaType","contentSchema","unevaluatedItems","unevaluatedProperties","if","then","else","dependentSchemas","dependentRequired","nullable","readOnly"]);function zw(n,e){let t=n.$schema;return t==="https://json-schema.org/draft/2020-12/schema"?"draft-2020-12":t==="http://json-schema.org/draft-07/schema#"?"draft-7":t==="http://json-schema.org/draft-04/schema#"?"draft-4":e??"draft-2020-12"}function Lw(n,e){if(!n.startsWith("#"))throw new Error("External $ref is not supported, only local refs (#/...) are allowed");let t=n.slice(1).split("/").filter(Boolean);if(t.length===0)return e.rootSchema;let i=e.version==="draft-2020-12"?"$defs":"definitions";if(t[0]===i){let r=t[1];if(!r||!e.defs[r])throw new Error(`Reference not found: ${n}`);return e.defs[r]}throw new Error(`Reference not found: ${n}`)}function ty(n,e){if(n.not!==void 0){if(typeof n.not=="object"&&Object.keys(n.not).length===0)return Se.never();throw new Error("not is not supported in Zod (except { not: {} } for never)")}if(n.unevaluatedItems!==void 0)throw new Error("unevaluatedItems is not supported");if(n.unevaluatedProperties!==void 0)throw new Error("unevaluatedProperties is not supported");if(n.if!==void 0||n.then!==void 0||n.else!==void 0)throw new Error("Conditional schemas (if/then/else) are not supported");if(n.dependentSchemas!==void 0||n.dependentRequired!==void 0)throw new Error("dependentSchemas and dependentRequired are not supported");if(n.$ref){let r=n.$ref;if(e.refs.has(r))return e.refs.get(r);if(e.processing.has(r))return Se.lazy(()=>{if(!e.refs.has(r))throw new Error(`Circular reference not resolved: ${r}`);return e.refs.get(r)});e.processing.add(r);let s=Lw(r,e),o=Kt(s,e);return e.refs.set(r,o),e.processing.delete(r),o}if(n.enum!==void 0){let r=n.enum;if(e.version==="openapi-3.0"&&n.nullable===!0&&r.length===1&&r[0]===null)return Se.null();if(r.length===0)return Se.never();if(r.length===1)return Se.literal(r[0]);if(r.every(o=>typeof o=="string"))return Se.enum(r);let s=r.map(o=>Se.literal(o));return s.length<2?s[0]:Se.union([s[0],s[1],...s.slice(2)])}if(n.const!==void 0)return Se.literal(n.const);let t=n.type;if(Array.isArray(t)){let r=t.map(s=>{let o={...n,type:s};return ty(o,e)});return r.length===0?Se.never():r.length===1?r[0]:Se.union(r)}if(!t)return Se.any();let i;switch(t){case"string":{let r=Se.string();if(n.format){let s=n.format;s==="email"?r=r.check(Se.email()):s==="uri"||s==="uri-reference"?r=r.check(Se.url()):s==="uuid"||s==="guid"?r=r.check(Se.uuid()):s==="date-time"?r=r.check(Se.iso.datetime()):s==="date"?r=r.check(Se.iso.date()):s==="time"?r=r.check(Se.iso.time()):s==="duration"?r=r.check(Se.iso.duration()):s==="ipv4"?r=r.check(Se.ipv4()):s==="ipv6"?r=r.check(Se.ipv6()):s==="mac"?r=r.check(Se.mac()):s==="cidr"?r=r.check(Se.cidrv4()):s==="cidr-v6"?r=r.check(Se.cidrv6()):s==="base64"?r=r.check(Se.base64()):s==="base64url"?r=r.check(Se.base64url()):s==="e164"?r=r.check(Se.e164()):s==="jwt"?r=r.check(Se.jwt()):s==="emoji"?r=r.check(Se.emoji()):s==="nanoid"?r=r.check(Se.nanoid()):s==="cuid"?r=r.check(Se.cuid()):s==="cuid2"?r=r.check(Se.cuid2()):s==="ulid"?r=r.check(Se.ulid()):s==="xid"?r=r.check(Se.xid()):s==="ksuid"&&(r=r.check(Se.ksuid()))}typeof n.minLength=="number"&&(r=r.min(n.minLength)),typeof n.maxLength=="number"&&(r=r.max(n.maxLength)),n.pattern&&(r=r.regex(new RegExp(n.pattern))),i=r;break}case"number":case"integer":{let r=t==="integer"?Se.number().int():Se.number();typeof n.minimum=="number"&&(r=r.min(n.minimum)),typeof n.maximum=="number"&&(r=r.max(n.maximum)),typeof n.exclusiveMinimum=="number"?r=r.gt(n.exclusiveMinimum):n.exclusiveMinimum===!0&&typeof n.minimum=="number"&&(r=r.gt(n.minimum)),typeof n.exclusiveMaximum=="number"?r=r.lt(n.exclusiveMaximum):n.exclusiveMaximum===!0&&typeof n.maximum=="number"&&(r=r.lt(n.maximum)),typeof n.multipleOf=="number"&&(r=r.multipleOf(n.multipleOf)),i=r;break}case"boolean":{i=Se.boolean();break}case"null":{i=Se.null();break}case"object":{let r={},s=n.properties||{},o=new Set(n.required||[]);for(let[c,l]of Object.entries(s)){let u=Kt(l,e);r[c]=o.has(c)?u:u.optional()}if(n.propertyNames){let c=Kt(n.propertyNames,e),l=n.additionalProperties&&typeof n.additionalProperties=="object"?Kt(n.additionalProperties,e):Se.any();if(Object.keys(r).length===0){i=Se.record(c,l);break}let u=Se.object(r).passthrough(),d=Se.looseRecord(c,l);i=Se.intersection(u,d);break}if(n.patternProperties){let c=n.patternProperties,l=Object.keys(c),u=[];for(let h of l){let f=Kt(c[h],e),p=Se.string().regex(new RegExp(h));u.push(Se.looseRecord(p,f))}let d=[];if(Object.keys(r).length>0&&d.push(Se.object(r).passthrough()),d.push(...u),d.length===0)i=Se.object({}).passthrough();else if(d.length===1)i=d[0];else{let h=Se.intersection(d[0],d[1]);for(let f=2;f<d.length;f++)h=Se.intersection(h,d[f]);i=h}break}let a=Se.object(r);n.additionalProperties===!1?i=a.strict():typeof n.additionalProperties=="object"?i=a.catchall(Kt(n.additionalProperties,e)):i=a.passthrough();break}case"array":{let r=n.prefixItems,s=n.items;if(r&&Array.isArray(r)){let o=r.map(c=>Kt(c,e)),a=s&&typeof s=="object"&&!Array.isArray(s)?Kt(s,e):void 0;a?i=Se.tuple(o).rest(a):i=Se.tuple(o),typeof n.minItems=="number"&&(i=i.check(Se.minLength(n.minItems))),typeof n.maxItems=="number"&&(i=i.check(Se.maxLength(n.maxItems)))}else if(Array.isArray(s)){let o=s.map(c=>Kt(c,e)),a=n.additionalItems&&typeof n.additionalItems=="object"?Kt(n.additionalItems,e):void 0;a?i=Se.tuple(o).rest(a):i=Se.tuple(o),typeof n.minItems=="number"&&(i=i.check(Se.minLength(n.minItems))),typeof n.maxItems=="number"&&(i=i.check(Se.maxLength(n.maxItems)))}else if(s!==void 0){let o=Kt(s,e),a=Se.array(o);typeof n.minItems=="number"&&(a=a.min(n.minItems)),typeof n.maxItems=="number"&&(a=a.max(n.maxItems)),i=a}else i=Se.array(Se.any());break}default:throw new Error(`Unsupported type: ${t}`)}return i}function Kt(n,e){if(typeof n=="boolean")return n?Se.any():Se.never();let t=ty(n,e),i=n.type||n.enum!==void 0||n.const!==void 0;if(n.anyOf&&Array.isArray(n.anyOf)){let a=n.anyOf.map(l=>Kt(l,e)),c=Se.union(a);t=i?Se.intersection(t,c):c}if(n.oneOf&&Array.isArray(n.oneOf)){let a=n.oneOf.map(l=>Kt(l,e)),c=Se.xor(a);t=i?Se.intersection(t,c):c}if(n.allOf&&Array.isArray(n.allOf))if(n.allOf.length===0)t=i?t:Se.any();else{let a=i?t:Kt(n.allOf[0],e),c=i?0:1;for(let l=c;l<n.allOf.length;l++)a=Se.intersection(a,Kt(n.allOf[l],e));t=a}n.nullable===!0&&e.version==="openapi-3.0"&&(t=Se.nullable(t)),n.readOnly===!0&&(t=Se.readonly(t)),n.default!==void 0&&(t=t.default(n.default));let r={},s=["$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor"];for(let a of s)a in n&&(r[a]=n[a]);let o=["contentEncoding","contentMediaType","contentSchema"];for(let a of o)a in n&&(r[a]=n[a]);for(let a of Object.keys(n))Dw.has(a)||(r[a]=n[a]);return Object.keys(r).length>0&&e.registry.add(t,r),n.description&&(t=t.describe(n.description)),t}function ny(n,e){if(typeof n=="boolean")return n?Se.any():Se.never();let t;try{t=JSON.parse(JSON.stringify(n))}catch{throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas")}let i=zw(t,e?.defaultTarget),r=t.$defs||t.definitions||{},s={version:i,defs:r,refs:new Map,processing:new Set,rootSchema:t,registry:e?.registry??Xt};return Kt(t,s)}var sg={};ui(sg,{bigint:()=>kw,boolean:()=>Fw,date:()=>Bw,number:()=>Ow,string:()=>Uw});function Uw(n){return Rp(ms,n)}function Ow(n){return Up(xs,n)}function Fw(n){return Vp(_s,n)}function kw(n){return Wp(vs,n)}function Bw(n){return nm(Lo,n)}Ot(bc());var Hw=8,Gw=Ft.object({usedTokens:Ft.number().nonnegative(),capacityTokens:Ft.number().positive(),estimated:Ft.boolean()}).strict(),Vw=Ft.object({turnId:Ft.string().min(1),prompt:Ft.string().nullable(),status:Ft.enum(["running","completed","failed","interrupted"]),contextTokens:Ft.number(),baseline:Ft.boolean().optional()}).strict(),$w=Ft.object({usage:Gw.nullable(),compactions:Ft.number().int().nonnegative().nullable(),turns:Ft.array(Vw).max(Hw).optional()}).strict(),iy="compacted",ry=Ft.object({threadId:Ft.string().min(1),seq:Ft.number().int().nonnegative(),compactions:Ft.number().int().positive()}).strict(),hD={readThreadContext:{input:Ft.object({threadId:Ft.string().min(1).max(200)}).strict(),output:$w}};function Go(n){return n==null||!Number.isFinite(n)?0:Math.min(1,Math.max(0,n))}function sy(n,e){return e>0?Go(n/e):0}function Vo(n){return .3*60**Go(n)}function zi(n){return n>.3?Go(Math.log(n/.3)/Math.log(60)):0}function Il(n){return Math.max(0,Math.floor(Math.log2(Math.max(n,.3)/.3)))}function oy(n){let e=zi(n);return 5*(5e4/5)**e}function Li(n){if(n>=1e6){let e=n/1e6;return`${e>=10?Math.round(e):e.toFixed(1)}M`}return n>=1e3?`${Math.round(n/1e3)}k`:String(Math.round(n))}function ys(n){let e=2166136261;for(let t=0;t<n.length;t+=1)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}function In(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}var Nl={forward:0,turn:0},og=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);function ag(n){return n.forward===0&&n.turn===0}function ay(n){let e=(t,i)=>(n.has(t)?1:0)-(n.has(i)?1:0);return{forward:e("ArrowUp","ArrowDown"),turn:e("ArrowRight","ArrowLeft")}}var $o=.22727272727272727,cy=.18,Ww=.12,Zw=25,Xw={C:0,D:2,E:4,F:5,G:7,A:9,B:11};function Ui(n){let e=/^([A-G])(#?)(\d)$/.exec(n);return e?440*2**((Xw[e[1]]+(e[2]?1:0)+(Number(e[3])+1)*12-69)/12):0}var ly=["E5 G5 A5 G5 E5 - C5 D5","E5 - D5 C5 A4 - C5 -","F5 A5 C6 A5 G5 - F5 E5","D5 - E5 F5 G5 - - -","E5 G5 C6 B5 A5 G5 E5 G5","A5 - G5 E5 C5 - D5 E5","F5 E5 D5 F5 E5 D5 C5 D5","C5 - G4 - C5 - - -"].map(n=>n.split(" ")),qw=[["C4","E4","G4"],["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"],["C4","E4","G4"],["A3","C4","E4"],["D4","F4","A4"],["G3","B3","D4"]],Yw=["C2","A1","F2","G2","C2","A1","D2","G2"],Dl=class{context=null;master=null;musicBus=null;noise=null;scheduler=null;nextStepTime=0;step=0;musicOn=!1;muted;lastClack=0;constructor(e){this.muted=e}get isMuted(){return this.muted}unlock(){if(!(typeof AudioContext>"u")){if(!this.context){let e=new AudioContext;this.context=e,this.master=e.createGain(),this.master.gain.value=this.muted?0:.5,this.master.connect(e.destination),this.musicBus=e.createGain(),this.musicBus.gain.value=0,this.musicBus.connect(this.master),this.noise=e.createBuffer(1,e.sampleRate*2,e.sampleRate);let t=this.noise.getChannelData(0),i=0;for(let r=0;r<t.length;r+=1)i=(i+.02*(Math.random()*2-1))/1.02,t[r]=i*3.5}this.muted?this.context.suspend():this.context.state==="suspended"&&this.context.resume()}}setMuted(e){this.muted=e;let t=this.context;if(!(!t||!this.master)){if(this.master.gain.setTargetAtTime(e?0:.5,t.currentTime,.05),!e){t.resume();return}window.setTimeout(()=>{this.muted&&t.state==="running"&&t.suspend()},300)}}setRolling(e,t){let i=this.context;if(!i||!this.musicBus)return;let r=i.currentTime,s=e?Math.min(1,Math.max(0,t)):0;e&&s>.15&&r-this.lastClack>.09+(1-s)*.25&&(this.lastClack=r,Math.random()<.55&&this.clack(r)),e&&!this.musicOn&&this.startMusic(),!e&&this.musicOn&&this.stopMusic()}pickup(e){let t=this.context;if(!t||!this.master)return;let i=t.currentTime,r=1500-Math.min(1,e)*800;this.tone("sine",r,i,.12,.28,r*1.6),this.tone("triangle",r*1.5,i+.06,.16,.18,r*2)}gulp(e){let t=this.context;if(!t)return;let i=t.currentTime,r=Math.min(1,Math.max(0,e)),s=r<.25?1:r<.6?2:3;for(let o=0;o<s;o+=1){let a=i+o*.2,c=260-r*150-o*18;this.tone("sine",c,a,.16+r*.12,.22+r*.25,c*.35),this.noiseBurst(a,.1,.1+r*.18,"lowpass",900,200)}r>=.6&&(this.tone("sine",70,i,.7,.5,28),this.noiseBurst(i+.05,.45,.3,"bandpass",3e3,400),this.tone("sawtooth",90,i+s*.2,.35,.12,60))}coin(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("square",Ui("B5"),t,.06,.035),this.tone("square",Ui("E6"),t+.06,.18,.035)}bonk(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("sine",150,t,.18,.35,55),this.noiseBurst(t,.08,.2,"lowpass",600,300)}whoosh(){let e=this.context;e&&this.noiseBurst(e.currentTime,.55,.3,"bandpass",300,2400)}shed(){let e=this.context;if(!e)return;let t=e.currentTime;["G5","E5","C5","G4"].forEach((i,r)=>{this.tone("square",Ui(i),t+r*.07,.1,.1)})}pop(){let e=this.context;if(!e)return;let t=e.currentTime;this.noiseBurst(t,.3,.45,"bandpass",2400,180),this.tone("sine",110,t,.35,.45,38),["C6","E6","G6","C7"].forEach((i,r)=>{this.tone("triangle",Ui(i),t+.08+r*.06,.18,.16)}),this.tone("sine",1400,t+.35,.8,.12,260)}dispose(){this.scheduler!==null&&window.clearInterval(this.scheduler),this.scheduler=null,this.context?.close(),this.context=null}startMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!0,this.musicBus.gain.setTargetAtTime(.5,e.currentTime,.25),this.scheduler===null&&(this.nextStepTime=e.currentTime+.05,this.scheduler=window.setInterval(()=>this.schedule(),Zw)))}stopMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!1,this.musicBus.gain.setTargetAtTime(0,e.currentTime,.3),window.setTimeout(()=>{!this.musicOn&&this.scheduler!==null&&(window.clearInterval(this.scheduler),this.scheduler=null)},1500))}schedule(){let e=this.context;if(e)for(;this.nextStepTime<e.currentTime+Ww;){this.playStep(this.step,this.nextStepTime);let t=this.step%2===0?1+cy:1-cy;this.nextStepTime+=$o*t,this.step=(this.step+1)%(ly.length*8)}}playStep(e,t){let i=Math.floor(e/8),r=e%8,s=ly[i][r];s!=="-"&&(this.voice("square",Ui(s),t,$o*.9,.07,2400),this.voice("triangle",Ui(s)*2,t,$o*.5,.025,6e3));let o=Ui(Yw[i]);if(r%2===0){let a=r%4===0?o:o*2;this.voice("triangle",a,t,$o*.85,.22,900)}if(r%4===2)for(let a of qw[i])this.voice("sine",Ui(a),t,$o*.7,.05,3e3);r%4===0&&this.kick(t),r%4===2&&this.snare(t),this.hat(t,r%2===0?.035:.02)}voice(e,t,i,r,s,o){let a=this.context;if(!a||!this.musicBus)return;let c=a.createOscillator();c.type=e,c.frequency.value=t;let l=a.createBiquadFilter();l.type="lowpass",l.frequency.value=o;let u=a.createGain();u.gain.setValueAtTime(0,i),u.gain.linearRampToValueAtTime(s,i+.008),u.gain.exponentialRampToValueAtTime(1e-4,i+r),c.connect(l).connect(u).connect(this.musicBus),c.start(i),c.stop(i+r+.02)}kick(e){let t=this.context;if(!t||!this.musicBus)return;let i=t.createOscillator();i.frequency.setValueAtTime(140,e),i.frequency.exponentialRampToValueAtTime(45,e+.12);let r=t.createGain();r.gain.setValueAtTime(.35,e),r.gain.exponentialRampToValueAtTime(1e-4,e+.16),i.connect(r).connect(this.musicBus),i.start(e),i.stop(e+.2)}snare(e){this.noiseBurst(e,.12,.09,"bandpass",1800,1800,this.musicBus)}hat(e,t){this.noiseBurst(e,.04,t,"highpass",7e3,7e3,this.musicBus)}clack(e){let t=700+Math.random()*900;this.tone("square",t,e,.025,.03,t*.8)}tone(e,t,i,r,s,o=t){let a=this.context;if(!a||!this.master||a.state!=="running")return;let c=a.createOscillator();c.type=e,c.frequency.setValueAtTime(t,i),c.frequency.exponentialRampToValueAtTime(Math.max(20,o),i+r);let l=a.createGain();l.gain.setValueAtTime(s,i),l.gain.exponentialRampToValueAtTime(1e-4,i+r),c.connect(l).connect(this.master),c.start(i),c.stop(i+r+.02)}noiseBurst(e,t,i,r,s,o,a=this.master){let c=this.context;if(!c||!this.noise||!a||c.state!=="running")return;let l=c.createBufferSource();l.buffer=this.noise,l.playbackRate.value=4;let u=c.createBiquadFilter();u.type=r,u.frequency.setValueAtTime(s,e),u.frequency.exponentialRampToValueAtTime(o,e+t);let d=c.createGain();d.gain.setValueAtTime(i,e),d.gain.exponentialRampToValueAtTime(1e-4,e+t),l.connect(u).connect(d).connect(a),l.start(e,Math.random()),l.stop(e+t+.02)}};var Fy=0,Vg=1,ky=2;var Ra=1,By=2,Ys=3,Qi=0,Jt=1,zn=2,ai=0,Js=1,$g=2,Wg=3,Zg=4,Hy=5;var Pr=100,Gy=101,Vy=102,$y=103,Wy=104,Zy=200,Xy=201,qy=202,Yy=203,Xg=204,qg=205,Jy=206,jy=207,Ky=208,Qy=209,eb=210,tb=211,nb=212,ib=213,rb=214,iu=0,ru=1,su=2,Us=3,ou=4,au=5,cu=6,lu=7,Yg=0,sb=1,ob=2,Wn=0,Jg=1,jg=2,Kg=3,Qg=4,ex=5,tx=6,nx=7;var ix=300,er=301,Ir=302,Bu=303,Hu=304,Ca=306,uu=1e3,ii=1001,hu=1002,Dt=1003,ab=1004;var Pa=1005;var Yt=1006,Gu=1007;var tr=1008;var bn=1009,rx=1010,sx=1011,js=1012,Vu=1013,Zn=1014,Xn=1015,qn=1016,$u=1017,Wu=1018,Ks=1020,ox=35902,ax=35899,cx=1021,lx=1022,Ln=1023,ri=1026,nr=1027,Ia=1028,Zu=1029,ir=1030,Xu=1031;var qu=1033,Na=33776,Da=33777,za=33778,La=33779,Yu=35840,Ju=35841,ju=35842,Ku=35843,Qu=36196,eh=37492,th=37496,nh=37488,ih=37489,Ua=37490,rh=37491,sh=37808,oh=37809,ah=37810,ch=37811,lh=37812,uh=37813,hh=37814,dh=37815,fh=37816,ph=37817,mh=37818,gh=37819,xh=37820,_h=37821,vh=36492,yh=36494,bh=36495,Sh=36283,Mh=36284,Oa=36285,wh=36286;var ea=2300,du=2301,tu=2302,Ng=2303,Dg=2400,zg=2401,Lg=2402;var cb=3200;var Eh=0,lb=1,yi="",pn="srgb",ta="srgb-linear",na="linear",yt="srgb";var nu=7680;var ub=519,hb=512,db=513,fb=514,Th=515,pb=516,mb=517,Ah=518,gb=519,xb=35044;var ux="300 es",$n=2e3,Os=2001;function Jw(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function jw(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function ia(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function _b(){let n=ia("canvas");return n.style.display="block",n}var uy={},Fs=null;function hx(...n){let e="THREE."+n.shift();Fs?Fs("log",e,...n):console.log(e,...n)}function vb(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function qe(...n){n=vb(n);let e="THREE."+n.shift();if(Fs)Fs("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Je(...n){n=vb(n);let e="THREE."+n.shift();if(Fs)Fs("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Mr(...n){let e=n.join(" ");e in uy||(uy[e]=!0,qe(...n))}function yb(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var bb={[iu]:ru,[su]:cu,[ou]:lu,[Us]:au,[ru]:iu,[cu]:su,[lu]:ou,[au]:Us},si=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}},Qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],hy=1234567,Jo=Math.PI/180,ks=180/Math.PI;function Nr(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(Qt[n&255]+Qt[n>>8&255]+Qt[n>>16&255]+Qt[n>>24&255]+"-"+Qt[e&255]+Qt[e>>8&255]+"-"+Qt[e>>16&15|64]+Qt[e>>24&255]+"-"+Qt[t&63|128]+Qt[t>>8&255]+"-"+Qt[t>>16&255]+Qt[t>>24&255]+Qt[i&255]+Qt[i>>8&255]+Qt[i>>16&255]+Qt[i>>24&255]).toLowerCase()}function at(n,e,t){return Math.max(e,Math.min(t,n))}function dx(n,e){return(n%e+e)%e}function Kw(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function Qw(n,e,t){return n!==e?(t-n)/(e-n):0}function jo(n,e,t){return(1-t)*n+t*e}function e1(n,e,t,i){return jo(n,e,1-Math.exp(-t*i))}function t1(n,e=1){return e-Math.abs(dx(n,e*2)-e)}function n1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function i1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function r1(n,e){return n+Math.floor(Math.random()*(e-n+1))}function s1(n,e){return n+Math.random()*(e-n)}function o1(n){return n*(.5-Math.random())}function a1(n){n!==void 0&&(hy=n);let e=hy+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function c1(n){return n*Jo}function l1(n){return n*ks}function u1(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function h1(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function d1(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function f1(n,e,t,i,r){let s=Math.cos,o=Math.sin,a=s(t/2),c=o(t/2),l=s((e+i)/2),u=o((e+i)/2),d=s((e-i)/2),h=o((e-i)/2),f=s((i-e)/2),p=o((i-e)/2);switch(r){case"XYX":n.set(a*u,c*d,c*h,a*l);break;case"YZY":n.set(c*h,a*u,c*d,a*l);break;case"ZXZ":n.set(c*d,c*h,a*u,a*l);break;case"XZX":n.set(a*u,c*p,c*f,a*l);break;case"YXY":n.set(c*f,a*u,c*p,a*l);break;case"ZYZ":n.set(c*p,c*f,a*u,a*l);break;default:qe("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function zs(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function fn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Rn={DEG2RAD:Jo,RAD2DEG:ks,generateUUID:Nr,clamp:at,euclideanModulo:dx,mapLinear:Kw,inverseLerp:Qw,lerp:jo,damp:e1,pingpong:t1,smoothstep:n1,smootherstep:i1,randInt:r1,randFloat:s1,randFloatSpread:o1,seededRandom:a1,degToRad:c1,radToDeg:l1,isPowerOfTwo:u1,ceilPowerOfTwo:h1,floorPowerOfTwo:d1,setQuaternionFromProperEuler:f1,normalize:fn,denormalize:zs},fe=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(at(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},mn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let c=i[r+0],l=i[r+1],u=i[r+2],d=i[r+3],h=s[o+0],f=s[o+1],p=s[o+2],y=s[o+3];if(d!==y||c!==h||l!==f||u!==p){let g=c*h+l*f+u*p+d*y;g<0&&(h=-h,f=-f,p=-p,y=-y,g=-g);let m=1-a;if(g<.9995){let S=Math.acos(g),E=Math.sin(S);m=Math.sin(m*S)/E,a=Math.sin(a*S)/E,c=c*m+h*a,l=l*m+f*a,u=u*m+p*a,d=d*m+y*a}else{c=c*m+h*a,l=l*m+f*a,u=u*m+p*a,d=d*m+y*a;let S=1/Math.sqrt(c*c+l*l+u*u+d*d);c*=S,l*=S,u*=S,d*=S}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=d}static multiplyQuaternionsFlat(e,t,i,r,s,o){let a=i[r],c=i[r+1],l=i[r+2],u=i[r+3],d=s[o],h=s[o+1],f=s[o+2],p=s[o+3];return e[t]=a*p+u*d+c*f-l*h,e[t+1]=c*p+u*h+l*d-a*f,e[t+2]=l*p+u*f+a*h-c*d,e[t+3]=u*p-a*d-c*h-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(i/2),u=a(r/2),d=a(s/2),h=c(i/2),f=c(r/2),p=c(s/2);switch(o){case"XYZ":this._x=h*u*d+l*f*p,this._y=l*f*d-h*u*p,this._z=l*u*p+h*f*d,this._w=l*u*d-h*f*p;break;case"YXZ":this._x=h*u*d+l*f*p,this._y=l*f*d-h*u*p,this._z=l*u*p-h*f*d,this._w=l*u*d+h*f*p;break;case"ZXY":this._x=h*u*d-l*f*p,this._y=l*f*d+h*u*p,this._z=l*u*p+h*f*d,this._w=l*u*d-h*f*p;break;case"ZYX":this._x=h*u*d-l*f*p,this._y=l*f*d+h*u*p,this._z=l*u*p-h*f*d,this._w=l*u*d+h*f*p;break;case"YZX":this._x=h*u*d+l*f*p,this._y=l*f*d+h*u*p,this._z=l*u*p-h*f*d,this._w=l*u*d-h*f*p;break;case"XZY":this._x=h*u*d-l*f*p,this._y=l*f*d-h*u*p,this._z=l*u*p+h*f*d,this._w=l*u*d+h*f*p;break;default:qe("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],d=t[10],h=i+a+d;if(h>0){let f=.5/Math.sqrt(h+1);this._w=.25/f,this._x=(u-c)*f,this._y=(s-l)*f,this._z=(o-r)*f}else if(i>a&&i>d){let f=2*Math.sqrt(1+i-a-d);this._w=(u-c)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(s+l)/f}else if(a>d){let f=2*Math.sqrt(1+a-i-d);this._w=(s-l)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+d-i-a);this._w=(o-r)/f,this._x=(s+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(at(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=i*u+o*a+r*l-s*c,this._y=r*u+o*c+s*a-i*l,this._z=s*u+o*l+i*c-r*a,this._w=o*u-i*a-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,s=-s,o=-o,a=-a);let c=1-t;if(a<.9995){let l=Math.acos(a),u=Math.sin(l);c=Math.sin(c*l)/u,t=Math.sin(t*l)/u,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+o*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},I=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(dy.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(dy.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*r-a*i),u=2*(a*t-s*r),d=2*(s*i-o*t);return this.x=t+c*l+o*d-a*u,this.y=i+c*u+a*l-s*d,this.z=r+c*d+s*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,c=t.z;return this.x=r*c-s*a,this.y=s*o-i*c,this.z=i*a-r*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return cg.copy(this).projectOnVector(e),this.sub(cg)}reflect(e){return this.sub(cg.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(at(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},cg=new I,dy=new mn,Qe=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l)}set(e,t,i,r,s,o,a,c,l){let u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=c,u[6]=i,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],u=i[4],d=i[7],h=i[2],f=i[5],p=i[8],y=r[0],g=r[3],m=r[6],S=r[1],E=r[4],v=r[7],M=r[2],w=r[5],C=r[8];return s[0]=o*y+a*S+c*M,s[3]=o*g+a*E+c*w,s[6]=o*m+a*v+c*C,s[1]=l*y+u*S+d*M,s[4]=l*g+u*E+d*w,s[7]=l*m+u*v+d*C,s[2]=h*y+f*S+p*M,s[5]=h*g+f*E+p*w,s[8]=h*m+f*v+p*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-i*s*u+i*a*c+r*s*l-r*o*c}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],d=u*o-a*l,h=a*c-u*s,f=l*s-o*c,p=t*d+i*h+r*f;if(p===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/p;return e[0]=d*y,e[1]=(r*l-u*i)*y,e[2]=(a*i-r*o)*y,e[3]=h*y,e[4]=(u*t-r*c)*y,e[5]=(r*s-a*t)*y,e[6]=f*y,e[7]=(i*c-l*t)*y,e[8]=(o*t-i*s)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){let c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*o+l*a)+o+e,-r*l,r*c,-r*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return Mr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(lg.makeScale(e,t)),this}rotate(e){return Mr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(lg.makeRotation(-e)),this}translate(e,t){return Mr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(lg.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},lg=new Qe,fy=new Qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),py=new Qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function p1(){let n={enabled:!0,workingColorSpace:ta,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===yt&&(r.r=vi(r.r),r.g=vi(r.g),r.b=vi(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===yt&&(r.r=Ls(r.r),r.g=Ls(r.g),r.b=Ls(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===yi?na:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Mr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Mr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[ta]:{primaries:e,whitePoint:i,transfer:na,toXYZ:fy,fromXYZ:py,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:pn},outputColorSpaceConfig:{drawingBufferColorSpace:pn}},[pn]:{primaries:e,whitePoint:i,transfer:yt,toXYZ:fy,fromXYZ:py,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:pn}}}),n}var ut=p1();function vi(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Ls(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var bs,fu=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{bs===void 0&&(bs=ia("canvas")),bs.width=e.width,bs.height=e.height;let r=bs.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=bs}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ia("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=vi(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(vi(t[i]/255)*255):t[i]=vi(t[i]);return{data:t,width:e.width,height:e.height}}else return qe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},m1=0,Bs=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:m1++}),this.uuid=Nr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(ug(r[o].image)):s.push(ug(r[o]))}else s=ug(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function ug(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?fu.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(qe("Texture: Unable to serialize Texture."),{})}var g1=0,hg=new I,vn=class n extends si{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=ii,r=ii,s=Yt,o=tr,a=Ln,c=bn,l=n.DEFAULT_ANISOTROPY,u=yi){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:g1++}),this.uuid=Nr(),this.name="",this.source=new Bs(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new fe(0,0),this.repeat=new fe(1,1),this.center=new fe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(hg).x}get height(){return this.source.getSize(hg).y}get depth(){return this.source.getSize(hg).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){qe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){qe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ix)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case uu:e.x=e.x-Math.floor(e.x);break;case ii:e.x=e.x<0?0:1;break;case hu:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case uu:e.y=e.y-Math.floor(e.y);break;case ii:e.y=e.y<0?0:1;break;case hu:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};vn.DEFAULT_IMAGE=null;vn.DEFAULT_MAPPING=ix;vn.DEFAULT_ANISOTROPY=1;var zt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,c=e.elements,l=c[0],u=c[4],d=c[8],h=c[1],f=c[5],p=c[9],y=c[2],g=c[6],m=c[10];if(Math.abs(u-h)<.01&&Math.abs(d-y)<.01&&Math.abs(p-g)<.01){if(Math.abs(u+h)<.1&&Math.abs(d+y)<.1&&Math.abs(p+g)<.1&&Math.abs(l+f+m-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(l+1)/2,v=(f+1)/2,M=(m+1)/2,w=(u+h)/4,C=(d+y)/4,_=(p+g)/4;return E>v&&E>M?E<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(E),r=w/i,s=C/i):v>M?v<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(v),i=w/r,s=_/r):M<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(M),i=C/s,r=_/s),this.set(i,r,s,t),this}let S=Math.sqrt((g-p)*(g-p)+(d-y)*(d-y)+(h-u)*(h-u));return Math.abs(S)<.001&&(S=1),this.x=(g-p)/S,this.y=(d-y)/S,this.z=(h-u)/S,this.w=Math.acos((l+f+m-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this.w=at(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this.w=at(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},pu=class extends si{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Yt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new zt(0,0,e,t),this.scissorTest=!1,this.viewport=new zt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new vn(r),o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:Yt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new Bs(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},nn=class extends pu{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},ra=class extends vn{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var mu=class extends vn{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Dt,this.minFilter=Dt,this.wrapR=ii,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var Pt=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,o,a,c,l,u,d,h,f,p,y,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l,u,d,h,f,p,y,g)}set(e,t,i,r,s,o,a,c,l,u,d,h,f,p,y,g){let m=this.elements;return m[0]=e,m[4]=t,m[8]=i,m[12]=r,m[1]=s,m[5]=o,m[9]=a,m[13]=c,m[2]=l,m[6]=u,m[10]=d,m[14]=h,m[3]=f,m[7]=p,m[11]=y,m[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Ss.setFromMatrixColumn(e,0).length(),s=1/Ss.setFromMatrixColumn(e,1).length(),o=1/Ss.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),u=Math.cos(s),d=Math.sin(s);if(e.order==="XYZ"){let h=o*u,f=o*d,p=a*u,y=a*d;t[0]=c*u,t[4]=-c*d,t[8]=l,t[1]=f+p*l,t[5]=h-y*l,t[9]=-a*c,t[2]=y-h*l,t[6]=p+f*l,t[10]=o*c}else if(e.order==="YXZ"){let h=c*u,f=c*d,p=l*u,y=l*d;t[0]=h+y*a,t[4]=p*a-f,t[8]=o*l,t[1]=o*d,t[5]=o*u,t[9]=-a,t[2]=f*a-p,t[6]=y+h*a,t[10]=o*c}else if(e.order==="ZXY"){let h=c*u,f=c*d,p=l*u,y=l*d;t[0]=h-y*a,t[4]=-o*d,t[8]=p+f*a,t[1]=f+p*a,t[5]=o*u,t[9]=y-h*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let h=o*u,f=o*d,p=a*u,y=a*d;t[0]=c*u,t[4]=p*l-f,t[8]=h*l+y,t[1]=c*d,t[5]=y*l+h,t[9]=f*l-p,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let h=o*c,f=o*l,p=a*c,y=a*l;t[0]=c*u,t[4]=y-h*d,t[8]=p*d+f,t[1]=d,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*d+p,t[10]=h-y*d}else if(e.order==="XZY"){let h=o*c,f=o*l,p=a*c,y=a*l;t[0]=c*u,t[4]=-d,t[8]=l*u,t[1]=h*d+y,t[5]=o*u,t[9]=f*d-p,t[2]=p*d-f,t[6]=a*u,t[10]=y*d+h}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(x1,e,_1)}lookAt(e,t,i){let r=this.elements;return wn.subVectors(e,t),wn.lengthSq()===0&&(wn.z=1),wn.normalize(),Oi.crossVectors(i,wn),Oi.lengthSq()===0&&(Math.abs(i.z)===1?wn.x+=1e-4:wn.z+=1e-4,wn.normalize(),Oi.crossVectors(i,wn)),Oi.normalize(),zl.crossVectors(wn,Oi),r[0]=Oi.x,r[4]=zl.x,r[8]=wn.x,r[1]=Oi.y,r[5]=zl.y,r[9]=wn.y,r[2]=Oi.z,r[6]=zl.z,r[10]=wn.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],u=i[1],d=i[5],h=i[9],f=i[13],p=i[2],y=i[6],g=i[10],m=i[14],S=i[3],E=i[7],v=i[11],M=i[15],w=r[0],C=r[4],_=r[8],T=r[12],P=r[1],D=r[5],k=r[9],V=r[13],z=r[2],B=r[6],Z=r[10],q=r[14],oe=r[3],Y=r[7],te=r[11],ie=r[15];return s[0]=o*w+a*P+c*z+l*oe,s[4]=o*C+a*D+c*B+l*Y,s[8]=o*_+a*k+c*Z+l*te,s[12]=o*T+a*V+c*q+l*ie,s[1]=u*w+d*P+h*z+f*oe,s[5]=u*C+d*D+h*B+f*Y,s[9]=u*_+d*k+h*Z+f*te,s[13]=u*T+d*V+h*q+f*ie,s[2]=p*w+y*P+g*z+m*oe,s[6]=p*C+y*D+g*B+m*Y,s[10]=p*_+y*k+g*Z+m*te,s[14]=p*T+y*V+g*q+m*ie,s[3]=S*w+E*P+v*z+M*oe,s[7]=S*C+E*D+v*B+M*Y,s[11]=S*_+E*k+v*Z+M*te,s[15]=S*T+E*V+v*q+M*ie,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],d=e[6],h=e[10],f=e[14],p=e[3],y=e[7],g=e[11],m=e[15],S=c*f-l*h,E=a*f-l*d,v=a*h-c*d,M=o*f-l*u,w=o*h-c*u,C=o*d-a*u;return t*(y*S-g*E+m*v)-i*(p*S-g*M+m*w)+r*(p*E-y*M+m*C)-s*(p*v-y*w+g*C)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],o=e[5],a=e[9],c=e[2],l=e[6],u=e[10];return t*(o*u-a*l)-i*(s*u-a*c)+r*(s*l-o*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],d=e[9],h=e[10],f=e[11],p=e[12],y=e[13],g=e[14],m=e[15],S=t*a-i*o,E=t*c-r*o,v=t*l-s*o,M=i*c-r*a,w=i*l-s*a,C=r*l-s*c,_=u*y-d*p,T=u*g-h*p,P=u*m-f*p,D=d*g-h*y,k=d*m-f*y,V=h*m-f*g,z=S*V-E*k+v*D+M*P-w*T+C*_;if(z===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let B=1/z;return e[0]=(a*V-c*k+l*D)*B,e[1]=(r*k-i*V-s*D)*B,e[2]=(y*C-g*w+m*M)*B,e[3]=(h*w-d*C-f*M)*B,e[4]=(c*P-o*V-l*T)*B,e[5]=(t*V-r*P+s*T)*B,e[6]=(g*v-p*C-m*E)*B,e[7]=(u*C-h*v+f*E)*B,e[8]=(o*k-a*P+l*_)*B,e[9]=(i*P-t*k-s*_)*B,e[10]=(p*w-y*v+m*S)*B,e[11]=(d*v-u*w-f*S)*B,e[12]=(a*T-o*D-c*_)*B,e[13]=(t*D-i*T+r*_)*B,e[14]=(y*E-p*M-g*S)*B,e[15]=(u*M-d*E+h*S)*B,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,c=e.z,l=s*o,u=s*a;return this.set(l*o+i,l*a-r*c,l*c+r*a,0,l*a+r*c,u*a+i,u*c-r*o,0,l*c-r*a,u*c+r*o,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,o=t._y,a=t._z,c=t._w,l=s+s,u=o+o,d=a+a,h=s*l,f=s*u,p=s*d,y=o*u,g=o*d,m=a*d,S=c*l,E=c*u,v=c*d,M=i.x,w=i.y,C=i.z;return r[0]=(1-(y+m))*M,r[1]=(f+v)*M,r[2]=(p-E)*M,r[3]=0,r[4]=(f-v)*w,r[5]=(1-(h+m))*w,r[6]=(g+S)*w,r[7]=0,r[8]=(p+E)*C,r[9]=(g-S)*C,r[10]=(1-(h+y))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let o=Ss.set(r[0],r[1],r[2]).length(),a=Ss.set(r[4],r[5],r[6]).length(),c=Ss.set(r[8],r[9],r[10]).length();s<0&&(o=-o),Bn.copy(this);let l=1/o,u=1/a,d=1/c;return Bn.elements[0]*=l,Bn.elements[1]*=l,Bn.elements[2]*=l,Bn.elements[4]*=u,Bn.elements[5]*=u,Bn.elements[6]*=u,Bn.elements[8]*=d,Bn.elements[9]*=d,Bn.elements[10]*=d,t.setFromRotationMatrix(Bn),i.x=o,i.y=a,i.z=c,this}makePerspective(e,t,i,r,s,o,a=$n,c=!1){let l=this.elements,u=2*s/(t-e),d=2*s/(i-r),h=(t+e)/(t-e),f=(i+r)/(i-r),p,y;if(c)p=s/(o-s),y=o*s/(o-s);else if(a===$n)p=-(o+s)/(o-s),y=-2*o*s/(o-s);else if(a===Os)p=-o/(o-s),y=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=h,l[12]=0,l[1]=0,l[5]=d,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=p,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=$n,c=!1){let l=this.elements,u=2/(t-e),d=2/(i-r),h=-(t+e)/(t-e),f=-(i+r)/(i-r),p,y;if(c)p=1/(o-s),y=o/(o-s);else if(a===$n)p=-2/(o-s),y=-(o+s)/(o-s);else if(a===Os)p=-1/(o-s),y=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=h,l[1]=0,l[5]=d,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=p,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Ss=new I,Bn=new Pt,x1=new I(0,0,0),_1=new I(1,1,1),Oi=new I,zl=new I,wn=new I,my=new Pt,gy=new mn,Dn=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],u=r[9],d=r[2],h=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(at(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(h,l),this._z=0);break;case"YXZ":this._x=Math.asin(-at(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,s),this._z=0);break;case"ZXY":this._x=Math.asin(at(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(-d,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-at(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(h,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(at(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-d,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-at(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(h,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,f),this._y=0);break;default:qe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return my.makeRotationFromQuaternion(e),this.setFromRotationMatrix(my,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return gy.setFromEuler(this),this.setFromQuaternion(gy,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Dn.DEFAULT_ORDER="XYZ";var sa=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},v1=0,xy=new I,Ms=new mn,pi=new Pt,Ll=new I,Wo=new I,y1=new I,b1=new mn,_y=new I(1,0,0),vy=new I(0,1,0),yy=new I(0,0,1),by={type:"added"},S1={type:"removed"},ws={type:"childadded",child:null},dg={type:"childremoved",child:null},rn=class n extends si{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:v1++}),this.uuid=Nr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new I,t=new Dn,i=new mn,r=new I(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new Pt},normalMatrix:{value:new Qe}}),this.matrix=new Pt,this.matrixWorld=new Pt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new sa,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Ms.setFromAxisAngle(e,t),this.quaternion.multiply(Ms),this}rotateOnWorldAxis(e,t){return Ms.setFromAxisAngle(e,t),this.quaternion.premultiply(Ms),this}rotateX(e){return this.rotateOnAxis(_y,e)}rotateY(e){return this.rotateOnAxis(vy,e)}rotateZ(e){return this.rotateOnAxis(yy,e)}translateOnAxis(e,t){return xy.copy(e).applyQuaternion(this.quaternion),this.position.add(xy.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(_y,e)}translateY(e){return this.translateOnAxis(vy,e)}translateZ(e){return this.translateOnAxis(yy,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(pi.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?Ll.copy(e):Ll.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),Wo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?pi.lookAt(Wo,Ll,this.up):pi.lookAt(Ll,Wo,this.up),this.quaternion.setFromRotationMatrix(pi),r&&(pi.extractRotation(r.matrixWorld),Ms.setFromRotationMatrix(pi),this.quaternion.premultiply(Ms.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Je("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(by),ws.child=e,this.dispatchEvent(ws),ws.child=null):Je("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(S1),dg.child=e,this.dispatchEvent(dg),dg.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),pi.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),pi.multiply(e.parent.matrixWorld)),e.applyMatrix4(pi),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(by),ws.child=e,this.dispatchEvent(ws),ws.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wo,e,y1),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Wo,b1,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){let d=c[l];s(e.shapes,d)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(e.materials,this.material[c]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];r.animations.push(s(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),d=o(e.shapes),h=o(e.skeletons),f=o(e.animations),p=o(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),u.length>0&&(i.images=u),d.length>0&&(i.shapes=d),h.length>0&&(i.skeletons=h),f.length>0&&(i.animations=f),p.length>0&&(i.nodes=p)}return i.object=r,i;function o(a){let c=[];for(let l in a){let u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};rn.DEFAULT_UP=new I(0,1,0);rn.DEFAULT_MATRIX_AUTO_UPDATE=!0;rn.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ce=class extends rn{constructor(){super(),this.isGroup=!0,this.type="Group"}},M1={type:"move"},Hs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ce,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ce,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ce,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let y of e.hand.values()){let g=t.getJointPose(y,i),m=this._getHandJoint(l,y);g!==null&&(m.matrix.fromArray(g.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=g.radius),m.visible=g!==null}let u=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],h=u.position.distanceTo(d.position),f=.02,p=.005;l.inputState.pinching&&h>f+p?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&h<=f-p&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(M1)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ce;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},Sb={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Fi={h:0,s:0,l:0},Ul={h:0,s:0,l:0};function fg(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Ue=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=pn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ut.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=ut.workingColorSpace){return this.r=e,this.g=t,this.b=i,ut.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=ut.workingColorSpace){if(e=dx(e,1),t=at(t,0,1),i=at(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=fg(o,s,e+1/3),this.g=fg(o,s,e),this.b=fg(o,s,e-1/3)}return ut.colorSpaceToWorking(this,r),this}setStyle(e,t=pn){function i(s){s!==void 0&&parseFloat(s)<1&&qe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:qe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);qe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=pn){let i=Sb[e.toLowerCase()];return i!==void 0?this.setHex(i,t):qe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=vi(e.r),this.g=vi(e.g),this.b=vi(e.b),this}copyLinearToSRGB(e){return this.r=Ls(e.r),this.g=Ls(e.g),this.b=Ls(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=pn){return ut.workingToColorSpace(en.copy(this),e),Math.round(at(en.r*255,0,255))*65536+Math.round(at(en.g*255,0,255))*256+Math.round(at(en.b*255,0,255))}getHexString(e=pn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ut.workingColorSpace){ut.workingToColorSpace(en.copy(this),t);let i=en.r,r=en.g,s=en.b,o=Math.max(i,r,s),a=Math.min(i,r,s),c,l,u=(a+o)/2;if(a===o)c=0,l=0;else{let d=o-a;switch(l=u<=.5?d/(o+a):d/(2-o-a),o){case i:c=(r-s)/d+(r<s?6:0);break;case r:c=(s-i)/d+2;break;case s:c=(i-r)/d+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=ut.workingColorSpace){return ut.workingToColorSpace(en.copy(this),t),e.r=en.r,e.g=en.g,e.b=en.b,e}getStyle(e=pn){ut.workingToColorSpace(en.copy(this),e);let t=en.r,i=en.g,r=en.b;return e!==pn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(Fi),this.setHSL(Fi.h+e,Fi.s+t,Fi.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(Fi),e.getHSL(Ul);let i=jo(Fi.h,Ul.h,t),r=jo(Fi.s,Ul.s,t),s=jo(Fi.l,Ul.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},en=new Ue;Ue.NAMES=Sb;var oa=class n{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Ue(e),this.near=t,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Gs=class extends rn{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Dn,this.environmentIntensity=1,this.environmentRotation=new Dn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Hn=new I,mi=new I,pg=new I,gi=new I,Es=new I,Ts=new I,Sy=new I,mg=new I,gg=new I,xg=new I,_g=new zt,vg=new zt,yg=new zt,Gi=class n{constructor(e=new I,t=new I,i=new I){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Hn.subVectors(e,t),r.cross(Hn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Hn.subVectors(r,t),mi.subVectors(i,t),pg.subVectors(e,t);let o=Hn.dot(Hn),a=Hn.dot(mi),c=Hn.dot(pg),l=mi.dot(mi),u=mi.dot(pg),d=o*l-a*a;if(d===0)return s.set(0,0,0),null;let h=1/d,f=(l*c-a*u)*h,p=(o*u-a*c)*h;return s.set(1-f-p,p,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,gi)===null?!1:gi.x>=0&&gi.y>=0&&gi.x+gi.y<=1}static getInterpolation(e,t,i,r,s,o,a,c){return this.getBarycoord(e,t,i,r,gi)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,gi.x),c.addScaledVector(o,gi.y),c.addScaledVector(a,gi.z),c)}static getInterpolatedAttribute(e,t,i,r,s,o){return _g.setScalar(0),vg.setScalar(0),yg.setScalar(0),_g.fromBufferAttribute(e,t),vg.fromBufferAttribute(e,i),yg.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(_g,s.x),o.addScaledVector(vg,s.y),o.addScaledVector(yg,s.z),o}static isFrontFacing(e,t,i,r){return Hn.subVectors(i,t),mi.subVectors(e,t),Hn.cross(mi).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Hn.subVectors(this.c,this.b),mi.subVectors(this.a,this.b),Hn.cross(mi).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,o,a;Es.subVectors(r,i),Ts.subVectors(s,i),mg.subVectors(e,i);let c=Es.dot(mg),l=Ts.dot(mg);if(c<=0&&l<=0)return t.copy(i);gg.subVectors(e,r);let u=Es.dot(gg),d=Ts.dot(gg);if(u>=0&&d<=u)return t.copy(r);let h=c*d-u*l;if(h<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(i).addScaledVector(Es,o);xg.subVectors(e,s);let f=Es.dot(xg),p=Ts.dot(xg);if(p>=0&&f<=p)return t.copy(s);let y=f*l-c*p;if(y<=0&&l>=0&&p<=0)return a=l/(l-p),t.copy(i).addScaledVector(Ts,a);let g=u*p-f*d;if(g<=0&&d-u>=0&&f-p>=0)return Sy.subVectors(s,r),a=(d-u)/(d-u+(f-p)),t.copy(r).addScaledVector(Sy,a);let m=1/(g+y+h);return o=y*m,a=h*m,t.copy(i).addScaledVector(Es,o).addScaledVector(Ts,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},oi=class{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Gn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Gn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Gn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Gn):Gn.fromBufferAttribute(s,o),Gn.applyMatrix4(e.matrixWorld),this.expandByPoint(Gn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),Ol.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),Ol.copy(i.boundingBox)),Ol.applyMatrix4(e.matrixWorld),this.union(Ol)}let r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Gn),Gn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Zo),Fl.subVectors(this.max,Zo),As.subVectors(e.a,Zo),Rs.subVectors(e.b,Zo),Cs.subVectors(e.c,Zo),ki.subVectors(Rs,As),Bi.subVectors(Cs,Rs),_r.subVectors(As,Cs);let t=[0,-ki.z,ki.y,0,-Bi.z,Bi.y,0,-_r.z,_r.y,ki.z,0,-ki.x,Bi.z,0,-Bi.x,_r.z,0,-_r.x,-ki.y,ki.x,0,-Bi.y,Bi.x,0,-_r.y,_r.x,0];return!bg(t,As,Rs,Cs,Fl)||(t=[1,0,0,0,1,0,0,0,1],!bg(t,As,Rs,Cs,Fl))?!1:(kl.crossVectors(ki,Bi),t=[kl.x,kl.y,kl.z],bg(t,As,Rs,Cs,Fl))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Gn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Gn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(xi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),xi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),xi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),xi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),xi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),xi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),xi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),xi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(xi),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},xi=[new I,new I,new I,new I,new I,new I,new I,new I],Gn=new I,Ol=new oi,As=new I,Rs=new I,Cs=new I,ki=new I,Bi=new I,_r=new I,Zo=new I,Fl=new I,kl=new I,vr=new I;function bg(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){vr.fromArray(n,s);let a=r.x*Math.abs(vr.x)+r.y*Math.abs(vr.y)+r.z*Math.abs(vr.z),c=e.dot(vr),l=t.dot(vr),u=i.dot(vr);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var Ht=new I,Bl=new fe,w1=0,tn=class extends si{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:w1++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=xb,this.updateRanges=[],this.gpuType=Xn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)Bl.fromBufferAttribute(this,t),Bl.applyMatrix3(e),this.setXY(t,Bl.x,Bl.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyMatrix3(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyMatrix4(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.applyNormalMatrix(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Ht.fromBufferAttribute(this,t),Ht.transformDirection(e),this.setXYZ(t,Ht.x,Ht.y,Ht.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=zs(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=fn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=zs(t,this.array)),t}setX(e,t){return this.normalized&&(t=fn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=zs(t,this.array)),t}setY(e,t){return this.normalized&&(t=fn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=zs(t,this.array)),t}setZ(e,t){return this.normalized&&(t=fn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=zs(t,this.array)),t}setW(e,t){return this.normalized&&(t=fn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=fn(t,this.array),i=fn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=fn(t,this.array),i=fn(i,this.array),r=fn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=fn(t,this.array),i=fn(i,this.array),r=fn(r,this.array),s=fn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var aa=class extends tn{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var ca=class extends tn{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var pt=class extends tn{constructor(e,t,i){super(new Float32Array(e),t,i)}},E1=new oi,Xo=new I,Sg=new I,Vs=class{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):E1.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Xo.subVectors(e,this.center);let t=Xo.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(Xo,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Sg.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Xo.copy(e.center).add(Sg)),this.expandByPoint(Xo.copy(e.center).sub(Sg))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},T1=0,Nn=new Pt,Mg=new rn,Ps=new I,En=new oi,qo=new oi,Zt=new I,Vt=class n extends si{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:T1++}),this.uuid=Nr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Jw(e)?ca:aa)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Qe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return Nn.makeRotationFromQuaternion(e),this.applyMatrix4(Nn),this}rotateX(e){return Nn.makeRotationX(e),this.applyMatrix4(Nn),this}rotateY(e){return Nn.makeRotationY(e),this.applyMatrix4(Nn),this}rotateZ(e){return Nn.makeRotationZ(e),this.applyMatrix4(Nn),this}translate(e,t,i){return Nn.makeTranslation(e,t,i),this.applyMatrix4(Nn),this}scale(e,t,i){return Nn.makeScale(e,t,i),this.applyMatrix4(Nn),this}lookAt(e){return Mg.lookAt(e),Mg.updateMatrix(),this.applyMatrix4(Mg.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ps).negate(),this.translate(Ps.x,Ps.y,Ps.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new pt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&qe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new oi);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];En.setFromBufferAttribute(s),this.morphTargetsRelative?(Zt.addVectors(this.boundingBox.min,En.min),this.boundingBox.expandByPoint(Zt),Zt.addVectors(this.boundingBox.max,En.max),this.boundingBox.expandByPoint(Zt)):(this.boundingBox.expandByPoint(En.min),this.boundingBox.expandByPoint(En.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Je('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Vs);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){let i=this.boundingSphere.center;if(En.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){let a=t[s];qo.setFromBufferAttribute(a),this.morphTargetsRelative?(Zt.addVectors(En.min,qo.min),En.expandByPoint(Zt),Zt.addVectors(En.max,qo.max),En.expandByPoint(Zt)):(En.expandByPoint(qo.min),En.expandByPoint(qo.max))}En.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)Zt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(Zt));if(t)for(let s=0,o=t.length;s<o;s++){let a=t[s],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)Zt.fromBufferAttribute(a,l),c&&(Ps.fromBufferAttribute(e,l),Zt.add(Ps)),r=Math.max(r,i.distanceToSquared(Zt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Je('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Je("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new tn(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],c=[];for(let _=0;_<i.count;_++)a[_]=new I,c[_]=new I;let l=new I,u=new I,d=new I,h=new fe,f=new fe,p=new fe,y=new I,g=new I;function m(_,T,P){l.fromBufferAttribute(i,_),u.fromBufferAttribute(i,T),d.fromBufferAttribute(i,P),h.fromBufferAttribute(s,_),f.fromBufferAttribute(s,T),p.fromBufferAttribute(s,P),u.sub(l),d.sub(l),f.sub(h),p.sub(h);let D=1/(f.x*p.y-p.x*f.y);isFinite(D)&&(y.copy(u).multiplyScalar(p.y).addScaledVector(d,-f.y).multiplyScalar(D),g.copy(d).multiplyScalar(f.x).addScaledVector(u,-p.x).multiplyScalar(D),a[_].add(y),a[T].add(y),a[P].add(y),c[_].add(g),c[T].add(g),c[P].add(g))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let _=0,T=S.length;_<T;++_){let P=S[_],D=P.start,k=P.count;for(let V=D,z=D+k;V<z;V+=3)m(e.getX(V+0),e.getX(V+1),e.getX(V+2))}let E=new I,v=new I,M=new I,w=new I;function C(_){M.fromBufferAttribute(r,_),w.copy(M);let T=a[_];E.copy(T),E.sub(M.multiplyScalar(M.dot(T))).normalize(),v.crossVectors(w,T);let D=v.dot(c[_])<0?-1:1;o.setXYZW(_,E.x,E.y,E.z,D)}for(let _=0,T=S.length;_<T;++_){let P=S[_],D=P.start,k=P.count;for(let V=D,z=D+k;V<z;V+=3)C(e.getX(V+0)),C(e.getX(V+1)),C(e.getX(V+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new tn(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let h=0,f=i.count;h<f;h++)i.setXYZ(h,0,0,0);let r=new I,s=new I,o=new I,a=new I,c=new I,l=new I,u=new I,d=new I;if(e)for(let h=0,f=e.count;h<f;h+=3){let p=e.getX(h+0),y=e.getX(h+1),g=e.getX(h+2);r.fromBufferAttribute(t,p),s.fromBufferAttribute(t,y),o.fromBufferAttribute(t,g),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),a.fromBufferAttribute(i,p),c.fromBufferAttribute(i,y),l.fromBufferAttribute(i,g),a.add(u),c.add(u),l.add(u),i.setXYZ(p,a.x,a.y,a.z),i.setXYZ(y,c.x,c.y,c.z),i.setXYZ(g,l.x,l.y,l.z)}else for(let h=0,f=t.count;h<f;h+=3)r.fromBufferAttribute(t,h+0),s.fromBufferAttribute(t,h+1),o.fromBufferAttribute(t,h+2),u.subVectors(o,s),d.subVectors(r,s),u.cross(d),i.setXYZ(h+0,u.x,u.y,u.z),i.setXYZ(h+1,u.x,u.y,u.z),i.setXYZ(h+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)Zt.fromBufferAttribute(e,t),Zt.normalize(),e.setXYZ(t,Zt.x,Zt.y,Zt.z)}toNonIndexed(){function e(a,c){let l=a.array,u=a.itemSize,d=a.normalized,h=new l.constructor(c.length*u),f=0,p=0;for(let y=0,g=c.length;y<g;y++){a.isInterleavedBufferAttribute?f=c[y]*a.data.stride+a.offset:f=c[y]*u;for(let m=0;m<u;m++)h[p++]=l[f++]}return new tn(h,u,d)}if(this.index===null)return qe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let a in r){let c=r[a],l=e(c,i);t.setAttribute(a,l)}let s=this.morphAttributes;for(let a in s){let c=[],l=s[a];for(let u=0,d=l.length;u<d;u++){let h=l[u],f=e(h,i);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let l=i[c];e.data.attributes[c]=l.toJSON(e.data)}let r={},s=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],u=[];for(let d=0,h=l.length;d<h;d++){let f=l[d];u.push(f.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let l in r){let u=r[l];this.setAttribute(l,u.clone(t))}let s=e.morphAttributes;for(let l in s){let u=[],d=s[l];for(let h=0,f=d.length;h<f;h++)u.push(d[h].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,u=o.length;l<u;l++){let d=o[l];this.addGroup(d.start,d.count,d.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var wg=new I,A1=new I,R1=new Qe,Vn=class{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=wg.subVectors(i,t).cross(A1.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(wg),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(r,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||R1.getNormalMatrix(e),r=this.coplanarPoint(wg).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},C1=0,Vi=class extends si{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:C1++}),this.uuid=Nr(),this.name="",this.type="Material",this.blending=Js,this.side=Qi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Xg,this.blendDst=qg,this.blendEquation=Pr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ue(0,0,0),this.blendAlpha=0,this.depthFunc=Us,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ub,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=nu,this.stencilZFail=nu,this.stencilZPass=nu,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){qe(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){qe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let o=[];for(let a in s){let c=s[a];delete c.metadata,o.push(c)}return o}if(t){let s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Ue().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new Vn().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new fe().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new fe().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var _i=new I,Eg=new I,Hl=new I,Gl=new I,gu=class{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,_i)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=_i.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(_i.copy(this.origin).addScaledVector(this.direction,t),_i.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Eg.copy(e).add(t).multiplyScalar(.5),Hl.copy(t).sub(e).normalize(),Gl.copy(this.origin).sub(Eg);let s=e.distanceTo(t)*.5,o=-this.direction.dot(Hl),a=Gl.dot(this.direction),c=-Gl.dot(Hl),l=Gl.lengthSq(),u=Math.abs(1-o*o),d,h,f,p;if(u>0)if(d=o*c-a,h=o*a-c,p=s*u,d>=0)if(h>=-p)if(h<=p){let y=1/u;d*=y,h*=y,f=d*(d+o*h+2*a)+h*(o*d+h+2*c)+l}else h=s,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*c)+l;else h=-s,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*c)+l;else h<=-p?(d=Math.max(0,-(-o*s+a)),h=d>0?-s:Math.min(Math.max(-s,-c),s),f=-d*d+h*(h+2*c)+l):h<=p?(d=0,h=Math.min(Math.max(-s,-c),s),f=h*(h+2*c)+l):(d=Math.max(0,-(o*s+a)),h=d>0?s:Math.min(Math.max(-s,-c),s),f=-d*d+h*(h+2*c)+l);else h=o>0?-s:s,d=Math.max(0,-(o*h+a)),f=-d*d+h*(h+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,d),r&&r.copy(Eg).addScaledVector(Hl,h),f}intersectSphere(e,t){if(e.radius<0)return null;_i.subVectors(e.center,this.origin);let i=_i.dot(this.direction),r=_i.dot(_i)-i*i,s=e.radius*e.radius;if(r>s)return null;let o=Math.sqrt(s-r),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,c,l=1/this.direction.x,u=1/this.direction.y,d=1/this.direction.z,h=this.origin;return l>=0?(i=(e.min.x-h.x)*l,r=(e.max.x-h.x)*l):(i=(e.max.x-h.x)*l,r=(e.min.x-h.x)*l),u>=0?(s=(e.min.y-h.y)*u,o=(e.max.y-h.y)*u):(s=(e.max.y-h.y)*u,o=(e.min.y-h.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),d>=0?(a=(e.min.z-h.z)*d,c=(e.max.z-h.z)*d):(a=(e.max.z-h.z)*d,c=(e.min.z-h.z)*d),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,_i)!==null}intersectTriangle(e,t,i,r,s){let o=this.origin,a=this.direction,c=a.x,l=a.y,u=a.z,d=e.x-o.x,h=e.y-o.y,f=e.z-o.z,p=t.x-o.x,y=t.y-o.y,g=t.z-o.z,m=i.x-o.x,S=i.y-o.y,E=i.z-o.z,v=Math.abs(c),M=Math.abs(l),w=Math.abs(u),C,_,T,P,D,k,V,z,B,Z,q,oe;if(v>=M&&v>=w?(T=c,k=d,B=p,oe=m,c>=0?(C=l,_=u,P=h,D=f,V=y,z=g,Z=S,q=E):(C=u,_=l,P=f,D=h,V=g,z=y,Z=E,q=S)):M>=w?(T=l,k=h,B=y,oe=S,l>=0?(C=u,_=c,P=f,D=d,V=g,z=p,Z=E,q=m):(C=c,_=u,P=d,D=f,V=p,z=g,Z=m,q=E)):(T=u,k=f,B=g,oe=E,u>=0?(C=c,_=l,P=d,D=h,V=p,z=y,Z=m,q=S):(C=l,_=c,P=h,D=d,V=y,z=p,Z=S,q=m)),T===0)return null;let Y=C/T,te=_/T,ie=1/T,Le=P-Y*k,Ce=D-te*k,ct=V-Y*B,it=z-te*B,ht=Z-Y*oe,j=q-te*oe,ne=ht*it-j*ct,ye=Le*j-Ce*ht,We=ct*Ce-it*Le;if(r){if(ne<0||ye<0||We<0)return null}else if((ne<0||ye<0||We<0)&&(ne>0||ye>0||We>0))return null;let Te=ne+ye+We;if(Te===0)return null;let $e=ie*(ne*k+ye*B+We*oe);return(Te>0?$e<0:$e>0)?null:this.at($e/Te,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},yn=class extends Vi{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ue(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Dn,this.combine=Yg,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},My=new Pt,yr=new gu,Vl=new Vs,wy=new I,$l=new I,Wl=new I,Zl=new I,Tg=new I,Xl=new I,Ey=new I,ql=new I,je=class extends rn{constructor(e=new Vt,t=new yn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(s&&a){Xl.set(0,0,0);for(let c=0,l=s.length;c<l;c++){let u=a[c],d=s[c];u!==0&&(Tg.fromBufferAttribute(d,e),o?Xl.addScaledVector(Tg,u):Xl.addScaledVector(Tg.sub(t),u))}t.add(Xl)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),Vl.copy(i.boundingSphere),Vl.applyMatrix4(s),yr.copy(e.ray).recast(e.near),!(Vl.containsPoint(yr.origin)===!1&&(yr.intersectSphere(Vl,wy)===null||yr.origin.distanceToSquared(wy)>(e.far-e.near)**2))&&(My.copy(s).invert(),yr.copy(e.ray).applyMatrix4(My),!(i.boundingBox!==null&&yr.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,yr)))}_computeIntersections(e,t,i){let r,s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,u=s.attributes.uv1,d=s.attributes.normal,h=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let p=0,y=h.length;p<y;p++){let g=h[p],m=o[g.materialIndex],S=Math.max(g.start,f.start),E=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let v=S,M=E;v<M;v+=3){let w=a.getX(v),C=a.getX(v+1),_=a.getX(v+2);r=Yl(this,m,e,i,l,u,d,w,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let g=p,m=y;g<m;g+=3){let S=a.getX(g),E=a.getX(g+1),v=a.getX(g+2);r=Yl(this,o,e,i,l,u,d,S,E,v),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let p=0,y=h.length;p<y;p++){let g=h[p],m=o[g.materialIndex],S=Math.max(g.start,f.start),E=Math.min(c.count,Math.min(g.start+g.count,f.start+f.count));for(let v=S,M=E;v<M;v+=3){let w=v,C=v+1,_=v+2;r=Yl(this,m,e,i,l,u,d,w,C,_),r&&(r.faceIndex=Math.floor(v/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let p=Math.max(0,f.start),y=Math.min(c.count,f.start+f.count);for(let g=p,m=y;g<m;g+=3){let S=g,E=g+1,v=g+2;r=Yl(this,o,e,i,l,u,d,S,E,v),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}}};function P1(n,e,t,i,r,s,o,a){let c;if(e.side===Jt?c=i.intersectTriangle(o,s,r,!0,a):c=i.intersectTriangle(r,s,o,e.side===Qi,a),c===null)return null;ql.copy(a),ql.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(ql);return l<t.near||l>t.far?null:{distance:l,point:ql.clone(),object:n}}function Yl(n,e,t,i,r,s,o,a,c,l){n.getVertexPosition(a,$l),n.getVertexPosition(c,Wl),n.getVertexPosition(l,Zl);let u=P1(n,e,t,i,$l,Wl,Zl,Ey);if(u){let d=new I;Gi.getBarycoord(Ey,$l,Wl,Zl,d),r&&(u.uv=Gi.getInterpolatedAttribute(r,a,c,l,d,new fe)),s&&(u.uv1=Gi.getInterpolatedAttribute(s,a,c,l,d,new fe)),o&&(u.normal=Gi.getInterpolatedAttribute(o,a,c,l,d,new I),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let h={a,b:c,c:l,normal:new I,materialIndex:0};Gi.getNormal($l,Wl,Zl,h.normal),u.face=h,u.barycoord=d}return u}var $i=class extends vn{constructor(e=null,t=1,i=1,r,s,o,a,c,l=Dt,u=Dt,d,h){super(null,o,a,c,l,u,r,s,d,h),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var br=new Vs,I1=new fe(.5,.5),Jl=new I,$s=class{constructor(e=new Vn,t=new Vn,i=new Vn,r=new Vn,s=new Vn,o=new Vn){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=$n,i=!1){let r=this.planes,s=e.elements,o=s[0],a=s[1],c=s[2],l=s[3],u=s[4],d=s[5],h=s[6],f=s[7],p=s[8],y=s[9],g=s[10],m=s[11],S=s[12],E=s[13],v=s[14],M=s[15];if(r[0].setComponents(l-o,f-u,m-p,M-S).normalize(),r[1].setComponents(l+o,f+u,m+p,M+S).normalize(),r[2].setComponents(l+a,f+d,m+y,M+E).normalize(),r[3].setComponents(l-a,f-d,m-y,M-E).normalize(),i)r[4].setComponents(c,h,g,v).normalize(),r[5].setComponents(l-c,f-h,m-g,M-v).normalize();else if(r[4].setComponents(l-c,f-h,m-g,M-v).normalize(),t===$n)r[5].setComponents(l+c,f+h,m+g,M+v).normalize();else if(t===Os)r[5].setComponents(c,h,g,v).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),br.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),br.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(br)}intersectsSprite(e){br.center.set(0,0,0);let t=I1.distanceTo(e.center);return br.radius=.7071067811865476+t,br.applyMatrix4(e.matrixWorld),this.intersectsSphere(br)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(Jl.x=r.normal.x>0?e.max.x:e.min.x,Jl.y=r.normal.y>0?e.max.y:e.min.y,Jl.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Jl)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var la=class extends vn{constructor(e=[],t=er,i,r,s,o,a,c,l,u){super(e,t,i,r,s,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var Wi=class extends vn{constructor(e,t,i=Zn,r,s,o,a=Dt,c=Dt,l,u=ri,d=1){if(u!==ri&&u!==nr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let h={width:e,height:t,depth:d};super(h,r,s,o,a,c,u,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Bs(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},xu=class extends Wi{constructor(e,t=Zn,i=er,r,s,o=Dt,a=Dt,c,l=ri){let u={width:e,height:e,depth:1},d=[u,u,u,u,u,u];super(e,e,t,i,r,s,o,a,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},ua=class extends vn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},Zi=class n extends Vt{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};let a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);let c=[],l=[],u=[],d=[],h=0,f=0;p("z","y","x",-1,-1,i,t,e,o,s,0),p("z","y","x",1,-1,i,t,-e,o,s,1),p("x","z","y",1,1,e,i,t,r,o,2),p("x","z","y",1,-1,e,i,-t,r,o,3),p("x","y","z",1,-1,e,t,i,r,s,4),p("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new pt(l,3)),this.setAttribute("normal",new pt(u,3)),this.setAttribute("uv",new pt(d,2));function p(y,g,m,S,E,v,M,w,C,_,T){let P=v/C,D=M/_,k=v/2,V=M/2,z=w/2,B=C+1,Z=_+1,q=0,oe=0,Y=new I;for(let te=0;te<Z;te++){let ie=te*D-V;for(let Le=0;Le<B;Le++){let Ce=Le*P-k;Y[y]=Ce*S,Y[g]=ie*E,Y[m]=z,l.push(Y.x,Y.y,Y.z),Y[y]=0,Y[g]=0,Y[m]=w>0?1:-1,u.push(Y.x,Y.y,Y.z),d.push(Le/C),d.push(1-te/_),q+=1}}for(let te=0;te<_;te++)for(let ie=0;ie<C;ie++){let Le=h+ie+B*te,Ce=h+ie+B*(te+1),ct=h+(ie+1)+B*(te+1),it=h+(ie+1)+B*te;c.push(Le,Ce,it),c.push(Ce,ct,it),oe+=6}a.addGroup(f,oe,T),f+=oe,h+=q}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var ha=class n extends Vt{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let s=[],o=[],a=[],c=[],l=new I,u=new fe;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let d=0,h=3;d<=t;d++,h+=3){let f=i+d/t*r;l.x=e*Math.cos(f),l.y=e*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),u.x=(o[h]/e+1)/2,u.y=(o[h+1]/e+1)/2,c.push(u.x,u.y)}for(let d=1;d<=t;d++)s.push(d,d+1,0);this.setIndex(s),this.setAttribute("position",new pt(o,3)),this.setAttribute("normal",new pt(a,3)),this.setAttribute("uv",new pt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},Xi=class n extends Vt{constructor(e=1,t=1,i=1,r=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};let l=this;r=Math.floor(r),s=Math.floor(s);let u=[],d=[],h=[],f=[],p=0,y=[],g=i/2,m=0;S(),o===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new pt(d,3)),this.setAttribute("normal",new pt(h,3)),this.setAttribute("uv",new pt(f,2));function S(){let v=new I,M=new I,w=0,C=(t-e)/i;for(let _=0;_<=s;_++){let T=[],P=_/s,D=P*(t-e)+e;for(let k=0;k<=r;k++){let V=k/r,z=V*c+a,B=Math.sin(z),Z=Math.cos(z);M.x=D*B,M.y=-P*i+g,M.z=D*Z,d.push(M.x,M.y,M.z),v.set(B,C,Z).normalize(),h.push(v.x,v.y,v.z),f.push(V,1-P),T.push(p++)}y.push(T)}for(let _=0;_<r;_++)for(let T=0;T<s;T++){let P=y[T][_],D=y[T+1][_],k=y[T+1][_+1],V=y[T][_+1];(e>0||T!==0)&&(u.push(P,D,V),w+=3),(t>0||T!==s-1)&&(u.push(D,k,V),w+=3)}l.addGroup(m,w,0),m+=w}function E(v){let M=p,w=new fe,C=new I,_=0,T=v===!0?e:t,P=v===!0?1:-1;for(let k=1;k<=r;k++)d.push(0,g*P,0),h.push(0,P,0),f.push(.5,.5),p++;let D=p;for(let k=0;k<=r;k++){let z=k/r*c+a,B=Math.cos(z),Z=Math.sin(z);C.x=T*Z,C.y=g*P,C.z=T*B,d.push(C.x,C.y,C.z),h.push(0,P,0),w.x=B*.5+.5,w.y=Z*.5*P+.5,f.push(w.x,w.y),p++}for(let k=0;k<r;k++){let V=M+k,z=D+k;v===!0?u.push(z,z+1,V):u.push(z+1,z,V),_+=3}l.addGroup(m,_,v===!0?1:2),m+=_}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},da=class n extends Xi{constructor(e=1,t=1,i=32,r=1,s=!1,o=0,a=Math.PI*2){super(0,e,t,i,r,s,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},fa=class n extends Vt{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let s=[],o=[];a(r),l(i),u(),this.setAttribute("position",new pt(s,3)),this.setAttribute("normal",new pt(s.slice(),3)),this.setAttribute("uv",new pt(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(S){let E=new I,v=new I,M=new I;for(let w=0;w<t.length;w+=3)f(t[w+0],E),f(t[w+1],v),f(t[w+2],M),c(E,v,M,S)}function c(S,E,v,M){let w=M+1,C=[];for(let _=0;_<=w;_++){C[_]=[];let T=S.clone().lerp(v,_/w),P=E.clone().lerp(v,_/w),D=w-_;for(let k=0;k<=D;k++)k===0&&_===w?C[_][k]=T:C[_][k]=T.clone().lerp(P,k/D)}for(let _=0;_<w;_++)for(let T=0;T<2*(w-_)-1;T++){let P=Math.floor(T/2);T%2===0?(h(C[_][P+1]),h(C[_+1][P]),h(C[_][P])):(h(C[_][P+1]),h(C[_+1][P+1]),h(C[_+1][P]))}}function l(S){let E=new I;for(let v=0;v<s.length;v+=3)E.x=s[v+0],E.y=s[v+1],E.z=s[v+2],E.normalize().multiplyScalar(S),s[v+0]=E.x,s[v+1]=E.y,s[v+2]=E.z}function u(){let S=new I;for(let E=0;E<s.length;E+=3){S.x=s[E+0],S.y=s[E+1],S.z=s[E+2];let v=g(S)/2/Math.PI+.5,M=m(S)/Math.PI+.5;o.push(v,1-M)}p(),d()}function d(){for(let S=0;S<o.length;S+=6){let E=o[S+0],v=o[S+2],M=o[S+4],w=Math.max(E,v,M),C=Math.min(E,v,M);w>.9&&C<.1&&(E<.2&&(o[S+0]+=1),v<.2&&(o[S+2]+=1),M<.2&&(o[S+4]+=1))}}function h(S){s.push(S.x,S.y,S.z)}function f(S,E){let v=S*3;E.x=e[v+0],E.y=e[v+1],E.z=e[v+2]}function p(){let S=new I,E=new I,v=new I,M=new I,w=new fe,C=new fe,_=new fe;for(let T=0,P=0;T<s.length;T+=9,P+=6){S.set(s[T+0],s[T+1],s[T+2]),E.set(s[T+3],s[T+4],s[T+5]),v.set(s[T+6],s[T+7],s[T+8]),w.set(o[P+0],o[P+1]),C.set(o[P+2],o[P+3]),_.set(o[P+4],o[P+5]),M.copy(S).add(E).add(v).divideScalar(3);let D=g(M);y(w,P+0,S,D),y(C,P+2,E,D),y(_,P+4,v,D)}}function y(S,E,v,M){M<0&&S.x===1&&(o[E]=S.x-1),v.x===0&&v.z===0&&(o[E]=M/2/Math.PI+.5)}function g(S){return Math.atan2(S.z,-S.x)}function m(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var Tn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){qe("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,o;t?o=t:o=e*i[s-1];let a=0,c=s-1,l;for(;a<=c;)if(r=Math.floor(a+(c-a)/2),l=i[r]-o,l<0)a=r+1;else if(l>0)c=r-1;else{c=r;break}if(r=c,i[r]===o)return r/(s-1);let u=i[r],h=i[r+1]-u,f=(o-u)/h;return(r+f)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let o=this.getPoint(r),a=this.getPoint(s),c=t||(o.isVector2?new fe:new I);return c.copy(a).sub(o).normalize(),c}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new I,r=[],s=[],o=[],a=new I,c=new Pt;for(let f=0;f<=e;f++){let p=f/e;r[f]=this.getTangentAt(p,new I)}s[0]=new I,o[0]=new I;let l=Number.MAX_VALUE,u=Math.abs(r[0].x),d=Math.abs(r[0].y),h=Math.abs(r[0].z);u<=l&&(l=u,i.set(1,0,0)),d<=l&&(l=d,i.set(0,1,0)),h<=l&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(r[f-1],r[f]),a.length()>Number.EPSILON){a.normalize();let p=Math.acos(at(r[f-1].dot(r[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(a,p))}o[f].crossVectors(r[f],s[f])}if(t===!0){let f=Math.acos(at(s[0].dot(s[e]),-1,1));f/=e,r[0].dot(a.crossVectors(s[0],s[e]))>0&&(f=-f);for(let p=1;p<=e;p++)s[p].applyMatrix4(c.makeRotationAxis(r[p],f*p)),o[p].crossVectors(r[p],s[p])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},Ws=class extends Tn{constructor(e=0,t=0,i=1,r=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(e,t=new fe){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(o?s=0:s=r),this.aClockwise===!0&&!o&&(s===r?s=-r:s=s-r);let a=this.aStartAngle+e*s,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let u=Math.cos(this.aRotation),d=Math.sin(this.aRotation),h=c-this.aX,f=l-this.aY;c=h*u-f*d+this.aX,l=h*d+f*u+this.aY}return i.set(c,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},_u=class extends Ws{constructor(e,t,i,r,s,o){super(e,t,i,i,r,s,o),this.isArcCurve=!0,this.type="ArcCurve"}};function fx(){let n=0,e=0,t=0,i=0;function r(s,o,a,c){n=s,e=a,t=-3*s+3*o-2*a-c,i=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){r(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,u,d){let h=(o-s)/l-(a-s)/(l+u)+(a-o)/u,f=(a-o)/u-(c-o)/(u+d)+(c-a)/d;h*=u,f*=u,r(o,a,h,f)},calc:function(s){let o=s*s,a=o*s;return n+e*s+t*o+i*a}}}var Ty=new I,Ay=new I,Ag=new fx,Rg=new fx,Cg=new fx,vu=class extends Tn{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new I){let i=t,r=this.points,s=r.length,o=(s-(this.closed?0:1))*e,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,u;this.closed||a>0?l=r[(a-1)%s]:(Ay.subVectors(r[0],r[1]).add(r[0]),l=Ay);let d=r[a%s],h=r[(a+1)%s];if(this.closed||a+2<s?u=r[(a+2)%s]:(Ty.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Ty),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,p=Math.pow(l.distanceToSquared(d),f),y=Math.pow(d.distanceToSquared(h),f),g=Math.pow(h.distanceToSquared(u),f);y<1e-4&&(y=1),p<1e-4&&(p=y),g<1e-4&&(g=y),Ag.initNonuniformCatmullRom(l.x,d.x,h.x,u.x,p,y,g),Rg.initNonuniformCatmullRom(l.y,d.y,h.y,u.y,p,y,g),Cg.initNonuniformCatmullRom(l.z,d.z,h.z,u.z,p,y,g)}else this.curveType==="catmullrom"&&(Ag.initCatmullRom(l.x,d.x,h.x,u.x,this.tension),Rg.initCatmullRom(l.y,d.y,h.y,u.y,this.tension),Cg.initCatmullRom(l.z,d.z,h.z,u.z,this.tension));return i.set(Ag.calc(c),Rg.calc(c),Cg.calc(c)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new I().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Ry(n,e,t,i,r){let s=(i-e)*.5,o=(r-t)*.5,a=n*n,c=n*a;return(2*t-2*i+s+o)*c+(-3*t+3*i-2*s-o)*a+s*n+t}function N1(n,e){let t=1-n;return t*t*e}function D1(n,e){return 2*(1-n)*n*e}function z1(n,e){return n*n*e}function Ko(n,e,t,i){return N1(n,e)+D1(n,t)+z1(n,i)}function L1(n,e){let t=1-n;return t*t*t*e}function U1(n,e){let t=1-n;return 3*t*t*n*e}function O1(n,e){return 3*(1-n)*n*n*e}function F1(n,e){return n*n*n*e}function Qo(n,e,t,i,r){return L1(n,e)+U1(n,t)+O1(n,i)+F1(n,r)}var pa=class extends Tn{constructor(e=new fe,t=new fe,i=new fe,r=new fe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new fe){let i=t,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(Qo(e,r.x,s.x,o.x,a.x),Qo(e,r.y,s.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},yu=class extends Tn{constructor(e=new I,t=new I,i=new I,r=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new I){let i=t,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(Qo(e,r.x,s.x,o.x,a.x),Qo(e,r.y,s.y,o.y,a.y),Qo(e,r.z,s.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},ma=class extends Tn{constructor(e=new fe,t=new fe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new fe){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new fe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},bu=class extends Tn{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},ga=class extends Tn{constructor(e=new fe,t=new fe,i=new fe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new fe){let i=t,r=this.v0,s=this.v1,o=this.v2;return i.set(Ko(e,r.x,s.x,o.x),Ko(e,r.y,s.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Su=class extends Tn{constructor(e=new I,t=new I,i=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new I){let i=t,r=this.v0,s=this.v1,o=this.v2;return i.set(Ko(e,r.x,s.x,o.x),Ko(e,r.y,s.y,o.y),Ko(e,r.z,s.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},xa=class extends Tn{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new fe){let i=t,r=this.points,s=(r.length-1)*e,o=Math.floor(s),a=s-o,c=r[o===0?o:o-1],l=r[o],u=r[o>r.length-2?r.length-1:o+1],d=r[o>r.length-3?r.length-1:o+2];return i.set(Ry(a,c.x,l.x,u.x,d.x),Ry(a,c.y,l.y,u.y,d.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new fe().fromArray(r))}return this}},Ug=Object.freeze({__proto__:null,ArcCurve:_u,CatmullRomCurve3:vu,CubicBezierCurve:pa,CubicBezierCurve3:yu,EllipseCurve:Ws,LineCurve:ma,LineCurve3:bu,QuadraticBezierCurve:ga,QuadraticBezierCurve3:Su,SplineCurve:xa}),Mu=class extends Tn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Ug[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let o=r[s]-i,a=this.curves[s],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let o=s[r],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,c=o.getPoints(a);for(let l=0;l<c.length;l++){let u=c[l];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new Ug[r.type]().fromJSON(r))}return this}},_a=class extends Mu{constructor(e){super(),this.type="Path",this.currentPoint=new fe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new ma(this.currentPoint.clone(),new fe(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new ga(this.currentPoint.clone(),new fe(e,t),new fe(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,o){let a=new pa(this.currentPoint.clone(),new fe(e,t),new fe(i,r),new fe(s,o));return this.curves.push(a),this.currentPoint.set(s,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new xa(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+a,t+c,i,r,s,o),this}absarc(e,t,i,r,s,o){return this.absellipse(e,t,i,i,r,s,o),this}ellipse(e,t,i,r,s,o,a,c){let l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+l,t+u,i,r,s,o,a,c),this}absellipse(e,t,i,r,s,o,a,c){let l=new Ws(e,t,i,r,s,o,a,c);if(this.curves.length>0){let d=l.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(l);let u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},Zs=class extends _a{constructor(e){super(e),this.uuid=Nr(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new _a().fromJSON(r))}return this}};function k1(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=Mb(n,0,r,t,!0),o=[];if(!s||s.next===s.prev)return o;let a,c,l;if(i&&(s=$1(n,e,s,t)),n.length>80*t){a=n[0],c=n[1];let u=a,d=c;for(let h=t;h<r;h+=t){let f=n[h],p=n[h+1];f<a&&(a=f),p<c&&(c=p),f>u&&(u=f),p>d&&(d=p)}l=Math.max(u-a,d-c),l=l!==0?32767/l:0}return va(s,o,t,a,c,l,0),o}function Mb(n,e,t,i,r){let s;if(r===tE(n,e,t,i)>0)for(let o=e;o<t;o+=i)s=Cy(o/i|0,n[o],n[o+1],s);else for(let o=t-i;o>=e;o-=i)s=Cy(o/i|0,n[o],n[o+1],s);return s&&Xs(s,s.next)&&(ba(s),s=s.next),s}function wr(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(Xs(t,t.next)||Ut(t.prev,t,t.next)===0)){if(ba(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function va(n,e,t,i,r,s,o){if(!n)return;!o&&s&&Y1(n,i,r,s);let a=n;for(;n.prev!==n.next;){let c=n.prev,l=n.next;if(s?H1(n,i,r,s):B1(n)){e.push(c.i,n.i,l.i),ba(n),n=l.next,a=l.next;continue}if(n=l,n===a){o?o===1?(n=G1(wr(n),e),va(n,e,t,i,r,s,2)):o===2&&V1(n,e,t,i,r,s):va(wr(n),e,t,i,r,s,1);break}}}function B1(n){let e=n.prev,t=n,i=n.next;if(Ut(e,t,i)>=0)return!1;let r=e.x,s=t.x,o=i.x,a=e.y,c=t.y,l=i.y,u=Math.min(r,s,o),d=Math.min(a,c,l),h=Math.max(r,s,o),f=Math.max(a,c,l),p=i.next;for(;p!==e;){if(p.x>=u&&p.x<=h&&p.y>=d&&p.y<=f&&Yo(r,a,s,c,o,l,p.x,p.y)&&Ut(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function H1(n,e,t,i){let r=n.prev,s=n,o=n.next;if(Ut(r,s,o)>=0)return!1;let a=r.x,c=s.x,l=o.x,u=r.y,d=s.y,h=o.y,f=Math.min(a,c,l),p=Math.min(u,d,h),y=Math.max(a,c,l),g=Math.max(u,d,h),m=Og(f,p,e,t,i),S=Og(y,g,e,t,i),E=n.prevZ,v=n.nextZ;for(;E&&E.z>=m&&v&&v.z<=S;){if(E.x>=f&&E.x<=y&&E.y>=p&&E.y<=g&&E!==r&&E!==o&&Yo(a,u,c,d,l,h,E.x,E.y)&&Ut(E.prev,E,E.next)>=0||(E=E.prevZ,v.x>=f&&v.x<=y&&v.y>=p&&v.y<=g&&v!==r&&v!==o&&Yo(a,u,c,d,l,h,v.x,v.y)&&Ut(v.prev,v,v.next)>=0))return!1;v=v.nextZ}for(;E&&E.z>=m;){if(E.x>=f&&E.x<=y&&E.y>=p&&E.y<=g&&E!==r&&E!==o&&Yo(a,u,c,d,l,h,E.x,E.y)&&Ut(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;v&&v.z<=S;){if(v.x>=f&&v.x<=y&&v.y>=p&&v.y<=g&&v!==r&&v!==o&&Yo(a,u,c,d,l,h,v.x,v.y)&&Ut(v.prev,v,v.next)>=0)return!1;v=v.nextZ}return!0}function G1(n,e){let t=n;do{let i=t.prev,r=t.next.next;!Xs(i,r)&&Eb(i,t,t.next,r)&&ya(i,r)&&ya(r,i)&&(e.push(i.i,t.i,r.i),ba(t),ba(t.next),t=n=r),t=t.next}while(t!==n);return wr(t)}function V1(n,e,t,i,r,s){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&K1(o,a)){let c=Tb(o,a);o=wr(o,o.next),c=wr(c,c.next),va(o,e,t,i,r,s,0),va(c,e,t,i,r,s,0);return}a=a.next}o=o.next}while(o!==n)}function $1(n,e,t,i){let r=[];for(let s=0,o=e.length;s<o;s++){let a=e[s]*i,c=s<o-1?e[s+1]*i:n.length,l=Mb(n,a,c,i,!1);l===l.next&&(l.steiner=!0),r.push(j1(l))}r.sort(W1);for(let s=0;s<r.length;s++)t=Z1(r[s],t);return t}function W1(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function Z1(n,e){let t=X1(n,e);if(!t)return e;let i=Tb(t,n);return wr(i,i.next),wr(t,t.next)}function X1(n,e){let t=e,i=n.x,r=n.y,s=-1/0,o;if(Xs(n,t))return t;do{if(Xs(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let d=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(d<=i&&d>s&&(s=d,o=t.x<t.next.x?t:t.next,d===i))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,c=o.x,l=o.y,u=1/0;t=o;do{if(i>=t.x&&t.x>=c&&i!==t.x&&wb(r<l?i:s,r,c,l,r<l?s:i,r,t.x,t.y)){let d=Math.abs(r-t.y)/(i-t.x);ya(t,n)&&(d<u||d===u&&(t.x>o.x||t.x===o.x&&q1(o,t)))&&(o=t,u=d)}t=t.next}while(t!==a);return o}function q1(n,e){return Ut(n.prev,n,e.prev)<0&&Ut(e.next,n,n.next)<0}function Y1(n,e,t,i){let r=n;do r.z===0&&(r.z=Og(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,J1(r)}function J1(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let o=i,a=0;for(let l=0;l<t&&(a++,o=o.nextZ,!!o);l++);let c=t;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||i.z<=o.z)?(r=i,i=i.nextZ,a--):(r=o,o=o.nextZ,c--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=o}s.nextZ=null,t*=2}while(e>1);return n}function Og(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function j1(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function wb(n,e,t,i,r,s,o,a){return(r-o)*(e-a)>=(n-o)*(s-a)&&(n-o)*(i-a)>=(t-o)*(e-a)&&(t-o)*(s-a)>=(r-o)*(i-a)}function Yo(n,e,t,i,r,s,o,a){return!(n===o&&e===a)&&wb(n,e,t,i,r,s,o,a)}function K1(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!Q1(n,e)&&(ya(n,e)&&ya(e,n)&&eE(n,e)&&(Ut(n.prev,n,e.prev)||Ut(n,e.prev,e))||Xs(n,e)&&Ut(n.prev,n,n.next)>0&&Ut(e.prev,e,e.next)>0)}function Ut(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function Xs(n,e){return n.x===e.x&&n.y===e.y}function Eb(n,e,t,i){let r=Kl(Ut(n,e,t)),s=Kl(Ut(n,e,i)),o=Kl(Ut(t,i,n)),a=Kl(Ut(t,i,e));return!!(r!==s&&o!==a||r===0&&jl(n,t,e)||s===0&&jl(n,i,e)||o===0&&jl(t,n,i)||a===0&&jl(t,e,i))}function jl(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function Kl(n){return n>0?1:n<0?-1:0}function Q1(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&Eb(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function ya(n,e){return Ut(n.prev,n,n.next)<0?Ut(n,e,n.next)>=0&&Ut(n,n.prev,e)>=0:Ut(n,e,n.prev)<0||Ut(n,n.next,e)<0}function eE(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function Tb(n,e){let t=Fg(n.i,n.x,n.y),i=Fg(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Cy(n,e,t,i){let r=Fg(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function ba(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function Fg(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function tE(n,e,t,i){let r=0;for(let s=e,o=t-i;s<t;s+=i)r+=(n[o]-n[s])*(n[s+1]+n[o+1]),o=s;return r}var kg=class{static triangulate(e,t,i=2){return k1(e,t,i)}},Sr=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Py(e),Iy(i,e);let o=e.length;t.forEach(Py);for(let c=0;c<t.length;c++)r.push(o),o+=t[c].length,Iy(i,t[c]);let a=kg.triangulate(i,r);for(let c=0;c<a.length;c+=3)s.push(a.slice(c,c+3));return s}};function Py(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Iy(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var Sa=class n extends Vt{constructor(e=new Zs([new fe(.5,.5),new fe(-.5,.5),new fe(-.5,-.5),new fe(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],s=[];for(let a=0,c=e.length;a<c;a++){let l=e[a];o(l)}this.setAttribute("position",new pt(r,3)),this.setAttribute("uv",new pt(s,2)),this.computeVertexNormals();function o(a){let c=[],l=t.curveSegments!==void 0?t.curveSegments:12,u=t.steps!==void 0?t.steps:1,d=t.depth!==void 0?t.depth:1,h=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,p=t.bevelSize!==void 0?t.bevelSize:f-.1,y=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,m=t.extrudePath,S=t.UVGenerator!==void 0?t.UVGenerator:nE,E,v=!1,M,w,C,_;if(m){E=m.getSpacedPoints(u),v=!0,h=!1;let re=m.isCatmullRomCurve3?m.closed:!1;M=m.computeFrenetFrames(u,re),w=new I,C=new I,_=new I}h||(g=0,f=0,p=0,y=0);let T=a.extractPoints(l),P=T.shape,D=T.holes;if(!Sr.isClockWise(P)){P=P.reverse();for(let re=0,le=D.length;re<le;re++){let ue=D[re];Sr.isClockWise(ue)&&(D[re]=ue.reverse())}}function V(re){let ue=10000000000000001e-36,W=re[0];for(let Q=1;Q<=re.length;Q++){let Pe=Q%re.length,Ne=re[Pe],Ve=Ne.x-W.x,Ze=Ne.y-W.y,N=Ve*Ve+Ze*Ze,mt=Math.max(Math.abs(Ne.x),Math.abs(Ne.y),Math.abs(W.x),Math.abs(W.y)),et=ue*mt*mt;if(N<=et){re.splice(Pe,1),Q--;continue}W=Ne}}V(P),D.forEach(V);let z=D.length,B=P;for(let re=0;re<z;re++){let le=D[re];P=P.concat(le)}function Z(re,le,ue){return le||Je("ExtrudeGeometry: vec does not exist"),re.clone().addScaledVector(le,ue)}let q=P.length;function oe(re,le,ue){let W,Q,Pe,Ne=re.x-le.x,Ve=re.y-le.y,Ze=ue.x-re.x,N=ue.y-re.y,mt=Ne*Ne+Ve*Ve,et=Ne*N-Ve*Ze;if(Math.abs(et)>Number.EPSILON){let A=Math.sqrt(mt),x=Math.sqrt(Ze*Ze+N*N),O=le.x-Ve/A,$=le.y+Ne/A,J=ue.x-N/x,pe=ue.y+Ze/x,me=((J-O)*N-(pe-$)*Ze)/(Ne*N-Ve*Ze);W=O+Ne*me-re.x,Q=$+Ve*me-re.y;let K=W*W+Q*Q;if(K<=2)return new fe(W,Q);Pe=Math.sqrt(K/2)}else{let A=!1;Ne>Number.EPSILON?Ze>Number.EPSILON&&(A=!0):Ne<-Number.EPSILON?Ze<-Number.EPSILON&&(A=!0):Math.sign(Ve)===Math.sign(N)&&(A=!0),A?(W=-Ve,Q=Ne,Pe=Math.sqrt(mt)):(W=Ne,Q=Ve,Pe=Math.sqrt(mt/2))}return new fe(W/Pe,Q/Pe)}let Y=[];for(let re=0,le=B.length,ue=le-1,W=re+1;re<le;re++,ue++,W++)ue===le&&(ue=0),W===le&&(W=0),Y[re]=oe(B[re],B[ue],B[W]);let te=[],ie,Le=Y.concat();for(let re=0,le=z;re<le;re++){let ue=D[re];ie=[];for(let W=0,Q=ue.length,Pe=Q-1,Ne=W+1;W<Q;W++,Pe++,Ne++)Pe===Q&&(Pe=0),Ne===Q&&(Ne=0),ie[W]=oe(ue[W],ue[Pe],ue[Ne]);te.push(ie),Le=Le.concat(ie)}let Ce;if(g===0)Ce=Sr.triangulateShape(B,D);else{let re=[],le=[];for(let ue=0;ue<g;ue++){let W=ue/g,Q=f*Math.cos(W*Math.PI/2),Pe=p*Math.sin(W*Math.PI/2)+y;for(let Ne=0,Ve=B.length;Ne<Ve;Ne++){let Ze=Z(B[Ne],Y[Ne],Pe);ye(Ze.x,Ze.y,-Q),W===0&&re.push(Ze)}for(let Ne=0,Ve=z;Ne<Ve;Ne++){let Ze=D[Ne];ie=te[Ne];let N=[];for(let mt=0,et=Ze.length;mt<et;mt++){let A=Z(Ze[mt],ie[mt],Pe);ye(A.x,A.y,-Q),W===0&&N.push(A)}W===0&&le.push(N)}}Ce=Sr.triangulateShape(re,le)}let ct=Ce.length,it=p+y;for(let re=0;re<q;re++){let le=h?Z(P[re],Le[re],it):P[re];v?(C.copy(M.normals[0]).multiplyScalar(le.x),w.copy(M.binormals[0]).multiplyScalar(le.y),_.copy(E[0]).add(C).add(w),ye(_.x,_.y,_.z)):ye(le.x,le.y,0)}for(let re=1;re<=u;re++)for(let le=0;le<q;le++){let ue=h?Z(P[le],Le[le],it):P[le];v?(C.copy(M.normals[re]).multiplyScalar(ue.x),w.copy(M.binormals[re]).multiplyScalar(ue.y),_.copy(E[re]).add(C).add(w),ye(_.x,_.y,_.z)):ye(ue.x,ue.y,d/u*re)}for(let re=g-1;re>=0;re--){let le=re/g,ue=f*Math.cos(le*Math.PI/2),W=p*Math.sin(le*Math.PI/2)+y;for(let Q=0,Pe=B.length;Q<Pe;Q++){let Ne=Z(B[Q],Y[Q],W);ye(Ne.x,Ne.y,d+ue)}for(let Q=0,Pe=D.length;Q<Pe;Q++){let Ne=D[Q];ie=te[Q];for(let Ve=0,Ze=Ne.length;Ve<Ze;Ve++){let N=Z(Ne[Ve],ie[Ve],W);v?ye(N.x,N.y+E[u-1].y,E[u-1].x+ue):ye(N.x,N.y,d+ue)}}}ht(),j();function ht(){let re=r.length/3;if(h){let le=0,ue=q*le;for(let W=0;W<ct;W++){let Q=Ce[W];We(Q[2]+ue,Q[1]+ue,Q[0]+ue)}le=u+g*2,ue=q*le;for(let W=0;W<ct;W++){let Q=Ce[W];We(Q[0]+ue,Q[1]+ue,Q[2]+ue)}}else{for(let le=0;le<ct;le++){let ue=Ce[le];We(ue[2],ue[1],ue[0])}for(let le=0;le<ct;le++){let ue=Ce[le];We(ue[0]+q*u,ue[1]+q*u,ue[2]+q*u)}}i.addGroup(re,r.length/3-re,0)}function j(){let re=r.length/3,le=0;ne(B,le),le+=B.length;for(let ue=0,W=D.length;ue<W;ue++){let Q=D[ue];ne(Q,le),le+=Q.length}i.addGroup(re,r.length/3-re,1)}function ne(re,le){let ue=re.length;for(;--ue>=0;){let W=ue,Q=ue-1;Q<0&&(Q=re.length-1);for(let Pe=0,Ne=u+g*2;Pe<Ne;Pe++){let Ve=q*Pe,Ze=q*(Pe+1),N=le+W+Ve,mt=le+Q+Ve,et=le+Q+Ze,A=le+W+Ze;Te(N,mt,et,A)}}}function ye(re,le,ue){c.push(re),c.push(le),c.push(ue)}function We(re,le,ue){$e(re),$e(le),$e(ue);let W=r.length/3,Q=S.generateTopUV(i,r,W-3,W-2,W-1);dt(Q[0]),dt(Q[1]),dt(Q[2])}function Te(re,le,ue,W){$e(re),$e(le),$e(W),$e(le),$e(ue),$e(W);let Q=r.length/3,Pe=S.generateSideWallUV(i,r,Q-6,Q-3,Q-2,Q-1);dt(Pe[0]),dt(Pe[1]),dt(Pe[3]),dt(Pe[1]),dt(Pe[2]),dt(Pe[3])}function $e(re){r.push(c[re*3+0]),r.push(c[re*3+1]),r.push(c[re*3+2])}function dt(re){s.push(re.x),s.push(re.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return iE(t,i,e)}static fromJSON(e,t){let i=[];for(let s=0,o=e.shapes.length;s<o;s++){let a=t[e.shapes[s]];i.push(a)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new Ug[r.type]().fromJSON(r)),new n(i,e.options)}},nE={generateTopUV:function(n,e,t,i,r){let s=e[t*3],o=e[t*3+1],a=e[i*3],c=e[i*3+1],l=e[r*3],u=e[r*3+1];return[new fe(s,o),new fe(a,c),new fe(l,u)]},generateSideWallUV:function(n,e,t,i,r,s){let o=e[t*3],a=e[t*3+1],c=e[t*3+2],l=e[i*3],u=e[i*3+1],d=e[i*3+2],h=e[r*3],f=e[r*3+1],p=e[r*3+2],y=e[s*3],g=e[s*3+1],m=e[s*3+2];return Math.abs(a-u)<Math.abs(o-l)?[new fe(o,1-c),new fe(l,1-d),new fe(h,1-p),new fe(y,1-m)]:[new fe(a,1-c),new fe(u,1-d),new fe(f,1-p),new fe(g,1-m)]}};function iE(n,e,t){if(t.shapes=[],Array.isArray(n))for(let i=0,r=n.length;i<r;i++){let s=n[i];t.shapes.push(s.uuid)}else t.shapes.push(n.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var Er=class n extends fa{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var qi=class n extends fa{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Tr=class n extends Vt{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,o=t/2,a=Math.floor(i),c=Math.floor(r),l=a+1,u=c+1,d=e/a,h=t/c,f=[],p=[],y=[],g=[];for(let m=0;m<u;m++){let S=m*h-o;for(let E=0;E<l;E++){let v=E*d-s;p.push(v,-S,0),y.push(0,0,1),g.push(E/a),g.push(1-m/c)}}for(let m=0;m<c;m++)for(let S=0;S<a;S++){let E=S+l*m,v=S+l*(m+1),M=S+1+l*(m+1),w=S+1+l*m;f.push(E,v,w),f.push(v,M,w)}this.setIndex(f),this.setAttribute("position",new pt(p,3)),this.setAttribute("normal",new pt(y,3)),this.setAttribute("uv",new pt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Ma=class n extends Vt{constructor(e=.5,t=1,i=32,r=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:o},i=Math.max(3,i),r=Math.max(1,r);let a=[],c=[],l=[],u=[],d=e,h=(t-e)/r,f=new I,p=new fe;for(let y=0;y<=r;y++){for(let g=0;g<=i;g++){let m=s+g/i*o;f.x=d*Math.cos(m),f.y=d*Math.sin(m),c.push(f.x,f.y,f.z),l.push(0,0,1),p.x=(f.x/t+1)/2,p.y=(f.y/t+1)/2,u.push(p.x,p.y)}d+=h}for(let y=0;y<r;y++){let g=y*(i+1);for(let m=0;m<i;m++){let S=m+g,E=S,v=S+i+1,M=S+i+2,w=S+1;a.push(E,v,w),a.push(v,M,w)}}this.setIndex(a),this.setAttribute("position",new pt(c,3)),this.setAttribute("normal",new pt(l,3)),this.setAttribute("uv",new pt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var wa=class n extends Vt{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let c=Math.min(o+a,Math.PI),l=0,u=[],d=new I,h=new I,f=[],p=[],y=[],g=[];for(let m=0;m<=i;m++){let S=[],E=m/i,v=o+E*a,M=e*Math.cos(v),w=Math.sqrt(e*e-M*M),C=0;m===0&&o===0?C=.5/t:m===i&&c===Math.PI&&(C=-.5/t);for(let _=0;_<=t;_++){let T=_/t,P=r+T*s;d.x=-w*Math.cos(P),d.y=M,d.z=w*Math.sin(P),p.push(d.x,d.y,d.z),h.copy(d).normalize(),y.push(h.x,h.y,h.z),g.push(T+C,1-E),S.push(l++)}u.push(S)}for(let m=0;m<i;m++)for(let S=0;S<t;S++){let E=u[m][S+1],v=u[m][S],M=u[m+1][S],w=u[m+1][S+1];(m!==0||o>0)&&f.push(E,v,w),(m!==i-1||c<Math.PI)&&f.push(v,M,w)}this.setIndex(f),this.setAttribute("position",new pt(p,3)),this.setAttribute("normal",new pt(y,3)),this.setAttribute("uv",new pt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Ar=class n extends Vt{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:o,thetaLength:a},i=Math.floor(i),r=Math.floor(r);let c=[],l=[],u=[],d=[],h=new I,f=new I,p=new I;for(let y=0;y<=i;y++){let g=o+y/i*a;for(let m=0;m<=r;m++){let S=m/r*s;f.x=(e+t*Math.cos(g))*Math.cos(S),f.y=(e+t*Math.cos(g))*Math.sin(S),f.z=t*Math.sin(g),l.push(f.x,f.y,f.z),h.x=e*Math.cos(S),h.y=e*Math.sin(S),p.subVectors(f,h).normalize(),u.push(p.x,p.y,p.z),d.push(m/r),d.push(y/i)}}for(let y=1;y<=i;y++)for(let g=1;g<=r;g++){let m=(r+1)*y+g-1,S=(r+1)*(y-1)+g-1,E=(r+1)*(y-1)+g,v=(r+1)*y+g;c.push(m,S,v),c.push(S,E,v)}this.setIndex(c),this.setAttribute("position",new pt(l,3)),this.setAttribute("normal",new pt(u,3)),this.setAttribute("uv",new pt(d,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function Dr(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Ny(r))r.isRenderTargetTexture?(qe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Ny(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function on(n){let e={};for(let t=0;t<n.length;t++){let i=Dr(n[t]);for(let r in i)e[r]=i[r]}return e}function Ny(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function rE(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function px(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ut.workingColorSpace}var Ab={clone:Dr,merge:on},sE=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,oE=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,sn=class extends Vi{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=sE,this.fragmentShader=oE,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Dr(e.uniforms),this.uniformsGroups=rE(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Ue().setHex(r.value);break;case"v2":this.uniforms[i].value=new fe().fromArray(r.value);break;case"v3":this.uniforms[i].value=new I().fromArray(r.value);break;case"v4":this.uniforms[i].value=new zt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Qe().fromArray(r.value);break;case"m4":this.uniforms[i].value=new Pt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},wu=class extends sn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Yi=class extends Vi{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Ue(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ue(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Eh,this.normalScale=new fe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Eu=class extends Vi{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=cb,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},Tu=class extends Vi{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Is(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function Pg(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var Ji=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let o;t:{i:if(!(e<r)){for(let a=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(s=r,r=t[++i],e<r)break e}o=t.length;break t}if(!(e>=s)){let a=t[1];e<a&&(i=2,s=a);for(let c=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(r=s,s=t[--i-1],e>=s)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let o=0;o!==r;++o)t[o]=i[s+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Au=class extends Ji{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Dg,endingEnd:Dg}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,o=e+1,a=r[s],c=r[o];if(a===void 0)switch(this.getSettings_().endingStart){case zg:s=e,a=2*t-i;break;case Lg:s=r.length-2,a=t+r[s]-r[s+1];break;default:s=e,a=i}if(c===void 0)switch(this.getSettings_().endingEnd){case zg:o=e,c=2*i-t;break;case Lg:o=1,c=i+r[1]-r[0];break;default:o=e-1,c=t}let l=(i-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-i),this._offsetPrev=s*u,this._offsetNext=o*u}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,d=this._offsetNext,h=this._weightPrev,f=this._weightNext,p=(i-t)/(r-t),y=p*p,g=y*p,m=-h*g+2*h*y-h*p,S=(1+h)*g+(-1.5-2*h)*y+(-.5+h)*p+1,E=(-1-f)*g+(1.5+f)*y+.5*p,v=f*g-f*y;for(let M=0;M!==a;++M)s[M]=m*o[u+M]+S*o[l+M]+E*o[c+M]+v*o[d+M];return s}},Ru=class extends Ji{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(i-t)/(r-t),d=1-u;for(let h=0;h!==a;++h)s[h]=o[l+h]*d+o[c+h]*u;return s}},Cu=class extends Ji{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Pu=class extends Ji{interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this.inTangents,d=this.outTangents;if(!u||!d){let p=(i-t)/(r-t),y=1-p;for(let g=0;g!==a;++g)s[g]=o[l+g]*y+o[c+g]*p;return s}let h=a*2,f=e-1;for(let p=0;p!==a;++p){let y=o[l+p],g=o[c+p],m=f*h+p*2,S=d[m],E=d[m+1],v=e*h+p*2,M=u[v],w=u[v+1],C=cE(i,t,S,M,r);s[p]=Rb(C,y,E,w,g)}return s}};function Rb(n,e,t,i,r){let s=1-n;return s*s*s*e+3*s*s*n*t+3*s*n*n*i+n*n*n*r}function aE(n,e,t,i,r){let s=1-n;return 3*s*s*(t-e)+6*s*n*(i-t)+3*n*n*(r-i)}function cE(n,e,t,i,r){let s=(n-e)/(r-e);for(let o=0;o<8;o++){let a=Rb(s,e,t,i,r)-n;if(Math.abs(a)<1e-10)break;let c=aE(s,e,t,i,r);if(Math.abs(c)<1e-10)break;s=Math.max(0,Math.min(1,s-a/c))}return s}var An=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Is(t,this.TimeBufferType),this.values=Is(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Is(e.times,Array),values:Is(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r),Pg(e.settings)&&(i.settings={inTangents:Is(e.settings.inTangents,Array),outTangents:Is(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new Cu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ru(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Au(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Pu(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case ea:t=this.InterpolantFactoryMethodDiscrete;break;case du:t=this.InterpolantFactoryMethodLinear;break;case tu:t=this.InterpolantFactoryMethodSmooth;break;case Ng:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return qe("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ea;case this.InterpolantFactoryMethodLinear:return du;case this.InterpolantFactoryMethodSmooth:return tu;case this.InterpolantFactoryMethodBezier:return Ng}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e;Pg(this.settings)&&(Dy(this.settings.inTangents,e),Dy(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,r=i.length,s=0,o=r-1;for(;s!==r&&i[s]<e;)++s;for(;o!==-1&&i[o]>t;)--o;if(++o,s!==0||o!==r){s>=o&&(o=Math.max(o,1),s=o-1);let a=this.getValueSize();this.times=i.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Je("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Je("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==s;a++){let c=i[a];if(typeof c=="number"&&isNaN(c)){Je("KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){Je("KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(r!==void 0&&jw(r))for(let a=0,c=r.length;a!==c;++a){let l=r[a];if(isNaN(l)){Je("KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===tu,s=e.length-1,o=1;for(let a=1;a<s;++a){let c=!1,l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(r)c=!0;else{let d=a*i,h=d-i,f=d+i;for(let p=0;p!==i;++p){let y=t[d+p];if(y!==t[h+p]||y!==t[f+p]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let d=a*i,h=o*i;for(let f=0;f!==i;++f)t[h+f]=t[d+f]}++o}}if(s>0){e[o]=e[s];for(let a=s*i,c=o*i,l=0;l!==i;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,Pg(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Dy(n,e){for(let t=0,i=n.length;t!==i;t+=2)n[t]*=e}An.prototype.ValueTypeName="";An.prototype.TimeBufferType=Float32Array;An.prototype.ValueBufferType=Float32Array;An.prototype.DefaultInterpolation=du;var ji=class extends An{constructor(e,t,i){super(e,t,i)}};ji.prototype.ValueTypeName="bool";ji.prototype.ValueBufferType=Array;ji.prototype.DefaultInterpolation=ea;ji.prototype.InterpolantFactoryMethodLinear=void 0;ji.prototype.InterpolantFactoryMethodSmooth=void 0;var Iu=class extends An{constructor(e,t,i,r){super(e,t,i,r)}};Iu.prototype.ValueTypeName="color";var Nu=class extends An{constructor(e,t,i,r){super(e,t,i,r)}};Nu.prototype.ValueTypeName="number";var Du=class extends Ji{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(i-t)/(r-t),l=e*a;for(let u=l+a;l!==u;l+=4)mn.slerpFlat(s,0,o,l-a,o,l,c);return s}},Ea=class extends An{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new Du(this.times,this.values,this.getValueSize(),e)}};Ea.prototype.ValueTypeName="quaternion";Ea.prototype.InterpolantFactoryMethodSmooth=void 0;var Ki=class extends An{constructor(e,t,i){super(e,t,i)}};Ki.prototype.ValueTypeName="string";Ki.prototype.ValueBufferType=Array;Ki.prototype.DefaultInterpolation=ea;Ki.prototype.InterpolantFactoryMethodLinear=void 0;Ki.prototype.InterpolantFactoryMethodSmooth=void 0;var zu=class extends An{constructor(e,t,i,r){super(e,t,i,r)}};zu.prototype.ValueTypeName="vector";var Lu=class{constructor(e,t,i){let r=this,s=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,s===!1&&r.onStart!==void 0&&r.onStart(u,o,a),s=!0},this.itemEnd=function(u){o++,r.onProgress!==void 0&&r.onProgress(u,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,d){return l.push(u,d),this},this.removeHandler=function(u){let d=l.indexOf(u);return d!==-1&&l.splice(d,2),this},this.getHandler=function(u){for(let d=0,h=l.length;d<h;d+=2){let f=l[d],p=l[d+1];if(f.global&&(f.lastIndex=0),f.test(u))return p}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Cb=new Lu,Uu=class{constructor(e){this.manager=e!==void 0?e:Cb,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};Uu.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ta=class extends rn{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ue(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Rr=class extends Ta{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Ue(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},Ig=new Pt,zy=new I,Ly=new I,Ou=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new fe(512,512),this.mapType=bn,this.map=null,this.mapPass=null,this.matrix=new Pt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new $s,this._frameExtents=new fe(1,1),this._viewportCount=1,this._viewports=[new zt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;zy.setFromMatrixPosition(e.matrixWorld),t.position.copy(zy),Ly.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ly),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){Ig.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(Ig,e.coordinateSystem,e.reversedDepth);let s=this._frameExtents,o=r?r.z/s.x:1,a=r?r.w/s.y:1,c=r?r.x/s.x:0,l=r?r.y/s.y:0;e.coordinateSystem===Os||e.reversedDepth?t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),t.multiply(Ig)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},Ql=new I,eu=new mn,ni=new I,Aa=class extends rn{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Pt,this.projectionMatrix=new Pt,this.projectionMatrixInverse=new Pt,this.coordinateSystem=$n,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Ql,eu,ni),ni.x===1&&ni.y===1&&ni.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ql,eu,ni.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(Ql,eu,ni),ni.x===1&&ni.y===1&&ni.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Ql,eu,ni.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},Hi=new I,Uy=new fe,Oy=new fe,qt=class extends Aa{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=ks*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Jo*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ks*2*Math.atan(Math.tan(Jo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){Hi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Hi.x,Hi.y).multiplyScalar(-e/Hi.z),Hi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(Hi.x,Hi.y).multiplyScalar(-e/Hi.z)}getViewSize(e,t){return this.getViewBounds(e,Uy,Oy),t.subVectors(Oy,Uy)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Jo*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,t-=o.offsetY*i/l,r*=o.width/c,i*=o.height/l}let a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var qs=class extends Aa{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,o=i+e,a=r+t,c=r-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},Bg=class extends Ou{constructor(){super(new qs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Cr=class extends Ta{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(rn.DEFAULT_UP),this.updateMatrix(),this.target=new rn,this.shadow=new Bg}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Ns=-90,Ds=1,Fu=class extends rn{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new qt(Ns,Ds,e,t);r.layers=this.layers,this.add(r);let s=new qt(Ns,Ds,e,t);s.layers=this.layers,this.add(s);let o=new qt(Ns,Ds,e,t);o.layers=this.layers,this.add(o);let a=new qt(Ns,Ds,e,t);a.layers=this.layers,this.add(a);let c=new qt(Ns,Ds,e,t);c.layers=this.layers,this.add(c);let l=new qt(Ns,Ds,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,c]=t;for(let l of t)this.remove(l);if(e===$n)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Os)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,o,a,c,l,u]=this.children,d=e.getRenderTarget(),h=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),p=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(d,h,f),e.xr.enabled=p,i.texture.needsPMREMUpdate=!0}},ku=class extends qt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var mx="\\[\\]\\.:\\/",lE=new RegExp("["+mx+"]","g"),gx="[^"+mx+"]",uE="[^"+mx.replace("\\.","")+"]",hE=/((?:WC+[\/:])*)/.source.replace("WC",gx),dE=/(WCOD+)?/.source.replace("WCOD",uE),fE=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",gx),pE=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",gx),mE=new RegExp("^"+hE+dE+fE+pE+"$"),gE=["material","materials","bones","map"],Hg=class{constructor(e,t,i){let r=i||Nt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Nt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(lE,"")}static parseTrackName(e){let t=mE.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);gE.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let o=0;o<s.length;o++){let a=s[o];if(a.name===t||a.uuid===t)return a;let c=i(a.children);if(c)return c}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){qe("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=t.objectIndex;switch(i){case"materials":if(!e.material){Je("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Je("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Je("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Je("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Je("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Je("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(l!==void 0){if(e[l]===void 0){Je("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[r];if(o===void 0){let l=t.nodeName;Je("PropertyBinding: Trying to update property for track: "+l+"."+r+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Je("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Je("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Nt.Composite=Hg;Nt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Nt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Nt.prototype.GetterByBindingType=[Nt.prototype._getValue_direct,Nt.prototype._getValue_array,Nt.prototype._getValue_arrayElement,Nt.prototype._getValue_toArray];Nt.prototype.SetterByBindingTypeAndVersioning=[[Nt.prototype._setValue_direct,Nt.prototype._setValue_direct_setNeedsUpdate,Nt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_array,Nt.prototype._setValue_array_setNeedsUpdate,Nt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_arrayElement,Nt.prototype._setValue_arrayElement_setNeedsUpdate,Nt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_fromArray,Nt.prototype._setValue_fromArray_setNeedsUpdate,Nt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var gD=new Float32Array(1);var Gg=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function xx(n,e,t,i){let r=xE(i);switch(t){case cx:return n*e;case Ia:return n*e/r.components*r.byteLength;case Zu:return n*e/r.components*r.byteLength;case ir:return n*e*2/r.components*r.byteLength;case Xu:return n*e*2/r.components*r.byteLength;case lx:return n*e*3/r.components*r.byteLength;case Ln:return n*e*4/r.components*r.byteLength;case qu:return n*e*4/r.components*r.byteLength;case Na:case Da:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case za:case La:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ju:case Ku:return Math.max(n,16)*Math.max(e,8)/4;case Yu:case ju:return Math.max(n,8)*Math.max(e,8)/2;case Qu:case eh:case nh:case ih:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case th:case Ua:case rh:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case sh:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case oh:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case ah:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case ch:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case lh:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case uh:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case hh:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case dh:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case fh:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case ph:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case mh:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case gh:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case xh:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case _h:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case vh:case yh:case bh:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Sh:case Mh:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Oa:case wh:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function xE(n){switch(n){case bn:case rx:return{byteLength:1,components:1};case js:case sx:case qn:return{byteLength:2,components:1};case $u:case Wu:return{byteLength:2,components:4};case Zn:case Vu:case Xn:return{byteLength:4,components:1};case ox:case ax:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?qe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function jb(){let n=null,e=!1,t=null,i=null;function r(s,o){i=n.requestAnimationFrame(r),t(s,o)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function EE(n){let e=new WeakMap;function t(a,c){let l=a.array,u=a.usage,d=l.byteLength,h=n.createBuffer();n.bindBuffer(c,h),n.bufferData(c,l,u),a.onUploadCallback();let f;if(l instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=n.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=n.SHORT;else if(l instanceof Uint32Array)f=n.UNSIGNED_INT;else if(l instanceof Int32Array)f=n.INT;else if(l instanceof Int8Array)f=n.BYTE;else if(l instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:h,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:d}}function i(a,c,l){let u=c.array,d=c.updateRanges;if(n.bindBuffer(l,a),d.length===0)n.bufferSubData(l,0,u);else{d.sort((f,p)=>f.start-p.start);let h=0;for(let f=1;f<d.length;f++){let p=d[h],y=d[f];y.start<=p.start+p.count+1?p.count=Math.max(p.count,y.start+y.count-p.start):(++h,d[h]=y)}d.length=h+1;for(let f=0,p=d.length;f<p;f++){let y=d[f];n.bufferSubData(l,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var TE=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,AE=`#ifdef USE_ALPHAHASH
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
#endif`,RE=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,CE=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,PE=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,IE=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,NE=`#ifdef USE_AOMAP
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
#endif`,DE=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,zE=`#ifdef USE_BATCHING
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
#endif`,LE=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,UE=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,OE=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,FE=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,kE=`#ifdef USE_IRIDESCENCE
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
#endif`,BE=`#ifdef USE_BUMPMAP
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
#endif`,HE=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,GE=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,VE=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,$E=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,WE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,ZE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,XE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,qE=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,YE=`#define PI 3.141592653589793
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
} // validated`,JE=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,jE=`vec3 transformedNormal = objectNormal;
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
#endif`,KE=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,QE=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,eT=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,tT=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,nT="gl_FragColor = linearToOutputTexel( gl_FragColor );",iT=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,rT=`#ifdef USE_ENVMAP
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
#endif`,sT=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,oT=`#ifdef USE_ENVMAP
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
#endif`,aT=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,cT=`#ifdef USE_ENVMAP
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
#endif`,lT=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,uT=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,hT=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,dT=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,fT=`#ifdef USE_GRADIENTMAP
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
}`,pT=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,mT=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,gT=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,xT=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,_T=`#ifdef USE_ENVMAP
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
#endif`,vT=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,yT=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,bT=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,ST=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,MT=`PhysicalMaterial material;
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
#endif`,wT=`uniform sampler2D dfgLUT;
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
}`,ET=`
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
#endif`,TT=`#if defined( RE_IndirectDiffuse )
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
#endif`,AT=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,RT=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,CT=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,PT=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,IT=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,NT=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,DT=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,zT=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,LT=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,UT=`#if defined( USE_POINTS_UV )
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
#endif`,OT=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,FT=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,kT=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,BT=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,HT=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,GT=`#ifdef USE_MORPHTARGETS
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
#endif`,VT=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,$T=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,WT=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,ZT=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,XT=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,qT=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,YT=`#ifdef USE_NORMALMAP
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
#endif`,JT=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,jT=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,KT=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,QT=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,eA=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,tA=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,nA=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,iA=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,rA=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,sA=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,oA=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,aA=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,cA=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,lA=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,uA=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,hA=`float getShadowMask() {
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
}`,dA=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,fA=`#ifdef USE_SKINNING
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
#endif`,pA=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,mA=`#ifdef USE_SKINNING
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
#endif`,gA=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,xA=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,_A=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,vA=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,yA=`#ifdef USE_TRANSMISSION
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
#endif`,bA=`#ifdef USE_TRANSMISSION
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
#endif`,SA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,MA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,wA=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,EA=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,TA=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,AA=`uniform sampler2D t2D;
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
}`,RA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,CA=`#ifdef ENVMAP_TYPE_CUBE
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
}`,PA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,IA=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,NA=`#include <common>
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
}`,DA=`#if DEPTH_PACKING == 3200
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
}`,zA=`#define DISTANCE
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
}`,LA=`#define DISTANCE
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
}`,UA=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,OA=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,FA=`uniform float scale;
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
}`,kA=`uniform vec3 diffuse;
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
}`,BA=`#include <common>
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
}`,HA=`uniform vec3 diffuse;
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
}`,GA=`#define LAMBERT
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
}`,VA=`#define LAMBERT
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
}`,$A=`#define MATCAP
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
}`,WA=`#define MATCAP
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
}`,ZA=`#define NORMAL
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
}`,XA=`#define NORMAL
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
}`,qA=`#define PHONG
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
}`,YA=`#define PHONG
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
}`,JA=`#define STANDARD
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
}`,jA=`#define STANDARD
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
}`,KA=`#define TOON
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
}`,QA=`#define TOON
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
}`,e2=`uniform float size;
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
}`,t2=`uniform vec3 diffuse;
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
}`,n2=`#include <common>
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
}`,i2=`uniform vec3 color;
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
}`,r2=`uniform float rotation;
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
}`,s2=`uniform vec3 diffuse;
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
}`,st={alphahash_fragment:TE,alphahash_pars_fragment:AE,alphamap_fragment:RE,alphamap_pars_fragment:CE,alphatest_fragment:PE,alphatest_pars_fragment:IE,aomap_fragment:NE,aomap_pars_fragment:DE,batching_pars_vertex:zE,batching_vertex:LE,begin_vertex:UE,beginnormal_vertex:OE,bsdfs:FE,iridescence_fragment:kE,bumpmap_pars_fragment:BE,clipping_planes_fragment:HE,clipping_planes_pars_fragment:GE,clipping_planes_pars_vertex:VE,clipping_planes_vertex:$E,color_fragment:WE,color_pars_fragment:ZE,color_pars_vertex:XE,color_vertex:qE,common:YE,cube_uv_reflection_fragment:JE,defaultnormal_vertex:jE,displacementmap_pars_vertex:KE,displacementmap_vertex:QE,emissivemap_fragment:eT,emissivemap_pars_fragment:tT,colorspace_fragment:nT,colorspace_pars_fragment:iT,envmap_fragment:rT,envmap_common_pars_fragment:sT,envmap_pars_fragment:oT,envmap_pars_vertex:aT,envmap_physical_pars_fragment:_T,envmap_vertex:cT,fog_vertex:lT,fog_pars_vertex:uT,fog_fragment:hT,fog_pars_fragment:dT,gradientmap_pars_fragment:fT,lightmap_pars_fragment:pT,lights_lambert_fragment:mT,lights_lambert_pars_fragment:gT,lights_pars_begin:xT,lights_toon_fragment:vT,lights_toon_pars_fragment:yT,lights_phong_fragment:bT,lights_phong_pars_fragment:ST,lights_physical_fragment:MT,lights_physical_pars_fragment:wT,lights_fragment_begin:ET,lights_fragment_maps:TT,lights_fragment_end:AT,lightprobes_pars_fragment:RT,logdepthbuf_fragment:CT,logdepthbuf_pars_fragment:PT,logdepthbuf_pars_vertex:IT,logdepthbuf_vertex:NT,map_fragment:DT,map_pars_fragment:zT,map_particle_fragment:LT,map_particle_pars_fragment:UT,metalnessmap_fragment:OT,metalnessmap_pars_fragment:FT,morphinstance_vertex:kT,morphcolor_vertex:BT,morphnormal_vertex:HT,morphtarget_pars_vertex:GT,morphtarget_vertex:VT,normal_fragment_begin:$T,normal_fragment_maps:WT,normal_pars_fragment:ZT,normal_pars_vertex:XT,normal_vertex:qT,normalmap_pars_fragment:YT,clearcoat_normal_fragment_begin:JT,clearcoat_normal_fragment_maps:jT,clearcoat_pars_fragment:KT,iridescence_pars_fragment:QT,opaque_fragment:eA,packing:tA,premultiplied_alpha_fragment:nA,project_vertex:iA,dithering_fragment:rA,dithering_pars_fragment:sA,roughnessmap_fragment:oA,roughnessmap_pars_fragment:aA,shadowmap_pars_fragment:cA,shadowmap_pars_vertex:lA,shadowmap_vertex:uA,shadowmask_pars_fragment:hA,skinbase_vertex:dA,skinning_pars_vertex:fA,skinning_vertex:pA,skinnormal_vertex:mA,specularmap_fragment:gA,specularmap_pars_fragment:xA,tonemapping_fragment:_A,tonemapping_pars_fragment:vA,transmission_fragment:yA,transmission_pars_fragment:bA,uv_pars_fragment:SA,uv_pars_vertex:MA,uv_vertex:wA,worldpos_vertex:EA,background_vert:TA,background_frag:AA,backgroundCube_vert:RA,backgroundCube_frag:CA,cube_vert:PA,cube_frag:IA,depth_vert:NA,depth_frag:DA,distance_vert:zA,distance_frag:LA,equirect_vert:UA,equirect_frag:OA,linedashed_vert:FA,linedashed_frag:kA,meshbasic_vert:BA,meshbasic_frag:HA,meshlambert_vert:GA,meshlambert_frag:VA,meshmatcap_vert:$A,meshmatcap_frag:WA,meshnormal_vert:ZA,meshnormal_frag:XA,meshphong_vert:qA,meshphong_frag:YA,meshphysical_vert:JA,meshphysical_frag:jA,meshtoon_vert:KA,meshtoon_frag:QA,points_vert:e2,points_frag:t2,shadow_vert:n2,shadow_frag:i2,sprite_vert:r2,sprite_frag:s2},Me={common:{diffuse:{value:new Ue(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Qe}},envmap:{envMap:{value:null},envMapRotation:{value:new Qe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Qe},normalScale:{value:new fe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ue(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new I},probesMax:{value:new I},probesResolution:{value:new I}},points:{diffuse:{value:new Ue(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0},uvTransform:{value:new Qe}},sprite:{diffuse:{value:new Ue(16777215)},opacity:{value:1},center:{value:new fe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}}},li={basic:{uniforms:on([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:st.meshbasic_vert,fragmentShader:st.meshbasic_frag},lambert:{uniforms:on([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)},envMapIntensity:{value:1}}]),vertexShader:st.meshlambert_vert,fragmentShader:st.meshlambert_frag},phong:{uniforms:on([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)},specular:{value:new Ue(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:st.meshphong_vert,fragmentShader:st.meshphong_frag},standard:{uniforms:on([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag},toon:{uniforms:on([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new Ue(0)}}]),vertexShader:st.meshtoon_vert,fragmentShader:st.meshtoon_frag},matcap:{uniforms:on([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:st.meshmatcap_vert,fragmentShader:st.meshmatcap_frag},points:{uniforms:on([Me.points,Me.fog]),vertexShader:st.points_vert,fragmentShader:st.points_frag},dashed:{uniforms:on([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:st.linedashed_vert,fragmentShader:st.linedashed_frag},depth:{uniforms:on([Me.common,Me.displacementmap]),vertexShader:st.depth_vert,fragmentShader:st.depth_frag},normal:{uniforms:on([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:st.meshnormal_vert,fragmentShader:st.meshnormal_frag},sprite:{uniforms:on([Me.sprite,Me.fog]),vertexShader:st.sprite_vert,fragmentShader:st.sprite_frag},background:{uniforms:{uvTransform:{value:new Qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:st.background_vert,fragmentShader:st.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Qe}},vertexShader:st.backgroundCube_vert,fragmentShader:st.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:st.cube_vert,fragmentShader:st.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:st.equirect_vert,fragmentShader:st.equirect_frag},distance:{uniforms:on([Me.common,Me.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:st.distance_vert,fragmentShader:st.distance_frag},shadow:{uniforms:on([Me.lights,Me.fog,{color:{value:new Ue(0)},opacity:{value:1}}]),vertexShader:st.shadow_vert,fragmentShader:st.shadow_frag}};li.physical={uniforms:on([li.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Qe},clearcoatNormalScale:{value:new fe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Qe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Qe},sheen:{value:0},sheenColor:{value:new Ue(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Qe},transmissionSamplerSize:{value:new fe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Qe},attenuationDistance:{value:0},attenuationColor:{value:new Ue(0)},specularColor:{value:new Ue(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Qe},anisotropyVector:{value:new fe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Qe}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag};var Rh={r:0,b:0,g:0},o2=new Pt,Kb=new Qe;Kb.set(-1,0,0,0,1,0,0,0,1);function a2(n,e,t,i,r,s){let o=new Ue(0),a=r===!0?0:1,c,l,u=null,d=0,h=null;function f(S){let E=S.isScene===!0?S.background:null;if(E&&E.isTexture){let v=S.backgroundBlurriness>0;E=e.get(E,v)}return E}function p(S){let E=!1,v=f(S);v===null?g(o,a):v&&v.isColor&&(g(v,1),E=!0);let M=n.xr.getEnvironmentBlendMode();M==="additive"?t.buffers.color.setClear(0,0,0,1,s):M==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function y(S,E){let v=f(E);v&&(v.isCubeTexture||v.mapping===Ca)?(l===void 0&&(l=new je(new Zi(1,1,1),new sn({name:"BackgroundCubeMaterial",uniforms:Dr(li.backgroundCube.uniforms),vertexShader:li.backgroundCube.vertexShader,fragmentShader:li.backgroundCube.fragmentShader,side:Jt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(M,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=v,l.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(o2.makeRotationFromEuler(E.backgroundRotation)).transpose(),v.isCubeTexture&&v.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Kb),l.material.toneMapped=ut.getTransfer(v.colorSpace)!==yt,(u!==v||d!==v.version||h!==n.toneMapping)&&(l.material.needsUpdate=!0,u=v,d=v.version,h=n.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null)):v&&v.isTexture&&(c===void 0&&(c=new je(new Tr(2,2),new sn({name:"BackgroundMaterial",uniforms:Dr(li.background.uniforms),vertexShader:li.background.vertexShader,fragmentShader:li.background.fragmentShader,side:Qi,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=v,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.toneMapped=ut.getTransfer(v.colorSpace)!==yt,v.matrixAutoUpdate===!0&&v.updateMatrix(),c.material.uniforms.uvTransform.value.copy(v.matrix),(u!==v||d!==v.version||h!==n.toneMapping)&&(c.material.needsUpdate=!0,u=v,d=v.version,h=n.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function g(S,E){S.getRGB(Rh,px(n)),t.buffers.color.setClear(Rh.r,Rh.g,Rh.b,E,s)}function m(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(S,E=1){o.set(S),a=E,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(S){a=S,g(o,a)},render:p,addToRenderList:y,dispose:m}}function c2(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=h(null),s=r,o=!1;function a(D,k,V,z,B){let Z=!1,q=d(D,z,V,k);s!==q&&(s=q,l(s.object)),Z=f(D,z,V,B),Z&&p(D,z,V,B),B!==null&&e.update(B,n.ELEMENT_ARRAY_BUFFER),(Z||o)&&(o=!1,v(D,k,V,z),B!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(B).buffer))}function c(){return n.createVertexArray()}function l(D){return n.bindVertexArray(D)}function u(D){return n.deleteVertexArray(D)}function d(D,k,V,z){let B=z.wireframe===!0,Z=i[k.id];Z===void 0&&(Z={},i[k.id]=Z);let q=D.isInstancedMesh===!0?D.id:0,oe=Z[q];oe===void 0&&(oe={},Z[q]=oe);let Y=oe[V.id];Y===void 0&&(Y={},oe[V.id]=Y);let te=Y[B];return te===void 0&&(te=h(c()),Y[B]=te),te}function h(D){let k=[],V=[],z=[];for(let B=0;B<t;B++)k[B]=0,V[B]=0,z[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:k,enabledAttributes:V,attributeDivisors:z,object:D,attributes:{},index:null}}function f(D,k,V,z){let B=s.attributes,Z=k.attributes,q=0,oe=V.getAttributes();for(let Y in oe)if(oe[Y].location>=0){let ie=B[Y],Le=Z[Y];if(Le===void 0&&(Y==="instanceMatrix"&&D.instanceMatrix&&(Le=D.instanceMatrix),Y==="instanceColor"&&D.instanceColor&&(Le=D.instanceColor)),ie===void 0||ie.attribute!==Le||Le&&ie.data!==Le.data)return!0;q++}return s.attributesNum!==q||s.index!==z}function p(D,k,V,z){let B={},Z=k.attributes,q=0,oe=V.getAttributes();for(let Y in oe)if(oe[Y].location>=0){let ie=Z[Y];ie===void 0&&(Y==="instanceMatrix"&&D.instanceMatrix&&(ie=D.instanceMatrix),Y==="instanceColor"&&D.instanceColor&&(ie=D.instanceColor));let Le={};Le.attribute=ie,ie&&ie.data&&(Le.data=ie.data),B[Y]=Le,q++}s.attributes=B,s.attributesNum=q,s.index=z}function y(){let D=s.newAttributes;for(let k=0,V=D.length;k<V;k++)D[k]=0}function g(D){m(D,0)}function m(D,k){let V=s.newAttributes,z=s.enabledAttributes,B=s.attributeDivisors;V[D]=1,z[D]===0&&(n.enableVertexAttribArray(D),z[D]=1),B[D]!==k&&(n.vertexAttribDivisor(D,k),B[D]=k)}function S(){let D=s.newAttributes,k=s.enabledAttributes;for(let V=0,z=k.length;V<z;V++)k[V]!==D[V]&&(n.disableVertexAttribArray(V),k[V]=0)}function E(D,k,V,z,B,Z,q){q===!0?n.vertexAttribIPointer(D,k,V,B,Z):n.vertexAttribPointer(D,k,V,z,B,Z)}function v(D,k,V,z){y();let B=z.attributes,Z=V.getAttributes(),q=k.defaultAttributeValues;for(let oe in Z){let Y=Z[oe];if(Y.location>=0){let te=B[oe];if(te===void 0&&(oe==="instanceMatrix"&&D.instanceMatrix&&(te=D.instanceMatrix),oe==="instanceColor"&&D.instanceColor&&(te=D.instanceColor)),te!==void 0){let ie=te.normalized,Le=te.itemSize,Ce=e.get(te);if(Ce===void 0)continue;let ct=Ce.buffer,it=Ce.type,ht=Ce.bytesPerElement,j=it===n.INT||it===n.UNSIGNED_INT||te.gpuType===Vu;if(te.isInterleavedBufferAttribute){let ne=te.data,ye=ne.stride,We=te.offset;if(ne.isInstancedInterleavedBuffer){for(let Te=0;Te<Y.locationSize;Te++)m(Y.location+Te,ne.meshPerAttribute);D.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=ne.meshPerAttribute*ne.count)}else for(let Te=0;Te<Y.locationSize;Te++)g(Y.location+Te);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let Te=0;Te<Y.locationSize;Te++)E(Y.location+Te,Le/Y.locationSize,it,ie,ye*ht,(We+Le/Y.locationSize*Te)*ht,j)}else{if(te.isInstancedBufferAttribute){for(let ne=0;ne<Y.locationSize;ne++)m(Y.location+ne,te.meshPerAttribute);D.isInstancedMesh!==!0&&z._maxInstanceCount===void 0&&(z._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let ne=0;ne<Y.locationSize;ne++)g(Y.location+ne);n.bindBuffer(n.ARRAY_BUFFER,ct);for(let ne=0;ne<Y.locationSize;ne++)E(Y.location+ne,Le/Y.locationSize,it,ie,Le*ht,Le/Y.locationSize*ne*ht,j)}}else if(q!==void 0){let ie=q[oe];if(ie!==void 0)switch(ie.length){case 2:n.vertexAttrib2fv(Y.location,ie);break;case 3:n.vertexAttrib3fv(Y.location,ie);break;case 4:n.vertexAttrib4fv(Y.location,ie);break;default:n.vertexAttrib1fv(Y.location,ie)}}}}S()}function M(){T();for(let D in i){let k=i[D];for(let V in k){let z=k[V];for(let B in z){let Z=z[B];for(let q in Z)u(Z[q].object),delete Z[q];delete z[B]}}delete i[D]}}function w(D){if(i[D.id]===void 0)return;let k=i[D.id];for(let V in k){let z=k[V];for(let B in z){let Z=z[B];for(let q in Z)u(Z[q].object),delete Z[q];delete z[B]}}delete i[D.id]}function C(D){for(let k in i){let V=i[k];for(let z in V){let B=V[z];if(B[D.id]===void 0)continue;let Z=B[D.id];for(let q in Z)u(Z[q].object),delete Z[q];delete B[D.id]}}}function _(D){for(let k in i){let V=i[k],z=D.isInstancedMesh===!0?D.id:0,B=V[z];if(B!==void 0){for(let Z in B){let q=B[Z];for(let oe in q)u(q[oe].object),delete q[oe];delete B[Z]}delete V[z],Object.keys(V).length===0&&delete i[k]}}}function T(){P(),o=!0,s!==r&&(s=r,l(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:T,resetDefaultState:P,dispose:M,releaseStatesOfGeometry:w,releaseStatesOfObject:_,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:g,disableUnusedAttributes:S}}function l2(n,e,t){let i;function r(c){i=c}function s(c,l){n.drawArrays(i,c,l),t.update(l,i,1)}function o(c,l,u){u!==0&&(n.drawArraysInstanced(i,c,l,u),t.update(l,i,u))}function a(c,l,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let h=0;for(let f=0;f<u;f++)h+=l[f];t.update(h,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function u2(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(C){return!(C!==Ln&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let _=C===qn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==bn&&C!==Xn&&!_&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function c(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",u=c(l);u!==l&&(qe("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);let d=t.logarithmicDepthBuffer===!0,h=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&h===!1&&qe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),p=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),m=n.getParameter(n.MAX_VERTEX_ATTRIBS),S=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),E=n.getParameter(n.MAX_VARYING_VECTORS),v=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),M=n.getParameter(n.MAX_SAMPLES),w=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:h,maxTextures:f,maxVertexTextures:p,maxTextureSize:y,maxCubemapSize:g,maxAttributes:m,maxVertexUniforms:S,maxVaryings:E,maxFragmentUniforms:v,maxSamples:M,samples:w}}function h2(n){let e=this,t=null,i=0,r=!1,s=!1,o=new Vn,a=new Qe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,h){let f=d.length!==0||h||i!==0||r;return r=h,i=d.length,f},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(d,h){t=u(d,h,0)},this.setState=function(d,h,f){let p=d.clippingPlanes,y=d.clipIntersection,g=d.clipShadows,m=n.get(d);if(!r||p===null||p.length===0||s&&!g)s?u(null):l();else{let S=s?0:i,E=S*4,v=m.clippingState||null;c.value=v,v=u(p,h,E,f);for(let M=0;M!==E;++M)v[M]=t[M];m.clippingState=v,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=S}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(d,h,f,p){let y=d!==null?d.length:0,g=null;if(y!==0){if(g=c.value,p!==!0||g===null){let m=f+y*4,S=h.matrixWorldInverse;a.getNormalMatrix(S),(g===null||g.length<m)&&(g=new Float32Array(m));for(let E=0,v=f;E!==y;++E,v+=4)o.copy(d[E]).applyMatrix4(S,a),o.normal.toArray(g,v),g[v+3]=o.constant}c.value=g,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,g}}var eo=4,d2=6,f2=20,p2=256,Fa=new qs,Pb=new Ue,_x=null,vx=0,yx=0,bx=!1,m2=new I,zr=new I,Ph=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:o=256,position:a=m2}=s;_x=this._renderer.getRenderTarget(),vx=this._renderer.getActiveCubeFace(),yx=this._renderer.getActiveMipmapLevel(),bx=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Db(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Nb(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(_x,vx,yx),this._renderer.xr.enabled=bx,e.scissorTest=!1,Qs(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===er||e.mapping===Ir?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),_x=this._renderer.getRenderTarget(),vx=this._renderer.getActiveCubeFace(),yx=this._renderer.getActiveMipmapLevel(),bx=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:Yt,minFilter:Yt,generateMipmaps:!1,type:qn,format:Ln,colorSpace:ta,depthBuffer:!1},r=Ib(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Ib(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=g2(s)),this._blurMaterial=_2(s,e,t),this._ggxMaterial=x2(s,e,t)}return r}_compileMaterial(e){let t=new je(new Vt,e);this._renderer.compile(t,Fa)}_sceneToCubeUV(e,t,i,r,s){let c=new qt(90,1,t,i),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],d=this._renderer,h=d.autoClear,f=d.toneMapping;d.getClearColor(Pb),d.toneMapping=Wn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(r),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new je(new Zi,new yn({name:"PMREM.Background",side:Jt,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,g=y.material,m=!1,S=e.background;S?S.isColor&&(g.color.copy(S),e.background=null,m=!0):(g.color.copy(Pb),m=!0);for(let E=0;E<6;E++){let v=E%3;v===0?(c.up.set(0,l[E],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+u[E],s.y,s.z)):v===1?(c.up.set(0,0,l[E]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+u[E],s.z)):(c.up.set(0,l[E],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+u[E]));let M=this._cubeSize;Qs(r,v*M,E>2?M:0,M,M),d.setRenderTarget(r),m&&d.render(y,c),d.render(e,c)}d.toneMapping=f,d.autoClear=h,e.background=S}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===er||e.mapping===Ir;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=Db()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Nb());let s=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;let a=s.uniforms;a.envMap.value=e;let c=this._cubeSize;Qs(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(o,Fa)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let c=o.uniforms,l=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),d=Math.sqrt(l*l-u*u),h=l*1.25,f=d*h,{_lodMax:p}=this,y=this._sizeLods[i],g=3*y*(i>p-eo?i-p+eo:0),m=4*(this._cubeSize-y);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=p-t,Qs(s,g,m,3*y,2*y),r.setRenderTarget(s),r.render(a,Fa),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=p-i,Qs(e,g,m,3*y,2*y),r.setRenderTarget(e),r.render(a,Fa)}_blur(e,t,i,r){let s=this._pingPongRenderTarget,o=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,i,o),this._blurPass(s,e,i,i,o)}_blurPass(e,t,i,r,s){let o=this._renderer,a=this._blurMaterial,c=this._lodMeshes[r];c.material=a;let l=a.uniforms;l.envMap.value=e.texture,l.sigma.value=s,l.mipInt.value=this._lodMax-i;let u=this._sizeLods[r],d=3*u*(r>this._lodMax-eo?r-this._lodMax+eo:0),h=4*(this._cubeSize-u);Qs(t,d,h,3*u,2*u),o.setRenderTarget(t),o.render(c,Fa)}};function g2(n){let e=[],t=[],i=n,r=n-eo+1+d2;for(let s=0;s<r;s++){let o=Math.pow(2,i);e.push(o);let a=1/(o-2),c=-a,l=1+a,u=[c,c,l,c,l,l,c,c,l,l,c,l],d=6,h=6,f=3,p=new Float32Array(f*h*d),y=new Float32Array(f*h*d);for(let m=0;m<d;m++){let S=m%3*2/3-1,E=m>2?0:-1,v=[S,E,0,S+2/3,E,0,S+2/3,E+1,0,S,E,0,S+2/3,E+1,0,S,E+1,0];p.set(v,f*h*m);for(let M=0;M<h;M++){let w=u[M*2]*2-1,C=u[M*2+1]*2-1;m===0?zr.set(1,C,w):m===1?zr.set(-w,1,-C):m===2?zr.set(-w,C,1):m===3?zr.set(-1,C,-w):m===4?zr.set(-w,-1,C):zr.set(w,C,-1),zr.toArray(y,(m*h+M)*f)}}let g=new Vt;g.setAttribute("position",new tn(p,f)),g.setAttribute("outputDirection",new tn(y,f)),t.push(new je(g,null)),i>eo&&i--}return{lodMeshes:t,sizeLods:e}}function Ib(n,e,t){let i=new nn(n,e,t);return i.texture.mapping=Ca,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function Qs(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function x2(n,e,t){return new sn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:p2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:Dh(),fragmentShader:`

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
		`,blending:ai,depthTest:!1,depthWrite:!1})}function _2(n,e,t){return new sn({name:"SphericalGaussianBlur",defines:{SAMPLES:f2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:Dh(),fragmentShader:`

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
		`,blending:ai,depthTest:!1,depthWrite:!1})}function Nb(){return new sn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Dh(),fragmentShader:`

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
		`,blending:ai,depthTest:!1,depthWrite:!1})}function Db(){return new sn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Dh(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:ai,depthTest:!1,depthWrite:!1})}function Dh(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Ih=class extends nn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new la(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new Zi(5,5,5),s=new sn({name:"CubemapFromEquirect",uniforms:Dr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Jt,blending:ai});s.uniforms.tEquirect.value=t;let o=new je(r,s),a=t.minFilter;return t.minFilter===tr&&(t.minFilter=Yt),new Fu(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}};function v2(n){let e=new WeakMap,t=new WeakMap,i=null;function r(h,f=!1){return h==null?null:f?o(h):s(h)}function s(h){if(h&&h.isTexture){let f=h.mapping;if(f===Bu||f===Hu)if(e.has(h)){let p=e.get(h).texture;return a(p,h.mapping)}else{let p=h.image;if(p&&p.height>0){let y=new Ih(p.height);return y.fromEquirectangularTexture(n,h),e.set(h,y),h.addEventListener("dispose",l),a(y.texture,h.mapping)}else return null}}return h}function o(h){if(h&&h.isTexture){let f=h.mapping,p=f===Bu||f===Hu,y=f===er||f===Ir;if(p||y){let g=t.get(h),m=g!==void 0?g.texture.pmremVersion:0;if(h.isRenderTargetTexture&&h.pmremVersion!==m)return i===null&&(i=new Ph(n)),g=p?i.fromEquirectangular(h,g):i.fromCubemap(h,g),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),g.texture;if(g!==void 0)return g.texture;{let S=h.image;return p&&S&&S.height>0||y&&S&&c(S)?(i===null&&(i=new Ph(n)),g=p?i.fromEquirectangular(h):i.fromCubemap(h),g.texture.pmremVersion=h.pmremVersion,t.set(h,g),h.addEventListener("dispose",u),g.texture):null}}}return h}function a(h,f){return f===Bu?h.mapping=er:f===Hu&&(h.mapping=Ir),h}function c(h){let f=0,p=6;for(let y=0;y<p;y++)h[y]!==void 0&&f++;return f===p}function l(h){let f=h.target;f.removeEventListener("dispose",l);let p=e.get(f);p!==void 0&&(e.delete(f),p.dispose())}function u(h){let f=h.target;f.removeEventListener("dispose",u);let p=t.get(f);p!==void 0&&(t.delete(f),p.dispose())}function d(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:d}}function y2(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Mr("WebGLRenderer: "+i+" extension not supported."),r}}}function b2(n,e,t,i){let r={},s=new WeakMap;function o(d){let h=d.target;h.index!==null&&e.remove(h.index);for(let p in h.attributes)e.remove(h.attributes[p]);h.removeEventListener("dispose",o),delete r[h.id];let f=s.get(h);f&&(e.remove(f),s.delete(h)),i.releaseStatesOfGeometry(h),h.isInstancedBufferGeometry===!0&&delete h._maxInstanceCount,t.memory.geometries--}function a(d,h){return r[h.id]===!0||(h.addEventListener("dispose",o),r[h.id]=!0,t.memory.geometries++),h}function c(d){let h=d.attributes;for(let f in h)e.update(h[f],n.ARRAY_BUFFER)}function l(d){let h=[],f=d.index,p=d.attributes.position,y=0;if(p===void 0)return;if(f!==null){let S=f.array;y=f.version;for(let E=0,v=S.length;E<v;E+=3){let M=S[E+0],w=S[E+1],C=S[E+2];h.push(M,w,w,C,C,M)}}else{let S=p.array;y=p.version;for(let E=0,v=S.length/3-1;E<v;E+=3){let M=E+0,w=E+1,C=E+2;h.push(M,w,w,C,C,M)}}let g=new(p.count>=65535?ca:aa)(h,1);g.version=y;let m=s.get(d);m&&e.remove(m),s.set(d,g)}function u(d){let h=s.get(d);if(h){let f=d.index;f!==null&&h.version<f.version&&l(d)}else l(d);return s.get(d)}return{get:a,update:c,getWireframeAttribute:u}}function S2(n,e,t){let i;function r(d){i=d}let s,o;function a(d){s=d.type,o=d.bytesPerElement}function c(d,h){n.drawElements(i,h,s,d*o),t.update(h,i,1)}function l(d,h,f){f!==0&&(n.drawElementsInstanced(i,h,s,d*o,f),t.update(h,i,f))}function u(d,h,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,h,0,s,d,0,f);let y=0;for(let g=0;g<f;g++)y+=h[g];t.update(y,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function M2(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:Je("WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function w2(n,e,t){let i=new WeakMap,r=new zt;function s(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=u!==void 0?u.length:0,h=i.get(a);if(h===void 0||h.count!==d){let T=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",T)};h!==void 0&&h.texture.dispose();let f=a.morphAttributes.position!==void 0,p=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],m=a.morphAttributes.normal||[],S=a.morphAttributes.color||[],E=0;f===!0&&(E=1),p===!0&&(E=2),y===!0&&(E=3);let v=a.attributes.position.count*E,M=1;v>e.maxTextureSize&&(M=Math.ceil(v/e.maxTextureSize),v=e.maxTextureSize);let w=new Float32Array(v*M*4*d),C=new ra(w,v,M,d);C.type=Xn,C.needsUpdate=!0;let _=E*4;for(let P=0;P<d;P++){let D=g[P],k=m[P],V=S[P],z=v*M*4*P;for(let B=0;B<D.count;B++){let Z=B*_;f===!0&&(r.fromBufferAttribute(D,B),w[z+Z+0]=r.x,w[z+Z+1]=r.y,w[z+Z+2]=r.z,w[z+Z+3]=0),p===!0&&(r.fromBufferAttribute(k,B),w[z+Z+4]=r.x,w[z+Z+5]=r.y,w[z+Z+6]=r.z,w[z+Z+7]=0),y===!0&&(r.fromBufferAttribute(V,B),w[z+Z+8]=r.x,w[z+Z+9]=r.y,w[z+Z+10]=r.z,w[z+Z+11]=V.itemSize===4?r.w:1)}}h={count:d,texture:C,size:new fe(v,M)},i.set(a,h),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let y=0;y<l.length;y++)f+=l[y];let p=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(n,"morphTargetBaseInfluence",p),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",h.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",h.size)}return{update:s}}function E2(n,e,t,i,r){let s=new WeakMap;function o(l){let u=r.render.frame,d=l.geometry,h=e.get(l,d);if(s.get(h)!==u&&(e.update(h),s.set(h,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==u&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,u))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==u&&(f.update(),s.set(f,u))}return h}function a(){s=new WeakMap}function c(l){let u=l.target;u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}var T2={[Jg]:"LINEAR_TONE_MAPPING",[jg]:"REINHARD_TONE_MAPPING",[Kg]:"CINEON_TONE_MAPPING",[Qg]:"ACES_FILMIC_TONE_MAPPING",[tx]:"AGX_TONE_MAPPING",[nx]:"NEUTRAL_TONE_MAPPING",[ex]:"CUSTOM_TONE_MAPPING"};function A2(n,e,t,i,r,s){let o=new nn(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new Vt;l.setAttribute("position",new pt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new pt([0,2,0,0,2,0],2));let u=new wu({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),d=new je(l,u),h=new qs(-1,1,1,-1,0,1),f=null,p=null,y=!1,g,m=null,S=[],E=!1;this.setSize=function(v,M){o.setSize(v,M),a!==null&&a.setSize(v,M),c!==null&&c.setSize(v,M);for(let w=0;w<S.length;w++){let C=S[w];C.setSize&&C.setSize(v,M)}},this.setEffects=function(v){S=v,E=S.length>0&&S[0].isRenderPass===!0;let M=o.width,w=o.height;S.length>0&&a===null&&(a=new nn(M,w,{type:qn,depthBuffer:!1,stencilBuffer:!1}),c=new nn(M,w,{type:qn,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<S.length;C++){let _=S[C];_.setSize&&_.setSize(M,w)}},this.begin=function(v,M){if(y||v.toneMapping===Wn&&S.length===0)return!1;if(m=M,M!==null){let w=M.width,C=M.height;(o.width!==w||o.height!==C)&&this.setSize(w,C)}return E===!1&&v.setRenderTarget(o),g=v.toneMapping,v.toneMapping=Wn,!0},this.hasRenderPass=function(){return E},this.end=function(v,M){v.toneMapping=g,y=!0;let w=o,C=a;for(let _=0;_<S.length;_++){let T=S[_];T.enabled!==!1&&(T.render(v,C,w,M),T.needsSwap!==!1&&(w=C,C=C===a?c:a))}if(f!==v.outputColorSpace||p!==v.toneMapping){f=v.outputColorSpace,p=v.toneMapping,u.defines={},ut.getTransfer(f)===yt&&(u.defines.SRGB_TRANSFER="");let _=T2[p];_&&(u.defines[_]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=w.texture,v.setRenderTarget(m),v.render(d,h),m=null,y=!1},this.isCompositing=function(){return y},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var Qb=new vn,wx=new Wi(1,1),eS=new ra,tS=new mu,nS=new la,zb=[],Lb=[],Ub=new Float32Array(16),Ob=new Float32Array(9),Fb=new Float32Array(4);function no(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=zb[r];if(s===void 0&&(s=new Float32Array(r),zb[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function $t(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Wt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function zh(n,e){let t=Lb[e];t===void 0&&(t=new Int32Array(e),Lb[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function R2(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function C2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if($t(t,e))return;n.uniform2fv(this.addr,e),Wt(t,e)}}function P2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if($t(t,e))return;n.uniform3fv(this.addr,e),Wt(t,e)}}function I2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if($t(t,e))return;n.uniform4fv(this.addr,e),Wt(t,e)}}function N2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if($t(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Wt(t,e)}else{if($t(t,i))return;Fb.set(i),n.uniformMatrix2fv(this.addr,!1,Fb),Wt(t,i)}}function D2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if($t(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Wt(t,e)}else{if($t(t,i))return;Ob.set(i),n.uniformMatrix3fv(this.addr,!1,Ob),Wt(t,i)}}function z2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if($t(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Wt(t,e)}else{if($t(t,i))return;Ub.set(i),n.uniformMatrix4fv(this.addr,!1,Ub),Wt(t,i)}}function L2(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function U2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if($t(t,e))return;n.uniform2iv(this.addr,e),Wt(t,e)}}function O2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if($t(t,e))return;n.uniform3iv(this.addr,e),Wt(t,e)}}function F2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if($t(t,e))return;n.uniform4iv(this.addr,e),Wt(t,e)}}function k2(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function B2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if($t(t,e))return;n.uniform2uiv(this.addr,e),Wt(t,e)}}function H2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if($t(t,e))return;n.uniform3uiv(this.addr,e),Wt(t,e)}}function G2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if($t(t,e))return;n.uniform4uiv(this.addr,e),Wt(t,e)}}function V2(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(wx.compareFunction=t.isReversedDepthBuffer()?Ah:Th,s=wx):s=Qb,t.setTexture2D(e||s,r)}function $2(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||tS,r)}function W2(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||nS,r)}function Z2(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||eS,r)}function X2(n){switch(n){case 5126:return R2;case 35664:return C2;case 35665:return P2;case 35666:return I2;case 35674:return N2;case 35675:return D2;case 35676:return z2;case 5124:case 35670:return L2;case 35667:case 35671:return U2;case 35668:case 35672:return O2;case 35669:case 35673:return F2;case 5125:return k2;case 36294:return B2;case 36295:return H2;case 36296:return G2;case 35678:case 36198:case 36298:case 36306:case 35682:return V2;case 35679:case 36299:case 36307:return $2;case 35680:case 36300:case 36308:case 36293:return W2;case 36289:case 36303:case 36311:case 36292:return Z2}}function q2(n,e){n.uniform1fv(this.addr,e)}function Y2(n,e){let t=no(e,this.size,2);n.uniform2fv(this.addr,t)}function J2(n,e){let t=no(e,this.size,3);n.uniform3fv(this.addr,t)}function j2(n,e){let t=no(e,this.size,4);n.uniform4fv(this.addr,t)}function K2(n,e){let t=no(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function Q2(n,e){let t=no(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function eR(n,e){let t=no(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function tR(n,e){n.uniform1iv(this.addr,e)}function nR(n,e){n.uniform2iv(this.addr,e)}function iR(n,e){n.uniform3iv(this.addr,e)}function rR(n,e){n.uniform4iv(this.addr,e)}function sR(n,e){n.uniform1uiv(this.addr,e)}function oR(n,e){n.uniform2uiv(this.addr,e)}function aR(n,e){n.uniform3uiv(this.addr,e)}function cR(n,e){n.uniform4uiv(this.addr,e)}function lR(n,e,t){let i=this.cache,r=e.length,s=zh(t,r);$t(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));let o;this.type===n.SAMPLER_2D_SHADOW?o=wx:o=Qb;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||o,s[a])}function uR(n,e,t){let i=this.cache,r=e.length,s=zh(t,r);$t(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||tS,s[o])}function hR(n,e,t){let i=this.cache,r=e.length,s=zh(t,r);$t(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||nS,s[o])}function dR(n,e,t){let i=this.cache,r=e.length,s=zh(t,r);$t(i,s)||(n.uniform1iv(this.addr,s),Wt(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||eS,s[o])}function fR(n){switch(n){case 5126:return q2;case 35664:return Y2;case 35665:return J2;case 35666:return j2;case 35674:return K2;case 35675:return Q2;case 35676:return eR;case 5124:case 35670:return tR;case 35667:case 35671:return nR;case 35668:case 35672:return iR;case 35669:case 35673:return rR;case 5125:return sR;case 36294:return oR;case 36295:return aR;case 36296:return cR;case 35678:case 36198:case 36298:case 36306:case 35682:return lR;case 35679:case 36299:case 36307:return uR;case 35680:case 36300:case 36308:case 36293:return hR;case 36289:case 36303:case 36311:case 36292:return dR}}var Ex=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=X2(t.type)}},Tx=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=fR(t.type)}},Ax=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,o=r.length;s!==o;++s){let a=r[s];a.setValue(e,t[a.id],i)}}},Sx=/(\w+)(\])?(\[|\.)?/g;function kb(n,e){n.seq.push(e),n.map[e.id]=e}function pR(n,e,t){let i=n.name,r=i.length;for(Sx.lastIndex=0;;){let s=Sx.exec(i),o=Sx.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){kb(t,l===void 0?new Ex(a,n,e):new Tx(a,n,e));break}else{let d=t.map[a];d===void 0&&(d=new Ax(a),kb(t,d)),t=d}}}var to=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=e.getActiveUniform(t,o),c=e.getUniformLocation(t,a.name);pR(a,c,this)}let r=[],s=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(o):s.push(o);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){let a=t[s],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let o=e[r];o.id in t&&i.push(o)}return i}};function Bb(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var mR=37297,gR=0;function xR(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var Hb=new Qe;function _R(n){ut._getMatrix(Hb,ut.workingColorSpace,n);let e=`mat3( ${Hb.elements.map(t=>t.toFixed(4))} )`;switch(ut.getTransfer(n)){case na:return[e,"LinearTransferOETF"];case yt:return[e,"sRGBTransferOETF"];default:return qe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function Gb(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+xR(n.getShaderSource(e),a)}else return s}function vR(n,e){let t=_R(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var yR={[Jg]:"Linear",[jg]:"Reinhard",[Kg]:"Cineon",[Qg]:"ACESFilmic",[tx]:"AgX",[nx]:"Neutral",[ex]:"Custom"};function bR(n,e){let t=yR[e];return t===void 0?(qe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Ch=new I;function SR(){ut.getLuminanceCoefficients(Ch);let n=Ch.x.toFixed(4),e=Ch.y.toFixed(4),t=Ch.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function MR(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Ba).join(`
`)}function wR(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function ER(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),o=s.name,a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function Ba(n){return n!==""}function Vb(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function $b(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var TR=/^[ \t]*#include +<([\w\d./]+)>/gm;function Rx(n){return n.replace(TR,RR)}var AR=new Map;function RR(n,e){let t=st[e];if(t===void 0){let i=AR.get(e);if(i!==void 0)t=st[i],qe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return Rx(t)}var CR=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Wb(n){return n.replace(CR,PR)}function PR(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Zb(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var IR={[Ra]:"SHADOWMAP_TYPE_PCF",[Ys]:"SHADOWMAP_TYPE_VSM"};function NR(n){return IR[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var DR={[er]:"ENVMAP_TYPE_CUBE",[Ir]:"ENVMAP_TYPE_CUBE",[Ca]:"ENVMAP_TYPE_CUBE_UV"};function zR(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":DR[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var LR={[Ir]:"ENVMAP_MODE_REFRACTION"};function UR(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":LR[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var OR={[Yg]:"ENVMAP_BLENDING_MULTIPLY",[sb]:"ENVMAP_BLENDING_MIX",[ob]:"ENVMAP_BLENDING_ADD"};function FR(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":OR[n.combine]||"ENVMAP_BLENDING_NONE"}function kR(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function BR(n,e,t,i){let r=n.getContext(),s=t.defines,o=t.vertexShader,a=t.fragmentShader,c=NR(t),l=zR(t),u=UR(t),d=FR(t),h=kR(t),f=MR(t),p=wR(s),y=r.createProgram(),g,m,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(Ba).join(`
`),g.length>0&&(g+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p].filter(Ba).join(`
`),m.length>0&&(m+=`
`)):(g=[Zb(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Ba).join(`
`),m=[Zb(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,p,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+d:"",h?"#define CUBEUV_TEXEL_WIDTH "+h.texelWidth:"",h?"#define CUBEUV_TEXEL_HEIGHT "+h.texelHeight:"",h?"#define CUBEUV_MAX_MIP "+h.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Wn?"#define TONE_MAPPING":"",t.toneMapping!==Wn?st.tonemapping_pars_fragment:"",t.toneMapping!==Wn?bR("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",st.colorspace_pars_fragment,vR("linearToOutputTexel",t.outputColorSpace),SR(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Ba).join(`
`)),o=Rx(o),o=Vb(o,t),o=$b(o,t),a=Rx(a),a=Vb(a,t),a=$b(a,t),o=Wb(o),a=Wb(a),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,m=["#define varying in",t.glslVersion===ux?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ux?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);let E=S+g+o,v=S+m+a,M=Bb(r,r.VERTEX_SHADER,E),w=Bb(r,r.FRAGMENT_SHADER,v);r.attachShader(y,M),r.attachShader(y,w),t.index0AttributeName!==void 0?r.bindAttribLocation(y,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function C(D){if(n.debug.checkShaderErrors){let k=r.getProgramInfoLog(y)||"",V=r.getShaderInfoLog(M)||"",z=r.getShaderInfoLog(w)||"",B=k.trim(),Z=V.trim(),q=z.trim(),oe=!0,Y=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if(oe=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,y,M,w);else{let te=Gb(r,M,"vertex"),ie=Gb(r,w,"fragment");Je("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+B+`
`+te+`
`+ie)}else B!==""?qe("WebGLProgram: Program Info Log:",B):(Z===""||q==="")&&(Y=!1);Y&&(D.diagnostics={runnable:oe,programLog:B,vertexShader:{log:Z,prefix:g},fragmentShader:{log:q,prefix:m}})}r.deleteShader(M),r.deleteShader(w),_=new to(r,y),T=ER(r,y)}let _;this.getUniforms=function(){return _===void 0&&C(this),_};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=r.getProgramParameter(y,mR)),P},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=gR++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=M,this.fragmentShader=w,this}var HR=0,Cx=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new Px(e),t.set(e,i)),i}},Px=class{constructor(e){this.id=HR++,this.code=e,this.usedTimes=0}};function GR(n){return n===ir||n===Ua||n===Oa}function VR(n,e,t,i,r,s){let o=new sa,a=new Cx,c=new Set,l=[],u=new Map,d=i.logarithmicDepthBuffer,h=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(_){return c.add(_),_===0?"uv":`uv${_}`}function y(_,T,P,D,k,V){let z=D.fog,B=k.geometry,Z=_.isMeshStandardMaterial||_.isMeshLambertMaterial||_.isMeshPhongMaterial?D.environment:null,q=_.isMeshStandardMaterial||_.isMeshLambertMaterial&&!_.envMap||_.isMeshPhongMaterial&&!_.envMap,oe=e.get(_.envMap||Z,q),Y=oe&&oe.mapping===Ca?oe.image.height:null,te=f[_.type];_.precision!==null&&(h=i.getMaxPrecision(_.precision),h!==_.precision&&qe("WebGLProgram.getParameters:",_.precision,"not supported, using",h,"instead."));let ie=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,Le=ie!==void 0?ie.length:0,Ce=0;B.morphAttributes.position!==void 0&&(Ce=1),B.morphAttributes.normal!==void 0&&(Ce=2),B.morphAttributes.color!==void 0&&(Ce=3);let ct,it,ht,j;if(te){let Rt=li[te];ct=Rt.vertexShader,it=Rt.fragmentShader}else{ct=_.vertexShader,it=_.fragmentShader;let Rt=a.getVertexShaderStage(_),xt=a.getFragmentShaderStage(_);a.update(_,Rt,xt),ht=Rt.id,j=xt.id}let ne=n.getRenderTarget(),ye=n.state.buffers.depth.getReversed(),We=k.isInstancedMesh===!0,Te=k.isBatchedMesh===!0,$e=!!_.map,dt=!!_.matcap,re=!!oe,le=!!_.aoMap,ue=!!_.lightMap,W=!!_.bumpMap&&_.wireframe===!1,Q=!!_.normalMap,Pe=!!_.displacementMap,Ne=!!_.emissiveMap,Ve=!!_.metalnessMap,Ze=!!_.roughnessMap,N=_.anisotropy>0,mt=_.clearcoat>0,et=_.dispersion>0,A=_.retroreflectivity>0,x=_.iridescence>0,O=_.sheen>0,$=_.transmission>0,J=N&&!!_.anisotropyMap,pe=mt&&!!_.clearcoatMap,me=mt&&!!_.clearcoatNormalMap,K=mt&&!!_.clearcoatRoughnessMap,se=x&&!!_.iridescenceMap,ge=x&&!!_.iridescenceThicknessMap,Be=O&&!!_.sheenColorMap,be=O&&!!_.sheenRoughnessMap,xe=!!_.specularMap,He=!!_.specularColorMap,Xe=!!_.specularIntensityMap,tt=$&&!!_.transmissionMap,U=$&&!!_.thicknessMap,_e=!!_.gradientMap,ee=!!_.alphaMap,ve=_.alphaTest>0,Ae=!!_.alphaHash,ae=!!_.extensions,Ge=Wn;_.toneMapped&&(ne===null||ne.isXRRenderTarget===!0)&&(Ge=n.toneMapping);let Fe={shaderID:te,shaderType:_.type,shaderName:_.name,vertexShader:ct,fragmentShader:it,defines:_.defines,customVertexShaderID:ht,customFragmentShaderID:j,isRawShaderMaterial:_.isRawShaderMaterial===!0,glslVersion:_.glslVersion,precision:h,batching:Te,batchingColor:Te&&k._colorsTexture!==null,instancing:We,instancingColor:We&&k.instanceColor!==null,instancingMorph:We&&k.morphTexture!==null,outputColorSpace:ne===null?n.outputColorSpace:ne.isXRRenderTarget===!0?ne.texture.colorSpace:ut.workingColorSpace,alphaToCoverage:!!_.alphaToCoverage,map:$e,matcap:dt,envMap:re,envMapMode:re&&oe.mapping,envMapCubeUVHeight:Y,aoMap:le,lightMap:ue,bumpMap:W,normalMap:Q,displacementMap:Pe,emissiveMap:Ne,normalMapObjectSpace:Q&&_.normalMapType===lb,normalMapTangentSpace:Q&&_.normalMapType===Eh,packedNormalMap:Q&&_.normalMapType===Eh&&GR(_.normalMap.format),metalnessMap:Ve,roughnessMap:Ze,anisotropy:N,anisotropyMap:J,clearcoat:mt,clearcoatMap:pe,clearcoatNormalMap:me,clearcoatRoughnessMap:K,dispersion:et,retroreflection:A,iridescence:x,iridescenceMap:se,iridescenceThicknessMap:ge,sheen:O,sheenColorMap:Be,sheenRoughnessMap:be,specularMap:xe,specularColorMap:He,specularIntensityMap:Xe,transmission:$,transmissionMap:tt,thicknessMap:U,gradientMap:_e,opaque:_.transparent===!1&&_.blending===Js&&_.alphaToCoverage===!1,alphaMap:ee,alphaTest:ve,alphaHash:Ae,combine:_.combine,mapUv:$e&&p(_.map.channel),aoMapUv:le&&p(_.aoMap.channel),lightMapUv:ue&&p(_.lightMap.channel),bumpMapUv:W&&p(_.bumpMap.channel),normalMapUv:Q&&p(_.normalMap.channel),displacementMapUv:Pe&&p(_.displacementMap.channel),emissiveMapUv:Ne&&p(_.emissiveMap.channel),metalnessMapUv:Ve&&p(_.metalnessMap.channel),roughnessMapUv:Ze&&p(_.roughnessMap.channel),anisotropyMapUv:J&&p(_.anisotropyMap.channel),clearcoatMapUv:pe&&p(_.clearcoatMap.channel),clearcoatNormalMapUv:me&&p(_.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&p(_.clearcoatRoughnessMap.channel),iridescenceMapUv:se&&p(_.iridescenceMap.channel),iridescenceThicknessMapUv:ge&&p(_.iridescenceThicknessMap.channel),sheenColorMapUv:Be&&p(_.sheenColorMap.channel),sheenRoughnessMapUv:be&&p(_.sheenRoughnessMap.channel),specularMapUv:xe&&p(_.specularMap.channel),specularColorMapUv:He&&p(_.specularColorMap.channel),specularIntensityMapUv:Xe&&p(_.specularIntensityMap.channel),transmissionMapUv:tt&&p(_.transmissionMap.channel),thicknessMapUv:U&&p(_.thicknessMap.channel),alphaMapUv:ee&&p(_.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(Q||N),vertexNormals:!!B.attributes.normal,vertexColors:_.vertexColors,vertexAlphas:_.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!B.attributes.uv&&($e||ee),fog:!!z,useFog:_.fog===!0,fogExp2:!!z&&z.isFogExp2,flatShading:_.wireframe===!1&&(_.flatShading===!0||B.attributes.normal===void 0&&Q===!1&&(_.isMeshLambertMaterial||_.isMeshPhongMaterial||_.isMeshStandardMaterial||_.isMeshPhysicalMaterial)),sizeAttenuation:_.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:ye,skinning:k.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:Le,morphTextureStride:Ce,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:V.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:_.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:Ge,decodeVideoTexture:$e&&_.map.isVideoTexture===!0&&ut.getTransfer(_.map.colorSpace)===yt,decodeVideoTextureEmissive:Ne&&_.emissiveMap.isVideoTexture===!0&&ut.getTransfer(_.emissiveMap.colorSpace)===yt,premultipliedAlpha:_.premultipliedAlpha,doubleSided:_.side===zn,flipSided:_.side===Jt,useDepthPacking:_.depthPacking>=0,depthPacking:_.depthPacking||0,index0AttributeName:_.index0AttributeName,extensionClipCullDistance:ae&&_.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ae&&_.extensions.multiDraw===!0||Te)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:_.customProgramCacheKey()};return Fe.vertexUv1s=c.has(1),Fe.vertexUv2s=c.has(2),Fe.vertexUv3s=c.has(3),c.clear(),Fe}function g(_){let T=[];if(_.shaderID?T.push(_.shaderID):(T.push(_.customVertexShaderID),T.push(_.customFragmentShaderID)),_.defines!==void 0)for(let P in _.defines)T.push(P),T.push(_.defines[P]);return _.isRawShaderMaterial===!1&&(m(T,_),S(T,_),T.push(n.outputColorSpace)),T.push(_.customProgramCacheKey),T.join()}function m(_,T){_.push(T.precision),_.push(T.outputColorSpace),_.push(T.envMapMode),_.push(T.envMapCubeUVHeight),_.push(T.mapUv),_.push(T.alphaMapUv),_.push(T.lightMapUv),_.push(T.aoMapUv),_.push(T.bumpMapUv),_.push(T.normalMapUv),_.push(T.displacementMapUv),_.push(T.emissiveMapUv),_.push(T.metalnessMapUv),_.push(T.roughnessMapUv),_.push(T.anisotropyMapUv),_.push(T.clearcoatMapUv),_.push(T.clearcoatNormalMapUv),_.push(T.clearcoatRoughnessMapUv),_.push(T.iridescenceMapUv),_.push(T.iridescenceThicknessMapUv),_.push(T.sheenColorMapUv),_.push(T.sheenRoughnessMapUv),_.push(T.specularMapUv),_.push(T.specularColorMapUv),_.push(T.specularIntensityMapUv),_.push(T.transmissionMapUv),_.push(T.thicknessMapUv),_.push(T.combine),_.push(T.fogExp2),_.push(T.sizeAttenuation),_.push(T.morphTargetsCount),_.push(T.morphAttributeCount),_.push(T.numSunLights),_.push(T.numDirLights),_.push(T.numPointLights),_.push(T.numSpotLights),_.push(T.numSpotLightMaps),_.push(T.numHemiLights),_.push(T.numRectAreaLights),_.push(T.numSunLightShadows),_.push(T.numDirLightShadows),_.push(T.numPointLightShadows),_.push(T.numSpotLightShadows),_.push(T.numSpotLightShadowsWithMaps),_.push(T.numLightProbes),_.push(T.shadowMapType),_.push(T.toneMapping),_.push(T.numClippingPlanes),_.push(T.numClipIntersection),_.push(T.depthPacking)}function S(_,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),_.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),_.push(o.mask)}function E(_){let T=f[_.type],P;if(T){let D=li[T];P=Ab.clone(D.uniforms)}else P=_.uniforms;return P}function v(_,T){let P=u.get(T);return P!==void 0?++P.usedTimes:(P=new BR(n,T,_,r),l.push(P),u.set(T,P)),P}function M(_){if(--_.usedTimes===0){let T=l.indexOf(_);l[T]=l[l.length-1],l.pop(),u.delete(_.cacheKey),_.destroy()}}function w(_){a.remove(_)}function C(){a.dispose()}return{getParameters:y,getProgramCacheKey:g,getUniforms:E,acquireProgram:v,releaseProgram:M,releaseShaderCache:w,programs:l,dispose:C}}function $R(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,c){n.get(o)[a]=c}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function WR(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function Xb(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function qb(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(h){let f=0;return h.isInstancedMesh&&(f+=2),h.isSkinnedMesh&&(f+=1),f}function a(h,f,p,y,g,m){let S=n[e];return S===void 0?(S={id:h.id,object:h,geometry:f,material:p,materialVariant:o(h),groupOrder:y,renderOrder:h.renderOrder,z:g,group:m},n[e]=S):(S.id=h.id,S.object=h,S.geometry=f,S.material=p,S.materialVariant=o(h),S.groupOrder=y,S.renderOrder=h.renderOrder,S.z=g,S.group=m),e++,S}function c(h,f,p,y,g,m,S){S.reversedDepth===!0&&(g=-g);let E=a(h,f,p,y,g,m);p.transmission>0?i.push(E):p.transparent===!0?r.push(E):t.push(E)}function l(h,f,p,y,g,m){let S=a(h,f,p,y,g,m);p.transmission>0?i.unshift(S):p.transparent===!0?r.unshift(S):t.unshift(S)}function u(h,f){t.length>1&&t.sort(h||WR),i.length>1&&i.sort(f||Xb),r.length>1&&r.sort(f||Xb)}function d(){for(let h=e,f=n.length;h<f;h++){let p=n[h];if(p.id===null)break;p.id=null,p.object=null,p.geometry=null,p.material=null,p.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:d,sort:u}}function ZR(){let n=new WeakMap;function e(i,r){let s=n.get(i),o;return s===void 0?(o=new qb,n.set(i,[o])):r>=s.length?(o=new qb,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function XR(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new I,color:new Ue};break;case"SpotLight":t={position:new I,direction:new I,color:new Ue,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new Ue,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new Ue,groundColor:new Ue};break;case"RectAreaLight":t={color:new Ue,position:new I,halfWidth:new I,halfHeight:new I};break}return n[e.id]=t,t}}}function qR(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var YR=0;function JR(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function jR(n){let e=new XR,t=qR(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new I);let r=new I,s=new Pt,o=new Pt;function a(l){let u=0,d=0,h=0;for(let k=0;k<9;k++)i.probe[k].set(0,0,0);let f=0,p=0,y=0,g=0,m=0,S=0,E=0,v=0,M=0,w=0,C=0,_=0,T=0,P=0;l.sort(JR);for(let k=0,V=l.length;k<V;k++){let z=l[k],B=z.color,Z=z.intensity,q=z.distance,oe=null;if(z.shadow&&z.shadow.map&&(z.shadow.map.texture.format===ir?oe=z.shadow.map.texture:oe=z.shadow.map.depthTexture||z.shadow.map.texture),z.isAmbientLight)u+=B.r*Z,d+=B.g*Z,h+=B.b*Z;else if(z.isLightProbe){for(let Y=0;Y<9;Y++)i.probe[Y].addScaledVector(z.sh.coefficients[Y],Z);P++}else if(z.isSunLight){let Y=e.get(z);if(Y.color.copy(z.color).multiplyScalar(z.intensity),z.castShadow){let te=z.shadow,ie=t.get(z);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize.copy(te.mapSize).multiply(te.getFrameExtents()),i.sunShadow[p]=ie,i.sunShadowMap[p]=oe;let Le=te.getViewportCount();for(let Ce=0;Ce<Le;Ce++)i.sunShadowMatrix[y+Ce]=te.getMatrix(Ce),i.sunShadowCascade[y+Ce]=te._cascadeData[Ce];y+=Le,p++}i.sun[f]=Y,f++}else if(z.isDirectionalLight){let Y=e.get(z);if(Y.color.copy(z.color).multiplyScalar(z.intensity),z.castShadow){let te=z.shadow,ie=t.get(z);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,i.directionalShadow[g]=ie,i.directionalShadowMap[g]=oe,i.directionalShadowMatrix[g]=z.shadow.matrix,M++}i.directional[g]=Y,g++}else if(z.isSpotLight){let Y=e.get(z);Y.position.setFromMatrixPosition(z.matrixWorld),Y.color.copy(B).multiplyScalar(Z),Y.distance=q,Y.coneCos=Math.cos(z.angle),Y.penumbraCos=Math.cos(z.angle*(1-z.penumbra)),Y.decay=z.decay,i.spot[S]=Y;let te=z.shadow;if(z.map&&(i.spotLightMap[_]=z.map,_++,te.updateMatrices(z),z.castShadow&&T++),i.spotLightMatrix[S]=te.matrix,z.castShadow){let ie=t.get(z);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,i.spotShadow[S]=ie,i.spotShadowMap[S]=oe,C++}S++}else if(z.isRectAreaLight){let Y=e.get(z);Y.color.copy(B).multiplyScalar(Z),Y.halfWidth.set(z.width*.5,0,0),Y.halfHeight.set(0,z.height*.5,0),i.rectArea[E]=Y,E++}else if(z.isPointLight){let Y=e.get(z);if(Y.color.copy(z.color).multiplyScalar(z.intensity),Y.distance=z.distance,Y.decay=z.decay,z.castShadow){let te=z.shadow,ie=t.get(z);ie.shadowIntensity=te.intensity,ie.shadowBias=te.bias,ie.shadowNormalBias=te.normalBias,ie.shadowRadius=te.radius,ie.shadowMapSize=te.mapSize,ie.shadowCameraNear=te.camera.near,ie.shadowCameraFar=te.camera.far,i.pointShadow[m]=ie,i.pointShadowMap[m]=oe,i.pointShadowMatrix[m]=z.shadow.matrix,w++}i.point[m]=Y,m++}else if(z.isHemisphereLight){let Y=e.get(z);Y.skyColor.copy(z.color).multiplyScalar(Z),Y.groundColor.copy(z.groundColor).multiplyScalar(Z),i.hemi[v]=Y,v++}}E>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_FLOAT_1,i.rectAreaLTC2=Me.LTC_FLOAT_2):(i.rectAreaLTC1=Me.LTC_HALF_1,i.rectAreaLTC2=Me.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=d,i.ambient[2]=h;let D=i.hash;(D.sunLength!==f||D.directionalLength!==g||D.pointLength!==m||D.spotLength!==S||D.rectAreaLength!==E||D.hemiLength!==v||D.numSunShadows!==p||D.numDirectionalShadows!==M||D.numPointShadows!==w||D.numSpotShadows!==C||D.numSpotMaps!==_||D.numLightProbes!==P)&&(i.sun.length=f,i.directional.length=g,i.spot.length=S,i.rectArea.length=E,i.point.length=m,i.hemi.length=v,i.sunShadow.length=p,i.sunShadowMap.length=p,i.sunShadowMatrix.length=y,i.sunShadowCascade.length=y,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.directionalShadowMatrix.length=M,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=C,i.spotShadowMap.length=C,i.spotLightMatrix.length=C+_-T,i.spotLightMap.length=_,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=P,D.sunLength=f,D.directionalLength=g,D.pointLength=m,D.spotLength=S,D.rectAreaLength=E,D.hemiLength=v,D.numSunShadows=p,D.numDirectionalShadows=M,D.numPointShadows=w,D.numSpotShadows=C,D.numSpotMaps=_,D.numLightProbes=P,i.version=YR++)}function c(l,u){let d=0,h=0,f=0,p=0,y=0,g=0,m=u.matrixWorldInverse;for(let S=0,E=l.length;S<E;S++){let v=l[S];if(v.isSunLight){let M=i.sun[d];M.direction.setFromMatrixPosition(v.matrixWorld),M.direction.transformDirection(m),d++}else if(v.isDirectionalLight){let M=i.directional[h];M.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),h++}else if(v.isSpotLight){let M=i.spot[p];M.position.setFromMatrixPosition(v.matrixWorld),M.position.applyMatrix4(m),M.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(m),p++}else if(v.isRectAreaLight){let M=i.rectArea[y];M.position.setFromMatrixPosition(v.matrixWorld),M.position.applyMatrix4(m),o.identity(),s.copy(v.matrixWorld),s.premultiply(m),o.extractRotation(s),M.halfWidth.set(v.width*.5,0,0),M.halfHeight.set(0,v.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),y++}else if(v.isPointLight){let M=i.point[f];M.position.setFromMatrixPosition(v.matrixWorld),M.position.applyMatrix4(m),f++}else if(v.isHemisphereLight){let M=i.hemi[g];M.direction.setFromMatrixPosition(v.matrixWorld),M.direction.transformDirection(m),g++}}}return{setup:a,setupView:c,state:i}}function Yb(n){let e=new jR(n),t=[],i=[],r=[];function s(h){d.camera=h,t.length=0,i.length=0,r.length=0}function o(h){t.push(h)}function a(h){i.push(h)}function c(h){r.push(h)}function l(){e.setup(t)}function u(h){e.setupView(t,h)}let d={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:d,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function KR(n){let e=new WeakMap;function t(r,s=0){let o=e.get(r),a;return o===void 0?(a=new Yb(n),e.set(r,[a])):s>=o.length?(a=new Yb(n),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var QR=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,eC=`uniform sampler2D shadow_pass;
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
}`,tC=[new I(1,0,0),new I(-1,0,0),new I(0,1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1)],nC=[new I(0,-1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1),new I(0,-1,0),new I(0,-1,0)],Jb=new Pt,ka=new I,Mx=new I;function iC(n,e,t){let i=new $s,r=new fe,s=new fe,o=new zt,a=new Eu,c=new Tu,l={},u=t.maxTextureSize,d={[Qi]:Jt,[Jt]:Qi,[zn]:zn},h=new sn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new fe},radius:{value:4}},vertexShader:QR,fragmentShader:eC}),f=h.clone();f.defines.HORIZONTAL_PASS=1;let p=new Vt;p.setAttribute("position",new tn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new je(p,h),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ra;let m=this.type;this.render=function(w,C,_){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;this.type===By&&(qe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ra);let T=n.getRenderTarget(),P=n.getActiveCubeFace(),D=n.getActiveMipmapLevel(),k=n.state;k.setBlending(ai),k.buffers.depth.getReversed()===!0?k.buffers.color.setClear(0,0,0,0):k.buffers.color.setClear(1,1,1,1),k.buffers.depth.setTest(!0),k.setScissorTest(!1);let V=m!==this.type;V&&C.traverse(function(z){z.material&&(Array.isArray(z.material)?z.material.forEach(B=>B.needsUpdate=!0):z.material.needsUpdate=!0)});for(let z=0,B=w.length;z<B;z++){let Z=w[z],q=Z.shadow;if(q===void 0){qe("WebGLShadowMap:",Z,"has no shadow.");continue}if(q.autoUpdate===!1&&q.needsUpdate===!1)continue;r.copy(q.mapSize);let oe=q.getFrameExtents();r.multiply(oe),s.copy(q.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/oe.x),r.x=s.x*oe.x,q.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/oe.y),r.y=s.y*oe.y,q.mapSize.y=s.y));let Y=n.state.buffers.depth.getReversed();if(q.camera._reversedDepth=Y,q.map===null||V===!0){if(q.map!==null&&(q.map.depthTexture!==null&&(q.map.depthTexture.dispose(),q.map.depthTexture=null),q.map.dispose()),this.type===Ys){if(Z.isPointLight){qe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}q.map=new nn(r.x,r.y,{format:ir,type:qn,minFilter:Yt,magFilter:Yt,generateMipmaps:!1}),q.map.texture.name=Z.name+".shadowMap",q.map.depthTexture=new Wi(r.x,r.y,Xn),q.map.depthTexture.name=Z.name+".shadowMapDepth",q.map.depthTexture.format=ri,q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=Dt,q.map.depthTexture.magFilter=Dt}else Z.isPointLight?(q.map=new Ih(r.x),q.map.depthTexture=new xu(r.x,Zn)):(q.map=new nn(r.x,r.y),q.map.depthTexture=new Wi(r.x,r.y,Zn)),q.map.depthTexture.name=Z.name+".shadowMap",q.map.depthTexture.format=ri,this.type===Ra?(q.map.depthTexture.compareFunction=Y?Ah:Th,q.map.depthTexture.minFilter=Yt,q.map.depthTexture.magFilter=Yt):(q.map.depthTexture.compareFunction=null,q.map.depthTexture.minFilter=Dt,q.map.depthTexture.magFilter=Dt);q.camera.updateProjectionMatrix()}q.map.isWebGLCubeRenderTarget!==!0&&(q.map.width!==r.x||q.map.height!==r.y)&&q.map.setSize(r.x,r.y);let te=q.map.isWebGLCubeRenderTarget?6:q.getViewportCount();Z.isPointLight!==!0&&q.updateMatrices(Z,_);for(let ie=0;ie<te;ie++){let Le=q.getCamera(ie);if(Z.isPointLight){let Ce=q.camera,ct=q.matrix,it=Z.distance||Ce.far;it!==Ce.far&&(Ce.far=it,Ce.updateProjectionMatrix()),ka.setFromMatrixPosition(Z.matrixWorld),Ce.position.copy(ka),Mx.copy(Ce.position),Mx.add(tC[ie]),Ce.up.copy(nC[ie]),Ce.lookAt(Mx),Ce.updateMatrixWorld(),ct.makeTranslation(-ka.x,-ka.y,-ka.z),Jb.multiplyMatrices(Ce.projectionMatrix,Ce.matrixWorldInverse),q._frustum.setFromProjectionMatrix(Jb,Ce.coordinateSystem,Ce.reversedDepth)}if(q.map.isWebGLCubeRenderTarget)n.setRenderTarget(q.map,ie),n.clear();else{ie===0&&(n.setRenderTarget(q.map),n.clear());let Ce=q.getViewport(ie);o.set(s.x*Ce.x,s.y*Ce.y,s.x*Ce.z,s.y*Ce.w),k.viewport(o)}i=q.getFrustum(ie),v(C,_,Le,Z,this.type)}q.isPointLightShadow!==!0&&this.type===Ys&&S(q,_),q.needsUpdate=!1}m=this.type,g.needsUpdate=!1,n.setRenderTarget(T,P,D)};function S(w,C){let _=e.update(y);h.defines.VSM_SAMPLES!==w.blurSamples&&(h.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,h.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null?w.mapPass=new nn(r.x,r.y,{format:ir,type:qn}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),h.uniforms.shadow_pass.value=w.map.depthTexture,h.uniforms.resolution.value.set(w.map.width,w.map.height),h.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(C,null,_,h,y,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(C,null,_,f,y,null)}function E(w,C,_,T){let P=null,D=_.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(D!==void 0)P=D;else if(P=_.isPointLight===!0?c:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let k=P.uuid,V=C.uuid,z=l[k];z===void 0&&(z={},l[k]=z);let B=z[V];B===void 0&&(B=P.clone(),z[V]=B,C.addEventListener("dispose",M)),P=B}if(P.visible=C.visible,P.wireframe=C.wireframe,T===Ys?P.side=C.shadowSide!==null?C.shadowSide:C.side:P.side=C.shadowSide!==null?C.shadowSide:d[C.side],P.alphaMap=C.alphaMap,P.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,P.map=C.map,P.clipShadows=C.clipShadows,P.clippingPlanes=C.clippingPlanes,P.clipIntersection=C.clipIntersection,P.displacementMap=C.displacementMap,P.displacementScale=C.displacementScale,P.displacementBias=C.displacementBias,P.wireframeLinewidth=C.wireframeLinewidth,P.linewidth=C.linewidth,_.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let k=n.properties.get(P);k.light=_}return P}function v(w,C,_,T,P){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&P===Ys)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(_.matrixWorldInverse,w.matrixWorld);let V=e.update(w),z=w.material;if(Array.isArray(z)){let B=V.groups;for(let Z=0,q=B.length;Z<q;Z++){let oe=B[Z],Y=z[oe.materialIndex];if(Y&&Y.visible){let te=E(w,Y,T,P);w.onBeforeShadow(n,w,C,_,V,te,oe),n.renderBufferDirect(_,null,V,te,w,oe),w.onAfterShadow(n,w,C,_,V,te,oe)}}}else if(z.visible){let B=E(w,z,T,P);w.onBeforeShadow(n,w,C,_,V,B,null),n.renderBufferDirect(_,null,V,B,w,null),w.onAfterShadow(n,w,C,_,V,B,null)}}let k=w.children;for(let V=0,z=k.length;V<z;V++)v(k[V],C,_,T,P)}function M(w){w.target.removeEventListener("dispose",M);for(let _ in l){let T=l[_],P=w.target.uuid;P in T&&(T[P].dispose(),delete T[P])}}}function rC(n,e){function t(){let U=!1,_e=new zt,ee=null,ve=new zt(0,0,0,0);return{setMask:function(Ae){ee!==Ae&&!U&&(n.colorMask(Ae,Ae,Ae,Ae),ee=Ae)},setLocked:function(Ae){U=Ae},setClear:function(Ae,ae,Ge,Fe,Rt){Rt===!0&&(Ae*=Fe,ae*=Fe,Ge*=Fe),_e.set(Ae,ae,Ge,Fe),ve.equals(_e)===!1&&(n.clearColor(Ae,ae,Ge,Fe),ve.copy(_e))},reset:function(){U=!1,ee=null,ve.set(-1,0,0,0)}}}function i(){let U=!1,_e=!1,ee=null,ve=null,Ae=null;return{setReversed:function(ae){if(_e!==ae){let Ge=e.get("EXT_clip_control");ae?Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.ZERO_TO_ONE_EXT):Ge.clipControlEXT(Ge.LOWER_LEFT_EXT,Ge.NEGATIVE_ONE_TO_ONE_EXT),_e=ae;let Fe=Ae;Ae=null,this.setClear(Fe)}},getReversed:function(){return _e},setTest:function(ae){ae?ne(n.DEPTH_TEST):ye(n.DEPTH_TEST)},setMask:function(ae){ee!==ae&&!U&&(n.depthMask(ae),ee=ae)},setFunc:function(ae){if(_e&&(ae=bb[ae]),ve!==ae){switch(ae){case iu:n.depthFunc(n.NEVER);break;case ru:n.depthFunc(n.ALWAYS);break;case su:n.depthFunc(n.LESS);break;case Us:n.depthFunc(n.LEQUAL);break;case ou:n.depthFunc(n.EQUAL);break;case au:n.depthFunc(n.GEQUAL);break;case cu:n.depthFunc(n.GREATER);break;case lu:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ve=ae}},setLocked:function(ae){U=ae},setClear:function(ae){Ae!==ae&&(Ae=ae,_e&&(ae=1-ae),n.clearDepth(ae))},reset:function(){U=!1,ee=null,ve=null,Ae=null,_e=!1}}}function r(){let U=!1,_e=null,ee=null,ve=null,Ae=null,ae=null,Ge=null,Fe=null,Rt=null;return{setTest:function(xt){U||(xt?ne(n.STENCIL_TEST):ye(n.STENCIL_TEST))},setMask:function(xt){_e!==xt&&!U&&(n.stencilMask(xt),_e=xt)},setFunc:function(xt,Un,Jn){(ee!==xt||ve!==Un||Ae!==Jn)&&(n.stencilFunc(xt,Un,Jn),ee=xt,ve=Un,Ae=Jn)},setOp:function(xt,Un,Jn){(ae!==xt||Ge!==Un||Fe!==Jn)&&(n.stencilOp(xt,Un,Jn),ae=xt,Ge=Un,Fe=Jn)},setLocked:function(xt){U=xt},setClear:function(xt){Rt!==xt&&(n.clearStencil(xt),Rt=xt)},reset:function(){U=!1,_e=null,ee=null,ve=null,Ae=null,ae=null,Ge=null,Fe=null,Rt=null}}}let s=new t,o=new i,a=new r,c=new WeakMap,l=new WeakMap,u={},d={},h={},f=new WeakMap,p=[],y=null,g=!1,m=null,S=null,E=null,v=null,M=null,w=null,C=null,_=new Ue(0,0,0),T=0,P=!1,D=null,k=null,V=null,z=null,B=null,Z=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),q=!1,oe=0,Y=n.getParameter(n.VERSION);Y.indexOf("WebGL")!==-1?(oe=parseFloat(/^WebGL (\d)/.exec(Y)[1]),q=oe>=1):Y.indexOf("OpenGL ES")!==-1&&(oe=parseFloat(/^OpenGL ES (\d)/.exec(Y)[1]),q=oe>=2);let te=null,ie={},Le=n.getParameter(n.SCISSOR_BOX),Ce=n.getParameter(n.VIEWPORT),ct=new zt().fromArray(Le),it=new zt().fromArray(Ce);function ht(U,_e,ee,ve){let Ae=new Uint8Array(4),ae=n.createTexture();n.bindTexture(U,ae),n.texParameteri(U,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(U,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let Ge=0;Ge<ee;Ge++)U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?n.texImage3D(_e,0,n.RGBA,1,1,ve,0,n.RGBA,n.UNSIGNED_BYTE,Ae):n.texImage2D(_e+Ge,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Ae);return ae}let j={};j[n.TEXTURE_2D]=ht(n.TEXTURE_2D,n.TEXTURE_2D,1),j[n.TEXTURE_CUBE_MAP]=ht(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),j[n.TEXTURE_2D_ARRAY]=ht(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),j[n.TEXTURE_3D]=ht(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ne(n.DEPTH_TEST),o.setFunc(Us),W(!1),Q(Vg),ne(n.CULL_FACE),le(ai);function ne(U){u[U]!==!0&&(n.enable(U),u[U]=!0)}function ye(U){u[U]!==!1&&(n.disable(U),u[U]=!1)}function We(U,_e){return h[U]!==_e?(n.bindFramebuffer(U,_e),h[U]=_e,U===n.DRAW_FRAMEBUFFER&&(h[n.FRAMEBUFFER]=_e),U===n.FRAMEBUFFER&&(h[n.DRAW_FRAMEBUFFER]=_e),!0):!1}function Te(U,_e){let ee=p,ve=!1;if(U){ee=f.get(_e),ee===void 0&&(ee=[],f.set(_e,ee));let Ae=U.textures;if(ee.length!==Ae.length||ee[0]!==n.COLOR_ATTACHMENT0){for(let ae=0,Ge=Ae.length;ae<Ge;ae++)ee[ae]=n.COLOR_ATTACHMENT0+ae;ee.length=Ae.length,ve=!0}}else ee[0]!==n.BACK&&(ee[0]=n.BACK,ve=!0);ve&&n.drawBuffers(ee)}function $e(U){return y!==U?(n.useProgram(U),y=U,!0):!1}let dt={[Pr]:n.FUNC_ADD,[Gy]:n.FUNC_SUBTRACT,[Vy]:n.FUNC_REVERSE_SUBTRACT};dt[$y]=n.MIN,dt[Wy]=n.MAX;let re={[Zy]:n.ZERO,[Xy]:n.ONE,[qy]:n.SRC_COLOR,[Xg]:n.SRC_ALPHA,[eb]:n.SRC_ALPHA_SATURATE,[Ky]:n.DST_COLOR,[Jy]:n.DST_ALPHA,[Yy]:n.ONE_MINUS_SRC_COLOR,[qg]:n.ONE_MINUS_SRC_ALPHA,[Qy]:n.ONE_MINUS_DST_COLOR,[jy]:n.ONE_MINUS_DST_ALPHA,[tb]:n.CONSTANT_COLOR,[nb]:n.ONE_MINUS_CONSTANT_COLOR,[ib]:n.CONSTANT_ALPHA,[rb]:n.ONE_MINUS_CONSTANT_ALPHA};function le(U,_e,ee,ve,Ae,ae,Ge,Fe,Rt,xt){if(U===ai){g===!0&&(ye(n.BLEND),g=!1);return}if(g===!1&&(ne(n.BLEND),g=!0),U!==Hy){if(U!==m||xt!==P){if((S!==Pr||M!==Pr)&&(n.blendEquation(n.FUNC_ADD),S=Pr,M=Pr),xt)switch(U){case Js:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case $g:n.blendFunc(n.ONE,n.ONE);break;case Wg:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case Zg:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Je("WebGLState: Invalid blending: ",U);break}else switch(U){case Js:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case $g:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case Wg:Je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case Zg:Je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Je("WebGLState: Invalid blending: ",U);break}E=null,v=null,w=null,C=null,_.set(0,0,0),T=0,m=U,P=xt}return}Ae=Ae||_e,ae=ae||ee,Ge=Ge||ve,(_e!==S||Ae!==M)&&(n.blendEquationSeparate(dt[_e],dt[Ae]),S=_e,M=Ae),(ee!==E||ve!==v||ae!==w||Ge!==C)&&(n.blendFuncSeparate(re[ee],re[ve],re[ae],re[Ge]),E=ee,v=ve,w=ae,C=Ge),(Fe.equals(_)===!1||Rt!==T)&&(n.blendColor(Fe.r,Fe.g,Fe.b,Rt),_.copy(Fe),T=Rt),m=U,P=!1}function ue(U,_e){U.side===zn?ye(n.CULL_FACE):ne(n.CULL_FACE);let ee=U.side===Jt;_e&&(ee=!ee),W(ee),U.blending===Js&&U.transparent===!1?le(ai):le(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),s.setMask(U.colorWrite);let ve=U.stencilWrite;a.setTest(ve),ve&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),Ne(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?ne(n.SAMPLE_ALPHA_TO_COVERAGE):ye(n.SAMPLE_ALPHA_TO_COVERAGE)}function W(U){D!==U&&(U?n.frontFace(n.CW):n.frontFace(n.CCW),D=U)}function Q(U){U!==Fy?(ne(n.CULL_FACE),U!==k&&(U===Vg?n.cullFace(n.BACK):U===ky?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ye(n.CULL_FACE),k=U}function Pe(U){U!==V&&(q&&n.lineWidth(U),V=U)}function Ne(U,_e,ee){U?(ne(n.POLYGON_OFFSET_FILL),(z!==_e||B!==ee)&&(z=_e,B=ee,o.getReversed()&&(_e=-_e),n.polygonOffset(_e,ee))):ye(n.POLYGON_OFFSET_FILL)}function Ve(U){U?ne(n.SCISSOR_TEST):ye(n.SCISSOR_TEST)}function Ze(U){U===void 0&&(U=n.TEXTURE0+Z-1),te!==U&&(n.activeTexture(U),te=U)}function N(U,_e,ee){ee===void 0&&(te===null?ee=n.TEXTURE0+Z-1:ee=te);let ve=ie[ee];ve===void 0&&(ve={type:void 0,texture:void 0},ie[ee]=ve),(ve.type!==U||ve.texture!==_e)&&(te!==ee&&(n.activeTexture(ee),te=ee),n.bindTexture(U,_e||j[U]),ve.type=U,ve.texture=_e)}function mt(){let U=ie[te];U!==void 0&&U.type!==void 0&&(n.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function et(){try{n.compressedTexImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function A(){try{n.compressedTexImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function x(){try{n.texSubImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function O(){try{n.texSubImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function $(){try{n.compressedTexSubImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function J(){try{n.compressedTexSubImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function pe(){try{n.texStorage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function me(){try{n.texStorage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function K(){try{n.texImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function se(){try{n.texImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function ge(U){return d[U]!==void 0?d[U]:n.getParameter(U)}function Be(U,_e){d[U]!==_e&&(n.pixelStorei(U,_e),d[U]=_e)}function be(U){ct.equals(U)===!1&&(n.scissor(U.x,U.y,U.z,U.w),ct.copy(U))}function xe(U){it.equals(U)===!1&&(n.viewport(U.x,U.y,U.z,U.w),it.copy(U))}function He(U,_e){let ee=l.get(_e);ee===void 0&&(ee=new WeakMap,l.set(_e,ee));let ve=ee.get(U);ve===void 0&&(ve=n.getUniformBlockIndex(_e,U.name),ee.set(U,ve))}function Xe(U,_e){let ve=l.get(_e).get(U);c.get(_e)!==ve&&(n.uniformBlockBinding(_e,ve,U.__bindingPointIndex),c.set(_e,ve))}function tt(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},d={},te=null,ie={},h={},f=new WeakMap,p=[],y=null,g=!1,m=null,S=null,E=null,v=null,M=null,w=null,C=null,_=new Ue(0,0,0),T=0,P=!1,D=null,k=null,V=null,z=null,B=null,ct.set(0,0,n.canvas.width,n.canvas.height),it.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:ne,disable:ye,bindFramebuffer:We,drawBuffers:Te,useProgram:$e,setBlending:le,setMaterial:ue,setFlipSided:W,setCullFace:Q,setLineWidth:Pe,setPolygonOffset:Ne,setScissorTest:Ve,activeTexture:Ze,bindTexture:N,unbindTexture:mt,compressedTexImage2D:et,compressedTexImage3D:A,texImage2D:K,texImage3D:se,pixelStorei:Be,getParameter:ge,updateUBOMapping:He,uniformBlockBinding:Xe,texStorage2D:pe,texStorage3D:me,texSubImage2D:x,texSubImage3D:O,compressedTexSubImage2D:$,compressedTexSubImage3D:J,scissor:be,viewport:xe,reset:tt}}function sC(n,e,t,i,r,s,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new fe,u=new WeakMap,d=new Set,h,f=new WeakMap,p=!1;try{p=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(A,x){return p?new OffscreenCanvas(A,x):ia("canvas")}function g(A,x,O){let $=1,J=et(A);if((J.width>O||J.height>O)&&($=O/Math.max(J.width,J.height)),$<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let pe=Math.floor($*J.width),me=Math.floor($*J.height);h===void 0&&(h=y(pe,me));let K=x?y(pe,me):h;return K.width=pe,K.height=me,K.getContext("2d").drawImage(A,0,0,pe,me),qe("WebGLRenderer: Texture has been resized from ("+J.width+"x"+J.height+") to ("+pe+"x"+me+")."),K}else return"data"in A&&qe("WebGLRenderer: Image in DataTexture is too big ("+J.width+"x"+J.height+")."),A;return A}function m(A){return A.generateMipmaps}function S(A){n.generateMipmap(A)}function E(A){return A.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?n.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function v(A,x,O,$,J,pe=!1){if(A!==null){if(n[A]!==void 0)return n[A];qe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let me;$&&(me=e.get("EXT_texture_norm16"),me||qe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=x;if(x===n.RED&&(O===n.FLOAT&&(K=n.R32F),O===n.HALF_FLOAT&&(K=n.R16F),O===n.UNSIGNED_BYTE&&(K=n.R8),O===n.UNSIGNED_SHORT&&me&&(K=me.R16_EXT),O===n.SHORT&&me&&(K=me.R16_SNORM_EXT)),x===n.RED_INTEGER&&(O===n.UNSIGNED_BYTE&&(K=n.R8UI),O===n.UNSIGNED_SHORT&&(K=n.R16UI),O===n.UNSIGNED_INT&&(K=n.R32UI),O===n.BYTE&&(K=n.R8I),O===n.SHORT&&(K=n.R16I),O===n.INT&&(K=n.R32I)),x===n.RG&&(O===n.FLOAT&&(K=n.RG32F),O===n.HALF_FLOAT&&(K=n.RG16F),O===n.UNSIGNED_BYTE&&(K=n.RG8),O===n.UNSIGNED_SHORT&&me&&(K=me.RG16_EXT),O===n.SHORT&&me&&(K=me.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(O===n.UNSIGNED_BYTE&&(K=n.RG8UI),O===n.UNSIGNED_SHORT&&(K=n.RG16UI),O===n.UNSIGNED_INT&&(K=n.RG32UI),O===n.BYTE&&(K=n.RG8I),O===n.SHORT&&(K=n.RG16I),O===n.INT&&(K=n.RG32I)),x===n.RGB_INTEGER&&(O===n.UNSIGNED_BYTE&&(K=n.RGB8UI),O===n.UNSIGNED_SHORT&&(K=n.RGB16UI),O===n.UNSIGNED_INT&&(K=n.RGB32UI),O===n.BYTE&&(K=n.RGB8I),O===n.SHORT&&(K=n.RGB16I),O===n.INT&&(K=n.RGB32I)),x===n.RGBA_INTEGER&&(O===n.UNSIGNED_BYTE&&(K=n.RGBA8UI),O===n.UNSIGNED_SHORT&&(K=n.RGBA16UI),O===n.UNSIGNED_INT&&(K=n.RGBA32UI),O===n.BYTE&&(K=n.RGBA8I),O===n.SHORT&&(K=n.RGBA16I),O===n.INT&&(K=n.RGBA32I)),x===n.RGB&&(O===n.UNSIGNED_SHORT&&me&&(K=me.RGB16_EXT),O===n.SHORT&&me&&(K=me.RGB16_SNORM_EXT),O===n.UNSIGNED_INT_5_9_9_9_REV&&(K=n.RGB9_E5),O===n.UNSIGNED_INT_10F_11F_11F_REV&&(K=n.R11F_G11F_B10F)),x===n.RGBA){let se=pe?na:ut.getTransfer(J);O===n.FLOAT&&(K=n.RGBA32F),O===n.HALF_FLOAT&&(K=n.RGBA16F),O===n.UNSIGNED_BYTE&&(K=se===yt?n.SRGB8_ALPHA8:n.RGBA8),O===n.UNSIGNED_SHORT&&me&&(K=me.RGBA16_EXT),O===n.SHORT&&me&&(K=me.RGBA16_SNORM_EXT),O===n.UNSIGNED_SHORT_4_4_4_4&&(K=n.RGBA4),O===n.UNSIGNED_SHORT_5_5_5_1&&(K=n.RGB5_A1)}return(K===n.R16F||K===n.R32F||K===n.RG16F||K===n.RG32F||K===n.RGBA16F||K===n.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function M(A,x){let O;return A?x===null||x===Zn||x===Ks?O=n.DEPTH24_STENCIL8:x===Xn?O=n.DEPTH32F_STENCIL8:x===js&&(O=n.DEPTH24_STENCIL8,qe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Zn||x===Ks?O=n.DEPTH_COMPONENT24:x===Xn?O=n.DEPTH_COMPONENT32F:x===js&&(O=n.DEPTH_COMPONENT16),O}function w(A,x){return m(A)===!0||A.isFramebufferTexture&&A.minFilter!==Dt&&A.minFilter!==Yt?Math.log2(Math.max(x.width,x.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?x.mipmaps.length:1}function C(A){let x=A.target;x.removeEventListener("dispose",C),T(x),x.isVideoTexture&&u.delete(x),x.isHTMLTexture&&d.delete(x)}function _(A){let x=A.target;x.removeEventListener("dispose",_),D(x)}function T(A){let x=i.get(A);if(x.__webglInit===void 0)return;let O=A.source,$=f.get(O);if($){let J=$[x.__cacheKey];J.usedTimes--,J.usedTimes===0&&P(A),Object.keys($).length===0&&f.delete(O)}i.remove(A)}function P(A){let x=i.get(A);n.deleteTexture(x.__webglTexture);let O=A.source,$=f.get(O);delete $[x.__cacheKey],o.memory.textures--}function D(A){let x=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(x.__webglFramebuffer[$]))for(let J=0;J<x.__webglFramebuffer[$].length;J++)n.deleteFramebuffer(x.__webglFramebuffer[$][J]);else n.deleteFramebuffer(x.__webglFramebuffer[$]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[$])}else{if(Array.isArray(x.__webglFramebuffer))for(let $=0;$<x.__webglFramebuffer.length;$++)n.deleteFramebuffer(x.__webglFramebuffer[$]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let $=0;$<x.__webglColorRenderbuffer.length;$++)x.__webglColorRenderbuffer[$]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[$]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let O=A.textures;for(let $=0,J=O.length;$<J;$++){let pe=i.get(O[$]);pe.__webglTexture&&(n.deleteTexture(pe.__webglTexture),o.memory.textures--),i.remove(O[$])}i.remove(A)}let k=0;function V(){k=0}function z(){return k}function B(A){k=A}function Z(){let A=k;return A>=r.maxTextures&&qe("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+r.maxTextures),k+=1,A}function q(A){let x=[];return x.push(A.wrapS),x.push(A.wrapT),x.push(A.wrapR||0),x.push(A.magFilter),x.push(A.minFilter),x.push(A.anisotropy),x.push(A.internalFormat),x.push(A.format),x.push(A.type),x.push(A.generateMipmaps),x.push(A.premultiplyAlpha),x.push(A.flipY),x.push(A.unpackAlignment),x.push(A.colorSpace),x.join()}function oe(A,x){let O=i.get(A);if(A.isVideoTexture&&N(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&O.__version!==A.version){let $=A.image;if($===null)qe("WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)qe("WebGLRenderer: Texture marked for update but image is incomplete");else{ye(O,A,x);return}}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,O.__webglTexture,n.TEXTURE0+x)}function Y(A,x){let O=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){ye(O,A,x);return}else A.isExternalTexture&&(O.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,O.__webglTexture,n.TEXTURE0+x)}function te(A,x){let O=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&O.__version!==A.version){ye(O,A,x);return}t.bindTexture(n.TEXTURE_3D,O.__webglTexture,n.TEXTURE0+x)}function ie(A,x){let O=i.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&O.__version!==A.version){We(O,A,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,O.__webglTexture,n.TEXTURE0+x)}let Le={[uu]:n.REPEAT,[ii]:n.CLAMP_TO_EDGE,[hu]:n.MIRRORED_REPEAT},Ce={[Dt]:n.NEAREST,[ab]:n.NEAREST_MIPMAP_NEAREST,[Pa]:n.NEAREST_MIPMAP_LINEAR,[Yt]:n.LINEAR,[Gu]:n.LINEAR_MIPMAP_NEAREST,[tr]:n.LINEAR_MIPMAP_LINEAR},ct={[hb]:n.NEVER,[gb]:n.ALWAYS,[db]:n.LESS,[Th]:n.LEQUAL,[fb]:n.EQUAL,[Ah]:n.GEQUAL,[pb]:n.GREATER,[mb]:n.NOTEQUAL};function it(A,x){if(x.type===Xn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Yt||x.magFilter===Gu||x.magFilter===Pa||x.magFilter===tr||x.minFilter===Yt||x.minFilter===Gu||x.minFilter===Pa||x.minFilter===tr)&&qe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(A,n.TEXTURE_WRAP_S,Le[x.wrapS]),n.texParameteri(A,n.TEXTURE_WRAP_T,Le[x.wrapT]),(A===n.TEXTURE_3D||A===n.TEXTURE_2D_ARRAY)&&n.texParameteri(A,n.TEXTURE_WRAP_R,Le[x.wrapR]),n.texParameteri(A,n.TEXTURE_MAG_FILTER,Ce[x.magFilter]),n.texParameteri(A,n.TEXTURE_MIN_FILTER,Ce[x.minFilter]),x.compareFunction&&(n.texParameteri(A,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(A,n.TEXTURE_COMPARE_FUNC,ct[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Dt||x.minFilter!==Pa&&x.minFilter!==tr||x.type===Xn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let O=e.get("EXT_texture_filter_anisotropic");n.texParameterf(A,O.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function ht(A,x){let O=!1;A.__webglInit===void 0&&(A.__webglInit=!0,x.addEventListener("dispose",C));let $=x.source,J=f.get($);J===void 0&&(J={},f.set($,J));let pe=q(x);if(pe!==A.__cacheKey){J[pe]===void 0&&(J[pe]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,O=!0),J[pe].usedTimes++;let me=J[A.__cacheKey];me!==void 0&&(J[A.__cacheKey].usedTimes--,me.usedTimes===0&&P(x)),A.__cacheKey=pe,A.__webglTexture=J[pe].texture}return O}function j(A,x,O){return Math.floor(Math.floor(A/O)/x)}function ne(A,x,O,$){let pe=A.updateRanges;if(pe.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,O,$,x.data);else{pe.sort((Be,be)=>Be.start-be.start);let me=0;for(let Be=1;Be<pe.length;Be++){let be=pe[me],xe=pe[Be],He=be.start+be.count,Xe=j(xe.start,x.width,4),tt=j(be.start,x.width,4);xe.start<=He+1&&Xe===tt&&j(xe.start+xe.count-1,x.width,4)===Xe?be.count=Math.max(be.count,xe.start+xe.count-be.start):(++me,pe[me]=xe)}pe.length=me+1;let K=t.getParameter(n.UNPACK_ROW_LENGTH),se=t.getParameter(n.UNPACK_SKIP_PIXELS),ge=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let Be=0,be=pe.length;Be<be;Be++){let xe=pe[Be],He=Math.floor(xe.start/4),Xe=Math.ceil(xe.count/4),tt=He%x.width,U=Math.floor(He/x.width),_e=Xe,ee=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,tt),t.pixelStorei(n.UNPACK_SKIP_ROWS,U),t.texSubImage2D(n.TEXTURE_2D,0,tt,U,_e,ee,O,$,x.data)}A.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,K),t.pixelStorei(n.UNPACK_SKIP_PIXELS,se),t.pixelStorei(n.UNPACK_SKIP_ROWS,ge)}}function ye(A,x,O){let $=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&($=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&($=n.TEXTURE_3D);let J=ht(A,x),pe=x.source;t.bindTexture($,A.__webglTexture,n.TEXTURE0+O);let me=i.get(pe);if(pe.version!==me.__version||J===!0){if(t.activeTexture(n.TEXTURE0+O),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let ee=ut.getPrimaries(ut.workingColorSpace),ve=x.colorSpace===yi?null:ut.getPrimaries(x.colorSpace),Ae=x.colorSpace===yi||ee===ve?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ae)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let se=g(x.image,!1,r.maxTextureSize);se=mt(x,se);let ge=s.convert(x.format,x.colorSpace),Be=s.convert(x.type),be=v(x.internalFormat,ge,Be,x.normalized,x.colorSpace,x.isVideoTexture);it($,x);let xe,He=x.mipmaps,Xe=x.isVideoTexture!==!0,tt=me.__version===void 0||J===!0,U=pe.dataReady,_e=w(x,se);if(x.isDepthTexture)be=M(x.format===nr,x.type),tt&&(Xe?t.texStorage2D(n.TEXTURE_2D,1,be,se.width,se.height):t.texImage2D(n.TEXTURE_2D,0,be,se.width,se.height,0,ge,Be,null));else if(x.isDataTexture)if(He.length>0){Xe&&tt&&t.texStorage2D(n.TEXTURE_2D,_e,be,He[0].width,He[0].height);for(let ee=0,ve=He.length;ee<ve;ee++)xe=He[ee],Xe?U&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,xe.width,xe.height,ge,Be,xe.data):t.texImage2D(n.TEXTURE_2D,ee,be,xe.width,xe.height,0,ge,Be,xe.data);x.generateMipmaps=!1}else Xe?(tt&&t.texStorage2D(n.TEXTURE_2D,_e,be,se.width,se.height),U&&ne(x,se,ge,Be)):t.texImage2D(n.TEXTURE_2D,0,be,se.width,se.height,0,ge,Be,se.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Xe&&tt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,be,He[0].width,He[0].height,se.depth);for(let ee=0,ve=He.length;ee<ve;ee++)if(xe=He[ee],x.format!==Ln)if(ge!==null)if(Xe){if(U)if(x.layerUpdates.size>0){let Ae=xx(xe.width,xe.height,x.format,x.type);for(let ae of x.layerUpdates){let Ge=xe.data.subarray(ae*Ae/xe.data.BYTES_PER_ELEMENT,(ae+1)*Ae/xe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,ae,xe.width,xe.height,1,ge,Ge)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,xe.width,xe.height,se.depth,ge,xe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,ee,be,xe.width,xe.height,se.depth,0,xe.data,0,0);else qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Xe?U&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,ee,0,0,0,xe.width,xe.height,se.depth,ge,Be,xe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,ee,be,xe.width,xe.height,se.depth,0,ge,Be,xe.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{Xe&&tt&&t.texStorage2D(n.TEXTURE_2D,_e,be,He[0].width,He[0].height);for(let ee=0,ve=He.length;ee<ve;ee++)xe=He[ee],x.format!==Ln?ge!==null?Xe?U&&t.compressedTexSubImage2D(n.TEXTURE_2D,ee,0,0,xe.width,xe.height,ge,xe.data):t.compressedTexImage2D(n.TEXTURE_2D,ee,be,xe.width,xe.height,0,xe.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Xe?U&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,xe.width,xe.height,ge,Be,xe.data):t.texImage2D(n.TEXTURE_2D,ee,be,xe.width,xe.height,0,ge,Be,xe.data)}else if(x.isDataArrayTexture)if(Xe){if(tt&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,be,se.width,se.height,se.depth),U)if(x.layerUpdates.size>0){let ee=xx(se.width,se.height,x.format,x.type);for(let ve of x.layerUpdates){let Ae=se.data.subarray(ve*ee/se.data.BYTES_PER_ELEMENT,(ve+1)*ee/se.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ve,se.width,se.height,1,ge,Be,Ae)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,se.width,se.height,se.depth,ge,Be,se.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,be,se.width,se.height,se.depth,0,ge,Be,se.data);else if(x.isData3DTexture)Xe?(tt&&t.texStorage3D(n.TEXTURE_3D,_e,be,se.width,se.height,se.depth),U&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,se.width,se.height,se.depth,ge,Be,se.data)):t.texImage3D(n.TEXTURE_3D,0,be,se.width,se.height,se.depth,0,ge,Be,se.data);else if(x.isFramebufferTexture){if(tt)if(Xe)t.texStorage2D(n.TEXTURE_2D,_e,be,se.width,se.height);else{let ee=se.width,ve=se.height;for(let Ae=0;Ae<_e;Ae++)t.texImage2D(n.TEXTURE_2D,Ae,be,ee,ve,0,ge,Be,null),ee>>=1,ve>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){let ee=n.canvas;if(ee.hasAttribute("layoutsubtree")||ee.setAttribute("layoutsubtree","true"),se.parentNode!==ee){ee.appendChild(se),d.add(x),ee.onpaint=ve=>{let Ae=ve.changedElements;for(let ae of d)Ae.includes(ae.image)&&(ae.needsUpdate=!0)},ee.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,se);else{let Ae=n.RGBA,ae=n.RGBA,Ge=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Ae,ae,Ge,se)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(He.length>0){if(Xe&&tt){let ee=et(He[0]);t.texStorage2D(n.TEXTURE_2D,_e,be,ee.width,ee.height)}for(let ee=0,ve=He.length;ee<ve;ee++)xe=He[ee],Xe?U&&t.texSubImage2D(n.TEXTURE_2D,ee,0,0,ge,Be,xe):t.texImage2D(n.TEXTURE_2D,ee,be,ge,Be,xe);x.generateMipmaps=!1}else if(Xe){if(tt){let ee=et(se);t.texStorage2D(n.TEXTURE_2D,_e,be,ee.width,ee.height)}U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ge,Be,se)}else t.texImage2D(n.TEXTURE_2D,0,be,ge,Be,se);m(x)&&S($),me.__version=pe.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function We(A,x,O){if(x.image.length!==6)return;let $=ht(A,x),J=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture,n.TEXTURE0+O);let pe=i.get(J);if(J.version!==pe.__version||$===!0){t.activeTexture(n.TEXTURE0+O);let me=ut.getPrimaries(ut.workingColorSpace),K=x.colorSpace===yi?null:ut.getPrimaries(x.colorSpace),se=x.colorSpace===yi||me===K?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,se);let ge=x.isCompressedTexture||x.image[0].isCompressedTexture,Be=x.image[0]&&x.image[0].isDataTexture,be=[];for(let ae=0;ae<6;ae++)!ge&&!Be?be[ae]=g(x.image[ae],!0,r.maxCubemapSize):be[ae]=Be?x.image[ae].image:x.image[ae],be[ae]=mt(x,be[ae]);let xe=be[0],He=s.convert(x.format,x.colorSpace),Xe=s.convert(x.type),tt=v(x.internalFormat,He,Xe,x.normalized,x.colorSpace),U=x.isVideoTexture!==!0,_e=pe.__version===void 0||$===!0,ee=J.dataReady,ve=w(x,xe);it(n.TEXTURE_CUBE_MAP,x);let Ae;if(ge){U&&_e&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ve,tt,xe.width,xe.height);for(let ae=0;ae<6;ae++){Ae=be[ae].mipmaps;for(let Ge=0;Ge<Ae.length;Ge++){let Fe=Ae[Ge];x.format!==Ln?He!==null?U?ee&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge,0,0,Fe.width,Fe.height,He,Fe.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge,tt,Fe.width,Fe.height,0,Fe.data):qe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge,0,0,Fe.width,Fe.height,He,Xe,Fe.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge,tt,Fe.width,Fe.height,0,He,Xe,Fe.data)}}}else{if(Ae=x.mipmaps,U&&_e){Ae.length>0&&ve++;let ae=et(be[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ve,tt,ae.width,ae.height)}for(let ae=0;ae<6;ae++)if(Be){U?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,be[ae].width,be[ae].height,He,Xe,be[ae].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,tt,be[ae].width,be[ae].height,0,He,Xe,be[ae].data);for(let Ge=0;Ge<Ae.length;Ge++){let Rt=Ae[Ge].image[ae].image;U?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge+1,0,0,Rt.width,Rt.height,He,Xe,Rt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge+1,tt,Rt.width,Rt.height,0,He,Xe,Rt.data)}}else{U?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,0,0,He,Xe,be[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,0,tt,He,Xe,be[ae]);for(let Ge=0;Ge<Ae.length;Ge++){let Fe=Ae[Ge];U?ee&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge+1,0,0,He,Xe,Fe.image[ae]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+ae,Ge+1,tt,He,Xe,Fe.image[ae])}}}m(x)&&S(n.TEXTURE_CUBE_MAP),pe.__version=J.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function Te(A,x,O,$,J,pe){let me=s.convert(O.format,O.colorSpace),K=s.convert(O.type),se=v(O.internalFormat,me,K,O.normalized,O.colorSpace),ge=i.get(x),Be=i.get(O);if(Be.__renderTarget=x,!ge.__hasExternalTextures){let be=Math.max(1,x.width>>pe),xe=Math.max(1,x.height>>pe);J===n.TEXTURE_3D||J===n.TEXTURE_2D_ARRAY?t.texImage3D(J,pe,se,be,xe,x.depth,0,me,K,null):t.texImage2D(J,pe,se,be,xe,0,me,K,null)}t.bindFramebuffer(n.FRAMEBUFFER,A),Ze(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,J,Be.__webglTexture,0,Ve(x)):(J===n.TEXTURE_2D||J>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&J<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,$,J,Be.__webglTexture,pe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function $e(A,x,O){if(n.bindRenderbuffer(n.RENDERBUFFER,A),x.depthBuffer){let $=x.depthTexture,J=$&&$.isDepthTexture?$.type:null,pe=M(x.stencilBuffer,J),me=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;Ze(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ve(x),pe,x.width,x.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ve(x),pe,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,pe,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,me,n.RENDERBUFFER,A)}else{let $=x.textures;for(let J=0;J<$.length;J++){let pe=$[J],me=s.convert(pe.format,pe.colorSpace),K=s.convert(pe.type),se=v(pe.internalFormat,me,K,pe.normalized,pe.colorSpace);Ze(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,Ve(x),se,x.width,x.height):O?n.renderbufferStorageMultisample(n.RENDERBUFFER,Ve(x),se,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,se,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function dt(A,x,O){let $=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,A),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let J=i.get(x.depthTexture);if(J.__renderTarget=x,(!J.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),$){if(J.__webglInit===void 0&&(J.__webglInit=!0,x.depthTexture.addEventListener("dispose",C)),J.__webglTexture===void 0){J.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,J.__webglTexture),it(n.TEXTURE_CUBE_MAP,x.depthTexture);let ge=s.convert(x.depthTexture.format),Be=s.convert(x.depthTexture.type),be;x.depthTexture.format===ri?be=n.DEPTH_COMPONENT24:x.depthTexture.format===nr&&(be=n.DEPTH24_STENCIL8);for(let xe=0;xe<6;xe++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,be,x.width,x.height,0,ge,Be,null)}}else oe(x.depthTexture,0);let pe=J.__webglTexture,me=Ve(x),K=$?n.TEXTURE_CUBE_MAP_POSITIVE_X+O:n.TEXTURE_2D,se=x.depthTexture.format===nr?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===ri)Ze(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,se,K,pe,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,se,K,pe,0);else if(x.depthTexture.format===nr)Ze(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,se,K,pe,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,se,K,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function re(A){let x=i.get(A),O=A.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==A.depthTexture){let $=A.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),$){let J=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,$.removeEventListener("dispose",J)};$.addEventListener("dispose",J),x.__depthDisposeCallback=J}x.__boundDepthTexture=$}if(A.depthTexture&&!x.__autoAllocateDepthBuffer)if(O)for(let $=0;$<6;$++)dt(x.__webglFramebuffer[$],A,$);else{let $=A.texture.mipmaps;$&&$.length>0?dt(x.__webglFramebuffer[0],A,0):dt(x.__webglFramebuffer,A,0)}else if(O){x.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[$]),x.__webglDepthbuffer[$]===void 0)x.__webglDepthbuffer[$]=n.createRenderbuffer(),$e(x.__webglDepthbuffer[$],A,!1);else{let J=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer[$];n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,pe)}}else{let $=A.texture.mipmaps;if($&&$.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),$e(x.__webglDepthbuffer,A,!1);else{let J=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,J,n.RENDERBUFFER,pe)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function le(A,x,O){let $=i.get(A);x!==void 0&&Te($.__webglFramebuffer,A,A.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),O!==void 0&&re(A)}function ue(A){let x=A.texture,O=i.get(A),$=i.get(x);A.addEventListener("dispose",_);let J=A.textures,pe=A.isWebGLCubeRenderTarget===!0,me=J.length>1;if(me||($.__webglTexture===void 0&&($.__webglTexture=n.createTexture()),$.__version=x.version,o.memory.textures++),pe){O.__webglFramebuffer=[];for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer[K]=[];for(let se=0;se<x.mipmaps.length;se++)O.__webglFramebuffer[K][se]=n.createFramebuffer()}else O.__webglFramebuffer[K]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){O.__webglFramebuffer=[];for(let K=0;K<x.mipmaps.length;K++)O.__webglFramebuffer[K]=n.createFramebuffer()}else O.__webglFramebuffer=n.createFramebuffer();if(me)for(let K=0,se=J.length;K<se;K++){let ge=i.get(J[K]);ge.__webglTexture===void 0&&(ge.__webglTexture=n.createTexture(),o.memory.textures++)}if(A.samples>0&&Ze(A)===!1){O.__webglMultisampledFramebuffer=n.createFramebuffer(),O.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,O.__webglMultisampledFramebuffer);for(let K=0;K<J.length;K++){let se=J[K];O.__webglColorRenderbuffer[K]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,O.__webglColorRenderbuffer[K]);let ge=s.convert(se.format,se.colorSpace),Be=s.convert(se.type),be=v(se.internalFormat,ge,Be,se.normalized,se.colorSpace,A.isXRRenderTarget===!0),xe=Ve(A);n.renderbufferStorageMultisample(n.RENDERBUFFER,xe,be,A.width,A.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+K,n.RENDERBUFFER,O.__webglColorRenderbuffer[K])}n.bindRenderbuffer(n.RENDERBUFFER,null),A.depthBuffer&&(O.__webglDepthRenderbuffer=n.createRenderbuffer(),$e(O.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(pe){t.bindTexture(n.TEXTURE_CUBE_MAP,$.__webglTexture),it(n.TEXTURE_CUBE_MAP,x);for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0)for(let se=0;se<x.mipmaps.length;se++)Te(O.__webglFramebuffer[K][se],A,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,se);else Te(O.__webglFramebuffer[K],A,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);m(x)&&S(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(me){for(let K=0,se=J.length;K<se;K++){let ge=J[K],Be=i.get(ge),be=n.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(be=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(be,Be.__webglTexture),it(be,ge),Te(O.__webglFramebuffer,A,ge,n.COLOR_ATTACHMENT0+K,be,0),m(ge)&&S(be)}t.unbindTexture()}else{let K=n.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(K=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(K,$.__webglTexture),it(K,x),x.mipmaps&&x.mipmaps.length>0)for(let se=0;se<x.mipmaps.length;se++)Te(O.__webglFramebuffer[se],A,x,n.COLOR_ATTACHMENT0,K,se);else Te(O.__webglFramebuffer,A,x,n.COLOR_ATTACHMENT0,K,0);m(x)&&S(K),t.unbindTexture()}A.depthBuffer&&re(A)}function W(A){let x=A.textures;for(let O=0,$=x.length;O<$;O++){let J=x[O];if(m(J)){let pe=E(A),me=i.get(J).__webglTexture;t.bindTexture(pe,me),S(pe),t.unbindTexture()}}}let Q=[],Pe=[];function Ne(A){if(A.samples>0){if(Ze(A)===!1){let x=A.textures,O=A.width,$=A.height,J=n.COLOR_BUFFER_BIT,pe=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,me=i.get(A),K=x.length>1;if(K)for(let ge=0;ge<x.length;ge++)t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,me.__webglMultisampledFramebuffer);let se=A.texture.mipmaps;se&&se.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer);for(let ge=0;ge<x.length;ge++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(J|=n.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(J|=n.STENCIL_BUFFER_BIT)),K){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,me.__webglColorRenderbuffer[ge]);let Be=i.get(x[ge]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,Be,0)}n.blitFramebuffer(0,0,O,$,0,0,O,$,J,n.NEAREST),c===!0&&(Q.length=0,Pe.length=0,Q.push(n.COLOR_ATTACHMENT0+ge),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&(Q.push(pe),Pe.push(pe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Pe)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,Q))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),K)for(let ge=0;ge<x.length;ge++){t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,me.__webglColorRenderbuffer[ge]);let Be=i.get(x[ge]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,Be,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&c){let x=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function Ve(A){return Math.min(r.maxSamples,A.samples)}function Ze(A){let x=i.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function N(A){let x=o.render.frame;u.get(A)!==x&&(u.set(A,x),A.update())}function mt(A,x){let O=A.colorSpace,$=A.format,J=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||O!==ta&&O!==yi&&(ut.getTransfer(O)===yt?($!==Ln||J!==bn)&&qe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Je("WebGLTextures: Unsupported texture color space:",O)),x}function et(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=Z,this.resetTextureUnits=V,this.getTextureUnits=z,this.setTextureUnits=B,this.setTexture2D=oe,this.setTexture2DArray=Y,this.setTexture3D=te,this.setTextureCube=ie,this.rebindTextures=le,this.setupRenderTarget=ue,this.updateRenderTargetMipmap=W,this.updateMultisampleRenderTarget=Ne,this.setupDepthRenderbuffer=re,this.setupFrameBufferTexture=Te,this.useMultisampledRTT=Ze,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function oC(n,e){function t(i,r=yi){let s,o=ut.getTransfer(r);if(i===bn)return n.UNSIGNED_BYTE;if(i===$u)return n.UNSIGNED_SHORT_4_4_4_4;if(i===Wu)return n.UNSIGNED_SHORT_5_5_5_1;if(i===ox)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===ax)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===rx)return n.BYTE;if(i===sx)return n.SHORT;if(i===js)return n.UNSIGNED_SHORT;if(i===Vu)return n.INT;if(i===Zn)return n.UNSIGNED_INT;if(i===Xn)return n.FLOAT;if(i===qn)return n.HALF_FLOAT;if(i===cx)return n.ALPHA;if(i===lx)return n.RGB;if(i===Ln)return n.RGBA;if(i===ri)return n.DEPTH_COMPONENT;if(i===nr)return n.DEPTH_STENCIL;if(i===Ia)return n.RED;if(i===Zu)return n.RED_INTEGER;if(i===ir)return n.RG;if(i===Xu)return n.RG_INTEGER;if(i===qu)return n.RGBA_INTEGER;if(i===Na||i===Da||i===za||i===La)if(o===yt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Na)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===Da)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===za)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===La)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Na)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===Da)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===za)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===La)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===Yu||i===Ju||i===ju||i===Ku)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===Yu)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===Ju)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===ju)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===Ku)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===Qu||i===eh||i===th||i===nh||i===ih||i===Ua||i===rh)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===Qu||i===eh)return o===yt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===th)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===nh)return s.COMPRESSED_R11_EAC;if(i===ih)return s.COMPRESSED_SIGNED_R11_EAC;if(i===Ua)return s.COMPRESSED_RG11_EAC;if(i===rh)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===sh||i===oh||i===ah||i===ch||i===lh||i===uh||i===hh||i===dh||i===fh||i===ph||i===mh||i===gh||i===xh||i===_h)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===sh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===oh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===ah)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===ch)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===lh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===uh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===hh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===dh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===fh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===ph)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===mh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===gh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===xh)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===_h)return o===yt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===vh||i===yh||i===bh)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===vh)return o===yt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===yh)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===bh)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Sh||i===Mh||i===Oa||i===wh)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Sh)return s.COMPRESSED_RED_RGTC1_EXT;if(i===Mh)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Oa)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===wh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===Ks?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var aC=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,cC=`
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

}`,Ix=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new ua(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new sn({vertexShader:aC,fragmentShader:cC,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new je(new Tr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Nx=class extends si{constructor(e,t){super();let i=this,r=null,s=1,o=null,a="local-floor",c=1,l=null,u=null,d=null,h=null,f=null,p=null,y=typeof XRWebGLBinding<"u",g=new Ix,m={},S=t.getContextAttributes(),E=null,v=null,M=[],w=[],C=new fe,_=null,T=null,P=new qt;P.viewport=new zt;let D=new qt;D.viewport=new zt;let k=[P,D],V=new ku,z=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(j){let ne=M[j];return ne===void 0&&(ne=new Hs,M[j]=ne),ne.getTargetRaySpace()},this.getControllerGrip=function(j){let ne=M[j];return ne===void 0&&(ne=new Hs,M[j]=ne),ne.getGripSpace()},this.getHand=function(j){let ne=M[j];return ne===void 0&&(ne=new Hs,M[j]=ne),ne.getHandSpace()};function Z(j){let ne=w.indexOf(j.inputSource);if(ne===-1)return;let ye=M[ne];ye!==void 0&&(ye.update(j.inputSource,j.frame,l||o),ye.dispatchEvent({type:j.type,data:j.inputSource}))}function q(){r.removeEventListener("select",Z),r.removeEventListener("selectstart",Z),r.removeEventListener("selectend",Z),r.removeEventListener("squeeze",Z),r.removeEventListener("squeezestart",Z),r.removeEventListener("squeezeend",Z),r.removeEventListener("end",q),r.removeEventListener("inputsourceschange",oe);for(let j=0;j<M.length;j++){let ne=w[j];ne!==null&&(w[j]=null,M[j].disconnect(ne))}z=null,B=null,g.reset();for(let j in m)delete m[j];if(e.setRenderTarget(E),f=null,h=null,d=null,r=null,v=null,ht.stop(),i.isPresenting=!1,e.setPixelRatio(_),e.setSize(C.width,C.height,!1),T!==null){let j=T.camera;j.fov=T.fov,j.zoom=T.zoom,j.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(j){s=j,i.isPresenting===!0&&qe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(j){a=j,i.isPresenting===!0&&qe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(j){l=j},this.getBaseLayer=function(){return h!==null?h:f},this.getBinding=function(){return d===null&&y&&(d=new XRWebGLBinding(r,t)),d},this.getFrame=function(){return p},this.getSession=function(){return r},this.setSession=async function(j){if(r=j,r!==null){if(E=e.getRenderTarget(),r.addEventListener("select",Z),r.addEventListener("selectstart",Z),r.addEventListener("selectend",Z),r.addEventListener("squeeze",Z),r.addEventListener("squeezestart",Z),r.addEventListener("squeezeend",Z),r.addEventListener("end",q),r.addEventListener("inputsourceschange",oe),S.xrCompatible!==!0&&await t.makeXRCompatible(),_=e.getPixelRatio(),e.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let ye=null,We=null,Te=null;S.depth&&(Te=S.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ye=S.stencil?nr:ri,We=S.stencil?Ks:Zn);let $e={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:s};d=this.getBinding(),h=d.createProjectionLayer($e),r.updateRenderState({layers:[h]}),e.setPixelRatio(1),e.setSize(h.textureWidth,h.textureHeight,!1),v=new nn(h.textureWidth,h.textureHeight,{format:Ln,type:bn,depthTexture:new Wi(h.textureWidth,h.textureHeight,We,void 0,void 0,void 0,void 0,void 0,void 0,ye),stencilBuffer:S.stencil,colorSpace:e.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}else{let ye={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,ye),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),v=new nn(f.framebufferWidth,f.framebufferHeight,{format:Ln,type:bn,colorSpace:e.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}v.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),ht.setContext(r),ht.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function oe(j){for(let ne=0;ne<j.removed.length;ne++){let ye=j.removed[ne],We=w.indexOf(ye);We>=0&&(w[We]=null,M[We].disconnect(ye))}for(let ne=0;ne<j.added.length;ne++){let ye=j.added[ne],We=w.indexOf(ye);if(We===-1){for(let $e=0;$e<M.length;$e++)if($e>=w.length){w.push(ye),We=$e;break}else if(w[$e]===null){w[$e]=ye,We=$e;break}if(We===-1)break}let Te=M[We];Te&&Te.connect(ye)}}let Y=new I,te=new I;function ie(j,ne,ye){Y.setFromMatrixPosition(ne.matrixWorld),te.setFromMatrixPosition(ye.matrixWorld);let We=Y.distanceTo(te),Te=ne.projectionMatrix.elements,$e=ye.projectionMatrix.elements,dt=Te[14]/(Te[10]-1),re=Te[14]/(Te[10]+1),le=(Te[9]+1)/Te[5],ue=(Te[9]-1)/Te[5],W=(Te[8]-1)/Te[0],Q=($e[8]+1)/$e[0],Pe=dt*W,Ne=dt*Q,Ve=We/(-W+Q),Ze=Ve*-W;if(ne.matrixWorld.decompose(j.position,j.quaternion,j.scale),j.translateX(Ze),j.translateZ(Ve),j.matrixWorld.compose(j.position,j.quaternion,j.scale),j.matrixWorldInverse.copy(j.matrixWorld).invert(),Te[10]===-1)j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse);else{let N=dt+Ve,mt=re+Ve,et=Pe-Ze,A=Ne+(We-Ze),x=le*re/mt*N,O=ue*re/mt*N;j.projectionMatrix.makePerspective(et,A,x,O,N,mt),j.projectionMatrixInverse.copy(j.projectionMatrix).invert()}}function Le(j,ne){ne===null?j.matrixWorld.copy(j.matrix):j.matrixWorld.multiplyMatrices(ne.matrixWorld,j.matrix),j.matrixWorldInverse.copy(j.matrixWorld).invert()}this.updateCamera=function(j){if(r===null)return;let ne=j.near,ye=j.far;g.texture!==null&&(g.depthNear>0&&(ne=g.depthNear),g.depthFar>0&&(ye=g.depthFar)),V.near=D.near=P.near=ne,V.far=D.far=P.far=ye,(z!==V.near||B!==V.far)&&(r.updateRenderState({depthNear:V.near,depthFar:V.far}),z=V.near,B=V.far),V.layers.mask=j.layers.mask|6,P.layers.mask=V.layers.mask&-5,D.layers.mask=V.layers.mask&-3;let We=j.parent,Te=V.cameras;Le(V,We);for(let $e=0;$e<Te.length;$e++)Le(Te[$e],We);Te.length===2?ie(V,P,D):V.projectionMatrix.copy(P.projectionMatrix),T===null&&j.isPerspectiveCamera&&(T={camera:j,fov:j.fov,zoom:j.zoom}),Ce(j,V,We)};function Ce(j,ne,ye){ye===null?j.matrix.copy(ne.matrixWorld):(j.matrix.copy(ye.matrixWorld),j.matrix.invert(),j.matrix.multiply(ne.matrixWorld)),j.matrix.decompose(j.position,j.quaternion,j.scale),j.updateMatrixWorld(!0),j.projectionMatrix.copy(ne.projectionMatrix),j.projectionMatrixInverse.copy(ne.projectionMatrixInverse),j.isPerspectiveCamera&&(j.fov=ks*2*Math.atan(1/j.projectionMatrix.elements[5]),j.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(h===null&&f===null))return c},this.setFoveation=function(j){c=j,h!==null&&(h.fixedFoveation=j),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=j)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(V)},this.getCameraTexture=function(j){return m[j]};let ct=null;function it(j,ne){if(u=ne.getViewerPose(l||o),p=ne,u!==null){let ye=u.views;f!==null&&(e.setRenderTargetFramebuffer(v,f.framebuffer),e.setRenderTarget(v));let We=!1;ye.length!==V.cameras.length&&(V.cameras.length=0,We=!0);for(let re=0;re<ye.length;re++){let le=ye[re],ue=null;if(f!==null)ue=f.getViewport(le);else{let Q=d.getViewSubImage(h,le);ue=Q.viewport,re===0&&(e.setRenderTargetTextures(v,Q.colorTexture,Q.depthStencilTexture),e.setRenderTarget(v))}let W=k[re];W===void 0&&(W=new qt,W.layers.enable(re),W.viewport=new zt,k[re]=W),W.matrix.fromArray(le.transform.matrix),W.matrix.decompose(W.position,W.quaternion,W.scale),W.projectionMatrix.fromArray(le.projectionMatrix),W.projectionMatrixInverse.copy(W.projectionMatrix).invert(),W.viewport.set(ue.x,ue.y,ue.width,ue.height),re===0&&(V.matrix.copy(W.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),We===!0&&V.cameras.push(W)}let Te=r.enabledFeatures;if(Te&&Te.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&y){d=i.getBinding();let re=d.getDepthInformation(ye[0]);re&&re.isValid&&re.texture&&g.init(re,r.renderState)}if(Te&&Te.includes("camera-access")&&y){e.state.unbindTexture(),d=i.getBinding();for(let re=0;re<ye.length;re++){let le=ye[re].camera;if(le){let ue=m[le];ue||(ue=new ua,m[le]=ue);let W=d.getCameraImage(le);ue.sourceTexture=W}}}}for(let ye=0;ye<M.length;ye++){let We=w[ye],Te=M[ye];We!==null&&Te!==void 0&&Te.update(We,ne,l||o)}ct&&ct(j,ne),ne.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:ne}),p=null}let ht=new jb;ht.setAnimationLoop(it),this.setAnimationLoop=function(j){ct=j},this.dispose=function(){}}},lC=new Pt,iS=new Qe;iS.set(-1,0,0,0,1,0,0,0,1);function uC(n,e){function t(g,m){g.matrixAutoUpdate===!0&&g.updateMatrix(),m.value.copy(g.matrix)}function i(g,m){m.color.getRGB(g.fogColor.value,px(n)),m.isFog?(g.fogNear.value=m.near,g.fogFar.value=m.far):m.isFogExp2&&(g.fogDensity.value=m.density)}function r(g,m,S,E,v){m.isNodeMaterial?m.uniformsNeedUpdate=!1:m.isMeshBasicMaterial?s(g,m):m.isMeshLambertMaterial?(s(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshToonMaterial?(s(g,m),d(g,m)):m.isMeshPhongMaterial?(s(g,m),u(g,m),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)):m.isMeshStandardMaterial?(s(g,m),h(g,m),m.isMeshPhysicalMaterial&&f(g,m,v)):m.isMeshMatcapMaterial?(s(g,m),p(g,m)):m.isMeshDepthMaterial?s(g,m):m.isMeshDistanceMaterial?(s(g,m),y(g,m)):m.isMeshNormalMaterial?s(g,m):m.isLineBasicMaterial?(o(g,m),m.isLineDashedMaterial&&a(g,m)):m.isPointsMaterial?c(g,m,S,E):m.isSpriteMaterial?l(g,m):m.isShadowMaterial?(g.color.value.copy(m.color),g.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function s(g,m){g.opacity.value=m.opacity,m.color&&g.diffuse.value.copy(m.color),m.emissive&&g.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.bumpMap&&(g.bumpMap.value=m.bumpMap,t(m.bumpMap,g.bumpMapTransform),g.bumpScale.value=m.bumpScale,m.side===Jt&&(g.bumpScale.value*=-1)),m.normalMap&&(g.normalMap.value=m.normalMap,t(m.normalMap,g.normalMapTransform),g.normalScale.value.copy(m.normalScale),m.side===Jt&&g.normalScale.value.negate()),m.displacementMap&&(g.displacementMap.value=m.displacementMap,t(m.displacementMap,g.displacementMapTransform),g.displacementScale.value=m.displacementScale,g.displacementBias.value=m.displacementBias),m.emissiveMap&&(g.emissiveMap.value=m.emissiveMap,t(m.emissiveMap,g.emissiveMapTransform)),m.specularMap&&(g.specularMap.value=m.specularMap,t(m.specularMap,g.specularMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest);let S=e.get(m),E=S.envMap,v=S.envMapRotation;E&&(g.envMap.value=E,g.envMapRotation.value.setFromMatrix4(lC.makeRotationFromEuler(v)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(iS),g.reflectivity.value=m.reflectivity,g.ior.value=m.ior,g.refractionRatio.value=m.refractionRatio),m.lightMap&&(g.lightMap.value=m.lightMap,g.lightMapIntensity.value=m.lightMapIntensity,t(m.lightMap,g.lightMapTransform)),m.aoMap&&(g.aoMap.value=m.aoMap,g.aoMapIntensity.value=m.aoMapIntensity,t(m.aoMap,g.aoMapTransform))}function o(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform))}function a(g,m){g.dashSize.value=m.dashSize,g.totalSize.value=m.dashSize+m.gapSize,g.scale.value=m.scale}function c(g,m,S,E){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.size.value=m.size*S,g.scale.value=E*.5,m.map&&(g.map.value=m.map,t(m.map,g.uvTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function l(g,m){g.diffuse.value.copy(m.color),g.opacity.value=m.opacity,g.rotation.value=m.rotation,m.map&&(g.map.value=m.map,t(m.map,g.mapTransform)),m.alphaMap&&(g.alphaMap.value=m.alphaMap,t(m.alphaMap,g.alphaMapTransform)),m.alphaTest>0&&(g.alphaTest.value=m.alphaTest)}function u(g,m){g.specular.value.copy(m.specular),g.shininess.value=Math.max(m.shininess,1e-4)}function d(g,m){m.gradientMap&&(g.gradientMap.value=m.gradientMap)}function h(g,m){g.metalness.value=m.metalness,m.metalnessMap&&(g.metalnessMap.value=m.metalnessMap,t(m.metalnessMap,g.metalnessMapTransform)),g.roughness.value=m.roughness,m.roughnessMap&&(g.roughnessMap.value=m.roughnessMap,t(m.roughnessMap,g.roughnessMapTransform)),m.envMap&&(g.envMapIntensity.value=m.envMapIntensity)}function f(g,m,S){g.ior.value=m.ior,m.sheen>0&&(g.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),g.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(g.sheenColorMap.value=m.sheenColorMap,t(m.sheenColorMap,g.sheenColorMapTransform)),m.sheenRoughnessMap&&(g.sheenRoughnessMap.value=m.sheenRoughnessMap,t(m.sheenRoughnessMap,g.sheenRoughnessMapTransform))),m.clearcoat>0&&(g.clearcoat.value=m.clearcoat,g.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(g.clearcoatMap.value=m.clearcoatMap,t(m.clearcoatMap,g.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,t(m.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(g.clearcoatNormalMap.value=m.clearcoatNormalMap,t(m.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Jt&&g.clearcoatNormalScale.value.negate())),m.dispersion>0&&(g.dispersion.value=m.dispersion),m.retroreflectivity>0&&(g.retroreflectivity.value=m.retroreflectivity),m.iridescence>0&&(g.iridescence.value=m.iridescence,g.iridescenceIOR.value=m.iridescenceIOR,g.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(g.iridescenceMap.value=m.iridescenceMap,t(m.iridescenceMap,g.iridescenceMapTransform)),m.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=m.iridescenceThicknessMap,t(m.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),m.transmission>0&&(g.transmission.value=m.transmission,g.transmissionSamplerMap.value=S.texture,g.transmissionSamplerSize.value.set(S.width,S.height),m.transmissionMap&&(g.transmissionMap.value=m.transmissionMap,t(m.transmissionMap,g.transmissionMapTransform)),g.thickness.value=m.thickness,m.thicknessMap&&(g.thicknessMap.value=m.thicknessMap,t(m.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=m.attenuationDistance,g.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(g.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(g.anisotropyMap.value=m.anisotropyMap,t(m.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=m.specularIntensity,g.specularColor.value.copy(m.specularColor),m.specularColorMap&&(g.specularColorMap.value=m.specularColorMap,t(m.specularColorMap,g.specularColorMapTransform)),m.specularIntensityMap&&(g.specularIntensityMap.value=m.specularIntensityMap,t(m.specularIntensityMap,g.specularIntensityMapTransform))}function p(g,m){m.matcap&&(g.matcap.value=m.matcap)}function y(g,m){let S=e.get(m).light;g.referencePosition.value.setFromMatrixPosition(S.matrixWorld),g.nearDistance.value=S.shadow.camera.near,g.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function hC(n,e,t,i){let r={},s={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(v,M){let w=M.program;i.uniformBlockBinding(v,w)}function l(v,M){let w=r[v.id];w===void 0&&(g(v),w=u(v),r[v.id]=w,v.addEventListener("dispose",S));let C=M.program;i.updateUBOMapping(v,C);let _=e.render.frame;s[v.id]!==_&&(h(v),s[v.id]=_)}function u(v){let M=d();v.__bindingPointIndex=M;let w=n.createBuffer(),C=v.__size,_=v.usage;return n.bindBuffer(n.UNIFORM_BUFFER,w),n.bufferData(n.UNIFORM_BUFFER,C,_),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,w),w}function d(){for(let v=0;v<a;v++)if(o.indexOf(v)===-1)return o.push(v),v;return Je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function h(v){let M=r[v.id],w=v.uniforms,C=v.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let _=0,T=w.length;_<T;_++){let P=w[_];if(Array.isArray(P))for(let D=0,k=P.length;D<k;D++)f(P[D],_,D,C);else f(P,_,0,C)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(v,M,w,C){if(y(v,M,w,C)===!0){let _=v.__offset,T=v.value;if(Array.isArray(T)){let P=0;for(let D=0;D<T.length;D++){let k=T[D],V=m(k);p(k,v.__data,P),typeof k!="number"&&typeof k!="boolean"&&!k.isMatrix3&&!ArrayBuffer.isView(k)&&(P+=V.storage/Float32Array.BYTES_PER_ELEMENT)}}else p(T,v.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,_,v.__data)}}function p(v,M,w){typeof v=="number"||typeof v=="boolean"?M[0]=v:v.isMatrix3?(M[0]=v.elements[0],M[1]=v.elements[1],M[2]=v.elements[2],M[3]=0,M[4]=v.elements[3],M[5]=v.elements[4],M[6]=v.elements[5],M[7]=0,M[8]=v.elements[6],M[9]=v.elements[7],M[10]=v.elements[8],M[11]=0):ArrayBuffer.isView(v)?M.set(new v.constructor(v.buffer,v.byteOffset,M.length)):v.toArray(M,w)}function y(v,M,w,C){let _=v.value,T=M+"_"+w;if(C[T]===void 0)return typeof _=="number"||typeof _=="boolean"?C[T]=_:ArrayBuffer.isView(_)?C[T]=_.slice():C[T]=_.clone(),!0;{let P=C[T];if(typeof _=="number"||typeof _=="boolean"){if(P!==_)return C[T]=_,!0}else{if(ArrayBuffer.isView(_))return!0;if(P.equals(_)===!1)return P.copy(_),!0}}return!1}function g(v){let M=v.uniforms,w=0,C=16;for(let T=0,P=M.length;T<P;T++){let D=Array.isArray(M[T])?M[T]:[M[T]];for(let k=0,V=D.length;k<V;k++){let z=D[k],B=Array.isArray(z.value)?z.value:[z.value];for(let Z=0,q=B.length;Z<q;Z++){let oe=B[Z],Y=m(oe),te=w%C,ie=te%Y.boundary,Le=te+ie;w+=ie,Le!==0&&C-Le<Y.storage&&(w+=C-Le),z.__data=new Float32Array(Y.storage/Float32Array.BYTES_PER_ELEMENT),z.__offset=w,w+=Y.storage}}}let _=w%C;return _>0&&(w+=C-_),v.__size=w,v.__cache={},this}function m(v){let M={boundary:0,storage:0};return typeof v=="number"||typeof v=="boolean"?(M.boundary=4,M.storage=4):v.isVector2?(M.boundary=8,M.storage=8):v.isVector3||v.isColor?(M.boundary=16,M.storage=12):v.isVector4?(M.boundary=16,M.storage=16):v.isMatrix3?(M.boundary=48,M.storage=48):v.isMatrix4?(M.boundary=64,M.storage=64):v.isTexture?qe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(v)?(M.boundary=16,M.storage=v.byteLength):qe("WebGLRenderer: Unsupported uniform value type.",v),M}function S(v){let M=v.target;M.removeEventListener("dispose",S);let w=o.indexOf(M.__bindingPointIndex);o.splice(w,1),n.deleteBuffer(r[M.id]),delete r[M.id],delete s[M.id]}function E(){for(let v in r)n.deleteBuffer(r[v]);o=[],r={},s={}}return{bind:c,update:l,dispose:E}}var dC=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),ci=null;function fC(){return ci===null&&(ci=new $i(dC,16,16,ir,qn),ci.name="DFG_LUT",ci.minFilter=Yt,ci.magFilter=Yt,ci.wrapS=ii,ci.wrapT=ii,ci.generateMipmaps=!1,ci.needsUpdate=!0),ci}var Nh=class{constructor(e={}){let{canvas:t=_b(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:h=!1,outputBufferType:f=bn}=e;this.isWebGLRenderer=!0;let p;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");p=i.getContextAttributes().alpha}else p=o;let y=f,g=new Set([qu,Xu,Zu]),m=new Set([bn,Zn,js,Ks,$u,Wu]),S=new Uint32Array(4),E=new Int32Array(4),v=new I,M=null,w=null,C=[],_=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Wn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,D=!1,k=null,V=null,z=null,B=null;this._outputColorSpace=pn;let Z=0,q=0,oe=null,Y=-1,te=null,ie=new zt,Le=new zt,Ce=null,ct=new Ue(0),it=0,ht=t.width,j=t.height,ne=1,ye=null,We=null,Te=new zt(0,0,ht,j),$e=new zt(0,0,ht,j),dt=!1,re=new $s,le=!1,ue=!1,W=new Pt,Q=new I,Pe=new zt,Ne={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},Ve=!1;function Ze(){return oe===null?ne:1}let N=i;function mt(b,L){return t.getContext(b,L)}let et,A,x,O,$,J,pe,me,K,se,ge,Be,be,xe,He,Xe,tt,U,_e,ee,ve,Ae,ae;try{let b={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:d};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Rt,!1),t.addEventListener("webglcontextrestored",xt,!1),t.addEventListener("webglcontextcreationerror",Un,!1),N===null){let L="webgl2";if(N=mt(L,b),N===null)throw mt(L)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}Ge()}catch(b){throw t.removeEventListener("webglcontextlost",Rt,!1),t.removeEventListener("webglcontextrestored",xt,!1),t.removeEventListener("webglcontextcreationerror",Un,!1),Je("WebGLRenderer: "+b.message),b}function Ge(){et=new y2(N),et.init(),ve=new oC(N,et),A=new u2(N,et,e,ve),x=new rC(N,et),A.reversedDepthBuffer&&h&&x.buffers.depth.setReversed(!0),V=N.createFramebuffer(),z=N.createFramebuffer(),B=N.createFramebuffer(),O=new M2(N),$=new $R,J=new sC(N,et,x,$,A,ve,O),pe=new v2(P),me=new EE(N),Ae=new c2(N,me),K=new b2(N,me,O,Ae),se=new E2(N,K,me,Ae,O),U=new w2(N,A,J),He=new h2($),ge=new VR(P,pe,et,A,Ae,He),Be=new uC(P,$),be=new ZR,xe=new KR(et),tt=new a2(P,pe,x,se,p,c),Xe=new iC(P,se,A),ae=new hC(N,O,A,x),_e=new l2(N,et,O),ee=new S2(N,et,O),O.programs=ge.programs,P.capabilities=A,P.extensions=et,P.properties=$,P.renderLists=be,P.shadowMap=Xe,P.state=x,P.info=O}y!==bn&&(T=new A2(y,t.width,t.height,a,r,s));let Fe=new Nx(P,N);this.xr=Fe,this.getContext=function(){return N},this.getContextAttributes=function(){return N.getContextAttributes()},this.forceContextLoss=function(){let b=et.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=et.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return ne},this.setPixelRatio=function(b){b!==void 0&&(ne=b,this.setSize(ht,j,!1))},this.getSize=function(b){return b.set(ht,j)},this.setSize=function(b,L,X=!0){if(Fe.isPresenting){qe("WebGLRenderer: Can't change size while VR device is presenting.");return}ht=b,j=L,t.width=Math.floor(b*ne),t.height=Math.floor(L*ne),X===!0&&(t.style.width=b+"px",t.style.height=L+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,b,L)},this.getDrawingBufferSize=function(b){return b.set(ht*ne,j*ne).floor()},this.setDrawingBufferSize=function(b,L,X){ht=b,j=L,ne=X,t.width=Math.floor(b*X),t.height=Math.floor(L*X),this.setViewport(0,0,b,L)},this.setEffects=function(b){if(y===bn){Je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let L=0;L<b.length;L++)if(b[L].isOutputPass===!0){qe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(ie)},this.getViewport=function(b){return b.copy(Te)},this.setViewport=function(b,L,X,H){b.isVector4?Te.set(b.x,b.y,b.z,b.w):Te.set(b,L,X,H),x.viewport(ie.copy(Te).multiplyScalar(ne).round())},this.getScissor=function(b){return b.copy($e)},this.setScissor=function(b,L,X,H){b.isVector4?$e.set(b.x,b.y,b.z,b.w):$e.set(b,L,X,H),x.scissor(Le.copy($e).multiplyScalar(ne).round())},this.getScissorTest=function(){return dt},this.setScissorTest=function(b){x.setScissorTest(dt=b)},this.setOpaqueSort=function(b){ye=b},this.setTransparentSort=function(b){We=b},this.getClearColor=function(b){return b.copy(tt.getClearColor())},this.setClearColor=function(){tt.setClearColor(...arguments)},this.getClearAlpha=function(){return tt.getClearAlpha()},this.setClearAlpha=function(){tt.setClearAlpha(...arguments)},this.clear=function(b=!0,L=!0,X=!0){let H=0;if(b){let G=!1;if(oe!==null){let Ee=oe.texture.format;G=g.has(Ee)}if(G){let Ee=oe.texture.type,Ie=m.has(Ee),we=tt.getClearColor(),De=tt.getClearAlpha(),ke=we.r,rt=we.g,lt=we.b;Ie?(S[0]=ke,S[1]=rt,S[2]=lt,S[3]=De,N.clearBufferuiv(N.COLOR,0,S)):(E[0]=ke,E[1]=rt,E[2]=lt,E[3]=De,N.clearBufferiv(N.COLOR,0,E))}else H|=N.COLOR_BUFFER_BIT}L&&(H|=N.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),X&&(H|=N.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H!==0&&N.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),k=b},this.dispose=function(){t.removeEventListener("webglcontextlost",Rt,!1),t.removeEventListener("webglcontextrestored",xt,!1),t.removeEventListener("webglcontextcreationerror",Un,!1),tt.dispose(),be.dispose(),xe.dispose(),$.dispose(),pe.dispose(),se.dispose(),Ae.dispose(),ae.dispose(),ge.dispose(),Fe.dispose(),Fe.removeEventListener("sessionstart",Vx),Fe.removeEventListener("sessionend",$x),cr.stop()};function Rt(b){b.preventDefault(),hx("WebGLRenderer: Context Lost."),D=!0}function xt(){hx("WebGLRenderer: Context Restored."),D=!1;let b=O.autoReset,L=Xe.enabled,X=Xe.autoUpdate,H=Xe.needsUpdate,G=Xe.type;Ge(),O.autoReset=b,Xe.enabled=L,Xe.autoUpdate=X,Xe.needsUpdate=H,Xe.type=G}function Un(b){Je("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function Jn(b){let L=b.target;L.removeEventListener("dispose",Jn),kS(L)}function kS(b){BS(b),$.remove(b)}function BS(b){let L=$.get(b).programs;L!==void 0&&(L.forEach(function(X){ge.releaseProgram(X)}),b.isShaderMaterial&&ge.releaseShaderCache(b))}this.renderBufferDirect=function(b,L,X,H,G,Ee){L===null&&(L=Ne);let Ie=G.isMesh&&G.matrixWorld.determinantAffine()<0,we=VS(b,L,X,H,G);x.setMaterial(H,Ie);let De=X.index,ke=1;if(H.wireframe===!0){if(De=K.getWireframeAttribute(X),De===void 0)return;ke=2}let rt=X.drawRange,lt=X.attributes.position,ze=rt.start*ke,_t=(rt.start+rt.count)*ke;Ee!==null&&(ze=Math.max(ze,Ee.start*ke),_t=Math.min(_t,(Ee.start+Ee.count)*ke)),De!==null?(ze=Math.max(ze,0),_t=Math.min(_t,De.count)):lt!=null&&(ze=Math.max(ze,0),_t=Math.min(_t,lt.count));let Bt=_t-ze;if(Bt<0||Bt===1/0)return;Ae.setup(G,H,we,X,De);let It,Tt=_e;if(De!==null&&(It=me.get(De),Tt=ee,Tt.setIndex(It)),G.isMesh)H.wireframe===!0?(x.setLineWidth(H.wireframeLinewidth*Ze()),Tt.setMode(N.LINES)):Tt.setMode(N.TRIANGLES);else if(G.isLine){let jt=H.linewidth;jt===void 0&&(jt=1),x.setLineWidth(jt*Ze()),G.isLineSegments?Tt.setMode(N.LINES):G.isLineLoop?Tt.setMode(N.LINE_LOOP):Tt.setMode(N.LINE_STRIP)}else G.isPoints?Tt.setMode(N.POINTS):G.isSprite&&Tt.setMode(N.TRIANGLES);if(G.isBatchedMesh)if(et.get("WEBGL_multi_draw"))Tt.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let jt=G._multiDrawStarts,Re=G._multiDrawCounts,an=G._multiDrawCount,ft=De?me.get(De).bytesPerElement:1,Cn=$.get(H).currentProgram.getUniforms();for(let jn=0;jn<an;jn++)Cn.setValue(N,"_gl_DrawID",jn),Tt.render(jt[jn]/ft,Re[jn])}else if(G.isInstancedMesh)Tt.renderInstances(ze,Bt,G.count);else if(X.isInstancedBufferGeometry){let jt=X._maxInstanceCount!==void 0?X._maxInstanceCount:1/0,Re=Math.min(X.instanceCount,jt);Tt.renderInstances(ze,Bt,Re)}else Tt.render(ze,Bt)};function Gx(b,L,X,H){k!==null&&b.isNodeMaterial&&k.setObject(H,b),le===!0&&He.setState(b,X,!1),b.transparent===!0&&b.side===zn&&b.forceSinglePass===!1?(b.side=Jt,b.needsUpdate=!0,Wa(b,L,H),b.side=Qi,b.needsUpdate=!0,Wa(b,L,H),b.side=zn):Wa(b,L,H)}this.compile=function(b,L,X=null){X===null&&(X=b),k!==null&&k.renderStart(b,L,X),w=xe.get(X),w.init(L),_.push(w),X.traverseVisible(function(G){G.isLight&&G.layers.test(L.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),b!==X&&b.traverseVisible(function(G){G.isLight&&G.layers.test(L.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),w.setupLights(),k!==null&&k.updateLights(w.state.lightsArray),ue=this.localClippingEnabled,le=He.init(this.clippingPlanes,ue),le===!0&&He.setGlobalState(this.clippingPlanes,L),k!==null&&Xe.render(w.state.shadowsArray,X,L);let H=new Set;return b.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let Ee=G.material;if(Ee)if(Array.isArray(Ee))for(let Ie=0;Ie<Ee.length;Ie++){let we=Ee[Ie];Gx(we,X,L,G),H.add(we)}else Gx(Ee,X,L,G),H.add(Ee)}),w=_.pop(),k!==null&&k.renderEnd(),H},this.compileAsync=function(b,L,X=null){let H=this.compile(b,L,X);return new Promise(G=>{function Ee(){if(H.forEach(function(Ie){let De=$.get(Ie).currentProgram;(De===void 0||De.isReady())&&H.delete(Ie)}),H.size===0){G(b);return}setTimeout(Ee,10)}et.get("KHR_parallel_shader_compile")!==null?Ee():setTimeout(Ee,10)})};let jh=null;function HS(b){jh&&jh(b)}function Vx(){cr.stop()}function $x(){cr.start()}let cr=new jb;cr.setAnimationLoop(HS),typeof self<"u"&&cr.setContext(self),this.setAnimationLoop=function(b){jh=b,Fe.setAnimationLoop(b),b===null?cr.stop():cr.start()},Fe.addEventListener("sessionstart",Vx),Fe.addEventListener("sessionend",$x),this.render=function(b,L){if(L!==void 0&&L.isCamera!==!0){Je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(D===!0)return;k!==null&&k.renderStart(b,L);let X=Fe.enabled===!0&&Fe.isPresenting===!0,H=T!==null&&(oe===null||X)&&T.begin(P,oe);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),Fe.enabled===!0&&Fe.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Fe.cameraAutoUpdate===!0&&Fe.updateCamera(L),L=Fe.getCamera()),b.isScene===!0&&b.onBeforeRender(P,b,L,oe),w=xe.get(b,_.length),w.init(L),w.state.textureUnits=J.getTextureUnits(),_.push(w),W.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),re.setFromProjectionMatrix(W,$n,L.reversedDepth),ue=this.localClippingEnabled,le=He.init(this.clippingPlanes,ue),M=be.get(b,C.length),M.init(),C.push(M),Fe.enabled===!0&&Fe.isPresenting===!0){let Ie=P.xr.getDepthSensingMesh();Ie!==null&&Kh(Ie,L,-1/0,P.sortObjects)}Kh(b,L,0,P.sortObjects),M.finish(),k!==null&&k.updateLights(w.state.lightsArray),P.sortObjects===!0&&M.sort(ye,We),Ve=Fe.enabled===!1||Fe.isPresenting===!1||Fe.hasDepthSensing()===!1,Ve&&tt.addToRenderList(M,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),le===!0&&He.beginShadows();let G=w.state.shadowsArray;if(Xe.render(G,b,L),le===!0&&He.endShadows(),(H&&T.hasRenderPass())===!1){let Ie=M.opaque,we=M.transmissive;if(w.setupLights(),L.isArrayCamera){let De=L.cameras;if(we.length>0)for(let ke=0,rt=De.length;ke<rt;ke++){let lt=De[ke];Zx(Ie,we,b,lt)}Ve&&tt.render(b);for(let ke=0,rt=De.length;ke<rt;ke++){let lt=De[ke];Wx(M,b,lt,lt.viewport)}}else we.length>0&&Zx(Ie,we,b,L),Ve&&tt.render(b),Wx(M,b,L)}oe!==null&&q===0&&(J.updateMultisampleRenderTarget(oe),J.updateRenderTargetMipmap(oe)),H&&T.end(P),b.isScene===!0&&b.onAfterRender(P,b,L),Ae.resetDefaultState(),Y=-1,te=null,_.pop(),_.length>0?(w=_[_.length-1],J.setTextureUnits(w.state.textureUnits),le===!0&&He.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,C.pop(),C.length>0?M=C[C.length-1]:M=null,k!==null&&k.renderEnd()};function Kh(b,L,X,H){if(b.visible===!1)return;if(b.layers.test(L.layers)){if(b.isGroup)X=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(L);else if(b.isLightProbeGrid)w.pushLightProbeGrid(b);else if(b.isLight)w.pushLight(b),b.castShadow&&w.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(re)){H&&Pe.setFromMatrixPosition(b.matrixWorld).applyMatrix4(W);let Ie=se.update(b),we=b.material;we.visible&&M.push(b,Ie,we,X,Pe.z,null,L)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(re))){let Ie=se.update(b),we=b.material;if(H&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Pe.copy(b.boundingSphere.center)):(Ie.boundingSphere===null&&Ie.computeBoundingSphere(),Pe.copy(Ie.boundingSphere.center)),Pe.applyMatrix4(b.matrixWorld).applyMatrix4(W)),Array.isArray(we)){let De=Ie.groups;for(let ke=0,rt=De.length;ke<rt;ke++){let lt=De[ke],ze=we[lt.materialIndex];ze&&ze.visible&&M.push(b,Ie,ze,X,Pe.z,lt,L)}}else we.visible&&M.push(b,Ie,we,X,Pe.z,null,L)}}let Ee=b.children;for(let Ie=0,we=Ee.length;Ie<we;Ie++)Kh(Ee[Ie],L,X,H)}function Wx(b,L,X,H){let{opaque:G,transmissive:Ee,transparent:Ie}=b;w.setupLightsView(X),le===!0&&He.setGlobalState(P.clippingPlanes,X),H&&x.viewport(ie.copy(H)),G.length>0&&$a(G,L,X),Ee.length>0&&$a(Ee,L,X),Ie.length>0&&$a(Ie,L,X),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function Zx(b,L,X,H){if((X.isScene===!0?X.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[H.id]===void 0){let ze=et.has("EXT_color_buffer_half_float")||et.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[H.id]=new nn(1,1,{generateMipmaps:!0,type:ze?qn:bn,minFilter:tr,samples:Math.max(4,A.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ut.workingColorSpace})}let Ee=w.state.transmissionRenderTarget[H.id],Ie=H.viewport||ie;Ee.setSize(Ie.z*P.transmissionResolutionScale,Ie.w*P.transmissionResolutionScale);let we=P.getRenderTarget(),De=P.getActiveCubeFace(),ke=P.getActiveMipmapLevel();P.setRenderTarget(Ee),P.getClearColor(ct),it=P.getClearAlpha(),it<1&&P.setClearColor(16777215,.5),P.clear(),Ve&&tt.render(X);let rt=P.toneMapping;P.toneMapping=Wn;let lt=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),w.setupLightsView(H),le===!0&&He.setGlobalState(P.clippingPlanes,H),$a(b,X,H),J.updateMultisampleRenderTarget(Ee),J.updateRenderTargetMipmap(Ee),et.has("WEBGL_multisampled_render_to_texture")===!1){let ze=!1;for(let _t=0,Bt=L.length;_t<Bt;_t++){let It=L[_t],{object:Tt,geometry:jt,material:Re,group:an}=It;if(Re.side===zn&&Tt.layers.test(H.layers)){let ft=Re.side;Re.side=Jt,Re.needsUpdate=!0,Xx(Tt,X,H,jt,Re,an),Re.side=ft,Re.needsUpdate=!0,ze=!0}}ze===!0&&(J.updateMultisampleRenderTarget(Ee),J.updateRenderTargetMipmap(Ee))}P.setRenderTarget(we,De,ke),P.setClearColor(ct,it),lt!==void 0&&(H.viewport=lt),P.toneMapping=rt}function $a(b,L,X){let H=L.isScene===!0?L.overrideMaterial:null;for(let G=0,Ee=b.length;G<Ee;G++){let Ie=b[G],{object:we,geometry:De,group:ke}=Ie,rt=Ie.material;rt.allowOverride===!0&&H!==null&&(rt=H),we.layers.test(X.layers)&&Xx(we,L,X,De,rt,ke)}}function Xx(b,L,X,H,G,Ee){k!==null&&G.isNodeMaterial&&k.setObject(b,G),b.onBeforeRender(P,L,X,H,G,Ee),b.modelViewMatrix.multiplyMatrices(X.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),G.onBeforeRender(P,L,X,H,b,Ee),G.transparent===!0&&G.side===zn&&G.forceSinglePass===!1?(G.side=Jt,G.needsUpdate=!0,P.renderBufferDirect(X,L,H,G,b,Ee),G.side=Qi,G.needsUpdate=!0,P.renderBufferDirect(X,L,H,G,b,Ee),G.side=zn):P.renderBufferDirect(X,L,H,G,b,Ee),b.onAfterRender(P,L,X,H,G,Ee)}function Wa(b,L,X){L.isScene!==!0&&(L=Ne);let H=$.get(b),G=w.state.lights,Ee=w.state.shadowsArray,Ie=G.state.version,we=ge.getParameters(b,G.state,Ee,L,X,w.state.lightProbeGridArray),De=ge.getProgramCacheKey(we),ke=H.programs;H.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?L.environment:null,H.fog=L.fog;let rt=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;H.envMap=pe.get(b.envMap||H.environment,rt),H.envMapRotation=H.environment!==null&&b.envMap===null?L.environmentRotation:b.envMapRotation,ke===void 0&&(b.addEventListener("dispose",Jn),ke=new Map,H.programs=ke);let lt=ke.get(De);if(lt!==void 0){if(H.currentProgram===lt&&H.lightsStateVersion===Ie)return Yx(b,we),lt}else we.uniforms=ge.getUniforms(b),k!==null&&b.isNodeMaterial&&k.build(b,X,we),b.onBeforeCompile(we,P),lt=ge.acquireProgram(we,De),ke.set(De,lt),H.uniforms=we.uniforms;let ze=H.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(ze.clippingPlanes=He.uniform),Yx(b,we),H.needsLights=WS(b),H.lightsStateVersion=Ie,H.needsLights&&(ze.ambientLightColor.value=G.state.ambient,ze.lightProbe.value=G.state.probe,ze.sunLights.value=G.state.sun,ze.sunLightShadows.value=G.state.sunShadow,ze.directionalLights.value=G.state.directional,ze.directionalLightShadows.value=G.state.directionalShadow,ze.spotLights.value=G.state.spot,ze.spotLightShadows.value=G.state.spotShadow,ze.rectAreaLights.value=G.state.rectArea,ze.ltc_1.value=G.state.rectAreaLTC1,ze.ltc_2.value=G.state.rectAreaLTC2,ze.pointLights.value=G.state.point,ze.pointLightShadows.value=G.state.pointShadow,ze.hemisphereLights.value=G.state.hemi,ze.sunShadowMatrix.value=G.state.sunShadowMatrix,ze.sunShadowCascade.value=G.state.sunShadowCascade,ze.directionalShadowMatrix.value=G.state.directionalShadowMatrix,ze.spotLightMatrix.value=G.state.spotLightMatrix,ze.spotLightMap.value=G.state.spotLightMap,ze.pointShadowMatrix.value=G.state.pointShadowMatrix),H.lightProbeGrid=w.state.lightProbeGridArray.length>0,H.currentProgram=lt,H.uniformsList=null,lt}function qx(b){if(b.uniformsList===null){let L=b.currentProgram.getUniforms();b.uniformsList=to.seqWithValue(L.seq,b.uniforms)}return b.uniformsList}function Yx(b,L){let X=$.get(b);X.outputColorSpace=L.outputColorSpace,X.batching=L.batching,X.batchingColor=L.batchingColor,X.instancing=L.instancing,X.instancingColor=L.instancingColor,X.instancingMorph=L.instancingMorph,X.skinning=L.skinning,X.morphTargets=L.morphTargets,X.morphNormals=L.morphNormals,X.morphColors=L.morphColors,X.morphTargetsCount=L.morphTargetsCount,X.numClippingPlanes=L.numClippingPlanes,X.numIntersection=L.numClipIntersection,X.vertexAlphas=L.vertexAlphas,X.vertexTangents=L.vertexTangents,X.toneMapping=L.toneMapping}function GS(b,L){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;v.setFromMatrixPosition(L.matrixWorld);for(let X=0,H=b.length;X<H;X++){let G=b[X];if(G.texture!==null&&G.boundingBox.containsPoint(v))return G}return null}function VS(b,L,X,H,G){L.isScene!==!0&&(L=Ne),J.resetTextureUnits();let Ee=L.fog,Ie=H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial?L.environment:null,we=oe===null?P.outputColorSpace:oe.isXRRenderTarget===!0?oe.texture.colorSpace:ut.workingColorSpace,De=H.isMeshStandardMaterial||H.isMeshLambertMaterial&&!H.envMap||H.isMeshPhongMaterial&&!H.envMap,ke=pe.get(H.envMap||Ie,De),rt=H.vertexColors===!0&&!!X.attributes.color&&X.attributes.color.itemSize===4,lt=!!X.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),ze=!!X.morphAttributes.position,_t=!!X.morphAttributes.normal,Bt=!!X.morphAttributes.color,It=Wn;H.toneMapped&&(oe===null||oe.isXRRenderTarget===!0)&&(It=P.toneMapping);let Tt=X.morphAttributes.position||X.morphAttributes.normal||X.morphAttributes.color,jt=Tt!==void 0?Tt.length:0,Re=$.get(H),an=w.state.lights;if(le===!0&&(ue===!0||b!==te)){let Ct=b===te&&H.id===Y;He.setState(H,b,Ct)}let ft=!1;H.version===Re.__version?(Re.needsLights&&Re.lightsStateVersion!==an.state.version||Re.outputColorSpace!==we||G.isBatchedMesh&&Re.batching===!1||!G.isBatchedMesh&&Re.batching===!0||G.isBatchedMesh&&Re.batchingColor===!0&&G._colorsTexture===null||G.isBatchedMesh&&Re.batchingColor===!1&&G._colorsTexture!==null||G.isInstancedMesh&&Re.instancing===!1||!G.isInstancedMesh&&Re.instancing===!0||G.isSkinnedMesh&&Re.skinning===!1||!G.isSkinnedMesh&&Re.skinning===!0||G.isInstancedMesh&&Re.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Re.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Re.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Re.instancingMorph===!1&&G.morphTexture!==null||Re.envMap!==ke||H.fog===!0&&Re.fog!==Ee||Re.numClippingPlanes!==void 0&&(Re.numClippingPlanes!==He.numPlanes||Re.numIntersection!==He.numIntersection)||Re.vertexAlphas!==rt||Re.vertexTangents!==lt||Re.morphTargets!==ze||Re.morphNormals!==_t||Re.morphColors!==Bt||Re.toneMapping!==It||Re.morphTargetsCount!==jt||!!Re.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(ft=!0):(ft=!0,Re.__version=H.version);let Cn=Re.currentProgram;ft===!0&&(Cn=Wa(H,L,G),k&&H.isNodeMaterial&&k.onUpdateProgram(H,Cn,Re));let jn=!1,bi=!1,Hr=!1,Mt=Cn.getUniforms(),kt=Re.uniforms;if(x.useProgram(Cn.program)&&(jn=!0,bi=!0,Hr=!0),H.id!==Y&&(Y=H.id,bi=!0),Re.needsLights){let Ct=GS(w.state.lightProbeGridArray,G);Re.lightProbeGrid!==Ct&&(Re.lightProbeGrid=Ct,bi=!0)}if(jn||te!==b){x.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),Mt.setValue(N,"projectionMatrix",b.projectionMatrix),Mt.setValue(N,"viewMatrix",b.matrixWorldInverse);let Mi=Mt.map.cameraPosition;Mi!==void 0&&Mi.setValue(N,Q.setFromMatrixPosition(b.matrixWorld)),A.logarithmicDepthBuffer&&Mt.setValue(N,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&Mt.setValue(N,"isOrthographic",b.isOrthographicCamera===!0),te!==b&&(te=b,bi=!0,Hr=!0)}if(Re.needsLights&&(an.state.sunShadowMap.length>0&&Mt.setValue(N,"sunShadowMap",an.state.sunShadowMap,J),an.state.directionalShadowMap.length>0&&Mt.setValue(N,"directionalShadowMap",an.state.directionalShadowMap,J),an.state.spotShadowMap.length>0&&Mt.setValue(N,"spotShadowMap",an.state.spotShadowMap,J),an.state.pointShadowMap.length>0&&Mt.setValue(N,"pointShadowMap",an.state.pointShadowMap,J)),G.isSkinnedMesh){Mt.setOptional(N,G,"bindMatrix"),Mt.setOptional(N,G,"bindMatrixInverse");let Ct=G.skeleton;Ct&&(Ct.boneTexture===null&&Ct.computeBoneTexture(),Mt.setValue(N,"boneTexture",Ct.boneTexture,J))}G.isBatchedMesh&&(Mt.setOptional(N,G,"batchingTexture"),Mt.setValue(N,"batchingTexture",G._matricesTexture,J),Mt.setOptional(N,G,"batchingIdTexture"),Mt.setValue(N,"batchingIdTexture",G._indirectTexture,J),Mt.setOptional(N,G,"batchingColorTexture"),G._colorsTexture!==null&&Mt.setValue(N,"batchingColorTexture",G._colorsTexture,J));let Si=X.morphAttributes;if((Si.position!==void 0||Si.normal!==void 0||Si.color!==void 0)&&U.update(G,X,Cn),(bi||Re.receiveShadow!==G.receiveShadow)&&(Re.receiveShadow=G.receiveShadow,Mt.setValue(N,"receiveShadow",G.receiveShadow)),(H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial)&&H.envMap===null&&L.environment!==null&&(kt.envMapIntensity.value=L.environmentIntensity),kt.dfgLUT!==void 0&&(kt.dfgLUT.value=fC()),bi){if(Mt.setValue(N,"toneMappingExposure",P.toneMappingExposure),Re.needsLights&&$S(kt,Hr),Ee&&H.fog===!0&&Be.refreshFogUniforms(kt,Ee),Be.refreshMaterialUniforms(kt,H,ne,j,w.state.transmissionRenderTarget[b.id]),Re.needsLights&&Re.lightProbeGrid){let Ct=Re.lightProbeGrid;kt.probesSH.value=Ct.texture,kt.probesMin.value.copy(Ct.boundingBox.min),kt.probesMax.value.copy(Ct.boundingBox.max),kt.probesResolution.value.copy(Ct.resolution)}to.upload(N,qx(Re),kt,J)}if(H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(to.upload(N,qx(Re),kt,J),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&Mt.setValue(N,"center",G.center),Mt.setValue(N,"modelViewMatrix",G.modelViewMatrix),Mt.setValue(N,"normalMatrix",G.normalMatrix),Mt.setValue(N,"modelMatrix",G.matrixWorld),H.uniformsGroups!==void 0){let Ct=H.uniformsGroups;for(let Mi=0,Gr=Ct.length;Mi<Gr;Mi++){let jx=Ct[Mi];ae.update(jx,Cn),ae.bind(jx,Cn)}}return Cn}function $S(b,L){b.ambientLightColor.needsUpdate=L,b.lightProbe.needsUpdate=L,b.sunLights.needsUpdate=L,b.sunLightShadows.needsUpdate=L,b.directionalLights.needsUpdate=L,b.directionalLightShadows.needsUpdate=L,b.pointLights.needsUpdate=L,b.pointLightShadows.needsUpdate=L,b.spotLights.needsUpdate=L,b.spotLightShadows.needsUpdate=L,b.rectAreaLights.needsUpdate=L,b.hemisphereLights.needsUpdate=L}function WS(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return Z},this.getActiveMipmapLevel=function(){return q},this.getRenderTarget=function(){return oe},this.setRenderTargetTextures=function(b,L,X){let H=$.get(b);H.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),$.get(b.texture).__webglTexture=L,$.get(b.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:X,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,L){let X=$.get(b);X.__webglFramebuffer=L,X.__useDefaultFramebuffer=L===void 0},this.setRenderTarget=function(b,L=0,X=0){oe=b,Z=L,q=X;let H=null,G=!1,Ee=!1;if(b){let we=$.get(b);if(we.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(N.FRAMEBUFFER,we.__webglFramebuffer),ie.copy(b.viewport),Le.copy(b.scissor),Ce=b.scissorTest,x.viewport(ie),x.scissor(Le),x.setScissorTest(Ce),Y=-1;return}else if(we.__webglFramebuffer===void 0)J.setupRenderTarget(b);else if(we.__hasExternalTextures)J.rebindTextures(b,$.get(b.texture).__webglTexture,$.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let rt=b.depthTexture;if(we.__boundDepthTexture!==rt){if(rt!==null&&$.has(rt)&&(b.width!==rt.image.width||b.height!==rt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");J.setupDepthRenderbuffer(b)}}let De=b.texture;(De.isData3DTexture||De.isDataArrayTexture||De.isCompressedArrayTexture)&&(Ee=!0);let ke=$.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(ke[L])?H=ke[L][X]:H=ke[L],G=!0):b.samples>0&&J.useMultisampledRTT(b)===!1?H=$.get(b).__webglMultisampledFramebuffer:Array.isArray(ke)?H=ke[X]:H=ke,ie.copy(b.viewport),Le.copy(b.scissor),Ce=b.scissorTest}else ie.copy(Te).multiplyScalar(ne).floor(),Le.copy($e).multiplyScalar(ne).floor(),Ce=dt;if(X!==0&&(H=V),x.bindFramebuffer(N.FRAMEBUFFER,H)&&x.drawBuffers(b,H),x.viewport(ie),x.scissor(Le),x.setScissorTest(Ce),G){let we=$.get(b.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_CUBE_MAP_POSITIVE_X+L,we.__webglTexture,X)}else if(Ee){let we=L;for(let De=0;De<b.textures.length;De++){let ke=$.get(b.textures[De]);N.framebufferTextureLayer(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0+De,ke.__webglTexture,X,we)}}else if(b!==null&&X!==0){let we=$.get(b.texture);N.framebufferTexture2D(N.FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,we.__webglTexture,X)}Y=-1};function Jx(b){let L=$.get(b);return(L.__readFormat!==b.format||L.__readType!==b.type)&&(L.__readFormat=b.format,L.__readType=b.type,L.__formatReadable=A.textureFormatReadable(b.format),L.__typeReadable=A.textureTypeReadable(b.type)),L}this.readRenderTargetPixels=function(b,L,X,H,G,Ee,Ie,we=0){if(!(b&&b.isWebGLRenderTarget)){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let De=$.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Ie!==void 0&&(De=De[Ie]),De){x.bindFramebuffer(N.FRAMEBUFFER,De);try{let ke=b.textures[we],rt=ke.format,lt=ke.type;b.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+we);let ze=Jx(ke);if(ze.__formatReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(ze.__typeReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=b.width-H&&X>=0&&X<=b.height-G&&N.readPixels(L,X,H,G,ve.convert(rt),ve.convert(lt),Ee)}finally{let ke=oe!==null?$.get(oe).__webglFramebuffer:null;x.bindFramebuffer(N.FRAMEBUFFER,ke)}}},this.readRenderTargetPixelsAsync=async function(b,L,X,H,G,Ee,Ie,we=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let De=$.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Ie!==void 0&&(De=De[Ie]),De)if(L>=0&&L<=b.width-H&&X>=0&&X<=b.height-G){x.bindFramebuffer(N.FRAMEBUFFER,De);let ke=b.textures[we],rt=ke.format,lt=ke.type;b.textures.length>1&&N.readBuffer(N.COLOR_ATTACHMENT0+we);let ze=Jx(ke);if(ze.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(ze.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let _t=N.createBuffer();N.bindBuffer(N.PIXEL_PACK_BUFFER,_t),N.bufferData(N.PIXEL_PACK_BUFFER,Ee.byteLength,N.STREAM_READ),N.readPixels(L,X,H,G,ve.convert(rt),ve.convert(lt),0),N.bindBuffer(N.PIXEL_PACK_BUFFER,null);let Bt=oe!==null?$.get(oe).__webglFramebuffer:null;x.bindFramebuffer(N.FRAMEBUFFER,Bt);let It=N.fenceSync(N.SYNC_GPU_COMMANDS_COMPLETE,0);return N.flush(),await yb(N,It,4),N.bindBuffer(N.PIXEL_PACK_BUFFER,_t),N.getBufferSubData(N.PIXEL_PACK_BUFFER,0,Ee),N.bindBuffer(N.PIXEL_PACK_BUFFER,null),N.deleteBuffer(_t),N.deleteSync(It),Ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,L=null,X=0){let H=Math.pow(2,-X),G=Math.floor(b.image.width*H),Ee=Math.floor(b.image.height*H),Ie=L!==null?L.x:0,we=L!==null?L.y:0;J.setTexture2D(b,0),N.copyTexSubImage2D(N.TEXTURE_2D,X,0,0,Ie,we,G,Ee),x.unbindTexture()},this.copyTextureToTexture=function(b,L,X=null,H=null,G=0,Ee=0){let Ie,we,De,ke,rt,lt,ze,_t,Bt,It=b.isCompressedTexture?b.mipmaps[Ee]:b.image;if(X!==null)Ie=X.max.x-X.min.x,we=X.max.y-X.min.y,De=X.isBox3?X.max.z-X.min.z:1,ke=X.min.x,rt=X.min.y,lt=X.isBox3?X.min.z:0;else{let kt=Math.pow(2,-G);Ie=Math.floor(It.width*kt),we=Math.floor(It.height*kt),b.isDataArrayTexture?De=It.depth:b.isData3DTexture?De=Math.floor(It.depth*kt):De=1,ke=0,rt=0,lt=0}H!==null?(ze=H.x,_t=H.y,Bt=H.z):(ze=0,_t=0,Bt=0);let Tt=ve.convert(L.format),jt=ve.convert(L.type),Re;L.isData3DTexture?(J.setTexture3D(L,0),Re=N.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(J.setTexture2DArray(L,0),Re=N.TEXTURE_2D_ARRAY):(J.setTexture2D(L,0),Re=N.TEXTURE_2D),x.activeTexture(N.TEXTURE0),x.pixelStorei(N.UNPACK_FLIP_Y_WEBGL,L.flipY),x.pixelStorei(N.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),x.pixelStorei(N.UNPACK_ALIGNMENT,L.unpackAlignment);let an=x.getParameter(N.UNPACK_ROW_LENGTH),ft=x.getParameter(N.UNPACK_IMAGE_HEIGHT),Cn=x.getParameter(N.UNPACK_SKIP_PIXELS),jn=x.getParameter(N.UNPACK_SKIP_ROWS),bi=x.getParameter(N.UNPACK_SKIP_IMAGES);x.pixelStorei(N.UNPACK_ROW_LENGTH,It.width),x.pixelStorei(N.UNPACK_IMAGE_HEIGHT,It.height),x.pixelStorei(N.UNPACK_SKIP_PIXELS,ke),x.pixelStorei(N.UNPACK_SKIP_ROWS,rt),x.pixelStorei(N.UNPACK_SKIP_IMAGES,lt);let Hr=b.isDataArrayTexture||b.isData3DTexture,Mt=L.isDataArrayTexture||L.isData3DTexture;if(b.isDepthTexture){let kt=$.get(b),Si=$.get(L),Ct=$.get(kt.__renderTarget),Mi=$.get(Si.__renderTarget);x.bindFramebuffer(N.READ_FRAMEBUFFER,Ct.__webglFramebuffer),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,Mi.__webglFramebuffer);for(let Gr=0;Gr<De;Gr++)Hr&&(N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,$.get(b).__webglTexture,G,lt+Gr),N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,$.get(L).__webglTexture,Ee,Bt+Gr)),N.blitFramebuffer(ke,rt,Ie,we,ze,_t,Ie,we,N.DEPTH_BUFFER_BIT,N.NEAREST);x.bindFramebuffer(N.READ_FRAMEBUFFER,null),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else if(G!==0||b.isRenderTargetTexture||$.has(b)){let kt=$.get(b),Si=$.get(L);x.bindFramebuffer(N.READ_FRAMEBUFFER,z),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,B);for(let Ct=0;Ct<De;Ct++)Hr?N.framebufferTextureLayer(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,kt.__webglTexture,G,lt+Ct):N.framebufferTexture2D(N.READ_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,kt.__webglTexture,G),Mt?N.framebufferTextureLayer(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,Si.__webglTexture,Ee,Bt+Ct):N.framebufferTexture2D(N.DRAW_FRAMEBUFFER,N.COLOR_ATTACHMENT0,N.TEXTURE_2D,Si.__webglTexture,Ee),G!==0?N.blitFramebuffer(ke,rt,Ie,we,ze,_t,Ie,we,N.COLOR_BUFFER_BIT,N.NEAREST):Mt?N.copyTexSubImage3D(Re,Ee,ze,_t,Bt+Ct,ke,rt,Ie,we):N.copyTexSubImage2D(Re,Ee,ze,_t,ke,rt,Ie,we);x.bindFramebuffer(N.READ_FRAMEBUFFER,null),x.bindFramebuffer(N.DRAW_FRAMEBUFFER,null)}else Mt?b.isDataTexture||b.isData3DTexture?N.texSubImage3D(Re,Ee,ze,_t,Bt,Ie,we,De,Tt,jt,It.data):L.isCompressedArrayTexture?N.compressedTexSubImage3D(Re,Ee,ze,_t,Bt,Ie,we,De,Tt,It.data):N.texSubImage3D(Re,Ee,ze,_t,Bt,Ie,we,De,Tt,jt,It):b.isDataTexture?N.texSubImage2D(N.TEXTURE_2D,Ee,ze,_t,Ie,we,Tt,jt,It.data):b.isCompressedTexture?N.compressedTexSubImage2D(N.TEXTURE_2D,Ee,ze,_t,It.width,It.height,Tt,It.data):N.texSubImage2D(N.TEXTURE_2D,Ee,ze,_t,Ie,we,Tt,jt,It);x.pixelStorei(N.UNPACK_ROW_LENGTH,an),x.pixelStorei(N.UNPACK_IMAGE_HEIGHT,ft),x.pixelStorei(N.UNPACK_SKIP_PIXELS,Cn),x.pixelStorei(N.UNPACK_SKIP_ROWS,jn),x.pixelStorei(N.UNPACK_SKIP_IMAGES,bi),Ee===0&&L.generateMipmaps&&N.generateMipmap(Re),x.unbindTexture()},this.initRenderTarget=function(b){$.get(b).__webglFramebuffer===void 0&&J.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?J.setTextureCube(b,0):b.isData3DTexture?J.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?J.setTexture2DArray(b,0):J.setTexture2D(b,0),x.unbindTexture()},this.resetState=function(){Z=0,q=0,oe=null,x.reset(),Ae.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return $n}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ut._getDrawingBufferColorSpace(e),t.unpackColorSpace=ut._getUnpackColorSpace()}};var Dx={threadId:null,mode:"empty"};function rS(n,e){if(e.threadId===null)return{state:n.threadId===null?Dx:{threadId:n.threadId,mode:"waiting"},handoff:null};let t=e.working?"rolling":"resting";return n.threadId===e.threadId?{state:{threadId:e.threadId,mode:t},handoff:null}:{state:{threadId:e.threadId,mode:t},handoff:{exitingThreadId:n.threadId,enteringThreadId:e.threadId}}}var pC=new Set(["starting","active"]),mC=new Set(["runtime","working-draft","workflow","background-agent","background-command"]);function sS(n){return n.indicator==="waiting-for-input"?!1:n.status!==void 0?pC.has(n.status):mC.has(n.indicator)}function oS(n,e){return e===null?null:n===null||e>n?e:null}function aS(){let n=0,e=0;return{begin:()=>++n,accept(t){return t<=e?!1:(e=t,!0)}}}var Lh=class{materials=new Map;geometries=new Map;templates=new Map;toonBands=(()=>{let e=new $i(new Uint8Array([150,212,255]),3,1,Ia);return e.minFilter=Dt,e.magFilter=Dt,e.needsUpdate=!0,e})();template(e,t){let i=this.templates.get(e);return i||(i=t(),this.templates.set(e,i)),i}solid(e){let t=`solid:${new Ue(e).getHexString()}`,i=this.materials.get(t);return i||(i=new Yi({color:e,gradientMap:this.toonBands}),this.materials.set(t,i)),i}glow(e){let t=`glow:${new Ue(e).getHexString()}`,i=this.materials.get(t);return i||(i=new yn({color:e}),this.materials.set(t,i)),i}vertexColored(){let e=this.materials.get("vertex");return e||(e=new Yi({vertexColors:!0,gradientMap:this.toonBands}),this.materials.set("vertex",e)),e}shadow(){let e=this.materials.get("shadow");return e||(e=new yn({color:1773616,transparent:!0,opacity:.22,depthWrite:!1}),this.materials.set("shadow",e)),e}geometry(e,t){let i=this.geometries.get(e);return i||(i=t(),this.geometries.set(e,i)),i}box(){return this.geometry("box",()=>new Zi(1,1,1))}sphere(e=1){return this.geometry(`sphere:${e}`,()=>new Er(.5,e))}cylinder(e=10,t=1){return this.geometry(`cylinder:${e}:${t}`,()=>new Xi(.5*t,.5,1,e))}cone(e=10){return this.geometry(`cone:${e}`,()=>new da(.5,1,e))}torus(e=.18,t=Math.PI*2){return this.geometry(`torus:${e}:${t.toFixed(3)}`,()=>new Ar(.5,e,6,18,t))}shadowDisc(){return this.geometry("shadow-disc",()=>{let e=new ha(1,24);return e.rotateX(-Math.PI/2),e})}dispose(){for(let e of this.templates.values())e.traverse(t=>{t instanceof je&&t.userData.ownedGeometry&&t.geometry.dispose()});this.templates.clear(),this.toonBands.dispose();for(let e of this.materials.values())e.dispose();for(let e of this.geometries.values())e.dispose();this.materials.clear(),this.geometries.clear()}},gt=[16732013,16752412,16765503,3919532,961897,3835647,8599788,16740277,49873,15817653,10221311,16704576,15681391,448160];function Oe(n,e){return e[Math.floor(n()*e.length)%e.length]}var cS=[{core:16250346,nub:"round",rainbow:!1},{core:16771055,nub:"round",rainbow:!1},{core:16774072,nub:"spike",rainbow:!1},{core:14677478,nub:"spike",rainbow:!1},{core:14478591,nub:"crystal",rainbow:!1},{core:15458559,nub:"crystal",rainbow:!1},{core:16775398,nub:"crystal",rainbow:!0}],lS=[[15222076,16447212,16238910],[4173386,16447212,15222076],[3833814,16238910,15222076],[15764004,16447212,4173386],[16238910,15222076,3833814]];function gC(n){return cS[Math.min(Math.max(0,n),cS.length-1)]}var uS=8,hS=[16773749,16748459,10221311,12188608,16762623,16766629,10536191,16646070];function xC(){let n=new Er(.5,0).getAttribute("position"),e=new Set,t=[];for(let i=0;i<n.count;i+=1){let r=new I().fromBufferAttribute(n,i).normalize(),s=r.toArray().map(o=>o.toFixed(2)).join(",");e.has(s)||(e.add(s),t.push(r))}return t}var _C=xC(),vC=new I(0,1,0);function zx(n,e,t,i){n.clear();let r=gC(i);n.add(new je(e.sphere(2),e.solid(r.core)));let s=gt.indexOf(t);_C.forEach((o,a)=>{let c=r.rainbow?[gt[a%gt.length],16447212,gt[(a+5)%gt.length]]:lS[(a+Math.max(0,s))%lS.length],l=new ce;l.position.copy(o).multiplyScalar(.47),l.quaternion.setFromUnitVectors(vC,o);let u=(d,h,f,p)=>{let y=new je(e.sphere(2),e.solid(d));y.scale.set(h,f,h),y.position.y=p,l.add(y)};if(u(c[0],.3,.12,.02),u(c[1],.21,.12,.035),r.nub==="round")u(c[2],.11,.1,.06);else{let d=r.nub==="spike"?e.cone(6):e.geometry("octahedron",()=>new qi(.5,0)),h=new je(d,e.solid(c[2]));h.scale.set(.11,r.nub==="spike"?.18:.2,.11),h.position.y=.1,l.add(h)}n.add(l)})}var Uh=class{constructor(e){this.kit=e;this.halo=new je(e.torus(.05),e.glow(16765503)),this.halo.visible=!1,this.group.add(this.halo)}kit;group=new ce;moons=[];halo;count=0;get total(){return this.count}setCount(e,t){this.count=e;let i=Math.min(e,uS);for(;this.moons.length>i;){let r=this.moons.pop();r&&this.group.remove(r.mesh)}for(;this.moons.length<i;){let r=this.moons.length,s=new ce,o=this.kit.glow(hS[r%hS.length]),a=this.kit.geometry("octahedron",()=>new qi(.5,0)),c=new je(a,o);c.scale.set(1,1.6,1);let l=new je(a,o);l.scale.set(1.6,1,1),s.add(c,l),this.group.add(s),this.moons.push({mesh:s,tilt:new mn().setFromEuler(new Dn(.35+r%3*.3,r*.9,(r%2===0?1:-1)*.25)),phase:r/Math.max(1,i)*Math.PI*2,speed:1.1+r%3*.25,arrival:t?0:1})}this.halo.visible=e>uS}update(e,t,i){let r=t*1.45,s=t*.24;for(let o of this.moons){o.arrival=Math.min(1,o.arrival+e*1.4);let a=1-(1-o.arrival)**3;o.phase+=o.speed*e,o.mesh.position.set(Math.cos(o.phase)*r*a,Math.sin(i*2+o.phase)*t*.08,Math.sin(o.phase)*r*a).applyQuaternion(o.tilt),o.mesh.scale.setScalar(s*(.4+a*.6)*(1+Math.sin(i*6+o.phase)*.12)),o.mesh.rotation.y+=e*3}this.halo.scale.setScalar(t*2.9),this.halo.rotation.set(Math.PI/2+.3,0,i*.4)}};var dS={head:"hammer",suit:8176194,hem:5213995,stripe:11853170,legs:8006284},yC=[dS,dS,{head:"hammer",suit:15895986,hem:12736383,stripe:16565978,legs:4020888},{head:"tall",suit:5220317,hem:3108767,stripe:10474738,legs:15764004},{head:"round",suit:16172354,hem:12880925,stripe:16507802,legs:3902282},{head:"block",suit:10976214,hem:7293600,stripe:13876720,legs:15223391},{head:"hammer",suit:15962175,hem:12148255,stripe:16434319,legs:3037864},{head:"tall",suit:4569248,hem:2784620,stripe:10477775,legs:9185882},{head:"round",suit:15228253,hem:11024440,stripe:16231082,legs:4864652}],fS=16111946,bC=15916224,SC=2826803,kh=5;function MC(n){return n.geometry("star",()=>{let e=new Zs;for(let i=0;i<10;i+=1){let r=i/10*Math.PI*2+Math.PI/2,s=i%2===0?.5:.22,o=Math.cos(r)*s,a=Math.sin(r)*s;i===0?e.moveTo(o,a):e.lineTo(o,a)}e.closePath();let t=new Sa(e,{depth:.18,bevelEnabled:!1});return t.center(),t})}function Lt(n,e,t,i,r,s=[0,0,0]){let o=new je(e,t);return o.scale.set(...i),o.position.set(...r),o.rotation.set(...s),n.add(o),o}function Oh(n,e,t,i,r,s){let o=new ce;return o.position.set(...s),Lt(o,n.cylinder(8),e,[i*2,t,i*2],[0,-t/2,0]),Lt(o,n.sphere(1),e,[r*2,r*2,r*2],[0,-t,0]),o}function Fh(n,e,t,i,r){let s=n.solid(SC);Lt(e,n.box(),n.solid(fS),[.02,r,i],[t,0,0]),Lt(e,n.box(),n.solid(bC),[.024,r*.78,i*.78],[t+.004,0,0]);let o=r*.12;for(let a of[-1,1])Lt(e,n.sphere(0),s,[.02,.03,.02],[t+.016,o,a*i*.2]),Lt(e,n.box(),s,[.01,.012,i*.14],[t+.016,o+r*.17,a*i*.2],[a*.3,0,0]);Lt(e,n.cone(4),n.solid(15764004),[.04,.05,.04],[t+.03,-r*.02,0],[0,0,-Math.PI/2]),Lt(e,n.cylinder(10),n.solid(14169135),[.045,.012,.05],[t+.016,-r*.24,0],[0,0,Math.PI/2])}function pS(n,e){let t=In(e),i=Oe(t,yC),r=n.solid(i.suit),s=n.solid(i.legs),o=new ce,a=new ce;o.add(a);let c=Oh(n,s,.27,.03,.055,[0,.32,-.075]),l=Oh(n,s,.27,.03,.055,[0,.32,.075]);a.add(c,l),Lt(a,n.cylinder(16,.52),r,[.34,.34,.34],[0,.47,0]),Lt(a,n.cylinder(16),n.solid(i.hem),[.36,.04,.36],[0,.31,0]);let u=Oh(n,r,.24,.026,.05,[0,.58,-.1]),d=Oh(n,r,.24,.026,.05,[0,.58,.1]);a.add(u,d);let h=new ce;h.position.y=.8,a.add(h);let f=n.solid(i.stripe),p=.18;switch(i.head){case"hammer":{Lt(h,n.cylinder(18),r,[.34,.72,.34],[0,0,0],[Math.PI/2,0,0]);for(let S of[-1,1])Lt(h,n.sphere(2),r,[.34,.34,.34],[0,0,S*.36]),Lt(h,n.cylinder(18),f,[.345,.05,.345],[0,0,S*.27],[Math.PI/2,0,0]),Lt(h,n.cylinder(18),f,[.345,.03,.345],[0,0,S*.2],[Math.PI/2,0,0]);Fh(n,h,.17,.24,.29);break}case"tall":{Lt(h,n.cylinder(16),r,[.3,.46,.3],[0,.1,0]),Lt(h,n.sphere(2),r,[.3,.2,.3],[0,.33,0]),Lt(h,n.cylinder(16),f,[.305,.05,.305],[0,.27,0]),Fh(n,h,.15,.2,.22),p=.42;break}case"round":{Lt(h,n.sphere(2),r,[.4,.38,.4],[0,.02,0]),Lt(h,n.torus(.08),f,[.34,.34,.34],[0,.02,0],[Math.PI/2,0,0]),Fh(n,h,.19,.18,.2),p=.22;break}case"block":{Lt(h,n.box(),r,[.34,.32,.4],[0,.02,0]),Lt(h,n.box(),f,[.35,.05,.41],[0,.14,0]),Fh(n,h,.17,.22,.22),p=.19;break}}Lt(h,n.cone(12),n.solid(fS),[.08,.13,.08],[0,p+.05,0]);let y=Lt(h,n.sphere(2),n.solid(14692651),[.075,.075,.075],[0,p+.14,0]),g=new ce;g.position.y=p+.12;let m=MC(n);for(let S=0;S<kh;S+=1){let E=new ce;E.rotation.y=S/kh*Math.PI*2,Lt(E,m,n.glow(S%2===0?16769357:16774054),[.16,.16,.16],[.34,0,0]),E.visible=!1,g.add(E)}return h.add(g),{root:o,body:a,head:h,leftLeg:c,rightLeg:l,leftArm:u,rightArm:d,cape:null,antennaTip:y,dizzyStars:g}}function mS(n,e){let t=Math.min(1,e.speed/1.2),i=Math.sin(e.stride)*.9*t;n.leftLeg.rotation.z=i,n.rightLeg.rotation.z=-i,n.body.position.y=Math.abs(Math.sin(e.stride))*.04*t,n.body.rotation.z=-.35*t;let r=e.dizziness;n.body.rotation.x=Math.sin(e.time*(1.6+r))*.2*r;let s=e.reach,o=Math.sin(e.time*2.2)*.03;if(e.waiting){let l=Math.sin(e.time*7)*.5,u=Math.sin(e.time*.7)>.55;n.leftArm.rotation.set(0,0,o),n.rightArm.rotation.set(u?-2.6+l:0,0,0),n.body.rotation.y=Rn.lerp(n.body.rotation.y,Math.PI*.8,.08)}else{let l=Rn.lerp(o,s,Math.max(t,.35));n.leftArm.rotation.set(0,0,l+(t>0?Math.sin(e.stride)*.08:0)),n.rightArm.rotation.set(0,0,l-(t>0?Math.sin(e.stride)*.08:0)),n.body.rotation.y=Rn.lerp(n.body.rotation.y,0,.12)}let a=e.idleSeconds>1.5?Math.sin(e.time*.9):0;n.head.rotation.y=a*.6*(1-r);let c=e.time*(2.4+r*2);n.head.rotation.x=Math.sin(c)*.4*r,n.head.rotation.z=t*.15+Math.sin(e.time*3)*.02+Math.cos(c)*.3*r,n.dizzyStars.rotation.y=e.time*(3+r*3),n.dizzyStars.children.forEach((l,u)=>{l.visible=u<e.stars,l.position.y=Math.sin(e.time*5+u*1.7)*.04,l.children[0]?.rotation.set(0,Math.PI/2-n.dizzyStars.rotation.y-l.rotation.y,e.time*4)}),t<.05&&e.idleSeconds>3&&!e.waiting?n.rightLeg.rotation.x=Math.max(0,Math.sin(e.time*9))*.25:n.rightLeg.rotation.x=0,n.antennaTip.position.x=Math.sin(e.time*5+e.stride)*.03*(.4+t),n.cape&&(n.cape.rotation.z=-(.12+t*.42+Math.sin(e.time*11)*.08*t))}function xS(n,e=!1){let t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),r=new Set(Object.keys(n[0].morphAttributes)),s={},o={},a=n[0].morphTargetsRelative,c=new Vt,l=0;for(let u=0;u<n.length;++u){let d=n[u],h=0;if(t!==(d.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in d.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(d.attributes[f]),h++}if(h!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==d.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in d.morphAttributes){if(!r.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(d.morphAttributes[f])}if(e){let f;if(t)f=d.index.count;else if(d.attributes.position!==void 0)f=d.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,u),l+=f}}if(t){let u=0,d=[];for(let h=0;h<n.length;++h){let f=n[h].index;for(let p=0;p<f.count;++p)d.push(f.getX(p)+u);u+=n[h].attributes.position.count}c.setIndex(d)}for(let u in s){let d=gS(s[u]);if(!d)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;c.setAttribute(u,d)}for(let u in o){let d=o[u][0].length;if(d!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[u]=[];for(let h=0;h<d;++h){let f=[];for(let y=0;y<o[u].length;++y)f.push(o[u][y][h]);let p=gS(f);if(!p)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;c.morphAttributes[u].push(p)}}}return c}function gS(n){let e,t,i,r=-1,s=0;for(let l=0;l<n.length;++l){let u=n[l];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=u.normalized),i!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=u.gpuType),r!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=u.count*t}let o=new e(s),a=new tn(o,t,i),c=0;for(let l=0;l<n.length;++l){let u=n[l];if(u.isInterleavedBufferAttribute){let d=c/t;for(let h=0,f=u.count;h<f;h++)for(let p=0;p<t;p++){let y=u.getComponent(h,p);a.setComponent(h+d,p,y)}}else o.set(u.array,c);c+=u.count*t}return r!==void 0&&(a.gpuType=r),a}function R(n,e,t,i,r,s=[0,0,0]){let o=new je(e,t);return o.scale.set(...i),o.position.set(...r),o.rotation.set(...s),n.add(o),o}var wC=[16766901,15841676,13208926,9263675,16769996],bt=Math.PI/2,EC={kind:"thumbtack",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(12),n.solid(Oe(e,gt)),[1,.28,1],[0,.14,0]),R(t,n.cylinder(10),n.solid(Oe(e,gt)),[.55,.3,.55],[0,.42,0]),R(t,n.cone(6),n.solid(14278118),[.12,.9,.12],[0,1,0]),t}},TC={kind:"coin",tier:0,zones:"all",build({kit:n}){let e=new ce;return R(e,n.cylinder(14),n.solid(16103470),[1,.14,1],[0,.07,0]),R(e,n.cylinder(14),n.solid(16766556),[.72,.16,.72],[0,.08,0]),e}},AC={kind:"button",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(14),n.solid(Oe(e,gt)),[1,.2,1],[0,.1,0]);let i=n.solid(2826560);for(let[r,s]of[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])R(t,n.cylinder(6),i,[.12,.05,.12],[r,.21,s]);return t}},RC={kind:"candy",tier:0,zones:["room","candy"],weight:1.6,build({kit:n,random:e}){let t=new ce,i=Oe(e,gt);R(t,n.sphere(1),n.solid(i),[1,.62,.62],[0,.31,0]);let r=n.solid(new Ue(i).lerp(new Ue(16777215),.45));return R(t,n.cone(6),r,[.42,.42,.42],[-.68,.31,0],[0,0,-bt]),R(t,n.cone(6),r,[.42,.42,.42],[.68,.31,0],[0,0,bt]),t}},CC={kind:"die",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(16514047),[1,1,1],[0,.5,0]);let i=n.solid(e()<.3?15087942:1907514);for(let[r,s]of[[0,0],[-.25,-.25],[.25,.25],[-.25,.25],[.25,-.25]])R(t,n.sphere(0),i,[.16,.08,.16],[r,1,s]);for(let[r,s]of[[.3,-.2],[.7,.2]])R(t,n.sphere(0),i,[.08,.16,.16],[.5,r,s]);return t}},PC={kind:"battery",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ce,i=Oe(e,[2829634,15672124,3835647,448160]);return R(t,n.cylinder(10),n.solid(i),[.5,1.3,.5],[0,.25,0],[0,0,bt]),R(t,n.cylinder(10),n.solid(16761600),[.52,.35,.52],[.45,.25,0],[0,0,bt]),R(t,n.cylinder(8),n.solid(14278118),[.18,.12,.18],[.72,.25,0],[0,0,bt]),t}},IC={kind:"eraser",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ce;return R(t,n.box(),n.solid(Oe(e,[16777215,16763101,16774064])),[1,.38,.55],[0,.19,0]),R(t,n.box(),n.solid(Oe(e,[3835647,1149618,8599788])),[.6,.4,.57],[.12,.2,0]),t}},NC={kind:"mahjong",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ce;return R(t,n.box(),n.solid(2792847),[.72,.16,1],[0,.08,0]),R(t,n.box(),n.solid(16643811),[.72,.22,1],[0,.27,0]),R(t,n.box(),n.solid(Oe(e,[15087942,1914199,2792847])),[.22,.03,.5],[0,.39,0]),t}},DC={kind:"sushi",tier:0,zones:["room","beach"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(16776693),[1,.42,.55],[0,.21,0]);let i=Oe(e,[16747610,16735603,16765286]);return R(t,n.box(),n.solid(i),[1.12,.18,.62],[0,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[-.2,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[.2,.5,0]),t}},zC={kind:"strawberry",tier:0,zones:["room","candy","garden"],build({kit:n}){let e=new ce;return R(e,n.cone(8),n.solid(15741007),[.8,1,.8],[0,.5,0],[Math.PI,0,0]),R(e,n.cone(5),n.solid(3129201),[.7,.2,.7],[0,1.05,0],[Math.PI,0,0]),R(e,n.cylinder(5),n.solid(3129201),[.08,.25,.08],[0,1.2,0]),e}},LC={kind:"seashell",tier:0,zones:["beach"],weight:2,build({kit:n,random:e}){let t=new ce,i=Oe(e,[16762024,16770521,16230584,16773584]);R(t,n.sphere(1),n.solid(i),[1,.4,.85],[0,.2,0]);let r=n.solid(new Ue(i).multiplyScalar(.85));for(let s=-2;s<=2;s+=1)R(t,n.box(),r,[.06,.1,.8],[s*.17,.36,0],[0,s*.18,0]);return t}},UC={kind:"starfish",tier:0,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[16747586,16735631,16761182]));for(let r=0;r<5;r+=1){let s=r/5*Math.PI*2;R(t,n.cone(5),i,[.34,.9,.2],[Math.cos(s)*.42,.1,Math.sin(s)*.42],[bt,0,s-bt])}return R(t,n.sphere(0),i,[.45,.22,.45],[0,.11,0]),t}},OC={kind:"pencil",tier:1,zones:["room","town"],build({kit:n,random:e}){let t=new ce;return t.rotation.y=e()*Math.PI,R(t,n.cylinder(6),n.solid(Oe(e,[16765503,3835647,15681391,448160])),[.3,2,.3],[0,.15,0],[0,0,bt]),R(t,n.cone(6),n.solid(15848352),[.3,.4,.3],[1.2,.15,0],[0,0,-bt]),R(t,n.cone(6),n.solid(2829634),[.1,.14,.1],[1.4,.15,0],[0,0,-bt]),R(t,n.cylinder(8),n.solid(16748459),[.3,.26,.3],[-1.1,.15,0],[0,0,bt]),t}},FC={kind:"rubber-duck",tier:1,zones:["room","beach"],build({kit:n}){let e=new ce,t=n.solid(16766474);return R(e,n.sphere(1),t,[1.1,.75,.85],[0,.38,0]),R(e,n.sphere(1),t,[.6,.6,.6],[.32,.9,0]),R(e,n.cone(6),n.solid(16743168),[.24,.34,.24],[.72,.88,0],[0,0,-bt]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,.2]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,-.2]),e}},kC={kind:"fruit",tier:1,zones:["room","garden","candy"],build({kit:n,random:e}){let t=new ce;return R(t,n.sphere(1),n.solid(Oe(e,[15087942,16752412,10212166,16765503])),[1,.95,1],[0,.48,0]),R(t,n.cylinder(5),n.solid(8015405),[.07,.25,.07],[0,1,0]),R(t,n.sphere(0),n.solid(3129201),[.28,.06,.14],[.14,1.04,0],[0,0,.4]),t}},BC={kind:"mug",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,gt));return R(t,n.cylinder(14),i,[.8,.9,.8],[0,.45,0]),R(t,n.cylinder(14),n.solid(7289631),[.68,.02,.68],[0,.88,0]),R(t,n.torus(.2),i,[.45,.45,.45],[.45,.45,0]),t}},HC={kind:"cake",tier:1,zones:["room","candy"],build({kit:n}){let e=new ce,t=n.geometry("wedge",()=>new Xi(.5,.5,1,6,1,!1,0,Math.PI/3));return R(e,t,n.solid(16769187),[2,.5,2],[0,.25,0]),R(e,t,n.solid(16775408),[2.02,.12,2.02],[0,.56,0]),R(e,n.sphere(0),n.solid(15741007),[.22,.22,.22],[.35,.7,.35]),e}},GC={kind:"alarm-clock",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[15672124,3835647,448160]));return R(t,n.cylinder(16),i,[1,.4,1],[0,.6,0],[bt,0,0]),R(t,n.cylinder(16),n.solid(16777215),[.82,.42,.82],[0,.6,.02],[bt,0,0]),R(t,n.box(),n.solid(1907514),[.05,.3,.02],[0,.7,.24]),R(t,n.box(),n.solid(1907514),[.22,.05,.02],[.08,.6,.24]),R(t,n.sphere(1),i,[.36,.36,.36],[-.32,1.1,0]),R(t,n.sphere(1),i,[.36,.36,.36],[.32,1.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[-.3,.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[.3,.1,0]),t}},VC={kind:"gift",tier:1,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(Oe(e,gt)),[1,.8,1],[0,.4,0]);let i=n.solid(Oe(e,[16777215,16765503,15681391]));return R(t,n.box(),i,[1.02,.82,.16],[0,.4,0]),R(t,n.box(),i,[.16,.82,1.02],[0,.4,0]),R(t,n.torus(.25),i,[.36,.36,.36],[-.14,.92,0],[0,0,.5]),R(t,n.torus(.25),i,[.36,.36,.36],[.14,.92,0],[0,0,-.5]),t}},$C={kind:"lollipop",tier:1,zones:["candy"],weight:2,build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(6),n.solid(16777215),[.1,1.4,.1],[0,.7,0]),R(t,n.cylinder(16),n.solid(Oe(e,gt)),[1,.2,1],[0,1.6,0],[bt,0,0]),R(t,n.torus(.14),n.solid(16777215),[.6,.6,.6],[0,1.6,.1]),t}},WC={kind:"mushroom",tier:1,zones:["forest","garden"],weight:1.6,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(8),n.solid(16773590),[.4,.6,.4],[0,.3,0]);let i=Oe(e,[15087942,16752412,8599788]);R(t,n.sphere(1),n.solid(i),[1.1,.6,1.1],[0,.7,0]);let r=n.solid(16777215);for(let[s,o]of[[.25,.1],[-.2,.25],[-.1,-.3],[.3,-.25]])R(t,n.sphere(0),r,[.14,.1,.14],[s,.92,o]);return t}},ZC={kind:"book",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ce;return t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(Oe(e,gt)),[1,.26,1.4],[0,.13,0]),R(t,n.box(),n.solid(16776170),[.94,.2,1.36],[.05,.13,0]),R(t,n.box(),n.solid(Oe(e,gt)),[.9,.24,1.3],[.1,.37,.05],[0,.3,0]),R(t,n.box(),n.solid(16776170),[.84,.18,1.26],[.15,.37,.05],[0,.3,0]),t}},XC={kind:"teapot",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[16777215,10221311,16763101,12116178]));return R(t,n.sphere(1),i,[1.1,.85,1.1],[0,.45,0]),R(t,n.cylinder(6,.5),i,[.24,.7,.24],[.6,.6,0],[0,0,-.7]),R(t,n.torus(.2),i,[.5,.5,.5],[-.58,.5,0]),R(t,n.sphere(1),i,[.5,.2,.5],[0,.88,0]),R(t,n.sphere(0),n.solid(16765503),[.14,.14,.14],[0,1,0]),t}},qC={kind:"toy-robot",tier:2,zones:["room","town"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[12568533,3835647,15681391])),r=n.solid(2829634);return R(t,n.box(),r,[.22,.45,.22],[0,.22,-.18]),R(t,n.box(),r,[.22,.45,.22],[0,.22,.18]),R(t,n.box(),i,[.6,.6,.7],[0,.75,0]),R(t,n.box(),i,[.46,.4,.5],[0,1.28,0]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,-.12]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,.12]),R(t,n.cylinder(4),r,[.04,.3,.04],[0,1.62,0]),R(t,n.sphere(0),n.glow(16711790),[.12,.12,.12],[0,1.78,0]),R(t,n.box(),i,[.16,.5,.16],[0,.72,-.46]),R(t,n.box(),i,[.16,.5,.16],[0,.72,.46]),t}},YC={kind:"potted-flower",tier:2,zones:["room","garden","town"],build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(8,1.3),n.solid(13789500),[.7,.6,.7],[0,.3,0]),R(t,n.cylinder(8),n.solid(5978665),[.84,.04,.84],[0,.6,0]),R(t,n.cylinder(5),n.solid(3129201),[.08,.8,.08],[0,1,0]);let i=n.solid(Oe(e,gt));for(let r=0;r<6;r+=1){let s=r/6*Math.PI*2;R(t,n.sphere(0),i,[.3,.12,.3],[Math.cos(s)*.24,1.42,Math.sin(s)*.24])}return R(t,n.sphere(0),n.solid(16765503),[.22,.14,.22],[0,1.44,0]),t}},JC={kind:"traffic-cone",tier:2,zones:["town"],weight:1.4,build({kit:n}){let e=new ce;return R(e,n.box(),n.solid(16739072),[.9,.1,.9],[0,.05,0]),R(e,n.cone(10),n.solid(16743168),[.7,1.3,.7],[0,.72,0]),R(e,n.cylinder(10,.75),n.solid(16777215),[.48,.22,.48],[0,.72,0]),e}},jC={kind:"beach-ball",tier:2,zones:["beach"],weight:1.4,motion:"bob",build({kit:n}){let e=new ce;return R(e,n.sphere(2),n.solid(16777215),[1,1,1],[0,.5,0]),R(e,n.torus(.16),n.solid(15672124),[.96,.96,.96],[0,.5,0]),R(e,n.torus(.16),n.solid(3835647),[.96,.96,.96],[0,.5,0],[0,bt,0]),R(e,n.torus(.16),n.solid(16765503),[.96,.96,.96],[0,.5,0],[bt,0,0]),e}},KC={kind:"cat",tier:2,zones:["room","garden","town"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[16752453,6052974,16645629,2829110,15253629]));R(t,n.sphere(1),i,[1.3,.72,.7],[0,.55,0]),R(t,n.sphere(1),i,[.66,.6,.62],[.7,.85,0]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,-.18]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,.18]),R(t,n.cylinder(5),i,[.1,.8,.1],[-.75,.9,0],[0,0,.7]);for(let[r,s]of[[.4,.2],[.4,-.2],[-.4,.2],[-.4,-.2]])R(t,n.cylinder(5),i,[.14,.4,.14],[r,.2,s]);return R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,-.14]),R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,.14]),t}},QC={kind:"penguin",tier:2,zones:["snow"],weight:2,motion:"walk",build({kit:n}){let e=new ce;return R(e,n.sphere(1),n.solid(2236987),[.8,1.2,.75],[0,.65,0]),R(e,n.sphere(1),n.solid(16777215),[.5,.9,.6],[.2,.6,0]),R(e,n.cone(5),n.solid(16752412),[.14,.26,.14],[.46,1,0],[0,0,-bt]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,-.16]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,.16]),e}},eP={kind:"crab",tier:1,zones:["beach"],motion:"walk",build({kit:n}){let e=new ce,t=n.solid(16731469);R(e,n.sphere(1),t,[1,.45,.8],[0,.35,0]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,-.45]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,.45]);for(let i=0;i<3;i+=1)R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,-.45],[.7,0,0]),R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,.45],[-.7,0,0]);return R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,-.12]),R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,.12]),e}},tP={kind:"sunflower",tier:3,zones:["garden"],weight:1.4,build({kit:n}){let e=new ce;R(e,n.cylinder(6),n.solid(3841315),[.12,2.4,.12],[0,1.2,0]),R(e,n.sphere(0),n.solid(3841315),[.5,.08,.24],[.22,1.1,0],[0,0,.4]),R(e,n.cylinder(12),n.solid(7028253),[.6,.12,.6],[.05,2.5,0],[0,0,bt]);let t=n.solid(16764928);for(let i=0;i<10;i+=1){let r=i/10*Math.PI*2;R(e,n.sphere(0),t,[.08,.32,.18],[.06,2.5+Math.sin(r)*.45,Math.cos(r)*.45],[r,0,0])}return e}},nP={kind:"dog",tier:3,zones:["garden","town","beach"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[13011801,16645629,4013373,16045453])),r=n.solid(5913899);R(t,n.box(),i,[1.3,.6,.62],[0,.7,0]),R(t,n.box(),i,[.62,.58,.56],[.78,1.1,0]),R(t,n.box(),i,[.36,.28,.4],[1.2,.98,0]),R(t,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.4,1.05,0]),R(t,n.box(),r,[.12,.44,.22],[.7,1.12,-.36]),R(t,n.box(),r,[.12,.44,.22],[.7,1.12,.36]),R(t,n.cylinder(5),i,[.1,.5,.1],[-.75,1.05,0],[0,0,.8]);for(let[s,o]of[[.45,.2],[.45,-.2],[-.45,.2],[-.45,-.2]])R(t,n.cylinder(5),i,[.16,.5,.16],[s,.25,o]);return t}},iP={kind:"person",tier:3,zones:["town","garden","beach","snow","room"],weight:1.6,motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,gt)),r=n.solid(Oe(e,[1914199,2829634,7166330,5800279])),s=n.solid(Oe(e,wC));return R(t,n.cylinder(6),r,[.2,.9,.2],[0,.45,-.14]),R(t,n.cylinder(6),r,[.2,.9,.2],[0,.45,.14]),R(t,n.cylinder(8,.85),i,[.62,.95,.5],[0,1.35,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,-.4],[.25,0,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,.4],[-.25,0,0]),R(t,n.sphere(1),s,[.5,.56,.5],[0,2.1,0]),R(t,n.sphere(1),n.solid(Oe(e,[2826520,7028253,15909198,11680328,1907514])),[.54,.34,.54],[-.04,2.3,0]),t}},rP={kind:"mailbox",tier:3,zones:["town","garden"],build({kit:n}){let e=new ce,t=n.solid(15087942);return R(e,n.box(),n.solid(8015405),[.2,1.2,.2],[0,.6,0]),R(e,n.box(),t,[.9,.45,.5],[0,1.4,0]),R(e,n.cylinder(10),t,[.5,.9,.5],[0,1.62,0],[0,0,bt]),R(e,n.box(),n.solid(16765503),[.06,.4,.06],[.3,1.9,.26]),e}},sP={kind:"bench",tier:3,zones:["town","garden","beach"],build({kit:n}){let e=new ce,t=n.solid(13204285),i=n.solid(2976335);R(e,n.box(),t,[2,.1,.7],[0,.6,0]),R(e,n.box(),t,[2,.5,.08],[0,1,-.32],[-.15,0,0]);for(let r of[-.85,.85])R(e,n.box(),i,[.1,.6,.6],[r,.3,0]),R(e,n.box(),i,[.1,.6,.08],[r,.95,-.34]);return e}},oP={kind:"bicycle",tier:3,zones:["town","garden"],build({kit:n,random:e}){let t=new ce,i=n.solid(1907514),r=n.solid(Oe(e,gt));return R(t,n.torus(.1),i,[1.1,1.1,1.1],[-.7,.55,0]),R(t,n.torus(.1),i,[1.1,1.1,1.1],[.7,.55,0]),R(t,n.cylinder(5),r,[.08,1.3,.08],[0,.85,0],[0,0,bt]),R(t,n.cylinder(5),r,[.08,.9,.08],[-.35,.72,0],[0,0,.9]),R(t,n.cylinder(5),r,[.08,.9,.08],[.45,.8,0],[0,0,-.35]),R(t,n.box(),n.solid(2829634),[.36,.08,.2],[-.35,1.18,0]),R(t,n.cylinder(5),n.solid(12568533),[.06,.6,.06],[.58,1.25,0],[bt,0,0]),t}},aP={kind:"umbrella",tier:3,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(6),n.solid(16777215),[.08,2.2,.08],[0,1.1,0],[.12,0,0]),R(t,n.cone(8),n.solid(Oe(e,gt)),[2.4,.6,2.4],[0,2.2,.12]),R(t,n.cone(8),n.solid(16777215),[1.2,.34,1.2],[0,2.38,.12]),t}},cP={kind:"snowman",tier:3,zones:["snow"],weight:1.8,build({kit:n,random:e}){let t=new ce,i=n.solid(16645631);return R(t,n.sphere(1),i,[1.1,1,1.1],[0,.5,0]),R(t,n.sphere(1),i,[.8,.75,.8],[0,1.28,0]),R(t,n.sphere(1),i,[.58,.55,.58],[0,1.88,0]),R(t,n.cone(6),n.solid(16743168),[.1,.36,.1],[.36,1.9,0],[0,0,-bt]),R(t,n.torus(.2),n.solid(Oe(e,[15087942,3835647,448160])),[.62,.62,.62],[0,1.6,0],[bt,0,0]),R(t,n.cylinder(10),n.solid(1907514),[.5,.06,.5],[0,2.12,0]),R(t,n.cylinder(10),n.solid(1907514),[.34,.36,.34],[0,2.3,0]),t}},lP={kind:"vending-machine",tier:3,zones:["town"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(Oe(e,[15087942,3835647,16645629])),[.9,1.9,.8],[0,.95,0]),R(t,n.box(),n.glow(13299960),[.05,.9,.6],[.46,1.25,0]);for(let i=0;i<3;i+=1)for(let r=0;r<3;r+=1)R(t,n.cylinder(6),n.solid(Oe(e,gt)),[.1,.22,.1],[.44,1+i*.26,-.18+r*.18]);return R(t,n.box(),n.solid(2829634),[.05,.14,.5],[.46,.35,0]),t}},uP={kind:"car",tier:4,zones:["town","beach"],weight:1.6,motion:"drive",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,gt));R(t,n.box(),i,[2.3,.62,1.1],[0,.55,0]),R(t,n.box(),n.solid(12443902),[1.2,.5,1],[-.15,1.1,0]),R(t,n.box(),i,[1.26,.08,1.04],[-.15,1.38,0]);let r=n.solid(1907514);for(let[s,o]of[[.75,.55],[.75,-.55],[-.75,.55],[-.75,-.55]])R(t,n.cylinder(10),r,[.52,.22,.52],[s,.26,o],[bt,0,0]);return R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,-.35]),R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,.35]),t}},hP={kind:"cow",tier:4,zones:["garden","forest"],motion:"walk",build({kit:n}){let e=new ce,t=n.solid(16645629),i=n.solid(1907514);R(e,n.box(),t,[1.8,.9,.9],[0,1.1,0]),R(e,n.sphere(0),i,[.6,.5,.1],[.2,1.2,.46]),R(e,n.sphere(0),i,[.5,.4,.1],[-.4,1.05,-.46]),R(e,n.box(),t,[.6,.55,.6],[1.1,1.4,0]),R(e,n.box(),n.solid(16757954),[.24,.3,.5],[1.44,1.3,0]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,-.22]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,.22]);for(let[r,s]of[[.65,.3],[.65,-.3],[-.65,.3],[-.65,-.3]])R(e,n.cylinder(5),t,[.2,.7,.2],[r,.35,s]);return R(e,n.sphere(0),n.solid(16757954),[.34,.2,.3],[-.3,.62,0]),e}},dP={kind:"tree",tier:4,zones:["garden","town","forest"],weight:2,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(6),n.solid(9067067),[.4,1.6,.4],[0,.8,0]);let i=[5420936,7653021,4231532,9819570];if(R(t,n.sphere(0),n.solid(Oe(e,i)),[1.8,1.6,1.8],[0,2.2,0]),R(t,n.sphere(0),n.solid(Oe(e,i)),[1.2,1.1,1.2],[.5,2.8,.3]),R(t,n.sphere(0),n.solid(Oe(e,i)),[1.1,1,1.1],[-.5,2.6,-.3]),e()<.4)for(let r=0;r<4;r+=1)R(t,n.sphere(0),n.solid(15087942),[.2,.2,.2],[Math.cos(r*1.7)*.8,2.1+r*.15,Math.sin(r*1.7)*.8]);return t}},fP={kind:"pine-tree",tier:4,zones:["forest","snow"],weight:2.2,build({kit:n,random:e}){let t=new ce,i=e()<.5;R(t,n.cylinder(6),n.solid(7029286),[.35,.9,.35],[0,.45,0]);let r=n.solid(Oe(e,[2976335,1786674,4231532]));for(let s=0;s<3;s+=1)R(t,n.cone(7),r,[1.8-s*.45,1.3,1.8-s*.45],[0,1.4+s*.75,0]);return i&&R(t,n.cone(7),n.solid(16777215),[.5,.45,.5],[0,3.1,0]),t}},pP={kind:"palm-tree",tier:4,zones:["beach"],weight:2,build({kit:n}){let e=new ce,t=n.solid(11895642);for(let r=0;r<6;r+=1)R(e,n.cylinder(6,.85),t,[.34,.6,.34],[r*r*.02,.3+r*.55,0],[0,0,-r*.05]);let i=n.solid(3129201);for(let r=0;r<6;r+=1){let s=r/6*Math.PI*2;R(e,n.sphere(0),i,[1.5,.08,.4],[.6+Math.cos(s)*.7,3.4,Math.sin(s)*.7],[0,-s,-.3])}return R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.55,3.2,.15]),R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.7,3.2,-.12]),e}},mP={kind:"house",tier:5,zones:["town","garden","snow"],weight:2,build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(Oe(e,[16773590,16766688,13299960,16645340,14871785])),[2.2,1.5,1.9],[0,.75,0]),R(t,n.cone(4),n.solid(Oe(e,[15087942,3835647,2792847,7166330])),[2.3,1.1,2],[0,2.05,0],[0,Math.PI/4,0]),R(t,n.box(),n.solid(8015405),[.05,.8,.5],[1.11,.4,.3]);let i=n.glow(16774064);return R(t,n.box(),i,[.05,.42,.42],[1.11,.95,-.45]),R(t,n.box(),i,[.42,.42,.05],[-.4,.95,.96]),R(t,n.box(),i,[.42,.42,.05],[.5,.95,.96]),R(t,n.box(),n.solid(10309341),[.3,.7,.3],[-.55,2.35,-.35]),t}},gP={kind:"bus",tier:5,zones:["town"],motion:"drive",build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[16765503,448160,15681391]));R(t,n.box(),i,[4.2,1.5,1.4],[0,1.05,0]),R(t,n.box(),n.solid(12443902),[3.8,.5,1.42],[-.1,1.35,0]),R(t,n.box(),n.solid(12443902),[.05,.7,1.2],[2.11,1.25,0]);let r=n.solid(1907514);for(let[s,o]of[[1.3,.7],[1.3,-.7],[-1.3,.7],[-1.3,-.7]])R(t,n.cylinder(10),r,[.62,.24,.62],[s,.3,o],[bt,0,0]);return t}},xP={kind:"windmill",tier:5,zones:["garden","forest"],build({kit:n}){let e=new ce;R(e,n.cylinder(8,.65),n.solid(16645340),[1.3,3,1.3],[0,1.5,0]),R(e,n.cone(8),n.solid(15087942),[1.1,.8,1.1],[0,3.4,0]);let t=new ce;t.position.set(.56,2.7,0),t.userData.spin={axis:"x",speed:1.4};let i=n.solid(16775408);for(let r=0;r<4;r+=1){let s=new ce;s.rotation.x=r/4*Math.PI*2,R(s,n.box(),i,[.06,1.7,.4],[0,.95,0]),t.add(s)}return e.add(t),e}},_P={kind:"lighthouse",tier:5,zones:["beach"],build({kit:n}){let e=new ce;for(let t=0;t<5;t+=1)R(e,n.cylinder(10,.94),n.solid(t%2===0?16777215:15087942),[1.2-t*.12,.8,1.2-t*.12],[0,.4+t*.8,0]);return R(e,n.cylinder(10),n.glow(16774064),[.62,.5,.62],[0,4.25,0]),R(e,n.cone(10),n.solid(1914199),[.9,.6,.9],[0,4.8,0]),e}},vP={kind:"pagoda",tier:5,zones:["garden","town","forest"],build({kit:n,random:e}){let t=new ce,i=n.solid(16773590),r=n.solid(Oe(e,[14034984,2792847,4014171]));for(let s=0;s<3;s+=1){let o=1.8-s*.4;R(t,n.box(),i,[o,.9,o],[0,.45+s*1.2,0]),R(t,n.cone(4),r,[o*1.9,.45,o*1.9],[0,1.08+s*1.2,0],[0,Math.PI/4,0])}return R(t,n.cylinder(5),n.solid(16765503),[.08,.8,.08],[0,3.9,0]),t}},yP={kind:"hot-air-balloon",tier:5,zones:"all",weight:.6,motion:"fly",build({kit:n,random:e}){let t=new ce;R(t,n.sphere(1),n.solid(Oe(e,gt)),[2,2.3,2],[0,2.6,0]),R(t,n.torus(.06),n.solid(Oe(e,gt)),[2.04,2.04,2.04],[0,2.6,0],[bt,0,0]),R(t,n.torus(.06),n.solid(16777215),[1.7,1.7,1.7],[0,3.2,0],[bt,0,0]),R(t,n.box(),n.solid(10506797),[.6,.45,.6],[0,.22,0]);for(let[i,r]of[[.26,.26],[-.26,.26],[.26,-.26],[-.26,-.26]])R(t,n.cylinder(3),n.solid(5913899),[.03,1.2,.03],[i*1.4,.95,r*1.4]);return t}},bP={kind:"whale",tier:5,zones:["beach"],weight:.8,motion:"bob",build({kit:n}){let e=new ce;return R(e,n.sphere(1),n.solid(4756975),[3,1.3,1.5],[0,.65,0]),R(e,n.sphere(1),n.solid(13299960),[2.4,.6,1.2],[.2,.36,0]),R(e,n.sphere(0),n.solid(4756975),[.4,.1,1.2],[-1.7,.9,0],[0,0,.5]),R(e,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.1,.8,.6]),R(e,n.cylinder(6,1.6),n.solid(9494767),[.18,.6,.18],[.5,1.5,0]),e}},SP={kind:"building",tier:6,zones:["town"],weight:2.4,build({kit:n,random:e}){let t=new ce,i=5+Math.floor(e()*4),r=i*.62;R(t,n.box(),n.solid(Oe(e,[11066076,15858414,16763604,13481179,16770484])),[1.8,r,1.8],[0,r/2,0]);let s=n.glow(Oe(e,[16774064,13299960]));for(let o=0;o<i;o+=1)R(t,n.box(),s,[1.82,.22,1.5],[0,.4+o*.62,0]),R(t,n.box(),s,[1.5,.22,1.82],[0,.4+o*.62,0]);return R(t,n.cylinder(4),n.solid(15087942),[.06,1,.06],[.4,r+.5,.4]),t}},MP={kind:"ferris-wheel",tier:6,zones:["town","beach","candy"],build({kit:n}){let e=new ce,t=n.solid(16777215);R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,.3]),R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,-.3]);let i=new ce;i.position.set(0,2.9,0),i.userData.spin={axis:"z",speed:.35},R(i,n.torus(.04),n.solid(16711790),[5,5,5],[0,0,0]);for(let r=0;r<8;r+=1){let s=r/8*Math.PI*2;R(i,n.box(),t,[.06,2.5,.06],[Math.cos(s)*1.25,Math.sin(s)*1.25,0],[0,0,s-bt]),R(i,n.box(),n.solid(gt[r%gt.length]),[.4,.4,.5],[Math.cos(s)*2.5,Math.sin(s)*2.5-.25,0])}return e.add(i),e}},wP={kind:"rocket",tier:6,zones:"all",weight:.5,build({kit:n}){let e=new ce;R(e,n.cylinder(10),n.solid(16645629),[1,3,1],[0,2,0]),R(e,n.cone(10),n.solid(15087942),[1,1.2,1],[0,4.1,0]),R(e,n.cylinder(10),n.glow(10221311),[.4,.1,.4],[0,3,.48],[bt,0,0]);for(let t=0;t<3;t+=1){let i=t/3*Math.PI*2;R(e,n.box(),n.solid(15087942),[.08,1,.7],[Math.cos(i)*.6,.8,Math.sin(i)*.6],[0,-i,0])}return R(e,n.cone(8),n.glow(16758531),[.7,.6,.7],[0,.3,0],[Math.PI,0,0]),e}},EP={kind:"cupcake",tier:3,zones:["candy","room"],weight:1.6,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(10,1.25),n.solid(Oe(e,[16757702,10221311,16646070])),[.9,.7,.9],[0,.35,0]);let i=n.solid(Oe(e,[16773623,16763101,13303743]));return R(t,n.sphere(1),i,[1.2,.5,1.2],[0,.85,0]),R(t,n.sphere(1),i,[.8,.4,.8],[0,1.15,0]),R(t,n.sphere(0),n.solid(15087942),[.26,.26,.26],[0,1.42,0]),t}},TP={kind:"candy-cane",tier:4,zones:["candy","snow"],weight:1.6,build({kit:n}){let e=new ce;for(let t=0;t<6;t+=1)R(e,n.cylinder(8),n.solid(t%2===0?16777215:15087942),[.3,.5,.3],[0,.25+t*.5,0]);return R(e,n.torus(.3,Math.PI),n.solid(15087942),[.9,.9,.9],[.45,3,0]),e}},AP={kind:"gingerbread-house",tier:5,zones:["candy","snow"],weight:1.4,build({kit:n}){let e=new ce;R(e,n.box(),n.solid(11887901),[2,1.3,1.7],[0,.65,0]),R(e,n.cone(4),n.solid(16775408),[2.2,1.1,1.9],[0,1.85,0],[0,Math.PI/4,0]),R(e,n.box(),n.solid(16740277),[.05,.7,.5],[1.01,.35,0]);for(let[t,i]of[[1,-.55],[1,.55]])R(e,n.box(),n.solid(10221311),[.05,.36,.36],[1.01,t,i]);for(let t=0;t<6;t+=1)R(e,n.sphere(0),n.solid(gt[t*2]),[.18,.18,.18],[-.8+t*.32,1.32,.86]);return e}},RP={kind:"zabuton",tier:2,zones:["room"],weight:1.4,build({kit:n,random:e}){let t=new ce,i=Oe(e,[10304626,4020864,14711391,8499866]);return R(t,n.box(),n.solid(i),[1.1,.22,1.1],[0,.11,0]),R(t,n.sphere(1),n.solid(i),[1.1,.14,1.1],[0,.22,0]),R(t,n.sphere(0),n.solid(15912079),[.1,.08,.1],[0,.3,0]),t}},CP={kind:"low-table",tier:3,zones:["room"],weight:1.4,build({kit:n}){let e=new ce,t=n.solid(9132587);R(e,n.cylinder(18),t,[2.2,.12,2.2],[0,.7,0]);for(let[i,r]of[[.6,.6],[-.6,.6],[.6,-.6],[-.6,-.6]])R(e,n.box(),n.solid(7029286),[.14,.66,.14],[i,.33,r]);return R(e,n.cylinder(10),n.solid(16777215),[.3,.3,.3],[.3,.9,.2]),R(e,n.cylinder(10),n.solid(7289631),[.24,.02,.24],[.3,1.05,.2]),R(e,n.sphere(1),n.solid(16752412),[.28,.28,.28],[-.4,.9,-.3]),e}},PP={kind:"television",tier:3,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[10128536,4869737,13217191]));return R(t,n.box(),i,[1.3,1,1],[0,.6,0]),R(t,n.box(),n.glow(Oe(e,[8054146,10221311,16762623])),[.04,.72,.78],[.66,.62,-.05]),R(t,n.cylinder(6),n.solid(2236987),[.12,.12,.12],[.66,.3,.38],[0,0,Math.PI/2]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,-.2],[.5,0,0]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,.2],[-.5,0,0]),R(t,n.box(),n.solid(7029286),[1.1,.1,.9],[0,.05,0]),t}},IP={kind:"kotatsu",tier:4,zones:["room"],weight:1.2,build({kit:n,random:e}){let t=new ce,i=n.solid(Oe(e,[14034984,4415982,16219904]));R(t,n.box(),i,[2.4,.7,2.4],[0,.35,0]),R(t,n.sphere(1),i,[2.6,.3,2.6],[0,.55,0]),R(t,n.box(),n.solid(10506797),[2.1,.12,2.1],[0,.8,0]);for(let r=0;r<5;r+=1)R(t,n.sphere(1),n.solid(16752412),[.26,.26,.26],[Math.cos(r)*.3,.98,Math.sin(r)*.3]);return t}},NP={kind:"shoji-screen",tier:4,zones:["room"],build({kit:n}){let e=new ce,t=n.solid(8015405);R(e,n.box(),n.solid(16644332),[.08,2.4,1.4],[0,1.2,0]);for(let i=0;i<=4;i+=1)R(e,n.box(),t,[.1,.05,1.42],[0,.05+i*.59,0]);for(let i=0;i<=3;i+=1)R(e,n.box(),t,[.1,2.4,.05],[0,1.2,-.7+i*.467]);return e}},DP={kind:"hibiscus",tier:2,zones:["garden","beach"],weight:1.8,build({kit:n,random:e}){let t=new ce,i=n.solid(4168250);for(let s=0;s<5;s+=1){let o=s/5*Math.PI*2;R(t,n.sphere(1),i,[.7,.1,.32],[Math.cos(o)*.4,.25+s*.06,Math.sin(o)*.4],[0,-o,.3])}let r=n.solid(Oe(e,[16027569,15691663,16230084]));for(let s=0;s<5;s+=1){let o=s/5*Math.PI*2;R(t,n.sphere(1),r,[.55,.12,.42],[Math.cos(o)*.34,.95,Math.sin(o)*.34],[0,-o,-.35])}return R(t,n.cylinder(6),n.solid(15909424),[.07,.5,.07],[.05,1.15,0],[0,0,-.5]),R(t,n.sphere(0),n.solid(15246103),[.14,.14,.14],[.18,1.38,0]),t}},_S=[EC,TC,AC,RC,CC,PC,IC,NC,DC,zC,LC,UC,OC,FC,kC,BC,HC,GC,VC,$C,WC,eP,ZC,XC,qC,YC,JC,jC,KC,QC,tP,nP,iP,rP,sP,oP,aP,cP,lP,uP,hP,dP,fP,pP,mP,gP,xP,_P,vP,yP,bP,SP,MP,wP,EP,TP,AP,RP,CP,PP,IP,NP,DP],zP=Math.max(..._S.map(n=>n.tier));function Ur(n,e){let t=Math.min(Math.max(e,0),zP);return _S.filter(i=>i.tier===t&&(i.zones==="all"||i.zones.includes(n)))}function Or(n,e){let t=0;for(let r of e)t+=r.weight??1;if(t===0)return null;let i=n()*t;for(let r of e)if(i-=r.weight??1,i<=0)return r;return e.at(-1)??null}function io(n,e){n.updateMatrixWorld(!0);let t=[];n.traverse(c=>{c!==n&&c.userData.spin&&t.push(c)});let i=n.matrixWorld.clone().invert(),r=[],s=new Ue;n.traverse(c=>{if(!(c instanceof je))return;let l=c;for(;l&&l!==n;){if(t.includes(l))return;l=l.parent}let u=c.geometry,d=u.index?u.toNonIndexed():u.clone();d.deleteAttribute("uv"),d.applyMatrix4(new Pt().multiplyMatrices(i,c.matrixWorld)),s.copy(c.material.color);let h=d.getAttribute("position").count,f=new Float32Array(h*3);for(let p=0;p<h;p+=1)s.toArray(f,p*3);d.setAttribute("color",new tn(f,3)),r.push(d)});let o=new ce,a=r.length>0?xS(r):null;for(let c of r)c.dispose();if(a){let c=new je(a,e.vertexColored());c.userData.ownedGeometry=!0,o.add(c)}for(let c of t)o.attach(c);return o}var LP=3;function Bh(n,e){let t=Math.floor(e.random()*LP);return e.kit.template(`${n.kind}:${t}`,()=>{let r=In(ys(n.kind)+t*7919),s=io(n.build({kit:e.kit,random:r}),e.kit),o=new oi().setFromObject(s),a=o.getSize(new I),c=o.getCenter(new I),l=Math.max(a.x,a.y,a.z)/2||1;s.position.set(-c.x,-o.min.y,-c.z);let u=new ce;u.scale.setScalar(1/l),u.add(s);let d=new ce;return d.add(u),d}).clone(!0)}function vS(n){let e=n.kind.replace(/-/g," ");return e.charAt(0).toUpperCase()+e.slice(1)}var yS=72,bS=110,UP=34,OP=[15222076,16093498,16241214,7126853,3837910,8015792],SS=[9413806,10334908,8295583,11715531,7309202];function Hh(n,e,t,i,r,s=0){let o=new je(e.box(),e.solid(t));o.scale.set(...i),o.position.set(...r),o.rotation.y=s,n.add(o)}function ro(n,e){return[Math.cos(n)*e,Math.sin(n)*e]}function FP(n,e,t){let i=new ce,r=2.3;for(let a=0;a<64;a+=1){let c=t-r/2+a/64*r+(e()-.5)*.03,l=yS+e()*10,[u,d]=ro(c,l),h=e()<.12,f=1.6+e()*2.6,p=h?9+e()*4:2.5+e()*5.5,y=SS[Math.floor(e()*SS.length)],g=-c;Hh(i,n,y,[f,p,f],[u,p/2,d],g);let m=new Ue(y).lerp(new Ue(15135221),.45).getHex();for(let S=1.2;S<p-.6;S+=1.1)Hh(i,n,m,[f*1.02,.28,f*.7],[u,S,d],g);h&&Hh(i,n,y,[.2,2.2,.2],[u,p+1.1,d])}let[s,o]=ro(t+r/2+.12,yS+4);for(let a=0;a<6;a+=1){let c=2.2-a*.33;Hh(i,n,a%2===0?14829114:16053492,[c,2.4,c],[s,1.2+a*2.4,o])}return io(i,n)}function kP(n,e){let t=new ce;for(let i=0;i<90;i+=1){let r=e()*Math.PI*2,[s,o]=ro(r,50+e()*14),a=2.2+e()*2.4,c=new je(n.cylinder(6),n.solid(7031343));c.scale.set(.2,a*.3,.2),c.position.set(s,a*.15,o);let l=new je(n.sphere(1),n.solid(e()<.5?3112250:3903300));l.scale.set(1.1,a,1.1),l.position.set(s,a*.72,o),t.add(c,l)}return io(t,n)}function BP(n,e){let t=new ce,i=[9225791,8042549,10342478,7319088];for(let r=0;r<22;r+=1){let s=r/22*Math.PI*2+e()*.2,[o,a]=ro(s,58+e()*12),c=new je(n.sphere(2),n.solid(i[r%i.length])),l=18+e()*16;c.scale.set(l,5+e()*6,l*.8),c.position.set(o,-1,a),c.rotation.y=-s,t.add(c)}return io(t,n)}function HP(n,e){let t=new ce,[i,r]=ro(e,130),s=new je(n.cone(28),n.solid(4165567));s.scale.set(96,34,96),s.position.set(i,16,r);let o=new je(n.cone(28),n.solid(16186367));o.scale.set(38,13.6,38),o.position.set(i,26.3,r);let a=new ce;a.add(s,o);for(let c=0;c<7;c+=1){let l=new je(n.cone(3),n.solid(16186367)),u=c/7*Math.PI*2;l.scale.set(6,8,3),l.position.set(i+Math.cos(u)*17,19.5,r+Math.sin(u)*17),l.rotation.set(Math.PI,-u,0),a.add(l)}return t.add(a),io(t,n)}var Gh=class{group=new ce;rainbow=new ce;clouds=[];cloudMaterial;fujiMaterials=[];constructor(e,t){let i=In(t^24301),r=i()*Math.PI*2;this.group.add(BP(e,i),kP(e,i),FP(e,i,r));let s=HP(e,r+2.6);s.traverse(o=>{if(o instanceof je){let a=o.material.clone();a.fog=!1,o.material=a,this.fujiMaterials.push(a)}}),this.group.add(s),this.cloudMaterial=new Yi({color:16777215,fog:!1});for(let o=0;o<16;o+=1){let a=new ce,c=5+Math.floor(i()*5);for(let l=0;l<c;l+=1){let u=new je(e.sphere(2),this.cloudMaterial),d=2.2+i()*3.2;u.scale.set(d*1.2,d,d),u.position.set((l-c/2)*2.6+i(),9+d*.35+i()*2.5,i()*2),a.add(u)}this.group.add(a),this.clouds.push({mesh:a,angle:i()*Math.PI*2,distance:92+i()*22,drift:.004+i()*.006})}OP.forEach((o,a)=>{let c=new je(new Ar(1-a*.034,.017,4,80,Math.PI),new yn({color:o,fog:!1}));this.rainbow.add(c)}),this.group.add(this.rainbow)}update(e,t,i,r,s){this.group.position.set(t.x,0,t.z),this.group.scale.setScalar(i);for(let a of this.clouds){a.angle+=a.drift*e;let[c,l]=ro(a.angle,a.distance);a.mesh.position.set(c,0,l),a.mesh.rotation.y=-a.angle+Math.PI/2}let o=new I;r.getWorldDirection(o),o.y=0,o.normalize(),this.rainbow.visible=s>.5,this.rainbow.position.set(o.x*bS,-1,o.z*bS),this.rainbow.scale.setScalar(UP),this.rainbow.lookAt(t.x,this.group.position.y+i*-1,t.z)}dispose(){this.cloudMaterial.dispose();for(let e of this.fujiMaterials)e.dispose();for(let e of this.rainbow.children)e.geometry.dispose(),e.material.dispose()}};var so=["room","garden","town","beach","candy","forest","snow"];function wS(n){return so.indexOf(n)}var MS=[{room:.72,candy:.14,garden:.14},{room:.55,candy:.15,garden:.2,beach:.1},{room:.28,garden:.28,candy:.14,town:.18,beach:.12},{room:.06,garden:.24,town:.28,beach:.14,forest:.16,candy:.12},{garden:.16,town:.3,beach:.16,forest:.16,snow:.12,candy:.1}];function GP(n){return MS[Math.min(n,MS.length-1)]}function Vh(n,e,t){let i=Math.imul(n|0,668265261)^Math.imul(e|0,374761393);return i=Math.imul(i^Math.imul(t|0,2654435769),2246822507),i^=i>>>13,i=Math.imul(i,3266489909),i^=i>>>16,(i>>>0)/4294967296}function VP(n,e){let t=0;for(let r of so)t+=n[r]??0;let i=e*t;for(let r of so)if(i-=n[r]??0,i<=0&&(n[r]??0)>0)return r;return"garden"}function $P(n){return .3*2**n*16}function oo(n,e,t,i){let r=$P(t),s=Math.floor(n/r),o=Math.floor(e/r),a=Number.POSITIVE_INFINITY,c=s,l=o;for(let u=-1;u<=1;u+=1)for(let d=-1;d<=1;d+=1){let h=s+u,f=o+d,p=(h+.15+.7*Vh(h,f,i+t*7))*r,y=(f+.15+.7*Vh(f,h,i+t*13))*r,g=(p-n)**2+(y-e)**2;g<a&&(a=g,c=h,l=f)}return{zone:VP(GP(t),Vh(c,l,i+t*31+5)),variant:Vh(c,l,i+t*57+11)}}var ES=[14864270,9225791,12239819,15983283,16762588,6467130,15923195],TS=[13218161,10146380,16249820,15455906,16773366,5545777,14543349];var WP=240,rr=128,ZP=200,$h=[{at:0,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1},{at:.07,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.64,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.72,top:6971312,horizon:16757642,sun:16751206,hemiSky:16769228,hemiGround:11049610,light:.95,stars:0},{at:.79,top:2962040,horizon:13073046,sun:16754352,hemiSky:13678822,hemiGround:5918592,light:.75,stars:.4},{at:.86,top:1055306,horizon:3360911,sun:12374015,hemiSky:10137320,hemiGround:3354720,light:.6,stars:1},{at:.95,top:3360154,horizon:10128075,sun:14469375,hemiSky:13353202,hemiGround:6247824,light:.75,stars:.5},{at:1,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1}],XP=new Ue,qP=new Ue;function YP(n){let e=0;for(;e<$h.length-2&&$h[e+1].at<=n;)e+=1;let t=$h[e],i=$h[e+1],r=Rn.smoothstep(n,t.at,i.at),s=(o,a)=>XP.setHex(o).lerp(qP.setHex(a),r).clone();return{top:s(t.top,i.top),horizon:s(t.horizon,i.horizon),sun:s(t.sun,i.sun),hemiSky:s(t.hemiSky,i.hemiSky),hemiGround:s(t.hemiGround,i.hemiGround),light:Rn.lerp(t.light,i.light,r),stars:Rn.lerp(t.stars,i.stars,r)}}var JP=`
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww;
}
`,jP=`
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
`,KP=`
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
}
`,QP=`
uniform sampler2D uZoneMap;
uniform vec2 uMapOrigin;
uniform float uMapSize;
uniform vec3 uZoneColors[${so.length}];
uniform vec3 uAccentColors[${so.length}];
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
`,Wh=class{constructor(e,t,i){this.scene=e;this.kit=t;this.seed=i;let r=In(i);this.phase=.18+r()*.2,this.hemisphere=new Rr(16777215,8956552,1.1),this.sun=new Cr(16777215,1.2),e.add(this.hemisphere,this.sun,this.sun.target),this.skyUniforms={uTop:{value:new Ue},uHorizon:{value:new Ue},uSunColor:{value:new Ue},uSunDirection:{value:new I(0,1,0)},uStars:{value:0},uTime:{value:0}},this.sky=new je(new wa(1,32,16),new sn({uniforms:this.skyUniforms,vertexShader:JP,fragmentShader:jP,side:Jt,depthWrite:!1})),this.sky.frustumCulled=!1,this.sky.renderOrder=-10,e.add(this.sky),this.zoneData=new Uint8Array(rr*rr*4),this.zoneTexture=new $i(this.zoneData,rr,rr),this.zoneTexture.magFilter=Dt,this.zoneTexture.minFilter=Dt,this.groundUniforms={uZoneMap:{value:this.zoneTexture},uMapOrigin:{value:new fe},uMapSize:{value:1},uZoneColors:{value:ES.map(o=>new Ue(o))},uAccentColors:{value:TS.map(o=>new Ue(o))},uDetail:{value:1},uLight:{value:new Ue(1,1,1)},uFogColor:{value:new Ue},uFogNear:{value:10},uFogFar:{value:40}};let s=new Tr(1,1,1,1);s.rotateX(-Math.PI/2),this.ground=new je(s,new sn({uniforms:this.groundUniforms,vertexShader:KP,fragmentShader:QP})),this.ground.frustumCulled=!1,this.ground.renderOrder=-5,e.add(this.ground),this.horizon=new Gh(t,i),e.add(this.horizon.group)}scene;kit;seed;hemisphere;sun;fogColor=new Ue;sky;skyUniforms;ground;groundUniforms;zoneData;zoneTexture;horizon;zoneOrigin=new fe(Number.NaN,Number.NaN);zoneLevel=-1;zoneMapSize=1;phase;get skyPhase(){return this.phase}update(e,t,i,r,s,o){this.phase=(this.phase+e/WP)%1;let a=YP(this.phase),c=this.phase<.7,l=c?this.phase/.7:(this.phase-.7)/.3,u=Math.sin(l*Math.PI)*(c?1:.7),d=l*Math.PI+.4,h=new I(Math.cos(d)*Math.cos(Math.asin(Math.min(.999,u))),Math.max(.05,u),Math.sin(d)*.6).normalize();this.skyUniforms.uTop.value.copy(a.top),this.skyUniforms.uHorizon.value.copy(a.horizon),this.skyUniforms.uSunColor.value.copy(a.sun),this.skyUniforms.uSunDirection.value.copy(h),this.skyUniforms.uStars.value=a.stars,this.skyUniforms.uTime.value=t,this.sky.position.copy(o.position),this.sky.scale.setScalar(o.far*.5),this.hemisphere.color.copy(a.hemiSky),this.hemisphere.groundColor.copy(a.hemiGround),this.hemisphere.intensity=.55+a.light*.6,this.sun.color.copy(a.sun),this.sun.intensity=a.light*1.1,this.sun.position.copy(i).addScaledVector(h,r*40),this.sun.target.position.copy(i),this.fogColor.copy(a.horizon);let f=this.scene.fog,p=r*34,y=r*150;f&&(f.color.copy(this.fogColor),f.near=p,f.far=y);let g=r*ZP;this.refreshZones(i,g,s),this.ground.position.set(i.x,0,i.z),this.ground.scale.set(g,1,g),this.groundUniforms.uDetail.value=.36*2**s,this.groundUniforms.uLight.value.copy(a.hemiSky).lerp(new Ue(1,1,1),.35).multiplyScalar(.55+a.light*.4),this.groundUniforms.uFogColor.value.copy(this.fogColor),this.groundUniforms.uFogNear.value=p,this.groundUniforms.uFogFar.value=y,this.horizon.update(e,i,r,o,this.phase>.05&&this.phase<.7?1:0)}refreshZones(e,t,i){let r=t/rr,s=Math.floor((e.x-t/2)/r)*r,o=Math.floor((e.z-t/2)/r)*r;if(!(Math.abs(s-this.zoneOrigin.x)>t/8||Math.abs(o-this.zoneOrigin.y)>t/8||Math.abs(t-this.zoneMapSize)>t*.2||Number.isNaN(this.zoneOrigin.x))&&i===this.zoneLevel){this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=this.zoneMapSize;return}this.zoneOrigin.set(s,o),this.zoneLevel=i,this.zoneMapSize=t;for(let c=0;c<rr;c+=1)for(let l=0;l<rr;l+=1){let u=oo(s+(l+.5)*r,o+(c+.5)*r,i,this.seed),d=(c*rr+l)*4;this.zoneData[d]=wS(u.zone)*32,this.zoneData[d+1]=Math.floor(u.variant*255),this.zoneData[d+2]=0,this.zoneData[d+3]=255}this.zoneTexture.needsUpdate=!0,this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=t}dispose(){this.horizon.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose(),this.ground.geometry.dispose(),this.ground.material.dispose(),this.zoneTexture.dispose()}};var Ha=.5,Lx=.95,e3=26,t3=5,n3=140,i3=4,r3=8,s3=.1,o3=1e3/60,a3=1e3/30,c3=4,AS=5.5,l3=2.8,u3=2,Ux=.35,h3=1.1,Ox=.2,d3=.05,RS=5e4,f3=72,p3=9,m3=.18,g3=1.4;function kr(n,e){return Math.atan2(e,n)}function sr(n){return Math.atan2(Math.sin(n),Math.cos(n))}function Yn(n,e){return 1-Math.exp(-n*e)}function x3(n){return 1-.75**Math.max(0,n)}function Fx(n){let e=Math.min(1,zi(n)/m3);return 1-e*e*(3-2*e)}function _3(n){return .58*(n/.3)**.42*(1+2.6*Fx(n))}var Zh=class{constructor(e,t,i,r){this.audio=t;this.onHud=i;this.onEvent=r;this.seed=ys("context-katamari-world"),this.random=In(this.seed^Date.now()),this.renderer=new Nh({canvas:e,antialias:!0,powerPreference:"low-power"}),this.scene.fog=new oa(16777215,10,40),this.environment=new Wh(this.scene,this.kit,this.seed);for(let c=0;c<14;c+=1){let l=new je(this.kit.sphere(2),new yn({color:16777215,transparent:!0,opacity:0,depthWrite:!1}));l.visible=!1,this.scene.add(l),this.puffs.push({mesh:l,life:0,grow:0})}for(let c=0;c<48;c+=1){let l=new je(this.kit.box(),this.kit.solid(gt[c%gt.length]));l.visible=!1,this.scene.add(l),this.confetti.push({mesh:l,velocity:new I,spin:new I,life:0})}for(let c=0;c<28;c+=1){let l=new je(this.kit.geometry("octahedron",()=>new qi(.5,0)),this.glintMaterial);l.visible=!1,this.scene.add(l),this.glints.push({mesh:l,velocity:new I,spin:new I,life:0})}let s=this.kit.solid(16762409),o=this.kit.cylinder(18);for(let c=0;c<f3;c+=1){let l=new je(o,s);l.visible=!1,this.scene.add(l),this.coins.push({mesh:l,life:0,vy:0,spin:0,size:0})}let a=new Ma(.8,1,48);a.rotateX(-Math.PI/2),this.shockwave=new je(a,this.shockwaveMaterial),this.shockwave.visible=!1,this.scene.add(this.shockwave)}audio;onHud;onEvent;renderer;scene=new Gs;camera=new qt(55,4/3,.05,200);kit=new Lh;environment;seed;random;props=new Map;chunks=new Set;takenPropIds=new Set;spawnQueue=[];actorCache=new Map;puffs=[];active=null;exiting=[];mode="empty";compacted={seq:null,compactions:null};pendingEntry=null;confetti=[];glints=[];glintMaterial=new yn({color:16777215,fog:!1});shockwave;shockwaveMaterial=new yn({color:16777215,transparent:!0,opacity:0,depthWrite:!1,side:zn});shockwaveLife=0;shockwaveRadius=1;drive=Nl;manualSeconds=0;lastLookOut=-10;portraits=new Map;cameraFocus=new I;cameraHeading=0;cameraPosition=new I;cameraTarget=new I;cameraRadius=.3;cameraFrame=.3;usedTokens=null;coins=[];cameraFrozen=!1;shake=0;time=0;hudIn=0;frame=0;lastFrameTime=0;running=!1;disposed=!1;lastFillMilestone=-1;resize(e,t,i){e<=0||t<=0||(this.renderer.setPixelRatio(Math.min(i,2)),this.renderer.setSize(e,t,!1),this.camera.aspect=e/t,this.camera.updateProjectionMatrix())}setDrive(e){this.drive=e,ag(e)||(this.manualSeconds=c3)}setStage(e){this.mode=e.mode,this.compacted={seq:e.compactedSeq??null,compactions:e.compactions},e.usedTokens!==void 0&&(this.usedTokens=e.usedTokens);let t=Vo(e.fill);if(e.threadId===null)return;if((this.active?.threadId??this.pendingEntry?.threadId??null)!==e.threadId){this.handoff(e);return}if(this.pendingEntry){this.pendingEntry.fill=e.fill,this.pendingEntry.compactions=e.compactions,this.pendingEntry.compactedSeq=e.compactedSeq??null,this.pendingEntry.ready=e.ready;return}let r=this.active;if(!r||!e.ready)return;if(!r.synced){r.synced=!0,r.radius=t,r.targetRadius=t,r.compactedSeq=e.compactedSeq??null,this.showKnownCompactions(r,e.compactions),r.stuck.length<12&&this.prefill(r);return}if(r.targetRadius=t,this.popIfCompacted(r)||r.pop)return;let s=oS(r.compactionsKnown?r.compactions:null,e.compactions);s!==null&&this.showKnownCompactions(r,s)}popIfCompacted(e){let{seq:t,compactions:i}=this.compacted;return t===null||t===e.compactedSeq||!e.synced||e.pop||e.phase!=="stage"?!1:(e.compactedSeq=t,e.pop={time:0,fromRadius:e.radius,compactions:Math.max(i??0,e.compactions),burst:!1,startScale:1},!0)}gulp(e){let t=this.active;if(!t||t.phase!=="stage"||t.pop||!(e>0))return;let i=Math.min(1,Math.sqrt(e/d3)*.6);t.gulp={time:0,strength:i,chomps:i<.25?1:i<.6?2:3},this.audio.gulp(i),this.sprinkle(t,3+Math.round(i*7),!0);let r=t.radius*(4+i*8);for(let s of this.props.values()){if(s.size>t.radius*Ha)continue;let o=t.x-s.x,a=t.z-s.z,c=Math.hypot(o,a);if(c>r||c===0)continue;let l=t.radius*(2+i*6);s.vx=o/c*l,s.vz=a/c*l,s.vy=s.size*(2+i*4)}i>=.6&&(this.shake=Math.max(this.shake,.5));for(let s=0;s<3+i*6;s+=1)this.puff(t.x,t.z,t.radius*1.4)}start(){if(this.running||this.disposed)return;this.running=!0,this.lastFrameTime=performance.now();let e=t=>{if(!this.running)return;let i=this.isCalm()?a3:o3;if(t-this.lastFrameTime<i-1){this.frame=window.requestAnimationFrame(e);return}let r=Math.min(.1,(t-this.lastFrameTime)/1e3);this.lastFrameTime=t,this.update(r),this.renderer.render(this.scene,this.camera),this.frame=window.requestAnimationFrame(e)};this.frame=window.requestAnimationFrame(e)}isCalm(){return this.mode!=="rolling"&&this.exiting.length===0&&this.pendingEntry===null&&(this.active===null||this.active.phase==="stage"&&this.active.pop===null&&this.active.gulp===null)&&this.coins.every(e=>e.life<=0)}stop(){this.running=!1,window.cancelAnimationFrame(this.frame),this.audio.setRolling(!1,0)}dispose(){this.stop(),this.disposed=!0,this.props.clear(),this.shockwave.geometry.dispose();for(let e of this.puffs)e.mesh.material.dispose();this.glintMaterial.dispose(),this.shockwaveMaterial.dispose(),this.environment.dispose(),this.kit.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss()}handoff(e){let t=this.active;if(this.active=null,t){let i=new fe(-Math.sin(this.cameraHeading),Math.cos(this.cameraHeading));t.phase="exit",t.phaseTime=0,t.exitDirection.copy(i),this.exiting.push(t),this.cameraFrozen=!0,this.audio.whoosh()}this.pendingEntry={threadId:e.threadId??"",fill:e.fill,compactions:e.compactions,compactedSeq:e.compactedSeq??null,ready:e.ready,delay:t?.45:0,waited:0}}setCompactions(e,t,i){t===e.compactions&&e.moons.total===t||(e.compactions=t,zx(e.core,this.kit,e.nubColor,t),e.moons.setCount(t,i))}showKnownCompactions(e,t){t!==null&&(e.compactionsKnown=!0,this.setCompactions(e,t,!1))}spawnEntering(e,t,i,r,s){let o=this.exiting.find(d=>d.threadId===e);if(o){this.exiting=this.exiting.filter(d=>d!==o),o.targetRadius=Vo(t),s&&this.showKnownCompactions(o,i),o.compactedSeq=r,o.phase="enter",o.phaseTime=0,this.active=o,this.onEvent({kind:"enter",threadId:e});return}let a=this.actorCache.get(e);this.actorCache.delete(e);let c=a??this.createActor(e,t,i,s);c.targetRadius=Vo(t),a&&s&&this.showKnownCompactions(c,i),c.compactedSeq=r;let l=new fe(Math.sin(this.cameraHeading),-Math.cos(this.cameraHeading)),u=Math.max(c.radius,this.cameraRadius)*9;c.x=this.cameraFocus.x+l.x*u,c.z=this.cameraFocus.z+l.y*u,c.heading=kr(-l.x,-l.y),c.phase=this.exiting.length>0||this.hasOrigin?"enter":"stage",c.phaseTime=0,c.speed=0,c.vx=0,c.vz=0,c.phase==="stage"&&(c.x=this.cameraFocus.x,c.z=this.cameraFocus.z),this.hasOrigin=!0,this.scene.add(c.ball,c.rig.root,c.ballShadow,c.cousinShadow),this.active=c,this.lastFillMilestone=Math.floor(Go(t)*10),this.onEvent({kind:"enter",threadId:e})}hasOrigin=!1;createActor(e,t,i,r){let s=i??0,o=ys(e),a=In(o),c=pS(this.kit,o),l=new ce,u=new ce;l.add(u);let d=new ce,h=Oe(a,gt);zx(d,this.kit,h,s),u.add(d);let f=new Uh(this.kit);f.setCount(s,!1),l.add(f.group);let p=new je(this.kit.shadowDisc(),this.kit.shadow()),y=new je(this.kit.shadowDisc(),this.kit.shadow());p.renderOrder=-1,y.renderOrder=-1;let g=Vo(t),m={threadId:e,rig:c,ball:l,roll:u,core:d,nubColor:h,moons:f,compactions:s,compactionsKnown:r&&i!==null,compactedSeq:null,synced:r,pop:null,gulp:null,coinDistance:0,coinsAnnounced:!1,ballShadow:p,cousinShadow:y,x:0,z:0,heading:a()*Math.PI*2,speed:0,vx:0,vz:0,radius:g,targetRadius:g,stuck:[],phase:"stage",phaseTime:0,exitDirection:new fe(1,0),stride:0,idleSeconds:0,turnRate:0,decisionIn:1,behavior:"cruise",behaviorSign:1,seekTarget:null,hungrySeconds:0,lastBonk:0,random:a};return this.prefill(m),m}prefill(e){let t=Il(e.radius),i=16+Math.round(zi(e.radius)*90);for(let r=0;r<i;r+=1){let s=Math.max(0,t-(e.random()<.6?0:1)),o=Oe(e.random,["room","garden","town","beach","candy"]),a=Or(e.random,Ur(o,s));if(!a)continue;let c=e.radius*(.14+e.random()*.26);this.attach(e,a,c,this.randomDirection(e.random),e.radius*.84)}}update(e){if(this.time+=e,this.manualSeconds=Math.max(0,this.manualSeconds-e),this.pendingEntry){let o=this.pendingEntry;o.delay-=e,o.waited+=e,o.delay<=0&&(o.ready||o.waited>u3)&&(this.pendingEntry=null,this.spawnEntering(o.threadId,o.fill,o.compactions,o.compactedSeq,o.ready))}let t=this.active;t&&(this.popIfCompacted(t),this.updateActor(t,e));for(let o of this.exiting)this.updateActor(o,e);this.exiting=this.exiting.filter(o=>{let a=Math.hypot(o.x-this.cameraFocus.x,o.z-this.cameraFocus.z)>Math.max(o.radius,this.cameraRadius)*14;return o.phaseTime>3.5||a?(this.retire(o),!1):!0}),this.updateCamera(e);let i=this.cameraRadius,r=Il(i);this.refreshChunks(r),this.updateProps(e),this.updatePuffs(e),this.updateConfetti(e),this.updateCoins(e),this.environment.update(e,this.time,this.cameraFocus,i,r,this.camera);let s=t!==null&&t.phase==="stage"&&(this.mode==="rolling"||this.manualSeconds>0)&&t.speed>t.radius*.2;this.audio.setRolling(s,t?t.speed/Math.max(t.radius*2.4,.001):0),this.hudIn-=e,this.hudIn<=0&&t&&(this.hudIn=s3,this.onHud({radius:t.radius,targetRadius:t.targetRadius,compactions:t.compactions,zone:oo(t.x,t.z,r,this.seed).zone,hungry:t.radius<t.targetRadius*.98,steering:this.manualSeconds>0,transitioning:t.phase!=="stage"||this.exiting.length>0}))}retire(e){for(this.scene.remove(e.ball,e.rig.root,e.ballShadow,e.cousinShadow),this.actorCache.set(e.threadId,e);this.actorCache.size>r3;){let t=this.actorCache.keys().next().value;if(t===void 0)break;this.actorCache.delete(t)}this.exiting.length<=1&&(this.cameraFrozen=!1)}updateActor(e,t){e.phaseTime+=t;let i=e.radius,r=0,s=0,o=3,a=0,c=()=>Math.cos(e.heading),l=()=>Math.sin(e.heading);if(e.pop)this.updatePop(e,t);else if(e.phase==="exit"){let C=kr(e.exitDirection.x,e.exitDirection.y);a=sr(C-e.heading)*4,r=c()*i*5,s=l()*i*5}else if(e.phase==="enter"){let C=this.cameraFocus.x-e.x,_=this.cameraFocus.z-e.z,T=Math.hypot(C,_);a=sr(kr(C,_)-e.heading)*4;let P=Math.min(i*4.5,T*2.2);r=c()*P,s=l()*P,(T<i*.6||e.phaseTime>3)&&(e.phase="stage",e.phaseTime=0,this.cameraFrozen=!1)}else if(this.manualSeconds>0&&e===this.active){let C=this.drive;a=C.turn*l3,r=c()*C.forward*i*AS,s=l()*C.forward*i*AS,o=ag(C)?.9:1.8}else if(this.mode==="rolling"){let C=this.wander(e,t);a=C.turn,r=c()*C.speed,s=l()*C.speed,o=2.2}else o=3.5;let u=x3(e.compactions);if(e.phase==="stage"&&e.speed>i*.1){let C=this.manualSeconds>0&&e===this.active;a+=Math.sin(this.time*2.1+e.stride*.13)*u*(C?.7:1.4)}e.heading=sr(e.heading+a*t);let d=Yn(o,t);e.vx+=(r-e.vx)*d,e.vz+=(s-e.vz)*d,e.speed=Math.hypot(e.vx,e.vz),e.speed<i*.01&&r===0&&s===0&&(e.vx=0,e.vz=0,e.speed=0);let h=Math.cos(e.heading),f=Math.sin(e.heading);e.x+=e.vx*t,e.z+=e.vz*t;let p=e.speed*t;if(p>0){let C=new I(e.vz,0,-e.vx).normalize();e.roll.quaternion.premultiply(new mn().setFromAxisAngle(C,p/i)),e.idleSeconds=0}else e.idleSeconds+=t;e.gulp&&!e.pop&&this.updateGulp(e,t),e.phase==="stage"&&!e.pop&&(this.collide(e),e===this.active&&this.watchAhead(e),this.growToward(e,t)),e.ball.position.set(e.x,e.radius*e.roll.scale.y,e.z),e.core.scale.setScalar(e.radius*1.68),e.ballShadow.position.set(e.x,.002*e.radius,e.z),e.ballShadow.scale.setScalar(e.radius*.95*e.roll.scale.x),e.moons.update(t,e.radius*e.roll.scale.x,this.time);let y=Fx(e.radius),g=_3(e.radius),m=e.radius+g*Rn.lerp(.28,.13,y),S=Math.sin(this.time*1.9)*u*g*.12,E=e.x-h*m-f*S,v=e.z-f*m+h*S,M=g*.58,w=Math.min(Math.PI/2-.2,Math.atan2(m-e.radius*.6,Math.max(.001,M-e.radius)));e.rig.root.position.set(E,0,v),e.rig.root.rotation.y=-e.heading,e.rig.root.scale.setScalar(g),e.cousinShadow.position.set(E,.003*e.radius,v),e.cousinShadow.scale.setScalar(g*.3),e.stride+=e.speed/g*t*3.2,mS(e.rig,{stride:e.stride,speed:e.speed/g,idleSeconds:e.idleSeconds,waiting:this.mode==="waiting"&&e===this.active&&e.phase==="stage",time:this.time,reach:w,dizziness:u,stars:Math.min(kh,e.compactions)}),p>0&&this.dropCoins(e,p,E,v,g),e.speed>e.radius*.8&&e.random()<t*10*Math.min(2,e.speed/e.radius)&&this.glint(e),e.speed>e.radius*1.5&&e.random()<t*6&&this.puff(E,v,e.radius)}wander(e,t){let i=e.radius;e.decisionIn-=t;let r=e.radius<e.targetRadius*.98;if(e.decisionIn<=0){let u=e.random();e.behaviorSign=e.random()<.5?-1:1,r&&u<.6?(e.behavior="seek",e.seekTarget=this.nearestPickup(e)):u<.45?e.behavior="cruise":u<.75?e.behavior="swerve":e.behavior="loop",e.decisionIn=e.behavior==="swerve"?.6+e.random()*.8:1.5+e.random()*3}e.turnRate+=(e.random()-.5)*t*4,e.turnRate*=1-Yn(.8,t);let s=e.turnRate+Math.sin(this.time*.9+e.x*.1)*.25,o=i*(4+Math.sin(this.time*.37)*.6);switch(e.behavior){case"swerve":s+=e.behaviorSign*1.7;break;case"loop":s+=e.behaviorSign*1.05,o*=.85;break;case"seek":{let u=e.seekTarget;if(u&&this.props.has(u.id)){let d=kr(u.x-e.x,u.z-e.z);s=sr(d-e.heading)*2.6,o*=1.15}else e.decisionIn=0;break}default:break}let a=i*3.2,c=Math.cos(e.heading),l=Math.sin(e.heading);for(let u of this.props.values()){if(u.size<i*Lx||u.lift>i*2)continue;let d=u.x-e.x,h=u.z-e.z,f=d*c+h*l;if(f<=0||f>a+u.size)continue;let p=d*-l+h*c;Math.abs(p)<i+u.size*.8&&(s+=(p>0?-1:1)*2.4*(1-f/(a+u.size)))}return{turn:Rn.clamp(s,-2.6,2.6),speed:o}}nearestPickup(e){let t=null,i=Number.POSITIVE_INFINITY;for(let r of this.props.values()){if(r.size>e.radius*Ha||r.size<e.radius*.06)continue;let s=Math.hypot(r.x-e.x,r.z-e.z);if(s>e.radius*14)continue;let o=Math.abs(sr(kr(r.x-e.x,r.z-e.z)-e.heading)),a=s*(1+o);a<i&&(i=a,t=r)}return t}collide(e){let t=e.radius<e.targetRadius*.995;for(let i of[...this.props.values()]){if(i.lift+i.hop>e.radius*1.6)continue;let r=i.x-e.x,s=i.z-e.z,o=Math.hypot(r,s),a=e.radius+i.size*.7;if(o>=a)continue;let c=o>0?r/o:1,l=o>0?s/o:0;if(t&&i.size<=e.radius*Ha){this.rollUp(e,i);continue}if(i.size<e.radius*Lx){let d=Math.max(e.speed,e.radius)*1.3;i.vx=c*d,i.vz=l*d,i.hop<=0&&(i.vy=i.size*3),i.x=e.x+c*a,i.z=e.z+l*a;continue}e.x=i.x-c*a,e.z=i.z-l*a;let u=e.vx*c+e.vz*l;u>0&&(e.vx-=c*u*1.4,e.vz-=l*u*1.4),u>e.radius*2.2&&this.knockLoose(e,u,c,l),this.manualSeconds<=0&&(e.heading=sr(kr(-c,-l)+(e.random()-.5)*1.2),e.decisionIn=Math.min(e.decisionIn,.3)),this.time-e.lastBonk>.4&&(e.lastBonk=this.time,this.shake=.35,this.audio.bonk())}}portrait(e){let t=this.portraits.get(e.kind);if(t!==void 0)return t;let i=null;try{let s=new nn(96,96);s.texture.colorSpace=pn;let o=new Gs;o.add(new Rr(16777215,9080732,1.6));let a=new Cr(16777215,1.4);a.position.set(2,3,2),o.add(a);let c=Bh(e,{kit:this.kit,random:()=>0});c.rotation.y=-.7,o.add(c);let l=new qt(32,1,.1,20);l.position.set(2.6,2.4,3.2),l.lookAt(0,.8,0),this.renderer.setRenderTarget(s),this.renderer.setClearColor(0,0),this.renderer.clear(),this.renderer.render(o,l);let u=new Uint8Array(9216*4);this.renderer.readRenderTargetPixels(s,0,0,96,96,u),this.renderer.setRenderTarget(null);let d=document.createElement("canvas");d.width=96,d.height=96;let h=d.getContext("2d");if(h){let f=h.createImageData(96,96);for(let p=0;p<96;p+=1)f.data.set(u.subarray((95-p)*96*4,(96-p)*96*4),p*96*4);h.putImageData(f,0,0),i=d.toDataURL("image/png")}s.dispose()}catch{i=null}return this.portraits.set(e.kind,i),i}knockLoose(e,t,i,r){let s=Math.min(e.stuck.length-4,1+Math.floor(t/e.radius-2));if(s<=0)return;let o=e.stuck.splice(e.stuck.length-s,s),a=new I;for(let[c,l]of o.entries()){l.object.getWorldPosition(a),e.roll.remove(l.object);let u=this.addProp(l.definition,a.x,a.z,l.size,null,`loose:${this.time}:${c}`,l.object),d=(e.random()-.5)*2;u.vx=(-i+-r*d)*e.radius*3,u.vz=(-r+i*d)*e.radius*3,u.hop=Math.max(0,a.y-l.size),u.vy=e.radius*4}this.onEvent({kind:"knockedOff",count:o.length})}watchAhead(e){if(e.speed<e.radius||this.time-this.lastLookOut<3)return;let t=e.vx/e.speed,i=e.vz/e.speed;for(let r of this.props.values()){if(r.size<e.radius*Lx)continue;let s=r.x-e.x,o=r.z-e.z,a=s*t+o*i,c=Math.abs(s*-i+o*t);if(a>0&&a<e.radius*2.5+r.size&&c<e.radius+r.size*.6){this.lastLookOut=this.time,this.onEvent({kind:"lookOut"});return}}}rollUp(e,t){if(this.removeProp(t),this.takenPropIds.add(t.id),this.takenPropIds.size>6e3){let c=this.takenPropIds.values().next().value;c!==void 0&&this.takenPropIds.delete(c)}let r=new I(t.x-e.x,t.lift+t.hop+t.size*.5-e.radius,t.z-e.z).normalize().applyQuaternion(e.roll.quaternion.clone().invert());this.attach(e,t.definition,t.size,r,e.radius*.84,t.object);let s=Math.max(t.size*.1,(e.targetRadius-e.radius)*.14);e.radius=Math.min(e.targetRadius,e.radius+s),e.hungrySeconds=0,this.audio.pickup(t.size/e.radius),this.onEvent({kind:"rolledUp",name:vS(t.definition),size:t.size,image:this.portrait(t.definition)});let o=zi(e.radius),a=Math.floor(o*10);a>this.lastFillMilestone&&(this.lastFillMilestone=a,this.onEvent({kind:"pickup",fill:o}))}attach(e,t,i,r,s,o){let a=o??Bh(t,{kit:this.kit,random:e.random});if(a.scale.setScalar(i),a.position.copy(r).multiplyScalar(s-i*.4),a.quaternion.setFromUnitVectors(new I(0,1,0),r).multiply(new mn().setFromEuler(new Dn((e.random()-.5)*1.8,e.random()*Math.PI*2,(e.random()-.5)*1.8))),e.roll.add(a),e.stuck.push({object:a,definition:t,size:i,depth:s}),e.stuck.length>n3){let c=e.stuck.shift();c&&e.roll.remove(c.object)}}growToward(e,t){let i=e.radius*.84;if(e.stuck=e.stuck.filter(r=>{let s=r.depth+r.size*.9<i;return s&&e.roll.remove(r.object),!s}),e.targetRadius<e.radius*.9){this.shed(e);return}e.radius<e.targetRadius*.98?(e.hungrySeconds+=t,this.mode==="rolling"&&e.hungrySeconds>5?(e.hungrySeconds=0,this.sprinkle(e)):this.mode!=="rolling"&&e.hungrySeconds>g3&&(e.hungrySeconds=0,this.sprinkle(e,5,!0))):e.hungrySeconds=0}sortForShrink(e,t,i){let r=e.stuck.filter(c=>c.size<=i*Ha),s=Math.max(4,Math.round(e.stuck.length*(i/t)**2)),o=new Set(r.slice(0,s)),a=e.stuck.filter(c=>!o.has(c));return e.stuck=e.stuck.filter(c=>o.has(c)),a}shed(e){let t=this.sortForShrink(e,e.radius,e.targetRadius);for(let i of t.slice(0,24)){e.roll.remove(i.object);let r=e.random()*Math.PI*2,s=this.addProp(i.definition,e.x+Math.cos(r)*e.radius*1.2,e.z+Math.sin(r)*e.radius*1.2,i.size,null,`shed:${this.time}:${Math.random()}`,i.object);s.vx=Math.cos(r)*e.radius*3,s.vz=Math.sin(r)*e.radius*3,s.vy=e.radius*4}for(let i of t.slice(24))e.roll.remove(i.object);e.radius=e.targetRadius;for(let i of e.stuck)i.depth=Math.min(i.depth,e.radius*.84);for(let i of e.stuck)i.object.position.setLength(i.depth-i.size*.4);this.audio.shed()}updatePop(e,t){let i=e.pop;if(!i)return;if(i.time+=t,i.time<Ux){let o=i.time/Ux,a=1+.32*(1-(1-o)**3),c=Math.sin(i.time*48)*.07*o;e.roll.scale.set(a*(1+c),a*(1-c),a*(1+c)),this.shake=Math.max(this.shake,.12*o);return}i.burst||(i.burst=!0,this.burst(e,i));let r=Math.min(1,(i.time-Ux)/h3),s=r>=1?1:1-2**(-9*r)*Math.cos(r*Math.PI*3.2);e.roll.scale.setScalar(Rn.lerp(i.startScale,1,s)),r>=1&&(e.roll.scale.setScalar(1),e.pop=null)}burst(e,t){let i=Math.min(e.targetRadius,t.fromRadius);t.startScale=t.fromRadius*1.32/i;let r=this.sortForShrink(e,t.fromRadius,i),s=new I;for(let[a,c]of r.entries()){if(c.object.getWorldPosition(s),e.roll.remove(c.object),a>=30)continue;let l=s.x-e.x,u=s.z-e.z,d=Math.hypot(l,u)||1,h=this.addProp(c.definition,s.x,s.z,c.size,null,`pop:${this.time}:${a}`,c.object),f=t.fromRadius*(3+e.random()*3);h.vx=l/d*f,h.vz=u/d*f,h.hop=Math.max(0,s.y-c.size),h.vy=t.fromRadius*(5+e.random()*4)}e.radius=i;for(let a of e.stuck)a.depth=Math.min(a.depth,i*.84),a.object.position.setLength(a.depth-a.size*.4);this.setCompactions(e,t.compactions,!0);let o=new I(e.x,t.fromRadius,e.z);for(let a of this.confetti){let c=this.randomDirection(this.random);c.y=Math.abs(c.y)+.3,a.velocity.copy(c.normalize()).multiplyScalar(t.fromRadius*(4+this.random()*5)),a.spin.set(this.random()*12,this.random()*12,this.random()*12),a.life=1.4+this.random()*.8,a.mesh.visible=!0,a.mesh.position.copy(o),a.mesh.scale.set(t.fromRadius*.14,t.fromRadius*.05,t.fromRadius*.09)}this.shockwaveLife=1,this.shockwaveRadius=t.fromRadius,this.shockwave.position.set(e.x,t.fromRadius*.02,e.z),this.shockwave.visible=!0,this.shake=.6,this.audio.pop(),this.onEvent({kind:"compacted",compactions:t.compactions})}glint(e){let t=this.glints.find(r=>r.life<=0);if(!t)return;let i=e.random()*Math.PI*2;t.life=.7,t.mesh.visible=!0,t.mesh.position.set(e.x+Math.cos(i)*e.radius*.9,e.radius*(1+e.random()*.9),e.z+Math.sin(i)*e.radius*.9),t.velocity.set(Math.cos(i)*e.radius*1.2,e.radius*1.6,Math.sin(i)*e.radius*1.2),t.spin.set(0,8,4),t.mesh.scale.setScalar(e.radius*.12)}updateConfetti(e){for(let t of this.glints)t.life<=0||(t.life-=e,t.mesh.position.addScaledVector(t.velocity,e),t.mesh.rotation.y+=t.spin.y*e,t.mesh.scale.multiplyScalar(1-e*1.2),t.life<=0&&(t.mesh.visible=!1));for(let t of this.confetti){if(t.life<=0)continue;t.life-=e;let i=t.mesh.scale.x*40;t.velocity.y-=i*e,t.velocity.multiplyScalar(1-Yn(1.2,e)),t.mesh.position.addScaledVector(t.velocity,e),t.mesh.position.y<0&&(t.mesh.position.y=0,t.velocity.set(0,0,0)),t.mesh.rotation.x+=t.spin.x*e,t.mesh.rotation.y+=t.spin.y*e,t.mesh.rotation.z+=t.spin.z*e,t.life<=0&&(t.mesh.visible=!1)}if(this.shockwaveLife>0){this.shockwaveLife=Math.max(0,this.shockwaveLife-e*1.3);let t=1-this.shockwaveLife;this.shockwave.scale.setScalar(this.shockwaveRadius*(1.2+t*5)),this.shockwaveMaterial.opacity=this.shockwaveLife*.85,this.shockwaveLife===0&&(this.shockwave.visible=!1)}}sprinkle(e,t=5,i=!1){let r=Il(e.radius),s=oo(e.x,e.z,r,this.seed).zone;for(let o=0;o<t;o+=1){let a=Or(this.random,Ur(s,r))??Or(this.random,Ur("room",Math.max(0,r-1)));if(!a)continue;let c=i?this.random()*Math.PI*2:(this.random()-.5)*1.4,l=e.radius*(i?1.1+this.random()*1.2:3+this.random()*4),u=e.heading+c,d=this.addProp(a,e.x+Math.cos(u)*l,e.z+Math.sin(u)*l,e.radius*(.2+this.random()*.25),null,`sprinkle:${this.time}:${o}`);d.hop=e.radius*(i?3+this.random()*5:6),d.vy=0,i&&(d.vx=-Math.cos(u)*e.radius*3,d.vz=-Math.sin(u)*e.radius*3)}i||this.onEvent({kind:"sprinkle"})}updateGulp(e,t){let i=e.gulp;if(!i)return;i.time+=t;let r=i.chomps*Ox;if(i.time>=r){e.roll.scale.setScalar(1),e.gulp=null;return}let s=Math.sin(i.time%Ox/Ox*Math.PI),o=s*(.1+i.strength*.22);e.roll.scale.set(1+o*.7,1-o,1+o*.7),i.strength>=.6&&(this.shake=Math.max(this.shake,.3*s))}dropCoins(e,t,i,r,s){let o=this.usedTokens;if(e!==this.active||e.phase!=="stage"||o===null||o<RS)return;e.coinsAnnounced||(e.coinsAnnounced=!0,this.onEvent({kind:"coins",usedTokens:o}));let a=.35*Math.min(6,o/RS);for(e.coinDistance+=t/e.radius;e.coinDistance>=1/a;){e.coinDistance-=1/a;let c=this.coins.find(u=>u.life<=0)??this.coins[0],l=Math.max(s*.3,e.radius*.22);c.life=p3,c.size=l,c.vy=l*(9+e.random()*5),c.spin=14+e.random()*10,c.mesh.visible=!0,c.mesh.position.set(i+(e.random()-.5)*l*3,s*.35,r+(e.random()-.5)*l*3),c.mesh.rotation.set(Math.PI/2,e.random()*Math.PI,0),c.mesh.scale.set(l,l*.16,l),this.coins.splice(this.coins.indexOf(c),1),this.coins.push(c),e.random()<.5&&this.audio.coin()}}updateCoins(e){for(let t of this.coins){if(t.life<=0)continue;t.life-=e;let i=t.size*.08,r=t.mesh.position;(r.y>i||t.vy>0)&&(t.vy-=t.size*60*e,r.y=Math.max(i,r.y+t.vy*e),t.mesh.rotation.x+=t.spin*e,r.y===i&&(t.vy=0,t.mesh.rotation.x=0));let s=Math.min(1,t.life/1.2);t.mesh.scale.set(t.size*s,t.size*.16*s,t.size*s),t.life<=0&&(t.mesh.visible=!1)}}randomDirection(e){let t=e()*2-1,i=e()*Math.PI*2,r=Math.sqrt(1-t*t);return new I(r*Math.cos(i),t,r*Math.sin(i))}updateCamera(e){let t=this.active,i=t?.radius??this.cameraRadius;this.cameraRadius+=(i-this.cameraRadius)*Yn(1.6,e);let r=t?Math.max(t.radius,t.rig.root.scale.y*.42):this.cameraFrame;this.cameraFrame+=(r-this.cameraFrame)*Yn(1.6,e);let s=Fx(this.cameraRadius);t&&!this.cameraFrozen&&t.phase==="stage"&&(this.cameraFocus.x+=(t.x-this.cameraFocus.x)*Yn(7,e),this.cameraFocus.z+=(t.z-this.cameraFocus.z)*Yn(7,e),this.cameraHeading+=sr(t.heading-this.cameraHeading)*Yn(3.2,e));let o=this.cameraRadius,a=Math.cos(this.cameraHeading),c=Math.sin(this.cameraHeading),l=this.cameraFrame,u=this.cameraHeading-1.15*s,d=new I(this.cameraFocus.x-Math.cos(u)*l*3.9,l*2.7,this.cameraFocus.z-Math.sin(u)*l*3.9),h=new I(this.cameraFocus.x+a*o*.6,o*.8+(l-o)*.5,this.cameraFocus.z+c*o*.6),f=Yn(5,e);this.cameraPosition.lerp(d,this.cameraPosition.lengthSq()===0?1:f),this.cameraTarget.lerp(h,this.cameraTarget.lengthSq()===0?1:f),this.shake=Math.max(0,this.shake-e);let p=this.shake*this.cameraFrame*.25;this.camera.position.set(this.cameraPosition.x+(Math.random()-.5)*p,this.cameraPosition.y+(Math.random()-.5)*p,this.cameraPosition.z),this.camera.lookAt(this.cameraTarget);let y=Math.max(.01,o*.06),g=o*260;(Math.abs(this.camera.near-y)>y*.05||Math.abs(this.camera.far-g)>g*.05)&&(this.camera.near=y,this.camera.far=g,this.camera.updateProjectionMatrix()),this.clearSightLine(o)}clearSightLine(e){let t=this.camera.position,i=this.cameraFocus.x-t.x,r=e-t.y,s=this.cameraFocus.z-t.z,o=Math.hypot(i,r,s);for(let a of this.props.values()){let c=a.x-t.x,l=a.lift+a.hop+a.size-t.y,u=a.z-t.z,d=(c*i+l*r+u*s)/o,h=!1;if(d>0&&d<o-e){let f=c-i/o*d,p=l-r/o*d,y=u-s/o*d;h=Math.hypot(f,p,y)<a.size*1.1+e*.3}a.object.visible=!h}}chunkSize(e){return .3*2**e*e3}refreshChunks(e){let t=new Set;for(let r of[e-1,e,e+1]){if(r<0)continue;let s=this.chunkSize(r),o=r===e?2:1,a=Math.floor(this.cameraFocus.x/s),c=Math.floor(this.cameraFocus.z/s);for(let l=-o;l<=o;l+=1)for(let u=-o;u<=o;u+=1)t.add(`${r}:${a+l}:${c+u}`)}for(let r of t)this.chunks.has(r)||this.populateChunk(r,e);for(let r of this.chunks)t.has(r)||this.chunks.delete(r);let i=performance.now()+i3;for(;this.spawnQueue.length>0&&performance.now()<i;){let r=this.spawnQueue.shift();!r||!this.chunks.has(r.chunk)||this.takenPropIds.has(r.id)||this.addProp(r.definition,r.x,r.z,r.size,r.chunk,r.id)}for(let r of[...this.props.values()])r.chunk!==null&&!t.has(r.chunk)?this.removeProp(r):r.size<this.cameraRadius*.035?this.removeProp(r):r.chunk===null&&Math.hypot(r.x-this.cameraFocus.x,r.z-this.cameraFocus.z)>this.cameraRadius*60&&this.removeProp(r)}populateChunk(e,t){this.chunks.add(e);let[i,r,s]=e.split(":"),o=Number(i),a=Number(r),c=Number(s),l=this.chunkSize(o),u=In(ys(`${this.seed}:${e}`));for(let d=0;d<t3;d+=1){let h=`${e}:${d}`,f=(a+u())*l,p=(c+u())*l,y=u(),g=o+(y<.3?-1:y<.78?0:y<.94?1:2),m=oo(f,p,t,this.seed).zone,S=Or(u,Ur(m,g))??Or(u,Ur(m,g-1))??Or(u,Ur(m,g+1)),E=u();if(!S||this.takenPropIds.has(h))continue;let v=.3*2**Math.max(0,g)*(.42+E*.5);this.spawnQueue.push({id:h,chunk:e,definition:S,x:f,z:p,size:v})}}addProp(e,t,i,r,s,o,a){let c=a??Bh(e,{kit:this.kit,random:this.random});c.quaternion.identity(),c.scale.setScalar(r);let l=[];c.traverse(d=>{d.userData.spin&&l.push(d)});let u={id:o,object:c,definition:e,size:r,x:t,z:i,lift:e.motion==="fly"?r*1.4:0,heading:this.random()*Math.PI*2,motion:e.motion??null,vx:0,vz:0,vy:0,hop:0,wanderIn:this.random()*3,phase:this.random()*Math.PI*2,chunk:s,spinners:l};return this.scene.add(c),this.props.set(o,u),u}removeProp(e){this.scene.remove(e.object),this.props.delete(e.id)}updateProps(e){let t=this.active;for(let i of this.props.values()){let r=0;if(i.motion==="walk"||i.motion==="drive"){if(i.wanderIn-=e,i.wanderIn<=0&&(i.wanderIn=1.5+this.random()*4,i.heading+=(this.random()-.5)*(i.motion==="drive"?.8:2.4)),r=i.size*(i.motion==="drive"?1.4:.55),t&&t.phase==="stage"&&i.size<=t.radius*Ha){let a=i.x-t.x,c=i.z-t.z;Math.hypot(a,c)<t.radius*4&&(i.heading+=sr(kr(a,c)-i.heading)*Yn(5,e),r*=2.2)}i.x+=Math.cos(i.heading)*r*e,i.z+=Math.sin(i.heading)*r*e}i.x+=i.vx*e,i.z+=i.vz*e;let s=1-Yn(3,e);i.vx*=s,i.vz*=s,(i.hop>0||i.vy>0)&&(i.vy-=i.size*18*e,i.hop=Math.max(0,i.hop+i.vy*e),i.hop===0&&(i.vy=0)),i.phase+=e*(r>0?10:2);let o=0;i.motion==="walk"&&r>0&&(o=Math.abs(Math.sin(i.phase))*i.size*.12),i.motion==="fly"&&(o=Math.sin(i.phase*.4)*i.size*.3),i.motion==="bob"&&(o=Math.max(0,Math.sin(i.phase))*i.size*.08),i.object.position.set(i.x,i.lift+i.hop+o,i.z),i.object.rotation.set(i.hop>0?i.hop/i.size:0,-i.heading,0);for(let a of i.spinners){let c=a.userData.spin;a.rotation[c.axis]+=c.speed*e}}}puff(e,t,i){let r=this.puffs.find(s=>s.life<=0);r&&(r.life=.6,r.grow=i*.28,r.mesh.visible=!0,r.mesh.position.set(e+(Math.random()-.5)*i*.6,i*.1,t+(Math.random()-.5)*i*.6))}updatePuffs(e){for(let t of this.puffs){if(t.life<=0)continue;t.life-=e;let i=1-Math.max(0,t.life)/.6;t.mesh.scale.setScalar(t.grow*(.4+i*.8)),t.mesh.material.opacity=.4*(1-i),t.mesh.position.y+=e*t.grow*.8,t.life<=0&&(t.mesh.visible=!1)}}};var ao={width:360,height:280},co={width:300,height:240};function Br(n,e){let t=qh(n.width,co.width,Math.max(co.width,e.width-32)),i=qh(n.height,co.height,Math.max(co.height,e.height-32));return{width:t,height:i,right:qh(n.right,16,Math.max(16,e.width-t-16)),bottom:qh(n.bottom,16,Math.max(16,e.height-i-16))}}function kx(n,e){let t={right:16,bottom:16,...ao};if(!e)return Br(t,n);let i=n.width-e.right-32;if(i<co.width)return Br(t,n);let r=Math.min(ao.width,i),s=Math.max(co.height,Math.round(r*ao.height/ao.width));return Br({right:16,bottom:16,width:r,height:s},n)}function CS(n){if(!n||typeof n!="object")return null;let{right:e,bottom:t,width:i,height:r}=n;return!Xh(e)||!Xh(t)?null:{right:e,bottom:t,width:Xh(i)?i:ao.width,height:Xh(r)?r:ao.height}}function Xh(n){return typeof n=="number"&&Number.isFinite(n)}function qh(n,e,t){return Math.min(Math.max(n,e),t)}var Bx=globalThis.__bbPluginRuntime;if(Bx==null||Bx.jsxRuntime==null)throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var Yh=Bx.jsxRuntime,nO="default"in Yh?Yh.default:Yh,{Fragment:Ga,jsx:he,jsxs:St}=Yh;var DS="context-katamari:position",zS="context-katamari:guide-seen",or={enter:["Roll, Prince, roll!","Ah, this thread. We remember it.","A fresh cousin arrives!"],rolling:["Work, work! Roll, roll!","Onward! Everything sticks eventually."],resting:["The thread rests. So shall We.","A little break. Very royal."],waiting:["We shall wait right here.","Off elsewhere? We keep the katamari warm."],compacted:["Lighter, and wiser.","Everything that mattered stuck.","A fresh start, with a new star."],sprinkle:["We sprinkle some snacks. Roll them up!"],full:["It is ENORMOUS. Compaction beckons."],knockedOff:["Oh! Things fell off. Careful, Prince."]},PS=[{tier:"nibble",below:.005},{tier:"bite",below:.02},{tier:"gulp",below:.05},{tier:"heavy",below:Number.POSITIVE_INFINITY}];function Hx(n){return(PS.find(e=>n<e.below)??PS[3]).tier}function v3(n,e){return n.length>e?`${n.slice(0,e-1).trimEnd()}\u2026`:n}function y3(n,e){let t=n.prompt?`"${v3(n.prompt,34)}"`:"That turn";if(n.contextTokens<0)return`${t} ended lighter, thanks to a compaction.`;let i=Li(n.contextTokens);if(n.baseline)return`A thread starts heavy: bb's system prompt and tools came first. ${t} began at ${i}.`;switch(Hx(e?n.contextTokens/e:0)){case"heavy":return`A HEAVY one! ${t} swallowed ${i}.`;case"nibble":return`A light snack: ${t} took just ${i}.`;default:return`${t} swallowed ${i}.`}}function ar(n){return n[Math.floor(Math.random()*n.length)]}function Va(){return{width:window.innerWidth,height:window.innerHeight}}function IS(){let n=document.querySelector("[data-promptbox-editor-content]")?.parentElement??null;if(!n)return null;let e=n.getBoundingClientRect().width,t=null;for(;n&&n!==document.body;){let i=n.getBoundingClientRect();if(i.width>e+64)break;t={left:i.left,right:i.right},n=n.parentElement}return t}function NS(){try{let n=CS(JSON.parse(window.localStorage.getItem(DS)??"null"));return n?Br(n,Va()):null}catch{return null}}function b3(n){try{window.localStorage.setItem(DS,JSON.stringify(n))}catch{}}function S3({radius:n}){let e=Math.round(oy(n)),t=Math.floor(e/1e3),i=Math.floor(e%1e3/10),r=e%10;return he("span",{className:"ck-size-text",children:t>0?St(Ga,{children:[t,he("small",{children:"m"}),i,he("small",{children:"cm"})]}):i===0?St(Ga,{children:[r,he("small",{children:"mm"})]}):St(Ga,{children:[i,he("small",{children:"cm"}),r,he("small",{children:"mm"})]})})}var M3=["#ff3d7f","#ffe14d","#2fd35a","#2f8cff","#ff8a1d","#c23bff"];function w3({fill:n}){let e=M3.map((i,r)=>{let s=46-r*6.5,o=18-r,a=[];for(let c=0;c<=o*8;c+=1){let l=c/(o*8)*Math.PI*2,u=1+.08*Math.cos(l*o);a.push(`${50+Math.cos(l)*s*u},${50+Math.sin(l)*s*u}`)}return he("polygon",{points:a.join(" "),fill:i},i)}),t=8+n*12;return St("svg",{className:"ck-flower",viewBox:"0 0 100 100","aria-hidden":"true",children:[e,he("circle",{cx:"50",cy:"50",r:"13",fill:"#6b3ac8"}),he("circle",{cx:"50",cy:"50",r:t,fill:"#f7f5ea",opacity:"0.92"}),he("circle",{cx:"50",cy:"50",r:t*.45,fill:"#e8453c",opacity:"0.85"})]})}function E3({percentLeft:n}){let e=n<=15,t=(1-n/100)*360;return St("div",{className:"ck-clock","data-urgent":e,"aria-label":`${n}% of context left`,children:[St("span",{className:"ck-clock-number",children:[n,he("small",{children:"%"})]}),St("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("circle",{cx:"12",cy:"12",r:"10",className:"ck-clock-face"}),he("line",{x1:"12",y1:"12",x2:"12",y2:"4",className:"ck-clock-hand",transform:`rotate(${t} 12 12)`}),e?he("text",{x:"12",y:"17",textAnchor:"middle",className:"ck-clock-bang",children:"!"}):null]})]})}function T3({mode:n,compactions:e}){return St("div",{className:"ck-prince-earth","data-mode":n,"aria-hidden":"true",children:[St("svg",{viewBox:"0 0 80 80",children:[he("defs",{children:St("radialGradient",{id:"ck-glow",cx:"50%",cy:"50%",r:"50%",children:[he("stop",{offset:"0%",stopColor:"#ffffff",stopOpacity:"0.95"}),he("stop",{offset:"100%",stopColor:"#ffffff",stopOpacity:"0"})]})}),he("circle",{className:"ck-prince-glow",cx:"40",cy:"42",r:"30",fill:"url(#ck-glow)"}),he("circle",{cx:"86",cy:"96",r:"48",fill:"#2f6fd6"}),he("path",{d:"M44 72 q10 -6 20 0 t20 0 M52 82 q10 -6 20 0 t20 0",stroke:"#bfe3ff",strokeWidth:"2.5",fill:"none"}),he("path",{d:"M60 58 q8 -4 12 4 q-6 6 -12 -4z",fill:"#3fae4a"}),St("g",{className:"ck-prince-figure",children:[he("rect",{x:"22",y:"22",width:"30",height:"13",rx:"6.5",fill:"#7cc242"}),he("rect",{x:"24",y:"22",width:"4",height:"13",fill:"#b4dd72"}),he("rect",{x:"46",y:"22",width:"4",height:"13",fill:"#b4dd72"}),he("rect",{x:"31",y:"23.5",width:"12",height:"10",fill:"#f5d94a"}),he("rect",{x:"32.5",y:"25",width:"9",height:"7",fill:"#f2dcc0"}),he("circle",{cx:"35",cy:"27.5",r:"0.9",fill:"#2b2233"}),he("circle",{cx:"39",cy:"27.5",r:"0.9",fill:"#2b2233"}),he("circle",{cx:"37",cy:"30.3",r:"1",fill:"#d8342f"}),he("path",{d:"M37 16 l2 6 h-4z",fill:"#f5d94a"}),he("circle",{cx:"37",cy:"15",r:"1.8",fill:"#e0312b"}),he("path",{d:"M30 35 h14 l3 13 h-20z",fill:"#7cc242"}),he("rect",{x:"31",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"}),he("rect",{x:"40.6",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"})]})]}),n==="resting"?he("span",{className:"ck-prince-mark",children:"z z"}):null,n==="waiting"?he("span",{className:"ck-prince-mark",children:"?"}):null,e>0?St("span",{className:"ck-stars",title:`Compacted ${e} ${e===1?"time":"times"}`,children:["\u2726",e>=99?"99+":e]}):null]})}function A3({turns:n,capacity:e}){if(n.length===0)return null;let t=[...n].reverse(),i=Math.max(1,...t.map(r=>r.baseline?0:Math.max(0,r.contextTokens)));return he("div",{className:"ck-turns",children:he("span",{className:"ck-turn-bars","aria-label":"Context each recent turn swallowed",children:t.map(r=>{let s=Math.max(0,r.contextTokens),o=r.contextTokens<0?"compacted":r.baseline?"setup":Hx(e?s/e:0);return he("span",{className:"ck-turn-bar","data-tier":o,"data-running":r.status==="running",style:{height:`${Math.min(100,Math.max(12,Math.sqrt(s/i)*100))}%`},title:`${r.prompt??"Turn"}
${r.contextTokens<0?"Compacted":`Context +${Li(s)}${r.baseline?" (system prompt and tools included)":""}`}`},r.turnId)})})})}function R3(){try{return window.localStorage.getItem(zS)==="true"}catch{return!1}}var C3=[["\u{1F3C3}","Rolling on his own","the thread is working"],["\u{1F9CD}","Standing still","idle, or waiting for you"],["\u{1F4A5}","GULP and a shake","one turn swallowed a lot"],["\u{1FA99}","Coin trail","past 50k, every turn re-reads it all"],["\u{1F388}","POP, the ball shrinks","the thread compacted"],["\u{1F4AB}","Dizzy cousin","woozier with each compaction"]];function P3({onClose:n}){let[e,t]=cn("hud"),i=St("div",{className:"ck-guide-actions",children:[he("button",{type:"button",className:"ck-guide-arrow","aria-label":"Previous page",disabled:e==="hud",onClick:()=>t("hud"),children:"\u2039"}),St("span",{className:"ck-guide-dots","aria-hidden":"true",children:[he("span",{"data-on":e==="hud"}),he("span",{"data-on":e==="events"})]}),he("button",{type:"button",className:"ck-guide-arrow","aria-label":"Next page",disabled:e==="events",onClick:()=>t("events"),children:"\u203A"}),e==="events"?he("button",{type:"button",className:"ck-guide-close",onClick:n,children:"Got it"}):null]});return he("div",{className:"ck-guide","data-page":e,role:"dialog","aria-label":"What everything means",children:e==="hud"?St(Ga,{children:[he("span",{className:"ck-guide-label","data-spot":"size",children:"\u2191 Size \xB7 tokens used / max"}),he("span",{className:"ck-guide-label","data-spot":"clock",children:"\u2191 Context left"}),he("span",{className:"ck-guide-label","data-spot":"turns",children:"Each turn's context \u2191"}),he("span",{className:"ck-guide-label","data-spot":"item",children:"\u2190 Last thing the ball picked up"}),he("span",{className:"ck-guide-label","data-spot":"stars",children:"Times compacted \u2197"}),St("div",{className:"ck-guide-card",children:[he("p",{children:"The ball grows as this thread fills its context. At the limit, bb compacts it: POP!"}),he("p",{className:"ck-guide-keys",children:"Click, then roll with the arrow keys."}),i]})]}):St("div",{className:"ck-guide-card","data-page":"events",children:[he("ul",{className:"ck-guide-events",children:C3.map(([r,s,o])=>St("li",{children:[he("span",{"aria-hidden":"true",children:r}),St("span",{children:[he("b",{children:s})," ",o]})]},s))}),i]})})}function I3({text:n}){let[e,t]=cn(0);return On(()=>{t(0);let i=window.setInterval(()=>{t(r=>r>=n.length?(window.clearInterval(i),r):r+1)},30);return()=>window.clearInterval(i)},[n]),he("span",{"aria-hidden":"true",children:n.slice(0,e)})}function LS({stage:n,muted:e,onMutedChange:t,onClose:i}){let r=Gt(null),s=Gt(null),o=Gt(null),a=Gt(new Set),[c,l]=cn(null),[u,d]=cn(null),[h,f]=cn(null),[p,y]=cn(null),[g,m]=cn(0),[S,E]=cn(!1),[v,M]=cn(!1),[w,C]=cn(()=>!R3()),_=Gt(!1),[T,P]=cn(()=>{let W=NS();return _.current=W!==null,W??kx(Va(),IS())}),D=Gt(null),k=Gt(0),V=Gt(0),z=Gt(0),B=Gt(0),Z=Vr(W=>{window.clearTimeout(k.current);let Q=Math.max(3.8,W.length*.03+2.2);d({text:W,key:Date.now(),seconds:Q}),z.current=Date.now()+Q*1e3,k.current=window.setTimeout(()=>d(null),Q*1e3)},[]),q=Vr(W=>{let Q=z.current-Date.now();if(Q<=0){Z(W);return}window.clearTimeout(B.current),B.current=window.setTimeout(()=>q(W),Q+300)},[Z]),oe=Vr(W=>{switch(W.kind){case"enter":Z(ar(or.enter));break;case"pickup":q(W.fill>=.95?ar(or.full):`Splendid! ${Math.round(W.fill*100)}% full.`);break;case"compacted":Z(`POP! Compaction #${W.compactions}. ${ar(or.compacted)}`);break;case"sprinkle":q(ar(or.sprinkle));break;case"rolledUp":y({name:W.name,image:W.image,key:Date.now()});break;case"lookOut":window.clearTimeout(V.current),m(Date.now()),V.current=window.setTimeout(()=>m(0),1800);break;case"knockedOff":Z(ar(or.knockedOff));break;case"coins":q(`${Li(W.usedTokens)} tokens! Every turn re-reads all of it. Coins, coins, coins!`);break}},[Z,q]),Y=Gt(oe);Y.current=oe;let te={threadId:n.threadId,mode:n.mode,fill:n.fill,compactions:n.compactions,compactedSeq:n.compactedSeq,ready:n.ready,usedTokens:n.usedTokens},ie=Gt(te);ie.current=te,On(()=>{let W=r.current;if(!W)return;let Q=new Dl(e);Q.unlock(),o.current=Q;let Pe=null,Ne=null,Ve=0,Ze=0,N=()=>{let et=new Zh(W,Q,O=>l(O),O=>Y.current(O));Pe=et,s.current=et;let A=()=>{let O=W.getBoundingClientRect();et.resize(O.width,O.height,window.devicePixelRatio||1)};A(),Ne=new ResizeObserver(A),Ne.observe(W),et.setStage(ie.current),et.start(),M(!0);let x=()=>{et.setDrive(ay(a.current)),Ze=window.requestAnimationFrame(x)};Ze=window.requestAnimationFrame(x)},mt=window.requestAnimationFrame(()=>{Ve=window.setTimeout(N,0)});return()=>{window.cancelAnimationFrame(mt),window.cancelAnimationFrame(Ze),window.clearTimeout(Ve),Ne?.disconnect(),Pe?.dispose(),Q.dispose(),s.current=null,o.current=null,window.clearTimeout(k.current),window.clearTimeout(B.current),window.clearTimeout(V.current)}},[]),On(()=>{s.current?.setStage(ie.current)},[n.threadId,n.mode,n.fill,n.compactions,n.compactedSeq,n.ready,n.usedTokens]);let Le=Gt({threadId:null,usedTokens:null,ready:!1});On(()=>{let W=Le.current;if(Le.current={threadId:n.threadId,usedTokens:n.usedTokens,ready:n.ready},W.threadId!==n.threadId)return;let Q=W.usedTokens===null&&W.ready&&(n.compactions??0)===0,Pe=Q?0:W.usedTokens;if(Pe===null||n.usedTokens===null||n.capacityTokens===null||n.usedTokens<=Pe)return;let Ne=n.usedTokens-Pe,Ve=Ne/n.capacityTokens,Ze=Q?"setup":Hx(Ve);s.current?.gulp(Ve),f({text:Q?`+${Li(Ne)} setup`:`${Ze==="heavy"?"GULP! ":""}+${Li(Ne)}`,tier:Ze,key:Date.now()})},[n.threadId,n.usedTokens,n.capacityTokens,n.ready,n.compactions]);let Ce=Gt(new Map),ct=n.turns.find(W=>W.status!=="running")??null;On(()=>{if(n.threadId===null||!n.ready)return;let W=Ce.current,Q=W.get(n.threadId);W.set(n.threadId,ct?.turnId??""),!(Q===void 0||ct===null||Q===ct.turnId)&&Z(y3(ct,n.capacityTokens))},[Z,n.threadId,n.ready,ct?.turnId]);let it=Gt(n.mode);On(()=>{if(it.current===n.mode)return;let W=it.current==="empty";it.current=n.mode,!W&&(n.mode==="rolling"&&Z(ar(or.rolling)),n.mode==="resting"&&Z(ar(or.resting)),n.mode==="waiting"&&Z(ar(or.waiting)))},[Z,n.mode]),On(()=>{o.current?.setMuted(e)},[e]),On(()=>{let W=()=>P(Pe=>_.current?NS()??Br(Pe,Va()):kx(Va(),IS())),Q=window.requestAnimationFrame(W);return window.addEventListener("resize",W),()=>{window.cancelAnimationFrame(Q),window.removeEventListener("resize",W)}},[]);let ht=W=>{if(W.key==="Escape"){W.currentTarget.blur();return}!og.has(W.key)||W.metaKey||W.ctrlKey||W.altKey||(W.preventDefault(),W.stopPropagation(),a.current.add(W.key))},j=W=>{og.has(W.key)&&(W.preventDefault(),a.current.delete(W.key))},ne=W=>{if(C(W),!W)try{window.localStorage.setItem(zS,"true")}catch{}},ye=()=>{a.current.clear(),s.current?.setDrive(Nl),E(!1)},We=W=>Q=>{Q.button===0&&(Q.preventDefault(),Q.currentTarget.setPointerCapture(Q.pointerId),D.current={kind:W,pointerId:Q.pointerId,startX:Q.clientX,startY:Q.clientY,origin:T})},Te=W=>{let Q=D.current;if(!Q||Q.pointerId!==W.pointerId)return;let Pe=W.clientX-Q.startX,Ne=W.clientY-Q.startY;P(Br(Q.kind==="move"?{...Q.origin,right:Q.origin.right-Pe,bottom:Q.origin.bottom-Ne}:{...Q.origin,width:Q.origin.width-Pe,height:Q.origin.height-Ne},Va()))},$e=W=>{let Q=D.current;!Q||Q.pointerId!==W.pointerId||(D.current=null,_.current=!0,P(Pe=>(b3(Pe),Pe)))},dt=c?.radius??.3,re=c?.targetRadius??dt,le=Math.max(0,Math.min(99,Math.round((1-n.fill)*100))),ue=n.usedTokens!==null&&n.capacityTokens!==null?`${Li(n.usedTokens)} / ${Li(n.capacityTokens)}`:"\u2014";return St("div",{className:"ck-window",style:{right:T.right,bottom:T.bottom,width:T.width,height:T.height},"data-mode":n.mode,"data-focused":S,"data-ready":v,role:"region","aria-label":"Context Katamari",children:[St("div",{className:"ck-stage",tabIndex:0,"aria-label":"Katamari world. Click, then roll with the arrow keys. Escape to let go.",onFocus:()=>{E(!0),o.current?.unlock()},onBlur:ye,onPointerDown:()=>o.current?.unlock(),onKeyDown:ht,onKeyUp:j,children:[he("canvas",{ref:r,className:"ck-canvas"}),St("div",{className:"ck-gauge","aria-label":`Katamari ${Math.round(zi(re)*100)}% of context`,children:[he(w3,{fill:zi(dt)}),he(S3,{radius:dt}),St("span",{className:"ck-goal",children:[St("svg",{viewBox:"0 0 40 16","aria-hidden":"true",children:[he("path",{d:"M2 12 Q 20 2 36 8"}),he("path",{d:"M31 4 l6 4 -7 2"})]}),ue]})]}),he(E3,{percentLeft:le}),he(A3,{turns:n.turns,capacity:n.capacityTokens}),h?he("div",{className:"ck-gulp","data-tier":h.tier,"aria-hidden":"true",onAnimationEnd:()=>f(null),children:h.text},h.key):null,he("div",{className:"ck-title",title:n.title??void 0,children:n.title??"Open a thread"}),u?St("div",{className:"ck-king",role:"status","aria-label":u.text,style:{animationDuration:`${u.seconds}s`},children:[he("span",{className:"ck-king-face","aria-hidden":"true",children:"\u265B"}),he("span",{className:"ck-king-caption",children:he(I3,{text:u.text})})]},u.key):null,St("div",{className:"ck-item","data-look-out":g!==0,children:[g!==0?he("span",{className:"ck-look-out",children:"LOOK OUT!"}):null,he("div",{className:"ck-item-disc",children:p?.image?he("img",{src:p.image,alt:""},p.key):null}),p?he("span",{className:"ck-item-name",children:p.name},p.key):null]}),he(T3,{mode:n.mode,compactions:c?.compactions??n.compactions??0}),w?he(P3,{onClose:()=>ne(!1)}):null,he("div",{className:"ck-hint","aria-hidden":"true",children:S?"\u2191\u2193 roll \xB7 \u2190\u2192 steer":"Click, then use the arrow keys"})]}),he("div",{className:"ck-grip",role:"presentation",title:"Drag to move",onPointerDown:We("move"),onPointerMove:Te,onPointerUp:$e,onPointerCancel:$e,children:he("span",{})}),he("div",{className:"ck-resize",role:"presentation",title:"Drag to resize",onPointerDown:We("resize"),onPointerMove:Te,onPointerUp:$e,onPointerCancel:$e}),St("div",{className:"ck-controls",children:[he("button",{type:"button",className:"ck-button","aria-label":w?"Hide the guide":"What everything means","aria-pressed":w,title:w?"Hide the guide":"What everything means",onClick:()=>ne(!w),children:he("span",{className:"ck-button-glyph","aria-hidden":"true",children:"?"})}),he("button",{type:"button",className:"ck-button","aria-label":e?"Unmute":"Mute","aria-pressed":e,title:e?"Unmute":"Mute",onClick:()=>t(!e),children:e?St("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),he("path",{d:"M17 9l4 6M21 9l-4 6"})]}):St("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[he("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),he("path",{d:"M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"})]})}),he("button",{type:"button",className:"ck-button","aria-label":"Close Context Katamari",title:"Close",onClick:i,children:he("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:he("path",{d:"M6 6l12 12M18 6L6 18"})})})]})]})}var N3="context-katamari:open",D3="context-katamari:muted",z3=4e3,L3=3e4,U3=[];function FS(n,e){let t=new Set,i=e;try{let r=window.localStorage.getItem(n);r!==null&&(i=r==="true")}catch{}return{get:()=>i,set(r){i=r;try{window.localStorage.setItem(n,String(r))}catch{}for(let s of t)s()},subscribe(r){return t.add(r),()=>t.delete(r)}}}var Jh=FS(N3,!1),US=FS(D3,!1);function OS(n){return Kx(n.subscribe,n.get,n.get)}function O3(n,e,t){let i=i_(),[r,s]=cn(new Map),o=Gt(new Map),a=Vr(c=>{let l=o.current.get(c)??aS();o.current.set(c,l);let u=l.begin();i.call("readThreadContext",{threadId:c}).then(d=>{l.accept(u)&&s(h=>{let f=h.get(c),p=d.compactions===null?{...d,compactions:f?.compactions??null}:d;if(f!==void 0&&f?.usage?.usedTokens===p.usage?.usedTokens&&f?.usage?.capacityTokens===p.usage?.capacityTokens&&f?.compactions===p.compactions&&JSON.stringify(f?.turns??[])===JSON.stringify(p.turns??[]))return h;let y=new Map(h);return y.set(c,p),y})}).catch(d=>{console.warn("Context Katamari could not read thread context",d)})},[i]);return On(()=>{if(n===null)return;a(n);let c=window.setInterval(()=>a(n),e?z3:L3);return()=>window.clearInterval(c)},[a,n,e,t]),n===null?null:r.get(n)??null}function F3(){let n=OS(Jh),e=OS(US);return n?he(k3,{muted:e,onMutedChange:US.set,onClose:()=>Jh.set(!1)}):null}function k3({muted:n,onMutedChange:e,onClose:t}){let{threadId:i}=t_(),r=e_(),s=ed(()=>i===null?null:r.threads.find(m=>m.id===i)??null,[i,r.threads]),o=s?sS(s):!1,a=Gt(Dx),c=ed(()=>{let m=rS(a.current,{threadId:i,working:o});return a.current=m.state,m.state},[i,o]),l=c.threadId===null?null:r.threads.find(m=>m.id===c.threadId)??null,u=O3(c.threadId,c.mode==="rolling",l?.updatedAt??null),[d,h]=cn(new Map);n_(iy,m=>{let S=ry.safeParse(m);S.success&&h(E=>(E.get(S.data.threadId)?.seq??-1)>=S.data.seq?E:new Map(E).set(S.data.threadId,S.data))});let f=c.threadId===null?null:d.get(c.threadId)??null,p=u?.compactions??null,y=u?.usage??null,g={threadId:c.threadId,mode:c.mode,fill:y?sy(y.usedTokens,y.capacityTokens):0,compactions:f===null?p:Math.max(p??0,f.compactions),compactedSeq:f?.seq??null,ready:u!==null,title:l?l.title?.trim()||l.titleFallback?.trim()||"Untitled thread":c.threadId===null?null:"Thread",usedTokens:y?.usedTokens??null,capacityTokens:y?.capacityTokens??null,turns:u?.turns??U3};return he(LS,{stage:g,muted:n,onMutedChange:e,onClose:t})}var bO=Qx(n=>{n.slots.sidebarFooterAction({id:"toggle",title:"Context Katamari",icon:"Circle",run:()=>Jh.set(!Jh.get())}),n.slots.experimental_appOverlay({id:"window",component:F3})});export{bO as default};
