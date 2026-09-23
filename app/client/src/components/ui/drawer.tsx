import { cn } from '@/lib/utils';
import { Drawer as DrawerPrimitive } from 'vaul';

// Vaul drawer. Draft Settings is the only overlay in the app. Quiz must not import this.

function Drawer({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Root>) {
    return <DrawerPrimitive.Root data-slot='drawer' shouldScaleBackground={false} {...props} />;
}

function DrawerTrigger({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
    return <DrawerPrimitive.Trigger data-slot='drawer-trigger' {...props} />;
}

function DrawerPortal({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
    return <DrawerPrimitive.Portal data-slot='drawer-portal' {...props} />;
}

function DrawerClose({ ...props }: React.ComponentProps<typeof DrawerPrimitive.Close>) {
    return <DrawerPrimitive.Close data-slot='drawer-close' {...props} />;
}

function DrawerOverlay({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
    return (
        <DrawerPrimitive.Overlay
            data-slot='drawer-overlay'
            className={cn('fixed inset-0 z-50 bg-foreground/20', className)}
            {...props}
        />
    );
}

function DrawerContent({ className, children, ...props }: React.ComponentProps<typeof DrawerPrimitive.Content>) {
    return (
        <DrawerPortal>
            <DrawerOverlay />
            <DrawerPrimitive.Content
                data-slot='drawer-content'
                className={cn(
                    'fixed z-50 flex flex-col bg-card text-card-foreground',
                    'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-16 data-[vaul-drawer-direction=bottom]:max-h-[90dvh] data-[vaul-drawer-direction=bottom]:rounded-t-xl data-[vaul-drawer-direction=bottom]:border-t data-[vaul-drawer-direction=bottom]:border-border',
                    'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:h-full data-[vaul-drawer-direction=right]:w-[24rem] data-[vaul-drawer-direction=right]:max-w-[90vw] data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:border-border',
                    className
                )}
                {...props}
            >
                {children}
            </DrawerPrimitive.Content>
        </DrawerPortal>
    );
}

function DrawerTitle({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Title>) {
    return (
        <DrawerPrimitive.Title
            data-slot='drawer-title'
            className={cn('font-heading text-lg font-semibold', className)}
            {...props}
        />
    );
}

function DrawerDescription({ className, ...props }: React.ComponentProps<typeof DrawerPrimitive.Description>) {
    return (
        <DrawerPrimitive.Description
            data-slot='drawer-description'
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
}

export {
    Drawer,
    DrawerTrigger,
    DrawerPortal,
    DrawerClose,
    DrawerOverlay,
    DrawerContent,
    DrawerTitle,
    DrawerDescription
};
