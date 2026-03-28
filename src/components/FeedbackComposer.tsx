import { useState } from 'react';
import { WRONG_INFO_OPTIONS } from '../constants';
import type { LocationRecord, SubmitFeedbackInput } from '../types';

type FeedbackComposerProps = {
  location: LocationRecord;
  onSubmit: (input: SubmitFeedbackInput) => Promise<void>;
};

type DraftMode = 'wrong_info' | 'note' | null;

export function FeedbackComposer({ location, onSubmit }: FeedbackComposerProps) {
  const [draftMode, setDraftMode] = useState<DraftMode>(null);
  const [note, setNote] = useState('');
  const [wrongInfoCategory, setWrongInfoCategory] = useState(WRONG_INFO_OPTIONS[0].value);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(input: SubmitFeedbackInput) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await onSubmit(input);
      setMessage('Thanks! Feedback recorded.');
      setDraftMode(null);
      setNote('');
      setWrongInfoCategory(WRONG_INFO_OPTIONS[0].value);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit feedback right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonClass =
    'rounded border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-200 transition hover:border-teal/60 hover:bg-teal/10';

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={isSubmitting} className={buttonClass} onClick={() => submit({ feedbackType: 'still_here' })}>
          ✅ Still Here
        </button>
        <button type="button" disabled={isSubmitting} className={buttonClass} onClick={() => submit({ feedbackType: 'gone' })}>
          ❌ Gone
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          className={buttonClass}
          onClick={() => setDraftMode((currentMode) => (currentMode === 'wrong_info' ? null : 'wrong_info'))}
        >
          ⚠ Wrong Info
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          className={buttonClass}
          onClick={() => setDraftMode((currentMode) => (currentMode === 'note' ? null : 'note'))}
        >
          💬 Add Note
        </button>
      </div>

      {draftMode === 'wrong_info' ? (
        <form
          className="space-y-3 rounded border border-white/10 bg-black/20 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ feedbackType: 'wrong_info', wrongInfoCategory, note });
          }}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">What needs correction?</p>
          <select
            value={wrongInfoCategory}
            onChange={(event) => setWrongInfoCategory(event.target.value)}
            className="w-full rounded border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal/70"
          >
            {WRONG_INFO_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder={`What should be updated for ${location.system_name ?? 'this listing'}?`}
            className="w-full rounded border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal/70"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded border border-teal/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-teal transition hover:bg-teal/10"
          >
            Submit Correction
          </button>
        </form>
      ) : null}

      {draftMode === 'note' ? (
        <form
          className="space-y-3 rounded border border-white/10 bg-black/20 p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submit({ feedbackType: 'note', note });
          }}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Share a note</p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={3}
            placeholder="Add a quick note for future travelers..."
            className="w-full rounded border border-white/10 bg-slate-950/90 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal/70"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded border border-teal/60 px-3 py-2 text-xs uppercase tracking-[0.18em] text-teal transition hover:bg-teal/10"
          >
            Submit Note
          </button>
        </form>
      ) : null}

      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </div>
  );
}
