import './Footer.css'

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-rule" aria-hidden="true" />
            <p className="footer-title">Seasonal Seiyuu</p>
            <p className="footer-copy">
                Cast data via <a href="https://jikan.moe/" target="_blank" rel="noopener noreferrer">Jikan API <span aria-hidden="true">↗</span><span className="sr-only"> (external)</span></a> from MyAnimeList.
            </p>
            <p className="footer-note">An open catalogue for the current season.</p>
        </footer>
    )
}

export default Footer
