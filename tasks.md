# OddLauncher Development Tasks - Sprint: Terminal Environment & UI Enhancements

**Current Branch:** `feature/terminal-environment-ui-enhancements`
**Base Branch:** `main` 
**Working on Issues:** #50, #51, #52

Building on Sprint 2 completion, this sprint focuses on making terminals work like real terminals with proper environment sourcing and adding a modern activity bar UI.

**Sprint Goal:** Fix terminal environment issues (rbenv, command not found) and add settings UI with activity bar.

**SPRINT STATUS: COMPLETED ✅**

All 5 tasks in this sprint have been successfully completed:
- ✅ TE-1: Activity Bar Implementation (a1a7e45)
- ✅ TE-2: Settings Modal with Terminal Configuration (ed44575) 
- ✅ TE-3: Shell Environment Sourcing (db2f923)
- ✅ TE-4: Per-Launcher Terminal Environment Overrides (8b351b2)
- ✅ TE-5: Terminal Text Selection and Copy Functionality (1e330bc)

Based on the PRD, here are the development tasks organized by priority and dependency. Each task should become a GitHub issue when started.

## Current Sprint Tasks

### Task TE-1: Implement Activity Bar - Far Left Sidebar with Library and Settings
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Issue:** #50 (Closed) | **Commit:** a1a7e45

**Problem Statement:**
Current layout has Library as the main sidebar, but we need a more scalable design for future features like library groups, workspaces, and easy access to settings. Need to implement a VS Code-style activity bar on the far left.

**User Need:**
- Easy access to global settings without cluttering main workspace
- Future-proof design for multiple library groups/workspaces
- Settings always accessible regardless of selected launcher
- Clean separation between navigation and content

**Current Layout:**
```
┌─────────────────────────────────────┐
│ Library              Main Content   │
│ Search...            Area           │
│ App 1                               │
│ App 2                               │
└─────────────────────────────────────┘
```

**Target Layout:**
```
┌─┬─────────────────────────────────────┐
│📚│ Library              Main Content   │
│ │ Search...            Area           │
│ │ App 1                               │
│ │ App 2                               │
│ │                                     │
│ │                                     │
│⚙️│                                     │
└─┴─────────────────────────────────────┘
```

**Technical Implementation:**

**Phase 1: Create ActivityBar Component**
- Create new `ActivityBar` component with vertical icon layout
- Add Library icon (current default view)
- Add Settings icon at bottom
- Implement active state styling
- Handle icon click navigation

**Phase 2: Restructure AppLayout**
- Modify `AppLayout` to include three sections: ActivityBar, CurrentView, MainContent
- Update CSS grid/flexbox layout for new structure
- Ensure resizing behavior works with activity bar
- Add narrow fixed-width activity bar (48px)

**Phase 3: Add View Management**
- Create view management state (Library, Settings)
- Connect activity bar icons to view switching
- Ensure Library remains default view
- Add smooth transitions between views

**Data Model Changes:**
```typescript
interface AppLayoutState {
  activeView: 'library' | 'settings'
  sidebarWidth: number
  isCollapsed: boolean
}
```

**Component Structure:**
```
AppLayout
├── ActivityBar (48px fixed width)
│   ├── LibraryIcon (active by default)
│   └── SettingsIcon (bottom)
├── CurrentView (resizable)
│   ├── LibrarySidebar (when library active)
│   └── SettingsPanel (when settings active)
└── MainContent
```

**UI/UX Design:**
- **Activity Bar**: 48px wide, dark background, icons centered vertically
- **Library Icon**: Book/folder icon, active by default
- **Settings Icon**: Gear icon, positioned at bottom
- **Active State**: Highlight active icon with accent color
- **Hover State**: Subtle hover feedback on icons
- **Responsive**: Activity bar always visible, current view collapsible

**Acceptance Criteria:**
- [ ] Activity bar component implemented with library and settings icons
- [ ] Clicking library icon shows current library sidebar
- [ ] Clicking settings icon shows settings panel (placeholder for now)
- [ ] Layout restructured to accommodate activity bar
- [ ] Resizing behavior works with new layout
- [ ] Active view state persists across app restarts
- [ ] Hover and active states work correctly
- [ ] No layout shift or flickering during view changes
- [ ] Existing functionality remains unchanged

**Verification Steps:**
- [ ] Activity bar appears on far left with proper styling
- [ ] Library icon is active by default and shows current sidebar
- [ ] Settings icon shows placeholder settings panel
- [ ] Icon states (hover, active) work correctly
- [ ] Layout resizing works with activity bar
- [ ] All existing library functionality works unchanged
- [ ] No console errors or TypeScript errors
- [ ] Layout is responsive and handles window resizing

---

### Task TE-2: Create Settings Modal with Terminal Configuration Section
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Issue:** #51 (Closed) | **Commit:** ed44575

**Problem Statement:**
Need a comprehensive settings system for global configuration, particularly for terminal environment settings that will fix the rbenv/command not found issues. Settings should be accessible via the activity bar.

