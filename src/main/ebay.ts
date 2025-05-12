import { app, BrowserWindow, ipcMain, Notification } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'
import { readFileSync } from 'fs'
import { parseStringPromise } from 'xml2js'

import {
    get_ebay_oauth,
    getEbayCredentials,
    refreshEbayOauth,
    setEbayCredentials,
    setEbayOauth
} from './dbmanager'

// oauth scopes for what api calls you can make
const scopes = [
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly'
]

const enum policyType {
    payment,
    fulfillment,
    return
}

// writes the oauth tokens to db
// and allows app to make calls on behalf of user
//invariant: should be called only after ebay credentials are listed
// if user messes
export async function ebay_oauth_flow(client_id, client_secret, redirect_uri) {
    const win = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    const ebayAuthToken = new EbayAuthToken({
        clientId: client_id,
        clientSecret: client_secret,
        redirectUri: redirect_uri,
        env: 'SANDBOX'
    })

    let flag = false

    const oauth_url = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes, {
        prompt: 'login'
    })

    // try the url
    await win.loadURL(oauth_url)

    // handles error from url
    const html = await win.webContents.executeJavaScript('document.documentElement.innerHTML')
    console.log(html.includes('error_id'))
    if (html.includes('error_id')) {
        new Notification({
            title: 'Ebay Credentials Error',
            body: 'Incorrect credentials supplied; Please try again'
        }).show()
        win.close()
        return
    }

    // assumes no error in url
    win.webContents.on('will-redirect', async (details) => {
        const access_code = new URL(details.url).searchParams.get('code')
        if (access_code && !flag) {
            flag = true
            const accessToken = await ebayAuthToken.exchangeCodeForAccessToken(
                'SANDBOX',
                access_code
            )
            console.log(accessToken)
            const response = JSON.parse(accessToken)
            // write access token to db
            setEbayOauth(
                response.access_token,
                response.expires_in,
                response.refresh_token,
                response.refresh_token_expires_in
            )
            setEbayCredentials(client_id, client_secret, redirect_uri)

            // ALLOW SELLING, i.e. access to selling apis

            const options = {
                hostname: 'api.sandbox.ebay.com',
                path: 'https://api.sandbox.ebay.com/sell/account/v1/program/get_opted_in_programs',
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + response.access_token,
                    Accept: 'application/json'
                }
            }

            const req = request(options, (res) => {
                let responseBody = ''

                res.on('data', (chunk) => {
                    responseBody += chunk
                })

                res.on('end', () => {
                    if (
                        !JSON.parse(responseBody).programs.includes({
                            programType: 'SELLING_POLICY_MANAGEMENT'
                        })
                    ) {
                        // make the call to open business

                        const data = `{  "programType": "SELLING_POLICY_MANAGEMENT" }`
                        const options = {
                            hostname: 'api.sandbox.ebay.com',
                            path: 'https://api.sandbox.ebay.com/sell/account/v1/program/opt_in',
                            method: 'POST',
                            headers: {
                                Authorization: 'Bearer ' + response.access_token,
                                Accept: 'application/json',
                                'Content-Type': 'application/json',
                                'Content-Length': data.length
                            }
                        }

                        const req = request(options, (res) => {})

                        req.write(data)

                        req.end()
                    }
                })
            })

            req.end()
            // set default policies if there aren't any
            make_policy(response.access_token, policyType.fulfillment)
            make_policy(response.access_token, policyType.payment)
            make_policy(response.access_token, policyType.return)
            return
        }
    })
}
//invariant: that access token and credentials exist
// checks if fulfillment, payment, or return policy exists
// if not then make a "basic", else do nothing
// type is return, payment, fulfillment
async function make_policy(oauth_token: string, type: policyType) {
    let get_uri
    let post_uri
    let data
    switch (type) {
        case policyType.fulfillment:
            get_uri =
                'https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US'
            post_uri = 'https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy'
            data = `{
  "categoryTypes": [
    {
      "name": "ALL_EXCLUDING_MOTORS_VEHICLES"
    }
  ],
  "marketplaceId": "EBAY_US",
  "name": "Domestic free shipping",
  "handlingTime": { 
    "unit" : "DAY",
    "value" : "1"
  },
  "shippingOptions": [
    {
      "costType": "FLAT_RATE",
      "optionType": "DOMESTIC",
      "shippingServices": [
        {
          "buyerResponsibleForShipping": "false",
          "freeShipping": "true",
          "shippingCarrierCode": "USPS",
          "shippingServiceCode": "USPSPriorityFlatRateBox"
        }
      ]
    }
  ]
}`
            break
        case policyType.payment:
            get_uri =
                'https://api.sandbox.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_US'
            post_uri = 'https://api.sandbox.ebay.com/sell/account/v1/payment_policy'
            data = `{
  "name": "minimal Payment Policy",
  "marketplaceId": "EBAY_US",
  "categoryTypes": [
    {
      "name": "ALL_EXCLUDING_MOTORS_VEHICLES"
    }
  ],
  "paymentMethods": [
    {
      "paymentMethodType": "PERSONAL_CHECK"
    }
  ]
}`
            break
        case policyType.return:
            get_uri =
                'https://api.sandbox.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_US'
            post_uri = 'https://api.sandbox.ebay.com/sell/account/v1/return_policy'
            data = `{
  "name": "minimal return policy, US marketplace",
  "marketplaceId": "EBAY_US",
  "refundMethod": "MONEY_BACK",
  "returnsAccepted": true,
  "returnShippingCostPayer": "SELLER",
  "returnPeriod": {
    "value": 30,
    "unit": "DAY"
  }
}`
            break
    }
    const options = {
        hostname: 'api.sandbox.ebay.com',
        path: get_uri,
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + oauth_token,
            Accept: 'application/json'
        }
    }
    const req = request(options, (res) => {
        let responseBody = ''

        res.on('data', (chunk) => {
            responseBody += chunk
        })

        res.on('end', () => {
            const options = {
                hostname: 'api.sandbox.ebay.com',
                path: post_uri,
                method: 'POST',
                headers: {
                    Authorization: 'Bearer ' + oauth_token,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            }

            if (
                (type === policyType.fulfillment &&
                    JSON.parse(responseBody).fulfillmentPolicies.length === 0) ||
                (type === policyType.payment &&
                    JSON.parse(responseBody).paymentPolicies.length === 0) ||
                (type === policyType.return && JSON.parse(responseBody).returnPolicies.length === 0)
            ) {
                const req = request(options, (res) => {})

                req.write(data)

                req.end()
            }
        })
    })
    req.end()
}

