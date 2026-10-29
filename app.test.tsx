// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { normalizeExperimentalFileOpenOptions } from '@get-bb/plugin-sdk/internal/file-navigation-validation';
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

it('opens local paths through the originating composer preview, preserving line ranges and draft text', async () => {
  vi.stubGlobal('CSS', { supports: () => true });
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('IntersectionObserver', undefined);
  const app = await loadPluginApp(() => import('./app'));
  const Bridge = app.composerCustomizations[0]!.banners![0]!.component;
  const source = '/workspace/app.ts:42';
  const renderComposer = (threadId: string, hostId: string) => renderSlot({ component: () =>
    <div data-app-composer=""><Bridge /><div contentEditable suppressContentEditableWarning><span className="bb-url-pill-range">{source}</span></div></div>,
  }, {}, {
    context: { projectId: 'project', threadId },
    sidebarThreads: { threads: [{ id: threadId, host: { id: hostId } }] as never },
    openFilePreview: (options) => normalizeExperimentalFileOpenOptions(options) !== null,
  });
  const first = renderComposer('thread-a', 'host-a');
  const second = renderComposer('thread-b', 'host-b');
  const original = first.container.querySelector('[contenteditable]')!.outerHTML;
  const mounted = await mountPluginContentScripts(app, { pluginId: 'url-pills', generation: 1 });
  try {
    first.container.querySelector<HTMLElement>('.bb-url-pill-range')!.click();
    expect(first.inspection.navigateCalls).toEqual([{
      method: 'experimental_openFilePreview',
      options: { target: { kind: 'host', hostId: 'host-a', path: '/workspace/app.ts' }, location: { kind: 'line', line: 42, column: null } },
    }]);
    expect(second.inspection.navigateCalls).toEqual([]);
    second.container.querySelector<HTMLElement>('.bb-url-pill-range')!.click();
    expect(second.inspection.navigateCalls[0]).toMatchObject({ options: { target: { hostId: 'host-b' } } });
    expect(first.container.querySelector('[contenteditable]')!.outerHTML).toBe(original);
    first.lifecycle.unmount();
    second.container.querySelector<HTMLElement>('.bb-url-pill-range')!.click();
    expect(second.inspection.navigateCalls).toHaveLength(2);
  } finally { await mounted.lifecycle.dispose(); second.lifecycle.unmount(); }
});

it('keeps a local path native when its composer has no established environment', async () => {
  vi.stubGlobal('CSS', { supports: () => true });
  vi.stubGlobal('requestAnimationFrame', () => 1);
  vi.stubGlobal('cancelAnimationFrame', () => {});
  vi.stubGlobal('IntersectionObserver', undefined);
  const app = await loadPluginApp(() => import('./app'));
  const Bridge = app.composerCustomizations[0]!.banners![0]!.component;
  const slot = renderSlot({ component: () => <div data-app-composer=""><Bridge /><div contentEditable suppressContentEditableWarning><span className="bb-url-pill-range">/workspace/plan.md</span></div></div> }, {}, {
    context: { projectId: 'project', threadId: 'unknown-thread' },
    openFilePreview: (options) => normalizeExperimentalFileOpenOptions(options) !== null,
  });
  const mounted = await mountPluginContentScripts(app, { pluginId: 'url-pills', generation: 1 });
  try {
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    slot.container.querySelector('.bb-url-pill-range')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(false);
    expect(slot.inspection.navigateCalls).toEqual([]);
    expect(document.querySelector('style[data-bb-url-pills-composer]')!.textContent).toBe('');
  } finally { await mounted.lifecycle.dispose(); slot.lifecycle.unmount(); }
});
