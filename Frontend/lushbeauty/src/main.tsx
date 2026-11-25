import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './shared/design/lush.css'
import './shared/design/components.css'
import './shared/design/app.css'
import App from './app/App'
import { motionAllowed } from './shared/motion'

// animejs lleva la entrada de bloques; el CSS de respaldo (keyframes `rise`) se apaga solo cuando hay movimiento.
if (motionAllowed()) document.documentElement.classList.add('has-motion')

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
