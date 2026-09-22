import { Button, buttonVariants } from '@/components/ui/button';
import { createLink } from '@tanstack/react-router';
import type { VariantProps } from 'class-variance-authority';
import { forwardRef, type AnchorHTMLAttributes } from 'react';

type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & VariantProps<typeof buttonVariants>;

// Host is an <a> so createLink can attach href and the Button styles still apply.
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(({ variant, size, ...props }, ref) => {
    return (
        <Button asChild variant={variant} size={size}>
            <a ref={ref} {...props} />
        </Button>
    );
});
ButtonLink.displayName = 'ButtonLink';

export const LinkButton = createLink(ButtonLink);
