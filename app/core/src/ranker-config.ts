import raw from '../config/ranker.json' with { type: 'json' };

// v1 board order is fit (punt-weighted). Flip this JSON and restart the API to turn the consensus floor on.
export const DEFAULT_AVAILABILITY_FLOOR = raw.availabilityFloor === true;
