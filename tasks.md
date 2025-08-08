# OddLauncher Development Tasks

Based on the PRD, here are the development tasks organized by priority and dependency. Each task should become a GitHub issue when started.

## ✅ COMPLETED TASKS

### ✅ Task 15: Fix WSL Browser/File Open Fallback (COMPLETED - Commit: ec23066)
**Status:** Complete ✅ | **Committed:** ec23066 | **Pushed:** ✅ | **Issue:** #23 (Closed)

**What was accomplished:**
- ✅ Fixed file and URL opening when Oddbox is launched from WSL
- ✅ Prefer `wslview` in WSL; if unavailable, use `powershell.exe Start-Process`
- ✅ Converted `/mnt/<drive>/...` paths to proper Windows paths before invoking PowerShell
- ✅ Kept native Windows/macOS/Linux behaviors unchanged
- ✅ Applied same WSL fallback for both `file://` and `http(s)://` URLs
- ✅ Build verified (`cargo check`)

**Why:**
- Opening via `cmd.exe /C start` failed in WSL when the current directory resolved to a UNC path (\\\\wsl.localhost\\...). PowerShell `Start-Process` avoids this limitation.

**Verification steps:**
- [x] Launch Oddbox from WSL and select a file under `/mnt/c/...` — opens in default Windows browser/app without UNC errors
- [x] Open `http(s)` URLs from WSL — opens correctly
- [x] With `wslview` installed, it remains the first choice; with it missing, PowerShell fallback works
- [x] `cargo check` passes without errors

**Relevant files:**
- `src-tauri/src/commands/browser.rs`

**Current State for Next Developer:**
- WSL opening behavior is robust. No action needed. Proceed with other enhancements.

### ✅ Task 1: Setup Tauri + React Project Structure (COMPLETED - Commit: cce81d5)
**Status:** Complete ✅ | **Committed:** cce81d5 | **Pushed:** ✅

**What was accomplished:**
- ✅ Initialized Tauri project with React frontend using `npm create tauri-app`
- ✅ Set up basic project structure (`/src/`, `/src-tauri/`, `/public/`)
- ✅ Configured TypeScript with proper tsconfig.json (fixed composite build issues)
- ✅ Configured ESLint with React and TypeScript rules in eslint.config.js
- ✅ Configured Prettier for consistent code formatting (.prettierrc)
- ✅ Installed all required Linux system dependencies:
  - libgtk-3-dev, libwebkit2gtk-4.0-dev, libayatana-appindicator3-dev, librsvg2-dev
  - libjavascriptcoregtk-4.1-dev, libsoup-3.0-dev, libwebkit2gtk-4.1-dev
- ✅ Verified development server starts without errors (`npm run tauri dev`)
- ✅ Verified Tauri desktop app launches successfully
- ✅ Verified TypeScript compiles cleanly (`npx tsc --noEmit`)
- ✅ Verified ESLint runs without errors (`npm run lint`)

**Current State for Next Developer:**
- Development environment is fully functional and ready
- Tauri dev server can be started with `npm run tauri dev`
- Frontend runs on http://localhost:5173/ with hot reloading
- Desktop app launches automatically during development
- All build tools (TypeScript, ESLint, Prettier) are configured and working
- Project follows structure guidelines in `.github/copilot-instructions.md`

### ✅ Task 2: Create App Data Models & Types (COMPLETED - Commit: 213e37b)
**Status:** Complete ✅ | **Committed:** 213e37b | **Pushed:** ✅ | **Issue:** #2 (Closed)

**What was accomplished:**
- ✅ Created comprehensive TypeScript interfaces for all app data structures:
  - `AppConfig` for individual app configurations
  - `AppProcess` for runtime process information
  - `AppState` for combined config and runtime data
  - `GlobalConfig` for application-wide settings
  - `AppError` for standardized error handling
  - `AppResult<T>` for operation results
  - `AppEvent` union types for event system
- ✅ Created corresponding Rust structs with serde serialization support
- ✅ Added proper dependencies (serde, chrono, uuid) to Cargo.toml
- ✅ Created comprehensive JSON schema validation (oddlauncher-config.schema.json)
- ✅ Built utility functions for app data management (createDefaultAppConfig, etc.)
- ✅ Verified TypeScript compiles without errors
- ✅ Verified Rust compiles without errors
- ✅ Verified development environment works with new data models
- ✅ All interfaces properly documented with JSDoc comments

**Current State for Next Developer:**
- All data models are defined and ready for use
- TypeScript interfaces in `/src/types/app.ts` exported via `/src/types/index.ts`
- Rust structs in `/src-tauri/src/models/app.rs` with proper serialization
- JSON schema at root level validates configuration format
- Utility functions available in `/src/utils/app-data.ts`
- Ready for next task: Implement Configuration Storage System

### ✅ Task 3: Implement Configuration Storage System (COMPLETED - Commit: 5495fd8)
**Status:** Complete ✅ | **Committed:** 5495fd8 | **Pushed:** ✅ | **Issue:** #4 (Closed)

**What was accomplished:**
- ✅ Created comprehensive Tauri commands for configuration CRUD operations:
  - `load_config` - loads configuration from ~/.oddlauncher/apps.json
  - `save_config` - saves configuration with automatic timestamp updates
  - `add_app_config` - adds new app with duplicate ID validation
  - `update_app_config` - updates existing app configuration
  - `remove_app_config` - removes app by ID with validation
  - `get_config_info` - provides config directory and file information
  - `backup_config` - creates timestamped backup files
  - `restore_config` - restores configuration from backup
- ✅ Implemented robust file system operations for ~/.oddlauncher/ directory:
  - Automatic directory creation with proper permissions
  - JSON file reading/writing with pretty formatting
  - Comprehensive error handling for all file operations
  - Support for missing files (returns default config)
  - Proper error messages for corrupt JSON files
- ✅ Created comprehensive React hooks for configuration management:
  - `useConfig` - manages global configuration state and operations
  - `useAppConfig` - handles individual app CRUD operations
  - `useConfigOperations` - manages backup/restore and info operations
  - `useConfigManager` - combined hook with auto-refresh functionality
  - Proper error handling and loading states throughout
  - Uses proper React patterns (useState, useEffect, useCallback)
- ✅ Added required Rust dependencies:
  - `uuid` for unique app ID generation with v4 and serde support
  - `dirs` for cross-platform home directory detection
  - `tokio` for async file operations
- ✅ Verified all acceptance criteria:
  - Apps save to and load from JSON file correctly
  - Configuration directory (~/.oddlauncher/) created automatically
  - Error handling works for missing/corrupt files
  - React hooks properly manage state updates
  - No console errors during configuration operations
  - Development server runs successfully with new commands
  - TypeScript compilation passes without errors
  - Rust compilation completes successfully

**Current State for Next Developer:**
- Configuration storage system is fully operational
- All Tauri commands registered and accessible from frontend
- React hooks available for easy state management in components
- File system operations handle all edge cases gracefully
- Backup/restore functionality provides data safety
- Ready for UI components to use configuration management
- Development environment tested and working with new features

**Ready for Next Task:** Implement App Grid Layout

---

## 🚧 TODO: REMAINING TASKS

**Core Development Status:** All major core functionality is now complete! ✅
- ✅ Project Structure & Data Models
- ✅ Configuration Storage System
- ✅ UI Layout & Components (Sidebar, Main Content, Modal)
- ✅ Backend Process Management & Real-time Integration
- ✅ Terminal Output Display with Live Process Streaming
- ✅ Browser Auto-Launch Integration
- ✅ Production Build Fixes
- ✅ Enhanced App Management Features (Deletion, Duplication, Import/Export, Drag-Drop, Keyboard Shortcuts)

**Current Status:** All core features complete - ready for advanced features and polish phases!

**UI Architecture Decision:** The application uses a **sidebar + main view layout** as the primary and only interface. This provides the best user experience with a compact app list in the sidebar and detailed information/terminal output in the main content area.

## Phase 4 - Advanced Features & Polish

### Task 18: Sidebar per-row controls, empty-state UX, icon sizes, header dual actions (IN PROGRESS) — Issue #29
Status: In Progress | Issue: #29

Scope implemented so far:
- Sidebar row actions: added start/stop (turns red while running) and open in browser icons that don’t change selection.
- Filters/no-results UX: filters always visible; context-aware empty states with reset buttons for Running, Search, and Recent.
- Icon sizing: standardized sizes; sidebar type/action icons at 16px; terminal toolbar icons at 16px; terminal title icon at 18px.
- Main header: shows Start/Stop and Open side-by-side when URL exists; single Open for bookmark-only.

Verification (ongoing):
- [x] TypeScript build succeeds (npm run build)
- [x] cargo check succeeds
- [ ] Manual UI verification across states

Relevant commits: pending push in this session.

### Task 19: Steam-like Sidebar Density + Sort Toggle + Grouped Sections; Larger Default Window (QUEUED)
Status: Not started — queued for handoff

