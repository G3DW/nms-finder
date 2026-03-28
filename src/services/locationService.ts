import { buildMockLocationRecords, MOCK_FEEDBACK, MOCK_LOCATIONS } from '../lib/mockData';
import { hasSupabaseEnv, supabase } from '../lib/supabase';
import type {
  ConfidenceRecord,
  FeedbackRecord,
  Filters,
  Location,
  LocationRecord,
  SubmitFeedbackInput,
} from '../types';
import { applyFilters, filterOutdated, sortByLastConfirmed } from '../utils/locationFilters';
import { createFingerprint } from '../utils/fingerprint';
import { toFeedbackNote } from '../utils/notes';

const MOCK_FEEDBACK_STORAGE_KEY = 'nms-finder-feedback';

function getDefaultConfidence(locationId: string): ConfidenceRecord {
  return {
    location_id: locationId,
    confirmed_count: 0,
    gone_count: 0,
    total_votes: 0,
    confidence_pct: null,
  };
}

function readMockFeedback(): FeedbackRecord[] {
  if (typeof window === 'undefined') {
    return MOCK_FEEDBACK;
  }

  const rawFeedback = window.localStorage.getItem(MOCK_FEEDBACK_STORAGE_KEY);
  if (!rawFeedback) {
    return MOCK_FEEDBACK;
  }

  try {
    const parsedFeedback = JSON.parse(rawFeedback) as FeedbackRecord[];
    return [...MOCK_FEEDBACK, ...parsedFeedback];
  } catch {
    return MOCK_FEEDBACK;
  }
}

function writeMockFeedback(feedback: FeedbackRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }

  const nonSeedFeedback = feedback.filter((entry) => !MOCK_FEEDBACK.find((seedEntry) => seedEntry.id === entry.id));
  window.localStorage.setItem(MOCK_FEEDBACK_STORAGE_KEY, JSON.stringify(nonSeedFeedback));
}

function normalizePlatform(platform: string | null): string | null {
  if (!platform) {
    return platform;
  }

  if (platform.toLowerCase().includes('xbox')) {
    return 'Xbox';
  }

  return platform;
}

async function fetchConfidenceForIds(locationIds: string[]): Promise<Map<string, ConfidenceRecord>> {
  if (!supabase || locationIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from('location_confidence')
    .select('location_id, confirmed_count, gone_count, total_votes, confidence_pct')
    .in('location_id', locationIds);

  if (error) {
    throw error;
  }

  return new Map((data ?? []).map((entry) => [entry.location_id, entry as ConfidenceRecord]));
}

async function fetchLocationById(locationId: string): Promise<Location> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.from('locations').select('*').eq('id', locationId).single();

  if (error) {
    throw error;
  }

  return data as Location;
}

async function fetchLocationRecordById(locationId: string): Promise<LocationRecord> {
  const location = await fetchLocationById(locationId);
  const confidenceMap = await fetchConfidenceForIds([locationId]);

  return {
    ...location,
    location_confidence: confidenceMap.get(locationId) ?? getDefaultConfidence(locationId),
  };
}

function buildRecordList(locations: Location[], confidenceMap: Map<string, ConfidenceRecord>): LocationRecord[] {
  return locations
    .map((location) => ({
      ...location,
      platform: normalizePlatform(location.platform),
      location_confidence: confidenceMap.get(location.id) ?? getDefaultConfidence(location.id),
    }))
    .sort(sortByLastConfirmed);
}

