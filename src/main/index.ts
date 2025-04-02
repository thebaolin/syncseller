import { shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { app, BrowserWindow, ipcMain } from 'electron/main'
import crypto from 'crypto'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'

const ETSY_CLIENT_ID = 'syncseller'
const ETSY_REDIRECT_URI = 'https://yourapp.com/oauth/callback'
const ETSY_SCOPES = 'transactions_r listings_r'
const STATE = crypto.randomBytes(16).toString('hex') // CSRF protection

const BASE_URL = 'https://api.ebay.com/sell/account/v1'

const POLICY_IDS = {
    fulfillmentPolicyId: '6208766000',
    paymentPolicyId: '6208767000',
    returnPolicyId: '6208771000',
};


function createWindow(): void {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 900,
        height: 670,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    // Set app user model id for windows
    electronApp.setAppUserModelId('com.electron')

    // Default open or close DevTools by F12 in development
    // and ignore CommandOrControl + R in production.
    // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    // IPC test
    ipcMain.on('ping', () => console.log('pong'))

    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    initializeDatabase();
})
import { getData, insertData, initializeDatabase, getTableNames, getEbayListing } from './dbmanager'


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
      const listing = getEbayListing();
      return listing;
    } catch (error) {
      console.error('Error fetching eBay listing:', error);
      throw error;
    }
  });

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// FOR TESTING, not being used
console.log('main process is running')
ipcMain.on('submit:todoForm', (event, args) => {
    console.log('Received form data:', args)
})

// Ebay Handling
// general one, pass as params the type of call and item of db
ipcMain.on('ebay', () => {
    const win = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    // hardcoded, should have values extracted from database; entered from user
    const ebayAuthToken = new EbayAuthToken({
        clientId: 'RandyLu-sand-SBX-e41907e53-a28e5f11',
        clientSecret: 'SBX-41907e53e228-9004-4bbf-81f5-a63c',
        redirectUri: 'Randy_Lu-RandyLu-sand-SB-domszhbw',
        env: 'SANDBOX'
    })
    // oauth scopes for what api calls you can make
    const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory',
        'https://api.ebay.com/oauth/api_scope/sell.account',
        'https://api.ebay.com/oauth/api_scope/sell.account.readonly'
    ]
    const oauth_url = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes, {
        prompt: 'login'
    })

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

                // extracted and populated from db entry x
                const data = `{
    "product": {
        "title": "BEEWB BEEWB BEEWB",
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
                    path: 'https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/505',
                    method: 'PUT',
                    headers: {
                        Authorization: 'Bearer ' + auth,
                        Accept: 'application/json',
                        'Content-Length': data.length,
                        'Content-Type': 'application/json',
                        'Content-Language': 'en-US'
                    }
                }

                const req = request(options, (res) => {
                    let responseBody = ''
                    res.on('data', (chunk) => { responseBody += chunk })
                    res.on('end', async () => {
                        console.log('Inventory Created:', responseBody)
                        const sku = '505'
                        const offerOptions = {
                            hostname: 'api.sandbox.ebay.com',
                            path: '/sell/inventory/v1/offer',
                            method: 'POST',
                            headers: {
                                Authorization: 'Bearer ' + auth,
                                'Content-Type': 'application/json',
                                'Content-Language': 'en-US'
                            }
                        }
                        const offerData = JSON.stringify({
                            sku,
                            marketplaceId: 'EBAY_US',
                            format: 'FIXED_PRICE',
                            listingPolicies: POLICY_IDS,
                            pricingSummary: { price: { currency: 'USD', value: '299.99' } },
                            quantityLimitPerBuyer: 1
                        })
                        const offerReq = request(offerOptions, (offerRes) => {
                            let offerBody = ''
                            offerRes.on('data', (chunk) => { offerBody += chunk })
                            offerRes.on('end', () => {
                                console.log('Offer Created:', offerBody)
                            })
                        })
                        offerReq.write(offerData)
                        offerReq.end()
                    })
                })
                req.write(data)
                req.end()
            }
        })
    })
})
