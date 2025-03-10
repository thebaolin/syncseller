/// <reference types="vite/client" />

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        getTableNames: () => Promise<string[]>;  // Method to get table names
        getTableRows: (tableName: string) => Promise<any[]>;  // Method to get data from a table
      };
    };
  }
}
