import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Shared chip row for league size, draft type, presets, stances, and the build pair.
// Pass selected() when more than one chip can be on at once (custom cats).

export type Choice<T extends string | number> = {
    value: T;
    label: string;
    description?: string;
};

type ChoiceRowProps<T extends string | number> = {
    value: T | undefined;
    options: Choice<T>[];
    onChange: (value: T) => void;
    className?: string;
    selected?: (value: T) => boolean;
};

export function ChoiceRow<T extends string | number>({
    value,
    options,
    onChange,
    className,
    selected
}: ChoiceRowProps<T>) {
    // Described chips need a full-width stack on a phone. Bare labels can wrap as a chip row.
    const hasDescriptions = options.some((option) => option.description);

    return (
        <div
            className={cn(
                hasDescriptions ? 'flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap' : 'flex flex-wrap gap-2',
                className
            )}
        >
            {options.map((option) => {
                const isSelected = selected ? selected(option.value) : option.value === value;
                return (
                    <Button
                        key={String(option.value)}
                        type='button'
                        variant={isSelected ? 'default' : 'outline'}
                        onClick={() => onChange(option.value)}
                        className={
                            option.description
                                ? 'h-auto w-full flex-col items-start gap-1 whitespace-normal py-3 text-left sm:w-auto'
                                : undefined
                        }
                    >
                        <span>{option.label}</span>
                        {option.description ? (
                            <span
                                className={
                                    isSelected
                                        ? 'font-normal text-primary-foreground/80'
                                        : 'font-normal text-muted-foreground'
                                }
                            >
                                {option.description}
                            </span>
                        ) : null}
                    </Button>
                );
            })}
        </div>
    );
}
