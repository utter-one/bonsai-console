/**
 * patch-contracts.js
 *
 * Applies post-generation patches to src/api/generated/data-contracts.ts.
 *
 * swagger-typescript-api does not correctly translate `nullable: true` combined
 * with `oneOf` into `| null` in TypeScript union types. This script fixes those
 * cases after every codegen run so manual edits are never needed.
 *
 * To add a new patch, push an entry into the PATCHES array.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = resolve(__dirname, '../src/api/generated/data-contracts.ts');

// Each patch is { description, from, to }.
// `from` is matched literally (no regex). Patches are idempotent: if `from`
// is not found the patch is skipped (assumes it was already applied or the
// generated code changed structure).
const PATCHES = [
  {
    description: 'UpdateAgentRequest.ttsSettings — add | null (oneOf + nullable: true)',
    from: `  /** Updated TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings;`,
    to: `  /** Updated TTS provider-specific settings */
  ttsSettings?:
    | ElevenLabsTtsSettings
    | OpenAiTtsSettings
    | DeepgramTtsSettings
    | CartesiaTtsSettings
    | AzureTtsSettings
    | AmazonPollyTtsSettings
    | null;`,
  },
];

let source = readFileSync(CONTRACT_PATH, 'utf-8');
let changed = false;

for (const patch of PATCHES) {
  if (source.includes(patch.to)) {
    console.log(`⏭  Already applied: ${patch.description}`);
    continue;
  }
  if (!source.includes(patch.from)) {
    console.warn(`⚠️  Patch target not found (structure may have changed): ${patch.description}`);
    continue;
  }
  source = source.replace(patch.from, patch.to);
  changed = true;
  console.log(`✅ Applied: ${patch.description}`);
}

if (changed) {
  writeFileSync(CONTRACT_PATH, source, 'utf-8');
  console.log('📝 data-contracts.ts updated.');
} else {
  console.log('✔  No changes needed.');
}
