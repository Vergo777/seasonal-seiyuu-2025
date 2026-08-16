import { useEffect, useId, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchCompare, fetchVoiceActors } from '../api/client'
import type { CompareResult, VoiceActorSummary } from '../api/types'
import StatusPanel from '../components/StatusPanel'
import './ComparePage.css'

function ComparePage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [voiceActors, setVoiceActors] = useState<VoiceActorSummary[]>([])
    const [actorsLoading, setActorsLoading] = useState(true)
    const [actorsError, setActorsError] = useState<string | null>(null)
    const [comparison, setComparison] = useState<CompareResult | null>(null)
    const [comparisonLoading, setComparisonLoading] = useState(false)
    const [comparisonError, setComparisonError] = useState<string | null>(null)
    const [selectionError, setSelectionError] = useState<string | null>(null)
    const [retryKey, setRetryKey] = useState(0)

    const va1Id = parseId(searchParams.get('va1'))
    const va2Id = parseId(searchParams.get('va2'))
    const sortedActors = [...voiceActors].sort((a, b) =>
        b.totalSeasonalShows - a.totalSeasonalShows || a.name.localeCompare(b.name))
    const va1 = voiceActors.find(actor => actor.malId === va1Id)
    const va2 = voiceActors.find(actor => actor.malId === va2Id)

    useEffect(() => {
        let active = true
        setActorsLoading(true)
        setActorsError(null)

        fetchVoiceActors()
            .then(actors => {
                if (active) setVoiceActors(actors)
            })
            .catch(err => {
                if (active) setActorsError(err instanceof Error ? err.message : 'Failed to load voice actors')
            })
            .finally(() => {
                if (active) setActorsLoading(false)
            })

        return () => { active = false }
    }, [retryKey])

    useEffect(() => {
        let active = true

        if (!va1Id || !va2Id) {
            setComparison(null)
            setComparisonError(null)
            setComparisonLoading(false)
            setSelectionError(null)
            return () => { active = false }
        }

        if (va1Id === va2Id) {
            setComparison(null)
            setComparisonLoading(false)
            setComparisonError(null)
            setSelectionError('Choose two different voice actors to find shared credits.')
            return () => { active = false }
        }

        setSelectionError(null)
        setComparisonLoading(true)
        setComparisonError(null)

        fetchCompare(va1Id, va2Id)
            .then(result => {
                if (active) setComparison(result)
            })
            .catch(err => {
                if (active) setComparisonError(err instanceof Error ? err.message : 'Failed to load shared credits')
            })
            .finally(() => {
                if (active) setComparisonLoading(false)
            })

        return () => { active = false }
    }, [va1Id, va2Id, retryKey])

    function selectActor(slot: 1 | 2, actor: VoiceActorSummary) {
        const otherId = slot === 1 ? va2Id : va1Id
        if (actor.malId === otherId) {
            setSelectionError('Choose two different voice actors to find shared credits.')
            return
        }

        setSelectionError(null)
        setSearchParams(previous => {
            const next = new URLSearchParams(previous)
            next.set(slot === 1 ? 'va1' : 'va2', String(actor.malId))
            return next
        })
    }

    function clearActor(slot: 1 | 2) {
        setSelectionError(null)
        setSearchParams(previous => {
            const next = new URLSearchParams(previous)
            next.delete(slot === 1 ? 'va1' : 'va2')
            return next
        })
    }

    if (actorsLoading && voiceActors.length === 0) {
        return (
            <div className="compare-page compare-page--status">
                <StatusPanel tone="loading" eyebrow="Shared credits dossier" title="Loading the cast index…">
                    <p>Preparing actor selectors.</p>
                </StatusPanel>
            </div>
        )
    }

    if (actorsError) {
        return (
            <div className="compare-page compare-page--status">
                <StatusPanel
                    tone="error"
                    eyebrow="Comparison unavailable"
                    title="The actor index could not load"
                    action={<button className="text-button" type="button" onClick={() => setRetryKey(key => key + 1)}>Try again</button>}
                >
                    <p>{actorsError}</p>
                </StatusPanel>
            </div>
        )
    }

    return (
        <div className="compare-page">
            <div className="compare-intro">
                <p className="eyebrow">Shared credits dossier</p>
                <h1>Find the overlap</h1>
                <p>Select two voices to trace the anime and characters they share.</p>
            </div>

            <section className="compare-selectors" aria-labelledby="selector-heading">
                <div className="sr-only" id="selector-heading">Choose two voice actors</div>
                <VASelector
                    slot={1}
                    label="First voice actor"
                    selected={va1}
                    excludeId={va2Id}
                    voiceActors={sortedActors}
                    onSelect={actor => selectActor(1, actor)}
                    onClear={() => clearActor(1)}
                />
                <div className="compare-connector" aria-hidden="true">
                    <span>+</span>
                    <small>shared credits</small>
                </div>
                <VASelector
                    slot={2}
                    label="Second voice actor"
                    selected={va2}
                    excludeId={va1Id}
                    voiceActors={sortedActors}
                    onSelect={actor => selectActor(2, actor)}
                    onClear={() => clearActor(2)}
                />
            </section>

            {selectionError && (
                <p className="selection-error" role="alert">{selectionError}</p>
            )}

            {comparisonLoading && (
                <div className="comparison-inline-status" role="status" aria-live="polite">
                    <span className="inline-spinner" aria-hidden="true" />
                    <span>Finding shared credits…</span>
                </div>
            )}

            {comparisonError && !comparisonLoading && (
                <div className="comparison-inline-status comparison-inline-status--error" role="alert">
                    <span>{comparisonError}</span>
                    <button className="text-button" type="button" onClick={() => setRetryKey(key => key + 1)}>Retry comparison</button>
                </div>
            )}

            {comparison && !comparisonLoading && !comparisonError && (
                <CompareResults result={comparison} />
            )}

            {!va1Id || !va2Id ? (
                <div className="compare-empty-prompt">
                    <p className="eyebrow">Ready when you are</p>
                    <h2>Choose two actors to reveal shared anime.</h2>
                    <p>Your selections stay in the URL so this dossier can be revisited or shared.</p>
                </div>
            ) : null}
        </div>
    )
}

