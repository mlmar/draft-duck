import { z } from 'zod';
import { resolveTuner } from './tuners.ts';
import { ARCHETYPE_IDS, CAT_KEYS, DATA_MODES, type CatKey, type DraftProfile } from './types.ts';

const catKeySchema = z.enum(CAT_KEYS);
const catStanceSchema = z.enum(['need', 'neutral', 'punt', 'custom']);

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
        dataMode: z.enum(DATA_MODES).default('perGame'),
        enabledCats: z.array(catKeySchema).min(1),
        stances: z.record(catKeySchema, catStanceSchema).default({}),
        intensity: z.record(catKeySchema, z.number().min(0).max(3)).optional(),
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

// profile_w[c] = tuner[c]. Missing intensity uses the stance preset (Need 1.5, Neutral 1 or 1.25, Punt 0).
export function profileWeight(profile: DraftProfile, cat: CatKey): number {
    return resolveTuner(profile, cat);
}
