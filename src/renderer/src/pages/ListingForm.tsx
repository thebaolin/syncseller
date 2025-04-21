import React, { useState } from 'react'
interface InputProps {
    id: string
    value: any
    label: string
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const TextInput = (props: InputProps) => {
    const { id, label, value, onChange } = props
    return (
        <div className="flex-1 mx-[20px] my-[15px]">
            <label htmlFor={id}>{label}</label>
            <br />
            <input
                className="w-full"
                id={id}
                name={id}
                type="text"
                value={value}
                onChange={onChange}
            ></input>
        </div>
    )
}

const NumInput = (props: InputProps) => {
    const { id, label, value, onChange } = props
    return (
        <div className="flex-1 mx-[20px] my-[15px]">
            <label htmlFor={id}>{label}</label>
            <br />
            <input
                className="w-full"
                id={id}
                name={id}
                type="number"
                min="0"
                value={value}
                onChange={onChange}
            ></input>
        </div>
    )
}

const TextAreaInput = (props: InputProps) => {
    const { id, label, value, onChange } = props
    return (
        <div className="flex-1 mx-[20px] my-[15px]">
            <label htmlFor={id}>{label}</label>
            <br />
            <textarea
                className="w-full h-[200px]"
                id={id}
                name={id}
                value={value}
                onChange={onChange}
            ></textarea>
        </div>
    )
}

// Dropdown input component
interface SelectProps {
    id: string
    value: any
    label: string
    options: any[]
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const Dropdown = (props: SelectProps) => {
    const { id, label, value, options, onChange } = props
    return (
        <div className="mx-[20px] my-[15px]">
            <label htmlFor={id}>{label}</label>
            <br />
            <select className="w-full" id={id} name={id} value={value} onChange={onChange}>
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

const SectionHeader = ({ label }) => {
    return (
        <div>
            <h1 className="text-lg font-bold">{label}</h1>
            <div className="h-[1px] w-full bg-black"></div>
        </div>
    )
}

const ListingForm = () => {
    // Listing object
    const [listingData, setListingData] = useState({
        onEbay: true,
        onEtsy: false,
        external_listing: 'eBay-xxxxx', // placeholder
        status: 'Active',
        price: 0,

        title: '',
        aspects: "[]",
        description: '',
        upc: 0,
        imageURL: '',
        condition: '',
        packageWeightAndSize: '',
        height: 0,
        length: 0,
        width: 0,
        unit: '',
        packageType: '',
        weight: 0,
        weightUnit: '',
        quantity: 0
    })

    // Handle change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target
        setListingData((prevData) => ({
            ...prevData,
            [name]: value
        }))
    }

    // Validate listing

    // Handle submit listing
    // const handleSubmit = (e) => {
    //     e.preventDefault
    //     setListingData((prevData) => ({
    //         ...prevData
    //     }))
    //     console.log('Form submitted', listingData)
    // }

    // Validate draft
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const response = await window.database.insertFullListing({
            ...listingData
            //for now leave aspect out. need to figure out how to handle this
            //aspects: JSON.stringify(listingData.aspects) // convert to storable string 
        })

        if (response.success) {
            alert('Listing submitted successfully!')
        } else {
            alert(`Failed to submit listing: ${response.error}`)
        }
    }

    // Handle submit draft
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target
        setListingData(prev => ({
            ...prev,
            [id === 'ebay' ? 'onEbay' : 'onEtsy']: checked
        }))
    }
    return (
        <div className="content" id="form-content">
            <h1 className="heading">Create a listing</h1>
            <form onSubmit={handleSubmit}>
                <section>
                    <SectionHeader label="General Properties" />

                    {/* Title - Text Field*/}
                    <TextInput
                        id="title"
                        value={listingData.title}
                        label="Title"
                        onChange={handleChange}
                    />

                    {/* Description - Text Area */}
                    <TextAreaInput
                        id="description"
                        value={listingData.description}
                        label="Description"
                        onChange={handleChange}
                    />

                    {/* imageURL */}
                    <TextInput
                        id="imageURL"
                        value={listingData.imageURL}
                        label="Image URL"
                        onChange={handleChange}
                    />

                    {/* quantity - integer */}
                    <NumInput
                        id="quantity"
                        value={listingData.quantity}
                        label="Quantity"
                        onChange={handleChange}
                    ></NumInput>
                </section>

                <section>
                    <SectionHeader label="Item Specifications" />

                    {/* Aspects - ?*/}

                    <div className="flex flex-col-2">
                        {/* UPC - Integer */}
                        <div className="flex-1">
                            <NumInput
                                id="upc"
                                value={listingData.upc}
                                label="Universal Purchase Code (UPC)"
                                onChange={handleChange}
                            />
                        </div>

                        {/* Condition - options taken from eBay's Clothing, Shoes & Accessories: Clothing */}
                        <div className="flex-1">
                            <Dropdown
                                id="condition"
                                value={listingData.condition}
                                label="Condition"
                                options={[
                                    'New with tags',
                                    'New without tags',
                                    'New with imperfections',
                                    'Pre-owned: Excellent',
                                    'Pre-owned - Good',
                                    'Pre-owned - Fair'
                                ]}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </section>

                {/* PackageWeightAndSize - ? */}
                <section>
                    <SectionHeader label="Package Size and Weight" />

                    <div className="flex flex-col-4">
                        {/* packageType */}
                        <div className="flex-2">
                            <Dropdown
                                id="packageType"
                                value={listingData.packageType}
                                label="Package Type"
                                options={[
                                    'Letter',
                                    'Large Envelope',
                                    'Package/Thick Envelope',
                                    'Large Package'
                                ]}
                                onChange={handleChange}
                            />
                        </div>

                        {/* weightUnit - dropdown */}
                        <div className="flex-1">
                            <Dropdown
                                id="weightUnit"
                                value={listingData.weightUnit}
                                label="Weight Unit"
                                options={['pounds', 'ounces', 'grams', 'kilograms']}
                                onChange={handleChange}
                            />
                        </div>

                        {/* weight - integer */}
                        <div className="flex-1">
                            <NumInput
                                id="weight"
                                value={listingData.weight}
                                label="Weight"
                                onChange={handleChange}
                            ></NumInput>
                        </div>
                    </div>

                    <div className="flex flex-col-4">
                        {/* unit - dropdown */}
                        <div className="flex-1">
                            <Dropdown
                                id="unit"
                                value={listingData.unit}
                                label="Unit"
                                options={['in', 'cm']}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Height - Integer */}
                        <div className="flex-1">
                            <NumInput
                                id="height"
                                value={listingData.height}
                                label="Height"
                                onChange={handleChange}
                            />
                        </div>

