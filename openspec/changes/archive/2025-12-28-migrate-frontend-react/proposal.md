# Change: Migrate Frontend to React with TypeScript

## Why

The current frontend is a single monolithic `main.js` file (~600 lines) using Vanilla JavaScript. This architecture:
- Makes unit testing impractical (no component isolation)
- Couples routing, state, and rendering tightly
- Increases maintenance burden as features grow

Migrating to React with TypeScript enables:
- Component-based architecture for testability
- React Testing Library for frontend coverage
- Type safety for refactoring confidence
- Better developer experience for future features

**Design quality** will follow `skills/frontend-design/SKILL.md` guidelines - distinctive typography, bold aesthetics, and intentional visual choices (not generic AI-generated UI).

## What Changes

- **Frontend build**: Vite + Vanilla JS → Vite + React 18 + TypeScript
- **Code structure**: Single `main.js` → Component-based architecture
- **Testing**: None → Vitest + React Testing Library
- **Styling**: Keep existing CSS (migrate to CSS modules later if needed)

**NOT changing**:
- Backend (Spring Boot remains unchanged)
- API contracts
- Deployment process (still builds to `backend/src/main/resources/static/`)

## Impact

- **Affected files**: All of `frontend/src/`
- **Affected capabilities**: None (no spec yet exists for frontend)
- **Breaking changes**: None (UI behavior preserved)
- **Effort estimate**: Medium (incremental migration possible)
