import { Button, buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

type LinkButtonProps = {
    href: string;
    children: ReactNode;
} & VariantProps<typeof buttonVariants>;

// Slot only clones React elements. An Astro `<a>` is not one, so asChild has to live in this wrapper.
export function LinkButton({ href, children, variant, size }: LinkButtonProps) {
    return (
        <Button asChild variant={variant} size={size}>
            <a href={href}>{children}</a>
        </Button>
    );
}
