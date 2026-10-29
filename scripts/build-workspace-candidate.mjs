#!/usr/bin/env node
// Regenerates feedback/proposals/PR-0002/candidate/js/workspace-geometry.js from src/ui/workspaceGeometry.ts:
// types stripped with node:module stripTypeScriptTypes, `export` removed, wrapped as a classic script that sets SummaWorkspace.
// scripts/test-workspace.mjs fails when the generated file drifts from the TypeScript.   node scripts/build-workspace-candidate.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const root = new URL('..', import.meta.url)
const src = readFileSync(new URL('src/ui/workspaceGeometry.ts', root), 'utf8')
const names = [...src.matchAll(/^export (?:const|function) (\w+)/gm)].map(m => m[1])
const js = stripTypeScriptTypes(src, { mode: 'strip' }).replace(/^export /gm, '')
const out = `/* Generated from src/ui/workspaceGeometry.ts (types stripped, wrapped as a classic script so examples work from file://).
   Regenerate: node scripts/build-workspace-candidate.mjs. scripts/test-workspace.mjs checks it matches the TypeScript. */
(function (root) {
${js.trimEnd()}

  root.SummaWorkspace = { ${names.join(', ')} };
})(typeof window !== "undefined" ? window : globalThis);
`
writeFileSync(new URL('feedback/proposals/PR-0002/candidate/js/workspace-geometry.js', root), out)
console.log(`wrote candidate/js/workspace-geometry.js (${names.length} exports)`)
