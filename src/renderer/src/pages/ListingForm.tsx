import { useState } from 'react'

const ListingForm = () => {
    class Listing {
        title: string
        brand: string
        price: number
        description: string
        platforms: Array<string>
        status: string
        date: Date

        constructor(title, brand, price, description, platforms, status) {
            this.title = title
            this.brand = brand
            this.price = price
            this.description = description
            this.platforms = platforms
            this.status = status
            this.date = new Date()
        }
    }

    const validatePost = async (e) => {
        e.preventDefault()
        console.log('validating form')

        // get values from form
        let title = document.forms['listing-form']['title'].value
        let brand = document.forms['listing-form']['brand'].value
        let price = document.forms['listing-form']['price'].value
        let description = document.forms['listing-form']['description'].value
        let ebay = document.forms['listing-form']['ebay'].value

        // validate form
        if (title === '') {
            alert('Title must be filled before posting')
            return false
        } else if (brand === '') {
            alert('Brand must be filled before posting')
            return false
        } else if (price === '') {
            alert('Price must be filled before posting')
            return false
        } else if (description === '') {
            alert('Description must be filled before posting')
            return false
        }

        // populate platforms
        const platforms = new Array()
        if (!ebay) {
            alert('Select platforms to post listing')
            return false
        }
        if (ebay) {
            platforms.push('ebay')
            window.electron.ebay()
        }

        // create a listing object
        let listing = new Listing(title, brand, price, description, platforms, 'Live')
        console.log(listing)
    }

    const validateDraft = async (e) => {
        e.preventDefault()
        console.log('validating draft')

        // get values from form
        let title = document.forms['listing-form']['title'].value
        let brand = document.forms['listing-form']['brand'].value
        let price = document.forms['listing-form']['price'].value
        let description = document.forms['listing-form']['description'].value
        let ebay = document.forms['listing-form']['ebay'].checked

        // validate form
        if (title === '') {
            alert('Title must be filled before posting')
            return false
        }

        // populate platforms
        const platforms = new Array()
        if (ebay) {
            platforms.push('ebay')
        }

        // create a listing object
        let listing = new Listing(title, brand, price, description, platforms, 'Draft')
        console.log(listing)
    }

    const [selectedFile, setSelectedFile] = useState(null)
    const [imagePreview, setImagePreview] = useState('')
    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (file) {
            setSelectedFile(file)

            const objectUrl = URL.createObjectURL(file)
            setImagePreview(objectUrl)

            console.log('File selected:', file.name)
            console.log('Image preview URL:', objectUrl)
        }
    }

    return (
        <div className="content">
            <h1 className="heading">Create a listing</h1>
            <form id="listing-form" autoComplete="on">
                {/* Title */}
                <section>
                    <label htmlFor="title">Title</label>
                    <br />
                    <input className="w-3/4" id="title" name="title" type="text"></input>
                </section>
                {/* Brand + Price */}
                <section className="flex">
                    <div className="pr-[20px] w-3/8">
                        <label htmlFor="brand">Brand</label>
                        <br />
                        <input className="w-full" id="brand" name="brand" type="text"></input>
                    </div>
                    <div className="w-3/8">
                        <label htmlFor="price">
                            Price
                            <br />${' '}
                        </label>
                        <input
                            className="w-[100px]"
                            id="price"
                            name="price"
                            type="number"
                            min="0.00"
                            step="0.01"
                            placeholder="0.00"
                        ></input>
                    </div>
                </section>
                {/* Upload Images */}
                <section>
                    <label>
                        Upload images
                        <br />
                    </label>
                    <input
                        type="file"
                        id="fileUpload"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                    ></input>
                </section>
                {/* Images Preview */}
                <section>
                    <div className="h-[300px] w-[300px] border-2">
                        <img id="output" src={imagePreview} alt="Preview"></img>
                    </div>
                </section>
                {/* Description */}
                <section>
                    <label htmlFor="description">Description</label>
                    <br />
                    <textarea className="w-3/4 h-[250px]" id="description"></textarea>
                </section>
                {/* Platforms */}
                <section className="platforms">
                    <p>Select platforms to post listing</p>
                    {/* ebay */}
                    <input id="ebay" name="ebay" type="checkbox"></input>
                    <label htmlFor="ebay">eBay</label>
                    <br />
                    {/* poshmark */}
                    <input id="poshmark" name="poshmark" type="checkbox"></input>
                    <label htmlFor="poshmark">Poshmark</label>
                    <br />
                    {/* depop */}
                    <input id="depop" name="depop" type="checkbox"></input>
                    <label htmlFor="depop">Depop</label>
                    <br />
                    {/* mercari */}
                    <input id="mercari" name="mercari" type="checkbox"></input>
                    <label htmlFor="mercari">Mercari</label>
                    <br />
                    {/* facebook */}
                    <input id="facebook" name="facebook" type="checkbox"></input>
                    <label htmlFor="facebook">Facebook Marketplace</label>
                    <br />
                    {/* etc... */}
                    <br />
                </section>
                {/* Submit buttons */}
                <section className="flex justify-center">
                    <button onClick={validatePost} form="listing-form" type="submit">
                        Post Listing
                    </button>
                    <button onClick={validateDraft} form="listing-form" type="submit">
                        Save as draft
                    </button>
                </section>
            </form>
        </div>
    )
}
export default ListingForm
