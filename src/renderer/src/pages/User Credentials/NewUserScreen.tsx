import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const NewUserScreen = () => {
    const [generatedKey, setGeneratedKey] = useState('')
    const [copied, setCopied] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchKey = async () => {
            const key = await window.database.generateKey()
            setGeneratedKey(key)
        }

        fetchKey()
    }, [])

    const handleCopy = async () => {
        await navigator.clipboard.writeText(generatedKey)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleContinue = async () => {
        const dbPath = await window.database.selectSaveLocation()
        if (!dbPath) return

        try {
            const response = await window.database.initializeDatabase(generatedKey, true, dbPath)
            if (response.success) {
                localStorage.setItem('authenticated', 'true')
                navigate('/app/home')
            } else {
                alert(
                    response.error || 'Failed to initialize database. Database may already exist.'
                )
            }
        } catch (err: any) {
            console.error(err)
            if (err.message?.includes('already exists')) {
                alert('Database already exists. You may want to use the "Existing User" option.')
            } else {
                alert('Error initializing database.')
            }
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#FFDDE2]">
            <h2 className="text-3xl font-mono mb-4">Your Secure Key</h2>
            <p className="text-center max-w-md mb-2">
                This is your secure access key. Please copy it and store it safely. You will need it
                to access your database in the future.
            </p>
            <input
                type="text"
                readOnly
                value={generatedKey}
                className="w-full max-w-md text-center p-2 border rounded"
            />
            <button onClick={handleCopy} className="px-4 py-2 bg-blue-500 text-white rounded">
                {copied ? 'Copied!' : 'Copy Key'}
            </button>
            <p className="text-center text-sm text-gray-600 max-w-md">
                When you press Continue, you’ll be asked to choose where to save your encrypted
                database.
            </p>
            <button onClick={handleContinue} className="px-4 py-2 bg-green-500 text-white rounded">
                Continue
            </button>
            <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-500 text-white rounded"
            >
                Back
            </button>
        </div>
    )
}

export default NewUserScreen
