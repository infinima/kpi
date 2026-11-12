import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export function importViolations(file, source) {
    const layer = file.split('/')[0];
    const allowedByLayer = {
        shared: ['shared'],
        entities: ['entities', 'shared'],
        pages: ['pages', 'entities', 'shared'],
        app: ['app', 'pages', 'entities', 'shared'],
    };
    const allowed = allowedByLayer[layer];
    if (!allowed) return [];
    const pure = file.startsWith('shared/api/') || file.startsWith('shared/realtime/') || file.startsWith('entities/permission/model/');
    const presentation = file.includes('/ui/') || file.endsWith('View.tsx');
    const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    const violations = [];

    function check(specifier) {
        let target;
        if (specifier.startsWith('@/')) target = specifier.slice(2);
        else if (specifier.startsWith('.')) {
            target = relative('/src', resolve('/src', dirname(file), specifier)).split(sep).join('/');
        }
        const targetLayer = target?.split('/')[0];
        const forbiddenExternal = /^(react(?:-dom)?|zustand)(?:\/|$)/.test(specifier);
        const forbiddenUI = target !== undefined && /^shared\/(ui|styles)(\/|$)/.test(target);
        const forbiddenPresentation = presentation && target && /(?:\/api(?:\/|\.|$)|entities\/session|shared\/model\/notifications)/.test(target);
        if ((target && !allowed.includes(targetLayer)) || (pure && (forbiddenExternal || forbiddenUI)) || forbiddenPresentation) {
            violations.push(`${file} → ${specifier}`);
        }
    }

    function visit(node) {
        if (layer === 'pages' && ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'fetch') {
            violations.push(`${file} → direct fetch (use an entity API)`);
        }
        if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
            check(node.moduleSpecifier.text);
        } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
            check(node.arguments[0].text);
        } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
            check(node.argument.literal.text);
        }
        ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    return violations;
}

async function sourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(entries.map((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(path) ? [path] : [];
    }));
    return nested.flat();
}

async function main() {
    const root = fileURLToPath(new URL('../src/', import.meta.url));
    const results = await Promise.all((await sourceFiles(root)).map(async (file) => importViolations(relative(root, file).split(sep).join('/'), await readFile(file, 'utf8'))));
    const violations = results.flat();
    if (violations.length) {
        console.error('Import boundaries violated:\n' + violations.join('\n'));
        process.exitCode = 1;
    } else console.log('Import boundaries passed (app → pages → entities → shared; presentation and transport rules).');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
