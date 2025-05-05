export {}

declare global {
  interface Window {
    shopifyAPI: {
      createShopifyListing: () => Promise<void>
    }
  }
}
