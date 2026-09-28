import { WalkChoiceCards } from '@/components/onboard/walk-choice';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { walkQuestion } from '@draft-duck/core';

export function WalkStep({ value, questionId, onWalkAnswer }: QuizStepProps) {
    const id = questionId ?? value.walkQuestionIds?.[value.walkAnswers?.length ?? 0];
    const question = id ? walkQuestion(id) : undefined;
    if (!question) {
        return <p className='mb-0 text-muted-foreground'>No questions left for these categories.</p>;
    }

    return <WalkChoiceCards left={question.left} right={question.right} onPick={(side) => onWalkAnswer?.(side)} />;
}
