import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join, resolve, dirname, sep } from 'node:path';
import { readFile, readdir } from 'node:fs/promises';

const load = (path) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, path)));
const { createHttpClient } = await load('shared/api/httpClient.js');
const { ApiError } = await load('shared/api/errors.js');
const { configureApi } = await load('shared/api/runtime.js');
const { request } = await load('shared/api/request.js');
const { apiDelete } = await load('shared/api/delete.js');
const { getImage } = await load('shared/api/images.js');
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const failure = (code, status = 401, details) => json({ error: { code, message: 'server message', details } }, status);

function setup(responses, options = {}) {
    const calls = [], notifications = [];
    let token = 'current-token';
    const expired = [];
    const http = createHttpClient({
        baseUrl: 'https://test.invalid/api/',
        getToken: () => token,
        onSessionExpired: (value) => expired.push(value),
        fetch: async (...args) => {
            calls.push(args);
            const result = responses.shift();
            if (result instanceof Error) throw result;
            assert.ok(result, 'unexpected extra request');
            return result;
        },
        ...options,
    });
    configureApi({ request: http, notify: (value) => notifications.push(value) });
    return { http, calls, notifications, expired, setToken: (value) => { token = value; } };
}

test('waits for session initialization, serializes JSON and forwards headers and signal', async () => {
    let initialized = false;
    const signal = new AbortController().signal;
    const state = setup([json({ id: 4 })], {
        prepareSession: async () => { initialized = true; },
        getToken: () => { assert.ok(initialized); return 'restored-token'; },
    });
    assert.deepEqual(await state.http({ method: 'PATCH', path: 'events/4', body: { name: 'Name' }, headers: { Accept: 'application/json' }, signal }), { id: 4 });
    const [url, init] = state.calls[0];
    assert.equal(url, 'https://test.invalid/api/events/4');
    assert.equal(init.body, '{"name":"Name"}');
    assert.deepEqual(init.headers, { 'Content-Type': 'application/json', Authorization: 'Bearer restored-token', Accept: 'application/json' });
    assert.equal(init.signal, signal);
});

test('guest GET omits authorization and content type; empty 204 returns null', async () => {
    const state = setup([new Response(null, { status: 204 })]);
    state.setToken(null);
    assert.equal(await state.http({ method: 'GET', path: 'events' }), null);
    assert.deepEqual(state.calls[0][1].headers, {});
    assert.equal(state.calls[0][1].body, undefined);
});

test('normalizes HTTP errors and retains legacy error.code/details', async () => {
    const state = setup([failure('EVENT_HAS_RELATED_OBJECTS', 409, { teams: 2 })]);
    await assert.rejects(state.http({ method: 'DELETE', path: 'events/4' }), (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, 409);
        assert.equal(error.code, 'EVENT_HAS_RELATED_OBJECTS');
        assert.equal(error.error.code, error.code);
        assert.deepEqual(error.details, { teams: 2 });
        return true;
    });
    assert.deepEqual(state.expired, []);
});

test('expires authenticated sessions only for specified 401 codes', async () => {
    for (const code of ['INVALID_TOKEN', 'INVALID_SESSION', 'SESSION_NOT_FOUND']) {
        const state = setup([failure(code)]);
        await assert.rejects(state.http({ method: 'GET', path: 'auth/me' }), ApiError);
        assert.deepEqual(state.expired, ['current-token']);
    }
    for (const [code, status, token] of [['FORBIDDEN', 401, 'token'], ['INVALID_TOKEN', 403, 'token'], ['INVALID_TOKEN', 401, null]]) {
        const state = setup([failure(code, status)]);
        state.setToken(token);
        await assert.rejects(state.http({ method: 'GET', path: 'events' }));
        assert.deepEqual(state.expired, []);
    }
});

test('non-JSON HTTP failures and network failures have a stable error shape', async () => {
    for (const [response, code, status] of [[new Response('Unauthorized', { status: 401 }), 'NO_TOKEN', 401], [new Response('<html>error</html>', { status: 502 }), 'INTERNAL_ERROR', 502], [new TypeError('offline'), 'NETWORK_ERROR', null]]) {
        const state = setup([response]);
        await assert.rejects(state.http({ method: 'GET', path: 'events' }), (error) => error instanceof ApiError && error.code === code && error.status === status);
        assert.deepEqual(state.expired, status === 401 ? ['current-token'] : []);
    }
});

test('keeps request cancellation distinct from network failures', async () => {
    const error = new DOMException('Aborted', 'AbortError');
    const state = setup([error]);
    await assert.rejects(state.http({ method: 'GET', path: 'events' }), (actual) => actual === error);
});

test('blob downloads and images share authorization and transport', async () => {
    const state = setup([new Response('pdf'), new Response('image')]);
    const blob = await state.http({ method: 'GET', path: 'leagues/1/fudzi_presentation', responseType: 'blob' });
    assert.equal(await blob.text(), 'pdf');
    const url = await getImage('events/1/photo');
    try {
        assert.ok(url.startsWith('blob:'));
        assert.equal(state.calls[1][1].headers.Accept, 'image/webp');
        assert.equal(state.calls[1][1].headers.Authorization, 'Bearer current-token');
    } finally { URL.revokeObjectURL(url); }
});

