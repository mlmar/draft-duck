import type { DraftProfile, PlayerSeason, RankedPlayer } from '@draft-duck/core';

// Thin POST /rank. The draft query owns loading and error UI.

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3300';

export async function rankPlayers(profile: DraftProfile): Promise<RankedPlayer[]> {
    const response = await fetch(`${API_URL}/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
    });
    if (!response.ok) {
        throw new Error('Could not rank the board. Try again in a moment.');
    }
    const data: { players: RankedPlayer[] } = await response.json();
    return data.players;
}

/** Load the fixed per-game CSV player universe used by the Team Lab comparison. */
export async function loadPlayers(): Promise<PlayerSeason[]> {
    // Keep player lookup on the existing endpoint so Team Lab does not introduce a backend contract.
    const response = await fetch(`${API_URL}/players`);
    if (!response.ok) throw new Error('Could not load players. Try again in a moment.');
    const data: { players: PlayerSeason[] } = await response.json();
    return data.players;
}
