import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from '../components/Header'

// Wrap component with Router since it uses useLocation
const renderWithRouter = (component: React.ReactElement, initialEntries = ['/']) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            {component}
        </MemoryRouter>
    )
}

describe('Header', () => {
    it('renders logo text', () => {
        renderWithRouter(<Header />)

        expect(screen.getByText('Seasonal Seiyuu')).toBeInTheDocument()
    })

    it('renders navigation links', () => {
        renderWithRouter(<Header />)

        expect(screen.getByText('Browse')).toBeInTheDocument()
        expect(screen.getByText('Compare')).toBeInTheDocument()
        expect(screen.getByText('About')).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#main-content')
    })

    it('renders GitHub link', () => {
        renderWithRouter(<Header />)

        const githubLink = screen.getByRole('link', { name: 'Open the project on GitHub (external)' })
        expect(githubLink).toBeInTheDocument()
        expect(githubLink).toHaveAttribute('href', 'https://github.com/Vergo777/seasonal-seiyuu-2025')
        expect(githubLink).toHaveAttribute('target', '_blank')
        expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('highlights active nav link based on current route', () => {
        renderWithRouter(<Header />, ['/compare'])

        const compareLink = screen.getByText('Compare')
        expect(compareLink).toHaveClass('active')
        expect(compareLink).toHaveAttribute('aria-current', 'page')
    })
})