**User Need:**
- Configure default shell and source files globally
- Override terminal settings per launcher when needed
- Fix command not found issues by properly sourcing shell environment
- Easy access to all global application settings

**Settings Structure:**

**Global Settings Modal:**
```
┌─ Settings ──────────────────────────────┐
│ 📁 General    🖥️ Terminal               │
│                                         │
│ ┌─ Default Terminal Settings ─────────┐ │
│ │ Shell: [zsh ▼]                      │ │
│ │ ☑ Use Login Shell                   │ │
│ │ ☑ Inherit Current Environment       │ │
│ │                                     │ │
│ │ Default Source Files:               │ │
│ │ • ~/.zshrc                    [×]   │ │
│ │ • ~/.profile                  [×]   │ │
│ │ • [+ Add Source File]               │ │
│ │                                     │ │
│ │ Default Environment Variables:      │ │
│ │ • NODE_ENV=development        [×]   │ │
│ │ • [+ Add Variable]                  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Reset to Defaults] [Apply] [Cancel]    │
└─────────────────────────────────────────┘
```

**Technical Implementation:**

**Phase 1: Extend GlobalConfig Type**
```typescript
interface GlobalConfig {
  settings: {
    // ... existing settings
    terminal: {
      defaultShell: string                    // 'zsh', 'bash', 'fish', etc.
      useLoginShell: boolean                  // Use -l flag
      inheritEnvironment: boolean             // Include current process env
      defaultSourceFiles: string[]            // ['~/.zshrc', '~/.profile']
      defaultEnvironmentVariables: Record<string, string>
    }
  }
}
```

**Phase 2: Create Settings Components**
- `SettingsModal` - Main modal container with tab navigation
- `GeneralSettingsTab` - General app settings (existing)
- `TerminalSettingsTab` - Terminal configuration interface
- `SourceFileManager` - Add/remove source files
- `EnvironmentVariableManager` - Add/remove environment variables

**Phase 3: Auto-Detection & Smart Defaults**
- Detect user's default shell from `$SHELL` environment variable
- Auto-detect common source files based on shell type:
  - zsh: `~/.zshrc`, `~/.zprofile`
  - bash: `~/.bashrc`, `~/.bash_profile`, `~/.profile`
  - fish: `~/.config/fish/config.fish`
- Scan for common project source files when creating launchers

**Phase 4: Settings Persistence**
- Save terminal settings to global config
- Load settings on app startup
- Apply settings to new launcher creation
- Validate source file paths exist

**Acceptance Criteria:**
- [ ] Settings modal accessible via activity bar settings icon
- [ ] Terminal tab shows all configuration options
- [ ] Shell auto-detection works correctly
- [ ] Source file management (add/remove) functional
- [ ] Environment variable management functional
- [ ] Settings persist across app restarts
- [ ] Smart defaults based on user's shell
- [ ] Validation for source file paths
- [ ] Reset to defaults functionality

**Verification Steps:**
- [ ] Settings modal opens from activity bar settings icon
- [ ] Terminal tab shows current shell and detected source files
- [ ] Can add/remove source files and environment variables
- [ ] Settings save and load correctly
- [ ] Default detection works for different shells
- [ ] Reset to defaults restores smart defaults
- [ ] No console errors during settings operations

---

### Task TE-3: Implement Shell Environment Sourcing in Command Execution
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Issue:** #52 (Closed) | **Commit:** db2f923

**Problem Statement:**
Commands fail with "command not found" errors (like rbenv) because spawned processes don't get the full shell environment that includes PATH modifications from source files like ~/.zshrc.

**Root Cause:**
When OddLauncher spawns processes, they get a bare environment without:
- Shell configuration files (~/.*rc, ~/.profile)
- PATH modifications from tools (rbenv, nvm, pyenv)
- Environment variables set by development tools
- Shell functions and aliases

**Technical Solution:**

**Phase 1: Modify Rust Command Execution**
Update command execution in `src-tauri/src/commands/` to source shell files:

```rust
// Instead of: Command::new("bundle").args(["exec", "rails", "s"])
// Use: Command::new("zsh").args(["-l", "-c", "source ~/.zshrc && bundle exec rails s"])

fn build_sourced_command(
    user_command: &str,
    config: &TerminalConfig,
    working_dir: &Path
) -> Command {
    let shell = &config.default_shell;
    let source_files = &config.default_source_files;
    
    let full_command = if config.use_login_shell {
        format!(
            "cd {} && {} && {}",
            working_dir.display(),
            source_files.iter()
                .map(|f| format!("source {}", f))
                .collect::<Vec<_>>()
                .join(" && "),
            user_command
        )
    } else {
        user_command.to_string()
    };
    
    let mut cmd = Command::new(shell);
    if config.use_login_shell {
        cmd.args(["-l", "-c", &full_command]);
    } else {
        cmd.args(["-c", &full_command]);
    }
    
    // Add environment variables
    for (key, value) in &config.default_environment_variables {
        cmd.env(key, value);
    }
    
    cmd
}
```

