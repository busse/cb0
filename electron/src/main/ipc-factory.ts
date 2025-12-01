import { ipcMain, IpcMainInvokeEvent } from 'electron';

export type IpcResult<T> = { success: true; data: T } | { success: false; error: string };

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unknown error occurred';
}

export function handleAsync<T>(channel: string, handler: () => Promise<T>): void {
  ipcMain.handle(channel, async (): Promise<IpcResult<T>> => {
    try {
      return { success: true, data: await handler() };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  });
}

export function handleAsyncWithArgs<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (...args: TArgs) => Promise<TResult>
): void {
  ipcMain.handle(
    channel,
    async (_event: IpcMainInvokeEvent, ...args: TArgs): Promise<IpcResult<TResult>> => {
      try {
        return { success: true, data: await handler(...args) };
      } catch (error) {
        return { success: false, error: getErrorMessage(error) };
      }
    }
  );
}


