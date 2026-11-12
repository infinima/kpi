import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { createQueryClient } = await load('shared/lib/queryClient.js');
const { configureApi } = await load('shared/api/runtime.js');
const { request } = await load('shared/api/request.js');

test('server queries deduplicate concurrent reads but keep scopes separate', async () => {
    const client = createQueryClient(); let calls = 0; let resolve;
    const response = new Promise((done) => { resolve = done; });
    const options = { queryKey: ['locations', 1, 'active'], queryFn: () => { calls++; return response; } };
    const first = client.fetchQuery(options), second = client.fetchQuery(options);
    assert.equal(calls, 1); resolve([{ id: 1 }]);
    assert.deepEqual(await first, await second);
    await client.fetchQuery({ queryKey: ['locations', 2, 'active'], queryFn: async () => [{ id: 2 }] });
    assert.deepEqual(client.getQueryData(['locations', 1, 'active']), [{ id: 1 }]);
    assert.deepEqual(client.getQueryData(['locations', 2, 'active']), [{ id: 2 }]);
    client.clear();
});

test('successful mutations invalidate server cache, failed mutations and GET do not', async () => {
    const client = createQueryClient(); let effects = 0;
    client.setQueryData(['events', 'active'], [{ id: 1 }]);
    configureApi({ request: async ({ path }) => { if (path === 'fail') throw new Error('failed'); return {}; }, notify() {}, onMutation: async () => { effects++; await client.invalidateQueries(); } });
    await request({ method: 'GET', path: 'events' });
    assert.equal(effects, 0);
    await assert.rejects(request({ method: 'PATCH', path: 'fail', body: {} }));
    assert.equal(effects, 0);
    await request({ method: 'PATCH', path: 'events/1', body: { name: 'New' } });
    assert.equal(effects, 1);
    assert.equal(client.getQueryState(['events', 'active']).isInvalidated, true);
    client.clear();
});

test('session cache cleanup cancels in-flight requests and removes private data', async () => {
    const client = createQueryClient(); let aborted = false;
    client.setQueryData(['my-teams'], [{ id: 1, name: 'Private' }]);
    const pending = client.fetchQuery({ queryKey: ['profile', 1], queryFn: ({ signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => { aborted = true; reject(new DOMException('Aborted', 'AbortError')); })) });
    const rejected = assert.rejects(pending);
    client.clear(); await rejected;
    assert.equal(aborted, true);
    assert.equal(client.getQueryData(['my-teams']), undefined);
    assert.equal(client.getQueryData(['profile', 1]), undefined);
});

test('automatic retries are disabled for queries and mutations', async () => {
    const client = createQueryClient(); let calls = 0;
    await assert.rejects(client.fetchQuery({ queryKey: ['failure'], queryFn: async () => { calls++; throw new Error('offline'); } }));
    assert.equal(calls, 1);
    assert.equal(client.getDefaultOptions().mutations.retry, false);
    assert.equal(client.getDefaultOptions().queries.refetchOnWindowFocus, false);
    client.clear();
});
