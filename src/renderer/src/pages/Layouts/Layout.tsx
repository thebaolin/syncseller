import { Outlet } from 'react-router-dom'
import SideBar from '@renderer/components/SideBar'
import MenuBar from '@renderer/components/MenuBar'

const Layout = () => {
    return (
        <div className="bg-green-50">
            <MenuBar />
            <div className="flex flex-col-2">
                <SideBar />
                <div className="w-[70%] mt-[60px] ml-[30%]">
                    <Outlet />
                </div>
            </div>
        </div>
    )
}

export default Layout
