import type { VoiceActorSummary } from '../api/types'
import './VoiceActorCard.css'

interface Props {
    voiceActor: VoiceActorSummary
    catalogueNumber?: number
    priority?: boolean
}

function VoiceActorCard({ voiceActor, catalogueNumber, priority = false }: Props) {
    const initials = voiceActor.name
        .split(/\s+/)
        .map(part => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()

    return (
        <article className="va-card">
            <div className="va-card-image-container">
                <span className="catalogue-number" aria-hidden="true">
                    {String(catalogueNumber ?? '').padStart(2, '0')}
                </span>
                <span className="image-fallback" aria-hidden="true">{initials}</span>
                <img
                    src={voiceActor.imageUrl || '/placeholder-va.png'}
                    alt={voiceActor.name}
                    className="va-card-image"
                    width="240"
                    height="320"
                    loading={priority ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={event => {
                        event.currentTarget.hidden = true
                        event.currentTarget.parentElement?.classList.add('image-missing')
                    }}
                />
            </div>
            <div className="va-card-content">
                <h3 className="va-card-name">{voiceActor.name}</h3>

                <div className="va-card-stats">
                    <div className="va-stat-main">
                        <span className="stat-value">{voiceActor.totalSeasonalShows}</span>
                        <span className="stat-label">SEASON SHOWS</span>
                    </div>
                    <div className="va-stat-secondary">
                        <span className="stat-value-sm">{voiceActor.totalCareerRoles}</span>
                        <span className="stat-label-sm">CAREER ROLES</span>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default VoiceActorCard
