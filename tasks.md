# OddLauncher Development Tasks - Sprint 2

Building on the solid foundation from Sprint 1, Sprint 2 focuses on advanced features and platform compatibility improvements.

Based on the PRD, here are the development tasks organized by priority and dependency. Each task should become a GitHub issue when started.

## Current Tasks

### Task S2-1: Add Configurable Terminal/Shell Selection for Windows
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Commit:** 7764a8b | **Issue:** #37 (Closed)

**Problem Statement:**
Users need the ability to choose which terminal/shell environment their launch commands execute in. Currently, OddLauncher uses a default shell environment, but Windows users often need to choose between Command Prompt, PowerShell, Git Bash, or WSL depending on their development tools and command requirements.

**User Need:**
Different development workflows require different shell environments:
- **Command Prompt (cmd.exe)** - Traditional Windows commands, batch scripts
- **PowerShell** - Modern Windows scripting, .NET development
- **Git Bash** - Unix-like commands, cross-platform development
- **WSL** - Full Linux environment, containerized development

**Current Limitation:**
- Users cannot specify which shell environment their launch commands should run in
- Commands may fail or behave differently than expected if run in wrong environment
- No way to configure per-app terminal preferences
- Limited visibility into which shell is being used

**Technical Solution Overview:**
1. **Add Terminal Selection UI** - Let users choose their preferred shell environment per app
2. **Add Terminal Detection System** - Auto-detect available terminals on the system
3. **Add Terminal-Specific Command Execution** - Route user's launch commands through selected terminal
4. **Add Terminal Display** - Show which terminal is being used in the UI

**Implementation Scope:**

**Phase 1: Add Terminal Detection System**
- Add `which` crate dependency for cross-platform executable detection
- Create `detect_available_terminals()` Tauri command
- Implement Windows terminal detection:
  - Command Prompt (cmd.exe) - always available
  - PowerShell (powershell.exe) - check PATH
  - Git Bash (bash.exe) - check PATH and verify it's Git Bash
  - WSL (wsl.exe) - check if available and functional
- Implement Unix terminal detection (bash, zsh, fish, sh)

**Phase 2: Add Terminal Configuration UI**
- Add `terminalType` field to AppConfig (TypeScript + Rust)
- Enhance AppConfigModal with Terminal section organization:
  - **Terminal Section** (for "Just Terminal" and "Terminal + Browser" app types):
    - Terminal Type dropdown (auto-detected options)
    - Working Directory field (existing)
    - Launch Commands textarea (existing)
  - **Browser Section** (for "Just Browser" and "Terminal + Browser" app types):
    - Destination URL/Local file (existing)
- Show terminal type in main view terminal header ("Terminal (PowerShell)", "Terminal (Git Bash)")
- Add terminal selection dropdown with auto-detected options and fallback to system default

**Data Model Changes:**
```typescript
// TypeScript
interface AppConfig {
  // ... existing fields
  terminalType?: string; // "cmd", "powershell", "gitbash", "wsl", "bash", "zsh", etc.
}

interface TerminalInfo {
  id: string;           // "cmd", "powershell", "gitbash", "wsl"
  name: string;         // "Command Prompt", "PowerShell", "Git Bash", "WSL"
  executable: string;   // "cmd.exe", "powershell.exe", "bash.exe", "wsl.exe"
  available: boolean;   // detected availability
  platform: string;    // "windows", "linux", "macos"
}
```

```rust
// Rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    // ... existing fields
    pub terminal_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TerminalInfo {
    pub id: String,
    pub name: String,
    pub executable: String,
    pub available: bool,
    pub platform: String,
}
```

**UI/UX Design:**

**AppConfigModal Enhancement:**
```
Add New App
┌─────────────────────────────────────┐
│ What is this?                       │
│ [Terminal + Browser] [Just Browser] [Just Terminal] │
└─────────────────────────────────────┘

App Name: [My Development Server]

┌─ Terminal Section (when applicable) ────┐
│ Terminal Type: [PowerShell    ▼]         │
│ Working Directory: [/path/to/project]    │
│ Launch Commands:                         │
│ ┌─────────────────────────────────────┐ │
│ │ nvm use 14.15                       │ │
│ │ yarn watch --env entry=mock-form    │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘

┌─ Browser Section (when applicable) ─────┐
│ Destination: [URL] [Local file]         │
│ [http://localhost:3001/mock-form/]      │
└─────────────────────────────────────────┘
```

