const SideBar = () => {
    return (
        <div>
            <nav className="sidebar">
                <a className="sidebar-icon" href="/app/home">
                    Home
                </a>
                <a className="sidebar-icon" href="/app/listinghistory">
                    Listing History
                </a>
                <a className="sidebar-icon" href="/app/analytics">
                    Analytics
                </a>
                <a className="sidebar-icon" href="/app/listingform">
                    Listing Form
                </a>
                <a className="sidebar-icon" href="/app/dbview">
                    Temp DB View
                </a>
                <a className="sidebar-icon" href="/app/usercred">
                    User Credentials
                </a>
            </nav>
        </div>
    )
}

export default SideBar