//invariant: that access token and credentials exist
//refresh token if needed
// check if oauth flow needs to be done, if this errors or refresh expires
async function refresh() {
    const oauth = get_ebay_oauth()
    if (Date.now() - oauth.oauth_created > oauth.oauth_expiry) {
        const ebayAuthToken = new EbayAuthToken({ ...getEbayCredentials()[0], env: 'SANDBOX' })
        const accessToken = await ebayAuthToken.getAccessToken(
            'SANDBOX',
            get_ebay_oauth().refresh_token,
            scopes
        )
        refreshEbayOauth(JSON.parse(accessToken).access_token, JSON.parse(accessToken).expires_in)
    }
}

// need ebay creds and oauth set up
// try to post image, then create inventory item, create offer and publish
// if any of those fail, notify user
// only write to db on a complete success
export async function post_listing(data) {
    // check if refresh required
    // await refresh()

    // IMAGE SELECTION CODE
    const fileData = readFileSync('t.jpeg')

    const boundary = '-b'
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="XMLRequest"\r\nContent-Type: text/xml\r\n\r\n
    `
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
        <UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <WarningLevel>High</WarningLevel>
        </UploadSiteHostedPicturesRequest>`

    body += xmlPayload + '\r\n'
    body += `--${boundary}\r\nContent-Disposition: form-data;\r\nContent-Type: image/jpeg\r\n\r\n`
    const ending = `\r\n--${boundary}--\r\n`

    const contentLength = body.length + fileData.length + ending.length

    const options = {
        hostname: 'api.sandbox.ebay.com',
        path: '/ws/api.dll',
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': contentLength,
            'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
            'X-EBAY-API-CALL-NAME': 'UploadSiteHostedPictures',
            'X-EBAY-API-IAF-TOKEN': `v^1.1#i^1#f^0#r^0#p^3#I^3#t^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`,
            'X-EBAY-API-SITEID': '0'
        }
    }

    const req = request(options, (res) => {
        let response = ''
        res.on('data', (chunk) => {
            response += chunk
        })
        res.on('end', async () => {
            console.log(response)
            const r = JSON.parse(JSON.stringify(await parseStringPromise(response)))
            console.log(r)
            // failure
            if (r.UploadSiteHostedPicturesResponse.Ack[0] === 'Failure') {
                new Notification({
                    title: 'Image Upload Error',
                    body: 'Issue with uploading the image; Change the image and try again'
                }).show()

                // success
            } else {
                console.log(
                    r.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0]
                )
            }
        })
    })

    req.write(body)
    req.write(fileData)
    req.write(ending)

    req.end()

    // create inventroy call

    // create offer call

    //pblsh offer call
}
