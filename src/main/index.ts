import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { createListing } from './ebay'
import { BaseWindow, WebContentsView } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import crypto from 'crypto'
import { request } from 'https'


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
        webPreferences: { nodeIntegration: false }
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

// Listen for the 'create-listing' message from the rendering thing
ipcMain.handle('create-listing', async () => {
    await createListing()
    return 'Listing creation triggered'
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

    // copied and pasted from electron docs on webcontentsview
    // https://www.electronjs.org/docs/latest/api/web-contents-view
    const win = new BaseWindow({ width: 400, height: 400 })
    const view1 = new WebContentsView()
    win.contentView.addChildView(view1)

    // hardcoded, should have values extracted from database
    const ebayAuthToken = new EbayAuthToken({
        clientId: 'PaulinaC-syncsell-SBX-d39433da4-724d7cb9',
        clientSecret: 'SBX-39433da48341-4a4f-4a4d-9860-dcab',
        redirectUri: 'Paulina_Chang-PaulinaC-syncse-mqstgd',
        env: 'SANDBOX'
    })
    // oauth scopes for what api calls you can make
    const scopes = [
        'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
        'https://api.ebay.com/oauth/api_scope/sell.inventory'
    ]
    const oauth_url = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes, {
        prompt: 'login'
    })

    // gets an authorization token from the user
    view1.webContents.loadURL(oauth_url).then(() => {
        view1.webContents.addListener('did-redirect-navigation', async (details) => {
            for (const part of details.url.split('&')) {
                if (part.startsWith('code=')) {
                    const accessToken = await ebayAuthToken.exchangeCodeForAccessToken(
                        'SANDBOX',
                        part.replace('code=', '')
                    )
                    console.log(accessToken)
                    break
                    // store into the db somehow
                }
            }
        })
    })

    view1.setBounds({ x: 0, y: 0, width: 400, height: 400 })
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
