import { useEffect, useRef } from 'react';
import { definePluginApp, useSettings, useBbNavigate, useComposer } from '@get-bb/plugin-sdk/app';
import { EFFECT_CLASS, mountUrlPills } from './decoration';
import { findComposerUrls } from './urls';
import { captureComposerEdit, type ComposerSource } from './composer-edit';

// The official settings hook observes toggles even when no composer is mounted.
let iconsEnabled = false;
const settingsListeners = new Set<(enabled: boolean) => void>();
let openUrl: ((url: string) => boolean) | undefined;
const composers = new Map<Element, ComposerSource>();
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

// A bare slot binds writes to this exact composer, including side chats and
// queued edits. The marker is outside the host-controlled editable tree.
function ComposerBridge() {
  const composer = useComposer();
  const latest = useRef(composer); latest.current = composer;
  const marker = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = marker.current?.closest('[data-app-composer]');
    if (!root) return;
    const source: ComposerSource = {
      get text() { return latest.current.text; },
      updateText: (update) => latest.current.updateText(update),
    };
    composers.set(root, source);
    return () => { if (composers.get(root) === source) composers.delete(root); };
  }, []);
  return <span ref={marker} hidden />;
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: 'settings-sync', component: SettingsBridge });
  app.composer.customize({
    id: 'website-links',
    banners: [{ id: 'editing-bridge', chrome: 'bare', component: ComposerBridge }],
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
        openUrl: (url) => openUrl?.(url) ?? false,
        editComposer: (element) => {
          const root = element.closest('[data-app-composer]');
          const source = root ? composers.get(root) : undefined;
          return source ? captureComposerEdit(element, source) : null;
        },
      });
      settingsListeners.add(decoration.setIconsEnabled);
      return () => { settingsListeners.delete(decoration.setIconsEnabled); decoration.dispose(); };
    },
  });
});
