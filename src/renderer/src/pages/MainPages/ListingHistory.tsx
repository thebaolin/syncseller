import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ListingHistory = () => {
    const navigate = useNavigate()
    const [ listings, setListings ] = useState( [] )
    console.log( listings )

    useEffect( () => {
        const fetchListings = async () => {
            const result = await window.database.getListingHistory()
            if ( result.success ) {
                setListings( result.data )
            } else {
                console.error( 'Failed to fetch listings:', result.error )
            }
        }

        fetchListings()
    }, [] )
    return (
        <div className="content">
            <table>
                <thead>
                    <tr>
                        <th>Item ID</th>
                        <th>Date Created</th>
                        <th>Title</th>
                        <th>STATUS</th>
                        <th>Platform</th>
                        <th>Price</th>
                        <th>URL</th>
                    </tr>
                </thead>

                <tbody>
                    { listings.map( ( listing, index ) => (
                        <tr key={ index }>
                            <td>{ listing.item_id }</td>
                            <td>{ new Date( listing.created_at ).toLocaleDateString() }</td>
                            <td>{ listing.title }</td>
                            <td>{ listing.status }</td>
                            <td>{ listing.platform }</td>
                            <td>${ listing.price }</td>
                            <td>
                                {listing.url ? (
                                    <a href={listing.shopifyUrl} target="_blank" rel="noopener noreferrer">
                                    View Listing
                                    </a>
                                ) : (
                                    '—'
                                )}
                            </td>
                        </tr>
                    ) ) }
                </tbody>
            </table>

            { listings.length === 0 && (
                <div className="w-full mt-[40px] text-center">
                    <p className="">
                        Your listings will show up here!
                        <br />
                        Get started by creating a listing.
                    </p>
                    <button
                        className="form-button w-[200px] mx-[20px] my-[15px]"
                        onClick={ () => navigate( '/app/listingform' ) }
                    >
                        Create a Listing
                    </button>
                </div>
            ) }
        </div>
    )
}
export default ListingHistory
