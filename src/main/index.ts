import { shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { app, BrowserWindow, ipcMain } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'
import { ebay_oauth_flow, get_policies, make_warehouse, post_listing } from './ebay'
import { createDummyShopifyListing } from './shopify'
import { setupEtsyOAuthHandlers } from './etsy'
import { pathToFileURL } from 'node:url'

ipcMain.handle('shopify:create-listing', async () => {
    return await createDummyShopifyListing()
})

// oauth scopes for what api calls you can make
const scopes = [
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly'
]

const BASE_URL = 'https://api.ebay.com/sell/account/v1'
const HEADERS = (auth: string) => ({
    Authorization: `Bearer ${auth}`,
    'Content-Type': 'application/json',
    Accept: 'application/json'
})

async function fetchPolicies(endpoint: string, auth: string) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.ebay.com',
            path: `/sell/account/v1/${endpoint}`,
            method: 'GET',
            headers: HEADERS(auth)
        }

        const req = request(options, (res) => {
            let responseBody = ''

            res.on('data', (chunk) => {
                responseBody += chunk
            })

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(responseBody)
                    resolve(jsonData)
                } catch (error) {
                    reject(error)
                }
            })
        })

        req.on('error', (e) => reject(e))
        req.end()
    })
}

async function getPolicyIDs(auth: string) {
    try {
        const [fulfillment, payment, returnPolicy] = await Promise.all([
            fetchPolicies('fulfillment_policy', auth),
            fetchPolicies('payment_policy', auth),
            fetchPolicies('return_policy', auth)
        ])

        return {
            fulfillmentPolicyId: fulfillment.policies?.[0]?.fulfillmentPolicyId || null,
            paymentPolicyId: payment.policies?.[0]?.paymentPolicyId || null,
            returnPolicyId: returnPolicy.policies?.[0]?.returnPolicyId || null
        }
    } catch (error) {
        console.error('Error fetching policy IDs:', error)
        return null
    }
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
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
        ebay_oauth_flow(client_id, client_secret, redirect_uri)
    })

    ipcMain.handle('make-warehouse', (e, data) => {
        make_warehouse(data)
    })

    ipcMain.handle('post-ebay', (e, data) => {
        post_listing(data)
    })

    ipcMain.handle('choose-policies', (e, data) => {
        set_policies(data)
    })

    // returns true if warehouse exists
    ipcMain.handle('warehouse', async () => {
        const t = await getEbayCredentials()
        if (t.length !== 0) {
            return false
        } else {
            return t[0].warehouse !== 0
        }
    })

    // returns true if we have ebay creds
    ipcMain.handle('creds', async () => {
        const t = await getEbayCredentials()
        console.log(`creds: ${t.length !== 0}`)
        return t.length !== 0
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    createWindow()

    setupEtsyOAuthHandlers()

    // get_policies()
    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    //initializeDatabase();
})
import {
    getData,
    insertData,
    initializeDatabase,
    getTableNames,
    getEbayListing,
    getEbayCredentials,
    setEbayCredentials,
    get_ebay_oauth,
    generateSecurityKey,
    setEbayOauth,
    insertFullListing,
    getListingHistory,
    closeDB,
    getAnalyticsData,
    warehouse,
    set_policies
} from './dbmanager'

// Listen for the 'create-listing' message from the rendering thing
ipcMain.handle('create-listing', async () => {
    await createListing()
    return 'Listing creation triggered'
})
// Handle "get-data" event
ipcMain.handle('get-data', async () => {
    return getData() // Return data to the renderer
})

// Handle "insert-data" event
ipcMain.handle('insert-data', async (_, name: string) => {
    insertData(name)
})

ipcMain.handle('get-table-names', () => {
    return getTableNames()
})

