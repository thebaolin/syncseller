import { app, BrowserWindow, ipcMain } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'

import { getEbayCredentials, setEbayOauth } from './dbmanager'

// oauth scopes for what api calls you can make
const scopes = [
    'https://api.ebay.com/oauth/api_scope/sell.inventory.readonly',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.account',
    'https://api.ebay.com/oauth/api_scope/sell.account.readonly'
]

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

            // make default policies

            {
                const options = {
                    hostname: 'api.sandbox.ebay.com',
                    path: 'https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US',
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
                        if (JSON.parse(responseBody).fulfillmentPolicies.length === 0) {
                            // make the call to make defaults

                            const data = `{
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
            }
            // make default business
            { }
            
            //make default return policy

            return
        }
    })
}