**Terminal Type Dropdown Options:**
- Windows: "Command Prompt", "PowerShell", "Git Bash", "WSL" (auto-detected)
- Unix: "Bash", "Zsh", "Fish" (auto-detected)
- Default: "System Default" (when no preference set)

**Main View Terminal Header:**
- Current: "Terminal Output - Minimal Header Form"
- Enhanced: "Terminal Output (PowerShell) - Minimal Header Form"
- Shows selected terminal type for user context**Acceptance Criteria:**
- [x] Users can select terminal type in app configuration modal
- [x] Terminal header displays selected terminal type ("Terminal (PowerShell)", etc.)
- [x] User's launch commands execute in the selected terminal environment
- [x] Commands behave as expected in chosen terminal (PowerShell vs cmd.exe vs Git Bash)
- [x] Existing functionality works unchanged (backward compatibility)
- [x] Per-app terminal selection persists in configuration
- [x] Global default terminal setting available
- [x] Cross-platform support (Windows primary focus, maintain Unix functionality)
- [x] Auto-detection shows available terminals on user's system

**Verification Steps:**
- [x] Create test app with PowerShell-specific commands - verify they run correctly when PowerShell terminal selected
- [x] Create test app with cmd.exe commands - verify they run correctly when Command Prompt selected
- [x] Create test app with Unix-style commands - verify they run correctly when Git Bash/WSL selected
- [x] Test terminal selection persistence across app restarts
- [x] Verify terminal header shows correct terminal type
- [x] Test that different apps can use different terminal types
- [x] Verify Linux/macOS builds continue working with shell selection
- [x] Test import/export preserves terminal type settings
- [x] Test that user's existing launch commands work in selected terminal environment

**Implementation Summary:**
✅ **COMPLETED** - All features successfully implemented:
- Terminal detection system with auto-detection of available terminals across platforms
- Terminal type dropdown in AppConfigModal for process/both app types
- Process execution using selected terminal type via `get_terminal_command` function
- Terminal header now displays selected terminal type (e.g., "Terminal Output (PowerShell) - MyApp")
- Cross-platform support: Windows (cmd, PowerShell, PowerShell Core, Git Bash, WSL), Unix (bash, zsh, fish, sh)
- Backward compatibility maintained - existing apps default to "System Default"
- Per-app terminal configuration persists in JSON storage
- Full integration from UI to backend execution

**Commit:** 7764a8b | **Issue:** #37 (Closed) | **Status:** COMPLETED ✅

**Technical Implementation Notes:**
- Add `which = "4.4"` dependency to Cargo.toml for executable detection
- Enhance command execution logic to route user's launch commands through selected terminal
- Add terminal detection utilities with platform-specific logic
- Update JSON schema to include `terminalType` field
- Ensure backward compatibility - existing apps continue working with system default terminal

---

### Task S2-2: Fix WSL Command Execution on Windows - PATH Environment Issues
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Issue:** #38 (Closed) | **Commit:** ea51ed6

**Problem Statement:**
WSL commands on Windows are failing because they inherit the Windows PATH environment, causing WSL to try executing Windows versions of tools (like `yarn` from `/mnt/c/Users/.../AppData/Roaming/npm/yarn`) instead of the WSL Linux versions. This results in "node: not found" errors and exit code 127 failures.

**Root Cause:**
When executing WSL commands, WSL inherits the Windows PATH which includes Windows executable directories mounted at `/mnt/c/...`. When commands like `yarn` are executed, WSL finds the Windows version first in the PATH, but that version depends on Windows Node.js which isn't available in the WSL Linux environment.

**Technical Issues:**
1. WSL bash scripts inherit Windows PATH causing executable conflicts
2. Windows tools (yarn.cmd) try to call Windows Node.js from Linux environment
3. Subprocess error output not properly displayed in terminal UI
4. Error handling could be improved for process failures

