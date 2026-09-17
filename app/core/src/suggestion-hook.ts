import type { RankedPlayer } from './types.ts';

// Post-rank, display-only. Annotators may set notes. They must not change composite, rank, or order.
export type SuggestionHook = {
    annotate(players: RankedPlayer[]): RankedPlayer[];
};

// Pass-through so the pipeline always ends in annotate. Later annotators add notes here, not z-score math.
export const identitySuggestionHook: SuggestionHook = {
    annotate(players) {
        return players;
    }
};
