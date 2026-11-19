import { realpathSync } from 'node:fs';

// A loopback URL alone can still address production. Read the server's own
// identity before writes, and never follow a redirect to another server.
export async function verifyIsolation(base, dataDir, hostId, fetchImpl = fetch) {
  const response = await fetchImpl(new URL('/api/v1/system/config', base), {
    redirect: 'error', signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Isolated server identity: HTTP ${response.status}`);
  const config = await response.json();
  if (typeof config.dataDir !== 'string' || realpathSync(config.dataDir) !== realpathSync(dataDir) || config.primaryHostId !== hostId)
    throw new Error('Isolated server identity mismatch: refusing writes');
  return { url: new URL(base).origin, dataDir: config.dataDir, hostId: config.primaryHostId, checkedAt: Date.now() };
}
