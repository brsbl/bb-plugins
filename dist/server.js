import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);
var Su=Object.defineProperty;var s=(e,t)=>Su(e,"name",{value:t,configurable:!0});var le=(e,t)=>{for(var o in t)Su(e,o,{get:t[o],enumerable:!0})};import{randomUUID as Sd}from"node:crypto";var f={};le(f,{$brand:()=>an,$input:()=>Is,$output:()=>Zs,NEVER:()=>sn,TimePrecision:()=>As,ZodAny:()=>wc,ZodArray:()=>Sc,ZodBase64:()=>Cr,ZodBase64URL:()=>jr,ZodBigInt:()=>mt,ZodBigIntFormat:()=>Lr,ZodBoolean:()=>dt,ZodCIDRv4:()=>Or,ZodCIDRv6:()=>Ar,ZodCUID:()=>$r,ZodCUID2:()=>Sr,ZodCatch:()=>Yc,ZodCodec:()=>Xt,ZodCustom:()=>Qt,ZodCustomStringFormat:()=>pt,ZodDate:()=>Vt,ZodDefault:()=>Uc,ZodDiscriminatedUnion:()=>Zc,ZodE164:()=>Rr,ZodEmail:()=>wr,ZodEmoji:()=>kr,ZodEnum:()=>ut,ZodError:()=>B0,ZodExactOptional:()=>Dc,ZodFile:()=>Nc,ZodFirstPartyTypeKind:()=>au,ZodFunction:()=>nu,ZodGUID:()=>Ut,ZodIPv4:()=>Er,ZodIPv6:()=>Tr,ZodISODate:()=>gr,ZodISODateTime:()=>hr,ZodISODuration:()=>vr,ZodISOTime:()=>xr,ZodIntersection:()=>Ic,ZodIssueCode:()=>W0,ZodJWT:()=>Nr,ZodKSUID:()=>Ir,ZodLazy:()=>tu,ZodLiteral:()=>Rc,ZodMAC:()=>hc,ZodMap:()=>Cc,ZodNaN:()=>Gc,ZodNanoID:()=>zr,ZodNever:()=>zc,ZodNonOptional:()=>qr,ZodNull:()=>yc,ZodNullable:()=>Fc,ZodNumber:()=>ft,ZodNumberFormat:()=>je,ZodObject:()=>Kt,ZodOptional:()=>Br,ZodPipe:()=>Ht,ZodPrefault:()=>qc,ZodPreprocess:()=>Hc,ZodPromise:()=>ru,ZodReadonly:()=>Xc,ZodRealError:()=>K,ZodRecord:()=>ct,ZodSet:()=>jc,ZodString:()=>lt,ZodStringFormat:()=>A,ZodSuccess:()=>Vc,ZodSymbol:()=>vc,ZodTemplateLiteral:()=>eu,ZodTransform:()=>Lc,ZodTuple:()=>Tc,ZodType:()=>S,ZodULID:()=>Pr,ZodURL:()=>Jt,ZodUUID:()=>ae,ZodUndefined:()=>bc,ZodUnion:()=>Gt,ZodUnknown:()=>kc,ZodVoid:()=>$c,ZodXID:()=>Zr,ZodXor:()=>Pc,_ZodString:()=>_r,_default:()=>Bc,_function:()=>hp,any:()=>Jl,array:()=>Yt,base64:()=>Il,base64url:()=>El,bigint:()=>Fl,boolean:()=>xc,catch:()=>Kc,check:()=>gp,cidrv4:()=>Pl,cidrv6:()=>Zl,clone:()=>B,codec:()=>pp,coerce:()=>cu,config:()=>N,core:()=>de,cuid:()=>bl,cuid2:()=>yl,custom:()=>xp,date:()=>Yl,decode:()=>cc,decodeAsync:()=>lc,describe:()=>vp,discriminatedUnion:()=>ep,e164:()=>Tl,email:()=>ul,emoji:()=>xl,encode:()=>ac,encodeAsync:()=>uc,endsWith:()=>Xe,enum:()=>Fr,exactOptional:()=>Mc,file:()=>ap,flattenError:()=>Zt,float32:()=>Nl,float64:()=>Ll,formatError:()=>It,fromJSONSchema:()=>$p,function:()=>hp,getErrorMap:()=>V0,globalRegistry:()=>F,gt:()=>ie,gte:()=>W,guid:()=>ll,hash:()=>Rl,hex:()=>jl,hostname:()=>Cl,httpUrl:()=>gl,includes:()=>Ge,instanceof:()=>yp,int:()=>br,int32:()=>Dl,int64:()=>Ul,intersection:()=>Ec,invertCodec:()=>fp,ipv4:()=>zl,ipv6:()=>Sl,iso:()=>at,json:()=>wp,jwt:()=>Ol,keyof:()=>Kl,ksuid:()=>kl,lazy:()=>ou,length:()=>Ae,literal:()=>sp,locales:()=>Nt,looseObject:()=>Xl,looseRecord:()=>op,lowercase:()=>Ye,lt:()=>ne,lte:()=>H,mac:()=>$l,map:()=>rp,maxLength:()=>Oe,maxSize:()=>ke,meta:()=>bp,mime:()=>Qe,minLength:()=>fe,minSize:()=>se,multipleOf:()=>we,nan:()=>lp,nanoid:()=>vl,nativeEnum:()=>ip,negative:()=>ir,never:()=>Dr,nonnegative:()=>ar,nonoptional:()=>Jc,nonpositive:()=>sr,normalize:()=>et,null:()=>_c,nullable:()=>qt,nullish:()=>cp,number:()=>gc,object:()=>Gl,optional:()=>Bt,overwrite:()=>re,parse:()=>rc,parseAsync:()=>nc,partialRecord:()=>tp,pipe:()=>yr,positive:()=>nr,prefault:()=>Wc,preprocess:()=>kp,prettifyError:()=>_n,promise:()=>mp,property:()=>cr,readonly:()=>Qc,record:()=>Ac,refine:()=>iu,regex:()=>Ve,regexes:()=>G,registry:()=>No,safeDecode:()=>fc,safeDecodeAsync:()=>mc,safeEncode:()=>pc,safeEncodeAsync:()=>dc,safeParse:()=>ic,safeParseAsync:()=>sc,set:()=>np,setErrorMap:()=>J0,size:()=>Te,slugify:()=>nt,startsWith:()=>He,strictObject:()=>Hl,string:()=>Ft,stringFormat:()=>Al,stringbool:()=>_p,success:()=>up,superRefine:()=>su,symbol:()=>ql,templateLiteral:()=>dp,toJSONSchema:()=>fr,toLowerCase:()=>ot,toUpperCase:()=>rt,transform:()=>Ur,treeifyError:()=>yn,trim:()=>tt,tuple:()=>Oc,uint32:()=>Ml,uint64:()=>Bl,ulid:()=>_l,undefined:()=>Wl,union:()=>Mr,unknown:()=>Ce,uppercase:()=>Ke,url:()=>hl,util:()=>z,uuid:()=>pl,uuidv4:()=>fl,uuidv6:()=>dl,uuidv7:()=>ml,void:()=>Vl,xid:()=>wl,xor:()=>Ql});var de={};le(de,{$ZodAny:()=>Gi,$ZodArray:()=>ts,$ZodAsyncError:()=>oe,$ZodBase64:()=>Mi,$ZodBase64URL:()=>Fi,$ZodBigInt:()=>Oo,$ZodBigIntFormat:()=>Ji,$ZodBoolean:()=>At,$ZodCIDRv4:()=>Ni,$ZodCIDRv6:()=>Li,$ZodCUID:()=>$i,$ZodCUID2:()=>Si,$ZodCatch:()=>bs,$ZodCheck:()=>C,$ZodCheckBigIntFormat:()=>ti,$ZodCheckEndsWith:()=>di,$ZodCheckGreaterThan:()=>So,$ZodCheckIncludes:()=>pi,$ZodCheckLengthEquals:()=>ai,$ZodCheckLessThan:()=>$o,$ZodCheckLowerCase:()=>ui,$ZodCheckMaxLength:()=>ii,$ZodCheckMaxSize:()=>oi,$ZodCheckMimeType:()=>hi,$ZodCheckMinLength:()=>si,$ZodCheckMinSize:()=>ri,$ZodCheckMultipleOf:()=>Qn,$ZodCheckNumberFormat:()=>ei,$ZodCheckOverwrite:()=>gi,$ZodCheckProperty:()=>mi,$ZodCheckRegex:()=>ci,$ZodCheckSizeEquals:()=>ni,$ZodCheckStartsWith:()=>fi,$ZodCheckStringFormat:()=>Je,$ZodCheckUpperCase:()=>li,$ZodCodec:()=>jt,$ZodCustom:()=>Ps,$ZodCustomStringFormat:()=>qi,$ZodDate:()=>es,$ZodDefault:()=>hs,$ZodDiscriminatedUnion:()=>ns,$ZodE164:()=>Ui,$ZodEmail:()=>_i,$ZodEmoji:()=>ki,$ZodEncodeError:()=>xe,$ZodEnum:()=>us,$ZodError:()=>Pt,$ZodExactOptional:()=>ds,$ZodFile:()=>ps,$ZodFunction:()=>zs,$ZodGUID:()=>bi,$ZodIPv4:()=>Ci,$ZodIPv6:()=>ji,$ZodISODate:()=>Ti,$ZodISODateTime:()=>Ei,$ZodISODuration:()=>Ai,$ZodISOTime:()=>Oi,$ZodIntersection:()=>is,$ZodJWT:()=>Bi,$ZodKSUID:()=>Ii,$ZodLazy:()=>Ss,$ZodLiteral:()=>ls,$ZodMAC:()=>Ri,$ZodMap:()=>as,$ZodNaN:()=>ys,$ZodNanoID:()=>zi,$ZodNever:()=>Xi,$ZodNonOptional:()=>xs,$ZodNull:()=>Ki,$ZodNullable:()=>ms,$ZodNumber:()=>To,$ZodNumberFormat:()=>Wi,$ZodObject:()=>rl,$ZodObjectJIT:()=>os,$ZodOptional:()=>Co,$ZodPipe:()=>jo,$ZodPrefault:()=>gs,$ZodPreprocess:()=>_s,$ZodPromise:()=>$s,$ZodReadonly:()=>ws,$ZodRealError:()=>Y,$ZodRecord:()=>ss,$ZodRegistry:()=>Ro,$ZodSet:()=>cs,$ZodString:()=>Ee,$ZodStringFormat:()=>O,$ZodSuccess:()=>vs,$ZodSymbol:()=>Vi,$ZodTemplateLiteral:()=>ks,$ZodTransform:()=>fs,$ZodTuple:()=>Ao,$ZodType:()=>$,$ZodULID:()=>Pi,$ZodURL:()=>wi,$ZodUUID:()=>yi,$ZodUndefined:()=>Yi,$ZodUnion:()=>Ct,$ZodUnknown:()=>Hi,$ZodVoid:()=>Qi,$ZodXID:()=>Zi,$ZodXor:()=>rs,$brand:()=>an,$constructor:()=>p,$input:()=>Is,$output:()=>Zs,Doc:()=>Ot,JSONSchema:()=>sl,JSONSchemaGenerator:()=>dr,NEVER:()=>sn,TimePrecision:()=>As,_any:()=>ea,_array:()=>aa,_base64:()=>er,_base64url:()=>tr,_bigint:()=>Vs,_boolean:()=>Ws,_catch:()=>j0,_check:()=>il,_cidrv4:()=>Xo,_cidrv6:()=>Qo,_coercedBigint:()=>Ys,_coercedBoolean:()=>Js,_coercedDate:()=>ia,_coercedNumber:()=>Ds,_coercedString:()=>Ts,_cuid:()=>Wo,_cuid2:()=>Jo,_custom:()=>ua,_date:()=>na,_decode:()=>go,_decodeAsync:()=>vo,_default:()=>O0,_discriminatedUnion:()=>y0,_e164:()=>or,_email:()=>Lo,_emoji:()=>Bo,_encode:()=>ho,_encodeAsync:()=>xo,_endsWith:()=>Xe,_enum:()=>S0,_file:()=>ca,_float32:()=>Fs,_float64:()=>Us,_gt:()=>ie,_gte:()=>W,_guid:()=>Lt,_includes:()=>Ge,_int:()=>Ms,_int32:()=>Bs,_int64:()=>Ks,_intersection:()=>_0,_ipv4:()=>Go,_ipv6:()=>Ho,_isoDate:()=>js,_isoDateTime:()=>Cs,_isoDuration:()=>Ns,_isoTime:()=>Rs,_jwt:()=>rr,_ksuid:()=>Ko,_lazy:()=>D0,_length:()=>Ae,_literal:()=>Z0,_lowercase:()=>Ye,_lt:()=>ne,_lte:()=>H,_mac:()=>Os,_map:()=>z0,_max:()=>H,_maxLength:()=>Oe,_maxSize:()=>ke,_mime:()=>Qe,_min:()=>W,_minLength:()=>fe,_minSize:()=>se,_multipleOf:()=>we,_nan:()=>sa,_nanoid:()=>qo,_nativeEnum:()=>P0,_negative:()=>ir,_never:()=>oa,_nonnegative:()=>ar,_nonoptional:()=>A0,_nonpositive:()=>sr,_normalize:()=>et,_null:()=>Qs,_nullable:()=>T0,_number:()=>Ls,_optional:()=>E0,_overwrite:()=>re,_parse:()=>Ue,_parseAsync:()=>Be,_pipe:()=>R0,_positive:()=>nr,_promise:()=>M0,_property:()=>cr,_readonly:()=>N0,_record:()=>k0,_refine:()=>la,_regex:()=>Ve,_safeDecode:()=>yo,_safeDecodeAsync:()=>wo,_safeEncode:()=>bo,_safeEncodeAsync:()=>_o,_safeParse:()=>qe,_safeParseAsync:()=>We,_set:()=>$0,_size:()=>Te,_slugify:()=>nt,_startsWith:()=>He,_string:()=>Es,_stringFormat:()=>it,_stringbool:()=>ma,_success:()=>C0,_superRefine:()=>pa,_symbol:()=>Hs,_templateLiteral:()=>L0,_toLowerCase:()=>ot,_toUpperCase:()=>rt,_transform:()=>I0,_trim:()=>tt,_tuple:()=>w0,_uint32:()=>qs,_uint64:()=>Gs,_ulid:()=>Vo,_undefined:()=>Xs,_union:()=>v0,_unknown:()=>ta,_uppercase:()=>Ke,_url:()=>Dt,_uuid:()=>Do,_uuidv4:()=>Mo,_uuidv6:()=>Fo,_uuidv7:()=>Uo,_void:()=>ra,_xid:()=>Yo,_xor:()=>b0,clone:()=>B,config:()=>N,createStandardJSONSchemaMethod:()=>st,createToJSONSchemaMethod:()=>ha,decode:()=>jf,decodeAsync:()=>Nf,describe:()=>fa,encode:()=>Cf,encodeAsync:()=>Rf,extractDefs:()=>$e,finalize:()=>Se,flattenError:()=>Zt,formatError:()=>It,globalConfig:()=>Pe,globalRegistry:()=>F,initializeContext:()=>ze,isValidBase64:()=>Di,isValidBase64URL:()=>Qu,isValidJWT:()=>el,locales:()=>Nt,meta:()=>da,parse:()=>fo,parseAsync:()=>mo,prettifyError:()=>_n,process:()=>E,regexes:()=>G,registry:()=>No,safeDecode:()=>Df,safeDecodeAsync:()=>Ff,safeEncode:()=>Lf,safeEncodeAsync:()=>Mf,safeParse:()=>wn,safeParseAsync:()=>kn,toDotPath:()=>Ou,toJSONSchema:()=>fr,treeifyError:()=>yn,util:()=>z,version:()=>xi});var Pu,sn=Object.freeze({status:"aborted"});function p(e,t,o){function r(c,u){if(c._zod||Object.defineProperty(c,"_zod",{value:{def:u,constr:a,traits:new Set},enumerable:!1}),c._zod.traits.has(e))return;c._zod.traits.add(e),t(c,u);let l=a.prototype,d=Object.keys(l);for(let g=0;g<d.length;g++){let v=d[g];v in c||(c[v]=l[v].bind(c))}}s(r,"init");let n=o?.Parent??Object;class i extends n{static{s(this,"Definition")}}Object.defineProperty(i,"name",{value:e});function a(c){var u;let l=o?.Parent?new i:this;r(l,c),(u=l._zod).deferred??(u.deferred=[]);for(let d of l._zod.deferred)d();return l}return s(a,"_"),Object.defineProperty(a,"init",{value:r}),Object.defineProperty(a,Symbol.hasInstance,{value:s(c=>o?.Parent&&c instanceof o.Parent?!0:c?._zod?.traits?.has(e),"value")}),Object.defineProperty(a,"name",{value:e}),a}s(p,"$constructor");var an=Symbol("zod_brand"),oe=class extends Error{static{s(this,"$ZodAsyncError")}constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}},xe=class extends Error{static{s(this,"$ZodEncodeError")}constructor(t){super(`Encountered unidirectional transform during encode: ${t}`),this.name="ZodEncodeError"}};(Pu=globalThis).__zod_globalConfig??(Pu.__zod_globalConfig={});var Pe=globalThis.__zod_globalConfig;function N(e){return e&&Object.assign(Pe,e),Pe}s(N,"config");var z={};le(z,{BIGINT_FORMAT_RANGES:()=>xn,Class:()=>un,NUMBER_FORMAT_RANGES:()=>gn,aborted:()=>_e,allowsEval:()=>fn,assert:()=>ff,assertEqual:()=>cf,assertIs:()=>lf,assertNever:()=>pf,assertNotEqual:()=>uf,assignProp:()=>be,base64ToUint8Array:()=>Iu,base64urlToUint8Array:()=>If,cached:()=>Me,captureStackTrace:()=>lo,cleanEnum:()=>Zf,cleanRegex:()=>kt,clone:()=>B,cloneDef:()=>mf,createTransparentProxy:()=>yf,defineLazy:()=>I,esc:()=>uo,escapeRegex:()=>ee,explicitlyAborted:()=>vn,extend:()=>kf,finalizeIssue:()=>q,floatSafeRemainder:()=>ln,getElementAtPath:()=>hf,getEnumValues:()=>wt,getLengthableOrigin:()=>St,getParsedType:()=>bf,getSizableOrigin:()=>$t,hexToUint8Array:()=>Tf,isObject:()=>Ze,isPlainObject:()=>ye,issue:()=>Fe,joinValues:()=>co,jsonStringifyReplacer:()=>De,merge:()=>$f,mergeDefs:()=>pe,normalizeParams:()=>x,nullish:()=>ve,numKeys:()=>vf,objectClone:()=>df,omit:()=>wf,optionalKeys:()=>hn,parsedType:()=>bn,partial:()=>Sf,pick:()=>_f,prefixIssues:()=>V,primitiveTypes:()=>mn,promiseAllObject:()=>gf,propertyKeyTypes:()=>zt,randomString:()=>xf,required:()=>Pf,safeExtend:()=>zf,shallowClone:()=>dn,slugify:()=>pn,stringifyPrimitive:()=>po,uint8ArrayToBase64:()=>Eu,uint8ArrayToBase64url:()=>Ef,uint8ArrayToHex:()=>Of,unwrapMessage:()=>_t});function cf(e){return e}s(cf,"assertEqual");function uf(e){return e}s(uf,"assertNotEqual");function lf(e){}s(lf,"assertIs");function pf(e){throw new Error("Unexpected value in exhaustive check")}s(pf,"assertNever");function ff(e){}s(ff,"assert");function wt(e){let t=Object.values(e).filter(r=>typeof r=="number");return Object.entries(e).filter(([r,n])=>t.indexOf(+r)===-1).map(([r,n])=>n)}s(wt,"getEnumValues");function co(e,t="|"){return e.map(o=>po(o)).join(t)}s(co,"joinValues");function De(e,t){return typeof t=="bigint"?t.toString():t}s(De,"jsonStringifyReplacer");function Me(e){return{get value(){{let o=e();return Object.defineProperty(this,"value",{value:o}),o}throw new Error("cached value already set")}}}s(Me,"cached");function ve(e){return e==null}s(ve,"nullish");function kt(e){let t=e.startsWith("^")?1:0,o=e.endsWith("$")?e.length-1:e.length;return e.slice(t,o)}s(kt,"cleanRegex");function ln(e,t){let o=e/t,r=Math.round(o),n=Number.EPSILON*Math.max(Math.abs(o),1);return Math.abs(o-r)<n?0:o-r}s(ln,"floatSafeRemainder");var Zu=Symbol("evaluating");function I(e,t,o){let r;Object.defineProperty(e,t,{get(){if(r!==Zu)return r===void 0&&(r=Zu,r=o()),r},set(n){Object.defineProperty(e,t,{value:n})},configurable:!0})}s(I,"defineLazy");function df(e){return Object.create(Object.getPrototypeOf(e),Object.getOwnPropertyDescriptors(e))}s(df,"objectClone");function be(e,t,o){Object.defineProperty(e,t,{value:o,writable:!0,enumerable:!0,configurable:!0})}s(be,"assignProp");function pe(...e){let t={};for(let o of e){let r=Object.getOwnPropertyDescriptors(o);Object.assign(t,r)}return Object.defineProperties({},t)}s(pe,"mergeDefs");function mf(e){return pe(e._zod.def)}s(mf,"cloneDef");function hf(e,t){return t?t.reduce((o,r)=>o?.[r],e):e}s(hf,"getElementAtPath");function gf(e){let t=Object.keys(e),o=t.map(r=>e[r]);return Promise.all(o).then(r=>{let n={};for(let i=0;i<t.length;i++)n[t[i]]=r[i];return n})}s(gf,"promiseAllObject");function xf(e=10){let t="abcdefghijklmnopqrstuvwxyz",o="";for(let r=0;r<e;r++)o+=t[Math.floor(Math.random()*t.length)];return o}s(xf,"randomString");function uo(e){return JSON.stringify(e)}s(uo,"esc");function pn(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}s(pn,"slugify");var lo="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function Ze(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}s(Ze,"isObject");var fn=Me(()=>{if(Pe.jitless||typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{let e=Function;return new e(""),!0}catch{return!1}});function ye(e){if(Ze(e)===!1)return!1;let t=e.constructor;if(t===void 0||typeof t!="function")return!0;let o=t.prototype;return!(Ze(o)===!1||Object.prototype.hasOwnProperty.call(o,"isPrototypeOf")===!1)}s(ye,"isPlainObject");function dn(e){return ye(e)?{...e}:Array.isArray(e)?[...e]:e instanceof Map?new Map(e):e instanceof Set?new Set(e):e}s(dn,"shallowClone");function vf(e){let t=0;for(let o in e)Object.prototype.hasOwnProperty.call(e,o)&&t++;return t}s(vf,"numKeys");var bf=s(e=>{let t=typeof e;switch(t){case"undefined":return"undefined";case"string":return"string";case"number":return Number.isNaN(e)?"nan":"number";case"boolean":return"boolean";case"function":return"function";case"bigint":return"bigint";case"symbol":return"symbol";case"object":return Array.isArray(e)?"array":e===null?"null":e.then&&typeof e.then=="function"&&e.catch&&typeof e.catch=="function"?"promise":typeof Map<"u"&&e instanceof Map?"map":typeof Set<"u"&&e instanceof Set?"set":typeof Date<"u"&&e instanceof Date?"date":typeof File<"u"&&e instanceof File?"file":"object";default:throw new Error(`Unknown data type: ${t}`)}},"getParsedType"),zt=new Set(["string","number","symbol"]),mn=new Set(["string","number","bigint","boolean","symbol","undefined"]);function ee(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}s(ee,"escapeRegex");function B(e,t,o){let r=new e._zod.constr(t??e._zod.def);return(!t||o?.parent)&&(r._zod.parent=e),r}s(B,"clone");function x(e){let t=e;if(!t)return{};if(typeof t=="string")return{error:s(()=>t,"error")};if(t?.message!==void 0){if(t?.error!==void 0)throw new Error("Cannot specify both `message` and `error` params");t.error=t.message}return delete t.message,typeof t.error=="string"?{...t,error:s(()=>t.error,"error")}:t}s(x,"normalizeParams");function yf(e){let t;return new Proxy({},{get(o,r,n){return t??(t=e()),Reflect.get(t,r,n)},set(o,r,n,i){return t??(t=e()),Reflect.set(t,r,n,i)},has(o,r){return t??(t=e()),Reflect.has(t,r)},deleteProperty(o,r){return t??(t=e()),Reflect.deleteProperty(t,r)},ownKeys(o){return t??(t=e()),Reflect.ownKeys(t)},getOwnPropertyDescriptor(o,r){return t??(t=e()),Reflect.getOwnPropertyDescriptor(t,r)},defineProperty(o,r,n){return t??(t=e()),Reflect.defineProperty(t,r,n)}})}s(yf,"createTransparentProxy");function po(e){return typeof e=="bigint"?e.toString()+"n":typeof e=="string"?`"${e}"`:`${e}`}s(po,"stringifyPrimitive");function hn(e){return Object.keys(e).filter(t=>e[t]._zod.optin==="optional"&&e[t]._zod.optout==="optional")}s(hn,"optionalKeys");var gn={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]},xn={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function _f(e,t){let o=e._zod.def,r=o.checks;if(r&&r.length>0)throw new Error(".pick() cannot be used on object schemas containing refinements");let i=pe(e._zod.def,{get shape(){let a={};for(let c in t){if(!(c in o.shape))throw new Error(`Unrecognized key: "${c}"`);t[c]&&(a[c]=o.shape[c])}return be(this,"shape",a),a},checks:[]});return B(e,i)}s(_f,"pick");function wf(e,t){let o=e._zod.def,r=o.checks;if(r&&r.length>0)throw new Error(".omit() cannot be used on object schemas containing refinements");let i=pe(e._zod.def,{get shape(){let a={...e._zod.def.shape};for(let c in t){if(!(c in o.shape))throw new Error(`Unrecognized key: "${c}"`);t[c]&&delete a[c]}return be(this,"shape",a),a},checks:[]});return B(e,i)}s(wf,"omit");function kf(e,t){if(!ye(t))throw new Error("Invalid input to extend: expected a plain object");let o=e._zod.def.checks;if(o&&o.length>0){let i=e._zod.def.shape;for(let a in t)if(Object.getOwnPropertyDescriptor(i,a)!==void 0)throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let n=pe(e._zod.def,{get shape(){let i={...e._zod.def.shape,...t};return be(this,"shape",i),i}});return B(e,n)}s(kf,"extend");function zf(e,t){if(!ye(t))throw new Error("Invalid input to safeExtend: expected a plain object");let o=pe(e._zod.def,{get shape(){let r={...e._zod.def.shape,...t};return be(this,"shape",r),r}});return B(e,o)}s(zf,"safeExtend");function $f(e,t){if(e._zod.def.checks?.length)throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let o=pe(e._zod.def,{get shape(){let r={...e._zod.def.shape,...t._zod.def.shape};return be(this,"shape",r),r},get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return B(e,o)}s($f,"merge");function Sf(e,t,o){let n=t._zod.def.checks;if(n&&n.length>0)throw new Error(".partial() cannot be used on object schemas containing refinements");let a=pe(t._zod.def,{get shape(){let c=t._zod.def.shape,u={...c};if(o)for(let l in o){if(!(l in c))throw new Error(`Unrecognized key: "${l}"`);o[l]&&(u[l]=e?new e({type:"optional",innerType:c[l]}):c[l])}else for(let l in c)u[l]=e?new e({type:"optional",innerType:c[l]}):c[l];return be(this,"shape",u),u},checks:[]});return B(t,a)}s(Sf,"partial");function Pf(e,t,o){let r=pe(t._zod.def,{get shape(){let n=t._zod.def.shape,i={...n};if(o)for(let a in o){if(!(a in i))throw new Error(`Unrecognized key: "${a}"`);o[a]&&(i[a]=new e({type:"nonoptional",innerType:n[a]}))}else for(let a in n)i[a]=new e({type:"nonoptional",innerType:n[a]});return be(this,"shape",i),i}});return B(t,r)}s(Pf,"required");function _e(e,t=0){if(e.aborted===!0)return!0;for(let o=t;o<e.issues.length;o++)if(e.issues[o]?.continue!==!0)return!0;return!1}s(_e,"aborted");function vn(e,t=0){if(e.aborted===!0)return!0;for(let o=t;o<e.issues.length;o++)if(e.issues[o]?.continue===!1)return!0;return!1}s(vn,"explicitlyAborted");function V(e,t){return t.map(o=>{var r;return(r=o).path??(r.path=[]),o.path.unshift(e),o})}s(V,"prefixIssues");function _t(e){return typeof e=="string"?e:e?.message}s(_t,"unwrapMessage");function q(e,t,o){let r=e.message?e.message:_t(e.inst?._zod.def?.error?.(e))??_t(t?.error?.(e))??_t(o.customError?.(e))??_t(o.localeError?.(e))??"Invalid input",{inst:n,continue:i,input:a,...c}=e;return c.path??(c.path=[]),c.message=r,t?.reportInput&&(c.input=a),c}s(q,"finalizeIssue");function $t(e){return e instanceof Set?"set":e instanceof Map?"map":e instanceof File?"file":"unknown"}s($t,"getSizableOrigin");function St(e){return Array.isArray(e)?"array":typeof e=="string"?"string":"unknown"}s(St,"getLengthableOrigin");function bn(e){let t=typeof e;switch(t){case"number":return Number.isNaN(e)?"nan":"number";case"object":{if(e===null)return"null";if(Array.isArray(e))return"array";let o=e;if(o&&Object.getPrototypeOf(o)!==Object.prototype&&"constructor"in o&&o.constructor)return o.constructor.name}}return t}s(bn,"parsedType");function Fe(...e){let[t,o,r]=e;return typeof t=="string"?{message:t,code:"custom",input:o,inst:r}:{...t}}s(Fe,"issue");function Zf(e){return Object.entries(e).filter(([t,o])=>Number.isNaN(Number.parseInt(t,10))).map(t=>t[1])}s(Zf,"cleanEnum");function Iu(e){let t=atob(e),o=new Uint8Array(t.length);for(let r=0;r<t.length;r++)o[r]=t.charCodeAt(r);return o}s(Iu,"base64ToUint8Array");function Eu(e){let t="";for(let o=0;o<e.length;o++)t+=String.fromCharCode(e[o]);return btoa(t)}s(Eu,"uint8ArrayToBase64");function If(e){let t=e.replace(/-/g,"+").replace(/_/g,"/"),o="=".repeat((4-t.length%4)%4);return Iu(t+o)}s(If,"base64urlToUint8Array");function Ef(e){return Eu(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}s(Ef,"uint8ArrayToBase64url");function Tf(e){let t=e.replace(/^0x/,"");if(t.length%2!==0)throw new Error("Invalid hex string length");let o=new Uint8Array(t.length/2);for(let r=0;r<t.length;r+=2)o[r/2]=Number.parseInt(t.slice(r,r+2),16);return o}s(Tf,"hexToUint8Array");function Of(e){return Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}s(Of,"uint8ArrayToHex");var un=class{static{s(this,"Class")}constructor(...t){}};var Tu=s((e,t)=>{e.name="$ZodError",Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,De,2),Object.defineProperty(e,"toString",{value:s(()=>e.message,"value"),enumerable:!1})},"initializer"),Pt=p("$ZodError",Tu),Y=p("$ZodError",Tu,{Parent:Error});function Zt(e,t=o=>o.message){let o={},r=[];for(let n of e.issues)n.path.length>0?(o[n.path[0]]=o[n.path[0]]||[],o[n.path[0]].push(t(n))):r.push(t(n));return{formErrors:r,fieldErrors:o}}s(Zt,"flattenError");function It(e,t=o=>o.message){let o={_errors:[]},r=s((n,i=[])=>{for(let a of n.issues)if(a.code==="invalid_union"&&a.errors.length)a.errors.map(c=>r({issues:c},[...i,...a.path]));else if(a.code==="invalid_key")r({issues:a.issues},[...i,...a.path]);else if(a.code==="invalid_element")r({issues:a.issues},[...i,...a.path]);else{let c=[...i,...a.path];if(c.length===0)o._errors.push(t(a));else{let u=o,l=0;for(;l<c.length;){let d=c[l];l===c.length-1?(u[d]=u[d]||{_errors:[]},u[d]._errors.push(t(a))):u[d]=u[d]||{_errors:[]},u=u[d],l++}}}},"processError");return r(e),o}s(It,"formatError");function yn(e,t=o=>o.message){let o={errors:[]},r=s((n,i=[])=>{var a,c;for(let u of n.issues)if(u.code==="invalid_union"&&u.errors.length)u.errors.map(l=>r({issues:l},[...i,...u.path]));else if(u.code==="invalid_key")r({issues:u.issues},[...i,...u.path]);else if(u.code==="invalid_element")r({issues:u.issues},[...i,...u.path]);else{let l=[...i,...u.path];if(l.length===0){o.errors.push(t(u));continue}let d=o,g=0;for(;g<l.length;){let v=l[g],y=g===l.length-1;typeof v=="string"?(d.properties??(d.properties={}),(a=d.properties)[v]??(a[v]={errors:[]}),d=d.properties[v]):(d.items??(d.items=[]),(c=d.items)[v]??(c[v]={errors:[]}),d=d.items[v]),y&&d.errors.push(t(u)),g++}}},"processError");return r(e),o}s(yn,"treeifyError");function Ou(e){let t=[],o=e.map(r=>typeof r=="object"?r.key:r);for(let r of o)typeof r=="number"?t.push(`[${r}]`):typeof r=="symbol"?t.push(`[${JSON.stringify(String(r))}]`):/[^\w$]/.test(r)?t.push(`[${JSON.stringify(r)}]`):(t.length&&t.push("."),t.push(r));return t.join("")}s(Ou,"toDotPath");function _n(e){let t=[],o=[...e.issues].sort((r,n)=>(r.path??[]).length-(n.path??[]).length);for(let r of o)t.push(`\u2716 ${r.message}`),r.path?.length&&t.push(`  \u2192 at ${Ou(r.path)}`);return t.join(`
`)}s(_n,"prettifyError");var Ue=s(e=>(t,o,r,n)=>{let i=r?{...r,async:!1}:{async:!1},a=t._zod.run({value:o,issues:[]},i);if(a instanceof Promise)throw new oe;if(a.issues.length){let c=new(n?.Err??e)(a.issues.map(u=>q(u,i,N())));throw lo(c,n?.callee),c}return a.value},"_parse"),fo=Ue(Y),Be=s(e=>async(t,o,r,n)=>{let i=r?{...r,async:!0}:{async:!0},a=t._zod.run({value:o,issues:[]},i);if(a instanceof Promise&&(a=await a),a.issues.length){let c=new(n?.Err??e)(a.issues.map(u=>q(u,i,N())));throw lo(c,n?.callee),c}return a.value},"_parseAsync"),mo=Be(Y),qe=s(e=>(t,o,r)=>{let n=r?{...r,async:!1}:{async:!1},i=t._zod.run({value:o,issues:[]},n);if(i instanceof Promise)throw new oe;return i.issues.length?{success:!1,error:new(e??Pt)(i.issues.map(a=>q(a,n,N())))}:{success:!0,data:i.value}},"_safeParse"),wn=qe(Y),We=s(e=>async(t,o,r)=>{let n=r?{...r,async:!0}:{async:!0},i=t._zod.run({value:o,issues:[]},n);return i instanceof Promise&&(i=await i),i.issues.length?{success:!1,error:new e(i.issues.map(a=>q(a,n,N())))}:{success:!0,data:i.value}},"_safeParseAsync"),kn=We(Y),ho=s(e=>(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return Ue(e)(t,o,n)},"_encode"),Cf=ho(Y),go=s(e=>(t,o,r)=>Ue(e)(t,o,r),"_decode"),jf=go(Y),xo=s(e=>async(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return Be(e)(t,o,n)},"_encodeAsync"),Rf=xo(Y),vo=s(e=>async(t,o,r)=>Be(e)(t,o,r),"_decodeAsync"),Nf=vo(Y),bo=s(e=>(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return qe(e)(t,o,n)},"_safeEncode"),Lf=bo(Y),yo=s(e=>(t,o,r)=>qe(e)(t,o,r),"_safeDecode"),Df=yo(Y),_o=s(e=>async(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return We(e)(t,o,n)},"_safeEncodeAsync"),Mf=_o(Y),wo=s(e=>async(t,o,r)=>We(e)(t,o,r),"_safeDecodeAsync"),Ff=wo(Y);var G={};le(G,{base64:()=>Dn,base64url:()=>ko,bigint:()=>Jn,boolean:()=>Yn,browserEmail:()=>Kf,cidrv4:()=>Nn,cidrv6:()=>Ln,cuid:()=>zn,cuid2:()=>$n,date:()=>Un,datetime:()=>qn,domain:()=>Xf,duration:()=>En,e164:()=>Fn,email:()=>On,emoji:()=>An,extendedDuration:()=>Uf,guid:()=>Tn,hex:()=>Qf,hostname:()=>Hf,html5Email:()=>Jf,httpProtocol:()=>Mn,idnEmail:()=>Yf,integer:()=>Vn,ipv4:()=>Cn,ipv6:()=>jn,ksuid:()=>Zn,lowercase:()=>Hn,mac:()=>Rn,md5_base64:()=>t0,md5_base64url:()=>o0,md5_hex:()=>e0,nanoid:()=>In,null:()=>Kn,number:()=>zo,rfc5322Email:()=>Vf,sha1_base64:()=>n0,sha1_base64url:()=>i0,sha1_hex:()=>r0,sha256_base64:()=>a0,sha256_base64url:()=>c0,sha256_hex:()=>s0,sha384_base64:()=>l0,sha384_base64url:()=>p0,sha384_hex:()=>u0,sha512_base64:()=>d0,sha512_base64url:()=>m0,sha512_hex:()=>f0,string:()=>Wn,time:()=>Bn,ulid:()=>Sn,undefined:()=>Gn,unicodeEmail:()=>Au,uppercase:()=>Xn,uuid:()=>Ie,uuid4:()=>Bf,uuid6:()=>qf,uuid7:()=>Wf,xid:()=>Pn});var zn=/^[cC][0-9a-z]{6,}$/,$n=/^[0-9a-z]+$/,Sn=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,Pn=/^[0-9a-vA-V]{20}$/,Zn=/^[A-Za-z0-9]{27}$/,In=/^[a-zA-Z0-9_-]{21}$/,En=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,Uf=/^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,Tn=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Ie=s(e=>e?new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,"uuid"),Bf=Ie(4),qf=Ie(6),Wf=Ie(7),On=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,Jf=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,Vf=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,Au=/^[^\s@"]{1,64}@[^\s@]{1,255}$/u,Yf=Au,Kf=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,Gf="^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";function An(){return new RegExp(Gf,"u")}s(An,"emoji");var Cn=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,jn=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,Rn=s(e=>{let t=ee(e??":");return new RegExp(`^(?:[0-9A-F]{2}${t}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${t}){5}[0-9a-f]{2}$`)},"mac"),Nn=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,Ln=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,Dn=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,ko=/^[A-Za-z0-9_-]*$/,Hf=/^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,Xf=/^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,Mn=/^https?$/,Fn=/^\+[1-9]\d{6,14}$/,Cu="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",Un=new RegExp(`^${Cu}$`);function ju(e){let t="(?:[01]\\d|2[0-3]):[0-5]\\d";return typeof e.precision=="number"?e.precision===-1?`${t}`:e.precision===0?`${t}:[0-5]\\d`:`${t}:[0-5]\\d\\.\\d{${e.precision}}`:`${t}(?::[0-5]\\d(?:\\.\\d+)?)?`}s(ju,"timeSource");function Bn(e){return new RegExp(`^${ju(e)}$`)}s(Bn,"time");function qn(e){let t=ju({precision:e.precision}),o=["Z"];e.local&&o.push(""),e.offset&&o.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let r=`${t}(?:${o.join("|")})`;return new RegExp(`^${Cu}T(?:${r})$`)}s(qn,"datetime");var Wn=s(e=>{let t=e?`[\\s\\S]{${e?.minimum??0},${e?.maximum??""}}`:"[\\s\\S]*";return new RegExp(`^${t}$`)},"string"),Jn=/^-?\d+n?$/,Vn=/^-?\d+$/,zo=/^-?\d+(?:\.\d+)?$/,Yn=/^(?:true|false)$/i,Kn=/^null$/i;var Gn=/^undefined$/i;var Hn=/^[^A-Z]*$/,Xn=/^[^a-z]*$/,Qf=/^[0-9a-fA-F]*$/;function Et(e,t){return new RegExp(`^[A-Za-z0-9+/]{${e}}${t}$`)}s(Et,"fixedBase64");function Tt(e){return new RegExp(`^[A-Za-z0-9_-]{${e}}$`)}s(Tt,"fixedBase64url");var e0=/^[0-9a-fA-F]{32}$/,t0=Et(22,"=="),o0=Tt(22),r0=/^[0-9a-fA-F]{40}$/,n0=Et(27,"="),i0=Tt(27),s0=/^[0-9a-fA-F]{64}$/,a0=Et(43,"="),c0=Tt(43),u0=/^[0-9a-fA-F]{96}$/,l0=Et(64,""),p0=Tt(64),f0=/^[0-9a-fA-F]{128}$/,d0=Et(86,"=="),m0=Tt(86);var C=p("$ZodCheck",(e,t)=>{var o;e._zod??(e._zod={}),e._zod.def=t,(o=e._zod).onattach??(o.onattach=[])}),Nu={number:"number",bigint:"bigint",object:"date"},$o=p("$ZodCheckLessThan",(e,t)=>{C.init(e,t);let o=Nu[typeof t.value];e._zod.onattach.push(r=>{let n=r._zod.bag,i=(t.inclusive?n.maximum:n.exclusiveMaximum)??Number.POSITIVE_INFINITY;t.value<i&&(t.inclusive?n.maximum=t.value:n.exclusiveMaximum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value<=t.value:r.value<t.value)||r.issues.push({origin:o,code:"too_big",maximum:typeof t.value=="object"?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),So=p("$ZodCheckGreaterThan",(e,t)=>{C.init(e,t);let o=Nu[typeof t.value];e._zod.onattach.push(r=>{let n=r._zod.bag,i=(t.inclusive?n.minimum:n.exclusiveMinimum)??Number.NEGATIVE_INFINITY;t.value>i&&(t.inclusive?n.minimum=t.value:n.exclusiveMinimum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:o,code:"too_small",minimum:typeof t.value=="object"?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),Qn=p("$ZodCheckMultipleOf",(e,t)=>{C.init(e,t),e._zod.onattach.push(o=>{var r;(r=o._zod.bag).multipleOf??(r.multipleOf=t.value)}),e._zod.check=o=>{if(typeof o.value!=typeof t.value)throw new Error("Cannot mix number and bigint in multiple_of check.");(typeof o.value=="bigint"?o.value%t.value===BigInt(0):ln(o.value,t.value)===0)||o.issues.push({origin:typeof o.value,code:"not_multiple_of",divisor:t.value,input:o.value,inst:e,continue:!t.abort})}}),ei=p("$ZodCheckNumberFormat",(e,t)=>{C.init(e,t),t.format=t.format||"float64";let o=t.format?.includes("int"),r=o?"int":"number",[n,i]=gn[t.format];e._zod.onattach.push(a=>{let c=a._zod.bag;c.format=t.format,c.minimum=n,c.maximum=i,o&&(c.pattern=Vn)}),e._zod.check=a=>{let c=a.value;if(o){if(!Number.isInteger(c)){a.issues.push({expected:r,format:t.format,code:"invalid_type",continue:!1,input:c,inst:e});return}if(!Number.isSafeInteger(c)){c>0?a.issues.push({input:c,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort}):a.issues.push({input:c,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort});return}}c<n&&a.issues.push({origin:"number",input:c,code:"too_small",minimum:n,inclusive:!0,inst:e,continue:!t.abort}),c>i&&a.issues.push({origin:"number",input:c,code:"too_big",maximum:i,inclusive:!0,inst:e,continue:!t.abort})}}),ti=p("$ZodCheckBigIntFormat",(e,t)=>{C.init(e,t);let[o,r]=xn[t.format];e._zod.onattach.push(n=>{let i=n._zod.bag;i.format=t.format,i.minimum=o,i.maximum=r}),e._zod.check=n=>{let i=n.value;i<o&&n.issues.push({origin:"bigint",input:i,code:"too_small",minimum:o,inclusive:!0,inst:e,continue:!t.abort}),i>r&&n.issues.push({origin:"bigint",input:i,code:"too_big",maximum:r,inclusive:!0,inst:e,continue:!t.abort})}}),oi=p("$ZodCheckMaxSize",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.maximum??Number.POSITIVE_INFINITY;t.maximum<n&&(r._zod.bag.maximum=t.maximum)}),e._zod.check=r=>{let n=r.value;n.size<=t.maximum||r.issues.push({origin:$t(n),code:"too_big",maximum:t.maximum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),ri=p("$ZodCheckMinSize",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.minimum??Number.NEGATIVE_INFINITY;t.minimum>n&&(r._zod.bag.minimum=t.minimum)}),e._zod.check=r=>{let n=r.value;n.size>=t.minimum||r.issues.push({origin:$t(n),code:"too_small",minimum:t.minimum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),ni=p("$ZodCheckSizeEquals",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag;n.minimum=t.size,n.maximum=t.size,n.size=t.size}),e._zod.check=r=>{let n=r.value,i=n.size;if(i===t.size)return;let a=i>t.size;r.issues.push({origin:$t(n),...a?{code:"too_big",maximum:t.size}:{code:"too_small",minimum:t.size},inclusive:!0,exact:!0,input:r.value,inst:e,continue:!t.abort})}}),ii=p("$ZodCheckMaxLength",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.maximum??Number.POSITIVE_INFINITY;t.maximum<n&&(r._zod.bag.maximum=t.maximum)}),e._zod.check=r=>{let n=r.value;if(n.length<=t.maximum)return;let a=St(n);r.issues.push({origin:a,code:"too_big",maximum:t.maximum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),si=p("$ZodCheckMinLength",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.minimum??Number.NEGATIVE_INFINITY;t.minimum>n&&(r._zod.bag.minimum=t.minimum)}),e._zod.check=r=>{let n=r.value;if(n.length>=t.minimum)return;let a=St(n);r.issues.push({origin:a,code:"too_small",minimum:t.minimum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),ai=p("$ZodCheckLengthEquals",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!ve(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag;n.minimum=t.length,n.maximum=t.length,n.length=t.length}),e._zod.check=r=>{let n=r.value,i=n.length;if(i===t.length)return;let a=St(n),c=i>t.length;r.issues.push({origin:a,...c?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:r.value,inst:e,continue:!t.abort})}}),Je=p("$ZodCheckStringFormat",(e,t)=>{var o,r;C.init(e,t),e._zod.onattach.push(n=>{let i=n._zod.bag;i.format=t.format,t.pattern&&(i.patterns??(i.patterns=new Set),i.patterns.add(t.pattern))}),t.pattern?(o=e._zod).check??(o.check=n=>{t.pattern.lastIndex=0,!t.pattern.test(n.value)&&n.issues.push({origin:"string",code:"invalid_format",format:t.format,input:n.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})}):(r=e._zod).check??(r.check=()=>{})}),ci=p("$ZodCheckRegex",(e,t)=>{Je.init(e,t),e._zod.check=o=>{t.pattern.lastIndex=0,!t.pattern.test(o.value)&&o.issues.push({origin:"string",code:"invalid_format",format:"regex",input:o.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),ui=p("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=Hn),Je.init(e,t)}),li=p("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=Xn),Je.init(e,t)}),pi=p("$ZodCheckIncludes",(e,t)=>{C.init(e,t);let o=ee(t.includes),r=new RegExp(typeof t.position=="number"?`^.{${t.position}}${o}`:o);t.pattern=r,e._zod.onattach.push(n=>{let i=n._zod.bag;i.patterns??(i.patterns=new Set),i.patterns.add(r)}),e._zod.check=n=>{n.value.includes(t.includes,t.position)||n.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:n.value,inst:e,continue:!t.abort})}}),fi=p("$ZodCheckStartsWith",(e,t)=>{C.init(e,t);let o=new RegExp(`^${ee(t.prefix)}.*`);t.pattern??(t.pattern=o),e._zod.onattach.push(r=>{let n=r._zod.bag;n.patterns??(n.patterns=new Set),n.patterns.add(o)}),e._zod.check=r=>{r.value.startsWith(t.prefix)||r.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:r.value,inst:e,continue:!t.abort})}}),di=p("$ZodCheckEndsWith",(e,t)=>{C.init(e,t);let o=new RegExp(`.*${ee(t.suffix)}$`);t.pattern??(t.pattern=o),e._zod.onattach.push(r=>{let n=r._zod.bag;n.patterns??(n.patterns=new Set),n.patterns.add(o)}),e._zod.check=r=>{r.value.endsWith(t.suffix)||r.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:r.value,inst:e,continue:!t.abort})}});function Ru(e,t,o){e.issues.length&&t.issues.push(...V(o,e.issues))}s(Ru,"handleCheckPropertyResult");var mi=p("$ZodCheckProperty",(e,t)=>{C.init(e,t),e._zod.check=o=>{let r=t.schema._zod.run({value:o.value[t.property],issues:[]},{});if(r instanceof Promise)return r.then(n=>Ru(n,o,t.property));Ru(r,o,t.property)}}),hi=p("$ZodCheckMimeType",(e,t)=>{C.init(e,t);let o=new Set(t.mime);e._zod.onattach.push(r=>{r._zod.bag.mime=t.mime}),e._zod.check=r=>{o.has(r.value.type)||r.issues.push({code:"invalid_value",values:t.mime,input:r.value.type,inst:e,continue:!t.abort})}}),gi=p("$ZodCheckOverwrite",(e,t)=>{C.init(e,t),e._zod.check=o=>{o.value=t.tx(o.value)}});var Ot=class{static{s(this,"Doc")}constructor(t=[]){this.content=[],this.indent=0,this&&(this.args=t)}indented(t){this.indent+=1,t(this),this.indent-=1}write(t){if(typeof t=="function"){t(this,{execution:"sync"}),t(this,{execution:"async"});return}let r=t.split(`
`).filter(a=>a),n=Math.min(...r.map(a=>a.length-a.trimStart().length)),i=r.map(a=>a.slice(n)).map(a=>" ".repeat(this.indent*2)+a);for(let a of i)this.content.push(a)}compile(){let t=Function,o=this?.args,n=[...(this?.content??[""]).map(i=>`  ${i}`)];return new t(...o,n.join(`
`))}};var xi={major:4,minor:4,patch:3};var $=p("$ZodType",(e,t)=>{var o;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=xi;let r=[...e._zod.def.checks??[]];e._zod.traits.has("$ZodCheck")&&r.unshift(e);for(let n of r)for(let i of n._zod.onattach)i(e);if(r.length===0)(o=e._zod).deferred??(o.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let n=s((a,c,u)=>{let l=_e(a),d;for(let g of c){if(g._zod.def.when){if(vn(a)||!g._zod.def.when(a))continue}else if(l)continue;let v=a.issues.length,y=g._zod.check(a);if(y instanceof Promise&&u?.async===!1)throw new oe;if(d||y instanceof Promise)d=(d??Promise.resolve()).then(async()=>{await y,a.issues.length!==v&&(l||(l=_e(a,v)))});else{if(a.issues.length===v)continue;l||(l=_e(a,v))}}return d?d.then(()=>a):a},"runChecks"),i=s((a,c,u)=>{if(_e(a))return a.aborted=!0,a;let l=n(c,r,u);if(l instanceof Promise){if(u.async===!1)throw new oe;return l.then(d=>e._zod.parse(d,u))}return e._zod.parse(l,u)},"handleCanaryResult");e._zod.run=(a,c)=>{if(c.skipChecks)return e._zod.parse(a,c);if(c.direction==="backward"){let l=e._zod.parse({value:a.value,issues:[]},{...c,skipChecks:!0});return l instanceof Promise?l.then(d=>i(d,a,c)):i(l,a,c)}let u=e._zod.parse(a,c);if(u instanceof Promise){if(c.async===!1)throw new oe;return u.then(l=>n(l,r,c))}return n(u,r,c)}}I(e,"~standard",()=>({validate:s(n=>{try{let i=wn(e,n);return i.success?{value:i.data}:{issues:i.error?.issues}}catch{return kn(e,n).then(a=>a.success?{value:a.data}:{issues:a.error?.issues})}},"validate"),vendor:"zod",version:1}))}),Ee=p("$ZodString",(e,t)=>{$.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??Wn(e._zod.bag),e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=String(o.value)}catch{}return typeof o.value=="string"||o.issues.push({expected:"string",code:"invalid_type",input:o.value,inst:e}),o}}),O=p("$ZodStringFormat",(e,t)=>{Je.init(e,t),Ee.init(e,t)}),bi=p("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=Tn),O.init(e,t)}),yi=p("$ZodUUID",(e,t)=>{if(t.version){let r={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(r===void 0)throw new Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=Ie(r))}else t.pattern??(t.pattern=Ie());O.init(e,t)}),_i=p("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=On),O.init(e,t)}),wi=p("$ZodURL",(e,t)=>{O.init(e,t),e._zod.check=o=>{try{let r=o.value.trim();if(!t.normalize&&t.protocol?.source===Mn.source&&!/^https?:\/\//i.test(r)){o.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:o.value,inst:e,continue:!t.abort});return}let n=new URL(r);t.hostname&&(t.hostname.lastIndex=0,t.hostname.test(n.hostname)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:o.value,inst:e,continue:!t.abort})),t.protocol&&(t.protocol.lastIndex=0,t.protocol.test(n.protocol.endsWith(":")?n.protocol.slice(0,-1):n.protocol)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:o.value,inst:e,continue:!t.abort})),t.normalize?o.value=n.href:o.value=r;return}catch{o.issues.push({code:"invalid_format",format:"url",input:o.value,inst:e,continue:!t.abort})}}}),ki=p("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=An()),O.init(e,t)}),zi=p("$ZodNanoID",(e,t)=>{t.pattern??(t.pattern=In),O.init(e,t)}),$i=p("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=zn),O.init(e,t)}),Si=p("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=$n),O.init(e,t)}),Pi=p("$ZodULID",(e,t)=>{t.pattern??(t.pattern=Sn),O.init(e,t)}),Zi=p("$ZodXID",(e,t)=>{t.pattern??(t.pattern=Pn),O.init(e,t)}),Ii=p("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=Zn),O.init(e,t)}),Ei=p("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=qn(t)),O.init(e,t)}),Ti=p("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=Un),O.init(e,t)}),Oi=p("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=Bn(t)),O.init(e,t)}),Ai=p("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=En),O.init(e,t)}),Ci=p("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=Cn),O.init(e,t),e._zod.bag.format="ipv4"}),ji=p("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=jn),O.init(e,t),e._zod.bag.format="ipv6",e._zod.check=o=>{try{new URL(`http://[${o.value}]`)}catch{o.issues.push({code:"invalid_format",format:"ipv6",input:o.value,inst:e,continue:!t.abort})}}}),Ri=p("$ZodMAC",(e,t)=>{t.pattern??(t.pattern=Rn(t.delimiter)),O.init(e,t),e._zod.bag.format="mac"}),Ni=p("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=Nn),O.init(e,t)}),Li=p("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=Ln),O.init(e,t),e._zod.check=o=>{let r=o.value.split("/");try{if(r.length!==2)throw new Error;let[n,i]=r;if(!i)throw new Error;let a=Number(i);if(`${a}`!==i)throw new Error;if(a<0||a>128)throw new Error;new URL(`http://[${n}]`)}catch{o.issues.push({code:"invalid_format",format:"cidrv6",input:o.value,inst:e,continue:!t.abort})}}});function Di(e){if(e==="")return!0;if(/\s/.test(e)||e.length%4!==0)return!1;try{return atob(e),!0}catch{return!1}}s(Di,"isValidBase64");var Mi=p("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=Dn),O.init(e,t),e._zod.bag.contentEncoding="base64",e._zod.check=o=>{Di(o.value)||o.issues.push({code:"invalid_format",format:"base64",input:o.value,inst:e,continue:!t.abort})}});function Qu(e){if(!ko.test(e))return!1;let t=e.replace(/[-_]/g,r=>r==="-"?"+":"/"),o=t.padEnd(Math.ceil(t.length/4)*4,"=");return Di(o)}s(Qu,"isValidBase64URL");var Fi=p("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=ko),O.init(e,t),e._zod.bag.contentEncoding="base64url",e._zod.check=o=>{Qu(o.value)||o.issues.push({code:"invalid_format",format:"base64url",input:o.value,inst:e,continue:!t.abort})}}),Ui=p("$ZodE164",(e,t)=>{t.pattern??(t.pattern=Fn),O.init(e,t)});function el(e,t=null){try{let o=e.split(".");if(o.length!==3)return!1;let[r]=o;if(!r)return!1;let n=JSON.parse(atob(r));return!("typ"in n&&n?.typ!=="JWT"||!n.alg||t&&(!("alg"in n)||n.alg!==t))}catch{return!1}}s(el,"isValidJWT");var Bi=p("$ZodJWT",(e,t)=>{O.init(e,t),e._zod.check=o=>{el(o.value,t.alg)||o.issues.push({code:"invalid_format",format:"jwt",input:o.value,inst:e,continue:!t.abort})}}),qi=p("$ZodCustomStringFormat",(e,t)=>{O.init(e,t),e._zod.check=o=>{t.fn(o.value)||o.issues.push({code:"invalid_format",format:t.format,input:o.value,inst:e,continue:!t.abort})}}),To=p("$ZodNumber",(e,t)=>{$.init(e,t),e._zod.pattern=e._zod.bag.pattern??zo,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=Number(o.value)}catch{}let n=o.value;if(typeof n=="number"&&!Number.isNaN(n)&&Number.isFinite(n))return o;let i=typeof n=="number"?Number.isNaN(n)?"NaN":Number.isFinite(n)?void 0:"Infinity":void 0;return o.issues.push({expected:"number",code:"invalid_type",input:n,inst:e,...i?{received:i}:{}}),o}}),Wi=p("$ZodNumberFormat",(e,t)=>{ei.init(e,t),To.init(e,t)}),At=p("$ZodBoolean",(e,t)=>{$.init(e,t),e._zod.pattern=Yn,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=!!o.value}catch{}let n=o.value;return typeof n=="boolean"||o.issues.push({expected:"boolean",code:"invalid_type",input:n,inst:e}),o}}),Oo=p("$ZodBigInt",(e,t)=>{$.init(e,t),e._zod.pattern=Jn,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=BigInt(o.value)}catch{}return typeof o.value=="bigint"||o.issues.push({expected:"bigint",code:"invalid_type",input:o.value,inst:e}),o}}),Ji=p("$ZodBigIntFormat",(e,t)=>{ti.init(e,t),Oo.init(e,t)}),Vi=p("$ZodSymbol",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return typeof n=="symbol"||o.issues.push({expected:"symbol",code:"invalid_type",input:n,inst:e}),o}}),Yi=p("$ZodUndefined",(e,t)=>{$.init(e,t),e._zod.pattern=Gn,e._zod.values=new Set([void 0]),e._zod.parse=(o,r)=>{let n=o.value;return typeof n>"u"||o.issues.push({expected:"undefined",code:"invalid_type",input:n,inst:e}),o}}),Ki=p("$ZodNull",(e,t)=>{$.init(e,t),e._zod.pattern=Kn,e._zod.values=new Set([null]),e._zod.parse=(o,r)=>{let n=o.value;return n===null||o.issues.push({expected:"null",code:"invalid_type",input:n,inst:e}),o}}),Gi=p("$ZodAny",(e,t)=>{$.init(e,t),e._zod.parse=o=>o}),Hi=p("$ZodUnknown",(e,t)=>{$.init(e,t),e._zod.parse=o=>o}),Xi=p("$ZodNever",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>(o.issues.push({expected:"never",code:"invalid_type",input:o.value,inst:e}),o)}),Qi=p("$ZodVoid",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return typeof n>"u"||o.issues.push({expected:"void",code:"invalid_type",input:n,inst:e}),o}}),es=p("$ZodDate",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=new Date(o.value)}catch{}let n=o.value,i=n instanceof Date;return i&&!Number.isNaN(n.getTime())||o.issues.push({expected:"date",code:"invalid_type",input:n,...i?{received:"Invalid Date"}:{},inst:e}),o}});function Du(e,t,o){e.issues.length&&t.issues.push(...V(o,e.issues)),t.value[o]=e.value}s(Du,"handleArrayResult");var ts=p("$ZodArray",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!Array.isArray(n))return o.issues.push({expected:"array",code:"invalid_type",input:n,inst:e}),o;o.value=Array(n.length);let i=[];for(let a=0;a<n.length;a++){let c=n[a],u=t.element._zod.run({value:c,issues:[]},r);u instanceof Promise?i.push(u.then(l=>Du(l,o,a))):Du(u,o,a)}return i.length?Promise.all(i).then(()=>o):o}});function Eo(e,t,o,r,n,i){let a=o in r;if(e.issues.length){if(n&&i&&!a)return;t.issues.push(...V(o,e.issues))}if(!a&&!n){e.issues.length||t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[o]});return}e.value===void 0?a&&(t.value[o]=void 0):t.value[o]=e.value}s(Eo,"handlePropertyResult");function tl(e){let t=Object.keys(e.shape);for(let r of t)if(!e.shape?.[r]?._zod?.traits?.has("$ZodType"))throw new Error(`Invalid element at key "${r}": expected a Zod schema`);let o=hn(e.shape);return{...e,keys:t,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(o)}}s(tl,"normalizeDef");function ol(e,t,o,r,n,i){let a=[],c=n.keySet,u=n.catchall._zod,l=u.def.type,d=u.optin==="optional",g=u.optout==="optional";for(let v in t){if(v==="__proto__"||c.has(v))continue;if(l==="never"){a.push(v);continue}let y=u.run({value:t[v],issues:[]},r);y instanceof Promise?e.push(y.then(P=>Eo(P,o,v,t,d,g))):Eo(y,o,v,t,d,g)}return a.length&&o.issues.push({code:"unrecognized_keys",keys:a,input:t,inst:i}),e.length?Promise.all(e).then(()=>o):o}s(ol,"handleCatchall");var rl=p("$ZodObject",(e,t)=>{if($.init(e,t),!Object.getOwnPropertyDescriptor(t,"shape")?.get){let c=t.shape;Object.defineProperty(t,"shape",{get:s(()=>{let u={...c};return Object.defineProperty(t,"shape",{value:u}),u},"get")})}let r=Me(()=>tl(t));I(e._zod,"propValues",()=>{let c=t.shape,u={};for(let l in c){let d=c[l]._zod;if(d.values){u[l]??(u[l]=new Set);for(let g of d.values)u[l].add(g)}}return u});let n=Ze,i=t.catchall,a;e._zod.parse=(c,u)=>{a??(a=r.value);let l=c.value;if(!n(l))return c.issues.push({expected:"object",code:"invalid_type",input:l,inst:e}),c;c.value={};let d=[],g=a.shape;for(let v of a.keys){let y=g[v],P=y._zod.optin==="optional",X=y._zod.optout==="optional",L=y._zod.run({value:l[v],issues:[]},u);L instanceof Promise?d.push(L.then(bt=>Eo(bt,c,v,l,P,X))):Eo(L,c,v,l,P,X)}return i?ol(d,l,c,u,r.value,e):d.length?Promise.all(d).then(()=>c):c}}),os=p("$ZodObjectJIT",(e,t)=>{rl.init(e,t);let o=e._zod.parse,r=Me(()=>tl(t)),n=s(v=>{let y=new Ot(["shape","payload","ctx"]),P=r.value,X=s(Q=>{let R=uo(Q);return`shape[${R}]._zod.run({ value: input[${R}], issues: [] }, ctx)`},"parseStr");y.write("const input = payload.value;");let L=Object.create(null),bt=0;for(let Q of P.keys)L[Q]=`key_${bt++}`;y.write("const newResult = {};");for(let Q of P.keys){let R=L[Q],M=uo(Q),no=v[Q],io=no?._zod?.optin==="optional",tn=no?._zod?.optout==="optional";y.write(`const ${R} = ${X(Q)};`),io&&tn?y.write(`
        if (${R}.issues.length) {
          if (${M} in input) {
            payload.issues = payload.issues.concat(${R}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${M}, ...iss.path] : [${M}]
            })));
          }
        }
        
        if (${R}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${R}.value;
        }
        
      `):io?y.write(`
        if (${R}.issues.length) {
          payload.issues = payload.issues.concat(${R}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        
        if (${R}.value === undefined) {
          if (${M} in input) {
            newResult[${M}] = undefined;
          }
        } else {
          newResult[${M}] = ${R}.value;
        }
        
      `):y.write(`
        const ${R}_present = ${M} in input;
        if (${R}.issues.length) {
          payload.issues = payload.issues.concat(${R}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${M}, ...iss.path] : [${M}]
          })));
        }
        if (!${R}_present && !${R}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${M}]
          });
        }

        if (${R}_present) {
          if (${R}.value === undefined) {
            newResult[${M}] = undefined;
          } else {
            newResult[${M}] = ${R}.value;
          }
        }

      `)}y.write("payload.value = newResult;"),y.write("return payload;");let en=y.compile();return(Q,R)=>en(v,Q,R)},"generateFastpass"),i,a=Ze,c=!Pe.jitless,l=c&&fn.value,d=t.catchall,g;e._zod.parse=(v,y)=>{g??(g=r.value);let P=v.value;return a(P)?c&&l&&y?.async===!1&&y.jitless!==!0?(i||(i=n(t.shape)),v=i(v,y),d?ol([],P,v,y,g,e):v):o(v,y):(v.issues.push({expected:"object",code:"invalid_type",input:P,inst:e}),v)}});function Mu(e,t,o,r){for(let i of e)if(i.issues.length===0)return t.value=i.value,t;let n=e.filter(i=>!_e(i));return n.length===1?(t.value=n[0].value,n[0]):(t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:e.map(i=>i.issues.map(a=>q(a,r,N())))}),t)}s(Mu,"handleUnionResults");var Ct=p("$ZodUnion",(e,t)=>{$.init(e,t),I(e._zod,"optin",()=>t.options.some(r=>r._zod.optin==="optional")?"optional":void 0),I(e._zod,"optout",()=>t.options.some(r=>r._zod.optout==="optional")?"optional":void 0),I(e._zod,"values",()=>{if(t.options.every(r=>r._zod.values))return new Set(t.options.flatMap(r=>Array.from(r._zod.values)))}),I(e._zod,"pattern",()=>{if(t.options.every(r=>r._zod.pattern)){let r=t.options.map(n=>n._zod.pattern);return new RegExp(`^(${r.map(n=>kt(n.source)).join("|")})$`)}});let o=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(r,n)=>{if(o)return o(r,n);let i=!1,a=[];for(let c of t.options){let u=c._zod.run({value:r.value,issues:[]},n);if(u instanceof Promise)a.push(u),i=!0;else{if(u.issues.length===0)return u;a.push(u)}}return i?Promise.all(a).then(c=>Mu(c,r,e,n)):Mu(a,r,e,n)}});function Fu(e,t,o,r){let n=e.filter(i=>i.issues.length===0);return n.length===1?(t.value=n[0].value,t):(n.length===0?t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:e.map(i=>i.issues.map(a=>q(a,r,N())))}):t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:[],inclusive:!1}),t)}s(Fu,"handleExclusiveUnionResults");var rs=p("$ZodXor",(e,t)=>{Ct.init(e,t),t.inclusive=!1;let o=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(r,n)=>{if(o)return o(r,n);let i=!1,a=[];for(let c of t.options){let u=c._zod.run({value:r.value,issues:[]},n);u instanceof Promise?(a.push(u),i=!0):a.push(u)}return i?Promise.all(a).then(c=>Fu(c,r,e,n)):Fu(a,r,e,n)}}),ns=p("$ZodDiscriminatedUnion",(e,t)=>{t.inclusive=!1,Ct.init(e,t);let o=e._zod.parse;I(e._zod,"propValues",()=>{let n={};for(let i of t.options){let a=i._zod.propValues;if(!a||Object.keys(a).length===0)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(i)}"`);for(let[c,u]of Object.entries(a)){n[c]||(n[c]=new Set);for(let l of u)n[c].add(l)}}return n});let r=Me(()=>{let n=t.options,i=new Map;for(let a of n){let c=a._zod.propValues?.[t.discriminator];if(!c||c.size===0)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(a)}"`);for(let u of c){if(i.has(u))throw new Error(`Duplicate discriminator value "${String(u)}"`);i.set(u,a)}}return i});e._zod.parse=(n,i)=>{let a=n.value;if(!Ze(a))return n.issues.push({code:"invalid_type",expected:"object",input:a,inst:e}),n;let c=r.value.get(a?.[t.discriminator]);return c?c._zod.run(n,i):t.unionFallback||i.direction==="backward"?o(n,i):(n.issues.push({code:"invalid_union",errors:[],note:"No matching discriminator",discriminator:t.discriminator,options:Array.from(r.value.keys()),input:a,path:[t.discriminator],inst:e}),n)}}),is=p("$ZodIntersection",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value,i=t.left._zod.run({value:n,issues:[]},r),a=t.right._zod.run({value:n,issues:[]},r);return i instanceof Promise||a instanceof Promise?Promise.all([i,a]).then(([u,l])=>Uu(o,u,l)):Uu(o,i,a)}});function vi(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e==+t)return{valid:!0,data:e};if(ye(e)&&ye(t)){let o=Object.keys(t),r=Object.keys(e).filter(i=>o.indexOf(i)!==-1),n={...e,...t};for(let i of r){let a=vi(e[i],t[i]);if(!a.valid)return{valid:!1,mergeErrorPath:[i,...a.mergeErrorPath]};n[i]=a.data}return{valid:!0,data:n}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let o=[];for(let r=0;r<e.length;r++){let n=e[r],i=t[r],a=vi(n,i);if(!a.valid)return{valid:!1,mergeErrorPath:[r,...a.mergeErrorPath]};o.push(a.data)}return{valid:!0,data:o}}return{valid:!1,mergeErrorPath:[]}}s(vi,"mergeValues");function Uu(e,t,o){let r=new Map,n;for(let c of t.issues)if(c.code==="unrecognized_keys"){n??(n=c);for(let u of c.keys)r.has(u)||r.set(u,{}),r.get(u).l=!0}else e.issues.push(c);for(let c of o.issues)if(c.code==="unrecognized_keys")for(let u of c.keys)r.has(u)||r.set(u,{}),r.get(u).r=!0;else e.issues.push(c);let i=[...r].filter(([,c])=>c.l&&c.r).map(([c])=>c);if(i.length&&n&&e.issues.push({...n,keys:i}),_e(e))return e;let a=vi(t.value,o.value);if(!a.valid)throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(a.mergeErrorPath)}`);return e.value=a.data,e}s(Uu,"handleIntersectionResults");var Ao=p("$ZodTuple",(e,t)=>{$.init(e,t);let o=t.items;e._zod.parse=(r,n)=>{let i=r.value;if(!Array.isArray(i))return r.issues.push({input:i,inst:e,expected:"tuple",code:"invalid_type"}),r;r.value=[];let a=[],c=Bu(o,"optin"),u=Bu(o,"optout");if(!t.rest){if(i.length<c)return r.issues.push({code:"too_small",minimum:c,inclusive:!0,input:i,inst:e,origin:"array"}),r;i.length>o.length&&r.issues.push({code:"too_big",maximum:o.length,inclusive:!0,input:i,inst:e,origin:"array"})}let l=new Array(o.length);for(let d=0;d<o.length;d++){let g=o[d]._zod.run({value:i[d],issues:[]},n);g instanceof Promise?a.push(g.then(v=>{l[d]=v})):l[d]=g}if(t.rest){let d=o.length-1,g=i.slice(o.length);for(let v of g){d++;let y=t.rest._zod.run({value:v,issues:[]},n);y instanceof Promise?a.push(y.then(P=>qu(P,r,d))):qu(y,r,d)}}return a.length?Promise.all(a).then(()=>Wu(l,r,o,i,u)):Wu(l,r,o,i,u)}});function Bu(e,t){for(let o=e.length-1;o>=0;o--)if(e[o]._zod[t]!=="optional")return o+1;return 0}s(Bu,"getTupleOptStart");function qu(e,t,o){e.issues.length&&t.issues.push(...V(o,e.issues)),t.value[o]=e.value}s(qu,"handleTupleResult");function Wu(e,t,o,r,n){for(let i=0;i<o.length;i++){let a=e[i],c=i<r.length;if(a.issues.length){if(!c&&i>=n){t.value.length=i;break}t.issues.push(...V(i,a.issues))}t.value[i]=a.value}for(let i=t.value.length-1;i>=r.length&&(o[i]._zod.optout==="optional"&&t.value[i]===void 0);i--)t.value.length=i;return t}s(Wu,"handleTupleResults");var ss=p("$ZodRecord",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!ye(n))return o.issues.push({expected:"record",code:"invalid_type",input:n,inst:e}),o;let i=[],a=t.keyType._zod.values;if(a){o.value={};let c=new Set;for(let l of a)if(typeof l=="string"||typeof l=="number"||typeof l=="symbol"){c.add(typeof l=="number"?l.toString():l);let d=t.keyType._zod.run({value:l,issues:[]},r);if(d instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(d.issues.length){o.issues.push({code:"invalid_key",origin:"record",issues:d.issues.map(y=>q(y,r,N())),input:l,path:[l],inst:e});continue}let g=d.value,v=t.valueType._zod.run({value:n[l],issues:[]},r);v instanceof Promise?i.push(v.then(y=>{y.issues.length&&o.issues.push(...V(l,y.issues)),o.value[g]=y.value})):(v.issues.length&&o.issues.push(...V(l,v.issues)),o.value[g]=v.value)}let u;for(let l in n)c.has(l)||(u=u??[],u.push(l));u&&u.length>0&&o.issues.push({code:"unrecognized_keys",input:n,inst:e,keys:u})}else{o.value={};for(let c of Reflect.ownKeys(n)){if(c==="__proto__"||!Object.prototype.propertyIsEnumerable.call(n,c))continue;let u=t.keyType._zod.run({value:c,issues:[]},r);if(u instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(typeof c=="string"&&zo.test(c)&&u.issues.length){let g=t.keyType._zod.run({value:Number(c),issues:[]},r);if(g instanceof Promise)throw new Error("Async schemas not supported in object keys currently");g.issues.length===0&&(u=g)}if(u.issues.length){t.mode==="loose"?o.value[c]=n[c]:o.issues.push({code:"invalid_key",origin:"record",issues:u.issues.map(g=>q(g,r,N())),input:c,path:[c],inst:e});continue}let d=t.valueType._zod.run({value:n[c],issues:[]},r);d instanceof Promise?i.push(d.then(g=>{g.issues.length&&o.issues.push(...V(c,g.issues)),o.value[u.value]=g.value})):(d.issues.length&&o.issues.push(...V(c,d.issues)),o.value[u.value]=d.value)}}return i.length?Promise.all(i).then(()=>o):o}}),as=p("$ZodMap",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!(n instanceof Map))return o.issues.push({expected:"map",code:"invalid_type",input:n,inst:e}),o;let i=[];o.value=new Map;for(let[a,c]of n){let u=t.keyType._zod.run({value:a,issues:[]},r),l=t.valueType._zod.run({value:c,issues:[]},r);u instanceof Promise||l instanceof Promise?i.push(Promise.all([u,l]).then(([d,g])=>{Ju(d,g,o,a,n,e,r)})):Ju(u,l,o,a,n,e,r)}return i.length?Promise.all(i).then(()=>o):o}});function Ju(e,t,o,r,n,i,a){e.issues.length&&(zt.has(typeof r)?o.issues.push(...V(r,e.issues)):o.issues.push({code:"invalid_key",origin:"map",input:n,inst:i,issues:e.issues.map(c=>q(c,a,N()))})),t.issues.length&&(zt.has(typeof r)?o.issues.push(...V(r,t.issues)):o.issues.push({origin:"map",code:"invalid_element",input:n,inst:i,key:r,issues:t.issues.map(c=>q(c,a,N()))})),o.value.set(e.value,t.value)}s(Ju,"handleMapResult");var cs=p("$ZodSet",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!(n instanceof Set))return o.issues.push({input:n,inst:e,expected:"set",code:"invalid_type"}),o;let i=[];o.value=new Set;for(let a of n){let c=t.valueType._zod.run({value:a,issues:[]},r);c instanceof Promise?i.push(c.then(u=>Vu(u,o))):Vu(c,o)}return i.length?Promise.all(i).then(()=>o):o}});function Vu(e,t){e.issues.length&&t.issues.push(...e.issues),t.value.add(e.value)}s(Vu,"handleSetResult");var us=p("$ZodEnum",(e,t)=>{$.init(e,t);let o=wt(t.entries),r=new Set(o);e._zod.values=r,e._zod.pattern=new RegExp(`^(${o.filter(n=>zt.has(typeof n)).map(n=>typeof n=="string"?ee(n):n.toString()).join("|")})$`),e._zod.parse=(n,i)=>{let a=n.value;return r.has(a)||n.issues.push({code:"invalid_value",values:o,input:a,inst:e}),n}}),ls=p("$ZodLiteral",(e,t)=>{if($.init(e,t),t.values.length===0)throw new Error("Cannot create literal schema with no valid values");let o=new Set(t.values);e._zod.values=o,e._zod.pattern=new RegExp(`^(${t.values.map(r=>typeof r=="string"?ee(r):r?ee(r.toString()):String(r)).join("|")})$`),e._zod.parse=(r,n)=>{let i=r.value;return o.has(i)||r.issues.push({code:"invalid_value",values:t.values,input:i,inst:e}),r}}),ps=p("$ZodFile",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return n instanceof File||o.issues.push({expected:"file",code:"invalid_type",input:n,inst:e}),o}}),fs=p("$ZodTransform",(e,t)=>{$.init(e,t),e._zod.optin="optional",e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new xe(e.constructor.name);let n=t.transform(o.value,o);if(r.async)return(n instanceof Promise?n:Promise.resolve(n)).then(a=>(o.value=a,o.fallback=!0,o));if(n instanceof Promise)throw new oe;return o.value=n,o.fallback=!0,o}});function Yu(e,t){return t===void 0&&(e.issues.length||e.fallback)?{issues:[],value:void 0}:e}s(Yu,"handleOptionalResult");var Co=p("$ZodOptional",(e,t)=>{$.init(e,t),e._zod.optin="optional",e._zod.optout="optional",I(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),I(e._zod,"pattern",()=>{let o=t.innerType._zod.pattern;return o?new RegExp(`^(${kt(o.source)})?$`):void 0}),e._zod.parse=(o,r)=>{if(t.innerType._zod.optin==="optional"){let n=o.value,i=t.innerType._zod.run(o,r);return i instanceof Promise?i.then(a=>Yu(a,n)):Yu(i,n)}return o.value===void 0?o:t.innerType._zod.run(o,r)}}),ds=p("$ZodExactOptional",(e,t)=>{Co.init(e,t),I(e._zod,"values",()=>t.innerType._zod.values),I(e._zod,"pattern",()=>t.innerType._zod.pattern),e._zod.parse=(o,r)=>t.innerType._zod.run(o,r)}),ms=p("$ZodNullable",(e,t)=>{$.init(e,t),I(e._zod,"optin",()=>t.innerType._zod.optin),I(e._zod,"optout",()=>t.innerType._zod.optout),I(e._zod,"pattern",()=>{let o=t.innerType._zod.pattern;return o?new RegExp(`^(${kt(o.source)}|null)$`):void 0}),I(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(o,r)=>o.value===null?o:t.innerType._zod.run(o,r)}),hs=p("$ZodDefault",(e,t)=>{$.init(e,t),e._zod.optin="optional",I(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);if(o.value===void 0)return o.value=t.defaultValue,o;let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(i=>Ku(i,t)):Ku(n,t)}});function Ku(e,t){return e.value===void 0&&(e.value=t.defaultValue),e}s(Ku,"handleDefaultResult");var gs=p("$ZodPrefault",(e,t)=>{$.init(e,t),e._zod.optin="optional",I(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>(r.direction==="backward"||o.value===void 0&&(o.value=t.defaultValue),t.innerType._zod.run(o,r))}),xs=p("$ZodNonOptional",(e,t)=>{$.init(e,t),I(e._zod,"values",()=>{let o=t.innerType._zod.values;return o?new Set([...o].filter(r=>r!==void 0)):void 0}),e._zod.parse=(o,r)=>{let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(i=>Gu(i,e)):Gu(n,e)}});function Gu(e,t){return!e.issues.length&&e.value===void 0&&e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t}),e}s(Gu,"handleNonOptionalResult");var vs=p("$ZodSuccess",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new xe("ZodSuccess");let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(i=>(o.value=i.issues.length===0,o)):(o.value=n.issues.length===0,o)}}),bs=p("$ZodCatch",(e,t)=>{$.init(e,t),e._zod.optin="optional",I(e._zod,"optout",()=>t.innerType._zod.optout),I(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(i=>(o.value=i.value,i.issues.length&&(o.value=t.catchValue({...o,error:{issues:i.issues.map(a=>q(a,r,N()))},input:o.value}),o.issues=[],o.fallback=!0),o)):(o.value=n.value,n.issues.length&&(o.value=t.catchValue({...o,error:{issues:n.issues.map(i=>q(i,r,N()))},input:o.value}),o.issues=[],o.fallback=!0),o)}}),ys=p("$ZodNaN",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>((typeof o.value!="number"||!Number.isNaN(o.value))&&o.issues.push({input:o.value,inst:e,expected:"nan",code:"invalid_type"}),o)}),jo=p("$ZodPipe",(e,t)=>{$.init(e,t),I(e._zod,"values",()=>t.in._zod.values),I(e._zod,"optin",()=>t.in._zod.optin),I(e._zod,"optout",()=>t.out._zod.optout),I(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(o,r)=>{if(r.direction==="backward"){let i=t.out._zod.run(o,r);return i instanceof Promise?i.then(a=>Po(a,t.in,r)):Po(i,t.in,r)}let n=t.in._zod.run(o,r);return n instanceof Promise?n.then(i=>Po(i,t.out,r)):Po(n,t.out,r)}});function Po(e,t,o){return e.issues.length?(e.aborted=!0,e):t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},o)}s(Po,"handlePipeResult");var jt=p("$ZodCodec",(e,t)=>{$.init(e,t),I(e._zod,"values",()=>t.in._zod.values),I(e._zod,"optin",()=>t.in._zod.optin),I(e._zod,"optout",()=>t.out._zod.optout),I(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(o,r)=>{if((r.direction||"forward")==="forward"){let i=t.in._zod.run(o,r);return i instanceof Promise?i.then(a=>Zo(a,t,r)):Zo(i,t,r)}else{let i=t.out._zod.run(o,r);return i instanceof Promise?i.then(a=>Zo(a,t,r)):Zo(i,t,r)}}});function Zo(e,t,o){if(e.issues.length)return e.aborted=!0,e;if((o.direction||"forward")==="forward"){let n=t.transform(e.value,e);return n instanceof Promise?n.then(i=>Io(e,i,t.out,o)):Io(e,n,t.out,o)}else{let n=t.reverseTransform(e.value,e);return n instanceof Promise?n.then(i=>Io(e,i,t.in,o)):Io(e,n,t.in,o)}}s(Zo,"handleCodecAResult");function Io(e,t,o,r){return e.issues.length?(e.aborted=!0,e):o._zod.run({value:t,issues:e.issues},r)}s(Io,"handleCodecTxResult");var _s=p("$ZodPreprocess",(e,t)=>{jo.init(e,t)}),ws=p("$ZodReadonly",(e,t)=>{$.init(e,t),I(e._zod,"propValues",()=>t.innerType._zod.propValues),I(e._zod,"values",()=>t.innerType._zod.values),I(e._zod,"optin",()=>t.innerType?._zod?.optin),I(e._zod,"optout",()=>t.innerType?._zod?.optout),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(Hu):Hu(n)}});function Hu(e){return e.value=Object.freeze(e.value),e}s(Hu,"handleReadonlyResult");var ks=p("$ZodTemplateLiteral",(e,t)=>{$.init(e,t);let o=[];for(let r of t.parts)if(typeof r=="object"&&r!==null){if(!r._zod.pattern)throw new Error(`Invalid template literal part, no pattern found: ${[...r._zod.traits].shift()}`);let n=r._zod.pattern instanceof RegExp?r._zod.pattern.source:r._zod.pattern;if(!n)throw new Error(`Invalid template literal part: ${r._zod.traits}`);let i=n.startsWith("^")?1:0,a=n.endsWith("$")?n.length-1:n.length;o.push(n.slice(i,a))}else if(r===null||mn.has(typeof r))o.push(ee(`${r}`));else throw new Error(`Invalid template literal part: ${r}`);e._zod.pattern=new RegExp(`^${o.join("")}$`),e._zod.parse=(r,n)=>typeof r.value!="string"?(r.issues.push({input:r.value,inst:e,expected:"string",code:"invalid_type"}),r):(e._zod.pattern.lastIndex=0,e._zod.pattern.test(r.value)||r.issues.push({input:r.value,inst:e,code:"invalid_format",format:t.format??"template_literal",pattern:e._zod.pattern.source}),r)}),zs=p("$ZodFunction",(e,t)=>($.init(e,t),e._def=t,e._zod.def=t,e.implement=o=>{if(typeof o!="function")throw new Error("implement() must be called with a function");return function(...r){let n=e._def.input?fo(e._def.input,r):r,i=Reflect.apply(o,this,n);return e._def.output?fo(e._def.output,i):i}},e.implementAsync=o=>{if(typeof o!="function")throw new Error("implementAsync() must be called with a function");return async function(...r){let n=e._def.input?await mo(e._def.input,r):r,i=await Reflect.apply(o,this,n);return e._def.output?await mo(e._def.output,i):i}},e._zod.parse=(o,r)=>typeof o.value!="function"?(o.issues.push({code:"invalid_type",expected:"function",input:o.value,inst:e}),o):(e._def.output&&e._def.output._zod.def.type==="promise"?o.value=e.implementAsync(o.value):o.value=e.implement(o.value),o),e.input=(...o)=>{let r=e.constructor;return Array.isArray(o[0])?new r({type:"function",input:new Ao({type:"tuple",items:o[0],rest:o[1]}),output:e._def.output}):new r({type:"function",input:o[0],output:e._def.output})},e.output=o=>{let r=e.constructor;return new r({type:"function",input:e._def.input,output:o})},e)),$s=p("$ZodPromise",(e,t)=>{$.init(e,t),e._zod.parse=(o,r)=>Promise.resolve(o.value).then(n=>t.innerType._zod.run({value:n,issues:[]},r))}),Ss=p("$ZodLazy",(e,t)=>{$.init(e,t),I(e._zod,"innerType",()=>{let o=t;return o._cachedInner||(o._cachedInner=t.getter()),o._cachedInner}),I(e._zod,"pattern",()=>e._zod.innerType?._zod?.pattern),I(e._zod,"propValues",()=>e._zod.innerType?._zod?.propValues),I(e._zod,"optin",()=>e._zod.innerType?._zod?.optin??void 0),I(e._zod,"optout",()=>e._zod.innerType?._zod?.optout??void 0),e._zod.parse=(o,r)=>e._zod.innerType._zod.run(o,r)}),Ps=p("$ZodCustom",(e,t)=>{C.init(e,t),$.init(e,t),e._zod.parse=(o,r)=>o,e._zod.check=o=>{let r=o.value,n=t.fn(r);if(n instanceof Promise)return n.then(i=>Xu(i,o,r,e));Xu(n,o,r,e)}});function Xu(e,t,o,r){if(!e){let n={code:"custom",input:o,inst:r,path:[...r._zod.def.path??[]],continue:!r._zod.def.abort};r._zod.def.params&&(n.params=r._zod.def.params),t.issues.push(Fe(n))}}s(Xu,"handleRefineResult");var Nt={};le(Nt,{en:()=>Rt});var g0=s(()=>{let e={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function t(n){return e[n]??null}s(t,"getSizing");let o={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",jwt:"JWT",template_literal:"input"},r={nan:"NaN"};return n=>{switch(n.code){case"invalid_type":{let i=r[n.expected]??n.expected,a=bn(n.input),c=r[a]??a;return`Invalid input: expected ${i}, received ${c}`}case"invalid_value":return n.values.length===1?`Invalid input: expected ${po(n.values[0])}`:`Invalid option: expected one of ${co(n.values,"|")}`;case"too_big":{let i=n.inclusive?"<=":"<",a=t(n.origin);return a?`Too big: expected ${n.origin??"value"} to have ${i}${n.maximum.toString()} ${a.unit??"elements"}`:`Too big: expected ${n.origin??"value"} to be ${i}${n.maximum.toString()}`}case"too_small":{let i=n.inclusive?">=":">",a=t(n.origin);return a?`Too small: expected ${n.origin} to have ${i}${n.minimum.toString()} ${a.unit}`:`Too small: expected ${n.origin} to be ${i}${n.minimum.toString()}`}case"invalid_format":{let i=n;return i.format==="starts_with"?`Invalid string: must start with "${i.prefix}"`:i.format==="ends_with"?`Invalid string: must end with "${i.suffix}"`:i.format==="includes"?`Invalid string: must include "${i.includes}"`:i.format==="regex"?`Invalid string: must match pattern ${i.pattern}`:`Invalid ${o[i.format]??n.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${n.divisor}`;case"unrecognized_keys":return`Unrecognized key${n.keys.length>1?"s":""}: ${co(n.keys,", ")}`;case"invalid_key":return`Invalid key in ${n.origin}`;case"invalid_union":return n.options&&Array.isArray(n.options)&&n.options.length>0?`Invalid discriminator value. Expected ${n.options.map(a=>`'${a}'`).join(" | ")}`:"Invalid input";case"invalid_element":return`Invalid value in ${n.origin}`;default:return"Invalid input"}}},"error");function Rt(){return{localeError:g0()}}s(Rt,"default");var nl,Zs=Symbol("ZodOutput"),Is=Symbol("ZodInput"),Ro=class{static{s(this,"$ZodRegistry")}constructor(){this._map=new WeakMap,this._idmap=new Map}add(t,...o){let r=o[0];return this._map.set(t,r),r&&typeof r=="object"&&"id"in r&&this._idmap.set(r.id,t),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(t){let o=this._map.get(t);return o&&typeof o=="object"&&"id"in o&&this._idmap.delete(o.id),this._map.delete(t),this}get(t){let o=t._zod.parent;if(o){let r={...this.get(o)??{}};delete r.id;let n={...r,...this._map.get(t)};return Object.keys(n).length?n:void 0}return this._map.get(t)}has(t){return this._map.has(t)}};function No(){return new Ro}s(No,"registry");(nl=globalThis).__zod_globalRegistry??(nl.__zod_globalRegistry=No());var F=globalThis.__zod_globalRegistry;function Es(e,t){return new e({type:"string",...x(t)})}s(Es,"_string");function Ts(e,t){return new e({type:"string",coerce:!0,...x(t)})}s(Ts,"_coercedString");function Lo(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...x(t)})}s(Lo,"_email");function Lt(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...x(t)})}s(Lt,"_guid");function Do(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...x(t)})}s(Do,"_uuid");function Mo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...x(t)})}s(Mo,"_uuidv4");function Fo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...x(t)})}s(Fo,"_uuidv6");function Uo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...x(t)})}s(Uo,"_uuidv7");function Dt(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...x(t)})}s(Dt,"_url");function Bo(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...x(t)})}s(Bo,"_emoji");function qo(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...x(t)})}s(qo,"_nanoid");function Wo(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...x(t)})}s(Wo,"_cuid");function Jo(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...x(t)})}s(Jo,"_cuid2");function Vo(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...x(t)})}s(Vo,"_ulid");function Yo(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...x(t)})}s(Yo,"_xid");function Ko(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...x(t)})}s(Ko,"_ksuid");function Go(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...x(t)})}s(Go,"_ipv4");function Ho(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...x(t)})}s(Ho,"_ipv6");function Os(e,t){return new e({type:"string",format:"mac",check:"string_format",abort:!1,...x(t)})}s(Os,"_mac");function Xo(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...x(t)})}s(Xo,"_cidrv4");function Qo(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...x(t)})}s(Qo,"_cidrv6");function er(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...x(t)})}s(er,"_base64");function tr(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...x(t)})}s(tr,"_base64url");function or(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...x(t)})}s(or,"_e164");function rr(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...x(t)})}s(rr,"_jwt");var As={Any:null,Minute:-1,Second:0,Millisecond:3,Microsecond:6};function Cs(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...x(t)})}s(Cs,"_isoDateTime");function js(e,t){return new e({type:"string",format:"date",check:"string_format",...x(t)})}s(js,"_isoDate");function Rs(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...x(t)})}s(Rs,"_isoTime");function Ns(e,t){return new e({type:"string",format:"duration",check:"string_format",...x(t)})}s(Ns,"_isoDuration");function Ls(e,t){return new e({type:"number",checks:[],...x(t)})}s(Ls,"_number");function Ds(e,t){return new e({type:"number",coerce:!0,checks:[],...x(t)})}s(Ds,"_coercedNumber");function Ms(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...x(t)})}s(Ms,"_int");function Fs(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"float32",...x(t)})}s(Fs,"_float32");function Us(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"float64",...x(t)})}s(Us,"_float64");function Bs(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"int32",...x(t)})}s(Bs,"_int32");function qs(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"uint32",...x(t)})}s(qs,"_uint32");function Ws(e,t){return new e({type:"boolean",...x(t)})}s(Ws,"_boolean");function Js(e,t){return new e({type:"boolean",coerce:!0,...x(t)})}s(Js,"_coercedBoolean");function Vs(e,t){return new e({type:"bigint",...x(t)})}s(Vs,"_bigint");function Ys(e,t){return new e({type:"bigint",coerce:!0,...x(t)})}s(Ys,"_coercedBigint");function Ks(e,t){return new e({type:"bigint",check:"bigint_format",abort:!1,format:"int64",...x(t)})}s(Ks,"_int64");function Gs(e,t){return new e({type:"bigint",check:"bigint_format",abort:!1,format:"uint64",...x(t)})}s(Gs,"_uint64");function Hs(e,t){return new e({type:"symbol",...x(t)})}s(Hs,"_symbol");function Xs(e,t){return new e({type:"undefined",...x(t)})}s(Xs,"_undefined");function Qs(e,t){return new e({type:"null",...x(t)})}s(Qs,"_null");function ea(e){return new e({type:"any"})}s(ea,"_any");function ta(e){return new e({type:"unknown"})}s(ta,"_unknown");function oa(e,t){return new e({type:"never",...x(t)})}s(oa,"_never");function ra(e,t){return new e({type:"void",...x(t)})}s(ra,"_void");function na(e,t){return new e({type:"date",...x(t)})}s(na,"_date");function ia(e,t){return new e({type:"date",coerce:!0,...x(t)})}s(ia,"_coercedDate");function sa(e,t){return new e({type:"nan",...x(t)})}s(sa,"_nan");function ne(e,t){return new $o({check:"less_than",...x(t),value:e,inclusive:!1})}s(ne,"_lt");function H(e,t){return new $o({check:"less_than",...x(t),value:e,inclusive:!0})}s(H,"_lte");function ie(e,t){return new So({check:"greater_than",...x(t),value:e,inclusive:!1})}s(ie,"_gt");function W(e,t){return new So({check:"greater_than",...x(t),value:e,inclusive:!0})}s(W,"_gte");function nr(e){return ie(0,e)}s(nr,"_positive");function ir(e){return ne(0,e)}s(ir,"_negative");function sr(e){return H(0,e)}s(sr,"_nonpositive");function ar(e){return W(0,e)}s(ar,"_nonnegative");function we(e,t){return new Qn({check:"multiple_of",...x(t),value:e})}s(we,"_multipleOf");function ke(e,t){return new oi({check:"max_size",...x(t),maximum:e})}s(ke,"_maxSize");function se(e,t){return new ri({check:"min_size",...x(t),minimum:e})}s(se,"_minSize");function Te(e,t){return new ni({check:"size_equals",...x(t),size:e})}s(Te,"_size");function Oe(e,t){return new ii({check:"max_length",...x(t),maximum:e})}s(Oe,"_maxLength");function fe(e,t){return new si({check:"min_length",...x(t),minimum:e})}s(fe,"_minLength");function Ae(e,t){return new ai({check:"length_equals",...x(t),length:e})}s(Ae,"_length");function Ve(e,t){return new ci({check:"string_format",format:"regex",...x(t),pattern:e})}s(Ve,"_regex");function Ye(e){return new ui({check:"string_format",format:"lowercase",...x(e)})}s(Ye,"_lowercase");function Ke(e){return new li({check:"string_format",format:"uppercase",...x(e)})}s(Ke,"_uppercase");function Ge(e,t){return new pi({check:"string_format",format:"includes",...x(t),includes:e})}s(Ge,"_includes");function He(e,t){return new fi({check:"string_format",format:"starts_with",...x(t),prefix:e})}s(He,"_startsWith");function Xe(e,t){return new di({check:"string_format",format:"ends_with",...x(t),suffix:e})}s(Xe,"_endsWith");function cr(e,t,o){return new mi({check:"property",property:e,schema:t,...x(o)})}s(cr,"_property");function Qe(e,t){return new hi({check:"mime_type",mime:e,...x(t)})}s(Qe,"_mime");function re(e){return new gi({check:"overwrite",tx:e})}s(re,"_overwrite");function et(e){return re(t=>t.normalize(e))}s(et,"_normalize");function tt(){return re(e=>e.trim())}s(tt,"_trim");function ot(){return re(e=>e.toLowerCase())}s(ot,"_toLowerCase");function rt(){return re(e=>e.toUpperCase())}s(rt,"_toUpperCase");function nt(){return re(e=>pn(e))}s(nt,"_slugify");function aa(e,t,o){return new e({type:"array",element:t,...x(o)})}s(aa,"_array");function v0(e,t,o){return new e({type:"union",options:t,...x(o)})}s(v0,"_union");function b0(e,t,o){return new e({type:"union",options:t,inclusive:!1,...x(o)})}s(b0,"_xor");function y0(e,t,o,r){return new e({type:"union",options:o,discriminator:t,...x(r)})}s(y0,"_discriminatedUnion");function _0(e,t,o){return new e({type:"intersection",left:t,right:o})}s(_0,"_intersection");function w0(e,t,o,r){let n=o instanceof $,i=n?r:o,a=n?o:null;return new e({type:"tuple",items:t,rest:a,...x(i)})}s(w0,"_tuple");function k0(e,t,o,r){return new e({type:"record",keyType:t,valueType:o,...x(r)})}s(k0,"_record");function z0(e,t,o,r){return new e({type:"map",keyType:t,valueType:o,...x(r)})}s(z0,"_map");function $0(e,t,o){return new e({type:"set",valueType:t,...x(o)})}s($0,"_set");function S0(e,t,o){let r=Array.isArray(t)?Object.fromEntries(t.map(n=>[n,n])):t;return new e({type:"enum",entries:r,...x(o)})}s(S0,"_enum");function P0(e,t,o){return new e({type:"enum",entries:t,...x(o)})}s(P0,"_nativeEnum");function Z0(e,t,o){return new e({type:"literal",values:Array.isArray(t)?t:[t],...x(o)})}s(Z0,"_literal");function ca(e,t){return new e({type:"file",...x(t)})}s(ca,"_file");function I0(e,t){return new e({type:"transform",transform:t})}s(I0,"_transform");function E0(e,t){return new e({type:"optional",innerType:t})}s(E0,"_optional");function T0(e,t){return new e({type:"nullable",innerType:t})}s(T0,"_nullable");function O0(e,t,o){return new e({type:"default",innerType:t,get defaultValue(){return typeof o=="function"?o():dn(o)}})}s(O0,"_default");function A0(e,t,o){return new e({type:"nonoptional",innerType:t,...x(o)})}s(A0,"_nonoptional");function C0(e,t){return new e({type:"success",innerType:t})}s(C0,"_success");function j0(e,t,o){return new e({type:"catch",innerType:t,catchValue:typeof o=="function"?o:()=>o})}s(j0,"_catch");function R0(e,t,o){return new e({type:"pipe",in:t,out:o})}s(R0,"_pipe");function N0(e,t){return new e({type:"readonly",innerType:t})}s(N0,"_readonly");function L0(e,t,o){return new e({type:"template_literal",parts:t,...x(o)})}s(L0,"_templateLiteral");function D0(e,t){return new e({type:"lazy",getter:t})}s(D0,"_lazy");function M0(e,t){return new e({type:"promise",innerType:t})}s(M0,"_promise");function ua(e,t,o){let r=x(o);return r.abort??(r.abort=!0),new e({type:"custom",check:"custom",fn:t,...r})}s(ua,"_custom");function la(e,t,o){return new e({type:"custom",check:"custom",fn:t,...x(o)})}s(la,"_refine");function pa(e,t){let o=il(r=>(r.addIssue=n=>{if(typeof n=="string")r.issues.push(Fe(n,r.value,o._zod.def));else{let i=n;i.fatal&&(i.continue=!1),i.code??(i.code="custom"),i.input??(i.input=r.value),i.inst??(i.inst=o),i.continue??(i.continue=!o._zod.def.abort),r.issues.push(Fe(i))}},e(r.value,r)),t);return o}s(pa,"_superRefine");function il(e,t){let o=new C({check:"custom",...x(t)});return o._zod.check=e,o}s(il,"_check");function fa(e){let t=new C({check:"describe"});return t._zod.onattach=[o=>{let r=F.get(o)??{};F.add(o,{...r,description:e})}],t._zod.check=()=>{},t}s(fa,"describe");function da(e){let t=new C({check:"meta"});return t._zod.onattach=[o=>{let r=F.get(o)??{};F.add(o,{...r,...e})}],t._zod.check=()=>{},t}s(da,"meta");function ma(e,t){let o=x(t),r=o.truthy??["true","1","yes","on","y","enabled"],n=o.falsy??["false","0","no","off","n","disabled"];o.case!=="sensitive"&&(r=r.map(y=>typeof y=="string"?y.toLowerCase():y),n=n.map(y=>typeof y=="string"?y.toLowerCase():y));let i=new Set(r),a=new Set(n),c=e.Codec??jt,u=e.Boolean??At,l=e.String??Ee,d=new l({type:"string",error:o.error}),g=new u({type:"boolean",error:o.error}),v=new c({type:"pipe",in:d,out:g,transform:s(((y,P)=>{let X=y;return o.case!=="sensitive"&&(X=X.toLowerCase()),i.has(X)?!0:a.has(X)?!1:(P.issues.push({code:"invalid_value",expected:"stringbool",values:[...i,...a],input:P.value,inst:v,continue:!1}),{})}),"transform"),reverseTransform:s(((y,P)=>y===!0?r[0]||"true":n[0]||"false"),"reverseTransform"),error:o.error});return v}s(ma,"_stringbool");function it(e,t,o,r={}){let n=x(r),i={...x(r),check:"string_format",type:"string",format:t,fn:typeof o=="function"?o:c=>o.test(c),...n};return o instanceof RegExp&&(i.pattern=o),new e(i)}s(it,"_stringFormat");function ze(e){let t=e?.target??"draft-2020-12";return t==="draft-4"&&(t="draft-04"),t==="draft-7"&&(t="draft-07"),{processors:e.processors??{},metadataRegistry:e?.metadata??F,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,cycles:e?.cycles??"ref",reused:e?.reused??"inline",external:e?.external??void 0}}s(ze,"initializeContext");function E(e,t,o={path:[],schemaPath:[]}){var r;let n=e._zod.def,i=t.seen.get(e);if(i)return i.count++,o.schemaPath.includes(e)&&(i.cycle=o.path),i.schema;let a={schema:{},count:1,cycle:void 0,path:o.path};t.seen.set(e,a);let c=e._zod.toJSONSchema?.();if(c)a.schema=c;else{let d={...o,schemaPath:[...o.schemaPath,e],path:o.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,a.schema,d);else{let v=a.schema,y=t.processors[n.type];if(!y)throw new Error(`[toJSONSchema]: Non-representable type encountered: ${n.type}`);y(e,t,v,d)}let g=e._zod.parent;g&&(a.ref||(a.ref=g),E(g,t,d),t.seen.get(g).isParent=!0)}let u=t.metadataRegistry.get(e);return u&&Object.assign(a.schema,u),t.io==="input"&&J(e)&&(delete a.schema.examples,delete a.schema.default),t.io==="input"&&"_prefault"in a.schema&&((r=a.schema).default??(r.default=a.schema._prefault)),delete a.schema._prefault,t.seen.get(e).schema}s(E,"process");function $e(e,t){let o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");let r=new Map;for(let a of e.seen.entries()){let c=e.metadataRegistry.get(a[0])?.id;if(c){let u=r.get(c);if(u&&u!==a[0])throw new Error(`Duplicate schema id "${c}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);r.set(c,a[0])}}let n=s(a=>{let c=e.target==="draft-2020-12"?"$defs":"definitions";if(e.external){let g=e.external.registry.get(a[0])?.id,v=e.external.uri??(P=>P);if(g)return{ref:v(g)};let y=a[1].defId??a[1].schema.id??`schema${e.counter++}`;return a[1].defId=y,{defId:y,ref:`${v("__shared")}#/${c}/${y}`}}if(a[1]===o)return{ref:"#"};let l=`#/${c}/`,d=a[1].schema.id??`__schema${e.counter++}`;return{defId:d,ref:l+d}},"makeURI"),i=s(a=>{if(a[1].schema.$ref)return;let c=a[1],{ref:u,defId:l}=n(a);c.def={...c.schema},l&&(c.defId=l);let d=c.schema;for(let g in d)delete d[g];d.$ref=u},"extractToDef");if(e.cycles==="throw")for(let a of e.seen.entries()){let c=a[1];if(c.cycle)throw new Error(`Cycle detected: #/${c.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let a of e.seen.entries()){let c=a[1];if(t===a[0]){i(a);continue}if(e.external){let l=e.external.registry.get(a[0])?.id;if(t!==a[0]&&l){i(a);continue}}if(e.metadataRegistry.get(a[0])?.id){i(a);continue}if(c.cycle){i(a);continue}if(c.count>1&&e.reused==="ref"){i(a);continue}}}s($e,"extractDefs");function Se(e,t){let o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");let r=s(c=>{let u=e.seen.get(c);if(u.ref===null)return;let l=u.def??u.schema,d={...l},g=u.ref;if(u.ref=null,g){r(g);let y=e.seen.get(g),P=y.schema;if(P.$ref&&(e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0")?(l.allOf=l.allOf??[],l.allOf.push(P)):Object.assign(l,P),Object.assign(l,d),c._zod.parent===g)for(let L in l)L==="$ref"||L==="allOf"||L in d||delete l[L];if(P.$ref&&y.def)for(let L in l)L==="$ref"||L==="allOf"||L in y.def&&JSON.stringify(l[L])===JSON.stringify(y.def[L])&&delete l[L]}let v=c._zod.parent;if(v&&v!==g){r(v);let y=e.seen.get(v);if(y?.schema.$ref&&(l.$ref=y.schema.$ref,y.def))for(let P in l)P==="$ref"||P==="allOf"||P in y.def&&JSON.stringify(l[P])===JSON.stringify(y.def[P])&&delete l[P]}e.override({zodSchema:c,jsonSchema:l,path:u.path??[]})},"flattenRef");for(let c of[...e.seen.entries()].reverse())r(c[0]);let n={};if(e.target==="draft-2020-12"?n.$schema="https://json-schema.org/draft/2020-12/schema":e.target==="draft-07"?n.$schema="http://json-schema.org/draft-07/schema#":e.target==="draft-04"?n.$schema="http://json-schema.org/draft-04/schema#":e.target,e.external?.uri){let c=e.external.registry.get(t)?.id;if(!c)throw new Error("Schema is missing an `id` property");n.$id=e.external.uri(c)}Object.assign(n,o.def??o.schema);let i=e.metadataRegistry.get(t)?.id;i!==void 0&&n.id===i&&delete n.id;let a=e.external?.defs??{};for(let c of e.seen.entries()){let u=c[1];u.def&&u.defId&&(u.def.id===u.defId&&delete u.def.id,a[u.defId]=u.def)}e.external||Object.keys(a).length>0&&(e.target==="draft-2020-12"?n.$defs=a:n.definitions=a);try{let c=JSON.parse(JSON.stringify(n));return Object.defineProperty(c,"~standard",{value:{...t["~standard"],jsonSchema:{input:st(t,"input",e.processors),output:st(t,"output",e.processors)}},enumerable:!1,writable:!1}),c}catch{throw new Error("Error converting schema to JSON.")}}s(Se,"finalize");function J(e,t){let o=t??{seen:new Set};if(o.seen.has(e))return!1;o.seen.add(e);let r=e._zod.def;if(r.type==="transform")return!0;if(r.type==="array")return J(r.element,o);if(r.type==="set")return J(r.valueType,o);if(r.type==="lazy")return J(r.getter(),o);if(r.type==="promise"||r.type==="optional"||r.type==="nonoptional"||r.type==="nullable"||r.type==="readonly"||r.type==="default"||r.type==="prefault")return J(r.innerType,o);if(r.type==="intersection")return J(r.left,o)||J(r.right,o);if(r.type==="record"||r.type==="map")return J(r.keyType,o)||J(r.valueType,o);if(r.type==="pipe")return e._zod.traits.has("$ZodCodec")?!0:J(r.in,o)||J(r.out,o);if(r.type==="object"){for(let n in r.shape)if(J(r.shape[n],o))return!0;return!1}if(r.type==="union"){for(let n of r.options)if(J(n,o))return!0;return!1}if(r.type==="tuple"){for(let n of r.items)if(J(n,o))return!0;return!!(r.rest&&J(r.rest,o))}return!1}s(J,"isTransforming");var ha=s((e,t={})=>o=>{let r=ze({...o,processors:t});return E(e,r),$e(r,e),Se(r,e)},"createToJSONSchemaMethod"),st=s((e,t,o={})=>r=>{let{libraryOptions:n,target:i}=r??{},a=ze({...n??{},target:i,io:t,processors:o});return E(e,a),$e(a,e),Se(a,e)},"createStandardJSONSchemaMethod");var F0={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},ga=s((e,t,o,r)=>{let n=o;n.type="string";let{minimum:i,maximum:a,format:c,patterns:u,contentEncoding:l}=e._zod.bag;if(typeof i=="number"&&(n.minLength=i),typeof a=="number"&&(n.maxLength=a),c&&(n.format=F0[c]??c,n.format===""&&delete n.format,c==="time"&&delete n.format),l&&(n.contentEncoding=l),u&&u.size>0){let d=[...u];d.length===1?n.pattern=d[0].source:d.length>1&&(n.allOf=[...d.map(g=>({...t.target==="draft-07"||t.target==="draft-04"||t.target==="openapi-3.0"?{type:"string"}:{},pattern:g.source}))])}},"stringProcessor"),xa=s((e,t,o,r)=>{let n=o,{minimum:i,maximum:a,format:c,multipleOf:u,exclusiveMaximum:l,exclusiveMinimum:d}=e._zod.bag;typeof c=="string"&&c.includes("int")?n.type="integer":n.type="number";let g=typeof d=="number"&&d>=(i??Number.NEGATIVE_INFINITY),v=typeof l=="number"&&l<=(a??Number.POSITIVE_INFINITY),y=t.target==="draft-04"||t.target==="openapi-3.0";g?y?(n.minimum=d,n.exclusiveMinimum=!0):n.exclusiveMinimum=d:typeof i=="number"&&(n.minimum=i),v?y?(n.maximum=l,n.exclusiveMaximum=!0):n.exclusiveMaximum=l:typeof a=="number"&&(n.maximum=a),typeof u=="number"&&(n.multipleOf=u)},"numberProcessor"),va=s((e,t,o,r)=>{o.type="boolean"},"booleanProcessor"),ba=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("BigInt cannot be represented in JSON Schema")},"bigintProcessor"),ya=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Symbols cannot be represented in JSON Schema")},"symbolProcessor"),_a=s((e,t,o,r)=>{t.target==="openapi-3.0"?(o.type="string",o.nullable=!0,o.enum=[null]):o.type="null"},"nullProcessor"),wa=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Undefined cannot be represented in JSON Schema")},"undefinedProcessor"),ka=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Void cannot be represented in JSON Schema")},"voidProcessor"),za=s((e,t,o,r)=>{o.not={}},"neverProcessor"),$a=s((e,t,o,r)=>{},"anyProcessor"),Sa=s((e,t,o,r)=>{},"unknownProcessor"),Pa=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Date cannot be represented in JSON Schema")},"dateProcessor"),Za=s((e,t,o,r)=>{let n=e._zod.def,i=wt(n.entries);i.every(a=>typeof a=="number")&&(o.type="number"),i.every(a=>typeof a=="string")&&(o.type="string"),o.enum=i},"enumProcessor"),Ia=s((e,t,o,r)=>{let n=e._zod.def,i=[];for(let a of n.values)if(a===void 0){if(t.unrepresentable==="throw")throw new Error("Literal `undefined` cannot be represented in JSON Schema")}else if(typeof a=="bigint"){if(t.unrepresentable==="throw")throw new Error("BigInt literals cannot be represented in JSON Schema");i.push(Number(a))}else i.push(a);if(i.length!==0)if(i.length===1){let a=i[0];o.type=a===null?"null":typeof a,t.target==="draft-04"||t.target==="openapi-3.0"?o.enum=[a]:o.const=a}else i.every(a=>typeof a=="number")&&(o.type="number"),i.every(a=>typeof a=="string")&&(o.type="string"),i.every(a=>typeof a=="boolean")&&(o.type="boolean"),i.every(a=>a===null)&&(o.type="null"),o.enum=i},"literalProcessor"),Ea=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("NaN cannot be represented in JSON Schema")},"nanProcessor"),Ta=s((e,t,o,r)=>{let n=o,i=e._zod.pattern;if(!i)throw new Error("Pattern not found in template literal");n.type="string",n.pattern=i.source},"templateLiteralProcessor"),Oa=s((e,t,o,r)=>{let n=o,i={type:"string",format:"binary",contentEncoding:"binary"},{minimum:a,maximum:c,mime:u}=e._zod.bag;a!==void 0&&(i.minLength=a),c!==void 0&&(i.maxLength=c),u?u.length===1?(i.contentMediaType=u[0],Object.assign(n,i)):(Object.assign(n,i),n.anyOf=u.map(l=>({contentMediaType:l}))):Object.assign(n,i)},"fileProcessor"),Aa=s((e,t,o,r)=>{o.type="boolean"},"successProcessor"),Ca=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Custom types cannot be represented in JSON Schema")},"customProcessor"),ja=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Function types cannot be represented in JSON Schema")},"functionProcessor"),Ra=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Transforms cannot be represented in JSON Schema")},"transformProcessor"),Na=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Map cannot be represented in JSON Schema")},"mapProcessor"),La=s((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Set cannot be represented in JSON Schema")},"setProcessor"),Da=s((e,t,o,r)=>{let n=o,i=e._zod.def,{minimum:a,maximum:c}=e._zod.bag;typeof a=="number"&&(n.minItems=a),typeof c=="number"&&(n.maxItems=c),n.type="array",n.items=E(i.element,t,{...r,path:[...r.path,"items"]})},"arrayProcessor"),Ma=s((e,t,o,r)=>{let n=o,i=e._zod.def;n.type="object",n.properties={};let a=i.shape;for(let l in a)n.properties[l]=E(a[l],t,{...r,path:[...r.path,"properties",l]});let c=new Set(Object.keys(a)),u=new Set([...c].filter(l=>{let d=i.shape[l]._zod;return t.io==="input"?d.optin===void 0:d.optout===void 0}));u.size>0&&(n.required=Array.from(u)),i.catchall?._zod.def.type==="never"?n.additionalProperties=!1:i.catchall?i.catchall&&(n.additionalProperties=E(i.catchall,t,{...r,path:[...r.path,"additionalProperties"]})):t.io==="output"&&(n.additionalProperties=!1)},"objectProcessor"),lr=s((e,t,o,r)=>{let n=e._zod.def,i=n.inclusive===!1,a=n.options.map((c,u)=>E(c,t,{...r,path:[...r.path,i?"oneOf":"anyOf",u]}));i?o.oneOf=a:o.anyOf=a},"unionProcessor"),Fa=s((e,t,o,r)=>{let n=e._zod.def,i=E(n.left,t,{...r,path:[...r.path,"allOf",0]}),a=E(n.right,t,{...r,path:[...r.path,"allOf",1]}),c=s(l=>"allOf"in l&&Object.keys(l).length===1,"isSimpleIntersection"),u=[...c(i)?i.allOf:[i],...c(a)?a.allOf:[a]];o.allOf=u},"intersectionProcessor"),Ua=s((e,t,o,r)=>{let n=o,i=e._zod.def;n.type="array";let a=t.target==="draft-2020-12"?"prefixItems":"items",c=t.target==="draft-2020-12"||t.target==="openapi-3.0"?"items":"additionalItems",u=i.items.map((v,y)=>E(v,t,{...r,path:[...r.path,a,y]})),l=i.rest?E(i.rest,t,{...r,path:[...r.path,c,...t.target==="openapi-3.0"?[i.items.length]:[]]}):null;t.target==="draft-2020-12"?(n.prefixItems=u,l&&(n.items=l)):t.target==="openapi-3.0"?(n.items={anyOf:u},l&&n.items.anyOf.push(l),n.minItems=u.length,l||(n.maxItems=u.length)):(n.items=u,l&&(n.additionalItems=l));let{minimum:d,maximum:g}=e._zod.bag;typeof d=="number"&&(n.minItems=d),typeof g=="number"&&(n.maxItems=g)},"tupleProcessor"),Ba=s((e,t,o,r)=>{let n=o,i=e._zod.def;n.type="object";let a=i.keyType,u=a._zod.bag?.patterns;if(i.mode==="loose"&&u&&u.size>0){let d=E(i.valueType,t,{...r,path:[...r.path,"patternProperties","*"]});n.patternProperties={};for(let g of u)n.patternProperties[g.source]=d}else(t.target==="draft-07"||t.target==="draft-2020-12")&&(n.propertyNames=E(i.keyType,t,{...r,path:[...r.path,"propertyNames"]})),n.additionalProperties=E(i.valueType,t,{...r,path:[...r.path,"additionalProperties"]});let l=a._zod.values;if(l){let d=[...l].filter(g=>typeof g=="string"||typeof g=="number");d.length>0&&(n.required=d)}},"recordProcessor"),qa=s((e,t,o,r)=>{let n=e._zod.def,i=E(n.innerType,t,r),a=t.seen.get(e);t.target==="openapi-3.0"?(a.ref=n.innerType,o.nullable=!0):o.anyOf=[i,{type:"null"}]},"nullableProcessor"),Wa=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType},"nonoptionalProcessor"),Ja=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType,o.default=JSON.parse(JSON.stringify(n.defaultValue))},"defaultProcessor"),Va=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType,t.io==="input"&&(o._prefault=JSON.parse(JSON.stringify(n.defaultValue)))},"prefaultProcessor"),Ya=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType;let a;try{a=n.catchValue(void 0)}catch{throw new Error("Dynamic catch values are not supported in JSON Schema")}o.default=a},"catchProcessor"),Ka=s((e,t,o,r)=>{let n=e._zod.def,i=n.in._zod.traits.has("$ZodTransform"),a=t.io==="input"?i?n.out:n.in:n.out;E(a,t,r);let c=t.seen.get(e);c.ref=a},"pipeProcessor"),Ga=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType,o.readOnly=!0},"readonlyProcessor"),Ha=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType},"promiseProcessor"),pr=s((e,t,o,r)=>{let n=e._zod.def;E(n.innerType,t,r);let i=t.seen.get(e);i.ref=n.innerType},"optionalProcessor"),Xa=s((e,t,o,r)=>{let n=e._zod.innerType;E(n,t,r);let i=t.seen.get(e);i.ref=n},"lazyProcessor"),ur={string:ga,number:xa,boolean:va,bigint:ba,symbol:ya,null:_a,undefined:wa,void:ka,never:za,any:$a,unknown:Sa,date:Pa,enum:Za,literal:Ia,nan:Ea,template_literal:Ta,file:Oa,success:Aa,custom:Ca,function:ja,transform:Ra,map:Na,set:La,array:Da,object:Ma,union:lr,intersection:Fa,tuple:Ua,record:Ba,nullable:qa,nonoptional:Wa,default:Ja,prefault:Va,catch:Ya,pipe:Ka,readonly:Ga,promise:Ha,optional:pr,lazy:Xa};function fr(e,t){if("_idmap"in e){let r=e,n=ze({...t,processors:ur}),i={};for(let u of r._idmap.entries()){let[l,d]=u;E(d,n)}let a={},c={registry:r,uri:t?.uri,defs:i};n.external=c;for(let u of r._idmap.entries()){let[l,d]=u;$e(n,d),a[l]=Se(n,d)}if(Object.keys(i).length>0){let u=n.target==="draft-2020-12"?"$defs":"definitions";a.__shared={[u]:i}}return{schemas:a}}let o=ze({...t,processors:ur});return E(e,o),$e(o,e),Se(o,e)}s(fr,"toJSONSchema");var dr=class{static{s(this,"JSONSchemaGenerator")}get metadataRegistry(){return this.ctx.metadataRegistry}get target(){return this.ctx.target}get unrepresentable(){return this.ctx.unrepresentable}get override(){return this.ctx.override}get io(){return this.ctx.io}get counter(){return this.ctx.counter}set counter(t){this.ctx.counter=t}get seen(){return this.ctx.seen}constructor(t){let o=t?.target??"draft-2020-12";o==="draft-4"&&(o="draft-04"),o==="draft-7"&&(o="draft-07"),this.ctx=ze({processors:ur,target:o,...t?.metadata&&{metadata:t.metadata},...t?.unrepresentable&&{unrepresentable:t.unrepresentable},...t?.override&&{override:t.override},...t?.io&&{io:t.io}})}process(t,o={path:[],schemaPath:[]}){return E(t,this.ctx,o)}emit(t,o){o&&(o.cycles&&(this.ctx.cycles=o.cycles),o.reused&&(this.ctx.reused=o.reused),o.external&&(this.ctx.external=o.external)),$e(this.ctx,t);let r=Se(this.ctx,t),{"~standard":n,...i}=r;return i}};var sl={};var Mt={};le(Mt,{ZodAny:()=>wc,ZodArray:()=>Sc,ZodBase64:()=>Cr,ZodBase64URL:()=>jr,ZodBigInt:()=>mt,ZodBigIntFormat:()=>Lr,ZodBoolean:()=>dt,ZodCIDRv4:()=>Or,ZodCIDRv6:()=>Ar,ZodCUID:()=>$r,ZodCUID2:()=>Sr,ZodCatch:()=>Yc,ZodCodec:()=>Xt,ZodCustom:()=>Qt,ZodCustomStringFormat:()=>pt,ZodDate:()=>Vt,ZodDefault:()=>Uc,ZodDiscriminatedUnion:()=>Zc,ZodE164:()=>Rr,ZodEmail:()=>wr,ZodEmoji:()=>kr,ZodEnum:()=>ut,ZodExactOptional:()=>Dc,ZodFile:()=>Nc,ZodFunction:()=>nu,ZodGUID:()=>Ut,ZodIPv4:()=>Er,ZodIPv6:()=>Tr,ZodIntersection:()=>Ic,ZodJWT:()=>Nr,ZodKSUID:()=>Ir,ZodLazy:()=>tu,ZodLiteral:()=>Rc,ZodMAC:()=>hc,ZodMap:()=>Cc,ZodNaN:()=>Gc,ZodNanoID:()=>zr,ZodNever:()=>zc,ZodNonOptional:()=>qr,ZodNull:()=>yc,ZodNullable:()=>Fc,ZodNumber:()=>ft,ZodNumberFormat:()=>je,ZodObject:()=>Kt,ZodOptional:()=>Br,ZodPipe:()=>Ht,ZodPrefault:()=>qc,ZodPreprocess:()=>Hc,ZodPromise:()=>ru,ZodReadonly:()=>Xc,ZodRecord:()=>ct,ZodSet:()=>jc,ZodString:()=>lt,ZodStringFormat:()=>A,ZodSuccess:()=>Vc,ZodSymbol:()=>vc,ZodTemplateLiteral:()=>eu,ZodTransform:()=>Lc,ZodTuple:()=>Tc,ZodType:()=>S,ZodULID:()=>Pr,ZodURL:()=>Jt,ZodUUID:()=>ae,ZodUndefined:()=>bc,ZodUnion:()=>Gt,ZodUnknown:()=>kc,ZodVoid:()=>$c,ZodXID:()=>Zr,ZodXor:()=>Pc,_ZodString:()=>_r,_default:()=>Bc,_function:()=>hp,any:()=>Jl,array:()=>Yt,base64:()=>Il,base64url:()=>El,bigint:()=>Fl,boolean:()=>xc,catch:()=>Kc,check:()=>gp,cidrv4:()=>Pl,cidrv6:()=>Zl,codec:()=>pp,cuid:()=>bl,cuid2:()=>yl,custom:()=>xp,date:()=>Yl,describe:()=>vp,discriminatedUnion:()=>ep,e164:()=>Tl,email:()=>ul,emoji:()=>xl,enum:()=>Fr,exactOptional:()=>Mc,file:()=>ap,float32:()=>Nl,float64:()=>Ll,function:()=>hp,guid:()=>ll,hash:()=>Rl,hex:()=>jl,hostname:()=>Cl,httpUrl:()=>gl,instanceof:()=>yp,int:()=>br,int32:()=>Dl,int64:()=>Ul,intersection:()=>Ec,invertCodec:()=>fp,ipv4:()=>zl,ipv6:()=>Sl,json:()=>wp,jwt:()=>Ol,keyof:()=>Kl,ksuid:()=>kl,lazy:()=>ou,literal:()=>sp,looseObject:()=>Xl,looseRecord:()=>op,mac:()=>$l,map:()=>rp,meta:()=>bp,nan:()=>lp,nanoid:()=>vl,nativeEnum:()=>ip,never:()=>Dr,nonoptional:()=>Jc,null:()=>_c,nullable:()=>qt,nullish:()=>cp,number:()=>gc,object:()=>Gl,optional:()=>Bt,partialRecord:()=>tp,pipe:()=>yr,prefault:()=>Wc,preprocess:()=>kp,promise:()=>mp,readonly:()=>Qc,record:()=>Ac,refine:()=>iu,set:()=>np,strictObject:()=>Hl,string:()=>Ft,stringFormat:()=>Al,stringbool:()=>_p,success:()=>up,superRefine:()=>su,symbol:()=>ql,templateLiteral:()=>dp,transform:()=>Ur,tuple:()=>Oc,uint32:()=>Ml,uint64:()=>Bl,ulid:()=>_l,undefined:()=>Wl,union:()=>Mr,unknown:()=>Ce,url:()=>hl,uuid:()=>pl,uuidv4:()=>fl,uuidv6:()=>dl,uuidv7:()=>ml,void:()=>Vl,xid:()=>wl,xor:()=>Ql});var mr={};le(mr,{endsWith:()=>Xe,gt:()=>ie,gte:()=>W,includes:()=>Ge,length:()=>Ae,lowercase:()=>Ye,lt:()=>ne,lte:()=>H,maxLength:()=>Oe,maxSize:()=>ke,mime:()=>Qe,minLength:()=>fe,minSize:()=>se,multipleOf:()=>we,negative:()=>ir,nonnegative:()=>ar,nonpositive:()=>sr,normalize:()=>et,overwrite:()=>re,positive:()=>nr,property:()=>cr,regex:()=>Ve,size:()=>Te,slugify:()=>nt,startsWith:()=>He,toLowerCase:()=>ot,toUpperCase:()=>rt,trim:()=>tt,uppercase:()=>Ke});var at={};le(at,{ZodISODate:()=>gr,ZodISODateTime:()=>hr,ZodISODuration:()=>vr,ZodISOTime:()=>xr,date:()=>ec,datetime:()=>Qa,duration:()=>oc,time:()=>tc});var hr=p("ZodISODateTime",(e,t)=>{Ei.init(e,t),A.init(e,t)});function Qa(e){return Cs(hr,e)}s(Qa,"datetime");var gr=p("ZodISODate",(e,t)=>{Ti.init(e,t),A.init(e,t)});function ec(e){return js(gr,e)}s(ec,"date");var xr=p("ZodISOTime",(e,t)=>{Oi.init(e,t),A.init(e,t)});function tc(e){return Rs(xr,e)}s(tc,"time");var vr=p("ZodISODuration",(e,t)=>{Ai.init(e,t),A.init(e,t)});function oc(e){return Ns(vr,e)}s(oc,"duration");var al=s((e,t)=>{Pt.init(e,t),e.name="ZodError",Object.defineProperties(e,{format:{value:s(o=>It(e,o),"value")},flatten:{value:s(o=>Zt(e,o),"value")},addIssue:{value:s(o=>{e.issues.push(o),e.message=JSON.stringify(e.issues,De,2)},"value")},addIssues:{value:s(o=>{e.issues.push(...o),e.message=JSON.stringify(e.issues,De,2)},"value")},isEmpty:{get(){return e.issues.length===0}}})},"initializer"),B0=p("ZodError",al),K=p("ZodError",al,{Parent:Error});var rc=Ue(K),nc=Be(K),ic=qe(K),sc=We(K),ac=ho(K),cc=go(K),uc=xo(K),lc=vo(K),pc=bo(K),fc=yo(K),dc=_o(K),mc=wo(K);var cl=new WeakMap;function Wt(e,t,o){let r=Object.getPrototypeOf(e),n=cl.get(r);if(n||(n=new Set,cl.set(r,n)),!n.has(t)){n.add(t);for(let i in o){let a=o[i];Object.defineProperty(r,i,{configurable:!0,enumerable:!1,get(){let c=a.bind(this);return Object.defineProperty(this,i,{configurable:!0,writable:!0,enumerable:!0,value:c}),c},set(c){Object.defineProperty(this,i,{configurable:!0,writable:!0,enumerable:!0,value:c})}})}}}s(Wt,"_installLazyMethods");var S=p("ZodType",(e,t)=>($.init(e,t),Object.assign(e["~standard"],{jsonSchema:{input:st(e,"input"),output:st(e,"output")}}),e.toJSONSchema=ha(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(o,r)=>rc(e,o,r,{callee:e.parse}),e.safeParse=(o,r)=>ic(e,o,r),e.parseAsync=async(o,r)=>nc(e,o,r,{callee:e.parseAsync}),e.safeParseAsync=async(o,r)=>sc(e,o,r),e.spa=e.safeParseAsync,e.encode=(o,r)=>ac(e,o,r),e.decode=(o,r)=>cc(e,o,r),e.encodeAsync=async(o,r)=>uc(e,o,r),e.decodeAsync=async(o,r)=>lc(e,o,r),e.safeEncode=(o,r)=>pc(e,o,r),e.safeDecode=(o,r)=>fc(e,o,r),e.safeEncodeAsync=async(o,r)=>dc(e,o,r),e.safeDecodeAsync=async(o,r)=>mc(e,o,r),Wt(e,"ZodType",{check(...o){let r=this.def;return this.clone(z.mergeDefs(r,{checks:[...r.checks??[],...o.map(n=>typeof n=="function"?{_zod:{check:n,def:{check:"custom"},onattach:[]}}:n)]}),{parent:!0})},with(...o){return this.check(...o)},clone(o,r){return B(this,o,r)},brand(){return this},register(o,r){return o.add(this,r),this},refine(o,r){return this.check(iu(o,r))},superRefine(o,r){return this.check(su(o,r))},overwrite(o){return this.check(re(o))},optional(){return Bt(this)},exactOptional(){return Mc(this)},nullable(){return qt(this)},nullish(){return Bt(qt(this))},nonoptional(o){return Jc(this,o)},array(){return Yt(this)},or(o){return Mr([this,o])},and(o){return Ec(this,o)},transform(o){return yr(this,Ur(o))},default(o){return Bc(this,o)},prefault(o){return Wc(this,o)},catch(o){return Kc(this,o)},pipe(o){return yr(this,o)},readonly(){return Qc(this)},describe(o){let r=this.clone();return F.add(r,{description:o}),r},meta(...o){if(o.length===0)return F.get(this);let r=this.clone();return F.add(r,o[0]),r},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(o){return o(this)}}),Object.defineProperty(e,"description",{get(){return F.get(e)?.description},configurable:!0}),e)),_r=p("_ZodString",(e,t)=>{Ee.init(e,t),S.init(e,t),e._zod.processJSONSchema=(r,n,i)=>ga(e,r,n,i);let o=e._zod.bag;e.format=o.format??null,e.minLength=o.minimum??null,e.maxLength=o.maximum??null,Wt(e,"_ZodString",{regex(...r){return this.check(Ve(...r))},includes(...r){return this.check(Ge(...r))},startsWith(...r){return this.check(He(...r))},endsWith(...r){return this.check(Xe(...r))},min(...r){return this.check(fe(...r))},max(...r){return this.check(Oe(...r))},length(...r){return this.check(Ae(...r))},nonempty(...r){return this.check(fe(1,...r))},lowercase(r){return this.check(Ye(r))},uppercase(r){return this.check(Ke(r))},trim(){return this.check(tt())},normalize(...r){return this.check(et(...r))},toLowerCase(){return this.check(ot())},toUpperCase(){return this.check(rt())},slugify(){return this.check(nt())}})}),lt=p("ZodString",(e,t)=>{Ee.init(e,t),_r.init(e,t),e.email=o=>e.check(Lo(wr,o)),e.url=o=>e.check(Dt(Jt,o)),e.jwt=o=>e.check(rr(Nr,o)),e.emoji=o=>e.check(Bo(kr,o)),e.guid=o=>e.check(Lt(Ut,o)),e.uuid=o=>e.check(Do(ae,o)),e.uuidv4=o=>e.check(Mo(ae,o)),e.uuidv6=o=>e.check(Fo(ae,o)),e.uuidv7=o=>e.check(Uo(ae,o)),e.nanoid=o=>e.check(qo(zr,o)),e.guid=o=>e.check(Lt(Ut,o)),e.cuid=o=>e.check(Wo($r,o)),e.cuid2=o=>e.check(Jo(Sr,o)),e.ulid=o=>e.check(Vo(Pr,o)),e.base64=o=>e.check(er(Cr,o)),e.base64url=o=>e.check(tr(jr,o)),e.xid=o=>e.check(Yo(Zr,o)),e.ksuid=o=>e.check(Ko(Ir,o)),e.ipv4=o=>e.check(Go(Er,o)),e.ipv6=o=>e.check(Ho(Tr,o)),e.cidrv4=o=>e.check(Xo(Or,o)),e.cidrv6=o=>e.check(Qo(Ar,o)),e.e164=o=>e.check(or(Rr,o)),e.datetime=o=>e.check(Qa(o)),e.date=o=>e.check(ec(o)),e.time=o=>e.check(tc(o)),e.duration=o=>e.check(oc(o))});function Ft(e){return Es(lt,e)}s(Ft,"string");var A=p("ZodStringFormat",(e,t)=>{O.init(e,t),_r.init(e,t)}),wr=p("ZodEmail",(e,t)=>{_i.init(e,t),A.init(e,t)});function ul(e){return Lo(wr,e)}s(ul,"email");var Ut=p("ZodGUID",(e,t)=>{bi.init(e,t),A.init(e,t)});function ll(e){return Lt(Ut,e)}s(ll,"guid");var ae=p("ZodUUID",(e,t)=>{yi.init(e,t),A.init(e,t)});function pl(e){return Do(ae,e)}s(pl,"uuid");function fl(e){return Mo(ae,e)}s(fl,"uuidv4");function dl(e){return Fo(ae,e)}s(dl,"uuidv6");function ml(e){return Uo(ae,e)}s(ml,"uuidv7");var Jt=p("ZodURL",(e,t)=>{wi.init(e,t),A.init(e,t)});function hl(e){return Dt(Jt,e)}s(hl,"url");function gl(e){return Dt(Jt,{protocol:G.httpProtocol,hostname:G.domain,...z.normalizeParams(e)})}s(gl,"httpUrl");var kr=p("ZodEmoji",(e,t)=>{ki.init(e,t),A.init(e,t)});function xl(e){return Bo(kr,e)}s(xl,"emoji");var zr=p("ZodNanoID",(e,t)=>{zi.init(e,t),A.init(e,t)});function vl(e){return qo(zr,e)}s(vl,"nanoid");var $r=p("ZodCUID",(e,t)=>{$i.init(e,t),A.init(e,t)});function bl(e){return Wo($r,e)}s(bl,"cuid");var Sr=p("ZodCUID2",(e,t)=>{Si.init(e,t),A.init(e,t)});function yl(e){return Jo(Sr,e)}s(yl,"cuid2");var Pr=p("ZodULID",(e,t)=>{Pi.init(e,t),A.init(e,t)});function _l(e){return Vo(Pr,e)}s(_l,"ulid");var Zr=p("ZodXID",(e,t)=>{Zi.init(e,t),A.init(e,t)});function wl(e){return Yo(Zr,e)}s(wl,"xid");var Ir=p("ZodKSUID",(e,t)=>{Ii.init(e,t),A.init(e,t)});function kl(e){return Ko(Ir,e)}s(kl,"ksuid");var Er=p("ZodIPv4",(e,t)=>{Ci.init(e,t),A.init(e,t)});function zl(e){return Go(Er,e)}s(zl,"ipv4");var hc=p("ZodMAC",(e,t)=>{Ri.init(e,t),A.init(e,t)});function $l(e){return Os(hc,e)}s($l,"mac");var Tr=p("ZodIPv6",(e,t)=>{ji.init(e,t),A.init(e,t)});function Sl(e){return Ho(Tr,e)}s(Sl,"ipv6");var Or=p("ZodCIDRv4",(e,t)=>{Ni.init(e,t),A.init(e,t)});function Pl(e){return Xo(Or,e)}s(Pl,"cidrv4");var Ar=p("ZodCIDRv6",(e,t)=>{Li.init(e,t),A.init(e,t)});function Zl(e){return Qo(Ar,e)}s(Zl,"cidrv6");var Cr=p("ZodBase64",(e,t)=>{Mi.init(e,t),A.init(e,t)});function Il(e){return er(Cr,e)}s(Il,"base64");var jr=p("ZodBase64URL",(e,t)=>{Fi.init(e,t),A.init(e,t)});function El(e){return tr(jr,e)}s(El,"base64url");var Rr=p("ZodE164",(e,t)=>{Ui.init(e,t),A.init(e,t)});function Tl(e){return or(Rr,e)}s(Tl,"e164");var Nr=p("ZodJWT",(e,t)=>{Bi.init(e,t),A.init(e,t)});function Ol(e){return rr(Nr,e)}s(Ol,"jwt");var pt=p("ZodCustomStringFormat",(e,t)=>{qi.init(e,t),A.init(e,t)});function Al(e,t,o={}){return it(pt,e,t,o)}s(Al,"stringFormat");function Cl(e){return it(pt,"hostname",G.hostname,e)}s(Cl,"hostname");function jl(e){return it(pt,"hex",G.hex,e)}s(jl,"hex");function Rl(e,t){let o=t?.enc??"hex",r=`${e}_${o}`,n=G[r];if(!n)throw new Error(`Unrecognized hash format: ${r}`);return it(pt,r,n,t)}s(Rl,"hash");var ft=p("ZodNumber",(e,t)=>{To.init(e,t),S.init(e,t),e._zod.processJSONSchema=(r,n,i)=>xa(e,r,n,i),Wt(e,"ZodNumber",{gt(r,n){return this.check(ie(r,n))},gte(r,n){return this.check(W(r,n))},min(r,n){return this.check(W(r,n))},lt(r,n){return this.check(ne(r,n))},lte(r,n){return this.check(H(r,n))},max(r,n){return this.check(H(r,n))},int(r){return this.check(br(r))},safe(r){return this.check(br(r))},positive(r){return this.check(ie(0,r))},nonnegative(r){return this.check(W(0,r))},negative(r){return this.check(ne(0,r))},nonpositive(r){return this.check(H(0,r))},multipleOf(r,n){return this.check(we(r,n))},step(r,n){return this.check(we(r,n))},finite(){return this}});let o=e._zod.bag;e.minValue=Math.max(o.minimum??Number.NEGATIVE_INFINITY,o.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,e.maxValue=Math.min(o.maximum??Number.POSITIVE_INFINITY,o.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,e.isInt=(o.format??"").includes("int")||Number.isSafeInteger(o.multipleOf??.5),e.isFinite=!0,e.format=o.format??null});function gc(e){return Ls(ft,e)}s(gc,"number");var je=p("ZodNumberFormat",(e,t)=>{Wi.init(e,t),ft.init(e,t)});function br(e){return Ms(je,e)}s(br,"int");function Nl(e){return Fs(je,e)}s(Nl,"float32");function Ll(e){return Us(je,e)}s(Ll,"float64");function Dl(e){return Bs(je,e)}s(Dl,"int32");function Ml(e){return qs(je,e)}s(Ml,"uint32");var dt=p("ZodBoolean",(e,t)=>{At.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>va(e,o,r,n)});function xc(e){return Ws(dt,e)}s(xc,"boolean");var mt=p("ZodBigInt",(e,t)=>{Oo.init(e,t),S.init(e,t),e._zod.processJSONSchema=(r,n,i)=>ba(e,r,n,i),e.gte=(r,n)=>e.check(W(r,n)),e.min=(r,n)=>e.check(W(r,n)),e.gt=(r,n)=>e.check(ie(r,n)),e.gte=(r,n)=>e.check(W(r,n)),e.min=(r,n)=>e.check(W(r,n)),e.lt=(r,n)=>e.check(ne(r,n)),e.lte=(r,n)=>e.check(H(r,n)),e.max=(r,n)=>e.check(H(r,n)),e.positive=r=>e.check(ie(BigInt(0),r)),e.negative=r=>e.check(ne(BigInt(0),r)),e.nonpositive=r=>e.check(H(BigInt(0),r)),e.nonnegative=r=>e.check(W(BigInt(0),r)),e.multipleOf=(r,n)=>e.check(we(r,n));let o=e._zod.bag;e.minValue=o.minimum??null,e.maxValue=o.maximum??null,e.format=o.format??null});function Fl(e){return Vs(mt,e)}s(Fl,"bigint");var Lr=p("ZodBigIntFormat",(e,t)=>{Ji.init(e,t),mt.init(e,t)});function Ul(e){return Ks(Lr,e)}s(Ul,"int64");function Bl(e){return Gs(Lr,e)}s(Bl,"uint64");var vc=p("ZodSymbol",(e,t)=>{Vi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ya(e,o,r,n)});function ql(e){return Hs(vc,e)}s(ql,"symbol");var bc=p("ZodUndefined",(e,t)=>{Yi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>wa(e,o,r,n)});function Wl(e){return Xs(bc,e)}s(Wl,"_undefined");var yc=p("ZodNull",(e,t)=>{Ki.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>_a(e,o,r,n)});function _c(e){return Qs(yc,e)}s(_c,"_null");var wc=p("ZodAny",(e,t)=>{Gi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>$a(e,o,r,n)});function Jl(){return ea(wc)}s(Jl,"any");var kc=p("ZodUnknown",(e,t)=>{Hi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Sa(e,o,r,n)});function Ce(){return ta(kc)}s(Ce,"unknown");var zc=p("ZodNever",(e,t)=>{Xi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>za(e,o,r,n)});function Dr(e){return oa(zc,e)}s(Dr,"never");var $c=p("ZodVoid",(e,t)=>{Qi.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ka(e,o,r,n)});function Vl(e){return ra($c,e)}s(Vl,"_void");var Vt=p("ZodDate",(e,t)=>{es.init(e,t),S.init(e,t),e._zod.processJSONSchema=(r,n,i)=>Pa(e,r,n,i),e.min=(r,n)=>e.check(W(r,n)),e.max=(r,n)=>e.check(H(r,n));let o=e._zod.bag;e.minDate=o.minimum?new Date(o.minimum):null,e.maxDate=o.maximum?new Date(o.maximum):null});function Yl(e){return na(Vt,e)}s(Yl,"date");var Sc=p("ZodArray",(e,t)=>{ts.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Da(e,o,r,n),e.element=t.element,Wt(e,"ZodArray",{min(o,r){return this.check(fe(o,r))},nonempty(o){return this.check(fe(1,o))},max(o,r){return this.check(Oe(o,r))},length(o,r){return this.check(Ae(o,r))},unwrap(){return this.element}})});function Yt(e,t){return aa(Sc,e,t)}s(Yt,"array");function Kl(e){let t=e._zod.def.shape;return Fr(Object.keys(t))}s(Kl,"keyof");var Kt=p("ZodObject",(e,t)=>{os.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ma(e,o,r,n),z.defineLazy(e,"shape",()=>t.shape),Wt(e,"ZodObject",{keyof(){return Fr(Object.keys(this._zod.def.shape))},catchall(o){return this.clone({...this._zod.def,catchall:o})},passthrough(){return this.clone({...this._zod.def,catchall:Ce()})},loose(){return this.clone({...this._zod.def,catchall:Ce()})},strict(){return this.clone({...this._zod.def,catchall:Dr()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(o){return z.extend(this,o)},safeExtend(o){return z.safeExtend(this,o)},merge(o){return z.merge(this,o)},pick(o){return z.pick(this,o)},omit(o){return z.omit(this,o)},partial(...o){return z.partial(Br,this,o[0])},required(...o){return z.required(qr,this,o[0])}})});function Gl(e,t){let o={type:"object",shape:e??{},...z.normalizeParams(t)};return new Kt(o)}s(Gl,"object");function Hl(e,t){return new Kt({type:"object",shape:e,catchall:Dr(),...z.normalizeParams(t)})}s(Hl,"strictObject");function Xl(e,t){return new Kt({type:"object",shape:e,catchall:Ce(),...z.normalizeParams(t)})}s(Xl,"looseObject");var Gt=p("ZodUnion",(e,t)=>{Ct.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>lr(e,o,r,n),e.options=t.options});function Mr(e,t){return new Gt({type:"union",options:e,...z.normalizeParams(t)})}s(Mr,"union");var Pc=p("ZodXor",(e,t)=>{Gt.init(e,t),rs.init(e,t),e._zod.processJSONSchema=(o,r,n)=>lr(e,o,r,n),e.options=t.options});function Ql(e,t){return new Pc({type:"union",options:e,inclusive:!1,...z.normalizeParams(t)})}s(Ql,"xor");var Zc=p("ZodDiscriminatedUnion",(e,t)=>{Gt.init(e,t),ns.init(e,t)});function ep(e,t,o){return new Zc({type:"union",options:t,discriminator:e,...z.normalizeParams(o)})}s(ep,"discriminatedUnion");var Ic=p("ZodIntersection",(e,t)=>{is.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Fa(e,o,r,n)});function Ec(e,t){return new Ic({type:"intersection",left:e,right:t})}s(Ec,"intersection");var Tc=p("ZodTuple",(e,t)=>{Ao.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ua(e,o,r,n),e.rest=o=>e.clone({...e._zod.def,rest:o})});function Oc(e,t,o){let r=t instanceof $,n=r?o:t,i=r?t:null;return new Tc({type:"tuple",items:e,rest:i,...z.normalizeParams(n)})}s(Oc,"tuple");var ct=p("ZodRecord",(e,t)=>{ss.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ba(e,o,r,n),e.keyType=t.keyType,e.valueType=t.valueType});function Ac(e,t,o){return!t||!t._zod?new ct({type:"record",keyType:Ft(),valueType:e,...z.normalizeParams(t)}):new ct({type:"record",keyType:e,valueType:t,...z.normalizeParams(o)})}s(Ac,"record");function tp(e,t,o){let r=B(e);return r._zod.values=void 0,new ct({type:"record",keyType:r,valueType:t,...z.normalizeParams(o)})}s(tp,"partialRecord");function op(e,t,o){return new ct({type:"record",keyType:e,valueType:t,mode:"loose",...z.normalizeParams(o)})}s(op,"looseRecord");var Cc=p("ZodMap",(e,t)=>{as.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Na(e,o,r,n),e.keyType=t.keyType,e.valueType=t.valueType,e.min=(...o)=>e.check(se(...o)),e.nonempty=o=>e.check(se(1,o)),e.max=(...o)=>e.check(ke(...o)),e.size=(...o)=>e.check(Te(...o))});function rp(e,t,o){return new Cc({type:"map",keyType:e,valueType:t,...z.normalizeParams(o)})}s(rp,"map");var jc=p("ZodSet",(e,t)=>{cs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>La(e,o,r,n),e.min=(...o)=>e.check(se(...o)),e.nonempty=o=>e.check(se(1,o)),e.max=(...o)=>e.check(ke(...o)),e.size=(...o)=>e.check(Te(...o))});function np(e,t){return new jc({type:"set",valueType:e,...z.normalizeParams(t)})}s(np,"set");var ut=p("ZodEnum",(e,t)=>{us.init(e,t),S.init(e,t),e._zod.processJSONSchema=(r,n,i)=>Za(e,r,n,i),e.enum=t.entries,e.options=Object.values(t.entries);let o=new Set(Object.keys(t.entries));e.extract=(r,n)=>{let i={};for(let a of r)if(o.has(a))i[a]=t.entries[a];else throw new Error(`Key ${a} not found in enum`);return new ut({...t,checks:[],...z.normalizeParams(n),entries:i})},e.exclude=(r,n)=>{let i={...t.entries};for(let a of r)if(o.has(a))delete i[a];else throw new Error(`Key ${a} not found in enum`);return new ut({...t,checks:[],...z.normalizeParams(n),entries:i})}});function Fr(e,t){let o=Array.isArray(e)?Object.fromEntries(e.map(r=>[r,r])):e;return new ut({type:"enum",entries:o,...z.normalizeParams(t)})}s(Fr,"_enum");function ip(e,t){return new ut({type:"enum",entries:e,...z.normalizeParams(t)})}s(ip,"nativeEnum");var Rc=p("ZodLiteral",(e,t)=>{ls.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ia(e,o,r,n),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function sp(e,t){return new Rc({type:"literal",values:Array.isArray(e)?e:[e],...z.normalizeParams(t)})}s(sp,"literal");var Nc=p("ZodFile",(e,t)=>{ps.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Oa(e,o,r,n),e.min=(o,r)=>e.check(se(o,r)),e.max=(o,r)=>e.check(ke(o,r)),e.mime=(o,r)=>e.check(Qe(Array.isArray(o)?o:[o],r))});function ap(e){return ca(Nc,e)}s(ap,"file");var Lc=p("ZodTransform",(e,t)=>{fs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ra(e,o,r,n),e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new xe(e.constructor.name);o.addIssue=i=>{if(typeof i=="string")o.issues.push(z.issue(i,o.value,t));else{let a=i;a.fatal&&(a.continue=!1),a.code??(a.code="custom"),a.input??(a.input=o.value),a.inst??(a.inst=e),o.issues.push(z.issue(a))}};let n=t.transform(o.value,o);return n instanceof Promise?n.then(i=>(o.value=i,o.fallback=!0,o)):(o.value=n,o.fallback=!0,o)}});function Ur(e){return new Lc({type:"transform",transform:e})}s(Ur,"transform");var Br=p("ZodOptional",(e,t)=>{Co.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>pr(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Bt(e){return new Br({type:"optional",innerType:e})}s(Bt,"optional");var Dc=p("ZodExactOptional",(e,t)=>{ds.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>pr(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Mc(e){return new Dc({type:"optional",innerType:e})}s(Mc,"exactOptional");var Fc=p("ZodNullable",(e,t)=>{ms.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>qa(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function qt(e){return new Fc({type:"nullable",innerType:e})}s(qt,"nullable");function cp(e){return Bt(qt(e))}s(cp,"nullish");var Uc=p("ZodDefault",(e,t)=>{hs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ja(e,o,r,n),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function Bc(e,t){return new Uc({type:"default",innerType:e,get defaultValue(){return typeof t=="function"?t():z.shallowClone(t)}})}s(Bc,"_default");var qc=p("ZodPrefault",(e,t)=>{gs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Va(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Wc(e,t){return new qc({type:"prefault",innerType:e,get defaultValue(){return typeof t=="function"?t():z.shallowClone(t)}})}s(Wc,"prefault");var qr=p("ZodNonOptional",(e,t)=>{xs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Wa(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Jc(e,t){return new qr({type:"nonoptional",innerType:e,...z.normalizeParams(t)})}s(Jc,"nonoptional");var Vc=p("ZodSuccess",(e,t)=>{vs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Aa(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function up(e){return new Vc({type:"success",innerType:e})}s(up,"success");var Yc=p("ZodCatch",(e,t)=>{bs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ya(e,o,r,n),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function Kc(e,t){return new Yc({type:"catch",innerType:e,catchValue:typeof t=="function"?t:()=>t})}s(Kc,"_catch");var Gc=p("ZodNaN",(e,t)=>{ys.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ea(e,o,r,n)});function lp(e){return sa(Gc,e)}s(lp,"nan");var Ht=p("ZodPipe",(e,t)=>{jo.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ka(e,o,r,n),e.in=t.in,e.out=t.out});function yr(e,t){return new Ht({type:"pipe",in:e,out:t})}s(yr,"pipe");var Xt=p("ZodCodec",(e,t)=>{Ht.init(e,t),jt.init(e,t)});function pp(e,t,o){return new Xt({type:"pipe",in:e,out:t,transform:o.decode,reverseTransform:o.encode})}s(pp,"codec");function fp(e){let t=e._zod.def;return new Xt({type:"pipe",in:t.out,out:t.in,transform:t.reverseTransform,reverseTransform:t.transform})}s(fp,"invertCodec");var Hc=p("ZodPreprocess",(e,t)=>{Ht.init(e,t),_s.init(e,t)}),Xc=p("ZodReadonly",(e,t)=>{ws.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ga(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Qc(e){return new Xc({type:"readonly",innerType:e})}s(Qc,"readonly");var eu=p("ZodTemplateLiteral",(e,t)=>{ks.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ta(e,o,r,n)});function dp(e,t){return new eu({type:"template_literal",parts:e,...z.normalizeParams(t)})}s(dp,"templateLiteral");var tu=p("ZodLazy",(e,t)=>{Ss.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Xa(e,o,r,n),e.unwrap=()=>e._zod.def.getter()});function ou(e){return new tu({type:"lazy",getter:e})}s(ou,"lazy");var ru=p("ZodPromise",(e,t)=>{$s.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ha(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function mp(e){return new ru({type:"promise",innerType:e})}s(mp,"promise");var nu=p("ZodFunction",(e,t)=>{zs.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ja(e,o,r,n)});function hp(e){return new nu({type:"function",input:Array.isArray(e?.input)?Oc(e?.input):e?.input??Yt(Ce()),output:e?.output??Ce()})}s(hp,"_function");var Qt=p("ZodCustom",(e,t)=>{Ps.init(e,t),S.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ca(e,o,r,n)});function gp(e){let t=new C({check:"custom"});return t._zod.check=e,t}s(gp,"check");function xp(e,t){return ua(Qt,e??(()=>!0),t)}s(xp,"custom");function iu(e,t={}){return la(Qt,e,t)}s(iu,"refine");function su(e,t){return pa(e,t)}s(su,"superRefine");var vp=fa,bp=da;function yp(e,t={}){let o=new Qt({type:"custom",check:"custom",fn:s(r=>r instanceof e,"fn"),abort:!0,...z.normalizeParams(t)});return o._zod.bag.Class=e,o._zod.check=r=>{r.value instanceof e||r.issues.push({code:"invalid_type",expected:e.name,input:r.value,inst:o,path:[...o._zod.def.path??[]]})},o}s(yp,"_instanceof");var _p=s((...e)=>ma({Codec:Xt,Boolean:dt,String:lt},...e),"stringbool");function wp(e){let t=ou(()=>Mr([Ft(e),gc(),xc(),_c(),Yt(t),Ac(Ft(),t)]));return t}s(wp,"json");function kp(e,t){return new Hc({type:"pipe",in:Ur(e),out:t})}s(kp,"preprocess");var W0={invalid_type:"invalid_type",too_big:"too_big",too_small:"too_small",invalid_format:"invalid_format",not_multiple_of:"not_multiple_of",unrecognized_keys:"unrecognized_keys",invalid_union:"invalid_union",invalid_key:"invalid_key",invalid_element:"invalid_element",invalid_value:"invalid_value",custom:"custom"};function J0(e){N({customError:e})}s(J0,"setErrorMap");function V0(){return N().customError}s(V0,"getErrorMap");var au;au||(au={});var _={...Mt,...mr,iso:at},Y0=new Set(["$schema","$ref","$defs","definitions","$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor","type","enum","const","anyOf","oneOf","allOf","not","properties","required","additionalProperties","patternProperties","propertyNames","minProperties","maxProperties","items","prefixItems","additionalItems","minItems","maxItems","uniqueItems","contains","minContains","maxContains","minLength","maxLength","pattern","format","minimum","maximum","exclusiveMinimum","exclusiveMaximum","multipleOf","description","default","contentEncoding","contentMediaType","contentSchema","unevaluatedItems","unevaluatedProperties","if","then","else","dependentSchemas","dependentRequired","nullable","readOnly"]);function K0(e,t){let o=e.$schema;return o==="https://json-schema.org/draft/2020-12/schema"?"draft-2020-12":o==="http://json-schema.org/draft-07/schema#"?"draft-7":o==="http://json-schema.org/draft-04/schema#"?"draft-4":t??"draft-2020-12"}s(K0,"detectVersion");function G0(e,t){if(!e.startsWith("#"))throw new Error("External $ref is not supported, only local refs (#/...) are allowed");let o=e.slice(1).split("/").filter(Boolean);if(o.length===0)return t.rootSchema;let r=t.version==="draft-2020-12"?"$defs":"definitions";if(o[0]===r){let n=o[1];if(!n||!t.defs[n])throw new Error(`Reference not found: ${e}`);return t.defs[n]}throw new Error(`Reference not found: ${e}`)}s(G0,"resolveRef");function zp(e,t){if(e.not!==void 0){if(typeof e.not=="object"&&Object.keys(e.not).length===0)return _.never();throw new Error("not is not supported in Zod (except { not: {} } for never)")}if(e.unevaluatedItems!==void 0)throw new Error("unevaluatedItems is not supported");if(e.unevaluatedProperties!==void 0)throw new Error("unevaluatedProperties is not supported");if(e.if!==void 0||e.then!==void 0||e.else!==void 0)throw new Error("Conditional schemas (if/then/else) are not supported");if(e.dependentSchemas!==void 0||e.dependentRequired!==void 0)throw new Error("dependentSchemas and dependentRequired are not supported");if(e.$ref){let n=e.$ref;if(t.refs.has(n))return t.refs.get(n);if(t.processing.has(n))return _.lazy(()=>{if(!t.refs.has(n))throw new Error(`Circular reference not resolved: ${n}`);return t.refs.get(n)});t.processing.add(n);let i=G0(n,t),a=U(i,t);return t.refs.set(n,a),t.processing.delete(n),a}if(e.enum!==void 0){let n=e.enum;if(t.version==="openapi-3.0"&&e.nullable===!0&&n.length===1&&n[0]===null)return _.null();if(n.length===0)return _.never();if(n.length===1)return _.literal(n[0]);if(n.every(a=>typeof a=="string"))return _.enum(n);let i=n.map(a=>_.literal(a));return i.length<2?i[0]:_.union([i[0],i[1],...i.slice(2)])}if(e.const!==void 0)return _.literal(e.const);let o=e.type;if(Array.isArray(o)){let n=o.map(i=>{let a={...e,type:i};return zp(a,t)});return n.length===0?_.never():n.length===1?n[0]:_.union(n)}if(!o)return _.any();let r;switch(o){case"string":{let n=_.string();if(e.format){let i=e.format;i==="email"?n=n.check(_.email()):i==="uri"||i==="uri-reference"?n=n.check(_.url()):i==="uuid"||i==="guid"?n=n.check(_.uuid()):i==="date-time"?n=n.check(_.iso.datetime()):i==="date"?n=n.check(_.iso.date()):i==="time"?n=n.check(_.iso.time()):i==="duration"?n=n.check(_.iso.duration()):i==="ipv4"?n=n.check(_.ipv4()):i==="ipv6"?n=n.check(_.ipv6()):i==="mac"?n=n.check(_.mac()):i==="cidr"?n=n.check(_.cidrv4()):i==="cidr-v6"?n=n.check(_.cidrv6()):i==="base64"?n=n.check(_.base64()):i==="base64url"?n=n.check(_.base64url()):i==="e164"?n=n.check(_.e164()):i==="jwt"?n=n.check(_.jwt()):i==="emoji"?n=n.check(_.emoji()):i==="nanoid"?n=n.check(_.nanoid()):i==="cuid"?n=n.check(_.cuid()):i==="cuid2"?n=n.check(_.cuid2()):i==="ulid"?n=n.check(_.ulid()):i==="xid"?n=n.check(_.xid()):i==="ksuid"&&(n=n.check(_.ksuid()))}typeof e.minLength=="number"&&(n=n.min(e.minLength)),typeof e.maxLength=="number"&&(n=n.max(e.maxLength)),e.pattern&&(n=n.regex(new RegExp(e.pattern))),r=n;break}case"number":case"integer":{let n=o==="integer"?_.number().int():_.number();typeof e.minimum=="number"&&(n=n.min(e.minimum)),typeof e.maximum=="number"&&(n=n.max(e.maximum)),typeof e.exclusiveMinimum=="number"?n=n.gt(e.exclusiveMinimum):e.exclusiveMinimum===!0&&typeof e.minimum=="number"&&(n=n.gt(e.minimum)),typeof e.exclusiveMaximum=="number"?n=n.lt(e.exclusiveMaximum):e.exclusiveMaximum===!0&&typeof e.maximum=="number"&&(n=n.lt(e.maximum)),typeof e.multipleOf=="number"&&(n=n.multipleOf(e.multipleOf)),r=n;break}case"boolean":{r=_.boolean();break}case"null":{r=_.null();break}case"object":{let n={},i=e.properties||{},a=new Set(e.required||[]);for(let[u,l]of Object.entries(i)){let d=U(l,t);n[u]=a.has(u)?d:d.optional()}if(e.propertyNames){let u=U(e.propertyNames,t),l=e.additionalProperties&&typeof e.additionalProperties=="object"?U(e.additionalProperties,t):_.any();if(Object.keys(n).length===0){r=_.record(u,l);break}let d=_.object(n).passthrough(),g=_.looseRecord(u,l);r=_.intersection(d,g);break}if(e.patternProperties){let u=e.patternProperties,l=Object.keys(u),d=[];for(let v of l){let y=U(u[v],t),P=_.string().regex(new RegExp(v));d.push(_.looseRecord(P,y))}let g=[];if(Object.keys(n).length>0&&g.push(_.object(n).passthrough()),g.push(...d),g.length===0)r=_.object({}).passthrough();else if(g.length===1)r=g[0];else{let v=_.intersection(g[0],g[1]);for(let y=2;y<g.length;y++)v=_.intersection(v,g[y]);r=v}break}let c=_.object(n);e.additionalProperties===!1?r=c.strict():typeof e.additionalProperties=="object"?r=c.catchall(U(e.additionalProperties,t)):r=c.passthrough();break}case"array":{let n=e.prefixItems,i=e.items;if(n&&Array.isArray(n)){let a=n.map(u=>U(u,t)),c=i&&typeof i=="object"&&!Array.isArray(i)?U(i,t):void 0;c?r=_.tuple(a).rest(c):r=_.tuple(a),typeof e.minItems=="number"&&(r=r.check(_.minLength(e.minItems))),typeof e.maxItems=="number"&&(r=r.check(_.maxLength(e.maxItems)))}else if(Array.isArray(i)){let a=i.map(u=>U(u,t)),c=e.additionalItems&&typeof e.additionalItems=="object"?U(e.additionalItems,t):void 0;c?r=_.tuple(a).rest(c):r=_.tuple(a),typeof e.minItems=="number"&&(r=r.check(_.minLength(e.minItems))),typeof e.maxItems=="number"&&(r=r.check(_.maxLength(e.maxItems)))}else if(i!==void 0){let a=U(i,t),c=_.array(a);typeof e.minItems=="number"&&(c=c.min(e.minItems)),typeof e.maxItems=="number"&&(c=c.max(e.maxItems)),r=c}else r=_.array(_.any());break}default:throw new Error(`Unsupported type: ${o}`)}return r}s(zp,"convertBaseSchema");function U(e,t){if(typeof e=="boolean")return e?_.any():_.never();let o=zp(e,t),r=e.type||e.enum!==void 0||e.const!==void 0;if(e.anyOf&&Array.isArray(e.anyOf)){let c=e.anyOf.map(l=>U(l,t)),u=_.union(c);o=r?_.intersection(o,u):u}if(e.oneOf&&Array.isArray(e.oneOf)){let c=e.oneOf.map(l=>U(l,t)),u=_.xor(c);o=r?_.intersection(o,u):u}if(e.allOf&&Array.isArray(e.allOf))if(e.allOf.length===0)o=r?o:_.any();else{let c=r?o:U(e.allOf[0],t),u=r?0:1;for(let l=u;l<e.allOf.length;l++)c=_.intersection(c,U(e.allOf[l],t));o=c}e.nullable===!0&&t.version==="openapi-3.0"&&(o=_.nullable(o)),e.readOnly===!0&&(o=_.readonly(o)),e.default!==void 0&&(o=o.default(e.default));let n={},i=["$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor"];for(let c of i)c in e&&(n[c]=e[c]);let a=["contentEncoding","contentMediaType","contentSchema"];for(let c of a)c in e&&(n[c]=e[c]);for(let c of Object.keys(e))Y0.has(c)||(n[c]=e[c]);return Object.keys(n).length>0&&t.registry.add(o,n),e.description&&(o=o.describe(e.description)),o}s(U,"convertSchema");function $p(e,t){if(typeof e=="boolean")return e?_.any():_.never();let o;try{o=JSON.parse(JSON.stringify(e))}catch{throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas")}let r=K0(o,t?.defaultTarget),n=o.$defs||o.definitions||{},i={version:r,defs:n,refs:new Map,processing:new Set,rootSchema:o,registry:t?.registry??F};return U(o,i)}s($p,"fromJSONSchema");var cu={};le(cu,{bigint:()=>ed,boolean:()=>Q0,date:()=>td,number:()=>X0,string:()=>H0});function H0(e){return Ts(lt,e)}s(H0,"string");function X0(e){return Ds(ft,e)}s(X0,"number");function Q0(e){return Js(dt,e)}s(Q0,"boolean");function ed(e){return Ys(mt,e)}s(ed,"bigint");function td(e){return ia(Vt,e)}s(td,"date");N(Rt());var Wr=/^[a-z][a-z0-9_]{0,23}$/,Pp=/^#[0-9a-fA-F]{6}$/,Sp=s(e=>`${Math.round(e*100)}%`,"percent"),ce=[{key:"showThrough",name:"visibility",aliases:["showthrough"],label:"Visibility",hint:"How much of the scene shows through bb",describe:"how much of the scene shows through bb",min:0,max:.8,step:.01,default:.77,format:Sp},{key:"speed",name:"motion",aliases:["speed"],label:"Motion",hint:"How fast the scene moves",describe:"animation speed",min:0,max:4,step:.05,default:.75,format:s(e=>`${e.toFixed(1)}\xD7`,"format")},{key:"glass",name:"glass",aliases:[],label:"Glass opacity",hint:"How solid the glass behind text is; lower lets more of the scene through",describe:"opacity of the frosted glass that keeps text readable over the scene; it is always on and can only be lowered from its default",min:.2,max:.6,step:.01,default:.6,format:Sp}];function Zp(e,t){return Math.min(e.max,Math.max(e.min,t))}s(Zp,"clampToSpec");var Jr={enabled:!0,...Object.fromEntries(ce.map(e=>[e.key,e.default]))};var Ip=`Scenes are GLSL ES 3.00 fragment bodies. Define:

  vec3 scene(vec2 uv, vec2 p)

uv is 0..1 screen space (y up); p is aspect-corrected and centered (y spans -0.5..0.5). Return an RGB color; it is clamped to 0..1.

Uniforms:
  vec2  u_resolution        drawing-buffer pixels
  float u_time              seconds, scaled by the user's speed control
  vec3  u_palette[4]        the scene palette, sRGB 0..1
  vec3  u_canvas, u_ink     bb's current theme background and text colors
  float u_dark              1.0 in dark mode
  int   u_agentCount        live agents (max 16)
  vec4  u_agents[16]     xy = uv position, z = state (0 working, 1 waiting for the user), w = presence 0..1 (fades in/out)
  int   u_rippleCount       active ripples (max 12)
  vec4  u_ripples[12]   xy = uv origin, z = age in seconds, w = kind (0 turn finished, 1 error, 2 agent started)
  float u_activity          smoothed 0..1 overall busyness
  vec2  u_pointer           cursor in uv space
  float p_<id>              one float per declared param, driven by the user's sliders

Helpers: hash21(vec2), noise(vec2), fbm(vec2), toP(vec2 uv) -> p space, pal(float t) cycles the palette, ramp(float t) blends the palette 0..1 without wrapping.
Loop over agents with: for (int i = 0; i < 16; i++) { if (i >= u_agentCount) break; ... }. Ripples fade out on their own; they live about 4 seconds.
bb draws its UI over the scene with a translucent veil, so keep shapes soft and contrast gentle where text sits; motion can be lively as long as it stays smooth and continuous.
The veil already matches bb's light or dark theme and the user controls how much shows through, so render the palette at full strength in both modes: do not darken the scene for u_dark or blend most of it into u_canvas. The built-in scenes end with mix(u_canvas, col, p_color), where p_color defaults near 0.9. Keep it cheap: the shader runs every frame behind bb, so a frame must render in a few milliseconds. Use constant, small loop bounds, at most one or two fbm calls per pixel, and never fbm inside the agent or ripple loops.
action=look shows the scene behind bb's real panels and glass, with text drawn as bars, and reports where the open areas are, which words the scene makes hard to read, how far the frame differs from bb's background, how much it moved in a second, and how long a frame takes to render. If it flags the scene as too faint, nearly still, too heavy, hidden behind the panels, or hard to read, fix that.`;function k(e,t,o,r,n,i=.01){return{id:e,label:t,min:o,max:r,step:i,value:n}}s(k,"param");var od=`struct Ink { float v; float carve; float edge; float reg; };

vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
vec2 seaP(vec2 uv){ vec2 q = toP(uv); q.y = -0.44 + uv.y*0.48; return q; }

float crest(float u){ float s = 0.5 + 0.5*sin(u + 0.6*sin(u)); s *= s; return s*s; }
float farY(float x, float T){ return 0.07 + 0.018*p_height*crest(x*15.0 - T*0.9) + 0.006*sin(x*4.0 + T*0.2); }
float midY(float x, float T){ return -0.08 + 0.07*p_height*crest(x*7.0 - T*1.6 + 1.0) + 0.014*sin(x*2.3 - T*0.35); }
float nearY(float x, float T, float W){
  float e = smoothstep(0.3*W, W, abs(x));
  return -0.38 + p_height*(0.14*e + (0.11 + 0.26*e)*crest(x*4.0 - T*1.6 + 2.0));
}
vec2 moonP(float W){ return vec2(W - 0.17, 0.33); }

float claw(vec2 d, float r){
  return max(length(d) - r, -(length(d - r*vec2(0.5, -0.38)) - r*0.8));
}

float clawSdf(vec2 p, int L, float T, float W){
  float fq = L == 1 ? 7.0 : 4.0;
  float ph = L == 1 ? 1.0 : 2.0;
  float cw = L == 1 ? 0.032 : 0.06;
  float sh = T*1.6/fq;
  float c0 = floor((p.x - sh)/cw);
  float s = 1.0;
  for (int i = -1; i <= 1; i++){
    float c = c0 + float(i);
    float h = hash21(vec2(c, float(L)*7.1));
    float cxs = (c + 0.25 + 0.5*h)*cw;
    float g = smoothstep(0.3, 0.9, crest(cxs*fq + ph))*p_foam;
    if (g <= 0.01) continue;
    float cx = cxs + sh;
    float r = cw*(0.42 + 0.3*h)*g;
    float y = L == 1 ? midY(cx, T) : nearY(cx, T, W);
    vec2 d = p - vec2(cx, y + r*0.3);
    s = min(s, claw(d, r));
    s = min(s, claw(d - r*vec2(-0.72, 0.5), r*0.5));
    s = min(s, claw(d - r*vec2(0.95, -0.2), r*0.38));
  }
  return s;
}

float mistSdf(vec2 p, float T, float y0, float th, float sd){
  float dy = abs(p.y - y0 - 0.008*sin(p.x*3.0 + sd));
  float n = noise(vec2(p.x*1.4 - T*0.05 + sd, sd*3.7));
  return dy - th*sqrt(smoothstep(0.4, 0.62, n));
}

Ink subject(vec2 p, float T, float W){
  Ink o;
  float yF = farY(p.x, T);
  float yM = midY(p.x, T);
  float yN = nearY(p.x, T, W);
  float sF = p.y - yF;
  float sM = p.y - yM;
  if (sM > -0.02 && sM < 0.08) sM = min(sM, clawSdf(p, 1, T, W));
  float sN = p.y - yN;
  if (sN > -0.03 && sN < 0.14) sN = min(sN, clawSdf(p, 2, T, W));
  if (sN < 0.0){
    float cf = crest(p.x*4.0 - T*1.6 + 2.0);
    float d = max(yN - p.y, 0.0);
    o.v = 0.2 + 0.62*(0.3 + 0.7*cf)*exp(-d/0.09);
    if (p.y > yN || d < 0.022*smoothstep(0.35, 0.9, cf)*p_foam) o.v = 1.0;
    o.carve = d + 0.0025*sin(p.x*41.0);
    o.edge = -sN;
    o.reg = 3.0;
  } else if (sM < 0.0){
    float cf = crest(p.x*7.0 - T*1.6 + 1.0);
    float d = max(yM - p.y, 0.0);
    o.v = 0.26 + 0.5*(0.3 + 0.7*cf)*exp(-d/0.045);
    if (p.y > yM || d < 0.01*smoothstep(0.35, 0.9, cf)*p_foam) o.v = 1.0;
    o.carve = d*1.3 + 0.002*sin(p.x*47.0 + 1.0);
    o.edge = min(-sM, sN);
    o.reg = 2.0;
  } else if (sF < 0.0){
    float cf = crest(p.x*15.0 - T*0.9);
    float d = yF - p.y;
    o.v = 0.42 + 0.35*(0.3 + 0.7*cf)*exp(-d/0.012);
    if (d < 0.003*smoothstep(0.5, 1.0, cf)*p_foam) o.v = 1.0;
    o.carve = d*1.8 + 0.002*sin(p.x*53.0);
    o.edge = min(-sF, min(sM, sN));
    o.reg = 1.0;
  } else {
    o.v = clamp((p.y - 0.06)/0.44, 0.0, 1.0);
    o.carve = 0.0;
    o.reg = 0.0;
    float md = length(p - moonP(W)) - 0.046;
    if (md < 0.0) o.reg = 0.25;
    float m = min(mistSdf(p, T, 0.31, 0.02, 1.7), mistSdf(p, T, 0.18, 0.015, 5.3));
    if (m < 0.0) o.reg = 0.5;
    o.edge = min(min(sF, min(sM, sN)), abs(m));
    if (m >= 0.0) o.edge = min(o.edge, abs(md));
  }
  return o;
}

float warmField(vec2 p, float W){
  vec2 mp = moonP(W);
  vec2 md = p - mp;
  float w = 0.55*exp(-dot(md, md)/0.012);
  if (p.y < 0.08){
    float dx = p.x - mp.x;
    w += 0.5*exp(-dx*dx/0.0025)*exp(-(0.08 - p.y)/0.25);
  }
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - seaP(a.xy);
    w += a.w*0.9*p_glow*exp(-dot(d, d)/0.002);
    if (d.y < 0.0) w += a.w*0.9*p_glow*exp(-d.x*d.x/(0.0002*(1.0 - d.y*8.0)))*exp(d.y/0.1);
  }
  return w;
}

vec3 ink5(float k){
  vec3 navy = u_palette[0], teal = u_palette[1], paper = u_palette[3];
  if (k < 0.5) return navy;
  if (k < 1.5) return mix(navy, teal, 0.45);
  if (k < 2.5) return teal;
  if (k < 3.5) return mix(teal, paper, 0.55);
  return paper;
}

float stripes(float f, float x, float aa){
  float fr = smoothstep(0.45, 0.97, f);
  float tri = abs(fract(x) - 0.5)*2.0;
  return (1.0 - smoothstep(fr - aa, fr + aa, tri))*smoothstep(0.0, 0.08, fr);
}

vec3 scene(vec2 uv, vec2 p){
  float W = 0.5*u_resolution.x/u_resolution.y;
  float T = u_time*0.35*p_swell;
  vec3 navy = u_palette[0], teal = u_palette[1], lant = u_palette[2], paper = u_palette[3];
  vec3 verm = vec3(0.88, 0.2, 0.12);

  vec2 pw = p;
  vec2 dp = p - toP(u_pointer);
  pw.y -= 0.03*exp(-dot(dp, dp)/0.006);
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float e = length((p - seaP(r.xy))*vec2(1.0, 2.3));
    float rad = 0.01 + r.z*0.11;
    pw.y -= 0.014*exp(-pow((e - rad)/0.02, 2.0))*exp(-r.z*0.7);
  }

  Ink A = subject(pw, T, W);
  Ink K = subject(pw + vec2(0.0024, -0.0017), T, W);
  float F = 90.0*p_carve;
  float aa = min(fwidth(A.carve*F), 0.5);
  float w = warmField(pw + vec2(-0.0018, 0.0012), W);

  vec3 col;
  if (A.reg < 0.1){
    col = mix(mix(navy, teal, 0.5), mix(navy, teal, 0.1), smoothstep(0.0, 0.8, A.v));
    col = mix(col, mix(lant, paper, 0.3), clamp(w, 0.0, 1.0)*0.45);
  } else if (A.reg < 0.4){
    col = mix(mix(paper, lant, 0.35), lant, smoothstep(0.02, 0.05, length(pw - moonP(W)))*0.6);
  } else if (A.reg < 0.7){
    col = mix(mix(teal, paper, 0.28), mix(navy, teal, 0.7), smoothstep(0.02, -0.02, pw.y - (pw.y > 0.25 ? 0.31 : 0.18))*0.6);
  } else {
    float k = clamp(A.v, 0.0, 0.999)*4.0;
    float ki = floor(k);
    col = mix(ink5(ki), ink5(ki + 1.0), stripes(k - ki, A.carve*F, aa));
    col = mix(col, col*0.86 + navy*0.14, smoothstep(0.03, 0.3, A.carve)*step(A.v, 0.99));
    float wk = clamp(w*1.4, 0.0, 1.999)*2.0;
    float wi = floor(wk);
    vec3 w0 = wi < 0.5 ? col : (wi < 1.5 ? mix(col, lant, 0.5) : lant);
    vec3 w1 = wi < 0.5 ? mix(col, lant, 0.5) : (wi < 1.5 ? lant : mix(lant, paper, 0.4));
    col = mix(w0, w1, stripes(wk - wi, A.carve*F + 0.5, aa));
  }

  float yN = nearY(pw.x, T, W);
  vec2 sq = vec2(pw.x - T*0.4, pw.y)/0.016;
  vec2 ci = floor(sq);
  float h = hash21(ci);
  float band = pw.y - yN;
  if (band > -0.06 && band < 0.1 && h < 0.55*p_foam*smoothstep(0.35, 0.85, crest((ci.x + 0.5)*0.064 + 2.0))){
    vec2 o = (vec2(hash21(ci + 3.1), hash21(ci + 7.7)) - 0.5)*0.6;
    float rr = 0.12 + 0.18*hash21(ci + 1.9);
    col = mix(col, paper, smoothstep(rr, rr*0.7, length(fract(sq) - 0.5 - o)));
  }

  float lw = max(0.0018, 2.2/u_resolution.y)*(K.reg > 2.5 ? 1.25 : 1.0);
  col = mix(col, navy*0.45, smoothstep(lw, lw*0.55, K.edge)*0.9);

  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 hd = seaP(a.xy) + vec2(0.0, 0.006*sin(u_time*1.7 + fi*1.3));
    float waiting = step(0.5, a.z);
    float sc = 0.6 + 0.4*a.w;
    vec2 hs = vec2(0.015, 0.02)*sc;
    if (waiting < 0.5){
      float bx = hd.x - p.x;
      if (bx > 0.0 && bx < 0.24){
        float wy = hd.y - hs.y*1.1;
        float l1 = abs(p.y - (wy + bx*0.12));
        float l2 = abs(p.y - (wy - bx*0.22));
        float dash = smoothstep(0.25, 0.4, fract(bx*26.0 - u_time*1.4));
        float wk = (smoothstep(0.0026, 0.0013, l1) + smoothstep(0.0026, 0.0013, l2))*dash*(1.0 - bx/0.24);
        col = mix(col, paper, clamp(wk, 0.0, 1.0)*a.w*0.9);
      }
    } else {
      for (int k = 0; k < 3; k++){
        float ph = fract(u_time*0.45 + float(k)/3.0);
        float e = length((p - hd + vec2(0.0, hs.y))*vec2(1.0, 2.4));
        float rr = 0.024 + ph*0.11;
        col = mix(col, lant, smoothstep(0.0034, 0.0016, abs(e - rr))*(1.0 - ph)*a.w);
      }
    }
    vec2 d = rot2(p - hd, 0.12*sin(u_time*1.3 + fi));
    vec2 q = abs(d - vec2(0.0, hs.y*0.15)) - hs;
    float body = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.002;
    vec2 q2 = abs(d - vec2(0.0, -hs.y*1.05)) - vec2(hs.x*1.4, 0.0035*sc);
    float tray = length(max(q2, 0.0)) + min(max(q2.x, q2.y), 0.0);
    vec2 q3 = abs(d - vec2(0.0, hs.y*1.3)) - vec2(hs.x*1.15, 0.003*sc);
    float cap = length(max(q3, 0.0)) + min(max(q3.x, q3.y), 0.0);
    float sd = min(body, min(tray, cap));
    float pulse = 0.5 + 0.5*sin(u_time*4.0 + fi);
    vec3 bc = mix(lant, mix(paper, lant, 0.25), smoothstep(hs.x*1.2, 0.0, length(d*vec2(1.0, 0.7))));
    bc = mix(bc, mix(lant*0.55, paper, pulse), waiting*0.7);
    bc = mix(bc, navy*0.6, smoothstep(0.0014, 0.0006, abs(d.x))*step(body, 0.0) + step(body, 0.0)*smoothstep(0.0014, 0.0006, abs(d.y - hs.y*0.15)));
    vec3 lc = body < 0.0 ? bc : mix(navy, lant, 0.25);
    col = mix(col, lc, smoothstep(0.0, -0.0015, sd)*a.w);
    col = mix(col, navy*0.45, smoothstep(0.0024, 0.0009, abs(sd))*a.w);
  }

  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float e = length((p - seaP(r.xy))*vec2(1.0, 2.3));
    float rad = 0.01 + r.z*0.11;
    float fade = exp(-r.z*0.6)*smoothstep(0.0, 0.15, r.z);
    bool isErr = abs(r.w - 1.0) < 0.5;
    float wd = isErr ? 1.5 : 1.0;
    float ring = smoothstep(0.004*wd, 0.0022*wd, abs(e - rad)) + 0.7*smoothstep(0.003*wd, 0.0015*wd, abs(e - rad*0.72));
    vec3 ic = isErr ? verm : (r.w > 1.5 ? lant : paper);
    col = mix(col, ic, clamp(ring, 0.0, 1.0)*fade);
    if (isErr) col = mix(col, verm, smoothstep(rad, 0.0, e)*exp(-r.z*0.9)*0.45);
  }

  float gn = noise(vec2(p.x*2.5, p.y*9.0));
  float grain = 0.5 + 0.5*sin(p.y*260.0 + gn*9.0 + noise(vec2(p.x*18.0, p.y*70.0))*1.2);
  float dens = 0.86 + 0.09*grain + 0.07*noise(p*190.0);
  col = mix(paper, col, clamp(dens, 0.0, 1.0));
  float fib = noise(rot2(p, 0.6)*vec2(40.0, 520.0)) + noise(rot2(p, -1.1)*vec2(35.0, 480.0));
  col *= 0.96 + 0.04*fib;
  col += 0.035*smoothstep(1.35, 1.7, fib);

  return mix(u_canvas, col, p_color);
}`,rd=`float farY(float x) { return -0.02 + 0.03 * sin(x * 1.9 + 0.6) + 0.018 * sin(x * 4.3 + 2.0); }

