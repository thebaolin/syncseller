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
}

// need ebay credentials and oauth set up
// try to post image, then create inventory item, create offer and publish
// if any of those fail, notify user
// only write to db on a complete success
export async function post_listing() {
    // check if refresh required
    // await refresh()

    // we iterate over this for each image path
    // if any image fails, send a message to user and exit
    // await post_image('t.jpeg')
    await create_inventory_item()

    // create inventory call

    // create offer call

    //publish offer call
}
async function post_image(path: string): Promise<string | undefined> {
    // constructs the request body
    const fileData = readFileSync(path)
    const boundary = '-b'
    let body = `--${boundary}\r\nContent-Disposition: form-data; name="XMLRequest"\r\nContent-Type: text/xml\r\n\r\n`
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
        <UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <WarningLevel>High</WarningLevel>
        </UploadSiteHostedPicturesRequest>`
    body += xmlPayload + '\r\n'
    body += `--${boundary}\r\nContent-Disposition: form-data;\r\nContent-Type: image/jpeg\r\n\r\n`
    const ending = `\r\n--${boundary}--\r\n`
    const b = Buffer.concat([Buffer.from(body, 'utf8'), fileData, Buffer.from(ending, 'utf-8')])
    const contentLength = b.length

    // make the request
    const response = await fetch('https://api.sandbox.ebay.com/ws/api.dll', {
        method: 'POST',
        headers: {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': `${contentLength}`,
            'X-EBAY-API-COMPATIBILITY-LEVEL': '967',
            'X-EBAY-API-CALL-NAME': 'UploadSiteHostedPictures',
            'X-EBAY-API-IAF-TOKEN': `v^1.1#i^1#I^3#f^0#r^0#p^3#t^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`,
            'X-EBAY-API-SITEID': '0'
        },
        body: b
    })
    const data = JSON.parse(JSON.stringify(await parseStringPromise(await response.text())))
    if (data.UploadSiteHostedPicturesResponse.Ack[0] === 'Failure') {
        new Notification({
            title: 'Image Upload Error',
            body: 'Issue with uploading the image; Change the image and try again'
        }).show()
        return undefined
    } else {
        console.log(data.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0])
        return data.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0]
    }
}

// take in what???
// Data json which we have to selectively parse? or front end gives the correct ones...
export async function create_inventory_item() {
    const sku = 50
    const content = `{
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
        "description": "Test listing - do not bid or buy Built-in GPS. Water resistance to 50 meters.1 A new lightning-fast dual-core processor. And a display thats two times brighter than before. Full of features that help you stay active, motivated, and connected, Apple Watch Series 2 is designed for all the ways you move ",
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
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${sku}`,
        {
            method: 'PUT',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': 'en-US',
                'Content-Language': 'en-US',
                'Content-Length': `${content.length}`,
                Authorization:
                    'Bearer ' +
                    `v^1.1#i^1#I^3#f^0#r^0#p^3#t^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`
            },
            body: content
        }
    )

    console.log( 'lel' )
    console.log( response.status )
    if ( response.status !== 204 ) {
        console.log( "problem" )
        new Notification({
            title: 'Listing Post Error',
            body: 'Issue with Listing Post; Check that field information is correct; Please try again'
        }).show()
        return false
    }
    return true
}

// pass sku and json blob containing everything else?
export async function publish_offer () {
    
    
}