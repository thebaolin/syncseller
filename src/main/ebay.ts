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
            'X-EBAY-API-DEV-NAME': '39a70227-83cc-4cf6-98b4-32af21d8bfaa',
            'X-EBAY-API-APP-NAME': 'RandyLu-sand2-SBX-125961f57-3f56f0af',
            'X-EBAY-API-CERT-NAME': 'SBX-25961f57c361-540e-4776-9142-c734',
            'X-EBAY-API-CALL-NAME': 'UploadSiteHostedPictures',
            'X-EBAY-API-IAF-TOKEN':
                'v^1.1#i^1#f^0#p^3#r^0#I^3#t^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',
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