float grass(vec2 p, float cw, float hMin, float hMax, float w, float seed, float wid, float heads, float arch) {
  float y0 = -0.56;
  float cx = floor(p.x / cw);
  float cov = 0.0;
  for (int i = -3; i <= 3; i++) {
    float c = cx + float(i);
    float h1 = hash21(vec2(c, seed));
    float h2 = hash21(vec2(c, seed + 7.3));
    float h3 = hash21(vec2(c, seed + 13.1));
    float x0 = (c + 0.15 + 0.7 * h1) * cw;
    float H = mix(hMin, hMax, h2) * mix(0.55, 1.0, smoothstep(0.15, 0.85, abs(x0)));
    float leaf = step(h2, arch);
    float bend = (clamp(w * (0.6 + 0.8 * h1), -1.8, 1.8) * 0.08 + (h3 - 0.5) * mix(0.1, 0.75, leaf)) * H;
    bend = clamp(bend, -2.8 * cw, 2.8 * cw);
    float k = clamp((p.y - y0) / H, 0.0, 1.0);
    float bx = x0 + bend * k * k;
    float wd = cw * wid * mix(1.0, 1.6, leaf) * (1.0 - 0.8 * k) * sqrt(1.0 + pow(2.0 * bend * k / H, 2.0));
    float blade = smoothstep(wd * 1.2, wd * 0.25, abs(p.x - bx)) * step(p.y, y0 + H);
    vec2 dir = normalize(vec2(2.0 * bend / H, 1.0));
    vec2 hd = p - (vec2(x0 + bend, y0 + H) + dir * 0.014);
    float e = length(vec2(dot(hd, dir) / 0.018, (hd.x * dir.y - hd.y * dir.x) / (cw * wid * 0.7)));
    float head = smoothstep(1.0, 0.75, e) * step(1.0 - heads, h2);
    cov = max(cov, max(blade, head));
  }
  return cov;
}

