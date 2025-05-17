import { Outlet } from 'react-router-dom'
import MenuBar from '@renderer/components/MenuBar'

const AuthLayout = () => {
    return (
        <div className="bg-green-50">
            <MenuBar />
            <Outlet />
        </div>
    )
}
export default AuthLayout