test('missing images return null without notification, other failures notify only when requested', async () => {
    const state = setup([failure('BAD_IMAGE', 400), failure('FORBIDDEN', 403), failure('FORBIDDEN', 403)]);
    assert.equal(await getImage('missing', { error: true }), null);
    assert.equal(await getImage('forbidden'), null);
    assert.equal(state.notifications.length, 0);
    assert.equal(await getImage('forbidden', { error: 'Нет доступа к фото' }), null);
    assert.deepEqual(state.notifications, [{ type: 'error', text: 'Нет доступа к фото' }]);
});

test('request notifications preserve success, custom errors and silent defaults', async () => {
    const state = setup([json({ ok: true }), failure('FORBIDDEN', 403), failure('FORBIDDEN', 403), failure('FORBIDDEN', 403)]);
    await request({ method: 'POST', path: 'events', notify: { success: 'Создано' } });
    await assert.rejects(request({ method: 'GET', path: 'events' }));
    await assert.rejects(request({ method: 'GET', path: 'events', notify: { error: 'Ошибка списка' } }));
    await assert.rejects(request({ method: 'GET', path: 'events', notify: { error: true } }));
    assert.deepEqual(state.notifications.map(({ type, text }) => [type, text]), [['success', 'Создано'], ['error', 'Ошибка списка'], ['error', 'У вас нет прав для выполнения этого действия.']]);
});

test('supported team deletion offers restore and never retries with force', async () => {
    const state = setup([json({}), json({})]);
    await apiDelete('teams/1', 1);
    state.setToken('new-token');
    await state.notifications[0].action();
    assert.equal(state.calls[1][0], 'https://test.invalid/api/teams/1/restore');
    assert.equal(state.calls[1][1].headers.Authorization, 'Bearer new-token');
});
test('delete failures notify once without offering force deletion', async () => {
    const state = setup([failure('FORBIDDEN', 403)]);
    await assert.rejects(apiDelete('teams/1'), ApiError);
    assert.equal(state.notifications.length, 1);
    assert.equal(state.notifications[0].action, undefined);
    assert.equal(state.calls.length, 1);
});

test('API modules do not import stores/UI; shared transport has only local infrastructure imports', async () => {
    for (const directory of ['src/shared/api']) {
        for (const name of await readdir(directory)) {
            const source = await readFile(join(directory, name), 'utf8');
            assert.doesNotMatch(source, /from\s+["'][^"']*(?:store|components|pages|zustand|react)[^"']*["']/);
            for (const [, dependency] of source.matchAll(/from\s+["']([^"']+)["']/g)) {
                if (dependency === '@tanstack/react-query') continue;
                assert.ok(dependency.startsWith('.'), `unexpected external import: ${dependency}`);
                const target = resolve(dirname(join(directory, name)), dependency);
                const allowed = directory === 'src/shared/api' ? ['src/shared'] : ['src/api', 'src/shared'];
                assert.ok(allowed.some((root) => target.startsWith(resolve(root) + sep)), `invalid dependency: ${directory}/${name} -> ${dependency}`);
            }
        }
    }
});

test('a late 401 from an old session cannot expire the current session', async () => {
    let respond;
    const pending = new Promise((resolve) => { respond = resolve; });
    const state = setup([], { fetch: () => pending });
    const result = state.http({ method: 'GET', path: 'auth/me' });
    // Let prepareSession and getToken finish before changing the active session.
    await Promise.resolve();
    state.setToken('new-login');
    respond(failure('INVALID_SESSION'));
    await assert.rejects(result, ApiError);
    assert.deepEqual(state.expired, []);
});

test('simultaneous expired responses clear a session only once', async () => {
    let token = 'expired';
    let count = 0;
    const http = createHttpClient({
        baseUrl: '/api/',
        getToken: () => token,
        onSessionExpired: () => { count++; token = null; },
        fetch: async () => failure('INVALID_TOKEN'),
    });
    const results = await Promise.allSettled([http({ method: 'GET', path: 'auth/me' }), http({ method: 'GET', path: 'auth/permissions' })]);
    assert.ok(results.every((value) => value.status === 'rejected'));
    assert.equal(count, 1);
});

test('file download creates, clicks, removes the link and revokes the object URL', async () => {
    const { apiGetFile } = await load('shared/api/files.js');
    const state = setup([new Response('pdf content')]);
    const events = [];
    const anchor = { click() { events.push('click'); }, remove() { events.push('remove'); } };
    const previousDocument = globalThis.document;
    const previousWindow = globalThis.window;
    globalThis.window = { URL };
    globalThis.document = {
        createElement(tag) { assert.equal(tag, 'a'); return anchor; },
        body: { appendChild(element) { assert.equal(element, anchor); events.push('append'); } },
    };
    try {
        await apiGetFile('teams/4/diploma', 'диплом.pdf');
        assert.equal(anchor.download, 'диплом.pdf');
        assert.deepEqual(events, ['append', 'click', 'remove']);
        assert.equal(state.calls[0][0], 'https://test.invalid/api/teams/4/diploma');
        await assert.rejects(fetch(anchor.href), TypeError);
    } finally { globalThis.document = previousDocument; globalThis.window = previousWindow; }
});
