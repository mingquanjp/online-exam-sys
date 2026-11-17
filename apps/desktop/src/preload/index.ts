import { contextBridge } from 'electron';
import type { DesktopAPI } from '../shared/desktop-api';

const desktopAPI: DesktopAPI = Object.freeze({ stage: 'foundation' });
contextBridge.exposeInMainWorld('desktop', desktopAPI);
