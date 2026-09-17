import { CAT_KEYS, type CatKey } from './types.ts';
import raw from '../config/category-weights.json' with { type: 'json' };

// Operator knobs. Edit the JSON to retune the board without a code change.
export const DEFAULT_OPERATOR_WEIGHTS: Record<CatKey, number> = Object.fromEntries(
    CAT_KEYS.map((cat) => [cat, raw[cat] ?? 1])
) as Record<CatKey, number>;
