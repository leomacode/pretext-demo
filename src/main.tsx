import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { clearPretextCache } from './pretext'

// Pretext measures via canvas, which silently uses the fallback font until
// IBM Plex Mono finishes loading. Drop any widths cached before that.
document.fonts.ready.then(clearPretextCache)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
