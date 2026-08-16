## 1. Implementation Preparation

- [x] 1.1 Read `AGENTS.md`, the repository `frontend-design` skill, this change's proposal/spec/design, and the active `automate-season-refresh` frontend delta before editing application code
- [x] 1.2 Re-fetch Vercel's current Web Interface Guidelines and identify only the client-side Vite/React rules from Vercel React Best Practices that apply to this implementation
- [x] 1.3 Run the existing Vitest, frontend build, and Playwright suites to establish a clean baseline and record any pre-existing failures
- [x] 1.4 Capture current Browse, Detail, Compare, and About screenshots at representative desktop and mobile viewports for before/after review

## 2. Design-System Foundation and Application Shell

- [x] 2.1 Consolidate primitive and semantic color, typography, spacing, radius, border, shadow, motion, layering, and seasonal-accent tokens in the global stylesheet
- [x] 2.2 Replace runtime Google Fonts imports with reviewed self-hosted licensed font assets/packages, limited weights/subsets, `font-display: swap`, and robust fallbacks
- [x] 2.3 Rebuild the header, navigation, skip link, main-content target, and footer as a compact responsive editorial shell with semantic landmarks and active-route state
- [x] 2.4 Add route-aware document titles, one primary heading per route, accurate page metadata/theme color, and safe, clearly identified external links
- [x] 2.5 Add global focus-visible, touch-target, reduced-motion, zoom/reflow, long-text, image-fallback, and loading/status foundations
- [x] 2.6 Remove duplicated global/page CSS rules, raw theme values, `transition: all`, functional emoji, and obsolete Midnight Sakura styling as each replacement becomes active

## 3. Browse Experience

- [x] 3.1 Implement the compact Season Issue composition with season/year, actor count, last successful refresh, automatic-refresh explanation, and incomplete-cast messaging
- [x] 3.2 Implement a visibly labelled catalogue search with clear control, live result count, empty-result recovery, and normalized `q` URL synchronization
- [x] 3.3 Restore catalogue search from the URL and ensure Back/Forward returns to the expected filtered state without noisy per-keystroke history entries
- [x] 3.4 Recompose actor cards and the responsive catalogue grid around portraits, actor names, seasonal-show priority, career-role context, and scannable catalogue numbering
- [x] 3.5 Replace forced new-tab actor navigation with React Router links that preserve `/seiyuu`, native browser gestures, and browser Back behavior
- [x] 3.6 Reserve media dimensions, lazy-load below-fold portraits, apply off-screen rendering containment, and verify search remains responsive with the full cached actor dataset
- [x] 3.7 Redesign Browse loading, request-error, no-data, no-results, sparse, and dense states with stable layout, accessible announcements, and useful next actions
- [x] 3.8 Add or update Browse component tests for refresh context, URL search, clearing, result counts, actor navigation, and resilient states

## 4. Human Visual Checkpoint

- [x] 4.1 Capture refreshed Browse and application-shell screenshots at approximately 1440×900, 390×844, and 320 px wide using mocked or cached data
- [x] 4.2 Pause for maintainer approval of the editorial direction, typography, density, seasonal accent, and mobile hierarchy before propagating the system to the remaining pages
- [x] 4.3 Apply approved token or composition adjustments without expanding the agreed feature scope

## 5. Actor Detail Experience

- [x] 5.1 Recompose actor detail as a responsive talent sheet with a clear identity block, portrait, counts, MyAnimeList destination, and credits hierarchy
- [x] 5.2 Implement Seasonal and Career role views as semantic, keyboard-operable, URL-backed state with predictable Back/Forward behavior
- [x] 5.3 Rework role cards to make the anime-to-character relationship explicit, preserve readable long titles, and reserve/lazy-load media appropriately
- [x] 5.4 Redesign detail loading, missing-actor, request-error, empty-role, sparse-role, and dense-role states with a working route back to Browse
- [x] 5.5 Add or update Detail component tests for identity, external link behavior, URL-restored role views, keyboard operation, error recovery, and empty roles

