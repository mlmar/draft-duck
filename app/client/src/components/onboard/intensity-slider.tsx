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
    return (
        <div className={cn('grid gap-2', disabled && 'opacity-50')}>
            <div className='flex items-baseline justify-between gap-4'>
                <Label htmlFor={id}>{label}</Label>
                <span className='text-muted-foreground'>{formatTuner(value)}</span>
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
                className='w-full accent-brand disabled:cursor-not-allowed'
            />
            <div className='flex justify-between text-muted-foreground'>
                <span>Less</span>
                <span>More</span>
            </div>
        </div>
    );
}