vec3 meadow(vec2 p, vec2 w, float t) {
  vec3 I = u_palette[0];
  vec3 V = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 paper = vec3(0.97, 0.94, 0.88);
  float fy = farY(p.x);

  float sy = clamp((p.y - fy) / 0.5, 0.0, 1.0);
  vec3 glow = mix(mix(K, paper, 0.4), mix(Y, paper, 0.2), smoothstep(0.14, 0.0, sy) * 0.8);
  vec3 col = mix(glow, mix(K, V, 0.55), smoothstep(0.03, 0.3, sy));
  col = mix(col, mix(I, V, 0.3), smoothstep(0.3, 0.9, sy));
  float cl = noise(vec2(p.x * 1.4 - t * 0.03, p.y * 3.0 + 1.7));
  vec3 cloudC = mix(V, K, smoothstep(0.55, 0.1, sy)) * 0.95;
  col = mix(col, cloudC, smoothstep(0.5, 0.72, cl) * 0.6 * smoothstep(0.08, 0.25, sy));

  float mt = fy - 0.045 + 0.012 * sin(p.x * 2.7 + 1.0);
  float tl = fy + 0.03 * noise(vec2(p.x * 8.0, 1.0)) + 0.015 * noise(vec2(p.x * 21.0, 4.0));
  vec3 tc = mix(I, V, 0.3 + 0.3 * noise(p * vec2(6.0, 9.0)));
  float mist = noise(vec2(p.x * 2.0 - t * 0.04, 7.0));
  tc = mix(tc, mix(V, K, 0.45), smoothstep(mt + 0.05, mt, p.y) * (0.35 + 0.4 * mist));
  col = mix(col, tc, smoothstep(tl + 0.004, tl - 0.004, p.y));

  float md = clamp((mt - p.y) / 0.3, 0.0, 1.0);
  vec3 mc = mix(mix(V, K, 0.35), mix(I, V, 0.5), smoothstep(0.0, 1.0, md));
  mc = mix(mc, mix(K, Y, 0.3), smoothstep(0.045, 0.0, mt - p.y) * 0.55);
  mc = mix(mc, mix(V, K, 0.5), 0.3 * smoothstep(0.45, 0.75, noise(vec2(p.x * 2.5 + 3.0, p.y * 6.0))));
  mc = mix(mc, mix(K, V, 0.25), smoothstep(0.66, 0.8, noise(p * 4.5 + 20.0)) * 0.55);
  col = mix(col, mc, smoothstep(mt + 0.004, mt - 0.004, p.y));

  float r2 = fy - 0.16 + 0.035 * sin(p.x * 1.1 + 0.3) + 0.012 * sin(p.x * 3.3 + 1.0);
  vec3 hc = mix(I, V, 0.4 + 0.2 * noise(vec2(p.x * 3.0, p.y * 5.0 + 2.0)));
  hc = mix(hc, mix(K, V, 0.35), smoothstep(0.04, 0.0, r2 - p.y) * 0.6);
  hc = mix(hc, mix(K, V, 0.4), smoothstep(0.68, 0.82, noise(p * 3.8 + 41.0)) * 0.5);
  col = mix(col, hc, smoothstep(r2 + 0.004, r2 - 0.004, p.y));

  float gm = grass(p, 0.02, 0.14, 0.3, w.y, 3.0, 0.22, 0.2, 0.45);
  col = mix(col, mix(I, V, 0.4) * 0.8, gm * 0.9);
  float gy = -0.47 + 0.035 * noise(vec2(p.x * 5.0, 0.0));
  col = mix(col, mix(I, V, 0.35) * 0.82, smoothstep(gy + 0.02, gy - 0.04, p.y));
  float gn = grass(p, 0.034, 0.2, 0.52, w.x, 11.0, 0.17, 0.22, 0.55);
  col = mix(col, mix(I, V, 0.15) * 0.62, gn);
  return col;
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  vec3 Y = u_palette[2];
  vec3 K = u_palette[3];
  vec3 core = mix(Y, vec3(1.0, 0.99, 0.9), 0.55);
  vec3 red = vec3(0.95, 0.12, 0.08);

  vec2 dp = p - toP(u_pointer);
  float pt = exp(-dot(dp, dp) / 0.01);
  float wt = t * p_wind;
  float w1 = 0.55 * sin(p.x * 2.3 - wt * 1.3 + p.y * 1.5) + 0.9 * (noise(vec2(p.x * 1.2 - wt * 0.8, wt * 0.1)) - 0.45);
  float w2 = 0.5 * sin(p.x * 1.7 - wt * 0.7 + 1.0) + 0.6 * (noise(vec2(p.x * 0.9 - wt * 0.45, 3.0)) - 0.45);
  float gust = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    gust += exp(-pow((dist - r.z * 0.3) * 6.0, 2.0)) * exp(-r.z * 0.6);
  }
  float push = pt * sign(dp.x) * 1.4 + gust * 1.2;
  vec2 w = vec2(w1 + push, w2 + push * 0.6);

  vec2 wv = vec2(fbm(p * 2.4 + vec2(0.0, t * 0.02)), fbm(p * 2.4 + vec2(5.2, 1.3) - vec2(t * 0.016, 0.0)));
  vec2 fe = vec2(noise(p * 48.0), noise(p * 48.0 + 9.1)) - 0.5;
  vec2 q = p + ((wv - 0.5) * 0.05 + fe * 0.008) * p_wet - dp * pt * 0.04;
  vec3 c0 = meadow(q, w, t);
  vec3 c1 = meadow(q + vec2(0.005, 0.008), w, t);

  float calm = 1.0 - 0.75 * smoothstep(0.12, 0.42, p.y);
  float edge = smoothstep(0.03, 0.22, length(c0 - c1));
  vec3 col = mix(c0, pow(min(c0, c1), vec3(1.35)) * 0.92, edge * 0.55);

  float bn = noise(p * 2.6 + wv * 1.6 + 11.0) * 0.75 + noise(p * 11.0 + wv * 3.0) * 0.18 + noise(p * 38.0) * 0.07;
  float inb = smoothstep(0.656, 0.664, bn);
  float rimIn = inb * smoothstep(0.73, 0.66, bn);
  col = mix(col, pow(col, vec3(0.7)), inb * 0.5 * p_wet);
  col = pow(col, vec3(1.0 + rimIn * 0.8 * p_wet * calm));
  col = mix(col, pow(col, vec3(0.8)), pt * 0.4);

  col = pow(col, vec3(1.0 + (noise(vec2(q.x * 40.0, q.y * 2.0)) - 0.5) * 0.2 * p_wet * calm));
  float g = noise(p * min(u_resolution.y / 2.5, 220.0));
  float valley = noise(p * 30.0 + 5.0);
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  float gw = (0.35 + clamp((col.b - col.g) * 1.5, 0.0, 1.0)) * (1.0 - lum * 0.6) * calm;
  col = pow(col, vec3(1.0 + ((g - 0.5) * (0.5 + 0.5 * valley) + (valley - 0.5) * 0.15) * 0.7 * p_grain * gw));

  float ax = u_resolution.x / u_resolution.y;
  for (int i = 0; i < 24; i++) {
    float fi = float(i);
    vec2 s = vec2(fi * 7.13, fi * 3.71);
    vec2 hp = vec2(hash21(s), hash21(s + 1.7));
    float xs = hp.x * 2.0 - 1.0;
    xs = sign(xs) * pow(abs(xs), 0.55);
    vec2 fp = vec2(xs * 0.5 * ax, mix(-0.44, 0.14, hp.y));
    fp += vec2(0.08 * sin(t * 0.21 * (1.0 + hp.y) + fi * 2.1), 0.045 * sin(t * 0.37 * (1.0 + hp.x) + fi));
    float blink = smoothstep(0.0, 0.8, sin(t * (0.6 + 0.5 * hash21(s + 9.1)) + fi * 2.3));
    vec2 d = p - fp + (wv - 0.5) * 0.02;
    float d2 = dot(d, d);
    float r = 0.0085 * p_size * (0.7 + 0.6 * hash21(s + 4.4));
    float halo = exp(-d2 / (r * r * 22.0)) * blink * p_motes;
    col = 1.0 - (1.0 - col) * (1.0 - Y * clamp(halo * 0.85, 0.0, 1.0));
    col = mix(col, core, smoothstep(r, r * 0.3, sqrt(d2)) * blink * min(p_motes, 1.0));
  }

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    vec2 base = toP(a.xy);
    float ph = t * 1.1 + fi * 1.7;
    vec2 head = base + vec2(0.04 * sin(ph), 0.02 * sin(ph * 2.0 + 0.5)) * (1.0 - waiting);
    float R = 0.01 * p_size;
    vec2 d = p - head + (wv - 0.5) * 0.012;
    float dl = length(d);
    float pulse = 0.5 + 0.5 * sin(t * 2.4 + fi);
    float bright = mix(0.9 + 0.1 * sin(t * 11.0 + fi * 3.0), 0.45 + 0.55 * pulse, waiting);
    vec3 hue = mix(Y, mix(Y, K, 0.6), waiting);
    float halo = exp(-dl * dl / (R * R * 32.0)) * bright * a.w;
    col = 1.0 - (1.0 - col) * (1.0 - hue * halo * 0.9);
    float body = smoothstep(R * 1.8, R * 1.5, dl);
    float brim = exp(-pow((dl - R * 1.7) / (R * 0.2), 2.0));
    col = mix(col, mix(hue, core, 0.3), body * 0.5 * a.w * bright);
    col = mix(col, hue * 0.6 + K * 0.1, brim * 0.3 * a.w);
    col = mix(col, core, smoothstep(R, R * 0.25, dl) * a.w * bright);
    if (waiting > 0.5) {
      float f = fract(t * 0.5 + fi * 0.3);
      float ring = exp(-pow((dl - R * (2.5 + 6.0 * f)) / (R * 0.35), 2.0)) * (1.0 - f);
      col = mix(col, K, ring * 0.75 * a.w);
    } else {
      for (int k = 1; k <= 6; k++) {
        float fk = float(k);
        float tk = ph - fk * 0.2;
        vec2 tp = base + vec2(0.04 * sin(tk), 0.02 * sin(tk * 2.0 + 0.5));
        vec2 td = p - tp;
        float tr = R * (0.9 - fk * 0.1);
        float tg = exp(-dot(td, td) / (tr * tr * 3.0)) * (1.0 - fk / 7.0) * a.w;
        col = 1.0 - (1.0 - col) * (1.0 - Y * tg * 0.75);
      }
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float ks = r.w > 1.5 ? 0.5 : 1.0;
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float rad = (0.03 + 0.2 * (1.0 - exp(-r.z * 1.1))) * ks;
    vec2 dir = d / max(dist, 1e-4);
    float rf = rad * (0.85 + 0.3 * noise(dir * 2.5 + r.xy * 31.0 + wv));
    float fade = exp(-r.z * 0.75);
    float body = clamp(smoothstep(rf, rf - 0.02, dist) * fade * (1.0 - 0.4 * dist / max(rf, 1e-3)), 0.0, 1.0);
    vec3 lit = 1.0 - (1.0 - col) * (1.0 - Y * body * 0.65);
    col = mix(lit, mix(col, red, body * 0.9), isErr);
    float rr = exp(-pow((dist - rf) * 110.0, 2.0)) * fade;
    col = mix(col, mix(Y * 0.5, red * 0.5, isErr), rr * 0.75);
    float ang = atan(d.y, d.x);
    float sp = pow(0.5 + 0.5 * cos(ang * 9.0 + r.x * 50.0), 20.0) * exp(-pow((dist - rf * 1.25) * 60.0, 2.0)) * fade;
    col = 1.0 - (1.0 - col) * (1.0 - mix(mix(Y, core, 0.5), vec3(1.0, 0.3, 0.2), isErr) * sp);
  }

  float pf = min(u_resolution.y / 4.0, 160.0);
  float pn = noise(p * pf) * 0.6 + noise(p * pf * 0.47 + 4.0) * 0.4;
  col *= 0.94 + 0.09 * pn;
  col = mix(col, vec3(0.97, 0.94, 0.88), 0.03);
  return mix(u_canvas, col, p_color);
}`,nd=`vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * 0.02 * p_drift;
  float h = fbm(p * p_scale + vec2(t, t * 0.4)) * 1.2;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float breathe = a.z > 0.5 ? 0.8 + 0.2 * sin(u_time * 2.0) : 1.0;
    h += p_height * a.w * breathe * exp(-dot(d, d) / 0.03);
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float dir = abs(r.w - 1.0) < 0.5 ? -1.0 : 1.0;
    h += dir * 0.25 * exp(-pow((dist - r.z * 0.28) * 18.0, 2.0)) * exp(-r.z);
  }
  float v = h * p_density;
  float w = fwidth(v) * p_weight;
  float f = fract(v);
  float line = 1.0 - smoothstep(0.0, w * 1.5, min(f, 1.0 - f));
  float m = fract(v / 5.0);
  float major = 1.0 - smoothstep(0.0, w * 2.5, min(m, 1.0 - m) * 5.0);
  vec3 base = mix(u_canvas, ramp(h * 0.8), p_fill);
  vec3 col = mix(base, u_palette[3], clamp(line * 0.55 + major * 0.35, 0.0, 1.0));
  return mix(u_canvas, col, p_color);
}`,id=`float terrain(vec2 p, float td) {
  vec2 q = p * 1.9 + vec2(td, td * 0.4);
  float b = noise(q) * 0.52
          + noise(q * 2.07 + vec2(5.2, 1.3) - vec2(td * 0.6, 0.0)) * 0.28
          + noise(q * 4.13 + vec2(1.7, 9.2)) * 0.11
          + noise(q * 8.4 + vec2(8.3, 2.8)) * 0.035;
  float h = (b - 0.45) * 2.6;
  h += 0.45 * smoothstep(0.3, 0.9, abs(p.x)) - 0.05;
  return h;
}

