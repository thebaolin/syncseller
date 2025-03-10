// global.d.ts
interface Window {
  electron: {
    getTableNames: () => Promise<string[]>;
    getTableRows: (tableName: string) => Promise<any[]>;
  };
}
