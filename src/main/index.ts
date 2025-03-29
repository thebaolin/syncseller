import { shell } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createListing } from './ebay'
import { app, BrowserWindow, ipcMain } from 'electron/main'
import crypto from 'crypto'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'

const ETSY_CLIENT_ID = 'syncseller'
const ETSY_REDIRECT_URI = 'https://yourapp.com/oauth/callback'
const ETSY_SCOPES = 'transactions_r listings_r'
const STATE = crypto.randomBytes(16).toString('hex') // CSRF protection

let etsyAuthWindow: BrowserWindow | null = null

function generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url')
}

//Request an Authorization Code
ipcMain.handle('start-etsy-oauth', () => {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Store codeVerifier locally for now until Db is set up
    require('fs').writeFileSync('etsy_code_verifier.txt', codeVerifier)

    //https://developers.etsy.com/documentation/essentials/authentication#redirect-uris
    const authUrl = `https://www.etsy.com/oauth/connect?
        response_type=code&
        client_id=${ETSY_CLIENT_ID}&
        redirect_uri=${encodeURIComponent(ETSY_REDIRECT_URI)}&
        scope=${encodeURIComponent(ETSY_SCOPES)}&
        state=${STATE}&
        code_challenge=${codeChallenge}&
        code_challenge_method=S256`

    etsyAuthWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    etsyAuthWindow.loadURL(authUrl) // Load authUrl into the new browser window

    // Listen for redirect navigation event (when Etsy redirects user back to redirect_uri after auth)
    etsyAuthWindow.webContents.on('did-redirect-navigation', async (event, url) => {
        const urlParams = new URL(url).searchParams
        const authCode = urlParams.get('code')

        if (authCode) {
            const accessToken = await exchangeEtsyCodeForToken(authCode)
            console.log('Etsy Access Token:', accessToken)

            // Store access token
            require('fs').writeFileSync('etsy_token.json', JSON.stringify(accessToken))

            etsyAuthWindow?.close()
            etsyAuthWindow = null
        }
    })
})

// Request Access Token
// Exchanges the auth code for an access token using Etsy's API
async function exchangeEtsyCodeForToken(code: string) {
    const codeVerifier = require('fs').readFileSync('etsy_code_verifier.txt', 'utf-8')

    return new Promise((resolve, reject) => {
        const postData = `grant_type=authorization_code&
            client_id=${ETSY_CLIENT_ID}&
            redirect_uri=${encodeURIComponent(ETSY_REDIRECT_URI)}&
            code=${code}&
            code_verifier=${codeVerifier}`

        const options = {
            hostname: 'api.etsy.com',
            path: '/v3/public/oauth/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }

        const req = request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => (data += chunk))
            res.on('end', () => resolve(JSON.parse(data)))
        })

        req.on('error', reject)
        req.write(postData)
        req.end()
    })
}


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
import { getData, insertData, initializeDatabase } from './dbmanager'

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

                // End the request
                req.end()

                win.loadURL('https://sandbox.ebay.com/itm/110579720432')

                // store into the db somehow
                return
            }
        })
    })
})
