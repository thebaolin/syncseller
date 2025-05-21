import { contextBridge, ipcRenderer } from 'electron/renderer'
import { electronAPI } from '@electron-toolkit/preload'
import fs from 'fs'

console.log('preload is running')

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electronAPI', {
            openFileDialog: () => ipcRenderer.invoke('dialog:openFiles'),
            readImageAsBase64: (path) => {
                const data = fs.readFileSync(path)
                return `data:image/${path.split('.').pop()};base64,${data.toString('base64')}`
            }
        })

        contextBridge.exposeInMainWorld('electron', {
            // Include the default Electron API
            ...electronAPI,

            // Expose "invoke" for api communication for etsy button
            invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),

            // Existing methods
            send: (channel, data) => ipcRenderer.send(channel, data),
            on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
            setEbayCredentials: (
                client_id: string,
                client_secret: string,
                redirect_uri: string
            ) => {
                return ipcRenderer.invoke('set-ebay-creds', client_id, client_secret, redirect_uri)
            },
            getEbayPolicies: () => {
                return ipcRenderer.invoke('get-ebay-policies')
            },
            ebaycreds: () => {
                return ipcRenderer.invoke('creds')
            },
            warehouse: () => {
                return ipcRenderer.invoke('warehouse')
            },
            make_warehouse: (data) => {
                return ipcRenderer.invoke('make-warehouse', data)
            },
            post_ebay: (data) => {
                return ipcRenderer.invoke('post-ebay', data)
            },
            choose_policies: (data) => {
                ipcRenderer.invoke('choose-policies', data)
            },
            policy: () => {
                return ipcRenderer.invoke('policy')
            }
        }),

            contextBridge.exposeInMainWorld('database', {
                getData: () => ipcRenderer.invoke('get-data'),
                insertData: (name: string) => ipcRenderer.invoke('insert-data', name),
                getTableNames: () => ipcRenderer.invoke('get-table-names'),
                getEbayListing: () => ipcRenderer.invoke('get-ebay-listing'),
                selectDatabaseFile: () => ipcRenderer.invoke('select-db-file'),
                selectSaveLocation: () => ipcRenderer.invoke('select-db-save-location'),
                initializeDatabase: (password: string, isCreateMode: boolean, dbPath: string) =>
                    ipcRenderer.invoke('initialize-db', password, isCreateMode, dbPath),

                generateKey: () => ipcRenderer.invoke('generate-key'),
                insertFullListing: (data) => ipcRenderer.invoke('insert-full-listing', data),
                getListingHistory: () => ipcRenderer.invoke('get-listing-history'),
                getAnalyticsData: () => ipcRenderer.invoke('get-analytics-data'),
                getProfitByMonth: () => ipcRenderer.invoke('get-profit-by-month'),
                getSoldByPlatform: () => ipcRenderer.invoke('get-sold-by-platform')
            }),
            // expose shopify listing functionality
            contextBridge.exposeInMainWorld('shopifyAPI', {
                createShopifyListing: () => ipcRenderer.invoke('shopify:create-listing')
            })

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
