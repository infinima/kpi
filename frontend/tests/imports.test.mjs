import { test } from 'node:test';
import assert from 'node:assert/strict';
import { importViolations } from '../scripts/check-imports.mjs';

test('new layers allow dependencies toward shared and within their own layer', () => {
    assert.deepEqual(importViolations('shared/api/client.ts', 'import { helper } from "../lib/helper";'), []);
    assert.deepEqual(importViolations('entities/event/api.ts', 'import { request } from "@/shared/api/client";'), []);
    assert.deepEqual(importViolations('app/configureApi.ts', 'import { request } from "@/shared/api/request";'), []);
});

test('boundaries reject dependencies on pages, app, stores and UI from pure models/transport', () => {
    for (const dependency of ['@/pages/HomePage', '@/app/configureApi', '@/store', '@/shared/ui/Button', 'react', 'react-dom/client', 'zustand']) {
        for (const file of ['shared/api/client.ts', 'entities/permission/model/permissions.ts']) {
            assert.equal(importViolations(file, `import { value } from "${dependency}";`).length, 1, `${file} -> ${dependency}`);
        }
    }
    assert.equal(importViolations('entities/event/api.ts', 'export * from "../../pages/HomePage";').length, 1);
    assert.equal(importViolations('pages/auth/model.ts', 'import { app } from "@/app/configureApi";').length, 1);
});

test('re-exports, dynamic imports and import types respect the same boundaries', () => {
    const source = `export * from "@/pages/HomePage";
        const page = import("../../pages/HomePage");
        type Store = import("@/store").Store;`;
    assert.equal(importViolations('shared/api/client.ts', source).length, 3);
    assert.deepEqual(importViolations('shared/api/client.ts', '// import { user } from "@/store";'), []);
});


test('presentations do not call network/session APIs and pages cannot call fetch directly', () => {
    assert.equal(importViolations('pages/event/ui/EventsView.tsx', 'import { eventApi } from "@/entities/event/api/eventApi";').length, 1);
    assert.equal(importViolations('pages/account/ui/ProfileView.tsx', 'import { useUser } from "@/entities/session/model/session";').length, 1);
    assert.equal(importViolations('pages/auth/model/useAuth.ts', 'const value = fetch("/api/auth");').length, 1);
    assert.deepEqual(importViolations('pages/event/ui/EventsView.tsx', 'import type { Event } from "@/entities/event/model/event";'), []);
});
