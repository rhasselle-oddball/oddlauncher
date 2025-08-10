use crate::models::app::{AppProcess, AppStatus};
use crate::commands::terminal::get_terminal_command;
use serde::{Deserialize, Serialize};
use serde_json;
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

#[cfg(unix)]
#[allow(unused_imports)]
use std::os::unix::process::CommandExt;
#[cfg(unix)]
use libc;

// Process management module for OddLauncher application

/**
 * Cross-platform path and command utilities
 */
mod platform_utils {
    use std::path::Path;

    /// Convert various path formats to the appropriate format for the current platform
    pub fn normalize_path(path: &str) -> Result<String, String> {
        log::info!("Normalizing path: '{}'", path);

        // Handle WSL network paths from Windows
        if path.starts_with("\\\\wsl.localhost\\") || path.starts_with("//wsl.localhost/") {
            return convert_wsl_network_path(path);
        }

        // Handle different path separators
        let normalized = if cfg!(target_os = "windows") {
            // On Windows, handle both forward and back slashes
            if path.contains('/') && !path.contains('\\') && !path.starts_with('/') {
                // Convert forward slashes to backslashes for Windows paths
                path.replace('/', "\\")
            } else {
                path.to_string()
            }
        } else {
            // On Unix-like systems, convert backslashes to forward slashes
            if path.contains('\\') {
                path.replace('\\', "/")
            } else {
                path.to_string()
            }
        };

        log::info!("Normalized path: '{}' -> '{}'", path, normalized);
        Ok(normalized)
    }

    /// Convert WSL network paths to appropriate format
    fn convert_wsl_network_path(path: &str) -> Result<String, String> {
        log::info!("Converting WSL network path: '{}'", path);

        // Remove the network prefix
        let cleaned = path
            .replace("\\\\wsl.localhost\\", "")
            .replace("//wsl.localhost/", "");

        let parts: Vec<&str> = cleaned.split(&['\\', '/'][..]).collect();

        if parts.len() < 2 {
            return Err(format!("Invalid WSL path format: {}", path));
        }

        // Skip the distro name (e.g., Ubuntu) and convert to Unix path
        let unix_path = format!("/{}", parts[1..].join("/"));

        let result = if cfg!(target_os = "windows") {
            // On Windows, we might need to use wsl.exe to execute commands
            unix_path
        } else {
            // On Linux/Unix, use the path directly
            unix_path
        };

        log::info!("Converted WSL path: '{}' -> '{}'", path, result);
        Ok(result)
    }

    /// Prepare command for cross-platform execution
    pub fn prepare_command(command: &str, working_dir: Option<&str>) -> Result<(String, Vec<String>), String> {
        let parts: Vec<&str> = command.trim().split_whitespace().collect();
        if parts.is_empty() {
            return Err("Command cannot be empty".to_string());
        }

        let program = parts[0];
        let args: Vec<String> = parts[1..].iter().map(|s| s.to_string()).collect();

        // Check if we need to run through WSL on Windows
        if cfg!(target_os = "windows") && should_use_wsl(program, working_dir) {
            return prepare_wsl_command(program, &args, working_dir);
        }

        Ok((program.to_string(), args))
    }

    /// Check if command should be executed through WSL
    fn should_use_wsl(_program: &str, working_dir: Option<&str>) -> bool {
        // Only use WSL if working directory explicitly indicates WSL usage
        working_dir
            .map(|dir| dir.starts_with("/") || dir.contains("wsl.localhost"))
            .unwrap_or(false)
    }

    /// Prepare command for WSL execution on Windows
    fn prepare_wsl_command(program: &str, args: &[String], working_dir: Option<&str>) -> Result<(String, Vec<String>), String> {
        log::info!("Preparing WSL command: {} with args: {:?}", program, args);

        let mut wsl_args = vec![];

        // Add working directory if specified
        if let Some(dir) = working_dir {
            let normalized_dir = normalize_path(dir)?;
            if normalized_dir.starts_with('/') {
                wsl_args.extend_from_slice(&["--cd".to_string(), normalized_dir]);
            }
        }

        // Add the command and its arguments
        wsl_args.push(program.to_string());
        wsl_args.extend_from_slice(args);

        log::info!("WSL command prepared: wsl.exe {:?}", wsl_args);
        Ok(("wsl.exe".to_string(), wsl_args))
    }

    /// Validate that a directory exists and is accessible
    pub fn validate_directory(path: &str) -> Result<String, String> {
        let normalized = normalize_path(path)?;

        if cfg!(target_os = "windows") && path.starts_with('/') {
            // On Windows, Unix-style paths might be WSL paths
            // We'll validate them differently
            log::info!("Windows detected with Unix path - assuming WSL path: {}", normalized);
            return Ok(normalized);
        }

        if !Path::new(&normalized).exists() {
            return Err(format!("Directory does not exist: {}", normalized));
        }

        if !Path::new(&normalized).is_dir() {
            return Err(format!("Path is not a directory: {}", normalized));
        }

        Ok(normalized)
    }
}

