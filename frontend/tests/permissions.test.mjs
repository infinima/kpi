import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const load = (path) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, path)));
const { hasPermission, hasGlobalPermission, hasAnyPermission } = await load('entities/permission/model/permissions.js');
const { canUseTableMode, getCollectionViewMode } = await load('pages/event/viewMode.js');

const rights = (grants = []) => ({ authenticated: ["teams.create"], owner: ["teams.edit"], grants });
const grant = (scope_type, scope_id, actions) => ({ role: "organizer", scope_type, scope_id, actions });
test('guests and ownership capability alone cannot authorize arbitrary teams', () => {
    assert.equal(hasPermission(null, 'teams', 'update', 1), false);
    assert.equal(hasPermission(rights(), 'teams', 'update', 1), false);
});
test('scoped role actions apply only to matching hierarchy and never imply structure mutations', () => {
    for (const [scope, field] of [['event','eventId'], ['location','locationId'], ['league','leagueId']]) {
        const r = rights([grant(scope, 7, ['teams.edit', 'teams.read', 'structure.read'])]);
        assert.equal(hasPermission(r, 'teams', 'update', { [field]: 7 }), true);
        assert.equal(hasPermission(r, 'teams', 'update', { [field]: 8 }), false);
        assert.equal(hasPermission(r, 'teams', 'update', 7), false);
        assert.equal(hasPermission(r, 'teams', 'delete', { [field]: 7 }), false);
        assert.equal(hasGlobalPermission(r, 'teams', 'update'), false);
        assert.equal(hasAnyPermission(r, 'teams', ['update']), true);
        for (const entity of ['events','locations','leagues']) for (const action of ['create','update','delete','restore']) {
            assert.equal(hasPermission(r, entity, action, { [field]: 7 }), false);
            assert.equal(canUseTableMode(r, entity), false);
        }
    }
});
test('global role grants users management without granting unrelated actions', () => {
    const r = rights([grant('global', null, ['users.manage'])]);
    assert.equal(hasGlobalPermission(r, 'users', 'get'), true);
    assert.equal(hasGlobalPermission(r, 'permissions', 'update'), true);
    assert.equal(hasPermission(r, 'teams', 'update', 1), false);
});

test('URL table mode remains permission-gated and entity-specific; invalid values use cards', () => {
    for (const entity of ['events', 'locations', 'leagues']) {
        const query = new URLSearchParams({ [`${entity}_view`]: 'table' });
        assert.equal(getCollectionViewMode(query, entity, true), 'table');
        assert.equal(getCollectionViewMode(query, entity, false), 'cards');
        for (const other of ['events', 'locations', 'leagues'].filter((value) => value !== entity)) {
            assert.equal(getCollectionViewMode(query, other, true), 'cards');
        }
        for (const value of ['', 'cards', 'invalid', 'TABLE']) {
            assert.equal(getCollectionViewMode(new URLSearchParams({ [`${entity}_view`]: value }), entity, true), 'cards');
        }
        assert.equal(getCollectionViewMode(new URLSearchParams(), entity, true), 'cards');
    }
});

test('permission editor validates target and scope without involving the session store', async () => {
    const { validatePermission } = await load('entities/permission/model/editor.js');
    const draft = { id: null, user_id: 1, object: '', permission: [], object_id: null, scope_object: null, scope_object_id: null };
    assert.match(validatePermission(draft, 'global'), /объект/);
    assert.match(validatePermission({ ...draft, object: 'teams' }, 'global'), /действие/);
    const allowed = { ...draft, object: 'teams', permission: ['get'] };
    assert.equal(validatePermission(allowed, 'global'), null);
    assert.match(validatePermission(allowed, 'local'), /ID объекта/);
    assert.equal(validatePermission({ ...allowed, object_id: 4 }, 'local'), null);
    assert.match(validatePermission(allowed, 'nested'), /родительского/);
    assert.equal(validatePermission({ ...allowed, scope_object: 'events', scope_object_id: 2 }, 'nested'), null);
});

test('registration phase restrictions allow participants only during registration and staff only within their grant scope', async () => {
    const { canRegisterTeam } = await load('entities/permission/model/permissions.js');
    const participant = rights();
    const target = { eventId: 1, locationId: 2, leagueId: 3 };
    assert.equal(canRegisterTeam(null, 'REGISTRATION_IN_PROGRESS', target), false);
    assert.equal(canRegisterTeam(participant, 'REGISTRATION_IN_PROGRESS', target), true);
    for (const status of ['NOT_STARTED', 'REGISTRATION_ENDED', 'TEAMS_FIXED', 'ENDED']) {
        assert.equal(canRegisterTeam(participant, status, target), false);
        const staff = rights([grant('league', 3, ['teams.create'])]);
        assert.equal(canRegisterTeam(staff, status, target), true);
        assert.equal(canRegisterTeam(staff, status, { ...target, leagueId: 4 }), false);
    }
});
