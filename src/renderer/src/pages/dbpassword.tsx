import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PasswordScreen = () => {
    const [password, setPassword] = useState('');
    //const [dbPath, setDbPath] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        if (!password) {
            setError('Please enter password.');
            return;
        }

        try {
            const response = await window.database.initializeDatabase(password);
            if (response.success) {
                localStorage.setItem('authenticated', 'true'); // Store authentication
                navigate('/app/home'); // Redirect to the app
            } else {
                setError('Failed to open database. Key is incorrect');
                console.log(response.error)
            }
        } catch (err) {
            setError('Error connecting to database.');
        }
    };

    return (
        <div className="menu-bar flex justify-center">
            <div className="flex flex-col m-auto w-[40%]">
                <h1 className="text-4xl m-auto font-mono">SyncSeller</h1>
            </div>
            <div className="content-full">
                <h2 className="heading">Enter Database Password</h2>
                {/* <input
                type="text"
                placeholder="Database Path"
                value={dbPath}
                onChange={(e) => setDbPath(e.target.value)}
            /> */}
                <div className="w-1/3 m-auto">
                    <input className="w-[100%]"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleLogin}>Login</button>
                    {error && <p style={{ color: 'red' }}>{error}</p>}

                    <button onClick={() => navigate('/')} className="px-4 py-2 bg-gray-500 text-white rounded">
                        Back
                    </button>

                </div>
            </div>
        </div>
    );
};

export default PasswordScreen;
