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

**UI Architecture Decision:** The application will use a **sidebar + main view layout** as the primary and only interface. This provides the best user experience with a compact app list in the sidebar and detailed information/terminal output in the main content area. No grid view or alternative layouts will be implemented.

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

### Task 6.1: Create Compact App List Item Component for Sidebar
- [ ] **Replace AppCard usage in LibrarySidebar with proper sidebar list items**
  - Create `AppListItem` component optimized for sidebar display
  - Design compact layout: small thumbnail (32-40px), app name, status indicator
  - Height around 60-80px for proper sidebar proportions
  - Full width design that fits sidebar layout patterns
  - Maintain same functionality as AppCard (selection, status display, click handling)
  - Replace AppCard usage in LibrarySidebar component
  - Keep AppCard component for future grid/detail views
  - **Verification Steps:**
    - [ ] AppListItem component renders with compact, sidebar-appropriate design
    - [ ] Small thumbnail displays correctly with fallback to placeholder
    - [ ] App name and status information clearly visible
    - [ ] List items have proper height (~60-80px) and full width
    - [ ] Selection highlighting works with new component
    - [ ] Click handling maintains app selection functionality
    - [ ] Component follows sidebar UI patterns (not grid card patterns)
    - [ ] Responsive design works across different sidebar widths

### Task 7: Create Functional Main App Info Header Component
- [ ] **Replace PlaceholderMainContent with Functional Main App Info Header Component**
  - Connect to existing configuration system using `useConfigManager` hook
  - Display real apps from configuration with proper app data
  - Implement app selection functionality that updates shared state
  - Add functional search/filter capability for app names and commands
  - Include working "Add New App" button (opens configuration modal when ready)
  - Handle empty state properly (no apps configured yet)
  - Reuse existing AppCard component for consistent styling in compact list format
  - **Verification Steps:**
    - [ ] Real apps from configuration display in sidebar list with correct information
    - [ ] App selection updates global app state and triggers main view updates
    - [ ] Selected app is visually highlighted in sidebar with active state
    - [ ] Search/filter functionality filters visible apps correctly
    - [ ] Empty state shows helpful message and functional add button
    - [ ] List scrolls properly when many apps are configured
    - [ ] Component integrates seamlessly with existing AppLayout structure
    - [ ] Loading and error states are handled properly

### Task 7: Create Functional Main App Info Header Component
- [ ] **Replace PlaceholderMainContent with Functional Main App Info Header Component**
  - Connect to shared app selection state to display selected app details
  - Show real app information (name, description, command, working directory, URL)
  - Display app thumbnail with fallback to existing placeholder system
  - Implement functional Start/Stop button (placeholder for now, real functionality in Phase 3)
  - Add quick action buttons (Edit, Delete, Open URL, Open Directory) as placeholders
  - Handle no app selected state with helpful message
  - Maintain existing terminal output section as placeholder for now
  - **Verification Steps:**
    - [ ] Selected app information displays correctly from real configuration data
    - [ ] App details update immediately when selection changes in sidebar
    - [ ] Thumbnail displays properly with fallback to placeholder
    - [ ] Start/Stop button shows correct visual state (functional implementation comes later)
    - [ ] Quick action buttons are present and styled (functionality comes later)
    - [ ] No app selected state shows appropriate message and guidance
    - [ ] Component updates reactively when app configurations change
    - [ ] All app details render correctly (name, command, directory, URL, etc.)

### Task 8: Create App Configuration Form/Modal Component
- [ ] **Create Modal Form for Adding and Editing Apps**
  - Build modal component for app configuration (name, command, workingDirectory, URL, description)
  - Add comprehensive form validation and user-friendly error messages
  - Implement file/folder picker for working directory selection
  - Support both "Add New App" and "Edit Existing App" modes
  - Include thumbnail upload functionality (basic file picker for now)
  - Integrate with existing configuration system using available hooks
  - **Verification Steps:**
    - [ ] Modal opens and closes properly with smooth animations
    - [ ] All form fields validate input properly with helpful error messages
    - [ ] File picker works for selecting working directories
    - [ ] Form can create new apps and edit existing app configurations
    - [ ] Form state resets properly after successful submit or cancel
    - [ ] Apps are saved to configuration and appear immediately in sidebar
    - [ ] Edit mode pre-populates form with existing app data
    - [ ] Thumbnail upload allows basic image file selection

### Task 9: Create Functional Terminal Output Component
- [ ] **Build Real Terminal Interface Component (Static Version)**
  - Replace terminal section in main view with functional terminal component
  - Implement terminal-like interface with proper styling (monospace, dark theme)
  - Add scrollback buffer and auto-scroll functionality
  - Style with terminal colors and formatting for readability
  - Include terminal controls (clear, copy, search) as placeholders
  - Handle no app selected state appropriately
  - **Note:** Real-time process output integration comes in Phase 3
  - **Verification Steps:**
    - [ ] Terminal component renders with proper terminal styling and appearance
    - [ ] Terminal can display static text content with proper formatting
    - [ ] Scrollback buffer works with reasonable limits
    - [ ] Auto-scroll functionality can be toggled on/off
    - [ ] Terminal controls are present and styled (functionality added later)
    - [ ] No app selected state shows appropriate message
    - [ ] Component is ready for real-time process output integration

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
    - [ ] All management features work correctly in the sidebar

- [ ] **Implement Enhanced Thumbnail System**
  - Integrate thumbnail display in sidebar list and main app header
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
