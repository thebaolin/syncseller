import { BrowserWindow, Notification } from 'electron/main'
import EbayAuthToken from 'ebay-oauth-nodejs-client'
import { request } from 'node:https'
import { readFileSync } from 'fs'
import { parseStringPromise } from 'xml2js'

import {
    get_ebay_oauth,
    getEbayCredentials,
    refreshEbayOauth,
    setEbayCredentials,
    setEbayOauth,
    set_warehouse,
    getEbayPolicies
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
    console.log(oauth_url)

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
        return false
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
            return true
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

// need ebay credentials and oauth set up
// try to post image, then create inventory item, create offer and publish
// if any of those fail, notify user
// only write to db on a complete success
export async function post_listing(data) {
    // check if refresh required
    await refresh()

    // process image urls first
    if (data.imageURL.includes(',')) {
        data.imageURL = await Promise.all(
            data.imageURL.split(',').map((elem) => {
                return post_image(elem)
            })
        )
        if (
            data.imageURL.find((elem) => {
                return elem === 'Error'
            }) !== undefined
        ) {
            return false
        }
    } else {
        data.imageURL = await post_image(data.imageURL)
        if (data.imageURL === 'Error') {
            return false
        }
    }
    console.log(data)

    // create inventory call
    if (!(await create_inventory_item(data))) {
        return false
    }

    // create offer call
    const offerid = await create_offer(data)
    if (offerid === undefined) {
        return false
    }
    console.log(offerid)

    //publish offer call
    return publish_offer(offerid)
}
export async function post_image(path: string): Promise<string> {
    // constructs the request body
    await refresh()
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
            'X-EBAY-API-IAF-TOKEN': `${get_ebay_oauth().oauth_token}`,
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
        return 'Error'
    } else {
        console.log(data.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0])
        return data.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0]
    }
}

// Data json which we have to selectively parse? or front end gives the correct ones...
export async function create_inventory_item(data) {
    let condition
    if (data.condition === 'New with tags' || data.condition === 'New without tags') {
        condition = 'NEW'
    } else if (data.condition === 'New with imperfections') {
        condition = 'LIKE_NEW'
    } else if (data.condition === 'Pre-owned: Excellent') {
        condition = 'USED_EXCELLENT'
    } else if (data.condition === 'Pre-owned - Good') {
        condition = 'USED_GOOD'
    } else {
        condition = 'USED_ACCEPTABLE'
    }

    let unit: string
    if (data.unit === 'inches') {
        unit = 'INCH'
    } else {
        unit = 'CENTIMETER'
    }
    let wunit
    if (data.weightUnit === 'pounds') {
        wunit = 'POUND'
    } else if (data.weightUnit === 'ounces') {
        wunit = 'OUNCE'
    } else if (data.weightUnit === 'grams') {
        wunit = 'GRAM'
    } else {
        wunit = 'KILOGRAM'
    }
    const content = `{
    "product": {
        "title": "${data.title}",
        "description": "${data.description}",
        "imageUrls": ${imgurl(data.imageURL)}
    },
    "condition": "${condition}",
    "packageWeightAndSize": {
        "dimensions": {
            "height": "${data.height}",
            "length": "${data.length}",
            "width": "${data.width}",
            "unit": "${unit}"
        },
        "weight": {
            "value": "${data.weight}",
            "unit": "${wunit}"
        }
    },
    "availability": {
        "shipToLocationAvailability": {
            "quantity": "${data.quantity}"
        }
    }
}`
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/inventory/v1/inventory_item/${data.sku}`,
        {
            method: 'PUT',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Accept-Language': 'en-US',
                'Content-Language': 'en-US',
                'Content-Length': `${content.length}`,
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            },
            body: content
        }
    )

    console.log(content)
    console.log(response.status)
    if (response.status !== 204) {
        console.log(await response.json())
        new Notification({
            title: 'Listing Post Error',
            body: 'Issue with Listing Post; Check that field information is correct; Please try again'
        }).show()
        return false
    }
    return true
}

function imgurl(data) {
    if (typeof data !== 'string') {
        let s = '['
        for (const url of data) {
            s += '"'
            s += url
            s += '"'
            s += ','
        }
        s = s.substring(0, s.length - 1)
        s += ']'
        return s
    } else {
        return '[' + '"' + data + '"' + ']'
    }
}

// pass sku and json blob containing everything else?
export async function publish_offer(id) {
    await refresh()
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/inventory/v1/offer/${id}/publish`,
        {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en-US',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        }
    )
    if (response.status !== 200) {
        console.log(await response.json())
        await refresh()
        await fetch(`https://api.sandbox.ebay.com/sell/inventory/v1/offer/${id}`, {
            method: 'DELETE',
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en-US',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        })
        return false
    }
    const lid = (await response.json()).listingId
    return `https://sandbox.ebay.com/itm/${lid}`
}

async function create_offer(data) {
    await refresh()
    const policies = getEbayPolicies()[0]
    const content = `
{
    "sku": "${data.sku}",
    "marketplaceId": "EBAY_US",
    "format": "FIXED_PRICE",
    "quantityLimitPerBuyer": 1,
    "pricingSummary": {
        "price": {
            "value": "${data.price}",
            "currency": "USD"
        }
    },
    "listingPolicies": {
        "fulfillmentPolicyId": "${policies.fulfillment}",
        "paymentPolicyId": "${policies.payment}",
        "returnPolicyId": "${policies.return}"
    },
    "categoryId": "165260",
    "merchantLocationKey": "${policies.warehouse}"
}`
    console.log(content)
    const response = await fetch(`https://api.sandbox.ebay.com/sell/inventory/v1/offer`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'en-US',
            'Content-Language': 'en-US',
            'Content-Length': `${content.length}`,
            Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
        },
        body: content
    })
    if (response.status !== 201) {
        console.log(await response.json())
        new Notification({
            title: 'Offer publishing Error',
            body: 'Incorrect information supplied; Please try again'
        }).show()
        return undefined
    }
    return (await response.json()).offerId
}

