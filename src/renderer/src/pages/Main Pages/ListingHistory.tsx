import React, { useEffect, useState } from 'react'

const ListingHistory = () => {
    const [listings, setListings] = useState([])

    useEffect(() => {
        const fetchListings = async () => {
            const result = await window.database.getListingHistory()
            if (result.success) {
                setListings(result.data)
            } else {
                console.error('Failed to fetch listings:', result.error)
            }
        }

        fetchListings()
    }, [])
    return (
        <div className="content">
            <table>
                <thead>
                    <tr>
                        <th>Date Created</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Platform</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {listings.map((listing, index) => (
                        <tr key={index}>
                            <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                            <td>{listing.title}</td>
                            <td>{listing.status}</td>
                            <td>{listing.platform}</td>
                            <td>${listing.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
export default ListingHistory