## 6. Comparison Experience

- [x] 6.1 Recompose Compare as a neutral shared-credits dossier with two clearly labelled actor slots and non-competitive language
- [x] 6.2 Implement the actor selector as an editable WAI-ARIA combobox/listbox with visible labels, filtering, highlighted/selected state, arrow navigation, Enter selection, Escape dismissal, and predictable clearing/focus behavior
- [x] 6.3 Prevent or clearly disable duplicate actor selection while leaving both existing selections easy to revise
- [x] 6.4 Preserve and normalize `va1` and `va2` URL parameters and restore valid comparisons on direct load and browser navigation
- [x] 6.5 Recompose shared-anime results so actor-to-character mappings remain clear without relying on color, including readable long names and safe external links
- [x] 6.6 Implement inline loading, API-error retry/change-selection, no-shared-anime, sparse-result, and successful-result states instead of console-only failure handling
- [x] 6.7 Add or update Compare component tests for combobox semantics and keyboard behavior, duplicate prevention, URL restoration, failures, empty results, and shared credits

## 7. About and Content Polish

- [x] 7.1 Rewrite About as a concise product colophon covering user purpose, progressive seasonal completeness, Jikan/MyAnimeList provenance, current React 19 stack, repository access, and a subordinate AI-collaboration note if retained
- [x] 7.2 Normalize user-facing terminology, capitalization, numerals, loading ellipses, error guidance, and external-link cues across every route
- [x] 7.3 Verify decorative symbols are removed or hidden from assistive technology and functional icons have equivalent accessible text

## 8. Accessibility, Responsive, and Performance Verification

- [x] 8.1 Add `@axe-core/playwright` or document an equivalent automated accessibility integration and run representative Browse, Detail, and Compare states against WCAG 2.2 A/AA rules
- [x] 8.2 Resolve all detected serious or critical accessibility findings and manually verify heading/landmark structure, accessible names, contrast, non-color cues, and status announcements
- [x] 8.3 Manually verify Tab/Shift+Tab, Enter, Space, arrow keys, Escape, focus visibility, skip navigation, no keyboard traps, and focus not obscured by sticky elements
- [x] 8.4 Verify reduced motion, 200 percent zoom, 320 px reflow, mobile touch targets, desktop/ultra-wide composition, long names, failed images, and no unintended horizontal page scrolling
- [x] 8.5 Measure interaction and scrolling with the representative 550-actor cache and add deferred rendering or an accessible windowing/progressive strategy only if the containment approach is insufficient
- [x] 8.6 Review the completed source against the current Vercel Web Interface Guidelines and the applicable Vercel React Best Practices, recording any intentional exceptions

## 9. Automated Tests and Build Integration

- [x] 9.1 Expand Playwright mocked flows for Browse search/navigation, Detail role state, Compare keyboard selection/results, and all required error/empty recovery paths
- [x] 9.2 Run Playwright at representative desktop and mobile viewport projects and capture final Browse, Detail, Compare-empty, and Compare-populated review screenshots
- [x] 9.3 Run `npm test -- --run`, `npm run build`, and `npm run test:e2e` from `frontend` and resolve every regression
- [x] 9.4 Run the backend Gradle test/build suite to verify the rebuilt static frontend integrates with the Spring Boot application
- [x] 9.5 Review and include only intentional generated assets under `backend/src/main/resources/static`, removing stale hashed assets through the normal build process

## 10. Documentation and Handoff

- [x] 10.1 Update relevant README/frontend documentation for the refreshed experience, font/icon sources and licenses, accessibility approach, and local verification commands
- [x] 10.2 Confirm no route, API contract, cache behavior, refresh setting, credential handling, deployment configuration, or admin surface changed
- [x] 10.3 Run `git diff --check` and `openspec validate refresh-frontend-experience --strict --no-interactive`
- [x] 10.4 Review the final diff and screenshots with the maintainer, documenting any deferred non-blocking polish before commit or deployment
