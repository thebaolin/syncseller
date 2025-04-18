import notifIcon from '../assets/images/notifsicon.png'
import profilePic from '../assets/images/dogpfp.jpg'

const MenuBar = () => {
    return (
        <div className="w-full h-60px bg-white absolute flex flex-col-3">
            <div className="flex-1"></div>
            {/* Title */}
            <div className="flex-1">
                <h1 className="text-4xl text-center">SyncSeller</h1>
            </div>
            <div className="flex-1">
                {/* Profile picture */}
                <div className="menu-functions right-[0px] bg-[notifIcon] overflow-auto">
                    <img className="object-cover h-[50px]" src={profilePic} />
                </div>
                {/* Notifications */}
                <div className="menu-functions right-[60px] ">
                    <img src={notifIcon} />
                </div>
            </div>
        </div>
    )
}
export default MenuBar
