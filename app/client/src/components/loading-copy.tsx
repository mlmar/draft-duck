import { cn } from '@/lib/utils';

type LoadingCopyProps = {
    className?: string;
};

// Pulse so a wait does not look like a frozen page. motion-reduce keeps the word still.
export function LoadingCopy({ className }: LoadingCopyProps) {
    return (
        <p className={cn('mb-0 animate-pulse text-center text-muted-foreground motion-reduce:animate-none', className)}>
            quacking
        </p>
    );
}
