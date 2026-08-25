// bb-plugin-runtime-shim:react
var runtime = globalThis.__bbPluginRuntime;
if (runtime == null || runtime.react == null) {
  throw new Error('Cannot load "react": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod = runtime.react;
var {
  Activity,
  Children,
  Component,
  Fragment,
  Profiler,
  PureComponent,
  StrictMode,
  Suspense,
  act,
  cache,
  cacheSignal,
  captureOwnerStack,
  cloneElement,
  createContext,
  createElement,
  createRef,
  forwardRef,
  isValidElement,
  lazy,
  memo,
  startTransition,
  unstable_useCacheRefresh,
  use,
  useActionState,
  useCallback,
  useContext,
  useDebugValue,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useInsertionEffect,
  useLayoutEffect,
  useMemo,
  useOptimistic,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  version
} = mod;

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/AiContentGenerator01Icon.js
var AiContentGenerator01Icon = [
  ["path", { d: "M11 21H10C6.22876 21 4.34315 21 3.17157 19.8284C2 18.6569 2 16.7712 2 13V10C2 6.22876 2 4.34315 3.17157 3.17157C4.34315 2 6.22876 2 10 2H12C15.7712 2 17.6569 2 18.8284 3.17157C20 4.34315 20 6.22876 20 10V10.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17.4069 14.4036C17.6192 13.8655 18.3808 13.8655 18.5931 14.4036L18.6298 14.4969C19.1482 15.8113 20.1887 16.8518 21.5031 17.3702L21.5964 17.4069C22.1345 17.6192 22.1345 18.3808 21.5964 18.5931L21.5031 18.6298C20.1887 19.1482 19.1482 20.1887 18.6298 21.5031L18.5931 21.5964C18.3808 22.1345 17.6192 22.1345 17.4069 21.5964L17.3702 21.5031C16.8518 20.1887 15.8113 19.1482 14.4969 18.6298L14.4036 18.5931C13.8655 18.3808 13.8655 17.6192 14.4036 17.4069L14.4969 17.3702C15.8113 16.8518 16.8518 15.8113 17.3702 14.4969L17.4069 14.4036Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M7 7H15M7 11.5H15M7 16H11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Alert02Icon.js
var Alert02Icon = [
  ["path", { d: "M13.9248 21H10.0752C5.44476 21 3.12955 21 2.27636 19.4939C1.42317 17.9879 2.60736 15.9914 4.97574 11.9985L6.90057 8.75333C9.17559 4.91778 10.3131 3 12 3C13.6869 3 14.8244 4.91777 17.0994 8.75332L19.0243 11.9985C21.3926 15.9914 22.5768 17.9879 21.7236 19.4939C20.8704 21 18.5552 21 13.9248 21Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 9V13", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/AlertCircleIcon.js
var AlertCircleIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 8V12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12.125 15.75H12M12.25 15.75C12.25 15.8881 12.1381 16 12 16C11.8619 16 11.75 15.8881 11.75 15.75C11.75 15.6119 11.8619 15.5 12 15.5C12.1381 15.5 12.25 15.6119 12.25 15.75Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Archive03Icon.js
var Archive03Icon = [
  ["path", { d: "M21 7H3V13C3 16.7712 3 18.6569 4.17157 19.8284C5.34315 21 7.22876 21 11 21H13C16.7712 21 18.6569 21 19.8284 19.8284C21 18.6569 21 16.7712 21 13V7Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M21 7H3L4.2 5.4C5.08328 4.22229 5.52492 3.63344 6.15836 3.31672C6.7918 3 7.52786 3 9 3H15C16.4721 3 17.2082 3 17.8416 3.31672C18.4751 3.63344 18.9167 4.22229 19.8 5.4L21 7Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12 17L12 10.5M9 14.5C9.58984 15.1068 11.1597 17.5 12 17.5C12.8403 17.5 14.4102 15.1068 15 14.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowDown01Icon.js
var ArrowDown01Icon = [
  ["path", { d: "M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowDown02Icon.js
var ArrowDown02Icon = [
  ["path", { d: "M12 18.502V5.00195", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 13.002C18 13.002 13.5811 19.0019 12 19.002C10.4188 19.002 6 13.002 6 13.002", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowDownDoubleIcon.js
var ArrowDownDoubleIcon = [
  ["path", { d: "M17.9997 12.5C17.9997 12.5 13.5807 18.5 11.9996 18.5C10.4185 18.5 5.99966 12.5 5.99966 12.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17.9997 5.50005C17.9997 5.50005 13.5807 11.5 11.9996 11.5C10.4185 11.5 5.99966 5.5 5.99966 5.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowLeft01Icon.js
var ArrowLeft01Icon = [
  ["path", { d: "M15 6C15 6 9.00001 10.4189 9 12C8.99999 13.5812 15 18 15 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowMoveDownLeftIcon.js
var ArrowMoveDownLeftIcon = [
  ["path", { d: "M20 3V5.07692C20 7.07786 20 8.07833 19.8547 8.91545C19.0547 13.5235 15.0934 17.1376 10.0426 17.8674C9.12509 18 7.19318 18 5 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M7 21C6.39316 20.4102 4 18.8403 4 18C4 17.1597 6.39316 15.5898 7 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowMoveDownRightIcon.js
var ArrowMoveDownRightIcon = [
  ["path", { d: "M4 3V5.07692C4 7.07786 4 8.07833 4.14533 8.91545C4.94529 13.5235 8.90656 17.1376 13.9574 17.8674C14.8749 18 16.8068 18 19 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17 21C17.6068 20.4102 20 18.8403 20 18C20 17.1597 17.6068 15.5898 17 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowReloadHorizontalIcon.js
var ArrowReloadHorizontalIcon = [
  ["path", { d: "M20.5 5.5H9.5C5.78672 5.5 3 8.18503 3 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3.5 18.5H14.5C18.2133 18.5 21 15.815 21 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M18.5 3C18.5 3 21 4.84122 21 5.50002C21 6.15882 18.5 8 18.5 8", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M5.49998 16C5.49998 16 3.00001 17.8412 3 18.5C2.99999 19.1588 5.5 21 5.5 21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowRight01Icon.js
var ArrowRight01Icon = [
  ["path", { d: "M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowRight02Icon.js
var ArrowRight02Icon = [
  ["path", { d: "M18.5 12L4.99997 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13 18C13 18 19 13.5811 19 12C19 10.4188 13 6 13 6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowTurnBackwardIcon.js
var ArrowTurnBackwardIcon = [
  ["path", { d: "M11 6H15.5C17.9853 6 20 8.01472 20 10.5C20 12.9853 17.9853 15 15.5 15H4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M6.99998 12C6.99998 12 4.00001 14.2095 4 15C3.99999 15.7906 7 18 7 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowTurnForwardIcon.js
var ArrowTurnForwardIcon = [
  ["path", { d: "M13 6H8.5C6.01472 6 4 8.01472 4 10.5C4 12.9853 6.01472 15 8.5 15H20", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17 12C17 12 20 14.2095 20 15C20 15.7906 17 18 17 18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp01Icon.js
var ArrowUp01Icon = [
  ["path", { d: "M17.9998 15C17.9998 15 13.5809 9.00001 11.9998 9C10.4187 8.99999 5.99985 15 5.99985 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUp02Icon.js
var ArrowUp02Icon = [
  ["path", { d: "M12 5.5V19", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 11C18 11 13.5811 5.00001 12 5C10.4188 4.99999 6 11 6 11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUpDoubleIcon.js
var ArrowUpDoubleIcon = [
  ["path", { d: "M18 11.5C18 11.5 13.5811 5.50001 12 5.5C10.4188 5.49999 6 11.5 6 11.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 18.5C18 18.5 13.5811 12.5 12 12.5C10.4188 12.5 6 18.5 6 18.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUpDownIcon.js
var ArrowUpDownIcon = [
  ["path", { d: "M7 4V20", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17 19L17 4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M10 6.99998C10 6.99998 7.79053 4.00001 6.99998 4C6.20942 3.99999 4 7 4 7", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M20 17C20 17 17.7905 20 17 20C16.2094 20 14 17 14 17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ArrowUpRight01Icon.js
var ArrowUpRight01Icon = [
  ["path", { d: "M9 6.65032C9 6.65032 15.9383 6.10759 16.9154 7.08463C17.8924 8.06167 17.3496 15 17.3496 15M16.5 7.5L6.5 17.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/AttachmentIcon.js
var AttachmentIcon = [
  ["path", { d: "M19.5 12.0001V13.5001C19.5 17.6422 16.1421 21.0001 12 21.0001C7.85786 21.0001 4.5 17.6422 4.5 13.5001V8C4.5 5.23858 6.73858 3 9.5 3C12.2614 3 14.5 5.23858 14.5 8V13.5C14.5 14.8807 13.3807 16 12 16C10.6193 16 9.5 14.8807 9.5 13.5V9.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Book02Icon.js
var Book02Icon = [
  ["path", { d: "M15.5 7H8.5M12.499 11H8.49902", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M20 22H6C4.89543 22 4 21.1046 4 20M4 20C4 18.8954 4.89543 18 6 18H20V6C20 4.11438 20 3.17157 19.4142 2.58579C18.8284 2 17.8856 2 16 2H10C7.17157 2 5.75736 2 4.87868 2.87868C4 3.75736 4 5.17157 4 8V20Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M19.5 18C19.5 18 18.5 18.7628 18.5 20C18.5 21.2372 19.5 22 19.5 22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/BrainIcon.js
var BrainIcon = [
  ["path", { d: "M16.998 7.12652C17.3182 7.04393 17.654 7 18 7C20.2091 7 22 8.79086 22 11C22 13.2091 20.2091 15 18 15C17.6451 15 17.3009 14.9538 16.9733 14.867M16.998 7.12652C16.9993 7.08451 17 7.04233 17 7C17 4.79086 15.2091 3 13 3C11.0824 3 9.47994 4.34939 9.09041 6.15043M16.998 7.12652C16.9769 7.80763 16.7854 8.44584 16.4649 9M16.9733 14.867C16.9909 14.7472 17 14.6247 17 14.5C17 13.2905 16.1411 12.2816 15 12.05M16.9733 14.867C16.7957 16.0737 15.756 17 14.5 17H14C11.7909 17 10 18.7909 10 21M9.09041 6.15043C8.74377 6.05243 8.37801 6 8 6C5.79086 6 4 7.79086 4 10C4 10.3886 4.05542 10.7643 4.15878 11.1195M9.09041 6.15043C10.1015 6.43625 10.9498 7.10965 11.4649 8M4.15878 11.1195C2.9114 11.4832 2 12.6352 2 14C2 15.6569 3.34315 17 5 17C6.30622 17 7.41746 16.1652 7.82929 15M4.15878 11.1195C4.24921 11.4303 4.37632 11.7255 4.53513 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.8361 11.7435C11.3257 12.2353 10.453 12.3202 9.70713 11.9008C8.9612 11.4814 8.58031 10.6917 8.73535 10", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/BrowserIcon.js
var BrowserIcon = [
  ["path", { d: "M3 12C3 7.75736 3 5.63604 4.31802 4.31802C5.63604 3 7.75736 3 12 3C16.2426 3 18.364 3 19.682 4.31802C21 5.63604 21 7.75736 21 12C21 16.2426 21 18.364 19.682 19.682C18.364 21 16.2426 21 12 21C7.75736 21 5.63604 21 4.31802 19.682C3 18.364 3 16.2426 3 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3 9H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/BubbleChatAddIcon.js
var BubbleChatAddIcon = [
  ["path", { d: "M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C10.3719 21.5 8.8394 21.0904 7.5 20.3687C5.63177 19.362 4.37462 20.2979 3.26592 20.4658C3.09774 20.4913 2.93024 20.4302 2.80997 20.31C2.62741 20.1274 2.59266 19.8451 2.6935 19.6074C3.12865 18.5818 3.5282 16.6382 2.98341 15C2.6698 14.057 2.5 13.0483 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15.5 12H8.5M12 8.5V15.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/BubbleChatIcon.js
var BubbleChatIcon = [
  ["path", { d: "M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C10.3719 21.5 8.8394 21.0904 7.5 20.3687C5.63177 19.362 4.37462 20.2979 3.26592 20.4658C3.09774 20.4913 2.93024 20.4302 2.80997 20.31C2.62741 20.1274 2.59266 19.8451 2.6935 19.6074C3.12865 18.5818 3.5282 16.6382 2.98341 15C2.6698 14.057 2.5 13.0483 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12.1257 12H12.0007M8.125 12H8M16.125 12H16M12.2507 12C12.2507 12.1381 12.1388 12.25 12.0007 12.25C11.8627 12.25 11.7507 12.1381 11.7507 12C11.7507 11.8619 11.8627 11.75 12.0007 11.75C12.1388 11.75 12.2507 11.8619 12.2507 12ZM8.25 12C8.25 12.1381 8.13807 12.25 8 12.25C7.86193 12.25 7.75 12.1381 7.75 12C7.75 11.8619 7.86193 11.75 8 11.75C8.13807 11.75 8.25 11.8619 8.25 12ZM16.25 12C16.25 12.1381 16.1381 12.25 16 12.25C15.8619 12.25 15.75 12.1381 15.75 12C15.75 11.8619 15.8619 11.75 16 11.75C16.1381 11.75 16.25 11.8619 16.25 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Bug01Icon.js
var Bug01Icon = [
  ["path", { d: "M3.01309 4.99084C2.89323 6.05084 3.55249 8.42285 6.48923 8.42285", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17.5951 8.38081C18.8357 8.57881 21.1132 7.49881 20.9957 5.00281", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M20.9928 20.9989C21.0528 19.9429 20.1777 17.5549 17.599 17.4229", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M6.45163 17.4708C5.65013 17.2308 3.01306 18.3348 3.01306 20.9988", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M9.3299 6.11884C9.35388 5.09884 9.84533 2.99884 12.0029 2.99884C13.9208 2.99884 14.5861 4.61884 14.676 6.11884M6.26131 9.41884C6.38118 8.63884 7.29216 6.81484 9.36586 6.63484C11.4635 6.55564 14.3403 6.58684 14.8797 6.67084C15.5869 6.73377 17.2951 7.43884 17.7506 9.41884C17.9124 10.4388 17.8285 11.8788 17.8524 12.7188C17.8165 13.5588 17.9207 15.2623 17.7565 16.1388C17.6367 17.0988 16.9894 18.4668 16.1024 19.3068C14.7838 20.7228 11.1639 22.2108 8.03534 19.4508C6.41713 17.8908 6.30925 16.3788 6.18939 15.7788C6.15725 15.4571 6.15875 13.8763 6.16541 12.3588C6.14144 11.046 6.17235 9.78063 6.26131 9.41884Z", stroke: "currentColor", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M3.01306 12.8988H5.9498", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "5" }],
  ["path", { d: "M20.9929 12.8988L18.1161 12.8988", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "6" }],
  ["path", { d: "M12.0033 16.4988L12.0033 20.2788", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "7" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Calendar03Icon.js
var Calendar03Icon = [
  ["path", { d: "M16 2V6M8 2V6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 10H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M12.1258 14H12.0008M12.1258 18H12.0008M7.625 14H7.5M7.625 18H7.5M16.625 14H16.5M12.2508 14C12.2508 14.1381 12.1389 14.25 12.0008 14.25C11.8628 14.25 11.7508 14.1381 11.7508 14C11.7508 13.8619 11.8628 13.75 12.0008 13.75C12.1389 13.75 12.2508 13.8619 12.2508 14ZM12.2508 18C12.2508 18.1381 12.1389 18.25 12.0008 18.25C11.8628 18.25 11.7508 18.1381 11.7508 18C11.7508 17.8619 11.8628 17.75 12.0008 17.75C12.1389 17.75 12.2508 17.8619 12.2508 18ZM7.75 14C7.75 14.1381 7.63807 14.25 7.5 14.25C7.36193 14.25 7.25 14.1381 7.25 14C7.25 13.8619 7.36193 13.75 7.5 13.75C7.63807 13.75 7.75 13.8619 7.75 14ZM7.75 18C7.75 18.1381 7.63807 18.25 7.5 18.25C7.36193 18.25 7.25 18.1381 7.25 18C7.25 17.8619 7.36193 17.75 7.5 17.75C7.63807 17.75 7.75 17.8619 7.75 18ZM16.75 14C16.75 14.1381 16.6381 14.25 16.5 14.25C16.3619 14.25 16.25 14.1381 16.25 14C16.25 13.8619 16.3619 13.75 16.5 13.75C16.6381 13.75 16.75 13.8619 16.75 14Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CalendarCheckOut02Icon.js
var CalendarCheckOut02Icon = [
  ["path", { d: "M16 2V6M8 2V6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22H13C16.7712 22 18.6569 22 19.8284 20.8284C21 19.6569 21 17.7712 21 14V12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 10H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M13.5 18.5C14.0057 18.0085 16 16.7002 16 16C16 15.2998 14.0057 13.9915 13.5 13.5M15.5 16L9 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Cancel01Icon.js
var Cancel01Icon = [
  ["path", { d: "M18 6L6.00081 17.9992M17.9992 18L6 6.00085", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CancelCircleIcon.js
var CancelCircleIcon = [
  ["path", { d: "M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14.9994 15L9 9M9.00064 15L15 9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ChartColumnIcon.js
var ChartColumnIcon = [
  ["path", { d: "M8 9V17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13 5V17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M18 13V17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M3 3V13C3 16.7712 3 18.6569 4.17157 19.8284C5.34315 21 7.22876 21 11 21H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CheckListIcon.js
var CheckListIcon = [
  ["path", { d: "M11 6L21 6", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11 12L21 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M11 18L21 18", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M3 7.39286C3 7.39286 4 8.04466 4.5 9C4.5 9 6 5.25 8 4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M3 18.3929C3 18.3929 4 19.0447 4.5 20C4.5 20 6 16.25 8 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CheckmarkCircle02Icon.js
var CheckmarkCircle02Icon = [
  ["path", { d: "M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M8 12.5L10.5 15L16 9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CircleArrowShrink01Icon.js
var CircleArrowShrink01Icon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.115 11.1151C11.6324 10.5977 11.5463 8.4 11.5463 8.4M11.115 11.1151C10.5977 11.6324 8.4 11.5462 8.4 11.5462M11.115 11.1151L7.5 7.5M12.8882 12.8882C13.4055 12.3708 15.6032 12.4569 15.6032 12.4569M12.8882 12.8882C12.3709 13.4055 12.457 15.6032 12.457 15.6032M12.8882 12.8882L16.5 16.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CircleIcon.js
var CircleIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CleanIcon.js
var CleanIcon = [
  ["path", { d: "M21 3L13 11.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M9.44573 11.0854C6.96539 12.0368 4.98269 11.8736 3 11.0885C3.50059 17.531 6.50414 20.0089 10.5089 21C10.5089 21 13.5261 18.8664 13.961 13.8074C14.0081 13.2595 14.0317 12.9856 13.9178 12.6769C13.8038 12.3682 13.5802 12.1468 13.1329 11.704C12.3973 10.9757 12.0295 10.6116 11.5929 10.5204C11.1564 10.4293 10.5862 10.648 9.44573 11.0854Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M4.5 16.4464C4.5 16.4464 7 16.9286 9.5 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M8.5 7.25C8.5 7.94036 7.94036 8.5 7.25 8.5C6.55964 8.5 6 7.94036 6 7.25C6 6.55964 6.55964 6 7.25 6C7.94036 6 8.5 6.55964 8.5 7.25Z", stroke: "currentColor", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M11.125 4H11M11.25 4C11.25 4.13807 11.1381 4.25 11 4.25C10.8619 4.25 10.75 4.13807 10.75 4C10.75 3.86193 10.8619 3.75 11 3.75C11.1381 3.75 11.25 3.86193 11.25 4Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Clock01Icon.js
var Clock01Icon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 8V12L14 14", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CloudOffIcon.js
var CloudOffIcon = [
  ["path", { d: "M17.4776 10.5001C17.485 10.5 17.4925 10.5 17.5 10.5C19.9853 10.5 22 12.5147 22 15C22 15.8582 21.7597 16.6604 21.3428 17.3428M17.4776 10.5001C17.4924 10.3354 17.5 10.1686 17.5 10C17.5 6.96243 15.0376 4.5 12 4.5C10.9945 4.5 10.052 4.76982 9.24101 5.24101M17.4776 10.5001C17.4039 11.3178 17.1512 12.0839 16.759 12.759M6.52042 9.5227C3.98398 9.76407 2 11.9003 2 14.5C2 17.2614 4.23858 19.5 7 19.5H17.5C18.0928 19.5 18.6588 19.3854 19.1771 19.1771M6.52042 9.5227C6.67826 9.50768 6.83823 9.5 7 9.5C8.12582 9.5 9.16474 9.87209 10.0005 10.5M6.52042 9.5227C6.59145 8.69641 6.84518 7.92232 7.24101 7.24101", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2 2L22 22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CloudIcon.js
var CloudIcon = [
  ["path", { d: "M17.4776 10.0001C17.485 10 17.4925 10 17.5 10C19.9853 10 22 12.0147 22 14.5C22 16.9853 19.9853 19 17.5 19H7C4.23858 19 2 16.7614 2 14C2 11.4003 3.98398 9.26407 6.52042 9.0227M17.4776 10.0001C17.4924 9.83536 17.5 9.66856 17.5 9.5C17.5 6.46243 15.0376 4 12 4C9.12324 4 6.76233 6.20862 6.52042 9.0227M17.4776 10.0001C17.3753 11.1345 16.9286 12.1696 16.2428 13M6.52042 9.0227C6.67826 9.00768 6.83823 9 7 9C8.12582 9 9.16474 9.37209 10.0005 10", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Coffee02Icon.js
var Coffee02Icon = [
  ["path", { d: "M18.2505 10.5H19.6403C21.4918 10.5 22.0421 10.7655 21.9975 12.0838C21.9237 14.2674 20.939 16.8047 17 17.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M5.94627 20.6145C2.57185 18.02 2.07468 14.3401 2.00143 10.5001C1.96979 8.8413 2.45126 8.5 4.65919 8.5H15.3408C17.5487 8.5 18.0302 8.8413 17.9986 10.5001C17.9253 14.3401 17.4281 18.02 14.0537 20.6145C13.0934 21.3528 12.2831 21.5 10.9194 21.5H9.08064C7.71686 21.5 6.90658 21.3528 5.94627 20.6145Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M11.3089 2.5C10.7622 2.83861 10.0012 4 10.0012 5.5M7.53971 4C7.53971 4 7 4.5 7 5.5M14.0012 4C13.7279 4.1693 13.5 5 13.5 5.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/CollapseIcon.js
var CollapseIcon = [
  ["path", { d: "M13 4L13 7.00002C13 8.88563 13.0001 9.82843 13.5858 10.4142C14.1716 11 15.1144 11 17 11L20 11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.0001 20L11 17C11 15.1144 11 14.1715 10.4142 13.5858C9.82843 13 8.88563 13 7.00002 13L4.00006 13", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ComputerTerminal01Icon.js
var ComputerTerminal01Icon = [
  ["path", { d: "M7.5 7.5L8.72654 8.55719C9.24218 9.00163 9.5 9.22386 9.5 9.5C9.5 9.77614 9.24218 9.99836 8.72654 10.4428L7.5 11.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.5 12.5H15.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12 21C15.7497 21 17.6246 21 18.9389 20.0451C19.3634 19.7367 19.7367 19.3634 20.0451 18.9389C21 17.6246 21 15.7497 21 12C21 8.25027 21 6.3754 20.0451 5.06107C19.7367 4.6366 19.3634 4.26331 18.9389 3.95491C17.6246 3 15.7497 3 12 3C8.25027 3 6.3754 3 5.06107 3.95491C4.6366 4.26331 4.26331 4.6366 3.95491 5.06107C3 6.3754 3 8.25027 3 12C3 15.7497 3 17.6246 3.95491 18.9389C4.26331 19.3634 4.6366 19.7367 5.06107 20.0451C6.3754 21 8.25027 21 12 21Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Copy01Icon.js
var Copy01Icon = [
  ["path", { d: "M9 15C9 12.1716 9 10.7574 9.87868 9.87868C10.7574 9 12.1716 9 15 9L16 9C18.8284 9 20.2426 9 21.1213 9.87868C22 10.7574 22 12.1716 22 15V16C22 18.8284 22 20.2426 21.1213 21.1213C20.2426 22 18.8284 22 16 22H15C12.1716 22 10.7574 22 9.87868 21.1213C9 20.2426 9 18.8284 9 16L9 15Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M16.9999 9C16.9975 6.04291 16.9528 4.51121 16.092 3.46243C15.9258 3.25989 15.7401 3.07418 15.5376 2.90796C14.4312 2 12.7875 2 9.5 2C6.21252 2 4.56878 2 3.46243 2.90796C3.25989 3.07417 3.07418 3.25989 2.90796 3.46243C2 4.56878 2 6.21252 2 9.5C2 12.7875 2 14.4312 2.90796 15.5376C3.07417 15.7401 3.25989 15.9258 3.46243 16.092C4.51121 16.9528 6.04291 16.9975 9 16.9999", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DashedLine02Icon.js
var DashedLine02Icon = [
  ["path", { d: "M6.3 2.75143C5.26076 2.94471 4.49591 3.28657 3.89124 3.89124C3.28657 4.49591 2.94471 5.26076 2.75143 6.3M17.7 2.75143C18.7392 2.94471 19.5041 3.28657 20.1088 3.89124C20.7134 4.49591 21.0553 5.26076 21.2486 6.3M13.9 2.50495C13.3156 2.5 12.6839 2.5 12 2.5C11.3161 2.5 10.6844 2.5 10.1 2.50495M21.495 10.1C21.5 10.6844 21.5 11.3161 21.5 12C21.5 12.6839 21.5 13.3156 21.495 13.9001M2.50495 10.1C2.5 10.6844 2.5 11.3161 2.5 12C2.5 12.6839 2.5 13.3156 2.50496 13.9001M2.75143 17.7C2.94471 18.7392 3.28657 19.5041 3.89124 20.1088C4.49591 20.7134 5.26076 21.0553 6.3 21.2486M21.2486 17.7C21.0553 18.7392 20.7134 19.5041 20.1088 20.1088C19.5041 20.7134 18.7392 21.0553 17.7 21.2486M13.9 21.495C13.3156 21.5 12.6839 21.5 12 21.5C11.3162 21.5 10.6845 21.5 10.1002 21.495", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DashedLineCircleIcon.js
var DashedLineCircleIcon = [
  ["path", { d: "M14 2.20004C13.3538 2.06886 12.6849 2 12 2C11.3151 2 10.6462 2.06886 10 2.20004M21.8 10C21.9311 10.6462 22 11.3151 22 12C22 12.6849 21.9311 13.3538 21.8 14M14 21.8C13.3538 21.9311 12.6849 22 12 22C11.3151 22 10.6462 21.9311 10 21.8M2.20004 14C2.06886 13.3538 2 12.6849 2 12C2 11.3151 2.06886 10.6462 2.20004 10M17.5 3.64702C18.6332 4.39469 19.6053 5.36678 20.353 6.5M20.353 17.5C19.6053 18.6332 18.6332 19.6053 17.5 20.353M6.5 20.353C5.36678 19.6053 4.39469 18.6332 3.64702 17.5M3.64702 6.5C4.39469 5.36678 5.36678 4.39469 6.5 3.64702", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DateTimeIcon.js
var DateTimeIcon = [
  ["path", { d: "M16 2V6M8 2V6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M21 12C21 8.22876 21 6.34315 19.8284 5.17157C18.6569 4 16.7712 4 13 4H11C7.22876 4 5.34315 4 4.17157 5.17157C3 6.34315 3 8.22876 3 12V14C3 17.7712 3 19.6569 4.17157 20.8284C5.34315 22 7.22876 22 11 22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 10H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M18.2671 18.7011L17 18V16.2668M21 18C21 20.2091 19.2091 22 17 22C14.7909 22 13 20.2091 13 18C13 15.7909 14.7909 14 17 14C19.2091 14 21 15.7909 21 18Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Delete02Icon.js
var Delete02Icon = [
  ["path", { d: "M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M9.5 16.5L9.5 10.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M14.5 16.5L14.5 10.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DiscordIcon.js
var DiscordIcon = [
  ["path", { d: "M15.5 17.5C16.5 19 17.3333 19.6667 18 20C19.3333 19.6667 22 18.2 22 15C22 11.8 20.6667 7.33333 20 5.5C18 4.3 15.8333 4 15 4L14.198 5.60393C13.4135 5.28708 12.4058 5.25438 12 5.27763C11.5942 5.25438 10.5865 5.28708 9.80197 5.60393L9 4C8.16667 4 6 4.3 4 5.5C3.33333 7.33333 2 11.8 2 15C2 18.2 4.66667 19.6667 6 20C6.66667 19.6667 7.5 19 8.5 17.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17.3652 11.5C17.3652 12.6046 16.5817 13.5 15.6152 13.5C14.6487 13.5 13.8652 12.6046 13.8652 11.5C13.8652 10.3954 14.6487 9.5 15.6152 9.5C16.5817 9.5 17.3652 10.3954 17.3652 11.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M10 11.5C10 12.6046 9.2165 13.5 8.25 13.5C7.2835 13.5 6.5 12.6046 6.5 11.5C6.5 10.3954 7.2835 9.5 8.25 9.5C9.2165 9.5 10 10.3954 10 11.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M17.5 16.5C16.4022 17.3967 14.3502 18 12 18C9.64981 18 7.59785 17.3967 6.5 16.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Download01Icon.js
var Download01Icon = [
  ["path", { d: "M2.99969 17.0002C2.99969 17.9302 2.99969 18.3952 3.10192 18.7767C3.37932 19.8119 4.18796 20.6206 5.22324 20.898C5.60474 21.0002 6.06972 21.0002 6.99969 21.0002L16.9997 21.0002C17.9297 21.0002 18.3947 21.0002 18.7762 20.898C19.8114 20.6206 20.6201 19.8119 20.8975 18.7767C20.9997 18.3952 20.9997 17.9302 20.9997 17.0002", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M16.4998 11.5002C16.4998 11.5002 13.1856 16.0002 11.9997 16.0002C10.8139 16.0002 7.49976 11.5002 7.49976 11.5002M11.9997 15.0002V3.00016", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DragDropHorizontalIcon.js
var DragDropHorizontalIcon = [
  ["path", { d: "M6 8C6.55228 8 7 8.44772 7 9C7 9.55228 6.55228 10 6 10C5.44772 10 5 9.55228 5 9C5 8.44772 5.44772 8 6 8Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M6 14C6.55228 14 7 14.4477 7 15C7 15.5523 6.55228 16 6 16C5.44772 16 5 15.5523 5 15C5 14.4477 5.44772 14 6 14Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M18 8C18.5523 8 19 8.44772 19 9C19 9.55228 18.5523 10 18 10C17.4477 10 17 9.55228 17 9C17 8.44772 17.4477 8 18 8Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M12 8C12.5523 8 13 8.44772 13 9C13 9.55228 12.5523 10 12 10C11.4477 10 11 9.55228 11 9C11 8.44772 11.4477 8 12 8Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M18 14C18.5523 14 19 14.4477 19 15C19 15.5523 18.5523 16 18 16C17.4477 16 17 15.5523 17 15C17 14.4477 17.4477 14 18 14Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M12 14C12.5523 14 13 14.4477 13 15C13 15.5523 12.5523 16 12 16C11.4477 16 11 15.5523 11 15C11 14.4477 11.4477 14 12 14Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "5" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/DragDropVerticalIcon.js
var DragDropVerticalIcon = [
  ["path", { d: "M16 6C16 6.55228 15.5523 7 15 7C14.4477 7 14 6.55228 14 6C14 5.44772 14.4477 5 15 5C15.5523 5 16 5.44772 16 6Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M10 6C10 6.55228 9.55228 7 9 7C8.44772 7 8 6.55228 8 6C8 5.44772 8.44772 5 9 5C9.55228 5 10 5.44772 10 6Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M16 18C16 18.5523 15.5523 19 15 19C14.4477 19 14 18.5523 14 18C14 17.4477 14.4477 17 15 17C15.5523 17 16 17.4477 16 18Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M16 12C16 12.5523 15.5523 13 15 13C14.4477 13 14 12.5523 14 12C14 11.4477 14.4477 11 15 11C15.5523 11 16 11.4477 16 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M10 18C10 18.5523 9.55228 19 9 19C8.44772 19 8 18.5523 8 18C8 17.4477 8.44772 17 9 17C9.55228 17 10 17.4477 10 18Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M10 12C10 12.5523 9.55228 13 9 13C8.44772 13 8 12.5523 8 12C8 11.4477 8.44772 11 9 11C9.55228 11 10 11.4477 10 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "5" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Edit02Icon.js
var Edit02Icon = [
  ["path", { d: "M14.0737 3.88545C14.8189 3.07808 15.1915 2.6744 15.5874 2.43893C16.5427 1.87076 17.7191 1.85309 18.6904 2.39232C19.0929 2.6158 19.4769 3.00812 20.245 3.79276C21.0131 4.5774 21.3972 4.96972 21.6159 5.38093C22.1438 6.37312 22.1265 7.57479 21.5703 8.5507C21.3398 8.95516 20.9446 9.33578 20.1543 10.097L10.7506 19.1543C9.25288 20.5969 8.504 21.3182 7.56806 21.6837C6.63212 22.0493 5.6032 22.0224 3.54536 21.9686L3.26538 21.9613C2.63891 21.9449 2.32567 21.9367 2.14359 21.73C1.9615 21.5234 1.98636 21.2043 2.03608 20.5662L2.06308 20.2197C2.20301 18.4235 2.27297 17.5255 2.62371 16.7182C2.97444 15.9109 3.57944 15.2555 4.78943 13.9445L14.0737 3.88545Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13 4L20 11", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M14 22L22 22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Edit04Icon.js
var Edit04Icon = [
  ["path", { d: "M8.17151 19.8284L19.8284 8.17157C20.3736 7.62632 20.6462 7.3537 20.792 7.0596C21.0693 6.50005 21.0693 5.8431 20.792 5.28354C20.6462 4.98945 20.3736 4.71682 19.8284 4.17157C19.2831 3.62632 19.0105 3.3537 18.7164 3.20796C18.1568 2.93068 17.4999 2.93068 16.9403 3.20796C16.6462 3.3537 16.3736 3.62632 15.8284 4.17157L4.17151 15.8284C3.59345 16.4064 3.30442 16.6955 3.15218 17.063C2.99994 17.4305 2.99994 17.8393 2.99994 18.6568V20.9999H5.34308C6.16059 20.9999 6.56934 20.9999 6.93688 20.8477C7.30442 20.6955 7.59345 20.4064 8.17151 19.8284Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 21H18", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M14.5 5.5L18.5 9.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ElectricPlugsIcon.js
var ElectricPlugsIcon = [
  ["path", { d: "M9 2L9 5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15 2L15 5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12 18L12 22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M12.6939 8.5L10.6029 10.6749C10.3788 10.9079 10.5394 11.2433 10.9048 11.3053L13.0952 11.6773C13.4848 11.7434 13.6334 12.1147 13.361 12.3413L10.7666 14.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M14.3066 5L9.69342 5C7.5551 5 6.48594 5 5.89527 5.69774C5.3046 6.39548 5.46717 7.46639 5.79232 9.60823L6.31604 13.0581C6.83606 16.4836 8.28588 18 12 18C15.7141 18 17.1639 16.4836 17.684 13.0581L18.2077 9.60823C18.5328 7.46639 18.6954 6.39548 18.1047 5.69774C17.5141 5 16.4449 5 14.3066 5Z", stroke: "currentColor", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ExpandIcon.js
var ExpandIcon = [
  ["path", { d: "M19 12L19 8.99996C19 7.11435 18.9999 6.17155 18.4142 5.58577C17.8284 4.99999 16.8856 4.99999 15 5L12 5.00001", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M5 12L5.00003 15C5.00004 16.8856 5.00005 17.8284 5.58584 18.4142C6.17163 19 7.11443 19 9.00004 19L12 19", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/File01Icon.js
var File01Icon = [
  ["path", { d: "M8 7L16 7", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M8 11L12 11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M13 21.5V21C13 18.1716 13 16.7574 13.8787 15.8787C14.7574 15 16.1716 15 19 15H19.5M20 13.3431V10C20 6.22876 20 4.34315 18.8284 3.17157C17.6569 2 15.7712 2 12 2C8.22877 2 6.34315 2 5.17157 3.17157C4 4.34314 4 6.22876 4 10L4 14.5442C4 17.7892 4 19.4117 4.88607 20.5107C5.06508 20.7327 5.26731 20.9349 5.48933 21.1139C6.58831 22 8.21082 22 11.4558 22C12.1614 22 12.5141 22 12.8372 21.886C12.9044 21.8623 12.9702 21.835 13.0345 21.8043C13.3436 21.6564 13.593 21.407 14.0919 20.9081L18.8284 16.1716C19.4065 15.5935 19.6955 15.3045 19.8478 14.9369C20 14.5694 20 14.1606 20 13.3431Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FileAttachmentIcon.js
var FileAttachmentIcon = [
  ["path", { d: "M4 12.0004L4 14.5446C4 17.7896 4 19.4121 4.88607 20.5111C5.06508 20.7331 5.26731 20.9354 5.48933 21.1144C6.58831 22.0004 8.21082 22.0004 11.4558 22.0004C12.1614 22.0004 12.5141 22.0004 12.8372 21.8864C12.9044 21.8627 12.9702 21.8354 13.0345 21.8047C13.3436 21.6569 13.593 21.4074 14.0919 20.9085L18.8284 16.172C19.4065 15.5939 19.6955 15.3049 19.8478 14.9374C20 14.5698 20 14.1611 20 13.3436V10.0004C20 6.22919 20 4.34358 18.8284 3.172C17.7693 2.11284 16.1265 2.01122 13.0345 2.00146M13 21.5004V21.0004C13 18.172 13 16.7578 13.8787 15.8791C14.7574 15.0004 16.1716 15.0004 19 15.0004H19.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M4 8.23028V5.46105C4 3.54929 5.567 1.99951 7.5 1.99951C9.433 1.99951 11 3.54929 11 5.46105V9.26874C11 10.2246 10.2165 10.9995 9.25 10.9995C8.2835 10.9995 7.5 10.2246 7.5 9.26874V5.46105", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FileEmpty02Icon.js
var FileEmpty02Icon = [
  ["path", { d: "M13 2.5V3C13 5.82843 13 7.24264 13.8787 8.12132C14.7574 9 16.1716 9 19 9H19.5M20 10.6569V14C20 17.7712 20 19.6569 18.8284 20.8284C17.6569 22 15.7712 22 12 22C8.22876 22 6.34315 22 5.17157 20.8284C4 19.6569 4 17.7712 4 14V9.45584C4 6.21082 4 4.58831 4.88607 3.48933C5.06508 3.26731 5.26731 3.06508 5.48933 2.88607C6.58831 2 8.21082 2 11.4558 2C12.1614 2 12.5141 2 12.8372 2.11401C12.9044 2.13772 12.9702 2.165 13.0345 2.19575C13.3436 2.34355 13.593 2.593 14.0919 3.09188L18.8284 7.82843C19.4065 8.40649 19.6955 8.69552 19.8478 9.06306C20 9.4306 20 9.83935 20 10.6569Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FileQuestionMarkIcon.js
var FileQuestionMarkIcon = [
  ["path", { d: "M3.5 14.5C3.5 13.1193 4.6193 12 6 12C7.3807 12 8.5 13.1193 8.5 14.5C8.5 15.3569 8.06886 16.1131 7.41166 16.5636C6.72833 17.0319 6 17.6716 6 18.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M6.125 21.75H6M6.25 21.75C6.25 21.8881 6.13807 22 6 22C5.86193 22 5.75 21.8881 5.75 21.75C5.75 21.6119 5.86193 21.5 6 21.5C6.13807 21.5 6.25 21.6119 6.25 21.75Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M13.5 2.5V3C13.5 5.82843 13.5 7.24264 14.3787 8.12132C15.2574 9 16.6716 9 19.5 9H20M4.50394 7.98123C4.52397 5.69117 4.64575 4.40752 5.38607 3.48933C5.56507 3.26731 5.76731 3.06508 5.98932 2.88607C7.0883 2 8.71081 2 11.9558 2C12.6614 2 13.0141 2 13.3372 2.11401C13.4044 2.13772 13.4702 2.165 13.5345 2.19575C13.8435 2.34355 14.093 2.593 14.5919 3.09188L19.3284 7.82843C19.9065 8.40649 20.1955 8.69552 20.3478 9.06306C20.5 9.4306 20.5 9.83935 20.5 10.6569V14C20.5 17.7712 20.5 19.6569 19.3284 20.8284C18.1568 22 16.2712 22 12.5 22C11.7645 22 11.1007 22 10.5 21.9913", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FileViewIcon.js
var FileViewIcon = [
  ["path", { d: "M19 13.0052V10.6606C19 9.84276 19 9.43383 18.8478 9.06613C18.6955 8.69843 18.4065 8.40927 17.8284 7.83096L13.0919 3.09236C12.593 2.59325 12.3436 2.3437 12.0345 2.19583C11.9702 2.16508 11.9044 2.13778 11.8372 2.11406C11.5141 2 11.1614 2 10.4558 2C7.21082 2 5.58831 2 4.48933 2.88646C4.26731 3.06554 4.06508 3.26787 3.88607 3.48998C3 4.58943 3 6.21265 3 9.45908V14.0052C3 17.7781 3 19.6645 4.17157 20.8366C5.11466 21.7801 6.52043 21.9641 9 22M12 2.50022V3.00043C12 5.83009 12 7.24492 12.8787 8.12398C13.7574 9.00304 15.1716 9.00304 18 9.00304H18.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M16 22C18.7614 22 21 19 21 19C21 19 18.7614 16 16 16C13.2386 16 11 19 11 19C11 19 13.2386 22 16 22Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M15.9902 19H15.9992", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Folder01Icon.js
var Folder01Icon = [
  ["path", { d: "M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C22 9.08996 22 10.1433 22 12.25C22 15.7612 22 17.5167 21.1573 18.7779C20.7926 19.3238 20.3238 19.7926 19.7779 20.1573C18.5167 21 16.7612 21 13.25 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Folder02Icon.js
var Folder02Icon = [
  ["path", { d: "M2 19V7.54902C2 6.10516 2 5.38322 2.24332 4.81647C2.5467 4.10985 3.10985 3.5467 3.81647 3.24332C4.38322 3 5.09805 3 6.54902 3H7.04311C7.64819 3 8.22075 3.27394 8.60041 3.74509L10.4175 6M10.4175 6H16C17.4001 6 18.1002 6 18.635 6.27248C19.1054 6.51217 19.4878 6.89462 19.7275 7.36502C20 7.8998 20 8.59987 20 10V11M10.4175 6H7", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3.15802 15.5144L3.45643 14.7717C4.19029 12.9449 4.55723 12.0316 5.3224 11.5158C6.08757 11 7.07557 11 9.05157 11H17.1119C19.8004 11 21.1446 11 21.7422 11.8787C22.3397 12.7575 21.8405 14.0002 20.842 16.4856L20.5436 17.2283C19.8097 19.0551 19.4428 19.9684 18.6776 20.4842C17.9124 21 16.9244 21 14.9484 21H6.88812C4.19961 21 2.85535 21 2.25782 20.1213C1.66029 19.2425 2.15953 17.9998 3.15802 15.5144Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FolderAddIcon.js
var FolderAddIcon = [
  ["path", { d: "M13 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C21.9796 9.05942 21.9992 10.0588 22 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 13V21M22 17H14", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FolderEditIcon.js
var FolderEditIcon = [
  ["path", { d: "M8.00164 7.00013H16.754C18.8613 7.00013 19.9149 7.00013 20.6718 7.50574C20.9995 7.72462 21.2808 8.00588 21.4997 8.33346C21.8937 8.92301 21.9808 9.69265 22 11.0003M12.0027 7.00013L11.3691 5.73321C10.8442 4.68363 10.3645 3.62714 9.20122 3.19101C8.69172 3 8.10969 3 6.94562 3C5.12865 3 4.22017 3 3.53848 3.38033C3.05255 3.65144 2.6516 4.0523 2.38042 4.53811C2 5.21963 2 6.1279 2 7.94443V11.0003C2 15.7145 2 18.0716 3.46487 19.5361C4.82227 20.8931 6.94628 20.9927 11.0025 21", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14 19.8268V21H15.1734C15.5827 21 15.7874 21 15.9715 20.9238C16.1555 20.8475 16.3003 20.7028 16.5897 20.4134L21.4133 15.5894C21.6864 15.3164 21.8229 15.1799 21.8959 15.0327C22.0347 14.7525 22.0347 14.4236 21.8959 14.1434C21.8229 13.9961 21.6864 13.8596 21.4133 13.5866C21.1403 13.3136 21.0038 13.1771 20.8565 13.1041C20.5763 12.9653 20.2473 12.9653 19.9671 13.1041C19.8198 13.1771 19.6833 13.3136 19.4103 13.5866L19.4103 13.5866L14.5867 18.4106C14.2972 18.7 14.1525 18.8447 14.0762 19.0287C14 19.2128 14 19.4174 14 19.8268Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FolderExportIcon.js
var FolderExportIcon = [
  ["path", { d: "M19 21C19.6068 20.4102 22 18.8403 22 18C22 17.1597 19.6068 15.5898 19 15M21 18H14", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 21C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C21.9796 9.05942 21.9992 10.0588 22 12V13", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FolderGitTwoIcon.js
var FolderGitTwoIcon = [
  ["path", { d: "M8 6.50116H16.75C18.8567 6.50116 19.91 6.50116 20.6667 7.0069C20.9943 7.22584 21.2755 7.50717 21.4944 7.83484C22 8.59173 22 9.64538 22 11.7527C22 12.0122 22 12.2621 21.9997 12.5029M12 6.50116L11.3666 5.23392C10.8418 4.18406 10.3622 3.1273 9.19926 2.69106C8.6899 2.5 8.10802 2.5 6.94427 2.5C5.1278 2.5 4.21956 2.5 3.53806 2.88043C3.05227 3.15161 2.65142 3.55257 2.38032 4.03851C2 4.72021 2 5.62871 2 7.44571V10.5023C2 15.2177 2 17.5754 3.46447 19.0403C4.70529 20.2815 6.58687 20.4711 10 20.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["circle", { cx: "14", cy: "12.5", r: "2", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["circle", { cx: "20", cy: "18.5", r: "2", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M18 18.5C15.7909 18.5 14 16.7091 14 14.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M14 14.5V21.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/FolderRemoveIcon.js
var FolderRemoveIcon = [
  ["path", { d: "M13 21H12C7.28595 21 4.92893 21 3.46447 19.5355C2 18.0711 2 15.714 2 11V7.94427C2 6.1278 2 5.21956 2.38032 4.53806C2.65142 4.05227 3.05227 3.65142 3.53806 3.38032C4.21956 3 5.1278 3 6.94427 3C8.10802 3 8.6899 3 9.19926 3.19101C10.3622 3.62712 10.8418 4.68358 11.3666 5.73313L12 7M8 7H16.75C18.8567 7 19.91 7 20.6667 7.50559C20.9943 7.72447 21.2755 8.00572 21.4944 8.33329C21.9796 9.05942 21.9992 10.0588 22 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M22 15L16 21M22 21L16 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitBranchIcon.js
var GitBranchIcon = [
  ["path", { d: "M7 19H13C15.8284 19 17.2426 19 18.1213 18.1213C19 17.2426 19 15.8284 19 13V10M19 10C19.7002 10 21.0085 11.9943 21.5 12.5M19 10C18.2998 10 16.9915 11.9943 16.5 12.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M5 7L5 17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["circle", { cx: "5", cy: "5", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["circle", { cx: "19", cy: "5", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "3" }],
  ["circle", { cx: "5", cy: "19", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitForkIcon.js
var GitForkIcon = [
  ["path", { d: "M6 8C7.10457 8 8 7.10457 8 6C8 4.89543 7.10457 4 6 4C4.89543 4 4 4.89543 4 6C4 7.10457 4.89543 8 6 8Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 20C13.1046 20 14 19.1046 14 18C14 16.8954 13.1046 16 12 16C10.8954 16 10 16.8954 10 18C10 19.1046 10.8954 20 12 20Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M18 8C19.1046 8 20 7.10457 20 6C20 4.89543 19.1046 4 18 4C16.8954 4 16 4.89543 16 6C16 7.10457 16.8954 8 18 8Z", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M6.01734 8.74067C6.01734 10.4142 5.77537 12.1995 9.22051 11.9855H12.0053M17.9929 8.57617C18.1259 11.9855 16.9199 11.7648 15.7861 11.9855H12.0053M12.0053 15.7001V11.9855", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitMergeIcon.js
var GitMergeIcon = [
  ["path", { d: "M7 20C8.10457 20 9 19.1046 9 18C9 16.8954 8.10457 16 7 16C5.89543 16 5 16.8954 5 18C5 19.1046 5.89543 20 7 20Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M7 8C8.10457 8 9 7.10457 9 6C9 4.89543 8.10457 4 7 4C5.89543 4 5 4.89543 5 6C5 7.10457 5.89543 8 7 8Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M17 14C18.1046 14 19 13.1046 19 12C19 10.8954 18.1046 10 17 10C15.8954 10 15 10.8954 15 12C15 13.1046 15.8954 14 17 14Z", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M7.02116 8.2793V15.4073M14.4113 12.0047L10.0193 12.0048C8.92158 12.0048 6.86182 11.1254 7.01818 8.78001", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitPullRequestClosedIcon.js
var GitPullRequestClosedIcon = [
  ["path", { d: "M6 8L6 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 11L18 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["circle", { cx: "6", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["circle", { cx: "6", cy: "6", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "3" }],
  ["circle", { cx: "18", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M20 4L18 6M18 6L16 8M18 6L20 8M18 6L16 4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "5" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitPullRequestDraftIcon.js
var GitPullRequestDraftIcon = [
  ["path", { d: "M6 8L6 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["circle", { cx: "6", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["circle", { cx: "6", cy: "6", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["circle", { cx: "18", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M18.125 11H18M18.25 11C18.25 11.1381 18.1381 11.25 18 11.25C17.8619 11.25 17.75 11.1381 17.75 11C17.75 10.8619 17.8619 10.75 18 10.75C18.1381 10.75 18.25 10.8619 18.25 11Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M18.125 6H18M18.25 6C18.25 6.13807 18.1381 6.25 18 6.25C17.8619 6.25 17.75 6.13807 17.75 6C17.75 5.86193 17.8619 5.75 18 5.75C18.1381 5.75 18.25 5.86193 18.25 6Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "5" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GitPullRequestIcon.js
var GitPullRequestIcon = [
  ["path", { d: "M6 8L6 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M18 16V12C18 9.17156 18 7.75735 17.1213 6.87867C16.2426 5.99999 14.8284 5.99999 12 5.99999L11 5.99999M11 5.99999C11 5.29976 12.9943 3.99152 13.5 3.49999M11 5.99999C11 6.70022 12.9943 8.00846 13.5 8.49999", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["circle", { cx: "6", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["circle", { cx: "6", cy: "6", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "3" }],
  ["circle", { cx: "18", cy: "18", r: "2", stroke: "currentColor", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GithubIcon.js
var GithubIcon = [
  ["path", { d: "M10 20.5675C6.57143 21.7248 3.71429 20.5675 2 17", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M10 22V18.7579C10 18.1596 10.1839 17.6396 10.4804 17.1699C10.6838 16.8476 10.5445 16.3904 10.1771 16.2894C7.13394 15.4528 5 14.1077 5 9.64606C5 8.48611 5.38005 7.39556 6.04811 6.4464C6.21437 6.21018 6.29749 6.09208 6.31748 5.9851C6.33746 5.87813 6.30272 5.73852 6.23322 5.45932C5.95038 4.32292 5.96871 3.11619 6.39322 2.02823C6.39322 2.02823 7.27042 1.74242 9.26698 2.98969C9.72282 3.27447 9.95075 3.41686 10.1515 3.44871C10.3522 3.48056 10.6206 3.41384 11.1573 3.28041C11.8913 3.09795 12.6476 3 13.5 3C14.3524 3 15.1087 3.09795 15.8427 3.28041C16.3794 3.41384 16.6478 3.48056 16.8485 3.44871C17.0493 3.41686 17.2772 3.27447 17.733 2.98969C19.7296 1.74242 20.6068 2.02823 20.6068 2.02823C21.0313 3.11619 21.0496 4.32292 20.7668 5.45932C20.6973 5.73852 20.6625 5.87813 20.6825 5.9851C20.7025 6.09207 20.7856 6.21019 20.9519 6.4464C21.6199 7.39556 22 8.48611 22 9.64606C22 14.1077 19.8661 15.4528 16.8229 16.2894C16.4555 16.3904 16.3162 16.8476 16.5196 17.1699C16.8161 17.6396 17 18.1596 17 18.7579V22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/GridViewIcon.js
var GridViewIcon = [
  ["path", { d: "M3.88884 9.66294C4.39329 10 5.09552 10 6.49998 10C7.90445 10 8.60668 10 9.11113 9.66294C9.32951 9.51702 9.51701 9.32952 9.66292 9.11114C9.99998 8.60669 9.99998 7.90446 9.99998 6.5C9.99998 5.09554 9.99998 4.39331 9.66292 3.88886C9.51701 3.67048 9.32951 3.48298 9.11113 3.33706C8.60668 3 7.90445 3 6.49998 3C5.09552 3 4.39329 3 3.88884 3.33706C3.67046 3.48298 3.48296 3.67048 3.33705 3.88886C2.99998 4.39331 2.99998 5.09554 2.99998 6.5C2.99998 7.90446 2.99998 8.60669 3.33705 9.11114C3.48296 9.32952 3.67046 9.51702 3.88884 9.66294Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14.8888 9.66294C15.3933 10 16.0955 10 17.5 10C18.9044 10 19.6067 10 20.1111 9.66294C20.3295 9.51702 20.517 9.32952 20.6629 9.11114C21 8.60669 21 7.90446 21 6.5C21 5.09554 21 4.39331 20.6629 3.88886C20.517 3.67048 20.3295 3.48298 20.1111 3.33706C19.6067 3 18.9044 3 17.5 3C16.0955 3 15.3933 3 14.8888 3.33706C14.6705 3.48298 14.483 3.67048 14.337 3.88886C14 4.39331 14 5.09554 14 6.5C14 7.90446 14 8.60669 14.337 9.11114C14.483 9.32952 14.6705 9.51702 14.8888 9.66294Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3.88884 20.6629C4.39329 21 5.09552 21 6.49998 21C7.90445 21 8.60668 21 9.11113 20.6629C9.32951 20.517 9.51701 20.3295 9.66292 20.1111C9.99998 19.6067 9.99998 18.9045 9.99998 17.5C9.99998 16.0955 9.99998 15.3933 9.66292 14.8889C9.51701 14.6705 9.32951 14.483 9.11113 14.3371C8.60668 14 7.90445 14 6.49998 14C5.09552 14 4.39329 14 3.88884 14.3371C3.67046 14.483 3.48296 14.6705 3.33705 14.8889C2.99998 15.3933 2.99998 16.0955 2.99998 17.5C2.99998 18.9045 2.99998 19.6067 3.33705 20.1111C3.48296 20.3295 3.67046 20.517 3.88884 20.6629Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M14.8888 20.6629C15.3933 21 16.0955 21 17.5 21C18.9044 21 19.6067 21 20.1111 20.6629C20.3295 20.517 20.517 20.3295 20.6629 20.1111C21 19.6067 21 18.9045 21 17.5C21 16.0955 21 15.3933 20.6629 14.8889C20.517 14.6705 20.3295 14.483 20.1111 14.3371C19.6067 14 18.9044 14 17.5 14C16.0955 14 15.3933 14 14.8888 14.3371C14.6705 14.483 14.483 14.6705 14.337 14.8889C14 15.3933 14 16.0955 14 17.5C14 18.9045 14 19.6067 14.337 20.1111C14.483 20.3295 14.6705 20.517 14.8888 20.6629Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/HelpCircleIcon.js
var HelpCircleIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M9.5 9.5C9.5 8.11929 10.6193 7 12 7C13.3807 7 14.5 8.11929 14.5 9.5C14.5 10.3569 14.0689 11.1131 13.4117 11.5636C12.7283 12.0319 12 12.6716 12 13.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12.125 16.75H12M12.25 16.75C12.25 16.8881 12.1381 17 12 17C11.8619 17 11.75 16.8881 11.75 16.75C11.75 16.6119 11.8619 16.5 12 16.5C12.1381 16.5 12.25 16.6119 12.25 16.75Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/InformationCircleIcon.js
var InformationCircleIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 16V12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12.125 8.25H12M12.25 8.25C12.25 8.11193 12.1381 8 12 8C11.8619 8 11.75 8.11193 11.75 8.25C11.75 8.38807 11.8619 8.5 12 8.5C12.1381 8.5 12.25 8.38807 12.25 8.25Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/InternetIcon.js
var InternetIcon = [
  ["circle", { cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["ellipse", { cx: "12", cy: "12", rx: "4", ry: "10", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M2 12H22", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/LaptopIcon.js
var LaptopIcon = [
  ["path", { d: "M20.4999 16.5V8.5C20.4999 6.14298 20.4999 4.96447 19.7676 4.23223C19.0354 3.5 17.8569 3.5 15.4999 3.5H8.49988C6.14286 3.5 4.96434 3.5 4.23211 4.23223C3.49988 4.96447 3.49988 6.14298 3.49988 8.5V16.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M21.9841 20.5H2.01567C1.63273 20.5 1.38367 20.1088 1.55493 19.7764L3.49988 16.5H20.4999L22.4448 19.7764C22.6161 20.1088 22.367 20.5 21.9841 20.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Layers01Icon.js
var Layers01Icon = [
  ["path", { d: "M8.64298 3.14559L6.93816 3.93362C4.31272 5.14719 3 5.75397 3 6.75C3 7.74603 4.31272 8.35281 6.93817 9.56638L8.64298 10.3544C10.2952 11.1181 11.1214 11.5 12 11.5C12.8786 11.5 13.7048 11.1181 15.357 10.3544L17.0618 9.56638C19.6873 8.35281 21 7.74603 21 6.75C21 5.75397 19.6873 5.14719 17.0618 3.93362L15.357 3.14559C13.7048 2.38186 12.8786 2 12 2C11.1214 2 10.2952 2.38186 8.64298 3.14559Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M20.788 11.0972C20.9293 11.2959 21 11.5031 21 11.7309C21 12.7127 19.6873 13.3109 17.0618 14.5072L15.357 15.284C13.7048 16.0368 12.8786 16.4133 12 16.4133C11.1214 16.4133 10.2952 16.0368 8.64298 15.284L6.93817 14.5072C4.31272 13.3109 3 12.7127 3 11.7309C3 11.5031 3.07067 11.2959 3.212 11.0972", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M20.3767 16.2661C20.7922 16.5971 21 16.927 21 17.3176C21 18.2995 19.6873 18.8976 17.0618 20.0939L15.357 20.8707C13.7048 21.6236 12.8786 22 12 22C11.1214 22 10.2952 21.6236 8.64298 20.8707L6.93817 20.0939C4.31272 18.8976 3 18.2995 3 17.3176C3 16.927 3.20778 16.5971 3.62334 16.2661", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/LayoutTwoColumnIcon.js
var LayoutTwoColumnIcon = [
  ["path", { d: "M3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 2.5V21.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/LayoutTwoRowIcon.js
var LayoutTwoRowIcon = [
  ["path", { d: "M20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M21.5 12L2.50078 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/LinkSquare02Icon.js
var LinkSquare02Icon = [
  ["path", { d: "M11.0991 3.00012C7.45013 3.00669 5.53932 3.09629 4.31817 4.31764C3.00034 5.63568 3.00034 7.75704 3.00034 11.9997C3.00034 16.2424 3.00034 18.3638 4.31817 19.6818C5.63599 20.9999 7.75701 20.9999 11.9991 20.9999C16.241 20.9999 18.3621 20.9999 19.6799 19.6818C20.901 18.4605 20.9906 16.5493 20.9972 12.8998", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M20.556 3.49612L11.0487 13.0586M20.556 3.49612C20.062 3.00151 16.7343 3.04761 16.0308 3.05762M20.556 3.49612C21.05 3.99074 21.0039 7.32273 20.9939 8.02714", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ListViewIcon.js
var ListViewIcon = [
  ["path", { d: "M2 11.4C2 10.2417 2.24173 10 3.4 10H20.6C21.7583 10 22 10.2417 22 11.4V12.6C22 13.7583 21.7583 14 20.6 14H3.4C2.24173 14 2 13.7583 2 12.6V11.4Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2 3.4C2 2.24173 2.24173 2 3.4 2H20.6C21.7583 2 22 2.24173 22 3.4V4.6C22 5.75827 21.7583 6 20.6 6H3.4C2.24173 6 2 5.75827 2 4.6V3.4Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M2 19.4C2 18.2417 2.24173 18 3.4 18H20.6C21.7583 18 22 18.2417 22 19.4V20.6C22 21.7583 21.7583 22 20.6 22H3.4C2.24173 22 2 21.7583 2 20.6V19.4Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Loading03Icon.js
var Loading03Icon = [
  ["path", { d: "M12 3V6", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 18V21", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M21 12L18 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M6 12L3 12", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M18.3635 5.63672L16.2422 7.75804", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M7.75804 16.2422L5.63672 18.3635", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "5" }],
  ["path", { d: "M18.3635 18.3635L16.2422 16.2422", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "6" }],
  ["path", { d: "M7.75804 7.75804L5.63672 5.63672", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "7" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/LockIcon.js
var LockIcon = [
  ["path", { d: "M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 13C13.1046 13 14 12.1046 14 11C14 9.89543 13.1046 9 12 9C10.8954 9 10 9.89543 10 11C10 12.1046 10.8954 13 12 13ZM12 13L12 16", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Mail02Icon.js
var Mail02Icon = [
  ["path", { d: "M7 8.5L9.94202 10.2394C11.6572 11.2535 12.3428 11.2535 14.058 10.2394L17 8.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2.01577 13.4756C2.08114 16.5412 2.11383 18.0739 3.24496 19.2094C4.37608 20.3448 5.95033 20.3843 9.09883 20.4634C11.0393 20.5122 12.9607 20.5122 14.9012 20.4634C18.0497 20.3843 19.6239 20.3448 20.7551 19.2094C21.8862 18.0739 21.9189 16.5412 21.9842 13.4756C22.0053 12.4899 22.0053 11.5101 21.9842 10.5244C21.9189 7.45886 21.8862 5.92609 20.7551 4.79066C19.6239 3.65523 18.0497 3.61568 14.9012 3.53657C12.9607 3.48781 11.0393 3.48781 9.09882 3.53656C5.95033 3.61566 4.37608 3.65521 3.24495 4.79065C2.11382 5.92608 2.08114 7.45885 2.01576 10.5244C1.99474 11.5101 1.99475 12.4899 2.01577 13.4756Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/MailOpen01Icon.js
var MailOpen01Icon = [
  ["path", { d: "M2 19L8.91302 14.2905C11.4387 12.5698 12.5613 12.5698 15.087 14.2905L22 19", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2.01592 14.551C2.08186 17.5843 2.11484 19.1009 3.24611 20.2241C4.37738 21.3473 5.95183 21.3862 9.10072 21.4641C11.0393 21.512 12.9607 21.512 14.8993 21.4641C18.0482 21.3862 19.6226 21.3473 20.7539 20.2241C21.8852 19.1009 21.9181 17.5843 21.9841 14.551C22.0164 13.0649 21.9995 11.5934 21.9334 10.0921C21.8924 9.15964 21.8719 8.69341 21.6354 8.27984C21.3989 7.86628 20.9913 7.59935 20.176 7.0655L16.4152 4.60286C14.2742 3.20096 13.2038 2.5 12 2.5C10.7962 2.5 9.72577 3.20095 7.58483 4.60286L3.82397 7.0655C3.00869 7.59935 2.60106 7.86628 2.36459 8.27984C2.12812 8.69341 2.1076 9.15965 2.06656 10.0921C2.00049 11.5934 1.98361 13.0649 2.01592 14.551Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M22 9.5L17.7346 12.6072C16.7004 13.3606 15.8504 14 14.5 14M2 9.5L6.26538 12.6072C7.29955 13.3606 8.14961 14 9.5 14", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Menu02Icon.js
var Menu02Icon = [
  ["path", { d: "M4 5L16 5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M4 12L20 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M4 19L12 19", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/MessageAdd02Icon.js
var MessageAdd02Icon = [
  ["path", { d: "M13 3.02144C12.6777 3.00721 12.3445 2.99998 12 2.99998C4.13281 2.99998 2 7.02942 2 12C2 14.0712 2.37034 15.979 3.37161 17.5C4.63281 19.5 3.99253 21.3333 3 22C4.61547 22 5.70211 21.4858 6.39239 20.9766C6.88252 20.615 7.50688 20.4364 8.0984 20.5814C9.20689 20.8533 10.4991 21 12 21C19.1328 21 22 16.9705 22 12C22 11.3126 21.9643 10.6432 21.8812 9.99998", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12.1248 12H11.9998M16.125 12H16M8.125 12H8M12.2498 12C12.2498 12.1381 12.1379 12.25 11.9998 12.25C11.8618 12.25 11.7498 12.1381 11.7498 12C11.7498 11.8619 11.8618 11.75 11.9998 11.75C12.1379 11.75 12.2498 11.8619 12.2498 12ZM16.25 12C16.25 12.1381 16.1381 12.25 16 12.25C15.8619 12.25 15.75 12.1381 15.75 12C15.75 11.8619 15.8619 11.75 16 11.75C16.1381 11.75 16.25 11.8619 16.25 12ZM8.25 12C8.25 12.1381 8.13807 12.25 8 12.25C7.86193 12.25 7.75 12.1381 7.75 12C7.75 11.8619 7.86193 11.75 8 11.75C8.13807 11.75 8.25 11.8619 8.25 12Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M16 4.99998H22M19 1.99998L19 7.99998", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/MessageQuestionIcon.js
var MessageQuestionIcon = [
  ["path", { d: "M12 20.5C19.1328 20.5 22 16.4706 22 11.5C22 6.52944 20.1328 2.5 12 2.5C4.13281 2.5 2 6.52944 2 11.5C2 13.5712 2.37034 15.4791 3.37161 17C4.63281 19 3.99253 20.8333 3 21.5C4.61547 21.5 5.70211 20.9858 6.39239 20.4766C6.88252 20.115 7.50688 19.9364 8.0984 20.0815C9.20689 20.3533 10.4991 20.5 12 20.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M10 9C10 7.89543 10.8954 7 12 7C13.1046 7 14 7.89543 14 9C14 9.57777 13.755 10.0983 13.3632 10.4634C12.7572 11.0282 12 11.6716 12 12.5M12.125 15.75H12M12.25 15.75C12.25 15.8881 12.1381 16 12 16C11.8619 16 11.75 15.8881 11.75 15.75C11.75 15.6119 11.8619 15.5 12 15.5C12.1381 15.5 12.25 15.6119 12.25 15.75Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Mic02Icon.js
var Mic02Icon = [
  ["path", { d: "M17 7V11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M20 11C20 15.4183 16.4183 19 12 19M12 19C7.58172 19 4 15.4183 4 11M12 19V22M12 22H15M12 22H9", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/MoreHorizontalIcon.js
var MoreHorizontalIcon = [
  ["path", { d: "M6.00449 12.5V12M18.0045 12.5V12M12.0045 12.5V12M7.00449 12.5C7.00449 11.9477 6.55677 11.5 6.00449 11.5C5.4522 11.5 5.00449 11.9477 5.00449 12.5C5.00449 13.0523 5.4522 13.5 6.00449 13.5C6.55677 13.5 7.00449 13.0523 7.00449 12.5ZM19.0045 12.5C19.0045 11.9477 18.5568 11.5 18.0045 11.5C17.4522 11.5 17.0045 11.9477 17.0045 12.5C17.0045 13.0523 17.4522 13.5 18.0045 13.5C18.5568 13.5 19.0045 13.0523 19.0045 12.5ZM13.0045 12.5C13.0045 11.9477 12.5568 11.5 12.0045 11.5C11.4522 11.5 11.0045 11.9477 11.0045 12.5C11.0045 13.0523 11.4522 13.5 12.0045 13.5C12.5568 13.5 13.0045 13.0523 13.0045 12.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PackageReceiveIcon.js
var PackageReceiveIcon = [
  ["path", { d: "M12 22C11.1818 22 10.4002 21.6754 8.83693 21.0262C4.94564 19.4101 3 18.6021 3 17.2429V7.74463M12 22C12.8182 22 13.5998 21.6754 15.1631 21.0262C19.0544 19.4101 21 18.6021 21 17.2429V7.74463M12 22V12.1687M3 7.74463C3 8.3485 3.80157 8.72983 5.40472 9.49248L8.32592 10.8822C10.1288 11.7399 11.0303 12.1687 12 12.1687M3 7.74463C3 7.14076 3.80157 6.75944 5.40472 5.99678L7.5 5M21 7.74463C21 8.3485 20.1984 8.72983 18.5953 9.49248L15.6741 10.8822C13.8712 11.7399 12.9697 12.1687 12 12.1687M21 7.74463C21 7.14076 20.1984 6.75944 18.5953 5.99678L16.5 5M6 13.1518L8 14.135", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12.0037 2L12.0037 8.99995M12.0037 8.99995C12.2668 9.00351 12.5263 8.81972 12.7178 8.59534L14 7.06174M12.0037 8.99995C11.7499 8.99652 11.4929 8.81368 11.2897 8.59534L10 7.06174", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PauseIcon.js
var PauseIcon = [
  ["path", { d: "M4 7C4 5.58579 4 4.87868 4.43934 4.43934C4.87868 4 5.58579 4 7 4C8.41421 4 9.12132 4 9.56066 4.43934C10 4.87868 10 5.58579 10 7V17C10 18.4142 10 19.1213 9.56066 19.5607C9.12132 20 8.41421 20 7 20C5.58579 20 4.87868 20 4.43934 19.5607C4 19.1213 4 18.4142 4 17V7Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14 7C14 5.58579 14 4.87868 14.4393 4.43934C14.8787 4 15.5858 4 17 4C18.4142 4 19.1213 4 19.5607 4.43934C20 4.87868 20 5.58579 20 7V17C20 18.4142 20 19.1213 19.5607 19.5607C19.1213 20 18.4142 20 17 20C15.5858 20 14.8787 20 14.4393 19.5607C14 19.1213 14 18.4142 14 17V7Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PinOffIcon.js
var PinOffIcon = [
  ["path", { d: "M7.5 8C6.95863 8.1281 6.49932 8.14239 5.99268 8.45891C5.07234 9.03388 4.85108 9.71674 5.08821 10.7612C5.94028 14.5139 9.48599 18.0596 13.2388 18.9117C14.2834 19.1489 14.9661 18.928 15.5416 18.0077C15.8411 17.5288 15.8716 17.0081 16 16.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 7.79915C12.1776 7.77794 12.3182 7.74034 12.4295 7.68235C13.3997 7.17686 13.9291 5.53361 14.4498 4.60009C14.9311 3.73715 15.1718 3.30567 15.7379 3.10227C16.3041 2.89888 16.6448 3.02205 17.3262 3.26839C18.9197 3.8445 20.1555 5.08032 20.7316 6.6738C20.9779 7.35521 21.1011 7.69591 20.8977 8.26204C20.6943 8.82817 20.2628 9.06884 19.3999 9.55018C18.4608 10.074 16.7954 10.6108 16.2905 11.5898C16.2345 11.6983 16.1978 11.8327 16.1769 12", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 21L8 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M3 3L21 21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PinIcon.js
var PinIcon = [
  ["path", { d: "M3 21L8 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M13.2585 18.8714C9.51516 18.0215 5.97844 14.4848 5.12853 10.7415C4.99399 10.1489 4.92672 9.85266 5.12161 9.37197C5.3165 8.89129 5.55457 8.74255 6.03071 8.44509C7.10705 7.77265 8.27254 7.55888 9.48209 7.66586C11.1793 7.81598 12.0279 7.89104 12.4512 7.67048C12.8746 7.44991 13.1622 6.93417 13.7376 5.90269L14.4664 4.59604C14.9465 3.73528 15.1866 3.3049 15.7513 3.10202C16.316 2.89913 16.6558 3.02199 17.3355 3.26771C18.9249 3.84236 20.1576 5.07505 20.7323 6.66449C20.978 7.34417 21.1009 7.68401 20.898 8.2487C20.6951 8.8134 20.2647 9.05346 19.4039 9.53358L18.0672 10.2792C17.0376 10.8534 16.5229 11.1406 16.3024 11.568C16.0819 11.9955 16.162 12.8256 16.3221 14.4859C16.4399 15.7068 16.2369 16.88 15.5555 17.9697C15.2577 18.4458 15.1088 18.6839 14.6283 18.8786C14.1477 19.0733 13.8513 19.006 13.2585 18.8714Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PlayIcon.js
var PlayIcon = [
  ["path", { d: "M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PlusMinusSquare01Icon.js
var PlusMinusSquare01Icon = [
  ["path", { d: "M12 7.5V13.8636M15.5 10.6818H8.5M15.5 16.5H8.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PlusSignIcon.js
var PlusSignIcon = [
  ["path", { d: "M12 4V20M20 12H4", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/PuzzleIcon.js
var PuzzleIcon = [
  ["path", { d: "M12.828 6.00096C12.9388 5.68791 12.999 5.35099 12.999 5C12.999 3.34315 11.6559 2 9.99904 2C8.34219 2 6.99904 3.34315 6.99904 5C6.99904 5.35099 7.05932 5.68791 7.17008 6.00096C4.88532 6.0093 3.66601 6.09039 2.87772 6.87868C2.08951 7.66689 2.00836 8.88603 2 11.1704C2.31251 11.06 2.64876 11 2.99904 11C4.6559 11 5.99904 12.3431 5.99904 14C5.99904 15.6569 4.6559 17 2.99904 17C2.64876 17 2.31251 16.94 2 16.8296C2.00836 19.114 2.08951 20.3331 2.87772 21.1213C3.66593 21.9095 4.88508 21.9907 7.16941 21.999C7.05908 21.6865 6.99904 21.3503 6.99904 21C6.99904 19.3431 8.34219 18 9.99904 18C11.6559 18 12.999 19.3431 12.999 21C12.999 21.3503 12.939 21.6865 12.8287 21.999C15.113 21.9907 16.3322 21.9095 17.1204 21.1213C17.9086 20.333 17.9897 19.1137 17.9981 16.829C18.3111 16.9397 18.648 17 18.999 17C20.6559 17 21.999 15.6569 21.999 14C21.999 12.3431 20.6559 11 18.999 11C18.648 11 18.3111 11.0603 17.9981 11.171C17.9897 8.88627 17.9086 7.66697 17.1204 6.87868C16.3321 6.09039 15.1128 6.0093 12.828 6.00096Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Refresh01Icon.js
var Refresh01Icon = [
  ["path", { d: "M20.4879 15C19.2524 18.4956 15.9187 21 12 21C7.02943 21 3 16.9706 3 12C3 7.02943 7.02943 3 12 3C15.7292 3 18.9286 5.26806 20.2941 8.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15 9H18C19.4142 9 20.1213 9 20.5607 8.56066C21 8.12132 21 7.41421 21 6V3", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/RepeatIcon.js
var RepeatIcon = [
  ["path", { d: "M16.3884 3L17.3913 3.97574C17.8393 4.41165 18.0633 4.62961 17.9844 4.81481C17.9056 5 17.5888 5 16.9552 5H9.19422C5.22096 5 2 8.13401 2 12C2 13.4872 2.47668 14.8662 3.2895 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M7.61156 21L6.60875 20.0243C6.16074 19.5883 5.93673 19.3704 6.01557 19.1852C6.09441 19 6.4112 19 7.04478 19H14.8058C18.779 19 22 15.866 22 12C22 10.5128 21.5233 9.13383 20.7105 8", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Search01Icon.js
var Search01Icon = [
  ["path", { d: "M17 17L21 21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SecurityCheckIcon.js
var SecurityCheckIcon = [
  ["path", { d: "M18.7088 3.49534C16.8165 2.55382 14.5009 2 12 2C9.4991 2 7.1835 2.55382 5.29116 3.49534C4.36318 3.95706 3.89919 4.18792 3.4496 4.91378C3 5.63965 3 6.34248 3 7.74814V11.2371C3 16.9205 7.54236 20.0804 10.173 21.4338C10.9067 21.8113 11.2735 22 12 22C12.7265 22 13.0933 21.8113 13.8269 21.4338C16.4576 20.0804 21 16.9205 21 11.2371L21 7.74814C21 6.34249 21 5.63966 20.5504 4.91378C20.1008 4.18791 19.6368 3.95706 18.7088 3.49534Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M9 11.5C9 11.5 10.4079 11.7519 11 13.5C11 13.5 12.5 10.5 15 9.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SentIcon.js
var SentIcon = [
  ["path", { d: "M21.0477 3.05293C18.8697 0.707363 2.48648 6.4532 2.50001 8.551C2.51535 10.9299 8.89809 11.6617 10.6672 12.1581C11.7311 12.4565 12.016 12.7625 12.2613 13.8781C13.3723 18.9305 13.9301 21.4435 15.2014 21.4996C17.2278 21.5892 23.1733 5.342 21.0477 3.05293Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.4999 12.5L14.9999 9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Settings01Icon.js
var Settings01Icon = [
  ["path", { d: "M21.3175 7.14139L20.8239 6.28479C20.4506 5.63696 20.264 5.31305 19.9464 5.18388C19.6288 5.05472 19.2696 5.15664 18.5513 5.36048L17.3311 5.70418C16.8725 5.80994 16.3913 5.74994 15.9726 5.53479L15.6357 5.34042C15.2766 5.11043 15.0004 4.77133 14.8475 4.37274L14.5136 3.37536C14.294 2.71534 14.1842 2.38533 13.9228 2.19657C13.6615 2.00781 13.3143 2.00781 12.6199 2.00781H11.5051C10.8108 2.00781 10.4636 2.00781 10.2022 2.19657C9.94085 2.38533 9.83106 2.71534 9.61149 3.37536L9.27753 4.37274C9.12465 4.77133 8.84845 5.11043 8.48937 5.34042L8.15249 5.53479C7.73374 5.74994 7.25259 5.80994 6.79398 5.70418L5.57375 5.36048C4.85541 5.15664 4.49625 5.05472 4.17867 5.18388C3.86109 5.31305 3.67445 5.63696 3.30115 6.28479L2.80757 7.14139C2.45766 7.74864 2.2827 8.05227 2.31666 8.37549C2.35061 8.69871 2.58483 8.95918 3.05326 9.48012L4.0843 10.6328C4.3363 10.9518 4.51521 11.5078 4.51521 12.0077C4.51521 12.5078 4.33636 13.0636 4.08433 13.3827L3.05326 14.5354C2.58483 15.0564 2.35062 15.3168 2.31666 15.6401C2.2827 15.9633 2.45766 16.2669 2.80757 16.8741L3.30114 17.7307C3.67443 18.3785 3.86109 18.7025 4.17867 18.8316C4.49625 18.9608 4.85542 18.8589 5.57377 18.655L6.79394 18.3113C7.25263 18.2055 7.73387 18.2656 8.15267 18.4808L8.4895 18.6752C8.84851 18.9052 9.12464 19.2442 9.2775 19.6428L9.61149 20.6403C9.83106 21.3003 9.94085 21.6303 10.2022 21.8191C10.4636 22.0078 10.8108 22.0078 11.5051 22.0078H12.6199C13.3143 22.0078 13.6615 22.0078 13.9228 21.8191C14.1842 21.6303 14.294 21.3003 14.5136 20.6403L14.8476 19.6428C15.0004 19.2442 15.2765 18.9052 15.6356 18.6752L15.9724 18.4808C16.3912 18.2656 16.8724 18.2055 17.3311 18.3113L18.5513 18.655C19.2696 18.8589 19.6288 18.9608 19.9464 18.8316C20.264 18.7025 20.4506 18.3785 20.8239 17.7307L21.3175 16.8741C21.6674 16.2669 21.8423 15.9633 21.8084 15.6401C21.7744 15.3168 21.5402 15.0564 21.0718 14.5354L20.0407 13.3827C19.7887 13.0636 19.6098 12.5078 19.6098 12.0077C19.6098 11.5078 19.7888 10.9518 20.0407 10.6328L21.0718 9.48012C21.5402 8.95918 21.7744 8.69871 21.8084 8.37549C21.8423 8.05227 21.6674 7.74864 21.3175 7.14139Z", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15.5195 12C15.5195 13.933 13.9525 15.5 12.0195 15.5C10.0865 15.5 8.51953 13.933 8.51953 12C8.51953 10.067 10.0865 8.5 12.0195 8.5C13.9525 8.5 15.5195 10.067 15.5195 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SidebarBottomIcon.js
var SidebarBottomIcon = [
  ["path", { d: "M2 12C2 8.31087 2 6.4663 2.81382 5.15877C3.1149 4.67502 3.48891 4.25427 3.91891 3.91555C5.08116 3 6.72077 3 10 3H14C17.2792 3 18.9188 3 20.0811 3.91555C20.5111 4.25427 20.8851 4.67502 21.1862 5.15877C22 6.4663 22 8.31087 22 12C22 15.6891 22 17.5337 21.1862 18.8412C20.8851 19.325 20.5111 19.7457 20.0811 20.0845C18.9188 21 17.2792 21 14 21H10C6.72077 21 5.08116 21 3.91891 20.0845C3.48891 19.7457 3.1149 19.325 2.81382 18.8412C2 17.5337 2 15.6891 2 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M2 14.5L22 14.5", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M6 18H7M10 18H11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SidebarLeftIcon.js
var SidebarLeftIcon = [
  ["path", { d: "M2 12C2 8.31087 2 6.4663 2.81382 5.15877C3.1149 4.67502 3.48891 4.25427 3.91891 3.91554C5.08116 3 6.72077 3 10 3H14C17.2792 3 18.9188 3 20.0811 3.91554C20.5111 4.25427 20.8851 4.67502 21.1862 5.15877C22 6.4663 22 8.31087 22 12C22 15.6891 22 17.5337 21.1862 18.8412C20.8851 19.325 20.5111 19.7457 20.0811 20.0845C18.9188 21 17.2792 21 14 21H10C6.72077 21 5.08116 21 3.91891 20.0845C3.48891 19.7457 3.1149 19.325 2.81382 18.8412C2 17.5337 2 15.6891 2 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M9.5 3L9.5 21", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M5 7H6M5 10H6", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SidebarRightIcon.js
var SidebarRightIcon = [
  ["path", { d: "M2 12C2 8.3109 2 6.46633 2.81382 5.1588C3.1149 4.67505 3.48891 4.2543 3.91891 3.91557C5.08116 3.00003 6.72077 3.00003 10 3.00003H14C17.2792 3.00003 18.9188 3.00003 20.0811 3.91557C20.5111 4.2543 20.8851 4.67505 21.1862 5.1588C22 6.46633 22 8.3109 22 12C22 15.6892 22 17.5337 21.1862 18.8413C20.8851 19.325 20.5111 19.7458 20.0811 20.0845C18.9188 21 17.2792 21 14 21H10C6.72077 21 5.08116 21 3.91891 20.0845C3.48891 19.7458 3.1149 19.325 2.81382 18.8413C2 17.5337 2 15.6892 2 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14.5 3.00003L14.5 21", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M18 7.00006H19M18 10.0001H19", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SlidersHorizontalIcon.js
var SlidersHorizontalIcon = [
  ["path", { d: "M3.99963 5.00055L9.99963 5.00031", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12.9996 5.00031L19.9996 5.00031", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M15.9996 9.00031L15.9996 15.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M9.99963 2.00031L9.99963 8.00031", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M11.9996 16.0003L11.9996 22.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "4" }],
  ["path", { d: "M15.9996 12.0001L19.9996 12.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "5" }],
  ["path", { d: "M3.99963 12.0005L12.9996 12.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "6" }],
  ["path", { d: "M11.9996 19.0003L19.9996 19.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "7" }],
  ["path", { d: "M3.99963 19.0005L8.99963 19.0003", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "8" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SmartPhone01Icon.js
var SmartPhone01Icon = [
  ["path", { d: "M13.5 2H10.5C8.14298 2 6.96447 2 6.23223 2.73223C5.5 3.46447 5.5 4.64298 5.5 7V17C5.5 19.357 5.5 20.5355 6.23223 21.2678C6.96447 22 8.14298 22 10.5 22H13.5C15.857 22 17.0355 22 17.7678 21.2678C18.5 20.5355 18.5 19.357 18.5 17V7C18.5 4.64298 18.5 3.46447 17.7678 2.73223C17.0355 2 15.857 2 13.5 2Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12.125 19H12M12.25 19C12.25 19.1381 12.1381 19.25 12 19.25C11.8619 19.25 11.75 19.1381 11.75 19C11.75 18.8619 11.8619 18.75 12 18.75C12.1381 18.75 12.25 18.8619 12.25 19Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Sorting01Icon.js
var Sorting01Icon = [
  ["path", { d: "M11.0001 8L19.0001 8.00006", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M11.0001 12H16.0001", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M11.0001 16H14.0001", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M11.0001 4H21.0001", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M5.5 21V3M5.5 21C4.79977 21 3.49153 19.0057 3 18.5M5.5 21C6.20023 21 7.50847 19.0057 8 18.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SourceCodeIcon.js
var SourceCodeIcon = [
  ["path", { d: "M17 8L18.8398 9.85008C19.6133 10.6279 20 11.0168 20 11.5C20 11.9832 19.6133 12.3721 18.8398 13.1499L17 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M7 8L5.16019 9.85008C4.38673 10.6279 4 11.0168 4 11.5C4 11.9832 4.38673 12.3721 5.16019 13.1499L7 15", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M14.5 4L9.5 20", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SquareIcon.js
var SquareIcon = [
  ["path", { d: "M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/SquareUnlock02Icon.js
var SquareUnlock02Icon = [
  ["path", { d: "M12 16.5V14.5", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M4.26781 18.8447C4.49269 20.515 5.87613 21.8235 7.55966 21.9009C8.97627 21.966 10.4153 22 12 22C13.5847 22 15.0237 21.966 16.4403 21.9009C18.1239 21.8235 19.5073 20.515 19.7322 18.8447C19.879 17.7547 20 16.6376 20 15.5C20 14.3624 19.879 13.2453 19.7322 12.1553C19.5073 10.485 18.1239 9.17649 16.4403 9.09909C15.0237 9.03397 13.5847 9 12 9C10.4153 9 8.97627 9.03397 7.55966 9.09909C5.87613 9.17649 4.49269 10.485 4.26781 12.1553C4.12105 13.2453 4 14.3624 4 15.5C4 16.6376 4.12105 17.7547 4.26781 18.8447Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M7.5 9V6.5C7.5 4.01472 9.51472 2 12 2C13.9593 2 15.5 3.5 16 5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/StarIcon.js
var StarIcon = [
  ["path", { d: "M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Target02Icon.js
var Target02Icon = [
  ["path", { d: "M17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14 2.20004C13.3538 2.06886 12.6849 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 11.3151 21.9311 10.6462 21.8 10", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12.0303 11.9625L16.5832 7.4096M19.7404 4.34462L19.1872 2.35748C19.0853 2.03011 18.6914 1.89965 18.4259 2.11662C16.9898 3.29018 15.4254 4.87091 16.703 7.36419C19.2771 8.56455 20.7466 6.94584 21.8733 5.5853C22.0975 5.3146 21.9623 4.90767 21.6247 4.81005L19.7404 4.34462Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/TestTube01Icon.js
var TestTube01Icon = [
  ["path", { d: "M8 2H16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M16.2187 13.0044L15.9921 13.6151C15.5219 14.65 14.1115 15.7439 11.7609 14.3182C10.2471 13.4001 8.93663 12.6631 7.9997 13.16L7.21891 13.5412", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M14.5323 2V8.56602C14.5323 9.27829 14.5323 9.63442 14.6304 9.97222C14.7285 10.31 14.9197 10.612 15.3021 11.216L17.2861 14.35C19.4275 17.7326 20.4982 19.4238 19.7751 20.7119C19.0519 22 17.0317 22 12.9914 22H11.0086C6.96825 22 4.94807 22 4.22495 20.7119C3.50182 19.4238 4.57251 17.7326 6.71389 14.35L8.69792 11.216C9.08029 10.612 9.27148 10.31 9.36961 9.97222C9.46773 9.63442 9.46773 9.27829 9.46773 8.56602V2", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M15.125 19H15M15.25 19C15.25 19.1381 15.1381 19.25 15 19.25C14.8619 19.25 14.75 19.1381 14.75 19C14.75 18.8619 14.8619 18.75 15 18.75C15.1381 18.75 15.25 18.8619 15.25 19Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M10.125 17H10M10.25 17C10.25 17.1381 10.1381 17.25 10 17.25C9.86193 17.25 9.75 17.1381 9.75 17C9.75 16.8619 9.86193 16.75 10 16.75C10.1381 16.75 10.25 16.8619 10.25 17Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/TextWrapIcon.js
var TextWrapIcon = [
  ["path", { d: "M3 3H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3 15H9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 21H9", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M3 9H16.5C18.9853 9 21 11.0147 21 13.5C21 15.9853 18.9853 18 16.5 18H12M12 18C12 17.1597 14.3932 15.5898 15 15M12 18C12 18.8403 14.3932 20.4102 15 21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Tick02Icon.js
var Tick02Icon = [
  ["path", { d: "M5 14L8.5 17.5L19 6.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/TimeScheduleIcon.js
var TimeScheduleIcon = [
  ["path", { d: "M12 8V12L13.5 13.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M19.5454 16.4534C21.1818 17.337 22 17.7789 22 18.5C22 19.2211 21.1818 19.663 19.5454 20.5466L18.4311 21.1484C17.1744 21.827 16.5461 22.1663 16.2439 21.9196C15.504 21.3154 16.6567 19.7561 16.9403 19.2037C17.2277 18.644 17.2225 18.3459 16.9403 17.7963C16.6567 17.2439 15.504 15.6846 16.2439 15.0804C16.5461 14.8337 17.1744 15.173 18.4311 15.8516L19.5454 16.4534Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M13.0261 21.948C12.6888 21.9824 12.3464 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 12.6849 21.9311 13.3538 21.8 14", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ToolCaseIcon.js
var ToolCaseIcon = [
  ["path", { d: "M20.0004 10.9826C20.6281 10.1316 21 9.07385 21 7.92761C21 5.11556 18.7614 2.83594 16 2.83594C14.0209 2.83594 12.3104 4.00687 11.5 5.70554", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14.6364 21.1658H9.36364C6.67794 21.1658 5.33509 21.1658 4.40253 20.4549C4.13533 20.2512 3.89812 20.0096 3.69811 19.7375C3 18.7879 3 17.4204 3 14.6855C3 13.1226 3 12.3412 3.39892 11.7986C3.51321 11.6431 3.64876 11.505 3.80144 11.3887C4.33434 10.9824 5.10168 10.9824 6.63636 10.9824H17.3636C18.8983 10.9824 19.6657 10.9824 20.1986 11.3887C20.3512 11.505 20.4868 11.6431 20.6011 11.7986C21 12.3412 21 13.1226 21 14.6855C21 17.4204 21 18.7879 20.3019 19.7375C20.1019 20.0096 19.8647 20.2512 19.5975 20.4549C18.6649 21.1658 17.3221 21.1658 14.6364 21.1658Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M10 15.0547H14", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M13.6858 10.9826L13.335 10.1564C13.2474 9.94999 13.2565 9.71349 13.3595 9.51989L14.9144 6.59747C15.1776 6.10273 14.7982 5.48558 14.2636 5.53902L11.1099 5.85432C10.9004 5.87526 10.692 5.78776 10.5492 5.6189L8.39732 3.07491C8.03241 2.64349 7.37203 2.82539 7.26584 3.38656L6.63969 6.69573C6.59813 6.91538 6.46021 7.09827 6.26863 7.18779L3.38401 8.53572C2.89509 8.76418 2.86669 9.49366 3.33529 9.78682L5.24666 10.9826", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ToolboxIcon.js
var ToolboxIcon = [
  ["path", { d: "M3 15V14H21V15C21 17.8284 21 19.2426 20.1213 20.1213C19.2426 21 17.8284 21 15 21H9C6.17157 21 4.75736 21 3.87868 20.1213C3 19.2426 3 17.8284 3 15Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M3 14L3.00001 12.9999C3.00003 11.5278 3.00004 10.7918 3.31675 10.1584C3.63347 9.52493 4.22231 9.08329 5.39999 8.20002C6.19297 7.60528 6.58946 7.30791 7.05132 7.15395C7.51317 7 8.00879 7 9.00002 7H15C15.9912 7 16.4868 7 16.9487 7.15395C17.4105 7.3079 17.807 7.60527 18.6 8.2C19.7777 9.08328 20.3666 9.52492 20.6833 10.1584C21 10.7918 21 11.5279 21 13V14H3Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M16 12V16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M8 12V16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M8.49997 7.00006V6.50006C8.49997 5.0956 8.49997 4.39337 8.83703 3.88892C8.98295 3.67054 9.17045 3.48304 9.38883 3.33712C9.89328 3.00006 10.5955 3.00006 12 3.00006C13.4044 3.00006 14.1067 3.00006 14.6111 3.33712C14.8295 3.48304 15.017 3.67054 15.1629 3.88892C15.5 4.39337 15.5 5.0956 15.5 6.50006V7.00006", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/Unarchive03Icon.js
var Unarchive03Icon = [
  ["path", { d: "M21 7H3V13C3 16.7712 3 18.6569 4.17157 19.8284C5.34315 21 7.22876 21 11 21H13C16.7712 21 18.6569 21 19.8284 19.8284C21 18.6569 21 16.7712 21 13V7Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M21 7H3L4.2 5.4C5.08328 4.22229 5.52492 3.63344 6.15836 3.31672C6.7918 3 7.52786 3 9 3H15C16.4721 3 17.2082 3 17.8416 3.31672C18.4751 3.63344 18.9167 4.22229 19.8 5.4L21 7Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M12 11L12 17.5M9 13.5C9.58984 12.8932 11.1597 10.5 12 10.5C12.8403 10.5 14.4102 12.8932 15 13.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/UserAdd01Icon.js
var UserAdd01Icon = [
  ["path", { d: "M15 8C15 5.23858 12.7614 3 10 3C7.23858 3 5 5.23858 5 8C5 10.7614 7.23858 13 10 13C12.7614 13 15 10.7614 15 8Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M17.5 21L17.5 14M14 17.5H21", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M3 20C3 16.134 6.13401 13 10 13C11.4872 13 12.8662 13.4638 14 14.2547", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/UserIcon.js
var UserIcon = [
  ["path", { d: "M17 8.5C17 5.73858 14.7614 3.5 12 3.5C9.23858 3.5 7 5.73858 7 8.5C7 11.2614 9.23858 13.5 12 13.5C14.7614 13.5 17 11.2614 17 8.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M19 20.5C19 16.634 15.866 13.5 12 13.5C8.13401 13.5 5 16.634 5 20.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ViewOffIcon.js
var ViewOffIcon = [
  ["path", { d: "M22 8C22 8 18 14 12 14C6 14 2 8 2 8", stroke: "currentColor", strokeLinecap: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15 13.5L16.5 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M20 11L22 13", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M2 13L4 11", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "3" }],
  ["path", { d: "M9 13.5L7.5 16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "4" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ViewIcon.js
var ViewIcon = [
  ["path", { d: "M21.544 11.045C21.848 11.4713 22 11.6845 22 12C22 12.3155 21.848 12.5287 21.544 12.955C20.1779 14.8706 16.6892 19 12 19C7.31078 19 3.8221 14.8706 2.45604 12.955C2.15201 12.5287 2 12.3155 2 12C2 11.6845 2.15201 11.4713 2.45604 11.045C3.8221 9.12944 7.31078 5 12 5C16.6892 5 20.1779 9.12944 21.544 11.045Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12Z", stroke: "currentColor", strokeWidth: "1.5", key: "1" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/WorkflowCircle03Icon.js
var WorkflowCircle03Icon = [
  ["path", { d: "M15 5C15 6.65685 13.6569 8 12 8C10.3431 8 9 6.65685 9 5C9 3.34315 10.3431 2 12 2C13.6569 2 15 3.34315 15 5Z", stroke: "currentColor", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M12 8V9M12 9C12 9.93188 12 10.3978 12.1776 10.7654C12.4144 11.2554 12.8687 11.6448 13.4404 11.8478C13.8692 12 14.4128 12 15.5 12C16.5872 12 17.1308 12 17.5596 12.1522C18.1313 12.3552 18.5856 12.7446 18.8224 13.2346C19 13.6022 19 14.0681 19 15V16M12 9C12 9.93188 12 10.3978 11.8224 10.7654C11.5856 11.2554 11.1313 11.6448 10.5596 11.8478C10.1308 12 9.5872 12 8.5 12C7.4128 12 6.8692 12 6.44041 12.1522C5.86867 12.3552 5.41443 12.7446 5.17761 13.2346C5 13.6022 5 14.0681 5 15V16", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M8 19C8 20.6569 6.65685 22 5 22C3.34315 22 2 20.6569 2 19C2 17.3431 3.34315 16 5 16C6.65685 16 8 17.3431 8 19Z", stroke: "currentColor", strokeWidth: "1.5", key: "2" }],
  ["path", { d: "M22 19C22 20.6569 20.6569 22 19 22C17.3431 22 16 20.6569 16 19C16 17.3431 17.3431 16 19 16C20.6569 16 22 17.3431 22 19Z", stroke: "currentColor", strokeWidth: "1.5", key: "3" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ZapIcon.js
var ZapIcon = [
  ["path", { d: "M8.62814 12.6736H8.16918C6.68545 12.6736 5.94358 12.6736 5.62736 12.1844C5.31114 11.6953 5.61244 11.0138 6.21504 9.65083L8.02668 5.55323C8.57457 4.314 8.84852 3.69438 9.37997 3.34719C9.91142 3 10.5859 3 11.935 3H14.0244C15.6632 3 16.4826 3 16.7916 3.53535C17.1007 4.0707 16.6942 4.78588 15.8811 6.21623L14.8092 8.10188C14.405 8.81295 14.2029 9.16849 14.2057 9.45952C14.2094 9.83775 14.4105 10.1862 14.7354 10.377C14.9854 10.5239 15.3927 10.5239 16.2074 10.5239C17.2373 10.5239 17.7523 10.5239 18.0205 10.7022C18.3689 10.9338 18.5513 11.3482 18.4874 11.7632C18.4382 12.0826 18.0918 12.4656 17.399 13.2317L11.8639 19.3523C10.7767 20.5545 10.2331 21.1556 9.86807 20.9654C9.50303 20.7751 9.67833 19.9822 10.0289 18.3962L10.7157 15.2896C10.9826 14.082 11.1161 13.4782 10.7951 13.0759C10.4741 12.6736 9.85877 12.6736 8.62814 12.6736Z", stroke: "currentColor", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ZoomInAreaIcon.js
var ZoomInAreaIcon = [
  ["path", { d: "M18.5016 19.1217L21 21.6217M20 15.1217C20 12.0842 17.5376 9.62173 14.5 9.62173C11.4624 9.62173 9 12.0842 9 15.1217C9 18.1593 11.4624 20.6217 14.5 20.6217C17.5376 20.6217 20 18.1593 20 15.1217Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M14.5 13.1217V17.1217M16.5 15.1217H12.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M10 3.62173H14M3 10.6217V14.6217M6.5 21.6217C4.567 21.6217 3 20.0547 3 18.1217M17.5 3.62173C19.433 3.62173 21 5.18873 21 7.12173M3 7.12173C3 5.18873 4.567 3.62173 6.5 3.62173", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/core-free-icons/dist/esm/ZoomOutAreaIcon.js
var ZoomOutAreaIcon = [
  ["path", { d: "M18.5016 18.5L21 21M20 14.5C20 11.4624 17.5376 9 14.5 9C11.4624 9 9 11.4624 9 14.5C9 17.5376 11.4624 20 14.5 20C17.5376 20 20 17.5376 20 14.5Z", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "0" }],
  ["path", { d: "M16.5 14.5H12.5", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "1" }],
  ["path", { d: "M10 3H14M3 10V14M6.5 21C4.567 21 3 19.433 3 17.5M17.5 3C19.433 3 21 4.567 21 6.5M3 6.5C3 4.567 4.567 3 6.5 3", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "1.5", key: "2" }]
];

// ../../node_modules/@hugeicons/react/dist/esm/HugeiconsIcon.js
var defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none"
};
var HugeiconsIcon = forwardRef(({ color = "currentColor", size = 24, strokeWidth, absoluteStrokeWidth = false, className = "", altIcon, showAlt = false, icon, primaryColor, secondaryColor, disableSecondaryOpacity = false, ...rest }, ref) => {
  const calculatedStrokeWidth = strokeWidth !== void 0 ? absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth : void 0;
  const strokeProps = calculatedStrokeWidth !== void 0 ? {
    strokeWidth: calculatedStrokeWidth,
    stroke: "currentColor"
  } : {};
  const elementProps = {
    ref,
    ...defaultAttributes,
    width: size,
    height: size,
    color: primaryColor || color,
    className,
    ...strokeProps,
    ...rest
  };
  const currentIcon = showAlt && altIcon ? altIcon : icon;
  const svgChildren = [...currentIcon].sort(([, a], [, b]) => {
    const hasOpacityA = a.opacity !== void 0;
    const hasOpacityB = b.opacity !== void 0;
    return hasOpacityB ? 1 : hasOpacityA ? -1 : 0;
  }).map(([tag, attrs]) => {
    const isSecondaryPath = attrs.opacity !== void 0;
    const pathOpacity = isSecondaryPath && !disableSecondaryOpacity ? attrs.opacity : void 0;
    const fillProps = secondaryColor ? {
      ...attrs.stroke !== void 0 ? {
        stroke: isSecondaryPath ? secondaryColor : primaryColor || color
      } : {
        fill: isSecondaryPath ? secondaryColor : primaryColor || color
      }
    } : {};
    return createElement(tag, {
      ...attrs,
      ...strokeProps,
      ...fillProps,
      opacity: pathOpacity,
      key: attrs.key
    });
  });
  return createElement("svg", elementProps, svgChildren);
});
HugeiconsIcon.displayName = "HugeiconsIcon";

// bb-plugin-runtime-shim:@get-bb/plugin-sdk/app
var runtime2 = globalThis.__bbPluginRuntime;
if (runtime2 == null || runtime2.pluginSdkApp == null) {
  throw new Error('Cannot load "@get-bb/plugin-sdk/app": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod2 = runtime2.pluginSdkApp;
var {
  Markdown,
  ThreadChat,
  definePluginApp,
  experimental_NewThreadComposer,
  experimental_useSidebarThreadActions,
  experimental_useSidebarThreadPullRequest,
  experimental_useSidebarThreadSplit,
  experimental_useSidebarThreads,
  useBbContext,
  useBbNavigate,
  useComposer,
  useComposerView,
  useRealtime,
  useRealtimeConnectionState,
  useRpc,
  useSettings
} = mod2;

// core.ts
var WORKFLOW_CONFIG_VERSION = 2;
var SECTION_ICON_OPTIONS = [
  "AiContentGenerator01",
  "AlertCircle",
  "AlertTriangle",
  "AlignLeft",
  "AppWindow",
  "Archive",
  "ArchiveRestore",
  "ArrowDown",
  "ArrowReloadHorizontal",
  "ArrowRight",
  "ArrowTurnBackward",
  "ArrowTurnForward",
  "ArrowUp",
  "ArrowUpDown",
  "ArrowUpRight",
  "Beaker",
  "Brain",
  "Browser",
  "Bug",
  "Calendar",
  "CalendarCheckOut02",
  "ChartColumn",
  "Check",
  "ChevronDown",
  "ChevronLeft",
  "ChevronRight",
  "ChevronUp",
  "ChevronsDown",
  "ChevronsUp",
  "Circle",
  "CircleArrowShrink",
  "CircleCheck",
  "CircleQuestion",
  "CircleX",
  "Clean",
  "Clock",
  "ClosePluginPane",
  "CloseThreadPane",
  "Cloud",
  "CloudOff",
  "Code",
  "Coffee",
  "Columns2",
  "ComputerTerminal01",
  "Copy",
  "CornerDownLeft",
  "CornerDownRight",
  "DateTime",
  "Discord",
  "Download",
  "DragDropHorizontal",
  "DragDropVertical",
  "Edit",
  "EditFile",
  "ElectricPlugs",
  "Explore",
  "ExternalLink",
  "Eye",
  "EyeOff",
  "File",
  "FileAttachment",
  "FileDiff",
  "FileQuestion",
  "FileText",
  "FileView",
  "Folder",
  "FolderEdit",
  "FolderExport",
  "FolderGit",
  "FolderMinus",
  "FolderOpen",
  "FolderPlus",
  "Fork",
  "GitBranch",
  "GitMerge",
  "GitPullRequest",
  "GitPullRequestArrow",
  "GitPullRequestClosed",
  "GitPullRequestDraft",
  "Github",
  "Globe",
  "GridView",
  "Info",
  "Laptop",
  "Layers",
  "ListTodo",
  "ListView",
  "Loading",
  "Lock",
  "Mail",
  "MailOpen",
  "Maximize2",
  "MessageCirclePlus",
  "MessageQuestion",
  "MessageSquare",
  "MessageSquarePlus",
  "Mic",
  "Minimize2",
  "MoreHorizontal",
  "NewTab",
  "PackageReceive",
  "Palette",
  "PanelBottom",
  "PanelLeft",
  "PanelRight",
  "Paperclip",
  "Pause",
  "Pin",
  "PinOff",
  "Play",
  "Plus",
  "Puzzle",
  "Repeat",
  "RotateCcw",
  "Rows2",
  "Search",
  "SectionAdd",
  "SecurityCheck",
  "Sent",
  "Settings",
  "SideChat",
  "SlidersHorizontal",
  "Smartphone",
  "Sort",
  "Spinner",
  "Square",
  "SquareUnlock02",
  "Star",
  "Target",
  "Terminal",
  "TextWrap",
  "TimeSchedule",
  "ToolCase",
  "Toolbox",
  "Trash2",
  "UserRound",
  "UserRoundPlus",
  "Workflow",
  "X",
  "Zap",
  "ZoomIn",
  "ZoomOut"
];
var INBOX_RULE = "Idle unread threads that need your attention appear here automatically and stay until work resumes or you move a read thread to another workflow section. This behavior can\u2019t be customized.";
var PREVIOUS_INBOX_RULES = [
  "Idle unread threads that need your attention appear here automatically and stay until work resumes. This behavior can\u2019t be customized.",
  "Idle unread threads that need your attention appear here automatically. This behavior can\u2019t be customized.",
  "Idle unread threads requiring the user's attention. This stage is managed automatically."
];
function normalizeText(value) {
  return value.normalize("NFKC").trim().replace(/\s+/gu, " ");
}
function normalizedIdentity(value) {
  return normalizeText(value).toLocaleLowerCase();
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseStage(value, withSectionId) {
  if (!isRecord(value))
    throw new Error("Every workflow stage must be an object.");
  const key = typeof value.key === "string" ? value.key.trim() : "";
  const title = typeof value.title === "string" ? normalizeText(value.title) : "";
  const rule = typeof value.rule === "string" ? normalizeText(value.rule) : "";
  const role = value.role;
  const icon = value.icon;
  const sectionId = withSectionId ? value.sectionId === null || typeof value.sectionId === "string" ? value.sectionId : null : null;
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/u.test(key)) {
    throw new Error(
      `Stage key "${key}" must use lowercase letters, numbers, and hyphens.`
    );
  }
  if (title.length === 0 || title.length > 80) {
    throw new Error(`Stage "${key}" needs a title of 1\u201380 characters.`);
  }
  if (rule.length === 0 || rule.length > 240) {
    throw new Error(`Stage "${key}" needs a rule of 1\u2013240 characters.`);
  }
  if (role !== "inbox" && role !== "stage") {
    throw new Error(`Stage "${key}" has an invalid role.`);
  }
  if (!SECTION_ICON_OPTIONS.includes(icon)) {
    throw new Error(`Stage "${key}" has an unsupported icon.`);
  }
  return {
    key,
    title,
    rule,
    role,
    icon,
    sectionId: sectionId && sectionId.trim().length > 0 ? sectionId : null
  };
}
function validateStages(stages) {
  if (stages.length < 2 || stages.length > 12) {
    throw new Error("Configure Inbox plus 1\u201311 workflow stages.");
  }
  const keys = /* @__PURE__ */ new Set();
  const titles = /* @__PURE__ */ new Set();
  for (const stage of stages) {
    if (keys.has(stage.key)) {
      throw new Error(`Stage key "${stage.key}" is duplicated.`);
    }
    keys.add(stage.key);
    const titleIdentity = normalizedIdentity(stage.title);
    if (titles.has(titleIdentity)) {
      throw new Error(`Stage title "${stage.title}" is duplicated.`);
    }
    titles.add(titleIdentity);
  }
  const inboxes = stages.filter((stage) => stage.role === "inbox");
  if (inboxes.length !== 1 || inboxes[0]?.key !== "inbox") {
    throw new Error(
      "The workflow must contain exactly one protected Inbox stage."
    );
  }
  if (inboxes[0]?.rule !== INBOX_RULE) {
    throw new Error("Inbox routing and its system rule cannot be changed.");
  }
}
function migrateDraftStage(stage) {
  if (stage.key === "inbox") {
    return {
      ...stage,
      title: stage.title === "Needs Me" ? "Inbox" : stage.title,
      rule: PREVIOUS_INBOX_RULES.some((rule) => rule === stage.rule) ? INBOX_RULE : stage.rule
    };
  }
  if (stage.key === "handoff" && stage.rule === "Transferring work to a colleague after explicit user direction.") {
    return {
      ...stage,
      rule: "Packaging work and context so a colleague can continue it."
    };
  }
  if (stage.key !== "parked") return stage;
  return {
    ...stage,
    key: "on-hold",
    title: stage.title === "Parked" ? "On Hold" : stage.title,
    rule: stage.rule === "Intentionally pausing work for later after explicit user direction." ? "Work intentionally paused until a later time or external condition." : stage.rule
  };
}
function parseWorkflowConfig(value) {
  try {
    if (!isRecord(value) || value.version !== 1 && value.version !== 2) {
      return null;
    }
    if (!Array.isArray(value.stages)) return null;
    const stages = value.stages.map((stage) => parseStage(stage, true)).map(migrateDraftStage);
    validateStages(stages);
    return { version: WORKFLOW_CONFIG_VERSION, stages };
  } catch {
    return null;
  }
}
function normalizeEditableWorkflowConfig(value) {
  const stages = value.stages.map((stage) => {
    const parsed = parseStage(stage, false);
    const { sectionId: _sectionId, ...editable } = parsed;
    return editable;
  });
  validateStages(stages.map((stage) => ({ ...stage, sectionId: null })));
  return { version: WORKFLOW_CONFIG_VERSION, stages };
}
function cloneWorkflowConfig(config) {
  return { ...config, stages: config.stages.map((stage) => ({ ...stage })) };
}
function editableWorkflowConfig(config) {
  return {
    version: WORKFLOW_CONFIG_VERSION,
    stages: config.stages.map(({ sectionId: _sectionId, ...stage }) => ({
      ...stage
    }))
  };
}
function createStageKey(title, existingKeys) {
  const base = title.normalize("NFKD").toLocaleLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 32) || "stage";
  const unavailable = /* @__PURE__ */ new Set(["inbox", ...existingKeys]);
  if (!unavailable.has(base)) return base;
  for (let suffix = 2; suffix < 1e4; suffix += 1) {
    const key = `${base.slice(0, 36)}-${suffix}`;
    if (!unavailable.has(key)) return key;
  }
  throw new Error("Could not create a unique stage key.");
}

// bb-plugin-runtime-shim:react/jsx-runtime
var runtime3 = globalThis.__bbPluginRuntime;
if (runtime3 == null || runtime3.jsxRuntime == null) {
  throw new Error('Cannot load "react/jsx-runtime": this bundle must be loaded by the BB app, which provides the shared plugin runtime (globalThis.__bbPluginRuntime).');
}
var mod3 = runtime3.jsxRuntime;
var {
  Fragment: Fragment2,
  jsx,
  jsxs
} = mod3;

// section-icon.tsx
var SectionAddStrokeRoundedIcon = [
  [
    "path",
    {
      d: "M2 3.4C2 2.24173 2.24173 2 3.4 2H20.6C21.7583 2 22 2.24173 22 3.4V4.6C22 5.75827 21.7583 6 20.6 6H3.4C2.24173 6 2 5.75827 2 4.6V3.4Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.5",
      key: "0"
    }
  ],
  [
    "path",
    {
      d: "M2 11.4C2 10.2417 2.24173 10 3.4 10H10.6C11.7583 10 12 10.2417 12 11.4V12.6C12 13.7583 11.7583 14 10.6 14H3.4C2.24173 14 2 13.7583 2 12.6V11.4Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.5",
      key: "1"
    }
  ],
  [
    "path",
    {
      d: "M2 19.4C2 18.2417 2.24173 18 3.4 18H10.6C11.7583 18 12 18.2417 12 19.4V20.6C12 21.7583 11.7583 22 10.6 22H3.4C2.24173 22 2 21.7583 2 20.6V19.4Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.5",
      key: "2"
    }
  ],
  [
    "path",
    {
      d: "M18 13V21M22 17H14",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeWidth: "1.5",
      key: "3"
    }
  ]
];
var PaletteStrokeRoundedIcon = [
  [
    "path",
    {
      d: "M21.8205 10.4127C22.062 11.8519 22.1827 12.5715 21.2423 13.9326C21.1459 14.0722 20.8966 14.3713 20.777 14.4911C19.6103 15.6586 18.4308 15.6586 16.0716 15.6586H14.1392C13.5085 15.6586 13.1931 15.6586 12.9639 15.7142C11.9586 15.9581 11.3031 16.9391 11.453 17.9755C11.4872 18.2118 11.6043 18.5085 11.8386 19.102C11.9345 19.3449 11.9824 19.4664 12.0136 19.7304C12.1292 20.7084 11.0869 21.9508 10.1158 21.9926C9.85358 22.0039 9.83681 22.0002 9.80326 21.9926C7.66174 21.51 5.66204 20.3123 4.18389 18.4421C0.736789 14.0808 1.43146 7.71364 5.73548 4.22064C10.0395 0.727643 16.323 1.43156 19.7701 5.79289C20.868 7.1819 21.5457 8.77438 21.8205 10.4127Z",
      fill: "none",
      fillRule: "evenodd",
      clipRule: "evenodd",
      stroke: "currentColor",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "0"
    }
  ],
  [
    "path",
    {
      d: "M7.36719 7.74976H7.24219M7.49219 7.74976C7.49219 7.88783 7.38026 7.99976 7.24219 7.99976C7.10412 7.99976 6.99219 7.88783 6.99219 7.74976C6.99219 7.61169 7.10412 7.49976 7.24219 7.49976C7.38026 7.49976 7.49219 7.61169 7.49219 7.74976Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "1"
    }
  ],
  [
    "path",
    {
      d: "M7.36719 15.7498H7.24219M7.49219 15.7498C7.49219 15.8878 7.38026 15.9998 7.24219 15.9998C7.10412 15.9998 6.99219 15.8878 6.99219 15.7498C6.99219 15.6117 7.10412 15.4998 7.24219 15.4998C7.38026 15.4998 7.49219 15.6117 7.49219 15.7498Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "2"
    }
  ],
  [
    "path",
    {
      d: "M11.8672 5.74976H11.7422M11.9922 5.74976C11.9922 5.88783 11.8803 5.99976 11.7422 5.99976C11.6041 5.99976 11.4922 5.88783 11.4922 5.74976C11.4922 5.61169 11.6041 5.49976 11.7422 5.49976C11.8803 5.49976 11.9922 5.61169 11.9922 5.74976Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "3"
    }
  ],
  [
    "path",
    {
      d: "M16.3672 7.74976H16.2422M16.4922 7.74976C16.4922 7.88783 16.3803 7.99976 16.2422 7.99976C16.1041 7.99976 15.9922 7.88783 15.9922 7.74976C15.9922 7.61169 16.1041 7.49976 16.2422 7.49976C16.3803 7.49976 16.4922 7.61169 16.4922 7.74976Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "4"
    }
  ],
  [
    "path",
    {
      d: "M18.3672 11.7498H18.2422M18.4922 11.7498C18.4922 11.8878 18.3803 11.9998 18.2422 11.9998C18.1041 11.9998 17.9922 11.8878 17.9922 11.7498C17.9922 11.6117 18.1041 11.4998 18.2422 11.4998C18.3803 11.4998 18.4922 11.6117 18.4922 11.7498Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "5"
    }
  ],
  [
    "path",
    {
      d: "M5.86719 11.7498H5.74219M5.99219 11.7498C5.99219 11.8878 5.88026 11.9998 5.74219 11.9998C5.60412 11.9998 5.49219 11.8878 5.49219 11.7498C5.49219 11.6117 5.60412 11.4998 5.74219 11.4998C5.88026 11.4998 5.99219 11.6117 5.99219 11.7498Z",
      stroke: "currentColor",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "1.5",
      key: "6"
    }
  ]
];
var SECTION_ICON_MAP = {
  AlertCircle: AlertCircleIcon,
  AlertTriangle: Alert02Icon,
  Archive: Archive03Icon,
  Bug: Bug01Icon,
  Check: Tick02Icon,
  ChevronDown: ArrowDown01Icon,
  ChevronLeft: ArrowLeft01Icon,
  ChevronRight: ArrowRight01Icon,
  Circle: CircleIcon,
  CircleCheck: CheckmarkCircle02Icon,
  CircleQuestion: HelpCircleIcon,
  CircleX: CancelCircleIcon,
  ClosePluginPane: Cancel01Icon,
  CloseThreadPane: Cancel01Icon,
  Code: SourceCodeIcon,
  ComputerTerminal01: ComputerTerminal01Icon,
  Copy: Copy01Icon,
  Download: Download01Icon,
  Edit: Edit02Icon,
  Folder: Folder01Icon,
  FolderExport: FolderExportIcon,
  FolderGit: FolderGitTwoIcon,
  FolderPlus: FolderAddIcon,
  Info: InformationCircleIcon,
  ListTodo: CheckListIcon,
  Loading: Loading03Icon,
  MessageQuestion: MessageQuestionIcon,
  MessageCirclePlus: BubbleChatAddIcon,
  MessageSquarePlus: BubbleChatAddIcon,
  MessageSquare: BubbleChatIcon,
  MoreHorizontal: MoreHorizontalIcon,
  PanelLeft: SidebarLeftIcon,
  Search: Search01Icon,
  SectionAdd: SectionAddStrokeRoundedIcon,
  Settings: Settings01Icon,
  SlidersHorizontal: SlidersHorizontalIcon,
  Spinner: DashedLineCircleIcon,
  Target: Target02Icon,
  Terminal: ComputerTerminal01Icon,
  Toolbox: ToolboxIcon,
  ToolCase: ToolCaseIcon,
  Trash2: Delete02Icon,
  UserRoundPlus: UserAdd01Icon,
  Workflow: WorkflowCircle03Icon,
  X: Cancel01Icon,
  Zap: ZapIcon,
  AiContentGenerator01: AiContentGenerator01Icon,
  AlignLeft: Menu02Icon,
  AppWindow: BrowserIcon,
  ArchiveRestore: Unarchive03Icon,
  ArrowDown: ArrowDown02Icon,
  ArrowRight: ArrowRight02Icon,
  ArrowReloadHorizontal: ArrowReloadHorizontalIcon,
  ArrowUp: ArrowUp02Icon,
  ArrowUpDown: ArrowUpDownIcon,
  ArrowTurnBackward: ArrowTurnBackwardIcon,
  ArrowTurnForward: ArrowTurnForwardIcon,
  ArrowUpRight: ArrowUpRight01Icon,
  Beaker: TestTube01Icon,
  Browser: BrowserIcon,
  Brain: BrainIcon,
  Calendar: Calendar03Icon,
  CalendarCheckOut02: CalendarCheckOut02Icon,
  ChartColumn: ChartColumnIcon,
  ChevronUp: ArrowUp01Icon,
  ChevronsDown: ArrowDownDoubleIcon,
  ChevronsUp: ArrowUpDoubleIcon,
  CircleArrowShrink: CircleArrowShrink01Icon,
  Clean: CleanIcon,
  Clock: Clock01Icon,
  Cloud: CloudIcon,
  CloudOff: CloudOffIcon,
  Coffee: Coffee02Icon,
  Columns2: LayoutTwoColumnIcon,
  CornerDownLeft: ArrowMoveDownLeftIcon,
  CornerDownRight: ArrowMoveDownRightIcon,
  Discord: DiscordIcon,
  DateTime: DateTimeIcon,
  Github: GithubIcon,
  DragDropHorizontal: DragDropHorizontalIcon,
  DragDropVertical: DragDropVerticalIcon,
  EditFile: Edit04Icon,
  ElectricPlugs: ElectricPlugsIcon,
  Eye: ViewIcon,
  EyeOff: ViewOffIcon,
  Explore: Book02Icon,
  ExternalLink: LinkSquare02Icon,
  FileDiff: PlusMinusSquare01Icon,
  File: FileEmpty02Icon,
  FileAttachment: FileAttachmentIcon,
  FileQuestion: FileQuestionMarkIcon,
  FileText: File01Icon,
  FileView: FileViewIcon,
  FolderOpen: Folder02Icon,
  FolderEdit: FolderEditIcon,
  FolderMinus: FolderRemoveIcon,
  Fork: GitForkIcon,
  GitBranch: GitBranchIcon,
  GitMerge: GitMergeIcon,
  GitPullRequest: GitPullRequestIcon,
  GitPullRequestArrow: GitPullRequestIcon,
  GitPullRequestClosed: GitPullRequestClosedIcon,
  GitPullRequestDraft: GitPullRequestDraftIcon,
  Globe: InternetIcon,
  GridView: GridViewIcon,
  Laptop: LaptopIcon,
  Layers: Layers01Icon,
  ListView: ListViewIcon,
  Lock: LockIcon,
  Mail: Mail02Icon,
  MailOpen: MailOpen01Icon,
  Maximize2: ExpandIcon,
  Mic: Mic02Icon,
  Minimize2: CollapseIcon,
  NewTab: DashedLine02Icon,
  PackageReceive: PackageReceiveIcon,
  Palette: PaletteStrokeRoundedIcon,
  PanelBottom: SidebarBottomIcon,
  PanelRight: SidebarRightIcon,
  Paperclip: AttachmentIcon,
  Pause: PauseIcon,
  Pin: PinIcon,
  PinOff: PinOffIcon,
  Play: PlayIcon,
  Plus: PlusSignIcon,
  Puzzle: PuzzleIcon,
  Repeat: RepeatIcon,
  SecurityCheck: SecurityCheckIcon,
  RotateCcw: Refresh01Icon,
  Rows2: LayoutTwoRowIcon,
  Sent: SentIcon,
  SideChat: MessageAdd02Icon,
  Smartphone: SmartPhone01Icon,
  Sort: Sorting01Icon,
  Square: SquareIcon,
  SquareUnlock02: SquareUnlock02Icon,
  Star: StarIcon,
  TextWrap: TextWrapIcon,
  TimeSchedule: TimeScheduleIcon,
  UserRound: UserIcon,
  ZoomIn: ZoomInAreaIcon,
  ZoomOut: ZoomOutAreaIcon
};
function sectionIconLabel(name) {
  return name.replace(/([a-z0-9])([A-Z])/gu, "$1 $2").replace(/([A-Za-z])(\d+)/gu, "$1 $2");
}
function SectionIcon({
  className,
  name
}) {
  return /* @__PURE__ */ jsx(
    HugeiconsIcon,
    {
      "aria-hidden": "true",
      className,
      "data-section-icon": name,
      icon: SECTION_ICON_MAP[name]
    }
  );
}

// sidebar-controller.ts
var SIDEBAR_SELECTOR = '[data-sidebar="sidebar"]';
var STICKY_GROUP_SELECTOR = "[data-sidebar-sticky-group]";
var SECTION_TOGGLE_SELECTOR = 'button[aria-expanded][aria-label$=" section"]';
var SECTION_ROW_TOGGLE_SELECTOR = 'button[aria-hidden="true"][tabindex="-1"]';
var MANUAL_SECTION_ORDER_STORAGE_KEY = "bb.sidebar.manualSectionOrder";
var WORKFLOW_CACHE_STORAGE_KEY = "bb.thread-organizer.workflow-config";
var WORKFLOW_CONFIG_EVENT = "bb-thread-organizer-workflow-config";
function groupToggle(group) {
  for (const button of group.querySelectorAll(
    SECTION_TOGGLE_SELECTOR
  )) {
    if (button.closest(STICKY_GROUP_SELECTOR) === group) return button;
  }
  return null;
}
function groupSectionId(group) {
  return group.getAttribute("data-sidebar-section-id");
}
function parsedCachedConfig(view) {
  try {
    const raw = view.localStorage.getItem(WORKFLOW_CACHE_STORAGE_KEY);
    return raw === null ? null : parseWorkflowConfig(JSON.parse(raw));
  } catch {
    return null;
  }
}
function cacheWorkflowConfig(config, view = window) {
  const snapshot = cloneWorkflowConfig(config);
  view.localStorage.setItem(
    WORKFLOW_CACHE_STORAGE_KEY,
    JSON.stringify(snapshot)
  );
  view.dispatchEvent(
    new CustomEvent(WORKFLOW_CONFIG_EVENT, { detail: snapshot })
  );
}
async function fetchWorkflowConfig(pluginId) {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/getConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config request failed (${response.status})`
    );
  }
  const payload = await response.json();
  if (typeof payload !== "object" || payload === null || !("ok" in payload) || payload.ok !== true || !("result" in payload)) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const config = parseWorkflowConfig(payload.result);
  if (config === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return config;
}
async function saveWorkflowConfig(pluginId, config) {
  const response = await fetch(
    `/api/v1/plugins/${encodeURIComponent(pluginId)}/rpc/saveConfig`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(config)
    }
  );
  if (!response.ok) {
    throw new Error(
      `Thread Organizer config save failed (${response.status})`
    );
  }
  const payload = await response.json();
  if (typeof payload !== "object" || payload === null || !("ok" in payload) || payload.ok !== true || !("result" in payload)) {
    throw new Error("Thread Organizer returned an invalid config response");
  }
  const saved = parseWorkflowConfig(payload.result);
  if (saved === null) {
    throw new Error("Thread Organizer returned an invalid workflow config");
  }
  return saved;
}
function currentWorkflowSectionOrder(sidebar, config) {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return null;
  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return null;
  let current;
  try {
    current = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(current) || current.some((value) => typeof value !== "string")) {
    return null;
  }
  const configuredSectionIds = new Set(
    config.stages.flatMap(
      (stage) => stage.sectionId === null ? [] : [stage.sectionId]
    )
  );
  const orderedSectionIds = current.flatMap((orderId) => {
    if (!orderId.startsWith("section:")) return [];
    const sectionId = orderId.slice("section:".length);
    return configuredSectionIds.has(sectionId) ? [sectionId] : [];
  });
  return orderedSectionIds.length === configuredSectionIds.size ? orderedSectionIds : null;
}
function configInSectionOrder(config, sectionIds) {
  if (sectionIds.length !== config.stages.length) return null;
  const stageBySectionId = new Map(
    config.stages.flatMap(
      (stage) => stage.sectionId === null ? [] : [[stage.sectionId, stage]]
    )
  );
  if (stageBySectionId.size !== config.stages.length) return null;
  const stages = sectionIds.flatMap((sectionId) => {
    const stage = stageBySectionId.get(sectionId);
    return stage === void 0 ? [] : [{ ...stage }];
  });
  if (stages.length !== config.stages.length || stages[0]?.role !== "inbox") {
    return null;
  }
  return { ...config, stages };
}
function reorderWorkflowSections(sidebar, config) {
  const view = sidebar.ownerDocument.defaultView;
  if (view === null) return;
  const rankByOrderId = new Map(
    config.stages.flatMap(
      (stage, index) => stage.sectionId === null ? [] : [[`section:${stage.sectionId}`, index]]
    )
  );
  if (rankByOrderId.size < 2) return;
  const raw = view.localStorage.getItem(MANUAL_SECTION_ORDER_STORAGE_KEY);
  if (raw === null) return;
  let current;
  try {
    current = JSON.parse(raw);
  } catch {
    return;
  }
  if (!Array.isArray(current) || current.some((value) => typeof value !== "string")) {
    return;
  }
  const currentOrder = current;
  const positions = currentOrder.flatMap(
    (id, index) => rankByOrderId.has(id) ? [index] : []
  );
  if (positions.length < 2) return;
  const configuredIds = positions.map((position) => currentOrder[position]).sort(
    (left, right) => rankByOrderId.get(left) - rankByOrderId.get(right)
  );
  const nextOrder = [...currentOrder];
  positions.forEach((position, index) => {
    nextOrder[position] = configuredIds[index];
  });
  if (nextOrder.every((id, index) => id === currentOrder[index])) return;
  const nextRaw = JSON.stringify(nextOrder);
  view.localStorage.setItem(MANUAL_SECTION_ORDER_STORAGE_KEY, nextRaw);
  view.dispatchEvent(
    new view.StorageEvent("storage", {
      key: MANUAL_SECTION_ORDER_STORAGE_KEY,
      oldValue: raw,
      newValue: nextRaw,
      storageArea: view.localStorage,
      url: view.location.href
    })
  );
}
function mountSidebarController(sidebar, signal, getConfig, onStageOrderChange) {
  const userExpansionBySectionId = /* @__PURE__ */ new Map();
  const pluginControls = /* @__PURE__ */ new WeakSet();
  let applyConfiguredOrder = true;
  let scheduled = false;
  const reconcile = () => {
    scheduled = false;
    if (signal.aborted || !sidebar.isConnected) return;
    const config = getConfig();
    if (config === null) return;
    if (applyConfiguredOrder) {
      applyConfiguredOrder = false;
      reorderWorkflowSections(sidebar, config);
    } else {
      const currentOrder = currentWorkflowSectionOrder(sidebar, config);
      const configuredOrder = config.stages.flatMap(
        (stage) => stage.sectionId === null ? [] : [stage.sectionId]
      );
      if (currentOrder !== null && !currentOrder.every(
        (sectionId, index) => sectionId === configuredOrder[index]
      ) && !onStageOrderChange(currentOrder)) {
        reorderWorkflowSections(sidebar, config);
      }
    }
    const inbox = config.stages.find((stage) => stage.role === "inbox");
    const configuredIds = new Set(
      config.stages.flatMap(
        (stage) => stage.sectionId === null ? [] : [stage.sectionId]
      )
    );
    for (const group of sidebar.querySelectorAll(STICKY_GROUP_SELECTOR)) {
      const sectionId = groupSectionId(group);
      if (sectionId === null || !configuredIds.has(sectionId)) continue;
      const toggle = groupToggle(group);
      if (toggle === null) continue;
      const expanded = toggle.getAttribute("aria-expanded") === "true";
      const userPreference = userExpansionBySectionId.get(sectionId);
      const desired = userPreference ?? sectionId === inbox?.sectionId;
      if (expanded === desired) continue;
      pluginControls.add(toggle);
      toggle.click();
      queueMicrotask(() => pluginControls.delete(toggle));
    }
  };
  const schedule = () => {
    if (scheduled || signal.aborted) return;
    scheduled = true;
    queueMicrotask(reconcile);
  };
  const requestConfiguredOrder = () => {
    applyConfiguredOrder = true;
    schedule();
  };
  const recordUserToggle = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const control = target.closest(
      `${SECTION_TOGGLE_SELECTOR}, ${SECTION_ROW_TOGGLE_SELECTOR}`
    );
    if (control === null || pluginControls.has(control)) return;
    const group = control.closest(STICKY_GROUP_SELECTOR);
    const sectionId = group === null ? null : groupSectionId(group);
    if (group === null || sectionId === null) return;
    const config = getConfig();
    if (!config?.stages.some((stage) => stage.sectionId === sectionId)) return;
    const toggle = groupToggle(group);
    if (toggle === null) return;
    userExpansionBySectionId.set(
      sectionId,
      toggle.getAttribute("aria-expanded") !== "true"
    );
  };
  sidebar.addEventListener("click", recordUserToggle, true);
  const Observer = sidebar.ownerDocument.defaultView?.MutationObserver ?? MutationObserver;
  const observer = new Observer(schedule);
  observer.observe(sidebar, {
    attributeFilter: ["aria-expanded", "aria-label"],
    attributes: true,
    childList: true,
    subtree: true
  });
  sidebar.addEventListener(
    "thread-organizer-config-changed",
    requestConfiguredOrder
  );
  reconcile();
  return {
    applyConfiguredOrder: requestConfiguredOrder,
    dispose: () => {
      observer.disconnect();
      sidebar.removeEventListener("click", recordUserToggle, true);
      sidebar.removeEventListener(
        "thread-organizer-config-changed",
        requestConfiguredOrder
      );
    }
  };
}
function mountThreadOrganizerSidebar({
  document: targetDocument = document,
  loadConfig,
  pluginId,
  saveConfig = (config) => saveWorkflowConfig(pluginId, config),
  signal
}) {
  const view = targetDocument.defaultView;
  let config = view === null ? null : parsedCachedConfig(view);
  const controllers = /* @__PURE__ */ new Map();
  let pendingSectionOrder = null;
  let savingSectionOrder = false;
  const applyConfiguredOrder = () => {
    for (const controller of controllers.values()) {
      controller.applyConfiguredOrder();
    }
  };
  const updateConfig = (next) => {
    config = cloneWorkflowConfig(next);
    if (view !== null) {
      view.localStorage.setItem(
        WORKFLOW_CACHE_STORAGE_KEY,
        JSON.stringify(config)
      );
    }
    mountSidebars();
    applyConfiguredOrder();
  };
  const savePendingSectionOrder = async () => {
    if (savingSectionOrder) return;
    savingSectionOrder = true;
    try {
      while (pendingSectionOrder !== null && !signal.aborted) {
        const requestedOrder = pendingSectionOrder;
        pendingSectionOrder = null;
        const next = config === null ? null : configInSectionOrder(config, requestedOrder);
        if (next === null) {
          applyConfiguredOrder();
          continue;
        }
        const saved = await saveConfig(editableWorkflowConfig(next));
        if (!signal.aborted) updateConfig(saved);
      }
    } catch {
      pendingSectionOrder = null;
      applyConfiguredOrder();
    } finally {
      savingSectionOrder = false;
      if (pendingSectionOrder !== null && !signal.aborted) {
        void savePendingSectionOrder();
      }
    }
  };
  const requestStageOrder = (sectionIds) => {
    if (config === null || configInSectionOrder(config, sectionIds) === null) {
      return false;
    }
    pendingSectionOrder = [...sectionIds];
    void savePendingSectionOrder();
    return true;
  };
  const mountSidebars = () => {
    for (const [sidebar, controller] of controllers) {
      if (!sidebar.isConnected) {
        controller.dispose();
        controllers.delete(sidebar);
      }
    }
    for (const sidebar of targetDocument.querySelectorAll(SIDEBAR_SELECTOR)) {
      if (!controllers.has(sidebar)) {
        controllers.set(
          sidebar,
          mountSidebarController(
            sidebar,
            signal,
            () => config,
            requestStageOrder
          )
        );
      }
    }
  };
  const onConfigEvent = (event) => {
    const candidate = event instanceof CustomEvent ? parseWorkflowConfig(event.detail) : null;
    if (candidate !== null) updateConfig(candidate);
  };
  view?.addEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);
  const Observer = view?.MutationObserver ?? MutationObserver;
  const discoveryObserver = new Observer(mountSidebars);
  discoveryObserver.observe(targetDocument.documentElement, {
    childList: true,
    subtree: true
  });
  mountSidebars();
  void (loadConfig ?? (() => fetchWorkflowConfig(pluginId)))().then((loaded) => {
    if (!signal.aborted) updateConfig(loaded);
  }).catch(() => void 0);
  const dispose = () => {
    discoveryObserver.disconnect();
    view?.removeEventListener(WORKFLOW_CONFIG_EVENT, onConfigEvent);
    for (const controller of controllers.values()) controller.dispose();
    controllers.clear();
  };
  signal.addEventListener("abort", dispose, { once: true });
  return dispose;
}

// app.tsx
var fieldClass = "min-w-0 w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:border-foreground/45 disabled:cursor-not-allowed disabled:opacity-60";
var quietFieldClass = "min-w-0 w-full rounded-md border border-transparent bg-transparent px-2.5 py-1.5 text-sm text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background disabled:cursor-not-allowed disabled:opacity-60";
var buttonBaseClass = "inline-flex h-8 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
var outlineButtonClass = `${buttonBaseClass} border border-input bg-transparent text-foreground hover:bg-muted`;
var primaryButtonClass = `${buttonBaseClass} bg-foreground text-background hover:bg-foreground/90`;
var iconButtonClass = "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40";
var stageRowClass = "grid min-w-0 grid-cols-[2rem_minmax(0,1fr)_2rem] items-start gap-x-2 gap-y-0 lg:grid-cols-[2rem_2rem_minmax(7rem,9rem)_minmax(0,1fr)_2rem]";
var stageRuleLayoutClass = "col-span-2 col-start-2 row-start-2 min-w-0 lg:col-span-1 lg:col-start-4 lg:row-start-1";
var workflowSettingsDescription = "Rename, re-icon, reorder, and define the workflow your agents follow.";
var workflowSettingsDescriptionClass = "ps-[var(--radius-lg,0.5rem)] [text-indent:-0.088em] text-sm leading-5 text-muted-foreground";
function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function uniqueNewStageTitle(stages) {
  const titles = new Set(
    stages.map((stage) => stage.title.toLocaleLowerCase())
  );
  if (!titles.has("new stage")) return "New Stage";
  for (let suffix = 2; suffix < 1e4; suffix += 1) {
    const title = `New Stage ${suffix}`;
    if (!titles.has(title.toLocaleLowerCase())) return title;
  }
  return "Untitled Stage";
}
function IconPicker({
  label,
  onChange,
  value
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredIcons = SECTION_ICON_OPTIONS.filter(
    (icon) => sectionIconLabel(icon).toLocaleLowerCase().includes(normalizedQuery)
  );
  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", ref: rootRef, children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        "aria-expanded": open,
        "aria-haspopup": "listbox",
        "aria-label": `Choose icon for ${label}`,
        className: `${iconButtonClass} border border-border bg-background text-foreground`,
        onClick: () => {
          setQuery("");
          setOpen((current) => !current);
        },
        title: `Choose icon for ${label}`,
        type: "button",
        children: /* @__PURE__ */ jsx(SectionIcon, { className: "size-4", name: value })
      }
    ),
    open ? /* @__PURE__ */ jsxs("div", { className: "absolute left-0 top-full z-30 mt-1 grid w-72 max-w-[calc(100vw-2rem)] gap-2 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-lg", children: [
      /* @__PURE__ */ jsx(
        "input",
        {
          "aria-label": "Search icons",
          autoFocus: true,
          className: fieldClass,
          onChange: (event) => setQuery(event.target.value),
          placeholder: "Search icons",
          type: "search",
          value: query
        }
      ),
      /* @__PURE__ */ jsxs(
        "div",
        {
          "aria-label": `Icons for ${label}`,
          className: "grid max-h-72 grid-cols-6 gap-1 overflow-y-auto pr-1",
          role: "listbox",
          children: [
            filteredIcons.map((icon) => {
              const iconLabel = sectionIconLabel(icon);
              return /* @__PURE__ */ jsx(
                "button",
                {
                  "aria-label": iconLabel,
                  "aria-selected": icon === value,
                  className: `inline-flex size-8 items-center justify-center rounded-md outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring ${icon === value ? "bg-muted text-foreground ring-1 ring-foreground/35" : "text-muted-foreground"}`,
                  onClick: () => {
                    onChange(icon);
                    setOpen(false);
                  },
                  role: "option",
                  title: iconLabel,
                  type: "button",
                  children: /* @__PURE__ */ jsx(SectionIcon, { className: "size-4", name: icon })
                },
                icon
              );
            }),
            filteredIcons.length === 0 ? /* @__PURE__ */ jsx("p", { className: "col-span-6 py-3 text-center text-xs text-muted-foreground", children: "No matching icons" }) : null
          ]
        }
      )
    ] }) : null
  ] });
}
function StageActions({
  index,
  onMove,
  onRemove,
  stage,
  stageCount
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsidePress = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeOnOutsidePress);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePress);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative col-start-3 row-start-1 shrink-0 lg:col-start-5",
      ref: rootRef,
      children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            "aria-expanded": open,
            "aria-haspopup": "menu",
            "aria-label": `More actions for ${stage.title}`,
            className: iconButtonClass,
            onClick: () => setOpen((current) => !current),
            ref: triggerRef,
            title: `More actions for ${stage.title}`,
            type: "button",
            children: /* @__PURE__ */ jsx(
              HugeiconsIcon,
              {
                "aria-hidden": "true",
                className: "size-4",
                icon: MoreHorizontalIcon
              }
            )
          }
        ),
        open ? /* @__PURE__ */ jsxs(
          "div",
          {
            "aria-label": `Actions for ${stage.title}`,
            className: "absolute right-0 top-full z-20 mt-1 grid w-40 gap-0.5 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg",
            role: "menu",
            children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40",
                  disabled: index <= 1,
                  onClick: () => {
                    setOpen(false);
                    onMove(index, -1);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: ArrowUp02Icon
                      }
                    ),
                    "Move up"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm hover:bg-muted disabled:opacity-40",
                  disabled: index >= stageCount - 1,
                  onClick: () => {
                    setOpen(false);
                    onMove(index, 1);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: ArrowDown02Icon
                      }
                    ),
                    "Move down"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "flex min-h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-destructive hover:bg-destructive/10",
                  onClick: () => {
                    setOpen(false);
                    onRemove(index);
                  },
                  role: "menuitem",
                  type: "button",
                  children: [
                    /* @__PURE__ */ jsx(
                      HugeiconsIcon,
                      {
                        "aria-hidden": "true",
                        className: "size-4",
                        icon: Delete02Icon
                      }
                    ),
                    "Remove stage"
                  ]
                }
              )
            ]
          }
        ) : null
      ]
    }
  );
}
function StageCard({
  index,
  onChange,
  onDragStart,
  onDrop,
  onMove,
  onRemove,
  stage,
  stageCount
}) {
  const inbox = stage.role === "inbox";
  const update = (key, value) => onChange({ ...stage, [key]: value });
  return /* @__PURE__ */ jsx(
    "article",
    {
      className: "min-w-0 border-b border-border bg-background px-3 py-2.5 first:rounded-t-lg last:rounded-b-lg last:border-b-0 lg:p-3",
      onDragOver: (event) => {
        if (!inbox) event.preventDefault();
      },
      onDrop: (event) => {
        event.preventDefault();
        if (!inbox) onDrop(index);
      },
      children: /* @__PURE__ */ jsxs("div", { className: stageRowClass, children: [
        inbox ? /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "hidden size-8 lg:block" }) : /* @__PURE__ */ jsx("span", { className: "hidden shrink-0 lg:inline-flex", children: /* @__PURE__ */ jsx(
          "button",
          {
            "aria-label": `Drag ${stage.title} to reorder`,
            className: `${iconButtonClass} cursor-grab active:cursor-grabbing`,
            draggable: true,
            onDragStart: () => onDragStart(index),
            title: `Drag ${stage.title} to reorder`,
            type: "button",
            children: /* @__PURE__ */ jsx(
              HugeiconsIcon,
              {
                "aria-hidden": "true",
                className: "size-4",
                icon: DragDropVerticalIcon
              }
            )
          }
        ) }),
        /* @__PURE__ */ jsx(
          IconPicker,
          {
            label: stage.title || "untitled stage",
            onChange: (icon) => update("icon", icon),
            value: stage.icon
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            "aria-label": `${stage.title || "Untitled stage"} section title`,
            className: "h-8 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 text-sm font-semibold text-foreground outline-none hover:border-border focus:border-foreground/45 focus:bg-background",
            maxLength: 80,
            onChange: (event) => update("title", event.target.value),
            value: stage.title
          }
        ),
        inbox ? /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "col-start-3 row-start-1 size-8 lg:col-start-5"
          }
        ) : /* @__PURE__ */ jsx(
          StageActions,
          {
            index,
            onMove,
            onRemove,
            stage,
            stageCount
          }
        ),
        inbox ? /* @__PURE__ */ jsx(
          "p",
          {
            className: `${stageRuleLayoutClass} px-2.5 py-1.5 text-sm leading-5 text-muted-foreground`,
            children: stage.rule
          }
        ) : /* @__PURE__ */ jsxs("label", { className: `${stageRuleLayoutClass} grid gap-1`, children: [
          /* @__PURE__ */ jsxs("span", { className: "sr-only", children: [
            "What belongs in ",
            stage.title
          ] }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              "aria-label": `What belongs in ${stage.title}`,
              className: `${quietFieldClass} min-h-8 max-h-24 resize-none overflow-y-auto leading-5`,
              maxLength: 240,
              onChange: (event) => update("rule", event.target.value),
              rows: 1,
              style: { fieldSizing: "content" },
              value: stage.rule
            }
          )
        ] })
      ] })
    }
  );
}
function WorkflowSettings() {
  const rpc = useRpc();
  const [config, setConfig] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const editRevisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(false);
  const load = useCallback(async () => {
    if (dirtyRef.current || savingRef.current) return;
    const requestedRevision = editRevisionRef.current;
    setError(null);
    try {
      const full = await rpc.call("getConfig", {});
      if (dirtyRef.current || savingRef.current || editRevisionRef.current !== requestedRevision) {
        return;
      }
      setConfig(editableWorkflowConfig(full));
      cacheWorkflowConfig(full);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [rpc]);
  useEffect(() => {
    void load();
  }, [load]);
  useRealtime("workflow-config-changed", () => {
    if (!dirtyRef.current && !savingRef.current) void load();
  });
  const markEdited = () => {
    editRevisionRef.current += 1;
    dirtyRef.current = true;
    setSaved(false);
  };
  const replaceStage = (index, stage) => {
    markEdited();
    setConfig(
      (current) => current === null ? null : {
        ...current,
        stages: current.stages.map(
          (candidate, candidateIndex) => candidateIndex === index ? stage : candidate
        )
      }
    );
  };
  const moveStage = (from, to) => {
    if (from <= 0 || to <= 0 || config === null) return;
    const stages = [...config.stages];
    const [stage] = stages.splice(from, 1);
    if (stage === void 0) return;
    stages.splice(Math.min(to, stages.length), 0, stage);
    markEdited();
    setConfig({ ...config, stages });
  };
  const removeStage = (index) => {
    if (index <= 0 || config === null) return;
    const stages = config.stages.filter(
      (_, stageIndex) => stageIndex !== index
    );
    markEdited();
    setConfig({ ...config, stages });
  };
  const addStage = () => {
    if (config === null || config.stages.length >= 12) return;
    const title = uniqueNewStageTitle(config.stages);
    const key = createStageKey(
      title,
      config.stages.map((stage) => stage.key)
    );
    markEdited();
    setConfig({
      ...config,
      stages: [
        ...config.stages,
        {
          key,
          role: "stage",
          title,
          icon: "Circle",
          rule: "Describe the work that belongs in this stage."
        }
      ]
    });
  };
  const save = async () => {
    if (config === null) return;
    const submittedRevision = editRevisionRef.current;
    const normalized = normalizeEditableWorkflowConfig(config);
    savingRef.current = true;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const full = await rpc.call("saveConfig", normalized);
      cacheWorkflowConfig(full);
      if (editRevisionRef.current === submittedRevision) {
        dirtyRef.current = false;
        setConfig(editableWorkflowConfig(full));
        setSaved(true);
      }
    } catch (saveError) {
      setError(errorMessage(saveError));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "Loading workflow\u2026" });
  }
  if (config === null) {
    return /* @__PURE__ */ jsxs("div", { className: "grid gap-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", role: "alert", children: error ?? "Couldn\u2019t load the workflow." }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: `${outlineButtonClass} w-fit`,
          onClick: () => void load(),
          children: "Try again"
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "grid min-w-0 w-full max-w-3xl gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-wrap items-end gap-x-4 gap-y-3", children: [
      /* @__PURE__ */ jsx("div", { className: "min-w-60 flex-1", children: /* @__PURE__ */ jsx("p", { className: workflowSettingsDescriptionClass, children: workflowSettingsDescription }) }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          "aria-label": "Workflow actions",
          className: "ml-auto flex shrink-0 items-center justify-end gap-2",
          role: "group",
          children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: outlineButtonClass,
                disabled: config.stages.length >= 12,
                onClick: addStage,
                type: "button",
                children: [
                  /* @__PURE__ */ jsx(HugeiconsIcon, { "aria-hidden": true, icon: PlusSignIcon }),
                  "Add stage"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                className: primaryButtonClass,
                disabled: saving,
                onClick: () => void save(),
                type: "button",
                children: [
                  /* @__PURE__ */ jsx(HugeiconsIcon, { "aria-hidden": true, icon: Tick02Icon }),
                  saving ? "Saving\u2026" : saved ? "Saved" : "Save"
                ]
              }
            )
          ]
        }
      )
    ] }),
    error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", role: "alert", children: error }) : null,
    /* @__PURE__ */ jsx("div", { className: "min-w-0 overflow-visible rounded-lg border border-border", children: config.stages.map((stage, index) => /* @__PURE__ */ jsx(
      StageCard,
      {
        index,
        onChange: (next) => replaceStage(index, next),
        onDragStart: setDraggedIndex,
        onDrop: (target) => {
          if (draggedIndex !== null) moveStage(draggedIndex, target);
          setDraggedIndex(null);
        },
        onMove: (stageIndex, direction) => moveStage(stageIndex, stageIndex + direction),
        onRemove: removeStage,
        stage,
        stageCount: config.stages.length
      },
      stage.key
    )) })
  ] });
}
var app_default = definePluginApp((app) => {
  app.contentScripts.register({
    id: "workflow-sidebar",
    mount: ({ pluginId, signal }) => mountThreadOrganizerSidebar({ pluginId, signal })
  });
  app.slots.settingsSection({
    id: "workflow-sections",
    component: WorkflowSettings
  });
});
var workflowConfigVersion = WORKFLOW_CONFIG_VERSION;
export {
  WorkflowSettings,
  app_default as default,
  workflowConfigVersion
};