float halftone(float T, vec2 p, float ang, float cell, float seed) {
  vec2 gT = vec2(dFdx(T), dFdy(T));
  float c = cos(ang), s = sin(ang);
  mat2 R = mat2(c, s, -s, c);
  vec2 q = R * p / cell;
  vec2 cp = transpose(R) * ((floor(q) + 0.5) * cell);
  float Tc = clamp(T + dot(gT, (cp - p) * u_resolution.y), 0.0, 1.0);
  float d = length(fract(q) - 0.5);
  float rough = (noise(p * u_resolution.y * 0.3 + seed) - 0.5) * 0.14 * p_grain;
  float r = 0.74 * sqrt(Tc);
  float aa = 0.8 / (cell * u_resolution.y);
  return smoothstep(r + aa, r - aa, d + rough) * smoothstep(0.0, 0.05, Tc);
}

float inkDensity(vec2 p, float seed) {
  float band = 0.8 + 0.2 * noise(vec2(p.x * 1.6 + seed, p.y * 24.0 + seed * 3.0));
  float mottle = 0.9 + 0.1 * noise(p * 14.0 + seed * 7.0);
  float speck = smoothstep(0.58, 0.85, noise(p * u_resolution.y * 0.45 + seed * 11.0));
  return band * mottle * (1.0 - 0.45 * p_grain * speck);
}

