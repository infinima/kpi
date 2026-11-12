import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { fromEventDto } = await load('entities/event/api/adapters.js');
const { fromLocationDto } = await load('entities/location/api/adapters.js');
const { fromLeagueDto } = await load('entities/league/api/adapters.js');
const { parseMembers, parseStringArray, mapTeamResponseRow } = await load('entities/team/api/adapters.js');
const { configureApi } = await load('shared/api/runtime.js');
const { createHttpClient } = await load('shared/api/httpClient.js');
const { eventApi } = await load('entities/event/api/eventApi.js');
const { locationApi } = await load('entities/location/api/locationApi.js');
const { leagueApi } = await load('entities/league/api/leagueApi.js');

function setup(responses) {
    const calls = [];
    configureApi({ request: createHttpClient({ baseUrl: '/api/', fetch: async (url, init) => { calls.push({ url, ...init }); return new Response(JSON.stringify(responses.shift())); } }), notify() {} });
    return calls;
}

test('catalog adapters isolate server field names and keep timestamp/deletion information', () => {
    const event = Object.freeze({ id: 1, name: 'Event', date: '2026-11-12', created_at: 'c', updated_at: 'u', deleted_at: 'd' });
    assert.deepEqual(fromEventDto(event), { id: 1, name: 'Event', date: '2026-11-12', createdAt: 'c', updatedAt: 'u', deletedAt: 'd' });
    const location = fromLocationDto({ id: 2, event_id: 1, name: 'Hall', address: 'Address', photo_album_url: null });
    assert.equal(location.eventId, 1); assert.equal(location.photoAlbumUrl, null); assert.equal(location.event_id, undefined);
    const league = fromLeagueDto({ id: 3, location_id: 2, name: 'League', status: 'NOT_STARTED', max_teams_count: 0, fudzi_presentation: null });
    assert.equal(league.locationId, 2); assert.equal(league.maxTeamsCount, 0); assert.equal(league.presentation, null);
});

test('catalog reads nested collections and has no deleted structure requests', async () => {
    const calls = setup([[{ id: 1, name: 'E', date: '2026-11-12' }], { locations: [{ id: 2, name: 'L', address: 'A' }] }, { leagues: [{ id: 3, name: 'G', status: 'NOT_STARTED', max_teams_count: 10 }] }]);
    assert.deepEqual(await eventApi.list('deleted'), []);
    await eventApi.list();
    assert.equal((await locationApi.list(1))[0].eventId, 1);
    assert.equal((await leagueApi.list(2))[0].locationId, 2);
    assert.deepEqual(calls.map(call => call.url), ['/api/events','/api/events/1','/api/locations/2']);
});

test('team member adapter handles arrays, JSON and legacy participant objects without leaking raw values', () => {
    assert.deepEqual(parseMembers(['A', 'B']), ['A', 'B', '', '']);
    assert.deepEqual(parseMembers('{"participants":[{"full_name":"A"},{"full_name":7}]}'), ['A', '', '', '']);
    assert.deepEqual(parseMembers('broken'), ['', '', '', '']);
    assert.deepEqual(parseMembers(null), ['', '', '', '']);
    assert.deepEqual(parseStringArray('["A",7]'), ['A', '7']);
    assert.deepEqual(parseStringArray(' A, B ,,'), ['A', 'B']);
    const team = mapTeamResponseRow({ id: 1, league_id: 2, members: '["A","B","C","D"]', appreciations: '[]', special_nominations: '["Special"]' });
    assert.equal(team.league_name, 'Лига #2');
    assert.deepEqual(team.members, ['A', 'B', 'C', 'D']);
    assert.deepEqual(team.special_nominations, ['Special']);
    assert.equal(team.meals_count, 0);
});

test('new profile and user-list response envelopes are adapted', async () => {
    const { userApi } = await load('entities/user/api/userApi.js');
    const { accountApi } = await load('entities/account/api/accountApi.js');
    const profile = { id: 1, email: 'a@b.ru', first_name: 'A', last_name: 'B', patronymic: null, phone_number: '7', wire_only: 'hidden' };
    const calls = setup([{ items: [profile], total: 1 }, profile]);
    assert.equal((await userApi.list('active'))[0].wire_only, undefined);
    assert.equal((await accountApi.profile(1)).wire_only, undefined);
    assert.deepEqual(calls.map(call => call.url), ['/api/users?deleted=false&limit=200', '/api/auth/me']);
});

test('mailing detail adapters own recipient DTOs rather than leaking raw records into views', async () => {
    const { mailingApi } = await load('entities/mailing/api/mailingApi.js');
    const details = { id: 1, subject: 'Subject', body: 'Body', selection_event_id: null, selection_location_id: null, selection_league_id: null, selection_manual_emails: ['a@b.ru'], shared_attachments: [], status: 'draft', send_started_at: null, send_finished_at: null, created_at: 'c', updated_at: 'u', deleted_at: null, selection_type: 'manual', team_names: [], wire_only: true, recipients: [{ id: 2, mailing_id: 1, team_id: null, team_name: null, league_name: null, email: 'a@b.ru', delivery_status: 'pending', attempts_count: 0, provider_message_id: null, last_error_code: null, last_error_message: null, last_attempt_at: null, sent_at: null, created_at: 'c', wire_only: true }] };
    setup([details]);
    const mailing = await mailingApi.details(1);
    assert.equal(mailing.wire_only, undefined);
    assert.equal(mailing.recipients[0].wire_only, undefined);
    assert.equal(mailing.recipients[0].email, 'a@b.ru');
    assert.equal(mailing.recipients[0].attempts_count, 0);
});

test('journal snapshots adapt untyped historical JSON before it reaches subject tables', async () => {
    const { fudziSnapshot, kvartalySnapshot } = await load('entities/log/api/snapshot.js');
    assert.equal(fudziSnapshot(null).questions.length, 16);
    const fudzi = fudziSnapshot({ name: 'A', penalty_fudzi: 2, place_fudzi: 1, answers_fudzi: { questions: [{ status: 'correct' }, { status: 'incorrect' }, {}] } });
    assert.deepEqual(fudzi, { name: 'A', penalty: 2, place: 1, questions: [{ status: 'correct' }, { status: 'incorrect' }, { status: 'not_submitted' }] });
    const kvartaly = kvartalySnapshot(JSON.stringify({ name: 'B', penalty_kvartaly: 1, answers_kvartaly: [{ finished: true, bonus: 3, questions: [{ correct: 2, incorrect: 1 }] }] }));
    assert.equal(kvartaly.quarters[0].bonus, 3);
    assert.deepEqual(kvartaly.quarters[0].questions, [{ correct: 2, incorrect: 1 }]);
    assert.equal(kvartalySnapshot('invalid').quarters.length, 0);
});
