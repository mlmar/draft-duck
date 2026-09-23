import { BuildCardFace, namedBuildCardClassName } from '@/components/onboard/build-card-face';
import type { QuizStepProps } from '@/components/onboard/step-types';
import { Button } from '@/components/ui/button';
import { applyArchetype } from '@/lib/quiz';
import { isNamedBuildVisible, NAMED_BUILD_IDS, type NamedBuildId } from '@draft-duck/core';

// How do you want to play. Named cards write a full stance map. Custom is a quieter last control.
// Tap applies the map and leaves; Continue is not on this screen.

export function PlayStep({ value, onChosen }: QuizStepProps) {
    const visible = NAMED_BUILD_IDS.filter((id) => isNamedBuildVisible(id, value.enabledCats));

    function select(id: NamedBuildId | 'custom') {
        onChosen?.(applyArchetype(value, id));
    }

    return (
        <div className='grid gap-4'>
            <div className='grid gap-2 md:grid-cols-2'>
                {visible.map((id) => {
                    const selected = value.archetypeId === id;
                    return (
                        <Button
                            key={id}
                            type='button'
                            variant={selected ? 'default' : 'outline'}
                            aria-pressed={selected}
                            onClick={() => select(id)}
                            className={namedBuildCardClassName}
                        >
                            <BuildCardFace id={id} enabledCats={value.enabledCats} />
                        </Button>
                    );
                })}
            </div>
            <Button
                type='button'
                variant={value.archetypeId === 'custom' ? 'default' : 'ghost'}
                aria-pressed={value.archetypeId === 'custom'}
                onClick={() => select('custom')}
                className='h-auto w-full justify-start px-4 py-2 md:w-auto'
            >
                Custom
            </Button>
        </div>
    );
}
