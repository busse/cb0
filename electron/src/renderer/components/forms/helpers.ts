import { state } from '../../state';
import { escapeHtml } from '../../utils/dom';

export function buildStoryOptions(ideaNumber: number, selectedStory?: number): string {
  const stories = state.stories.filter((story) => story.idea_number === ideaNumber);
  if (!stories.length) {
    return '<option value="">No stories available</option>';
  }

  return stories
    .map(
      (story) => `
        <option value="${story.story_number}" ${
          story.story_number === selectedStory ? 'selected' : ''
        }>${story.idea_number}.${story.story_number} — ${escapeHtml(story.title)}</option>
      `
    )
    .join('');
}


