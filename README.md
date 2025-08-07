# Oddbox - Dev Tools Launcher

A native desktop application that acts like a "Steam Library for dev tools". Launch local development servers with a single click, view terminal output in real-time, and open browser tabs automatically.

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+ (recommend v22.18.0)
- **Rust** and **Cargo** (latest stable)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rhasselle-oddball/oddbox.git
   cd oddbox
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Rust** (if not already installed)
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

4. **Install Tauri CLI**
   ```bash
   cargo install tauri-cli
   ```

### Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Run the Tauri app**
   ```bash
   cargo tauri dev
   ```

### Building for Production

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Build the Tauri app**
   ```bash
   cargo tauri build
   ```

## 📁 Project Structure

```
oddbox/
├── src/                      # React frontend
│   ├── components/           # React components
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Utility functions
│   └── styles/              # CSS and styling
├── src-tauri/               # Rust backend
│   ├── src/
│   │   ├── commands/        # Tauri command handlers
│   │   └── models/          # Data models
│   └── Cargo.toml
├── public/                  # Static assets
├── dist/                    # Built frontend (generated)
└── package.json             # Frontend dependencies
```

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Tauri (Rust)
- **Styling**: CSS with CSS variables for theming
- **Storage**: JSON files in `~/.oddbox/`

## 📝 Development Workflow

1. **Task Management**: See `tasks.md` for current development tasks
2. **Issues**: Use GitHub issues for tracking work (linked to tasks)
3. **Commits**: Use conventional commit messages (`feat:`, `fix:`, etc.)

## 🎯 Features (Planned)

- ✅ Steam-like grid layout for dev tools
- ✅ Dark theme UI
- ⏳ One-click server launching
- ⏳ Real-time terminal output display
- ⏳ Auto-launch browser tabs
- ⏳ Custom thumbnails for apps
- ⏳ Process management (start/stop/restart)

## 🤝 Contributing

1. Check `tasks.md` for available work
2. Create a GitHub issue before starting major work
3. Follow the coding guidelines in `.github/copilot-instructions.md`
4. Use conventional commit messages
5. Ensure all tests pass before submitting PRs

## 📄 License

[Add your license here]

## 🔗 Links

- [Product Requirements Document](./prd.md)
- [Development Tasks](./tasks.md)
- [Coding Guidelines](./.github/copilot-instructions.md)
