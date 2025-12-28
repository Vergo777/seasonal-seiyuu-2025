import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from '../components/Footer'

describe('Footer', () => {
    it('renders Jikan API credit', () => {
        render(<Footer />)

        expect(screen.getByText(/Jikan API/)).toBeInTheDocument()
    })

    it('renders link to Jikan website', () => {
        render(<Footer />)

        const jikanLink = screen.getByRole('link', { name: /Jikan API/ })
        expect(jikanLink).toHaveAttribute('href', 'https://jikan.moe/')
        expect(jikanLink).toHaveAttribute('target', '_blank')
    })
})
