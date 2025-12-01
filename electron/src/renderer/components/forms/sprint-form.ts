import type { Sprint, SprintRecord, SprintStatus } from '@shared/types';

import { SPRINT_STATUSES } from '../../constants';
import { fetchSprints, saveSprint } from '../../api';
import { renderSprints } from '../lists';
import { openModal } from '../../modal';
import { showError, showToast } from '../../toast';
import { escapeAttr, escapeHtml, parseLines, today } from '../../utils/dom';

export async function openSprintForm(mode: 'create' | 'edit', sprint?: SprintRecord): Promise<void> {
  if (mode === 'edit' && !sprint) {
    showError('Unable to find that sprint.');
    return;
  }

  const defaults = {
    sprint_id: sprint?.sprint_id ?? '',
    year: sprint?.year ?? new Date().getFullYear(),
    sprint_number: sprint?.sprint_number ?? 1,
    status: sprint?.status ?? 'planned',
    start_date: sprint?.start_date ?? today(),
    end_date: sprint?.end_date ?? today(),
    goals: sprint?.goals?.join('\n') ?? '',
    body: sprint?.body ?? '',
  };

  openModal({
    title: mode === 'create' ? 'Create Sprint' : `Edit Sprint ${sprint?.sprint_id}`,
    width: 'lg',
    submitLabel: mode === 'create' ? 'Create Sprint' : 'Save Changes',
    body: `
      <div class="form-grid">
        <div class="form-field">
          <label>Sprint ID (YYSS)</label>
          <input type="text" name="sprint_id" value="${escapeAttr(defaults.sprint_id)}" pattern="\\d{4}" required />
        </div>
        <div class="form-field">
          <label>Year</label>
          <input type="number" name="year" value="${defaults.year}" min="2000" max="2100" required />
        </div>
        <div class="form-field">
          <label>Sprint Number (1-26)</label>
          <input type="number" name="sprint_number" value="${defaults.sprint_number}" min="1" max="26" required />
        </div>
        <div class="form-field">
          <label>Status</label>
          <select name="status" required>
            ${SPRINT_STATUSES.map(
              (status) => `<option value="${status}" ${status === defaults.status ? 'selected' : ''}>${status}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-field">
          <label>Start Date</label>
          <input type="date" name="start_date" value="${defaults.start_date}" required />
        </div>
        <div class="form-field">
          <label>End Date</label>
          <input type="date" name="end_date" value="${defaults.end_date}" required />
        </div>
      </div>
      <div class="form-field">
        <label>Goals (one per line)</label>
        <textarea name="goals" rows="4">${escapeHtml(defaults.goals)}</textarea>
      </div>
      <div class="form-field">
        <label>Body (Markdown)</label>
        <textarea name="body" rows="6">${escapeHtml(defaults.body)}</textarea>
      </div>
    `,
    onSubmit: async (formData) => {
      const payload: Sprint = {
        layout: 'sprint',
        sprint_id: (formData.get('sprint_id') as string).trim(),
        year: Number(formData.get('year')),
        sprint_number: Number(formData.get('sprint_number')),
        status: formData.get('status') as SprintStatus,
        start_date: formData.get('start_date') as string,
        end_date: formData.get('end_date') as string,
        goals: parseLines(formData.get('goals') as string),
      };
      const content = (formData.get('body') as string) ?? '';

      await saveSprint(payload, content);
      await fetchSprints();
      renderSprints();
      showToast(mode === 'create' ? 'Sprint created' : 'Sprint updated');
      return true;
    },
  });
}


