const UserCred = (props) => {
    const InputSection = (args) => (
        <section >
            <label htmlFor={args.id}>{args.title}</label>
            <br/>
            <input className="w-[100%]" id={args.id} name={args.id} type="text"></input>
        </section>
    )
    return (
        <div className="content-full">
            <h1 className="heading">{`Enter ${props.platform} Credentials`}</h1>
            <div className="w-1/3 m-auto">
                <form>
                    {/* Client ID */}
                    <InputSection id="client_id" title="Client ID"/>
                    {/* Client secret */}
                    <InputSection id="client_secret" title="Client Secret"/>
                    {/* Redirect URI */}
                    <InputSection id="redirect_uri" title="Redirect URI"/>
                    {/* Submit button */}
                    <a href="/app/home"><button form="user-cred-form">
                        Submit
                    </button></a>
                </form>
            </div>
        </div>
    )
}
export default UserCred