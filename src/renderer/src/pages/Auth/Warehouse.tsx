import { useNavigate } from 'react-router-dom'

const InputSection = ( args ) => (
    <section className="mx-[20px] my-[15px]">
        <label htmlFor={ args.id }>{ args.title }</label>
        <br />
        <input className="w-[100%]" id={ args.id } name={ args.id } type="text"></input>
    </section>
)

const Warehouse = () => {
    const validateForm = async () => {
        const zip = document.forms[ 'credentials' ][ 'zipcode' ].value
        const name = document.forms[ 'credentials' ][ 'name' ].value
        const key = document.forms[ 'credentials' ][ 'key' ].value
        const city = document.forms[ 'credentials' ][ 'city' ].value
        const state = document.forms[ 'credentials' ][ 'state' ].value
        const address = document.forms[ 'credentials' ][ 'address' ].value
        // validate form
        if (
            zip === '' ||
            name === '' ||
            key === '' ||
            city === '' ||
            state === '' ||
            address === ''
        ) {
            alert( 'Please fill out the form' )
            return false
        }

        if ( await window.electron.make_warehouse( {
            zip: zip,
            name: name,
            key: key,
            state: state,
            city: city,
            address: address
        } ) ) {
            alert( "Successfully posted warehouse" )
            navigate( '/app' )
        }

        return true
    }

    const navigate = useNavigate()

    return (
        <div className="content-full">
            <h1 className="text-center text-xl">{ `Create Warehouse Location` }</h1>
            <div className="w-1/3 m-auto">
                <form id="credentials">
                    <InputSection id="zipcode" title="Zipcode" />
                    <InputSection id="name" title="Name" />
                    <InputSection id="key" title="Merchant Location Key" />
                    <InputSection id="state" title="State or Providence" />
                    <InputSection id="city" title="City" />
                    <InputSection id="address" title="Address" />
                    {/* Submit button */ }
                    <div className="flex flex-col-2 justify-between pt-[20px]">
                        <button
                            className="form-button w-[150px] mx-[20px]"
                            onClick={ () => navigate( '/app' ) }
                        >
                            Go Back
                        </button>
                        <button
                            className="form-button w-[150px] mx-[20px]"
                            onClick={ validateForm }
                            form="warehouse-form"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default Warehouse
