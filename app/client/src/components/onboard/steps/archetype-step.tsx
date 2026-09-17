import { ChoiceRow } from '@/components/onboard/choice-row';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { applyArchetypeNudge, type ArchetypeChoice } from '@/lib/quiz';

// Optional one-tap nudge. Stocks or Points marks matching cats Need unless they are already Punt.

const ARCHETYPES: { value: ArchetypeChoice; label: string; description: string }[] = [
    { value: 'stocks', label: 'Stocks', description: 'Need steals and blocks' },
    { value: 'points', label: 'Points', description: 'Need scoring' }
];

export function ArchetypeStep({ value, onChange }: QuizStepProps) {
    return (
        <ChoiceRow
            value={value.archetype ?? undefined}
            options={ARCHETYPES}
            onChange={(choice) => onChange(applyArchetypeNudge(value, choice))}
        />
    );
}
