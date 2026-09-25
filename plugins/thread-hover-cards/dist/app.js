var pe=globalThis.__bbPluginRuntime;if(pe==null||pe.pluginSdkApp==null)throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');var se=pe.pluginSdkApp,or="default"in se?se.default:se,{Markdown:ir,ThreadChat:ar,ThreadTitle:sr,UrlLink:cr,definePluginApp:He,experimental_BranchPicker:dr,experimental_Diff:lr,experimental_FileLink:ur,experimental_Icon:hr,experimental_NewThreadComposer:mr,experimental_PermissionModePicker:pr,experimental_ProviderIcon:br,experimental_ProviderModelPicker:fr,experimental_SourceCode:gr,experimental_useAppPanel:vr,experimental_useBranches:_r,experimental_useCheckoutState:Lr,experimental_useCodeTheme:kr,experimental_useFixedTabTarget:Cr,experimental_useProviders:Tr,experimental_useSidebarThreadActions:wr,experimental_useSidebarThreadPullRequest:yr,experimental_useSidebarThreadSplit:Sr,experimental_useSidebarThreads:Er,useBbContext:xr,useBbNavigate:Mr,useComposer:Ar,useComposerView:Rr,useEnvironmentProviders:Ir,useRealtime:Hr,useRealtimeConnectionState:Pr,useRpc:qr,useSdk:Nr,useSettings:jr,useSidebarSplitLayout:Or,useSidebarThreadDraft:$r,useSidebarThreadDraftIds:Wr,useSidebarThreadRowStatus:Dr,useSidebarThreadRowStatuses:Fr,useSidebarThreadShortcut:Vr}=se;var Pe=[["path",{d:"M20.5 12.5C20.5 17.1944 16.6944 21 12 21C7.30558 21 3.5 17.1944 3.5 12.5C3.5 7.80558 7.30558 4 12 4C16.6944 4 20.5 7.80558 20.5 12.5Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M5.88 18.7031L3.5 21.0031",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}],["path",{d:"M18.14 18.668L20.5 20.998",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"2"}],["path",{d:"M5 3L2 6",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"3"}],["path",{d:"M22 6L19 3",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"4"}],["path",{d:"M12 8V12.5L14 14.5",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"5"}]],be=[["path",{d:"M20.4999 16.5V8.5C20.4999 6.14298 20.4999 4.96447 19.7676 4.23223C19.0354 3.5 17.8569 3.5 15.4999 3.5H8.49988C6.14286 3.5 4.96434 3.5 4.23211 4.23223C3.49988 4.96447 3.49988 6.14298 3.49988 8.5V16.5",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M21.9841 20.5H2.01567C1.63273 20.5 1.38367 20.1088 1.55493 19.7764L3.49988 16.5H20.4999L22.4448 19.7764C22.6161 20.1088 22.367 20.5 21.9841 20.5Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],fe=[["path",{d:"M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C22 9.08996 22 10.1433 22 12.25C22 15.7612 22 17.5167 21.1573 18.7779C20.7926 19.3238 20.3238 19.7926 19.7779 20.1573C18.5167 21 16.7612 21 13.25 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"0"}]];var qe=[["path",{d:"M11.1004 3.00208C7.4515 3.00864 5.54073 3.09822 4.31962 4.31931C3.00183 5.63706 3.00183 7.75796 3.00183 11.9997C3.00183 16.2415 3.00183 18.3624 4.31962 19.6801C5.6374 20.9979 7.75836 20.9979 12.0003 20.9979C16.2421 20.9979 18.3631 20.9979 19.6809 19.6801C20.902 18.4591 20.9916 16.5484 20.9982 12.8996",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M20.4803 3.51751L14.931 9.0515M20.4803 3.51751C19.9863 3.023 16.6587 3.0691 15.9552 3.0791M20.4803 3.51751C20.9742 4.01202 20.9282 7.34329 20.9182 8.04754",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],Ne=[["path",{d:"M12 16.5V14.5",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12105 13.2453 4 14.3624 4 15.5C4 16.6376 4.12105 17.7547 4.26781 18.8447Z",stroke:"currentColor",strokeWidth:"1.5",key:"1"}],["path",{d:"M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C13.9593 2 15.5 3.5 16 5",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"2"}]],je=[["path",{d:"M18.7088 3.49534C16.8165 2.55382 14.5009 2 12 2C9.4991 2 7.1835 2.55382 5.29116 3.49534C4.36318 3.95706 3.89919 4.18792 3.4496 4.91378C3 5.63965 3 6.34248 3 7.74814V11.2371C3 16.9205 7.54236 20.0804 10.173 21.4338C10.9067 21.8113 11.2735 22 12 22C12.7265 22 13.0933 21.8113 13.8269 21.4338C16.4576 20.0804 21 16.9205 21 11.2371L21 7.74814C21 6.34249 21 5.63966 20.5504 4.91378C20.1008 4.18791 19.6368 3.95706 18.7088 3.49534Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M9 11.5C9 11.5 10.4079 11.7519 11 13.5C11 13.5 12.5 10.5 15 9.5",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],Oe=[["path",{d:"M8.00164 7.00013H16.754C18.8613 7.00013 19.9149 7.00013 20.6718 7.50574C20.9995 7.72462 21.2808 8.00588 21.4997 8.33346C21.8937 8.92301 21.9808 9.69265 22 11.0003M12.0027 7.00013L11.3691 5.73321C10.8442 4.68363 10.3645 3.62714 9.20122 3.19101C8.69172 3 8.10969 3 6.94562 3C5.12865 3 4.22017 3 3.53848 3.38033C3.05255 3.65144 2.6516 4.0523 2.38042 4.53811C2 5.21963 2 6.1279 2 7.94443V11.0003C2 15.7145 2 18.0716 3.46487 19.5361C4.82227 20.8931 6.94628 20.9927 11.0025 21",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M14 19.8268V21H15.1734C15.5827 21 15.7874 21 15.9715 20.9238C16.1555 20.8475 16.3003 20.7028 16.5897 20.4134L21.4133 15.5894C21.6864 15.3164 21.8229 15.1799 21.8959 15.0327C22.0347 14.7525 22.0347 14.4236 21.8959 14.1434C21.8229 13.9961 21.6864 13.8596 21.4133 13.5866C21.1403 13.3136 21.0038 13.1771 20.8565 13.1041C20.5763 12.9653 20.2473 12.9653 19.9671 13.1041C19.8198 13.1771 19.6833 13.3136 19.4103 13.5866L14.5867 18.4106C14.2972 18.7 14.1525 18.8447 14.0762 19.0287C14 19.2128 14 19.4174 14 19.8268Z",stroke:"currentColor",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],$e=[["path",{d:"M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z",stroke:"currentColor",strokeWidth:"1.5",key:"0"}],["path",{d:"M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z",stroke:"currentColor",strokeWidth:"1.5",key:"1"}]],We=[["path",{d:"M12 3V6",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M12 18V21",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"1"}],["path",{d:"M21 12L18 12",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"2"}],["path",{d:"M6 12L3 12",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"3"}],["path",{d:"M18.3635 5.63672L16.2422 7.75804",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"4"}],["path",{d:"M7.75804 16.2422L5.63672 18.3635",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"5"}],["path",{d:"M18.3635 18.3635L16.2422 16.2422",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"6"}],["path",{d:"M7.75804 7.75804L5.63672 5.63672",stroke:"currentColor",strokeLinecap:"round",strokeWidth:"1.5",key:"7"}]],ge=[["path",{d:"M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M14.9994 15L9 9M9.00064 15L15 9",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],De=[["path",{d:"M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z",stroke:"currentColor",strokeWidth:"1.5",key:"0"}],["path",{d:"M8 12.5L10.5 15L16 9",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}]],ve=[["path",{d:"M17 8L18.8398 9.85008C19.6133 10.6279 20 11.0168 20 11.5C20 11.9832 19.6133 12.3721 18.8398 13.1499L17 15",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M7 8L5.16019 9.85008C4.38673 10.6279 4 11.0168 4 11.5C4 11.9832 4.38673 12.3721 5.16019 13.1499L7 15",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}],["path",{d:"M14.5 4L9.5 20",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"2"}]],Fe=[["path",{d:"M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z",fill:"currentColor",key:"0"}]],Ve=[["path",{d:"M29.05 98.54L58.19 82.19L58.68 80.77L58.19 79.98H56.77L51.9 79.68L35.25 79.23L20.81 78.63L6.82 77.88L3.3 77.13L0 72.78L0.340004 70.61L3.3 68.62L7.54 68.99L16.91 69.63L30.97 70.6L41.17 71.2L56.28 72.77H58.68L59.02 71.8L58.2 71.2L57.56 70.6L43.01 60.74L27.26 50.32L19.01 44.32L14.55 41.28L12.3 38.43L11.33 32.21L15.38 27.75L20.82 28.12L22.21 28.49L27.72 32.73L39.49 41.84L54.86 53.16L57.11 55.03L58.01 54.39L58.12 53.94L57.11 52.25L48.75 37.14L39.83 21.77L35.86 15.4L34.81 11.58C34.44 10.01 34.17 8.69 34.17 7.08L38.78 0.820007L41.33 0L47.48 0.820007L50.07 3.07001L53.89 11.81L60.08 25.57L69.68 44.28L72.49 49.83L73.99 54.97L74.55 56.54H75.52V55.64L76.31 45.1L77.77 32.16L79.19 15.51L79.68 10.82L82 5.2L86.61 2.16L90.21 3.88L93.17 8.12L92.76 10.86L91 22.3L87.55 40.22L85.3 52.22H86.61L88.11 50.72L94.18 42.66L104.38 29.91L108.88 24.85L114.13 19.26L117.5 16.6H123.87L128.56 23.57L126.46 30.77L119.9 39.09L114.46 46.14L106.66 56.64L101.79 65.04L102.24 65.71L103.4 65.6L121.02 61.85L130.54 60.13L141.9 58.18L147.04 60.58L147.6 63.02L145.58 68.01L133.43 71.01L119.18 73.86L97.96 78.88L97.7 79.07L98 79.44L107.56 80.34L111.65 80.56H121.66L140.3 81.95L145.17 85.17L148.09 89.11L147.6 92.11L140.1 95.93L129.98 93.53L106.36 87.91L98.26 85.89H97.14V86.56L103.89 93.16L116.26 104.33L131.75 118.73L132.54 122.29L130.55 125.1L128.45 124.8L114.84 114.56L109.59 109.95L97.7 99.94H96.91V100.99L99.65 105L114.12 126.75L114.87 133.42L113.82 135.59L110.07 136.9L105.95 136.15L97.48 124.26L88.74 110.87L81.69 98.87L80.83 99.36L76.67 144.17L74.72 146.46L70.22 148.18L66.47 145.33L64.48 140.72L66.47 131.61L68.87 119.72L70.82 110.27L72.58 98.53L73.63 94.63L73.56 94.37L72.7 94.48L63.85 106.63L50.39 124.82L39.74 136.22L37.19 137.23L32.77 134.94L33.18 130.85L35.65 127.21L50.39 108.46L59.28 96.84L65.02 90.13L64.98 89.16H64.64L25.49 114.58L18.52 115.48L15.52 112.67L15.89 108.06L17.31 106.56L29.08 98.46L29.04 98.5L29.05 98.54Z",fill:"currentColor",key:"0"}]],ze=[["path",{d:"M165.29 165.29H517.36V400H400V517.36H282.65V634.72H165.29ZM282.65 282.65V400H400V282.65Z",fill:"currentColor",fillRule:"evenodd",key:"0"}],["path",{d:"M517.36 400H634.72V634.72H517.36Z",fill:"currentColor",key:"1"}]],Be=[["path",{d:"M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23",fill:"currentColor",key:"0"}]],Ge=[["circle",{cx:"12",cy:"12",r:"10",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"0"}],["path",{d:"M9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5C14.5 10.3569 14.0689 11.1131 13.4117 11.5636C12.7283 12.0319 12 12.6716 12 13.5",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"1"}],["path",{d:"M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z",stroke:"currentColor",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"1.5",key:"2"}]];var Ue=String.raw`
.bb-thread-hover-card {
  position: fixed;
  z-index: 50;
  width: min(20rem, calc(100vw - 1rem));
  max-height: calc(100vh - 1rem);
  overflow: hidden;
  padding: 0.75rem;
  border: 1px solid transparent;
  border-color:
    color-mix(in srgb, var(--foreground) 4%, transparent);
  border-radius: var(--radius-lg, 0.5rem);
  background: var(--popover);
  background: color-mix(in srgb, var(--popover) 82%, transparent);
  color: var(--popover-foreground);
  box-shadow:
    0 0.75rem 2.5rem
      color-mix(in srgb, var(--foreground) 12%, transparent),
    inset 0 1px 0
      color-mix(in srgb, var(--background) 34%, transparent);
  backdrop-filter: blur(18px) saturate(1.25);
  -webkit-backdrop-filter: blur(18px) saturate(1.25);
  font-family: inherit;
  font-size: 0.75rem;
  line-height: 1.35;
  pointer-events: auto;
  user-select: text;
}

