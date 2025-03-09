const ListingHistory = () => {
    return( 
        <div>
            <table>
                <thead>
                    <tr>
                        <th>Date Created</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Platforms</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>10/10/2024</td>
                        <td>Levis ribcage jeans</td>
                        <td>Pants</td>
                        <td>Live</td>
                        <td>Poshmark, Depop, eBay</td>
                    </tr>
                    <tr>
                        <td>10/11/2024</td>
                        <td>Stuffed doggo</td>
                        <td>Toys</td>
                        <td>Sold on Facebook Marketplace</td>
                        <td>Facebook Marketplace, Depop, eBay</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
export default ListingHistory;