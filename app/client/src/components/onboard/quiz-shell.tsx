import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, LayoutList } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

// Quiet progress plus the question. Sticky Back / Continue. Copy and order stay in STEPS.

type QuizShellProps = {
    title: string;
    description?: string;
    stepIndex: number;
    stepCount: number;
    onBack?: () => void;
    onContinue?: () => void;
    continueLabel?: string;
    continueDisabled?: boolean;
    banner?: ReactNode;
    children: ReactNode;
};

export function QuizShell({
    title,
    description,
    stepIndex,
    stepCount,
    onBack,
    onContinue,
    continueLabel = 'Continue',
    continueDisabled = false,
    banner,
    children
}: QuizShellProps) {
    // First paint already sits at the current fraction. Turn on the ease after that so mount does not tween from empty.
    const [animateFill, setAnimateFill] = useState(false);
    useEffect(() => {
        setAnimateFill(true);
    }, []);

    const stepLabel = `Step ${stepIndex + 1} of ${stepCount}`;
    const fraction = (stepIndex + 1) / stepCount;
    const showFooter = Boolean(onBack || onContinue);

    return (
        <div className='flex min-h-[calc(100dvh-10rem)] flex-col'>
            <header className='grid gap-3'>
                {banner}
                <div
                    role='progressbar'
                    aria-valuenow={stepIndex + 1}
                    aria-valuemin={1}
                    aria-valuemax={stepCount}
                    aria-label={stepLabel}
                    className='h-1 w-full overflow-hidden rounded-lg bg-border'
                >
                    <div
                        className={cn(
                            'h-full w-full origin-left rounded-lg bg-primary',
                            animateFill && 'transition-transform duration-300 ease-out motion-reduce:transition-none'
                        )}
                        style={{ transform: `scaleX(${fraction})` }}
                    />
                </div>
                <h1 className='mt-3 mb-0 text-2xl font-semibold tracking-tight md:text-3xl'>{title}</h1>
                {description ? <p className='mb-0 text-muted-foreground'>{description}</p> : null}
            </header>

            <div className='pb-28'>{children}</div>

            {showFooter ? (
                <div className='fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <div className='mx-auto flex max-w-6xl items-center justify-between gap-4 md:px-4'>
                        {onBack ? (
                            <Button type='button' variant='outline' onClick={onBack} aria-label='Back'>
                                <ArrowLeft aria-hidden='true' /> Back
                            </Button>
                        ) : null}
                        {onContinue ? (
                            <Button
                                type='button'
                                onClick={onContinue}
                                disabled={continueDisabled}
                                size='lg'
                                className='ml-auto px-6'
                            >
                                {continueLabel.toLowerCase().includes('board') ? (
                                    <LayoutList aria-hidden='true' />
                                ) : null}
                                {continueLabel}
                                {!continueLabel.toLowerCase().includes('board') ? (
                                    <ArrowRight aria-hidden='true' />
                                ) : null}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
