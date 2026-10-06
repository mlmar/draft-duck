import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerTitle,
    DrawerTrigger
} from '@/components/ui/drawer';
import { ListFilter } from 'lucide-react';
import type { ReactNode } from 'react';

export function BoardViewDrawer({ children }: { children: ReactNode }) {
    return (
        <Drawer direction='bottom'>
            <DrawerTrigger asChild>
                <Button type='button' variant='outline' size='icon' aria-label='View options'>
                    <ListFilter aria-hidden='true' />
                </Button>
            </DrawerTrigger>
            <DrawerContent className='data-[vaul-drawer-direction=bottom]:h-auto'>
                <div className='grid gap-1 border-b border-border px-5 py-4'>
                    <DrawerTitle>Board view</DrawerTitle>
                    <DrawerDescription>Choose which players and statistics to show.</DrawerDescription>
                </div>
                <div className='min-h-0 overflow-y-auto px-5 py-6 [&>div]:grid [&>div]:w-full [&_button]:w-full [&_select]:w-full [&_[role=group]]:grid [&_[role=group]]:grid-cols-2 [&_[role=group]]:w-full'>
                    {children}
                </div>
                <div className='border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <DrawerClose asChild>
                        <Button type='button' className='w-full'>
                            Done
                        </Button>
                    </DrawerClose>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
