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
                className="h-fit h-min-[60px] w-full border-b-[2px] border-white text-xl flex p-[15px] hover:bg-dustyrose hover:text-white"
                onClick={() => navigate(link)}
            >
                {label}
            </button>
        </div>
    )
}

const SideBar = () => {
    return (
        <nav className="bg-lightpink flex-none w-[30%] border-[2px] border-white">
            <SideBarTab link="/app/home" label="Home" />
            <SideBarTab link="/app/listingform" label="Create a Listing" />
            <SideBarTab link="/app/listinghistory" label="Listing History" />
            <SideBarTab link="/app/analytics" label="Analytics" />
            <SideBarTab link="/app/dbview" label="[TEMP] DB View" />
            <SideBarTab link="/app/usercred" label="[TEMP] User Credentials" />
            <SideBarTab link="/app/location" label="[TEMP] Location" />
        </nav>
    )
}

export default SideBar
