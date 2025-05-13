import { useNavigate } from 'react-router-dom'
interface SideBarTabProps {
    link: string
    label: string
}
const SideBarTab = (props: SideBarTabProps) => {
    const { link, label } = props
    const navigate = useNavigate()
    return (
        <div>
            <button
                className="h-fit h-min-[60px] w-full border-b-[2px] border-green-50 text-xl flex p-[15px] hover:bg-dustyrose hover:text-white focus:bg-dustyrose focus:text-white cursor-pointer"
                onClick={() => navigate(link)}
            >
                {label}
            </button>
        </div>
    )
}

const SideBar = () => {
    return (
        <nav className="bg-bubblegum flex-none border-[2px] border-green-50 w-[30%] mt-[60px] fixed h-[calc(100vh-60px)] rounded-lg overflow-hidden">
            <SideBarTab link="/app/home" label="Home" />
            <SideBarTab link="/app/listingform" label="Create a Listing" />
            <SideBarTab link="/app/listinghistory" label="Listing History" />
            <SideBarTab link="/app/analytics" label="Analytics" />
            <SideBarTab link="/app/dbview" label="[TEMP] DB View" />
            <SideBarTab link="/auth/usercred" label="[TEMP] User Credentials" />
            <SideBarTab link="/auth/location" label="[TEMP] Location" />
        </nav>
    )
}

export default SideBar
