var Zl=Object.defineProperty;var i=(e,t)=>Zl(e,"name",{value:t,configurable:!0});var pe=(e,t)=>{for(var o in t)Zl(e,o,{get:t[o],enumerable:!0})};import{randomUUID as Bd}from"node:crypto";var u={};pe(u,{$brand:()=>ln,$input:()=>Es,$output:()=>Rs,NEVER:()=>cn,TimePrecision:()=>Cs,ZodAny:()=>zc,ZodArray:()=>Zc,ZodBase64:()=>Or,ZodBase64URL:()=>Cr,ZodBigInt:()=>vt,ZodBigIntFormat:()=>Lr,ZodBoolean:()=>ht,ZodCIDRv4:()=>Ar,ZodCIDRv6:()=>Tr,ZodCUID:()=>$r,ZodCUID2:()=>Sr,ZodCatch:()=>Yc,ZodCodec:()=>Xt,ZodCustom:()=>Qt,ZodCustomStringFormat:()=>dt,ZodDate:()=>Kt,ZodDefault:()=>Bc,ZodDiscriminatedUnion:()=>Rc,ZodE164:()=>jr,ZodEmail:()=>_r,ZodEmoji:()=>kr,ZodEnum:()=>pt,ZodError:()=>nd,ZodExactOptional:()=>Mc,ZodFile:()=>Dc,ZodFirstPartyTypeKind:()=>ll,ZodFunction:()=>sl,ZodGUID:()=>Ft,ZodIPv4:()=>Rr,ZodIPv6:()=>Er,ZodISODate:()=>vr,ZodISODateTime:()=>hr,ZodISODuration:()=>xr,ZodISOTime:()=>gr,ZodIntersection:()=>Ec,ZodIssueCode:()=>sd,ZodJWT:()=>Nr,ZodKSUID:()=>Ir,ZodLazy:()=>rl,ZodLiteral:()=>Lc,ZodMAC:()=>gc,ZodMap:()=>jc,ZodNaN:()=>Xc,ZodNanoID:()=>zr,ZodNever:()=>Sc,ZodNonOptional:()=>Br,ZodNull:()=>_c,ZodNullable:()=>Uc,ZodNumber:()=>mt,ZodNumberFormat:()=>Ne,ZodObject:()=>Ht,ZodOptional:()=>Ur,ZodPipe:()=>Gt,ZodPrefault:()=>Jc,ZodPreprocess:()=>Qc,ZodPromise:()=>il,ZodReadonly:()=>el,ZodRealError:()=>H,ZodRecord:()=>ut,ZodSet:()=>Nc,ZodString:()=>ft,ZodStringFormat:()=>O,ZodSuccess:()=>Hc,ZodSymbol:()=>yc,ZodTemplateLiteral:()=>ol,ZodTransform:()=>qc,ZodTuple:()=>Tc,ZodType:()=>P,ZodULID:()=>Pr,ZodURL:()=>Jt,ZodUUID:()=>ae,ZodUndefined:()=>wc,ZodUnion:()=>Yt,ZodUnknown:()=>$c,ZodVoid:()=>Pc,ZodXID:()=>Zr,ZodXor:()=>Ic,_ZodString:()=>wr,_default:()=>Wc,_function:()=>gu,any:()=>V0,array:()=>Vt,base64:()=>E0,base64url:()=>A0,bigint:()=>U0,boolean:()=>bc,catch:()=>Gc,check:()=>xu,cidrv4:()=>I0,cidrv6:()=>R0,clone:()=>U,codec:()=>du,coerce:()=>ul,config:()=>L,core:()=>me,cuid:()=>w0,cuid2:()=>_0,custom:()=>bu,date:()=>Y0,decode:()=>uc,decodeAsync:()=>fc,describe:()=>yu,discriminatedUnion:()=>ou,e164:()=>T0,email:()=>p0,emoji:()=>b0,encode:()=>lc,encodeAsync:()=>pc,endsWith:()=>et,enum:()=>Mr,exactOptional:()=>Fc,file:()=>lu,flattenError:()=>Zt,float32:()=>D0,float64:()=>q0,formatError:()=>It,fromJSONSchema:()=>Pu,function:()=>gu,getErrorMap:()=>cd,globalRegistry:()=>M,gt:()=>ie,gte:()=>W,guid:()=>f0,hash:()=>L0,hex:()=>N0,hostname:()=>j0,httpUrl:()=>x0,includes:()=>Xe,instanceof:()=>_u,int:()=>br,int32:()=>M0,int64:()=>B0,intersection:()=>Ac,invertCodec:()=>mu,ipv4:()=>S0,ipv6:()=>Z0,iso:()=>lt,json:()=>zu,jwt:()=>O0,keyof:()=>G0,ksuid:()=>$0,lazy:()=>nl,length:()=>Ce,literal:()=>cu,locales:()=>Nt,looseObject:()=>eu,looseRecord:()=>nu,lowercase:()=>Ye,lt:()=>ne,lte:()=>Q,mac:()=>P0,map:()=>iu,maxLength:()=>Oe,maxSize:()=>ke,meta:()=>wu,mime:()=>tt,minLength:()=>de,minSize:()=>se,multipleOf:()=>_e,nan:()=>fu,nanoid:()=>y0,nativeEnum:()=>au,negative:()=>ir,never:()=>Dr,nonnegative:()=>ar,nonoptional:()=>Vc,nonpositive:()=>sr,normalize:()=>ot,null:()=>kc,nullable:()=>Bt,nullish:()=>uu,number:()=>xc,object:()=>X0,optional:()=>Ut,overwrite:()=>re,parse:()=>ic,parseAsync:()=>sc,partialRecord:()=>ru,pipe:()=>yr,positive:()=>nr,prefault:()=>Kc,preprocess:()=>$u,prettifyError:()=>kn,promise:()=>vu,property:()=>cr,readonly:()=>tl,record:()=>Cc,refine:()=>al,regex:()=>He,regexes:()=>X,registry:()=>No,safeDecode:()=>mc,safeDecodeAsync:()=>vc,safeEncode:()=>dc,safeEncodeAsync:()=>hc,safeParse:()=>ac,safeParseAsync:()=>cc,set:()=>su,setErrorMap:()=>ad,size:()=>Te,slugify:()=>st,startsWith:()=>Qe,strictObject:()=>Q0,string:()=>Mt,stringFormat:()=>C0,stringbool:()=>ku,success:()=>pu,superRefine:()=>cl,symbol:()=>J0,templateLiteral:()=>hu,toJSONSchema:()=>fr,toLowerCase:()=>nt,toUpperCase:()=>it,transform:()=>Fr,treeifyError:()=>_n,trim:()=>rt,tuple:()=>Oc,uint32:()=>F0,uint64:()=>W0,ulid:()=>k0,undefined:()=>K0,union:()=>qr,unknown:()=>je,uppercase:()=>Ge,url:()=>g0,util:()=>$,uuid:()=>d0,uuidv4:()=>m0,uuidv6:()=>h0,uuidv7:()=>v0,void:()=>H0,xid:()=>z0,xor:()=>tu});var me={};pe(me,{$ZodAny:()=>Xi,$ZodArray:()=>rs,$ZodAsyncError:()=>oe,$ZodBase64:()=>Fi,$ZodBase64URL:()=>Ui,$ZodBigInt:()=>Ao,$ZodBigIntFormat:()=>Vi,$ZodBoolean:()=>Tt,$ZodCIDRv4:()=>Di,$ZodCIDRv6:()=>qi,$ZodCUID:()=>Pi,$ZodCUID2:()=>Zi,$ZodCatch:()=>ws,$ZodCheck:()=>C,$ZodCheckBigIntFormat:()=>ri,$ZodCheckEndsWith:()=>hi,$ZodCheckGreaterThan:()=>So,$ZodCheckIncludes:()=>di,$ZodCheckLengthEquals:()=>li,$ZodCheckLessThan:()=>$o,$ZodCheckLowerCase:()=>pi,$ZodCheckMaxLength:()=>ai,$ZodCheckMaxSize:()=>ni,$ZodCheckMimeType:()=>gi,$ZodCheckMinLength:()=>ci,$ZodCheckMinSize:()=>ii,$ZodCheckMultipleOf:()=>ti,$ZodCheckNumberFormat:()=>oi,$ZodCheckOverwrite:()=>xi,$ZodCheckProperty:()=>vi,$ZodCheckRegex:()=>ui,$ZodCheckSizeEquals:()=>si,$ZodCheckStartsWith:()=>mi,$ZodCheckStringFormat:()=>Ve,$ZodCheckUpperCase:()=>fi,$ZodCodec:()=>Ct,$ZodCustom:()=>Is,$ZodCustomStringFormat:()=>Ji,$ZodDate:()=>os,$ZodDefault:()=>gs,$ZodDiscriminatedUnion:()=>ss,$ZodE164:()=>Bi,$ZodEmail:()=>ki,$ZodEmoji:()=>$i,$ZodEncodeError:()=>ge,$ZodEnum:()=>ps,$ZodError:()=>Pt,$ZodExactOptional:()=>hs,$ZodFile:()=>ds,$ZodFunction:()=>Ss,$ZodGUID:()=>wi,$ZodIPv4:()=>ji,$ZodIPv6:()=>Ni,$ZodISODate:()=>Ti,$ZodISODateTime:()=>Ai,$ZodISODuration:()=>Ci,$ZodISOTime:()=>Oi,$ZodIntersection:()=>as,$ZodJWT:()=>Wi,$ZodKSUID:()=>Ei,$ZodLazy:()=>Zs,$ZodLiteral:()=>fs,$ZodMAC:()=>Li,$ZodMap:()=>ls,$ZodNaN:()=>_s,$ZodNanoID:()=>Si,$ZodNever:()=>es,$ZodNonOptional:()=>bs,$ZodNull:()=>Gi,$ZodNullable:()=>vs,$ZodNumber:()=>Eo,$ZodNumberFormat:()=>Ki,$ZodObject:()=>i0,$ZodObjectJIT:()=>ns,$ZodOptional:()=>Oo,$ZodPipe:()=>Co,$ZodPrefault:()=>xs,$ZodPreprocess:()=>ks,$ZodPromise:()=>Ps,$ZodReadonly:()=>zs,$ZodRealError:()=>V,$ZodRecord:()=>cs,$ZodRegistry:()=>jo,$ZodSet:()=>us,$ZodString:()=>Ae,$ZodStringFormat:()=>T,$ZodSuccess:()=>ys,$ZodSymbol:()=>Hi,$ZodTemplateLiteral:()=>$s,$ZodTransform:()=>ms,$ZodTuple:()=>To,$ZodType:()=>S,$ZodULID:()=>Ii,$ZodURL:()=>zi,$ZodUUID:()=>_i,$ZodUndefined:()=>Yi,$ZodUnion:()=>Ot,$ZodUnknown:()=>Qi,$ZodVoid:()=>ts,$ZodXID:()=>Ri,$ZodXor:()=>is,$brand:()=>ln,$constructor:()=>f,$input:()=>Es,$output:()=>Rs,Doc:()=>At,JSONSchema:()=>c0,JSONSchemaGenerator:()=>dr,NEVER:()=>cn,TimePrecision:()=>Cs,_any:()=>oa,_array:()=>la,_base64:()=>er,_base64url:()=>tr,_bigint:()=>Hs,_boolean:()=>Ks,_catch:()=>Yf,_check:()=>a0,_cidrv4:()=>Xo,_cidrv6:()=>Qo,_coercedBigint:()=>Ys,_coercedBoolean:()=>Vs,_coercedDate:()=>aa,_coercedNumber:()=>Ms,_coercedString:()=>Ts,_cuid:()=>Wo,_cuid2:()=>Jo,_custom:()=>pa,_date:()=>sa,_decode:()=>vo,_decodeAsync:()=>xo,_default:()=>Kf,_discriminatedUnion:()=>Cf,_e164:()=>or,_email:()=>Lo,_emoji:()=>Uo,_encode:()=>ho,_encodeAsync:()=>go,_endsWith:()=>et,_enum:()=>Mf,_file:()=>ua,_float32:()=>Us,_float64:()=>Bs,_gt:()=>ie,_gte:()=>W,_guid:()=>Lt,_includes:()=>Xe,_int:()=>Fs,_int32:()=>Ws,_int64:()=>Gs,_intersection:()=>jf,_ipv4:()=>Yo,_ipv6:()=>Go,_isoDate:()=>Ns,_isoDateTime:()=>js,_isoDuration:()=>Ds,_isoTime:()=>Ls,_jwt:()=>rr,_ksuid:()=>Ho,_lazy:()=>ed,_length:()=>Ce,_literal:()=>Uf,_lowercase:()=>Ye,_lt:()=>ne,_lte:()=>Q,_mac:()=>Os,_map:()=>Df,_max:()=>Q,_maxLength:()=>Oe,_maxSize:()=>ke,_mime:()=>tt,_min:()=>W,_minLength:()=>de,_minSize:()=>se,_multipleOf:()=>_e,_nan:()=>ca,_nanoid:()=>Bo,_nativeEnum:()=>Ff,_negative:()=>ir,_never:()=>na,_nonnegative:()=>ar,_nonoptional:()=>Vf,_nonpositive:()=>sr,_normalize:()=>ot,_null:()=>ta,_nullable:()=>Jf,_number:()=>qs,_optional:()=>Wf,_overwrite:()=>re,_parse:()=>Be,_parseAsync:()=>We,_pipe:()=>Gf,_positive:()=>nr,_promise:()=>td,_property:()=>cr,_readonly:()=>Xf,_record:()=>Lf,_refine:()=>fa,_regex:()=>He,_safeDecode:()=>yo,_safeDecodeAsync:()=>_o,_safeEncode:()=>bo,_safeEncodeAsync:()=>wo,_safeParse:()=>Je,_safeParseAsync:()=>Ke,_set:()=>qf,_size:()=>Te,_slugify:()=>st,_startsWith:()=>Qe,_string:()=>As,_stringFormat:()=>at,_stringbool:()=>va,_success:()=>Hf,_superRefine:()=>da,_symbol:()=>Qs,_templateLiteral:()=>Qf,_toLowerCase:()=>nt,_toUpperCase:()=>it,_transform:()=>Bf,_trim:()=>rt,_tuple:()=>Nf,_uint32:()=>Js,_uint64:()=>Xs,_ulid:()=>Ko,_undefined:()=>ea,_union:()=>Tf,_unknown:()=>ra,_uppercase:()=>Ge,_url:()=>Dt,_uuid:()=>Do,_uuidv4:()=>qo,_uuidv6:()=>Mo,_uuidv7:()=>Fo,_void:()=>ia,_xid:()=>Vo,_xor:()=>Of,clone:()=>U,config:()=>L,createStandardJSONSchemaMethod:()=>ct,createToJSONSchemaMethod:()=>ga,decode:()=>Hp,decodeAsync:()=>Gp,describe:()=>ma,encode:()=>Vp,encodeAsync:()=>Yp,extractDefs:()=>$e,finalize:()=>Se,flattenError:()=>Zt,formatError:()=>It,globalConfig:()=>Ie,globalRegistry:()=>M,initializeContext:()=>ze,isValidBase64:()=>Mi,isValidBase64URL:()=>t0,isValidJWT:()=>o0,locales:()=>Nt,meta:()=>ha,parse:()=>fo,parseAsync:()=>mo,prettifyError:()=>kn,process:()=>A,regexes:()=>X,registry:()=>No,safeDecode:()=>Qp,safeDecodeAsync:()=>tf,safeEncode:()=>Xp,safeEncodeAsync:()=>ef,safeParse:()=>zn,safeParseAsync:()=>$n,toDotPath:()=>Ol,toJSONSchema:()=>fr,treeifyError:()=>_n,util:()=>$,version:()=>bi});var Il,cn=Object.freeze({status:"aborted"});function f(e,t,o){function r(c,l){if(c._zod||Object.defineProperty(c,"_zod",{value:{def:l,constr:a,traits:new Set},enumerable:!1}),c._zod.traits.has(e))return;c._zod.traits.add(e),t(c,l);let p=a.prototype,d=Object.keys(p);for(let h=0;h<d.length;h++){let y=d[h];y in c||(c[y]=p[y].bind(c))}}i(r,"init");let n=o?.Parent??Object;class s extends n{static{i(this,"Definition")}}Object.defineProperty(s,"name",{value:e});function a(c){var l;let p=o?.Parent?new s:this;r(p,c),(l=p._zod).deferred??(l.deferred=[]);for(let d of p._zod.deferred)d();return p}return i(a,"_"),Object.defineProperty(a,"init",{value:r}),Object.defineProperty(a,Symbol.hasInstance,{value:i(c=>o?.Parent&&c instanceof o.Parent?!0:c?._zod?.traits?.has(e),"value")}),Object.defineProperty(a,"name",{value:e}),a}i(f,"$constructor");var ln=Symbol("zod_brand"),oe=class extends Error{static{i(this,"$ZodAsyncError")}constructor(){super("Encountered Promise during synchronous parse. Use .parseAsync() instead.")}},ge=class extends Error{static{i(this,"$ZodEncodeError")}constructor(t){super(`Encountered unidirectional transform during encode: ${t}`),this.name="ZodEncodeError"}};(Il=globalThis).__zod_globalConfig??(Il.__zod_globalConfig={});var Ie=globalThis.__zod_globalConfig;function L(e){return e&&Object.assign(Ie,e),Ie}i(L,"config");var $={};pe($,{BIGINT_FORMAT_RANGES:()=>bn,Class:()=>pn,NUMBER_FORMAT_RANGES:()=>xn,aborted:()=>we,allowsEval:()=>mn,assert:()=>Sp,assertEqual:()=>_p,assertIs:()=>zp,assertNever:()=>$p,assertNotEqual:()=>kp,assignProp:()=>be,base64ToUint8Array:()=>El,base64urlToUint8Array:()=>Up,cached:()=>Fe,captureStackTrace:()=>uo,cleanEnum:()=>Fp,cleanRegex:()=>kt,clone:()=>U,cloneDef:()=>Zp,createTransparentProxy:()=>Op,defineLazy:()=>R,esc:()=>lo,escapeRegex:()=>te,explicitlyAborted:()=>yn,extend:()=>Np,finalizeIssue:()=>B,floatSafeRemainder:()=>fn,getElementAtPath:()=>Ip,getEnumValues:()=>_t,getLengthableOrigin:()=>St,getParsedType:()=>Tp,getSizableOrigin:()=>$t,hexToUint8Array:()=>Wp,isObject:()=>Re,isPlainObject:()=>ye,issue:()=>Ue,joinValues:()=>co,jsonStringifyReplacer:()=>Me,merge:()=>Dp,mergeDefs:()=>fe,normalizeParams:()=>b,nullish:()=>xe,numKeys:()=>Ap,objectClone:()=>Pp,omit:()=>jp,optionalKeys:()=>gn,parsedType:()=>wn,partial:()=>qp,pick:()=>Cp,prefixIssues:()=>K,primitiveTypes:()=>vn,promiseAllObject:()=>Rp,propertyKeyTypes:()=>zt,randomString:()=>Ep,required:()=>Mp,safeExtend:()=>Lp,shallowClone:()=>hn,slugify:()=>dn,stringifyPrimitive:()=>po,uint8ArrayToBase64:()=>Al,uint8ArrayToBase64url:()=>Bp,uint8ArrayToHex:()=>Jp,unwrapMessage:()=>wt});function _p(e){return e}i(_p,"assertEqual");function kp(e){return e}i(kp,"assertNotEqual");function zp(e){}i(zp,"assertIs");function $p(e){throw new Error("Unexpected value in exhaustive check")}i($p,"assertNever");function Sp(e){}i(Sp,"assert");function _t(e){let t=Object.values(e).filter(r=>typeof r=="number");return Object.entries(e).filter(([r,n])=>t.indexOf(+r)===-1).map(([r,n])=>n)}i(_t,"getEnumValues");function co(e,t="|"){return e.map(o=>po(o)).join(t)}i(co,"joinValues");function Me(e,t){return typeof t=="bigint"?t.toString():t}i(Me,"jsonStringifyReplacer");function Fe(e){return{get value(){{let o=e();return Object.defineProperty(this,"value",{value:o}),o}throw new Error("cached value already set")}}}i(Fe,"cached");function xe(e){return e==null}i(xe,"nullish");function kt(e){let t=e.startsWith("^")?1:0,o=e.endsWith("$")?e.length-1:e.length;return e.slice(t,o)}i(kt,"cleanRegex");function fn(e,t){let o=e/t,r=Math.round(o),n=Number.EPSILON*Math.max(Math.abs(o),1);return Math.abs(o-r)<n?0:o-r}i(fn,"floatSafeRemainder");var Rl=Symbol("evaluating");function R(e,t,o){let r;Object.defineProperty(e,t,{get(){if(r!==Rl)return r===void 0&&(r=Rl,r=o()),r},set(n){Object.defineProperty(e,t,{value:n})},configurable:!0})}i(R,"defineLazy");function Pp(e){return Object.create(Object.getPrototypeOf(e),Object.getOwnPropertyDescriptors(e))}i(Pp,"objectClone");function be(e,t,o){Object.defineProperty(e,t,{value:o,writable:!0,enumerable:!0,configurable:!0})}i(be,"assignProp");function fe(...e){let t={};for(let o of e){let r=Object.getOwnPropertyDescriptors(o);Object.assign(t,r)}return Object.defineProperties({},t)}i(fe,"mergeDefs");function Zp(e){return fe(e._zod.def)}i(Zp,"cloneDef");function Ip(e,t){return t?t.reduce((o,r)=>o?.[r],e):e}i(Ip,"getElementAtPath");function Rp(e){let t=Object.keys(e),o=t.map(r=>e[r]);return Promise.all(o).then(r=>{let n={};for(let s=0;s<t.length;s++)n[t[s]]=r[s];return n})}i(Rp,"promiseAllObject");function Ep(e=10){let t="abcdefghijklmnopqrstuvwxyz",o="";for(let r=0;r<e;r++)o+=t[Math.floor(Math.random()*t.length)];return o}i(Ep,"randomString");function lo(e){return JSON.stringify(e)}i(lo,"esc");function dn(e){return e.toLowerCase().trim().replace(/[^\w\s-]/g,"").replace(/[\s_-]+/g,"-").replace(/^-+|-+$/g,"")}i(dn,"slugify");var uo="captureStackTrace"in Error?Error.captureStackTrace:(...e)=>{};function Re(e){return typeof e=="object"&&e!==null&&!Array.isArray(e)}i(Re,"isObject");var mn=Fe(()=>{if(Ie.jitless||typeof navigator<"u"&&navigator?.userAgent?.includes("Cloudflare"))return!1;try{let e=Function;return new e(""),!0}catch{return!1}});function ye(e){if(Re(e)===!1)return!1;let t=e.constructor;if(t===void 0||typeof t!="function")return!0;let o=t.prototype;return!(Re(o)===!1||Object.prototype.hasOwnProperty.call(o,"isPrototypeOf")===!1)}i(ye,"isPlainObject");function hn(e){return ye(e)?{...e}:Array.isArray(e)?[...e]:e instanceof Map?new Map(e):e instanceof Set?new Set(e):e}i(hn,"shallowClone");function Ap(e){let t=0;for(let o in e)Object.prototype.hasOwnProperty.call(e,o)&&t++;return t}i(Ap,"numKeys");var Tp=i(e=>{let t=typeof e;switch(t){case"undefined":return"undefined";case"string":return"string";case"number":return Number.isNaN(e)?"nan":"number";case"boolean":return"boolean";case"function":return"function";case"bigint":return"bigint";case"symbol":return"symbol";case"object":return Array.isArray(e)?"array":e===null?"null":e.then&&typeof e.then=="function"&&e.catch&&typeof e.catch=="function"?"promise":typeof Map<"u"&&e instanceof Map?"map":typeof Set<"u"&&e instanceof Set?"set":typeof Date<"u"&&e instanceof Date?"date":typeof File<"u"&&e instanceof File?"file":"object";default:throw new Error(`Unknown data type: ${t}`)}},"getParsedType"),zt=new Set(["string","number","symbol"]),vn=new Set(["string","number","bigint","boolean","symbol","undefined"]);function te(e){return e.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}i(te,"escapeRegex");function U(e,t,o){let r=new e._zod.constr(t??e._zod.def);return(!t||o?.parent)&&(r._zod.parent=e),r}i(U,"clone");function b(e){let t=e;if(!t)return{};if(typeof t=="string")return{error:i(()=>t,"error")};if(t?.message!==void 0){if(t?.error!==void 0)throw new Error("Cannot specify both `message` and `error` params");t.error=t.message}return delete t.message,typeof t.error=="string"?{...t,error:i(()=>t.error,"error")}:t}i(b,"normalizeParams");function Op(e){let t;return new Proxy({},{get(o,r,n){return t??(t=e()),Reflect.get(t,r,n)},set(o,r,n,s){return t??(t=e()),Reflect.set(t,r,n,s)},has(o,r){return t??(t=e()),Reflect.has(t,r)},deleteProperty(o,r){return t??(t=e()),Reflect.deleteProperty(t,r)},ownKeys(o){return t??(t=e()),Reflect.ownKeys(t)},getOwnPropertyDescriptor(o,r){return t??(t=e()),Reflect.getOwnPropertyDescriptor(t,r)},defineProperty(o,r,n){return t??(t=e()),Reflect.defineProperty(t,r,n)}})}i(Op,"createTransparentProxy");function po(e){return typeof e=="bigint"?e.toString()+"n":typeof e=="string"?`"${e}"`:`${e}`}i(po,"stringifyPrimitive");function gn(e){return Object.keys(e).filter(t=>e[t]._zod.optin==="optional"&&e[t]._zod.optout==="optional")}i(gn,"optionalKeys");var xn={safeint:[Number.MIN_SAFE_INTEGER,Number.MAX_SAFE_INTEGER],int32:[-2147483648,2147483647],uint32:[0,4294967295],float32:[-34028234663852886e22,34028234663852886e22],float64:[-Number.MAX_VALUE,Number.MAX_VALUE]},bn={int64:[BigInt("-9223372036854775808"),BigInt("9223372036854775807")],uint64:[BigInt(0),BigInt("18446744073709551615")]};function Cp(e,t){let o=e._zod.def,r=o.checks;if(r&&r.length>0)throw new Error(".pick() cannot be used on object schemas containing refinements");let s=fe(e._zod.def,{get shape(){let a={};for(let c in t){if(!(c in o.shape))throw new Error(`Unrecognized key: "${c}"`);t[c]&&(a[c]=o.shape[c])}return be(this,"shape",a),a},checks:[]});return U(e,s)}i(Cp,"pick");function jp(e,t){let o=e._zod.def,r=o.checks;if(r&&r.length>0)throw new Error(".omit() cannot be used on object schemas containing refinements");let s=fe(e._zod.def,{get shape(){let a={...e._zod.def.shape};for(let c in t){if(!(c in o.shape))throw new Error(`Unrecognized key: "${c}"`);t[c]&&delete a[c]}return be(this,"shape",a),a},checks:[]});return U(e,s)}i(jp,"omit");function Np(e,t){if(!ye(t))throw new Error("Invalid input to extend: expected a plain object");let o=e._zod.def.checks;if(o&&o.length>0){let s=e._zod.def.shape;for(let a in t)if(Object.getOwnPropertyDescriptor(s,a)!==void 0)throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.")}let n=fe(e._zod.def,{get shape(){let s={...e._zod.def.shape,...t};return be(this,"shape",s),s}});return U(e,n)}i(Np,"extend");function Lp(e,t){if(!ye(t))throw new Error("Invalid input to safeExtend: expected a plain object");let o=fe(e._zod.def,{get shape(){let r={...e._zod.def.shape,...t};return be(this,"shape",r),r}});return U(e,o)}i(Lp,"safeExtend");function Dp(e,t){if(e._zod.def.checks?.length)throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");let o=fe(e._zod.def,{get shape(){let r={...e._zod.def.shape,...t._zod.def.shape};return be(this,"shape",r),r},get catchall(){return t._zod.def.catchall},checks:t._zod.def.checks??[]});return U(e,o)}i(Dp,"merge");function qp(e,t,o){let n=t._zod.def.checks;if(n&&n.length>0)throw new Error(".partial() cannot be used on object schemas containing refinements");let a=fe(t._zod.def,{get shape(){let c=t._zod.def.shape,l={...c};if(o)for(let p in o){if(!(p in c))throw new Error(`Unrecognized key: "${p}"`);o[p]&&(l[p]=e?new e({type:"optional",innerType:c[p]}):c[p])}else for(let p in c)l[p]=e?new e({type:"optional",innerType:c[p]}):c[p];return be(this,"shape",l),l},checks:[]});return U(t,a)}i(qp,"partial");function Mp(e,t,o){let r=fe(t._zod.def,{get shape(){let n=t._zod.def.shape,s={...n};if(o)for(let a in o){if(!(a in s))throw new Error(`Unrecognized key: "${a}"`);o[a]&&(s[a]=new e({type:"nonoptional",innerType:n[a]}))}else for(let a in n)s[a]=new e({type:"nonoptional",innerType:n[a]});return be(this,"shape",s),s}});return U(t,r)}i(Mp,"required");function we(e,t=0){if(e.aborted===!0)return!0;for(let o=t;o<e.issues.length;o++)if(e.issues[o]?.continue!==!0)return!0;return!1}i(we,"aborted");function yn(e,t=0){if(e.aborted===!0)return!0;for(let o=t;o<e.issues.length;o++)if(e.issues[o]?.continue===!1)return!0;return!1}i(yn,"explicitlyAborted");function K(e,t){return t.map(o=>{var r;return(r=o).path??(r.path=[]),o.path.unshift(e),o})}i(K,"prefixIssues");function wt(e){return typeof e=="string"?e:e?.message}i(wt,"unwrapMessage");function B(e,t,o){let r=e.message?e.message:wt(e.inst?._zod.def?.error?.(e))??wt(t?.error?.(e))??wt(o.customError?.(e))??wt(o.localeError?.(e))??"Invalid input",{inst:n,continue:s,input:a,...c}=e;return c.path??(c.path=[]),c.message=r,t?.reportInput&&(c.input=a),c}i(B,"finalizeIssue");function $t(e){return e instanceof Set?"set":e instanceof Map?"map":e instanceof File?"file":"unknown"}i($t,"getSizableOrigin");function St(e){return Array.isArray(e)?"array":typeof e=="string"?"string":"unknown"}i(St,"getLengthableOrigin");function wn(e){let t=typeof e;switch(t){case"number":return Number.isNaN(e)?"nan":"number";case"object":{if(e===null)return"null";if(Array.isArray(e))return"array";let o=e;if(o&&Object.getPrototypeOf(o)!==Object.prototype&&"constructor"in o&&o.constructor)return o.constructor.name}}return t}i(wn,"parsedType");function Ue(...e){let[t,o,r]=e;return typeof t=="string"?{message:t,code:"custom",input:o,inst:r}:{...t}}i(Ue,"issue");function Fp(e){return Object.entries(e).filter(([t,o])=>Number.isNaN(Number.parseInt(t,10))).map(t=>t[1])}i(Fp,"cleanEnum");function El(e){let t=atob(e),o=new Uint8Array(t.length);for(let r=0;r<t.length;r++)o[r]=t.charCodeAt(r);return o}i(El,"base64ToUint8Array");function Al(e){let t="";for(let o=0;o<e.length;o++)t+=String.fromCharCode(e[o]);return btoa(t)}i(Al,"uint8ArrayToBase64");function Up(e){let t=e.replace(/-/g,"+").replace(/_/g,"/"),o="=".repeat((4-t.length%4)%4);return El(t+o)}i(Up,"base64urlToUint8Array");function Bp(e){return Al(e).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"")}i(Bp,"uint8ArrayToBase64url");function Wp(e){let t=e.replace(/^0x/,"");if(t.length%2!==0)throw new Error("Invalid hex string length");let o=new Uint8Array(t.length/2);for(let r=0;r<t.length;r+=2)o[r/2]=Number.parseInt(t.slice(r,r+2),16);return o}i(Wp,"hexToUint8Array");function Jp(e){return Array.from(e).map(t=>t.toString(16).padStart(2,"0")).join("")}i(Jp,"uint8ArrayToHex");var pn=class{static{i(this,"Class")}constructor(...t){}};var Tl=i((e,t)=>{e.name="$ZodError",Object.defineProperty(e,"_zod",{value:e._zod,enumerable:!1}),Object.defineProperty(e,"issues",{value:t,enumerable:!1}),e.message=JSON.stringify(t,Me,2),Object.defineProperty(e,"toString",{value:i(()=>e.message,"value"),enumerable:!1})},"initializer"),Pt=f("$ZodError",Tl),V=f("$ZodError",Tl,{Parent:Error});function Zt(e,t=o=>o.message){let o={},r=[];for(let n of e.issues)n.path.length>0?(o[n.path[0]]=o[n.path[0]]||[],o[n.path[0]].push(t(n))):r.push(t(n));return{formErrors:r,fieldErrors:o}}i(Zt,"flattenError");function It(e,t=o=>o.message){let o={_errors:[]},r=i((n,s=[])=>{for(let a of n.issues)if(a.code==="invalid_union"&&a.errors.length)a.errors.map(c=>r({issues:c},[...s,...a.path]));else if(a.code==="invalid_key")r({issues:a.issues},[...s,...a.path]);else if(a.code==="invalid_element")r({issues:a.issues},[...s,...a.path]);else{let c=[...s,...a.path];if(c.length===0)o._errors.push(t(a));else{let l=o,p=0;for(;p<c.length;){let d=c[p];p===c.length-1?(l[d]=l[d]||{_errors:[]},l[d]._errors.push(t(a))):l[d]=l[d]||{_errors:[]},l=l[d],p++}}}},"processError");return r(e),o}i(It,"formatError");function _n(e,t=o=>o.message){let o={errors:[]},r=i((n,s=[])=>{var a,c;for(let l of n.issues)if(l.code==="invalid_union"&&l.errors.length)l.errors.map(p=>r({issues:p},[...s,...l.path]));else if(l.code==="invalid_key")r({issues:l.issues},[...s,...l.path]);else if(l.code==="invalid_element")r({issues:l.issues},[...s,...l.path]);else{let p=[...s,...l.path];if(p.length===0){o.errors.push(t(l));continue}let d=o,h=0;for(;h<p.length;){let y=p[h],w=h===p.length-1;typeof y=="string"?(d.properties??(d.properties={}),(a=d.properties)[y]??(a[y]={errors:[]}),d=d.properties[y]):(d.items??(d.items=[]),(c=d.items)[y]??(c[y]={errors:[]}),d=d.items[y]),w&&d.errors.push(t(l)),h++}}},"processError");return r(e),o}i(_n,"treeifyError");function Ol(e){let t=[],o=e.map(r=>typeof r=="object"?r.key:r);for(let r of o)typeof r=="number"?t.push(`[${r}]`):typeof r=="symbol"?t.push(`[${JSON.stringify(String(r))}]`):/[^\w$]/.test(r)?t.push(`[${JSON.stringify(r)}]`):(t.length&&t.push("."),t.push(r));return t.join("")}i(Ol,"toDotPath");function kn(e){let t=[],o=[...e.issues].sort((r,n)=>(r.path??[]).length-(n.path??[]).length);for(let r of o)t.push(`\u2716 ${r.message}`),r.path?.length&&t.push(`  \u2192 at ${Ol(r.path)}`);return t.join(`
`)}i(kn,"prettifyError");var Be=i(e=>(t,o,r,n)=>{let s=r?{...r,async:!1}:{async:!1},a=t._zod.run({value:o,issues:[]},s);if(a instanceof Promise)throw new oe;if(a.issues.length){let c=new(n?.Err??e)(a.issues.map(l=>B(l,s,L())));throw uo(c,n?.callee),c}return a.value},"_parse"),fo=Be(V),We=i(e=>async(t,o,r,n)=>{let s=r?{...r,async:!0}:{async:!0},a=t._zod.run({value:o,issues:[]},s);if(a instanceof Promise&&(a=await a),a.issues.length){let c=new(n?.Err??e)(a.issues.map(l=>B(l,s,L())));throw uo(c,n?.callee),c}return a.value},"_parseAsync"),mo=We(V),Je=i(e=>(t,o,r)=>{let n=r?{...r,async:!1}:{async:!1},s=t._zod.run({value:o,issues:[]},n);if(s instanceof Promise)throw new oe;return s.issues.length?{success:!1,error:new(e??Pt)(s.issues.map(a=>B(a,n,L())))}:{success:!0,data:s.value}},"_safeParse"),zn=Je(V),Ke=i(e=>async(t,o,r)=>{let n=r?{...r,async:!0}:{async:!0},s=t._zod.run({value:o,issues:[]},n);return s instanceof Promise&&(s=await s),s.issues.length?{success:!1,error:new e(s.issues.map(a=>B(a,n,L())))}:{success:!0,data:s.value}},"_safeParseAsync"),$n=Ke(V),ho=i(e=>(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return Be(e)(t,o,n)},"_encode"),Vp=ho(V),vo=i(e=>(t,o,r)=>Be(e)(t,o,r),"_decode"),Hp=vo(V),go=i(e=>async(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return We(e)(t,o,n)},"_encodeAsync"),Yp=go(V),xo=i(e=>async(t,o,r)=>We(e)(t,o,r),"_decodeAsync"),Gp=xo(V),bo=i(e=>(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return Je(e)(t,o,n)},"_safeEncode"),Xp=bo(V),yo=i(e=>(t,o,r)=>Je(e)(t,o,r),"_safeDecode"),Qp=yo(V),wo=i(e=>async(t,o,r)=>{let n=r?{...r,direction:"backward"}:{direction:"backward"};return Ke(e)(t,o,n)},"_safeEncodeAsync"),ef=wo(V),_o=i(e=>async(t,o,r)=>Ke(e)(t,o,r),"_safeDecodeAsync"),tf=_o(V);var X={};pe(X,{base64:()=>Mn,base64url:()=>ko,bigint:()=>Vn,boolean:()=>Yn,browserEmail:()=>uf,cidrv4:()=>Dn,cidrv6:()=>qn,cuid:()=>Sn,cuid2:()=>Pn,date:()=>Bn,datetime:()=>Jn,domain:()=>df,duration:()=>An,e164:()=>Un,email:()=>On,emoji:()=>Cn,extendedDuration:()=>of,guid:()=>Tn,hex:()=>mf,hostname:()=>ff,html5Email:()=>af,httpProtocol:()=>Fn,idnEmail:()=>lf,integer:()=>Hn,ipv4:()=>jn,ipv6:()=>Nn,ksuid:()=>Rn,lowercase:()=>Qn,mac:()=>Ln,md5_base64:()=>vf,md5_base64url:()=>gf,md5_hex:()=>hf,nanoid:()=>En,null:()=>Gn,number:()=>zo,rfc5322Email:()=>cf,sha1_base64:()=>bf,sha1_base64url:()=>yf,sha1_hex:()=>xf,sha256_base64:()=>_f,sha256_base64url:()=>kf,sha256_hex:()=>wf,sha384_base64:()=>$f,sha384_base64url:()=>Sf,sha384_hex:()=>zf,sha512_base64:()=>Zf,sha512_base64url:()=>If,sha512_hex:()=>Pf,string:()=>Kn,time:()=>Wn,ulid:()=>Zn,undefined:()=>Xn,unicodeEmail:()=>Cl,uppercase:()=>ei,uuid:()=>Ee,uuid4:()=>rf,uuid6:()=>nf,uuid7:()=>sf,xid:()=>In});var Sn=/^[cC][0-9a-z]{6,}$/,Pn=/^[0-9a-z]+$/,Zn=/^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,In=/^[0-9a-vA-V]{20}$/,Rn=/^[A-Za-z0-9]{27}$/,En=/^[a-zA-Z0-9_-]{21}$/,An=/^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,of=/^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/,Tn=/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,Ee=i(e=>e?new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`):/^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,"uuid"),rf=Ee(4),nf=Ee(6),sf=Ee(7),On=/^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/,af=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,cf=/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,Cl=/^[^\s@"]{1,64}@[^\s@]{1,255}$/u,lf=Cl,uf=/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,pf="^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$";function Cn(){return new RegExp(pf,"u")}i(Cn,"emoji");var jn=/^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,Nn=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,Ln=i(e=>{let t=te(e??":");return new RegExp(`^(?:[0-9A-F]{2}${t}){5}[0-9A-F]{2}$|^(?:[0-9a-f]{2}${t}){5}[0-9a-f]{2}$`)},"mac"),Dn=/^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,qn=/^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,Mn=/^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,ko=/^[A-Za-z0-9_-]*$/,ff=/^(?=.{1,253}\.?$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[-0-9a-zA-Z]{0,61}[0-9a-zA-Z])?)*\.?$/,df=/^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,Fn=/^https?$/,Un=/^\+[1-9]\d{6,14}$/,jl="(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))",Bn=new RegExp(`^${jl}$`);function Nl(e){let t="(?:[01]\\d|2[0-3]):[0-5]\\d";return typeof e.precision=="number"?e.precision===-1?`${t}`:e.precision===0?`${t}:[0-5]\\d`:`${t}:[0-5]\\d\\.\\d{${e.precision}}`:`${t}(?::[0-5]\\d(?:\\.\\d+)?)?`}i(Nl,"timeSource");function Wn(e){return new RegExp(`^${Nl(e)}$`)}i(Wn,"time");function Jn(e){let t=Nl({precision:e.precision}),o=["Z"];e.local&&o.push(""),e.offset&&o.push("([+-](?:[01]\\d|2[0-3]):[0-5]\\d)");let r=`${t}(?:${o.join("|")})`;return new RegExp(`^${jl}T(?:${r})$`)}i(Jn,"datetime");var Kn=i(e=>{let t=e?`[\\s\\S]{${e?.minimum??0},${e?.maximum??""}}`:"[\\s\\S]*";return new RegExp(`^${t}$`)},"string"),Vn=/^-?\d+n?$/,Hn=/^-?\d+$/,zo=/^-?\d+(?:\.\d+)?$/,Yn=/^(?:true|false)$/i,Gn=/^null$/i;var Xn=/^undefined$/i;var Qn=/^[^A-Z]*$/,ei=/^[^a-z]*$/,mf=/^[0-9a-fA-F]*$/;function Rt(e,t){return new RegExp(`^[A-Za-z0-9+/]{${e}}${t}$`)}i(Rt,"fixedBase64");function Et(e){return new RegExp(`^[A-Za-z0-9_-]{${e}}$`)}i(Et,"fixedBase64url");var hf=/^[0-9a-fA-F]{32}$/,vf=Rt(22,"=="),gf=Et(22),xf=/^[0-9a-fA-F]{40}$/,bf=Rt(27,"="),yf=Et(27),wf=/^[0-9a-fA-F]{64}$/,_f=Rt(43,"="),kf=Et(43),zf=/^[0-9a-fA-F]{96}$/,$f=Rt(64,""),Sf=Et(64),Pf=/^[0-9a-fA-F]{128}$/,Zf=Rt(86,"=="),If=Et(86);var C=f("$ZodCheck",(e,t)=>{var o;e._zod??(e._zod={}),e._zod.def=t,(o=e._zod).onattach??(o.onattach=[])}),Dl={number:"number",bigint:"bigint",object:"date"},$o=f("$ZodCheckLessThan",(e,t)=>{C.init(e,t);let o=Dl[typeof t.value];e._zod.onattach.push(r=>{let n=r._zod.bag,s=(t.inclusive?n.maximum:n.exclusiveMaximum)??Number.POSITIVE_INFINITY;t.value<s&&(t.inclusive?n.maximum=t.value:n.exclusiveMaximum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value<=t.value:r.value<t.value)||r.issues.push({origin:o,code:"too_big",maximum:typeof t.value=="object"?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),So=f("$ZodCheckGreaterThan",(e,t)=>{C.init(e,t);let o=Dl[typeof t.value];e._zod.onattach.push(r=>{let n=r._zod.bag,s=(t.inclusive?n.minimum:n.exclusiveMinimum)??Number.NEGATIVE_INFINITY;t.value>s&&(t.inclusive?n.minimum=t.value:n.exclusiveMinimum=t.value)}),e._zod.check=r=>{(t.inclusive?r.value>=t.value:r.value>t.value)||r.issues.push({origin:o,code:"too_small",minimum:typeof t.value=="object"?t.value.getTime():t.value,input:r.value,inclusive:t.inclusive,inst:e,continue:!t.abort})}}),ti=f("$ZodCheckMultipleOf",(e,t)=>{C.init(e,t),e._zod.onattach.push(o=>{var r;(r=o._zod.bag).multipleOf??(r.multipleOf=t.value)}),e._zod.check=o=>{if(typeof o.value!=typeof t.value)throw new Error("Cannot mix number and bigint in multiple_of check.");(typeof o.value=="bigint"?o.value%t.value===BigInt(0):fn(o.value,t.value)===0)||o.issues.push({origin:typeof o.value,code:"not_multiple_of",divisor:t.value,input:o.value,inst:e,continue:!t.abort})}}),oi=f("$ZodCheckNumberFormat",(e,t)=>{C.init(e,t),t.format=t.format||"float64";let o=t.format?.includes("int"),r=o?"int":"number",[n,s]=xn[t.format];e._zod.onattach.push(a=>{let c=a._zod.bag;c.format=t.format,c.minimum=n,c.maximum=s,o&&(c.pattern=Hn)}),e._zod.check=a=>{let c=a.value;if(o){if(!Number.isInteger(c)){a.issues.push({expected:r,format:t.format,code:"invalid_type",continue:!1,input:c,inst:e});return}if(!Number.isSafeInteger(c)){c>0?a.issues.push({input:c,code:"too_big",maximum:Number.MAX_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort}):a.issues.push({input:c,code:"too_small",minimum:Number.MIN_SAFE_INTEGER,note:"Integers must be within the safe integer range.",inst:e,origin:r,inclusive:!0,continue:!t.abort});return}}c<n&&a.issues.push({origin:"number",input:c,code:"too_small",minimum:n,inclusive:!0,inst:e,continue:!t.abort}),c>s&&a.issues.push({origin:"number",input:c,code:"too_big",maximum:s,inclusive:!0,inst:e,continue:!t.abort})}}),ri=f("$ZodCheckBigIntFormat",(e,t)=>{C.init(e,t);let[o,r]=bn[t.format];e._zod.onattach.push(n=>{let s=n._zod.bag;s.format=t.format,s.minimum=o,s.maximum=r}),e._zod.check=n=>{let s=n.value;s<o&&n.issues.push({origin:"bigint",input:s,code:"too_small",minimum:o,inclusive:!0,inst:e,continue:!t.abort}),s>r&&n.issues.push({origin:"bigint",input:s,code:"too_big",maximum:r,inclusive:!0,inst:e,continue:!t.abort})}}),ni=f("$ZodCheckMaxSize",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.maximum??Number.POSITIVE_INFINITY;t.maximum<n&&(r._zod.bag.maximum=t.maximum)}),e._zod.check=r=>{let n=r.value;n.size<=t.maximum||r.issues.push({origin:$t(n),code:"too_big",maximum:t.maximum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),ii=f("$ZodCheckMinSize",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.minimum??Number.NEGATIVE_INFINITY;t.minimum>n&&(r._zod.bag.minimum=t.minimum)}),e._zod.check=r=>{let n=r.value;n.size>=t.minimum||r.issues.push({origin:$t(n),code:"too_small",minimum:t.minimum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),si=f("$ZodCheckSizeEquals",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.size!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag;n.minimum=t.size,n.maximum=t.size,n.size=t.size}),e._zod.check=r=>{let n=r.value,s=n.size;if(s===t.size)return;let a=s>t.size;r.issues.push({origin:$t(n),...a?{code:"too_big",maximum:t.size}:{code:"too_small",minimum:t.size},inclusive:!0,exact:!0,input:r.value,inst:e,continue:!t.abort})}}),ai=f("$ZodCheckMaxLength",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.maximum??Number.POSITIVE_INFINITY;t.maximum<n&&(r._zod.bag.maximum=t.maximum)}),e._zod.check=r=>{let n=r.value;if(n.length<=t.maximum)return;let a=St(n);r.issues.push({origin:a,code:"too_big",maximum:t.maximum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),ci=f("$ZodCheckMinLength",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag.minimum??Number.NEGATIVE_INFINITY;t.minimum>n&&(r._zod.bag.minimum=t.minimum)}),e._zod.check=r=>{let n=r.value;if(n.length>=t.minimum)return;let a=St(n);r.issues.push({origin:a,code:"too_small",minimum:t.minimum,inclusive:!0,input:n,inst:e,continue:!t.abort})}}),li=f("$ZodCheckLengthEquals",(e,t)=>{var o;C.init(e,t),(o=e._zod.def).when??(o.when=r=>{let n=r.value;return!xe(n)&&n.length!==void 0}),e._zod.onattach.push(r=>{let n=r._zod.bag;n.minimum=t.length,n.maximum=t.length,n.length=t.length}),e._zod.check=r=>{let n=r.value,s=n.length;if(s===t.length)return;let a=St(n),c=s>t.length;r.issues.push({origin:a,...c?{code:"too_big",maximum:t.length}:{code:"too_small",minimum:t.length},inclusive:!0,exact:!0,input:r.value,inst:e,continue:!t.abort})}}),Ve=f("$ZodCheckStringFormat",(e,t)=>{var o,r;C.init(e,t),e._zod.onattach.push(n=>{let s=n._zod.bag;s.format=t.format,t.pattern&&(s.patterns??(s.patterns=new Set),s.patterns.add(t.pattern))}),t.pattern?(o=e._zod).check??(o.check=n=>{t.pattern.lastIndex=0,!t.pattern.test(n.value)&&n.issues.push({origin:"string",code:"invalid_format",format:t.format,input:n.value,...t.pattern?{pattern:t.pattern.toString()}:{},inst:e,continue:!t.abort})}):(r=e._zod).check??(r.check=()=>{})}),ui=f("$ZodCheckRegex",(e,t)=>{Ve.init(e,t),e._zod.check=o=>{t.pattern.lastIndex=0,!t.pattern.test(o.value)&&o.issues.push({origin:"string",code:"invalid_format",format:"regex",input:o.value,pattern:t.pattern.toString(),inst:e,continue:!t.abort})}}),pi=f("$ZodCheckLowerCase",(e,t)=>{t.pattern??(t.pattern=Qn),Ve.init(e,t)}),fi=f("$ZodCheckUpperCase",(e,t)=>{t.pattern??(t.pattern=ei),Ve.init(e,t)}),di=f("$ZodCheckIncludes",(e,t)=>{C.init(e,t);let o=te(t.includes),r=new RegExp(typeof t.position=="number"?`^.{${t.position}}${o}`:o);t.pattern=r,e._zod.onattach.push(n=>{let s=n._zod.bag;s.patterns??(s.patterns=new Set),s.patterns.add(r)}),e._zod.check=n=>{n.value.includes(t.includes,t.position)||n.issues.push({origin:"string",code:"invalid_format",format:"includes",includes:t.includes,input:n.value,inst:e,continue:!t.abort})}}),mi=f("$ZodCheckStartsWith",(e,t)=>{C.init(e,t);let o=new RegExp(`^${te(t.prefix)}.*`);t.pattern??(t.pattern=o),e._zod.onattach.push(r=>{let n=r._zod.bag;n.patterns??(n.patterns=new Set),n.patterns.add(o)}),e._zod.check=r=>{r.value.startsWith(t.prefix)||r.issues.push({origin:"string",code:"invalid_format",format:"starts_with",prefix:t.prefix,input:r.value,inst:e,continue:!t.abort})}}),hi=f("$ZodCheckEndsWith",(e,t)=>{C.init(e,t);let o=new RegExp(`.*${te(t.suffix)}$`);t.pattern??(t.pattern=o),e._zod.onattach.push(r=>{let n=r._zod.bag;n.patterns??(n.patterns=new Set),n.patterns.add(o)}),e._zod.check=r=>{r.value.endsWith(t.suffix)||r.issues.push({origin:"string",code:"invalid_format",format:"ends_with",suffix:t.suffix,input:r.value,inst:e,continue:!t.abort})}});function Ll(e,t,o){e.issues.length&&t.issues.push(...K(o,e.issues))}i(Ll,"handleCheckPropertyResult");var vi=f("$ZodCheckProperty",(e,t)=>{C.init(e,t),e._zod.check=o=>{let r=t.schema._zod.run({value:o.value[t.property],issues:[]},{});if(r instanceof Promise)return r.then(n=>Ll(n,o,t.property));Ll(r,o,t.property)}}),gi=f("$ZodCheckMimeType",(e,t)=>{C.init(e,t);let o=new Set(t.mime);e._zod.onattach.push(r=>{r._zod.bag.mime=t.mime}),e._zod.check=r=>{o.has(r.value.type)||r.issues.push({code:"invalid_value",values:t.mime,input:r.value.type,inst:e,continue:!t.abort})}}),xi=f("$ZodCheckOverwrite",(e,t)=>{C.init(e,t),e._zod.check=o=>{o.value=t.tx(o.value)}});var At=class{static{i(this,"Doc")}constructor(t=[]){this.content=[],this.indent=0,this&&(this.args=t)}indented(t){this.indent+=1,t(this),this.indent-=1}write(t){if(typeof t=="function"){t(this,{execution:"sync"}),t(this,{execution:"async"});return}let r=t.split(`
`).filter(a=>a),n=Math.min(...r.map(a=>a.length-a.trimStart().length)),s=r.map(a=>a.slice(n)).map(a=>" ".repeat(this.indent*2)+a);for(let a of s)this.content.push(a)}compile(){let t=Function,o=this?.args,n=[...(this?.content??[""]).map(s=>`  ${s}`)];return new t(...o,n.join(`
`))}};var bi={major:4,minor:4,patch:3};var S=f("$ZodType",(e,t)=>{var o;e??(e={}),e._zod.def=t,e._zod.bag=e._zod.bag||{},e._zod.version=bi;let r=[...e._zod.def.checks??[]];e._zod.traits.has("$ZodCheck")&&r.unshift(e);for(let n of r)for(let s of n._zod.onattach)s(e);if(r.length===0)(o=e._zod).deferred??(o.deferred=[]),e._zod.deferred?.push(()=>{e._zod.run=e._zod.parse});else{let n=i((a,c,l)=>{let p=we(a),d;for(let h of c){if(h._zod.def.when){if(yn(a)||!h._zod.def.when(a))continue}else if(p)continue;let y=a.issues.length,w=h._zod.check(a);if(w instanceof Promise&&l?.async===!1)throw new oe;if(d||w instanceof Promise)d=(d??Promise.resolve()).then(async()=>{await w,a.issues.length!==y&&(p||(p=we(a,y)))});else{if(a.issues.length===y)continue;p||(p=we(a,y))}}return d?d.then(()=>a):a},"runChecks"),s=i((a,c,l)=>{if(we(a))return a.aborted=!0,a;let p=n(c,r,l);if(p instanceof Promise){if(l.async===!1)throw new oe;return p.then(d=>e._zod.parse(d,l))}return e._zod.parse(p,l)},"handleCanaryResult");e._zod.run=(a,c)=>{if(c.skipChecks)return e._zod.parse(a,c);if(c.direction==="backward"){let p=e._zod.parse({value:a.value,issues:[]},{...c,skipChecks:!0});return p instanceof Promise?p.then(d=>s(d,a,c)):s(p,a,c)}let l=e._zod.parse(a,c);if(l instanceof Promise){if(c.async===!1)throw new oe;return l.then(p=>n(p,r,c))}return n(l,r,c)}}R(e,"~standard",()=>({validate:i(n=>{try{let s=zn(e,n);return s.success?{value:s.data}:{issues:s.error?.issues}}catch{return $n(e,n).then(a=>a.success?{value:a.data}:{issues:a.error?.issues})}},"validate"),vendor:"zod",version:1}))}),Ae=f("$ZodString",(e,t)=>{S.init(e,t),e._zod.pattern=[...e?._zod.bag?.patterns??[]].pop()??Kn(e._zod.bag),e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=String(o.value)}catch{}return typeof o.value=="string"||o.issues.push({expected:"string",code:"invalid_type",input:o.value,inst:e}),o}}),T=f("$ZodStringFormat",(e,t)=>{Ve.init(e,t),Ae.init(e,t)}),wi=f("$ZodGUID",(e,t)=>{t.pattern??(t.pattern=Tn),T.init(e,t)}),_i=f("$ZodUUID",(e,t)=>{if(t.version){let r={v1:1,v2:2,v3:3,v4:4,v5:5,v6:6,v7:7,v8:8}[t.version];if(r===void 0)throw new Error(`Invalid UUID version: "${t.version}"`);t.pattern??(t.pattern=Ee(r))}else t.pattern??(t.pattern=Ee());T.init(e,t)}),ki=f("$ZodEmail",(e,t)=>{t.pattern??(t.pattern=On),T.init(e,t)}),zi=f("$ZodURL",(e,t)=>{T.init(e,t),e._zod.check=o=>{try{let r=o.value.trim();if(!t.normalize&&t.protocol?.source===Fn.source&&!/^https?:\/\//i.test(r)){o.issues.push({code:"invalid_format",format:"url",note:"Invalid URL format",input:o.value,inst:e,continue:!t.abort});return}let n=new URL(r);t.hostname&&(t.hostname.lastIndex=0,t.hostname.test(n.hostname)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid hostname",pattern:t.hostname.source,input:o.value,inst:e,continue:!t.abort})),t.protocol&&(t.protocol.lastIndex=0,t.protocol.test(n.protocol.endsWith(":")?n.protocol.slice(0,-1):n.protocol)||o.issues.push({code:"invalid_format",format:"url",note:"Invalid protocol",pattern:t.protocol.source,input:o.value,inst:e,continue:!t.abort})),t.normalize?o.value=n.href:o.value=r;return}catch{o.issues.push({code:"invalid_format",format:"url",input:o.value,inst:e,continue:!t.abort})}}}),$i=f("$ZodEmoji",(e,t)=>{t.pattern??(t.pattern=Cn()),T.init(e,t)}),Si=f("$ZodNanoID",(e,t)=>{t.pattern??(t.pattern=En),T.init(e,t)}),Pi=f("$ZodCUID",(e,t)=>{t.pattern??(t.pattern=Sn),T.init(e,t)}),Zi=f("$ZodCUID2",(e,t)=>{t.pattern??(t.pattern=Pn),T.init(e,t)}),Ii=f("$ZodULID",(e,t)=>{t.pattern??(t.pattern=Zn),T.init(e,t)}),Ri=f("$ZodXID",(e,t)=>{t.pattern??(t.pattern=In),T.init(e,t)}),Ei=f("$ZodKSUID",(e,t)=>{t.pattern??(t.pattern=Rn),T.init(e,t)}),Ai=f("$ZodISODateTime",(e,t)=>{t.pattern??(t.pattern=Jn(t)),T.init(e,t)}),Ti=f("$ZodISODate",(e,t)=>{t.pattern??(t.pattern=Bn),T.init(e,t)}),Oi=f("$ZodISOTime",(e,t)=>{t.pattern??(t.pattern=Wn(t)),T.init(e,t)}),Ci=f("$ZodISODuration",(e,t)=>{t.pattern??(t.pattern=An),T.init(e,t)}),ji=f("$ZodIPv4",(e,t)=>{t.pattern??(t.pattern=jn),T.init(e,t),e._zod.bag.format="ipv4"}),Ni=f("$ZodIPv6",(e,t)=>{t.pattern??(t.pattern=Nn),T.init(e,t),e._zod.bag.format="ipv6",e._zod.check=o=>{try{new URL(`http://[${o.value}]`)}catch{o.issues.push({code:"invalid_format",format:"ipv6",input:o.value,inst:e,continue:!t.abort})}}}),Li=f("$ZodMAC",(e,t)=>{t.pattern??(t.pattern=Ln(t.delimiter)),T.init(e,t),e._zod.bag.format="mac"}),Di=f("$ZodCIDRv4",(e,t)=>{t.pattern??(t.pattern=Dn),T.init(e,t)}),qi=f("$ZodCIDRv6",(e,t)=>{t.pattern??(t.pattern=qn),T.init(e,t),e._zod.check=o=>{let r=o.value.split("/");try{if(r.length!==2)throw new Error;let[n,s]=r;if(!s)throw new Error;let a=Number(s);if(`${a}`!==s)throw new Error;if(a<0||a>128)throw new Error;new URL(`http://[${n}]`)}catch{o.issues.push({code:"invalid_format",format:"cidrv6",input:o.value,inst:e,continue:!t.abort})}}});function Mi(e){if(e==="")return!0;if(/\s/.test(e)||e.length%4!==0)return!1;try{return atob(e),!0}catch{return!1}}i(Mi,"isValidBase64");var Fi=f("$ZodBase64",(e,t)=>{t.pattern??(t.pattern=Mn),T.init(e,t),e._zod.bag.contentEncoding="base64",e._zod.check=o=>{Mi(o.value)||o.issues.push({code:"invalid_format",format:"base64",input:o.value,inst:e,continue:!t.abort})}});function t0(e){if(!ko.test(e))return!1;let t=e.replace(/[-_]/g,r=>r==="-"?"+":"/"),o=t.padEnd(Math.ceil(t.length/4)*4,"=");return Mi(o)}i(t0,"isValidBase64URL");var Ui=f("$ZodBase64URL",(e,t)=>{t.pattern??(t.pattern=ko),T.init(e,t),e._zod.bag.contentEncoding="base64url",e._zod.check=o=>{t0(o.value)||o.issues.push({code:"invalid_format",format:"base64url",input:o.value,inst:e,continue:!t.abort})}}),Bi=f("$ZodE164",(e,t)=>{t.pattern??(t.pattern=Un),T.init(e,t)});function o0(e,t=null){try{let o=e.split(".");if(o.length!==3)return!1;let[r]=o;if(!r)return!1;let n=JSON.parse(atob(r));return!("typ"in n&&n?.typ!=="JWT"||!n.alg||t&&(!("alg"in n)||n.alg!==t))}catch{return!1}}i(o0,"isValidJWT");var Wi=f("$ZodJWT",(e,t)=>{T.init(e,t),e._zod.check=o=>{o0(o.value,t.alg)||o.issues.push({code:"invalid_format",format:"jwt",input:o.value,inst:e,continue:!t.abort})}}),Ji=f("$ZodCustomStringFormat",(e,t)=>{T.init(e,t),e._zod.check=o=>{t.fn(o.value)||o.issues.push({code:"invalid_format",format:t.format,input:o.value,inst:e,continue:!t.abort})}}),Eo=f("$ZodNumber",(e,t)=>{S.init(e,t),e._zod.pattern=e._zod.bag.pattern??zo,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=Number(o.value)}catch{}let n=o.value;if(typeof n=="number"&&!Number.isNaN(n)&&Number.isFinite(n))return o;let s=typeof n=="number"?Number.isNaN(n)?"NaN":Number.isFinite(n)?void 0:"Infinity":void 0;return o.issues.push({expected:"number",code:"invalid_type",input:n,inst:e,...s?{received:s}:{}}),o}}),Ki=f("$ZodNumberFormat",(e,t)=>{oi.init(e,t),Eo.init(e,t)}),Tt=f("$ZodBoolean",(e,t)=>{S.init(e,t),e._zod.pattern=Yn,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=!!o.value}catch{}let n=o.value;return typeof n=="boolean"||o.issues.push({expected:"boolean",code:"invalid_type",input:n,inst:e}),o}}),Ao=f("$ZodBigInt",(e,t)=>{S.init(e,t),e._zod.pattern=Vn,e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=BigInt(o.value)}catch{}return typeof o.value=="bigint"||o.issues.push({expected:"bigint",code:"invalid_type",input:o.value,inst:e}),o}}),Vi=f("$ZodBigIntFormat",(e,t)=>{ri.init(e,t),Ao.init(e,t)}),Hi=f("$ZodSymbol",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return typeof n=="symbol"||o.issues.push({expected:"symbol",code:"invalid_type",input:n,inst:e}),o}}),Yi=f("$ZodUndefined",(e,t)=>{S.init(e,t),e._zod.pattern=Xn,e._zod.values=new Set([void 0]),e._zod.parse=(o,r)=>{let n=o.value;return typeof n>"u"||o.issues.push({expected:"undefined",code:"invalid_type",input:n,inst:e}),o}}),Gi=f("$ZodNull",(e,t)=>{S.init(e,t),e._zod.pattern=Gn,e._zod.values=new Set([null]),e._zod.parse=(o,r)=>{let n=o.value;return n===null||o.issues.push({expected:"null",code:"invalid_type",input:n,inst:e}),o}}),Xi=f("$ZodAny",(e,t)=>{S.init(e,t),e._zod.parse=o=>o}),Qi=f("$ZodUnknown",(e,t)=>{S.init(e,t),e._zod.parse=o=>o}),es=f("$ZodNever",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>(o.issues.push({expected:"never",code:"invalid_type",input:o.value,inst:e}),o)}),ts=f("$ZodVoid",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return typeof n>"u"||o.issues.push({expected:"void",code:"invalid_type",input:n,inst:e}),o}}),os=f("$ZodDate",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{if(t.coerce)try{o.value=new Date(o.value)}catch{}let n=o.value,s=n instanceof Date;return s&&!Number.isNaN(n.getTime())||o.issues.push({expected:"date",code:"invalid_type",input:n,...s?{received:"Invalid Date"}:{},inst:e}),o}});function Ml(e,t,o){e.issues.length&&t.issues.push(...K(o,e.issues)),t.value[o]=e.value}i(Ml,"handleArrayResult");var rs=f("$ZodArray",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!Array.isArray(n))return o.issues.push({expected:"array",code:"invalid_type",input:n,inst:e}),o;o.value=Array(n.length);let s=[];for(let a=0;a<n.length;a++){let c=n[a],l=t.element._zod.run({value:c,issues:[]},r);l instanceof Promise?s.push(l.then(p=>Ml(p,o,a))):Ml(l,o,a)}return s.length?Promise.all(s).then(()=>o):o}});function Ro(e,t,o,r,n,s){let a=o in r;if(e.issues.length){if(n&&s&&!a)return;t.issues.push(...K(o,e.issues))}if(!a&&!n){e.issues.length||t.issues.push({code:"invalid_type",expected:"nonoptional",input:void 0,path:[o]});return}e.value===void 0?a&&(t.value[o]=void 0):t.value[o]=e.value}i(Ro,"handlePropertyResult");function r0(e){let t=Object.keys(e.shape);for(let r of t)if(!e.shape?.[r]?._zod?.traits?.has("$ZodType"))throw new Error(`Invalid element at key "${r}": expected a Zod schema`);let o=gn(e.shape);return{...e,keys:t,keySet:new Set(t),numKeys:t.length,optionalKeys:new Set(o)}}i(r0,"normalizeDef");function n0(e,t,o,r,n,s){let a=[],c=n.keySet,l=n.catchall._zod,p=l.def.type,d=l.optin==="optional",h=l.optout==="optional";for(let y in t){if(y==="__proto__"||c.has(y))continue;if(p==="never"){a.push(y);continue}let w=l.run({value:t[y],issues:[]},r);w instanceof Promise?e.push(w.then(Z=>Ro(Z,o,y,t,d,h))):Ro(w,o,y,t,d,h)}return a.length&&o.issues.push({code:"unrecognized_keys",keys:a,input:t,inst:s}),e.length?Promise.all(e).then(()=>o):o}i(n0,"handleCatchall");var i0=f("$ZodObject",(e,t)=>{if(S.init(e,t),!Object.getOwnPropertyDescriptor(t,"shape")?.get){let c=t.shape;Object.defineProperty(t,"shape",{get:i(()=>{let l={...c};return Object.defineProperty(t,"shape",{value:l}),l},"get")})}let r=Fe(()=>r0(t));R(e._zod,"propValues",()=>{let c=t.shape,l={};for(let p in c){let d=c[p]._zod;if(d.values){l[p]??(l[p]=new Set);for(let h of d.values)l[p].add(h)}}return l});let n=Re,s=t.catchall,a;e._zod.parse=(c,l)=>{a??(a=r.value);let p=c.value;if(!n(p))return c.issues.push({expected:"object",code:"invalid_type",input:p,inst:e}),c;c.value={};let d=[],h=a.shape;for(let y of a.keys){let w=h[y],Z=w._zod.optin==="optional",Y=w._zod.optout==="optional",D=w._zod.run({value:p[y],issues:[]},l);D instanceof Promise?d.push(D.then(yt=>Ro(yt,c,y,p,Z,Y))):Ro(D,c,y,p,Z,Y)}return s?n0(d,p,c,l,r.value,e):d.length?Promise.all(d).then(()=>c):c}}),ns=f("$ZodObjectJIT",(e,t)=>{i0.init(e,t);let o=e._zod.parse,r=Fe(()=>r0(t)),n=i(y=>{let w=new At(["shape","payload","ctx"]),Z=r.value,Y=i(ee=>{let N=lo(ee);return`shape[${N}]._zod.run({ value: input[${N}], issues: [] }, ctx)`},"parseStr");w.write("const input = payload.value;");let D=Object.create(null),yt=0;for(let ee of Z.keys)D[ee]=`key_${yt++}`;w.write("const newResult = {};");for(let ee of Z.keys){let N=D[ee],q=lo(ee),no=y[ee],io=no?._zod?.optin==="optional",rn=no?._zod?.optout==="optional";w.write(`const ${N} = ${Y(ee)};`),io&&rn?w.write(`
        if (${N}.issues.length) {
          if (${q} in input) {
            payload.issues = payload.issues.concat(${N}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${q}, ...iss.path] : [${q}]
            })));
          }
        }
        
        if (${N}.value === undefined) {
          if (${q} in input) {
            newResult[${q}] = undefined;
          }
        } else {
          newResult[${q}] = ${N}.value;
        }
        
      `):io?w.write(`
        if (${N}.issues.length) {
          payload.issues = payload.issues.concat(${N}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${q}, ...iss.path] : [${q}]
          })));
        }
        
        if (${N}.value === undefined) {
          if (${q} in input) {
            newResult[${q}] = undefined;
          }
        } else {
          newResult[${q}] = ${N}.value;
        }
        
      `):w.write(`
        const ${N}_present = ${q} in input;
        if (${N}.issues.length) {
          payload.issues = payload.issues.concat(${N}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${q}, ...iss.path] : [${q}]
          })));
        }
        if (!${N}_present && !${N}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${q}]
          });
        }

        if (${N}_present) {
          if (${N}.value === undefined) {
            newResult[${q}] = undefined;
          } else {
            newResult[${q}] = ${N}.value;
          }
        }

      `)}w.write("payload.value = newResult;"),w.write("return payload;");let on=w.compile();return(ee,N)=>on(y,ee,N)},"generateFastpass"),s,a=Re,c=!Ie.jitless,p=c&&mn.value,d=t.catchall,h;e._zod.parse=(y,w)=>{h??(h=r.value);let Z=y.value;return a(Z)?c&&p&&w?.async===!1&&w.jitless!==!0?(s||(s=n(t.shape)),y=s(y,w),d?n0([],Z,y,w,h,e):y):o(y,w):(y.issues.push({expected:"object",code:"invalid_type",input:Z,inst:e}),y)}});function Fl(e,t,o,r){for(let s of e)if(s.issues.length===0)return t.value=s.value,t;let n=e.filter(s=>!we(s));return n.length===1?(t.value=n[0].value,n[0]):(t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:e.map(s=>s.issues.map(a=>B(a,r,L())))}),t)}i(Fl,"handleUnionResults");var Ot=f("$ZodUnion",(e,t)=>{S.init(e,t),R(e._zod,"optin",()=>t.options.some(r=>r._zod.optin==="optional")?"optional":void 0),R(e._zod,"optout",()=>t.options.some(r=>r._zod.optout==="optional")?"optional":void 0),R(e._zod,"values",()=>{if(t.options.every(r=>r._zod.values))return new Set(t.options.flatMap(r=>Array.from(r._zod.values)))}),R(e._zod,"pattern",()=>{if(t.options.every(r=>r._zod.pattern)){let r=t.options.map(n=>n._zod.pattern);return new RegExp(`^(${r.map(n=>kt(n.source)).join("|")})$`)}});let o=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(r,n)=>{if(o)return o(r,n);let s=!1,a=[];for(let c of t.options){let l=c._zod.run({value:r.value,issues:[]},n);if(l instanceof Promise)a.push(l),s=!0;else{if(l.issues.length===0)return l;a.push(l)}}return s?Promise.all(a).then(c=>Fl(c,r,e,n)):Fl(a,r,e,n)}});function Ul(e,t,o,r){let n=e.filter(s=>s.issues.length===0);return n.length===1?(t.value=n[0].value,t):(n.length===0?t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:e.map(s=>s.issues.map(a=>B(a,r,L())))}):t.issues.push({code:"invalid_union",input:t.value,inst:o,errors:[],inclusive:!1}),t)}i(Ul,"handleExclusiveUnionResults");var is=f("$ZodXor",(e,t)=>{Ot.init(e,t),t.inclusive=!1;let o=t.options.length===1?t.options[0]._zod.run:null;e._zod.parse=(r,n)=>{if(o)return o(r,n);let s=!1,a=[];for(let c of t.options){let l=c._zod.run({value:r.value,issues:[]},n);l instanceof Promise?(a.push(l),s=!0):a.push(l)}return s?Promise.all(a).then(c=>Ul(c,r,e,n)):Ul(a,r,e,n)}}),ss=f("$ZodDiscriminatedUnion",(e,t)=>{t.inclusive=!1,Ot.init(e,t);let o=e._zod.parse;R(e._zod,"propValues",()=>{let n={};for(let s of t.options){let a=s._zod.propValues;if(!a||Object.keys(a).length===0)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(s)}"`);for(let[c,l]of Object.entries(a)){n[c]||(n[c]=new Set);for(let p of l)n[c].add(p)}}return n});let r=Fe(()=>{let n=t.options,s=new Map;for(let a of n){let c=a._zod.propValues?.[t.discriminator];if(!c||c.size===0)throw new Error(`Invalid discriminated union option at index "${t.options.indexOf(a)}"`);for(let l of c){if(s.has(l))throw new Error(`Duplicate discriminator value "${String(l)}"`);s.set(l,a)}}return s});e._zod.parse=(n,s)=>{let a=n.value;if(!Re(a))return n.issues.push({code:"invalid_type",expected:"object",input:a,inst:e}),n;let c=r.value.get(a?.[t.discriminator]);return c?c._zod.run(n,s):t.unionFallback||s.direction==="backward"?o(n,s):(n.issues.push({code:"invalid_union",errors:[],note:"No matching discriminator",discriminator:t.discriminator,options:Array.from(r.value.keys()),input:a,path:[t.discriminator],inst:e}),n)}}),as=f("$ZodIntersection",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value,s=t.left._zod.run({value:n,issues:[]},r),a=t.right._zod.run({value:n,issues:[]},r);return s instanceof Promise||a instanceof Promise?Promise.all([s,a]).then(([l,p])=>Bl(o,l,p)):Bl(o,s,a)}});function yi(e,t){if(e===t)return{valid:!0,data:e};if(e instanceof Date&&t instanceof Date&&+e==+t)return{valid:!0,data:e};if(ye(e)&&ye(t)){let o=Object.keys(t),r=Object.keys(e).filter(s=>o.indexOf(s)!==-1),n={...e,...t};for(let s of r){let a=yi(e[s],t[s]);if(!a.valid)return{valid:!1,mergeErrorPath:[s,...a.mergeErrorPath]};n[s]=a.data}return{valid:!0,data:n}}if(Array.isArray(e)&&Array.isArray(t)){if(e.length!==t.length)return{valid:!1,mergeErrorPath:[]};let o=[];for(let r=0;r<e.length;r++){let n=e[r],s=t[r],a=yi(n,s);if(!a.valid)return{valid:!1,mergeErrorPath:[r,...a.mergeErrorPath]};o.push(a.data)}return{valid:!0,data:o}}return{valid:!1,mergeErrorPath:[]}}i(yi,"mergeValues");function Bl(e,t,o){let r=new Map,n;for(let c of t.issues)if(c.code==="unrecognized_keys"){n??(n=c);for(let l of c.keys)r.has(l)||r.set(l,{}),r.get(l).l=!0}else e.issues.push(c);for(let c of o.issues)if(c.code==="unrecognized_keys")for(let l of c.keys)r.has(l)||r.set(l,{}),r.get(l).r=!0;else e.issues.push(c);let s=[...r].filter(([,c])=>c.l&&c.r).map(([c])=>c);if(s.length&&n&&e.issues.push({...n,keys:s}),we(e))return e;let a=yi(t.value,o.value);if(!a.valid)throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(a.mergeErrorPath)}`);return e.value=a.data,e}i(Bl,"handleIntersectionResults");var To=f("$ZodTuple",(e,t)=>{S.init(e,t);let o=t.items;e._zod.parse=(r,n)=>{let s=r.value;if(!Array.isArray(s))return r.issues.push({input:s,inst:e,expected:"tuple",code:"invalid_type"}),r;r.value=[];let a=[],c=Wl(o,"optin"),l=Wl(o,"optout");if(!t.rest){if(s.length<c)return r.issues.push({code:"too_small",minimum:c,inclusive:!0,input:s,inst:e,origin:"array"}),r;s.length>o.length&&r.issues.push({code:"too_big",maximum:o.length,inclusive:!0,input:s,inst:e,origin:"array"})}let p=new Array(o.length);for(let d=0;d<o.length;d++){let h=o[d]._zod.run({value:s[d],issues:[]},n);h instanceof Promise?a.push(h.then(y=>{p[d]=y})):p[d]=h}if(t.rest){let d=o.length-1,h=s.slice(o.length);for(let y of h){d++;let w=t.rest._zod.run({value:y,issues:[]},n);w instanceof Promise?a.push(w.then(Z=>Jl(Z,r,d))):Jl(w,r,d)}}return a.length?Promise.all(a).then(()=>Kl(p,r,o,s,l)):Kl(p,r,o,s,l)}});function Wl(e,t){for(let o=e.length-1;o>=0;o--)if(e[o]._zod[t]!=="optional")return o+1;return 0}i(Wl,"getTupleOptStart");function Jl(e,t,o){e.issues.length&&t.issues.push(...K(o,e.issues)),t.value[o]=e.value}i(Jl,"handleTupleResult");function Kl(e,t,o,r,n){for(let s=0;s<o.length;s++){let a=e[s],c=s<r.length;if(a.issues.length){if(!c&&s>=n){t.value.length=s;break}t.issues.push(...K(s,a.issues))}t.value[s]=a.value}for(let s=t.value.length-1;s>=r.length&&(o[s]._zod.optout==="optional"&&t.value[s]===void 0);s--)t.value.length=s;return t}i(Kl,"handleTupleResults");var cs=f("$ZodRecord",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!ye(n))return o.issues.push({expected:"record",code:"invalid_type",input:n,inst:e}),o;let s=[],a=t.keyType._zod.values;if(a){o.value={};let c=new Set;for(let p of a)if(typeof p=="string"||typeof p=="number"||typeof p=="symbol"){c.add(typeof p=="number"?p.toString():p);let d=t.keyType._zod.run({value:p,issues:[]},r);if(d instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(d.issues.length){o.issues.push({code:"invalid_key",origin:"record",issues:d.issues.map(w=>B(w,r,L())),input:p,path:[p],inst:e});continue}let h=d.value,y=t.valueType._zod.run({value:n[p],issues:[]},r);y instanceof Promise?s.push(y.then(w=>{w.issues.length&&o.issues.push(...K(p,w.issues)),o.value[h]=w.value})):(y.issues.length&&o.issues.push(...K(p,y.issues)),o.value[h]=y.value)}let l;for(let p in n)c.has(p)||(l=l??[],l.push(p));l&&l.length>0&&o.issues.push({code:"unrecognized_keys",input:n,inst:e,keys:l})}else{o.value={};for(let c of Reflect.ownKeys(n)){if(c==="__proto__"||!Object.prototype.propertyIsEnumerable.call(n,c))continue;let l=t.keyType._zod.run({value:c,issues:[]},r);if(l instanceof Promise)throw new Error("Async schemas not supported in object keys currently");if(typeof c=="string"&&zo.test(c)&&l.issues.length){let h=t.keyType._zod.run({value:Number(c),issues:[]},r);if(h instanceof Promise)throw new Error("Async schemas not supported in object keys currently");h.issues.length===0&&(l=h)}if(l.issues.length){t.mode==="loose"?o.value[c]=n[c]:o.issues.push({code:"invalid_key",origin:"record",issues:l.issues.map(h=>B(h,r,L())),input:c,path:[c],inst:e});continue}let d=t.valueType._zod.run({value:n[c],issues:[]},r);d instanceof Promise?s.push(d.then(h=>{h.issues.length&&o.issues.push(...K(c,h.issues)),o.value[l.value]=h.value})):(d.issues.length&&o.issues.push(...K(c,d.issues)),o.value[l.value]=d.value)}}return s.length?Promise.all(s).then(()=>o):o}}),ls=f("$ZodMap",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!(n instanceof Map))return o.issues.push({expected:"map",code:"invalid_type",input:n,inst:e}),o;let s=[];o.value=new Map;for(let[a,c]of n){let l=t.keyType._zod.run({value:a,issues:[]},r),p=t.valueType._zod.run({value:c,issues:[]},r);l instanceof Promise||p instanceof Promise?s.push(Promise.all([l,p]).then(([d,h])=>{Vl(d,h,o,a,n,e,r)})):Vl(l,p,o,a,n,e,r)}return s.length?Promise.all(s).then(()=>o):o}});function Vl(e,t,o,r,n,s,a){e.issues.length&&(zt.has(typeof r)?o.issues.push(...K(r,e.issues)):o.issues.push({code:"invalid_key",origin:"map",input:n,inst:s,issues:e.issues.map(c=>B(c,a,L()))})),t.issues.length&&(zt.has(typeof r)?o.issues.push(...K(r,t.issues)):o.issues.push({origin:"map",code:"invalid_element",input:n,inst:s,key:r,issues:t.issues.map(c=>B(c,a,L()))})),o.value.set(e.value,t.value)}i(Vl,"handleMapResult");var us=f("$ZodSet",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;if(!(n instanceof Set))return o.issues.push({input:n,inst:e,expected:"set",code:"invalid_type"}),o;let s=[];o.value=new Set;for(let a of n){let c=t.valueType._zod.run({value:a,issues:[]},r);c instanceof Promise?s.push(c.then(l=>Hl(l,o))):Hl(c,o)}return s.length?Promise.all(s).then(()=>o):o}});function Hl(e,t){e.issues.length&&t.issues.push(...e.issues),t.value.add(e.value)}i(Hl,"handleSetResult");var ps=f("$ZodEnum",(e,t)=>{S.init(e,t);let o=_t(t.entries),r=new Set(o);e._zod.values=r,e._zod.pattern=new RegExp(`^(${o.filter(n=>zt.has(typeof n)).map(n=>typeof n=="string"?te(n):n.toString()).join("|")})$`),e._zod.parse=(n,s)=>{let a=n.value;return r.has(a)||n.issues.push({code:"invalid_value",values:o,input:a,inst:e}),n}}),fs=f("$ZodLiteral",(e,t)=>{if(S.init(e,t),t.values.length===0)throw new Error("Cannot create literal schema with no valid values");let o=new Set(t.values);e._zod.values=o,e._zod.pattern=new RegExp(`^(${t.values.map(r=>typeof r=="string"?te(r):r?te(r.toString()):String(r)).join("|")})$`),e._zod.parse=(r,n)=>{let s=r.value;return o.has(s)||r.issues.push({code:"invalid_value",values:t.values,input:s,inst:e}),r}}),ds=f("$ZodFile",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{let n=o.value;return n instanceof File||o.issues.push({expected:"file",code:"invalid_type",input:n,inst:e}),o}}),ms=f("$ZodTransform",(e,t)=>{S.init(e,t),e._zod.optin="optional",e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new ge(e.constructor.name);let n=t.transform(o.value,o);if(r.async)return(n instanceof Promise?n:Promise.resolve(n)).then(a=>(o.value=a,o.fallback=!0,o));if(n instanceof Promise)throw new oe;return o.value=n,o.fallback=!0,o}});function Yl(e,t){return t===void 0&&(e.issues.length||e.fallback)?{issues:[],value:void 0}:e}i(Yl,"handleOptionalResult");var Oo=f("$ZodOptional",(e,t)=>{S.init(e,t),e._zod.optin="optional",e._zod.optout="optional",R(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,void 0]):void 0),R(e._zod,"pattern",()=>{let o=t.innerType._zod.pattern;return o?new RegExp(`^(${kt(o.source)})?$`):void 0}),e._zod.parse=(o,r)=>{if(t.innerType._zod.optin==="optional"){let n=o.value,s=t.innerType._zod.run(o,r);return s instanceof Promise?s.then(a=>Yl(a,n)):Yl(s,n)}return o.value===void 0?o:t.innerType._zod.run(o,r)}}),hs=f("$ZodExactOptional",(e,t)=>{Oo.init(e,t),R(e._zod,"values",()=>t.innerType._zod.values),R(e._zod,"pattern",()=>t.innerType._zod.pattern),e._zod.parse=(o,r)=>t.innerType._zod.run(o,r)}),vs=f("$ZodNullable",(e,t)=>{S.init(e,t),R(e._zod,"optin",()=>t.innerType._zod.optin),R(e._zod,"optout",()=>t.innerType._zod.optout),R(e._zod,"pattern",()=>{let o=t.innerType._zod.pattern;return o?new RegExp(`^(${kt(o.source)}|null)$`):void 0}),R(e._zod,"values",()=>t.innerType._zod.values?new Set([...t.innerType._zod.values,null]):void 0),e._zod.parse=(o,r)=>o.value===null?o:t.innerType._zod.run(o,r)}),gs=f("$ZodDefault",(e,t)=>{S.init(e,t),e._zod.optin="optional",R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);if(o.value===void 0)return o.value=t.defaultValue,o;let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(s=>Gl(s,t)):Gl(n,t)}});function Gl(e,t){return e.value===void 0&&(e.value=t.defaultValue),e}i(Gl,"handleDefaultResult");var xs=f("$ZodPrefault",(e,t)=>{S.init(e,t),e._zod.optin="optional",R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>(r.direction==="backward"||o.value===void 0&&(o.value=t.defaultValue),t.innerType._zod.run(o,r))}),bs=f("$ZodNonOptional",(e,t)=>{S.init(e,t),R(e._zod,"values",()=>{let o=t.innerType._zod.values;return o?new Set([...o].filter(r=>r!==void 0)):void 0}),e._zod.parse=(o,r)=>{let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(s=>Xl(s,e)):Xl(n,e)}});function Xl(e,t){return!e.issues.length&&e.value===void 0&&e.issues.push({code:"invalid_type",expected:"nonoptional",input:e.value,inst:t}),e}i(Xl,"handleNonOptionalResult");var ys=f("$ZodSuccess",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new ge("ZodSuccess");let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(s=>(o.value=s.issues.length===0,o)):(o.value=n.issues.length===0,o)}}),ws=f("$ZodCatch",(e,t)=>{S.init(e,t),e._zod.optin="optional",R(e._zod,"optout",()=>t.innerType._zod.optout),R(e._zod,"values",()=>t.innerType._zod.values),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(s=>(o.value=s.value,s.issues.length&&(o.value=t.catchValue({...o,error:{issues:s.issues.map(a=>B(a,r,L()))},input:o.value}),o.issues=[],o.fallback=!0),o)):(o.value=n.value,n.issues.length&&(o.value=t.catchValue({...o,error:{issues:n.issues.map(s=>B(s,r,L()))},input:o.value}),o.issues=[],o.fallback=!0),o)}}),_s=f("$ZodNaN",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>((typeof o.value!="number"||!Number.isNaN(o.value))&&o.issues.push({input:o.value,inst:e,expected:"nan",code:"invalid_type"}),o)}),Co=f("$ZodPipe",(e,t)=>{S.init(e,t),R(e._zod,"values",()=>t.in._zod.values),R(e._zod,"optin",()=>t.in._zod.optin),R(e._zod,"optout",()=>t.out._zod.optout),R(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(o,r)=>{if(r.direction==="backward"){let s=t.out._zod.run(o,r);return s instanceof Promise?s.then(a=>Po(a,t.in,r)):Po(s,t.in,r)}let n=t.in._zod.run(o,r);return n instanceof Promise?n.then(s=>Po(s,t.out,r)):Po(n,t.out,r)}});function Po(e,t,o){return e.issues.length?(e.aborted=!0,e):t._zod.run({value:e.value,issues:e.issues,fallback:e.fallback},o)}i(Po,"handlePipeResult");var Ct=f("$ZodCodec",(e,t)=>{S.init(e,t),R(e._zod,"values",()=>t.in._zod.values),R(e._zod,"optin",()=>t.in._zod.optin),R(e._zod,"optout",()=>t.out._zod.optout),R(e._zod,"propValues",()=>t.in._zod.propValues),e._zod.parse=(o,r)=>{if((r.direction||"forward")==="forward"){let s=t.in._zod.run(o,r);return s instanceof Promise?s.then(a=>Zo(a,t,r)):Zo(s,t,r)}else{let s=t.out._zod.run(o,r);return s instanceof Promise?s.then(a=>Zo(a,t,r)):Zo(s,t,r)}}});function Zo(e,t,o){if(e.issues.length)return e.aborted=!0,e;if((o.direction||"forward")==="forward"){let n=t.transform(e.value,e);return n instanceof Promise?n.then(s=>Io(e,s,t.out,o)):Io(e,n,t.out,o)}else{let n=t.reverseTransform(e.value,e);return n instanceof Promise?n.then(s=>Io(e,s,t.in,o)):Io(e,n,t.in,o)}}i(Zo,"handleCodecAResult");function Io(e,t,o,r){return e.issues.length?(e.aborted=!0,e):o._zod.run({value:t,issues:e.issues},r)}i(Io,"handleCodecTxResult");var ks=f("$ZodPreprocess",(e,t)=>{Co.init(e,t)}),zs=f("$ZodReadonly",(e,t)=>{S.init(e,t),R(e._zod,"propValues",()=>t.innerType._zod.propValues),R(e._zod,"values",()=>t.innerType._zod.values),R(e._zod,"optin",()=>t.innerType?._zod?.optin),R(e._zod,"optout",()=>t.innerType?._zod?.optout),e._zod.parse=(o,r)=>{if(r.direction==="backward")return t.innerType._zod.run(o,r);let n=t.innerType._zod.run(o,r);return n instanceof Promise?n.then(Ql):Ql(n)}});function Ql(e){return e.value=Object.freeze(e.value),e}i(Ql,"handleReadonlyResult");var $s=f("$ZodTemplateLiteral",(e,t)=>{S.init(e,t);let o=[];for(let r of t.parts)if(typeof r=="object"&&r!==null){if(!r._zod.pattern)throw new Error(`Invalid template literal part, no pattern found: ${[...r._zod.traits].shift()}`);let n=r._zod.pattern instanceof RegExp?r._zod.pattern.source:r._zod.pattern;if(!n)throw new Error(`Invalid template literal part: ${r._zod.traits}`);let s=n.startsWith("^")?1:0,a=n.endsWith("$")?n.length-1:n.length;o.push(n.slice(s,a))}else if(r===null||vn.has(typeof r))o.push(te(`${r}`));else throw new Error(`Invalid template literal part: ${r}`);e._zod.pattern=new RegExp(`^${o.join("")}$`),e._zod.parse=(r,n)=>typeof r.value!="string"?(r.issues.push({input:r.value,inst:e,expected:"string",code:"invalid_type"}),r):(e._zod.pattern.lastIndex=0,e._zod.pattern.test(r.value)||r.issues.push({input:r.value,inst:e,code:"invalid_format",format:t.format??"template_literal",pattern:e._zod.pattern.source}),r)}),Ss=f("$ZodFunction",(e,t)=>(S.init(e,t),e._def=t,e._zod.def=t,e.implement=o=>{if(typeof o!="function")throw new Error("implement() must be called with a function");return function(...r){let n=e._def.input?fo(e._def.input,r):r,s=Reflect.apply(o,this,n);return e._def.output?fo(e._def.output,s):s}},e.implementAsync=o=>{if(typeof o!="function")throw new Error("implementAsync() must be called with a function");return async function(...r){let n=e._def.input?await mo(e._def.input,r):r,s=await Reflect.apply(o,this,n);return e._def.output?await mo(e._def.output,s):s}},e._zod.parse=(o,r)=>typeof o.value!="function"?(o.issues.push({code:"invalid_type",expected:"function",input:o.value,inst:e}),o):(e._def.output&&e._def.output._zod.def.type==="promise"?o.value=e.implementAsync(o.value):o.value=e.implement(o.value),o),e.input=(...o)=>{let r=e.constructor;return Array.isArray(o[0])?new r({type:"function",input:new To({type:"tuple",items:o[0],rest:o[1]}),output:e._def.output}):new r({type:"function",input:o[0],output:e._def.output})},e.output=o=>{let r=e.constructor;return new r({type:"function",input:e._def.input,output:o})},e)),Ps=f("$ZodPromise",(e,t)=>{S.init(e,t),e._zod.parse=(o,r)=>Promise.resolve(o.value).then(n=>t.innerType._zod.run({value:n,issues:[]},r))}),Zs=f("$ZodLazy",(e,t)=>{S.init(e,t),R(e._zod,"innerType",()=>{let o=t;return o._cachedInner||(o._cachedInner=t.getter()),o._cachedInner}),R(e._zod,"pattern",()=>e._zod.innerType?._zod?.pattern),R(e._zod,"propValues",()=>e._zod.innerType?._zod?.propValues),R(e._zod,"optin",()=>e._zod.innerType?._zod?.optin??void 0),R(e._zod,"optout",()=>e._zod.innerType?._zod?.optout??void 0),e._zod.parse=(o,r)=>e._zod.innerType._zod.run(o,r)}),Is=f("$ZodCustom",(e,t)=>{C.init(e,t),S.init(e,t),e._zod.parse=(o,r)=>o,e._zod.check=o=>{let r=o.value,n=t.fn(r);if(n instanceof Promise)return n.then(s=>e0(s,o,r,e));e0(n,o,r,e)}});function e0(e,t,o,r){if(!e){let n={code:"custom",input:o,inst:r,path:[...r._zod.def.path??[]],continue:!r._zod.def.abort};r._zod.def.params&&(n.params=r._zod.def.params),t.issues.push(Ue(n))}}i(e0,"handleRefineResult");var Nt={};pe(Nt,{en:()=>jt});var Ef=i(()=>{let e={string:{unit:"characters",verb:"to have"},file:{unit:"bytes",verb:"to have"},array:{unit:"items",verb:"to have"},set:{unit:"items",verb:"to have"},map:{unit:"entries",verb:"to have"}};function t(n){return e[n]??null}i(t,"getSizing");let o={regex:"input",email:"email address",url:"URL",emoji:"emoji",uuid:"UUID",uuidv4:"UUIDv4",uuidv6:"UUIDv6",nanoid:"nanoid",guid:"GUID",cuid:"cuid",cuid2:"cuid2",ulid:"ULID",xid:"XID",ksuid:"KSUID",datetime:"ISO datetime",date:"ISO date",time:"ISO time",duration:"ISO duration",ipv4:"IPv4 address",ipv6:"IPv6 address",mac:"MAC address",cidrv4:"IPv4 range",cidrv6:"IPv6 range",base64:"base64-encoded string",base64url:"base64url-encoded string",json_string:"JSON string",e164:"E.164 number",jwt:"JWT",template_literal:"input"},r={nan:"NaN"};return n=>{switch(n.code){case"invalid_type":{let s=r[n.expected]??n.expected,a=wn(n.input),c=r[a]??a;return`Invalid input: expected ${s}, received ${c}`}case"invalid_value":return n.values.length===1?`Invalid input: expected ${po(n.values[0])}`:`Invalid option: expected one of ${co(n.values,"|")}`;case"too_big":{let s=n.inclusive?"<=":"<",a=t(n.origin);return a?`Too big: expected ${n.origin??"value"} to have ${s}${n.maximum.toString()} ${a.unit??"elements"}`:`Too big: expected ${n.origin??"value"} to be ${s}${n.maximum.toString()}`}case"too_small":{let s=n.inclusive?">=":">",a=t(n.origin);return a?`Too small: expected ${n.origin} to have ${s}${n.minimum.toString()} ${a.unit}`:`Too small: expected ${n.origin} to be ${s}${n.minimum.toString()}`}case"invalid_format":{let s=n;return s.format==="starts_with"?`Invalid string: must start with "${s.prefix}"`:s.format==="ends_with"?`Invalid string: must end with "${s.suffix}"`:s.format==="includes"?`Invalid string: must include "${s.includes}"`:s.format==="regex"?`Invalid string: must match pattern ${s.pattern}`:`Invalid ${o[s.format]??n.format}`}case"not_multiple_of":return`Invalid number: must be a multiple of ${n.divisor}`;case"unrecognized_keys":return`Unrecognized key${n.keys.length>1?"s":""}: ${co(n.keys,", ")}`;case"invalid_key":return`Invalid key in ${n.origin}`;case"invalid_union":return n.options&&Array.isArray(n.options)&&n.options.length>0?`Invalid discriminator value. Expected ${n.options.map(a=>`'${a}'`).join(" | ")}`:"Invalid input";case"invalid_element":return`Invalid value in ${n.origin}`;default:return"Invalid input"}}},"error");function jt(){return{localeError:Ef()}}i(jt,"default");var s0,Rs=Symbol("ZodOutput"),Es=Symbol("ZodInput"),jo=class{static{i(this,"$ZodRegistry")}constructor(){this._map=new WeakMap,this._idmap=new Map}add(t,...o){let r=o[0];return this._map.set(t,r),r&&typeof r=="object"&&"id"in r&&this._idmap.set(r.id,t),this}clear(){return this._map=new WeakMap,this._idmap=new Map,this}remove(t){let o=this._map.get(t);return o&&typeof o=="object"&&"id"in o&&this._idmap.delete(o.id),this._map.delete(t),this}get(t){let o=t._zod.parent;if(o){let r={...this.get(o)??{}};delete r.id;let n={...r,...this._map.get(t)};return Object.keys(n).length?n:void 0}return this._map.get(t)}has(t){return this._map.has(t)}};function No(){return new jo}i(No,"registry");(s0=globalThis).__zod_globalRegistry??(s0.__zod_globalRegistry=No());var M=globalThis.__zod_globalRegistry;function As(e,t){return new e({type:"string",...b(t)})}i(As,"_string");function Ts(e,t){return new e({type:"string",coerce:!0,...b(t)})}i(Ts,"_coercedString");function Lo(e,t){return new e({type:"string",format:"email",check:"string_format",abort:!1,...b(t)})}i(Lo,"_email");function Lt(e,t){return new e({type:"string",format:"guid",check:"string_format",abort:!1,...b(t)})}i(Lt,"_guid");function Do(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,...b(t)})}i(Do,"_uuid");function qo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v4",...b(t)})}i(qo,"_uuidv4");function Mo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v6",...b(t)})}i(Mo,"_uuidv6");function Fo(e,t){return new e({type:"string",format:"uuid",check:"string_format",abort:!1,version:"v7",...b(t)})}i(Fo,"_uuidv7");function Dt(e,t){return new e({type:"string",format:"url",check:"string_format",abort:!1,...b(t)})}i(Dt,"_url");function Uo(e,t){return new e({type:"string",format:"emoji",check:"string_format",abort:!1,...b(t)})}i(Uo,"_emoji");function Bo(e,t){return new e({type:"string",format:"nanoid",check:"string_format",abort:!1,...b(t)})}i(Bo,"_nanoid");function Wo(e,t){return new e({type:"string",format:"cuid",check:"string_format",abort:!1,...b(t)})}i(Wo,"_cuid");function Jo(e,t){return new e({type:"string",format:"cuid2",check:"string_format",abort:!1,...b(t)})}i(Jo,"_cuid2");function Ko(e,t){return new e({type:"string",format:"ulid",check:"string_format",abort:!1,...b(t)})}i(Ko,"_ulid");function Vo(e,t){return new e({type:"string",format:"xid",check:"string_format",abort:!1,...b(t)})}i(Vo,"_xid");function Ho(e,t){return new e({type:"string",format:"ksuid",check:"string_format",abort:!1,...b(t)})}i(Ho,"_ksuid");function Yo(e,t){return new e({type:"string",format:"ipv4",check:"string_format",abort:!1,...b(t)})}i(Yo,"_ipv4");function Go(e,t){return new e({type:"string",format:"ipv6",check:"string_format",abort:!1,...b(t)})}i(Go,"_ipv6");function Os(e,t){return new e({type:"string",format:"mac",check:"string_format",abort:!1,...b(t)})}i(Os,"_mac");function Xo(e,t){return new e({type:"string",format:"cidrv4",check:"string_format",abort:!1,...b(t)})}i(Xo,"_cidrv4");function Qo(e,t){return new e({type:"string",format:"cidrv6",check:"string_format",abort:!1,...b(t)})}i(Qo,"_cidrv6");function er(e,t){return new e({type:"string",format:"base64",check:"string_format",abort:!1,...b(t)})}i(er,"_base64");function tr(e,t){return new e({type:"string",format:"base64url",check:"string_format",abort:!1,...b(t)})}i(tr,"_base64url");function or(e,t){return new e({type:"string",format:"e164",check:"string_format",abort:!1,...b(t)})}i(or,"_e164");function rr(e,t){return new e({type:"string",format:"jwt",check:"string_format",abort:!1,...b(t)})}i(rr,"_jwt");var Cs={Any:null,Minute:-1,Second:0,Millisecond:3,Microsecond:6};function js(e,t){return new e({type:"string",format:"datetime",check:"string_format",offset:!1,local:!1,precision:null,...b(t)})}i(js,"_isoDateTime");function Ns(e,t){return new e({type:"string",format:"date",check:"string_format",...b(t)})}i(Ns,"_isoDate");function Ls(e,t){return new e({type:"string",format:"time",check:"string_format",precision:null,...b(t)})}i(Ls,"_isoTime");function Ds(e,t){return new e({type:"string",format:"duration",check:"string_format",...b(t)})}i(Ds,"_isoDuration");function qs(e,t){return new e({type:"number",checks:[],...b(t)})}i(qs,"_number");function Ms(e,t){return new e({type:"number",coerce:!0,checks:[],...b(t)})}i(Ms,"_coercedNumber");function Fs(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"safeint",...b(t)})}i(Fs,"_int");function Us(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"float32",...b(t)})}i(Us,"_float32");function Bs(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"float64",...b(t)})}i(Bs,"_float64");function Ws(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"int32",...b(t)})}i(Ws,"_int32");function Js(e,t){return new e({type:"number",check:"number_format",abort:!1,format:"uint32",...b(t)})}i(Js,"_uint32");function Ks(e,t){return new e({type:"boolean",...b(t)})}i(Ks,"_boolean");function Vs(e,t){return new e({type:"boolean",coerce:!0,...b(t)})}i(Vs,"_coercedBoolean");function Hs(e,t){return new e({type:"bigint",...b(t)})}i(Hs,"_bigint");function Ys(e,t){return new e({type:"bigint",coerce:!0,...b(t)})}i(Ys,"_coercedBigint");function Gs(e,t){return new e({type:"bigint",check:"bigint_format",abort:!1,format:"int64",...b(t)})}i(Gs,"_int64");function Xs(e,t){return new e({type:"bigint",check:"bigint_format",abort:!1,format:"uint64",...b(t)})}i(Xs,"_uint64");function Qs(e,t){return new e({type:"symbol",...b(t)})}i(Qs,"_symbol");function ea(e,t){return new e({type:"undefined",...b(t)})}i(ea,"_undefined");function ta(e,t){return new e({type:"null",...b(t)})}i(ta,"_null");function oa(e){return new e({type:"any"})}i(oa,"_any");function ra(e){return new e({type:"unknown"})}i(ra,"_unknown");function na(e,t){return new e({type:"never",...b(t)})}i(na,"_never");function ia(e,t){return new e({type:"void",...b(t)})}i(ia,"_void");function sa(e,t){return new e({type:"date",...b(t)})}i(sa,"_date");function aa(e,t){return new e({type:"date",coerce:!0,...b(t)})}i(aa,"_coercedDate");function ca(e,t){return new e({type:"nan",...b(t)})}i(ca,"_nan");function ne(e,t){return new $o({check:"less_than",...b(t),value:e,inclusive:!1})}i(ne,"_lt");function Q(e,t){return new $o({check:"less_than",...b(t),value:e,inclusive:!0})}i(Q,"_lte");function ie(e,t){return new So({check:"greater_than",...b(t),value:e,inclusive:!1})}i(ie,"_gt");function W(e,t){return new So({check:"greater_than",...b(t),value:e,inclusive:!0})}i(W,"_gte");function nr(e){return ie(0,e)}i(nr,"_positive");function ir(e){return ne(0,e)}i(ir,"_negative");function sr(e){return Q(0,e)}i(sr,"_nonpositive");function ar(e){return W(0,e)}i(ar,"_nonnegative");function _e(e,t){return new ti({check:"multiple_of",...b(t),value:e})}i(_e,"_multipleOf");function ke(e,t){return new ni({check:"max_size",...b(t),maximum:e})}i(ke,"_maxSize");function se(e,t){return new ii({check:"min_size",...b(t),minimum:e})}i(se,"_minSize");function Te(e,t){return new si({check:"size_equals",...b(t),size:e})}i(Te,"_size");function Oe(e,t){return new ai({check:"max_length",...b(t),maximum:e})}i(Oe,"_maxLength");function de(e,t){return new ci({check:"min_length",...b(t),minimum:e})}i(de,"_minLength");function Ce(e,t){return new li({check:"length_equals",...b(t),length:e})}i(Ce,"_length");function He(e,t){return new ui({check:"string_format",format:"regex",...b(t),pattern:e})}i(He,"_regex");function Ye(e){return new pi({check:"string_format",format:"lowercase",...b(e)})}i(Ye,"_lowercase");function Ge(e){return new fi({check:"string_format",format:"uppercase",...b(e)})}i(Ge,"_uppercase");function Xe(e,t){return new di({check:"string_format",format:"includes",...b(t),includes:e})}i(Xe,"_includes");function Qe(e,t){return new mi({check:"string_format",format:"starts_with",...b(t),prefix:e})}i(Qe,"_startsWith");function et(e,t){return new hi({check:"string_format",format:"ends_with",...b(t),suffix:e})}i(et,"_endsWith");function cr(e,t,o){return new vi({check:"property",property:e,schema:t,...b(o)})}i(cr,"_property");function tt(e,t){return new gi({check:"mime_type",mime:e,...b(t)})}i(tt,"_mime");function re(e){return new xi({check:"overwrite",tx:e})}i(re,"_overwrite");function ot(e){return re(t=>t.normalize(e))}i(ot,"_normalize");function rt(){return re(e=>e.trim())}i(rt,"_trim");function nt(){return re(e=>e.toLowerCase())}i(nt,"_toLowerCase");function it(){return re(e=>e.toUpperCase())}i(it,"_toUpperCase");function st(){return re(e=>dn(e))}i(st,"_slugify");function la(e,t,o){return new e({type:"array",element:t,...b(o)})}i(la,"_array");function Tf(e,t,o){return new e({type:"union",options:t,...b(o)})}i(Tf,"_union");function Of(e,t,o){return new e({type:"union",options:t,inclusive:!1,...b(o)})}i(Of,"_xor");function Cf(e,t,o,r){return new e({type:"union",options:o,discriminator:t,...b(r)})}i(Cf,"_discriminatedUnion");function jf(e,t,o){return new e({type:"intersection",left:t,right:o})}i(jf,"_intersection");function Nf(e,t,o,r){let n=o instanceof S,s=n?r:o,a=n?o:null;return new e({type:"tuple",items:t,rest:a,...b(s)})}i(Nf,"_tuple");function Lf(e,t,o,r){return new e({type:"record",keyType:t,valueType:o,...b(r)})}i(Lf,"_record");function Df(e,t,o,r){return new e({type:"map",keyType:t,valueType:o,...b(r)})}i(Df,"_map");function qf(e,t,o){return new e({type:"set",valueType:t,...b(o)})}i(qf,"_set");function Mf(e,t,o){let r=Array.isArray(t)?Object.fromEntries(t.map(n=>[n,n])):t;return new e({type:"enum",entries:r,...b(o)})}i(Mf,"_enum");function Ff(e,t,o){return new e({type:"enum",entries:t,...b(o)})}i(Ff,"_nativeEnum");function Uf(e,t,o){return new e({type:"literal",values:Array.isArray(t)?t:[t],...b(o)})}i(Uf,"_literal");function ua(e,t){return new e({type:"file",...b(t)})}i(ua,"_file");function Bf(e,t){return new e({type:"transform",transform:t})}i(Bf,"_transform");function Wf(e,t){return new e({type:"optional",innerType:t})}i(Wf,"_optional");function Jf(e,t){return new e({type:"nullable",innerType:t})}i(Jf,"_nullable");function Kf(e,t,o){return new e({type:"default",innerType:t,get defaultValue(){return typeof o=="function"?o():hn(o)}})}i(Kf,"_default");function Vf(e,t,o){return new e({type:"nonoptional",innerType:t,...b(o)})}i(Vf,"_nonoptional");function Hf(e,t){return new e({type:"success",innerType:t})}i(Hf,"_success");function Yf(e,t,o){return new e({type:"catch",innerType:t,catchValue:typeof o=="function"?o:()=>o})}i(Yf,"_catch");function Gf(e,t,o){return new e({type:"pipe",in:t,out:o})}i(Gf,"_pipe");function Xf(e,t){return new e({type:"readonly",innerType:t})}i(Xf,"_readonly");function Qf(e,t,o){return new e({type:"template_literal",parts:t,...b(o)})}i(Qf,"_templateLiteral");function ed(e,t){return new e({type:"lazy",getter:t})}i(ed,"_lazy");function td(e,t){return new e({type:"promise",innerType:t})}i(td,"_promise");function pa(e,t,o){let r=b(o);return r.abort??(r.abort=!0),new e({type:"custom",check:"custom",fn:t,...r})}i(pa,"_custom");function fa(e,t,o){return new e({type:"custom",check:"custom",fn:t,...b(o)})}i(fa,"_refine");function da(e,t){let o=a0(r=>(r.addIssue=n=>{if(typeof n=="string")r.issues.push(Ue(n,r.value,o._zod.def));else{let s=n;s.fatal&&(s.continue=!1),s.code??(s.code="custom"),s.input??(s.input=r.value),s.inst??(s.inst=o),s.continue??(s.continue=!o._zod.def.abort),r.issues.push(Ue(s))}},e(r.value,r)),t);return o}i(da,"_superRefine");function a0(e,t){let o=new C({check:"custom",...b(t)});return o._zod.check=e,o}i(a0,"_check");function ma(e){let t=new C({check:"describe"});return t._zod.onattach=[o=>{let r=M.get(o)??{};M.add(o,{...r,description:e})}],t._zod.check=()=>{},t}i(ma,"describe");function ha(e){let t=new C({check:"meta"});return t._zod.onattach=[o=>{let r=M.get(o)??{};M.add(o,{...r,...e})}],t._zod.check=()=>{},t}i(ha,"meta");function va(e,t){let o=b(t),r=o.truthy??["true","1","yes","on","y","enabled"],n=o.falsy??["false","0","no","off","n","disabled"];o.case!=="sensitive"&&(r=r.map(w=>typeof w=="string"?w.toLowerCase():w),n=n.map(w=>typeof w=="string"?w.toLowerCase():w));let s=new Set(r),a=new Set(n),c=e.Codec??Ct,l=e.Boolean??Tt,p=e.String??Ae,d=new p({type:"string",error:o.error}),h=new l({type:"boolean",error:o.error}),y=new c({type:"pipe",in:d,out:h,transform:i(((w,Z)=>{let Y=w;return o.case!=="sensitive"&&(Y=Y.toLowerCase()),s.has(Y)?!0:a.has(Y)?!1:(Z.issues.push({code:"invalid_value",expected:"stringbool",values:[...s,...a],input:Z.value,inst:y,continue:!1}),{})}),"transform"),reverseTransform:i(((w,Z)=>w===!0?r[0]||"true":n[0]||"false"),"reverseTransform"),error:o.error});return y}i(va,"_stringbool");function at(e,t,o,r={}){let n=b(r),s={...b(r),check:"string_format",type:"string",format:t,fn:typeof o=="function"?o:c=>o.test(c),...n};return o instanceof RegExp&&(s.pattern=o),new e(s)}i(at,"_stringFormat");function ze(e){let t=e?.target??"draft-2020-12";return t==="draft-4"&&(t="draft-04"),t==="draft-7"&&(t="draft-07"),{processors:e.processors??{},metadataRegistry:e?.metadata??M,target:t,unrepresentable:e?.unrepresentable??"throw",override:e?.override??(()=>{}),io:e?.io??"output",counter:0,seen:new Map,cycles:e?.cycles??"ref",reused:e?.reused??"inline",external:e?.external??void 0}}i(ze,"initializeContext");function A(e,t,o={path:[],schemaPath:[]}){var r;let n=e._zod.def,s=t.seen.get(e);if(s)return s.count++,o.schemaPath.includes(e)&&(s.cycle=o.path),s.schema;let a={schema:{},count:1,cycle:void 0,path:o.path};t.seen.set(e,a);let c=e._zod.toJSONSchema?.();if(c)a.schema=c;else{let d={...o,schemaPath:[...o.schemaPath,e],path:o.path};if(e._zod.processJSONSchema)e._zod.processJSONSchema(t,a.schema,d);else{let y=a.schema,w=t.processors[n.type];if(!w)throw new Error(`[toJSONSchema]: Non-representable type encountered: ${n.type}`);w(e,t,y,d)}let h=e._zod.parent;h&&(a.ref||(a.ref=h),A(h,t,d),t.seen.get(h).isParent=!0)}let l=t.metadataRegistry.get(e);return l&&Object.assign(a.schema,l),t.io==="input"&&J(e)&&(delete a.schema.examples,delete a.schema.default),t.io==="input"&&"_prefault"in a.schema&&((r=a.schema).default??(r.default=a.schema._prefault)),delete a.schema._prefault,t.seen.get(e).schema}i(A,"process");function $e(e,t){let o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");let r=new Map;for(let a of e.seen.entries()){let c=e.metadataRegistry.get(a[0])?.id;if(c){let l=r.get(c);if(l&&l!==a[0])throw new Error(`Duplicate schema id "${c}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);r.set(c,a[0])}}let n=i(a=>{let c=e.target==="draft-2020-12"?"$defs":"definitions";if(e.external){let h=e.external.registry.get(a[0])?.id,y=e.external.uri??(Z=>Z);if(h)return{ref:y(h)};let w=a[1].defId??a[1].schema.id??`schema${e.counter++}`;return a[1].defId=w,{defId:w,ref:`${y("__shared")}#/${c}/${w}`}}if(a[1]===o)return{ref:"#"};let p=`#/${c}/`,d=a[1].schema.id??`__schema${e.counter++}`;return{defId:d,ref:p+d}},"makeURI"),s=i(a=>{if(a[1].schema.$ref)return;let c=a[1],{ref:l,defId:p}=n(a);c.def={...c.schema},p&&(c.defId=p);let d=c.schema;for(let h in d)delete d[h];d.$ref=l},"extractToDef");if(e.cycles==="throw")for(let a of e.seen.entries()){let c=a[1];if(c.cycle)throw new Error(`Cycle detected: #/${c.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`)}for(let a of e.seen.entries()){let c=a[1];if(t===a[0]){s(a);continue}if(e.external){let p=e.external.registry.get(a[0])?.id;if(t!==a[0]&&p){s(a);continue}}if(e.metadataRegistry.get(a[0])?.id){s(a);continue}if(c.cycle){s(a);continue}if(c.count>1&&e.reused==="ref"){s(a);continue}}}i($e,"extractDefs");function Se(e,t){let o=e.seen.get(t);if(!o)throw new Error("Unprocessed schema. This is a bug in Zod.");let r=i(c=>{let l=e.seen.get(c);if(l.ref===null)return;let p=l.def??l.schema,d={...p},h=l.ref;if(l.ref=null,h){r(h);let w=e.seen.get(h),Z=w.schema;if(Z.$ref&&(e.target==="draft-07"||e.target==="draft-04"||e.target==="openapi-3.0")?(p.allOf=p.allOf??[],p.allOf.push(Z)):Object.assign(p,Z),Object.assign(p,d),c._zod.parent===h)for(let D in p)D==="$ref"||D==="allOf"||D in d||delete p[D];if(Z.$ref&&w.def)for(let D in p)D==="$ref"||D==="allOf"||D in w.def&&JSON.stringify(p[D])===JSON.stringify(w.def[D])&&delete p[D]}let y=c._zod.parent;if(y&&y!==h){r(y);let w=e.seen.get(y);if(w?.schema.$ref&&(p.$ref=w.schema.$ref,w.def))for(let Z in p)Z==="$ref"||Z==="allOf"||Z in w.def&&JSON.stringify(p[Z])===JSON.stringify(w.def[Z])&&delete p[Z]}e.override({zodSchema:c,jsonSchema:p,path:l.path??[]})},"flattenRef");for(let c of[...e.seen.entries()].reverse())r(c[0]);let n={};if(e.target==="draft-2020-12"?n.$schema="https://json-schema.org/draft/2020-12/schema":e.target==="draft-07"?n.$schema="http://json-schema.org/draft-07/schema#":e.target==="draft-04"?n.$schema="http://json-schema.org/draft-04/schema#":e.target,e.external?.uri){let c=e.external.registry.get(t)?.id;if(!c)throw new Error("Schema is missing an `id` property");n.$id=e.external.uri(c)}Object.assign(n,o.def??o.schema);let s=e.metadataRegistry.get(t)?.id;s!==void 0&&n.id===s&&delete n.id;let a=e.external?.defs??{};for(let c of e.seen.entries()){let l=c[1];l.def&&l.defId&&(l.def.id===l.defId&&delete l.def.id,a[l.defId]=l.def)}e.external||Object.keys(a).length>0&&(e.target==="draft-2020-12"?n.$defs=a:n.definitions=a);try{let c=JSON.parse(JSON.stringify(n));return Object.defineProperty(c,"~standard",{value:{...t["~standard"],jsonSchema:{input:ct(t,"input",e.processors),output:ct(t,"output",e.processors)}},enumerable:!1,writable:!1}),c}catch{throw new Error("Error converting schema to JSON.")}}i(Se,"finalize");function J(e,t){let o=t??{seen:new Set};if(o.seen.has(e))return!1;o.seen.add(e);let r=e._zod.def;if(r.type==="transform")return!0;if(r.type==="array")return J(r.element,o);if(r.type==="set")return J(r.valueType,o);if(r.type==="lazy")return J(r.getter(),o);if(r.type==="promise"||r.type==="optional"||r.type==="nonoptional"||r.type==="nullable"||r.type==="readonly"||r.type==="default"||r.type==="prefault")return J(r.innerType,o);if(r.type==="intersection")return J(r.left,o)||J(r.right,o);if(r.type==="record"||r.type==="map")return J(r.keyType,o)||J(r.valueType,o);if(r.type==="pipe")return e._zod.traits.has("$ZodCodec")?!0:J(r.in,o)||J(r.out,o);if(r.type==="object"){for(let n in r.shape)if(J(r.shape[n],o))return!0;return!1}if(r.type==="union"){for(let n of r.options)if(J(n,o))return!0;return!1}if(r.type==="tuple"){for(let n of r.items)if(J(n,o))return!0;return!!(r.rest&&J(r.rest,o))}return!1}i(J,"isTransforming");var ga=i((e,t={})=>o=>{let r=ze({...o,processors:t});return A(e,r),$e(r,e),Se(r,e)},"createToJSONSchemaMethod"),ct=i((e,t,o={})=>r=>{let{libraryOptions:n,target:s}=r??{},a=ze({...n??{},target:s,io:t,processors:o});return A(e,a),$e(a,e),Se(a,e)},"createStandardJSONSchemaMethod");var od={guid:"uuid",url:"uri",datetime:"date-time",json_string:"json-string",regex:""},xa=i((e,t,o,r)=>{let n=o;n.type="string";let{minimum:s,maximum:a,format:c,patterns:l,contentEncoding:p}=e._zod.bag;if(typeof s=="number"&&(n.minLength=s),typeof a=="number"&&(n.maxLength=a),c&&(n.format=od[c]??c,n.format===""&&delete n.format,c==="time"&&delete n.format),p&&(n.contentEncoding=p),l&&l.size>0){let d=[...l];d.length===1?n.pattern=d[0].source:d.length>1&&(n.allOf=[...d.map(h=>({...t.target==="draft-07"||t.target==="draft-04"||t.target==="openapi-3.0"?{type:"string"}:{},pattern:h.source}))])}},"stringProcessor"),ba=i((e,t,o,r)=>{let n=o,{minimum:s,maximum:a,format:c,multipleOf:l,exclusiveMaximum:p,exclusiveMinimum:d}=e._zod.bag;typeof c=="string"&&c.includes("int")?n.type="integer":n.type="number";let h=typeof d=="number"&&d>=(s??Number.NEGATIVE_INFINITY),y=typeof p=="number"&&p<=(a??Number.POSITIVE_INFINITY),w=t.target==="draft-04"||t.target==="openapi-3.0";h?w?(n.minimum=d,n.exclusiveMinimum=!0):n.exclusiveMinimum=d:typeof s=="number"&&(n.minimum=s),y?w?(n.maximum=p,n.exclusiveMaximum=!0):n.exclusiveMaximum=p:typeof a=="number"&&(n.maximum=a),typeof l=="number"&&(n.multipleOf=l)},"numberProcessor"),ya=i((e,t,o,r)=>{o.type="boolean"},"booleanProcessor"),wa=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("BigInt cannot be represented in JSON Schema")},"bigintProcessor"),_a=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Symbols cannot be represented in JSON Schema")},"symbolProcessor"),ka=i((e,t,o,r)=>{t.target==="openapi-3.0"?(o.type="string",o.nullable=!0,o.enum=[null]):o.type="null"},"nullProcessor"),za=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Undefined cannot be represented in JSON Schema")},"undefinedProcessor"),$a=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Void cannot be represented in JSON Schema")},"voidProcessor"),Sa=i((e,t,o,r)=>{o.not={}},"neverProcessor"),Pa=i((e,t,o,r)=>{},"anyProcessor"),Za=i((e,t,o,r)=>{},"unknownProcessor"),Ia=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Date cannot be represented in JSON Schema")},"dateProcessor"),Ra=i((e,t,o,r)=>{let n=e._zod.def,s=_t(n.entries);s.every(a=>typeof a=="number")&&(o.type="number"),s.every(a=>typeof a=="string")&&(o.type="string"),o.enum=s},"enumProcessor"),Ea=i((e,t,o,r)=>{let n=e._zod.def,s=[];for(let a of n.values)if(a===void 0){if(t.unrepresentable==="throw")throw new Error("Literal `undefined` cannot be represented in JSON Schema")}else if(typeof a=="bigint"){if(t.unrepresentable==="throw")throw new Error("BigInt literals cannot be represented in JSON Schema");s.push(Number(a))}else s.push(a);if(s.length!==0)if(s.length===1){let a=s[0];o.type=a===null?"null":typeof a,t.target==="draft-04"||t.target==="openapi-3.0"?o.enum=[a]:o.const=a}else s.every(a=>typeof a=="number")&&(o.type="number"),s.every(a=>typeof a=="string")&&(o.type="string"),s.every(a=>typeof a=="boolean")&&(o.type="boolean"),s.every(a=>a===null)&&(o.type="null"),o.enum=s},"literalProcessor"),Aa=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("NaN cannot be represented in JSON Schema")},"nanProcessor"),Ta=i((e,t,o,r)=>{let n=o,s=e._zod.pattern;if(!s)throw new Error("Pattern not found in template literal");n.type="string",n.pattern=s.source},"templateLiteralProcessor"),Oa=i((e,t,o,r)=>{let n=o,s={type:"string",format:"binary",contentEncoding:"binary"},{minimum:a,maximum:c,mime:l}=e._zod.bag;a!==void 0&&(s.minLength=a),c!==void 0&&(s.maxLength=c),l?l.length===1?(s.contentMediaType=l[0],Object.assign(n,s)):(Object.assign(n,s),n.anyOf=l.map(p=>({contentMediaType:p}))):Object.assign(n,s)},"fileProcessor"),Ca=i((e,t,o,r)=>{o.type="boolean"},"successProcessor"),ja=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Custom types cannot be represented in JSON Schema")},"customProcessor"),Na=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Function types cannot be represented in JSON Schema")},"functionProcessor"),La=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Transforms cannot be represented in JSON Schema")},"transformProcessor"),Da=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Map cannot be represented in JSON Schema")},"mapProcessor"),qa=i((e,t,o,r)=>{if(t.unrepresentable==="throw")throw new Error("Set cannot be represented in JSON Schema")},"setProcessor"),Ma=i((e,t,o,r)=>{let n=o,s=e._zod.def,{minimum:a,maximum:c}=e._zod.bag;typeof a=="number"&&(n.minItems=a),typeof c=="number"&&(n.maxItems=c),n.type="array",n.items=A(s.element,t,{...r,path:[...r.path,"items"]})},"arrayProcessor"),Fa=i((e,t,o,r)=>{let n=o,s=e._zod.def;n.type="object",n.properties={};let a=s.shape;for(let p in a)n.properties[p]=A(a[p],t,{...r,path:[...r.path,"properties",p]});let c=new Set(Object.keys(a)),l=new Set([...c].filter(p=>{let d=s.shape[p]._zod;return t.io==="input"?d.optin===void 0:d.optout===void 0}));l.size>0&&(n.required=Array.from(l)),s.catchall?._zod.def.type==="never"?n.additionalProperties=!1:s.catchall?s.catchall&&(n.additionalProperties=A(s.catchall,t,{...r,path:[...r.path,"additionalProperties"]})):t.io==="output"&&(n.additionalProperties=!1)},"objectProcessor"),ur=i((e,t,o,r)=>{let n=e._zod.def,s=n.inclusive===!1,a=n.options.map((c,l)=>A(c,t,{...r,path:[...r.path,s?"oneOf":"anyOf",l]}));s?o.oneOf=a:o.anyOf=a},"unionProcessor"),Ua=i((e,t,o,r)=>{let n=e._zod.def,s=A(n.left,t,{...r,path:[...r.path,"allOf",0]}),a=A(n.right,t,{...r,path:[...r.path,"allOf",1]}),c=i(p=>"allOf"in p&&Object.keys(p).length===1,"isSimpleIntersection"),l=[...c(s)?s.allOf:[s],...c(a)?a.allOf:[a]];o.allOf=l},"intersectionProcessor"),Ba=i((e,t,o,r)=>{let n=o,s=e._zod.def;n.type="array";let a=t.target==="draft-2020-12"?"prefixItems":"items",c=t.target==="draft-2020-12"||t.target==="openapi-3.0"?"items":"additionalItems",l=s.items.map((y,w)=>A(y,t,{...r,path:[...r.path,a,w]})),p=s.rest?A(s.rest,t,{...r,path:[...r.path,c,...t.target==="openapi-3.0"?[s.items.length]:[]]}):null;t.target==="draft-2020-12"?(n.prefixItems=l,p&&(n.items=p)):t.target==="openapi-3.0"?(n.items={anyOf:l},p&&n.items.anyOf.push(p),n.minItems=l.length,p||(n.maxItems=l.length)):(n.items=l,p&&(n.additionalItems=p));let{minimum:d,maximum:h}=e._zod.bag;typeof d=="number"&&(n.minItems=d),typeof h=="number"&&(n.maxItems=h)},"tupleProcessor"),Wa=i((e,t,o,r)=>{let n=o,s=e._zod.def;n.type="object";let a=s.keyType,l=a._zod.bag?.patterns;if(s.mode==="loose"&&l&&l.size>0){let d=A(s.valueType,t,{...r,path:[...r.path,"patternProperties","*"]});n.patternProperties={};for(let h of l)n.patternProperties[h.source]=d}else(t.target==="draft-07"||t.target==="draft-2020-12")&&(n.propertyNames=A(s.keyType,t,{...r,path:[...r.path,"propertyNames"]})),n.additionalProperties=A(s.valueType,t,{...r,path:[...r.path,"additionalProperties"]});let p=a._zod.values;if(p){let d=[...p].filter(h=>typeof h=="string"||typeof h=="number");d.length>0&&(n.required=d)}},"recordProcessor"),Ja=i((e,t,o,r)=>{let n=e._zod.def,s=A(n.innerType,t,r),a=t.seen.get(e);t.target==="openapi-3.0"?(a.ref=n.innerType,o.nullable=!0):o.anyOf=[s,{type:"null"}]},"nullableProcessor"),Ka=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType},"nonoptionalProcessor"),Va=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType,o.default=JSON.parse(JSON.stringify(n.defaultValue))},"defaultProcessor"),Ha=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType,t.io==="input"&&(o._prefault=JSON.parse(JSON.stringify(n.defaultValue)))},"prefaultProcessor"),Ya=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType;let a;try{a=n.catchValue(void 0)}catch{throw new Error("Dynamic catch values are not supported in JSON Schema")}o.default=a},"catchProcessor"),Ga=i((e,t,o,r)=>{let n=e._zod.def,s=n.in._zod.traits.has("$ZodTransform"),a=t.io==="input"?s?n.out:n.in:n.out;A(a,t,r);let c=t.seen.get(e);c.ref=a},"pipeProcessor"),Xa=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType,o.readOnly=!0},"readonlyProcessor"),Qa=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType},"promiseProcessor"),pr=i((e,t,o,r)=>{let n=e._zod.def;A(n.innerType,t,r);let s=t.seen.get(e);s.ref=n.innerType},"optionalProcessor"),ec=i((e,t,o,r)=>{let n=e._zod.innerType;A(n,t,r);let s=t.seen.get(e);s.ref=n},"lazyProcessor"),lr={string:xa,number:ba,boolean:ya,bigint:wa,symbol:_a,null:ka,undefined:za,void:$a,never:Sa,any:Pa,unknown:Za,date:Ia,enum:Ra,literal:Ea,nan:Aa,template_literal:Ta,file:Oa,success:Ca,custom:ja,function:Na,transform:La,map:Da,set:qa,array:Ma,object:Fa,union:ur,intersection:Ua,tuple:Ba,record:Wa,nullable:Ja,nonoptional:Ka,default:Va,prefault:Ha,catch:Ya,pipe:Ga,readonly:Xa,promise:Qa,optional:pr,lazy:ec};function fr(e,t){if("_idmap"in e){let r=e,n=ze({...t,processors:lr}),s={};for(let l of r._idmap.entries()){let[p,d]=l;A(d,n)}let a={},c={registry:r,uri:t?.uri,defs:s};n.external=c;for(let l of r._idmap.entries()){let[p,d]=l;$e(n,d),a[p]=Se(n,d)}if(Object.keys(s).length>0){let l=n.target==="draft-2020-12"?"$defs":"definitions";a.__shared={[l]:s}}return{schemas:a}}let o=ze({...t,processors:lr});return A(e,o),$e(o,e),Se(o,e)}i(fr,"toJSONSchema");var dr=class{static{i(this,"JSONSchemaGenerator")}get metadataRegistry(){return this.ctx.metadataRegistry}get target(){return this.ctx.target}get unrepresentable(){return this.ctx.unrepresentable}get override(){return this.ctx.override}get io(){return this.ctx.io}get counter(){return this.ctx.counter}set counter(t){this.ctx.counter=t}get seen(){return this.ctx.seen}constructor(t){let o=t?.target??"draft-2020-12";o==="draft-4"&&(o="draft-04"),o==="draft-7"&&(o="draft-07"),this.ctx=ze({processors:lr,target:o,...t?.metadata&&{metadata:t.metadata},...t?.unrepresentable&&{unrepresentable:t.unrepresentable},...t?.override&&{override:t.override},...t?.io&&{io:t.io}})}process(t,o={path:[],schemaPath:[]}){return A(t,this.ctx,o)}emit(t,o){o&&(o.cycles&&(this.ctx.cycles=o.cycles),o.reused&&(this.ctx.reused=o.reused),o.external&&(this.ctx.external=o.external)),$e(this.ctx,t);let r=Se(this.ctx,t),{"~standard":n,...s}=r;return s}};var c0={};var qt={};pe(qt,{ZodAny:()=>zc,ZodArray:()=>Zc,ZodBase64:()=>Or,ZodBase64URL:()=>Cr,ZodBigInt:()=>vt,ZodBigIntFormat:()=>Lr,ZodBoolean:()=>ht,ZodCIDRv4:()=>Ar,ZodCIDRv6:()=>Tr,ZodCUID:()=>$r,ZodCUID2:()=>Sr,ZodCatch:()=>Yc,ZodCodec:()=>Xt,ZodCustom:()=>Qt,ZodCustomStringFormat:()=>dt,ZodDate:()=>Kt,ZodDefault:()=>Bc,ZodDiscriminatedUnion:()=>Rc,ZodE164:()=>jr,ZodEmail:()=>_r,ZodEmoji:()=>kr,ZodEnum:()=>pt,ZodExactOptional:()=>Mc,ZodFile:()=>Dc,ZodFunction:()=>sl,ZodGUID:()=>Ft,ZodIPv4:()=>Rr,ZodIPv6:()=>Er,ZodIntersection:()=>Ec,ZodJWT:()=>Nr,ZodKSUID:()=>Ir,ZodLazy:()=>rl,ZodLiteral:()=>Lc,ZodMAC:()=>gc,ZodMap:()=>jc,ZodNaN:()=>Xc,ZodNanoID:()=>zr,ZodNever:()=>Sc,ZodNonOptional:()=>Br,ZodNull:()=>_c,ZodNullable:()=>Uc,ZodNumber:()=>mt,ZodNumberFormat:()=>Ne,ZodObject:()=>Ht,ZodOptional:()=>Ur,ZodPipe:()=>Gt,ZodPrefault:()=>Jc,ZodPreprocess:()=>Qc,ZodPromise:()=>il,ZodReadonly:()=>el,ZodRecord:()=>ut,ZodSet:()=>Nc,ZodString:()=>ft,ZodStringFormat:()=>O,ZodSuccess:()=>Hc,ZodSymbol:()=>yc,ZodTemplateLiteral:()=>ol,ZodTransform:()=>qc,ZodTuple:()=>Tc,ZodType:()=>P,ZodULID:()=>Pr,ZodURL:()=>Jt,ZodUUID:()=>ae,ZodUndefined:()=>wc,ZodUnion:()=>Yt,ZodUnknown:()=>$c,ZodVoid:()=>Pc,ZodXID:()=>Zr,ZodXor:()=>Ic,_ZodString:()=>wr,_default:()=>Wc,_function:()=>gu,any:()=>V0,array:()=>Vt,base64:()=>E0,base64url:()=>A0,bigint:()=>U0,boolean:()=>bc,catch:()=>Gc,check:()=>xu,cidrv4:()=>I0,cidrv6:()=>R0,codec:()=>du,cuid:()=>w0,cuid2:()=>_0,custom:()=>bu,date:()=>Y0,describe:()=>yu,discriminatedUnion:()=>ou,e164:()=>T0,email:()=>p0,emoji:()=>b0,enum:()=>Mr,exactOptional:()=>Fc,file:()=>lu,float32:()=>D0,float64:()=>q0,function:()=>gu,guid:()=>f0,hash:()=>L0,hex:()=>N0,hostname:()=>j0,httpUrl:()=>x0,instanceof:()=>_u,int:()=>br,int32:()=>M0,int64:()=>B0,intersection:()=>Ac,invertCodec:()=>mu,ipv4:()=>S0,ipv6:()=>Z0,json:()=>zu,jwt:()=>O0,keyof:()=>G0,ksuid:()=>$0,lazy:()=>nl,literal:()=>cu,looseObject:()=>eu,looseRecord:()=>nu,mac:()=>P0,map:()=>iu,meta:()=>wu,nan:()=>fu,nanoid:()=>y0,nativeEnum:()=>au,never:()=>Dr,nonoptional:()=>Vc,null:()=>kc,nullable:()=>Bt,nullish:()=>uu,number:()=>xc,object:()=>X0,optional:()=>Ut,partialRecord:()=>ru,pipe:()=>yr,prefault:()=>Kc,preprocess:()=>$u,promise:()=>vu,readonly:()=>tl,record:()=>Cc,refine:()=>al,set:()=>su,strictObject:()=>Q0,string:()=>Mt,stringFormat:()=>C0,stringbool:()=>ku,success:()=>pu,superRefine:()=>cl,symbol:()=>J0,templateLiteral:()=>hu,transform:()=>Fr,tuple:()=>Oc,uint32:()=>F0,uint64:()=>W0,ulid:()=>k0,undefined:()=>K0,union:()=>qr,unknown:()=>je,url:()=>g0,uuid:()=>d0,uuidv4:()=>m0,uuidv6:()=>h0,uuidv7:()=>v0,void:()=>H0,xid:()=>z0,xor:()=>tu});var mr={};pe(mr,{endsWith:()=>et,gt:()=>ie,gte:()=>W,includes:()=>Xe,length:()=>Ce,lowercase:()=>Ye,lt:()=>ne,lte:()=>Q,maxLength:()=>Oe,maxSize:()=>ke,mime:()=>tt,minLength:()=>de,minSize:()=>se,multipleOf:()=>_e,negative:()=>ir,nonnegative:()=>ar,nonpositive:()=>sr,normalize:()=>ot,overwrite:()=>re,positive:()=>nr,property:()=>cr,regex:()=>He,size:()=>Te,slugify:()=>st,startsWith:()=>Qe,toLowerCase:()=>nt,toUpperCase:()=>it,trim:()=>rt,uppercase:()=>Ge});var lt={};pe(lt,{ZodISODate:()=>vr,ZodISODateTime:()=>hr,ZodISODuration:()=>xr,ZodISOTime:()=>gr,date:()=>oc,datetime:()=>tc,duration:()=>nc,time:()=>rc});var hr=f("ZodISODateTime",(e,t)=>{Ai.init(e,t),O.init(e,t)});function tc(e){return js(hr,e)}i(tc,"datetime");var vr=f("ZodISODate",(e,t)=>{Ti.init(e,t),O.init(e,t)});function oc(e){return Ns(vr,e)}i(oc,"date");var gr=f("ZodISOTime",(e,t)=>{Oi.init(e,t),O.init(e,t)});function rc(e){return Ls(gr,e)}i(rc,"time");var xr=f("ZodISODuration",(e,t)=>{Ci.init(e,t),O.init(e,t)});function nc(e){return Ds(xr,e)}i(nc,"duration");var l0=i((e,t)=>{Pt.init(e,t),e.name="ZodError",Object.defineProperties(e,{format:{value:i(o=>It(e,o),"value")},flatten:{value:i(o=>Zt(e,o),"value")},addIssue:{value:i(o=>{e.issues.push(o),e.message=JSON.stringify(e.issues,Me,2)},"value")},addIssues:{value:i(o=>{e.issues.push(...o),e.message=JSON.stringify(e.issues,Me,2)},"value")},isEmpty:{get(){return e.issues.length===0}}})},"initializer"),nd=f("ZodError",l0),H=f("ZodError",l0,{Parent:Error});var ic=Be(H),sc=We(H),ac=Je(H),cc=Ke(H),lc=ho(H),uc=vo(H),pc=go(H),fc=xo(H),dc=bo(H),mc=yo(H),hc=wo(H),vc=_o(H);var u0=new WeakMap;function Wt(e,t,o){let r=Object.getPrototypeOf(e),n=u0.get(r);if(n||(n=new Set,u0.set(r,n)),!n.has(t)){n.add(t);for(let s in o){let a=o[s];Object.defineProperty(r,s,{configurable:!0,enumerable:!1,get(){let c=a.bind(this);return Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:c}),c},set(c){Object.defineProperty(this,s,{configurable:!0,writable:!0,enumerable:!0,value:c})}})}}}i(Wt,"_installLazyMethods");var P=f("ZodType",(e,t)=>(S.init(e,t),Object.assign(e["~standard"],{jsonSchema:{input:ct(e,"input"),output:ct(e,"output")}}),e.toJSONSchema=ga(e,{}),e.def=t,e.type=t.type,Object.defineProperty(e,"_def",{value:t}),e.parse=(o,r)=>ic(e,o,r,{callee:e.parse}),e.safeParse=(o,r)=>ac(e,o,r),e.parseAsync=async(o,r)=>sc(e,o,r,{callee:e.parseAsync}),e.safeParseAsync=async(o,r)=>cc(e,o,r),e.spa=e.safeParseAsync,e.encode=(o,r)=>lc(e,o,r),e.decode=(o,r)=>uc(e,o,r),e.encodeAsync=async(o,r)=>pc(e,o,r),e.decodeAsync=async(o,r)=>fc(e,o,r),e.safeEncode=(o,r)=>dc(e,o,r),e.safeDecode=(o,r)=>mc(e,o,r),e.safeEncodeAsync=async(o,r)=>hc(e,o,r),e.safeDecodeAsync=async(o,r)=>vc(e,o,r),Wt(e,"ZodType",{check(...o){let r=this.def;return this.clone($.mergeDefs(r,{checks:[...r.checks??[],...o.map(n=>typeof n=="function"?{_zod:{check:n,def:{check:"custom"},onattach:[]}}:n)]}),{parent:!0})},with(...o){return this.check(...o)},clone(o,r){return U(this,o,r)},brand(){return this},register(o,r){return o.add(this,r),this},refine(o,r){return this.check(al(o,r))},superRefine(o,r){return this.check(cl(o,r))},overwrite(o){return this.check(re(o))},optional(){return Ut(this)},exactOptional(){return Fc(this)},nullable(){return Bt(this)},nullish(){return Ut(Bt(this))},nonoptional(o){return Vc(this,o)},array(){return Vt(this)},or(o){return qr([this,o])},and(o){return Ac(this,o)},transform(o){return yr(this,Fr(o))},default(o){return Wc(this,o)},prefault(o){return Kc(this,o)},catch(o){return Gc(this,o)},pipe(o){return yr(this,o)},readonly(){return tl(this)},describe(o){let r=this.clone();return M.add(r,{description:o}),r},meta(...o){if(o.length===0)return M.get(this);let r=this.clone();return M.add(r,o[0]),r},isOptional(){return this.safeParse(void 0).success},isNullable(){return this.safeParse(null).success},apply(o){return o(this)}}),Object.defineProperty(e,"description",{get(){return M.get(e)?.description},configurable:!0}),e)),wr=f("_ZodString",(e,t)=>{Ae.init(e,t),P.init(e,t),e._zod.processJSONSchema=(r,n,s)=>xa(e,r,n,s);let o=e._zod.bag;e.format=o.format??null,e.minLength=o.minimum??null,e.maxLength=o.maximum??null,Wt(e,"_ZodString",{regex(...r){return this.check(He(...r))},includes(...r){return this.check(Xe(...r))},startsWith(...r){return this.check(Qe(...r))},endsWith(...r){return this.check(et(...r))},min(...r){return this.check(de(...r))},max(...r){return this.check(Oe(...r))},length(...r){return this.check(Ce(...r))},nonempty(...r){return this.check(de(1,...r))},lowercase(r){return this.check(Ye(r))},uppercase(r){return this.check(Ge(r))},trim(){return this.check(rt())},normalize(...r){return this.check(ot(...r))},toLowerCase(){return this.check(nt())},toUpperCase(){return this.check(it())},slugify(){return this.check(st())}})}),ft=f("ZodString",(e,t)=>{Ae.init(e,t),wr.init(e,t),e.email=o=>e.check(Lo(_r,o)),e.url=o=>e.check(Dt(Jt,o)),e.jwt=o=>e.check(rr(Nr,o)),e.emoji=o=>e.check(Uo(kr,o)),e.guid=o=>e.check(Lt(Ft,o)),e.uuid=o=>e.check(Do(ae,o)),e.uuidv4=o=>e.check(qo(ae,o)),e.uuidv6=o=>e.check(Mo(ae,o)),e.uuidv7=o=>e.check(Fo(ae,o)),e.nanoid=o=>e.check(Bo(zr,o)),e.guid=o=>e.check(Lt(Ft,o)),e.cuid=o=>e.check(Wo($r,o)),e.cuid2=o=>e.check(Jo(Sr,o)),e.ulid=o=>e.check(Ko(Pr,o)),e.base64=o=>e.check(er(Or,o)),e.base64url=o=>e.check(tr(Cr,o)),e.xid=o=>e.check(Vo(Zr,o)),e.ksuid=o=>e.check(Ho(Ir,o)),e.ipv4=o=>e.check(Yo(Rr,o)),e.ipv6=o=>e.check(Go(Er,o)),e.cidrv4=o=>e.check(Xo(Ar,o)),e.cidrv6=o=>e.check(Qo(Tr,o)),e.e164=o=>e.check(or(jr,o)),e.datetime=o=>e.check(tc(o)),e.date=o=>e.check(oc(o)),e.time=o=>e.check(rc(o)),e.duration=o=>e.check(nc(o))});function Mt(e){return As(ft,e)}i(Mt,"string");var O=f("ZodStringFormat",(e,t)=>{T.init(e,t),wr.init(e,t)}),_r=f("ZodEmail",(e,t)=>{ki.init(e,t),O.init(e,t)});function p0(e){return Lo(_r,e)}i(p0,"email");var Ft=f("ZodGUID",(e,t)=>{wi.init(e,t),O.init(e,t)});function f0(e){return Lt(Ft,e)}i(f0,"guid");var ae=f("ZodUUID",(e,t)=>{_i.init(e,t),O.init(e,t)});function d0(e){return Do(ae,e)}i(d0,"uuid");function m0(e){return qo(ae,e)}i(m0,"uuidv4");function h0(e){return Mo(ae,e)}i(h0,"uuidv6");function v0(e){return Fo(ae,e)}i(v0,"uuidv7");var Jt=f("ZodURL",(e,t)=>{zi.init(e,t),O.init(e,t)});function g0(e){return Dt(Jt,e)}i(g0,"url");function x0(e){return Dt(Jt,{protocol:X.httpProtocol,hostname:X.domain,...$.normalizeParams(e)})}i(x0,"httpUrl");var kr=f("ZodEmoji",(e,t)=>{$i.init(e,t),O.init(e,t)});function b0(e){return Uo(kr,e)}i(b0,"emoji");var zr=f("ZodNanoID",(e,t)=>{Si.init(e,t),O.init(e,t)});function y0(e){return Bo(zr,e)}i(y0,"nanoid");var $r=f("ZodCUID",(e,t)=>{Pi.init(e,t),O.init(e,t)});function w0(e){return Wo($r,e)}i(w0,"cuid");var Sr=f("ZodCUID2",(e,t)=>{Zi.init(e,t),O.init(e,t)});function _0(e){return Jo(Sr,e)}i(_0,"cuid2");var Pr=f("ZodULID",(e,t)=>{Ii.init(e,t),O.init(e,t)});function k0(e){return Ko(Pr,e)}i(k0,"ulid");var Zr=f("ZodXID",(e,t)=>{Ri.init(e,t),O.init(e,t)});function z0(e){return Vo(Zr,e)}i(z0,"xid");var Ir=f("ZodKSUID",(e,t)=>{Ei.init(e,t),O.init(e,t)});function $0(e){return Ho(Ir,e)}i($0,"ksuid");var Rr=f("ZodIPv4",(e,t)=>{ji.init(e,t),O.init(e,t)});function S0(e){return Yo(Rr,e)}i(S0,"ipv4");var gc=f("ZodMAC",(e,t)=>{Li.init(e,t),O.init(e,t)});function P0(e){return Os(gc,e)}i(P0,"mac");var Er=f("ZodIPv6",(e,t)=>{Ni.init(e,t),O.init(e,t)});function Z0(e){return Go(Er,e)}i(Z0,"ipv6");var Ar=f("ZodCIDRv4",(e,t)=>{Di.init(e,t),O.init(e,t)});function I0(e){return Xo(Ar,e)}i(I0,"cidrv4");var Tr=f("ZodCIDRv6",(e,t)=>{qi.init(e,t),O.init(e,t)});function R0(e){return Qo(Tr,e)}i(R0,"cidrv6");var Or=f("ZodBase64",(e,t)=>{Fi.init(e,t),O.init(e,t)});function E0(e){return er(Or,e)}i(E0,"base64");var Cr=f("ZodBase64URL",(e,t)=>{Ui.init(e,t),O.init(e,t)});function A0(e){return tr(Cr,e)}i(A0,"base64url");var jr=f("ZodE164",(e,t)=>{Bi.init(e,t),O.init(e,t)});function T0(e){return or(jr,e)}i(T0,"e164");var Nr=f("ZodJWT",(e,t)=>{Wi.init(e,t),O.init(e,t)});function O0(e){return rr(Nr,e)}i(O0,"jwt");var dt=f("ZodCustomStringFormat",(e,t)=>{Ji.init(e,t),O.init(e,t)});function C0(e,t,o={}){return at(dt,e,t,o)}i(C0,"stringFormat");function j0(e){return at(dt,"hostname",X.hostname,e)}i(j0,"hostname");function N0(e){return at(dt,"hex",X.hex,e)}i(N0,"hex");function L0(e,t){let o=t?.enc??"hex",r=`${e}_${o}`,n=X[r];if(!n)throw new Error(`Unrecognized hash format: ${r}`);return at(dt,r,n,t)}i(L0,"hash");var mt=f("ZodNumber",(e,t)=>{Eo.init(e,t),P.init(e,t),e._zod.processJSONSchema=(r,n,s)=>ba(e,r,n,s),Wt(e,"ZodNumber",{gt(r,n){return this.check(ie(r,n))},gte(r,n){return this.check(W(r,n))},min(r,n){return this.check(W(r,n))},lt(r,n){return this.check(ne(r,n))},lte(r,n){return this.check(Q(r,n))},max(r,n){return this.check(Q(r,n))},int(r){return this.check(br(r))},safe(r){return this.check(br(r))},positive(r){return this.check(ie(0,r))},nonnegative(r){return this.check(W(0,r))},negative(r){return this.check(ne(0,r))},nonpositive(r){return this.check(Q(0,r))},multipleOf(r,n){return this.check(_e(r,n))},step(r,n){return this.check(_e(r,n))},finite(){return this}});let o=e._zod.bag;e.minValue=Math.max(o.minimum??Number.NEGATIVE_INFINITY,o.exclusiveMinimum??Number.NEGATIVE_INFINITY)??null,e.maxValue=Math.min(o.maximum??Number.POSITIVE_INFINITY,o.exclusiveMaximum??Number.POSITIVE_INFINITY)??null,e.isInt=(o.format??"").includes("int")||Number.isSafeInteger(o.multipleOf??.5),e.isFinite=!0,e.format=o.format??null});function xc(e){return qs(mt,e)}i(xc,"number");var Ne=f("ZodNumberFormat",(e,t)=>{Ki.init(e,t),mt.init(e,t)});function br(e){return Fs(Ne,e)}i(br,"int");function D0(e){return Us(Ne,e)}i(D0,"float32");function q0(e){return Bs(Ne,e)}i(q0,"float64");function M0(e){return Ws(Ne,e)}i(M0,"int32");function F0(e){return Js(Ne,e)}i(F0,"uint32");var ht=f("ZodBoolean",(e,t)=>{Tt.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ya(e,o,r,n)});function bc(e){return Ks(ht,e)}i(bc,"boolean");var vt=f("ZodBigInt",(e,t)=>{Ao.init(e,t),P.init(e,t),e._zod.processJSONSchema=(r,n,s)=>wa(e,r,n,s),e.gte=(r,n)=>e.check(W(r,n)),e.min=(r,n)=>e.check(W(r,n)),e.gt=(r,n)=>e.check(ie(r,n)),e.gte=(r,n)=>e.check(W(r,n)),e.min=(r,n)=>e.check(W(r,n)),e.lt=(r,n)=>e.check(ne(r,n)),e.lte=(r,n)=>e.check(Q(r,n)),e.max=(r,n)=>e.check(Q(r,n)),e.positive=r=>e.check(ie(BigInt(0),r)),e.negative=r=>e.check(ne(BigInt(0),r)),e.nonpositive=r=>e.check(Q(BigInt(0),r)),e.nonnegative=r=>e.check(W(BigInt(0),r)),e.multipleOf=(r,n)=>e.check(_e(r,n));let o=e._zod.bag;e.minValue=o.minimum??null,e.maxValue=o.maximum??null,e.format=o.format??null});function U0(e){return Hs(vt,e)}i(U0,"bigint");var Lr=f("ZodBigIntFormat",(e,t)=>{Vi.init(e,t),vt.init(e,t)});function B0(e){return Gs(Lr,e)}i(B0,"int64");function W0(e){return Xs(Lr,e)}i(W0,"uint64");var yc=f("ZodSymbol",(e,t)=>{Hi.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>_a(e,o,r,n)});function J0(e){return Qs(yc,e)}i(J0,"symbol");var wc=f("ZodUndefined",(e,t)=>{Yi.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>za(e,o,r,n)});function K0(e){return ea(wc,e)}i(K0,"_undefined");var _c=f("ZodNull",(e,t)=>{Gi.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ka(e,o,r,n)});function kc(e){return ta(_c,e)}i(kc,"_null");var zc=f("ZodAny",(e,t)=>{Xi.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Pa(e,o,r,n)});function V0(){return oa(zc)}i(V0,"any");var $c=f("ZodUnknown",(e,t)=>{Qi.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Za(e,o,r,n)});function je(){return ra($c)}i(je,"unknown");var Sc=f("ZodNever",(e,t)=>{es.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Sa(e,o,r,n)});function Dr(e){return na(Sc,e)}i(Dr,"never");var Pc=f("ZodVoid",(e,t)=>{ts.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>$a(e,o,r,n)});function H0(e){return ia(Pc,e)}i(H0,"_void");var Kt=f("ZodDate",(e,t)=>{os.init(e,t),P.init(e,t),e._zod.processJSONSchema=(r,n,s)=>Ia(e,r,n,s),e.min=(r,n)=>e.check(W(r,n)),e.max=(r,n)=>e.check(Q(r,n));let o=e._zod.bag;e.minDate=o.minimum?new Date(o.minimum):null,e.maxDate=o.maximum?new Date(o.maximum):null});function Y0(e){return sa(Kt,e)}i(Y0,"date");var Zc=f("ZodArray",(e,t)=>{rs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ma(e,o,r,n),e.element=t.element,Wt(e,"ZodArray",{min(o,r){return this.check(de(o,r))},nonempty(o){return this.check(de(1,o))},max(o,r){return this.check(Oe(o,r))},length(o,r){return this.check(Ce(o,r))},unwrap(){return this.element}})});function Vt(e,t){return la(Zc,e,t)}i(Vt,"array");function G0(e){let t=e._zod.def.shape;return Mr(Object.keys(t))}i(G0,"keyof");var Ht=f("ZodObject",(e,t)=>{ns.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Fa(e,o,r,n),$.defineLazy(e,"shape",()=>t.shape),Wt(e,"ZodObject",{keyof(){return Mr(Object.keys(this._zod.def.shape))},catchall(o){return this.clone({...this._zod.def,catchall:o})},passthrough(){return this.clone({...this._zod.def,catchall:je()})},loose(){return this.clone({...this._zod.def,catchall:je()})},strict(){return this.clone({...this._zod.def,catchall:Dr()})},strip(){return this.clone({...this._zod.def,catchall:void 0})},extend(o){return $.extend(this,o)},safeExtend(o){return $.safeExtend(this,o)},merge(o){return $.merge(this,o)},pick(o){return $.pick(this,o)},omit(o){return $.omit(this,o)},partial(...o){return $.partial(Ur,this,o[0])},required(...o){return $.required(Br,this,o[0])}})});function X0(e,t){let o={type:"object",shape:e??{},...$.normalizeParams(t)};return new Ht(o)}i(X0,"object");function Q0(e,t){return new Ht({type:"object",shape:e,catchall:Dr(),...$.normalizeParams(t)})}i(Q0,"strictObject");function eu(e,t){return new Ht({type:"object",shape:e,catchall:je(),...$.normalizeParams(t)})}i(eu,"looseObject");var Yt=f("ZodUnion",(e,t)=>{Ot.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ur(e,o,r,n),e.options=t.options});function qr(e,t){return new Yt({type:"union",options:e,...$.normalizeParams(t)})}i(qr,"union");var Ic=f("ZodXor",(e,t)=>{Yt.init(e,t),is.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ur(e,o,r,n),e.options=t.options});function tu(e,t){return new Ic({type:"union",options:e,inclusive:!1,...$.normalizeParams(t)})}i(tu,"xor");var Rc=f("ZodDiscriminatedUnion",(e,t)=>{Yt.init(e,t),ss.init(e,t)});function ou(e,t,o){return new Rc({type:"union",options:t,discriminator:e,...$.normalizeParams(o)})}i(ou,"discriminatedUnion");var Ec=f("ZodIntersection",(e,t)=>{as.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ua(e,o,r,n)});function Ac(e,t){return new Ec({type:"intersection",left:e,right:t})}i(Ac,"intersection");var Tc=f("ZodTuple",(e,t)=>{To.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ba(e,o,r,n),e.rest=o=>e.clone({...e._zod.def,rest:o})});function Oc(e,t,o){let r=t instanceof S,n=r?o:t,s=r?t:null;return new Tc({type:"tuple",items:e,rest:s,...$.normalizeParams(n)})}i(Oc,"tuple");var ut=f("ZodRecord",(e,t)=>{cs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Wa(e,o,r,n),e.keyType=t.keyType,e.valueType=t.valueType});function Cc(e,t,o){return!t||!t._zod?new ut({type:"record",keyType:Mt(),valueType:e,...$.normalizeParams(t)}):new ut({type:"record",keyType:e,valueType:t,...$.normalizeParams(o)})}i(Cc,"record");function ru(e,t,o){let r=U(e);return r._zod.values=void 0,new ut({type:"record",keyType:r,valueType:t,...$.normalizeParams(o)})}i(ru,"partialRecord");function nu(e,t,o){return new ut({type:"record",keyType:e,valueType:t,mode:"loose",...$.normalizeParams(o)})}i(nu,"looseRecord");var jc=f("ZodMap",(e,t)=>{ls.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Da(e,o,r,n),e.keyType=t.keyType,e.valueType=t.valueType,e.min=(...o)=>e.check(se(...o)),e.nonempty=o=>e.check(se(1,o)),e.max=(...o)=>e.check(ke(...o)),e.size=(...o)=>e.check(Te(...o))});function iu(e,t,o){return new jc({type:"map",keyType:e,valueType:t,...$.normalizeParams(o)})}i(iu,"map");var Nc=f("ZodSet",(e,t)=>{us.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>qa(e,o,r,n),e.min=(...o)=>e.check(se(...o)),e.nonempty=o=>e.check(se(1,o)),e.max=(...o)=>e.check(ke(...o)),e.size=(...o)=>e.check(Te(...o))});function su(e,t){return new Nc({type:"set",valueType:e,...$.normalizeParams(t)})}i(su,"set");var pt=f("ZodEnum",(e,t)=>{ps.init(e,t),P.init(e,t),e._zod.processJSONSchema=(r,n,s)=>Ra(e,r,n,s),e.enum=t.entries,e.options=Object.values(t.entries);let o=new Set(Object.keys(t.entries));e.extract=(r,n)=>{let s={};for(let a of r)if(o.has(a))s[a]=t.entries[a];else throw new Error(`Key ${a} not found in enum`);return new pt({...t,checks:[],...$.normalizeParams(n),entries:s})},e.exclude=(r,n)=>{let s={...t.entries};for(let a of r)if(o.has(a))delete s[a];else throw new Error(`Key ${a} not found in enum`);return new pt({...t,checks:[],...$.normalizeParams(n),entries:s})}});function Mr(e,t){let o=Array.isArray(e)?Object.fromEntries(e.map(r=>[r,r])):e;return new pt({type:"enum",entries:o,...$.normalizeParams(t)})}i(Mr,"_enum");function au(e,t){return new pt({type:"enum",entries:e,...$.normalizeParams(t)})}i(au,"nativeEnum");var Lc=f("ZodLiteral",(e,t)=>{fs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ea(e,o,r,n),e.values=new Set(t.values),Object.defineProperty(e,"value",{get(){if(t.values.length>1)throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");return t.values[0]}})});function cu(e,t){return new Lc({type:"literal",values:Array.isArray(e)?e:[e],...$.normalizeParams(t)})}i(cu,"literal");var Dc=f("ZodFile",(e,t)=>{ds.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Oa(e,o,r,n),e.min=(o,r)=>e.check(se(o,r)),e.max=(o,r)=>e.check(ke(o,r)),e.mime=(o,r)=>e.check(tt(Array.isArray(o)?o:[o],r))});function lu(e){return ua(Dc,e)}i(lu,"file");var qc=f("ZodTransform",(e,t)=>{ms.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>La(e,o,r,n),e._zod.parse=(o,r)=>{if(r.direction==="backward")throw new ge(e.constructor.name);o.addIssue=s=>{if(typeof s=="string")o.issues.push($.issue(s,o.value,t));else{let a=s;a.fatal&&(a.continue=!1),a.code??(a.code="custom"),a.input??(a.input=o.value),a.inst??(a.inst=e),o.issues.push($.issue(a))}};let n=t.transform(o.value,o);return n instanceof Promise?n.then(s=>(o.value=s,o.fallback=!0,o)):(o.value=n,o.fallback=!0,o)}});function Fr(e){return new qc({type:"transform",transform:e})}i(Fr,"transform");var Ur=f("ZodOptional",(e,t)=>{Oo.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>pr(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Ut(e){return new Ur({type:"optional",innerType:e})}i(Ut,"optional");var Mc=f("ZodExactOptional",(e,t)=>{hs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>pr(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Fc(e){return new Mc({type:"optional",innerType:e})}i(Fc,"exactOptional");var Uc=f("ZodNullable",(e,t)=>{vs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ja(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Bt(e){return new Uc({type:"nullable",innerType:e})}i(Bt,"nullable");function uu(e){return Ut(Bt(e))}i(uu,"nullish");var Bc=f("ZodDefault",(e,t)=>{gs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Va(e,o,r,n),e.unwrap=()=>e._zod.def.innerType,e.removeDefault=e.unwrap});function Wc(e,t){return new Bc({type:"default",innerType:e,get defaultValue(){return typeof t=="function"?t():$.shallowClone(t)}})}i(Wc,"_default");var Jc=f("ZodPrefault",(e,t)=>{xs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ha(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Kc(e,t){return new Jc({type:"prefault",innerType:e,get defaultValue(){return typeof t=="function"?t():$.shallowClone(t)}})}i(Kc,"prefault");var Br=f("ZodNonOptional",(e,t)=>{bs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ka(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function Vc(e,t){return new Br({type:"nonoptional",innerType:e,...$.normalizeParams(t)})}i(Vc,"nonoptional");var Hc=f("ZodSuccess",(e,t)=>{ys.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ca(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function pu(e){return new Hc({type:"success",innerType:e})}i(pu,"success");var Yc=f("ZodCatch",(e,t)=>{ws.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ya(e,o,r,n),e.unwrap=()=>e._zod.def.innerType,e.removeCatch=e.unwrap});function Gc(e,t){return new Yc({type:"catch",innerType:e,catchValue:typeof t=="function"?t:()=>t})}i(Gc,"_catch");var Xc=f("ZodNaN",(e,t)=>{_s.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Aa(e,o,r,n)});function fu(e){return ca(Xc,e)}i(fu,"nan");var Gt=f("ZodPipe",(e,t)=>{Co.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ga(e,o,r,n),e.in=t.in,e.out=t.out});function yr(e,t){return new Gt({type:"pipe",in:e,out:t})}i(yr,"pipe");var Xt=f("ZodCodec",(e,t)=>{Gt.init(e,t),Ct.init(e,t)});function du(e,t,o){return new Xt({type:"pipe",in:e,out:t,transform:o.decode,reverseTransform:o.encode})}i(du,"codec");function mu(e){let t=e._zod.def;return new Xt({type:"pipe",in:t.out,out:t.in,transform:t.reverseTransform,reverseTransform:t.transform})}i(mu,"invertCodec");var Qc=f("ZodPreprocess",(e,t)=>{Gt.init(e,t),ks.init(e,t)}),el=f("ZodReadonly",(e,t)=>{zs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Xa(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function tl(e){return new el({type:"readonly",innerType:e})}i(tl,"readonly");var ol=f("ZodTemplateLiteral",(e,t)=>{$s.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Ta(e,o,r,n)});function hu(e,t){return new ol({type:"template_literal",parts:e,...$.normalizeParams(t)})}i(hu,"templateLiteral");var rl=f("ZodLazy",(e,t)=>{Zs.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ec(e,o,r,n),e.unwrap=()=>e._zod.def.getter()});function nl(e){return new rl({type:"lazy",getter:e})}i(nl,"lazy");var il=f("ZodPromise",(e,t)=>{Ps.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Qa(e,o,r,n),e.unwrap=()=>e._zod.def.innerType});function vu(e){return new il({type:"promise",innerType:e})}i(vu,"promise");var sl=f("ZodFunction",(e,t)=>{Ss.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>Na(e,o,r,n)});function gu(e){return new sl({type:"function",input:Array.isArray(e?.input)?Oc(e?.input):e?.input??Vt(je()),output:e?.output??je()})}i(gu,"_function");var Qt=f("ZodCustom",(e,t)=>{Is.init(e,t),P.init(e,t),e._zod.processJSONSchema=(o,r,n)=>ja(e,o,r,n)});function xu(e){let t=new C({check:"custom"});return t._zod.check=e,t}i(xu,"check");function bu(e,t){return pa(Qt,e??(()=>!0),t)}i(bu,"custom");function al(e,t={}){return fa(Qt,e,t)}i(al,"refine");function cl(e,t){return da(e,t)}i(cl,"superRefine");var yu=ma,wu=ha;function _u(e,t={}){let o=new Qt({type:"custom",check:"custom",fn:i(r=>r instanceof e,"fn"),abort:!0,...$.normalizeParams(t)});return o._zod.bag.Class=e,o._zod.check=r=>{r.value instanceof e||r.issues.push({code:"invalid_type",expected:e.name,input:r.value,inst:o,path:[...o._zod.def.path??[]]})},o}i(_u,"_instanceof");var ku=i((...e)=>va({Codec:Xt,Boolean:ht,String:ft},...e),"stringbool");function zu(e){let t=nl(()=>qr([Mt(e),xc(),bc(),kc(),Vt(t),Cc(Mt(),t)]));return t}i(zu,"json");function $u(e,t){return new Qc({type:"pipe",in:Fr(e),out:t})}i($u,"preprocess");var sd={invalid_type:"invalid_type",too_big:"too_big",too_small:"too_small",invalid_format:"invalid_format",not_multiple_of:"not_multiple_of",unrecognized_keys:"unrecognized_keys",invalid_union:"invalid_union",invalid_key:"invalid_key",invalid_element:"invalid_element",invalid_value:"invalid_value",custom:"custom"};function ad(e){L({customError:e})}i(ad,"setErrorMap");function cd(){return L().customError}i(cd,"getErrorMap");var ll;ll||(ll={});var _={...qt,...mr,iso:lt},ld=new Set(["$schema","$ref","$defs","definitions","$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor","type","enum","const","anyOf","oneOf","allOf","not","properties","required","additionalProperties","patternProperties","propertyNames","minProperties","maxProperties","items","prefixItems","additionalItems","minItems","maxItems","uniqueItems","contains","minContains","maxContains","minLength","maxLength","pattern","format","minimum","maximum","exclusiveMinimum","exclusiveMaximum","multipleOf","description","default","contentEncoding","contentMediaType","contentSchema","unevaluatedItems","unevaluatedProperties","if","then","else","dependentSchemas","dependentRequired","nullable","readOnly"]);function ud(e,t){let o=e.$schema;return o==="https://json-schema.org/draft/2020-12/schema"?"draft-2020-12":o==="http://json-schema.org/draft-07/schema#"?"draft-7":o==="http://json-schema.org/draft-04/schema#"?"draft-4":t??"draft-2020-12"}i(ud,"detectVersion");function pd(e,t){if(!e.startsWith("#"))throw new Error("External $ref is not supported, only local refs (#/...) are allowed");let o=e.slice(1).split("/").filter(Boolean);if(o.length===0)return t.rootSchema;let r=t.version==="draft-2020-12"?"$defs":"definitions";if(o[0]===r){let n=o[1];if(!n||!t.defs[n])throw new Error(`Reference not found: ${e}`);return t.defs[n]}throw new Error(`Reference not found: ${e}`)}i(pd,"resolveRef");function Su(e,t){if(e.not!==void 0){if(typeof e.not=="object"&&Object.keys(e.not).length===0)return _.never();throw new Error("not is not supported in Zod (except { not: {} } for never)")}if(e.unevaluatedItems!==void 0)throw new Error("unevaluatedItems is not supported");if(e.unevaluatedProperties!==void 0)throw new Error("unevaluatedProperties is not supported");if(e.if!==void 0||e.then!==void 0||e.else!==void 0)throw new Error("Conditional schemas (if/then/else) are not supported");if(e.dependentSchemas!==void 0||e.dependentRequired!==void 0)throw new Error("dependentSchemas and dependentRequired are not supported");if(e.$ref){let n=e.$ref;if(t.refs.has(n))return t.refs.get(n);if(t.processing.has(n))return _.lazy(()=>{if(!t.refs.has(n))throw new Error(`Circular reference not resolved: ${n}`);return t.refs.get(n)});t.processing.add(n);let s=pd(n,t),a=F(s,t);return t.refs.set(n,a),t.processing.delete(n),a}if(e.enum!==void 0){let n=e.enum;if(t.version==="openapi-3.0"&&e.nullable===!0&&n.length===1&&n[0]===null)return _.null();if(n.length===0)return _.never();if(n.length===1)return _.literal(n[0]);if(n.every(a=>typeof a=="string"))return _.enum(n);let s=n.map(a=>_.literal(a));return s.length<2?s[0]:_.union([s[0],s[1],...s.slice(2)])}if(e.const!==void 0)return _.literal(e.const);let o=e.type;if(Array.isArray(o)){let n=o.map(s=>{let a={...e,type:s};return Su(a,t)});return n.length===0?_.never():n.length===1?n[0]:_.union(n)}if(!o)return _.any();let r;switch(o){case"string":{let n=_.string();if(e.format){let s=e.format;s==="email"?n=n.check(_.email()):s==="uri"||s==="uri-reference"?n=n.check(_.url()):s==="uuid"||s==="guid"?n=n.check(_.uuid()):s==="date-time"?n=n.check(_.iso.datetime()):s==="date"?n=n.check(_.iso.date()):s==="time"?n=n.check(_.iso.time()):s==="duration"?n=n.check(_.iso.duration()):s==="ipv4"?n=n.check(_.ipv4()):s==="ipv6"?n=n.check(_.ipv6()):s==="mac"?n=n.check(_.mac()):s==="cidr"?n=n.check(_.cidrv4()):s==="cidr-v6"?n=n.check(_.cidrv6()):s==="base64"?n=n.check(_.base64()):s==="base64url"?n=n.check(_.base64url()):s==="e164"?n=n.check(_.e164()):s==="jwt"?n=n.check(_.jwt()):s==="emoji"?n=n.check(_.emoji()):s==="nanoid"?n=n.check(_.nanoid()):s==="cuid"?n=n.check(_.cuid()):s==="cuid2"?n=n.check(_.cuid2()):s==="ulid"?n=n.check(_.ulid()):s==="xid"?n=n.check(_.xid()):s==="ksuid"&&(n=n.check(_.ksuid()))}typeof e.minLength=="number"&&(n=n.min(e.minLength)),typeof e.maxLength=="number"&&(n=n.max(e.maxLength)),e.pattern&&(n=n.regex(new RegExp(e.pattern))),r=n;break}case"number":case"integer":{let n=o==="integer"?_.number().int():_.number();typeof e.minimum=="number"&&(n=n.min(e.minimum)),typeof e.maximum=="number"&&(n=n.max(e.maximum)),typeof e.exclusiveMinimum=="number"?n=n.gt(e.exclusiveMinimum):e.exclusiveMinimum===!0&&typeof e.minimum=="number"&&(n=n.gt(e.minimum)),typeof e.exclusiveMaximum=="number"?n=n.lt(e.exclusiveMaximum):e.exclusiveMaximum===!0&&typeof e.maximum=="number"&&(n=n.lt(e.maximum)),typeof e.multipleOf=="number"&&(n=n.multipleOf(e.multipleOf)),r=n;break}case"boolean":{r=_.boolean();break}case"null":{r=_.null();break}case"object":{let n={},s=e.properties||{},a=new Set(e.required||[]);for(let[l,p]of Object.entries(s)){let d=F(p,t);n[l]=a.has(l)?d:d.optional()}if(e.propertyNames){let l=F(e.propertyNames,t),p=e.additionalProperties&&typeof e.additionalProperties=="object"?F(e.additionalProperties,t):_.any();if(Object.keys(n).length===0){r=_.record(l,p);break}let d=_.object(n).passthrough(),h=_.looseRecord(l,p);r=_.intersection(d,h);break}if(e.patternProperties){let l=e.patternProperties,p=Object.keys(l),d=[];for(let y of p){let w=F(l[y],t),Z=_.string().regex(new RegExp(y));d.push(_.looseRecord(Z,w))}let h=[];if(Object.keys(n).length>0&&h.push(_.object(n).passthrough()),h.push(...d),h.length===0)r=_.object({}).passthrough();else if(h.length===1)r=h[0];else{let y=_.intersection(h[0],h[1]);for(let w=2;w<h.length;w++)y=_.intersection(y,h[w]);r=y}break}let c=_.object(n);e.additionalProperties===!1?r=c.strict():typeof e.additionalProperties=="object"?r=c.catchall(F(e.additionalProperties,t)):r=c.passthrough();break}case"array":{let n=e.prefixItems,s=e.items;if(n&&Array.isArray(n)){let a=n.map(l=>F(l,t)),c=s&&typeof s=="object"&&!Array.isArray(s)?F(s,t):void 0;c?r=_.tuple(a).rest(c):r=_.tuple(a),typeof e.minItems=="number"&&(r=r.check(_.minLength(e.minItems))),typeof e.maxItems=="number"&&(r=r.check(_.maxLength(e.maxItems)))}else if(Array.isArray(s)){let a=s.map(l=>F(l,t)),c=e.additionalItems&&typeof e.additionalItems=="object"?F(e.additionalItems,t):void 0;c?r=_.tuple(a).rest(c):r=_.tuple(a),typeof e.minItems=="number"&&(r=r.check(_.minLength(e.minItems))),typeof e.maxItems=="number"&&(r=r.check(_.maxLength(e.maxItems)))}else if(s!==void 0){let a=F(s,t),c=_.array(a);typeof e.minItems=="number"&&(c=c.min(e.minItems)),typeof e.maxItems=="number"&&(c=c.max(e.maxItems)),r=c}else r=_.array(_.any());break}default:throw new Error(`Unsupported type: ${o}`)}return r}i(Su,"convertBaseSchema");function F(e,t){if(typeof e=="boolean")return e?_.any():_.never();let o=Su(e,t),r=e.type||e.enum!==void 0||e.const!==void 0;if(e.anyOf&&Array.isArray(e.anyOf)){let c=e.anyOf.map(p=>F(p,t)),l=_.union(c);o=r?_.intersection(o,l):l}if(e.oneOf&&Array.isArray(e.oneOf)){let c=e.oneOf.map(p=>F(p,t)),l=_.xor(c);o=r?_.intersection(o,l):l}if(e.allOf&&Array.isArray(e.allOf))if(e.allOf.length===0)o=r?o:_.any();else{let c=r?o:F(e.allOf[0],t),l=r?0:1;for(let p=l;p<e.allOf.length;p++)c=_.intersection(c,F(e.allOf[p],t));o=c}e.nullable===!0&&t.version==="openapi-3.0"&&(o=_.nullable(o)),e.readOnly===!0&&(o=_.readonly(o)),e.default!==void 0&&(o=o.default(e.default));let n={},s=["$id","id","$comment","$anchor","$vocabulary","$dynamicRef","$dynamicAnchor"];for(let c of s)c in e&&(n[c]=e[c]);let a=["contentEncoding","contentMediaType","contentSchema"];for(let c of a)c in e&&(n[c]=e[c]);for(let c of Object.keys(e))ld.has(c)||(n[c]=e[c]);return Object.keys(n).length>0&&t.registry.add(o,n),e.description&&(o=o.describe(e.description)),o}i(F,"convertSchema");function Pu(e,t){if(typeof e=="boolean")return e?_.any():_.never();let o;try{o=JSON.parse(JSON.stringify(e))}catch{throw new Error("fromJSONSchema input is not valid JSON (possibly cyclic); use $defs/$ref for recursive schemas")}let r=ud(o,t?.defaultTarget),n=o.$defs||o.definitions||{},s={version:r,defs:n,refs:new Map,processing:new Set,rootSchema:o,registry:t?.registry??M};return F(o,s)}i(Pu,"fromJSONSchema");var ul={};pe(ul,{bigint:()=>hd,boolean:()=>md,date:()=>vd,number:()=>dd,string:()=>fd});function fd(e){return Ts(ft,e)}i(fd,"string");function dd(e){return Ms(mt,e)}i(dd,"number");function md(e){return Vs(ht,e)}i(md,"boolean");function hd(e){return Ys(vt,e)}i(hd,"bigint");function vd(e){return aa(Kt,e)}i(vd,"date");L(jt());var Wr=/^[a-z][a-z0-9_]{0,23}$/,Iu=/^#[0-9a-fA-F]{6}$/,Zu=i(e=>`${Math.round(e*100)}%`,"percent"),ce=[{key:"showThrough",name:"visibility",aliases:["showthrough"],label:"Visibility",hint:"How much of the scene shows through bb",describe:"how much of the scene shows through bb",min:0,max:.8,step:.01,default:.77,format:Zu},{key:"speed",name:"motion",aliases:["speed"],label:"Motion",hint:"How fast the scene moves",describe:"animation speed",min:0,max:4,step:.05,default:.75,format:i(e=>`${e.toFixed(1)}\xD7`,"format")},{key:"glass",name:"glass",aliases:["glass_opacity"],label:"Glass opacity",hint:"How solid the glass behind text is; lower lets more of the scene through",describe:"opacity of the frosted glass that keeps text readable over the scene; it is always on and can only be lowered from its default",min:.2,max:.6,step:.01,default:.6,format:Zu}];function Ru(e,t){return Math.min(e.max,Math.max(e.min,t))}i(Ru,"clampToSpec");function Eu(e){return Object.fromEntries(e.map(t=>[t.id,t.value]))}i(Eu,"valuesOf");var Jr={enabled:!0,...Object.fromEntries(ce.map(e=>[e.key,e.default]))};var Au=`Scenes are GLSL ES 3.00 fragment bodies. Define:

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
action=look shows the scene behind bb's real panels and glass, with text drawn as bars, and reports where the open areas are, which words the scene makes hard to read, how far the frame differs from bb's background, how much it moved in a second, and how long a frame takes to render. If it flags the scene as too faint, nearly still, too heavy, hidden behind the panels, or hard to read, fix that.`;function g(e,t,o,r,n,s=.01){return{id:e,label:t,min:o,max:r,step:s,value:n}}i(g,"param");var gd=`vec3 scene(vec2 uv, vec2 p) {
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

  // elevation walks the palette: blue valleys, violet slopes, rose ridges, gold only on the summits
  vec3 night = mix(u_palette[0], u_palette[1], 0.3) * 0.8;
  vec3 lit = ramp(clamp(h * 0.62, 0.0, 1.0)) * p_bright;
  vec3 base = mix(night, lit, p_fill);
  vec3 ink = mix(base, u_palette[3] * p_bright, 0.55);
  vec3 col = mix(base, ink, clamp(line * p_lines + major * p_lines * 0.6, 0.0, 1.0));

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, p_sat);
  // lighten toward a pale tint of the same color, so lighter never means grayer
  col = mix(col, mix(vec3(1.0), col / max(max(max(col.r, col.g), col.b), 1e-3), 0.35), p_lift);
  return mix(u_canvas, col, p_color);
}`,Tu={id:"contour",name:"Contour",source:gd,palette:["#526181","#3a2d8f","#e0457b","#ffd36b"],params:[g("scale","Zoom",.5,5,1.6,.01),g("density","Line density",2,30,22,.5),g("weight","Line weight",.5,3,1,.01),g("lines","Line contrast",0,1,.38,.01),g("height","Agent peaks",0,2,1.54,.01),g("fill","Fill",0,1,.75,.01),g("bright","Brightness",.2,1,.9,.01),g("lift","Base lightness",0,.8,.3,.01),g("sat","Saturation",0,1,.85,.01),g("drift","Drift",0,3,.6,.01),g("color","Color strength",0,1,1,.01)]};var xd=`const float LAKE = -0.035;
float ridgeFar(float x) { return 0.05 + 0.13 * pow(1.0 - abs(2.0 * noise(vec2(x * 2.2, 1.0)) - 1.0), 2.0) + 0.03 * noise(vec2(x * 7.0, 2.0)) + 0.01 * noise(vec2(x * 23.0, 3.0)); }
float ridgeNear(float x) { return 0.005 + 0.03 * sin(x * 2.1 + 2.0) + 0.02 * noise(vec2(x * 5.0, 3.0)) + 0.006 * noise(vec2(x * 19.0, 4.0)); }
float shoreY(float x) { return -0.105 + 0.018 * sin(x * 1.7 + 1.0) + 0.008 * noise(vec2(x * 6.0, 5.0)); }
vec2 moonPos() { return vec2(0.3 * u_resolution.x / u_resolution.y, 0.34); }

// a row of tiered pines standing on base, thinning out between groves
float pines(vec2 p, float base, float cw, float hMin, float hMax, float seed) {
  float cx = floor(p.x / cw);
  float cov = 0.0;
  for (int j = -1; j <= 1; j++) {
    float c = cx + float(j);
    float grove = smoothstep(0.35, 0.6, noise(vec2(c * cw * 2.5, seed)));
    if (hash21(vec2(c, seed)) > 0.25 + 0.75 * grove) continue;
    float x0 = (c + 0.2 + 0.6 * hash21(vec2(c, seed + 1.0))) * cw;
    float H = mix(hMin, hMax, hash21(vec2(c, seed + 2.0))) * (0.55 + 0.45 * grove);
    float k = (p.y - base) / H;
    if (k < -0.3 || k > 1.0) continue;
    float wd = cw * 0.5 * (1.0 - k) * (0.7 + 0.3 * abs(sin(k * 16.0 + c)));
    cov = max(cov, smoothstep(wd, wd * 0.5, abs(p.x - x0)));
  }
  return cov;
}

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
  vec2 mp = moonPos();

  // sky: navy overhead, a pale band of moonlit haze along the peaks
  float sy = clamp((p.y - LAKE) / 0.5, 0.0, 1.0);
  vec3 col = mix(mix(K, V, 0.35), V * 0.8, smoothstep(0.0, 0.25, sy));
  col = mix(col, I, smoothstep(0.2, 0.85, sy));
  col = mix(col, mix(K, paper, 0.35), smoothstep(0.14, 0.0, sy) * 0.35);
  float mw = p.y - 0.12 - 0.3 * p.x + 0.05 * noise(vec2(p.x * 3.0 + t * 0.01, 2.0));
  float band = exp(-mw * mw / 0.014) * smoothstep(0.04, 0.2, sy);
  float neb = noise(p * 5.0 + vec2(t * 0.012, 0.0));
  float dust = smoothstep(0.55, 0.8, noise(p * 11.0 - 3.0));
  col = mix(col, mix(V, K, neb), band * (0.4 + 0.45 * neb) * (1.0 - 0.6 * dust) * p_galaxy);
  col = mix(col, mix(K, paper, 0.5), band * band * smoothstep(0.5, 0.85, neb) * 0.3 * p_galaxy);

  // the moon: a wide halo, a textured disc lit from the upper left
  vec2 md = p - mp;
  float ml = length(md);
  col = mix(col, mix(K, paper, 0.55), exp(-ml * ml / 0.03) * 0.4 * p_moon);
  col = mix(col, mix(K, paper, 0.75), exp(-ml / 0.014) * 0.5 * min(p_moon, 1.0));
  float maria = noise(md * 45.0 + 3.0) * 0.6 + noise(md * 120.0) * 0.4;
  vec3 moonC = mix(vec3(0.99, 0.97, 0.9), vec3(0.74, 0.8, 0.88), smoothstep(0.45, 0.72, maria));
  moonC *= 0.8 + 0.2 * smoothstep(0.055, 0.0, length(md - vec2(-0.012, 0.012)));
  col = mix(col, moonC, smoothstep(0.044, 0.041, ml) * min(p_moon, 1.0));

  // moonlit wisps of cloud
  float cl = noise(vec2(p.x * 1.6 - t * 0.02, p.y * 9.0 + 1.7)) * 0.7 + noise(vec2(p.x * 5.0 - t * 0.03, p.y * 22.0)) * 0.3;
  float wisp = smoothstep(0.52, 0.76, cl) * smoothstep(0.05, 0.2, p.y) * smoothstep(0.5, 0.25, p.y);
  col = mix(col, mix(mix(V, K, 0.5), mix(K, paper, 0.55), exp(-ml * ml / 0.06)), wisp * 0.45);

  // far range: moon-facing slopes catch light, snow on the high peaks, haze at the foot
  float rf = ridgeFar(p.x);
  float slope = (ridgeFar(p.x + 0.004) - rf) / 0.004;
  float lit = clamp(0.5 - slope * 0.7, 0.0, 1.0);
  vec3 mtn = mix(mix(V, K, 0.3), mix(K, paper, 0.3), lit * 0.55);
  mtn *= 0.86 + 0.2 * noise(vec2(p.x * 26.0 + p.y * 12.0, p.y * 7.0));
  float snow = smoothstep(0.12, 0.15, rf) * smoothstep(0.03, 0.0, rf - p.y) * smoothstep(0.35, 0.6, noise(vec2(p.x * 40.0, p.y * 9.0)));
  mtn = mix(mtn, mix(paper, K, 0.25) * (0.75 + 0.3 * lit), snow * 0.8);
  mtn = mix(mtn, mix(K, V, 0.45), smoothstep(0.07, 0.0, p.y - LAKE) * 0.55);
  col = mix(col, mtn, smoothstep(rf + 0.002, rf - 0.002, p.y));

  // near ridge, dark with pines along its crest
  float rn = ridgeNear(p.x);
  float nearM = max(smoothstep(rn + 0.002, rn - 0.002, p.y), pines(p, rn - 0.004, 0.02, 0.02, 0.065, 7.0));
  vec3 hc = mix(I, V, 0.25 + 0.2 * noise(vec2(p.x * 9.0, p.y * 30.0)));
  hc = mix(hc, mix(V, K, 0.35), smoothstep(0.03, 0.0, p.y - LAKE) * 0.35);
  col = mix(col, hc, nearM);

  // the lake mirrors the ridge, the pines, and a glittering path of moonlight
  if (p.y < LAKE) {
    float dy = LAKE - p.y;
    float wob = (noise(vec2(p.x * 30.0, p.y * 300.0 - t * 0.5)) - 0.5) * 0.005 * (0.3 + dy * 20.0);
    vec2 rp = vec2(p.x + wob, LAKE + dy * 1.25);
    vec3 lc = mix(mix(K, V, 0.35), V * 0.75, smoothstep(0.0, 0.07, dy));
    float rr = ridgeNear(rp.x);
    float refl = max(smoothstep(rr + 0.003, rr - 0.003, rp.y), pines(rp, rr - 0.004, 0.02, 0.02, 0.065, 7.0));
    lc = mix(lc, mix(I, V, 0.45), refl * 0.8);
    float glit = exp(-pow((p.x - mp.x) / (0.015 + dy * 0.5), 2.0)) * smoothstep(0.5, 0.85, noise(vec2(p.x * 45.0, p.y * 420.0 - t * 0.8)));
    lc = mix(lc, mix(paper, K, 0.25), glit * 0.85 * min(p_moon, 1.0));
    lc *= 0.9 + 0.14 * noise(vec2(p.x * 6.0, p.y * 160.0 + t * 0.3));
    col = lc;
  }

  // meadow: dry-brush strokes following the slope, a moonlit bank at the water
  float sh = shoreY(p.x);
  float gm0 = smoothstep(sh + 0.003, sh - 0.003, p.y);
  float mdp = clamp((sh - p.y) / 0.35, 0.0, 1.0);
  vec3 mc = mix(mix(V, K, 0.25), mix(I, V, 0.45), smoothstep(0.0, 0.7, mdp));
  mc = mix(mc, mix(K, paper, 0.25), smoothstep(0.01, 0.0, sh - p.y) * 0.4);
  mc *= 0.84 + 0.26 * noise(vec2(p.x * 4.0 + p.y * 2.0, p.y * 55.0));
  col = mix(col, mc, gm0);

  float r2 = sh - 0.13 + 0.035 * sin(p.x * 1.1 + 0.3) + 0.012 * sin(p.x * 3.3 + 1.0);
  vec3 hc2 = mix(I, V, 0.4 + 0.2 * noise(vec2(p.x * 3.0, p.y * 5.0 + 2.0)));
  hc2 = mix(hc2, mix(K, V, 0.35), smoothstep(0.04, 0.0, r2 - p.y) * 0.6);
  hc2 *= 0.86 + 0.22 * noise(vec2(p.x * 5.0 - p.y * 3.0, p.y * 48.0));
  col = mix(col, hc2, smoothstep(r2 + 0.004, r2 - 0.004, p.y));

  // wildflowers scattered through the meadow
  vec2 fg = p * vec2(70.0, 90.0);
  vec2 fid = floor(fg);
  float fh = hash21(fid + 40.0);
  float fl = smoothstep(0.2, 0.08, length(fract(fg) - 0.5 - (vec2(hash21(fid + 1.1), hash21(fid + 2.2)) - 0.5) * 0.5));
  fl *= step(0.85, fh) * gm0 * smoothstep(0.0, 0.08, sh - p.y);
  col = mix(col, (fh > 0.95 ? mix(Y, paper, 0.4) : mix(K, paper, 0.55)) * 0.9, fl * 0.75);

  float gf = grass(p, 0.011, 0.05, 0.14, w.y * 0.7, 23.0, 0.25, 0.15, 0.3);
  col = mix(col, mix(I, V, 0.5) * 0.9, gf * 0.7);
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
  vec2 q = p + ((wv - 0.5) * 0.075 + fe * 0.012) * p_wet - dp * pt * 0.04;
  vec3 c0 = meadow(q, w, t);
  vec3 c1 = meadow(q + vec2(0.005, 0.008), w, t);

  float calm = 1.0 - 0.75 * smoothstep(0.12, 0.42, p.y);
  float edge = smoothstep(0.03, 0.22, length(c0 - c1));
  vec3 col = mix(c0, pow(min(c0, c1), vec3(1.35)) * 0.92, edge * 0.55);

  float bn = noise(p * 2.6 + wv * 1.6 + 11.0) * 0.75 + noise(p * 11.0 + wv * 3.0) * 0.18 + noise(p * 38.0) * 0.07;
  float inb = smoothstep(0.656, 0.664, bn);
  float rimIn = inb * smoothstep(0.73, 0.66, bn);
  col = mix(col, pow(col, vec3(0.7)), inb * 0.7 * p_wet);
  col = pow(col, vec3(1.0 + rimIn * 0.8 * p_wet * calm));
  col = mix(col, pow(col, vec3(0.8)), pt * 0.4);

  col = pow(col, vec3(1.0 + (noise(vec2(q.x * 40.0, q.y * 2.0)) - 0.5) * 0.2 * p_wet * calm));
  float g = noise(p * min(u_resolution.y / 2.5, 220.0));
  float valley = noise(p * 30.0 + 5.0);
  float lum = dot(col, vec3(0.3, 0.55, 0.15));
  float gw = (0.35 + clamp((col.b - col.g) * 1.5, 0.0, 1.0)) * (1.0 - lum * 0.6) * calm;
  col = pow(col, vec3(1.0 + ((g - 0.5) * (0.5 + 0.5 * valley) + (valley - 0.5) * 0.15) * 0.7 * p_grain * gw));

  float skyM = smoothstep(ridgeFar(q.x) + 0.004, ridgeFar(q.x) + 0.03, q.y);
  // nebula: layered pigment in the milky way, cut by dark dust filaments
  float mw = q.y - 0.12 - 0.3 * q.x;
  float band = exp(-mw * mw / 0.02) * skyM * p_galaxy;
  float nb = noise(q * 4.0 + wv * 1.5) * 0.5 + noise(q * 9.0 - t * 0.01) * 0.3 + noise(q * 22.0) * 0.2;
  float fil = smoothstep(0.5, 0.75, noise(vec2(q.x * 7.0 + q.y * 3.0, q.y * 16.0 - q.x * 4.0)));
  vec3 nebC = mix(mix(K, vec3(0.55, 0.95, 1.0), smoothstep(0.5, 0.8, nb)), mix(Y, vec3(1.0), 0.4), pow(nb, 4.0) * exp(-mw * mw / 0.004));
  col = 1.0 - (1.0 - col) * (1.0 - nebC * smoothstep(0.25, 0.75, nb) * band * 0.85 * (1.0 - 0.7 * fil));
  col *= 1.0 - fil * band * 0.35;

  for (int l = 0; l < 3; l++) {
    float sc = l == 0 ? 90.0 : (l == 1 ? 38.0 : 14.0);
    vec2 sg = p * sc + float(l) * 17.0;
    vec2 sid = floor(sg);
    float sh = hash21(sid);
    vec2 so = vec2(hash21(sid + 2.3), hash21(sid + 5.9)) - 0.5;
    vec2 sv = fract(sg) - 0.5 - so * 0.6;
    float sd = length(sv);
    float dens = l == 0 ? 0.12 + 0.25 * band : (l == 1 ? 0.07 : 0.1);
    float on = step(1.0 - dens * p_stars, sh) * skyM * min(p_stars * 2.0, 1.0) * smoothstep(0.046, 0.07, length(p - moonPos()));
    float star = smoothstep(l == 0 ? 0.09 : 0.06, 0.0, sd) + (l == 0 ? 0.0 : exp(-sd * sd / 0.02) * 0.3);
    if (l == 2) {
      star = smoothstep(0.035, 0.0, sd) + exp(-sd * sd / 0.004) * 0.6;
      star += (exp(-abs(sv.x) * 90.0) * exp(-abs(sv.y) * 9.0) + exp(-abs(sv.y) * 90.0) * exp(-abs(sv.x) * 9.0)) * 0.7;
    }
    float tw = 0.55 + 0.45 * sin(t * (0.8 + 1.8 * sh) + sh * 60.0);
    vec3 sc3 = mix(vec3(0.86, 0.92, 1.0), sh > 0.5 ? K : mix(Y, vec3(1.0), 0.5), 0.3 * fract(sh * 13.0));
    col = 1.0 - (1.0 - col) * (1.0 - sc3 * clamp(star * on * tw, 0.0, 1.0));
  }

  // ground mist, lit from within by the swarm
  float mistN = noise(vec2(q.x * 2.5 - t * 0.03, q.y * 7.0)) * 0.65 + noise(vec2(q.x * 7.0 + t * 0.05, q.y * 18.0)) * 0.35;
  float mist = smoothstep(0.06, 0.0, abs(q.y - LAKE + 0.01)) * smoothstep(0.35, 0.75, mistN) * p_mist;
  col = mix(col, mix(K, vec3(0.85, 0.93, 1.0), 0.45), mist * 0.4);

  // fireflies: J-shaped flashes, long-exposure trails, out-of-focus ones up close
  float ax = u_resolution.x / u_resolution.y;
  vec3 green = mix(Y, vec3(0.78, 1.0, 0.42), 0.4);
  vec3 hot = mix(green, vec3(1.0, 1.0, 0.9), 0.6);
  float light = 0.0;
  for (int i = 0; i < 76; i++) {
    float fi = float(i);
    if (fi >= 16.0 + 30.0 * p_motes) break;
    vec2 s = vec2(fi * 7.13, fi * 3.71);
    vec2 hp = vec2(hash21(s), hash21(s + 1.7));
    float z = hash21(s + 6.6);
    float xs = hp.x * 2.0 - 1.0;
    xs = sign(xs) * pow(abs(xs), 0.55);
    vec2 home = vec2(xs * 0.5 * ax, mix(-0.46, 0.0, hp.y));
    vec2 hd = p - home;
    if (dot(hd, hd) > 0.06) continue;
    float w1 = 0.21 * (1.0 + hp.y), w2 = 0.37 * (1.0 + hp.x);
    vec2 amp = vec2(0.08, 0.045) * (0.6 + 0.8 * z);
    vec2 fp = home + amp * vec2(sin(t * w1 + fi * 2.1), sin(t * w2 + fi));
    vec2 fb = home + amp * vec2(sin((t - 1.0) * w1 + fi * 2.1), sin((t - 1.0) * w2 + fi));
    float rate = 0.35 + 0.35 * hash21(s + 9.1);
    float ph = fract(t * rate + hash21(s + 3.3));
    float flash = smoothstep(0.0, 0.05, ph) * (1.0 - smoothstep(0.05, 0.55, ph));
    flash = max(flash, 0.14);
    vec2 d = p - fp + (wv - 0.5) * 0.02;
    float d2 = dot(d, d);
    float r = 0.0085 * p_size * (0.6 + 0.8 * z);
    light += flash * exp(-d2 / 0.006) * (0.5 + z);
    if (z > 0.88) {
      // near the lens: a soft bokeh disc with a brighter rim
      float R = r * 3.2;
      float dl = sqrt(d2);
      float disc = smoothstep(R, R * 0.88, dl) * (0.35 + 0.35 * smoothstep(R * 0.55, R, dl));
      col = 1.0 - (1.0 - col) * (1.0 - green * disc * flash * 0.8 * min(p_motes, 1.0));
      continue;
    }
    vec2 ba = fp - fb;
    float k = clamp(dot(p - fb, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
    float td = length(p - fb - ba * k);
    float ph0 = fract(ph - rate * (1.0 - k));
    float tf = smoothstep(0.0, 0.05, ph0) * (1.0 - smoothstep(0.05, 0.55, ph0));
    float trail = smoothstep(r * 0.7, 0.0, td) * tf * k * p_trails;
    float halo = exp(-d2 / (r * r * 30.0)) * flash * p_motes * (1.0 + 1.2 * fe.x);
    col = 1.0 - (1.0 - col) * (1.0 - green * clamp(halo * 1.1 + trail * 0.85, 0.0, 1.0));
    col = mix(col, hot, smoothstep(r, r * 0.3, sqrt(d2)) * flash * min(p_motes, 1.0));
  }
  // their light catches the grass and mist around them
  col += green * clamp(light, 0.0, 1.5) * 0.18 * (1.0 - skyM * 0.6) * (0.4 + mist);

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

  // watercolor finish: values settle into flat glazes whose edges pool darker
  vec3 lw = vec3(0.3, 0.55, 0.15);
  float L0 = dot(col, lw);
  float lv = (L0 + (noise(p * 3.5 + wv * 3.0) - 0.5) * 0.14) * 5.0;
  float fr = fract(lv);
  float Lq = (floor(lv) + smoothstep(0.15, 0.85, fr)) / 5.0;
  float settle = clamp(0.55 * p_wash, 0.0, 1.0) * (1.0 - clamp(light, 0.0, 1.0));
  col = mix(col, col * clamp((Lq + 0.03) / (L0 + 0.03), 0.8, 1.25), settle);
  col *= 1.0 - exp(-pow((fr - 0.3) / 0.08, 2.0)) * 0.1 * p_wet * settle;
  // pigment drifts between teal and indigo across the sheet
  float hue = noise(p * 1.7 + wv * 1.2 + 21.0);
  col *= mix(vec3(1.0), mix(vec3(0.9, 1.04, 1.05), vec3(0.97, 0.95, 1.07), hue), 0.7 * p_wet);
  // cold-press paper: lit tooth, pigment granulating in its valleys
  float th = noise(p * 210.0) * 0.6 + noise(p * 80.0 + 3.0) * 0.4;
  vec2 po = p + vec2(0.0015);
  float th2 = noise(po * 210.0) * 0.6 + noise(po * 80.0 + 3.0) * 0.4;
  float Lc = dot(col, lw);
  col *= 1.0 + (th - th2) * 0.35 * p_grain;
  col *= 1.0 - (1.0 - th) * 0.16 * p_grain * (1.0 - Lc);

  float pf = min(u_resolution.y / 4.0, 160.0);
  float pn = noise(p * pf) * 0.6 + noise(p * pf * 0.47 + 4.0) * 0.4;
  col *= 0.94 + 0.09 * pn;
  col = mix(col, vec3(0.97, 0.94, 0.88), 0.03);
  return mix(u_canvas, col, p_color);
}`,Ou={id:"fireflies",name:"Fireflies",source:xd,palette:["#070b22","#1f3f94","#ffd65c","#58b4ff"],params:[g("size","Firefly size",.2,3,1.2),g("motes","Firefly swarm",0,2,.9),g("stars","Stars",0,2,1),g("galaxy","Milky Way",0,2,1),g("trails","Light trails",0,2,1),g("mist","Ground mist",0,2,1),g("moon","Moon",0,2,1),g("wind","Grass sway",0,3,1),g("wet","Wetness (blooms & bleed)",0,2,1),g("wash","Wash layering",0,2,1),g("grain","Granulation",0,2,1),g("color","Color strength",0,1,.92)]};var bd=`// Fuzzy Dots: twelve fuzzy little Dots with an unruly coat.

const vec3 FUZZ_WHITE=vec3(1.0,0.985,0.965);
const vec3 FUZZ_INK=vec3(0.055,0.062,0.080);


float fuzzyRoundedBox(vec2 q,vec2 halfSize,float r){
  vec2 b=abs(q)-halfSize;
  return length(max(b,0.0))+min(max(b.x,b.y),0.0)-r;
}
float fuzzyShape(vec2 q,float kind) {
  float angle=atan(q.y,q.x);
  if(kind<0.5)return length(q)-0.86-0.10*cos(6.0*angle+0.45); // cloud
  if(kind<1.5)return length(q*vec2(1.0,1.04))-0.90; // round puff
  if(kind<2.5)return fuzzyRoundedBox(q,vec2(0.65),0.22);
  if(kind<3.5)return length(vec2(q.x,max(abs(q.y)-0.24,0.0)))-0.70;
  if(kind<4.5){ // softly rounded upright triangle
    vec2 b=q;
    float r=0.67,k=1.7320508;
    b.x=abs(b.x)-r;
    b.y+=r/k;
    if(b.x+k*b.y>0.0)b=vec2(b.x-k*b.y,-k*b.x-b.y)*0.5;
    b.x-=clamp(b.x,-2.0*r,0.0);
    return -length(b)*sign(b.y)-0.16;
  }
  if(kind<5.5){ // lobed heart, including the notch and pointed lower half
    vec2 h=q*1.08+vec2(0.0,0.08);
    float a=dot(h,h)-0.82;
    float f=a*a*a-h.x*h.x*h.y*h.y*h.y;
    vec2 grad=vec2(6.0*h.x*a*a-2.0*h.x*h.y*h.y*h.y,
                   6.0*h.y*a*a-3.0*h.x*h.x*h.y*h.y);
    return clamp(f/max(0.35,length(grad)),-0.75,0.6);
  }
  if(kind<6.5){ // frog head with two separate eye bumps
    float body=length(q*vec2(1.0,1.28))-0.79;
    float bumps=min(length(q-vec2(-0.43,0.60)),length(q-vec2(0.43,0.60)))-0.29;
    return min(body,bumps);
  }
  if(kind<7.5)return abs(length(q)-0.62)-0.22; // ring with a real hole
  if(kind<8.5)return length(q)-0.75-0.14*cos(7.0*angle); // flower
  if(kind<9.5)return max(length(q)-0.88,0.76-length(q-vec2(0.37,0.13))); // crescent
  if(kind<10.5){ // rounded diamond
    vec2 b=mat2(0.7071,-0.7071,0.7071,0.7071)*q;
    return fuzzyRoundedBox(b,vec2(0.50),0.16);
  }
  // Peanut: two soft lobes and a visibly narrower waist.
  float a=length(q-vec2(-0.39,0.05))-0.54;
  float b=length(q-vec2(0.39,-0.05))-0.54;
  float h=clamp(0.5+0.5*(b-a)/0.20,0.0,1.0);
  return mix(b,a,h)-0.20*h*(1.0-h);
}

vec3 fuzzyNormal(vec2 q,float kind){
  float d=fuzzyShape(q,kind);
  vec2 g=vec2(fuzzyShape(q+vec2(0.006,0.0),kind)-d,
              fuzzyShape(q+vec2(0.0,0.006),kind)-d)/0.006;
  float depth=exp(min(d,-0.015)*3.4);
  float height=sqrt(max(0.02,1.0-depth));
  return normalize(vec3(g*depth*0.62/height,1.0));
}
vec3 fuzzyLight(vec2 q,vec3 dye,float kind) {
  vec3 n=fuzzyNormal(q,kind);
  vec3 keyDir=normalize(vec3(-0.55,0.75,1.0));
  float key=max(0.0,dot(n,keyDir));
  float fill=max(0.0,dot(n,normalize(vec3(0.7,-0.1,0.5))));
  float rim=pow(1.0-n.z,2.0)*smoothstep(-0.2,0.6,q.x+q.y);
  float softSpec=pow(max(0.0,dot(n,normalize(keyDir+vec3(0.0,0.0,1.0)))),18.0);
  return dye*(0.50+0.52*key*p_light+0.17*fill)
       +FUZZ_WHITE*(0.08*softSpec+0.13*rim)*p_light;
}

// Rounded, overlapping tufts with height-derived normals and dark crevices.
vec4 fuzzyTufts(vec2 q,float seed,float t){
  float cell=0.065;
  vec2 coord=q/cell+vec2(0.005*sin(t*0.4+seed),seed);
  vec2 grid=floor(coord);
  float height=0.0;
  vec2 slope=vec2(0.0);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 id=grid+vec2(float(i),float(j));
      float h=hash21(id+seed);
      vec2 center=id+vec2(0.18+0.64*h,0.18+0.64*hash21(id+27.7));
      vec2 r=coord-center;
      r.x+=0.20*r.y;
      float spread=3.4+1.8*h;
      float lump=(0.62+0.38*h)*exp(-dot(r,r)*spread);
      height+=lump;
      slope+=lump*(-2.0*spread)*vec2(r.x,r.y+0.20*r.x);
    }
  }
  return vec4(normalize(vec3(-slope*0.46,1.0)),clamp(height,0.0,1.0));
}
// Actual finite curling filaments, resampling the form's lighting at each root.
// Three fiber scales share the body's lighting; each strand adds cylindrical highlights.
vec4 fuzzyLayer(vec2 q,vec3 dye,vec3 formLight,float kind,float seed,float t,float cell,float curl) {
  vec2 grid=floor(q/cell);
  vec3 chosen=formLight*0.77;
  float best=100.0,coverage=0.0;
  float aa=max(0.003,0.65*length(fwidth(q))/cell);
  for(int j=-1;j<=1;j++){
    for(int i=-1;i<=1;i++){
      vec2 id=grid+vec2(float(i),float(j));
      float h=hash21(id+seed*21.3);
      vec2 root=(id+vec2(0.12+0.76*h,0.12+0.76*hash21(id+seed+17.1)))*cell;
      if(fuzzyShape(root,kind)>0.0)continue;
      float flow=-1.2+0.65*sin(root.x*3.1+root.y*4.8+seed);
      flow+=0.26*sin(t*0.45+root.y*5.0)+0.50*(h-0.5);
      vec2 dir=vec2(cos(flow),sin(flow));
      vec2 outward=normalize(root+vec2(0.0001));
      dir=normalize(mix(dir,outward,smoothstep(0.68,0.94,length(root))));
      vec2 rel=(q-root)/cell;
      vec3 rootColor=formLight*(0.83+0.25*h);
      for(int k=0;k<3;k++){
        float fk=float(k);
        float hk=hash21(id+vec2(fk*7.1,seed+43.8));
        float tilt=(hk-0.5)*0.65;
        vec2 tang=normalize(dir+vec2(-dir.y,dir.x)*tilt);
        vec2 side=vec2(-tang.y,tang.x);
        float along=dot(rel,tang)+fk*0.10;
        float len=0.85+0.60*hk+0.25*p_fuzz;
        float a=clamp(along,0.0,len);
        float bend=curl*((hk-0.5)*1.35*a*a+0.22*sin(a*6.4+hk*8.0));
        float crossFiber=dot(rel,side)-bend-(fk-1.0)*0.17;
        float end=along-a;
        float dist=length(vec2(crossFiber,end));
        float width=(0.013+0.014*hk)*(1.0-0.65*a/len);
        float mask=1.0-smoothstep(width,width+aa,dist);
        coverage=max(coverage,mask);
        if(dist<best){
          best=dist;
          float roundLight=sqrt(max(0.0,1.0-pow(clamp(crossFiber/max(width+aa,0.001),-1.0,1.0),2.0)));
          
          float sideCoord=clamp(crossFiber/max(width+aa*0.28,0.001),-1.0,1.0);
          vec3 cylinder=normalize(vec3(side*sideCoord,roundLight));
          vec3 lightDir=normalize(vec3(-0.55,0.75,1.0));
          float diffuse=max(0.0,dot(cylinder,lightDir));
          float highlight=pow(max(0.0,dot(cylinder,normalize(lightDir+vec3(0.0,0.0,1.0)))),22.0);
          float tip=0.85+0.15*a/len;
          chosen=rootColor*(0.70+0.42*diffuse)*tip;
          chosen+=FUZZ_WHITE*(0.075*highlight+0.018*roundLight)*p_light;
          chosen+=dye*0.045*(1.0-diffuse);
        }
      }
    }
  }
  return vec4(chosen,coverage);
}
vec4 fuzzyCoat(vec2 q,vec3 dye,float kind,float seed,float t){
  vec3 formLight=fuzzyLight(q,dye,kind);
  float fineCell=0.011;
  vec4 fine=fuzzyLayer(q,dye,formLight,kind,seed,t,fineCell,0.75);
  float cell=0.028+0.017*p_fuzz;
  vec4 loose=fuzzyLayer(q,dye,formLight,kind,seed+71.2,t*0.8,cell,1.15);
  vec4 shag=fuzzyLayer(q,dye,formLight,kind,seed+103.8,t*0.65,0.065+0.035*p_fuzz,0.80);


  vec4 tufts=fuzzyTufts(q,seed,t);
  vec3 formNormal=fuzzyNormal(q,kind);
  vec3 pileNormal=normalize(vec3(formNormal.xy+tufts.xy*0.68,formNormal.z*tufts.z));
  vec3 keyDir=normalize(vec3(-0.55,0.75,1.0));
  float pileLight=max(0.0,dot(pileNormal,keyDir));
  float crevice=mix(0.85,1.0,smoothstep(0.15,0.82,tufts.w));
  float softSpec=pow(max(0.0,dot(pileNormal,normalize(keyDir+vec3(0.0,0.0,1.0)))),16.0);
  vec3 base=dye*(0.52+0.55*pileLight*p_light)*crevice;
  base+=FUZZ_WHITE*0.038*softSpec*p_light;
  vec3 col=mix(base,fine.rgb*crevice,fine.a*0.55);
  col=mix(col,loose.rgb*(0.88+0.12*tufts.w),loose.a*0.72);
  col=mix(col,shag.rgb,shag.a*0.84);
  return vec4(col,max(shag.a,max(fine.a,loose.a)));
}
vec3 fuzzyEye(vec3 col,vec2 q,vec2 center,float blink){
  vec2 e=(q-center)/vec2(0.070,0.105*blink);
  float d=length(e);
  float mask=1.0-smoothstep(0.95,1.05,d);
  float h=sqrt(max(0.0,1.0-dot(e,e)));
  vec3 c=FUZZ_INK*0.65+vec3(0.045)*pow(h,3.0);
  vec2 gl=(e-vec2(-0.30,0.42))*vec2(3.5,4.0);
  c+=FUZZ_WHITE*0.90*exp(-dot(gl,gl));
  return mix(col,c,mask);
}
vec3 fuzzyBuddy(vec3 background,vec2 q,vec3 dye,float kind,float seed,float t,float waiting,float ruffle,bool accessory){
  if(abs(q.x)>1.52||abs(q.y)>1.65)return background;
  float zoom=0.65*exp(log(80.0/0.65)*clamp((p_size-0.65)/79.35,0.0,1.0));
  float life=0.8*clamp(p_drift,0.0,1.8)*(1.0-smoothstep(2.0,8.0,zoom));
  // Each pose has its own phase and rhythm; the macro coat stays steady.
  float breath=sin(t*(0.58+0.07*hash21(vec2(seed,4.1)))+seed*2.6);
  float tilt=0.022*life*sin(t*(0.25+0.04*hash21(vec2(seed,9.2)))+seed*1.8);
  q.y-=0.014*life*sin(t*0.43+seed*3.7);
  q=mat2(cos(tilt),-sin(tilt),sin(tilt),cos(tilt))*q;
  q/=vec2(1.0-0.010*life*breath,1.0+0.021*life*breath);
  q.x+=0.012*life*sin(t*0.6+seed)*q.y+0.009*ruffle*sin(q.y*6.0-t);
  float d=fuzzyShape(q,kind);
  float edge=max(0.002,0.65*length(fwidth(q)));
  vec3 col=background;
  if(d<0.30){
    vec4 coat=fuzzyCoat(q,dye,kind,seed,t);
    float mask=1.0-smoothstep(-edge,edge,d);
    mask=max(mask,coat.a*0.95*(1.0-smoothstep(0.13,0.28,d)));
    mask*=1.0-smoothstep(1.38,1.52,abs(q.x));
    mask*=1.0-smoothstep(1.49,1.65,abs(q.y));
    vec3 body=coat.rgb;
    body+=FUZZ_WHITE*waiting*0.07*(0.5+0.5*sin(t*1.7+seed));
    float blinkPeriod=6.5+3.7*hash21(vec2(seed,16.4));
    float blinkClock=mod(t+seed*7.3,blinkPeriod);
    float blink=1.0-0.94*min(1.0,p_drift)*exp(-pow((blinkClock-blinkPeriod+0.60)/0.085,2.0));
    float glance=sin(t*0.29+seed*1.9);
    float curiosity=sign(glance)*smoothstep(0.50,0.94,abs(glance));
    vec2 look=life*vec2(0.058*curiosity,0.022*sin(t*0.21+seed));
    look+=vec2(0.006*sin(t*0.47+seed),0.0)*min(1.0,p_drift);

    vec2 eyeA=vec2(-0.25,0.24),eyeB=vec2(0.25,0.24);
    if(kind>5.5&&kind<6.5){
      eyeA=vec2(-0.43,0.60); eyeB=vec2(0.43,0.60);
      float whiteEyes=max(1.0-smoothstep(0.15,0.18,length(q-eyeA)),
                         1.0-smoothstep(0.15,0.18,length(q-eyeB)));
      body=mix(body,FUZZ_WHITE,whiteEyes);
    }
    if(kind>6.5&&kind<7.5){eyeA=vec2(-0.23,0.56);eyeB=vec2(0.23,0.56);}
    if(kind>8.5&&kind<9.5){eyeA=vec2(-0.59,0.32);eyeB=vec2(-0.61,-0.04);}
    body=fuzzyEye(body,q,eyeA+look,blink);
    body=fuzzyEye(body,q,eyeB+look,blink);
    if(accessory&&((kind>1.5&&kind<2.5)||(kind>3.5&&kind<4.5))){
      // Alfred's round glasses, also available on the squircle.
      float g1=abs(length((q-vec2(-0.25,0.24))/vec2(0.15,0.16))-1.0)*0.15;
      float g2=abs(length((q-vec2(0.25,0.24))/vec2(0.15,0.16))-1.0)*0.15;
      float bridge=max(abs(q.y-0.26)-0.012,abs(q.x)-0.10);
      float gd=min(min(g1,g2)-0.012,bridge);
      body=mix(body,FUZZ_INK*1.4,1.0-smoothstep(-edge,edge,gd));
    }
    col=mix(col,body,mask);
  }
  if(accessory&&kind<0.5){
    // Periwinkle cloud keeps its fuzzy black beret.
    vec2 h=q-vec2(-0.025,0.87);
    h=mat2(0.992,-0.126,0.126,0.992)*h;
    vec2 b=h/vec2(0.75,0.27);
    float hd=pow(pow(abs(b.x),3.0)+pow(abs(b.y),3.0),1.0/3.0)-1.0;
    float cap=1.0-smoothstep(-edge,edge+0.025,hd);
    vec3 hc=FUZZ_INK*(0.65+0.55*smoothstep(-0.25,0.23,h.y-h.x));
    hc*=0.90+0.15*noise(h*vec2(140.0,60.0));
    col=mix(col,hc,cap);
  }
  if(accessory&&kind>0.5&&kind<1.5){
    // A cream headband distinguishes the peach round puff.
    float band=max(abs(q.y-0.66)-0.047,abs(q.x)-0.68);
    float bm=1.0-smoothstep(-edge,edge,band);
    col=mix(col,FUZZ_WHITE*0.96,bm);
  }

  if(accessory&&kind>4.5&&kind<5.5){
    // Iggy-inspired padded headphones: crown arc and two glossy ear cups.
    vec2 h=q-vec2(0.0,0.12);
    float arc=abs(length(h/vec2(0.91,0.94))-1.0)*0.90;
    float am=(1.0-smoothstep(0.024,0.04,arc))*smoothstep(0.1,0.18,h.y);
    col=mix(col,FUZZ_INK,am);
    for(int k=0;k<2;k++){
      vec2 e=q-vec2(k==0?-0.84:0.84,0.10);
      float cup=length(e/vec2(0.12,0.24));
      vec3 c=FUZZ_INK*(0.65+0.4*smoothstep(-0.10,0.10,-e.x+e.y));
      col=mix(col,c,1.0-smoothstep(0.94,1.04,cup));
    }
  }
  if(accessory&&((kind>3.5&&kind<4.5)||(kind>5.5&&kind<6.5))){
    // Bow tie for the scholar triangle and frog.
    vec2 b=q-vec2(0.0,-0.54);
    float tie=max(abs(b.x)-0.22,abs(b.y)-0.045-0.40*abs(b.x));
    col=mix(col,FUZZ_INK,1.0-smoothstep(-edge,edge,tie));
  }
  return col;
}
vec2 fuzzyPosition(int i,float t){
  float fi=float(i);
  vec2 pos;
  if(i==0)pos=vec2(0.52,0.22);
  else if(i==1)pos=vec2(0.08,0.33);
  else if(i==2)pos=vec2(0.91,0.35);
  else if(i==3)pos=vec2(0.75,0.79);
  else if(i==4)pos=vec2(0.28,0.77);
  else if(i==5)pos=vec2(0.15,0.08);
  else if(i==6)pos=vec2(0.88,0.07);
  else if(i==7)pos=vec2(0.52,0.57);
  else if(i==8)pos=vec2(0.10,0.62);
  else if(i==9)pos=vec2(0.90,0.66);
  else if(i==10)pos=vec2(0.53,0.87);
  else pos=vec2(0.71,0.30);
  pos+=vec2(0.014*sin(t*(0.14+fi*0.013)+fi*1.7),0.010*cos(t*(0.18+fi*0.015)+fi*2.1));
  return toP(pos);
}
float fuzzyRadius(int i){
  if(i==0)return 0.145;
  if(i==1||i==2)return 0.115;
  if(i==3||i==4)return 0.079;
  if(i==5||i==6)return 0.132;
  return 0.093;
}
vec3 scene(vec2 uv,vec2 p){
  float t=u_time*p_drift;
  float zoom=0.65*exp(log(80.0/0.65)*clamp((p_size-0.65)/79.35,0.0,1.0));
  // Continuous camera zoom into the blue cloud's belly: the face leaves
  // the frame geometrically, so at high zoom the real coat fills the screen.
  vec2 focus=fuzzyPosition(0,t)+vec2(-0.12,-0.37)*fuzzyRadius(0);
  vec2 world=p/zoom+focus*(1.0-0.65/zoom);
  float mist=0.5+0.5*sin(p.x*2.0+t*0.07)*cos(p.y*2.7-t*0.10);
  vec3 col=mix(vec3(0.965,0.945,0.915),vec3(0.91,0.945,0.99),mist);
  float done=0.0,err=0.0,ruffle=0.0;
  for(int i=0;i<12;i++){
    if(i>=u_rippleCount)break;
    vec4 r=u_ripples[i];
    float dist=length(p-toP(r.xy));
    float wave=exp(-pow((dist-r.z*0.25)*11.0,2.0))*exp(-r.z*0.7);
    ruffle+=wave;
    if(abs(r.w-1.0)<0.5)err+=wave;else done+=wave;
  }
  vec2 dp=p-toP(u_pointer);
  float touch=exp(-dot(dp,dp)/0.035);
  // Draw the nearest cloud last, so zoom keeps one continuous physical surface.
  for(int k=0;k<12;k++){
    int i=k==11?0:k+1;
    if(float(i)>=p_crowd)continue;
    float fi=float(i);
    vec2 center=fuzzyPosition(i,t);
    float radius=fuzzyRadius(i);
    vec2 q=(world-center)/radius;

    vec3 dye=u_palette[i%4];
    if(i==4)dye=mix(u_palette[1],vec3(1.0,0.82,0.24),0.67);
    if(i==5)dye=mix(u_palette[3],vec3(1.0,0.48,0.67),0.67);
    if(i==6)dye=mix(u_palette[2],vec3(0.70,0.91,0.24),0.62);
    dye=mix(dye,vec3(0.94,0.34,0.40),clamp(err*0.40,0.0,0.5));
    if(abs(q.x)<1.8&&abs(q.y)<1.8){
      float sd=fuzzyShape(q-vec2(0.075,-0.115),fi);
      float shade=exp(-max(0.0,sd)*max(0.0,sd)*24.0);
      col*=1.0-shade*0.14;
    }
    col=fuzzyBuddy(col,q,dye,fi,fi*1.31+0.6,t,0.0,ruffle+touch,i<7);
  }
  for(int i=0;i<16;i++){
    if(i>=u_agentCount||zoom>=12.0)break;
    vec4 a=u_agents[i];
    a.w*=1.0-smoothstep(4.0,12.0,zoom);
    float fi=float(i);
    vec2 center=toP(a.xy)+vec2(0.010*sin(t*0.5+fi),0.012*cos(t*0.6+fi));
    vec2 q=(world-center)/(0.077*max(a.w,0.001));
    vec3 dye=mix(u_palette[i%4],FUZZ_WHITE,0.08);
    dye=mix(dye,vec3(0.94,0.34,0.40),clamp(err*0.4,0.0,0.5));
    vec3 painted=fuzzyBuddy(col,q,dye,mod(fi*5.0+4.0,12.0),fi+31.2,t,step(0.5,a.z),ruffle+touch,false);
    col=mix(col,painted,a.w);
  }
  col=mix(col,FUZZ_WHITE,clamp(done*0.055,0.0,0.09));
  return mix(u_canvas,col,p_color);
}`,Cu={id:"fuzzy-dots",name:"Fuzzy Dots",source:bd,palette:["#9ac2fb","#f6b582","#92cbb0","#c3a0e1"],params:[g("size","Zoom",.65,80,.65),g("fuzz","Fiber length",.2,2,.2),g("drift","Drift",0,3,1),g("crowd","Companions",2,12,12,1),g("light","Soft light",.4,1.6,1.28),g("color","Color strength",0,1,.97)]};var yd=`// a translucent moon jelly: lit dome, glowing gonads, frilled margin, oral arms, long tentacles
vec4 jelly(vec2 p, vec2 c, float R, float ph, float tilt, float blur, vec3 glowC, float trail) {
  vec2 q = p - c;
  float ca = cos(tilt), sa = sin(tilt);
  q = vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y);
  float L = R * 5.0 * trail;
  if (q.y > R * 1.3 || q.y < -L - R || abs(q.x) > R * 2.2) return vec4(0.0);
  float pulse = 0.5 + 0.5 * sin(ph);
  float w = R * (1.08 - 0.16 * pulse);
  float h = R * (0.72 + 0.18 * pulse);
  vec2 b = q / vec2(w, h);
  float under = -0.2 + 0.28 * b.x * b.x;
  float d = b.y > 0.0 ? length(b) - 1.0 : abs(b.x) - 1.0;
  d = max(d, under - b.y);
  float aa = 0.04 + blur * 6.0;
  float bell = smoothstep(aa, -aa, d);
  float rim = smoothstep(-0.4, 0.0, d) * bell;
  vec2 g = b - vec2(0.0, 0.3);
  float ga = atan(g.y, g.x);
  float gon = smoothstep(1.0, 0.45, length(g) / (0.3 * (0.55 + 0.45 * abs(cos(ga * 2.0))))) * bell;
  float veins = smoothstep(0.8, 1.0, cos(atan(b.x, b.y + 0.3) * 16.0)) * bell * (1.0 - gon) * 0.5;
  float sheen = exp(-dot(b - vec2(-0.4, 0.55), b - vec2(-0.4, 0.55)) / 0.035) * bell;
  float frill = smoothstep(0.1 + aa, 0.0, abs(b.y - under + 0.04 * sin(b.x * 28.0 + ph * 2.0))) * smoothstep(1.15, 0.95, abs(b.x));

  float base = under * h;
  float lines = 0.0;
  if (q.y < base && abs(q.x) < w * 1.4) {
    float k = clamp((base - q.y) / L, 0.0, 1.0);
    for (int i = 0; i < 5; i++) {
      float fi = float(i) - 2.0;
      float x0 = fi / 2.0 * w * 0.9;
      float x = x0 * (1.0 - 0.25 * k) + R * 0.35 * k * sin(k * 5.0 - ph * 0.7 + fi * 1.3);
      float wd = R * 0.025 * (1.0 - 0.6 * k) + blur;
      lines = max(lines, smoothstep(wd, 0.0, abs(q.x - x)) * (1.0 - k) * (0.6 + 0.4 * sin(k * 40.0 + fi)));
    }
    float ka = clamp((base - q.y) / (L * 0.55), 0.0, 1.0);
    for (int i = 0; i < 2; i++) {
      float s = i == 0 ? -1.0 : 1.0;
      float x = s * R * 0.12 + R * 0.25 * ka * sin(ka * 4.0 - ph * 0.5 + s);
      float wd = R * (0.13 * (1.0 - ka) + 0.03) * (0.8 + 0.3 * sin(ka * 60.0 + s * 2.0)) + blur;
      lines = max(lines, smoothstep(wd, wd * 0.4, abs(q.x - x)) * (1.0 - ka) * 0.85);
    }
  }
  float a = clamp(bell * 0.35 + rim * 0.5 + gon * 0.7 + frill * 0.8 + lines * 0.7 + veins, 0.0, 1.0);
  vec3 col = glowC * (bell * 0.25 + rim * 0.75 + gon * 1.1 + frill + lines * 0.8 + veins) + vec3(1.0) * sheen * 0.6;
  return vec4(col, a);
}

// A sea anemone from the side: a smooth fleshy column on a flared foot, crowned by soft wavy
// tentacles rooted across the oral disc in a shaded back row and a lit front row, swaying
// together in the current. Some sit closed as a glossy mound. Returns premultiplied rgb and alpha.
vec4 anemone(vec2 q, vec2 b, float S, float t, float seed, vec3 body, vec3 tip, vec3 water) {
  vec2 l = (q - b) / S;
  if (abs(l.x) > 1.7 || l.y < -0.08 || l.y > 1.9) return vec4(0.0);
  float aa = 1.5 / (u_resolution.y * S);
  vec3 ld = normalize(vec3(-0.35, 0.65, 0.7));

  if (hash21(vec2(seed, 3.7)) < 0.2) {
    vec2 dd = (l - vec2(0.0, -0.02)) / vec2(0.52, 0.46);
    float dl = length(dd);
    float m = smoothstep(1.0 + aa * 2.5, 1.0 - aa * 2.5, dl) * step(0.0, l.y + 0.02);
    vec3 n = vec3(dd, sqrt(max(1.0 - dl * dl, 0.0)));
    float dif = max(dot(n, ld), 0.0);
    vec2 vg = dd * 7.0;
    float bump = smoothstep(0.22, 0.1, length(fract(vg + vec2(0.5 * floor(vg.y), 0.0)) - 0.5)) * n.z;
    vec3 c = body * (0.3 + 0.75 * dif) * (0.94 + 0.06 * noise(dd * 9.0)) + mix(body, tip, 0.4) * 0.05 * bump;
    c += vec3(1.0) * 0.25 * pow(max(dot(reflect(-ld, n), vec3(0.0, 0.0, 1.0)), 0.0), 18.0);
    return vec4(c * m, m);
  }

  vec3 colP = vec3(0.0);
  float alpha = 0.0;
  float Hc = 0.34;
  float hy = clamp(l.y / Hc, 0.0, 1.0);
  float hw = 0.32 + 0.16 * smoothstep(0.45, 1.0, hy) + 0.06 * exp(-max(l.y, 0.0) * 18.0);
  float cd = max(abs(l.x) - hw, max(-l.y, l.y - Hc));
  float cm = smoothstep(aa, -aa, cd);
  if (cm > 0.0) {
    float nx = clamp(l.x / hw, -0.999, 0.999);
    vec3 n = vec3(nx, 0.0, sqrt(1.0 - nx * nx));
    float dif = max(dot(n, ld), 0.0);
    vec3 cc = body * (0.28 + 0.6 * dif) * (0.97 + 0.03 * sin(asin(nx) * 20.0));
    cc *= 1.0 - 0.3 * smoothstep(0.65, 1.0, hy);
    colP = cc * cm;
    alpha = cm;
  }

  float sway = 0.16 * sin(t * 0.55 + b.x * 3.0) + 0.05 * sin(t * 1.3 + seed * 7.0);
  for (int layer = 0; layer < 2; layer++) {
    float front = float(layer);
    for (int i = 0; i < 22; i++) {
      float fi = float(i) * 2.0 + front;
      // cheap reach test before the hashes: no tentacle is longer than ~1, rooted along the disc
      float u0 = (fi + 0.5) / 44.0 * 2.0 - 1.0;
      if (length(l - vec2(u0 * 0.46, Hc)) > 1.15) continue;
      float h1 = hash21(vec2(fi, seed * 17.0 + 1.0));
      float h2 = hash21(vec2(fi, seed * 17.0 + 2.0));
      float h3 = hash21(vec2(fi, seed * 17.0 + 3.0));
      float u = u0 + (h1 - 0.5) * 0.05;
      vec2 root = vec2(u * 0.46, Hc - 0.04 + 0.09 * (1.0 - u * u) * front);
      float L = (0.6 + 0.3 * h3) * (1.0 - 0.3 * u * u) * mix(1.05, 0.9, front);
      if (length(l - root) > L + 0.1) continue;
      float ang = u * 0.8 + (h2 - 0.5) * 0.3;
      vec2 dir = vec2(sin(ang), cos(ang));
      vec2 nrm = vec2(dir.y, -dir.x);
      float curl = (0.08 + 0.22 * abs(u)) * (u < 0.0 ? -1.0 : 1.0) + (h1 - 0.5) * 0.25;
      float ph = t * 1.1 + fi * 0.7 + seed * 5.0;
      float best = 1e3, bs = 0.0;
      vec2 p0 = root;
      for (int sg = 1; sg <= 4; sg++) {
        float s = float(sg) / 4.0;
        vec2 p1 = root + L * (dir * s + nrm * (curl * s * s + 0.11 * sin(s * 5.0 - ph) * s)) + vec2(sway * s * s * L, 0.0);
        vec2 pa = l - p0, ba = p1 - p0;
        float hh = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
        float dd = length(pa - ba * hh);
        if (dd < best) { best = dd; bs = (float(sg) - 1.0 + hh) / 4.0; }
        p0 = p1;
      }
      float w = mix(0.075, 0.01, pow(bs, 0.8));
      float m = smoothstep(aa, -aa, best - w);
      if (m <= 0.0) continue;
      float across = clamp(1.0 - (best / w) * (best / w), 0.0, 1.0);
      vec3 tc = mix(body * 0.55, mix(body, tip, 0.2), sqrt(across));
      tc = mix(tc, tip, smoothstep(0.5, 1.0, bs) * 0.45);
      tc *= (0.82 + 0.18 * clamp(dir.y, 0.0, 1.0)) * mix(0.62, 1.0, front);
      float ta = m * mix(0.97, 0.85, bs);
      colP = tc * ta + colP * (1.0 - ta);
      alpha = ta + alpha * (1.0 - ta);
    }
  }
  return vec4(colP, alpha);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  float ax = u_resolution.x / u_resolution.y;
  vec3 deep = u_palette[0];
  vec3 cyan = u_palette[1];
  vec3 coral = u_palette[2];
  vec3 pale = u_palette[3];

  vec2 dp = p - toP(u_pointer);
  float pd = exp(-dot(dp, dp) / 0.012);
  vec2 q = p + dp * pd * 0.25;

  // water column: sunlit surface above, deepening navy below
  vec3 col = mix(deep * 0.55, mix(deep, cyan, 0.4), smoothstep(-0.05, 1.05, uv.y));
  float sh = fbm(vec2(q.x * 3.0 + t * 0.05, q.y * 2.0 - t * 0.04));
  col = mix(col, mix(cyan, pale, 0.45), smoothstep(0.8, 1.0, uv.y) * (0.35 + 0.65 * sh));
  float cx = q.x * 9.0 + sh * 4.0, cy = q.y * 9.0 - sh * 3.0;
  float caus = pow(1.0 - abs(sin(cx + t * 0.6) * sin(cy - t * 0.5)), 18.0);
  col += mix(cyan, pale, 0.5) * caus * 0.07 * smoothstep(0.45, 1.0, uv.y);
  // shafts of light slanting down from the surface
  float rx = q.x + (0.5 - q.y) * 0.32;
  float rays = noise(vec2(rx * 6.0, t * 0.06)) * noise(vec2(rx * 13.0 + 3.0, t * 0.04 + 7.0));
  rays = smoothstep(0.12, 0.45, rays) * smoothstep(-0.45, 0.5, q.y);
  col += mix(cyan, pale, 0.55) * rays * 0.28 * p_rays;

  // marine snow at two depths
  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float sc = l == 0 ? 55.0 : 24.0;
    vec2 sg = q * sc + vec2(t * (0.3 + 0.4 * fl), -t * (0.6 + 0.8 * fl)) + fl * 13.0;
    vec2 id = floor(sg);
    float hs = hash21(id);
    vec2 o = vec2(hash21(id + 2.1), hash21(id + 4.7)) - 0.5;
    float sd = length(fract(sg) - 0.5 - o * 0.6);
    col += mix(pale, cyan, 0.4) * smoothstep(0.1 + 0.05 * fl, 0.0, sd) * step(1.0 - 0.25 * p_snow, hs) * (0.25 + 0.3 * fl);
  }

  // tidepool floor: dark rock lit along its rim, anemones swaying in the current
  float ry = -0.4 + 0.05 * noise(vec2(q.x * 3.5, 1.0)) + 0.03 * noise(vec2(q.x * 11.0, 2.0)) + 0.1 * (1.0 - p_rocks);
  if (q.y < ry + 0.17 && p_rocks > 0.0) {
    float rock = smoothstep(ry + 0.003, ry - 0.003, q.y);
    vec3 rc = mix(deep * 0.45, mix(deep, cyan, 0.25), smoothstep(0.03, 0.0, ry - q.y) * 0.7);
    rc *= 0.75 + 0.35 * noise(q * vec2(30.0, 18.0)) * noise(q * 7.0 + 4.0);
    col = mix(col, rc, rock);
    float cw = 0.17;
    vec3 water = mix(deep, cyan, 0.3);
    for (int j = -1; j <= 1; j++) {
      float ci = floor(q.x / cw) + float(j);
      float h = hash21(vec2(ci, 9.0));
      if (h < 1.0 - 0.8 * p_rocks) continue;
      float bx = (ci + 0.25 + 0.5 * hash21(vec2(ci, 3.0))) * cw;
      float by = -0.4 + 0.05 * noise(vec2(bx * 3.5, 1.0)) + 0.03 * noise(vec2(bx * 11.0, 2.0)) + 0.1 * (1.0 - p_rocks) - 0.006;
      float S = 0.045 + 0.04 * hash21(vec2(ci, 5.0));
      float v = hash21(vec2(ci, 12.0));
      vec3 body = v < 0.45 ? coral : (v < 0.75 ? mix(cyan, vec3(0.4, 0.8, 0.45), 0.55) : mix(coral, vec3(1.0, 0.6, 0.3), 0.5));
      vec3 tipC = v < 0.45 ? mix(coral, pale, 0.45) : (v < 0.75 ? mix(pale, vec3(0.75, 1.0, 0.8), 0.4) : pale);
      vec4 an = anemone(q, vec2(bx, by), S, t, fract(ci * 0.371), body, tipC, water);
      col = col * (1.0 - an.a) + an.rgb;
    }
  }

  // drifting jellies, deepest first; depth fades and softens them
  float n = floor(p_jellies + 0.5);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    if (fi >= n) break;
    float z = 0.85 - 0.75 * fi / max(n - 1.0, 1.0);
    float hx = fract(fi * 0.618 + 0.21);
    vec2 c = vec2((hx * 2.0 - 1.0) * 0.4 * ax + 0.06 * sin(t * 0.05 + fi * 2.0),
                  0.12 - 0.2 * fract(fi * 0.37 + 0.5) + 0.07 * sin(t * 0.04 + fi * 1.7));
    float ph = u_time * (0.9 + 0.3 * hash21(vec2(fi, 2.0))) + fi * 2.3;
    c.y += 0.012 * sin(ph - 0.8);
    float R = mix(0.135, 0.05, z) * p_size;
    vec3 gc = mix(mix(cyan, pale, 0.35), mix(coral, pale, 0.3), step(0.66, hash21(vec2(fi, 8.0))));
    vec2 jd = q - c;
    col += gc * exp(-dot(jd, jd) / (R * R * 3.0)) * 0.16 * p_glow * (1.0 - 0.5 * z);
    vec4 jl = jelly(q, c, R, ph, 0.25 * sin(t * 0.09 + fi * 2.0), z * 0.004 * p_depth, gc * p_glow, p_trail);
    vec3 jc = mix(jl.rgb, mix(deep, cyan, 0.3), z * 0.45 * p_depth);
    col = mix(col, col * 0.85 + jc, jl.a * (1.0 - 0.35 * z * p_depth));
  }

  // agents are small bright jellies; ones waiting on you pulse coral rings
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    float ph = u_time * mix(2.4, 1.2, waiting) + fi * 1.3;
    vec2 c0 = toP(a.xy) + vec2(0.006 * sin(u_time * 0.7 + fi), 0.01 * sin(ph - 0.8) * (1.0 - waiting));
    vec3 gc = mix(mix(cyan, pale, 0.3), coral, waiting);
    vec2 jd = q - c0;
    col += gc * exp(-dot(jd, jd) / 0.004) * 0.25 * a.w * p_glow;
    vec4 jl = jelly(q, c0, 0.03 * a.w, ph, 0.0, 0.0, gc * 1.2 * p_glow, 0.8);
    col = mix(col, col * 0.85 + jl.rgb, jl.a * a.w);
    if (waiting > 0.5) {
      float f = fract(u_time * 0.6 + fi * 0.3);
      col += coral * smoothstep(0.004, 0.0, abs(length(jd) - 0.035 - 0.08 * f)) * (1.0 - f) * 0.8 * a.w;
    }
  }

  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    float dist = length(q - toP(r.xy));
    float ring = exp(-pow((dist - r.z * 0.2) * 40.0, 2.0)) * exp(-r.z * 0.9);
    vec3 rc = r.w > 0.5 && r.w < 1.5 ? vec3(0.95, 0.22, 0.2) : (r.w > 1.5 ? pale : cyan);
    col = mix(col, rc, ring * 0.7);
  }

  col += cyan * pd * 0.08;
  return mix(u_canvas, col, p_color);
}`,ju={id:"jellyfish-tidepool",name:"Jellyfish Tidepool",source:yd,palette:["#06163a","#2fc9d8","#ff8466","#e6f7ff"],params:[g("drift","Current speed",0,3,1),g("jellies","Jellyfish",1,6,4,1),g("size","Jellyfish size",.5,1.8,1),g("trail","Tentacle length",.3,2,1),g("glow","Bioluminescence",0,2,1),g("depth","Depth haze",0,2,1),g("rays","Light shafts",0,2,1),g("snow","Marine snow",0,2,1),g("rocks","Tidepool floor",0,1,.8),g("color","Color strength",0,1,.92)]};var wd=`const vec3 LD = vec3(-0.4, 0.5, 0.77);
// 0 kohaku, 1 tancho, 2 sanke, 3 showa, 4 yamabuki ogon, 5 asagi, 6 orenji ogon
const int KINDS[9] = int[9](0, 3, 4, 1, 2, 5, 6, 0, 3);

float bodyHW(float u) {
  if (u > 0.15) { float k = (u - 0.15) / 0.85; return 0.29 * sqrt(max(1.0 - k * k, 0.0)); }
  float k = clamp((u + 0.72) / 0.87, 0.0, 1.0);
  return 0.075 + 0.215 * pow(sin(1.5708 * k), 1.2);
}

vec2 toLocal(vec2 p, vec2 c, float ang, float L) {
  vec2 q = p - c;
  float ca = cos(ang), sa = sin(ang);
  return vec2(ca * q.x + sa * q.y, -sa * q.x + ca * q.y) / L;
}

// a fan-shaped fin rooted at o, sweeping along d; x = coverage, y = along-fin 0..1, z = ray shading
vec3 finFan(vec2 l, vec2 o, vec2 d, float len, float wid, float aa) {
  vec2 r = l - o;
  float a = dot(r, d), b = dot(r, vec2(-d.y, d.x));
  float along = clamp(a / len, 0.0, 1.0);
  float e = length(vec2((a - len * 0.5) / (len * 0.5), b / (wid * (0.4 + 0.6 * along))));
  float m = smoothstep(1.0, 1.0 - aa / wid, e);
  return vec3(m, along, 0.78 + 0.22 * sin(atan(b, a + 0.03) * 30.0));
}

vec4 koi(vec2 p, vec2 c, float ang, float L, float ph, int kind, float seed) {
  vec2 l = toLocal(p, c, ang, L);
  if (dot(l, l) > 1.9) return vec4(0.0);
  float ca = cos(ang), sa = sin(ang);
  float u = l.x;
  float v = l.y - 0.09 * sin(2.4 * u - ph) * pow(max(1.0 - u, 0.0) * 0.5, 1.6);
  float aa = 2.5 / (u_resolution.y * L);
  float hw = bodyHW(u);
  float vn = clamp(v / max(hw, 1e-3), -1.0, 1.0);
  float body = smoothstep(0.0, aa, hw - abs(v)) * smoothstep(-0.76, -0.7, u);

  vec3 white = u_palette[2];
  vec3 red = u_palette[3];
  vec3 blk = vec3(0.05, 0.05, 0.06);
  vec3 gold = vec3(0.98, 0.74, 0.24);

  // forked caudal fin
  float tu = -(u + 0.66);
  float tw = 0.05 + max(tu, 0.0) * 0.6;
  float fin = step(0.0, tu) * smoothstep(0.0, aa, tw - abs(v)) * smoothstep(0.0, aa, 0.24 + 0.95 * abs(v) - tu) * smoothstep(0.0, aa, 0.56 - tu);
  float rays = fin * (0.78 + 0.22 * sin(v / (tu + 0.1) * 30.0));
  float finRoot = 0.0;
  // paired pectoral and pelvic fins, paddling out of phase
  for (int k = 0; k < 2; k++) {
    float s = k == 0 ? 1.0 : -1.0;
    float fa = 0.95 + 0.3 * sin(ph * 0.5 + s * 1.3);
    vec3 pf = finFan(vec2(u, v), vec2(0.45, s * 0.2), vec2(-cos(fa), s * sin(fa)), 0.32, 0.12, aa);
    float fb = 0.7 + 0.15 * sin(ph * 0.5 + s);
    vec3 vf = finFan(vec2(u, v), vec2(-0.22, s * 0.13), vec2(-cos(fb), s * sin(fb)), 0.17, 0.06, aa);
    fin = max(fin, max(pf.x, vf.x));
    rays = max(rays, max(pf.x * pf.z, vf.x * vf.z));
    finRoot = max(finRoot, pf.x * smoothstep(0.55, 0.1, pf.y));
  }
  float dorsal = smoothstep(0.03, 0.03 - aa, abs(v - 0.02 * sin(ph))) * smoothstep(-0.5, -0.4, u) * smoothstep(0.2, 0.12, u);

  // variety pattern, laid out on the unbent body
  float n1 = noise(vec2(u * 2.3 + seed * 13.0, vn * 1.2 + seed * 7.0));
  float n2 = noise(vec2(u * 4.5 + seed * 5.0, vn * 2.2 - seed * 3.0));
  float back = smoothstep(0.95, 0.75, abs(vn));
  float hi = smoothstep(0.47, 0.5, n1 + 0.22 * smoothstep(0.55, 0.8, u) - 0.12 * smoothstep(0.0, -0.5, u))
    * back * smoothstep(-0.5, -0.4, u) * smoothstep(0.97, 0.9, u);
  vec3 base = white;
  vec3 finC = white;
  float metal = 0.0;
  float net = 0.12;
  if (kind == 0) {
    base = mix(white, red, hi);
  } else if (kind == 1) {
    base = mix(white, red, smoothstep(0.11, 0.1, length(vec2(u - 0.68, v * 1.1))));
  } else if (kind == 2) {
    base = mix(mix(white, red, hi), blk, smoothstep(0.64, 0.67, n2) * smoothstep(0.55, 0.4, u) * back);
  } else if (kind == 3) {
    base = mix(mix(blk, white, smoothstep(0.52, 0.55, n2)), red, hi);
    finC = mix(white, blk, finRoot);
  } else if (kind == 4) {
    base = gold; finC = gold; metal = 1.0;
  } else if (kind == 5) {
    base = mix(vec3(0.4, 0.52, 0.62), mix(red, gold, 0.3), smoothstep(0.6, 0.85, abs(vn)));
    base = mix(base, vec3(0.86, 0.88, 0.87), smoothstep(0.62, 0.85, u));
    finC = mix(white, red, 0.55 * finRoot + 0.2);
    net = 0.35;
  } else {
    base = mix(red, gold, 0.5); finC = base; metal = 0.75;
  }

  // scales: offset rows of crescents on the trunk; the head is bare
  vec2 sg = vec2(u * 12.0, v * 12.0);
  sg.y += 0.5 * mod(floor(sg.x), 2.0);
  float sd = length(vec2(fract(sg.x), fract(sg.y) - 0.5));
  float scale = smoothstep(0.5, 0.62, sd) * smoothstep(0.85, 0.7, sd) * smoothstep(0.6, 0.45, u) * smoothstep(-0.72, -0.6, u);
  base *= 1.0 - net * scale;

  // rounded body: a normal from the cross-section, rolling off at snout and tail
  float nz = sqrt(max(1.0 - vn * vn, 0.0));
  float nx = 0.8 * smoothstep(0.6, 1.0, u) - 0.3 * smoothstep(0.0, -0.7, u);
  vec3 n = normalize(vec3(nx * nz, vn, nz * 1.2 + 0.05));
  vec3 nw = vec3(ca * n.x - sa * n.y, sa * n.x + ca * n.y, n.z);
  vec3 ld = normalize(LD);
  float dif = max(dot(nw, ld), 0.0);
  float spec = pow(max(dot(nw, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), mix(44.0, 18.0, metal));
  vec3 bc = base * (0.3 + 0.82 * dif) * (0.55 + 0.45 * nz);
  bc += mix(vec3(1.0), base, metal * 0.6) * spec * mix(0.5, 1.0, metal) * (1.0 - 0.5 * scale);
  bc *= 1.0 - 0.3 * smoothstep(0.03, 0.0, abs(u - 0.6 + 0.12 * vn * vn)) * nz;
  float eye = smoothstep(0.045, 0.03, length(vec2(u - 0.8, abs(v) - hw * 0.8)));
  bc = mix(bc, vec3(0.04), eye);
  vec3 dc = mix(finC, base, 0.4) * (0.5 + 0.6 * dif);
  bc = mix(bc, dc, dorsal * 0.7 * body);

  vec3 col = finC * (0.62 + 0.4 * rays / max(fin, 1e-3));
  col = mix(col, bc, body);
  return vec4(col, max(fin * 0.6, body));
}

// the shadow a fish throws on the pond floor, softer the higher it swims
float koiShadow(vec2 p, vec2 c, float ang, float L, float blur) {
  vec2 l = toLocal(p, c, ang, L);
  if (dot(l, l) > 2.6) return 0.0;
  float k = 1.0 + 1.5 * blur;
  float s = exp(-(pow((l.x - 0.05) / 0.85, 2.0) + pow(l.y / 0.24, 2.0)) * 3.0 / k);
  s = max(s, 0.6 * exp(-(pow(l.x - 0.35, 2.0) / 0.02 + l.y * l.y / 0.12) / k));
  s = max(s, 0.6 * exp(-(pow(l.x + 0.92, 2.0) / 0.03 + l.y * l.y / 0.05) / k));
  return s;
}

void fishAt(int i, float t, float ax, out vec2 c, out float ang, out float L, out float dep, out float ph) {
  float fi = float(i);
  float h1 = hash21(vec2(fi, 3.1)), h2 = hash21(vec2(fi, 7.7)), h3 = hash21(vec2(fi, 11.3)), h4 = hash21(vec2(fi, 17.9));
  float T = t * p_swim;
  float w1 = 0.06 + 0.04 * h3, w2 = 0.1 + 0.05 * h4;
  float A = 0.46 * ax, B = 0.36;
  float a1 = T * w1 + 6.2832 * h1, a2 = T * w2 + 6.2832 * h2;
  c = vec2(A * sin(a1), B * sin(a2));
  vec2 vel = vec2(A * w1 * cos(a1), B * w2 * cos(a2));
  if (h1 < 0.5) { c.x = -c.x; vel.x = -vel.x; }
  ang = atan(vel.y, vel.x);
  dep = 0.85 - 0.75 * fi / max(p_count - 1.0, 1.0);
  L = (0.095 + 0.035 * h2) * p_size * (1.0 - 0.2 * dep);
  ph = u_time * (2.0 + 2.0 * min(p_swim, 2.0)) + h1 * 20.0;
}

// lily pads and lotus floating on the surface; grow > 1 gives the soft shadow footprint
vec4 pads(vec2 p, float t, float grow) {
  vec4 outC = vec4(0.0);
  vec3 ld = normalize(LD);
  for (int l = 0; l < 2; l++) {
    float lane = l == 0 ? 0.43 : -0.45;
    if (abs(p.y - lane) > 0.2) continue;
    float cw = 0.26;
    float px = p.x + t * (l == 0 ? 0.006 : -0.005);
    for (int j = -1; j <= 1; j++) {
      float ci = floor(px / cw) + float(j);
      float h = hash21(vec2(ci, float(l) * 5.0 + 2.0));
      if (h < 1.0 - 0.7 * p_pads) continue;
      float h2 = hash21(vec2(ci, 31.0 + float(l)));
      float h3 = hash21(vec2(ci, 47.0 + float(l)));
      vec2 cc = vec2((ci + 0.5 + 0.5 * (h2 - 0.5)) * cw, lane + 0.06 * (h3 - 0.5));
      vec2 d = vec2(px, p.y) - cc;
      float dist = length(d);
      float r = (0.05 + 0.04 * h2) * grow;
      float a = atan(d.y, d.x);
      float notch = smoothstep(0.1, 0.18, abs(mod(a - h * 6.2832 + 3.1416, 6.2832) - 3.1416));
      float m = smoothstep(r, r - 0.003 * grow * grow, dist) * notch;
      if (grow > 1.0) { outC.a = max(outC.a, m); continue; }
      float rim = smoothstep(0.75 * r, r, dist);
      vec3 n = normalize(vec3(-d / max(dist, 1e-4) * rim * 0.9, 1.0));
      float lit = 0.5 + 0.65 * max(dot(n, ld), 0.0);
      float vein = smoothstep(0.9, 1.0, cos(a * 11.0 + h * 5.0)) * smoothstep(0.1 * r, 0.6 * r, dist);
      vec3 green = mix(vec3(0.14, 0.32, 0.13), vec3(0.36, 0.52, 0.2), h2 + 0.25 * noise(d * 70.0));
      vec3 pc = green * lit + 0.06 * vein;
      pc = mix(pc, vec3(0.5, 0.22, 0.12), smoothstep(0.92 * r, r, dist) * 0.5);
      pc += 0.25 * pow(max(dot(n, normalize(ld + vec3(0.0, 0.0, 1.0))), 0.0), 30.0);
      if (h > 0.82) {
        vec2 fd = d - vec2(r * 0.2, r * 0.1);
        float fr = length(fd);
        float pa = atan(fd.y, fd.x) + h * 3.0;
        float petal = smoothstep(0.03 * (0.55 + 0.45 * abs(cos(pa * 3.0))), 0.026 * (0.55 + 0.45 * abs(cos(pa * 3.0))), fr);
        vec3 lotus = mix(u_palette[2], u_palette[3], 0.3 + 0.4 * smoothstep(0.0, 0.03, fr)) * (0.75 + 0.35 * abs(cos(pa * 3.0)));
        lotus = mix(lotus, vec3(1.0, 0.85, 0.3), smoothstep(0.009, 0.005, fr));
        pc = mix(pc, lotus, petal);
        m = max(m, petal);
      }
      outC = vec4(mix(outC.rgb, pc, m), max(outC.a, m));
    }
  }
  return outC;
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time;
  float ax = u_resolution.x / u_resolution.y;
  vec3 deep = u_palette[0];
  vec3 shallow = u_palette[1];
  vec3 ld = normalize(LD);

  // surface waves from finished turns and the cursor refract everything below
  vec2 rn = vec2(0.0);
  float err = 0.0;
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - toP(r.xy);
    float dist = length(d);
    float rad = r.z * (r.w > 1.5 ? 0.08 : 0.15);
    float fade = exp(-r.z * 0.8);
    float w = sin((dist - rad) * 90.0) * exp(-pow((dist - rad) * 16.0, 2.0)) * fade;
    rn += d / max(dist, 1e-3) * w;
    if (abs(r.w - 1.0) < 0.5) err = max(err, exp(-pow((dist - rad) * 12.0, 2.0)) * fade);
  }
  vec2 dp = p - toP(u_pointer);
  float pd = length(dp);
  rn += dp / max(pd, 1e-3) * sin(pd * 80.0 - t * 4.0) * exp(-pd * pd / 0.006) * 0.6;
  vec2 fp = p + rn * 0.006;

  // pond floor: mottled stone, darker toward the deep rim, dappled with caustics
  float fl = fbm(fp * 2.2 + 3.0);
  vec3 col = mix(deep, shallow, 0.2 + 0.55 * fl);
  col *= 0.88 + 0.18 * noise(fp * 26.0);
  col = mix(col, deep * 0.6, smoothstep(0.55, 1.4, length(p / vec2(ax * 0.5, 0.5))));
  vec2 cq = fp * 16.0 + vec2(t * 0.3, t * 0.2);
  float cn = noise(fp * 5.0 + t * 0.08);
  float cc = abs(sin(cq.x + cn * 6.0 + sin(cq.y * 0.7 + t * 0.5)) * sin(cq.y * 1.2 - cn * 5.0 + t * 0.4));
  float caus = pow(1.0 - cc, 12.0) * p_caustics * (0.5 + 0.5 * noise(fp * 2.0 - t * 0.05));
  col += mix(shallow, vec3(1.0), 0.4) * caus * 0.18;

  float sh = 0.0;
  for (int i = 0; i < 9; i++) {
    if (float(i) >= p_count) break;
    vec2 c; float ang, L, dep, ph;
    fishAt(i, t, ax, c, ang, L, dep, ph);
    sh = max(sh, koiShadow(fp - vec2(0.03, -0.045) * (1.15 - dep) * p_depth, c, ang, L, 1.0 - dep));
  }
  sh = max(sh, 0.55 * pads(fp - vec2(0.05, -0.07) * p_depth, t, 1.15).a);
  col *= 1.0 - clamp(0.45 * p_depth, 0.0, 0.75) * sh;

  // koi, deepest first; water swallows the color of the deep ones
  vec3 murk = mix(deep, shallow, 0.5);
  for (int i = 0; i < 9; i++) {
    if (float(i) >= p_count) break;
    vec2 c; float ang, L, dep, ph;
    fishAt(i, t, ax, c, ang, L, dep, ph);
    vec4 k = koi(p + rn * 0.004 * dep, c, ang, L, ph, KINDS[i], float(i) * 0.37);
    vec3 kc = mix(k.rgb, murk, dep * 0.5) + mix(shallow, vec3(1.0), 0.5) * caus * 0.12 * dep;
    col = mix(col, kc, k.a);
  }

  // agents are tancho koi circling their spot; waiting ones rise and mouth the surface
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    float fi = float(i);
    float waiting = step(0.5, a.z);
    vec2 a0 = toP(a.xy);
    float ph0 = t * 0.8 * max(p_swim, 0.3) + fi * 1.7;
    vec2 c = mix(a0 + 0.045 * vec2(cos(ph0), sin(ph0)), a0, waiting);
    float ang = mix(ph0 + 1.5708, 1.5708 + 0.15 * sin(t * 0.8 + fi), waiting);
    float L = 0.055 * a.w * sqrt(p_size);
    col *= 1.0 - 0.4 * clamp(p_depth, 0.0, 1.5) * a.w * koiShadow(p - vec2(0.03, -0.045) * p_depth, c, ang, L, 0.8);
    vec4 k = koi(p, c, ang, L, t * mix(6.0, 2.0, waiting) + fi, 1, fi);
    col = mix(col, k.rgb, k.a * a.w);
    if (waiting > 0.5) {
      vec2 mouth = c + vec2(cos(ang), sin(ang)) * L * 0.95;
      for (int k2 = 0; k2 < 2; k2++) {
        float f = fract(t * 0.6 + float(k2) * 0.5);
        float ring = smoothstep(0.003, 0.0, abs(length(p - mouth) - (0.01 + 0.07 * f)));
        col = mix(col, vec3(0.95), ring * (1.0 - f) * 0.6 * a.w);
      }
    }
  }

  // the surface: pads and lotus, lit ripple crests, a faint sky sheen
  vec4 pl = pads(p + rn * 0.002, t, 1.0);
  col = mix(col, pl.rgb, pl.a);
  col += vec3(0.9, 0.95, 1.0) * 0.22 * max(dot(rn, normalize(ld.xy)), 0.0);
  col = mix(col, vec3(0.85, 0.15, 0.1), err * 0.55);
  col += vec3(0.8, 0.9, 1.0) * 0.05 * smoothstep(0.6, 0.9, noise(vec2(p.x * 3.0 - t * 0.05, p.y * 12.0)));
  return mix(u_canvas, col, p_color);
}`,Nu={id:"koi-pond",name:"Koi Pond",source:wd,palette:["#0e2a2e","#3d7a70","#f5f1e8","#e2451c"],params:[g("swim","Swim speed",0,3,1),g("count","Koi",1,9,7,1),g("size","Koi size",.6,1.6,1),g("depth","Depth & shadows",0,2,1),g("caustics","Caustic light",0,2,1),g("pads","Lily pads",0,1,.6),g("color","Color strength",0,1,.95)]};var _d=`struct Clay { vec3 alb; vec2 g; float ao; float z; vec3 emit; };

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
  float best = 0.0;
  float cc0 = floor((p.x + t*0.018)/0.3);
  for (int j = -1; j <= 1; j++){
    for (int k = 0; k < 3; k++){
      vec4 pf = puff(cc0 + float(j), k, t);
      if (pf.w == 0.0 || p.y < pf.w - 0.03) continue;
      vec3 cl = mix(mix(u_palette[3], vec3(1.0), 0.3), u_palette[2]*0.9 + 0.12, smoothstep(pf.w + 0.03, pf.w - 0.03, p.y)*0.5);
      dome(c, p - pf.xy, pf.z, cl, 0.3, best, 0.0, 0.06);
    }
  }
  // clay seagulls wheeling across the sky, flapping as they go
  for (int gi = 0; gi < 6; gi++){
    float fg = float(gi);
    if (fg >= p_gulls) break;
    float span = aspect + 0.5;
    float gx = mod(fg*0.37*span + t*(0.022 + 0.008*fg), span) - span*0.5;
    float gy = 0.17 + 0.22*hash21(vec2(fg, 4.0)) + 0.02*sin(t*0.7 + fg*2.0);
    float S = 0.016 + 0.008*hash21(vec2(fg, 6.0));
    vec2 q = (p - vec2(gx, gy))/S;
    if (abs(q.x) > 1.25 || abs(q.y) > 1.1) continue;
    float flap = 0.5*sin(t*5.0 + fg*1.9);
    float ax = min(abs(q.x), 1.0);
    float wy = (0.4 + flap)*sin(3.1416*ax)*0.75 - 0.15*ax;
    float th = 0.17*(1.0 - 0.75*ax);
    float wing = max(abs(q.y - wy) - th, abs(q.x) - 1.0);
    float body = length(q/vec2(0.3, 0.16)) - 1.0;
    if (min(wing, body*0.16) < 0.0){
      float u = clamp((q.y - wy)/max(th, 1e-3), -1.0, 1.0);
      c.alb = mix(vec3(0.95, 0.94, 0.92), u_palette[0]*0.7, smoothstep(0.7, 0.95, ax));
      c.g = body < 0.0 ? -q/0.3*0.6 : vec2(0.0, slopeOf(u)*0.45);
      c.z = 0.55; c.ao = 1.0;
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
  float isWater = 0.0;
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
        c.z = 0.8; c.ao = 1.0; isWater = 0.0;
      }
      float ty = p.y + 0.22;
      if (ty > 0.0 && ty < 0.3){
        float hw = mix(0.038, 0.025, ty/0.3);
        float u = (p.x - lx0 + 0.002*sin(ty*40.0))/hw;
        if (abs(u) < 1.0){
          float band = mod(floor(ty/0.055 + 0.08*sin(p.x*120.0)), 2.0);
          c.alb = band < 0.5 ? u_palette[2] : mix(u_palette[3], vec3(1.0), 0.3);
          c.g = vec2(slopeOf(u)*0.8, 0.0);
          c.z = 0.8; c.ao = 1.0; isWater = 0.0;
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
      isWater = ci < 0.5 ? 0.0 : 1.0;
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
    if (isWater > 0.5 && d.y < -0.022 && d.y > -0.1 && abs(d.x) < 0.07){
      // the boat's wobbling reflection: pale sail above a dark hull smear
      float k = (-d.y - 0.022)/0.078;
      float wob = 0.007*sin(d.y*170.0 + t*3.0 + fi);
      float sail = smoothstep(0.022*(1.0 - 0.5*k), 0.0, abs(d.x - 0.022 + wob))*(1.0 - k)*step(0.012, -d.y - 0.022);
      float hull = smoothstep(0.04, 0.0, abs(d.x + wob))*smoothstep(0.014, 0.0, -d.y - 0.022);
      c.alb = mix(c.alb, mix(u_palette[3], vec3(1.0), 0.3), sail*0.4);
      c.alb = mix(c.alb, u_palette[2]*0.7, hull*0.35);
    }
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
  float ang = T*0.55;
  vec2 bd = p - lamp;
  float side = cos(ang);
  float facing = max(sin(ang), 0.0)*(1.0 - abs(side));
  float along = bd.x*sign(side);
  float spread = 0.01 + max(along, 0.0)*(0.09 + 0.25*(1.0 - abs(side)));
  float cone = exp(-pow((bd.y - along*0.015)/spread, 2.0))*exp(-max(along, 0.0)*0.5)*step(0.0, along)*sqrt(abs(side));
  float rays = 0.75 + 0.25*noise(vec2(atan(bd.y, abs(bd.x))*40.0, T*0.4));
  float lampGlow = exp(-dot(bd, bd)/0.0012)*(0.6 + 2.0*facing);
  vec3 beamC = mix(u_palette[3], vec3(1.0, 0.98, 0.9), 0.5);
  col += beamC*(cone*0.75*rays*(1.0 - smoothstep(0.55, 0.75, c.z)) + lampGlow*0.5)*p_beam;
  col *= 1.0 + 0.025*(hash21(vec2(frame, 7.0)) - 0.5);
  return mix(u_canvas, col, p_color);
}`,Lu={id:"plasticine-lighthouse-cove",name:"Lighthouse Cove",source:_d,palette:["#1c2c6b","#22b3a6","#ff6a3d","#ffe0a6"],params:[g("swell","Swell speed",0,2.5,1,.05),g("coil","Coil thickness",.5,2,1,.05),g("thumb","Thumbprints",0,2.5,1,.05),g("fps","Stop-motion fps",4,24,12,1),g("beam","Lighthouse beam",0,2,1,.05),g("gulls","Seagulls",0,6,3,1),g("color","Color strength",0,1,.92)]};var Kr=`float hillY(float x) {
  return 0.07 + 0.09 * sin(x * 1.5 + 0.7) + 0.035 * sin(x * 3.7 + 1.3);
}

// fluffy cumulus built from overlapping puffs: x = coverage, y = how much sun the puff catches
vec2 clouds(vec2 p, float t) {
  float cov = 0.0, lit = 0.0;
  float ax = u_resolution.x / u_resolution.y;
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float span = ax + 0.8;
    float cx = mod(fk * 0.47 * span + t * 0.008 * (0.7 + 0.3 * fk), span) - span * 0.5;
    float cy = 0.27 + 0.13 * hash21(vec2(fk, 2.0));
    float sc = 0.7 + 0.5 * hash21(vec2(fk, 5.0));
    if (abs(p.x - cx) > 0.25 * sc || abs(p.y - cy) > 0.12 * sc) continue;
    for (int j = 0; j < 6; j++) {
      float fj = float(j);
      float u = (fj - 2.5) / 2.5;
      vec2 pc = vec2(cx + u * 0.13 * sc, cy + (0.035 * (1.0 - u * u) + 0.015 * hash21(vec2(fk, fj))) * sc);
      float r = (0.04 + 0.025 * (1.0 - u * u) + 0.012 * hash21(vec2(fj, fk + 9.0))) * sc;
      float d = length((p - pc) * vec2(1.0, 1.15));
      float m = smoothstep(r, r * 0.55, d) * smoothstep(cy - 0.04 * sc, cy - 0.005 * sc, p.y + 0.012 * sin(p.x * 60.0 + fk));
      cov = max(cov, m);
      lit = max(lit, m * smoothstep(-r, r * 0.8, p.y - pc.y + (p.x - pc.x) * 0.3));
    }
  }
  return vec2(cov, lit);
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

  // a distant range dissolving into haze
  float hy3 = hy2 + 0.05 + 0.03 * sin(p.x * 2.3 + 1.1) + 0.015 * noise(vec2(p.x * 6.0, 4.0));
  if (p.y < hy3 + 0.01) {
    vec3 far = mix(skyC * 0.82 + vec3(0.08, 0.08, 0.05), mix(grass, skyC, 0.7), 0.3);
    far = mix(far, vec3(0.95, 0.94, 0.9), 0.25 * smoothstep(hy3 - 0.06, hy3, p.y));
    col = mix(col, far, smoothstep(hy3 + 0.004, hy3 - 0.004, p.y) * 0.85);
  }

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
  float ang = cp.y > hy + 0.01 ? 0.05 + 0.7 * (h - 0.5) : 1.3 + (h - 0.5) * 0.9 - w * 0.4;
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

  // clouds go on after the dab pass with soft, ragged edges; resampled into dabs they broke into blocks
  if (p.y > hillY(p.x)) {
    vec2 jit = vec2(noise(p * 90.0), noise(p * 90.0 + 7.3)) - 0.5;
    vec2 cl = clouds(p + jit * 0.008, t * p_wind);
    vec3 cc = mix(mix(u_palette[0], vec3(0.78, 0.8, 0.88), 0.55), vec3(1.0, 0.98, 0.93), cl.y);
    cc *= 0.95 + 0.07 * sA;
    col = mix(col, cc, cl.x * 0.95);
  }

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
}`,Du={id:"poppy-hill",name:"Poppy Hill",source:Kr,palette:["#5fa9ea","#3f9b34","#ff5a0a","#ffbf1f"],params:[g("wind","Wind speed",0,3,1),g("bend","Gust strength",0,2,1),g("size","Poppy size",8,40,18,.5),g("bloom","Bloom amount",0,1,.72),g("brush","Brush stroke size",.006,.03,.017,.001),g("color","Color strength",0,1,.95)]};var kd=`const float BAY[16] = float[16](0.0,8.0,2.0,10.0,12.0,4.0,14.0,6.0,3.0,11.0,1.0,9.0,15.0,7.0,13.0,5.0);
float bayer(vec2 c) { ivec2 i = ivec2(mod(c, 4.0)); return (BAY[i.x + i.y * 4] + 0.5) / 16.0; }

const float HZ = -0.16;
float g_led;
float g_aspect;

float boxD(vec2 d, vec2 h) { vec2 q = abs(d) - h; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float k = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * k); }

// eyepiece lens: magnifies the middle, crushes the periphery toward the rim
vec2 lens(vec2 p) {
  vec2 e = p / vec2(0.5 * g_aspect, 0.5);
  float r2 = dot(e, e) * 0.5;
  return p * (1.0 + p_bulge * r2) / (1.0 + p_bulge);
}

// subject: monochrome intensity + depth (0 near, 1 far)
vec2 base(vec2 p, float t) {
  float sp = p_speed;
  float led = g_led;
  if (p.y < HZ) {
    // near layer: checkered wireframe floor racing toward the viewer
    float d = HZ - p.y;
    float z = 0.22 / d;
    float zz = z + t * 0.9 * sp;
    float dz = abs(fract(zz + 0.5) - 0.5) * d * d / 0.22;
    float xw = p.x * z * 1.6;
    float dx = abs(fract(xw + 0.5) - 0.5) / (z * 1.6);
    float w = led * 0.55;
    float lz = step(dz, w) * smoothstep(9.0, 2.5, z);
    float lx = step(dx, w) * smoothstep(16.0, 3.0, z);
    float chk = mod(floor(zz + 0.5) + floor(xw + 0.5), 2.0);
    float I = 0.04 + 0.5 * exp(-d * 30.0) + chk * 0.3 * smoothstep(7.0, 1.5, z);
    I = max(I, max(lz, lx) * mix(0.45, 0.98, smoothstep(6.0, 1.0, z)));
    // message packets riding the lanes
    float lane = floor(xw + 0.5);
    float h = hash21(vec2(lane, 3.1));
    float zp = mod(h * 37.0 - t * (1.2 + 1.6 * h) * sp, 14.0) + 0.6;
    float pd = abs(z - zp) * d * d / 0.22;
    if (h < 0.45 && pd < led * 1.6 && dx < led * 1.3) I = 1.0;
    return vec2(I, clamp(z / 10.0, 0.0, 1.0));
  }
  float up = p.y - HZ;
  float I = 0.01 + 0.34 * exp(-up * 16.0);
  if (up < led * 1.5) I = 0.95;
  float dep = 1.0;
  // far layer: skyline of stacked thread cards
  float xf = p.x + t * 0.012 * sp;
  float cw = 0.09;
  float ci = floor(xf / cw);
  float fx = xf - (ci + 0.5) * cw;
  float h1 = hash21(vec2(ci, 1.7));
  float th = 0.07 + 0.3 * h1 * h1;
  float hw = cw * 0.4;
  if (abs(fx) < hw && up < th) {
    float sy = up / 0.026;
    float edge = max(step(hw - led * 1.1, abs(fx)), step(th - led * 1.1, up));
    I = fract(sy) > 0.8 ? 0.06 : 0.24;
    float lit = step(0.8, hash21(vec2(ci, floor(sy)) + floor(t * 0.5 * sp + h1 * 4.0) * 0.13));
    I = max(I, lit * 0.55 * step(fract(sy), 0.8));
    I = max(I, edge * 0.45);
    dep = 0.85;
  }
  // middle layer: thread windows rising out of the horizon, dimming as they scroll away
  vec2 cs = vec2(0.34, 0.26);
  vec2 q = vec2(p.x - t * 0.008 * sp, p.y - t * 0.03 * sp);
  vec2 id = floor(q / cs);
  vec2 f = q - (id + 0.5) * cs;
  float hp = hash21(id + 5.3);
  if (hp < p_panels && up > 0.008) {
    vec2 hs = vec2(0.115 + 0.03 * hash21(id + 9.1), 0.08 + 0.03 * hash21(id + 2.7));
    vec2 ofs = (vec2(hash21(id + 1.3), hash21(id + 7.7)) - 0.5) * vec2(0.06, 0.05);
    vec2 d = f - ofs;
    float bd = boxD(d, hs);
    if (bd < 0.0) {
      dep = 0.45;
      float P = 0.0;
      float top = hs.y - d.y;
      if (top < 0.034) {
        P = 0.55;
        if (boxD(d - vec2(-hs.x + 0.02, hs.y - 0.017), vec2(0.009)) < 0.0) P = 0.12;
        if (abs(d.x - hs.x + 0.022) < led * 2.0 && abs(top - 0.017) < led * 2.0) P = 0.95;
      } else {
        float rowF = (top - 0.04) / 0.024;
        float row = floor(rowF);
        if (rowF > 0.0 && fract(rowF) < 0.42 && top < 2.0 * hs.y - 0.012) {
          float inner = 2.0 * hs.x - 0.03;
          float lx = (d.x + hs.x - 0.015) / inner;
          float hr = hash21(vec2(row, 4.0) + id);
          if (hr > 0.62) lx = 1.0 - lx;
          float len = 0.25 + 0.6 * hash21(vec2(row, 8.0) + id);
          if (lx > 0.0 && lx < len) P = hr > 0.62 ? 0.62 : 0.34;
        }
      }
      if (bd > -led * 1.2) P = 0.8;
      I = P * mix(1.0, 0.42, smoothstep(0.18, 0.6, up));
    }
  }
  return vec2(I, dep);
}

vec3 cubeV(int i) { return vec3((i & 1) == 0 ? -1.0 : 1.0, (i & 2) == 0 ? -1.0 : 1.0, (i & 4) == 0 ? -1.0 : 1.0); }

float events(vec2 p, float t, out float err) {
  float led = g_led;
  float I = 0.0;
  err = 0.0;
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    vec2 head = lens(toP(a.xy)) + vec2(0.0, 0.006 * sin(t * 2.1 + float(i)));
    vec2 d = p - head;
    if (dot(d, d) > 0.03) continue;
    if (a.z > 0.5) {
      // waiting: blinking [!] callout with sonar frames
      float blink = step(0.3, fract(t * 1.4));
      float fr = step(abs(boxD(d, vec2(0.04, 0.032))), led * 0.8);
      float ex = step(boxD(d - vec2(0.0, 0.006), vec2(led * 0.9, 0.013)), 0.0) + step(boxD(d + vec2(0.0, 0.02), vec2(led * 0.9)), 0.0);
      I = max(I, max(fr, ex) * mix(0.45, 1.0, blink) * a.w);
      float ph = fract(t * 0.7 + float(i) * 0.3);
      float ring = step(abs(boxD(d, vec2(0.04, 0.032) * (1.0 + ph * 2.2))), led * 0.7);
      I = max(I, ring * (1.0 - ph) * 0.8 * a.w);
    } else {
      // working: spinning wireframe cube with a scan trail
      float R = 0.05 * a.w;
      float ay = t * 1.3 + float(i), ax = 0.55 + 0.25 * sin(t * 0.7 + float(i));
      float cy = cos(ay), sy = sin(ay), cx = cos(ax), sx = sin(ax);
      if (dot(d, d) < 0.0016) {
        float md = 1e3;
        for (int e = 0; e < 12; e++) {
          int axn = e / 4;
          int k = e - axn * 4;
          int lo = k & ((1 << axn) - 1);
          int ia = ((k >> axn) << (axn + 1)) | lo;
          int ib = ia | (1 << axn);
          vec3 va = cubeV(ia), vb = cubeV(ib);
          va = vec3(cy * va.x + sy * va.z, va.y, -sy * va.x + cy * va.z);
          vb = vec3(cy * vb.x + sy * vb.z, vb.y, -sy * vb.x + cy * vb.z);
          vec2 pa = vec2(va.x, cx * va.y - sx * va.z) * R * 0.5;
          vec2 pb = vec2(vb.x, cx * vb.y - sx * vb.z) * R * 0.5;
          md = min(md, segD(d, pa, pb));
        }
        I = max(I, step(md, led * 0.65) * a.w);
      }
      I = max(I, 0.2 * exp(-dot(d, d) / 0.002) * a.w);
      for (int k = 0; k < 6; k++) {
        float fk = float(k) + fract(t * 3.0);
        vec2 tp = vec2(-0.05 - fk * 0.018, 0.004 * sin(fk * 1.7 + t * 3.0));
        float tb = boxD(d - tp, vec2(led * 1.2, led * 0.6));
        I = max(I, step(tb, 0.0) * (1.0 - fk / 6.5) * 0.9 * a.w);
      }
    }
  }
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    vec2 d = p - lens(toP(r.xy));
    float fade = exp(-r.z * 0.7);
    float sp = r.w > 1.5 ? 0.12 : 0.24;
    float s = r.z * sp + 0.01;
    float bd = boxD(d, vec2(s * 1.35, s));
    float ring = step(abs(bd), led * 0.9) + step(abs(boxD(d, vec2(s * 0.8, s * 0.6))), led * 0.7) * 0.6;
    I = max(I, clamp(ring, 0.0, 1.0) * fade);
    // error: an inverted shockwave band trailing the frame
    if (abs(r.w - 1.0) < 0.5) err = max(err, step(bd, 0.0) * step(-0.08, bd) * exp(-r.z * 0.9) * 1.6);
  }
  return I;
}

vec3 scene(vec2 uv, vec2 p0) {
  float t = u_time;
  float led = 1.0 / p_res;
  g_led = led;
  g_aspect = u_resolution.x / u_resolution.y;
  // cursor knocks the mirror out of sync: rows tear sideways
  vec2 sp0 = p0;
  vec2 dp = p0 - toP(u_pointer);
  float gl = exp(-dot(dp, dp) / 0.012);
  sp0.x += gl * (hash21(vec2(floor(p0.y / led), floor(t * 14.0))) - 0.5) * 0.03;

  // look through the eyepiece: the LED grid itself bends with the lens
  vec2 p = lens(sp0);
  vec2 c = floor(p / led);
  vec2 cp = (c + 0.5) * led;

  // tunnel: elliptical falloff from the middle, dithered into stepped LED rings
  vec2 e = p0 / vec2(0.5 * g_aspect, 0.5);
  float r = length(e * vec2(0.82, 1.0));
  float vig = 1.0 - p_tunnel * smoothstep(0.2, 1.2, r);
  vig *= 1.0 - p_tunnel * 0.9 * smoothstep(1.05, 1.45, r);

  vec2 b = base(cp, t);
  float I = b.x;
  // stereo ghost: near things double like a misaligned eyepiece
  vec2 gb = base(cp + vec2(0.012 * p_stereo, 0.0), t);
  I = max(I, gb.x * (1.0 - gb.y) * 0.45 * step(0.01, p_stereo));
  I *= vig;
  float err;
  I = max(I, events(cp, t, err) * max(vig, 0.65));
  // oscillating mirror sweep
  float sx = mod(t * 0.45, 2.8) - 1.4;
  float band = exp(-pow((p0.x - sx) * 7.0, 2.0));
  I = I * (1.0 + 0.6 * p_scan * band) + 0.07 * p_scan * band * vig;
  I *= 0.9 + 0.1 * hash21(vec2(c.y, 0.37));
  // RED ALARM: inverse video strobe
  float ev = clamp(err, 0.0, 1.0);
  float haz = step(0.5, fract((cp.x + cp.y) / 0.05 - t * 2.0));
  float strobe = 0.5 + 0.5 * step(0.5, fract(t * 4.0));
  I = mix(I, mix(1.0 - I, haz, 0.5), ev * strobe);

  float lvl = clamp(floor(clamp(I, 0.0, 1.0) * 3.0 + bayer(c)), 0.0, 3.0);
  vec3 lc = lvl < 0.5 ? u_palette[0] : lvl < 1.5 ? u_palette[1] : lvl < 2.5 ? u_palette[2] : u_palette[3];
  lc = mix(lc, vec3(1.0, 0.72, 0.6), ev * strobe * step(2.5, lvl) * 0.5);
  vec2 f = fract(p / led) - 0.5;
  float dot_ = smoothstep(0.52, 0.3, max(abs(f.x) * 1.15, abs(f.y)));
  vec3 col = mix(u_palette[0] * 0.7, lc, mix(0.55, 1.0, dot_));
  col += u_palette[2] * 0.06 * clamp(I, 0.0, 1.0);
  // the dark rubber visor swallows the far rim
  col *= mix(1.0, 0.35, p_tunnel * smoothstep(0.95, 1.5, r));
  return mix(u_canvas, col, p_color);
}`,qu={id:"red-alarm",name:"Red Alarm",source:kd,palette:["#140204","#6e0610","#d4101c","#ff4a3a"],params:[g("speed","Scroll speed",0,3,.4),g("res","LED rows",90,260,192,1),g("stereo","Stereo depth",0,2,.54),g("panels","Thread panels",0,1,.76),g("scan","Mirror scan glow",0,1,.77),g("tunnel","Tunnel vision",0,1,.04),g("bulge","Eyepiece bulge",0,1.5,.91),g("color","Color strength",0,1,1)]};var zd=`const vec3 INK = vec3(0.07, 0.06, 0.08);

vec2 rotA(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float fillD(float d) { float w = fwidth(d) * 0.75 + 1e-4; return smoothstep(w, -w, d); }
float strokeD(float d, float lw) { float w = fwidth(d) * 0.75 + 1e-4; return smoothstep(lw + w, lw - w, abs(d)); }

// Ben-Day dots: a tone becomes a 45-degree grid of ink dots
float benday(vec2 p, float tone) {
  vec2 g = rotA(p, 0.785) * (95.0 / p_dots);
  float r = 0.72 * sqrt(clamp(tone, 0.0, 1.0));
  float d = length(fract(g) - 0.5);
  float w = fwidth(d) + 1e-4;
  return smoothstep(r + w, r - w, d);
}

// a jagged comic burst; spikes vary in length
float burst(vec2 q, float r, float n, float jag, float seed) {
  float a = atan(q.y, q.x) + 3.1416;
  float k = a * n / 6.2832;
  float s = 1.0 - abs(fract(k) - 0.5) * 2.0;
  float h = hash21(vec2(floor(k), seed));
  return (length(q) - r * (1.0 - jag + jag * s * (0.65 + 0.35 * h))) * 0.8;
}

vec3 tint(vec3 base, vec3 ink, float cov) { return base * mix(vec3(1.0), ink, cov); }

// one panel's art: rgb plus a black-ink line mask
vec4 panelArt(int kind, vec2 q, vec2 hs, float t, float lw) {
  vec3 paper = u_palette[3], red = u_palette[0], blue = u_palette[1], yel = u_palette[2];
  vec3 col = paper;
  float ink = 0.0;
  if (kind == 0) {
    // flying saucer beaming down over a dotted night sky
    float ty = clamp(q.y / hs.y * 0.5 + 0.5, 0.0, 1.0);
    col = tint(col, blue, benday(q, 0.06 + 0.32 * ty));
    float sp = hash21(floor(q * 26.0));
    col = mix(col, paper, smoothstep(0.12, 0.0, length(fract(q * 26.0) - 0.5)) * step(0.975, sp) * step(0.45, ty));
    vec2 c = vec2(0.35 * hs.x * sin(t * 0.35), 0.28 * hs.y + 0.025 * sin(t * 1.2));
    float R = hs.y * 0.5;
    vec2 s = rotA(q - c, 0.12 * sin(t * 0.6));
    if (s.y < 0.0) {
      float bw = R * 0.25 + (-s.y) * 0.45;
      float beam = step(abs(s.x), bw) * smoothstep(-hs.y * 1.6, -R * 0.1, s.y);
      col = mix(col, tint(paper, yel, 0.15 + 0.85 * benday(q, 0.5)), beam * 0.85);
      ink = max(ink, strokeD(abs(s.x) - bw, lw * 0.6) * smoothstep(-hs.y * 1.2, -R * 0.15, s.y));
    }
    float dome = max(length(s - vec2(0.0, R * 0.08)) - R * 0.42, -(s.y - R * 0.08));
    float disc = (length(s / vec2(R, R * 0.24)) - 1.0) * R * 0.24;
    vec3 dc = mix(tint(paper, blue, 0.35), paper, smoothstep(0.0, R * 0.3, s.y - R * 0.2 + s.x * 0.4));
    col = mix(col, dc, fillD(dome));
    vec3 hull = mix(tint(paper, blue, 0.55) * 0.75, tint(paper, blue, 0.15), smoothstep(-R * 0.2, R * 0.2, s.y));
    col = mix(col, hull, fillD(disc));
    float lights = fillD(length(vec2(fract(s.x / (R * 0.28) + t * 0.6) - 0.5, (s.y + R * 0.02) / (R * 0.28))) - 0.22);
    col = mix(col, mix(yel, red, step(0.5, fract(s.x / (R * 0.56) + t * 0.3))), lights * fillD(disc + R * 0.05));
    ink = max(ink, max(strokeD(dome, lw), strokeD(disc, lw)));
  } else if (kind == 1) {
    // rocket ship tearing past speed lines
    col = tint(col, yel, 0.3);
    float row = floor(q.y * 34.0);
    float hr = hash21(vec2(row, 3.0));
    float xs = fract(q.x * (0.8 + hr) / hs.x * 0.5 + t * (0.6 + 0.6 * hr) + hr * 7.0);
    float taper = smoothstep(0.0, 0.08, xs) * smoothstep(0.7, 0.3, xs);
    float streak = strokeD((fract(q.y * 34.0) - 0.5) / 34.0, 0.0022 * taper) * step(0.84, hr) * step(0.01, taper);
    col = mix(col, INK, streak);
    float R = hs.y * 0.62;
    float lx = mod(t * 0.12 * hs.x * 4.0, hs.x * 3.6) - hs.x * 1.8;
    vec2 c = vec2(lx, -0.05 * hs.y + 0.03 * sin(t * 1.5));
    vec2 s = rotA(q - c, -0.12);
    float body = segD(s, vec2(-R * 0.5, 0.0), vec2(R * 0.35, 0.0)) - R * 0.2 * (1.0 - 0.85 * smoothstep(R * 0.05, R * 0.6, s.x));
    float fin = segD(vec2(s.x, abs(s.y)), vec2(-R * 0.3, R * 0.15), vec2(-R * 0.68, R * 0.42)) - R * 0.07;
    float win = length(s - vec2(R * 0.12, R * 0.02)) - R * 0.085;
    if (s.x < -R * 0.5) {
      float fl = length((s + vec2(R * 0.55, 0.0)) / vec2(R * (0.45 + 0.12 * sin(t * 23.0)), R * 0.16)) - 1.0;
      col = mix(col, mix(red, yel, smoothstep(0.0, -0.6, fl)), fillD(fl));
      ink = max(ink, strokeD(fl * R * 0.16, lw * 0.7));
    }
    col = mix(col, red * 0.92, fillD(fin));
    col = mix(col, mix(paper, tint(paper, blue, 0.3), smoothstep(R * 0.2, -R * 0.2, s.y)), fillD(body));
    col = mix(col, red, fillD(body) * step(abs(s.x + R * 0.12), R * 0.06));
    col = mix(col, tint(paper, blue, 0.7), fillD(win));
    ink = max(ink, max(strokeD(min(body, fin), lw), strokeD(win, lw * 0.8)));
  } else if (kind == 2) {
    // POW: a jagged burst over radiating action lines
    col = tint(col, blue, benday(q, 0.1 + 0.15 * length(q) / hs.y));
    float a = atan(q.y, q.x);
    float lines = step(0.95, fract(a * 9.0 / 3.1416 + hash21(vec2(floor(a * 18.0 / 3.1416), 1.0)) * 0.3)) * smoothstep(hs.y * 0.3, hs.y * 0.8, length(q));
    col = mix(col, INK, lines * 0.8);
    float R = hs.y * (0.62 + 0.05 * sin(t * 2.2));
    vec2 s = rotA(q, 0.05 * sin(t * 0.9));
    float b1 = burst(s, R, 13.0, 0.42, 1.0);
    float b2 = burst(rotA(s, 0.4), R * 0.58, 11.0, 0.4, 2.0);
    col = mix(col, tint(paper, red, 0.95), fillD(b1));
    col = mix(col, tint(paper, yel, 0.95), fillD(b2));
    col = mix(col, tint(paper, red, 0.5), fillD(b2) * benday(s * 1.3, 0.25));
    ink = max(ink, max(strokeD(b1, lw * 1.2), strokeD(b2, lw)));
  }
  return vec4(col, ink);
}

vec3 scene(vec2 uv, vec2 p) {
  float t = u_time * p_drift;
  vec3 paper = u_palette[3], red = u_palette[0], blue = u_palette[1], yel = u_palette[2];
  float W = 0.5 * u_resolution.x / u_resolution.y;
  float lw = 0.0014 * p_ink;

  // the page: two tiers of panels with slanted gutters
  float gut = 0.022;
  float ry = 0.04 + 0.05 * p.x / W;
  float dRow = abs(p.y - ry) / 1.001;
  bool topRow = p.y > ry;
  float b1 = 0.15 * W + 0.06 * (p.y - 0.27);
  int pid;
  float dCol;
  vec2 ctr, hs;
  if (topRow) {
    dCol = abs(p.x - b1) / 1.002;
    if (p.x < b1) { pid = 0; ctr = vec2(-0.42 * W, 0.27); hs = vec2(0.58 * W, 0.23); }
    else { pid = 2; ctr = vec2(0.58 * W, 0.27); hs = vec2(0.42 * W, 0.23); }
  } else {
    dCol = 1.0;
    pid = 1; ctr = vec2(0.0, -0.23); hs = vec2(W, 0.27);
  }
  float dEdge = min(W - abs(p.x), 0.5 - abs(p.y));
  float border = min(min(dRow, dCol), dEdge);

  vec2 q = p - ctr;
  vec2 mis = vec2(0.0028, -0.002) * p_misreg;
  vec4 art = panelArt(pid, q + mis, hs, t, lw);
  vec4 key = panelArt(pid, q, hs, t, lw);
  vec3 col = art.rgb;
  col = mix(col, INK, key.a);
  float frame = smoothstep(gut + lw * 2.5 + 0.001, gut + lw * 2.5, border);
  col = mix(col, INK, frame);
  col = mix(col, paper, smoothstep(gut + 0.0008, gut, border));

  // agents: little rockets on patrol; waiting ones raise a "!" balloon
  for (int i = 0; i < 16; i++) {
    if (i >= u_agentCount) break;
    vec4 a = u_agents[i];
    // a fading-in agent has no size yet; drawing it would divide by zero
    if (a.w < 0.05) continue;
    float fi = float(i);
    vec2 c0 = toP(a.xy);
    vec2 d = p - c0;
    if (dot(d, d) > 0.012) continue;
    float R = 0.028 * a.w;
    if (a.z > 0.5) {
      float bob = 1.0 + 0.08 * sin(u_time * 4.0 + fi);
      vec2 b = d / bob;
      float bal = (length(b / vec2(1.25, 1.0)) - R * 1.1);
      float tail = segD(b, vec2(-R * 0.3, -R * 0.8), vec2(-R * 0.9, -R * 1.5)) - R * 0.12;
      float sh = min(bal, tail);
      col = mix(col, paper, fillD(sh));
      col = mix(col, INK, strokeD(sh, lw));
      float bang = min(segD(b, vec2(0.0, R * 0.55), vec2(0.0, -R * 0.15)) - R * 0.14, length(b + vec2(0.0, R * 0.55)) - R * 0.15);
      col = mix(col, red, fillD(bang));
    } else {
      float ph = u_time * 1.2 + fi * 1.7;
      vec2 c = vec2(0.03 * cos(ph), 0.03 * sin(ph));
      vec2 s = rotA(d - c, -(ph + 1.5708));
      float body = segD(s, vec2(-R * 0.5, 0.0), vec2(R * 0.4, 0.0)) - R * 0.22 * (1.0 - 0.85 * smoothstep(R * 0.05, R * 0.6, s.x));
      float fin = segD(vec2(s.x, abs(s.y)), vec2(-R * 0.3, R * 0.15), vec2(-R * 0.65, R * 0.4)) - R * 0.08;
      float fl = length((s + vec2(R * 0.6, 0.0)) / vec2(R * (0.4 + 0.1 * sin(u_time * 25.0 + fi)), R * 0.15)) - 1.0;
      col = mix(col, mix(red, yel, smoothstep(0.0, -0.6, fl)), fillD(fl) * a.w);
      col = mix(col, red, fillD(fin) * a.w);
      col = mix(col, paper, fillD(body) * a.w);
      col = mix(col, INK, strokeD(min(body, fin), lw) * a.w);
    }
  }

  // events land as impact bursts: yellow for a finished turn, red for an error
  for (int i = 0; i < 12; i++) {
    if (i >= u_rippleCount) break;
    vec4 r = u_ripples[i];
    if (r.z > 1.6) continue;
    vec2 d = p - toP(r.xy);
    float isErr = step(abs(r.w - 1.0), 0.5);
    float grow = smoothstep(0.0, 0.35, r.z) * (1.0 - smoothstep(1.1, 1.6, r.z));
    float R = (r.w > 1.5 ? 0.04 : 0.07) * grow;
    if (R < 0.002) continue;
    float b = burst(rotA(d, r.x * 9.0), R, 12.0, 0.45, r.x * 50.0);
    float bi = burst(rotA(d, r.x * 9.0 + 0.3), R * 0.55, 9.0, 0.4, r.y * 50.0);
    col = mix(col, mix(yel, red, isErr), fillD(b));
    col = mix(col, mix(paper, yel, isErr), fillD(bi));
    col = mix(col, INK, strokeD(b, lw));
  }

  // pulpy newsprint: yellowed fibres, flecks, and a darkened edge of age
  float fib = noise(p * vec2(40.0, 380.0)) * 0.5 + noise(p * vec2(300.0, 60.0)) * 0.5;
  col *= 0.95 + 0.06 * fib;
  col = mix(col, col * vec3(1.0, 0.94, 0.8), p_age * (0.25 + 0.35 * smoothstep(0.35, 0.75, length(uv - 0.5))));
  col = mix(col, INK, step(0.995, hash21(floor(p * 420.0))) * 0.3 * p_age);
  return mix(u_canvas, col, p_color);
}`,Mu={id:"risograph-map",name:"Atomic Comics",source:zd,palette:["#e23b2e","#2b78cf","#ffd23f","#f3e6c8"],params:[g("drift","Action speed",0,3,1),g("dots","Ben-Day dot size",.5,2.5,1),g("ink","Ink line weight",.5,3,1.4),g("misreg","Misregistration",0,3,1),g("age","Newsprint age",0,2,1),g("color","Color strength",0,1,.92)]};var $d=`const int NS = 9;

vec2 perp(vec2 d){ return vec2(-d.y, d.x); }
vec2 rot2(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

vec3 starAt(int i, float W){
  float fi = float(i);
  float x = (-1.0 + 2.0*(fi + 0.25 + 0.5*hash21(vec2(fi, 1.3)))/float(NS))*W;
  float y = 0.24 + 0.22*hash21(vec2(fi, 7.9));
  float r = 0.014 + 0.016*hash21(vec2(fi, 4.1));
  return vec3(x, y, r);
}

vec4 vortex(int i, float W){
  return i == 0 ? vec4(-0.12*W - 0.02, 0.33, 0.14, 1.0) : vec4(0.26*W, 0.3, 0.09, -1.0);
}

float bandT(vec2 p, float sw){ return p.y + 0.035*sin(p.x*3.1 + sw*0.25) + 0.015*sin(p.x*7.7 - sw*0.35); }
float hillY(float x, float W){ return 0.015 + 0.09*smoothstep(0.0, -0.85, x/W) + 0.02*sin(x*2.0 + 0.6) + 0.012*sin(x*5.1 + 2.0); }
float shoreY(float x){ return -0.05 + 0.014*sin(x*3.0 + 1.0) + 0.008*sin(x*7.3); }
float railY(float x, float W){ return -0.12 - 0.24*(x + W)/(2.0*W); }
vec2 deckVP(float W){ return vec2(-W - 0.25, -0.06); }

// Van Gogh's cypress as a dark flame licking upward
float cyp(vec2 p, float cx, float sw){
  float h = (p.y + 0.52)/1.0;
  if (h < 0.0 || h > 1.0) return -1.0;
  float sway = 0.05*sin(sw*0.6 + cx*3.0)*h*h + 0.02*sin(h*9.0 - sw*1.3)*h;
  float lob = 1.0 + 0.3*sin(h*16.0 - sw*1.6 + cx*5.0) + 0.14*sin(h*37.0 - sw*2.4);
  return 0.09*pow(1.0 - h, 0.75)*lob - abs(p.x - cx - sway);
}

vec3 skyCol(vec2 p, float sw, float W){
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0];
  vec3 blood = red*vec3(0.88, 0.62, 0.55);
  vec3 cream = mix(yel, vec3(1.0, 0.97, 0.85), 0.5);
  vec2 dp = p - toP(u_pointer);
  vec2 q = p + rot2(dp, 1.6*exp(-dot(dp, dp)/0.008)) - dp;
  // Munch's sky: wavy bands of blood red, orange and yellow, deepening upward
  float bt = bandT(q, sw);
  float k = bt*13.0 + 0.5*sin(q.x*4.0 - sw*0.2);
  float band = 0.5 + 0.5*sin(k*3.1416);
  float hgt = smoothstep(0.03, 0.48, bt);
  vec3 low = mix(yel, mix(red, yel, 0.45), band);
  vec3 high = mix(red, blood, band);
  vec3 col = mix(low, high, hgt);
  col = mix(col, mix(blu, vec3(0.42, 0.62, 0.58), 0.5), smoothstep(0.93, 0.99, sin(bt*9.0 + 1.3 - q.x*0.6))*0.5);
  // Van Gogh's vortices churn through it
  for (int i = 0; i < 2; i++){
    vec4 v = vortex(i, W);
    vec2 d = q - v.xy;
    float r = length(d);
    float th = atan(d.y, d.x);
    float arm = 0.5 + 0.5*sin(2.0*v.w*th + r/v.z*(3.0 + 7.0*p_twist) - sw);
    float Lv = smoothstep(0.3, 0.85, arm)*smoothstep(0.0, 0.35, r/v.z);
    float wgt = exp(-r*r/(v.z*v.z))*min(p_twist + 0.3, 1.0);
    col = mix(col, mix(blood, mix(yel, cream, 0.4), Lv), wgt*0.85);
  }
  if (p.y > 0.08){
    for (int i = 0; i < NS; i++){
      vec3 s3 = starAt(i, W);
      float fi = float(i);
      float r = s3.z*(1.0 + 0.12*sin(sw*1.7 + fi*2.3));
      float d = length(p - s3.xy);
      if (d > r*4.0) continue;
      float halo = exp(-d*d/(r*r*4.5))*p_stars;
      float rings = 0.5 + 0.5*sin(d/r*6.5 - sw*1.4 + fi);
      col = mix(col, mix(yel, cream, rings), clamp(halo, 0.0, 1.0)*0.8);
      col = mix(col, vec3(1.0, 0.97, 0.82), smoothstep(r*0.6, r*0.35, d));
    }
    vec2 md = p - vec2(W - 0.2, 0.37);
    float ml = length(md);
    col = mix(col, mix(yel, cream, 0.5 + 0.5*sin(ml*90.0 - sw*1.2)), clamp(exp(-ml*ml/0.012)*p_stars, 0.0, 1.0)*0.75);
    float cres = smoothstep(0.048, 0.044, ml)*smoothstep(0.038, 0.042, length(md - vec2(-0.02, 0.014)));
    col = mix(col, cream, cres);
  }
  return col;
}

vec3 base(vec2 p, float t, float W){
  float sw = t*p_swirl;
  vec3 red = u_palette[2], yel = u_palette[1], blu = u_palette[0], drk = u_palette[3];
  vec3 col = skyCol(p, sw, W);
  // the far shore: blue-black hills across the fjord
  float hy = hillY(p.x, W);
  if (p.y < hy){
    float n = noise(vec2(p.x*7.0, p.y*40.0));
    float ridge = 0.5 + 0.5*sin((hy - p.y)*120.0 + n*4.0 + p.x*3.0);
    vec3 hc = mix(drk*0.9 + blu*0.15, mix(blu, drk, 0.35), ridge*0.6);
    col = mix(col, hc, smoothstep(hy, hy - 0.004, p.y));
  }
  // the fjord: deep blue water with the sky's fire caught in it
  float sy = shoreY(p.x);
  if (p.y < sy){
    float dep = clamp((sy - p.y)/0.25, 0.0, 1.0);
    vec3 wc = mix(blu*0.95, blu*0.45 + drk*0.35, dep);
    float rn = noise(vec2(p.x*2.6 - sw*0.05, (p.y + 0.02*sin(p.x*6.0 + sw*0.3))*30.0));
    wc = mix(wc, mix(red, yel, 0.5), smoothstep(0.62, 0.85, rn)*0.5*(1.0 - dep*0.6));
    col = mix(col, wc, smoothstep(sy, sy - 0.004, p.y));
  }
  // the bridge deck and its railing
  float ry = railY(p.x, W);
  float lo = ry - 0.075;
  if (p.y < ry + 0.016){
    vec3 wood = mix(red, drk, 0.45);
    if (p.y < lo){
      vec2 dv = p - deckVP(W);
      float pa = atan(dv.y, dv.x);
      float n = noise(vec2(pa*30.0, length(dv)*5.0));
      float pl = 0.5 + 0.5*sin(pa*150.0 + n*4.0);
      vec3 dk = mix(mix(red, yel, 0.3)*0.75, mix(red, drk, 0.4)*0.8, pl*0.7);
      dk = mix(dk, yel*0.85, smoothstep(0.75, 0.95, n)*0.3);
      col = dk*(0.86 + 0.14*smoothstep(-0.5, -0.25, p.y));
    }
    float px = abs(fract(p.x/0.11 + 0.3) - 0.5)*0.11;
    if (p.y < ry && p.y > lo - 0.006) col = mix(col, wood*0.85, smoothstep(0.0075, 0.005, px));
    col = mix(col, wood*0.9, smoothstep(0.0065, 0.0045, abs(p.y - lo)));
    vec3 rc = mix(wood, mix(red, yel, 0.35), smoothstep(-0.012, 0.012, p.y - ry)*0.6);
    col = mix(col, rc, smoothstep(0.014, 0.011, abs(p.y - ry)));
  }
  return col;
}

vec2 skyFlow(vec2 p, float sw, float W){
  vec2 v = vec2(1.0, -(0.1085*cos(p.x*3.1 + sw*0.25) + 0.1155*cos(p.x*7.7 - sw*0.35)));
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
    vec2 d = p - vec2(W - 0.2, 0.37);
    v += perp(d)/0.05*exp(-dot(d, d)/0.01)*2.0;
  }
  return v;
}

vec2 disturb(vec2 p){
  vec2 dp = p - toP(u_pointer);
  vec2 v = perp(dp)/0.07*exp(-dot(dp, dp)/0.005)*0.9;
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
  if (p.y < ry - 0.08){
    dir = p - deckVP(W);
  } else if (p.y < ry + 0.012){
    dir = vec2(1.0, -0.24/(2.0*W));
  } else if (p.y < shoreY(p.x)){
    dir = vec2(1.0, 0.15*sin(p.x*6.0 + sw*0.3));
  } else if (p.y < hillY(p.x, W)){
    dir = vec2(1.0, 0.04*cos(p.x*2.0 + 0.6) + 0.06*cos(p.x*5.1 + 2.0));
  } else {
    dir = skyFlow(p, sw, W);
  }
  dir = normalize(dir) + disturb(p);
  return atan(dir.y, dir.x);
}

vec3 scene(vec2 uv, vec2 p){
  float t = u_time;
  float W = 0.5*u_resolution.x/u_resolution.y;

  // long overlapping strokes laid along the local flow; the topmost one covering a pixel wins
  float cell = p_brush;
  float ang = formAng(p, t, W);
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 g0 = floor(p/cell);
  float bestPri = -1.0, sa = 0.0, sb = 0.0, sh = 0.0, shw = 1.0;
  vec2 sc = p;
  // strokes reach up to two cells, so search two cells out or they get clipped at cell edges
  for (int j = -2; j <= 2; j++)
  for (int i = -2; i <= 2; i++){
    vec2 id = g0 + vec2(float(i), float(j));
    float h = hash21(id);
    vec2 c = (id + 0.5 + (vec2(h, hash21(id + 3.3)) - 0.5)*0.8)*cell;
    vec2 g = (p - c)/cell;
    float a = dot(g, dir), b = dot(g, nrm);
    float L = 0.9 + 1.1*hash21(id + 7.7);
    float hw = (0.3 + 0.16*hash21(id + 5.1))*(1.0 - pow(clamp(abs(a)/L, 0.0, 1.0), 3.0));
    if (abs(a) < L && abs(b) < hw){
      float pri = hash21(id + 9.4);
      if (pri > bestPri){ bestPri = pri; sa = a/L; sb = b/max(hw, 1e-3); sh = h; shw = hw; sc = c; }
    }
  }
  vec3 col;
  if (bestPri < 0.0){
    col = base(p, t, W)*0.82;
  } else {
    col = base(sc + dir*sa*cell*0.35, t, W);
    col = mix(col, col*vec3(0.88, 0.96, 1.15), step(0.78, sh)*0.45);
    col = mix(col, col*vec3(1.12, 1.03, 0.86), step(sh, 0.16)*0.4);
    // impasto: a lit ridge on one flank, bristle grooves, a darker lip of paint at the edge
    float imp = p_impasto;
    col *= 1.0 + 0.16*imp*(smoothstep(0.6, -0.6, sb) - 0.5);
    col *= 1.0 - 0.06*imp*(0.5 + 0.5*sin(sb*9.0 + sh*30.0));
    col *= 1.0 - 0.14*imp*smoothstep(0.7, 1.0, abs(sb));
    col += 0.06*imp*smoothstep(0.35, 0.0, abs(sb + 0.45))*(1.0 - abs(sa));
  }
  col *= 0.97 + 0.05*noise(p*160.0);

  // the cypress, painted over the strokes as one dark flame with a clean edge and its own upward strokes
  {
    float sw = t*p_swirl;
    float cx = W - 0.09;
    float ins = cyp(p, cx, sw);
    if (ins > -0.006){
      float k = clamp((p.y + 0.52), 0.0, 1.0);
      vec2 fq = vec2((p.x - cx)*55.0 + 2.0*sin(p.y*10.0 - sw*1.4), p.y*7.0 - sw*0.3);
      float flame = noise(fq)*0.65 + noise(fq*vec2(2.3, 1.7) + 4.0)*0.35;
      vec3 drkC = u_palette[3];
      vec3 cc = mix(drkC*0.5 + vec3(0.0, 0.03, 0.02), mix(drkC, vec3(0.16, 0.36, 0.24), 0.55), smoothstep(0.45, 0.85, flame));
      cc = mix(cc, mix(u_palette[0], drkC, 0.5), smoothstep(0.78, 0.92, noise(fq*vec2(1.2, 3.0) - 7.0))*0.45);
      cc *= 0.85 + 0.2*smoothstep(0.0, 0.03, ins)*(1.0 - 0.3*k);
      col = mix(col, cc, smoothstep(-0.0015, 0.0015, ins + (noise(p*140.0) - 0.5)*0.003));
    }
  }

  // two top-hatted walkers on the bridge
  vec3 drk = u_palette[3];
  for (int k = 0; k < 2; k++){
    float wx = -W*(0.66 - 0.08*float(k)) + 0.004*sin(t*0.9 + float(k));
    float fy = railY(wx, W) - 0.09;
    float H = 0.115 - 0.012*float(k);
    float ky = (p.y - fy)/H;
    float coat = abs(p.x - wx) - 0.016*(1.0 - 0.35*clamp(ky, 0.0, 1.0));
    coat = max(coat, max(-ky, ky - 0.74)*H);
    float head = length(p - vec2(wx, fy + H*0.82)) - 0.0105;
    float hat = max(abs(p.x - wx) - 0.0095, abs(p.y - fy - H*0.97) - 0.011);
    hat = min(hat, max(abs(p.x - wx) - 0.016, abs(p.y - fy - H*0.89) - 0.002));
    float wd = min(min(coat, head), hat);
    col = mix(col, drk*0.5, smoothstep(0.0012, -0.0012, wd));
  }

  vec3 warm = mix(u_palette[1], vec3(1.0, 0.97, 0.8), 0.45);
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
      col = mix(col, mix(u_palette[1], warm, rings), halo*0.8*a.w);
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
}`,Fu={id:"swirling-stars-screaming-fjord",name:"Starry Fjord",source:$d,palette:["#1f3c96","#f6c84a","#e2481f","#0e1630"],params:[g("swirl","Swirl speed",0,3,1.2,.05),g("twist","Vortex twist",0,2,1,.05),g("brush","Brush size",.01,.04,.02,.001),g("impasto","Paint thickness",0,2,1,.05),g("stars","Star glow",0,1.5,1,.05),g("color","Color strength",0,1,.92)]};var Sd=`struct Ink { float v; float carve; float edge; float reg; };

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

// Fuji on the horizon: concave slopes, a snowcap with a ragged hem; x = sdf, y = snow
vec2 fuji(vec2 p, float W){
  float fx = -W*0.38, base = 0.06, H = 0.21*p_fuji;
  if (H < 0.005) return vec2(1.0, 0.0);
  float k = clamp((p.y - base)/H, 0.0, 1.0);
  float hw = 0.26*pow(1.0 - k, 1.8) + 0.016;
  float d = max(abs(p.x - fx) - hw, p.y - base - H);
  float hem = 0.64 + 0.04*sin((p.x - fx)*110.0) + 0.03*sin((p.x - fx)*47.0);
  return vec2(d, step(hem, k));
}

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
    float r = cw*(0.42 + 0.3*h)*g*(1.0 + 0.14*sin(u_time*1.8 + h*6.3));
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
    vec2 fj = fuji(p, W);
    if (fj.x < 0.0){ o.reg = 0.8; o.v = fj.y; }
    float m = min(mistSdf(p, T, 0.31, 0.02, 1.7), mistSdf(p, T, 0.18, 0.015, 5.3));
    if (m < 0.0) o.reg = 0.5;
    o.edge = min(min(sF, min(sM, sN)), abs(m));
    if (m >= 0.0) o.edge = min(o.edge, min(abs(md), abs(fj.x)));
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
    col = mix(col, navy*0.85, smoothstep(0.3, 0.5, pw.y)*0.3);
  } else if (A.reg < 0.4){
    col = mix(mix(paper, lant, 0.35), lant, smoothstep(0.02, 0.05, length(pw - moonP(W)))*0.6);
  } else if (A.reg < 0.7){
    col = mix(mix(teal, paper, 0.28), mix(navy, teal, 0.7), smoothstep(0.02, -0.02, pw.y - (pw.y > 0.25 ? 0.31 : 0.18))*0.6);
  } else if (A.reg < 0.9){
    // Fuji: prussian-blue flanks graded toward the base, a paper-white snowcap
    float fk = clamp((pw.y - 0.06)/0.21, 0.0, 1.0);
    col = mix(mix(navy, teal, 0.55), navy*0.85, fk);
    col = mix(col, mix(paper, teal, 0.12), A.v);
    col = mix(col, mix(lant, paper, 0.3), clamp(w, 0.0, 1.0)*0.25);
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

  // spray thrown off the near crests, arcing up and falling back
  if (band > -0.02 && band < 0.16 && p_spray > 0.0){
    float cw = 0.022;
    float c0 = floor(pw.x/cw);
    for (int j = -2; j <= 1; j++){
      float c = c0 + float(j);
      float hc = hash21(vec2(c, 31.0));
      float cx0 = (c + hc)*cw;
      float g = smoothstep(0.45, 0.9, crest(cx0*4.0 - T*1.6 + 2.0));
      if (g < 0.05 || hc > 0.35 + 0.4*p_spray) continue;
      float f = fract(u_time*(0.35 + 0.25*hc) + hc*7.0);
      vec2 sp = vec2(cx0 + 0.05*f, nearY(cx0, T, W) + 0.1*g*sin(f*3.1416));
      float rr = (0.0045 + 0.004*hash21(vec2(c, 5.0)))*(1.0 - 0.6*f);
      col = mix(col, paper, smoothstep(rr, rr*0.6, length(pw - sp))*(1.0 - f*f)*g);
    }
  }

  float lw = max(0.0018, 2.2/u_resolution.y)*(K.reg > 2.5 ? 1.25 : 1.0)*(0.75 + 0.55*noise(p*70.0));
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

  // cherry-wood block: grain rings that swirl around knots, uneven baren pressure
  vec2 kc = floor(p/0.4);
  vec2 kp = (kc + 0.2 + 0.6*vec2(hash21(kc), hash21(kc + 5.0)))*0.4;
  vec2 kd = (p - kp)*vec2(1.0, 2.6);
  float knot = exp(-dot(kd, kd)/0.006)*step(0.55, hash21(kc + 9.0));
  float wg = p.y*170.0 + 7.0*noise(vec2(p.x*1.1, p.y*2.5)) + 1.5*noise(p*vec2(5.0, 16.0)) + 26.0*knot*length(kd)/0.08;
  float grain = pow(0.5 + 0.5*sin(wg), 3.0);
  float dens = 0.9 + 0.075*grain*p_wood + 0.05*noise(p*190.0);
  float press = noise(p*vec2(2.6, 4.2) + 11.0)*0.65 + noise(p*13.0 + 3.0)*0.35;
  dens -= smoothstep(0.55, 0.85, press)*0.12*p_wood;
  col = mix(paper, col, clamp(dens, 0.0, 1.0));
  float fib = noise(rot2(p, 0.6)*vec2(40.0, 520.0)) + noise(rot2(p, -1.1)*vec2(35.0, 480.0));
  col *= 0.96 + 0.04*fib;
  col += 0.035*smoothstep(1.35, 1.7, fib);

  return mix(u_canvas, col, p_color);
}`,Uu={id:"tide",name:"Tide",source:Sd,palette:["#15295a","#1e8a94","#ffa845","#efe2c4"],params:[g("swell","Swell speed",0,3,1,.05),g("height","Wave height",.3,1.6,1,.05),g("foam","Foam claws",0,1.6,1,.05),g("carve","Carved line density",.5,2,1,.05),g("glow","Lantern glow",0,2,1,.05),g("spray","Spray",0,2,1,.05),g("fuji","Mount Fuji",0,1.5,1,.05),g("wood","Wood grain",0,2,1,.05),g("color","Color strength",0,1,.92)]};var he=[Uu,Ou,Tu,Mu,Du,Lu,Fu,ju,Nu,Cu,qu],Vr=eo(he[0]);function eo(e){return{name:e.name,source:e.source,palette:[...e.palette],params:e.params.map(t=>({...t})),baseId:e.id}}i(eo,"sceneOf");function Hr(e){let t=he.find(r=>r.id===e.baseId);if(!t)return e;let o=new Map(e.params.map(r=>[r.id,r.value]));return{...eo(t),name:e.name,palette:e.palette,params:t.params.map(r=>{let n=o.get(r.id);return n===void 0?{...r}:{...r,value:Math.min(r.max,Math.max(r.min,n))}})}}i(Hr,"rebuildBuiltIn");function fl(e,t){let o=Object.fromEntries(new Intl.DateTimeFormat("en-US",{timeZone:e,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",hourCycle:"h23"}).formatToParts(t).map(n=>[n.type,n.value])),r=new Intl.DateTimeFormat("en-US",{timeZone:e,weekday:"long",month:"long",day:"numeric",hour:"numeric",minute:"2-digit"}).format(t);return{date:`${o.year}-${o.month}-${o.day}`,hour:Number(o.hour),label:r}}i(fl,"localMoment");function Yr(e){return`0 ${e} * * *`}i(Yr,"dailyCron");function to(e){let t=/^0 (\d{1,2}) \* \* \*$/.exec(e??"");return t?Number(t[1]):null}i(to,"cronHour");function dl(e){let t={};for(let o of e)/^\d{1,2}$/.test(o)?t.hour=Number(o):t.timeZone=o;return t}i(dl,"parseDailyOptions");var pl=["bioluminescent tide pool at night, agents as glowing jellyfish","aurora over a frozen lake, agents as drifting lanterns on the ice","koi pond from above, agents as koi that leave wakes","rain running down a window with city bokeh behind it, agents as passing headlights","ink blooming in water, agents as drops that keep feeding new blooms","murmuration of starlings at dusk, agents as the birds leading the flock","slow meteor shower over a desert, agents as comets with tails","paper-cut mountain ranges in parallax, agents as hot-air balloons","lava lamp, agents as rising wax blobs","wheat field swaying in wind, agents as gusts moving through it","coral reef caustics, agents as small bright fish","neon fog over a night city, agents as moving signs","snow falling under streetlights, agents as the lamps","deep-space nebula with slow gas currents, agents as newborn stars","cloud chamber with particle trails, agents as the particle sources","sun through slowly turning window blinds, agents as floating dust motes","ocean swell from above with foam lines, agents as small boats","moss and ferns on a forest floor with drifting pollen, agents as fireflies","stained glass lit from behind by a moving sun, agents as brighter panes","sand dunes shifting at golden hour, agents as wandering caravans"];function Bu(e){let[t,o,r]=e.split("-").map(Number),n=Math.floor(Date.UTC(t,o-1,r)/864e5);return pl[n%pl.length]}i(Bu,"dailyConcept");function Pd(e,t){return t?[`Paint a new Ambient scene: the living background bb shows behind its UI. It is ${e.label} in the user's time zone.`,`The user asked for: ${JSON.stringify(t)}`,"After researching the style (step 1 below) and before writing any GLSL, expand that request into a full concept the way an art director would, keeping the user's words at its center:","- The subject and setting, concretely.","- The art style, from your style sheet.","- A four-color palette sampled from your references that makes it vivid against bb's UI.","- The motion: what moves, and how wind, water, or light behaves.","- What working agents become (bright, characterful elements), what waiting agents do, and what ripples become: finished turns, and something red for errors.","- An evocative name under 40 characters.","Say the style sheet and the expanded concept in a few lines, then paint it."]:[`Paint today's Ambient scene: the living background bb shows behind its UI. It is ${e.label} in the user's time zone.`,`Today's starting concept: ${Bu(e.date)}. Make it your own, and let the season and time of day color it.`]}i(Pd,"conceptLines");function ml(e,t,o){return[...Pd(e,o),`The user's time zone is ${t}.`,"Paint for how bb frames the scene:","- bb's sidebar, a wide centered thread column, and the composer cover most of the middle of the window with frosted glass that blurs and tints what is behind it. The scene reads clearly only in the open areas: the side margins, the gaps between panels, and the strips along the top and bottom. action=look reports where they are in the user's current window, but the layout changes: the sidebar collapses, windows resize, and side panels open.","- Fill the frame edge to edge and never center a lone subject. Put the recognizable parts (horizon, silhouettes, characters, the brightest accents) where they are seen: along the edges, low in the frame, and repeated across the width. Under the glass only big shapes and color fields survive the blur, so give the middle large, soft masses of color, not fine detail.","- Work at a readable scale: key shapes should be 5 to 30% of the window's height. Texture (brushstrokes, grain, dots) is a surface on top of those shapes, never the whole idea.","- Build depth with at least three layers (far, middle, near), each with its own value and its own speed of motion, like parallax.","- Give it strong value structure and saturated color: clear lights and darks, all four palette colors visible, not one flat mid-tone or a single hue.","Paint in two passes, the way the built-in Poppy Hill does. It is the quality bar, and its full source is at the end of this brief:","- A subject function paints the scene plainly: forms, light, and depth in continuous color, with no style yet. Poppy Hill's base() draws the sky, hills, grass, and poppies; its clouds go on after the dab pass so their soft edges aren't chopped into dabs.","- A style pass re-renders the subject in the medium by resampling it, so the style shapes every pixel. Poppy Hill's dabLayer() cuts the window into jittered, oriented brush dabs; each dab takes one color from the subject, dab direction follows the form (level in the sky, upright and wind-bent in the grass), and two offset dab layers overlap with bristle streaks.","- Never draw flat smoothstep shapes and lay sine stripes or noise on top as texture. That reads as clip art however many layers it has.","- The style pass calls the subject once or twice per pixel, so keep the subject cheap.","Style passes that work:","- Painterly (impressionism, Van Gogh, oil, gouache): dab resampling like Poppy Hill. Set each dab's angle from the form or a flow field (for Van Gogh, the tangent of the swirling sky), make dabs larger and longer for bolder styles, shift each dab's color slightly toward a neighboring palette color for broken color, and shade dab edges for impasto.","- Pointillism: a staggered dot grid; each dot takes the subject's color at its center, snapped to pure palette colors with occasional complementary dots.","- Watercolor: warp the subject lookup with fbm so colors bleed, darken edges where the subject's color changes, add pigment granulation and paper grain, and leave light areas as bare paper.","- Claymation and soft 3D: model the subject as SDF shapes with height, light it from normals (key light, soft fill, rim, contact shadows, ambient occlusion), perturb the normals with thumbprint noise, soften the far layer like shallow depth of field, and step time at 12 frames per second for stop motion.","- Woodcut, linocut, ukiyo-e: posterize the subject into three or four flat inks with bold outlines, then carve lines whose direction follows the forms and whose spacing follows value; ukiyo-e adds soft bokashi gradients.","- Pixel art: sample the subject on a coarse grid, snap to the palette, and use ordered dithering.","It should feel alive, not like a still gradient:","- Continuous, visible motion at the default speed: things drift, flow, orbit, or fall. Layer at least two motions at different speeds.","- Agents (u_agents) are characters in the concept, not generic dots: give working agents movement or trails and let waiting agents pulse or call out.","- Ripples (u_ripples) are events in the concept, like splashes, bursts, or gusts. Errors (kind 1) read red or alarming.","- The cursor (u_pointer) disturbs the scene nearby.","- Stay readable behind text: the motion can be lively, but keep value contrast gentle where panels usually sit. Never fade, blank, lighten, or tint a region to match a panel's current position; fix readability in the composition itself.","Steps:","1. Research the style before designing anything. Search the web for the artwork, artist, or medium and how it is made, then download one or two reference images into your working directory and open them. Write a short style sheet: the three to five traits that make the style recognizable at a glance (mark shape and size, stroke direction, edges, lighting, texture, color relationships), each paired with the shader technique that will produce it. If you cannot search or view images, work from what you know and say so.","2. Call the ambient tool with action=get to read the shader contract and the current scene, and action=library to see recent scenes; make something clearly different from them.","3. Write the scene with action=set. Name it evocatively in under 40 characters, and expose 3 to 6 params someone would enjoy tuning (for example speed of a motion, density, glow, trail length).","4. If set reports a compile error or that the scene is too heavy, fix the GLSL and set it again.","5. Call action=look with ripple=done. Its first image is the scene behind bb's real UI as the user sees it, with text drawn as bars; judge that image, not the raw scene. Write a short, honest critique that answers each question:","   - Could someone name the concept from the open areas alone within two seconds?","   - Put it next to your reference images: would someone who knows the style name it? What are the three biggest differences from the references and from Poppy Hill's finish?","   - Are there three layers of depth, clear lights and darks, and all four palette colors?","   - Is the text readable? The report counts words the scene made harder to read and outlines them in red.","   - Does the report flag anything (too faint, nearly still, too heavy, hidden subject, hard to read)?","   Then fix the weakest answer with action=set and look again. A report that flags nothing only rules out technical failures; it does not mean the scene is good. Revise at least twice after the first look unless every answer is a clear yes, and stop after six looks.","6. Call action=save so the scene lands in the library.","If set says no bb window verified the scene, stop and say so instead of saving.","Finish with one sentence describing the scene, and one sentence on what you would still improve.","","Poppy Hill, the quality bar. Study how base() and dabLayer() work together; do not reuse its subject:",Kr].join(`
`)}i(ml,"dailyPrompt");import{defineRpcContract as Zd}from"@get-bb/plugin-sdk";var gt=u.string().regex(Iu),De=u.tuple([gt,gt,gt,gt]),Id=u.object({id:u.string().regex(Wr),label:u.string().min(1).max(40),min:u.number().finite(),max:u.number().finite(),step:u.number().positive().finite(),value:u.number().finite()}).refine(e=>e.max>e.min,"max must exceed min"),Le=u.object({name:u.string().min(1).max(60),source:u.string().min(1).max(32e3),params:u.array(Id).max(12).refine(e=>new Set(e.map(t=>t.id)).size===e.length,"param ids must be unique"),palette:De,baseId:u.string().optional()}),oo=u.string().trim().min(1).max(60).regex(/^[^\p{Cc}\p{Cf}]+$/u,"scene names must be a single line of plain text"),ro=u.string().trim().min(3).max(400).regex(/^[^\p{Cc}\p{Cf}]+$/u,"describe the scene in a single line of plain text");function Ju(e){return ce.find(t=>t.key===e)}i(Ju,"controlSpec");function hl(e){let t=Ju(e);return u.number().min(t.min).max(t.max)}i(hl,"controlRange");var Rd={enabled:u.boolean(),showThrough:hl("showThrough"),speed:hl("speed"),glass:hl("glass")},ve=u.object(Rd);function vl(e){let t=Ju(e);return u.number().finite().catch(t.default).transform(o=>Ru(t,o))}i(vl,"storedControl");var Ku=u.object({enabled:u.boolean().catch(!0),showThrough:vl("showThrough"),speed:vl("speed"),glass:vl("glass")}),bl=u.object({kind:u.enum(["builtIn","saved"]),id:u.string().min(1)}),le=u.object({revision:u.number().int().nonnegative(),sceneRevision:u.number().int().nonnegative(),scene:Le,ref:bl.nullable(),controls:ve}),Ed=u.object({sceneId:u.string().min(1).nullable(),values:u.record(u.string(),u.number().finite()),palette:De,controls:ve}).strict(),yl=u.object({id:u.string().min(1),scene:Le,original:Le.optional(),savedAt:u.number().int().nonnegative()}),Vu=u.object({values:u.record(u.string(),u.number().finite()),palette:De,scene:Le.optional()}),Hu=u.array(u.object({id:u.string().min(1),name:u.string(),savedAt:u.number().int().nonnegative()})),wl=u.enum(["done","error","started"]),Ad=u.object({working:u.number().int().nonnegative(),waiting:u.number().int().nonnegative()}),Td=u.object({fromBackground:u.number().min(0).max(1),spread:u.number().min(0).max(1),motion:u.number().min(0).max(1),frameMs:u.number().min(0).max(1e4),detail:u.number().min(0).max(1)}),Od=u.object({width:u.number().positive(),height:u.number().positive(),panels:u.array(u.object({x0:u.number(),y0:u.number(),x1:u.number(),y1:u.number()})).max(64),openArea:u.number().min(0).max(1),openSpread:u.number().min(0).max(1),coveredSpread:u.number().min(0).max(1),text:u.object({words:u.number().int().nonnegative(),median:u.number().nonnegative(),worst:u.number().nonnegative(),hardToRead:u.number().int().nonnegative(),examples:u.array(u.object({x:u.number(),y:u.number(),contrast:u.number()})).max(3)})}),Cd=u.object({dataUrl:u.string().max(8e6).startsWith("data:image/png;base64,"),report:Od}),jd=u.object({requestId:u.string().min(1),dataUrl:u.string().max(6e6).startsWith("data:image/png;base64,"),summary:Ad,visibility:Td,dark:u.boolean(),context:Cd.optional()}).strict(),Gr=u.string().min(1).max(64).refine(e=>{try{return new Intl.DateTimeFormat("en-US",{timeZone:e}),!0}catch{return!1}},"unknown time zone"),Wu=u.object({enabled:u.boolean(),hour:u.number().int().min(0).max(23),timeZone:Gr,automationId:u.string().nullable(),nextRunAt:u.number().nullable(),lastRunAt:u.number().nullable()}),_l=u.object({enabled:u.boolean(),hour:u.number().int().min(0).max(23),timeZone:Gr}).partial().strict(),Yu=Zd({state:{input:u.null(),output:le},setValues:{input:u.object({values:u.record(u.string(),u.number().finite())}).strict(),output:le},setPalette:{input:u.object({palette:De}).strict(),output:le},setControls:{input:ve.partial().strict(),output:le},loadScene:{input:u.object({id:u.string().min(1)}).strict(),output:le},restore:{input:Ed,output:le},resetScene:{input:u.object({id:u.string().min(1)}).strict(),output:le},saveScene:{input:u.object({name:oo.optional()}).strict(),output:u.object({id:u.string()})},deleteScene:{input:u.object({id:u.string().min(1)}).strict(),output:u.object({deleted:u.boolean()})},library:{input:u.null(),output:u.object({entries:u.array(u.object({id:u.string(),name:u.string(),builtIn:u.boolean(),tweaked:u.boolean()}))})},reportCompile:{input:u.object({sceneRevision:u.number().int().nonnegative(),ok:u.boolean(),log:u.string().max(8e3).optional()}).strict(),output:u.object({accepted:u.boolean()})},reportContext:{input:u.object({event:u.enum(["lost","restored"]),occurredAt:u.iso.datetime(),rendererId:u.uuid(),sceneRevision:u.number().int().nonnegative().nullable(),visible:u.boolean(),drawingScene:u.boolean(),width:u.number().int().nonnegative(),height:u.number().int().nonnegative(),detail:u.number().min(0).max(1)}).strict(),output:u.object({accepted:u.boolean()})},submitCapture:{input:jd,output:u.object({accepted:u.boolean()})},daily:{input:u.null(),output:Wu},setDaily:{input:_l,output:Wu},paintNow:{input:u.null(),output:u.object({threadId:u.string().nullable()})},paintRequest:{input:u.object({request:ro}).strict(),output:u.object({threadId:u.string()})},heartbeat:{input:u.null(),output:u.object({ok:u.boolean()})}}),lv=u.object({requestId:u.string().min(1),ripple:wl.nullable()});function Gu(e){return e.issues.map(t=>`${t.path.join(".")||"input"}: ${t.message}`).join(`
`)}i(Gu,"formatIssues");var Xr="state",Xu="daily",xt="library/",Qr="tweaks/",Qu="last-good",en="library-index",ep=6e3,Nd=8e3,bt="proj_personal",Ld=3*6e4,Dd="automations",qd="Ambient: new scene every morning",tp="high",op="Paint today's Ambient scene: call the ambient tool with action=brief and follow the instructions it returns.",Md=u.object({automationId:u.string().nullable().catch(null),hour:u.number().int().min(0).max(23).catch(8),timeZone:Gr.catch(()=>Intl.DateTimeFormat().resolvedOptions().timeZone)}),rp=u.object({id:u.string(),enabled:u.boolean(),trigger:u.object({triggerType:u.string(),cron:u.string().optional(),timezone:u.string().optional()}),nextRunAt:u.number().nullable(),lastRunAt:u.number().nullable()}),np=u.object({providerId:u.string().min(1),model:u.string().min(1),reasoningLevel:u.string().min(1)});function tn(e,t){let o=Object.keys(t).filter(r=>!e.params.some(n=>n.id===r));if(o.length>0)throw new Error(`unknown param ${o.map(r=>JSON.stringify(r)).join(", ")}; scene params are ${e.params.map(r=>r.id).join(", ")||"none"}`);return{...e,params:e.params.map(r=>Object.hasOwn(t,r.id)?{...r,value:Math.min(r.max,Math.max(r.min,t[r.id]))}:r)}}i(tn,"applyValues");function kl(e,t){let o=i(r=>JSON.stringify([r.name,r.source,r.palette,r.params.map(n=>[n.id,n.label,n.min,n.max,n.step,n.value])]),"key");return o(e)===o(t)}i(kl,"sameScene");function Fd(e){return e.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"scene"}i(Fd,"slugOf");function ap(e,t,o){if(!t.has(e.toLowerCase()))return e;let r=2;for(;t.has(`${e}${o}${r}`.toLowerCase());)r+=1;return`${e}${o}${r}`}i(ap,"nextFree");function ip(e,t){let o=new Set([...he,...t].map(r=>r.name.toLowerCase()));return o.has(e.toLowerCase())?ap(e.slice(0,56),o," "):e}i(ip,"uniqueName");function Ud(e,t){return ap(Fd(e),new Set([...he,...t].map(o=>o.id)),"-")}i(Ud,"uniqueId");function zl(e){return typeof e=="object"&&e!==null}i(zl,"isRecord");function sp(){return{revision:1,sceneRevision:1,scene:Vr,ref:{kind:"builtIn",id:Vr.baseId},controls:Jr}}i(sp,"initialState");function cp(e){let t=e.storage.kv,o=new Map,r=new Map,n=0,s=Promise.resolve();function a(m){let v=s.then(m,m);return s=v.catch(()=>{}),v}i(a,"serialized");async function c(){let m=Hu.safeParse(await t.get(en));if(m.success)return m.data;let v=await t.list(xt),k=(await Promise.all(v.map(z=>t.get(z)))).map(z=>yl.safeParse(z)).flatMap(z=>z.success?[{id:z.data.id,name:z.data.scene.name,savedAt:z.data.savedAt}]:[]).sort((z,I)=>I.savedAt-z.savedAt);return await t.set(en,k),k}i(c,"readIndex");async function l(m){let v=yl.safeParse(await t.get(`${xt}${m}`));return v.success?v.data:null}i(l,"readEntry");async function p(m){let v=he.find(k=>k.name===m.name);if(v)return{kind:"builtIn",id:v.id};let x=(await c()).find(k=>k.name===m.name);return x?{kind:"saved",id:x.id}:null}i(p,"deriveRef");async function d(){let m=await t.get(Xr);if(m===void 0)return sp();let v=zl(m)?m:{},x=u.number().int().nonnegative().safeParse(v.revision),k=u.number().int().nonnegative().safeParse(v.sceneRevision),z=Le.safeParse(v.scene),I=bl.nullable().safeParse(v.ref),E=Ku.safeParse(v.controls??{});(!x.success||!z.success)&&e.log.warn("Ambient state failed validation; keeping the parts that still parse");let j=z.success?Hr(z.data):Vr,G=x.success?x.data:1;return{revision:G,sceneRevision:k.success?k.data:G,scene:j,ref:z.success&&I.success&&"ref"in v?I.data:await p(j),controls:E.success?E.data:Jr}}i(d,"readState");async function h(m,v){let x=await d(),k=Math.max(x.revision+1,Date.now()),z=le.parse({...m,revision:k,sceneRevision:v.sceneChanged?k:x.sceneRevision});return await t.set(Xr,z),e.realtime.publish("state",{revision:z.revision,sceneRevision:z.sceneRevision}),z}i(h,"writeState");function y(m,v){return a(async()=>{let x=await h(await m(await d()),v);return v.autosave&&await Z(x),x})}i(y,"update");function w(){return a(async()=>{let m=await t.get(Xr);if(m===void 0){let{revision:x,sceneRevision:k,...z}=sp();await h(z,{sceneChanged:!0});return}if(!zl(m))return;(!("ref"in m)||zl(m.controls)&&"quality"in m.controls)&&await t.set(Xr,le.parse(await d()))})}i(w,"migrate");async function Z(m){let{scene:v,ref:x}=m;if(!x||o.has(m.sceneRevision))return;if(x.kind==="builtIn"){let z=`${Qr}${x.id}`,I=await t.get(z)===void 0;await t.set(z,{values:Eu(v.params),palette:v.palette,...v.baseId===x.id?{}:{scene:v}}),I&&e.realtime.publish("library",{id:x.id});return}let k=await l(x.id);!k||kl(k.scene,v)||(await t.set(`${xt}${x.id}`,{...k,original:k.original??k.scene,scene:v}),k.original===void 0&&e.realtime.publish("library",{id:x.id}))}i(Z,"autosave");async function Y(m){let v=m.trim().toLowerCase(),x=he.find(I=>I.id===v||I.name.toLowerCase()===v);if(x){let I={kind:"builtIn",id:x.id},E=eo(x),j=Vu.safeParse(await t.get(`${Qr}${x.id}`));if(!j.success)return{scene:E,ref:I};if(j.data.scene)return{scene:j.data.scene,ref:I};let G=Object.fromEntries(Object.entries(j.data.values).filter(([Pe])=>E.params.some(qe=>qe.id===Pe)));return{scene:{...tn(E,G),palette:j.data.palette},ref:I}}let k=(await l(m.trim()))?.id??(await c()).find(I=>I.name.toLowerCase()===v)?.id,z=k?await l(k):null;if(!z)throw new Error(`no scene matches ${JSON.stringify(m)}`);return{scene:Hr(z.scene),ref:{kind:"saved",id:z.id}}}i(Y,"resolveScene");function D(m){return y(async v=>({...v,...await Y(m)}),{sceneChanged:!0})}i(D,"loadScene");function yt(m){return a(async()=>{let v=await d(),x=he.find(E=>E.id===m);if(x)return await t.delete(`${Qr}${x.id}`),e.realtime.publish("library",{id:x.id}),h({scene:eo(x),ref:{kind:"builtIn",id:x.id},controls:{...Jr,enabled:v.controls.enabled}},{sceneChanged:!0});let k=await l(m);if(!k)throw new Error(`no scene matches ${JSON.stringify(m)}`);let{original:z,...I}=k;if(!z)throw new Error(`${k.scene.name} has no edits to reset`);return await t.set(`${xt}${m}`,{...I,scene:z}),e.realtime.publish("library",{id:m}),h({...v,scene:Hr(z),ref:{kind:"saved",id:m}},{sceneChanged:!0})})}i(yt,"resetScene");function on(m){return a(async()=>{let v=await d();if(m.sceneId===null&&v.ref!==null)throw new Error("that step belongs to an unsaved scene that is no longer open");let x=m.sceneId!==null&&m.sceneId!==v.ref?.id,k=x?await Y(m.sceneId):v,z=Object.fromEntries(Object.entries(m.values).filter(([j])=>k.scene.params.some(G=>G.id===j))),I={...tn(k.scene,z),palette:m.palette},E=await h({scene:I,ref:k.ref,controls:ve.parse(m.controls)},{sceneChanged:x});return kl(k.scene,I)||await Z(E),E})}i(on,"restore");function ee(m){return a(async()=>{let v=await d(),x=await c(),k=m??v.scene.name,z=v.ref?.kind==="saved"?x.find(Ze=>Ze.id===v.ref.id):void 0,I=z&&z.name.toLowerCase()===k.toLowerCase()?z:void 0,E=I?k:ip(k,x),j=I?.id??Ud(E,x),G={...v.scene,name:E},Pe=I?await l(j):null,qe=Pe?.original??(Pe&&!kl(Pe.scene,G)?Pe.scene:void 0),ue=Date.now();return await t.set(`${xt}${j}`,{id:j,scene:G,...qe?{original:qe}:{},savedAt:ue}),await t.set(en,[{id:j,name:E,savedAt:ue},...x.filter(Ze=>Ze.id!==j)]),e.realtime.publish("library",{id:j}),await h({...v,scene:G,ref:{kind:"saved",id:j}},{sceneChanged:!1}),j})}i(ee,"saveScene");function N(m){return a(async()=>{let v=`${xt}${m}`;if(await t.get(v)===void 0)return!1;await t.delete(v),await t.set(en,(await c()).filter(k=>k.id!==m)),e.realtime.publish("library",{id:m});let x=await d();return x.ref?.kind==="saved"&&x.ref.id===m&&await h({...x,ref:null},{sceneChanged:!1}),!0})}i(N,"deleteScene");async function q(){let m=await c();return[...await Promise.all(he.map(async v=>({id:v.id,name:v.name,builtIn:!0,tweaked:await t.get(`${Qr}${v.id}`)!==void 0}))),...await Promise.all(m.map(async v=>({id:v.id,name:v.name,builtIn:!1,tweaked:(await l(v.id))?.original!==void 0})))]}i(q,"library");function no(m){return new Promise(v=>{let x=setTimeout(()=>{o.delete(m),v(null)},ep);o.set(m,k=>{clearTimeout(x),o.delete(m),v(k)})})}i(no,"awaitCompile");function io(m,v){return a(async()=>{let x=await d();x.sceneRevision===m&&await h({...x,scene:v.scene,ref:v.ref},{sceneChanged:!0})})}i(io,"revert");async function rn(m){let{previous:v,next:x,compiled:k}=await a(async()=>{let I=await d(),E=typeof m=="function"?m(I):m,j=E.source!==void 0||E.params!==void 0,G=E.name!==void 0&&E.name!==I.scene.name,{baseId:Pe,...qe}=I.scene,ue={...j?qe:I.scene,...G?{name:ip(E.name,await c())}:{},...E.source===void 0?{}:{source:E.source},...E.palette===void 0?{}:{palette:E.palette},...E.params===void 0?{}:{params:E.params.map(ao=>({...ao,step:ao.step??(ao.max-ao.min)/100}))}};if(E.values&&(ue=tn(ue,E.values)),ue=Le.parse(ue),j&&!/\bvec3\s+scene\s*\(/.test(ue.source))throw new Error("source must define vec3 scene(vec2 uv, vec2 p)");let Ze=await h({scene:ue,ref:G?null:I.ref,controls:ve.parse({...I.controls,...E.controls})},{sceneChanged:j}),wp=j?no(Ze.sceneRevision):null;return j||await Z(Ze),{previous:I,next:Ze,compiled:wp}});if(!k)return x;let z=await k;if(!z?.ok)throw await io(x.sceneRevision,v),new Error(z===null?`No visible bb window verified ${x.scene.name} within ${ep/1e3}s, so it was not applied. Ask the user to bring bb to the foreground and try again.`:`The scene was not applied; the previous scene was restored.
${z.log??""}`);return a(async()=>{await t.set(Qu,x.scene);let I=await d();return I.sceneRevision===x.sceneRevision&&await Z(I),I})}i(rn,"editScene");async function fp(m,v){n=Date.now();let x=o.get(m);return x?(x(v),!0):v.ok?(await a(async()=>{let k=await d();k.sceneRevision===m&&await t.set(Qu,k.scene)}),!0):!1}i(fp,"reportCompile");function dp(m){return new Promise(v=>{let x=setTimeout(()=>{r.delete(m.requestId),v(null)},Nd);r.set(m.requestId,k=>{clearTimeout(x),r.delete(m.requestId),v(k)}),e.realtime.publish("capture",m)})}i(dp,"capture");function mp(m,v){n=Date.now();let x=r.get(m);return x?.(v),x!==void 0}i(mp,"submitCapture");function hp(){n=Date.now()}i(hp,"heartbeat");async function nn(){let m=Md.safeParse(await t.get(Xu)??{});return m.success?m.data:{automationId:null,hour:8,timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone}}i(nn,"readStoredDaily");function so(m,v,x){return e.sdk.plugins.callRpc({pluginId:Dd,method:m,input:v,outputSchema:x})}i(so,"automations");async function sn(m){if(!m)return null;let x=(await so("automations_list",{projectId:bt},u.array(u.unknown()))).find(z=>u.object({id:u.literal(m)}).safeParse(z).success);if(x===void 0)return null;let k=rp.safeParse(x);if(!k.success)throw new Error("The daily scene automation can't be read. Check it in Automations.");return k.data}i(sn,"readAutomation");async function an(){let m=await nn(),v=await sn(m.automationId);return{enabled:v?.enabled??!1,hour:to(v?.trigger.cron)??m.hour,timeZone:v?.trigger.timezone??m.timeZone,automationId:v?.id??null,nextRunAt:v?.nextRunAt??null,lastRunAt:v?.lastRunAt??null}}i(an,"readDaily");async function vp(){let m=np.safeParse(await e.sdk.projects.defaultExecutionOptions({projectId:bt}));if(m.success)return m.data;let[v]=await e.sdk.threads.list({projectId:bt,limit:1});if(v){let x=np.omit({providerId:!0}).safeParse(await e.sdk.threads.defaultExecutionOptions({threadId:v.id}));if(x.success)return{providerId:v.providerId,...x.data}}throw new Error("Start a thread in your personal workspace first so bb knows which agent to use.")}i(vp,"agentDefaults");async function gp(m,v){let x=await vp();return(await so("automations_create",{projectId:bt,name:qd,enabled:!0,origin:"app",trigger:{triggerType:"schedule",cron:Yr(m),timezone:v},execution:{mode:"agent",prompt:op,providerId:x.providerId,model:x.model,reasoningLevel:tp,permissionMode:"auto",environment:{type:"project-default"}}},rp)).id}i(gp,"createDailyAutomation");function xp(m){return a(async()=>{let v=await nn(),x=await sn(v.automationId),k=m.hour??to(x?.trigger.cron)??v.hour,z=m.timeZone??x?.trigger.timezone??v.timeZone;if(!x&&m.enabled)x=await sn(await gp(k,z));else if(x){let I={projectId:bt,automationId:x.id};(to(x.trigger.cron)!==k||x.trigger.timezone!==z)&&await so("automations_update",{...I,trigger:{triggerType:"schedule",cron:Yr(k),timezone:z}},u.unknown()),m.enabled!==void 0&&m.enabled!==x.enabled&&await so(m.enabled?"automations_resume":"automations_pause",I,u.unknown())}return await t.set(Xu,{automationId:x?.id??null,hour:k,timeZone:z}),e.realtime.publish("daily",{automationId:x?.id??null}),an()})}i(xp,"updateDaily");async function bp(m){return(await e.sdk.threads.spawn({projectId:bt,environment:{type:"project-default"},permissionMode:"auto",reasoningLevel:tp,title:m?`Ambient: ${m.length>48?`${m.slice(0,47)}\u2026`:m}`:"Ambient: today's scene",prompt:m?`Paint a new Ambient scene the user described: ${JSON.stringify(m)}. Call the ambient tool with action=brief and request set to exactly that text, then follow the instructions it returns.`:op})).id}i(bp,"spawnPainter");async function yp(m,v){if(m.getTime()-n>Ld)return"No bb window is open, so the scene can't be checked. Stop now without changing the scene and say it was skipped because bb wasn't open.";let{timeZone:x}=await an().catch(()=>nn());return ml(fl(x,m),x,v)}return i(yp,"brief"),w().catch(m=>{e.log.warn(`Ambient could not migrate its saved state: ${m instanceof Error?m.message:String(m)}`)}),{readState:d,editScene:rn,setControls:i(m=>y(v=>({...v,controls:ve.parse({...v.controls,...m})}),{sceneChanged:!1}),"setControls"),loadScene:D,restore:on,resetScene:yt,saveScene:ee,deleteScene:N,library:q,reportCompile:fp,capture:dp,submitCapture:mp,heartbeat:hp,readDaily:an,updateDaily:xp,spawnPainter:bp,brief:yp}}i(cp,"createOperations");function $l(e,t){let o=i(a=>`${Math.round(a*100)}%`,"percent"),r=`Measured against bb's ${t?"dark":"light"} background: ${o(e.fromBackground)} average color difference, ${o(e.spread)} brightness variation, ${(e.motion*100).toFixed(1)}% change over one second. One frame takes ${e.frameMs.toFixed(1)} ms to render at ${o(e.detail)} detail.`,n=[e.fromBackground<.06&&"the scene is nearly the same color as bb's background, so it will be close to invisible behind bb's veil",e.spread<.025&&"the scene is almost flat, with little visible structure"].filter(Boolean),s=[n.length>0&&`Too faint: ${n.join("; ")}. The veil already adapts to the theme, so do not darken or wash out the scene yourself; raise its contrast and color.`,e.motion<.0025&&"Nearly still: almost nothing moved in a second at the user's speed. Give the scene visible, continuous motion.",e.frameMs>8&&"Too heavy: frames should render in under 8 ms or bb slows down. Use fewer loop iterations and fbm octaves, and never call fbm inside the per-agent or per-ripple loops."].filter(Boolean);return[r,...s].join(" ")}i($l,"describeVisibility");function Sl(e){let t=i(c=>`${Math.round(c*100)}%`,"percent"),o=i((c,l)=>`${c.toFixed(2)}\u2013${l.toFixed(2)}`,"range"),r=e.panels.map(c=>`x ${o(c.x0,c.x1)}, y ${o(c.y0,c.y1)}`).join("; "),{text:n}=e,s=[`The first image is the scene as the user sees it: behind bb's real panels and frosted glass, with each word of bb's text drawn as a bar in its real color and position, in a ${Math.round(e.width)}\xD7${Math.round(e.height)} window. Judge the scene by that image. The second image is the raw scene.`,`bb's panels cover ${t(1-e.openArea)} of the window, at uv (y up): ${r||"none"}. Under them the scene is blurred and tinted, so only big shapes and color fields read there; the rest of the window shows the scene clearly. These positions hold only for this window: the sidebar collapses and windows resize, so never mask, fade, or tint the scene to fit them. Brightness variation is ${t(e.openSpread)} in the open areas and ${t(e.coveredSpread)} under the panels.`,n.words>0?`Text over the scene: ${n.words} words checked, median contrast ${n.median.toFixed(1)}:1, worst 5% ${n.worst.toFixed(1)}:1. ${n.hardToRead} ${n.hardToRead===1?"word is":"words are"} harder to read because of the scene (outlined in red)${n.examples.length>0?`, for example ${n.examples.map(c=>`a word at uv (${c.x.toFixed(2)}, ${c.y.toFixed(2)}), ${c.contrast.toFixed(1)}:1`).join("; ")}`:""}.`:"No text was visible to check."],a=[e.openSpread<.04&&"Hidden subject: the parts of the window people actually see are nearly flat, so the scene's detail is sitting behind bb's panels. Move the subject, horizon, and characters into the open areas and fill the frame edge to edge.",n.words>0&&n.hardToRead/n.words>.02&&"Hard to read: the scene fights the text above it. Calm the value contrast and fine detail in that part of the composition, especially where the red outlines are, without fading or masking the panel's area."].filter(Boolean);return[...s,...a].join(`
`)}i(Sl,"describeContext");var Wd=new Set(["detail","quality"]);function Pl(e){let t=ce.map(o=>`${o.label} ${o.format(e[o.key])}`);return`${e.enabled?"on":"off"}; ${t.join(", ")}`}i(Pl,"describeControls");function lp(e,t){let{scene:o,controls:r}=e,n=o.params.map(s=>`  ${s.id} = ${s.value}  (${s.label}; ${s.min}..${s.max}, step ${s.step})`).join(`
`);return[`Scene: ${o.name}`,`Palette: ${o.palette.join(" ")}`,`Params:
${n||"  (none)"}`,`Controls: ${Pl(r)}`,...t.source?[`Source:
${o.source}`]:[]].join(`
`)}i(lp,"describeScene");var Jd=u.object({enabled:u.boolean(),...Object.fromEntries(ce.map(e=>[e.name,ve.shape[e.key].describe(`${e.describe} (${e.min}..${e.max}, default ${e.default})`)]))}).partial().strict();function Kd(e){let t={};typeof e.enabled=="boolean"&&(t.enabled=e.enabled);for(let o of ce){let r=e[o.name];typeof r=="number"&&(t[o.key]=r)}return t}i(Kd,"controlsFromInput");var Vd=new Map(ce.flatMap(e=>[e.name,...e.aliases].map(t=>[t,e.key]))),up=ce.map(e=>e.name).join("|");function Hd(e,t=new Set){let o={},r={};for(let n of e){let s=/^([a-z][a-z0-9_]*)=(-?\d+(?:\.\d+)?)(%?)$/.exec(n);if(!s)throw new Error(`expected <param>=<number>, got ${JSON.stringify(n)}`);let[,a,c,l]=s,p=t.has(a);if(!p&&Wd.has(a))throw new Error("Detail is set per device, in the Display section of the Ambient panel");let d=p?void 0:Vd.get(a),h=Number(c)/(l?100:1);d?r[d]=h:o[a]=h}return{values:o,controls:r}}i(Hd,"parseSetPairs");function pp(e){return e instanceof u.ZodError?Gu(e):e instanceof Error?e.message:String(e)}i(pp,"messageOf");function Yd(e){let t=cp(e);async function o(){return(await t.library()).map(r=>`${r.id}  ${r.name}${r.builtIn?"  (built-in)":""}`)}i(o,"libraryLines"),e.rpc.register(Yu,{state:i(()=>t.readState(),"state"),setValues:i(({values:r})=>t.editScene({values:r}),"setValues"),setPalette:i(({palette:r})=>t.editScene({palette:r}),"setPalette"),setControls:i(r=>t.setControls(r),"setControls"),loadScene:i(({id:r})=>t.loadScene(r),"loadScene"),restore:i(r=>t.restore(r),"restore"),resetScene:i(({id:r})=>t.resetScene(r),"resetScene"),async saveScene({name:r}){return{id:await t.saveScene(r)}},async deleteScene({id:r}){return{deleted:await t.deleteScene(r)}},async library(){return{entries:await t.library()}},async reportCompile({sceneRevision:r,ok:n,log:s}){return{accepted:await t.reportCompile(r,{ok:n,...s===void 0?{}:{log:s}})}},reportContext(r){let n=`Ambient WebGL context ${r.event}: ${JSON.stringify(r)}`;return r.event==="lost"?e.log.warn(n):e.log.info(n),{accepted:!0}},submitCapture({requestId:r,context:n,...s}){return{accepted:t.submitCapture(r,{...s,context:n??null})}},daily:i(()=>t.readDaily(),"daily"),setDaily:i(r=>t.updateDaily(r),"setDaily"),async paintNow(){return{threadId:await t.spawnPainter()}},async paintRequest({request:r}){return{threadId:await t.spawnPainter(r)}},heartbeat(){return t.heartbeat(),{ok:!0}}}),e.agents.registerTool({name:"ambient",description:"Read, rewrite, and look at the Ambient scene: the live GLSL background bb paints behind its UI, driven by what the user's agents are doing. The user tunes it with sliders generated from the params you declare.",instructions:"When the user asks to change bb's ambient background, call ambient action=get first for the shader contract and current source, then action=set, then action=look to see the result before describing it. Expose the knobs a person would want to play with as params rather than hard-coding them. To make the background subtler or bolder without rewriting the scene, use action=set with controls.visibility. When the user describes a new scene they want, call action=brief with request set to their words and follow the instructions it returns.",presentation:{label:{pending:"Painting the ambient scene",completed:"Painted the ambient scene"}},parameters:u.object({action:u.enum(["get","set","look","library","load","save","delete","brief"]).describe("get: shader contract + current scene. set: replace any of name/source/params/palette, nudge values, or change controls. look: capture the scene behind bb's real UI as the user sees it, plus the raw scene, with readability and visibility checks. library/load/save/delete: manage saved scenes. brief: step-by-step instructions for painting a new scene; pass request to paint what the user described, or omit it for today's daily concept."),name:oo.optional().describe("scene name (set, save); on set, omit it to edit the open scene, or pass a new name to start a new scene"),source:u.string().max(32e3).optional().describe("GLSL defining vec3 scene(vec2 uv, vec2 p); see action=get"),params:u.array(u.object({id:u.string().regex(Wr),label:u.string().min(1).max(40),min:u.number(),max:u.number(),step:u.number().positive().optional(),value:u.number()})).max(12).optional().describe("full slider list; each becomes uniform float p_<id>"),values:u.record(u.string(),u.number()).optional().describe("set existing param values by id"),palette:u.array(gt).length(4).optional().describe("four #rrggbb colors"),controls:Jd.optional().describe("user display controls; render resolution is set per device and is not available here"),ripple:wl.optional().describe("look: fire a test ripple of this kind just before capturing"),id:u.string().optional().describe("scene id or name for action=load and action=delete"),request:ro.optional().describe("brief: the user's own description of the scene to paint, in their words")}),async execute(r){let n=i(s=>({content:[{type:"text",text:s}],isError:!0}),"error");try{switch(r.action){case"get":return`${Au}

---
${lp(await t.readState(),{source:!0})}`;case"library":return(await o()).join(`
`);case"brief":return t.brief(new Date,r.request);case"load":return r.id?`Loaded ${(await t.loadScene(r.id)).scene.name}.`:n("action=load needs an id");case"save":return`Saved as ${await t.saveScene(r.name)}.`;case"delete":return r.id?await t.deleteScene(r.id)?`Deleted ${r.id}.`:n(`no saved scene ${JSON.stringify(r.id)}; built-in scenes cannot be deleted`):n("action=delete needs an id");case"look":{let s=await t.capture({requestId:Bd(),ripple:r.ripple??null});if(!s)return n("No visible bb window answered. The user needs bb open in the foreground with Ambient enabled.");let{working:a,waiting:c}=s.summary,l=i(p=>({type:"image",data:p.slice(22),mimeType:"image/png"}),"png");return{content:[...s.context?[l(s.context.dataUrl)]:[],l(s.dataUrl),{type:"text",text:[s.context?Sl(s.context.report):"Captured the raw scene only; this bb window could not draw its UI over it.",`Live agents: ${a} working, ${c} waiting. ${$l(s.visibility,s.dark)}`].join(`
`)}]}}case"set":{let s=r.source!==void 0||r.params!==void 0,a=await t.editScene({...r.name===void 0?{}:{name:r.name},...r.source===void 0?{}:{source:r.source},...r.params===void 0?{}:{params:r.params},...r.palette===void 0?{}:{palette:De.parse(r.palette)},...r.values===void 0?{}:{values:r.values},controls:Kd(r.controls??{})});return s?`Compiled and live: ${a.scene.name} with ${a.scene.params.length} sliders.`:`Updated ${a.scene.name}. Controls: ${Pl(a.controls)}.`}}}catch(s){return n(pp(s))}}}),e.cli.register({name:"ambient",summary:"Control bb's generative ambient background",commands:[{name:"status",summary:"Show the active scene, its params, and controls",usage:"bb ambient status"},{name:"list",summary:"List built-in and saved scenes",usage:"bb ambient list"},{name:"load",summary:"Make a built-in or saved scene active",usage:"bb ambient load <id-or-name>"},{name:"reset",summary:"Restore a scene's original version: a built-in's shader, sliders, colors, and default display settings, or a saved scene as first saved",usage:"bb ambient reset <scene-id>"},{name:"set",summary:`Set scene params or the ${ce.map(r=>r.label).join(", ")} controls`,usage:`bb ambient set <param|${up}>=<value>[%] [...]`},{name:"palette",summary:"Set the scene's four colors",usage:"bb ambient palette <#rrggbb> <#rrggbb> <#rrggbb> <#rrggbb>"},{name:"save",summary:"Save the active scene to the library",usage:"bb ambient save [name]"},{name:"delete",summary:"Remove a saved scene from the library",usage:"bb ambient delete <id>"},{name:"on",summary:"Turn the background on",usage:"bb ambient on"},{name:"off",summary:"Turn the background off",usage:"bb ambient off"},{name:"paint",summary:"Start a thread where an agent paints the scene you describe",usage:"bb ambient paint <description>"},{name:"daily",summary:"Have an agent paint a new scene every morning",usage:"bb ambient daily <status|on [hour] [time-zone]|off|now>"}],async run(r){let[n,...s]=r,a=s.join(" ").trim(),c=i(l=>({exitCode:0,stdout:`${l}
`}),"ok");try{switch(n){case"status":return c(lp(await t.readState(),{source:!1}));case"list":return c((await o()).join(`
`));case"load":if(!a)throw new Error("usage: bb ambient load <id-or-name>");return c(`loaded ${(await t.loadScene(a)).scene.name}`);case"set":{if(s.length===0)throw new Error(`usage: bb ambient set <param|${up}>=<value>[%] [...]`);let l={},p={},d=await t.editScene(y=>({values:l,controls:p}=Hd(s,new Set(y.scene.params.map(w=>w.id))),{values:l,controls:p})),h=d.scene.params.filter(y=>Object.hasOwn(l,y.id)).map(y=>`${y.id}=${y.value}`);return Object.keys(p).length>0&&h.push(Pl(d.controls)),c(h.join(`
`))}case"palette":{let l=De.parse(s);return await t.editScene({palette:l}),c(`palette ${l.join(" ")}`)}case"save":return c(`saved as ${await t.saveScene(a?oo.parse(a):void 0)}`);case"delete":if(!a)throw new Error("usage: bb ambient delete <id>");if(!await t.deleteScene(a))throw new Error(`no saved scene ${JSON.stringify(a)}; built-in scenes cannot be deleted`);return c(`deleted ${a}`);case"on":case"off":return await t.setControls({enabled:n==="on"}),c(`ambient ${n}`);case"reset":if(!a)throw new Error("usage: bb ambient reset <scene-id>");return c(`reset ${(await t.resetScene(a)).scene.name}`);case"paint":return c(`painting in ${await t.spawnPainter(ro.parse(a))}`);case"daily":{let[l="status",...p]=s;if(l==="now")return c(`painting in ${await t.spawnPainter()}`);if(l==="on"||l==="off")await t.updateDaily(_l.parse({enabled:l==="on",...dl(p)}));else if(l!=="status")throw new Error("usage: bb ambient daily <status|on [hour] [time-zone]|off|now>");let d=await t.readDaily(),h=d.enabled?`on, after ${d.hour}:00 ${d.timeZone} (bb automation ${d.automationId})`:"off",y=d.enabled&&d.nextRunAt?new Date(d.nextRunAt).toISOString():"none";return c(`daily scene: ${h}
next run: ${y}`)}}return{exitCode:1,stderr:`usage: bb ambient <status|list|load|set|palette|save|delete|on|off|reset|paint|daily>
`}}catch(l){return{exitCode:1,stderr:`${pp(l)}
`}}}}),e.log.info("Ambient loaded")}i(Yd,"plugin");export{pl as DAILY_CONCEPTS,tn as applyValues,to as cronHour,Bu as dailyConcept,Yr as dailyCron,ml as dailyPrompt,Yd as default,Sl as describeContext,$l as describeVisibility,fl as localMoment,dl as parseDailyOptions,Hd as parseSetPairs,oo as sceneNameSchema,ro as sceneRequestSchema};
//# sourceMappingURL=server.js.map
