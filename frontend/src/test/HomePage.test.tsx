import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import { fetchVoiceActors, fetchSeasonInfo } from '../api/client'

// Mock the API client
vi.mock('../api/client', () => ({
    fetchVoiceActors: vi.fn(),
    fetchSeasonInfo: vi.fn()
}))

const mockSeasonInfo = {
    season: 'Summer',
    year: 2025,
    voiceActorCount: 20,
    lastSuccess: '2025-07-15T10:30:00Z',
    incompleteAnimeCount: 2
}

const mockVoiceActors = [
    { malId: 1, name: 'Sugita Tomokazu', imageUrl: '', totalSeasonalShows: 5, totalCareerRoles: 100 },
    { malId: 2, name: 'Hanazawa Kana', imageUrl: '', totalSeasonalShows: 3, totalCareerRoles: 200 }
]

const renderHome = (initialEntries = ['/']) => render(
    <MemoryRouter initialEntries={initialEntries}>
        <HomePage />
    </MemoryRouter>,
)

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        (fetchVoiceActors as any).mockImplementation(() => new Promise(() => { }));
        (fetchSeasonInfo as any).mockImplementation(() => new Promise(() => { }));
        renderHome()
        expect(screen.getByText('Loading the catalogue…')).toBeInTheDocument()
    })

    it('renders season info and voice actors list', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        renderHome()

        await waitFor(() => {
            expect(screen.getByText('SUMMER 2025')).toBeInTheDocument()
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
            expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument()
        })

        expect(screen.getByRole('heading', { name: 'SUMMER 2025' })).toBeInTheDocument()
        expect(screen.getByText('20')).toBeInTheDocument() // Count
        expect(screen.getByText(/Last successful refresh:/)).toBeInTheDocument()
        expect(screen.getByText(/Cast data refreshes automatically/)).toBeInTheDocument()
        expect(screen.getByText(/2 titles still have cast data filling in/)).toBeInTheDocument()
    })

    it('omits freshness timestamp when metadata is unavailable', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue({
            season: 'Summer', year: 2025, voiceActorCount: 20,
            lastSuccess: null, lastRefreshed: null
        })

        renderHome()

        await waitFor(() => expect(screen.getByText('SUMMER 2025')).toBeInTheDocument())
        expect(screen.queryByText(/Last successful refresh:/)).not.toBeInTheDocument()
        expect(screen.getByText(/Cast data refreshes automatically/)).toBeInTheDocument()
    })

    it('filters voice actors by search query', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        renderHome()

        await waitFor(() => {
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
        })

        const searchInput = screen.getByRole('searchbox', { name: 'Search the cast catalogue' })
        fireEvent.change(searchInput, { target: { value: 'Kana' } })

        expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument()
        expect(screen.queryByText('Sugita Tomokazu')).not.toBeInTheDocument()
        expect(screen.getByText('1 result for “Kana”')).toBeInTheDocument()
    })

    it('shows no results message when search matches nothing', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        renderHome()

        await waitFor(() => {
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
        })

        const searchInput = screen.getByRole('searchbox', { name: 'Search the cast catalogue' })
        fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

        expect(screen.getByText('No voice actors found for “NonExistent”')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    })

    it('shows empty state when no data available', async () => {
        (fetchVoiceActors as any).mockResolvedValue([]);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        renderHome()

        await waitFor(() => {
            expect(screen.getByText('No cast data is available')).toBeInTheDocument()
        })
    })

    it('handles API error', async () => {
        (fetchVoiceActors as any).mockRejectedValue(new Error('API Error'));
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        renderHome()

        await waitFor(() => {
            expect(screen.getByRole('heading', { name: 'The cast index could not load' })).toBeInTheDocument()
            expect(screen.getByText('API Error')).toBeInTheDocument()
        })
    })

    it('restores search from the URL and uses same-tab actor links', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors)
        ;(fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo)

        renderHome(['/?q=Kana'])

        await waitFor(() => expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument())
        expect(screen.queryByText('Sugita Tomokazu')).not.toBeInTheDocument()
        expect(screen.getByRole('searchbox', { name: 'Search the cast catalogue' })).toHaveValue('Kana')

        const actorLink = screen.getByRole('link', { name: /Hanazawa Kana, 3 seasonal shows/ })
        expect(actorLink).toHaveAttribute('href', '/va/2')
        expect(actorLink).not.toHaveAttribute('target')
    })

    it('clears a URL-backed search', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors)
        ;(fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo)

        renderHome(['/?q=Kana'])

        await waitFor(() => expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument())
        fireEvent.click(screen.getByRole('button', { name: 'Clear actor search' }))

        expect(screen.getByRole('searchbox', { name: 'Search the cast catalogue' })).toHaveValue('')
        expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
    })
})
