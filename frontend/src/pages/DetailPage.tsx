import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { fetchVoiceActor } from '../api/client'
import type { Role, VoiceActor } from '../api/types'
import StatusPanel from '../components/StatusPanel'
import './DetailPage.css'

type RoleView = 'seasonal' | 'career'

function DetailPage() {
    const { id } = useParams<{ id: string }>()
    const [searchParams, setSearchParams] = useSearchParams()
    const [voiceActor, setVoiceActor] = useState<VoiceActor | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const activeView: RoleView = searchParams.get('roles') === 'career' ? 'career' : 'seasonal'
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

    useEffect(() => {
        let active = true

        async function loadData() {
            if (!id) {
                setError('No voice actor was specified.')
                setLoading(false)
                return
            }

            setLoading(true)
            setError(null)
            try {
                const va = await fetchVoiceActor(Number(id))
                if (!active) return
                setVoiceActor(va)
            } catch (err) {
                if (!active) return
                setError(err instanceof Error ? err.message : 'Failed to load voice actor')
            } finally {
                if (active) setLoading(false)
            }
        }

        loadData()
        return () => { active = false }
    }, [id])

    function chooseView(view: RoleView, focus = false) {
        setSearchParams(previous => {
            const next = new URLSearchParams(previous)
            next.set('roles', view)
            return next
        })

        if (focus) {
            requestAnimationFrame(() => {
                tabRefs.current[view === 'seasonal' ? 0 : 1]?.focus()
            })
        }
    }

    function handleTabKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        const currentIndex = activeView === 'seasonal' ? 0 : 1
        let nextIndex: number | null = null
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % 2
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex + 1) % 2
        if (event.key === 'Home') nextIndex = 0
        if (event.key === 'End') nextIndex = 1
        if (nextIndex === null) return

        event.preventDefault()
        const nextView: RoleView = nextIndex === 0 ? 'seasonal' : 'career'
        chooseView(nextView, true)
    }

    if (loading) {
        return (
            <div className="detail-page detail-page--status">
                <StatusPanel tone="loading" eyebrow="Talent sheet" title="Loading voice actor credits…">
                    <p>Preparing seasonal and career roles.</p>
                </StatusPanel>
            </div>
        )
    }

    if (error || !voiceActor) {
        return (
            <div className="detail-page detail-page--status">
                <StatusPanel tone="error" eyebrow="Credit sheet unavailable" title="Voice actor not found">
                    <p>{error || 'This voice actor could not be found.'}</p>
                    <p><Link className="text-link" to="/">Return to the cast catalogue</Link></p>
                </StatusPanel>
            </div>
        )
    }

    const seasonalRoles = voiceActor.seasonalRoles || []
    const careerRoles = voiceActor.allTimeRoles || []
    const roles = activeView === 'seasonal' ? seasonalRoles : careerRoles

    return (
        <div className="detail-page">
            <Link to="/" className="back-link">← Back to Browse</Link>

            <section className="talent-sheet" aria-labelledby="actor-heading">
                <div className="talent-portrait">
                    <ImageFrame
                        src={voiceActor.imageUrl || '/placeholder-va.png'}
                        alt={voiceActor.name}
                        fallback={initials(voiceActor.name)}
                        width={320}
                        height={427}
                        loading="eager"
                    />
                </div>
                <div className="talent-identity">
                    <p className="eyebrow">Voice actor / catalogue entry</p>
                    <h1 id="actor-heading">{voiceActor.name}</h1>
                    <a
                        href={`https://myanimelist.net/people/${voiceActor.malId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link"
                    >
                        MyAnimeList profile <span aria-hidden="true">↗</span>
                        <span className="sr-only"> (external)</span>
                    </a>
                    <div className="talent-stats" aria-label="Voice actor credit totals">
                        <div>
                            <strong>{voiceActor.totalSeasonalShows}</strong>
                            <span>Season shows</span>
                        </div>
                        <div>
                            <strong>{careerRoles.length}</strong>
                            <span>Career roles</span>
                        </div>
                    </div>
                </div>
                <div className="talent-note">
                    <span className="fact-label">CATALOGUE NOTE</span>
                    <p>Seasonal credits are separated from the full career record so the current issue stays easy to scan.</p>
                </div>
            </section>

            <section className="credits-section" aria-labelledby="credits-heading">
                <div className="credits-heading-row">
                    <div>
                        <p className="eyebrow">Credits</p>
                        <h2 id="credits-heading">Roles & relationships</h2>
                    </div>
                    <p className="credits-count" aria-live="polite">{roles.length} {activeView === 'seasonal' ? 'seasonal' : 'career'} role{roles.length === 1 ? '' : 's'}</p>
                </div>

                <div className="role-tabs" role="tablist" aria-label="Role history">
                    <button
                        ref={element => { tabRefs.current[0] = element }}
                        id="seasonal-tab"
                        className="role-tab"
                        type="button"
                        role="tab"
                        aria-selected={activeView === 'seasonal'}
                        aria-controls="seasonal-panel"
                        tabIndex={activeView === 'seasonal' ? 0 : -1}
                        onClick={() => chooseView('seasonal')}
                        onKeyDown={handleTabKeyDown}
                    >
                        This Season
                    </button>
                    <button
                        ref={element => { tabRefs.current[1] = element }}
                        id="career-tab"
                        className="role-tab"
                        type="button"
                        role="tab"
                        aria-selected={activeView === 'career'}
                        aria-controls="career-panel"
                        tabIndex={activeView === 'career' ? 0 : -1}
                        onClick={() => chooseView('career')}
                        onKeyDown={handleTabKeyDown}
                    >
                        All-Time Roles
                    </button>
                </div>

                <div
                    id={`${activeView}-panel`}
                    className="roles-grid"
                    role="tabpanel"
                    aria-labelledby={`${activeView}-tab`}
                    tabIndex={0}
                >
                    {roles.length > 0 ? roles.map((role, index) => (
                        <RoleCard key={`${role.anime.malId}-${role.character.malId}-${index}`} role={role} />
                    )) : (
                        <div className="role-empty">
                            <p className="eyebrow">No credits in this view</p>
                            <h3>{activeView === 'seasonal' ? 'No seasonal roles are listed yet.' : 'No career roles are listed.'}</h3>
                            <p>Try the other role view or return to Browse.</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

function RoleCard({ role }: { role: Role }) {
    const animeUrl = role.anime?.malId ? `https://myanimelist.net/anime/${role.anime.malId}` : '#'
    const characterUrl = role.character?.malId ? `https://myanimelist.net/character/${role.character.malId}` : '#'

    return (
        <article className="role-card">
            <a href={animeUrl} target="_blank" rel="noopener noreferrer" className="role-anime-link" aria-label={`${role.anime.title} on MyAnimeList (external)`}>
                <ImageFrame
                    src={role.anime.imageUrl || '/placeholder-anime.png'}
                    alt={role.anime.title}
                    fallback={initials(role.anime.title)}
                    width={96}
                    height={136}
                />
            </a>
            <div className="role-info">
                <a href={animeUrl} target="_blank" rel="noopener noreferrer" className="role-anime-title" aria-label={`${role.anime.title} on MyAnimeList (external)`}>
                    {role.anime.title} <span aria-hidden="true">↗</span>
                </a>
                <div className="role-character">
                    <a href={characterUrl} target="_blank" rel="noopener noreferrer" className="role-character-link" aria-label={`${role.character.name} on MyAnimeList (external)`}>
                        <ImageFrame
                            src={role.character.imageUrl || '/placeholder-char.png'}
                            alt={role.character.name}
                            fallback={initials(role.character.name)}
                            width={48}
                            height={48}
                            circle
                        />
                    </a>
                    <span>as <a href={characterUrl} target="_blank" rel="noopener noreferrer" aria-label={`${role.character.name} on MyAnimeList (external)`}>{role.character.name}</a></span>
                </div>
            </div>
        </article>
    )
}

interface ImageFrameProps {
    src: string
    alt: string
    fallback: string
    width: number
    height: number
    loading?: 'eager' | 'lazy'
    circle?: boolean
}

function ImageFrame({ src, alt, fallback, width, height, loading = 'lazy', circle = false }: ImageFrameProps) {
    const [failed, setFailed] = useState(false)

    return (
        <span className={`image-frame ${circle ? 'image-frame--circle' : ''} ${failed ? 'image-frame--missing' : ''}`}>
            <span className="image-frame-fallback" aria-hidden="true">{fallback}</span>
            <img
                src={src}
                alt={alt}
                width={width}
                height={height}
                loading={loading}
                decoding="async"
                onError={() => setFailed(true)}
                hidden={failed}
            />
        </span>
    )
}

function initials(value: string) {
    return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

export default DetailPage
