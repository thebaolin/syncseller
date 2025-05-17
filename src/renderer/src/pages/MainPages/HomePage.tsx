import { useNavigate } from 'react-router-dom'
import Ebay_logo from '../../assets/images/ebay-logo.png'
import Etsy_logo from '../../assets/images/Etsy-Logo.png'
import Shopify_logo from '../../assets/images/Shopify-Logo.png'
import { electron } from 'process'

const Icon = ( props: { src: any } ) => (
    <div className=" bg-white w-full h-[100px] flex items-center justify-center mx-4 rounded-xl hover:bg-dustyrose">
        <img className="object-cover h-[50px]" src={ props.src } />
    </div>
)

const HomePage = () => {
    const navigate = useNavigate()

    const handleConnectEtsy = async () => {
        try {
            const result = await window.electron.invoke( 'start-etsy-oauth' )
            console.log( 'OAuth result:', result )
        } catch ( error ) {
            console.error( 'Error during Etsy OAuth:', error )
        }
    }

    return (
        <div className="content">
            <h1 className="home-heading">Hello Beewb, Welcome to SyncSeller!</h1>

            {/* Etsy login button */ }
            <button onClick={ handleConnectEtsy } className="form-button">
                Connect to Etsy
            </button>

            {/* eBay login button */ }

            <button
                className="form-button"
                onClick={ async () => {
                    const cred = await window.electron.ebaycreds()

                    console.log( `cred ${ cred }` )
                    if ( !cred ) {
                        navigate( '/auth/usercred' )
                    } else {
                        const ware = await !window.electron.warehouse()
                        if ( !ware ) {
                            navigate( '/auth/warehouse' )
                        }
                    }
                } }
            >
                eBay setup
            </button>

            {/* Platforms */ }
            <h1 className="home-heading">Platforms</h1>
            <section className="flex flex-col-3">
                <Icon src={ Ebay_logo } />
                <Icon src={ Etsy_logo } />
                <Icon src={ Shopify_logo } />
            </section>
        </div>
    )
}

export default HomePage
