use crate::models::app::{GlobalConfig, AppConfig, AppError, AppResult};
use serde_json;
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

/// Get the path to the OddLauncher configuration directory (~/.oddlauncher/)
fn get_config_dir() -> AppResult<PathBuf> {
    match dirs::home_dir() {
        Some(home) => Ok(home.join(".oddlauncher")),
        None => Err(AppError::new(
            "HOME_DIR_ERROR",
            "Could not determine user home directory",
        )),
    }
}

/// Get the path to the main configuration file (~/.oddlauncher/apps.json)
fn get_config_file_path() -> AppResult<PathBuf> {
    Ok(get_config_dir()?.join("apps.json"))
}

/// Ensure the configuration directory exists
fn ensure_config_dir_exists() -> AppResult<()> {
    let config_dir = get_config_dir()?;

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir).map_err(|e| {
            AppError::new(
                "DIR_CREATE_ERROR",
                &format!("Failed to create config directory: {}", e),
            )
        })?;
        log::info!("Created configuration directory: {:?}", config_dir);
    }

    Ok(())
}

/// Load the global configuration from file
#[tauri::command]
pub async fn load_config(_app: AppHandle) -> AppResult<GlobalConfig> {
    log::info!("Loading configuration from file");

    let config_file = get_config_file_path()?;

    // Migration fallback: if new file doesn't exist, try old Oddbox path
    if !config_file.exists() {
        if let Some(home) = dirs::home_dir() {
            let legacy_dir = home.join(".oddbox");
            let legacy_file = legacy_dir.join("apps.json");
            if legacy_file.exists() {
                log::info!(
                    "Legacy config detected at {:?}; loading for migration",
                    legacy_file
                );
                let content = fs::read_to_string(&legacy_file).map_err(|e| {
                    AppError::new("FILE_READ_ERROR", &format!("Failed to read legacy config file: {}", e))
                })?;
                let config: GlobalConfig = serde_json::from_str(&content).map_err(|e| {
                    AppError::new("JSON_PARSE_ERROR", &format!("Failed to parse legacy config file: {}", e))
                })?;
                return Ok(config);
            }
        }
    }

    // If config file doesn't exist, return default config
    if !config_file.exists() {
        log::info!("Config file doesn't exist, returning default configuration");
        return Ok(GlobalConfig::default());
    }

    // Read and parse the config file
    let config_content = fs::read_to_string(&config_file).map_err(|e| {
        AppError::new(
            "FILE_READ_ERROR",
            &format!("Failed to read config file: {}", e),
        )
    })?;

    let config: GlobalConfig = serde_json::from_str(&config_content).map_err(|e| {
        AppError::new(
            "JSON_PARSE_ERROR",
            &format!("Failed to parse config file: {}", e),
        )
    })?;

    log::info!("Successfully loaded configuration with {} apps", config.apps.len());
    Ok(config)
}

/// Save the global configuration to file
#[tauri::command]
pub async fn save_config(_app: AppHandle, config: GlobalConfig) -> AppResult<()> {
    log::info!("Saving configuration to file");

    // Ensure config directory exists
    ensure_config_dir_exists()?;

    let config_file = get_config_file_path()?;

    // Update the last_modified timestamp
    let mut updated_config = config;
    updated_config.last_modified = chrono::Utc::now().to_rfc3339();

    // Serialize to JSON with pretty formatting
    let config_json = serde_json::to_string_pretty(&updated_config).map_err(|e| {
        AppError::new(
            "JSON_SERIALIZE_ERROR",
            &format!("Failed to serialize config: {}", e),
        )
    })?;

    // Write to file
    fs::write(&config_file, config_json).map_err(|e| {
        AppError::new(
            "FILE_WRITE_ERROR",
            &format!("Failed to write config file: {}", e),
        )
    })?;

    log::info!("Successfully saved configuration with {} apps", updated_config.apps.len());
    Ok(())
}

/// Add a new app configuration
#[tauri::command]
pub async fn add_app_config(app: AppHandle, app_config: AppConfig) -> AppResult<GlobalConfig> {
    log::info!("Adding new app configuration: {}", app_config.name);

    let mut config = load_config(app.clone()).await?;

    // Check if app with same ID already exists
    if config.apps.iter().any(|a| a.id == app_config.id) {
        return Err(AppError::new(
            "APP_EXISTS_ERROR",
            &format!("App with ID '{}' already exists", app_config.id),
        ));
    }

    config.apps.push(app_config.clone());
    save_config(app, config.clone()).await?;

    log::info!("Successfully added app: {}", app_config.name);
    Ok(config)
}

