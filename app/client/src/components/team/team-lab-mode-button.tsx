import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';

/** Keep Team Lab toggles consistent with the Draft Board selector and easy to use by touch. */
export function TeamLabModeButton({
    active,
    onClick,
    children
}: {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
}) {
    return (
        <Button
            type='button'
            variant={active ? 'secondary' : 'ghost'}
            aria-pressed={active}
            onClick={onClick}
            className='min-h-10 w-full'
        >
            {children}
        </Button>
    );
}
