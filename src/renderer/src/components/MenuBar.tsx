import "../assets/images/dogpfp.jpg"
// import "../assets/notifsicon.png"

const MenuBar = () => {
    return (
        
        <div className="menu-bar">
            <button className="create-listing">Create listing</button>
            <div>
                <h1 className="flex justify-center bg-center absolute w-[300px] h-[60px] bg-amber-50 text-4xl">SyncSeller</h1>
            </div>
            <div className="menu-functions right-[0px]">
                <img src="" alt="profile picture"/>
            </div>
            <div className="menu-functions right-[60px]">
                <img src="../assets/notifsicon.png" alt="notification icon"></img>
            </div>
        </div>
    )
}
export default MenuBar;