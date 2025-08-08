use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

// Helper function to detect if we're in WSL
fn is_wsl() -> bool {
    std::env::var("WSL_DISTRO_NAME").is_ok() ||
    std::env::var("WSLENV").is_ok() ||
    std::path::Path::new("/proc/version").exists() &&
        std::fs::read_to_string("/proc/version")
            .map(|content| content.to_lowercase().contains("microsoft"))
            .unwrap_or(false)
}

// Helper function to convert WSL/Linux paths to Windows paths when needed
fn convert_path_for_windows(path: &str) -> String {
    if path.starts_with("/mnt/c/") {
        // Convert /mnt/c/path to C:\path
        path.replace("/mnt/c/", "C:\\").replace("/", "\\")
    } else if path.starts_with("/mnt/") && path.len() > 5 {
        // Convert /mnt/x/path to X:\path for other drives
        let drive_letter = path.chars().nth(5).unwrap_or('c').to_uppercase().collect::<String>();
        let rest_path = &path[6..]; // Skip "/mnt/x"
        format!("{}:\\{}", drive_letter, rest_path.replace("/", "\\"))
    } else if path.len() > 2 && path.chars().nth(1) == Some(':') {
        // Already a Windows path like C:\path or C:/path - just normalize slashes
        path.replace("/", "\\")
    } else {
        // Return as-is for other paths
        path.to_string()
    }
}

// Helper function to create a hidden Windows command
#[cfg(windows)]
fn create_hidden_windows_command(program: &str, args: &[&str]) -> Command {
    let mut cmd = Command::new(program);
    cmd.args(args);
    // CREATE_NO_WINDOW flag (0x08000000) hides the console window
    cmd.creation_flags(0x08000000);
    cmd
}

// For non-Windows platforms, just create a normal command
#[cfg(not(windows))]
fn create_hidden_windows_command(program: &str, args: &[&str]) -> Command {
    let mut cmd = Command::new(program);
    cmd.args(args);
    cmd
}

