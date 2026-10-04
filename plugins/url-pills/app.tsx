import { useEffect } from 'react';
import { definePluginApp, useSettings } from '@get-bb/plugin-sdk/app';
import { EFFECT_CLASS, mountUrlPills } from './decoration';
import { findComposerUrls } from './urls';

// The official settings hook observes toggles even when no composer is mounted.
let iconsEnabled = false;
const settingsListeners = new Set<(enabled: boolean) => void>();
function SettingsBridge() {
  const settings = useSettings();
  const enabled = !settings.isLoading && settings.values !== undefined && settings.values.loadWebsiteIcons !== false;
  useEffect(() => {
    iconsEnabled = enabled;
    for (const listener of settingsListeners) listener(enabled);
  }, [enabled]);
  return null;
}

export default definePluginApp((app) => {
  app.slots.experimental_appOverlay({ id: 'settings-sync', component: SettingsBridge });
  app.composer.customize({
    id: 'website-links',
    richText: { effects: [{ id: 'url-ranges', className: EFFECT_CLASS, match: (text) => findComposerUrls(text, location.origin) }] },
  });
  app.contentScripts.register({
    id: 'url-pills',
    mount({ signal }) {
      // Without generated-content alternate text, keep the host's accessible
      // names intact by leaving text native rather than announcing it twice.
      if (!CSS.supports('content', 'attr(data-bb-url-pill-label) / ""')) return;
      const decoration = mountUrlPills({ signal, iconsEnabled });
      settingsListeners.add(decoration.setIconsEnabled);
      return () => { settingsListeners.delete(decoration.setIconsEnabled); decoration.dispose(); };
    },
  });
});
