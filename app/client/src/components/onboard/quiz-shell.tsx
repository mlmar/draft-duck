import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
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
        <div className='flex min-h-[calc(100dvh-2rem)] flex-col'>
            <header className='grid gap-3'>
                {banner}
                <div
                    role='progressbar'
                    aria-valuenow={stepIndex + 1}
                    aria-valuemin={1}
                    aria-valuemax={stepCount}
                    aria-label={stepLabel}
                    className='h-2 w-full overflow-hidden rounded-lg bg-muted'
                >
                    <div
                        className={cn(
                            'h-full w-full origin-left rounded-lg bg-primary',
                            animateFill && 'transition-transform duration-300 ease-out motion-reduce:transition-none'
                        )}
                        style={{ transform: `scaleX(${fraction})` }}
                    />
                </div>
                <h1 className='mb-0 text-xl font-semibold tracking-tight md:text-2xl'>{title}</h1>
                {description ? <p className='mb-0 text-muted-foreground'>{description}</p> : null}
            </header>

            <div className='pt-0 pb-24'>{children}</div>

            {showFooter ? (
                <div className='fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <div className='grid grid-cols-3 items-center gap-2'>
                        {onBack ? (
                            <Button type='button' variant='outline' size='icon' onClick={onBack} aria-label='Back'>
                                <ArrowLeft aria-hidden='true' />
                            </Button>
                        ) : null}
                        {onContinue ? (
                            <Button
                                type='button'
                                onClick={onContinue}
                                disabled={continueDisabled}
                                size='lg'
                                className='col-start-2 justify-self-center px-8 text-lg'
                            >
                                {continueLabel}
                            </Button>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
