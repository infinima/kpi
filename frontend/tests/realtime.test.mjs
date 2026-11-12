import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { createChannel } = await load('shared/realtime/channel.js');
const { decodeTable } = await load('entities/results/model/protocol.js');
const { decodeShow, timerSeconds } = await load('entities/show/model/protocol.js');

class FakeSocket {
    handlers = new Map(); emitted = []; connects = 0; disconnects = 0;
    on(event, handler) { const callbacks = this.handlers.get(event) ?? []; callbacks.push(handler); this.handlers.set(event, callbacks); }
    emit(event, ...args) { this.emitted.push([event, ...args]); }
    receive(event, ...args) { for (const handler of this.handlers.get(event) ?? []) handler(...args); }
    connect() { this.connects++; }
    disconnect() { this.disconnects++; }
    removeAllListeners() { this.handlers.clear(); }
}
const config = (leagueId, type = 'fudzi', token = 'session') => ({ leagueId, type, token, url: 'https://test.invalid' });
function setup(decode = (value) => value, events = ['data', 'table_data'], initialCommand = 'get_table') {
    const sockets = [], configs = [];
    const channel = createChannel((value) => { configs.push(value); const socket = new FakeSocket(); sockets.push(socket); return socket; }, decode, events, initialCommand);
    return { channel, sockets, configs };
}

test('explicit context reaches the factory; every connect/reconnect requests a fresh table', () => {
    const { channel, sockets, configs } = setup();
    channel.start(config(42));
    assert.deepEqual(configs, [config(42)]);
    assert.equal(sockets[0].connects, 1);
    assert.equal(channel.getSnapshot().connected, false);
    sockets[0].receive('connect');
    assert.equal(channel.getSnapshot().connected, true);
    sockets[0].receive('disconnect');
    assert.equal(channel.getSnapshot().connected, false);
    sockets[0].receive('connect');
    assert.deepEqual(sockets[0].emitted, [['get_table'], ['get_table']]);
    channel.stop();
});

test('switching league closes the previous connection, clears data and ignores late callbacks', () => {
    const { channel, sockets } = setup();
    channel.start(config(1));
    const staleData = sockets[0].handlers.get('data')[0];
    const staleConnect = sockets[0].handlers.get('connect')[0];
    sockets[0].receive('data', ['first']);
    channel.start(config(2, 'kvartaly', 'new-token'));
    assert.equal(sockets[0].disconnects, 1);
    assert.equal(sockets[0].handlers.size, 0);
    assert.deepEqual(channel.getSnapshot(), { data: null, connected: false, error: null });
    staleData(['late']); staleConnect();
    assert.equal(channel.getSnapshot().data, null);
    sockets[1].receive('table_data', ['second']);
    assert.deepEqual(channel.getSnapshot().data, ['second']);
    channel.stop();
});

test('cleanup prevents pending emissions and updates after unmount', () => {
    const { channel, sockets } = setup();
    channel.start(config(1));
    assert.equal(channel.send('fudzi_set_card', { team_id: 5, has_card: true }), false);
    sockets[0].receive('connect');
    assert.equal(channel.send('fudzi_set_card', { team_id: 5, has_card: true }), true);
    const staleError = sockets[0].handlers.get('connect_error')[0];
    channel.stop(); staleError(new Error('late'));
    assert.equal(channel.send('fudzi_set_card', { team_id: 5, has_card: false }), false);
    assert.deepEqual(channel.getSnapshot(), { data: null, connected: false, error: null });
    assert.deepEqual(sockets[0].emitted, [['get_table'], ['fudzi_set_card', { team_id: 5, has_card: true }]]);
});

test('show and table owners remain independent during scene changes', () => {
    const show = setup(decodeShow, ['data'], null);
    const table = setup();
    show.channel.start(config(1, 'show'));
    table.channel.start(config(1));
    show.sockets[0].receive('connect');
    show.sockets[0].receive('data', { status: 'FUDZI-RESULTS' });
    table.channel.stop();
    assert.equal(show.channel.getSnapshot().connected, true);
    assert.equal(show.sockets[0].disconnects, 0);
    assert.equal(show.channel.getSnapshot().data.status, 'FUDZI-RESULTS');
    show.channel.stop();
});

test('connection failures, server errors and malformed data are surfaced without destroying valid snapshots', () => {
    const { channel, sockets } = setup((value) => decodeTable(value, 'fudzi'));
    channel.start(config(1));
    sockets[0].receive('connect_error', new Error('offline'));
    assert.equal(channel.getSnapshot().error, 'offline');
    sockets[0].receive('connect');
    const data = [{ id: 1, name: 'Team', has_card: true, total: 1, penalty: 0, answers: [{ score: 1, status: 'correct' }] }];
    sockets[0].receive('data', data);
    sockets[0].receive('data', { bad: 'payload' });
    assert.match(channel.getSnapshot().error, /формат/);
    assert.deepEqual(channel.getSnapshot().data, data);
    sockets[0].receive('error_response', { error: { message: 'Wrong status' } });
    assert.equal(channel.getSnapshot().error, 'Wrong status');
    channel.stop();
});

test('subscribers can detach; stopping an idle channel is safe', () => {
    const { channel } = setup(); let count = 0;
    const detach = channel.subscribe(() => count++);
    channel.stop(); assert.equal(count, 1);
    detach(); channel.stop(); assert.equal(count, 1);
});

test('protocol adapters reject malformed game payloads and accept both stages', () => {
    assert.throws(() => decodeShow({ status: 'unknown' }));
    assert.throws(() => decodeTable([{ id: 1, name: 'A', answers: [{}] }], 'fudzi'));
    assert.throws(() => decodeTable([{ id: 1, name: 'A', quarters: [null] }], 'kvartaly'));
    const kvartaly = [{ id: 1, name: 'A', total: 0, penalty: 0, quarters: [{ finished: false, bonus: 0, total: 0, answers: [] }] }];
    assert.deepEqual(decodeTable(kvartaly, 'kvartaly'), kvartaly);
    assert.deepEqual(decodeShow({ status: 'WALLPAPER' }), { status: 'WALLPAPER' });
});

test('timer uses server offset and clamps completion, disabled and missing start times', () => {
    const show = { status: 'FUDZI-PRESENTATION', timer_is_enabled: true, timer_minutes: 2, timer_started_at: '2026-11-12T10:00:00Z', server_time: '2026-11-12T10:00:30Z' };
    const start = Date.parse(show.timer_started_at);
    assert.equal(timerSeconds(show, start + 35000, 5000), 90);
    assert.equal(timerSeconds(show, start + 1000000, 0), 0);
    assert.equal(timerSeconds({ ...show, timer_is_enabled: false }, start, 0), 0);
    assert.equal(timerSeconds({ ...show, timer_started_at: null }, start, 0), 120);
    assert.equal(timerSeconds({ ...show, server_time: undefined }, start + 60000, 0), 120);
});
