// import { useEffect, useState } from 'react'

// interface Item {
//     id: number
//     status: string
// }
// interface EbayListing {
//     ebay_listing_id: number;
//     item_id: number;
//     listing_id: number;
//     title: string;
//     aspects: string;
//     description: string;
//     upc: number;
//     imageURL: string;
//     condition: string;
//     packageWeightAndSize: string;
//     height: number;
//     length: number;
//     width: number;
//     unit: string;
//     packageType: string;
//     weight: number;
//     weightUnit: string;
//     quantity: number;
// }

// const DbView = () => {
//     const [items, setItems] = useState<Item[]>([])
//     const [newItem, setNewItem] = useState<string>('')
//     const [tables, setTables] = useState<string[]>([]);

//         useEffect(() => {
//             const fetchTables = async () => {
//                 const result = await window.database.getTableNames();
//                 setTables(result);
//             };

//             fetchTables();
//         }, []);
//         useEffect(() => {
//             loadData()
//         }, [])

//         const loadData = async () => {
//             try {
//                 const data = await window.database.getData()
//                 setItems(data)
//             } catch (error) {
//                 console.error('Failed to load data:', error)
//             }
//         }

//         const handleInsert = async () => {
//             if (!newItem) return
//             try {
//                 await window.database.insertData(newItem)
//                 setNewItem('')
//                 loadData() // Reload data after insert
//             } catch (error) {
//                 console.error('Failed to insert data:', error)
//             }
//         }

//         return (
//             <div className="content">

//                 <h2>Items</h2>
//                 {/* Print the 'name' column for each item */}
//                 <ul>
//                     {items.map((item) => (
//                         <li key={item.id}>{item.status}</li>
//                     ))}
//                 </ul>

//                 <input
//                     type="text"
//                     value={newItem}
//                     onChange={(e) => setNewItem(e.target.value)}
//                     placeholder="Enter new item"
//                 />
//                 <button onClick={handleInsert}>Add Item</button>

//                 <h2>Database Tables:</h2>
//                 <ul>
//                     {tables.map((table, name) => (
//                         <li key={name}>{table}</li>
//                     ))}
//                 </ul>
//             </div>

//         )
//     }

// export default DbView

import { useEffect, useState } from 'react'

interface Item {
    id: number
    status: string
}

interface EbayListing {
    ebay_listing_id: number
    item_id: number
    listing_id: number
    title: string
    aspects: string
    description: string
    upc: number
    imageURL: string
    condition: string
    packageWeightAndSize: string
    height: number
    length: number
    width: number
    unit: string
    packageType: string
    weight: number
    weightUnit: string
    quantity: number
}

const DbView = () => {
    const [items, setItems] = useState<Item[]>([])
    const [ebayListings, setEbayListings] = useState<EbayListing[]>([])
    const [newItem, setNewItem] = useState<string>('')
    const [tables, setTables] = useState<string[]>([])

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const result = await window.database.getTableNames()
                setTables(result)
            } catch (error) {
                console.error('Failed to fetch table names:', error)
            }
        }

        fetchTables()
    }, [])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            // Load general items
            const data = await window.database.getData()
            setItems(data)

            // Load eBay listings
            const listings = await window.database.getEbayListing()
            setEbayListings(listings)
        } catch (error) {
            console.error('Failed to load data:', error)
        }
    }

    const handleInsert = async () => {
        if (!newItem) return
        try {
            await window.database.insertData(newItem)
            setNewItem('')
            loadData() // Reload data after insert
        } catch (error) {
            console.error('Failed to insert data:', error)
        }
    }

    return (
        <div className="content">
            {/* Items */}
            <h2>Items</h2>
            <ul>
                {items.map((item) => (
                    <li key={item.id}>{item.status}</li>
                ))}
            </ul>

            <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter new item"
            />
            <button onClick={handleInsert}>Add Item</button>

            {/* eBay Listings */}
            <h2>eBay Listings</h2>
            <ul>
                {ebayListings.map((listing) => (
                    <li key={listing.ebay_listing_id}>
                        <strong>{listing.title}</strong>
                        <p>{listing.ebay_listing_id}</p>
                        <p>{listing.description}</p>
                        <p>
                            Condition: {listing.condition} | Price: ${listing.upc}
                        </p>
                        {listing.imageURL && (
                            <img
                                src={listing.imageURL}
                                alt={listing.title}
                                style={{ width: 100 }}
                            />
                        )}
                        <p>
                            Dimensions: {listing.length} x {listing.width} x {listing.height}{' '}
                            {listing.unit}
                        </p>
                        <p>
                            Weight: {listing.weight} {listing.weightUnit} | Quantity:{' '}
                            {listing.quantity}
                        </p>
                    </li>
                ))}
            </ul>
            <br></br>
            <br></br>
            <br></br>
            {/* Database Tables */}
            <h2>Database Tables:</h2>
            <ul>
                {tables.map((table, index) => (
                    <li key={index}>{table}</li>
                ))}
            </ul>
        </div>
    )
}

export default DbView
