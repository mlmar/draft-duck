import { LinkButton } from '@/components/link-button';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';
import { boardSearch } from '@/lib/quiz';

// Start for first run. Returning users skip the quiz and can retake from here.
export function EntryCtas() {
    const { hydrated, profile } = useHydratedProfile();

    if (!hydrated || !profile) {
        return (
            <p className='mt-8 mb-0'>
                <LinkButton to='/onboard'>Start</LinkButton>
            </p>
        );
    }

    return (
        <p className='mt-8 mb-0 flex flex-wrap gap-3'>
            <LinkButton to='/draft' search={boardSearch(profile)}>
                Open board
            </LinkButton>
            <LinkButton to='/onboard' variant='outline'>
                Retake quiz
            </LinkButton>
        </p>
    );
}
