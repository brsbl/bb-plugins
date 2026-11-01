// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { loadPluginApp, mountPluginContentScripts, renderSlot } from '@get-bb/plugin-sdk/testing/app';

afterEach(() => { cleanup(); document.body.replaceChildren(); vi.unstubAllGlobals(); });

it('opens the exact pasted URL through the SDK without changing the draft or handling context menus', async () => {
  vi.stubGlobal('CSS', { supports: () => true });
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('IntersectionObserver', undefined);
  const app = await loadPluginApp(() => import('./app'));
  const url = 'https://example.com/path?exact=yes#part';
  const openUrl = vi.fn(() => true);
  const overlay = renderSlot(app.appOverlays[0], {}, { openUrl, settings: { loadWebsiteIcons: false } });
  const slot = renderSlot({ component: () => <div data-app-composer=""><div contentEditable suppressContentEditableWarning><span className="bb-url-pill-range">{url}</span></div></div> }, {});
  const editor = document.querySelector('[contenteditable]')!;
  const original = editor.outerHTML;
  const mounted = await mountPluginContentScripts(app, { pluginId: 'url-pills', generation: 1 });
  try {
    const span = document.querySelector<HTMLElement>('.bb-url-pill-range')!;
    span.click();
    expect(openUrl).toHaveBeenCalledExactlyOnceWith(url);
    expect(overlay.inspection.navigateCalls).toEqual([{ method: 'openUrl', url }]);
    const menu = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    span.dispatchEvent(menu);
    expect(menu.defaultPrevented).toBe(false);
    expect(editor.outerHTML).toBe(original);
    expect(document.querySelector('[role=menu], [role=dialog]')).toBeNull();
  } finally { await mounted.lifecycle.dispose(); slot.lifecycle.unmount(); overlay.lifecycle.unmount(); }
});
