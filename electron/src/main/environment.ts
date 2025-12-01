import { app } from 'electron';
import * as path from 'path';

export const repoRoot = app.isPackaged
  ? path.resolve(process.resourcesPath, '..', '..')
  : path.resolve(__dirname, '../..');


