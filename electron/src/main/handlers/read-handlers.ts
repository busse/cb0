import { handleAsync } from '../ipc-factory';
import { readIdeas, readStories, readSprints, readUpdates, readFigures } from '../../shared/file-utils';

export function registerReadHandlers(): void {
  handleAsync('read-ideas', readIdeas);
  handleAsync('read-stories', readStories);
  handleAsync('read-sprints', readSprints);
  handleAsync('read-updates', readUpdates);
  handleAsync('read-figures', readFigures);
}


