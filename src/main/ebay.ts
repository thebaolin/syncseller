import axios from 'axios'
import * as xml2js from 'xml2js'
import dotenv from 'dotenv'

dotenv.config()
const authToken = process.env.EBAY_AUTH_TOKEN

const sandboxEndpoint = 'https://api.sandbox.ebay.com/ws/api.dll' // Sandbox environment endpoint

// Set the headers required by the eBay API
const headers = {
    'X-EBAY-API-SITEID': '0', // US is default to 0
    'X-EBAY-API-CALL-NAME': 'AddItem',
    'X-EBAY-API-COMPATIBILITY-LEVEL': '967' // Compatibility Level
}

// Example payload to create an item listing in XML
const xmlPayload = `
<?xml version="1.0" encoding="utf-8"?>
<AddItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
 <RequesterCredentials>
   <eBayAuthToken>${authToken}</eBayAuthToken>
   
 </RequesterCredentials>
   <ErrorLanguage>en_US</ErrorLanguage>
   <WarningLevel>High</WarningLevel>
 <Item>
       <AutoPay>false</AutoPay>
       <Country>US</Country>
       <Currency>USD</Currency>
       <Description>My son.</Description>
       <ListingDuration>GTC</ListingDuration>
       <ListingType>FixedPriceItem</ListingType>
       <Location>New York, NY</Location>
       <PictureDetails>
           <GalleryType>Gallery</GalleryType>
           <PictureURL>https://i.etsystatic.com/25592275/r/il/7ff3fd/3200957451/il_300x300.3200957451_jid0.jpg</PictureURL>
       </PictureDetails>
       <PrimaryCategory>
       <CategoryID>20744</CategoryID>
   </PrimaryCategory>
   <ProductListingDetails>
       <BrandMPN>
           <Brand>Ty</Brand>
           <MPN>145032</MPN>
       </BrandMPN>
       <IncludeeBayProductDetails>true</IncludeeBayProductDetails>
   </ProductListingDetails>
   <Quantity>10</Quantity>
   <ShippingDetails>
       <ShippingServiceOptions>
           <ShippingService>FedExSmartPost</ShippingService>
           <ShippingServiceCost currencyID="USD">0.0</ShippingServiceCost>
           <ShippingServiceAdditionalCost currencyID="USD">0.0</ShippingServiceAdditionalCost>
           <ShippingServicePriority>1</ShippingServicePriority>
           <ExpeditedService>false</ExpeditedService>
           <ShippingTimeMin>2</ShippingTimeMin>
           <ShippingTimeMax>8</ShippingTimeMax>
           <FreeShipping>true</FreeShipping>
       </ShippingServiceOptions>
       <ShippingType>Flat</ShippingType>
       <TaxTable>
           <TaxJurisdiction>
               <JurisdictionID>KY</JurisdictionID>
               <SalesTaxPercent>6.0</SalesTaxPercent>
               <ShippingIncludedInTax>false</ShippingIncludedInTax>
           </TaxJurisdiction>
           <TaxJurisdiction>
               <JurisdictionID>WA</JurisdictionID>
               <SalesTaxPercent>6.5</SalesTaxPercent>
               <ShippingIncludedInTax>false</ShippingIncludedInTax>
           </TaxJurisdiction>
       </TaxTable>
       <ExcludeShipToLocation>Alaska/Hawaii</ExcludeShipToLocation>
       <ExcludeShipToLocation>US Protectorates</ExcludeShipToLocation>
       <ExcludeShipToLocation>APO/FPO</ExcludeShipToLocation>
       <ExcludeShipToLocation>Africa</ExcludeShipToLocation>
       <ExcludeShipToLocation>Asia</ExcludeShipToLocation>
       <ExcludeShipToLocation>Central America and Caribbean</ExcludeShipToLocation>
       <ExcludeShipToLocation>Europe</ExcludeShipToLocation>
       <ExcludeShipToLocation>Middle East</ExcludeShipToLocation>
       <ExcludeShipToLocation>North America</ExcludeShipToLocation>
       <ExcludeShipToLocation>Oceania</ExcludeShipToLocation>
       <ExcludeShipToLocation>Southeast Asia</ExcludeShipToLocation>
       <ExcludeShipToLocation>South America</ExcludeShipToLocation>
       <ExcludeShipToLocation>PO Box</ExcludeShipToLocation>
   </ShippingDetails>
   <ShipToLocations>US</ShipToLocations>
   <Site>US</Site>
   <StartPrice currencyID="USD">24.99</StartPrice>
   <Title>Beewb!! Ty Beanie Classic</Title>
   <DispatchTimeMax>0</DispatchTimeMax>
   <ReturnPolicy>
       <RefundOption>MoneyBack</RefundOption>
       <ReturnsWithinOption>Days_30</ReturnsWithinOption>
       <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
       <ShippingCostPaidByOption>Seller</ShippingCostPaidByOption>
   </ReturnPolicy>
   <ConditionID>1000</ConditionID>
</Item>
</AddItemRequest>
`

export async function createListing() {
    try {
        const response = await axios.post(sandboxEndpoint, xmlPayload, { headers })

        // Parse the XML response from eBay
        xml2js.parseString(response.data, (err, result) => {
            if (err) {
                console.error('Error parsing XML response:', err)
            } else {
                console.log('Listing created response:', result)

                // Check if there were errors in the eBay API response
                if (result.AddItemResponse.Ack[0] === 'Failure') {
                    console.error('Listing creation failed:', result.AddItemResponse.Errors)
                    console.log('eBay Auth Token:', authToken)
                } else {
                    console.log('Listing created successfully:', result)
                }
            }
        })
    } catch (error) {
        if (error.response) {
            console.error('Error response:', error.response.data)
            console.error('Error status:', error.response.status)
            console.error('Error headers:', error.response.headers)
        } else if (error.request) {
            console.error('No response received:', error.request)
        } else {
            console.error('Error message:', error.message)
        }
    }
}
