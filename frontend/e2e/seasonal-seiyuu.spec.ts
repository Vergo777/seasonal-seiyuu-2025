import { test, expect, type Route } from '@playwright/test'

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

    await page.getByRole('button', { name: 'All-Time Roles' }).click()

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
    await page.locator('.selector-box input').first().fill('Mika')
    await page.getByText('Mika Test', { exact: true }).click()

    await expect(page.getByText('1 Shared Anime')).toBeVisible()
    await expect(page.getByText('Shared Test Anime')).toBeVisible()
})
