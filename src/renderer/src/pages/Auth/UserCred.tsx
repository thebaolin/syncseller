import { useNavigate } from 'react-router-dom'

const InputSection = ( args ) => (
    <section className="mx-[20px] my-[15px]">
        <label htmlFor={ args.id }>{ args.title }</label>
        <br />
        <input className="w-[100%]" id={ args.id } name={ args.id } type="text"></input>
    </section>
)

const UserCred = () => {
    const validateForm = async () => {
        const client_id = document.forms[ 'credentials' ][ 'client_id' ].value
        const client_secret = document.forms[ 'credentials' ][ 'client_secret' ].value
        const redirect_uri = document.forms[ 'credentials' ][ 'redirect_uri' ].value
        // validate form
        if ( client_id === '' || client_secret === '' || redirect_uri === '' ) {
            alert( 'Please fill out the form' )
            return false
        }
        window.electron.setEbayCredentials( client_id, client_secret, redirect_uri )

        return true
    }

    const navigate = useNavigate()

    return (
        <div className="content-full">
            <h1 className="text-center text-xl">{ `Enter eBay Credentials` }</h1>
            <div className="w-1/3 m-auto">
                <form id="credentials">
                    {/* Client ID */ }
                    <InputSection id="client_id" title="Client ID" />
                    {/* Client secret */ }
                    <InputSection id="client_secret" title="Client Secret" />
                    {/* Redirect URI */ }
                    <InputSection id="redirect_uri" title="Redirect URI" />
                    {/* Submit button */ }
                    <div className="flex flex-col-2 justify-between pt-[20px]">
                        <button
                            className="form-button w-[150px] mx-[20px]"
                            onClick={ () => navigate( '/app/home' ) }
                        >
                            Go Back
                        </button>
                        <button
                            className="form-button w-[150px] mx-[20px]"
                            onClick={ validateForm }
                            form="user-cred-form"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default UserCred
