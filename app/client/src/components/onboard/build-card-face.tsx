import {
    CAT_KEYS,
    CAT_LABELS,
    NAMED_BUILDS,
    TUNER_NEUTRAL,
    formatTuner,
    namedBuildHelper,
    stancesForArchetype,
    tunersForArchetype,
    type CatKey,
    type NamedBuildId
} from '@draft-duck/core';
import { WeightChart } from '@/components/onboard/weight-chart';

export const namedBuildCardClassName =
    'h-auto min-w-0 w-full flex-col items-start gap-0.5 whitespace-normal px-3 py-2 text-left';

// Show the build title, shared helper, and compact preset chart with stable accessibility description IDs.

export function BuildCardFace({
    id,
    enabledCats,
    titleId,
    helperId,
    weightSummaryId
}: {
    id: NamedBuildId;
    enabledCats: readonly CatKey[];
    titleId: string;
    helperId: string;
    weightSummaryId: string;
}) {
    // Reuse onboarding's resolvers so each card preview reflects the same preset tuners and punt state.
    const cats = CAT_KEYS.filter((cat) => enabledCats.includes(cat));
    const tuners = tunersForArchetype(id, cats);
    const stances = stancesForArchetype(id, cats);
    const weightSummary = cats
        .map((cat) => `${CAT_LABELS[cat]} ${formatTuner(tuners[cat] ?? TUNER_NEUTRAL)}`)
        .join(', ');

    return (
        <>
            <span id={titleId} className='pr-8 font-medium'>
                {NAMED_BUILDS[id].label}
            </span>
            <span
                id={helperId}
                className='block min-h-10 w-full whitespace-normal font-normal text-sm text-muted-foreground'
            >
                {namedBuildHelper(id, cats)}
            </span>
            {/* The link description carries exact weights; hiding the plot prevents repeating them as an image label. */}
            <div id={weightSummaryId} className='grid w-full gap-1'>
                <span className='sr-only'>Category weights: {weightSummary}</span>
                <div aria-hidden='true'>
                    <WeightChart enabledCats={cats} tuners={tuners} stances={stances} variant='mini' compact />
                </div>
            </div>
        </>
    );
}
