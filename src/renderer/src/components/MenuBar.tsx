import "../assets/images/dogpfp.jpg"
// import "../assets/notifsicon.png"

const MenuBar = () => {
    return (
        
        <div className="menu-bar">
            <button className="create-listing">Create listing</button>
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