const ListingForm = () => {    
    // listing object
    const listing = {
        title: '',
        brand: '',
        price: 0.00,
        description: '',
        platforms: {}
    };

    // UNDER CONSTRUCTION
    // const onSubmit = (values: IValue) => {
    //     console.log('values', values);
    //     console.log(window.electron);
    //     // This is a typescript error, otherwise works fine
    //     window.electron.send('submit:todoForm', values);
    // };

    // const validationSchema = Yup.object().shape({
    //     description: Yup.string().required(),
    // });

    return(
        <div>
            <h1>Create a listing</h1>
            <h1 className="font-bold text-2xl underline text-red-700">Hello react</h1>
            <form>
                {/* Title */}
                <section>   
                    <label htmlFor="title">Title</label><br/>
                    <input id="title" name="title" type="text" pattern="[a-zA-Z0-9]+" required></input>
                </section>
                {/* Brand */}
                <section>   
                    <label htmlFor="brand">Brand</label><br/>
                    <input id="brand" name="brand" type="text" pattern="[a-zA-Z0-9]+" required></input>
                </section>
                {/* Price */}
                <section>   
                    <label htmlFor="price">Price<br/>$ </label>
                    <input id="price" name="price" type="number" min="0.00" step="0.01" required></input>
                </section>
                {/* Description */}
                <section>   
                    <label htmlFor="description">Description</label><br/>
                    <textarea id="description" required></textarea>
                </section>
                {/* Platforms */}
                <section>
                    <p>Select platforms to post listing</p>
                    {/* ebay */}
                    <input id="ebay" name="ebay" type="checkbox"></input>
                    <label htmlFor="ebay">eBay</label><br/>
                    {/* poshmark */}
                    <input id="poshmark" name="poshmark" type="checkbox"></input>
                    <label htmlFor="poshmark">Poshmark</label><br/>
                    {/* depop */}
                    <input id="depop" name="depop" type="checkbox"></input>
                    <label htmlFor="depop">Depop</label><br/>
                    {/* mercari */}
                    <input id="mercari" name="mercari" type="checkbox"></input>
                    <label htmlFor="mercari">Mercari</label><br/>
                    {/* facebook */}
                    <input id="facebook" name="facebook" type="checkbox"></input>
                    <label htmlFor="facebook">Facebook Marketplace</label><br/>
                    {/* etc... */}
                    <br/>
                </section>
                {/* Buttons */}
                <button>Post listing</button>
                <button>Save as draft</button>
            </form>
        </div>
    )
};
export default ListingForm;