interface VASelectorProps {
    slot: 1 | 2
    label: string
    selected?: VoiceActorSummary
    excludeId: number | null
    voiceActors: VoiceActorSummary[]
    onSelect: (actor: VoiceActorSummary) => void
    onClear: () => void
}

function VASelector({ slot, label, selected, excludeId, voiceActors, onSelect, onClear }: VASelectorProps) {
    const inputId = `actor-selector-${slot}`
    const listboxId = `actor-options-${slot}`
    const [inputValue, setInputValue] = useState(selected?.name ?? '')
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const inputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const generatedId = useId()

    useEffect(() => {
        setInputValue(selected?.name ?? '')
    }, [selected?.malId, selected?.name])

    useEffect(() => {
        function handleOutside(event: PointerEvent) {
            if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
                setOpen(false)
                setInputValue(selected?.name ?? '')
            }
        }
        document.addEventListener('pointerdown', handleOutside)
        return () => document.removeEventListener('pointerdown', handleOutside)
    }, [selected?.name])

    const query = inputValue.toLocaleLowerCase().trim()
    const options = voiceActors
        .filter(actor => actor.malId !== excludeId)
        .filter(actor => !query || actor.name.toLocaleLowerCase().includes(query))
        .slice(0, 50)

    function openOptions() {
        setOpen(true)
        setActiveIndex(-1)
    }

    function handleChange(value: string) {
        if (selected && value !== selected.name) onClear()
        setInputValue(value)
        setOpen(true)
        setActiveIndex(-1)
    }

    function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
            setInputValue(selected?.name ?? '')
            return
        }

        if (!open && (event.key === 'ArrowDown' || event.key === 'Enter')) {
            event.preventDefault()
            openOptions()
            return
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            if (options.length === 0) return
            const direction = event.key === 'ArrowDown' ? 1 : -1
            setActiveIndex(index => (index + direction + options.length) % options.length)
            return
        }

        if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault()
            setActiveIndex(event.key === 'Home' ? 0 : Math.max(options.length - 1, 0))
            return
        }

        if (event.key === 'Enter' && open && activeIndex >= 0 && options[activeIndex]) {
            event.preventDefault()
            choose(options[activeIndex])
        }
    }

    function choose(actor: VoiceActorSummary) {
        onSelect(actor)
        setInputValue(actor.name)
        setOpen(false)
        setActiveIndex(-1)
        requestAnimationFrame(() => inputRef.current?.focus())
    }

    return (
        <div className="selector-box" ref={rootRef}>
            <label htmlFor={inputId}>{label}</label>
            <div className={`combobox-shell ${selected ? 'combobox-shell--selected' : ''}`}>
                <input
                    ref={inputRef}
                    id={inputId}
                    type="text"
                    role="combobox"
                    value={inputValue}
                    placeholder="Search voice actors…"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-controls={listboxId}
                    aria-expanded={open}
                    aria-activedescendant={open && activeIndex >= 0 ? `${generatedId}-option-${activeIndex}` : undefined}
                    onChange={event => handleChange(event.currentTarget.value)}
                    onFocus={openOptions}
                    onKeyDown={handleKeyDown}
                />
                {selected && (
                    <button className="clear-selector" type="button" onClick={onClear} aria-label={`Clear ${label}`}>
                        Clear
                    </button>
                )}
            </div>
            {open && (
                <ul className="dropdown-list" id={listboxId} role="listbox" aria-label={`${label} options`}>
                    {options.length > 0 ? options.map((actor, index) => (
                        <li
                            key={actor.malId}
                            id={`${generatedId}-option-${index}`}
                            className={activeIndex === index ? 'dropdown-item dropdown-item--active' : 'dropdown-item'}
                            role="option"
                            aria-selected={selected?.malId === actor.malId}
                            onMouseDown={event => event.preventDefault()}
                            onClick={() => choose(actor)}
                        >
                            <span className="option-initials" aria-hidden="true">{initials(actor.name)}</span>
                            <span className="dropdown-info">
                                <strong>{actor.name}</strong>
                                <small>{actor.totalSeasonalShows} seasonal shows · {actor.totalCareerRoles} career roles</small>
                            </span>
                        </li>
                    )) : (
                        <li className="dropdown-empty" role="option" aria-disabled="true">No matching actors</li>
                    )}
                </ul>
            )}
        </div>
    )
}

