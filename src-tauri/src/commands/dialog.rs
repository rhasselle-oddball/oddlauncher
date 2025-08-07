use tauri::{command, AppHandle};
use tauri_plugin_dialog::DialogExt;

/// Show a directory picker dialog
#[command]
pub async fn pick_directory(app: AppHandle) -> Result<Option<String>, String> {
    match app.dialog().file().blocking_pick_folder() {
        Some(path) => {
            let path_str = match path {
                tauri_plugin_dialog::FilePath::Path(p) => p.to_string_lossy().to_string(),
                tauri_plugin_dialog::FilePath::Url(u) => u.to_string(),
            };
            Ok(Some(path_str))
        },
        None => Ok(None), // User cancelled
    }
}

/// Validate if a directory exists and is accessible
#[command]
pub async fn validate_directory(path: String) -> Result<bool, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Ok(false);
    }

    if !path.is_dir() {
        return Ok(false);
    }

    // Try to read the directory to check permissions
    match std::fs::read_dir(path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Validate if a file exists and is accessible
#[command]
pub async fn validate_file(path: String) -> Result<bool, String> {
    let path = std::path::Path::new(&path);

    if !path.exists() {
        return Ok(false);
    }

    if !path.is_file() {
        return Ok(false);
    }

    // Try to read file metadata to check permissions
    match std::fs::metadata(path) {
        Ok(_) => Ok(true),
        Err(_) => Ok(false),
    }
}
