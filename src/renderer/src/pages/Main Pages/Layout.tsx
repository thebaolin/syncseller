import { Outlet } from 'react-router-dom'
import SideBar from '@renderer/components/SideBar'
import MenuBar from '@renderer/components/MenuBar'
import HomePage from './HomePage'

const Layout = () => {
    return (
        <div className="flex">
            <SideBar />
            <div className="flex flex-col w-[70%]">
                <MenuBar />
                {/* <HomePage /> */}
                <Outlet />
            </div>
        </div>
    )
}

export default Layout
