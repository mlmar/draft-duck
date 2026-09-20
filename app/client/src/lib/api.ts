import type { DraftProfile, RankedPlayer } from '@waiver-warrior/core';

// Thin POST /rank. The draft query owns loading and error UI.

const API_URL = import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3300';

export async function rankPlayers(profile: DraftProfile): Promise<RankedPlayer[]> {
    const response = await fetch(`${API_URL}/rank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
    });
    if (!response.ok) {
        throw new Error('Could not rank the board. Check that the API is running.');
    }
    const data: { players: RankedPlayer[] } = await response.json();
    return data.players;
}