float isoLine(float v, float px) {
  float fw = fwidth(v) * px;
  return smoothstep(fw, fw * 0.35, abs(fract(v + 0.5) - 0.5));
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float td = t * 0.02 * p_drift;
  vec3 P = u_palette[0];
  vec3 B = u_palette[1];
  vec3 Y = u_palette[2];
  vec3 paper = u_palette[3];
  float lw = max(0.7, u_resolution.y * 0.0022);

  float h = terrain(p, td);
  vec2 dp = p - toP(u_pointer);
  h += 0.16 * exp(-dot(dp, dp) / 0.005);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    float r2 = dot(d, d);
    float waiting = step(0.5, a.z);
    float breathe = mix(1.0, 0.85 + 0.15 * sin(t * 2.4 + float(i)), waiting);
    h += p_height * a.w * breathe * exp(-r2 / 0.02);
    float dist = sqrt(r2);
    h += (1.0 - waiting) * a.w * 0.06 * sin(dist * 60.0 - t * 3.0) * exp(-dist * 6.0) * smoothstep(0.02, 0.06, dist);
  }

  float ringY = 0.0, ringP = 0.0, ringB = 0.0, flash = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float isErr = abs(r.w - 1.0) < 0.5 ? 1.0 : 0.0;
    float isStart = r.w > 1.5 ? 1.0 : 0.0;
    float front = r.z * 0.26 * (1.0 - 0.4 * isStart);
    float fade = exp(-r.z * 0.55);
    h += mix(0.25, -0.3, isErr) * exp(-pow((dist - front) * 16.0, 2.0)) * exp(-r.z * 0.9);
    float ad = abs(dist - front);
    float band = smoothstep(0.02, 0.013, ad) * fade;
    float edge = smoothstep(0.0035, 0.002, abs(ad - 0.022)) * fade;
    ringY += band * (1.0 - isStart);
    ringP += band * max(isErr, isStart);
    ringB += edge * (1.0 - isErr) * (1.0 - isStart);
    float thick = 0.07 * exp(-r.z * 0.7);
    flash += isErr * smoothstep(front + 0.004, front - 0.004, dist) * smoothstep(front - thick - 0.004, front - thick + 0.004, dist);
  }
  flash = clamp(flash, 0.0, 1.0);

  vec2 g = vec2(dFdx(h), dFdy(h)) * u_resolution.y;
  vec3 n = normalize(vec3(-g * 0.3, 1.0));
  float lam = dot(n, normalize(vec3(-0.6, 0.6, 0.55)));
  float shadow = clamp((0.72 - lam) * 1.6, 0.0, 1.0);
  float lit = clamp((lam - 0.8) * 4.0, 0.0, 1.0);

  float mr = 0.0034 * p_misreg;
  vec2 oP = mr * vec2(1.0, -0.6) + 0.001 * p_misreg * vec2(sin(t * 0.23), cos(t * 0.19));
  vec2 oB = mr * vec2(-0.7, 0.8);
  vec2 oY = mr * vec2(0.4, 0.9) + 0.0008 * p_misreg * vec2(cos(t * 0.17), sin(t * 0.29));
  float hP = h + dot(g, oP);
  float hB = h + dot(g, oB);
  float hY = h + dot(g, oY);

  float waterB = smoothstep(0.015, -0.015, hB);
  float landY = smoothstep(-0.02, 0.08, hY);
  float Ty = landY * (0.72 - 0.62 * smoothstep(0.45, 1.1, hY)) * (1.0 - 0.5 * lit);
  float Tp = smoothstep(0.3, 0.95, hP) * 0.9 + 0.06 * smoothstep(0.1, 0.3, hP);
  float Tb = mix(0.03 + 0.4 * shadow * smoothstep(-0.05, 0.3, hB), 0.14 + 0.3 * smoothstep(0.0, -0.5, hB), waterB);

  float cell = 0.013 * p_dots;
  float cY = halftone(Ty, p, 0.0, cell * 1.05, 1.3);
  float cP = halftone(Tp, p, 1.309, cell, 7.1);
  float cB = halftone(Tb, p, 0.262, cell * 0.95, 3.7);

  float landB = 1.0 - waterB;
  float minorB = isoLine(hB * 9.0, lw) * landB;
  float minorP = isoLine(hP * 9.0, lw) * smoothstep(-0.02, 0.05, hP);
  float majorP = isoLine(hP * 9.0 / 5.0, lw * 2.0) * smoothstep(-0.02, 0.05, hP);
  float majorB = isoLine(hB * 9.0 / 5.0, lw * 1.6) * landB;
  float shore = smoothstep(fwidth(hB) * lw * 2.0, fwidth(hB) * lw * 0.6, abs(hB));
  float wl = isoLine(hB * 30.0 - t * 0.35, lw * 0.8) * waterB * smoothstep(-0.35, -0.03, hB);
  float lineB = max(max(minorB * 0.75, majorB), max(shore, wl * 0.8));
  float lineP = max(minorP * 0.25, majorP);

  float ringW = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.z < 0.5) continue;
    vec2 d = p - toP(a.xy);
    float fr = fract(t * 0.6 + float(i) * 0.3);
    float rr = abs(length(d) - (0.045 + 0.08 * fr));
    float dash = step(0.0, sin(atan(d.y, d.x) * 14.0 + t));
    ringW = max(ringW, smoothstep(0.0032, 0.0016, rr) * dash * (1.0 - fr) * a.w);
  }

    float kY = clamp(max(cY, max(ringY, flash)), 0.0, 1.0) * inkDensity(p, 1.0);
  float kP = clamp(max(max(cP, lineP), max(ringP, flash)), 0.0, 1.0) * inkDensity(p, 4.0);
  float kB = clamp(max(max(cB, lineB) * (1.0 - 0.6 * flash), max(ringW, ringB)), 0.0, 1.0) * inkDensity(p, 9.0);

  vec3 col = paper * (0.96 + 0.04 * noise(p * u_resolution.y * 0.12) + 0.02 * (noise(p * 6.0) - 0.5));
  col *= mix(vec3(1.0), Y, kY);
  col *= mix(vec3(1.0), P, kP);
  col *= mix(vec3(1.0), B, kB);
  return mix(u_canvas, col, p_color);
}`,uu=`float hillY(float x) {
  return 0.07 + 0.09 * sin(x * 1.5 + 0.7) + 0.035 * sin(x * 3.7 + 1.3);
}

