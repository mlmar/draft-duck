import { cn } from '@/lib/utils';
import type { WalkChoice, WalkChoiceId } from '@draft-duck/core';

type WalkChoiceCardsProps = {
    left: WalkChoice;
    right: WalkChoice;
    selected?: WalkChoiceId | null;
    onPick: (side: WalkChoiceId) => void;
};

// Two ink cards with lowercase or between them. Stack until desktop width.
export function WalkChoiceCards({ left, right, selected, onPick }: WalkChoiceCardsProps) {
    return (
        <div className='flex flex-col items-stretch gap-3 lg:flex-row lg:items-stretch lg:gap-4'>
            <WalkCard choice={left} pressed={selected === 'left'} onPick={onPick} />
            <span className='self-center text-muted-foreground' aria-hidden='true'>
                or
            </span>
            <WalkCard choice={right} pressed={selected === 'right'} onPick={onPick} />
        </div>
    );
}

function WalkCard({
    choice,
    pressed,
    onPick
}: {
    choice: WalkChoice;
    pressed: boolean;
    onPick: (side: WalkChoiceId) => void;
}) {
    return (
        <button
            type='button'
            aria-pressed={pressed}
            onClick={() => onPick(choice.id)}
            className={cn(
                'flex min-h-11 flex-1 items-center justify-center rounded-lg bg-primary px-6 py-8 text-center text-lg font-medium text-primary-foreground outline-none',
                'focus-visible:ring-3 focus-visible:ring-ring/50',
                pressed && 'opacity-90'
            )}
        >
            {choice.label}
        </button>
    );
}
