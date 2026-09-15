import type { PlayerSeason } from './types.ts';

// Anything that can hand us a season board. CSV today, maybe a live API later.
export type PlayerStatsProvider = {
    load(): Promise<PlayerSeason[]>;
};
