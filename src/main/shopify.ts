    import dotenv from 'dotenv'
    dotenv.config()
    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

    // example listing i did: https://syncseller.myshopify.com/products/test-product-from-syncseller-16

    // Hardcoded for now (dev only):
    const SHOPIFY_STORE = 'syncseller.myshopify.com'
    const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!
    const ADMIN_API_VERSION = '2025-01'
    const ONLINE_STORE_PUBLICATION_ID = 'gid://shopify/Publication/269566476652'

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
                console.log(`✅ Product created: ${result.product.title} (ID: ${result.product.id})`)
                // Optional: Immediately publish it
                await publishProductToOnlineStore(result.product.id)
            }
        } catch (err) {
            console.error('Error creating product:', err)
        }
    }


    //Get online publication ID to publish listing publically on storefront
    export async function getOnlineStorePublicationId() {
        const endpoint = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}/graphql.json`

        const query = `
            query {
                publications(first: 10) {
                    edges {
                        node {
                            id
                            name
                        }
                    }
                }
            }
        `

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Shopify-Access-Token': ACCESS_TOKEN
                },
                body: JSON.stringify({ query })
            })

            const data = await response.json()
            console.log('Publications response:', JSON.stringify(data, null, 2))

            const publications = data.data?.publications?.edges || []
            const onlineStore = publications.find(pub => pub.node.name === "Online Store")

            if (onlineStore) {
                console.log(`✅ Found Online Store publication ID: ${onlineStore.node.id}`)
            } else {
                console.warn("Online Store publication not found..")
            }
        } catch (err) {
            console.error('Error fetching publication IDs:', err)
        }
    }

    // Publishes a product to the storefront - you can see on UI
    // https://syncseller.myshopify.com/collections/all
    export async function publishProductToOnlineStore(productId: string) {
        const endpoint = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}/graphql.json`

        const query = `
            mutation publishProduct($id: ID!, $input: [PublicationInput!]!) {
                publishablePublish(id: $id, input: $input) {
                    publishable {
                        ... on Product {
                            id
                            title
                            publishedAt
                        }
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `

        const variables = {
            id: productId,
            input: [
                {
                    publicationId: ONLINE_STORE_PUBLICATION_ID
                }
            ]
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
            console.log('Publish response:', JSON.stringify(data, null, 2))

            const userErrors = data.data?.publishablePublish?.userErrors
            if (userErrors && userErrors.length > 0) {
                console.error("Failed to publish product:", userErrors)
            } else {
                console.log(`Product published to Online Store!!!!`)
            }
        } catch (err) {
            console.error('Error publishing product:', err)
        }
    }