// Helper function to create a Windows command that avoids UNC path issues
fn create_windows_file_command(file_path: &str) -> Command {
    let windows_path = convert_path_for_windows(file_path);
    log::info!("Converted path: {} -> {}", file_path, windows_path);

    // Prefer PowerShell Start-Process to avoid UNC CWD issues when invoked from WSL
    if cfg!(target_os = "windows") {
        // On native Windows, `start` is fine and fast
        let mut cmd = create_hidden_windows_command("cmd.exe", &["/C", "start", "", &windows_path]);
        cmd.current_dir("C:\\");
        cmd
    } else {
        // In WSL/Linux, call powershell.exe via interop. Quote with single quotes for safety.
        let ps_arg = format!(
            "Start-Process -FilePath '{}'",
            windows_path.replace("'", "''")
        );
    let cmd = create_hidden_windows_command(
            "powershell.exe",
            &["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps_arg],
        );
        // Don't attempt to set a Windows-style CWD here; interop will map the Linux CWD to a UNC path, which is fine for PowerShell
        cmd
    }
}

#[tauri::command]
pub async fn open_url_in_browser(url: String) -> Result<String, String> {
    log::info!("Opening URL in browser: {}", url);

    // Validate URL format
    if !url.starts_with("http://") && !url.starts_with("https://") && !url.starts_with("file://") {
        return Err("Invalid URL format. Must start with http://, https://, or file://".to_string());
    }

    // Handle file URLs specially to decode and use proper file paths
    let result = if url.starts_with("file://") {
        // Normalize file://file:// edge cases
        let without_scheme = url.strip_prefix("file://").unwrap_or(&url);
        let file_path = without_scheme.strip_prefix("file://").unwrap_or(without_scheme);
        // URL decode the path (replace %20 with spaces, etc.)
        let decoded_path = urlencoding::decode(file_path)
            .map_err(|e| format!("Failed to decode file path: {}", e))?;

        log::info!("Opening file: {}", decoded_path);

        // Determine the best approach based on environment and path
        let is_wsl_env = is_wsl();
        // Detect Windows path: /mnt/x/... or drive-letter form (C:/..., possibly with leading /C:/)
        let looks_like_drive = {
            let p = decoded_path.trim_start_matches('/');
            p.len() > 2 && p.chars().nth(1) == Some(':')
        };
        let is_windows_path = decoded_path.starts_with("/mnt/") || looks_like_drive;

    if is_wsl_env {
            log::info!("Detected WSL environment");

            // Try wslview first (best option for WSL)
            let wslview_result = Command::new("wslview")
                .arg(&decoded_path.to_string())
                .status();

            match wslview_result {
                Ok(status) if status.success() => {
                    log::info!("Successfully opened with wslview");
                    Ok(status)
                },
                _ => {
                    log::info!("wslview failed or not available, falling back to Windows commands");

                    if is_windows_path {
                        // Windows path in WSL - use PowerShell Start-Process to avoid UNC CWD problems
                        create_windows_file_command(&decoded_path).status()
                    } else {
                        // Linux path in WSL - try xdg-open first, then wslview
                        let xdg_result = Command::new("xdg-open")
                            .arg(&decoded_path.to_string())
                            .status();

                        match xdg_result {
                            Ok(status) if status.success() => Ok(status),
                            _ => {
                                log::info!("xdg-open failed, trying direct wslview");
                                Command::new("wslview")
                                    .arg(&decoded_path.to_string())
                                    .status()
                            }
                        }
                    }
                }
            }
    } else if cfg!(target_os = "windows") {
            // Pure Windows environment
            let windows_path = convert_path_for_windows(&decoded_path);
            create_hidden_windows_command("cmd", &["/C", "start", "", &windows_path])
                .status()
        } else if cfg!(target_os = "macos") {
            Command::new("open")
                .arg(&decoded_path.to_string())
                .status()
        } else {
            // Pure Linux environment
            Command::new("xdg-open")
                .arg(&decoded_path.to_string())
                .status()
        }
    } else {
        // Handle regular http/https URLs
        if is_wsl() {
            // In WSL, prefer wslview; fall back to PowerShell Start-Process
            let wslview_result = Command::new("wslview")
                .arg(&url)
                .status();

            match wslview_result {
                Ok(status) if status.success() => wslview_result,
                _ => {
                    let ps_arg = format!(
                        "Start-Process -FilePath '{}'",
                        url.replace("'", "''")
                    );
                    create_hidden_windows_command(
                        "powershell.exe",
                        &["-NoProfile", "-WindowStyle", "Hidden", "-Command", &ps_arg],
                    )
                    .status()
                }
            }
        } else if cfg!(target_os = "windows") {
            create_hidden_windows_command("cmd", &["/C", "start", "", &url])
                .status()
        } else if cfg!(target_os = "macos") {
            Command::new("open")
                .arg(&url)
                .status()
        } else {
            // Linux and other Unix-like systems
            Command::new("xdg-open")
                .arg(&url)
                .status()
        }
    };

    match result {
        Ok(status) if status.success() => {
            log::info!("Successfully opened URL: {}", url);
            Ok(format!("Successfully opened {}", url))
        },
        Ok(status) => {
            let error = format!("Failed to open URL {}: process exited with code {:?}", url, status.code());
            log::error!("{}", error);
            Err(error)
        },
        Err(e) => {
            let error = format!("Failed to open URL {}: {}", url, e);
            log::error!("{}", error);
            Err(error)
        }
    }
}

#[tauri::command]
pub async fn check_port_ready(url: String) -> Result<bool, String> {
    log::info!("Checking if URL is accessible: {}", url);

    // Simple check using reqwest to see if the URL responds
    match reqwest::get(&url).await {
        Ok(response) if response.status().is_success() => {
            log::info!("URL {} is ready (status: {})", url, response.status());
            Ok(true)
        },
        Ok(response) => {
            log::warn!("URL {} returned non-success status: {}", url, response.status());
            Ok(false)
        },
        Err(e) => {
            log::warn!("URL {} is not ready: {}", url, e);
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn wait_for_port_ready(url: String, timeout_seconds: u64) -> Result<bool, String> {
    log::info!("Waiting for URL to be ready: {} (timeout: {}s)", url, timeout_seconds);

    let start = std::time::Instant::now();
    let timeout_duration = std::time::Duration::from_secs(timeout_seconds);

    while start.elapsed() < timeout_duration {
        match check_port_ready(url.clone()).await {
            Ok(true) => {
                log::info!("URL {} became ready after {:?}", url, start.elapsed());
                return Ok(true);
            },
            Ok(false) => {
                // Wait a bit before checking again
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            },
            Err(e) => {
                log::warn!("Error checking URL {}: {}", url, e);
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            }
        }
    }

    log::warn!("URL {} did not become ready within {}s", url, timeout_seconds);
    Ok(false)
}
