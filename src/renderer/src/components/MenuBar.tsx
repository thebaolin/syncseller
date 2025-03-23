import notifIcon from "../assets/images/notifsicon.png"
import profilePic from "../assets/images/dogpfp.jpg"

const MenuBar = () => {
    return (
        <div className="menu-bar flex justify-center">
            <div className="m-auto">
                <h1 className="text-4xl font-mono">SyncSeller</h1>
            </div>
            <div className="menu-functions right-[0px] bg-[notifIcon] overflow-auto">
                <img className="object-cover h-[50px]" src={profilePic}/>
            </div>
            <div className="menu-functions right-[60px] ">
                <img src={notifIcon}/>
            </div>
        </div>
    )
}
export default MenuBar