export async function get_policies() {
    return {
        payment: await get_payment(),
        fulfillment: await get_fulfillment(),
        return: await get_return(),
        warehouse: await get_warehouse()
    }
}

async function get_fulfillment() {
    await refresh()
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/account/v1/fulfillment_policy?marketplace_id=EBAY_US`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        }
    )
    return (await response.json()).fulfillmentPolicies.map((elem) => [
        elem.name,
        elem.fulfillmentPolicyId
    ])
}

async function get_payment() {
    await refresh()
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/account/v1/payment_policy?marketplace_id=EBAY_US`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        }
    )
    return (await response.json()).paymentPolicies.map((elem) => [elem.name, elem.paymentPolicyId])
}

async function get_return() {
    await refresh()
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/account/v1/return_policy?marketplace_id=EBAY_US`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        }
    )
    return (await response.json()).returnPolicies.map((elem) => [elem.name, elem.returnPolicyId])
}

async function get_warehouse() {
    await refresh()
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/inventory/v1/location?limit=20&offset=0`,
        {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token
            }
        }
    )

    return (await response.json()).locations
        .filter((elem) => elem.merchantLocationStatus === 'ENABLED')
        .map((elem) => [elem.name, elem.merchantLocationKey])
}

export async function make_warehouse(data) {
    await refresh()
    const content = `{
        "location": {
            "address": {
                "city" : "${data.city}",
                "postalCode" : "${data.zip}",
                "country": "US",
                "stateOrProvince" : "${data.state}",
                "addressLine1" : "${data.address}"
            }
        },
        "name": "${data.name}",
        "merchantLocationStatus": "ENABLED",
        "locationTypes": [
            "WAREHOUSE"
        ]
    }`
    const response = await fetch(
        `https://api.sandbox.ebay.com/sell/inventory/v1/location/${data.key}`,
        {
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + get_ebay_oauth().oauth_token,
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'Content-Length': `${content.length}`
            },
            body: content
        }
    )
    console.log(content)
    console.log(`https://api.sandbox.ebay.com/sell/inventory/v1/location/${data.key}`)
    if (response.status !== 204) {
        console.log(await response.json())
        new Notification({
            title: 'Warehouse Error',
            body: 'Incorrect information supplied; Please try again'
        }).show()
        return false
    } else {
        set_warehouse()
        return true
    }
}
