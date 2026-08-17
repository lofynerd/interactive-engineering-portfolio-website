import React from 'react'
import ReactDOM from 'react-dom/client'
import posthog from 'posthog-js'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'

const posthogKey = process.env.REACT_APP_PUBLIC_POSTHOG_KEY

if (posthogKey) {
  posthog.init(posthogKey, {
    // Routed through our own managed reverse proxy (n.arpanraj.space) so
    // events aren't blocked by ad blockers that catch posthog.com by
    // domain — PostHog's own docs cite a 10-30% capture uplift from this.
    // ui_host must stay pointed at PostHog's real domain so in-app links
    // (toolbar, etc.) still resolve correctly.
    api_host: process.env.REACT_APP_PUBLIC_POSTHOG_HOST || 'https://n.arpanraj.space',
    ui_host: 'https://us.posthog.com',
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
