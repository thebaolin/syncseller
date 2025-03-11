const ListingForm = () => {    
    // UNDER CONSTRUCTION listing object is created when a form is submitted
    class Listing {
        constructor(title:string, brand:string, price:number, description:string, platforms:Array<string>){
            this.title = title;
            this.brand= brand;
            this.price = price;
            this.description  = description;
            this.platforms = platforms;
            this.status = getStatus();
            this.date = getDate();
        }
        getDate
    }

    function validatePost() {
        // get values from form
        let title = document.forms["listing-form"]["title"].value;
        let brand = document.forms["listing-form"]["brand"].value;
        let price = document.forms["listing-form"]["price"].value;
        let description = document.forms["listing-form"]["description"].value;
        let ebay = document.forms["listing-form"]["ebay"].value;
        console.log("eBBBay:", ebay);
        
        // validate form
        if (title == ''){
            alert("Title must be filled before posting")
            return false;
        }
        else if (brand == ''){
            alert("Brand must be filled before posting")
            return false;
        }
        else if (price == ''){
            alert("Price must be filled before posting")
            return false;
        }
        else if (description == ''){
            alert("Description must be filled before posting")
            return false;
        }

        // populate platforms
        if (!ebay){
            alert("Select platforms to post listing")
            return false;
        }
        // if (ebay) {

        // }
        // let platforms =

        // create a listing object
        // let listing = new Listing(title, brand, price, description)
    }

    // function validateDraft() {

    // }

    

    return(
        <div className="content">
            <h1 className="heading">Create a listing</h1>
            <form onSubmit={ validatePost } id="listing-form" autoComplete="on">
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
                        <input className="w-[100px]" id="price" name="price" type="number" min="0.00" step="0.01"></input>
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
                    <button form="listing-form">Post Listing</button>
                    <button form="listing-form">Save as draft</button>
                </section>
            </form>
        </div>
    )
};
export default ListingForm;