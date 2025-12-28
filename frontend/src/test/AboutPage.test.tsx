import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import AboutPage from '../pages/AboutPage'

describe('AboutPage', () => {
    it('renders the page title', () => {
        render(<AboutPage />)

        expect(screen.getByText('About Seasonal Seiyuu')).toBeInTheDocument()
    })

    it('renders the what is this section', () => {
        render(<AboutPage />)

        expect(screen.getByText('🎙️ What is this?')).toBeInTheDocument()
    })

    it('renders the built with AI section', () => {
        render(<AboutPage />)

        expect(screen.getByText('🤖 Built with AI')).toBeInTheDocument()
        expect(screen.getByText(/Antigravity/)).toBeInTheDocument()
    })

    it('renders the tech stack section', () => {
        render(<AboutPage />)

        expect(screen.getByText('🛠️ Tech Stack')).toBeInTheDocument()
        expect(screen.getByText(/Java 25, Spring Boot 3.5/)).toBeInTheDocument()
        expect(screen.getByText(/React 18, TypeScript, Vite/)).toBeInTheDocument()
    })

    it('renders the features section', () => {
        render(<AboutPage />)

        expect(screen.getByText('✨ Features')).toBeInTheDocument()
    })

    it('renders GitHub link', () => {
        render(<AboutPage />)

        const githubLink = screen.getByText('View on GitHub →')
        expect(githubLink).toBeInTheDocument()
        expect(githubLink).toHaveAttribute('href', 'https://github.com/Vergo777/seasonal-seiyuu-2025')
        expect(githubLink).toHaveAttribute('target', '_blank')
    })
})
