import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchSeasonInfo, fetchVoiceActors } from '../api/client'
import type { SeasonInfo, VoiceActorSummary } from '../api/types'
import StatusPanel from '../components/StatusPanel'
import VoiceActorCard from '../components/VoiceActorCard'
import './HomePage.css'

function HomePage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [voiceActors, setVoiceActors] = useState<VoiceActorSummary[]>([])
    const [seasonInfo, setSeasonInfo] = useState<SeasonInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [reloadKey, setReloadKey] = useState(0)
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '')
    const deferredSearchQuery = useDeferredValue(searchQuery)

    useEffect(() => {
        setSearchQuery(searchParams.get('q') ?? '')
    }, [searchParams])

    useEffect(() => {
        let active = true

        async function loadData() {
            setLoading(true)
            setError(null)

            try {
                const [vas, info] = await Promise.all([
                    fetchVoiceActors(),
                    fetchSeasonInfo(),
                ])

                if (!active) return
                setVoiceActors(vas)
                setSeasonInfo(info)
            } catch (err) {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Failed to load catalogue data')
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()
        return () => { active = false }
    }, [reloadKey])

    const sortedVoiceActors = useMemo(
        () => [...voiceActors].sort((a, b) =>
            b.totalSeasonalShows - a.totalSeasonalShows || a.name.localeCompare(b.name)),
        [voiceActors],
    )

    const filteredVoiceActors = useMemo(() => {
        const query = deferredSearchQuery.trim().toLocaleLowerCase()
        if (!query) return sortedVoiceActors
        return sortedVoiceActors.filter(va => va.name.toLocaleLowerCase().includes(query))
    }, [deferredSearchQuery, sortedVoiceActors])

    const formattedRefresh = formatRefresh(seasonInfo?.lastSuccess ?? seasonInfo?.lastRefreshed)
    const seasonLabel = seasonInfo?.season && seasonInfo.year
        ? `${seasonInfo.season.toUpperCase()} ${seasonInfo.year}`
        : 'CURRENT SEASON'
    const actorCount = seasonInfo?.voiceActorCount ?? voiceActors.length

    function updateSearch(value: string) {
        setSearchQuery(value)
        setSearchParams(previous => {
            const next = new URLSearchParams(previous)
            const normalized = value.trim()
            if (normalized) next.set('q', normalized)
            else next.delete('q')
            return next
        }, { replace: true })
    }

    function clearSearch() {
        updateSearch('')
    }

    if (loading) {
        return (
            <div className="home-page">
                <StatusPanel tone="loading" eyebrow="Seasonal cast index" title="Loading the catalogue…">
                    <p>Gathering the latest voice-actor credits.</p>
                </StatusPanel>
            </div>
        )
    }

    if (error) {
        return (
            <div className="home-page">
                <StatusPanel
                    tone="error"
                    eyebrow="Catalogue unavailable"
                    title="The cast index could not load"
                    action={
                        <button className="text-button" type="button" onClick={() => setReloadKey(key => key + 1)}>
                            Try again
                        </button>
                    }
                >
                    <p>{error}</p>
                </StatusPanel>
            </div>
        )
    }

    return (
        <div className="home-page">
            <section className="season-issue" aria-labelledby="season-heading">
                <div className="issue-index" aria-hidden="true">
                    <span>ISSUE</span>
                    <strong>01</strong>
                    <span>CAST INDEX</span>
                </div>
                <div className="issue-heading">
                    <p className="eyebrow">The current season, in credits</p>
                    <h1 id="season-heading">{seasonLabel}</h1>
                    <p className="issue-deck">
                        A living directory of the voices shaping this season’s broadcast slate.
                    </p>
                </div>
                <div className="issue-facts" aria-label="Season catalogue facts">
                    <div className="issue-fact issue-fact--count">
                        <strong>{actorCount}</strong>
                        <span>actors indexed</span>
                    </div>
                    <div className="issue-fact">
                        <span className="fact-label">FRESHNESS</span>
                        <span>{formattedRefresh ? `Last successful refresh: ${formattedRefresh}` : 'Refresh time not available'}</span>
                    </div>
                    <div className="issue-fact issue-fact--note" aria-live="polite">
                        <span className="fact-label">EDITOR’S NOTE</span>
                        <span>Cast data refreshes automatically and can fill in as the season progresses.</span>
                        {!!seasonInfo?.incompleteAnimeCount && seasonInfo.incompleteAnimeCount > 0 && (
                            <span>
                                {seasonInfo.incompleteAnimeCount} title{seasonInfo.incompleteAnimeCount === 1 ? '' : 's'} still have cast data filling in.
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {voiceActors.length === 0 ? (
                <StatusPanel
                    tone="empty"
                    eyebrow="No entries yet"
                    title="No cast data is available"
                    action={
                        <button className="text-button" type="button" onClick={() => setReloadKey(key => key + 1)}>
                            Check again
                        </button>
                    }
                >
                    <p>The current season has not returned any voice actors yet. Try again shortly as the catalogue is refreshed automatically.</p>
                </StatusPanel>
            ) : (
                <section className="catalogue" aria-labelledby="catalogue-heading">
                    <div className="catalogue-header">
                        <div>
                            <p className="eyebrow">Browse the directory</p>
                            <h2 id="catalogue-heading">Voice actors</h2>
                        </div>
                        <p className="catalogue-count" id="catalogue-count" aria-live="polite">
                            {deferredSearchQuery.trim()
                                ? `${filteredVoiceActors.length} result${filteredVoiceActors.length === 1 ? '' : 's'} for “${deferredSearchQuery.trim()}”`
                                : `${filteredVoiceActors.length} actor${filteredVoiceActors.length === 1 ? '' : 's'} in this issue`}
                        </p>
                    </div>

                    <div className="catalogue-tools">
                        <label className="search-label" htmlFor="actor-search">Search the cast catalogue</label>
                        <div className="search-control">
                            <span className="search-glyph" aria-hidden="true">⌕</span>
                            <input
                                id="actor-search"
                                name="q"
                                type="search"
                                inputMode="search"
                                autoComplete="off"
                                className="search-input"
                                placeholder="Search voice actors…"
                                value={searchQuery}
                                onChange={event => updateSearch(event.currentTarget.value)}
                                aria-describedby="catalogue-count"
                            />
                            {searchQuery && (
                                <button className="clear-search" type="button" onClick={clearSearch} aria-label="Clear actor search">
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {filteredVoiceActors.length > 0 ? (
                        <div className="va-grid">
                            {filteredVoiceActors.map((voiceActor, index) => (
                                <Link
                                    key={voiceActor.malId}
                                    to={`/va/${voiceActor.malId}`}
                                    className="va-card-link"
                                    aria-label={`${voiceActor.name}, ${voiceActor.totalSeasonalShows} seasonal shows, ${voiceActor.totalCareerRoles} career roles`}
                                >
                                    <VoiceActorCard
                                        voiceActor={voiceActor}
                                        catalogueNumber={index + 1}
                                        priority={index < 6}
                                    />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="no-results" role="status" aria-live="polite">
                            <p className="eyebrow">No matching entries</p>
                            <h2>No voice actors found for “{deferredSearchQuery.trim()}”</h2>
                            <p>Try a different spelling or clear the search to return to the full issue.</p>
                            <button className="text-button" type="button" onClick={clearSearch}>Clear search</button>
                        </div>
                    )}
                </section>
            )}
        </div>
    )
}

function formatRefresh(value: string | null | undefined) {
    if (!value) return null
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export default HomePage
