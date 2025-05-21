import { useNavigate } from 'react-router-dom'
import Ebay_logo from '../../assets/images/ebay-logo.png'
import Etsy_logo from '../../assets/images/Etsy-Logo.png'
import Shopify_logo from '../../assets/images/Shopify-Logo.png'
import { electron } from 'process'

const Icon = (props: { src: any }) => (
    <div className=" bg-white w-full h-[100px] flex items-center justify-center rounded-xl hover:bg-dustyrose">
        <img className="object-cover h-[50px]" src={props.src} />
    </div>
)

const SectionHeader = ({ label }) => {
    return (
        <div>
            <h1 className="text-lg font-bold mx-[20px]">{label}</h1>
            <div className=" flex h-[1px] bg-black mx-[20px] mb-4"></div>
        </div>
    )
}

const HomePage = () => {
    const navigate = useNavigate()

    const handleConnectEtsy = async () => {
        try {
            const result = await window.electron.invoke('start-etsy-oauth')
            console.log('OAuth result:', result)
        } catch (error) {
            console.error('Error during Etsy OAuth:', error)
        }
    }

    return (
        <div className="content">
            <h1 className="text-lg font-bold mx-[20px] mb-4">Hello Beewb, welcome to SyncSeller!</h1>
          
            {/* Platforms */}
            <SectionHeader label="Listing Platforms"/>
            <section className="flex flex-col-3">
                <div className="flex-1 mx-4">
                    <Icon src={Ebay_logo} />

                    {/* eBay login button */}
                    <button
                        className="form-button w-full my-4"
                        onClick={async () => {
                            if (!(await window.electron.ebaycreds())) {
                                navigate('/auth/usercred')
                            } else if (!(await window.electron.warehouse())) {
                                navigate('/auth/warehouse')
                            } else {
                                navigate('/auth/policies')
                            }
                        }}
                    >
                        eBay setup
                    </button>

                </div>
                
                <div className="flex-1 mx-4">
                    <Icon src={Etsy_logo} />

                    {/* Etsy login button */}
                    <button onClick={handleConnectEtsy} className="form-button w-full my-4">
                        Etsy setup
                    </button>
                </div>
                
                <div className="flex-1 mx-4">
                    <Icon src={Shopify_logo} />
                </div>
            </section>
        </div>
    )
}

export default HomePage
