import { LinkButton } from '@/components/link-button';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';

// Cards on home are the first-run start. Returning users skip the quiz from here.
export function EntryCtas() {
    const { hydrated, profile } = useHydratedProfile();

    if (!hydrated || !profile) return null;

    return (
        <p className='mt-8 mb-0 flex flex-wrap gap-3'>
            <LinkButton to='/draft' search={boardSearch()}>
                open board
            </LinkButton>
            <LinkButton to='/' variant='outline'>
                retake
            </LinkButton>
        </p>
    );
}
