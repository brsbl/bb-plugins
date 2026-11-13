import { createRequire as __createRequire } from "node:module";
import { dirname as __pathDirname } from "node:path";
import { fileURLToPath as __fileURLToPath } from "node:url";
const require = __createRequire(import.meta.url);
var __filename = __fileURLToPath(import.meta.url);
var __dirname = __pathDirname(__filename);
var l=Object.defineProperty;var a=(e,t)=>l(e,"name",{value:t,configurable:!0});function r(e){let t=e.settings.define({enabled:{type:"boolean",label:"Animated frame",default:!0},pills:{type:"boolean",label:"Theme-derived mention pills",default:!0},motion:{type:"select",label:"Motion",options:["still","slow","flowing"],default:"slow"},strength:{type:"select",label:"Iridescence",options:["subtle","balanced","vivid"],default:"balanced"}});e.cli.register({name:"prism-frame",summary:"Control the theme-derived shader frame and mention pills",commands:[{name:"status",summary:"Show settings",usage:"bb prism-frame status"},{name:"on",summary:"Enable Prism Frame",usage:"bb prism-frame on"},{name:"off",summary:"Restore the active theme",usage:"bb prism-frame off"}],async run(n){let[s="status",...i]=n;return i.length||!["status","on","off"].includes(s)?{exitCode:1,stderr:"Usage: bb prism-frame status|on|off. Controls: bb plugin config prism-frame set motion slow|flowing|still; set strength subtle|balanced|vivid; set pills true|false."}:(s!=="status"&&await t.experimental_set({enabled:s==="on"}),{exitCode:0,stdout:JSON.stringify(await t.get(),null,2)})}})}a(r,"prismFrame");export{r as default};
//# sourceMappingURL=server.js.map
