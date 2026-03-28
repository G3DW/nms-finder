import type { SubmitFeedbackInput } from '../types';

export function toFeedbackNote(input: SubmitFeedbackInput): string | null {
  if (input.feedbackType === 'wrong_info') {
    const category = input.wrongInfoCategory ? `Category: ${input.wrongInfoCategory}.` : '';
    const note = input.note?.trim() ? ` ${input.note.trim()}` : '';
    return `${category}${note}`.trim() || null;
  }

  return input.note?.trim() || null;
}
