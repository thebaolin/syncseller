const UserCred = () => {
    return (
        <div className="content-full">
            <h1 className="heading">Enter User Credentials</h1>
            <div className="w-1/3 m-auto">
                <form>
                    {/* Client ID */}
                    <section >
                        <label htmlFor="client_id">Client ID</label>
                        <br/>
                        <input className="w-[100%]" id="client_id" name="client_id" type="text"></input>
                    </section>
                    {/* Client secret */}
                    <section>
                        <label htmlFor="client_secret">Client Secret</label>
                        <br/>
                        <input className="w-[100%]" id="client_secret" name="client_secret" type="text"></input>
                    </section>
                    {/* Redirect URI */}
                    <section>
                        <label htmlFor="redirect_uri">Redirect URI</label>
                        <br/>
                        <input className="w-[100%]" id="redirect_uri" name="redirect_uri" type="text"></input>
                    </section> 
                    {/* Submit button */}
                    <a href="/"><button form="user-cred-form">
                        Submit
                    </button></a>
                </form>
            </div>
        </div>
    )
}
export default UserCred