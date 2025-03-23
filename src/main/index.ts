import { shell, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createListing } from './ebay'
import { app, BrowserWindow, ipcMain} from 'electron/main'
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

import { getData, insertData } from './dbmanager'

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

    // EBAY
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
ipcMain.handle('ebay-listing', () => {
    // check if ebay api credentials are there, if not have them fill out a form and store to db

    // if ebay api is there but no oauth available

    const win = new BrowserWindow({
        width: 800,
        height: 800,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    })
    // pull all user values from the database
    const ebayAuthToken = new EbayAuthToken({
        clientId: 'RandyLu-sand-SBX-e41907e53-a28e5f11',
        clientSecret: 'SBX-41907e53e228-9004-4bbf-81f5-a63c',
        redirectUri: 'Randy_Lu-RandyLu-sand-SB-domszhbw',
        env: 'SANDBOX'
    })
    // oauth scopes for what api calls you can make, are defaults for user
    const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory'
    ]
    const ebay_url = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes, {
        prompt: 'login'
    })

    win.loadURL(ebay_url).then(() => {
        win.webContents.addListener('did-redirect-navigation', async (details) => {
            const access_code = new URL(details.url).searchParams.get('code')
            if (access_code) {
                // is this https?, replace with own code
                const accessToken = await ebayAuthToken.exchangeCodeForAccessToken(
                    'SANDBOX',
                    access_code
                )
                // store into db with time stamps
                console.log(accessToken)
                win.on('closed', () => {
                    win.webContents.close()
                })
                win?.close()
            }
        })
    })

    win.setBounds({ x: 0, y: 0, width: 800, height: 800 })

    // check if token is fresh otherwise refresh it

    // processing of the ebay request
    // pattern match to determine what to do
    // extracted fields from db
    // build the json string incrementally
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
    const options = {
        hostname: 'api.sandbox.ebay.com',
        path: 'https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/50',
        method: 'PUT',
        headers: {
            Authorization:
                'Bearer v^1.1#i^1#p^3#f^0#I^3#r^0#t^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',
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

    // update the db based on the outcome of the request
})
