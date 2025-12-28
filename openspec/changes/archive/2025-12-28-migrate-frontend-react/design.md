## Context

The frontend needs to support automated testing while maintaining existing functionality. React was chosen over alternatives for its mature testing ecosystem (React Testing Library) and component model.

**Design Reference**: This migration follows the guidelines in `skills/frontend-design/SKILL.md` - avoiding generic AI aesthetics, using distinctive typography, bold color choices, and thoughtful motion design.

## Goals / Non-Goals

**Goals:**
- Enable frontend unit/integration testing
- Maintain all existing user-facing behavior
- Keep deployment process unchanged (static files in Spring Boot JAR)
- Incremental migration (page-by-page)

**Non-Goals:**
- Server-side rendering (SSR)
- State management library (Redux/Zustand) - use React state/context
- CSS-in-JS - keep existing CSS approach
- Redesign UI - visual parity with current app

## Decisions

### Decision: React 18 + TypeScript + Vite
**Rationale**: Vite already in use; React has best testing ecosystem; TypeScript adds refactoring safety.

**Alternatives considered**:
- Vue 3: Good option but less widespread, smaller testing ecosystem.
- Svelte: Smaller ecosystem, different paradigm.
- Keep Vanilla JS + add Vitest: Testing DOM manipulation is fragile and verbose.

### Decision: React Router v6 for routing
**Rationale**: Standard solution, replaces custom hash-based routing in `main.js`.

### Decision: Vitest + React Testing Library
**Rationale**: Vitest integrates seamlessly with Vite. RTL encourages testing user behavior over implementation details.

### Decision: Test-After for UI, Test-First for Logic
**Rationale**: Pure TDD is awkward for visual components where you need to *see* the result. Instead:
- **Logic/API layer**: Write tests first (TDD)
- **Components**: Build visually first, verify with tests after
- **Visual correctness**: Manual inspection (Storybook optional)

## Component Architecture

```
frontend/src/
├── main.tsx                  # Entry point
├── App.tsx                   # Router setup
├── api/
│   └── client.ts             # API fetch functions
├── components/
│   ├── VoiceActorCard.tsx    # Grid card
│   ├── RoleCard.tsx          # Role display
│   ├── SearchBar.tsx         # Autocomplete search
│   └── Header.tsx            # Navigation header
├── pages/
│   ├── HomePage.tsx          # Voice actor grid
│   ├── DetailPage.tsx        # VA detail view
│   ├── ComparePage.tsx       # Comparison view
│   └── AboutPage.tsx         # About page
└── __tests__/
    ├── components/           # Component tests
    └── pages/                # Integration tests
```

## Migration Strategy

1. **Scaffold**: Initialize React/TS in `frontend/`, keep old files temporarily
2. **Shared components first**: Header, VoiceActorCard, RoleCard
3. **Page by page**: HomePage → DetailPage → ComparePage → AboutPage
4. **Delete old code**: Remove `main.js` and legacy files after migration

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Visual regression | Manual side-by-side testing before removing old code |
| Build output size increase | Monitor bundle size; React is ~40KB gzipped |
| Learning curve | React is widely known; documentation available |

## Open Questions

- Should we adopt CSS modules now or defer?
- Target test coverage percentage?