**Phase 2: Update Process Management**
- Modify `start_app_process` command to use sourced execution
- Apply to both existing process system and terminal selection system
- Ensure all command execution paths use environment sourcing
- Handle errors when source files don't exist

**Phase 3: Platform-Specific Implementation**
- Linux/macOS: Use shell with -c/-l flags
- Windows: Handle cmd.exe, PowerShell, WSL differently
- Windows WSL: Clean PATH to avoid Windows/Linux conflicts (existing fix)

**Phase 4: Integration with Settings**
- Read terminal settings from global config
- Apply user-configured shell and source files
- Use per-launcher overrides when specified
- Fallback to system defaults if settings not configured

**Acceptance Criteria:**
- [ ] Commands execute in properly sourced shell environment
- [ ] rbenv, nvm, pyenv and other tools work correctly
- [ ] Source files are loaded before command execution
- [ ] Environment variables are properly set
- [ ] Works across all supported platforms
- [ ] Per-launcher terminal overrides work
- [ ] Error handling for missing source files
- [ ] No regression in existing functionality

**Verification Steps:**
- [ ] Test rbenv commands work without "command not found" errors
- [ ] Test nvm/node commands work correctly
- [ ] Test environment variables are accessible in commands
- [ ] Test with different shells (bash, zsh, fish)
- [ ] Test per-launcher source file overrides
- [ ] Verify Windows WSL continues working
- [ ] Test command execution on macOS and Linux
- [ ] Ensure stop functionality still works correctly

---

### Task TE-4: Add Per-Launcher Terminal Environment Overrides
**Priority:** MEDIUM 🔶 | **Status:** COMPLETED ✅ | **Issue:** TBD | **Commit:** 8b351b2

**Problem Statement:**
While global terminal settings solve most issues, some launchers need project-specific environment setup (like .env files, project setup scripts, or specific environment variables).

**User Need:**
- Load project-specific .env files
- Run project setup scripts before main commands
- Override environment variables per project
- Use different shell for specific projects

**Technical Implementation:**

**Phase 1: Extend AppConfig Type ✅ DONE**
```typescript
interface AppConfig {
  // ... existing fields
  terminal?: {
    shell?: string                           // Override global shell
    useLoginShell?: boolean                  // Override global login shell
    additionalSourceFiles?: string[]         // Project-specific files to source
    environmentVariables?: Record<string, string>  // Project env vars
    inheritGlobalSettings?: boolean          // Default: true
  }
}
```

**Phase 2: Update App Configuration Modal**
Add collapsible "Advanced Terminal Settings" section:

