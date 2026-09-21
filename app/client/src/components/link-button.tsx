import { Button, buttonVariants } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';

type LinkButtonProps = {
    to: '/' | '/onboard' | '/draft' | '/about' | '/how-it-works';
    search?: { assist?: '1'; values?: 'pm' };
    children: ReactNode;
} & VariantProps<typeof buttonVariants>;

export function LinkButton({ to, search, children, variant, size }: LinkButtonProps) {
    return (
        <Button asChild variant={variant} size={size}>
            <Link to={to} search={search}>
                {children}
            </Link>
        </Button>
    );
}
