import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PasswordScreen = () => {
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const [dbPath, setDbPath] = useState<string | null>(null)

    const pickDatabase = async () => {
        const path = await window.database.selectDatabaseFile()
        setDbPath(path)
    }
    const handleLogin = async () => {
        if (!dbPath) {
            setError('Please select your database file.')
            return
        }

        if (!password) {
            setError('Please enter your key.')
            return
        }

        try {
            const response = await window.database.initializeDatabase(password, false, dbPath)
            if (response.success) {
                localStorage.setItem('authenticated', 'true')
                navigate('/app')
            } else {
                if (response.error?.includes('Database does not exist')) {
                    setError('No database found. Please create one first.')
                } else if (response.error?.includes('Incorrect password')) {
                    setError('Incorrect key. Please try again.')
                } else {
                    setError('Failed to open database.')
                }
                console.error(response.error)
            }
        } catch (err) {
            console.error(err)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#FFDDE2]">
            <h1 className="text-4xl font-mono mb-4">SyncSeller</h1>
            <button
                onClick={pickDatabase}
                className="bg-sagegreen border-1 border-gray-500 rounded-sm shadow p-[5px] text-black hover:bg-dustyrose hover:text-white max-w-md w-full mx-[20px] my-[15px]"
            >
                Choose Database File
            </button>
            {dbPath && (
                <p className="text-sm text-gray-600 max-w-md break-all text-center">
                    Selected: {dbPath}
                </p>
            )}
            <h2 className="text-2xl mb-2">Enter Your Access Key</h2>
            <p className="text-center max-w-md mb-2">
                Please enter your key to access your database.
            </p>

            <input
                type="password"
                placeholder="Enter your key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full max-w-md text-center p-2 border rounded"
            />
            {error && <p className="text-red-500">{error}</p>}

            <button
                onClick={handleLogin}
                className="bg-purple-300 border-1 border-gray-500 rounded-sm shadow p-[5px] text-black hover:bg-dustyrose hover:text-white max-w-md w-full mx-[20px] my-[15px]"
            >
                Continue
            </button>

            <button
                onClick={() => navigate('/')}
                className="bg-gray-400 border-1 border-gray-500 rounded-sm shadow p-[5px] max-w-md w-full text-black hover:bg-dustyrose hover:text-white mx-[20px] my-[15px]"
            >
                Back
            </button>
        </div>
    )
}

export default PasswordScreen
