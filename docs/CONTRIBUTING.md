# Contributing to Guided Annual Planner

Thank you for your interest in contributing to the **Guided Annual Planner**! This project is maintained as an open-source, paper-inspired digital sanctuary built on the MERN stack with strict TypeScript type safety.

---

## 1. Development Principles

1. **Preserve the Warm Paper Aesthetic**: The UI uses physical journal metaphors (spiral bindings, ruled lines, dot-grids, and serif typography). Avoid sterile corporate dashboard styles.
2. **Offline-First & Zero Data Loss**: Every feature that alters planner data must support optimistic UI updates and enqueue mutations in IndexedDB.
3. **Accessibility First (WCAG 2.2)**: Always verify keyboard navigation, visible focus rings, ARIA roles for dialogs, and reduced-motion preferences (`prefers-reduced-motion`).
4. **Shared Contract Rigor**: Never duplicate types across client and server. Add or update models and schemas in `@planner/shared`.
5. **Comprehensive Automated Tests**: Every new feature or bug fix must include automated Vitest tests covering both happy and edge paths.

---

## 2. Local Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local running instance (`mongodb://127.0.0.1:27017/guided_planner`) or MongoDB Atlas URI

### Initial Setup
```bash
# 1. Clone your fork
git clone https://github.com/<your-username>/guided-annual-planner.git
cd guided-annual-planner

# 2. Install workspace dependencies
npm install

# 3. Compile shared schemas
npm run build:shared

# 4. Configure local environment files
cp .env.example server/.env
cp .env.example client/.env
```

### Launching Development Servers
In two separate terminal windows:
```bash
# Terminal 1: Backend API (http://localhost:5000)
npm run dev:server

# Terminal 2: Frontend Client (http://localhost:5173)
npm run dev:client
```

---

## 3. Git Branching & Workflow

1. Check out the `main` branch and pull the latest changes:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Create a dedicated topic branch:
   ```bash
   # Features
   git checkout -b feat/bookshelf-custom-categories

   # Fixes
   git checkout -b fix/leap-year-february-offset

   # Documentation
   git checkout -b docs/add-deployment-runbook
   ```

---

## 4. Commit Standards (Conventional Commits)

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short imperative description>
```

### Common Types:
- `feat`: A new feature (e.g. `feat(i18n): add Amharic calendar month translations`)
- `fix`: A bug fix (e.g. `fix(a11y): honor prefers-reduced-motion in global cursor animations`)
- `docs`: Documentation only changes (e.g. `docs: add REST API reference specification`)
- `style`: Formatting, visual polish, or badge updates with zero logic change
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Tooling, build scripts, or dependency updates

---

## 5. Automated Testing & Verification

Before submitting a Pull Request, run the complete test suite and production build:

```bash
# 1. Run all 202 automated tests across all workspaces
npm test

# 2. Run tests by workspace
npm run test --workspace=shared # Shared schemas & calendar math
npm run test:server            # Express API, controllers, and sessions
npm run test:client            # React components, sync manager, and IndexedDB

# 3. Verify production compilation and typecheck
npm run build
```

**All tests must pass with 0 errors and 0 warnings.**

---

## 6. Pull Request Checklist

Before submitting your PR, verify:
- [ ] Topic branch created from an up-to-date `main`.
- [ ] No extraneous files or local configuration commits (e.g. `.env`, temporary logs).
- [ ] Code strictly adheres to TypeScript and Tailwind conventions.
- [ ] Shared contracts and Zod schemas updated in `@planner/shared` if API payloads changed.
- [ ] New unit or integration tests added for new behavior.
- [ ] All 202+ tests pass with `npm test`.
- [ ] Production build succeeds with `npm run build`.
- [ ] PR description clearly explains the problem, proposed solution, and testing steps.
