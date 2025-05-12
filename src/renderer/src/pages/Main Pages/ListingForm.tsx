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
                <option value="" disabled>Select an option</option>
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
            <h1 className="text-lg font-bold mx-[20px]">{label}</h1>
            <div className=" flex h-[1px] bg-black mx-[20px]"></div>
        </div>
    )
}

const CheckboxInput = (props) => (
    <label>
        <input
            className="mr-1 my-[15px]"
            id={props.id}
            type="checkbox"
            checked={props.checked}
            onChange={props.onChange}
            name="option"
            value="option"
        />
        {props.label}
    </label>
)

const ListingForm = () => {
    // Listing object
    const [listingData, setListingData] = useState({
        onEbay: true,
        onEtsy: false,
        external_listing: 'eBay-xxxxx', // placeholder
        status: 'Active',
        price: 0,

        title: '',
        aspects: '[]',
        description: '',
        upc: '', //changed to str because of leading zeros and easier to count digits
        imageURL: [],
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

    const [myAspects, setMyAspects] = useState({
        size: '',
        color: '',
        brand: '',
        material: '', 
        model: '',
        style: ''
    });

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

    const requiredFields = {
        price: "Price",
        title: "Title",
        description: "Description",
        upc: "UPC",
        condition: "Condition" ,
        packageType: "Package Type",
        weightUnit: "Weight Unit",
        weight: "Weight",
        unit: "Unit",
        height: "Height",
        length: "Length",
        width: "Width",
        quantity: "Quantity"
    }

    // Validate listing
    const validateListing = () => {
        let missing: string[] = [];

        for (const key in requiredFields){
            if (!listingData[key]) {
                missing.push(requiredFields[key]);
            }
        }

        if (!missing) {
            return true;
        }
        else {
            alert(
                "Missing required fields:\n" +
                missing.map((m) => `-${m}`).join("\n") + '\n' +
                listingData.aspects
            )
            return false;
        }
    }

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        let listingAspects: string[] = [];
        Object.entries(myAspects).map(([key,value]) => {
            if (value){
                listingAspects.push(key + ': ' + value);
            }
        })
        listingData.aspects = listingAspects.join(',')

        const valid = validateListing();

        if (valid){
            const response = await window.database.insertFullListing({
                ...listingData
                //for now leave aspect out. need to figure out how to handle this
                //aspects: JSON.stringify(listingData.aspects) // convert to storable string
                // note to ivy: i handled the listing aspects and put them in string form
            })
    
            if (response.success) {
                alert('Listing submitted successfully!')
            } else {
                alert(`Failed to submit listing: ${response.error}`)
            }
        }
    }

    // Handle submit draft
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, checked } = e.target
        setListingData((prev) => ({
            ...prev,
            [id === 'ebay' ? 'onEbay' : 'onEtsy']: checked
        }))
    }

    const [selectedFile, setSelectedFile] = useState<File[]>([]);
    const [imagePreview, setImagePreview] = useState<string[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(prev => [...prev, file]);
            
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(prev => [...prev, objectUrl]);
            
            console.log('File selected:', file.name);
            console.log('Image preview URL:', objectUrl);
        }
    }

    const handleAspects = (event) => {
        const { name, value } = event.target
        setMyAspects((prevData) => ({
            ...prevData,
            [name]: value
        }))
    }

    return (
        <div className="content" id="form-content">
            <form className="" onSubmit={handleSubmit}>
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

                    {/* Upload Images */}
                    <div className="mx-[20px] my-[15px]">
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
                    </div>

                    {/* Images Preview */}
                    <div className="grid grid-cols-4 mx-[15px] my-[15px]">
                        {imagePreview.map((image, index) => (
                            <div className="flex-1 aspect-square shadow bg-white m-[5px]">
                                <img 
                                    className="h-full object-cover" 
                                    id="output" 
                                    src={image} 
                                    alt="image.name" 
                                    key={index}
                                ></img>
                            </div>
                        ))}
                    </div>
                </section>

                <section>
                    <SectionHeader label="Item Specifications" />

                    {/* Aspects - ?*/}
                    <div className="grid grid-cols-4">
                        {Object.entries(myAspects).map(([key,value]) => (
                            <div key={key}>
                                <TextInput
                                    id={key}
                                    value={value}
                                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                                    onChange={handleAspects}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col-2">
                        {/* UPC - Integer */}
                        <div className="flex-1">
                            <div className="flex-1 mx-[20px] my-[15px]">
                                <label htmlFor="upc">Universal Product Code (UPC)</label>
                                <br />
                                <input
                                    className="w-full"
                                    id="upc"
                                    name="upc"
                                    type="text"
                                    pattern="^\d{12}$"
                                    max="12"
                                    value={listingData.upc}
                                    onChange={handleChange}
                                ></input>
                            </div>
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

                <section>
                    <SectionHeader label="Package Size and Weight" />

                    <div>
                        {/* packageType */}
                        <div className="flex-1">
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
                    </div>

                    <div className="flex flex-col-2">
                        {/* weight - integer */}
                        <div className="flex-1">
                            <Dropdown
                                id="unit"
                                value={listingData.unit}
                                label="Length unit"
                                options={['inches', 'centimeters']}
                                onChange={handleChange}
                            />
                            <NumInput
                                id="height"
                                value={listingData.height}
                                label={`Height ${listingData.unit? `(${listingData.unit})`: ''}`}
                                onChange={handleChange}
                            /> 
                            <NumInput
                                id="length"
                                value={listingData.length}
                                label={`Length ${listingData.unit? `(${listingData.unit})`: ''}`}
                                onChange={handleChange}
                            />

                            <NumInput
                                id="width"
                                value={listingData.width}
                                label={`Width ${listingData.unit? `(${listingData.unit})`: ''}`}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Height - Integer */}
                        <div className="flex-1">
                            <Dropdown
                                id="weightUnit"
                                value={listingData.weightUnit}
                                label="Weight unit"
                                options={['pounds', 'ounces', 'grams', 'kilograms']}
                                onChange={handleChange}
                            />
                            <NumInput
                                id="weight"
                                value={listingData.weight}
                                label={`Weight ${listingData.weightUnit? `(${listingData.weightUnit})`: ''}`}
                                onChange={handleChange}
                            ></NumInput>
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader label="Listing Platforms" />
                    <div className="grid grid-cols-4 mx-[20px] my-[15px]">
                        <CheckboxInput
                            id="ebay"
                            checked={listingData.onEbay}
                            onChange={handleCheckboxChange}
                            label="eBay"
                        />
                       
                        <CheckboxInput
                            id="etsy"
                            checked={listingData.onEtsy}
                            onChange={handleCheckboxChange}
                            label="Etsy"
                        />
                        {/* <br /> */}
                        {/* <label>
                            <input id="shopify" type="checkbox" name="option" value="option" />
                            Shopify
                        </label> */}
                        {/* <br /> */}
                    </div>

                    <div className="flex flex-col-2">
                        <div className="flex-1">
                            <NumInput
                                id="price"
                                value={listingData.price}
                                label="Price (USD)"
                                onChange={handleChange}
                            />
                        </div>
                       
                        <div className="flex-1">
                            {/* quantity - integer */}
                            <NumInput
                                id="quantity"
                                value={listingData.quantity}
                                label="Quantity"
                                onChange={handleChange}
                            ></NumInput>
                        </div>

                        <div className="flex-1">
                            <Dropdown
                                id="status"
                                value={listingData.status}
                                label="Listing Status"
                                options={['Active', 'Sold', 'Deleted', 'Draft']}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <SectionHeader label="Submit Listing" />

                    <div className="flex flex-col-2 justify-evenly mt-[20px]">
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
            </form>
        </div>
    )
}
export default ListingForm
