import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { emptyTeamForm, validateTeamForm, teamMemberPayload, validateProfile, getSingleOptionId } = await load('pages/account/model/forms.js');
const { parseManualEmails, buildMailingPayload, renderPreviewTemplate } = await load('pages/account/model/mailingsSupport.js');
const { isValidEmail, getRussianPhoneDigits, formatRussianPhone } = await load('shared/lib/authValidation.js');
const { extractUuidFromScannerPayload, decodeBase64Value } = await load('shared/lib/qr.js');
const { compareValues, nextSort } = await load('shared/lib/table.js');
const valid = () => ({ ...emptyTeamForm(), eventId: '1', locationId: '2', leagueId: '3', name: ' Name ', school: 'School', region: 'Region', maintainer_activity: 'Activity', members: [' A ', 'B', 'C', 'D'], acceptedOffer: true });

test('registration validates hierarchy, required fields, four members and consent in order', () => {
    assert.match(validateTeamForm(emptyTeamForm(), false), /Выберите/);
    for (const key of ['name', 'school', 'region']) assert.match(validateTeamForm({ ...valid(), [key]: '' }, false), /обязательные/);
    assert.match(validateTeamForm({ ...valid(), members: ['A', 'B', 'C'] }, false), /четырёх/);
    assert.match(validateTeamForm({ ...valid(), members: ['A', '', 'C', 'D'] }, false), /четырёх/);
    assert.match(validateTeamForm({ ...valid(), acceptedOffer: false }, false), /согласие/);
    assert.equal(validateTeamForm(valid(), false), null);
    assert.equal(validateTeamForm({ ...valid(), eventId: '', locationId: '', leagueId: '', acceptedOffer: false }, true), null);
});

test('meals stay within the integer range and payload normalization is independent of the view', () => {
    for (const value of ['-1', '101', '1.5', 'NaN']) assert.match(validateTeamForm({ ...valid(), meals_count: value }, false), /обедов/);
    for (const value of ['0', '5', '6', '100']) assert.equal(validateTeamForm({ ...valid(), meals_count: value }, false), null);
    const form = { ...valid(), appreciationsText: ' Alice \n\n Bob ', meals_count: '2', maintainer_full_name: ' ' };
    assert.deepEqual(teamMemberPayload(form), { members: ['A', 'B', 'C', 'D'], appreciations: ['Alice', 'Bob'], meals_count: 2, maintainer_full_name: null, maintainer_activity: 'Activity' });
    assert.equal(form.members[0], ' A ');
});

test('profile required fields, single-option selection and auth formatting keep existing rules', () => {
    assert.equal(validateProfile({ first_name: 'A', last_name: 'B', phone_number: '7', patronymic: '', email: '' }), null);
    assert.match(validateProfile({ first_name: ' ', last_name: 'B', phone_number: '7' }), /имя/);
    assert.equal(getSingleOptionId([]), ''); assert.equal(getSingleOptionId([{ id: 2 }]), '2'); assert.equal(getSingleOptionId([{ id: 1 }, { id: 2 }]), '');
    assert.ok(isValidEmail(' a@b.ru ')); assert.equal(isValidEmail('a@b'), false);
    assert.equal(getRussianPhoneDigits('+7 (800) 555-35-35'), '78005553535');
    assert.equal(getRussianPhoneDigits('8 800 5553535'), '78005553535');
    assert.equal(getRussianPhoneDigits('123'), null);
    assert.equal(formatRussianPhone('88005553535'), '+7 (800) 555-35-35');
});

test('mailing selection omits empty selectors and keeps template body unchanged', () => {
    assert.deepEqual(parseManualEmails(' a@b.ru, , c@d.ru '), ['a@b.ru', 'c@d.ru']);
    const body = '{{team_name}} <p>Body</p>';
    assert.deepEqual(buildMailingPayload({ subject: ' Subject ', body, selection_event_id: ' 3 ', selection_location_id: '', selection_league_id: '', selection_manual_emails: '' }), { subject: 'Subject', body, selection_event_id: 3 });
    assert.equal(renderPreviewTemplate('{{unknown_key}}'), '');
});

test('QR supports signed JWT and scanner URLs; base64 preserves unicode and rejects malformed input', () => {
    const uuid = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjF9.c2lnbmF0dXJl';
    assert.equal(extractUuidFromScannerPayload(uuid), uuid);
    assert.equal(extractUuidFromScannerPayload(`https://test.invalid/scanner?data=${uuid}`), uuid);
    assert.equal(extractUuidFromScannerPayload(`https://test.invalid/other?data=${uuid}`), null);
    assert.equal(extractUuidFromScannerPayload('kpi-team:4'), null);
    const value = 'Команда №1';
    assert.equal(decodeBase64Value(Buffer.from(value).toString('base64url')), value);
    assert.equal(decodeBase64Value('%%%'), null);
});

test('shared table sorting preserves numeric strings, nulls and three-state toggling', () => {
    assert.ok(compareValues('2', '10') < 0); assert.ok(compareValues(null, 0) < 0); assert.equal(compareValues(null, undefined), 0);
    assert.deepEqual(nextSort(null, 'name'), { key: 'name', direction: 'asc' });
    assert.deepEqual(nextSort({ key: 'name', direction: 'asc' }, 'name'), { key: 'name', direction: 'desc' });
    assert.equal(nextSort({ key: 'name', direction: 'desc' }, 'name'), null);
});

test('shared filtering combines column constraints and supports subject display labels', async () => {
    const { matchesColumnFilters } = await load('shared/lib/table.js');
    const row = { name: 'Команда А', status: 'PAID' }, columns = [{ key: 'name' }, { key: 'status' }];
    const display = (row, column) => column.key === 'status' ? 'Оплачена' : row.name;
    assert.equal(matchesColumnFilters(row, columns, { name: ' КОМАНДА ', status: 'оплач' }, display), true);
    assert.equal(matchesColumnFilters(row, columns, { name: 'Б', status: '' }, display), false);
    assert.equal(matchesColumnFilters(row, columns, {}, display), true);
});

test('URL filters have one source of truth, validate values and preserve unrelated navigation state', async () => {
    const { readUrlState, writeUrlState } = await load('shared/lib/urlState.js');
    const initial = new URLSearchParams('entity=users&events_view=table&users_q=Команда');
    assert.equal(readUrlState(initial, 'entity', 'events', ['events', 'users']), 'users');
    const changed = writeUrlState(initial, 'entity', 'events', 'events');
    assert.equal(changed.has('entity'), false);
    assert.equal(changed.get('events_view'), 'table');
    assert.equal(changed.get('users_q'), 'Команда');
    assert.equal(initial.get('entity'), 'users');
    assert.equal(readUrlState(new URLSearchParams('entity=invalid'), 'entity', 'events', ['events', 'users']), 'events');
    assert.equal(readUrlState(initial, 'entity', 'events', ['events', 'users']), 'users');
});