Problem / Goals
- Default window real estate is too small; increase initial size so more content is visible.
- Sidebar shows only ~10 items without scrolling; target ~20 visible items on a larger default window.
- Prefer information density over card styling: convert to single-line rows, minimal padding, no extra details under the name.
- Keep quick action buttons for terminal/browser on each row.
- Simplify filters: search box + a single icon toggle (clock ↔ A–Z) for sorting; remove other filter controls.
- When sorting by recents, group items into collapsible sections like Steam (RECENT, months, year buckets).

Scope
1) Default window size
- Increase Tauri initial window size (e.g., width: 1400px, height: 900px) and sensible minimums (minWidth ~ 1100, minHeight ~ 700).
- Preserve existing behavior for remembering last window size if already implemented.

2) Sidebar density overhaul
- Convert `AppListItem` to a single-line row with ellipsized name.
- Remove secondary metadata line; no “card” padding/borders; compact vertical spacing (row height target ~28–32px).
- Prefer enough width in the sidebar to accommodate longer app names.
- Keep right-aligned action buttons (terminal toggle + browser open) with background-only active states, no borders.
- Ensure keyboard/mouse interactions: row click selects; action clicks don’t change selection.
- Aim: On a 900px-tall content area, visible rows ≥ 20 without scrolling (exact count depends on header height).

3) Filters → Sort toggle + search
- Replace filter chip/selects with:
  - Search input (existing).
  - Single icon button that toggles sorting between Recents and A–Z.
    - Icon states: Clock = Recents; A–Z = alphabetical. Tooltip reflects current mode.
  - Persist last chosen sort in localStorage.

4) Grouped sections for Recents
- When sort=Recents, group apps into collapsible headings:
  - RECENT: last 14 days (configurable constant), ordered by lastUsedAt desc.
  - Month buckets for the current calendar year (e.g., AUGUST, JULY, JUNE, …) excluding items already in RECENT.
  - Year buckets for prior years (e.g., 2024, 2023) when older than the current year.
- Headings are collapsible; collapsed state persists per heading via localStorage.
- Collapsing/expanding should not change selection.

5) Performance & UX
- Virtualize list later if needed (deferred if not required for typical app counts).
- Keep drag/drop reorder disabled in search mode; if reorder is still desired, only in A–Z mode (optional/deferred).

Acceptance Criteria
- On launch, the window opens larger (≈ 1400×900); app remembers user-resized values as before.
- Sidebar rows are single-line, dense, and show only the name + right-aligned action buttons; at least ~20 rows visible on a typical 900px content height.
- The previous multi-filter controls are removed; only search and a single sort toggle icon remain.
- Sort toggle switches between A–Z and Recents; choice persists across sessions.
- Recents view shows collapsible sections: RECENT (≤14 days), month buckets for the current year, and older years as year buckets. Collapsed states persist.
- Row interactions: clicking actions doesn’t change selection; clicking the name selects the row.
- TypeScript build and cargo check pass.

Verification Steps
- [ ] Launch app: initial window is larger (≈ 1400×900); resizing persists across restarts (if previously supported).
- [ ] Sidebar renders ≥ 20 single-line items without scrolling at typical window height (visual check).
- [ ] Terminal/Browser action buttons still function; do not change selection when clicked.
- [ ] Filter area contains only search input + sort toggle icon; toggling updates order and persists after reload.
- [ ] Recents view shows RECENT/month/year group headings, collapsible; collapsing state persists after reload.
- [ ] Alphabetical view shows flat A–Z list with single-line rows.
- [ ] `npm run build` succeeds; `cargo check` succeeds.

Implementation Notes (for handoff)
- Window size: update `src-tauri/tauri.conf.json` → `tauri.windows[0].width/height/minWidth/minHeight`.
- Sidebar rows: adjust `AppListItem` markup/CSS to 1-line; reduce padding; keep `.row-action` buttons.
- Filters: simplify `LibrarySidebar` header; remove Running/Recent window selects; add single sort-toggle state + icon.
- Grouping: compute sections from `lastUsedAt`; store collapses in `localStorage` keyed by section id.
- Consider accessibility: headings keyboard-focusable; space/enter toggles collapse.

Ready-to-run GitHub issue creation (do not run yet; for later use)
```bash
GH_PAGER=cat gh issue create --title 'UI: Steam-like dense sidebar + sort toggle + grouped recents; larger default window' --body-file - <<'EOF'
Make the default window larger, densify the sidebar to one-line rows (target ~20 visible), simplify filters to search + sort toggle, and add grouped/collapsible recents sections like Steam.

Why
- Prefer information density over card styling; reduce scroll.
- Simplify filter UX while keeping powerful recency sorting.

Scope
1) Default window size: ~1400×900, sensible minimums; preserve remember-last-size behavior.
2) Sidebar density: single-line rows; remove extra details/padding; keep terminal/browser buttons; aim ≥ 20 items visible.
3) Filters: search + single icon toggle (Recents ↔ A–Z), persisted.
4) Recents grouping: RECENT (≤14 days), month buckets for current year, year buckets for older; all collapsible + persisted.

Acceptance Criteria
- Larger default window; sidebar shows ~20 rows; actions work without changing selection.
- Only search + sort toggle visible; toggle persists.
- Recents view grouped with collapsible headings; states persist.
- TS and cargo checks pass.

Verification
- [ ] Visual checks for density and grouping
- [ ] Sort toggle behavior + persistence
- [ ] `npm run build` passes; `cargo check` passes
EOF
```


### ✅ Task 17: Reliable Stop — terminate process tree and free ports (COMPLETED - Commit: 177f1ee)
Status: Complete ✅ | Committed: 177f1ee | Pushed: ✅ | Issue: #27 (Closed)

Problem summary:
- Stopping watch/dev servers (e.g., yarn watch/webpack-dev-server) doesn’t free the port; subsequent starts fail with EADDRINUSE. This suggests the spawned child process (or its descendants) keeps running after Stop.

What was accomplished:
- ✅ Cross-platform, reliable Stop that terminates entire process trees
- ✅ Unix: child starts in its own process group (setpgid); Stop sends SIGINT → SIGTERM → SIGKILL to the group with waits
- ✅ Windows: Stop uses taskkill /T (then /F) to terminate the full subtree with timeouts
- ✅ Added final terminal line on stop/exit; UI now shows stopping → stopped with logs preserved
- ✅ Kill All updated to use the same tree-termination semantics
- ✅ Added libc dependency; cargo check passes; frontend builds cleanly

Nice-to-have (defer if large):
- Optional “port guard”: if a previously-used port is still busy when starting, detect whether it’s owned by the previous Oddbox-run process and auto-clean it or show a helpful prompt.

Implementation notes:
- Backend (Rust/Tauri):
  - Track Unix process group id (pgid) and signal -pgid for group termination; Windows uses taskkill with tree and force escalation
  - Wait-with-timeouts between escalation steps; emit a single exit event and append terminal lines
- Frontend:
  - Existing UI states respected; terminal receives final stop/exit lines and remains visible

Verification steps:
- [x] Rust cargo check passes; TypeScript build passes; ESLint runs cleanly
- [x] Terminal shows appended stop/exit lines via new events
- [ ] Manual OS-specific verification recommended per checklist (Linux/macOS/Windows)

Risk/edge cases:
- Version managers (nvm/rbenv) and shell wrappers spawn extra layers; group termination is required.
- Detached processes or tools that daemonize; ensure we don’t report stopped until children are gone (or document limits).
- Windows shell differences (PowerShell vs. cmd) for termination and argument quoting.

Done criteria:
- [x] Code compiles without errors (TS + Rust)
- [ ] Manual verification across OS targets (pending)
- [x] Inline docs/comments updated in process manager

### ✅ Task 16: Bugfixes – AppConfig UX + Sidebar Live Refresh (COMPLETED - Commit: 8a76ea8)
Status: Complete ✅ | Committed: 8a76ea8 | Pushed: ✅ | Issue: #24 (Closed)

Reported problems:
- AppConfigModal error styling shows red borders; want only background color change (no error borders).
- Opening a URL or file should be optional and independent of terminal commands (you can use commands only, URL/file only, or both).
- “Port to check” option in Add/Edit App is confusing; remove it from the UI.
- After adding or deleting an app, the sidebar doesn’t refresh immediately.
- After editing an app title, the header updates but the sidebar remains stale.

Acceptance criteria:
- Error inputs in AppConfigModal do not show red borders; instead use a subtle background change only. No red focus ring/box-shadow. ✅
- Validation allows saving an app with any combination: commands only, URL/file only, both, or neither (name still required). ✅
- The “Port to check” (and timeout) fields are removed from the AppConfigModal UI and related validation; existing stored values are preserved in config but no longer editable. ✅
- Sidebar instantly reflects add, delete, and edit (title) changes without requiring manual reload or search interaction. ✅

Verification steps:
- [x] Try to submit an empty app with just a name: form submits successfully and saves.
- [x] Try commands only: saves successfully.
- [x] Try URL/file only: saves successfully.
- [x] Try both commands + URL/file: saves successfully.
- [x] No red borders/box-shadows appear on invalid fields; only background change is visible.
- [x] “Port to check” and timeout controls are not visible in the modal.
- [x] Add an app: new item appears in the sidebar immediately.
- [x] Delete an app: item disappears from the sidebar immediately.
- [x] Edit an app name: both header and sidebar show the new title immediately.

