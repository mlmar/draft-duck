import { ProfileSettings } from '@/components/draft/profile-settings';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { QuizDraft } from '@/lib/quiz';
import { X } from 'lucide-react';

type SettingsDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: QuizDraft;
    onChange: (next: QuizDraft) => void;
    onIntensityChange: (next: QuizDraft) => void;
    updating: boolean;
};

// Phone is a bottom sheet. Desktop is a side sheet so the grid stays visible.
export function SettingsDrawer({
    open,
    onOpenChange,
    value,
    onChange,
    onIntensityChange,
    updating
}: SettingsDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? 'right' : 'bottom'}>
            <DrawerContent id='draft-settings' aria-labelledby='draft-settings-title'>
                <div className='flex items-start justify-between gap-3 border-b border-border px-4 py-3'>
                    <div className='grid gap-1'>
                        <DrawerTitle id='draft-settings-title'>Settings</DrawerTitle>
                        {updating ? <p className='mb-0 text-sm text-muted-foreground'>Updating board…</p> : null}
                    </div>
                    <DrawerClose asChild>
                        <Button type='button' variant='ghost' size='icon' aria-label='Close settings'>
                            <X />
                        </Button>
                    </DrawerClose>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-4 py-6'>
                    <ProfileSettings value={value} onChange={onChange} onIntensityChange={onIntensityChange} />
                </div>
            </DrawerContent>
        </Drawer>
    );
}
