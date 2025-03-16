import { Outlet } from 'react-router-dom'
import MenuBar from '@renderer/components/MenuBar'

const Layout = () => {
    return (
        <div>
            <MenuBar />
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
            </nav>
            <Outlet />
        </div>
    )
}

export default Layout
