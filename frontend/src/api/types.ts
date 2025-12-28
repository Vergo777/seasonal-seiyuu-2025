// API response types matching the backend

export interface VoiceActorSummary {
    malId: number
    name: string
    imageUrl: string
    totalSeasonalShows: number
    totalCareerRoles: number
}

export interface Character {
    malId: number
    name: string
    imageUrl: string
    role: string
}

export interface Anime {
    malId: number
    title: string
    titleEnglish: string | null
    imageUrl: string
    synopsis: string
    season: string
    year: number
}

export interface Role {
    anime: Anime
    character: Character
}

export interface VoiceActor {
    malId: number
    name: string
    imageUrl: string
    seasonalRoles: Role[]
    allTimeRoles: Role[]
    totalSeasonalShows: number
}

export interface SeasonInfo {
    season: string | null
    year: number | null
    lastRefreshed: string | null
    voiceActorCount: number
}

export interface CompareResult {
    va1: VoiceActorSummary
    va2: VoiceActorSummary
    sharedAnime: SharedAnime[]
}

export interface SharedAnime {
    malId: number
    title: string
    imageUrl: string
    characters1: CharacterRef[]
    characters2: CharacterRef[]
}

export interface CharacterRef {
    malId: number
    name: string
}
