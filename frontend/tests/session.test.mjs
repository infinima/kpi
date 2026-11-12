import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { useUser } = await load('entities/session/model/session.js');
const { useNotifications } = await load('shared/model/notifications.js');
const { configureApi } = await load('shared/api/runtime.js');
const user = (id) => ({ id, first_name: `User${id}`, last_name: 'Test', email: `user${id}@test.invalid`, patronymic: '', tg_id: '', photo: '' });
const notifications = [];
beforeEach(() => {
    globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
    useUser.setState({ token: null, user: null, guest: true });
    useNotifications.setState({ addMessage: (value) => notifications.push(value) });
    notifications.length = 0;
});

test('concurrent session-user loads share requests and publish permissions atomically', async () => {
    let resolveMe; const me = new Promise((resolve) => { resolveMe = resolve; });
    const paths = [];
    configureApi({ request: async ({ path }) => { paths.push(path); return path.startsWith('auth/me') ? me : { authenticated: [], owner: [], grants: [{ role: 'admin', scope_type: 'global', scope_id: null, actions: ['teams.read'] }] }; }, notify() {} });
    useUser.setState({ token: 'token', guest: false });
    const first = useUser.getState().fetchUser(), second = useUser.getState().fetchUser();
    assert.equal(paths.length, 1);
    resolveMe(user(1));
    await Promise.all([first, second]);
    assert.deepEqual(paths, ['auth/me', 'auth/permissions']);
    assert.equal(useUser.getState().user.id, 1);
    assert.equal(useUser.getState().can('teams', 'get'), true);
});

test('a late profile response cannot repopulate an ended or replaced session', async () => {
    let resolveMe;
    configureApi({ request: ({ path }) => { assert.ok(path.startsWith('auth/me')); return new Promise((resolve) => { resolveMe = resolve; }); }, notify() {} });
    useUser.setState({ token: 'old-token', guest: false });
    const pending = useUser.getState().fetchUser();
    useUser.setState({ token: 'new-token', user: { ...user(2), rights: {} }, guest: false });
    resolveMe(user(1)); await pending;
    assert.equal(useUser.getState().user.id, 2);
    assert.equal(useUser.getState().token, 'new-token');
});

test('logout completing after another login does not clear the new user or issue goodbye', async () => {
    let finish;
    configureApi({ request: () => new Promise((resolve) => { finish = resolve; }), notify() {} });
    useUser.setState({ token: 'old-token', user: { ...user(1), rights: {} }, guest: false });
    const logout = useUser.getState().logout();
    useUser.setState({ token: 'new-token', user: { ...user(2), rights: {} }, guest: false });
    finish({}); await logout;
    assert.equal(useUser.getState().token, 'new-token');
    assert.equal(useUser.getState().user.id, 2);
    assert.deepEqual(notifications, []);
});

test('clearing memory session works even if browser storage throws', () => {
    globalThis.localStorage = { removeItem() { throw new Error('blocked'); } };
    useUser.setState({ token: 'token', user: { ...user(1), rights: {} }, guest: false });
    assert.doesNotThrow(() => useUser.getState().clearSession());
    assert.equal(useUser.getState().token, null);
    assert.equal(useUser.getState().user, null);
    assert.equal(useUser.getState().guest, true);
});
