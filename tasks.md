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

**Ready for Next Task:** Implement App Grid Layout

---

## 🚧 TODO: REMAINING TASKS

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
- AppCard component is fully functional and can be adapted for both list and grid views
- Component available at `/src/components/AppCard.tsx` with comprehensive CSS styling
- Test component available for development and debugging purposes
- SVG placeholder thumbnail system working correctly
- All TypeScript interfaces properly typed and exported
- Ready for next task: Implement Main Application Layout

- [ ] **Implement Main Application Layout (Sidebar + Main View)**
  - Create two-pane layout with resizable sidebar and main content area
  - Implement responsive behavior for different window sizes
  - Add proper CSS grid/flexbox structure for layout management
  - Handle layout state persistence (sidebar width, collapsed state)
  - **Verification Steps:**
    - [ ] Sidebar and main view render correctly side by side
    - [ ] Layout is responsive to window resizing
    - [ ] Sidebar can be resized by dragging divider
    - [ ] Layout state persists between app sessions
    - [ ] No layout shifts or visual glitches

- [ ] **Create Library Sidebar Component**
  - Build app library list in sidebar showing all configured apps
  - Implement compact list view of apps (small thumbnail, name, status indicator)
  - Add app selection functionality with active/selected state styling
  - Include "Add New App" button and search/filter functionality
  - Handle empty state (no apps configured)
  - **Verification Steps:**
    - [ ] All apps display in sidebar list with proper information
    - [ ] App selection updates main view content
    - [ ] Active app is visually highlighted in sidebar
    - [ ] Search/filter functionality works correctly
    - [ ] Empty state shows helpful message and add button
    - [ ] List scrolls properly when many apps are configured

- [ ] **Create Main App Info Header Component**
  - Display selected app details (name, description, command, working directory, URL)
  - Show large thumbnail/icon for selected app
  - Implement prominent Start/Stop button with status indicators
  - Add quick action buttons (Edit, Delete, Open URL, Open Directory)
  - Handle no app selected state
  - **Verification Steps:**
    - [ ] Selected app information displays correctly
    - [ ] Start/Stop button shows correct state and functions properly
    - [ ] Quick action buttons work as expected
    - [ ] Thumbnail displays with fallback to placeholder
    - [ ] No app selected state shows appropriate message
    - [ ] All app details update when selection changes

- [ ] **Create Terminal Output Component**
  - Build terminal-like interface for real-time process output
  - Implement live streaming of stdout/stderr with proper formatting
  - Add scrollback buffer, auto-scroll, and scroll-to-bottom functionality
  - Style with monospace font and terminal colors (dark theme)
  - Include terminal controls (clear, copy, search)
  - **Verification Steps:**
    - [ ] Terminal output appears in real-time when app is running
    - [ ] Both stdout and stderr are captured and displayed
    - [ ] Terminal styling matches real terminal appearance
    - [ ] Scrollback works with reasonable buffer limits
    - [ ] Auto-scroll can be toggled and works properly
    - [ ] Terminal controls function correctly
    - [ ] No app running state shows appropriate message

- [ ] **Create App Configuration Form/Modal**
  - Build modal form for adding new apps (name, command, cwd, URL, description)
  - Add form validation and error messages
  - Implement file/folder picker for working directory
  - Create edit mode for existing app configurations
  - Include thumbnail upload functionality
  - **Verification Steps:**
    - [ ] Modal opens and closes properly
    - [ ] All form fields validate properly
    - [ ] File picker works for selecting directories
    - [ ] Form can both create new and edit existing apps
    - [ ] Error messages are clear and helpful
    - [ ] Form state resets properly after submit/cancel
    - [ ] Thumbnail upload works with preview

## Phase 3 - Process Management & Integration

- [ ] **Implement Backend Process Spawning**
  - Create Tauri commands for starting/stopping processes
  - Implement process management with proper cleanup
  - Add process status tracking (PID, running state)
  - Handle process termination gracefully
  - Integrate with sidebar status indicators and main view updates
  - **Verification Steps:**
    - [ ] Processes start correctly with specified commands
    - [ ] Process PIDs are tracked and stored
    - [ ] Stop functionality terminates processes cleanly
    - [ ] Orphaned processes are prevented
    - [ ] Error handling for failed process starts
    - [ ] Sidebar updates show real-time process status
    - [ ] Main view header reflects current process state

- [ ] **Integrate Real-time Terminal with Process Management**
  - Connect terminal component to live process output streams
  - Implement process output buffering and streaming
  - Add terminal state management (clear on restart, persist logs)
  - Handle process lifecycle events (start, stop, error, exit)
  - **Verification Steps:**
    - [ ] Terminal shows output immediately when process starts
    - [ ] Terminal clears appropriately when starting new process
    - [ ] Process exit codes and errors display in terminal
    - [ ] Terminal handles rapid output without performance issues
    - [ ] Terminal state persists correctly during app selection changes

- [ ] **Add Auto-Launch Browser Functionality**
  - Implement URL opening when apps start successfully
  - Add optional port polling for development servers
  - Include configurable delay for slow-starting apps
  - Handle cases where URL is not accessible
  - Integrate with main view header (open URL button state)
  - **Verification Steps:**
    - [ ] Browser opens automatically when app starts (if configured)
    - [ ] Port polling detects when server is ready
    - [ ] Configurable delay works as expected
    - [ ] Graceful handling of inaccessible URLs
    - [ ] No browser launches for failed app starts
    - [ ] Open URL button in header works correctly

## Phase 4 - Advanced Features & Polish

- [ ] **Add Grid View Toggle Option**
  - Create toggle button to switch between list sidebar and grid view
  - Implement grid layout as alternative view mode
  - Adapt existing AppCard component for grid display
  - Persist view mode preference in user settings
  - **Verification Steps:**
    - [ ] View toggle button works correctly
    - [ ] Grid view displays apps in responsive grid layout
    - [ ] List view (sidebar) works as primary interface
    - [ ] View mode preference saves and restores correctly
    - [ ] Both views handle app selection and management properly

- [ ] **Enhance App Management Features**
  - Implement app deletion with confirmation modal
  - Add duplicate app functionality
  - Create app import/export for sharing configurations
  - Add drag-and-drop reordering in sidebar
  - Include keyboard shortcuts for common actions
  - **Verification Steps:**
    - [ ] App deletion requires confirmation and works properly
    - [ ] Duplicate creates exact copy with modified name
    - [ ] Import/export functionality works with JSON files
    - [ ] Drag-and-drop reordering works in sidebar
    - [ ] Keyboard shortcuts are documented and functional
    - [ ] All management features work in both list and grid views

- [ ] **Implement Enhanced Thumbnail System**
  - Integrate thumbnail display in both sidebar list and main header
  - Add file picker for custom thumbnails in configuration form
  - Create thumbnail storage and management in local directory
  - Implement thumbnail preview and editing capabilities
  - **Verification Steps:**
    - [ ] Thumbnails display correctly in sidebar and main view
    - [ ] Users can upload and manage custom thumbnails
    - [ ] Default placeholders show when no custom thumbnail
    - [ ] Thumbnail files are managed and cleaned up properly
    - [ ] Image formats are validated and properly supported

## Phase 5 - Polish & Testing

- [ ] **Add Comprehensive Error Handling & User Feedback**
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

## Task Management Notes

- Each main task should be broken into a GitHub issue when started
- Use `gh issue create` when beginning work on a task
- Include verification steps as acceptance criteria in GitHub issues
- Update this file with progress (check off completed tasks)
- Use `gh issue close` when task verification is complete
- Follow conventional commit messages with issue numbers
