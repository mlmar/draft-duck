import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setDraftSlot } from '@/lib/quiz';

// League size, rounds, snake/linear, and pick slot on one screen. Slot is a lens, not a ranker input.

const LEAGUE_SIZES = [
    { value: 8 as const, label: '8 teams' },
    { value: 10 as const, label: '10 teams' },
    { value: 12 as const, label: '12 teams' },
    { value: 14 as const, label: '14 teams' }
];

const DRAFT_TYPES = [
    { value: 'snake' as const, label: 'Snake', description: 'Pick order flips each round' },
    { value: 'linear' as const, label: 'Linear', description: 'Same order every round' }
];

export function LeagueStep({ value, onChange }: QuizStepProps) {
    const slotOptions = Array.from({ length: value.leagueSize }, (_, index) => {
        const slot = index + 1;
        return { value: slot, label: String(slot) };
    });

    return (
        <div className='grid gap-6'>
            <div className='grid gap-2'>
                <p className='mb-0 font-medium'>League size</p>
                <ChoiceRow
                    value={value.leagueSize}
                    options={LEAGUE_SIZES}
                    onChange={(leagueSize) => {
                        const draftSlot =
                            value.draftSlot && value.draftSlot > leagueSize ? leagueSize : value.draftSlot;
                        onChange({ ...value, leagueSize, draftSlot });
                    }}
                />
            </div>
            <div className='grid max-w-40 gap-2'>
                <Label htmlFor='draft-rounds'>Draft rounds</Label>
                <Input
                    id='draft-rounds'
                    type='number'
                    min={1}
                    step={1}
                    value={value.draftRounds}
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
                <p className='mb-0 font-medium'>Your pick (optional)</p>
                <ChoiceRow
                    value={value.draftSlot}
                    options={slotOptions}
                    onChange={(draftSlot) => onChange(setDraftSlot(value, draftSlot))}
                />
            </div>
        </div>
    );
}