/// Prepare multi-command execution using shell script approach
fn prepare_multi_command_execution(launch_commands: &str, working_dir: Option<&str>, terminal_type: Option<&str>) -> Result<(String, Vec<String>), String> {
    log::info!("Preparing multi-command execution: '{}'", launch_commands);

    // If terminal_type is specified, use the new terminal command system
    if let Some(term_type) = terminal_type {
        log::info!("Using terminal type: {}", term_type);
        let command_args = get_terminal_command(term_type, launch_commands, working_dir);
        if command_args.len() >= 2 {
            let program = command_args[0].clone();
            let args = command_args[1..].to_vec();
            return Ok((program, args));
        }
    }

    // Fallback to legacy behavior when no terminal type is specified
    log::info!("No terminal type specified, using legacy shell detection");

    // Split commands by lines and filter out empty lines
    let commands: Vec<&str> = launch_commands
        .lines()
        .map(|line| line.trim())
        .filter(|line| !line.is_empty())
        .collect();

    if commands.is_empty() {
        return Err("No valid commands found".to_string());
    }

    // Log all commands that will be executed
    log::info!("Commands to execute: {:?}", commands);

    // For single command, use the existing prepare_command logic for backwards compatibility
    if commands.len() == 1 {
        log::info!("Single command detected, using legacy approach");
        return platform_utils::prepare_command(commands[0], working_dir);
    }

    // For multiple commands, create a shell script
    let shell_script = if cfg!(target_os = "windows") {
        prepare_windows_multi_command(&commands, working_dir)?
    } else {
        prepare_unix_multi_command(&commands, working_dir)?
    };

    log::info!("Multi-command shell script prepared");
    Ok(shell_script)
}

/// Prepare multi-command execution for Windows
fn prepare_windows_multi_command(commands: &[&str], working_dir: Option<&str>) -> Result<(String, Vec<String>), String> {
    // Check if we should use WSL - only if working directory indicates WSL usage
    let use_wsl = working_dir
        .map(|dir| dir.starts_with("/") || dir.contains("wsl.localhost"))
        .unwrap_or(false);

    if use_wsl {
        // Create bash script for WSL with clean environment to avoid Windows PATH conflicts
        let mut script_lines = vec![
            "#!/bin/bash".to_string(),
            "set -e".to_string(),
            "".to_string(),
            "# Clean PATH to avoid Windows executable conflicts".to_string(),
            "# Remove Windows paths (/mnt/c/...) that cause WSL to use Windows tools instead of Linux versions".to_string(),
            "export PATH=\"$(echo $PATH | tr ':' '\\n' | grep -v '^/mnt/c' | tr '\\n' ':' | sed 's/:$//')\"".to_string(),
            "".to_string(),
            "# Add standard Linux paths to ensure we have essential tools".to_string(),
            "export PATH=\"/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:$PATH\"".to_string(),
            "".to_string(),
            "# Add user bin directories if they exist".to_string(),
            "[ -d \"$HOME/.local/bin\" ] && export PATH=\"$HOME/.local/bin:$PATH\"".to_string(),
            "[ -d \"$HOME/bin\" ] && export PATH=\"$HOME/bin:$PATH\"".to_string(),
            "".to_string(),
            "# Initialize shell environment".to_string(),
            "source /etc/profile 2>/dev/null || true".to_string(),
            "source ~/.profile 2>/dev/null || true".to_string(),
            "source ~/.bashrc 2>/dev/null || true".to_string(),
            "".to_string(),
            "# Initialize common version managers".to_string(),
            "# nvm".to_string(),
            "if [ -f ~/.nvm/nvm.sh ]; then".to_string(),
            "    source ~/.nvm/nvm.sh".to_string(),
            "elif [ -f /usr/local/share/nvm/nvm.sh ]; then".to_string(),
            "    source /usr/local/share/nvm/nvm.sh".to_string(),
            "fi".to_string(),
            "".to_string(),
            "# rbenv".to_string(),
            "if command -v rbenv >/dev/null 2>&1; then".to_string(),
            "    eval \"$(rbenv init -)\"".to_string(),
            "fi".to_string(),
            "".to_string(),
            "# Debug: Show which executables we'll use".to_string(),
            "echo \"OddLauncher: Using clean WSL environment\"".to_string(),
            "echo \"OddLauncher: PATH=$PATH\"".to_string(),
            "for tool in node npm yarn; do".to_string(),
            "    if command -v $tool >/dev/null 2>&1; then".to_string(),
            "        echo \"OddLauncher: Found $tool at $(which $tool)\"".to_string(),
            "    else".to_string(),
            "        echo \"OddLauncher: Tool $tool not found in PATH\"".to_string(),
            "    fi".to_string(),
            "done".to_string(),
            "".to_string(),
        ];

        // Add working directory change if specified
        if let Some(dir) = working_dir {
            let normalized_dir = platform_utils::normalize_path(dir)?;
            if normalized_dir.starts_with('/') {
                script_lines.push(format!("echo \"OddLauncher: Changing to directory: {}\"", normalized_dir));
                script_lines.push(format!("cd '{}'", normalized_dir));
                script_lines.push("".to_string());
            }
        }

        // Add all commands with logging
        for (i, command) in commands.iter().enumerate() {
            script_lines.push(format!("echo \"OddLauncher: Executing command {}: {}\"", i + 1, command));
            script_lines.push(command.to_string());
            if i < commands.len() - 1 {
                script_lines.push("".to_string());
            }
        }

        let script_content = script_lines.join("\n");
        log::info!("Generated WSL bash script:\n{}", script_content);

        // Use WSL to execute bash with the script
        let wsl_args = vec![
            "bash".to_string(),
            "-c".to_string(),
            script_content,
        ];

        Ok(("wsl.exe".to_string(), wsl_args))
    } else {
        // Create batch script for Windows
        let mut script_lines = vec!["@echo off".to_string(), "setlocal enabledelayedexpansion".to_string()];

        // Add working directory change if specified
        if let Some(dir) = working_dir {
            let normalized_dir = platform_utils::normalize_path(dir)?;
            script_lines.push(format!("cd /d \"{}\"", normalized_dir));
        }

        // Add error handling and commands
        for command in commands {
            script_lines.push(command.to_string());
            script_lines.push("if !errorlevel! neq 0 exit /b !errorlevel!".to_string());
        }

        let script_content = script_lines.join("\n");

        Ok(("cmd.exe".to_string(), vec!["/c".to_string(), script_content]))
    }
}

