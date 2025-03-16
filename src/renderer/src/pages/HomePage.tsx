const HomePage = () => {
    return (
        <div className="content">
            <h1 className="heading">Home</h1>
            <h1 className="home-heading">Hello Name, Welcome to Syncseller!</h1>
            {/* Platforms */}
            <h1 className="home-heading">Platforms</h1>
            <section className="flex flex-col-4">
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-red-800"></div>
                    <h1 className="home-heading">Poshmark</h1>
                    <p className="home-paragraph">42 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-red-500"></div>
                    <h1 className="home-heading">Depop</h1>
                    <p className="home-paragraph">35 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-blue-600"></div>
                    <h1 className="home-heading">Facebook Marketplace</h1>
                    <p className="home-paragraph">49 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-amber-50"></div>
                    <h1 className="home-heading">eBay</h1>
                    <p className="home-paragraph">16 listings</p>
                </div>
            </section>
            {/* Recent listings */}
            <h1 className="home-heading">Recent Listings</h1>
            <section className="flex flex-col-6">
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
                <div className="w-1/6">
                    <div className="home-row1-icon h-[100px] bg-white"></div>
                    <h1 className="home-heading">item-title</h1>
                    <p className="home-paragraph">item-category</p>
                </div>
            </section>
        </div>
    )
}
export default HomePage
