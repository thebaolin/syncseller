import React, { useState } from 'react'

// Text input component
interface InputProps{
    id: string,
    value: any,
    label: string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const TextInput = (props: InputProps) => {
    const { id, label, value, onChange } = props;
    return (
        <div className='flex-1 mx-[20px] my-[15px]'>
            <label htmlFor={id}>{label}</label>
            <br/>
            <input 
                className="w-full" // need input padding
                id={id}
                name={id}
                type='text'
                value={value}
                onChange={onChange}
            ></input>
        </div>
    )
}

const NumInput = (props: InputProps) => {
    const { id, label, value, onChange } = props;
    return (
        <div className='flex-1 mx-[20px] my-[15px]'>
            <label htmlFor={id}>{label}</label>
            <br/>
            <input 
                className="w-full" // need input padding
                id={id}
                name={id}
                type='number'
                min='0'
                value={value}
                onChange={onChange}
            ></input>
        </div>
    )
}

const TextAreaInput = (props: InputProps) => {
    const { id, label, value, onChange } = props;
    return (
        <div className='flex-1 mx-[20px] my-[15px]'>
            <label htmlFor={id}>{label}</label>
            <br/>
            <textarea 
                className="w-full h-[200px]" // need input padding
                id={id}
                name={id}
                value={value}
                onChange={onChange}
            ></textarea>
        </div>
    )
}

// Dropdown input component
interface DropdownProps{
    id: string,
    value: any,
    label: string,
    options: any[],
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const Dropdown = (props: DropdownProps) => {
    const { id, label, value, options, onChange } = props;
    return (
        <div className='flex-1 mx-[20px] my-[15px]'>
            <label htmlFor={id}>{label}</label>
            <br/>
            <select
                className='w-full'
                id={id}
                name={id}
                value={value}
                onChange={onChange}
            >
                {options.map((option, index) => (
                    <option key={index} value={option}>
                        {option}
                    </option>
                ))}
            </select>
        </div>
    )
}

const ListingForm = () => {
    // Listing object
    const [listingData, setListingData] = useState({
        title: '',
        aspects: [],
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
    });
    
    // Handle change
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setListingData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    // Validate listing

    // Handle submit listing

    // Validate draft

    // Handle submit draft
    
    
    

    // const [selectedFile, setSelectedFile] = useState(null)
    // const [imagePreview, setImagePreview] = useState('')
    // const handleFileChange = (event) => {
    //     const file = event.target.files[0]
    //     if (file) {
    //         setSelectedFile(file)

    //         const objectUrl = URL.createObjectURL(file)
    //         setImagePreview(objectUrl)

    //         console.log('File selected:', file.name)
    //         console.log('Image preview URL:', objectUrl)
    //     }
    // }

    return (
        <div className="content" id='form-content'>
            <h1 className="heading">Create a listing</h1>
            <form>
                <h1 className='text-lg font-bold'>General Properties</h1>
                <div className='h-[1px] w-full bg-black'></div>
                <section>
                    {/* Title - Text Field*/}
                    <TextInput
                        id='title'
                        value={listingData.title}
                        label='Title'
                        onChange={handleChange}
                    />

                    {/* Description - Text Area */}
                    <TextAreaInput
                        id='description'
                        value={listingData.description}
                        label='Description'
                        onChange={handleChange}
                    />

                    {/* imageURL */}
                    <TextInput
                        id='imageURL'
                        value={listingData.imageURL}
                        label='Image URL'
                        onChange={handleChange}
                    /> 

                    {/* quantity - integer */}
                    <NumInput
                        id='quantity'
                        value={listingData.quantity}
                        label='Quantity'
                        onChange={handleChange}
                    ></NumInput>
                </section>

                <h1 className='text-lg font-bold'>Item Specifics</h1>
                <div className='h-[1px] w-full bg-black'></div>
                <section>
                    {/* Aspects */}

                    <div className='flex flex-col-2'>
                        {/* UPC - Integer */}
                        <NumInput
                            id='upc'
                            value={listingData.upc}
                            label='Universal Purchase Code (UPC)'
                            onChange={handleChange}
                        />

                        {/* Condition - options taken from eBay's Clothing, Shoes & Accessories: Clothing */}
                        <Dropdown
                            id='condition'
                            value={listingData.condition}
                            label='Condition'
                            options={[
                                'New with tags', 
                                'New without tags', 
                                'New with imperfections', 
                                'Pre-owned: Excellent', 
                                'Pre-owned - Good',
                                'Pre-owned - Fair',
                            ]}
                            onChange={handleChange}
                        />

                        
                    </div>
                </section>
                
                <h1 className='text-lg font-bold'>Package Size and Weight</h1>
                <div className='h-[1px] w-full bg-black'></div>
                <section>
                    {/* PackageWeightAndSize */}

                    <div className='flex flex-col-4'>
                        {/* unit - dropdown */}
                        <Dropdown
                            id='unit'
                            value={listingData.unit}
                            label='Unit'
                            options={[
                                'in',
                                'cm'
                            ]}
                            onChange={handleChange}
                        />

                        {/* Height - Integer */}
                        <NumInput
                            id='height'
                            value={listingData.height}
                            label='Height'
                            onChange={handleChange}
                        />

                        {/* Length - Integer */}
                        <NumInput
                            id='length'
                            value={listingData.length}
                            label='Length'
                            onChange={handleChange}
                        />

                        {/* Width - Integer */}
                        <NumInput
                            id='width'
                            value={listingData.width}
                            label='Width'
                            onChange={handleChange}
                        />
                    </div>

                    {/* packageType */}
                    <div className='flex flex-col-4'>
                        {/* weightUnit - dropdown */}
                        <Dropdown
                            id='weightUnit'
                            value={listingData.weightUnit}
                            label='Weight Unit'
                            options={[
                                'pounds',
                                'ounces',
                                'grams',
                                'kilograms'
                            ]}
                            onChange={handleChange}
                        />

                        {/* weight - integer */}
                        <NumInput
                            id='weight'
                            value={listingData.weight}
                            label='Weight'
                            onChange={handleChange}
                        ></NumInput>

                        <div className='flex-1 mx-[20px] my-[15px]'></div>
                        <div className='flex-1 mx-[20px] my-[15px]'></div>

                    </div>
                </section>

                {/* For debugging purposes - comment out later */}
                <div>
                    <h1>See Listing Data</h1>
                    <p>title: {listingData.title}
                        <br/>upc: {listingData.upc}
                        <br/>description: {listingData.description}
                        <br/>size: {listingData.height} {listingData.unit} x {listingData.length} {listingData.unit} x {listingData.width} {listingData.unit}
                    </p>
                </div>

                {/* <section>
                    <label htmlFor="title">Title</label>
                    <br />
                    <input className="w-3/4" id="title" name="title" type="text"></input>
                </section> */}
                {/* Brand + Price */}
                {/* <section className="flex">
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
                </section> */}
                {/* Upload Images */}
                {/* <section>
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
                </section> */}
                {/* Images Preview */}
                {/* <section>
                    <div className="h-[300px] w-[300px] border-2">
                        <img id="output" src={imagePreview} alt="Preview"></img>
                    </div>
                </section> */}
                {/* Description */}
                {/* <section>
                    <label htmlFor="description">Description</label>
                    <br />
                    <textarea className="w-3/4 h-[250px]" id="description"></textarea>
                </section> */}
                {/* Platforms */}
                {/* <section className="platforms">
                    <p>Select platforms to post listing</p>
                    ebay
                    <input id="ebay" name="ebay" type="checkbox"></input>
                    <label htmlFor="ebay">eBay</label>
                    <br />
                    poshmark
                    <input id="poshmark" name="poshmark" type="checkbox"></input>
                    <label htmlFor="poshmark">Poshmark</label>
                    <br />
                    depop
                    <input id="depop" name="depop" type="checkbox"></input>
                    <label htmlFor="depop">Depop</label>
                    <br />
                    mercari
                    <input id="mercari" name="mercari" type="checkbox"></input>
                    <label htmlFor="mercari">Mercari</label>
                    <br />
                    // {/* facebook */}
                    {/* <input id="facebook" name="facebook" type="checkbox"></input>
                    <label htmlFor="facebook">Facebook Marketplace</label>
                    <br />
                    etc...
                    <br />
                </section> */}
                {/* Submit buttons */}
                {/* <section className="flex justify-center">
                    <button onClick={validatePost} form="listing-form" type="submit">
                        Post Listing
                    </button>
                    <button onClick={validateDraft} form="listing-form" type="submit">
                        Save as draft
                    </button>
                </section> */}
            </form>
        </div>
    )
}
export default ListingForm
