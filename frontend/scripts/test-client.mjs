import { mkdtemp, rm, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const output = await mkdtemp(join('node_modules', '.kpi-client-tests-'));
try {
    await writeFile(join(output, 'package.json'), '{"type":"module"}');
    const compile = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.client-tests.json', '--outDir', output], { stdio: 'inherit' });
    if (compile.status !== 0) process.exitCode = compile.status ?? 1;
    else {
        const selectedTests = process.argv.slice(2);
        const testFiles = selectedTests.length ? selectedTests : (await readdir('tests')).filter((name) => name.endsWith('.test.mjs')).map((name) => join('tests', name));
        const tests = spawnSync(process.execPath, ['--test', ...testFiles], { stdio: 'inherit', env: { ...process.env, KPI_CLIENT_TEST_OUTPUT: output } });
        process.exitCode = tests.status ?? 1;
    }
} finally {
    await rm(output, { recursive: true, force: true });
}
