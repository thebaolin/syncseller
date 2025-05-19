import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import sortAscending from '../../assets/images/sort_asc.png'
import sortDescending from '../../assets/images/sort_des.png'

const ListingHistory = () => {
    const navigate = useNavigate()
    const [listings, setListings] = useState([])

    const [orders, setOrders] = useState({
        itemID: 'ascending',
        dateCreated: 'ascending',
        title: 'ascending',
        status: 'ascending',
        platform: 'ascending',
        price: 'ascending'
    })

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
            <button className="h-[20px] w-[20px] rounded-[50%]">
                <img className="object-cover" src={sortAscending} />
            </button>
            <table>
                <thead>
                    <tr>
                        <th>
                            Item ID
                            {orders.itemID === 'ascending' ? (
                                <button className="h-[20px] w-[20px] rounded-[50%] cursor-pointer ml-[5px]">
                                    <img className="object-cover" src={sortAscending} />
                                </button>
                            ) : (
                                <button className="h-[20px] w-[20px] rounded-[50%] cursor-pointer ml-[5px]">
                                    <img className="object-cover" src={sortDescending} />
                                </button>
                            )}
                        </th>
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
                            <td>{listing.item_id}</td>
                            <td>{new Date(listing.created_at).toLocaleDateString()}</td>
                            <td>{listing.title}</td>
                            <td>{listing.status}</td>
                            <td>{listing.platform}</td>
                            <td>${listing.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {listings.length === 0 && (
                <div className="w-full mt-[40px] text-center">
                    <p className="">
                        Your listings will show up here!
                        <br />
                        Get started by creating a listing.
                    </p>
                    <button
                        className="form-button w-[200px] mx-[20px] my-[15px]"
                        onClick={() => navigate('/app/listingform')}
                    >
                        Create a Listing
                    </button>
                </div>
            )}
        </div>
    )
}
export default ListingHistory