vec3 base(vec2 p, float w, float t) {
  vec3 skyC = u_palette[0];
  vec3 grass = u_palette[1];
  vec3 orange = u_palette[2];
  vec3 gold = u_palette[3];
  float hy = hillY(p.x);
  float hy2 = hillY(p.x * 0.6 + 2.7) + 0.09;

  float sy = clamp((p.y - hy) / 0.45, 0.0, 1.0);
  vec3 col = mix(mix(skyC, vec3(1.0, 0.96, 0.86), 0.45), skyC * 0.85 + vec3(0.0, 0.05, 0.14), sy);
  float cl = noise(vec2(p.x * 2.2 - t * 0.06, p.y * 5.0)) * noise(vec2(p.x * 4.0 - t * 0.09, p.y * 9.0 + 3.0));
  col = mix(col, vec3(1.0, 0.98, 0.95), smoothstep(0.16, 0.42, cl) * 0.85 * smoothstep(hy, hy + 0.1, p.y));

  if (p.y < hy2 + 0.01) {
    vec3 bh = mix(grass, skyC, 0.4) + gold * 0.1;
    float n = noise(p * vec2(34.0, 44.0));
    bh = mix(bh, mix(orange, gold, 0.5), smoothstep(0.6, 0.75, n) * 0.7);
    col = mix(col, bh, smoothstep(hy2 + 0.004, hy2 - 0.004, p.y));
  }

  if (p.y < hy + 0.07) {
    float depth = clamp((hy - p.y) / 0.55, 0.0, 1.0);
    float blade = noise(vec2(p.x * 22.0 + w * 2.0 * (0.3 + depth), p.y * 60.0));
    vec3 g = mix(grass * 0.55, grass * 1.15 + vec3(0.12, 0.1, 0.0), blade);
    g = mix(g, gold * 0.75 + grass * 0.35, 0.3 * noise(vec2(p.x * 3.0 - w * 0.6, p.y * 4.0)));
    g += vec3(0.12, 0.14, 0.02) * smoothstep(0.4, 1.3, w);
    col = mix(col, g, smoothstep(hy + 0.004, hy - 0.004, p.y));

    float s = p_size / 324.0;
    vec2 c0 = floor(p / s);
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 c = c0 + vec2(float(i), float(j));
        float h = hash21(c);
        if (h > p_bloom) continue;
        vec2 h2 = vec2(hash21(c + 17.1), hash21(c + 41.7));
        vec2 root = (c + 0.15 + 0.7 * h2) * s;
        float rh = hillY(root.x);
        if (root.y > rh - 0.01) continue;
        float dd = clamp((rh - root.y) / 0.55, 0.0, 1.0);
        float sz = mix(0.45, 1.15, dd) * (0.8 + 0.4 * h2.x);
        float stem = s * 0.9 * sz;
        float bend = clamp(w * (0.7 + 0.6 * h2.y), -1.2, 1.2);
        vec2 head = root + vec2(bend * stem * 0.6, stem * (1.0 - 0.3 * bend * bend));
        vec2 pa = p - root;
        vec2 ba = head - root;
        float k = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float sd = length(pa - ba * k);
        col = mix(col, grass * 0.45, smoothstep(s * 0.05 * sz, s * 0.02 * sz, sd) * 0.8);
        vec2 d = p - head;
        float ca = cos(bend * 0.5), sa = sin(bend * 0.5);
        d = vec2(ca * d.x + sa * d.y, -sa * d.x + ca * d.y);
        float r = s * 0.32 * sz;
        float e = length(d * vec2(1.0, 1.25)) / r;
        if (e < 1.0) {
          vec3 pc = mix(orange, gold, h2.x * 0.6);
          pc = mix(pc, gold * 1.1 + 0.1, smoothstep(0.75, 0.0, e) * (d.y > 0.0 ? 0.55 : 0.25));
          pc *= 0.8 + 0.35 * smoothstep(-r, r, d.y + d.x * 0.5);
          col = mix(col, pc, smoothstep(1.0, 0.8, e));
        }
      }
    }
  }
  return col;
}

vec3 dabLayer(vec2 p, vec2 off, float w, float t, out float m, out float stripe) {
  float cell = p_brush;
  vec2 q = p / cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off) * cell;
  float h = hash21(c + off * 7.0);
  float hy = hillY(cp.x);
  float ang = cp.y > hy + 0.01 ? 0.05 + 0.3 * (h - 0.5) : 1.3 + (h - 0.5) * 0.9 - w * 0.4;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5) * 0.35;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a * 0.9, b * 2.4));
  stripe = sin(b * 38.0 + h * 20.0) * 0.5 + 0.5;
  vec2 sp = cp + (jit + dir * a * 0.9) * cell;
  return base(sp, w, t);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float wt = t * p_wind;

  float w = 0.45 * sin(p.x * 2.6 - wt * 1.4 + p.y * 1.3);
  w += 1.1 * (noise(vec2(p.x * 1.3 - wt * 0.9, p.y * 1.1 + wt * 0.15)) - 0.45);
  w += 0.7 * smoothstep(0.55, 0.9, noise(vec2(p.x * 0.8 - wt * 1.7, 0.5 + p.y * 0.3)));

  float done = 0.0;
  float err = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float gst = exp(-pow((dist - r.z * 0.35) * 7.0, 2.0)) * exp(-r.z * 0.5);
    w += gst * 1.4;
    if (abs(r.w - 1.0) < 0.5) err += gst; else done += gst;
  }
  vec2 dp = p - toP(u_pointer);
  w += 1.0 * exp(-dot(dp, dp) / 0.012);
  w *= p_bend;

  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), w, t, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), w, t, mA, sA);
  colB *= 0.95 + 0.07 * sB;
  colA *= 0.95 + 0.08 * sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.46, mA));
  col *= 0.97 + 0.06 * noise(p * 140.0);

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 head = toP(a.xy) + vec2(w * 0.012, 0.004 * sin(t * 2.3 + float(i)));
    vec2 d = p - head;
    float R = 0.026 * a.w;
    float waiting = step(0.5, a.z);
    float pulse = 0.5 + 0.5 * sin(t * 3.0);
    float glow = exp(-dot(d, d) / (0.004 + 0.004 * waiting * pulse));
    col += u_palette[3] * glow * a.w * (0.35 + 0.35 * waiting * pulse);
    float ang = atan(d.y, d.x);
    float rr = R * (0.8 + 0.2 * cos(4.0 * ang + w * 0.8));
    float e = length(d) / max(rr, 1e-4);
    vec3 pc = mix(u_palette[2] * 1.1, u_palette[3] * 1.15 + 0.1, smoothstep(1.0, 0.2, e) * 0.6 + 0.25 * smoothstep(-R, R, d.y));
    pc = mix(pc, vec3(0.2, 0.12, 0.05), smoothstep(0.22, 0.12, e));
    col = mix(col, pc, smoothstep(1.0, 0.85, e) * a.w);
    if (waiting > 0.5) {
      float ring = abs(length(d) - R * (1.4 + 0.6 * pulse));
      col += u_palette[3] * smoothstep(0.004, 0.0, ring) * 0.6 * a.w;
    } else {
      for (int k = 0; k < 4; k++) {
        float ph = fract(t * 0.35 * max(p_wind, 0.2) + float(k) * 0.25 + float(i) * 0.13);
        vec2 pp = head + vec2(ph * 0.24, 0.03 * sin(ph * 9.0 + float(k) * 2.0) - ph * 0.04);
        float pd = length((p - pp) * vec2(1.0, 1.6));
        col = mix(col, mix(u_palette[2], u_palette[3], 0.3) * 1.1, smoothstep(0.008, 0.004, pd) * (1.0 - ph) * a.w);
      }
    }
  }

  col += u_palette[3] * clamp(done, 0.0, 1.0) * 0.22;
  col = mix(col, vec3(0.95, 0.12, 0.08), clamp(err, 0.0, 1.0) * 0.6);

  float cm = exp(-dot(p * vec2(0.9, 1.4), p * vec2(0.9, 1.4)) / 0.08);
  vec3 soft = mix(col, vec3(dot(col, vec3(0.3, 0.5, 0.2))), 0.35);
  col = mix(col, soft, cm * 0.25);

  return mix(u_canvas, col, p_color);
}`,sd=`struct Clay { vec3 alb; vec2 g; float ao; float z; vec3 emit; };

float slopeOf(float u){ return clamp(-u / sqrt(max(1.0 - u*u, 0.02)), -3.0, 3.0); }

float wEdge(float fi, float x, float t, out float d1){
  float base = -0.03 - fi*0.105;
  float amp = 0.016 + 0.009*fi;
  float k = 3.2 + fi*1.1;
  float s = (0.35 + 0.3*fi)*p_swell;
  float a1 = x*k - t*s + fi*1.7;
  float a2 = x*k*2.3 + t*s*0.6 + fi*2.9;
  d1 = amp*k*cos(a1) + amp*0.4*k*2.3*cos(a2);
  return base + amp*sin(a1) + amp*0.4*sin(a2);
}

float lumpR(vec2 d, float r, float lump){
  float an = atan(d.y, d.x);
  return r*(1.0 + lump*(sin(an*3.0 + r*300.0) + 0.6*sin(an*7.0 + r*170.0)));
}

void dome(inout Clay c, vec2 d, float r, vec3 col, float z, inout float best, float lift, float lump){
  r = lumpR(d, r, lump);
  float l = length(d);
  if (l >= r) return;
  float hh = sqrt(r*r - l*l) + lift;
  if (hh <= best) return;
  best = hh;
  c.alb = col;
  c.g = -d / max(sqrt(r*r - l*l), r*0.3);
  c.z = z;
  c.ao = 1.0;
}

vec4 puff(float ci, int k, float t){
  float fk = float(k);
  float h = hash21(vec2(ci, 3.7));
  float hk = hash21(vec2(ci, fk + 2.0));
  float cy = 0.3 + 0.12*hash21(vec2(ci, 9.1));
  float cx = (ci + 0.5)*0.3 - t*0.018;
  vec2 pc = vec2(cx + (fk - 1.0)*0.05*(0.8 + 0.4*h), cy + (k == 1 ? 0.02 : 0.004*hk) + 0.004*sin(t*1.3 + fk + ci));
  float r = (k == 1 ? 0.048 : 0.028 + 0.012*hk)*(0.85 + 0.3*h);
  return vec4(pc, r, h < 0.3 ? 0.0 : cy);
}

float castMask(vec2 p, float t, float aspect){
  float m = 0.0;
  float c0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(c0 + float(j), k, t);
      if (pf.w == 0.0) continue;
      m = max(m, smoothstep(pf.z, pf.z*0.8, length(p - pf.xy)));
    }
  }
  vec2 sd = p - vec2(0.06*aspect, 0.3);
  m = max(m, smoothstep(0.085, 0.07, length(sd)));
  float lx0 = 0.5*aspect - 0.13;
  float ty = p.y + 0.22;
  float hw = mix(0.038, 0.025, clamp(ty/0.3, 0.0, 1.0)) + 0.004;
  m = max(m, step(0.0, ty)*step(ty, 0.36)*smoothstep(hw, hw - 0.008, abs(p.x - lx0)));
  return m;
}

Clay subject(vec2 p, float t, float aspect){
  Clay c;
  c.ao = 1.0; c.g = vec2(0.0); c.z = 0.0; c.emit = vec3(0.0);
  float sy = smoothstep(-0.05, 0.45, p.y);
  c.alb = mix(mix(u_palette[2], u_palette[3], 0.45), u_palette[0], sy);
  c.alb = mix(c.alb, u_palette[2]*0.9 + vec3(0.06, 0.0, 0.1), exp(-pow((p.y - 0.1)/0.08, 2.0))*0.45);
  float sn = noise(p*vec2(2.5, 14.0));
  float sm = sin(p.y*80.0 + 6.0*sn + 2.0*sin(p.x*4.0));
  c.g = vec2(0.05*sm, 0.16*sm);
  c.alb *= 0.95 + 0.1*sn;
  c.ao = 1.0 - 0.32*castMask(p + vec2(-0.017, 0.017), t, aspect);
  vec2 sc = vec2(0.06*aspect, 0.3);
  vec2 sd = p - sc;
  c.alb += u_palette[3]*exp(-dot(sd, sd)/0.03)*0.22;
  float best = 0.0;
  float sl = length(sd);
  vec3 sunC = mix(u_palette[2], u_palette[3], 0.3 + 0.4*smoothstep(0.09, 0.0, sl));
  sunC = mix(sunC, u_palette[2]*1.05, smoothstep(0.005, 0.0, abs(sl - 0.064))*0.8);
  dome(c, sd, 0.085, sunC, 0.25, best, 0.0, 0.012);
  float cc0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(cc0 + float(j), k, t);
      if (pf.w == 0.0 || p.y < pf.w - 0.03) continue;
      vec3 cl = mix(mix(u_palette[3], vec3(1.0), 0.3), u_palette[2]*0.9 + 0.12, smoothstep(pf.w + 0.03, pf.w - 0.03, p.y)*0.5);
      dome(c, p - pf.xy, pf.z, cl, 0.3, best, 0.0, 0.06);
    }
  }
  float hx = p.x;
  float he = 0.03 + 0.035*sin(hx*2.3 + 1.0) + 0.016*sin(hx*5.3 + 0.4);
  float hd = 0.035*2.3*cos(hx*2.3 + 1.0) + 0.016*5.3*cos(hx*5.3 + 0.4);
  if (p.y < he){
    float r = 0.022;
    float s = clamp((he - p.y)/r, 0.0, 1.0);
    float dh = (1.0 - s)/sqrt(max(1.0 - (1.0 - s)*(1.0 - s), 0.03));
    c.g = clamp(dh, 0.0, 3.0)*vec2(hd, -1.0)*0.7;
    c.alb = mix(mix(u_palette[0], u_palette[1], 0.5), u_palette[2], 0.1);
    c.alb *= 0.9 + 0.2*noise(p*vec2(9.0, 30.0));
    c.z = 0.35; c.ao = 1.0;
  }
  float lx0 = 0.5*aspect - 0.13;
  for (int i = 0; i < 4; i++){
    float fi = float(i);
    float de;
    float e = wEdge(fi, p.x, t, de);
    if (i == 3){
      vec2 rd = (p - vec2(lx0 + 0.01, -0.25))/vec2(0.11, 0.065);
      float rl = length(rd);
      if (rl < 1.0 + 0.08*noise(p*40.0)){
        c.alb = mix(u_palette[0]*0.8 + 0.1, u_palette[1]*0.5, 0.3);
        c.g = -rd/max(sqrt(max(1.0 - rl*rl, 0.0)), 0.3)*0.9;
        c.z = 0.8; c.ao = 1.0;
      }
      float ty = p.y + 0.22;
      if (ty > 0.0 && ty < 0.3){
        float hw = mix(0.038, 0.025, ty/0.3);
        float u = (p.x - lx0 + 0.002*sin(ty*40.0))/hw;
        if (abs(u) < 1.0){
          float band = mod(floor(ty/0.055 + 0.08*sin(p.x*120.0)), 2.0);
          c.alb = band < 0.5 ? u_palette[2] : mix(u_palette[3], vec3(1.0), 0.3);
          c.g = vec2(slopeOf(u)*0.8, 0.0);
          c.z = 0.8; c.ao = 1.0;
        }
      }
      if (ty >= 0.3 && ty < 0.335 && abs(p.x - lx0) < 0.028){
        float u = (p.x - lx0)/0.028;
        float bar = step(0.8, fract(u*2.0 + 0.5));
        c.alb = mix(u_palette[3]*1.1, u_palette[0], bar*0.8);
        c.g = vec2(slopeOf(u)*0.5, 0.0);
        c.emit += u_palette[3]*(1.0 - bar)*0.55;
        c.z = 0.8;
      }
      vec2 cd = (p - vec2(lx0, 0.115))/vec2(0.034, 0.032);
      float cl = length(cd);
      if (cd.y > 0.0 && cl < 1.0){
        c.alb = u_palette[2]*0.9;
        c.g = -cd/max(sqrt(1.0 - cl*cl), 0.3)*0.8;
        c.z = 0.8;
      }
    }
    if (p.y < e){
      float d = (e - p.y)*(1.0 + 0.14*sin(p.x*5.0 + fi*2.0) + 0.06*sin(p.x*13.0 - fi));
      float w = 0.026*p_coil*(0.75 + 0.12*fi);
      float ci = floor(d/w);
      float u = 2.0*fract(d/w) - 1.0;
      float dh = slopeOf(u);
      c.g = dh*vec2(de, -1.0)*(0.55 + 0.12*fi);
      float aoMin = mix(0.55, 0.72, step(2.5, fi));
      c.ao = aoMin + (1.0 - aoMin)*sqrt(max(1.0 - u*u, 0.0));
      vec3 sea = mix(u_palette[1], u_palette[0], clamp(ci*0.11 + (3.0 - fi)*0.08, 0.0, 0.7));
      sea *= 0.92 + 0.16*hash21(vec2(ci, fi*7.0 + 1.0));
      sea = mix(sea, mix(u_palette[2], u_palette[3], 0.5), (3.0 - fi)*0.07);
      vec3 foam = mix(u_palette[3], vec3(1.0), 0.35);
      foam = mix(foam, u_palette[1], step(2.5, fi)*0.35);
      c.alb = ci < 0.5 ? foam : sea;
      c.z = 0.45 + fi*0.18;
    } else {
      c.ao *= 0.5 + 0.5*smoothstep(0.0, 0.035, p.y - e);
    }
  }
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    if (a.w < 0.05) continue;
    float fi = float(i);
    vec2 ap = toP(a.xy);
    float by = 0.0, bs = 0.0, bslope = 0.0;
    for (int b = 0; b < 4; b++){
      float db;
      float eb = wEdge(float(b), ap.x, t, db);
      if (b == 0 || eb >= ap.y - 0.08){ by = eb; bs = float(b); bslope = db; }
    }
    float sc2 = a.w*(0.8 + 0.17*bs);
    vec2 d = p - vec2(ap.x, by + 0.004);
    float ta = -atan(bslope)*0.6;
    d = vec2(cos(ta)*d.x - sin(ta)*d.y, sin(ta)*d.x + cos(ta)*d.y)/sc2;
    float waiting = step(0.5, a.z);
    if (d.x > 0.07 || d.x < -0.16 || abs(d.y) > 0.1) continue;
    if (waiting < 0.5){
      float sh = fract(t*0.9 + fi*0.3);
      for (int k = 0; k < 3; k++){
        float fk = float(k) + sh;
        vec2 pc = vec2(-0.05 - fk*0.03, -0.012 + 0.003*sin(fk*3.0));
        float r = 0.012*(1.0 - fk*0.26);
        if (r > 0.0) dome(c, d - pc, r, mix(u_palette[3], vec3(1.0), 0.45), 1.0, best, 1.0, 0.05);
      }
    }
    if (d.y < 0.0 && d.y > -0.022){
      float hw = 0.046 - (-d.y)*0.9;
      if (abs(d.x) < hw){
        float u = (d.y + 0.011)/0.011;
        c.alb = d.y > -0.005 ? mix(u_palette[3], vec3(1.0), 0.3) : u_palette[2];
        c.g = vec2(slopeOf(d.x/hw)*0.3, slopeOf(u)*0.8);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (abs(d.x) < 0.0025 && d.y >= 0.0 && d.y < 0.074){
      c.alb = u_palette[0]; c.g = vec2(slopeOf(d.x/0.0025)*0.5, 0.0); c.z = 1.0; c.ao = 1.0;
    }
    float sy2 = (d.y - 0.006)/0.064;
    if (sy2 > 0.0 && sy2 < 1.0){
      float sw = 0.042*(1.0 - sy2);
      if (d.x > 0.005 && d.x < 0.005 + sw){
        float u = (d.x - 0.005)/max(sw, 1e-3)*2.0 - 1.0;
        c.alb = mix(u_palette[3], vec3(1.0), 0.35);
        c.g = vec2(slopeOf(u)*0.35, -0.2);
        c.z = 1.0; c.ao = 1.0;
      }
      float jw = 0.03*(1.0 - sy2*1.2);
      if (d.x < -0.005 && d.x > -0.005 - jw){
        c.alb = mix(u_palette[2], u_palette[3], 0.3);
        c.g = vec2(0.35, -0.15);
        c.z = 1.0; c.ao = 1.0;
      }
    }
    if (waiting > 0.5){
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      vec2 ld = d - vec2(0.0, 0.078);
      float l2 = dot(ld, ld);
      c.emit += u_palette[3]*(exp(-l2/0.00006)*1.2 + smoothstep(0.004, 0.0, abs(sqrt(l2) - 0.012 - 0.014*pulse))*0.7*(1.0 - pulse*0.5))*a.w;
    }
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float rad = r.z*0.14;
    float x = (dist - rad)/0.016;
    float G = exp(-x*x)*exp(-r.z*0.55);
    vec2 dir = d/max(dist, 1e-4);
    c.g += dir*(-2.0*x)*G*1.2;
    bool err = abs(r.w - 1.0) < 0.5;
    vec3 rc = err ? vec3(0.92, 0.1, 0.07) : mix(u_palette[3], vec3(1.0), 0.3);
    c.alb = mix(c.alb, rc, clamp(G*1.6, 0.0, 1.0));
    if (err) c.emit += vec3(0.5, 0.03, 0.02)*G;
  }
  vec2 dp = p - toP(u_pointer);
  float pr = length(dp);
  float PG = exp(-pr*pr/0.0025);
  c.g += (dp/max(pr, 1e-4))*(2.0*pr/0.0025)*PG*0.05;
  c.ao *= 1.0 - 0.2*PG;
  return c;
}

float thumbH(vec2 p){
  float lump = 0.008*noise(p*14.0);
  float cs = 0.09;
  vec2 cc = floor(p/cs);
  float h = hash21(cc);
  vec2 ctr = (cc + 0.4 + 0.2*vec2(h, hash21(cc + 5.0)))*cs;
  vec2 q = p - ctr;
  float an = h*6.2831;
  q = vec2(cos(an)*q.x + sin(an)*q.y, -sin(an)*q.x + cos(an)*q.y);
  float e = length(q*vec2(1.0, 1.5));
  float print = step(0.6, h)*smoothstep(0.034, 0.012, e);
  return (lump + print*(0.0007*sin(e*320.0) - 0.0025))*p_thumb;
}

vec3 scene(vec2 uv, vec2 p){
  float aspect = u_resolution.x/u_resolution.y;
  float fps = max(p_fps, 1.0);
  float frame = floor(u_time*fps);
  float T = frame/fps;
  Clay c = subject(p, T, aspect);
  vec2 boil = (vec2(hash21(vec2(frame, 1.0)), hash21(vec2(frame, 2.0))) - 0.5)*0.002;
  float ep = 0.0018;
  float t0 = thumbH(p + boil);
  vec2 tg = vec2(thumbH(p + boil + vec2(ep, 0.0)) - t0, thumbH(p + boil + vec2(0.0, ep)) - t0)/ep;
  c.g += tg*mix(0.4, 1.0, c.z);
  vec3 N = normalize(vec3(-c.g, 1.0));
  vec3 L = normalize(vec3(-0.55, 0.55, 0.62));
  vec3 F = normalize(vec3(0.7, 0.1, 0.7));
  float diff = max(dot(N, L), 0.0);
  float fil = max(dot(N, F), 0.0);
  vec3 col = c.alb*(0.32*c.ao + 0.85*diff*vec3(1.0, 0.93, 0.82)*sqrt(c.ao) + 0.22*fil*vec3(0.6, 0.7, 0.95));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  col += pow(max(dot(N, H), 0.0), 22.0)*0.14*vec3(1.0, 0.95, 0.85);
  col += pow(1.0 - N.z, 2.0)*0.18*mix(u_palette[3], u_palette[1], 0.4);
  col = mix(col, c.alb*0.95*c.ao, (1.0 - c.z)*0.22);
  col += c.emit;
  vec2 lamp = vec2(0.5*aspect - 0.13, 0.097);
  float ang = T*0.9;
  vec2 bd = p - lamp;
  float side = cos(ang);
  float along = bd.x*sign(side);
  float cone = exp(-pow(bd.y/(0.008 + max(along, 0.0)*0.13), 2.0))*exp(-max(along, 0.0)*1.1)*step(0.0, along)*abs(side);
  float lampGlow = exp(-dot(bd, bd)/0.0012);
  col += u_palette[3]*(cone*0.5*(1.0 - smoothstep(0.5, 0.7, c.z)) + lampGlow*0.5)*p_beam;
  col *= 1.0 + 0.025*(hash21(vec2(frame, 7.0)) - 0.5);
  return mix(u_canvas, col, p_color);
}`,ad=`const int NS = 9;

