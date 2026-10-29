import { useEffect, useRef } from 'react';
import { definePluginApp, useSettings, useBbNavigate, useComposer, experimental_useSidebarThreads } from '@get-bb/plugin-sdk/app';
import { EFFECT_CLASS, mountUrlPills } from './decoration';
import { findComposerUrls } from './urls';
import type { LocalFile } from './files';

// Each registration belongs to the composer which rendered it, including split views.
const fileOpeners = new Map<Element, (file: LocalFile) => boolean>();
function fileOpener(element: HTMLElement) {
  // Inline queue editors share the outer shell but have their own draft scope.
  if (element.closest('[data-queued-message-inline-editor]')) return undefined;
  const root = element.closest('[data-app-composer]');
  return root ? fileOpeners.get(root) : undefined;
}
function ComposerFileBridge() {
  const marker = useRef<HTMLSpanElement>(null);
  const composer = useComposer();
  const navigate = useBbNavigate();
  const { threads } = experimental_useSidebarThreads();
  const scope = composer.scope;
  const threadId = scope.kind === 'thread' || scope.kind === 'queued-message' ? scope.threadId : null;
  const hostId = threads.find((thread) => thread.id === threadId)?.host?.id ?? null;
  useEffect(() => {
    const root = marker.current?.closest('[data-app-composer]');
    if (!root || !hostId) return;
    const open = (file: LocalFile) => navigate.experimental_openFilePreview({
      target: { kind: 'host', hostId, path: file.path },
      location: file.location
        ? file.location.endLine !== undefined
          ? { kind: 'range', startLine: file.location.line, endLine: file.location.endLine }
          : { kind: 'line', line: file.location.line, column: null }
        : null,
    });
    fileOpeners.set(root, open);
    document.dispatchEvent(new Event('bb-url-pills-context'));
    return () => {
      if (fileOpeners.get(root) === open) fileOpeners.delete(root);
      document.dispatchEvent(new Event('bb-url-pills-context'));
    };
  }, [hostId, navigate.experimental_openFilePreview]);
  return <span ref={marker} hidden aria-hidden="true" />;
}

// The official settings hook observes toggles even when no composer is mounted.
let iconsEnabled = false;
const settingsListeners = new Set<(enabled: boolean) => void>();
let openUrl: ((url: string) => boolean) | undefined;
function SettingsBridge() {
  const navigate = useBbNavigate();
  const settings = useSettings();
  const enabled = !settings.isLoading && settings.values !== undefined && settings.values.loadWebsiteIcons !== false;
  useEffect(() => {
    iconsEnabled = enabled;
    for (const listener of settingsListeners) listener(enabled);
  }, [enabled]);
  useEffect(() => {
    openUrl = navigate.openUrl;
    return () => { if (openUrl === navigate.openUrl) openUrl = undefined; };
  }, [navigate.openUrl]);
  return null;
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: 'settings-sync', component: SettingsBridge });
  app.composer.customize({
    id: 'website-links',
    banners: [{ id: 'file-navigation', chrome: 'bare', component: ComposerFileBridge }],
    richText: { effects: [{ id: 'url-ranges', className: EFFECT_CLASS, match: (text) => findComposerUrls(text, location.origin) }] },
  });
  app.contentScripts.register({
    id: 'url-pills',
    mount({ signal }) {
      // Without generated-content alternate text, keep the host's accessible
      // names intact by leaving text native rather than announcing it twice.
      if (!CSS.supports('content', 'attr(data-bb-url-pill-label) / ""')) return;
      const decoration = mountUrlPills({
        signal, iconsEnabled,
        canOpenFile: (element) => !!fileOpener(element),
        openFile: (file, element) => fileOpener(element)?.(file) ?? false,
        openUrl: (url) => openUrl?.(url) ?? false,
      });
      settingsListeners.add(decoration.setIconsEnabled);
      return () => { settingsListeners.delete(decoration.setIconsEnabled); decoration.dispose(); };
    },
  });
});
