import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// League size chips plus draft rounds. Continue stays off until rounds is a positive integer.

const LEAGUE_SIZES = [
    { value: 8 as const, label: '8 teams' },
    { value: 10 as const, label: '10 teams' },
    { value: 12 as const, label: '12 teams' },
    { value: 14 as const, label: '14 teams' }
];

export function LeagueStep({ value, onChange }: QuizStepProps) {
    return (
        <div className='grid gap-6'>
            <div className='grid gap-2'>
                <p className='mb-0 font-medium'>League size</p>
                <ChoiceRow
                    value={value.leagueSize}
                    options={LEAGUE_SIZES}
                    onChange={(leagueSize) => onChange({ ...value, leagueSize })}
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
        </div>
    );
}