vec2 perp(vec2 d){ return vec2(-d.y, d.x); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

vec3 starAt(int i, float W){
  float fi = float(i);
  float x = (-1.0 + 2.0*(fi + 0.25 + 0.5*hash21(vec2(fi, 1.3)))/float(NS))*W;
  float y = i == NS - 1 ? 0.2 : 0.22 + 0.24*hash21(vec2(fi, 7.9));
  float r = 0.014 + 0.016*hash21(vec2(fi, 4.1));
  return vec3(x, y, r);
}

vec4 vortex(int i, float W){
  return i == 0 ? vec4(-0.1*W - 0.02, 0.3, 0.14, 1.0) : vec4(0.28*W, 0.27, 0.09, -1.0);
}

float bandT(vec2 p, float sw){ return p.y + 0.028*sin(p.x*3.3 + sw*0.25) + 0.012*sin(p.x*8.0 - sw*0.4); }
float bandTop(){ return 0.05 + 0.15*p_blaze; }
float hillY(float x){ return 0.012 + 0.028*sin(x*2.0 + 0.6) + 0.014*sin(x*5.1 + 2.0); }
float shoreY(float x){ return -0.05 + 0.014*sin(x*3.0 + 1.0) + 0.008*sin(x*7.3); }
float railY(float x, float W){ return -0.12 - 0.24*(x + W)/(2.0*W); }
vec2 deckVP(float W){ return vec2(-W - 0.25, -0.06); }

float cyp(vec2 p, float cx, float H, float wmax, float sw){
  float h = (p.y + 0.52)/H;
  if (h < 0.0 || h > 1.0) return -1.0;
  float sway = 0.035*sin(sw*0.6 + cx*3.0)*h*h;
  float lob = 1.0 + 0.2*sin(h*21.0 + sw*1.1 + cx*5.0) + 0.1*sin(h*45.0 - sw*1.6);
  return wmax*pow(1.0 - h, 0.8)*lob - abs(p.x - cx - sway);
}

vec3 skyCol(vec2 p, float sw, float W){
  vec3 deep = u_palette[0]*0.72 + vec3(0.0, 0.02, 0.07);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  vec3 milk = mix(lite, u_palette[1], 0.35);
  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec2 dp = p - toP(u_pointer);
  vec2 q = p + rot2(dp, 1.6*exp(-dot(dp, dp)/0.008)) - dp;
  float s = noise(vec2(q.x*2.4 - sw*0.05, q.y*15.0 + 2.2*sin(q.x*2.6 + sw*0.1)));
  float L = smoothstep(0.42, 0.8, s)*0.6;
  float wy = 0.22 + 0.06*sin(q.x*2.4 - sw*0.12);
  float M = exp(-pow((q.y - wy)/0.045, 2.0))*(0.6 + 0.4*sin(q.x*22.0 + q.y*25.0 - sw*0.9));
  for (int i = 0; i < 2; i++){
    vec4 v = vortex(i, W);
    vec2 d = q - v.xy;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = 0.5 + 0.5*sin(2.0*v.w*th + r/v.z*(3.0 + 7.0*p_twist) - sw);
    float Lv = smoothstep(0.3, 0.85, arm)*smoothstep(0.0, 0.35, r/v.z)*0.9 + 0.5*exp(-r*r/(v.z*v.z*0.04));
    float wgt = exp(-r*r/(v.z*v.z))*min(p_twist + 0.3, 1.0);
    L = mix(L, Lv, wgt);
    M *= 1.0 - wgt;
  }
  vec3 col = mix(deep, lite, L);
  col = mix(col, milk, clamp(M, 0.0, 1.0)*0.85);
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      float fi = float(i);
      float r = s3.z*(1.0 + 0.12*sin(sw*1.7 + fi*2.3));
      float d = length(p - s3.xy);
      if (d > r*4.0) continue;
      float halo = exp(-d*d/(r*r*4.5))*p_stars;
      float rings = 0.5 + 0.5*sin(d/r*6.5 - sw*1.4 + fi);
      col = mix(col, mix(lite*1.08, warm, rings), clamp(halo, 0.0, 1.0)*0.85);
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.96, 0.75), smoothstep(r*0.5, 0.0, d)), smoothstep(r*0.7, r*0.45, d));
    }
    vec2 md = p - vec2(W - 0.15, 0.35);
    float ml = length(md);
    float mh = exp(-ml*ml/0.012)*p_stars;
    col = mix(col, mix(warm, lite*1.1, 0.5 + 0.5*sin(ml*90.0 - sw*1.2)), clamp(mh, 0.0, 1.0)*0.8);
    float cres = smoothstep(0.048, 0.044, ml)*smoothstep(0.038, 0.042, length(md - vec2(-0.02, 0.014)));
    col = mix(col, mix(u_palette[1], mix(u_palette[1], u_palette[2], 0.35), smoothstep(0.02, 0.048, ml)), cres);
  }
  return col;
}

vec3 base(vec2 p, float t, float W){
  float sw = t*p_swirl;
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0], drk = u_palette[3];
  vec3 col = skyCol(p, sw, W);
  float bt = bandT(p, sw);
  float top = bandTop();
  vec3 B[4] = vec3[4](red, mix(red, yel, 0.5), yel, mix(red, drk, 0.3));
  float k = bt*17.0 + 0.6*sin(p.x*4.0 - sw*0.2) + 0.3*sin(p.x*11.0 + sw*0.3);
  float f = fract(k);
  int bi = int(mod(floor(k), 4.0));
  vec3 bc = mix(B[bi], B[(bi + 1) - 4*((bi + 1)/4)], smoothstep(0.55, 1.0, f));
  bc = mix(bc, yel, smoothstep(0.03, -0.03, bt)*0.35);
  bc = mix(bc, mix(blu, vec3(0.3, 0.62, 0.55), 0.5), smoothstep(0.88, 1.0, sin(bt*11.0 + 2.0 - p.x*0.7))*0.6);
  col = mix(col, bc, smoothstep(top + 0.03, top - 0.03, bt));
  float hy = hillY(p.x);
  if (p.y < hy){
    float n = noise(vec2(p.x*7.0, p.y*40.0));
    float ridge = 0.5 + 0.5*sin((hy - p.y)*140.0 + n*4.0 + p.x*3.0);
    vec3 hc = mix(blu*0.5 + drk*0.25, mix(blu, vec3(0.6, 0.75, 1.0), 0.35), ridge*0.7);
    col = mix(col, hc, smoothstep(hy, hy - 0.004, p.y));
  }
  float sy = shoreY(p.x);
  if (p.y < sy){
    float dep = clamp((sy - p.y)/0.25, 0.0, 1.0);
    vec3 wc = mix(blu*0.8 + vec3(0.05, 0.0, 0.08), blu*0.45 + drk*0.3, dep);
    float rn = noise(vec2(p.x*2.6 - sw*0.05, (p.y + 0.02*sin(p.x*6.0 + sw*0.3))*30.0));
    wc = mix(wc, mix(red, yel, 0.55), smoothstep(0.6, 0.85, rn)*0.6*(1.0 - dep*0.7));
    col = mix(col, wc, smoothstep(sy, sy - 0.004, p.y));
  }
  float ry = railY(p.x, W);
  float lo = ry - 0.075;
  if (p.y < ry + 0.016){
    vec3 wood = mix(red, drk, 0.35);
    if (p.y < lo){
      vec2 dv = p - deckVP(W);
      float pa = atan(dv.y, dv.x);
      float n = noise(vec2(pa*30.0, length(dv)*5.0));
      float pl = 0.5 + 0.5*sin(pa*150.0 + n*4.0);
      float pl2 = 0.5 + 0.5*sin(pa*57.0 + 1.7 + n*2.0);
      vec3 dk = mix(mix(red, yel, 0.35)*0.75, mix(red, drk, 0.35)*0.85, pl*0.7);
      dk = mix(dk, mix(blu, vec3(0.62, 0.6, 0.66), 0.45)*0.85, smoothstep(0.6, 0.95, pl2)*0.6);
      dk = mix(dk, yel*0.85, smoothstep(0.75, 0.95, n)*0.3);
      col = dk*(0.86 + 0.14*smoothstep(-0.5, -0.25, p.y));
    }
    float px = abs(fract(p.x/0.11 + 0.3) - 0.5)*0.11;
    if (p.y < ry && p.y > lo - 0.006) col = mix(col, wood*0.85, smoothstep(0.0075, 0.005, px));
    col = mix(col, wood*0.9, smoothstep(0.0065, 0.0045, abs(p.y - lo)));
    vec3 rc = mix(wood, mix(red, yel, 0.4), smoothstep(-0.012, 0.012, p.y - ry)*0.6);
    col = mix(col, rc, smoothstep(0.014, 0.011, abs(p.y - ry)));
  }
  float cx = W - 0.085;
  float ins = cyp(p, cx, 0.9, 0.075, sw);
  if (ins > -0.004){
    float n = noise(vec2((p.x - cx)*40.0 + 1.5*sin(p.y*9.0 + sw*0.8), p.y*4.0));
    vec3 cc = mix(drk*0.8, mix(drk, vec3(0.28, 0.5, 0.3), 0.55), smoothstep(0.45, 0.85, n));
    cc = mix(cc, mix(red, drk, 0.6), smoothstep(0.8, 0.95, noise(vec2(p.x*60.0, p.y*9.0)))*0.5);
    cc *= 0.75 + 0.25*smoothstep(0.0, 0.03, ins);
    col = mix(col, cc, smoothstep(-0.004, 0.002, ins));
  }
  return col;
}

vec2 skyFlow(vec2 p, float sw, float W){
  vec2 v = vec2(1.0, -0.38*cos(p.x*2.6 + sw*0.1));
  for (int i = 0; i < 2; i++){
    vec4 c = vortex(i, W);
    vec2 d = p - c.xy;
    v += c.w*perp(d)/c.z*exp(-dot(d, d)/(c.z*c.z))*4.0*max(p_twist, 0.2);
  }
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      vec2 d = p - s3.xy;
      v += perp(d)/s3.z*exp(-dot(d, d)/(s3.z*s3.z*5.0))*2.5;
    }
    vec2 d = p - vec2(W - 0.15, 0.35);
    v += perp(d)/0.05*exp(-dot(d, d)/0.01)*2.0;
  }
  return v;
}

vec2 disturb(vec2 p, float t){
  vec2 dp = p - toP(u_pointer);
  vec2 v = perp(dp)/0.07*exp(-dot(dp, dp)/0.008)*2.5;
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 d = p - toP(a.xy);
    v += perp(d)/0.05*exp(-dot(d, d)/0.005)*2.5*a.w;
  }
  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = max(length(d), 1e-3);
    float ring = exp(-pow((dist - r.z*0.16)/0.03, 2.0))*exp(-r.z*0.6);
    v += perp(d)/dist*ring*2.5;
  }
  return v;
}

float formAng(vec2 p, float t, float W){
  float sw = t*p_swirl;
  float ry = railY(p.x, W);
  vec2 dir;
  if (cyp(p, W - 0.085, 0.9, 0.075, sw) > 0.0){
    dir = vec2(0.25*sin(p.y*14.0 + sw*1.2), 1.0);
  } else if (p.y < ry - 0.08){
    dir = p - deckVP(W);
  } else if (p.y < ry + 0.012){
    dir = vec2(1.0, -0.24/(2.0*W));
  } else if (p.y < shoreY(p.x)){
    dir = vec2(1.0, 0.15*sin(p.x*6.0 + sw*0.3));
  } else if (p.y < hillY(p.x)){
    dir = vec2(1.0, 0.056*cos(p.x*2.0 + 0.6) + 0.0714*cos(p.x*5.1 + 2.0));
  } else if (bandT(p, sw) < bandTop() + 0.02){
    dir = vec2(1.0, -(0.0924*cos(p.x*3.3 + sw*0.25) + 0.096*cos(p.x*8.0 - sw*0.4)));
  } else {
    dir = skyFlow(p, sw, W);
  }
  dir = normalize(dir) + disturb(p, t);
  return atan(dir.y, dir.x);
}

vec3 dabLayer(vec2 p, vec2 off, float t, float W, out float m, out float stripe){
  float cell = p_brush;
  vec2 q = p/cell + off;
  vec2 c = floor(q);
  vec2 f = fract(q) - 0.5;
  vec2 cp = (c + 0.5 - off)*cell;
  float h = hash21(c + off*7.0);
  float ang = formAng(cp, t, W) + (h - 0.5)*0.3;
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 jit = (vec2(h, hash21(c + 3.3)) - 0.5)*0.3;
  vec2 g = f - jit;
  float a = dot(g, dir);
  float b = dot(g, nrm);
  m = length(vec2(a*0.52, b*2.5));
  stripe = sin(b*44.0 + h*20.0)*0.5 + 0.5;
  vec3 col = base(cp + (jit + dir*a*0.9 + nrm*b*0.35)*cell, t, W);
  float h2 = hash21(c + off*3.0 + 11.0);
  col = mix(col, col*vec3(0.85, 0.95, 1.2) + vec3(0.0, 0.02, 0.04), step(0.72, h2)*0.6);
  col = mix(col, col*vec3(1.15, 1.05, 0.85), step(h2, 0.18)*0.5);
  col *= 0.9 + 0.16*smoothstep(0.2, -0.2, b);
  return col;
}

vec3 scene(vec2 uv, vec2 p){
  float t = u_time;
  float W = 0.5*u_resolution.x/u_resolution.y;
  float sw = t*p_swirl;
  float mA, sA, mB, sB;
  vec3 colB = dabLayer(p, vec2(0.0), t, W, mB, sB);
  vec3 colA = dabLayer(p, vec2(0.5, 0.37), t, W, mA, sA);
  colB *= (0.93 + 0.09*sB)*(1.0 - 0.16*smoothstep(0.5, 0.8, mB));
  colA *= 0.93 + 0.1*sA;
  vec3 col = mix(colB, colA, smoothstep(0.62, 0.48, mA));
  col *= 1.0 - 0.1*smoothstep(0.44, 0.54, mA)*smoothstep(0.68, 0.56, mA);
  col *= 0.97 + 0.06*noise(p*150.0);


  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
  vec3 lite = mix(u_palette[0], vec3(0.78, 0.88, 1.0), 0.55);
  for (int i = 0; i < 16; i++){
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    vec2 ap = toP(a.xy);
    vec2 d = p - ap;
    float r = length(d);
    float an = atan(d.y, d.x);
    if (a.z < 0.5){
      float halo = exp(-r*r/0.0035);
      float rings = 0.5 + 0.5*sin(r*150.0 - t*4.0 + an);
      col = mix(col, mix(lite*1.1, warm, rings), halo*0.8*a.w);
      for (int k = 0; k < 3; k++){
        float ph = t*1.8 + float(k)*2.094 + fi;
        vec2 dd = p - ap - 0.045*vec2(cos(ph), sin(ph));
        vec2 tg = vec2(-sin(ph), cos(ph));
        float st = length(vec2(dot(dd, tg)/0.016, dot(dd, perp(tg))/0.0045));
        col = mix(col, warm*1.05, smoothstep(1.0, 0.6, st)*a.w);
      }
      col = mix(col, mix(u_palette[1], vec3(1.0, 0.97, 0.8), smoothstep(0.012, 0.0, r)), smoothstep(0.017, 0.012, r)*a.w);
    } else {
      float pulse = 0.5 + 0.5*sin(t*4.0 + fi);
      for (int k = 0; k < 3; k++){
        float ph = fract(t*0.45 + float(k)/3.0);
        float rr = 0.018 + ph*0.1 + 0.005*sin(an*6.0 + t*3.0 + float(k));
        float ring = exp(-pow((r - rr)/0.006, 2.0))*(1.0 - ph);
        col = mix(col, mix(u_palette[2], u_palette[1], 0.25*float(k)), ring*a.w);
      }
      vec3 skin = mix(u_palette[1], vec3(0.7, 0.66, 0.5), 0.5)*1.1;
      col = mix(col, skin, smoothstep(0.018, 0.012, r)*a.w);
      col = mix(col, u_palette[3], smoothstep(1.0, 0.7, length(vec2(d.x/0.004, (d.y + 0.002)/0.007)))*a.w*(0.6 + 0.4*pulse));
    }
  }

  for (int i = 0; i < 12; i++){
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float an = atan(d.y, d.x);
    float rad = r.z*0.16 + 0.008*sin(an*5.0 + r.z*6.0);
    float ring = exp(-pow((dist - rad)/0.012, 2.0))*exp(-r.z*0.6);
    if (abs(r.w - 1.0) < 0.5){
      col = mix(col, vec3(0.88, 0.08, 0.05), clamp(ring*1.2 + exp(-dist*dist/0.02)*exp(-r.z*0.8)*0.3, 0.0, 1.0));
    } else {
      col = mix(col, warm, clamp(ring, 0.0, 1.0)*0.8);
    }
  }
  return mix(u_canvas, col, p_color);
}`,cd=`float caustic(vec2 x, float t) {
  vec2 p = x * 6.2832 - 250.0;
  vec2 i = p;
  float c = 1.0;
  for (int n = 0; n < 4; n++) {
    float tt = t * (1.0 - 3.5 / float(n + 1));
    i = p + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    c += 1.0 / length(vec2(p.x / (sin(i.x + tt) / 0.005), p.y / (cos(i.y + tt) / 0.005)));
  }
  c /= 4.0;
  c = 1.17 - pow(c, 1.4);
  return clamp(pow(abs(c), 8.0), 0.0, 1.0);
}

