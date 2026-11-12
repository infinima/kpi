import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const { registrationPath, authDestination, safeReturnTo } = await import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, 'shared/lib/navigation.js')));
test('registration preserves the selected event, location and league through authentication', () => {
    for (const destination of [registrationPath(12), registrationPath(12, 24, 36)]) {
        const login = new URL(authDestination(destination, true), 'https://frontend.invalid');
        assert.equal(login.pathname, '/auth');
        assert.equal(safeReturnTo(login.searchParams.get('returnTo')), destination);
        assert.equal(authDestination(destination, false), destination);
    }
    const query = new URL(registrationPath(12, 24, 36), 'https://frontend.invalid').searchParams;
    assert.deepEqual([...query], [['eventId', '12'], ['locationId', '24'], ['leagueId', '36']]);
});
test('authentication accepts internal destinations and rejects external or malformed redirects', () => {
    for (const value of [null, '', 'https://outside.invalid', '//outside.invalid', '/\\outside.invalid', '/events\r\nLocation: outside']) assert.equal(safeReturnTo(value), null);
    assert.equal(safeReturnTo('/lk/reg_team?eventId=12'), '/lk/reg_team?eventId=12');
});
