import { contextBridge, ipcRenderer } from 'electron/renderer'
import { electronAPI } from '@electron-toolkit/preload'

console.log('preload is running')

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', {
            // Include the default Electron API
            ...electronAPI,

            // Expose "invoke" for api communication for etsy button
            invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

            // Existing methods
            send: (channel, data) => ipcRenderer.send(channel, data),
            on: ( channel, func ) => ipcRenderer.on( channel, ( event, ...args ) => func( ...args ) ),
            ebay: () => ipcRenderer.send('ebay')
        }),
            //contextBridge.exposeInMainWorld('electron', electronAPI)
            //contextBridge.exposeInMainWorld('api', api)
            contextBridge.exposeInMainWorld('database', {
                getData: () => ipcRenderer.invoke('get-data'),
                insertData: (name: string) => ipcRenderer.invoke('insert-data', name),
                getTableNames: () => ipcRenderer.invoke('get-table-names'),
            }),
            // Optionally expose other APIs
            contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
