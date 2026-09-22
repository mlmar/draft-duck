import { NAMED_BUILDS, namedBuildHelper, type CatKey, type NamedBuildId } from '@waiver-warrior/core';

export const namedBuildCardClassName = 'h-auto w-full flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left';

// Label plus Need/Punt line. Home and play share this so helper copy cannot drift.

export function BuildCardFace({ id, enabledCats }: { id: NamedBuildId; enabledCats: readonly CatKey[] }) {
    return (
        <>
            <span className='font-medium'>{NAMED_BUILDS[id].label}</span>
            <span className='font-normal text-muted-foreground'>{namedBuildHelper(id, enabledCats)}</span>
        </>
    );
}
