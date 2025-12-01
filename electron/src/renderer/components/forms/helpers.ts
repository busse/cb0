import { state } from '../../state';
import { escapeHtml } from '../../utils/dom';

export function buildStoryOptions(ideaNumber: number, selectedStory?: number): string {
  const stories = state.stories.filter((story) => story.related_ideas.includes(ideaNumber));
  if (!stories.length) {
    return '<option value="">No stories available for this idea</option>';
  }

  return stories
    .map(
      (story) => `
        <option value="${story.story_number}" ${
          story.story_number === selectedStory ? 'selected' : ''
        }>${ideaNumber}.${story.story_number} — ${escapeHtml(story.title)}</option>
      `
    )
    .join('');
}