/// Prepare multi-command execution for Unix systems
fn prepare_unix_multi_command(commands: &[&str], working_dir: Option<&str>) -> Result<(String, Vec<String>), String> {
    let mut script_lines = vec!["#!/bin/bash".to_string(), "set -e".to_string()];

    // Add initial logging to show what we're executing
    script_lines.push("echo \"OddLauncher: Starting app process...\"".to_string());

    // Check if any commands use nvm, rbenv, or other version managers that need shell initialization
    let needs_nvm = commands.iter().any(|cmd| {
        let first_word = cmd.trim().split_whitespace().next().unwrap_or("");
        first_word == "nvm" || cmd.contains("nvm ")
    });

    let needs_rbenv = commands.iter().any(|cmd| {
        let first_word = cmd.trim().split_whitespace().next().unwrap_or("");
        first_word == "rbenv" || cmd.contains("rbenv ")
    });

    // Add shell initialization for version managers if needed
    if needs_nvm {
        // Source nvm if available - try common locations
        script_lines.push("# Initialize nvm if available".to_string());
        script_lines.push("if [ -f ~/.nvm/nvm.sh ]; then".to_string());
        script_lines.push("  source ~/.nvm/nvm.sh".to_string());
        script_lines.push("elif [ -f /usr/local/share/nvm/nvm.sh ]; then".to_string());
        script_lines.push("  source /usr/local/share/nvm/nvm.sh".to_string());
        script_lines.push("elif [ -f /opt/homebrew/opt/nvm/nvm.sh ]; then".to_string());
        script_lines.push("  source /opt/homebrew/opt/nvm/nvm.sh".to_string());
        script_lines.push("fi".to_string());
    }

    if needs_rbenv {
        // Initialize rbenv if available
        script_lines.push("# Initialize rbenv if available".to_string());
        script_lines.push("if command -v rbenv >/dev/null 2>&1; then".to_string());
        script_lines.push("  eval \"$(rbenv init -)\"".to_string());
        script_lines.push("fi".to_string());
    }

    // Add working directory change if specified
    if let Some(dir) = working_dir {
        let normalized_dir = platform_utils::normalize_path(dir)?;
    script_lines.push(format!("echo \"OddLauncher: Changing to working directory: {}\"", normalized_dir));
        script_lines.push(format!("cd '{}'", normalized_dir));
    }

    // Add command execution with logging
    for (i, command) in commands.iter().enumerate() {
    script_lines.push(format!("echo \"OddLauncher: Executing command {}: {}\"", i + 1, command));
        script_lines.push(command.to_string());
    }

    let script_content = script_lines.join("\n");
    log::info!("Generated Unix shell script:\n{}", script_content);

    Ok(("bash".to_string(), vec!["-c".to_string(), script_content]))
}

/**
 * Process manager state to track running processes
 */
pub struct ProcessManager {
    pub processes: Arc<Mutex<HashMap<String, ProcessInfo>>>,
}

/**
 * Information about a running process
 */
#[derive(Debug)]
pub struct ProcessInfo {
    pub pid: u32,
    pub started_at: String,
    // On Unix, this is the process group id (pgid) that we assign to the child.
    // On Windows, this will be None.
    pub pgid: Option<i32>,
}

/**
 * Result type for process operations
 */
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessResult {
    pub success: bool,
    pub message: String,
    pub pid: Option<u32>,
    pub error: Option<String>,
}

