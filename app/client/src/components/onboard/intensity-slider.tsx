import type { CSSProperties } from 'react';
import { CAT_LABELS, formatTuner } from '@draft-duck/core';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export const INTENSITY_HINT = 'This number is the weight. Neutral is 1, Need is 1.5, 3 is more.';

type IntensitySliderProps = {
    id: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
};

export function IntensitySlider({ id, label, value, onChange, disabled = false }: IntensitySliderProps) {
    const progress = `${(Math.min(3, Math.max(0, value)) / 3) * 100}%`;

    // Vaul ignores drag gestures that begin inside this weight control.
    return (
        <div
            data-vaul-no-drag
            className={cn('grid gap-2 border-b border-border py-3 last:border-b-0', disabled && 'opacity-60')}
        >
            <div className='flex items-baseline justify-between gap-4'>
                <Label htmlFor={id}>{label}</Label>
                <output htmlFor={id} className='font-medium tabular-nums'>
                    {formatTuner(value)}
                </output>
            </div>
            <input
                id={id}
                type='range'
                min={0}
                max={3}
                step={0.05}
                value={value}
                disabled={disabled}
                onChange={(event) => onChange(Number(event.target.value))}
                style={{ '--slider-progress': progress } as CSSProperties}
                className='tuner-slider w-full disabled:cursor-not-allowed'
            />
            <div aria-hidden='true' className='flex justify-between text-sm text-muted-foreground'>
                <span>Less</span>
                <span>More</span>
            </div>
        </div>
    );
}
