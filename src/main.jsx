import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MobileApp from './components/Mobile/MobileApp.jsx'
import './index.css'

// Real phones/tablets send a "Mobi" (or platform) token in the UA that the
// kiosk's desktop Chromium never does, regardless of the kiosk screen's
// resolution — so this is reliable without a width-based breakpoint that
// could misfire on a small kiosk touchscreen. /mobile still forces it
// manually (e.g. testing from a desktop browser).
const isMobileUA = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
const isMobileRoute = isMobileUA || window.location.pathname.startsWith('/mobile')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isMobileRoute ? <MobileApp /> : <App />}
  </React.StrictMode>,
)
