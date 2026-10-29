#!/usr/bin/env node
/**
 * Copies the API's OpenAPI document into `spec/openapi.json`, which `@flung.dev/sdk` is generated from. Pass the
 * document flung-app writes (`packages/sdk/openapi.json`), or nothing to read it from the running production API.
 *
 *   pnpm sync:openapi ../flung-app/packages/sdk/openapi.json
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const target = join(import.meta.dirname, '..', 'spec', 'openapi.json')
const source = process.argv[2]
const text = source === undefined ? await (await fetch('https://api.flung.dev/openapi.json')).text() : readFileSync(source, 'utf8')
const document = JSON.parse(text)
if (typeof document.openapi !== 'string' || typeof document.paths !== 'object') throw new Error('That is not an OpenAPI document.')
writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`)
process.stdout.write(`Wrote spec/openapi.json: ${Object.keys(document.paths).length} paths, version ${document.info?.version ?? 'unknown'}.\n`)