/// Update an existing app configuration
#[tauri::command]
pub async fn update_app_config(app: AppHandle, app_config: AppConfig) -> AppResult<GlobalConfig> {
    log::info!("Updating app configuration: {}", app_config.name);

    let mut config = load_config(app.clone()).await?;

    // Find and update the app
    let app_index = config
        .apps
        .iter()
        .position(|a| a.id == app_config.id)
        .ok_or_else(|| {
            AppError::new(
                "APP_NOT_FOUND_ERROR",
                &format!("App with ID '{}' not found", app_config.id),
            )
        })?;

    config.apps[app_index] = app_config.clone();
    save_config(app, config.clone()).await?;

    log::info!("Successfully updated app: {}", app_config.name);
    Ok(config)
}

/// Remove an app configuration
#[tauri::command]
pub async fn remove_app_config(app: AppHandle, app_id: String) -> AppResult<GlobalConfig> {
    log::info!("Removing app configuration: {}", app_id);

    let mut config = load_config(app.clone()).await?;

    // Find and remove the app
    let initial_len = config.apps.len();
    config.apps.retain(|a| a.id != app_id);

    if config.apps.len() == initial_len {
        return Err(AppError::new(
            "APP_NOT_FOUND_ERROR",
            &format!("App with ID '{}' not found", app_id),
        ));
    }

    save_config(app, config.clone()).await?;

    log::info!("Successfully removed app: {}", app_id);
    Ok(config)
}

/// Get information about the configuration directory
#[tauri::command]
pub async fn get_config_info(_app: AppHandle) -> AppResult<serde_json::Value> {
    let config_dir = get_config_dir()?;
    let config_file = get_config_file_path()?;

    let info = serde_json::json!({
        "configDir": config_dir.to_string_lossy(),
        "configFile": config_file.to_string_lossy(),
        "configDirExists": config_dir.exists(),
        "configFileExists": config_file.exists(),
        "lastModified": config_file.metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
    });

    Ok(info)
}

/// Backup the current configuration
#[tauri::command]
pub async fn backup_config(_app: AppHandle) -> AppResult<String> {
    log::info!("Creating configuration backup");

    let config_file = get_config_file_path()?;

    if !config_file.exists() {
        return Err(AppError::new(
            "NO_CONFIG_ERROR",
            "No configuration file exists to backup",
        ));
    }

    // Create backup filename with timestamp
    let timestamp = chrono::Utc::now().format("%Y%m%d_%H%M%S");
    let backup_file = get_config_dir()?.join(format!("apps_backup_{}.json", timestamp));

    fs::copy(&config_file, &backup_file).map_err(|e| {
        AppError::new(
            "BACKUP_ERROR",
            &format!("Failed to create backup: {}", e),
        )
    })?;

    let backup_path = backup_file.to_string_lossy().to_string();
    log::info!("Successfully created backup: {}", backup_path);
    Ok(backup_path)
}

/// Restore configuration from backup
#[tauri::command]
pub async fn restore_config(app: AppHandle, backup_path: String) -> AppResult<GlobalConfig> {
    log::info!("Restoring configuration from backup: {}", backup_path);

    let backup_file = PathBuf::from(&backup_path);

    if !backup_file.exists() {
        return Err(AppError::new(
            "BACKUP_NOT_FOUND_ERROR",
            "Backup file not found",
        ));
    }

    // Read backup file
    let backup_content = fs::read_to_string(&backup_file).map_err(|e| {
        AppError::new(
            "BACKUP_READ_ERROR",
            &format!("Failed to read backup file: {}", e),
        )
    })?;

    // Parse and validate backup
    let config: GlobalConfig = serde_json::from_str(&backup_content).map_err(|e| {
        AppError::new(
            "BACKUP_PARSE_ERROR",
            &format!("Failed to parse backup file: {}", e),
        )
    })?;

    // Save restored config
    save_config(app, config.clone()).await?;

    log::info!("Successfully restored configuration from backup");
    Ok(config)
}