```
┌─ Terminal Section ──────────────────────┐
│ Terminal Type: [zsh ▼]                  │
│ Working Directory: [/path/to/project]   │
│ Launch Commands: [...]                  │
│                                         │
│ ▼ Advanced Terminal Settings            │
│ ┌─────────────────────────────────────┐ │
│ │ ☐ Override Global Settings          │ │
│ │                                     │ │
│ │ Shell: [Use Global ▼]               │ │
│ │ ☐ Use Login Shell                   │ │
│ │                                     │ │
│ │ Additional Source Files:            │ │
│ │ • ./.env                      [×]   │ │
│ │ • ./scripts/setup.sh          [×]   │ │
│ │ • [+ Add File]                      │ │
│ │                                     │ │
│ │ Environment Variables:              │ │
│ │ • RAILS_ENV=development       [×]   │ │
│ │ • PORT=3000                   [×]   │ │
│ │ • [+ Add Variable]                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Phase 3: Merge Settings in Command Execution**
```rust
fn get_effective_terminal_config(
    global_config: &GlobalTerminalConfig,
    app_terminal_config: &Option<AppTerminalConfig>
) -> EffectiveTerminalConfig {
    let mut config = global_config.clone();
    
    if let Some(app_config) = app_terminal_config {
        if app_config.inherit_global_settings.unwrap_or(true) {
            // Merge with global settings
            if let Some(shell) = &app_config.shell {
                config.shell = shell.clone();
            }
            config.source_files.extend(app_config.additional_source_files.clone());
            config.environment_variables.extend(app_config.environment_variables.clone());
        } else {
            // Use only app-specific settings
            config = EffectiveTerminalConfig::from(app_config);
        }
    }
    
    config
}
```

**Phase 4: Smart Project Detection**
- Auto-detect .env files in project directory
- Suggest common setup scripts (package.json scripts, Makefile targets)
- Auto-detect language-specific files (.nvmrc, .ruby-version, pyproject.toml)

**Acceptance Criteria:**
- [ ] Advanced terminal settings section in app config modal
- [ ] Per-launcher terminal overrides work correctly
- [ ] Settings merge properly (global + app-specific)
- [ ] Additional source files are loaded before commands
- [ ] Environment variables are properly set per launcher
- [ ] Auto-detection suggests relevant project files
- [ ] Override toggle works correctly
- [ ] Settings persist in app configuration

**Verification Steps:**
- [ ] Create launcher with .env file - verify variables are available
- [ ] Test per-launcher shell override
- [ ] Test additional source files are loaded
- [ ] Test environment variable overrides
- [ ] Verify global settings still apply when not overridden
- [ ] Test auto-detection of project files
- [ ] Ensure export/import preserves terminal settings

---

### Task TE-5: Enable Terminal Text Selection and Copy Functionality
**Priority:** MEDIUM 🔶 | **Status:** COMPLETED ✅ | **Issue:** TBD | **Commit:** 1e330bc

**Problem Statement:**
Terminal output currently doesn't allow text selection, making it impossible to copy error messages, URLs, or other important information from the terminal output.

**User Need:**
- Select text in terminal output like a real terminal
- Copy selected text to clipboard
- Standard keyboard shortcuts (Ctrl+C for copy)
- Mouse selection with click and drag

**Current Limitation:**
Terminal output is likely using CSS that disables text selection (`user-select: none`) or the component doesn't support selection.

**Technical Implementation:**

**Phase 1: Enable Text Selection in Terminal Component ✅ DONE**
- Review Terminal component CSS and remove `user-select: none`
- Ensure terminal output elements allow text selection
- Test text selection works with mouse drag

**Phase 2: Add Copy Functionality ✅ DONE**
- Add copy button to terminal header
- Implement copy selected text functionality
- Add keyboard shortcut (Ctrl+C when text is selected)
- Add context menu with copy option

**Phase 3: Enhanced Selection Features ✅ DONE**
- Select all functionality (Ctrl+A)
- Double-click to select word
- Triple-click to select line
- Clear selection when new output arrives (optional)

**Terminal Header Update:**
```
┌─ Terminal Output (zsh) - MyApp ─── [📋] [🗑️] [🔍] ┐
│ $ rbenv install 3.0.0                              │
│ Installing ruby-3.0.0...                          │
│ Success! Ruby 3.0.0 installed                     │ ← Selectable text
│ $ bundle exec rails server                        │
└────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Text selection works in terminal output
- [ ] Copy button in terminal header works
- [ ] Keyboard shortcuts work (Ctrl+C, Ctrl+A)
- [ ] Mouse selection with click and drag
- [ ] Context menu with copy option
- [ ] Selected text copies to system clipboard
- [ ] Selection works across multiple lines
- [ ] No interference with existing terminal functionality

**Verification Steps:**
- [ ] Click and drag to select text in terminal
- [ ] Copy button copies selected text
- [ ] Ctrl+C copies selected text (when text is selected)
- [ ] Ctrl+A selects all terminal text
- [ ] Right-click shows context menu with copy option
- [ ] Double-click selects word, triple-click selects line
- [ ] Copied text can be pasted in other applications
- [ ] Terminal scrolling and output streaming still work

---
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

### Task S2-4: UI Improvements and App-to-Launcher Terminology Refactor
**Priority:** HIGH 🚨 | **Status:** COMPLETED ✅ | **Commit:** 91468f7 | **Issue:** #49 (Closed)

**Problem Statement:**
Several UI inconsistencies and nomenclature issues need to be addressed to improve user experience and align with the vision of calling items "launchers" instead of "apps".

**Current Issues:**

1. **Search Bar Layout Issue**: When no apps are present, the recent/alpha sort button wraps to the next line instead of staying inline with the search bar
2. **Icon Readability**: The down A-Z sort icon is hard to read due to stroke width and styling
3. **Delete Modal Irrelevant Sections**: Delete confirmation shows all fields (including command sections for browser-only items and URL sections for terminal-only items)
4. **Inconsistent Terminology**: UI still refers to "apps" instead of "launchers" throughout
5. **App Config Modal Flow**: The modal could have better UX flow with launcher type selection upfront

**Technical Requirements:**

**Phase 1: Fix Search Bar Layout**
- Ensure search bar and sort button stay on same line even with no apps
- Investigate CSS flexbox/grid layout in LibrarySidebar component
- Test with empty state and populated state

**Phase 2: Improve Sort Icon Readability**
- Change stroke-width to 1 for the down A-Z icon
- Remove stroke-linecap and stroke-linejoin properties
- Ensure icon remains visible in dark theme

**Phase 3: Smart Delete Modal**
- Only show relevant sections in delete confirmation:
  - For "Just Browser": Hide Command and Directory sections
  - For "Just Terminal": Hide URL section
  - For "Terminal + Browser": Show all sections
- Update ConfirmationModal component logic

**Phase 4: Terminology Refactor (App → Launcher)**
- Update all user-facing text from "app" to "launcher"
- Change button text: "Add Your First App" → "Add Your First Launcher"
- Update modal titles: "Add New App" → "Add New Launcher", "Delete App" → "Delete Launcher"
- Update search placeholder: "Search apps..." → "Search launchers..."
- Update empty state: "No Apps Yet" → "No Launchers Yet"
- Update all component prop names and internal references for consistency

