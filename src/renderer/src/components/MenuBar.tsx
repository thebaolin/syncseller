import notifIcon from "../assets/images/notifsicon.png"
import profilePic from "../assets/images/dogpfp.jpg"

const MenuBar = () => {
    return (
        <div className="menu-bar flex justify-center">
            {/* Log in/out button */}
            <section className="w-[30%]">
                <a href="/usercred"><button className="bg-lightpink">
                    Log in
                </button></a>
            </section>
            {/* Title */}
            <div className="flex flex-col m-auto w-[40%]">
                <h1 className="text-4xl m-auto font-mono">SyncSeller</h1>
            </div>
            <section className="w-[30%]">
                {/* Profile picture */}
                <div className="menu-functions right-[0px] bg-[notifIcon] overflow-auto">
                    <img className="object-cover h-[50px]" src={profilePic}/>
                </div>
                {/* Notifications */}
                <div className="menu-functions right-[60px] ">
                    <img src={notifIcon}/>
                </div>
            </section>
        </div>
    )
}
export default MenuBar
