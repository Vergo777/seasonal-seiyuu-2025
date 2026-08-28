import './Footer.css'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-rule" aria-hidden="true" />
            <p className="footer-title">Seasonal Seiyuu</p>
            <p className="footer-copy">
                Cast data via <a href="https://tenrai.org/" target="_blank" rel="noopener noreferrer">Tenrai v1 API <span aria-hidden="true">↗</span><span className="sr-only"> (external)</span></a> using MyAnimeList records.
            </p>
            <p className="footer-note">An open catalogue for the current season.</p>
        </footer>
    )
}

export default Footer