**Solution Strategy:**
1. **Clean WSL Environment** - Execute WSL commands with a clean PATH that excludes Windows directories
2. **Improve Error Handling** - Better capture and display subprocess errors
3. **Enhanced Logging** - Better debugging information for WSL execution issues

**Implementation Plan:**

**Phase 1: Fix WSL PATH Environment**
- Modify WSL command execution to use clean environment
- Add explicit PATH reset in WSL scripts to exclude `/mnt/c/` directories
- Ensure WSL tools (node, npm, yarn) from Linux are used instead of Windows versions

**Phase 2: Improve Error Display**
- Enhance terminal output to capture and display subprocess stderr
- Better error messages for common WSL/PATH issues
- Add debugging information for WSL environment setup

**Phase 3: Testing & Validation**
- Test with various Node.js tools (npm, yarn, pnpm)
- Test with different WSL distributions
- Verify commands work across Windows/Linux/macOS consistently

**Acceptance Criteria:**
- [x] WSL commands execute using WSL environment tools, not Windows PATH
- [x] `yarn watch` and similar Node.js commands work in WSL
- [x] Subprocess errors are properly displayed in terminal output
- [x] Commands work consistently across Windows/WSL/Mac/Linux
- [x] Error messages are informative for debugging WSL PATH issues

**Verification Steps:**
- [x] Test Node.js apps with `yarn watch` commands in WSL - should not get "node: not found"
- [x] Test `npm start` commands in WSL - should use WSL npm, not Windows
- [x] Test various JavaScript/TypeScript build tools work correctly
- [x] Verify error output shows up in terminal for failed commands
- [x] Test that Linux and macOS functionality remains unaffected

**Implementation Summary:**
✅ **COMPLETED** - Successfully resolved WSL PATH conflicts on Windows:
- **PATH Environment Cleaning**: Modified both legacy multi-command system (`process.rs`) and new terminal selection system (`terminal.rs`) to clean Windows directories from PATH
- **Environment Isolation**: WSL commands now use isolated Linux PATH excluding `/mnt/c/` directories that cause Windows/Linux executable conflicts
- **Enhanced Error Messages**: Added informative error messages for common exit codes (127 = command not found, 126 = permission denied, etc.)
- **Comprehensive Shell Initialization**: Added proper shell environment setup including profile sourcing and version manager initialization (nvm, rbenv)
- **Debugging Support**: Added logging to show which executables are found and used for troubleshooting
- **Cross-Platform Compatibility**: Linux and macOS functionality preserved, only Windows WSL execution improved

**Technical Details:**
- Fixed core issue where WSL inherited Windows PATH causing `yarn` from `/mnt/c/Users/.../AppData/Roaming/npm/yarn` to be used instead of WSL version
- Both execution paths now apply same fix: `get_terminal_command()` for explicit terminal selection and `prepare_multi_command_execution()` for legacy behavior
- WSL commands now get clean PATH with standard Linux directories and user bin directories
- Error handling improved with contextual messages for common failure scenarios

---

### Task S2-3: Improve Terminal UX - Hide Console Windows & Show User Commands
**Priority:** MEDIUM 🔶 | **Status:** COMPLETED ✅ | **Issue:** #39 (Partial) | **Commit:** 7618a2a

**Problem Statement:**
Two UX issues with command execution:
1. **Visible Console Windows**: WSL/cmd commands spawn visible terminal windows on Windows that pop up and disappear, which is distracting
2. **Missing Command Display**: Terminal only shows command output, not the actual commands being executed, making it hard to understand what's running

**User Impact:**
- Console windows popping up disrupts workflow and looks unprofessional
- Users can't see what commands are actually being executed, making debugging difficult
- Terminal output doesn't feel like a real terminal session

**Technical Issues:**
1. **Windows Process Creation**: By default, console applications on Windows create visible windows
2. **Command Visibility**: Current implementation only pipes stdout/stderr but doesn't echo the user's commands

**Implementation Plan:**

**Phase 1: Hide Console Windows (COMPLETED ✅)**
- Add Windows-specific CREATE_NO_WINDOW flag to process creation
- Use `#[cfg(windows)]` conditional compilation for Windows-only code
- Maintain stdout/stderr capture for terminal output

