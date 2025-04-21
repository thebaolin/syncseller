import { app, BrowserWindow, ipcMain } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'
import { Buffer } from 'node:buffer'

import { get_ebay_oauth, getEbayCredentials, refreshEbayOauth, setEbayOauth } from './dbmanager'

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

    const ebayAuthToken = new EbayAuthToken({ ...getEbayCredentials(), env: 'SANDBOX' })

    let flag = false

    const oauth_url = ebayAuthToken.generateUserAuthorizationUrl('SANDBOX', scopes, {
        prompt: 'login'
    })

    // gets an authorization token for the user
    await win.loadURL(oauth_url)
    // page is a json with error if wrong url
    // handle error here
    // delete entry from db
    // ask them to try again

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

            await make_policy(response.access_token, policyType.fulfillment)
            await make_policy(response.access_token, policyType.payment)
            await make_policy(response.access_token, policyType.return)
            await refresh()
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
    const ebayAuthToken = new EbayAuthToken({ ...getEbayCredentials(), env: 'SANDBOX' })
    const accessToken = await ebayAuthToken.getAccessToken(
        'SANDBOX',
        get_ebay_oauth().refresh_token,
        scopes
    )
    refreshEbayOauth(JSON.parse(accessToken).access_token, JSON.parse(accessToken).expires_in)
}
