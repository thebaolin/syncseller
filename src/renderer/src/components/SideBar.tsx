const SideBar = () => {
    return (
        <div>
            <nav className="sidebar">
                <a className="sidebar-icon" href="/home">
                    Home
                </a>
                <a className="sidebar-icon" href="/listinghistory">
                    Listing History
                </a>
                <a className="sidebar-icon" href="/analytics">
                    Analytics
                </a>
                <a className="sidebar-icon" href="/listingform">
                    Listing Form
                </a>
                <a className="sidebar-icon" href="/dbview">
                    Temp DB View
                </a>
                <a className="sidebar-icon" href="/usercred">
                    User Credentials
                </a>
            </nav>
        </div>
    )
}

export default SideBar
