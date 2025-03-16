import { Outlet } from 'react-router-dom'
import SideBar from '@renderer/components/SideBar'
import MenuBar from '@renderer/components/MenuBar'
import HomePage from './HomePage'

const Layout = () => {
    return (
        <div className="bg-amber-50">
            <MenuBar />
            <SideBar />
            <HomePage />
            <Outlet />
        </div>
    )
}

export default Layout
