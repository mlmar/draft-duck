import { Button } from '@/components/ui/button';
import { useState, type ReactNode } from 'react';

type ExpandSectionProps = {
    label: string;
    children: ReactNode;
    defaultOpen?: boolean;
};

// In-place expand so Review and the draft drawer do not open overlays.
export function ExpandSection({ label, children, defaultOpen = false }: ExpandSectionProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div>
            <Button
                type='button'
                variant='ghost'
                className='h-auto px-0 py-2'
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
            >
                {label}
            </Button>
            {open ? <div className='mt-4'>{children}</div> : null}
        </div>
    );
}
