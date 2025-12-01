import { registerReadHandlers } from './read-handlers';
import { registerWriteHandlers } from './write-handlers';
import { registerDeleteHandlers } from './delete-handlers';
import { registerUtilityHandlers } from './utility-handlers';

export function registerAllHandlers(): void {
  registerReadHandlers();
  registerWriteHandlers();
  registerDeleteHandlers();
  registerUtilityHandlers();
}


