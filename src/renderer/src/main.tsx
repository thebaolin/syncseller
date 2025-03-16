import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// import content from other files
import './style.css'
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import ListingForm from './pages/ListingForm'
import ListingHistory from './pages/ListingHistory'
import Analytics from './pages/Analytics'
import DBView from './pages/testDBView'
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/listinghistory" element={<ListingHistory />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/listingform" element={<ListingForm />} />
                    <Route path="/dbview" element={<DBView />} />
                    
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
