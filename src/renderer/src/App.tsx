import React, { useState } from 'react';
import Versions from './components/Versions';
import electronLogo from './assets/electron.svg'


function App(): JSX.Element {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [message, setMessage] = useState<string | null>(null);


 const createListingHandler = (): void => {
   setLoading(true);
   setError(null);
   setMessage(null);


   window.electron.ipcRenderer
     .invoke('create-listing')  // Send IPC message to main process
     .then((result) => {
       setLoading(false);
       setMessage('Attempted to create listing');
       console.log('Listing creation result:', result);
     })
     .catch((err) => {
       setLoading(false);
       setError('Failed to create listing');
       console.error(err);
     });
 };


 return (
   <>
     <img alt="logo" className="logo" src={electronLogo} />
     <div className="creator">Powered by electron-vite</div>
     <div className="text">
       Build an Electron app with <span className="react">React</span>
       &nbsp;and <span className="ts">TypeScript</span>
     </div>
     <p className="tip">
       Please try pressing <code>F12</code> to open the devTool
     </p>


     {/* Button to trigger listing creation */}
     <button onClick={createListingHandler} disabled={loading}>
       {loading ? 'Creating Listing...' : 'Create Listing'}
     </button>


     {message && <p>{message}</p>}
     {error && <p style={{ color: 'red' }}>{error}</p>}


     <Versions />
   </>
 );
}


export default App;
