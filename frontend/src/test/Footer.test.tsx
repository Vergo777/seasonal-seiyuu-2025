import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../components/Footer'

describe('Footer', () => {
    it('renders Tenrai API credit', () => {
        render(<Footer />)

        expect(screen.getByText(/Tenrai v1 API/)).toBeInTheDocument()
    })

    it('renders link to Tenrai API', () => {
        render(<Footer />)

        const tenraiLink = screen.getByRole('link', { name: /Tenrai v1 API/ })
        expect(tenraiLink).toHaveAttribute('href', 'https://tenrai.org/')
        expect(tenraiLink).toHaveAttribute('target', '_blank')
    })
})
