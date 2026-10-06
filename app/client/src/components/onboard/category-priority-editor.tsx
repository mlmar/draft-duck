import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { IntensitySlider } from '@/components/onboard/intensity-slider';
import { setCatStance, setCatTuner, type QuizDraft } from '@/lib/quiz';
import { CAT_LABELS, formatTuner, resolveTuner, type CatKey } from '@draft-duck/core';

const presets = ['punt', 'neutral', 'need'] as const;

export function CategoryPriorityEditor({ value, onChange }: { value: QuizDraft; onChange: (next: QuizDraft) => void }) {
    const id = useId();
    const [expanded, setExpanded] = useState<Partial<Record<CatKey, boolean>>>({});
    return (
        <div className='grid'>
            <p className='mb-2 text-sm text-muted-foreground'>
                Choose a priority to set its weight, or fine-tune a category. Changes apply when you select Apply.
            </p>
            {value.enabledCats.map((cat) => {
                const stance = value.stances[cat] ?? 'neutral';
                const weight = resolveTuner(value, cat);
                const precise = expanded[cat] ?? stance === 'custom';
                return (
                    <section
                        key={cat}
                        aria-label={`${CAT_LABELS[cat]} priority`}
                        className='grid gap-2 border-b border-border py-4 last:border-b-0'
                    >
                        <div className='flex items-center justify-between gap-3'>
                            <div className='grid gap-1'>
                                <h3 className='mb-0 text-base font-semibold'>{CAT_LABELS[cat]}</h3>
                                <span className='text-sm tabular-nums text-muted-foreground'>
                                    {stance === 'custom' ? 'Custom · ' : ''}Weight {formatTuner(weight)}
                                </span>
                            </div>
                            <Button
                                type='button'
                                variant='secondary'
                                className='shrink-0 text-muted-foreground'
                                aria-label={
                                    precise ? `Use presets for ${CAT_LABELS[cat]}` : `Fine-tune ${CAT_LABELS[cat]}`
                                }
                                aria-expanded={precise}
                                onClick={() => setExpanded((current) => ({ ...current, [cat]: !precise }))}
                            >
                                {precise ? 'Use presets' : `Fine-tune ${CAT_LABELS[cat]}`}
                            </Button>
                        </div>
                        {stance === 'neutral' && weight === 1.25 ? (
                            <p className='mb-0 text-sm text-muted-foreground'>
                                Boosted to complement your punted categories.
                            </p>
                        ) : null}
                        {precise ? (
                            <>
                                <IntensitySlider
                                    id={`${id}-${cat}`}
                                    label={`${CAT_LABELS[cat]} weight`}
                                    showHeading={false}
                                    value={weight}
                                    onChange={(next) => onChange(setCatTuner(value, cat, next))}
                                />
                            </>
                        ) : (
                            <>
                                <div
                                    role='group'
                                    aria-label={`${CAT_LABELS[cat]} priority presets`}
                                    className='grid grid-cols-3 gap-1'
                                >
                                    {presets.map((preset) => (
                                        <Button
                                            key={preset}
                                            type='button'
                                            variant={stance === preset ? 'default' : 'outline'}
                                            aria-pressed={stance === preset}
                                            className='w-full px-2'
                                            onClick={() => onChange(setCatStance(value, cat, preset))}
                                        >
                                            {preset === 'punt' ? 'Punt' : preset === 'need' ? 'Need' : 'Neutral'}
                                        </Button>
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
