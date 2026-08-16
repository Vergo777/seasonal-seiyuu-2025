import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ComparePage from '../pages/ComparePage'
import { fetchCompare, fetchVoiceActors } from '../api/client'

vi.mock('../api/client', () => ({
    fetchCompare: vi.fn(),
    fetchVoiceActors: vi.fn(),
}))

const actors = [
    { malId: 1, name: 'Aoi Test', imageUrl: '', totalSeasonalShows: 4, totalCareerRoles: 12 },
    { malId: 2, name: 'Mika Test', imageUrl: '', totalSeasonalShows: 3, totalCareerRoles: 9 },
    { malId: 3, name: 'Ren Test', imageUrl: '', totalSeasonalShows: 2, totalCareerRoles: 7 },
]

const result = {
    va1: actors[0],
    va2: actors[1],
    sharedAnime: [{
        malId: 99,
        title: 'Shared Test Anime',
        imageUrl: '',
        characters1: [{ malId: 101, name: 'Aoi Character' }],
        characters2: [{ malId: 102, name: 'Mika Character' }],
    }],
}

describe('ComparePage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        ;(fetchVoiceActors as any).mockResolvedValue(actors)
        ;(fetchCompare as any).mockResolvedValue(result)
    })

    function renderCompare(initialEntry = '/compare') {
        render(
            <MemoryRouter initialEntries={[initialEntry]}>
                <ComparePage />
            </MemoryRouter>,
        )
    }

    it('exposes labelled editable comboboxes with keyboard selection', async () => {
        renderCompare()

        await waitFor(() => expect(screen.getByRole('combobox', { name: 'First voice actor' })).toBeInTheDocument())
        const first = screen.getByRole('combobox', { name: 'First voice actor' })
        fireEvent.focus(first)
        fireEvent.change(first, { target: { value: 'Aoi' } })
        expect(screen.getByRole('listbox', { name: 'First voice actor options' })).toBeInTheDocument()

        fireEvent.keyDown(first, { key: 'ArrowDown' })
        fireEvent.keyDown(first, { key: 'Enter' })
        expect(first).toHaveValue('Aoi Test')
        expect(first).toHaveAttribute('aria-expanded', 'false')
    })

    it('restores selected actors and shared results from URL parameters', async () => {
        renderCompare('/compare?va1=1&va2=2')

        await waitFor(() => expect(screen.getByText('Shared Test Anime')).toBeInTheDocument())
        expect(screen.getByRole('combobox', { name: 'First voice actor' })).toHaveValue('Aoi Test')
        expect(screen.getByRole('combobox', { name: 'Second voice actor' })).toHaveValue('Mika Test')
        expect(screen.getByText('Aoi Character')).toBeInTheDocument()
        expect(screen.getByText('Mika Character')).toBeInTheDocument()
    })

    it('prevents duplicate actor selection and supports clearing', async () => {
        renderCompare()
        await waitFor(() => expect(screen.getByRole('combobox', { name: 'First voice actor' })).toBeInTheDocument())

        const first = screen.getByRole('combobox', { name: 'First voice actor' })
        const second = screen.getByRole('combobox', { name: 'Second voice actor' })
        fireEvent.change(first, { target: { value: 'Aoi' } })
        fireEvent.click(screen.getByRole('option', { name: /Aoi Test/ }))
        fireEvent.change(second, { target: { value: 'Aoi' } })

        expect(screen.queryByRole('option', { name: /Aoi Test/ })).not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Clear First voice actor' })).toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Clear First voice actor' }))
        expect(first).toHaveValue('')
    })

    it('shows an inline comparison error with retry', async () => {
        ;(fetchCompare as any).mockRejectedValue(new Error('Comparison failed'))
        renderCompare('/compare?va1=1&va2=2')

        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Comparison failed'))
        expect(screen.getByRole('button', { name: 'Retry comparison' })).toBeInTheDocument()
    })
})