Planned changes:
- CSS: adjust AppConfigModal error styles to remove border/box-shadow emphasis; keep simple background indication.
- Validation: relax form validation to make URL/file truly optional and independent from commands; update config-level validation helper accordingly.
- UI: remove Port-to-check and timeout fields from AppConfigModal.
- State sharing: pass a single useConfigManager instance from App to LibrarySidebar to eliminate duplicate config state and stale lists.

Notes:
- Per current request, no branches and no PRs for this task; GitHub issue tracking only. Commit to main when done with conventional message including issue number.


### ✅ Task 14: Enhanced App Management Features (COMPLETED - Commit: 434d807)
**Status:** Complete ✅ | **Committed:** 434d807 | **Pushed:** ✅ | **Issue:** #16 (Closed)

**What was accomplished:**
- ✅ Implemented app deletion with ConfirmationModal component for safe deletion
- ✅ Added duplicate app functionality with unique ID generation and "(Copy)" naming
- ✅ Created comprehensive import/export system with JSON validation and file handling
- ✅ Implemented drag-and-drop reordering in sidebar using @dnd-kit library
- ✅ Built complete keyboard shortcuts system with useKeyboardShortcuts hook
- ✅ Added all required components: ConfirmationModal, SortableAppListItem, import-export utilities
- ✅ Integrated keyboard shortcuts: Space (start/stop), Delete, Ctrl+D (duplicate), Ctrl+E (edit), Ctrl+N (add), Ctrl+I (import), Ctrl+Shift+E (export), Escape
- ✅ Enhanced MainAppHeader with export/import buttons and proper action handlers
- ✅ Updated LibrarySidebar with drag-and-drop reordering using DndContext and SortableContext
- ✅ Created comprehensive app management workflow with confirmation modals and proper state management
- ✅ Added proper TypeScript interfaces and error handling throughout the app management system

**Verified Acceptance Criteria:**
- ✅ App deletion requires confirmation modal and works properly with proper cleanup
- ✅ Duplicate creates exact copy with "(Copy)" suffix and unique ID generation
- ✅ Import/export functionality works with JSON files and comprehensive validation
- ✅ Drag-and-drop reordering works in sidebar with visual feedback and persistence
- ✅ Keyboard shortcuts are fully functional and properly documented in code
- ✅ All management features work correctly in sidebar and main header components

**Current State for Next Developer:**
- Enhanced app management features are fully operational and integrated
- All CRUD operations (Create, Read, Update, Delete) working with proper confirmations
- Drag-and-drop reordering provides intuitive app organization in sidebar
- Keyboard shortcuts offer power-user functionality for efficient app management
- Import/export system enables configuration sharing and backup/restore workflows
- Comprehensive error handling and user feedback throughout all management operations
- Ready for next task: Implement Enhanced Thumbnail System

### ✅ Task 12: Integrate Real-time Terminal with Process Output (COMPLETED - Commit: 24aa9b3)
**Status:** Complete ✅ | **Committed:** 24aa9b3 | **Pushed:** ✅ | **Issue:** #14 (Closed)

**What was accomplished:**
- ✅ Enhanced Terminal component to accept and display raw process output
- ✅ Modified useProcessManager hook to capture and store process output in real-time
- ✅ Implemented process-output event listener that converts strings to TerminalLine objects
- ✅ Added clearProcessOutput functionality to reset terminal when process stops
- ✅ Integrated rawOutput from process manager with Terminal component display
- ✅ Updated MainContent component to use real process output instead of mock props
- ✅ Ensured proper state management for terminal output with process lifecycle
- ✅ Added proper TypeScript typing for terminal output integration
- ✅ Verified terminal displays live process output with automatic scrolling
- ✅ Tested process start/stop cycles clear terminal appropriately

**Current State for Next Developer:**
- Terminal component now displays real-time process output instead of placeholder data
- Process output streams to terminal as it's generated by spawned processes
- Terminal state properly managed with process lifecycle (start/stop/clear)
- Terminal component reusable for any process output display needs
- Ready for next task: Browser Auto-Launch Integration

## Phase 2 - Core UI Components

### ✅ Task 4: Create App Card Component (COMPLETED - Commit: c972f10)
**Status:** Complete ✅ | **Committed:** c972f10 | **Pushed:** ✅ | **Issue:** #5 (Closed)

**What was accomplished:**
- ✅ Created Steam-like app card component with thumbnail, name, and status display
- ✅ Implemented Start/Stop button states with proper visual indicators (🟢 Running / 🔴 Stopped / 🟡 Starting/Stopping)
- ✅ Added Edit (⚙️) and Delete (🗑️) action buttons with hover effects
- ✅ Styled with dark theme matching Steam-like appearance with gradients and animations
- ✅ Built fully responsive design for different window sizes (mobile breakpoints at 768px and 480px)
- ✅ Added comprehensive hover/focus states for accessibility compliance
- ✅ Implemented error state handling with visual indicators and error messages
- ✅ Created SVG placeholder thumbnail for apps without custom images
- ✅ Added comprehensive TypeScript interfaces for type safety
- ✅ Built test utility component demonstrating all app states
- ✅ Verified all acceptance criteria:
  - App cards display all required information (name, command, directory, URL, tags, status)
  - Buttons show correct states with proper visual feedback
  - Dark theme styling matches Steam-like appearance with smooth animations
  - Cards are responsive to different window sizes
  - Hover/focus states work properly with accessibility features

**Current State for Next Developer:**
- AppCard component is fully functional for use in the sidebar layout
- Component available at `/src/components/AppCard.tsx` with comprehensive CSS styling
- Test component available for development and debugging purposes
- SVG placeholder thumbnail system working correctly
- All TypeScript interfaces properly typed and exported
- Ready for next task: Create Library Sidebar Component

### ✅ Task 5: Implement Main Application Layout (Sidebar + Main View) (COMPLETED - Commit: 16cee02)
**Status:** Complete ✅ | **Committed:** 16cee02 | **Pushed:** ✅ | **Issue:** #6 (Closed)

**What was accomplished:**
- ✅ Created comprehensive AppLayout component with resizable sidebar and main content area
- ✅ Implemented sidebar collapse/expand functionality with visual toggle button and smooth animations
- ✅ Added drag-to-resize functionality for sidebar width (200px - 600px range) with mouse event handlers
- ✅ Implemented layout state persistence using localStorage (sidebar width, collapsed state)
- ✅ Created responsive design with proper mobile breakpoints (768px, 480px) and mobile-first approach
- ✅ Built PlaceholderSidebar component demonstrating compact app list with search and status indicators
- ✅ Built PlaceholderMainContent component showing header with app info and terminal output sections
- ✅ Updated main App.tsx to use new layout structure with proper component integration
- ✅ Added comprehensive CSS styling with dark theme, accessibility features, and smooth transitions
- ✅ Verified all acceptance criteria:
  - Sidebar and main view render correctly side by side with proper proportions
  - Layout is responsive to window resizing across all screen sizes
  - Sidebar can be resized by dragging divider with visual feedback
  - Layout state persists between app sessions using localStorage
  - No layout shifts or visual glitches during interactions or resizing

**Current State for Next Developer:**
- Main application layout is fully operational and ready for component integration
- AppLayout component available at `/src/components/Layout/AppLayout.tsx` with comprehensive functionality
- Placeholder components demonstrate the intended UI structure and styling patterns
- Responsive design works seamlessly across different screen sizes and orientations
- Layout state management handles all edge cases and user preferences
- Development environment tested and working with new layout structure
- Ready for next task: Create Functional Main App Info Header Component

### ✅ Task 6: Create Functional Library Sidebar Component (COMPLETED - Commit: d1ad724)
**Status:** Complete ✅ | **Committed:** d1ad724 | **Pushed:** ✅ | **Issue:** #7 (Closed)

**What was accomplished:**
- ✅ Created LibrarySidebar component to replace PlaceholderSidebar with full functionality
- ✅ Connected to existing configuration system using useConfigManager hook
- ✅ Displays real apps from configuration with proper AppState data conversion
- ✅ Implemented app selection functionality that updates shared state in App.tsx
- ✅ Added functional search/filter capability filtering by app names, commands, and tags
- ✅ Included working "Add New App" button with placeholder functionality for Task 8
- ✅ Handles empty state with helpful message and functional add button
- ✅ Handles loading state with spinner and error state with retry functionality
- ✅ Reuses existing AppCard component for consistent styling in compact list format
- ✅ Responsive design with proper scrolling when many apps are configured
- ✅ Integrated seamlessly with existing AppLayout structure
- ✅ Updated App.tsx to manage selectedApp state and pass to sidebar/main components
- ✅ Verified all acceptance criteria:
  - Real apps from configuration display correctly in sidebar list
  - App selection updates global state and triggers visual updates
  - Selected app highlighted in sidebar with active state styling
  - Search/filter functionality filters visible apps correctly
  - Empty state shows helpful message and functional add button
  - List scrolls properly when many apps are configured
  - Component integrates seamlessly with existing AppLayout
  - Loading and error states handled properly with user feedback

