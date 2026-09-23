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

type LeagueStepProps = QuizStepProps & {
    // Quiz keeps chips so first-run scan does not change. Drawer uses a select so 14 chips do not wrap.
    slotControl?: 'chips' | 'select';
};

export function LeagueStep({ value, onChange, slotControl = 'chips' }: LeagueStepProps) {
    const slotOptions = Array.from({ length: value.leagueSize }, (_, index) => {
        const slot = index + 1;
        return { value: slot, label: String(slot) };
    });

    return (
        <div className='grid gap-8'>
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
                <Label htmlFor='draft-rounds'>Rounds</Label>
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
                    <ChoiceRow
                        value={value.draftSlot}
                        options={slotOptions}
                        onChange={(draftSlot) =>
                            // Clicking the selected chip clears it. Slot is optional.
                            onChange(setDraftSlot(value, draftSlot === value.draftSlot ? 0 : draftSlot))
                        }
                    />
                )}
            </div>
        </div>
    );
}
