import { app, BrowserWindow, ipcMain, Notification } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'
import { readFileSync } from 'fs'
import { basename } from 'node:path'

import {
    deleteEbayCredentials,
    get_ebay_oauth,
    getEbayCredentials,
    refreshEbayOauth,
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
export async function ebay_oauth_flow() {
    const win = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
    })

    const ebayAuthToken = new EbayAuthToken({ ...getEbayCredentials()[0], env: 'SANDBOX' })

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
        deleteEbayCredentials()
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
async function refresh() {
    const ebayAuthToken = new EbayAuthToken({ ...getEbayCredentials()[0], env: 'SANDBOX' })
    const accessToken = await ebayAuthToken.getAccessToken(
        'SANDBOX',
        get_ebay_oauth().refresh_token,
        scopes
    )
    refreshEbayOauth(JSON.parse(accessToken).access_token, JSON.parse(accessToken).expires_in)
}

export async function post_image() {
    // check if refresh required

    // IMAGE SELECTION CODE
    const img_name = 't.jpeg'
    const fileData = readFileSync(img_name)
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
            'X-EBAY-API-IAF-TOKEN':
                `v^1.1#i^1#I^3#f^0#r^0#p^3#t^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`,
            'X-EBAY-API-SITEID': '0'
        }
    }

    const req = request(options, (res) => {
        let response = ''
        res.on('data', (chunk) => {
            response += chunk
        })
        res.on('end', () => {
            console.log(response)
        })
    })

    // Error handle?

    req.write(body)
    req.write(fileData)
    req.write(ending)

    req.end()
}
