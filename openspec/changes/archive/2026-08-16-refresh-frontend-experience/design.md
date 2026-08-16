## Context

See `proposal.md` for motivation and `specs/frontend/spec.md` for observable behavior.

The frontend is a small React 19 application with four routes and custom CSS, but its visual and interaction layers have grown inconsistently:

- Global and page CSS duplicate selectors, raw colors, font imports, card treatments, and loading styles. Several files use `transition: all`, and focus suppression is not consistently replaced with `:focus-visible` treatment.
- The current dark navy, pink/cyan gradient, glow, pill, emoji, and generic card-grid vocabulary resembles common generated dashboard output more than the subject matter.
- At mobile width the masthead and season panel consume most of the first viewport, actor cards become disproportionately large, and the primary content is delayed.
- The home search has no visible label or URL state. Actor cards force new tabs. The role tabs are visual buttons without tab semantics or shareable state.
- The comparison selectors use clickable `div` elements, do not implement combobox keyboard behavior, and log request errors only to the console.
- More than 500 actor cards can be rendered at once. Images reserve space through CSS aspect ratios but lack intrinsic dimensions, and web fonts are imported at runtime from multiple CSS files.
- About copy says React 18 despite React 19 and makes the AI implementation process more prominent than the product and data provenance.

The implemented but unarchived `automate-season-refresh` change already adds freshness and incomplete-cast messaging. This refresh must preserve and visually integrate that behavior; it must not alter refresh operations.

## Guidance Review

The implementation should use the smallest complementary guidance set:

1. **Repository `frontend-design` skill — art direction.** Use it to maintain a specific aesthetic, deliberate typography, cohesive tokens, and context-specific composition instead of another generic component theme.
2. **Vercel `web-design-guidelines` — review gate.** The official source covers semantics, labels, focus, reduced motion, image dimensions, URL state, long-list performance, touch targets, responsive layout, and resilient states. Re-fetch its current `command.md` before final review because it is maintained as a living checklist.
3. **Vercel `vercel-react-best-practices` — implementation review.** Apply only the rules relevant to a client-rendered Vite application: parallel requests, cheap controlled input, deferred rendering where measured, direct imports, stable component definitions, and efficient long-list rendering. Skip Next.js and server-component rules.
4. **W3C WCAG 2.2 and ARIA APG — normative interaction source.** Use WCAG 2.2 AA as the conformance target and the editable combobox/listbox pattern for comparison selectors. Community summaries do not override these sources.

Discovery on 2026-08-15 also reviewed `nextlevelbuilder/ui-ux-pro-max-skill` and community WCAG/design-audit skills. `ui-ux-pro-max` has strong adoption and useful searchable catalogues, but its large style matrix risks a template-led result, and recent repository issues describe CLI/package version drift. It may be consulted for isolated token or typography ideas, but it is not a project dependency or design authority. Generic audit skills add little beyond the official Vercel and W3C gates for this focused application.

No external skill is installed by this change. If the maintainer elects to install the two official Vercel skills before implementation, install only `web-design-guidelines` and `vercel-react-best-practices` at project scope and begin the Luna implementation in a fresh session so they are discovered reliably.

## Goals / Non-Goals

**Goals:**

- Establish a memorable editorial identity grounded in seasonal broadcast credits and programme indexes.
- Move actors, anime, characters, and relationships ahead of ornamental chrome.
- Make browse, detail, and compare flows responsive, keyboard-operable, URL-aware, and testable.
- Consolidate presentation around reusable semantic tokens and a small set of shared interface patterns.
- Preserve the current frontend stack, routes, APIs, cache behavior, and static build pipeline.

**Non-Goals:**

- Reproduce MyAnimeList, imitate a specific anime property, or add stereotypical Japanese ornament.
- Add a general-purpose component library, CSS framework, client state manager, animation framework, or visual asset generator.
- Introduce alternate themes or a user-facing theme switcher in this iteration.
- Solve server-side rendering, historical seasons, refresh administration, or production deployment.

## Decisions

### 1. Art direction: “The Seasonal Casting Ledger”

Treat each season as an issue of an editorial cast directory: strong typographic hierarchy, numbered catalogue entries, precise rules, restrained paper/ink texture, and photography as the richest visual element. The memorable motif is an issue marker that combines season/year, freshness, completeness, and catalogue count without becoming a hero card.

Avoid neon gradients, glass panels, glowing borders, emoji icons, excessive rounded pills, generic dashboard stat cards, and anime-themed decoration unrelated to the data. Japanese influence should come through restraint, rhythm, vertical issue marks, and publishing craft—not sakura, faux kanji, or ornamental clichés.

Alternative considered: refine the existing dark “Midnight Sakura” theme. Rejected because it preserves the visual language the refresh is intended to replace and does not improve catalogue density.