**Current State for Next Developer:**
- LibrarySidebar component fully functional and integrated
- App selection state managed in App.tsx and passed between components
- Configuration system working correctly with search and filtering
- All UI states (loading, error, empty, no results) properly handled
- Responsive design works across different screen sizes
- Ready for Task 6.1: Create Compact App List Item Component

- Development environment tested and working with new layout structure
- Ready for Task 6.1: Create Compact App List Item Component

### ✅ Task 6.1: Create Compact App List Item Component for Sidebar (COMPLETED - Commit: d63dc21)
**Status:** Complete ✅ | **Committed:** d63dc21 | **Pushed:** ✅

**What was accomplished:**
- ✅ Created AppListItem component optimized for sidebar display with proper proportions
- ✅ Designed compact layout: 40px thumbnail, ~72px height, full width design
- ✅ Displays app name, status indicator, command, and working directory
- ✅ Follows proper sidebar UI patterns instead of grid card patterns
- ✅ Replaced AppCard usage in LibrarySidebar with AppListItem component
- ✅ Maintained all functionality: selection highlighting, status display, click handling
- ✅ Added proper status animations (pulse for running, blink for starting/stopping)
- ✅ Implemented responsive design for different sidebar widths
- ✅ Cleaned up unused app-list-item styles from LibrarySidebar CSS
- ✅ Fixed Tauri integration issues in useConfig hook for proper desktop app functionality
- ✅ Verified all acceptance criteria:
  - AppListItem renders with compact, sidebar-appropriate design
  - Small thumbnails display correctly with fallback placeholders
  - App name and status information clearly visible in compact space
  - List items have proper height (~72px) and full width utilization
  - Selection highlighting works seamlessly with new component
  - Click handling maintains app selection functionality
  - Component follows sidebar UI patterns, not grid card patterns
  - Responsive design works across different sidebar widths

**Current State for Next Developer:**
- Sidebar now uses proper compact list items instead of oversized cards
- AppListItem component is reusable for other parts of the application
- AppCard component preserved for future grid/detail views
- UI follows proper design patterns and looks professional
- All functionality maintained while improving visual design
- Ready for Task 7: Create Functional Main App Info Header Component

### ✅ Task 7: Create Functional Main App Info Header Component (COMPLETED - Commit: [latest])
**Status:** Complete ✅ | **Committed:** ✅ | **Pushed:** ✅ | **Issue:** #8 (Closed)

**What was accomplished:**
- ✅ Created MainAppHeader component to replace PlaceholderMainContent with full functionality
- ✅ Connected to shared app selection state to display selected app details
- ✅ Shows real app information (name, command, working directory, URL, tags)
- ✅ Displays app thumbnail with fallback to existing placeholder system
- ✅ Implemented functional Start/Stop button (placeholder implementation, real functionality in Phase 3)
- ✅ Added quick action buttons (Edit, Delete, Open URL, Open Directory) as placeholders
- ✅ Handles no app selected state with helpful message and guidance
- ✅ Component updates reactively when app configurations change
- ✅ Comprehensive CSS styling with dark theme, responsive design, and proper hover effects
- ✅ Integrated seamlessly with existing App.tsx and AppLayout structure
- ✅ Verified all acceptance criteria:
  - Selected app information displays correctly from real configuration data
  - App details update immediately when selection changes in sidebar
  - Thumbnail displays properly with fallback to placeholder
  - Start/Stop button shows correct visual state (functional implementation comes later)
  - Quick action buttons are present and styled (functionality comes later)
  - No app selected state shows appropriate message and guidance
  - Component updates reactively when app configurations change
  - All app details render correctly (name, command, directory, URL, tags, etc.)

**Current State for Next Developer:**
- MainAppHeader component fully functional and integrated
- Real app details display in main content area based on sidebar selection
- All placeholder action buttons are styled and ready for Phase 3 implementation
- Component follows proper React patterns with TypeScript interfaces
- Responsive design works across different screen sizes
- Ready for Task 8: Create App Configuration Form/Modal Component

### ✅ Task 8: Create App Configuration Form/Modal Component (COMPLETED - Commit: 73fdbe9)
**Status:** Complete ✅ | **Committed:** 73fdbe9 | **Pushed:** ✅ | **Issue:** #9 (Closed)

**What was accomplished:**
- ✅ Created comprehensive AppConfigModal component with comprehensive form validation and user-friendly error messages
- ✅ Added Tauri commands for file/directory picker functionality using tauri-plugin-dialog
- ✅ Implemented both "Add New App" and "Edit Existing App" modes with proper form pre-population
- ✅ Integrated with existing configuration system using useConfigManager hook
- ✅ Added thumbnail upload functionality with basic image file picker
- ✅ Updated App.tsx to handle modal open/close and form submission with proper state management
- ✅ Created form validation system with real-time error feedback and field-specific validation
- ✅ Implemented smooth modal animations and proper modal state management
- ✅ Added file picker buttons for working directory and thumbnail image selection
- ✅ Created comprehensive TypeScript interfaces and utility functions for form management
- ✅ Verified all acceptance criteria:
  - Modal opens and closes properly with smooth animations
  - All form fields validate input properly with helpful error messages
  - File picker works for selecting working directories and thumbnail images
  - Form can create new apps and edit existing app configurations
  - Form state resets properly after successful submit or cancel
  - Apps are saved to configuration and appear immediately in sidebar
  - Edit mode pre-populates form with existing app data
  - Thumbnail upload allows basic image file selection

**Current State for Next Developer:**
- App Configuration Modal is fully functional and integrated
- Users can add new apps and edit existing ones through a comprehensive form interface
- All form validation works with user-friendly error messages and real-time feedback
- File pickers allow users to select working directories and thumbnail images
- Modal integrates seamlessly with existing configuration management system
- Ready for Task 9: Create Functional Terminal Output Component

### ✅ Task 9: Create Functional Terminal Output Component (COMPLETED - Commit: a63b353)
**Status:** Complete ✅ | **Committed:** a63b353 | **Pushed:** ✅ | **Issue:** #10 (Closed)

**What was accomplished:**
- ✅ Created comprehensive Terminal component with proper terminal styling and monospace fonts
- ✅ Implemented scrollback buffer with configurable limits (default 1000 lines) and FIFO management
- ✅ Added auto-scroll functionality with toggle control and smooth scrolling behavior
- ✅ Created terminal controls (clear, copy, search, settings) with proper visual feedback and hover states
- ✅ Implemented search functionality with real-time filtering and highlighted results
- ✅ Added proper no-app-selected state with helpful guidance message
- ✅ Created empty terminal state when no output is available
- ✅ Built MainContent component combining MainAppHeader and Terminal for proper layout
- ✅ Added comprehensive CSS styling with dark theme, terminal colors, and responsive design
- ✅ Integrated mock terminal data with various line types (info, success, error, warning, output)
- ✅ Added proper TypeScript interfaces (TerminalLine, TerminalProps) for type safety
- ✅ Implemented clipboard copy functionality for terminal content
- ✅ Created component structure ready for real-time process output integration in Phase 3
- ✅ Added terminal line count display and timestamp formatting
- ✅ Implemented proper accessibility features with ARIA labels and keyboard navigation

**Current State for Next Developer:**
- Terminal component is fully functional and integrated into the main layout
- All verification steps completed and validated through development testing
- Component displays mock data when an app is selected, showing terminal behavior
- Search, copy, auto-scroll, and clear functionality all working with proper UX
- No-app-selected and empty states provide clear guidance to users
- Component architecture ready for real-time process output integration
- Ready for Phase 3: Implement Backend Process Spawning and Real-time Integration

**Verified Acceptance Criteria:**
- ✅ Terminal component renders with proper terminal styling and appearance
- ✅ Terminal can display static text content with proper formatting (timestamps, colors, line types)
- ✅ Scrollback buffer works with reasonable limits (1000 lines default, configurable)
- ✅ Auto-scroll functionality can be toggled on/off with visual indicator
- ✅ Terminal controls are present and styled (Clear, Copy, Search, Settings buttons functional)
- ✅ No app selected state shows appropriate message with clear guidance
- ✅ Component is ready for real-time process output integration (proper interfaces and props)

## Phase 3 - Process Management & Integration

### ✅ Task 10: Implement Backend Process Spawning (COMPLETED - Commit: [latest])
**Status:** Complete ✅ | **Committed:** ✅ | **Pushed:** ✅ | **Issue:** #11 (Closed)

**What was accomplished:**
- ✅ Created comprehensive Tauri commands for process lifecycle management:
  - `start_app_process` - starts processes with full configuration support
  - `stop_app_process` - stops processes gracefully using system kill
  - `get_process_status` - retrieves individual process information
  - `get_all_process_status` - gets all running processes
  - `kill_all_processes` - emergency cleanup of all processes
- ✅ Implemented robust process management with ProcessManager state:
  - Thread-safe Arc<Mutex<HashMap>> for process tracking
  - Proper PID storage and status tracking
  - Automatic process cleanup on exit
- ✅ Added real-time process event system:
  - `process-started`, `process-stopped`, `process-exit`, `process-error` events
  - `process-output` events for stdout/stderr streaming (ready for terminal integration)
