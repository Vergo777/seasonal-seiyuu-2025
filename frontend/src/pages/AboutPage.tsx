import './AboutPage.css'

function AboutPage() {
    return (
        <div className="about-page">
            <h1 className="about-title">About Seasonal Seiyuu</h1>

            <section className="about-section">
                <h2>🎙️ What is this?</h2>
                <p>
                    Seasonal Seiyuu is a web application that helps anime fans discover and explore
                    voice actors (seiyuu) appearing in the current anime season. Browse all voice actors,
                    see their roles, explore their full career history, and compare two VAs to find
                    anime they've worked on together.
                </p>
            </section>

            <section className="about-section">
                <h2>🤖 Built with AI</h2>
                <p>
                    This entire project was created using <strong>Antigravity</strong>, Google DeepMind's
                    advanced AI coding assistant. From the initial concept to the final implementation—including
                    the Spring Boot backend, React frontend, API integration, caching system, and all the
                    UI/UX design—every line of code was written through AI-human collaboration.
                </p>
            </section>

            <section className="about-section">
                <h2>🛠️ Tech Stack</h2>
                <ul className="tech-list">
                    <li><strong>Backend:</strong> Java 25, Spring Boot 3.5</li>
                    <li><strong>Frontend:</strong> React 18, TypeScript, Vite</li>
                    <li><strong>Styling:</strong> Custom CSS with Midnight Sakura theme</li>
                    <li><strong>Data Source:</strong> Jikan API (unofficial MyAnimeList API)</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>✨ Features</h2>
                <ul className="tech-list">
                    <li>Browse all voice actors in the current anime season</li>
                    <li>Search and filter by name</li>
                    <li>View detailed VA profiles with seasonal and all-time roles</li>
                    <li>Compare two VAs to discover shared anime</li>
                    <li>Direct links to MyAnimeList for VAs, anime, and characters</li>
                </ul>
            </section>

            <section className="about-section about-footer">
                <p>
                    <a
                        href="https://github.com/Vergo777/seasonal-seiyuu-2025"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="about-github-link"
                    >
                        View on GitHub →
                    </a>
                </p>
            </section>
        </div>
    )
}

export default AboutPage
