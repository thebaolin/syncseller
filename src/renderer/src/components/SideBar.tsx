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
                className="h-fit h-min-[60px] w-full border-b-2 border-white text-xl flex p-[15px] hover:bg-dustyrose hover:text-white"
                onClick={() => navigate(link)}
            >
                {label}
            </button>
        </div>
    )
}

const SideBar = () => {
    return (
        <div>
            <nav className="mt-[60px] w-3/10 h-9/10 fixed bg-lightpink border-[4px] border-white rounded-[10px]">
                <SideBarTab link="/app/home" label="Home" />
                <SideBarTab link="/app/listingform" label="Create a Listing" />
                <SideBarTab link="/app/listinghistory" label="Listing History" />
                <SideBarTab link="/app/analytics" label="Analytics" />
                <SideBarTab link="/app/dbview" label="[TEMP] DB View" />
                <SideBarTab link="/app/usercred" label="[TEMP] User Credentials" />
            </nav>
        </div>
    )
}

export default SideBar