impl Default for ProcessManager {
    fn default() -> Self {
        Self {
            processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

/**
 * Start a new process for an app
 */
#[tauri::command]
pub async fn start_app_process(
    app_id: String,
    launch_commands: Option<String>,
    working_directory: Option<String>,
    environment_variables: Option<HashMap<String, String>>,
    url: Option<String>,
    auto_launch_browser: Option<bool>,
    browser_delay: Option<u32>,
    port_to_check: Option<u16>,
    port_check_timeout: Option<u32>,
    terminal_type: Option<String>,
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Starting process for app: {}", app_id);

    // Check if this is a bookmark app (no launch commands)
    let is_bookmark = launch_commands.as_ref().map_or(true, |cmd| cmd.trim().is_empty());

    if is_bookmark {
        log::info!("Bookmark app detected - opening URL only");

        // For bookmark apps, we only handle browser launching
        if let Some(url) = url {
            // Use the browser command to open URL
            match crate::commands::browser::open_url_in_browser(url.clone()).await {
                Ok(_message) => {
                    // Emit success event for bookmark opening
                    let _ = app_handle.emit("process-started", serde_json::json!({
                        "appId": app_id,
                        "message": format!("Opened URL: {}", url)
                    }));

                    return Ok(ProcessResult {
                        success: true,
                        message: format!("Opened URL: {}", url),
                        pid: None,
                        error: None,
                    });
                },
                Err(error_msg) => {
                    let _ = app_handle.emit("process-error", serde_json::json!({
                        "appId": app_id,
                        "message": error_msg.clone()
                    }));

                    return Ok(ProcessResult {
                        success: false,
                        message: error_msg.clone(),
                        pid: None,
                        error: Some(error_msg),
                    });
                }
            }
        } else {
            return Ok(ProcessResult {
                success: false,
                message: "Bookmark apps require a URL".to_string(),
                pid: None,
                error: Some("No URL provided for bookmark app".to_string()),
            });
        }
    }

    // Handle process apps (with launch commands)
    let launch_commands = launch_commands.unwrap_or_default();
    log::info!("Raw launch commands: {}", launch_commands);
    if let Some(ref dir) = working_directory {
        log::info!("Raw working directory: {}", dir);
    }
    if let Some(ref env_vars) = environment_variables {
        log::info!("Environment variables: {:?}", env_vars);
    }

    // Check if process is already running
    {
        let processes = process_manager.processes.lock().unwrap();
        if processes.contains_key(&app_id) {
            return Ok(ProcessResult {
                success: false,
                message: "Process is already running".to_string(),
                pid: None,
                error: Some("Process already exists".to_string()),
            });
        }
    }

    // Normalize working directory using cross-platform utilities
    let normalized_working_dir = if let Some(ref dir) = working_directory {
        match platform_utils::validate_directory(dir) {
            Ok(normalized) => {
                log::info!("Working directory normalized: '{}' -> '{}'", dir, normalized);
                Some(normalized)
            },
            Err(e) => {
                log::warn!("Working directory validation warning: {} (proceeding anyway for WSL compatibility)", e);
                // For WSL paths, we'll proceed even if validation fails on Windows
                match platform_utils::normalize_path(dir) {
                    Ok(normalized) => {
                        log::info!("Working directory normalized (WSL mode): '{}' -> '{}'", dir, normalized);
                        Some(normalized)
                    },
                    Err(e) => {
                        let error_msg = format!("Failed to normalize working directory: {}", e);
                        log::error!("{}", error_msg);

                        // Emit process error event
                        let _ = app_handle.emit("process-error", serde_json::json!({
                            "appId": app_id,
                            "error": error_msg
                        }));

                        return Ok(ProcessResult {
                            success: false,
                            message: error_msg.clone(),
                            pid: None,
                            error: Some(error_msg),
                        });
                    }
                }
            }
        }
    } else {
        None
    };

    // Prepare multi-command execution using shell script approach
    let (program, args) = match prepare_multi_command_execution(&launch_commands, normalized_working_dir.as_deref(), terminal_type.as_deref()) {
        Ok((prog, args)) => {
            log::info!("Multi-command execution prepared - Program: '{}', Args: {:?}", prog, args);
            (prog, args)
        },
        Err(e) => {
            let error_msg = format!("Failed to prepare launch commands: {}", e);
            log::error!("{}", error_msg);

            // Emit process error event
            let _ = app_handle.emit("process-error", serde_json::json!({
                "appId": app_id,
                "error": error_msg
            }));

            return Ok(ProcessResult {
                success: false,
                message: error_msg.clone(),
                pid: None,
                error: Some(error_msg),
            });
        }
    };

    // Create the command
    let mut cmd = TokioCommand::new(&program);
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .stdin(Stdio::null());

    // On Unix, ensure the child starts in its own process group so we can signal the whole tree
    #[cfg(unix)]
    unsafe {
        cmd.pre_exec(|| {
            // Set child to its own process group (pgid = pid)
            let ret = libc::setpgid(0, 0);
            if ret != 0 {
                // Even if setpgid fails, continue; we'll still attempt to kill by pid.
            }
            Ok(())
        });
    }

    // Set working directory if provided (but only for non-WSL commands on Windows)
    if let Some(ref dir) = normalized_working_dir {
        // Skip directory setting for WSL commands on Windows as wsl.exe handles it
        if !(cfg!(target_os = "windows") && program == "wsl.exe") {
            log::info!("Setting working directory to: {}", dir);

            // For WSL paths on Windows, we might not be able to validate existence
            let path_exists = if cfg!(target_os = "windows") && dir.starts_with('/') {
                log::info!("Skipping directory existence check for WSL path on Windows: {}", dir);
                true // Assume WSL path exists
            } else {
                std::path::Path::new(dir).exists()
            };

            if !path_exists {
                let error_msg = format!("Working directory does not exist: {}", dir);
                log::error!("{}", error_msg);

                // Emit process error event
                let _ = app_handle.emit("process-error", serde_json::json!({
                    "appId": app_id,
                    "error": error_msg
                }));

                return Ok(ProcessResult {
                    success: false,
                    message: error_msg.clone(),
                    pid: None,
                    error: Some(error_msg),
                });
            }

            cmd.current_dir(dir);
        } else {
            log::info!("Skipping working directory setting for WSL command (handled by wsl.exe --cd)");
        }
    }

    // Set environment variables if provided
    if let Some(env_vars) = &environment_variables {
        for (key, value) in env_vars {
            log::debug!("Setting env var: {}={}", key, value);
            cmd.env(key, value);
        }
    }

    log::info!("About to spawn process with command: {} {:?}", program, args);

    // Spawn the process
    let mut child = match cmd.spawn() {
        Ok(child) => {
            log::info!("Process spawned successfully");
            child
        },
        Err(e) => {
            let error_msg = format!("Failed to start process: {} (launch_commands: '{}', working_dir: '{:?}')",
                e, launch_commands, working_directory);
            log::error!("{}", error_msg);

            // Provide more specific error information
            let detailed_error = match e.kind() {
                std::io::ErrorKind::NotFound => {
                    format!("Command not found: '{}'. Make sure the command exists and is in your PATH.", program)
                },
                std::io::ErrorKind::PermissionDenied => {
                    format!("Permission denied when trying to execute: '{}'", program)
                },
                _ => {
                    format!("Failed to start process: {}", e)
                }
            };

            // Emit process error event
            let _ = app_handle.emit("process-error", serde_json::json!({
                "appId": app_id,
                "error": detailed_error
            }));

            return Ok(ProcessResult {
                success: false,
                message: detailed_error.clone(),
                pid: None,
                error: Some(detailed_error),
            });
        }
    };

    let pid = child.id().unwrap_or(0);
    #[cfg(unix)]
    let pgid: Option<i32> = Some(pid as i32);
    #[cfg(not(unix))]
    let pgid: Option<i32> = None;
    let started_at = chrono::Utc::now().to_rfc3339();

    log::info!("Process started with PID: {} for app: {}", pid, app_id);

    // Clone handles for async tasks
    let app_handle_clone = app_handle.clone();
    let app_id_clone = app_id.clone();

    // Handle stdout
    if let Some(stdout) = child.stdout.take() {
        let app_handle_stdout = app_handle_clone.clone();
        let app_id_stdout = app_id_clone.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(stdout);
            let mut line = String::new();

            loop {
                match reader.read_line(&mut line).await {
                    Ok(0) => {
                        // EOF: if there's leftover data without a trailing newline, emit it
                        if !line.is_empty() {
                            let output_line = line.trim_end().to_string();
                            let _ = app_handle_stdout.emit("process-output", serde_json::json!({
                                "appId": app_id_stdout,
                                "type": "stdout",
                                "content": output_line,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));
                            line.clear();
                        }
                        break;
                    }
                    Ok(_) => {
                        let output_line = line.trim_end().to_string();

                        // Emit to frontend
                        let _ = app_handle_stdout.emit("process-output", serde_json::json!({
                            "appId": app_id_stdout,
                            "type": "stdout",
                            "content": output_line,
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }));

                        line.clear();
                    }
                    Err(e) => {
                        log::error!("Error reading stdout: {}", e);
                        break;
                    }
                }
            }
        });
    }

    // Handle stderr
    if let Some(stderr) = child.stderr.take() {
        let app_handle_stderr = app_handle_clone.clone();
        let app_id_stderr = app_id_clone.clone();

        tokio::spawn(async move {
            let mut reader = BufReader::new(stderr);
            let mut line = String::new();

            loop {
                match reader.read_line(&mut line).await {
                    Ok(0) => {
                        // EOF: emit any leftover data without trailing newline
                        if !line.is_empty() {
                            let output_line = line.trim_end().to_string();
                            let _ = app_handle_stderr.emit("process-output", serde_json::json!({
                                "appId": app_id_stderr,
                                "type": "stderr",
                                "content": output_line,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));
                            line.clear();
                        }
                        break;
                    }
                    Ok(_) => {
                        let output_line = line.trim_end().to_string();

                        // Emit to frontend
                        let _ = app_handle_stderr.emit("process-output", serde_json::json!({
                            "appId": app_id_stderr,
                            "type": "stderr",
                            "content": output_line,
                            "timestamp": chrono::Utc::now().to_rfc3339()
                        }));

                        line.clear();
                    }
                    Err(e) => {
                        log::error!("Error reading stderr: {}", e);
                        break;
                    }
                }
            }
        });
    }

    // Monitor process exit
    let app_handle_monitor = app_handle_clone.clone();
    let app_id_monitor = app_id_clone.clone();
    let process_manager_arc = Arc::clone(&process_manager.processes);

    tokio::spawn(async move {
        let exit_status = child.wait().await;

        // Remove from process manager
        {
            let mut processes = process_manager_arc.lock().unwrap();
            processes.remove(&app_id_monitor);
        }

        match exit_status {
            Ok(status) => {
                let exit_code = status.code();
                log::info!("Process {} exited with status: {}", app_id_monitor, status);

                // Provide helpful error messages for common exit codes
                let exit_message = match exit_code {
                    Some(127) => "OddLauncher: Process exited with code 127 (Command not found - check if executable exists in PATH)".to_string(),
                    Some(126) => "OddLauncher: Process exited with code 126 (Permission denied - executable not permitted to run)".to_string(),
                    Some(1) => "OddLauncher: Process exited with code 1 (General error - check command syntax and arguments)".to_string(),
                    Some(2) => "OddLauncher: Process exited with code 2 (Misuse of shell builtins - check command usage)".to_string(),
                    Some(130) => "OddLauncher: Process exited with code 130 (Process terminated by Ctrl+C)".to_string(),
                    Some(code) => format!("OddLauncher: Process exited with code {}", code),
                    None => "OddLauncher: Process exited (no exit code available)".to_string(),
                };

                // Also emit a final output line for terminal visibility
                let _ = app_handle_monitor.emit("process-output", serde_json::json!({
                    "appId": app_id_monitor,
                    "type": "stdout",
                    "content": exit_message,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));

                let _ = app_handle_monitor.emit("process-exit", serde_json::json!({
                    "appId": app_id_monitor,
                    "exitCode": exit_code,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
            Err(e) => {
                log::error!("Process {} failed: {}", app_id_monitor, e);

                let _ = app_handle_monitor.emit("process-output", serde_json::json!({
                    "appId": app_id_monitor,
                    "type": "stderr",
                    "content": format!("OddLauncher: Process wait failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));

                let _ = app_handle_monitor.emit("process-error", serde_json::json!({
                    "appId": app_id_monitor,
                    "error": format!("Process failed: {}", e),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
        }
    });

    // Store process info
    let process_info = ProcessInfo {
        pid,
        started_at: started_at.clone(),
        pgid,
    };

    {
        let mut processes = process_manager.processes.lock().unwrap();
        processes.insert(app_id.clone(), process_info);
    }

    // Emit process started event
    let _ = app_handle.emit("process-started", serde_json::json!({
        "appId": app_id,
        "pid": pid,
        "startedAt": started_at
    }));

    // Handle browser auto-launch if configured
    if let Some(url) = url {
        let should_launch = auto_launch_browser.unwrap_or(true);

        if should_launch {
            let app_handle_browser = app_handle.clone();
            let app_id_browser = app_id.clone();
            let browser_delay = browser_delay.unwrap_or(0);
            let port_to_check = port_to_check;
            let port_check_timeout = port_check_timeout.unwrap_or(30);

            tokio::spawn(async move {
                // Wait for the specified delay
                if browser_delay > 0 {
                    log::info!("Waiting {}s before launching browser for app: {}", browser_delay, app_id_browser);
                    tokio::time::sleep(std::time::Duration::from_secs(browser_delay as u64)).await;
                }

                let launch_url = if let Some(port) = port_to_check {
                    // If port check is configured, wait for the port to be ready
                    let check_url = if url.contains("://") {
                        url.clone()
                    } else {
                        format!("http://localhost:{}", port)
                    };

                    log::info!("Checking if port {} is ready for app: {}", port, app_id_browser);

                    match crate::commands::wait_for_port_ready(check_url.clone(), port_check_timeout as u64).await {
                        Ok(true) => {
                            log::info!("Port {} is ready for app: {}", port, app_id_browser);
                            Some(url)
                        },
                        Ok(false) => {
                            log::warn!("Port {} was not ready within {}s for app: {}, skipping browser launch", port, port_check_timeout, app_id_browser);

                            // Emit browser launch failure event
                            let _ = app_handle_browser.emit("browser-launch-failed", serde_json::json!({
                                "appId": app_id_browser,
                                "reason": "Port not ready within timeout",
                                "url": url,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));

                            None
                        },
                        Err(e) => {
                            log::error!("Error checking port readiness for app {}: {}", app_id_browser, e);

                            // Emit browser launch failure event
                            let _ = app_handle_browser.emit("browser-launch-failed", serde_json::json!({
                                "appId": app_id_browser,
                                "reason": format!("Error checking port: {}", e),
                                "url": url,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));

                            None
                        }
                    }
                } else {
                    // No port checking, launch immediately
                    Some(url)
                };

                if let Some(launch_url) = launch_url {
                    log::info!("Launching browser for app: {} with URL: {}", app_id_browser, launch_url);

                    match crate::commands::open_url_in_browser(launch_url.clone()).await {
                        Ok(_) => {
                            log::info!("Successfully launched browser for app: {}", app_id_browser);

                            // Emit browser launch success event
                            let _ = app_handle_browser.emit("browser-launched", serde_json::json!({
                                "appId": app_id_browser,
                                "url": launch_url,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));
                        },
                        Err(e) => {
                            log::error!("Failed to launch browser for app {}: {}", app_id_browser, e);

                            // Emit browser launch failure event
                            let _ = app_handle_browser.emit("browser-launch-failed", serde_json::json!({
                                "appId": app_id_browser,
                                "reason": e,
                                "url": launch_url,
                                "timestamp": chrono::Utc::now().to_rfc3339()
                            }));
                        }
                    }
                }
            });
        } else {
            log::info!("Auto-launch browser disabled for app: {}", app_id);
        }
    }

    Ok(ProcessResult {
        success: true,
        message: "Process started successfully".to_string(),
        pid: Some(pid),
        error: None,
    })
}

/**
 * Stop a running process
 */
#[tauri::command]
pub async fn stop_app_process(
    app_id: String,
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Stopping process for app: {}", app_id);

    let process_info = {
        let mut processes = process_manager.processes.lock().unwrap();
        match processes.remove(&app_id) {
            Some(process) => process,
            None => {
                return Ok(ProcessResult {
                    success: false,
                    message: "Process not found or not running".to_string(),
                    pid: None,
                    error: Some("Process not found".to_string()),
                });
            }
        }
    };

    // Cross-platform, reliable termination of the whole process tree
    let pid_u32 = process_info.pid;
    #[cfg(unix)]
    let pgid_i32 = process_info.pgid.unwrap_or(pid_u32 as i32);

    // Helper to wait for process to exit with timeout
    async fn wait_for_exit(pid: u32, timeout_ms: u64) -> bool {
        // Portable lightweight check: try sending signal 0 on Unix, or rely on waitpid via ps fallback
        #[cfg(unix)]
        {
            use tokio::time::{sleep, Duration, Instant};
            let start = Instant::now();
            loop {
                // kill(pid, 0) returns 0 if process exists, -1 otherwise
                let exists = unsafe { libc::kill(pid as i32, 0) == 0 };
                if !exists {
                    return true;
                }
                if start.elapsed() > Duration::from_millis(timeout_ms) {
                    return false;
                }
                sleep(Duration::from_millis(100)).await;
            }
        }
        #[cfg(windows)]
        {
            use tokio::time::{sleep, Duration, Instant};
            // Best-effort check using tasklist filtering by PID
            let start = Instant::now();
            loop {
                let out = tokio::process::Command::new("tasklist")
                    .arg("/FI").arg(format!("PID eq {}", pid))
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .output()
                    .await;
                let running = match out {
                    Ok(o) => {
                        let s = String::from_utf8_lossy(&o.stdout);
                        s.contains(&pid.to_string())
                    }
                    Err(_) => false,
                };
                if !running {
                    return true;
                }
                if start.elapsed() > Duration::from_millis(timeout_ms) {
                    return false;
                }
                sleep(Duration::from_millis(100)).await;
            }
        }
    }

    // Termination strategy:
    // 1) Gentle: SIGINT (or CTRL+C equivalent). 2) SIGTERM. 3) SIGKILL / taskkill force. Each with waits.
    let mut success = false;
    let mut last_error: Option<String> = None;

    #[cfg(unix)]
    {
        // Send to process group if possible (negative pgid)
        let targets = [
            (libc::SIGINT, "SIGINT"),
            (libc::SIGTERM, "SIGTERM"),
            (libc::SIGKILL, "SIGKILL"),
        ];
        for (sig, name) in targets.iter() {
            let target = -(pgid_i32);
            let rc = unsafe { libc::kill(target, *sig) };
            if rc != 0 {
                let err = std::io::Error::last_os_error();
                log::warn!("Failed to send {} to pgid {}: {}", name, pgid_i32, err);
                last_error = Some(format!("{} to group failed: {}", name, err));
            } else {
                log::info!("Sent {} to process group {} (app {})", name, pgid_i32, app_id);
            }
            // Wait up to 2s after INT/TERM, 1s after KILL
            let timeout = if *sig == libc::SIGKILL { 1000 } else { 2000 };
            if wait_for_exit(pid_u32, timeout).await {
                success = true;
                break;
            }
        }
    }

    #[cfg(windows)]
    {
        // Use taskkill to terminate tree
        // First a gentle try without /F, then with /F
        for (force, label) in [(false, "taskkill"), (true, "taskkill /F")].iter() {
            let mut cmd = tokio::process::Command::new("taskkill");
            cmd.arg("/PID").arg(pid_u32.to_string()).arg("/T");
            if *force {
                cmd.arg("/F");
            }
            match cmd.output().await {
                Ok(out) => {
                    if out.status.success() {
                        log::info!("{} succeeded for PID {}", label, pid_u32);
                    } else {
                        log::warn!(
                            "{} reported failure: {}",
                            label,
                            String::from_utf8_lossy(&out.stderr)
                        );
                    }
                }
                Err(e) => {
                    log::warn!("Failed to execute {}: {}", label, e);
                    last_error = Some(format!("{} exec failed: {}", label, e));
                }
            }
            let timeout = if *force { 1000 } else { 2000 };
            if wait_for_exit(pid_u32, timeout).await {
                success = true;
                break;
            }
        }
    }

    let result = if success {
        log::info!("Process {} stopped successfully", app_id);
        ProcessResult {
            success: true,
            message: "Process stopped successfully".to_string(),
            pid: Some(pid_u32),
            error: None,
        }
    } else {
        let error_msg = last_error.unwrap_or_else(|| "Failed to stop process within timeout".to_string());
        log::error!("{}", error_msg);
        ProcessResult {
            success: false,
            message: error_msg.clone(),
            pid: Some(pid_u32),
            error: Some(error_msg),
        }
    };

    // Emit process stopped event and append a terminal line
    let _ = app_handle.emit("process-stopped", serde_json::json!({
        "appId": app_id,
        "pid": process_info.pid,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }));

    let _ = app_handle.emit("process-output", serde_json::json!({
        "appId": app_id,
        "type": "stdout",
    "content": "OddLauncher: Process stopped",
        "timestamp": chrono::Utc::now().to_rfc3339()
    }));

    Ok(result)
}

/**
 * Get the status of a process
 */
#[tauri::command]
pub async fn get_process_status(
    app_id: String,
    process_manager: State<'_, ProcessManager>,
) -> Result<Option<AppProcess>, String> {
    let processes = process_manager.processes.lock().unwrap();

    if let Some(process_info) = processes.get(&app_id) {
        Ok(Some(AppProcess {
            app_id: app_id.clone(),
            pid: Some(process_info.pid),
            status: AppStatus::Running,
            started_at: Some(process_info.started_at.clone()),
            error_message: None,
            output: vec![], // Output is streamed via events
            is_background: Some(false),
        }))
    } else {
        Ok(None)
    }
}

/**
 * Get all running processes
 */
#[tauri::command]
pub async fn get_all_process_status(
    process_manager: State<'_, ProcessManager>,
) -> Result<HashMap<String, AppProcess>, String> {
    let processes = process_manager.processes.lock().unwrap();
    let mut result = HashMap::new();

    for (app_id, process_info) in processes.iter() {
        result.insert(app_id.clone(), AppProcess {
            app_id: app_id.clone(),
            pid: Some(process_info.pid),
            status: AppStatus::Running,
            started_at: Some(process_info.started_at.clone()),
            error_message: None,
            output: vec![], // Output is streamed via events
            is_background: Some(false),
        });
    }

    Ok(result)
}

/**
 * Get debug information for troubleshooting process start issues
 */
#[tauri::command]
pub async fn get_debug_info(
    command: String,
    working_directory: Option<String>,
) -> Result<serde_json::Value, String> {
    log::info!("Getting debug info for command: {}", command);

    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Command cannot be empty".to_string());
    }

    let program = parts[0];
    let args: Vec<&str> = parts[1..].to_vec();

    let mut debug_info = serde_json::json!({
        "command": command,
        "program": program,
        "args": args,
        "working_directory": working_directory,
        "system_info": {
            "os": std::env::consts::OS,
            "arch": std::env::consts::ARCH,
            "family": std::env::consts::FAMILY
        }
    });

    // Check if working directory exists
    if let Some(ref dir) = working_directory {
        let path_exists = std::path::Path::new(dir).exists();
        let path_is_dir = std::path::Path::new(dir).is_dir();
        debug_info["working_directory_status"] = serde_json::json!({
            "exists": path_exists,
            "is_directory": path_is_dir
        });
    }

    // Try to find the program in PATH
    let program_in_path = which::which(program).is_ok();
    debug_info["program_status"] = serde_json::json!({
        "found_in_path": program_in_path
    });

    if let Ok(program_path) = which::which(program) {
        debug_info["program_status"]["full_path"] = serde_json::json!(program_path.to_string_lossy());
    }

    // Get environment variables related to PATH
    if let Ok(path_var) = std::env::var("PATH") {
        debug_info["environment"] = serde_json::json!({
            "PATH": path_var
        });
    }

    log::info!("Debug info collected: {}", debug_info);
    Ok(debug_info)
}

/**
 * Kill all running processes (used for cleanup)
 */
#[tauri::command]
pub async fn kill_all_processes(
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Killing all running processes");

    // Get all process info first, then clear the map
    let processes_to_kill = {
        let mut processes = process_manager.processes.lock().unwrap();
        let cloned_processes: Vec<(String, ProcessInfo)> = processes.drain().collect();
        cloned_processes
    };

    let mut killed_count = 0;
    let mut failed_count = 0;

    // Helper to wait for exit (reuse simplified copy)
    async fn wait_for_exit_any(pid: u32, timeout_ms: u64) -> bool {
        #[cfg(unix)]
        {
            use tokio::time::{sleep, Duration, Instant};
            let start = Instant::now();
            loop {
                let exists = unsafe { libc::kill(pid as i32, 0) == 0 };
                if !exists {
                    return true;
                }
                if start.elapsed() > Duration::from_millis(timeout_ms) {
                    return false;
                }
                sleep(Duration::from_millis(100)).await;
            }
        }
        #[cfg(windows)]
        {
            use tokio::time::{sleep, Duration, Instant};
            let start = Instant::now();
            loop {
                let out = tokio::process::Command::new("tasklist")
                    .arg("/FI").arg(format!("PID eq {}", pid))
                    .stdout(Stdio::piped())
                    .stderr(Stdio::null())
                    .output()
                    .await;
                let running = match out {
                    Ok(o) => {
                        let s = String::from_utf8_lossy(&o.stdout);
                        s.contains(&pid.to_string())
                    }
                    Err(_) => false,
                };
                if !running {
                    return true;
                }
                if start.elapsed() > Duration::from_millis(timeout_ms) {
                    return false;
                }
                sleep(Duration::from_millis(100)).await;
            }
        }
    }

    for (app_id, process_info) in processes_to_kill {
        let pid = process_info.pid;
        let mut stopped = false;

        #[cfg(unix)]
        {
            let pgid = process_info.pgid.unwrap_or(pid as i32);
            for (sig, _name) in [(libc::SIGTERM, "SIGTERM"), (libc::SIGKILL, "SIGKILL")].iter() {
                let _ = unsafe { libc::kill(-pgid, *sig) };
                let timeout = if *sig == libc::SIGKILL { 1000 } else { 1500 };
                if wait_for_exit_any(pid, timeout).await {
                    stopped = true;
                    break;
                }
            }
        }

        #[cfg(windows)]
        {
            for force in [false, true] {
                let mut cmd = tokio::process::Command::new("taskkill");
                cmd.arg("/PID").arg(pid.to_string()).arg("/T");
                if force {
                    cmd.arg("/F");
                }
                let _ = cmd.output().await;
                let timeout = if force { 800 } else { 1500 };
                if wait_for_exit_any(pid, timeout).await {
                    stopped = true;
                    break;
                }
            }
        }

        if stopped {
            killed_count += 1;
            log::info!("Killed process for app: {}", app_id);
            let _ = app_handle.emit("process-stopped", serde_json::json!({
                "appId": app_id,
                "pid": pid,
                "timestamp": chrono::Utc::now().to_rfc3339()
            }));
        } else {
            failed_count += 1;
            log::error!("Failed to stop process tree for app {} (pid {})", app_id, pid);
        }
    }

    Ok(ProcessResult {
        success: failed_count == 0,
        message: format!("Killed {} processes, {} failed", killed_count, failed_count),
        pid: None,
        error: if failed_count > 0 { Some(format!("{} processes failed to stop", failed_count)) } else { None },
    })
}
