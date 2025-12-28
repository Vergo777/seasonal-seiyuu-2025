import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchVoiceActors, fetchCompare } from '../api/client'
import type { VoiceActorSummary, CompareResult } from '../api/types'
import './ComparePage.css'

function ComparePage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [voiceActors, setVoiceActors] = useState<VoiceActorSummary[]>([])
    const [va1Id, setVa1Id] = useState<number | null>(null)
    const [va2Id, setVa2Id] = useState<number | null>(null)
    const [result, setResult] = useState<CompareResult | null>(null)
    const [loading, setLoading] = useState(false)

    // Sort VAs by popularity (seasonal shows)
    const sortedVAs = [...voiceActors].sort((a, b) => b.totalSeasonalShows - a.totalSeasonalShows)

    useEffect(() => {
        fetchVoiceActors().then(setVoiceActors).catch(console.error)
    }, [])

    useEffect(() => {
        const id1 = searchParams.get('va1')
        const id2 = searchParams.get('va2')
        if (id1) setVa1Id(parseInt(id1))
        if (id2) setVa2Id(parseInt(id2))
    }, [searchParams])

    useEffect(() => {
        if (va1Id && va2Id) {
            setLoading(true)
            fetchCompare(va1Id, va2Id)
                .then(setResult)
                .catch(console.error)
                .finally(() => setLoading(false))
        }
    }, [va1Id, va2Id])

    const handleSelect = (slot: 1 | 2, va: VoiceActorSummary) => {
        if (slot === 1) {
            setVa1Id(va.malId)
            setSearchParams(prev => { prev.set('va1', va.malId.toString()); return prev })
        } else {
            setVa2Id(va.malId)
            setSearchParams(prev => { prev.set('va2', va.malId.toString()); return prev })
        }
    }

    const handleClear = (slot: 1 | 2) => {
        if (slot === 1) {
            setVa1Id(null)
            setResult(null)
            setSearchParams(prev => { prev.delete('va1'); return prev })
        } else {
            setVa2Id(null)
            setResult(null)
            setSearchParams(prev => { prev.delete('va2'); return prev })
        }
    }

    const getVaById = (id: number | null) => voiceActors.find(va => va.malId === id)

    return (
        <div className="compare-page">
            <h1 className="compare-title">⚔️ Compare Voice Actors</h1>
            <p className="compare-subtitle">Select two voice actors to compare their careers and find shared anime</p>

            <div className="compare-selectors">
                <VASelector
                    label="Voice Actor 1"
                    selectedId={va1Id}
                    voiceActors={sortedVAs}
                    onSelect={(va) => handleSelect(1, va)}
                    onClear={() => handleClear(1)}
                    getVaById={getVaById}
                />

                <div className="compare-vs">VS</div>

                <VASelector
                    label="Voice Actor 2"
                    selectedId={va2Id}
                    voiceActors={sortedVAs}
                    onSelect={(va) => handleSelect(2, va)}
                    onClear={() => handleClear(2)}
                    getVaById={getVaById}
                />
            </div>

            {loading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Finding shared anime...</p>
                </div>
            )}

            {result && !loading && (
                <CompareResults result={result} />
            )}
        </div>
    )
}

interface VASelectorProps {
    label: string
    selectedId: number | null
    voiceActors: VoiceActorSummary[]
    onSelect: (va: VoiceActorSummary) => void
    onClear: () => void
    getVaById: (id: number | null) => VoiceActorSummary | undefined
}

