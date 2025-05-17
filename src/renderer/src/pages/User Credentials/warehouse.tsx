import { useNavigate } from 'react-router-dom'

const InputSection = ( args ) => (
    <section className="mx-[20px] my-[15px]">
        <label htmlFor={ args.id }>{ args.title }</label>
        <br />
        <input className="w-[100%]" id={ args.id } name={ args.id } type="text"></input>
    </section>
)

const Warehouse = ( props ) => {
    const validateForm = async () => {
        const zip = document.forms[ 'credentials' ][ 'zipcode' ].value
        // validate form
        if ( zip === '' ) {
            alert( 'Please fill out the form' )
            return false
        }
        //window.electron.set_warehouse( zip )
        return true
    }

    const navigate = useNavigate()

    return (
        <div className="content-full">
            <h1 className="heading">{ `Inventory Location` }</h1>
            <div className="w-1/3 m-auto">
                <form id="credentials">
                    <InputSection id="zipcode" title="Zipcode" />
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
