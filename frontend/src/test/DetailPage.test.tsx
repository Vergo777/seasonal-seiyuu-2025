import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import DetailPage from '../pages/DetailPage'
import { fetchVoiceActor } from '../api/client'

// Mock the API client
vi.mock('../api/client', () => ({
    fetchVoiceActor: vi.fn()
}))

const mockVoiceActor = {
    malId: 1,
    name: 'Test Voice Actor',
    imageUrl: 'test-url.jpg',
    totalSeasonalShows: 5,
    totalCareerRoles: 100,
    seasonalRoles: [
        {
            anime: { malId: 1, title: 'Seasonal Anime', imageUrl: 'anime.jpg' },
            character: { malId: 1, name: 'Char A', imageUrl: 'char.jpg' }
        }
    ],
    allTimeRoles: [
        {
            anime: { malId: 2, title: 'Old Anime', imageUrl: 'old.jpg' },
            character: { malId: 2, name: 'Char B', imageUrl: 'old_char.jpg' }
        }
    ]
}

describe('DetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderDetailPage = () => {
        render(
            <MemoryRouter initialEntries={['/seiyuu/va/1']}>
                <Routes>
                    <Route path="/seiyuu/va/:id" element={<DetailPage />} />
                </Routes>
            </MemoryRouter>
        )
    }

    it('renders loading state initially', () => {
        (fetchVoiceActor as any).mockImplementation(() => new Promise(() => { }))
        renderDetailPage()
        expect(screen.getByText('Loading voice actor...')).toBeInTheDocument()
    })

    it('renders voice actor profile in sidebar', async () => {
        (fetchVoiceActor as any).mockResolvedValue(mockVoiceActor)
        renderDetailPage()

        await waitFor(() => {
            expect(screen.getByText('Test Voice Actor ↗')).toBeInTheDocument()
        })

        // Check for stats in sidebar
        expect(screen.getByText('SEASON SHOWS')).toBeInTheDocument()
        expect(screen.getByText('5')).toBeInTheDocument()
        expect(screen.getByText('CAREER ROLES')).toBeInTheDocument()
        expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('renders seasonal roles by default', async () => {
        (fetchVoiceActor as any).mockResolvedValue(mockVoiceActor)
        renderDetailPage()

        await waitFor(() => {
            expect(screen.getByText('Seasonal Anime')).toBeInTheDocument()
        })
        expect(screen.queryByText('Old Anime')).not.toBeInTheDocument()
    })

    it('switches to All-Time Roles tab', async () => {
        (fetchVoiceActor as any).mockResolvedValue(mockVoiceActor)
        renderDetailPage()

        await waitFor(() => {
            expect(screen.getByText('Test Voice Actor ↗')).toBeInTheDocument()
        })

        const allTimeTab = screen.getByText('All-Time Roles')
        fireEvent.click(allTimeTab)

        expect(screen.getByText('Old Anime')).toBeInTheDocument()
        expect(screen.queryByText('Seasonal Anime')).not.toBeInTheDocument()
    })

    it('handles error state', async () => {
        (fetchVoiceActor as any).mockRejectedValue(new Error('Network Error'))
        renderDetailPage()

        await waitFor(() => {
            expect(screen.getByText('Voice Actor Not Found')).toBeInTheDocument()
            expect(screen.getByText('Network Error')).toBeInTheDocument()
        })
    })
})
