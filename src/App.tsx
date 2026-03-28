import { useEffect, useMemo, useState, useTransition } from 'react';
import { FilterBar } from './components/FilterBar';
import { LocationCard } from './components/LocationCard';
import { PortalConverter } from './components/PortalConverter';
import {
  CONTENT_TYPE_OPTIONS,
  DEFAULT_FILTERS,
  FILTER_LABELS,
  GALAXY_OPTIONS,
  GAME_MODE_OPTIONS,
  PLATFORM_OPTIONS,
  SUB_TYPE_OPTIONS,
} from './constants';
import type { ContentType, Filters, LocationRecord, SubmitFeedbackInput } from './types';
import { getLocationResults, submitFeedback } from './services/locationService';

export default function App() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showOutdated, setShowOutdated] = useState(false);
  const [locations, setLocations] = useState<LocationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConverterOpen, setIsConverterOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isCancelled = false;

    async function loadLocations() {
      setLoading(true);
      setError(null);

      try {
        const nextLocations = await getLocationResults(filters, showOutdated);
        if (!isCancelled) {
          startTransition(() => {
            setLocations(nextLocations);
          });
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load location data.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadLocations();

    return () => {
      isCancelled = true;
    };
  }, [filters, showOutdated]);

  const subTypeOptions = useMemo(() => {
    if (filters.contentType === 'all') {
      return [];
    }

    return SUB_TYPE_OPTIONS[filters.contentType as ContentType] ?? [];
  }, [filters.contentType]);

  const resultLabel = loading ? 'Scanning charted systems...' : `Showing ${locations.length} result${locations.length === 1 ? '' : 's'}`;

  async function handleFeedback(locationId: string, input: SubmitFeedbackInput) {
    const updatedLocation = await submitFeedback(locationId, input);
    setLocations((currentLocations) =>
      currentLocations.map((location) => (location.id === locationId ? updatedLocation : location)),
    );
  }

  function handleContentTypeChange(contentType: Filters['contentType']) {
    setFilters((currentFilters) => ({
      ...currentFilters,
      contentType,
      subType: contentType === 'all' ? 'all' : currentFilters.subType,
    }));
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-stars bg-[length:280px_280px] opacity-50" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,rgba(0,229,204,0.16),transparent_60%)]" />

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-6 border border-white/10 bg-slate-950/60 px-5 py-6 shadow-teal backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="font-display text-xs uppercase tracking-[0.45em] text-teal/75">Atlas Navigation Console</p>
            <div>
              <h1 className="font-display text-4xl uppercase tracking-[0.2em] text-white sm:text-5xl">NMS Finder</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">Find it. Dial it. Go.</p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 text-sm sm:items-end">
            <button
              type="button"
              onClick={() => setIsConverterOpen((open) => !open)}
              className="rounded border border-teal/60 px-4 py-2 font-medium text-teal transition hover:bg-teal/10 hover:shadow-teal"
            >
              {isConverterOpen ? 'Hide Converter' : 'Convert Coordinates'}
            </button>
            <p className="max-w-sm text-xs leading-6 text-slate-400">
              {FILTER_LABELS.dataMode}
              <span className="ml-1 text-slate-200">
                {import.meta.env.VITE_SUPABASE_URL ? 'Live Supabase mode enabled.' : 'Using local sample data until Supabase env vars are added.'}
              </span>
            </p>
          </div>
        </header>

        {isConverterOpen ? <PortalConverter /> : null}

        <section className="mb-6 border border-white/10 bg-panel px-4 py-4 backdrop-blur">
          <FilterBar
            filters={filters}
            subTypeOptions={subTypeOptions}
            onChange={(field, value) => {
              if (field === 'contentType') {
                handleContentTypeChange(value as Filters['contentType']);
                return;
              }

              setFilters((currentFilters) => ({ ...currentFilters, [field]: value }));
            }}
            contentTypeOptions={CONTENT_TYPE_OPTIONS}
            galaxyOptions={GALAXY_OPTIONS}
            gameModeOptions={GAME_MODE_OPTIONS}
            platformOptions={PLATFORM_OPTIONS}
          />

          <div className="mt-4 flex flex-col gap-4 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-300">{resultLabel}</p>

            <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-slate-200">
              <span>Show outdated entries</span>
              <span className="relative inline-flex items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={showOutdated}
                  onChange={(event) => setShowOutdated(event.target.checked)}
                />
                <span className="h-6 w-11 rounded-full border border-white/15 bg-slate-900 transition peer-checked:border-teal/70 peer-checked:bg-teal/20" />
                <span className="absolute left-1 h-4 w-4 rounded-full bg-white transition peer-checked:left-6 peer-checked:bg-teal" />
              </span>
            </label>
          </div>
        </section>

        {error ? (
          <section className="mb-6 border border-rose-500/40 bg-rose-950/30 px-4 py-4 text-sm text-rose-100">
            <p>{error}</p>
          </section>
        ) : null}

        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => (
            <LocationCard key={location.id} location={location} onFeedbackSubmit={handleFeedback} />
          ))}
        </section>

        {!loading && locations.length === 0 ? (
          <section className="mt-8 border border-dashed border-white/10 bg-slate-950/40 px-6 py-12 text-center">
            <p className="font-display text-lg uppercase tracking-[0.2em] text-white">No Signals Found</p>
            <p className="mt-3 text-sm text-slate-400">
              Adjust the filters above or toggle outdated entries to widen the search window.
            </p>
          </section>
        ) : null}

        {loading || isPending ? (
          <section className="mt-8 flex items-center justify-center py-10 text-sm text-slate-400">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal" />
              <span>Refreshing navigation data...</span>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