### 2. Design system and tokens

Define primitive and semantic CSS custom properties once in the global stylesheet; page styles consume semantic tokens rather than raw hex values.

Suggested starting system, subject to contrast verification:

- Canvas: warm paper (`#f3efe4`) with ink (`#191814`) and muted ink (`#625f57`).
- Surfaces: paper white and a light rule/border derived from ink.
- Core brand accent: restrained vermilion (`#c8422f`) for action and issue marks.
- Structural accent: deep indigo (`#26364f`) for navigation and comparison structure.
- Seasonal accent tokens: winter cobalt, spring ume, summer marigold, autumn persimmon. Season changes a small accent layer, never text contrast or the full theme.
- Radius scale: mostly 0–6 px; circular treatment only for portraits or inherently round controls.
- Shadow scale: subtle paper lift only; borders and spacing carry most hierarchy.
- Motion: 120–220 ms transform/opacity transitions with a global reduced-motion override.

Typography should pair a distinctive editorial serif such as Newsreader for display moments with a narrow grotesk such as Barlow Condensed for navigation, counts, and metadata, plus a highly legible system sans fallback for body text. Fonts must be self-hosted through reviewed packages or checked-in licensed assets with `font-display: swap`; do not retain runtime Google Fonts `@import` calls. If the proposed faces have licensing, language-coverage, or package problems, choose metrically similar licensed alternatives while preserving the serif/editorial + condensed/index contrast.

Alternative considered: a Tailwind/shadcn token system. Rejected because the application is small, already uses custom CSS, and a framework migration would add scope without solving art direction.

### 3. Page composition

**Application shell**

- Use a compact sticky header with a text-first wordmark, Browse/Compare/About navigation, and a quiet external GitHub link.
- Include a skip link and a stable `main` target. Use `aria-current="page"` on active navigation.
- Keep the mobile header to one compact row or a deliberate two-row layout; it must not dominate the first viewport.
- Use a restrained colophon footer with Jikan/MyAnimeList provenance and repository access.

**Browse**

- Replace the large glowing season badge with an editorial issue strip: season/year as the primary heading, actor count, freshness, and incomplete-data note in a compact hierarchy.
- Give search a persistent visible label, clear control, result count, and URL-backed `q` state. Search all actors even if rendering is progressively optimized.
- Use a dense portrait catalogue with consistent image ratios, catalogue/rank numbers, actor name, seasonal show count as the primary metric, and career roles as secondary context.
- Use 2 columns on typical phones when legibility permits, then scale through tablet and desktop grids. A 320 px viewport may use one or two columns based on measured text fit, not a hard-coded oversized card.

**Actor detail**

- Compose the page like a talent sheet: compact identity block, portrait, counts, and external profile link, followed by credits.
- Implement Seasonal/Career as a semantic tab set (or a clearly labelled segmented navigation pattern) with `roles=seasonal|career` in the URL.
- Treat each role as a relationship between anime and character, not two unrelated thumbnails. Keep titles readable and preserve link affordance.

**Compare**

- Present selection as a two-column casting dossier rather than a “VS battle.” Remove swords, glow, and competitive language.
- Implement each actor picker as a labelled editable combobox with a listbox popup following WAI-ARIA APG keyboard behavior. Exclude the actor already selected in the other slot or leave it disabled with an explanation.
- Preserve `va1` and `va2` query parameters. Shared credits should clearly map each actor to their characters, using names and column structure in addition to accent colors.
- Expose loading, request failure, no-shared-credit, sparse, and successful states inline.

**About**

- Reframe as a concise product colophon: purpose, how current-season data and progressive completeness work, data provenance, technology, and repository link.
- Correct React 19 and avoid presenting “built with AI” as the primary product story. If retained, place it as a brief transparent project note.

### 4. Shared React structure without overbuilding

Extract shared components only where semantics or presentation repeat, likely including `AppShell`/header navigation, `SeasonIssue`, labelled `SearchField`, `StatusPanel`, `ExternalLink`, `RoleTabs`, and `ActorCombobox`. Keep page-specific compositions in their pages.

Do not build a generic component library or introduce boolean-prop-heavy mega-components. Prefer explicit variants and composition. Keep data access in the existing typed API client and keep independent home requests parallel.

Use React Router `Link` for internal navigation rather than hard-coded anchors. Respect Vite’s `/seiyuu/` base and avoid absolute paths that bypass it. Use `useSearchParams` for user-meaningful state and update search state with `replace` while typing to avoid polluting browser history.

Alternative considered: retain all components and restyle CSS only. Rejected because the comparison interaction, route state, navigation behavior, and semantic issues require small structural changes.

### 5. Performance and media strategy

