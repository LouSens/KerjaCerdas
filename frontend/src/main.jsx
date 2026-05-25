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
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#1e293b',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '13px',
                    },
                    success: {
                        iconTheme: { primary: '#34d399', secondary: '#1e293b' },
                    },
                    error: {
                        iconTheme: { primary: '#f87171', secondary: '#1e293b' },
                    },
                }}
            />
        </BrowserRouter>
    </React.StrictMode>,
)
