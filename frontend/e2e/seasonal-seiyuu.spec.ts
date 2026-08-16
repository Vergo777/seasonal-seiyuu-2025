import { test, expect, type Route } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const voiceActors = [
    {
        malId: 1,
        name: 'Aoi Test',
        imageUrl: '',
        totalSeasonalShows: 2,
        totalCareerRoles: 4
    },
    {
        malId: 2,
        name: 'Mika Test',
        imageUrl: '',
        totalSeasonalShows: 1,
        totalCareerRoles: 3
    }
]

const denseVoiceActors = Array.from({ length: 550 }, (_, index) => ({
    malId: index + 1,
    name: `Actor ${String(index + 1).padStart(3, '0')}`,
    imageUrl: '',
    totalSeasonalShows: 550 - index,
    totalCareerRoles: 20 + index
}))

async function fulfillJson(route: Route, body: unknown) {
    await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body)
    })
}

test('home page loads seasonal actors and filters by name', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))
    await page.route('**/seiyuu/api/season-info', route => fulfillJson(route, {
        season: 'winter',
        year: 2026,
        lastRefreshed: null,
        lastSuccess: '2026-01-15T10:30:00Z',
        incompleteAnimeCount: 1,
        voiceActorCount: 2
    }))

    await page.goto('./')

    await expect(page.getByText('WINTER 2026')).toBeVisible()
    await expect(page.getByText(/Last successful refresh:/)).toBeVisible()
    await expect(page.getByText(/Cast data refreshes automatically/)).toBeVisible()
    await expect(page.getByText('Aoi Test')).toBeVisible()
    await expect(page.getByText('Mika Test')).toBeVisible()

    await page.getByPlaceholder(/Search voice actors/).fill('Mika')

    await expect(page.getByText('Mika Test')).toBeVisible()
    await expect(page.getByText('Aoi Test')).toBeHidden()
})

test('home page recovers from a request error', async ({ page }) => {
    let attempts = 0
    await page.route('**/seiyuu/api/voice-actors', route => {
        attempts += 1
        return attempts <= 2
            ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'temporary failure' }) })
            : fulfillJson(route, voiceActors)
    })
    await page.route('**/seiyuu/api/season-info', route => fulfillJson(route, {
        season: 'winter',
        year: 2026,
        lastSuccess: '2026-01-15T10:30:00Z',
        incompleteAnimeCount: 0,
        voiceActorCount: 2
    }))

    await page.goto('./')
    await expect(page.getByRole('heading', { name: 'The cast index could not load' })).toBeVisible()
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(page.getByText('Aoi Test')).toBeVisible()
})

test('detail page switches between seasonal and all-time roles', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors/1', route => fulfillJson(route, {
        ...voiceActors[0],
        seasonalRoles: [{
            anime: {
                malId: 101,
                title: 'Seasonal Test Anime',
                titleEnglish: null,
                imageUrl: '',
                synopsis: '',
                season: 'winter',
                year: 2026
            },
            character: { malId: 201, name: 'Seasonal Character', imageUrl: '', role: 'Main' }
        }],
        allTimeRoles: [{
            anime: {
                malId: 102,
                title: 'Career Test Anime',
                titleEnglish: null,
                imageUrl: '',
                synopsis: '',
                season: 'spring',
                year: 2025
            },
            character: { malId: 202, name: 'Career Character', imageUrl: '', role: 'Supporting' }
        }]
    }))

    await page.goto('./va/1')

    await expect(page.getByRole('heading', { name: /Aoi Test/ })).toBeVisible()
    await expect(page.getByText('Seasonal Test Anime')).toBeVisible()

    await page.getByRole('tab', { name: 'All-Time Roles' }).click()

    await expect(page.getByText('Career Test Anime')).toBeVisible()
    await expect(page.getByText('Seasonal Test Anime')).toBeHidden()
})

test('compare page finds shared anime for two actors', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))
    await page.route('**/seiyuu/api/compare/1/2', route => fulfillJson(route, {
        va1: voiceActors[0],
        va2: voiceActors[1],
        sharedAnime: [{
            malId: 301,
            title: 'Shared Test Anime',
            imageUrl: '',
            characters1: [{ malId: 401, name: 'Aoi Character' }],
            characters2: [{ malId: 402, name: 'Mika Character' }]
        }]
    }))

    await page.goto('./compare')

    const selectors = page.locator('.selector-box input')
    await selectors.nth(0).fill('Aoi')
    await page.getByText('Aoi Test', { exact: true }).click()
    await page.locator('.selector-box input').nth(1).fill('Mika')
    await page.getByText('Mika Test', { exact: true }).click()

    await expect(page.getByText('1 Shared Anime')).toBeVisible()
    await expect(page.getByText('Shared Test Anime')).toBeVisible()
})