function CompareResults({ result }: { result: CompareResult }) {
    const { va1, va2, sharedAnime } = result

    return (
        <section className="compare-results" aria-labelledby="shared-credits-heading">
            <div className="compare-result-header">
                <ActorSummary actor={va1} />
                <div className="shared-marker">
                    <span className="shared-count">{sharedAnime.length} Shared Anime</span>
                    <span>shared credits</span>
                </div>
                <ActorSummary actor={va2} />
            </div>

            <div className="shared-heading-row">
                <div>
                    <p className="eyebrow">The overlap</p>
                    <h2 id="shared-credits-heading">Shared anime</h2>
                </div>
                <p>{sharedAnime.length} title{sharedAnime.length === 1 ? '' : 's'} in common</p>
            </div>

            {sharedAnime.length > 0 ? (
                <div className="shared-anime-grid">
                    {sharedAnime.map(anime => (
                        <article key={anime.malId} className="shared-anime-card">
                            <a href={`https://myanimelist.net/anime/${anime.malId}`} target="_blank" rel="noopener noreferrer" className="shared-anime-media" aria-label={`${anime.title} on MyAnimeList (external)`}>
                                <ImageFrame src={anime.imageUrl || '/placeholder-anime.png'} alt={anime.title} fallback={initials(anime.title)} width={96} height={136} />
                            </a>
                            <div className="shared-anime-info">
                                <a href={`https://myanimelist.net/anime/${anime.malId}`} target="_blank" rel="noopener noreferrer" className="shared-anime-title" aria-label={`${anime.title} on MyAnimeList (external)`}>
                                    {anime.title} <span aria-hidden="true">↗</span>
                                </a>
                                <div className="shared-characters">
                                    <CreditLine label={va1.name} characters={anime.characters1} />
                                    <CreditLine label={va2.name} characters={anime.characters2} />
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="no-shared" role="status">
                    <h3>No shared anime found yet.</h3>
                    <p>Keep both actors selected and try another pairing.</p>
                </div>
            )}
        </section>
    )
}

function ActorSummary({ actor }: { actor: VoiceActorSummary }) {
    return (
        <article className="compare-actor-summary">
            <ImageFrame src={actor.imageUrl || '/placeholder-va.png'} alt={actor.name} fallback={initials(actor.name)} width={120} height={160} />
            <div>
                <p className="eyebrow">Voice actor</p>
                <h3>{actor.name}</h3>
                <p>{actor.totalSeasonalShows} seasonal shows · {actor.totalCareerRoles} career roles</p>
            </div>
        </article>
    )
}

function CreditLine({ label, characters }: { label: string; characters: Array<{ malId: number; name: string }> }) {
    return (
        <div className="credit-line">
            <span>{label}</span>
            <p>
                {characters.length > 0 ? characters.map((character, index) => (
                    <span key={character.malId || index}>
                        {index > 0 && ', '}
                        <a href={`https://myanimelist.net/character/${character.malId}`} target="_blank" rel="noopener noreferrer" aria-label={`${character.name} on MyAnimeList (external)`}>{character.name}</a>
                    </span>
                )) : 'No listed character'}
            </p>
        </div>
    )
}

function ImageFrame({ src, alt, fallback, width, height }: { src: string; alt: string; fallback: string; width: number; height: number }) {
    const [failed, setFailed] = useState(false)
    return (
        <span className={`compare-image-frame ${failed ? 'compare-image-frame--missing' : ''}`}>
            <span aria-hidden="true">{fallback}</span>
            <img src={src} alt={alt} width={width} height={height} loading="lazy" decoding="async" onError={() => setFailed(true)} hidden={failed} />
        </span>
    )
}

function initials(value: string) {
    return value.split(/\s+/).map(part => part[0]).join('').slice(0, 2).toUpperCase()
}

function parseId(value: string | null) {
    if (!value || !/^\d+$/.test(value)) return null
    const id = Number(value)
    return Number.isSafeInteger(id) && id > 0 ? id : null
}

export default ComparePage
