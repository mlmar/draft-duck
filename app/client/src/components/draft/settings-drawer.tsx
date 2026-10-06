import { ProfileSettings } from '@/components/draft/profile-settings';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { QuizDraft } from '@/lib/quiz';
import { useEffect, useState } from 'react';

type SettingsDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: QuizDraft;
    updating: boolean;
    onApply: (value: QuizDraft) => void;
};

// Edits are local until Apply; Cancel preserves the active board and ranking basis.
export function SettingsDrawer({ open, onOpenChange, value, updating, onApply }: SettingsDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [workingValue, setWorkingValue] = useState(value);
    useEffect(() => {
        if (open) setWorkingValue(value);
    }, [open, value]);
    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? 'right' : 'bottom'}>
            <DrawerContent
                id='draft-settings'
                aria-labelledby='draft-settings-title'
                aria-describedby='draft-settings-description'
            >
                <div className='grid shrink-0 gap-1 border-b border-border px-5 py-4'>
                    <DrawerTitle id='draft-settings-title'>Build settings</DrawerTitle>
                    <DrawerDescription id='draft-settings-description'>
                        Configure your league and the stats used to rank players.
                    </DrawerDescription>
                    {updating ? (
                        <p role='status' className='mb-0 text-sm text-muted-foreground'>
                            Updating rankings…
                        </p>
                    ) : null}
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-5 py-6'>
                    <ProfileSettings
                        value={workingValue}
                        onChange={setWorkingValue}
                        onIntensityChange={setWorkingValue}
                    />
                </div>
                <div className='flex shrink-0 gap-3 border-t border-border px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <DrawerClose asChild>
                        <Button type='button' variant='outline' className='flex-1'>
                            Cancel
                        </Button>
                    </DrawerClose>
                    <Button
                        type='button'
                        className='flex-1'
                        onClick={() => {
                            onApply(workingValue);
                            onOpenChange(false);
                        }}
                    >
                        Apply
                    </Button>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
