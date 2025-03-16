const ListingHistory = () => {
    return (
        <div className="content">
            <h1 className="heading">Analytics Dashbord</h1>
            <section className="analytics flex flex-col-3 justify-center">
                {/* Revenue */}
                <div className="analytics-row1">
                    <h2 className="text-xl">
                        <strong>Revenue</strong>
                    </h2>
                    <br />
                    <h1 className="text-4xl">
                        <strong>$568.90</strong>
                    </h1>
                    <h3 className="text-gray-500">+20% of last week revenue</h3>
                </div>
                {/* Items Sold */}
                <div className="analytics-row1">
                    <h2 className="text-xl">
                        <strong>Items Sold</strong>
                    </h2>
                    <br />
                    <h1 className="text-4xl">
                        <strong>20</strong>
                    </h1>
                    <h3 className="text-gray-500">+33% of last week items sold</h3>
                </div>
                {/* Items Posted */}
                <div className="analytics-row1">
                    <h2 className="text-xl">
                        <strong>Items Posted</strong>
                    </h2>
                    <br />
                    <h1 className="text-4xl">
                        <strong>33</strong>
                    </h1>
                    <h3 className="text-gray-500">-8% of last week items posted</h3>
                </div>
            </section>
            <section className="flex flex-col-2">
                {/* Profit line graph */}
                <div className="analytics-row2 w-3/5">
                    <h2 className="text-xl">
                        <strong>Profit</strong>
                    </h2>
                    <br />
                </div>
                {/* Platforms pie chart */}
                <div className="analytics-row2 w-2/5">
                    <h2 className="text-xl">
                        <strong>Sold by Platform</strong>
                    </h2>
                    <br />
                </div>
            </section>
            <section className="flex flex-col-2">
                {/* Sold vs Posted stacked bar graph */}
                <div className="analytics-row2 w-3/5">
                    <h2 className="text-xl">
                        <strong>Sold vs. Posted</strong>
                    </h2>
                    <br />
                </div>
                {/* Past 5 sold items */}
                <div className="analytics-row2 w-2/5">
                    <h2 className="text-xl">
                        <strong>Sold Items</strong>
                    </h2>
                    <br />
                </div>
            </section>
        </div>
    )
}
export default ListingHistory
