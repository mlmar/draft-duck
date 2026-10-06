import { cn } from '@/lib/utils';

type LoadingCopyProps = {
    className?: string;
    ranking?: boolean;
};

// Keep brand voice separate from the literal live status for the current operation.
export function LoadingCopy({ className, ranking = false }: LoadingCopyProps) {
    return (
        <div role='status' className={cn('grid justify-items-center gap-3 py-8 text-center', className)}>
            <div className='grid gap-1'>
                <p className='mb-0 font-medium'>{ranking ? 'Quacking the numbers…' : 'Getting your ducks in a row…'}</p>
                <p className='mb-0 text-sm text-muted-foreground'>
                    {ranking ? 'Ranking players for your build.' : 'Loading Draft Duck.'}
                </p>
            </div>
        </div>
    );
}
