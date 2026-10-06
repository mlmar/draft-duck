import { CategoryPriorityEditor } from '@/components/onboard/category-priority-editor';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { QuizDraft } from '@/lib/quiz';
import { useEffect, useState } from 'react';

type WeightsDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: QuizDraft;
    onApply: (next: QuizDraft) => void;
};

export function WeightsDrawer({ open, onOpenChange, value, onApply }: WeightsDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [workingValue, setWorkingValue] = useState(value);

    useEffect(() => {
        if (open) setWorkingValue(value);
    }, [open, value]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? 'right' : 'bottom'}>
            <DrawerContent aria-labelledby='onboard-weights-title'>
                <div className='shrink-0 border-b border-border px-4 py-3'>
                    <DrawerTitle id='onboard-weights-title'>Edit weights</DrawerTitle>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-4 py-6'>
                    <CategoryPriorityEditor value={workingValue} onChange={setWorkingValue} />
                </div>
                <div className='flex shrink-0 gap-3 border-t border-border px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <Button type='button' variant='outline' className='flex-1' onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
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
