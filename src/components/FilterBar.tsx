import { CLASS_OPTIONS } from '../constants';
import type { Filters, Option } from '../types';

type FilterBarProps = {
  filters: Filters;
  subTypeOptions: Option[];
  onChange: (field: keyof Filters, value: string) => void;
  contentTypeOptions: Option[];
  galaxyOptions: Option[];
  gameModeOptions: Option[];
  platformOptions: Option[];
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.25em] text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-white/10 bg-slate-950/90 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-teal/80 focus:shadow-teal"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({
  filters,
  subTypeOptions,
  onChange,
  contentTypeOptions,
  galaxyOptions,
  gameModeOptions,
  platformOptions,
}: FilterBarProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
      <FilterSelect
        label="Content Type"
        value={filters.contentType}
        options={contentTypeOptions}
        onChange={(value) => onChange('contentType', value)}
      />
      {filters.contentType !== 'all' && subTypeOptions.length > 0 ? (
        <FilterSelect
          label="Sub-Type"
          value={filters.subType}
          options={subTypeOptions}
          onChange={(value) => onChange('subType', value)}
        />
      ) : (
        <div className="hidden xl:block" />
      )}
      <FilterSelect
        label="Class"
        value={filters.itemClass}
        options={CLASS_OPTIONS}
        onChange={(value) => onChange('itemClass', value)}
      />
      <FilterSelect
        label="Galaxy"
        value={filters.galaxy}
        options={galaxyOptions}
        onChange={(value) => onChange('galaxy', value)}
      />
      <FilterSelect
        label="Game Mode"
        value={filters.gameMode}
        options={gameModeOptions}
        onChange={(value) => onChange('gameMode', value)}
      />
      <FilterSelect
        label="Platform"
        value={filters.platform}
        options={platformOptions}
        onChange={(value) => onChange('platform', value)}
      />
    </div>
  );
}