**Phase 5: Improve App Config Modal Flow**
- Move launcher name field to be first in the modal
- Change "What is this?" to "What kind of launcher is this?"
- Start with no selection (empty state) instead of defaulting to "Terminal + Browser"
- Options: "Terminal + Browser", "Just Browser", "Just Terminal"
- Only show relevant fields after type selection:
  - Terminal sections only appear for Terminal and Terminal + Browser
  - Browser sections only appear for Browser and Terminal + Browser

**Files to Update:**

**Components:**
- `LibrarySidebar/LibrarySidebar.tsx` - Search bar layout and terminology
- `LibrarySidebar/LibrarySidebar.css` - Search bar flexbox styling
- `ConfirmationModal/ConfirmationModal.tsx` - Smart section display
- `AppConfigModal/AppConfigModal.tsx` - Flow improvements and terminology
- `MainContent/MainContent.tsx` - Empty state terminology
- `AppCard.tsx` - Any app terminology in tooltips/labels

**Icons/Styling:**
- Update sort icon SVG properties (stroke-width, remove cap/join)
- Review all icon usage for consistency

**Types/Interfaces:**
- Update TypeScript comments and documentation
- Consider renaming interfaces (AppConfig → LauncherConfig in future task)

**Acceptance Criteria:**
- [ ] Search bar and sort button stay inline when no launchers exist
- [ ] Sort icon (down A-Z) is more readable with thinner stroke and no caps
- [ ] Delete modal only shows relevant sections based on launcher type
- [ ] All user-facing text uses "launcher" terminology instead of "app"
- [ ] App Config modal starts with no launcher type selected
- [ ] Launcher name field appears first in the modal
- [ ] Only relevant config sections show after launcher type selection
- [ ] All existing functionality continues to work normally
- [ ] UI remains consistent with dark theme design
- [ ] No console errors or TypeScript errors

**Verification Steps:**
- [ ] Test search bar layout with empty state and with launchers
- [ ] Verify sort icon visibility and readability in dark theme
- [ ] Test delete modal with each launcher type (Terminal, Browser, Terminal + Browser)
- [ ] Verify all text changes from "app" to "launcher" are complete
- [ ] Test new app config modal flow with each launcher type selection
- [ ] Ensure existing launchers continue to work after terminology changes
- [ ] Test that all buttons, modals, and interactions work as expected
- [ ] Verify responsive design still works correctly

---

## Sprint 3 - Major Architecture Refactor: Apps → Launchers with Multi-Component Support

### Task S3-1: Refactor Core Data Model - Apps to Launchers with Component Architecture
**Priority:** HIGH 🚨 | **Status:** TODO 📝 | **Complexity:** HIGH

**Vision Statement:**
Transform OddLauncher from a rigid "app with one terminal + one browser" model to a flexible "launcher with multiple components" architecture. Users should be able to create launchers that can have multiple terminal commands and multiple browser tabs running in parallel, with a tabbed interface for managing multiple terminal sessions.

**Current Architecture Problems:**
1. **Rigid Structure**: Current `AppConfig` forces exactly one terminal + one browser configuration
2. **Limited Terminal Support**: Only one terminal command per app, no multi-terminal tabs
3. **Inflexible Browser Support**: Only one URL per app, no multi-tab support
4. **Poor UX**: Modal forces users to choose predefined combinations instead of building what they need
5. **Terminology Confusion**: "App" implies single purpose, but we're building multi-purpose launchers

**New Architecture Vision:**

**Launcher Model:**
```typescript
interface LauncherConfig {
  id: string
  name: string
  description?: string
  tags?: string[]
  components: LauncherComponent[]  // Multiple components per launcher
  createdAt: string
  updatedAt: string
  lastUsedAt?: string
  useCount?: number
}

interface LauncherComponent {
  id: string
  type: 'terminal' | 'browser'
  name: string  // Tab/component display name
  order: number  // Display order
  // Component-specific config
  config: TerminalComponentConfig | BrowserComponentConfig
}

interface TerminalComponentConfig {
  launchCommands: string
  workingDirectory?: string
  terminalType?: string
  environmentVariables?: Record<string, string>
}

interface BrowserComponentConfig {
  url: string
  autoLaunch?: boolean
  delay?: number
  portToCheck?: number
  portCheckTimeout?: number
}
```

**Runtime State:**
```typescript
interface LauncherState {
  config: LauncherConfig
  status: LauncherStatus
  components: ComponentState[]
}

interface ComponentState {
  componentId: string
  type: 'terminal' | 'browser'
  status: ComponentStatus
  pid?: number  // For terminal processes
  output?: string[]  // For terminal components
  startedAt?: string
  errorMessage?: string
}
```

