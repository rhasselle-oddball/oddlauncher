use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/**
 * Status of an application process
 */
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AppStatus {
    Stopped,
    Starting,
    Running,
    Stopping,
    Error,
}

impl Default for AppStatus {
    fn default() -> Self {
        AppStatus::Stopped
    }
}

/**
 * Configuration for an individual app
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    /// Unique identifier for the app
    pub id: String,
    /// Display name of the app
    pub name: String,
    /// Shell commands to execute sequentially (one per line) - optional for bookmark apps
    pub launch_commands: Option<String>,
    /// Working directory for the command (optional)
    pub working_directory: Option<String>,
    /// URL to open in browser when app starts (optional)
    pub url: Option<String>,
    /// Environment variables to set (optional)
    pub environment_variables: Option<HashMap<String, String>>,
    /// Auto-launch browser when app starts (default: true if url provided)
    pub auto_launch_browser: Option<bool>,
    /// Delay in seconds before opening browser (default: 0)
    pub browser_delay: Option<u32>,
    /// Port to poll for readiness before opening browser (optional)
    pub port_to_check: Option<u16>,
    /// Maximum time to wait for port to be ready in seconds (default: 30)
    pub port_check_timeout: Option<u32>,
    /// Tags for organization and filtering (optional)
    pub tags: Option<Vec<String>>,
    /// Terminal/shell type to use for executing commands (optional)
    pub terminal_type: Option<String>,
    /// Explicit app type (process, bookmark, both) - optional for back-compat
    pub app_type: Option<AppType>,
    /// Last time the app was used (process started or bookmark opened)
    pub last_used_at: Option<String>,
    /// Total times the app has been used
    pub use_count: Option<u64>,
    /// Creation timestamp
    pub created_at: String,
    /// Last modified timestamp
    pub updated_at: String,
}

/**
 * Runtime information about a running app
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppProcess {
    /// App configuration ID
    pub app_id: String,
    /// Process ID (if running)
    pub pid: Option<u32>,
    /// Current status
    pub status: AppStatus,
    /// Start time (if running)
    pub started_at: Option<String>,
    /// Last error message (if status is error)
    pub error_message: Option<String>,
    /// Terminal output buffer
    pub output: Vec<String>,
    /// Whether the process is detached/background
    pub is_background: Option<bool>,
}

/**
 * Complete app state combining config and runtime info
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    /// App configuration
    pub config: AppConfig,
    /// Runtime process information
    pub process: Option<AppProcess>,
}

/**
 * Terminal configuration settings
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalSettings {
    /// Default shell to use (e.g., 'zsh', 'bash', 'fish')
    pub default_shell: String,
    /// Whether to run as login shell by default
    pub use_login_shell: bool,
    /// Whether to inherit current environment
    pub inherit_environment: bool,
    /// Default source files to load for all apps
    pub default_source_files: Vec<String>,
    /// Default environment variables for all apps
    pub default_environment_variables: HashMap<String, String>,
}

impl Default for TerminalSettings {
    fn default() -> Self {
        Self {
            default_shell: "zsh".to_string(),
            use_login_shell: true,
            inherit_environment: true,
            default_source_files: vec![
                "~/.zshrc".to_string(),
                "~/.profile".to_string(),
            ],
            default_environment_variables: HashMap::new(),
        }
    }
}

/**
 * Global application settings
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalSettings {
    /// Theme preference (currently only 'dark' supported)
    pub theme: String,
    /// Default working directory for new apps
    pub default_working_directory: Option<String>,
    /// Maximum lines to keep in terminal output buffer
    pub max_terminal_lines: u32,
    /// Default browser command (optional - uses system default)
    pub default_browser: Option<String>,
    /// Auto-save configuration changes
    pub auto_save: bool,
    /// Terminal configuration settings
    pub terminal: TerminalSettings,
}

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_working_directory: None,
            max_terminal_lines: 1000,
            default_browser: None,
            auto_save: true,
            terminal: TerminalSettings::default(),
        }
    }
}

/**
 * Global application configuration
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GlobalConfig {
    /// Version of the config format
    pub version: String,
    /// Applications configuration
    pub apps: Vec<AppConfig>,
    /// Global settings
    pub settings: GlobalSettings,
    /// Last modified timestamp
    pub last_modified: String,
}

impl Default for GlobalConfig {
    fn default() -> Self {
        Self {
            version: "1.0.0".to_string(),
            apps: Vec::new(),
            settings: GlobalSettings::default(),
            last_modified: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/**
 * Error types for app operations
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppError {
    /// Error code
    pub code: String,
    /// Human-readable error message
    pub message: String,
    /// Additional context/details
    pub details: Option<HashMap<String, serde_json::Value>>,
    /// Timestamp when error occurred
    pub timestamp: String,
}

impl AppError {
    pub fn new(code: &str, message: &str) -> Self {
        Self {
            code: code.to_string(),
            message: message.to_string(),
            details: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
        }
    }

    pub fn with_details(mut self, details: HashMap<String, serde_json::Value>) -> Self {
        self.details = Some(details);
        self
    }
}

/**
 * Result type for app operations
 */
pub type AppResult<T> = std::result::Result<T, AppError>;

/**
 * Events emitted by the app system
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AppEvent {
    StatusChanged { app_id: String, status: AppStatus },
    OutputReceived { app_id: String, output: String },
    ConfigUpdated { app_id: String, config: AppConfig },
    AppAdded { app_id: String, config: AppConfig },
    AppRemoved { app_id: String },
    ErrorOccurred { app_id: String, error: AppError },
}

/**
 * Type of application
 */
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum AppType {
    Process,
    Bookmark,
    Both,
}

/**
 * Information about an available terminal/shell
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalInfo {
    /// Unique identifier for the terminal type
    pub id: String,
    /// Display name for the terminal
    pub name: String,
    /// Executable path/command
    pub executable: String,
    /// Whether this terminal is available on the system
    pub available: bool,
    /// Platform this terminal is associated with
    pub platform: String,
}

impl AppConfig {
    /// Determine the type of app based on configuration
    pub fn get_app_type(&self) -> AppType {
        if let Some(t) = &self.app_type {
            return t.clone();
        }
        let has_cmd = self
            .launch_commands
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);
        let has_url = self
            .url
            .as_ref()
            .map(|s| !s.trim().is_empty())
            .unwrap_or(false);
        if has_cmd && has_url {
            AppType::Both
        } else if has_cmd {
            AppType::Process
        } else {
            AppType::Bookmark
        }
    }

    /// Check if this is a bookmark app (URL-only)
    pub fn is_bookmark_app(&self) -> bool {
        self.get_app_type() == AppType::Bookmark
    }

    /// Check if this is a process app
    pub fn is_process_app(&self) -> bool {
        match self.get_app_type() {
            AppType::Process | AppType::Both => true,
            _ => false,
        }
    }
}
