import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Import content from other files
import './style.css'
import Layout from './pages/Layouts/Layout'
import AuthLayout from './pages/Layouts/AuthLayout'
import HomePage from './pages/MainPages/HomePage'
import ListingForm from './pages/MainPages/ListingForm'
import ListingHistory from './pages/MainPages/ListingHistory'
import Analytics from './pages/MainPages/Analytics'
import DBView from './pages/Testing Pages/testDBView'
import UserCred from './pages/Auth/UserCred'
import Warehouse from './pages/Auth/Warehouse'
import PasswordScreen from './pages/Auth/dbpassword'
import WelcomeScreen from './pages/Auth/WelcomeScreen'
import NewUserScreen from './pages/Auth/NewUserScreen'
import Location from './pages/Auth/Location'

// Authentication check function
const isAuthenticated = () => {
    return localStorage.getItem( 'authenticated' ) === 'true' // Change this logic as needed
}

// Protected Route Component
const ProtectedRoute = ( { element }: { element: React.ReactNode } ) => {
    return isAuthenticated() ? element : <Navigate to="/" />
}

ReactDOM.createRoot( document.getElementById( 'root' ) as HTMLElement ).render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                {/* Login Screen (First Page) */ }
                <Route path="/" element={ <WelcomeScreen /> } />
                <Route path="/new-user" element={ <NewUserScreen /> } />
                <Route path="/existing-user" element={ <PasswordScreen /> } />

                {/* Protected Routes (Require Authentication) */ }
                <Route path="/app" element={ <Layout /> }>
                    <Route index element={ <HomePage /> } />
                    <Route path="home" element={ <ProtectedRoute element={ <HomePage /> } /> } />
                    <Route
                        path="listinghistory"
                        element={ <ProtectedRoute element={ <ListingHistory /> } /> }
                    />
                    <Route path="analytics" element={ <ProtectedRoute element={ <Analytics /> } /> } />
                    <Route
                        path="listingform"
                        element={ <ProtectedRoute element={ <ListingForm /> } /> }
                    />
                    <Route path="dbview" element={ <ProtectedRoute element={ <DBView /> } /> } />
                    {/* find where app/usercred is being used and remove */ }
                    <Route
                        path="usercred"
                        element={ <ProtectedRoute element={ <UserCred platform="eBay" /> } /> }
                    />
                </Route>

                {/* Auth Layout */ }
                <Route path="/auth" element={ <AuthLayout /> }>
                    <Route
                        path="usercred"
                        element={ <ProtectedRoute element={ <UserCred platform="eBay" /> } /> }
                    />
                    <Route path="warehouse" element={ <ProtectedRoute element={ <Warehouse /> } /> } />
                    <Route path="location" element={ <ProtectedRoute element={ <Location /> } /> } />
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>
)
