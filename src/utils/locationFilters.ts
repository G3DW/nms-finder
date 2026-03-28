import type { Filters, LocationRecord } from '../types';

function matchesValue(actualValue: string | null, filterValue: string): boolean {
  if (filterValue === 'all') {
    return true;
  }

  if (!actualValue) {
    return false;
  }

  return actualValue.toLowerCase() === filterValue.toLowerCase();
}

export function applyFilters(location: Pick<LocationRecord, 'content_type' | 'sub_type' | 'item_class' | 'galaxy' | 'game_mode' | 'platform'>, filters: Filters) {
  const matchesPlatform =
    filters.platform === 'all'
      ? true
      : location.platform?.toLowerCase().includes(filters.platform.toLowerCase()) || location.platform === 'All';

  return (
    matchesValue(location.content_type, filters.contentType) &&
    matchesValue(location.sub_type, filters.subType) &&
    matchesValue(location.item_class, filters.itemClass) &&
    matchesValue(location.galaxy, filters.galaxy) &&
    matchesValue(location.game_mode, filters.gameMode) &&
    Boolean(matchesPlatform)
  );
}

export function filterOutdated(location: LocationRecord) {
  return location.is_active && location.location_confidence.gone_count < 3;
}

export function sortByLastConfirmed(a: LocationRecord, b: LocationRecord) {
  const aTime = a.last_confirmed_at ? new Date(a.last_confirmed_at).getTime() : 0;
  const bTime = b.last_confirmed_at ? new Date(b.last_confirmed_at).getTime() : 0;
  return bTime - aTime;
}