export async function getLocationResults(filters: Filters, showOutdated: boolean): Promise<LocationRecord[]> {
  if (!hasSupabaseEnv || !supabase) {
    const mockRecords = buildMockLocationRecords(MOCK_LOCATIONS, readMockFeedback())
      .map((location) => ({ ...location, platform: normalizePlatform(location.platform) }))
      .filter((location) => applyFilters(location, filters))
      .filter((location) => (showOutdated ? true : filterOutdated(location)))
      .sort(sortByLastConfirmed);

    return mockRecords;
  }

  let countQuery = supabase.from('locations').select('id', { count: 'exact', head: true });

  if (filters.contentType !== 'all') countQuery = countQuery.eq('content_type', filters.contentType);
  if (filters.subType !== 'all') countQuery = countQuery.eq('sub_type', filters.subType);
  if (filters.itemClass !== 'all') countQuery = countQuery.eq('item_class', filters.itemClass);
  if (filters.galaxy !== 'all') countQuery = countQuery.eq('galaxy', filters.galaxy);
  if (filters.gameMode !== 'all') countQuery = countQuery.eq('game_mode', filters.gameMode);
  if (filters.platform !== 'all') countQuery = countQuery.ilike('platform', `%${filters.platform}%`);

  const { count, error: countError } = await countQuery;
  if (countError) {
    throw countError;
  }

  const shouldFilterClientSide = (count ?? 0) < 200;

  let locationQuery = supabase.from('locations').select('*').order('last_confirmed_at', { ascending: false });

  if (!showOutdated) {
    locationQuery = locationQuery.eq('is_active', true);
  }

  if (!shouldFilterClientSide) {
    if (filters.contentType !== 'all') locationQuery = locationQuery.eq('content_type', filters.contentType);
    if (filters.subType !== 'all') locationQuery = locationQuery.eq('sub_type', filters.subType);
    if (filters.itemClass !== 'all') locationQuery = locationQuery.eq('item_class', filters.itemClass);
    if (filters.galaxy !== 'all') locationQuery = locationQuery.eq('galaxy', filters.galaxy);
    if (filters.gameMode !== 'all') locationQuery = locationQuery.eq('game_mode', filters.gameMode);
    if (filters.platform !== 'all') locationQuery = locationQuery.ilike('platform', `%${filters.platform}%`);
  }

  const { data, error } = await locationQuery;
  if (error) {
    throw error;
  }

  let locations = (data ?? []) as Location[];
  if (shouldFilterClientSide) {
    locations = locations.filter((location) => applyFilters(location, filters));
  }

  const confidenceMap = await fetchConfidenceForIds(locations.map((location) => location.id));

  let records = buildRecordList(locations, confidenceMap);
  if (!showOutdated) {
    records = records.filter(filterOutdated);
  }

  return records;
}

export async function submitFeedback(locationId: string, input: SubmitFeedbackInput): Promise<LocationRecord> {
  const fingerprint = await createFingerprint();

  if (!hasSupabaseEnv || !supabase) {
    const feedback = readMockFeedback();
    const duplicate = feedback.find((entry) => entry.location_id === locationId && entry.fingerprint === fingerprint);
    if (duplicate) {
      throw new Error("You've already submitted feedback for this one.");
    }

    const nextFeedback: FeedbackRecord = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      location_id: locationId,
      feedback_type: input.feedbackType,
      note: toFeedbackNote(input),
      fingerprint,
    };

    const updatedFeedback = [...feedback, nextFeedback];
    writeMockFeedback(updatedFeedback);

    const records = buildMockLocationRecords(
      MOCK_LOCATIONS.map((location) => {
        if (location.id !== locationId) {
          return location;
        }

        const locationFeedback = updatedFeedback.filter((entry) => entry.location_id === locationId);
        const goneCount = locationFeedback.filter((entry) => entry.feedback_type === 'gone').length;

        return {
          ...location,
          is_active: goneCount >= 5 ? false : location.is_active,
          last_confirmed_at: input.feedbackType === 'still_here' ? new Date().toISOString() : location.last_confirmed_at,
        };
      }),
      updatedFeedback,
    );

    const record = records.find((entry) => entry.id === locationId);
    if (!record) {
      throw new Error('Unable to locate the updated record.');
    }

    return record;
  }

  const { data: duplicateFeedback, error: duplicateError } = await supabase
    .from('feedback')
    .select('id')
    .eq('location_id', locationId)
    .eq('fingerprint', fingerprint)
    .maybeSingle();

  if (duplicateError) {
    throw duplicateError;
  }

  if (duplicateFeedback) {
    throw new Error("You've already submitted feedback for this one.");
  }

  const insertPayload = {
    location_id: locationId,
    feedback_type: input.feedbackType,
    note: toFeedbackNote(input),
    fingerprint,
  };

  const { error: insertError } = await supabase.from('feedback').insert(insertPayload);
  if (insertError) {
    throw insertError;
  }

  const confidenceMap = await fetchConfidenceForIds([locationId]);
  const updatedConfidence = confidenceMap.get(locationId) ?? getDefaultConfidence(locationId);

  if (input.feedbackType === 'gone' && updatedConfidence.gone_count >= 5) {
    const { error: updateError } = await supabase.from('locations').update({ is_active: false }).eq('id', locationId);
    if (updateError) {
      throw updateError;
    }
  }

  if (input.feedbackType === 'still_here') {
    const { error: updateError } = await supabase
      .from('locations')
      .update({ last_confirmed_at: new Date().toISOString(), is_active: true })
      .eq('id', locationId);

    if (updateError) {
      throw updateError;
    }
  }

  return fetchLocationRecordById(locationId);
}
