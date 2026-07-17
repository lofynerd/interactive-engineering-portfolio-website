import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

posthog.init(process.env.REACT_APP_PUBLIC_POSTHOG_KEY, {
  api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST,
  defaults: '2026-05-30',
})

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

reportWebVitals()
