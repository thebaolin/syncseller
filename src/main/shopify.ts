import dotenv from 'dotenv'
dotenv.config()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

// example listing i did: https://syncseller.myshopify.com/admin/products/14723944579436

// Hardcoded for now (dev only):
const SHOPIFY_STORE = 'syncseller.myshopify.com'
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!
const ADMIN_API_VERSION = '2025-01'

export async function createDummyShopifyListing() {
    const endpoint = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}/graphql.json`

    const query = `
        mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
            product {
                id
                title
                status
            }
            userErrors {
                field
                message
            }
            }
        }
        `


    const variables = {
        input: {
            title: "Test Product from SyncSeller",
            descriptionHtml: "This is a test product created via the Admin GraphQL API from SyncSeller!",
            status: "ACTIVE", // optional
            productType: "Testing", // recommended to include something
            tags: ["syncseller", "test"]
        }
        }
          

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': ACCESS_TOKEN
            },
            body: JSON.stringify({ query, variables })
        })

        const data = await response.json()

        console.log('Shopify response:', JSON.stringify(data, null, 2))

        if (data.errors) {
            throw new Error(`GraphQL error: ${JSON.stringify(data.errors)}`)
        }

        const result = data.data?.productCreate
        if (!result || result.userErrors.length > 0) {
            console.error('Shopify user errors:', result?.userErrors || 'No result object returned')
        } else {
            console.log(`Product created: ${result.product.title} (ID: ${result.product.id})`)
        }
    } catch (err) {
        console.error('Error creating product:', err)
    }
}