- Keep image containers at known aspect ratios and add intrinsic `width`/`height`; lazy-load below-fold actor and role imagery and prioritize only truly above-fold content.
- Add `content-visibility: auto` and a suitable intrinsic-size estimate to off-screen catalogue cards as the first long-list optimization.
- Use `useDeferredValue` only if profiling shows the 500+ actor filter/render blocks input. Do not add memoization or virtualization speculatively.
- If representative testing still shows poor interaction latency, adopt a small, accessible windowing solution or progressive batches while ensuring search covers the complete dataset and browser find/keyboard expectations are documented.
- Remove duplicate remote font imports and preconnect only to asset domains actually used at runtime.
- Keep decorative texture CSS-only, very subtle, and nonessential; do not add large generated hero imagery.

This deliberately adapts Vercel’s recommendation to virtualize lists over 50 items: CSS containment is less complex and preserves native document behavior for this moderate, image-heavy grid. Escalate to virtualization only with measured evidence.

### 6. Accessibility is an implementation constraint

- Use semantic HTML before ARIA, visible labels for all inputs, one `h1` per route, logical headings, and status regions for async result counts and failures.
- The comparison combobox must implement `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-activedescendant`, option selection state, Escape dismissal, arrow movement, Enter selection, and predictable focus return.
- Tabs must expose selected state and keyboard behavior, or be implemented as ordinary links if URL navigation provides the simpler robust model.
- All controls need visible `:focus-visible` treatment, at least 24×24 CSS px targets with a 44 px preferred mobile target, and no focus obscured by sticky UI.
- Verify normal text at 4.5:1, large text and meaningful graphics at 3:1, zoom/reflow at 200%, and no meaning communicated solely by color.
- Provide a `prefers-reduced-motion: reduce` mode, avoid `transition: all`, and animate only transform/opacity.
- Functional symbols use labelled SVG or text. Decorative graphics are hidden from assistive technology.

### 7. Testing and visual acceptance

- Update React Testing Library tests around user-observable behavior, including URL search restoration, clear search, role-view URL state, combobox keyboard behavior, duplicate actor prevention, failure recovery, and freshness/incomplete messaging.
- Add `@axe-core/playwright` as the only planned new test dependency unless an equivalent is already present. Run axe on representative loaded home, detail, and comparison states; fail serious and critical WCAG A/AA findings.
- Expand Playwright to desktop (approximately 1440×900), mobile (approximately 390×844), and 320 px reflow. Use mocked API routes so verification does not depend on Jikan availability.
- Capture full-page review screenshots for Browse, Detail, Compare empty, and Compare populated at desktop and mobile. These are review artifacts, not necessarily committed golden snapshots.
- Manually verify Tab/Shift+Tab, Enter, Space, arrows, Escape, browser Back/Forward, 200% zoom, reduced motion, long names, image failure, and 550-actor density.
- Run `npm test -- --run`, `npm run build`, `npm run test:e2e`, `git diff --check`, and strict OpenSpec validation before handoff.

## Risks / Trade-offs

- **[Subjective direction may not match maintainer taste]** → Implement tokens and the shell first, capture desktop/mobile screenshots, and obtain a human visual checkpoint before completing every page.
- **[Light editorial palette may reduce image cohesion or contrast]** → Use neutral image framing, verify tokens with automated and manual contrast checks, and keep an ink-heavy hierarchy rather than low-contrast beige-on-beige styling.
- **[Custom combobox is easy to implement incorrectly]** → Follow WAI-ARIA APG, cover keyboard/state semantics in tests, and prefer a small audited headless primitive only if it materially reduces risk without importing a visual system.
- **[URL synchronization can create noisy history or loops]** → Normalize parameters, use replacement navigation for live search, push history only for deliberate view changes, and test Back/Forward behavior.
- **[Font packages increase bundle size]** → Load only required families/weights/subsets, use `font-display: swap`, and retain robust fallbacks.
- **[Rendering 500+ cards remains expensive]** → Start with lazy media and CSS containment, measure, then introduce progressive rendering/windowing only if necessary.
- **[The pending refresh change overlaps home-page copy]** → Preserve its behavior and tests, avoid editing backend DTOs, and validate both active OpenSpec changes independently.
- **[Generated static assets create a large noisy diff]** → Build them only after source review and include the intended output in the implementation commit.

## Migration Plan

1. Implement tokens, font loading, metadata, shell, and shared state/status primitives.
2. Refresh Browse and obtain the human screenshot checkpoint before propagating the visual language.
3. Refresh Detail, Compare, and About; preserve all routes and mocked API fixtures.
4. Add accessibility and responsive coverage, run the complete frontend/browser validation suite, and rebuild backend static assets.
5. Review the diff and deploy through the existing process in a later authorized session.

Rollback is a frontend commit revert plus rebuild of the prior static assets. No data or API migration is required.
