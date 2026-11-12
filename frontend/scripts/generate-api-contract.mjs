import { readFile, writeFile } from 'node:fs/promises';
const spec = JSON.parse(await readFile(new URL('../openapi.json', import.meta.url), 'utf8'));
function type(schema) {
    if (schema.$ref) return schema.$ref.split('/').at(-1);
    if (schema.enum) return schema.enum.map(value => JSON.stringify(value)).join(' | ');
    if (schema.anyOf) return schema.anyOf.map(type).join(' | ');
    if (schema.type === 'array') return `(${type(schema.items)})[]`;
    if (schema.type === 'object') return `{ ${Object.entries(schema.properties ?? {}).map(([key, value]) => `${JSON.stringify(key)}${schema.required?.includes(key) ? '' : '?'}: ${type(value)};`).join(' ')} }`;
    return { integer:'number', number:'number', string:'string', boolean:'boolean', null:'null' }[schema.type] ?? 'unknown';
}
await writeFile(new URL('../src/shared/api/schema.ts', import.meta.url), '// Generated from openapi.json. Do not edit by hand.\n' + Object.entries(spec.components.schemas).map(([name, schema]) => `export type ${name} = ${type(schema)};`).join('\n')+'\n');
const routes = [];
for (const [path, methods] of Object.entries(spec.paths)) for (const [method, operation] of Object.entries(methods)) {
    const pattern = path.slice(1).replace(/\{([^}]+)\}/g, (_, name) => operation.parameters?.find(parameter => parameter.in === 'path' && parameter.name === name)?.schema.type === 'integer' ? '\\d+' : '[^/]+').replaceAll('/', '\\/');
    routes.push(`    ["${method.toUpperCase()}", /^${pattern}$/],`);
}
await writeFile(new URL('../src/shared/api/devContract.ts', import.meta.url), `// Generated from openapi.json. Do not edit by hand.
const routes: readonly (readonly [string, RegExp])[] = [
${routes.join('\n')}
];
export function supportsDevRequest(method: string, path: string): boolean {
    return routes.some(([verb, pattern]) => verb === method && pattern.test(path.split("?")[0]));
}
`);
