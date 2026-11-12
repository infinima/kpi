import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = file => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { summarizeLeagues, leagueOccupancy } = await load('pages/account/model/dashboard/statistics.js');
const { canAccessDashboard } = await load('entities/permission/model/permissions.js');
const { leagueStatuses } = await load('entities/league/model/status.js');
const { leagueApi } = await load('entities/league/api/leagueApi.js');
const { eventApi } = await load('entities/event/api/eventApi.js');
const { configureApi } = await load('shared/api/runtime.js');
const { supportsDevRequest } = await load('shared/api/devContract.js');
const league = (id, teamsCount, maxTeamsCount, reserveCount, status = 'NOT_STARTED') => ({ id, name: `League ${id}`, teamsCount, maxTeamsCount, reserveCount, status });
test('dashboard is restricted to global administrators with the server dashboard grant', () => {
    for (const rights of [null, undefined, { authenticated: ['dashboard.view'], owner: ['dashboard.view'], grants: [] }]) assert.equal(canAccessDashboard(rights), false);
    for (const role of ['organizer', 'checker_volunteer', 'venue_volunteer', 'admin']) for (const scope_type of ['global', 'event', 'location', 'league']) {
        const rights = { authenticated: [], owner: [], grants: [{ role, scope_type, scope_id: scope_type === 'global' ? null : 1, actions: ['dashboard.view'] }] };
        assert.equal(canAccessDashboard(rights), role === 'admin' && scope_type === 'global');
    }
    assert.equal(canAccessDashboard({ grants: [{ role: 'admin', scope_type: 'global', scope_id: null, actions: [] }] }), false);
});
test('dashboard totals keep reserve separate and distinguish limited and unlimited capacity', () => {
    const leagues = Object.freeze([
        Object.freeze(league(1, 8, 10, 2, 'REGISTRATION_IN_PROGRESS')),
        Object.freeze(league(2, 7, 5, 1)),
        Object.freeze(league(3, 12, 0, 0)),
    ]);
    assert.deepEqual(summarizeLeagues(leagues), { leagues: 3, teams: 27, reserve: 3, registrationOpen: 1, availablePlaces: 2, unlimitedLeagues: 1 });
    assert.deepEqual(leagues.map(leagueOccupancy), [80, 100, null]);
    assert.deepEqual(summarizeLeagues([]), { leagues: 0, teams: 0, reserve: 0, registrationOpen: 0, availablePlaces: 0, unlimitedLeagues: 0 });
});
test('main event dashboard adapts every nested location and league with its statistics', async () => {
    const calls = [];
    configureApi({ request: async options => { calls.push(options); return {
        id: 1, name: 'Main', date: '2026-12-12', status: 'REGISTRATION_OPEN', season: 'AUTUMN', photo_url: null,
        locations: [{ id: 2, name: 'Hall', address: 'Address', photo_album_url: null, leagues: [{ id: 3, name: 'League', status: 'REGISTRATION_IN_PROGRESS', max_teams_count: 10, teams_count: 4, reserve_count: 2 }] }],
    }; }, notify() {} });
    const event = await eventApi.mainOverview();
    assert.deepEqual(event.locations[0], { id: 2, name: 'Hall', address: 'Address', leagues: [league(3, 4, 10, 2, 'REGISTRATION_IN_PROGRESS')].map(item => ({ ...item, name: 'League' })) });
    assert.deepEqual(calls.map(({method,path}) => [method,path]), [['GET', 'events/main']]);
});
test('league status control stays disabled while its mutation is absent from the deployed API', async () => {
    let calls = 0;
    configureApi({ request: async () => { calls++; }, notify() {} });
    assert.equal(leagueApi.statusChangeAvailable, supportsDevRequest('POST', 'leagues/1/status'));
    assert.equal(leagueApi.statusChangeAvailable, false);
    await assert.rejects(leagueApi.setStatus(1, 'REGISTRATION_IN_PROGRESS'), { code: 'FEATURE_UNAVAILABLE' });
    assert.equal(calls, 0);
    assert.equal(leagueStatuses.length, 11);
    assert.equal(new Set(leagueStatuses).size, 11);
});
