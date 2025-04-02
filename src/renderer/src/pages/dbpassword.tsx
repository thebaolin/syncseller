// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const Password = () => {
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const navigate = useNavigate();

//     const handleLogin = () => {
//         // TODO: Replace this with your actual decryption logic
//         if (password === "ok") { 
//             localStorage.setItem("authenticated", "true");
//             navigate('/app/home');  // Redirect to home
//         } else {
//             setError("Incorrect password. Try again.");
//         }
//     };

//     return (
//         <div>
//             <h2>Enter Database Password</h2>
//             <input 
//                 type="password" 
//                 value={password} 
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter password"
//             />
//             <button onClick={handleLogin}>Login</button>
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//         </div>
//     );
// };

// export default Password;

//-----------------------------------------------------------------
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Database from 'better-sqlite3-multiple-ciphers';
// import fs from 'fs';

// const Password = () => {
//     const [password, setPassword] = useState('');
//     const [error, setError] = useState('');
//     const navigate = useNavigate();

//     const handleLogin = () => {
//         try {
//             // Check if the database exists
//             const dbPath = 'app.db';
//             let db: Database;

//             if (fs.existsSync(dbPath)) {
//                 console.log('Opening existing database...');
//                 db = new Database(dbPath);
//                 db.pragma(`key='${password}'`);

//                 // Test if decryption was successful
//                 try {
//                     db.prepare('SELECT 1').get();
//                     console.log('Database opened successfully.');
//                     localStorage.setItem('authenticated', 'true');
//                     navigate('/app/home'); // Redirect to home
//                 } catch (err) {
//                     console.error('Decryption failed:', err);
//                     setError('Incorrect password. Try again.');
//                 }
//             } else {
//                 console.log('Creating a new database...');

//                 db = new Database(dbPath);
//                 db.pragma('foreign_keys = ON');
//                 db.pragma(`key='${password}'`);
//                 //createTables(db); // Create tables

//                 console.log('Database created and encrypted.');
//                 localStorage.setItem('authenticated', 'true');
//                 navigate('/app/home');
//             }
//         } catch (err) {
//             console.error('Database error:', err);
//             setError('Failed to access database.');
//         }
//     };

//     return (
//         <div>
//             <h2>Enter Database Password</h2>
//             <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="Enter password"
//             />
//             <button onClick={handleLogin}>Login</button>
//             {error && <p style={{ color: 'red' }}>{error}</p>}
//         </div>
//     );
// };

// export default Password;

//---------------------------------------

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
                setError('Failed to open database. Password is incorrect');
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
        </div>
        </div>
        </div>
    );
};

export default PasswordScreen;
