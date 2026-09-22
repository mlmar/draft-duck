import { LinkButton } from '@/components/link-button';
import { useHydratedProfile } from '@/hooks/use-hydrated-profile';

const BOARD_SEARCH = { assist: '1', view: 'simple' } as const;

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
            <LinkButton to='/draft' search={BOARD_SEARCH}>
                Open board
            </LinkButton>
            <LinkButton to='/onboard' variant='outline'>
                Retake quiz
            </LinkButton>
        </p>
    );
}
