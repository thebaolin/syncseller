import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Import content from other files
import './style.css'
import Layout from './pages/Main Pages/Layout'
import HomePage from './pages/Main Pages/HomePage'
import ListingForm from './pages/Main Pages/ListingForm'
import ListingHistory from './pages/Main Pages/ListingHistory'
import Analytics from './pages/Main Pages/Analytics'
import DBView from './pages/Testing Pages/testDBView'
import UserCred from './pages/User Credentials/UserCred'
import PasswordScreen from './pages/User Credentials/dbpassword'
import WelcomeScreen from './pages/User Credentials/WelcomeScreen'
import NewUserScreen from './pages/User Credentials/NewUserScreen'

// Authentication check function
const isAuthenticated = () => {
    return localStorage.getItem('authenticated') === 'true' // Change this logic as needed
}

// Protected Route Component
const ProtectedRoute = ({ element }: { element: React.ReactNode }) => {
    return isAuthenticated() ? element : <Navigate to="/" />
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                {/* Login Screen (First Page) */}
                <Route path="/" element={<WelcomeScreen />} />
                <Route path="/new-user" element={<NewUserScreen />} />
                <Route path="/existing-user" element={<PasswordScreen />} />

                {/* Protected Routes (Require Authentication) */}
                <Route path="/app" element={<Layout />}>
                    <Route path="/app/home" element={<ProtectedRoute element={<HomePage />} />} />
                    <Route
                        path="/app/listinghistory"
                        element={<ProtectedRoute element={<ListingHistory />} />}
                    />
                    <Route
                        path="/app/analytics"
                        element={<ProtectedRoute element={<Analytics />} />}
                    />
                    <Route
                        path="/app/listingform"
                        element={<ProtectedRoute element={<ListingForm />} />}
                    />
                    <Route path="/app/dbview" element={<ProtectedRoute element={<DBView />} />} />
                    <Route
                        path="/app/usercred"
                        element={<ProtectedRoute element={<UserCred platform="eBay" />} />}
                    />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
