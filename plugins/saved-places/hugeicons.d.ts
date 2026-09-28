// The icon package exports per-icon modules without declarations.
declare module "@hugeicons/core-free-icons/*" {
  const icon: import("@hugeicons/react").IconSvgElement;
  export default icon;
}
