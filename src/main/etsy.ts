import { BrowserWindow, ipcMain } from 'electron'
import { request } from 'node:https'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

// Etsy App Credentials
const ETSY_CLIENT_ID = process.env.ETSY_CLIENT_ID!
const ETSY_REDIRECT_URI = process.env.ETSY_REDIRECT_URI!
const ETSY_SCOPES = process.env.ETSY_SCOPES! || 'listings_r listings_w' // default if not set
const STATE = crypto.randomBytes(16).toString('hex')

let etsyAuthWindow: BrowserWindow | null = null

function generateCodeVerifier(): string {
  return crypto.randomBytes(32).toString('base64url')
}

function generateCodeChallenge(verifier: string): string {
  return crypto.createHash('sha256').update(verifier).digest('base64url')
}

// Start Etsy OAuth Flow
export function setupEtsyOAuthHandlers() {
  ipcMain.handle('start-etsy-oauth', async () => {
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = generateCodeChallenge(codeVerifier)

    // Save verifier locally (temporary, should later encrypt/save securely)
    fs.writeFileSync(path.join(__dirname, 'etsy_code_verifier.txt'), codeVerifier)

    const authUrl = `https://www.etsy.com/oauth/connect?` +
      `response_type=code&` +
      `client_id=${ETSY_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(ETSY_REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(ETSY_SCOPES)}&` +
      `state=${STATE}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=S256`

    etsyAuthWindow = new BrowserWindow({
      width: 800,
      height: 600,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    etsyAuthWindow.loadURL(authUrl)

    etsyAuthWindow.webContents.on('did-redirect-navigation', async (event, url) => {
      try {
        const urlParams = new URL(url).searchParams
        const authCode = urlParams.get('code')
        const stateReturned = urlParams.get('state')

        if (!authCode) {
          console.error('No auth code returned from Etsy OAuth')
          return
        }

        if (stateReturned !== STATE) {
          console.error('State mismatch. Possible CSRF attack.')
          return
        }

        const accessToken = await exchangeEtsyCodeForToken(authCode)

        console.log('Etsy Access Token:', accessToken)

        // Save token locally (temporary, should later encrypt/save securely)
        fs.writeFileSync(path.join(__dirname, 'etsy_token.json'), JSON.stringify(accessToken))

        etsyAuthWindow?.close()
        etsyAuthWindow = null
      } catch (err) {
        console.error('OAuth redirect handling error:', err)
      }
    })
  })
}

// Exchange Authorization Code for Access Token
async function exchangeEtsyCodeForToken(code: string): Promise<any> {
  const codeVerifier = fs.readFileSync(path.join(__dirname, 'etsy_code_verifier.txt'), 'utf-8')

  const postData = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: ETSY_CLIENT_ID,
    redirect_uri: ETSY_REDIRECT_URI,
    code,
    code_verifier: codeVerifier
  }).toString()

  return new Promise((resolve, reject) => {
    const req = request({
      hostname: 'api.etsy.com',
      path: '/v3/public/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (err) {
          reject(err)
        }
      })
    })

    req.on('error', (err) => reject(err))
    req.write(postData)
    req.end()
  })
}
