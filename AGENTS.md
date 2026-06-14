# AGENTS.md

This document provides guidance for AI agents and developers using agentic workflows on the Matter Controller project.

## Project Overview

**Matter Controller** is an Electron + React desktop application for controlling Matter protocol home automation devices. It provides a user-friendly interface for managing accessories, scenes, rooms, and settings with multi-language support (English & Spanish).

**Tech Stack:**
- Frontend: React 19.2.6, TypeScript 5.9.3
- State Management: Zustand 5.0.14
- Internationalization: i18next 26.3.0, react-i18next 17.0.8
- Build: Electron Vite 3.1.0, electron-builder 26.8.1
- Desktop Runtime: Electron 42.3.0
- Auto-Updater: electron-updater 6.6.2 (GitHub releases)
- CI/CD: GitHub Actions (build, bump-version, publish)

## Architectural Overview

### Directory Structure

```
.github/
├── workflows/
│   ├── build.yml                  # CI: type check & build
│   ├── bump-version.yml           # Manual: bump version & create PR
│   └── publish.yml                # Auto: release on PR merge
src/
├── main/                          # Electron main process
│   ├── index.ts                   # App entry point (auto-updater)
│   └── ipc-handlers.ts            # IPC handlers (incl. updates)
├── preload/                       # Preload scripts for IPC
│   ├── index.ts                   # Bridge (incl. app, updates)
│   └── types.ts                   # API type definitions
├── renderer/                      # React application
│   ├── src/
│   │   ├── App.tsx                # Root component
│   │   ├── main.tsx               # React entry point (i18n initialized here)
│   │   ├── services/
│   │   │   ├── ipc.ts             # IPC bridge to main process
│   │   │   └── i18n.ts            # i18n configuration
│   │   ├── state/
│   │   │   ├── device-store.ts    # Zustand store for devices/accessories
│   │   │   ├── preferences-store.ts # Zustand store for UI preferences (includes language)
│   │   │   ├── room-store.ts      # Zustand store for rooms
│   │   │   ├── scene-store.ts     # Zustand store for scenes
│   │   │   └── ui-store.ts        # Zustand store for UI state
│   │   ├── locales/
│   │   │   ├── en.json            # English translations
│   │   │   └── es.json            # Spanish translations
│   │   ├── utils/
│   │   │   └── language-detector.ts # Language detection logic
│   │   ├── ui/
│   │   │   ├── components/        # Reusable React components
│   │   │   ├── controls/          # Device control components
│   │   │   ├── views/             # Page-level views (Home, Settings, Rooms, etc.)
│   │   │   └── styles/            # CSS files
│   │   └── types/                 # TypeScript type definitions
└── electron.vite.config.ts        # Build configuration
```

### State Management

The project uses **Zustand with persistence middleware** for state management. Key stores:

- **device-store**: Accessories and bridges (loaded from main process)
- **room-store**: Room organization and grouping
- **scene-store**: Scene definitions and automation
- **preferences-store**: UI preferences (theme, background, **language**, card sizes, order)
- **ui-store**: Transient UI state (current view, edit mode)

All stores except `ui-store` persist to localStorage.

### Internationalization (i18n)

**Status:** Recently implemented (2026-06-02)

**Architecture:**
- **i18next + react-i18next** for translation framework
- **Translation files:** `src/renderer/src/locales/{en,es}.json`
- **Language detection:** Tries Electron API → browser navigator.language → defaults to English
- **Preference storage:** Saved in `preferences-store` with `language: 'en' | 'es' | 'system'`
- **Initialization:** On app startup in `main.tsx` before React render
- **Usage:** Components use `const { t } = useTranslation()` hook to access translations

**Translation Structure:**
```json
{
  "header": { ... },           // Header component strings
  "modal": { ... },            // Modal dialog strings
  "sidebar": { ... },          // Navigation sidebar strings
  "settings": { ... },         // Settings view strings
  "colors": { ... },           // Color preset names
  "common": { ... }            // Common UI strings
}
```

**Key Points for Agents:**
- Add new UI strings: Add translation keys to both `en.json` and `es.json` (same structure)
- For dynamic text: Use interpolation with `{{variable}}` syntax in JSON, `t('key', { variable })` in code
- Language selector in Settings allows users to override system language
- All components use `useTranslation()` hook - no hardcoded strings in UI

## Development Workflow

### Common Tasks

#### Adding a New Feature

1. **Plan with brainstorming skill** - Understand requirements and design
2. **Create implementation plan** with writing-plans skill
3. **Execute plan** using subagent-driven-development or executing-plans
4. **For UI strings:** Add translation keys to `en.json` and `es.json` with matching structure
5. **Test in both languages** via Settings language selector
6. **Code review** with requesting-code-review skill before merge

#### Fixing a Bug

