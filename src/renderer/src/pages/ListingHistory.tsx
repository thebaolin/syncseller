const ListingHistory = () => {
    return( 
        <div className="content">
            <input type="text"></input>
            <h1 className="heading">Listing History</h1>
            <table>
                <thead>
                    <tr>
                        <th className="w-1/8">Date Created</th>
                        <th className="w-3/8">Title</th>
                        <th className="w-1/8">Category</th>
                        <th className="w-1/8">Status</th>
                        <th className="w-3/16">Platforms</th>
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
                        <td>Sold</td>
                        <td>Facebook Marketplace, Depop, eBay</td>
                    </tr>
                </tbody>
            </table>
        </div>
    )
}
export default ListingHistory;