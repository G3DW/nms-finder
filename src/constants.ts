import type { ContentTypeOption, Filters, Option, SubTypeMap } from './types';

export const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  { value: 'all', label: 'All' },
  { value: 'ship', label: 'Ship' },
  { value: 'multitool', label: 'Multi-Tool' },
  { value: 'planet', label: 'Planet' },
  { value: 'base', label: 'Base' },
  { value: 'freighter', label: 'Freighter' },
];

export const CLASS_OPTIONS: Option[] = [
  { value: 'all', label: 'All' },
  { value: 'S', label: 'S' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

export const GALAXY_OPTIONS: Option[] = [
  { value: 'all', label: 'All' },
  { value: 'Euclid', label: 'Euclid' },
  { value: 'Hilbert', label: 'Hilbert' },
  { value: 'Calypso', label: 'Calypso' },
  { value: 'Eissentam', label: 'Eissentam' },
  { value: 'Hyades', label: 'Hyades' },
  { value: 'Elkupalos', label: 'Elkupalos' },
  { value: 'Ijsenufryos', label: 'Ijsenufryos' },
];

export const GAME_MODE_OPTIONS: Option[] = [
  { value: 'all', label: 'All' },
  { value: 'Normal', label: 'Normal' },
  { value: 'Survival', label: 'Survival' },
  { value: 'Permadeath', label: 'Permadeath' },
  { value: 'Relaxed', label: 'Relaxed' },
  { value: 'Custom', label: 'Custom' },
];

export const PLATFORM_OPTIONS: Option[] = [
  { value: 'all', label: 'All' },
  { value: 'PC', label: 'PC' },
  { value: 'PS5', label: 'PS5' },
  { value: 'Xbox', label: 'Xbox' },
];

export const SUB_TYPE_OPTIONS: SubTypeMap = {
  ship: [
    { value: 'all', label: 'All' },
    { value: 'sentinel', label: 'Sentinel' },
    { value: 'solar', label: 'Solar' },
    { value: 'exotic', label: 'Exotic' },
    { value: 'hauler', label: 'Hauler' },
    { value: 'fighter', label: 'Fighter' },
    { value: 'explorer', label: 'Explorer' },
    { value: 'shuttle', label: 'Shuttle' },
  ],
  multitool: [
    { value: 'all', label: 'All' },
    { value: 'rifle', label: 'Rifle' },
    { value: 'pistol', label: 'Pistol' },
    { value: 'alien', label: 'Alien' },
    { value: 'royal', label: 'Royal' },
    { value: 'experimental', label: 'Experimental' },
  ],
  planet: [
    { value: 'all', label: 'All' },
    { value: 'lush', label: 'Lush' },
    { value: 'toxic', label: 'Toxic' },
    { value: 'radioactive', label: 'Radioactive' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'barren', label: 'Barren' },
    { value: 'dead', label: 'Dead' },
    { value: 'exotic', label: 'Exotic' },
  ],
};

export const DEFAULT_FILTERS: Filters = {
  contentType: 'all',
  subType: 'all',
  itemClass: 'all',
  galaxy: 'all',
  gameMode: 'all',
  platform: 'all',
};

export const FILTER_LABELS = {
  dataMode: 'Data source:',
};

export const WRONG_INFO_OPTIONS: Option[] = [
  { value: 'class', label: 'Class' },
  { value: 'coordinates', label: 'Coordinates' },
  { value: 'ship_type', label: 'Ship Type' },
  { value: 'no_longer_exists', label: 'No longer exists' },
  { value: 'other', label: 'Other' },
];

export const CONTENT_TYPE_BADGE_CLASSES: Record<string, string> = {
  ship: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  multitool: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  planet: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  base: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-400/30',
  freighter: 'bg-violet-500/15 text-violet-200 border-violet-400/30',
  creature: 'bg-orange-500/15 text-orange-200 border-orange-400/30',
};
