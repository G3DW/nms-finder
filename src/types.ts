export type ContentType = 'ship' | 'multitool' | 'planet' | 'base' | 'freighter' | 'creature';
export type FilterValue = 'all' | string;

export type Filters = {
  contentType: FilterValue;
  subType: FilterValue;
  itemClass: FilterValue;
  galaxy: FilterValue;
  gameMode: FilterValue;
  platform: FilterValue;
};

export type Option = {
  value: string;
  label: string;
};

export type ContentTypeOption = Option;

export type SubTypeMap = Partial<Record<ContentType, Option[]>>;

export type FeedbackType = 'still_here' | 'gone' | 'wrong_info' | 'note';

export type ConfidenceRecord = {
  location_id: string;
  confirmed_count: number;
  gone_count: number;
  total_votes: number;
  confidence_pct: number | null;
};

export type Location = {
  id: string;
  created_at: string;
  content_type: ContentType;
  sub_type: string | null;
  item_class: string | null;
  galaxy: string;
  system_name: string | null;
  planet_name: string | null;
  portal_glyphs: string | null;
  coordinates: string | null;
  game_mode: string;
  platform: string | null;
  game_version: string | null;
  notes: string | null;
  source_type: string;
  source_url: string | null;
  source_author: string | null;
  screenshot_url: string | null;
  date_posted: string | null;
  last_confirmed_at: string | null;
  is_active: boolean;
};

export type LocationRecord = Location & {
  location_confidence: ConfidenceRecord;
};

export type FeedbackRecord = {
  id: string;
  created_at: string;
  location_id: string;
  feedback_type: FeedbackType;
  note: string | null;
  fingerprint: string;
};

export type SubmitFeedbackInput = {
  feedbackType: FeedbackType;
  wrongInfoCategory?: string;
  note?: string;
};
