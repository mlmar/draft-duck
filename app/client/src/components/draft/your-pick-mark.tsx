import { cn } from '@/lib/utils';

type YourPickMarkProps = {
    className?: string;
};

// Placeholder star. Swap the svg for a duck mark later without touching the table.
export function YourPickMark({ className }: YourPickMarkProps) {
    return (
        <svg
            viewBox='0 0 24 24'
            role='img'
            aria-label='Your pick'
            className={cn('size-4 shrink-0 text-foreground', className)}
        >
            <path
                fill='currentColor'
                d='M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
            />
        </svg>
    );
}