                        {/* Length - Integer */}
                        <div className="flex-1">
                            <NumInput
                                id="length"
                                value={listingData.length}
                                label="Length"
                                onChange={handleChange}
                            />
                        </div>

                        {/* Width - Integer */}
                        <div className="flex-1">
                            <NumInput
                                id="width"
                                value={listingData.width}
                                label="Width"
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader label="Listing Platforms" />
                    {/* NON FUNCTIONAL */}
                    <div className="mx-[20px] my-[15px]">
                        <label>
                            <input id="ebay" type="checkbox" checked={listingData.onEbay} onChange={handleCheckboxChange} name="option" value="option" />
                            eBay
                        </label>
                        <br />
                        <label>
                            <input id="etsy" type="checkbox" checked={listingData.onEtsy} onChange={handleCheckboxChange} name="option" value="option" />
                            Etsy
                        </label>
                        <br />
                        {/* <label>
                            <input id="shopify" type="checkbox" name="option" value="option" />
                            Shopify
                        </label> */}
                        <br />
                    </div>
                </section>
                <NumInput
                    id="price"
                    value={listingData.price}
                    label="Price (USD)"
                    onChange={handleChange}
                />

                <Dropdown
                    id="status"
                    value={listingData.status}
                    label="Listing Status"
                    options={['Active', 'Sold', 'Deleted', 'Draft']}
                    onChange={handleChange}
                />

                <section>
                    <SectionHeader label="Submit Listing" />

                    <div className="flex flex-col-2 justify-evenly">
                        {/* Submit Draft */}
                        <button className="form-button w-[150px] mx-[20px] my-[15px]">
                            Save Draft
                        </button>

                        {/* Submit Listing */}
                        <button className="form-button w-[150px] mx-[20px] my-[15px]" type="submit">
                            Post Listing
                        </button>
                    </div>
                </section>

                {/* For debugging purposes - comment out later */}
                {/* <div className='bg-white'>
                    <h1 className='font-bold'>See Listing Data</h1>
                    <p>title: {listingData.title}
                        <br/>description: {listingData.description}
                        <br/><img className='border' src={listingData.imageURL} alt='listing form img'/>
                        <br/>quantity: {listingData.quantity}
                        <br/>upc: {listingData.upc}
                        <br/>condition: {listingData.condition}
                        <br/>size: {listingData.height} {listingData.unit} x {listingData.length} {listingData.unit} x {listingData.width} {listingData.unit}
                        <br/>weight: {listingData.weight} {listingData.weightUnit}
                    </p>
                </div> */}
            </form>
        </div>
    )
}
export default ListingForm