**UI Architecture:**
- **Launcher Creation**: Start with name only, dynamically add components
- **Terminal Tabs**: Each terminal component becomes a tab in terminal panel
- **Browser Management**: Each browser component can be launched independently
- **Component Actions**: Start/stop individual components or entire launcher

**Implementation Phases:**

**Phase 1: Data Model Refactor (This Task)**
- Create new TypeScript interfaces for Launcher architecture
- Create new Rust structs for Launcher architecture
- Design migration strategy from AppConfig → LauncherConfig
- Update JSON schema and storage format
- Implement backward compatibility layer

**Acceptance Criteria:**
- [ ] New LauncherConfig TypeScript interfaces defined
- [ ] New LauncherConfig Rust structs implemented
- [ ] Migration utility created (apps.json → launchers.json)
- [ ] Backward compatibility maintained during transition
- [ ] All existing functionality preserved with new data model
- [ ] Unit tests for data model validation
- [ ] JSON schema updated for new structure

**Technical Considerations:**
- **Storage Migration**: Automatic conversion of existing apps.json to new format
- **ID Generation**: Component IDs must be unique within launcher scope
- **Validation**: Ensure at least one component per launcher
- **Backward Compatibility**: Support loading old format during transition period
- **Performance**: Efficient querying of components by type/status

---

### Task S3-2: Refactor Backend Process Management for Multi-Component Architecture
**Priority:** HIGH 🚨 | **Status:** TODO 📝 | **Depends On:** S3-1

**Problem Statement:**
Current process management assumes one process per app. New architecture needs to manage multiple terminal processes per launcher, with independent lifecycle management for each component.

**Technical Changes Required:**

**Process Manager Updates:**
- Change from `Map<AppId, ProcessInfo>` to `Map<ComponentId, ProcessInfo>`
- Add launcher-level aggregated status (running if any component running)
- Support starting/stopping individual components vs entire launcher
- Handle component dependencies (e.g., start terminal before browser)

**Command Interface Changes:**
```rust
// Old
pub async fn start_app_process(app_id: String, ...) -> ProcessResult
pub async fn stop_app_process(app_id: String, ...) -> ProcessResult

// New
pub async fn start_launcher_component(launcher_id: String, component_id: String, ...) -> ProcessResult
pub async fn stop_launcher_component(launcher_id: String, component_id: String, ...) -> ProcessResult
pub async fn start_launcher(launcher_id: String, ...) -> Vec<ProcessResult>  // Start all components
pub async fn stop_launcher(launcher_id: String, ...) -> Vec<ProcessResult>   // Stop all components
pub async fn get_launcher_status(launcher_id: String, ...) -> LauncherState
```

**Event System Updates:**
- Component-level events: `component-started`, `component-output`, `component-stopped`
- Launcher-level events: `launcher-started`, `launcher-stopped`, `launcher-status-changed`
- Terminal output events must include `componentId` for tab routing

**Process Lifecycle Management:**
- Independent component start/stop
- Graceful launcher shutdown (stop all components)
- Component restart without affecting others
- Process tree management per component

**Acceptance Criteria:**
- [ ] Process manager supports multi-component architecture
- [ ] Component-level start/stop commands implemented
- [ ] Launcher-level orchestration commands implemented
- [ ] Event system updated for component-level events
- [ ] Terminal output routing includes component identification
- [ ] Process cleanup handles component independence
- [ ] Error handling for partial launcher failures

---

### Task S3-3: Implement Multi-Terminal Tab System
**Priority:** HIGH 🚨 | **Status:** TODO 📝 | **Depends On:** S3-1, S3-2

**Problem Statement:**
Current UI has single terminal view. New architecture requires tabbed interface to manage multiple terminal components per launcher, with independent output streams and controls.

**UI Architecture Requirements:**

**Terminal Container Redesign:**
```
┌─ Launcher: "MyApp Development"  ─────────────────────────────────┐
│ Tabs: [Frontend Server*] [Backend API*] [Database] [+ Add Tab]   │
├─────────────────────────────────────────────────────────────────┤
│ Terminal Output (Frontend Server):                               │
│ $ yarn dev                                                       │
│ Starting development server...                                   │
│ Server running on http://localhost:3000                         │
│ │                                                               │
├─────────────────────────────────────────────────────────────────┤
│ [Start All] [Stop All] [Settings]  Per-tab: [Start] [Stop] [×]  │
└─────────────────────────────────────────────────────────────────┘
```

**Component Features:**
- **Tab Management**: Add, remove, reorder terminal components
- **Independent Controls**: Start/stop individual terminals or all at once
- **Output Routing**: Each terminal component gets its own output stream
- **Visual Status**: Tab indicators for running/stopped/error states
- **Context Menus**: Right-click for component-specific actions

**Technical Implementation:**
- Create `MultiTerminalContainer` component
- Implement `TerminalTab` component for individual terminals
- Update terminal output routing to use componentId
- Add tab management UI (add/remove/reorder)
- Integrate with new process management commands

