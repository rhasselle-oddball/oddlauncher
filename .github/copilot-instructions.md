---
applyTo: "**"
---

# Oddbox Development Instructions for GitHub Copilot

## Project Overview

Oddbox is a native desktop application built with Tauri + React that acts like a "Steam Library for dev tools". It provides a GUI-first way to launch local development servers with a single click, view terminal output in real-time, and open browser tabs automatically.

## Task Management Workflow

### Task Lifecycle

1. **Task Creation**: Create tasks in `tasks.md` with checkboxes based on the PRD
2. **Issue Creation**: When starting a task, create a GitHub issue using `gh issue create`
3. **Development**: Work on the task following the verification steps
4. **Completion**: When task is complete, commit & push code, then close the issue with `gh issue close`

### Task File Management

- Keep `tasks.md` up-to-date with current progress
- Use checkboxes `- [ ]` for incomplete tasks, `- [x]` for completed tasks
- Each task should represent a single GitHub issue
- Include verification steps for each task to ensure completion

### GitHub Integration Commands

```bash
# Create issue when starting a task
gh issue create --title "Task Title" --body "Task description with acceptance criteria"

# Close issue when task is complete
gh issue close <issue-number> --comment "Task completed and code deployed"

# Check current issues (ALWAYS use GH_PAGER=cat to prevent user intervention)
GH_PAGER=cat gh issue list
GH_PAGER=cat gh issue list --state=open
GH_PAGER=cat gh issue list --state=closed
```

**IMPORTANT**: Always use `GH_PAGER=cat` with GitHub CLI commands to prevent pager/vim from opening and requiring user intervention. This ensures commands run without blocking.

## Code Style & Architecture Guidelines

### Project Structure

- **Frontend**: React with TypeScript in `/src/`
  - `/src/components/` - React components (PascalCase filenames)
  - `/src/hooks/` - Custom React hooks (use camelCase)
  - `/src/types/` - TypeScript type definitions and interfaces
  - `/src/utils/` - Utility functions and helpers
  - `/src/styles/` - Global styles, theme definitions
- **Backend**: Rust Tauri backend in `/src-tauri/`
  - `/src-tauri/src/commands/` - Tauri command handlers
  - `/src-tauri/src/models/` - Rust data structures and models
- **Configuration**: JSON storage at `~/.oddbox/apps.json`
- **Assets**: Screenshots/thumbnails in local storage
- **Build Output**: Generated frontend in `/dist/`

### Naming Conventions

- Use PascalCase for React components and interfaces
- Use camelCase for variables, functions, and methods
- Use kebab-case for file names
- Use SCREAMING_SNAKE_CASE for constants

### React/TypeScript Standards

- Use functional components with hooks
- Use TypeScript interfaces for all data structures
- Use proper error boundaries for React components
- Implement proper loading states and error handling
- Use React Context for global state management

### Rust/Tauri Standards

- Use proper error handling with `Result<T, E>`
- Use `#[tauri::command]` for frontend-backend communication
- Implement proper async/await patterns
- Use proper logging with `log` crate
- Structure commands in separate modules

### State Management

- Use React Context for global app state
- Keep app configurations in JSON files
- Use proper TypeScript types for all state objects
- Implement proper state persistence

### UI/UX Guidelines

- Dark theme only (as specified in PRD)
- Steam-like grid layout for app cards
- Real-time terminal output display
- Responsive design for different window sizes
- Consistent button states (Running/Stopped indicators)

### Testing Requirements

- Unit tests for all utility functions
- Integration tests for Tauri commands
- Component tests for React components
- End-to-end tests for critical user flows

### Security & Performance

- No external API calls (100% local as per PRD)
- No telemetry or tracking
- Efficient process management for spawned commands
- Proper memory management for terminal logs
- Graceful process termination

### Git Workflow

- Create feature branches for each task
- Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Squash commits before merging to main
- Always run tests before pushing
- Include issue number in commit messages

### Error Handling Patterns

- Always wrap async operations in try/catch
- Provide user-friendly error messages
- Log errors with contextual information
- Implement graceful degradation for non-critical features
- Show loading states during operations

### Documentation Requirements

- Update README.md for new features
- Document all public APIs
- Include setup instructions for development
- Maintain changelog for releases
- Document configuration options

### Development Environment

- Use VS Code as primary editor
- Use Rust analyzer extension
- Use React DevTools for debugging
- Use proper TypeScript configuration
- Use ESLint and Prettier for code formatting

## Verification Checklist Template

For each task, include these verification steps:

- [ ] Code compiles without warnings
- [ ] All tests pass
- [ ] UI/UX matches design requirements
- [ ] Error handling is implemented
- [ ] Documentation is updated
- [ ] Code is properly formatted
- [ ] No console errors in browser/terminal
- [ ] Feature works as expected in development
- [ ] Git commit messages are clear and conventional
