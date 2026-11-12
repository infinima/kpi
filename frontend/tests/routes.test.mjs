import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { matchRoutes } from 'react-router-dom';

const source = await readFile('src/app/App.tsx', 'utf8');
const ast = ts.createSourceFile('App.tsx', source, ts.ScriptTarget.Latest, true);
const routes = [];
function routePath(opening) {
    const attribute = opening.attributes.properties.find((node) => ts.isJsxAttribute(node) && node.name.getText(ast) === 'path');
    return attribute?.initializer && ts.isStringLiteral(attribute.initializer) ? attribute.initializer.text : null;
}
function visit(node) {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(ast) === 'Route') {
        const own = routePath(node);
        if (own !== null) {
            const segments = [own];
            let parent = (ts.isJsxOpeningElement(node) ? node.parent : node).parent;
            while (parent) {
                if (ts.isJsxElement(parent) && parent.openingElement.tagName.getText(ast) === 'Route') {
                    const path = routePath(parent.openingElement);
                    if (path) segments.unshift(path);
                }
                parent = parent.parent;
            }
            const path = segments.join('/').replace(/\/+/g, '/');
            routes.push({ path });
        }
    }
    ts.forEachChild(node, visit);
}
visit(ast);

const league = '/events/:eventId/location/:locationId/league/:leagueId';
test('route migration retains all baseline routes, compatibility aliases and placeholders', () => {
    const baseline = ['/dashboard', '/', '/indev', '/example', '/auth', '/forgot_pass', '/new_pass', '/lk', '/lk/*', '/logs', '/logs/teams/:teamId', '/logs/users/:userId', '/logs/users/:userId/actions', '/locations', '/leagues', '/results', '/qr', '/scanner', '/read_qr', '/show/:leagueId', '/show/:leagueId/:secret_code', '/showcontroller/:leagueId', '*', '/events', '/events/:eventId', '/events/:eventId/history', '/events/:eventId/teams', '/events/:eventId/location', '/events/:eventId/location/:locationId', '/events/:eventId/location/:locationId/history', '/events/:eventId/location/:locationId/teams', '/events/:eventId/location/:locationId/league', league, ...['history', 'results/kvartaly', 'results/fudzi', 'results/overall', 'accounts', 'teams', 'show', 'show-control', 'tables', 'fudzi-presentation'].map((part) => `${league}/${part}`)];
    assert.deepEqual(routes.map((route) => route.path).sort(), baseline.sort());
});

test('nested and legacy URLs still resolve with the expected parameters', () => {
    for (const [url, pattern, params] of [
        ['/events/1/location/2/league/3/results/fudzi', `${league}/results/fudzi`, { eventId: '1', locationId: '2', leagueId: '3' }],
        ['/showcontroller/4', '/showcontroller/:leagueId', { leagueId: '4' }],
        ['/logs/users/5/actions', '/logs/users/:userId/actions', { userId: '5' }],
        ['/lk/reg_team', '/lk/*', { '*': 'reg_team' }],
        ['/read_qr?data=uuid', '/read_qr', {}],
    ]) {
        const match = matchRoutes(routes, url).at(-1);
        assert.equal(match.route.path, pattern);
        assert.deepEqual(match.params, params);
    }
    assert.equal(matchRoutes(routes, '/unknown/route').at(-1).route.path, '*');
});
