import { Button } from '@/components/ui/button';

type SeatStripProps = {
    leagueSize: number;
    draftSlot?: number;
    onChange: (draftSlot: number) => void;
};

// Quiz pick control. One seat per team. Selected is ink. Tap again to clear.
export function SeatStrip({ leagueSize, draftSlot, onChange }: SeatStripProps) {
    const seats = Array.from({ length: leagueSize }, (_, index) => index + 1);

    return (
        <div role='radiogroup' aria-label='Your pick' className='flex flex-wrap gap-2'>
            {seats.map((slot) => {
                const selected = slot === draftSlot;
                return (
                    <Button
                        key={slot}
                        type='button'
                        role='radio'
                        aria-checked={selected}
                        variant={selected ? 'default' : 'outline'}
                        className='size-11 px-0'
                        onClick={() => onChange(selected ? 0 : slot)}
                    >
                        {slot}
                    </Button>
                );
            })}
        </div>
    );
}
