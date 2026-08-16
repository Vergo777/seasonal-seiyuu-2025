import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from '../pages/AboutPage'

describe('AboutPage', () => {
    it('explains the product purpose and progressive completeness', () => {
        render(<AboutPage />)

        expect(screen.getByRole('heading', { name: 'About the cast index' })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Read the season through its cast.' })).toBeInTheDocument()
        expect(screen.getByText(/refreshed automatically/)).toBeInTheDocument()
    })

    it('documents provenance and the current React stack', () => {
        render(<AboutPage />)

        expect(screen.getByRole('link', { name: 'Jikan API (external)' })).toHaveAttribute('target', '_blank')
        expect(screen.getByText(/React 19 · TypeScript · Vite/)).toBeInTheDocument()
        expect(screen.getByText(/MyAnimeList API/)).toBeInTheDocument()
    })

    it('keeps the collaboration note subordinate to product information', () => {
        render(<AboutPage />)

        expect(screen.getByText(/human–AI collaboration/)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /View the repository/ })).toHaveAttribute('target', '_blank')
    })
})