**Phase 2: Show User Commands (COMPLETED ✅)**  
- Modify all terminal handlers to echo commands before executing them
- Use appropriate prompt format for each shell type:
  - WSL/Bash/Unix: `$ command`
  - PowerShell: `PS> command` 
  - Command Prompt: `> command`
- Split multi-line commands and show each one separately
- Apply to both new terminal selection system and legacy multi-command system

**Acceptance Criteria:**
- [x] No visible console windows appear when running WSL/cmd commands on Windows
- [x] Terminal output shows commands being executed (like typing them)
- [x] Commands are displayed with appropriate shell prompts
- [x] Multi-line commands are handled properly
- [x] All terminal types (WSL, cmd, PowerShell, bash, etc.) show commands
- [x] Process management (start/stop) continues to work normally
- [x] Terminal output capture still functions correctly
- [x] Stop button doesn't show visible console windows

**Verification Steps:**
- [x] Test that WSL commands don't show visible windows on Windows
- [x] Verify commands appear in terminal output with proper prompts
- [x] Test multi-line commands are displayed correctly
- [x] Verify all terminal types show commands appropriately
- [x] Confirm process management still works (start/stop buttons)
- [x] Check that command output still appears after command display
- [x] Test that Stop button doesn't spawn visible taskkill/tasklist windows

---

## Sprint 1 Incomplete Tasks

### Task: Support Optional Custom Stop Terminal Command(s) Per App
**Priority:** Medium | **Status:** TODO 📝

Some apps require a specific stop/teardown command (e.g., Docker), not just Ctrl+C. Allow user to define one or more custom stop commands for each app. If not set, default to Ctrl+C.

**Verification:**
- [ ] User can add/edit/remove stop command(s) in app config
- [ ] If stop command is set, it is used when stopping the app
- [ ] If not set, Ctrl+C is sent as before
- [ ] Works for both single and multiple stop commands
- [ ] UI/UX is clear and error handling is robust

---

### Task 16: Add Multi-Command Dev Server Launch Support
**Priority:** Medium | **Status:** TODO 📝

**Problem Statement:**
Currently OddLauncher only supports single-line commands in the "Command" field. Many dev servers require multiple commands to be executed in sequence (e.g., setting Node version, then running the dev server). Users need the ability to specify multi-line command sequences that OddLauncher will execute automatically.

**IMPORTANT CLARIFICATION:**
- **This is NOT about setup instructions or documentation**
- **This IS about the actual commands OddLauncher will execute to run the dev server**
- **Users should NEVER touch a terminal after initial configuration**
- **OddLauncher executes ALL commands automatically when user clicks "Start"**