test('compare selectors support keyboard navigation and selection', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))

    await page.goto('./compare')
    const first = page.getByRole('combobox', { name: 'First voice actor' })
    await first.focus()
    await first.press('ArrowDown')
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await expect(first).toHaveAttribute('aria-activedescendant', /option/)
    await first.press('Enter')
    await expect(first).toHaveValue('Aoi Test')
    await expect(first).toHaveAttribute('aria-expanded', 'false')
})

test('detail and compare expose useful empty states', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))
    await page.route('**/seiyuu/api/voice-actors/1', route => fulfillJson(route, {
        ...voiceActors[0],
        seasonalRoles: [],
        allTimeRoles: []
    }))
    await page.route('**/seiyuu/api/compare/1/2', route => fulfillJson(route, {
        va1: voiceActors[0],
        va2: voiceActors[1],
        sharedAnime: []
    }))

    await page.goto('./va/1')
    await expect(page.getByRole('heading', { name: 'No seasonal roles are listed yet.' })).toBeVisible()

    await page.goto('./compare?va1=1&va2=2')
    await expect(page.getByRole('heading', { name: 'No shared anime found yet.' })).toBeVisible()
})

test('representative Browse, Detail, and Compare states have no serious accessibility violations', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))
    await page.route('**/seiyuu/api/season-info', route => fulfillJson(route, {
        season: 'winter',
        year: 2026,
        lastSuccess: '2026-01-15T10:30:00Z',
        incompleteAnimeCount: 1,
        voiceActorCount: 2,
    }))
    await page.route('**/seiyuu/api/voice-actors/1', route => fulfillJson(route, {
        ...voiceActors[0],
        seasonalRoles: [],
        allTimeRoles: [],
    }))
    await page.route('**/seiyuu/api/compare/1/2', route => fulfillJson(route, {
        va1: voiceActors[0],
        va2: voiceActors[1],
        sharedAnime: [],
    }))

    for (const path of ['./', './va/1', './compare?va1=1&va2=2']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const results = await new AxeBuilder({ page }).analyze()
        const seriousViolations = results.violations.filter(violation =>
            violation.impact === 'serious' || violation.impact === 'critical',
        )
        expect(seriousViolations, `${path} accessibility violations`).toEqual([])
    }
})

test('Browse search is URL-backed and the layout reflows at 320px', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, voiceActors))
    await page.route('**/seiyuu/api/season-info', route => fulfillJson(route, {
        season: 'winter',
        year: 2026,
        lastSuccess: '2026-01-15T10:30:00Z',
        incompleteAnimeCount: 0,
        voiceActorCount: 2,
    }))

    await page.setViewportSize({ width: 320, height: 844 })
    await page.goto('./?q=Mika')
    await expect(page.getByRole('searchbox', { name: 'Search the cast catalogue' })).toHaveValue('Mika')
    await expect(page.getByText('Mika Test')).toBeVisible()
    await expect(page.getByText('Aoi Test')).toBeHidden()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320)
})

test('the dense catalogue keeps filtering responsive with 550 actors', async ({ page }) => {
    await page.route('**/seiyuu/api/voice-actors', route => fulfillJson(route, denseVoiceActors))
    await page.route('**/seiyuu/api/season-info', route => fulfillJson(route, {
        season: 'winter',
        year: 2026,
        lastSuccess: '2026-01-15T10:30:00Z',
        incompleteAnimeCount: 0,
        voiceActorCount: 550,
    }))

    await page.goto('./')
    await expect(page.getByText('550 actors in this issue')).toBeVisible({ timeout: 30_000 })
    const search = page.getByRole('searchbox', { name: 'Search the cast catalogue' })
    const start = Date.now()
    await search.fill('Actor 549')
    await expect(page.getByRole('heading', { name: 'Actor 549' })).toBeVisible()
    // The suite runs against Vite's development build with React StrictMode,
    // so leave a small margin around the two-second responsiveness target.
    expect(Date.now() - start).toBeLessThan(2500)
})