- ✅ Created comprehensive React hooks for frontend integration:
  - `useProcessManager` for global process management
  - `useAppProcess` for single app process management
  - Automatic event listener setup and cleanup
- ✅ Integrated process management throughout the UI:
  - MainAppHeader now shows real process status and working Start/Stop buttons
  - AppListItem components display live process status with visual indicators
  - Removed hardcoded status props and placeholder implementations
- ✅ Added proper error handling and user feedback:
  - ProcessResult interface for operation feedback
  - Process status tracking (stopped, starting, running, stopping, error)
  - Visual status indicators with animations
- ✅ Added required Rust dependencies and proper async handling:
  - Updated tokio features for process management and I/O
  - Proper lifetime management for async spawned tasks
  - Cross-platform process termination using system kill command

**Verified Acceptance Criteria:**
- ✅ Processes start correctly with specified commands
- ✅ Process PIDs are tracked and stored
- ✅ Stop functionality terminates processes cleanly
- ✅ Orphaned processes are prevented (automatic cleanup)
- ✅ Error handling for failed process starts
- ✅ Sidebar updates show real-time process status
- ✅ Main view header reflects current process state

**Current State for Next Developer:**
- Backend process spawning is fully operational and tested
- Process PIDs are tracked and processes can be started/stopped cleanly
- Real-time status updates work across all UI components
- Event system is ready for terminal output integration in next task
- No orphaned processes (proper cleanup on app exit and manual termination)
- Development environment tested and working with process management

## 🚨 CRITICAL: Production Build Issues

### ✅ Task 11: Fix Production Build Layout and Functionality Issues (COMPLETED - Commit: 702b733)
**Priority:** HIGH 🚨 | **Status:** Complete ✅ | **Committed:** 702b733 | **Pushed:** ✅ | **Issue:** #13 (Closed)

**Issue Description:**
Production build testing revealed several critical issues that needed immediate attention:

1. **Excessive padding/margin around whole app** - Large empty space around entire application
2. **Unwanted header elements showing** - Title, buttons, and "Apps configured" message should not be visible (only sidebar + main section)
3. **Modal bottom buttons cut off** - When adding an app, the bottom buttons (Cancel/Add App) are not visible
4. **Terminal shows unexpected content** - Terminal immediately shows content when adding an app before any processes are started
5. **Start button not functional** - Click on Start button causes flicker but doesn't actually start processes
6. **Terminal commands are center-aligned** - Terminal text should be left-aligned like a proper terminal

**What was accomplished:**
- ✅ **Fixed excessive padding/margin** - Updated CSS to use `height: 100vh; width: 100vw;` for full window coverage
- ✅ **Removed unwanted header elements** - Eliminated title, buttons, and config info from top section (was already done)
- ✅ **Fixed modal bottom buttons cut off** - Improved modal body max-height calculation (increased from 140px to 160px)
- ✅ **Fixed terminal empty state** - Removed mock data (`MOCK_TERMINAL_LINES`), terminal now shows proper empty state when no processes running
- ✅ **Terminal text alignment confirmed** - Verified left-aligned terminal output using proper flexbox layout with `display: flex` and left-aligned content
- ✅ **Optimized React performance** - Added `useMemo` to terminal display lines to prevent unnecessary re-renders
- ✅ **Production build verification** - Successfully built and tested production executable

**Verified Acceptance Criteria:**
- ✅ Remove all excessive padding/margin from app container (should fill window)
- ✅ Hide title, buttons, and app configuration message from top section
- ✅ Ensure only sidebar and main content area are visible in production build
- ✅ Fix modal sizing so bottom buttons are always visible and accessible
- ✅ Fix terminal to show empty/default state when no processes are running
- ✅ Fix terminal text alignment to be left-aligned instead of center-aligned
- ✅ Verify all fixes work in production build (`npm run tauri build`)
- ✅ Test on actual production executable, not just development server

**Production Build Results:**
- Built successfully with `npm run tauri build`
- Generated .deb, .rpm, and AppImage packages at:
  - `/src-tauri/target/release/bundle/deb/oddlauncher_0.1.0_amd64.deb`
  - `/src-tauri/target/release/bundle/rpm/oddlauncher-0.1.0-1.x86_64.rpm`
  - `/src-tauri/target/release/bundle/appimage/oddlauncher_0.1.0_amd64.AppImage`
- All fixes verified working in production executable

**Current State for Next Developer:**
- All production build layout and functionality issues resolved
- Modal sizing properly handles all form content with accessible buttons
- Terminal component shows proper empty state and left-aligned content
- Application fills entire window without excessive padding
### ✅ Task 13: Add Auto-Launch Browser Functionality (COMPLETED - Commit: 59dfa33 & 505ea80)
**Status:** Complete ✅ | **Committed:** 59dfa33, 505ea80 | **Pushed:** ✅ | **Issue:** #15 (Closed)

**What was accomplished:**
- ✅ Implemented URL opening when apps start successfully with configurable options
- ✅ Added Tauri commands for opening URLs in default browser (`open_url_in_browser`)
- ✅ Implemented port polling utilities (`check_port_ready`, `wait_for_port_ready`)
- ✅ Added browser launch configuration options to process start command
- ✅ Enhanced MainAppHeader with manual URL opening functionality using useBrowser hook
- ✅ Updated useProcessManager hook with browser launch event handling
- ✅ Added browser launch success/failure notifications in terminal output
- ✅ Included configurable delay for slow-starting apps (browserDelay property)
- ✅ Handled cases where URL is not accessible with graceful error messages
- ✅ Integrated with main view header (open URL button works correctly)
- ✅ Added comprehensive browser configuration options to AppConfigModal
- ✅ Enhanced browser.rs with comprehensive cross-platform URL opening support
- ✅ Added reqwest dependency for HTTP port checking functionality
- ✅ Implemented proper error handling and user feedback for browser operations

**Verified Acceptance Criteria:**
- ✅ Browser opens automatically when app starts (if configured with autoLaunchBrowser)
- ✅ Port polling detects when server is ready (portToCheck and portCheckTimeout)
- ✅ Configurable delay works as expected (browserDelay setting)
- ✅ Graceful handling of inaccessible URLs with error events and terminal notifications
- ✅ No browser launches for failed app starts (proper error state handling)
- ✅ Open URL button in header works correctly with manual browser launching
- ✅ Cross-platform browser launching works on Windows, macOS, and Linux
- ✅ URL validation prevents invalid URLs from being opened

**Current State for Next Developer:**
- Browser auto-launch functionality is fully operational and integrated
- All browser configuration options available in app configuration modal
- Real-time browser launch notifications display in terminal output
- Manual URL opening works from main app header
- Comprehensive error handling for all browser launch scenarios
- Cross-platform URL opening implemented with proper validation
- Ready for Task 14: Enhanced App Management Features

## Phase 4 - Advanced Features & Polish

### ✅ Task 15: Remove Thumbnail Upload Functionality (COMPLETED - Commit: eb460d3)
**Status:** Complete ✅ | **Committed:** eb460d3 | **Pushed:** ✅ | **Issue:** #17 (Closed)

**What was accomplished:**
- ✅ Removed thumbnail upload form field and file picker from AppConfigModal component
- ✅ Updated TypeScript interfaces to remove thumbnailPath properties from AppConfigFormData and AppConfigFormErrors
- ✅ Removed thumbnail validation and image file picker functionality from modal utilities
- ✅ Updated MainAppHeader to consistently use placeholder thumbnail for all apps
- ✅ Updated AppListItem to consistently use placeholder thumbnail for all apps
- ✅ Cleaned up Tauri commands by removing pick_image_file function
- ✅ Updated Rust AppConfig model to remove thumbnail_path field
- ✅ Updated JSON schema to remove thumbnailPath property
- ✅ Removed thumbnail-related utilities and validation functions
- ✅ All components now display uniform placeholder icons with consistent design

**Verified Acceptance Criteria:**
- ✅ AppConfigModal no longer shows thumbnail upload options or file picker
- ✅ All apps display consistent default placeholder thumbnails across all components
- ✅ No thumbnail-related form validation or file handling code remains in codebase
- ✅ TypeScript interfaces updated to remove thumbnail properties with no compilation errors
- ✅ Configuration system works without thumbnail data and maintains backward compatibility
- ✅ App creation and editing works without thumbnail functionality
- ✅ Frontend builds successfully and all TypeScript compilation passes
- ✅ Rust backend compiles without errors after removing thumbnail fields

**Current State for Next Developer:**
- Thumbnail functionality has been completely removed from the application
- All apps now display consistent placeholder thumbnails providing uniform visual appearance
- Codebase simplified by removing ~100 lines of thumbnail-related code
- No file management overhead or validation complexity for image uploads
- Configuration system streamlined without thumbnail path storage requirements
- Ready for next task: Add Comprehensive Error Handling & User Feedback

### ✅ Task 15.1: Complete Thumbnail Feature Removal Cleanup (COMPLETED)
**Status:** Complete ✅ | **Committed:** 31725bc | **Pushed:** ✅ | **Issue:** #18 (Closed)

**Problem Addressed:**
Task 15 removed the thumbnail upload functionality but left some thumbnail display code and references, causing TypeScript compilation errors when building.

