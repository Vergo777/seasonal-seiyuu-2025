import type { VoiceActorSummary, VoiceActor, SeasonInfo, CompareResult } from './types'

const API_BASE = '/seiyuu/api'

export async function fetchVoiceActors(): Promise<VoiceActorSummary[]> {
    const response = await fetch(`${API_BASE}/voice-actors`)
    if (!response.ok) {
        throw new Error(`Failed to fetch voice actors: ${response.status}`)
    }
    return response.json()
}

export async function fetchVoiceActor(id: number): Promise<VoiceActor | null> {
    const response = await fetch(`${API_BASE}/voice-actors/${id}`)
    if (response.status === 404) {
        return null
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch voice actor: ${response.status}`)
    }
    return response.json()
}

export async function fetchSeasonInfo(): Promise<SeasonInfo> {
    const response = await fetch(`${API_BASE}/season-info`)
    if (!response.ok) {
        throw new Error(`Failed to fetch season info: ${response.status}`)
    }
    return response.json()
}

export async function fetchCompare(id1: number, id2: number): Promise<CompareResult | null> {
    const response = await fetch(`${API_BASE}/compare/${id1}/${id2}`)
    if (response.status === 404) {
        return null
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch comparison: ${response.status}`)
    }
    return response.json()
}
