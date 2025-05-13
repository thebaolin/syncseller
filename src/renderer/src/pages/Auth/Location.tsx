import { useState } from 'react'
import { useNavigate, useLocation } from "react-router-dom";

const InputSection = (args) => (
    <section className="mx-[20px] my-[15px]">
        <label htmlFor={args.id}>{args.title}</label>
        <br />
        <input 
            className="w-[100%]" 
            id={args.id} 
            name={args.id} 
            value={args.value}
            type="text"
        ></input>
    </section>
)

const Location = () => {
    const navigate = useNavigate();

    const [address, setAddress] =  useState({
        city: "",
        stateOrProvince: "",
        country: "",
        postalCode: ""
    })

    return (
        <div className="content-full">
            <button className="absolute form-button mt-3" onClick={() => navigate(-1)}>
                Go Back
            </button>
            <h1 className="heading">Location Details</h1>
            <div className="w-1/3 m-auto">
                <form>
                    <InputSection id="city" title="City" value={address.city}/>
                    <InputSection id="city" title="City" value={address.city}/>
                </form>
            </div>
        </div>
    )
}
export default Location;