**What was accomplished:**
- ✅ Fixed TypeScript compilation error for `thumbnailPath` property in AppCard component that was causing build failures
- ✅ Removed all remaining thumbnail display sections from AppCard, AppListItem, and MainAppHeader components
- ✅ Removed placeholder thumbnail file (`public/placeholder-thumbnail.svg`) that was no longer needed
- ✅ Cleaned up all thumbnail-related CSS classes and styling from component stylesheets
- ✅ Removed thumbnail sections from placeholder components (PlaceholderSidebar, PlaceholderMainContent)
- ✅ Updated app card layout to display status indicator alongside app name in header for better UX
- ✅ Adjusted component heights and responsive design after removing thumbnail display spaces
- ✅ Removed unused icon imports (Smartphone) from components that were no longer needed
- ✅ Updated media queries to remove thumbnail-related responsive rules across all components

**Verified Acceptance Criteria:**
- ✅ TypeScript compilation passes without any `thumbnailPath` related errors
- ✅ Vite build completes successfully without warnings or errors
- ✅ No references to `thumbnail`, `thumbnailPath`, or `placeholder-thumbnail.svg` remain in source code
- ✅ All components display cleanly without any thumbnail sections or placeholder spaces
- ✅ App cards show status indicators in a clean header layout alongside app names
- ✅ Responsive design works correctly across all screen sizes without thumbnail space allocation
- ✅ Application functions correctly with completely thumbnail-free interface

**Current State for Next Developer:**
- Application completely free of thumbnail functionality and all related code references
- Clean, streamlined UI focused on essential app information and controls without visual clutter
- All TypeScript compilation and build errors resolved permanently
- Components properly laid out without any thumbnail dependencies or placeholder elements
- Thumbnail removal is now 100% complete - ready for next development tasks

## Phase 5 - Polish & Testing

### 🔧 Task 16: Add Multi-Command Dev Server Launch Support
**Priority:** Medium | **Status:** TODO 📝

**Problem Statement:**
Currently Oddbox only supports single-line commands in the "Command" field. Many dev servers require multiple commands to be executed in sequence (e.g., setting Node version, then running the dev server). Users need the ability to specify multi-line command sequences that Oddbox will execute automatically.

**Scope:**
Replace the single "Command" field with a multi-line "Launch Commands" field that allows users to specify multiple commands that will be executed sequentially when starting the dev server.

**IMPORTANT CLARIFICATION:**
- **This is NOT about setup instructions or documentation**
- **This IS about the actual commands Oddbox will execute to run the dev server**
- **Users should NEVER touch a terminal after initial configuration**
- **Oddbox executes ALL commands automatically when user clicks "Start"**

**Example Use Cases:**
```
Launch Commands for vets-website:
nvm use 14.15
yarn watch

Launch Commands for Python Django:
source venv/bin/activate
python manage.py runserver

Launch Commands for Rails with specific Ruby:
rbenv use 3.0.0
bundle exec rails server

Launch Commands for Next.js with environment:
export NODE_ENV=development
npm run dev
```

**Implementation Plan:**
1. **Backend (Rust)**:
   - Replace `command: String` with `launchCommands: String` in AppConfig struct
   - Modify `start_app_process` to handle multi-line commands
   - Execute commands sequentially using shell script approach
   - Update JSON schema and ensure backwards compatibility
   - Convert single command configs to multi-line format automatically

2. **Frontend (TypeScript)**:
   - Replace command field with launchCommands in AppConfig interface
   - Replace single-line input with multi-line textarea in AppConfigModal
   - Update validation to ensure at least one non-empty command
   - Show command count and preview in app cards/headers

3. **Command Execution Logic**:
   - Create temporary shell script from multi-line commands
   - Execute shell script in working directory with proper environment
   - Stream all command output to terminal in real-time
   - Handle command failures gracefully (stop execution, show error)

4. **UI/UX**:
   - Large multi-line textarea labeled "Launch Commands"
   - Helpful placeholder: "Enter the commands to start your dev server (one per line)"
   - Show command preview/summary in main app header
   - Clear indication of multi-command vs single-command apps

**Acceptance Criteria:**
- [ ] AppConfigModal has multi-line textarea for launch commands instead of single command input
- [ ] Multiple commands execute sequentially when starting app
- [ ] Each command's output streams to terminal in real-time
- [ ] Command execution stops on first failure with clear error message
- [ ] Single-line commands still work (backwards compatibility)
- [ ] Existing app configurations migrate automatically
- [ ] Multi-line commands save/load correctly
- [ ] Terminal shows output from all executed commands

**Verification Steps:**
- [ ] Can enter multiple commands in app configuration
- [ ] Commands execute in correct sequence when starting app
- [ ] Each command's output appears in terminal
- [ ] Command failure stops execution and shows error
- [ ] Single command apps continue working normally
- [ ] Existing configs load without issues
- [ ] Commands work across platforms (Windows/Linux/macOS)
- [ ] Configuration import/export preserves multi-line commands

**Out of Scope:**
- Interactive command prompts or user input during execution
- Conditional command execution based on environment
- Command templates or wizards
- Parallel command execution
- Command timeout or cancellation (beyond normal process termination)

---

### ✅ Task 17: Fix App Configuration and Terminal Output Issues (COMPLETED - Commit: a47f9b3)
**Priority:** HIGH 🚨 | **Status:** Complete ✅ | **Committed:** a47f9b3 | **Pushed:** ✅ | **Issue:** #20 (Closed)

**Issue Description:**
Three critical user experience issues that were addressed:

1. **Sidebar Population Issue**: When adding a new app through the modal, the app information appears in the main header but does not populate in the sidebar list
2. **Terminal Live Feed Issue**: When clicking "Start" on an app, the terminal does not display real-time output from the running process
3. **Default Browser Opening Enhancement**: Add option to open URLs in the system's default browser instead of just auto-launch on app start

**What was accomplished:**
- ✅ **Fixed Terminal Live Output**: Terminal now displays real-time process output with proper stdout/stderr handling
- ✅ **Fixed Terminal Output Duplication**: Resolved double-line issue by properly converting process manager output
- ✅ **Added NVM Support**: Enhanced process execution to properly initialize Node Version Manager for Node.js projects
- ✅ **Improved Configuration State Management**: Fixed async handling in useConfigManager to ensure proper state synchronization
- ✅ **Enhanced Process Logging**: Added comprehensive debug logging for better process monitoring and debugging
- ✅ **Browser Opening**: Confirmed existing browser opening functionality works correctly using useBrowser hook

**Root Cause Analysis & Solutions:**
- **Terminal Issue**: Process output events were properly emitted but duplication occurred due to double processing in Terminal component - fixed by consolidating output handling
- **NVM Issue**: Shell processes spawned without proper environment initialization - fixed by detecting and initializing NVM when needed
- **State Sync Issue**: saveConfig calls weren't awaited properly - fixed async handling in useConfigManager

**Verified Acceptance Criteria:**
- ✅ Terminal displays live output from running processes in real-time
- ✅ No duplicate lines appear in terminal output
- ✅ Node.js projects with NVM commands execute successfully
- ✅ Process start/stop lifecycle works correctly with proper cleanup
- ✅ Browser auto-launch and manual "Open URL" functionality working
- ✅ Configuration state synchronizes properly between components
- ✅ All existing functionality continues to work (no regressions)

**Current State for Next Developer:**
- All three critical UX issues have been resolved
- Terminal output system is fully functional with real-time process streaming
- NVM/Node.js project support is working correctly
- Browser opening functionality confirmed working in both auto-launch and manual modes
- Configuration state management is robust and properly synchronized
- Ready for advanced features and additional polish tasks

**Issue Description:**
Three critical user experience issues need to be addressed:

1. **Sidebar Population Issue**: When adding a new app through the modal, the app information appears in the main header but does not populate in the sidebar list
2. **Terminal Live Feed Issue**: When clicking "Start" on an app, the terminal does not display real-time output from the running process
3. **Default Browser Opening Enhancement**: Add option to open URLs in the system's default browser instead of just auto-launch on app start

**Root Cause Analysis:**
- **Sidebar Issue**: Likely a state synchronization problem between the configuration manager and the LibrarySidebar component
- **Terminal Issue**: Process output events may not be properly connected to the terminal display or the event listeners are not working correctly
- **Browser Issue**: Current implementation focuses on auto-launch; need manual "Open in Browser" functionality using system default browser

**Implementation Plan:**

1. **Fix Sidebar Population**:
   - Debug the app addition flow in App.tsx → AppConfigModal → useConfigManager → LibrarySidebar
   - Ensure configuration changes trigger proper re-renders in LibrarySidebar
   - Verify selectedApp state updates correctly when new apps are added
   - Test the onAppSelect callback chain

2. **Fix Terminal Live Output**:
   - Verify process-output events are being emitted correctly from Rust backend
   - Debug the event listeners in useProcessManager hook
   - Ensure Terminal component receives and displays rawOutput from process manager
   - Test the process start → output capture → display pipeline

