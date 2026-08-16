import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import ComparePage from './pages/ComparePage'
import AboutPage from './pages/AboutPage'

function App() {
    const location = useLocation()

    useEffect(() => {
        const titles: Record<string, string> = {
            '/': 'Browse the seasonal cast | Seasonal Seiyuu',
            '/compare': 'Compare shared credits | Seasonal Seiyuu',
            '/about': 'About the cast index | Seasonal Seiyuu',
        }
        const detailTitle = location.pathname.startsWith('/va/')
            ? 'Voice actor credits | Seasonal Seiyuu'
            : undefined

        document.title = detailTitle ?? titles[location.pathname] ?? 'Seasonal Seiyuu'
        document.querySelector('meta[name="description"]')?.setAttribute(
            'content',
            location.pathname === '/'
                ? 'Browse the current anime season’s voice-actor cast index.'
                : 'Seasonal Seiyuu is an editorial index of anime voice actors and their credits.',
        )
    }, [location.pathname])

    return (
        <>
            <Header />
            <main className="main-content" id="main-content" tabIndex={-1}>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/va/:id" element={<DetailPage />} />
                    <Route path="/compare" element={<ComparePage />} />
                    <Route path="/about" element={<AboutPage />} />
                </Routes>
            </main>
            <Footer />
        </>
    )
}

export default App
