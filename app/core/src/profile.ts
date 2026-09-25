import { z } from 'zod';
import { ARCHETYPE_IDS, CAT_KEYS, type CatKey, type CatStance, type DraftProfile } from './types.ts';

const catKeySchema = z.enum(CAT_KEYS);
const catStanceSchema = z.enum(['need', 'neutral', 'punt']);

export const LEAGUE_SIZE_MIN = 4;
export const LEAGUE_SIZE_MAX = 20;

export const draftProfileSchema = z
    .object({
        // Even 4-20. Old 8/10/12/14 profiles still parse.
        leagueSize: z
            .number()
            .int()
            .min(LEAGUE_SIZE_MIN)
            .max(LEAGUE_SIZE_MAX)
            .refine((n) => n % 2 === 0, { message: 'leagueSize must be even' }),
        draftRounds: z.number().int().positive(),
        draftType: z.enum(['snake', 'linear']),
        enabledCats: z.array(catKeySchema).min(1),
        stances: z.record(catKeySchema, catStanceSchema).default({}),
        intensity: z.record(catKeySchema, z.number().min(0).max(2)).optional(),
        draftSlot: z.number().int().min(1).optional(),
        archetypeId: z.enum(ARCHETYPE_IDS).optional()
    })
    .superRefine((profile, ctx) => {
        if (profile.draftSlot !== undefined && profile.draftSlot > profile.leagueSize) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'draftSlot cannot exceed leagueSize',
                path: ['draftSlot']
            });
        }
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
