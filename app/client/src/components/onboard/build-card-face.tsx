import { NAMED_BUILDS, namedBuildHelper, type CatKey, type NamedBuildId } from '@draft-duck/core';

export const namedBuildCardClassName =
    'h-auto min-w-0 w-full flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left';

// Label plus Need/Punt line. Home and play share this so helper copy cannot drift.

export function BuildCardFace({ id, enabledCats }: { id: NamedBuildId; enabledCats: readonly CatKey[] }) {
    return (
        <>
            <span className='font-medium'>{NAMED_BUILDS[id].label}</span>
            <span className='block w-full whitespace-normal font-normal text-sm text-muted-foreground'>
                {namedBuildHelper(id, enabledCats)}
            </span>
        </>
    );
}
