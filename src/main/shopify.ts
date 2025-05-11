import dotenv from 'dotenv'
import { getLatestShopifyListing } from './dbmanager'

dotenv.config()
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args))

// example listing i did: https://syncseller.myshopify.com/products/test-product-from-syncseller-16

// Hardcoded for now (dev only):
const SHOPIFY_STORE = 'syncseller.myshopify.com'
const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN!
const ADMIN_API_VERSION = '2024-01'
const ONLINE_STORE_PUBLICATION_ID = 'gid://shopify/Publication/269566476652'


export async function createDummyShopifyListing() {
    const endpoint = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}/graphql.json`

    const listing = getLatestShopifyListing()

    if (!listing) {
        console.error('No listing found to send to Shopify.')
        return
    }

    const descriptionHtml = `
        <strong>Description:</strong> ${listing.description}<br/>
        <strong>Condition:</strong> ${listing.condition}<br/>
        <strong>Dimensions:</strong> ${listing.length} x ${listing.width} x ${listing.height} ${listing.unit}<br/>
        <strong>Weight:</strong> ${listing.weight} ${listing.weightUnit}<br/>
        <strong>UPC:</strong> ${listing.upc}<br/>
        <strong>Quantity:</strong> ${listing.quantity}
    `

    const createProductQuery = `
        mutation productCreate($input: ProductInput!) {
            productCreate(input: $input) {
                product {
                    id
                    title
                    status
                    variants(first: 1) {
                        edges {
                            node {
                                id
                            }
                        }
                    }
                }
                userErrors {
                    field
                    message
                }
            }
        }
    `

    const createProductVariables = {
        input: {
            title: listing.title,
            descriptionHtml,
            status: "ACTIVE",
            productType: "SyncSeller",
            tags: ["syncseller"]
        }
    }

    try {
        const createResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': ACCESS_TOKEN
            },
            body: JSON.stringify({ query: createProductQuery, variables: createProductVariables })
        })

        const createData = await createResponse.json()
        const result = createData.data?.productCreate
        const product = result?.product
        const variantId = product?.variants?.edges?.[0]?.node?.id

        if (!product || result.userErrors.length > 0 || !variantId) {
            console.error('Shopify user errors..:', result?.userErrors || 'No product returned')
            return
        }

        console.log(`Product created: ${product.title} (ID: ${product.id})`)

        const updateVariantQuery = `
            mutation productVariantUpdate($input: ProductVariantInput!) {
                productVariantUpdate(input: $input) {
                    productVariant {
                        id
                        price
                        barcode
                        weight
                        weightUnit
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `

        console.log('Variant input data:', {
            price: listing.price,
            barcode: listing.upc,
            weight: listing.weight,
            weightUnit: listing.weightUnit
        })

        
        const updateVariantVariables = {
            input: {
                id: variantId,
                price: listing.price?.toString() || '0.00',
                barcode: listing.upc?.toString() || '000000000000',
                weight: listing.weight || 0.1,
                weightUnit: (listing.weightUnit || 'POUNDS').toUpperCase()
            }
        }
        

        const updateResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': ACCESS_TOKEN
            },
            body: JSON.stringify({ query: updateVariantQuery, variables: updateVariantVariables })
        })

        const updateData = await updateResponse.json()
        const updateErrors = updateData.data?.productVariantUpdate?.userErrors
        if (updateErrors && updateErrors.length > 0) {
            console.error('Failed to update variant:', updateErrors)
        } else {
            console.log('Variant updated successfully')
        }

        await publishProductToOnlineStore(product.id)
    } catch (err) {
        console.error('Error during Shopify listing process:', err)
    }
}

// export async function createDummyShopifyListing() {
//     const endpoint = `https://${SHOPIFY_STORE}/admin/api/${ADMIN_API_VERSION}/graphql.json`


//     const createProductQuery = `
//             mutation productCreate($input: ProductInput!) {
//                 productCreate(input: $input) {
//                     product {
//                         id
//                         title
//                         status
//                         variants(first: 1) {
//                             edges {
//                                 node {
//                                     id
//                                 }
//                             }
//                         }
//                     }
//                     userErrors {
//                         field
//                         message
//                     }
//                 }
//             }
//         `

//     const createProductVariables = {
//         input: {
//             title: 'Test Product from SyncSeller',
//             descriptionHtml:
//                 'Beewb Eeb Eeberson This is a test product created via the Admin GraphQL API from SyncSeller!',
//             status: 'ACTIVE',
//             productType: 'Testing',
//             tags: ['syncseller', 'test']
//         }
//     }

//     try {
//         // Step 1: Create product
//         const createResponse = await fetch(endpoint, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': ACCESS_TOKEN
//             },
//             body: JSON.stringify({ query: createProductQuery, variables: createProductVariables })
//         })

//         const createData = await createResponse.json()
//         console.log('Create product response:', JSON.stringify(createData, null, 2))

//         const result = createData.data?.productCreate
//         const product = result?.product
//         const variantId = product?.variants?.edges?.[0]?.node?.id

//         if (!product || result.userErrors.length > 0 || !variantId) {
//             console.error('Shopify user errors:', result?.userErrors || 'No product returned')
//             return
//         }

//         console.log(`Product created: ${product.title} (ID: ${product.id})`)
//         console.log(`Default variant ID: ${variantId}`)

//         // Step 2: Update variant with price, barcode, etc.
//         const updateVariantQuery = `

//                 mutation productVariantUpdate($input: ProductVariantInput!) {
//                     productVariantUpdate(input: $input) {
//                         productVariant {
//                             id
//                             price
//                             barcode
//                             weight
//                             weightUnit
//                         }
//                         userErrors {
//                             field
//                             message
//                         }
//                     }
//                 }
//             `

//         const updateVariantVariables = {
//             input: {
//                 id: variantId,
//                 price: '19.99',
//                 barcode: '123456789012',
//                 weight: 1.2,
//                 weightUnit: 'POUNDS'
//             }
//         }

//         const updateResponse = await fetch(endpoint, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'X-Shopify-Access-Token': ACCESS_TOKEN
//             },
//             body: JSON.stringify({ query: updateVariantQuery, variables: updateVariantVariables })
//         })

//         const updateData = await updateResponse.json()
//         console.log('Update variant response:', JSON.stringify(updateData, null, 2))

//         const updateErrors = updateData.data?.productVariantUpdate?.userErrors
//         if (updateErrors && updateErrors.length > 0) {
//             console.error('Failed to update variant:', updateErrors)
//         } else {
//             console.log('Variant updated successfully')
//         }

//         // Step 3: Publish the product
//         await publishProductToOnlineStore(product.id)
//     } catch (err) {
//         console.error('Error during Shopify listing process:', err)
//     }
// }

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
        const onlineStore = publications.find((pub) => pub.node.name === 'Online Store')

        if (onlineStore) {
            console.log(`Found Online Store publication ID: ${onlineStore.node.id}`)
        } else {
            console.warn('Online Store publication not found..')
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
            console.error('Failed to publish product:', userErrors)
        } else {
            console.log(`Product published to Online Store!!!!`)
        }
    } catch (err) {
        console.error('Error publishing product:', err)
    }
}