**Example Use Cases:**
```
Launch Commands for React project:
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
**Phase 3: Implement Terminal-Specific Command Execution**
- Modify command preparation logic to route user's launch commands through selected terminal
- Route commands through appropriate shell:
  - cmd.exe: `cmd.exe /c "user's launch commands"`
  - PowerShell: `powershell.exe -Command "user's launch commands"`
  - Git Bash: `bash.exe -c "user's launch commands"`
  - WSL: `wsl.exe bash -c "user's launch commands"`
- Unix systems: route through selected shell (bash, zsh, etc.)

**Phase 4: Add Terminal Display & UX**
- Terminal header shows selected terminal type
- Visual indication of which environment commands are running in
- Help users understand terminal selection impact

**Acceptance Criteria:**
- [ ] AppConfigModal has multi-line textarea for launch commands instead of single command input
- [ ] Multiple commands execute sequentially when starting app
- [ ] Each command's output streams to terminal in real-time
- [ ] Command execution stops on first failure with clear error message
- [ ] Single-line commands still work (backwards compatibility)
- [ ] Existing app configurations migrate automatically
- [ ] Multi-line commands save/load correctly
- [ ] Terminal shows output from all executed commands

---

### Task 20: Support URL-Only Bookmarks (URL without Terminal Commands)
**Priority:** Medium | **Status:** TODO 📝

**Problem Statement:**
Users want to create bookmarks for URLs they frequently access (like development dashboards, documentation, or web apps) without needing to run any terminal commands. Currently, the "Launch Commands" field is required, preventing users from creating URL-only entries that simply open the browser when clicked.

**Use Cases:**
- Development dashboards (Grafana, Kibana, etc.)
- Documentation sites (API docs, internal wikis)
- Web-based development tools (GitHub repos, Figma designs, etc.)
- Database admin interfaces (phpMyAdmin, MongoDB Compass web, etc.)
- Local development URLs that are already running (external servers, Docker containers)

**Implementation Plan:**

1. **Data Model Changes**:
   - Make `launchCommands` optional in TypeScript `AppConfig` interface
   - Make `launch_commands` optional in Rust `AppConfig` struct
   - Update JSON schema to allow empty/null launch commands
   - Add `appType` field to distinguish between "process" and "bookmark" apps

2. **UI/UX Changes**:
   - Change "Start/Stop" button to "Open" button for URL-only bookmark apps
   - Show different status indicators (no "running/stopping" status for bookmarks)
   - Update terminal display for bookmark apps (show "Opening URL..." message instead of process output)
   - Different visual treatment in sidebar for bookmark vs process apps (maybe bookmark icon)

**Acceptance Criteria:**
- [ ] Can create apps with only URL field filled (no launch commands required)
- [ ] URL-only apps show "Open" button instead of "Start/Stop" button
- [ ] Clicking "Open" on URL-only app opens browser and shows success feedback
- [ ] Form validation requires either launch commands OR URL (not both empty)
- [ ] Sidebar visually distinguishes between process apps and bookmark apps
- [ ] Terminal shows appropriate message for bookmark apps ("Opening [URL]...")
- [ ] No process status tracking for URL-only bookmark apps
- [ ] Existing process-based apps continue working unchanged (backward compatibility)
- [ ] Import/export works with both app t
---

## Task Management Workflow

**Sprint 2 Workflow:**
- Create GitHub issues for each task using `gh issue create`
- Work directly on main branch (no PRs unless requested)
- Commit with conventional messages including issue numbers
- Update this file with progress and completion status
- Close issues when verification is complete

**Task Lifecycle:**
1. **Task Creation**: Create tasks in this file based on requirements
2. **Issue Creation**: When starting a task, create a GitHub issue using `gh issue create`
3. **Development**: Work on the task following the verification steps
4. **Completion**: When task is complete:
   - Commit all changes with conventional commit message including "Closes #<issue-number>"
   - Push code to repository with `git push`
   - Verify issue is automatically closed (or close manually if needed)
   - Update this file to mark task as completed with commit hash and status

**GitHub Integration Commands:**
```bash
# Create issue when starting a task
gh issue create --title 'Task Title' --body 'Task description with acceptance criteria'

# Commit and push with issue closure (preferred method)
git commit -m 'feat: implement feature

Closes #<issue-number>'
git push

# Close issue manually if auto-close didn't work
gh issue close <issue-number> --comment 'Task completed and code deployed'

# Check current issues (ALWAYS use GH_PAGER=cat to prevent user intervention)
GH_PAGER=cat gh issue list
GH_PAGER=cat gh issue list --state=open
GH_PAGER=cat gh issue list --state=closed
```

**IMPORTANT**: Always use `GH_PAGER=cat` with GitHub CLI commands to prevent pager/vim from opening and requiring user intervention.

**Sprint 1 Accomplishments:** ✅
- Complete core application architecture and functionality
- Cross-platform build system with GitHub Actions
- Real-time process management and terminal output
- Comprehensive UI with sidebar, main content, and modals
- App management features (CRUD, import/export, drag-drop)
- Browser auto-launch integration
- Enhanced UX with filters, sorting, and responsive design

**Sprint 2 Focus Areas:**
1. **Platform Compatibility** - Ensure Windows support matches Unix functionality
2. **Advanced Terminal Features** - Enhanced terminal selection and shell integration
3. **Power User Features** - Keyboard shortcuts, workflow optimizations
4. **Polish & Reliability** - Error handling, performance, user experience refinements