vec4 jelly(vec2 d, float s, float ph, float trail, float tt) {
  float c = 0.5 + 0.5 * sin(ph);
  float sx = s * (1.0 + 0.14 * c);
  float sy = s * (0.8 - 0.16 * c);
  if (abs(d.x) > sx * 2.2 || d.y > sy * 1.4 || d.y < -s * 5.5 * trail) return vec4(0.0);
  vec2 b = d / vec2(sx, sy);
  float r = length(b);
  float skirt = -0.28 - 0.1 * sin(b.x * 10.0 + ph * 0.5) - 0.12 * c;
  float body = smoothstep(1.0, 0.9, r) * smoothstep(skirt - 0.06, skirt + 0.04, b.y);
  float rim = body * smoothstep(0.55, 0.97, r) + smoothstep(0.08, 0.0, abs(b.y - skirt)) * smoothstep(1.05, 0.8, abs(b.x));
  vec2 ib = b - vec2(0.0, 0.18);
  float inner = body * exp(-dot(ib, ib) * 5.0) * (0.6 + 0.4 * cos(atan(ib.x, ib.y) * 4.0));
  float tent = 0.0;
  float yy = -(d.y - skirt * sy);
  if (yy > 0.0) {
    float len = s * 5.0 * trail;
    float ty = yy / len;
    if (ty < 1.0) {
      for (int k = 0; k < 5; k++) {
        float fk = float(k) - 2.0;
        float tx = fk * 0.36 * sx * (1.0 - 0.3 * ty) + 0.3 * s * ty * sin(ty * 7.0 - tt * 2.4 + fk * 1.3);
        float w = s * (0.07 - 0.04 * ty);
        tent += smoothstep(w, w * 0.2, abs(d.x - tx)) * pow(1.0 - ty, 1.4) * 0.7;
      }
      float ay = yy / (len * 0.55);
      if (ay < 1.0) {
        for (int k = 0; k < 2; k++) {
          float fk = float(k) * 2.0 - 1.0;
          float tx = fk * 0.12 * sx + 0.16 * s * sin(ay * 5.0 - tt * 1.6 + fk);
          float w = s * (0.2 - 0.12 * ay) * (0.8 + 0.2 * sin(ay * 40.0 - tt * 3.0));
          tent += smoothstep(w, w * 0.3, abs(d.x - tx)) * (1.0 - ay);
        }
      }
    }
  }
  return vec4(body, clamp(rim, 0.0, 1.0), inner, clamp(tent, 0.0, 1.0));
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  vec3 abyss = u_palette[0];
  vec3 sea = u_palette[1];
  vec3 jel = u_palette[2];
  vec3 sun = u_palette[3];
  float ar = u_resolution.x / u_resolution.y;

  vec2 dp = p - toP(u_pointer);
  float pd = exp(-dot(dp, dp) / 0.012);
  float n = fbm(p * 1.7 + vec2(t * 0.05, -t * 0.03));
  vec2 q = p + (n - 0.5) * vec2(0.05, 0.03) + 0.004 * vec2(sin(p.y * 9.0 + t * 0.9), cos(p.x * 7.0 - t * 0.7)) + dp * pd * 0.25;

  float ex = abs(p.x) / (0.5 * ar);
  float edge = max(smoothstep(0.42, 0.9, ex), smoothstep(0.8, 0.97, uv.y));
  float live = mix(1.0, edge, p_calm);

  float depth = clamp(1.0 - uv.y + (n - 0.5) * 0.12, 0.0, 1.0);
  float fall = pow(smoothstep(-0.05, 1.05, depth), 1.3 / p_depth);
  vec3 shallow = mix(sea, sun, 0.22);
  vec3 col = mix(shallow, abyss, fall);

  float wave = 0.025 * sin(q.x * 13.0 + t * 1.2) + 0.015 * sin(q.x * 29.0 - t * 1.9) + 0.02 * (n - 0.5);
  float surf = smoothstep(0.86, 0.99, uv.y + wave);
  float glint = caustic(vec2(q.x * 0.9, q.y * 3.0) + vec2(t * 0.01, 0.0), t * 0.5);
  col = mix(col, mix(sun, sea, 0.2), surf * (0.55 + 0.4 * glint));

  float rx = q.x + (uv.y - 1.0) * 0.32;
  float r1 = noise(vec2(rx * 6.0 + t * 0.07, t * 0.12));
  float r2 = noise(vec2(rx * 15.0 - t * 0.1, 4.0 + t * 0.18));
  float rays = pow(clamp(r1 * 0.7 + r2 * 0.45 - 0.3, 0.0, 1.0), 1.6) * smoothstep(1.0, 0.1, depth);
  col = mix(col, sun, clamp(rays * 0.85 * p_rays * (0.4 + 0.6 * live), 0.0, 0.8));

  float floorY = -0.43 + 0.03 * sin(p.x * 2.3 + 1.0) + 0.02 * sin(p.x * 5.1) + 0.015 * (n - 0.5);
  float sand = smoothstep(0.006, -0.006, q.y - floorY);
  float ripplesand = 0.5 + 0.5 * sin((q.x + 0.3 * q.y) * 70.0 + n * 6.0);
  vec3 floorCol = mix(mix(abyss, sun, 0.2), mix(abyss, sea, 0.45), 0.5 + 0.3 * ripplesand);
  col = mix(col, floorCol, sand * 0.85);

  float ca = caustic(q * vec2(1.1, 1.6) + vec2(t * 0.012, t * 0.02), t * 0.32);
  float caW = mix(0.5 * (1.0 - fall), 1.0, sand) * (0.3 + 0.7 * live);
  col = mix(col, mix(sun, sea, 0.15), clamp(ca * caW * 0.8 * p_caustics, 0.0, 0.85));

  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float sc = mix(34.0, 18.0, fl);
    vec2 g = q * sc + vec2(sin(t * 0.21 + fl * 2.0) * 0.8 + t * 0.15, t * (0.25 + 0.2 * fl));
    vec2 cid = floor(g);
    float h = hash21(cid + fl * 17.0);
    vec2 off = vec2(hash21(cid + 3.1), hash21(cid + 7.7)) - 0.5;
    float sz = mix(0.09, 0.14, fl);
    float sp = smoothstep(sz, sz * 0.2, length(fract(g) - 0.5 - off * 0.6));
    float on = step(1.0 - 0.3 * p_snow, h);
    col = mix(col, mix(sun, shallow, 0.35 + 0.3 * fall), sp * on * mix(0.35, 0.55, fl) * (0.3 + 0.7 * live));
  }

  vec2 bg = vec2(q.x * 10.0, q.y * 10.0 - t * 1.3);
  vec2 bid = floor(bg);
  float hb = hash21(bid + 41.0);
  if (hash21(vec2(bid.x, 9.0)) < 0.1 * p_bubbles && hb < 0.8) {
    vec2 bl = fract(bg) - 0.5 - vec2(0.18 * sin(t * 3.0 + hb * 30.0 + bg.y * 1.7), 0.0);
    float br = 0.07 + 0.12 * hb;
    float bd = length(bl);
    float shell = smoothstep(br * 0.35, 0.0, abs(bd - br));
    float spec = smoothstep(br * 0.4, 0.0, length(bl - vec2(-0.35, 0.35) * br));
    col = mix(col, mix(sun, sea, 0.2), clamp(shell * 0.6 + spec * 0.85, 0.0, 1.0) * (0.15 + 0.85 * live) * (1.0 - 0.4 * fall));
  }

  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float s = mix(0.032, 0.07, fract(fk * 0.618 + 0.2));
    float fog = mix(0.5, 0.95, (s - 0.032) / 0.038);
    float jy = fract(fk * 0.29 + t * 0.006 * (1.0 + fk * 0.35)) * 1.5 - 0.75;
    float side = mod(fk, 2.0) < 0.5 ? -1.0 : 1.0;
    float jx = side * (0.5 * ar) * mix(0.6, 0.88, fract(fk * 0.43)) + 0.05 * sin(t * 0.17 + fk * 2.0);
    float ph = t * 1.4 + fk * 1.9;
    vec2 d = p - vec2(jx, jy + 0.012 * sin(ph));
    vec4 j = jelly(d, s, ph, 1.0, t + fk);
    vec3 jc = mix(jel, sea, 0.2 + 0.2 * sin(fk * 2.3));
    float halo = exp(-dot(d, d) / (s * s * 6.0));
    col = mix(col, mix(jc, sun, 0.2), clamp(halo * 0.4 * p_glow * fog, 0.0, 0.8));
    col = mix(col, mix(col, jc, 0.6), j.x * 0.45 * fog);
    col = mix(col, mix(jc, sun, 0.25 + 0.2 * j.z), clamp(j.y * 0.95 + j.z * 0.55, 0.0, 1.0) * fog);
    col = mix(col, mix(jc, sun, 0.15), j.w * 0.7 * fog);
  }

  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    float ph = u_time * mix(2.6, 1.1, waiting) + fi * 1.7;
    vec2 c0 = toP(a.xy) + vec2(0.006 * sin(u_time * 0.7 + fi), (1.0 - waiting) * 0.012 * sin(ph - 1.2));
    vec2 d = p - c0;
    float s = 0.036;
    vec4 j = jelly(d, s, ph, mix(1.0, 0.7, waiting), u_time + fi);
    vec3 jc = mix(jel, sea, 0.25 + 0.25 * sin(fi * 1.7));
    jc = mix(jc, sun, 0.7 * waiting);
    float pulse = 0.5 + 0.5 * sin(u_time * 2.0 + fi);
    float halo = exp(-dot(d, d) / (s * s * (4.0 + 3.0 * waiting * pulse)));
    col = mix(col, jc, clamp(halo * a.w * p_glow * 0.6, 0.0, 0.85));
    col = mix(col, mix(col, jc, 0.7), j.x * 0.6 * a.w);
    col = mix(col, mix(jc, sun, 0.3 + 0.3 * j.z), clamp(j.y * 0.9 + j.z * 0.6, 0.0, 1.0) * a.w);
    col = mix(col, mix(jc, sun, 0.2), j.w * 0.75 * a.w);
    if (waiting < 0.5) {
      for (int b = 0; b < 3; b++) {
        float fb = float(b);
        float by = fract(u_time * 0.45 + fb * 0.33 + fi * 0.21);
        vec2 bp = c0 + vec2(0.012 * sin(by * 12.0 + fb * 2.0 + fi), s * 0.9 + by * 0.14);
        float br = 0.004 + 0.003 * fb;
        float ring = smoothstep(0.0022, 0.0, abs(length(p - bp) - br));
        col = mix(col, mix(sun, sea, 0.2), ring * (1.0 - by) * 0.8 * a.w);
      }
    } else {
      float ph2 = fract(u_time * 0.5 + fi * 0.3);
      float ring = abs(length(d) - s * (1.6 + 2.2 * ph2));
      col = mix(col, sun, smoothstep(0.004, 0.0, ring) * (1.0 - ph2) * 0.7 * a.w);
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(p - toP(r.xy));
    float front = r.z * 0.2;
    float ring = exp(-pow((dist - front) * 26.0, 2.0)) * exp(-r.z * 0.8);
    float shimmer = 0.6 + 0.4 * sin(atan(p.y - toP(r.xy).y, p.x - toP(r.xy).x) * 18.0 + r.z * 6.0);
    vec3 rc = r.w > 0.5 && r.w < 1.5 ? vec3(0.95, 0.28, 0.25) : (r.w > 1.5 ? jel : mix(sun, sea, 0.3));
    col = mix(col, rc, ring * shimmer * 0.7);
  }

  col = mix(col, mix(sun, sea, 0.4), pd * 0.12);
  return mix(u_canvas, col, p_color);
}`,me=[{id:"tide",name:"Tide",source:od,palette:["#15295a","#1e8a94","#ffa845","#efe2c4"],params:[k("swell","Swell speed",0,3,1,.05),k("height","Wave height",.3,1.6,1,.05),k("foam","Foam claws",0,1.6,1,.05),k("carve","Carved line density",.5,2,1,.05),k("glow","Lantern glow",0,2,1,.05),k("color","Color strength",0,1,.92)]},{id:"fireflies",name:"Fireflies",source:rd,palette:["#1d2266","#6b3fb5","#ffe14d","#ff5fa2"],params:[k("size","Firefly size",.2,3,1.2),k("motes","Firefly swarm",0,2,.9),k("wind","Grass sway",0,3,1),k("wet","Wetness (blooms & bleed)",0,2,1),k("grain","Granulation",0,2,1),k("color","Color strength",0,1,.92)]},{id:"contour",name:"Contour",source:nd,palette:["#0d1b3e","#3a2d8f","#e0457b","#ffd36b"],params:[k("scale","Zoom",.5,5,1.6),k("density","Line density",2,30,22,.5),k("weight","Line weight",.5,3,1),k("height","Agent peaks",0,2,1.9),k("fill","Fill",0,1,.5),k("drift","Drift",0,3,1),k("color","Color strength",0,1,1)]},{id:"risograph-map",name:"Risograph Map",source:id,palette:["#ff48b0","#0078bf","#ffe800","#f6f0e1"],params:[k("drift","Terrain drift",0,3,1),k("height","Agent peaks",0,2,.9),k("dots","Halftone dot size",.5,2.5,1),k("misreg","Misregistration",0,3,1),k("grain","Ink grain",0,2,1),k("color","Color strength",0,1,.92)]},{id:"poppy-hill",name:"Poppy Hill in the Wind",source:uu,palette:["#5fa9ea","#3f9b34","#ff5a0a","#ffbf1f"],params:[k("wind","Wind speed",0,3,1),k("bend","Gust strength",0,2,1),k("size","Poppy size",8,40,18,.5),k("bloom","Bloom amount",0,1,.72),k("brush","Brush stroke size",.006,.03,.017,.001),k("color","Color strength",0,1,.95)]},{id:"plasticine-lighthouse-cove",name:"Plasticine Lighthouse Cove",source:sd,palette:["#1c2c6b","#22b3a6","#ff6a3d","#ffe0a6"],params:[k("swell","Swell speed",0,2.5,1,.05),k("coil","Coil thickness",.5,2,1,.05),k("thumb","Thumbprints",0,2.5,1,.05),k("fps","Stop-motion fps",4,24,12,1),k("beam","Lighthouse beam",0,2,1,.05),k("color","Color strength",0,1,.92)]},{id:"swirling-stars-screaming-fjord",name:"Swirling Stars, Screaming Fjord",source:ad,palette:["#2446a8","#f6cf3f","#e04a24","#102a22"],params:[k("swirl","Swirl speed",0,3,1.3,.05),k("twist","Vortex twist",0,2,1,.05),k("brush","Brush size",.006,.024,.014,.001),k("stars","Star glow",0,1.5,1,.05),k("blaze","Scream sky height",0,1,.7,.05),k("color","Color strength",0,1,.92)]},{id:"jellyfish-deep",name:"Jellyfish Deep",source:cd,palette:["#05213f","#13a3b4","#c48bff","#fdf3cf"],params:[k("drift","Current",0,3,1),k("depth","Depth",.4,2,1),k("rays","Light shafts",0,2,1),k("caustics","Caustics",0,2,1),k("snow","Marine snow",0,2,1),k("bubbles","Bubbles",0,2,1),k("glow","Bioluminescence",0,2,1),k("calm","Calm behind text",0,1,.6),k("color","Color strength",0,1,.92)]}],Vr=eo(me[0]);function eo(e){return{name:e.name,source:e.source,palette:[...e.palette],params:e.params.map(t=>({...t})),baseId:e.id}}s(eo,"sceneOf");function Yr(e){let t=me.find(r=>r.id===e.baseId);if(!t)return e;let o=new Map(e.params.map(r=>[r.id,r.value]));return{...eo(t),name:e.name,palette:e.palette,params:t.params.map(r=>{let n=o.get(r.id);return n===void 0?{...r}:{...r,value:Math.min(r.max,Math.max(r.min,n))}})}}s(Yr,"rebuildBuiltIn");function pu(e,t){let o=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(t).map(n=>[n.type,n.value])),r=new Intl.DateTimeFormat("en-US",{timeZone:e,weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}).format(t);return{date:`${o.year}-${o.month}-${o.day}`,hour:Number(o.hour),label:r}}s(pu,"localMoment");function Kr(e){return`0 ${e} * * *`}s(Kr,"dailyCron");function to(e){let t=/^0 (\d{1,2}) \* \* \*$/.exec(e??"");return t?Number(t[1]):null}s(to,"cronHour");function fu(e){let t={};for(let o of e)/^\d{1,2}$/.test(o)?t.hour=Number(o):t.timeZone=o;return t}s(fu,"parseDailyOptions");var lu=["bioluminescent tide pool at night, agents as glowing jellyfish","aurora over a frozen lake, agents as drifting lanterns on the ice","koi pond from above, agents as koi that leave wakes","rain running down a window with city bokeh behind it, agents as passing headlights","ink blooming in water, agents as drops that keep feeding new blooms","murmuration of starlings at dusk, agents as the birds leading the flock","slow meteor shower over a desert, agents as comets with tails","paper-cut mountain ranges in parallax, agents as hot-air balloons","lava lamp, agents as rising wax blobs","wheat field swaying in wind, agents as gusts moving through it","coral reef caustics, agents as small bright fish","neon fog over a night city, agents as moving signs","snow falling under streetlights, agents as the lamps","deep-space nebula with slow gas currents, agents as newborn stars","cloud chamber with particle trails, agents as the particle sources","sun through slowly turning window blinds, agents as floating dust motes","ocean swell from above with foam lines, agents as small boats","moss and ferns on a forest floor with drifting pollen, agents as fireflies","stained glass lit from behind by a moving sun, agents as brighter panes","sand dunes shifting at golden hour, agents as wandering caravans"];function Ep(e){let[t,o,r]=e.split("-").map(Number),n=Math.floor(Date.UTC(t,o-1,r)/864e5);return lu[n%lu.length]}s(Ep,"dailyConcept");function ud(e,t){return t?[`Paint a new Ambient scene: the living background bb shows behind its UI. It is ${e.label} in the user's time zone.`,`The user asked for: ${JSON.stringify(t)}`,"After researching the style (step 1 below) and before writing any GLSL, expand that request into a full concept the way an art director would, keeping the user's words at its center:","- The subject and setting, concretely.","- The art style, from your style sheet.","- A four-color palette sampled from your references that makes it vivid against bb's UI.","- The motion: what moves, and how wind, water, or light behaves.","- What working agents become (bright, characterful elements), what waiting agents do, and what ripples become: finished turns, and something red for errors.","- An evocative name under 40 characters.","Say the style sheet and the expanded concept in a few lines, then paint it."]:[`Paint today's Ambient scene: the living background bb shows behind its UI. It is ${e.label} in the user's time zone.`,`Today's starting concept: ${Ep(e.date)}. Make it your own, and let the season and time of day color it.`]}s(ud,"conceptLines");function du(e,t,o){return[...ud(e,o),`The user's time zone is ${t}.`,"Paint for how bb frames the scene:","- bb's sidebar, a wide centered thread column, and the composer cover most of the middle of the window with frosted glass that blurs and tints what is behind it. The scene reads clearly only in the open areas: the side margins, the gaps between panels, and the strips along the top and bottom. action=look reports where they are in the user's current window, but the layout changes: the sidebar collapses, windows resize, and side panels open.","- Fill the frame edge to edge and never center a lone subject. Put the recognizable parts (horizon, silhouettes, characters, the brightest accents) where they are seen: along the edges, low in the frame, and repeated across the width. Under the glass only big shapes and color fields survive the blur, so give the middle large, soft masses of color, not fine detail.","- Work at a readable scale: key shapes should be 5 to 30% of the window's height. Texture (brushstrokes, grain, dots) is a surface on top of those shapes, never the whole idea.","- Build depth with at least three layers (far, middle, near), each with its own value and its own speed of motion, like parallax.","- Give it strong value structure and saturated color: clear lights and darks, all four palette colors visible, not one flat mid-tone or a single hue.","Paint in two passes, the way the built-in Poppy Hill in the Wind does. It is the quality bar, and its full source is at the end of this brief:","- A subject function paints the scene plainly: forms, light, and depth in continuous color, with no style yet. Poppy Hill's base() draws the sky, clouds, hills, grass, and poppies.","- A style pass re-renders the subject in the medium by resampling it, so the style shapes every pixel. Poppy Hill's dabLayer() cuts the window into jittered, oriented brush dabs; each dab takes one color from the subject, dab direction follows the form (level in the sky, upright and wind-bent in the grass), and two offset dab layers overlap with bristle streaks.","- Never draw flat smoothstep shapes and lay sine stripes or noise on top as texture. That reads as clip art however many layers it has.","- The style pass calls the subject once or twice per pixel, so keep the subject cheap.","Style passes that work:","- Painterly (impressionism, Van Gogh, oil, gouache): dab resampling like Poppy Hill. Set each dab's angle from the form or a flow field (for Van Gogh, the tangent of the swirling sky), make dabs larger and longer for bolder styles, shift each dab's color slightly toward a neighboring palette color for broken color, and shade dab edges for impasto.","- Pointillism: a staggered dot grid; each dot takes the subject's color at its center, snapped to pure palette colors with occasional complementary dots.","- Watercolor: warp the subject lookup with fbm so colors bleed, darken edges where the subject's color changes, add pigment granulation and paper grain, and leave light areas as bare paper.","- Claymation and soft 3D: model the subject as SDF shapes with height, light it from normals (key light, soft fill, rim, contact shadows, ambient occlusion), perturb the normals with thumbprint noise, soften the far layer like shallow depth of field, and step time at 12 frames per second for stop motion.","- Woodcut, linocut, ukiyo-e: posterize the subject into three or four flat inks with bold outlines, then carve lines whose direction follows the forms and whose spacing follows value; ukiyo-e adds soft bokashi gradients.","- Pixel art: sample the subject on a coarse grid, snap to the palette, and use ordered dithering.","It should feel alive, not like a still gradient:","- Continuous, visible motion at the default speed: things drift, flow, orbit, or fall. Layer at least two motions at different speeds.","- Agents (u_agents) are characters in the concept, not generic dots: give working agents movement or trails and let waiting agents pulse or call out.","- Ripples (u_ripples) are events in the concept, like splashes, bursts, or gusts. Errors (kind 1) read red or alarming.","- The cursor (u_pointer) disturbs the scene nearby.","- Stay readable behind text: the motion can be lively, but keep value contrast gentle where panels usually sit. Never fade, blank, lighten, or tint a region to match a panel's current position; fix readability in the composition itself.","Steps:","1. Research the style before designing anything. Search the web for the artwork, artist, or medium and how it is made, then download one or two reference images into your working directory and open them. Write a short style sheet: the three to five traits that make the style recognizable at a glance (mark shape and size, stroke direction, edges, lighting, texture, color relationships), each paired with the shader technique that will produce it. If you cannot search or view images, work from what you know and say so.","2. Call the ambient tool with action=get to read the shader contract and the current scene, and action=library to see recent scenes; make something clearly different from them.","3. Write the scene with action=set. Name it evocatively in under 40 characters, and expose 3 to 6 params someone would enjoy tuning (for example speed of a motion, density, glow, trail length).","4. If set reports a compile error or that the scene is too heavy, fix the GLSL and set it again.","5. Call action=look with ripple=done. Its first image is the scene behind bb's real UI as the user sees it, with text drawn as bars; judge that image, not the raw scene. Write a short, honest critique that answers each question:","   - Could someone name the concept from the open areas alone within two seconds?","   - Put it next to your reference images: would someone who knows the style name it? What are the three biggest differences from the references and from Poppy Hill's finish?","   - Are there three layers of depth, clear lights and darks, and all four palette colors?","   - Is the text readable? The report counts words the scene made harder to read and outlines them in red.","   - Does the report flag anything (too faint, nearly still, too heavy, hidden subject, hard to read)?","   Then fix the weakest answer with action=set and look again. A report that flags nothing only rules out technical failures; it does not mean the scene is good. Revise at least twice after the first look unless every answer is a clear yes, and stop after six looks.","6. Call action=save so the scene lands in the library.","If set says no bb window verified the scene, stop and say so instead of saving.","Finish with one sentence describing the scene, and one sentence on what you would still improve.","","Poppy Hill in the Wind, the quality bar. Study how base() and dabLayer() work together; do not reuse its subject:",uu].join(`
`)}s(du,"dailyPrompt");import{defineRpcContract as ld}from"@get-bb/plugin-sdk";var ht=f.string().regex(Pp),gt=f.tuple([ht,ht,ht,ht]),pd=f.object({id:f.string().regex(Wr),label:f.string().min(1).max(40),min:f.number().finite(),max:f.number().finite(),step:f.number().positive().finite(),value:f.number().finite()}).refine(e=>e.max>e.min,"max must exceed min"),Re=f.object({name:f.string().min(1).max(60),source:f.string().min(1).max(32e3),params:f.array(pd).max(12).refine(e=>new Set(e.map(t=>t.id)).size===e.length,"param ids must be unique"),palette:gt,baseId:f.string().optional()}),oo=f.string().trim().min(1).max(60).regex(/^[^\p{Cc}\p{Cf}]+$/u,"scene names must be a single line of plain text"),ro=f.string().trim().min(3).max(400).regex(/^[^\p{Cc}\p{Cf}]+$/u,"describe the scene in a single line of plain text");function Op(e){return ce.find(t=>t.key===e)}s(Op,"controlSpec");function mu(e){let t=Op(e);return f.number().min(t.min).max(t.max)}s(mu,"controlRange");var fd={enabled:f.boolean(),showThrough:mu("showThrough"),speed:mu("speed"),glass:mu("glass")},Ne=f.object(fd);function hu(e){let t=Op(e);return f.number().finite().catch(t.default).transform(o=>Zp(t,o))}s(hu,"storedControl");var Ap=f.object({enabled:f.boolean().catch(!0),showThrough:hu("showThrough"),speed:hu("speed"),glass:hu("glass")}),vu=f.object({kind:f.enum(["builtIn","saved"]),id:f.string().min(1)}),he=f.object({revision:f.number().int().nonnegative(),sceneRevision:f.number().int().nonnegative(),scene:Re,ref:vu.nullable(),controls:Ne}),bu=f.object({id:f.string().min(1),scene:Re,original:Re.optional(),savedAt:f.number().int().nonnegative()}),Cp=f.object({values:f.record(f.string(),f.number().finite()),palette:gt,scene:Re.optional()}),jp=f.array(f.object({id:f.string().min(1),name:f.string(),savedAt:f.number().int().nonnegative()})),Rp=f.enum(["done","error","started"]),dd=f.object({working:f.number().int().nonnegative(),waiting:f.number().int().nonnegative()}),md=f.object({fromBackground:f.number().min(0).max(1),spread:f.number().min(0).max(1),motion:f.number().min(0).max(1),frameMs:f.number().min(0).max(1e4),detail:f.number().min(0).max(1)}),hd=f.object({width:f.number().positive(),height:f.number().positive(),panels:f.array(f.object({x0:f.number(),y0:f.number(),x1:f.number(),y1:f.number()})).max(64),openArea:f.number().min(0).max(1),openSpread:f.number().min(0).max(1),coveredSpread:f.number().min(0).max(1),text:f.object({words:f.number().int().nonnegative(),median:f.number().nonnegative(),worst:f.number().nonnegative(),hardToRead:f.number().int().nonnegative(),examples:f.array(f.object({x:f.number(),y:f.number(),contrast:f.number()})).max(3)})}),gd=f.object({dataUrl:f.string().max(8e6).startsWith("data:image/png;base64,"),report:hd}),xd=f.object({requestId:f.string().min(1),dataUrl:f.string().max(6e6).startsWith("data:image/png;base64,"),summary:dd,visibility:md,dark:f.boolean(),context:gd.optional()}).strict(),Gr=f.string().min(1).max(64).refine(e=>{try{return new Intl.DateTimeFormat("en-US",{timeZone:e}),!0}catch{return!1}},"unknown time zone"),Tp=f.object({enabled:f.boolean(),hour:f.number().int().min(0).max(23),timeZone:Gr,automationId:f.string().nullable(),nextRunAt:f.number().nullable(),lastRunAt:f.number().nullable()}),yu=f.object({enabled:f.boolean(),hour:f.number().int().min(0).max(23),timeZone:Gr}).partial().strict(),Np=ld({state:{input:f.null(),output:he},setValues:{input:f.object({values:f.record(f.string(),f.number().finite())}).strict(),output:he},setPalette:{input:f.object({palette:gt}).strict(),output:he},setControls:{input:Ne.partial().strict(),output:he},loadScene:{input:f.object({id:f.string().min(1)}).strict(),output:he},resetScene:{input:f.object({id:f.string().min(1)}).strict(),output:he},saveScene:{input:f.object({name:oo.optional()}).strict(),output:f.object({id:f.string()})},deleteScene:{input:f.object({id:f.string().min(1)}).strict(),output:f.object({deleted:f.boolean()})},library:{input:f.null(),output:f.object({entries:f.array(f.object({id:f.string(),name:f.string(),builtIn:f.boolean(),tweaked:f.boolean()}))})},reportCompile:{input:f.object({sceneRevision:f.number().int().nonnegative(),ok:f.boolean(),log:f.string().max(8e3).optional()}).strict(),output:f.object({accepted:f.boolean()})},submitCapture:{input:xd,output:f.object({accepted:f.boolean()})},daily:{input:f.null(),output:Tp},setDaily:{input:yu,output:Tp},paintNow:{input:f.null(),output:f.object({threadId:f.string().nullable()})},paintRequest:{input:f.object({request:ro}).strict(),output:f.object({threadId:f.string()})},heartbeat:{input:f.null(),output:f.object({ok:f.boolean()})}});function Lp(e){return e.issues.map(t=>`${t.path.join(".")||"input"}: ${t.message}`).join(`
`)}s(Lp,"formatIssues");var Hr="state",Dp="daily",xt="library/",Xr="tweaks/",Mp="last-good",Qr="library-index",Fp=6e3,vd=8e3,vt="proj_personal",bd=3*6e4,yd="automations",_d="Ambient: new scene every morning",Up="high",Bp="Paint today's Ambient scene: call the ambient tool with action=brief and follow the instructions it returns.",wd=f.object({automationId:f.string().nullable().catch(null),hour:f.number().int().min(0).max(23).catch(8),timeZone:Gr.catch(()=>Intl.DateTimeFormat().resolvedOptions().timeZone)}),qp=f.object({id:f.string(),enabled:f.boolean(),trigger:f.object({triggerType:f.string(),cron:f.string().optional(),timezone:f.string().optional()}),nextRunAt:f.number().nullable(),lastRunAt:f.number().nullable()}),Wp=f.object({providerId:f.string().min(1),model:f.string().min(1),reasoningLevel:f.string().min(1)});function wu(e,t){let o=Object.keys(t).filter(r=>!e.params.some(n=>n.id===r));if(o.length>0)throw new Error(`unknown param ${o.map(r=>JSON.stringify(r)).join(", ")}; scene params are ${e.params.map(r=>r.id).join(", ")||"none"}`);return{...e,params:e.params.map(r=>Object.hasOwn(t,r.id)?{...r,value:Math.min(r.max,Math.max(r.min,t[r.id]))}:r)}}s(wu,"applyValues");function Jp(e,t){let o=s(r=>JSON.stringify([r.name,r.source,r.palette,r.params.map(n=>[n.id,n.label,n.min,n.max,n.step,n.value])]),"key");return o(e)===o(t)}s(Jp,"sameScene");function kd(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"scene"}s(kd,"slugOf");function Yp(e,t,o){if(!t.has(e.toLowerCase()))return e;let r=2;for(;t.has(`${e}${o}${r}`.toLowerCase());)r+=1;return`${e}${o}${r}`}s(Yp,"nextFree");function Vp(e,t){let o=new Set([...me,...t].map(r=>r.name.toLowerCase()));return o.has(e.toLowerCase())?Yp(e.slice(0,56),o," "):e}s(Vp,"uniqueName");function zd(e,t){return Yp(kd(e),new Set([...me,...t].map(o=>o.id)),"-")}s(zd,"uniqueId");function _u(e){return typeof e=="object"&&e!==null}s(_u,"isRecord");function $d(){return{revision:1,sceneRevision:1,scene:Vr,ref:{kind:"builtIn",id:Vr.baseId},controls:Jr}}s($d,"initialState");function Kp(e){let t=e.storage.kv,o=new Map,r=new Map,n=0,i=Promise.resolve();function a(m){let h=i.then(m,m);return i=h.catch(()=>{}),h}s(a,"serialized");async function c(){let m=jp.safeParse(await t.get(Qr));if(m.success)return m.data;let h=await t.list(xt),w=(await Promise.all(h.map(Z=>t.get(Z)))).map(Z=>bu.safeParse(Z)).flatMap(Z=>Z.success?[{id:Z.data.id,name:Z.data.scene.name,savedAt:Z.data.savedAt}]:[]).sort((Z,T)=>T.savedAt-Z.savedAt);return await t.set(Qr,w),w}s(c,"readIndex");async function u(m){let h=bu.safeParse(await t.get(`${xt}${m}`));return h.success?h.data:null}s(u,"readEntry");async function l(m){let h=me.find(w=>w.name===m.name);if(h)return{kind:"builtIn",id:h.id};let b=(await c()).find(w=>w.name===m.name);return b?{kind:"saved",id:b.id}:null}s(l,"deriveRef");async function d(){let m=await t.get(Hr);if(m===void 0)return $d();let h=_u(m)?m:{},b=f.number().int().nonnegative().safeParse(h.revision),w=f.number().int().nonnegative().safeParse(h.sceneRevision),Z=Re.safeParse(h.scene),T=vu.nullable().safeParse(h.ref),j=Ap.safeParse(h.controls??{});(!b.success||!Z.success)&&e.log.warn("Ambient state failed validation; keeping the parts that still parse");let D=Z.success?Yr(Z.data):Vr,ue=b.success?b.data:1;return{revision:ue,sceneRevision:w.success?w.data:ue,scene:D,ref:Z.success&&T.success&&"ref"in h?T.data:await l(D),controls:j.success?j.data:Jr}}s(d,"readState");async function g(m,h){let b=await d(),w=he.parse({...m,revision:b.revision+1,sceneRevision:h.sceneChanged?b.revision+1:b.sceneRevision});return await t.set(Hr,w),e.realtime.publish("state",{revision:w.revision,sceneRevision:w.sceneRevision}),w}s(g,"writeState");function v(m,h){return a(async()=>{let b=await g(await m(await d()),h);return h.autosave&&await P(b),b})}s(v,"update");function y(){return a(async()=>{let m=await t.get(Hr);if(!_u(m))return;(!("ref"in m)||_u(m.controls)&&"quality"in m.controls)&&await t.set(Hr,he.parse(await d()))})}s(y,"migrate");async function P(m){let{scene:h,ref:b}=m;if(!b||o.has(m.sceneRevision))return;if(b.kind==="builtIn"){let Z=`${Xr}${b.id}`,T=await t.get(Z)===void 0;await t.set(Z,{values:Object.fromEntries(h.params.map(j=>[j.id,j.value])),palette:h.palette,...h.baseId===b.id?{}:{scene:h}}),T&&e.realtime.publish("library",{id:b.id});return}let w=await u(b.id);!w||Jp(w.scene,h)||(await t.set(`${xt}${b.id}`,{...w,original:w.original??w.scene,scene:h}),w.original===void 0&&e.realtime.publish("library",{id:b.id}))}s(P,"autosave");async function X(m){let h=m.trim().toLowerCase(),b=me.find(T=>T.id===h||T.name.toLowerCase()===h);if(b){let T={kind:"builtIn",id:b.id},j=eo(b),D=Cp.safeParse(await t.get(`${Xr}${b.id}`));if(!D.success)return{scene:j,ref:T};if(D.data.scene)return{scene:D.data.scene,ref:T};let ue=Object.fromEntries(Object.entries(D.data.values).filter(([ge])=>j.params.some(te=>te.id===ge)));return{scene:{...wu(j,ue),palette:D.data.palette},ref:T}}let w=(await u(m.trim()))?.id??(await c()).find(T=>T.name.toLowerCase()===h)?.id,Z=w?await u(w):null;if(!Z)throw new Error(`no scene matches ${JSON.stringify(m)}`);return{scene:Yr(Z.scene),ref:{kind:"saved",id:Z.id}}}s(X,"resolveScene");function L(m){return v(async h=>({...h,...await X(m)}),{sceneChanged:!0})}s(L,"loadScene");function bt(m){return a(async()=>{let h=await d(),b=me.find(j=>j.id===m);if(b)return await t.delete(`${Xr}${b.id}`),e.realtime.publish("library",{id:b.id}),g({scene:eo(b),ref:{kind:"builtIn",id:b.id},controls:Jr},{sceneChanged:!0});let w=await u(m);if(!w)throw new Error(`no scene matches ${JSON.stringify(m)}`);let{original:Z,...T}=w;if(!Z)throw new Error(`${w.scene.name} has no edits to reset`);return await t.set(`${xt}${m}`,{...T,scene:Z}),e.realtime.publish("library",{id:m}),g({...h,scene:Yr(Z),ref:{kind:"saved",id:m}},{sceneChanged:!0})})}s(bt,"resetScene");function en(m){return a(async()=>{let h=await d(),b=await c(),w=m??h.scene.name,Z=h.ref?.kind==="saved"?b.find(yt=>yt.id===h.ref.id):void 0,T=Z&&Z.name.toLowerCase()===w.toLowerCase()?Z:void 0,j=T?w:Vp(w,b),D=T?.id??zd(j,b),ue={...h.scene,name:j},ge=T?await u(D):null,te=ge?.original??(ge&&!Jp(ge.scene,ue)?ge.scene:void 0),Le=Date.now();return await t.set(`${xt}${D}`,{id:D,scene:ue,...te?{original:te}:{},savedAt:Le}),await t.set(Qr,[{id:D,name:j,savedAt:Le},...b.filter(yt=>yt.id!==D)]),e.realtime.publish("library",{id:D}),await g({...h,scene:ue,ref:{kind:"saved",id:D}},{sceneChanged:!1}),D})}s(en,"saveScene");function Q(m){return a(async()=>{let h=`${xt}${m}`;if(await t.get(h)===void 0)return!1;await t.delete(h),await t.set(Qr,(await c()).filter(w=>w.id!==m)),e.realtime.publish("library",{id:m});let b=await d();return b.ref?.kind==="saved"&&b.ref.id===m&&await g({...b,ref:null},{sceneChanged:!1}),!0})}s(Q,"deleteScene");async function R(){let m=await c();return[...await Promise.all(me.map(async h=>({id:h.id,name:h.name,builtIn:!0,tweaked:await t.get(`${Xr}${h.id}`)!==void 0}))),...await Promise.all(m.map(async h=>({id:h.id,name:h.name,builtIn:!1,tweaked:(await u(h.id))?.original!==void 0})))]}s(R,"library");function M(m){return new Promise(h=>{let b=setTimeout(()=>{o.delete(m),h(null)},Fp);o.set(m,w=>{clearTimeout(b),o.delete(m),h(w)})})}s(M,"awaitCompile");function no(m,h){return a(async()=>{let b=await d();b.sceneRevision===m&&await g({...b,scene:h.scene,ref:h.ref},{sceneChanged:!0})})}s(no,"revert");async function io(m){let h=m.source!==void 0||m.params!==void 0,{previous:b,next:w,compiled:Z}=await a(async()=>{let j=await d(),D=m.name!==void 0&&m.name!==j.scene.name,{baseId:ue,...ge}=j.scene,te={...h?ge:j.scene,...D?{name:Vp(m.name,await c())}:{},...m.source===void 0?{}:{source:m.source},...m.palette===void 0?{}:{palette:m.palette},...m.params===void 0?{}:{params:m.params.map(ao=>({...ao,step:ao.step??(ao.max-ao.min)/100}))}};if(m.values&&(te=wu(te,m.values)),te=Re.parse(te),h&&!/\bvec3\s+scene\s*\(/.test(te.source))throw new Error("source must define vec3 scene(vec2 uv, vec2 p)");let Le=await g({scene:te,ref:D?null:j.ref,controls:Ne.parse({...j.controls,...m.controls})},{sceneChanged:h}),yt=h?M(Le.sceneRevision):null;return h||await P(Le),{previous:j,next:Le,compiled:yt}});if(!Z)return w;let T=await Z;if(!T?.ok)throw await no(w.sceneRevision,b),new Error(T===null?`No visible bb window verified ${w.scene.name} within ${Fp/1e3}s, so it was not applied. Ask the user to bring bb to the foreground and try again.`:`The scene was not applied; the previous scene was restored.
${T.log??""}`);return a(async()=>{await t.set(Mp,w.scene);let j=await d();return j.sceneRevision===w.sceneRevision&&await P(j),j})}s(io,"editScene");async function tn(m,h){n=Date.now();let b=o.get(m);return b?(b(h),!0):h.ok?(await a(async()=>{let w=await d();w.sceneRevision===m&&await t.set(Mp,w.scene)}),!0):!1}s(tn,"reportCompile");function Qp(m){return new Promise(h=>{let b=setTimeout(()=>{r.delete(m.requestId),h(null)},vd);r.set(m.requestId,w=>{clearTimeout(b),r.delete(m.requestId),h(w)}),e.realtime.publish("capture",m)})}s(Qp,"capture");function ef(m,h){n=Date.now();let b=r.get(m);return b?.(h),b!==void 0}s(ef,"submitCapture");function tf(){n=Date.now()}s(tf,"heartbeat");async function on(){let m=wd.safeParse(await t.get(Dp)??{});return m.success?m.data:{automationId:null,hour:8,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}}s(on,"readStoredDaily");function so(m,h,b){return e.sdk.plugins.callRpc({pluginId:yd,method:m,input:h,outputSchema:b})}s(so,"automations");async function rn(m){if(!m)return null;let b=(await so("automations_list",{projectId:vt},f.array(f.unknown()))).find(Z=>f.object({id:f.literal(m)}).safeParse(Z).success);if(b===void 0)return null;let w=qp.safeParse(b);if(!w.success)throw new Error("The daily scene automation can't be read. Check it in Automations.");return w.data}s(rn,"readAutomation");async function nn(){let m=await on(),h=await rn(m.automationId);return{enabled:h?.enabled??!1,hour:to(h?.trigger.cron)??m.hour,timeZone:h?.trigger.timezone??m.timeZone,automationId:h?.id??null,nextRunAt:h?.nextRunAt??null,lastRunAt:h?.lastRunAt??null}}s(nn,"readDaily");async function of(){let m=Wp.safeParse(await e.sdk.projects.defaultExecutionOptions({projectId:vt}));if(m.success)return m.data;let[h]=await e.sdk.threads.list({projectId:vt,limit:1});if(h){let b=Wp.omit({providerId:!0}).safeParse(await e.sdk.threads.defaultExecutionOptions({threadId:h.id}));if(b.success)return{providerId:h.providerId,...b.data}}throw new Error("Start a thread in your personal workspace first so bb knows which agent to use.")}s(of,"agentDefaults");async function rf(m,h){let b=await of();return(await so("automations_create",{projectId:vt,name:_d,enabled:!0,origin:"app",trigger:{triggerType:"schedule",cron:Kr(m),timezone:h},execution:{mode:"agent",prompt:Bp,providerId:b.providerId,model:b.model,reasoningLevel:Up,permissionMode:"auto",environment:{type:"project-default"}}},qp)).id}s(rf,"createDailyAutomation");function nf(m){return a(async()=>{let h=await on(),b=await rn(h.automationId),w=m.hour??to(b?.trigger.cron)??h.hour,Z=m.timeZone??b?.trigger.timezone??h.timeZone;if(!b&&m.enabled)b=await rn(await rf(w,Z));else if(b){let T={projectId:vt,automationId:b.id};(to(b.trigger.cron)!==w||b.trigger.timezone!==Z)&&await so("automations_update",{...T,trigger:{triggerType:"schedule",cron:Kr(w),timezone:Z}},f.unknown()),m.enabled!==void 0&&m.enabled!==b.enabled&&await so(m.enabled?"automations_resume":"automations_pause",T,f.unknown())}return await t.set(Dp,{automationId:b?.id??null,hour:w,timeZone:Z}),e.realtime.publish("daily",{automationId:b?.id??null}),nn()})}s(nf,"updateDaily");async function sf(m){return(await e.sdk.threads.spawn({projectId:vt,environment:{type:"project-default"},permissionMode:"auto",reasoningLevel:Up,title:m?`Ambient: ${m.length>48?`${m.slice(0,47)}\u2026`:m}`:"Ambient: today's scene",prompt:m?`Paint a new Ambient scene the user described: ${JSON.stringify(m)}. Call the ambient tool with action=brief and request set to exactly that text, then follow the instructions it returns.`:Bp})).id}s(sf,"spawnPainter");async function af(m,h){if(m.getTime()-n>bd)return"No bb window is open, so the scene can't be checked. Stop now without changing the scene and say it was skipped because bb wasn't open.";let{timeZone:b}=await nn().catch(()=>on());return du(pu(b,m),b,h)}return s(af,"brief"),y().catch(m=>{e.log.warn(`Ambient could not migrate its saved state: ${m instanceof Error?m.message:String(m)}`)}),{readState:d,editScene:io,setControls:s(m=>v(h=>({...h,controls:Ne.parse({...h.controls,...m})}),{sceneChanged:!1}),"setControls"),loadScene:L,resetScene:bt,saveScene:en,deleteScene:Q,library:R,reportCompile:tn,capture:Qp,submitCapture:ef,heartbeat:tf,readDaily:nn,updateDaily:nf,spawnPainter:sf,brief:af}}s(Kp,"createOperations");function ku(e,t){let o=s(a=>`${Math.round(a*100)}%`,"percent"),r=`Measured against bb's ${t?"dark":"light"} background: ${o(e.fromBackground)} average color difference, ${o(e.spread)} brightness variation, ${(e.motion*100).toFixed(1)}% change over one second. One frame takes ${e.frameMs.toFixed(1)} ms to render at ${o(e.detail)} detail.`,n=[e.fromBackground<.06&&"the scene is nearly the same color as bb's background, so it will be close to invisible behind bb's veil",e.spread<.025&&"the scene is almost flat, with little visible structure"].filter(Boolean),i=[n.length>0&&`Too faint: ${n.join("; ")}. The veil already adapts to the theme, so do not darken or wash out the scene yourself; raise its contrast and color.`,e.motion<.0025&&"Nearly still: almost nothing moved in a second at the user's speed. Give the scene visible, continuous motion.",e.frameMs>8&&"Too heavy: frames should render in under 8 ms or bb slows down. Use fewer loop iterations and fbm octaves, and never call fbm inside the per-agent or per-ripple loops."].filter(Boolean);return[r,...i].join(" ")}s(ku,"describeVisibility");function zu(e){let t=s(c=>`${Math.round(c*100)}%`,"percent"),o=s((c,u)=>`${c.toFixed(2)}\u2013${u.toFixed(2)}`,"range"),r=e.panels.map(c=>`x ${o(c.x0,c.x1)}, y ${o(c.y0,c.y1)}`).join("; "),{text:n}=e,i=[`The first image is the scene as the user sees it: behind bb's real panels and frosted glass, with each word of bb's text drawn as a bar in its real color and position, in a ${Math.round(e.width)}\xD7${Math.round(e.height)} window. Judge the scene by that image. The second image is the raw scene.`,`bb's panels cover ${t(1-e.openArea)} of the window, at uv (y up): ${r||"none"}. Under them the scene is blurred and tinted, so only big shapes and color fields read there; the rest of the window shows the scene clearly. These positions hold only for this window: the sidebar collapses and windows resize, so never mask, fade, or tint the scene to fit them. Brightness variation is ${t(e.openSpread)} in the open areas and ${t(e.coveredSpread)} under the panels.`,n.words>0?`Text over the scene: ${n.words} words checked, median contrast ${n.median.toFixed(1)}:1, worst 5% ${n.worst.toFixed(1)}:1. ${n.hardToRead} ${n.hardToRead===1?"word is":"words are"} harder to read because of the scene (outlined in red)${n.examples.length>0?`, for example ${n.examples.map(c=>`a word at uv (${c.x.toFixed(2)}, ${c.y.toFixed(2)}), ${c.contrast.toFixed(1)}:1`).join("; ")}`:""}.`:"No text was visible to check."],a=[e.openSpread<.04&&"Hidden subject: the parts of the window people actually see are nearly flat, so the scene's detail is sitting behind bb's panels. Move the subject, horizon, and characters into the open areas and fill the frame edge to edge.",n.words>0&&n.hardToRead/n.words>.02&&"Hard to read: the scene fights the text above it. Calm the value contrast and fine detail in that part of the composition, especially where the red outlines are, without fading or masking the panel's area."].filter(Boolean);return[...i,...a].join(`
`)}s(zu,"describeContext");var Pd=new Set(["detail","quality"]);function $u(e){let t=ce.map(o=>`${o.label} ${o.format(e[o.key])}`);return`${e.enabled?"on":"off"}; ${t.join(", ")}`}s($u,"describeControls");function Gp(e,t){let{scene:o,controls:r}=e,n=o.params.map(i=>`  ${i.id} = ${i.value}  (${i.label}; ${i.min}..${i.max}, step ${i.step})`).join(`
`);return[`Scene: ${o.name}`,`Palette: ${o.palette.join(" ")}`,`Params:
${n||"  (none)"}`,`Controls: ${$u(r)}`,...t.source?[`Source:
${o.source}`]:[]].join(`
`)}s(Gp,"describeScene");var Zd=f.object({enabled:f.boolean(),...Object.fromEntries(ce.map(e=>[e.name,Ne.shape[e.key].describe(`${e.describe} (${e.min}..${e.max}, default ${e.default})`)]))}).partial().strict();function Id(e){let t={};typeof e.enabled=="boolean"&&(t.enabled=e.enabled);for(let o of ce){let r=e[o.name];typeof r=="number"&&(t[o.key]=r)}return t}s(Id,"controlsFromInput");var Ed=new Map(ce.flatMap(e=>[e.name,...e.aliases].map(t=>[t,e.key]))),Hp=ce.map(e=>e.name).join("|");function Td(e){let t={},o={};for(let r of e){let n=/^([a-z][a-z0-9_]*)=(-?\d+(?:\.\d+)?)(%?)$/.exec(r);if(!n)throw new Error(`expected <param>=<number>, got ${JSON.stringify(r)}`);let[,i,a,c]=n;if(Pd.has(i))throw new Error("Detail is set per device, in the Display section of the Ambient panel");let u=Ed.get(i),l=Number(a)/(c?100:1);u?o[u]=l:t[i]=l}return{values:t,controls:o}}s(Td,"parseSetPairs");function Xp(e){return e instanceof f.ZodError?Lp(e):e instanceof Error?e.message:String(e)}s(Xp,"messageOf");function Od(e){let t=Kp(e);async function o(){return(await t.library()).map(r=>`${r.id}  ${r.name}${r.builtIn?"  (built-in)":""}`)}s(o,"libraryLines"),e.rpc.register(Np,{state:s(()=>t.readState(),"state"),setValues:s(({values:r})=>t.editScene({values:r}),"setValues"),setPalette:s(({palette:r})=>t.editScene({palette:r}),"setPalette"),setControls:s(r=>t.setControls(r),"setControls"),loadScene:s(({id:r})=>t.loadScene(r),"loadScene"),resetScene:s(({id:r})=>t.resetScene(r),"resetScene"),async saveScene({name:r}){return{id:await t.saveScene(r)}},async deleteScene({id:r}){return{deleted:await t.deleteScene(r)}},async library(){return{entries:await t.library()}},async reportCompile({sceneRevision:r,ok:n,log:i}){return{accepted:await t.reportCompile(r,{ok:n,...i===void 0?{}:{log:i}})}},submitCapture({requestId:r,context:n,...i}){return{accepted:t.submitCapture(r,{...i,context:n??null})}},daily:s(()=>t.readDaily(),"daily"),setDaily:s(r=>t.updateDaily(r),"setDaily"),async paintNow(){return{threadId:await t.spawnPainter()}},async paintRequest({request:r}){return{threadId:await t.spawnPainter(r)}},heartbeat(){return t.heartbeat(),{ok:!0}}}),e.agents.registerTool({name:"ambient",description:"Read, rewrite, and look at the Ambient scene: the live GLSL background bb paints behind its UI, driven by what the user's agents are doing. The user tunes it with sliders generated from the params you declare.",instructions:"When the user asks to change bb's ambient background, call ambient action=get first for the shader contract and current source, then action=set, then action=look to see the result before describing it. Expose the knobs a person would want to play with as params rather than hard-coding them. To make the background subtler or bolder without rewriting the scene, use action=set with controls.visibility. When the user describes a new scene they want, call action=brief with request set to their words and follow the instructions it returns.",presentation:{label:{pending:"Painting the ambient scene",completed:"Painted the ambient scene"}},parameters:f.object({action:f.enum(["get","set","look","library","load","save","delete","brief"]).describe("get: shader contract + current scene. set: replace any of name/source/params/palette, nudge values, or change controls. look: capture the scene behind bb's real UI as the user sees it, plus the raw scene, with readability and visibility checks. library/load/save/delete: manage saved scenes. brief: step-by-step instructions for painting a new scene; pass request to paint what the user described, or omit it for today's daily concept."),name:oo.optional().describe("scene name (set, save); on set, omit it to edit the open scene, or pass a new name to start a new scene"),source:f.string().max(32e3).optional().describe("GLSL defining vec3 scene(vec2 uv, vec2 p); see action=get"),params:f.array(f.object({id:f.string().regex(Wr),label:f.string().min(1).max(40),min:f.number(),max:f.number(),step:f.number().positive().optional(),value:f.number()})).max(12).optional().describe("full slider list; each becomes uniform float p_<id>"),values:f.record(f.string(),f.number()).optional().describe("set existing param values by id"),palette:f.array(ht).length(4).optional().describe("four #rrggbb colors"),controls:Zd.optional().describe("user display controls; render resolution is set per device and is not available here"),ripple:Rp.optional().describe("look: fire a test ripple of this kind just before capturing"),id:f.string().optional().describe("scene id or name for action=load and action=delete"),request:ro.optional().describe("brief: the user's own description of the scene to paint, in their words")}),async execute(r){let n=s(i=>({content:[{type:"text",text:i}],isError:!0}),"error");try{switch(r.action){case"get":return`${Ip}

---
${Gp(await t.readState(),{source:!0})}`;case"library":return(await o()).join(`
`);case"brief":return t.brief(new Date,r.request);case"load":return r.id?`Loaded ${(await t.loadScene(r.id)).scene.name}.`:n("action=load needs an id");case"save":return`Saved as ${await t.saveScene(r.name)}.`;case"delete":return r.id?await t.deleteScene(r.id)?`Deleted ${r.id}.`:n(`no saved scene ${JSON.stringify(r.id)}; built-in scenes cannot be deleted`):n("action=delete needs an id");case"look":{let i=await t.capture({requestId:Sd(),ripple:r.ripple??null});if(!i)return n("No visible bb window answered. The user needs bb open in the foreground with Ambient enabled.");let{working:a,waiting:c}=i.summary,u=s(l=>({type:"image",data:l.slice(22),mimeType:"image/png"}),"png");return{content:[...i.context?[u(i.context.dataUrl)]:[],u(i.dataUrl),{type:"text",text:[i.context?zu(i.context.report):"Captured the raw scene only; this bb window could not draw its UI over it.",`Live agents: ${a} working, ${c} waiting. ${ku(i.visibility,i.dark)}`].join(`
`)}]}}case"set":{let i=r.source!==void 0||r.params!==void 0,a=await t.editScene({...r.name===void 0?{}:{name:r.name},...r.source===void 0?{}:{source:r.source},...r.params===void 0?{}:{params:r.params},...r.palette===void 0?{}:{palette:gt.parse(r.palette)},...r.values===void 0?{}:{values:r.values},controls:Id(r.controls??{})});return i?`Compiled and live: ${a.scene.name} with ${a.scene.params.length} sliders.`:`Updated ${a.scene.name}. Controls: ${$u(a.controls)}.`}}}catch(i){return n(Xp(i))}}}),e.cli.register({name:"ambient",summary:"Control bb's generative ambient background",commands:[{name:"status",summary:"Show the active scene, its params, and controls",usage:"bb ambient status"},{name:"list",summary:"List built-in and saved scenes",usage:"bb ambient list"},{name:"load",summary:"Make a built-in or saved scene active",usage:"bb ambient load <id-or-name>"},{name:"reset",summary:"Restore a scene's original version: a built-in's shader, sliders, colors, and default display settings, or a saved scene as first saved",usage:"bb ambient reset <scene-id>"},{name:"set",summary:`Set scene params or the ${ce.map(r=>r.label).join(", ")} controls`,usage:`bb ambient set <param|${Hp}>=<value>[%] [...]`},{name:"palette",summary:"Set the scene's four colors",usage:"bb ambient palette <#rrggbb> <#rrggbb> <#rrggbb> <#rrggbb>"},{name:"save",summary:"Save the active scene to the library",usage:"bb ambient save [name]"},{name:"delete",summary:"Remove a saved scene from the library",usage:"bb ambient delete <id>"},{name:"on",summary:"Turn the background on",usage:"bb ambient on"},{name:"off",summary:"Turn the background off",usage:"bb ambient off"},{name:"paint",summary:"Start a thread where an agent paints the scene you describe",usage:"bb ambient paint <description>"},{name:"daily",summary:"Have an agent paint a new scene every morning",usage:"bb ambient daily <status|on [hour] [time-zone]|off|now>"}],async run(r){let[n,...i]=r,a=i.join(" ").trim(),c=s(u=>({exitCode:0,stdout:`${u}
`}),"ok");try{switch(n){case"status":return c(Gp(await t.readState(),{source:!1}));case"list":return c((await o()).join(`
`));case"load":if(!a)throw new Error("usage: bb ambient load <id-or-name>");return c(`loaded ${(await t.loadScene(a)).scene.name}`);case"set":{if(i.length===0)throw new Error(`usage: bb ambient set <param|${Hp}>=<value>[%] [...]`);let{values:u,controls:l}=Td(i),d=await t.editScene({values:u,controls:l}),g=d.scene.params.filter(v=>Object.hasOwn(u,v.id)).map(v=>`${v.id}=${v.value}`);return Object.keys(l).length>0&&g.push($u(d.controls)),c(g.join(`
`))}case"palette":{let u=gt.parse(i);return await t.editScene({palette:u}),c(`palette ${u.join(" ")}`)}case"save":return c(`saved as ${await t.saveScene(a?oo.parse(a):void 0)}`);case"delete":if(!a)throw new Error("usage: bb ambient delete <id>");if(!await t.deleteScene(a))throw new Error(`no saved scene ${JSON.stringify(a)}; built-in scenes cannot be deleted`);return c(`deleted ${a}`);case"on":case"off":return await t.setControls({enabled:n==="on"}),c(`ambient ${n}`);case"reset":if(!a)throw new Error("usage: bb ambient reset <scene-id>");return c(`reset ${(await t.resetScene(a)).scene.name}`);case"paint":return c(`painting in ${await t.spawnPainter(ro.parse(a))}`);case"daily":{let[u="status",...l]=i;if(u==="now")return c(`painting in ${await t.spawnPainter()}`);if(u==="on"||u==="off")await t.updateDaily(yu.parse({enabled:u==="on",...fu(l)}));else if(u!=="status")throw new Error("usage: bb ambient daily <status|on [hour] [time-zone]|off|now>");let d=await t.readDaily(),g=d.enabled?`on, after ${d.hour}:00 ${d.timeZone} (bb automation ${d.automationId})`:"off",v=d.enabled&&d.nextRunAt?new Date(d.nextRunAt).toISOString():"none";return c(`daily scene: ${g}
next run: ${v}`)}}return{exitCode:1,stderr:`usage: bb ambient <status|list|load|set|palette|save|delete|on|off|reset|paint|daily>
`}}catch(u){return{exitCode:1,stderr:`${Xp(u)}
`}}}}),e.log.info("Ambient loaded")}s(Od,"plugin");export{lu as DAILY_CONCEPTS,wu as applyValues,to as cronHour,Ep as dailyConcept,Kr as dailyCron,du as dailyPrompt,Od as default,zu as describeContext,ku as describeVisibility,pu as localMoment,fu as parseDailyOptions,Td as parseSetPairs,oo as sceneNameSchema,ro as sceneRequestSchema};
//# sourceMappingURL=server.js.map
