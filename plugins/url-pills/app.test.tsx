// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup } from '@testing-library/react';
import { loadPluginApp, mountPluginContentScripts, renderSlot } from '@get-bb/plugin-sdk/testing/app';

afterEach(() => { cleanup(); document.body.replaceChildren(); vi.unstubAllGlobals(); });

it('uses the SDK URL opener and the clicked composer owner for edits', async () => {
  vi.stubGlobal('CSS', { supports: () => true });
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('IntersectionObserver', undefined);
  const app = await loadPluginApp(() => import('./app'));
  const url = 'https://example.com/path?exact=yes#part';
  const openUrl = vi.fn(() => true);
  const overlay = renderSlot(app.appOverlays[0], {}, { openUrl, settings: { loadWebsiteIcons: false } });
  const Bridge = app.composerCustomizations[0].banners![0].component;
  const scope = { kind: 'thread' as const, threadId: 'thread-one' };
  const slot = renderSlot({ component: () => <div data-app-composer=""><Bridge /><div contentEditable suppressContentEditableWarning><span className="bb-url-pill-range">{url}</span></div></div> }, {}, { composer: { text: url, scope } });
  const mounted = await mountPluginContentScripts(app, { pluginId: 'url-pills', generation: 1 });
  try {
    const span = document.querySelector<HTMLElement>('.bb-url-pill-range')!;
    span.click();
    expect(openUrl).toHaveBeenCalledExactlyOnceWith(url);
    expect(overlay.inspection.navigateCalls).toEqual([{ method: 'openUrl', url }]);
    span.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    document.querySelector<HTMLButtonElement>('[role=menuitem]')!.click();
    const input = document.querySelector('input')!; input.value = 'https://changed.example/?one=2#three';
    await act(async () => { input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); });
    expect(slot.inspection.composer.text).toBe('https://changed.example/?one=2#three');
    expect(overlay.inspection.composer.text).toBe('');
    expect(openUrl).toHaveBeenCalledTimes(1);
  } finally { await mounted.lifecycle.dispose(); slot.lifecycle.unmount(); overlay.lifecycle.unmount(); }
});
