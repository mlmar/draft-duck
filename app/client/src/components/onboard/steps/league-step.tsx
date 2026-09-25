import { ChoiceRow } from '@/components/onboard/choice-row';
import { SeatStrip } from '@/components/onboard/seat-strip';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { STANDARD_LEAGUE_SIZES, quizDraftToProfile, setDraftSlot, setLeagueSize, type QuizDraft } from '@/lib/quiz';
import { LEAGUE_SIZE_MAX, LEAGUE_SIZE_MIN, overallPicksForDraft } from '@draft-duck/core';

// League size, rounds, snake/linear, and pick slot on one screen. Slot is a lens, not a ranker input.

const LEAGUE_SIZES = STANDARD_LEAGUE_SIZES.map((value) => ({
    value,
    label: `${value} teams`
}));

const DRAFT_TYPES = [
    { value: 'snake' as const, label: 'Snake', description: 'Pick order flips each round' },
    { value: 'linear' as const, label: 'Linear', description: 'Same order every round' }
];

const OTHER_DEFAULT_SIZE = 16;

type LeagueStepProps = QuizStepProps & {
    // Quiz keeps a seat strip so first-run scan stays visual. Drawer uses a select so 20 chips do not wrap.
    slotControl?: 'chips' | 'select';
};

export function LeagueStep({ value, onChange, slotControl = 'chips' }: LeagueStepProps) {
    const isOtherSize = !(STANDARD_LEAGUE_SIZES as readonly number[]).includes(value.leagueSize);
    const slotOptions = Array.from({ length: value.leagueSize }, (_, index) => {
        const slot = index + 1;
        return { value: slot, label: String(slot) };
    });
    const caption = slotControl === 'chips' ? slotCaption(value) : null;

    return (
        <div className='grid gap-8'>
            <div className='grid gap-2'>
                <p className='mb-0 font-medium'>League size</p>
                <div className='flex flex-wrap gap-2'>
                    <ChoiceRow
                        className='contents'
                        value={isOtherSize ? undefined : value.leagueSize}
                        options={LEAGUE_SIZES}
                        onChange={(leagueSize) => onChange(setLeagueSize(value, leagueSize))}
                    />
                    <Button
                        type='button'
                        variant={isOtherSize ? 'default' : 'outline'}
                        aria-pressed={isOtherSize}
                        onClick={() => {
                            if (isOtherSize) return;
                            onChange(setLeagueSize(value, OTHER_DEFAULT_SIZE));
                        }}
                    >
                        Other
                    </Button>
                </div>
                {isOtherSize ? (
                    <div className='grid max-w-40 gap-2'>
                        <Label htmlFor='league-size-other'>Teams</Label>
                        <Input
                            id='league-size-other'
                            type='number'
                            min={LEAGUE_SIZE_MIN}
                            max={LEAGUE_SIZE_MAX}
                            step={2}
                            value={value.leagueSize}
                            onChange={(event) => {
                                const next = Number.parseInt(event.target.value, 10);
                                if (!Number.isFinite(next)) return;
                                onChange(setLeagueSize(value, next));
                            }}
                        />
                        <p className='mb-0 text-muted-foreground'>even numbers only</p>
                    </div>
                ) : null}
            </div>
            <div className='grid max-w-40 gap-2'>
                <Label htmlFor='draft-rounds'>Rounds</Label>
                <Input
                    id='draft-rounds'
                    type='number'
                    min={1}
                    step={1}
                    // 0 is invalid. Show empty so clearing does not leave a leading zero.
                    value={value.draftRounds || ''}
                    onChange={(event) =>
                        onChange({ ...value, draftRounds: Number.parseInt(event.target.value, 10) || 0 })
                    }
                />
            </div>
            <div className='grid gap-2'>
                <p className='mb-0 font-medium'>Draft type</p>
                <ChoiceRow
                    value={value.draftType}
                    options={DRAFT_TYPES}
                    onChange={(draftType) => onChange({ ...value, draftType })}
                />
            </div>
            <div className='grid gap-2'>
                <p className='mb-0 font-medium'>{slotControl === 'select' ? 'Your pick' : 'Your pick (optional)'}</p>
                {slotControl === 'select' ? (
                    <select
                        id='draft-slot'
                        className='h-11 w-full max-w-40 rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'
                        value={value.draftSlot ?? ''}
                        onChange={(event) =>
                            onChange(setDraftSlot(value, Number.parseInt(event.target.value, 10) || 0))
                        }
                    >
                        <option value=''>None</option>
                        {slotOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                ) : (
                    <SeatStrip
                        leagueSize={value.leagueSize}
                        draftSlot={value.draftSlot}
                        onChange={(draftSlot) => onChange(setDraftSlot(value, draftSlot))}
                    />
                )}
                {caption ? <p className='mb-0 text-muted-foreground'>{caption}</p> : null}
            </div>
        </div>
    );
}

function slotCaption(draft: QuizDraft): string | null {
    if (!draft.draftSlot) return null;
    if (draft.draftType === 'linear') return 'same seat every round.';
    const picks = overallPicksForDraft(quizDraftToProfile(draft)).slice(0, 3);
    if (picks.length === 0) return null;
    if (picks.length === 1) return `you go ${picks[0]}.`;
    if (picks.length === 2) return `you go ${picks[0]}, then ${picks[1]}.`;
    return `you go ${picks[0]}, then ${picks[1]}, then ${picks[2]}.`;
}
