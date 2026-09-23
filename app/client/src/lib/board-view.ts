const KEY = 'dd.boardView';

export type BoardView = 'simple' | 'full';

export function readBoardView(): BoardView | null {
    try {
        const value = sessionStorage.getItem(KEY);
        return value === 'simple' || value === 'full' ? value : null;
    } catch {
        return null;
    }
}

export function writeBoardView(view: BoardView): void {
    try {
        sessionStorage.setItem(KEY, view);
    } catch {
        // Private mode can throw. View still works for this visit.
    }
}
