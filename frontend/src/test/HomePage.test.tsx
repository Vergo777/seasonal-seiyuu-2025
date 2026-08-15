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
    { malId: 1, name: 'Sugita Tomokazu', totalSeasonalShows: 5, totalCareerRoles: 100 },
    { malId: 2, name: 'Hanazawa Kana', totalSeasonalShows: 3, totalCareerRoles: 200 }
]

describe('HomePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders loading state initially', () => {
        (fetchVoiceActors as any).mockImplementation(() => new Promise(() => { }));
        (fetchSeasonInfo as any).mockImplementation(() => new Promise(() => { }));
        render(<HomePage />)
        expect(screen.getByText('Loading voice actors...')).toBeInTheDocument()
    })

    it('renders season info and voice actors list', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('SUMMER 2025')).toBeInTheDocument()
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
            expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument()
        })

        // Check season badge specific parts
        expect(screen.getByText('☀️')).toBeInTheDocument() // Emoji for Summer
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

        render(<HomePage />)

        await waitFor(() => expect(screen.getByText('SUMMER 2025')).toBeInTheDocument())
        expect(screen.queryByText(/Last successful refresh:/)).not.toBeInTheDocument()
        expect(screen.getByText(/Cast data refreshes automatically/)).toBeInTheDocument()
    })

    it('filters voice actors by search query', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('🔍 Search voice actors...')
        fireEvent.change(searchInput, { target: { value: 'Kana' } })

        expect(screen.getByText('Hanazawa Kana')).toBeInTheDocument()
        expect(screen.queryByText('Sugita Tomokazu')).not.toBeInTheDocument()
    })

    it('shows no results message when search matches nothing', async () => {
        (fetchVoiceActors as any).mockResolvedValue(mockVoiceActors);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('Sugita Tomokazu')).toBeInTheDocument()
        })

        const searchInput = screen.getByPlaceholderText('🔍 Search voice actors...')
        fireEvent.change(searchInput, { target: { value: 'NonExistent' } })

        expect(screen.getByText('No voice actors found matching "NonExistent"')).toBeInTheDocument()
    })

    it('shows empty state when no data available', async () => {
        (fetchVoiceActors as any).mockResolvedValue([]);
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        render(
            <MemoryRouter>
                <HomePage />
            </MemoryRouter>
        )

        await waitFor(() => {
            expect(screen.getByText('No Data Available')).toBeInTheDocument()
        })
    })

    it('handles API error', async () => {
        (fetchVoiceActors as any).mockRejectedValue(new Error('API Error'));
        (fetchSeasonInfo as any).mockResolvedValue(mockSeasonInfo);

        render(<HomePage />)

        await waitFor(() => {
            expect(screen.getByText('Error')).toBeInTheDocument()
            expect(screen.getByText('API Error')).toBeInTheDocument()
        })
    })
})
