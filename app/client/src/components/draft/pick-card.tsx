import { Card, CardContent } from '@/components/ui/card';
import { fitMarks, whyCopy, type DraftProfile, type RankedPlayer } from '@draft-duck/core';

type PickCardProps = {
    round: number;
    overall: number;
    player: RankedPlayer;
    profile: DraftProfile;
};

// Simple-view card. Same fitMarks / whyCopy as Review so the two lists cannot fork copy.
export function PickCard({ round, overall, player, profile }: PickCardProps) {
    const marks = fitMarks(player, profile);

    return (
        <Card size='sm' className='rounded-lg py-3 ring-foreground/8'>
            <CardContent className='grid gap-1'>
                <p className='mb-0 text-sm text-muted-foreground'>
                    Round {round} · Pick {overall}
                </p>
                <p className='mb-0'>
                    <span className='font-medium'>{player.name}</span>
                    <span className='text-muted-foreground'> · {player.pos}</span>
                </p>
                {marks.length > 0 ? (
                    <p className='mb-0 text-sm'>
                        {marks.map((mark, index) => (
                            <span key={mark.text}>
                                {index > 0 ? ' · ' : ''}
                                <span className={mark.muted ? 'text-muted-foreground' : undefined}>{mark.text}</span>
                            </span>
                        ))}
                    </p>
                ) : null}
                <p className='mb-0 text-sm text-muted-foreground'>{whyCopy(player, profile)}</p>
            </CardContent>
        </Card>
    );
}
