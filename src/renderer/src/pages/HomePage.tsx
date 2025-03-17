import { useEffect } from 'react'

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

    return (
        <div className="content">
            <h1 className="heading">Home</h1>
            <h1 className="home-heading">Hello Name, Welcome to SyncSeller!</h1>
            
            {/* Temporary Etsy Login Button LOL*/}
            <button id="etsy-login-button" className="bg-blue-500 text-white px-4 py-2 rounded">
                Connect to Etsy
            </button>

            {/* Platforms */}
            <h1 className="home-heading">Platforms</h1>
            <section className="flex flex-col-4">
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-red-800"></div>
                    <h1 className="home-heading">Poshmark</h1>
                    <p className="home-paragraph">42 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-red-500"></div>
                    <h1 className="home-heading">Depop</h1>
                    <p className="home-paragraph">35 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-blue-600"></div>
                    <h1 className="home-heading">Facebook Marketplace</h1>
                    <p className="home-paragraph">49 listings</p>
                </div>
                <div className="w-1/4">
                    <div className="home-row1-icon h-[150px] bg-amber-50"></div>
                    <h1 className="home-heading">eBay</h1>
                    <p className="home-paragraph">16 listings</p>
                </div>
            </section>
        </div>
    )
}

export default HomePage
