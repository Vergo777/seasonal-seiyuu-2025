import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchVoiceActors, fetchVoiceActor, fetchSeasonInfo, fetchCompare } from '../api/client'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API Client', () => {
    beforeEach(() => {
        mockFetch.mockReset()
    })

    describe('fetchVoiceActors', () => {
        it('returns voice actors on successful response', async () => {
            const mockData = [
                { malId: 1, name: 'Test VA', imageUrl: 'http://test.jpg', totalSeasonalShows: 5 }
            ]
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await fetchVoiceActors()

            expect(mockFetch).toHaveBeenCalledWith('/seiyuu/api/voice-actors')
            expect(result).toEqual(mockData)
        })

        it('throws error on failed response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            })

            await expect(fetchVoiceActors()).rejects.toThrow('Failed to fetch voice actors: 500')
        })
    })

    describe('fetchVoiceActor', () => {
        it('returns voice actor on successful response', async () => {
            const mockData = {
                malId: 1,
                name: 'Test VA',
                imageUrl: 'http://test.jpg',
                totalSeasonalShows: 5,
                seasonalRoles: [],
                allTimeRoles: []
            }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await fetchVoiceActor(1)

            expect(mockFetch).toHaveBeenCalledWith('/seiyuu/api/voice-actors/1')
            expect(result).toEqual(mockData)
        })

        it('returns null on 404', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            })

            const result = await fetchVoiceActor(999)
            expect(result).toBeNull()
        })

        it('throws error on other failures', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            })

            await expect(fetchVoiceActor(1)).rejects.toThrow('Failed to fetch voice actor: 500')
        })
    })

    describe('fetchSeasonInfo', () => {
        it('returns season info on successful response', async () => {
            const mockData = { season: 'winter', year: 2025, voiceActorCount: 100 }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await fetchSeasonInfo()

            expect(mockFetch).toHaveBeenCalledWith('/seiyuu/api/season-info')
            expect(result).toEqual(mockData)
        })

        it('throws error on failed response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503
            })

            await expect(fetchSeasonInfo()).rejects.toThrow('Failed to fetch season info: 503')
        })
    })

    describe('fetchCompare', () => {
        it('returns comparison result on successful response', async () => {
            const mockData = {
                va1: { malId: 1, name: 'VA1', imageUrl: '', totalSeasonalShows: 3, totalCareerRoles: 100 },
                va2: { malId: 2, name: 'VA2', imageUrl: '', totalSeasonalShows: 5, totalCareerRoles: 200 },
                sharedAnime: []
            }
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockData)
            })

            const result = await fetchCompare(1, 2)

            expect(mockFetch).toHaveBeenCalledWith('/seiyuu/api/compare/1/2')
            expect(result).toEqual(mockData)
        })

        it('returns null on 404', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            })

            const result = await fetchCompare(1, 999)
            expect(result).toBeNull()
        })

        it('throws error on other failures', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            })

            await expect(fetchCompare(1, 2)).rejects.toThrow('Failed to fetch comparison: 500')
        })
    })
})
