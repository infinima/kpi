import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = file => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { maintenanceAccess, isMaintenanceAdmin, maintenanceLabels } = await load('entities/maintenance/model/access.js');
const { createHttpClient } = await load('shared/api/httpClient.js');
test('work mode permits only global admins; all other visitors see maintenance except the login entry', () => {
    for (const role of [null, 'organizer', 'checker_volunteer', 'venue_volunteer', 'admin']) for (const scope_type of ['global', 'event', 'location', 'league']) {
        const admin = isMaintenanceAdmin(role ? { grants: [{ role, scope_type, scope_id: scope_type === 'global' ? null : 1, actions: [] }] } : null);
        assert.equal(admin, role === 'admin' && scope_type === 'global');
        for (const path of ['/', '/events', '/lk/dashboard', '/lk/reg_team', '/forgot_pass', '/new_pass', '/show/1/12345']) assert.equal(maintenanceAccess('users', admin, path), admin ? 'application' : 'maintenance');
        assert.equal(maintenanceAccess('users', admin, '/auth'), admin ? 'application' : 'login');
    }
    assert.equal(maintenanceLabels.users, 'В работе');
});
test('off mode keeps all ordinary routes accessible; all mode follows the API full shutdown contract', () => {
    for (const admin of [true, false]) for (const path of ['/', '/events', '/auth', '/lk/me']) {
        assert.equal(maintenanceAccess('off', admin, path), 'application');
        assert.equal(maintenanceAccess('all', admin, path), path === '/auth' ? 'login' : 'maintenance');
    }
    assert.equal(maintenanceAccess('users', false, '/auth/'), 'login');
    assert.equal(maintenanceAccess('users', false, '/auth/other'), 'maintenance');
});
test('503 MAINTENANCE triggers mode refresh without ending a valid session', async () => {
    const notices = [], expired = [];
    const client = createHttpClient({ baseUrl: '/api/', getToken: () => 'valid-session', onMaintenance: error => notices.push(error.message), onSessionExpired: token => expired.push(token), fetch: async () => new Response(JSON.stringify({ error: { code: 'MAINTENANCE', message: 'Обновляем сайт' } }), { status: 503 }) });
    await assert.rejects(client({ method: 'GET', path: 'events' }), { code: 'MAINTENANCE', status: 503 });
    assert.deepEqual(notices, ['Обновляем сайт']);
    assert.deepEqual(expired, []);
});

test('maintenance endpoint errors and unrelated server errors cannot cause recursive mode refreshes', async () => {
    for (const [path, code] of [['maintenance', 'MAINTENANCE'], ['events', 'INTERNAL_ERROR']]) {
        let refreshes = 0;
        const client = createHttpClient({ baseUrl: '/api/', onMaintenance: () => refreshes++, fetch: async () => new Response(JSON.stringify({ error: { code, message: 'Unavailable' } }), { status: 503 }) });
        await assert.rejects(client({ method: 'GET', path }), { status: 503 });
        assert.equal(refreshes, 0);
    }
});
