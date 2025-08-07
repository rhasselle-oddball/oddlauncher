use crate::models::app::{AppProcess, AppStatus};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command as TokioCommand;

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
    fn should_use_wsl(program: &str, working_dir: Option<&str>) -> bool {
        // Check if working directory suggests WSL usage
        let wsl_working_dir = working_dir
            .map(|dir| dir.starts_with("/") || dir.contains("wsl.localhost"))
            .unwrap_or(false);
            
        // Check if program is typically a Unix command
        let unix_commands = ["yarn", "npm", "node", "python", "python3", "pip", "git", "bash", "sh"];
        let is_unix_command = unix_commands.contains(&program);
        
        wsl_working_dir || is_unix_command
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
    command: String,
    working_directory: Option<String>,
    environment_variables: Option<HashMap<String, String>>,
    url: Option<String>,
    auto_launch_browser: Option<bool>,
    browser_delay: Option<u32>,
    port_to_check: Option<u16>,
    port_check_timeout: Option<u32>,
    app_handle: AppHandle,
    process_manager: State<'_, ProcessManager>,
) -> Result<ProcessResult, String> {
    log::info!("Starting process for app: {}", app_id);
    log::info!("Raw command: {}", command);
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

    // Prepare command using cross-platform utilities
    let (program, args) = match platform_utils::prepare_command(&command, normalized_working_dir.as_deref()) {
        Ok((prog, args)) => {
            log::info!("Command prepared - Program: '{}', Args: {:?}", prog, args);
            (prog, args)
        },
        Err(e) => {
            let error_msg = format!("Failed to prepare command: {}", e);
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
            let error_msg = format!("Failed to start process: {} (command: '{}', working_dir: '{:?}')", 
                e, command, working_directory);
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
                    Ok(0) => break, // EOF
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
                    Ok(0) => break, // EOF
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
                log::info!("Process {} exited with status: {}", app_id_monitor, status);

                let _ = app_handle_monitor.emit("process-exit", serde_json::json!({
                    "appId": app_id_monitor,
                    "exitCode": status.code(),
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
            Err(e) => {
                log::error!("Process {} failed: {}", app_id_monitor, e);

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

    // Try to kill the process using system kill command
    let kill_result = tokio::process::Command::new("kill")
        .arg("-TERM")
        .arg(process_info.pid.to_string())
        .output()
        .await;

    let result = match kill_result {
        Ok(output) => {
            if output.status.success() {
                log::info!("Process {} killed successfully", app_id);
                ProcessResult {
                    success: true,
                    message: "Process stopped successfully".to_string(),
                    pid: Some(process_info.pid),
                    error: None,
                }
            } else {
                let error_msg = format!("Failed to kill process: {}", String::from_utf8_lossy(&output.stderr));
                log::error!("{}", error_msg);
                ProcessResult {
                    success: false,
                    message: error_msg.clone(),
                    pid: Some(process_info.pid),
                    error: Some(error_msg),
                }
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to execute kill command: {}", e);
            log::error!("{}", error_msg);
            ProcessResult {
                success: false,
                message: error_msg.clone(),
                pid: Some(process_info.pid),
                error: Some(error_msg),
            }
        }
    };

    // Emit process stopped event
    let _ = app_handle.emit("process-stopped", serde_json::json!({
        "appId": app_id,
        "pid": process_info.pid,
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

    for (app_id, process_info) in processes_to_kill {
        let kill_result = tokio::process::Command::new("kill")
            .arg("-TERM")
            .arg(process_info.pid.to_string())
            .output()
            .await;

        match kill_result {
            Ok(output) if output.status.success() => {
                killed_count += 1;
                log::info!("Killed process for app: {}", app_id);

                let _ = app_handle.emit("process-stopped", serde_json::json!({
                    "appId": app_id,
                    "pid": process_info.pid,
                    "timestamp": chrono::Utc::now().to_rfc3339()
                }));
            }
            Ok(output) => {
                failed_count += 1;
                log::error!("Failed to kill process for app {}: {}", app_id, String::from_utf8_lossy(&output.stderr));
            }
            Err(e) => {
                failed_count += 1;
                log::error!("Failed to execute kill command for app {}: {}", app_id, e);
            }
        }
    }

    Ok(ProcessResult {
        success: failed_count == 0,
        message: format!("Killed {} processes, {} failed", killed_count, failed_count),
        pid: None,
        error: if failed_count > 0 { Some(format!("{} processes failed to stop", failed_count)) } else { None },
    })
}
