import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-600.css'
import '@fontsource/barlow-condensed/latin-400.css'
import '@fontsource/barlow-condensed/latin-500.css'
import '@fontsource/barlow-condensed/latin-600.css'
import './style.css'

createRoot(document.getElementById('app')!).render(
    <StrictMode>
        <BrowserRouter basename="/seiyuu">
            <App />
        </BrowserRouter>
    </StrictMode>,
)
