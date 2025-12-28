import { useState, useEffect } from 'react'
import { fetchVoiceActors, fetchSeasonInfo } from '../api/client'
import type { VoiceActorSummary, SeasonInfo } from '../api/types'
import VoiceActorCard from '../components/VoiceActorCard'
import './HomePage.css'

function HomePage() {
    const [voiceActors, setVoiceActors] = useState<VoiceActorSummary[]>([])
    const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            try {
                const [vas, info] = await Promise.all([
                    fetchVoiceActors(),
                    fetchSeasonInfo()
                ])
                setVoiceActors(vas)
                setSeasonInfo(info)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    const filteredVAs = voiceActors.filter(va =>
        va.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading voice actors...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="error-state">
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        )
    }

    if (voiceActors.length === 0) {
        return (
            <div className="empty-state">
                <h2>No Data Available</h2>
                <p>Please trigger a data refresh from the admin panel.</p>
            </div>
        )
    }

    const getSeasonEmoji = (season: string) => {
        const s = season.toLowerCase()
        if (s.includes('spring')) return '🌸'
        if (s.includes('summer')) return '☀️'
        if (s.includes('fall') || s.includes('autumn')) return '🍂'
        if (s.includes('winter')) return '❄️'
        return '📅'
    }

    return (
        <div className="home-page">
            {seasonInfo && seasonInfo.season && (
                <div className="season-header">
                    <div className="season-badge-glow">
                        <span className="season-emoji">{getSeasonEmoji(seasonInfo.season)}</span>
                        <span className="season-name">
                            {seasonInfo.season.toUpperCase()} {seasonInfo.year}
                        </span>
                        <div className="season-divider"></div>
                        <span className="season-count">
                            <span className="count-val">{seasonInfo.voiceActorCount}</span>
                            <span className="count-label">ACTORS</span>
                        </span>
                    </div>
                </div>
            )}

            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Search voice actors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="va-grid">
                {filteredVAs.map(va => (
                    <a
                        key={va.malId}
                        href={`/seiyuu/va/${va.malId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="va-card-link"
                    >
                        <VoiceActorCard voiceActor={va} />
                    </a>
                ))}
            </div>

            {filteredVAs.length === 0 && searchQuery && (
                <div className="no-results">
                    <p>No voice actors found matching "{searchQuery}"</p>
                </div>
            )}
        </div>
    )
}

export default HomePage