1. **Systematic debugging** - Use systematic-debugging skill to understand the issue
2. **Isolate the problem** - Identify which component/store/service is affected
3. **Write failing test** first if applicable
4. **Fix and verify** - Test fix before committing
5. **No worktrees needed** for small bug fixes

#### Adding a Translation

1. **Add key to `en.json`** with English value
2. **Add same key to `es.json`** with Spanish translation
3. **Verify key structure matches** (same nested objects)
4. **Use in component:** `t('section.key')` via useTranslation hook
5. **Test both languages**

### Testing

```bash
npm test              # Run vitest suite
npm run build         # Build production bundles
npm run dev           # Start dev server
npm run lint          # Check code style
npm run lint:fix      # Auto-fix lint issues
```

**Test Files:** Located next to implementation files with `.test.ts` extension

**What to Test:**
- Store mutations and selectors
- Component rendering with different props
- i18n initialization and language changes
- IPC message handling

## Key Components & Files

### CI/CD & Release Workflow

Three GitHub Actions workflows live in `.github/workflows/`:

- **`build.yml`** — CI: runs `npm run build` on PR/push to `main`
- **`bump-version.yml`** — Manual dispatch: uses `MiguelRipoll23/get-next-version@v3.0.0` to calculate next semver, runs `npm version --no-git-tag-version`, creates a draft PR with the `new-release` label
- **`publish.yml`** — Triggered when a PR with `new-release` label is merged to `main`:
  1. Creates a git tag from the branch name (strips `version/` prefix)
  2. Creates a GitHub Release with auto-generated release notes
  3. Builds the app on Windows, macOS, and Linux via `npm run electron:build`
  4. Uploads artifacts (`.exe`, `.dmg`, `.AppImage`, `latest*.yml`) to the release
  5. Updates `CHANGELOG.md` from the release notes

**Release flow:** Run `Bump version` workflow → merge the draft PR → `Publish release` auto-runs.

### Auto-Updater

The app uses `electron-updater` with GitHub releases as the update provider. Configured in `package.json` under `build.publish`:

```json
"publish": {
  "provider": "github",
  "owner": "MiguelRipoll23",
  "repo": "home-app"
}
```

**Main process** (`src/main/index.ts:55-80`):
- `autoDownload: true`, `autoInstallOnAppQuit: true`
- Background check on startup (`autoUpdater.checkForUpdates()`)
- Events forwarded to renderer: `update-available`, `update-download-progress`, `update-downloaded`

**IPC handlers** (`src/main/ipc-handlers.ts:157-190`):
- `check-for-updates` — Manual check, returns `{ version, url }` or `null`
- `restart-and-install` — Calls `autoUpdater.quitAndInstall()`
- `open-external` — Opens a URL in system browser

**Preload API** (exposed as `window.homeController`):
- `checkForUpdates()`, `restartAndInstall()`, `openExternal(url)`
- `onUpdateAvailable(callback)`, `onDownloadProgress(callback)`, `onUpdateDownloaded(callback)`

### IPC Bridge (`src/renderer/src/services/ipc.ts`)

Provides type-safe communication with the main process. Used for:
- Device pairing and management
- Storage import/export
- System locale detection (for language auto-detection)
- App updates (check, download progress, restart)

```typescript
api().devices.listBridges()      // Get all bridges
api().devices.removeBridge(id)   // Remove a bridge
api().storage.export()            // Export user data
api().storage.import(data)        // Import user data
api().app.getLocale()             // Get system language (for i18n)
api().checkForUpdates()           // Check for app updates
api().restartAndInstall()         // Restart and install update
```

### Preferences Store (`src/renderer/src/state/preferences-store.ts`)

Persists user preferences to localStorage. Latest addition: `language` field.

```typescript
const { language, setLanguage } = usePreferencesStore()
// language: 'en' | 'es' | 'system'
// setLanguage(lang) updates both store and triggers i18n re-render
```

### i18n Service (`src/renderer/src/services/i18n.ts`)

Manages translation framework initialization and language switching.

```typescript
import { initializeI18n, changeLanguage } from '../services/i18n'

// On startup (in main.tsx):
await initializeI18n(preferredLanguage)

// On language change (in SettingsView):
await changeLanguage('es')
```

### Language Detector (`src/renderer/src/utils/language-detector.ts`)

Auto-detects system language with fallback chain:
1. Electron `app.getLocale()` via IPC
2. Browser `navigator.language`
3. Default to English

```typescript
const systemLang = await detectSystemLanguage()  // Returns 'en' or 'es'
const effectiveLang = await getEffectiveLanguage('system')  // Resolves 'system' → actual lang
```

## Guidelines for Agents

### Before Starting Work

1. **Understand the current state:**
   - Read recent git log to see what was done
   - Check package.json for dependencies
   - Review relevant component/store files

2. **Confirm you have context:**
   - Ask for clarification if requirements are ambiguous
   - Request code examples if implementing similar features
   - Use brainstorming skill for design questions

