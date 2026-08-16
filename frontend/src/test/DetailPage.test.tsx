import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DetailPage from '../pages/DetailPage'
import { fetchVoiceActor } from '../api/client'

vi.mock('../api/client', () => ({
    fetchVoiceActor: vi.fn(),
}))

const mockVoiceActor = {
    malId: 1,
    name: 'Test Voice Actor',
    imageUrl: 'test-url.jpg',
    totalSeasonalShows: 5,
    seasonalRoles: [
        {
            anime: { malId: 1, title: 'Seasonal Anime', imageUrl: 'anime.jpg' },
            character: { malId: 1, name: 'Char A', imageUrl: 'char.jpg' },
        },
    ],
    allTimeRoles: [
        {
            anime: { malId: 2, title: 'Old Anime', imageUrl: 'old.jpg' },
            character: { malId: 2, name: 'Char B', imageUrl: 'old_char.jpg' },
        },
    ],
}

describe('DetailPage', () => {
    beforeEach(() => vi.clearAllMocks())

    const renderDetailPage = (initialEntry = '/seiyuu/va/1') => {
        render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <Routes>
                    <Route path="/seiyuu/va/:id" element={<DetailPage />} />
                </Routes>
            </MemoryRouter>,
        )
    }

    it('renders a stable loading state', () => {
        ;(fetchVoiceActor as any).mockImplementation(() => new Promise(() => { }))
        renderDetailPage()
        expect(screen.getByText('Loading voice actor credits…')).toBeInTheDocument()
    })

    it('renders identity, counts, and seasonal credits', async () => {
        ;(fetchVoiceActor as any).mockResolvedValue(mockVoiceActor)
        renderDetailPage()

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Test Voice Actor' })).toBeInTheDocument())
        expect(screen.getByRole('link', { name: /MyAnimeList profile/ })).toHaveAttribute('target', '_blank')
        expect(screen.getByText('Season shows')).toBeInTheDocument()
        expect(screen.getByText('Career roles')).toBeInTheDocument()
        expect(screen.getByText('Seasonal Anime')).toBeInTheDocument()
        expect(screen.queryByText('Old Anime')).not.toBeInTheDocument()
    })

    it('restores and changes the role view through URL-backed tabs', async () => {
        ;(fetchVoiceActor as any).mockResolvedValue(mockVoiceActor)
        renderDetailPage('/seiyuu/va/1?roles=career')

        await waitFor(() => expect(screen.getByText('Old Anime')).toBeInTheDocument())
        expect(screen.getByRole('tab', { name: 'All-Time Roles' })).toHaveAttribute('aria-selected', 'true')

        const seasonalTab = screen.getByRole('tab', { name: 'This Season' })
        fireEvent.keyDown(screen.getByRole('tab', { name: 'All-Time Roles' }), { key: 'ArrowLeft' })
        await waitFor(() => expect(seasonalTab).toHaveFocus())
        fireEvent.click(seasonalTab)

        expect(screen.getByText('Seasonal Anime')).toBeInTheDocument()
        expect(screen.queryByText('Old Anime')).not.toBeInTheDocument()
    })

    it('handles error state with a route back to Browse', async () => {
        ;(fetchVoiceActor as any).mockRejectedValue(new Error('Network Error'))
        renderDetailPage()

        await waitFor(() => expect(screen.getByRole('heading', { name: 'Voice actor not found' })).toBeInTheDocument())
        expect(screen.getByText('Network Error')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Return to the cast catalogue' })).toHaveAttribute('href', '/')
    })
})