.bb-thread-hover-card.is-visible {
  animation: bb-thread-hover-card-in 120ms ease-out both;
}

.bb-thread-hover-card__header,
.bb-thread-hover-card__provider,
.bb-thread-hover-card__provider-identity,
.bb-thread-hover-card__times,
.bb-thread-hover-card__context,
.bb-thread-hover-card__project,
.bb-thread-hover-card__host,
.bb-thread-hover-card__local,
.bb-thread-hover-card__pr,
.bb-thread-hover-card__access,
.bb-thread-hover-card__meta {
  display: flex;
  min-width: 0;
  align-items: center;
}

.bb-thread-hover-card__header {
  gap: 0.5rem;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-weight: 400;
}

.bb-thread-hover-card__icon {
  width: 0.875rem;
  height: 0.875rem;
  flex: none;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__runtime,
.bb-thread-hover-card__loading,
.bb-thread-hover-card__meta-label {
  color: var(--muted-foreground);
}

.bb-thread-hover-card__runtime {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.1875rem;
  font-variant-numeric: tabular-nums;
}

.bb-thread-hover-card__provider {
  flex: 1 1 auto;
  gap: 0.25rem;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__provider-identity {
  min-width: 0;
  flex: 1 1 auto;
  justify-content: flex-start;
  gap: 0.25rem;
  overflow: hidden;
}

.bb-thread-hover-card__provider-model,
.bb-thread-hover-card__reasoning,
.bb-thread-hover-card__access {
  font-size: 0.75rem;
  line-height: 1.25;
}

.bb-thread-hover-card__reasoning,
.bb-thread-hover-card__access {
  flex: none;
  color: var(
    --subtle-foreground,
    color-mix(in srgb, var(--muted-foreground) 76%, transparent)
  );
  white-space: nowrap;
}

.bb-thread-hover-card__times {
  flex: none;
  gap: 0.375rem;
  margin-left: auto;
  white-space: nowrap;
}

.bb-thread-hover-card__time-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 74%, transparent);
}

.bb-thread-hover-card__time-icon[data-tone="working"] {
  color: color-mix(in srgb, var(--muted-foreground) 62%, transparent);
}

.bb-thread-hover-card__time-icon[data-tone="danger"] {
  color: var(--destructive);
}

.bb-thread-hover-card__time-icon[data-tone="warning"] {
  color: var(--warning-text, var(--warning));
}

.bb-thread-hover-card__time-icon[data-tone="success"] {
  color: var(--success);
}

.bb-thread-hover-card__summary,
.bb-thread-hover-card__message,
.bb-thread-hover-card__meta,
.bb-thread-hover-card__loading {
  margin: 0;
}

.bb-thread-hover-card__summary {
  position: relative;
  min-width: 0;
  margin-top: 0.625rem;
  padding-block: 0.1875rem;
}

