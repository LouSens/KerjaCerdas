import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

/**
 * Entry point for the KerjaCerdas frontend.
 * Initializes React with Router and global toast notifications.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
            <Toaster
                position="top-right"
                gutter={12}
                containerStyle={{
                    top: 20,
                    right: 24,
                }}
                toastOptions={{
                    duration: 3500,
                    style: {
                        background: '#FFFFFF',
                        color: '#090A0F',
                        border: '1.5px solid #090A0F',
                        borderRadius: '10px',
                        boxShadow: '3px 3px 0 #090A0F',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                        padding: '10px 16px',
                        maxWidth: '440px',
                        lineHeight: 1.4,
                    },
                    success: {
                        iconTheme: { primary: '#10B981', secondary: '#FFFFFF' },
                        style: {
                            borderLeft: '5px solid #10B981',
                        },
                    },
                    error: {
                        iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
                        style: {
                            borderLeft: '5px solid #EF4444',
                        },
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>,
)
