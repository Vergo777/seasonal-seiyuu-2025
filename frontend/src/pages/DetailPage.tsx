import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchVoiceActor } from '../api/client'
import type { VoiceActor, Role } from '../api/types'
import './DetailPage.css'

function DetailPage() {
    const { id } = useParams<{ id: string }>()
    const [voiceActor, setVoiceActor] = useState<VoiceActor | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'seasonal' | 'allTime'>('seasonal')

    useEffect(() => {
        async function loadData() {
            if (!id) return
            try {
                const va = await fetchVoiceActor(parseInt(id))
                setVoiceActor(va)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load voice actor')
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id])

    if (loading) {
        return (
            <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading voice actor...</p>
            </div>
        )
    }

    if (error || !voiceActor) {
        return (
            <div className="error-state">
                <h2>Voice Actor Not Found</h2>
                <p>{error || 'This voice actor could not be found.'}</p>
                <Link to="/" className="back-link">← Back to list</Link>
            </div>
        )
    }

    const seasonalRoles = voiceActor.seasonalRoles || []
    const allTimeRoles = voiceActor.allTimeRoles || []

    return (
        <div className="detail-page">
            <Link to="/" className="back-link">← Back to list</Link>

            <div className="detail-layout">
                {/* Left Sidebar: Profile & Stats */}
                <aside className="detail-sidebar">
                    <div className="sidebar-inner">
                        <img
                            src={voiceActor.imageUrl || '/placeholder-va.png'}
                            alt={voiceActor.name}
                            className="va-portrait"
                        />

                        <div className="sidebar-info">
                            <h1 className="va-name-sidebar">
                                <a
                                    href={`https://myanimelist.net/people/${voiceActor.malId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mal-name-link"
                                >
                                    {voiceActor.name} ↗
                                </a>
                            </h1>

                            <div className="sidebar-stats">
                                <div className="sidebar-stat-row">
                                    <span className="stat-icon">🎭</span>
                                    <div className="stat-content-mini">
                                        <span className="stat-value">{voiceActor.totalSeasonalShows}</span>
                                        <span className="stat-label">SEASON SHOWS</span>
                                    </div>
                                </div>
                                <div className="sidebar-stat-row">
                                    <span className="stat-icon">🎬</span>
                                    <div className="stat-content-mini">
                                        <span className="stat-value">{allTimeRoles.length}</span>
                                        <span className="stat-label">CAREER ROLES</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Right Content: Tabs & Grid */}
                <main className="detail-content">
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'seasonal' ? 'active' : ''}`}
                            onClick={() => setActiveTab('seasonal')}
                        >
                            This Season
                        </button>
                        <button
                            className={`tab ${activeTab === 'allTime' ? 'active' : ''}`}
                            onClick={() => setActiveTab('allTime')}
                        >
                            All-Time Roles
                        </button>
                    </div>

                    <div className="roles-grid">
                        {(activeTab === 'seasonal' ? seasonalRoles : allTimeRoles).map((role, i) => (
                            <RoleCard key={i} role={role} />
                        ))}
                        {(activeTab === 'seasonal' ? seasonalRoles : allTimeRoles).length === 0 && (
                            <div className="empty-state">
                                <p>No roles found.</p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}

function RoleCard({ role }: { role: Role }) {
    const animeUrl = role.anime?.malId ? `https://myanimelist.net/anime/${role.anime.malId}` : '#'
    const characterUrl = role.character?.malId ? `https://myanimelist.net/character/${role.character.malId}` : '#'

    return (
        <div className="role-card">
            <a href={animeUrl} target="_blank" rel="noopener noreferrer" className="role-anime-link">
                <img
                    src={role.anime.imageUrl || '/placeholder-anime.png'}
                    alt={role.anime.title}
                    className="role-anime-img"
                    loading="lazy"
                />
            </a>
            <div className="role-info">
                <a href={animeUrl} target="_blank" rel="noopener noreferrer" className="role-anime-title">
                    {role.anime.title}
                </a>
                <div className="role-character">
                    <a href={characterUrl} target="_blank" rel="noopener noreferrer" className="role-character-link">
                        <img
                            src={role.character.imageUrl || '/placeholder-char.png'}
                            alt={role.character.name}
                            className="role-character-img"
                        />
                    </a>
                    <span>
                        as <a href={characterUrl} target="_blank" rel="noopener noreferrer">{role.character.name}</a>
                    </span>
                </div>
            </div>
        </div>
    )
}

export default DetailPage
