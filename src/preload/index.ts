import { contextBridge, ipcRenderer } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

console.log("preload is running");

// Custom APIs for renderer
const api = {};

// Expose APIs through `contextBridge` only if context isolation is enabled
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      // Function to fetch the table names
      getTableNames: () => ipcRenderer.invoke('get-table-names'),
      // Function to fetch rows for a specific table
      getTableRows: (tableName: string) => ipcRenderer.invoke('get-table-rows', tableName),
      send: (channel: string, data: any) => ipcRenderer.send(channel, data),
      on: (channel: string, func: Function) =>
        ipcRenderer.on(channel, (event, ...args) => func(...args)),
    });
  } catch (error) {
    console.error('Error exposing Electron API:', error);
  }
} else {
  // Fallback for non-isolated context (Not recommended for production)
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = api;
}
