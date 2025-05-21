import { shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { app, BrowserWindow, ipcMain } from 'electron/main'
import { ebay_oauth_flow, get_policies, make_warehouse, post_listing } from './ebay'
import { createDummyShopifyListing } from './shopify'
import { setupEtsyOAuthHandlers } from './etsy'
import { pathToFileURL } from 'node:url'
import {
    initializeDatabase,
    getEbayCredentials,
    generateSecurityKey,
    insertFullListing,
    getListingHistory,
    closeDB,
    getAnalyticsData,
    set_policies,
    getEbayPolicies,
    getProfitByMonth,
    getSoldByPlatform
} from './dbmanager'

ipcMain.handle('shopify:create-listing', async () => {
    return await createDummyShopifyListing()
})


let mainWindow: BrowserWindow | null = null

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1000,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' || process.platform === 'win32' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    mainWindow.on('ready-to-show', () => {
        mainWindow.show()
    })

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

ipcMain.handle(
    'initialize-db',
    async (_event, password: string, isCreateMode: boolean, dbPath: string) => {
        try {
            initializeDatabase(password, isCreateMode, dbPath)
            return { success: true }
        } catch (error: any) {
            console.error('Database error:', error)
            return { success: false, error: error.message }
        }
    }
)

import { dialog } from 'electron'

ipcMain.handle('select-db-file', async () => {
    const result = await dialog.showOpenDialog({
        title: 'Select Your Database',
        properties: ['openFile'],
        filters: [{ name: 'SQLITE DB', extensions: ['db'] }]
    })
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0]
    } else {
        return null
    }
})

ipcMain.handle('select-db-save-location', async () => {
    const result = await dialog.showSaveDialog({
        title: 'Create New Database',
        defaultPath: 'app.db',
        filters: [{ name: 'SQLITE DB', extensions: ['db'] }]
    })

    return result.canceled ? null : result.filePath
})
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

ipcMain.handle('dialog:openFiles', async () => {
    try {
        if (mainWindow) {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ['openFile', 'multiSelections']
            })
            console.log('Filepaths: ', result.filePaths)
            return result.filePaths
        } else {
            console.log('mainWindow is null')
            return []
        }
    } catch (err) {
        console.error('Error opening dialog: ', err)
        return []
    }
})

app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    ipcMain.handle('set-ebay-creds', (e, client_id, client_secret, redirect_uri) => {
        return ebay_oauth_flow(client_id, client_secret, redirect_uri)
    })

    ipcMain.handle('make-warehouse', (e, data) => {
        return make_warehouse(data)
    })

    ipcMain.handle('post-ebay', (e, data) => {
        return post_listing(data)
    })

    ipcMain.handle('choose-policies', (e, data) => {
        set_policies(data)
    })

    ipcMain.handle('policy', async () => {
        if (typeof getEbayPolicies() === 'boolean') {
            return getEbayPolicies()
        }
        return getEbayPolicies().length !== 0
    })

    // returns true if warehouse exists
    ipcMain.handle('warehouse', async () => {
        const t = await getEbayCredentials()
        if (t.length === 0) {
            return false
        }
        return t[0].warehouse !== 0
    })

    // returns true if we have ebay creds
    ipcMain.handle('creds', async () => {
        const t = await getEbayCredentials()
        console.log(`creds: ${t.length !== 0}`)
        return t.length !== 0
    })

    createWindow()

    setupEtsyOAuthHandlers()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    //initializeDatabase();
})

// returns assorted ebay policies in JSON
ipcMain.handle('get-ebay-policies', async () => {
    return await get_policies()
})

ipcMain.handle('generate-key', async () => {
    return generateSecurityKey()
})

ipcMain.handle('insert-full-listing', async (_event, data) => {
    console.log(data)
    return insertFullListing(data)
})

ipcMain.handle('get-listing-history', async () => {
    return getListingHistory()
})

ipcMain.handle('get-analytics-data', async () => {
    return getAnalyticsData()
})

ipcMain.handle('get-profit-by-month', () => {
    return getProfitByMonth()
})

ipcMain.handle('get-sold-by-platform', () => {
    return getSoldByPlatform()
})
// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        closeDB()
        app.quit()
    }
})

// FOR TESTING, not being used
console.log('main process is running')

ipcMain.on('selected-files', (event, imageFiles) => {
    console.log('Received files from renderer:', imageFiles)
    const urls = imageFiles.map((filePath) => {
        return pathToFileURL(filePath).href
    })

    console.log('File URLs:', urls)
})

ipcMain.on('submit:todoForm', (event, args) => {
    console.log('Received form data:', args)
})
