import { z } from 'zod';
import { CAT_KEYS, type CatKey, type CatStance, type DraftProfile } from './types.ts';

const catKeySchema = z.enum(CAT_KEYS);
const catStanceSchema = z.enum(['need', 'neutral', 'punt']);

export const draftProfileSchema = z.object({
    leagueSize: z.union([z.literal(8), z.literal(10), z.literal(12), z.literal(14)]),
    draftRounds: z.number().int().positive(),
    draftType: z.enum(['snake', 'linear']),
    enabledCats: z.array(catKeySchema).min(1),
    stances: z.record(catKeySchema, catStanceSchema).default({}),
    intensity: z.record(catKeySchema, z.number().min(0).max(2)).optional()
});

export const rankRequestSchema = z.object({
    profile: draftProfileSchema
});

export type RankRequest = z.infer<typeof rankRequestSchema>;

// Stance multiplier before intensity: need 1.5, neutral 1, punt 0.
const STANCE_WEIGHT: Record<CatStance, number> = {
    need: 1.5,
    neutral: 1,
    punt: 0
};

// profile_w[c] = stanceWeight * (intensity[c] ?? 1). Missing stance on an enabled cat is neutral.
export function profileWeight(profile: DraftProfile, cat: CatKey): number {
    const stance = profile.stances[cat] ?? 'neutral';
    const intensity = profile.intensity?.[cat] ?? 1;
    return STANCE_WEIGHT[stance] * intensity;
}
