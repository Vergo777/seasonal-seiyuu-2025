import './AboutPage.css'

function AboutPage() {
    return (
        <div className="about-page">
            <header className="about-hero">
                <p className="eyebrow">A small product colophon</p>
                <h1>About the cast index</h1>
                <p>Seasonal Seiyuu is a living directory for discovering the voices behind the current anime season.</p>
            </header>

            <div className="about-grid">
                <section className="about-section about-section--wide" aria-labelledby="purpose-heading">
                    <p className="section-number">01 / PURPOSE</p>
                    <h2 id="purpose-heading">Read the season through its cast.</h2>
                    <p>
                        Browse voice actors, open their seasonal and career credits, and compare two actors to find the anime they share. The catalogue puts the people and relationships ahead of ornamental chrome.
                    </p>
                </section>

                <section className="about-section" aria-labelledby="completeness-heading">
                    <p className="section-number">02 / COMPLETENESS</p>
                    <h2 id="completeness-heading">The issue stays open.</h2>
                    <p>
                        Current-season cast data is refreshed automatically. Early in a season, some titles may still be filling in; the Browse issue shows the latest successful refresh and calls out incomplete cast context when it is available.
                    </p>
                </section>

                <section className="about-section" aria-labelledby="provenance-heading">
                    <p className="section-number">03 / PROVENANCE</p>
                    <h2 id="provenance-heading">Built from public credits.</h2>
                    <p>
                        Seasonal and career records are sourced through <a href="https://tenrai.org/" target="_blank" rel="noopener noreferrer">Tenrai v1 API <span aria-hidden="true">↗</span><span className="sr-only"> (external)</span></a>, a public API for MyAnimeList-derived anime, person, and character records. External links take you to the underlying MyAnimeList pages for actors, anime, and characters.
                    </p>
                </section>

                <section className="about-section" aria-labelledby="stack-heading">
                    <p className="section-number">04 / STACK</p>
                    <h2 id="stack-heading">Small, typed, and direct.</h2>
                    <ul className="about-list">
                        <li><strong>Frontend</strong><span>React 19 · TypeScript · Vite</span></li>
                        <li><strong>Backend</strong><span>Java 25 · Spring Boot 3.5</span></li>
                        <li><strong>Presentation</strong><span>Custom CSS · bundled editorial type</span></li>
                    </ul>
                </section>
            </div>

            <footer className="about-footer">
                <div>
                    <p className="eyebrow">Open project</p>
                    <p>The catalogue is maintained in the Seasonal Seiyuu repository.</p>
                </div>
                <a
                    href="https://github.com/Vergo777/seasonal-seiyuu-2025"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-github-link"
                >
                    View the repository <span aria-hidden="true">↗</span><span className="sr-only"> (external)</span>
                </a>
            </footer>

            <p className="about-collaboration">
                Project note: built through human–AI collaboration, with product direction and review kept in the loop.
            </p>
        </div>
    )
}

export default AboutPage