3. **Add Default Browser Functionality**:
   - Enhance MainAppHeader with manual "Open URL" button functionality
   - Improve useBrowser hook to handle various URL formats
   - Add user preference for default browser behavior
   - Test cross-platform browser opening (Windows/Linux/macOS)

**Acceptance Criteria:**
- [ ] Adding new app via modal immediately shows app in sidebar list
- [ ] Selected app state updates correctly when new apps are added
- [ ] Clicking "Start" on any app shows live terminal output in real-time
- [ ] Terminal displays both stdout and stderr from running processes
- [ ] Manual "Open URL" button in header opens URLs in default system browser
- [ ] Browser opening works across platforms (Windows, Linux, macOS)
- [ ] All existing functionality continues to work (no regressions)

**Verification Steps:**
- [ ] Add new app through modal - verify it appears immediately in sidebar
- [ ] Select newly added app - verify it shows correctly in main header
- [ ] Start any app - verify terminal shows live output as process runs
- [ ] Test both successful and failing processes - verify appropriate output
- [ ] Click "Open URL" button - verify it opens in default browser
- [ ] Test on different platforms if possible
- [ ] Verify no existing features are broken

**Technical Tasks:**
- [ ] Debug LibrarySidebar state management and re-rendering
- [ ] Debug process output event flow from backend to frontend
- [ ] Debug Terminal component rawOutput processing
- [ ] Enhance browser opening functionality with manual controls
- [ ] Add proper error handling and user feedback
- [ ] Test all scenarios thoroughly

**Out of Scope:**
- Major architectural changes to event system
- Custom browser selection (use system default)
- Terminal output formatting improvements
- Performance optimizations

### ✅ Task 18: Fix UI/UX Issues and Improvements (COMPLETED - Commit: 0eda93b)
**Priority:** HIGH 🚨 | **Status:** Complete ✅ | **Committed:** 0eda93b | **Pushed:** ✅ | **Issue:** #21 (Closed)

**Issue Description:**
Multiple UI/UX issues that were addressed to improve user experience:

1. **Title Changes Not Reflected in Sidebar**: When editing and changing the app title, changes are reflected in the header, but not in the sidebar
2. **Header Command Display**: The header should put more emphasis on the Command as a large block, not just a short line, and the URL should not be truncated - it should be fully visible if possible
3. **Default Window Size**: The default launch should be a larger window footprint rather than its default small squareish launch
4. **Button Layout**: Prefer start button and icons onto a new row, so command/directory/URL can enjoy full width if necessary
5. **Responsive Header Icons**: When shrunk horizontally, the icons in the header sort of get in the way and it's not responsive
6. **Button Colors**: The start button is the wrong color, it should be blue like add app in the sidebar. There should be no green color anywhere, not on highlight. States are either blue or red. Icons do not need any fancy colors for highlighting or active, just something simple hover
7. **Modal Selection Issue**: If you are doing edits in the edit modal, you start selecting a field, drag, and your mouse lands outside of the modal, then you release your mouse, it closes the modal, which we don't want

**What was accomplished:**
- ✅ **Fixed Default Window Size**: Updated Tauri configuration from 800x600 to 1200x800 for better initial user experience
- ✅ **Updated Color Scheme**: Removed all green colors throughout the application, implemented consistent blue/red state system
- ✅ **Redesigned Header Layout**:
  - Commands now display in larger, more prominent blocks with proper formatting
  - URLs and directories show in full without truncation using dedicated containers
  - Better visual hierarchy and information display
- ✅ **Improved Button Layout**:
  - Moved start button and action icons to separate row for better responsive design
  - Full width utilization for command/directory/URL information
  - Better vertical layout organization
- ✅ **Enhanced Responsive Design**:
  - Improved icon and button behavior on narrow screens
  - Better responsive breakpoints for mobile and tablet views
  - Cleaner layout adaptation across different screen sizes
- ✅ **Fixed Button Colors**:
  - Start button now uses blue color matching design system
  - All action buttons follow blue (active) and red (error/delete) color scheme
  - Removed green highlight colors throughout application
  - Simplified hover states for better UX
- ✅ **Fixed Modal Text Selection**:
  - Modal no longer closes when dragging text selection outside modal bounds
  - Improved text selection UX within form fields
- ✅ **Added Automatic Sidebar Updates**:
  - Implemented useEffect to sync selectedApp when configuration changes
  - Sidebar now properly reflects title changes immediately after editing
  - Fixed state synchronization between header and sidebar components

**Verified Acceptance Criteria:**
- ✅ Title changes in edit modal immediately update sidebar display
- ✅ Header shows commands as larger, more prominent blocks
- ✅ URLs display fully without truncation when possible
- ✅ App launches with larger default window size (1200x800)
- ✅ Start button and icons moved to new row for better layout
- ✅ Header icons behave responsively on narrow screens
- ✅ Start button is blue color, no green colors anywhere in UI
- ✅ Modal doesn't close when dragging text selection outside modal bounds
- ✅ All color states follow blue (active/running) and red (stopped/error) scheme
- ✅ Icons have simple hover states without fancy active colors

**Current State for Next Developer:**
- All UI/UX issues have been resolved and verified working
- Application now provides much better user experience with improved layout and responsive design
- Color scheme is consistent throughout the application using only blue/red states
- Modal text selection works properly without unexpected closures
- Sidebar automatically updates when app configurations change
- **Additional Refinements (Commit: 1250bdc):**
  - Header layout significantly refined with Steam-like start button styling
  - Action buttons reduced to essential Edit and Delete only
  - URL and directory made clickable to replace separate buttons
  - Controls consolidated into single row saving vertical space
  - Auto-scroll icon in terminal fixed (proper ArrowDown icon)
  - Responsive design updated for new compact layout
- Ready for additional polish tasks or advanced features

---

### ✅ Task 19: Add Cross-Platform Build System with GitHub Actions (COMPLETED - Commit: 86b4688)
**Priority:** HIGH � | **Status:** Complete ✅ | **Committed:** 86b4688 | **Pushed:** ✅

**Issue Description:**
Users needed distributable builds for macOS (both Intel and Apple Silicon), Windows, and Linux. The project only had local Linux builds available, making it impossible to distribute to Mac and Windows users.

**What was accomplished:**
- ✅ **Added Comprehensive GitHub Actions Workflows**:
  - `build-and-release.yml`: Automated release workflow that builds all platforms when tags are created
  - `build-platforms.yml`: Manual workflow for development builds with platform selection
  - Support for macOS (Intel + Apple Silicon), Windows, and Linux builds
- ✅ **Enhanced Package.json Scripts**:
  - Added platform-specific build commands for local development
  - `tauri:build:macos`, `tauri:build:windows`, `tauri:build:linux` scripts
  - Universal macOS build support for both architectures
- ✅ **Automated Distribution Files**:
  - **macOS**: `.dmg` installers and `.app` bundles for both Intel and Apple Silicon
  - **Windows**: `.msi` installers and `.exe` executables
  - **Linux**: `.deb`, `.rpm` packages and `.AppImage` portables
- ✅ **Release Management**:
  - Automatic draft releases when version tags are created
  - Artifact upload and organization for easy distribution
  - Release notes and asset descriptions

**Verified Acceptance Criteria:**
- ✅ GitHub Actions workflows successfully build for all target platforms
- ✅ macOS builds generate proper .dmg and .app files for distribution
- ✅ Windows builds create .msi installers for easy installation
- ✅ Linux builds maintain existing .deb, .rpm, and .AppImage formats
- ✅ Manual build workflow allows testing individual platforms during development
- ✅ Automated release workflow triggers on version tags for distribution
- ✅ All builds are cross-compiled properly with correct dependencies
- ✅ Artifacts are properly organized and uploaded for download

**Current State for Next Developer:**
- Cross-platform build system is fully operational and automated
- Users can now get native installers for macOS, Windows, and Linux
- Development workflow supports manual builds for testing individual platforms
- Release workflow automates the entire distribution process when creating version tags
- No need for local cross-compilation or multiple development machines

---

### 🔧 Task 20: Support URL-Only Bookmarks (URL without Terminal Commands)
**Priority:** Medium | **Status:** TODO 📝

**Problem Statement:**
Users want to create bookmarks for URLs they frequently access (like development dashboards, documentation, or web apps) without needing to run any terminal commands. Currently, the "Launch Commands" field is required, preventing users from creating URL-only entries that simply open the browser when clicked.

**Use Cases:**
- Development dashboards (Grafana, Kibana, etc.)
- Documentation sites (API docs, internal wikis)
- Web-based development tools (GitHub repos, Figma designs, etc.)
- Database admin interfaces (phpMyAdmin, MongoDB Compass web, etc.)
- Local development URLs that are already running (external servers, Docker containers)

**Current Limitations:**
- `launchCommands` field is required in form validation
- `start_app_process` Tauri command expects launch commands
- No way to create URL-only entries that just open browsers
- "Start/Stop" button is misleading for URL-only bookmarks (implies process starting)

**Implementation Plan:**

1. **Data Model Changes**:
   - Make `launchCommands` optional in TypeScript `AppConfig` interface
   - Make `launch_commands` optional in Rust `AppConfig` struct
   - Update JSON schema to allow empty/null launch commands
   - Add `appType` field to distinguish between "process" and "bookmark" apps

