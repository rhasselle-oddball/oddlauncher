# Oddbox Development Tasks

Based on the PRD, here are the development tasks organized by priority and dependency. Each task should become a GitHub issue when started.

## ✅ COMPLETED TASKS

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
- ✅ Created comprehensive JSON schema validation (oddbox-config.schema.json)
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
  - `load_config` - loads configuration from ~/.oddbox/apps.json
  - `save_config` - saves configuration with automatic timestamp updates
  - `add_app_config` - adds new app with duplicate ID validation
  - `update_app_config` - updates existing app configuration
  - `remove_app_config` - removes app by ID with validation
  - `get_config_info` - provides config directory and file information
  - `backup_config` - creates timestamped backup files
  - `restore_config` - restores configuration from backup
- ✅ Implemented robust file system operations for ~/.oddbox/ directory:
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
  - Configuration directory (~/.oddbox/) created automatically
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

**Ready for Next Task:** Create App Card Component

---

## 🚧 TODO: REMAINING TASKS

## Phase 2 - Core UI Components

- [ ] **Create App Card Component** (🚧 **STARTED - Issue #5**)
  - Design Steam-like app card with thumbnail, name, status
  - Implement Start/Stop button states (🟢 Running / 🔴 Stopped)
  - Add Edit (⚙️) and Delete (🗑️) buttons
  - Style with dark theme as per PRD requirements
  - **Verification Steps:**
    - [x] App cards display all required information
    - [x] Buttons show correct states (running/stopped)
    - [x] Dark theme styling matches Steam-like appearance
    - [x] Cards are responsive to different window sizes
    - [x] Hover/focus states work properly

- [ ] **Implement App Grid Layout**
  - Create responsive grid layout for app cards
  - Handle empty state (no apps configured)
  - Implement proper spacing and alignment
  - Add smooth animations for card interactions
  - **Verification Steps:**
    - [ ] Grid layout adapts to different window sizes
    - [ ] Empty state shows helpful message
    - [ ] Cards align properly with consistent spacing
    - [ ] Animations are smooth and performant
    - [ ] No layout shifts during interactions

- [ ] **Create App Configuration Form**
  - Build form for adding new apps (name, command, cwd, URL)
  - Add form validation and error messages
  - Implement file/folder picker for working directory
  - Create edit mode for existing app configurations
  - **Verification Steps:**
    - [ ] All form fields validate properly
    - [ ] File picker works for selecting directories
    - [ ] Form can both create new and edit existing apps
    - [ ] Error messages are clear and helpful
    - [ ] Form state resets properly after submit/cancel

## Phase 3 - Process Management

- [ ] **Implement Backend Process Spawning**
  - Create Tauri commands for starting/stopping processes
  - Implement process management with proper cleanup
  - Add process status tracking (PID, running state)
  - Handle process termination gracefully
  - **Verification Steps:**
    - [ ] Processes start correctly with specified commands
    - [ ] Process PIDs are tracked and stored
    - [ ] Stop functionality terminates processes cleanly
    - [ ] Orphaned processes are prevented
    - [ ] Error handling for failed process starts

- [ ] **Create Real-time Terminal Output Display**
  - Implement live streaming of stdout/stderr
  - Create terminal-like UI component (monospace, dark theme)
  - Add scrollback buffer and auto-scroll functionality
  - Style output with proper terminal colors/formatting
  - **Verification Steps:**
    - [ ] Terminal output appears in real-time
    - [ ] Both stdout and stderr are captured
    - [ ] Terminal styling matches real terminal appearance
    - [ ] Scrollback works with reasonable buffer limits
    - [ ] Auto-scroll can be toggled by user

- [ ] **Add Auto-Launch Browser Functionality**
  - Implement URL opening when apps start successfully
  - Add optional port polling for development servers
  - Include configurable delay for slow-starting apps
  - Handle cases where URL is not accessible
  - **Verification Steps:**
    - [ ] Browser opens automatically when app starts
    - [ ] Port polling detects when server is ready
    - [ ] Configurable delay works as expected
    - [ ] Graceful handling of inaccessible URLs
    - [ ] No browser launches for failed app starts

## Phase 4 - Advanced Features

- [ ] **Implement Thumbnail System**
  - Add file picker for custom thumbnails
  - Implement default placeholder thumbnails
  - Create thumbnail storage in local directory
  - Add thumbnail preview in app cards
  - **Verification Steps:**
    - [ ] Users can upload custom thumbnails
    - [ ] Thumbnails display correctly in app cards
    - [ ] Default placeholders show when no custom thumbnail
    - [ ] Thumbnail files are managed properly
    - [ ] Image formats are validated and supported

- [ ] **Add App Management Features**
  - Implement app deletion with confirmation
  - Add duplicate app functionality
  - Create app sorting/filtering options
  - Add keyboard shortcuts for common actions
  - **Verification Steps:**
    - [ ] App deletion requires confirmation
    - [ ] Duplicate creates exact copy with modified name
    - [ ] Sorting/filtering works as expected
    - [ ] Keyboard shortcuts are documented and functional
    - [ ] All management features work without errors

## Phase 5 - Polish & Testing

- [ ] **Add Comprehensive Error Handling**
  - Implement user-friendly error messages
  - Add error boundaries for React components
  - Create error logging system
  - Handle edge cases (missing commands, invalid paths)
  - **Verification Steps:**
    - [ ] All errors show helpful user messages
    - [ ] App doesn't crash on unexpected errors
    - [ ] Error logs are captured for debugging
    - [ ] Edge cases are handled gracefully
    - [ ] Error recovery works where possible

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

- [ ] **Auto-Screenshot Feature**
  - Integrate Puppeteer for automatic thumbnails
  - Implement periodic screenshot updates
  - Add screenshot scheduling options

- [ ] **Advanced Organization Features**
  - Implement app tagging system
  - Add folder/category organization
  - Create advanced filtering and search

- [ ] **Additional Convenience Features**
  - Add "Open in VS Code" context menu
  - Implement "Restart" functionality
  - Create "Kill All Apps" feature
  - Add slow start detection and notifications

---

## Task Management Notes

- Each main task should be broken into a GitHub issue when started
- Use `gh issue create` when beginning work on a task
- Include verification steps as acceptance criteria in GitHub issues
- Update this file with progress (check off completed tasks)
- Use `gh issue close` when task verification is complete
- Follow conventional commit messages with issue numbers
