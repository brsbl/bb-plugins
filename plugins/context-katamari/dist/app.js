var QM=Object.defineProperty;var vi=(n,e)=>{for(var t in e)QM(n,t,{get:e[t],enumerable:!0})};var Md=globalThis.__bbPluginRuntime;if(Md==null||Md.react==null)throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var lc=Md.react,nD="default"in lc?lc.default:lc,{Activity:iD,Children:rD,Component:sD,Fragment:oD,Profiler:aD,PureComponent:cD,StrictMode:lD,Suspense:uD,act:hD,cache:dD,cacheSignal:fD,captureOwnerStack:pD,cloneElement:mD,createContext:gD,createElement:xD,createRef:_D,forwardRef:vD,isValidElement:yD,lazy:bD,memo:yi,startTransition:SD,unstable_useCacheRefresh:MD,use:wD,useActionState:ED,useCallback:Vi,useContext:TD,useDebugValue:AD,useDeferredValue:RD,useEffect:hn,useEffectEvent:CD,useId:PD,useImperativeHandle:ID,useInsertionEffect:DD,useLayoutEffect:ND,useMemo:wd,useOptimistic:LD,useReducer:zD,useRef:Rt,useState:Xt,useSyncExternalStore:N_,useTransition:UD,version:OD}=lc;var Ed=globalThis.__bbPluginRuntime;if(Ed==null||Ed.pluginSdkApp==null)throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var uc=Ed.pluginSdkApp,kD="default"in uc?uc.default:uc,{Markdown:BD,ThreadChat:HD,ThreadTitle:GD,UrlLink:VD,definePluginApp:L_,experimental_BranchPicker:$D,experimental_Diff:WD,experimental_FileLink:ZD,experimental_Icon:XD,experimental_NewThreadComposer:qD,experimental_PermissionModePicker:YD,experimental_ProviderIcon:JD,experimental_ProviderModelPicker:jD,experimental_SourceCode:KD,experimental_useAppPanel:QD,experimental_useBranches:eN,experimental_useCheckoutState:tN,experimental_useCodeTheme:nN,experimental_useFixedTabTarget:iN,experimental_useProviders:rN,experimental_useSidebarThreadActions:sN,experimental_useSidebarThreadPullRequest:oN,experimental_useSidebarThreadSplit:aN,experimental_useSidebarThreads:z_,useBbContext:U_,useBbNavigate:cN,useComposer:lN,useComposerView:uN,useEnvironmentProviders:hN,useRealtime:O_,useRealtimeConnectionState:dN,useRpc:F_,useSdk:fN,useSettings:pN,useSidebarSplitLayout:mN,useSidebarThreadDraft:gN,useSidebarThreadDraftIds:xN,useSidebarThreadRowStatus:_N,useSidebarThreadRowStatuses:vN,useSidebarThreadShortcut:yN}=uc;var kt={};vi(kt,{$brand:()=>Ad,$input:()=>Jp,$output:()=>Yp,NEVER:()=>Td,TimePrecision:()=>em,ZodAny:()=>V0,ZodArray:()=>X0,ZodBase64:()=>Ol,ZodBase64URL:()=>Fl,ZodBigInt:()=>Ns,ZodBigIntFormat:()=>Hl,ZodBoolean:()=>Ds,ZodCIDRv4:()=>zl,ZodCIDRv6:()=>Ul,ZodCUID:()=>Rl,ZodCUID2:()=>Cl,ZodCatch:()=>mg,ZodCodec:()=>Ko,ZodCustom:()=>Qo,ZodCustomStringFormat:()=>Ps,ZodDate:()=>Xo,ZodDefault:()=>lg,ZodDiscriminatedUnion:()=>Y0,ZodE164:()=>kl,ZodEmail:()=>El,ZodEmoji:()=>Tl,ZodEnum:()=>Rs,ZodError:()=>zE,ZodExactOptional:()=>og,ZodFile:()=>rg,ZodFirstPartyTypeKind:()=>Rg,ZodFunction:()=>Eg,ZodGUID:()=>Go,ZodIPv4:()=>Nl,ZodIPv6:()=>Ll,ZodISODate:()=>vl,ZodISODateTime:()=>_l,ZodISODuration:()=>bl,ZodISOTime:()=>yl,ZodIntersection:()=>J0,ZodIssueCode:()=>OE,ZodJWT:()=>Bl,ZodKSUID:()=>Dl,ZodLazy:()=>Sg,ZodLiteral:()=>ig,ZodMAC:()=>U0,ZodMap:()=>tg,ZodNaN:()=>xg,ZodNanoID:()=>Al,ZodNever:()=>W0,ZodNonOptional:()=>Xl,ZodNull:()=>H0,ZodNullable:()=>cg,ZodNumber:()=>Is,ZodNumberFormat:()=>Nr,ZodObject:()=>Yo,ZodOptional:()=>Zl,ZodPipe:()=>jo,ZodPrefault:()=>hg,ZodPreprocess:()=>_g,ZodPromise:()=>wg,ZodReadonly:()=>vg,ZodRealError:()=>bn,ZodRecord:()=>As,ZodSet:()=>ng,ZodString:()=>Cs,ZodStringFormat:()=>Tt,ZodSuccess:()=>pg,ZodSymbol:()=>k0,ZodTemplateLiteral:()=>bg,ZodTransform:()=>sg,ZodTuple:()=>K0,ZodType:()=>tt,ZodULID:()=>Pl,ZodURL:()=>Zo,ZodUUID:()=>ai,ZodUndefined:()=>B0,ZodUnion:()=>Jo,ZodUnknown:()=>$0,ZodVoid:()=>Z0,ZodXID:()=>Il,ZodXor:()=>q0,_ZodString:()=>wl,_default:()=>ug,_function:()=>Ay,any:()=>ry,array:()=>qo,base64:()=>Hv,base64url:()=>Gv,bigint:()=>Qv,boolean:()=>F0,catch:()=>gg,check:()=>Ry,cidrv4:()=>kv,cidrv6:()=>Bv,clone:()=>dn,codec:()=>My,coerce:()=>Cg,config:()=>Ft,core:()=>Mi,cuid:()=>Iv,cuid2:()=>Dv,custom:()=>Cy,date:()=>oy,decode:()=>C0,decodeAsync:()=>I0,describe:()=>Py,discriminatedUnion:()=>dy,e164:()=>Vv,email:()=>bv,emoji:()=>Cv,encode:()=>R0,encodeAsync:()=>P0,endsWith:()=>xs,enum:()=>$l,exactOptional:()=>ag,file:()=>vy,flattenError:()=>Co,float32:()=>Yv,float64:()=>Jv,formatError:()=>Po,fromJSONSchema:()=>Oy,function:()=>Ay,getErrorMap:()=>kE,globalRegistry:()=>Jt,gt:()=>si,gte:()=>pn,guid:()=>Sv,hash:()=>qv,hex:()=>Xv,hostname:()=>Zv,httpUrl:()=>Rv,includes:()=>ms,instanceof:()=>Dy,int:()=>Sl,int32:()=>jv,int64:()=>ey,intersection:()=>j0,invertCodec:()=>wy,ipv4:()=>Uv,ipv6:()=>Fv,iso:()=>Ts,json:()=>Ly,jwt:()=>$v,keyof:()=>ay,ksuid:()=>zv,lazy:()=>Mg,length:()=>Ir,literal:()=>_y,locales:()=>Oo,looseObject:()=>uy,looseRecord:()=>py,lowercase:()=>fs,lt:()=>ri,lte:()=>Pn,mac:()=>Ov,map:()=>my,maxLength:()=>Pr,maxSize:()=>Ji,meta:()=>Iy,mime:()=>_s,minLength:()=>Si,minSize:()=>oi,multipleOf:()=>Yi,nan:()=>Sy,nanoid:()=>Pv,nativeEnum:()=>xy,negative:()=>cl,never:()=>Gl,nonnegative:()=>ul,nonoptional:()=>fg,nonpositive:()=>ll,normalize:()=>vs,null:()=>G0,nullable:()=>$o,nullish:()=>yy,number:()=>O0,object:()=>cy,optional:()=>Vo,overwrite:()=>Xn,parse:()=>w0,parseAsync:()=>E0,partialRecord:()=>fy,pipe:()=>Ml,positive:()=>al,prefault:()=>dg,preprocess:()=>zy,prettifyError:()=>Hd,promise:()=>Ty,property:()=>hl,readonly:()=>yg,record:()=>eg,refine:()=>Tg,regex:()=>ds,regexes:()=>Cn,registry:()=>Bc,safeDecode:()=>N0,safeDecodeAsync:()=>z0,safeEncode:()=>D0,safeEncodeAsync:()=>L0,safeParse:()=>T0,safeParseAsync:()=>A0,set:()=>gy,setErrorMap:()=>FE,size:()=>Cr,slugify:()=>Ms,startsWith:()=>gs,strictObject:()=>ly,string:()=>Ho,stringFormat:()=>Wv,stringbool:()=>Ny,success:()=>by,superRefine:()=>Ag,symbol:()=>ny,templateLiteral:()=>Ey,toJSONSchema:()=>ml,toLowerCase:()=>bs,toUpperCase:()=>Ss,transform:()=>Wl,treeifyError:()=>Bd,trim:()=>ys,tuple:()=>Q0,uint32:()=>Kv,uint64:()=>ty,ulid:()=>Nv,undefined:()=>iy,union:()=>Vl,unknown:()=>Dr,uppercase:()=>ps,url:()=>Av,util:()=>Ye,uuid:()=>Mv,uuidv4:()=>wv,uuidv6:()=>Ev,uuidv7:()=>Tv,void:()=>sy,xid:()=>Lv,xor:()=>hy});var Mi={};vi(Mi,{$ZodAny:()=>xp,$ZodArray:()=>Sp,$ZodAsyncError:()=>Zn,$ZodBase64:()=>ap,$ZodBase64URL:()=>cp,$ZodBigInt:()=>Lc,$ZodBigIntFormat:()=>fp,$ZodBoolean:()=>Lo,$ZodCIDRv4:()=>rp,$ZodCIDRv6:()=>sp,$ZodCUID:()=>Zf,$ZodCUID2:()=>Xf,$ZodCatch:()=>Bp,$ZodCheck:()=>Ct,$ZodCheckBigIntFormat:()=>Sf,$ZodCheckEndsWith:()=>Lf,$ZodCheckGreaterThan:()=>Rc,$ZodCheckIncludes:()=>Df,$ZodCheckLengthEquals:()=>Rf,$ZodCheckLessThan:()=>Ac,$ZodCheckLowerCase:()=>Pf,$ZodCheckMaxLength:()=>Tf,$ZodCheckMaxSize:()=>Mf,$ZodCheckMimeType:()=>Uf,$ZodCheckMinLength:()=>Af,$ZodCheckMinSize:()=>wf,$ZodCheckMultipleOf:()=>yf,$ZodCheckNumberFormat:()=>bf,$ZodCheckOverwrite:()=>Of,$ZodCheckProperty:()=>zf,$ZodCheckRegex:()=>Cf,$ZodCheckSizeEquals:()=>Ef,$ZodCheckStartsWith:()=>Nf,$ZodCheckStringFormat:()=>hs,$ZodCheckUpperCase:()=>If,$ZodCodec:()=>Uo,$ZodCustom:()=>qp,$ZodCustomStringFormat:()=>hp,$ZodDate:()=>bp,$ZodDefault:()=>Up,$ZodDiscriminatedUnion:()=>Ep,$ZodE164:()=>lp,$ZodEmail:()=>Gf,$ZodEmoji:()=>$f,$ZodEncodeError:()=>$i,$ZodEnum:()=>Pp,$ZodError:()=>Ro,$ZodExactOptional:()=>Lp,$ZodFile:()=>Dp,$ZodFunction:()=>Wp,$ZodGUID:()=>Bf,$ZodIPv4:()=>tp,$ZodIPv6:()=>np,$ZodISODate:()=>Kf,$ZodISODateTime:()=>jf,$ZodISODuration:()=>ep,$ZodISOTime:()=>Qf,$ZodIntersection:()=>Tp,$ZodJWT:()=>up,$ZodKSUID:()=>Jf,$ZodLazy:()=>Xp,$ZodLiteral:()=>Ip,$ZodMAC:()=>ip,$ZodMap:()=>Rp,$ZodNaN:()=>Hp,$ZodNanoID:()=>Wf,$ZodNever:()=>vp,$ZodNonOptional:()=>Fp,$ZodNull:()=>gp,$ZodNullable:()=>zp,$ZodNumber:()=>Nc,$ZodNumberFormat:()=>dp,$ZodObject:()=>mv,$ZodObjectJIT:()=>Mp,$ZodOptional:()=>Uc,$ZodPipe:()=>Oc,$ZodPrefault:()=>Op,$ZodPreprocess:()=>Gp,$ZodPromise:()=>Zp,$ZodReadonly:()=>Vp,$ZodRealError:()=>yn,$ZodRecord:()=>Ap,$ZodRegistry:()=>kc,$ZodSet:()=>Cp,$ZodString:()=>Rr,$ZodStringFormat:()=>Et,$ZodSuccess:()=>kp,$ZodSymbol:()=>pp,$ZodTemplateLiteral:()=>$p,$ZodTransform:()=>Np,$ZodTuple:()=>zc,$ZodType:()=>Ke,$ZodULID:()=>qf,$ZodURL:()=>Vf,$ZodUUID:()=>Hf,$ZodUndefined:()=>mp,$ZodUnion:()=>zo,$ZodUnknown:()=>_p,$ZodVoid:()=>yp,$ZodXID:()=>Yf,$ZodXor:()=>wp,$brand:()=>Ad,$constructor:()=>O,$input:()=>Jp,$output:()=>Yp,Doc:()=>No,JSONSchema:()=>_v,JSONSchemaGenerator:()=>gl,NEVER:()=>Td,TimePrecision:()=>em,_any:()=>bm,_array:()=>Rm,_base64:()=>il,_base64url:()=>rl,_bigint:()=>pm,_boolean:()=>dm,_catch:()=>AE,_check:()=>xv,_cidrv4:()=>tl,_cidrv6:()=>nl,_coercedBigint:()=>mm,_coercedBoolean:()=>fm,_coercedDate:()=>Tm,_coercedNumber:()=>om,_coercedString:()=>Kp,_cuid:()=>qc,_cuid2:()=>Yc,_custom:()=>Pm,_date:()=>Em,_decode:()=>_c,_decodeAsync:()=>yc,_default:()=>wE,_discriminatedUnion:()=>dE,_e164:()=>sl,_email:()=>Hc,_emoji:()=>Zc,_encode:()=>xc,_encodeAsync:()=>vc,_endsWith:()=>xs,_enum:()=>_E,_file:()=>Cm,_float32:()=>cm,_float64:()=>lm,_gt:()=>si,_gte:()=>pn,_guid:()=>Fo,_includes:()=>ms,_int:()=>am,_int32:()=>um,_int64:()=>gm,_intersection:()=>fE,_ipv4:()=>Qc,_ipv6:()=>el,_isoDate:()=>nm,_isoDateTime:()=>tm,_isoDuration:()=>rm,_isoTime:()=>im,_jwt:()=>ol,_ksuid:()=>Kc,_lazy:()=>IE,_length:()=>Ir,_literal:()=>yE,_lowercase:()=>fs,_lt:()=>ri,_lte:()=>Pn,_mac:()=>Qp,_map:()=>gE,_max:()=>Pn,_maxLength:()=>Pr,_maxSize:()=>Ji,_mime:()=>_s,_min:()=>pn,_minLength:()=>Si,_minSize:()=>oi,_multipleOf:()=>Yi,_nan:()=>Am,_nanoid:()=>Xc,_nativeEnum:()=>vE,_negative:()=>cl,_never:()=>Mm,_nonnegative:()=>ul,_nonoptional:()=>EE,_nonpositive:()=>ll,_normalize:()=>vs,_null:()=>ym,_nullable:()=>ME,_number:()=>sm,_optional:()=>SE,_overwrite:()=>Xn,_parse:()=>as,_parseAsync:()=>cs,_pipe:()=>RE,_positive:()=>al,_promise:()=>DE,_property:()=>hl,_readonly:()=>CE,_record:()=>mE,_refine:()=>Im,_regex:()=>ds,_safeDecode:()=>Sc,_safeDecodeAsync:()=>wc,_safeEncode:()=>bc,_safeEncodeAsync:()=>Mc,_safeParse:()=>ls,_safeParseAsync:()=>us,_set:()=>xE,_size:()=>Cr,_slugify:()=>Ms,_startsWith:()=>gs,_string:()=>jp,_stringFormat:()=>ws,_stringbool:()=>zm,_success:()=>TE,_superRefine:()=>Dm,_symbol:()=>_m,_templateLiteral:()=>PE,_toLowerCase:()=>bs,_toUpperCase:()=>Ss,_transform:()=>bE,_trim:()=>ys,_tuple:()=>pE,_uint32:()=>hm,_uint64:()=>xm,_ulid:()=>Jc,_undefined:()=>vm,_union:()=>uE,_unknown:()=>Sm,_uppercase:()=>ps,_url:()=>ko,_uuid:()=>Gc,_uuidv4:()=>Vc,_uuidv6:()=>$c,_uuidv7:()=>Wc,_void:()=>wm,_xid:()=>jc,_xor:()=>hE,clone:()=>dn,config:()=>Ft,createStandardJSONSchemaMethod:()=>Es,createToJSONSchemaMethod:()=>Um,decode:()=>Aw,decodeAsync:()=>Cw,describe:()=>Nm,encode:()=>Tw,encodeAsync:()=>Rw,extractDefs:()=>Ki,finalize:()=>Qi,flattenError:()=>Co,formatError:()=>Po,globalConfig:()=>Er,globalRegistry:()=>Jt,initializeContext:()=>ji,isValidBase64:()=>op,isValidBase64URL:()=>hv,isValidJWT:()=>dv,locales:()=>Oo,meta:()=>Lm,parse:()=>mc,parseAsync:()=>gc,prettifyError:()=>Hd,process:()=>bt,regexes:()=>Cn,registry:()=>Bc,safeDecode:()=>Iw,safeDecodeAsync:()=>Nw,safeEncode:()=>Pw,safeEncodeAsync:()=>Dw,safeParse:()=>Gd,safeParseAsync:()=>Vd,toDotPath:()=>$_,toJSONSchema:()=>ml,treeifyError:()=>Bd,util:()=>Ye,version:()=>Ff});var k_,Td=Object.freeze({status:"aborted"});function O(n,e,t){function i(a,c){if(a._zod||Object.defineProperty(a,"_zod",{value:{def:c,constr:o,traits:new Set},enumerable:!1}),a._zod.traits.has(n))return;a._zod.traits.add(n),e(a,c);let l=o.prototype,u=Object.keys(l);for(let h=0;h<u.length;h++){let d=u[h];d in a||(a[d]=l[d].bind(a))}}let r=t?.Parent??Object;class s extends r{}Object.defineProperty(s,"name",{value:n});function o(a){var c;let l=t?.Parent?new s:this;i(l,a),(c=l._zod).deferred??(c.deferred=[]);for(let u of l._zod.deferred)u();return l}return Object.defineProperty(o,"init",{value:i}),Object.defineProperty(o,Symbol.hasInstance,{value:a=>t?.Parent&&a instanceof t.Parent?!0:a?._zod?.traits?.has(n)}),Object.defineProperty(o,"name",{value:n}),o}var Ad=Symbol("zod_brand"),Zn=class extends Error{constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}},$i=class extends Error{constructor(e){super(`Encountered unidirectional transform during encode: ${e}`),this.name="ZodEncodeError"}};(k_=globalThis).__zod_globalConfig??(k_.__zod_globalConfig={});var Er=globalThis.__zod_globalConfig;function Ft(n){return n&&Object.assign(Er,n),Er}var Ye={};vi(Ye,{BIGINT_FORMAT_RANGES:()=>Od,Class:()=>Cd,NUMBER_FORMAT_RANGES:()=>Ud,aborted:()=>qi,allowsEval:()=>Dd,assert:()=>rw,assertEqual:()=>ew,assertIs:()=>nw,assertNever:()=>iw,assertNotEqual:()=>tw,assignProp:()=>Zi,base64ToUint8Array:()=>H_,base64urlToUint8Array:()=>bw,cached:()=>ss,captureStackTrace:()=>fc,cleanEnum:()=>yw,cleanRegex:()=>wo,clone:()=>dn,cloneDef:()=>ow,createTransparentProxy:()=>dw,defineLazy:()=>ot,esc:()=>dc,escapeRegex:()=>Fn,explicitlyAborted:()=>Fd,extend:()=>mw,finalizeIssue:()=>fn,floatSafeRemainder:()=>Pd,getElementAtPath:()=>aw,getEnumValues:()=>Mo,getLengthableOrigin:()=>Ao,getParsedType:()=>hw,getSizableOrigin:()=>To,hexToUint8Array:()=>Mw,isObject:()=>Tr,isPlainObject:()=>Xi,issue:()=>os,joinValues:()=>hc,jsonStringifyReplacer:()=>rs,merge:()=>xw,mergeDefs:()=>bi,normalizeParams:()=>de,nullish:()=>Wi,numKeys:()=>uw,objectClone:()=>sw,omit:()=>pw,optionalKeys:()=>zd,parsedType:()=>kd,partial:()=>_w,pick:()=>fw,prefixIssues:()=>vn,primitiveTypes:()=>Ld,promiseAllObject:()=>cw,propertyKeyTypes:()=>Eo,randomString:()=>lw,required:()=>vw,safeExtend:()=>gw,shallowClone:()=>Nd,slugify:()=>Id,stringifyPrimitive:()=>pc,uint8ArrayToBase64:()=>G_,uint8ArrayToBase64url:()=>Sw,uint8ArrayToHex:()=>ww,unwrapMessage:()=>So});function ew(n){return n}function tw(n){return n}function nw(n){}function iw(n){throw new Error("Unexpected value in exhaustive check")}function rw(n){}function Mo(n){let e=Object.values(n).filter(i=>typeof i=="number");return Object.entries(n).filter(([i,r])=>e.indexOf(+i)===-1).map(([i,r])=>r)}function hc(n,e="|"){return n.map(t=>pc(t)).join(e)}function rs(n,e){return typeof e=="bigint"?e.toString():e}function ss(n){return{get value(){{let t=n();return Object.defineProperty(this,"value",{value:t}),t}throw new Error("cached value already set")}}}function Wi(n){return n==null}function wo(n){let e=n.startsWith("^")?1:0,t=n.endsWith("$")?n.length-1:n.length;return n.slice(e,t)}function Pd(n,e){let t=n/e,i=Math.round(t),r=Number.EPSILON*Math.max(Math.abs(t),1);return Math.abs(t-i)<r?0:t-i}var B_=Symbol("evaluating");function ot(n,e,t){let i;Object.defineProperty(n,e,{get(){if(i!==B_)return i===void 0&&(i=B_,i=t()),i},set(r){Object.defineProperty(n,e,{value:r})},configurable:!0})}function sw(n){return Object.create(Object.getPrototypeOf(n),Object.getOwnPropertyDescriptors(n))}function Zi(n,e,t){Object.defineProperty(n,e,{value:t,writable:!0,enumerable:!0,configurable:!0})}function bi(...n){let e={};for(let t of n){let i=Object.getOwnPropertyDescriptors(t);Object.assign(e,i)}return Object.defineProperties({},e)}function ow(n){return bi(n._zod.def)}function aw(n,e){return e?e.reduce((t,i)=>t?.[i],n):n}function cw(n){let e=Object.keys(n),t=e.map(i=>n[i]);return Promise.all(t).then(i=>{let r={};for(let s=0;s<e.length;s++)r[e[s]]=i[s];return r})}function lw(n=10){let e="abcdefghijklmnopqrstuvwxyz",t="";for(let i=0;i<n;i++)t+=e[Math.floor(Math.random()*e.length)];return t}function dc(n){return JSON.stringify(n)}function Id(n){return n.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}var fc="captureStackTrace"in Error?Error.captureStackTrace:(...n)=>{};function Tr(n){return typeof n=="object"&&n!==null&&!Array.isArray(n)}var Dd=ss(()=>{if(Er.jitless||typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{let n=Function;return new n(""),!0}catch{return!1}});function Xi(n){if(Tr(n)===!1)return!1;let e=n.constructor;if(e===void 0||typeof e!="function")return!0;let t=e.prototype;return!(Tr(t)===!1||Object.prototype.hasOwnProperty.call(t,"isPrototypeOf")===!1)}function Nd(n){return Xi(n)?{...n}:Array.isArray(n)?[...n]:n instanceof Map?new Map(n):n instanceof Set?new Set(n):n}function uw(n){let e=0;for(let t in n)Object.prototype.hasOwnProperty.call(n,t)&&e++;return e}var hw=n=>{let e=typeof n;switch(e){case"undefined":return"undefined";case"string":return"string";case"number":return Number.isNaN(n)?"nan":"number";case"boolean":return"boolean";case"function":return"function";case"bigint":return"bigint";case"symbol":return"symbol";case"object":return Array.isArray(n)?"array":n===null?"null":n.then&&typeof n.then=="function"&&n.catch&&typeof n.catch=="function"?"promise":typeof Map<"u"&&n instanceof Map?"map":typeof Set<"u"&&n instanceof Set?"set":typeof Date<"u"&&n instanceof Date?"date":typeof File<"u"&&n instanceof File?"file":"object";default:throw new Error(`Unknown data type: ${e}`)}},Eo=new Set(["string","number","symbol"]),Ld=new Set(["string","number","bigint","boolean","symbol","undefined"]);function Fn(n){return n.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}function dn(n,e,t){let i=new n._zod.constr(e??n._zod.def);return(!e||t?.parent)&&(i._zod.parent=n),i}function de(n){let e=n;if(!e)return{};if(typeof e=="string")return{error:()=>e};if(e?.message!==void 0){if(e?.error!==void 0)throw new Error("Cannot specify both `message` and `error` params");e.error=e.message}return delete e.message,typeof e.error=="string"?{...e,error:()=>e.error}:e}function dw(n){let e;return new Proxy({},{get(t,i,r){return e??(e=n()),Reflect.get(e,i,r)},set(t,i,r,s){return e??(e=n()),Reflect.set(e,i,r,s)},has(t,i){return e??(e=n()),Reflect.has(e,i)},deleteProperty(t,i){return e??(e=n()),Reflect.deleteProperty(e,i)},ownKeys(t){return e??(e=n()),Reflect.ownKeys(e)},getOwnPropertyDescriptor(t,i){return e??(e=n()),Reflect.getOwnPropertyDescriptor(e,i)},defineProperty(t,i,r){return e??(e=n()),Reflect.defineProperty(e,i,r)}})}function pc(n){return typeof n=="bigint"?n.toString()+"n":typeof n=="string"?`"${n}"`:`${n}`}function zd(n){return Object.keys(n).filter(e=>n[e]._zod.optin==="optional"&&n[e]._zod.optout==="optional")}var Ud={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]},Od={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function fw(n,e){let t=n._zod.def,i=t.checks;if(i&&i.length>0)throw new Error(".pick() cannot be used on object schemas containing refinements");let s=bi(n._zod.def,{get shape(){let o={};for(let a in e){if(!(a in t.shape))throw new Error(`Unrecognized key: "${a}"`);e[a]&&(o[a]=t.shape[a])}return Zi(this,"shape",o),o},checks:[]});return dn(n,s)}function pw(n,e){let t=n._zod.def,i=t.checks;if(i&&i.length>0)throw new Error(".omit() cannot be used on object schemas containing refinements");let s=bi(n._zod.def,{get shape(){let o={...n._zod.def.shape};for(let a in e){if(!(a in t.shape))throw new Error(`Unrecognized key: "${a}"`);e[a]&&delete o[a]}return Zi(this,"shape",o),o},checks:[]});return dn(n,s)}function mw(n,e){if(!Xi(e))throw new Error("Invalid input to extend: expected a plain object");let t=n._zod.def.checks;if(t&&t.length>0){let s=n._zod.def.shape;for(let o in e)if(Object.getOwnPropertyDescriptor(s,o)!==void 0)throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let r=bi(n._zod.def,{get shape(){let s={...n._zod.def.shape,...e};return Zi(this,"shape",s),s}});return dn(n,r)}function gw(n,e){if(!Xi(e))throw new Error("Invalid input to safeExtend: expected a plain object");let t=bi(n._zod.def,{get shape(){let i={...n._zod.def.shape,...e};return Zi(this,"shape",i),i}});return dn(n,t)}function xw(n,e){if(n._zod.def.checks?.length)throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let t=bi(n._zod.def,{get shape(){let i={...n._zod.def.shape,...e._zod.def.shape};return Zi(this,"shape",i),i},get catchall(){return e._zod.def.catchall},checks:e._zod.def.checks??[]});return dn(n,t)}function _w(n,e,t){let r=e._zod.def.checks;if(r&&r.length>0)throw new Error(".partial() cannot be used on object schemas containing refinements");let o=bi(e._zod.def,{get shape(){let a=e._zod.def.shape,c={...a};if(t)for(let l in t){if(!(l in a))throw new Error(`Unrecognized key: "${l}"`);t[l]&&(c[l]=n?new n({type:"optional",innerType:a[l]}):a[l])}else for(let l in a)c[l]=n?new n({type:"optional",innerType:a[l]}):a[l];return Zi(this,"shape",c),c},checks:[]});return dn(e,o)}function vw(n,e,t){let i=bi(e._zod.def,{get shape(){let r=e._zod.def.shape,s={...r};if(t)for(let o in t){if(!(o in s))throw new Error(`Unrecognized key: "${o}"`);t[o]&&(s[o]=new n({type:"nonoptional",innerType:r[o]}))}else for(let o in r)s[o]=new n({type:"nonoptional",innerType:r[o]});return Zi(this,"shape",s),s}});return dn(e,i)}function qi(n,e=0){if(n.aborted===!0)return!0;for(let t=e;t<n.issues.length;t++)if(n.issues[t]?.continue!==!0)return!0;return!1}function Fd(n,e=0){if(n.aborted===!0)return!0;for(let t=e;t<n.issues.length;t++)if(n.issues[t]?.continue===!1)return!0;return!1}function vn(n,e){return e.map(t=>{var i;return(i=t).path??(i.path=[]),t.path.unshift(n),t})}function So(n){return typeof n=="string"?n:n?.message}function fn(n,e,t){let i=n.message?n.message:So(n.inst?._zod.def?.error?.(n))??So(e?.error?.(n))??So(t.customError?.(n))??So(t.localeError?.(n))??"Invalid input",{inst:r,continue:s,input:o,...a}=n;return a.path??(a.path=[]),a.message=i,e?.reportInput&&(a.input=o),a}function To(n){return n instanceof Set?"set":n instanceof Map?"map":n instanceof File?"file":"unknown"}function Ao(n){return Array.isArray(n)?"array":typeof n=="string"?"string":"unknown"}function kd(n){let e=typeof n;switch(e){case"number":return Number.isNaN(n)?"nan":"number";case"object":{if(n===null)return"null";if(Array.isArray(n))return"array";let t=n;if(t&&Object.getPrototypeOf(t)!==Object.prototype&&"constructor"in t&&t.constructor)return t.constructor.name}}return e}function os(...n){let[e,t,i]=n;return typeof e=="string"?{message:e,code:"custom",input:t,inst:i}:{...e}}function yw(n){return Object.entries(n).filter(([e,t])=>Number.isNaN(Number.parseInt(e,10))).map(e=>e[1])}function H_(n){let e=atob(n),t=new Uint8Array(e.length);for(let i=0;i<e.length;i++)t[i]=e.charCodeAt(i);return t}function G_(n){let e="";for(let t=0;t<n.length;t++)e+=String.fromCharCode(n[t]);return btoa(e)}function bw(n){let e=n.replace(/-/g,"+").replace(/_/g,"/"),t="=".repeat((4-e.length%4)%4);return H_(e+t)}function Sw(n){return G_(n).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}function Mw(n){let e=n.replace(/^0x/,"");if(e.length%2!==0)throw new Error("Invalid hex string length");let t=new Uint8Array(e.length/2);for(let i=0;i<e.length;i+=2)t[i/2]=Number.parseInt(e.slice(i,i+2),16);return t}function ww(n){return Array.from(n).map(e=>e.toString(16).padStart(2,"0")).join("")}var Cd=class{constructor(...e){}};var V_=(n,e)=>{n.name="$ZodError",Object.defineProperty(n,"_zod",{value:n._zod,enumerable:!1}),Object.defineProperty(n,"issues",{value:e,enumerable:!1}),n.message=JSON.stringify(e,rs,2),Object.defineProperty(n,"toString",{value:()=>n.message,enumerable:!1})},Ro=O("$ZodError",V_),yn=O("$ZodError",V_,{Parent:Error});function Co(n,e=t=>t.message){let t={},i=[];for(let r of n.issues)r.path.length>0?(t[r.path[0]]=t[r.path[0]]||[],t[r.path[0]].push(e(r))):i.push(e(r));return{formErrors:i,fieldErrors:t}}function Po(n,e=t=>t.message){let t={_errors:[]},i=(r,s=[])=>{for(let o of r.issues)if(o.code==="invalid_union"&&o.errors.length)o.errors.map(a=>i({issues:a},[...s,...o.path]));else if(o.code==="invalid_key")i({issues:o.issues},[...s,...o.path]);else if(o.code==="invalid_element")i({issues:o.issues},[...s,...o.path]);else{let a=[...s,...o.path];if(a.length===0)t._errors.push(e(o));else{let c=t,l=0;for(;l<a.length;){let u=a[l];l===a.length-1?(c[u]=c[u]||{_errors:[]},c[u]._errors.push(e(o))):c[u]=c[u]||{_errors:[]},c=c[u],l++}}}};return i(n),t}function Bd(n,e=t=>t.message){let t={errors:[]},i=(r,s=[])=>{var o,a;for(let c of r.issues)if(c.code==="invalid_union"&&c.errors.length)c.errors.map(l=>i({issues:l},[...s,...c.path]));else if(c.code==="invalid_key")i({issues:c.issues},[...s,...c.path]);else if(c.code==="invalid_element")i({issues:c.issues},[...s,...c.path]);else{let l=[...s,...c.path];if(l.length===0){t.errors.push(e(c));continue}let u=t,h=0;for(;h<l.length;){let d=l[h],f=h===l.length-1;typeof d=="string"?(u.properties??(u.properties={}),(o=u.properties)[d]??(o[d]={errors:[]}),u=u.properties[d]):(u.items??(u.items=[]),(a=u.items)[d]??(a[d]={errors:[]}),u=u.items[d]),f&&u.errors.push(e(c)),h++}}};return i(n),t}function $_(n){let e=[],t=n.map(i=>typeof i=="object"?i.key:i);for(let i of t)typeof i=="number"?e.push(`[${i}]`):typeof i=="symbol"?e.push(`[${JSON.stringify(String(i))}]`):/[^\w$]/.test(i)?e.push(`[${JSON.stringify(i)}]`):(e.length&&e.push("."),e.push(i));return e.join("")}function Hd(n){let e=[],t=[...n.issues].sort((i,r)=>(i.path??[]).length-(r.path??[]).length);for(let i of t)e.push(`\u2716 ${i.message}`),i.path?.length&&e.push(`  \u2192 at ${$_(i.path)}`);return e.join(`
`)}var as=n=>(e,t,i,r)=>{let s=i?{...i,async:!1}:{async:!1},o=e._zod.run({value:t,issues:[]},s);if(o instanceof Promise)throw new Zn;if(o.issues.length){let a=new(r?.Err??n)(o.issues.map(c=>fn(c,s,Ft())));throw fc(a,r?.callee),a}return o.value},mc=as(yn),cs=n=>async(e,t,i,r)=>{let s=i?{...i,async:!0}:{async:!0},o=e._zod.run({value:t,issues:[]},s);if(o instanceof Promise&&(o=await o),o.issues.length){let a=new(r?.Err??n)(o.issues.map(c=>fn(c,s,Ft())));throw fc(a,r?.callee),a}return o.value},gc=cs(yn),ls=n=>(e,t,i)=>{let r=i?{...i,async:!1}:{async:!1},s=e._zod.run({value:t,issues:[]},r);if(s instanceof Promise)throw new Zn;return s.issues.length?{success:!1,error:new(n??Ro)(s.issues.map(o=>fn(o,r,Ft())))}:{success:!0,data:s.value}},Gd=ls(yn),us=n=>async(e,t,i)=>{let r=i?{...i,async:!0}:{async:!0},s=e._zod.run({value:t,issues:[]},r);return s instanceof Promise&&(s=await s),s.issues.length?{success:!1,error:new n(s.issues.map(o=>fn(o,r,Ft())))}:{success:!0,data:s.value}},Vd=us(yn),xc=n=>(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return as(n)(e,t,r)},Tw=xc(yn),_c=n=>(e,t,i)=>as(n)(e,t,i),Aw=_c(yn),vc=n=>async(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return cs(n)(e,t,r)},Rw=vc(yn),yc=n=>async(e,t,i)=>cs(n)(e,t,i),Cw=yc(yn),bc=n=>(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return ls(n)(e,t,r)},Pw=bc(yn),Sc=n=>(e,t,i)=>ls(n)(e,t,i),Iw=Sc(yn),Mc=n=>async(e,t,i)=>{let r=i?{...i,direction:"backward"}:{direction:"backward"};return us(n)(e,t,r)},Dw=Mc(yn),wc=n=>async(e,t,i)=>us(n)(e,t,i),Nw=wc(yn);var Cn={};vi(Cn,{base64:()=>of,base64url:()=>Ec,bigint:()=>ff,boolean:()=>mf,browserEmail:()=>Hw,cidrv4:()=>rf,cidrv6:()=>sf,cuid:()=>$d,cuid2:()=>Wd,date:()=>lf,datetime:()=>hf,domain:()=>$w,duration:()=>Jd,e164:()=>cf,email:()=>Kd,emoji:()=>Qd,extendedDuration:()=>Lw,guid:()=>jd,hex:()=>Ww,hostname:()=>Vw,html5Email:()=>Fw,httpProtocol:()=>af,idnEmail:()=>Bw,integer:()=>pf,ipv4:()=>ef,ipv6:()=>tf,ksuid:()=>qd,lowercase:()=>_f,mac:()=>nf,md5_base64:()=>Xw,md5_base64url:()=>qw,md5_hex:()=>Zw,nanoid:()=>Yd,null:()=>gf,number:()=>Tc,rfc5322Email:()=>kw,sha1_base64:()=>Jw,sha1_base64url:()=>jw,sha1_hex:()=>Yw,sha256_base64:()=>Qw,sha256_base64url:()=>eE,sha256_hex:()=>Kw,sha384_base64:()=>nE,sha384_base64url:()=>iE,sha384_hex:()=>tE,sha512_base64:()=>sE,sha512_base64url:()=>oE,sha512_hex:()=>rE,string:()=>df,time:()=>uf,ulid:()=>Zd,undefined:()=>xf,unicodeEmail:()=>W_,uppercase:()=>vf,uuid:()=>Ar,uuid4:()=>zw,uuid6:()=>Uw,uuid7:()=>Ow,xid:()=>Xd});var $d=/^[cC][0-9a-z]{6,}$/,Wd=/^[0-9a-z]+$/,Zd=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,Xd=/^[0-9a-vA-V]{20}$/,qd=/^[A-Za-z0-9]{27}$/,Yd=/^[a-zA-Z0-9_-]{21}$/,Jd=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,Lw=/^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,jd=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Ar=n=>n?new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${n}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,zw=Ar(4),Uw=Ar(6),Ow=Ar(7),Kd=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,Fw=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,kw=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,W_=/^[^\s@"]{1,64}@[^\s@]{1,255}$/u,Bw=W_,Hw=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,Gw="^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";function Qd(){return new RegExp(Gw,"u")}var ef=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,tf=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,nf=n=>{let e=Fn(n??":");return new RegExp(`^(?:[0-9A-F]{2}${e}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${e}){5}[0-9a-f]{2}$`)},rf=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,sf=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,of=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,Ec=/^[A-Za-z0-9_-]*$/,Vw=/^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,$w=/^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,af=/^https?$/,cf=/^\+[1-9]\d{6,14}$/,Z_="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",lf=new RegExp(`^${Z_}$`);function X_(n){let e="(?:[01]\\d|2[0-3]):[0-5]\\d";return typeof n.precision=="number"?n.precision===-1?`${e}`:n.precision===0?`${e}:[0-5]\\d`:`${e}:[0-5]\\d\\.\\d{${n.precision}}`:`${e}(?::[0-5]\\d(?:\\.\\d+)?)?`}function uf(n){return new RegExp(`^${X_(n)}$`)}function hf(n){let e=X_({precision:n.precision}),t=["Z"];n.local&&t.push(""),n.offset&&t.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let i=`${e}(?:${t.join("|")})`;return new RegExp(`^${Z_}T(?:${i})$`)}var df=n=>{let e=n?`[\\s\\S]{${n?.minimum??0},${n?.maximum??""}}`:"[\\s\\S]*";return new RegExp(`^${e}$`)},ff=/^-?\d+n?$/,pf=/^-?\d+$/,Tc=/^-?\d+(?:\.\d+)?$/,mf=/^(?:true|false)$/i,gf=/^null$/i;var xf=/^undefined$/i;var _f=/^[^A-Z]*$/,vf=/^[^a-z]*$/,Ww=/^[0-9a-fA-F]*$/;function Io(n,e){return new RegExp(`^[A-Za-z0-9+/]{${n}}${e}$`)}function Do(n){return new RegExp(`^[A-Za-z0-9_-]{${n}}$`)}var Zw=/^[0-9a-fA-F]{32}$/,Xw=Io(22,"=="),qw=Do(22),Yw=/^[0-9a-fA-F]{40}$/,Jw=Io(27,"="),jw=Do(27),Kw=/^[0-9a-fA-F]{64}$/,Qw=Io(43,"="),eE=Do(43),tE=/^[0-9a-fA-F]{96}$/,nE=Io(64,""),iE=Do(64),rE=/^[0-9a-fA-F]{128}$/,sE=Io(86,"=="),oE=Do(86);var Ct=O("$ZodCheck",(n,e)=>{var t;n._zod??(n._zod={}),n._zod.def=e,(t=n._zod).onattach??(t.onattach=[])}),Y_={number:"number",bigint:"bigint",object:"date"},Ac=O("$ZodCheckLessThan",(n,e)=>{Ct.init(n,e);let t=Y_[typeof e.value];n._zod.onattach.push(i=>{let r=i._zod.bag,s=(e.inclusive?r.maximum:r.exclusiveMaximum)??Number.POSITIVE_INFINITY;e.value<s&&(e.inclusive?r.maximum=e.value:r.exclusiveMaximum=e.value)}),n._zod.check=i=>{(e.inclusive?i.value<=e.value:i.value<e.value)||i.issues.push({origin:t,code:"too_big",maximum:typeof e.value=="object"?e.value.getTime():e.value,input:i.value,inclusive:e.inclusive,inst:n,continue:!e.abort})}}),Rc=O("$ZodCheckGreaterThan",(n,e)=>{Ct.init(n,e);let t=Y_[typeof e.value];n._zod.onattach.push(i=>{let r=i._zod.bag,s=(e.inclusive?r.minimum:r.exclusiveMinimum)??Number.NEGATIVE_INFINITY;e.value>s&&(e.inclusive?r.minimum=e.value:r.exclusiveMinimum=e.value)}),n._zod.check=i=>{(e.inclusive?i.value>=e.value:i.value>e.value)||i.issues.push({origin:t,code:"too_small",minimum:typeof e.value=="object"?e.value.getTime():e.value,input:i.value,inclusive:e.inclusive,inst:n,continue:!e.abort})}}),yf=O("$ZodCheckMultipleOf",(n,e)=>{Ct.init(n,e),n._zod.onattach.push(t=>{var i;(i=t._zod.bag).multipleOf??(i.multipleOf=e.value)}),n._zod.check=t=>{if(typeof t.value!=typeof e.value)throw new Error("Cannot mix number and bigint in multiple_of check.");(typeof t.value=="bigint"?t.value%e.value===BigInt(0):Pd(t.value,e.value)===0)||t.issues.push({origin:typeof t.value,code:"not_multiple_of",divisor:e.value,input:t.value,inst:n,continue:!e.abort})}}),bf=O("$ZodCheckNumberFormat",(n,e)=>{Ct.init(n,e),e.format=e.format||"float64";let t=e.format?.includes("int"),i=t?"int":"number",[r,s]=Ud[e.format];n._zod.onattach.push(o=>{let a=o._zod.bag;a.format=e.format,a.minimum=r,a.maximum=s,t&&(a.pattern=pf)}),n._zod.check=o=>{let a=o.value;if(t){if(!Number.isInteger(a)){o.issues.push({expected:i,format:e.format,code:"invalid_type",continue:!1,input:a,inst:n});return}if(!Number.isSafeInteger(a)){a>0?o.issues.push({input:a,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:n,origin:i,inclusive:!0,continue:!e.abort}):o.issues.push({input:a,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:n,origin:i,inclusive:!0,continue:!e.abort});return}}a<r&&o.issues.push({origin:"number",input:a,code:"too_small",minimum:r,inclusive:!0,inst:n,continue:!e.abort}),a>s&&o.issues.push({origin:"number",input:a,code:"too_big",maximum:s,inclusive:!0,inst:n,continue:!e.abort})}}),Sf=O("$ZodCheckBigIntFormat",(n,e)=>{Ct.init(n,e);let[t,i]=Od[e.format];n._zod.onattach.push(r=>{let s=r._zod.bag;s.format=e.format,s.minimum=t,s.maximum=i}),n._zod.check=r=>{let s=r.value;s<t&&r.issues.push({origin:"bigint",input:s,code:"too_small",minimum:t,inclusive:!0,inst:n,continue:!e.abort}),s>i&&r.issues.push({origin:"bigint",input:s,code:"too_big",maximum:i,inclusive:!0,inst:n,continue:!e.abort})}}),Mf=O("$ZodCheckMaxSize",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.maximum??Number.POSITIVE_INFINITY;e.maximum<r&&(i._zod.bag.maximum=e.maximum)}),n._zod.check=i=>{let r=i.value;r.size<=e.maximum||i.issues.push({origin:To(r),code:"too_big",maximum:e.maximum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),wf=O("$ZodCheckMinSize",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.minimum??Number.NEGATIVE_INFINITY;e.minimum>r&&(i._zod.bag.minimum=e.minimum)}),n._zod.check=i=>{let r=i.value;r.size>=e.minimum||i.issues.push({origin:To(r),code:"too_small",minimum:e.minimum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),Ef=O("$ZodCheckSizeEquals",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.size!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag;r.minimum=e.size,r.maximum=e.size,r.size=e.size}),n._zod.check=i=>{let r=i.value,s=r.size;if(s===e.size)return;let o=s>e.size;i.issues.push({origin:To(r),...o?{code:"too_big",maximum:e.size}:{code:"too_small",minimum:e.size},inclusive:!0,exact:!0,input:i.value,inst:n,continue:!e.abort})}}),Tf=O("$ZodCheckMaxLength",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.maximum??Number.POSITIVE_INFINITY;e.maximum<r&&(i._zod.bag.maximum=e.maximum)}),n._zod.check=i=>{let r=i.value;if(r.length<=e.maximum)return;let o=Ao(r);i.issues.push({origin:o,code:"too_big",maximum:e.maximum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),Af=O("$ZodCheckMinLength",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag.minimum??Number.NEGATIVE_INFINITY;e.minimum>r&&(i._zod.bag.minimum=e.minimum)}),n._zod.check=i=>{let r=i.value;if(r.length>=e.minimum)return;let o=Ao(r);i.issues.push({origin:o,code:"too_small",minimum:e.minimum,inclusive:!0,input:r,inst:n,continue:!e.abort})}}),Rf=O("$ZodCheckLengthEquals",(n,e)=>{var t;Ct.init(n,e),(t=n._zod.def).when??(t.when=i=>{let r=i.value;return!Wi(r)&&r.length!==void 0}),n._zod.onattach.push(i=>{let r=i._zod.bag;r.minimum=e.length,r.maximum=e.length,r.length=e.length}),n._zod.check=i=>{let r=i.value,s=r.length;if(s===e.length)return;let o=Ao(r),a=s>e.length;i.issues.push({origin:o,...a?{code:"too_big",maximum:e.length}:{code:"too_small",minimum:e.length},inclusive:!0,exact:!0,input:i.value,inst:n,continue:!e.abort})}}),hs=O("$ZodCheckStringFormat",(n,e)=>{var t,i;Ct.init(n,e),n._zod.onattach.push(r=>{let s=r._zod.bag;s.format=e.format,e.pattern&&(s.patterns??(s.patterns=new Set),s.patterns.add(e.pattern))}),e.pattern?(t=n._zod).check??(t.check=r=>{e.pattern.lastIndex=0,!e.pattern.test(r.value)&&r.issues.push({origin:"string",code:"invalid_format",format:e.format,input:r.value,...e.pattern?{pattern:e.pattern.toString()}:{},inst:n,continue:!e.abort})}):(i=n._zod).check??(i.check=()=>{})}),Cf=O("$ZodCheckRegex",(n,e)=>{hs.init(n,e),n._zod.check=t=>{e.pattern.lastIndex=0,!e.pattern.test(t.value)&&t.issues.push({origin:"string",code:"invalid_format",format:"regex",input:t.value,pattern:e.pattern.toString(),inst:n,continue:!e.abort})}}),Pf=O("$ZodCheckLowerCase",(n,e)=>{e.pattern??(e.pattern=_f),hs.init(n,e)}),If=O("$ZodCheckUpperCase",(n,e)=>{e.pattern??(e.pattern=vf),hs.init(n,e)}),Df=O("$ZodCheckIncludes",(n,e)=>{Ct.init(n,e);let t=Fn(e.includes),i=new RegExp(typeof e.position=="number"?`^.{${e.position}}${t}`:t);e.pattern=i,n._zod.onattach.push(r=>{let s=r._zod.bag;s.patterns??(s.patterns=new Set),s.patterns.add(i)}),n._zod.check=r=>{r.value.includes(e.includes,e.position)||r.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:e.includes,input:r.value,inst:n,continue:!e.abort})}}),Nf=O("$ZodCheckStartsWith",(n,e)=>{Ct.init(n,e);let t=new RegExp(`^${Fn(e.prefix)}.*`);e.pattern??(e.pattern=t),n._zod.onattach.push(i=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(t)}),n._zod.check=i=>{i.value.startsWith(e.prefix)||i.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:e.prefix,input:i.value,inst:n,continue:!e.abort})}}),Lf=O("$ZodCheckEndsWith",(n,e)=>{Ct.init(n,e);let t=new RegExp(`.*${Fn(e.suffix)}$`);e.pattern??(e.pattern=t),n._zod.onattach.push(i=>{let r=i._zod.bag;r.patterns??(r.patterns=new Set),r.patterns.add(t)}),n._zod.check=i=>{i.value.endsWith(e.suffix)||i.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:e.suffix,input:i.value,inst:n,continue:!e.abort})}});function q_(n,e,t){n.issues.length&&e.issues.push(...vn(t,n.issues))}var zf=O("$ZodCheckProperty",(n,e)=>{Ct.init(n,e),n._zod.check=t=>{let i=e.schema._zod.run({value:t.value[e.property],issues:[]},{});if(i instanceof Promise)return i.then(r=>q_(r,t,e.property));q_(i,t,e.property)}}),Uf=O("$ZodCheckMimeType",(n,e)=>{Ct.init(n,e);let t=new Set(e.mime);n._zod.onattach.push(i=>{i._zod.bag.mime=e.mime}),n._zod.check=i=>{t.has(i.value.type)||i.issues.push({code:"invalid_value",values:e.mime,input:i.value.type,inst:n,continue:!e.abort})}}),Of=O("$ZodCheckOverwrite",(n,e)=>{Ct.init(n,e),n._zod.check=t=>{t.value=e.tx(t.value)}});var No=class{constructor(e=[]){this.content=[],this.indent=0,this&&(this.args=e)}indented(e){this.indent+=1,e(this),this.indent-=1}write(e){if(typeof e=="function"){e(this,{execution:"sync"}),e(this,{execution:"async"});return}let i=e.split(`
`).filter(o=>o),r=Math.min(...i.map(o=>o.length-o.trimStart().length)),s=i.map(o=>o.slice(r)).map(o=>" ".repeat(this.indent*2)+o);for(let o of s)this.content.push(o)}compile(){let e=Function,t=this?.args,r=[...(this?.content??[""]).map(s=>`  ${s}`)];return new e(...t,r.join(`
`))}};var Ff={major:4,minor:4,patch:3};var Ke=O("$ZodType",(n,e)=>{var t;n??(n={}),n._zod.def=e,n._zod.bag=n._zod.bag||{},n._zod.version=Ff;let i=[...n._zod.def.checks??[]];n._zod.traits.has("$ZodCheck")&&i.unshift(n);for(let r of i)for(let s of r._zod.onattach)s(n);if(i.length===0)(t=n._zod).deferred??(t.deferred=[]),n._zod.deferred?.push(()=>{n._zod.run=n._zod.parse});else{let r=(o,a,c)=>{let l=qi(o),u;for(let h of a){if(h._zod.def.when){if(Fd(o)||!h._zod.def.when(o))continue}else if(l)continue;let d=o.issues.length,f=h._zod.check(o);if(f instanceof Promise&&c?.async===!1)throw new Zn;if(u||f instanceof Promise)u=(u??Promise.resolve()).then(async()=>{await f,o.issues.length!==d&&(l||(l=qi(o,d)))});else{if(o.issues.length===d)continue;l||(l=qi(o,d))}}return u?u.then(()=>o):o},s=(o,a,c)=>{if(qi(o))return o.aborted=!0,o;let l=r(a,i,c);if(l instanceof Promise){if(c.async===!1)throw new Zn;return l.then(u=>n._zod.parse(u,c))}return n._zod.parse(l,c)};n._zod.run=(o,a)=>{if(a.skipChecks)return n._zod.parse(o,a);if(a.direction==="backward"){let l=n._zod.parse({value:o.value,issues:[]},{...a,skipChecks:!0});return l instanceof Promise?l.then(u=>s(u,o,a)):s(l,o,a)}let c=n._zod.parse(o,a);if(c instanceof Promise){if(a.async===!1)throw new Zn;return c.then(l=>r(l,i,a))}return r(c,i,a)}}ot(n,"~standard",()=>({validate:r=>{try{let s=Gd(n,r);return s.success?{value:s.data}:{issues:s.error?.issues}}catch{return Vd(n,r).then(o=>o.success?{value:o.data}:{issues:o.error?.issues})}},vendor:"zod",version:1}))}),Rr=O("$ZodString",(n,e)=>{Ke.init(n,e),n._zod.pattern=[...n?._zod.bag?.patterns??[]].pop()??df(n._zod.bag),n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=String(t.value)}catch{}return typeof t.value=="string"||t.issues.push({expected:"string",code:"invalid_type",input:t.value,inst:n}),t}}),Et=O("$ZodStringFormat",(n,e)=>{hs.init(n,e),Rr.init(n,e)}),Bf=O("$ZodGUID",(n,e)=>{e.pattern??(e.pattern=jd),Et.init(n,e)}),Hf=O("$ZodUUID",(n,e)=>{if(e.version){let i={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[e.version];if(i===void 0)throw new Error(`Invalid UUID version: "${e.version}"`);e.pattern??(e.pattern=Ar(i))}else e.pattern??(e.pattern=Ar());Et.init(n,e)}),Gf=O("$ZodEmail",(n,e)=>{e.pattern??(e.pattern=Kd),Et.init(n,e)}),Vf=O("$ZodURL",(n,e)=>{Et.init(n,e),n._zod.check=t=>{try{let i=t.value.trim();if(!e.normalize&&e.protocol?.source===af.source&&!/^https?:\/\//i.test(i)){t.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:t.value,inst:n,continue:!e.abort});return}let r=new URL(i);e.hostname&&(e.hostname.lastIndex=0,e.hostname.test(r.hostname)||t.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:e.hostname.source,input:t.value,inst:n,continue:!e.abort})),e.protocol&&(e.protocol.lastIndex=0,e.protocol.test(r.protocol.endsWith(":")?r.protocol.slice(0,-1):r.protocol)||t.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:e.protocol.source,input:t.value,inst:n,continue:!e.abort})),e.normalize?t.value=r.href:t.value=i;return}catch{t.issues.push({code:"invalid_format",format:"url",input:t.value,inst:n,continue:!e.abort})}}}),$f=O("$ZodEmoji",(n,e)=>{e.pattern??(e.pattern=Qd()),Et.init(n,e)}),Wf=O("$ZodNanoID",(n,e)=>{e.pattern??(e.pattern=Yd),Et.init(n,e)}),Zf=O("$ZodCUID",(n,e)=>{e.pattern??(e.pattern=$d),Et.init(n,e)}),Xf=O("$ZodCUID2",(n,e)=>{e.pattern??(e.pattern=Wd),Et.init(n,e)}),qf=O("$ZodULID",(n,e)=>{e.pattern??(e.pattern=Zd),Et.init(n,e)}),Yf=O("$ZodXID",(n,e)=>{e.pattern??(e.pattern=Xd),Et.init(n,e)}),Jf=O("$ZodKSUID",(n,e)=>{e.pattern??(e.pattern=qd),Et.init(n,e)}),jf=O("$ZodISODateTime",(n,e)=>{e.pattern??(e.pattern=hf(e)),Et.init(n,e)}),Kf=O("$ZodISODate",(n,e)=>{e.pattern??(e.pattern=lf),Et.init(n,e)}),Qf=O("$ZodISOTime",(n,e)=>{e.pattern??(e.pattern=uf(e)),Et.init(n,e)}),ep=O("$ZodISODuration",(n,e)=>{e.pattern??(e.pattern=Jd),Et.init(n,e)}),tp=O("$ZodIPv4",(n,e)=>{e.pattern??(e.pattern=ef),Et.init(n,e),n._zod.bag.format="ipv4"}),np=O("$ZodIPv6",(n,e)=>{e.pattern??(e.pattern=tf),Et.init(n,e),n._zod.bag.format="ipv6",n._zod.check=t=>{try{new URL(`http://[${t.value}]`)}catch{t.issues.push({code:"invalid_format",format:"ipv6",input:t.value,inst:n,continue:!e.abort})}}}),ip=O("$ZodMAC",(n,e)=>{e.pattern??(e.pattern=nf(e.delimiter)),Et.init(n,e),n._zod.bag.format="mac"}),rp=O("$ZodCIDRv4",(n,e)=>{e.pattern??(e.pattern=rf),Et.init(n,e)}),sp=O("$ZodCIDRv6",(n,e)=>{e.pattern??(e.pattern=sf),Et.init(n,e),n._zod.check=t=>{let i=t.value.split("/");try{if(i.length!==2)throw new Error;let[r,s]=i;if(!s)throw new Error;let o=Number(s);if(`${o}`!==s)throw new Error;if(o<0||o>128)throw new Error;new URL(`http://[${r}]`)}catch{t.issues.push({code:"invalid_format",format:"cidrv6",input:t.value,inst:n,continue:!e.abort})}}});function op(n){if(n==="")return!0;if(/\s/.test(n)||n.length%4!==0)return!1;try{return atob(n),!0}catch{return!1}}var ap=O("$ZodBase64",(n,e)=>{e.pattern??(e.pattern=of),Et.init(n,e),n._zod.bag.contentEncoding="base64",n._zod.check=t=>{op(t.value)||t.issues.push({code:"invalid_format",format:"base64",input:t.value,inst:n,continue:!e.abort})}});function hv(n){if(!Ec.test(n))return!1;let e=n.replace(/[-_]/g,i=>i==="-"?"+":"/"),t=e.padEnd(Math.ceil(e.length/4)*4,"=");return op(t)}var cp=O("$ZodBase64URL",(n,e)=>{e.pattern??(e.pattern=Ec),Et.init(n,e),n._zod.bag.contentEncoding="base64url",n._zod.check=t=>{hv(t.value)||t.issues.push({code:"invalid_format",format:"base64url",input:t.value,inst:n,continue:!e.abort})}}),lp=O("$ZodE164",(n,e)=>{e.pattern??(e.pattern=cf),Et.init(n,e)});function dv(n,e=null){try{let t=n.split(".");if(t.length!==3)return!1;let[i]=t;if(!i)return!1;let r=JSON.parse(atob(i));return!("typ"in r&&r?.typ!=="JWT"||!r.alg||e&&(!("alg"in r)||r.alg!==e))}catch{return!1}}var up=O("$ZodJWT",(n,e)=>{Et.init(n,e),n._zod.check=t=>{dv(t.value,e.alg)||t.issues.push({code:"invalid_format",format:"jwt",input:t.value,inst:n,continue:!e.abort})}}),hp=O("$ZodCustomStringFormat",(n,e)=>{Et.init(n,e),n._zod.check=t=>{e.fn(t.value)||t.issues.push({code:"invalid_format",format:e.format,input:t.value,inst:n,continue:!e.abort})}}),Nc=O("$ZodNumber",(n,e)=>{Ke.init(n,e),n._zod.pattern=n._zod.bag.pattern??Tc,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=Number(t.value)}catch{}let r=t.value;if(typeof r=="number"&&!Number.isNaN(r)&&Number.isFinite(r))return t;let s=typeof r=="number"?Number.isNaN(r)?"NaN":Number.isFinite(r)?void 0:"Infinity":void 0;return t.issues.push({expected:"number",code:"invalid_type",input:r,inst:n,...s?{received:s}:{}}),t}}),dp=O("$ZodNumberFormat",(n,e)=>{bf.init(n,e),Nc.init(n,e)}),Lo=O("$ZodBoolean",(n,e)=>{Ke.init(n,e),n._zod.pattern=mf,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=!!t.value}catch{}let r=t.value;return typeof r=="boolean"||t.issues.push({expected:"boolean",code:"invalid_type",input:r,inst:n}),t}}),Lc=O("$ZodBigInt",(n,e)=>{Ke.init(n,e),n._zod.pattern=ff,n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=BigInt(t.value)}catch{}return typeof t.value=="bigint"||t.issues.push({expected:"bigint",code:"invalid_type",input:t.value,inst:n}),t}}),fp=O("$ZodBigIntFormat",(n,e)=>{Sf.init(n,e),Lc.init(n,e)}),pp=O("$ZodSymbol",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return typeof r=="symbol"||t.issues.push({expected:"symbol",code:"invalid_type",input:r,inst:n}),t}}),mp=O("$ZodUndefined",(n,e)=>{Ke.init(n,e),n._zod.pattern=xf,n._zod.values=new Set([void 0]),n._zod.parse=(t,i)=>{let r=t.value;return typeof r>"u"||t.issues.push({expected:"undefined",code:"invalid_type",input:r,inst:n}),t}}),gp=O("$ZodNull",(n,e)=>{Ke.init(n,e),n._zod.pattern=gf,n._zod.values=new Set([null]),n._zod.parse=(t,i)=>{let r=t.value;return r===null||t.issues.push({expected:"null",code:"invalid_type",input:r,inst:n}),t}}),xp=O("$ZodAny",(n,e)=>{Ke.init(n,e),n._zod.parse=t=>t}),_p=O("$ZodUnknown",(n,e)=>{Ke.init(n,e),n._zod.parse=t=>t}),vp=O("$ZodNever",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>(t.issues.push({expected:"never",code:"invalid_type",input:t.value,inst:n}),t)}),yp=O("$ZodVoid",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return typeof r>"u"||t.issues.push({expected:"void",code:"invalid_type",input:r,inst:n}),t}}),bp=O("$ZodDate",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{if(e.coerce)try{t.value=new Date(t.value)}catch{}let r=t.value,s=r instanceof Date;return s&&!Number.isNaN(r.getTime())||t.issues.push({expected:"date",code:"invalid_type",input:r,...s?{received:"Invalid Date"}:{},inst:n}),t}});function j_(n,e,t){n.issues.length&&e.issues.push(...vn(t,n.issues)),e.value[t]=n.value}var Sp=O("$ZodArray",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!Array.isArray(r))return t.issues.push({expected:"array",code:"invalid_type",input:r,inst:n}),t;t.value=Array(r.length);let s=[];for(let o=0;o<r.length;o++){let a=r[o],c=e.element._zod.run({value:a,issues:[]},i);c instanceof Promise?s.push(c.then(l=>j_(l,t,o))):j_(c,t,o)}return s.length?Promise.all(s).then(()=>t):t}});function Dc(n,e,t,i,r,s){let o=t in i;if(n.issues.length){if(r&&s&&!o)return;e.issues.push(...vn(t,n.issues))}if(!o&&!r){n.issues.length||e.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[t]});return}n.value===void 0?o&&(e.value[t]=void 0):e.value[t]=n.value}function fv(n){let e=Object.keys(n.shape);for(let i of e)if(!n.shape?.[i]?._zod?.traits?.has("$ZodType"))throw new Error(`Invalid element at key "${i}": expected a Zod schema`);let t=zd(n.shape);return{...n,keys:e,keySet:new Set(e),numKeys:e.length,optionalKeys:new Set(t)}}function pv(n,e,t,i,r,s){let o=[],a=r.keySet,c=r.catchall._zod,l=c.def.type,u=c.optin==="optional",h=c.optout==="optional";for(let d in e){if(d==="__proto__"||a.has(d))continue;if(l==="never"){o.push(d);continue}let f=c.run({value:e[d],issues:[]},i);f instanceof Promise?n.push(f.then(m=>Dc(m,t,d,e,u,h))):Dc(f,t,d,e,u,h)}return o.length&&t.issues.push({code:"unrecognized_keys",keys:o,input:e,inst:s}),n.length?Promise.all(n).then(()=>t):t}var mv=O("$ZodObject",(n,e)=>{if(Ke.init(n,e),!Object.getOwnPropertyDescriptor(e,"shape")?.get){let a=e.shape;Object.defineProperty(e,"shape",{get:()=>{let c={...a};return Object.defineProperty(e,"shape",{value:c}),c}})}let i=ss(()=>fv(e));ot(n._zod,"propValues",()=>{let a=e.shape,c={};for(let l in a){let u=a[l]._zod;if(u.values){c[l]??(c[l]=new Set);for(let h of u.values)c[l].add(h)}}return c});let r=Tr,s=e.catchall,o;n._zod.parse=(a,c)=>{o??(o=i.value);let l=a.value;if(!r(l))return a.issues.push({expected:"object",code:"invalid_type",input:l,inst:n}),a;a.value={};let u=[],h=o.shape;for(let d of o.keys){let f=h[d],m=f._zod.optin==="optional",y=f._zod.optout==="optional",g=f._zod.run({value:l[d],issues:[]},c);g instanceof Promise?u.push(g.then(p=>Dc(p,a,d,l,m,y))):Dc(g,a,d,l,m,y)}return s?pv(u,l,a,c,i.value,n):u.length?Promise.all(u).then(()=>a):a}}),Mp=O("$ZodObjectJIT",(n,e)=>{mv.init(n,e);let t=n._zod.parse,i=ss(()=>fv(e)),r=d=>{let f=new No(["shape","payload","ctx"]),m=i.value,y=E=>{let _=dc(E);return`shape[${_}]._zod.run({ value: input[${_}], issues: [] }, ctx)`};f.write("const input = payload.value;");let g=Object.create(null),p=0;for(let E of m.keys)g[E]=`key_${p++}`;f.write("const newResult = {};");for(let E of m.keys){let _=g[E],M=dc(E),w=d[E],C=w?._zod?.optin==="optional",v=w?._zod?.optout==="optional";f.write(`const ${_} = ${y(E)};`),C&&v?f.write(`
        if (${_}.issues.length) {
          if (${M} in input) {
            payload.issues = payload.issues.concat(${_}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${M}, ...iss.path] : [${M}]
            })));
          }
        }
        
        if (${_}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${_}.value;
        }
        
      `):C?f.write(`
        if (${_}.issues.length) {
          payload.issues = payload.issues.concat(${_}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        
        if (${_}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${_}.value;
        }
        
      `):f.write(`
        const ${_}_present = ${M} in input;
        if (${_}.issues.length) {
          payload.issues = payload.issues.concat(${_}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        if (!${_}_present && !${_}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${M}]
          });
        }

        if (${_}_present) {
          if (${_}.value === undefined) {
            newResult[${M}] = undefined;
          } else {
            newResult[${M}] = ${_}.value;
          }
        }

      `)}f.write("payload.value = newResult;"),f.write("return payload;");let S=f.compile();return(E,_)=>S(d,E,_)},s,o=Tr,a=!Er.jitless,l=a&&Dd.value,u=e.catchall,h;n._zod.parse=(d,f)=>{h??(h=i.value);let m=d.value;return o(m)?a&&l&&f?.async===!1&&f.jitless!==!0?(s||(s=r(e.shape)),d=s(d,f),u?pv([],m,d,f,h,n):d):t(d,f):(d.issues.push({expected:"object",code:"invalid_type",input:m,inst:n}),d)}});function K_(n,e,t,i){for(let s of n)if(s.issues.length===0)return e.value=s.value,e;let r=n.filter(s=>!qi(s));return r.length===1?(e.value=r[0].value,r[0]):(e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:n.map(s=>s.issues.map(o=>fn(o,i,Ft())))}),e)}var zo=O("$ZodUnion",(n,e)=>{Ke.init(n,e),ot(n._zod,"optin",()=>e.options.some(i=>i._zod.optin==="optional")?"optional":void 0),ot(n._zod,"optout",()=>e.options.some(i=>i._zod.optout==="optional")?"optional":void 0),ot(n._zod,"values",()=>{if(e.options.every(i=>i._zod.values))return new Set(e.options.flatMap(i=>Array.from(i._zod.values)))}),ot(n._zod,"pattern",()=>{if(e.options.every(i=>i._zod.pattern)){let i=e.options.map(r=>r._zod.pattern);return new RegExp(`^(${i.map(r=>wo(r.source)).join("|")})$`)}});let t=e.options.length===1?e.options[0]._zod.run:null;n._zod.parse=(i,r)=>{if(t)return t(i,r);let s=!1,o=[];for(let a of e.options){let c=a._zod.run({value:i.value,issues:[]},r);if(c instanceof Promise)o.push(c),s=!0;else{if(c.issues.length===0)return c;o.push(c)}}return s?Promise.all(o).then(a=>K_(a,i,n,r)):K_(o,i,n,r)}});function Q_(n,e,t,i){let r=n.filter(s=>s.issues.length===0);return r.length===1?(e.value=r[0].value,e):(r.length===0?e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:n.map(s=>s.issues.map(o=>fn(o,i,Ft())))}):e.issues.push({code:"invalid_union",input:e.value,inst:t,errors:[],inclusive:!1}),e)}var wp=O("$ZodXor",(n,e)=>{zo.init(n,e),e.inclusive=!1;let t=e.options.length===1?e.options[0]._zod.run:null;n._zod.parse=(i,r)=>{if(t)return t(i,r);let s=!1,o=[];for(let a of e.options){let c=a._zod.run({value:i.value,issues:[]},r);c instanceof Promise?(o.push(c),s=!0):o.push(c)}return s?Promise.all(o).then(a=>Q_(a,i,n,r)):Q_(o,i,n,r)}}),Ep=O("$ZodDiscriminatedUnion",(n,e)=>{e.inclusive=!1,zo.init(n,e);let t=n._zod.parse;ot(n._zod,"propValues",()=>{let r={};for(let s of e.options){let o=s._zod.propValues;if(!o||Object.keys(o).length===0)throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(s)}"`);for(let[a,c]of Object.entries(o)){r[a]||(r[a]=new Set);for(let l of c)r[a].add(l)}}return r});let i=ss(()=>{let r=e.options,s=new Map;for(let o of r){let a=o._zod.propValues?.[e.discriminator];if(!a||a.size===0)throw new Error(`Invalid discriminated union option at index "${e.options.indexOf(o)}"`);for(let c of a){if(s.has(c))throw new Error(`Duplicate discriminator value "${String(c)}"`);s.set(c,o)}}return s});n._zod.parse=(r,s)=>{let o=r.value;if(!Tr(o))return r.issues.push({code:"invalid_type",expected:"object",input:o,inst:n}),r;let a=i.value.get(o?.[e.discriminator]);return a?a._zod.run(r,s):e.unionFallback||s.direction==="backward"?t(r,s):(r.issues.push({code:"invalid_union",errors:[],note:"No matching discriminator",discriminator:e.discriminator,options:Array.from(i.value.keys()),input:o,path:[e.discriminator],inst:n}),r)}}),Tp=O("$ZodIntersection",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value,s=e.left._zod.run({value:r,issues:[]},i),o=e.right._zod.run({value:r,issues:[]},i);return s instanceof Promise||o instanceof Promise?Promise.all([s,o]).then(([c,l])=>ev(t,c,l)):ev(t,s,o)}});function kf(n,e){if(n===e)return{valid:!0,data:n};if(n instanceof Date&&e instanceof Date&&+n==+e)return{valid:!0,data:n};if(Xi(n)&&Xi(e)){let t=Object.keys(e),i=Object.keys(n).filter(s=>t.indexOf(s)!==-1),r={...n,...e};for(let s of i){let o=kf(n[s],e[s]);if(!o.valid)return{valid:!1,mergeErrorPath:[s,...o.mergeErrorPath]};r[s]=o.data}return{valid:!0,data:r}}if(Array.isArray(n)&&Array.isArray(e)){if(n.length!==e.length)return{valid:!1,mergeErrorPath:[]};let t=[];for(let i=0;i<n.length;i++){let r=n[i],s=e[i],o=kf(r,s);if(!o.valid)return{valid:!1,mergeErrorPath:[i,...o.mergeErrorPath]};t.push(o.data)}return{valid:!0,data:t}}return{valid:!1,mergeErrorPath:[]}}function ev(n,e,t){let i=new Map,r;for(let a of e.issues)if(a.code==="unrecognized_keys"){r??(r=a);for(let c of a.keys)i.has(c)||i.set(c,{}),i.get(c).l=!0}else n.issues.push(a);for(let a of t.issues)if(a.code==="unrecognized_keys")for(let c of a.keys)i.has(c)||i.set(c,{}),i.get(c).r=!0;else n.issues.push(a);let s=[...i].filter(([,a])=>a.l&&a.r).map(([a])=>a);if(s.length&&r&&n.issues.push({...r,keys:s}),qi(n))return n;let o=kf(e.value,t.value);if(!o.valid)throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`);return n.value=o.data,n}var zc=O("$ZodTuple",(n,e)=>{Ke.init(n,e);let t=e.items;n._zod.parse=(i,r)=>{let s=i.value;if(!Array.isArray(s))return i.issues.push({input:s,inst:n,expected:"tuple",code:"invalid_type"}),i;i.value=[];let o=[],a=tv(t,"optin"),c=tv(t,"optout");if(!e.rest){if(s.length<a)return i.issues.push({code:"too_small",minimum:a,inclusive:!0,input:s,inst:n,origin:"array"}),i;s.length>t.length&&i.issues.push({code:"too_big",maximum:t.length,inclusive:!0,input:s,inst:n,origin:"array"})}let l=new Array(t.length);for(let u=0;u<t.length;u++){let h=t[u]._zod.run({value:s[u],issues:[]},r);h instanceof Promise?o.push(h.then(d=>{l[u]=d})):l[u]=h}if(e.rest){let u=t.length-1,h=s.slice(t.length);for(let d of h){u++;let f=e.rest._zod.run({value:d,issues:[]},r);f instanceof Promise?o.push(f.then(m=>nv(m,i,u))):nv(f,i,u)}}return o.length?Promise.all(o).then(()=>iv(l,i,t,s,c)):iv(l,i,t,s,c)}});function tv(n,e){for(let t=n.length-1;t>=0;t--)if(n[t]._zod[e]!=="optional")return t+1;return 0}function nv(n,e,t){n.issues.length&&e.issues.push(...vn(t,n.issues)),e.value[t]=n.value}function iv(n,e,t,i,r){for(let s=0;s<t.length;s++){let o=n[s],a=s<i.length;if(o.issues.length){if(!a&&s>=r){e.value.length=s;break}e.issues.push(...vn(s,o.issues))}e.value[s]=o.value}for(let s=e.value.length-1;s>=i.length&&(t[s]._zod.optout==="optional"&&e.value[s]===void 0);s--)e.value.length=s;return e}var Ap=O("$ZodRecord",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!Xi(r))return t.issues.push({expected:"record",code:"invalid_type",input:r,inst:n}),t;let s=[],o=e.keyType._zod.values;if(o){t.value={};let a=new Set;for(let l of o)if(typeof l=="string"||typeof l=="number"||typeof l=="symbol"){a.add(typeof l=="number"?l.toString():l);let u=e.keyType._zod.run({value:l,issues:[]},i);if(u instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(u.issues.length){t.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map(f=>fn(f,i,Ft())),input:l,path:[l],inst:n});continue}let h=u.value,d=e.valueType._zod.run({value:r[l],issues:[]},i);d instanceof Promise?s.push(d.then(f=>{f.issues.length&&t.issues.push(...vn(l,f.issues)),t.value[h]=f.value})):(d.issues.length&&t.issues.push(...vn(l,d.issues)),t.value[h]=d.value)}let c;for(let l in r)a.has(l)||(c=c??[],c.push(l));c&&c.length>0&&t.issues.push({code:"unrecognized_keys",input:r,inst:n,keys:c})}else{t.value={};for(let a of Reflect.ownKeys(r)){if(a==="__proto__"||!Object.prototype.propertyIsEnumerable.call(r,a))continue;let c=e.keyType._zod.run({value:a,issues:[]},i);if(c instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(typeof a=="string"&&Tc.test(a)&&c.issues.length){let h=e.keyType._zod.run({value:Number(a),issues:[]},i);if(h instanceof Promise)throw new Error("Async schemas not supported in object keys currently");h.issues.length===0&&(c=h)}if(c.issues.length){e.mode==="loose"?t.value[a]=r[a]:t.issues.push({code:"invalid_key",origin:"record",issues:c.issues.map(h=>fn(h,i,Ft())),input:a,path:[a],inst:n});continue}let u=e.valueType._zod.run({value:r[a],issues:[]},i);u instanceof Promise?s.push(u.then(h=>{h.issues.length&&t.issues.push(...vn(a,h.issues)),t.value[c.value]=h.value})):(u.issues.length&&t.issues.push(...vn(a,u.issues)),t.value[c.value]=u.value)}}return s.length?Promise.all(s).then(()=>t):t}}),Rp=O("$ZodMap",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!(r instanceof Map))return t.issues.push({expected:"map",code:"invalid_type",input:r,inst:n}),t;let s=[];t.value=new Map;for(let[o,a]of r){let c=e.keyType._zod.run({value:o,issues:[]},i),l=e.valueType._zod.run({value:a,issues:[]},i);c instanceof Promise||l instanceof Promise?s.push(Promise.all([c,l]).then(([u,h])=>{rv(u,h,t,o,r,n,i)})):rv(c,l,t,o,r,n,i)}return s.length?Promise.all(s).then(()=>t):t}});function rv(n,e,t,i,r,s,o){n.issues.length&&(Eo.has(typeof i)?t.issues.push(...vn(i,n.issues)):t.issues.push({code:"invalid_key",origin:"map",input:r,inst:s,issues:n.issues.map(a=>fn(a,o,Ft()))})),e.issues.length&&(Eo.has(typeof i)?t.issues.push(...vn(i,e.issues)):t.issues.push({origin:"map",code:"invalid_element",input:r,inst:s,key:i,issues:e.issues.map(a=>fn(a,o,Ft()))})),t.value.set(n.value,e.value)}var Cp=O("$ZodSet",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;if(!(r instanceof Set))return t.issues.push({input:r,inst:n,expected:"set",code:"invalid_type"}),t;let s=[];t.value=new Set;for(let o of r){let a=e.valueType._zod.run({value:o,issues:[]},i);a instanceof Promise?s.push(a.then(c=>sv(c,t))):sv(a,t)}return s.length?Promise.all(s).then(()=>t):t}});function sv(n,e){n.issues.length&&e.issues.push(...n.issues),e.value.add(n.value)}var Pp=O("$ZodEnum",(n,e)=>{Ke.init(n,e);let t=Mo(e.entries),i=new Set(t);n._zod.values=i,n._zod.pattern=new RegExp(`^(${t.filter(r=>Eo.has(typeof r)).map(r=>typeof r=="string"?Fn(r):r.toString()).join("|")})$`),n._zod.parse=(r,s)=>{let o=r.value;return i.has(o)||r.issues.push({code:"invalid_value",values:t,input:o,inst:n}),r}}),Ip=O("$ZodLiteral",(n,e)=>{if(Ke.init(n,e),e.values.length===0)throw new Error("Cannot create literal schema with no valid values");let t=new Set(e.values);n._zod.values=t,n._zod.pattern=new RegExp(`^(${e.values.map(i=>typeof i=="string"?Fn(i):i?Fn(i.toString()):String(i)).join("|")})$`),n._zod.parse=(i,r)=>{let s=i.value;return t.has(s)||i.issues.push({code:"invalid_value",values:e.values,input:s,inst:n}),i}}),Dp=O("$ZodFile",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{let r=t.value;return r instanceof File||t.issues.push({expected:"file",code:"invalid_type",input:r,inst:n}),t}}),Np=O("$ZodTransform",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new $i(n.constructor.name);let r=e.transform(t.value,t);if(i.async)return(r instanceof Promise?r:Promise.resolve(r)).then(o=>(t.value=o,t.fallback=!0,t));if(r instanceof Promise)throw new Zn;return t.value=r,t.fallback=!0,t}});function ov(n,e){return e===void 0&&(n.issues.length||n.fallback)?{issues:[],value:void 0}:n}var Uc=O("$ZodOptional",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",n._zod.optout="optional",ot(n._zod,"values",()=>e.innerType._zod.values?new Set([...e.innerType._zod.values,void 0]):void 0),ot(n._zod,"pattern",()=>{let t=e.innerType._zod.pattern;return t?new RegExp(`^(${wo(t.source)})?$`):void 0}),n._zod.parse=(t,i)=>{if(e.innerType._zod.optin==="optional"){let r=t.value,s=e.innerType._zod.run(t,i);return s instanceof Promise?s.then(o=>ov(o,r)):ov(s,r)}return t.value===void 0?t:e.innerType._zod.run(t,i)}}),Lp=O("$ZodExactOptional",(n,e)=>{Uc.init(n,e),ot(n._zod,"values",()=>e.innerType._zod.values),ot(n._zod,"pattern",()=>e.innerType._zod.pattern),n._zod.parse=(t,i)=>e.innerType._zod.run(t,i)}),zp=O("$ZodNullable",(n,e)=>{Ke.init(n,e),ot(n._zod,"optin",()=>e.innerType._zod.optin),ot(n._zod,"optout",()=>e.innerType._zod.optout),ot(n._zod,"pattern",()=>{let t=e.innerType._zod.pattern;return t?new RegExp(`^(${wo(t.source)}|null)$`):void 0}),ot(n._zod,"values",()=>e.innerType._zod.values?new Set([...e.innerType._zod.values,null]):void 0),n._zod.parse=(t,i)=>t.value===null?t:e.innerType._zod.run(t,i)}),Up=O("$ZodDefault",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);if(t.value===void 0)return t.value=e.defaultValue,t;let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>av(s,e)):av(r,e)}});function av(n,e){return n.value===void 0&&(n.value=e.defaultValue),n}var Op=O("$ZodPrefault",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>(i.direction==="backward"||t.value===void 0&&(t.value=e.defaultValue),e.innerType._zod.run(t,i))}),Fp=O("$ZodNonOptional",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>{let t=e.innerType._zod.values;return t?new Set([...t].filter(i=>i!==void 0)):void 0}),n._zod.parse=(t,i)=>{let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>cv(s,n)):cv(r,n)}});function cv(n,e){return!n.issues.length&&n.value===void 0&&n.issues.push({code:"invalid_type",expected:"nonoptional",input:n.value,inst:e}),n}var kp=O("$ZodSuccess",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new $i("ZodSuccess");let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>(t.value=s.issues.length===0,t)):(t.value=r.issues.length===0,t)}}),Bp=O("$ZodCatch",(n,e)=>{Ke.init(n,e),n._zod.optin="optional",ot(n._zod,"optout",()=>e.innerType._zod.optout),ot(n._zod,"values",()=>e.innerType._zod.values),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(s=>(t.value=s.value,s.issues.length&&(t.value=e.catchValue({...t,error:{issues:s.issues.map(o=>fn(o,i,Ft()))},input:t.value}),t.issues=[],t.fallback=!0),t)):(t.value=r.value,r.issues.length&&(t.value=e.catchValue({...t,error:{issues:r.issues.map(s=>fn(s,i,Ft()))},input:t.value}),t.issues=[],t.fallback=!0),t)}}),Hp=O("$ZodNaN",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>((typeof t.value!="number"||!Number.isNaN(t.value))&&t.issues.push({input:t.value,inst:n,expected:"nan",code:"invalid_type"}),t)}),Oc=O("$ZodPipe",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>e.in._zod.values),ot(n._zod,"optin",()=>e.in._zod.optin),ot(n._zod,"optout",()=>e.out._zod.optout),ot(n._zod,"propValues",()=>e.in._zod.propValues),n._zod.parse=(t,i)=>{if(i.direction==="backward"){let s=e.out._zod.run(t,i);return s instanceof Promise?s.then(o=>Cc(o,e.in,i)):Cc(s,e.in,i)}let r=e.in._zod.run(t,i);return r instanceof Promise?r.then(s=>Cc(s,e.out,i)):Cc(r,e.out,i)}});function Cc(n,e,t){return n.issues.length?(n.aborted=!0,n):e._zod.run({value:n.value,issues:n.issues,fallback:n.fallback},t)}var Uo=O("$ZodCodec",(n,e)=>{Ke.init(n,e),ot(n._zod,"values",()=>e.in._zod.values),ot(n._zod,"optin",()=>e.in._zod.optin),ot(n._zod,"optout",()=>e.out._zod.optout),ot(n._zod,"propValues",()=>e.in._zod.propValues),n._zod.parse=(t,i)=>{if((i.direction||"forward")==="forward"){let s=e.in._zod.run(t,i);return s instanceof Promise?s.then(o=>Pc(o,e,i)):Pc(s,e,i)}else{let s=e.out._zod.run(t,i);return s instanceof Promise?s.then(o=>Pc(o,e,i)):Pc(s,e,i)}}});function Pc(n,e,t){if(n.issues.length)return n.aborted=!0,n;if((t.direction||"forward")==="forward"){let r=e.transform(n.value,n);return r instanceof Promise?r.then(s=>Ic(n,s,e.out,t)):Ic(n,r,e.out,t)}else{let r=e.reverseTransform(n.value,n);return r instanceof Promise?r.then(s=>Ic(n,s,e.in,t)):Ic(n,r,e.in,t)}}function Ic(n,e,t,i){return n.issues.length?(n.aborted=!0,n):t._zod.run({value:e,issues:n.issues},i)}var Gp=O("$ZodPreprocess",(n,e)=>{Oc.init(n,e)}),Vp=O("$ZodReadonly",(n,e)=>{Ke.init(n,e),ot(n._zod,"propValues",()=>e.innerType._zod.propValues),ot(n._zod,"values",()=>e.innerType._zod.values),ot(n._zod,"optin",()=>e.innerType?._zod?.optin),ot(n._zod,"optout",()=>e.innerType?._zod?.optout),n._zod.parse=(t,i)=>{if(i.direction==="backward")return e.innerType._zod.run(t,i);let r=e.innerType._zod.run(t,i);return r instanceof Promise?r.then(lv):lv(r)}});function lv(n){return n.value=Object.freeze(n.value),n}var $p=O("$ZodTemplateLiteral",(n,e)=>{Ke.init(n,e);let t=[];for(let i of e.parts)if(typeof i=="object"&&i!==null){if(!i._zod.pattern)throw new Error(`Invalid template literal part, no pattern found: ${[...i._zod.traits].shift()}`);let r=i._zod.pattern instanceof RegExp?i._zod.pattern.source:i._zod.pattern;if(!r)throw new Error(`Invalid template literal part: ${i._zod.traits}`);let s=r.startsWith("^")?1:0,o=r.endsWith("$")?r.length-1:r.length;t.push(r.slice(s,o))}else if(i===null||Ld.has(typeof i))t.push(Fn(`${i}`));else throw new Error(`Invalid template literal part: ${i}`);n._zod.pattern=new RegExp(`^${t.join("")}$`),n._zod.parse=(i,r)=>typeof i.value!="string"?(i.issues.push({input:i.value,inst:n,expected:"string",code:"invalid_type"}),i):(n._zod.pattern.lastIndex=0,n._zod.pattern.test(i.value)||i.issues.push({input:i.value,inst:n,code:"invalid_format",format:e.format??"template_literal",pattern:n._zod.pattern.source}),i)}),Wp=O("$ZodFunction",(n,e)=>(Ke.init(n,e),n._def=e,n._zod.def=e,n.implement=t=>{if(typeof t!="function")throw new Error("implement() must be called with a function");return function(...i){let r=n._def.input?mc(n._def.input,i):i,s=Reflect.apply(t,this,r);return n._def.output?mc(n._def.output,s):s}},n.implementAsync=t=>{if(typeof t!="function")throw new Error("implementAsync() must be called with a function");return async function(...i){let r=n._def.input?await gc(n._def.input,i):i,s=await Reflect.apply(t,this,r);return n._def.output?await gc(n._def.output,s):s}},n._zod.parse=(t,i)=>typeof t.value!="function"?(t.issues.push({code:"invalid_type",expected:"function",input:t.value,inst:n}),t):(n._def.output&&n._def.output._zod.def.type==="promise"?t.value=n.implementAsync(t.value):t.value=n.implement(t.value),t),n.input=(...t)=>{let i=n.constructor;return Array.isArray(t[0])?new i({type:"function",input:new zc({type:"tuple",items:t[0],rest:t[1]}),output:n._def.output}):new i({type:"function",input:t[0],output:n._def.output})},n.output=t=>{let i=n.constructor;return new i({type:"function",input:n._def.input,output:t})},n)),Zp=O("$ZodPromise",(n,e)=>{Ke.init(n,e),n._zod.parse=(t,i)=>Promise.resolve(t.value).then(r=>e.innerType._zod.run({value:r,issues:[]},i))}),Xp=O("$ZodLazy",(n,e)=>{Ke.init(n,e),ot(n._zod,"innerType",()=>{let t=e;return t._cachedInner||(t._cachedInner=e.getter()),t._cachedInner}),ot(n._zod,"pattern",()=>n._zod.innerType?._zod?.pattern),ot(n._zod,"propValues",()=>n._zod.innerType?._zod?.propValues),ot(n._zod,"optin",()=>n._zod.innerType?._zod?.optin??void 0),ot(n._zod,"optout",()=>n._zod.innerType?._zod?.optout??void 0),n._zod.parse=(t,i)=>n._zod.innerType._zod.run(t,i)}),qp=O("$ZodCustom",(n,e)=>{Ct.init(n,e),Ke.init(n,e),n._zod.parse=(t,i)=>t,n._zod.check=t=>{let i=t.value,r=e.fn(i);if(r instanceof Promise)return r.then(s=>uv(s,t,i,n));uv(r,t,i,n)}});function uv(n,e,t,i){if(!n){let r={code:"custom",input:t,inst:i,path:[...i._zod.def.path??[]],continue:!i._zod.def.abort};i._zod.def.params&&(r.params=i._zod.def.params),e.issues.push(os(r))}}var Oo={};vi(Oo,{en:()=>Fc});var cE=()=>{let n={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function e(r){return n[r]??null}let t={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",jwt:"JWT",template_literal:"input"},i={nan:"NaN"};return r=>{switch(r.code){case"invalid_type":{let s=i[r.expected]??r.expected,o=kd(r.input),a=i[o]??o;return`Invalid input: expected ${s}, received ${a}`}case"invalid_value":return r.values.length===1?`Invalid input: expected ${pc(r.values[0])}`:`Invalid option: expected one of ${hc(r.values,"|")}`;case"too_big":{let s=r.inclusive?"<=":"<",o=e(r.origin);return o?`Too big: expected ${r.origin??"value"} to have ${s}${r.maximum.toString()} ${o.unit??"elements"}`:`Too big: expected ${r.origin??"value"} to be ${s}${r.maximum.toString()}`}case"too_small":{let s=r.inclusive?">=":">",o=e(r.origin);return o?`Too small: expected ${r.origin} to have ${s}${r.minimum.toString()} ${o.unit}`:`Too small: expected ${r.origin} to be ${s}${r.minimum.toString()}`}case"invalid_format":{let s=r;return s.format==="starts_with"?`Invalid string: must start with "${s.prefix}"`:s.format==="ends_with"?`Invalid string: must end with "${s.suffix}"`:s.format==="includes"?`Invalid string: must include "${s.includes}"`:s.format==="regex"?`Invalid string: must match pattern ${s.pattern}`:`Invalid ${t[s.format]??r.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${r.divisor}`;case"unrecognized_keys":return`Unrecognized key${r.keys.length>1?"s":""}: ${hc(r.keys,", ")}`;case"invalid_key":return`Invalid key in ${r.origin}`;case"invalid_union":return r.options&&Array.isArray(r.options)&&r.options.length>0?`Invalid discriminator value. Expected ${r.options.map(o=>`'${o}'`).join(" | ")}`:"Invalid input";case"invalid_element":return`Invalid value in ${r.origin}`;default:return"Invalid input"}}};function Fc(){return{localeError:cE()}}var gv,Yp=Symbol("ZodOutput"),Jp=Symbol("ZodInput"),kc=class{constructor(){this._map=new WeakMap,this._idmap=new Map}add(e,...t){let i=t[0];return this._map.set(e,i),i&&typeof i=="object"&&"id"in i&&this._idmap.set(i.id,e),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(e){let t=this._map.get(e);return t&&typeof t=="object"&&"id"in t&&this._idmap.delete(t.id),this._map.delete(e),this}get(e){let t=e._zod.parent;if(t){let i={...this.get(t)??{}};delete i.id;let r={...i,...this._map.get(e)};return Object.keys(r).length?r:void 0}return this._map.get(e)}has(e){return this._map.has(e)}};function Bc(){return new kc}(gv=globalThis).__zod_globalRegistry??(gv.__zod_globalRegistry=Bc());var Jt=globalThis.__zod_globalRegistry;function jp(n,e){return new n({type:"string",...de(e)})}function Kp(n,e){return new n({type:"string",coerce:!0,...de(e)})}function Hc(n,e){return new n({type:"string",format:"email",check:"string_format",abort:!1,...de(e)})}function Fo(n,e){return new n({type:"string",format:"guid",check:"string_format",abort:!1,...de(e)})}function Gc(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,...de(e)})}function Vc(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...de(e)})}function $c(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...de(e)})}function Wc(n,e){return new n({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...de(e)})}function ko(n,e){return new n({type:"string",format:"url",check:"string_format",abort:!1,...de(e)})}function Zc(n,e){return new n({type:"string",format:"emoji",check:"string_format",abort:!1,...de(e)})}function Xc(n,e){return new n({type:"string",format:"nanoid",check:"string_format",abort:!1,...de(e)})}function qc(n,e){return new n({type:"string",format:"cuid",check:"string_format",abort:!1,...de(e)})}function Yc(n,e){return new n({type:"string",format:"cuid2",check:"string_format",abort:!1,...de(e)})}function Jc(n,e){return new n({type:"string",format:"ulid",check:"string_format",abort:!1,...de(e)})}function jc(n,e){return new n({type:"string",format:"xid",check:"string_format",abort:!1,...de(e)})}function Kc(n,e){return new n({type:"string",format:"ksuid",check:"string_format",abort:!1,...de(e)})}function Qc(n,e){return new n({type:"string",format:"ipv4",check:"string_format",abort:!1,...de(e)})}function el(n,e){return new n({type:"string",format:"ipv6",check:"string_format",abort:!1,...de(e)})}function Qp(n,e){return new n({type:"string",format:"mac",check:"string_format",abort:!1,...de(e)})}function tl(n,e){return new n({type:"string",format:"cidrv4",check:"string_format",abort:!1,...de(e)})}function nl(n,e){return new n({type:"string",format:"cidrv6",check:"string_format",abort:!1,...de(e)})}function il(n,e){return new n({type:"string",format:"base64",check:"string_format",abort:!1,...de(e)})}function rl(n,e){return new n({type:"string",format:"base64url",check:"string_format",abort:!1,...de(e)})}function sl(n,e){return new n({type:"string",format:"e164",check:"string_format",abort:!1,...de(e)})}function ol(n,e){return new n({type:"string",format:"jwt",check:"string_format",abort:!1,...de(e)})}var em={Any:null,Minute:-1,Second:0,Millisecond:3,Microsecond:6};function tm(n,e){return new n({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...de(e)})}function nm(n,e){return new n({type:"string",format:"date",check:"string_format",...de(e)})}function im(n,e){return new n({type:"string",format:"time",check:"string_format",precision:null,...de(e)})}function rm(n,e){return new n({type:"string",format:"duration",check:"string_format",...de(e)})}function sm(n,e){return new n({type:"number",checks:[],...de(e)})}function om(n,e){return new n({type:"number",coerce:!0,checks:[],...de(e)})}function am(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"safeint",...de(e)})}function cm(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"float32",...de(e)})}function lm(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"float64",...de(e)})}function um(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"int32",...de(e)})}function hm(n,e){return new n({type:"number",check:"number_format",abort:!1,format:"uint32",...de(e)})}function dm(n,e){return new n({type:"boolean",...de(e)})}function fm(n,e){return new n({type:"boolean",coerce:!0,...de(e)})}function pm(n,e){return new n({type:"bigint",...de(e)})}function mm(n,e){return new n({type:"bigint",coerce:!0,...de(e)})}function gm(n,e){return new n({type:"bigint",check:"bigint_format",abort:!1,format:"int64",...de(e)})}function xm(n,e){return new n({type:"bigint",check:"bigint_format",abort:!1,format:"uint64",...de(e)})}function _m(n,e){return new n({type:"symbol",...de(e)})}function vm(n,e){return new n({type:"undefined",...de(e)})}function ym(n,e){return new n({type:"null",...de(e)})}function bm(n){return new n({type:"any"})}function Sm(n){return new n({type:"unknown"})}function Mm(n,e){return new n({type:"never",...de(e)})}function wm(n,e){return new n({type:"void",...de(e)})}function Em(n,e){return new n({type:"date",...de(e)})}function Tm(n,e){return new n({type:"date",coerce:!0,...de(e)})}function Am(n,e){return new n({type:"nan",...de(e)})}function ri(n,e){return new Ac({check:"less_than",...de(e),value:n,inclusive:!1})}function Pn(n,e){return new Ac({check:"less_than",...de(e),value:n,inclusive:!0})}function si(n,e){return new Rc({check:"greater_than",...de(e),value:n,inclusive:!1})}function pn(n,e){return new Rc({check:"greater_than",...de(e),value:n,inclusive:!0})}function al(n){return si(0,n)}function cl(n){return ri(0,n)}function ll(n){return Pn(0,n)}function ul(n){return pn(0,n)}function Yi(n,e){return new yf({check:"multiple_of",...de(e),value:n})}function Ji(n,e){return new Mf({check:"max_size",...de(e),maximum:n})}function oi(n,e){return new wf({check:"min_size",...de(e),minimum:n})}function Cr(n,e){return new Ef({check:"size_equals",...de(e),size:n})}function Pr(n,e){return new Tf({check:"max_length",...de(e),maximum:n})}function Si(n,e){return new Af({check:"min_length",...de(e),minimum:n})}function Ir(n,e){return new Rf({check:"length_equals",...de(e),length:n})}function ds(n,e){return new Cf({check:"string_format",format:"regex",...de(e),pattern:n})}function fs(n){return new Pf({check:"string_format",format:"lowercase",...de(n)})}function ps(n){return new If({check:"string_format",format:"uppercase",...de(n)})}function ms(n,e){return new Df({check:"string_format",format:"includes",...de(e),includes:n})}function gs(n,e){return new Nf({check:"string_format",format:"starts_with",...de(e),prefix:n})}function xs(n,e){return new Lf({check:"string_format",format:"ends_with",...de(e),suffix:n})}function hl(n,e,t){return new zf({check:"property",property:n,schema:e,...de(t)})}function _s(n,e){return new Uf({check:"mime_type",mime:n,...de(e)})}function Xn(n){return new Of({check:"overwrite",tx:n})}function vs(n){return Xn(e=>e.normalize(n))}function ys(){return Xn(n=>n.trim())}function bs(){return Xn(n=>n.toLowerCase())}function Ss(){return Xn(n=>n.toUpperCase())}function Ms(){return Xn(n=>Id(n))}function Rm(n,e,t){return new n({type:"array",element:e,...de(t)})}function uE(n,e,t){return new n({type:"union",options:e,...de(t)})}function hE(n,e,t){return new n({type:"union",options:e,inclusive:!1,...de(t)})}function dE(n,e,t,i){return new n({type:"union",options:t,discriminator:e,...de(i)})}function fE(n,e,t){return new n({type:"intersection",left:e,right:t})}function pE(n,e,t,i){let r=t instanceof Ke,s=r?i:t,o=r?t:null;return new n({type:"tuple",items:e,rest:o,...de(s)})}function mE(n,e,t,i){return new n({type:"record",keyType:e,valueType:t,...de(i)})}function gE(n,e,t,i){return new n({type:"map",keyType:e,valueType:t,...de(i)})}function xE(n,e,t){return new n({type:"set",valueType:e,...de(t)})}function _E(n,e,t){let i=Array.isArray(e)?Object.fromEntries(e.map(r=>[r,r])):e;return new n({type:"enum",entries:i,...de(t)})}function vE(n,e,t){return new n({type:"enum",entries:e,...de(t)})}function yE(n,e,t){return new n({type:"literal",values:Array.isArray(e)?e:[e],...de(t)})}function Cm(n,e){return new n({type:"file",...de(e)})}function bE(n,e){return new n({type:"transform",transform:e})}function SE(n,e){return new n({type:"optional",innerType:e})}function ME(n,e){return new n({type:"nullable",innerType:e})}function wE(n,e,t){return new n({type:"default",innerType:e,get defaultValue(){return typeof t=="function"?t():Nd(t)}})}function EE(n,e,t){return new n({type:"nonoptional",innerType:e,...de(t)})}function TE(n,e){return new n({type:"success",innerType:e})}function AE(n,e,t){return new n({type:"catch",innerType:e,catchValue:typeof t=="function"?t:()=>t})}function RE(n,e,t){return new n({type:"pipe",in:e,out:t})}function CE(n,e){return new n({type:"readonly",innerType:e})}function PE(n,e,t){return new n({type:"template_literal",parts:e,...de(t)})}function IE(n,e){return new n({type:"lazy",getter:e})}function DE(n,e){return new n({type:"promise",innerType:e})}function Pm(n,e,t){let i=de(t);return i.abort??(i.abort=!0),new n({type:"custom",check:"custom",fn:e,...i})}function Im(n,e,t){return new n({type:"custom",check:"custom",fn:e,...de(t)})}function Dm(n,e){let t=xv(i=>(i.addIssue=r=>{if(typeof r=="string")i.issues.push(os(r,i.value,t._zod.def));else{let s=r;s.fatal&&(s.continue=!1),s.code??(s.code="custom"),s.input??(s.input=i.value),s.inst??(s.inst=t),s.continue??(s.continue=!t._zod.def.abort),i.issues.push(os(s))}},n(i.value,i)),e);return t}function xv(n,e){let t=new Ct({check:"custom",...de(e)});return t._zod.check=n,t}function Nm(n){let e=new Ct({check:"describe"});return e._zod.onattach=[t=>{let i=Jt.get(t)??{};Jt.add(t,{...i,description:n})}],e._zod.check=()=>{},e}function Lm(n){let e=new Ct({check:"meta"});return e._zod.onattach=[t=>{let i=Jt.get(t)??{};Jt.add(t,{...i,...n})}],e._zod.check=()=>{},e}function zm(n,e){let t=de(e),i=t.truthy??["true","1","yes","on","y","enabled"],r=t.falsy??["false","0","no","off","n","disabled"];t.case!=="sensitive"&&(i=i.map(f=>typeof f=="string"?f.toLowerCase():f),r=r.map(f=>typeof f=="string"?f.toLowerCase():f));let s=new Set(i),o=new Set(r),a=n.Codec??Uo,c=n.Boolean??Lo,l=n.String??Rr,u=new l({type:"string",error:t.error}),h=new c({type:"boolean",error:t.error}),d=new a({type:"pipe",in:u,out:h,transform:((f,m)=>{let y=f;return t.case!=="sensitive"&&(y=y.toLowerCase()),s.has(y)?!0:o.has(y)?!1:(m.issues.push({code:"invalid_value",expected:"stringbool",values:[...s,...o],input:m.value,inst:d,continue:!1}),{})}),reverseTransform:((f,m)=>f===!0?i[0]||"true":r[0]||"false"),error:t.error});return d}function ws(n,e,t,i={}){let r=de(i),s={...de(i),check:"string_format",type:"string",format:e,fn:typeof t=="function"?t:a=>t.test(a),...r};return t instanceof RegExp&&(s.pattern=t),new n(s)}function ji(n){let e=n?.target??"draft-2020-12";return e==="draft-4"&&(e="draft-04"),e==="draft-7"&&(e="draft-07"),{processors:n.processors??{},metadataRegistry:n?.metadata??Jt,target:e,unrepresentable:n?.unrepresentable??"throw",override:n?.override??(()=>{}),io:n?.io??"output",counter:0,seen:new Map,cycles:n?.cycles??"ref",reused:n?.reused??"inline",external:n?.external??void 0}}function bt(n,e,t={path:[],schemaPath:[]}){var i;let r=n._zod.def,s=e.seen.get(n);if(s)return s.count++,t.schemaPath.includes(n)&&(s.cycle=t.path),s.schema;let o={schema:{},count:1,cycle:void 0,path:t.path};e.seen.set(n,o);let a=n._zod.toJSONSchema?.();if(a)o.schema=a;else{let u={...t,schemaPath:[...t.schemaPath,n],path:t.path};if(n._zod.processJSONSchema)n._zod.processJSONSchema(e,o.schema,u);else{let d=o.schema,f=e.processors[r.type];if(!f)throw new Error(`[toJSONSchema]: Non-representable type encountered: ${r.type}`);f(n,e,d,u)}let h=n._zod.parent;h&&(o.ref||(o.ref=h),bt(h,e,u),e.seen.get(h).isParent=!0)}let c=e.metadataRegistry.get(n);return c&&Object.assign(o.schema,c),e.io==="input"&&mn(n)&&(delete o.schema.examples,delete o.schema.default),e.io==="input"&&"_prefault"in o.schema&&((i=o.schema).default??(i.default=o.schema._prefault)),delete o.schema._prefault,e.seen.get(n).schema}function Ki(n,e){let t=n.seen.get(e);if(!t)throw new Error("Unprocessed schema. This is a bug in Zod.");let i=new Map;for(let o of n.seen.entries()){let a=n.metadataRegistry.get(o[0])?.id;if(a){let c=i.get(a);if(c&&c!==o[0])throw new Error(`Duplicate schema id "${a}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);i.set(a,o[0])}}let r=o=>{let a=n.target==="draft-2020-12"?"$defs":"definitions";if(n.external){let h=n.external.registry.get(o[0])?.id,d=n.external.uri??(m=>m);if(h)return{ref:d(h)};let f=o[1].defId??o[1].schema.id??`schema${n.counter++}`;return o[1].defId=f,{defId:f,ref:`${d("__shared")}#/${a}/${f}`}}if(o[1]===t)return{ref:"#"};let l=`#/${a}/`,u=o[1].schema.id??`__schema${n.counter++}`;return{defId:u,ref:l+u}},s=o=>{if(o[1].schema.$ref)return;let a=o[1],{ref:c,defId:l}=r(o);a.def={...a.schema},l&&(a.defId=l);let u=a.schema;for(let h in u)delete u[h];u.$ref=c};if(n.cycles==="throw")for(let o of n.seen.entries()){let a=o[1];if(a.cycle)throw new Error(`Cycle detected: #/${a.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let o of n.seen.entries()){let a=o[1];if(e===o[0]){s(o);continue}if(n.external){let l=n.external.registry.get(o[0])?.id;if(e!==o[0]&&l){s(o);continue}}if(n.metadataRegistry.get(o[0])?.id){s(o);continue}if(a.cycle){s(o);continue}if(a.count>1&&n.reused==="ref"){s(o);continue}}}function Qi(n,e){let t=n.seen.get(e);if(!t)throw new Error("Unprocessed schema. This is a bug in Zod.");let i=a=>{let c=n.seen.get(a);if(c.ref===null)return;let l=c.def??c.schema,u={...l},h=c.ref;if(c.ref=null,h){i(h);let f=n.seen.get(h),m=f.schema;if(m.$ref&&(n.target==="draft-07"||n.target==="draft-04"||n.target==="openapi-3.0")?(l.allOf=l.allOf??[],l.allOf.push(m)):Object.assign(l,m),Object.assign(l,u),a._zod.parent===h)for(let g in l)g==="$ref"||g==="allOf"||g in u||delete l[g];if(m.$ref&&f.def)for(let g in l)g==="$ref"||g==="allOf"||g in f.def&&JSON.stringify(l[g])===JSON.stringify(f.def[g])&&delete l[g]}let d=a._zod.parent;if(d&&d!==h){i(d);let f=n.seen.get(d);if(f?.schema.$ref&&(l.$ref=f.schema.$ref,f.def))for(let m in l)m==="$ref"||m==="allOf"||m in f.def&&JSON.stringify(l[m])===JSON.stringify(f.def[m])&&delete l[m]}n.override({zodSchema:a,jsonSchema:l,path:c.path??[]})};for(let a of[...n.seen.entries()].reverse())i(a[0]);let r={};if(n.target==="draft-2020-12"?r.$schema="https://json-schema.org/draft/2020-12/schema":n.target==="draft-07"?r.$schema="http://json-schema.org/draft-07/schema#":n.target==="draft-04"?r.$schema="http://json-schema.org/draft-04/schema#":n.target,n.external?.uri){let a=n.external.registry.get(e)?.id;if(!a)throw new Error("Schema is missing an `id` property");r.$id=n.external.uri(a)}Object.assign(r,t.def??t.schema);let s=n.metadataRegistry.get(e)?.id;s!==void 0&&r.id===s&&delete r.id;let o=n.external?.defs??{};for(let a of n.seen.entries()){let c=a[1];c.def&&c.defId&&(c.def.id===c.defId&&delete c.def.id,o[c.defId]=c.def)}n.external||Object.keys(o).length>0&&(n.target==="draft-2020-12"?r.$defs=o:r.definitions=o);try{let a=JSON.parse(JSON.stringify(r));return Object.defineProperty(a,"~standard",{value:{...e["~standard"],jsonSchema:{input:Es(e,"input",n.processors),output:Es(e,"output",n.processors)}},enumerable:!1,writable:!1}),a}catch{throw new Error("Error converting schema to JSON.")}}function mn(n,e){let t=e??{seen:new Set};if(t.seen.has(n))return!1;t.seen.add(n);let i=n._zod.def;if(i.type==="transform")return!0;if(i.type==="array")return mn(i.element,t);if(i.type==="set")return mn(i.valueType,t);if(i.type==="lazy")return mn(i.getter(),t);if(i.type==="promise"||i.type==="optional"||i.type==="nonoptional"||i.type==="nullable"||i.type==="readonly"||i.type==="default"||i.type==="prefault")return mn(i.innerType,t);if(i.type==="intersection")return mn(i.left,t)||mn(i.right,t);if(i.type==="record"||i.type==="map")return mn(i.keyType,t)||mn(i.valueType,t);if(i.type==="pipe")return n._zod.traits.has("$ZodCodec")?!0:mn(i.in,t)||mn(i.out,t);if(i.type==="object"){for(let r in i.shape)if(mn(i.shape[r],t))return!0;return!1}if(i.type==="union"){for(let r of i.options)if(mn(r,t))return!0;return!1}if(i.type==="tuple"){for(let r of i.items)if(mn(r,t))return!0;return!!(i.rest&&mn(i.rest,t))}return!1}var Um=(n,e={})=>t=>{let i=ji({...t,processors:e});return bt(n,i),Ki(i,n),Qi(i,n)},Es=(n,e,t={})=>i=>{let{libraryOptions:r,target:s}=i??{},o=ji({...r??{},target:s,io:e,processors:t});return bt(n,o),Ki(o,n),Qi(o,n)};var NE={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},Om=(n,e,t,i)=>{let r=t;r.type="string";let{minimum:s,maximum:o,format:a,patterns:c,contentEncoding:l}=n._zod.bag;if(typeof s=="number"&&(r.minLength=s),typeof o=="number"&&(r.maxLength=o),a&&(r.format=NE[a]??a,r.format===""&&delete r.format,a==="time"&&delete r.format),l&&(r.contentEncoding=l),c&&c.size>0){let u=[...c];u.length===1?r.pattern=u[0].source:u.length>1&&(r.allOf=[...u.map(h=>({...e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0"?{type:"string"}:{},pattern:h.source}))])}},Fm=(n,e,t,i)=>{let r=t,{minimum:s,maximum:o,format:a,multipleOf:c,exclusiveMaximum:l,exclusiveMinimum:u}=n._zod.bag;typeof a=="string"&&a.includes("int")?r.type="integer":r.type="number";let h=typeof u=="number"&&u>=(s??Number.NEGATIVE_INFINITY),d=typeof l=="number"&&l<=(o??Number.POSITIVE_INFINITY),f=e.target==="draft-04"||e.target==="openapi-3.0";h?f?(r.minimum=u,r.exclusiveMinimum=!0):r.exclusiveMinimum=u:typeof s=="number"&&(r.minimum=s),d?f?(r.maximum=l,r.exclusiveMaximum=!0):r.exclusiveMaximum=l:typeof o=="number"&&(r.maximum=o),typeof c=="number"&&(r.multipleOf=c)},km=(n,e,t,i)=>{t.type="boolean"},Bm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("BigInt cannot be represented in JSON Schema")},Hm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Symbols cannot be represented in JSON Schema")},Gm=(n,e,t,i)=>{e.target==="openapi-3.0"?(t.type="string",t.nullable=!0,t.enum=[null]):t.type="null"},Vm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Undefined cannot be represented in JSON Schema")},$m=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Void cannot be represented in JSON Schema")},Wm=(n,e,t,i)=>{t.not={}},Zm=(n,e,t,i)=>{},Xm=(n,e,t,i)=>{},qm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Date cannot be represented in JSON Schema")},Ym=(n,e,t,i)=>{let r=n._zod.def,s=Mo(r.entries);s.every(o=>typeof o=="number")&&(t.type="number"),s.every(o=>typeof o=="string")&&(t.type="string"),t.enum=s},Jm=(n,e,t,i)=>{let r=n._zod.def,s=[];for(let o of r.values)if(o===void 0){if(e.unrepresentable==="throw")throw new Error("Literal `undefined` cannot be represented in JSON Schema")}else if(typeof o=="bigint"){if(e.unrepresentable==="throw")throw new Error("BigInt literals cannot be represented in JSON Schema");s.push(Number(o))}else s.push(o);if(s.length!==0)if(s.length===1){let o=s[0];t.type=o===null?"null":typeof o,e.target==="draft-04"||e.target==="openapi-3.0"?t.enum=[o]:t.const=o}else s.every(o=>typeof o=="number")&&(t.type="number"),s.every(o=>typeof o=="string")&&(t.type="string"),s.every(o=>typeof o=="boolean")&&(t.type="boolean"),s.every(o=>o===null)&&(t.type="null"),t.enum=s},jm=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("NaN cannot be represented in JSON Schema")},Km=(n,e,t,i)=>{let r=t,s=n._zod.pattern;if(!s)throw new Error("Pattern not found in template literal");r.type="string",r.pattern=s.source},Qm=(n,e,t,i)=>{let r=t,s={type:"string",format:"binary",contentEncoding:"binary"},{minimum:o,maximum:a,mime:c}=n._zod.bag;o!==void 0&&(s.minLength=o),a!==void 0&&(s.maxLength=a),c?c.length===1?(s.contentMediaType=c[0],Object.assign(r,s)):(Object.assign(r,s),r.anyOf=c.map(l=>({contentMediaType:l}))):Object.assign(r,s)},e0=(n,e,t,i)=>{t.type="boolean"},t0=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Custom types cannot be represented in JSON Schema")},n0=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Function types cannot be represented in JSON Schema")},i0=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Transforms cannot be represented in JSON Schema")},r0=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Map cannot be represented in JSON Schema")},s0=(n,e,t,i)=>{if(e.unrepresentable==="throw")throw new Error("Set cannot be represented in JSON Schema")},o0=(n,e,t,i)=>{let r=t,s=n._zod.def,{minimum:o,maximum:a}=n._zod.bag;typeof o=="number"&&(r.minItems=o),typeof a=="number"&&(r.maxItems=a),r.type="array",r.items=bt(s.element,e,{...i,path:[...i.path,"items"]})},a0=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="object",r.properties={};let o=s.shape;for(let l in o)r.properties[l]=bt(o[l],e,{...i,path:[...i.path,"properties",l]});let a=new Set(Object.keys(o)),c=new Set([...a].filter(l=>{let u=s.shape[l]._zod;return e.io==="input"?u.optin===void 0:u.optout===void 0}));c.size>0&&(r.required=Array.from(c)),s.catchall?._zod.def.type==="never"?r.additionalProperties=!1:s.catchall?s.catchall&&(r.additionalProperties=bt(s.catchall,e,{...i,path:[...i.path,"additionalProperties"]})):e.io==="output"&&(r.additionalProperties=!1)},fl=(n,e,t,i)=>{let r=n._zod.def,s=r.inclusive===!1,o=r.options.map((a,c)=>bt(a,e,{...i,path:[...i.path,s?"oneOf":"anyOf",c]}));s?t.oneOf=o:t.anyOf=o},c0=(n,e,t,i)=>{let r=n._zod.def,s=bt(r.left,e,{...i,path:[...i.path,"allOf",0]}),o=bt(r.right,e,{...i,path:[...i.path,"allOf",1]}),a=l=>"allOf"in l&&Object.keys(l).length===1,c=[...a(s)?s.allOf:[s],...a(o)?o.allOf:[o]];t.allOf=c},l0=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="array";let o=e.target==="draft-2020-12"?"prefixItems":"items",a=e.target==="draft-2020-12"||e.target==="openapi-3.0"?"items":"additionalItems",c=s.items.map((d,f)=>bt(d,e,{...i,path:[...i.path,o,f]})),l=s.rest?bt(s.rest,e,{...i,path:[...i.path,a,...e.target==="openapi-3.0"?[s.items.length]:[]]}):null;e.target==="draft-2020-12"?(r.prefixItems=c,l&&(r.items=l)):e.target==="openapi-3.0"?(r.items={anyOf:c},l&&r.items.anyOf.push(l),r.minItems=c.length,l||(r.maxItems=c.length)):(r.items=c,l&&(r.additionalItems=l));let{minimum:u,maximum:h}=n._zod.bag;typeof u=="number"&&(r.minItems=u),typeof h=="number"&&(r.maxItems=h)},u0=(n,e,t,i)=>{let r=t,s=n._zod.def;r.type="object";let o=s.keyType,c=o._zod.bag?.patterns;if(s.mode==="loose"&&c&&c.size>0){let u=bt(s.valueType,e,{...i,path:[...i.path,"patternProperties","*"]});r.patternProperties={};for(let h of c)r.patternProperties[h.source]=u}else(e.target==="draft-07"||e.target==="draft-2020-12")&&(r.propertyNames=bt(s.keyType,e,{...i,path:[...i.path,"propertyNames"]})),r.additionalProperties=bt(s.valueType,e,{...i,path:[...i.path,"additionalProperties"]});let l=o._zod.values;if(l){let u=[...l].filter(h=>typeof h=="string"||typeof h=="number");u.length>0&&(r.required=u)}},h0=(n,e,t,i)=>{let r=n._zod.def,s=bt(r.innerType,e,i),o=e.seen.get(n);e.target==="openapi-3.0"?(o.ref=r.innerType,t.nullable=!0):t.anyOf=[s,{type:"null"}]},d0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},f0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,t.default=JSON.parse(JSON.stringify(r.defaultValue))},p0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,e.io==="input"&&(t._prefault=JSON.parse(JSON.stringify(r.defaultValue)))},m0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType;let o;try{o=r.catchValue(void 0)}catch{throw new Error("Dynamic catch values are not supported in JSON Schema")}t.default=o},g0=(n,e,t,i)=>{let r=n._zod.def,s=r.in._zod.traits.has("$ZodTransform"),o=e.io==="input"?s?r.out:r.in:r.out;bt(o,e,i);let a=e.seen.get(n);a.ref=o},x0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType,t.readOnly=!0},_0=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},pl=(n,e,t,i)=>{let r=n._zod.def;bt(r.innerType,e,i);let s=e.seen.get(n);s.ref=r.innerType},v0=(n,e,t,i)=>{let r=n._zod.innerType;bt(r,e,i);let s=e.seen.get(n);s.ref=r},dl={string:Om,number:Fm,boolean:km,bigint:Bm,symbol:Hm,null:Gm,undefined:Vm,void:$m,never:Wm,any:Zm,unknown:Xm,date:qm,enum:Ym,literal:Jm,nan:jm,template_literal:Km,file:Qm,success:e0,custom:t0,function:n0,transform:i0,map:r0,set:s0,array:o0,object:a0,union:fl,intersection:c0,tuple:l0,record:u0,nullable:h0,nonoptional:d0,default:f0,prefault:p0,catch:m0,pipe:g0,readonly:x0,promise:_0,optional:pl,lazy:v0};function ml(n,e){if("_idmap"in n){let i=n,r=ji({...e,processors:dl}),s={};for(let c of i._idmap.entries()){let[l,u]=c;bt(u,r)}let o={},a={registry:i,uri:e?.uri,defs:s};r.external=a;for(let c of i._idmap.entries()){let[l,u]=c;Ki(r,u),o[l]=Qi(r,u)}if(Object.keys(s).length>0){let c=r.target==="draft-2020-12"?"$defs":"definitions";o.__shared={[c]:s}}return{schemas:o}}let t=ji({...e,processors:dl});return bt(n,t),Ki(t,n),Qi(t,n)}var gl=class{get metadataRegistry(){return this.ctx.metadataRegistry}get target(){return this.ctx.target}get unrepresentable(){return this.ctx.unrepresentable}get override(){return this.ctx.override}get io(){return this.ctx.io}get counter(){return this.ctx.counter}set counter(e){this.ctx.counter=e}get seen(){return this.ctx.seen}constructor(e){let t=e?.target??"draft-2020-12";t==="draft-4"&&(t="draft-04"),t==="draft-7"&&(t="draft-07"),this.ctx=ji({processors:dl,target:t,...e?.metadata&&{metadata:e.metadata},...e?.unrepresentable&&{unrepresentable:e.unrepresentable},...e?.override&&{override:e.override},...e?.io&&{io:e.io}})}process(e,t={path:[],schemaPath:[]}){return bt(e,this.ctx,t)}emit(e,t){t&&(t.cycles&&(this.ctx.cycles=t.cycles),t.reused&&(this.ctx.reused=t.reused),t.external&&(this.ctx.external=t.external)),Ki(this.ctx,e);let i=Qi(this.ctx,e),{"~standard":r,...s}=i;return s}};var _v={};var Bo={};vi(Bo,{ZodAny:()=>V0,ZodArray:()=>X0,ZodBase64:()=>Ol,ZodBase64URL:()=>Fl,ZodBigInt:()=>Ns,ZodBigIntFormat:()=>Hl,ZodBoolean:()=>Ds,ZodCIDRv4:()=>zl,ZodCIDRv6:()=>Ul,ZodCUID:()=>Rl,ZodCUID2:()=>Cl,ZodCatch:()=>mg,ZodCodec:()=>Ko,ZodCustom:()=>Qo,ZodCustomStringFormat:()=>Ps,ZodDate:()=>Xo,ZodDefault:()=>lg,ZodDiscriminatedUnion:()=>Y0,ZodE164:()=>kl,ZodEmail:()=>El,ZodEmoji:()=>Tl,ZodEnum:()=>Rs,ZodExactOptional:()=>og,ZodFile:()=>rg,ZodFunction:()=>Eg,ZodGUID:()=>Go,ZodIPv4:()=>Nl,ZodIPv6:()=>Ll,ZodIntersection:()=>J0,ZodJWT:()=>Bl,ZodKSUID:()=>Dl,ZodLazy:()=>Sg,ZodLiteral:()=>ig,ZodMAC:()=>U0,ZodMap:()=>tg,ZodNaN:()=>xg,ZodNanoID:()=>Al,ZodNever:()=>W0,ZodNonOptional:()=>Xl,ZodNull:()=>H0,ZodNullable:()=>cg,ZodNumber:()=>Is,ZodNumberFormat:()=>Nr,ZodObject:()=>Yo,ZodOptional:()=>Zl,ZodPipe:()=>jo,ZodPrefault:()=>hg,ZodPreprocess:()=>_g,ZodPromise:()=>wg,ZodReadonly:()=>vg,ZodRecord:()=>As,ZodSet:()=>ng,ZodString:()=>Cs,ZodStringFormat:()=>Tt,ZodSuccess:()=>pg,ZodSymbol:()=>k0,ZodTemplateLiteral:()=>bg,ZodTransform:()=>sg,ZodTuple:()=>K0,ZodType:()=>tt,ZodULID:()=>Pl,ZodURL:()=>Zo,ZodUUID:()=>ai,ZodUndefined:()=>B0,ZodUnion:()=>Jo,ZodUnknown:()=>$0,ZodVoid:()=>Z0,ZodXID:()=>Il,ZodXor:()=>q0,_ZodString:()=>wl,_default:()=>ug,_function:()=>Ay,any:()=>ry,array:()=>qo,base64:()=>Hv,base64url:()=>Gv,bigint:()=>Qv,boolean:()=>F0,catch:()=>gg,check:()=>Ry,cidrv4:()=>kv,cidrv6:()=>Bv,codec:()=>My,cuid:()=>Iv,cuid2:()=>Dv,custom:()=>Cy,date:()=>oy,describe:()=>Py,discriminatedUnion:()=>dy,e164:()=>Vv,email:()=>bv,emoji:()=>Cv,enum:()=>$l,exactOptional:()=>ag,file:()=>vy,float32:()=>Yv,float64:()=>Jv,function:()=>Ay,guid:()=>Sv,hash:()=>qv,hex:()=>Xv,hostname:()=>Zv,httpUrl:()=>Rv,instanceof:()=>Dy,int:()=>Sl,int32:()=>jv,int64:()=>ey,intersection:()=>j0,invertCodec:()=>wy,ipv4:()=>Uv,ipv6:()=>Fv,json:()=>Ly,jwt:()=>$v,keyof:()=>ay,ksuid:()=>zv,lazy:()=>Mg,literal:()=>_y,looseObject:()=>uy,looseRecord:()=>py,mac:()=>Ov,map:()=>my,meta:()=>Iy,nan:()=>Sy,nanoid:()=>Pv,nativeEnum:()=>xy,never:()=>Gl,nonoptional:()=>fg,null:()=>G0,nullable:()=>$o,nullish:()=>yy,number:()=>O0,object:()=>cy,optional:()=>Vo,partialRecord:()=>fy,pipe:()=>Ml,prefault:()=>dg,preprocess:()=>zy,promise:()=>Ty,readonly:()=>yg,record:()=>eg,refine:()=>Tg,set:()=>gy,strictObject:()=>ly,string:()=>Ho,stringFormat:()=>Wv,stringbool:()=>Ny,success:()=>by,superRefine:()=>Ag,symbol:()=>ny,templateLiteral:()=>Ey,transform:()=>Wl,tuple:()=>Q0,uint32:()=>Kv,uint64:()=>ty,ulid:()=>Nv,undefined:()=>iy,union:()=>Vl,unknown:()=>Dr,url:()=>Av,uuid:()=>Mv,uuidv4:()=>wv,uuidv6:()=>Ev,uuidv7:()=>Tv,void:()=>sy,xid:()=>Lv,xor:()=>hy});var xl={};vi(xl,{endsWith:()=>xs,gt:()=>si,gte:()=>pn,includes:()=>ms,length:()=>Ir,lowercase:()=>fs,lt:()=>ri,lte:()=>Pn,maxLength:()=>Pr,maxSize:()=>Ji,mime:()=>_s,minLength:()=>Si,minSize:()=>oi,multipleOf:()=>Yi,negative:()=>cl,nonnegative:()=>ul,nonpositive:()=>ll,normalize:()=>vs,overwrite:()=>Xn,positive:()=>al,property:()=>hl,regex:()=>ds,size:()=>Cr,slugify:()=>Ms,startsWith:()=>gs,toLowerCase:()=>bs,toUpperCase:()=>Ss,trim:()=>ys,uppercase:()=>ps});var Ts={};vi(Ts,{ZodISODate:()=>vl,ZodISODateTime:()=>_l,ZodISODuration:()=>bl,ZodISOTime:()=>yl,date:()=>b0,datetime:()=>y0,duration:()=>M0,time:()=>S0});var _l=O("ZodISODateTime",(n,e)=>{jf.init(n,e),Tt.init(n,e)});function y0(n){return tm(_l,n)}var vl=O("ZodISODate",(n,e)=>{Kf.init(n,e),Tt.init(n,e)});function b0(n){return nm(vl,n)}var yl=O("ZodISOTime",(n,e)=>{Qf.init(n,e),Tt.init(n,e)});function S0(n){return im(yl,n)}var bl=O("ZodISODuration",(n,e)=>{ep.init(n,e),Tt.init(n,e)});function M0(n){return rm(bl,n)}var vv=(n,e)=>{Ro.init(n,e),n.name="ZodError",Object.defineProperties(n,{format:{value:t=>Po(n,t)},flatten:{value:t=>Co(n,t)},addIssue:{value:t=>{n.issues.push(t),n.message=JSON.stringify(n.issues,rs,2)}},addIssues:{value:t=>{n.issues.push(...t),n.message=JSON.stringify(n.issues,rs,2)}},isEmpty:{get(){return n.issues.length===0}}})},zE=O("ZodError",vv),bn=O("ZodError",vv,{Parent:Error});var w0=as(bn),E0=cs(bn),T0=ls(bn),A0=us(bn),R0=xc(bn),C0=_c(bn),P0=vc(bn),I0=yc(bn),D0=bc(bn),N0=Sc(bn),L0=Mc(bn),z0=wc(bn);var yv=new WeakMap;function Wo(n,e,t){let i=Object.getPrototypeOf(n),r=yv.get(i);if(r||(r=new Set,yv.set(i,r)),!r.has(e)){r.add(e);for(let s in t){let o=t[s];Object.defineProperty(i,s,{configurable:!0,enumerable:!1,get(){let a=o.bind(this);return Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a}),a},set(a){Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:a})}})}}}var tt=O("ZodType",(n,e)=>(Ke.init(n,e),Object.assign(n["~standard"],{jsonSchema:{input:Es(n,"input"),output:Es(n,"output")}}),n.toJSONSchema=Um(n,{}),n.def=e,n.type=e.type,Object.defineProperty(n,"_def",{value:e}),n.parse=(t,i)=>w0(n,t,i,{callee:n.parse}),n.safeParse=(t,i)=>T0(n,t,i),n.parseAsync=async(t,i)=>E0(n,t,i,{callee:n.parseAsync}),n.safeParseAsync=async(t,i)=>A0(n,t,i),n.spa=n.safeParseAsync,n.encode=(t,i)=>R0(n,t,i),n.decode=(t,i)=>C0(n,t,i),n.encodeAsync=async(t,i)=>P0(n,t,i),n.decodeAsync=async(t,i)=>I0(n,t,i),n.safeEncode=(t,i)=>D0(n,t,i),n.safeDecode=(t,i)=>N0(n,t,i),n.safeEncodeAsync=async(t,i)=>L0(n,t,i),n.safeDecodeAsync=async(t,i)=>z0(n,t,i),Wo(n,"ZodType",{check(...t){let i=this.def;return this.clone(Ye.mergeDefs(i,{checks:[...i.checks??[],...t.map(r=>typeof r=="function"?{_zod:{check:r,def:{check:"custom"},onattach:[]}}:r)]}),{parent:!0})},with(...t){return this.check(...t)},clone(t,i){return dn(this,t,i)},brand(){return this},register(t,i){return t.add(this,i),this},refine(t,i){return this.check(Tg(t,i))},superRefine(t,i){return this.check(Ag(t,i))},overwrite(t){return this.check(Xn(t))},optional(){return Vo(this)},exactOptional(){return ag(this)},nullable(){return $o(this)},nullish(){return Vo($o(this))},nonoptional(t){return fg(this,t)},array(){return qo(this)},or(t){return Vl([this,t])},and(t){return j0(this,t)},transform(t){return Ml(this,Wl(t))},default(t){return ug(this,t)},prefault(t){return dg(this,t)},catch(t){return gg(this,t)},pipe(t){return Ml(this,t)},readonly(){return yg(this)},describe(t){let i=this.clone();return Jt.add(i,{description:t}),i},meta(...t){if(t.length===0)return Jt.get(this);let i=this.clone();return Jt.add(i,t[0]),i},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(t){return t(this)}}),Object.defineProperty(n,"description",{get(){return Jt.get(n)?.description},configurable:!0}),n)),wl=O("_ZodString",(n,e)=>{Rr.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>Om(n,i,r,s);let t=n._zod.bag;n.format=t.format??null,n.minLength=t.minimum??null,n.maxLength=t.maximum??null,Wo(n,"_ZodString",{regex(...i){return this.check(ds(...i))},includes(...i){return this.check(ms(...i))},startsWith(...i){return this.check(gs(...i))},endsWith(...i){return this.check(xs(...i))},min(...i){return this.check(Si(...i))},max(...i){return this.check(Pr(...i))},length(...i){return this.check(Ir(...i))},nonempty(...i){return this.check(Si(1,...i))},lowercase(i){return this.check(fs(i))},uppercase(i){return this.check(ps(i))},trim(){return this.check(ys())},normalize(...i){return this.check(vs(...i))},toLowerCase(){return this.check(bs())},toUpperCase(){return this.check(Ss())},slugify(){return this.check(Ms())}})}),Cs=O("ZodString",(n,e)=>{Rr.init(n,e),wl.init(n,e),n.email=t=>n.check(Hc(El,t)),n.url=t=>n.check(ko(Zo,t)),n.jwt=t=>n.check(ol(Bl,t)),n.emoji=t=>n.check(Zc(Tl,t)),n.guid=t=>n.check(Fo(Go,t)),n.uuid=t=>n.check(Gc(ai,t)),n.uuidv4=t=>n.check(Vc(ai,t)),n.uuidv6=t=>n.check($c(ai,t)),n.uuidv7=t=>n.check(Wc(ai,t)),n.nanoid=t=>n.check(Xc(Al,t)),n.guid=t=>n.check(Fo(Go,t)),n.cuid=t=>n.check(qc(Rl,t)),n.cuid2=t=>n.check(Yc(Cl,t)),n.ulid=t=>n.check(Jc(Pl,t)),n.base64=t=>n.check(il(Ol,t)),n.base64url=t=>n.check(rl(Fl,t)),n.xid=t=>n.check(jc(Il,t)),n.ksuid=t=>n.check(Kc(Dl,t)),n.ipv4=t=>n.check(Qc(Nl,t)),n.ipv6=t=>n.check(el(Ll,t)),n.cidrv4=t=>n.check(tl(zl,t)),n.cidrv6=t=>n.check(nl(Ul,t)),n.e164=t=>n.check(sl(kl,t)),n.datetime=t=>n.check(y0(t)),n.date=t=>n.check(b0(t)),n.time=t=>n.check(S0(t)),n.duration=t=>n.check(M0(t))});function Ho(n){return jp(Cs,n)}var Tt=O("ZodStringFormat",(n,e)=>{Et.init(n,e),wl.init(n,e)}),El=O("ZodEmail",(n,e)=>{Gf.init(n,e),Tt.init(n,e)});function bv(n){return Hc(El,n)}var Go=O("ZodGUID",(n,e)=>{Bf.init(n,e),Tt.init(n,e)});function Sv(n){return Fo(Go,n)}var ai=O("ZodUUID",(n,e)=>{Hf.init(n,e),Tt.init(n,e)});function Mv(n){return Gc(ai,n)}function wv(n){return Vc(ai,n)}function Ev(n){return $c(ai,n)}function Tv(n){return Wc(ai,n)}var Zo=O("ZodURL",(n,e)=>{Vf.init(n,e),Tt.init(n,e)});function Av(n){return ko(Zo,n)}function Rv(n){return ko(Zo,{protocol:Cn.httpProtocol,hostname:Cn.domain,...Ye.normalizeParams(n)})}var Tl=O("ZodEmoji",(n,e)=>{$f.init(n,e),Tt.init(n,e)});function Cv(n){return Zc(Tl,n)}var Al=O("ZodNanoID",(n,e)=>{Wf.init(n,e),Tt.init(n,e)});function Pv(n){return Xc(Al,n)}var Rl=O("ZodCUID",(n,e)=>{Zf.init(n,e),Tt.init(n,e)});function Iv(n){return qc(Rl,n)}var Cl=O("ZodCUID2",(n,e)=>{Xf.init(n,e),Tt.init(n,e)});function Dv(n){return Yc(Cl,n)}var Pl=O("ZodULID",(n,e)=>{qf.init(n,e),Tt.init(n,e)});function Nv(n){return Jc(Pl,n)}var Il=O("ZodXID",(n,e)=>{Yf.init(n,e),Tt.init(n,e)});function Lv(n){return jc(Il,n)}var Dl=O("ZodKSUID",(n,e)=>{Jf.init(n,e),Tt.init(n,e)});function zv(n){return Kc(Dl,n)}var Nl=O("ZodIPv4",(n,e)=>{tp.init(n,e),Tt.init(n,e)});function Uv(n){return Qc(Nl,n)}var U0=O("ZodMAC",(n,e)=>{ip.init(n,e),Tt.init(n,e)});function Ov(n){return Qp(U0,n)}var Ll=O("ZodIPv6",(n,e)=>{np.init(n,e),Tt.init(n,e)});function Fv(n){return el(Ll,n)}var zl=O("ZodCIDRv4",(n,e)=>{rp.init(n,e),Tt.init(n,e)});function kv(n){return tl(zl,n)}var Ul=O("ZodCIDRv6",(n,e)=>{sp.init(n,e),Tt.init(n,e)});function Bv(n){return nl(Ul,n)}var Ol=O("ZodBase64",(n,e)=>{ap.init(n,e),Tt.init(n,e)});function Hv(n){return il(Ol,n)}var Fl=O("ZodBase64URL",(n,e)=>{cp.init(n,e),Tt.init(n,e)});function Gv(n){return rl(Fl,n)}var kl=O("ZodE164",(n,e)=>{lp.init(n,e),Tt.init(n,e)});function Vv(n){return sl(kl,n)}var Bl=O("ZodJWT",(n,e)=>{up.init(n,e),Tt.init(n,e)});function $v(n){return ol(Bl,n)}var Ps=O("ZodCustomStringFormat",(n,e)=>{hp.init(n,e),Tt.init(n,e)});function Wv(n,e,t={}){return ws(Ps,n,e,t)}function Zv(n){return ws(Ps,"hostname",Cn.hostname,n)}function Xv(n){return ws(Ps,"hex",Cn.hex,n)}function qv(n,e){let t=e?.enc??"hex",i=`${n}_${t}`,r=Cn[i];if(!r)throw new Error(`Unrecognized hash format: ${i}`);return ws(Ps,i,r,e)}var Is=O("ZodNumber",(n,e)=>{Nc.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>Fm(n,i,r,s),Wo(n,"ZodNumber",{gt(i,r){return this.check(si(i,r))},gte(i,r){return this.check(pn(i,r))},min(i,r){return this.check(pn(i,r))},lt(i,r){return this.check(ri(i,r))},lte(i,r){return this.check(Pn(i,r))},max(i,r){return this.check(Pn(i,r))},int(i){return this.check(Sl(i))},safe(i){return this.check(Sl(i))},positive(i){return this.check(si(0,i))},nonnegative(i){return this.check(pn(0,i))},negative(i){return this.check(ri(0,i))},nonpositive(i){return this.check(Pn(0,i))},multipleOf(i,r){return this.check(Yi(i,r))},step(i,r){return this.check(Yi(i,r))},finite(){return this}});let t=n._zod.bag;n.minValue=Math.max(t.minimum??Number.NEGATIVE_INFINITY,t.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,n.maxValue=Math.min(t.maximum??Number.POSITIVE_INFINITY,t.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,n.isInt=(t.format??"").includes("int")||Number.isSafeInteger(t.multipleOf??.5),n.isFinite=!0,n.format=t.format??null});function O0(n){return sm(Is,n)}var Nr=O("ZodNumberFormat",(n,e)=>{dp.init(n,e),Is.init(n,e)});function Sl(n){return am(Nr,n)}function Yv(n){return cm(Nr,n)}function Jv(n){return lm(Nr,n)}function jv(n){return um(Nr,n)}function Kv(n){return hm(Nr,n)}var Ds=O("ZodBoolean",(n,e)=>{Lo.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>km(n,t,i,r)});function F0(n){return dm(Ds,n)}var Ns=O("ZodBigInt",(n,e)=>{Lc.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>Bm(n,i,r,s),n.gte=(i,r)=>n.check(pn(i,r)),n.min=(i,r)=>n.check(pn(i,r)),n.gt=(i,r)=>n.check(si(i,r)),n.gte=(i,r)=>n.check(pn(i,r)),n.min=(i,r)=>n.check(pn(i,r)),n.lt=(i,r)=>n.check(ri(i,r)),n.lte=(i,r)=>n.check(Pn(i,r)),n.max=(i,r)=>n.check(Pn(i,r)),n.positive=i=>n.check(si(BigInt(0),i)),n.negative=i=>n.check(ri(BigInt(0),i)),n.nonpositive=i=>n.check(Pn(BigInt(0),i)),n.nonnegative=i=>n.check(pn(BigInt(0),i)),n.multipleOf=(i,r)=>n.check(Yi(i,r));let t=n._zod.bag;n.minValue=t.minimum??null,n.maxValue=t.maximum??null,n.format=t.format??null});function Qv(n){return pm(Ns,n)}var Hl=O("ZodBigIntFormat",(n,e)=>{fp.init(n,e),Ns.init(n,e)});function ey(n){return gm(Hl,n)}function ty(n){return xm(Hl,n)}var k0=O("ZodSymbol",(n,e)=>{pp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Hm(n,t,i,r)});function ny(n){return _m(k0,n)}var B0=O("ZodUndefined",(n,e)=>{mp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Vm(n,t,i,r)});function iy(n){return vm(B0,n)}var H0=O("ZodNull",(n,e)=>{gp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Gm(n,t,i,r)});function G0(n){return ym(H0,n)}var V0=O("ZodAny",(n,e)=>{xp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Zm(n,t,i,r)});function ry(){return bm(V0)}var $0=O("ZodUnknown",(n,e)=>{_p.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Xm(n,t,i,r)});function Dr(){return Sm($0)}var W0=O("ZodNever",(n,e)=>{vp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Wm(n,t,i,r)});function Gl(n){return Mm(W0,n)}var Z0=O("ZodVoid",(n,e)=>{yp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>$m(n,t,i,r)});function sy(n){return wm(Z0,n)}var Xo=O("ZodDate",(n,e)=>{bp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>qm(n,i,r,s),n.min=(i,r)=>n.check(pn(i,r)),n.max=(i,r)=>n.check(Pn(i,r));let t=n._zod.bag;n.minDate=t.minimum?new Date(t.minimum):null,n.maxDate=t.maximum?new Date(t.maximum):null});function oy(n){return Em(Xo,n)}var X0=O("ZodArray",(n,e)=>{Sp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>o0(n,t,i,r),n.element=e.element,Wo(n,"ZodArray",{min(t,i){return this.check(Si(t,i))},nonempty(t){return this.check(Si(1,t))},max(t,i){return this.check(Pr(t,i))},length(t,i){return this.check(Ir(t,i))},unwrap(){return this.element}})});function qo(n,e){return Rm(X0,n,e)}function ay(n){let e=n._zod.def.shape;return $l(Object.keys(e))}var Yo=O("ZodObject",(n,e)=>{Mp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>a0(n,t,i,r),Ye.defineLazy(n,"shape",()=>e.shape),Wo(n,"ZodObject",{keyof(){return $l(Object.keys(this._zod.def.shape))},catchall(t){return this.clone({...this._zod.def,catchall:t})},passthrough(){return this.clone({...this._zod.def,catchall:Dr()})},loose(){return this.clone({...this._zod.def,catchall:Dr()})},strict(){return this.clone({...this._zod.def,catchall:Gl()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(t){return Ye.extend(this,t)},safeExtend(t){return Ye.safeExtend(this,t)},merge(t){return Ye.merge(this,t)},pick(t){return Ye.pick(this,t)},omit(t){return Ye.omit(this,t)},partial(...t){return Ye.partial(Zl,this,t[0])},required(...t){return Ye.required(Xl,this,t[0])}})});function cy(n,e){let t={type:"object",shape:n??{},...Ye.normalizeParams(e)};return new Yo(t)}function ly(n,e){return new Yo({type:"object",shape:n,catchall:Gl(),...Ye.normalizeParams(e)})}function uy(n,e){return new Yo({type:"object",shape:n,catchall:Dr(),...Ye.normalizeParams(e)})}var Jo=O("ZodUnion",(n,e)=>{zo.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>fl(n,t,i,r),n.options=e.options});function Vl(n,e){return new Jo({type:"union",options:n,...Ye.normalizeParams(e)})}var q0=O("ZodXor",(n,e)=>{Jo.init(n,e),wp.init(n,e),n._zod.processJSONSchema=(t,i,r)=>fl(n,t,i,r),n.options=e.options});function hy(n,e){return new q0({type:"union",options:n,inclusive:!1,...Ye.normalizeParams(e)})}var Y0=O("ZodDiscriminatedUnion",(n,e)=>{Jo.init(n,e),Ep.init(n,e)});function dy(n,e,t){return new Y0({type:"union",options:e,discriminator:n,...Ye.normalizeParams(t)})}var J0=O("ZodIntersection",(n,e)=>{Tp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>c0(n,t,i,r)});function j0(n,e){return new J0({type:"intersection",left:n,right:e})}var K0=O("ZodTuple",(n,e)=>{zc.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>l0(n,t,i,r),n.rest=t=>n.clone({...n._zod.def,rest:t})});function Q0(n,e,t){let i=e instanceof Ke,r=i?t:e,s=i?e:null;return new K0({type:"tuple",items:n,rest:s,...Ye.normalizeParams(r)})}var As=O("ZodRecord",(n,e)=>{Ap.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>u0(n,t,i,r),n.keyType=e.keyType,n.valueType=e.valueType});function eg(n,e,t){return!e||!e._zod?new As({type:"record",keyType:Ho(),valueType:n,...Ye.normalizeParams(e)}):new As({type:"record",keyType:n,valueType:e,...Ye.normalizeParams(t)})}function fy(n,e,t){let i=dn(n);return i._zod.values=void 0,new As({type:"record",keyType:i,valueType:e,...Ye.normalizeParams(t)})}function py(n,e,t){return new As({type:"record",keyType:n,valueType:e,mode:"loose",...Ye.normalizeParams(t)})}var tg=O("ZodMap",(n,e)=>{Rp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>r0(n,t,i,r),n.keyType=e.keyType,n.valueType=e.valueType,n.min=(...t)=>n.check(oi(...t)),n.nonempty=t=>n.check(oi(1,t)),n.max=(...t)=>n.check(Ji(...t)),n.size=(...t)=>n.check(Cr(...t))});function my(n,e,t){return new tg({type:"map",keyType:n,valueType:e,...Ye.normalizeParams(t)})}var ng=O("ZodSet",(n,e)=>{Cp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>s0(n,t,i,r),n.min=(...t)=>n.check(oi(...t)),n.nonempty=t=>n.check(oi(1,t)),n.max=(...t)=>n.check(Ji(...t)),n.size=(...t)=>n.check(Cr(...t))});function gy(n,e){return new ng({type:"set",valueType:n,...Ye.normalizeParams(e)})}var Rs=O("ZodEnum",(n,e)=>{Pp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(i,r,s)=>Ym(n,i,r,s),n.enum=e.entries,n.options=Object.values(e.entries);let t=new Set(Object.keys(e.entries));n.extract=(i,r)=>{let s={};for(let o of i)if(t.has(o))s[o]=e.entries[o];else throw new Error(`Key ${o} not found in enum`);return new Rs({...e,checks:[],...Ye.normalizeParams(r),entries:s})},n.exclude=(i,r)=>{let s={...e.entries};for(let o of i)if(t.has(o))delete s[o];else throw new Error(`Key ${o} not found in enum`);return new Rs({...e,checks:[],...Ye.normalizeParams(r),entries:s})}});function $l(n,e){let t=Array.isArray(n)?Object.fromEntries(n.map(i=>[i,i])):n;return new Rs({type:"enum",entries:t,...Ye.normalizeParams(e)})}function xy(n,e){return new Rs({type:"enum",entries:n,...Ye.normalizeParams(e)})}var ig=O("ZodLiteral",(n,e)=>{Ip.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Jm(n,t,i,r),n.values=new Set(e.values),Object.defineProperty(n,"value",{get(){if(e.values.length>1)throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");return e.values[0]}})});function _y(n,e){return new ig({type:"literal",values:Array.isArray(n)?n:[n],...Ye.normalizeParams(e)})}var rg=O("ZodFile",(n,e)=>{Dp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Qm(n,t,i,r),n.min=(t,i)=>n.check(oi(t,i)),n.max=(t,i)=>n.check(Ji(t,i)),n.mime=(t,i)=>n.check(_s(Array.isArray(t)?t:[t],i))});function vy(n){return Cm(rg,n)}var sg=O("ZodTransform",(n,e)=>{Np.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>i0(n,t,i,r),n._zod.parse=(t,i)=>{if(i.direction==="backward")throw new $i(n.constructor.name);t.addIssue=s=>{if(typeof s=="string")t.issues.push(Ye.issue(s,t.value,e));else{let o=s;o.fatal&&(o.continue=!1),o.code??(o.code="custom"),o.input??(o.input=t.value),o.inst??(o.inst=n),t.issues.push(Ye.issue(o))}};let r=e.transform(t.value,t);return r instanceof Promise?r.then(s=>(t.value=s,t.fallback=!0,t)):(t.value=r,t.fallback=!0,t)}});function Wl(n){return new sg({type:"transform",transform:n})}var Zl=O("ZodOptional",(n,e)=>{Uc.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>pl(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function Vo(n){return new Zl({type:"optional",innerType:n})}var og=O("ZodExactOptional",(n,e)=>{Lp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>pl(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function ag(n){return new og({type:"optional",innerType:n})}var cg=O("ZodNullable",(n,e)=>{zp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>h0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function $o(n){return new cg({type:"nullable",innerType:n})}function yy(n){return Vo($o(n))}var lg=O("ZodDefault",(n,e)=>{Up.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>f0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType,n.removeDefault=n.unwrap});function ug(n,e){return new lg({type:"default",innerType:n,get defaultValue(){return typeof e=="function"?e():Ye.shallowClone(e)}})}var hg=O("ZodPrefault",(n,e)=>{Op.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>p0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function dg(n,e){return new hg({type:"prefault",innerType:n,get defaultValue(){return typeof e=="function"?e():Ye.shallowClone(e)}})}var Xl=O("ZodNonOptional",(n,e)=>{Fp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>d0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function fg(n,e){return new Xl({type:"nonoptional",innerType:n,...Ye.normalizeParams(e)})}var pg=O("ZodSuccess",(n,e)=>{kp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>e0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function by(n){return new pg({type:"success",innerType:n})}var mg=O("ZodCatch",(n,e)=>{Bp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>m0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType,n.removeCatch=n.unwrap});function gg(n,e){return new mg({type:"catch",innerType:n,catchValue:typeof e=="function"?e:()=>e})}var xg=O("ZodNaN",(n,e)=>{Hp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>jm(n,t,i,r)});function Sy(n){return Am(xg,n)}var jo=O("ZodPipe",(n,e)=>{Oc.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>g0(n,t,i,r),n.in=e.in,n.out=e.out});function Ml(n,e){return new jo({type:"pipe",in:n,out:e})}var Ko=O("ZodCodec",(n,e)=>{jo.init(n,e),Uo.init(n,e)});function My(n,e,t){return new Ko({type:"pipe",in:n,out:e,transform:t.decode,reverseTransform:t.encode})}function wy(n){let e=n._zod.def;return new Ko({type:"pipe",in:e.out,out:e.in,transform:e.reverseTransform,reverseTransform:e.transform})}var _g=O("ZodPreprocess",(n,e)=>{jo.init(n,e),Gp.init(n,e)}),vg=O("ZodReadonly",(n,e)=>{Vp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>x0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function yg(n){return new vg({type:"readonly",innerType:n})}var bg=O("ZodTemplateLiteral",(n,e)=>{$p.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>Km(n,t,i,r)});function Ey(n,e){return new bg({type:"template_literal",parts:n,...Ye.normalizeParams(e)})}var Sg=O("ZodLazy",(n,e)=>{Xp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>v0(n,t,i,r),n.unwrap=()=>n._zod.def.getter()});function Mg(n){return new Sg({type:"lazy",getter:n})}var wg=O("ZodPromise",(n,e)=>{Zp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>_0(n,t,i,r),n.unwrap=()=>n._zod.def.innerType});function Ty(n){return new wg({type:"promise",innerType:n})}var Eg=O("ZodFunction",(n,e)=>{Wp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>n0(n,t,i,r)});function Ay(n){return new Eg({type:"function",input:Array.isArray(n?.input)?Q0(n?.input):n?.input??qo(Dr()),output:n?.output??Dr()})}var Qo=O("ZodCustom",(n,e)=>{qp.init(n,e),tt.init(n,e),n._zod.processJSONSchema=(t,i,r)=>t0(n,t,i,r)});function Ry(n){let e=new Ct({check:"custom"});return e._zod.check=n,e}function Cy(n,e){return Pm(Qo,n??(()=>!0),e)}function Tg(n,e={}){return Im(Qo,n,e)}function Ag(n,e){return Dm(n,e)}var Py=Nm,Iy=Lm;function Dy(n,e={}){let t=new Qo({type:"custom",check:"custom",fn:i=>i instanceof n,abort:!0,...Ye.normalizeParams(e)});return t._zod.bag.Class=n,t._zod.check=i=>{i.value instanceof n||i.issues.push({code:"invalid_type",expected:n.name,input:i.value,inst:t,path:[...t._zod.def.path??[]]})},t}var Ny=(...n)=>zm({Codec:Ko,Boolean:Ds,String:Cs},...n);function Ly(n){let e=Mg(()=>Vl([Ho(n),O0(),F0(),G0(),qo(e),eg(Ho(),e)]));return e}function zy(n,e){return new _g({type:"pipe",in:Wl(n),out:e})}var OE={invalid_type:"invalid_type",too_big:"too_big",too_small:"too_small",invalid_format:"invalid_format",not_multiple_of:"not_multiple_of",unrecognized_keys:"unrecognized_keys",invalid_union:"invalid_union",invalid_key:"invalid_key",invalid_element:"invalid_element",invalid_value:"invalid_value",custom:"custom"};function FE(n){Ft({customError:n})}function kE(){return Ft().customError}var Rg;Rg||(Rg={});var Se={...Bo,...xl,iso:Ts},BE=new Set(["$schema","$ref","$defs","definitions","$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor","type","enum","const","anyOf","oneOf","allOf","not","properties","required","additionalProperties","patternProperties","propertyNames","minProperties","maxProperties","items","prefixItems","additionalItems","minItems","maxItems","uniqueItems","contains","minContains","maxContains","minLength","maxLength","pattern","format","minimum","maximum","exclusiveMinimum","exclusiveMaximum","multipleOf","description","default","contentEncoding","contentMediaType","contentSchema","unevaluatedItems","unevaluatedProperties","if","then","else","dependentSchemas","dependentRequired","nullable","readOnly"]);function HE(n,e){let t=n.$schema;return t==="https://json-schema.org/draft/2020-12/schema"?"draft-2020-12":t==="http://json-schema.org/draft-07/schema#"?"draft-7":t==="http://json-schema.org/draft-04/schema#"?"draft-4":e??"draft-2020-12"}function GE(n,e){if(!n.startsWith("#"))throw new Error("External $ref is not supported, only local refs (#/...) are allowed");let t=n.slice(1).split("/").filter(Boolean);if(t.length===0)return e.rootSchema;let i=e.version==="draft-2020-12"?"$defs":"definitions";if(t[0]===i){let r=t[1];if(!r||!e.defs[r])throw new Error(`Reference not found: ${n}`);return e.defs[r]}throw new Error(`Reference not found: ${n}`)}function Uy(n,e){if(n.not!==void 0){if(typeof n.not=="object"&&Object.keys(n.not).length===0)return Se.never();throw new Error("not is not supported in Zod (except { not: {} } for never)")}if(n.unevaluatedItems!==void 0)throw new Error("unevaluatedItems is not supported");if(n.unevaluatedProperties!==void 0)throw new Error("unevaluatedProperties is not supported");if(n.if!==void 0||n.then!==void 0||n.else!==void 0)throw new Error("Conditional schemas (if/then/else) are not supported");if(n.dependentSchemas!==void 0||n.dependentRequired!==void 0)throw new Error("dependentSchemas and dependentRequired are not supported");if(n.$ref){let r=n.$ref;if(e.refs.has(r))return e.refs.get(r);if(e.processing.has(r))return Se.lazy(()=>{if(!e.refs.has(r))throw new Error(`Circular reference not resolved: ${r}`);return e.refs.get(r)});e.processing.add(r);let s=GE(r,e),o=en(s,e);return e.refs.set(r,o),e.processing.delete(r),o}if(n.enum!==void 0){let r=n.enum;if(e.version==="openapi-3.0"&&n.nullable===!0&&r.length===1&&r[0]===null)return Se.null();if(r.length===0)return Se.never();if(r.length===1)return Se.literal(r[0]);if(r.every(o=>typeof o=="string"))return Se.enum(r);let s=r.map(o=>Se.literal(o));return s.length<2?s[0]:Se.union([s[0],s[1],...s.slice(2)])}if(n.const!==void 0)return Se.literal(n.const);let t=n.type;if(Array.isArray(t)){let r=t.map(s=>{let o={...n,type:s};return Uy(o,e)});return r.length===0?Se.never():r.length===1?r[0]:Se.union(r)}if(!t)return Se.any();let i;switch(t){case"string":{let r=Se.string();if(n.format){let s=n.format;s==="email"?r=r.check(Se.email()):s==="uri"||s==="uri-reference"?r=r.check(Se.url()):s==="uuid"||s==="guid"?r=r.check(Se.uuid()):s==="date-time"?r=r.check(Se.iso.datetime()):s==="date"?r=r.check(Se.iso.date()):s==="time"?r=r.check(Se.iso.time()):s==="duration"?r=r.check(Se.iso.duration()):s==="ipv4"?r=r.check(Se.ipv4()):s==="ipv6"?r=r.check(Se.ipv6()):s==="mac"?r=r.check(Se.mac()):s==="cidr"?r=r.check(Se.cidrv4()):s==="cidr-v6"?r=r.check(Se.cidrv6()):s==="base64"?r=r.check(Se.base64()):s==="base64url"?r=r.check(Se.base64url()):s==="e164"?r=r.check(Se.e164()):s==="jwt"?r=r.check(Se.jwt()):s==="emoji"?r=r.check(Se.emoji()):s==="nanoid"?r=r.check(Se.nanoid()):s==="cuid"?r=r.check(Se.cuid()):s==="cuid2"?r=r.check(Se.cuid2()):s==="ulid"?r=r.check(Se.ulid()):s==="xid"?r=r.check(Se.xid()):s==="ksuid"&&(r=r.check(Se.ksuid()))}typeof n.minLength=="number"&&(r=r.min(n.minLength)),typeof n.maxLength=="number"&&(r=r.max(n.maxLength)),n.pattern&&(r=r.regex(new RegExp(n.pattern))),i=r;break}case"number":case"integer":{let r=t==="integer"?Se.number().int():Se.number();typeof n.minimum=="number"&&(r=r.min(n.minimum)),typeof n.maximum=="number"&&(r=r.max(n.maximum)),typeof n.exclusiveMinimum=="number"?r=r.gt(n.exclusiveMinimum):n.exclusiveMinimum===!0&&typeof n.minimum=="number"&&(r=r.gt(n.minimum)),typeof n.exclusiveMaximum=="number"?r=r.lt(n.exclusiveMaximum):n.exclusiveMaximum===!0&&typeof n.maximum=="number"&&(r=r.lt(n.maximum)),typeof n.multipleOf=="number"&&(r=r.multipleOf(n.multipleOf)),i=r;break}case"boolean":{i=Se.boolean();break}case"null":{i=Se.null();break}case"object":{let r={},s=n.properties||{},o=new Set(n.required||[]);for(let[c,l]of Object.entries(s)){let u=en(l,e);r[c]=o.has(c)?u:u.optional()}if(n.propertyNames){let c=en(n.propertyNames,e),l=n.additionalProperties&&typeof n.additionalProperties=="object"?en(n.additionalProperties,e):Se.any();if(Object.keys(r).length===0){i=Se.record(c,l);break}let u=Se.object(r).passthrough(),h=Se.looseRecord(c,l);i=Se.intersection(u,h);break}if(n.patternProperties){let c=n.patternProperties,l=Object.keys(c),u=[];for(let d of l){let f=en(c[d],e),m=Se.string().regex(new RegExp(d));u.push(Se.looseRecord(m,f))}let h=[];if(Object.keys(r).length>0&&h.push(Se.object(r).passthrough()),h.push(...u),h.length===0)i=Se.object({}).passthrough();else if(h.length===1)i=h[0];else{let d=Se.intersection(h[0],h[1]);for(let f=2;f<h.length;f++)d=Se.intersection(d,h[f]);i=d}break}let a=Se.object(r);n.additionalProperties===!1?i=a.strict():typeof n.additionalProperties=="object"?i=a.catchall(en(n.additionalProperties,e)):i=a.passthrough();break}case"array":{let r=n.prefixItems,s=n.items;if(r&&Array.isArray(r)){let o=r.map(c=>en(c,e)),a=s&&typeof s=="object"&&!Array.isArray(s)?en(s,e):void 0;a?i=Se.tuple(o).rest(a):i=Se.tuple(o),typeof n.minItems=="number"&&(i=i.check(Se.minLength(n.minItems))),typeof n.maxItems=="number"&&(i=i.check(Se.maxLength(n.maxItems)))}else if(Array.isArray(s)){let o=s.map(c=>en(c,e)),a=n.additionalItems&&typeof n.additionalItems=="object"?en(n.additionalItems,e):void 0;a?i=Se.tuple(o).rest(a):i=Se.tuple(o),typeof n.minItems=="number"&&(i=i.check(Se.minLength(n.minItems))),typeof n.maxItems=="number"&&(i=i.check(Se.maxLength(n.maxItems)))}else if(s!==void 0){let o=en(s,e),a=Se.array(o);typeof n.minItems=="number"&&(a=a.min(n.minItems)),typeof n.maxItems=="number"&&(a=a.max(n.maxItems)),i=a}else i=Se.array(Se.any());break}default:throw new Error(`Unsupported type: ${t}`)}return i}function en(n,e){if(typeof n=="boolean")return n?Se.any():Se.never();let t=Uy(n,e),i=n.type||n.enum!==void 0||n.const!==void 0;if(n.anyOf&&Array.isArray(n.anyOf)){let a=n.anyOf.map(l=>en(l,e)),c=Se.union(a);t=i?Se.intersection(t,c):c}if(n.oneOf&&Array.isArray(n.oneOf)){let a=n.oneOf.map(l=>en(l,e)),c=Se.xor(a);t=i?Se.intersection(t,c):c}if(n.allOf&&Array.isArray(n.allOf))if(n.allOf.length===0)t=i?t:Se.any();else{let a=i?t:en(n.allOf[0],e),c=i?0:1;for(let l=c;l<n.allOf.length;l++)a=Se.intersection(a,en(n.allOf[l],e));t=a}n.nullable===!0&&e.version==="openapi-3.0"&&(t=Se.nullable(t)),n.readOnly===!0&&(t=Se.readonly(t)),n.default!==void 0&&(t=t.default(n.default));let r={},s=["$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor"];for(let a of s)a in n&&(r[a]=n[a]);let o=["contentEncoding","contentMediaType","contentSchema"];for(let a of o)a in n&&(r[a]=n[a]);for(let a of Object.keys(n))BE.has(a)||(r[a]=n[a]);return Object.keys(r).length>0&&e.registry.add(t,r),n.description&&(t=t.describe(n.description)),t}function Oy(n,e){if(typeof n=="boolean")return n?Se.any():Se.never();let t;try{t=JSON.parse(JSON.stringify(n))}catch{throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas")}let i=HE(t,e?.defaultTarget),r=t.$defs||t.definitions||{},s={version:i,defs:r,refs:new Map,processing:new Set,rootSchema:t,registry:e?.registry??Jt};return en(t,s)}var Cg={};vi(Cg,{bigint:()=>ZE,boolean:()=>WE,date:()=>XE,number:()=>$E,string:()=>VE});function VE(n){return Kp(Cs,n)}function $E(n){return om(Is,n)}function WE(n){return fm(Ds,n)}function ZE(n){return mm(Ns,n)}function XE(n){return Tm(Xo,n)}Ft(Fc());var qE=8,YE=kt.object({usedTokens:kt.number().nonnegative(),capacityTokens:kt.number().positive(),estimated:kt.boolean()}).strict(),JE=kt.object({turnId:kt.string().min(1),prompt:kt.string().nullable(),status:kt.enum(["running","completed","failed","interrupted"]),contextTokens:kt.number(),baseline:kt.boolean().optional()}).strict(),jE=kt.object({usage:YE.nullable(),compactions:kt.number().int().nonnegative().nullable(),turns:kt.array(JE).max(qE).optional()}).strict(),Fy="compacted",ky=kt.object({threadId:kt.string().min(1),seq:kt.number().int().nonnegative(),compactions:kt.number().int().positive()}).strict(),EL={readThreadContext:{input:kt.object({threadId:kt.string().min(1).max(200)}).strict(),output:jE}};function ea(n){return n==null||!Number.isFinite(n)?0:Math.min(1,Math.max(0,n))}function By(n,e){return e>0?ea(n/e):0}function Ls(n){return .3*60**ea(n)}function ci(n){return n>.3?ea(Math.log(n/.3)/Math.log(60)):0}function ta(n){return Math.max(0,Math.floor(Math.log2(Math.max(n,.3)/.3)))}function Hy(n){let e=ci(n);return 5*(5e4/5)**e}function li(n){if(n>=1e6){let e=n/1e6;return`${e>=10?Math.round(e):e.toFixed(1)}M`}return n>=1e3?`${Math.round(n/1e3)}k`:String(Math.round(n))}function er(n){let e=2166136261;for(let t=0;t<n.length;t+=1)e^=n.charCodeAt(t),e=Math.imul(e,16777619);return e>>>0}function Sn(n){let e=n>>>0;return()=>{e=e+1831565813>>>0;let t=e;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}}var wi={enter:["Roll, Prince, roll!","Ah, this thread. We remember it.","A fresh cousin arrives!"],rolling:["Work, work! Roll, roll!","Onward! Everything sticks eventually."],resting:["The thread rests. So shall We.","A little break. Very royal."],waiting:["We shall wait right here.","Off elsewhere? We keep the katamari warm."],compacted:["Lighter, and wiser.","Everything that mattered stuck.","A fresh start, with a new star."],sprinkle:["We sprinkle some snacks. Roll them up!"],full:["It is ENORMOUS. Compaction beckons."],knockedOff:["Oh! Things fell off. Careful, Prince."]},Gy=[{tier:"nibble",below:.005},{tier:"bite",below:.02},{tier:"gulp",below:.05},{tier:"heavy",below:Number.POSITIVE_INFINITY}];function Pg(n){return(Gy.find(e=>n<e.below)??Gy[3]).tier}function KE(n,e){return n.length>e?`${n.slice(0,e-1).trimEnd()}\u2026`:n}function Vy(n,e){let t=n.prompt?`"${KE(n.prompt,34)}"`:"That turn";if(n.contextTokens<0)return`${t} ended lighter, thanks to a compaction.`;let i=li(n.contextTokens);if(n.baseline)return`A thread starts heavy: bb's system prompt and tools came first. ${t} began at ${i}.`;switch(Pg(e?n.contextTokens/e:0)){case"heavy":return`A HEAVY one! ${t} swallowed ${i}.`;case"nibble":return`A light snack: ${t} took just ${i}.`;default:return`${t} swallowed ${i}.`}}function Ei(n){return n[Math.floor(Math.random()*n.length)]}function $y(n){return Math.max(3.8,n.length*.03+2.2)}function Wy(n){return n==="rolling"?Ei(wi.rolling):n==="resting"?Ei(wi.resting):n==="waiting"?Ei(wi.waiting):null}function Zy(n){return n>=.95?Ei(wi.full):`Splendid! ${Math.round(n*100)}% full.`}function Xy(n){return`POP! Compaction #${n}. ${Ei(wi.compacted)}`}function qy(n){return`${li(n)} tokens! Every turn re-reads all of it. Coins, coins, coins!`}function Yy(n,e){return n.contextTokens<0?"compacted":n.baseline?"setup":Pg(e?n.contextTokens/e:0)}function Jy(n,e){if(n.threadId!==e.threadId)return null;let t=n.usedTokens===null&&n.ready&&(e.compactions??0)===0,i=t?0:n.usedTokens;if(i===null||e.usedTokens===null||e.capacityTokens===null||e.usedTokens<=i)return null;let r=e.usedTokens-i,s=r/e.capacityTokens,o=t?"setup":Pg(s);return{share:s,tier:o,label:t?`+${li(r)} setup`:`${o==="heavy"?"GULP! ":""}+${li(r)}`}}var ql={forward:0,turn:0},Ig=new Set(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"]);function Yl(n){return n.forward===0&&n.turn===0}function Jl(n){let e=(t,i)=>(n.has(t)?1:0)-(n.has(i)?1:0);return{forward:e("ArrowUp","ArrowDown"),turn:e("ArrowRight","ArrowLeft")}}var Dg=globalThis.__bbPluginRuntime;if(Dg==null||Dg.jsxRuntime==null)throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var jl=Dg.jsxRuntime,IL="default"in jl?jl.default:jl,{Fragment:zs,jsx:ue,jsxs:xt}=jl;var jy="context-katamari:guide-seen";function Ky(){try{return window.localStorage.getItem(jy)==="true"}catch{return!1}}function Qy(){try{window.localStorage.setItem(jy,"true")}catch{}}var QE=[["\u{1F3C3}","Rolling on his own","the thread is working"],["\u{1F9CD}","Standing still","idle, or waiting for you"],["\u{1F4A5}","GULP and a shake","one turn swallowed a lot"],["\u{1FA99}","Coin trail","past 50k, every turn re-reads it all"],["\u{1F388}","POP, the ball shrinks","the thread compacted"],["\u{1F4AB}","Dizzy cousin","woozier with each compaction"]],eb=yi(function({onClose:e}){let[t,i]=Xt("hud"),r=Rt(null),s=Rt(null),o=Rt(null),a=Rt(!1),c=u=>{a.current=r.current?.contains(document.activeElement)??!1,i(u)};hn(()=>{a.current&&(a.current=!1,(t==="events"?o:s).current?.focus())},[t]);let l=xt("div",{className:"ck-guide-actions",children:[ue("button",{type:"button",className:"ck-guide-arrow","aria-label":"Previous page",disabled:t==="hud",onClick:()=>c("hud"),children:"\u2039"}),xt("span",{className:"ck-guide-dots","aria-hidden":"true",children:[ue("span",{"data-on":t==="hud"}),ue("span",{"data-on":t==="events"})]}),ue("button",{ref:s,type:"button",className:"ck-guide-arrow","aria-label":"Next page",disabled:t==="events",onClick:()=>c("events"),children:"\u203A"}),t==="events"?ue("button",{ref:o,type:"button",className:"ck-guide-close",onClick:e,children:"Got it"}):null]});return ue("div",{ref:r,className:"ck-guide","data-page":t,role:"dialog","aria-label":"What everything means",children:t==="hud"?xt(zs,{children:[ue("span",{className:"ck-guide-label","data-spot":"size",children:"\u2191 Size \xB7 tokens used / max"}),ue("span",{className:"ck-guide-label","data-spot":"clock",children:"\u2191 Context left"}),ue("span",{className:"ck-guide-label","data-spot":"turns",children:"Each turn's context \u2191"}),ue("span",{className:"ck-guide-label","data-spot":"item",children:"\u2190 Last thing the ball picked up"}),ue("span",{className:"ck-guide-label","data-spot":"stars",children:"Times compacted \u2197"}),xt("div",{className:"ck-guide-card",children:[ue("p",{children:"The ball grows as this thread fills its context. At the limit, bb compacts it: POP!"}),ue("p",{className:"ck-guide-keys",children:"Click, then roll with the arrow keys."}),l]})]}):xt("div",{className:"ck-guide-card","data-page":"events",children:[ue("ul",{className:"ck-guide-events",children:QE.map(([u,h,d])=>xt("li",{children:[ue("span",{"aria-hidden":"true",children:u}),xt("span",{children:[ue("b",{children:h})," ",d]})]},h))}),l]})})});var tb=yi(function({radius:e}){let t=Math.round(Hy(e)),i=Math.floor(t/1e3),r=Math.floor(t%1e3/10),s=t%10;return ue("span",{className:"ck-size-text",children:i>0?xt(zs,{children:[i,ue("small",{children:"m"}),r,ue("small",{children:"cm"})]}):r===0?xt(zs,{children:[s,ue("small",{children:"mm"})]}):xt(zs,{children:[r,ue("small",{children:"cm"}),s,ue("small",{children:"mm"})]})})}),e1=["#ff3d7f","#ffe14d","#2fd35a","#2f8cff","#ff8a1d","#c23bff"],t1=e1.map((n,e)=>{let t=46-e*6.5,i=18-e,r=[];for(let s=0;s<=i*8;s+=1){let o=s/(i*8)*Math.PI*2,a=1+.08*Math.cos(o*i);r.push(`${50+Math.cos(o)*t*a},${50+Math.sin(o)*t*a}`)}return ue("polygon",{points:r.join(" "),fill:n},n)}),nb=yi(function({fill:e}){let t=8+e*12;return xt("svg",{className:"ck-flower",viewBox:"0 0 100 100","aria-hidden":"true",children:[t1,ue("circle",{cx:"50",cy:"50",r:"13",fill:"#6b3ac8"}),ue("circle",{cx:"50",cy:"50",r:t,fill:"#f7f5ea",opacity:"0.92"}),ue("circle",{cx:"50",cy:"50",r:t*.45,fill:"#e8453c",opacity:"0.85"})]})}),ib=yi(function({percentLeft:e}){let t=e<=15,i=(1-e/100)*360;return xt("div",{className:"ck-clock","data-urgent":t,"aria-label":`${e}% of context left`,children:[xt("span",{className:"ck-clock-number",children:[e,ue("small",{children:"%"})]}),xt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[ue("circle",{cx:"12",cy:"12",r:"10",className:"ck-clock-face"}),ue("line",{x1:"12",y1:"12",x2:"12",y2:"4",className:"ck-clock-hand",transform:`rotate(${i} 12 12)`}),t?ue("text",{x:"12",y:"17",textAnchor:"middle",className:"ck-clock-bang",children:"!"}):null]})]})}),rb=yi(function({mode:e,compactions:t}){return xt("div",{className:"ck-prince-earth","data-mode":e,"aria-hidden":"true",children:[xt("svg",{viewBox:"0 0 80 80",children:[ue("defs",{children:xt("radialGradient",{id:"ck-glow",cx:"50%",cy:"50%",r:"50%",children:[ue("stop",{offset:"0%",stopColor:"#ffffff",stopOpacity:"0.95"}),ue("stop",{offset:"100%",stopColor:"#ffffff",stopOpacity:"0"})]})}),ue("circle",{className:"ck-prince-glow",cx:"40",cy:"42",r:"30",fill:"url(#ck-glow)"}),ue("circle",{cx:"86",cy:"96",r:"48",fill:"#2f6fd6"}),ue("path",{d:"M44 72 q10 -6 20 0 t20 0 M52 82 q10 -6 20 0 t20 0",stroke:"#bfe3ff",strokeWidth:"2.5",fill:"none"}),ue("path",{d:"M60 58 q8 -4 12 4 q-6 6 -12 -4z",fill:"#3fae4a"}),xt("g",{className:"ck-prince-figure",children:[ue("rect",{x:"22",y:"22",width:"30",height:"13",rx:"6.5",fill:"#7cc242"}),ue("rect",{x:"24",y:"22",width:"4",height:"13",fill:"#b4dd72"}),ue("rect",{x:"46",y:"22",width:"4",height:"13",fill:"#b4dd72"}),ue("rect",{x:"31",y:"23.5",width:"12",height:"10",fill:"#f5d94a"}),ue("rect",{x:"32.5",y:"25",width:"9",height:"7",fill:"#f2dcc0"}),ue("circle",{cx:"35",cy:"27.5",r:"0.9",fill:"#2b2233"}),ue("circle",{cx:"39",cy:"27.5",r:"0.9",fill:"#2b2233"}),ue("circle",{cx:"37",cy:"30.3",r:"1",fill:"#d8342f"}),ue("path",{d:"M37 16 l2 6 h-4z",fill:"#f5d94a"}),ue("circle",{cx:"37",cy:"15",r:"1.8",fill:"#e0312b"}),ue("path",{d:"M30 35 h14 l3 13 h-20z",fill:"#7cc242"}),ue("rect",{x:"31",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"}),ue("rect",{x:"40.6",y:"48",width:"2.4",height:"9",fill:"#7a2a8c"})]})]}),e==="resting"?ue("span",{className:"ck-prince-mark",children:"z z"}):null,e==="waiting"?ue("span",{className:"ck-prince-mark",children:"?"}):null,t>0?xt("span",{className:"ck-stars",title:`Compacted ${t} ${t===1?"time":"times"}`,children:["\u2726",t>=99?"99+":t]}):null]})}),sb=yi(function({turns:e,capacity:t}){if(e.length===0)return null;let i=[...e].reverse(),r=Math.max(1,...i.map(s=>s.baseline?0:Math.max(0,s.contextTokens)));return ue("div",{className:"ck-turns",children:ue("span",{className:"ck-turn-bars","aria-label":"Context each recent turn swallowed",children:i.map(s=>{let o=Math.max(0,s.contextTokens);return ue("span",{className:"ck-turn-bar","data-tier":Yy(s,t),"data-running":s.status==="running",style:{height:`${Math.min(100,Math.max(12,Math.sqrt(o/r)*100))}%`},title:`${s.prompt??"Turn"}
${s.contextTokens<0?"Compacted":`Context +${li(o)}${s.baseline?" (system prompt and tools included)":""}`}`},s.turnId)})})})}),ob=yi(function({text:e}){let[t,i]=Xt(0);return hn(()=>{i(0);let r=window.setInterval(()=>{i(s=>s>=e.length?(window.clearInterval(r),s):s+1)},30);return()=>window.clearInterval(r)},[e]),ue("span",{"aria-hidden":"true",children:e.slice(0,t)})});var na=.22727272727272727,ab=.18,n1=.12,i1=25,r1={C:0,D:2,E:4,F:5,G:7,A:9,B:11};function tr(n){let e=/^([A-G])(#?)(\d)$/.exec(n);return e?440*2**((r1[e[1]]+(e[2]?1:0)+(Number(e[3])+1)*12-69)/12):0}var cb=["E5 G5 A5 G5 E5 - C5 D5","E5 - D5 C5 A4 - C5 -","F5 A5 C6 A5 G5 - F5 E5","D5 - E5 F5 G5 - - -","E5 G5 C6 B5 A5 G5 E5 G5","A5 - G5 E5 C5 - D5 E5","F5 E5 D5 F5 E5 D5 C5 D5","C5 - G4 - C5 - - -"].map(n=>n.split(" ")),s1=[["C4","E4","G4"],["A3","C4","E4"],["F3","A3","C4"],["G3","B3","D4"],["C4","E4","G4"],["A3","C4","E4"],["D4","F4","A4"],["G3","B3","D4"]],o1=["C2","A1","F2","G2","C2","A1","D2","G2"],Kl=class{context=null;master=null;musicBus=null;noise=null;scheduler=null;nextStepTime=0;step=0;musicOn=!1;muted;lastClack=0;constructor(e){this.muted=e}get isMuted(){return this.muted}unlock(){if(!(typeof AudioContext>"u")){if(!this.context){let e=new AudioContext;this.context=e,this.master=e.createGain(),this.master.gain.value=this.muted?0:.5,this.master.connect(e.destination),this.musicBus=e.createGain(),this.musicBus.gain.value=0,this.musicBus.connect(this.master),this.noise=e.createBuffer(1,e.sampleRate*2,e.sampleRate);let t=this.noise.getChannelData(0),i=0;for(let r=0;r<t.length;r+=1)i=(i+.02*(Math.random()*2-1))/1.02,t[r]=i*3.5}this.muted?this.context.suspend():this.context.state==="suspended"&&this.context.resume()}}setMuted(e){this.muted=e;let t=this.context;if(!(!t||!this.master)){if(this.master.gain.setTargetAtTime(e?0:.5,t.currentTime,.05),!e){t.resume();return}window.setTimeout(()=>{this.muted&&t.state==="running"&&t.suspend()},300)}}setRolling(e,t){let i=this.context;if(!i||!this.musicBus)return;let r=i.currentTime,s=e?Math.min(1,Math.max(0,t)):0;e&&s>.15&&r-this.lastClack>.09+(1-s)*.25&&(this.lastClack=r,Math.random()<.55&&this.clack(r)),e&&!this.musicOn&&this.startMusic(),!e&&this.musicOn&&this.stopMusic()}pickup(e){let t=this.context;if(!t||!this.master)return;let i=t.currentTime,r=1500-Math.min(1,e)*800;this.tone("sine",r,i,.12,.28,r*1.6),this.tone("triangle",r*1.5,i+.06,.16,.18,r*2)}gulp(e){let t=this.context;if(!t)return;let i=t.currentTime,r=Math.min(1,Math.max(0,e)),s=r<.25?1:r<.6?2:3;for(let o=0;o<s;o+=1){let a=i+o*.2,c=260-r*150-o*18;this.tone("sine",c,a,.16+r*.12,.22+r*.25,c*.35),this.noiseBurst(a,.1,.1+r*.18,"lowpass",900,200)}r>=.6&&(this.tone("sine",70,i,.7,.5,28),this.noiseBurst(i+.05,.45,.3,"bandpass",3e3,400),this.tone("sawtooth",90,i+s*.2,.35,.12,60))}coin(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("square",tr("B5"),t,.06,.035),this.tone("square",tr("E6"),t+.06,.18,.035)}bonk(){let e=this.context;if(!e)return;let t=e.currentTime;this.tone("sine",150,t,.18,.35,55),this.noiseBurst(t,.08,.2,"lowpass",600,300)}whoosh(){let e=this.context;e&&this.noiseBurst(e.currentTime,.55,.3,"bandpass",300,2400)}shed(){let e=this.context;if(!e)return;let t=e.currentTime;["G5","E5","C5","G4"].forEach((i,r)=>{this.tone("square",tr(i),t+r*.07,.1,.1)})}pop(){let e=this.context;if(!e)return;let t=e.currentTime;this.noiseBurst(t,.3,.45,"bandpass",2400,180),this.tone("sine",110,t,.35,.45,38),["C6","E6","G6","C7"].forEach((i,r)=>{this.tone("triangle",tr(i),t+.08+r*.06,.18,.16)}),this.tone("sine",1400,t+.35,.8,.12,260)}dispose(){this.scheduler!==null&&window.clearInterval(this.scheduler),this.scheduler=null,this.context?.close(),this.context=null}startMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!0,this.musicBus.gain.setTargetAtTime(.5,e.currentTime,.25),this.scheduler===null&&(this.nextStepTime=e.currentTime+.05,this.scheduler=window.setInterval(()=>this.schedule(),i1)))}stopMusic(){let e=this.context;!e||!this.musicBus||(this.musicOn=!1,this.musicBus.gain.setTargetAtTime(0,e.currentTime,.3),window.setTimeout(()=>{!this.musicOn&&this.scheduler!==null&&(window.clearInterval(this.scheduler),this.scheduler=null)},1500))}schedule(){let e=this.context;if(e)for(;this.nextStepTime<e.currentTime+n1;){this.playStep(this.step,this.nextStepTime);let t=this.step%2===0?1+ab:1-ab;this.nextStepTime+=na*t,this.step=(this.step+1)%(cb.length*8)}}playStep(e,t){let i=Math.floor(e/8),r=e%8,s=cb[i][r];s!=="-"&&(this.voice("square",tr(s),t,na*.9,.07,2400),this.voice("triangle",tr(s)*2,t,na*.5,.025,6e3));let o=tr(o1[i]);if(r%2===0){let a=r%4===0?o:o*2;this.voice("triangle",a,t,na*.85,.22,900)}if(r%4===2)for(let a of s1[i])this.voice("sine",tr(a),t,na*.7,.05,3e3);r%4===0&&this.kick(t),r%4===2&&this.snare(t),this.hat(t,r%2===0?.035:.02)}voice(e,t,i,r,s,o){let a=this.context;if(!a||!this.musicBus)return;let c=a.createOscillator();c.type=e,c.frequency.value=t;let l=a.createBiquadFilter();l.type="lowpass",l.frequency.value=o;let u=a.createGain();u.gain.setValueAtTime(0,i),u.gain.linearRampToValueAtTime(s,i+.008),u.gain.exponentialRampToValueAtTime(1e-4,i+r),c.connect(l).connect(u).connect(this.musicBus),c.start(i),c.stop(i+r+.02)}kick(e){let t=this.context;if(!t||!this.musicBus)return;let i=t.createOscillator();i.frequency.setValueAtTime(140,e),i.frequency.exponentialRampToValueAtTime(45,e+.12);let r=t.createGain();r.gain.setValueAtTime(.35,e),r.gain.exponentialRampToValueAtTime(1e-4,e+.16),i.connect(r).connect(this.musicBus),i.start(e),i.stop(e+.2)}snare(e){this.noiseBurst(e,.12,.09,"bandpass",1800,1800,this.musicBus)}hat(e,t){this.noiseBurst(e,.04,t,"highpass",7e3,7e3,this.musicBus)}clack(e){let t=700+Math.random()*900;this.tone("square",t,e,.025,.03,t*.8)}tone(e,t,i,r,s,o=t){let a=this.context;if(!a||!this.master||a.state!=="running")return;let c=a.createOscillator();c.type=e,c.frequency.setValueAtTime(t,i),c.frequency.exponentialRampToValueAtTime(Math.max(20,o),i+r);let l=a.createGain();l.gain.setValueAtTime(s,i),l.gain.exponentialRampToValueAtTime(1e-4,i+r),c.connect(l).connect(this.master),c.start(i),c.stop(i+r+.02)}noiseBurst(e,t,i,r,s,o,a=this.master){let c=this.context;if(!c||!this.noise||!a||c.state!=="running")return;let l=c.createBufferSource();l.buffer=this.noise,l.playbackRate.value=4;let u=c.createBiquadFilter();u.type=r,u.frequency.setValueAtTime(s,e),u.frequency.exponentialRampToValueAtTime(o,e+t);let h=c.createGain();h.gain.setValueAtTime(i,e),h.gain.exponentialRampToValueAtTime(1e-4,e+t),l.connect(u).connect(h).connect(a),l.start(e,Math.random()),l.stop(e+t+.02)}};var kb=0,xx=1,Bb=2;var Ga=1,Hb=2,ao=3,gr=0,Kt=1,Gn=2,mi=0,co=1,_x=2,vx=3,yx=4,Gb=5;var Yr=100,Vb=101,$b=102,Wb=103,Zb=104,Xb=200,qb=201,Yb=202,Jb=203,bx=204,Sx=205,jb=206,Kb=207,Qb=208,eS=209,tS=210,nS=211,iS=212,rS=213,sS=214,wu=0,Eu=1,Tu=2,js=3,Au=4,Ru=5,Cu=6,Pu=7,Mx=0,oS=1,aS=2,Qn=0,wx=1,Ex=2,Tx=3,Ax=4,Rx=5,Cx=6,Px=7;var Ix=300,xr=301,Jr=302,ch=303,lh=304,Va=306,Iu=1e3,hi=1001,Du=1002,Lt=1003,cS=1004;var $a=1005;var jt=1006,uh=1007;var _r=1008;var Rn=1009,Dx=1010,Nx=1011,lo=1012,hh=1013,Vn=1014,Nn=1015,ei=1016,dh=1017,fh=1018,uo=1020,Lx=35902,zx=35899,Ux=1021,Ox=1022,En=1023,fi=1026,vr=1027,Wa=1028,Za=1029,yr=1030,ph=1031;var mh=1033,Xa=33776,qa=33777,Ya=33778,Ja=33779,gh=35840,xh=35841,_h=35842,vh=35843,yh=36196,bh=37492,Sh=37496,Mh=37488,wh=37489,ja=37490,Eh=37491,Th=37808,Ah=37809,Rh=37810,Ch=37811,Ph=37812,Ih=37813,Dh=37814,Nh=37815,Lh=37816,zh=37817,Uh=37818,Oh=37819,Fh=37820,kh=37821,Bh=36492,Hh=36494,Gh=36495,Vh=36283,$h=36284,Ka=36285,Wh=36286;var fa=2300,Nu=2301,Su=2302,sx=2303,ox=2400,ax=2401,cx=2402;var lS=3200;var Zh=0,uS=1,Li="",xn="srgb",pa="srgb-linear",ma="linear",St="srgb";var Mu=7680;var hS=519,dS=512,fS=513,pS=514,Xh=515,mS=516,gS=517,qh=518,xS=519,_S=35044;var Fx="300 es",Bn=2e3,Ks=2001;function a1(n){for(let e=n.length-1;e>=0;--e)if(n[e]>=65535)return!0;return!1}function c1(n){return ArrayBuffer.isView(n)&&!(n instanceof DataView)}function ga(n){return document.createElementNS("http://www.w3.org/1999/xhtml",n)}function vS(){let n=ga("canvas");return n.style.display="block",n}var lb={},Qs=null;function kx(...n){let e="THREE."+n.shift();Qs?Qs("log",e,...n):console.log(e,...n)}function yS(n){let e=n[0];if(typeof e=="string"&&e.startsWith("TSL:")){let t=n[1];t&&t.isStackTrace?n[0]+=" "+t.getLocation():n[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return n}function Xe(...n){n=yS(n);let e="THREE."+n.shift();if(Qs)Qs("warn",e,...n);else{let t=n[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...n)}}function Je(...n){n=yS(n);let e="THREE."+n.shift();if(Qs)Qs("error",e,...n);else{let t=n[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...n)}}function Hr(...n){let e=n.join(" ");e in lb||(lb[e]=!0,Xe(...n))}function bS(n,e,t){return new Promise(function(i,r){function s(){switch(n.clientWaitSync(e,n.SYNC_FLUSH_COMMANDS_BIT,0)){case n.WAIT_FAILED:r();break;case n.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:i()}}setTimeout(s,t)})}var SS={[wu]:Eu,[Tu]:Cu,[Au]:Pu,[js]:Ru,[Eu]:wu,[Cu]:Tu,[Pu]:Au,[Ru]:js},pi=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let i=this._listeners;i[e]===void 0&&(i[e]=[]),i[e].indexOf(t)===-1&&i[e].push(t)}hasEventListener(e,t){let i=this._listeners;return i===void 0?!1:i[e]!==void 0&&i[e].indexOf(t)!==-1}removeEventListener(e,t){let i=this._listeners;if(i===void 0)return;let r=i[e];if(r!==void 0){let s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){let t=this._listeners;if(t===void 0)return;let i=t[e.type];if(i!==void 0){e.target=this;let r=i.slice(0);for(let s=0,o=r.length;s<o;s++)r[s].call(this,e);e.target=null}}},tn=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],ub=1234567,la=Math.PI/180,eo=180/Math.PI;function jr(){let n=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,i=Math.random()*4294967295|0;return(tn[n&255]+tn[n>>8&255]+tn[n>>16&255]+tn[n>>24&255]+"-"+tn[e&255]+tn[e>>8&255]+"-"+tn[e>>16&15|64]+tn[e>>24&255]+"-"+tn[t&63|128]+tn[t>>8&255]+"-"+tn[t>>16&255]+tn[t>>24&255]+tn[i&255]+tn[i>>8&255]+tn[i>>16&255]+tn[i>>24&255]).toLowerCase()}function at(n,e,t){return Math.max(e,Math.min(t,n))}function Bx(n,e){return(n%e+e)%e}function l1(n,e,t,i,r){return i+(n-e)*(r-i)/(t-e)}function u1(n,e,t){return n!==e?(t-n)/(e-n):0}function ua(n,e,t){return(1-t)*n+t*e}function h1(n,e,t,i){return ua(n,e,1-Math.exp(-t*i))}function d1(n,e=1){return e-Math.abs(Bx(n,e*2)-e)}function f1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*(3-2*n))}function p1(n,e,t){return n<=e?0:n>=t?1:(n=(n-e)/(t-e),n*n*n*(n*(n*6-15)+10))}function m1(n,e){return n+Math.floor(Math.random()*(e-n+1))}function g1(n,e){return n+Math.random()*(e-n)}function x1(n){return n*(.5-Math.random())}function _1(n){n!==void 0&&(ub=n);let e=ub+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function v1(n){return n*la}function y1(n){return n*eo}function b1(n){return n>0&&Number.isInteger(n)&&2**Math.round(Math.log2(n))===n}function S1(n){return Math.pow(2,Math.ceil(Math.log(n)/Math.LN2))}function M1(n){return Math.pow(2,Math.floor(Math.log(n)/Math.LN2))}function w1(n,e,t,i,r){let s=Math.cos,o=Math.sin,a=s(t/2),c=o(t/2),l=s((e+i)/2),u=o((e+i)/2),h=s((e-i)/2),d=o((e-i)/2),f=s((i-e)/2),m=o((i-e)/2);switch(r){case"XYX":n.set(a*u,c*h,c*d,a*l);break;case"YZY":n.set(c*d,a*u,c*h,a*l);break;case"ZXZ":n.set(c*h,c*d,a*u,a*l);break;case"XZX":n.set(a*u,c*m,c*f,a*l);break;case"YXY":n.set(c*f,a*u,c*m,a*l);break;case"ZYZ":n.set(c*m,c*f,a*u,a*l);break;default:Xe("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+r)}}function Ys(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return n/4294967295;case Uint16Array:return n/65535;case Uint8Array:case Uint8ClampedArray:return n/255;case Int32Array:return Math.max(n/2147483647,-1);case Int16Array:return Math.max(n/32767,-1);case Int8Array:return Math.max(n/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function gn(n,e){switch(e.constructor){case Float32Array:return n;case Uint32Array:return Math.round(n*4294967295);case Uint16Array:return Math.round(n*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(n*255);case Int32Array:return Math.round(n*2147483647);case Int16Array:return Math.round(n*32767);case Int8Array:return Math.round(n*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Un={DEG2RAD:la,RAD2DEG:eo,generateUUID:jr,clamp:at,euclideanModulo:Bx,mapLinear:l1,inverseLerp:u1,lerp:ua,damp:h1,pingpong:d1,smoothstep:f1,smootherstep:p1,randInt:m1,randFloat:g1,randFloatSpread:x1,seededRandom:_1,degToRad:v1,radToDeg:y1,isPowerOfTwo:b1,ceilPowerOfTwo:S1,floorPowerOfTwo:M1,setQuaternionFromProperEuler:w1,normalize:gn,denormalize:Ys},fe=class n{static{n.prototype.isVector2=!0}constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,i=this.y,r=e.elements;return this.x=r[0]*t+r[3]*i+r[6],this.y=r[1]*t+r[4]*i+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(at(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y;return t*t+i*i}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let i=Math.cos(t),r=Math.sin(t),s=this.x-e.x,o=this.y-e.y;return this.x=s*i-o*r+e.x,this.y=s*r+o*i+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},sn=class{constructor(e=0,t=0,i=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=i,this._w=r}static slerpFlat(e,t,i,r,s,o,a){let c=i[r+0],l=i[r+1],u=i[r+2],h=i[r+3],d=s[o+0],f=s[o+1],m=s[o+2],y=s[o+3];if(h!==y||c!==d||l!==f||u!==m){let g=c*d+l*f+u*m+h*y;g<0&&(d=-d,f=-f,m=-m,y=-y,g=-g);let p=1-a;if(g<.9995){let S=Math.acos(g),E=Math.sin(S);p=Math.sin(p*S)/E,a=Math.sin(a*S)/E,c=c*p+d*a,l=l*p+f*a,u=u*p+m*a,h=h*p+y*a}else{c=c*p+d*a,l=l*p+f*a,u=u*p+m*a,h=h*p+y*a;let S=1/Math.sqrt(c*c+l*l+u*u+h*h);c*=S,l*=S,u*=S,h*=S}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=h}static multiplyQuaternionsFlat(e,t,i,r,s,o){let a=i[r],c=i[r+1],l=i[r+2],u=i[r+3],h=s[o],d=s[o+1],f=s[o+2],m=s[o+3];return e[t]=a*m+u*h+c*f-l*d,e[t+1]=c*m+u*d+l*h-a*f,e[t+2]=l*m+u*f+a*d-c*h,e[t+3]=u*m-a*h-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,i,r){return this._x=e,this._y=t,this._z=i,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let i=e._x,r=e._y,s=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(i/2),u=a(r/2),h=a(s/2),d=c(i/2),f=c(r/2),m=c(s/2);switch(o){case"XYZ":this._x=d*u*h+l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h-d*f*m;break;case"YXZ":this._x=d*u*h+l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h+d*f*m;break;case"ZXY":this._x=d*u*h-l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h-d*f*m;break;case"ZYX":this._x=d*u*h-l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h+d*f*m;break;case"YZX":this._x=d*u*h+l*f*m,this._y=l*f*h+d*u*m,this._z=l*u*m-d*f*h,this._w=l*u*h-d*f*m;break;case"XZY":this._x=d*u*h-l*f*m,this._y=l*f*h-d*u*m,this._z=l*u*m+d*f*h,this._w=l*u*h+d*f*m;break;default:Xe("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let i=t/2,r=Math.sin(i);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(i),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,i=t[0],r=t[4],s=t[8],o=t[1],a=t[5],c=t[9],l=t[2],u=t[6],h=t[10],d=i+a+h;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(u-c)*f,this._y=(s-l)*f,this._z=(o-r)*f}else if(i>a&&i>h){let f=2*Math.sqrt(1+i-a-h);this._w=(u-c)/f,this._x=.25*f,this._y=(r+o)/f,this._z=(s+l)/f}else if(a>h){let f=2*Math.sqrt(1+a-i-h);this._w=(s-l)/f,this._x=(r+o)/f,this._y=.25*f,this._z=(c+u)/f}else{let f=2*Math.sqrt(1+h-i-a);this._w=(o-r)/f,this._x=(s+l)/f,this._y=(c+u)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let i=e.dot(t)+1;return i<1e-8?(i=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=i):(this._x=0,this._y=-e.z,this._z=e.y,this._w=i)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=i),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(at(this.dot(e),-1,1)))}rotateTowards(e,t){let i=this.angleTo(e);if(i===0)return this;let r=Math.min(1,t/i);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=t._x,c=t._y,l=t._z,u=t._w;return this._x=i*u+o*a+r*l-s*c,this._y=r*u+o*c+s*a-i*l,this._z=s*u+o*l+i*c-r*a,this._w=o*u-i*a-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){let i=e._x,r=e._y,s=e._z,o=e._w,a=this.dot(e);a<0&&(i=-i,r=-r,s=-s,o=-o,a=-a);let c=1-t;if(a<.9995){let l=Math.acos(a),u=Math.sin(l);c=Math.sin(c*l)/u,t=Math.sin(t*l)/u,this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+o*t,this._onChangeCallback()}else this._x=this._x*c+i*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+o*t,this.normalize();return this}slerpQuaternions(e,t,i){return this.copy(e).slerp(t,i)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),i=Math.random(),r=Math.sqrt(1-i),s=Math.sqrt(i);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},I=class n{static{n.prototype.isVector3=!0}constructor(e=0,t=0,i=0){this.x=e,this.y=t,this.z=i}set(e,t,i){return i===void 0&&(i=this.z),this.x=e,this.y=t,this.z=i,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(hb.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(hb.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*i+s[6]*r,this.y=s[1]*t+s[4]*i+s[7]*r,this.z=s[2]*t+s[5]*i+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=e.elements,o=1/(s[3]*t+s[7]*i+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*i+s[8]*r+s[12])*o,this.y=(s[1]*t+s[5]*i+s[9]*r+s[13])*o,this.z=(s[2]*t+s[6]*i+s[10]*r+s[14])*o,this}applyQuaternion(e){let t=this.x,i=this.y,r=this.z,s=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*r-a*i),u=2*(a*t-s*r),h=2*(s*i-o*t);return this.x=t+c*l+o*h-a*u,this.y=i+c*u+a*l-s*h,this.z=r+c*h+s*u-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,i=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*i+s[8]*r,this.y=s[1]*t+s[5]*i+s[9]*r,this.z=s[2]*t+s[6]*i+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let i=e.x,r=e.y,s=e.z,o=t.x,a=t.y,c=t.z;return this.x=r*c-s*a,this.y=s*o-i*c,this.z=i*a-r*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let i=e.dot(this)/t;return this.copy(e).multiplyScalar(i)}projectOnPlane(e){return Ng.copy(this).projectOnVector(e),this.sub(Ng)}reflect(e){return this.sub(Ng.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let i=this.dot(e)/t;return Math.acos(at(i,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,i=this.y-e.y,r=this.z-e.z;return t*t+i*i+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,i){let r=Math.sin(t)*e;return this.x=r*Math.sin(i),this.y=Math.cos(t)*e,this.z=r*Math.cos(i),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,i){return this.x=e*Math.sin(t),this.y=i,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),i=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=i,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,i=Math.sqrt(1-t*t);return this.x=i*Math.cos(e),this.y=t,this.z=i*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Ng=new I,hb=new sn,Qe=class n{static{n.prototype.isMatrix3=!0}constructor(e,t,i,r,s,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l)}set(e,t,i,r,s,o,a,c,l){let u=this.elements;return u[0]=e,u[1]=r,u[2]=a,u[3]=t,u[4]=s,u[5]=c,u[6]=i,u[7]=o,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],this}extractBasis(e,t,i){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),i.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[3],c=i[6],l=i[1],u=i[4],h=i[7],d=i[2],f=i[5],m=i[8],y=r[0],g=r[3],p=r[6],S=r[1],E=r[4],_=r[7],M=r[2],w=r[5],C=r[8];return s[0]=o*y+a*S+c*M,s[3]=o*g+a*E+c*w,s[6]=o*p+a*_+c*C,s[1]=l*y+u*S+h*M,s[4]=l*g+u*E+h*w,s[7]=l*p+u*_+h*C,s[2]=d*y+f*S+m*M,s[5]=d*g+f*E+m*w,s[8]=d*p+f*_+m*C,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8];return t*o*u-t*a*l-i*s*u+i*a*c+r*s*l-r*o*c}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=u*o-a*l,d=a*c-u*s,f=l*s-o*c,m=t*h+i*d+r*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let y=1/m;return e[0]=h*y,e[1]=(r*l-u*i)*y,e[2]=(a*i-r*o)*y,e[3]=d*y,e[4]=(u*t-r*c)*y,e[5]=(r*s-a*t)*y,e[6]=f*y,e[7]=(i*c-l*t)*y,e[8]=(o*t-i*s)*y,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,i,r,s,o,a){let c=Math.cos(s),l=Math.sin(s);return this.set(i*c,i*l,-i*(c*o+l*a)+o+e,-r*l,r*c,-r*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return Hr("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(Lg.makeScale(e,t)),this}rotate(e){return Hr("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(Lg.makeRotation(-e)),this}translate(e,t){return Hr("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(Lg.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,i,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<9;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<9;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e}clone(){return new this.constructor().fromArray(this.elements)}},Lg=new Qe,db=new Qe().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),fb=new Qe().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function E1(){let n={enabled:!0,workingColorSpace:pa,spaces:{},convert:function(r,s,o){return this.enabled===!1||s===o||!s||!o||(this.spaces[s].transfer===St&&(r.r=Ii(r.r),r.g=Ii(r.g),r.b=Ii(r.b)),this.spaces[s].primaries!==this.spaces[o].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===St&&(r.r=Js(r.r),r.g=Js(r.g),r.b=Js(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===Li?ma:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,o){return r.copy(this.spaces[s].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(r,s){return Hr("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),n.workingToColorSpace(r,s)},toWorkingColorSpace:function(r,s){return Hr("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),n.colorSpaceToWorking(r,s)}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],i=[.3127,.329];return n.define({[pa]:{primaries:e,whitePoint:i,transfer:ma,toXYZ:db,fromXYZ:fb,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:xn},outputColorSpaceConfig:{drawingBufferColorSpace:xn}},[xn]:{primaries:e,whitePoint:i,transfer:St,toXYZ:db,fromXYZ:fb,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:xn}}}),n}var ut=E1();function Ii(n){return n<.04045?n*.0773993808:Math.pow(n*.9478672986+.0521327014,2.4)}function Js(n){return n<.0031308?n*12.92:1.055*Math.pow(n,.41666)-.055}var Us,Lu=class{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let i;if(e instanceof HTMLCanvasElement)i=e;else{Us===void 0&&(Us=ga("canvas")),Us.width=e.width,Us.height=e.height;let r=Us.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),i=Us}return i.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=ga("canvas");t.width=e.width,t.height=e.height;let i=t.getContext("2d");i.drawImage(e,0,0,e.width,e.height);let r=i.getImageData(0,0,e.width,e.height),s=r.data;for(let o=0;o<s.length;o++)s[o]=Ii(s[o]/255)*255;return i.putImageData(r,0,0),t}else if(e.data){let t=e.data.slice(0);for(let i=0;i<t.length;i++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[i]=Math.floor(Ii(t[i]/255)*255):t[i]=Ii(t[i]);return{data:t,width:e.width,height:e.height}}else return Xe("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},T1=0,to=class{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:T1++}),this.uuid=jr(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){let t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width,t.height,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let i={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let o=0,a=r.length;o<a;o++)r[o].isDataTexture?s.push(zg(r[o].image)):s.push(zg(r[o]))}else s=zg(r);i.url=s}return t||(e.images[this.uuid]=i),i}};function zg(n){return typeof HTMLImageElement<"u"&&n instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&n instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&n instanceof ImageBitmap?Lu.getDataURL(n):n.data?{data:Array.from(n.data),width:n.width,height:n.height,type:n.data.constructor.name}:(Xe("Texture: Unable to serialize Texture."),{})}var A1=0,Ug=new I,Tn=class n extends pi{constructor(e=n.DEFAULT_IMAGE,t=n.DEFAULT_MAPPING,i=hi,r=hi,s=jt,o=_r,a=En,c=Rn,l=n.DEFAULT_ANISOTROPY,u=Li){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:A1++}),this.uuid=jr(),this.name="",this.source=new to(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=i,this.wrapT=r,this.magFilter=s,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new fe(0,0),this.repeat=new fe(1,1),this.center=new fe(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qe,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(Ug).x}get height(){return this.source.getSize(Ug).y}get depth(){return this.source.getSize(Ug).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(let t in e){let i=e[t];if(i===void 0){Xe(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Xe(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&i&&r.isVector2&&i.isVector2||r&&i&&r.isVector3&&i.isVector3||r&&i&&r.isMatrix3&&i.isMatrix3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let i={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(i.userData=this.userData),t||(e.textures[this.uuid]=i),i}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ix)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Iu:e.x=e.x-Math.floor(e.x);break;case hi:e.x=e.x<0?0:1;break;case Du:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Iu:e.y=e.y-Math.floor(e.y);break;case hi:e.y=e.y<0?0:1;break;case Du:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};Tn.DEFAULT_IMAGE=null;Tn.DEFAULT_MAPPING=Ix;Tn.DEFAULT_ANISOTROPY=1;var zt=class n{static{n.prototype.isVector4=!0}constructor(e=0,t=0,i=0,r=1){this.x=e,this.y=t,this.z=i,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,i,r){return this.x=e,this.y=t,this.z=i,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,i=this.y,r=this.z,s=this.w,o=e.elements;return this.x=o[0]*t+o[4]*i+o[8]*r+o[12]*s,this.y=o[1]*t+o[5]*i+o[9]*r+o[13]*s,this.z=o[2]*t+o[6]*i+o[10]*r+o[14]*s,this.w=o[3]*t+o[7]*i+o[11]*r+o[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,i,r,s,c=e.elements,l=c[0],u=c[4],h=c[8],d=c[1],f=c[5],m=c[9],y=c[2],g=c[6],p=c[10];if(Math.abs(u-d)<.01&&Math.abs(h-y)<.01&&Math.abs(m-g)<.01){if(Math.abs(u+d)<.1&&Math.abs(h+y)<.1&&Math.abs(m+g)<.1&&Math.abs(l+f+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let E=(l+1)/2,_=(f+1)/2,M=(p+1)/2,w=(u+d)/4,C=(h+y)/4,v=(m+g)/4;return E>_&&E>M?E<.01?(i=0,r=.707106781,s=.707106781):(i=Math.sqrt(E),r=w/i,s=C/i):_>M?_<.01?(i=.707106781,r=0,s=.707106781):(r=Math.sqrt(_),i=w/r,s=v/r):M<.01?(i=.707106781,r=.707106781,s=0):(s=Math.sqrt(M),i=C/s,r=v/s),this.set(i,r,s,t),this}let S=Math.sqrt((g-m)*(g-m)+(h-y)*(h-y)+(d-u)*(d-u));return Math.abs(S)<.001&&(S=1),this.x=(g-m)/S,this.y=(h-y)/S,this.z=(d-u)/S,this.w=Math.acos((l+f+p-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=at(this.x,e.x,t.x),this.y=at(this.y,e.y,t.y),this.z=at(this.z,e.z,t.z),this.w=at(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=at(this.x,e,t),this.y=at(this.y,e,t),this.z=at(this.z,e,t),this.w=at(this.w,e,t),this}clampLength(e,t){let i=this.length();return this.divideScalar(i||1).multiplyScalar(at(i,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,i){return this.x=e.x+(t.x-e.x)*i,this.y=e.y+(t.y-e.y)*i,this.z=e.z+(t.z-e.z)*i,this.w=e.w+(t.w-e.w)*i,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},zu=class extends pi{constructor(e=1,t=1,i={}){super(),i=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:jt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},i),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=i.depth,this.scissor=new zt(0,0,e,t),this.scissorTest=!1,this.viewport=new zt(0,0,e,t),this.textures=[];let r={width:e,height:t,depth:i.depth},s=new Tn(r),o=i.count;for(let a=0;a<o;a++)this.textures[a]=s.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(i),this.depthBuffer=i.depthBuffer,this.stencilBuffer=i.stencilBuffer,this.resolveColorBuffer=i.resolveColorBuffer,this.resolveDepthBuffer=i.resolveDepthBuffer,this.resolveStencilBuffer=i.resolveStencilBuffer,this.storeMultisampledColorBuffer=i.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=i.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=i.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=i.depthTexture,this.samples=i.samples,this.multiview=i.multiview,this.useArrayDepthTexture=i.useArrayDepthTexture}_setTextureOptions(e={}){let t={minFilter:jt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let i=0;i<this.textures.length;i++)this.textures[i].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,i=1){if(this.width!==e||this.height!==t||this.depth!==i){this.width=e,this.height=t,this.depth=i;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=i,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,i=e.textures.length;t<i;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;let r=Object.assign({},e.textures[t].image);this.textures[t].source=new to(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){let t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},on=class extends zu{constructor(e=1,t=1,i={}){super(e,t,i),this.isWebGLRenderTarget=!0}},xa=class extends Tn{constructor(e=null,t=1,i=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=hi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var Uu=class extends Tn{constructor(e=null,t=1,i=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:i,depth:r},this.magFilter=Lt,this.minFilter=Lt,this.wrapR=hi,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}};var mt=class n{static{n.prototype.isMatrix4=!0}constructor(e,t,i,r,s,o,a,c,l,u,h,d,f,m,y,g){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,i,r,s,o,a,c,l,u,h,d,f,m,y,g)}set(e,t,i,r,s,o,a,c,l,u,h,d,f,m,y,g){let p=this.elements;return p[0]=e,p[4]=t,p[8]=i,p[12]=r,p[1]=s,p[5]=o,p[9]=a,p[13]=c,p[2]=l,p[6]=u,p[10]=h,p[14]=d,p[3]=f,p[7]=m,p[11]=y,p[15]=g,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new n().fromArray(this.elements)}copy(e){let t=this.elements,i=e.elements;return t[0]=i[0],t[1]=i[1],t[2]=i[2],t[3]=i[3],t[4]=i[4],t[5]=i[5],t[6]=i[6],t[7]=i[7],t[8]=i[8],t[9]=i[9],t[10]=i[10],t[11]=i[11],t[12]=i[12],t[13]=i[13],t[14]=i[14],t[15]=i[15],this}copyPosition(e){let t=this.elements,i=e.elements;return t[12]=i[12],t[13]=i[13],t[14]=i[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,i){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),i.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),i.setFromMatrixColumn(this,2),this)}makeBasis(e,t,i){return this.set(e.x,t.x,i.x,0,e.y,t.y,i.y,0,e.z,t.z,i.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();let t=this.elements,i=e.elements,r=1/Os.setFromMatrixColumn(e,0).length(),s=1/Os.setFromMatrixColumn(e,1).length(),o=1/Os.setFromMatrixColumn(e,2).length();return t[0]=i[0]*r,t[1]=i[1]*r,t[2]=i[2]*r,t[3]=0,t[4]=i[4]*s,t[5]=i[5]*s,t[6]=i[6]*s,t[7]=0,t[8]=i[8]*o,t[9]=i[9]*o,t[10]=i[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,i=e.x,r=e.y,s=e.z,o=Math.cos(i),a=Math.sin(i),c=Math.cos(r),l=Math.sin(r),u=Math.cos(s),h=Math.sin(s);if(e.order==="XYZ"){let d=o*u,f=o*h,m=a*u,y=a*h;t[0]=c*u,t[4]=-c*h,t[8]=l,t[1]=f+m*l,t[5]=d-y*l,t[9]=-a*c,t[2]=y-d*l,t[6]=m+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*u,f=c*h,m=l*u,y=l*h;t[0]=d+y*a,t[4]=m*a-f,t[8]=o*l,t[1]=o*h,t[5]=o*u,t[9]=-a,t[2]=f*a-m,t[6]=y+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*u,f=c*h,m=l*u,y=l*h;t[0]=d-y*a,t[4]=-o*h,t[8]=m+f*a,t[1]=f+m*a,t[5]=o*u,t[9]=y-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*u,f=o*h,m=a*u,y=a*h;t[0]=c*u,t[4]=m*l-f,t[8]=d*l+y,t[1]=c*h,t[5]=y*l+d,t[9]=f*l-m,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,m=a*c,y=a*l;t[0]=c*u,t[4]=y-d*h,t[8]=m*h+f,t[1]=h,t[5]=o*u,t[9]=-a*u,t[2]=-l*u,t[6]=f*h+m,t[10]=d-y*h}else if(e.order==="XZY"){let d=o*c,f=o*l,m=a*c,y=a*l;t[0]=c*u,t[4]=-h,t[8]=l*u,t[1]=d*h+y,t[5]=o*u,t[9]=f*h-m,t[2]=m*h-f,t[6]=a*u,t[10]=y*h+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(R1,e,C1)}lookAt(e,t,i){let r=this.elements;return In.subVectors(e,t),In.lengthSq()===0&&(In.z=1),In.normalize(),nr.crossVectors(i,In),nr.lengthSq()===0&&(Math.abs(i.z)===1?In.x+=1e-4:In.z+=1e-4,In.normalize(),nr.crossVectors(i,In)),nr.normalize(),Ql.crossVectors(In,nr),r[0]=nr.x,r[4]=Ql.x,r[8]=In.x,r[1]=nr.y,r[5]=Ql.y,r[9]=In.y,r[2]=nr.z,r[6]=Ql.z,r[10]=In.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let i=e.elements,r=t.elements,s=this.elements,o=i[0],a=i[4],c=i[8],l=i[12],u=i[1],h=i[5],d=i[9],f=i[13],m=i[2],y=i[6],g=i[10],p=i[14],S=i[3],E=i[7],_=i[11],M=i[15],w=r[0],C=r[4],v=r[8],T=r[12],P=r[1],L=r[5],F=r[9],V=r[13],N=r[2],B=r[6],q=r[10],Z=r[14],se=r[3],X=r[7],ee=r[11],re=r[15];return s[0]=o*w+a*P+c*N+l*se,s[4]=o*C+a*L+c*B+l*X,s[8]=o*v+a*F+c*q+l*ee,s[12]=o*T+a*V+c*Z+l*re,s[1]=u*w+h*P+d*N+f*se,s[5]=u*C+h*L+d*B+f*X,s[9]=u*v+h*F+d*q+f*ee,s[13]=u*T+h*V+d*Z+f*re,s[2]=m*w+y*P+g*N+p*se,s[6]=m*C+y*L+g*B+p*X,s[10]=m*v+y*F+g*q+p*ee,s[14]=m*T+y*V+g*Z+p*re,s[3]=S*w+E*P+_*N+M*se,s[7]=S*C+E*L+_*B+M*X,s[11]=S*v+E*F+_*q+M*ee,s[15]=S*T+E*V+_*Z+M*re,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[12],o=e[1],a=e[5],c=e[9],l=e[13],u=e[2],h=e[6],d=e[10],f=e[14],m=e[3],y=e[7],g=e[11],p=e[15],S=c*f-l*d,E=a*f-l*h,_=a*d-c*h,M=o*f-l*u,w=o*d-c*u,C=o*h-a*u;return t*(y*S-g*E+p*_)-i*(m*S-g*M+p*w)+r*(m*E-y*M+p*C)-s*(m*_-y*w+g*C)}determinantAffine(){let e=this.elements,t=e[0],i=e[4],r=e[8],s=e[1],o=e[5],a=e[9],c=e[2],l=e[6],u=e[10];return t*(o*u-a*l)-i*(s*u-a*c)+r*(s*l-o*c)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,i){let r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=i),this}invert(){let e=this.elements,t=e[0],i=e[1],r=e[2],s=e[3],o=e[4],a=e[5],c=e[6],l=e[7],u=e[8],h=e[9],d=e[10],f=e[11],m=e[12],y=e[13],g=e[14],p=e[15],S=t*a-i*o,E=t*c-r*o,_=t*l-s*o,M=i*c-r*a,w=i*l-s*a,C=r*l-s*c,v=u*y-h*m,T=u*g-d*m,P=u*p-f*m,L=h*g-d*y,F=h*p-f*y,V=d*p-f*g,N=S*V-E*F+_*L+M*P-w*T+C*v;if(N===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let B=1/N;return e[0]=(a*V-c*F+l*L)*B,e[1]=(r*F-i*V-s*L)*B,e[2]=(y*C-g*w+p*M)*B,e[3]=(d*w-h*C-f*M)*B,e[4]=(c*P-o*V-l*T)*B,e[5]=(t*V-r*P+s*T)*B,e[6]=(g*_-m*C-p*E)*B,e[7]=(u*C-d*_+f*E)*B,e[8]=(o*F-a*P+l*v)*B,e[9]=(i*P-t*F-s*v)*B,e[10]=(m*w-y*_+p*S)*B,e[11]=(h*_-u*w-f*S)*B,e[12]=(a*T-o*L-c*v)*B,e[13]=(t*L-i*T+r*v)*B,e[14]=(y*E-m*M-g*S)*B,e[15]=(u*M-h*E+d*S)*B,this}scale(e){let t=this.elements,i=e.x,r=e.y,s=e.z;return t[0]*=i,t[4]*=r,t[8]*=s,t[1]*=i,t[5]*=r,t[9]*=s,t[2]*=i,t[6]*=r,t[10]*=s,t[3]*=i,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],i=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,i,r))}makeTranslation(e,t,i){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,i,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),i=Math.sin(e);return this.set(1,0,0,0,0,t,-i,0,0,i,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,0,i,0,0,1,0,0,-i,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),i=Math.sin(e);return this.set(t,-i,0,0,i,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let i=Math.cos(t),r=Math.sin(t),s=1-i,o=e.x,a=e.y,c=e.z,l=s*o,u=s*a;return this.set(l*o+i,l*a-r*c,l*c+r*a,0,l*a+r*c,u*a+i,u*c-r*o,0,l*c-r*a,u*c+r*o,s*c*c+i,0,0,0,0,1),this}makeScale(e,t,i){return this.set(e,0,0,0,0,t,0,0,0,0,i,0,0,0,0,1),this}makeShear(e,t,i,r,s,o){return this.set(1,i,s,0,e,1,o,0,t,r,1,0,0,0,0,1),this}compose(e,t,i){let r=this.elements,s=t._x,o=t._y,a=t._z,c=t._w,l=s+s,u=o+o,h=a+a,d=s*l,f=s*u,m=s*h,y=o*u,g=o*h,p=a*h,S=c*l,E=c*u,_=c*h,M=i.x,w=i.y,C=i.z;return r[0]=(1-(y+p))*M,r[1]=(f+_)*M,r[2]=(m-E)*M,r[3]=0,r[4]=(f-_)*w,r[5]=(1-(d+p))*w,r[6]=(g+S)*w,r[7]=0,r[8]=(m+E)*C,r[9]=(g-S)*C,r[10]=(1-(d+y))*C,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,i){let r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];let s=this.determinantAffine();if(s===0)return i.set(1,1,1),t.identity(),this;let o=Os.set(r[0],r[1],r[2]).length(),a=Os.set(r[4],r[5],r[6]).length(),c=Os.set(r[8],r[9],r[10]).length();s<0&&(o=-o),qn.copy(this);let l=1/o,u=1/a,h=1/c;return qn.elements[0]*=l,qn.elements[1]*=l,qn.elements[2]*=l,qn.elements[4]*=u,qn.elements[5]*=u,qn.elements[6]*=u,qn.elements[8]*=h,qn.elements[9]*=h,qn.elements[10]*=h,t.setFromRotationMatrix(qn),i.x=o,i.y=a,i.z=c,this}makePerspective(e,t,i,r,s,o,a=Bn,c=!1){let l=this.elements,u=2*s/(t-e),h=2*s/(i-r),d=(t+e)/(t-e),f=(i+r)/(i-r),m,y;if(c)m=s/(o-s),y=o*s/(o-s);else if(a===Bn)m=-(o+s)/(o-s),y=-2*o*s/(o-s);else if(a===Ks)m=-o/(o-s),y=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=m,l[14]=y,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,i,r,s,o,a=Bn,c=!1){let l=this.elements,u=2/(t-e),h=2/(i-r),d=-(t+e)/(t-e),f=-(i+r)/(i-r),m,y;if(c)m=1/(o-s),y=o/(o-s);else if(a===Bn)m=-2/(o-s),y=-(o+s)/(o-s);else if(a===Ks)m=-1/(o-s),y=-s/(o-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=h,l[9]=0,l[13]=f,l[2]=0,l[6]=0,l[10]=m,l[14]=y,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){let t=this.elements,i=e.elements;for(let r=0;r<16;r++)if(t[r]!==i[r])return!1;return!0}fromArray(e,t=0){for(let i=0;i<16;i++)this.elements[i]=e[i+t];return this}toArray(e=[],t=0){let i=this.elements;return e[t]=i[0],e[t+1]=i[1],e[t+2]=i[2],e[t+3]=i[3],e[t+4]=i[4],e[t+5]=i[5],e[t+6]=i[6],e[t+7]=i[7],e[t+8]=i[8],e[t+9]=i[9],e[t+10]=i[10],e[t+11]=i[11],e[t+12]=i[12],e[t+13]=i[13],e[t+14]=i[14],e[t+15]=i[15],e}},Os=new I,qn=new mt,R1=new I(0,0,0),C1=new I(1,1,1),nr=new I,Ql=new I,In=new I,pb=new mt,mb=new sn,Hn=class n{constructor(e=0,t=0,i=0,r=n.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=i,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,i,r=this._order){return this._x=e,this._y=t,this._z=i,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,i=!0){let r=e.elements,s=r[0],o=r[4],a=r[8],c=r[1],l=r[5],u=r[9],h=r[2],d=r[6],f=r[10];switch(t){case"XYZ":this._y=Math.asin(at(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-u,f),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-at(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-h,s),this._z=0);break;case"ZXY":this._x=Math.asin(at(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-h,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-at(h,-1,1)),Math.abs(h)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(at(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-h,s)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-at(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-u,f),this._y=0);break;default:Xe("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,i===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,i){return pb.makeRotationFromQuaternion(e),this.setFromRotationMatrix(pb,t,i)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return mb.setFromEuler(this),this.setFromQuaternion(mb,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Hn.DEFAULT_ORDER="XYZ";var _a=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},P1=0,gb=new I,Fs=new sn,Ti=new mt,eu=new I,ia=new I,I1=new I,D1=new sn,xb=new I(1,0,0),_b=new I(0,1,0),vb=new I(0,0,1),yb={type:"added"},N1={type:"removed"},ks={type:"childadded",child:null},Og={type:"childremoved",child:null},an=class n extends pi{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:P1++}),this.uuid=jr(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=n.DEFAULT_UP.clone();let e=new I,t=new Hn,i=new sn,r=new I(1,1,1);function s(){i.setFromEuler(t,!1)}function o(){t.setFromQuaternion(i,void 0,!1)}t._onChange(s),i._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:i},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new mt},normalMatrix:{value:new Qe}}),this.matrix=new mt,this.matrixWorld=new mt,this.matrixAutoUpdate=n.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=n.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new _a,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Fs.setFromAxisAngle(e,t),this.quaternion.multiply(Fs),this}rotateOnWorldAxis(e,t){return Fs.setFromAxisAngle(e,t),this.quaternion.premultiply(Fs),this}rotateX(e){return this.rotateOnAxis(xb,e)}rotateY(e){return this.rotateOnAxis(_b,e)}rotateZ(e){return this.rotateOnAxis(vb,e)}translateOnAxis(e,t){return gb.copy(e).applyQuaternion(this.quaternion),this.position.add(gb.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(xb,e)}translateY(e){return this.translateOnAxis(_b,e)}translateZ(e){return this.translateOnAxis(vb,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(Ti.copy(this.matrixWorld).invert())}lookAt(e,t,i){e.isVector3?eu.copy(e):eu.set(e,t,i);let r=this.parent;this.updateWorldMatrix(!0,!1),ia.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Ti.lookAt(ia,eu,this.up):Ti.lookAt(eu,ia,this.up),this.quaternion.setFromRotationMatrix(Ti),r&&(Ti.extractRotation(r.matrixWorld),Fs.setFromRotationMatrix(Ti),this.quaternion.premultiply(Fs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(Je("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yb),ks.child=e,this.dispatchEvent(ks),ks.child=null):Je("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let i=0;i<arguments.length;i++)this.remove(arguments[i]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(N1),Og.child=e,this.dispatchEvent(Og),Og.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),Ti.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),Ti.multiply(e.parent.matrixWorld)),e.applyMatrix4(Ti),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yb),ks.child=e,this.dispatchEvent(ks),ks.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let i=0,r=this.children.length;i<r;i++){let o=this.children[i].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,i=[]){this[e]===t&&i.push(this);let r=this.children;for(let s=0,o=r.length;s<o;s++)r[s].getObjectsByProperty(e,t,i);return i}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ia,e,I1),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ia,D1,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(e){e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let e=this.pivot;if(e!==null){let t=e.x,i=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*i-s[8]*r,s[13]+=i-s[1]*t-s[5]*i-s[9]*r,s[14]+=r-s[2]*t-s[6]*i-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let i=0,r=t.length;i<r;i++)t[i].updateMatrixWorld(e)}updateWorldMatrix(e,t,i=!1){let r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||i)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,i=!0),t===!0){let s=this.children;for(let o=0,a=s.length;o<a;o++)s[o].updateWorldMatrix(!1,!0,i)}}toJSON(e){let t=e===void 0||typeof e=="string",i={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},i.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(a=>({...a})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){let h=c[l];s(e.shapes,h)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(s(e.materials,this.material[c]));r.material=a}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let a=0;a<this.children.length;a++)r.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];r.animations.push(s(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),u=o(e.images),h=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);a.length>0&&(i.geometries=a),c.length>0&&(i.materials=c),l.length>0&&(i.textures=l),u.length>0&&(i.images=u),h.length>0&&(i.shapes=h),d.length>0&&(i.skeletons=d),f.length>0&&(i.animations=f),m.length>0&&(i.nodes=m)}return i.object=r,i;function o(a){let c=[];for(let l in a){let u=a[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let i=0;i<e.children.length;i++){let r=e.children[i];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};an.DEFAULT_UP=new I(0,1,0);an.DEFAULT_MATRIX_AUTO_UPDATE=!0;an.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var ce=class extends an{constructor(){super(),this.isGroup=!0,this.type="Group"}},L1={type:"move"},no=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new ce,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new ce,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new I,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new I),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new ce,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new I,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new I,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let i of e.hand.values())this._getHandJoint(t,i)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,i){let r=null,s=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let y of e.hand.values()){let g=t.getJointPose(y,i),p=this._getHandJoint(l,y);g!==null&&(p.matrix.fromArray(g.transform.matrix),p.matrix.decompose(p.position,p.rotation,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=g.radius),p.visible=g!==null}let u=l.joints["index-finger-tip"],h=l.joints["thumb-tip"],d=u.position.distanceTo(h.position),f=.02,m=.005;l.inputState.pinching&&d>f+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,i),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));a!==null&&(r=t.getPose(e.targetRaySpace,i),r===null&&s!==null&&(r=s),r!==null&&(a.matrix.fromArray(r.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,r.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(r.linearVelocity)):a.hasLinearVelocity=!1,r.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(r.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(L1)))}return a!==null&&(a.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let i=new ce;i.matrixAutoUpdate=!1,i.visible=!1,e.joints[t.jointName]=i,e.add(i)}return e.joints[t.jointName]}},MS={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},ir={h:0,s:0,l:0},tu={h:0,s:0,l:0};function Fg(n,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?n+(e-n)*6*t:t<1/2?e:t<2/3?n+(e-n)*6*(2/3-t):n}var Pe=class{constructor(e,t,i){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,i)}set(e,t,i){if(t===void 0&&i===void 0){let r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,i);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=xn){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,ut.colorSpaceToWorking(this,t),this}setRGB(e,t,i,r=ut.workingColorSpace){return this.r=e,this.g=t,this.b=i,ut.colorSpaceToWorking(this,r),this}setHSL(e,t,i,r=ut.workingColorSpace){if(e=Bx(e,1),t=at(t,0,1),i=at(i,0,1),t===0)this.r=this.g=this.b=i;else{let s=i<=.5?i*(1+t):i+t-i*t,o=2*i-s;this.r=Fg(o,s,e+1/3),this.g=Fg(o,s,e),this.b=Fg(o,s,e-1/3)}return ut.colorSpaceToWorking(this,r),this}setStyle(e,t=xn){function i(s){s!==void 0&&parseFloat(s)<1&&Xe("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s,o=r[1],a=r[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return i(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Xe("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){let s=r[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);Xe("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=xn){let i=MS[e.toLowerCase()];return i!==void 0?this.setHex(i,t):Xe("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Ii(e.r),this.g=Ii(e.g),this.b=Ii(e.b),this}copyLinearToSRGB(e){return this.r=Js(e.r),this.g=Js(e.g),this.b=Js(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=xn){return ut.workingToColorSpace(nn.copy(this),e),Math.round(at(nn.r*255,0,255))*65536+Math.round(at(nn.g*255,0,255))*256+Math.round(at(nn.b*255,0,255))}getHexString(e=xn){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=ut.workingColorSpace){ut.workingToColorSpace(nn.copy(this),t);let i=nn.r,r=nn.g,s=nn.b,o=Math.max(i,r,s),a=Math.min(i,r,s),c,l,u=(a+o)/2;if(a===o)c=0,l=0;else{let h=o-a;switch(l=u<=.5?h/(o+a):h/(2-o-a),o){case i:c=(r-s)/h+(r<s?6:0);break;case r:c=(s-i)/h+2;break;case s:c=(i-r)/h+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=ut.workingColorSpace){return ut.workingToColorSpace(nn.copy(this),t),e.r=nn.r,e.g=nn.g,e.b=nn.b,e}getStyle(e=xn){ut.workingToColorSpace(nn.copy(this),e);let t=nn.r,i=nn.g,r=nn.b;return e!==xn?`color(${e} ${t.toFixed(3)} ${i.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(i*255)},${Math.round(r*255)})`}offsetHSL(e,t,i){return this.getHSL(ir),this.setHSL(ir.h+e,ir.s+t,ir.l+i)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,i){return this.r=e.r+(t.r-e.r)*i,this.g=e.g+(t.g-e.g)*i,this.b=e.b+(t.b-e.b)*i,this}lerpHSL(e,t){this.getHSL(ir),e.getHSL(tu);let i=ua(ir.h,tu.h,t),r=ua(ir.s,tu.s,t),s=ua(ir.l,tu.l,t);return this.setHSL(i,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,i=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*i+s[6]*r,this.g=s[1]*t+s[4]*i+s[7]*r,this.b=s[2]*t+s[5]*i+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},nn=new Pe;Pe.NAMES=MS;var va=class n{constructor(e,t=1,i=1e3){this.isFog=!0,this.name="",this.color=new Pe(e),this.near=t,this.far=i}clone(){return new n(this.color,this.near,this.far)}toJSON(){return{type:"Fog",name:this.name,color:this.color.getHex(),near:this.near,far:this.far}}},Gr=class extends an{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Hn,this.environmentIntensity=1,this.environmentRotation=new Hn,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}},Yn=new I,Ai=new I,kg=new I,Ri=new I,Bs=new I,Hs=new I,bb=new I,Bg=new I,Hg=new I,Gg=new I,Vg=new zt,$g=new zt,Wg=new zt,ar=class n{constructor(e=new I,t=new I,i=new I){this.a=e,this.b=t,this.c=i}static getNormal(e,t,i,r){r.subVectors(i,t),Yn.subVectors(e,t),r.cross(Yn);let s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,i,r,s){Yn.subVectors(r,t),Ai.subVectors(i,t),kg.subVectors(e,t);let o=Yn.dot(Yn),a=Yn.dot(Ai),c=Yn.dot(kg),l=Ai.dot(Ai),u=Ai.dot(kg),h=o*l-a*a;if(h===0)return s.set(0,0,0),null;let d=1/h,f=(l*c-a*u)*d,m=(o*u-a*c)*d;return s.set(1-f-m,m,f)}static containsPoint(e,t,i,r){return this.getBarycoord(e,t,i,r,Ri)===null?!1:Ri.x>=0&&Ri.y>=0&&Ri.x+Ri.y<=1}static getInterpolation(e,t,i,r,s,o,a,c){return this.getBarycoord(e,t,i,r,Ri)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Ri.x),c.addScaledVector(o,Ri.y),c.addScaledVector(a,Ri.z),c)}static getInterpolatedAttribute(e,t,i,r,s,o){return Vg.setScalar(0),$g.setScalar(0),Wg.setScalar(0),Vg.fromBufferAttribute(e,t),$g.fromBufferAttribute(e,i),Wg.fromBufferAttribute(e,r),o.setScalar(0),o.addScaledVector(Vg,s.x),o.addScaledVector($g,s.y),o.addScaledVector(Wg,s.z),o}static isFrontFacing(e,t,i,r){return Yn.subVectors(i,t),Ai.subVectors(e,t),Yn.cross(Ai).dot(r)<0}set(e,t,i){return this.a.copy(e),this.b.copy(t),this.c.copy(i),this}setFromPointsAndIndices(e,t,i,r){return this.a.copy(e[t]),this.b.copy(e[i]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,i,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,i),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Yn.subVectors(this.c,this.b),Ai.subVectors(this.a,this.b),Yn.cross(Ai).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return n.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return n.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,i,r,s){return n.getInterpolation(e,this.a,this.b,this.c,t,i,r,s)}containsPoint(e){return n.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return n.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let i=this.a,r=this.b,s=this.c,o,a;Bs.subVectors(r,i),Hs.subVectors(s,i),Bg.subVectors(e,i);let c=Bs.dot(Bg),l=Hs.dot(Bg);if(c<=0&&l<=0)return t.copy(i);Hg.subVectors(e,r);let u=Bs.dot(Hg),h=Hs.dot(Hg);if(u>=0&&h<=u)return t.copy(r);let d=c*h-u*l;if(d<=0&&c>=0&&u<=0)return o=c/(c-u),t.copy(i).addScaledVector(Bs,o);Gg.subVectors(e,s);let f=Bs.dot(Gg),m=Hs.dot(Gg);if(m>=0&&f<=m)return t.copy(s);let y=f*l-c*m;if(y<=0&&l>=0&&m<=0)return a=l/(l-m),t.copy(i).addScaledVector(Hs,a);let g=u*m-f*h;if(g<=0&&h-u>=0&&f-m>=0)return bb.subVectors(s,r),a=(h-u)/(h-u+(f-m)),t.copy(r).addScaledVector(bb,a);let p=1/(g+y+d);return o=y*p,a=d*p,t.copy(i).addScaledVector(Bs,o).addScaledVector(Hs,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},wn=class{constructor(e=new I(1/0,1/0,1/0),t=new I(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t+=3)this.expandByPoint(Jn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,i=e.count;t<i;t++)this.expandByPoint(Jn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,i=e.length;t<i;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let i=Jn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(i),this.max.copy(e).add(i),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let i=e.geometry;if(i!==void 0){let s=i.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=s.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,Jn):Jn.fromBufferAttribute(s,o),Jn.applyMatrix4(e.matrixWorld),this.expandByPoint(Jn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),nu.copy(e.boundingBox)):(i.boundingBox===null&&i.computeBoundingBox(),nu.copy(i.boundingBox)),nu.applyMatrix4(e.matrixWorld),this.union(nu)}let r=e.children;for(let s=0,o=r.length;s<o;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,Jn),Jn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,i;return e.normal.x>0?(t=e.normal.x*this.min.x,i=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,i=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,i+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,i+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,i+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,i+=e.normal.z*this.min.z),t<=-e.constant&&i>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(ra),iu.subVectors(this.max,ra),Gs.subVectors(e.a,ra),Vs.subVectors(e.b,ra),$s.subVectors(e.c,ra),rr.subVectors(Vs,Gs),sr.subVectors($s,Vs),Lr.subVectors(Gs,$s);let t=[0,-rr.z,rr.y,0,-sr.z,sr.y,0,-Lr.z,Lr.y,rr.z,0,-rr.x,sr.z,0,-sr.x,Lr.z,0,-Lr.x,-rr.y,rr.x,0,-sr.y,sr.x,0,-Lr.y,Lr.x,0];return!Zg(t,Gs,Vs,$s,iu)||(t=[1,0,0,0,1,0,0,0,1],!Zg(t,Gs,Vs,$s,iu))?!1:(ru.crossVectors(rr,sr),t=[ru.x,ru.y,ru.z],Zg(t,Gs,Vs,$s,iu))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,Jn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(Jn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(Ci[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),Ci[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),Ci[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),Ci[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),Ci[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),Ci[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),Ci[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),Ci[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(Ci),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}},Ci=[new I,new I,new I,new I,new I,new I,new I,new I],Jn=new I,nu=new wn,Gs=new I,Vs=new I,$s=new I,rr=new I,sr=new I,Lr=new I,ra=new I,iu=new I,ru=new I,zr=new I;function Zg(n,e,t,i,r){for(let s=0,o=n.length-3;s<=o;s+=3){zr.fromArray(n,s);let a=r.x*Math.abs(zr.x)+r.y*Math.abs(zr.y)+r.z*Math.abs(zr.z),c=e.dot(zr),l=t.dot(zr),u=i.dot(zr);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>a)return!1}return!0}var Vt=new I,su=new fe,z1=0,$t=class extends pi{constructor(e,t,i=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:z1++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=i,this.usage=_S,this.updateRanges=[],this.gpuType=Nn,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,i){e*=this.itemSize,i*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[i+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,i=this.count;t<i;t++)su.fromBufferAttribute(this,t),su.applyMatrix3(e),this.setXY(t,su.x,su.y);else if(this.itemSize===3)for(let t=0,i=this.count;t<i;t++)Vt.fromBufferAttribute(this,t),Vt.applyMatrix3(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}applyMatrix4(e){for(let t=0,i=this.count;t<i;t++)Vt.fromBufferAttribute(this,t),Vt.applyMatrix4(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}applyNormalMatrix(e){for(let t=0,i=this.count;t<i;t++)Vt.fromBufferAttribute(this,t),Vt.applyNormalMatrix(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}transformDirection(e){for(let t=0,i=this.count;t<i;t++)Vt.fromBufferAttribute(this,t),Vt.transformDirection(e),this.setXYZ(t,Vt.x,Vt.y,Vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let i=this.array[e*this.itemSize+t];return this.normalized&&(i=Ys(i,this.array)),i}setComponent(e,t,i){return this.normalized&&(i=gn(i,this.array)),this.array[e*this.itemSize+t]=i,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Ys(t,this.array)),t}setX(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Ys(t,this.array)),t}setY(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Ys(t,this.array)),t}setZ(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Ys(t,this.array)),t}setW(e,t){return this.normalized&&(t=gn(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,i){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),i=gn(i,this.array)),this.array[e+0]=t,this.array[e+1]=i,this}setXYZ(e,t,i,r){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),i=gn(i,this.array),r=gn(r,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this}setXYZW(e,t,i,r,s){return e*=this.itemSize,this.normalized&&(t=gn(t,this.array),i=gn(i,this.array),r=gn(r,this.array),s=gn(s,this.array)),this.array[e+0]=t,this.array[e+1]=i,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}};var ya=class extends $t{constructor(e,t,i){super(new Uint16Array(e),t,i)}};var ba=class extends $t{constructor(e,t,i){super(new Uint32Array(e),t,i)}};var gt=class extends $t{constructor(e,t,i){super(new Float32Array(e),t,i)}},U1=new wn,sa=new I,Xg=new I,di=class{constructor(e=new I,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let i=this.center;t!==void 0?i.copy(t):U1.setFromPoints(e).getCenter(i);let r=0;for(let s=0,o=e.length;s<o;s++)r=Math.max(r,i.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let i=this.center.distanceToSquared(e);return t.copy(e),i>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;sa.subVectors(e,this.center);let t=sa.lengthSq();if(t>this.radius*this.radius){let i=Math.sqrt(t),r=(i-this.radius)*.5;this.center.addScaledVector(sa,r/i),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(Xg.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(sa.copy(e.center).add(Xg)),this.expandByPoint(sa.copy(e.center).sub(Xg))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}},O1=0,kn=new mt,qg=new an,Ws=new I,Dn=new wn,oa=new wn,qt=new I,Ht=class n extends pi{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:O1++}),this.uuid=jr(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(a1(e)?ba:ya)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,i=0){this.groups.push({start:e,count:t,materialIndex:i})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let i=this.attributes.normal;if(i!==void 0){let s=new Qe().getNormalMatrix(e);i.applyNormalMatrix(s),i.needsUpdate=!0}let r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return kn.makeRotationFromQuaternion(e),this.applyMatrix4(kn),this}rotateX(e){return kn.makeRotationX(e),this.applyMatrix4(kn),this}rotateY(e){return kn.makeRotationY(e),this.applyMatrix4(kn),this}rotateZ(e){return kn.makeRotationZ(e),this.applyMatrix4(kn),this}translate(e,t,i){return kn.makeTranslation(e,t,i),this.applyMatrix4(kn),this}scale(e,t,i){return kn.makeScale(e,t,i),this.applyMatrix4(kn),this}lookAt(e){return qg.lookAt(e),qg.updateMatrix(),this.applyMatrix4(qg.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ws).negate(),this.translate(Ws.x,Ws.y,Ws.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let i=[];for(let r=0,s=e.length;r<s;r++){let o=e[r];i.push(o.x,o.y,o.z||0)}this.setAttribute("position",new gt(i,3))}else{let i=Math.min(e.length,t.count);for(let r=0;r<i;r++){let s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Xe("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new wn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new I(-1/0,-1/0,-1/0),new I(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let i=0,r=t.length;i<r;i++){let s=t[i];Dn.setFromBufferAttribute(s),this.morphTargetsRelative?(qt.addVectors(this.boundingBox.min,Dn.min),this.boundingBox.expandByPoint(qt),qt.addVectors(this.boundingBox.max,Dn.max),this.boundingBox.expandByPoint(qt)):(this.boundingBox.expandByPoint(Dn.min),this.boundingBox.expandByPoint(Dn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&Je('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new di);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){Je("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new I,1/0);return}if(e){let i=this.boundingSphere.center;if(Dn.setFromBufferAttribute(e),t)for(let s=0,o=t.length;s<o;s++){let a=t[s];oa.setFromBufferAttribute(a),this.morphTargetsRelative?(qt.addVectors(Dn.min,oa.min),Dn.expandByPoint(qt),qt.addVectors(Dn.max,oa.max),Dn.expandByPoint(qt)):(Dn.expandByPoint(oa.min),Dn.expandByPoint(oa.max))}Dn.getCenter(i);let r=0;for(let s=0,o=e.count;s<o;s++)qt.fromBufferAttribute(e,s),r=Math.max(r,i.distanceToSquared(qt));if(t)for(let s=0,o=t.length;s<o;s++){let a=t[s],c=this.morphTargetsRelative;for(let l=0,u=a.count;l<u;l++)qt.fromBufferAttribute(a,l),c&&(Ws.fromBufferAttribute(e,l),qt.add(Ws)),r=Math.max(r,i.distanceToSquared(qt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&Je('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){Je("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let i=t.position,r=t.normal,s=t.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==i.count)&&(o=new $t(new Float32Array(4*i.count),4),this.setAttribute("tangent",o));let a=[],c=[];for(let v=0;v<i.count;v++)a[v]=new I,c[v]=new I;let l=new I,u=new I,h=new I,d=new fe,f=new fe,m=new fe,y=new I,g=new I;function p(v,T,P){l.fromBufferAttribute(i,v),u.fromBufferAttribute(i,T),h.fromBufferAttribute(i,P),d.fromBufferAttribute(s,v),f.fromBufferAttribute(s,T),m.fromBufferAttribute(s,P),u.sub(l),h.sub(l),f.sub(d),m.sub(d);let L=1/(f.x*m.y-m.x*f.y);isFinite(L)&&(y.copy(u).multiplyScalar(m.y).addScaledVector(h,-f.y).multiplyScalar(L),g.copy(h).multiplyScalar(f.x).addScaledVector(u,-m.x).multiplyScalar(L),a[v].add(y),a[T].add(y),a[P].add(y),c[v].add(g),c[T].add(g),c[P].add(g))}let S=this.groups;S.length===0&&(S=[{start:0,count:e.count}]);for(let v=0,T=S.length;v<T;++v){let P=S[v],L=P.start,F=P.count;for(let V=L,N=L+F;V<N;V+=3)p(e.getX(V+0),e.getX(V+1),e.getX(V+2))}let E=new I,_=new I,M=new I,w=new I;function C(v){M.fromBufferAttribute(r,v),w.copy(M);let T=a[v];E.copy(T),E.sub(M.multiplyScalar(M.dot(T))).normalize(),_.crossVectors(w,T);let L=_.dot(c[v])<0?-1:1;o.setXYZW(v,E.x,E.y,E.z,L)}for(let v=0,T=S.length;v<T;++v){let P=S[v],L=P.start,F=P.count;for(let V=L,N=L+F;V<N;V+=3)C(e.getX(V+0)),C(e.getX(V+1)),C(e.getX(V+2))}this._transformed=!0}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let i=this.getAttribute("normal");if(i===void 0||i.count!==t.count)i=new $t(new Float32Array(t.count*3),3),this.setAttribute("normal",i);else for(let d=0,f=i.count;d<f;d++)i.setXYZ(d,0,0,0);let r=new I,s=new I,o=new I,a=new I,c=new I,l=new I,u=new I,h=new I;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),y=e.getX(d+1),g=e.getX(d+2);r.fromBufferAttribute(t,m),s.fromBufferAttribute(t,y),o.fromBufferAttribute(t,g),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),a.fromBufferAttribute(i,m),c.fromBufferAttribute(i,y),l.fromBufferAttribute(i,g),a.add(u),c.add(u),l.add(u),i.setXYZ(m,a.x,a.y,a.z),i.setXYZ(y,c.x,c.y,c.z),i.setXYZ(g,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),u.subVectors(o,s),h.subVectors(r,s),u.cross(h),i.setXYZ(d+0,u.x,u.y,u.z),i.setXYZ(d+1,u.x,u.y,u.z),i.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),i.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,i=e.count;t<i;t++)qt.fromBufferAttribute(e,t),qt.normalize(),e.setXYZ(t,qt.x,qt.y,qt.z)}toNonIndexed(){function e(a,c){let l=a.array,u=a.itemSize,h=a.normalized,d=new l.constructor(c.length*u),f=0,m=0;for(let y=0,g=c.length;y<g;y++){a.isInterleavedBufferAttribute?f=c[y]*a.data.stride+a.offset:f=c[y]*u;for(let p=0;p<u;p++)d[m++]=l[f++]}return new $t(d,u,h)}if(this.index===null)return Xe("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new n,i=this.index.array,r=this.attributes;for(let a in r){let c=r[a],l=e(c,i);t.setAttribute(a,l)}let s=this.morphAttributes;for(let a in s){let c=[],l=s[a];for(let u=0,h=l.length;u<h;u++){let d=l[u],f=e(d,i);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let i=this.attributes;for(let c in i){let l=i[c];e.data.attributes[c]=l.toJSON(e.data)}let r={},s=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],u=[];for(let h=0,d=l.length;h<d;h++){let f=l[h];u.push(f.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere=a.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let i=e.index;i!==null&&this.setIndex(i.clone());let r=e.attributes;for(let l in r){let u=r[l];this.setAttribute(l,u.clone(t))}let s=e.morphAttributes;for(let l in s){let u=[],h=s[l];for(let d=0,f=h.length;d<f;d++)u.push(h[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,u=o.length;l<u;l++){let h=o[l];this.addGroup(h.start,h.count,h.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Yg=new I,F1=new I,k1=new Qe,jn=class{constructor(e=new I(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,i,r){return this.normal.set(e,t,i),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,i){let r=Yg.subVectors(i,t).cross(F1.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,i=!0){let r=e.delta(Yg),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let o=-(e.start.dot(this.normal)+this.constant)/s;return i===!0&&(o<0||o>1)?null:t.copy(e.start).addScaledVector(r,o)}intersectsLine(e){let t=this.distanceToPoint(e.start),i=this.distanceToPoint(e.end);return t<0&&i>0||i<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let i=t||k1.getNormalMatrix(e),r=this.coplanarPoint(Yg).applyMatrix4(e),s=this.normal.applyMatrix3(i).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}},B1=0,cr=class extends pi{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:B1++}),this.uuid=jr(),this.name="",this.type="Material",this.blending=co,this.side=gr,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=bx,this.blendDst=Sx,this.blendEquation=Yr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Pe(0,0,0),this.blendAlpha=0,this.depthFunc=js,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=hS,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Mu,this.stencilZFail=Mu,this.stencilZPass=Mu,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let i=e[t];if(i===void 0){Xe(`Material: parameter '${t}' has value of undefined.`);continue}let r=this[t];if(r===void 0){Xe(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(i):r&&r.isVector2&&i&&i.isVector2||r&&r.isEuler&&i&&i.isEuler||r&&r.isVector3&&i&&i.isVector3?r.copy(i):this[t]=i}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let i={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};i.uuid=this.uuid,i.type=this.type,i.blending=this.blending,i.side=this.side,i.shadowSide=this.shadowSide,i.vertexColors=this.vertexColors,i.opacity=this.opacity,i.transparent=this.transparent,i.blendSrc=this.blendSrc,i.blendDst=this.blendDst,i.blendEquation=this.blendEquation,i.blendSrcAlpha=this.blendSrcAlpha,i.blendDstAlpha=this.blendDstAlpha,i.blendEquationAlpha=this.blendEquationAlpha,i.blendColor=this.blendColor.getHex(),i.blendAlpha=this.blendAlpha,i.depthFunc=this.depthFunc,i.depthTest=this.depthTest,i.depthWrite=this.depthWrite,i.colorWrite=this.colorWrite,i.clipIntersection=this.clipIntersection,i.clipShadows=this.clipShadows,i.stencilWriteMask=this.stencilWriteMask,i.stencilFunc=this.stencilFunc,i.stencilRef=this.stencilRef,i.stencilFuncMask=this.stencilFuncMask,i.stencilFail=this.stencilFail,i.stencilZFail=this.stencilZFail,i.stencilZPass=this.stencilZPass,i.stencilWrite=this.stencilWrite,i.polygonOffset=this.polygonOffset,i.polygonOffsetFactor=this.polygonOffsetFactor,i.polygonOffsetUnits=this.polygonOffsetUnits,i.dithering=this.dithering,i.alphaTest=this.alphaTest,i.alphaHash=this.alphaHash,i.alphaToCoverage=this.alphaToCoverage,i.premultipliedAlpha=this.premultipliedAlpha,i.forceSinglePass=this.forceSinglePass,i.allowOverride=this.allowOverride,i.visible=this.visible,i.toneMapped=this.toneMapped,i.name=this.name,this.color&&this.color.isColor&&(i.color=this.color.getHex()),this.roughness!==void 0&&(i.roughness=this.roughness),this.metalness!==void 0&&(i.metalness=this.metalness),this.sheen!==void 0&&(i.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(i.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(i.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(i.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(i.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(i.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(i.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(i.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(i.shininess=this.shininess),this.clearcoat!==void 0&&(i.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(i.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(i.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(i.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(i.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,i.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(i.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(i.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(i.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(i.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(i.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(i.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(i.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(i.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(i.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(i.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(i.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(i.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(i.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(i.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(i.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(i.lightMap=this.lightMap.toJSON(e).uuid,i.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(i.aoMap=this.aoMap.toJSON(e).uuid,i.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(i.bumpMap=this.bumpMap.toJSON(e).uuid,i.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(i.normalMap=this.normalMap.toJSON(e).uuid,i.normalMapType=this.normalMapType,i.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(i.displacementMap=this.displacementMap.toJSON(e).uuid,i.displacementScale=this.displacementScale,i.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(i.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(i.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(i.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(i.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(i.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(i.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(i.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(i.combine=this.combine)),this.envMapRotation!==void 0&&(i.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(i.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(i.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(i.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(i.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(i.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(i.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(i.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(i.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(i.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(i.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(i.size=this.size),this.sizeAttenuation!==void 0&&(i.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(i.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(i.rotation=this.rotation),this.depthPacking!==void 0&&(i.depthPacking=this.depthPacking),this.linewidth!==void 0&&(i.linewidth=this.linewidth),this.linecap!==void 0&&(i.linecap=this.linecap),this.linejoin!==void 0&&(i.linejoin=this.linejoin),this.dashSize!==void 0&&(i.dashSize=this.dashSize),this.gapSize!==void 0&&(i.gapSize=this.gapSize),this.scale!==void 0&&(i.scale=this.scale),this.wireframe!==void 0&&(i.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(i.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(i.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(i.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(i.flatShading=this.flatShading),this.fog!==void 0&&(i.fog=this.fog),Object.keys(this.userData).length>0&&(i.userData=this.userData);function r(s){let o=[];for(let a in s){let c=s[a];delete c.metadata,o.push(c)}return o}if(t){let s=r(e.textures),o=r(e.images);s.length>0&&(i.textures=s),o.length>0&&(i.images=o)}return i}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new Pe().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=e.iridescenceThicknessRange),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(i=>new jn().fromJSON(i))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let i=e.normalScale;Array.isArray(i)===!1&&(i=[i,i]),this.normalScale=new fe().fromArray(i)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new fe().fromArray(e.clearcoatNormalScale)),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,i=null;if(t!==null){let r=t.length;i=new Array(r);for(let s=0;s!==r;++s)i[s]=t[s].clone()}return this.clippingPlanes=i,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}};var Pi=new I,Jg=new I,ou=new I,au=new I,Ou=class{constructor(e=new I,t=new I(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,Pi)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let i=t.dot(this.direction);return i<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,i)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=Pi.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(Pi.copy(this.origin).addScaledVector(this.direction,t),Pi.distanceToSquared(e))}distanceSqToSegment(e,t,i,r){Jg.copy(e).add(t).multiplyScalar(.5),ou.copy(t).sub(e).normalize(),au.copy(this.origin).sub(Jg);let s=e.distanceTo(t)*.5,o=-this.direction.dot(ou),a=au.dot(this.direction),c=-au.dot(ou),l=au.lengthSq(),u=Math.abs(1-o*o),h,d,f,m;if(u>0)if(h=o*c-a,d=o*a-c,m=s*u,h>=0)if(d>=-m)if(d<=m){let y=1/u;h*=y,d*=y,f=h*(h+o*d+2*a)+d*(o*h+d+2*c)+l}else d=s,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d=-s,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;else d<=-m?(h=Math.max(0,-(-o*s+a)),d=h>0?-s:Math.min(Math.max(-s,-c),s),f=-h*h+d*(d+2*c)+l):d<=m?(h=0,d=Math.min(Math.max(-s,-c),s),f=d*(d+2*c)+l):(h=Math.max(0,-(o*s+a)),d=h>0?s:Math.min(Math.max(-s,-c),s),f=-h*h+d*(d+2*c)+l);else d=o>0?-s:s,h=Math.max(0,-(o*d+a)),f=-h*h+d*(d+2*c)+l;return i&&i.copy(this.origin).addScaledVector(this.direction,h),r&&r.copy(Jg).addScaledVector(ou,d),f}intersectSphere(e,t){if(e.radius<0)return null;Pi.subVectors(e.center,this.origin);let i=Pi.dot(this.direction),r=Pi.dot(Pi)-i*i,s=e.radius*e.radius;if(r>s)return null;let o=Math.sqrt(s-r),a=i-o,c=i+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let i=-(this.origin.dot(e.normal)+e.constant)/t;return i>=0?i:null}intersectPlane(e,t){let i=this.distanceToPlane(e);return i===null?null:this.at(i,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let i,r,s,o,a,c,l=1/this.direction.x,u=1/this.direction.y,h=1/this.direction.z,d=this.origin;return l>=0?(i=(e.min.x-d.x)*l,r=(e.max.x-d.x)*l):(i=(e.max.x-d.x)*l,r=(e.min.x-d.x)*l),u>=0?(s=(e.min.y-d.y)*u,o=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,o=(e.min.y-d.y)*u),i>o||s>r||((s>i||isNaN(i))&&(i=s),(o<r||isNaN(r))&&(r=o),h>=0?(a=(e.min.z-d.z)*h,c=(e.max.z-d.z)*h):(a=(e.max.z-d.z)*h,c=(e.min.z-d.z)*h),i>c||a>r)||((a>i||i!==i)&&(i=a),(c<r||r!==r)&&(r=c),r<0)?null:this.at(i>=0?i:r,t)}intersectsBox(e){return this.intersectBox(e,Pi)!==null}intersectTriangle(e,t,i,r,s){let o=this.origin,a=this.direction,c=a.x,l=a.y,u=a.z,h=e.x-o.x,d=e.y-o.y,f=e.z-o.z,m=t.x-o.x,y=t.y-o.y,g=t.z-o.z,p=i.x-o.x,S=i.y-o.y,E=i.z-o.z,_=Math.abs(c),M=Math.abs(l),w=Math.abs(u),C,v,T,P,L,F,V,N,B,q,Z,se;if(_>=M&&_>=w?(T=c,F=h,B=m,se=p,c>=0?(C=l,v=u,P=d,L=f,V=y,N=g,q=S,Z=E):(C=u,v=l,P=f,L=d,V=g,N=y,q=E,Z=S)):M>=w?(T=l,F=d,B=y,se=S,l>=0?(C=u,v=c,P=f,L=h,V=g,N=m,q=E,Z=p):(C=c,v=u,P=h,L=f,V=m,N=g,q=p,Z=E)):(T=u,F=f,B=g,se=E,u>=0?(C=c,v=l,P=h,L=d,V=m,N=y,q=p,Z=S):(C=l,v=c,P=d,L=h,V=y,N=m,q=S,Z=p)),T===0)return null;let X=C/T,ee=v/T,re=1/T,De=P-X*F,Re=L-ee*F,ht=V-X*B,nt=N-ee*B,dt=q-X*se,Y=Z-ee*se,te=dt*nt-Y*ht,ye=De*Y-Re*dt,$e=ht*Re-nt*De;if(r){if(te<0||ye<0||$e<0)return null}else if((te<0||ye<0||$e<0)&&(te>0||ye>0||$e>0))return null;let Ae=te+ye+$e;if(Ae===0)return null;let qe=re*(te*F+ye*B+$e*se);return(Ae>0?qe<0:qe>0)?null:this.at(qe/Ae,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},An=class extends cr{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Pe(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Hn,this.combine=Mx,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}},Sb=new mt,Ur=new Ou,cu=new di,Mb=new I,lu=new I,uu=new I,hu=new I,jg=new I,du=new I,wb=new I,fu=new I,Ve=class extends an{constructor(e=new Ht,t=new An){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,i=Object.keys(t);if(i.length>0){let r=t[i[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=r.length;s<o;s++){let a=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(e,t){let i=this.geometry,r=i.attributes.position,s=i.morphAttributes.position,o=i.morphTargetsRelative;t.fromBufferAttribute(r,e);let a=this.morphTargetInfluences;if(s&&a){du.set(0,0,0);for(let c=0,l=s.length;c<l;c++){let u=a[c],h=s[c];u!==0&&(jg.fromBufferAttribute(h,e),o?du.addScaledVector(jg,u):du.addScaledVector(jg.sub(t),u))}t.add(du)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){let i=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(i.boundingSphere===null&&i.computeBoundingSphere(),cu.copy(i.boundingSphere),cu.applyMatrix4(s),Ur.copy(e.ray).recast(e.near),!(cu.containsPoint(Ur.origin)===!1&&(Ur.intersectSphere(cu,Mb)===null||Ur.origin.distanceToSquared(Mb)>(e.far-e.near)**2))&&(Sb.copy(s).invert(),Ur.copy(e.ray).applyMatrix4(Sb),!(i.boundingBox!==null&&Ur.intersectsBox(i.boundingBox)===!1)&&this._computeIntersections(e,t,Ur)))}_computeIntersections(e,t,i){let r,s=this.geometry,o=this.material,a=s.index,c=s.attributes.position,l=s.attributes.uv,u=s.attributes.uv1,h=s.attributes.normal,d=s.groups,f=s.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,y=d.length;m<y;m++){let g=d[m],p=o[g.materialIndex],S=Math.max(g.start,f.start),E=Math.min(a.count,Math.min(g.start+g.count,f.start+f.count));for(let _=S,M=E;_<M;_+=3){let w=a.getX(_),C=a.getX(_+1),v=a.getX(_+2);r=pu(this,p,e,i,l,u,h,w,C,v),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let m=Math.max(0,f.start),y=Math.min(a.count,f.start+f.count);for(let g=m,p=y;g<p;g+=3){let S=a.getX(g),E=a.getX(g+1),_=a.getX(g+2);r=pu(this,o,e,i,l,u,h,S,E,_),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,y=d.length;m<y;m++){let g=d[m],p=o[g.materialIndex],S=Math.max(g.start,f.start),E=Math.min(c.count,Math.min(g.start+g.count,f.start+f.count));for(let _=S,M=E;_<M;_+=3){let w=_,C=_+1,v=_+2;r=pu(this,p,e,i,l,u,h,w,C,v),r&&(r.faceIndex=Math.floor(_/3),r.face.materialIndex=g.materialIndex,t.push(r))}}else{let m=Math.max(0,f.start),y=Math.min(c.count,f.start+f.count);for(let g=m,p=y;g<p;g+=3){let S=g,E=g+1,_=g+2;r=pu(this,o,e,i,l,u,h,S,E,_),r&&(r.faceIndex=Math.floor(g/3),t.push(r))}}}};function H1(n,e,t,i,r,s,o,a){let c;if(e.side===Kt?c=i.intersectTriangle(o,s,r,!0,a):c=i.intersectTriangle(r,s,o,e.side===gr,a),c===null)return null;fu.copy(a),fu.applyMatrix4(n.matrixWorld);let l=t.ray.origin.distanceTo(fu);return l<t.near||l>t.far?null:{distance:l,point:fu.clone(),object:n}}function pu(n,e,t,i,r,s,o,a,c,l){n.getVertexPosition(a,lu),n.getVertexPosition(c,uu),n.getVertexPosition(l,hu);let u=H1(n,e,t,i,lu,uu,hu,wb);if(u){let h=new I;ar.getBarycoord(wb,lu,uu,hu,h),r&&(u.uv=ar.getInterpolatedAttribute(r,a,c,l,h,new fe)),s&&(u.uv1=ar.getInterpolatedAttribute(s,a,c,l,h,new fe)),o&&(u.normal=ar.getInterpolatedAttribute(o,a,c,l,h,new I),u.normal.dot(i.direction)>0&&u.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new I,materialIndex:0};ar.getNormal(lu,uu,hu,d.normal),u.face=d,u.barycoord=h}return u}var Kn=class extends Tn{constructor(e=null,t=1,i=1,r,s,o,a,c,l=Lt,u=Lt,h,d){super(null,o,a,c,l,u,r,s,h,d),this.isDataTexture=!0,this.image={data:e,width:t,height:i},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Or=new di,G1=new fe(.5,.5),mu=new I,Di=class{constructor(e=new jn,t=new jn,i=new jn,r=new jn,s=new jn,o=new jn){this.planes=[e,t,i,r,s,o]}set(e,t,i,r,s,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(i),a[3].copy(r),a[4].copy(s),a[5].copy(o),this}copy(e){let t=this.planes;for(let i=0;i<6;i++)t[i].copy(e.planes[i]);return this}setFromProjectionMatrix(e,t=Bn,i=!1){let r=this.planes,s=e.elements,o=s[0],a=s[1],c=s[2],l=s[3],u=s[4],h=s[5],d=s[6],f=s[7],m=s[8],y=s[9],g=s[10],p=s[11],S=s[12],E=s[13],_=s[14],M=s[15];if(r[0].setComponents(l-o,f-u,p-m,M-S).normalize(),r[1].setComponents(l+o,f+u,p+m,M+S).normalize(),r[2].setComponents(l+a,f+h,p+y,M+E).normalize(),r[3].setComponents(l-a,f-h,p-y,M-E).normalize(),i)r[4].setComponents(c,d,g,_).normalize(),r[5].setComponents(l-c,f-d,p-g,M-_).normalize();else if(r[4].setComponents(l-c,f-d,p-g,M-_).normalize(),t===Bn)r[5].setComponents(l+c,f+d,p+g,M+_).normalize();else if(t===Ks)r[5].setComponents(c,d,g,_).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Or.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Or.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Or)}intersectsSprite(e){Or.center.set(0,0,0);let t=G1.distanceTo(e.center);return Or.radius=.7071067811865476+t,Or.applyMatrix4(e.matrixWorld),this.intersectsSphere(Or)}intersectsSphere(e){let t=this.planes,i=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(i)<r)return!1;return!0}intersectsBox(e){let t=this.planes;for(let i=0;i<6;i++){let r=t[i];if(mu.x=r.normal.x>0?e.max.x:e.min.x,mu.y=r.normal.y>0?e.max.y:e.min.y,mu.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(mu)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let i=0;i<6;i++)if(t[i].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}},Eb=new mt,Fu=class n{constructor(){this.coordinateSystem=Bn,this._frustums=[],this._count=0}setFromArrayCamera(e){let t=e.cameras,i=this._frustums;for(let r=0;r<t.length;r++){let s=t[r];Eb.multiplyMatrices(s.projectionMatrix,s.matrixWorldInverse),i[r]===void 0&&(i[r]=new Di),i[r].setFromProjectionMatrix(Eb,s.coordinateSystem,s.reversedDepth)}return this._count=t.length,this}intersectsObject(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsObject(e))return!0;return!1}intersectsSprite(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSprite(e))return!0;return!1}intersectsSphere(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsSphere(e))return!0;return!1}intersectsBox(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].intersectsBox(e))return!0;return!1}containsPoint(e){let t=this._frustums;for(let i=0;i<this._count;i++)if(t[i].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;let t=this._frustums,i=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Di),t[r].copy(i[r]);return this._count=e._count,this}clone(){return new n().copy(this)}};function Kg(n,e){return n-e}function V1(n,e){return n.z-e.z}function $1(n,e){return e.z-n.z}var lx=class{constructor(){this.index=0,this.pool=[],this.list=[]}push(e,t,i,r){let s=this.pool,o=this.list;this.index>=s.length&&s.push({start:-1,count:-1,z:-1,index:-1});let a=s[this.index];o.push(a),this.index++,a.start=e,a.count=t,a.z=i,a.index=r}reset(){this.list.length=0,this.index=0}},Mn=new mt,W1=new Pe(1,1,1),Z1=new Di,X1=new Fu,gu=new wn,Fr=new di,aa=new I,Tb=new I,q1=new I,Qg=new lx,rn=new Ve,xu=[];function Y1(n,e,t=0){let i=e.itemSize;if(n.isInterleavedBufferAttribute||n.array.constructor!==e.array.constructor){let r=n.count;for(let s=0;s<r;s++)for(let o=0;o<i;o++)e.setComponent(s+t,o,n.getComponent(s,o))}else e.array.set(n.array,t*i);e.needsUpdate=!0}function kr(n,e){if(n.constructor!==e.constructor){let t=Math.min(n.length,e.length);for(let i=0;i<t;i++)e[i]=n[i]}else{let t=Math.min(n.length,e.length);e.set(new n.constructor(n.buffer,0,t))}}var Sa=class extends Ve{constructor(e,t,i=t*2,r){super(new Ht,r),this.isBatchedMesh=!0,this.perObjectFrustumCulled=!0,this.sortObjects=!0,this.boundingBox=null,this.boundingSphere=null,this.customSort=null,this._instanceInfo=[],this._geometryInfo=[],this._availableInstanceIds=[],this._availableGeometryIds=[],this._nextIndexStart=0,this._nextVertexStart=0,this._geometryCount=0,this._visibilityChanged=!0,this._geometryInitialized=!1,this._maxInstanceCount=e,this._maxVertexCount=t,this._maxIndexCount=i,this._multiDrawCounts=new Int32Array(e),this._multiDrawStarts=new Int32Array(e),this._multiDrawCount=0,this._multiDrawBytesPerElement=1,this._matricesTexture=null,this._indirectTexture=null,this._colorsTexture=null,this._initMatricesTexture(),this._initIndirectTexture()}get maxInstanceCount(){return this._maxInstanceCount}get instanceCount(){return this._instanceInfo.length-this._availableInstanceIds.length}get unusedVertexCount(){return this._maxVertexCount-this._nextVertexStart}get unusedIndexCount(){return this._maxIndexCount-this._nextIndexStart}_initMatricesTexture(){let e=Math.sqrt(this._maxInstanceCount*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4),i=new Kn(t,e,e,En,Nn);this._matricesTexture=i}_initIndirectTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Uint32Array(e*e),i=new Kn(t,e,e,Za,Vn);this._indirectTexture=i}_initColorsTexture(){let e=Math.sqrt(this._maxInstanceCount);e=Math.ceil(e);let t=new Float32Array(e*e*4).fill(1),i=new Kn(t,e,e,En,Nn);i.colorSpace=ut.workingColorSpace,this._colorsTexture=i}_initializeGeometry(e){let t=this.geometry,i=this._maxVertexCount,r=this._maxIndexCount;if(this._geometryInitialized===!1){for(let s in e.attributes){let o=e.getAttribute(s),{array:a,itemSize:c,normalized:l}=o,u=new a.constructor(i*c),h=new $t(u,c,l);t.setAttribute(s,h)}if(e.getIndex()!==null){let s=i>65535?new Uint32Array(r):new Uint16Array(r);t.setIndex(new $t(s,1))}this._geometryInitialized=!0}}_validateGeometry(e){let t=this.geometry;if(!!e.getIndex()!=!!t.getIndex())throw new Error('THREE.BatchedMesh: All geometries must consistently have "index".');for(let i in t.attributes){if(!e.hasAttribute(i))throw new Error(`THREE.BatchedMesh: Added geometry missing "${i}". All geometries must have consistent attributes.`);let r=e.getAttribute(i),s=t.getAttribute(i);if(r.itemSize!==s.itemSize||r.normalized!==s.normalized)throw new Error("THREE.BatchedMesh: All attributes must have a consistent itemSize and normalized value.")}}validateInstanceId(e){let t=this._instanceInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid instanceId ${e}. Instance is either out of range or has been deleted.`)}validateGeometryId(e){let t=this._geometryInfo;if(e<0||e>=t.length||t[e].active===!1)throw new Error(`THREE.BatchedMesh: Invalid geometryId ${e}. Geometry is either out of range or has been deleted.`)}setCustomSort(e){return this.customSort=e,this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new wn);let e=this.boundingBox,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let s=t[i].geometryIndex;this.getMatrixAt(i,Mn),this.getBoundingBoxAt(s,gu).applyMatrix4(Mn),e.union(gu)}}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new di);let e=this.boundingSphere,t=this._instanceInfo;e.makeEmpty();for(let i=0,r=t.length;i<r;i++){if(t[i].active===!1)continue;let s=t[i].geometryIndex;this.getMatrixAt(i,Mn),this.getBoundingSphereAt(s,Fr).applyMatrix4(Mn),e.union(Fr)}}addInstance(e){if(this._instanceInfo.length>=this.maxInstanceCount&&this._availableInstanceIds.length===0)throw new Error("THREE.BatchedMesh: Maximum item count reached.");let i={visible:!0,active:!0,geometryIndex:e},r=null;this._availableInstanceIds.length>0?(this._availableInstanceIds.sort(Kg),r=this._availableInstanceIds.shift(),this._instanceInfo[r]=i):(r=this._instanceInfo.length,this._instanceInfo.push(i));let s=this._matricesTexture;Mn.identity().toArray(s.image.data,r*16),s.needsUpdate=!0;let o=this._colorsTexture;return o&&(W1.toArray(o.image.data,r*4),o.needsUpdate=!0),this._visibilityChanged=!0,r}addGeometry(e,t=-1,i=-1){this._initializeGeometry(e),this._validateGeometry(e);let r={vertexStart:-1,vertexCount:-1,reservedVertexCount:-1,indexStart:-1,indexCount:-1,reservedIndexCount:-1,start:-1,count:-1,boundingBox:null,boundingSphere:null,active:!0},s=this._geometryInfo;r.vertexStart=this._nextVertexStart,r.reservedVertexCount=t===-1?e.getAttribute("position").count:t;let o=e.getIndex();if(o!==null&&(r.indexStart=this._nextIndexStart,r.reservedIndexCount=i===-1?o.count:i),r.indexStart!==-1&&r.indexStart+r.reservedIndexCount>this._maxIndexCount||r.vertexStart+r.reservedVertexCount>this._maxVertexCount)throw new Error("THREE.BatchedMesh: Reserved space request exceeds the maximum buffer size.");let c;return this._availableGeometryIds.length>0?(this._availableGeometryIds.sort(Kg),c=this._availableGeometryIds.shift(),s[c]=r):(c=this._geometryCount,this._geometryCount++,s.push(r)),this.setGeometryAt(c,e),this._nextIndexStart=r.indexStart+r.reservedIndexCount,this._nextVertexStart=r.vertexStart+r.reservedVertexCount,c}setGeometryAt(e,t){if(e>=this._geometryCount)throw new Error("THREE.BatchedMesh: Maximum geometry count reached.");this._validateGeometry(t);let i=this.geometry,r=i.getIndex()!==null,s=i.getIndex(),o=t.getIndex(),a=this._geometryInfo[e];if(r&&o.count>a.reservedIndexCount||t.attributes.position.count>a.reservedVertexCount)throw new Error("THREE.BatchedMesh: Reserved space not large enough for provided geometry.");let c=a.vertexStart,l=a.reservedVertexCount;a.vertexCount=t.getAttribute("position").count;for(let u in i.attributes){let h=t.getAttribute(u),d=i.getAttribute(u);Y1(h,d,c);let f=h.itemSize;for(let m=h.count,y=l;m<y;m++){let g=c+m;for(let p=0;p<f;p++)d.setComponent(g,p,0)}d.needsUpdate=!0,d.addUpdateRange(c*f,l*f)}if(r){let u=a.indexStart,h=a.reservedIndexCount;a.indexCount=t.getIndex().count;for(let d=0;d<o.count;d++)s.setX(u+d,c+o.getX(d));for(let d=o.count,f=h;d<f;d++)s.setX(u+d,c);s.needsUpdate=!0,s.addUpdateRange(u,a.reservedIndexCount)}return a.start=r?a.indexStart:a.vertexStart,a.count=r?a.indexCount:a.vertexCount,a.boundingBox=null,t.boundingBox!==null&&(a.boundingBox=t.boundingBox.clone()),a.boundingSphere=null,t.boundingSphere!==null&&(a.boundingSphere=t.boundingSphere.clone()),this._visibilityChanged=!0,e}deleteGeometry(e){let t=this._geometryInfo;if(e>=t.length||t[e].active===!1)return this;let i=this._instanceInfo;for(let r=0,s=i.length;r<s;r++)i[r].active&&i[r].geometryIndex===e&&this.deleteInstance(r);return t[e].active=!1,this._availableGeometryIds.push(e),this._visibilityChanged=!0,this}deleteInstance(e){return this.validateInstanceId(e),this._instanceInfo[e].active=!1,this._availableInstanceIds.push(e),this._visibilityChanged=!0,this}optimize(){let e=0,t=0,i=this._geometryInfo,r=i.map((o,a)=>a).sort((o,a)=>i[o].vertexStart-i[a].vertexStart),s=this.geometry;for(let o=0,a=i.length;o<a;o++){let c=r[o],l=i[c];if(l.active!==!1){if(s.index!==null){if(l.indexStart!==t){let{indexStart:u,vertexStart:h,reservedIndexCount:d}=l,f=s.index,m=f.array,y=e-h;for(let g=u;g<u+d;g++)m[g]=m[g]+y;f.array.copyWithin(t,u,u+d),f.addUpdateRange(t,d),f.needsUpdate=!0,l.indexStart=t}t+=l.reservedIndexCount}if(l.vertexStart!==e){let{vertexStart:u,reservedVertexCount:h}=l,d=s.attributes;for(let f in d){let m=d[f],{array:y,itemSize:g}=m;y.copyWithin(e*g,u*g,(u+h)*g),m.addUpdateRange(e*g,h*g),m.needsUpdate=!0}l.vertexStart=e}e+=l.reservedVertexCount,l.start=s.index?l.indexStart:l.vertexStart}}return this._nextIndexStart=t,this._nextVertexStart=e,this._visibilityChanged=!0,this}getBoundingBoxAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingBox===null){let s=new wn,o=i.index,a=i.attributes.position;for(let c=r.start,l=r.start+r.count;c<l;c++){let u=c;o&&(u=o.getX(u)),s.expandByPoint(aa.fromBufferAttribute(a,u))}r.boundingBox=s}return t.copy(r.boundingBox),t}getBoundingSphereAt(e,t){if(e>=this._geometryCount)return null;let i=this.geometry,r=this._geometryInfo[e];if(r.boundingSphere===null){let s=new di;this.getBoundingBoxAt(e,gu),gu.getCenter(s.center);let o=i.index,a=i.attributes.position,c=0;for(let l=r.start,u=r.start+r.count;l<u;l++){let h=l;o&&(h=o.getX(h)),aa.fromBufferAttribute(a,h),c=Math.max(c,s.center.distanceToSquared(aa))}s.radius=Math.sqrt(c),r.boundingSphere=s}return t.copy(r.boundingSphere),t}setMatrixAt(e,t){this.validateInstanceId(e);let i=this._matricesTexture,r=this._matricesTexture.image.data;return t.toArray(r,e*16),i.needsUpdate=!0,this}getMatrixAt(e,t){return this.validateInstanceId(e),t.fromArray(this._matricesTexture.image.data,e*16)}setColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null&&this._initColorsTexture(),t.toArray(this._colorsTexture.image.data,e*4),this._colorsTexture.needsUpdate=!0,this}getColorAt(e,t){return this.validateInstanceId(e),this._colorsTexture===null?t.isVector4?t.set(1,1,1,1):t.setRGB(1,1,1):t.fromArray(this._colorsTexture.image.data,e*4)}setVisibleAt(e,t){return this.validateInstanceId(e),this._instanceInfo[e].visible===t?this:(this._instanceInfo[e].visible=t,this._visibilityChanged=!0,this)}getVisibleAt(e){return this.validateInstanceId(e),this._instanceInfo[e].visible}setGeometryIdAt(e,t){return this.validateInstanceId(e),this.validateGeometryId(t),this._instanceInfo[e].geometryIndex=t,this._visibilityChanged=!0,this}getGeometryIdAt(e){return this.validateInstanceId(e),this._instanceInfo[e].geometryIndex}getGeometryRangeAt(e,t={}){this.validateGeometryId(e);let i=this._geometryInfo[e];return t.vertexStart=i.vertexStart,t.vertexCount=i.vertexCount,t.reservedVertexCount=i.reservedVertexCount,t.indexStart=i.indexStart,t.indexCount=i.indexCount,t.reservedIndexCount=i.reservedIndexCount,t.start=i.start,t.count=i.count,t}setInstanceCount(e){let t=this._availableInstanceIds,i=this._instanceInfo;for(t.sort(Kg);t[t.length-1]===i.length-1;)i.pop(),t.pop();if(e<i.length)throw new Error(`THREE.BatchedMesh: Instance ids outside the range ${e} are being used. Cannot shrink instance count.`);let r=new Int32Array(e),s=new Int32Array(e);kr(this._multiDrawCounts,r),kr(this._multiDrawStarts,s),this._multiDrawCounts=r,this._multiDrawStarts=s,this._maxInstanceCount=e;let o=this._indirectTexture,a=this._matricesTexture,c=this._colorsTexture;o.dispose(),this._initIndirectTexture(),kr(o.image.data,this._indirectTexture.image.data),a.dispose(),this._initMatricesTexture(),kr(a.image.data,this._matricesTexture.image.data),c&&(c.dispose(),this._initColorsTexture(),kr(c.image.data,this._colorsTexture.image.data))}setGeometrySize(e,t){let i=[...this._geometryInfo].filter(a=>a.active);if(Math.max(...i.map(a=>a.vertexStart+a.reservedVertexCount))>e)throw new Error(`THREE.BatchedMesh: Geometry vertex values are being used outside the range ${t}. Cannot shrink further.`);if(this.geometry.index&&Math.max(...i.map(c=>c.indexStart+c.reservedIndexCount))>t)throw new Error(`THREE.BatchedMesh: Geometry index values are being used outside the range ${t}. Cannot shrink further.`);let s=this.geometry;s.dispose(),this._maxVertexCount=e,this._maxIndexCount=t,this._geometryInitialized&&(this._geometryInitialized=!1,this.geometry=new Ht,this._initializeGeometry(s));let o=this.geometry;s.index&&kr(s.index.array,o.index.array);for(let a in s.attributes)kr(s.attributes[a].array,o.attributes[a].array)}raycast(e,t){let i=this._instanceInfo,r=this._geometryInfo,s=this.matrixWorld,o=this.geometry;rn.material=this.material,rn.geometry.index=o.index,rn.geometry.attributes=o.attributes,rn.geometry.boundingBox===null&&(rn.geometry.boundingBox=new wn),rn.geometry.boundingSphere===null&&(rn.geometry.boundingSphere=new di);for(let a=0,c=i.length;a<c;a++){if(!i[a].visible||!i[a].active)continue;let l=i[a].geometryIndex,u=r[l];rn.geometry.setDrawRange(u.start,u.count),this.getMatrixAt(a,rn.matrixWorld).premultiply(s),this.getBoundingBoxAt(l,rn.geometry.boundingBox),this.getBoundingSphereAt(l,rn.geometry.boundingSphere),rn.raycast(e,xu);for(let h=0,d=xu.length;h<d;h++){let f=xu[h];f.object=this,f.batchId=a,t.push(f)}xu.length=0}rn.material=null,rn.geometry.index=null,rn.geometry.attributes={},rn.geometry.setDrawRange(0,1/0)}copy(e){return super.copy(e),this.geometry=e.geometry.clone(),this.perObjectFrustumCulled=e.perObjectFrustumCulled,this.sortObjects=e.sortObjects,this.boundingBox=e.boundingBox!==null?e.boundingBox.clone():null,this.boundingSphere=e.boundingSphere!==null?e.boundingSphere.clone():null,this._geometryInfo=e._geometryInfo.map(t=>({...t,boundingBox:t.boundingBox!==null?t.boundingBox.clone():null,boundingSphere:t.boundingSphere!==null?t.boundingSphere.clone():null})),this._instanceInfo=e._instanceInfo.map(t=>({...t})),this._availableInstanceIds=e._availableInstanceIds.slice(),this._availableGeometryIds=e._availableGeometryIds.slice(),this._nextIndexStart=e._nextIndexStart,this._nextVertexStart=e._nextVertexStart,this._geometryCount=e._geometryCount,this._maxInstanceCount=e._maxInstanceCount,this._maxVertexCount=e._maxVertexCount,this._maxIndexCount=e._maxIndexCount,this._geometryInitialized=e._geometryInitialized,this._multiDrawCounts=e._multiDrawCounts.slice(),this._multiDrawStarts=e._multiDrawStarts.slice(),this._multiDrawBytesPerElement=e._multiDrawBytesPerElement,this._indirectTexture=e._indirectTexture.clone(),this._indirectTexture.image.data=this._indirectTexture.image.data.slice(),this._matricesTexture=e._matricesTexture.clone(),this._matricesTexture.image.data=this._matricesTexture.image.data.slice(),this._colorsTexture!==null&&(this._colorsTexture=e._colorsTexture.clone(),this._colorsTexture.image.data=this._colorsTexture.image.data.slice()),this}dispose(){super.dispose(),this.geometry.dispose(),this._matricesTexture.dispose(),this._matricesTexture=null,this._indirectTexture.dispose(),this._indirectTexture=null,this._colorsTexture!==null&&(this._colorsTexture.dispose(),this._colorsTexture=null)}onBeforeRender(e,t,i,r,s){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;let o=r.getIndex(),a=o===null?1:o.array.BYTES_PER_ELEMENT,c=1;s.wireframe&&(c=2,a=r.attributes.position.count>65535?4:2);let l=this._instanceInfo,u=this._multiDrawStarts,h=this._multiDrawCounts,d=this._geometryInfo,f=this.perObjectFrustumCulled,m=this._indirectTexture,y=m.image.data,g=i.isArrayCamera?X1:Z1;f&&(i.isArrayCamera?g.setFromArrayCamera(i):(Mn.multiplyMatrices(i.projectionMatrix,i.matrixWorldInverse).multiply(this.matrixWorld),g.setFromProjectionMatrix(Mn,i.coordinateSystem,i.reversedDepth)));let p=0;if(this.sortObjects){Mn.copy(this.matrixWorld).invert(),aa.setFromMatrixPosition(i.matrixWorld).applyMatrix4(Mn),Tb.set(0,0,-1).transformDirection(i.matrixWorld).transformDirection(Mn);for(let _=0,M=l.length;_<M;_++)if(l[_].visible&&l[_].active){let w=l[_].geometryIndex;this.getMatrixAt(_,Mn),this.getBoundingSphereAt(w,Fr).applyMatrix4(Mn);let C=!1;if(f&&(C=!g.intersectsSphere(Fr)),!C){let v=d[w],T=q1.subVectors(Fr.center,aa).dot(Tb);Qg.push(v.start,v.count,T,_)}}let S=Qg.list,E=this.customSort;E===null?S.sort(s.transparent?$1:V1):E.call(this,S,i);for(let _=0,M=S.length;_<M;_++){let w=S[_];u[p]=w.start*a*c,h[p]=w.count*c,y[p]=w.index,p++}Qg.reset()}else for(let S=0,E=l.length;S<E;S++)if(l[S].visible&&l[S].active){let _=l[S].geometryIndex,M=!1;if(f&&(this.getMatrixAt(S,Mn),this.getBoundingSphereAt(_,Fr).applyMatrix4(Mn),M=!g.intersectsSphere(Fr)),!M){let w=d[_];u[p]=w.start*a*c,h[p]=w.count*c,y[p]=S,p++}}m.needsUpdate=!0,this._multiDrawCount=p,this._multiDrawBytesPerElement=a,this._visibilityChanged=!1}onBeforeShadow(e,t,i,r,s,o){this.onBeforeRender(e,null,r,s,o)}};var Ma=class extends Tn{constructor(e=[],t=xr,i,r,s,o,a,c,l,u){super(e,t,i,r,s,o,a,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}};var lr=class extends Tn{constructor(e,t,i=Vn,r,s,o,a=Lt,c=Lt,l,u=fi,h=1){if(u!==fi&&u!==vr)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let d={width:e,height:t,depth:h};super(d,r,s,o,a,c,u,i,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new to(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}},ku=class extends lr{constructor(e,t=Vn,i=xr,r,s,o=Lt,a=Lt,c,l=fi){let u={width:e,height:e,depth:1},h=[u,u,u,u,u,u];super(e,e,t,i,r,s,o,a,c,l),this.image=h,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}},wa=class extends Tn{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}},ur=class n extends Ht{constructor(e=1,t=1,i=1,r=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:i,widthSegments:r,heightSegments:s,depthSegments:o};let a=this;r=Math.floor(r),s=Math.floor(s),o=Math.floor(o);let c=[],l=[],u=[],h=[],d=0,f=0;m("z","y","x",-1,-1,i,t,e,o,s,0),m("z","y","x",1,-1,i,t,-e,o,s,1),m("x","z","y",1,1,e,i,t,r,o,2),m("x","z","y",1,-1,e,i,-t,r,o,3),m("x","y","z",1,-1,e,t,i,r,s,4),m("x","y","z",-1,-1,e,t,-i,r,s,5),this.setIndex(c),this.setAttribute("position",new gt(l,3)),this.setAttribute("normal",new gt(u,3)),this.setAttribute("uv",new gt(h,2));function m(y,g,p,S,E,_,M,w,C,v,T){let P=_/C,L=M/v,F=_/2,V=M/2,N=w/2,B=C+1,q=v+1,Z=0,se=0,X=new I;for(let ee=0;ee<q;ee++){let re=ee*L-V;for(let De=0;De<B;De++){let Re=De*P-F;X[y]=Re*S,X[g]=re*E,X[p]=N,l.push(X.x,X.y,X.z),X[y]=0,X[g]=0,X[p]=w>0?1:-1,u.push(X.x,X.y,X.z),h.push(De/C),h.push(1-ee/v),Z+=1}}for(let ee=0;ee<v;ee++)for(let re=0;re<C;re++){let De=d+re+B*ee,Re=d+re+B*(ee+1),ht=d+(re+1)+B*(ee+1),nt=d+(re+1)+B*ee;c.push(De,Re,nt),c.push(Re,ht,nt),se+=6}a.addGroup(f,se,T),f+=se,d+=Z}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};var Ea=class n extends Ht{constructor(e=1,t=32,i=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:i,thetaLength:r},t=Math.max(3,t);let s=[],o=[],a=[],c=[],l=new I,u=new fe;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let h=0,d=3;h<=t;h++,d+=3){let f=i+h/t*r;l.x=e*Math.cos(f),l.y=e*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),u.x=(o[d]/e+1)/2,u.y=(o[d+1]/e+1)/2,c.push(u.x,u.y)}for(let h=1;h<=t;h++)s.push(h,h+1,0);this.setIndex(s),this.setAttribute("position",new gt(o,3)),this.setAttribute("normal",new gt(a,3)),this.setAttribute("uv",new gt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.segments,e.thetaStart,e.thetaLength)}},hr=class n extends Ht{constructor(e=1,t=1,i=1,r=32,s=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:e,radiusBottom:t,height:i,radialSegments:r,heightSegments:s,openEnded:o,thetaStart:a,thetaLength:c};let l=this;r=Math.floor(r),s=Math.floor(s);let u=[],h=[],d=[],f=[],m=0,y=[],g=i/2,p=0;S(),o===!1&&(e>0&&E(!0),t>0&&E(!1)),this.setIndex(u),this.setAttribute("position",new gt(h,3)),this.setAttribute("normal",new gt(d,3)),this.setAttribute("uv",new gt(f,2));function S(){let _=new I,M=new I,w=0,C=(t-e)/i;for(let v=0;v<=s;v++){let T=[],P=v/s,L=P*(t-e)+e;for(let F=0;F<=r;F++){let V=F/r,N=V*c+a,B=Math.sin(N),q=Math.cos(N);M.x=L*B,M.y=-P*i+g,M.z=L*q,h.push(M.x,M.y,M.z),_.set(B,C,q).normalize(),d.push(_.x,_.y,_.z),f.push(V,1-P),T.push(m++)}y.push(T)}for(let v=0;v<r;v++)for(let T=0;T<s;T++){let P=y[T][v],L=y[T+1][v],F=y[T+1][v+1],V=y[T][v+1];(e>0||T!==0)&&(u.push(P,L,V),w+=3),(t>0||T!==s-1)&&(u.push(L,F,V),w+=3)}l.addGroup(p,w,0),p+=w}function E(_){let M=m,w=new fe,C=new I,v=0,T=_===!0?e:t,P=_===!0?1:-1;for(let F=1;F<=r;F++)h.push(0,g*P,0),d.push(0,P,0),f.push(.5,.5),m++;let L=m;for(let F=0;F<=r;F++){let N=F/r*c+a,B=Math.cos(N),q=Math.sin(N);C.x=T*q,C.y=g*P,C.z=T*B,h.push(C.x,C.y,C.z),d.push(0,P,0),w.x=B*.5+.5,w.y=q*.5*P+.5,f.push(w.x,w.y),m++}for(let F=0;F<r;F++){let V=M+F,N=L+F;_===!0?u.push(N,N+1,V):u.push(N+1,N,V),v+=3}l.addGroup(p,v,_===!0?1:2),p+=v}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radiusTop,e.radiusBottom,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Ta=class n extends hr{constructor(e=1,t=1,i=32,r=1,s=!1,o=0,a=Math.PI*2){super(0,e,t,i,r,s,o,a),this.type="ConeGeometry",this.parameters={radius:e,height:t,radialSegments:i,heightSegments:r,openEnded:s,thetaStart:o,thetaLength:a}}static fromJSON(e){return new n(e.radius,e.height,e.radialSegments,e.heightSegments,e.openEnded,e.thetaStart,e.thetaLength)}},Aa=class n extends Ht{constructor(e=[],t=[],i=1,r=0){super(),this.type="PolyhedronGeometry",this.parameters={vertices:e,indices:t,radius:i,detail:r};let s=[],o=[];a(r),l(i),u(),this.setAttribute("position",new gt(s,3)),this.setAttribute("normal",new gt(s.slice(),3)),this.setAttribute("uv",new gt(o,2)),r===0?this.computeVertexNormals():this.normalizeNormals();function a(S){let E=new I,_=new I,M=new I;for(let w=0;w<t.length;w+=3)f(t[w+0],E),f(t[w+1],_),f(t[w+2],M),c(E,_,M,S)}function c(S,E,_,M){let w=M+1,C=[];for(let v=0;v<=w;v++){C[v]=[];let T=S.clone().lerp(_,v/w),P=E.clone().lerp(_,v/w),L=w-v;for(let F=0;F<=L;F++)F===0&&v===w?C[v][F]=T:C[v][F]=T.clone().lerp(P,F/L)}for(let v=0;v<w;v++)for(let T=0;T<2*(w-v)-1;T++){let P=Math.floor(T/2);T%2===0?(d(C[v][P+1]),d(C[v+1][P]),d(C[v][P])):(d(C[v][P+1]),d(C[v+1][P+1]),d(C[v+1][P]))}}function l(S){let E=new I;for(let _=0;_<s.length;_+=3)E.x=s[_+0],E.y=s[_+1],E.z=s[_+2],E.normalize().multiplyScalar(S),s[_+0]=E.x,s[_+1]=E.y,s[_+2]=E.z}function u(){let S=new I;for(let E=0;E<s.length;E+=3){S.x=s[E+0],S.y=s[E+1],S.z=s[E+2];let _=g(S)/2/Math.PI+.5,M=p(S)/Math.PI+.5;o.push(_,1-M)}m(),h()}function h(){for(let S=0;S<o.length;S+=6){let E=o[S+0],_=o[S+2],M=o[S+4],w=Math.max(E,_,M),C=Math.min(E,_,M);w>.9&&C<.1&&(E<.2&&(o[S+0]+=1),_<.2&&(o[S+2]+=1),M<.2&&(o[S+4]+=1))}}function d(S){s.push(S.x,S.y,S.z)}function f(S,E){let _=S*3;E.x=e[_+0],E.y=e[_+1],E.z=e[_+2]}function m(){let S=new I,E=new I,_=new I,M=new I,w=new fe,C=new fe,v=new fe;for(let T=0,P=0;T<s.length;T+=9,P+=6){S.set(s[T+0],s[T+1],s[T+2]),E.set(s[T+3],s[T+4],s[T+5]),_.set(s[T+6],s[T+7],s[T+8]),w.set(o[P+0],o[P+1]),C.set(o[P+2],o[P+3]),v.set(o[P+4],o[P+5]),M.copy(S).add(E).add(_).divideScalar(3);let L=g(M);y(w,P+0,S,L),y(C,P+2,E,L),y(v,P+4,_,L)}}function y(S,E,_,M){M<0&&S.x===1&&(o[E]=S.x-1),_.x===0&&_.z===0&&(o[E]=M/2/Math.PI+.5)}function g(S){return Math.atan2(S.z,-S.x)}function p(S){return Math.atan2(-S.y,Math.sqrt(S.x*S.x+S.z*S.z))}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.vertices,e.indices,e.radius,e.detail)}};var Ln=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){Xe("Curve: .getPoint() not implemented.")}getPointAt(e,t){let i=this.getUtoTmapping(e);return this.getPoint(i,t)}getPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return t}getSpacedPoints(e=5){let t=[];for(let i=0;i<=e;i++)t.push(this.getPointAt(i/e));return t}getLength(){let e=this.getLengths();return e[e.length-1]}getLengths(e=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===e+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let t=[],i,r=this.getPoint(0),s=0;t.push(0);for(let o=1;o<=e;o++)i=this.getPoint(o/e),s+=i.distanceTo(r),t.push(s),r=i;return this.cacheArcLengths=t,t}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(e,t=null){let i=this.getLengths(),r=0,s=i.length,o;t?o=t:o=e*i[s-1];let a=0,c=s-1,l;for(;a<=c;)if(r=Math.floor(a+(c-a)/2),l=i[r]-o,l<0)a=r+1;else if(l>0)c=r-1;else{c=r;break}if(r=c,i[r]===o)return r/(s-1);let u=i[r],d=i[r+1]-u,f=(o-u)/d;return(r+f)/(s-1)}getTangent(e,t){let r=e-1e-4,s=e+1e-4;r<0&&(r=0),s>1&&(s=1);let o=this.getPoint(r),a=this.getPoint(s),c=t||(o.isVector2?new fe:new I);return c.copy(a).sub(o).normalize(),c}getTangentAt(e,t){let i=this.getUtoTmapping(e);return this.getTangent(i,t)}computeFrenetFrames(e,t=!1){let i=new I,r=[],s=[],o=[],a=new I,c=new mt;for(let f=0;f<=e;f++){let m=f/e;r[f]=this.getTangentAt(m,new I)}s[0]=new I,o[0]=new I;let l=Number.MAX_VALUE,u=Math.abs(r[0].x),h=Math.abs(r[0].y),d=Math.abs(r[0].z);u<=l&&(l=u,i.set(1,0,0)),h<=l&&(l=h,i.set(0,1,0)),d<=l&&i.set(0,0,1),a.crossVectors(r[0],i).normalize(),s[0].crossVectors(r[0],a),o[0].crossVectors(r[0],s[0]);for(let f=1;f<=e;f++){if(s[f]=s[f-1].clone(),o[f]=o[f-1].clone(),a.crossVectors(r[f-1],r[f]),a.length()>Number.EPSILON){a.normalize();let m=Math.acos(at(r[f-1].dot(r[f]),-1,1));s[f].applyMatrix4(c.makeRotationAxis(a,m))}o[f].crossVectors(r[f],s[f])}if(t===!0){let f=Math.acos(at(s[0].dot(s[e]),-1,1));f/=e,r[0].dot(a.crossVectors(s[0],s[e]))>0&&(f=-f);for(let m=1;m<=e;m++)s[m].applyMatrix4(c.makeRotationAxis(r[m],f*m)),o[m].crossVectors(r[m],s[m])}return{tangents:r,normals:s,binormals:o}}clone(){return new this.constructor().copy(this)}copy(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}toJSON(){let e={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return e.arcLengthDivisions=this.arcLengthDivisions,e.type=this.type,e}fromJSON(e){return this.arcLengthDivisions=e.arcLengthDivisions,this}},io=class extends Ln{constructor(e=0,t=0,i=1,r=1,s=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=e,this.aY=t,this.xRadius=i,this.yRadius=r,this.aStartAngle=s,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(e,t=new fe){let i=t,r=Math.PI*2,s=this.aEndAngle-this.aStartAngle,o=Math.abs(s)<Number.EPSILON;for(;s<0;)s+=r;for(;s>r;)s-=r;s<Number.EPSILON&&(o?s=0:s=r),this.aClockwise===!0&&!o&&(s===r?s=-r:s=s-r);let a=this.aStartAngle+e*s,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let u=Math.cos(this.aRotation),h=Math.sin(this.aRotation),d=c-this.aX,f=l-this.aY;c=d*u-f*h+this.aX,l=d*h+f*u+this.aY}return i.set(c,l)}copy(e){return super.copy(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}toJSON(){let e=super.toJSON();return e.aX=this.aX,e.aY=this.aY,e.xRadius=this.xRadius,e.yRadius=this.yRadius,e.aStartAngle=this.aStartAngle,e.aEndAngle=this.aEndAngle,e.aClockwise=this.aClockwise,e.aRotation=this.aRotation,e}fromJSON(e){return super.fromJSON(e),this.aX=e.aX,this.aY=e.aY,this.xRadius=e.xRadius,this.yRadius=e.yRadius,this.aStartAngle=e.aStartAngle,this.aEndAngle=e.aEndAngle,this.aClockwise=e.aClockwise,this.aRotation=e.aRotation,this}},Bu=class extends io{constructor(e,t,i,r,s,o){super(e,t,i,i,r,s,o),this.isArcCurve=!0,this.type="ArcCurve"}};function Hx(){let n=0,e=0,t=0,i=0;function r(s,o,a,c){n=s,e=a,t=-3*s+3*o-2*a-c,i=2*s-2*o+a+c}return{initCatmullRom:function(s,o,a,c,l){r(o,a,l*(a-s),l*(c-o))},initNonuniformCatmullRom:function(s,o,a,c,l,u,h){let d=(o-s)/l-(a-s)/(l+u)+(a-o)/u,f=(a-o)/u-(c-o)/(u+h)+(c-a)/h;d*=u,f*=u,r(o,a,d,f)},calc:function(s){let o=s*s,a=o*s;return n+e*s+t*o+i*a}}}var Ab=new I,Rb=new I,ex=new Hx,tx=new Hx,nx=new Hx,Hu=class extends Ln{constructor(e=[],t=!1,i="centripetal",r=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=e,this.closed=t,this.curveType=i,this.tension=r}getPoint(e,t=new I){let i=t,r=this.points,s=r.length,o=(s-(this.closed?0:1))*e,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/s)+1)*s:c===0&&a===s-1&&(a=s-2,c=1);let l,u;this.closed||a>0?l=r[(a-1)%s]:(Rb.subVectors(r[0],r[1]).add(r[0]),l=Rb);let h=r[a%s],d=r[(a+1)%s];if(this.closed||a+2<s?u=r[(a+2)%s]:(Ab.subVectors(r[s-1],r[s-2]).add(r[s-1]),u=Ab),this.curveType==="centripetal"||this.curveType==="chordal"){let f=this.curveType==="chordal"?.5:.25,m=Math.pow(l.distanceToSquared(h),f),y=Math.pow(h.distanceToSquared(d),f),g=Math.pow(d.distanceToSquared(u),f);y<1e-4&&(y=1),m<1e-4&&(m=y),g<1e-4&&(g=y),ex.initNonuniformCatmullRom(l.x,h.x,d.x,u.x,m,y,g),tx.initNonuniformCatmullRom(l.y,h.y,d.y,u.y,m,y,g),nx.initNonuniformCatmullRom(l.z,h.z,d.z,u.z,m,y,g)}else this.curveType==="catmullrom"&&(ex.initCatmullRom(l.x,h.x,d.x,u.x,this.tension),tx.initCatmullRom(l.y,h.y,d.y,u.y,this.tension),nx.initCatmullRom(l.z,h.z,d.z,u.z,this.tension));return i.set(ex.calc(c),tx.calc(c),nx.calc(c)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e.closed=this.closed,e.curveType=this.curveType,e.tension=this.tension,e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new I().fromArray(r))}return this.closed=e.closed,this.curveType=e.curveType,this.tension=e.tension,this}};function Cb(n,e,t,i,r){let s=(i-e)*.5,o=(r-t)*.5,a=n*n,c=n*a;return(2*t-2*i+s+o)*c+(-3*t+3*i-2*s-o)*a+s*n+t}function J1(n,e){let t=1-n;return t*t*e}function j1(n,e){return 2*(1-n)*n*e}function K1(n,e){return n*n*e}function ha(n,e,t,i){return J1(n,e)+j1(n,t)+K1(n,i)}function Q1(n,e){let t=1-n;return t*t*t*e}function eT(n,e){let t=1-n;return 3*t*t*n*e}function tT(n,e){return 3*(1-n)*n*n*e}function nT(n,e){return n*n*n*e}function da(n,e,t,i,r){return Q1(n,e)+eT(n,t)+tT(n,i)+nT(n,r)}var Ra=class extends Ln{constructor(e=new fe,t=new fe,i=new fe,r=new fe){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new fe){let i=t,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(da(e,r.x,s.x,o.x,a.x),da(e,r.y,s.y,o.y,a.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Gu=class extends Ln{constructor(e=new I,t=new I,i=new I,r=new I){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=e,this.v1=t,this.v2=i,this.v3=r}getPoint(e,t=new I){let i=t,r=this.v0,s=this.v1,o=this.v2,a=this.v3;return i.set(da(e,r.x,s.x,o.x,a.x),da(e,r.y,s.y,o.y,a.y),da(e,r.z,s.z,o.z,a.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this.v3.copy(e.v3),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e.v3=this.v3.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this.v3.fromArray(e.v3),this}},Ca=class extends Ln{constructor(e=new fe,t=new fe){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=e,this.v2=t}getPoint(e,t=new fe){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new fe){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Vu=class extends Ln{constructor(e=new I,t=new I){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=e,this.v2=t}getPoint(e,t=new I){let i=t;return e===1?i.copy(this.v2):(i.copy(this.v2).sub(this.v1),i.multiplyScalar(e).add(this.v1)),i}getPointAt(e,t){return this.getPoint(e,t)}getTangent(e,t=new I){return t.subVectors(this.v2,this.v1).normalize()}getTangentAt(e,t){return this.getTangent(e,t)}copy(e){return super.copy(e),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Pa=class extends Ln{constructor(e=new fe,t=new fe,i=new fe){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new fe){let i=t,r=this.v0,s=this.v1,o=this.v2;return i.set(ha(e,r.x,s.x,o.x),ha(e,r.y,s.y,o.y)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},$u=class extends Ln{constructor(e=new I,t=new I,i=new I){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=e,this.v1=t,this.v2=i}getPoint(e,t=new I){let i=t,r=this.v0,s=this.v1,o=this.v2;return i.set(ha(e,r.x,s.x,o.x),ha(e,r.y,s.y,o.y),ha(e,r.z,s.z,o.z)),i}copy(e){return super.copy(e),this.v0.copy(e.v0),this.v1.copy(e.v1),this.v2.copy(e.v2),this}toJSON(){let e=super.toJSON();return e.v0=this.v0.toArray(),e.v1=this.v1.toArray(),e.v2=this.v2.toArray(),e}fromJSON(e){return super.fromJSON(e),this.v0.fromArray(e.v0),this.v1.fromArray(e.v1),this.v2.fromArray(e.v2),this}},Ia=class extends Ln{constructor(e=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=e}getPoint(e,t=new fe){let i=t,r=this.points,s=(r.length-1)*e,o=Math.floor(s),a=s-o,c=r[o===0?o:o-1],l=r[o],u=r[o>r.length-2?r.length-1:o+1],h=r[o>r.length-3?r.length-1:o+2];return i.set(Cb(a,c.x,l.x,u.x,h.x),Cb(a,c.y,l.y,u.y,h.y)),i}copy(e){super.copy(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.points=[];for(let t=0,i=this.points.length;t<i;t++){let r=this.points[t];e.points.push(r.toArray())}return e}fromJSON(e){super.fromJSON(e),this.points=[];for(let t=0,i=e.points.length;t<i;t++){let r=e.points[t];this.points.push(new fe().fromArray(r))}return this}},ux=Object.freeze({__proto__:null,ArcCurve:Bu,CatmullRomCurve3:Hu,CubicBezierCurve:Ra,CubicBezierCurve3:Gu,EllipseCurve:io,LineCurve:Ca,LineCurve3:Vu,QuadraticBezierCurve:Pa,QuadraticBezierCurve3:$u,SplineCurve:Ia}),Wu=class extends Ln{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(e){this.curves.push(e)}closePath(){let e=this.curves[0].getPoint(0),t=this.curves[this.curves.length-1].getPoint(1);if(!e.equals(t)){let i=e.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new ux[i](t,e))}return this}getPoint(e,t){let i=e*this.getLength(),r=this.getCurveLengths(),s=0;for(;s<r.length;){if(r[s]>=i){let o=r[s]-i,a=this.curves[s],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,t)}s++}return null}getLength(){let e=this.getCurveLengths();return e[e.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let e=[],t=0;for(let i=0,r=this.curves.length;i<r;i++)t+=this.curves[i].getLength(),e.push(t);return this.cacheLengths=e,e}getSpacedPoints(e=40){let t=[];for(let i=0;i<=e;i++)t.push(this.getPoint(i/e));return this.autoClose&&t.push(t[0]),t}getPoints(e=12){let t=[],i;for(let r=0,s=this.curves;r<s.length;r++){let o=s[r],a=o.isEllipseCurve?e*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?e*o.points.length:e,c=o.getPoints(a);for(let l=0;l<c.length;l++){let u=c[l];i&&i.equals(u)||(t.push(u),i=u)}}return this.autoClose&&t.length>1&&!t[t.length-1].equals(t[0])&&t.push(t[0]),t}copy(e){super.copy(e),this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(r.clone())}return this.autoClose=e.autoClose,this}toJSON(){let e=super.toJSON();e.autoClose=this.autoClose,e.curves=[];for(let t=0,i=this.curves.length;t<i;t++){let r=this.curves[t];e.curves.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.autoClose=e.autoClose,this.curves=[];for(let t=0,i=e.curves.length;t<i;t++){let r=e.curves[t];this.curves.push(new ux[r.type]().fromJSON(r))}return this}},Da=class extends Wu{constructor(e){super(),this.type="Path",this.currentPoint=new fe,e&&this.setFromPoints(e)}setFromPoints(e){this.moveTo(e[0].x,e[0].y);for(let t=1,i=e.length;t<i;t++)this.lineTo(e[t].x,e[t].y);return this}moveTo(e,t){return this.currentPoint.set(e,t),this}lineTo(e,t){let i=new Ca(this.currentPoint.clone(),new fe(e,t));return this.curves.push(i),this.currentPoint.set(e,t),this}quadraticCurveTo(e,t,i,r){let s=new Pa(this.currentPoint.clone(),new fe(e,t),new fe(i,r));return this.curves.push(s),this.currentPoint.set(i,r),this}bezierCurveTo(e,t,i,r,s,o){let a=new Ra(this.currentPoint.clone(),new fe(e,t),new fe(i,r),new fe(s,o));return this.curves.push(a),this.currentPoint.set(s,o),this}splineThru(e){let t=[this.currentPoint.clone()].concat(e),i=new Ia(t);return this.curves.push(i),this.currentPoint.copy(e[e.length-1]),this}arc(e,t,i,r,s,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(e+a,t+c,i,r,s,o),this}absarc(e,t,i,r,s,o){return this.absellipse(e,t,i,i,r,s,o),this}ellipse(e,t,i,r,s,o,a,c){let l=this.currentPoint.x,u=this.currentPoint.y;return this.absellipse(e+l,t+u,i,r,s,o,a,c),this}absellipse(e,t,i,r,s,o,a,c){let l=new io(e,t,i,r,s,o,a,c);if(this.curves.length>0){let h=l.getPoint(0);h.equals(this.currentPoint)||this.lineTo(h.x,h.y)}this.curves.push(l);let u=l.getPoint(1);return this.currentPoint.copy(u),this}copy(e){return super.copy(e),this.currentPoint.copy(e.currentPoint),this}toJSON(){let e=super.toJSON();return e.currentPoint=this.currentPoint.toArray(),e}fromJSON(e){return super.fromJSON(e),this.currentPoint.fromArray(e.currentPoint),this}},ro=class extends Da{constructor(e){super(e),this.uuid=jr(),this.type="Shape",this.holes=[]}getPointsHoles(e){let t=[];for(let i=0,r=this.holes.length;i<r;i++)t[i]=this.holes[i].getPoints(e);return t}extractPoints(e){return{shape:this.getPoints(e),holes:this.getPointsHoles(e)}}copy(e){super.copy(e),this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(r.clone())}return this}toJSON(){let e=super.toJSON();e.uuid=this.uuid,e.holes=[];for(let t=0,i=this.holes.length;t<i;t++){let r=this.holes[t];e.holes.push(r.toJSON())}return e}fromJSON(e){super.fromJSON(e),this.uuid=e.uuid,this.holes=[];for(let t=0,i=e.holes.length;t<i;t++){let r=e.holes[t];this.holes.push(new Da().fromJSON(r))}return this}};function iT(n,e,t=2){let i=e&&e.length,r=i?e[0]*t:n.length,s=wS(n,0,r,t,!0),o=[];if(!s||s.next===s.prev)return o;let a,c,l;if(i&&(s=cT(n,e,s,t)),n.length>80*t){a=n[0],c=n[1];let u=a,h=c;for(let d=t;d<r;d+=t){let f=n[d],m=n[d+1];f<a&&(a=f),m<c&&(c=m),f>u&&(u=f),m>h&&(h=m)}l=Math.max(u-a,h-c),l=l!==0?32767/l:0}return Na(s,o,t,a,c,l,0),o}function wS(n,e,t,i,r){let s;if(r===vT(n,e,t,i)>0)for(let o=e;o<t;o+=i)s=Pb(o/i|0,n[o],n[o+1],s);else for(let o=t-i;o>=e;o-=i)s=Pb(o/i|0,n[o],n[o+1],s);return s&&so(s,s.next)&&(za(s),s=s.next),s}function Vr(n,e){if(!n)return n;e||(e=n);let t=n,i;do if(i=!1,!t.steiner&&(so(t,t.next)||Ot(t.prev,t,t.next)===0)){if(za(t),t=e=t.prev,t===t.next)break;i=!0}else t=t.next;while(i||t!==e);return e}function Na(n,e,t,i,r,s,o){if(!n)return;!o&&s&&fT(n,i,r,s);let a=n;for(;n.prev!==n.next;){let c=n.prev,l=n.next;if(s?sT(n,i,r,s):rT(n)){e.push(c.i,n.i,l.i),za(n),n=l.next,a=l.next;continue}if(n=l,n===a){o?o===1?(n=oT(Vr(n),e),Na(n,e,t,i,r,s,2)):o===2&&aT(n,e,t,i,r,s):Na(Vr(n),e,t,i,r,s,1);break}}}function rT(n){let e=n.prev,t=n,i=n.next;if(Ot(e,t,i)>=0)return!1;let r=e.x,s=t.x,o=i.x,a=e.y,c=t.y,l=i.y,u=Math.min(r,s,o),h=Math.min(a,c,l),d=Math.max(r,s,o),f=Math.max(a,c,l),m=i.next;for(;m!==e;){if(m.x>=u&&m.x<=d&&m.y>=h&&m.y<=f&&ca(r,a,s,c,o,l,m.x,m.y)&&Ot(m.prev,m,m.next)>=0)return!1;m=m.next}return!0}function sT(n,e,t,i){let r=n.prev,s=n,o=n.next;if(Ot(r,s,o)>=0)return!1;let a=r.x,c=s.x,l=o.x,u=r.y,h=s.y,d=o.y,f=Math.min(a,c,l),m=Math.min(u,h,d),y=Math.max(a,c,l),g=Math.max(u,h,d),p=hx(f,m,e,t,i),S=hx(y,g,e,t,i),E=n.prevZ,_=n.nextZ;for(;E&&E.z>=p&&_&&_.z<=S;){if(E.x>=f&&E.x<=y&&E.y>=m&&E.y<=g&&E!==r&&E!==o&&ca(a,u,c,h,l,d,E.x,E.y)&&Ot(E.prev,E,E.next)>=0||(E=E.prevZ,_.x>=f&&_.x<=y&&_.y>=m&&_.y<=g&&_!==r&&_!==o&&ca(a,u,c,h,l,d,_.x,_.y)&&Ot(_.prev,_,_.next)>=0))return!1;_=_.nextZ}for(;E&&E.z>=p;){if(E.x>=f&&E.x<=y&&E.y>=m&&E.y<=g&&E!==r&&E!==o&&ca(a,u,c,h,l,d,E.x,E.y)&&Ot(E.prev,E,E.next)>=0)return!1;E=E.prevZ}for(;_&&_.z<=S;){if(_.x>=f&&_.x<=y&&_.y>=m&&_.y<=g&&_!==r&&_!==o&&ca(a,u,c,h,l,d,_.x,_.y)&&Ot(_.prev,_,_.next)>=0)return!1;_=_.nextZ}return!0}function oT(n,e){let t=n;do{let i=t.prev,r=t.next.next;!so(i,r)&&TS(i,t,t.next,r)&&La(i,r)&&La(r,i)&&(e.push(i.i,t.i,r.i),za(t),za(t.next),t=n=r),t=t.next}while(t!==n);return Vr(t)}function aT(n,e,t,i,r,s){let o=n;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&gT(o,a)){let c=AS(o,a);o=Vr(o,o.next),c=Vr(c,c.next),Na(o,e,t,i,r,s,0),Na(c,e,t,i,r,s,0);return}a=a.next}o=o.next}while(o!==n)}function cT(n,e,t,i){let r=[];for(let s=0,o=e.length;s<o;s++){let a=e[s]*i,c=s<o-1?e[s+1]*i:n.length,l=wS(n,a,c,i,!1);l===l.next&&(l.steiner=!0),r.push(mT(l))}r.sort(lT);for(let s=0;s<r.length;s++)t=uT(r[s],t);return t}function lT(n,e){let t=n.x-e.x;if(t===0&&(t=n.y-e.y,t===0)){let i=(n.next.y-n.y)/(n.next.x-n.x),r=(e.next.y-e.y)/(e.next.x-e.x);t=i-r}return t}function uT(n,e){let t=hT(n,e);if(!t)return e;let i=AS(t,n);return Vr(i,i.next),Vr(t,t.next)}function hT(n,e){let t=e,i=n.x,r=n.y,s=-1/0,o;if(so(n,t))return t;do{if(so(n,t.next))return t.next;if(r<=t.y&&r>=t.next.y&&t.next.y!==t.y){let h=t.x+(r-t.y)*(t.next.x-t.x)/(t.next.y-t.y);if(h<=i&&h>s&&(s=h,o=t.x<t.next.x?t:t.next,h===i))return o}t=t.next}while(t!==e);if(!o)return null;let a=o,c=o.x,l=o.y,u=1/0;t=o;do{if(i>=t.x&&t.x>=c&&i!==t.x&&ES(r<l?i:s,r,c,l,r<l?s:i,r,t.x,t.y)){let h=Math.abs(r-t.y)/(i-t.x);La(t,n)&&(h<u||h===u&&(t.x>o.x||t.x===o.x&&dT(o,t)))&&(o=t,u=h)}t=t.next}while(t!==a);return o}function dT(n,e){return Ot(n.prev,n,e.prev)<0&&Ot(e.next,n,n.next)<0}function fT(n,e,t,i){let r=n;do r.z===0&&(r.z=hx(r.x,r.y,e,t,i)),r.prevZ=r.prev,r.nextZ=r.next,r=r.next;while(r!==n);r.prevZ.nextZ=null,r.prevZ=null,pT(r)}function pT(n){let e,t=1;do{let i=n,r;n=null;let s=null;for(e=0;i;){e++;let o=i,a=0;for(let l=0;l<t&&(a++,o=o.nextZ,!!o);l++);let c=t;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||i.z<=o.z)?(r=i,i=i.nextZ,a--):(r=o,o=o.nextZ,c--),s?s.nextZ=r:n=r,r.prevZ=s,s=r;i=o}s.nextZ=null,t*=2}while(e>1);return n}function hx(n,e,t,i,r){return n=(n-t)*r|0,e=(e-i)*r|0,n=(n|n<<8)&16711935,n=(n|n<<4)&252645135,n=(n|n<<2)&858993459,n=(n|n<<1)&1431655765,e=(e|e<<8)&16711935,e=(e|e<<4)&252645135,e=(e|e<<2)&858993459,e=(e|e<<1)&1431655765,n|e<<1}function mT(n){let e=n,t=n;do(e.x<t.x||e.x===t.x&&e.y<t.y)&&(t=e),e=e.next;while(e!==n);return t}function ES(n,e,t,i,r,s,o,a){return(r-o)*(e-a)>=(n-o)*(s-a)&&(n-o)*(i-a)>=(t-o)*(e-a)&&(t-o)*(s-a)>=(r-o)*(i-a)}function ca(n,e,t,i,r,s,o,a){return!(n===o&&e===a)&&ES(n,e,t,i,r,s,o,a)}function gT(n,e){return n.next.i!==e.i&&n.prev.i!==e.i&&!xT(n,e)&&(La(n,e)&&La(e,n)&&_T(n,e)&&(Ot(n.prev,n,e.prev)||Ot(n,e.prev,e))||so(n,e)&&Ot(n.prev,n,n.next)>0&&Ot(e.prev,e,e.next)>0)}function Ot(n,e,t){return(e.y-n.y)*(t.x-e.x)-(e.x-n.x)*(t.y-e.y)}function so(n,e){return n.x===e.x&&n.y===e.y}function TS(n,e,t,i){let r=vu(Ot(n,e,t)),s=vu(Ot(n,e,i)),o=vu(Ot(t,i,n)),a=vu(Ot(t,i,e));return!!(r!==s&&o!==a||r===0&&_u(n,t,e)||s===0&&_u(n,i,e)||o===0&&_u(t,n,i)||a===0&&_u(t,e,i))}function _u(n,e,t){return e.x<=Math.max(n.x,t.x)&&e.x>=Math.min(n.x,t.x)&&e.y<=Math.max(n.y,t.y)&&e.y>=Math.min(n.y,t.y)}function vu(n){return n>0?1:n<0?-1:0}function xT(n,e){let t=n;do{if(t.i!==n.i&&t.next.i!==n.i&&t.i!==e.i&&t.next.i!==e.i&&TS(t,t.next,n,e))return!0;t=t.next}while(t!==n);return!1}function La(n,e){return Ot(n.prev,n,n.next)<0?Ot(n,e,n.next)>=0&&Ot(n,n.prev,e)>=0:Ot(n,e,n.prev)<0||Ot(n,n.next,e)<0}function _T(n,e){let t=n,i=!1,r=(n.x+e.x)/2,s=(n.y+e.y)/2;do t.y>s!=t.next.y>s&&t.next.y!==t.y&&r<(t.next.x-t.x)*(s-t.y)/(t.next.y-t.y)+t.x&&(i=!i),t=t.next;while(t!==n);return i}function AS(n,e){let t=dx(n.i,n.x,n.y),i=dx(e.i,e.x,e.y),r=n.next,s=e.prev;return n.next=e,e.prev=n,t.next=r,r.prev=t,i.next=t,t.prev=i,s.next=i,i.prev=s,i}function Pb(n,e,t,i){let r=dx(n,e,t);return i?(r.next=i.next,r.prev=i,i.next.prev=r,i.next=r):(r.prev=r,r.next=r),r}function za(n){n.next.prev=n.prev,n.prev.next=n.next,n.prevZ&&(n.prevZ.nextZ=n.nextZ),n.nextZ&&(n.nextZ.prevZ=n.prevZ)}function dx(n,e,t){return{i:n,x:e,y:t,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function vT(n,e,t,i){let r=0;for(let s=e,o=t-i;s<t;s+=i)r+=(n[o]-n[s])*(n[s+1]+n[o+1]),o=s;return r}var fx=class{static triangulate(e,t,i=2){return iT(e,t,i)}},Br=class n{static area(e){let t=e.length,i=0;for(let r=t-1,s=0;s<t;r=s++)i+=e[r].x*e[s].y-e[s].x*e[r].y;return i*.5}static isClockWise(e){return n.area(e)<0}static triangulateShape(e,t){let i=[],r=[],s=[];Ib(e),Db(i,e);let o=e.length;t.forEach(Ib);for(let c=0;c<t.length;c++)r.push(o),o+=t[c].length,Db(i,t[c]);let a=fx.triangulate(i,r);for(let c=0;c<a.length;c+=3)s.push(a.slice(c,c+3));return s}};function Ib(n){let e=n.length;e>2&&n[e-1].equals(n[0])&&n.pop()}function Db(n,e){for(let t=0;t<e.length;t++)n.push(e[t].x),n.push(e[t].y)}var Ua=class n extends Ht{constructor(e=new ro([new fe(.5,.5),new fe(-.5,.5),new fe(-.5,-.5),new fe(.5,-.5)]),t={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:e,options:t},e=Array.isArray(e)?e:[e];let i=this,r=[],s=[];for(let a=0,c=e.length;a<c;a++){let l=e[a];o(l)}this.setAttribute("position",new gt(r,3)),this.setAttribute("uv",new gt(s,2)),this.computeVertexNormals();function o(a){let c=[],l=t.curveSegments!==void 0?t.curveSegments:12,u=t.steps!==void 0?t.steps:1,h=t.depth!==void 0?t.depth:1,d=t.bevelEnabled!==void 0?t.bevelEnabled:!0,f=t.bevelThickness!==void 0?t.bevelThickness:.2,m=t.bevelSize!==void 0?t.bevelSize:f-.1,y=t.bevelOffset!==void 0?t.bevelOffset:0,g=t.bevelSegments!==void 0?t.bevelSegments:3,p=t.extrudePath,S=t.UVGenerator!==void 0?t.UVGenerator:yT,E,_=!1,M,w,C,v;if(p){E=p.getSpacedPoints(u),_=!0,d=!1;let ne=p.isCatmullRomCurve3?p.closed:!1;M=p.computeFrenetFrames(u,ne),w=new I,C=new I,v=new I}d||(g=0,f=0,m=0,y=0);let T=a.extractPoints(l),P=T.shape,L=T.holes;if(!Br.isClockWise(P)){P=P.reverse();for(let ne=0,le=L.length;ne<le;ne++){let he=L[ne];Br.isClockWise(he)&&(L[ne]=he.reverse())}}function V(ne){let he=10000000000000001e-36,J=ne[0];for(let ae=1;ae<=ne.length;ae++){let Ge=ae%ne.length,Fe=ne[Ge],We=Fe.x-J.x,je=Fe.y-J.y,D=We*We+je*je,ct=Math.max(Math.abs(Fe.x),Math.abs(Fe.y),Math.abs(J.x),Math.abs(J.y)),it=he*ct*ct;if(D<=it){ne.splice(Ge,1),ae--;continue}J=Fe}}V(P),L.forEach(V);let N=L.length,B=P;for(let ne=0;ne<N;ne++){let le=L[ne];P=P.concat(le)}function q(ne,le,he){return le||Je("ExtrudeGeometry: vec does not exist"),ne.clone().addScaledVector(le,he)}let Z=P.length;function se(ne,le,he){let J,ae,Ge,Fe=ne.x-le.x,We=ne.y-le.y,je=he.x-ne.x,D=he.y-ne.y,ct=Fe*Fe+We*We,it=Fe*D-We*je;if(Math.abs(it)>Number.EPSILON){let A=Math.sqrt(ct),x=Math.sqrt(je*je+D*D),k=le.x-We/A,$=le.y+Fe/A,j=he.x-D/x,pe=he.y+je/x,me=((j-k)*D-(pe-$)*je)/(Fe*D-We*je);J=k+Fe*me-ne.x,ae=$+We*me-ne.y;let K=J*J+ae*ae;if(K<=2)return new fe(J,ae);Ge=Math.sqrt(K/2)}else{let A=!1;Fe>Number.EPSILON?je>Number.EPSILON&&(A=!0):Fe<-Number.EPSILON?je<-Number.EPSILON&&(A=!0):Math.sign(We)===Math.sign(D)&&(A=!0),A?(J=-We,ae=Fe,Ge=Math.sqrt(ct)):(J=Fe,ae=We,Ge=Math.sqrt(ct/2))}return new fe(J/Ge,ae/Ge)}let X=[];for(let ne=0,le=B.length,he=le-1,J=ne+1;ne<le;ne++,he++,J++)he===le&&(he=0),J===le&&(J=0),X[ne]=se(B[ne],B[he],B[J]);let ee=[],re,De=X.concat();for(let ne=0,le=N;ne<le;ne++){let he=L[ne];re=[];for(let J=0,ae=he.length,Ge=ae-1,Fe=J+1;J<ae;J++,Ge++,Fe++)Ge===ae&&(Ge=0),Fe===ae&&(Fe=0),re[J]=se(he[J],he[Ge],he[Fe]);ee.push(re),De=De.concat(re)}let Re;if(g===0)Re=Br.triangulateShape(B,L);else{let ne=[],le=[];for(let he=0;he<g;he++){let J=he/g,ae=f*Math.cos(J*Math.PI/2),Ge=m*Math.sin(J*Math.PI/2)+y;for(let Fe=0,We=B.length;Fe<We;Fe++){let je=q(B[Fe],X[Fe],Ge);ye(je.x,je.y,-ae),J===0&&ne.push(je)}for(let Fe=0,We=N;Fe<We;Fe++){let je=L[Fe];re=ee[Fe];let D=[];for(let ct=0,it=je.length;ct<it;ct++){let A=q(je[ct],re[ct],Ge);ye(A.x,A.y,-ae),J===0&&D.push(A)}J===0&&le.push(D)}}Re=Br.triangulateShape(ne,le)}let ht=Re.length,nt=m+y;for(let ne=0;ne<Z;ne++){let le=d?q(P[ne],De[ne],nt):P[ne];_?(C.copy(M.normals[0]).multiplyScalar(le.x),w.copy(M.binormals[0]).multiplyScalar(le.y),v.copy(E[0]).add(C).add(w),ye(v.x,v.y,v.z)):ye(le.x,le.y,0)}for(let ne=1;ne<=u;ne++)for(let le=0;le<Z;le++){let he=d?q(P[le],De[le],nt):P[le];_?(C.copy(M.normals[ne]).multiplyScalar(he.x),w.copy(M.binormals[ne]).multiplyScalar(he.y),v.copy(E[ne]).add(C).add(w),ye(v.x,v.y,v.z)):ye(he.x,he.y,h/u*ne)}for(let ne=g-1;ne>=0;ne--){let le=ne/g,he=f*Math.cos(le*Math.PI/2),J=m*Math.sin(le*Math.PI/2)+y;for(let ae=0,Ge=B.length;ae<Ge;ae++){let Fe=q(B[ae],X[ae],J);ye(Fe.x,Fe.y,h+he)}for(let ae=0,Ge=L.length;ae<Ge;ae++){let Fe=L[ae];re=ee[ae];for(let We=0,je=Fe.length;We<je;We++){let D=q(Fe[We],re[We],J);_?ye(D.x,D.y+E[u-1].y,E[u-1].x+he):ye(D.x,D.y,h+he)}}}dt(),Y();function dt(){let ne=r.length/3;if(d){let le=0,he=Z*le;for(let J=0;J<ht;J++){let ae=Re[J];$e(ae[2]+he,ae[1]+he,ae[0]+he)}le=u+g*2,he=Z*le;for(let J=0;J<ht;J++){let ae=Re[J];$e(ae[0]+he,ae[1]+he,ae[2]+he)}}else{for(let le=0;le<ht;le++){let he=Re[le];$e(he[2],he[1],he[0])}for(let le=0;le<ht;le++){let he=Re[le];$e(he[0]+Z*u,he[1]+Z*u,he[2]+Z*u)}}i.addGroup(ne,r.length/3-ne,0)}function Y(){let ne=r.length/3,le=0;te(B,le),le+=B.length;for(let he=0,J=L.length;he<J;he++){let ae=L[he];te(ae,le),le+=ae.length}i.addGroup(ne,r.length/3-ne,1)}function te(ne,le){let he=ne.length;for(;--he>=0;){let J=he,ae=he-1;ae<0&&(ae=ne.length-1);for(let Ge=0,Fe=u+g*2;Ge<Fe;Ge++){let We=Z*Ge,je=Z*(Ge+1),D=le+J+We,ct=le+ae+We,it=le+ae+je,A=le+J+je;Ae(D,ct,it,A)}}}function ye(ne,le,he){c.push(ne),c.push(le),c.push(he)}function $e(ne,le,he){qe(ne),qe(le),qe(he);let J=r.length/3,ae=S.generateTopUV(i,r,J-3,J-2,J-1);ft(ae[0]),ft(ae[1]),ft(ae[2])}function Ae(ne,le,he,J){qe(ne),qe(le),qe(J),qe(le),qe(he),qe(J);let ae=r.length/3,Ge=S.generateSideWallUV(i,r,ae-6,ae-3,ae-2,ae-1);ft(Ge[0]),ft(Ge[1]),ft(Ge[3]),ft(Ge[1]),ft(Ge[2]),ft(Ge[3])}function qe(ne){r.push(c[ne*3+0]),r.push(c[ne*3+1]),r.push(c[ne*3+2])}function ft(ne){s.push(ne.x),s.push(ne.y)}}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}toJSON(){let e=super.toJSON(),t=this.parameters.shapes,i=this.parameters.options;return bT(t,i,e)}static fromJSON(e,t){let i=[];for(let s=0,o=e.shapes.length;s<o;s++){let a=t[e.shapes[s]];i.push(a)}let r=e.options.extrudePath;return r!==void 0&&(e.options.extrudePath=new ux[r.type]().fromJSON(r)),new n(i,e.options)}},yT={generateTopUV:function(n,e,t,i,r){let s=e[t*3],o=e[t*3+1],a=e[i*3],c=e[i*3+1],l=e[r*3],u=e[r*3+1];return[new fe(s,o),new fe(a,c),new fe(l,u)]},generateSideWallUV:function(n,e,t,i,r,s){let o=e[t*3],a=e[t*3+1],c=e[t*3+2],l=e[i*3],u=e[i*3+1],h=e[i*3+2],d=e[r*3],f=e[r*3+1],m=e[r*3+2],y=e[s*3],g=e[s*3+1],p=e[s*3+2];return Math.abs(a-u)<Math.abs(o-l)?[new fe(o,1-c),new fe(l,1-h),new fe(d,1-m),new fe(y,1-p)]:[new fe(a,1-c),new fe(u,1-h),new fe(f,1-m),new fe(g,1-p)]}};function bT(n,e,t){if(t.shapes=[],Array.isArray(n))for(let i=0,r=n.length;i<r;i++){let s=n[i];t.shapes.push(s.uuid)}else t.shapes.push(n.uuid);return t.options=Object.assign({},e),e.extrudePath!==void 0&&(t.options.extrudePath=e.extrudePath.toJSON()),t}var $r=class n extends Aa{constructor(e=1,t=0){let i=(1+Math.sqrt(5))/2,r=[-1,i,0,1,i,0,-1,-i,0,1,-i,0,0,-1,i,0,1,i,0,-1,-i,0,1,-i,i,0,-1,i,0,1,-i,0,-1,-i,0,1],s=[0,11,5,0,5,1,0,1,7,0,7,10,0,10,11,1,5,9,5,11,4,11,10,2,10,7,6,7,1,8,3,9,4,3,4,2,3,2,6,3,6,8,3,8,9,4,9,5,2,4,11,6,2,10,8,6,7,9,8,1];super(r,s,e,t),this.type="IcosahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}};var dr=class n extends Aa{constructor(e=1,t=0){let i=[1,0,0,-1,0,0,0,1,0,0,-1,0,0,0,1,0,0,-1],r=[0,2,4,0,4,3,0,3,5,0,5,2,1,2,5,1,5,3,1,3,4,1,4,2];super(i,r,e,t),this.type="OctahedronGeometry",this.parameters={radius:e,detail:t}}static fromJSON(e){return new n(e.radius,e.detail)}},Wr=class n extends Ht{constructor(e=1,t=1,i=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:i,heightSegments:r};let s=e/2,o=t/2,a=Math.floor(i),c=Math.floor(r),l=a+1,u=c+1,h=e/a,d=t/c,f=[],m=[],y=[],g=[];for(let p=0;p<u;p++){let S=p*d-o;for(let E=0;E<l;E++){let _=E*h-s;m.push(_,-S,0),y.push(0,0,1),g.push(E/a),g.push(1-p/c)}}for(let p=0;p<c;p++)for(let S=0;S<a;S++){let E=S+l*p,_=S+l*(p+1),M=S+1+l*(p+1),w=S+1+l*p;f.push(E,_,w),f.push(_,M,w)}this.setIndex(f),this.setAttribute("position",new gt(m,3)),this.setAttribute("normal",new gt(y,3)),this.setAttribute("uv",new gt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.width,e.height,e.widthSegments,e.heightSegments)}},Oa=class n extends Ht{constructor(e=.5,t=1,i=32,r=1,s=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:i,phiSegments:r,thetaStart:s,thetaLength:o},i=Math.max(3,i),r=Math.max(1,r);let a=[],c=[],l=[],u=[],h=e,d=(t-e)/r,f=new I,m=new fe;for(let y=0;y<=r;y++){for(let g=0;g<=i;g++){let p=s+g/i*o;f.x=h*Math.cos(p),f.y=h*Math.sin(p),c.push(f.x,f.y,f.z),l.push(0,0,1),m.x=(f.x/t+1)/2,m.y=(f.y/t+1)/2,u.push(m.x,m.y)}h+=d}for(let y=0;y<r;y++){let g=y*(i+1);for(let p=0;p<i;p++){let S=p+g,E=S,_=S+i+1,M=S+i+2,w=S+1;a.push(E,_,w),a.push(_,M,w)}}this.setIndex(a),this.setAttribute("position",new gt(c,3)),this.setAttribute("normal",new gt(l,3)),this.setAttribute("uv",new gt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}};var Fa=class n extends Ht{constructor(e=1,t=32,i=16,r=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:e,widthSegments:t,heightSegments:i,phiStart:r,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),i=Math.max(2,Math.floor(i));let c=Math.min(o+a,Math.PI),l=0,u=[],h=new I,d=new I,f=[],m=[],y=[],g=[];for(let p=0;p<=i;p++){let S=[],E=p/i,_=o+E*a,M=e*Math.cos(_),w=Math.sqrt(e*e-M*M),C=0;p===0&&o===0?C=.5/t:p===i&&c===Math.PI&&(C=-.5/t);for(let v=0;v<=t;v++){let T=v/t,P=r+T*s;h.x=-w*Math.cos(P),h.y=M,h.z=w*Math.sin(P),m.push(h.x,h.y,h.z),d.copy(h).normalize(),y.push(d.x,d.y,d.z),g.push(T+C,1-E),S.push(l++)}u.push(S)}for(let p=0;p<i;p++)for(let S=0;S<t;S++){let E=u[p][S+1],_=u[p][S],M=u[p+1][S],w=u[p+1][S+1];(p!==0||o>0)&&f.push(E,_,w),(p!==i-1||c<Math.PI)&&f.push(_,M,w)}this.setIndex(f),this.setAttribute("position",new gt(m,3)),this.setAttribute("normal",new gt(y,3)),this.setAttribute("uv",new gt(g,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.widthSegments,e.heightSegments,e.phiStart,e.phiLength,e.thetaStart,e.thetaLength)}};var Zr=class n extends Ht{constructor(e=1,t=.4,i=12,r=48,s=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:e,tube:t,radialSegments:i,tubularSegments:r,arc:s,thetaStart:o,thetaLength:a},i=Math.floor(i),r=Math.floor(r);let c=[],l=[],u=[],h=[],d=new I,f=new I,m=new I;for(let y=0;y<=i;y++){let g=o+y/i*a;for(let p=0;p<=r;p++){let S=p/r*s;f.x=(e+t*Math.cos(g))*Math.cos(S),f.y=(e+t*Math.cos(g))*Math.sin(S),f.z=t*Math.sin(g),l.push(f.x,f.y,f.z),d.x=e*Math.cos(S),d.y=e*Math.sin(S),m.subVectors(f,d).normalize(),u.push(m.x,m.y,m.z),h.push(p/r),h.push(y/i)}}for(let y=1;y<=i;y++)for(let g=1;g<=r;g++){let p=(r+1)*y+g-1,S=(r+1)*(y-1)+g-1,E=(r+1)*(y-1)+g,_=(r+1)*y+g;c.push(p,S,_),c.push(S,E,_)}this.setIndex(c),this.setAttribute("position",new gt(l,3)),this.setAttribute("normal",new gt(u,3)),this.setAttribute("uv",new gt(h,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new n(e.radius,e.tube,e.radialSegments,e.tubularSegments,e.arc,e.thetaStart,e.thetaLength)}};function Kr(n){let e={};for(let t in n){e[t]={};for(let i in n[t]){let r=n[t][i];if(Nb(r))r.isRenderTargetTexture?(Xe("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][i]=null):e[t][i]=r.clone();else if(Array.isArray(r))if(Nb(r[0])){let s=[];for(let o=0,a=r.length;o<a;o++)s[o]=r[o].clone();e[t][i]=s}else e[t][i]=r.slice();else e[t][i]=r}}return e}function ln(n){let e={};for(let t=0;t<n.length;t++){let i=Kr(n[t]);for(let r in i)e[r]=i[r]}return e}function Nb(n){return n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)}function ST(n){let e=[];for(let t=0;t<n.length;t++)e.push(n[t].clone());return e}function Gx(n){let e=n.getRenderTarget();return e===null?n.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:ut.workingColorSpace}var RS={clone:Kr,merge:ln},MT=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,wT=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,cn=class extends cr{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=MT,this.fragmentShader=wT,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Kr(e.uniforms),this.uniformsGroups=ST(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let r in this.uniforms){let o=this.uniforms[r].value;o&&o.isTexture?t.uniforms[r]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[r]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[r]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[r]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[r]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[r]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[r]={type:"m4",value:o.toArray()}:t.uniforms[r]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let i={};for(let r in this.extensions)this.extensions[r]===!0&&(i[r]=!0);return Object.keys(i).length>0&&(t.extensions=i),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(let i in e.uniforms){let r=e.uniforms[i];switch(this.uniforms[i]={},r.type){case"t":this.uniforms[i].value=t[r.value]||null;break;case"c":this.uniforms[i].value=new Pe().setHex(r.value);break;case"v2":this.uniforms[i].value=new fe().fromArray(r.value);break;case"v3":this.uniforms[i].value=new I().fromArray(r.value);break;case"v4":this.uniforms[i].value=new zt().fromArray(r.value);break;case"m3":this.uniforms[i].value=new Qe().fromArray(r.value);break;case"m4":this.uniforms[i].value=new mt().fromArray(r.value);break;default:this.uniforms[i].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(let i in e.extensions)this.extensions[i]=e.extensions[i];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}},Zu=class extends cn{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}};var Ni=class extends cr{constructor(e){super(),this.isMeshToonMaterial=!0,this.defines={TOON:""},this.type="MeshToonMaterial",this.color=new Pe(16777215),this.map=null,this.gradientMap=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Pe(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Zh,this.normalScale=new fe(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.alphaMap=null,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.gradientMap=e.gradientMap,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.alphaMap=e.alphaMap,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Xu=class extends cr{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=lS,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},qu=class extends cr{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function Zs(n,e){return!n||n.constructor===e?n:typeof e.BYTES_PER_ELEMENT=="number"?new e(n):Array.prototype.slice.call(n)}function ix(n){return n!==void 0&&n.inTangents!==void 0&&n.outTangents!==void 0}var fr=class{constructor(e,t,i,r){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=r!==void 0?r:new t.constructor(i),this.sampleValues=t,this.valueSize=i,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,i=this._cachedIndex,r=t[i],s=t[i-1];n:{e:{let o;t:{i:if(!(e<r)){for(let a=i+2;;){if(r===void 0){if(e<s)break i;return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}if(i===a)break;if(s=r,r=t[++i],e<r)break e}o=t.length;break t}if(!(e>=s)){let a=t[1];e<a&&(i=2,s=a);for(let c=i-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(i===c)break;if(r=s,s=t[--i-1],e>=s)break e}o=i,i=0;break t}break n}for(;i<o;){let a=i+o>>>1;e<t[a]?o=a:i=a+1}if(r=t[i],s=t[i-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(r===void 0)return i=t.length,this._cachedIndex=i,this.copySampleValue_(i-1)}this._cachedIndex=i,this.intervalChanged_(i,s,r)}return this.interpolate_(i,s,e,r)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,i=this.sampleValues,r=this.valueSize,s=e*r;for(let o=0;o!==r;++o)t[o]=i[s+o];return t}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Yu=class extends fr{constructor(e,t,i,r){super(e,t,i,r),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:ox,endingEnd:ox}}intervalChanged_(e,t,i){let r=this.parameterPositions,s=e-2,o=e+1,a=r[s],c=r[o];if(a===void 0)switch(this.getSettings_().endingStart){case ax:s=e,a=2*t-i;break;case cx:s=r.length-2,a=t+r[s]-r[s+1];break;default:s=e,a=i}if(c===void 0)switch(this.getSettings_().endingEnd){case ax:o=e,c=2*i-t;break;case cx:o=1,c=i+r[1]-r[0];break;default:o=e-1,c=t}let l=(i-t)*.5,u=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-i),this._offsetPrev=s*u,this._offsetNext=o*u}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this._offsetPrev,h=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(i-t)/(r-t),y=m*m,g=y*m,p=-d*g+2*d*y-d*m,S=(1+d)*g+(-1.5-2*d)*y+(-.5+d)*m+1,E=(-1-f)*g+(1.5+f)*y+.5*m,_=f*g-f*y;for(let M=0;M!==a;++M)s[M]=p*o[u+M]+S*o[l+M]+E*o[c+M]+_*o[h+M];return s}},Ju=class extends fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=(i-t)/(r-t),h=1-u;for(let d=0;d!==a;++d)s[d]=o[l+d]*h+o[c+d]*u;return s}},ju=class extends fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e){return this.copySampleValue_(e-1)}},Ku=class extends fr{interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,u=this.inTangents,h=this.outTangents;if(!u||!h){let m=(i-t)/(r-t),y=1-m;for(let g=0;g!==a;++g)s[g]=o[l+g]*y+o[c+g]*m;return s}let d=a*2,f=e-1;for(let m=0;m!==a;++m){let y=o[l+m],g=o[c+m],p=f*d+m*2,S=h[p],E=h[p+1],_=e*d+m*2,M=u[_],w=u[_+1],C=TT(i,t,S,M,r);s[m]=CS(C,y,E,w,g)}return s}};function CS(n,e,t,i,r){let s=1-n;return s*s*s*e+3*s*s*n*t+3*s*n*n*i+n*n*n*r}function ET(n,e,t,i,r){let s=1-n;return 3*s*s*(t-e)+6*s*n*(i-t)+3*n*n*(r-i)}function TT(n,e,t,i,r){let s=(n-e)/(r-e);for(let o=0;o<8;o++){let a=CS(s,e,t,i,r)-n;if(Math.abs(a)<1e-10)break;let c=ET(s,e,t,i,r);if(Math.abs(c)<1e-10)break;s=Math.max(0,Math.min(1,s-a/c))}return s}var zn=class{constructor(e,t,i,r){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=Zs(t,this.TimeBufferType),this.values=Zs(i,this.ValueBufferType),this.setInterpolation(r||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,i;if(t.toJSON!==this.toJSON)i=t.toJSON(e);else{i={name:e.name,times:Zs(e.times,Array),values:Zs(e.values,Array)};let r=e.getInterpolation();r!==e.DefaultInterpolation&&(i.interpolation=r),ix(e.settings)&&(i.settings={inTangents:Zs(e.settings.inTangents,Array),outTangents:Zs(e.settings.outTangents,Array)})}return i.type=e.ValueTypeName,i}InterpolantFactoryMethodDiscrete(e){return new ju(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ju(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Yu(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodBezier(e){let t=new Ku(this.times,this.values,this.getValueSize(),e);return this.settings&&(t.inTangents=this.settings.inTangents,t.outTangents=this.settings.outTangents),t}setInterpolation(e){let t;switch(e){case fa:t=this.InterpolantFactoryMethodDiscrete;break;case Nu:t=this.InterpolantFactoryMethodLinear;break;case Su:t=this.InterpolantFactoryMethodSmooth;break;case sx:t=this.InterpolantFactoryMethodBezier;break}if(t===void 0){let i="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(i);return Xe("KeyframeTrack:",i),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return fa;case this.InterpolantFactoryMethodLinear:return Nu;case this.InterpolantFactoryMethodSmooth:return Su;case this.InterpolantFactoryMethodBezier:return sx}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let i=0,r=t.length;i!==r;++i)t[i]*=e;ix(this.settings)&&(Lb(this.settings.inTangents,e),Lb(this.settings.outTangents,e))}return this}trim(e,t){let i=this.times,r=i.length,s=0,o=r-1;for(;s!==r&&i[s]<e;)++s;for(;o!==-1&&i[o]>t;)--o;if(++o,s!==0||o!==r){s>=o&&(o=Math.max(o,1),s=o-1);let a=this.getValueSize();this.times=i.slice(s,o),this.values=this.values.slice(s*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(Je("KeyframeTrack: Invalid value size in track.",this),e=!1);let i=this.times,r=this.values,s=i.length;s===0&&(Je("KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==s;a++){let c=i[a];if(typeof c=="number"&&isNaN(c)){Je("KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){Je("KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(r!==void 0&&c1(r))for(let a=0,c=r.length;a!==c;++a){let l=r[a];if(isNaN(l)){Je("KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),i=this.getValueSize(),r=this.getInterpolation()===Su,s=e.length-1,o=1;for(let a=1;a<s;++a){let c=!1,l=e[a],u=e[a+1];if(l!==u&&(a!==1||l!==e[0]))if(r)c=!0;else{let h=a*i,d=h-i,f=h+i;for(let m=0;m!==i;++m){let y=t[h+m];if(y!==t[d+m]||y!==t[f+m]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let h=a*i,d=o*i;for(let f=0;f!==i;++f)t[d+f]=t[h+f]}++o}}if(s>0){e[o]=e[s];for(let a=s*i,c=o*i,l=0;l!==i;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*i)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),i=this.constructor,r=new i(this.name,e,t);return r.createInterpolant=this.createInterpolant,ix(this.settings)&&(r.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),r}};function Lb(n,e){for(let t=0,i=n.length;t!==i;t+=2)n[t]*=e}zn.prototype.ValueTypeName="";zn.prototype.TimeBufferType=Float32Array;zn.prototype.ValueBufferType=Float32Array;zn.prototype.DefaultInterpolation=Nu;var pr=class extends zn{constructor(e,t,i){super(e,t,i)}};pr.prototype.ValueTypeName="bool";pr.prototype.ValueBufferType=Array;pr.prototype.DefaultInterpolation=fa;pr.prototype.InterpolantFactoryMethodLinear=void 0;pr.prototype.InterpolantFactoryMethodSmooth=void 0;var Qu=class extends zn{constructor(e,t,i,r){super(e,t,i,r)}};Qu.prototype.ValueTypeName="color";var eh=class extends zn{constructor(e,t,i,r){super(e,t,i,r)}};eh.prototype.ValueTypeName="number";var th=class extends fr{constructor(e,t,i,r){super(e,t,i,r)}interpolate_(e,t,i,r){let s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(i-t)/(r-t),l=e*a;for(let u=l+a;l!==u;l+=4)sn.slerpFlat(s,0,o,l-a,o,l,c);return s}},ka=class extends zn{constructor(e,t,i,r){super(e,t,i,r)}InterpolantFactoryMethodLinear(e){return new th(this.times,this.values,this.getValueSize(),e)}};ka.prototype.ValueTypeName="quaternion";ka.prototype.InterpolantFactoryMethodSmooth=void 0;var mr=class extends zn{constructor(e,t,i){super(e,t,i)}};mr.prototype.ValueTypeName="string";mr.prototype.ValueBufferType=Array;mr.prototype.DefaultInterpolation=fa;mr.prototype.InterpolantFactoryMethodLinear=void 0;mr.prototype.InterpolantFactoryMethodSmooth=void 0;var nh=class extends zn{constructor(e,t,i,r){super(e,t,i,r)}};nh.prototype.ValueTypeName="vector";var ih=class{constructor(e,t,i){let r=this,s=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=i,this._abortController=null,this.itemStart=function(u){a++,s===!1&&r.onStart!==void 0&&r.onStart(u,o,a),s=!0},this.itemEnd=function(u){o++,r.onProgress!==void 0&&r.onProgress(u,o,a),o===a&&(s=!1,r.onLoad!==void 0&&r.onLoad())},this.itemError=function(u){r.onError!==void 0&&r.onError(u)},this.resolveURL=function(u){return u=u.normalize("NFC"),c?c(u):u},this.setURLModifier=function(u){return c=u,this},this.addHandler=function(u,h){return l.push(u,h),this},this.removeHandler=function(u){let h=l.indexOf(u);return h!==-1&&l.splice(h,2),this},this.getHandler=function(u){for(let h=0,d=l.length;h<d;h+=2){let f=l[h],m=l[h+1];if(f.global&&(f.lastIndex=0),f.test(u))return m}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},PS=new ih,rh=class{constructor(e){this.manager=e!==void 0?e:PS,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(e,t){let i=this;return new Promise(function(r,s){i.load(e,r,t,s)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}abort(){return this}};rh.DEFAULT_MATERIAL_NAME="__DEFAULT";var Ba=class extends an{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Pe(e),this.intensity=t}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,t}},Xr=class extends Ba{constructor(e,t,i){super(e,i),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(an.DEFAULT_UP),this.updateMatrix(),this.groundColor=new Pe(t)}copy(e,t){return super.copy(e,t),this.groundColor.copy(e.groundColor),this}toJSON(e){let t=super.toJSON(e);return t.object.groundColor=this.groundColor.getHex(),t}},rx=new mt,zb=new I,Ub=new I,sh=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new fe(512,512),this.mapType=Rn,this.map=null,this.mapPass=null,this.matrix=new mt,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Di,this._frameExtents=new fe(1,1),this._viewportCount=1,this._viewports=[new zt(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera;zb.setFromMatrixPosition(e.matrixWorld),t.position.copy(zb),Ub.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(Ub),t.updateMatrixWorld(),this._updateMatrix(t,this.matrix,this._frustum)}_updateMatrix(e,t,i,r){rx.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),i.setFromProjectionMatrix(rx,e.coordinateSystem,e.reversedDepth);let s=this._frameExtents,o=r?r.z/s.x:1,a=r?r.w/s.y:1,c=r?r.x/s.x:0,l=r?r.y/s.y:0;e.coordinateSystem===Ks||e.reversedDepth?t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):t.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),t.multiply(rx)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.autoUpdate=e.autoUpdate,this.needsUpdate=e.needsUpdate,this.normalBias=e.normalBias,this.blurSamples=e.blurSamples,this.mapSize.copy(e.mapSize),this.biasNode=e.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return e.intensity=this.intensity,e.bias=this.bias,e.normalBias=this.normalBias,e.radius=this.radius,e.blurSamples=this.blurSamples,e.mapSize=this.mapSize.toArray(),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},yu=new I,bu=new sn,ui=new I,Ha=class extends an{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new mt,this.projectionMatrix=new mt,this.projectionMatrixInverse=new mt,this.coordinateSystem=Bn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(yu,bu,ui),ui.x===1&&ui.y===1&&ui.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(yu,bu,ui.set(1,1,1)).invert()}updateWorldMatrix(e,t,i=!1){super.updateWorldMatrix(e,t,i),this.matrixWorld.decompose(yu,bu,ui),ui.x===1&&ui.y===1&&ui.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(yu,bu,ui.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},or=new I,Ob=new fe,Fb=new fe,Yt=class extends Ha{constructor(e=50,t=1,i=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=i,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=eo*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(la*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return eo*2*Math.atan(Math.tan(la*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,i){or.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(or.x,or.y).multiplyScalar(-e/or.z),or.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),i.set(or.x,or.y).multiplyScalar(-e/or.z)}getViewSize(e,t){return this.getViewBounds(e,Ob,Fb),t.subVectors(Fb,Ob)}setViewOffset(e,t,i,r,s,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(la*.5*this.fov)/this.zoom,i=2*t,r=this.aspect*i,s=-.5*r,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;s+=o.offsetX*r/c,t-=o.offsetY*i/l,r*=o.width/c,i*=o.height/l}let a=this.filmOffset;a!==0&&(s+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-i,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}};var oo=class extends Ha{constructor(e=-1,t=1,i=1,r=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=i,this.bottom=r,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,i,r,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=i,this.view.offsetY=r,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),i=(this.right+this.left)/2,r=(this.top+this.bottom)/2,s=i-e,o=i+e,a=r+t,c=r-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,o=s+l*this.view.width,a-=u*this.view.offsetY,c=a-u*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},px=class extends sh{constructor(){super(new oo(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},qr=class extends Ba{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(an.DEFAULT_UP),this.updateMatrix(),this.target=new an,this.shadow=new px}dispose(){super.dispose(),this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}toJSON(e){let t=super.toJSON(e);return t.object.shadow=this.shadow.toJSON(),t.object.target=this.target.uuid,t}};var Xs=-90,qs=1,oh=class extends an{constructor(e,t,i){super(),this.type="CubeCamera",this.renderTarget=i,this.coordinateSystem=null,this.activeMipmapLevel=0;let r=new Yt(Xs,qs,e,t);r.layers=this.layers,this.add(r);let s=new Yt(Xs,qs,e,t);s.layers=this.layers,this.add(s);let o=new Yt(Xs,qs,e,t);o.layers=this.layers,this.add(o);let a=new Yt(Xs,qs,e,t);a.layers=this.layers,this.add(a);let c=new Yt(Xs,qs,e,t);c.layers=this.layers,this.add(c);let l=new Yt(Xs,qs,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[i,r,s,o,a,c]=t;for(let l of t)this.remove(l);if(e===Bn)i.up.set(0,1,0),i.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===Ks)i.up.set(0,-1,0),i.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:i,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[s,o,a,c,l,u]=this.children,h=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let y=i.texture.generateMipmaps;i.texture.generateMipmaps=!1;let g=!1;e.isWebGLRenderer===!0?g=e.state.buffers.depth.getReversed():g=e.reversedDepthBuffer,e.setRenderTarget(i,0,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(i,1,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(i,2,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(i,3,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(i,4,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),i.texture.generateMipmaps=y,e.setRenderTarget(i,5,r),g&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(h,d,f),e.xr.enabled=m,i.texture.needsPMREMUpdate=!0}},ah=class extends Yt{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e}};var Vx="\\[\\]\\.:\\/",AT=new RegExp("["+Vx+"]","g"),$x="[^"+Vx+"]",RT="[^"+Vx.replace("\\.","")+"]",CT=/((?:WC+[\/:])*)/.source.replace("WC",$x),PT=/(WCOD+)?/.source.replace("WCOD",RT),IT=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",$x),DT=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",$x),NT=new RegExp("^"+CT+PT+IT+DT+"$"),LT=["material","materials","bones","map"],mx=class{constructor(e,t,i){let r=i||Nt.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,r)}getValue(e,t){this.bind();let i=this._targetGroup.nCachedObjects_,r=this._bindings[i];r!==void 0&&r.getValue(e,t)}setValue(e,t){let i=this._bindings;for(let r=this._targetGroup.nCachedObjects_,s=i.length;r!==s;++r)i[r].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,i=e.length;t!==i;++t)e[t].unbind()}},Nt=class n{constructor(e,t,i){this.path=t,this.parsedPath=i||n.parseTrackName(t),this.node=n.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,i){return e&&e.isAnimationObjectGroup?new n.Composite(e,t,i):new n(e,t,i)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(AT,"")}static parseTrackName(e){let t=NT.exec(e);if(t===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+e);let i={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},r=i.nodeName&&i.nodeName.lastIndexOf(".");if(r!==void 0&&r!==-1){let s=i.nodeName.substring(r+1);LT.indexOf(s)!==-1&&(i.nodeName=i.nodeName.substring(0,r),i.objectName=s)}if(i.propertyName===null||i.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+e);return i}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let i=e.skeleton.getBoneByName(t);if(i!==void 0)return i}if(e.children){let i=function(s){for(let o=0;o<s.length;o++){let a=s[o];if(a.name===t||a.uuid===t)return a;let c=i(a.children);if(c)return c}return null},r=i(e.children);if(r)return r}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)e[t++]=i[r]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let i=this.resolvedProperty;for(let r=0,s=i.length;r!==s;++r)i[r]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,i=t.objectName,r=t.propertyName,s=t.propertyIndex;if(e||(e=n.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){Xe("PropertyBinding: No target node found for track: "+this.path+".");return}if(i){let l=t.objectIndex;switch(i){case"materials":if(!e.material){Je("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){Je("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){Je("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let u=0;u<e.length;u++)if(e[u].name===l){l=u;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){Je("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){Je("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[i]===void 0){Je("PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[i]}if(l!==void 0){if(e[l]===void 0){Je("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[r];if(o===void 0){let l=t.nodeName;Je("PropertyBinding: Trying to update property for track: "+l+"."+r+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(s!==void 0){if(r==="morphTargetInfluences"){if(!e.geometry){Je("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){Je("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[s]!==void 0&&(s=e.morphTargetDictionary[s])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=r;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Nt.Composite=mx;Nt.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Nt.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Nt.prototype.GetterByBindingType=[Nt.prototype._getValue_direct,Nt.prototype._getValue_array,Nt.prototype._getValue_arrayElement,Nt.prototype._getValue_toArray];Nt.prototype.SetterByBindingTypeAndVersioning=[[Nt.prototype._setValue_direct,Nt.prototype._setValue_direct_setNeedsUpdate,Nt.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_array,Nt.prototype._setValue_array_setNeedsUpdate,Nt.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_arrayElement,Nt.prototype._setValue_arrayElement_setNeedsUpdate,Nt.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Nt.prototype._setValue_fromArray,Nt.prototype._setValue_fromArray_setNeedsUpdate,Nt.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var GL=new Float32Array(1);var gx=class n{static{n.prototype.isMatrix2=!0}constructor(e,t,i,r){this.elements=[1,0,0,1],e!==void 0&&this.set(e,t,i,r)}identity(){return this.set(1,0,0,1),this}fromArray(e,t=0){for(let i=0;i<4;i++)this.elements[i]=e[i+t];return this}set(e,t,i,r){let s=this.elements;return s[0]=e,s[2]=t,s[1]=i,s[3]=r,this}};function Wx(n,e,t,i){let r=zT(i);switch(t){case Ux:return n*e;case Wa:return n*e/r.components*r.byteLength;case Za:return n*e/r.components*r.byteLength;case yr:return n*e*2/r.components*r.byteLength;case ph:return n*e*2/r.components*r.byteLength;case Ox:return n*e*3/r.components*r.byteLength;case En:return n*e*4/r.components*r.byteLength;case mh:return n*e*4/r.components*r.byteLength;case Xa:case qa:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Ya:case Ja:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case xh:case vh:return Math.max(n,16)*Math.max(e,8)/4;case gh:case _h:return Math.max(n,8)*Math.max(e,8)/2;case yh:case bh:case Mh:case wh:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*8;case Sh:case ja:case Eh:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Th:return Math.floor((n+3)/4)*Math.floor((e+3)/4)*16;case Ah:return Math.floor((n+4)/5)*Math.floor((e+3)/4)*16;case Rh:return Math.floor((n+4)/5)*Math.floor((e+4)/5)*16;case Ch:return Math.floor((n+5)/6)*Math.floor((e+4)/5)*16;case Ph:return Math.floor((n+5)/6)*Math.floor((e+5)/6)*16;case Ih:return Math.floor((n+7)/8)*Math.floor((e+4)/5)*16;case Dh:return Math.floor((n+7)/8)*Math.floor((e+5)/6)*16;case Nh:return Math.floor((n+7)/8)*Math.floor((e+7)/8)*16;case Lh:return Math.floor((n+9)/10)*Math.floor((e+4)/5)*16;case zh:return Math.floor((n+9)/10)*Math.floor((e+5)/6)*16;case Uh:return Math.floor((n+9)/10)*Math.floor((e+7)/8)*16;case Oh:return Math.floor((n+9)/10)*Math.floor((e+9)/10)*16;case Fh:return Math.floor((n+11)/12)*Math.floor((e+9)/10)*16;case kh:return Math.floor((n+11)/12)*Math.floor((e+11)/12)*16;case Bh:case Hh:case Gh:return Math.ceil(n/4)*Math.ceil(e/4)*16;case Vh:case $h:return Math.ceil(n/4)*Math.ceil(e/4)*8;case Ka:case Wh:return Math.ceil(n/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function zT(n){switch(n){case Rn:case Dx:return{byteLength:1,components:1};case lo:case Nx:case ei:return{byteLength:2,components:1};case dh:case fh:return{byteLength:2,components:4};case Vn:case hh:case Nn:return{byteLength:4,components:1};case Lx:case zx:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${n}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?Xe("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");function KS(){let n=null,e=!1,t=null,i=null;function r(s,o){i=n.requestAnimationFrame(r),t(s,o)}return{start:function(){e!==!0&&t!==null&&n!==null&&(i=n.requestAnimationFrame(r),e=!0)},stop:function(){n!==null&&n.cancelAnimationFrame(i),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){n=s}}}function VT(n){let e=new WeakMap;function t(a,c){let l=a.array,u=a.usage,h=l.byteLength,d=n.createBuffer();n.bindBuffer(c,d),n.bufferData(c,l,u),a.onUploadCallback();let f;if(l instanceof Float32Array)f=n.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)f=n.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=n.HALF_FLOAT:f=n.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=n.SHORT;else if(l instanceof Uint32Array)f=n.UNSIGNED_INT;else if(l instanceof Int32Array)f=n.INT;else if(l instanceof Int8Array)f=n.BYTE;else if(l instanceof Uint8Array)f=n.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=n.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:h}}function i(a,c,l){let u=c.array,h=c.updateRanges;if(n.bindBuffer(l,a),h.length===0)n.bufferSubData(l,0,u);else{h.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<h.length;f++){let m=h[d],y=h[f];y.start<=m.start+m.count+1?m.count=Math.max(m.count,y.start+y.count-m.start):(++d,h[d]=y)}h.length=d+1;for(let f=0,m=h.length;f<m;f++){let y=h[f];n.bufferSubData(l,y.start*u.BYTES_PER_ELEMENT,u,y.start,y.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function s(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(n.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let u=e.get(a);(!u||u.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");i(l.buffer,a,c),l.version=a.version}}return{get:r,remove:s,update:o}}var $T=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,WT=`#ifdef USE_ALPHAHASH
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
#endif`,ZT=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,XT=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,qT=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,YT=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,JT=`#ifdef USE_AOMAP
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
#endif`,jT=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,KT=`#ifdef USE_BATCHING
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
#endif`,QT=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,eA=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,tA=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,nA=`float G_BlinnPhong_Implicit( ) {
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
} // validated`,iA=`#ifdef USE_IRIDESCENCE
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
#endif`,rA=`#ifdef USE_BUMPMAP
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
#endif`,sA=`#if NUM_CLIPPING_PLANES > 0
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
#endif`,oA=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,aA=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,cA=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,lA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,uA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,hA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,dA=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
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
#endif`,fA=`#define PI 3.141592653589793
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
} // validated`,pA=`#ifdef ENVMAP_TYPE_CUBE_UV
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
#endif`,mA=`vec3 transformedNormal = objectNormal;
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
#endif`,gA=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,xA=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,_A=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,vA=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,yA="gl_FragColor = linearToOutputTexel( gl_FragColor );",bA=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,SA=`#ifdef USE_ENVMAP
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
#endif`,MA=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif`,wA=`#ifdef USE_ENVMAP
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
#endif`,EA=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,TA=`#ifdef USE_ENVMAP
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
#endif`,AA=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,RA=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,CA=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,PA=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,IA=`#ifdef USE_GRADIENTMAP
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
}`,DA=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,NA=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,LA=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,zA=`uniform bool receiveShadow;
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
#include <lightprobes_pars_fragment>`,UA=`#ifdef USE_ENVMAP
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
#endif`,OA=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,FA=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,kA=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,BA=`varying vec3 vViewPosition;
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
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,HA=`PhysicalMaterial material;
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
#endif`,GA=`uniform sampler2D dfgLUT;
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
}`,VA=`
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
#endif`,$A=`#if defined( RE_IndirectDiffuse )
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
#endif`,WA=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,ZA=`#ifdef USE_LIGHT_PROBES_GRID
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
#endif`,XA=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,qA=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,YA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,JA=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,jA=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,KA=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,QA=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
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
#endif`,eR=`#if defined( USE_POINTS_UV )
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
#endif`,tR=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,nR=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,iR=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,rR=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,sR=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,oR=`#ifdef USE_MORPHTARGETS
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
#endif`,aR=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,cR=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
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
vec3 nonPerturbedNormal = normal;`,lR=`#ifdef USE_NORMALMAP_OBJECTSPACE
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
#endif`,uR=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,hR=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,dR=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,fR=`#ifdef USE_NORMALMAP
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
#endif`,pR=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,mR=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,gR=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,xR=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,_R=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,vR=`vec3 packNormalToRGB( const in vec3 normal ) {
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
}`,yR=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,bR=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,SR=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,MR=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,wR=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,ER=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,TR=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,AR=`#if NUM_SPOT_LIGHT_COORDS > 0
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
#endif`,RR=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
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
#endif`,CR=`float getShadowMask() {
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
}`,PR=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,IR=`#ifdef USE_SKINNING
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
#endif`,DR=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,NR=`#ifdef USE_SKINNING
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
#endif`,LR=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,zR=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,UR=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,OR=`#ifndef saturate
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
vec3 CustomToneMapping( vec3 color ) { return color; }`,FR=`#ifdef USE_TRANSMISSION
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
#endif`,kR=`#ifdef USE_TRANSMISSION
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
#endif`,BR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,HR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,GR=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
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
#endif`,VR=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,$R=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,WR=`uniform sampler2D t2D;
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
}`,ZR=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,XR=`#ifdef ENVMAP_TYPE_CUBE
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
}`,qR=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,YR=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,JR=`#include <common>
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
}`,jR=`#if DEPTH_PACKING == 3200
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
}`,KR=`#define DISTANCE
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
}`,QR=`#define DISTANCE
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
}`,e2=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,t2=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,n2=`uniform float scale;
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
}`,i2=`uniform vec3 diffuse;
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
}`,r2=`#include <common>
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
}`,s2=`uniform vec3 diffuse;
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
}`,o2=`#define LAMBERT
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
}`,a2=`#define LAMBERT
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
}`,c2=`#define MATCAP
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
}`,l2=`#define MATCAP
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
}`,u2=`#define NORMAL
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
}`,h2=`#define NORMAL
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
}`,d2=`#define PHONG
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
}`,f2=`#define PHONG
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
}`,p2=`#define STANDARD
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
}`,m2=`#define STANDARD
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
}`,g2=`#define TOON
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
}`,x2=`#define TOON
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
}`,_2=`uniform float size;
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
}`,v2=`uniform vec3 diffuse;
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
}`,y2=`#include <common>
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
}`,b2=`uniform vec3 color;
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
}`,S2=`uniform float rotation;
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
}`,M2=`uniform vec3 diffuse;
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
}`,st={alphahash_fragment:$T,alphahash_pars_fragment:WT,alphamap_fragment:ZT,alphamap_pars_fragment:XT,alphatest_fragment:qT,alphatest_pars_fragment:YT,aomap_fragment:JT,aomap_pars_fragment:jT,batching_pars_vertex:KT,batching_vertex:QT,begin_vertex:eA,beginnormal_vertex:tA,bsdfs:nA,iridescence_fragment:iA,bumpmap_pars_fragment:rA,clipping_planes_fragment:sA,clipping_planes_pars_fragment:oA,clipping_planes_pars_vertex:aA,clipping_planes_vertex:cA,color_fragment:lA,color_pars_fragment:uA,color_pars_vertex:hA,color_vertex:dA,common:fA,cube_uv_reflection_fragment:pA,defaultnormal_vertex:mA,displacementmap_pars_vertex:gA,displacementmap_vertex:xA,emissivemap_fragment:_A,emissivemap_pars_fragment:vA,colorspace_fragment:yA,colorspace_pars_fragment:bA,envmap_fragment:SA,envmap_common_pars_fragment:MA,envmap_pars_fragment:wA,envmap_pars_vertex:EA,envmap_physical_pars_fragment:UA,envmap_vertex:TA,fog_vertex:AA,fog_pars_vertex:RA,fog_fragment:CA,fog_pars_fragment:PA,gradientmap_pars_fragment:IA,lightmap_pars_fragment:DA,lights_lambert_fragment:NA,lights_lambert_pars_fragment:LA,lights_pars_begin:zA,lights_toon_fragment:OA,lights_toon_pars_fragment:FA,lights_phong_fragment:kA,lights_phong_pars_fragment:BA,lights_physical_fragment:HA,lights_physical_pars_fragment:GA,lights_fragment_begin:VA,lights_fragment_maps:$A,lights_fragment_end:WA,lightprobes_pars_fragment:ZA,logdepthbuf_fragment:XA,logdepthbuf_pars_fragment:qA,logdepthbuf_pars_vertex:YA,logdepthbuf_vertex:JA,map_fragment:jA,map_pars_fragment:KA,map_particle_fragment:QA,map_particle_pars_fragment:eR,metalnessmap_fragment:tR,metalnessmap_pars_fragment:nR,morphinstance_vertex:iR,morphcolor_vertex:rR,morphnormal_vertex:sR,morphtarget_pars_vertex:oR,morphtarget_vertex:aR,normal_fragment_begin:cR,normal_fragment_maps:lR,normal_pars_fragment:uR,normal_pars_vertex:hR,normal_vertex:dR,normalmap_pars_fragment:fR,clearcoat_normal_fragment_begin:pR,clearcoat_normal_fragment_maps:mR,clearcoat_pars_fragment:gR,iridescence_pars_fragment:xR,opaque_fragment:_R,packing:vR,premultiplied_alpha_fragment:yR,project_vertex:bR,dithering_fragment:SR,dithering_pars_fragment:MR,roughnessmap_fragment:wR,roughnessmap_pars_fragment:ER,shadowmap_pars_fragment:TR,shadowmap_pars_vertex:AR,shadowmap_vertex:RR,shadowmask_pars_fragment:CR,skinbase_vertex:PR,skinning_pars_vertex:IR,skinning_vertex:DR,skinnormal_vertex:NR,specularmap_fragment:LR,specularmap_pars_fragment:zR,tonemapping_fragment:UR,tonemapping_pars_fragment:OR,transmission_fragment:FR,transmission_pars_fragment:kR,uv_pars_fragment:BR,uv_pars_vertex:HR,uv_vertex:GR,worldpos_vertex:VR,background_vert:$R,background_frag:WR,backgroundCube_vert:ZR,backgroundCube_frag:XR,cube_vert:qR,cube_frag:YR,depth_vert:JR,depth_frag:jR,distance_vert:KR,distance_frag:QR,equirect_vert:e2,equirect_frag:t2,linedashed_vert:n2,linedashed_frag:i2,meshbasic_vert:r2,meshbasic_frag:s2,meshlambert_vert:o2,meshlambert_frag:a2,meshmatcap_vert:c2,meshmatcap_frag:l2,meshnormal_vert:u2,meshnormal_frag:h2,meshphong_vert:d2,meshphong_frag:f2,meshphysical_vert:p2,meshphysical_frag:m2,meshtoon_vert:g2,meshtoon_frag:x2,points_vert:_2,points_frag:v2,shadow_vert:y2,shadow_frag:b2,sprite_vert:S2,sprite_frag:M2},Me={common:{diffuse:{value:new Pe(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Qe}},envmap:{envMap:{value:null},envMapRotation:{value:new Qe},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Qe}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Qe}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Qe},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Qe},normalScale:{value:new fe(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Qe},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Qe}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Qe}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Qe}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Pe(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new I},probesMax:{value:new I},probesResolution:{value:new I}},points:{diffuse:{value:new Pe(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0},uvTransform:{value:new Qe}},sprite:{diffuse:{value:new Pe(16777215)},opacity:{value:1},center:{value:new fe(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Qe},alphaMap:{value:null},alphaMapTransform:{value:new Qe},alphaTest:{value:0}}},xi={basic:{uniforms:ln([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.fog]),vertexShader:st.meshbasic_vert,fragmentShader:st.meshbasic_frag},lambert:{uniforms:ln([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Pe(0)},envMapIntensity:{value:1}}]),vertexShader:st.meshlambert_vert,fragmentShader:st.meshlambert_frag},phong:{uniforms:ln([Me.common,Me.specularmap,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,Me.lights,{emissive:{value:new Pe(0)},specular:{value:new Pe(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:st.meshphong_vert,fragmentShader:st.meshphong_frag},standard:{uniforms:ln([Me.common,Me.envmap,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.roughnessmap,Me.metalnessmap,Me.fog,Me.lights,{emissive:{value:new Pe(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag},toon:{uniforms:ln([Me.common,Me.aomap,Me.lightmap,Me.emissivemap,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.gradientmap,Me.fog,Me.lights,{emissive:{value:new Pe(0)}}]),vertexShader:st.meshtoon_vert,fragmentShader:st.meshtoon_frag},matcap:{uniforms:ln([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,Me.fog,{matcap:{value:null}}]),vertexShader:st.meshmatcap_vert,fragmentShader:st.meshmatcap_frag},points:{uniforms:ln([Me.points,Me.fog]),vertexShader:st.points_vert,fragmentShader:st.points_frag},dashed:{uniforms:ln([Me.common,Me.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:st.linedashed_vert,fragmentShader:st.linedashed_frag},depth:{uniforms:ln([Me.common,Me.displacementmap]),vertexShader:st.depth_vert,fragmentShader:st.depth_frag},normal:{uniforms:ln([Me.common,Me.bumpmap,Me.normalmap,Me.displacementmap,{opacity:{value:1}}]),vertexShader:st.meshnormal_vert,fragmentShader:st.meshnormal_frag},sprite:{uniforms:ln([Me.sprite,Me.fog]),vertexShader:st.sprite_vert,fragmentShader:st.sprite_frag},background:{uniforms:{uvTransform:{value:new Qe},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:st.background_vert,fragmentShader:st.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Qe}},vertexShader:st.backgroundCube_vert,fragmentShader:st.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:st.cube_vert,fragmentShader:st.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:st.equirect_vert,fragmentShader:st.equirect_frag},distance:{uniforms:ln([Me.common,Me.displacementmap,{referencePosition:{value:new I},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:st.distance_vert,fragmentShader:st.distance_frag},shadow:{uniforms:ln([Me.lights,Me.fog,{color:{value:new Pe(0)},opacity:{value:1}}]),vertexShader:st.shadow_vert,fragmentShader:st.shadow_frag}};xi.physical={uniforms:ln([xi.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Qe},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Qe},clearcoatNormalScale:{value:new fe(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Qe},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Qe},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Qe},sheen:{value:0},sheenColor:{value:new Pe(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Qe},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Qe},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Qe},transmissionSamplerSize:{value:new fe},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Qe},attenuationDistance:{value:0},attenuationColor:{value:new Pe(0)},specularColor:{value:new Pe(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Qe},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Qe},anisotropyVector:{value:new fe},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Qe}}]),vertexShader:st.meshphysical_vert,fragmentShader:st.meshphysical_frag};var Yh={r:0,b:0,g:0},w2=new mt,QS=new Qe;QS.set(-1,0,0,0,1,0,0,0,1);function E2(n,e,t,i,r,s){let o=new Pe(0),a=r===!0?0:1,c,l,u=null,h=0,d=null;function f(S){let E=S.isScene===!0?S.background:null;if(E&&E.isTexture){let _=S.backgroundBlurriness>0;E=e.get(E,_)}return E}function m(S){let E=!1,_=f(S);_===null?g(o,a):_&&_.isColor&&(g(_,1),E=!0);let M=n.xr.getEnvironmentBlendMode();M==="additive"?t.buffers.color.setClear(0,0,0,1,s):M==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(n.autoClear||E)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),n.clear(n.autoClearColor,n.autoClearDepth,n.autoClearStencil))}function y(S,E){let _=f(E);_&&(_.isCubeTexture||_.mapping===Va)?(l===void 0&&(l=new Ve(new ur(1,1,1),new cn({name:"BackgroundCubeMaterial",uniforms:Kr(xi.backgroundCube.uniforms),vertexShader:xi.backgroundCube.vertexShader,fragmentShader:xi.backgroundCube.fragmentShader,side:Kt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(M,w,C){this.matrixWorld.copyPosition(C.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),i.update(l)),l.material.uniforms.envMap.value=_,l.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(w2.makeRotationFromEuler(E.backgroundRotation)).transpose(),_.isCubeTexture&&_.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(QS),l.material.toneMapped=ut.getTransfer(_.colorSpace)!==St,(u!==_||h!==_.version||d!==n.toneMapping)&&(l.material.needsUpdate=!0,u=_,h=_.version,d=n.toneMapping),l.layers.enableAll(),S.unshift(l,l.geometry,l.material,0,0,null)):_&&_.isTexture&&(c===void 0&&(c=new Ve(new Wr(2,2),new cn({name:"BackgroundMaterial",uniforms:Kr(xi.background.uniforms),vertexShader:xi.background.vertexShader,fragmentShader:xi.background.fragmentShader,side:gr,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),i.update(c)),c.material.uniforms.t2D.value=_,c.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,c.material.toneMapped=ut.getTransfer(_.colorSpace)!==St,_.matrixAutoUpdate===!0&&_.updateMatrix(),c.material.uniforms.uvTransform.value.copy(_.matrix),(u!==_||h!==_.version||d!==n.toneMapping)&&(c.material.needsUpdate=!0,u=_,h=_.version,d=n.toneMapping),c.layers.enableAll(),S.unshift(c,c.geometry,c.material,0,0,null))}function g(S,E){S.getRGB(Yh,Gx(n)),t.buffers.color.setClear(Yh.r,Yh.g,Yh.b,E,s)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(S,E=1){o.set(S),a=E,g(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(S){a=S,g(o,a)},render:m,addToRenderList:y,dispose:p}}function T2(n,e){let t=n.getParameter(n.MAX_VERTEX_ATTRIBS),i={},r=d(null),s=r,o=!1;function a(L,F,V,N,B){let q=!1,Z=h(L,N,V,F);s!==Z&&(s=Z,l(s.object)),q=f(L,N,V,B),q&&m(L,N,V,B),B!==null&&e.update(B,n.ELEMENT_ARRAY_BUFFER),(q||o)&&(o=!1,_(L,F,V,N),B!==null&&n.bindBuffer(n.ELEMENT_ARRAY_BUFFER,e.get(B).buffer))}function c(){return n.createVertexArray()}function l(L){return n.bindVertexArray(L)}function u(L){return n.deleteVertexArray(L)}function h(L,F,V,N){let B=N.wireframe===!0,q=i[F.id];q===void 0&&(q={},i[F.id]=q);let Z=L.isInstancedMesh===!0?L.id:0,se=q[Z];se===void 0&&(se={},q[Z]=se);let X=se[V.id];X===void 0&&(X={},se[V.id]=X);let ee=X[B];return ee===void 0&&(ee=d(c()),X[B]=ee),ee}function d(L){let F=[],V=[],N=[];for(let B=0;B<t;B++)F[B]=0,V[B]=0,N[B]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:F,enabledAttributes:V,attributeDivisors:N,object:L,attributes:{},index:null}}function f(L,F,V,N){let B=s.attributes,q=F.attributes,Z=0,se=V.getAttributes();for(let X in se)if(se[X].location>=0){let re=B[X],De=q[X];if(De===void 0&&(X==="instanceMatrix"&&L.instanceMatrix&&(De=L.instanceMatrix),X==="instanceColor"&&L.instanceColor&&(De=L.instanceColor)),re===void 0||re.attribute!==De||De&&re.data!==De.data)return!0;Z++}return s.attributesNum!==Z||s.index!==N}function m(L,F,V,N){let B={},q=F.attributes,Z=0,se=V.getAttributes();for(let X in se)if(se[X].location>=0){let re=q[X];re===void 0&&(X==="instanceMatrix"&&L.instanceMatrix&&(re=L.instanceMatrix),X==="instanceColor"&&L.instanceColor&&(re=L.instanceColor));let De={};De.attribute=re,re&&re.data&&(De.data=re.data),B[X]=De,Z++}s.attributes=B,s.attributesNum=Z,s.index=N}function y(){let L=s.newAttributes;for(let F=0,V=L.length;F<V;F++)L[F]=0}function g(L){p(L,0)}function p(L,F){let V=s.newAttributes,N=s.enabledAttributes,B=s.attributeDivisors;V[L]=1,N[L]===0&&(n.enableVertexAttribArray(L),N[L]=1),B[L]!==F&&(n.vertexAttribDivisor(L,F),B[L]=F)}function S(){let L=s.newAttributes,F=s.enabledAttributes;for(let V=0,N=F.length;V<N;V++)F[V]!==L[V]&&(n.disableVertexAttribArray(V),F[V]=0)}function E(L,F,V,N,B,q,Z){Z===!0?n.vertexAttribIPointer(L,F,V,B,q):n.vertexAttribPointer(L,F,V,N,B,q)}function _(L,F,V,N){y();let B=N.attributes,q=V.getAttributes(),Z=F.defaultAttributeValues;for(let se in q){let X=q[se];if(X.location>=0){let ee=B[se];if(ee===void 0&&(se==="instanceMatrix"&&L.instanceMatrix&&(ee=L.instanceMatrix),se==="instanceColor"&&L.instanceColor&&(ee=L.instanceColor)),ee!==void 0){let re=ee.normalized,De=ee.itemSize,Re=e.get(ee);if(Re===void 0)continue;let ht=Re.buffer,nt=Re.type,dt=Re.bytesPerElement,Y=nt===n.INT||nt===n.UNSIGNED_INT||ee.gpuType===hh;if(ee.isInterleavedBufferAttribute){let te=ee.data,ye=te.stride,$e=ee.offset;if(te.isInstancedInterleavedBuffer){for(let Ae=0;Ae<X.locationSize;Ae++)p(X.location+Ae,te.meshPerAttribute);L.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let Ae=0;Ae<X.locationSize;Ae++)g(X.location+Ae);n.bindBuffer(n.ARRAY_BUFFER,ht);for(let Ae=0;Ae<X.locationSize;Ae++)E(X.location+Ae,De/X.locationSize,nt,re,ye*dt,($e+De/X.locationSize*Ae)*dt,Y)}else{if(ee.isInstancedBufferAttribute){for(let te=0;te<X.locationSize;te++)p(X.location+te,ee.meshPerAttribute);L.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=ee.meshPerAttribute*ee.count)}else for(let te=0;te<X.locationSize;te++)g(X.location+te);n.bindBuffer(n.ARRAY_BUFFER,ht);for(let te=0;te<X.locationSize;te++)E(X.location+te,De/X.locationSize,nt,re,De*dt,De/X.locationSize*te*dt,Y)}}else if(Z!==void 0){let re=Z[se];if(re!==void 0)switch(re.length){case 2:n.vertexAttrib2fv(X.location,re);break;case 3:n.vertexAttrib3fv(X.location,re);break;case 4:n.vertexAttrib4fv(X.location,re);break;default:n.vertexAttrib1fv(X.location,re)}}}}S()}function M(){T();for(let L in i){let F=i[L];for(let V in F){let N=F[V];for(let B in N){let q=N[B];for(let Z in q)u(q[Z].object),delete q[Z];delete N[B]}}delete i[L]}}function w(L){if(i[L.id]===void 0)return;let F=i[L.id];for(let V in F){let N=F[V];for(let B in N){let q=N[B];for(let Z in q)u(q[Z].object),delete q[Z];delete N[B]}}delete i[L.id]}function C(L){for(let F in i){let V=i[F];for(let N in V){let B=V[N];if(B[L.id]===void 0)continue;let q=B[L.id];for(let Z in q)u(q[Z].object),delete q[Z];delete B[L.id]}}}function v(L){for(let F in i){let V=i[F],N=L.isInstancedMesh===!0?L.id:0,B=V[N];if(B!==void 0){for(let q in B){let Z=B[q];for(let se in Z)u(Z[se].object),delete Z[se];delete B[q]}delete V[N],Object.keys(V).length===0&&delete i[F]}}}function T(){P(),o=!0,s!==r&&(s=r,l(s.object))}function P(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:a,reset:T,resetDefaultState:P,dispose:M,releaseStatesOfGeometry:w,releaseStatesOfObject:v,releaseStatesOfProgram:C,initAttributes:y,enableAttribute:g,disableUnusedAttributes:S}}function A2(n,e,t){let i;function r(c){i=c}function s(c,l){n.drawArrays(i,c,l),t.update(l,i,1)}function o(c,l,u){u!==0&&(n.drawArraysInstanced(i,c,l,u),t.update(l,i,u))}function a(c,l,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(i,c,0,l,0,u);let d=0;for(let f=0;f<u;f++)d+=l[f];t.update(d,i,1)}this.setMode=r,this.render=s,this.renderInstances=o,this.renderMultiDraw=a}function R2(n,e,t,i){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){let C=e.get("EXT_texture_filter_anisotropic");r=n.getParameter(C.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function o(C){return!(C!==En&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(C){let v=C===ei&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(C!==Rn&&C!==Nn&&!v&&i.convert(C)!==n.getParameter(n.IMPLEMENTATION_COLOR_READ_TYPE))}function c(C){if(C==="highp"){if(n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.HIGH_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.HIGH_FLOAT).precision>0)return"highp";C="mediump"}return C==="mediump"&&n.getShaderPrecisionFormat(n.VERTEX_SHADER,n.MEDIUM_FLOAT).precision>0&&n.getShaderPrecisionFormat(n.FRAGMENT_SHADER,n.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",u=c(l);u!==l&&(Xe("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);let h=t.logarithmicDepthBuffer===!0,d=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control");t.reversedDepthBuffer===!0&&d===!1&&Xe("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let f=n.getParameter(n.MAX_TEXTURE_IMAGE_UNITS),m=n.getParameter(n.MAX_VERTEX_TEXTURE_IMAGE_UNITS),y=n.getParameter(n.MAX_TEXTURE_SIZE),g=n.getParameter(n.MAX_CUBE_MAP_TEXTURE_SIZE),p=n.getParameter(n.MAX_VERTEX_ATTRIBS),S=n.getParameter(n.MAX_VERTEX_UNIFORM_VECTORS),E=n.getParameter(n.MAX_VARYING_VECTORS),_=n.getParameter(n.MAX_FRAGMENT_UNIFORM_VECTORS),M=n.getParameter(n.MAX_SAMPLES),w=n.getParameter(n.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:h,reversedDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:y,maxCubemapSize:g,maxAttributes:p,maxVertexUniforms:S,maxVaryings:E,maxFragmentUniforms:_,maxSamples:M,samples:w}}function C2(n){let e=this,t=null,i=0,r=!1,s=!1,o=new jn,a=new Qe,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(h,d){let f=h.length!==0||d||i!==0||r;return r=d,i=h.length,f},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(h,d){t=u(h,d,0)},this.setState=function(h,d,f){let m=h.clippingPlanes,y=h.clipIntersection,g=h.clipShadows,p=n.get(h);if(!r||m===null||m.length===0||s&&!g)s?u(null):l();else{let S=s?0:i,E=S*4,_=p.clippingState||null;c.value=_,_=u(m,d,E,f);for(let M=0;M!==E;++M)_[M]=t[M];p.clippingState=_,this.numIntersection=y?this.numPlanes:0,this.numPlanes+=S}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=i>0),e.numPlanes=i,e.numIntersection=0}function u(h,d,f,m){let y=h!==null?h.length:0,g=null;if(y!==0){if(g=c.value,m!==!0||g===null){let p=f+y*4,S=d.matrixWorldInverse;a.getNormalMatrix(S),(g===null||g.length<p)&&(g=new Float32Array(p));for(let E=0,_=f;E!==y;++E,_+=4)o.copy(h[E]).applyMatrix4(S,a),o.normal.toArray(g,_),g[_+3]=o.constant}c.value=g,c.needsUpdate=!0}return e.numPlanes=y,e.numIntersection=0,g}}var fo=4,P2=6,I2=20,D2=256,Qa=new oo,IS=new Pe,Zx=null,Xx=0,qx=0,Yx=!1,N2=new I,Qr=new I,jh=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(e,t=0,i=.1,r=100,s={}){let{size:o=256,position:a=N2}=s;Zx=this._renderer.getRenderTarget(),Xx=this._renderer.getActiveCubeFace(),qx=this._renderer.getActiveMipmapLevel(),Yx=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(e,i,r,c,a),t>0&&this._blur(c,0,0,t),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=LS(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=NS(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodMeshes.length;e++)this._lodMeshes[e].geometry.dispose()}_cleanup(e){this._renderer.setRenderTarget(Zx,Xx,qx),this._renderer.xr.enabled=Yx,e.scissorTest=!1,ho(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===xr||e.mapping===Jr?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),Zx=this._renderer.getRenderTarget(),Xx=this._renderer.getActiveCubeFace(),qx=this._renderer.getActiveMipmapLevel(),Yx=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let i=t||this._allocateTargets();return this._textureToCubeUV(e,i),this._applyPMREM(i),this._cleanup(i),i}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,i={magFilter:jt,minFilter:jt,generateMipmaps:!1,type:ei,format:En,colorSpace:pa,depthBuffer:!1},r=DS(e,t,i);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=DS(e,t,i);let{_lodMax:s}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=L2(s)),this._blurMaterial=U2(s,e,t),this._ggxMaterial=z2(s,e,t)}return r}_compileMaterial(e){let t=new Ve(new Ht,e);this._renderer.compile(t,Qa)}_sceneToCubeUV(e,t,i,r,s){let c=new Yt(90,1,t,i),l=[1,-1,1,1,1,1],u=[1,1,1,-1,-1,-1],h=this._renderer,d=h.autoClear,f=h.toneMapping;h.getClearColor(IS),h.toneMapping=Qn,h.autoClear=!1,h.state.buffers.depth.getReversed()&&(h.setRenderTarget(r),h.clearDepth(),h.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new Ve(new ur,new An({name:"PMREM.Background",side:Kt,depthWrite:!1,depthTest:!1})));let y=this._backgroundBox,g=y.material,p=!1,S=e.background;S?S.isColor&&(g.color.copy(S),e.background=null,p=!0):(g.color.copy(IS),p=!0);for(let E=0;E<6;E++){let _=E%3;_===0?(c.up.set(0,l[E],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x+u[E],s.y,s.z)):_===1?(c.up.set(0,0,l[E]),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y+u[E],s.z)):(c.up.set(0,l[E],0),c.position.set(s.x,s.y,s.z),c.lookAt(s.x,s.y,s.z+u[E]));let M=this._cubeSize;ho(r,_*M,E>2?M:0,M,M),h.setRenderTarget(r),p&&h.render(y,c),h.render(e,c)}h.toneMapping=f,h.autoClear=d,e.background=S}_textureToCubeUV(e,t){let i=this._renderer,r=e.mapping===xr||e.mapping===Jr;r?(this._cubemapMaterial===null&&(this._cubemapMaterial=LS()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=NS());let s=r?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=s;let a=s.uniforms;a.envMap.value=e;let c=this._cubeSize;ho(t,0,0,3*c,2*c),i.setRenderTarget(t),i.render(o,Qa)}_applyPMREM(e){let t=this._renderer,i=t.autoClear;t.autoClear=!1;let r=this._lodMeshes.length;for(let s=1;s<r;s++)this._applyGGXFilter(e,s-1,s);t.autoClear=i}_applyGGXFilter(e,t,i){let r=this._renderer,s=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[i];a.material=o;let c=o.uniforms,l=i/(this._lodMeshes.length-1),u=t/(this._lodMeshes.length-1),h=Math.sqrt(l*l-u*u),d=l*1.25,f=h*d,{_lodMax:m}=this,y=this._sizeLods[i],g=3*y*(i>m-fo?i-m+fo:0),p=4*(this._cubeSize-y);c.envMap.value=e.texture,c.roughness.value=f,c.mipInt.value=m-t,ho(s,g,p,3*y,2*y),r.setRenderTarget(s),r.render(a,Qa),c.envMap.value=s.texture,c.roughness.value=0,c.mipInt.value=m-i,ho(e,g,p,3*y,2*y),r.setRenderTarget(e),r.render(a,Qa)}_blur(e,t,i,r){let s=this._pingPongRenderTarget,o=Math.min(r,Math.PI)/Math.SQRT2;this._blurPass(e,s,t,i,o),this._blurPass(s,e,i,i,o)}_blurPass(e,t,i,r,s){let o=this._renderer,a=this._blurMaterial,c=this._lodMeshes[r];c.material=a;let l=a.uniforms;l.envMap.value=e.texture,l.sigma.value=s,l.mipInt.value=this._lodMax-i;let u=this._sizeLods[r],h=3*u*(r>this._lodMax-fo?r-this._lodMax+fo:0),d=4*(this._cubeSize-u);ho(t,h,d,3*u,2*u),o.setRenderTarget(t),o.render(c,Qa)}};function L2(n){let e=[],t=[],i=n,r=n-fo+1+P2;for(let s=0;s<r;s++){let o=Math.pow(2,i);e.push(o);let a=1/(o-2),c=-a,l=1+a,u=[c,c,l,c,l,l,c,c,l,l,c,l],h=6,d=6,f=3,m=new Float32Array(f*d*h),y=new Float32Array(f*d*h);for(let p=0;p<h;p++){let S=p%3*2/3-1,E=p>2?0:-1,_=[S,E,0,S+2/3,E,0,S+2/3,E+1,0,S,E,0,S+2/3,E+1,0,S,E+1,0];m.set(_,f*d*p);for(let M=0;M<d;M++){let w=u[M*2]*2-1,C=u[M*2+1]*2-1;p===0?Qr.set(1,C,w):p===1?Qr.set(-w,1,-C):p===2?Qr.set(-w,C,1):p===3?Qr.set(-1,C,-w):p===4?Qr.set(-w,-1,C):Qr.set(w,C,-1),Qr.toArray(y,(p*d+M)*f)}}let g=new Ht;g.setAttribute("position",new $t(m,f)),g.setAttribute("outputDirection",new $t(y,f)),t.push(new Ve(g,null)),i>fo&&i--}return{lodMeshes:t,sizeLods:e}}function DS(n,e,t){let i=new on(n,e,t);return i.texture.mapping=Va,i.texture.name="PMREM.cubeUv",i.scissorTest=!0,i}function ho(n,e,t,i,r){n.viewport.set(e,t,i,r),n.scissor.set(e,t,i,r)}function z2(n,e,t){return new cn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:D2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ed(),fragmentShader:`

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
		`,blending:mi,depthTest:!1,depthWrite:!1})}function U2(n,e,t){return new cn({name:"SphericalGaussianBlur",defines:{SAMPLES:I2,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${n}.0`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ed(),fragmentShader:`

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
		`,blending:mi,depthTest:!1,depthWrite:!1})}function NS(){return new cn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ed(),fragmentShader:`

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
		`,blending:mi,depthTest:!1,depthWrite:!1})}function LS(){return new cn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ed(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:mi,depthTest:!1,depthWrite:!1})}function ed(){return`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	`}var Kh=class extends on{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let i={width:e,height:e,depth:1},r=[i,i,i,i,i,i];this.texture=new Ma(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let i={uniforms:{tEquirect:{value:null}},vertexShader:`

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
			`},r=new ur(5,5,5),s=new cn({name:"CubemapFromEquirect",uniforms:Kr(i.uniforms),vertexShader:i.vertexShader,fragmentShader:i.fragmentShader,side:Kt,blending:mi});s.uniforms.tEquirect.value=t;let o=new Ve(r,s),a=t.minFilter;return t.minFilter===_r&&(t.minFilter=jt),new oh(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t=!0,i=!0,r=!0){let s=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,i,r);e.setRenderTarget(s)}};function O2(n){let e=new WeakMap,t=new WeakMap,i=null;function r(d,f=!1){return d==null?null:f?o(d):s(d)}function s(d){if(d&&d.isTexture){let f=d.mapping;if(f===ch||f===lh)if(e.has(d)){let m=e.get(d).texture;return a(m,d.mapping)}else{let m=d.image;if(m&&m.height>0){let y=new Kh(m.height);return y.fromEquirectangularTexture(n,d),e.set(d,y),d.addEventListener("dispose",l),a(y.texture,d.mapping)}else return null}}return d}function o(d){if(d&&d.isTexture){let f=d.mapping,m=f===ch||f===lh,y=f===xr||f===Jr;if(m||y){let g=t.get(d),p=g!==void 0?g.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return i===null&&(i=new jh(n)),g=m?i.fromEquirectangular(d,g):i.fromCubemap(d,g),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),g.texture;if(g!==void 0)return g.texture;{let S=d.image;return m&&S&&S.height>0||y&&S&&c(S)?(i===null&&(i=new jh(n)),g=m?i.fromEquirectangular(d):i.fromCubemap(d),g.texture.pmremVersion=d.pmremVersion,t.set(d,g),d.addEventListener("dispose",u),g.texture):null}}}return d}function a(d,f){return f===ch?d.mapping=xr:f===lh&&(d.mapping=Jr),d}function c(d){let f=0,m=6;for(let y=0;y<m;y++)d[y]!==void 0&&f++;return f===m}function l(d){let f=d.target;f.removeEventListener("dispose",l);let m=e.get(f);m!==void 0&&(e.delete(f),m.dispose())}function u(d){let f=d.target;f.removeEventListener("dispose",u);let m=t.get(f);m!==void 0&&(t.delete(f),m.dispose())}function h(){e=new WeakMap,t=new WeakMap,i!==null&&(i.dispose(),i=null)}return{get:r,dispose:h}}function F2(n){let e={};function t(i){if(e[i]!==void 0)return e[i];let r=n.getExtension(i);return e[i]=r,r}return{has:function(i){return t(i)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(i){let r=t(i);return r===null&&Hr("WebGLRenderer: "+i+" extension not supported."),r}}}function k2(n,e,t,i){let r={},s=new WeakMap;function o(h){let d=h.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete r[d.id];let f=s.get(d);f&&(e.remove(f),s.delete(d)),i.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(h,d){return r[d.id]===!0||(d.addEventListener("dispose",o),r[d.id]=!0,t.memory.geometries++),d}function c(h){let d=h.attributes;for(let f in d)e.update(d[f],n.ARRAY_BUFFER)}function l(h){let d=[],f=h.index,m=h.attributes.position,y=0;if(m===void 0)return;if(f!==null){let S=f.array;y=f.version;for(let E=0,_=S.length;E<_;E+=3){let M=S[E+0],w=S[E+1],C=S[E+2];d.push(M,w,w,C,C,M)}}else{let S=m.array;y=m.version;for(let E=0,_=S.length/3-1;E<_;E+=3){let M=E+0,w=E+1,C=E+2;d.push(M,w,w,C,C,M)}}let g=new(m.count>=65535?ba:ya)(d,1);g.version=y;let p=s.get(h);p&&e.remove(p),s.set(h,g)}function u(h){let d=s.get(h);if(d){let f=h.index;f!==null&&d.version<f.version&&l(h)}else l(h);return s.get(h)}return{get:a,update:c,getWireframeAttribute:u}}function B2(n,e,t){let i;function r(h){i=h}let s,o;function a(h){s=h.type,o=h.bytesPerElement}function c(h,d){n.drawElements(i,d,s,h*o),t.update(d,i,1)}function l(h,d,f){f!==0&&(n.drawElementsInstanced(i,d,s,h*o,f),t.update(d,i,f))}function u(h,d,f){if(f===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(i,d,0,s,h,0,f);let y=0;for(let g=0;g<f;g++)y+=d[g];t.update(y,i,1)}this.setMode=r,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function H2(n){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function i(s,o,a){switch(t.calls++,o){case n.TRIANGLES:t.triangles+=a*(s/3);break;case n.LINES:t.lines+=a*(s/2);break;case n.LINE_STRIP:t.lines+=a*(s-1);break;case n.LINE_LOOP:t.lines+=a*s;break;case n.POINTS:t.points+=a*s;break;default:Je("WebGLInfo: Unknown draw mode:",o);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:i}}function G2(n,e,t){let i=new WeakMap,r=new zt;function s(o,a,c){let l=o.morphTargetInfluences,u=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,h=u!==void 0?u.length:0,d=i.get(a);if(d===void 0||d.count!==h){let T=function(){C.dispose(),i.delete(a),a.removeEventListener("dispose",T)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,y=a.morphAttributes.color!==void 0,g=a.morphAttributes.position||[],p=a.morphAttributes.normal||[],S=a.morphAttributes.color||[],E=0;f===!0&&(E=1),m===!0&&(E=2),y===!0&&(E=3);let _=a.attributes.position.count*E,M=1;_>e.maxTextureSize&&(M=Math.ceil(_/e.maxTextureSize),_=e.maxTextureSize);let w=new Float32Array(_*M*4*h),C=new xa(w,_,M,h);C.type=Nn,C.needsUpdate=!0;let v=E*4;for(let P=0;P<h;P++){let L=g[P],F=p[P],V=S[P],N=_*M*4*P;for(let B=0;B<L.count;B++){let q=B*v;f===!0&&(r.fromBufferAttribute(L,B),w[N+q+0]=r.x,w[N+q+1]=r.y,w[N+q+2]=r.z,w[N+q+3]=0),m===!0&&(r.fromBufferAttribute(F,B),w[N+q+4]=r.x,w[N+q+5]=r.y,w[N+q+6]=r.z,w[N+q+7]=0),y===!0&&(r.fromBufferAttribute(V,B),w[N+q+8]=r.x,w[N+q+9]=r.y,w[N+q+10]=r.z,w[N+q+11]=V.itemSize===4?r.w:1)}}d={count:h,texture:C,size:new fe(_,M)},i.set(a,d),a.addEventListener("dispose",T)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(n,"morphTexture",o.morphTexture,t);else{let f=0;for(let y=0;y<l.length;y++)f+=l[y];let m=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(n,"morphTargetBaseInfluence",m),c.getUniforms().setValue(n,"morphTargetInfluences",l)}c.getUniforms().setValue(n,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(n,"morphTargetsTextureSize",d.size)}return{update:s}}function V2(n,e,t,i,r){let s=new WeakMap;function o(l){let u=r.render.frame,h=l.geometry,d=e.get(l,h);if(s.get(d)!==u&&(e.update(d),s.set(d,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==u&&(t.update(l.instanceMatrix,n.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,n.ARRAY_BUFFER),s.set(l,u))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==u&&(f.update(),s.set(f,u))}return d}function a(){s=new WeakMap}function c(l){let u=l.target;u.removeEventListener("dispose",c),i.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:o,dispose:a}}var $2={[wx]:"LINEAR_TONE_MAPPING",[Ex]:"REINHARD_TONE_MAPPING",[Tx]:"CINEON_TONE_MAPPING",[Ax]:"ACES_FILMIC_TONE_MAPPING",[Cx]:"AGX_TONE_MAPPING",[Px]:"NEUTRAL_TONE_MAPPING",[Rx]:"CUSTOM_TONE_MAPPING"};function W2(n,e,t,i,r,s){let o=new on(e,t,{type:n,depthBuffer:r,stencilBuffer:s,samples:i?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new Ht;l.setAttribute("position",new gt([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new gt([0,2,0,0,2,0],2));let u=new Zu({uniforms:{tDiffuse:{value:null}},vertexShader:`
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
			}`,depthTest:!1,depthWrite:!1}),h=new Ve(l,u),d=new oo(-1,1,1,-1,0,1),f=null,m=null,y=!1,g,p=null,S=[],E=!1;this.setSize=function(_,M){o.setSize(_,M),a!==null&&a.setSize(_,M),c!==null&&c.setSize(_,M);for(let w=0;w<S.length;w++){let C=S[w];C.setSize&&C.setSize(_,M)}},this.setEffects=function(_){S=_,E=S.length>0&&S[0].isRenderPass===!0;let M=o.width,w=o.height;S.length>0&&a===null&&(a=new on(M,w,{type:ei,depthBuffer:!1,stencilBuffer:!1}),c=new on(M,w,{type:ei,depthBuffer:!1,stencilBuffer:!1}));for(let C=0;C<S.length;C++){let v=S[C];v.setSize&&v.setSize(M,w)}},this.begin=function(_,M){if(y||_.toneMapping===Qn&&S.length===0)return!1;if(p=M,M!==null){let w=M.width,C=M.height;(o.width!==w||o.height!==C)&&this.setSize(w,C)}return E===!1&&_.setRenderTarget(o),g=_.toneMapping,_.toneMapping=Qn,!0},this.hasRenderPass=function(){return E},this.end=function(_,M){_.toneMapping=g,y=!0;let w=o,C=a;for(let v=0;v<S.length;v++){let T=S[v];T.enabled!==!1&&(T.render(_,C,w,M),T.needsSwap!==!1&&(w=C,C=C===a?c:a))}if(f!==_.outputColorSpace||m!==_.toneMapping){f=_.outputColorSpace,m=_.toneMapping,u.defines={},ut.getTransfer(f)===St&&(u.defines.SRGB_TRANSFER="");let v=$2[m];v&&(u.defines[v]=""),u.needsUpdate=!0}u.uniforms.tDiffuse.value=w.texture,_.setRenderTarget(p),_.render(h,d),p=null,y=!1},this.isCompositing=function(){return y},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),l.dispose(),u.dispose()}}var eM=new Tn,Kx=new lr(1,1),tM=new xa,nM=new Uu,iM=new Ma,zS=[],US=[],OS=new Float32Array(16),FS=new Float32Array(9),kS=new Float32Array(4);function mo(n,e,t){let i=n[0];if(i<=0||i>0)return n;let r=e*t,s=zS[r];if(s===void 0&&(s=new Float32Array(r),zS[r]=s),e!==0){i.toArray(s,0);for(let o=1,a=0;o!==e;++o)a+=t,n[o].toArray(s,a)}return s}function Wt(n,e){if(n.length!==e.length)return!1;for(let t=0,i=n.length;t<i;t++)if(n[t]!==e[t])return!1;return!0}function Zt(n,e){for(let t=0,i=e.length;t<i;t++)n[t]=e[t]}function td(n,e){let t=US[e];t===void 0&&(t=new Int32Array(e),US[e]=t);for(let i=0;i!==e;++i)t[i]=n.allocateTextureUnit();return t}function Z2(n,e){let t=this.cache;t[0]!==e&&(n.uniform1f(this.addr,e),t[0]=e)}function X2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;n.uniform2fv(this.addr,e),Zt(t,e)}}function q2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(n.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Wt(t,e))return;n.uniform3fv(this.addr,e),Zt(t,e)}}function Y2(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;n.uniform4fv(this.addr,e),Zt(t,e)}}function J2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Wt(t,e))return;n.uniformMatrix2fv(this.addr,!1,e),Zt(t,e)}else{if(Wt(t,i))return;kS.set(i),n.uniformMatrix2fv(this.addr,!1,kS),Zt(t,i)}}function j2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Wt(t,e))return;n.uniformMatrix3fv(this.addr,!1,e),Zt(t,e)}else{if(Wt(t,i))return;FS.set(i),n.uniformMatrix3fv(this.addr,!1,FS),Zt(t,i)}}function K2(n,e){let t=this.cache,i=e.elements;if(i===void 0){if(Wt(t,e))return;n.uniformMatrix4fv(this.addr,!1,e),Zt(t,e)}else{if(Wt(t,i))return;OS.set(i),n.uniformMatrix4fv(this.addr,!1,OS),Zt(t,i)}}function Q2(n,e){let t=this.cache;t[0]!==e&&(n.uniform1i(this.addr,e),t[0]=e)}function eC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;n.uniform2iv(this.addr,e),Zt(t,e)}}function tC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Wt(t,e))return;n.uniform3iv(this.addr,e),Zt(t,e)}}function nC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;n.uniform4iv(this.addr,e),Zt(t,e)}}function iC(n,e){let t=this.cache;t[0]!==e&&(n.uniform1ui(this.addr,e),t[0]=e)}function rC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(n.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Wt(t,e))return;n.uniform2uiv(this.addr,e),Zt(t,e)}}function sC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(n.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Wt(t,e))return;n.uniform3uiv(this.addr,e),Zt(t,e)}}function oC(n,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(n.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Wt(t,e))return;n.uniform4uiv(this.addr,e),Zt(t,e)}}function aC(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r);let s;this.type===n.SAMPLER_2D_SHADOW?(Kx.compareFunction=t.isReversedDepthBuffer()?qh:Xh,s=Kx):s=eM,t.setTexture2D(e||s,r)}function cC(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture3D(e||nM,r)}function lC(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTextureCube(e||iM,r)}function uC(n,e,t){let i=this.cache,r=t.allocateTextureUnit();i[0]!==r&&(n.uniform1i(this.addr,r),i[0]=r),t.setTexture2DArray(e||tM,r)}function hC(n){switch(n){case 5126:return Z2;case 35664:return X2;case 35665:return q2;case 35666:return Y2;case 35674:return J2;case 35675:return j2;case 35676:return K2;case 5124:case 35670:return Q2;case 35667:case 35671:return eC;case 35668:case 35672:return tC;case 35669:case 35673:return nC;case 5125:return iC;case 36294:return rC;case 36295:return sC;case 36296:return oC;case 35678:case 36198:case 36298:case 36306:case 35682:return aC;case 35679:case 36299:case 36307:return cC;case 35680:case 36300:case 36308:case 36293:return lC;case 36289:case 36303:case 36311:case 36292:return uC}}function dC(n,e){n.uniform1fv(this.addr,e)}function fC(n,e){let t=mo(e,this.size,2);n.uniform2fv(this.addr,t)}function pC(n,e){let t=mo(e,this.size,3);n.uniform3fv(this.addr,t)}function mC(n,e){let t=mo(e,this.size,4);n.uniform4fv(this.addr,t)}function gC(n,e){let t=mo(e,this.size,4);n.uniformMatrix2fv(this.addr,!1,t)}function xC(n,e){let t=mo(e,this.size,9);n.uniformMatrix3fv(this.addr,!1,t)}function _C(n,e){let t=mo(e,this.size,16);n.uniformMatrix4fv(this.addr,!1,t)}function vC(n,e){n.uniform1iv(this.addr,e)}function yC(n,e){n.uniform2iv(this.addr,e)}function bC(n,e){n.uniform3iv(this.addr,e)}function SC(n,e){n.uniform4iv(this.addr,e)}function MC(n,e){n.uniform1uiv(this.addr,e)}function wC(n,e){n.uniform2uiv(this.addr,e)}function EC(n,e){n.uniform3uiv(this.addr,e)}function TC(n,e){n.uniform4uiv(this.addr,e)}function AC(n,e,t){let i=this.cache,r=e.length,s=td(t,r);Wt(i,s)||(n.uniform1iv(this.addr,s),Zt(i,s));let o;this.type===n.SAMPLER_2D_SHADOW?o=Kx:o=eM;for(let a=0;a!==r;++a)t.setTexture2D(e[a]||o,s[a])}function RC(n,e,t){let i=this.cache,r=e.length,s=td(t,r);Wt(i,s)||(n.uniform1iv(this.addr,s),Zt(i,s));for(let o=0;o!==r;++o)t.setTexture3D(e[o]||nM,s[o])}function CC(n,e,t){let i=this.cache,r=e.length,s=td(t,r);Wt(i,s)||(n.uniform1iv(this.addr,s),Zt(i,s));for(let o=0;o!==r;++o)t.setTextureCube(e[o]||iM,s[o])}function PC(n,e,t){let i=this.cache,r=e.length,s=td(t,r);Wt(i,s)||(n.uniform1iv(this.addr,s),Zt(i,s));for(let o=0;o!==r;++o)t.setTexture2DArray(e[o]||tM,s[o])}function IC(n){switch(n){case 5126:return dC;case 35664:return fC;case 35665:return pC;case 35666:return mC;case 35674:return gC;case 35675:return xC;case 35676:return _C;case 5124:case 35670:return vC;case 35667:case 35671:return yC;case 35668:case 35672:return bC;case 35669:case 35673:return SC;case 5125:return MC;case 36294:return wC;case 36295:return EC;case 36296:return TC;case 35678:case 36198:case 36298:case 36306:case 35682:return AC;case 35679:case 36299:case 36307:return RC;case 35680:case 36300:case 36308:case 36293:return CC;case 36289:case 36303:case 36311:case 36292:return PC}}var Qx=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.setValue=hC(t.type)}},e_=class{constructor(e,t,i){this.id=e,this.addr=i,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=IC(t.type)}},t_=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,i){let r=this.seq;for(let s=0,o=r.length;s!==o;++s){let a=r[s];a.setValue(e,t[a.id],i)}}},Jx=/(\w+)(\])?(\[|\.)?/g;function BS(n,e){n.seq.push(e),n.map[e.id]=e}function DC(n,e,t){let i=n.name,r=i.length;for(Jx.lastIndex=0;;){let s=Jx.exec(i),o=Jx.lastIndex,a=s[1],c=s[2]==="]",l=s[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===r){BS(t,l===void 0?new Qx(a,n,e):new e_(a,n,e));break}else{let h=t.map[a];h===void 0&&(h=new t_(a),BS(t,h)),t=h}}}var po=class{constructor(e,t){this.seq=[],this.map={};let i=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let o=0;o<i;++o){let a=e.getActiveUniform(t,o),c=e.getUniformLocation(t,a.name);DC(a,c,this)}let r=[],s=[];for(let o of this.seq)o.type===e.SAMPLER_2D_SHADOW||o.type===e.SAMPLER_CUBE_SHADOW||o.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(o):s.push(o);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,i,r){let s=this.map[t];s!==void 0&&s.setValue(e,i,r)}setOptional(e,t,i){let r=t[i];r!==void 0&&this.setValue(e,i,r)}static upload(e,t,i,r){for(let s=0,o=t.length;s!==o;++s){let a=t[s],c=i[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,r)}}static seqWithValue(e,t){let i=[];for(let r=0,s=e.length;r!==s;++r){let o=e[r];o.id in t&&i.push(o)}return i}};function HS(n,e,t){let i=n.createShader(e);return n.shaderSource(i,t),n.compileShader(i),i}var NC=37297,LC=0;function zC(n,e){let t=n.split(`
`),i=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let o=r;o<s;o++){let a=o+1;i.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return i.join(`
`)}var GS=new Qe;function UC(n){ut._getMatrix(GS,ut.workingColorSpace,n);let e=`mat3( ${GS.elements.map(t=>t.toFixed(4))} )`;switch(ut.getTransfer(n)){case ma:return[e,"LinearTransferOETF"];case St:return[e,"sRGBTransferOETF"];default:return Xe("WebGLProgram: Unsupported color space: ",n),[e,"LinearTransferOETF"]}}function VS(n,e,t){let i=n.getShaderParameter(e,n.COMPILE_STATUS),s=(n.getShaderInfoLog(e)||"").trim();if(i&&s==="")return"";let o=/ERROR: 0:(\d+)/.exec(s);if(o){let a=parseInt(o[1]);return t.toUpperCase()+`

`+s+`

`+zC(n.getShaderSource(e),a)}else return s}function OC(n,e){let t=UC(e);return[`vec4 ${n}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}var FC={[wx]:"Linear",[Ex]:"Reinhard",[Tx]:"Cineon",[Ax]:"ACESFilmic",[Cx]:"AgX",[Px]:"Neutral",[Rx]:"Custom"};function kC(n,e){let t=FC[e];return t===void 0?(Xe("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+n+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+n+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var Jh=new I;function BC(){ut.getLuminanceCoefficients(Jh);let n=Jh.x.toFixed(4),e=Jh.y.toFixed(4),t=Jh.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${n}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function HC(n){return[n.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",n.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(tc).join(`
`)}function GC(n){let e=[];for(let t in n){let i=n[t];i!==!1&&e.push("#define "+t+" "+i)}return e.join(`
`)}function VC(n,e){let t={},i=n.getProgramParameter(e,n.ACTIVE_ATTRIBUTES);for(let r=0;r<i;r++){let s=n.getActiveAttrib(e,r),o=s.name,a=1;s.type===n.FLOAT_MAT2&&(a=2),s.type===n.FLOAT_MAT3&&(a=3),s.type===n.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:n.getAttribLocation(e,o),locationSize:a}}return t}function tc(n){return n!==""}function $S(n,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return n.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function WS(n,e){return n.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var $C=/^[ \t]*#include +<([\w\d./]+)>/gm;function n_(n){return n.replace($C,ZC)}var WC=new Map;function ZC(n,e){let t=st[e];if(t===void 0){let i=WC.get(e);if(i!==void 0)t=st[i],Xe('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,i);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">")}return n_(t)}var XC=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function ZS(n){return n.replace(XC,qC)}function qC(n,e,t,i){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=i.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function XS(n){let e=`precision ${n.precision} float;
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
#define LOW_PRECISION`),e}var YC={[Ga]:"SHADOWMAP_TYPE_PCF",[ao]:"SHADOWMAP_TYPE_VSM"};function JC(n){return YC[n.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var jC={[xr]:"ENVMAP_TYPE_CUBE",[Jr]:"ENVMAP_TYPE_CUBE",[Va]:"ENVMAP_TYPE_CUBE_UV"};function KC(n){return n.envMap===!1?"ENVMAP_TYPE_CUBE":jC[n.envMapMode]||"ENVMAP_TYPE_CUBE"}var QC={[Jr]:"ENVMAP_MODE_REFRACTION"};function eP(n){return n.envMap===!1?"ENVMAP_MODE_REFLECTION":QC[n.envMapMode]||"ENVMAP_MODE_REFLECTION"}var tP={[Mx]:"ENVMAP_BLENDING_MULTIPLY",[oS]:"ENVMAP_BLENDING_MIX",[aS]:"ENVMAP_BLENDING_ADD"};function nP(n){return n.envMap===!1?"ENVMAP_BLENDING_NONE":tP[n.combine]||"ENVMAP_BLENDING_NONE"}function iP(n){let e=n.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,i=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:i,maxMip:t}}function rP(n,e,t,i){let r=n.getContext(),s=t.defines,o=t.vertexShader,a=t.fragmentShader,c=JC(t),l=KC(t),u=eP(t),h=nP(t),d=iP(t),f=HC(t),m=GC(s),y=r.createProgram(),g,p,S=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(g=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(tc).join(`
`),g.length>0&&(g+=`
`),p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(tc).join(`
`),p.length>0&&(p+=`
`)):(g=[XS(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(tc).join(`
`),p=[XS(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+h:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Qn?"#define TONE_MAPPING":"",t.toneMapping!==Qn?st.tonemapping_pars_fragment:"",t.toneMapping!==Qn?kC("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",st.colorspace_pars_fragment,OC("linearToOutputTexel",t.outputColorSpace),BC(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(tc).join(`
`)),o=n_(o),o=$S(o,t),o=WS(o,t),a=n_(a),a=$S(a,t),a=WS(a,t),o=ZS(o),a=ZS(a),t.isRawShaderMaterial!==!0&&(S=`#version 300 es
`,g=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+g,p=["#define varying in",t.glslVersion===Fx?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===Fx?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+p);let E=S+g+o,_=S+p+a,M=HS(r,r.VERTEX_SHADER,E),w=HS(r,r.FRAGMENT_SHADER,_);r.attachShader(y,M),r.attachShader(y,w),t.index0AttributeName!==void 0?r.bindAttribLocation(y,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(y,0,"position"),r.linkProgram(y);function C(L){if(n.debug.checkShaderErrors){let F=r.getProgramInfoLog(y)||"",V=r.getShaderInfoLog(M)||"",N=r.getShaderInfoLog(w)||"",B=F.trim(),q=V.trim(),Z=N.trim(),se=!0,X=!0;if(r.getProgramParameter(y,r.LINK_STATUS)===!1)if(se=!1,typeof n.debug.onShaderError=="function")n.debug.onShaderError(r,y,M,w);else{let ee=VS(r,M,"vertex"),re=VS(r,w,"fragment");Je("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(y,r.VALIDATE_STATUS)+`

Material Name: `+L.name+`
Material Type: `+L.type+`

Program Info Log: `+B+`
`+ee+`
`+re)}else B!==""?Xe("WebGLProgram: Program Info Log:",B):(q===""||Z==="")&&(X=!1);X&&(L.diagnostics={runnable:se,programLog:B,vertexShader:{log:q,prefix:g},fragmentShader:{log:Z,prefix:p}})}r.deleteShader(M),r.deleteShader(w),v=new po(r,y),T=VC(r,y)}let v;this.getUniforms=function(){return v===void 0&&C(this),v};let T;this.getAttributes=function(){return T===void 0&&C(this),T};let P=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return P===!1&&(P=r.getProgramParameter(y,NC)),P},this.destroy=function(){i.releaseStatesOfProgram(this),r.deleteProgram(y),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=LC++,this.cacheKey=e,this.usedTimes=1,this.program=y,this.vertexShader=M,this.fragmentShader=w,this}var sP=0,i_=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,i){let r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(i)===!1&&(r.add(i),i.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let i of t)i.usedTimes--,i.usedTimes===0&&this.shaderCache.delete(i.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,i=t.get(e);return i===void 0&&(i=new Set,t.set(e,i)),i}_getShaderStage(e){let t=this.shaderCache,i=t.get(e);return i===void 0&&(i=new r_(e),t.set(e,i)),i}},r_=class{constructor(e){this.id=sP++,this.code=e,this.usedTimes=0}};function oP(n){return n===yr||n===ja||n===Ka}function aP(n,e,t,i,r,s){let o=new _a,a=new i_,c=new Set,l=[],u=new Map,h=i.logarithmicDepthBuffer,d=i.precision,f={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function m(v){return c.add(v),v===0?"uv":`uv${v}`}function y(v,T,P,L,F,V){let N=L.fog,B=F.geometry,q=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?L.environment:null,Z=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap,se=e.get(v.envMap||q,Z),X=se&&se.mapping===Va?se.image.height:null,ee=f[v.type];v.precision!==null&&(d=i.getMaxPrecision(v.precision),d!==v.precision&&Xe("WebGLProgram.getParameters:",v.precision,"not supported, using",d,"instead."));let re=B.morphAttributes.position||B.morphAttributes.normal||B.morphAttributes.color,De=re!==void 0?re.length:0,Re=0;B.morphAttributes.position!==void 0&&(Re=1),B.morphAttributes.normal!==void 0&&(Re=2),B.morphAttributes.color!==void 0&&(Re=3);let ht,nt,dt,Y;if(ee){let Pt=xi[ee];ht=Pt.vertexShader,nt=Pt.fragmentShader}else{ht=v.vertexShader,nt=v.fragmentShader;let Pt=a.getVertexShaderStage(v),vt=a.getFragmentShaderStage(v);a.update(v,Pt,vt),dt=Pt.id,Y=vt.id}let te=n.getRenderTarget(),ye=n.state.buffers.depth.getReversed(),$e=F.isInstancedMesh===!0,Ae=F.isBatchedMesh===!0,qe=!!v.map,ft=!!v.matcap,ne=!!se,le=!!v.aoMap,he=!!v.lightMap,J=!!v.bumpMap&&v.wireframe===!1,ae=!!v.normalMap,Ge=!!v.displacementMap,Fe=!!v.emissiveMap,We=!!v.metalnessMap,je=!!v.roughnessMap,D=v.anisotropy>0,ct=v.clearcoat>0,it=v.dispersion>0,A=v.retroreflectivity>0,x=v.iridescence>0,k=v.sheen>0,$=v.transmission>0,j=D&&!!v.anisotropyMap,pe=ct&&!!v.clearcoatMap,me=ct&&!!v.clearcoatNormalMap,K=ct&&!!v.clearcoatRoughnessMap,ie=x&&!!v.iridescenceMap,ge=x&&!!v.iridescenceThicknessMap,ke=k&&!!v.sheenColorMap,be=k&&!!v.sheenRoughnessMap,xe=!!v.specularMap,Be=!!v.specularColorMap,Ze=!!v.specularIntensityMap,et=$&&!!v.transmissionMap,U=$&&!!v.thicknessMap,_e=!!v.gradientMap,Q=!!v.alphaMap,ve=v.alphaTest>0,Te=!!v.alphaHash,oe=!!v.extensions,He=Qn;v.toneMapped&&(te===null||te.isXRRenderTarget===!0)&&(He=n.toneMapping);let Ue={shaderID:ee,shaderType:v.type,shaderName:v.name,vertexShader:ht,fragmentShader:nt,defines:v.defines,customVertexShaderID:dt,customFragmentShaderID:Y,isRawShaderMaterial:v.isRawShaderMaterial===!0,glslVersion:v.glslVersion,precision:d,batching:Ae,batchingColor:Ae&&F._colorsTexture!==null,instancing:$e,instancingColor:$e&&F.instanceColor!==null,instancingMorph:$e&&F.morphTexture!==null,outputColorSpace:te===null?n.outputColorSpace:te.isXRRenderTarget===!0?te.texture.colorSpace:ut.workingColorSpace,alphaToCoverage:!!v.alphaToCoverage,map:qe,matcap:ft,envMap:ne,envMapMode:ne&&se.mapping,envMapCubeUVHeight:X,aoMap:le,lightMap:he,bumpMap:J,normalMap:ae,displacementMap:Ge,emissiveMap:Fe,normalMapObjectSpace:ae&&v.normalMapType===uS,normalMapTangentSpace:ae&&v.normalMapType===Zh,packedNormalMap:ae&&v.normalMapType===Zh&&oP(v.normalMap.format),metalnessMap:We,roughnessMap:je,anisotropy:D,anisotropyMap:j,clearcoat:ct,clearcoatMap:pe,clearcoatNormalMap:me,clearcoatRoughnessMap:K,dispersion:it,retroreflection:A,iridescence:x,iridescenceMap:ie,iridescenceThicknessMap:ge,sheen:k,sheenColorMap:ke,sheenRoughnessMap:be,specularMap:xe,specularColorMap:Be,specularIntensityMap:Ze,transmission:$,transmissionMap:et,thicknessMap:U,gradientMap:_e,opaque:v.transparent===!1&&v.blending===co&&v.alphaToCoverage===!1,alphaMap:Q,alphaTest:ve,alphaHash:Te,combine:v.combine,mapUv:qe&&m(v.map.channel),aoMapUv:le&&m(v.aoMap.channel),lightMapUv:he&&m(v.lightMap.channel),bumpMapUv:J&&m(v.bumpMap.channel),normalMapUv:ae&&m(v.normalMap.channel),displacementMapUv:Ge&&m(v.displacementMap.channel),emissiveMapUv:Fe&&m(v.emissiveMap.channel),metalnessMapUv:We&&m(v.metalnessMap.channel),roughnessMapUv:je&&m(v.roughnessMap.channel),anisotropyMapUv:j&&m(v.anisotropyMap.channel),clearcoatMapUv:pe&&m(v.clearcoatMap.channel),clearcoatNormalMapUv:me&&m(v.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:K&&m(v.clearcoatRoughnessMap.channel),iridescenceMapUv:ie&&m(v.iridescenceMap.channel),iridescenceThicknessMapUv:ge&&m(v.iridescenceThicknessMap.channel),sheenColorMapUv:ke&&m(v.sheenColorMap.channel),sheenRoughnessMapUv:be&&m(v.sheenRoughnessMap.channel),specularMapUv:xe&&m(v.specularMap.channel),specularColorMapUv:Be&&m(v.specularColorMap.channel),specularIntensityMapUv:Ze&&m(v.specularIntensityMap.channel),transmissionMapUv:et&&m(v.transmissionMap.channel),thicknessMapUv:U&&m(v.thicknessMap.channel),alphaMapUv:Q&&m(v.alphaMap.channel),vertexTangents:!!B.attributes.tangent&&(ae||D),vertexNormals:!!B.attributes.normal,vertexColors:v.vertexColors,vertexAlphas:v.vertexColors===!0&&!!B.attributes.color&&B.attributes.color.itemSize===4,pointsUvs:F.isPoints===!0&&!!B.attributes.uv&&(qe||Q),fog:!!N,useFog:v.fog===!0,fogExp2:!!N&&N.isFogExp2,flatShading:v.wireframe===!1&&(v.flatShading===!0||B.attributes.normal===void 0&&ae===!1&&(v.isMeshLambertMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isMeshPhysicalMaterial)),sizeAttenuation:v.sizeAttenuation===!0,logarithmicDepthBuffer:h,reversedDepthBuffer:ye,skinning:F.isSkinnedMesh===!0,hasPositionAttribute:B.attributes.position!==void 0,morphTargets:B.morphAttributes.position!==void 0,morphNormals:B.morphAttributes.normal!==void 0,morphColors:B.morphAttributes.color!==void 0,morphTargetsCount:De,morphTextureStride:Re,numSunLights:T.sun.length,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numSunLightShadows:T.sunShadowMap.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numLightProbeGrids:V.length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:v.dithering,shadowMapEnabled:n.shadowMap.enabled&&P.length>0,shadowMapType:n.shadowMap.type,toneMapping:He,decodeVideoTexture:qe&&v.map.isVideoTexture===!0&&ut.getTransfer(v.map.colorSpace)===St,decodeVideoTextureEmissive:Fe&&v.emissiveMap.isVideoTexture===!0&&ut.getTransfer(v.emissiveMap.colorSpace)===St,premultipliedAlpha:v.premultipliedAlpha,doubleSided:v.side===Gn,flipSided:v.side===Kt,useDepthPacking:v.depthPacking>=0,depthPacking:v.depthPacking||0,index0AttributeName:v.index0AttributeName,extensionClipCullDistance:oe&&v.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(oe&&v.extensions.multiDraw===!0||Ae)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:v.customProgramCacheKey()};return Ue.vertexUv1s=c.has(1),Ue.vertexUv2s=c.has(2),Ue.vertexUv3s=c.has(3),c.clear(),Ue}function g(v){let T=[];if(v.shaderID?T.push(v.shaderID):(T.push(v.customVertexShaderID),T.push(v.customFragmentShaderID)),v.defines!==void 0)for(let P in v.defines)T.push(P),T.push(v.defines[P]);return v.isRawShaderMaterial===!1&&(p(T,v),S(T,v),T.push(n.outputColorSpace)),T.push(v.customProgramCacheKey),T.join()}function p(v,T){v.push(T.precision),v.push(T.outputColorSpace),v.push(T.envMapMode),v.push(T.envMapCubeUVHeight),v.push(T.mapUv),v.push(T.alphaMapUv),v.push(T.lightMapUv),v.push(T.aoMapUv),v.push(T.bumpMapUv),v.push(T.normalMapUv),v.push(T.displacementMapUv),v.push(T.emissiveMapUv),v.push(T.metalnessMapUv),v.push(T.roughnessMapUv),v.push(T.anisotropyMapUv),v.push(T.clearcoatMapUv),v.push(T.clearcoatNormalMapUv),v.push(T.clearcoatRoughnessMapUv),v.push(T.iridescenceMapUv),v.push(T.iridescenceThicknessMapUv),v.push(T.sheenColorMapUv),v.push(T.sheenRoughnessMapUv),v.push(T.specularMapUv),v.push(T.specularColorMapUv),v.push(T.specularIntensityMapUv),v.push(T.transmissionMapUv),v.push(T.thicknessMapUv),v.push(T.combine),v.push(T.fogExp2),v.push(T.sizeAttenuation),v.push(T.morphTargetsCount),v.push(T.morphAttributeCount),v.push(T.numSunLights),v.push(T.numDirLights),v.push(T.numPointLights),v.push(T.numSpotLights),v.push(T.numSpotLightMaps),v.push(T.numHemiLights),v.push(T.numRectAreaLights),v.push(T.numSunLightShadows),v.push(T.numDirLightShadows),v.push(T.numPointLightShadows),v.push(T.numSpotLightShadows),v.push(T.numSpotLightShadowsWithMaps),v.push(T.numLightProbes),v.push(T.shadowMapType),v.push(T.toneMapping),v.push(T.numClippingPlanes),v.push(T.numClipIntersection),v.push(T.depthPacking)}function S(v,T){o.disableAll(),T.instancing&&o.enable(0),T.instancingColor&&o.enable(1),T.instancingMorph&&o.enable(2),T.matcap&&o.enable(3),T.envMap&&o.enable(4),T.normalMapObjectSpace&&o.enable(5),T.normalMapTangentSpace&&o.enable(6),T.clearcoat&&o.enable(7),T.iridescence&&o.enable(8),T.alphaTest&&o.enable(9),T.vertexColors&&o.enable(10),T.vertexAlphas&&o.enable(11),T.vertexUv1s&&o.enable(12),T.vertexUv2s&&o.enable(13),T.vertexUv3s&&o.enable(14),T.vertexTangents&&o.enable(15),T.anisotropy&&o.enable(16),T.alphaHash&&o.enable(17),T.batching&&o.enable(18),T.dispersion&&o.enable(19),T.retroreflection&&o.enable(24),T.batchingColor&&o.enable(20),T.gradientMap&&o.enable(21),T.packedNormalMap&&o.enable(22),T.vertexNormals&&o.enable(23),v.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.reversedDepthBuffer&&o.enable(4),T.skinning&&o.enable(5),T.morphTargets&&o.enable(6),T.morphNormals&&o.enable(7),T.morphColors&&o.enable(8),T.premultipliedAlpha&&o.enable(9),T.shadowMapEnabled&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.decodeVideoTextureEmissive&&o.enable(20),T.alphaToCoverage&&o.enable(21),T.numLightProbeGrids>0&&o.enable(22),T.hasPositionAttribute&&o.enable(23),v.push(o.mask)}function E(v){let T=f[v.type],P;if(T){let L=xi[T];P=RS.clone(L.uniforms)}else P=v.uniforms;return P}function _(v,T){let P=u.get(T);return P!==void 0?++P.usedTimes:(P=new rP(n,T,v,r),l.push(P),u.set(T,P)),P}function M(v){if(--v.usedTimes===0){let T=l.indexOf(v);l[T]=l[l.length-1],l.pop(),u.delete(v.cacheKey),v.destroy()}}function w(v){a.remove(v)}function C(){a.dispose()}return{getParameters:y,getProgramCacheKey:g,getUniforms:E,acquireProgram:_,releaseProgram:M,releaseShaderCache:w,programs:l,dispose:C}}function cP(){let n=new WeakMap;function e(o){return n.has(o)}function t(o){let a=n.get(o);return a===void 0&&(a={},n.set(o,a)),a}function i(o){n.delete(o)}function r(o,a,c){n.get(o)[a]=c}function s(){n=new WeakMap}return{has:e,get:t,remove:i,update:r,dispose:s}}function lP(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.material.id!==e.material.id?n.material.id-e.material.id:n.materialVariant!==e.materialVariant?n.materialVariant-e.materialVariant:n.z!==e.z?n.z-e.z:n.id-e.id}function qS(n,e){return n.groupOrder!==e.groupOrder?n.groupOrder-e.groupOrder:n.renderOrder!==e.renderOrder?n.renderOrder-e.renderOrder:n.z!==e.z?e.z-n.z:n.id-e.id}function YS(){let n=[],e=0,t=[],i=[],r=[];function s(){e=0,t.length=0,i.length=0,r.length=0}function o(d){let f=0;return d.isInstancedMesh&&(f+=2),d.isSkinnedMesh&&(f+=1),f}function a(d,f,m,y,g,p){let S=n[e];return S===void 0?(S={id:d.id,object:d,geometry:f,material:m,materialVariant:o(d),groupOrder:y,renderOrder:d.renderOrder,z:g,group:p},n[e]=S):(S.id=d.id,S.object=d,S.geometry=f,S.material=m,S.materialVariant=o(d),S.groupOrder=y,S.renderOrder=d.renderOrder,S.z=g,S.group=p),e++,S}function c(d,f,m,y,g,p,S){S.reversedDepth===!0&&(g=-g);let E=a(d,f,m,y,g,p);m.transmission>0?i.push(E):m.transparent===!0?r.push(E):t.push(E)}function l(d,f,m,y,g,p){let S=a(d,f,m,y,g,p);m.transmission>0?i.unshift(S):m.transparent===!0?r.unshift(S):t.unshift(S)}function u(d,f){t.length>1&&t.sort(d||lP),i.length>1&&i.sort(f||qS),r.length>1&&r.sort(f||qS)}function h(){for(let d=e,f=n.length;d<f;d++){let m=n[d];if(m.id===null)break;m.id=null,m.object=null,m.geometry=null,m.material=null,m.group=null}}return{opaque:t,transmissive:i,transparent:r,init:s,push:c,unshift:l,finish:h,sort:u}}function uP(){let n=new WeakMap;function e(i,r){let s=n.get(i),o;return s===void 0?(o=new YS,n.set(i,[o])):r>=s.length?(o=new YS,s.push(o)):o=s[r],o}function t(){n=new WeakMap}return{get:e,dispose:t}}function hP(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new I,color:new Pe};break;case"SpotLight":t={position:new I,direction:new I,color:new Pe,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new I,color:new Pe,distance:0,decay:0};break;case"HemisphereLight":t={direction:new I,skyColor:new Pe,groundColor:new Pe};break;case"RectAreaLight":t={color:new Pe,position:new I,halfWidth:new I,halfHeight:new I};break}return n[e.id]=t,t}}}function dP(){let n={};return{get:function(e){if(n[e.id]!==void 0)return n[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new fe,shadowCameraNear:1,shadowCameraFar:1e3};break}return n[e.id]=t,t}}}var fP=0;function pP(n,e){return(e.castShadow?2:0)-(n.castShadow?2:0)+(e.map?1:0)-(n.map?1:0)}function mP(n){let e=new hP,t=dP(),i={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)i.probe.push(new I);let r=new I,s=new mt,o=new mt;function a(l){let u=0,h=0,d=0;for(let F=0;F<9;F++)i.probe[F].set(0,0,0);let f=0,m=0,y=0,g=0,p=0,S=0,E=0,_=0,M=0,w=0,C=0,v=0,T=0,P=0;l.sort(pP);for(let F=0,V=l.length;F<V;F++){let N=l[F],B=N.color,q=N.intensity,Z=N.distance,se=null;if(N.shadow&&N.shadow.map&&(N.shadow.map.texture.format===yr?se=N.shadow.map.texture:se=N.shadow.map.depthTexture||N.shadow.map.texture),N.isAmbientLight)u+=B.r*q,h+=B.g*q,d+=B.b*q;else if(N.isLightProbe){for(let X=0;X<9;X++)i.probe[X].addScaledVector(N.sh.coefficients[X],q);P++}else if(N.isSunLight){let X=e.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let ee=N.shadow,re=t.get(N);re.shadowIntensity=ee.intensity,re.shadowBias=ee.bias,re.shadowNormalBias=ee.normalBias,re.shadowRadius=ee.radius,re.shadowMapSize.copy(ee.mapSize).multiply(ee.getFrameExtents()),i.sunShadow[m]=re,i.sunShadowMap[m]=se;let De=ee.getViewportCount();for(let Re=0;Re<De;Re++)i.sunShadowMatrix[y+Re]=ee.getMatrix(Re),i.sunShadowCascade[y+Re]=ee._cascadeData[Re];y+=De,m++}i.sun[f]=X,f++}else if(N.isDirectionalLight){let X=e.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),N.castShadow){let ee=N.shadow,re=t.get(N);re.shadowIntensity=ee.intensity,re.shadowBias=ee.bias,re.shadowNormalBias=ee.normalBias,re.shadowRadius=ee.radius,re.shadowMapSize=ee.mapSize,i.directionalShadow[g]=re,i.directionalShadowMap[g]=se,i.directionalShadowMatrix[g]=N.shadow.matrix,M++}i.directional[g]=X,g++}else if(N.isSpotLight){let X=e.get(N);X.position.setFromMatrixPosition(N.matrixWorld),X.color.copy(B).multiplyScalar(q),X.distance=Z,X.coneCos=Math.cos(N.angle),X.penumbraCos=Math.cos(N.angle*(1-N.penumbra)),X.decay=N.decay,i.spot[S]=X;let ee=N.shadow;if(N.map&&(i.spotLightMap[v]=N.map,v++,ee.updateMatrices(N),N.castShadow&&T++),i.spotLightMatrix[S]=ee.matrix,N.castShadow){let re=t.get(N);re.shadowIntensity=ee.intensity,re.shadowBias=ee.bias,re.shadowNormalBias=ee.normalBias,re.shadowRadius=ee.radius,re.shadowMapSize=ee.mapSize,i.spotShadow[S]=re,i.spotShadowMap[S]=se,C++}S++}else if(N.isRectAreaLight){let X=e.get(N);X.color.copy(B).multiplyScalar(q),X.halfWidth.set(N.width*.5,0,0),X.halfHeight.set(0,N.height*.5,0),i.rectArea[E]=X,E++}else if(N.isPointLight){let X=e.get(N);if(X.color.copy(N.color).multiplyScalar(N.intensity),X.distance=N.distance,X.decay=N.decay,N.castShadow){let ee=N.shadow,re=t.get(N);re.shadowIntensity=ee.intensity,re.shadowBias=ee.bias,re.shadowNormalBias=ee.normalBias,re.shadowRadius=ee.radius,re.shadowMapSize=ee.mapSize,re.shadowCameraNear=ee.camera.near,re.shadowCameraFar=ee.camera.far,i.pointShadow[p]=re,i.pointShadowMap[p]=se,i.pointShadowMatrix[p]=N.shadow.matrix,w++}i.point[p]=X,p++}else if(N.isHemisphereLight){let X=e.get(N);X.skyColor.copy(N.color).multiplyScalar(q),X.groundColor.copy(N.groundColor).multiplyScalar(q),i.hemi[_]=X,_++}}E>0&&(n.has("OES_texture_float_linear")===!0?(i.rectAreaLTC1=Me.LTC_FLOAT_1,i.rectAreaLTC2=Me.LTC_FLOAT_2):(i.rectAreaLTC1=Me.LTC_HALF_1,i.rectAreaLTC2=Me.LTC_HALF_2)),i.ambient[0]=u,i.ambient[1]=h,i.ambient[2]=d;let L=i.hash;(L.sunLength!==f||L.directionalLength!==g||L.pointLength!==p||L.spotLength!==S||L.rectAreaLength!==E||L.hemiLength!==_||L.numSunShadows!==m||L.numDirectionalShadows!==M||L.numPointShadows!==w||L.numSpotShadows!==C||L.numSpotMaps!==v||L.numLightProbes!==P)&&(i.sun.length=f,i.directional.length=g,i.spot.length=S,i.rectArea.length=E,i.point.length=p,i.hemi.length=_,i.sunShadow.length=m,i.sunShadowMap.length=m,i.sunShadowMatrix.length=y,i.sunShadowCascade.length=y,i.directionalShadow.length=M,i.directionalShadowMap.length=M,i.directionalShadowMatrix.length=M,i.pointShadow.length=w,i.pointShadowMap.length=w,i.pointShadowMatrix.length=w,i.spotShadow.length=C,i.spotShadowMap.length=C,i.spotLightMatrix.length=C+v-T,i.spotLightMap.length=v,i.numSpotLightShadowsWithMaps=T,i.numLightProbes=P,L.sunLength=f,L.directionalLength=g,L.pointLength=p,L.spotLength=S,L.rectAreaLength=E,L.hemiLength=_,L.numSunShadows=m,L.numDirectionalShadows=M,L.numPointShadows=w,L.numSpotShadows=C,L.numSpotMaps=v,L.numLightProbes=P,i.version=fP++)}function c(l,u){let h=0,d=0,f=0,m=0,y=0,g=0,p=u.matrixWorldInverse;for(let S=0,E=l.length;S<E;S++){let _=l[S];if(_.isSunLight){let M=i.sun[h];M.direction.setFromMatrixPosition(_.matrixWorld),M.direction.transformDirection(p),h++}else if(_.isDirectionalLight){let M=i.directional[d];M.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),d++}else if(_.isSpotLight){let M=i.spot[m];M.position.setFromMatrixPosition(_.matrixWorld),M.position.applyMatrix4(p),M.direction.setFromMatrixPosition(_.matrixWorld),r.setFromMatrixPosition(_.target.matrixWorld),M.direction.sub(r),M.direction.transformDirection(p),m++}else if(_.isRectAreaLight){let M=i.rectArea[y];M.position.setFromMatrixPosition(_.matrixWorld),M.position.applyMatrix4(p),o.identity(),s.copy(_.matrixWorld),s.premultiply(p),o.extractRotation(s),M.halfWidth.set(_.width*.5,0,0),M.halfHeight.set(0,_.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),y++}else if(_.isPointLight){let M=i.point[f];M.position.setFromMatrixPosition(_.matrixWorld),M.position.applyMatrix4(p),f++}else if(_.isHemisphereLight){let M=i.hemi[g];M.direction.setFromMatrixPosition(_.matrixWorld),M.direction.transformDirection(p),g++}}}return{setup:a,setupView:c,state:i}}function JS(n){let e=new mP(n),t=[],i=[],r=[];function s(d){h.camera=d,t.length=0,i.length=0,r.length=0}function o(d){t.push(d)}function a(d){i.push(d)}function c(d){r.push(d)}function l(){e.setup(t)}function u(d){e.setupView(t,d)}let h={lightsArray:t,shadowsArray:i,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:h,setupLights:l,setupLightsView:u,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function gP(n){let e=new WeakMap;function t(r,s=0){let o=e.get(r),a;return o===void 0?(a=new JS(n),e.set(r,[a])):s>=o.length?(a=new JS(n),o.push(a)):a=o[s],a}function i(){e=new WeakMap}return{get:t,dispose:i}}var xP=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,_P=`uniform sampler2D shadow_pass;
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
}`,vP=[new I(1,0,0),new I(-1,0,0),new I(0,1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1)],yP=[new I(0,-1,0),new I(0,-1,0),new I(0,0,1),new I(0,0,-1),new I(0,-1,0),new I(0,-1,0)],jS=new mt,ec=new I,jx=new I;function bP(n,e,t){let i=new Di,r=new fe,s=new fe,o=new zt,a=new Xu,c=new qu,l={},u=t.maxTextureSize,h={[gr]:Kt,[Kt]:gr,[Gn]:Gn},d=new cn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new fe},radius:{value:4}},vertexShader:xP,fragmentShader:_P}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Ht;m.setAttribute("position",new $t(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let y=new Ve(m,d),g=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ga;let p=this.type;this.render=function(w,C,v){if(g.enabled===!1||g.autoUpdate===!1&&g.needsUpdate===!1||w.length===0)return;this.type===Hb&&(Xe("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ga);let T=n.getRenderTarget(),P=n.getActiveCubeFace(),L=n.getActiveMipmapLevel(),F=n.state;F.setBlending(mi),F.buffers.depth.getReversed()===!0?F.buffers.color.setClear(0,0,0,0):F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);let V=p!==this.type;V&&C.traverse(function(N){N.material&&(Array.isArray(N.material)?N.material.forEach(B=>B.needsUpdate=!0):N.material.needsUpdate=!0)});for(let N=0,B=w.length;N<B;N++){let q=w[N],Z=q.shadow;if(Z===void 0){Xe("WebGLShadowMap:",q,"has no shadow.");continue}if(Z.autoUpdate===!1&&Z.needsUpdate===!1)continue;r.copy(Z.mapSize);let se=Z.getFrameExtents();r.multiply(se),s.copy(Z.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/se.x),r.x=s.x*se.x,Z.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/se.y),r.y=s.y*se.y,Z.mapSize.y=s.y));let X=n.state.buffers.depth.getReversed();if(Z.camera._reversedDepth=X,Z.map===null||V===!0){if(Z.map!==null&&(Z.map.depthTexture!==null&&(Z.map.depthTexture.dispose(),Z.map.depthTexture=null),Z.map.dispose()),this.type===ao){if(q.isPointLight){Xe("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}Z.map=new on(r.x,r.y,{format:yr,type:ei,minFilter:jt,magFilter:jt,generateMipmaps:!1}),Z.map.texture.name=q.name+".shadowMap",Z.map.depthTexture=new lr(r.x,r.y,Nn),Z.map.depthTexture.name=q.name+".shadowMapDepth",Z.map.depthTexture.format=fi,Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=Lt,Z.map.depthTexture.magFilter=Lt}else q.isPointLight?(Z.map=new Kh(r.x),Z.map.depthTexture=new ku(r.x,Vn)):(Z.map=new on(r.x,r.y),Z.map.depthTexture=new lr(r.x,r.y,Vn)),Z.map.depthTexture.name=q.name+".shadowMap",Z.map.depthTexture.format=fi,this.type===Ga?(Z.map.depthTexture.compareFunction=X?qh:Xh,Z.map.depthTexture.minFilter=jt,Z.map.depthTexture.magFilter=jt):(Z.map.depthTexture.compareFunction=null,Z.map.depthTexture.minFilter=Lt,Z.map.depthTexture.magFilter=Lt);Z.camera.updateProjectionMatrix()}Z.map.isWebGLCubeRenderTarget!==!0&&(Z.map.width!==r.x||Z.map.height!==r.y)&&Z.map.setSize(r.x,r.y);let ee=Z.map.isWebGLCubeRenderTarget?6:Z.getViewportCount();q.isPointLight!==!0&&Z.updateMatrices(q,v);for(let re=0;re<ee;re++){let De=Z.getCamera(re);if(q.isPointLight){let Re=Z.camera,ht=Z.matrix,nt=q.distance||Re.far;nt!==Re.far&&(Re.far=nt,Re.updateProjectionMatrix()),ec.setFromMatrixPosition(q.matrixWorld),Re.position.copy(ec),jx.copy(Re.position),jx.add(vP[re]),Re.up.copy(yP[re]),Re.lookAt(jx),Re.updateMatrixWorld(),ht.makeTranslation(-ec.x,-ec.y,-ec.z),jS.multiplyMatrices(Re.projectionMatrix,Re.matrixWorldInverse),Z._frustum.setFromProjectionMatrix(jS,Re.coordinateSystem,Re.reversedDepth)}if(Z.map.isWebGLCubeRenderTarget)n.setRenderTarget(Z.map,re),n.clear();else{re===0&&(n.setRenderTarget(Z.map),n.clear());let Re=Z.getViewport(re);o.set(s.x*Re.x,s.y*Re.y,s.x*Re.z,s.y*Re.w),F.viewport(o)}i=Z.getFrustum(re),_(C,v,De,q,this.type)}Z.isPointLightShadow!==!0&&this.type===ao&&S(Z,v),Z.needsUpdate=!1}p=this.type,g.needsUpdate=!1,n.setRenderTarget(T,P,L)};function S(w,C){let v=e.update(y);d.defines.VSM_SAMPLES!==w.blurSamples&&(d.defines.VSM_SAMPLES=w.blurSamples,f.defines.VSM_SAMPLES=w.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),w.mapPass===null?w.mapPass=new on(r.x,r.y,{format:yr,type:ei}):(w.mapPass.width!==w.map.width||w.mapPass.height!==w.map.height)&&w.mapPass.setSize(w.map.width,w.map.height),d.uniforms.shadow_pass.value=w.map.depthTexture,d.uniforms.resolution.value.set(w.map.width,w.map.height),d.uniforms.radius.value=w.radius,n.setRenderTarget(w.mapPass),n.clear(),n.renderBufferDirect(C,null,v,d,y,null),f.uniforms.shadow_pass.value=w.mapPass.texture,f.uniforms.resolution.value.set(w.map.width,w.map.height),f.uniforms.radius.value=w.radius,n.setRenderTarget(w.map),n.clear(),n.renderBufferDirect(C,null,v,f,y,null)}function E(w,C,v,T){let P=null,L=v.isPointLight===!0?w.customDistanceMaterial:w.customDepthMaterial;if(L!==void 0)P=L;else if(P=v.isPointLight===!0?c:a,n.localClippingEnabled&&C.clipShadows===!0&&Array.isArray(C.clippingPlanes)&&C.clippingPlanes.length!==0||C.displacementMap&&C.displacementScale!==0||C.alphaMap&&C.alphaTest>0||C.map&&C.alphaTest>0||C.alphaToCoverage===!0){let F=P.uuid,V=C.uuid,N=l[F];N===void 0&&(N={},l[F]=N);let B=N[V];B===void 0&&(B=P.clone(),N[V]=B,C.addEventListener("dispose",M)),P=B}if(P.visible=C.visible,P.wireframe=C.wireframe,T===ao?P.side=C.shadowSide!==null?C.shadowSide:C.side:P.side=C.shadowSide!==null?C.shadowSide:h[C.side],P.alphaMap=C.alphaMap,P.alphaTest=C.alphaToCoverage===!0?.5:C.alphaTest,P.map=C.map,P.clipShadows=C.clipShadows,P.clippingPlanes=C.clippingPlanes,P.clipIntersection=C.clipIntersection,P.displacementMap=C.displacementMap,P.displacementScale=C.displacementScale,P.displacementBias=C.displacementBias,P.wireframeLinewidth=C.wireframeLinewidth,P.linewidth=C.linewidth,v.isPointLight===!0&&P.isMeshDistanceMaterial===!0){let F=n.properties.get(P);F.light=v}return P}function _(w,C,v,T,P){if(w.visible===!1)return;if(w.layers.test(C.layers)&&(w.isMesh||w.isLine||w.isPoints)&&(w.castShadow||w.receiveShadow&&P===ao)&&(!w.frustumCulled||w.intersectsFrustum(i))){w.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,w.matrixWorld);let V=e.update(w),N=w.material;if(Array.isArray(N)){let B=V.groups;for(let q=0,Z=B.length;q<Z;q++){let se=B[q],X=N[se.materialIndex];if(X&&X.visible){let ee=E(w,X,T,P);w.onBeforeShadow(n,w,C,v,V,ee,se),n.renderBufferDirect(v,null,V,ee,w,se),w.onAfterShadow(n,w,C,v,V,ee,se)}}}else if(N.visible){let B=E(w,N,T,P);w.onBeforeShadow(n,w,C,v,V,B,null),n.renderBufferDirect(v,null,V,B,w,null),w.onAfterShadow(n,w,C,v,V,B,null)}}let F=w.children;for(let V=0,N=F.length;V<N;V++)_(F[V],C,v,T,P)}function M(w){w.target.removeEventListener("dispose",M);for(let v in l){let T=l[v],P=w.target.uuid;P in T&&(T[P].dispose(),delete T[P])}}}function SP(n,e){function t(){let U=!1,_e=new zt,Q=null,ve=new zt(0,0,0,0);return{setMask:function(Te){Q!==Te&&!U&&(n.colorMask(Te,Te,Te,Te),Q=Te)},setLocked:function(Te){U=Te},setClear:function(Te,oe,He,Ue,Pt){Pt===!0&&(Te*=Ue,oe*=Ue,He*=Ue),_e.set(Te,oe,He,Ue),ve.equals(_e)===!1&&(n.clearColor(Te,oe,He,Ue),ve.copy(_e))},reset:function(){U=!1,Q=null,ve.set(-1,0,0,0)}}}function i(){let U=!1,_e=!1,Q=null,ve=null,Te=null;return{setReversed:function(oe){if(_e!==oe){let He=e.get("EXT_clip_control");oe?He.clipControlEXT(He.LOWER_LEFT_EXT,He.ZERO_TO_ONE_EXT):He.clipControlEXT(He.LOWER_LEFT_EXT,He.NEGATIVE_ONE_TO_ONE_EXT),_e=oe;let Ue=Te;Te=null,this.setClear(Ue)}},getReversed:function(){return _e},setTest:function(oe){oe?te(n.DEPTH_TEST):ye(n.DEPTH_TEST)},setMask:function(oe){Q!==oe&&!U&&(n.depthMask(oe),Q=oe)},setFunc:function(oe){if(_e&&(oe=SS[oe]),ve!==oe){switch(oe){case wu:n.depthFunc(n.NEVER);break;case Eu:n.depthFunc(n.ALWAYS);break;case Tu:n.depthFunc(n.LESS);break;case js:n.depthFunc(n.LEQUAL);break;case Au:n.depthFunc(n.EQUAL);break;case Ru:n.depthFunc(n.GEQUAL);break;case Cu:n.depthFunc(n.GREATER);break;case Pu:n.depthFunc(n.NOTEQUAL);break;default:n.depthFunc(n.LEQUAL)}ve=oe}},setLocked:function(oe){U=oe},setClear:function(oe){Te!==oe&&(Te=oe,_e&&(oe=1-oe),n.clearDepth(oe))},reset:function(){U=!1,Q=null,ve=null,Te=null,_e=!1}}}function r(){let U=!1,_e=null,Q=null,ve=null,Te=null,oe=null,He=null,Ue=null,Pt=null;return{setTest:function(vt){U||(vt?te(n.STENCIL_TEST):ye(n.STENCIL_TEST))},setMask:function(vt){_e!==vt&&!U&&(n.stencilMask(vt),_e=vt)},setFunc:function(vt,Wn,ni){(Q!==vt||ve!==Wn||Te!==ni)&&(n.stencilFunc(vt,Wn,ni),Q=vt,ve=Wn,Te=ni)},setOp:function(vt,Wn,ni){(oe!==vt||He!==Wn||Ue!==ni)&&(n.stencilOp(vt,Wn,ni),oe=vt,He=Wn,Ue=ni)},setLocked:function(vt){U=vt},setClear:function(vt){Pt!==vt&&(n.clearStencil(vt),Pt=vt)},reset:function(){U=!1,_e=null,Q=null,ve=null,Te=null,oe=null,He=null,Ue=null,Pt=null}}}let s=new t,o=new i,a=new r,c=new WeakMap,l=new WeakMap,u={},h={},d={},f=new WeakMap,m=[],y=null,g=!1,p=null,S=null,E=null,_=null,M=null,w=null,C=null,v=new Pe(0,0,0),T=0,P=!1,L=null,F=null,V=null,N=null,B=null,q=n.getParameter(n.MAX_COMBINED_TEXTURE_IMAGE_UNITS),Z=!1,se=0,X=n.getParameter(n.VERSION);X.indexOf("WebGL")!==-1?(se=parseFloat(/^WebGL (\d)/.exec(X)[1]),Z=se>=1):X.indexOf("OpenGL ES")!==-1&&(se=parseFloat(/^OpenGL ES (\d)/.exec(X)[1]),Z=se>=2);let ee=null,re={},De=n.getParameter(n.SCISSOR_BOX),Re=n.getParameter(n.VIEWPORT),ht=new zt().fromArray(De),nt=new zt().fromArray(Re);function dt(U,_e,Q,ve){let Te=new Uint8Array(4),oe=n.createTexture();n.bindTexture(U,oe),n.texParameteri(U,n.TEXTURE_MIN_FILTER,n.NEAREST),n.texParameteri(U,n.TEXTURE_MAG_FILTER,n.NEAREST);for(let He=0;He<Q;He++)U===n.TEXTURE_3D||U===n.TEXTURE_2D_ARRAY?n.texImage3D(_e,0,n.RGBA,1,1,ve,0,n.RGBA,n.UNSIGNED_BYTE,Te):n.texImage2D(_e+He,0,n.RGBA,1,1,0,n.RGBA,n.UNSIGNED_BYTE,Te);return oe}let Y={};Y[n.TEXTURE_2D]=dt(n.TEXTURE_2D,n.TEXTURE_2D,1),Y[n.TEXTURE_CUBE_MAP]=dt(n.TEXTURE_CUBE_MAP,n.TEXTURE_CUBE_MAP_POSITIVE_X,6),Y[n.TEXTURE_2D_ARRAY]=dt(n.TEXTURE_2D_ARRAY,n.TEXTURE_2D_ARRAY,1,1),Y[n.TEXTURE_3D]=dt(n.TEXTURE_3D,n.TEXTURE_3D,1,1),s.setClear(0,0,0,1),o.setClear(1),a.setClear(0),te(n.DEPTH_TEST),o.setFunc(js),J(!1),ae(xx),te(n.CULL_FACE),le(mi);function te(U){u[U]!==!0&&(n.enable(U),u[U]=!0)}function ye(U){u[U]!==!1&&(n.disable(U),u[U]=!1)}function $e(U,_e){return d[U]!==_e?(n.bindFramebuffer(U,_e),d[U]=_e,U===n.DRAW_FRAMEBUFFER&&(d[n.FRAMEBUFFER]=_e),U===n.FRAMEBUFFER&&(d[n.DRAW_FRAMEBUFFER]=_e),!0):!1}function Ae(U,_e){let Q=m,ve=!1;if(U){Q=f.get(_e),Q===void 0&&(Q=[],f.set(_e,Q));let Te=U.textures;if(Q.length!==Te.length||Q[0]!==n.COLOR_ATTACHMENT0){for(let oe=0,He=Te.length;oe<He;oe++)Q[oe]=n.COLOR_ATTACHMENT0+oe;Q.length=Te.length,ve=!0}}else Q[0]!==n.BACK&&(Q[0]=n.BACK,ve=!0);ve&&n.drawBuffers(Q)}function qe(U){return y!==U?(n.useProgram(U),y=U,!0):!1}let ft={[Yr]:n.FUNC_ADD,[Vb]:n.FUNC_SUBTRACT,[$b]:n.FUNC_REVERSE_SUBTRACT};ft[Wb]=n.MIN,ft[Zb]=n.MAX;let ne={[Xb]:n.ZERO,[qb]:n.ONE,[Yb]:n.SRC_COLOR,[bx]:n.SRC_ALPHA,[tS]:n.SRC_ALPHA_SATURATE,[Qb]:n.DST_COLOR,[jb]:n.DST_ALPHA,[Jb]:n.ONE_MINUS_SRC_COLOR,[Sx]:n.ONE_MINUS_SRC_ALPHA,[eS]:n.ONE_MINUS_DST_COLOR,[Kb]:n.ONE_MINUS_DST_ALPHA,[nS]:n.CONSTANT_COLOR,[iS]:n.ONE_MINUS_CONSTANT_COLOR,[rS]:n.CONSTANT_ALPHA,[sS]:n.ONE_MINUS_CONSTANT_ALPHA};function le(U,_e,Q,ve,Te,oe,He,Ue,Pt,vt){if(U===mi){g===!0&&(ye(n.BLEND),g=!1);return}if(g===!1&&(te(n.BLEND),g=!0),U!==Gb){if(U!==p||vt!==P){if((S!==Yr||M!==Yr)&&(n.blendEquation(n.FUNC_ADD),S=Yr,M=Yr),vt)switch(U){case co:n.blendFuncSeparate(n.ONE,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case _x:n.blendFunc(n.ONE,n.ONE);break;case vx:n.blendFuncSeparate(n.ZERO,n.ONE_MINUS_SRC_COLOR,n.ZERO,n.ONE);break;case yx:n.blendFuncSeparate(n.DST_COLOR,n.ONE_MINUS_SRC_ALPHA,n.ZERO,n.ONE);break;default:Je("WebGLState: Invalid blending: ",U);break}else switch(U){case co:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE_MINUS_SRC_ALPHA,n.ONE,n.ONE_MINUS_SRC_ALPHA);break;case _x:n.blendFuncSeparate(n.SRC_ALPHA,n.ONE,n.ONE,n.ONE);break;case vx:Je("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case yx:Je("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:Je("WebGLState: Invalid blending: ",U);break}E=null,_=null,w=null,C=null,v.set(0,0,0),T=0,p=U,P=vt}return}Te=Te||_e,oe=oe||Q,He=He||ve,(_e!==S||Te!==M)&&(n.blendEquationSeparate(ft[_e],ft[Te]),S=_e,M=Te),(Q!==E||ve!==_||oe!==w||He!==C)&&(n.blendFuncSeparate(ne[Q],ne[ve],ne[oe],ne[He]),E=Q,_=ve,w=oe,C=He),(Ue.equals(v)===!1||Pt!==T)&&(n.blendColor(Ue.r,Ue.g,Ue.b,Pt),v.copy(Ue),T=Pt),p=U,P=!1}function he(U,_e){U.side===Gn?ye(n.CULL_FACE):te(n.CULL_FACE);let Q=U.side===Kt;_e&&(Q=!Q),J(Q),U.blending===co&&U.transparent===!1?le(mi):le(U.blending,U.blendEquation,U.blendSrc,U.blendDst,U.blendEquationAlpha,U.blendSrcAlpha,U.blendDstAlpha,U.blendColor,U.blendAlpha,U.premultipliedAlpha),o.setFunc(U.depthFunc),o.setTest(U.depthTest),o.setMask(U.depthWrite),s.setMask(U.colorWrite);let ve=U.stencilWrite;a.setTest(ve),ve&&(a.setMask(U.stencilWriteMask),a.setFunc(U.stencilFunc,U.stencilRef,U.stencilFuncMask),a.setOp(U.stencilFail,U.stencilZFail,U.stencilZPass)),Fe(U.polygonOffset,U.polygonOffsetFactor,U.polygonOffsetUnits),U.alphaToCoverage===!0?te(n.SAMPLE_ALPHA_TO_COVERAGE):ye(n.SAMPLE_ALPHA_TO_COVERAGE)}function J(U){L!==U&&(U?n.frontFace(n.CW):n.frontFace(n.CCW),L=U)}function ae(U){U!==kb?(te(n.CULL_FACE),U!==F&&(U===xx?n.cullFace(n.BACK):U===Bb?n.cullFace(n.FRONT):n.cullFace(n.FRONT_AND_BACK))):ye(n.CULL_FACE),F=U}function Ge(U){U!==V&&(Z&&n.lineWidth(U),V=U)}function Fe(U,_e,Q){U?(te(n.POLYGON_OFFSET_FILL),(N!==_e||B!==Q)&&(N=_e,B=Q,o.getReversed()&&(_e=-_e),n.polygonOffset(_e,Q))):ye(n.POLYGON_OFFSET_FILL)}function We(U){U?te(n.SCISSOR_TEST):ye(n.SCISSOR_TEST)}function je(U){U===void 0&&(U=n.TEXTURE0+q-1),ee!==U&&(n.activeTexture(U),ee=U)}function D(U,_e,Q){Q===void 0&&(ee===null?Q=n.TEXTURE0+q-1:Q=ee);let ve=re[Q];ve===void 0&&(ve={type:void 0,texture:void 0},re[Q]=ve),(ve.type!==U||ve.texture!==_e)&&(ee!==Q&&(n.activeTexture(Q),ee=Q),n.bindTexture(U,_e||Y[U]),ve.type=U,ve.texture=_e)}function ct(){let U=re[ee];U!==void 0&&U.type!==void 0&&(n.bindTexture(U.type,null),U.type=void 0,U.texture=void 0)}function it(){try{n.compressedTexImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function A(){try{n.compressedTexImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function x(){try{n.texSubImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function k(){try{n.texSubImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function $(){try{n.compressedTexSubImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function j(){try{n.compressedTexSubImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function pe(){try{n.texStorage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function me(){try{n.texStorage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function K(){try{n.texImage2D(...arguments)}catch(U){Je("WebGLState:",U)}}function ie(){try{n.texImage3D(...arguments)}catch(U){Je("WebGLState:",U)}}function ge(U){return h[U]!==void 0?h[U]:n.getParameter(U)}function ke(U,_e){h[U]!==_e&&(n.pixelStorei(U,_e),h[U]=_e)}function be(U){ht.equals(U)===!1&&(n.scissor(U.x,U.y,U.z,U.w),ht.copy(U))}function xe(U){nt.equals(U)===!1&&(n.viewport(U.x,U.y,U.z,U.w),nt.copy(U))}function Be(U,_e){let Q=l.get(_e);Q===void 0&&(Q=new WeakMap,l.set(_e,Q));let ve=Q.get(U);ve===void 0&&(ve=n.getUniformBlockIndex(_e,U.name),Q.set(U,ve))}function Ze(U,_e){let ve=l.get(_e).get(U);c.get(_e)!==ve&&(n.uniformBlockBinding(_e,ve,U.__bindingPointIndex),c.set(_e,ve))}function et(){n.disable(n.BLEND),n.disable(n.CULL_FACE),n.disable(n.DEPTH_TEST),n.disable(n.POLYGON_OFFSET_FILL),n.disable(n.SCISSOR_TEST),n.disable(n.STENCIL_TEST),n.disable(n.SAMPLE_ALPHA_TO_COVERAGE),n.blendEquation(n.FUNC_ADD),n.blendFunc(n.ONE,n.ZERO),n.blendFuncSeparate(n.ONE,n.ZERO,n.ONE,n.ZERO),n.blendColor(0,0,0,0),n.colorMask(!0,!0,!0,!0),n.clearColor(0,0,0,0),n.depthMask(!0),n.depthFunc(n.LESS),o.setReversed(!1),n.clearDepth(1),n.stencilMask(4294967295),n.stencilFunc(n.ALWAYS,0,4294967295),n.stencilOp(n.KEEP,n.KEEP,n.KEEP),n.clearStencil(0),n.cullFace(n.BACK),n.frontFace(n.CCW),n.polygonOffset(0,0),n.activeTexture(n.TEXTURE0),n.bindFramebuffer(n.FRAMEBUFFER,null),n.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),n.bindFramebuffer(n.READ_FRAMEBUFFER,null),n.useProgram(null),n.lineWidth(1),n.scissor(0,0,n.canvas.width,n.canvas.height),n.viewport(0,0,n.canvas.width,n.canvas.height),n.pixelStorei(n.PACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_ALIGNMENT,4),n.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,!1),n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),n.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,n.BROWSER_DEFAULT_WEBGL),n.pixelStorei(n.PACK_ROW_LENGTH,0),n.pixelStorei(n.PACK_SKIP_PIXELS,0),n.pixelStorei(n.PACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_ROW_LENGTH,0),n.pixelStorei(n.UNPACK_IMAGE_HEIGHT,0),n.pixelStorei(n.UNPACK_SKIP_PIXELS,0),n.pixelStorei(n.UNPACK_SKIP_ROWS,0),n.pixelStorei(n.UNPACK_SKIP_IMAGES,0),u={},h={},ee=null,re={},d={},f=new WeakMap,m=[],y=null,g=!1,p=null,S=null,E=null,_=null,M=null,w=null,C=null,v=new Pe(0,0,0),T=0,P=!1,L=null,F=null,V=null,N=null,B=null,ht.set(0,0,n.canvas.width,n.canvas.height),nt.set(0,0,n.canvas.width,n.canvas.height),s.reset(),o.reset(),a.reset()}return{buffers:{color:s,depth:o,stencil:a},enable:te,disable:ye,bindFramebuffer:$e,drawBuffers:Ae,useProgram:qe,setBlending:le,setMaterial:he,setFlipSided:J,setCullFace:ae,setLineWidth:Ge,setPolygonOffset:Fe,setScissorTest:We,activeTexture:je,bindTexture:D,unbindTexture:ct,compressedTexImage2D:it,compressedTexImage3D:A,texImage2D:K,texImage3D:ie,pixelStorei:ke,getParameter:ge,updateUBOMapping:Be,uniformBlockBinding:Ze,texStorage2D:pe,texStorage3D:me,texSubImage2D:x,texSubImage3D:k,compressedTexSubImage2D:$,compressedTexSubImage3D:j,scissor:be,viewport:xe,reset:et}}function MP(n,e,t,i,r,s,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new fe,u=new WeakMap,h=new Set,d,f=new WeakMap,m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function y(A,x){return m?new OffscreenCanvas(A,x):ga("canvas")}function g(A,x,k){let $=1,j=it(A);if((j.width>k||j.height>k)&&($=k/Math.max(j.width,j.height)),$<1)if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap||typeof VideoFrame<"u"&&A instanceof VideoFrame){let pe=Math.floor($*j.width),me=Math.floor($*j.height);d===void 0&&(d=y(pe,me));let K=x?y(pe,me):d;return K.width=pe,K.height=me,K.getContext("2d").drawImage(A,0,0,pe,me),Xe("WebGLRenderer: Texture has been resized from ("+j.width+"x"+j.height+") to ("+pe+"x"+me+")."),K}else return"data"in A&&Xe("WebGLRenderer: Image in DataTexture is too big ("+j.width+"x"+j.height+")."),A;return A}function p(A){return A.generateMipmaps}function S(A){n.generateMipmap(A)}function E(A){return A.isWebGLCubeRenderTarget?n.TEXTURE_CUBE_MAP:A.isWebGL3DRenderTarget?n.TEXTURE_3D:A.isWebGLArrayRenderTarget||A.isCompressedArrayTexture?n.TEXTURE_2D_ARRAY:n.TEXTURE_2D}function _(A,x,k,$,j,pe=!1){if(A!==null){if(n[A]!==void 0)return n[A];Xe("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+A+"'")}let me;$&&(me=e.get("EXT_texture_norm16"),me||Xe("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let K=x;if(x===n.RED&&(k===n.FLOAT&&(K=n.R32F),k===n.HALF_FLOAT&&(K=n.R16F),k===n.UNSIGNED_BYTE&&(K=n.R8),k===n.UNSIGNED_SHORT&&me&&(K=me.R16_EXT),k===n.SHORT&&me&&(K=me.R16_SNORM_EXT)),x===n.RED_INTEGER&&(k===n.UNSIGNED_BYTE&&(K=n.R8UI),k===n.UNSIGNED_SHORT&&(K=n.R16UI),k===n.UNSIGNED_INT&&(K=n.R32UI),k===n.BYTE&&(K=n.R8I),k===n.SHORT&&(K=n.R16I),k===n.INT&&(K=n.R32I)),x===n.RG&&(k===n.FLOAT&&(K=n.RG32F),k===n.HALF_FLOAT&&(K=n.RG16F),k===n.UNSIGNED_BYTE&&(K=n.RG8),k===n.UNSIGNED_SHORT&&me&&(K=me.RG16_EXT),k===n.SHORT&&me&&(K=me.RG16_SNORM_EXT)),x===n.RG_INTEGER&&(k===n.UNSIGNED_BYTE&&(K=n.RG8UI),k===n.UNSIGNED_SHORT&&(K=n.RG16UI),k===n.UNSIGNED_INT&&(K=n.RG32UI),k===n.BYTE&&(K=n.RG8I),k===n.SHORT&&(K=n.RG16I),k===n.INT&&(K=n.RG32I)),x===n.RGB_INTEGER&&(k===n.UNSIGNED_BYTE&&(K=n.RGB8UI),k===n.UNSIGNED_SHORT&&(K=n.RGB16UI),k===n.UNSIGNED_INT&&(K=n.RGB32UI),k===n.BYTE&&(K=n.RGB8I),k===n.SHORT&&(K=n.RGB16I),k===n.INT&&(K=n.RGB32I)),x===n.RGBA_INTEGER&&(k===n.UNSIGNED_BYTE&&(K=n.RGBA8UI),k===n.UNSIGNED_SHORT&&(K=n.RGBA16UI),k===n.UNSIGNED_INT&&(K=n.RGBA32UI),k===n.BYTE&&(K=n.RGBA8I),k===n.SHORT&&(K=n.RGBA16I),k===n.INT&&(K=n.RGBA32I)),x===n.RGB&&(k===n.UNSIGNED_SHORT&&me&&(K=me.RGB16_EXT),k===n.SHORT&&me&&(K=me.RGB16_SNORM_EXT),k===n.UNSIGNED_INT_5_9_9_9_REV&&(K=n.RGB9_E5),k===n.UNSIGNED_INT_10F_11F_11F_REV&&(K=n.R11F_G11F_B10F)),x===n.RGBA){let ie=pe?ma:ut.getTransfer(j);k===n.FLOAT&&(K=n.RGBA32F),k===n.HALF_FLOAT&&(K=n.RGBA16F),k===n.UNSIGNED_BYTE&&(K=ie===St?n.SRGB8_ALPHA8:n.RGBA8),k===n.UNSIGNED_SHORT&&me&&(K=me.RGBA16_EXT),k===n.SHORT&&me&&(K=me.RGBA16_SNORM_EXT),k===n.UNSIGNED_SHORT_4_4_4_4&&(K=n.RGBA4),k===n.UNSIGNED_SHORT_5_5_5_1&&(K=n.RGB5_A1)}return(K===n.R16F||K===n.R32F||K===n.RG16F||K===n.RG32F||K===n.RGBA16F||K===n.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function M(A,x){let k;return A?x===null||x===Vn||x===uo?k=n.DEPTH24_STENCIL8:x===Nn?k=n.DEPTH32F_STENCIL8:x===lo&&(k=n.DEPTH24_STENCIL8,Xe("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===Vn||x===uo?k=n.DEPTH_COMPONENT24:x===Nn?k=n.DEPTH_COMPONENT32F:x===lo&&(k=n.DEPTH_COMPONENT16),k}function w(A,x){return p(A)===!0||A.isFramebufferTexture&&A.minFilter!==Lt&&A.minFilter!==jt?Math.log2(Math.max(x.width,x.height))+1:A.mipmaps!==void 0&&A.mipmaps.length>0?A.mipmaps.length:A.isCompressedTexture&&Array.isArray(A.image)?x.mipmaps.length:1}function C(A){let x=A.target;x.removeEventListener("dispose",C),T(x),x.isVideoTexture&&u.delete(x),x.isHTMLTexture&&h.delete(x)}function v(A){let x=A.target;x.removeEventListener("dispose",v),L(x)}function T(A){let x=i.get(A);if(x.__webglInit===void 0)return;let k=A.source,$=f.get(k);if($){let j=$[x.__cacheKey];j.usedTimes--,j.usedTimes===0&&P(A),Object.keys($).length===0&&f.delete(k)}i.remove(A)}function P(A){let x=i.get(A);n.deleteTexture(x.__webglTexture);let k=A.source,$=f.get(k);delete $[x.__cacheKey],o.memory.textures--}function L(A){let x=i.get(A);if(A.depthTexture&&(A.depthTexture.dispose(),i.remove(A.depthTexture)),A.isWebGLCubeRenderTarget)for(let $=0;$<6;$++){if(Array.isArray(x.__webglFramebuffer[$]))for(let j=0;j<x.__webglFramebuffer[$].length;j++)n.deleteFramebuffer(x.__webglFramebuffer[$][j]);else n.deleteFramebuffer(x.__webglFramebuffer[$]);x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer[$])}else{if(Array.isArray(x.__webglFramebuffer))for(let $=0;$<x.__webglFramebuffer.length;$++)n.deleteFramebuffer(x.__webglFramebuffer[$]);else n.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&n.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&n.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let $=0;$<x.__webglColorRenderbuffer.length;$++)x.__webglColorRenderbuffer[$]&&n.deleteRenderbuffer(x.__webglColorRenderbuffer[$]);x.__webglDepthRenderbuffer&&n.deleteRenderbuffer(x.__webglDepthRenderbuffer)}let k=A.textures;for(let $=0,j=k.length;$<j;$++){let pe=i.get(k[$]);pe.__webglTexture&&(n.deleteTexture(pe.__webglTexture),o.memory.textures--),i.remove(k[$])}i.remove(A)}let F=0;function V(){F=0}function N(){return F}function B(A){F=A}function q(){let A=F;return A>=r.maxTextures&&Xe("WebGLTextures: Trying to use "+(A+1)+" texture units while this GPU supports only "+r.maxTextures),F+=1,A}function Z(A){let x=[];return x.push(A.wrapS),x.push(A.wrapT),x.push(A.wrapR||0),x.push(A.magFilter),x.push(A.minFilter),x.push(A.anisotropy),x.push(A.internalFormat),x.push(A.format),x.push(A.type),x.push(A.generateMipmaps),x.push(A.premultiplyAlpha),x.push(A.flipY),x.push(A.unpackAlignment),x.push(A.colorSpace),x.join()}function se(A,x){let k=i.get(A);if(A.isVideoTexture&&D(A),A.isRenderTargetTexture===!1&&A.isExternalTexture!==!0&&A.version>0&&k.__version!==A.version){let $=A.image;if($===null)Xe("WebGLRenderer: Texture marked for update but no image data found.");else if($.complete===!1)Xe("WebGLRenderer: Texture marked for update but image is incomplete");else{ye(k,A,x);return}}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D,k.__webglTexture,n.TEXTURE0+x)}function X(A,x){let k=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){ye(k,A,x);return}else A.isExternalTexture&&(k.__webglTexture=A.sourceTexture?A.sourceTexture:null);t.bindTexture(n.TEXTURE_2D_ARRAY,k.__webglTexture,n.TEXTURE0+x)}function ee(A,x){let k=i.get(A);if(A.isRenderTargetTexture===!1&&A.version>0&&k.__version!==A.version){ye(k,A,x);return}t.bindTexture(n.TEXTURE_3D,k.__webglTexture,n.TEXTURE0+x)}function re(A,x){let k=i.get(A);if(A.isCubeDepthTexture!==!0&&A.version>0&&k.__version!==A.version){$e(k,A,x);return}t.bindTexture(n.TEXTURE_CUBE_MAP,k.__webglTexture,n.TEXTURE0+x)}let De={[Iu]:n.REPEAT,[hi]:n.CLAMP_TO_EDGE,[Du]:n.MIRRORED_REPEAT},Re={[Lt]:n.NEAREST,[cS]:n.NEAREST_MIPMAP_NEAREST,[$a]:n.NEAREST_MIPMAP_LINEAR,[jt]:n.LINEAR,[uh]:n.LINEAR_MIPMAP_NEAREST,[_r]:n.LINEAR_MIPMAP_LINEAR},ht={[dS]:n.NEVER,[xS]:n.ALWAYS,[fS]:n.LESS,[Xh]:n.LEQUAL,[pS]:n.EQUAL,[qh]:n.GEQUAL,[mS]:n.GREATER,[gS]:n.NOTEQUAL};function nt(A,x){if(x.type===Nn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===jt||x.magFilter===uh||x.magFilter===$a||x.magFilter===_r||x.minFilter===jt||x.minFilter===uh||x.minFilter===$a||x.minFilter===_r)&&Xe("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),n.texParameteri(A,n.TEXTURE_WRAP_S,De[x.wrapS]),n.texParameteri(A,n.TEXTURE_WRAP_T,De[x.wrapT]),(A===n.TEXTURE_3D||A===n.TEXTURE_2D_ARRAY)&&n.texParameteri(A,n.TEXTURE_WRAP_R,De[x.wrapR]),n.texParameteri(A,n.TEXTURE_MAG_FILTER,Re[x.magFilter]),n.texParameteri(A,n.TEXTURE_MIN_FILTER,Re[x.minFilter]),x.compareFunction&&(n.texParameteri(A,n.TEXTURE_COMPARE_MODE,n.COMPARE_REF_TO_TEXTURE),n.texParameteri(A,n.TEXTURE_COMPARE_FUNC,ht[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Lt||x.minFilter!==$a&&x.minFilter!==_r||x.type===Nn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||i.get(x).__currentAnisotropy){let k=e.get("EXT_texture_filter_anisotropic");n.texParameterf(A,k.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),i.get(x).__currentAnisotropy=x.anisotropy}}}function dt(A,x){let k=!1;A.__webglInit===void 0&&(A.__webglInit=!0,x.addEventListener("dispose",C));let $=x.source,j=f.get($);j===void 0&&(j={},f.set($,j));let pe=Z(x);if(pe!==A.__cacheKey){j[pe]===void 0&&(j[pe]={texture:n.createTexture(),usedTimes:0},o.memory.textures++,k=!0),j[pe].usedTimes++;let me=j[A.__cacheKey];me!==void 0&&(j[A.__cacheKey].usedTimes--,me.usedTimes===0&&P(x)),A.__cacheKey=pe,A.__webglTexture=j[pe].texture}return k}function Y(A,x,k){return Math.floor(Math.floor(A/k)/x)}function te(A,x,k,$){let pe=A.updateRanges;if(pe.length===0)t.texSubImage2D(n.TEXTURE_2D,0,0,0,x.width,x.height,k,$,x.data);else{pe.sort((ke,be)=>ke.start-be.start);let me=0;for(let ke=1;ke<pe.length;ke++){let be=pe[me],xe=pe[ke],Be=be.start+be.count,Ze=Y(xe.start,x.width,4),et=Y(be.start,x.width,4);xe.start<=Be+1&&Ze===et&&Y(xe.start+xe.count-1,x.width,4)===Ze?be.count=Math.max(be.count,xe.start+xe.count-be.start):(++me,pe[me]=xe)}pe.length=me+1;let K=t.getParameter(n.UNPACK_ROW_LENGTH),ie=t.getParameter(n.UNPACK_SKIP_PIXELS),ge=t.getParameter(n.UNPACK_SKIP_ROWS);t.pixelStorei(n.UNPACK_ROW_LENGTH,x.width);for(let ke=0,be=pe.length;ke<be;ke++){let xe=pe[ke],Be=Math.floor(xe.start/4),Ze=Math.ceil(xe.count/4),et=Be%x.width,U=Math.floor(Be/x.width),_e=Ze,Q=1;t.pixelStorei(n.UNPACK_SKIP_PIXELS,et),t.pixelStorei(n.UNPACK_SKIP_ROWS,U),t.texSubImage2D(n.TEXTURE_2D,0,et,U,_e,Q,k,$,x.data)}A.clearUpdateRanges(),t.pixelStorei(n.UNPACK_ROW_LENGTH,K),t.pixelStorei(n.UNPACK_SKIP_PIXELS,ie),t.pixelStorei(n.UNPACK_SKIP_ROWS,ge)}}function ye(A,x,k){let $=n.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&($=n.TEXTURE_2D_ARRAY),x.isData3DTexture&&($=n.TEXTURE_3D);let j=dt(A,x),pe=x.source;t.bindTexture($,A.__webglTexture,n.TEXTURE0+k);let me=i.get(pe);if(pe.version!==me.__version||j===!0){if(t.activeTexture(n.TEXTURE0+k),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){let Q=ut.getPrimaries(ut.workingColorSpace),ve=x.colorSpace===Li?null:ut.getPrimaries(x.colorSpace),Te=x.colorSpace===Li||Q===ve?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,Te)}t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment);let ie=g(x.image,!1,r.maxTextureSize);ie=ct(x,ie);let ge=s.convert(x.format,x.colorSpace),ke=s.convert(x.type),be=_(x.internalFormat,ge,ke,x.normalized,x.colorSpace,x.isVideoTexture);nt($,x);let xe,Be=x.mipmaps,Ze=x.isVideoTexture!==!0,et=me.__version===void 0||j===!0,U=pe.dataReady,_e=w(x,ie);if(x.isDepthTexture)be=M(x.format===vr,x.type),et&&(Ze?t.texStorage2D(n.TEXTURE_2D,1,be,ie.width,ie.height):t.texImage2D(n.TEXTURE_2D,0,be,ie.width,ie.height,0,ge,ke,null));else if(x.isDataTexture)if(Be.length>0){Ze&&et&&t.texStorage2D(n.TEXTURE_2D,_e,be,Be[0].width,Be[0].height);for(let Q=0,ve=Be.length;Q<ve;Q++)xe=Be[Q],Ze?U&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,xe.width,xe.height,ge,ke,xe.data):t.texImage2D(n.TEXTURE_2D,Q,be,xe.width,xe.height,0,ge,ke,xe.data);x.generateMipmaps=!1}else Ze?(et&&t.texStorage2D(n.TEXTURE_2D,_e,be,ie.width,ie.height),U&&te(x,ie,ge,ke)):t.texImage2D(n.TEXTURE_2D,0,be,ie.width,ie.height,0,ge,ke,ie.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){Ze&&et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,be,Be[0].width,Be[0].height,ie.depth);for(let Q=0,ve=Be.length;Q<ve;Q++)if(xe=Be[Q],x.format!==En)if(ge!==null)if(Ze){if(U)if(x.layerUpdates.size>0){let Te=Wx(xe.width,xe.height,x.format,x.type);for(let oe of x.layerUpdates){let He=xe.data.subarray(oe*Te/xe.data.BYTES_PER_ELEMENT,(oe+1)*Te/xe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,oe,xe.width,xe.height,1,ge,He)}}else t.compressedTexSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,xe.width,xe.height,ie.depth,ge,xe.data)}else t.compressedTexImage3D(n.TEXTURE_2D_ARRAY,Q,be,xe.width,xe.height,ie.depth,0,xe.data,0,0);else Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ze?U&&t.texSubImage3D(n.TEXTURE_2D_ARRAY,Q,0,0,0,xe.width,xe.height,ie.depth,ge,ke,xe.data):t.texImage3D(n.TEXTURE_2D_ARRAY,Q,be,xe.width,xe.height,ie.depth,0,ge,ke,xe.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{Ze&&et&&t.texStorage2D(n.TEXTURE_2D,_e,be,Be[0].width,Be[0].height);for(let Q=0,ve=Be.length;Q<ve;Q++)xe=Be[Q],x.format!==En?ge!==null?Ze?U&&t.compressedTexSubImage2D(n.TEXTURE_2D,Q,0,0,xe.width,xe.height,ge,xe.data):t.compressedTexImage2D(n.TEXTURE_2D,Q,be,xe.width,xe.height,0,xe.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ze?U&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,xe.width,xe.height,ge,ke,xe.data):t.texImage2D(n.TEXTURE_2D,Q,be,xe.width,xe.height,0,ge,ke,xe.data)}else if(x.isDataArrayTexture)if(Ze){if(et&&t.texStorage3D(n.TEXTURE_2D_ARRAY,_e,be,ie.width,ie.height,ie.depth),U)if(x.layerUpdates.size>0){let Q=Wx(ie.width,ie.height,x.format,x.type);for(let ve of x.layerUpdates){let Te=ie.data.subarray(ve*Q/ie.data.BYTES_PER_ELEMENT,(ve+1)*Q/ie.data.BYTES_PER_ELEMENT);t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,ve,ie.width,ie.height,1,ge,ke,Te)}x.clearLayerUpdates()}else t.texSubImage3D(n.TEXTURE_2D_ARRAY,0,0,0,0,ie.width,ie.height,ie.depth,ge,ke,ie.data)}else t.texImage3D(n.TEXTURE_2D_ARRAY,0,be,ie.width,ie.height,ie.depth,0,ge,ke,ie.data);else if(x.isData3DTexture)Ze?(et&&t.texStorage3D(n.TEXTURE_3D,_e,be,ie.width,ie.height,ie.depth),U&&t.texSubImage3D(n.TEXTURE_3D,0,0,0,0,ie.width,ie.height,ie.depth,ge,ke,ie.data)):t.texImage3D(n.TEXTURE_3D,0,be,ie.width,ie.height,ie.depth,0,ge,ke,ie.data);else if(x.isFramebufferTexture){if(et)if(Ze)t.texStorage2D(n.TEXTURE_2D,_e,be,ie.width,ie.height);else{let Q=ie.width,ve=ie.height;for(let Te=0;Te<_e;Te++)t.texImage2D(n.TEXTURE_2D,Te,be,Q,ve,0,ge,ke,null),Q>>=1,ve>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in n){let Q=n.canvas;if(Q.hasAttribute("layoutsubtree")||Q.setAttribute("layoutsubtree","true"),ie.parentNode!==Q){Q.appendChild(ie),h.add(x),Q.onpaint=ve=>{let Te=ve.changedElements;for(let oe of h)Te.includes(oe.image)&&(oe.needsUpdate=!0)},Q.requestPaint();return}if(n.texElementImage2D.length===3)n.texElementImage2D(n.TEXTURE_2D,n.RGBA8,ie);else{let Te=n.RGBA,oe=n.RGBA,He=n.UNSIGNED_BYTE;n.texElementImage2D(n.TEXTURE_2D,0,Te,oe,He,ie)}n.texParameteri(n.TEXTURE_2D,n.TEXTURE_MIN_FILTER,n.LINEAR),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_S,n.CLAMP_TO_EDGE),n.texParameteri(n.TEXTURE_2D,n.TEXTURE_WRAP_T,n.CLAMP_TO_EDGE)}}else if(Be.length>0){if(Ze&&et){let Q=it(Be[0]);t.texStorage2D(n.TEXTURE_2D,_e,be,Q.width,Q.height)}for(let Q=0,ve=Be.length;Q<ve;Q++)xe=Be[Q],Ze?U&&t.texSubImage2D(n.TEXTURE_2D,Q,0,0,ge,ke,xe):t.texImage2D(n.TEXTURE_2D,Q,be,ge,ke,xe);x.generateMipmaps=!1}else if(Ze){if(et){let Q=it(ie);t.texStorage2D(n.TEXTURE_2D,_e,be,Q.width,Q.height)}U&&t.texSubImage2D(n.TEXTURE_2D,0,0,0,ge,ke,ie)}else t.texImage2D(n.TEXTURE_2D,0,be,ge,ke,ie);p(x)&&S($),me.__version=pe.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function $e(A,x,k){if(x.image.length!==6)return;let $=dt(A,x),j=x.source;t.bindTexture(n.TEXTURE_CUBE_MAP,A.__webglTexture,n.TEXTURE0+k);let pe=i.get(j);if(j.version!==pe.__version||$===!0){t.activeTexture(n.TEXTURE0+k);let me=ut.getPrimaries(ut.workingColorSpace),K=x.colorSpace===Li?null:ut.getPrimaries(x.colorSpace),ie=x.colorSpace===Li||me===K?n.NONE:n.BROWSER_DEFAULT_WEBGL;t.pixelStorei(n.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(n.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(n.UNPACK_COLORSPACE_CONVERSION_WEBGL,ie);let ge=x.isCompressedTexture||x.image[0].isCompressedTexture,ke=x.image[0]&&x.image[0].isDataTexture,be=[];for(let oe=0;oe<6;oe++)!ge&&!ke?be[oe]=g(x.image[oe],!0,r.maxCubemapSize):be[oe]=ke?x.image[oe].image:x.image[oe],be[oe]=ct(x,be[oe]);let xe=be[0],Be=s.convert(x.format,x.colorSpace),Ze=s.convert(x.type),et=_(x.internalFormat,Be,Ze,x.normalized,x.colorSpace),U=x.isVideoTexture!==!0,_e=pe.__version===void 0||$===!0,Q=j.dataReady,ve=w(x,xe);nt(n.TEXTURE_CUBE_MAP,x);let Te;if(ge){U&&_e&&t.texStorage2D(n.TEXTURE_CUBE_MAP,ve,et,xe.width,xe.height);for(let oe=0;oe<6;oe++){Te=be[oe].mipmaps;for(let He=0;He<Te.length;He++){let Ue=Te[He];x.format!==En?Be!==null?U?Q&&t.compressedTexSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He,0,0,Ue.width,Ue.height,Be,Ue.data):t.compressedTexImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He,et,Ue.width,Ue.height,0,Ue.data):Xe("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):U?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He,0,0,Ue.width,Ue.height,Be,Ze,Ue.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He,et,Ue.width,Ue.height,0,Be,Ze,Ue.data)}}}else{if(Te=x.mipmaps,U&&_e){Te.length>0&&ve++;let oe=it(be[0]);t.texStorage2D(n.TEXTURE_CUBE_MAP,ve,et,oe.width,oe.height)}for(let oe=0;oe<6;oe++)if(ke){U?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,be[oe].width,be[oe].height,Be,Ze,be[oe].data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,et,be[oe].width,be[oe].height,0,Be,Ze,be[oe].data);for(let He=0;He<Te.length;He++){let Pt=Te[He].image[oe].image;U?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He+1,0,0,Pt.width,Pt.height,Be,Ze,Pt.data):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He+1,et,Pt.width,Pt.height,0,Be,Ze,Pt.data)}}else{U?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,0,0,Be,Ze,be[oe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,0,et,Be,Ze,be[oe]);for(let He=0;He<Te.length;He++){let Ue=Te[He];U?Q&&t.texSubImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He+1,0,0,Be,Ze,Ue.image[oe]):t.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+oe,He+1,et,Be,Ze,Ue.image[oe])}}}p(x)&&S(n.TEXTURE_CUBE_MAP),pe.__version=j.version,x.onUpdate&&x.onUpdate(x)}A.__version=x.version}function Ae(A,x,k,$,j,pe){let me=s.convert(k.format,k.colorSpace),K=s.convert(k.type),ie=_(k.internalFormat,me,K,k.normalized,k.colorSpace),ge=i.get(x),ke=i.get(k);if(ke.__renderTarget=x,!ge.__hasExternalTextures){let be=Math.max(1,x.width>>pe),xe=Math.max(1,x.height>>pe);j===n.TEXTURE_3D||j===n.TEXTURE_2D_ARRAY?t.texImage3D(j,pe,ie,be,xe,x.depth,0,me,K,null):t.texImage2D(j,pe,ie,be,xe,0,me,K,null)}t.bindFramebuffer(n.FRAMEBUFFER,A),je(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,$,j,ke.__webglTexture,0,We(x)):(j===n.TEXTURE_2D||j>=n.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=n.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&n.framebufferTexture2D(n.FRAMEBUFFER,$,j,ke.__webglTexture,pe),t.bindFramebuffer(n.FRAMEBUFFER,null)}function qe(A,x,k){if(n.bindRenderbuffer(n.RENDERBUFFER,A),x.depthBuffer){let $=x.depthTexture,j=$&&$.isDepthTexture?$.type:null,pe=M(x.stencilBuffer,j),me=x.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;je(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,We(x),pe,x.width,x.height):k?n.renderbufferStorageMultisample(n.RENDERBUFFER,We(x),pe,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,pe,x.width,x.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,me,n.RENDERBUFFER,A)}else{let $=x.textures;for(let j=0;j<$.length;j++){let pe=$[j],me=s.convert(pe.format,pe.colorSpace),K=s.convert(pe.type),ie=_(pe.internalFormat,me,K,pe.normalized,pe.colorSpace);je(x)?a.renderbufferStorageMultisampleEXT(n.RENDERBUFFER,We(x),ie,x.width,x.height):k?n.renderbufferStorageMultisample(n.RENDERBUFFER,We(x),ie,x.width,x.height):n.renderbufferStorage(n.RENDERBUFFER,ie,x.width,x.height)}}n.bindRenderbuffer(n.RENDERBUFFER,null)}function ft(A,x,k){let $=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(n.FRAMEBUFFER,A),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let j=i.get(x.depthTexture);if(j.__renderTarget=x,(!j.__webglTexture||x.depthTexture.image.width!==x.width||x.depthTexture.image.height!==x.height)&&(x.depthTexture.image.width=x.width,x.depthTexture.image.height=x.height,x.depthTexture.needsUpdate=!0),$){if(j.__webglInit===void 0&&(j.__webglInit=!0,x.depthTexture.addEventListener("dispose",C)),j.__webglTexture===void 0){j.__webglTexture=n.createTexture(),t.bindTexture(n.TEXTURE_CUBE_MAP,j.__webglTexture),nt(n.TEXTURE_CUBE_MAP,x.depthTexture);let ge=s.convert(x.depthTexture.format),ke=s.convert(x.depthTexture.type),be;x.depthTexture.format===fi?be=n.DEPTH_COMPONENT24:x.depthTexture.format===vr&&(be=n.DEPTH24_STENCIL8);for(let xe=0;xe<6;xe++)n.texImage2D(n.TEXTURE_CUBE_MAP_POSITIVE_X+xe,0,be,x.width,x.height,0,ge,ke,null)}}else se(x.depthTexture,0);let pe=j.__webglTexture,me=We(x),K=$?n.TEXTURE_CUBE_MAP_POSITIVE_X+k:n.TEXTURE_2D,ie=x.depthTexture.format===vr?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;if(x.depthTexture.format===fi)je(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ie,K,pe,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,ie,K,pe,0);else if(x.depthTexture.format===vr)je(x)?a.framebufferTexture2DMultisampleEXT(n.FRAMEBUFFER,ie,K,pe,0,me):n.framebufferTexture2D(n.FRAMEBUFFER,ie,K,pe,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function ne(A){let x=i.get(A),k=A.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==A.depthTexture){let $=A.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),$){let j=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,$.removeEventListener("dispose",j)};$.addEventListener("dispose",j),x.__depthDisposeCallback=j}x.__boundDepthTexture=$}if(A.depthTexture&&!x.__autoAllocateDepthBuffer)if(k)for(let $=0;$<6;$++)ft(x.__webglFramebuffer[$],A,$);else{let $=A.texture.mipmaps;$&&$.length>0?ft(x.__webglFramebuffer[0],A,0):ft(x.__webglFramebuffer,A,0)}else if(k){x.__webglDepthbuffer=[];for(let $=0;$<6;$++)if(t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[$]),x.__webglDepthbuffer[$]===void 0)x.__webglDepthbuffer[$]=n.createRenderbuffer(),qe(x.__webglDepthbuffer[$],A,!1);else{let j=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer[$];n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,pe)}}else{let $=A.texture.mipmaps;if($&&$.length>0?t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(n.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=n.createRenderbuffer(),qe(x.__webglDepthbuffer,A,!1);else{let j=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,pe=x.__webglDepthbuffer;n.bindRenderbuffer(n.RENDERBUFFER,pe),n.framebufferRenderbuffer(n.FRAMEBUFFER,j,n.RENDERBUFFER,pe)}}t.bindFramebuffer(n.FRAMEBUFFER,null)}function le(A,x,k){let $=i.get(A);x!==void 0&&Ae($.__webglFramebuffer,A,A.texture,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,0),k!==void 0&&ne(A)}function he(A){let x=A.texture,k=i.get(A),$=i.get(x);A.addEventListener("dispose",v);let j=A.textures,pe=A.isWebGLCubeRenderTarget===!0,me=j.length>1;if(me||($.__webglTexture===void 0&&($.__webglTexture=n.createTexture()),$.__version=x.version,o.memory.textures++),pe){k.__webglFramebuffer=[];for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0){k.__webglFramebuffer[K]=[];for(let ie=0;ie<x.mipmaps.length;ie++)k.__webglFramebuffer[K][ie]=n.createFramebuffer()}else k.__webglFramebuffer[K]=n.createFramebuffer()}else{if(x.mipmaps&&x.mipmaps.length>0){k.__webglFramebuffer=[];for(let K=0;K<x.mipmaps.length;K++)k.__webglFramebuffer[K]=n.createFramebuffer()}else k.__webglFramebuffer=n.createFramebuffer();if(me)for(let K=0,ie=j.length;K<ie;K++){let ge=i.get(j[K]);ge.__webglTexture===void 0&&(ge.__webglTexture=n.createTexture(),o.memory.textures++)}if(A.samples>0&&je(A)===!1){k.__webglMultisampledFramebuffer=n.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(n.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let K=0;K<j.length;K++){let ie=j[K];k.__webglColorRenderbuffer[K]=n.createRenderbuffer(),n.bindRenderbuffer(n.RENDERBUFFER,k.__webglColorRenderbuffer[K]);let ge=s.convert(ie.format,ie.colorSpace),ke=s.convert(ie.type),be=_(ie.internalFormat,ge,ke,ie.normalized,ie.colorSpace,A.isXRRenderTarget===!0),xe=We(A);n.renderbufferStorageMultisample(n.RENDERBUFFER,xe,be,A.width,A.height),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+K,n.RENDERBUFFER,k.__webglColorRenderbuffer[K])}n.bindRenderbuffer(n.RENDERBUFFER,null),A.depthBuffer&&(k.__webglDepthRenderbuffer=n.createRenderbuffer(),qe(k.__webglDepthRenderbuffer,A,!0)),t.bindFramebuffer(n.FRAMEBUFFER,null)}}if(pe){t.bindTexture(n.TEXTURE_CUBE_MAP,$.__webglTexture),nt(n.TEXTURE_CUBE_MAP,x);for(let K=0;K<6;K++)if(x.mipmaps&&x.mipmaps.length>0)for(let ie=0;ie<x.mipmaps.length;ie++)Ae(k.__webglFramebuffer[K][ie],A,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,ie);else Ae(k.__webglFramebuffer[K],A,x,n.COLOR_ATTACHMENT0,n.TEXTURE_CUBE_MAP_POSITIVE_X+K,0);p(x)&&S(n.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(me){for(let K=0,ie=j.length;K<ie;K++){let ge=j[K],ke=i.get(ge),be=n.TEXTURE_2D;(A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(be=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(be,ke.__webglTexture),nt(be,ge),Ae(k.__webglFramebuffer,A,ge,n.COLOR_ATTACHMENT0+K,be,0),p(ge)&&S(be)}t.unbindTexture()}else{let K=n.TEXTURE_2D;if((A.isWebGL3DRenderTarget||A.isWebGLArrayRenderTarget)&&(K=A.isWebGL3DRenderTarget?n.TEXTURE_3D:n.TEXTURE_2D_ARRAY),t.bindTexture(K,$.__webglTexture),nt(K,x),x.mipmaps&&x.mipmaps.length>0)for(let ie=0;ie<x.mipmaps.length;ie++)Ae(k.__webglFramebuffer[ie],A,x,n.COLOR_ATTACHMENT0,K,ie);else Ae(k.__webglFramebuffer,A,x,n.COLOR_ATTACHMENT0,K,0);p(x)&&S(K),t.unbindTexture()}A.depthBuffer&&ne(A)}function J(A){let x=A.textures;for(let k=0,$=x.length;k<$;k++){let j=x[k];if(p(j)){let pe=E(A),me=i.get(j).__webglTexture;t.bindTexture(pe,me),S(pe),t.unbindTexture()}}}let ae=[],Ge=[];function Fe(A){if(A.samples>0){if(je(A)===!1){let x=A.textures,k=A.width,$=A.height,j=n.COLOR_BUFFER_BIT,pe=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT,me=i.get(A),K=x.length>1;if(K)for(let ge=0;ge<x.length;ge++)t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,null),t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,null,0);t.bindFramebuffer(n.READ_FRAMEBUFFER,me.__webglMultisampledFramebuffer);let ie=A.texture.mipmaps;ie&&ie.length>0?t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer[0]):t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglFramebuffer);for(let ge=0;ge<x.length;ge++){if(A.resolveDepthBuffer&&(A.depthBuffer&&(j|=n.DEPTH_BUFFER_BIT),A.stencilBuffer&&A.resolveStencilBuffer&&(j|=n.STENCIL_BUFFER_BIT)),K){n.framebufferRenderbuffer(n.READ_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.RENDERBUFFER,me.__webglColorRenderbuffer[ge]);let ke=i.get(x[ge]).__webglTexture;n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0,n.TEXTURE_2D,ke,0)}n.blitFramebuffer(0,0,k,$,0,0,k,$,j,n.NEAREST),c===!0&&(ae.length=0,Ge.length=0,ae.push(n.COLOR_ATTACHMENT0+ge),A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&(ae.push(pe),Ge.push(pe),n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,Ge)),n.invalidateFramebuffer(n.READ_FRAMEBUFFER,ae))}if(t.bindFramebuffer(n.READ_FRAMEBUFFER,null),t.bindFramebuffer(n.DRAW_FRAMEBUFFER,null),K)for(let ge=0;ge<x.length;ge++){t.bindFramebuffer(n.FRAMEBUFFER,me.__webglMultisampledFramebuffer),n.framebufferRenderbuffer(n.FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.RENDERBUFFER,me.__webglColorRenderbuffer[ge]);let ke=i.get(x[ge]).__webglTexture;t.bindFramebuffer(n.FRAMEBUFFER,me.__webglFramebuffer),n.framebufferTexture2D(n.DRAW_FRAMEBUFFER,n.COLOR_ATTACHMENT0+ge,n.TEXTURE_2D,ke,0)}t.bindFramebuffer(n.DRAW_FRAMEBUFFER,me.__webglMultisampledFramebuffer)}else if(A.depthBuffer&&A.storeMultisampledDepthBuffer===!1&&c){let x=A.stencilBuffer?n.DEPTH_STENCIL_ATTACHMENT:n.DEPTH_ATTACHMENT;n.invalidateFramebuffer(n.DRAW_FRAMEBUFFER,[x])}}}function We(A){return Math.min(r.maxSamples,A.samples)}function je(A){let x=i.get(A);return A.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function D(A){let x=o.render.frame;u.get(A)!==x&&(u.set(A,x),A.update())}function ct(A,x){let k=A.colorSpace,$=A.format,j=A.type;return A.isCompressedTexture===!0||A.isVideoTexture===!0||k!==pa&&k!==Li&&(ut.getTransfer(k)===St?($!==En||j!==Rn)&&Xe("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):Je("WebGLTextures: Unsupported texture color space:",k)),x}function it(A){return typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement?(l.width=A.naturalWidth||A.width,l.height=A.naturalHeight||A.height):typeof VideoFrame<"u"&&A instanceof VideoFrame?(l.width=A.displayWidth,l.height=A.displayHeight):(l.width=A.width,l.height=A.height),l}this.allocateTextureUnit=q,this.resetTextureUnits=V,this.getTextureUnits=N,this.setTextureUnits=B,this.setTexture2D=se,this.setTexture2DArray=X,this.setTexture3D=ee,this.setTextureCube=re,this.rebindTextures=le,this.setupRenderTarget=he,this.updateRenderTargetMipmap=J,this.updateMultisampleRenderTarget=Fe,this.setupDepthRenderbuffer=ne,this.setupFrameBufferTexture=Ae,this.useMultisampledRTT=je,this.isReversedDepthBuffer=function(){return t.buffers.depth.getReversed()}}function wP(n,e){function t(i,r=Li){let s,o=ut.getTransfer(r);if(i===Rn)return n.UNSIGNED_BYTE;if(i===dh)return n.UNSIGNED_SHORT_4_4_4_4;if(i===fh)return n.UNSIGNED_SHORT_5_5_5_1;if(i===Lx)return n.UNSIGNED_INT_5_9_9_9_REV;if(i===zx)return n.UNSIGNED_INT_10F_11F_11F_REV;if(i===Dx)return n.BYTE;if(i===Nx)return n.SHORT;if(i===lo)return n.UNSIGNED_SHORT;if(i===hh)return n.INT;if(i===Vn)return n.UNSIGNED_INT;if(i===Nn)return n.FLOAT;if(i===ei)return n.HALF_FLOAT;if(i===Ux)return n.ALPHA;if(i===Ox)return n.RGB;if(i===En)return n.RGBA;if(i===fi)return n.DEPTH_COMPONENT;if(i===vr)return n.DEPTH_STENCIL;if(i===Wa)return n.RED;if(i===Za)return n.RED_INTEGER;if(i===yr)return n.RG;if(i===ph)return n.RG_INTEGER;if(i===mh)return n.RGBA_INTEGER;if(i===Xa||i===qa||i===Ya||i===Ja)if(o===St)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(i===Xa)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(i===qa)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(i===Ya)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(i===Ja)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(i===Xa)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(i===qa)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(i===Ya)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(i===Ja)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(i===gh||i===xh||i===_h||i===vh)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(i===gh)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(i===xh)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(i===_h)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(i===vh)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(i===yh||i===bh||i===Sh||i===Mh||i===wh||i===ja||i===Eh)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(i===yh||i===bh)return o===St?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(i===Sh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(i===Mh)return s.COMPRESSED_R11_EAC;if(i===wh)return s.COMPRESSED_SIGNED_R11_EAC;if(i===ja)return s.COMPRESSED_RG11_EAC;if(i===Eh)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(i===Th||i===Ah||i===Rh||i===Ch||i===Ph||i===Ih||i===Dh||i===Nh||i===Lh||i===zh||i===Uh||i===Oh||i===Fh||i===kh)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(i===Th)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(i===Ah)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(i===Rh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(i===Ch)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(i===Ph)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(i===Ih)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(i===Dh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(i===Nh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(i===Lh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(i===zh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(i===Uh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(i===Oh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(i===Fh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(i===kh)return o===St?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(i===Bh||i===Hh||i===Gh)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(i===Bh)return o===St?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(i===Hh)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(i===Gh)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(i===Vh||i===$h||i===Ka||i===Wh)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(i===Vh)return s.COMPRESSED_RED_RGTC1_EXT;if(i===$h)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(i===Ka)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(i===Wh)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return i===uo?n.UNSIGNED_INT_24_8:n[i]!==void 0?n[i]:null}return{convert:t}}var EP=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,TP=`
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

}`,s_=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){let i=new wa(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=i}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,i=new cn({vertexShader:EP,fragmentShader:TP,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Ve(new Wr(20,20),i)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},o_=class extends pi{constructor(e,t){super();let i=this,r=null,s=1,o=null,a="local-floor",c=1,l=null,u=null,h=null,d=null,f=null,m=null,y=typeof XRWebGLBinding<"u",g=new s_,p={},S=t.getContextAttributes(),E=null,_=null,M=[],w=[],C=new fe,v=null,T=null,P=new Yt;P.viewport=new zt;let L=new Yt;L.viewport=new zt;let F=[P,L],V=new ah,N=null,B=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(Y){let te=M[Y];return te===void 0&&(te=new no,M[Y]=te),te.getTargetRaySpace()},this.getControllerGrip=function(Y){let te=M[Y];return te===void 0&&(te=new no,M[Y]=te),te.getGripSpace()},this.getHand=function(Y){let te=M[Y];return te===void 0&&(te=new no,M[Y]=te),te.getHandSpace()};function q(Y){let te=w.indexOf(Y.inputSource);if(te===-1)return;let ye=M[te];ye!==void 0&&(ye.update(Y.inputSource,Y.frame,l||o),ye.dispatchEvent({type:Y.type,data:Y.inputSource}))}function Z(){r.removeEventListener("select",q),r.removeEventListener("selectstart",q),r.removeEventListener("selectend",q),r.removeEventListener("squeeze",q),r.removeEventListener("squeezestart",q),r.removeEventListener("squeezeend",q),r.removeEventListener("end",Z),r.removeEventListener("inputsourceschange",se);for(let Y=0;Y<M.length;Y++){let te=w[Y];te!==null&&(w[Y]=null,M[Y].disconnect(te))}N=null,B=null,g.reset();for(let Y in p)delete p[Y];if(e.setRenderTarget(E),f=null,d=null,h=null,r=null,_=null,dt.stop(),i.isPresenting=!1,e.setPixelRatio(v),e.setSize(C.width,C.height,!1),T!==null){let Y=T.camera;Y.fov=T.fov,Y.zoom=T.zoom,Y.updateProjectionMatrix(),T=null}i.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(Y){s=Y,i.isPresenting===!0&&Xe("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(Y){a=Y,i.isPresenting===!0&&Xe("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(Y){l=Y},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return h===null&&y&&(h=new XRWebGLBinding(r,t)),h},this.getFrame=function(){return m},this.getSession=function(){return r},this.setSession=async function(Y){if(r=Y,r!==null){if(E=e.getRenderTarget(),r.addEventListener("select",q),r.addEventListener("selectstart",q),r.addEventListener("selectend",q),r.addEventListener("squeeze",q),r.addEventListener("squeezestart",q),r.addEventListener("squeezeend",q),r.addEventListener("end",Z),r.addEventListener("inputsourceschange",se),S.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(C),y&&"createProjectionLayer"in XRWebGLBinding.prototype){let ye=null,$e=null,Ae=null;S.depth&&(Ae=S.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ye=S.stencil?vr:fi,$e=S.stencil?uo:Vn);let qe={colorFormat:t.RGBA8,depthFormat:Ae,scaleFactor:s};h=this.getBinding(),d=h.createProjectionLayer(qe),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),_=new on(d.textureWidth,d.textureHeight,{format:En,type:Rn,depthTexture:new lr(d.textureWidth,d.textureHeight,$e,void 0,void 0,void 0,void 0,void 0,void 0,ye),stencilBuffer:S.stencil,colorSpace:e.outputColorSpace,samples:S.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{let ye={antialias:S.antialias,alpha:!0,depth:S.depth,stencil:S.stencil,framebufferScaleFactor:s};f=new XRWebGLLayer(r,t,ye),r.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),_=new on(f.framebufferWidth,f.framebufferHeight,{format:En,type:Rn,colorSpace:e.outputColorSpace,stencilBuffer:S.stencil,resolveDepthBuffer:f.ignoreDepthValues===!1,resolveStencilBuffer:f.ignoreDepthValues===!1,storeMultisampledDepthBuffer:f.ignoreDepthValues===!1,storeMultisampledStencilBuffer:f.ignoreDepthValues===!1})}_.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await r.requestReferenceSpace(a),dt.setContext(r),dt.start(),i.isPresenting=!0,i.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function se(Y){for(let te=0;te<Y.removed.length;te++){let ye=Y.removed[te],$e=w.indexOf(ye);$e>=0&&(w[$e]=null,M[$e].disconnect(ye))}for(let te=0;te<Y.added.length;te++){let ye=Y.added[te],$e=w.indexOf(ye);if($e===-1){for(let qe=0;qe<M.length;qe++)if(qe>=w.length){w.push(ye),$e=qe;break}else if(w[qe]===null){w[qe]=ye,$e=qe;break}if($e===-1)break}let Ae=M[$e];Ae&&Ae.connect(ye)}}let X=new I,ee=new I;function re(Y,te,ye){X.setFromMatrixPosition(te.matrixWorld),ee.setFromMatrixPosition(ye.matrixWorld);let $e=X.distanceTo(ee),Ae=te.projectionMatrix.elements,qe=ye.projectionMatrix.elements,ft=Ae[14]/(Ae[10]-1),ne=Ae[14]/(Ae[10]+1),le=(Ae[9]+1)/Ae[5],he=(Ae[9]-1)/Ae[5],J=(Ae[8]-1)/Ae[0],ae=(qe[8]+1)/qe[0],Ge=ft*J,Fe=ft*ae,We=$e/(-J+ae),je=We*-J;if(te.matrixWorld.decompose(Y.position,Y.quaternion,Y.scale),Y.translateX(je),Y.translateZ(We),Y.matrixWorld.compose(Y.position,Y.quaternion,Y.scale),Y.matrixWorldInverse.copy(Y.matrixWorld).invert(),Ae[10]===-1)Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse);else{let D=ft+We,ct=ne+We,it=Ge-je,A=Fe+($e-je),x=le*ne/ct*D,k=he*ne/ct*D;Y.projectionMatrix.makePerspective(it,A,x,k,D,ct),Y.projectionMatrixInverse.copy(Y.projectionMatrix).invert()}}function De(Y,te){te===null?Y.matrixWorld.copy(Y.matrix):Y.matrixWorld.multiplyMatrices(te.matrixWorld,Y.matrix),Y.matrixWorldInverse.copy(Y.matrixWorld).invert()}this.updateCamera=function(Y){if(r===null)return;let te=Y.near,ye=Y.far;g.texture!==null&&(g.depthNear>0&&(te=g.depthNear),g.depthFar>0&&(ye=g.depthFar)),V.near=L.near=P.near=te,V.far=L.far=P.far=ye,(N!==V.near||B!==V.far)&&(r.updateRenderState({depthNear:V.near,depthFar:V.far}),N=V.near,B=V.far),V.layers.mask=Y.layers.mask|6,P.layers.mask=V.layers.mask&-5,L.layers.mask=V.layers.mask&-3;let $e=Y.parent,Ae=V.cameras;De(V,$e);for(let qe=0;qe<Ae.length;qe++)De(Ae[qe],$e);Ae.length===2?re(V,P,L):V.projectionMatrix.copy(P.projectionMatrix),T===null&&Y.isPerspectiveCamera&&(T={camera:Y,fov:Y.fov,zoom:Y.zoom}),Re(Y,V,$e)};function Re(Y,te,ye){ye===null?Y.matrix.copy(te.matrixWorld):(Y.matrix.copy(ye.matrixWorld),Y.matrix.invert(),Y.matrix.multiply(te.matrixWorld)),Y.matrix.decompose(Y.position,Y.quaternion,Y.scale),Y.updateMatrixWorld(!0),Y.projectionMatrix.copy(te.projectionMatrix),Y.projectionMatrixInverse.copy(te.projectionMatrixInverse),Y.isPerspectiveCamera&&(Y.fov=eo*2*Math.atan(1/Y.projectionMatrix.elements[5]),Y.zoom=1)}this.getCamera=function(){return V},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(Y){c=Y,d!==null&&(d.fixedFoveation=Y),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=Y)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(V)},this.getCameraTexture=function(Y){return p[Y]};let ht=null;function nt(Y,te){if(u=te.getViewerPose(l||o),m=te,u!==null){let ye=u.views;f!==null&&(e.setRenderTargetFramebuffer(_,f.framebuffer),e.setRenderTarget(_));let $e=!1;ye.length!==V.cameras.length&&(V.cameras.length=0,$e=!0);for(let ne=0;ne<ye.length;ne++){let le=ye[ne],he=null;if(f!==null)he=f.getViewport(le);else{let ae=h.getViewSubImage(d,le);he=ae.viewport,ne===0&&(e.setRenderTargetTextures(_,ae.colorTexture,ae.depthStencilTexture),e.setRenderTarget(_))}let J=F[ne];J===void 0&&(J=new Yt,J.layers.enable(ne),J.viewport=new zt,F[ne]=J),J.matrix.fromArray(le.transform.matrix),J.matrix.decompose(J.position,J.quaternion,J.scale),J.projectionMatrix.fromArray(le.projectionMatrix),J.projectionMatrixInverse.copy(J.projectionMatrix).invert(),J.viewport.set(he.x,he.y,he.width,he.height),ne===0&&(V.matrix.copy(J.matrix),V.matrix.decompose(V.position,V.quaternion,V.scale)),$e===!0&&V.cameras.push(J)}let Ae=r.enabledFeatures;if(Ae&&Ae.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&y){h=i.getBinding();let ne=h.getDepthInformation(ye[0]);ne&&ne.isValid&&ne.texture&&g.init(ne,r.renderState)}if(Ae&&Ae.includes("camera-access")&&y){e.state.unbindTexture(),h=i.getBinding();for(let ne=0;ne<ye.length;ne++){let le=ye[ne].camera;if(le){let he=p[le];he||(he=new wa,p[le]=he);let J=h.getCameraImage(le);he.sourceTexture=J}}}}for(let ye=0;ye<M.length;ye++){let $e=w[ye],Ae=M[ye];$e!==null&&Ae!==void 0&&Ae.update($e,te,l||o)}ht&&ht(Y,te),te.detectedPlanes&&i.dispatchEvent({type:"planesdetected",data:te}),m=null}let dt=new KS;dt.setAnimationLoop(nt),this.setAnimationLoop=function(Y){ht=Y},this.dispose=function(){}}},AP=new mt,rM=new Qe;rM.set(-1,0,0,0,1,0,0,0,1);function RP(n,e){function t(g,p){g.matrixAutoUpdate===!0&&g.updateMatrix(),p.value.copy(g.matrix)}function i(g,p){p.color.getRGB(g.fogColor.value,Gx(n)),p.isFog?(g.fogNear.value=p.near,g.fogFar.value=p.far):p.isFogExp2&&(g.fogDensity.value=p.density)}function r(g,p,S,E,_){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(g,p):p.isMeshLambertMaterial?(s(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(g,p),h(g,p)):p.isMeshPhongMaterial?(s(g,p),u(g,p),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(g,p),d(g,p),p.isMeshPhysicalMaterial&&f(g,p,_)):p.isMeshMatcapMaterial?(s(g,p),m(g,p)):p.isMeshDepthMaterial?s(g,p):p.isMeshDistanceMaterial?(s(g,p),y(g,p)):p.isMeshNormalMaterial?s(g,p):p.isLineBasicMaterial?(o(g,p),p.isLineDashedMaterial&&a(g,p)):p.isPointsMaterial?c(g,p,S,E):p.isSpriteMaterial?l(g,p):p.isShadowMaterial?(g.color.value.copy(p.color),g.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(g,p){g.opacity.value=p.opacity,p.color&&g.diffuse.value.copy(p.color),p.emissive&&g.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.bumpMap&&(g.bumpMap.value=p.bumpMap,t(p.bumpMap,g.bumpMapTransform),g.bumpScale.value=p.bumpScale,p.side===Kt&&(g.bumpScale.value*=-1)),p.normalMap&&(g.normalMap.value=p.normalMap,t(p.normalMap,g.normalMapTransform),g.normalScale.value.copy(p.normalScale),p.side===Kt&&g.normalScale.value.negate()),p.displacementMap&&(g.displacementMap.value=p.displacementMap,t(p.displacementMap,g.displacementMapTransform),g.displacementScale.value=p.displacementScale,g.displacementBias.value=p.displacementBias),p.emissiveMap&&(g.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,g.emissiveMapTransform)),p.specularMap&&(g.specularMap.value=p.specularMap,t(p.specularMap,g.specularMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest);let S=e.get(p),E=S.envMap,_=S.envMapRotation;E&&(g.envMap.value=E,g.envMapRotation.value.setFromMatrix4(AP.makeRotationFromEuler(_)).transpose(),E.isCubeTexture&&E.isRenderTargetTexture===!1&&g.envMapRotation.value.premultiply(rM),g.reflectivity.value=p.reflectivity,g.ior.value=p.ior,g.refractionRatio.value=p.refractionRatio),p.lightMap&&(g.lightMap.value=p.lightMap,g.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,g.lightMapTransform)),p.aoMap&&(g.aoMap.value=p.aoMap,g.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,g.aoMapTransform))}function o(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform))}function a(g,p){g.dashSize.value=p.dashSize,g.totalSize.value=p.dashSize+p.gapSize,g.scale.value=p.scale}function c(g,p,S,E){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.size.value=p.size*S,g.scale.value=E*.5,p.map&&(g.map.value=p.map,t(p.map,g.uvTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function l(g,p){g.diffuse.value.copy(p.color),g.opacity.value=p.opacity,g.rotation.value=p.rotation,p.map&&(g.map.value=p.map,t(p.map,g.mapTransform)),p.alphaMap&&(g.alphaMap.value=p.alphaMap,t(p.alphaMap,g.alphaMapTransform)),p.alphaTest>0&&(g.alphaTest.value=p.alphaTest)}function u(g,p){g.specular.value.copy(p.specular),g.shininess.value=Math.max(p.shininess,1e-4)}function h(g,p){p.gradientMap&&(g.gradientMap.value=p.gradientMap)}function d(g,p){g.metalness.value=p.metalness,p.metalnessMap&&(g.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,g.metalnessMapTransform)),g.roughness.value=p.roughness,p.roughnessMap&&(g.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,g.roughnessMapTransform)),p.envMap&&(g.envMapIntensity.value=p.envMapIntensity)}function f(g,p,S){g.ior.value=p.ior,p.sheen>0&&(g.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),g.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(g.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,g.sheenColorMapTransform)),p.sheenRoughnessMap&&(g.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,g.sheenRoughnessMapTransform))),p.clearcoat>0&&(g.clearcoat.value=p.clearcoat,g.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(g.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,g.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(g.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,g.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(g.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,g.clearcoatNormalMapTransform),g.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Kt&&g.clearcoatNormalScale.value.negate())),p.dispersion>0&&(g.dispersion.value=p.dispersion),p.retroreflectivity>0&&(g.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(g.iridescence.value=p.iridescence,g.iridescenceIOR.value=p.iridescenceIOR,g.iridescenceThicknessMinimum.value=p.iridescenceThicknessRange[0],g.iridescenceThicknessMaximum.value=p.iridescenceThicknessRange[1],p.iridescenceMap&&(g.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,g.iridescenceMapTransform)),p.iridescenceThicknessMap&&(g.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,g.iridescenceThicknessMapTransform))),p.transmission>0&&(g.transmission.value=p.transmission,g.transmissionSamplerMap.value=S.texture,g.transmissionSamplerSize.value.set(S.width,S.height),p.transmissionMap&&(g.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,g.transmissionMapTransform)),g.thickness.value=p.thickness,p.thicknessMap&&(g.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,g.thicknessMapTransform)),g.attenuationDistance.value=p.attenuationDistance,g.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(g.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(g.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,g.anisotropyMapTransform))),g.specularIntensity.value=p.specularIntensity,g.specularColor.value.copy(p.specularColor),p.specularColorMap&&(g.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,g.specularColorMapTransform)),p.specularIntensityMap&&(g.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,g.specularIntensityMapTransform))}function m(g,p){p.matcap&&(g.matcap.value=p.matcap)}function y(g,p){let S=e.get(p).light;g.referencePosition.value.setFromMatrixPosition(S.matrixWorld),g.nearDistance.value=S.shadow.camera.near,g.farDistance.value=S.shadow.camera.far}return{refreshFogUniforms:i,refreshMaterialUniforms:r}}function CP(n,e,t,i){let r={},s={},o=[],a=n.getParameter(n.MAX_UNIFORM_BUFFER_BINDINGS);function c(_,M){let w=M.program;i.uniformBlockBinding(_,w)}function l(_,M){let w=r[_.id];w===void 0&&(g(_),w=u(_),r[_.id]=w,_.addEventListener("dispose",S));let C=M.program;i.updateUBOMapping(_,C);let v=e.render.frame;s[_.id]!==v&&(d(_),s[_.id]=v)}function u(_){let M=h();_.__bindingPointIndex=M;let w=n.createBuffer(),C=_.__size,v=_.usage;return n.bindBuffer(n.UNIFORM_BUFFER,w),n.bufferData(n.UNIFORM_BUFFER,C,v),n.bindBuffer(n.UNIFORM_BUFFER,null),n.bindBufferBase(n.UNIFORM_BUFFER,M,w),w}function h(){for(let _=0;_<a;_++)if(o.indexOf(_)===-1)return o.push(_),_;return Je("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(_){let M=r[_.id],w=_.uniforms,C=_.__cache;n.bindBuffer(n.UNIFORM_BUFFER,M);for(let v=0,T=w.length;v<T;v++){let P=w[v];if(Array.isArray(P))for(let L=0,F=P.length;L<F;L++)f(P[L],v,L,C);else f(P,v,0,C)}n.bindBuffer(n.UNIFORM_BUFFER,null)}function f(_,M,w,C){if(y(_,M,w,C)===!0){let v=_.__offset,T=_.value;if(Array.isArray(T)){let P=0;for(let L=0;L<T.length;L++){let F=T[L],V=p(F);m(F,_.__data,P),typeof F!="number"&&typeof F!="boolean"&&!F.isMatrix3&&!ArrayBuffer.isView(F)&&(P+=V.storage/Float32Array.BYTES_PER_ELEMENT)}}else m(T,_.__data,0);n.bufferSubData(n.UNIFORM_BUFFER,v,_.__data)}}function m(_,M,w){typeof _=="number"||typeof _=="boolean"?M[0]=_:_.isMatrix3?(M[0]=_.elements[0],M[1]=_.elements[1],M[2]=_.elements[2],M[3]=0,M[4]=_.elements[3],M[5]=_.elements[4],M[6]=_.elements[5],M[7]=0,M[8]=_.elements[6],M[9]=_.elements[7],M[10]=_.elements[8],M[11]=0):ArrayBuffer.isView(_)?M.set(new _.constructor(_.buffer,_.byteOffset,M.length)):_.toArray(M,w)}function y(_,M,w,C){let v=_.value,T=M+"_"+w;if(C[T]===void 0)return typeof v=="number"||typeof v=="boolean"?C[T]=v:ArrayBuffer.isView(v)?C[T]=v.slice():C[T]=v.clone(),!0;{let P=C[T];if(typeof v=="number"||typeof v=="boolean"){if(P!==v)return C[T]=v,!0}else{if(ArrayBuffer.isView(v))return!0;if(P.equals(v)===!1)return P.copy(v),!0}}return!1}function g(_){let M=_.uniforms,w=0,C=16;for(let T=0,P=M.length;T<P;T++){let L=Array.isArray(M[T])?M[T]:[M[T]];for(let F=0,V=L.length;F<V;F++){let N=L[F],B=Array.isArray(N.value)?N.value:[N.value];for(let q=0,Z=B.length;q<Z;q++){let se=B[q],X=p(se),ee=w%C,re=ee%X.boundary,De=ee+re;w+=re,De!==0&&C-De<X.storage&&(w+=C-De),N.__data=new Float32Array(X.storage/Float32Array.BYTES_PER_ELEMENT),N.__offset=w,w+=X.storage}}}let v=w%C;return v>0&&(w+=C-v),_.__size=w,_.__cache={},this}function p(_){let M={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(M.boundary=4,M.storage=4):_.isVector2?(M.boundary=8,M.storage=8):_.isVector3||_.isColor?(M.boundary=16,M.storage=12):_.isVector4?(M.boundary=16,M.storage=16):_.isMatrix3?(M.boundary=48,M.storage=48):_.isMatrix4?(M.boundary=64,M.storage=64):_.isTexture?Xe("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(_)?(M.boundary=16,M.storage=_.byteLength):Xe("WebGLRenderer: Unsupported uniform value type.",_),M}function S(_){let M=_.target;M.removeEventListener("dispose",S);let w=o.indexOf(M.__bindingPointIndex);o.splice(w,1),n.deleteBuffer(r[M.id]),delete r[M.id],delete s[M.id]}function E(){for(let _ in r)n.deleteBuffer(r[_]);o=[],r={},s={}}return{bind:c,update:l,dispose:E}}var PP=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),gi=null;function IP(){return gi===null&&(gi=new Kn(PP,16,16,yr,ei),gi.name="DFG_LUT",gi.minFilter=jt,gi.magFilter=jt,gi.wrapS=hi,gi.wrapT=hi,gi.generateMipmaps=!1,gi.needsUpdate=!0),gi}var Qh=class{constructor(e={}){let{canvas:t=vS(),context:i=null,depth:r=!0,stencil:s=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:h=!1,reversedDepthBuffer:d=!1,outputBufferType:f=Rn}=e;this.isWebGLRenderer=!0;let m;if(i!==null){if(typeof WebGLRenderingContext<"u"&&i instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");m=i.getContextAttributes().alpha}else m=o;let y=f,g=new Set([mh,ph,Za]),p=new Set([Rn,Vn,lo,uo,dh,fh]),S=new Uint32Array(4),E=new Int32Array(4),_=new I,M=null,w=null,C=[],v=[],T=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Qn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let P=this,L=!1,F=null,V=null,N=null,B=null;this._outputColorSpace=xn;let q=0,Z=0,se=null,X=-1,ee=null,re=new zt,De=new zt,Re=null,ht=new Pe(0),nt=0,dt=t.width,Y=t.height,te=1,ye=null,$e=null,Ae=new zt(0,0,dt,Y),qe=new zt(0,0,dt,Y),ft=!1,ne=new Di,le=!1,he=!1,J=new mt,ae=new I,Ge=new zt,Fe={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},We=!1;function je(){return se===null?te:1}let D=i;function ct(b,z){return t.getContext(b,z)}let it,A,x,k,$,j,pe,me,K,ie,ge,ke,be,xe,Be,Ze,et,U,_e,Q,ve,Te,oe;try{let b={alpha:!0,depth:r,stencil:s,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:h};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"186"}`),t.addEventListener("webglcontextlost",Pt,!1),t.addEventListener("webglcontextrestored",vt,!1),t.addEventListener("webglcontextcreationerror",Wn,!1),D===null){let z="webgl2";if(D=ct(z,b),D===null)throw ct(z)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}He()}catch(b){throw t.removeEventListener("webglcontextlost",Pt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",Wn,!1),Je("WebGLRenderer: "+b.message),b}function He(){it=new F2(D),it.init(),ve=new wP(D,it),A=new R2(D,it,e,ve),x=new SP(D,it),A.reversedDepthBuffer&&d&&x.buffers.depth.setReversed(!0),V=D.createFramebuffer(),N=D.createFramebuffer(),B=D.createFramebuffer(),k=new H2(D),$=new cP,j=new MP(D,it,x,$,A,ve,k),pe=new O2(P),me=new VT(D),Te=new T2(D,me),K=new k2(D,me,k,Te),ie=new V2(D,K,me,Te,k),U=new G2(D,A,j),Be=new C2($),ge=new aP(P,pe,it,A,Te,Be),ke=new RP(P,$),be=new uP,xe=new gP(it),et=new E2(P,pe,x,ie,m,c),Ze=new bP(P,ie,A),oe=new CP(D,k,A,x),_e=new A2(D,it,k),Q=new B2(D,it,k),k.programs=ge.programs,P.capabilities=A,P.extensions=it,P.properties=$,P.renderLists=be,P.shadowMap=Ze,P.state=x,P.info=k}y!==Rn&&(T=new W2(y,t.width,t.height,a,r,s));let Ue=new o_(P,D);this.xr=Ue,this.getContext=function(){return D},this.getContextAttributes=function(){return D.getContextAttributes()},this.forceContextLoss=function(){let b=it.get("WEBGL_lose_context");b&&b.loseContext()},this.forceContextRestore=function(){let b=it.get("WEBGL_lose_context");b&&b.restoreContext()},this.getPixelRatio=function(){return te},this.setPixelRatio=function(b){b!==void 0&&(te=b,this.setSize(dt,Y,!1))},this.getSize=function(b){return b.set(dt,Y)},this.setSize=function(b,z,W=!0){if(Ue.isPresenting){Xe("WebGLRenderer: Can't change size while VR device is presenting.");return}dt=b,Y=z,t.width=Math.floor(b*te),t.height=Math.floor(z*te),W===!0&&(t.style.width=b+"px",t.style.height=z+"px"),T!==null&&T.setSize(t.width,t.height),this.setViewport(0,0,b,z)},this.getDrawingBufferSize=function(b){return b.set(dt*te,Y*te).floor()},this.setDrawingBufferSize=function(b,z,W){dt=b,Y=z,te=W,t.width=Math.floor(b*W),t.height=Math.floor(z*W),this.setViewport(0,0,b,z)},this.setEffects=function(b){if(y===Rn){Je("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(b){for(let z=0;z<b.length;z++)if(b[z].isOutputPass===!0){Xe("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}T.setEffects(b||[])},this.getCurrentViewport=function(b){return b.copy(re)},this.getViewport=function(b){return b.copy(Ae)},this.setViewport=function(b,z,W,H){b.isVector4?Ae.set(b.x,b.y,b.z,b.w):Ae.set(b,z,W,H),x.viewport(re.copy(Ae).multiplyScalar(te).round())},this.getScissor=function(b){return b.copy(qe)},this.setScissor=function(b,z,W,H){b.isVector4?qe.set(b.x,b.y,b.z,b.w):qe.set(b,z,W,H),x.scissor(De.copy(qe).multiplyScalar(te).round())},this.getScissorTest=function(){return ft},this.setScissorTest=function(b){x.setScissorTest(ft=b)},this.setOpaqueSort=function(b){ye=b},this.setTransparentSort=function(b){$e=b},this.getClearColor=function(b){return b.copy(et.getClearColor())},this.setClearColor=function(){et.setClearColor(...arguments)},this.getClearAlpha=function(){return et.getClearAlpha()},this.setClearAlpha=function(){et.setClearAlpha(...arguments)},this.clear=function(b=!0,z=!0,W=!0){let H=0;if(b){let G=!1;if(se!==null){let Ee=se.texture.format;G=g.has(Ee)}if(G){let Ee=se.texture.type,Ie=p.has(Ee),we=et.getClearColor(),Ne=et.getClearAlpha(),Oe=we.r,rt=we.g,lt=we.b;Ie?(S[0]=Oe,S[1]=rt,S[2]=lt,S[3]=Ne,D.clearBufferuiv(D.COLOR,0,S)):(E[0]=Oe,E[1]=rt,E[2]=lt,E[3]=Ne,D.clearBufferiv(D.COLOR,0,E))}else H|=D.COLOR_BUFFER_BIT}z&&(H|=D.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(H|=D.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),H!==0&&D.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(b){b.setRenderer(this),F=b},this.dispose=function(){t.removeEventListener("webglcontextlost",Pt,!1),t.removeEventListener("webglcontextrestored",vt,!1),t.removeEventListener("webglcontextcreationerror",Wn,!1),et.dispose(),be.dispose(),xe.dispose(),$.dispose(),pe.dispose(),ie.dispose(),Te.dispose(),oe.dispose(),ge.dispose(),Ue.dispose(),Ue.removeEventListener("sessionstart",w_),Ue.removeEventListener("sessionend",E_),wr.stop()};function Pt(b){b.preventDefault(),kx("WebGLRenderer: Context Lost."),L=!0}function vt(){kx("WebGLRenderer: Context Restored."),L=!1;let b=k.autoReset,z=Ze.enabled,W=Ze.autoUpdate,H=Ze.needsUpdate,G=Ze.type;He(),k.autoReset=b,Ze.enabled=z,Ze.autoUpdate=W,Ze.needsUpdate=H,Ze.type=G}function Wn(b){Je("WebGLRenderer: A WebGL context could not be created. Reason: ",b.statusMessage)}function ni(b){let z=b.target;z.removeEventListener("dispose",ni),ZM(z)}function ZM(b){XM(b),$.remove(b)}function XM(b){let z=$.get(b).programs;z!==void 0&&(z.forEach(function(W){ge.releaseProgram(W)}),b.isShaderMaterial&&ge.releaseShaderCache(b))}this.renderBufferDirect=function(b,z,W,H,G,Ee){z===null&&(z=Fe);let Ie=G.isMesh&&G.matrixWorld.determinantAffine()<0,we=JM(b,z,W,H,G);x.setMaterial(H,Ie);let Ne=W.index,Oe=1;if(H.wireframe===!0){if(Ne=K.getWireframeAttribute(W),Ne===void 0)return;Oe=2}let rt=W.drawRange,lt=W.attributes.position,Le=rt.start*Oe,yt=(rt.start+rt.count)*Oe;Ee!==null&&(Le=Math.max(Le,Ee.start*Oe),yt=Math.min(yt,(Ee.start+Ee.count)*Oe)),Ne!==null?(Le=Math.max(Le,0),yt=Math.min(yt,Ne.count)):lt!=null&&(Le=Math.max(Le,0),yt=Math.min(yt,lt.count));let Gt=yt-Le;if(Gt<0||Gt===1/0)return;Te.setup(G,H,we,W,Ne);let Dt,At=_e;if(Ne!==null&&(Dt=me.get(Ne),At=Q,At.setIndex(Dt)),G.isMesh)H.wireframe===!0?(x.setLineWidth(H.wireframeLinewidth*je()),At.setMode(D.LINES)):At.setMode(D.TRIANGLES);else if(G.isLine){let Qt=H.linewidth;Qt===void 0&&(Qt=1),x.setLineWidth(Qt*je()),G.isLineSegments?At.setMode(D.LINES):G.isLineLoop?At.setMode(D.LINE_LOOP):At.setMode(D.LINE_STRIP)}else G.isPoints?At.setMode(D.POINTS):G.isSprite&&At.setMode(D.TRIANGLES);if(G.isBatchedMesh)if(it.get("WEBGL_multi_draw"))At.renderMultiDraw(G._multiDrawStarts,G._multiDrawCounts,G._multiDrawCount);else{let Qt=G._multiDrawStarts,Ce=G._multiDrawCounts,un=G._multiDrawCount,pt=Ne?me.get(Ne).bytesPerElement:1,On=$.get(H).currentProgram.getUniforms();for(let ii=0;ii<un;ii++)On.setValue(D,"_gl_DrawID",ii),At.render(Qt[ii]/pt,Ce[ii])}else if(G.isInstancedMesh)At.renderInstances(Le,Gt,G.count);else if(W.isInstancedBufferGeometry){let Qt=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,Ce=Math.min(W.instanceCount,Qt);At.renderInstances(Le,Gt,Ce)}else At.render(Le,Gt)};function M_(b,z,W,H){F!==null&&b.isNodeMaterial&&F.setObject(H,b),le===!0&&Be.setState(b,W,!1),b.transparent===!0&&b.side===Gn&&b.forceSinglePass===!1?(b.side=Kt,b.needsUpdate=!0,cc(b,z,H),b.side=gr,b.needsUpdate=!0,cc(b,z,H),b.side=Gn):cc(b,z,H)}this.compile=function(b,z,W=null){W===null&&(W=b),F!==null&&F.renderStart(b,z,W),w=xe.get(W),w.init(z),v.push(w),W.traverseVisible(function(G){G.isLight&&G.layers.test(z.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),b!==W&&b.traverseVisible(function(G){G.isLight&&G.layers.test(z.layers)&&(w.pushLight(G),G.castShadow&&w.pushShadow(G))}),w.setupLights(),F!==null&&F.updateLights(w.state.lightsArray),he=this.localClippingEnabled,le=Be.init(this.clippingPlanes,he),le===!0&&Be.setGlobalState(this.clippingPlanes,z),F!==null&&Ze.render(w.state.shadowsArray,W,z);let H=new Set;return b.traverse(function(G){if(!(G.isMesh||G.isPoints||G.isLine||G.isSprite))return;let Ee=G.material;if(Ee)if(Array.isArray(Ee))for(let Ie=0;Ie<Ee.length;Ie++){let we=Ee[Ie];M_(we,W,z,G),H.add(we)}else M_(Ee,W,z,G),H.add(Ee)}),w=v.pop(),F!==null&&F.renderEnd(),H},this.compileAsync=function(b,z,W=null){let H=this.compile(b,z,W);return new Promise(G=>{function Ee(){if(H.forEach(function(Ie){let Ne=$.get(Ie).currentProgram;(Ne===void 0||Ne.isReady())&&H.delete(Ie)}),H.size===0){G(b);return}setTimeout(Ee,10)}it.get("KHR_parallel_shader_compile")!==null?Ee():setTimeout(Ee,10)})};let bd=null;function qM(b){bd&&bd(b)}function w_(){wr.stop()}function E_(){wr.start()}let wr=new KS;wr.setAnimationLoop(qM),typeof self<"u"&&wr.setContext(self),this.setAnimationLoop=function(b){bd=b,Ue.setAnimationLoop(b),b===null?wr.stop():wr.start()},Ue.addEventListener("sessionstart",w_),Ue.addEventListener("sessionend",E_),this.render=function(b,z){if(z!==void 0&&z.isCamera!==!0){Je("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(L===!0)return;F!==null&&F.renderStart(b,z);let W=Ue.enabled===!0&&Ue.isPresenting===!0,H=T!==null&&(se===null||W)&&T.begin(P,se);if(b.matrixWorldAutoUpdate===!0&&b.updateMatrixWorld(),z.parent===null&&z.matrixWorldAutoUpdate===!0&&z.updateMatrixWorld(),Ue.enabled===!0&&Ue.isPresenting===!0&&(T===null||T.isCompositing()===!1)&&(Ue.cameraAutoUpdate===!0&&Ue.updateCamera(z),z=Ue.getCamera()),b.isScene===!0&&b.onBeforeRender(P,b,z,se),w=xe.get(b,v.length),w.init(z),w.state.textureUnits=j.getTextureUnits(),v.push(w),J.multiplyMatrices(z.projectionMatrix,z.matrixWorldInverse),ne.setFromProjectionMatrix(J,Bn,z.reversedDepth),he=this.localClippingEnabled,le=Be.init(this.clippingPlanes,he),M=be.get(b,C.length),M.init(),C.push(M),Ue.enabled===!0&&Ue.isPresenting===!0){let Ie=P.xr.getDepthSensingMesh();Ie!==null&&Sd(Ie,z,-1/0,P.sortObjects)}Sd(b,z,0,P.sortObjects),M.finish(),F!==null&&F.updateLights(w.state.lightsArray),P.sortObjects===!0&&M.sort(ye,$e),We=Ue.enabled===!1||Ue.isPresenting===!1||Ue.hasDepthSensing()===!1,We&&et.addToRenderList(M,b),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),le===!0&&Be.beginShadows();let G=w.state.shadowsArray;if(Ze.render(G,b,z),le===!0&&Be.endShadows(),(H&&T.hasRenderPass())===!1){let Ie=M.opaque,we=M.transmissive;if(w.setupLights(),z.isArrayCamera){let Ne=z.cameras;if(we.length>0)for(let Oe=0,rt=Ne.length;Oe<rt;Oe++){let lt=Ne[Oe];A_(Ie,we,b,lt)}We&&et.render(b);for(let Oe=0,rt=Ne.length;Oe<rt;Oe++){let lt=Ne[Oe];T_(M,b,lt,lt.viewport)}}else we.length>0&&A_(Ie,we,b,z),We&&et.render(b),T_(M,b,z)}se!==null&&Z===0&&(j.updateMultisampleRenderTarget(se),j.updateRenderTargetMipmap(se)),H&&T.end(P),b.isScene===!0&&b.onAfterRender(P,b,z),Te.resetDefaultState(),X=-1,ee=null,v.pop(),v.length>0?(w=v[v.length-1],j.setTextureUnits(w.state.textureUnits),le===!0&&Be.setGlobalState(P.clippingPlanes,w.state.camera)):w=null,C.pop(),C.length>0?M=C[C.length-1]:M=null,F!==null&&F.renderEnd()};function Sd(b,z,W,H){if(b.visible===!1)return;if(b.layers.test(z.layers)){if(b.isGroup)W=b.renderOrder;else if(b.isLOD)b.autoUpdate===!0&&b.update(z);else if(b.isLightProbeGrid)w.pushLightProbeGrid(b);else if(b.isLight)w.pushLight(b),b.castShadow&&w.pushShadow(b);else if(b.isSprite){if(!b.frustumCulled||b.intersectsFrustum(ne)){H&&Ge.setFromMatrixPosition(b.matrixWorld).applyMatrix4(J);let Ie=ie.update(b),we=b.material;we.visible&&M.push(b,Ie,we,W,Ge.z,null,z)}}else if((b.isMesh||b.isLine||b.isPoints)&&(!b.frustumCulled||b.intersectsFrustum(ne))){let Ie=ie.update(b),we=b.material;if(H&&(b.boundingSphere!==void 0?(b.boundingSphere===null&&b.computeBoundingSphere(),Ge.copy(b.boundingSphere.center)):(Ie.boundingSphere===null&&Ie.computeBoundingSphere(),Ge.copy(Ie.boundingSphere.center)),Ge.applyMatrix4(b.matrixWorld).applyMatrix4(J)),Array.isArray(we)){let Ne=Ie.groups;for(let Oe=0,rt=Ne.length;Oe<rt;Oe++){let lt=Ne[Oe],Le=we[lt.materialIndex];Le&&Le.visible&&M.push(b,Ie,Le,W,Ge.z,lt,z)}}else we.visible&&M.push(b,Ie,we,W,Ge.z,null,z)}}let Ee=b.children;for(let Ie=0,we=Ee.length;Ie<we;Ie++)Sd(Ee[Ie],z,W,H)}function T_(b,z,W,H){let{opaque:G,transmissive:Ee,transparent:Ie}=b;w.setupLightsView(W),le===!0&&Be.setGlobalState(P.clippingPlanes,W),H&&x.viewport(re.copy(H)),G.length>0&&ac(G,z,W),Ee.length>0&&ac(Ee,z,W),Ie.length>0&&ac(Ie,z,W),x.buffers.depth.setTest(!0),x.buffers.depth.setMask(!0),x.buffers.color.setMask(!0),x.setPolygonOffset(!1)}function A_(b,z,W,H){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(w.state.transmissionRenderTarget[H.id]===void 0){let Le=it.has("EXT_color_buffer_half_float")||it.has("EXT_color_buffer_float");w.state.transmissionRenderTarget[H.id]=new on(1,1,{generateMipmaps:!0,type:Le?ei:Rn,minFilter:_r,samples:Math.max(4,A.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:ut.workingColorSpace})}let Ee=w.state.transmissionRenderTarget[H.id],Ie=H.viewport||re;Ee.setSize(Ie.z*P.transmissionResolutionScale,Ie.w*P.transmissionResolutionScale);let we=P.getRenderTarget(),Ne=P.getActiveCubeFace(),Oe=P.getActiveMipmapLevel();P.setRenderTarget(Ee),P.getClearColor(ht),nt=P.getClearAlpha(),nt<1&&P.setClearColor(16777215,.5),P.clear(),We&&et.render(W);let rt=P.toneMapping;P.toneMapping=Qn;let lt=H.viewport;if(H.viewport!==void 0&&(H.viewport=void 0),w.setupLightsView(H),le===!0&&Be.setGlobalState(P.clippingPlanes,H),ac(b,W,H),j.updateMultisampleRenderTarget(Ee),j.updateRenderTargetMipmap(Ee),it.has("WEBGL_multisampled_render_to_texture")===!1){let Le=!1;for(let yt=0,Gt=z.length;yt<Gt;yt++){let Dt=z[yt],{object:At,geometry:Qt,material:Ce,group:un}=Dt;if(Ce.side===Gn&&At.layers.test(H.layers)){let pt=Ce.side;Ce.side=Kt,Ce.needsUpdate=!0,R_(At,W,H,Qt,Ce,un),Ce.side=pt,Ce.needsUpdate=!0,Le=!0}}Le===!0&&(j.updateMultisampleRenderTarget(Ee),j.updateRenderTargetMipmap(Ee))}P.setRenderTarget(we,Ne,Oe),P.setClearColor(ht,nt),lt!==void 0&&(H.viewport=lt),P.toneMapping=rt}function ac(b,z,W){let H=z.isScene===!0?z.overrideMaterial:null;for(let G=0,Ee=b.length;G<Ee;G++){let Ie=b[G],{object:we,geometry:Ne,group:Oe}=Ie,rt=Ie.material;rt.allowOverride===!0&&H!==null&&(rt=H),we.layers.test(W.layers)&&R_(we,z,W,Ne,rt,Oe)}}function R_(b,z,W,H,G,Ee){F!==null&&G.isNodeMaterial&&F.setObject(b,G),b.onBeforeRender(P,z,W,H,G,Ee),b.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,b.matrixWorld),b.normalMatrix.getNormalMatrix(b.modelViewMatrix),G.onBeforeRender(P,z,W,H,b,Ee),G.transparent===!0&&G.side===Gn&&G.forceSinglePass===!1?(G.side=Kt,G.needsUpdate=!0,P.renderBufferDirect(W,z,H,G,b,Ee),G.side=gr,G.needsUpdate=!0,P.renderBufferDirect(W,z,H,G,b,Ee),G.side=Gn):P.renderBufferDirect(W,z,H,G,b,Ee),b.onAfterRender(P,z,W,H,G,Ee)}function cc(b,z,W){z.isScene!==!0&&(z=Fe);let H=$.get(b),G=w.state.lights,Ee=w.state.shadowsArray,Ie=G.state.version,we=ge.getParameters(b,G.state,Ee,z,W,w.state.lightProbeGridArray),Ne=ge.getProgramCacheKey(we),Oe=H.programs;H.environment=b.isMeshStandardMaterial||b.isMeshLambertMaterial||b.isMeshPhongMaterial?z.environment:null,H.fog=z.fog;let rt=b.isMeshStandardMaterial||b.isMeshLambertMaterial&&!b.envMap||b.isMeshPhongMaterial&&!b.envMap;H.envMap=pe.get(b.envMap||H.environment,rt),H.envMapRotation=H.environment!==null&&b.envMap===null?z.environmentRotation:b.envMapRotation,Oe===void 0&&(b.addEventListener("dispose",ni),Oe=new Map,H.programs=Oe);let lt=Oe.get(Ne);if(lt!==void 0){if(H.currentProgram===lt&&H.lightsStateVersion===Ie)return P_(b,we),lt}else we.uniforms=ge.getUniforms(b),F!==null&&b.isNodeMaterial&&F.build(b,W,we),b.onBeforeCompile(we,P),lt=ge.acquireProgram(we,Ne),Oe.set(Ne,lt),H.uniforms=we.uniforms;let Le=H.uniforms;return(!b.isShaderMaterial&&!b.isRawShaderMaterial||b.clipping===!0)&&(Le.clippingPlanes=Be.uniform),P_(b,we),H.needsLights=KM(b),H.lightsStateVersion=Ie,H.needsLights&&(Le.ambientLightColor.value=G.state.ambient,Le.lightProbe.value=G.state.probe,Le.sunLights.value=G.state.sun,Le.sunLightShadows.value=G.state.sunShadow,Le.directionalLights.value=G.state.directional,Le.directionalLightShadows.value=G.state.directionalShadow,Le.spotLights.value=G.state.spot,Le.spotLightShadows.value=G.state.spotShadow,Le.rectAreaLights.value=G.state.rectArea,Le.ltc_1.value=G.state.rectAreaLTC1,Le.ltc_2.value=G.state.rectAreaLTC2,Le.pointLights.value=G.state.point,Le.pointLightShadows.value=G.state.pointShadow,Le.hemisphereLights.value=G.state.hemi,Le.sunShadowMatrix.value=G.state.sunShadowMatrix,Le.sunShadowCascade.value=G.state.sunShadowCascade,Le.directionalShadowMatrix.value=G.state.directionalShadowMatrix,Le.spotLightMatrix.value=G.state.spotLightMatrix,Le.spotLightMap.value=G.state.spotLightMap,Le.pointShadowMatrix.value=G.state.pointShadowMatrix),H.lightProbeGrid=w.state.lightProbeGridArray.length>0,H.currentProgram=lt,H.uniformsList=null,lt}function C_(b){if(b.uniformsList===null){let z=b.currentProgram.getUniforms();b.uniformsList=po.seqWithValue(z.seq,b.uniforms)}return b.uniformsList}function P_(b,z){let W=$.get(b);W.outputColorSpace=z.outputColorSpace,W.batching=z.batching,W.batchingColor=z.batchingColor,W.instancing=z.instancing,W.instancingColor=z.instancingColor,W.instancingMorph=z.instancingMorph,W.skinning=z.skinning,W.morphTargets=z.morphTargets,W.morphNormals=z.morphNormals,W.morphColors=z.morphColors,W.morphTargetsCount=z.morphTargetsCount,W.numClippingPlanes=z.numClippingPlanes,W.numIntersection=z.numClipIntersection,W.vertexAlphas=z.vertexAlphas,W.vertexTangents=z.vertexTangents,W.toneMapping=z.toneMapping}function YM(b,z){if(b.length===0)return null;if(b.length===1)return b[0].texture!==null?b[0]:null;_.setFromMatrixPosition(z.matrixWorld);for(let W=0,H=b.length;W<H;W++){let G=b[W];if(G.texture!==null&&G.boundingBox.containsPoint(_))return G}return null}function JM(b,z,W,H,G){z.isScene!==!0&&(z=Fe),j.resetTextureUnits();let Ee=z.fog,Ie=H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial?z.environment:null,we=se===null?P.outputColorSpace:se.isXRRenderTarget===!0?se.texture.colorSpace:ut.workingColorSpace,Ne=H.isMeshStandardMaterial||H.isMeshLambertMaterial&&!H.envMap||H.isMeshPhongMaterial&&!H.envMap,Oe=pe.get(H.envMap||Ie,Ne),rt=H.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,lt=!!W.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),Le=!!W.morphAttributes.position,yt=!!W.morphAttributes.normal,Gt=!!W.morphAttributes.color,Dt=Qn;H.toneMapped&&(se===null||se.isXRRenderTarget===!0)&&(Dt=P.toneMapping);let At=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Qt=At!==void 0?At.length:0,Ce=$.get(H),un=w.state.lights;if(le===!0&&(he===!0||b!==ee)){let It=b===ee&&H.id===X;Be.setState(H,b,It)}let pt=!1;H.version===Ce.__version?(Ce.needsLights&&Ce.lightsStateVersion!==un.state.version||Ce.outputColorSpace!==we||G.isBatchedMesh&&Ce.batching===!1||!G.isBatchedMesh&&Ce.batching===!0||G.isBatchedMesh&&Ce.batchingColor===!0&&G._colorsTexture===null||G.isBatchedMesh&&Ce.batchingColor===!1&&G._colorsTexture!==null||G.isInstancedMesh&&Ce.instancing===!1||!G.isInstancedMesh&&Ce.instancing===!0||G.isSkinnedMesh&&Ce.skinning===!1||!G.isSkinnedMesh&&Ce.skinning===!0||G.isInstancedMesh&&Ce.instancingColor===!0&&G.instanceColor===null||G.isInstancedMesh&&Ce.instancingColor===!1&&G.instanceColor!==null||G.isInstancedMesh&&Ce.instancingMorph===!0&&G.morphTexture===null||G.isInstancedMesh&&Ce.instancingMorph===!1&&G.morphTexture!==null||Ce.envMap!==Oe||H.fog===!0&&Ce.fog!==Ee||Ce.numClippingPlanes!==void 0&&(Ce.numClippingPlanes!==Be.numPlanes||Ce.numIntersection!==Be.numIntersection)||Ce.vertexAlphas!==rt||Ce.vertexTangents!==lt||Ce.morphTargets!==Le||Ce.morphNormals!==yt||Ce.morphColors!==Gt||Ce.toneMapping!==Dt||Ce.morphTargetsCount!==Qt||!!Ce.lightProbeGrid!=w.state.lightProbeGridArray.length>0)&&(pt=!0):(pt=!0,Ce.__version=H.version);let On=Ce.currentProgram;pt===!0&&(On=cc(H,z,G),F&&H.isNodeMaterial&&F.onUpdateProgram(H,On,Ce));let ii=!1,Bi=!1,ns=!1,wt=On.getUniforms(),Bt=Ce.uniforms;if(x.useProgram(On.program)&&(ii=!0,Bi=!0,ns=!0),H.id!==X&&(X=H.id,Bi=!0),Ce.needsLights){let It=YM(w.state.lightProbeGridArray,G);Ce.lightProbeGrid!==It&&(Ce.lightProbeGrid=It,Bi=!0)}if(ii||ee!==b){x.buffers.depth.getReversed()&&b.reversedDepth!==!0&&(b._reversedDepth=!0,b.updateProjectionMatrix()),wt.setValue(D,"projectionMatrix",b.projectionMatrix),wt.setValue(D,"viewMatrix",b.matrixWorldInverse);let Gi=wt.map.cameraPosition;Gi!==void 0&&Gi.setValue(D,ae.setFromMatrixPosition(b.matrixWorld)),A.logarithmicDepthBuffer&&wt.setValue(D,"logDepthBufFC",2/(Math.log(b.far+1)/Math.LN2)),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&wt.setValue(D,"isOrthographic",b.isOrthographicCamera===!0),ee!==b&&(ee=b,Bi=!0,ns=!0)}if(Ce.needsLights&&(un.state.sunShadowMap.length>0&&wt.setValue(D,"sunShadowMap",un.state.sunShadowMap,j),un.state.directionalShadowMap.length>0&&wt.setValue(D,"directionalShadowMap",un.state.directionalShadowMap,j),un.state.spotShadowMap.length>0&&wt.setValue(D,"spotShadowMap",un.state.spotShadowMap,j),un.state.pointShadowMap.length>0&&wt.setValue(D,"pointShadowMap",un.state.pointShadowMap,j)),G.isSkinnedMesh){wt.setOptional(D,G,"bindMatrix"),wt.setOptional(D,G,"bindMatrixInverse");let It=G.skeleton;It&&(It.boneTexture===null&&It.computeBoneTexture(),wt.setValue(D,"boneTexture",It.boneTexture,j))}G.isBatchedMesh&&(wt.setOptional(D,G,"batchingTexture"),wt.setValue(D,"batchingTexture",G._matricesTexture,j),wt.setOptional(D,G,"batchingIdTexture"),wt.setValue(D,"batchingIdTexture",G._indirectTexture,j),wt.setOptional(D,G,"batchingColorTexture"),G._colorsTexture!==null&&wt.setValue(D,"batchingColorTexture",G._colorsTexture,j));let Hi=W.morphAttributes;if((Hi.position!==void 0||Hi.normal!==void 0||Hi.color!==void 0)&&U.update(G,W,On),(Bi||Ce.receiveShadow!==G.receiveShadow)&&(Ce.receiveShadow=G.receiveShadow,wt.setValue(D,"receiveShadow",G.receiveShadow)),(H.isMeshStandardMaterial||H.isMeshLambertMaterial||H.isMeshPhongMaterial)&&H.envMap===null&&z.environment!==null&&(Bt.envMapIntensity.value=z.environmentIntensity),Bt.dfgLUT!==void 0&&(Bt.dfgLUT.value=IP()),Bi){if(wt.setValue(D,"toneMappingExposure",P.toneMappingExposure),Ce.needsLights&&jM(Bt,ns),Ee&&H.fog===!0&&ke.refreshFogUniforms(Bt,Ee),ke.refreshMaterialUniforms(Bt,H,te,Y,w.state.transmissionRenderTarget[b.id]),Ce.needsLights&&Ce.lightProbeGrid){let It=Ce.lightProbeGrid;Bt.probesSH.value=It.texture,Bt.probesMin.value.copy(It.boundingBox.min),Bt.probesMax.value.copy(It.boundingBox.max),Bt.probesResolution.value.copy(It.resolution)}po.upload(D,C_(Ce),Bt,j)}if(H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(po.upload(D,C_(Ce),Bt,j),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&wt.setValue(D,"center",G.center),wt.setValue(D,"modelViewMatrix",G.modelViewMatrix),wt.setValue(D,"normalMatrix",G.normalMatrix),wt.setValue(D,"modelMatrix",G.matrixWorld),H.uniformsGroups!==void 0){let It=H.uniformsGroups;for(let Gi=0,is=It.length;Gi<is;Gi++){let D_=It[Gi];oe.update(D_,On),oe.bind(D_,On)}}return On}function jM(b,z){b.ambientLightColor.needsUpdate=z,b.lightProbe.needsUpdate=z,b.sunLights.needsUpdate=z,b.sunLightShadows.needsUpdate=z,b.directionalLights.needsUpdate=z,b.directionalLightShadows.needsUpdate=z,b.pointLights.needsUpdate=z,b.pointLightShadows.needsUpdate=z,b.spotLights.needsUpdate=z,b.spotLightShadows.needsUpdate=z,b.rectAreaLights.needsUpdate=z,b.hemisphereLights.needsUpdate=z}function KM(b){return b.isMeshLambertMaterial||b.isMeshToonMaterial||b.isMeshPhongMaterial||b.isMeshStandardMaterial||b.isShadowMaterial||b.isShaderMaterial&&b.lights===!0}this.getActiveCubeFace=function(){return q},this.getActiveMipmapLevel=function(){return Z},this.getRenderTarget=function(){return se},this.setRenderTargetTextures=function(b,z,W){let H=$.get(b);H.__autoAllocateDepthBuffer=b.resolveDepthBuffer===!1,H.__autoAllocateDepthBuffer===!1&&(H.__useRenderToTexture=!1),$.get(b.texture).__webglTexture=z,$.get(b.depthTexture).__webglTexture=H.__autoAllocateDepthBuffer?void 0:W,H.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(b,z){let W=$.get(b);W.__webglFramebuffer=z,W.__useDefaultFramebuffer=z===void 0},this.setRenderTarget=function(b,z=0,W=0){se=b,q=z,Z=W;let H=null,G=!1,Ee=!1;if(b){let we=$.get(b);if(we.__useDefaultFramebuffer!==void 0){x.bindFramebuffer(D.FRAMEBUFFER,we.__webglFramebuffer),re.copy(b.viewport),De.copy(b.scissor),Re=b.scissorTest,x.viewport(re),x.scissor(De),x.setScissorTest(Re),X=-1;return}else if(we.__webglFramebuffer===void 0)j.setupRenderTarget(b);else if(we.__hasExternalTextures)j.rebindTextures(b,$.get(b.texture).__webglTexture,$.get(b.depthTexture).__webglTexture);else if(b.depthBuffer){let rt=b.depthTexture;if(we.__boundDepthTexture!==rt){if(rt!==null&&$.has(rt)&&(b.width!==rt.image.width||b.height!==rt.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");j.setupDepthRenderbuffer(b)}}let Ne=b.texture;(Ne.isData3DTexture||Ne.isDataArrayTexture||Ne.isCompressedArrayTexture)&&(Ee=!0);let Oe=$.get(b).__webglFramebuffer;b.isWebGLCubeRenderTarget?(Array.isArray(Oe[z])?H=Oe[z][W]:H=Oe[z],G=!0):b.samples>0&&j.useMultisampledRTT(b)===!1?H=$.get(b).__webglMultisampledFramebuffer:Array.isArray(Oe)?H=Oe[W]:H=Oe,re.copy(b.viewport),De.copy(b.scissor),Re=b.scissorTest}else re.copy(Ae).multiplyScalar(te).floor(),De.copy(qe).multiplyScalar(te).floor(),Re=ft;if(W!==0&&(H=V),x.bindFramebuffer(D.FRAMEBUFFER,H)&&x.drawBuffers(b,H),x.viewport(re),x.scissor(De),x.setScissorTest(Re),G){let we=$.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_CUBE_MAP_POSITIVE_X+z,we.__webglTexture,W)}else if(Ee){let we=z;for(let Ne=0;Ne<b.textures.length;Ne++){let Oe=$.get(b.textures[Ne]);D.framebufferTextureLayer(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0+Ne,Oe.__webglTexture,W,we)}}else if(b!==null&&W!==0){let we=$.get(b.texture);D.framebufferTexture2D(D.FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,we.__webglTexture,W)}X=-1};function I_(b){let z=$.get(b);return(z.__readFormat!==b.format||z.__readType!==b.type)&&(z.__readFormat=b.format,z.__readType=b.type,z.__formatReadable=A.textureFormatReadable(b.format),z.__typeReadable=A.textureTypeReadable(b.type)),z}this.readRenderTargetPixels=function(b,z,W,H,G,Ee,Ie,we=0){if(!(b&&b.isWebGLRenderTarget)){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Ne=$.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Ie!==void 0&&(Ne=Ne[Ie]),Ne){x.bindFramebuffer(D.FRAMEBUFFER,Ne);try{let Oe=b.textures[we],rt=Oe.format,lt=Oe.type;b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+we);let Le=I_(Oe);if(Le.__formatReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Le.__typeReadable===!1){Je("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}z>=0&&z<=b.width-H&&W>=0&&W<=b.height-G&&D.readPixels(z,W,H,G,ve.convert(rt),ve.convert(lt),Ee)}finally{let Oe=se!==null?$.get(se).__webglFramebuffer:null;x.bindFramebuffer(D.FRAMEBUFFER,Oe)}}},this.readRenderTargetPixelsAsync=async function(b,z,W,H,G,Ee,Ie,we=0){if(!(b&&b.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Ne=$.get(b).__webglFramebuffer;if(b.isWebGLCubeRenderTarget&&Ie!==void 0&&(Ne=Ne[Ie]),Ne)if(z>=0&&z<=b.width-H&&W>=0&&W<=b.height-G){x.bindFramebuffer(D.FRAMEBUFFER,Ne);let Oe=b.textures[we],rt=Oe.format,lt=Oe.type;b.textures.length>1&&D.readBuffer(D.COLOR_ATTACHMENT0+we);let Le=I_(Oe);if(Le.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Le.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let yt=D.createBuffer();D.bindBuffer(D.PIXEL_PACK_BUFFER,yt),D.bufferData(D.PIXEL_PACK_BUFFER,Ee.byteLength,D.STREAM_READ),D.readPixels(z,W,H,G,ve.convert(rt),ve.convert(lt),0),D.bindBuffer(D.PIXEL_PACK_BUFFER,null);let Gt=se!==null?$.get(se).__webglFramebuffer:null;x.bindFramebuffer(D.FRAMEBUFFER,Gt);let Dt=D.fenceSync(D.SYNC_GPU_COMMANDS_COMPLETE,0);return D.flush(),await bS(D,Dt,4),D.bindBuffer(D.PIXEL_PACK_BUFFER,yt),D.getBufferSubData(D.PIXEL_PACK_BUFFER,0,Ee),D.bindBuffer(D.PIXEL_PACK_BUFFER,null),D.deleteBuffer(yt),D.deleteSync(Dt),Ee}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(b,z=null,W=0){let H=Math.pow(2,-W),G=Math.floor(b.image.width*H),Ee=Math.floor(b.image.height*H),Ie=z!==null?z.x:0,we=z!==null?z.y:0;j.setTexture2D(b,0),D.copyTexSubImage2D(D.TEXTURE_2D,W,0,0,Ie,we,G,Ee),x.unbindTexture()},this.copyTextureToTexture=function(b,z,W=null,H=null,G=0,Ee=0){let Ie,we,Ne,Oe,rt,lt,Le,yt,Gt,Dt=b.isCompressedTexture?b.mipmaps[Ee]:b.image;if(W!==null)Ie=W.max.x-W.min.x,we=W.max.y-W.min.y,Ne=W.isBox3?W.max.z-W.min.z:1,Oe=W.min.x,rt=W.min.y,lt=W.isBox3?W.min.z:0;else{let Bt=Math.pow(2,-G);Ie=Math.floor(Dt.width*Bt),we=Math.floor(Dt.height*Bt),b.isDataArrayTexture?Ne=Dt.depth:b.isData3DTexture?Ne=Math.floor(Dt.depth*Bt):Ne=1,Oe=0,rt=0,lt=0}H!==null?(Le=H.x,yt=H.y,Gt=H.z):(Le=0,yt=0,Gt=0);let At=ve.convert(z.format),Qt=ve.convert(z.type),Ce;z.isData3DTexture?(j.setTexture3D(z,0),Ce=D.TEXTURE_3D):z.isDataArrayTexture||z.isCompressedArrayTexture?(j.setTexture2DArray(z,0),Ce=D.TEXTURE_2D_ARRAY):(j.setTexture2D(z,0),Ce=D.TEXTURE_2D),x.activeTexture(D.TEXTURE0),x.pixelStorei(D.UNPACK_FLIP_Y_WEBGL,z.flipY),x.pixelStorei(D.UNPACK_PREMULTIPLY_ALPHA_WEBGL,z.premultiplyAlpha),x.pixelStorei(D.UNPACK_ALIGNMENT,z.unpackAlignment);let un=x.getParameter(D.UNPACK_ROW_LENGTH),pt=x.getParameter(D.UNPACK_IMAGE_HEIGHT),On=x.getParameter(D.UNPACK_SKIP_PIXELS),ii=x.getParameter(D.UNPACK_SKIP_ROWS),Bi=x.getParameter(D.UNPACK_SKIP_IMAGES);x.pixelStorei(D.UNPACK_ROW_LENGTH,Dt.width),x.pixelStorei(D.UNPACK_IMAGE_HEIGHT,Dt.height),x.pixelStorei(D.UNPACK_SKIP_PIXELS,Oe),x.pixelStorei(D.UNPACK_SKIP_ROWS,rt),x.pixelStorei(D.UNPACK_SKIP_IMAGES,lt);let ns=b.isDataArrayTexture||b.isData3DTexture,wt=z.isDataArrayTexture||z.isData3DTexture;if(b.isDepthTexture){let Bt=$.get(b),Hi=$.get(z),It=$.get(Bt.__renderTarget),Gi=$.get(Hi.__renderTarget);x.bindFramebuffer(D.READ_FRAMEBUFFER,It.__webglFramebuffer),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,Gi.__webglFramebuffer);for(let is=0;is<Ne;is++)ns&&(D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,$.get(b).__webglTexture,G,lt+is),D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,$.get(z).__webglTexture,Ee,Gt+is)),D.blitFramebuffer(Oe,rt,Ie,we,Le,yt,Ie,we,D.DEPTH_BUFFER_BIT,D.NEAREST);x.bindFramebuffer(D.READ_FRAMEBUFFER,null),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else if(G!==0||b.isRenderTargetTexture||$.has(b)){let Bt=$.get(b),Hi=$.get(z);x.bindFramebuffer(D.READ_FRAMEBUFFER,N),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,B);for(let It=0;It<Ne;It++)ns?D.framebufferTextureLayer(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Bt.__webglTexture,G,lt+It):D.framebufferTexture2D(D.READ_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Bt.__webglTexture,G),wt?D.framebufferTextureLayer(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,Hi.__webglTexture,Ee,Gt+It):D.framebufferTexture2D(D.DRAW_FRAMEBUFFER,D.COLOR_ATTACHMENT0,D.TEXTURE_2D,Hi.__webglTexture,Ee),G!==0?D.blitFramebuffer(Oe,rt,Ie,we,Le,yt,Ie,we,D.COLOR_BUFFER_BIT,D.NEAREST):wt?D.copyTexSubImage3D(Ce,Ee,Le,yt,Gt+It,Oe,rt,Ie,we):D.copyTexSubImage2D(Ce,Ee,Le,yt,Oe,rt,Ie,we);x.bindFramebuffer(D.READ_FRAMEBUFFER,null),x.bindFramebuffer(D.DRAW_FRAMEBUFFER,null)}else wt?b.isDataTexture||b.isData3DTexture?D.texSubImage3D(Ce,Ee,Le,yt,Gt,Ie,we,Ne,At,Qt,Dt.data):z.isCompressedArrayTexture?D.compressedTexSubImage3D(Ce,Ee,Le,yt,Gt,Ie,we,Ne,At,Dt.data):D.texSubImage3D(Ce,Ee,Le,yt,Gt,Ie,we,Ne,At,Qt,Dt):b.isDataTexture?D.texSubImage2D(D.TEXTURE_2D,Ee,Le,yt,Ie,we,At,Qt,Dt.data):b.isCompressedTexture?D.compressedTexSubImage2D(D.TEXTURE_2D,Ee,Le,yt,Dt.width,Dt.height,At,Dt.data):D.texSubImage2D(D.TEXTURE_2D,Ee,Le,yt,Ie,we,At,Qt,Dt);x.pixelStorei(D.UNPACK_ROW_LENGTH,un),x.pixelStorei(D.UNPACK_IMAGE_HEIGHT,pt),x.pixelStorei(D.UNPACK_SKIP_PIXELS,On),x.pixelStorei(D.UNPACK_SKIP_ROWS,ii),x.pixelStorei(D.UNPACK_SKIP_IMAGES,Bi),Ee===0&&z.generateMipmaps&&D.generateMipmap(Ce),x.unbindTexture()},this.initRenderTarget=function(b){$.get(b).__webglFramebuffer===void 0&&j.setupRenderTarget(b)},this.initTexture=function(b){b.isCubeTexture?j.setTextureCube(b,0):b.isData3DTexture?j.setTexture3D(b,0):b.isDataArrayTexture||b.isCompressedArrayTexture?j.setTexture2DArray(b,0):j.setTexture2D(b,0),x.unbindTexture()},this.resetState=function(){q=0,Z=0,se=null,x.reset(),Te.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Bn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorSpace=ut._getDrawingBufferColorSpace(e),t.unpackColorSpace=ut._getUnpackColorSpace()}};var a_={threadId:null,mode:"empty"};function sM(n,e){if(e.threadId===null)return{state:n.threadId===null?a_:{threadId:n.threadId,mode:"waiting"},handoff:null};let t=e.working?"rolling":"resting";return n.threadId===e.threadId?{state:{threadId:e.threadId,mode:t},handoff:null}:{state:{threadId:e.threadId,mode:t},handoff:{exitingThreadId:n.threadId,enteringThreadId:e.threadId}}}var DP=new Set(["starting","active"]),NP=new Set(["runtime","working-draft","workflow","background-agent","background-command"]);function oM(n){return n.indicator==="waiting-for-input"?!1:n.status!==void 0?DP.has(n.status):NP.has(n.indicator)}function aM(n,e){return e===null?null:n===null||e>n?e:null}function cM(){let n=0,e=0;return{begin:()=>++n,accept(t){return t<=e?!1:(e=t,!0)}}}var nd=class{materials=new Map;geometries=new Map;templates=new Map;toonBands=(()=>{let e=new Kn(new Uint8Array([150,212,255]),3,1,Wa);return e.minFilter=Lt,e.magFilter=Lt,e.needsUpdate=!0,e})();template(e,t){let i=this.templates.get(e);return i||(i=t(),this.templates.set(e,i)),i}solid(e){let t=`solid:${new Pe(e).getHexString()}`,i=this.materials.get(t);return i||(i=new Ni({color:e,gradientMap:this.toonBands}),this.materials.set(t,i)),i}glow(e){let t=`glow:${new Pe(e).getHexString()}`,i=this.materials.get(t);return i||(i=new An({color:e}),this.materials.set(t,i)),i}vertexColored(){let e=this.materials.get("vertex");return e||(e=new Ni({vertexColors:!0,gradientMap:this.toonBands}),this.materials.set("vertex",e)),e}batched(){let e=this.materials.get("batched");return e||(e=new Ni({vertexColors:!0,gradientMap:this.toonBands}),this.materials.set("batched",e)),e}shadow(){let e=this.materials.get("shadow");return e||(e=new An({color:1773616,transparent:!0,opacity:.22,depthWrite:!1}),this.materials.set("shadow",e)),e}geometry(e,t){let i=this.geometries.get(e);return i||(i=t(),this.geometries.set(e,i)),i}box(){return this.geometry("box",()=>new ur(1,1,1))}sphere(e=1){return this.geometry(`sphere:${e}`,()=>new $r(.5,e))}cylinder(e=10,t=1){return this.geometry(`cylinder:${e}:${t}`,()=>new hr(.5*t,.5,1,e))}cone(e=10){return this.geometry(`cone:${e}`,()=>new Ta(.5,1,e))}torus(e=.18,t=Math.PI*2){return this.geometry(`torus:${e}:${t.toFixed(3)}`,()=>new Zr(.5,e,6,18,t))}shadowDisc(){return this.geometry("shadow-disc",()=>{let e=new Ea(1,24);return e.rotateX(-Math.PI/2),e})}dispose(){for(let e of this.templates.values())e.traverse(t=>{t instanceof Ve&&t.userData.ownedGeometry&&t.geometry.dispose()});this.templates.clear(),this.toonBands.dispose();for(let e of this.materials.values())e.dispose();for(let e of this.geometries.values())e.dispose();this.materials.clear(),this.geometries.clear()}},_t=[16732013,16752412,16765503,3919532,961897,3835647,8599788,16740277,49873,15817653,10221311,16704576,15681391,448160];function ze(n,e){return e[Math.floor(n()*e.length)%e.length]}function nc(n,e=!1){let t=n[0].index!==null,i=new Set(Object.keys(n[0].attributes)),r=new Set(Object.keys(n[0].morphAttributes)),s={},o={},a=n[0].morphTargetsRelative,c=new Ht,l=0;for(let u=0;u<n.length;++u){let h=n[u],d=0;if(t!==(h.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(let f in h.attributes){if(!i.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+'. All geometries must have compatible attributes; make sure "'+f+'" attribute exists among all geometries, or in none of them.'),null;s[f]===void 0&&(s[f]=[]),s[f].push(h.attributes[f]),d++}if(d!==i.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". Make sure all geometries have the same number of attributes."),null;if(a!==h.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(let f in h.morphAttributes){if(!r.has(f))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+".  .morphAttributes must be consistent throughout all geometries."),null;o[f]===void 0&&(o[f]=[]),o[f].push(h.morphAttributes[f])}if(e){let f;if(t)f=h.index.count;else if(h.attributes.position!==void 0)f=h.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+u+". The geometry must have either an index or a position attribute"),null;c.addGroup(l,f,u),l+=f}}if(t){let u=0,h=[];for(let d=0;d<n.length;++d){let f=n[d].index;for(let m=0;m<f.count;++m)h.push(f.getX(m)+u);u+=n[d].attributes.position.count}c.setIndex(h)}for(let u in s){let h=lM(s[u]);if(!h)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" attribute."),null;c.setAttribute(u,h)}for(let u in o){let h=o[u][0].length;if(h!==0){c.morphAttributes=c.morphAttributes||{},c.morphAttributes[u]=[];for(let d=0;d<h;++d){let f=[];for(let y=0;y<o[u].length;++y)f.push(o[u][y][d]);let m=lM(f);if(!m)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+u+" morphAttribute."),null;c.morphAttributes[u].push(m)}}}return c}function lM(n){let e,t,i,r=-1,s=0;for(let l=0;l<n.length;++l){let u=n[l];if(e===void 0&&(e=u.array.constructor),e!==u.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=u.itemSize),t!==u.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(i===void 0&&(i=u.normalized),i!==u.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(r===-1&&(r=u.gpuType),r!==u.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=u.count*t}let o=new e(s),a=new $t(o,t,i),c=0;for(let l=0;l<n.length;++l){let u=n[l];if(u.isInterleavedBufferAttribute){let h=c/t;for(let d=0,f=u.count;d<f;d++)for(let m=0;m<t;m++){let y=u.getComponent(d,m);a.setComponent(d+h,m,y)}}else o.set(u.array,c);c+=u.count*t}return r!==void 0&&(a.gpuType=r),a}function R(n,e,t,i,r,s=[0,0,0]){let o=new Ve(e,t);return o.scale.set(...i),o.position.set(...r),o.rotation.set(...s),n.add(o),o}var LP=[16766901,15841676,13208926,9263675,16769996],Mt=Math.PI/2,zP={kind:"thumbtack",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(12),n.solid(ze(e,_t)),[1,.28,1],[0,.14,0]),R(t,n.cylinder(10),n.solid(ze(e,_t)),[.55,.3,.55],[0,.42,0]),R(t,n.cone(6),n.solid(14278118),[.12,.9,.12],[0,1,0]),t}},UP={kind:"coin",tier:0,zones:"all",build({kit:n}){let e=new ce;return R(e,n.cylinder(14),n.solid(16103470),[1,.14,1],[0,.07,0]),R(e,n.cylinder(14),n.solid(16766556),[.72,.16,.72],[0,.08,0]),e}},OP={kind:"button",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(14),n.solid(ze(e,_t)),[1,.2,1],[0,.1,0]);let i=n.solid(2826560);for(let[r,s]of[[-.15,-.15],[.15,-.15],[-.15,.15],[.15,.15]])R(t,n.cylinder(6),i,[.12,.05,.12],[r,.21,s]);return t}},FP={kind:"candy",tier:0,zones:["room","candy"],weight:1.6,build({kit:n,random:e}){let t=new ce,i=ze(e,_t);R(t,n.sphere(1),n.solid(i),[1,.62,.62],[0,.31,0]);let r=n.solid(new Pe(i).lerp(new Pe(16777215),.45));return R(t,n.cone(6),r,[.42,.42,.42],[-.68,.31,0],[0,0,-Mt]),R(t,n.cone(6),r,[.42,.42,.42],[.68,.31,0],[0,0,Mt]),t}},kP={kind:"die",tier:0,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(16514047),[1,1,1],[0,.5,0]);let i=n.solid(e()<.3?15087942:1907514);for(let[r,s]of[[0,0],[-.25,-.25],[.25,.25],[-.25,.25],[.25,-.25]])R(t,n.sphere(0),i,[.16,.08,.16],[r,1,s]);for(let[r,s]of[[.3,-.2],[.7,.2]])R(t,n.sphere(0),i,[.08,.16,.16],[.5,r,s]);return t}},BP={kind:"battery",tier:0,zones:["room","town"],build({kit:n,random:e}){let t=new ce,i=ze(e,[2829634,15672124,3835647,448160]);return R(t,n.cylinder(10),n.solid(i),[.5,1.3,.5],[0,.25,0],[0,0,Mt]),R(t,n.cylinder(10),n.solid(16761600),[.52,.35,.52],[.45,.25,0],[0,0,Mt]),R(t,n.cylinder(8),n.solid(14278118),[.18,.12,.18],[.72,.25,0],[0,0,Mt]),t}},HP={kind:"eraser",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ce;return R(t,n.box(),n.solid(ze(e,[16777215,16763101,16774064])),[1,.38,.55],[0,.19,0]),R(t,n.box(),n.solid(ze(e,[3835647,1149618,8599788])),[.6,.4,.57],[.12,.2,0]),t}},GP={kind:"mahjong",tier:0,zones:["room"],build({kit:n,random:e}){let t=new ce;return R(t,n.box(),n.solid(2792847),[.72,.16,1],[0,.08,0]),R(t,n.box(),n.solid(16643811),[.72,.22,1],[0,.27,0]),R(t,n.box(),n.solid(ze(e,[15087942,1914199,2792847])),[.22,.03,.5],[0,.39,0]),t}},VP={kind:"sushi",tier:0,zones:["room","beach"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(16776693),[1,.42,.55],[0,.21,0]);let i=ze(e,[16747610,16735603,16765286]);return R(t,n.box(),n.solid(i),[1.12,.18,.62],[0,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[-.2,.5,0]),R(t,n.box(),n.solid(16773606),[.06,.19,.63],[.2,.5,0]),t}},$P={kind:"strawberry",tier:0,zones:["room","candy","garden"],build({kit:n}){let e=new ce;return R(e,n.cone(8),n.solid(15741007),[.8,1,.8],[0,.5,0],[Math.PI,0,0]),R(e,n.cone(5),n.solid(3129201),[.7,.2,.7],[0,1.05,0],[Math.PI,0,0]),R(e,n.cylinder(5),n.solid(3129201),[.08,.25,.08],[0,1.2,0]),e}},WP={kind:"seashell",tier:0,zones:["beach"],weight:2,build({kit:n,random:e}){let t=new ce,i=ze(e,[16762024,16770521,16230584,16773584]);R(t,n.sphere(1),n.solid(i),[1,.4,.85],[0,.2,0]);let r=n.solid(new Pe(i).multiplyScalar(.85));for(let s=-2;s<=2;s+=1)R(t,n.box(),r,[.06,.1,.8],[s*.17,.36,0],[0,s*.18,0]);return t}},ZP={kind:"starfish",tier:0,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[16747586,16735631,16761182]));for(let r=0;r<5;r+=1){let s=r/5*Math.PI*2;R(t,n.cone(5),i,[.34,.9,.2],[Math.cos(s)*.42,.1,Math.sin(s)*.42],[Mt,0,s-Mt])}return R(t,n.sphere(0),i,[.45,.22,.45],[0,.11,0]),t}},XP={kind:"pencil",tier:1,zones:["room","town"],build({kit:n,random:e}){let t=new ce;return t.rotation.y=e()*Math.PI,R(t,n.cylinder(6),n.solid(ze(e,[16765503,3835647,15681391,448160])),[.3,2,.3],[0,.15,0],[0,0,Mt]),R(t,n.cone(6),n.solid(15848352),[.3,.4,.3],[1.2,.15,0],[0,0,-Mt]),R(t,n.cone(6),n.solid(2829634),[.1,.14,.1],[1.4,.15,0],[0,0,-Mt]),R(t,n.cylinder(8),n.solid(16748459),[.3,.26,.3],[-1.1,.15,0],[0,0,Mt]),t}},qP={kind:"rubber-duck",tier:1,zones:["room","beach"],build({kit:n}){let e=new ce,t=n.solid(16766474);return R(e,n.sphere(1),t,[1.1,.75,.85],[0,.38,0]),R(e,n.sphere(1),t,[.6,.6,.6],[.32,.9,0]),R(e,n.cone(6),n.solid(16743168),[.24,.34,.24],[.72,.88,0],[0,0,-Mt]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,.2]),R(e,n.sphere(0),n.solid(1907514),[.08,.08,.08],[.55,1.02,-.2]),e}},YP={kind:"fruit",tier:1,zones:["room","garden","candy"],build({kit:n,random:e}){let t=new ce;return R(t,n.sphere(1),n.solid(ze(e,[15087942,16752412,10212166,16765503])),[1,.95,1],[0,.48,0]),R(t,n.cylinder(5),n.solid(8015405),[.07,.25,.07],[0,1,0]),R(t,n.sphere(0),n.solid(3129201),[.28,.06,.14],[.14,1.04,0],[0,0,.4]),t}},JP={kind:"mug",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,_t));return R(t,n.cylinder(14),i,[.8,.9,.8],[0,.45,0]),R(t,n.cylinder(14),n.solid(7289631),[.68,.02,.68],[0,.88,0]),R(t,n.torus(.2),i,[.45,.45,.45],[.45,.45,0]),t}},jP={kind:"cake",tier:1,zones:["room","candy"],build({kit:n}){let e=new ce,t=n.geometry("wedge",()=>new hr(.5,.5,1,6,1,!1,0,Math.PI/3));return R(e,t,n.solid(16769187),[2,.5,2],[0,.25,0]),R(e,t,n.solid(16775408),[2.02,.12,2.02],[0,.56,0]),R(e,n.sphere(0),n.solid(15741007),[.22,.22,.22],[.35,.7,.35]),e}},KP={kind:"alarm-clock",tier:1,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[15672124,3835647,448160]));return R(t,n.cylinder(16),i,[1,.4,1],[0,.6,0],[Mt,0,0]),R(t,n.cylinder(16),n.solid(16777215),[.82,.42,.82],[0,.6,.02],[Mt,0,0]),R(t,n.box(),n.solid(1907514),[.05,.3,.02],[0,.7,.24]),R(t,n.box(),n.solid(1907514),[.22,.05,.02],[.08,.6,.24]),R(t,n.sphere(1),i,[.36,.36,.36],[-.32,1.1,0]),R(t,n.sphere(1),i,[.36,.36,.36],[.32,1.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[-.3,.1,0]),R(t,n.cylinder(5),n.solid(1907514),[.1,.2,.1],[.3,.1,0]),t}},QP={kind:"gift",tier:1,zones:["room","candy"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(ze(e,_t)),[1,.8,1],[0,.4,0]);let i=n.solid(ze(e,[16777215,16765503,15681391]));return R(t,n.box(),i,[1.02,.82,.16],[0,.4,0]),R(t,n.box(),i,[.16,.82,1.02],[0,.4,0]),R(t,n.torus(.25),i,[.36,.36,.36],[-.14,.92,0],[0,0,.5]),R(t,n.torus(.25),i,[.36,.36,.36],[.14,.92,0],[0,0,-.5]),t}},e3={kind:"lollipop",tier:1,zones:["candy"],weight:2,build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(6),n.solid(16777215),[.1,1.4,.1],[0,.7,0]),R(t,n.cylinder(16),n.solid(ze(e,_t)),[1,.2,1],[0,1.6,0],[Mt,0,0]),R(t,n.torus(.14),n.solid(16777215),[.6,.6,.6],[0,1.6,.1]),t}},t3={kind:"mushroom",tier:1,zones:["forest","garden"],weight:1.6,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(8),n.solid(16773590),[.4,.6,.4],[0,.3,0]);let i=ze(e,[15087942,16752412,8599788]);R(t,n.sphere(1),n.solid(i),[1.1,.6,1.1],[0,.7,0]);let r=n.solid(16777215);for(let[s,o]of[[.25,.1],[-.2,.25],[-.1,-.3],[.3,-.25]])R(t,n.sphere(0),r,[.14,.1,.14],[s,.92,o]);return t}},n3={kind:"book",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ce;return t.rotation.y=e()*Math.PI,R(t,n.box(),n.solid(ze(e,_t)),[1,.26,1.4],[0,.13,0]),R(t,n.box(),n.solid(16776170),[.94,.2,1.36],[.05,.13,0]),R(t,n.box(),n.solid(ze(e,_t)),[.9,.24,1.3],[.1,.37,.05],[0,.3,0]),R(t,n.box(),n.solid(16776170),[.84,.18,1.26],[.15,.37,.05],[0,.3,0]),t}},i3={kind:"teapot",tier:2,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[16777215,10221311,16763101,12116178]));return R(t,n.sphere(1),i,[1.1,.85,1.1],[0,.45,0]),R(t,n.cylinder(6,.5),i,[.24,.7,.24],[.6,.6,0],[0,0,-.7]),R(t,n.torus(.2),i,[.5,.5,.5],[-.58,.5,0]),R(t,n.sphere(1),i,[.5,.2,.5],[0,.88,0]),R(t,n.sphere(0),n.solid(16765503),[.14,.14,.14],[0,1,0]),t}},r3={kind:"toy-robot",tier:2,zones:["room","town"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[12568533,3835647,15681391])),r=n.solid(2829634);return R(t,n.box(),r,[.22,.45,.22],[0,.22,-.18]),R(t,n.box(),r,[.22,.45,.22],[0,.22,.18]),R(t,n.box(),i,[.6,.6,.7],[0,.75,0]),R(t,n.box(),i,[.46,.4,.5],[0,1.28,0]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,-.12]),R(t,n.box(),n.glow(10221311),[.05,.1,.1],[.24,1.3,.12]),R(t,n.cylinder(4),r,[.04,.3,.04],[0,1.62,0]),R(t,n.sphere(0),n.glow(16711790),[.12,.12,.12],[0,1.78,0]),R(t,n.box(),i,[.16,.5,.16],[0,.72,-.46]),R(t,n.box(),i,[.16,.5,.16],[0,.72,.46]),t}},s3={kind:"potted-flower",tier:2,zones:["room","garden","town"],build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(8,1.3),n.solid(13789500),[.7,.6,.7],[0,.3,0]),R(t,n.cylinder(8),n.solid(5978665),[.84,.04,.84],[0,.6,0]),R(t,n.cylinder(5),n.solid(3129201),[.08,.8,.08],[0,1,0]);let i=n.solid(ze(e,_t));for(let r=0;r<6;r+=1){let s=r/6*Math.PI*2;R(t,n.sphere(0),i,[.3,.12,.3],[Math.cos(s)*.24,1.42,Math.sin(s)*.24])}return R(t,n.sphere(0),n.solid(16765503),[.22,.14,.22],[0,1.44,0]),t}},o3={kind:"traffic-cone",tier:2,zones:["town"],weight:1.4,build({kit:n}){let e=new ce;return R(e,n.box(),n.solid(16739072),[.9,.1,.9],[0,.05,0]),R(e,n.cone(10),n.solid(16743168),[.7,1.3,.7],[0,.72,0]),R(e,n.cylinder(10,.75),n.solid(16777215),[.48,.22,.48],[0,.72,0]),e}},a3={kind:"beach-ball",tier:2,zones:["beach"],weight:1.4,motion:"bob",build({kit:n}){let e=new ce;return R(e,n.sphere(2),n.solid(16777215),[1,1,1],[0,.5,0]),R(e,n.torus(.16),n.solid(15672124),[.96,.96,.96],[0,.5,0]),R(e,n.torus(.16),n.solid(3835647),[.96,.96,.96],[0,.5,0],[0,Mt,0]),R(e,n.torus(.16),n.solid(16765503),[.96,.96,.96],[0,.5,0],[Mt,0,0]),e}},c3={kind:"cat",tier:2,zones:["room","garden","town"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[16752453,6052974,16645629,2829110,15253629]));R(t,n.sphere(1),i,[1.3,.72,.7],[0,.55,0]),R(t,n.sphere(1),i,[.66,.6,.62],[.7,.85,0]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,-.18]),R(t,n.cone(4),i,[.2,.3,.2],[.72,1.2,.18]),R(t,n.cylinder(5),i,[.1,.8,.1],[-.75,.9,0],[0,0,.7]);for(let[r,s]of[[.4,.2],[.4,-.2],[-.4,.2],[-.4,-.2]])R(t,n.cylinder(5),i,[.14,.4,.14],[r,.2,s]);return R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,-.14]),R(t,n.sphere(0),n.solid(1907514),[.07,.1,.07],[.98,.92,.14]),t}},l3={kind:"penguin",tier:2,zones:["snow"],weight:2,motion:"walk",build({kit:n}){let e=new ce;return R(e,n.sphere(1),n.solid(2236987),[.8,1.2,.75],[0,.65,0]),R(e,n.sphere(1),n.solid(16777215),[.5,.9,.6],[.2,.6,0]),R(e,n.cone(5),n.solid(16752412),[.14,.26,.14],[.46,1,0],[0,0,-Mt]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,-.16]),R(e,n.box(),n.solid(16752412),[.3,.06,.18],[.12,.03,.16]),e}},u3={kind:"crab",tier:1,zones:["beach"],motion:"walk",build({kit:n}){let e=new ce,t=n.solid(16731469);R(e,n.sphere(1),t,[1,.45,.8],[0,.35,0]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,-.45]),R(e,n.sphere(0),t,[.32,.26,.26],[.55,.42,.45]);for(let i=0;i<3;i+=1)R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,-.45],[.7,0,0]),R(e,n.cylinder(4),t,[.06,.4,.06],[-.2+i*.2,.18,.45],[-.7,0,0]);return R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,-.12]),R(e,n.sphere(0),n.solid(1907514),[.08,.12,.08],[.35,.62,.12]),e}},h3={kind:"sunflower",tier:3,zones:["garden"],weight:1.4,build({kit:n}){let e=new ce;R(e,n.cylinder(6),n.solid(3841315),[.12,2.4,.12],[0,1.2,0]),R(e,n.sphere(0),n.solid(3841315),[.5,.08,.24],[.22,1.1,0],[0,0,.4]),R(e,n.cylinder(12),n.solid(7028253),[.6,.12,.6],[.05,2.5,0],[0,0,Mt]);let t=n.solid(16764928);for(let i=0;i<10;i+=1){let r=i/10*Math.PI*2;R(e,n.sphere(0),t,[.08,.32,.18],[.06,2.5+Math.sin(r)*.45,Math.cos(r)*.45],[r,0,0])}return e}},d3={kind:"dog",tier:3,zones:["garden","town","beach"],motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[13011801,16645629,4013373,16045453])),r=n.solid(5913899);R(t,n.box(),i,[1.3,.6,.62],[0,.7,0]),R(t,n.box(),i,[.62,.58,.56],[.78,1.1,0]),R(t,n.box(),i,[.36,.28,.4],[1.2,.98,0]),R(t,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.4,1.05,0]),R(t,n.box(),r,[.12,.44,.22],[.7,1.12,-.36]),R(t,n.box(),r,[.12,.44,.22],[.7,1.12,.36]),R(t,n.cylinder(5),i,[.1,.5,.1],[-.75,1.05,0],[0,0,.8]);for(let[s,o]of[[.45,.2],[.45,-.2],[-.45,.2],[-.45,-.2]])R(t,n.cylinder(5),i,[.16,.5,.16],[s,.25,o]);return t}},f3={kind:"person",tier:3,zones:["town","garden","beach","snow","room"],weight:1.6,motion:"walk",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,_t)),r=n.solid(ze(e,[1914199,2829634,7166330,5800279])),s=n.solid(ze(e,LP));return R(t,n.cylinder(6),r,[.2,.9,.2],[0,.45,-.14]),R(t,n.cylinder(6),r,[.2,.9,.2],[0,.45,.14]),R(t,n.cylinder(8,.85),i,[.62,.95,.5],[0,1.35,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,-.4],[.25,0,0]),R(t,n.cylinder(6),i,[.16,.8,.16],[0,1.3,.4],[-.25,0,0]),R(t,n.sphere(1),s,[.5,.56,.5],[0,2.1,0]),R(t,n.sphere(1),n.solid(ze(e,[2826520,7028253,15909198,11680328,1907514])),[.54,.34,.54],[-.04,2.3,0]),t}},p3={kind:"mailbox",tier:3,zones:["town","garden"],build({kit:n}){let e=new ce,t=n.solid(15087942);return R(e,n.box(),n.solid(8015405),[.2,1.2,.2],[0,.6,0]),R(e,n.box(),t,[.9,.45,.5],[0,1.4,0]),R(e,n.cylinder(10),t,[.5,.9,.5],[0,1.62,0],[0,0,Mt]),R(e,n.box(),n.solid(16765503),[.06,.4,.06],[.3,1.9,.26]),e}},m3={kind:"bench",tier:3,zones:["town","garden","beach"],build({kit:n}){let e=new ce,t=n.solid(13204285),i=n.solid(2976335);R(e,n.box(),t,[2,.1,.7],[0,.6,0]),R(e,n.box(),t,[2,.5,.08],[0,1,-.32],[-.15,0,0]);for(let r of[-.85,.85])R(e,n.box(),i,[.1,.6,.6],[r,.3,0]),R(e,n.box(),i,[.1,.6,.08],[r,.95,-.34]);return e}},g3={kind:"bicycle",tier:3,zones:["town","garden"],build({kit:n,random:e}){let t=new ce,i=n.solid(1907514),r=n.solid(ze(e,_t));return R(t,n.torus(.1),i,[1.1,1.1,1.1],[-.7,.55,0]),R(t,n.torus(.1),i,[1.1,1.1,1.1],[.7,.55,0]),R(t,n.cylinder(5),r,[.08,1.3,.08],[0,.85,0],[0,0,Mt]),R(t,n.cylinder(5),r,[.08,.9,.08],[-.35,.72,0],[0,0,.9]),R(t,n.cylinder(5),r,[.08,.9,.08],[.45,.8,0],[0,0,-.35]),R(t,n.box(),n.solid(2829634),[.36,.08,.2],[-.35,1.18,0]),R(t,n.cylinder(5),n.solid(12568533),[.06,.6,.06],[.58,1.25,0],[Mt,0,0]),t}},x3={kind:"umbrella",tier:3,zones:["beach"],weight:1.5,build({kit:n,random:e}){let t=new ce;return R(t,n.cylinder(6),n.solid(16777215),[.08,2.2,.08],[0,1.1,0],[.12,0,0]),R(t,n.cone(8),n.solid(ze(e,_t)),[2.4,.6,2.4],[0,2.2,.12]),R(t,n.cone(8),n.solid(16777215),[1.2,.34,1.2],[0,2.38,.12]),t}},_3={kind:"snowman",tier:3,zones:["snow"],weight:1.8,build({kit:n,random:e}){let t=new ce,i=n.solid(16645631);return R(t,n.sphere(1),i,[1.1,1,1.1],[0,.5,0]),R(t,n.sphere(1),i,[.8,.75,.8],[0,1.28,0]),R(t,n.sphere(1),i,[.58,.55,.58],[0,1.88,0]),R(t,n.cone(6),n.solid(16743168),[.1,.36,.1],[.36,1.9,0],[0,0,-Mt]),R(t,n.torus(.2),n.solid(ze(e,[15087942,3835647,448160])),[.62,.62,.62],[0,1.6,0],[Mt,0,0]),R(t,n.cylinder(10),n.solid(1907514),[.5,.06,.5],[0,2.12,0]),R(t,n.cylinder(10),n.solid(1907514),[.34,.36,.34],[0,2.3,0]),t}},v3={kind:"vending-machine",tier:3,zones:["town"],build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(ze(e,[15087942,3835647,16645629])),[.9,1.9,.8],[0,.95,0]),R(t,n.box(),n.glow(13299960),[.05,.9,.6],[.46,1.25,0]);for(let i=0;i<3;i+=1)for(let r=0;r<3;r+=1)R(t,n.cylinder(6),n.solid(ze(e,_t)),[.1,.22,.1],[.44,1+i*.26,-.18+r*.18]);return R(t,n.box(),n.solid(2829634),[.05,.14,.5],[.46,.35,0]),t}},y3={kind:"car",tier:4,zones:["town","beach"],weight:1.6,motion:"drive",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,_t));R(t,n.box(),i,[2.3,.62,1.1],[0,.55,0]),R(t,n.box(),n.solid(12443902),[1.2,.5,1],[-.15,1.1,0]),R(t,n.box(),i,[1.26,.08,1.04],[-.15,1.38,0]);let r=n.solid(1907514);for(let[s,o]of[[.75,.55],[.75,-.55],[-.75,.55],[-.75,-.55]])R(t,n.cylinder(10),r,[.52,.22,.52],[s,.26,o],[Mt,0,0]);return R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,-.35]),R(t,n.box(),n.glow(16774064),[.04,.14,.22],[1.16,.62,.35]),t}},b3={kind:"cow",tier:4,zones:["garden","forest"],motion:"walk",build({kit:n}){let e=new ce,t=n.solid(16645629),i=n.solid(1907514);R(e,n.box(),t,[1.8,.9,.9],[0,1.1,0]),R(e,n.sphere(0),i,[.6,.5,.1],[.2,1.2,.46]),R(e,n.sphere(0),i,[.5,.4,.1],[-.4,1.05,-.46]),R(e,n.box(),t,[.6,.55,.6],[1.1,1.4,0]),R(e,n.box(),n.solid(16757954),[.24,.3,.5],[1.44,1.3,0]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,-.22]),R(e,n.cone(5),n.solid(16773590),[.1,.3,.1],[1.05,1.8,.22]);for(let[r,s]of[[.65,.3],[.65,-.3],[-.65,.3],[-.65,-.3]])R(e,n.cylinder(5),t,[.2,.7,.2],[r,.35,s]);return R(e,n.sphere(0),n.solid(16757954),[.34,.2,.3],[-.3,.62,0]),e}},S3={kind:"tree",tier:4,zones:["garden","town","forest"],weight:2,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(6),n.solid(9067067),[.4,1.6,.4],[0,.8,0]);let i=[5420936,7653021,4231532,9819570];if(R(t,n.sphere(0),n.solid(ze(e,i)),[1.8,1.6,1.8],[0,2.2,0]),R(t,n.sphere(0),n.solid(ze(e,i)),[1.2,1.1,1.2],[.5,2.8,.3]),R(t,n.sphere(0),n.solid(ze(e,i)),[1.1,1,1.1],[-.5,2.6,-.3]),e()<.4)for(let r=0;r<4;r+=1)R(t,n.sphere(0),n.solid(15087942),[.2,.2,.2],[Math.cos(r*1.7)*.8,2.1+r*.15,Math.sin(r*1.7)*.8]);return t}},M3={kind:"pine-tree",tier:4,zones:["forest","snow"],weight:2.2,build({kit:n,random:e}){let t=new ce,i=e()<.5;R(t,n.cylinder(6),n.solid(7029286),[.35,.9,.35],[0,.45,0]);let r=n.solid(ze(e,[2976335,1786674,4231532]));for(let s=0;s<3;s+=1)R(t,n.cone(7),r,[1.8-s*.45,1.3,1.8-s*.45],[0,1.4+s*.75,0]);return i&&R(t,n.cone(7),n.solid(16777215),[.5,.45,.5],[0,3.1,0]),t}},w3={kind:"palm-tree",tier:4,zones:["beach"],weight:2,build({kit:n}){let e=new ce,t=n.solid(11895642);for(let r=0;r<6;r+=1)R(e,n.cylinder(6,.85),t,[.34,.6,.34],[r*r*.02,.3+r*.55,0],[0,0,-r*.05]);let i=n.solid(3129201);for(let r=0;r<6;r+=1){let s=r/6*Math.PI*2;R(e,n.sphere(0),i,[1.5,.08,.4],[.6+Math.cos(s)*.7,3.4,Math.sin(s)*.7],[0,-s,-.3])}return R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.55,3.2,.15]),R(e,n.sphere(0),n.solid(8015405),[.26,.26,.26],[.7,3.2,-.12]),e}},E3={kind:"house",tier:5,zones:["town","garden","snow"],weight:2,build({kit:n,random:e}){let t=new ce;R(t,n.box(),n.solid(ze(e,[16773590,16766688,13299960,16645340,14871785])),[2.2,1.5,1.9],[0,.75,0]),R(t,n.cone(4),n.solid(ze(e,[15087942,3835647,2792847,7166330])),[2.3,1.1,2],[0,2.05,0],[0,Math.PI/4,0]),R(t,n.box(),n.solid(8015405),[.05,.8,.5],[1.11,.4,.3]);let i=n.glow(16774064);return R(t,n.box(),i,[.05,.42,.42],[1.11,.95,-.45]),R(t,n.box(),i,[.42,.42,.05],[-.4,.95,.96]),R(t,n.box(),i,[.42,.42,.05],[.5,.95,.96]),R(t,n.box(),n.solid(10309341),[.3,.7,.3],[-.55,2.35,-.35]),t}},T3={kind:"bus",tier:5,zones:["town"],motion:"drive",build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[16765503,448160,15681391]));R(t,n.box(),i,[4.2,1.5,1.4],[0,1.05,0]),R(t,n.box(),n.solid(12443902),[3.8,.5,1.42],[-.1,1.35,0]),R(t,n.box(),n.solid(12443902),[.05,.7,1.2],[2.11,1.25,0]);let r=n.solid(1907514);for(let[s,o]of[[1.3,.7],[1.3,-.7],[-1.3,.7],[-1.3,-.7]])R(t,n.cylinder(10),r,[.62,.24,.62],[s,.3,o],[Mt,0,0]);return t}},A3={kind:"windmill",tier:5,zones:["garden","forest"],build({kit:n}){let e=new ce;R(e,n.cylinder(8,.65),n.solid(16645340),[1.3,3,1.3],[0,1.5,0]),R(e,n.cone(8),n.solid(15087942),[1.1,.8,1.1],[0,3.4,0]);let t=new ce;t.position.set(.56,2.7,0),t.userData.spin={axis:"x",speed:1.4};let i=n.solid(16775408);for(let r=0;r<4;r+=1){let s=new ce;s.rotation.x=r/4*Math.PI*2,R(s,n.box(),i,[.06,1.7,.4],[0,.95,0]),t.add(s)}return e.add(t),e}},R3={kind:"lighthouse",tier:5,zones:["beach"],build({kit:n}){let e=new ce;for(let t=0;t<5;t+=1)R(e,n.cylinder(10,.94),n.solid(t%2===0?16777215:15087942),[1.2-t*.12,.8,1.2-t*.12],[0,.4+t*.8,0]);return R(e,n.cylinder(10),n.glow(16774064),[.62,.5,.62],[0,4.25,0]),R(e,n.cone(10),n.solid(1914199),[.9,.6,.9],[0,4.8,0]),e}},C3={kind:"pagoda",tier:5,zones:["garden","town","forest"],build({kit:n,random:e}){let t=new ce,i=n.solid(16773590),r=n.solid(ze(e,[14034984,2792847,4014171]));for(let s=0;s<3;s+=1){let o=1.8-s*.4;R(t,n.box(),i,[o,.9,o],[0,.45+s*1.2,0]),R(t,n.cone(4),r,[o*1.9,.45,o*1.9],[0,1.08+s*1.2,0],[0,Math.PI/4,0])}return R(t,n.cylinder(5),n.solid(16765503),[.08,.8,.08],[0,3.9,0]),t}},P3={kind:"hot-air-balloon",tier:5,zones:"all",weight:.6,motion:"fly",build({kit:n,random:e}){let t=new ce;R(t,n.sphere(1),n.solid(ze(e,_t)),[2,2.3,2],[0,2.6,0]),R(t,n.torus(.06),n.solid(ze(e,_t)),[2.04,2.04,2.04],[0,2.6,0],[Mt,0,0]),R(t,n.torus(.06),n.solid(16777215),[1.7,1.7,1.7],[0,3.2,0],[Mt,0,0]),R(t,n.box(),n.solid(10506797),[.6,.45,.6],[0,.22,0]);for(let[i,r]of[[.26,.26],[-.26,.26],[.26,-.26],[-.26,-.26]])R(t,n.cylinder(3),n.solid(5913899),[.03,1.2,.03],[i*1.4,.95,r*1.4]);return t}},I3={kind:"whale",tier:5,zones:["beach"],weight:.8,motion:"bob",build({kit:n}){let e=new ce;return R(e,n.sphere(1),n.solid(4756975),[3,1.3,1.5],[0,.65,0]),R(e,n.sphere(1),n.solid(13299960),[2.4,.6,1.2],[.2,.36,0]),R(e,n.sphere(0),n.solid(4756975),[.4,.1,1.2],[-1.7,.9,0],[0,0,.5]),R(e,n.sphere(0),n.solid(1907514),[.12,.12,.12],[1.1,.8,.6]),R(e,n.cylinder(6,1.6),n.solid(9494767),[.18,.6,.18],[.5,1.5,0]),e}},D3={kind:"building",tier:6,zones:["town"],weight:2.4,build({kit:n,random:e}){let t=new ce,i=5+Math.floor(e()*4),r=i*.62;R(t,n.box(),n.solid(ze(e,[11066076,15858414,16763604,13481179,16770484])),[1.8,r,1.8],[0,r/2,0]);let s=n.glow(ze(e,[16774064,13299960]));for(let o=0;o<i;o+=1)R(t,n.box(),s,[1.82,.22,1.5],[0,.4+o*.62,0]),R(t,n.box(),s,[1.5,.22,1.82],[0,.4+o*.62,0]);return R(t,n.cylinder(4),n.solid(15087942),[.06,1,.06],[.4,r+.5,.4]),t}},N3={kind:"ferris-wheel",tier:6,zones:["town","beach","candy"],build({kit:n}){let e=new ce,t=n.solid(16777215);R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,.3]),R(e,n.cylinder(5),t,[.16,3.2,.16],[0,1.5,-.6],[0,0,-.3]);let i=new ce;i.position.set(0,2.9,0),i.userData.spin={axis:"z",speed:.35},R(i,n.torus(.04),n.solid(16711790),[5,5,5],[0,0,0]);for(let r=0;r<8;r+=1){let s=r/8*Math.PI*2;R(i,n.box(),t,[.06,2.5,.06],[Math.cos(s)*1.25,Math.sin(s)*1.25,0],[0,0,s-Mt]),R(i,n.box(),n.solid(_t[r%_t.length]),[.4,.4,.5],[Math.cos(s)*2.5,Math.sin(s)*2.5-.25,0])}return e.add(i),e}},L3={kind:"rocket",tier:6,zones:"all",weight:.5,build({kit:n}){let e=new ce;R(e,n.cylinder(10),n.solid(16645629),[1,3,1],[0,2,0]),R(e,n.cone(10),n.solid(15087942),[1,1.2,1],[0,4.1,0]),R(e,n.cylinder(10),n.glow(10221311),[.4,.1,.4],[0,3,.48],[Mt,0,0]);for(let t=0;t<3;t+=1){let i=t/3*Math.PI*2;R(e,n.box(),n.solid(15087942),[.08,1,.7],[Math.cos(i)*.6,.8,Math.sin(i)*.6],[0,-i,0])}return R(e,n.cone(8),n.glow(16758531),[.7,.6,.7],[0,.3,0],[Math.PI,0,0]),e}},z3={kind:"cupcake",tier:3,zones:["candy","room"],weight:1.6,build({kit:n,random:e}){let t=new ce;R(t,n.cylinder(10,1.25),n.solid(ze(e,[16757702,10221311,16646070])),[.9,.7,.9],[0,.35,0]);let i=n.solid(ze(e,[16773623,16763101,13303743]));return R(t,n.sphere(1),i,[1.2,.5,1.2],[0,.85,0]),R(t,n.sphere(1),i,[.8,.4,.8],[0,1.15,0]),R(t,n.sphere(0),n.solid(15087942),[.26,.26,.26],[0,1.42,0]),t}},U3={kind:"candy-cane",tier:4,zones:["candy","snow"],weight:1.6,build({kit:n}){let e=new ce;for(let t=0;t<6;t+=1)R(e,n.cylinder(8),n.solid(t%2===0?16777215:15087942),[.3,.5,.3],[0,.25+t*.5,0]);return R(e,n.torus(.3,Math.PI),n.solid(15087942),[.9,.9,.9],[.45,3,0]),e}},O3={kind:"gingerbread-house",tier:5,zones:["candy","snow"],weight:1.4,build({kit:n}){let e=new ce;R(e,n.box(),n.solid(11887901),[2,1.3,1.7],[0,.65,0]),R(e,n.cone(4),n.solid(16775408),[2.2,1.1,1.9],[0,1.85,0],[0,Math.PI/4,0]),R(e,n.box(),n.solid(16740277),[.05,.7,.5],[1.01,.35,0]);for(let[t,i]of[[1,-.55],[1,.55]])R(e,n.box(),n.solid(10221311),[.05,.36,.36],[1.01,t,i]);for(let t=0;t<6;t+=1)R(e,n.sphere(0),n.solid(_t[t*2]),[.18,.18,.18],[-.8+t*.32,1.32,.86]);return e}},F3={kind:"zabuton",tier:2,zones:["room"],weight:1.4,build({kit:n,random:e}){let t=new ce,i=ze(e,[10304626,4020864,14711391,8499866]);return R(t,n.box(),n.solid(i),[1.1,.22,1.1],[0,.11,0]),R(t,n.sphere(1),n.solid(i),[1.1,.14,1.1],[0,.22,0]),R(t,n.sphere(0),n.solid(15912079),[.1,.08,.1],[0,.3,0]),t}},k3={kind:"low-table",tier:3,zones:["room"],weight:1.4,build({kit:n}){let e=new ce,t=n.solid(9132587);R(e,n.cylinder(18),t,[2.2,.12,2.2],[0,.7,0]);for(let[i,r]of[[.6,.6],[-.6,.6],[.6,-.6],[-.6,-.6]])R(e,n.box(),n.solid(7029286),[.14,.66,.14],[i,.33,r]);return R(e,n.cylinder(10),n.solid(16777215),[.3,.3,.3],[.3,.9,.2]),R(e,n.cylinder(10),n.solid(7289631),[.24,.02,.24],[.3,1.05,.2]),R(e,n.sphere(1),n.solid(16752412),[.28,.28,.28],[-.4,.9,-.3]),e}},B3={kind:"television",tier:3,zones:["room"],build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[10128536,4869737,13217191]));return R(t,n.box(),i,[1.3,1,1],[0,.6,0]),R(t,n.box(),n.glow(ze(e,[8054146,10221311,16762623])),[.04,.72,.78],[.66,.62,-.05]),R(t,n.cylinder(6),n.solid(2236987),[.12,.12,.12],[.66,.3,.38],[0,0,Math.PI/2]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,-.2],[.5,0,0]),R(t,n.cylinder(4),n.solid(12568533),[.03,.7,.03],[0,1.4,.2],[-.5,0,0]),R(t,n.box(),n.solid(7029286),[1.1,.1,.9],[0,.05,0]),t}},H3={kind:"kotatsu",tier:4,zones:["room"],weight:1.2,build({kit:n,random:e}){let t=new ce,i=n.solid(ze(e,[14034984,4415982,16219904]));R(t,n.box(),i,[2.4,.7,2.4],[0,.35,0]),R(t,n.sphere(1),i,[2.6,.3,2.6],[0,.55,0]),R(t,n.box(),n.solid(10506797),[2.1,.12,2.1],[0,.8,0]);for(let r=0;r<5;r+=1)R(t,n.sphere(1),n.solid(16752412),[.26,.26,.26],[Math.cos(r)*.3,.98,Math.sin(r)*.3]);return t}},G3={kind:"shoji-screen",tier:4,zones:["room"],build({kit:n}){let e=new ce,t=n.solid(8015405);R(e,n.box(),n.solid(16644332),[.08,2.4,1.4],[0,1.2,0]);for(let i=0;i<=4;i+=1)R(e,n.box(),t,[.1,.05,1.42],[0,.05+i*.59,0]);for(let i=0;i<=3;i+=1)R(e,n.box(),t,[.1,2.4,.05],[0,1.2,-.7+i*.467]);return e}},V3={kind:"hibiscus",tier:2,zones:["garden","beach"],weight:1.8,build({kit:n,random:e}){let t=new ce,i=n.solid(4168250);for(let s=0;s<5;s+=1){let o=s/5*Math.PI*2;R(t,n.sphere(1),i,[.7,.1,.32],[Math.cos(o)*.4,.25+s*.06,Math.sin(o)*.4],[0,-o,.3])}let r=n.solid(ze(e,[16027569,15691663,16230084]));for(let s=0;s<5;s+=1){let o=s/5*Math.PI*2;R(t,n.sphere(1),r,[.55,.12,.42],[Math.cos(o)*.34,.95,Math.sin(o)*.34],[0,-o,-.35])}return R(t,n.cylinder(6),n.solid(15909424),[.07,.5,.07],[.05,1.15,0],[0,0,-.5]),R(t,n.sphere(0),n.solid(15246103),[.14,.14,.14],[.18,1.38,0]),t}},hM=[zP,UP,OP,FP,kP,BP,HP,GP,VP,$P,WP,ZP,XP,qP,YP,JP,jP,KP,QP,e3,t3,u3,n3,i3,r3,s3,o3,a3,c3,l3,h3,d3,f3,p3,m3,g3,x3,_3,v3,y3,b3,S3,M3,w3,E3,T3,A3,R3,C3,P3,I3,D3,N3,L3,z3,U3,O3,F3,k3,B3,H3,G3,V3],$3=Math.max(...hM.map(n=>n.tier)),uM=new Map;function zi(n,e){let t=Math.min(Math.max(e,0),$3),i=uM.get(n);i||(i=new Map,uM.set(n,i));let r=i.get(t);return r||(r=hM.filter(s=>s.tier===t&&(s.zones==="all"||s.zones.includes(n))),i.set(t,r)),r}function Ui(n,e){let t=0;for(let r of e)t+=r.weight??1;if(t===0)return null;let i=n()*t;for(let r of e)if(i-=r.weight??1,i<=0)return r;return e.at(-1)??null}function _i(n,e){n.updateMatrixWorld(!0);let t=[];n.traverse(c=>{c!==n&&c.userData.spin&&t.push(c)});let i=n.matrixWorld.clone().invert(),r=[],s=new Pe;n.traverse(c=>{if(!(c instanceof Ve))return;let l=c;for(;l&&l!==n;){if(t.includes(l))return;l=l.parent}let u=c.geometry,h=u.index?u.toNonIndexed():u.clone();h.deleteAttribute("uv"),h.applyMatrix4(new mt().multiplyMatrices(i,c.matrixWorld)),s.copy(c.material.color);let d=h.getAttribute("position").count,f=new Float32Array(d*3);for(let m=0;m<d;m+=1)s.toArray(f,m*3);h.setAttribute("color",new $t(f,3)),r.push(h)});let o=new ce,a=r.length>0?nc(r):null;for(let c of r)c.dispose();if(a){let c=new Ve(a,e.vertexColored());c.userData.ownedGeometry=!0,o.add(c)}for(let c of t)o.attach(c);return o}var W3=3;function go(n,e){let t=Math.floor(e.random()*W3);return e.kit.template(`${n.kind}:${t}`,()=>{let r=Sn(er(n.kind)+t*7919),s=_i(n.build({kit:e.kit,random:r}),e.kit),o=new wn().setFromObject(s),a=o.getSize(new I),c=o.getCenter(new I),l=Math.max(a.x,a.y,a.z)/2||1;s.position.set(-c.x,-o.min.y,-c.z);let u=new ce;u.scale.setScalar(1/l),u.add(s);let h=new ce;return h.add(u),h}).clone(!0)}function dM(n){let e=n.kind.replace(/-/g," ");return e.charAt(0).toUpperCase()+e.slice(1)}var c_=[{core:16250346,nub:"round",rainbow:!1},{core:16771055,nub:"round",rainbow:!1},{core:16774072,nub:"spike",rainbow:!1},{core:14677478,nub:"spike",rainbow:!1},{core:14478591,nub:"crystal",rainbow:!1},{core:15458559,nub:"crystal",rainbow:!1},{core:16775398,nub:"crystal",rainbow:!0}],fM=[[15222076,16447212,16238910],[4173386,16447212,15222076],[3833814,16238910,15222076],[15764004,16447212,4173386],[16238910,15222076,3833814]];function Z3(n){return c_[Math.min(Math.max(0,n),c_.length-1)]}var pM=8,mM=[16773749,16748459,10221311,12188608,16762623,16766629,10536191,16646070];function X3(){let n=new $r(.5,0).getAttribute("position"),e=new Set,t=[];for(let i=0;i<n.count;i+=1){let r=new I().fromBufferAttribute(n,i).normalize(),s=r.toArray().map(o=>o.toFixed(2)).join(",");e.has(s)||(e.add(s),t.push(r))}return t}var q3=X3(),Y3=new I(0,1,0);function l_(n,e,t,i){n.clear();let r=Z3(i),s=e.template(`core:${t}:${c_.indexOf(r)}`,()=>{let o=new ce;o.add(new Ve(e.sphere(2),e.solid(r.core)));let a=_t.indexOf(t);return q3.forEach((c,l)=>{let u=r.rainbow?[_t[l%_t.length],16447212,_t[(l+5)%_t.length]]:fM[(l+Math.max(0,a))%fM.length],h=new ce;h.position.copy(c).multiplyScalar(.47),h.quaternion.setFromUnitVectors(Y3,c);let d=(f,m,y,g)=>{let p=new Ve(e.sphere(2),e.solid(f));p.scale.set(m,y,m),p.position.y=g,h.add(p)};if(d(u[0],.3,.12,.02),d(u[1],.21,.12,.035),r.nub==="round")d(u[2],.11,.1,.06);else{let f=r.nub==="spike"?e.cone(6):e.geometry("octahedron",()=>new dr(.5,0)),m=new Ve(f,e.solid(u[2]));m.scale.set(.11,r.nub==="spike"?.18:.2,.11),m.position.y=.1,h.add(m)}o.add(h)}),_i(o,e)});n.add(s.clone(!0))}var id=class{constructor(e){this.kit=e;this.halo=new Ve(e.torus(.05),e.glow(16765503)),this.halo.visible=!1,this.group.add(this.halo)}kit;group=new ce;moons=[];halo;count=0;get total(){return this.count}setCount(e,t){this.count=e;let i=Math.min(e,pM);for(;this.moons.length>i;){let r=this.moons.pop();r&&this.group.remove(r.mesh)}for(;this.moons.length<i;){let r=this.moons.length,s=new ce,o=this.kit.glow(mM[r%mM.length]),a=this.kit.geometry("octahedron",()=>new dr(.5,0)),c=new Ve(a,o);c.scale.set(1,1.6,1);let l=new Ve(a,o);l.scale.set(1.6,1,1),s.add(c,l),this.group.add(s),this.moons.push({mesh:s,tilt:new sn().setFromEuler(new Hn(.35+r%3*.3,r*.9,(r%2===0?1:-1)*.25)),phase:r/Math.max(1,i)*Math.PI*2,speed:1.1+r%3*.25,arrival:t?0:1})}this.halo.visible=e>pM}update(e,t,i){let r=t*1.45,s=t*.24;for(let o of this.moons){o.arrival=Math.min(1,o.arrival+e*1.4);let a=1-(1-o.arrival)**3;o.phase+=o.speed*e,o.mesh.position.set(Math.cos(o.phase)*r*a,Math.sin(i*2+o.phase)*t*.08,Math.sin(o.phase)*r*a).applyQuaternion(o.tilt),o.mesh.scale.setScalar(s*(.4+a*.6)*(1+Math.sin(i*6+o.phase)*.12)),o.mesh.rotation.y+=e*3}this.halo.scale.setScalar(t*2.9),this.halo.rotation.set(Math.PI/2+.3,0,i*.4)}};var gM={head:"hammer",suit:8176194,hem:5213995,stripe:11853170,legs:8006284},xM=[gM,gM,{head:"hammer",suit:15895986,hem:12736383,stripe:16565978,legs:4020888},{head:"tall",suit:5220317,hem:3108767,stripe:10474738,legs:15764004},{head:"round",suit:16172354,hem:12880925,stripe:16507802,legs:3902282},{head:"block",suit:10976214,hem:7293600,stripe:13876720,legs:15223391},{head:"hammer",suit:15962175,hem:12148255,stripe:16434319,legs:3037864},{head:"tall",suit:4569248,hem:2784620,stripe:10477775,legs:9185882},{head:"round",suit:15228253,hem:11024440,stripe:16231082,legs:4864652}],_M={hammer:.18,tall:.42,round:.22,block:.19},vM=16111946,J3=15916224,j3=2826803,od=5;function K3(n){return n.geometry("star",()=>{let e=new ro;for(let i=0;i<10;i+=1){let r=i/10*Math.PI*2+Math.PI/2,s=i%2===0?.5:.22,o=Math.cos(r)*s,a=Math.sin(r)*s;i===0?e.moveTo(o,a):e.lineTo(o,a)}e.closePath();let t=new Ua(e,{depth:.18,bevelEnabled:!1});return t.center(),t})}function Ut(n,e,t,i,r,s=[0,0,0]){let o=new Ve(e,t);return o.scale.set(...i),o.position.set(...r),o.rotation.set(...s),n.add(o),o}function u_(n,e,t){return n.template(e,()=>{let r=new ce;return t(r),_i(r,n)}).clone(!0)}function rd(n,e,t,i,r,s,o){let a=new ce;return a.position.set(...o),a.add(u_(n,e,c=>{Ut(c,n.cylinder(8),t,[r*2,i,r*2],[0,-i/2,0]),Ut(c,n.sphere(1),t,[s*2,s*2,s*2],[0,-i,0])})),a}function sd(n,e,t,i,r){let s=n.solid(j3);Ut(e,n.box(),n.solid(vM),[.02,r,i],[t,0,0]),Ut(e,n.box(),n.solid(J3),[.024,r*.78,i*.78],[t+.004,0,0]);let o=r*.12;for(let a of[-1,1])Ut(e,n.sphere(0),s,[.02,.03,.02],[t+.016,o,a*i*.2]),Ut(e,n.box(),s,[.01,.012,i*.14],[t+.016,o+r*.17,a*i*.2],[a*.3,0,0]);Ut(e,n.cone(4),n.solid(15764004),[.04,.05,.04],[t+.03,-r*.02,0],[0,0,-Math.PI/2]),Ut(e,n.cylinder(10),n.solid(14169135),[.045,.012,.05],[t+.016,-r*.24,0],[0,0,Math.PI/2])}function Q3(n,e,t){let i=n.solid(t.suit),r=n.solid(t.stripe);switch(t.head){case"hammer":{Ut(e,n.cylinder(18),i,[.34,.72,.34],[0,0,0],[Math.PI/2,0,0]);for(let s of[-1,1])Ut(e,n.sphere(2),i,[.34,.34,.34],[0,0,s*.36]),Ut(e,n.cylinder(18),r,[.345,.05,.345],[0,0,s*.27],[Math.PI/2,0,0]),Ut(e,n.cylinder(18),r,[.345,.03,.345],[0,0,s*.2],[Math.PI/2,0,0]);sd(n,e,.17,.24,.29);break}case"tall":{Ut(e,n.cylinder(16),i,[.3,.46,.3],[0,.1,0]),Ut(e,n.sphere(2),i,[.3,.2,.3],[0,.33,0]),Ut(e,n.cylinder(16),r,[.305,.05,.305],[0,.27,0]),sd(n,e,.15,.2,.22);break}case"round":{Ut(e,n.sphere(2),i,[.4,.38,.4],[0,.02,0]),Ut(e,n.torus(.08),r,[.34,.34,.34],[0,.02,0],[Math.PI/2,0,0]),sd(n,e,.19,.18,.2);break}case"block":{Ut(e,n.box(),i,[.34,.32,.4],[0,.02,0]),Ut(e,n.box(),r,[.35,.05,.41],[0,.14,0]),sd(n,e,.17,.22,.22);break}}Ut(e,n.cone(12),n.solid(vM),[.08,.13,.08],[0,_M[t.head]+.05,0])}function yM(n,e){let t=Sn(e),i=ze(t,xM),r=`cousin:${xM.indexOf(i)}`,s=n.solid(i.suit),o=n.solid(i.legs),a=new ce,c=new ce;a.add(c);let l=rd(n,`${r}:leg`,o,.27,.03,.055,[0,.32,-.075]),u=rd(n,`${r}:leg`,o,.27,.03,.055,[0,.32,.075]);c.add(l,u),c.add(u_(n,`${r}:suit`,S=>{Ut(S,n.cylinder(16,.52),s,[.34,.34,.34],[0,.47,0]),Ut(S,n.cylinder(16),n.solid(i.hem),[.36,.04,.36],[0,.31,0])}));let h=rd(n,`${r}:arm`,s,.24,.026,.05,[0,.58,-.1]),d=rd(n,`${r}:arm`,s,.24,.026,.05,[0,.58,.1]);c.add(h,d);let f=new ce;f.position.y=.8,c.add(f),f.add(u_(n,`${r}:head`,S=>Q3(n,S,i)));let m=_M[i.head],y=Ut(f,n.sphere(2),n.solid(14692651),[.075,.075,.075],[0,m+.14,0]),g=new ce;g.position.y=m+.12;let p=K3(n);for(let S=0;S<od;S+=1){let E=new ce;E.rotation.y=S/od*Math.PI*2,Ut(E,p,n.glow(S%2===0?16769357:16774054),[.16,.16,.16],[.34,0,0]),E.visible=!1,g.add(E)}return f.add(g),{root:a,body:c,head:f,leftLeg:l,rightLeg:u,leftArm:h,rightArm:d,cape:null,antennaTip:y,dizzyStars:g}}function bM(n,e){let t=Math.min(1,e.speed/1.2),i=Math.sin(e.stride)*.9*t;n.leftLeg.rotation.z=i,n.rightLeg.rotation.z=-i,n.body.position.y=Math.abs(Math.sin(e.stride))*.04*t,n.body.rotation.z=-.35*t;let r=e.dizziness;n.body.rotation.x=Math.sin(e.time*(1.6+r))*.2*r;let s=e.reach,o=Math.sin(e.time*2.2)*.03;if(e.waiting){let l=Math.sin(e.time*7)*.5,u=Math.sin(e.time*.7)>.55;n.leftArm.rotation.set(0,0,o),n.rightArm.rotation.set(u?-2.6+l:0,0,0),n.body.rotation.y=Un.lerp(n.body.rotation.y,Math.PI*.8,.08)}else{let l=Un.lerp(o,s,Math.max(t,.35));n.leftArm.rotation.set(0,0,l+(t>0?Math.sin(e.stride)*.08:0)),n.rightArm.rotation.set(0,0,l-(t>0?Math.sin(e.stride)*.08:0)),n.body.rotation.y=Un.lerp(n.body.rotation.y,0,.12)}let a=e.idleSeconds>1.5?Math.sin(e.time*.9):0;n.head.rotation.y=a*.6*(1-r);let c=e.time*(2.4+r*2);n.head.rotation.x=Math.sin(c)*.4*r,n.head.rotation.z=t*.15+Math.sin(e.time*3)*.02+Math.cos(c)*.3*r,n.dizzyStars.rotation.y=e.time*(3+r*3),n.dizzyStars.children.forEach((l,u)=>{l.visible=u<e.stars,l.position.y=Math.sin(e.time*5+u*1.7)*.04,l.children[0]?.rotation.set(0,Math.PI/2-n.dizzyStars.rotation.y-l.rotation.y,e.time*4)}),t<.05&&e.idleSeconds>3&&!e.waiting?n.rightLeg.rotation.x=Math.max(0,Math.sin(e.time*9))*.25:n.rightLeg.rotation.x=0,n.antennaTip.position.x=Math.sin(e.time*5+e.stride)*.03*(.4+t),n.cape&&(n.cape.rotation.z=-(.12+t*.42+Math.sin(e.time*11)*.08*t))}var eI=new mt,xo=class{constructor(e,t,i){this.kit=e;this.parent=t;this.options=i;this.instanceCapacity=i.instances,this.vertexCapacity=i.vertices,this.restore()}kit;parent;options;mesh=null;entries=new Map;geometryIds=new Map;instanceCapacity;vertexCapacity;add(e){let t=null,i=!1;e.traverse(o=>{o instanceof Ve&&o.userData.ownedGeometry?t=o:o.userData.spin&&(i=!0)});let r=i||t===null,s={body:t,live:r,inner:tI(e,t),instance:-1};this.entries.set(e,s),r&&(this.parent.add(e),t&&(t.visible=!1)),this.place(e,s)}update(e){let t=this.entries.get(e);t&&t.instance>=0&&this.write(e,t)}setVisible(e,t){e.visible=t;let i=this.entries.get(e);this.mesh&&i&&i.instance>=0&&this.mesh.setVisibleAt(i.instance,t)}remove(e){let t=this.entries.get(e);t&&(this.entries.delete(e),t.live&&this.parent.remove(e),this.mesh&&t.instance>=0&&(this.mesh.deleteInstance(t.instance),this.mesh.visible=this.mesh.instanceCount>0))}release(){if(this.mesh){this.parent.remove(this.mesh),this.mesh.dispose(),this.mesh=null,this.geometryIds.clear();for(let e of this.entries.values())e.instance=-1}}restore(){if(this.mesh)return;let e=new Sa(this.instanceCapacity,this.vertexCapacity,void 0,this.kit.batched());e.frustumCulled=!1,e.perObjectFrustumCulled=this.options.cull,e.sortObjects=!1,e.visible=!1,this.mesh=e,this.parent.add(e);for(let[t,i]of this.entries)this.place(t,i)}place(e,t){let i=this.mesh;if(!i||!t.body)return;let r=t.body.geometry,s=this.geometryIds.get(r);if(s===void 0){let o=r.getAttribute("position").count;if(i.unusedVertexCount<o){let a=this.vertexCapacity-i.unusedVertexCount;this.vertexCapacity=Math.max(this.vertexCapacity*2,a+o),i.setGeometrySize(this.vertexCapacity,this.vertexCapacity*2)}s=i.addGeometry(r),this.geometryIds.set(r,s)}i.instanceCount>=this.instanceCapacity&&(this.instanceCapacity*=2,i.setInstanceCount(this.instanceCapacity)),t.instance=i.addInstance(s),i.setVisibleAt(t.instance,e.visible),this.write(e,t),i.visible=!0}write(e,t){e.updateMatrix(),this.mesh?.setMatrixAt(t.instance,eI.multiplyMatrices(e.matrix,t.inner))}};function tI(n,e){let t=new mt;for(let i=e;i&&i!==n;i=i.parent)i.updateMatrix(),t.premultiply(i.matrix);return t}var br=.5,nI=.18;function Fi(n,e){return Math.atan2(e,n)}function ti(n){return Math.atan2(Math.sin(n),Math.cos(n))}function _n(n,e){return 1-Math.exp(-n*e)}function ad(n,e){let t=n()*2-1,i=n()*Math.PI*2,r=Math.sqrt(1-t*t);return e.set(r*Math.cos(i),t,r*Math.sin(i))}function h_(n){return 1-.75**Math.max(0,n)}function _o(n){let e=Math.min(1,ci(n)/nI);return 1-e*e*(3-2*e)}function d_(n){return .58*(n/.3)**.42*(1+2.6*_o(n))}var SM=140,iI=new I(0,1,0),rI=new Hn,sI=new sn,oI=new I;function MM(n,e,t,i,r){let s=i??0,o=er(e),a=Sn(o),c=yM(n,o),l=new ce,u=new ce;l.add(u);let h=new ce,d=ze(a,_t);l_(h,n,d,s),u.add(h);let f=new id(n);f.setCount(s,!1),l.add(f.group);let m=new Ve(n.shadowDisc(),n.shadow()),y=new Ve(n.shadowDisc(),n.shadow());m.renderOrder=-1,y.renderOrder=-1;let g=Ls(t),p={threadId:e,rig:c,ball:l,roll:u,core:h,items:new xo(n,u,{instances:SM+1,vertices:32768,cull:!1}),nubColor:d,moons:f,compactions:s,compactionsKnown:r&&i!==null,compactedSeq:null,synced:r,pop:null,gulp:null,coinDistance:0,coinsAnnounced:!1,ballShadow:m,cousinShadow:y,x:0,z:0,heading:a()*Math.PI*2,speed:0,vx:0,vz:0,radius:g,targetRadius:g,stuck:[],phase:"stage",phaseTime:0,exitDirection:new fe(1,0),stride:0,idleSeconds:0,turnRate:0,decisionIn:1,behavior:"cruise",behaviorSign:1,seekTarget:null,hungrySeconds:0,lastBonk:0,random:a};return f_(n,p),p}function f_(n,e){let t=ta(e.radius),i=16+Math.round(ci(e.radius)*90);for(let r=0;r<i;r+=1){let s=Math.max(0,t-(e.random()<.6?0:1)),o=ze(e.random,["room","garden","town","beach","candy"]),a=Ui(e.random,zi(o,s));if(!a)continue;let c=e.radius*(.14+e.random()*.26);p_(n,e,a,c,ad(e.random,oI),e.radius*.84)}}function p_(n,e,t,i,r,s,o){let a=o??go(t,{kit:n,random:e.random});if(a.scale.setScalar(i),a.position.copy(r).multiplyScalar(s-i*.4),a.quaternion.setFromUnitVectors(iI,r).multiply(sI.setFromEuler(rI.set((e.random()-.5)*1.8,e.random()*Math.PI*2,(e.random()-.5)*1.8))),e.items.add(a),e.stuck.push({object:a,definition:t,size:i,depth:s}),e.stuck.length>SM){let c=e.stuck.shift();c&&e.items.remove(c.object)}}function m_(n,e,t){return n.roll.updateWorldMatrix(!0,!1),t.copy(e.object.position).applyMatrix4(n.roll.matrixWorld)}function wM(n){let e=n.radius*.84,t=n.stuck,i=0;for(let r=0;r<t.length;r+=1){let s=t[r];s.depth+s.size*.9<e?n.items.remove(s.object):t[i++]=s}t.length=i}function g_(n,e,t){let i=n.stuck.filter(a=>a.size<=t*br),r=Math.max(4,Math.round(n.stuck.length*(t/e)**2)),s=new Set(i.slice(0,r)),o=n.stuck.filter(a=>!s.has(a));return n.stuck=n.stuck.filter(a=>s.has(a)),o}function x_(n,e,t,i){t===e.compactions&&e.moons.total===t||(e.compactions=t,l_(e.core,n,e.nubColor,t),e.moons.setCount(t,i))}function ic(n,e,t){t!==null&&(e.compactionsKnown=!0,x_(n,e,t,!1))}var cd=class{camera=new Yt(55,4/3,.05,200);focus=new I;frozen=!1;shake=0;followHeading=0;followRadius=.3;frame=.3;position=new I;target=new I;desiredPosition=new I;desiredTarget=new I;get heading(){return this.followHeading}get radius(){return this.followRadius}update(e,t,i){let r=t?.radius??this.followRadius;this.followRadius+=(r-this.followRadius)*_n(1.6,e);let s=t?Math.max(t.radius,t.rig.root.scale.y*.42):this.frame;this.frame+=(s-this.frame)*_n(1.6,e);let o=_o(this.followRadius);t&&!this.frozen&&t.phase==="stage"&&(this.focus.x+=(t.x-this.focus.x)*_n(7,e),this.focus.z+=(t.z-this.focus.z)*_n(7,e),this.followHeading+=ti(t.heading-this.followHeading)*_n(3.2,e));let a=this.followRadius,c=Math.cos(this.followHeading),l=Math.sin(this.followHeading),u=this.frame,h=this.followHeading-1.15*o,d=this.desiredPosition.set(this.focus.x-Math.cos(h)*u*3.9,u*2.7,this.focus.z-Math.sin(h)*u*3.9),f=this.desiredTarget.set(this.focus.x+c*a*.6,a*.8+(u-a)*.5,this.focus.z+l*a*.6),m=_n(5,e);this.position.lerp(d,this.position.lengthSq()===0?1:m),this.target.lerp(f,this.target.lengthSq()===0?1:m),this.shake=Math.max(0,this.shake-e);let y=this.shake*this.frame*.25;this.camera.position.set(this.position.x+(Math.random()-.5)*y,this.position.y+(Math.random()-.5)*y,this.position.z),this.camera.lookAt(this.target);let g=Math.max(.01,a*.06),p=a*260;(Math.abs(this.camera.near-g)>g*.05||Math.abs(this.camera.far-p)>p*.05)&&(this.camera.near=g,this.camera.far=p,this.camera.updateProjectionMatrix()),this.clearSightLine(a,i)}clearSightLine(e,t){let i=this.camera.position,r=this.focus.x-i.x,s=e-i.y,o=this.focus.z-i.z,a=Math.hypot(r,s,o);for(let c of t.props.values()){let l=c.x-i.x,u=c.lift+c.hop+c.size-i.y,h=c.z-i.z,d=(l*r+u*s+h*o)/a,f=!1;if(d>0&&d<a-e){let m=l-r/a*d,y=u-s/a*d,g=h-o/a*d;f=Math.hypot(m,y,g)<c.size*1.1+e*.3}t.setVisible(c,!f)}}};var aI=14,cI=48,lI=28,uI=72,hI=9;function EM(){return{glint:new An({color:16777215,fog:!1}),shockwave:new An({color:16777215,transparent:!0,opacity:0,depthWrite:!1,side:Gn})}}var ld=class{constructor(e,t,i){this.scene=e;this.materials=i;for(let a=0;a<aI;a+=1){let c=new Ve(t.sphere(2),new An({color:16777215,transparent:!0,opacity:0,depthWrite:!1}));this.puffs.push({mesh:c,life:0,grow:0})}for(let a=0;a<cI;a+=1){let c=new Ve(t.box(),t.solid(_t[a%_t.length]));this.confetti.push({mesh:c,velocity:new I,spin:new I,life:0})}for(let a=0;a<lI;a+=1){let c=new Ve(t.geometry("octahedron",()=>new dr(.5,0)),i.glint);this.glints.push({mesh:c,velocity:new I,spin:new I,life:0})}let r=t.solid(16762409),s=t.cylinder(18);for(let a=0;a<uI;a+=1){let c=new Ve(s,r);this.coins.push({mesh:c,life:0,vy:0,spin:0,size:0})}let o=new Oa(.8,1,48);o.rotateX(-Math.PI/2),this.shockwave=new Ve(o,i.shockwave)}scene;materials;puffs=[];confetti=[];glints=[];coins=[];shockwave;shockwaveLife=0;shockwaveRadius=1;direction=new I;coinsFlying(){for(let e of this.coins)if(e.life>0)return!0;return!1}puff(e,t,i){let r=this.puffs.find(s=>s.life<=0);r&&(r.life=.6,r.grow=i*.28,this.wake(r.mesh),r.mesh.position.set(e+(Math.random()-.5)*i*.6,i*.1,t+(Math.random()-.5)*i*.6))}glint(e,t,i,r){let s=this.glints.find(a=>a.life<=0);if(!s)return;let o=r()*Math.PI*2;s.life=.7,this.wake(s.mesh),s.mesh.position.set(e+Math.cos(o)*i*.9,i*(1+r()*.9),t+Math.sin(o)*i*.9),s.velocity.set(Math.cos(o)*i*1.2,i*1.6,Math.sin(o)*i*1.2),s.spin.set(0,8,4),s.mesh.scale.setScalar(i*.12)}burst(e,t,i,r){for(let s of this.confetti){let o=ad(r,this.direction);o.y=Math.abs(o.y)+.3,s.velocity.copy(o.normalize()).multiplyScalar(i*(4+r()*5)),s.spin.set(r()*12,r()*12,r()*12),s.life=1.4+r()*.8,this.wake(s.mesh),s.mesh.position.set(e,i,t),s.mesh.scale.set(i*.14,i*.05,i*.09)}this.shockwaveLife=1,this.shockwaveRadius=i,this.shockwave.position.set(e,i*.02,t),this.wake(this.shockwave)}coin(e,t,i,r,s){let o=this.coins.find(a=>a.life<=0)??this.coins[0];o.life=hI,o.size=r,o.vy=r*(9+s()*5),o.spin=14+s()*10,this.wake(o.mesh),o.mesh.position.set(e+(s()-.5)*r*3,t,i+(s()-.5)*r*3),o.mesh.rotation.set(Math.PI/2,s()*Math.PI,0),o.mesh.scale.set(r,r*.16,r),this.coins.splice(this.coins.indexOf(o),1),this.coins.push(o)}update(e){this.updatePuffs(e),this.updateConfetti(e),this.updateCoins(e)}dispose(){this.shockwave.geometry.dispose();for(let e of this.puffs)e.mesh.material.dispose();this.materials.glint.dispose(),this.materials.shockwave.dispose()}wake(e){e.parent===null&&this.scene.add(e)}updatePuffs(e){for(let t of this.puffs){if(t.life<=0)continue;t.life-=e;let i=1-Math.max(0,t.life)/.6;t.mesh.scale.setScalar(t.grow*(.4+i*.8)),t.mesh.material.opacity=.4*(1-i),t.mesh.position.y+=e*t.grow*.8,t.life<=0&&this.scene.remove(t.mesh)}}updateConfetti(e){for(let t of this.glints)t.life<=0||(t.life-=e,t.mesh.position.addScaledVector(t.velocity,e),t.mesh.rotation.y+=t.spin.y*e,t.mesh.scale.multiplyScalar(1-e*1.2),t.life<=0&&this.scene.remove(t.mesh));for(let t of this.confetti){if(t.life<=0)continue;t.life-=e;let i=t.mesh.scale.x*40;t.velocity.y-=i*e,t.velocity.multiplyScalar(1-_n(1.2,e)),t.mesh.position.addScaledVector(t.velocity,e),t.mesh.position.y<0&&(t.mesh.position.y=0,t.velocity.set(0,0,0)),t.mesh.rotation.x+=t.spin.x*e,t.mesh.rotation.y+=t.spin.y*e,t.mesh.rotation.z+=t.spin.z*e,t.life<=0&&this.scene.remove(t.mesh)}if(this.shockwaveLife>0){this.shockwaveLife=Math.max(0,this.shockwaveLife-e*1.3);let t=1-this.shockwaveLife;this.shockwave.scale.setScalar(this.shockwaveRadius*(1.2+t*5)),this.materials.shockwave.opacity=this.shockwaveLife*.85,this.shockwaveLife===0&&this.scene.remove(this.shockwave)}}updateCoins(e){for(let t of this.coins){if(t.life<=0)continue;t.life-=e;let i=t.size*.08,r=t.mesh.position;(r.y>i||t.vy>0)&&(t.vy-=t.size*60*e,r.y=Math.max(i,r.y+t.vy*e),t.mesh.rotation.x+=t.spin*e,r.y===i&&(t.vy=0,t.mesh.rotation.x=0));let s=Math.min(1,t.life/1.2);t.mesh.scale.set(t.size*s,t.size*.16*s,t.size*s),t.life<=0&&this.scene.remove(t.mesh)}}};var TM=72,AM=110,dI=34,fI=[15222076,16093498,16241214,7126853,3837910,8015792],RM=[9413806,10334908,8295583,11715531,7309202],pI=new I;function ud(n,e,t,i,r,s=0){let o=new Ve(e.box(),e.solid(t));o.scale.set(...i),o.position.set(...r),o.rotation.y=s,n.add(o)}function rc(n,e){return[Math.cos(n)*e,Math.sin(n)*e]}function mI(n,e,t){let i=new ce,r=2.3;for(let a=0;a<64;a+=1){let c=t-r/2+a/64*r+(e()-.5)*.03,l=TM+e()*10,[u,h]=rc(c,l),d=e()<.12,f=1.6+e()*2.6,m=d?9+e()*4:2.5+e()*5.5,y=RM[Math.floor(e()*RM.length)],g=-c;ud(i,n,y,[f,m,f],[u,m/2,h],g);let p=new Pe(y).lerp(new Pe(15135221),.45).getHex();for(let S=1.2;S<m-.6;S+=1.1)ud(i,n,p,[f*1.02,.28,f*.7],[u,S,h],g);d&&ud(i,n,y,[.2,2.2,.2],[u,m+1.1,h])}let[s,o]=rc(t+r/2+.12,TM+4);for(let a=0;a<6;a+=1){let c=2.2-a*.33;ud(i,n,a%2===0?14829114:16053492,[c,2.4,c],[s,1.2+a*2.4,o])}return _i(i,n)}function gI(n,e){let t=new ce;for(let i=0;i<90;i+=1){let r=e()*Math.PI*2,[s,o]=rc(r,50+e()*14),a=2.2+e()*2.4,c=new Ve(n.cylinder(6),n.solid(7031343));c.scale.set(.2,a*.3,.2),c.position.set(s,a*.15,o);let l=new Ve(n.sphere(1),n.solid(e()<.5?3112250:3903300));l.scale.set(1.1,a,1.1),l.position.set(s,a*.72,o),t.add(c,l)}return _i(t,n)}function xI(n,e){let t=new ce,i=[9225791,8042549,10342478,7319088];for(let r=0;r<22;r+=1){let s=r/22*Math.PI*2+e()*.2,[o,a]=rc(s,58+e()*12),c=new Ve(n.sphere(2),n.solid(i[r%i.length])),l=18+e()*16;c.scale.set(l,5+e()*6,l*.8),c.position.set(o,-1,a),c.rotation.y=-s,t.add(c)}return _i(t,n)}function _I(n,e){let t=new ce,[i,r]=rc(e,130),s=new Ve(n.cone(28),n.solid(4165567));s.scale.set(96,34,96),s.position.set(i,16,r);let o=new Ve(n.cone(28),n.solid(16186367));o.scale.set(38,13.6,38),o.position.set(i,26.3,r);let a=new ce;a.add(s,o);for(let c=0;c<7;c+=1){let l=new Ve(n.cone(3),n.solid(16186367)),u=c/7*Math.PI*2;l.scale.set(6,8,3),l.position.set(i+Math.cos(u)*17,19.5,r+Math.sin(u)*17),l.rotation.set(Math.PI,-u,0),a.add(l)}return t.add(a),_i(t,n)}function vI(){let n=fI.map((t,i)=>{let r=new Zr(1-i*.034,.017,4,80,Math.PI),s=new Pe(t),o=r.getAttribute("position").count,a=new Float32Array(o*3);for(let c=0;c<o;c+=1)s.toArray(a,c*3);return r.setAttribute("color",new $t(a,3)),r}),e=nc(n);for(let t of n)t.dispose();return new Ve(e,new An({vertexColors:!0,fog:!1}))}var hd=class{group=new ce;rainbow;clouds=[];cloudMaterial;fujiMaterials=[];constructor(e,t){let i=Sn(t^24301),r=i()*Math.PI*2;this.group.add(xI(e,i),gI(e,i),mI(e,i,r));let s=_I(e,r+2.6);s.traverse(a=>{if(a instanceof Ve){let c=a.material.clone();c.fog=!1,a.material=c,this.fujiMaterials.push(c)}}),this.group.add(s),this.cloudMaterial=new Ni({color:16777215,fog:!1});let o=new mt;for(let a=0;a<16;a+=1){let c=[],l=5+Math.floor(i()*5);for(let h=0;h<l;h+=1){let d=2.2+i()*3.2;o.makeScale(d*1.2,d,d).setPosition((h-l/2)*2.6+i(),9+d*.35+i()*2.5,i()*2);let f=e.sphere(2).clone().applyMatrix4(o);f.deleteAttribute("uv"),c.push(f)}let u=new Ve(nc(c),this.cloudMaterial);for(let h of c)h.dispose();this.group.add(u),this.clouds.push({mesh:u,angle:i()*Math.PI*2,distance:92+i()*22,drift:.004+i()*.006})}this.rainbow=vI(),this.group.add(this.rainbow)}update(e,t,i,r,s){this.group.position.set(t.x,0,t.z),this.group.scale.setScalar(i);for(let a of this.clouds)a.angle+=a.drift*e,a.mesh.position.set(Math.cos(a.angle)*a.distance,0,Math.sin(a.angle)*a.distance),a.mesh.rotation.y=-a.angle+Math.PI/2;let o=r.getWorldDirection(pI);o.y=0,o.normalize(),this.rainbow.visible=s>.5,this.rainbow.position.set(o.x*AM,-1,o.z*AM),this.rainbow.scale.setScalar(dI),this.rainbow.lookAt(t.x,this.group.position.y+i*-1,t.z)}dispose(){for(let e of this.clouds)e.mesh.geometry.dispose();this.cloudMaterial.dispose();for(let e of this.fujiMaterials)e.dispose();this.rainbow.geometry.dispose(),this.rainbow.material.dispose()}};var vo=["room","garden","town","beach","candy","forest","snow"];function PM(n){return vo.indexOf(n)}var CM=[{room:.72,candy:.14,garden:.14},{room:.55,candy:.15,garden:.2,beach:.1},{room:.28,garden:.28,candy:.14,town:.18,beach:.12},{room:.06,garden:.24,town:.28,beach:.14,forest:.16,candy:.12},{garden:.16,town:.3,beach:.16,forest:.16,snow:.12,candy:.1}];function yI(n){return CM[Math.min(n,CM.length-1)]}function dd(n,e,t){let i=Math.imul(n|0,668265261)^Math.imul(e|0,374761393);return i=Math.imul(i^Math.imul(t|0,2654435769),2246822507),i^=i>>>13,i=Math.imul(i,3266489909),i^=i>>>16,(i>>>0)/4294967296}function bI(n,e){let t=0;for(let r of vo)t+=n[r]??0;let i=e*t;for(let r of vo)if(i-=n[r]??0,i<=0&&(n[r]??0)>0)return r;return"garden"}function SI(n){return .3*2**n*16}function es(n,e,t,i){let r=SI(t),s=Math.floor(n/r),o=Math.floor(e/r),a=Number.POSITIVE_INFINITY,c=s,l=o;for(let u=-1;u<=1;u+=1)for(let h=-1;h<=1;h+=1){let d=s+u,f=o+h,m=(d+.15+.7*dd(d,f,i+t*7))*r,y=(f+.15+.7*dd(f,d,i+t*13))*r,g=(m-n)**2+(y-e)**2;g<a&&(a=g,c=d,l=f)}return{zone:bI(yI(t),dd(c,l,i+t*31+5)),variant:dd(c,l,i+t*57+11)}}var IM=[14864270,9225791,12239819,15983283,16762588,6467130,15923195],DM=[13218161,10146380,16249820,15455906,16773366,5545777,14543349];var MI=240,Sr=128,wI=200,fd=[{at:0,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1},{at:.07,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.64,top:4034518,horizon:13496058,sun:16777215,hemiSky:16777215,hemiGround:12573838,light:1.15,stars:0},{at:.72,top:6971312,horizon:16757642,sun:16751206,hemiSky:16769228,hemiGround:11049610,light:.95,stars:0},{at:.79,top:2962040,horizon:13073046,sun:16754352,hemiSky:13678822,hemiGround:5918592,light:.75,stars:.4},{at:.86,top:1055306,horizon:3360911,sun:12374015,hemiSky:10137320,hemiGround:3354720,light:.6,stars:1},{at:.95,top:3360154,horizon:10128075,sun:14469375,hemiSky:13353202,hemiGround:6247824,light:.75,stars:.5},{at:1,top:7314400,horizon:16241373,sun:16765608,hemiSky:16773364,hemiGround:12175258,light:1,stars:.1}],EI=new Pe,TI=new I,AI=new Pe(1,1,1),Mr={top:new Pe,horizon:new Pe,sun:new Pe,hemiSky:new Pe,hemiGround:new Pe,light:0,stars:0};function sc(n,e,t,i){n.setHex(e).lerp(EI.setHex(t),i)}function RI(n){let e=0;for(;e<fd.length-2&&fd[e+1].at<=n;)e+=1;let t=fd[e],i=fd[e+1],r=Un.smoothstep(n,t.at,i.at);return sc(Mr.top,t.top,i.top,r),sc(Mr.horizon,t.horizon,i.horizon,r),sc(Mr.sun,t.sun,i.sun,r),sc(Mr.hemiSky,t.hemiSky,i.hemiSky,r),sc(Mr.hemiGround,t.hemiGround,i.hemiGround,r),Mr.light=Un.lerp(t.light,i.light,r),Mr.stars=Un.lerp(t.stars,i.stars,r),Mr}var CI=`
varying vec3 vDirection;
void main() {
  vDirection = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww;
}
`,PI=`
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
`,II=`
varying vec3 vWorld;
varying float vDepth;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vec4 view = viewMatrix * world;
  vDepth = -view.z;
  gl_Position = projectionMatrix * view;
}
`,DI=`
uniform sampler2D uZoneMap;
uniform vec2 uMapOrigin;
uniform float uMapSize;
uniform vec3 uZoneColors[${vo.length}];
uniform vec3 uAccentColors[${vo.length}];
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
`,pd=class{constructor(e,t,i){this.scene=e;this.kit=t;this.seed=i;let r=Sn(i);this.phase=.18+r()*.2,this.hemisphere=new Xr(16777215,8956552,1.1),this.sun=new qr(16777215,1.2),e.add(this.hemisphere,this.sun,this.sun.target),this.skyUniforms={uTop:{value:new Pe},uHorizon:{value:new Pe},uSunColor:{value:new Pe},uSunDirection:{value:new I(0,1,0)},uStars:{value:0},uTime:{value:0}},this.sky=new Ve(new Fa(1,32,16),new cn({uniforms:this.skyUniforms,vertexShader:CI,fragmentShader:PI,side:Kt,depthWrite:!1})),this.sky.frustumCulled=!1,this.sky.renderOrder=-10,e.add(this.sky),this.zoneData=new Uint8Array(Sr*Sr*4),this.zoneTexture=new Kn(this.zoneData,Sr,Sr),this.zoneTexture.magFilter=Lt,this.zoneTexture.minFilter=Lt,this.groundUniforms={uZoneMap:{value:this.zoneTexture},uMapOrigin:{value:new fe},uMapSize:{value:1},uZoneColors:{value:IM.map(o=>new Pe(o))},uAccentColors:{value:DM.map(o=>new Pe(o))},uDetail:{value:1},uLight:{value:new Pe(1,1,1)},uFogColor:{value:new Pe},uFogNear:{value:10},uFogFar:{value:40}};let s=new Wr(1,1,1,1);s.rotateX(-Math.PI/2),this.ground=new Ve(s,new cn({uniforms:this.groundUniforms,vertexShader:II,fragmentShader:DI})),this.ground.frustumCulled=!1,this.ground.renderOrder=-5,e.add(this.ground),this.horizon=new hd(t,i),e.add(this.horizon.group)}scene;kit;seed;hemisphere;sun;fogColor=new Pe;sky;skyUniforms;ground;groundUniforms;zoneData;zoneTexture;horizon;zoneOrigin=new fe(Number.NaN,Number.NaN);zoneLevel=-1;zoneMapSize=1;phase;get skyPhase(){return this.phase}update(e,t,i,r,s,o){this.phase=(this.phase+e/MI)%1;let a=RI(this.phase),c=this.phase<.7,l=c?this.phase/.7:(this.phase-.7)/.3,u=Math.sin(l*Math.PI)*(c?1:.7),h=l*Math.PI+.4,d=TI.set(Math.cos(h)*Math.cos(Math.asin(Math.min(.999,u))),Math.max(.05,u),Math.sin(h)*.6).normalize();this.skyUniforms.uTop.value.copy(a.top),this.skyUniforms.uHorizon.value.copy(a.horizon),this.skyUniforms.uSunColor.value.copy(a.sun),this.skyUniforms.uSunDirection.value.copy(d),this.skyUniforms.uStars.value=a.stars,this.skyUniforms.uTime.value=t,this.sky.position.copy(o.position),this.sky.scale.setScalar(o.far*.5),this.hemisphere.color.copy(a.hemiSky),this.hemisphere.groundColor.copy(a.hemiGround),this.hemisphere.intensity=.55+a.light*.6,this.sun.color.copy(a.sun),this.sun.intensity=a.light*1.1,this.sun.position.copy(i).addScaledVector(d,r*40),this.sun.target.position.copy(i),this.fogColor.copy(a.horizon);let f=this.scene.fog,m=r*34,y=r*150;f&&(f.color.copy(this.fogColor),f.near=m,f.far=y);let g=r*wI;this.refreshZones(i,g,s),this.ground.position.set(i.x,0,i.z),this.ground.scale.set(g,1,g),this.groundUniforms.uDetail.value=.36*2**s,this.groundUniforms.uLight.value.copy(a.hemiSky).lerp(AI,.35).multiplyScalar(.55+a.light*.4),this.groundUniforms.uFogColor.value.copy(this.fogColor),this.groundUniforms.uFogNear.value=m,this.groundUniforms.uFogFar.value=y,this.horizon.update(e,i,r,o,this.phase>.05&&this.phase<.7?1:0)}refreshZones(e,t,i){let r=t/Sr,s=Math.floor((e.x-t/2)/r)*r,o=Math.floor((e.z-t/2)/r)*r;if(!(Math.abs(s-this.zoneOrigin.x)>t/8||Math.abs(o-this.zoneOrigin.y)>t/8||Math.abs(t-this.zoneMapSize)>t*.2||Number.isNaN(this.zoneOrigin.x))&&i===this.zoneLevel){this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=this.zoneMapSize;return}this.zoneOrigin.set(s,o),this.zoneLevel=i,this.zoneMapSize=t;for(let c=0;c<Sr;c+=1)for(let l=0;l<Sr;l+=1){let u=es(s+(l+.5)*r,o+(c+.5)*r,i,this.seed),h=(c*Sr+l)*4;this.zoneData[h]=PM(u.zone)*32,this.zoneData[h+1]=Math.floor(u.variant*255),this.zoneData[h+2]=0,this.zoneData[h+3]=255}this.zoneTexture.needsUpdate=!0,this.groundUniforms.uMapOrigin.value.copy(this.zoneOrigin),this.groundUniforms.uMapSize.value=t}dispose(){this.horizon.dispose(),this.sky.geometry.dispose(),this.sky.material.dispose(),this.ground.geometry.dispose(),this.ground.material.dispose(),this.zoneTexture.dispose()}};var md=class{constructor(e,t){this.renderer=e;this.kit=t}renderer;kit;images=new Map;get(e){let t=this.images.get(e.kind);if(t!==void 0)return t;let i=null;try{let s=new on(96,96);s.texture.colorSpace=xn;let o=new Gr;o.add(new Xr(16777215,9080732,1.6));let a=new qr(16777215,1.4);a.position.set(2,3,2),o.add(a);let c=go(e,{kit:this.kit,random:()=>0});c.rotation.y=-.7,o.add(c);let l=new Yt(32,1,.1,20);l.position.set(2.6,2.4,3.2),l.lookAt(0,.8,0),this.renderer.setRenderTarget(s),this.renderer.setClearColor(0,0),this.renderer.clear(),this.renderer.render(o,l);let u=new Uint8Array(9216*4);this.renderer.readRenderTargetPixels(s,0,0,96,96,u),this.renderer.setRenderTarget(null);let h=document.createElement("canvas");h.width=96,h.height=96;let d=h.getContext("2d");if(d){let f=d.createImageData(96,96);for(let m=0;m<96;m+=1)f.data.set(u.subarray((95-m)*96*4,(96-m)*96*4),m*96*4);d.putImageData(f,0,0),i=h.toDataURL("image/png")}s.dispose()}catch{i=null}return this.images.set(e.kind,i),i}};var NI=26,LI=5,zI=4,gd=class{constructor(e,t,i,r){this.kit=t;this.seed=i;this.random=r;this.batch=new xo(t,e,{instances:256,vertices:65536,cull:!0})}kit;seed;random;items=new Map;chunks=new Set;takenPropIds=new Set;spawnQueue=[];lastCells=[Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN,Number.NaN];batch;get props(){return this.items}refresh(e,t,i){if(this.cellsChanged(e,t)){let r=new Set;for(let s of[e-1,e,e+1]){if(s<0)continue;let o=this.chunkSize(s),a=s===e?2:1,c=Math.floor(t.x/o),l=Math.floor(t.z/o);for(let u=-a;u<=a;u+=1)for(let h=-a;h<=a;h+=1)r.add(`${s}:${c+u}:${l+h}`)}for(let s of r)this.chunks.has(s)||this.populateChunk(s,e);for(let s of this.chunks)r.has(s)||this.chunks.delete(s)}if(this.spawnQueue.length>0){let r=performance.now()+zI;for(;this.spawnQueue.length>0&&performance.now()<r;){let s=this.spawnQueue.shift();!s||!this.chunks.has(s.chunk)||this.takenPropIds.has(s.id)||this.add(s.definition,s.x,s.z,s.size,s.chunk,s.id)}}for(let r of this.items.values())r.chunk!==null&&!this.chunks.has(r.chunk)?this.remove(r):r.size<i*.035?this.remove(r):r.chunk===null&&Math.hypot(r.x-t.x,r.z-t.z)>i*60&&this.remove(r)}add(e,t,i,r,s,o,a){let c=a??go(e,{kit:this.kit,random:this.random});c.quaternion.identity(),c.scale.setScalar(r);let l=[];c.traverse(h=>{h.userData.spin&&l.push(h)});let u={id:o,object:c,definition:e,size:r,x:t,z:i,lift:e.motion==="fly"?r*1.4:0,heading:this.random()*Math.PI*2,motion:e.motion??null,vx:0,vz:0,vy:0,hop:0,wanderIn:this.random()*3,phase:this.random()*Math.PI*2,chunk:s,spinners:l};return this.batch.add(c),this.items.set(o,u),u}remove(e){this.batch.remove(e.object),e.object.visible=!0,this.items.delete(e.id)}take(e){if(this.remove(e),this.takenPropIds.add(e.id),this.takenPropIds.size>6e3){let t=this.takenPropIds.values().next().value;t!==void 0&&this.takenPropIds.delete(t)}}setVisible(e,t){this.batch.setVisible(e.object,t)}dispose(){this.items.clear(),this.batch.release()}update(e,t){let i=1-_n(3,e);for(let r of this.items.values()){let s=0;if(r.motion==="walk"||r.motion==="drive"){if(r.wanderIn-=e,r.wanderIn<=0&&(r.wanderIn=1.5+this.random()*4,r.heading+=(this.random()-.5)*(r.motion==="drive"?.8:2.4)),s=r.size*(r.motion==="drive"?1.4:.55),t&&r.size<=t.radius*br){let h=r.x-t.x,d=r.z-t.z;Math.hypot(h,d)<t.radius*4&&(r.heading+=ti(Fi(h,d)-r.heading)*_n(5,e),s*=2.2)}r.x+=Math.cos(r.heading)*s*e,r.z+=Math.sin(r.heading)*s*e}r.x+=r.vx*e,r.z+=r.vz*e,r.vx*=i,r.vz*=i,(r.hop>0||r.vy>0)&&(r.vy-=r.size*18*e,r.hop=Math.max(0,r.hop+r.vy*e),r.hop===0&&(r.vy=0)),r.phase+=e*(s>0?10:2);let o=0;r.motion==="walk"&&s>0&&(o=Math.abs(Math.sin(r.phase))*r.size*.12),r.motion==="fly"&&(o=Math.sin(r.phase*.4)*r.size*.3),r.motion==="bob"&&(o=Math.max(0,Math.sin(r.phase))*r.size*.08);let{position:a,rotation:c}=r.object,l=r.lift+r.hop+o,u=r.hop>0?r.hop/r.size:0;(a.x!==r.x||a.y!==l||a.z!==r.z||c.x!==u||c.y!==-r.heading||c.z!==0)&&(a.set(r.x,l,r.z),c.set(u,-r.heading,0),this.batch.update(r.object));for(let h of r.spinners){let d=h.userData.spin;h.rotation[d.axis]+=d.speed*e}}}nearestPickup(e){let t=null,i=Number.POSITIVE_INFINITY;for(let r of this.items.values()){if(r.size>e.radius*br||r.size<e.radius*.06)continue;let s=Math.hypot(r.x-e.x,r.z-e.z);if(s>e.radius*14)continue;let o=Math.abs(ti(Fi(r.x-e.x,r.z-e.z)-e.heading)),a=s*(1+o);a<i&&(i=a,t=r)}return t}cellsChanged(e,t){let i=this.lastCells,r=i[0]!==e;i[0]=e;for(let s=-1;s<=1;s+=1){let o=this.chunkSize(e+s),a=Math.floor(t.x/o),c=Math.floor(t.z/o),l=3+s*2;(i[l]!==a||i[l+1]!==c)&&(r=!0),i[l]=a,i[l+1]=c}return r}chunkSize(e){return .3*2**e*NI}populateChunk(e,t){this.chunks.add(e);let[i,r,s]=e.split(":"),o=Number(i),a=Number(r),c=Number(s),l=this.chunkSize(o),u=Sn(er(`${this.seed}:${e}`));for(let h=0;h<LI;h+=1){let d=`${e}:${h}`,f=(a+u())*l,m=(c+u())*l,y=u(),g=o+(y<.3?-1:y<.78?0:y<.94?1:2),p=es(f,m,t,this.seed).zone,S=Ui(u,zi(p,g))??Ui(u,zi(p,g-1))??Ui(u,zi(p,g+1)),E=u();if(!S||this.takenPropIds.has(d))continue;let _=.3*2**Math.max(0,g)*(.42+E*.5);this.spawnQueue.push({id:d,chunk:e,definition:S,x:f,z:m,size:_})}}};var __=.95,UI=8,OI=.1,FI=1e3/60,kI=1e3/30,NM=4,LM=5.5,BI=2.8,HI=2,v_=.35,GI=1.1,y_=.2,VI=.05,zM=5e4,$I=1.4,UM=new I,WI=new sn,b_={turn:0,speed:0},ki={stride:0,speed:0,idleSeconds:0,waiting:!1,time:0,reach:0,dizziness:0,stars:0},xd=class{constructor(e,t,i,r){this.audio=t;this.onHud=i;this.onEvent=r;this.seed=er("context-katamari-world"),this.random=Sn(this.seed^Date.now()),this.field=new gd(this.scene,this.kit,this.seed,this.random),this.renderer=new Qh({canvas:e,antialias:!0,powerPreference:"low-power"}),this.portraits=new md(this.renderer,this.kit),this.scene.fog=new va(16777215,10,40),this.environment=new pd(this.scene,this.kit,this.seed),this.effects=new ld(this.scene,this.kit,this.effectMaterials)}audio;onHud;onEvent;renderer;scene=new Gr;cameraRig=new cd;kit=new nd;environment;seed;random;field;actorCache=new Map;active=null;exiting=[];mode="empty";compacted={seq:null,compactions:null};pendingEntry=null;effectMaterials=EM();effects;portraits;drive=ql;manualSeconds=0;lastLookOut=-10;usedTokens=null;time=0;hudIn=0;lastHud=null;frame=0;lastFrameTime=0;running=!1;disposed=!1;lastFillMilestone=-1;hasOrigin=!1;looseCount=0;resize(e,t,i){if(e<=0||t<=0)return;this.renderer.setPixelRatio(Math.min(i,2)),this.renderer.setSize(e,t,!1);let r=this.cameraRig.camera;r.aspect=e/t,r.updateProjectionMatrix()}setDrive(e){this.drive=e,Yl(e)||(this.manualSeconds=NM)}setStage(e){this.mode=e.mode,this.compacted={seq:e.compactedSeq??null,compactions:e.compactions},e.usedTokens!==void 0&&(this.usedTokens=e.usedTokens);let t=Ls(e.fill);if(e.threadId===null)return;if((this.active?.threadId??this.pendingEntry?.threadId??null)!==e.threadId){this.handoff(e);return}if(this.pendingEntry){this.pendingEntry.fill=e.fill,this.pendingEntry.compactions=e.compactions,this.pendingEntry.compactedSeq=e.compactedSeq??null,this.pendingEntry.ready=e.ready;return}let r=this.active;if(!r||!e.ready)return;if(!r.synced){r.synced=!0,r.radius=t,r.targetRadius=t,r.compactedSeq=e.compactedSeq??null,ic(this.kit,r,e.compactions),r.stuck.length<12&&f_(this.kit,r);return}if(r.targetRadius=t,this.popIfCompacted(r)||r.pop)return;let s=aM(r.compactionsKnown?r.compactions:null,e.compactions);s!==null&&ic(this.kit,r,s)}popIfCompacted(e){let{seq:t,compactions:i}=this.compacted;return t===null||t===e.compactedSeq||!e.synced||e.pop||e.phase!=="stage"?!1:(e.compactedSeq=t,e.pop={time:0,fromRadius:e.radius,compactions:Math.max(i??0,e.compactions),burst:!1,startScale:1},!0)}gulp(e){let t=this.active;if(!t||t.phase!=="stage"||t.pop||!(e>0))return;let i=Math.min(1,Math.sqrt(e/VI)*.6);t.gulp={time:0,strength:i,chomps:i<.25?1:i<.6?2:3},this.audio.gulp(i),this.sprinkle(t,3+Math.round(i*7),!0);let r=t.radius*(4+i*8);for(let s of this.field.props.values()){if(s.size>t.radius*br)continue;let o=t.x-s.x,a=t.z-s.z,c=Math.hypot(o,a);if(c>r||c===0)continue;let l=t.radius*(2+i*6);s.vx=o/c*l,s.vz=a/c*l,s.vy=s.size*(2+i*4)}i>=.6&&(this.cameraRig.shake=Math.max(this.cameraRig.shake,.5));for(let s=0;s<3+i*6;s+=1)this.effects.puff(t.x,t.z,t.radius*1.4)}start(){if(this.running||this.disposed)return;this.running=!0,this.lastFrameTime=performance.now();let e=t=>{if(!this.running)return;let i=this.isCalm()?kI:FI;if(t-this.lastFrameTime<i-1){this.frame=window.requestAnimationFrame(e);return}let r=Math.min(.1,(t-this.lastFrameTime)/1e3);this.lastFrameTime=t,this.update(r),this.renderer.render(this.scene,this.cameraRig.camera),this.frame=window.requestAnimationFrame(e)};this.frame=window.requestAnimationFrame(e)}isCalm(){return this.mode!=="rolling"&&this.exiting.length===0&&this.pendingEntry===null&&(this.active===null||this.active.phase==="stage"&&this.active.pop===null&&this.active.gulp===null)&&!this.effects.coinsFlying()}stop(){this.running=!1,window.cancelAnimationFrame(this.frame),this.audio.setRolling(!1,0)}dispose(){this.stop(),this.disposed=!0,this.field.dispose(),this.active?.items.release();for(let e of this.exiting)e.items.release();this.effects.dispose(),this.environment.dispose(),this.kit.dispose(),this.renderer.dispose(),this.renderer.forceContextLoss()}handoff(e){let t=this.active;if(this.active=null,this.lastHud=null,t){let i=new fe(-Math.sin(this.cameraRig.heading),Math.cos(this.cameraRig.heading));t.phase="exit",t.phaseTime=0,t.exitDirection.copy(i),this.exiting.push(t),this.cameraRig.frozen=!0,this.audio.whoosh()}this.pendingEntry={threadId:e.threadId??"",fill:e.fill,compactions:e.compactions,compactedSeq:e.compactedSeq??null,ready:e.ready,delay:t?.45:0,waited:0}}spawnEntering(e,t,i,r,s){let o=this.exiting.find(d=>d.threadId===e);if(o){this.exiting=this.exiting.filter(d=>d!==o),o.targetRadius=Ls(t),s&&ic(this.kit,o,i),o.compactedSeq=r,o.phase="enter",o.phaseTime=0,this.active=o,this.onEvent({kind:"enter",threadId:e});return}let a=this.actorCache.get(e);this.actorCache.delete(e),a?.items.restore();let c=a??MM(this.kit,e,t,i,s);c.targetRadius=Ls(t),a&&s&&ic(this.kit,c,i),c.compactedSeq=r;let l=this.cameraRig,u=new fe(Math.sin(l.heading),-Math.cos(l.heading)),h=Math.max(c.radius,l.radius)*9;c.x=l.focus.x+u.x*h,c.z=l.focus.z+u.y*h,c.heading=Fi(-u.x,-u.y),c.phase=this.exiting.length>0||this.hasOrigin?"enter":"stage",c.phaseTime=0,c.speed=0,c.vx=0,c.vz=0,c.phase==="stage"&&(c.x=l.focus.x,c.z=l.focus.z),this.hasOrigin=!0,this.scene.add(c.ball,c.rig.root,c.ballShadow,c.cousinShadow),this.active=c,this.lastFillMilestone=Math.floor(ea(t)*10),this.onEvent({kind:"enter",threadId:e})}update(e){if(this.time+=e,Yl(this.drive)||(this.manualSeconds=NM),this.manualSeconds=Math.max(0,this.manualSeconds-e),this.pendingEntry){let a=this.pendingEntry;a.delay-=e,a.waited+=e,a.delay<=0&&(a.ready||a.waited>HI)&&(this.pendingEntry=null,this.spawnEntering(a.threadId,a.fill,a.compactions,a.compactedSeq,a.ready))}let t=this.active;t&&(this.popIfCompacted(t),this.updateActor(t,e));for(let a of this.exiting)this.updateActor(a,e);this.retireDeparted();let i=this.cameraRig;i.update(e,this.active,this.field);let r=i.radius,s=ta(r);this.field.refresh(s,i.focus,r),this.field.update(e,t&&t.phase==="stage"?t:null),this.effects.update(e),this.environment.update(e,this.time,i.focus,r,s,i.camera);let o=t!==null&&t.phase==="stage"&&(this.mode==="rolling"||this.manualSeconds>0)&&t.speed>t.radius*.2;this.audio.setRolling(o,t?t.speed/Math.max(t.radius*2.4,.001):0),this.hudIn-=e,this.hudIn<=0&&t&&(this.hudIn=OI,this.reportHud(t,s))}reportHud(e,t){let i=es(e.x,e.z,t,this.seed).zone,r=e.radius<e.targetRadius*.98,s=this.manualSeconds>0,o=e.phase!=="stage"||this.exiting.length>0,a=this.lastHud;a!==null&&a.radius===e.radius&&a.targetRadius===e.targetRadius&&a.compactions===e.compactions&&a.zone===i&&a.hungry===r&&a.steering===s&&a.transitioning===o||(this.lastHud={radius:e.radius,targetRadius:e.targetRadius,compactions:e.compactions,zone:i,hungry:r,steering:s,transitioning:o},this.onHud(this.lastHud))}retireDeparted(){let e=this.exiting,t=this.cameraRig.focus,i=this.cameraRig.radius,r=0;for(let s=0;s<e.length;s+=1){let o=e[s],a=Math.hypot(o.x-t.x,o.z-t.z)>Math.max(o.radius,i)*14;o.phaseTime>3.5||a?this.retire(o):e[r++]=o}e.length=r}retire(e){for(this.scene.remove(e.ball,e.rig.root,e.ballShadow,e.cousinShadow),e.items.release(),this.actorCache.set(e.threadId,e);this.actorCache.size>UI;){let t=this.actorCache.keys().next().value;if(t===void 0)break;this.actorCache.delete(t)}this.exiting.length<=1&&(this.cameraRig.frozen=!1)}updateActor(e,t){e.phaseTime+=t;let i=e.radius,r=0,s=0,o=3,a=0,c=Math.cos(e.heading),l=Math.sin(e.heading);if(e.pop)this.updatePop(e,t);else if(e.phase==="exit"){let C=Fi(e.exitDirection.x,e.exitDirection.y);a=ti(C-e.heading)*4,r=c*i*5,s=l*i*5}else if(e.phase==="enter"){let C=this.cameraRig.focus.x-e.x,v=this.cameraRig.focus.z-e.z,T=Math.hypot(C,v);a=ti(Fi(C,v)-e.heading)*4;let P=Math.min(i*4.5,T*2.2);r=c*P,s=l*P,(T<i*.6||e.phaseTime>3)&&(e.phase="stage",e.phaseTime=0,this.cameraRig.frozen=!1)}else if(this.manualSeconds>0&&e===this.active){let C=this.drive;a=C.turn*BI,r=c*C.forward*i*LM,s=l*C.forward*i*LM,o=Yl(C)?.9:1.8}else if(this.mode==="rolling"){let C=this.wander(e,t);a=C.turn,r=c*C.speed,s=l*C.speed,o=2.2}else o=3.5;let u=h_(e.compactions);if(e.phase==="stage"&&e.speed>i*.1){let C=this.manualSeconds>0&&e===this.active;a+=Math.sin(this.time*2.1+e.stride*.13)*u*(C?.7:1.4)}e.heading=ti(e.heading+a*t);let h=_n(o,t);e.vx+=(r-e.vx)*h,e.vz+=(s-e.vz)*h,e.speed=Math.hypot(e.vx,e.vz),e.speed<i*.01&&r===0&&s===0&&(e.vx=0,e.vz=0,e.speed=0);let d=Math.cos(e.heading),f=Math.sin(e.heading);e.x+=e.vx*t,e.z+=e.vz*t;let m=e.speed*t;m>0?(UM.set(e.vz,0,-e.vx).normalize(),e.roll.quaternion.premultiply(WI.setFromAxisAngle(UM,m/i)),e.idleSeconds=0):e.idleSeconds+=t,e.gulp&&!e.pop&&this.updateGulp(e,t),e.phase==="stage"&&!e.pop&&(this.collide(e),e===this.active&&this.watchAhead(e),this.growToward(e,t)),e.ball.position.set(e.x,e.radius*e.roll.scale.y,e.z),e.core.scale.setScalar(e.radius*1.68),e.ballShadow.position.set(e.x,.002*e.radius,e.z),e.ballShadow.scale.setScalar(e.radius*.95*e.roll.scale.x),e.moons.update(t,e.radius*e.roll.scale.x,this.time);let y=_o(e.radius),g=d_(e.radius),p=e.radius+g*Un.lerp(.28,.13,y),S=Math.sin(this.time*1.9)*u*g*.12,E=e.x-d*p-f*S,_=e.z-f*p+d*S,M=g*.58,w=Math.min(Math.PI/2-.2,Math.atan2(p-e.radius*.6,Math.max(.001,M-e.radius)));e.rig.root.position.set(E,0,_),e.rig.root.rotation.y=-e.heading,e.rig.root.scale.setScalar(g),e.cousinShadow.position.set(E,.003*e.radius,_),e.cousinShadow.scale.setScalar(g*.3),e.stride+=e.speed/g*t*3.2,ki.stride=e.stride,ki.speed=e.speed/g,ki.idleSeconds=e.idleSeconds,ki.waiting=this.mode==="waiting"&&e===this.active&&e.phase==="stage",ki.time=this.time,ki.reach=w,ki.dizziness=u,ki.stars=Math.min(od,e.compactions),bM(e.rig,ki),m>0&&this.dropCoins(e,m,E,_,g),e.speed>e.radius*.8&&e.random()<t*10*Math.min(2,e.speed/e.radius)&&this.effects.glint(e.x,e.z,e.radius,e.random),e.speed>e.radius*1.5&&e.random()<t*6&&this.effects.puff(E,_,e.radius)}wander(e,t){let i=e.radius;e.decisionIn-=t;let r=e.radius<e.targetRadius*.98;if(e.decisionIn<=0){let h=e.random();e.behaviorSign=e.random()<.5?-1:1,r&&h<.6?(e.behavior="seek",e.seekTarget=this.field.nearestPickup(e)):h<.45?e.behavior="cruise":h<.75?e.behavior="swerve":e.behavior="loop",e.decisionIn=e.behavior==="swerve"?.6+e.random()*.8:1.5+e.random()*3}e.turnRate+=(e.random()-.5)*t*4,e.turnRate*=1-_n(.8,t);let s=e.turnRate+Math.sin(this.time*.9+e.x*.1)*.25,o=i*(4+Math.sin(this.time*.37)*.6),a=this.field.props;switch(e.behavior){case"swerve":s+=e.behaviorSign*1.7;break;case"loop":s+=e.behaviorSign*1.05,o*=.85;break;case"seek":{let h=e.seekTarget;if(h&&a.has(h.id)){let d=Fi(h.x-e.x,h.z-e.z);s=ti(d-e.heading)*2.6,o*=1.15}else e.decisionIn=0;break}default:break}let c=i*3.2,l=Math.cos(e.heading),u=Math.sin(e.heading);for(let h of a.values()){if(h.size<i*__||h.lift>i*2)continue;let d=h.x-e.x,f=h.z-e.z,m=d*l+f*u;if(m<=0||m>c+h.size)continue;let y=d*-u+f*l;Math.abs(y)<i+h.size*.8&&(s+=(y>0?-1:1)*2.4*(1-m/(c+h.size)))}return b_.turn=Un.clamp(s,-2.6,2.6),b_.speed=o,b_}collide(e){let t=e.radius<e.targetRadius*.995,i=this.field.props,r=i.size;for(let s of i.values()){if(r--<=0)break;if(s.lift+s.hop>e.radius*1.6)continue;let o=s.x-e.x,a=s.z-e.z,c=Math.hypot(o,a),l=e.radius+s.size*.7;if(c>=l)continue;let u=c>0?o/c:1,h=c>0?a/c:0;if(t&&s.size<=e.radius*br){this.rollUp(e,s);continue}if(s.size<e.radius*__){let f=Math.max(e.speed,e.radius)*1.3;s.vx=u*f,s.vz=h*f,s.hop<=0&&(s.vy=s.size*3),s.x=e.x+u*l,s.z=e.z+h*l;continue}e.x=s.x-u*l,e.z=s.z-h*l;let d=e.vx*u+e.vz*h;d>0&&(e.vx-=u*d*1.4,e.vz-=h*d*1.4),d>e.radius*2.2&&this.knockLoose(e,d,u,h),this.manualSeconds<=0&&(e.heading=ti(Fi(-u,-h)+(e.random()-.5)*1.2),e.decisionIn=Math.min(e.decisionIn,.3)),this.time-e.lastBonk>.4&&(e.lastBonk=this.time,this.cameraRig.shake=.35,this.audio.bonk())}}knockLoose(e,t,i,r){let s=Math.min(e.stuck.length-4,1+Math.floor(t/e.radius-2));if(s<=0)return;let o=e.stuck.splice(e.stuck.length-s,s),a=new I;for(let c of o){m_(e,c,a),e.items.remove(c.object);let l=this.field.add(c.definition,a.x,a.z,c.size,null,this.looseId("loose"),c.object),u=(e.random()-.5)*2;l.vx=(-i+-r*u)*e.radius*3,l.vz=(-r+i*u)*e.radius*3,l.hop=Math.max(0,a.y-c.size),l.vy=e.radius*4}this.onEvent({kind:"knockedOff",count:o.length})}watchAhead(e){if(e.speed<e.radius||this.time-this.lastLookOut<3)return;let t=e.vx/e.speed,i=e.vz/e.speed;for(let r of this.field.props.values()){if(r.size<e.radius*__)continue;let s=r.x-e.x,o=r.z-e.z,a=s*t+o*i,c=Math.abs(s*-i+o*t);if(a>0&&a<e.radius*2.5+r.size&&c<e.radius+r.size*.6){this.lastLookOut=this.time,this.onEvent({kind:"lookOut"});return}}}rollUp(e,t){this.field.take(t);let r=new I(t.x-e.x,t.lift+t.hop+t.size*.5-e.radius,t.z-e.z).normalize().applyQuaternion(e.roll.quaternion.clone().invert());p_(this.kit,e,t.definition,t.size,r,e.radius*.84,t.object);let s=Math.max(t.size*.1,(e.targetRadius-e.radius)*.14);e.radius=Math.min(e.targetRadius,e.radius+s),e.hungrySeconds=0,this.audio.pickup(t.size/e.radius),this.onEvent({kind:"rolledUp",name:dM(t.definition),size:t.size,image:this.portraits.get(t.definition)});let o=ci(e.radius),a=Math.floor(o*10);a>this.lastFillMilestone&&(this.lastFillMilestone=a,this.onEvent({kind:"pickup",fill:o}))}growToward(e,t){if(wM(e),e.targetRadius<e.radius*.9){this.shed(e);return}e.radius<e.targetRadius*.98?(e.hungrySeconds+=t,this.mode==="rolling"&&e.hungrySeconds>5?(e.hungrySeconds=0,this.sprinkle(e)):this.mode!=="rolling"&&e.hungrySeconds>$I&&(e.hungrySeconds=0,this.sprinkle(e,5,!0))):e.hungrySeconds=0}shed(e){let t=g_(e,e.radius,e.targetRadius);for(let i of t.slice(0,24)){e.items.remove(i.object);let r=e.random()*Math.PI*2,s=this.field.add(i.definition,e.x+Math.cos(r)*e.radius*1.2,e.z+Math.sin(r)*e.radius*1.2,i.size,null,this.looseId("shed"),i.object);s.vx=Math.cos(r)*e.radius*3,s.vz=Math.sin(r)*e.radius*3,s.vy=e.radius*4}for(let i of t.slice(24))e.items.remove(i.object);e.radius=e.targetRadius;for(let i of e.stuck)i.depth=Math.min(i.depth,e.radius*.84);for(let i of e.stuck)i.object.position.setLength(i.depth-i.size*.4),e.items.update(i.object);this.audio.shed()}updatePop(e,t){let i=e.pop;if(!i)return;if(i.time+=t,i.time<v_){let o=i.time/v_,a=1+.32*(1-(1-o)**3),c=Math.sin(i.time*48)*.07*o;e.roll.scale.set(a*(1+c),a*(1-c),a*(1+c)),this.cameraRig.shake=Math.max(this.cameraRig.shake,.12*o);return}i.burst||(i.burst=!0,this.burst(e,i));let r=Math.min(1,(i.time-v_)/GI),s=r>=1?1:1-2**(-9*r)*Math.cos(r*Math.PI*3.2);e.roll.scale.setScalar(Un.lerp(i.startScale,1,s)),r>=1&&(e.roll.scale.setScalar(1),e.pop=null)}burst(e,t){let i=Math.min(e.targetRadius,t.fromRadius);t.startScale=t.fromRadius*1.32/i;let r=g_(e,t.fromRadius,i),s=new I;for(let[o,a]of r.entries()){if(m_(e,a,s),e.items.remove(a.object),o>=30)continue;let c=s.x-e.x,l=s.z-e.z,u=Math.hypot(c,l)||1,h=this.field.add(a.definition,s.x,s.z,a.size,null,this.looseId("pop"),a.object),d=t.fromRadius*(3+e.random()*3);h.vx=c/u*d,h.vz=l/u*d,h.hop=Math.max(0,s.y-a.size),h.vy=t.fromRadius*(5+e.random()*4)}e.radius=i;for(let o of e.stuck)o.depth=Math.min(o.depth,i*.84),o.object.position.setLength(o.depth-o.size*.4),e.items.update(o.object);x_(this.kit,e,t.compactions,!0),this.effects.burst(e.x,e.z,t.fromRadius,this.random),this.cameraRig.shake=.6,this.audio.pop(),this.onEvent({kind:"compacted",compactions:t.compactions})}sprinkle(e,t=5,i=!1){let r=ta(e.radius),s=es(e.x,e.z,r,this.seed).zone;for(let o=0;o<t;o+=1){let a=Ui(this.random,zi(s,r))??Ui(this.random,zi("room",Math.max(0,r-1)));if(!a)continue;let c=i?this.random()*Math.PI*2:(this.random()-.5)*1.4,l=e.radius*(i?1.1+this.random()*1.2:3+this.random()*4),u=e.heading+c,h=this.field.add(a,e.x+Math.cos(u)*l,e.z+Math.sin(u)*l,e.radius*(.2+this.random()*.25),null,this.looseId("sprinkle"));h.hop=e.radius*(i?3+this.random()*5:6),h.vy=0,i&&(h.vx=-Math.cos(u)*e.radius*3,h.vz=-Math.sin(u)*e.radius*3)}i||this.onEvent({kind:"sprinkle"})}looseId(e){return this.looseCount+=1,`${e}:${this.looseCount}`}updateGulp(e,t){let i=e.gulp;if(!i)return;i.time+=t;let r=i.chomps*y_;if(i.time>=r){e.roll.scale.setScalar(1),e.gulp=null;return}let s=Math.sin(i.time%y_/y_*Math.PI),o=s*(.1+i.strength*.22);e.roll.scale.set(1+o*.7,1-o,1+o*.7),i.strength>=.6&&(this.cameraRig.shake=Math.max(this.cameraRig.shake,.3*s))}dropCoins(e,t,i,r,s){let o=this.usedTokens;if(e!==this.active||e.phase!=="stage"||o===null||o<zM)return;e.coinsAnnounced||(e.coinsAnnounced=!0,this.onEvent({kind:"coins",usedTokens:o}));let a=.35*Math.min(6,o/zM);for(e.coinDistance+=t/e.radius;e.coinDistance>=1/a;){e.coinDistance-=1/a;let c=Math.max(s*.3,e.radius*.22);this.effects.coin(i,s*.35,r,c,e.random),e.random()<.5&&this.audio.coin()}}};var yo={width:360,height:280},bo={width:300,height:240};function ts(n,e){let t=vd(n.width,bo.width,Math.max(bo.width,e.width-32)),i=vd(n.height,bo.height,Math.max(bo.height,e.height-32));return{width:t,height:i,right:vd(n.right,16,Math.max(16,e.width-t-16)),bottom:vd(n.bottom,16,Math.max(16,e.height-i-16))}}function S_(n,e){let t={right:16,bottom:16,...yo};if(!e)return ts(t,n);let i=n.width-e.right-32;if(i<bo.width)return ts(t,n);let r=Math.min(yo.width,i),s=Math.max(bo.height,Math.round(r*yo.height/yo.width));return ts({right:16,bottom:16,width:r,height:s},n)}function OM(n){if(!n||typeof n!="object")return null;let{right:e,bottom:t,width:i,height:r}=n;return!_d(e)||!_d(t)?null:{right:e,bottom:t,width:_d(i)?i:yo.width,height:_d(r)?r:yo.height}}function _d(n){return typeof n=="number"&&Number.isFinite(n)}function vd(n,e,t){return Math.min(Math.max(n,e),t)}var BM="context-katamari:position";function oc(){return{width:window.innerWidth,height:window.innerHeight}}function FM(){let n=document.querySelector("[data-promptbox-editor-content]")?.parentElement??null;if(!n)return null;let e=n.getBoundingClientRect().width,t=null;for(;n&&n!==document.body;){let i=n.getBoundingClientRect();if(i.width>e+64)break;t={left:i.left,right:i.right},n=n.parentElement}return t}function kM(){try{let n=OM(JSON.parse(window.localStorage.getItem(BM)??"null"));return n?ts(n,oc()):null}catch{return null}}function ZI(n){try{window.localStorage.setItem(BM,JSON.stringify(n))}catch{}}function HM(){let n=Rt(!1),[e,t]=Xt(()=>{let a=kM();return n.current=a!==null,a??S_(oc(),FM())}),i=Rt(null);return hn(()=>{let a=()=>t(l=>n.current?kM()??ts(l,oc()):S_(oc(),FM())),c=window.requestAnimationFrame(a);return window.addEventListener("resize",a),()=>{window.cancelAnimationFrame(c),window.removeEventListener("resize",a)}},[]),{layout:e,beginDrag:a=>c=>{c.button===0&&(c.preventDefault(),c.currentTarget.setPointerCapture(c.pointerId),i.current={kind:a,pointerId:c.pointerId,startX:c.clientX,startY:c.clientY,origin:e})},continueDrag:a=>{let c=i.current;if(!c||c.pointerId!==a.pointerId)return;let l=a.clientX-c.startX,u=a.clientY-c.startY;t(ts(c.kind==="move"?{...c.origin,right:c.origin.right-l,bottom:c.origin.bottom-u}:{...c.origin,width:c.origin.width-l,height:c.origin.height-u},oc()))},endDrag:a=>{let c=i.current;!c||c.pointerId!==a.pointerId||(i.current=null,n.current=!0,t(l=>(ZI(l),l)))}}}function GM({stage:n,muted:e,onMutedChange:t,onClose:i}){let r=Rt(null),s=Rt(null),o=Rt(null),a=Rt(null),c=Rt(new Set),[l,u]=Xt(null),[h,d]=Xt(null),[f,m]=Xt(null),[y,g]=Xt(null),[p,S]=Xt(0),[E,_]=Xt(!1),[M,w]=Xt(!1),[C,v]=Xt(()=>!Ky()),T=Rt(0),P=Rt(0),L=Rt(0),F=Rt(0),V=Rt(0),N=Vi(J=>{window.clearTimeout(T.current);let ae=$y(J);d({text:J,key:++L.current,seconds:ae}),F.current=Date.now()+ae*1e3,T.current=window.setTimeout(()=>d(null),ae*1e3)},[]),B=Vi(J=>{let ae=F.current-Date.now();if(ae<=0){N(J);return}window.clearTimeout(V.current),V.current=window.setTimeout(()=>B(J),ae+300)},[N]),q=Vi(J=>{switch(J.kind){case"enter":N(Ei(wi.enter));break;case"pickup":B(Zy(J.fill));break;case"compacted":N(Xy(J.compactions));break;case"sprinkle":B(Ei(wi.sprinkle));break;case"rolledUp":g({name:J.name,image:J.image,key:++L.current});break;case"lookOut":window.clearTimeout(P.current),S(Date.now()),P.current=window.setTimeout(()=>S(0),1800);break;case"knockedOff":N(Ei(wi.knockedOff));break;case"coins":B(qy(J.usedTokens));break}},[N,B]),Z=Rt(q);Z.current=q;let se={threadId:n.threadId,mode:n.mode,fill:n.fill,compactions:n.compactions,compactedSeq:n.compactedSeq,ready:n.ready,usedTokens:n.usedTokens},X=Rt(se);X.current=se,hn(()=>{let J=r.current;if(!J)return;let ae=new Kl(e);ae.unlock(),a.current=ae;let Ge=null,Fe=null,We=0,je=()=>{let ct=new xd(J,ae,A=>u(A),A=>Z.current(A));Ge=ct,o.current=ct;let it=()=>{let A=J.getBoundingClientRect();ct.resize(A.width,A.height,window.devicePixelRatio||1)};it(),Fe=new ResizeObserver(it),Fe.observe(J),ct.setStage(X.current),ct.start(),w(!0),ct.setDrive(Jl(c.current))},D=window.requestAnimationFrame(()=>{We=window.setTimeout(je,0)});return()=>{window.cancelAnimationFrame(D),window.clearTimeout(We),Fe?.disconnect(),Ge?.dispose(),ae.dispose(),o.current=null,a.current=null,window.clearTimeout(T.current),window.clearTimeout(V.current),window.clearTimeout(P.current)}},[]),hn(()=>{o.current?.setStage(X.current)},[n.threadId,n.mode,n.fill,n.compactions,n.compactedSeq,n.ready,n.usedTokens]);let ee=Rt({threadId:null,usedTokens:null,ready:!1});hn(()=>{let J=ee.current;ee.current={threadId:n.threadId,usedTokens:n.usedTokens,ready:n.ready};let ae=Jy(J,{threadId:n.threadId,usedTokens:n.usedTokens,capacityTokens:n.capacityTokens,ready:n.ready,compactions:n.compactions});ae&&(o.current?.gulp(ae.share),m({text:ae.label,tier:ae.tier,key:++L.current}))},[n.threadId,n.usedTokens,n.capacityTokens,n.ready,n.compactions]);let re=Rt(new Map),De=n.turns.find(J=>J.status!=="running")??null;hn(()=>{if(n.threadId===null||!n.ready)return;let J=re.current,ae=J.get(n.threadId);J.set(n.threadId,De?.turnId??""),!(ae===void 0||De===null||ae===De.turnId)&&N(Vy(De,n.capacityTokens))},[N,n.threadId,n.ready,De?.turnId]);let Re=Rt(n.mode);hn(()=>{if(Re.current===n.mode)return;let J=Re.current==="empty";if(Re.current=n.mode,J)return;let ae=Wy(n.mode);ae!==null&&N(ae)},[N,n.mode]),hn(()=>{a.current?.setMuted(e)},[e]);let{layout:ht,beginDrag:nt,continueDrag:dt,endDrag:Y}=HM(),te=J=>{if(J.key==="Escape"){J.currentTarget.blur();return}!Ig.has(J.key)||J.metaKey||J.ctrlKey||J.altKey||(J.preventDefault(),J.stopPropagation(),c.current.add(J.key),o.current?.setDrive(Jl(c.current)))},ye=J=>{Ig.has(J.key)&&(J.preventDefault(),c.current.delete(J.key),o.current?.setDrive(Jl(c.current)))},$e=Vi(J=>{v(J),J||Qy()},[]),Ae=Vi(()=>{s.current?.contains(document.activeElement)&&s.current.focus(),$e(!1)},[$e]),qe=()=>{c.current.clear(),o.current?.setDrive(ql),_(!1)},ft=l?.radius??.3,ne=l?.targetRadius??ft,le=Math.max(0,Math.min(99,Math.round((1-n.fill)*100))),he=n.usedTokens!==null&&n.capacityTokens!==null?`${li(n.usedTokens)} / ${li(n.capacityTokens)}`:"\u2014";return xt("div",{className:"ck-window",style:{right:ht.right,bottom:ht.bottom,width:ht.width,height:ht.height},"data-mode":n.mode,"data-focused":E,"data-ready":M,role:"region","aria-label":"Context Katamari",children:[xt("div",{ref:s,className:"ck-stage",tabIndex:0,"aria-label":"Katamari world. Click, then roll with the arrow keys. Escape to let go.",onFocus:()=>{_(!0),a.current?.unlock()},onBlur:qe,onPointerDown:()=>a.current?.unlock(),onKeyDown:te,onKeyUp:ye,children:[ue("canvas",{ref:r,className:"ck-canvas"}),xt("div",{className:"ck-gauge","aria-label":`Katamari ${Math.round(ci(ne)*100)}% of context`,children:[ue(nb,{fill:ci(ft)}),ue(tb,{radius:ft}),xt("span",{className:"ck-goal",children:[xt("svg",{viewBox:"0 0 40 16","aria-hidden":"true",children:[ue("path",{d:"M2 12 Q 20 2 36 8"}),ue("path",{d:"M31 4 l6 4 -7 2"})]}),he]})]}),ue(ib,{percentLeft:le}),ue(sb,{turns:n.turns,capacity:n.capacityTokens}),f?ue("div",{className:"ck-gulp","data-tier":f.tier,"aria-hidden":"true",onAnimationEnd:()=>m(null),children:f.text},f.key):null,ue("div",{className:"ck-title",title:n.title??void 0,children:n.title??"Open a thread"}),h?xt("div",{className:"ck-king",role:"status","aria-label":h.text,style:{animationDuration:`${h.seconds}s`},children:[ue("span",{className:"ck-king-face","aria-hidden":"true",children:"\u265B"}),ue("span",{className:"ck-king-caption",children:ue(ob,{text:h.text})})]},h.key):null,xt("div",{className:"ck-item","data-look-out":p!==0,children:[p!==0?ue("span",{className:"ck-look-out",children:"LOOK OUT!"}):null,ue("div",{className:"ck-item-disc",children:y?.image?ue("img",{src:y.image,alt:""},y.key):null}),y?ue("span",{className:"ck-item-name",children:y.name},y.key):null]}),ue(rb,{mode:n.mode,compactions:l?.compactions??n.compactions??0}),C?ue(eb,{onClose:Ae}):null,ue("div",{className:"ck-hint","aria-hidden":"true",children:E?"\u2191\u2193 roll \xB7 \u2190\u2192 steer":"Click, then use the arrow keys"})]}),ue("div",{className:"ck-grip",role:"presentation",title:"Drag to move",onPointerDown:nt("move"),onPointerMove:dt,onPointerUp:Y,onPointerCancel:Y,children:ue("span",{})}),ue("div",{className:"ck-resize",role:"presentation",title:"Drag to resize",onPointerDown:nt("resize"),onPointerMove:dt,onPointerUp:Y,onPointerCancel:Y}),xt("div",{className:"ck-controls",children:[ue("button",{type:"button",className:"ck-button","aria-label":C?"Hide the guide":"What everything means","aria-pressed":C,title:C?"Hide the guide":"What everything means",onClick:()=>$e(!C),children:ue("span",{className:"ck-button-glyph","aria-hidden":"true",children:"?"})}),ue("button",{type:"button",className:"ck-button","aria-label":e?"Unmute":"Mute","aria-pressed":e,title:e?"Unmute":"Mute",onClick:()=>t(!e),children:e?xt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[ue("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),ue("path",{d:"M17 9l4 6M21 9l-4 6"})]}):xt("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:[ue("path",{d:"M4 9h4l5-4v14l-5-4H4z"}),ue("path",{d:"M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"})]})}),ue("button",{type:"button",className:"ck-button","aria-label":"Close Context Katamari",title:"Close",onClick:i,children:ue("svg",{viewBox:"0 0 24 24","aria-hidden":"true",children:ue("path",{d:"M6 6l12 12M18 6L6 18"})})})]})]})}var XI="context-katamari:open",qI="context-katamari:muted",YI=4e3,JI=3e4,jI=[];function WM(n,e){let t=new Set,i=e;try{let r=window.localStorage.getItem(n);r!==null&&(i=r==="true")}catch{}return{get:()=>i,set(r){i=r;try{window.localStorage.setItem(n,String(r))}catch{}for(let s of t)s()},subscribe(r){return t.add(r),()=>t.delete(r)}}}var yd=WM(XI,!1),VM=WM(qI,!1);function $M(n){return N_(n.subscribe,n.get,n.get)}function KI(n,e,t){let i=F_(),[r,s]=Xt(new Map),o=Rt(new Map),a=Vi(c=>{let l=o.current.get(c)??cM();o.current.set(c,l);let u=l.begin();i.call("readThreadContext",{threadId:c}).then(h=>{l.accept(u)&&s(d=>{let f=d.get(c),m=h.compactions===null?{...h,compactions:f?.compactions??null}:h;if(f!==void 0&&f?.usage?.usedTokens===m.usage?.usedTokens&&f?.usage?.capacityTokens===m.usage?.capacityTokens&&f?.compactions===m.compactions&&JSON.stringify(f?.turns??[])===JSON.stringify(m.turns??[]))return d;let y=new Map(d);return y.set(c,m),y})}).catch(h=>{console.warn("Context Katamari could not read thread context",h)})},[i]);return hn(()=>{if(n===null)return;a(n);let c=window.setInterval(()=>a(n),e?YI:JI);return()=>window.clearInterval(c)},[a,n,e,t]),n===null?null:r.get(n)??null}function QI(){let n=$M(yd),e=$M(VM);return n?ue(eD,{muted:e,onMutedChange:VM.set,onClose:()=>yd.set(!1)}):null}function eD({muted:n,onMutedChange:e,onClose:t}){let{threadId:i}=U_(),r=z_(),s=wd(()=>i===null?null:r.threads.find(p=>p.id===i)??null,[i,r.threads]),o=s?oM(s):!1,a=Rt(a_),c=wd(()=>{let p=sM(a.current,{threadId:i,working:o});return a.current=p.state,p.state},[i,o]),l=c.threadId===null?null:r.threads.find(p=>p.id===c.threadId)??null,u=KI(c.threadId,c.mode==="rolling",l?.updatedAt??null),[h,d]=Xt(new Map);O_(Fy,p=>{let S=ky.safeParse(p);S.success&&d(E=>(E.get(S.data.threadId)?.seq??-1)>=S.data.seq?E:new Map(E).set(S.data.threadId,S.data))});let f=c.threadId===null?null:h.get(c.threadId)??null,m=u?.compactions??null,y=u?.usage??null,g={threadId:c.threadId,mode:c.mode,fill:y?By(y.usedTokens,y.capacityTokens):0,compactions:f===null?m:Math.max(m??0,f.compactions),compactedSeq:f?.seq??null,ready:u!==null,title:l?l.title?.trim()||l.titleFallback?.trim()||"Untitled thread":c.threadId===null?null:"Thread",usedTokens:y?.usedTokens??null,capacityTokens:y?.capacityTokens??null,turns:u?.turns??jI};return ue(GM,{stage:g,muted:n,onMutedChange:e,onClose:t})}var Ck=L_(n=>{n.slots.sidebarFooterAction({id:"toggle",title:"Context Katamari",icon:"Circle",run:()=>yd.set(!yd.get())}),n.slots.experimental_appOverlay({id:"window",component:QI})});export{Ck as default};
