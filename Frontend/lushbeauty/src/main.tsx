import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/design/lush.css'
import './shared/design/components.css'
import './shared/design/app.css'
import App from './app/App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
