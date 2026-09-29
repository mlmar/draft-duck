import { ProfileSettings } from '@/components/draft/profile-settings';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerTitle } from '@/components/ui/drawer';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { QuizDraft } from '@/lib/quiz';
import type { CatValueMode } from '@/components/draft/player-table';
import { Eye, Layers, Table2 } from 'lucide-react';
import { useEffect, useState } from 'react';

type SettingsDrawerProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    value: QuizDraft;
    updating: boolean;
    hasSlot: boolean;
    simpleView: boolean;
    assist: boolean;
    valueMode: CatValueMode;
    onApply: (value: QuizDraft, settings: { simpleView: boolean; assist: boolean; valueMode: CatValueMode }) => void;
};

// Phone is a bottom sheet. Desktop is a side sheet so the grid stays visible.
export function SettingsDrawer({
    open,
    onOpenChange,
    value,
    updating,
    hasSlot,
    simpleView,
    assist,
    valueMode,
    onApply
}: SettingsDrawerProps) {
    const isDesktop = useMediaQuery('(min-width: 768px)');
    const [workingValue, setWorkingValue] = useState(value);
    const [workingSimpleView, setWorkingSimpleView] = useState(simpleView);
    const [workingAssist, setWorkingAssist] = useState(assist);
    const [workingValueMode, setWorkingValueMode] = useState(valueMode);
    const showSimple = workingSimpleView && hasSlot;

    useEffect(() => {
        if (!open) return;
        setWorkingValue(value);
        setWorkingSimpleView(simpleView);
        setWorkingAssist(assist);
        setWorkingValueMode(valueMode);
    }, [open, value, simpleView, assist, valueMode]);

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction={isDesktop ? 'right' : 'bottom'}>
            <DrawerContent id='draft-settings' aria-labelledby='draft-settings-title'>
                <div className='flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3'>
                    <div className='grid gap-1'>
                        <DrawerTitle id='draft-settings-title'>Settings</DrawerTitle>
                        {updating ? <p className='mb-0 text-sm text-muted-foreground'>Updating board…</p> : null}
                    </div>
                </div>
                <div className='min-h-0 flex-1 overflow-y-auto px-4 py-6'>
                    <div className='mb-6 grid gap-3 border-b border-border pb-6 md:hidden'>
                        <h2 className='mb-0 text-lg font-medium'>Table</h2>
                        <div
                            role='radiogroup'
                            aria-label='Table view'
                            className={`grid gap-2 ${hasSlot ? 'grid-cols-2' : 'grid-cols-1'}`}
                            onKeyDown={(event) => {
                                if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
                                event.preventDefault();
                                const nextSimple = !showSimple && hasSlot;
                                setWorkingSimpleView(nextSimple);
                                event.currentTarget
                                    .querySelector<HTMLButtonElement>(
                                        `[data-table-view='${nextSimple ? 'simple' : 'full'}']`
                                    )
                                    ?.focus();
                            }}
                        >
                            {hasSlot ? (
                                <Button
                                    type='button'
                                    role='radio'
                                    aria-checked={showSimple}
                                    tabIndex={showSimple ? 0 : -1}
                                    data-table-view='simple'
                                    variant={showSimple ? 'default' : 'outline'}
                                    onClick={() => setWorkingSimpleView(true)}
                                    className='w-full justify-start'
                                >
                                    <Eye />
                                    Simple view
                                </Button>
                            ) : null}
                            <Button
                                type='button'
                                role='radio'
                                aria-checked={!showSimple}
                                tabIndex={!showSimple ? 0 : -1}
                                data-table-view='full'
                                variant={!showSimple ? 'default' : 'outline'}
                                onClick={() => setWorkingSimpleView(false)}
                                className='w-full justify-start'
                            >
                                <Table2 />
                                Full table
                            </Button>
                        </div>
                        {showSimple ? null : (
                            <>
                                <Button
                                    type='button'
                                    variant={workingAssist ? 'default' : 'outline'}
                                    aria-pressed={workingAssist}
                                    onClick={() => setWorkingAssist((current) => !current)}
                                    className='w-full justify-start'
                                >
                                    <Layers />
                                    Draft assistance
                                </Button>
                                <Button
                                    type='button'
                                    variant={workingValueMode === 'plusMinus' ? 'default' : 'outline'}
                                    aria-pressed={workingValueMode === 'plusMinus'}
                                    onClick={() =>
                                        setWorkingValueMode((current) =>
                                            current === 'plusMinus' ? 'raw' : 'plusMinus'
                                        )
                                    }
                                    className='w-full justify-start'
                                >
                                    {workingValueMode === 'plusMinus' ? '+− Z Scores' : '# Raw Stats'}
                                </Button>
                            </>
                        )}
                    </div>
                    <ProfileSettings
                        value={workingValue}
                        onChange={setWorkingValue}
                        onIntensityChange={setWorkingValue}
                    />
                </div>
                <div className='flex shrink-0 gap-3 border-t border-border px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]'>
                    <DrawerClose asChild>
                        <Button type='button' variant='outline' className='flex-1'>
                            Cancel
                        </Button>
                    </DrawerClose>
                    <Button
                        type='button'
                        className='flex-1'
                        onClick={() => {
                            onApply(workingValue, {
                                simpleView: workingSimpleView,
                                assist: workingAssist,
                                valueMode: workingValueMode
                            });
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
