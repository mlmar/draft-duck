import { LinkButton } from '@/components/link-button';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';
import { restoreSummary } from '@draft-duck/core';
import { LayoutList } from 'lucide-react';

// Cards on home are the first-run start. Returning users skip the quiz from here.
export function EntryCtas({ inline = false }: { inline?: boolean }) {
    const { hydrated, profile } = useHydratedProfile();

    if (!hydrated || !profile) return null;

    return (
        <div
            className={
                inline
                    ? 'mb-6 grid gap-4 border-b border-border pb-6'
                    : 'mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card p-4'
            }
        >
            <div className='grid gap-1'>
                <span className='text-sm text-muted-foreground'>Your saved build</span>
                <span className='font-medium'>{restoreSummary(profile)}</span>
            </div>
            <LinkButton to='/draft' search={boardSearch()}>
                <LayoutList aria-hidden='true' /> Open your board
            </LinkButton>
        </div>
    );
}
