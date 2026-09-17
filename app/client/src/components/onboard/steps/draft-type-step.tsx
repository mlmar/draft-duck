import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';

// Snake vs linear. Ranking math does not change here. The choice is stored on the profile.

const DRAFT_TYPES = [
    { value: 'snake' as const, label: 'Snake', description: 'Pick order flips each round' },
    { value: 'linear' as const, label: 'Linear', description: 'Same order every round' }
];

export function DraftTypeStep({ value, onChange }: QuizStepProps) {
    return (
        <ChoiceRow
            value={value.draftType}
            options={DRAFT_TYPES}
            onChange={(draftType) => onChange({ ...value, draftType })}
        />
    );
}