function VASelector({ label, selectedId, voiceActors, onSelect, onClear, getVaById }: VASelectorProps) {
    const [search, setSearch] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Show all VAs on focus, filter when typing
    const filteredVAs = search
        ? voiceActors.filter(va => va.name.toLowerCase().includes(search.toLowerCase())).slice(0, 50)
        : voiceActors.slice(0, 50)

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const selectedVa = getVaById(selectedId)

    if (selectedVa) {
        return (
            <div className="selector-box" ref={containerRef}>
                <label>{label}</label>
                <div className="selected-va" onClick={onClear}>
                    <img src={selectedVa.imageUrl} alt="" />
                    <span>{selectedVa.name}</span>
                    <button className="clear-btn">✕</button>
                </div>
            </div>
        )
    }

    return (
        <div className="selector-box" ref={containerRef}>
            <label>{label}</label>
            <div className="search-dropdown">
                <input
                    type="text"
                    placeholder="Search voice actors..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredVAs.length > 0 && (
                    <div className="dropdown-list">
                        {filteredVAs.map(va => (
                            <div key={va.malId} className="dropdown-item" onClick={() => { onSelect(va); setShowDropdown(false); setSearch('') }}>
                                <img src={va.imageUrl} alt="" />
                                <div className="dropdown-info">
                                    <span className="dropdown-name">{va.name}</span>
                                    <span className="dropdown-shows">{va.totalSeasonalShows} shows this season</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function CompareResults({ result }: { result: CompareResult }) {
    const { va1, va2, sharedAnime } = result
    const va1Url = `https://myanimelist.net/people/${va1.malId}`
    const va2Url = `https://myanimelist.net/people/${va2.malId}`

    return (
        <div className="compare-results">
            <div className="compare-header">
                <div className="compare-va compare-va-1">
                    <a href={va1Url} target="_blank" rel="noopener noreferrer">
                        <img className="compare-va-image" src={va1.imageUrl} alt={va1.name} />
                    </a>
                    <h2>
                        <a href={va1Url} target="_blank" rel="noopener noreferrer" className="mal-link">{va1.name} ↗</a>
                    </h2>
                    <div className="compare-va-stats">
                        <div className="compare-stat">
                            <span className="compare-stat-value">{va1.totalCareerRoles}</span>
                            <span className="compare-stat-label">Career Roles</span>
                        </div>
                        <div className="compare-stat">
                            <span className="compare-stat-value">{va1.totalSeasonalShows}</span>
                            <span className="compare-stat-label">This Season</span>
                        </div>
                    </div>
                </div>

                <div className="compare-vs-banner">
                    <span className="vs-text">VS</span>
                    <div className="shared-count">{sharedAnime.length} Shared Anime</div>
                </div>

                <div className="compare-va compare-va-2">
                    <a href={va2Url} target="_blank" rel="noopener noreferrer">
                        <img className="compare-va-image" src={va2.imageUrl} alt={va2.name} />
                    </a>
                    <h2>
                        <a href={va2Url} target="_blank" rel="noopener noreferrer" className="mal-link">{va2.name} ↗</a>
                    </h2>
                    <div className="compare-va-stats">
                        <div className="compare-stat">
                            <span className="compare-stat-value">{va2.totalCareerRoles}</span>
                            <span className="compare-stat-label">Career Roles</span>
                        </div>
                        <div className="compare-stat">
                            <span className="compare-stat-value">{va2.totalSeasonalShows}</span>
                            <span className="compare-stat-label">This Season</span>
                        </div>
                    </div>
                </div>
            </div>

            {sharedAnime.length > 0 ? (
                <>
                    <h3 className="shared-title">🤝 Shared Anime</h3>
                    <div className="shared-anime-grid">
                        {sharedAnime.map(anime => {
                            const animeUrl = `https://myanimelist.net/anime/${anime.malId}`
                            return (
                                <div key={anime.malId} className="shared-anime-card">
                                    <a href={animeUrl} target="_blank" rel="noopener noreferrer">
                                        <img className="shared-anime-image" src={anime.imageUrl} alt={anime.title} />
                                    </a>
                                    <div className="shared-anime-info">
                                        <a href={animeUrl} target="_blank" rel="noopener noreferrer" className="shared-anime-title mal-link">
                                            {anime.title} ↗
                                        </a>
                                        <div className="shared-characters">
                                            <span className="char-1">
                                                {anime.characters1.map((c, i) => (
                                                    <span key={c.malId || i}>
                                                        {i > 0 && ', '}
                                                        <a
                                                            href={`https://myanimelist.net/character/${c.malId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="char-link"
                                                            title={c.name}
                                                        >
                                                            {c.name}
                                                        </a>
                                                    </span>
                                                ))}
                                            </span>
                                            <span className="char-arrow">↔</span>
                                            <span className="char-2">
                                                {anime.characters2.map((c, i) => (
                                                    <span key={c.malId || i}>
                                                        {i > 0 && ', '}
                                                        <a
                                                            href={`https://myanimelist.net/character/${c.malId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="char-link"
                                                            title={c.name}
                                                        >
                                                            {c.name}
                                                        </a>
                                                    </span>
                                                ))}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : (
                <div className="no-shared">
                    <p>These voice actors haven't appeared in any anime together... yet!</p>
                </div>
            )}
        </div>
    )
}

export default ComparePage
