import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const load = file => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { configureApi } = await load('shared/api/runtime.js');
const { supportsDevRequest } = await load('shared/api/devContract.js');
const { teamApi } = await load('entities/team/api.js');
const { roleApi } = await load('entities/permission/roleApi.js');
const { eventApi } = await load('entities/event/api/eventApi.js');
const { locationApi } = await load('entities/location/api/locationApi.js');
const { leagueApi } = await load('entities/league/api/leagueApi.js');
const spec = JSON.parse(await readFile('openapi.json', 'utf8'));
function example(schema) {
    if (schema.$ref) return example(spec.components.schemas[schema.$ref.split('/').at(-1)]);
    if (schema.enum) return schema.enum[0];
    if (schema.anyOf) return example(schema.anyOf[0]);
    if (schema.type === 'object') return Object.fromEntries((schema.required ?? []).map(key => [key, example(schema.properties[key])]));
    if (schema.type === 'array') return [];
    return { integer: 1, number: 1, boolean: false, string: 'Example', null: null }[schema.type];
}
function setup(responses) {
    const calls = [];
    configureApi({ request: async options => { assert.equal(supportsDevRequest(options.method, options.path), true, `${options.method} ${options.path}`); calls.push(options); return responses.shift(); }, notify() {} });
    return calls;
}
test('deployed route allowlist permits every published operation and blocks removed structure CRUD', () => {
    for (const [path, methods] of Object.entries(spec.paths)) for (const method of Object.keys(methods)) {
        assert.equal(supportsDevRequest(method.toUpperCase(), path.slice(1).replace(/\{[^}]+\}/g, '1')), true);
    }
    for (const path of ['events/1', 'locations/1', 'leagues/1']) for (const verb of ['POST','PATCH','DELETE']) assert.equal(supportsDevRequest(verb,path), false);
    for (const path of ['events/registration','permissions/user/1','teams/league/1','teams/user/uuid/abc']) assert.equal(supportsDevRequest('GET',path),false);
    assert.equal(supportsDevRequest('GET','teams?league_id=1'),true);
});
test('structure mutation callbacks reject locally without issuing a request', async () => {
    const calls = setup([]);
    for (const api of [eventApi, locationApi, leagueApi]) {
        await assert.rejects(api.create(1, {}), { code: 'FEATURE_UNAVAILABLE' });
        await assert.rejects(api.update(1, {}), { code: 'FEATURE_UNAVAILABLE' });
        await assert.rejects(api.remove(1), { code: 'FEATURE_UNAVAILABLE' });
        await assert.rejects(api.restore(1), { code: 'FEATURE_UNAVAILABLE' });
    }
    assert.equal(calls.length, 0);
});
test('teams adapt nested refs, independent payment flag and server field permissions', async () => {
    const row = example(spec.components.schemas.TeamOut);
    Object.assign(row, { is_paid: true, members: ['A','B','C','D'], editable_fields: ['members','documents'], lunches_count: 3 });
    const calls = setup([[row], row, row]);
    const [team] = await teamApi.list({ leagueId: '1' });
    assert.equal(team.is_paid, true); assert.equal(team.meals_count,3);
    assert.equal(team.league_id, row.league.id);
    assert.deepEqual(team.editable_fields,['members','documents']);
    await teamApi.create({ league_id:1, name:'T', school:'S', region:'R', members:row.members, documents:'legacy', maintainer_activity:'legacy', meals_count:3 });
    const body = calls[1].body;
    for (const key of Object.keys(body)) assert.ok(key in spec.components.schemas.TeamCreateIn.properties, key);
    assert.equal(body.lunches_count,3); assert.equal(body.documents,undefined);
    await teamApi.update(1, { status:'ARRIVED' });
    assert.equal(calls[2].path,'teams/1/status'); assert.deepEqual(calls[2].body,{ status:'ARRIVED' });
});
test('role assignments use grant/revoke endpoints rather than legacy permission rows', async () => {
    const calls = setup([[], example(spec.components.schemas.GrantOut), null]);
    await roleApi.list(1);
    await roleApi.create({ user_id:1, role:'organizer', scope_type:'event', scope_id:1 });
    await roleApi.remove(2);
    assert.deepEqual(calls.map(({method,path}) => [method,path]), [['GET','users/1/roles'], ['POST','role-assignments'], ['DELETE','role-assignments/2']]);
});

test('home page uses the dedicated main-event endpoint and preserves its registration status', async () => {
    const event = { ...example(spec.components.schemas.EventDetailOut), id: 12, name: 'Main event', date: '2026-12-12', status: 'REGISTRATION_OPEN', photo_url: null };
    const calls = setup([event]);
    const result = await eventApi.main();
    assert.equal(result.id, 12);
    assert.equal(result.status, 'REGISTRATION_OPEN');
    assert.equal(calls[0].path, 'events/main');
    const { ApiError } = await load('shared/api/errors.js');
    configureApi({ request: async () => { throw new ApiError('NOT_FOUND', 'No main event', 404); }, notify() {} });
    assert.equal(await eventApi.main(), null);
    configureApi({ request: async () => { throw new ApiError('INTERNAL_ERROR', 'Offline', 503); }, notify() {} });
    await assert.rejects(eventApi.main(), { status: 503 });
});
