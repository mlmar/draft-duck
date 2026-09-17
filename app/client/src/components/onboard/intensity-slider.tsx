import { Label } from '@/components/ui/label';

// Native 0-2 range for one category. Less / More are labels. The number is what gets saved.

type IntensitySliderProps = {
    id: string;
    label: string;
    value: number;
    onChange: (value: number) => void;
};

export function IntensitySlider({ id, label, value, onChange }: IntensitySliderProps) {
    return (
        <div className='grid gap-2'>
            <div className='flex items-baseline justify-between gap-4'>
                <Label htmlFor={id}>{label}</Label>
                <span className='text-muted-foreground'>{value.toFixed(1)}</span>
            </div>
            <input
                id={id}
                type='range'
                min={0}
                max={2}
                step={0.1}
                value={value}
                onChange={(event) => onChange(Number(event.target.value))}
                className='w-full accent-primary'
            />
            <div className='flex justify-between text-muted-foreground'>
                <span>Less</span>
                <span>More</span>
            </div>
        </div>
    );
}
