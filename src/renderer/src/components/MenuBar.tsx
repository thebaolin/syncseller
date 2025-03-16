const MenuBar = () => {
    return (
        <div className="menu-bar flex justify-center">
            <div className="m-auto">
                <h1 className="text-4xl font-mono">SyncSeller</h1>
            </div>
            <div className="menu-functions right-[0px]">
                <img src="../assets/dogpfp.jpg" alt="profile picture" />
            </div>
            <div className="menu-functions right-[60px]">
                <img src="../assets/notifsicon.png" alt="notification icon"></img>
            </div>
        </div>
    )
}
export default MenuBar
