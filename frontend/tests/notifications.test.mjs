import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';
const load = (file) => import(pathToFileURL(join(process.env.KPI_CLIENT_TEST_OUTPUT, file)));
const { useNotifications } = await load('shared/model/notifications.js');
const { confirmWithNotification } = await load('shared/lib/confirmWithNotification.js');

test('closing a confirmation resolves cancellation instead of leaving a pending action', async () => {
    const confirmation = confirmWithNotification({ text: 'Delete?' });
    const message = useNotifications.getState().messages[0];
    assert.equal(message.duration, null);
    useNotifications.getState().removeMessage(message.id);
    assert.equal(await confirmation, false);
});

test('confirming an action is not overridden by subsequent notification removal', async () => {
    const confirmation = confirmWithNotification({ text: 'Delete?' });
    const message = useNotifications.getState().messages[0];
    message.action(); useNotifications.getState().removeMessage(message.id);
    assert.equal(await confirmation, true);
});

test('clearing notifications cancels all pending confirmations', async () => {
    const first = confirmWithNotification({ text: 'One' }), second = confirmWithNotification({ text: 'Two' });
    useNotifications.getState().clearAll();
    assert.deepEqual(await Promise.all([first, second]), [false, false]);
});
