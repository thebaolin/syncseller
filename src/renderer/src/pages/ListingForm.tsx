const ListingForm = () => {    
    // listing object
    function Listing(title:string, brand:string, price:number, description:string, platforms:Array<string>) {
        this.title_ = title;
        this.brand_= brand;
        this.price_ = price;
        this.description_  = description;
        this.platforms_ = platforms;
    }

    function validatePost() {
        console.log("hi")
        let title = document.forms["listing-form"]["title"].value;
        let brand = document.forms["listing-form"]["brand"].value;
        let price = document.forms["listing-form"]["price"].value;
        let description = document.forms["listing-form"]["description"].value;
        let platforms = document.forms["listing-form"]["platforms"].value;
        console.log("hi")
    }

    function validateDraft() {

    }

    

    return(
        <div>
            <h1 className="heading">Create a listing</h1>
            <form onSubmit={ validatePost }>
                {/* Title */}
                <section>   
                    <label htmlFor="title">Title</label><br/>
                    <input className="w-3/4" id="title" name="title" type="text" pattern="[a-zA-Z0-9]+"></input>
                </section>
                {/* Brand + Price */}
                <section className="flex">
                    <div className="pr-[20px] w-3/8">   
                        <label htmlFor="brand">Brand</label><br/>
                        <input className="w-full" id="brand" name="brand" type="text" pattern="[a-zA-Z0-9]+"></input>
                    </div>
                    <div className="w-3/8">   
                        <label htmlFor="price">Price<br/>$ </label>
                        <input className="w-1/2" id="price" name="price" type="number" min="0.00" step="0.01"></input>
                    </div>
                </section>
                {/* Description */}
                <section>   
                    <label htmlFor="description">Description</label><br/>
                    <textarea className="w-3/4 h-[250px]" id="description"></textarea>
                </section>
                {/* Platforms */}
                <section className="platforms">
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
                <section className="flex justify-center">
                    <button>Post listing</button>
                    <button>Save as draft</button>
                </section>
            </form>
        </div>
    )
};
export default ListingForm;