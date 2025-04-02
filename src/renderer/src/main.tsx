import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Import content from other files
import './style.css'
import Layout from './pages/Layout'
import HomePage from './pages/HomePage'
import ListingForm from './pages/ListingForm'
import ListingHistory from './pages/ListingHistory'
import Analytics from './pages/Analytics'
import DBView from './pages/testDBView'
import UserCred from './pages/UserCred'
import Password from './pages/dbpassword'  // Import login page

// Authentication check function
const isAuthenticated = () => {
    return localStorage.getItem('authenticated') === 'true';  // Change this logic as needed
};

// Protected Route Component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
    return isAuthenticated() ? element : <Navigate to="/" />;
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                {/* Login Screen (First Page) */}
                <Route path="/" element={<Password />} />

                {/* Protected Routes (Require Authentication) */}
                <Route path="/app" element={<Layout />}>
                    <Route path="/app/home" element={<ProtectedRoute element={<HomePage />} />} />
                    <Route path="/app/listinghistory" element={<ProtectedRoute element={<ListingHistory />} />} />
                    <Route path="/app/analytics" element={<ProtectedRoute element={<Analytics />} />} />
                    <Route path="/app/listingform" element={<ProtectedRoute element={<ListingForm />} />} />
                    <Route path="/app/dbview" element={<ProtectedRoute element={<DBView />} />} />
                    <Route path="/app/usercred" element={<ProtectedRoute element={<UserCred />} />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
);
