// import './assets/main.css'

import React from 'react';
import ReactDOM from 'react-dom/client';
// import App from './App';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import '../index.css';
import Layout from './pages/Layout';
import ListingForm from './pages/ListingForm';
import ListingHistory from './pages/ListingHistory';
import Analytics from './pages/Analytics';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route path="/listinghistory" element={<ListingHistory />}/>
                    <Route path="/analytics" element={<Analytics />}/>
                    <Route path="/listingform" element={<ListingForm />}/>
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
