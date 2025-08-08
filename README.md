# OddLauncher - Dev Tools Launcher

A native desktop application that acts like a "Steam Library for dev tools". Launch local development servers with a single click, view terminal output in real-time, and open browser tabs automatically.

## 💾 Download & Installation

### Get the Latest Release

**📋 [Download from Releases Page](https://github.com/rhasselle-oddball/oddlauncher/releases)**

Choose the right file for your operating system:
- **Windows**: `oddlauncher_*_x64_en-US.msi`
- **macOS Intel**: `oddlauncher_*_x64.dmg`
- **macOS Apple Silicon**: `oddlauncher_*_aarch64.dmg`
- **Linux Debian/Ubuntu**: `oddlauncher_*_amd64.deb`
- **Linux Universal**: `oddlauncher_*_amd64.AppImage`

### ⚠️ Security Warnings & Workarounds

**These applications are NOT code-signed**, so your operating system will show security warnings. This is normal for unsigned applications.

#### **Windows**
- **Warning**: "Windows protected your PC" or "Unknown publisher"
- **Solution**: Click "More info" → "Run anyway"
- **Alternative**: Right-click the installer → Properties → Check "Unblock" → OK

#### **macOS**
- **Warning**: "App is damaged and can't be opened" or "Developer cannot be verified"
- **Solution**: Run this command in Terminal:
  ```bash
  xattr -d com.apple.quarantine ~/Downloads/oddlauncher*.dmg
  ```
  Then mount the .dmg and drag OddLauncher.app to Applications
- **Alternative**: System Preferences → Security & Privacy → Allow app to run

#### **Linux**
- **Debian/Ubuntu (.deb)**:
  ```bash
  sudo dpkg -i oddlauncher_*_amd64.deb
  sudo apt-get install -f  # Fix any missing dependencies
  ```
- **AppImage**:
  ```bash
  chmod +x oddlauncher_*_amd64.AppImage
  ./oddlauncher_*_amd64.AppImage
  ```

### 🔒 What to Expect

Since these are unsigned applications:
- **First launch** may take longer as the system scans the app
- **Antivirus software** might flag it for review (false positive)
- **System notifications** about running unsigned software
- **No automatic updates** - you'll need to manually download new versions

### ✅ Verify Your Download

For security, you can verify the files match the official release:
- Check that download URLs start with `https://github.com/rhasselle-oddball/oddlauncher/releases/`
- Compare file sizes with those listed on the releases page
- Check the release notes for any additional installation steps

## 🎯 Features

### ✅ What's Working Now
- Steam-like sidebar layout for dev tools
- Dark theme UI with responsive design
- One-click server launching and stopping
- Real-time process status indicators
- App configuration with form validation
- File/directory pickers for easy setup
- **Drag-and-drop reordering** of apps in sidebar
- Cross-platform support (Windows, macOS, Linux)
- Configuration persistence (`~/.oddlauncher/apps.json`)

### 🚧 Coming Soon
- Real-time terminal output display
- Auto-launch browser functionality
- Custom thumbnails for apps
- System tray integration

---

## 👩‍💻 Developer Information

*The following section is for developers who want to contribute to or build OddLauncher from source.*

### Development Prerequisites

- **Node.js** v18+ (recommend v22.18.0)
- **Rust** and **Cargo** (latest stable)
- **Git**

#### Platform-Specific System Dependencies

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install -y \
  libgtk-3-dev libwebkit2gtk-4.0-dev \
  libayatana-appindicator3-dev librsvg2-dev \
  libjavascriptcoregtk-4.1-dev libsoup-3.0-dev \
  libwebkit2gtk-4.1-dev
```

**Linux (RHEL/Fedora):**
```bash
sudo dnf install -y \
  gtk3-devel webkit2gtk4.1-devel \
  ayatana-appindicator-gtk3-devel librsvg2-devel
```

**macOS:**
```bash
# Xcode Command Line Tools required
xcode-select --install
```

**Windows:**
- No additional dependencies needed (WebView2 is included)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/rhasselle-oddball/oddlauncher.git
   cd oddlauncher
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

### Running in Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Run the Tauri app (opens automatically)**
   ```bash
   npm run tauri dev
   ```

The development server will:
- Start the frontend at http://localhost:5173/
- Launch the desktop application automatically
- Enable hot-reloading for both frontend and backend changes

### Building for Production

#### Native Platform Build (Recommended)

For the best compatibility, build on the target platform:

**All Platforms:**
```bash
npm run tauri build
```

This creates:
- **Windows**: `.exe` installer (NSIS) and `.msi` package
- **macOS**: `.app` bundle and `.dmg` disk image
- **Linux**: `.deb`, `.rpm`, and `.AppImage` packages

#### Cross-Platform Building

You can cross-compile for other platforms from Linux:

**Windows from Linux:**
```bash
# Install cross-compilation tools
rustup target add x86_64-pc-windows-gnu
sudo apt install mingw-w64

# Create .cargo/config.toml (already included)
npm run tauri build -- --target x86_64-pc-windows-gnu
```

**Output Locations:**
- Native build: `src-tauri/target/release/bundle/`
- Cross-compiled: `src-tauri/target/{target}/release/bundle/`

#### Bundle Options

The app supports multiple installer formats per platform:

- **Windows**: NSIS installer (`.exe`), MSI package (`.msi`)
- **macOS**: Application bundle (`.app`), Disk image (`.dmg`)
- **Linux**: Debian package (`.deb`), RPM package (`.rpm`), AppImage (`.appimage`)

To build only specific formats, modify `src-tauri/tauri.conf.json`:
```json
{
  "bundle": {
    "targets": ["nsis", "msi"]  // Windows example
  }
}
```

#### Distribution

**For End Users:**
- **Windows**: Distribute the `.exe` installer (includes WebView2 setup)
- **macOS**: Distribute the `.dmg` file
- **Linux**: Distribute `.deb` for Debian/Ubuntu, `.rpm` for RHEL/Fedora, or `.AppImage` for universal compatibility

**For Developers:**
- Raw executables are in `src-tauri/target/release/`
- Require WebView2 runtime on Windows (automatically handled by installers)

## 📁 Project Structure

```
oddlauncher/
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
- **Storage**: JSON files in `~/.oddlauncher/`

## 📝 Development Workflow

1. **Task Management**: See `tasks.md` for current development tasks
2. **Issues**: Use GitHub issues for tracking work (linked to tasks)
3. **Commits**: Use conventional commit messages (`feat:`, `fix:`, etc.)

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