.bb-thread-hover-card__message {
  display: -webkit-box;
  min-width: 0;
  overflow: hidden;
  color: color-mix(in srgb, var(--foreground) 88%, transparent);
  font-size: 0.78125rem;
  font-weight: 350;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@supports ((background-clip: text) or (-webkit-background-clip: text)) {
  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__message {
    background: linear-gradient(
      105deg,
      color-mix(in srgb, var(--foreground) 84%, transparent) 0%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 40%,
      var(--foreground) 50%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 60%,
      color-mix(in srgb, var(--foreground) 84%, transparent) 100%
    );
    background-position: 130% 0;
    background-size: 220% 100%;
    background-clip: text;
    color: transparent;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: bb-thread-hover-card-message-shimmer 3.4s ease-in-out infinite;
  }

  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__inline-code {
    color: color-mix(in srgb, var(--foreground) 88%, transparent);
    -webkit-text-fill-color: currentColor;
  }
}

.bb-thread-hover-card__provider-icon {
  width: 1rem;
  height: 1rem;
  color: var(--muted-foreground);
  object-fit: contain;
}

.bb-thread-hover-card__provider-model {
  color: var(--muted-foreground);
  font-weight: 400;
}

.bb-thread-hover-card__provider-model.bb-thread-hover-card__truncate {
  flex: 0 1 auto;
  color: var(--muted-foreground);
}

.bb-thread-hover-card__context {
  width: 100%;
  flex-wrap: nowrap;
  gap: 0.375rem;
  margin-top: 0.5rem;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.65625rem;
  white-space: nowrap;
}

.bb-thread-hover-card__project,
.bb-thread-hover-card__host {
  gap: 0.25rem;
  overflow: hidden;
}

.bb-thread-hover-card__project {
  max-width: 38%;
  flex: 0 1 auto;
}

.bb-thread-hover-card__context[data-has-host="false"]
  .bb-thread-hover-card__project {
  max-width: 100%;
  flex: 1 1 auto;
}

.bb-thread-hover-card__host {
  flex: 1 1 4rem;
  min-width: 0;
}

.bb-thread-hover-card__project-name,
.bb-thread-hover-card__host-name,
.bb-thread-hover-card__local-path {
  min-width: 0;
  overflow: hidden;
  color: var(--muted-foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-thread-hover-card__project-name,
.bb-thread-hover-card__host-name,
.bb-thread-hover-card__local-path {
  flex: 1 1 auto;
}

.bb-thread-hover-card__local {
  width: 100%;
  flex-wrap: nowrap;
  gap: 0.375rem;
  margin-top: 0.3125rem;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  white-space: nowrap;
}

.bb-thread-hover-card__meta {
  gap: 0.375rem;
}

.bb-thread-hover-card__meta-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 78%, transparent);
}

.bb-thread-hover-card__meta-label {
  flex: none;
}

.bb-thread-hover-card__truncate {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: var(--foreground);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bb-thread-hover-card__pr {
  flex: none;
  align-items: center;
  overflow: visible;
}

.bb-thread-hover-card__access {
  gap: 0.1875rem;
  margin-left: 0.25rem;
}

.bb-thread-hover-card__permission-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: currentColor;
}

.bb-thread-hover-card__access[data-permission-mode="accept-edits"],
.bb-thread-hover-card__access[data-permission-mode="workspace-write"],
.bb-thread-hover-card__access[data-permission-mode="auto"] {
  color: color-mix(in srgb, var(--muted-foreground) 72%, transparent);
}

.bb-thread-hover-card__access[data-permission-mode="full"] {
  color: color-mix(
    in srgb,
    var(--warning-text, var(--warning)) 78%,
    var(--muted-foreground)
  );
}

.bb-thread-hover-card__pr-link {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.1875rem;
  border-radius: 0.25rem;
  color: var(--foreground);
  outline: none;
  text-decoration: none;
}

.bb-thread-hover-card__pr-number {
  flex: none;
}

.bb-thread-hover-card__inline-code {
  padding: 0.025rem 0.175rem;
  border-radius: 0.2rem;
  background: color-mix(in srgb, var(--foreground) 5%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.9em;
}

.bb-thread-hover-card__inline-link {
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentColor 30%, transparent);
  text-underline-offset: 0.1rem;
}

.bb-thread-hover-card__inline-strong {
  font-weight: 550;
}

.bb-thread-hover-card__inline-emphasis {
  font-style: italic;
}

.bb-thread-hover-card__inline-strike {
  color: var(--muted-foreground);
}

.bb-thread-hover-card__pr-link:hover {
  text-decoration: underline;
  text-underline-offset: 0.125rem;
}

.bb-thread-hover-card__pr-link:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.bb-thread-hover-card__pr-status {
  flex: none;
  padding: 0.03125rem 0.25rem;
  border: 1px solid transparent;
  border-radius: 999px;
  background: color-mix(in srgb, var(--muted-foreground) 7%, transparent);
  color: var(--muted-foreground);
  font-size: 0.5625rem;
  font-weight: 500;
  line-height: 1.35;
}

.bb-thread-hover-card__pr-status[data-tone="success"] {
  border-color: color-mix(in oklab, var(--success) 18%, transparent);
  background: color-mix(in oklab, var(--success) 9%, transparent);
  color: color-mix(in oklab, var(--success) 80%, var(--foreground));
}

.bb-thread-hover-card__pr-status[data-tone="danger"] {
  border-color:
    color-mix(in oklab, var(--destructive-text, var(--destructive)) 18%, transparent);
  background:
    color-mix(in oklab, var(--destructive-text, var(--destructive)) 8%, transparent);
  color: var(--destructive-text, var(--destructive));
}

.bb-thread-hover-card__pr-status[data-tone="merged"] {
  border-color: color-mix(in oklab, var(--pr-merged) 18%, transparent);
  background: color-mix(in oklab, var(--pr-merged) 9%, transparent);
  color: var(--pr-merged);
}

.bb-thread-hover-card__link-icon {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  color: color-mix(in srgb, var(--muted-foreground) 82%, transparent);
}

.bb-thread-hover-card__loading {
  padding: 0.125rem 0;
}

.bb-thread-hover-card__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@keyframes bb-thread-hover-card-in {
  from {
    opacity: 0;
    transform: translateX(-0.2rem) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes bb-thread-hover-card-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes bb-thread-hover-card-message-shimmer {
  0%,
  32% {
    background-position: 130% 0;
  }

  100% {
    background-position: -130% 0;
  }
}

.bb-thread-hover-card__status-icon[data-animated="true"],
.bb-thread-hover-card__time-icon[data-animated="true"] {
  animation: bb-thread-hover-card-spin 1s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .bb-thread-hover-card.is-visible,
  .bb-thread-hover-card__status-icon[data-animated="true"],
  .bb-thread-hover-card__time-icon[data-animated="true"],
  .bb-thread-hover-card__summary[data-working="true"]
    .bb-thread-hover-card__message {
    animation: none;
  }
}

@supports not (
  (backdrop-filter: blur(1px)) or
    (-webkit-backdrop-filter: blur(1px))
) {
  .bb-thread-hover-card {
    background: var(--popover);
  }
}
`,Ze=String.raw`
/* Aggregates are short; the card hugs them instead of reserving thread-card width. */
/* Counts are short; the card hugs them rather than reserving thread-card width. */
.bb-thread-hover-card[data-bb-card="section"] {
  width: max-content;
  max-width: min(20rem, calc(100vw - 1rem));
  padding: 0.625rem 0.75rem;
}

/* Band 1 — the projects this section spans. */
.bb-section-hover-card__band {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.375rem;
  overflow: hidden;
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  white-space: nowrap;
}

.bb-section-hover-card__project {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bb-section-hover-card__sep {
  flex: none;
  opacity: 0.45;
}

.bb-section-hover-card__more {
  flex: none;
  opacity: 0.7;
}

/* Band 2 — present only when something wants action. */
.bb-section-hover-card__headline {
  display: flex;
  min-width: 0;
  align-items: baseline;
  gap: 0.875rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}

.bb-section-hover-card__chip {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 0.3125rem;
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  font-weight: 450;
}

.bb-section-hover-card__chip-icon {
  width: 0.8125rem;
  height: 0.8125rem;
}

/*
 * A question is a routine prompt, not an incident: bb renders its own pending
 * glyph muted and saves destructive for failures. Colouring both red would
 * stop the one that is actually broken from standing out.
 */
.bb-section-hover-card__chip--question {
  color: var(--foreground);
}

.bb-section-hover-card__chip--question .bb-section-hover-card__chip-icon {
  color: var(--subtle-foreground, var(--muted-foreground));
}

.bb-section-hover-card__chip--failed {
  color: var(--destructive-text, var(--destructive));
}

.bb-section-hover-card__chip--failed .bb-section-hover-card__chip-icon {
  color: var(--destructive-text, var(--destructive));
}

/* Band 3 — fixed positions, so the row is read rather than scanned. */
.bb-section-hover-card__counts {
  display: flex;
  align-items: baseline;
  gap: 0.875rem;
  margin-top: 0.5rem;
  padding-top: 0.4375rem;
  border-top: 1px solid color-mix(in srgb, var(--foreground) 7%, transparent);
  color: var(--muted-foreground);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.bb-section-hover-card__count {
  flex: none;
}

.bb-section-hover-card__count-value {
  color: var(--foreground);
  font-weight: 500;
}

.bb-section-hover-card__count[data-zero="true"] {
  opacity: 0.4;
}

.bb-section-hover-card__empty {
  margin: 0;
  color: var(--muted-foreground);
  font-size: 0.75rem;
}
`;function _e(t){return t.trim().replace(/^\|/,"").replace(/\|$/,"").split("|").map(e=>e.trim())}function gt(t){let e=_e(t);return e.length>0&&e.every(r=>/^:?-{3,}:?$/.test(r.replace(/\s+/g,"")))}function B(t){return t.replace(/<\/?[A-Za-z][^>]*>/g,"").replace(/\s+/g," ").trim()}function Ke(t,e){if(!t[e]?.includes("|")||!gt(t[e+1]??""))return null;let r=_e(t[e]),o=_e(t[e+2]??""),i=r.map((d,f)=>{let h=o[f];return!d||!h?null:`${B(d)}: ${B(h)}`}).filter(d=>!!d).slice(0,3),c=i.length>0?i.join(" \xB7 "):r.join(" \xB7 ");return c?{inline:c,kind:"table"}:null}function Ye(t){let e=t.replace(/\r\n?/g,`
`).split(`
`),r=e.findIndex(_=>_.trim().length>0);if(r<0)return null;if(e[r]?.trim()==="---"){let _=e.findIndex((g,b)=>b>r&&g.trim()==="---");if(_>r&&(e=e.slice(_+1),r=e.findIndex(g=>g.trim().length>0),r<0))return null}let o=Ke(e,r);if(o)return o;let i=e[r].trim(),c=i.match(/^(```+|~~~+)\s*[^\s]*\s*$/);if(c){let _=[];for(let b=r+1;b<e.length;b+=1){let S=e[b];if(S.trim().startsWith(c[1]))break;(S.trim()||_.length>0)&&_.push(S.trim())}let g=B(_.join(" "));return g?{inline:g,kind:"code"}:null}let d=i.match(/^#{1,6}\s+(.+)$/);if(d){let _=B(d[1]);return _?{inline:_,kind:"heading"}:null}if(i.match(/^(?:[-+*]|\d+[.)])\s+(.+)$/)){let _=[];for(let b=r;b<e.length&&_.length<2;b+=1){let S=e[b].trim().match(/^(?:[-+*]|\d+[.)])\s+(.+)$/);if(!S)break;_.push(B(S[1].replace(/^\[[ xX]\]\s*/,"")))}let g=_.filter(Boolean).join(" \xB7 ");return g?{inline:g,kind:"list"}:null}if(i.startsWith(">")){let _=[];for(let b=r;b<e.length;b+=1){let S=e[b].trim().match(/^>\s?(.*)$/);if(!S)break;_.push(S[1])}let g=B(_.join(" "));return g?{inline:g,kind:"quote"}:null}let h=[];for(let _=r;_<e.length;_+=1){let g=e[_].trim();if(!g||_>r&&Ke(e,_)||_>r&&/^(?:#{1,6}\s|```|~~~|>|[-+*]\s|\d+[.)]\s)/.test(g))break;h.push(g)}let w=B(h.join(" "));return w?{inline:w,kind:"paragraph"}:null}var Le="bb-thread-hover-card",Je="bb-thread-hover-card-styles",ke="bb-section-hover-card",Xe="bb-section-hover-card-styles",we="a[data-sidebar-thread-id]",at=".group\\/thread-row",Se='button[aria-expanded][aria-label$=" section"]',st="[data-sidebar-sticky-group]",ct="[data-sidebar-sticky-project-item]";var vt="[data-sidebar-project-id]",_t=4e3,Lt=32,kt=6e4,Ct=0,ue=150,dt=120,lt=2e3,Tt=5e3,wt=1e3,yt=5e3,St=15e3,Et=128,Qe=200,xt=["a[href]","button:not([disabled])",'input:not([disabled]):not([type="hidden"])',"select:not([disabled])","textarea:not([disabled])",'[contenteditable="true"]',"[tabindex]"].join(","),et=globalThis;function W(){return typeof performance>"u"?Date.now():performance.now()}function H(t){return Math.max(0,Math.round((W()-t)*10)/10)}function A(t){let e=et.__bbThreadHoverCardTimings??(et.__bbThreadHoverCardTimings=[]);e.push({...t,recordedAt:Date.now()}),e.length>Qe&&e.splice(0,e.length-Qe)}function ut(t){return t.status==="active"||t.status==="host-reconnecting"||t.status==="provisioning"||t.status==="starting"||t.status==="stopping"?lt:Tt}function Mt(t){return ut(t)===lt?wt:yt}function tt(t){let e=t.repository;return JSON.stringify([e.isGitRepository,e.path,e.name,e.branch])}function Ce(t){return JSON.stringify([t.path,t.branch])}function le(t){return(t instanceof DOMException||t instanceof Error)&&t.name==="AbortError"}var rt="http://www.w3.org/2000/svg",At={none:"None",low:"Low",medium:"Medium",high:"High",xhigh:"Extra High",ultracode:"Ultracode",max:"Max",ultra:"Ultra"};function u(t,e,r){let o=document.createElement(t);return o.className=e,r!==void 0&&(o.textContent=r),o}function O(t,e,r){let o=document.createElementNS(rt,"svg");o.classList.add(...r.split(/\s+/).filter(Boolean)),o.setAttribute("viewBox","0 0 24 24"),o.setAttribute("fill","none"),o.setAttribute("data-icon",e),o.setAttribute("aria-hidden","true");for(let[i,c]of t){let d=document.createElementNS(rt,i);for(let[f,h]of Object.entries(c)){if(f==="key"||h===void 0||h===null)continue;let w=f.replace(/[A-Z]/g,_=>`-${_.toLowerCase()}`);d.setAttribute(w,String(h))}o.append(d)}return o}function Rt(t){switch(t){case"active":case"host-reconnecting":case"provisioning":case"starting":case"stopping":return{animated:!0,icon:We,iconName:"Loading03Icon",label:"Agent working",tone:"working"};case"error":return{animated:!1,icon:ge,iconName:"CancelCircleIcon",label:"Thread failed",tone:"danger"};case"waiting-for-host":return{animated:!1,icon:null,iconName:null,label:"Waiting for host",tone:"warning"};case"pending":return{animated:!1,icon:null,iconName:null,label:"Queued",tone:"muted"};case"idle":return{animated:!1,icon:De,iconName:"CheckmarkCircle02Icon",label:"Agent finished",tone:"success"}}}function It(t){switch(t.state){case"draft":return"muted";case"closed":return"danger";case"merged":return"merged";case"open":switch(t.signal.toLowerCase()){case"blocked":case"checks failing":case"changes requested":case"conflicts":return"danger";case"checks passing":case"ready to merge":return"success";default:return"muted"}}}function Ht(t){let e=t.trim().replace(/[\\/]+$/,"");if(!e)return t.trim()||"Local";let r=e.includes("\\")&&!e.includes("/")?"\\":"/",o=r==="\\"?e.replace(/^[A-Za-z]:\\Users\\[^\\]+(?=\\|$)/i,"~"):e.replace(/^\/(?:Users|home)\/[^/]+(?=\/|$)/,"~"),i=o.split(/[\\/]/).filter(Boolean);return i[0]==="~"&&i[1]===".bb"&&i.length>3?`~${r}.bb${r}\u2026${r}${i.at(-1)}`:i.length<=4?o:i[0]==="~"?`~${r}\u2026${r}${i.slice(-2).join(r)}`:`\u2026${r}${i.slice(-3).join(r)}`}function V(t){if(!(t instanceof Element))return null;let e=t.closest(we);return e||(t.closest(at)?.querySelector(we)??null)}function ht(t){return/^(?:Expand|Collapse) (.+) section$/.exec(t.getAttribute("aria-label")??"")?.[1]??null}function Pt(t){let e=t.querySelector(Se);return e?.parentElement?.parentElement===t?e:null}function qt(t){return t.closest(st)?.parentElement?.matches(ct)===!0}function Nt(t){let r=t.closest(ct)?.querySelector(Se);return r==null?null:ht(r)}function jt(t){return t.closest(vt)?.dataset.sidebarProjectId?.trim()||null}function G(t){let e=t instanceof Element?t.closest(st):null;if(e===null)return null;let r=t;for(;r&&r!==e.parentElement;){let o=Pt(r);if(o){let i=ht(o);return i===null||qt(r)?null:{name:i,projectId:jt(r),projectName:Nt(r),row:r,sectionId:e instanceof HTMLElement&&e.dataset.sidebarSectionId?.trim()||null,toggle:o}}r=r.parentElement}return null}function Ot(t,e){return t.sectionId!==null||e.sectionId!==null?t.sectionId!==null&&t.sectionId===e.sectionId&&t.projectId===e.projectId:t.name===e.name&&t.projectName===e.projectName}function $t(t){let e=[];for(let r of Array.from(document.querySelectorAll(Se))){let o=G(r);o&&Ot(t,o)&&e.push(o)}return e.length===1?e[0]:null}function ce(t){let e=t.dataset.sidebarThreadId?.trim();return e||null}function Wt(t,e=Date.now()){let r=Math.max(0,Math.floor((e-t)/1e3)),o=r%60,i=Math.floor(r/60);if(i<1)return`${o}s`;let c=i%60,d=Math.floor(i/60);return d>0?`${d}h ${c}m`:`${c}m`}function mt(t){let e=t.querySelector("[data-turn-started-at]");if(e){let r=Number(e.dataset.turnStartedAt),o=e.dataset.turnEndedAt?Number(e.dataset.turnEndedAt):Date.now(),i=Wt(r,o);e.querySelector("[data-time-value]").textContent=i,e.title=`${e.dataset.timeLabel??"Run time"} ${i}`}}function Dt(t,e){if(e==="claude-code"){let o=t.match(/^(.*)\[(\d+(?:\.\d+)?[km])\]$/i),i=o?.[1]??t,c=o?.[2]?.toUpperCase(),d=i.replace(/^claude[-_\s]+/i,"").split(/[-_]/).map(f=>/^\d+(\.\d+)*$/.test(f)?f:/^[a-z]+$/i.test(f)?f.charAt(0).toUpperCase()+f.slice(1).toLowerCase():f).join("-").replace(/-(\d+)-(\d+)(?=-|$)/,"-$1.$2").split("-").join(" ");return c?`${d} (${c})`:d}let r=t.split("-").map(o=>o.toLowerCase()==="gpt"?"GPT":/^\d+(\.\d+)*$/.test(o)?o:/^[a-z]+$/i.test(o)?o.charAt(0).toUpperCase()+o.slice(1).toLowerCase():o).join("-");return e==="codex"?r.replace(/^GPT-/i,""):r}function Ft(t){return t==="accept-edits"?"Accept edits":t==="auto"?"Auto":t==="full"?"Full access":t==="workspace-write"?"Workspace write":t==="readonly"?"Read only":null}function Vt(t){let e=Ft(t.permissionMode);if(!e)return null;let r=t.permissionMode==="full"?{definition:Ne,name:"SquareUnlock02Icon"}:t.permissionMode==="accept-edits"||t.permissionMode==="workspace-write"?{definition:Oe,name:"FolderEditIcon"}:t.permissionMode==="auto"?{definition:je,name:"SecurityCheckIcon"}:t.permissionMode==="readonly"?{definition:$e,name:"ViewIcon"}:null,o=u("span","bb-thread-hover-card__access");return o.dataset.permissionMode=t.permissionMode,o.setAttribute("aria-label",`Permission: ${e}`),o.title=`Permission: ${e}`,r&&o.append(O(r.definition,r.name,"bb-thread-hover-card__icon bb-thread-hover-card__permission-icon")),o.append(document.createTextNode(e)),o}function zt(t){let e=[["image",/!\[([^\]]*)\]\([^)]+\)/],["link",/\[([^\]]+)\]\([^)]+\)/],["code",/`([^`\n]+)`/],["strong",/(?<!\\)\*\*(\S(?:[^\n]*?\S)?)(?<!\\)\*\*/],["strong",/(?<![\\\w])__(\S(?:[^\n]*?\S)?)(?<!\\)__(?!\w)/],["strike",/~~(.+?)~~/],["emphasis",/(?<!\\)\*(?!\*)(\S(?:[^*\n]*?\S)?)(?<!\\)\*(?!\*)/],["emphasis",/(?<![\\\w])_(?!_)(\S(?:[^_\n]*?\S)?)(?<!\\)_(?![\w_])/]],r=null;for(let[o,i]of e){let c=t.match(i);!c||c.index===void 0||(!r||c.index<(r.match.index??Number.POSITIVE_INFINITY))&&(r={match:c,type:o})}return r}function X(t,e,r){let o=e;for(;o;){let i=zt(o);if(!i||i.match.index===void 0){t.append(document.createTextNode(o.replace(/\\([\\`*_[\]{}()#+\-.!|>])/g,"$1")));return}i.match.index>0&&t.append(document.createTextNode(o.slice(0,i.match.index).replace(/\\([\\`*_[\]{}()#+\-.!|>])/g,"$1")));let c=i.match[1]??"";if(i.type==="code")t.append(u("code","bb-thread-hover-card__inline-code",c));else if(i.type==="image")t.append(document.createTextNode(c||"Image"));else if(i.type==="link"){let d=u("span","bb-thread-hover-card__inline-link");X(d,c,r),t.append(d)}else if(i.type==="strike"){let d=u("s","bb-thread-hover-card__inline-strike");X(d,c,r),t.append(d)}else if(r){let d=u(i.type==="strong"?"strong":"em",i.type==="strong"?"bb-thread-hover-card__inline-strong":"bb-thread-hover-card__inline-emphasis");X(d,c,r),t.append(d)}else X(t,c,r);o=o.slice(i.match.index+i.match[0].length)}}function Bt(t,e){let r=u("p","bb-thread-hover-card__message"),o=Ye(t);return o&&(r.dataset.markdownBlock=o.kind,X(r,o.inline,e)),r}function Gt(t){if(t.logoUrl){let o=u("img","bb-thread-hover-card__icon bb-thread-hover-card__provider-icon");return o.src=t.logoUrl,o.alt="",o.setAttribute("aria-hidden","true"),o.addEventListener("error",()=>{o.replaceWith(O(ve,"SourceCodeIcon","bb-thread-hover-card__icon bb-thread-hover-card__provider-icon"))},{once:!0}),o}let e=t.id==="codex"?{definition:Fe,name:"OpenAiIcon",viewBox:"0 0 24 24"}:t.id==="claude-code"?{definition:Ve,name:"ClaudeIcon",viewBox:"0 0 149 149"}:t.id==="pi"?{definition:ze,name:"PiIcon",viewBox:"100 100 600 600"}:t.id==="acp-cursor"?{definition:Be,name:"CursorIcon",viewBox:"0 0 24 24"}:{definition:ve,name:"SourceCodeIcon",viewBox:"0 0 24 24"},r=O(e.definition,e.name,"bb-thread-hover-card__icon bb-thread-hover-card__provider-icon");return r.setAttribute("viewBox",e.viewBox),r}async function Ut(t,e,r,o){let i=await fetch("/api/v1/plugins/thread-hover-cards/rpc/threadSummary",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({clientId:r,generation:o,threadId:t}),signal:e}),c=await i.json();if(!i.ok||!c.ok)throw new Error(c.ok?"Thread summary request failed.":c.error?.message);return c.result}async function Zt(t){let e=await fetch("/api/v1/plugins/thread-hover-cards/rpc/threadTiming",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({threadId:t})}),r=await e.json();if(!e.ok||!r.ok)throw new Error(r.ok?"Thread timing request failed.":r.error?.message);return r.result}async function Kt(t){let e=await fetch("/api/v1/plugins/thread-hover-cards/rpc/threadPullRequest",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({threadId:t})}),r=await e.json();if(!e.ok||!r.ok)throw new Error(r.ok?"Thread pull request failed.":r.error?.message);return r.result}function pt(t,e){let r=e.getBoundingClientRect(),o=t.getBoundingClientRect(),i=8,c=8,d=r.right+c;d+o.width>window.innerWidth-i&&(d=Math.max(i,r.left-c-o.width));let f=Math.min(Math.max(i,r.top-4),Math.max(i,window.innerHeight-o.height-i));t.style.left=`${Math.round(d)}px`,t.style.top=`${Math.round(f)}px`}function bt(t,e="thread"){t.replaceChildren(u("p","bb-thread-hover-card__loading",`Loading ${e} summary\u2026`))}function ft(t){t.replaceChildren(u("p","bb-thread-hover-card__loading","Summary unavailable"))}function z(t,e){t.dataset.bbHoverCardRenderState=e,e==="loading"||e==="summary"?t.setAttribute("aria-busy","true"):t.removeAttribute("aria-busy")}function nt(){return new Promise(t=>requestAnimationFrame(()=>t()))}async function Yt(t){let e=document.fonts?.ready,r=Array.from(t.querySelectorAll("img"));await Promise.all([e??Promise.resolve(),...r.map(o=>o.complete?o.decode?.().catch(()=>{}):new Promise(i=>{o.addEventListener("load",()=>i(),{once:!0}),o.addEventListener("error",()=>i(),{once:!0})}))])}async function ye(t,e){await Yt(t),await nt(),await nt(),e()&&z(t,"complete")}function de(t,e){let r=u("div","bb-thread-hover-card__header"),o=u("div","bb-thread-hover-card__provider"),i=Dt(e.provider.model,e.provider.id),c=e.provider.reasoningLevel?At[e.provider.reasoningLevel]:null;o.title=c?`${e.provider.displayName}: ${i} \xB7 ${c} reasoning`:`${e.provider.displayName}: ${i}`;let d=u("div","bb-thread-hover-card__provider-identity");if(d.append(u("span","bb-thread-hover-card__provider-model bb-thread-hover-card__truncate",i)),c){let m=u("span","bb-thread-hover-card__reasoning",c);m.title=`${c} reasoning`,d.append(m)}let f=Vt(e);f&&(f.dataset.location="header",d.append(f)),o.append(Gt(e.provider),u("span","bb-thread-hover-card__sr-only",`${e.provider.displayName}, `),d),r.append(o);let h=Rt(e.status),w=u("div","bb-thread-hover-card__times"),_=e.status==="idle";if(e.currentTurnStartedAt!==null){let m=u("span","bb-thread-hover-card__runtime");m.dataset.turnStartedAt=String(e.currentTurnStartedAt),m.dataset.timeLabel=_?"Total agent time":"Run time",e.currentTurnCompletedAt!==null&&(m.dataset.turnEndedAt=String(e.currentTurnCompletedAt));let M=u("span","bb-thread-hover-card__time-value");M.dataset.timeValue="";let R=(h.animated||_)&&h.icon!==null&&h.iconName!==null,y=O(R?h.icon:Pe,R?h.iconName:"AlarmClockIcon","bb-thread-hover-card__icon bb-thread-hover-card__time-icon");R&&(y.dataset.tone=h.tone,h.animated&&(y.dataset.animated="true"),y.removeAttribute("aria-hidden"),y.setAttribute("aria-label",h.label),y.setAttribute("role","img")),m.append(y,u("span","bb-thread-hover-card__sr-only",`${m.dataset.timeLabel} `),M),w.append(m)}else if(h.icon&&h.iconName){let m=O(h.icon,h.iconName,"bb-thread-hover-card__icon bb-thread-hover-card__time-icon bb-thread-hover-card__header-status");m.dataset.tone=h.tone,h.animated&&(m.dataset.animated="true"),m.removeAttribute("aria-hidden"),m.setAttribute("aria-label",h.label),m.setAttribute("role","img"),w.append(m)}w.childElementCount>0&&r.append(w);let g=[r],b=e.latestAssistantMessage;if(b){let m=u("section","bb-thread-hover-card__summary");h.animated&&(m.dataset.working="true"),m.append(Bt(b,!0)),g.push(m)}let S=e.repository.name!=="Repository unavailable";if(e.repository.isGitRepository||S){let m=u("section","bb-thread-hover-card__context");m.dataset.hasHost=String(e.repository.isGitRepository&&!!e.hostName);let M=u("span","bb-thread-hover-card__project"),R=u("span","bb-thread-hover-card__project-name",e.repository.name);if(R.title=e.repository.name,M.append(O(fe,"Folder01Icon","bb-thread-hover-card__icon bb-thread-hover-card__meta-icon"),R),m.append(M),e.repository.isGitRepository&&e.hostName){let y=u("span","bb-thread-hover-card__host"),E=u("span","bb-thread-hover-card__host-name",e.hostName);E.title=e.hostName,y.append(O(be,"LaptopIcon","bb-thread-hover-card__icon bb-thread-hover-card__meta-icon"),E),m.append(y)}if(e.repository.isGitRepository&&e.pullRequest.kind==="available"){let y=u("span","bb-thread-hover-card__pr");y.dataset.kind=e.pullRequest.kind;let E=u("a","bb-thread-hover-card__pr-link");E.href=e.pullRequest.url,E.target="_blank",E.rel="noopener noreferrer",E.setAttribute("aria-label",`Pull request #${e.pullRequest.number}: ${e.pullRequest.title}. ${e.pullRequest.signal}. Opens in a new tab.`),E.title=e.pullRequest.title,E.append(O(qe,"LinkSquare01Icon","bb-thread-hover-card__icon bb-thread-hover-card__link-icon"),u("span","bb-thread-hover-card__pr-number",`#${e.pullRequest.number}`));let q=u("span","bb-thread-hover-card__pr-status",e.pullRequest.signal);q.dataset.tone=It(e.pullRequest),q.dataset.state=e.pullRequest.state,E.append(q),y.append(E),m.append(y)}g.push(m)}if(!e.repository.isGitRepository){let m=e.repository.path?.trim()||(e.repository.name==="Repository unavailable"?"Local":e.repository.name),M=u("section","bb-thread-hover-card__local"),R=u("span","bb-thread-hover-card__local-path",Ht(m));R.title=m,M.setAttribute("aria-label",`Local workspace: ${m}`),M.append(O(be,"LaptopIcon","bb-thread-hover-card__icon bb-thread-hover-card__meta-icon"),R),g.push(M)}t.replaceChildren(...g),mt(t)}var Jt=2;function Xt(t,e,r=`${e}s`){return`${t} ${t===1?e:r}`}function ot(t,e,r,o){let i=u("span",`bb-section-hover-card__chip ${t}`),c=O(e,r,"bb-thread-hover-card__icon bb-section-hover-card__chip-icon");return i.append(c,u("span","",o)),i}function Te(t,e){let r=u("span","bb-section-hover-card__count");t===0&&(r.dataset.zero="true");let o=e==="thread"?t===1?"thread":"threads":e;return r.append(u("b","bb-section-hover-card__count-value",String(t)),u("span","",` ${o}`)),r}function it(t,e){if(e.total===0){t.replaceChildren(u("p","bb-section-hover-card__empty","No threads yet"));return}let r=[];if(e.projects.length>0){let i=u("div","bb-section-hover-card__band");i.append(O(fe,"Folder01Icon","bb-thread-hover-card__icon bb-thread-hover-card__meta-icon"));let c=e.projects.slice(0,Jt);c.forEach((f,h)=>{h>0&&i.append(u("span","bb-section-hover-card__sep","\xB7")),i.append(u("span","bb-section-hover-card__project",f))});let d=e.projects.length-c.length;d>0&&i.append(u("span","bb-section-hover-card__more",`+${d}`)),r.push(i)}if(e.questions>0||e.failed>0){let i=u("div","bb-section-hover-card__headline");e.questions>0&&i.append(ot("bb-section-hover-card__chip--question",Ge,"HelpCircleIcon",Xt(e.questions,"question"))),e.failed>0&&i.append(ot("bb-section-hover-card__chip--failed",ge,"CancelCircleIcon",`${e.failed} failed`)),r.push(i)}let o=u("div","bb-section-hover-card__counts");o.append(Te(e.total,"thread"),Te(e.working,"working"),Te(e.unread,"unread")),r.push(o),t.replaceChildren(...r)}function Qt({onOpen:t}){let e=null,r=null,o=null,i=null,c=null,d=null,f=null,h=!1,w=0,_=`hover-card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,g=null,b=new Map,S=new Map,m=new Map,M=new Map,R=new Map,y=new Set,E=u("style","");E.id=Je,E.textContent=Ue,document.getElementById(Je)?.remove(),document.head.append(E);function q(){return e||(e=u("div","bb-thread-hover-card"),e.id=Le,e.hidden=!0,e.setAttribute("data-bb-plugin","thread-hover-cards"),e.setAttribute("data-bb-plugin-root",""),e.setAttribute("data-bb-portaled-overlay",""),e.setAttribute("role","group"),e.setAttribute("aria-label","Thread summary"),e.addEventListener("pointerenter",U),e.addEventListener("pointerleave",ae),document.body.append(e),e)}function N(){let n=L();!e||!n||e.hidden||pt(e,n.closest(at)??n)}function Q(n){let a=b.get(n);if(a)return b.delete(n),b.set(n,a),a}function K(n,a){let s=b.get(n),l=s!==void 0&&tt(s.summary)===tt(a),C=a.pullRequest.kind==="pending"&&s!==void 0&&l&&s.summary.pullRequest.kind!=="pending",v=s?.timingFetchedAt!==null&&s?.timingFetchedAt!==void 0,k=v&&s.timingStartedAt!==null&&s.timingStartedAt>=a.diagnostics.startedAt,T=v&&(s.summary.status===a.status||k),I=C?s.summary.pullRequest:a.pullRequest,Z={...a,currentTurnCompletedAt:T?s.summary.currentTurnCompletedAt:a.currentTurnCompletedAt,currentTurnStartedAt:T?s.summary.currentTurnStartedAt:a.currentTurnStartedAt,pullRequest:I,status:k?s.summary.status:a.status};for(b.delete(n),b.set(n,{fetchedAt:Date.now(),pullRequestFetchedAt:C?s.pullRequestFetchedAt:I.kind==="pending"?null:Date.now(),summary:Z,timingFetchedAt:k?s.timingFetchedAt:null,timingStartedAt:T?s.timingStartedAt:null});b.size>Et;){let me=b.keys().next().value;if(me===void 0)break;b.delete(me)}}function ee(n){for(let[a,s]of S)a!==n&&(S.delete(a),s.controller.abort())}function te(n,a,s){let l=S.get(n);if(l){let T=W();return l.promise.then(I=>(A({cache:"coalesced",durationMs:H(T),operation:"summary",outcome:"ok",server:I.diagnostics,threadId:n}),I),I=>{throw A({cache:"coalesced",durationMs:H(T),operation:"summary",outcome:le(I)?"aborted":"error",threadId:n}),I})}let C=W(),v=new AbortController,k;return k=Ut(n,v.signal,_,s).then(T=>(K(n,T),A({cache:a,durationMs:H(C),operation:"summary",outcome:"ok",server:T.diagnostics,threadId:n}),T)).catch(T=>{throw A({cache:a,durationMs:H(C),operation:"summary",outcome:le(T)?"aborted":"error",threadId:n}),T}).finally(()=>{S.get(n)?.promise===k&&S.delete(n)}),S.set(n,{controller:v,promise:k}),k}function re(n){let a=M.get(n);if(a){let C=W();return a.then(v=>(A({cache:"coalesced",durationMs:H(C),operation:"timing",outcome:"ok",server:v.diagnostics,threadId:n}),v),v=>{throw A({cache:"coalesced",durationMs:H(C),operation:"timing",outcome:"error",threadId:n}),v})}let s=W(),l=Zt(n).then(C=>(A({cache:"miss",durationMs:H(s),operation:"timing",outcome:"ok",server:C.diagnostics,threadId:n}),C)).catch(C=>{throw A({cache:"miss",durationMs:H(s),operation:"timing",outcome:"error",threadId:n}),C}).finally(()=>M.delete(n));return M.set(n,l),l}function ne(n,a){let s=JSON.stringify([n,a]),l=m.get(s);if(l){let k=W();return l.then(T=>(A({cache:"coalesced",durationMs:H(k),operation:"pullRequest",outcome:"ok",server:T.diagnostics,threadId:n}),T),T=>{throw A({cache:"coalesced",durationMs:H(k),operation:"pullRequest",outcome:"error",threadId:n}),T})}let C=W(),v=Kt(n).then(k=>(A({cache:"miss",durationMs:H(C),operation:"pullRequest",outcome:"ok",server:k.diagnostics,threadId:n}),k)).catch(k=>{throw A({cache:"miss",durationMs:H(C),operation:"pullRequest",outcome:"error",threadId:n}),k}).finally(()=>{m.get(s)===v&&m.delete(s)});return m.set(s,v),v}function Y(n,a,s){let l=b.get(n);return l?.timingFetchedAt!==null&&l?.timingFetchedAt!==void 0&&Date.now()-l.timingFetchedAt<Mt(l.summary)?(A({cache:"fresh",durationMs:0,operation:"timing",outcome:"ok",threadId:n}),Promise.resolve()):re(n).then(C=>{let v=b.get(n);if(!v)return;let k=v.summary.diagnostics.startedAt;if(C.diagnostics.startedAt<k)return!h&&a===w&&o===n&&L()&&R.get(n)!==k&&!y.has(n)?(R.set(n,k),y.add(n),new Promise(Z=>{queueMicrotask(()=>{y.delete(n),Y(n,a,s).then(Z)})})):void 0;R.delete(n);let T={...v.summary,...C};if(b.delete(n),b.set(n,{...v,summary:T,timingFetchedAt:Date.now(),timingStartedAt:C.diagnostics.startedAt}),h||a!==w||o!==n||!L())return;let I=document.activeElement instanceof Node&&s.contains(document.activeElement);de(s,T),I&&(s.querySelector(".bb-thread-hover-card__pr-link")??L())?.focus(),requestAnimationFrame(N)}).catch(()=>{})}function oe(n,a,s){let l=b.get(n);if(!l?.summary.repository.isGitRepository)return Promise.resolve();let C=Ce(l.summary.repository);return l.pullRequestFetchedAt!==null&&Date.now()-l.pullRequestFetchedAt<St?(A({cache:"fresh",durationMs:0,operation:"pullRequest",outcome:"ok",threadId:n}),Promise.resolve()):ne(n,C).then(({pullRequest:v,repository:k})=>{let T=b.get(n);if(!T||Ce(k)!==C||Ce(T.summary.repository)!==C)return;let I={...T.summary,pullRequest:v};if(b.delete(n),b.set(n,{...T,pullRequestFetchedAt:Date.now(),summary:I}),h||a!==w||o!==n||!L())return;let Z=document.activeElement instanceof Node&&s.contains(document.activeElement);de(s,I),Z&&(s.querySelector(".bb-thread-hover-card__pr-link")??L())?.focus(),requestAnimationFrame(N)}).catch(()=>{})}function p(n,a,s){z(s,"summary"),Promise.all([Y(n,a,s),oe(n,a,s)]).then(()=>ye(s,()=>!h&&a===w&&o===n&&L()!==null))}function L(){return o?(r?.isConnected&&ce(r)===o||(r?.removeAttribute("aria-describedby"),r=Array.from(document.querySelectorAll(we)).find(n=>ce(n)===o)??null,r?.setAttribute("aria-describedby",Le)),r):null}function $(n){if(!n.isConnected||n.tabIndex<0||n.closest('[hidden], [inert], [aria-hidden="true"]')||e?.contains(n))return!1;for(let a=n;a;a=a.parentElement){let s=window.getComputedStyle(a);if(s.display==="none"||s.visibility==="hidden"||s.visibility==="collapse")return!1}return!0}function P(){return Array.from(document.querySelectorAll(xt)).filter($).sort((n,a)=>{let s=n.tabIndex>0?n.tabIndex:Number.POSITIVE_INFINITY,l=a.tabIndex>0?a.tabIndex:Number.POSITIVE_INFINITY;return s-l})}function x(n){let a=P(),s=a.indexOf(n);return s<0?null:a[(s+1)%a.length]??null}function ie(){d&&(clearTimeout(d),d=null)}function D(n,a=W(),s=0){let l=ce(n);if(!l||h)return;ie(),t(),r?.removeAttribute("aria-describedby"),r=n,o=l,n.setAttribute("aria-describedby",Le),w+=1;let C=w;ee(l);let v=q();z(v,"loading"),v.hidden=!1,v.classList.remove("is-visible"),v.offsetWidth,v.classList.add("is-visible"),f&&clearInterval(f),f=setInterval(()=>{e&&!e.hidden&&mt(e)},1e3);let k=Q(l);k?de(v,k.summary):bt(v),requestAnimationFrame(N);let T=k!==void 0&&Date.now()-k.fetchedAt<ut(k.summary);if(A({cache:k?T?"fresh":"stale":"miss",durationMs:H(a),operation:"open",outcome:"ok",threadId:l}),k&&(A({cache:T?"fresh":"stale",durationMs:H(a),operation:"firstContent",outcome:"ok",threadId:l}),T)){p(l,C,v);return}if(s>0){let I=()=>{if(c){d=setTimeout(I,s);return}d=null,J(l,k,C,v,a)};d=setTimeout(I,s);return}J(l,k,C,v,a)}function J(n,a,s,l,C){te(n,a?"stale":"miss",s).then(v=>{if(h||s!==w||o!==n||!L())return;let k=document.activeElement instanceof Node&&l.contains(document.activeElement),T=b.get(n)?.summary??v;de(l,T),a||A({cache:"miss",durationMs:H(C),operation:"firstContent",outcome:"ok",server:v.diagnostics,threadId:n}),k&&(l.querySelector(".bb-thread-hover-card__pr-link")??L())?.focus(),requestAnimationFrame(N),p(n,s,l)}).catch(v=>{!a&&!h&&s===w&&o===n&&L()&&(ft(l),z(l,"error"),A({cache:"miss",durationMs:H(C),operation:"firstContent",outcome:le(v)?"aborted":"error",threadId:n}),requestAnimationFrame(N))})}function j(){i&&(clearTimeout(i),i=null)}function U(){c&&(clearTimeout(c),c=null)}function he(n,a,s=0){if(j(),U(),r===n&&e&&!e.hidden)return;let l=W();if(a<=0){D(n,l,s);return}i=setTimeout(()=>{i=null,D(n,l,s)},a)}function F(){j(),U(),ie(),w+=1,r?.removeAttribute("aria-describedby"),r=null,o=null,g=null,f&&(clearInterval(f),f=null),e&&(e.hidden=!0,e.classList.remove("is-visible"))}function ae(){U(),c=setTimeout(()=>{c=null;let n=document.activeElement;n===r||n instanceof Node&&e?.contains(n)||F()},dt)}function Ee(n){if(n.pointerType==="touch")return;let a=V(n.target);if(!a||V(n.relatedTarget)===a)return;let l=ce(a);if(l&&Q(l)){he(a,Ct,ue);return}he(a,ue)}function xe(n){let a=V(n.target);a&&V(n.relatedTarget)!==a&&(j(),!(n.relatedTarget instanceof Node&&e?.contains(n.relatedTarget))&&ae())}function Me(n){let a=V(n.target);a&&he(a,0)}function Ae(n){if(n.target instanceof Node&&e?.contains(n.target)){if(n.relatedTarget instanceof Node&&(e.contains(n.relatedTarget)||n.relatedTarget===r))return;ae();return}let a=V(n.target);a&&V(n.relatedTarget)!==a&&(n.relatedTarget instanceof Node&&e?.contains(n.relatedTarget)||ae())}function Re(n){if(!o)return;let a=L(),s=e?.querySelector(".bb-thread-hover-card__pr-link")??null;if(n.key==="Tab"&&!n.shiftKey&&n.target===a&&s){n.preventDefault(),U(),g=a?x(a):null,s.focus();return}if(n.key==="Tab"&&n.shiftKey&&n.target===s){if(n.preventDefault(),U(),a)a.focus();else{let l=g?.isConnected?g:P()[0];F(),l?.focus()}return}if(n.key==="Tab"&&!n.shiftKey&&n.target===s){n.preventDefault();let l=g&&$(g)?g:a?x(a):P()[0];F(),l?.focus();return}if(n.key==="Escape"){if(n.target instanceof Node&&e?.contains(n.target)){n.preventDefault(),(a??(g&&$(g)?g:P()[0]))?.focus(),F();return}F()}}function Ie(n){V(n.target)&&F()}return document.addEventListener("pointerover",Ee),document.addEventListener("pointerout",xe),document.addEventListener("focusin",Me),document.addEventListener("focusout",Ae),document.addEventListener("keydown",Re),document.addEventListener("click",Ie),window.addEventListener("resize",N),window.addEventListener("scroll",N,!0),{dispose(){h=!0,F(),document.removeEventListener("pointerover",Ee),document.removeEventListener("pointerout",xe),document.removeEventListener("focusin",Me),document.removeEventListener("focusout",Ae),document.removeEventListener("keydown",Re),document.removeEventListener("click",Ie),window.removeEventListener("resize",N),window.removeEventListener("scroll",N,!0),e?.remove(),e=null,E.remove(),b.clear();for(let n of S.values())n.controller.abort();S.clear(),m.clear(),M.clear(),R.clear(),y.clear()},closeCard:F}}async function er(t,e){let r=await fetch("/api/v1/plugins/thread-hover-cards/rpc/sectionSummary",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:t.name,projectId:t.projectId,projectName:t.projectName,...t.sectionId===null?{}:{sectionId:t.sectionId}}),signal:e}),o=await r.json();if(!r.ok||!o.ok)throw new Error(o.ok?"Section summary request failed.":o.error?.message);return o.result}function tr({onOpen:t}){let e=null,r=null,o=null,i=null,c=null,d=0,f=!1,h=new Map,w=new Map,_=new Map,g=u("style","");g.id=Xe,g.textContent=Ze,document.getElementById(Xe)?.remove(),document.head.append(g);let b=p=>JSON.stringify(p.sectionId===null?["name",p.name,p.projectName]:["id",p.sectionId,p.projectId]);function S(){return e||(e=u("div","bb-thread-hover-card"),e.id=ke,e.hidden=!0,e.dataset.bbCard="section",e.setAttribute("data-bb-plugin","thread-hover-cards"),e.setAttribute("data-bb-plugin-root",""),e.setAttribute("data-bb-portaled-overlay",""),e.setAttribute("role","group"),e.setAttribute("aria-label","Section summary"),e.addEventListener("pointerenter",q),e.addEventListener("pointerleave",N),document.body.append(e),e)}function m(){if(!(!e||e.hidden||!r)){if(!r.row.isConnected){let p=$t(r);if(!p){y();return}r.toggle.removeAttribute("aria-describedby"),r=p,r.toggle.setAttribute("aria-describedby",ke)}pt(e,r.row)}}function M(){for(let p of w.values())p.abort();w.clear()}function R(){c&&(clearTimeout(c),c=null)}function y(){E(),q(),R(),d+=1,M(),r?.toggle.removeAttribute("aria-describedby"),r=null,e&&(e.hidden=!0,e.classList.remove("is-visible"))}function E(){o&&(clearTimeout(o),o=null)}function q(){i&&(clearTimeout(i),i=null)}function N(){q(),i=setTimeout(()=>{i=null;let p=document.activeElement;p===r?.toggle||p instanceof Node&&e?.contains(p)||y()},dt)}function Q(p){let L=b(p);M();let $=new AbortController;return w.set(L,$),er(p,$.signal).then(P=>{if(!P.known)return _.set(L,Date.now()),P;for(h.delete(L),h.set(L,{fetchedAt:Date.now(),summary:P});h.size>Lt;){let x=h.keys().next().value;if(x===void 0)break;h.delete(x)}return P}).finally(()=>{w.get(L)===$&&w.delete(L)})}function K(p,L=0){let $=_.get(b(p));if(f)return;if($!==void 0&&Date.now()-$<kt){y();return}t(),q(),R(),M(),r?.toggle.removeAttribute("aria-describedby"),r=p,p.toggle.setAttribute("aria-describedby",ke),d+=1;let P=d,x=S();z(x,"loading"),x.hidden=!1,x.classList.remove("is-visible"),x.offsetWidth,x.classList.add("is-visible");let ie=b(p),D=h.get(ie);if(D?(it(x,D.summary),z(x,"summary")):bt(x,"section"),requestAnimationFrame(m),D&&Date.now()-D.fetchedAt<_t){ye(x,()=>!f&&P===d&&r!==null);return}let J=()=>{Q(p).then(j=>{if(!j.known){!f&&P===d&&y();return}f||P!==d||(it(x,j),requestAnimationFrame(m),z(x,"summary"),ye(x,()=>!f&&P===d&&r!==null))}).catch(j=>{f||P!==d||D||le(j)||(ft(x),z(x,"error"),requestAnimationFrame(m))})};if(L>0){let j=()=>{if(i){c=setTimeout(j,L);return}c=null,J()};c=setTimeout(j,L);return}J()}function ee(p){if(p.pointerType==="touch")return;let L=G(p.target);if(L){if(r?.row===L.row&&e&&!e.hidden){E(),q();return}if(E(),h.has(b(L))){K(L,ue);return}q(),o=setTimeout(()=>{o=null,K(L)},ue)}}function te(p){let L=G(p.target);L&&G(p.relatedTarget)?.row!==L.row&&(E(),G(p.relatedTarget)?.row!==r?.row&&(p.relatedTarget instanceof Node&&e?.contains(p.relatedTarget)||N()))}function re(p){let L=G(p.target);if(L){if(r?.row===L.row&&e&&!e.hidden){q();return}K(L)}else r&&!(p.target instanceof Node&&e?.contains(p.target))&&N()}function ne(p){p.key==="Escape"&&r&&y()}function Y(p){G(p.target)&&y()}document.addEventListener("pointerover",ee),document.addEventListener("pointerout",te),document.addEventListener("focusin",re),document.addEventListener("keydown",ne),document.addEventListener("click",Y),window.addEventListener("resize",m),window.addEventListener("scroll",m,!0);let oe=new MutationObserver(m);return oe.observe(document.body,{childList:!0,subtree:!0}),{dispose(){f=!0,y(),document.removeEventListener("pointerover",ee),document.removeEventListener("pointerout",te),document.removeEventListener("focusin",re),document.removeEventListener("keydown",ne),document.removeEventListener("click",Y),window.removeEventListener("resize",m),window.removeEventListener("scroll",m,!0),oe.disconnect(),e?.remove(),e=null,g.remove(),h.clear(),_.clear();for(let p of w.values())p.abort();w.clear()},closeCard:y}}function rr(){let t=!1,e=null,r=Qt({onOpen:()=>e?.closeCard?.()});e=tr({onOpen:()=>r.closeCard?.()});let o=[r,e];return{dispose(){if(!t){t=!0;for(let i of o)i.dispose()}}}}var nr="(hover: hover) and (pointer: fine)",Xr=He(t=>{t.contentScripts.register({id:"thread-hover-cards",mount({signal:e}){if(e.aborted)return;let r=typeof window<"u"&&window.matchMedia?window.matchMedia(nr):null,o=null,i=!1,c=()=>{i||(r?.matches&&!o?o=rr():!r?.matches&&o&&(o.dispose(),o=null))},d=()=>c(),f=()=>{i||(i=!0,r?.removeEventListener("change",d),o?.dispose(),o=null)};return r?.addEventListener("change",d),c(),e.addEventListener("abort",f,{once:!0}),()=>{e.removeEventListener("abort",f),f()}}})});export{Xr as default,G as findSectionTrigger,it as renderSectionSummary,ht as sectionLabelOf};
