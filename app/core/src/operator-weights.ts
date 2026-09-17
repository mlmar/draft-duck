import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { CAT_KEYS, type CatKey } from './types.ts';

const configPath = fileURLToPath(new URL('../config/category-weights.json', import.meta.url));

// Operator knobs. Edit the JSON to retune the board without a code change.
const raw = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, number>;

export const DEFAULT_OPERATOR_WEIGHTS: Record<CatKey, number> = Object.fromEntries(
    CAT_KEYS.map((cat) => [cat, raw[cat] ?? 1])
) as Record<CatKey, number>;
