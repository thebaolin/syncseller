import { Outlet, Link } from 'react-router-dom';

const Layout = () => {
    return(
        <>
            <nav>
                <h1>SyncSeller</h1>
                <ul>
                    <li>
                        <Link to="/home">Home</Link>
                    </li>
                    <li>
                        <Link to="/analytics">Analytics</Link>
                    </li>
                    <li>
                        <Link to="/listinghistory">Listing History</Link>
                    </li>
                    <li>
                        <Link to="/listingform">Listing Form</Link>
                    </li>
                    <li>
                        <Link to="/dbview"> TEMP DB Viewer</Link>
                    </li>
                </ul>
            </nav>
            <Outlet />
        </>
    )
};

export default Layout;