## Why

Seasonal Seiyuu exposes useful cast relationships, but its presentation feels like a generic themed dashboard and makes a catalogue of hundreds of actors harder to scan than it should be. A product-wide UI/UX refresh should give the app a distinctive editorial identity, improve navigation and accessibility, and make seasonal freshness and incomplete-data context easy to understand on every screen size.

## What Changes

- Replace the current “Midnight Sakura” treatment with a cohesive editorial “seasonal cast index” direction inspired by broadcast credits and printed programme guides.
- Rework the global shell, typography, color tokens, spacing, icons, responsive behavior, focus treatment, loading states, error states, and empty states as one design system.
- Make the home catalogue faster to scan, search, and navigate while retaining season, actor-count, refresh-freshness, and incomplete-cast context.
- Make actor details and comparison flows clearer, keyboard-operable, deep-linkable where state matters, and usable on narrow screens without oversized or crowded controls.
- Remove emoji as functional decoration, replace fragile custom interactions with semantic controls, and target WCAG 2.2 AA for the implemented flows.
- Update stale About-page copy and metadata so the product description and React version match the application.
- Expand component and browser tests to cover navigation, search, tabs, comparison, responsive layouts, reduced motion, keyboard operation, and core accessibility semantics.
- Keep the existing routes, `/seiyuu` context path, API contracts, data cache, and automatic refresh behavior unchanged.

### Non-goals

- No backend, Jikan ingestion, refresh-scheduler, authentication, or deployment changes.
- No user accounts, saved lists, localization project, alternate historical seasons, or new anime/actor data fields.
- No wholesale UI framework migration, Tailwind adoption, or dependency on a proprietary design service.
- No production deployment or archival of the separate `automate-season-refresh` change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `frontend`: Revise the existing browse, detail, comparison, search, navigation, state, responsive, accessibility, and test requirements for the refreshed experience.

## Impact

- **Affected code:** React page and component structure, CSS/design tokens, document metadata, frontend tests, Playwright smoke tests, and generated static frontend assets.
- **API and data cache:** No contract or persistence changes. Existing voice-actor, detail, comparison, and season-info responses remain the source of truth.
- **Dependencies:** Prefer existing React/CSS capabilities. Any font, icon, accessibility-test, or list-performance dependency must be small, justified, pinned through `package-lock.json`, and reviewed before adoption.
- **Security and privacy:** No new secrets or privileged surfaces. Avoid adding runtime third-party scripts; self-host fonts/assets when practical and preserve safe external-link attributes.
- **Rollout:** Ship as one frontend build after automated and representative desktop/mobile browser verification. The existing frontend build can be restored from the preceding commit if visual or interaction regressions appear.
- **Coordination:** Implementation is intentionally deferred to a fresh Luna session. That session must treat the already implemented refresh-freshness UI as required behavior even while `automate-season-refresh` remains active and unarchived.
