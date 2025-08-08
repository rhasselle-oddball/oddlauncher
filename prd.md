# OddLauncher – Product Requirements Document (PRD)

## 🌟 Product Vision

**OddLauncher** is a native desktop application that acts like a **Steam Library for your dev tools**. It lets users launch local development servers with a single click, run their startup command (e.g. `npm run dev`), view terminal output in real-time, and open the relevant browser tab — all without ever touching a terminal.

---

## 👨‍💻 Target Audience

- Developers managing multiple GitHub projects
- People who want a GUI-first way to launch dev tools
- Users who prefer a clean visual launcher over terminal workflows

---

## 🚀 Core Features

### ✅ 1. Visual App Library (Grid Layout)

- Grid of app cards (like Steam)
- Each card includes:
  - 🖼️ Thumbnail (auto-captured screenshot or user-set)
  - 🏷️ App name
  - 🔗 Target URL (e.g. `http://localhost:5173`)
  - ▶️ **Start** button
  - ⏹️ **Stop** button
  - ⚙️ Edit / 🗑️ Delete

### ✅ 2. App Configuration

Stored in a local JSON file (e.g. `~/.oddlauncher/apps.json`):

```json
{
  "name": "Parrot Tester",
  "command": "npm run dev",
  "cwd": "~/projects/parrot",
  "url": "http://localhost:5173",
  "thumbnail": "thumbnails/parrot.png"
}
```

- Users can:
  - Add new apps via GUI form
  - Edit or delete apps
  - Provide a path, command, and URL per app

### ✅ 3. Click to Start / Stop

- Start: Executes terminal command in background
- Stop: Gracefully kills the process
- Buttons update with app status (e.g. 🟢 Running / 🔴 Stopped)

### ✅ 4. Embedded Terminal View (Read-Only Logs)

- Read-only terminal pane per app
  - Shows real-time `stdout` and `stderr`
  - Styled like a real terminal (monospace, dark background)
  - Buffered output with scrollback
  - No input field (non-interactive)

### ✅ 5. Auto-Open Dev URL

- Automatically opens `url` when the app is running
- Optional port polling (e.g. check if localhost:5173 responds)
- Configurable delay if needed

---

## ✨ Nice-to-Haves (Optional v1.x)

- 🖼️ Auto-screenshot of dev URL for thumbnails (via Puppeteer)
- 🏷️ Tag/filter support
- 🌑 Dark theme only
- 📁 Right-click → Open in folder or VSCode
- ↺ Restart button
- ⛔ Kill all running apps
- 🐢 Slow start detection (loading feedback or retries)

---

## 🛠️ Technical Stack

| Layer      | Tech                                     |
| ---------- | ---------------------------------------- |
| UI         | Tauri + React + TypeScript               |
| Backend    | Tauri Rust backend using `Command`       |
| Storage    | JSON file (`~/.oddlauncher/apps.json`)        |
| Log View   | Live pipe of `stdout`/`stderr`           |
| Screenshot | User-uploaded thumbnails                  |

## 📁 Project Structure

```
oddlauncher/
├── prd.md                    # Product Requirements Document
├── tasks.md                  # Development task tracker
├── README.md                 # Project setup and documentation
├── .github/
│   └── copilot-instructions.md
│
├── src/                      # React frontend
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── styles/              # Global styles and themes
│   └── App.tsx              # Main React app
│
├── src-tauri/               # Tauri Rust backend
│   ├── src/
│   │   ├── commands/        # Tauri command handlers
│   │   ├── models/          # Rust data models
│   │   └── main.rs          # Rust main entry point
│   ├── Cargo.toml           # Rust dependencies
│   ├── tauri.conf.json      # Tauri configuration
│   └── capabilities/        # Tauri permissions
│
├── public/                  # Static assets
├── dist/                    # Built frontend (generated)
├── package.json             # Node.js dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
└── .gitignore               # Git ignore rules
```

---

## 🔧 Example Flow

1. User opens OddLauncher
2. Sees a grid of their dev apps
3. Clicks ▶️ on "26-4555"
4. App runs `yarn watch --env=adapted-home-grants-4555` in background
5. Terminal log pane opens with real-time output
6. Browser opens `http://localhost:3000/adapted-home-grants-4555`
7. User clicks ⏹️ to stop when done

---

## 🔒 Constraints & Philosophy

- ❌ No terminal required
- ❌ No always-running background agent
- ✅ 100% local
- ✅ No telemetry or tracking
- ✅ Open-source friendly

---

## 🚪 MVP Development Plan

### Phase 1 – Core Launcher

-

### Phase 2 – Config Management

-

### Phase 3 – Polish

-

---

## ✅ Summary

> **OddLauncher** is a no-terminal, click-to-run launcher for dev tools. Think: **Steam for local dev servers** — with live logs, instant browser launch, and a friendly UI.

