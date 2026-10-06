import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { applyStoredTheme } from '@/lib/theme'

applyStoredTheme()

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)