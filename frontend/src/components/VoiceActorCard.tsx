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
                <div className="va-card-badge">{voiceActor.totalSeasonalShows}</div>
            </div>
            <div className="va-card-content">
                <h3 className="va-card-name">{voiceActor.name}</h3>
                <p className="va-card-roles">{voiceActor.totalCareerRoles} career roles</p>
            </div>
        </div>
    )
}

export default VoiceActorCard
