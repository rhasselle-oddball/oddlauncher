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
    /// Shell command to execute
    pub command: String,
    /// Working directory for the command (optional)
    pub working_directory: Option<String>,
    /// URL to open in browser when app starts (optional)
    pub url: Option<String>,
    /// Custom thumbnail/icon path (optional)
    pub thumbnail_path: Option<String>,
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
}

impl Default for GlobalSettings {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_working_directory: None,
            max_terminal_lines: 1000,
            default_browser: None,
            auto_save: true,
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