ipcMain.handle('get-ebay-listing', async () => {
    try {
        const listing = getEbayListing()
        return listing
    } catch (error) {
        console.error('Error fetching eBay listing:', error)
        throw error
    }
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
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

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

ipcMain.on('ebay', async () => {
    const ebayAuthToken = new EbayAuthToken({
        clientId: 'RandyLu-sand-SBX-e41907e53-a28e5f11',
        clientSecret: 'SBX-41907e53e228-9004-4bbf-81f5-a63c',
        redirectUri: 'Randy_Lu-RandyLu-sand-SB-domszhbw',
        env: 'SANDBOX'
    })
    // oauth scopes for what api calls you can make

    // gets an authorization token for the user
    win.loadURL(oauth_url).then(() => {
        win.webContents.on('did-redirect-navigation', async (details) => {
            const access_code = new URL(details.url).searchParams.get('code')
            if (access_code) {
                const accessToken = await ebayAuthToken.exchangeCodeForAccessToken(
                    'SANDBOX',
                    access_code
                )
                console.log(accessToken)
                const auth = JSON.parse(accessToken).access_token
                console.log(auth)

                const policyIDs = await getPolicyIDs(auth)
                console.log('Policy IDs:', policyIDs)

                // extracted and populated from db entry x
                const data = `{
    "product": {
        "title": "Test listing - do not bid or buy - awesome Apple watch test 2",
        "aspects": {
            "Feature":[
              "Water resistance", "GPS"
            ],
            "CPU":[
              "Dual-Core Processor"
            ]
        },
        "description": "Test listing - do not bid or buy. Built-in GPS. Water resistance to 50 meters.1 A new lightning-fast dual-core processor. And a display that is two times brighter than before. Full of features that help you stay active, motivated, and connected, Apple Watch Series 2 is designed for all the ways you move ",
        "upc": ["888462079525"],
        "imageUrls": [
            "http://store.storeimages.cdn-apple.com/4973/as-images.apple.com/is/image/AppleInc/aos/published/images/S/1/S1/42/S1-42-alu-silver-sport-white-grid?wid=332&hei=392&fmt=jpeg&qlt=95&op_sharpen=0&resMode=bicub&op_usm=0.5,0.5,0,0&iccEmbed=0&layer=comp&.v=1472247758975",
            "http://store.storeimages.cdn-apple.com/4973/as-images.apple.com/is/image/AppleInc/aos/published/images/4/2/42/stainless/42-stainless-sport-white-grid?wid=332&hei=392&fmt=jpeg&qlt=95&op_sharpen=0&resMode=bicub&op_usm=0.5,0.5,0,0&iccEmbed=0&layer=comp&.v=1472247760390",
            "http://store.storeimages.cdn-apple.com/4973/as-images.apple.com/is/image/AppleInc/aos/published/images/4/2/42/ceramic/42-ceramic-sport-cloud-grid?wid=332&hei=392&fmt=jpeg&qlt=95&op_sharpen=0&resMode=bicub&op_usm=0.5,0.5,0,0&iccEmbed=0&layer=comp&.v=1472247758007"
        ]
    },
    "condition": "NEW",
    "packageWeightAndSize": {
        "dimensions": {
            "height": 5,
            "length": 10,
            "width": 15,
            "unit": "INCH"
        },
        "packageType": "MAILING_BOX",
        "weight": {
            "value": 2,
            "unit": "POUND"
        }
    },
    "availability": {
        "shipToLocationAvailability": {
            "quantity": 10
        }
    }
}`

                // Define the options for the HTTPS request
                const options = {
                    hostname: 'api.sandbox.ebay.com',
                    path: 'https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/50',
                    method: 'PUT',
                    headers: {
                        Authorization: 'Bearer ' + auth,
                        Accept: 'application/json',
                        'Content-Length': data.length,
                        'Content-Type': 'application/json',
                        'Content-Language': 'en-US'
                    }
                }

                // REPLACE WITH RESPONSE HANDLING CODE
                // Create the request
                const req = request(options, (res) => {
                    let responseBody = ''

                    // Listen for data from the response
                    res.on('data', (chunk) => {
                        responseBody += chunk
                    })

                    // Listen for the end of the response
                    res.on('end', () => {
                        console.log('Response:', responseBody)
                    })
                })

                // Handle any errors with the request
                req.on('error', (e) => {
                    console.error(`Problem with request: ${e.message}`)
                })

                // Write data to the request body
                req.write(data)

                req.end()

                win.loadURL('https://sandbox.ebay.com/itm/110579720432')

                // store into the db somehow
                return
            }
        })
    })
})
