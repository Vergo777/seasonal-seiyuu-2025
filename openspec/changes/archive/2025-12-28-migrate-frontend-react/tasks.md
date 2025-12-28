## 1. Setup & Scaffolding

- [x] 1.1 Initialize React + TypeScript with Vite (`npm create vite@latest . -- --template react-ts`)
- [x] 1.2 Configure Vitest and React Testing Library
- [x] 1.3 Update `vite.config.ts` to output to `../backend/src/main/resources/static/`
- [x] 1.4 Set up base router with React Router v6

## 2. Shared Components

- [x] 2.1 Create `Header` component with navigation
- [x] 2.2 Create `VoiceActorCard` component + tests
- [x] 2.3 Create `RoleCard` component (inline in DetailPage)
- [x] 2.4 Create `SearchBar` autocomplete component (inline in ComparePage)

## 3. API Layer

- [x] 3.1 Create `api/client.ts` with typed fetch functions
- [x] 3.2 Create TypeScript types for API responses (`VoiceActor`, `Role`, etc.)

## 4. Pages

- [x] 4.1 Create `HomePage` (voice actor grid) + tests
- [x] 4.2 Create `DetailPage` (VA detail view) + tests
- [x] 4.3 Create `ComparePage` (comparison tool) + tests
- [x] 4.4 Create `AboutPage` + tests

## 5. Styling & Polish

- [x] 5.1 Migrate existing CSS to work with React components
- [x] 5.2 Verify responsive layouts on mobile

## 6. Cleanup & Validation

- [x] 6.1 Delete legacy `main.js` and old HTML
- [x] 6.2 Run full test suite (27 tests pass)
- [x] 6.3 Build and verify production bundle
- [x] 6.4 Update README with new frontend commands
