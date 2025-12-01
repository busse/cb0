import { handleAsyncWithArgs } from '../ipc-factory';
import { deleteFigure, deleteIdea, deleteNote, deleteSprint, deleteStory, deleteUpdate } from '../../shared/file-utils';

export function registerDeleteHandlers(): void {
  handleAsyncWithArgs('delete-idea', async (ideaNumber: number) => {
    await deleteIdea(ideaNumber);
  });

  handleAsyncWithArgs('delete-story', async (storyNumber: number) => {
    await deleteStory(storyNumber);
  });

  handleAsyncWithArgs('delete-sprint', async (sprintId: string) => {
    await deleteSprint(sprintId);
  });

  handleAsyncWithArgs('delete-update', async (sprintId: string, ideaNumber: number, storyNumber: number) => {
    await deleteUpdate(sprintId, ideaNumber, storyNumber);
  });

  handleAsyncWithArgs('delete-figure', async (figureNumber: number) => {
    await deleteFigure(figureNumber);
  });

  handleAsyncWithArgs('delete-note', async (filename: string) => {
    await deleteNote(filename);
  });
}


