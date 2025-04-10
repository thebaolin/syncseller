import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PasswordScreen = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!password) {
            setError('Please enter your key.');
            return;
        }

        try {
            const response = await window.database.initializeDatabase(password)
            if (response.success) {
                localStorage.setItem('authenticated', 'true') // Store authentication
                navigate('/app/home') // Redirect to the app
            } else {
                setError('Failed to open database. Key is incorrect.');
                console.log(response.error);
            }
        } catch (err) {
            setError('Error connecting to database.')
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-[#FFDDE2]">
            <h1 className="text-4xl font-mono mb-4">SyncSeller</h1>
            <h2 className="text-2xl mb-2">Enter Your Access Key</h2>
            <p className="text-center max-w-md mb-2">Please enter your key to access your database.</p>

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
                className="px-4 py-2 bg-green-500 text-white rounded w-full max-w-md"
            >
                Continue
            </button>

            <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-500 text-white rounded w-full max-w-md"
            >
                Back
            </button>
        </div>
    );
};

export default PasswordScreen
