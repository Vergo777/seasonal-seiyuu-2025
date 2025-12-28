import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import ComparePage from './pages/ComparePage'
import AboutPage from './pages/AboutPage'

function App() {
    return (
        <>
            <Header />
            <main className="main-content">
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
