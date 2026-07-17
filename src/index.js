import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

const posthogKey = process.env.REACT_APP_PUBLIC_POSTHOG_KEY

if (posthogKey) {
  posthog.init(posthogKey, {
    api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-05-30',
    // Covers: autocapture, session recording, pageview/pageleave,
    // heatmaps, rageclick detection, web vitals.
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    capture_performance: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      recordCrossOriginIframes: false,
    },
  })
} else if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line no-console
  console.warn('PostHog key missing — analytics disabled for this build.')
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

reportWebVitals()