### During Implementation

1. **Follow existing patterns:**
   - Zustand stores use same pattern (getter/setter actions)
   - Components use functional components with hooks
   - All components are TypeScript with strict type checking

2. **For i18n:**
   - ALWAYS add translation keys to both `en.json` AND `es.json`
   - Use `t('section.key')` pattern, never hardcode strings
   - Test in both languages (use Settings language selector)
   - Use interpolation for dynamic content: `t('key', { var })`

3. **For components:**
   - Use existing CSS patterns from `ui/styles/global.css`
   - Follow component structure (props interface, functional component)
   - Use lucide-react icons (already in dependencies)
   - Import types from `src/types/` not inline

4. **For stores:**
   - Add persist middleware if state needs to survive reload
   - Keep store focused on single responsibility
   - Use TypeScript interfaces for state shape

5. **Testing:**
   - Write tests alongside implementation
   - Use vitest (already configured)
   - Test both happy path and error cases
   - Run `npm test` before committing

### After Implementation

1. **Verification:**
   - Build passes: `npm run build`
   - Tests pass: `npm test`
   - Lint passes: `npm run lint`
   - Dev server starts: `npm run dev`

2. **Git hygiene:**
   - Commit messages follow pattern: `feat:`, `fix:`, `docs:`, `test:`
   - Each commit is logical and testable
   - No unrelated changes in same commit

3. **Code review:**
   - Use requesting-code-review skill before merge
   - Address any feedback thoroughly
   - Re-verify after making changes

## Translation Keys Reference

**Current supported keys** (use these in components):

### Header Section (`header.*`)
- `title`, `addAccessory`, `addScene`, `addRoom`, `edit`, `stopEditing`, `reorderSections`, `reorderAccessories`

### Modal Section (`modal.*`)
- `addRoom`, `roomNamePlaceholder`, `addScene`, `sceneNamePlaceholder`, `cancel`, `create`

### Sidebar Section (`sidebar.*`)
- `home`, `favorites`, `categories`, `climate`, `rooms`, `scenes`, `settings`, `lights`, `plugs`, `thermostats`, `cameras`, `speakersAndTvs`, `locks`, `blinds`, `security`, `other`

### Settings Section (`settings.*`)
- All UI labels, theme options, language options, error messages
- Full list in `src/renderer/src/locales/en.json`

### Colors Section (`colors.*`)
- `none`, `white`, `red`, `orange`, `yellow`, `green`, `teal`, `blue`, `purple`, `pink`, `gray`, `dark`

### Common Section (`common.*`)
- `add`, `save`, `delete`, `edit`, `close`, `loading`, `error`, `success`

## Common Pitfalls & Solutions

### Translation Key Missing
**Problem:** Component uses `t('missing.key')` → appears blank
**Solution:** Add key to both `en.json` and `es.json` with matching structure

### Component Not Re-rendering After Language Change
**Problem:** Changed language in Settings but component still shows old language
**Solution:** Make sure component calls `useTranslation()` hook at top level

### i18n Not Initialized
**Problem:** App starts but no translations appear
**Solution:** Check that `main.tsx` calls `await initializeI18n()` before React render

### Language Preference Not Persisting
**Problem:** Language resets to system default after reload
**Solution:** Verify `setLanguage()` is called in SettingsView when user changes language

### Type Errors with i18n
**Problem:** TypeScript errors on `t()` calls
**Solution:** Make sure `useTranslation()` is imported from `react-i18next`, not another package

## Useful Commands for Agents

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build production bundles
npm run preview          # Preview production build

# Quality
npm test                 # Run test suite
npm run lint             # Check code style
npm run lint:fix         # Auto-fix lint issues

# Packaging
npm run electron:build   # Build & package for distribution

# Git workflow
git log --oneline -10    # See recent commits
git diff <branch>        # See what changed
git status               # Check working directory state
```

## When to Use Which Skill

| Task | Skill |
|------|-------|
| New feature or refactor | brainstorming → writing-plans → subagent-driven-development |
| Bug fix | systematic-debugging → fix → test-driven-development |
| Code review | requesting-code-review |
| Completing branch | finishing-a-development-branch |
| Multi-step coordinated tasks | dispatching-parallel-agents or subagent-driven-development |

## Resources

- **i18n Documentation:** https://www.i18next.com/
- **react-i18next:** https://react.i18next.com/
- **Zustand:** https://github.com/pmndrs/zustand
- **Electron Vite:** https://electron-vite.org/
- **Project Docs:** See `docs/superpowers/` for design specs and implementation plans

## Support & Questions

When agents encounter issues:
1. Check this document first
2. Look at recent git commits for similar changes
3. Review existing component implementations
4. Run `npm run lint` and `npm test` to catch common issues
5. Ask clarifying questions before proceeding if requirements are unclear
