import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

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
                <option value="" disabled>
                    Select an option
                </option>
                {(options || []).map(([label, id], index) => (
                    <option key={index} value={label}>
                        {label}
                    </option>
                ))}
            </select>
        </div>
    )
}

const PoliciesForm = () => {
    const navigate = useNavigate()

    const [policies, setPolicies] = useState({
        fulfillment: "",
        payment: "",
        return: "",
        warehouse: "",
    })

    const handlePolicies = (event) => {
        const { name, value } = event.target
        setPolicies((prevData) => ({
            ...prevData,
            [name]: value
        }))
    }

    const [fulfillmentOptions, setFulfillmentOptions] = useState<[string, number][]>([])
    const [paymentOptions, setPaymentOptions] = useState<[string, number][]>([])
    const [returnOptions, setReturnOptions] = useState<[string, number][]>([])
    const [warehouseOptions, setWarehouseOptions] = useState<[string, number][]>([])

    const fetchPolicies = async () => {
        try {
            const { fulfillment, payment, return: returnPolicy, warehouse } = await window.electron.getEbayPolicies()
            
            setFulfillmentOptions(fulfillment)
            setPaymentOptions(payment)
            setReturnOptions(returnPolicy)
            setWarehouseOptions(warehouse)

            console.log("fulfillment: ", fulfillment)
            console.log("payment: ", payment)
            console.log("return: ", returnPolicy)
            console.log("warehouse: ", warehouse)
        } catch (err) {
            console.error("Failed policies: ", err)
        }
    }

    useEffect(() => {
        fetchPolicies() 
    }, [])

    return (
        <div className="content-full">
            <h1 className="text-center text-xl">Set eBay Policies</h1>
            <div className="w-1/3 m-auto">
                <form id="policies-form">
                    <Dropdown
                        id="fulfillment"
                        label="Fulfillment"
                        value={policies.fulfillment}
                        options={fulfillmentOptions}
                        onChange={handlePolicies}
                    />
                    <Dropdown
                        id="payment"
                        label="Payment"
                        value={policies.payment}
                        options={paymentOptions}
                        onChange={handlePolicies}
                    />
                    <Dropdown
                        id="return"
                        label="Return"
                        value={policies.return}
                        options={returnOptions}
                        onChange={handlePolicies}
                    />
                    <Dropdown
                        id="warehouse"
                        label="Warehouse"
                        value={policies.warehouse}
                        options={warehouseOptions}
                        onChange={handlePolicies}
                    />
                    <div className="flex flex-col-2 justify-between pt-[20px]">
                        <button 
                            className="form-button w-[150px] mx-[20px]" 
                            onClick={() => navigate("/app/home")}
                        >
                            Go Back
                        </button>
                        <button
                            className="form-button w-[150px] mx-[20px]"
                            // onClick={handleSubmit}
                            form="user-cred-form"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
export default PoliciesForm
