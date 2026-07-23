import {
  createContext,
  type ReactNode,
  useContext,
} from "react";

const PreviewPortalContainerContext = createContext<HTMLElement | null>(null);

export function PreviewFrameProvider({
  container,
  children,
}: {
  container: HTMLElement;
  children: ReactNode;
}) {
  return (
    <PreviewPortalContainerContext.Provider value={container}>
      {children}
    </PreviewPortalContainerContext.Provider>
  );
}

export function usePreviewPortalContainer() {
  const container = useContext(PreviewPortalContainerContext);
  if (container) return container;
  return typeof document === "undefined" ? undefined : document.body;
}