**State Management:**
- Track active terminal tab
- Manage component-level output buffers
- Handle terminal component lifecycle
- Preserve tab state across app restarts

**Acceptance Criteria:**
- [ ] Tabbed terminal interface implemented
- [ ] Each terminal component displays in its own tab
- [ ] Independent start/stop controls per tab
- [ ] Output correctly routed to appropriate tab
- [ ] Tab state indicators (running/stopped/error)
- [ ] Add/remove terminal tabs functionality
- [ ] Tab reordering support
- [ ] Context menus for tab-specific actions
- [ ] Active tab persistence across sessions

---

### Task S3-4: Redesign Launcher Creation Modal - Component-Based Builder
**Priority:** HIGH 🚨 | **Status:** TODO 📝 | **Depends On:** S3-1

**Problem Statement:**
Current AppConfigModal forces users into predefined categories (browser+terminal, terminal only, browser only). New design should start minimal and let users build their launcher by adding components as needed.

**New Modal Flow:**

**Initial State:**
```
┌─ Create New Launcher ─────────────────────────────────┐
│ Launcher Name: [                                    ] │
│ Description:   [                                    ] │
│                                                       │
│ Components: (empty)                                   │
│ ┌─────────────────────────────────────────────────┐   │
│ │ + Add Terminal Component                        │   │
│ │ + Add Browser Component                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│                              [Cancel] [Create]       │
└───────────────────────────────────────────────────────┘
```

**After Adding Components:**
```
┌─ Create New Launcher ─────────────────────────────────┐
│ Launcher Name: [MyApp Development                   ] │
│ Description:   [Full stack development setup        ] │
│                                                       │
│ Components:                                           │
│ ┌─ Terminal: Frontend Server ─────────────────────┐   │
│ │ Commands: yarn dev                              │   │
│ │ Directory: /home/user/frontend                  │   │
│ │ Terminal: WSL                          [Remove] │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─ Terminal: Backend API ──────────────────────────┐   │
│ │ Commands: npm start                             │   │
│ │ Directory: /home/user/backend                   │   │
│ │ Terminal: WSL                          [Remove] │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─ Browser: Development Dashboard ─────────────────┐   │
│ │ URL: http://localhost:3000                      │   │
│ │ Auto-launch: ✓  Delay: 2 seconds      [Remove] │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│ ┌─────────────────────────────────────────────────┐   │
│ │ + Add Terminal Component                        │   │
│ │ + Add Browser Component                         │   │
│ └─────────────────────────────────────────────────┘   │
│                                                       │
│                              [Cancel] [Create]       │
└───────────────────────────────────────────────────────┘
```

**Component Configuration:**
- **Terminal Components**: Name, commands, directory, terminal type, env vars
- **Browser Components**: Name, URL, auto-launch, delay, port checking
- **Validation**: At least one component required
- **Reordering**: Drag & drop to change component order

**Technical Implementation:**
- Replace rigid AppType selection with dynamic component builder
- Create `ComponentBuilder` sub-components
- Implement component add/remove/reorder logic
- Update validation to ensure at least one component
- Migrate existing form logic to component-based approach

**Acceptance Criteria:**
- [ ] Modal starts with minimal name/description form
- [ ] Dynamic component addition via buttons
- [ ] Terminal component configuration UI
- [ ] Browser component configuration UI
- [ ] Component removal functionality
- [ ] Component reordering support
- [ ] Validation prevents empty launchers
- [ ] Form state management for dynamic components
- [ ] Edit mode supports existing launcher modification

---

### Task S3-5: Update Main UI - Launcher Cards and Component Status
**Priority:** MEDIUM 🔶 | **Status:** TODO 📝 | **Depends On:** S3-1, S3-2, S3-3, S3-4

**Problem Statement:**
Current main UI shows app cards with single status. New architecture needs to show launcher cards with component-level status and controls.

**Main View Redesign:**

**Launcher Card Layout:**
```
┌─ MyApp Development ───────────────────── [⚙] [🗑] ┐
│ 3 components • 2 running • 1 stopped             │
│                                                   │
│ 🖥 Frontend Server     [●] Running   [Stop]     │
│ 🖥 Backend API         [●] Running   [Stop]     │
│ 🌐 Dev Dashboard       [○] Stopped   [Start]    │
│                                                   │
│ [Start All] [Stop All] [View Terminal]          │
└───────────────────────────────────────────────────┘
```

**Launcher Status Aggregation:**
- **All Stopped**: Gray launcher header
- **Partially Running**: Orange launcher header
- **All Running**: Green launcher header
- **Error State**: Red launcher header

**Component Status Indicators:**
- **Terminal Components**: Terminal icon + status
- **Browser Components**: Browser icon + status
- **Individual Controls**: Component-level start/stop buttons
- **Bulk Controls**: Start all / Stop all launcher buttons

