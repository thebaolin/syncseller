import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Ebay_logo from "../../assets/images/ebay-logo.png"
import Etsy_logo from "../../assets/images/Etsy-Logo.png"
import Shopify_logo from "../../assets/images/Shopify-Logo.png"

const Icon = (props: {src:any}) => (
    <div className=" bg-white w-full h-[100px] flex items-center justify-center mx-4 rounded-xl hover:bg-dustyrose">
        <img className="object-cover h-[50px]" src={props.src} />
    </div>
)

const HomePage = () => {
    useEffect(() => {
        const loginButton = document.getElementById('etsy-login-button')
        if (loginButton) {
            loginButton.addEventListener('click', async () => {
                const result = await window.electron.invoke('start-etsy-oauth')
                console.log('OAuth result:', result)
            })
        }

        return () => {
            if (loginButton) {
                loginButton.removeEventListener('click', async () => {
                    await window.electron.invoke('start-etsy-oauth')
                })
            }
        }
    }, [])

    const navigate = useNavigate();

    return (
        <div className="content">
            <h1 className="heading">Home</h1>
            <h1 className="home-heading">Hello Name, Welcome to SyncSeller!</h1>

            {/* Temporary Etsy Login Button LOL*/}
            <button id="etsy-login-button" className="form-button">
                Connect to Etsy
            </button>

            {/* Ebay login button */}
            <button 
                className="form-button"
                onClick={() => navigate("/app/usercred")}
            >Log in to eBay</button>

            {/* Platforms */}
            <h1 className="home-heading">Platforms</h1>
            <section className="flex flex-col-3">
                <Icon src={Ebay_logo}/>
                <Icon src={Etsy_logo}/>
                <Icon src={Shopify_logo}/>
            </section>
        </div>
    )
}

export default HomePage