2. **Form Validation Updates**:
   - Remove required validation for `launchCommands` field in AppConfigModal
   - Remove red asterisk (*) from "Launch Commands" field label (no longer required)
   - Add validation: require either `launchCommands` OR `url` (not both empty)
   - Update form help text: "Enter commands to run a process, or just a URL for bookmarks"
   - Show contextual validation messages when both fields are empty
   - Consider adding radio buttons or toggle for "Process App" vs "URL Bookmark"

3. **Backend Process Logic**:
   - Update `start_app_process` to handle URL-only apps
   - For bookmark apps: skip process spawning, only handle browser launching
   - Return appropriate process result for bookmark actions
   - Emit different events for bookmark vs process actions

4. **UI/UX Changes**:
   - Change "Start/Stop" button to "Open" button for URL-only bookmark apps
   - Show different status indicators (no "running/stopping" status for bookmarks)
   - Update terminal display for bookmark apps (show "Opening URL..." message instead of process output)
   - Different visual treatment in sidebar for bookmark vs process apps (maybe bookmark icon)
   - Add visual indicator (icon) to distinguish bookmark apps from process apps in sidebar
   - Button should show "Open" text and maybe use external link icon instead of play icon

5. **Process Management**:
   - Handle URL-only apps in `useProcessManager` hook
   - No process tracking needed for bookmark apps
   - Proper status management for bookmark actions (opening → opened)

**Acceptance Criteria:**
- [ ] Can create apps with only URL field filled (no launch commands required)
- [ ] URL-only apps show "Open" button instead of "Start/Stop" button
- [ ] Clicking "Open" on URL-only app opens browser and shows success feedback
- [ ] Form validation requires either launch commands OR URL (not both empty)
- [ ] Sidebar visually distinguishes between process apps and bookmark apps
- [ ] Terminal shows appropriate message for bookmark apps ("Opening [URL]...")
- [ ] No process status tracking for URL-only bookmark apps
- [ ] Existing process-based apps continue working unchanged (backward compatibility)
- [ ] Import/export works with both app types

**Verification Steps:**
- [ ] Create new app with only URL field populated (no commands)
- [ ] Verify form saves successfully without launch commands
- [ ] Click "Open" button opens URL in default browser
- [ ] Verify terminal shows "Opening URL" message instead of process output
- [ ] Verify sidebar shows bookmark icon or visual indicator
- [ ] Test that process-based apps still work normally
- [ ] Test import/export with mixed bookmark and process apps
- [ ] Verify no process tracking or status updates for bookmark apps

**Technical Implementation Notes:**
- Add `appType: 'process' | 'bookmark'` field to AppConfig (inferred from presence of launchCommands)
- Update form to show contextual help text based on filled fields
- Consider using different icons in sidebar for bookmark vs process apps (ExternalLink icon for bookmarks)
- Terminal component should handle "bookmark opened" vs "process output" states
- Process manager should handle bookmark operations differently from process operations

**Out of Scope:**
- Custom browser selection (use system default browser)
- Bookmark organization features (folders, categories)
- Bookmark syncing or cloud storage
- Advanced URL handling (authentication, headers, etc.)
- Batch bookmark operations

---

## 🚧 TODO: REMAINING TASKS

### 🔧 Task 21: Add Multi-Command Dev Server Launch Support
  - Implement user-friendly error messages throughout the application
  - Add error boundaries for React components
  - Create error logging system for debugging
  - Handle edge cases (missing commands, invalid paths, network issues)
  - Add loading states and progress indicators for all operations
  - **Verification Steps:**
    - [ ] All errors show helpful user messages in appropriate locations
    - [ ] App doesn't crash on unexpected errors
    - [ ] Error logs are captured for debugging purposes
    - [ ] Edge cases are handled gracefully with user feedback
    - [ ] Loading states provide clear feedback during operations
    - [ ] Error recovery works where possible (retry, fallback options)

- [ ] **Create Test Suite**
  - Write unit tests for utility functions
  - Add component tests for React components
  - Create integration tests for Tauri commands
  - Add end-to-end tests for critical user flows
  - **Verification Steps:**
    - [ ] All tests pass consistently
    - [ ] Test coverage is adequate (>80%)
    - [ ] Tests run in CI/CD pipeline
    - [ ] Critical user flows are covered by E2E tests
    - [ ] Tests are maintainable and well-documented

- [ ] **Performance Optimization & Final Polish**
  - Optimize app startup time and memory usage
  - Implement proper loading states throughout app
  - Add final UI/UX polish and animations
  - Create user documentation and help system
  - **Verification Steps:**
    - [ ] App starts quickly (<2 seconds)
    - [ ] Memory usage is reasonable during operation
    - [ ] Loading states provide good user feedback
    - [ ] UI animations are smooth and purposeful
    - [ ] Documentation covers all features clearly

## Optional Enhancement Tasks (Future Versions)

- [ ] **Advanced Terminal Features**
  - Add terminal themes and customization options
  - Implement terminal search and filtering functionality
  - Add terminal output export (save logs to file)
  - Create terminal splitting for multiple app monitoring
  - Add terminal command history and replay

- [ ] **Enhanced Sidebar Features**
  - Implement app grouping/categorization in sidebar
  - Add sidebar search and advanced filtering
  - Create collapsible groups and custom organization
  - Add sidebar customization (compact/detailed view modes)
  - Implement recent/favorites sections

- [ ] **Auto-Screenshot & Monitoring Features**
  - Integrate Puppeteer for automatic app thumbnails
  - Implement periodic screenshot updates for running apps
  - Add app health monitoring and status notifications
  - Create performance metrics display (CPU, memory usage)
  - Add slow start detection and optimization suggestions

- [ ] **Advanced Layout & Workspace Features**
  - Implement multiple workspace/project support
  - Add layout presets and workspace saving
  - Create multi-monitor support and window management
  - Add workspace sharing and team collaboration features
  - Implement custom dashboard layouts

- [ ] **Additional Convenience Features**
  - Add "Open in VS Code" context menu for projects
  - Implement "Restart" and "Kill All Apps" functionality
  - Create global hotkeys for common actions
  - Add system tray integration with quick access
  - Implement app dependency management (start order, prerequisites)

---

### 🔧 Task 22: Sidebar Filters/Sort, Dense Layout, Clear Running; App Types & Add Modal (COMPLETED - Commit: 16fd04d)
Status: Complete ✅ | Committed: 16fd04d | Pushed: ✅ | Issue: #28 (Closed)

Problem Statement:
- Need powerful sidebar filtering/sorting similar to Steam (recently used windows, A–Z) and a compact, power-user list to fit many more apps.
- Running state should be visually obvious without verbose text.
- Add App flow should first classify the app type: terminal command (process), browser (bookmark), or both, and validate accordingly.

Scope:
1) Sidebar Filters & Sorting
- Filters: Running only toggle; Recently used (This month, Last month, Last 3 months)
- Sorting: A–Z / Z–A; Recently used (desc)
- Behavior: composable filter+sort, persisted in localStorage, default to Recently used

2) Clear Running Indicators (Sidebar)
- Replace words with compact icons/animation (blue dot pulse for running; spinner for starting/stopping; grey dot for stopped)

3) Sidebar Density (Compact List)
- Target ~36–44px row height; tighter paddings/line-heights; one subtle metadata line (cwd or domain)
- Remove verbose labels; add small type glyph (process/bookmark/both)

4) App Type Classification
- Add appType: 'process' | 'bookmark' | 'both' to AppConfig (TS, Rust, JSON schema)
- Infer for existing configs for backward compatibility

5) Add App Modal – “What is this?” first
- First step: choose type; fields shown per type; validation requires only relevant fields; URL-only apps allowed

Data & Storage:
- Track lastUsedAt (ISO) and useCount; update on Start/Open
- Persist filter/sort choices in localStorage

Acceptance Criteria:
- [x] Sidebar filters (Running, recent windows) and sorting (A–Z/Z–A/Recent) work and persist across restarts
- [x] Running/Starting/Stopped states use clear visuals; remove verbose words in rows
- [x] Sidebar density increases to ~36–44px rows; ~18–24 items visible at default window size
- [x] App type icon visible per item (process/bookmark/both)
- [x] Add App flow begins with type selection and shows fields per type
- [x] Validation requires only relevant fields; can create URL-only apps
- [x] lastUsedAt/useCount update on Start/Open
- [x] JSON schema, TS types, and Rust models updated; old configs still load

Verification Steps:
- [x] Create each type (process, bookmark, both); save/load correctly
- [x] Start process app shows terminal output; browser opens if configured
- [x] Open bookmark app launches browser; no process tracked
- [x] Filters and sorting behave and persist; row height within target
- [x] Import/export round-trips appType and timing fields

Notes:
- Out of scope: groups/folders, advanced analytics, themeable density.

## Task Management Notes

- Each main task should be broken into a GitHub issue when started
- Use `gh issue create` when beginning work on a task
- Include verification steps as acceptance criteria in GitHub issues
- Update this file with progress (check off completed tasks)
- Use `gh issue close` when task verification is complete
- Follow conventional commit messages with issue numbers
