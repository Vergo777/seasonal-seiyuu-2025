import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import VoiceActorCard from '../components/VoiceActorCard'

describe('VoiceActorCard', () => {
    const mockVoiceActor = {
        malId: 123,
        name: 'Sugita, Tomokazu',
        imageUrl: 'https://example.com/image.jpg',
        totalSeasonalShows: 18,
        totalCareerRoles: 500
    }

    it('renders voice actor name', () => {
        render(<VoiceActorCard voiceActor={mockVoiceActor} />)

        expect(screen.getByText('Sugita, Tomokazu')).toBeInTheDocument()
    })

    it('renders seasonal shows badge', () => {
        render(<VoiceActorCard voiceActor={mockVoiceActor} />)

        // The badge shows the number of seasonal shows
        expect(screen.getByText('18')).toBeInTheDocument()
    })

    it('renders career roles count', () => {
        render(<VoiceActorCard voiceActor={mockVoiceActor} />)

        expect(screen.getByText('500 career roles')).toBeInTheDocument()
    })

    it('renders voice actor image', () => {
        render(<VoiceActorCard voiceActor={mockVoiceActor} />)

        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
        expect(img).toHaveAttribute('alt', 'Sugita, Tomokazu')
    })

    it('applies lazy loading to image', () => {
        render(<VoiceActorCard voiceActor={mockVoiceActor} />)

        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('loading', 'lazy')
    })
})