**Technical Implementation:**
- Update launcher card component design
- Implement component status aggregation logic
- Add component-level control buttons
- Update launcher start/stop to handle all components
- Integrate with multi-terminal tab system

**Sidebar Integration:**
- Update sidebar to show launcher names (not app names)
- Component count indicators
- Filter by component types
- Recent launchers based on component usage

**Acceptance Criteria:**
- [ ] Launcher cards show component breakdown
- [ ] Component status indicators implemented
- [ ] Individual component start/stop controls
- [ ] Bulk launcher start/stop controls
- [ ] Status aggregation working correctly
- [ ] Visual status indicators (colors, icons)
- [ ] Integration with terminal tab system
- [ ] Sidebar updated for launcher terminology
- [ ] Component filtering/searching support

---

### Task S3-6: Implement Migration System and Backward Compatibility
**Priority:** HIGH 🚨 | **Status:** TODO 📝 | **Depends On:** S3-1

**Problem Statement:**
Existing users have apps.json configurations that need to seamlessly migrate to the new launcher format without data loss or user intervention.

**Migration Strategy:**

**Automatic Migration:**
```typescript
interface Migration {
  fromVersion: string  // "2.x" (current app format)
  toVersion: string    // "3.0" (launcher format)
  migrate(oldConfig: AppConfig[]): LauncherConfig[]
}

// Migration Logic:
// AppConfig → LauncherConfig
// - App becomes Launcher
// - launchCommands → Terminal Component (if present)
// - url → Browser Component (if present)
// - Preserve all metadata (tags, usage stats, etc.)
```

**Migration Rules:**
1. **Process Apps**: Create launcher with single terminal component
2. **Bookmark Apps**: Create launcher with single browser component
3. **Both Apps**: Create launcher with terminal + browser components
4. **Preserve Metadata**: Keep all tags, usage stats, creation dates
5. **Generate Component Names**: Auto-generate meaningful component names

**Backward Compatibility:**
- Detect old format during app startup
- Automatic migration with backup creation
- Migration logging and error handling
- Rollback capability if migration fails

**Technical Implementation:**
- Create migration utility functions
- Add version detection to config loading
- Implement automatic backup system
- Add migration progress reporting
- Handle edge cases and validation errors

**Acceptance Criteria:**
- [ ] Automatic detection of old app format
- [ ] Migration converts all app types correctly
- [ ] Component names auto-generated meaningfully
- [ ] All metadata preserved (tags, stats, dates)
- [ ] Backup created before migration
- [ ] Migration logging and error reporting
- [ ] Rollback functionality for failed migrations
- [ ] Progress indication for large migrations
- [ ] Validation of migrated data integrity

---

### Task S3-7: Update Documentation and Terminology Throughout Codebase
**Priority:** LOW 🟢 | **Status:** TODO 📝 | **Depends On:** All above tasks

**Problem Statement:**
Codebase uses "app" terminology throughout. Need comprehensive update to "launcher" terminology with updated documentation.

**Terminology Updates:**
- **"App"** → **"Launcher"**
- **"App Configuration"** → **"Launcher Configuration"**
- **"Start App"** → **"Start Launcher"** or **"Start Components"**
- **"App Status"** → **"Launcher Status"** / **"Component Status"**

**Files Requiring Updates:**
- All TypeScript interfaces and types
- All Rust structs and function names
- UI text and labels throughout frontend
- README.md and documentation
- Code comments and variable names
- API endpoint names and parameters

**Documentation Updates:**
- README.md with new architecture explanation
- API documentation for new launcher endpoints
- User guide for component-based launcher creation
- Migration guide for users upgrading from app-based version
- Developer documentation for new data models

**Acceptance Criteria:**
- [ ] All user-visible text updated to use "launcher" terminology
- [ ] Code comments and documentation updated
- [ ] Variable and function names updated appropriately
- [ ] README.md reflects new architecture
- [ ] API documentation updated for new endpoints
- [ ] User guide created for new component system
- [ ] Migration documentation for existing users

---

## Implementation Timeline Recommendation

**Phase 1 (Foundation)**: S3-1, S3-6 - Data model and migration (1-2 weeks)
**Phase 2 (Backend)**: S3-2 - Process management refactor (1 week)
**Phase 3 (UI Core)**: S3-3, S3-4 - Terminal tabs and modal redesign (2 weeks)
**Phase 4 (Integration)**: S3-5 - Main UI updates (1 week)
**Phase 5 (Polish)**: S3-7 - Documentation and terminology (3-5 days)

**Total Estimated Time**: 5-6 weeks for complete refactor

**Risk Considerations:**
- **Data Migration**: Critical to get right, extensive testing needed
- **UI Complexity**: Multi-tab system adds significant complexity
- **Backend Changes**: Process management changes affect core functionality
- **User Impact**: Major UX change requires careful introduction

**Success Metrics:**
- Zero data loss during migration
- All existing functionality preserved
- New multi-component functionality working
- Terminal tab system performing well
- User confusion minimized through good UX

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
