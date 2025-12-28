import type { VoiceActorSummary } from '../api/types'
import './VoiceActorCard.css'

interface Props {
    voiceActor: VoiceActorSummary
}

function VoiceActorCard({ voiceActor }: Props) {
    return (
        <div className="va-card">
            <div className="va-card-image-container">
                <img
                    src={voiceActor.imageUrl || '/placeholder-va.png'}
                    alt={voiceActor.name}
                    className="va-card-image"
                    loading="lazy"
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
                        <span className="stat-label-sm">Roles</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VoiceActorCard
