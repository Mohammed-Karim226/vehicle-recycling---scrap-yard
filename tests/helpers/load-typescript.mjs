import fs from 'node:fs';
import path from 'node:path';
import Module from 'node:module';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Compile the real server module in memory while replacing its external boundaries.
// This keeps tests offline and avoids running Next.js or connecting to a database.
export function loadTypeScriptModule(relativePath, overrides = {}) {
  const projectRoot = path.resolve(fileURLToPath(new URL('../../', import.meta.url)));
  const filename = path.resolve(projectRoot, relativePath);
  if (!filename.startsWith(projectRoot + path.sep)) throw new Error('Test module must be in the workspace');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    fileName: filename,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const instance = new Module(filename);
  instance.filename = filename;
  instance.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = instance.require.bind(instance);
  instance.require = (specifier) => {
    if (Object.hasOwn(overrides, specifier)) return overrides[specifier];
    if (specifier === 'server-only') return {};
    return originalRequire(specifier);
  };
  instance._compile(compiled, filename);
  return instance.exports;
}
