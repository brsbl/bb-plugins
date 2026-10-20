import { expect, it, vi } from 'vitest';
import { realpathSync } from 'node:fs';
// @ts-expect-error eval-only Node ESM
import { verifyIsolation } from './isolation.mjs';

it('requires the server-reported data directory and host, with no redirect fallback', async () => {
  const dataDir = realpathSync(process.cwd());
  const fetchIdentity = vi.fn(async () => ({ ok: true, json: async () => ({ dataDir, primaryHostId: 'isolated' }) }));
  await expect(verifyIsolation('http://127.0.0.1:48992', dataDir, 'isolated', fetchIdentity)).resolves.toMatchObject({ dataDir, hostId: 'isolated' });
  expect(fetchIdentity).toHaveBeenCalledWith(new URL('http://127.0.0.1:48992/api/v1/system/config'), expect.objectContaining({ redirect: 'error' }));
  await expect(verifyIsolation('http://127.0.0.1:48992', '/', 'isolated', fetchIdentity)).rejects.toThrow('identity mismatch');
  await expect(verifyIsolation('http://127.0.0.1:48992', dataDir, 'production', fetchIdentity)).rejects.toThrow('identity mismatch');
  await expect(verifyIsolation('http://127.0.0.1:48992', dataDir, 'isolated', async () => ({ ok: false, status: 302 }))).rejects.toThrow('HTTP 302');
});
